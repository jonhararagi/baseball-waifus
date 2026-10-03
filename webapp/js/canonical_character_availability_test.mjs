import assert from "node:assert/strict";
import fs from "node:fs";
import { GachaController } from "./gacha_controller.js";

const root = new URL("../../", import.meta.url);
const queue = JSON.parse(fs.readFileSync(new URL("data/characters_queue.json", root), "utf8"));
const schema = JSON.parse(fs.readFileSync(new URL("data/game_schemas_recycled.json", root), "utf8"));
const units = [queue, ...(queue.batch_units || [])];
const aiko = units.find((unit) => unit.character_id === "bw001");

assert.equal(aiko?.canonical?.display_name, "Aiko Hanamori");
assert.equal(aiko?.acquisition?.mode, "STARTER");
assert.equal(aiko?.acquisition?.pool_eligible, false);

const eligibleCounts = units.filter((unit) => unit.acquisition?.pool_eligible !== false).reduce((counts, unit) => {
  const rarity = String(unit.canonical?.rarity || "").toUpperCase();
  counts[rarity] = (counts[rarity] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(eligibleCounts, { SSR: 5, SR: 7, R: 2, UR: 2 });

const data = new Map();
const storage = {
  getItem(key) { return data.get(key) ?? null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};

const controller = new GachaController({
  storage,
  fetchImpl: async (url) => ({ ok: true, json: async () => String(url).includes("game_schemas_recycled.json") ? schema : queue }),
  rng: () => 0,
  now: () => 123
});

await controller.initialize();
const resolved = controller.getCharacter("bw001");
assert.equal(resolved.character_id, "bw001");
assert.equal(resolved.canonical.display_name, "Aiko Hanamori");
assert.equal(controller.getStatus().inventory_size, 1);
assert.equal(controller.getActiveBatter(), "bw001");
assert.equal(controller.getState().inventory.bw001.duplicate_count, 1);
assert.equal(controller.getState().inventory.bw001.rarity, "R");

assert.equal(controller.pools.R.some((unit) => unit.character_id === "bw001"), false);
assert.equal(controller.pools.R.length, 2);
assert.equal(controller.pools.SR.length, 7);
assert.equal(controller.pools.SSR.length, 5);
assert.equal(controller.pools.UR.length, 2);

assert.equal(schema.gacha.rates.status, "active_canonical_game_table_v1");
assert.deepEqual({ R: schema.gacha.rates.R, SR: schema.gacha.rates.SR, SSR: schema.gacha.rates.SSR, UR: schema.gacha.rates.UR }, { R: 80, SR: 15, SSR: 4, UR: 1 });
assert.equal(schema.gacha.pity.soft_pity.start_pull, 61);
assert.equal(schema.gacha.pity.hard_pity.pull_limit, 80);

const persisted = JSON.parse(data.get("baseball_waifus_player_meta_v1:local-player"));
assert.equal(persisted.schemaVersion, 1);
assert.ok(Number.isSafeInteger(persisted.revision) && persisted.revision > 0);
assert.equal(persisted.state.inventory.characters.bw001.quantity, 1);
assert.equal(persisted.state.roster.activeBatter, "bw001");

console.log("canonical_character_availability_test: PASS");