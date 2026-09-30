import assert from "node:assert/strict";
import { PlayerMetaAuthority, createInitialPlayerMetaState, createPlayerIdentity } from "./player_meta_state.js";
import { resolveBattleRewards } from "./reward_resolver.js";
import { applyRewardResultToPlayerMeta } from "./player_meta_reward_adapter.js";

function fresh() {
  return new PlayerMetaAuthority(
    createInitialPlayerMetaState(createPlayerIdentity({ playerId: "reward-test" }))
  );
}

const battleResult = Object.freeze({
  type: "COMBAT_RESULT",
  playerId: "reward-test",
  outcome: "VICTORY",
  damage: 180
});

const authority = fresh();
const before = authority.getSnapshot();

const rewardResult = resolveBattleRewards({
  battleResult,
  sourceEventId: "battle-001",
  rewards: [
    { kind: "CURRENCY", currency: "SCRAP", amount: 100 },
    { kind: "CHARACTER", characterId: "bw001", quantity: 1 },
    { kind: "UNLOCK", id: "training_clear", unlocked: true }
  ]
});

assert.equal(rewardResult.type, "REWARD_RESULT");
assert.equal(rewardResult.deterministic, true);
assert.equal(rewardResult.rewards.length, 3);
assert.strictEqual(authority.getSnapshot(), before);

const serializedReward = JSON.stringify(rewardResult);
const repeatReward = resolveBattleRewards({
  battleResult,
  sourceEventId: "battle-001",
  rewards: rewardResult.rewards
});
assert.equal(JSON.stringify(repeatReward), serializedReward);

const applied = applyRewardResultToPlayerMeta({
  authority,
  rewardResult
});

assert.equal(applied.ok, true);
assert.equal(applied.snapshot.currencies.SCRAP, 100);
assert.deepEqual(applied.snapshot.inventory.characters.bw001, { quantity: 1, unlocked: true });
assert.equal(applied.snapshot.unlocks.training_clear, true);
assert.notStrictEqual(applied.snapshot, before);

const otherAuthority = fresh();
assert.equal(otherAuthority.getSnapshot().currencies.SCRAP, 0);
assert.equal(otherAuthority.getSnapshot().inventory.characters.bw001, undefined);

const badReward = {
  ...rewardResult,
  rewards: [{ kind: "CURRENCY", currency: "UNKNOWN", amount: 10 }]
};
assert.throws(() => resolveBattleRewards({
  battleResult,
  sourceEventId: "battle-002",
  rewards: badReward.rewards
}), /currency/);

assert.throws(() => applyRewardResultToPlayerMeta({
  authority,
  rewardResult: {
    ...rewardResult,
    type: "NOT_REWARD_RESULT"
  }
}), /REWARD_RESULT/);

console.log("reward_meta_foundation_test: PASS");
