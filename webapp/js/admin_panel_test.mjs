import assert from "node:assert/strict";
import { SaveSystem } from "./save_system.js";
import {
  AdminPanel,
  INFINITE_SCRAP_VALUE
} from "./admin_panel.js";
import {
  getConfigSnapshot,
  getWaifu,
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

resetWaifuDatabaseToMemory();

const imageUpdates = [];
const storage = new MemoryStorage();

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
  onCharacterUpdated: (character) => imageUpdates.push(character)
});

const originalCari = getWaifu("cari");
assert.ok(originalCari);
assert.ok(Array.isArray(getConfigSnapshot().characters));
assert.equal(getConfigSnapshot().characters.length, 7);

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

let restoredPanel = new AdminPanel({
  root: null
});

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
assert.equal(exportedObject.schema_version, 1);
assert.equal(exportedObject.team, "Team Problemas de Capibara");
assert.equal(exportedObject.characters.length, 7);
assert.equal(
  exportedObject.characters.find((item) => item.id === "cari").assets.card_art,
  "https://cdn.example.test/cari-card-v2.png"
);

assert.throws(
  () => restoredPanel.updateImage("cari", "card_art", "http://insecure.example.test/image.png"),
  /HTTPS/
);

resetWaifuDatabaseToMemory();

console.log("admin_panel_test: ok");
