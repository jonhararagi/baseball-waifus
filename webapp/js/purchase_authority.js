export const PAYMENT_RESULT = "PAYMENT_RESULT";
export const AUTHORIZED_GRANT = "AUTHORIZED_GRANT";
export const GRANT_STATUS = Object.freeze({
  AUTHORIZED: "authorized",
  BLOCKED: "blocked"
});

function isPaidPayment(paymentResult) {
  return Boolean(
    paymentResult
    && paymentResult.ok === true
    && String(paymentResult.status || "").toLowerCase() === "paid"
  );
}

function matchesGrant(requestedGrant, authorityGrant) {
  if (!requestedGrant || !authorityGrant || typeof authorityGrant !== "object") return false;
  if (authorityGrant.type !== AUTHORIZED_GRANT || authorityGrant.status !== GRANT_STATUS.AUTHORIZED) return false;
  if (String(authorityGrant.kind || "") !== String(requestedGrant.kind || "")) return false;

  if (requestedGrant.kind === "SCRAP") {
    return Number(authorityGrant.amount) === Number(requestedGrant.amount);
  }

  if (requestedGrant.kind === "BOOST") {
    return String(authorityGrant.id || "") === String(requestedGrant.id || "")
      && Number(authorityGrant.turns) === Number(requestedGrant.turns);
  }

  return false;
}

export function authorizePurchaseGrant({
  paymentResult,
  authorityGrant = null,
  requestedGrant,
  environment = "production"
} = {}) {
  if (!isPaidPayment(paymentResult)) {
    return Object.freeze({
      allowed: false,
      status: GRANT_STATUS.BLOCKED,
      reason: "payment_not_paid",
      mode: "NONE"
    });
  }

  const simulated = paymentResult.simulated === true;

  if (simulated && environment === "development" && !authorityGrant) {
    return Object.freeze({
      allowed: true,
      status: GRANT_STATUS.AUTHORIZED,
      reason: "development_simulation",
      mode: "SIMULATED_DEMO_ONLY"
    });
  }

  if (matchesGrant(requestedGrant, authorityGrant)) {
    return Object.freeze({
      allowed: true,
      status: GRANT_STATUS.AUTHORIZED,
      reason: "authority_confirmed",
      mode: "PRODUCTION_AUTHORITY"
    });
  }

  return Object.freeze({
    allowed: false,
    status: GRANT_STATUS.BLOCKED,
    reason: "purchase_authority_absent_or_invalid",
    mode: "PRODUCTION_FAIL_CLOSED"
  });
}
