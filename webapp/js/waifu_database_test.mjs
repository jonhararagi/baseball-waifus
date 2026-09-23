import assert from "node:assert/strict";
import {
  WAIFU_DATABASE,
  getWaifuAssets,
  getArchetypeColor
} from "./waifu_database.js";
import {
  AssetLoader,
  createPlaceholderSvg,
  isHttpsUrl
} from "./asset_loader.js";

console.log("🧪 Ejecutando pruebas unitarias de P13...");

const requiredKeys = ["avatarUrl", "cardArtUrl", "spriteSheetUrl"];
for (const [id, waifu] of Object.entries(WAIFU_DATABASE)) {
  assert.ok(waifu.name, id + " must have a display name");
  for (const key of requiredKeys) {
    assert.equal(
      isHttpsUrl(waifu[key]),
      true,
      id + "." + key + " must be a valid HTTPS URL"
    );
    assert.ok(waifu[key].length > 20, id + "." + key + " must not be empty");
  }
}

const cariAssets = getWaifuAssets("cari");
assert.ok(cariAssets.cardArtUrl.startsWith("https://"));

const dynamicAssets = getWaifuAssets({
  character_id: "bw999",
  canonical: { display_name: "Test Waifu", archetype: "POWER" }
});
assert.ok(dynamicAssets.avatarUrl.startsWith("https://"));
assert.ok(dynamicAssets.cardArtUrl.startsWith("https://"));
assert.ok(dynamicAssets.spriteSheetUrl.startsWith("https://"));

assert.equal(getArchetypeColor("POWER"), "#ff3b30");
assert.equal(getArchetypeColor("CONTACT"), "#00e5ff");
assert.equal(getArchetypeColor("SPEED"), "#ffd166");
assert.equal(getArchetypeColor("EYE"), "#a855f7");

const placeholder = createPlaceholderSvg({
  label: "Cari",
  color: "#ff3b30",
  size: 256
});
assert.match(placeholder, /^<svg /);
assert.ok(placeholder.includes("#ff3b30"));

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.width = 0;
    this.height = 0;
    this.decoding = "";
    this.crossOrigin = "";
    this.listeners = new Map();
    this._src = "";
  }

  set src(value) {
    this._src = String(value);
    if (this._src.startsWith("data:image/svg+xml")) {
      this.complete = true;
      this.naturalWidth = 256;
      this.width = 256;
      queueMicrotask(() => this.listeners.get("load")?.());
      return;
    }
    queueMicrotask(() => this.listeners.get("error")?.());
  }

  get src() {
    return this._src;
  }

  addEventListener(name, callback) {
    this.listeners.set(name, callback);
  }

  removeEventListener(name) {
    this.listeners.delete(name);
  }
}

const loader = new AssetLoader({
  ImageCtor: FakeImage,
  timeoutMs: 500
});

const fallback = await loader.load(
  "https://example.invalid/missing-waifu.png",
  {
    label: "Cari",
    archetype: "POWER"
  }
);

assert.equal(fallback.fallback, true);
assert.ok(fallback.url.startsWith("data:image/svg+xml;charset=UTF-8,"));
assert.equal(fallback.image.crossOrigin, "anonymous");
assert.equal(fallback.image.naturalWidth, 256);

const second = await loader.load(
  "https://example.invalid/missing-waifu.png",
  {
    label: "Cari",
    archetype: "POWER"
  }
);
assert.strictEqual(second, fallback, "fallback result must be cached");

console.log("waifu_database_test: ok");
