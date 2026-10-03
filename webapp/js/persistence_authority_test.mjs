import assert from "node:assert/strict";
import { createPlayerIdentity, createInitialPlayerMetaState, PlayerMetaAuthority } from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter, PlayerMetaPersistenceError } from "./player_meta_persistence_adapter.js";
import { GachaController } from "./gacha_controller.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

class FakeCloudStorage {
  constructor(initial = null) { this.value = initial; }
  getItem(key, callback) {
    if (key !== "waifu_dex_state") return callback(null, null);
    callback(null, this.value);
  }
  setItem(key, value, callback) {
    if (key === "waifu_dex_state") this.value = value;
    callback?.(null, true);
  }
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
    { character_id: "bw024", canonical: { display_name: "Test R", rarity: "R" } },
    { character_id: "bw025", canonical: { display_name: "Test SR", rarity: "SR" } },
    { character_id: "bw026", canonical: { display_name: "Test SSR", rarity: "SSR" } },
    { character_id: "bw027", canonical: { display_name: "Test UR", rarity: "UR" } }
  ]
};

function fetchImpl(url) {
  return Promise.resolve({
    ok: true,
    json: async () => String(url).includes("game_schemas") ? schema : queue
  });
}

function createController({ storage, cloudStorage = null, playerId }) {
  const identity = createPlayerIdentity({ playerId });
  return new GachaController({
    storage,
    playerMetaStorage: storage,
    playerMetaIdentity: identity,
    cloudStorage,
    fetchImpl,
    now: () => 123456789
  });
}

function legacyState({ scrap, fragments, pity, characterId = "bw024" }) {
  return {
    pulls_since_UR: pity,
    scavenger_scrap: scrap,
    fragment_bank: fragments,
    inventory: {
      [characterId]: {
        character_id: characterId,
        display_name: "Migrated Character",
        rarity: "R",
        duplicate_count: 1
      }
    },
    active_batter: characterId
  };
}

{
  const storage = new MemoryStorage();
  storage.setItem("baseball_waifus_gacha_v1", JSON.stringify(legacyState({ scrap: 100, fragments: 1, pity: 3 })));
  const cloud = new FakeCloudStorage(JSON.stringify(legacyState({ scrap: 900, fragments: 7, pity: 17 })));
  const controller = createController({ storage, cloudStorage: cloud, playerId: "telegram:1001" });
  await controller.initialize();
  const migrated = controller.playerMetaIntegration.getSnapshot();

  assert.equal(migrated.identity.playerId, "telegram:1001");
  assert.equal(migrated.currencies.SCRAP, 900);
  assert.equal(migrated.currencies.FRAGMENTS, 7);
  assert.equal(migrated.gacha.pullsSinceUR, 17);
  assert.equal(migrated.roster.activeBatter, "bw024");
  assert.equal(new PlayerMetaPersistenceAdapter({ storage }).load(createPlayerIdentity({ playerId: "telegram:1001" })).currencies.SCRAP, 900);

  cloud.value = JSON.stringify(legacyState({ scrap: 100, fragments: 0, pity: 1 }));
  const restarted = createController({ storage, cloudStorage: cloud, playerId: "telegram:1001" });
  await restarted.initialize();
  assert.equal(restarted.getScavengerScrap(), 900);
}

{
  const storage = new MemoryStorage();
  const identity = createPlayerIdentity({ playerId: "telegram:2001", provider: "telegram", telegramUserId: "2001" });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 700 });
  authority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 12 });
  authority.dispatch({ type: "UPDATE_GACHA_STATE", pullsSinceUR: 21 });
  authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw024", quantity: 1 });
  authority.dispatch({ type: "SET_ROSTER", activeBatter: "bw024", supports: [null, null] });
  authority.dispatch({ type: "RECORD_REWARD", sourceEventId: "battle:modern-precedence" });
  adapter.save(authority.getSnapshot());

  const controller = createController({
    storage,
    cloudStorage: new FakeCloudStorage(JSON.stringify(legacyState({ scrap: 900, fragments: 99, pity: 2 }))),
    playerId: "telegram:2001"
  });
  await controller.initialize();
  const snapshot = controller.playerMetaIntegration.getSnapshot();
  assert.equal(snapshot.currencies.SCRAP, 700);
  assert.equal(snapshot.currencies.FRAGMENTS, 12);
  assert.equal(snapshot.gacha.pullsSinceUR, 21);
  assert.equal(snapshot.rewardLedger["battle:modern-precedence"], true);
}

{
  const storage = new MemoryStorage();
  storage.setItem("baseball_waifus_gacha_v1", JSON.stringify(legacyState({ scrap: 250, fragments: 5, pity: 9 })));
  const controller = createController({ storage, playerId: "local-migrated" });
  await controller.initialize();
  const first = controller.playerMetaIntegration.getSnapshot();
  assert.equal(first.currencies.SCRAP, 250);
  assert.equal(first.currencies.FRAGMENTS, 5);
  assert.equal(first.gacha.pullsSinceUR, 9);

  const repeated = controller.playerMetaIntegration.loadOrMigrate(legacyState({ scrap: 1, fragments: 1, pity: 61 }));
  assert.deepEqual(repeated, first);
}

{
  const storage = new MemoryStorage();
  const controllerA = createController({
    storage,
    cloudStorage: new FakeCloudStorage(JSON.stringify(legacyState({ scrap: 900, fragments: 9, pity: 10 }))),
    playerId: "telegram:3001"
  });
  const controllerB = createController({
    storage,
    cloudStorage: new FakeCloudStorage(JSON.stringify(legacyState({ scrap: 50, fragments: 2, pity: 4 }))),
    playerId: "telegram:3002"
  });
  await controllerA.initialize();
  await controllerB.initialize();
  assert.equal(controllerA.getScavengerScrap(), 900);
  assert.equal(controllerB.getScavengerScrap(), 50);
}

{
  const storage = new MemoryStorage();
  storage.setItem("baseball_waifus_gacha_v1", JSON.stringify(legacyState({ scrap: 100, fragments: 1, pity: 2 })));
  const controller = createController({
    storage,
    cloudStorage: new FakeCloudStorage("{not-json"),
    playerId: "telegram:4001"
  });
  await assert.rejects(() => controller.initialize(), /CloudStorage.*corrupted/);
}

{
  const storage = new MemoryStorage();
  const identity = createPlayerIdentity({ playerId: "telegram:5001", provider: "telegram", telegramUserId: "5001" });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 900 });
  authority.dispatch({ type: "RECORD_REWARD", sourceEventId: "battle:persistence" });
  adapter.save(authority.getSnapshot());

  const raw = JSON.parse(storage.getItem(adapter.keyFor(identity)));
  raw.identity = { ...raw.identity, telegramUserId: "different-user" };
  storage.setItem(adapter.keyFor(identity), JSON.stringify(raw));
  assert.throws(() => adapter.load(identity), PlayerMetaPersistenceError);
}

console.log("persistence_authority_test: PASS");
