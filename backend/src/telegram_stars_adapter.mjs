import { createHash } from "node:crypto";
import {
  createPurchaseProviderAdapter,
  PURCHASE_PROVIDER_ADAPTER_STATUS
} from "./purchase_provider_adapter.mjs";
import { PURCHASE_PROVIDER_VERIFICATION } from "./purchase_provider_verifier.mjs";

export const TELEGRAM_STARS_PROVIDER = "telegram-stars";
export const TELEGRAM_STARS_CURRENCY = "XTR";
export const TELEGRAM_STARS_WEBHOOK_SECRET_HEADER = "x-telegram-bot-api-secret-token";
export const TELEGRAM_STARS_INVOICE_VERSION = "bwstars:v1";

function stableId(value, label) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 256) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
  return id;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return number;
}

function headerValue(headers, name) {
  if (!headers || typeof headers !== "object") return "";
  const value = headers[String(name).toLowerCase()];
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function invoicePayloadFor(record) {
  return [
    TELEGRAM_STARS_INVOICE_VERSION,
    encodeURIComponent(record.purchaseId),
    encodeURIComponent(record.productId),
    String(record.amount)
  ].join(":");
}

function parseInvoicePayload(value) {
  const raw = String(value || "");
  const prefix = TELEGRAM_STARS_INVOICE_VERSION + ":";
  if (!raw.startsWith(prefix)) return null;
  const parts = raw.slice(prefix.length).split(":");
  if (parts.length !== 3 || !/^\d+$/.test(parts[2])) return null;
  let purchaseId;
  let productId;
  try {
    purchaseId = decodeURIComponent(parts[0]);
    productId = decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
  try {
    stableId(purchaseId, "purchase_id");
    stableId(productId, "product_id");
  } catch {
    return null;
  }
  return Object.freeze({
    purchaseId,
    productId,
    amount: Number(parts[2])
  });
}

function paymentFingerprint(rawBody, body) {
  const source = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(JSON.stringify(body), "utf8");
  return createHash("sha256").update(source).digest("hex");
}

function reject(reason) {
  return Object.freeze({
    status: PURCHASE_PROVIDER_VERIFICATION.REJECTED,
    reason
  });
}

function verifyStarsCallback({ webhookSecret, purchaseStore, body, rawBody, headers }) {
  if (!webhookSecret) {
    return Object.freeze({
      status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
      reason: "TELEGRAM_STARS_CREDENTIAL_NOT_CONFIGURED"
    });
  }
  if (!purchaseStore || typeof purchaseStore.loadPurchase !== "function") {
    return Object.freeze({
      status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
      reason: "PURCHASE_STORE_UNAVAILABLE"
    });
  }

  const providedSecret = headerValue(headers, TELEGRAM_STARS_WEBHOOK_SECRET_HEADER);
  if (!providedSecret || providedSecret !== webhookSecret) {
    return reject("TELEGRAM_WEBHOOK_AUTH_INVALID");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return reject("INVALID_PROVIDER_RESPONSE");

  const message = body.message;
  const payment = message?.successful_payment;
  const userId = message?.from?.id;
  if (!payment) return reject("SUCCESSFUL_PAYMENT_MISSING");
  if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
    return reject("TELEGRAM_USER_INVALID");
  }
  if (payment.currency !== TELEGRAM_STARS_CURRENCY) return reject("INVALID_CURRENCY");

  let totalAmount;
  try {
    totalAmount = positiveInteger(payment.total_amount, "total_amount");
  } catch {
    return reject("INVALID_AMOUNT");
  }

  const telegramChargeId = String(payment.telegram_payment_charge_id || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(telegramChargeId) || telegramChargeId.length > 256) {
    return reject("TRANSACTION_ID_MISSING");
  }

  const providerChargeId = payment.provider_payment_charge_id === undefined
    ? ""
    : String(payment.provider_payment_charge_id || "").trim();
  if (providerChargeId && !/^[A-Za-z0-9._:-]+$/.test(providerChargeId)) {
    return reject("INVALID_PROVIDER_TRANSACTION_ID");
  }

  const invoice = parseInvoicePayload(payment.invoice_payload);
  if (!invoice || invoice.amount !== totalAmount) return reject("INVALID_INVOICE_PAYLOAD");

  const purchase = purchaseStore.loadPurchase(invoice.purchaseId);
  if (!purchase) return reject("PURCHASE_NOT_FOUND");
  if (purchase.provider !== TELEGRAM_STARS_PROVIDER) return reject("PURCHASE_PROVIDER_MISMATCH");
  if (purchase.playerId !== `telegram:${Number(userId)}`) return reject("PURCHASE_IDENTITY_MISMATCH");
  if (purchase.productId !== invoice.productId) return reject("PURCHASE_PRODUCT_MISMATCH");
  if (purchase.amount !== totalAmount) return reject("PURCHASE_AMOUNT_MISMATCH");
  if (purchase.currency !== TELEGRAM_STARS_CURRENCY) return reject("PURCHASE_CURRENCY_MISMATCH");
  if (purchase.providerTransactionId !== telegramChargeId) return reject("PURCHASE_TRANSACTION_MISMATCH");

  const expectedPayload = invoicePayloadFor(purchase);
  if (payment.invoice_payload !== expectedPayload) return reject("INVOICE_PAYLOAD_MISMATCH");

  return Object.freeze({
    status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
    purchaseId: purchase.purchaseId,
    playerId: purchase.playerId,
    productId: purchase.productId,
    amount: purchase.amount,
    currency: TELEGRAM_STARS_CURRENCY,
    provider: TELEGRAM_STARS_PROVIDER,
    transactionId: telegramChargeId,
    receiptFingerprint: paymentFingerprint(rawBody, body),
    grantKind: purchase.grantKind,
    grantAmount: purchase.grantAmount,
    telegramPaymentChargeId: telegramChargeId,
    providerPaymentChargeId: providerChargeId || null
  });
}

export function createTelegramStarsProviderAdapter({
  webhookSecret = "",
  purchaseStore = null,
  available = true
} = {}) {
  const secret = String(webhookSecret || "").trim();
  const storeReady = Boolean(purchaseStore && typeof purchaseStore.loadPurchase === "function");
  return createPurchaseProviderAdapter({
    provider: TELEGRAM_STARS_PROVIDER,
    credentialsConfigured: Boolean(secret),
    available: Boolean(available && storeReady && secret),
    verifyReceipt: null,
    verifyPurchaseCallback: async (input) => verifyStarsCallback({
      webhookSecret: secret,
      purchaseStore,
      body: input.body,
      rawBody: input.rawBody,
      headers: input.headers
    })
  });
}

export function createTelegramStarsProviderAdapterFromConfig(config = {}, options = {}) {
  return createTelegramStarsProviderAdapter({
    webhookSecret: config.telegramStarsWebhookSecret,
    purchaseStore: options.purchaseStore || null,
    available: options.available ?? true
  });
}

export function buildTelegramStarsInvoicePayload(record) {
  stableId(record?.purchaseId, "purchase_id");
  stableId(record?.productId, "product_id");
  const amount = positiveInteger(record?.amount, "amount");
  return invoicePayloadFor({
    purchaseId: String(record.purchaseId),
    productId: String(record.productId),
    amount
  });
}

export function telegramStarsProviderReady(adapter) {
  return Boolean(
    adapter
    && adapter.getStatus().state === PURCHASE_PROVIDER_ADAPTER_STATUS.READY
  );
}
