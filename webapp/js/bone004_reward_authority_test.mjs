import assert from "node:assert/strict";
import {
  PlayerMetaAuthority,
  createInitialPlayerMetaState,
  createPlayerIdentity
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import {
  SERVER_COMBAT_ATTESTATION_V1,
  assertRewardAuthorityMatchesCombatResult,
  authorizeServerCombatResult,
  canonicalizeServerCombatAttestationPayload
} from "./reward_authority.js";
import {
  applyCombatRewardPipeline,
  createCombatResultFromTurnResult
} from "./reward_pipeline.js";

const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);
const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
const playerId = "bone004-player";
const matchId = "bone004-match-001";
const nonce = "bone004-nonce-001";

class MapStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

function context(extra = {}) {
  return {
    version: SERVER_COMBAT_ATTESTATION_V1,
    matchId,
    playerId,
    nonce,
    publicKeyJwk,
    ...extra
  };
}

function newMeta() {
  const identity = createPlayerIdentity({ playerId });
  return {
    authority: new PlayerMetaAuthority(createInitialPlayerMetaState(identity)),
    persistence: new PlayerMetaPersistenceAdapter({ storage: new MapStorage() })
  };
}

async function createSignedTurn(overrides = {}) {
  const turnResult = {
    type: "TurnResultDTO",
    match_id: overrides.match_id || matchId,
    turn_id: overrides.turn_id || "turn-001",
    result: overrides.result || "VICTORY",
    outcome: overrides.outcome || overrides.result || "VICTORY",
    match_end: true,
    state: { match_complete: true, outcome: overrides.outcome || overrides.result || "VICTORY" }
  };
  const canonical = canonicalizeServerCombatAttestationPayload({
    matchId,
    playerId,
    turnId: turnResult.turn_id,
    outcome: "VICTORY",
    result: "VICTORY",
    nonce
  });
  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(canonical)
  );
  let binary = "";
  for (const byte of new Uint8Array(signatureBuffer)) binary += String.fromCharCode(byte);
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return {
    turnResult,
    attestation: {
      version: SERVER_COMBAT_ATTESTATION_V1,
      algorithm: "ECDSA_P256_SHA256",
      match_id: matchId,
      player_id: playerId,
      turn_id: turnResult.turn_id,
      outcome: "VICTORY",
      result: "VICTORY",
      nonce,
      signature
    }
  };
}

const localMeta = newMeta();
const localTurn = {
  type: "TurnResultDTO",
  match_id: matchId,
  turn_id: "local-turn-001",
  result: "VICTORY",
  outcome: "VICTORY",
  match_end: true,
  state: { match_complete: true, outcome: "VICTORY" }
};
assert.equal(localMeta.authority.getSnapshot().currencies.SCRAP, 0);
assert.throws(() => applyCombatRewardPipeline({
  combatResult: createCombatResultFromTurnResult({
    turnResult: localTurn,
    matchId,
    playerId
  }),
  authority: localMeta.authority,
  persistenceAdapter: localMeta.persistence
}), /REWARD_AUTHORITY_REQUIRED/);
assert.equal(localMeta.authority.getSnapshot().currencies.SCRAP, 0);
console.log("CASE_LOCAL_DEMO = PASS // no reward granted");
console.log("CASE_LOCAL_VICTORY = PASS // PlayerMeta SCRAP remains 0");

const signed = await createSignedTurn();
const validProof = await authorizeServerCombatResult({
  turnResult: signed.turnResult,
  attestation: signed.attestation,
  authorityContext: context()
});
const validCombatResult = createCombatResultFromTurnResult({
  turnResult: signed.turnResult,
  matchId,
  playerId
});
assert.doesNotThrow(() => assertRewardAuthorityMatchesCombatResult(validProof, validCombatResult));
const serverMeta = newMeta();
const firstGrant = applyCombatRewardPipeline({
  combatResult: validCombatResult,
  authority: serverMeta.authority,
  persistenceAdapter: serverMeta.persistence,
  authorityProof: validProof
});
assert.equal(firstGrant.applied.ok, true);
assert.equal(serverMeta.authority.getSnapshot().currencies.SCRAP, 100);
console.log("CASE_SERVER_VALID = PASS // valid signature");

await assert.rejects(
  () => authorizeServerCombatResult({
    turnResult: signed.turnResult,
    attestation: { ...signed.attestation, signature: "" },
    authorityContext: context()
  }),
  /Reward authority rejected/
);
console.log("CASE_FORGED_RESULT = PASS // no signature rejected");

const tamperedOutcome = { ...signed.turnResult, outcome: "DEFEAT", state: { match_complete: true, outcome: "DEFEAT" } };
await assert.rejects(
  () => authorizeServerCombatResult({
    turnResult: tamperedOutcome,
    attestation: signed.attestation,
    authorityContext: context()
  }),
  /Reward authority rejected/
);
console.log("CASE_TAMPERED_OUTCOME = PASS // signature binding rejected");

const wrongMatchTurn = { ...signed.turnResult, match_id: "bone004-other-match" };
await assert.rejects(
  () => authorizeServerCombatResult({
    turnResult: wrongMatchTurn,
    attestation: signed.attestation,
    authorityContext: context()
  }),
  /Reward authority rejected/
);
console.log("CASE_TAMPERED_MATCH = PASS // context mismatch rejected");

await assert.rejects(
  () => authorizeServerCombatResult({
    turnResult: signed.turnResult,
    attestation: signed.attestation,
    authorityContext: context({ playerId: "bone004-other-player" })
  }),
  /Reward authority rejected/
);
console.log("CASE_WRONG_PLAYER = PASS");

await assert.rejects(
  () => authorizeServerCombatResult({
    turnResult: signed.turnResult,
    attestation: signed.attestation,
    authorityContext: context({ nonce: "bone004-other-nonce" })
  }),
  /Reward authority rejected/
);
console.log("CASE_WRONG_NONCE = PASS");

const duplicate = applyCombatRewardPipeline({
  combatResult: validCombatResult,
  authority: serverMeta.authority,
  persistenceAdapter: serverMeta.persistence,
  authorityProof: validProof
});
assert.equal(duplicate.applied.duplicate, true);
assert.equal(serverMeta.authority.getSnapshot().currencies.SCRAP, 100);
console.log("CASE_DUPLICATE = PASS // second grant no-op");

assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...validCombatResult, matchId: "bone004-other-match" },
  authority: serverMeta.authority,
  persistenceAdapter: serverMeta.persistence,
  authorityProof: validProof
}), /MATCH_BINDING_REJECTED/);
assert.equal(serverMeta.authority.getSnapshot().currencies.SCRAP, 100);
console.log("CASE_PROOF_REPLAY_OTHER_MATCH = PASS");

const tamperedResult = {
  ...validCombatResult,
  outcome: "DEFEAT",
  result: "DEFEAT"
};
assert.throws(() => applyCombatRewardPipeline({
  combatResult: tamperedResult,
  authority: serverMeta.authority,
  persistenceAdapter: serverMeta.persistence,
  authorityProof: validProof
}), /OUTCOME_BINDING_REJECTED|RESULT_BINDING_REJECTED/);
assert.equal(serverMeta.authority.getSnapshot().currencies.SCRAP, 100);
console.log("CASE_TAMPERED_PIPELINE_RESULT = PASS");

console.log("BONE-004 REWARD AUTHORITY CONTRACT = PASS");
