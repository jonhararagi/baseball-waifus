import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GachaController } from "./gacha_controller.js";
import { MainMenu } from "./main_menu.js";
import { SaveSystem } from "./save_system.js";
import { GameModeManager } from "./game_modes.js";
import { TeamManager } from "./team_manager.js";

class MemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed));
  }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

class JsonResponse {
  constructor(value) {
    this.ok = true;
    this.value = value;
  }
  async json() { return this.value; }
}

const webappDir = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(webappDir, "data", "game_schemas_recycled.json");
const queuePath = join(webappDir, "data", "characters_queue.json");
const fallbackSchema = {
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
const schema = await fs.readFile(schemaPath, "utf8")
  .then(JSON.parse)
  .catch(() => fallbackSchema);
const queue = await fs.readFile(queuePath, "utf8").then(JSON.parse);

const storage = new MemoryStorage();
const gacha = new GachaController({
  storage,
  fetchImpl: async (url) => {
    if (String(url).includes("game_schemas_recycled.json")) return new JsonResponse(schema);
    if (String(url).includes("characters_queue.json")) return new JsonResponse(queue);
    throw new Error("Unexpected fetch: " + url);
  },
  audioBridge: { play: () => false },
  hapticsBridge: { handleGameEvent: () => false },
  rng: () => 0.01
});
await gacha.initialize();

const firstUnit = gacha.getCharacters()[0];
assert.ok(firstUnit?.character_id, "catalog must contain an unlockable unit");

gacha.state.scavenger_scrap = 12000;
gacha.state.inventory[firstUnit.character_id] = {
  character_id: firstUnit.character_id,
  display_name: firstUnit.canonical?.display_name || firstUnit.character_id,
  rarity: firstUnit.canonical?.rarity || "R",
  obtained_at: Date.now(),
  duplicate_count: 1
};

const saveSystem = new SaveSystem({
  storage,
  providers: {
    gachaState: () => gacha.getState(),
    teamRoster: () => team.getRoster(),
    progression: () => ({}),
    audioSettings: () => ({ volume: 0.8, muted: false }),
    quality: () => "auto",
    records: () => records
  },
  appliers: {
    gacha: (state) => {
      gacha.state = {
        ...gacha.state,
        pulls_since_UR: state.gacha.pity.pulls_since_UR,
        inventory: state.inventory,
        active_batter: state.roster.active_batter,
        scavenger_scrap: state.economy.scrap,
        fragment_bank: state.economy.fragments
      };
    },
    team: (state) => {
      team.state = {
        active_batter: state.roster.active_batter,
        supports: [...state.roster.supports]
      };
    }
  }
});
const records = {};
const team = new TeamManager({
  storage,
  getCharacter: (id) => gacha.getCharacter(id),
  getInventory: () => gacha.getState().inventory,
  getExternalActive: () => gacha.getActiveBatter(),
  persistActiveBatter: (id) => {
    gacha.state.active_batter = id;
  }
});

gacha._saveState();
saveSystem.save();

gacha.state.inventory = {};
gacha.state.scavenger_scrap = 0;
gacha.state.active_batter = null;
team.state = { active_batter: null, supports: [null, null] };

saveSystem.load();
assert.equal(gacha.getScavengerScrap(), 12000, "SaveState must restore Scrap");
assert.ok(gacha.getState().inventory[firstUnit.character_id], "SaveState must restore roster inventory");

const menu = new MainMenu();
assert.equal(menu.navigate("roster"), "roster");
assert.equal(menu.activeView, "roster");

team.sync();
team.setActiveBatter(firstUnit.character_id);
assert.equal(team.getActiveBatterId(), firstUnit.character_id);

const recruitResult = await gacha.rollGachaTen();
assert.equal(recruitResult.count, 10);
assert.equal(recruitResult.results.length, 10);
assert.equal(gacha.getScavengerScrap(), 2000);

const gameModes = new GameModeManager({
  recordSink: (biome, record) => {
    records[biome] = { ...record };
  }
});
const endless = gameModes.start("ENDLESS", "cyberpunk");
assert.equal(endless.mode, "ENDLESS");
gameModes.registerResult("SINGLE");
assert.equal(gameModes.getState().score, 100);
assert.equal(gameModes.getState().pitch_speed_multiplier, 1.08);

const finalSave = saveSystem.save();
assert.equal(finalSave.roster.active_batter, firstUnit.character_id);
assert.equal(finalSave.economy.scrap, 2000);
assert.equal(finalSave.records.cyberpunk.high_score, 100);

console.log("e2e_smoke_test: ok");
