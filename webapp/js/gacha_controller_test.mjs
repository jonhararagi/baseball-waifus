import assert from "node:assert/strict";
import {
  GachaController,
  calculateGachaProbabilities
} from "./gacha_controller.js";

const schema = {
  gacha: {
    rates: {
      status: "active_canonical_game_table_v1",
      R: 80,
      SR: 15,
      SSR: 4,
      UR: 1
    },
    pity: {
      model: "per_banner_counter",
      soft_pity: {
        enabled: true,
        start_pull: 61,
        increment_per_pull_percent: 0.5
      },
      hard_pity: {
        enabled: true,
        pull_limit: 80,
        guaranteed_rarity: "UR"
      }
    }
  }
};

const queue = {
  schema_version: 1,
  character_id: "bw015",
  canonical: {
    display_name: "Momo Hoshino",
    rarity: "SSR"
  },
  batch_units: [
    {
      character_id: "bw016",
      canonical: { display_name: "Fuyuki Aono", rarity: "SR" }
    },
    {
      character_id: "bw017",
      canonical: { display_name: "Yuzu Takahashi", rarity: "R" }
    },
    {
      character_id: "bw024",
      canonical: { display_name: "Nene Kagetsu", rarity: "UR" }
    }
  ]
};

function response(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    }
  };
}

class MemoryStorage {
  constructor(seed = null) {
    this.value = seed;
  }

  getItem() {
    return this.value;
  }

  setItem(_key, value) {
    this.value = value;
  }
}

const audioCalls = [];
const rendererCalls = [];
const rngValues = [0.5, 0];

const controller = new GachaController({
  fetchImpl: async (url) => response(url.includes("schema") ? schema : queue),
  storage: new MemoryStorage(),
  rng: () => rngValues.shift() ?? 0,
  audioBridge: {
    play(soundId) {
      audioCalls.push(soundId);
      return true;
    }
  },
  cutInRenderer: {
    async showGachaCutIn(payload) {
      rendererCalls.push(payload);
    }
  },
  now: () => 123
});

await controller.initialize();
assert.equal(controller.ready, true);
assert.deepEqual(controller.getStatus(), {
  pulls_since_UR: 0,
  next_pull: 1,
  hard_pity_in: 80,
  inventory_size: 0,
  active_batter: null,
  scavenger_scrap: 0,
  recruit_cost: 1000,
  can_afford_recruit: false,
  ready: true
});
controller.addScrap(3000);

const first = await controller.rollGacha();
assert.equal(first.pull_number, 1);
assert.equal(first.rarity, "R");
assert.equal(controller.getStatus().pulls_since_UR, 1);
assert.equal(controller.getStatus().inventory_size, 1);
assert.equal(controller.getStatus().scavenger_scrap, 2000);
assert.equal(controller.getActiveBatter(), "bw017");
assert.deepEqual(audioCalls, ["ui.confirm"]);
assert.equal(rendererCalls.length, 0);

const soft = calculateGachaProbabilities(schema, 61);
assert.equal(soft.UR, 1.5);
assert.equal(soft.R, 79.5);
assert.equal(soft.soft_pity_active, true);

controller.state.pulls_since_UR = 60;
rngValues.push(0.99, 0);
controller.addScrap(1000);
const softPull = await controller.rollGacha();
assert.equal(softPull.pull_number, 61);
assert.equal(softPull.rarity, "UR");
assert.equal(softPull.soft_pity_active, true);
assert.equal(controller.getStatus().pulls_since_UR, 0);
assert.equal(rendererCalls.at(-1).rarity, "UR");
assert.deepEqual(audioCalls.slice(-2), ["ui.confirm", "gacha.reveal_ssr"]);

controller.state.pulls_since_UR = 79;
rngValues.push(0);
controller.addScrap(1000);
const hard = await controller.rollGacha();
assert.equal(hard.pull_number, 80);
assert.equal(hard.rarity, "UR");
assert.equal(hard.hard_pity_triggered, true);
assert.deepEqual(audioCalls.slice(-3), [
  "ui.confirm",
  "gacha.pity_trigger",
  "gacha.reveal_ssr"
]);

const persisted = controller.storage.value;
const restored = new GachaController({
  fetchImpl: async (url) => response(url.includes("schema") ? schema : queue),
  storage: new MemoryStorage(persisted)
});
await restored.initialize();
assert.equal(restored.getStatus().pulls_since_UR, 0);
assert.equal(restored.getStatus().inventory_size, 2);

console.log("[gacha-controller] rates, soft pity, hard pity, audio hooks and local persistence passed");
