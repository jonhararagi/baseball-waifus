import assert from "node:assert/strict";
import {
  WaifuDex,
  filterWaifus,
  matchesWaifuFilters,
  deriveStats,
  normalizeRole
} from "./waifu_dex.js";

const units = [
  {
    character_id: "a",
    canonical: {
      display_name: "Slugger A",
      rarity: "SSR",
      specialization: "power",
      position: "DH",
      potential: 5,
      stats: { power: 88, contact: 70 }
    }
  },
  {
    character_id: "b",
    canonical: {
      display_name: "Pitcher B",
      rarity: "SR",
      specialization: "pitcher",
      position: "P",
      favorite_area: "volcano",
      potential: 3,
      stats: { power: 52, contact: 60, timing_window: 0.13 }
    }
  },
  {
    character_id: "c",
    canonical: {
      display_name: "Outfielder C",
      rarity: "R",
      specialization: "defender",
      position: "LF",
      favorite_area: "forest",
      potential: 2,
      stats: { power: 61, contact: 80 }
    }
  }
];

assert.equal(normalizeRole(units[0]), "Slugger");
assert.equal(normalizeRole(units[1]), "Pitcher");
assert.equal(normalizeRole(units[2]), "Outfielder");

assert.equal(filterWaifus(units, { rarity: "SSR" }).length, 1);
assert.equal(filterWaifus(units, { role: "Pitcher" })[0].character_id, "b");
assert.equal(filterWaifus(units, { area: "forest" })[0].character_id, "c");
assert.equal(matchesWaifuFilters(units[0], { rarity: "SSR", role: "Slugger" }), true);

const stats = deriveStats(units[0]);
assert.equal(stats.swingPower, 88);
assert.equal(stats.timingWindow, 0.136);
assert.equal(stats.scrapMultiplier, 1.4);

class MemoryStorage {
  constructor(value) { this.value = value; }
  getItem() { return this.value; }
  setItem(_key, value) { this.value = value; }
}

const dex = new WaifuDex({
  storage: new MemoryStorage(JSON.stringify({
    inventory: { a: { duplicate_count: 2 }, c: { duplicate_count: 1 } },
    active_batter: "a"
  }))
});
dex.setUnits(units);
dex.loadState();
assert.equal(dex.getUnlockedCount(), 2);
assert.equal(dex.getVisibleUnits().length, 3);
dex.filters = { rarity: "SSR", role: "ALL", area: "ALL" };
assert.equal(dex.getVisibleUnits()[0].character_id, "a");

console.log("[waifu-dex] inventory state, filters, roles, and derived stats passed");
