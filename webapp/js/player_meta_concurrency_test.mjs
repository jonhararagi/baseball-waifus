import assert from "node:assert/strict";
import {
  PlayerMetaAuthority,
  createInitialPlayerMetaState,
  createPlayerIdentity
} from "./player_meta_state.js";
import {
  PlayerMetaPersistenceAdapter,
  PlayerMetaPersistenceError
} from "./player_meta_persistence_adapter.js";
import { applyRewardResultToPlayerMeta } from "./player_meta_reward_adapter.js";
import { createPlayerMetaRosterIntegration } from "./player_meta_roster_integration.js";

class AtomicMemoryStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  compareAndSet(key, expectedValue, nextValue) {
    const current = this.getItem(key);
    if (current !== (expectedValue === null ? null : String(expectedValue))) return false;
    this.data.set(key, String(nextValue));
    return true;
  }
  removeItem(key) {
    this.data.delete(key);
  }
}

const identity = createPlayerIdentity({
  playerId: "concurrency-player",
  provider: "telegram",
  telegramUserId: "7001"
});
const storage = new AtomicMemoryStorage();
const seedAdapter = new PlayerMetaPersistenceAdapter({ storage });
const seedAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));

seedAuthority.dispatchBatch([
  { type: "ADD_CHARACTER", characterId: "bw001", quantity: 1 },
  { type: "ADD_CHARACTER", characterId: "bw003", quantity: 1 },
  { type: "ADD_CHARACTER", characterId: "bw004", quantity: 1 },
  { type: "SET_ROSTER", activeBatter: "bw001", supports: ["bw003", "bw004"] }
]);
assert.equal(seedAdapter.save(seedAuthority.getSnapshot()).revision, 1);

const rewardResult = {
  type: "REWARD_RESULT",
  deterministic: true,
  sourceEventId: "battle:match-001",
  rewards: [{ kind: "CURRENCY", currency: "SCRAP", amount: 100 }]
};

const rewardAdapterA = new PlayerMetaPersistenceAdapter({ storage });
const rewardAdapterB = new PlayerMetaPersistenceAdapter({ storage });
const rewardAuthorityA = new PlayerMetaAuthority(rewardAdapterA.load(identity));
const rewardAuthorityB = new PlayerMetaAuthority(rewardAdapterB.load(identity));

const rewardA = applyRewardResultToPlayerMeta({
  authority: rewardAuthorityA,
  rewardResult,
  persistenceAdapter: rewardAdapterA
});
assert.equal(rewardA.ok, true);
assert.equal(rewardA.duplicate, false);
assert.equal(rewardA.snapshot.currencies.SCRAP, 100);

const rewardB = applyRewardResultToPlayerMeta({
  authority: rewardAuthorityB,
  rewardResult,
  persistenceAdapter: rewardAdapterB
});
assert.equal(rewardB.ok, true);
assert.equal(rewardB.duplicate, true);
assert.equal(rewardB.snapshot.currencies.SCRAP, 100);

const afterReward = new PlayerMetaPersistenceAdapter({ storage }).load(identity);
assert.equal(afterReward.currencies.SCRAP, 100);
assert.equal(afterReward.rewardLedger["battle:match-001"], true);

// Two contexts: reward wins first, roster reloads and reapplies against the new revision.
const contextAdapterA = new PlayerMetaPersistenceAdapter({ storage });
const contextAdapterB = new PlayerMetaPersistenceAdapter({ storage });
const contextAuthorityA = new PlayerMetaAuthority(contextAdapterA.load(identity));
const contextAuthorityB = new PlayerMetaAuthority(contextAdapterB.load(identity));

const secondReward = {
  ...rewardResult,
  sourceEventId: "battle:match-002"
};
assert.equal(applyRewardResultToPlayerMeta({
  authority: contextAuthorityA,
  rewardResult: secondReward,
  persistenceAdapter: contextAdapterA
}).duplicate, false);

const rosterContext = createPlayerMetaRosterIntegration({
  playerMetaIntegration: {
    authority: contextAuthorityB,
    persistenceAdapter: contextAdapterB
  }
});
assert.deepEqual(
  rosterContext.setRoster({
    activeBatter: "bw003",
    supports: ["bw001", "bw004"]
  }),
  { active_batter: "bw003", supports: ["bw001", "bw004"] }
);

const afterRosterRace = new PlayerMetaPersistenceAdapter({ storage }).load(identity);
assert.equal(afterRosterRace.currencies.SCRAP, 200);
assert.deepEqual(afterRosterRace.roster, {
  activeBatter: "bw003",
  supports: ["bw001", "bw004"]
});

// Inventory vs roster: one context removes the last copy, which atomically repairs the roster.
const inventoryAdapter = new PlayerMetaPersistenceAdapter({ storage });
const rosterAdapter = new PlayerMetaPersistenceAdapter({ storage });
const inventoryAuthority = new PlayerMetaAuthority(inventoryAdapter.load(identity));
const rosterAuthority = new PlayerMetaAuthority(rosterAdapter.load(identity));

inventoryAuthority.dispatch({ type: "REMOVE_CHARACTER", characterId: "bw003", quantity: 1 });
inventoryAdapter.save(inventoryAuthority.getSnapshot());

const staleRoster = createPlayerMetaRosterIntegration({
  playerMetaIntegration: {
    authority: rosterAuthority,
    persistenceAdapter: rosterAdapter
  }
});
assert.throws(
  () => staleRoster.setActiveBatter("bw003"),
  /ACTIVE_BATTER_NOT_UNLOCKED|SUPPORT_NOT_UNLOCKED/
);

const afterInventoryRace = new PlayerMetaPersistenceAdapter({ storage }).load(identity);
assert.equal(afterInventoryRace.inventory.characters.bw003.unlocked, false);
assert.equal(afterInventoryRace.inventory.characters.bw003.quantity, 0);
assert.equal(afterInventoryRace.roster.activeBatter, null);
assert.equal(afterInventoryRace.roster.supports.includes("bw003"), false);

// TWO WRITERS -> ONE STALE -> NO LOST UPDATE: device B reloads revision N+1 and retries at N+2.
const deviceAAdapter = new PlayerMetaPersistenceAdapter({ storage });
const deviceBAdapter = new PlayerMetaPersistenceAdapter({ storage });
const deviceAAuthority = new PlayerMetaAuthority(deviceAAdapter.load(identity));
const deviceBAuthority = new PlayerMetaAuthority(deviceBAdapter.load(identity));

deviceAAuthority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 11 });
deviceAAdapter.save(deviceAAuthority.getSnapshot());

deviceBAuthority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 7 });
assert.throws(
  () => deviceBAdapter.save(deviceBAuthority.getSnapshot()),
  (error) => error instanceof PlayerMetaPersistenceError && error.code === "STALE_WRITE"
);

const latestForB = deviceBAdapter.load(identity);
deviceBAuthority.replaceSnapshot(latestForB);
deviceBAuthority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 7 });
deviceBAdapter.save(deviceBAuthority.getSnapshot());

const deviceFinal = deviceBAdapter.load(identity);
assert.equal(deviceFinal.currencies.FRAGMENTS, 18);

// Restart: a fresh adapter recovers the latest revision and complete state.
const restarted = new PlayerMetaPersistenceAdapter({ storage });
const restartedState = restarted.load(identity);
assert.equal(restarted.getRevision(), deviceBAdapter.getRevision());
assert.equal(restartedState.currencies.SCRAP, 200);
assert.equal(restartedState.currencies.FRAGMENTS, 18);
assert.equal(restartedState.roster.activeBatter, null);
assert.equal(restartedState.inventory.characters.bw003.quantity, 0);

// Identity isolation remains preserved under the same backing storage.
const otherIdentity = createPlayerIdentity({
  playerId: "concurrency-player-other",
  provider: "telegram",
  telegramUserId: "7002"
});
const otherAdapter = new PlayerMetaPersistenceAdapter({ storage });
const otherAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(otherIdentity));
otherAuthority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 55 });
otherAdapter.save(otherAuthority.getSnapshot());
assert.equal(new PlayerMetaPersistenceAdapter({ storage }).load(otherIdentity).currencies.SCRAP, 55);
assert.equal(new PlayerMetaPersistenceAdapter({ storage }).load(identity).currencies.SCRAP, 200);

console.log("player_meta_concurrency_test: PASS");
