import { isDevelopmentEnvironment } from "./economy.js";

export const CHECKOUT_STATUS = Object.freeze({
  IDLE: "IDLE",
  CREATING_PURCHASE: "CREATING_PURCHASE",
  PURCHASE_PENDING: "PURCHASE_PENDING",
  CREATING_INVOICE: "CREATING_INVOICE",
  INVOICE_READY: "INVOICE_READY",
  OPENING_TELEGRAM: "OPENING_TELEGRAM",
  PAYMENT_RESULT: "PAYMENT_RESULT",
  SYNCING_AUTHORITY: "SYNCING_AUTHORITY",
  AUTHORIZED_PENDING_CLAIM: "AUTHORIZED_PENDING_CLAIM",
  WAITING_AUTHORITY: "WAITING_AUTHORITY",
  CLAIMING: "CLAIMING",
  APPLYING: "APPLYING",
  GRANT_CLAIMED: "GRANT_CLAIMED",
  GRANT_APPLIED: "GRANT_APPLIED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED"
});

const PENDING_PURCHASE_STORAGE_KEY = "baseball_waifus_purchase_recovery_v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizePurchaseId(value) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) throw new Error("Invalid purchaseId");
  return id;
}

function makeIdempotencyKey(productId) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return "checkout-" + uuid;
  return "checkout-" + String(productId) + "-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

export class ShopManager {
  constructor({
    api = null,
    webApp = null,
    telegramBridge = null,
    invoiceUrls = {},
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    onStatus = null
  } = {}) {
    this.api = api || null;
    this.telegramBridge = telegramBridge || null;
    this.webApp = webApp || null;
    this.invoiceUrls = { ...invoiceUrls };
    this.storage = storage;
    this.onStatus = onStatus;
    this.state = Object.freeze({
      status: CHECKOUT_STATUS.IDLE,
      productId: null,
      purchaseId: null,
      paymentStatus: null,
      authorityStatus: null,
      invoiceUrl: null,
      economicSideEffect: false,
      error: null
    });
    this._inflightKeys = new Map();
  }

  setApi(api) { this.api = api || null; return this; }
  setWebApp(webApp) { this.webApp = webApp || null; return this; }
  setTelegramBridge(telegramBridge) { this.telegramBridge = telegramBridge || null; return this; }

  getCheckoutState() {
    return clone(this.state);
  }

  _setState(patch) {
    this.state = Object.freeze({ ...this.state, ...patch });
    this.onStatus?.(this.getCheckoutState());
    return this.state;
  }

  _readRecovery(productId) {
    try {
      const raw = this.storage?.getItem?.(PENDING_PURCHASE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const item = parsed?.[String(productId)] || null;
      if (!item?.purchaseId && !item?.idempotencyKey) return null;
      return {
        purchaseId: item.purchaseId ? normalizePurchaseId(item.purchaseId) : null,
        idempotencyKey: String(item.idempotencyKey || "")
      };
    } catch {
      return null;
    }
  }

  _writeRecovery(productId, purchaseId, idempotencyKey = "") {
    try {
      const raw = this.storage?.getItem?.(PENDING_PURCHASE_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[String(productId)] = {
        purchaseId: purchaseId ? normalizePurchaseId(purchaseId) : null,
        idempotencyKey: String(idempotencyKey || "")
      };
      this.storage?.setItem?.(PENDING_PURCHASE_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  _clearRecovery(productId) {
    try {
      const raw = this.storage?.getItem?.(PENDING_PURCHASE_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      delete data[String(productId)];
      this.storage?.setItem?.(PENDING_PURCHASE_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async _devOpenInvoice(productId, { onPaid = null, onCancelled = null } = {}) {
    const url = this.invoiceUrls[productId] || globalThis?.window?.__BASEBALL_WAIFUS_INVOICES__?.[productId] || "";
    const openInvoice = this.telegramBridge?.openInvoice
      ? (invoice, callback) => this.telegramBridge.openInvoice(invoice, callback)
      : this.webApp?.openInvoice
        ? (invoice, callback) => {
          try {
            this.webApp.openInvoice(invoice, callback);
            return true;
          } catch {
            return false;
          }
        }
        : null;

    if (!openInvoice || !url) {
      const result = { ok: false, status: "invoice_unavailable", product_id: productId, simulated: false };
      onCancelled?.(result);
      return result;
    }

    this._setState({
      status: CHECKOUT_STATUS.OPENING_TELEGRAM,
      productId,
      invoiceUrl: String(url),
      economicSideEffect: false,
      error: null
    });

    return new Promise((resolve) => {
      let settled = false;
      const finish = (status) => {
        if (settled) return;
        settled = true;
        const normalized = String(status || "failed").toLowerCase();
        const result = {
          ok: normalized === "paid",
          status: normalized,
          product_id: productId,
          simulated: true,
          economicSideEffect: normalized === "paid"
        };
        this._setState({
          status: normalized === "paid" ? CHECKOUT_STATUS.PAYMENT_RESULT : CHECKOUT_STATUS.CANCELLED,
          paymentStatus: normalized,
          economicSideEffect: normalized === "paid"
        });
        if (result.ok) onPaid?.(result);
        else onCancelled?.(result);
        resolve(result);
      };
      try {
        if (!openInvoice(String(url), finish)) finish("failed");
      } catch {
        finish("failed");
      }
    });
  }

  async _checkout(productId) {
    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) return { ok: false, status: "invalid_product_id" };

    if (!this.api?.configured?.()) {
      if (!isDevelopmentEnvironment()) {
        this._setState({
          status: CHECKOUT_STATUS.FAILED,
          productId: normalizedProductId,
          error: "Purchase API base URL is not configured",
          economicSideEffect: false
        });
        return { ok: false, status: "api_unavailable", product_id: normalizedProductId };
      }
      return this._devOpenInvoice(normalizedProductId);
    }

    this._setState({
      status: CHECKOUT_STATUS.CREATING_PURCHASE,
      productId: normalizedProductId,
      purchaseId: null,
      paymentStatus: null,
      authorityStatus: null,
      invoiceUrl: null,
      economicSideEffect: false,
      error: null
    });

    let idempotencyKey = this._inflightKeys.get(normalizedProductId)
      || this._readRecovery(normalizedProductId)?.idempotencyKey
      || makeIdempotencyKey(normalizedProductId);
    this._inflightKeys.set(normalizedProductId, idempotencyKey);
    this._writeRecovery(normalizedProductId, null, idempotencyKey);

    let pending;
    try {
      pending = await this.api.createPendingPurchase(normalizedProductId, idempotencyKey);
    } catch (error) {
      this._setState({ status: CHECKOUT_STATUS.FAILED, error: String(error?.message || error) });
      return { ok: false, status: "purchase_creation_failed", product_id: normalizedProductId, error: String(error?.message || error) };
    }

    this._writeRecovery(normalizedProductId, pending.purchase_id, idempotencyKey);
    this._inflightKeys.delete(normalizedProductId);
    this._setState({
      status: CHECKOUT_STATUS.PURCHASE_PENDING,
      purchaseId: pending.purchase_id,
      authorityStatus: "PENDING",
      economicSideEffect: false
    });

    let invoice;
    try {
      this._setState({ status: CHECKOUT_STATUS.CREATING_INVOICE });
      invoice = await this.api.createPurchaseInvoice(pending.purchase_id);
    } catch (error) {
      this._setState({ status: CHECKOUT_STATUS.FAILED, error: String(error?.message || error) });
      return { ok: false, status: "invoice_creation_failed", product_id: normalizedProductId, purchase_id: pending.purchase_id };
    }

    this._setState({
      status: CHECKOUT_STATUS.INVOICE_READY,
      invoiceUrl: invoice.invoice_url,
      purchaseId: pending.purchase_id
    });

    this._setState({ status: CHECKOUT_STATUS.OPENING_TELEGRAM });
    const payment = await new Promise((resolve) => {
      let settled = false;
      const finish = (status) => {
        if (settled) return;
        settled = true;
        const normalized = String(status || "failed").toLowerCase();
        resolve({ ok: normalized === "paid", status: normalized, simulated: false });
      };
      const openInvoice = this.telegramBridge?.openInvoice
        ? (url, callback) => this.telegramBridge.openInvoice(url, callback)
        : this.webApp?.openInvoice
          ? (url, callback) => {
            try {
              this.webApp.openInvoice(url, callback);
              return true;
            } catch {
              return false;
            }
          }
          : null;
      if (!openInvoice || !invoice.invoice_url) {
        finish("failed");
        return;
      }
      try {
        if (!openInvoice(invoice.invoice_url, finish)) finish("failed");
      } catch {
        finish("failed");
      }
    });

    this._setState({
      status: CHECKOUT_STATUS.PAYMENT_RESULT,
      paymentStatus: payment.status,
      economicSideEffect: false
    });

    if (payment.status === "cancelled" || payment.status === "failed") {
      this._setState({ status: CHECKOUT_STATUS.CANCELLED });
      return {
        ok: false,
        status: payment.status,
        product_id: normalizedProductId,
        purchase_id: pending.purchase_id,
        payment_result: payment,
        economicSideEffect: false
      };
    }

    if (payment.status !== "paid") {
      this._setState({ status: CHECKOUT_STATUS.WAITING_AUTHORITY });
      return {
        ok: true,
        status: payment.status,
        product_id: normalizedProductId,
        purchase_id: pending.purchase_id,
        payment_result: payment,
        authorityStatus: "PENDING",
        economicSideEffect: false
      };
    }

    return this._syncAuthority(pending.purchase_id, normalizedProductId, payment);
  }

  async _syncAuthority(purchaseId, productId, paymentResult = null) {
    const id = normalizePurchaseId(purchaseId);
    const resolvedProductId = productId || this.state.productId || null;
    this._setState({
      status: CHECKOUT_STATUS.SYNCING_AUTHORITY,
      purchaseId: id,
      economicSideEffect: false,
      error: null
    });

    let statusDto;
    try {
      statusDto = await this.api.getPurchaseStatus(id);
    } catch (error) {
      this._setState({
        status: CHECKOUT_STATUS.WAITING_AUTHORITY,
        error: String(error?.message || error),
        economicSideEffect: false
      });
      return {
        ok: true,
        status: "authority_unavailable",
        product_id: resolvedProductId,
        purchase_id: id,
        payment_result: paymentResult,
        authorityStatus: "UNKNOWN",
        economicSideEffect: false
      };
    }

    const authorityStatus = String(statusDto.status || "UNKNOWN");

    if (authorityStatus === "PENDING") {
      this._setState({
        status: CHECKOUT_STATUS.WAITING_AUTHORITY,
        authorityStatus,
        economicSideEffect: false,
        error: null
      });
      return {
        ok: true,
        status: "waiting_authority",
        product_id: resolvedProductId,
        purchase_id: id,
        payment_result: paymentResult,
        authorityStatus,
        purchaseStatus: clone(statusDto),
        economicSideEffect: false
      };
    }

    if (authorityStatus === "GRANT_APPLIED" || authorityStatus === "GRANT_ALREADY_APPLIED") {
      this._setState({
        status: CHECKOUT_STATUS.GRANT_APPLIED,
        authorityStatus,
        economicSideEffect: false,
        error: null
      });
      this._clearRecovery(resolvedProductId);
      return {
        ok: true,
        status: "paid",
        product_id: resolvedProductId,
        purchase_id: id,
        payment_result: paymentResult,
        authorityStatus,
        purchaseStatus: clone(statusDto),
        economicSideEffect: false
      };
    }

    if (authorityStatus === "AUTHORIZED_GRANT") {
      this._setState({
        status: CHECKOUT_STATUS.AUTHORIZED_PENDING_CLAIM,
        authorityStatus,
        economicSideEffect: false,
        error: null
      });
      return this._claimAndApply(id, resolvedProductId, paymentResult, statusDto);
    }

    if (authorityStatus === "GRANT_CLAIMED" || authorityStatus === "GRANT_ALREADY_CLAIMED") {
      this._setState({
        status: CHECKOUT_STATUS.GRANT_CLAIMED,
        authorityStatus,
        economicSideEffect: false,
        error: null
      });
      return this._applyClaimedGrant(id, resolvedProductId, paymentResult, statusDto);
    }

    this._setState({
      status: CHECKOUT_STATUS.WAITING_AUTHORITY,
      authorityStatus,
      economicSideEffect: false,
      error: null
    });
    return {
      ok: true,
      status: "waiting_authority",
      product_id: resolvedProductId,
      purchase_id: id,
      payment_result: paymentResult,
      authorityStatus,
      purchaseStatus: clone(statusDto),
      economicSideEffect: false
    };
  }

  async _claimAndApply(purchaseId, productId, paymentResult, statusDto) {
    this._setState({
      status: CHECKOUT_STATUS.CLAIMING,
      purchaseId,
      authorityStatus: "AUTHORIZED_GRANT",
      economicSideEffect: false,
      error: null
    });

    let claimDto;
    try {
      claimDto = await this.api.claimPurchase(purchaseId);
    } catch (error) {
      this._setState({
        status: CHECKOUT_STATUS.WAITING_AUTHORITY,
        error: String(error?.message || error),
        economicSideEffect: false
      });
      return {
        ok: true,
        status: "claim_unavailable",
        product_id: productId,
        purchase_id: purchaseId,
        payment_result: paymentResult,
        authorityStatus: "AUTHORIZED_GRANT",
        purchaseStatus: clone(statusDto),
        economicSideEffect: false
      };
    }

    if (claimDto.status !== "GRANT_CLAIMED" && claimDto.status !== "GRANT_ALREADY_CLAIMED") {
      this._setState({
        status: CHECKOUT_STATUS.WAITING_AUTHORITY,
        authorityStatus: String(claimDto.status || "UNKNOWN"),
        economicSideEffect: false
      });
      return {
        ok: true,
        status: "claim_pending",
        product_id: productId,
        purchase_id: purchaseId,
        payment_result: paymentResult,
        authorityStatus: String(claimDto.status || "UNKNOWN"),
        purchaseStatus: clone(statusDto),
        claimStatus: clone(claimDto),
        economicSideEffect: false
      };
    }

    this._setState({
      status: CHECKOUT_STATUS.GRANT_CLAIMED,
      authorityStatus: claimDto.status,
      economicSideEffect: false,
      error: null
    });
    return this._applyClaimedGrant(purchaseId, productId, paymentResult, statusDto, claimDto);
  }

  async _applyClaimedGrant(purchaseId, productId, paymentResult, statusDto, claimDto = null) {
    this._setState({
      status: CHECKOUT_STATUS.APPLYING,
      purchaseId,
      authorityStatus: claimDto?.status || String(statusDto?.status || "GRANT_CLAIMED"),
      economicSideEffect: false,
      error: null
    });

    let applyDto;
    try {
      applyDto = await this.api.applyPurchaseGrant(purchaseId);
    } catch (error) {
      this._setState({
        status: CHECKOUT_STATUS.WAITING_AUTHORITY,
        error: String(error?.message || error),
        economicSideEffect: false
      });
      return {
        ok: true,
        status: "apply_unavailable",
        product_id: productId,
        purchase_id: purchaseId,
        payment_result: paymentResult,
        authorityStatus: claimDto?.status || String(statusDto?.status || "GRANT_CLAIMED"),
        purchaseStatus: clone(statusDto),
        claimStatus: claimDto ? clone(claimDto) : null,
        economicSideEffect: false
      };
    }

    this._setState({
      status: CHECKOUT_STATUS.GRANT_APPLIED,
      authorityStatus: applyDto.status,
      economicSideEffect: false,
      error: null
    });
    this._clearRecovery(productId);

    return {
      ok: true,
      status: "paid",
      product_id: productId,
      purchase_id: purchaseId,
      payment_result: paymentResult,
      authorityStatus: applyDto.status,
      purchaseStatus: clone(statusDto),
      claimStatus: claimDto ? clone(claimDto) : null,
      grantApplication: clone(applyDto),
      economicSideEffect: false
    };
  }

  async buyScrapPack(productId) {
    return this._checkout(productId);
  }

  async buyBoost(productId) {
    return this._checkout(productId);
  }

  async recoverPurchase(purchaseId, productId = null) {
    const id = normalizePurchaseId(purchaseId);
    if (!this.api?.configured?.()) {
      return { ok: false, status: "api_unavailable", purchase_id: id };
    }
    return this._syncAuthority(id, productId || this.state.productId || null, null);
  }

  async recoverStoredPurchase(productId) {
    const saved = this._readRecovery(productId);
    if (!saved?.purchaseId) return { ok: false, status: "no_pending_purchase", product_id: productId };
    return this.recoverPurchase(saved.purchaseId, String(productId || "").trim() || null);
  }

  clearRecoveredPurchase(productId) {
    this._clearRecovery(productId);
    return this;
  }
}
