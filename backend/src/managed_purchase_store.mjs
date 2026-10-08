import {
  createInitialPlayerMetaState,
  PlayerMetaAuthority,
  validatePlayerMetaState
} from "../../webapp/js/player_meta_state.js";
import {
  PurchaseStoreError,
  buildFulfillment,
  grantCurrencyForKind,
  pendingReceiptFingerprint,
  playerMetaIdentity,
  samePendingPurchase,
  validateDocument,
  validateFulfillment,
  validateRecord,
  transactionKey
} from "./purchase_store.mjs";
import {
  MANAGED_PERSISTENCE_SCHEMA_VERSION,
  createPostgresPool,
  postgresStoreError,
  validateManagedDsn,
  withPostgresTransaction
} from "./postgres_persistence.mjs";

const EMPTY_DOCUMENT = Object.freeze({
  schemaVersion: MANAGED_PERSISTENCE_SCHEMA_VERSION,
  purchases: {},
  transactions: {},
  fulfillments: {},
  playerMeta: {}
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bw_purchase_state (
  singleton boolean PRIMARY KEY DEFAULT true,
  schema_version integer NOT NULL,
  revision bigint NOT NULL,
  state jsonb NOT NULL
)`;

const SCHEMA_SEED_SQL = `
INSERT INTO bw_purchase_state(singleton, schema_version, revision, state)
VALUES (true, ${MANAGED_PERSISTENCE_SCHEMA_VERSION}, 0, $1::jsonb)
ON CONFLICT (singleton) DO NOTHING
`;

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

function readDocument(row) {
  if (!row) throw new PurchaseStoreError("Managed purchase state is not initialized");
  const state = typeof row.state === "string" ? JSON.parse(row.state) : clone(row.state);
  if (Number(row.schema_version) !== MANAGED_PERSISTENCE_SCHEMA_VERSION) {
    throw new PurchaseStoreError("Unsupported purchase persistence schema version");
  }
  validateDocument(state);
  return {
    revision: Number(row.revision),
    state
  };
}

export class ManagedPurchaseStore {
  constructor({ dsn, pool = null } = {}) {
    this.dsn = validateManagedDsn(dsn);
    this.pool = createPostgresPool({ dsn: this.dsn, pool });
    this.isDurable = true;
    this.isOperational = false;
  }

  async initialize() {
    try {
      await this.pool.query("SELECT 1");
      await this.pool.query(SCHEMA_SQL);
      await this.pool.query(SCHEMA_SEED_SQL, [JSON.stringify(EMPTY_DOCUMENT)]);
      const result = await this.pool.query(
        "SELECT schema_version FROM bw_purchase_state WHERE singleton=true"
      );
      if (Number(result.rows[0]?.schema_version) !== MANAGED_PERSISTENCE_SCHEMA_VERSION) {
        throw new Error("Unsupported managed purchase persistence schema version");
      }
      this.isOperational = true;
      return true;
    } catch (error) {
      this.isOperational = false;
      throw postgresStoreError("Managed purchase persistence initialization failed", error);
    }
  }

  async close() {
    if (typeof this.pool.end === "function") await this.pool.end();
    this.isOperational = false;
  }

  async _loadDocument() {
    try {
      const result = await this.pool.query(
        "SELECT schema_version, revision, state FROM bw_purchase_state WHERE singleton=true"
      );
      return readDocument(result.rows[0]);
    } catch (error) {
      if (error instanceof PurchaseStoreError) throw error;
      throw postgresStoreError("Managed purchase state load failed", error);
    }
  }

  async loadPurchase(purchaseId) {
    const id = stableId(purchaseId, "purchaseId");
    const { state } = await this._loadDocument();
    return state.purchases[id] ? clone(state.purchases[id]) : null;
  }

  async loadByTransaction(provider, providerTransactionId) {
    const key = transactionKey(provider, providerTransactionId);
    const { state } = await this._loadDocument();
    const purchaseId = state.transactions[key];
    return purchaseId ? clone(state.purchases[purchaseId]) : null;
  }

  async _mutate(mutator) {
    try {
      return await withPostgresTransaction(this.pool, async (client) => {
        const result = await client.query(
          "SELECT schema_version, revision, state FROM bw_purchase_state WHERE singleton=true FOR UPDATE"
        );
        const document = readDocument(result.rows[0]);
        const output = await mutator(document.state);
        validateDocument(document.state);
        await client.query(
          "UPDATE bw_purchase_state SET revision=revision+1, state=$1::jsonb WHERE singleton=true",
          [JSON.stringify(document.state)]
        );
        return output;
      });
    } catch (error) {
      if (error instanceof PurchaseStoreError) throw error;
      throw postgresStoreError("Managed purchase persistence mutation failed", error);
    }
  }

  async _insert(record, authorizationStatus) {
    const purchaseId = stableId(record?.purchaseId, "purchaseId");
    const effectiveTransactionId = authorizationStatus === "PENDING"
      ? String(record?.providerTransactionId || "pending:" + purchaseId)
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

    return this._mutate((state) => {
      if (state.purchases[purchaseId]) {
        return { created: false, record: clone(state.purchases[purchaseId]) };
      }
      if (state.transactions[key]) {
        return { created: false, record: clone(state.purchases[state.transactions[key]]) };
      }
      state.purchases[purchaseId] = next;
      state.transactions[key] = purchaseId;
      return { created: true, record: clone(next) };
    });
  }

  async savePurchase(record) {
    return this._insert(record, "AUTHORIZED");
  }

  async createPendingPurchase(record) {
    return this._insert(record, "PENDING");
  }

  async setInvoiceForPurchase(purchaseId, invoiceUrl, invoicePayload) {
    const id = stableId(purchaseId, "purchaseId");
    const url = String(invoiceUrl || "").trim();
    const payload = String(invoicePayload || "").trim();
    if (!/^https:///.test(url)) throw new TypeError("Invalid invoice URL");
    if (!payload) throw new TypeError("Invoice payload is required");

    return this._mutate((state) => {
      const existing = state.purchases[id];
      if (!existing) return { status: "NOT_FOUND" };
      if (existing.authorizationStatus !== "PENDING") {
        return { status: "NOT_PENDING", record: clone(existing) };
      }
      if (existing.invoiceUrl && existing.invoiceUrl !== url) {
        return { status: "CONFLICT", record: clone(existing) };
      }
      const next = { ...existing, invoiceUrl: existing.invoiceUrl || url, invoicePayload: existing.invoicePayload || payload };
      validateRecord(next);
      state.purchases[id] = next;
      return { status: "UPDATED", record: clone(next) };
    });
  }

  async authorizePendingPurchase(record) {
    const id = stableId(record?.purchaseId, "purchaseId");
    const key = transactionKey(record?.provider, record?.providerTransactionId);

    return this._mutate((state) => {
      const existing = state.purchases[id];
      if (!existing) return { updated: false, status: "NOT_FOUND" };
      if (!samePendingPurchase(existing, record)) {
        return { updated: false, status: "CONFLICT", record: clone(existing) };
      }
      if (existing.authorizationStatus !== "PENDING") {
        return { updated: false, status: "ALREADY_AUTHORIZED", record: clone(existing) };
      }
      const transactionOwner = state.transactions[key];
      if (transactionOwner && transactionOwner !== id) {
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
      delete state.transactions[existing.transactionKey];
      state.transactions[key] = id;
      state.purchases[id] = next;
      return { updated: true, status: "AUTHORIZED_GRANT", record: clone(next) };
    });
  }

  async claimPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");
    return this._mutate((state) => {
      const record = state.purchases[id];
      if (!record || record.playerId !== owner || record.authorizationStatus !== "AUTHORIZED") {
        return { status: "NOT_FOUND" };
      }
      if (record.claimStatus === "GRANT_CLAIMED") {
        return { status: "GRANT_ALREADY_CLAIMED", record: clone(record) };
      }
      const next = { ...record, claimStatus: "GRANT_CLAIMED" };
      validateRecord(next);
      state.purchases[id] = next;
      return { status: "GRANT_CLAIMED", record: clone(next) };
    });
  }

  async loadPlayerMeta(playerId) {
    const owner = stableId(playerId, "playerId");
    const { state } = await this._loadDocument();
    return state.playerMeta[owner]
      ? clone(state.playerMeta[owner])
      : createInitialPlayerMetaState(playerMetaIdentity(owner));
  }

  async applyPurchaseGrant(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");

    return this._mutate((state) => {
      const record = state.purchases[id];
      if (!record || record.playerId !== owner) return { status: "NOT_FOUND" };
      if (record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_AUTHORIZED" };
      if (record.claimStatus !== "GRANT_CLAIMED") return { status: "CLAIM_REQUIRED" };

      const fulfillmentId = "purchase-grant:" + id;
      const existing = state.fulfillments[fulfillmentId];
      if (existing) return { status: "GRANT_ALREADY_APPLIED", record: clone(existing) };

      const currency = grantCurrencyForKind(record.grantKind);
      const authority = new PlayerMetaAuthority(
        state.playerMeta[owner]
          ? clone(state.playerMeta[owner])
          : createInitialPlayerMetaState(playerMetaIdentity(owner))
      );
      const transaction = authority.dispatchBatch([
        { type: "ADD_CURRENCY", currency, amount: record.grantAmount },
        { type: "RECORD_REWARD", sourceEventId: fulfillmentId }
      ]);
      if (!transaction.ok) throw new PurchaseStoreError(transaction.reason || "PLAYER_META_GRANT_REJECTED");

      const fulfillment = buildFulfillment(record, fulfillmentId);
      validatePlayerMetaState(transaction.snapshot);
      validateFulfillment(fulfillment);
      state.playerMeta[owner] = transaction.snapshot;
      state.fulfillments[fulfillmentId] = fulfillment;
      return {
        status: "GRANT_APPLIED",
        record: clone(fulfillment),
        playerMeta: clone(transaction.snapshot)
      };
    });
  }

  async fulfillPurchase(purchaseId, playerId) {
    const id = stableId(purchaseId, "purchaseId");
    const owner = stableId(playerId, "playerId");

    return this._mutate((state) => {
      const record = state.purchases[id];
      if (!record || record.playerId !== owner) return { status: "NOT_FOUND" };
      const fulfillmentId = "purchase-grant:" + id;
      const existing = state.fulfillments[fulfillmentId];
      if (existing) return { status: "GRANT_ALREADY_FULFILLED", record: clone(existing) };
      if (record.authorizationStatus !== "AUTHORIZED") return { status: "NOT_AUTHORIZED" };
      if (record.claimStatus !== "GRANT_CLAIMED") return { status: "CLAIM_REQUIRED" };

      const fulfillment = buildFulfillment(record, fulfillmentId);
      validateFulfillment(fulfillment);
      state.fulfillments[fulfillmentId] = fulfillment;
      return { status: "GRANT_FULFILLED", record: clone(fulfillment) };
    });
  }
}
