import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webapp = resolve(here, "..");
const read = (path) => readFileSync(resolve(webapp, path), "utf8");

const config = JSON.parse(read("data/waifus_config.json"));
assert.ok(Array.isArray(config.characters) && config.characters.length > 0, "character config must contain characters");

for (const character of config.characters) {
  for (const field of ["avatar_url", "card_art_url", "cutin_art_url"]) {
    const url = character[field];
    assert.equal(typeof url, "string", character.id + " missing " + field);
    assert.ok(url.startsWith("./assets/characters/"), character.id + " must use a local " + field);
    assert.ok(existsSync(resolve(webapp, url)), character.id + " references missing " + field + ": " + url);
  }
}

const database = read("js/waifu_database.js");
assert.ok(!database.includes("api.dicebear.com"), "waifu database must not depend on Dicebear");
assert.ok(database.includes('const LOCAL_CHARACTER_ASSET_BASE = "./assets/characters/";'), "generated defaults must use local art");
assert.ok(database.includes('text.startsWith("./")'), "local asset URLs must be accepted by URL normalization");

const theme = read("js/area_theme_manager.js");
for (const path of [
  "assets/stadiums/cyber_city_bg.svg",
  "assets/stadiums/cyber_dirt.svg",
  "assets/characters/pitcher_android.svg",
  "assets/characters/catcher_cyber.svg"
]) {
  assert.ok(existsSync(resolve(webapp, path)), "required cyberpunk asset missing: " + path);
}

const combat = read("js/combat.js");
assert.ok(combat.includes("const targetHeight = clamp(h * 0.105 * transform.scale, 96, 148);"), "4v4 actor sprite height must remain bounded for formation readability");
console.log("BWM-104 VISUAL ASSETS PASS", JSON.stringify({
  characters: config.characters.length,
  localPortraits: config.characters.length * 3,
  externalDicebearReferences: 0,
  cyberpunkAssets: 4
}));
