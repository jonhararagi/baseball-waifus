import {
  createPurchaseProviderVerifier,
  PURCHASE_PROVIDER_VERIFICATION
} from "./purchase_provider_verifier.mjs";

export const PURCHASE_PROVIDER_ADAPTER_STATUS = Object.freeze({
  NOT_CONFIGURED: "NOT_CONFIGURED",
  CONFIGURED_UNAVAILABLE: "CONFIGURED_UNAVAILABLE",
  READY: "READY"
});

function normalizeProvider(value) {
  return String(value || "").trim();
}

function unavailable(reason) {
  return Object.freeze({
    status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
    reason
  });
}

export class PurchaseProviderAdapter {
  constructor({
    provider = "",
    credentialsConfigured = false,
    available = false,
    verifyReceipt = null,
    verifyPurchaseCallback = null
  } = {}) {
    this.provider = normalizeProvider(provider);
    this.credentialsConfigured = Boolean(credentialsConfigured);
    this.available = Boolean(available);
    this._verifyReceipt = verifyReceipt;
    this._verifyPurchaseCallback = verifyPurchaseCallback;

    if (!this.provider) {
      this.status = PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED;
    } else if (
      !this.credentialsConfigured
      || typeof this._verifyReceipt !== "function"
    ) {
      this.status = PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE;
    } else if (!this.available) {
      this.status = PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE;
    } else {
      this.status = PURCHASE_PROVIDER_ADAPTER_STATUS.READY;
    }

    this.verifier = this.status === PURCHASE_PROVIDER_ADAPTER_STATUS.READY
      ? createPurchaseProviderVerifier({
        verifyReceipt: this._verifyReceipt,
        verifyPurchaseCallback: this._verifyPurchaseCallback
      })
      : null;

    Object.freeze(this);
  }

  getStatus() {
    return Object.freeze({
      state: this.status,
      provider: this.provider || null,
      credentials_configured: this.credentialsConfigured,
      available: this.available,
      verifier_configured: typeof this._verifyReceipt === "function",
      ready: this.status === PURCHASE_PROVIDER_ADAPTER_STATUS.READY
    });
  }

  async verifyReceipt(input) {
    if (!this.verifier) {
      return unavailable(
        this.status === PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED
          ? "PROVIDER_NOT_CONFIGURED"
          : "PROVIDER_UNAVAILABLE"
      );
    }
    return this.verifier.verifyReceipt(input);
  }

  async verifyPurchaseCallback(input) {
    if (!this.verifier) {
      return unavailable(
        this.status === PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED
          ? "PROVIDER_NOT_CONFIGURED"
          : "PROVIDER_UNAVAILABLE"
      );
    }
    return this.verifier.verifyPurchaseCallback(input);
  }
}

export function createPurchaseProviderAdapter(options = {}) {
  return new PurchaseProviderAdapter(options);
}

export function createPurchaseProviderAdapterFromConfig(config = {}) {
  return createPurchaseProviderAdapter({
    provider: config.purchaseProvider,
    credentialsConfigured: config.purchaseProviderCredentialConfigured,
    available: false
  });
}
