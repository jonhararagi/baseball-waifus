export const PURCHASE_PROVIDER_VERIFICATION = Object.freeze({
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  UNAVAILABLE: "UNAVAILABLE"
});

function normalizeVerificationResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return Object.freeze({
      status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
      reason: "INVALID_VERIFIER_RESPONSE"
    });
  }
  const status = String(result.status || "").toUpperCase();
  if (!Object.values(PURCHASE_PROVIDER_VERIFICATION).includes(status)) {
    return Object.freeze({
      status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
      reason: "INVALID_VERIFIER_STATUS"
    });
  }
  return Object.freeze({ ...result, status });
}

function normalizeCallbackInput(input = {}) {
  const headers = input.headers && typeof input.headers === "object" && !Array.isArray(input.headers)
    ? Object.freeze({ ...input.headers })
    : Object.freeze({});
  return Object.freeze({
    ...input,
    headers,
    rawBody: input.rawBody ?? null,
    body: input.body ?? null
  });
}

function invokeVerifier(fn, input) {
  return Promise.resolve(fn(normalizeCallbackInput(input))).then(normalizeVerificationResult);
}

export function createPurchaseProviderVerifier({
  verifyReceipt,
  verifyPurchaseCallback = null
} = {}) {
  if (typeof verifyReceipt !== "function" && typeof verifyPurchaseCallback !== "function") {
    throw new TypeError("PurchaseProviderVerifier requires verifyReceipt or verifyPurchaseCallback");
  }

  return Object.freeze({
    async verifyReceipt(input) {
      if (typeof verifyReceipt !== "function") {
        return Object.freeze({
          status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
          reason: "RECEIPT_VERIFIER_NOT_CONFIGURED"
        });
      }
      return invokeVerifier(verifyReceipt, input);
    },

    async verifyPurchaseCallback(input) {
      if (typeof verifyPurchaseCallback !== "function") {
        return Object.freeze({
          status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE,
          reason: "CALLBACK_VERIFIER_NOT_CONFIGURED"
        });
      }
      return invokeVerifier(verifyPurchaseCallback, input);
    }
  });
}
