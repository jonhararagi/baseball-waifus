import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SaveSystem } from "./save_system.js";
import {
  AdminPanel,
  INFINITE_SCRAP_VALUE
} from "./admin_panel.js";
import {
  getConfigSnapshot,
  getWaifu,
  getWaifuConfigSource,
  initializeWaifuDatabase,
  resetWaifuDatabaseToMemory
} from "./waifu_database.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.get(key) ?? null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(here, "../data/waifus_config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const storage = new MemoryStorage();
await initializeWaifuDatabase({
  storage,
  fetchImpl: async () => ({
    ok: true,
    status: 200,
    json: async () => config
  })
});

assert.equal(getWaifuConfigSource(), "json");
const snapshot = getConfigSnapshot();
assert.equal(snapshot.schema_version, 2);
assert.equal(snapshot.characters.length, 8);

for (const character of snapshot.characters) {
  assert.equal(typeof character.id, "string");
  assert.ok(["POWER", "CONTACT", "SPEED", "EYE"].includes(character.archetype));
  assert.equal(typeof character.team, "string");
  assert.equal(typeof character.stats.power, "number");
  assert.equal(typeof character.stats.contact, "number");
  assert.equal(typeof character.stats.speed, "number");
  assert.equal(typeof character.stats.eye, "number");
  assert.equal(typeof character.quote_super, "string");
  assert.equal(typeof character.quote_idle, "string");
  assert.equal(typeof character.quote_victory, "string");
  assert.equal(typeof character.jiggle_intensity, "number");
  assert.match(character.assets.avatar, /^https:\/\//);
}

const imageUpdates = [];
const events = {
  scrap: [],
  skins: 0,
  super: [],
  voice: []
};
let panel = null;

const saveSystem = new SaveSystem({
  storage,
  providers: {
    adminPanel: () => panel.getPersistence()
  },
  appliers: {
    adminPanel: (state) => panel.applyPersistence(state)
  }
});

panel = new AdminPanel({
  root: null,
  saveSystem,
  onCharacterUpdated: (character) => imageUpdates.push(character),
  onScrapGrant: (amount) => events.scrap.push(amount),
  onUnlockAllSkins: () => {
    events.skins += 1;
    return { changed: true };
  },
  onSuperSwingTest: (character) => {
    events.super.push(character.id);
    return true;
  },
  onVoiceTest: (character) => {
    events.voice.push(character.id);
    return true;
  }
});

const originalCari = getWaifu("cari");
assert.ok(originalCari);

const updatedImage = panel.updateImage(
  "cari",
  "card_art",
  "https://cdn.example.test/cari-card-v2.png"
);

assert.equal(updatedImage.assets.card_art, "https://cdn.example.test/cari-card-v2.png");
assert.equal(imageUpdates.at(-1).id, "cari");
assert.equal(getWaifu("cari").cardArtUrl, "https://cdn.example.test/cari-card-v2.png");

const updatedStats = panel.updateStats("cari", {
  power: 99,
  contact: 88,
  speed: 77,
  eye: 66
});

assert.deepEqual(updatedStats.stats, {
  power: 99,
  contact: 88,
  speed: 77,
  eye: 66
});

assert.equal(panel.grantScrap(10000), 1);
assert.deepEqual(events.scrap, [10000]);
assert.deepEqual(panel.unlockAllSkins(), { changed: true });
panel.testSuperSwing("cari");
panel.testVoice("cari");
assert.deepEqual(events.super, ["cari"]);
assert.deepEqual(events.voice, ["cari"]);

panel.setInfiniteScrap(true);
assert.equal(panel.getPersistence().infinite_scrap, true);
assert.equal(INFINITE_SCRAP_VALUE, 999999999);

saveSystem.save();

const persistedRaw = storage.getItem(saveSystem.storageKey);
const persisted = JSON.parse(persistedRaw);
assert.equal(
  persisted.admin.waifu_config.characters.find((item) => item.id === "cari").assets.card_art,
  "https://cdn.example.test/cari-card-v2.png"
);
assert.equal(
  persisted.admin.waifu_config.characters.find((item) => item.id === "cari").stats.power,
  99
);

const restoredPanel = new AdminPanel({ root: null });
const restoredSave = new SaveSystem({
  storage,
  providers: {
    adminPanel: () => restoredPanel.getPersistence()
  },
  appliers: {
    adminPanel: (state) => restoredPanel.applyPersistence(state)
  }
});
restoredPanel.saveSystem = restoredSave;
restoredSave.load();

assert.equal(restoredPanel.getPersistence().infinite_scrap, true);
assert.equal(
  restoredPanel.getPersistence()
    .waifu_config.characters
    .find((item) => item.id === "cari")
    .assets.card_art,
  "https://cdn.example.test/cari-card-v2.png"
);

const exported = restoredPanel.exportJson();
const exportedObject = JSON.parse(exported);
assert.equal(exportedObject.schema_version, 2);
assert.equal(exportedObject.characters.length, 8);

const exportedCari = exportedObject.characters.find((item) => item.id === "cari");
assert.equal(exportedCari.card_art_url, "https://cdn.example.test/cari-card-v2.png");
assert.equal(exportedCari.power, 99);
assert.equal(typeof exportedCari.quote_super, "string");
assert.equal(typeof exportedCari.jiggle_intensity, "number");
assert.equal(Object.hasOwn(exportedCari, "avatar_url"), true);
assert.equal(Object.hasOwn(exportedCari, "cutin_art_url"), true);

assert.throws(
  () => restoredPanel.updateImage("cari", "card_art", "http://insecure.example.test/image.png"),
  /HTTPS/
);

resetWaifuDatabaseToMemory();

await initializeWaifuDatabase({
  storage: new MemoryStorage(),
  fetchImpl: async () => {
    throw new Error("CONFIG_LOAD_FAILED");
  }
});
assert.equal(getWaifuConfigSource(), "memory");
assert.ok(getWaifu("cari"));
assert.equal(getConfigSnapshot().schema_version, 2);
assert.equal(getConfigSnapshot().characters.length, 8);

resetWaifuDatabaseToMemory();

console.log("admin_panel_test: ok");
