import assert from "node:assert/strict";
import { BIOME_SYNERGY_MULTIPLIER, TeamManager, hasBiomeSynergy } from "./team_manager.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, value); }
}
const units = {
  a: { character_id: "a", canonical: { display_name: "Alpha", favorite_area: "cyberpunk", stats: { power: 50, contact: 70 } } },
  b: { character_id: "b", canonical: { display_name: "Beta", favorite_area: "beach", stats: { power: 55, contact: 65 } } },
  c: { character_id: "c", canonical: { display_name: "Gamma", stats: { power: 58, contact: 60 } } },
  d: { character_id: "d", canonical: { display_name: "Delta", stats: { power: 62, contact: 64 } } }
};
const inventory = { a: { duplicate_count: 1 }, b: { duplicate_count: 0 }, c: { duplicate_count: 0 }, d: { duplicate_count: 0 } };
const managerStorage = new MemoryStorage();
const manager = new TeamManager({
  storage: managerStorage,
  getCharacter: (id) => units[id] || null,
  getInventory: () => inventory,
  persistActiveBatter: () => {}
});
manager.setActiveBatter("a");
manager.setSupport(0, "b");
manager.setSupport(1, "c");
assert.deepEqual(manager.getRoster(), { active_batter: "a", supports: ["b", "c"] });
assert.equal(manager.getTimingWindowMultiplier("cyberpunk"), BIOME_SYNERGY_MULTIPLIER);
assert.equal(manager.getTimingWindowMultiplier("forest"), 1);
assert.equal(hasBiomeSynergy(units.a, "cyberpunk"), true);
assert.equal(hasBiomeSynergy(units.c, "cyberpunk"), false);
assert.throws(() => manager.setSupport(0, "a"), /Active batter/);
assert.throws(() => manager.setSupport(1, "b"), /one support slot/);
const legacyStorage = new MemoryStorage();
legacyStorage.setItem("baseball_waifus_team_v1", JSON.stringify({ schema: 1, active_batter: "a", supports: ["b", "c"] }));
const legacyManager = new TeamManager({
  storage: legacyStorage,
  getCharacter: (id) => units[id] || null,
  getInventory: () => inventory
});
assert.deepEqual(legacyManager.getRoster(), { active_batter: "a", supports: ["b", "c"] });
assert.equal(legacyManager.getFourthMemberId(), null);
assert.deepEqual(legacyManager.getBattleRoster(), ["a", "b", "c"]);
manager.setFourthMember("d");
assert.deepEqual(manager.getBattleRoster(), ["a", "b", "c", "d"]);
assert.deepEqual(JSON.parse(manager.storage.getItem("baseball_waifus_team_4v4_v1")), { schema: 1, fourth_member: "d" });
assert.equal(JSON.parse(manager.storage.getItem("baseball_waifus_team_v1")).supports.length, 2,
  "the legacy Player Meta roster schema remains two supports");
assert.throws(() => manager.setFourthMember("b"), /unique character/);
const restored = new TeamManager({ storage: manager.storage, getCharacter: (id) => units[id] || null, getInventory: () => inventory });
assert.equal(restored.getFourthMemberId(), "d");
assert.deepEqual(restored.getBattleRoster(), ["a", "b", "c", "d"]);
const modified = manager.applyCombatModifiers({ area_id: "cyberpunk", state: {} });
assert.equal(modified.team_modifiers.timing_window_multiplier, 1.15);
assert.deepEqual(modified.team_roster.supports, ["b", "c"]);
console.log("team_manager_test: ok");
