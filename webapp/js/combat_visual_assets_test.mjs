import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getWaifuAssets } from "./waifu_database.js";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webapp = resolve(here, "..");
const read = (path) => readFileSync(resolve(webapp, path), "utf8");

const config = JSON.parse(read("data/waifus_config.json"));
assert.ok(Array.isArray(config.characters) && config.characters.length > 0, "character config must contain characters");
const combatSprites = new Set();
for (const character of config.characters) {
  for (const field of ["avatar_url", "card_art_url", "cutin_art_url", "sprite_url"]) {
    const url = character[field];
    assert.equal(typeof url, "string", character.id + " missing " + field);
    assert.ok(url.startsWith("./assets/characters/"), character.id + " must use a local " + field);
    assert.ok(existsSync(resolve(webapp, url)), character.id + " references missing " + field + ": " + url);
    if (field === "sprite_url") {
      assert.notEqual(url, "./assets/characters/placeholder.svg", character.id + " combat sprite cannot be generic placeholder");
      assert.ok(read(url).includes('viewBox="0 0 360 720"'), character.id + " sprite must be full-body");
      combatSprites.add(url);
    }
  }
}
assert.equal(combatSprites.size, config.characters.length, "every fighter must have unique full-body art");

const generatedFallbacks = getWaifuAssets({
  character_id: "bw999",
  canonical: { display_name: "Unknown test character" }
});
for (const [label, url] of Object.entries(generatedFallbacks)) {
  assert.equal(url, "./assets/characters/placeholder.svg", label + " must use the deterministic local placeholder");
  assert.ok(existsSync(resolve(webapp, url)), label + " fallback path must exist: " + url);
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
assert.ok(combat.includes("function combatantVisualHeight(width, height, scale = 1)"), "sprite sizing must adapt to real viewport");
assert.ok(combat.includes("const localTeamSprites = ["), "canonical team art must be preloaded");
assert.ok(combat.includes("this._drawCombatSupportActor(ctx, actor, transform, color, h, w);"), "ally sprites use actual canvas dimensions");
assert.ok(combat.includes("this.assetBank.get(getWaifuAssets(actor.visual?.characterId || actor.actorId).spriteSheetUrl)"), "enemy render path must resolve canonical art");
assert.ok(combat.includes("await this.assetBank.preload(localTeamSprites)"), "readiness requires local sprite decoding");
assert.ok(combat.includes("waitForNextRenderedFrame"), "READY requires a real rendered frame");
console.log("BWM-104 VISUAL ASSETS PASS", JSON.stringify({
  characters: config.characters.length,
  localPortraits: config.characters.length * 3,
  distinctCombatSprites: combatSprites.size,
  externalDicebearReferences: 0,
  cyberpunkAssets: 4
}));

const app = read("js/app.js");
assert.ok(app.includes('timingFeedback?.classList.remove("is-visible", "is-cinematic-action")'), "HOME must clear timing feedback");
assert.ok(app.includes('appRoot?.classList.remove("is-combat-4v4", "is-cinematic-ultimate")'), "HOME must clear combat layout state");
assert.ok(read("css/styles.css").includes("[hidden] { display: none !important; }"), "hidden controls must stay hidden");
