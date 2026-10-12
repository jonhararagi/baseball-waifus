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
const stage = read("js/combat_stage.js");
const html = read("index.html");
const css = read("css/styles.css");
assert.ok(app.includes('timingFeedback?.classList.remove("is-visible", "is-cinematic-action")'), "HOME must clear timing feedback");
assert.ok(app.includes('appRoot?.classList.remove("is-combat-4v4", "is-cinematic-ultimate")'), "HOME must clear combat layout state");
assert.ok(read("css/styles.css").includes("[hidden] { display: none !important; }"), "hidden controls must stay hidden");

assert.ok(app.includes('combatArtIds = ["cari", "cami", "sunna", "chie", "scarlet", "chloe", "fenrir", "roxie_vane"]'), "4v4 must bind one sprite per slot");
assert.ok(app.includes("sprites: battleUnits.map((unit) => ({"), "sprite descriptors must use actor IDs");
assert.ok(combat.includes("unit?.combat_sprite_url"), "critical preload must accept explicit local art");
assert.ok(combat.includes("this.assetBank.get(actor.visual?.combatSpriteUrl)"), "renderer must use actor-specific art before ID fallback");
assert.ok(combat.includes("this.kytosPresentationState && !isFourVFour"), "Kytos single-batter scene must not obscure 4v4");
assert.ok(combat.includes('toLowerCase() !== "4v4"'), "4v4 must not draw set-piece placeholder labels");
assert.ok(stage.includes('combatSpriteUrl: String(unit.combat_sprite_url || unit.sprite_url || "")'), "stage actor must preserve the combat sprite URL");

assert.ok(combat.includes("Math.min(stageHeight * 0.42, stageWidth * 0.215)"), "4v4 full-body units must be scaled for the actual canvas");
assert.ok(combat.includes("showSetPieces: !isFourVFour"), "legacy tall tactical props must be disabled in 4v4");
assert.ok(combat.includes("showBaseballDiamond: isFourVFour"), "4v4 ground must include baseball field markings");
assert.ok(stage.includes("showSetPieces = true"), "stage renderer must support suppressing single-batter props");
assert.ok(stage.includes("if (showBaseballDiamond)"), "field renderer must draw the infield geometry");
assert.ok(combat.includes("// The DOM scoreboard plus each actor's own HP/name tag are the 4v4 HUD."), "duplicated aggregate HUD must not cover the field");
assert.ok(app.includes('terminalSummary.textContent = result === "VICTORY"'), "terminal state must show a dedicated result overlay");
assert.ok(app.includes('if (!isTerminal) {'), "RETURN/HOME must not appear between tactical turns");
assert.ok(html.includes('id="combat-terminal-summary"'), "terminal result overlay must exist in the real app markup");
assert.ok(css.includes("#app-container.is-combat-terminal #action-bat"), "action buttons must disappear at terminal state");
