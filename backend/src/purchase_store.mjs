import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableId(value, label = "id") {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 256) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
  return id;
}

function transactionKey(provider, transactionId) {
  return stableId(`${provider}:${transactionId}`, "transactionKey");
}

function validateRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("Invalid purchase record");
  for (const [key, label] of [
    ["purchaseId", "purchaseId"],
    ["playerId", "playerId"],
    ["productId", "productId"],
    ["currency", "currency"],
    ["provider", "provider"],
    ["providerTransactionId", "providerTransactionId"],
    ["grantKind", "grantKind"]
  ]) stableId(record[key], label);
  if (!Number.isFinite(record.amount) || record.amount < 0) throw new TypeError("Invalid purchase amount");
  if (!Number.isFinite(record.grantAmount) || record.grantAmount < 0) throw new TypeError("Invalid grant amount");
  stableId(record.transactionKey, "transactionKey");
  if (typeof record.receiptFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(record.receiptFingerprint)) {
    throw new TypeError("Invalid receipt fingerprint");
  }
  return true;
}

function emptyDocument() {
  return { schemaVersion: SCHEMA_VERSION, purchases: {}, transactions: {} };
}

function validateDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) throw new TypeError("Invalid purchase persistence document");
  if (document.schemaVersion !== SCHEMA_VERSION) throw new TypeError("Unsupported purchase persistence schemaVersion");
  if (!document.purchases || typeof document.purchases !== "object" || Array.isArray(document.purchases)) throw new TypeError("Invalid purchases collection");
  if (!document.transactions || typeof document.transactions !== "object" || Array.isArray(document.transactions)) throw new TypeError("Invalid transactions collection");
  for (const [purchaseId, record] of Object.entries(document.purchases)) {
    if (stableId(purchaseId, "purchaseId") !== purchaseId) throw new TypeError("Invalid purchase key");
    validateRecord(record);
    if (record.purchaseId !== purchaseId) throw new TypeError("Purchase identity mismatch");
  }
  for (const [key, purchaseId] of Object.entries(document.transactions)) {
    if (stableId(key, "transactionKey") !== key) throw new TypeError("Invalid transaction key");
    stableId(purchaseId, "purchaseId");
    if (!document.purchases[purchaseId]) throw new TypeError("Transaction points to missing purchase");
  }
  return true;
}

export class PurchaseStoreError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = "PurchaseStoreError";
    this.cause = cause;
  }
}

export class InMemoryPurchaseStore {
  constructor() {
    this.purchases = new Map();
    this.transactions = new Map();
    this.isDurable = false;
  }

  loadPurchase(purchaseId) {
    const record = this.purchases.get(stableId(purchaseId, "purchaseId"));
    return record ? clone(record) : null;
  }

  loadByTransaction(provider, providerTransactionId) {
    const key = transactionKey(provider, providerTransactionId);
    const purchaseId = this.transactions.get(key);
    return purchaseId ? this.loadPurchase(purchaseId) : null;
  }

  savePurchase(record) {
    const purchaseId = stableId(record?.purchaseId, "purchaseId");
    const key = transactionKey(record?.provider, record?.providerTransactionId);
    const next = clone({ ...record, transactionKey: key });
    validateRecord(next);
    const existingPurchase = this.purchases.get(purchaseId);
    if (existingPurchase) return { created: false, record: clone(existingPurchase) };
    const existingByTransaction = this.transactions.get(key);
    if (existingByTransaction) {
      return { created: false, record: clone(this.purchases.get(existingByTransaction)) };
    }
    this.purchases.set(purchaseId, next);
    this.transactions.set(key, purchaseId);
    return { created: true, record: clone(next) };
  }
}

export class PersistentPurchaseStore {
  constructor({ filePath } = {}) {
    if (typeof filePath !== "string" || filePath.trim() === "") throw new TypeError("PersistentPurchaseStore requires a filePath");
    this.filePath = path.resolve(filePath);
    this.isDurable = true;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  _readDocument() {
    let raw;
    try { raw = fs.readFileSync(this.filePath, "utf8"); }
    catch (error) { if (error?.code === "ENOENT") return emptyDocument(); throw new PurchaseStoreError("Unable to read purchase state", error); }
    if (!raw) throw new PurchaseStoreError("Purchase state is empty");
    let document;
    try { document = JSON.parse(raw); } catch (error) { throw new PurchaseStoreError("Purchase state is corrupted", error); }
    try { validateDocument(document); } catch (error) { throw new PurchaseStoreError("Purchase state failed validation", error); }
    return document;
  }

  _writeDocument(document) {
    try { validateDocument(document); } catch (error) { throw new PurchaseStoreError("Refusing to persist invalid purchase state", error); }
    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    let descriptor = null;
    try {
      descriptor = fs.openSync(temporaryPath, "wx", 0o600);
      fs.writeFileSync(descriptor, JSON.stringify(document), "utf8");
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = null;
      fs.renameSync(temporaryPath, this.filePath);
      try {
        const directoryDescriptor = fs.openSync(directory, "r");
        try { fs.fsyncSync(directoryDescriptor); } finally { fs.closeSync(directoryDescriptor); }
      } catch {}
    } catch (error) {
      if (descriptor !== null) { try { fs.closeSync(descriptor); } catch {} }
      try { fs.rmSync(temporaryPath, { force: true }); } catch {}
      throw new PurchaseStoreError("Atomic purchase persistence write failed", error);
    }
  }

  loadPurchase(purchaseId) {
    const id = stableId(purchaseId, "purchaseId");
    const document = this._readDocument();
    return document.purchases[id] ? clone(document.purchases[id]) : null;
  }

  loadByTransaction(provider, providerTransactionId) {
    const key = transactionKey(provider, providerTransactionId);
    const document = this._readDocument();
    const purchaseId = document.transactions[key];
    return purchaseId ? clone(document.purchases[purchaseId]) : null;
  }

  savePurchase(record) {
    const purchaseId = stableId(record?.purchaseId, "purchaseId");
    const key = transactionKey(record?.provider, record?.providerTransactionId);
    const next = clone({ ...record, transactionKey: key });
    validateRecord(next);
    const document = this._readDocument();
    if (document.purchases[purchaseId]) return { created: false, record: clone(document.purchases[purchaseId]) };
    if (document.transactions[key]) return { created: false, record: clone(document.purchases[document.transactions[key]]) };
    document.purchases[purchaseId] = next;
    document.transactions[key] = purchaseId;
    this._writeDocument(document);
    return { created: true, record: clone(next) };
  }
}