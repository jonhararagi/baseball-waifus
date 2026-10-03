import assert from "node:assert/strict";
import {
  PlayerMetaAuthority,
  createInitialPlayerMetaState,
  createPlayerIdentity
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { resolveClimaxTurn } from "./combat_core.js";
import {
  applyCombatRewardPipeline,
  createCombatResultFromTurnResult
} from "./reward_pipeline.js";
import {
  SERVER_COMBAT_ATTESTATION_V1,
  authorizeServerCombatResult,
  canonicalizeServerCombatAttestationPayload
} from "./reward_authority.js";

class MemoryStorage {
  constructor({ failWrites = false } = {}) { this.map = new Map(); this.failWrites = failWrites; }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { if (this.failWrites) throw new Error("PERSISTENCE_FAIL"); this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const identity = createPlayerIdentity({ playerId: "reward-pipeline-player" });
const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
const authorityNonce = "reward-pipeline-nonce";

async function createAuthorityProof(turnResult, matchId) {
  const canonical = canonicalizeServerCombatAttestationPayload({
    matchId,
    playerId: identity.playerId,
    turnId: turnResult.turn_id,
    outcome: String(turnResult.result || turnResult.outcome || turnResult.state?.outcome || "").toUpperCase(),
    result: String(turnResult.result || "").toUpperCase(),
    nonce: authorityNonce
  });
  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(canonical)
  );
  let binary = "";
  for (const byte of new Uint8Array(signatureBuffer)) binary += String.fromCharCode(byte);
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return authorizeServerCombatResult({
    turnResult,
    attestation: {
      version: SERVER_COMBAT_ATTESTATION_V1,
      algorithm: "ECDSA_P256_SHA256",
      match_id: matchId,
      player_id: identity.playerId,
      turn_id: turnResult.turn_id,
      outcome: String(turnResult.result || turnResult.outcome || turnResult.state?.outcome || "").toUpperCase(),
      result: String(turnResult.result || "").toUpperCase(),
      nonce: authorityNonce,
      signature
    },
    authorityContext: {
      version: SERVER_COMBAT_ATTESTATION_V1,
      matchId,
      playerId: identity.playerId,
      nonce: authorityNonce,
      publicKeyJwk
    }
  });
}

function makeTurnResult(matchId, turnId, result, stateOverrides = {}) {
  return {
    type: "TurnResultDTO",
    match_id: matchId,
    turn_id: turnId,
    result,
    match_end: true,
    state: { match_complete: true, outcome: result, ...stateOverrides }
  };
}

function makeMeta(storage = new MemoryStorage()) {
  return {
    authority: new PlayerMetaAuthority(createInitialPlayerMetaState(identity)),
    persistence: new PlayerMetaPersistenceAdapter({ storage })
  };
}

const storage = new MemoryStorage();
const { authority, persistence } = makeMeta(storage);
const turnResult = makeTurnResult("student-4v4-real-001", "turn-001", "VICTORY");
const combatResult = createCombatResultFromTurnResult({
  turnResult,
  matchId: turnResult.match_id,
  playerId: identity.playerId
});
const proof = await createAuthorityProof(turnResult, turnResult.match_id);

assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.outcome, "VICTORY");
assert.equal(combatResult.turnId, "turn-001");

const first = applyCombatRewardPipeline({
  combatResult,
  authority,
  persistenceAdapter: persistence,
  authorityProof: proof
});
assert.equal(first.rewardResult.type, "REWARD_RESULT");
assert.equal(first.rewardResult.battleId, combatResult.battleId);
assert.equal(first.rewardResult.reason, "BATTLE_VICTORY_BASELINE");
assert.deepEqual(first.rewardResult.rewards, [{ kind: "CURRENCY", currency: "SCRAP", amount: 100 }]);
assert.equal(first.applied.ok, true);
assert.equal(first.applied.duplicate, false);
assert.equal(first.applied.snapshot.currencies.SCRAP, 100);
assert.equal(first.rewardEvent.type, "REWARD_GRANTED");
assert.equal(first.presentation.type, "UI");
assert.equal(first.presentation.payload.rewards[0].amount, 100);

const duplicate = applyCombatRewardPipeline({
  combatResult,
  authority,
  persistenceAdapter: persistence,
  authorityProof: proof
});
assert.equal(duplicate.applied.ok, true);
assert.equal(duplicate.applied.duplicate, true);
assert.equal(duplicate.rewardEvent, null);
assert.equal(duplicate.presentation, null);
assert.equal(authority.getSnapshot().currencies.SCRAP, 100);

const rehydrated = new PlayerMetaAuthority(persistence.load(identity));
assert.equal(rehydrated.getSnapshot().currencies.SCRAP, 100);
assert.equal(rehydrated.hasAppliedReward(combatResult.battleId), true);

const failingAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
const failingPersistence = new PlayerMetaPersistenceAdapter({ storage: new MemoryStorage({ failWrites: true }) });
assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...combatResult, battleId: "battle:atomic-001" },
  authority: failingAuthority,
  persistenceAdapter: failingPersistence,
  authorityProof: proof
}), /PlayerMetaPersistenceError/);
assert.equal(failingAuthority.getSnapshot().currencies.SCRAP, 0);
assert.equal(failingAuthority.hasAppliedReward("battle:atomic-001"), false);

const defeatTurn = makeTurnResult("student-4v4-real-002", "turn-002", "DEFEAT");
const defeat = createCombatResultFromTurnResult({
  turnResult: defeatTurn,
  matchId: defeatTurn.match_id,
  playerId: identity.playerId
});
const defeatProof = await createAuthorityProof(defeatTurn, defeatTurn.match_id);
const defeatApplied = applyCombatRewardPipeline({
  combatResult: defeat,
  authority: rehydrated,
  persistenceAdapter: persistence,
  authorityProof: defeatProof
});
assert.deepEqual(defeatApplied.rewardResult.rewards, []);
assert.equal(defeatApplied.rewardResult.reason, "NO_REWARD_ON_DEFEAT");
assert.equal(defeatApplied.rewardEvent?.type, "REWARD_GRANTED");
assert.equal(defeatApplied.presentation?.type, "UI");
assert.equal(rehydrated.getSnapshot().currencies.SCRAP, 100);

const realCombatCoreResult = resolveClimaxTurn({
  grade: "GREAT",
  bossHp: 1,
  bossMaxHp: 100,
  internalEnergy: 100,
  tacticalEffectiveness: 100,
  round: 1
});
assert.equal(realCombatCoreResult.type, "COMBAT_RESULT");
assert.equal(realCombatCoreResult.victory, true);
const realTurn = {
  ...realCombatCoreResult,
  ...makeTurnResult("real-combat-core-001", "turn-003", "VICTORY")
};
const realCombatResult = createCombatResultFromTurnResult({
  turnResult: realTurn,
  matchId: realTurn.match_id,
  playerId: identity.playerId
});
assert.equal(realCombatResult.outcome, "VICTORY");

const realDefeatCore = resolveClimaxTurn({
  grade: "MISS",
  bossHp: 50,
  bossMaxHp: 100,
  internalEnergy: 0,
  tacticalEffectiveness: 0,
  round: 3,
  playerStamina: 25,
  playerStaminaMax: 100
});
assert.equal(realDefeatCore.outcome, "DEFEAT");
assert.equal(realDefeatCore.match_end, true);
const realDefeatTurn = {
  ...realDefeatCore,
  ...makeTurnResult("real-combat-core-defeat-001", "turn-004", "DEFEAT")
};
const realDefeatResult = createCombatResultFromTurnResult({
  turnResult: realDefeatTurn,
  matchId: realDefeatTurn.match_id,
  playerId: identity.playerId
});
const realDefeatProof = await createAuthorityProof(realDefeatTurn, realDefeatTurn.match_id);
const realDefeatApplied = applyCombatRewardPipeline({
  combatResult: realDefeatResult,
  authority: rehydrated,
  persistenceAdapter: persistence,
  authorityProof: realDefeatProof
});
assert.equal(realDefeatApplied.rewardResult.reason, "NO_REWARD_ON_DEFEAT");
assert.deepEqual(realDefeatApplied.rewardResult.rewards, []);
assert.equal(realDefeatApplied.applied.ok, true);
assert.equal(realDefeatApplied.applied.duplicate, false);
assert.equal(rehydrated.getSnapshot().currencies.SCRAP, 100);

assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...combatResult, battleId: "battle:atomic-actions" },
  authority: rehydrated,
  persistenceAdapter: persistence
}), /REWARD_AUTHORITY_REQUIRED/);

assert.throws(() => createCombatResultFromTurnResult({
  turnResult: { ...turnResult, result: "HOME_RUN" },
  matchId: "unknown-terminal-001",
  playerId: identity.playerId
}), /terminal combat outcome/);

const beforeInvalid = authority.getSnapshot();
assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...combatResult, battleId: "bad id" },
  authority,
  persistenceAdapter: persistence,
  authorityProof: proof
}), /stable identifier/);
assert.strictEqual(authority.getSnapshot(), beforeInvalid);

console.log("reward_pipeline_test: PASS");
