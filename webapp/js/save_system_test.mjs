import assert from "node:assert/strict";
import { SaveSystem, SAVE_VERSION, migrateSaveState } from "./save_system.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, value); }
  removeItem(key) { this.map.delete(key); }
}

const storage = new MemoryStorage();
let applied = null;
const save = new SaveSystem({
  storage,
  providers: {
    gachaState: () => ({
      scavenger_scrap: 1250,
      fragment_bank: 42,
      pulls_since_UR: 17,
      inventory: {
        bw001: { character_id: "bw001", display_name: "Aiko", rarity: "R", duplicate_count: 4 }
      }
    }),
    teamRoster: () => ({ active_batter: "bw001", supports: ["bw002", "bw003"] }),
    progression: () => ({ bw001: { level: 7, star_rank: 1 } }),
    audioSettings: () => ({ volume: 0.65, muted: false }),
    quality: () => "high",
    records: () => ({ cyberpunk: { high_score: 900, best_hits: 7, best_home_runs: 1 } })
  },
  appliers: {
    gacha: (state) => { applied = state; }
  }
});

const state = save.save();
assert.equal(state.version, SAVE_VERSION);
assert.equal(state.economy.scrap, 1250);
assert.equal(state.economy.fragments, 42);
assert.equal(state.inventory.bw001.level, 7);
assert.equal(state.inventory.bw001.star_rank, 1);
assert.equal(state.gacha.pity.pulls_since_UR, 17);
assert.deepEqual(state.roster.supports, ["bw002", "bw003"]);
assert.equal(state.settings.quality, "high");
assert.equal(state.records.cyberpunk.high_score, 900);

const exported = save.exportJson();
const imported = JSON.parse(exported);
assert.equal(imported.version, SAVE_VERSION);

const restored = await save.importJson(exported);
assert.equal(restored.economy.fragments, 42);
assert.equal(applied.economy.scrap, 1250);

const legacy = migrateSaveState({
  version: 0,
  scavenger_scrap: 80,
  fragment_bank: 11,
  pulls_since_UR: 9,
  inventory: { bw004: { duplicate_count: 2 } },
  active_batter: "bw004"
});
assert.equal(legacy.version, SAVE_VERSION);
assert.equal(legacy.economy.scrap, 80);
assert.equal(legacy.economy.fragments, 11);
assert.equal(legacy.gacha.pity.pulls_since_UR, 9);
assert.equal(legacy.inventory.bw004.level, 1);
assert.equal(legacy.roster.active_batter, "bw004");

save.reset();
assert.deepEqual(JSON.parse(storage.getItem?.("baseball_waifus_save_v2") || "null"), null);

console.log("save_system_test: ok");
