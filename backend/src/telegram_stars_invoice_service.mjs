import {
  buildTelegramStarsInvoicePayload,
  TELEGRAM_STARS_CURRENCY,
  TELEGRAM_STARS_PROVIDER
} from "./telegram_stars_adapter.mjs";
import { getTelegramStarsProduct } from "./telegram_stars_product_catalog.mjs";

export class TelegramStarsInvoiceError extends Error {
  constructor(message, code = "TELEGRAM_INVOICE_UNAVAILABLE", cause = null) {
    super(message);
    this.name = "TelegramStarsInvoiceError";
    this.code = code;
    this.cause = cause;
  }
}

function positiveAmount(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function validatePendingPurchase(purchase) {
  if (!purchase || purchase.authorizationStatus !== "PENDING") {
    throw new TelegramStarsInvoiceError("Purchase is not pending", "PURCHASE_NOT_PENDING");
  }
  if (purchase.provider !== TELEGRAM_STARS_PROVIDER || purchase.currency !== TELEGRAM_STARS_CURRENCY) {
    throw new TelegramStarsInvoiceError("Purchase provider is not Telegram Stars", "PURCHASE_PROVIDER_MISMATCH");
  }

  const product = getTelegramStarsProduct(purchase.productId);
  const amount = positiveAmount(purchase.amount);
  if (!product || !amount) {
    throw new TelegramStarsInvoiceError("Purchase product is invalid", "PURCHASE_PRODUCT_INVALID");
  }
  if (
    product.amount !== amount
    || product.currency !== purchase.currency
    || product.provider !== purchase.provider
    || product.grantKind !== purchase.grantKind
    || product.grantAmount !== purchase.grantAmount
  ) {
    throw new TelegramStarsInvoiceError("Purchase does not match server product catalog", "PURCHASE_CATALOG_MISMATCH");
  }
  return product;
}

function invoiceDescription(product) {
  return `BaseWarriors Telegram Stars purchase: ${product.productId}`;
}

export class TelegramStarsInvoiceService {
  constructor({
    botToken = "",
    fetchImpl = typeof globalThis !== "undefined" ? globalThis.fetch?.bind(globalThis) : null,
    apiBaseUrl = "https://api.telegram.org",
    timeoutMs = 8000
  } = {}) {
    this.botToken = String(botToken || "").trim();
    this.fetchImpl = fetchImpl;
    this.apiBaseUrl = String(apiBaseUrl || "").replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  configured() {
    return Boolean(this.botToken && typeof this.fetchImpl === "function");
  }

  async createInvoice({ purchase } = {}) {
    const product = validatePendingPurchase(purchase);
    const invoicePayload = buildTelegramStarsInvoicePayload(purchase);

    if (purchase.invoiceUrl) {
      return Object.freeze({
        purchaseId: purchase.purchaseId,
        invoiceUrl: purchase.invoiceUrl,
        invoicePayload: purchase.invoicePayload || invoicePayload,
        reused: true
      });
    }

    if (!this.configured()) {
      throw new TelegramStarsInvoiceError(
        "Telegram Stars invoice provider is not configured",
        "PROVIDER_UNAVAILABLE"
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const endpoint = `${this.apiBaseUrl}/bot${this.botToken}/createInvoiceLink`;
    const requestBody = {
      title: `BaseWarriors ${product.productId}`,
      description: invoiceDescription(product),
      payload: invoicePayload,
      currency: TELEGRAM_STARS_CURRENCY,
      prices: [{ label: product.productId, amount: product.amount }],
      provider_token: ""
    };

    let response;
    try {
      response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } catch (error) {
      throw new TelegramStarsInvoiceError("Telegram invoice provider is unavailable", "PROVIDER_UNAVAILABLE", error);
    } finally {
      clearTimeout(timer);
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new TelegramStarsInvoiceError("Telegram invoice provider returned an invalid response", "PROVIDER_INVALID_RESPONSE", error);
    }

    if (!response.ok || payload?.ok !== true || typeof payload.result !== "string") {
      throw new TelegramStarsInvoiceError("Telegram invoice creation was rejected", "PROVIDER_REJECTED");
    }

    const invoiceUrl = payload.result.trim();
    if (!/^https:\/\//.test(invoiceUrl) || invoiceUrl.length > 2048) {
      throw new TelegramStarsInvoiceError("Telegram returned an invalid invoice link", "PROVIDER_INVALID_INVOICE");
    }

    return Object.freeze({
      purchaseId: purchase.purchaseId,
      invoiceUrl,
      invoicePayload,
      reused: false
    });
  }
}

export function createTelegramStarsInvoiceServiceFromConfig(config = {}, options = {}) {
  return new TelegramStarsInvoiceService({
    botToken: config.telegramBotToken,
    fetchImpl: options.fetchImpl,
    apiBaseUrl: options.apiBaseUrl,
    timeoutMs: options.timeoutMs
  });
}
