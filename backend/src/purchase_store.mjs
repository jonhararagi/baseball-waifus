import fs from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";

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

function normalizeAuthorizationStatus(value) {
  const status = String(value || "AUTHORIZED").toUpperCase();
  if (status !== "PENDING" && status !== "AUTHORIZED") {
    throw new TypeError("Invalid purchase authorizationStatus");
  }
  return status;
}

function pendingTransactionId(purchaseId) {
  return "pending:" + stableId(purchaseId, "purchaseId");
}

function pendingReceiptFingerprint(purchaseId) {
  return requireSha256(pendingTransactionId(purchaseId));
}

function requireSha256(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
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
  normalizeAuthorizationStatus(record.authorizationStatus);
  if (record.claimStatus !== "UNCLAIMED" && record.claimStatus !== "GRANT_CLAIMED") {
    throw new TypeError("Invalid purchase claimStatus");
  }
  if (record.invoiceUrl !== undefined && (!/^https:\/\//.test(String(record.invoiceUrl)) || String(record.invoiceUrl).length > 2048)) {
    throw new TypeError("Invalid invoice URL");
  }
  if (record.invoicePayload !== undefined && (typeof record.invoicePayload !== "string" || record.invoicePayload.length > 256)) {
    throw new TypeError("Invalid invoice payload");
  }
  if (record.authorizationStatus === "PENDING" && record.claimStatus === "GRANT_CLAIMED") {
    throw new TypeError("Pending purchase cannot be already claimed");
  }
  return true;
}

function emptyDocument() {
  return { schemaVersion: SCHEMA_VERSION, purchases: {}, transactions: {} };
}

function normalizePersistedRecord(record) {
  return {
    ...record,
    authorizationStatus: normalizeAuthorizationStatus(record.authorizationStatus),
    claimStatus: record.claimStatus || "UNCLAIMED"
  };
}

function validateFulfillment(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("Invalid fulfillment record");
  for (const [key, label] of [
    ["fulfillmentId", "fulfillmentId"],
    ["purchaseId", "purchaseId"],
    ["playerId", "playerId"],
    ["productId", "productId"],
    ["grantKind", "grantKind"],
    ["provider", "provider"],
    ["providerTransactionId", "providerTransactionId"],
    ["status", "status"],
    ["createdAt", "createdAt"],
    ["fulfilledAt", "fulfilledAt"]
  ]) stableId(record[key], label);
  if (!["GRANT_FULFILLED"].includes(record.status)) throw new TypeError("Invalid fulfillment status");
  if (!Number.isFinite(record.grantAmount) || record.grantAmount < 0) throw new TypeError("Invalid fulfillment grant amount");
  stableId(record.currency, "currency");
  return true;
}

function emptyDocument() {
  return { schemaVersion: SCHEMA_VERSION, purchases: {}, transactions: {}, fulfillments: {} };
}

function validateDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) throw new TypeError("Invalid purchase persistence document");
  if (document.schemaVersion !== SCHEMA_VERSION) throw new TypeError("Unsupported purchase persistence schemaVersion");
  if (!document.purchases || typeof document.purchases !== "object" || Array.isArray(document.purchases)) throw new TypeError("Invalid purchases collection");
  if (!document.transactions || typeof document.transactions !== "object" || Array.isArray(document.transactions)) throw new TypeError("Invalid transactions collection");
  if (document.fulfillments === undefined) document.fulfillments = {};
  if (!document.fulfillments || typeof document.fulfillments !== "object" || Array.isArray(document.fulfillments)) throw new TypeError("Invalid fulfillments collection");
  for (const [purchaseId, record] of Object.entries(document.purchases)) {
    if (stableId(purchaseId, "purchaseId") !== purchaseId) throw new TypeError("Invalid purchase key");
    const normalizedRecord = normalizePersistedRecord(record);
    validateRecord(normalizedRecord);
    if (normalizedRecord.purchaseId !== purchaseId) throw new TypeError("Purchase identity mismatch");
    document.purchases[purchaseId] = normalizedRecord;
  }
  for (const [key, purchaseId] of Object.entries(document.transactions)) {
    if (stableId(key, "transactionKey") !== key) throw new TypeError("Invalid transaction key");
    stableId(purchaseId, "purchaseId");
    if (!document.purchases[purchaseId]) throw new TypeError("Transaction points to missing purchase");
  }
  for (const [fulfillmentId, fulfillment] of Object.entries(document.fulfillments)) {
    if (stableId(fulfillmentId, "fulfillmentId") !== fulfillmentId) throw new TypeError("Invalid fulfillment key");
    validateFulfillment(fulfillment);
    if (fulfillment.fulfillmentId !== fulfillmentId) throw new TypeError("Fulfillment identity mismatch");
    if (!document.purchases[fulfillment.purchaseId]) throw new TypeError("Fulfillment points to missing purchase");
    if (fulfillment.status !== "GRANT_FULFILLED") throw new TypeError("Unsupported fulfillment status");
  }
  return true;
}

function comparablePurchase(record, { includePaymentIdentity = true } = {}) {
  const base = {
    purchaseId: record.purchaseId,
    playerId: record.playerId,
    productId: record.productId,
    amount: record.amount,
    currency: record.currency,
    provider: record.provider,
    grantKind: record.grantKind,
    grantAmount: record.grantAmount
  };
  if (includePaymentIdentity) {
    base.providerTransactionId = record.providerTransactionId;
    base.receiptFingerprint = record.receiptFingerprint;
  }
  return base;
}

function samePurchase(a, b) {
  return Boolean(a && b && JSON.stringify(comparablePurchase(a)) === JSON.stringify(comparablePurchase(b)));
}

function samePendingPurchase(a, b) {
  return Boolean(
    a && b
    && JSON.stringify(comparablePurchase(a, { includePaymentIdentity: false }))
      === JSON.stringify(comparablePurchase(b, { includePaymentIdentity: false }))
  );
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
    this.fulfillments = new Map();
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

  _insert(record, authorizationStatus = "AUTHORIZED") {
    const purchaseId = stableId(record?.purchaseId, "purchaseId");
    const effectiveTransactionId = authorizationStatus === "PENDING"
      ? String(record?.providerTransactionId || pendingTransactionId(purchaseId))
      : stableId(record?.providerTransactionId, "providerTransactionId");
    const key = transactionKey(record?.provider, effectiveTransactionId);
    const next = clone({
      ...record,
      providerTransactionId: effectiveTransactionId,
      receiptFingerprint: record?.receiptFingerprint || pendingReceiptFingerprint(purchaseId),
      transactionKey: key,
      authorizationStatus,
      claimStatus: record.claimStatus || "UNCLAIMED"
    });
    validateRecord(next);
    const existingPurchase = this.purchases.get(purchaseId);
    if (existingPurchase) return { created: false, record: clone(existingPurchase) };
    const existingByTransaction = this.transactions.get(key);
    if (existingByTransaction) return { created: false, record: clone(this.purchases.get(existingByTransaction)) };
    this.purchases.set(purchaseId, next);
    this.transactions.set(key, purchaseId);
    return { created: true, record: clone(next) };
  }

  savePurchase(record) {
    return this._insert(record, "AUTHORIZED");
  }

  setInvoiceForPurchase(purchaseId, invoiceUrl, invoicePayload) {
    const id = stableId(purchaseId, "purchaseId");
    const url = String(invoiceUrl || "").trim();
    const payload = String(invoicePayload || "").trim();
    if (!/^https:\/\//.test(url)) throw new TypeError("Invalid invoice URL");
    if (!payload) throw new TypeError("Invoice payload is required");

    const existing = this.purchases.get(id);
    if (!existing) return { status: "NOT_FOUND" };
    if (existing.authorizationStatus !== "PENDING") return { status: "NOT_PENDING", record: clone(existing) };
    if (existing.invoiceUrl && existing.invoiceUrl !== url) return { status: "CONFLICT", record: clone(existing) };

    const next = clone({
      ...existing,
      invoiceUrl: existing.invoiceUrl || url,
      invoicePayload: existing.invoicePayload || payload
    });
    validateRecord(next);
    this.purchases.set(id, next);
    return { status: "UPDATED", record: clone(next) };
  }

  createPendingPurchase(record) {
    return this._insert(record, "PENDING");
  }

  authorizePendingPurchase(record) {
    const id = stableId(record?.purchaseId, "purchaseId");
    const key = transactionKey(record?.provider, record?.providerTransactionId);
    const existing = this.purchases.get(id);
    if (!existing) return { updated: false, status: "NOT_FOUND" };
    if (!samePendingPurchase(existing, record)) return { updated: false, status: "CONFLICT", record: clone(existing) };
    if (existing.authorizationStatus !== "PENDING") return { updated: false, status: "ALREADY_AUTHORIZED", record: clone(existing) };

    const existingTransactionOwner = this.transactions.get(key);
    if (existingTransactionOwner && existingTransactionOwner !== id) {
      return { updated: false, status: "CONFLICT", record: clone(existing) };
    }

    const next = clone({
      ...existing,
      providerTransactionId: stableId(record.providerTransactionId, "providerTransactionId"),
      receiptFingerprint: record.receiptFingerprint,
      transactionKey: key,
      authorizationStatus: "AUTHORIZED"
    });
    validateRecord(next);
    this.purchases.set(id, next);
    const pendingKey = existing.transactionKey;
    if (pendingKey !== key) this.transactions.delete(pendingKey);
    this.transactions.set(key, id);
    return { updated: true, status: "AUTHORIZED_GRANT", record: clone(next) };
  }

  claimPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");
    const record = this.purchases.get(id);
    if (!record || record.playerId !== owner || record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_FOUND" };
    if (record.claimStatus === "GRANT_CLAIMED") return { status: "GRANT_ALREADY_CLAIMED", record: clone(record) };
    record.claimStatus = "GRANT_CLAIMED";
    return { status: "GRANT_CLAIMED", record: clone(record) };
  }

  fulfillPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");
    const record = this.purchases.get(id);
    if (!record || record.playerId !== owner) return { status: "NOT_FOUND" };
    const fulfillmentId = "purchase-grant:" + id;
    const existing = this.fulfillments.get(fulfillmentId);
    if (existing) return { status: "GRANT_ALREADY_FULFILLED", record: clone(existing) };
    if (record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_AUTHORIZED" };
    if (record.claimStatus !== "GRANT_CLAIMED") return { status: "CLAIM_REQUIRED" };

    const fulfillment = {
      fulfillmentId,
      purchaseId: record.purchaseId,
      playerId: record.playerId,
      productId: record.productId,
      grantKind: record.grantKind,
      grantAmount: record.grantAmount,
      currency: record.currency,
      provider: record.provider,
      providerTransactionId: record.providerTransactionId,
      status: "GRANT_FULFILLED",
      createdAt: new Date().toISOString(),
      fulfilledAt: new Date().toISOString()
    };
    validateFulfillment(fulfillment);
    this.fulfillments.set(fulfillmentId, clone(fulfillment));
    return { status: "GRANT_FULFILLED", record: clone(fulfillment) };
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
    catch (error) {
      if (error?.code === "ENOENT") return emptyDocument();
      throw new PurchaseStoreError("Unable to read purchase state", error);
    }
    if (!raw) throw new PurchaseStoreError("Purchase state is empty");
    let document;
    try { document = JSON.parse(raw); }
    catch (error) { throw new PurchaseStoreError("Purchase state is corrupted", error); }
    try { validateDocument(document); }
    catch (error) { throw new PurchaseStoreError("Purchase state failed validation", error); }
    return document;
  }

  _writeDocument(document) {
    try { validateDocument(document); }
    catch (error) { throw new PurchaseStoreError("Refusing to persist invalid purchase state", error); }
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

  _insert(record, authorizationStatus = "AUTHORIZED") {
    const purchaseId = stableId(record?.purchaseId, "purchaseId");
    const effectiveTransactionId = authorizationStatus === "PENDING"
      ? String(record?.providerTransactionId || pendingTransactionId(purchaseId))
      : stableId(record?.providerTransactionId, "providerTransactionId");
    const key = transactionKey(record?.provider, effectiveTransactionId);
    const next = clone({
      ...record,
      providerTransactionId: effectiveTransactionId,
      receiptFingerprint: record?.receiptFingerprint || pendingReceiptFingerprint(purchaseId),
      transactionKey: key,
      authorizationStatus,
      claimStatus: record.claimStatus || "UNCLAIMED"
    });
    validateRecord(next);
    const document = this._readDocument();
    if (document.purchases[purchaseId]) return { created: false, record: clone(document.purchases[purchaseId]) };
    if (document.transactions[key]) return { created: false, record: clone(document.purchases[document.transactions[key]]) };
    document.purchases[purchaseId] = next;
    document.transactions[key] = purchaseId;
    this._writeDocument(document);
    return { created: true, record: clone(next) };
  }

  savePurchase(record) {
    return this._insert(record, "AUTHORIZED");
  }

  createPendingPurchase(record) {
    return this._insert(record, "PENDING");
  }

  setInvoiceForPurchase(purchaseId, invoiceUrl, invoicePayload) {
    const id = stableId(purchaseId, "purchaseId");
    const url = String(invoiceUrl || "").trim();
    const payload = String(invoicePayload || "").trim();
    if (!/^https:\/\//.test(url)) throw new TypeError("Invalid invoice URL");
    if (!payload) throw new TypeError("Invoice payload is required");

    const document = this._readDocument();
    const existing = document.purchases[id];
    if (!existing) return { status: "NOT_FOUND" };
    if (existing.authorizationStatus !== "PENDING") return { status: "NOT_PENDING", record: clone(existing) };
    if (existing.invoiceUrl && existing.invoiceUrl !== url) return { status: "CONFLICT", record: clone(existing) };

    const next = {
      ...existing,
      invoiceUrl: existing.invoiceUrl || url,
      invoicePayload: existing.invoicePayload || payload
    };
    validateRecord(next);
    document.purchases[id] = next;
    this._writeDocument(document);
    return { status: "UPDATED", record: clone(next) };
  }

  authorizePendingPurchase(record) {
    const id = stableId(record?.purchaseId, "purchaseId");
    const key = transactionKey(record?.provider, record?.providerTransactionId);
    const document = this._readDocument();
    const existing = document.purchases[id];
    if (!existing) return { updated: false, status: "NOT_FOUND" };
    if (!samePendingPurchase(existing, record)) return { updated: false, status: "CONFLICT", record: clone(existing) };
    if (existing.authorizationStatus !== "PENDING") return { updated: false, status: "ALREADY_AUTHORIZED", record: clone(existing) };

    const existingTransactionOwner = document.transactions[key];
    if (existingTransactionOwner && existingTransactionOwner !== id) {
      return { updated: false, status: "CONFLICT", record: clone(existing) };
    }

    const next = {
      ...existing,
      providerTransactionId: stableId(record.providerTransactionId, "providerTransactionId"),
      receiptFingerprint: record.receiptFingerprint,
      transactionKey: key,
      authorizationStatus: "AUTHORIZED"
    };
    validateRecord(next);
    document.purchases[id] = next;
    const pendingKey = existing.transactionKey;
    if (pendingKey !== key) delete document.transactions[pendingKey];
    document.transactions[key] = id;
    this._writeDocument(document);
    return { updated: true, status: "AUTHORIZED_GRANT", record: clone(next) };
  }

  claimPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");
    const document = this._readDocument();
    const record = document.purchases[id];
    if (!record || record.playerId !== owner || record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_FOUND" };
    if (record.claimStatus === "GRANT_CLAIMED") return { status: "GRANT_ALREADY_CLAIMED", record: clone(record) };
    record.claimStatus = "GRANT_CLAIMED";
    this._writeDocument(document);
    return { status: "GRANT_CLAIMED", record: clone(record) };
  }

  fulfillPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");
    const document = this._readDocument();
    const record = document.purchases[id];
    if (!record || record.playerId !== owner) return { status: "NOT_FOUND" };

    const fulfillmentId = "purchase-grant:" + id;
    const existing = document.fulfillments[fulfillmentId];
    if (existing) return { status: "GRANT_ALREADY_FULFILLED", record: clone(existing) };
    if (record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_AUTHORIZED" };
    if (record.claimStatus !== "GRANT_CLAIMED") return { status: "CLAIM_REQUIRED" };

    const now = new Date().toISOString();
    const fulfillment = {
      fulfillmentId,
      purchaseId: record.purchaseId,
      playerId: record.playerId,
      productId: record.productId,
      grantKind: record.grantKind,
      grantAmount: record.grantAmount,
      currency: record.currency,
      provider: record.provider,
      providerTransactionId: record.providerTransactionId,
      status: "GRANT_FULFILLED",
      createdAt: now,
      fulfilledAt: now
    };
    validateFulfillment(fulfillment);
    document.fulfillments[fulfillmentId] = fulfillment;
    this._writeDocument(document);
    return { status: "GRANT_FULFILLED", record: clone(fulfillment) };
  }
}
