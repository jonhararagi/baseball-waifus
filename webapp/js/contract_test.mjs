import assert from "node:assert/strict";
import { CHARACTER_FACTIONS, isCombatInitDTO, isTurnResultDTO } from "./api.js";

const combatInit = {
  type: "CombatInitDTO",
  match_id: "match-001",
  state: {
    inning: 1,
    half: "TOP",
    outs: 0,
    balls: 0,
    strikes: 0,
    bases: {
      first: false,
      second: false,
      third: false
    }
  },
  home_team: { name: "HOME", score: 0 },
  away_team: { name: "AWAY", score: 0 },
  batter: { id: "bw001", card_id: "bw001", faction: "bosozoku_wild" },
  pitcher: { id: "bw002", card_id: "bw002", faction: "shadow_magic" },
  assets: {
    cards: [
      {
        id: "bw001",
        card_hd_url: "./assets/production/cards/bw001--normal.jpg",
        path: "./assets/production/cards/bw001--normal.jpg"
      },
      {
        id: "bw002",
        card_hd_url: "./assets/production/cards/bw002--normal.jpg",
        path: "./assets/production/cards/bw002--normal.jpg"
      }
    ],
    sprites: [
      {
        id: "bw001",
        sprite_url: "./assets/production/sprites/bw001_idle.png",
        path: "./assets/production/sprites/bw001_idle.png"
      },
      {
        id: "bw002",
        sprite_url: "./assets/production/sprites/bw002_idle.png",
        path: "./assets/production/sprites/bw002_idle.png"
      }
    ]
  }};

const turnResult = {
  type: "TurnResultDTO",
  turn_id: "turn-001",
  result: "SINGLE",
  timing: "GREAT",
  state: combatInit.state
};

assert.equal(
  combatInit.batter.id === "bw001"
  && combatInit.pitcher.id === "bw002"
  && combatInit.assets.cards.length === 2
  && combatInit.assets.sprites.length === 2,
  true
);

assert.equal(isCombatInitDTO(combatInit), true);
assert.equal(isCombatInitDTO({ ...combatInit, type: "invalid" }), false);
assert.equal(isCombatInitDTO(null), false);

assert.equal(isTurnResultDTO(turnResult), true);
assert.equal(isTurnResultDTO({ ...turnResult, result: 42 }), false);
assert.equal(isTurnResultDTO(null), false);

console.log("[webapp-contract] DTO validation passed");

const fs = await import("node:fs/promises");
const indexHtml = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");

const queue = JSON.parse(
  await fs.readFile(new URL("../../data/characters_queue.json", import.meta.url), "utf8")
);
const queueEntries = [queue, ...(queue.batch_units || [])];
assert.equal(queueEntries.length, 16);
assert.equal(queueEntries.every(
  (entry) => CHARACTER_FACTIONS.includes(entry?.canonical?.faction)
), true);
assert.equal(queueEntries.every(
  (entry) => entry?.pollinations?.faction === entry?.canonical?.faction
), true);
assert.equal(queueEntries.every(
  (entry) => entry?.pollinations?.faction_palette?.primary
    && entry?.pollinations?.faction_palette?.secondary
    && entry?.pollinations?.faction_palette?.accent
    && entry?.pollinations?.faction_palette?.glow
), true);

const canonical = JSON.parse(
  await fs.readFile(new URL("../../game/characters/character_archetypes.json", import.meta.url), "utf8")
);
assert.equal(canonical.characters.length, 30);
assert.equal(canonical.characters.every(
  (character) => CHARACTER_FACTIONS.includes(character?.character_identity?.faction)
), true);
assert.equal(
  new Set(canonical.characters.map((character) => character.character_identity.faction)).size,
  CHARACTER_FACTIONS.length
);
console.log("[webapp-contract] faction DTO/catalog contract passed");

const styleCss = await fs.readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const combatJs = await fs.readFile(new URL("./combat.js", import.meta.url), "utf8");

assert.match(indexHtml, /data-ui-skin="scavenger"/);
assert.match(indexHtml, /class="combat-shell"/);
assert.match(styleCss, /SCAVENGER FRONTEND SKIN/);
assert.match(styleCss, /\.combat-shell::before/);
assert.match(styleCss, /@keyframes scv-glitch-slice/);
assert.match(styleCss, /repeating-linear-gradient/);
assert.match(combatJs, /_triggerVisualImpact\(dto\)/);
assert.match(combatJs, /ctx\.filter = "contrast\(1\.10\) saturate\(1\.16\)"/);
assert.match(combatJs, /impact-(hit|run|danger|super)/);

console.log("[webapp-contract] scavenger presentation contract passed");



assert.equal(combatInit.assets.cards.every(
  (asset) => asset.card_hd_url.includes("/assets/production/cards/")
), true);
assert.equal(combatInit.assets.sprites.every(
  (asset) => asset.sprite_url.includes("/assets/production/sprites/")
), true);
assert.equal(
  combatInit.assets.cards.some((asset) => asset.path.includes("demo-characters")),
  false
);
assert.equal(
  combatInit.assets.sprites.some((asset) => asset.path.includes("demo-characters")),
  false
);

const audioBridgeJs = await fs.readFile(new URL("./audio_bridge.js", import.meta.url), "utf8");
const audioJs = await fs.readFile(new URL("./audio.js", import.meta.url), "utf8");
assert.match(audioBridgeJs, /class WebAudioSynthAdapter/);
assert.match(audioBridgeJs, /function playScavengerSFX/);
assert.match(audioBridgeJs, /"bat\.swing"/);
assert.match(audioBridgeJs, /"result\.home_run"/);
assert.doesNotMatch(audioBridgeJs, /Tone\.js|zzfx|jsfxr/i);
assert.match(audioJs, /export function createAudioBridge/);
assert.match(audioJs, /AudioBridge/);

assert.match(combatJs, /cameraShakeTimer/);
assert.match(combatJs, /cameraShakeDuration = 0\.15/);
assert.match(combatJs, /Math\.random\(\) \* 6 - 3/);
assert.match(combatJs, /globalCompositeOperation = "lighter"/);
assert.match(combatJs, /_drawNeonParticles\(target\)/);
assert.match(combatJs, /_triggerZanSlash\(\)/);
assert.match(combatJs, /rotate\(-Math\.PI \/ 3\)/);
assert.match(combatJs, /fillText\("ZAN!", 0, -20\)/);

console.log("[webapp-contract] audio and impact presentation contract passed");
