import assert from "node:assert/strict";
import { UpgradeSystem, MAX_WAIFU_LEVEL, STAR_RANK_THRESHOLDS, getUpgradeCost, getStarRank } from "./upgrade_system.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, value); }
}
const unit = {
  character_id: "bw999",
  canonical: { display_name: "Test Waifu", rarity: "SR", stats: { power: 60, contact: 75 }, potential: 4 }
};
const inventory = { bw999: { character_id: "bw999", duplicate_count: 8 } };
let scrap = 500;
let fragments = 20;
const storage = new MemoryStorage();
const system = new UpgradeSystem({
  storage,
  getWaifu: (id) => id === "bw999" ? unit : null,
  getInventoryEntry: (id) => inventory[id] || null,
  getCurrencies: () => ({ scrap, fragments }),
  consumeCurrencies: ({ scrap: scrapCost, fragments: fragmentCost }) => { scrap -= scrapCost; fragments -= fragmentCost; return true; }
});
assert.equal(getUpgradeCost(1).scrap, 100);
assert.equal(getUpgradeCost(1).fragments, 1);
assert.equal(getUpgradeCost(MAX_WAIFU_LEVEL), null);
assert.equal(getStarRank(0), 0);
assert.equal(getStarRank(STAR_RANK_THRESHOLDS[0]), 1);
assert.equal(getStarRank(8), 2);
const before = system.getProgression("bw999");
assert.equal(before.level, 1);
assert.equal(before.star_rank, 2);
assert.equal(before.stats.swingPower, 60);
assert.equal(before.stats.scrapMultiplier, 1.3);
assert.ok(before.stats.timingWindow > 0.1);
assert.equal(system.canUpgrade("bw999"), true);
const cost = system.getUpgradeCost("bw999");
const after = system.upgradeWaifu("bw999");
assert.equal(after.level, 2);
assert.equal(after.stats.swingPower, 62);
assert.equal(after.stats.scrapMultiplier, 1.31);
assert.equal(scrap, 500 - cost.scrap);
assert.equal(fragments, 20 - cost.fragments);
const restored = new UpgradeSystem({
  storage,
  getWaifu: (id) => id === "bw999" ? unit : null,
  getInventoryEntry: (id) => inventory[id] || null,
  getCurrencies: () => ({ scrap: 0, fragments: 0 })
});
assert.equal(restored.getProgression("bw999").level, 2);
assert.equal(restored.canUpgrade("bw999"), false);
let freshScrap = 10000;
let freshFragments = 100;
const fresh = new UpgradeSystem({
  storage: new MemoryStorage(),
  getWaifu: (id) => id === "bw999" ? unit : null,
  getInventoryEntry: () => ({ character_id: "bw999", duplicate_count: 0 }),
  getCurrencies: () => ({ scrap: freshScrap, fragments: freshFragments }),
  consumeCurrencies: ({ scrap: scrapCost, fragments: fragmentCost }) => { freshScrap -= scrapCost; freshFragments -= fragmentCost; return true; }
});
fresh.progression.bw999 = { level: 49 };
assert.equal(fresh.getUpgradeCost("bw999").next_level, 50);
assert.equal(fresh.upgradeWaifu("bw999").level, 50);
assert.equal(fresh.canUpgrade("bw999"), false);
assert.throws(() => fresh.upgradeWaifu("bw999"), /level 50/);
console.log("upgrade_system_test: ok");
