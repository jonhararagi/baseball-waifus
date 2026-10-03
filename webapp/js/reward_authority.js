export const SERVER_COMBAT_ATTESTATION_V1 = "SERVER_COMBAT_ATTESTATION_V1";
export const SERVER_COMBAT_SIGNATURE_ALGORITHM = "ECDSA_P256_SHA256";

const VERIFIED_PROOFS = new WeakSet();

class RewardAuthorityError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RewardAuthorityError";
    this.code = code;
  }
}

export { RewardAuthorityError };

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireNonEmpty(value, label) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new RewardAuthorityError("INVALID_" + label.toUpperCase(), label + " is required");
  return normalized;
}

function normalizeStableId(value, label) {
  const normalized = requireNonEmpty(value, label);
  if (!/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    throw new RewardAuthorityError("INVALID_" + label.toUpperCase(), label + " must be a stable identifier");
  }
  return normalized;
}

function normalizeOutcome(value) {
  const normalized = String(value ?? "").toUpperCase();
  if (!["VICTORY", "DEFEAT"].includes(normalized)) {
    throw new RewardAuthorityError("INVALID_OUTCOME", "outcome must be VICTORY or DEFEAT");
  }
  return normalized;
}

function normalizeSignatureAlgorithm(value) {
  const normalized = String(value || SERVER_COMBAT_SIGNATURE_ALGORITHM);
  if (normalized !== SERVER_COMBAT_SIGNATURE_ALGORITHM) {
    throw new RewardAuthorityError("UNSUPPORTED_SIGNATURE_ALGORITHM", "Unsupported combat attestation signature algorithm");
  }
  return normalized;
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  if (!normalized) return new Uint8Array();
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new RewardAuthorityError("WEB_CRYPTO_UNAVAILABLE", "Web Crypto is required for reward authority verification");
  }
  return cryptoApi;
}

function textBytes(value) {
  return new TextEncoder().encode(String(value));
}

function normalizePublicKeyJwk(publicKeyJwk) {
  if (!isObject(publicKeyJwk)) {
    throw new RewardAuthorityError("PUBLIC_KEY_REQUIRED", "A server public JWK is required");
  }
  if (publicKeyJwk.kty !== "EC" || publicKeyJwk.crv !== "P-256" || typeof publicKeyJwk.x !== "string" || typeof publicKeyJwk.y !== "string") {
    throw new RewardAuthorityError("INVALID_PUBLIC_KEY", "Expected an EC P-256 public JWK");
  }
  return {
    kty: "EC",
    crv: "P-256",
    x: publicKeyJwk.x,
    y: publicKeyJwk.y
  };
}

export function canonicalizeServerCombatAttestationPayload({
  version = SERVER_COMBAT_ATTESTATION_V1,
  matchId,
  playerId,
  turnId,
  outcome,
  result,
  nonce
} = {}) {
  const canonical = {
    version: requireNonEmpty(version, "version"),
    match_id: normalizeStableId(matchId, "matchId"),
    player_id: normalizeStableId(playerId, "playerId"),
    turn_id: normalizeStableId(turnId, "turnId"),
    outcome: normalizeOutcome(outcome),
    result: requireNonEmpty(result, "result").toUpperCase(),
    nonce: normalizeStableId(nonce, "nonce")
  };
  return JSON.stringify(canonical);
}

function expectedBindingFromTurnResult(turnResult, authorityContext) {
  if (!isObject(turnResult)) {
    throw new RewardAuthorityError("INVALID_TURN_RESULT", "A TurnResultDTO is required");
  }
  if (!isObject(authorityContext)) {
    throw new RewardAuthorityError("AUTHORITY_CONTEXT_REQUIRED", "Server reward authority context is required");
  }

  const result = String(turnResult.result || turnResult.outcome || turnResult.state?.outcome || "").toUpperCase();
  const outcome = String(
    turnResult.outcome
      || turnResult.state?.outcome
      || turnResult.result
      || ""
  ).toUpperCase();

  const binding = {
    version: String(authorityContext.version || SERVER_COMBAT_ATTESTATION_V1),
    matchId: normalizeStableId(authorityContext.matchId, "matchId"),
    playerId: normalizeStableId(authorityContext.playerId, "playerId"),
    turnId: normalizeStableId(turnResult.turn_id, "turnId"),
    outcome: normalizeOutcome(outcome),
    result,
    nonce: normalizeStableId(authorityContext.nonce, "nonce"),
    publicKeyJwk: normalizePublicKeyJwk(authorityContext.publicKeyJwk)
  };

  if (turnResult.match_id !== undefined && String(turnResult.match_id) !== binding.matchId) {
    throw new RewardAuthorityError("TURN_RESULT_MATCH_MISMATCH", "TurnResultDTO match_id does not match reward authority context");
  }

  return binding;
}

export async function verifyServerCombatAttestation({
  turnResult,
  attestation,
  authorityContext
} = {}) {
  try {
    if (!isObject(attestation)) {
      return Object.freeze({ ok: false, reason: "ATTESTATION_MISSING", proof: null });
    }

    const binding = expectedBindingFromTurnResult(turnResult, authorityContext);
    const attestationVersion = String(attestation.version || "");
    if (attestationVersion !== binding.version) {
      return Object.freeze({ ok: false, reason: "ATTESTATION_VERSION_MISMATCH", proof: null });
    }

    const attestationFields = {
      matchId: normalizeStableId(attestation.match_id, "attestation.matchId"),
      playerId: normalizeStableId(attestation.player_id, "attestation.playerId"),
      turnId: normalizeStableId(attestation.turn_id, "attestation.turnId"),
      outcome: normalizeOutcome(attestation.outcome),
      result: requireNonEmpty(attestation.result, "attestation.result").toUpperCase(),
      nonce: normalizeStableId(attestation.nonce, "attestation.nonce")
    };

    if (attestationFields.matchId !== binding.matchId) return Object.freeze({ ok: false, reason: "MATCH_BINDING_REJECTED", proof: null });
    if (attestationFields.playerId !== binding.playerId) return Object.freeze({ ok: false, reason: "PLAYER_BINDING_REJECTED", proof: null });
    if (attestationFields.turnId !== binding.turnId) return Object.freeze({ ok: false, reason: "TURN_BINDING_REJECTED", proof: null });
    if (attestationFields.outcome !== binding.outcome) return Object.freeze({ ok: false, reason: "OUTCOME_BINDING_REJECTED", proof: null });
    if (attestationFields.result !== binding.result) return Object.freeze({ ok: false, reason: "RESULT_BINDING_REJECTED", proof: null });
    if (attestationFields.nonce !== binding.nonce) return Object.freeze({ ok: false, reason: "NONCE_BINDING_REJECTED", proof: null });

    normalizeSignatureAlgorithm(attestation.algorithm);
    if (typeof attestation.signature !== "string" || !attestation.signature) {
      return Object.freeze({ ok: false, reason: "SIGNATURE_MISSING", proof: null });
    }

    const cryptoApi = getCrypto();
    const publicKey = await cryptoApi.subtle.importKey(
      "jwk",
      binding.publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const signatureValid = await cryptoApi.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      base64UrlToBytes(attestation.signature),
      textBytes(canonicalizeServerCombatAttestationPayload(binding))
    );

    if (!signatureValid) {
      return Object.freeze({ ok: false, reason: "SIGNATURE_INVALID", proof: null });
    }

    const proof = Object.freeze({
      type: "SERVER_REWARD_AUTHORITY_PROOF",
      version: binding.version,
      matchId: binding.matchId,
      playerId: binding.playerId,
      turnId: binding.turnId,
      outcome: binding.outcome,
      result: binding.result,
      nonce: binding.nonce
    });
    VERIFIED_PROOFS.add(proof);

    return Object.freeze({ ok: true, reason: null, proof });
  } catch (error) {
    if (error instanceof RewardAuthorityError) {
      return Object.freeze({ ok: false, reason: error.code, proof: null });
    }
    return Object.freeze({ ok: false, reason: "ATTESTATION_VERIFICATION_ERROR", proof: null });
  }
}

export async function authorizeServerCombatResult(options = {}) {
  const verification = await verifyServerCombatAttestation(options);
  if (!verification.ok || !verification.proof) {
    throw new RewardAuthorityError(
      verification.reason || "REWARD_AUTHORITY_REJECTED",
      "Reward authority rejected: " + String(verification.reason || "UNKNOWN")
    );
  }
  return verification.proof;
}

export function assertServerRewardAuthorityProof(proof) {
  if (!proof || typeof proof !== "object" || !VERIFIED_PROOFS.has(proof)) {
    throw new RewardAuthorityError(
      "REWARD_AUTHORITY_REQUIRED",
      "Economic reward requires a verified server reward authority proof"
    );
  }
  return proof;
}

export function assertRewardAuthorityMatchesCombatResult(proof, combatResult) {
  assertServerRewardAuthorityProof(proof);
  if (!combatResult || combatResult.type !== "COMBAT_RESULT") {
    throw new RewardAuthorityError("INVALID_COMBAT_RESULT", "COMBAT_RESULT is required");
  }
  const result = String(combatResult.result || combatResult.outcome || "").toUpperCase();
  if (proof.matchId !== String(combatResult.matchId || "")) {
    throw new RewardAuthorityError("MATCH_BINDING_REJECTED", "Authority proof does not match combat result match");
  }
  if (proof.playerId !== String(combatResult.playerId || "")) {
    throw new RewardAuthorityError("PLAYER_BINDING_REJECTED", "Authority proof does not match combat result player");
  }
  if (proof.turnId !== String(combatResult.turnId || "")) {
    throw new RewardAuthorityError("TURN_BINDING_REJECTED", "Authority proof does not match combat result turn");
  }
  if (proof.outcome !== String(combatResult.outcome || "").toUpperCase()) {
    throw new RewardAuthorityError("OUTCOME_BINDING_REJECTED", "Authority proof does not match combat result outcome");
  }
  if (proof.result !== result) {
    throw new RewardAuthorityError("RESULT_BINDING_REJECTED", "Authority proof does not match combat result");
  }
  return proof;
}
