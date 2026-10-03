import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GachaController } from "./gacha_controller.js";

const root = resolve(process.cwd());
const canonicalSchemaPath = resolve(root, "data/game_schemas_recycled.json");
const canonicalQueuePath = resolve(root, "data/characters_queue.json");
const runtimeSchemaPath = resolve(root, "webapp/data/game_schemas_recycled.json");
const runtimeQueuePath = resolve(root, "webapp/data/characters_queue.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

function responseFor(value) {
  return {
    ok: true,
    status: 200,
    async json() {
      return structuredClone(value);
    }
  };
}

const canonicalSchemaText = readFileSync(canonicalSchemaPath, "utf8");
const canonicalQueueText = readFileSync(canonicalQueuePath, "utf8");
const runtimeSchemaText = readFileSync(runtimeSchemaPath, "utf8");
const runtimeQueueText = readFileSync(runtimeQueuePath, "utf8");

assert(canonicalSchemaText === runtimeSchemaText, "Runtime schema diverges from canonical schema");
assert(canonicalQueueText === runtimeQueueText, "Runtime queue diverges from canonical queue");

const schema = readJson(runtimeSchemaPath);
const queue = readJson(runtimeQueuePath);

assert(schema?.gacha?.rates?.status === "active_canonical_game_table_v1", "Canonical rate table is not active");
assert(schema.gacha.rates.R === 80, "R rate changed");
assert(schema.gacha.rates.SR === 15, "SR rate changed");
assert(schema.gacha.rates.SSR === 4, "SSR rate changed");
assert(schema.gacha.rates.UR === 1, "UR rate changed");
assert(schema.gacha.rates.R + schema.gacha.rates.SR + schema.gacha.rates.SSR + schema.gacha.rates.UR === 100, "Rates do not sum to 100");

const pity = schema.gacha.pity;
assert(pity.model === "per_banner_counter", "Pity model changed");
assert(pity.soft_pity.enabled === true, "Soft pity disabled");
assert(pity.soft_pity.start_pull === 61, "Soft pity start changed");
assert(pity.soft_pity.increment_per_pull_percent === 0.5, "Soft pity increment changed");
assert(pity.hard_pity.enabled === true, "Hard pity disabled");
assert(pity.hard_pity.pull_limit === 80, "Hard pity limit changed");
assert(pity.hard_pity.guaranteed_rarity === "UR", "Hard pity rarity changed");

const rawUnits = [
  { character_id: queue.character_id, canonical: queue.canonical, acquisition: queue.acquisition },
  ...(Array.isArray(queue.batch_units) ? queue.batch_units : [])
];
assert(rawUnits.length > 0, "Canonical queue is empty");

for (const unit of rawUnits) {
  assert(typeof unit.character_id === "string" && unit.character_id.length > 0, "Queue contains invalid character_id");
  assert(["R", "SR", "SSR", "UR"].includes(String(unit.canonical?.rarity || "").toUpperCase()), `Invalid rarity for ${unit.character_id}`);
  if (unit.acquisition?.mode !== undefined) {
    assert(typeof unit.acquisition.mode === "string" && unit.acquisition.mode.length > 0, `Invalid acquisition mode for ${unit.character_id}`);
  }
}

const starterUnits = rawUnits.filter((unit) => unit.acquisition?.mode === "STARTER");
assert(starterUnits.length > 0, "No STARTER character is present");
assert(starterUnits.every((unit) => unit.acquisition?.pool_eligible === false), "STARTER leaked into an eligible pool");

const storage = new MemoryStorage();
const fetchImpl = async (url) => {
  if (url === "./data/game_schemas_recycled.json") return responseFor(schema);
  if (url === "./data/characters_queue.json") return responseFor(queue);
  throw new Error(`Unexpected gacha data URL: ${url}`);
};

const controller = new GachaController({
  storage,
  fetchImpl,
  cloudStorage: null,
  audioBridge: null,
  hapticsBridge: null,
  cutInRenderer: null
});

await controller.initialize();

assert(controller.ready === true, "Gacha did not become ready");
assert(controller.schema?.gacha?.rates?.R === 80, "Loaded schema is not canonical");
assert(controller.schema?.gacha?.pity?.soft_pity?.start_pull === 61, "Loaded pity is not canonical");
assert(controller.queue.length === rawUnits.length, "Normalized queue length mismatch");

const poolCounts = Object.fromEntries(
  Object.entries(controller.pools).map(([rarity, pool]) => [rarity, pool.length])
);
for (const rarity of ["R", "SR", "SSR", "UR"]) {
  assert(poolCounts[rarity] > 0, `${rarity} pool is empty`);
}

const starterIds = starterUnits.map((unit) => unit.character_id);
for (const starterId of starterIds) {
  assert(!controller.pools.R.some((unit) => unit.character_id === starterId)
    && !controller.pools.SR.some((unit) => unit.character_id === starterId)
    && !controller.pools.SSR.some((unit) => unit.character_id === starterId)
    && !controller.pools.UR.some((unit) => unit.character_id === starterId),
  `STARTER ${starterId} contaminated a gacha pool`);
}

assert(controller.playerMetaIntegration, "Modern Player Meta integration was not constructed");
const state = controller.getState();
for (const starterId of starterIds) {
  assert(state.inventory?.[starterId]?.duplicate_count === 1, `STARTER ${starterId} was not hydrated into Player Meta`);
}
assert(starterIds.includes(state.active_batter), "No canonical STARTER became the active batter");
assert(state.pulls_since_UR === 0, "Player Meta pity state changed during initialization");
assert(state.scavenger_scrap === 0, "Player Meta Scrap changed during initialization");
assert(state.fragment_bank === 0, "Player Meta Fragments changed during initialization");

console.log("BONE-002 GACHA RUNTIME DATA TEST = PASS");
console.log("CANONICAL_SCHEMA = data/game_schemas_recycled.json");
console.log("CANONICAL_QUEUE = data/characters_queue.json");
console.log("R_POOL =", poolCounts.R);
console.log("SR_POOL =", poolCounts.SR);
console.log("SSR_POOL =", poolCounts.SSR);
console.log("UR_POOL =", poolCounts.UR);
console.log("STARTERS =", starterIds.join(","));
console.log("GACHA_READY = PASS");
console.log("PLAYER_META = PASS");
