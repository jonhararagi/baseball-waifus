import { purchasePersistenceReadiness } from "./purchase_persistence_provider.mjs";
import { PURCHASE_PROVIDER_ADAPTER_STATUS } from "./purchase_provider_adapter.mjs";

export function evaluatePurchaseReadiness({
  config,
  purchaseAuthority = null,
  purchaseStore = null,
  purchaseProviderAdapter = null
} = {}) {
  const purchaseAuthorityAvailable = Boolean(
    purchaseAuthority
    && purchaseStore
    && typeof purchaseAuthority.authorize === "function"
    && typeof purchaseAuthority.getStatus === "function"
  );

  const purchasePersistenceAvailable = purchasePersistenceReadiness(config, purchaseStore);

  let purchaseProvider = false;
  let purchaseProviderState = PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED;
  let purchaseProviderConfigured = Boolean(config?.purchaseProviderConfigured);
  let purchaseProviderReady = false;

  if (purchaseProviderAdapter) {
    const status = purchaseProviderAdapter.getStatus();
    purchaseProviderState = status.state;
    purchaseProviderConfigured = Boolean(status.provider);
    purchaseProviderReady = status.state === PURCHASE_PROVIDER_ADAPTER_STATUS.READY;
    purchaseProvider = purchaseProviderReady;
  } else if (purchaseAuthority?.providerVerifier) {
    purchaseProvider = typeof purchaseAuthority.providerVerifier.verifyReceipt === "function";
    purchaseProviderState = purchaseProvider
      ? PURCHASE_PROVIDER_ADAPTER_STATUS.READY
      : PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE;
    purchaseProviderReady = purchaseProvider;
  }

  return Object.freeze({
    purchase_authority: purchaseAuthorityAvailable,
    purchase_persistence: purchasePersistenceAvailable,
    purchase_provider: purchaseProvider,
    purchase_provider_state: purchaseProviderState,
    purchase_provider_configured: purchaseProviderConfigured,
    purchase_provider_ready: purchaseProviderReady
  });
}

export function purchaseReadinessSatisfied(status) {
  return Boolean(
    status?.purchase_authority
    && status?.purchase_persistence
    && status?.purchase_provider
  );
}
