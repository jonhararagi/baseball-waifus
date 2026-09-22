import assert from "node:assert/strict";
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
assert.equal(haptics.handleGameEvent("gacha_ssr"), true);
assert.equal(haptics.handleGameEvent("timing_bad"), true);
assert.deepEqual(calls, [
  ["selection"],
  ["impact", "light"],
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
assert.match(sharePayload.telegram_url, /Nene%20Kagetsu/);

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
const response = (payload) => ({ ok: true, async json() { return payload; } });
class MemoryStorage {
  constructor(value) { this.value = value; }
  getItem() { return this.value; }
  setItem(_key, value) { this.value = value; }
}
class MockCloudStorage {
  constructor(value) { this.value = value; this.writes = []; }
  getItem(_key, cb) { cb(null, this.value); }
  setItem(key, value, cb) { this.writes.push([key, value]); this.value = value; cb(null, true); }
}
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
assert.match(local.value, /bw024/);
controller.addScrap(100);
await controller.flushPersistence();
assert.equal(JSON.parse(cloud.value).scavenger_scrap, 1000);
assert.equal(cloud.writes.at(-1)[0], "waifu_dex_state");

console.log("[tma] haptics and CloudStorage-first persistence passed");