import assert from "node:assert/strict";
import {
  GachaEngine,
  DEFAULT_RATES,
  DEFAULT_PITY
} from "./gacha_engine.js";

assert.deepEqual(DEFAULT_RATES, { N: 50, R: 35, SR: 10, SSR: 4, UR: 1 });
assert.equal(
  Object.values(DEFAULT_RATES).reduce((sum, value) => sum + value, 0),
  100
);

const pool = {
  N: [{ character_id: "n001", canonical: { display_name: "N Test", rarity: "N" } }],
  R: [{ character_id: "r001", canonical: { display_name: "R Test", rarity: "R" } }],
  SR: [{ character_id: "sr001", canonical: { display_name: "SR Test", rarity: "SR" } }],
  SSR: [{ character_id: "ssr001", canonical: { display_name: "SSR Test", rarity: "SSR" } }],
  UR: [{ character_id: "ur001", canonical: { display_name: "UR Test", rarity: "UR" } }]
};

const boundaryRolls = [0, 0, 0.50, 0, 0.85, 0, 0.95, 0, 0.99, 0];
const engine = new GachaEngine({ rng: () => boundaryRolls.shift() ?? 0 });
assert.equal(engine.rollSingle({ pool }).rarity, "N");
assert.equal(engine.rollSingle({ pool }).rarity, "R");
assert.equal(engine.rollSingle({ pool }).rarity, "SR");
assert.equal(engine.rollSingle({ pool }).rarity, "SSR");
assert.equal(engine.rollSingle({ pool }).rarity, "UR");

const pity = new GachaEngine({
  pity: { SSR: 3, UR: 5 },
  rng: () => 0
});
pity.rollSingle({ pool });
pity.rollSingle({ pool });
const ssrPity = pity.rollSingle({ pool });
assert.equal(ssrPity.rarity, "SSR");
assert.equal(ssrPity.pity_triggered, "SSR");

const urPity = new GachaEngine({
  pity: { SSR: 3, UR: 5 },
  rng: () => 0
});
for (let index = 0; index < 4; index += 1) urPity.rollSingle({ pool });
const urResult = urPity.rollSingle({ pool });
assert.equal(urResult.rarity, "UR");
assert.equal(urResult.pity_triggered, "UR");

const tenPull = new GachaEngine({ rng: () => 0 });
const multi = tenPull.rollTen({ pool });
assert.equal(multi.results.length, 10);
assert.ok(multi.results.some((result) => ["SR", "SSR", "UR"].includes(result.rarity)));
assert.equal(multi.totals.fragments, 0);
assert.equal(multi.totals.scrap, 0);

const duplicateEngine = new GachaEngine({ rng: () => 0 });
const duplicate = duplicateEngine.rollSingle({
  pool,
  inventory: { n001: { duplicate_count: 1 } }
});
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.reward.fragments, 1);
assert.equal(duplicate.reward.scrap, 2);

assert.deepEqual(DEFAULT_PITY, { SSR: 20, UR: 80 });

console.log("[gacha-engine] rates, pity, 10x SR guarantee, and duplicate rewards passed");
