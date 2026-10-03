import { createPrivateKey, createPublicKey, generateKeyPairSync, sign } from "node:crypto";
import {
  canonicalizeServerCombatAttestationPayload,
  SERVER_COMBAT_ATTESTATION_V1,
  SERVER_COMBAT_SIGNATURE_ALGORITHM
} from "../../webapp/js/reward_authority.js";
import { AuthorityError } from "./errors.mjs";

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function assertP256(keyObject) {
  if (keyObject?.asymmetricKeyType !== "ec") {
    throw new AuthorityError(500, "SIGNING_KEY_INVALID", "Reward signing key must be an EC key");
  }
  const curve = keyObject.asymmetricKeyDetails?.namedCurve;
  if (curve && curve !== "prime256v1") {
    throw new AuthorityError(500, "SIGNING_KEY_CURVE_INVALID", "Reward signing key must use P-256");
  }
}

export function createEphemeralTestSigner() {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return createAttestationSigner({ privateKey });
}

export function createAttestationSigner({ privateKeyPem = "", privateKey = null } = {}) {
  const key = privateKey || (privateKeyPem ? createPrivateKey(privateKeyPem) : null);
  if (!key) throw new AuthorityError(503, "REWARD_SIGNER_NOT_CONFIGURED", "Reward signing private key is not configured");
  assertP256(key);
  const publicKeyJwk = createPublicKey(key).export({ format: "jwk" });

  return Object.freeze({
    publicKeyJwk: Object.freeze({
      kty: "EC",
      crv: "P-256",
      x: String(publicKeyJwk.x),
      y: String(publicKeyJwk.y)
    }),
    signAttestation({ matchId, playerId, turnId, outcome, result, nonce }) {
      const payload = canonicalizeServerCombatAttestationPayload({
        version: SERVER_COMBAT_ATTESTATION_V1,
        matchId, playerId, turnId, outcome, result, nonce
      });
      const signature = sign("sha256", Buffer.from(payload, "utf8"), {
        key,
        dsaEncoding: "ieee-p1363"
      });
      return Object.freeze({
        version: SERVER_COMBAT_ATTESTATION_V1,
        algorithm: SERVER_COMBAT_SIGNATURE_ALGORITHM,
        match_id: String(matchId),
        player_id: String(playerId),
        turn_id: String(turnId),
        outcome: String(outcome).toUpperCase(),
        result: String(result).toUpperCase(),
        nonce: String(nonce),
        signature: base64Url(signature)
      });
    }
  });
}
