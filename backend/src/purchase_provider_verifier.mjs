export const PURCHASE_PROVIDER_VERIFICATION = Object.freeze({
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  UNAVAILABLE: "UNAVAILABLE"
});

export function createPurchaseProviderVerifier({ verifyReceipt } = {}) {
  if (typeof verifyReceipt !== "function") {
    throw new TypeError("PurchaseProviderVerifier requires verifyReceipt");
  }

  return Object.freeze({
    async verifyReceipt(input) {
      const result = await verifyReceipt(Object.freeze({ ...input }));
      if (!result || typeof result !== "object") {
        return Object.freeze({ status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE, reason: "INVALID_VERIFIER_RESPONSE" });
      }
      const status = String(result.status || "").toUpperCase();
      if (!Object.values(PURCHASE_PROVIDER_VERIFICATION).includes(status)) {
        return Object.freeze({ status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE, reason: "INVALID_VERIFIER_STATUS" });
      }
      return Object.freeze({ ...result, status });
    }
  });
}
