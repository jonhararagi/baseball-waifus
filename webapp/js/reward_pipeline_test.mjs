import assert from "node:assert/strict";
import {
  PlayerMetaAuthority,
  createInitialPlayerMetaState,
  createPlayerIdentity
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import {
  applyCombatRewardPipeline,
  createCombatResultFromTurnResult
} from "./reward_pipeline.js";

class MemoryStorage {
  constructor({ failWrites = false } = {}) { this.map = new Map(); this.failWrites = failWrites; }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { if (this.failWrites) throw new Error("PERSISTENCE_FAIL"); this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const storage = new MemoryStorage();
const identity = createPlayerIdentity({ playerId: "reward-pipeline-player" });
const persistence = new PlayerMetaPersistenceAdapter({ storage });
const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));

const turnResult = Object.freeze({
  type: "TurnResultDTO",
  match_id: "student-4v4-real-001",
  result: "VICTORY",
  match_end: true,
  state: { match_complete: true },
  damage: 180
});

const combatResult = createCombatResultFromTurnResult({
  turnResult,
  matchId: turnResult.match_id,
  playerId: identity.playerId
});
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.outcome, "VICTORY");

const first = applyCombatRewardPipeline({
  combatResult,
  authority,
  persistenceAdapter: persistence
});
assert.equal(first.rewardResult.type, "REWARD_RESULT");
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
  persistenceAdapter: persistence
});
assert.equal(duplicate.applied.ok, true);
assert.equal(duplicate.applied.duplicate, true);
assert.equal(authority.getSnapshot().currencies.SCRAP, 100);

const rehydrated = new PlayerMetaAuthority(persistence.load(identity));
assert.equal(rehydrated.getSnapshot().currencies.SCRAP, 100);
assert.equal(rehydrated.hasAppliedReward(combatResult.battleId), true);

const failingAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(createPlayerIdentity({ playerId: "atomic-player" })));
const failingStorage = new MemoryStorage({ failWrites: true });
const failingPersistence = new PlayerMetaPersistenceAdapter({ storage: failingStorage });
assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...combatResult, battleId: "battle:atomic-001" },
  authority: failingAuthority,
  persistenceAdapter: failingPersistence
}), /PlayerMetaPersistenceError/);
assert.equal(failingAuthority.getSnapshot().currencies.SCRAP, 0);
assert.equal(failingAuthority.hasAppliedReward("battle:atomic-001"), false);

const defeat = createCombatResultFromTurnResult({
  turnResult: {
    ...turnResult,
    match_id: "student-4v4-real-002",
    result: "DEFEAT",
    match_end: true,
    state: { match_complete: true }
  },
  matchId: "student-4v4-real-002",
  playerId: identity.playerId
});
const defeatApplied = applyCombatRewardPipeline({
  combatResult: defeat,
  authority: rehydrated,
  persistenceAdapter: persistence
});
assert.deepEqual(defeatApplied.rewardResult.rewards, []);
assert.equal(rehydrated.getSnapshot().currencies.SCRAP, 100);

const isolated = new PlayerMetaAuthority(
  createInitialPlayerMetaState(createPlayerIdentity({ playerId: "other-player" }))
);
assert.equal(isolated.getSnapshot().currencies.SCRAP, 0);

const beforeInvalid = authority.getSnapshot();
assert.throws(() => applyCombatRewardPipeline({
  combatResult: { ...combatResult, battleId: "bad id" },
  authority,
  persistenceAdapter: persistence
}), /stable identifier/);
assert.strictEqual(authority.getSnapshot(), beforeInvalid);

console.log("reward_pipeline_test: PASS");
