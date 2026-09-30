import assert from "node:assert/strict";
import {
  createInitialPlayerMetaState,
  createPlayerIdentity,
  PlayerMetaAuthority
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { GachaPlayerMetaIntegration } from "./gacha_player_meta_integration.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage();
const legacy = {
  pulls_since_UR: 7,
  inventory: {
    bw024: { duplicate_count: 1 }
  },
  active_batter: "bw024",
  scavenger_scrap: 900,
  fragment_bank: 4
};

const playerA = createPlayerIdentity({
  playerId: "telegram:1001",
  provider: "telegram",
  telegramUserId: "1001"
});
const playerB = createPlayerIdentity({
  playerId: "telegram:1002",
  provider: "telegram",
  telegramUserId: "1002"
});

const persistenceA = new PlayerMetaPersistenceAdapter({ storage });
const authorityA = new PlayerMetaAuthority(createInitialPlayerMetaState(playerA));
const integrationA = new GachaPlayerMetaIntegration({
  identity: playerA,
  authority: authorityA,
  persistenceAdapter: persistenceA
});

const migrated = integrationA.loadOrMigrate(legacy);
assert.equal(migrated.identity.playerId, "telegram:1001");
assert.equal(migrated.gacha.pullsSinceUR, 7);
assert.equal(migrated.currencies.SCRAP, 900);
assert.equal(migrated.currencies.FRAGMENTS, 4);
assert.equal(migrated.roster.activeBatter, "bw024");

// Idempotency: a second migration call returns the persisted modern snapshot.
const repeated = integrationA.loadOrMigrate({
  ...legacy,
  pulls_since_UR: 61,
  scavenger_scrap: 1
});
assert.deepEqual(repeated, migrated);

// Modern Player Meta has precedence over conflicting legacy state.
const modernAuthority = new PlayerMetaAuthority(migrated);
modernAuthority.dispatch({ type: "UPDATE_GACHA_STATE", pullsSinceUR: 33 });
const modernSnapshot = modernAuthority.getSnapshot();
persistenceA.save(modernSnapshot);
const precedenceAuthority = new PlayerMetaAuthority(modernSnapshot);
const precedenceIntegration = new GachaPlayerMetaIntegration({
  identity: playerA,
  authority: precedenceAuthority,
  persistenceAdapter: persistenceA
});
const preferred = precedenceIntegration.loadOrMigrate({
  pulls_since_UR: 7,
  scavenger_scrap: 1
});
assert.equal(preferred.gacha.pullsSinceUR, 33);
assert.equal(preferred.currencies.SCRAP, 900);

// Invalid legacy values are normalized without inventing a pity counter.
const playerInvalid = createPlayerIdentity({
  playerId: "telegram:1003",
  provider: "telegram",
  telegramUserId: "1003"
});
const persistenceInvalid = new PlayerMetaPersistenceAdapter({ storage });
const authorityInvalid = new PlayerMetaAuthority(createInitialPlayerMetaState(playerInvalid));
const integrationInvalid = new GachaPlayerMetaIntegration({
  identity: playerInvalid,
  authority: authorityInvalid,
  persistenceAdapter: persistenceInvalid
});
const invalid = integrationInvalid.loadOrMigrate({
  pulls_since_UR: "not-a-number",
  scavenger_scrap: -50,
  fragment_bank: "corrupt",
  inventory: {}
});
assert.equal(invalid.gacha.pullsSinceUR, 0);
assert.equal(invalid.currencies.SCRAP, 0);
assert.equal(invalid.currencies.FRAGMENTS, 0);

// Player isolation: A's migrated state cannot appear in B's Player Meta.
const persistenceB = new PlayerMetaPersistenceAdapter({ storage });
const authorityB = new PlayerMetaAuthority(createInitialPlayerMetaState(playerB));
const integrationB = new GachaPlayerMetaIntegration({
  identity: playerB,
  authority: authorityB,
  persistenceAdapter: persistenceB
});
const bState = integrationB.loadOrMigrate({
  pulls_since_UR: 2,
  scavenger_scrap: 10,
  inventory: {}
});
assert.equal(bState.identity.playerId, "telegram:1002");
assert.equal(bState.gacha.pullsSinceUR, 2);
assert.equal(bState.currencies.SCRAP, 10);
assert.equal(persistenceA.keyFor(playerA), "baseball_waifus_player_meta_v1:telegram%3A1001");
assert.equal(persistenceB.keyFor(playerB), "baseball_waifus_player_meta_v1:telegram%3A1002");

// Persistence survives adapter/authority recreation.
const reloaded = new PlayerMetaPersistenceAdapter({ storage }).load(playerA);
assert.equal(reloaded.gacha.pullsSinceUR, 33);
assert.equal(reloaded.currencies.SCRAP, 900);

console.log("[gacha-player-meta-migration] precedence, invalid-state handling, idempotency, isolation and persistence passed");
