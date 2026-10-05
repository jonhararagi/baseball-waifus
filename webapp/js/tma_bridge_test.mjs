import assert from "node:assert/strict";
import { TelegramBridge } from "./api.js";
import { createHapticsBridge } from "./haptics_bridge.js";
import { GachaController } from "./gacha_controller.js";
import { buildShareMessage, buildSharePayload, shareWaifu } from "./share_bridge.js";

const calls = [];
const haptics = createHapticsBridge({
  HapticFeedback: {
    impactOccurred(style) { calls.push(["impact", style]); },
    notificationOccurred(type) { calls.push(["notification", type]); },
    selectionChanged() { calls.push(["selection"]); }
  }
});
assert.equal(haptics.handleGameEvent("ui_confirm"), true);
assert.equal(haptics.handleGameEvent("single_hit"), true);
assert.equal(haptics.handleGameEvent("home_run"), true);
assert.equal(haptics.handleGameEvent("perfect"), true);
assert.equal(haptics.handleGameEvent("timing_bad"), true);
assert.deepEqual(calls, [
  ["selection"],
  ["impact", "light"],
  ["notification", "success"],
  ["impact", "heavy"],
  ["impact", "heavy"],
  ["notification", "error"]
]);
assert.equal(createHapticsBridge(null).handleGameEvent("home_run"), false);

const shareCharacter = {
  character_id: "bw024",
  canonical: { display_name: "Nene Kagetsu", rarity: "UR" }
};
const expectedShareMessage = "¡Acabo de reclutar a Nene Kagetsu (UR) en Baseball Waifus! ⚾✨ ¿Puedes superar mi equipo?";
assert.equal(buildShareMessage(shareCharacter), expectedShareMessage);
const sharePayload = buildSharePayload(shareCharacter, "UR", "https://baseball-waifus.example");
assert.equal(sharePayload.message, expectedShareMessage);
assert.equal(new URL(sharePayload.telegram_url).searchParams.get("text"), expectedShareMessage);

const shareCalls = [];
const telegramShare = {
  switchInlineQuery(query) { shareCalls.push(query); }
};
const shareResult = await shareWaifu(sharePayload, { webApp: telegramShare });
assert.equal(shareResult.ok, true);
assert.equal(shareResult.mode, "telegram_inline_query");
assert.deepEqual(shareCalls, [expectedShareMessage]);

const clipboardWrites = [];
const browserShareResult = await shareWaifu(sharePayload, {
  webApp: null,
  navigatorRef: {
    clipboard: {
      async writeText(value) { clipboardWrites.push(value); }
    }
  }
});
assert.equal(browserShareResult.ok, true);
assert.equal(browserShareResult.mode, "clipboard");
assert.deepEqual(clipboardWrites, [expectedShareMessage]);


const schema = {
  gacha: {
    rates: { status: "active_canonical_game_table_v1", R: 80, SR: 15, SSR: 4, UR: 1 },
    pity: {
      model: "per_banner_counter",
      soft_pity: { enabled: true, start_pull: 61, increment_per_pull_percent: 0.5 },
      hard_pity: { enabled: true, pull_limit: 80, guaranteed_rarity: "UR" }
    }
  }
};
const queue = {
  character_id: "bw015",
  canonical: { display_name: "Momo Hoshino", rarity: "SSR" },
  batch_units: [
    { character_id: "bw017", canonical: { display_name: "Yuzu Takahashi", rarity: "R" } },
    { character_id: "bw016", canonical: { display_name: "Fuyuki Aono", rarity: "SR" } },
    { character_id: "bw024", canonical: { display_name: "Nene Kagetsu", rarity: "UR" } }
  ]
};
const browserLikeCloud = { getItem() { throw new Error("must not be called"); } };
const browserLikeBridge = new TelegramBridge({ WebApp: { initData: "", CloudStorage: browserLikeCloud } });
assert.equal(browserLikeBridge.getCloudStorage(), null);

const nativeCloud = { getItem(_key, callback) { callback(null, null); } };
const nativeBridge = new TelegramBridge({ WebApp: { initData: "query_id=native-test", CloudStorage: nativeCloud } });
assert.equal(nativeBridge.getCloudStorage(), nativeCloud);

const response = (payload) => ({ ok: true, async json() { return payload; } });
class MemoryStorage {
  constructor(value) {
    this.values = new Map([["waifu_dex_state", value]]);
  }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  get value() { return this.values.get("waifu_dex_state") ?? null; }
}
class MockCloudStorage {
  constructor(value) { this.value = value; this.writes = []; }
  getItem(_key, cb) { cb(null, this.value); }
  setItem(key, value, cb) { this.writes.push([key, value]); this.value = value; cb(null, true); }
}
class UnsupportedCloudStorage {
  getItem() { throw new Error("WebAppMethodUnsupported"); }
}
const unsupportedController = new GachaController({
  fetchImpl: async (url) => response(url.includes("schema") ? schema : queue),
  storage: new MemoryStorage(),
  cloudStorage: new UnsupportedCloudStorage()
});
await unsupportedController.initialize();
assert.equal(unsupportedController.ready, true);
assert.equal(unsupportedController.playerMetaIntegration.hasPersistedState(), true);

const local = new MemoryStorage(JSON.stringify({ pulls_since_UR: 3, inventory: { bw017: { duplicate_count: 2 } }, active_batter: "bw017", scavenger_scrap: 50 }));
const cloud = new MockCloudStorage(JSON.stringify({ pulls_since_UR: 7, inventory: { bw024: { duplicate_count: 1 } }, active_batter: "bw024", scavenger_scrap: 900 }));
const controller = new GachaController({
  fetchImpl: async (url) => response(url.includes("schema") ? schema : queue),
  storage: local,
  cloudStorage: cloud
});
await controller.initialize();
assert.equal(controller.getStatus().pulls_since_UR, 7);
assert.equal(controller.getActiveBatter(), "bw024");
assert.equal(controller.getScavengerScrap(), 900);

const playerMetaKey = controller.playerMetaIntegration.persistenceAdapter.keyFor(
  controller.playerMetaIntegration.identity
);
const migratedMeta = JSON.parse(local.getItem(playerMetaKey));
assert.equal(migratedMeta.schemaVersion, 1);
assert.ok(Number.isSafeInteger(migratedMeta.revision) && migratedMeta.revision > 0);
assert.equal(migratedMeta.state.gacha.pullsSinceUR, 7);
assert.equal(migratedMeta.state.currencies.SCRAP, 900);
assert.equal(migratedMeta.state.roster.activeBatter, "bw024");

controller.addScrap(100);
await controller.flushPersistence();
assert.equal(JSON.parse(local.getItem(playerMetaKey)).state.currencies.SCRAP, 1000);

// CloudStorage remains legacy-only. Modern mutations persist through Player Meta.
assert.equal(JSON.parse(cloud.value).scavenger_scrap, 900);
assert.equal(cloud.writes.length, 0);

// A later startup must prefer Player Meta even if legacy CloudStorage conflicts.
const conflictingCloud = new MockCloudStorage(JSON.stringify({
  pulls_since_UR: 2,
  inventory: { bw017: { duplicate_count: 1 } },
  active_batter: "bw017",
  scavenger_scrap: 10
}));
const restored = new GachaController({
  fetchImpl: async (url) => response(url.includes("schema") ? schema : queue),
  storage: local,
  cloudStorage: conflictingCloud
});
await restored.initialize();
assert.equal(restored.getStatus().pulls_since_UR, 7);
assert.equal(restored.getActiveBatter(), "bw024");
assert.equal(restored.getScavengerScrap(), 1000);
assert.equal(conflictingCloud.writes.length, 0);

console.log("[tma] haptics, legacy migration and Player Meta precedence passed");