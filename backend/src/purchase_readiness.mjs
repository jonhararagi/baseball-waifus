import { purchasePersistenceReadiness } from "./purchase_persistence_provider.mjs";

export function evaluatePurchaseReadiness({
  config,
  purchaseAuthority = null,
  purchaseStore = null
} = {}) {
  const purchaseAuthorityAvailable = Boolean(
    purchaseAuthority
    && purchaseStore
    && typeof purchaseAuthority.authorize === "function"
    && typeof purchaseAuthority.getStatus === "function"
  );

  const purchaseProviderAvailable = Boolean(
    purchaseAuthority?.providerVerifier
    && typeof purchaseAuthority.providerVerifier.verifyReceipt === "function"
  );

  const purchasePersistenceAvailable = purchasePersistenceReadiness(config, purchaseStore);

  return Object.freeze({
    purchase_authority: purchaseAuthorityAvailable,
    purchase_persistence: purchasePersistenceAvailable,
    purchase_provider: purchaseProviderAvailable
  });
}

export function purchaseReadinessSatisfied(status) {
  return Boolean(
    status?.purchase_authority
    && status?.purchase_persistence
    && status?.purchase_provider
  );
}
