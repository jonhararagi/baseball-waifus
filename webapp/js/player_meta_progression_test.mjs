import assert from "node:assert/strict";
import { createInitialPlayerMetaState, createPlayerIdentity, PlayerMetaAuthority } from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { GachaPlayerMetaIntegration } from "./gacha_player_meta_integration.js";
import { UpgradeSystem, MAX_WAIFU_LEVEL, getStarRank, STAR_RANK_THRESHOLDS } from "./upgrade_system.js";
import { WaifuDex } from "./waifu_dex.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const unit = {
  character_id: "bw063",
  canonical: {
    display_name: "Progression Test",
    rarity: "SR",
    potential: 4,
    stats: { power: 60, contact: 75 }
  }
};

function createContext(playerId = "progression-player") {
  const storage = new MemoryStorage();
  const identity = createPlayerIdentity({ playerId });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  authority.dispatch({ type: "ADD_CHARACTER", characterId: unit.character_id, quantity: STAR_RANK_THRESHOLDS[0] });
  authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 10000 });
  authority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 100 });
  adapter.save(authority.getSnapshot());
  const integration = new GachaPlayerMetaIntegration({ identity, authority, persistenceAdapter: adapter });
  const upgrade = new UpgradeSystem({
    storage,
    playerMetaIntegration: integration,
    getWaifu: (id) => id === unit.character_id ? unit : null,
    getInventoryEntry: (id) => integration.getSnapshot().inventory.characters[id] || null,
    getCurrencies: () => ({
      scrap: integration.getSnapshot().currencies.SCRAP,
      fragments: integration.getSnapshot().currencies.FRAGMENTS
    })
  });
  return { storage, identity, adapter, authority, integration, upgrade };
}

const ctx = createContext();
const initial = ctx.upgrade.getProgression(unit.character_id);
assert.equal(initial.level, 1);
assert.equal(initial.star_rank, getStarRank(STAR_RANK_THRESHOLDS[0]));
assert.equal(ctx.integration.getProgression(unit.character_id), null);
const upgraded = ctx.upgrade.upgradeWaifu(unit.character_id);
assert.equal(upgraded.level, 2);
assert.equal(ctx.integration.getSnapshot().progression.characters[unit.character_id].level, 2);
assert.equal(ctx.integration.getSnapshot().currencies.SCRAP, 9900);
assert.equal(ctx.integration.getSnapshot().currencies.FRAGMENTS, 99);
assert.equal(ctx.upgrade.getUpgradeCost(unit.character_id).next_level, 3);

assert.throws(() => ctx.upgrade.upgradeWaifu("bw999"), /Waifu must be unlocked/);
assert.equal(ctx.integration.getSnapshot().progression.characters.bw999, undefined);

const setMax = ctx.authority.dispatch({ type: "SET_CHARACTER_PROGRESSION", characterId: unit.character_id, level: MAX_WAIFU_LEVEL });
assert.equal(setMax.ok, true);
assert.equal(ctx.upgrade.canUpgrade(unit.character_id), false);
assert.throws(() => ctx.upgrade.upgradeWaifu(unit.character_id), /level 50/);

ctx.authority.dispatch({ type: "SET_CHARACTER_PROGRESSION", characterId: unit.character_id, level: 7 });
ctx.adapter.save(ctx.authority.getSnapshot());
const rehydrated = ctx.adapter.load(ctx.identity);
assert.equal(rehydrated.progression.characters[unit.character_id].level, 7);
const rehydratedAuthority = new PlayerMetaAuthority(rehydrated);
const rehydratedIntegration = new GachaPlayerMetaIntegration({ identity: ctx.identity, authority: rehydratedAuthority, persistenceAdapter: ctx.adapter });
const rehydratedUpgrade = new UpgradeSystem({
  storage: ctx.storage,
  playerMetaIntegration: rehydratedIntegration,
  getWaifu: (id) => id === unit.character_id ? unit : null,
  getInventoryEntry: (id) => rehydratedIntegration.getSnapshot().inventory.characters[id] || null,
  getCurrencies: () => ({ scrap: rehydratedIntegration.getSnapshot().currencies.SCRAP, fragments: rehydratedIntegration.getSnapshot().currencies.FRAGMENTS })
});
assert.equal(rehydratedUpgrade.getProgression(unit.character_id).level, 7);

rehydratedIntegration.migrateLegacyProgression({ [unit.character_id]: { level: 9 } });
assert.equal(rehydratedIntegration.getProgression(unit.character_id).level, 9);
rehydratedIntegration.migrateLegacyProgression({ [unit.character_id]: { level: 8 } });
assert.equal(rehydratedIntegration.getProgression(unit.character_id).level, 9);

const other = createContext("other-player");
assert.equal(other.integration.getProgression(unit.character_id), null);
assert.equal(ctx.adapter.load(ctx.identity).progression.characters[unit.character_id].level, 9);
assert.equal(other.adapter.load(other.identity).progression.characters[unit.character_id], undefined);

const dex = new WaifuDex({
  storage: new MemoryStorage(),
  collectionProvider: () => rehydratedIntegration.getSnapshot()
});
dex.setUnits([unit, { character_id: "bw999", canonical: { display_name: "Unknown" } }]);
dex.loadState();
assert.equal(dex.getUnlockedCount(), 1);
assert.equal(Boolean(dex.state.inventory[unit.character_id]), true);
assert.equal(Boolean(dex.state.inventory.bw999), false);

console.log("player_meta_progression_test: PASS");
