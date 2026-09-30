import assert from "node:assert/strict";
import {
  createInitialPlayerMetaState,
  createPlayerIdentity,
  PlayerMetaAuthority
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { GachaController, SCAVENGER_SCRAP_COST } from "./gacha_controller.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

const schema = {
  gacha: {
    rates: { status: "active_canonical_game_table_v1", R: 80, SR: 15, SSR: 4, UR: 1 },
    pity: {
      model: "per_banner_counter",
      soft_pity: { enabled: true, start_pull: 61, increment_per_pull_percent: 0.5 },
      hard_pity: { enabled: true, pull_limit: 80 }
    }
  }
};

const queue = {
  batch_units: [
    { character_id: "bw-r", canonical: { display_name: "R Unit", rarity: "R" } },
    { character_id: "bw-sr", canonical: { display_name: "SR Unit", rarity: "SR" } },
    { character_id: "bw-ssr", canonical: { display_name: "SSR Unit", rarity: "SSR" } },
    { character_id: "bw-ur", canonical: { display_name: "UR Unit", rarity: "UR" } }
  ]
};

function fetchImpl(url) {
  const payload = String(url).includes("game_schemas") ? schema : queue;
  return Promise.resolve({ ok: true, json: async () => payload });
}

function seededController(storage, playerId, rngValues = [0.1, 0]) {
  const identity = createPlayerIdentity({ playerId });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: SCAVENGER_SCRAP_COST });
  adapter.save(authority.getSnapshot());
  let index = 0;
  return new GachaController({
    storage,
    playerMetaStorage: storage,
    playerMetaIdentity: identity,
    playerMetaPersistenceAdapter: adapter,
    playerMetaAuthority: new PlayerMetaAuthority(adapter.load(identity)),
    fetchImpl,
    rng: () => rngValues[Math.min(index++, rngValues.length - 1)],
    now: () => 123456789
  });
}

// BASIC: official Gacha resolution updates PlayerMetaAuthority through the integration boundary.
const storageA = new MemoryStorage();
const controllerA = seededController(storageA, "player-a");
await controllerA.initialize();
const resultA = await controllerA.rollGacha();
const snapshotA = controllerA.playerMetaIntegration.getSnapshot();
assert.equal(resultA.rarity, "R");
assert.equal(snapshotA.currencies.SCRAP, 0);
assert.equal(snapshotA.inventory.characters[resultA.character.character_id].quantity, 1);
assert.equal(snapshotA.inventory.characters[resultA.character.character_id].unlocked, true);
assert.equal(snapshotA.gacha.pullsSinceUR, 1);
assert.equal(Object.isFrozen(snapshotA), true);
assert.equal(Object.isFrozen(snapshotA.inventory), true);
assert.equal(Object.isFrozen(snapshotA.gacha), true);

// PERSISTENCE / REHYDRATION: the Player Meta snapshot survives save/load and remains the Gacha read model.
const rehydrated = new PlayerMetaPersistenceAdapter({ storage: storageA }).load(snapshotA.identity);
assert.deepEqual(rehydrated, snapshotA);
const controllerReloaded = new GachaController({
  storage: storageA,
  playerMetaStorage: storageA,
  playerMetaIdentity: snapshotA.identity,
  playerMetaPersistenceAdapter: new PlayerMetaPersistenceAdapter({ storage: storageA }),
  playerMetaAuthority: new PlayerMetaAuthority(rehydrated),
  fetchImpl,
  rng: () => 0,
  now: () => 123456789
});
await controllerReloaded.initialize();
assert.equal(controllerReloaded.getScavengerScrap(), 0);
assert.equal(controllerReloaded.getStatus().pulls_since_UR, 1);
assert.equal(controllerReloaded.getState().inventory[resultA.character.character_id].duplicate_count, 1);

// DETERMINISM: same initial state, seed/input stream and configuration produce the same result/state.
const storageB = new MemoryStorage();
const controllerB = seededController(storageB, "player-b");
await controllerB.initialize();
const resultB = await controllerB.rollGacha();
assert.deepEqual(
  { rarity: resultB.rarity, characterId: resultB.character.character_id, pity: resultB.pulls_since_UR },
  { rarity: resultA.rarity, characterId: resultA.character.character_id, pity: resultA.pulls_since_UR }
);
assert.equal(controllerB.playerMetaIntegration.getSnapshot().currencies.SCRAP, snapshotA.currencies.SCRAP);

// INVALID INPUT: malformed pull payloads and insufficient currency are rejected without state corruption.
assert.throws(
  () => controllerA.playerMetaIntegration.applyPull({ characterId: "", cost: 1000, pullsSinceUR: 2 }),
  /characterId is required/
);
assert.throws(
  () => controllerA.playerMetaIntegration.applyPull({ characterId: "bw-r", cost: 1000, pullsSinceUR: 2 }),
  /INSUFFICIENT_CURRENCY/
);
assert.equal(controllerA.playerMetaIntegration.getSnapshot().gacha.pullsSinceUR, 1);
assert.equal(controllerA.playerMetaIntegration.getSnapshot().currencies.SCRAP, 0);
assert.throws(
  () => controllerA.playerMetaIntegration.applyPull({ characterId: "bw-r", cost: 0, pullsSinceUR: 80 }),
  /pullsSinceUR must remain below 80/
);

// DUPLICATE REWARD PATH: a duplicate can add fragments while the same pull remains atomic.
const duplicateStorage = new MemoryStorage();
const duplicateController = seededController(duplicateStorage, "duplicate-player", [0.1, 0]);
await duplicateController.initialize();
await duplicateController.addScrap(SCAVENGER_SCRAP_COST);
const first = await duplicateController.rollGacha();
await duplicateController.addScrap(SCAVENGER_SCRAP_COST);
const beforeDuplicate = duplicateController.playerMetaIntegration.getSnapshot();
const second = await duplicateController.rollGacha();
const afterDuplicate = duplicateController.playerMetaIntegration.getSnapshot();
assert.equal(first.character.character_id, second.character.character_id);
assert.equal(afterDuplicate.inventory.characters[first.character.character_id].quantity, 2);
assert.ok(afterDuplicate.currencies.FRAGMENTS >= beforeDuplicate.currencies.FRAGMENTS);

// TEN-PULL: the existing 10x guarantee remains active without changing the canonical rates/cost.
const tenPullStorage = new MemoryStorage();
const tenPullController = seededController(tenPullStorage, "ten-pull-player", [0, 0]);
await tenPullController.initialize();
await tenPullController.addScrap(SCAVENGER_SCRAP_COST * 9);
const tenPull = await tenPullController.rollGachaTen();
assert.equal(tenPull.count, 10);
assert.equal(tenPull.results.length, 10);
assert.equal(tenPull.results.filter((entry) => entry.rarity === "SR").length, 1);
assert.equal(tenPull.results.filter((entry) => entry.rarity === "R").length, 9);
assert.equal(tenPull.results[9].ten_pull_guarantee, "SR");
assert.equal(tenPull.state.scavenger_scrap, 0);
assert.equal(tenPull.state.pulls_since_UR, 10);
assert.equal(tenPullController.playerMetaIntegration.getSnapshot().gacha.pullsSinceUR, 10);

// TEN-PULL ATOMICITY: a persistence rejection after an earlier successful pull must restore
// both Player Meta authority and the persisted record to the pre-operation snapshot.
const atomicStorage = new MemoryStorage();
const atomicController = seededController(atomicStorage, "atomic-player", [0.1, 0]);
await atomicController.initialize();
await atomicController.addScrap(SCAVENGER_SCRAP_COST * 9);
const atomicAdapter = atomicController.playerMetaIntegration.persistenceAdapter;
const originalSave = atomicAdapter.save.bind(atomicAdapter);
let saveCalls = 0;
atomicAdapter.save = (state) => {
  saveCalls += 1;
  if (saveCalls === 2) throw new Error("SIMULATED_PERSISTENCE_FAILURE");
  return originalSave(state);
};
const beforeAtomicMeta = atomicController.playerMetaIntegration.getSnapshot();
const beforeAtomicState = atomicController.getState();
await assert.rejects(() => atomicController.rollGachaTen(), /SIMULATED_PERSISTENCE_FAILURE/);
assert.deepEqual(atomicController.playerMetaIntegration.getSnapshot(), beforeAtomicMeta);
assert.deepEqual(atomicController.getState(), beforeAtomicState);
assert.deepEqual(
  new PlayerMetaPersistenceAdapter({ storage: atomicStorage }).load(beforeAtomicMeta.identity),
  beforeAtomicMeta
);

// MULTI PLAYER: player A and player B remain isolated.
const isolatedB = new PlayerMetaPersistenceAdapter({ storage: storageB }).load(createPlayerIdentity({ playerId: "player-b" }));
assert.equal(isolatedB.inventory.characters[resultA.character.character_id].quantity, 1);
const isolatedA = new PlayerMetaPersistenceAdapter({ storage: storageA }).load(createPlayerIdentity({ playerId: "player-a" }));
assert.equal(isolatedA.inventory.characters[resultA.character.character_id].quantity, 1);

// IMMUTABILITY: callers cannot mutate the authority snapshot returned by the integration.
assert.throws(() => { snapshotA.currencies.SCRAP = 999999; }, TypeError);
assert.equal(controllerA.playerMetaIntegration.getSnapshot().currencies.SCRAP, 0);

// GACHA STATE remains a derived read model, not the persistence authority.
controllerA.state.currencies = { SCRAP: 999999 };
assert.equal(controllerA.getScavengerScrap(), 0);

console.log("T058 gacha/player-meta integration tests: PASS");
