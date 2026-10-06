import { createHash, randomUUID } from "node:crypto";
import { AuthorityError } from "./errors.mjs";
import { getTelegramStarsProduct } from "./telegram_stars_product_catalog.mjs";
import { PURCHASE_PROVIDER_VERIFICATION } from "./purchase_provider_verifier.mjs";

export const PURCHASE_AUTHORITY_RESULT = Object.freeze({
  PENDING: "PENDING",
  AUTHORIZED_GRANT: "AUTHORIZED_GRANT",
  BLOCKED: "BLOCKED",
  REJECTED: "REJECTED",
  UNAVAILABLE: "UNAVAILABLE",
  DUPLICATE_NO_OP: "DUPLICATE_NO_OP",
  GRANT_CLAIMED: "GRANT_CLAIMED",
  GRANT_ALREADY_CLAIMED: "GRANT_ALREADY_CLAIMED"
});

function stableId(value, label) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 256) {
    throw new AuthorityError(400, "INVALID_PURCHASE", `${label} must be a stable identifier`);
  }
  return id;
}

function normalizeAmount(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AuthorityError(400, "INVALID_PURCHASE", `${label} must be a non-negative number`);
  }
  return amount;
}

function normalizeRequest(playerId, purchaseId, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AuthorityError(400, "INVALID_PURCHASE", "Purchase request body is required");
  }
  if (Object.prototype.hasOwnProperty.call(body, "authorized")) {
    throw new AuthorityError(400, "CLIENT_AUTHORITY_FORBIDDEN", "Client authority fields are not accepted");
  }
  for (const forbidden of ["grant_kind", "grant_amount", "grant_turns", "paid", "reward", "status", "authorized", "verified", "successful_payment"]) {
    if (Object.prototype.hasOwnProperty.call(body, forbidden)) {
      throw new AuthorityError(400, "CLIENT_AUTHORITY_FORBIDDEN", `Client economic authority field is not accepted: ${forbidden}`);
    }
  }
  const productId = stableId(body.product_id, "product_id");
  const transactionId = stableId(body.transaction_id, "transaction_id");
  const provider = stableId(body.provider, "provider");
  const currency = stableId(body.currency, "currency");
  const receipt = String(body.receipt || "").trim();
  if (!receipt) throw new AuthorityError(400, "RECEIPT_REQUIRED", "Provider receipt is required");
  return Object.freeze({
    purchaseId: stableId(purchaseId, "purchase_id"),
    playerId: stableId(playerId, "player_id"),
    productId,
    amount: normalizeAmount(body.amount, "amount"),
    currency,
    provider,
    transactionId,
    receipt
  });
}

function receiptFingerprint(receipt) {
  return createHash("sha256").update(String(receipt), "utf8").digest("hex");
}

function validateFingerprint(value) {
  const fingerprint = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new AuthorityError(400, "INVALID_PURCHASE", "receiptFingerprint must be a SHA-256 hexadecimal fingerprint");
  }
  return fingerprint;
}

function samePurchase(a, b) {
  return Boolean(a && b &&
    a.playerId === b.playerId &&
    a.productId === b.productId &&
    a.amount === b.amount &&
    a.currency === b.currency &&
    a.provider === b.provider &&
    a.providerTransactionId === b.providerTransactionId &&
    a.receiptFingerprint === b.receiptFingerprint &&
    a.grantKind === b.grantKind &&
    a.grantAmount === b.grantAmount);
}

function resultFromRecord(status, record) {
  return {
    status,
    purchase_id: record.purchaseId,
    player_id: record.playerId,
    product_id: record.productId,
    amount: record.amount,
    grant_kind: record.grantKind,
    grant_amount: record.grantAmount,
    currency: record.currency,
    provider: record.provider,
    provider_transaction_id: status === PURCHASE_AUTHORITY_RESULT.PENDING ? null : record.providerTransactionId
  };
}

export class PurchaseAuthority {
  constructor({ store, providerVerifier = null, production = false } = {}) {
    if (!store) throw new TypeError("PurchaseAuthority requires a purchase store");
    this.store = store;
    this.providerVerifier = providerVerifier;
    this.production = Boolean(production);
  }

  createPending({ playerId, body = {}, idempotencyKey = "" } = {}) {
    const ownerId = stableId(playerId, "player_id");
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AuthorityError(400, "INVALID_PURCHASE_REQUEST", "Purchase request body must be a JSON object");
    }

    const forbidden = [
      "purchase_id", "purchaseId", "player_id", "playerId", "telegram_user_id",
      "telegramUserId", "amount", "currency", "grant_kind", "grant_amount",
      "provider", "transaction_id", "transactionId", "receipt", "transaction",
      "status", "claim_status", "authorized", "verified", "successful_payment"
    ];
    const injected = forbidden.find((key) => Object.prototype.hasOwnProperty.call(body, key));
    if (injected) {
      throw new AuthorityError(400, "CLIENT_AUTHORITY_FORBIDDEN", `Client purchase authority field is not accepted: ${injected}`);
    }

    const productId = stableId(body.product_id, "product_id");
    const product = getTelegramStarsProduct(productId);
    if (!product) {
      throw new AuthorityError(404, "UNKNOWN_PRODUCT", "Product is not available for Telegram Stars");
    }

    const key = String(idempotencyKey || "").trim();
    if (key && (!/^[A-Za-z0-9._:-]+$/.test(key) || key.length > 256)) {
      throw new AuthorityError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be a stable identifier");
    }

    const generatedPurchaseId = key
      ? "purchase-" + createHash("sha256").update(ownerId + ":" + key, "utf8").digest("hex")
      : "purchase-" + randomUUID();

    const existing = this.store.loadPurchase(generatedPurchaseId);
    if (existing) {
      if (
        existing.playerId !== ownerId
        || existing.productId !== product.productId
        || existing.amount !== product.amount
        || existing.currency !== product.currency
        || existing.provider !== product.provider
        || existing.grantKind !== product.grantKind
        || existing.grantAmount !== product.grantAmount
      ) {
        throw new AuthorityError(409, "IDEMPOTENCY_CONFLICT", "Purchase idempotency key is bound to different purchase data");
      }

      return {
        status: PURCHASE_AUTHORITY_RESULT.PENDING,
        created: false,
        ...resultFromRecord(PURCHASE_AUTHORITY_RESULT.PENDING, existing)
      };
    }

    const record = {
      purchaseId: generatedPurchaseId,
      playerId: ownerId,
      productId: product.productId,
      amount: product.amount,
      currency: product.currency,
      provider: product.provider,
      providerTransactionId: "pending:" + generatedPurchaseId,
      receiptFingerprint: createHash("sha256").update("pending:" + generatedPurchaseId, "utf8").digest("hex"),
      grantKind: product.grantKind,
      grantAmount: product.grantAmount,
      claimStatus: "UNCLAIMED",
      authorizationStatus: "PENDING",
      createdAt: new Date().toISOString()
    };

    if (typeof this.store.createPendingPurchase !== "function") {
      throw new AuthorityError(503, "PENDING_PURCHASE_NOT_SUPPORTED", "Purchase store does not support pending purchases");
    }

    const created = this.store.createPendingPurchase(record);
    if (!created.created) {
      const sameOwner = created.record?.playerId === ownerId;
      const sameProduct = created.record?.productId === product.productId;
      const samePrice = created.record?.amount === product.amount && created.record?.currency === product.currency;
      if (!sameOwner || !sameProduct || !samePrice) {
        throw new AuthorityError(409, "IDEMPOTENCY_CONFLICT", "Purchase creation collided with different purchase data");
      }
    }

    return {
      status: PURCHASE_AUTHORITY_RESULT.PENDING,
      created: Boolean(created.created),
      ...resultFromRecord(PURCHASE_AUTHORITY_RESULT.PENDING, created.record)
    };
  }

  getStatus({ playerId, purchaseId } = {}) {
    const ownerId = stableId(playerId, "player_id");
    const id = stableId(purchaseId, "purchase_id");
    const record = this.store.loadPurchase(id);
    if (!record || record.playerId !== ownerId) return null;
    if (record.authorizationStatus === "PENDING") {
      return resultFromRecord(PURCHASE_AUTHORITY_RESULT.PENDING, record);
    }
    const status = record.claimStatus === "GRANT_CLAIMED"
      ? PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED
      : PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT;
    return resultFromRecord(status, record);
  }

  claim({ playerId, purchaseId, body = {} } = {}) {
    const ownerId = stableId(playerId, "player_id");
    const id = stableId(purchaseId, "purchase_id");

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new AuthorityError(400, "INVALID_CLAIM_REQUEST", "Claim body must be a JSON object");
    }

    const forbiddenFields = [
      "amount", "resource", "grant", "playerId", "player_id",
      "authority", "purchase_status", "purchaseStatus", "claimed",
      "grant_kind", "grant_amount", "grant_turns", "paid", "reward"
    ];
    const supplied = Object.keys(body).filter((key) => forbiddenFields.includes(key));
    if (supplied.length > 0 || Object.keys(body).length > 0) {
      throw new AuthorityError(
        400,
        "CLIENT_AUTHORITY_FORBIDDEN",
        "Claim endpoint accepts no client authority fields"
      );
    }

    if (typeof this.store.claimPurchase !== "function") {
      throw new AuthorityError(503, "CLAIM_NOT_SUPPORTED", "Purchase store does not support one-time claims");
    }

    const result = this.store.claimPurchase(id, ownerId);
    if (result.status === "NOT_FOUND") return null;
    if (result.status === "GRANT_ALREADY_CLAIMED") {
      return resultFromRecord(PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED, result.record);
    }
    return resultFromRecord(PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED, result.record);
  }

  _persistVerifiedRecord(record) {
    const existing = this.store.loadPurchase(record.purchaseId);
    if (existing?.authorizationStatus === "PENDING") {
      if (typeof this.store.authorizePendingPurchase !== "function") {
        return {
          status: PURCHASE_AUTHORITY_RESULT.UNAVAILABLE,
          reason: "PENDING_PURCHASE_PROMOTION_NOT_SUPPORTED"
        };
      }

      const promoted = this.store.authorizePendingPurchase(record);
      if (promoted.status === "CONFLICT") {
        return {
          status: PURCHASE_AUTHORITY_RESULT.REJECTED,
          reason: "IDEMPOTENCY_CONFLICT"
        };
      }
      if (promoted.status === "AUTHORIZED_GRANT") {
        return resultFromRecord(PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT, promoted.record);
      }
      if (promoted.status === "ALREADY_AUTHORIZED") {
        return resultFromRecord(PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP, promoted.record);
      }
      if (promoted.status === "NOT_FOUND") {
        return {
          status: PURCHASE_AUTHORITY_RESULT.REJECTED,
          reason: "PURCHASE_NOT_FOUND"
        };
      }
    }

    const saved = this.store.savePurchase(record);
    if (!saved.created) {
      if (!samePurchase(saved.record, record)) {
        return {
          status: PURCHASE_AUTHORITY_RESULT.REJECTED,
          reason: "IDEMPOTENCY_CONFLICT"
        };
      }
      return resultFromRecord(PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP, saved.record);
    }
    return resultFromRecord(PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT, saved.record);
  }

  _missingProviderResult() {
    return {
      status: this.production ? PURCHASE_AUTHORITY_RESULT.UNAVAILABLE : PURCHASE_AUTHORITY_RESULT.BLOCKED,
      reason: "PROVIDER_VERIFIER_NOT_CONFIGURED"
    };
  }

  async authorize({ playerId, purchaseId, body }) {
    const request = normalizeRequest(playerId, purchaseId, body);
    const existingPurchase = this.store.loadPurchase(request.purchaseId);
    if (existingPurchase) {
      if (existingPurchase.playerId !== request.playerId ||
          existingPurchase.productId !== request.productId ||
          existingPurchase.amount !== request.amount ||
          existingPurchase.currency !== request.currency ||
          existingPurchase.provider !== request.provider ||
          existingPurchase.providerTransactionId !== request.transactionId) {
        return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: "PURCHASE_ID_REUSED_WITH_DIFFERENT_DATA" };
      }
      if (existingPurchase.receiptFingerprint !== receiptFingerprint(request.receipt)) {
        return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: "PURCHASE_RECEIPT_MISMATCH" };
      }
      return resultFromRecord(PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP, existingPurchase);
    }

    const existingTransaction = this.store.loadByTransaction(request.provider, request.transactionId);
    if (existingTransaction) {
      const same = existingTransaction.playerId === request.playerId &&
        existingTransaction.productId === request.productId &&
        existingTransaction.amount === request.amount &&
        existingTransaction.currency === request.currency &&
        existingTransaction.provider === request.provider &&
        existingTransaction.receiptFingerprint === receiptFingerprint(request.receipt);
      if (!same) return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: "TRANSACTION_ID_REUSED_WITH_DIFFERENT_DATA" };
      return resultFromRecord(PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP, existingTransaction);
    }

    if (!this.providerVerifier) return this._missingProviderResult();

    let verified;
    try {
      verified = await this.providerVerifier.verifyReceipt({
        purchaseId: request.purchaseId,
        playerId: request.playerId,
        productId: request.productId,
        amount: request.amount,
        currency: request.currency,
        provider: request.provider,
        transactionId: request.transactionId,
        receipt: request.receipt
      });
    } catch {
      return { status: PURCHASE_AUTHORITY_RESULT.UNAVAILABLE, reason: "PROVIDER_VERIFIER_ERROR" };
    }

    if (verified?.status === PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE) {
      return { status: PURCHASE_AUTHORITY_RESULT.UNAVAILABLE, reason: verified.reason || "PROVIDER_UNAVAILABLE" };
    }
    if (verified?.status !== PURCHASE_PROVIDER_VERIFICATION.VERIFIED) {
      return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: verified?.reason || "RECEIPT_REJECTED" };
    }

    const verifiedFingerprint = validateFingerprint(verified.receiptFingerprint);
    const mismatch = verified.playerId !== request.playerId ||
      verified.productId !== request.productId ||
      Number(verified.amount) !== request.amount ||
      verified.currency !== request.currency ||
      verified.provider !== request.provider ||
      verified.transactionId !== request.transactionId ||
      verified.purchaseId !== request.purchaseId ||
      verifiedFingerprint !== receiptFingerprint(request.receipt);
    if (mismatch) return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: "VERIFIED_RECEIPT_MISMATCH" };

    return this._persistVerifiedRecord({
      purchaseId: request.purchaseId,
      playerId: request.playerId,
      productId: request.productId,
      amount: request.amount,
      currency: request.currency,
      provider: request.provider,
      providerTransactionId: request.transactionId,
      receiptFingerprint: verifiedFingerprint,
      grantKind: stableId(verified.grantKind, "grant_kind"),
      grantAmount: normalizeAmount(verified.grantAmount, "grant_amount")
    });
  }

  async authorizeProviderCallback({ body, rawBody = null, headers = {} } = {}) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AuthorityError(400, "INVALID_PROVIDER_CALLBACK", "Provider callback body is required");
    }
    if (!this.providerVerifier || typeof this.providerVerifier.verifyPurchaseCallback !== "function") {
      return {
        status: this.production ? PURCHASE_AUTHORITY_RESULT.UNAVAILABLE : PURCHASE_AUTHORITY_RESULT.BLOCKED,
        reason: "CALLBACK_VERIFIER_NOT_CONFIGURED"
      };
    }

    let verified;
    try {
      verified = await this.providerVerifier.verifyPurchaseCallback({
        body,
        rawBody,
        headers
      });
    } catch {
      return { status: PURCHASE_AUTHORITY_RESULT.UNAVAILABLE, reason: "PROVIDER_CALLBACK_VERIFIER_ERROR" };
    }

    if (verified?.status === PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE) {
      return { status: PURCHASE_AUTHORITY_RESULT.UNAVAILABLE, reason: verified.reason || "PROVIDER_UNAVAILABLE" };
    }
    if (verified?.status !== PURCHASE_PROVIDER_VERIFICATION.VERIFIED) {
      return { status: PURCHASE_AUTHORITY_RESULT.REJECTED, reason: verified?.reason || "PROVIDER_CALLBACK_REJECTED" };
    }

    const purchaseId = stableId(verified.purchaseId, "purchase_id");
    const playerId = stableId(verified.playerId, "player_id");
    const productId = stableId(verified.productId, "product_id");
    const provider = stableId(verified.provider, "provider");
    const transactionId = stableId(verified.transactionId, "transaction_id");
    const currency = stableId(verified.currency, "currency");
    const verifiedAmount = normalizeAmount(verified.amount, "amount");
    const verifiedGrantKind = stableId(verified.grantKind, "grant_kind");
    const verifiedGrantAmount = normalizeAmount(verified.grantAmount, "grant_amount");
    const fingerprint = validateFingerprint(verified.receiptFingerprint);

    return this._persistVerifiedRecord({
      purchaseId,
      playerId,
      productId,
      amount: verifiedAmount,
      currency,
      provider,
      providerTransactionId: transactionId,
      receiptFingerprint: fingerprint,
      grantKind: verifiedGrantKind,
      grantAmount: verifiedGrantAmount
    });
  }
}
