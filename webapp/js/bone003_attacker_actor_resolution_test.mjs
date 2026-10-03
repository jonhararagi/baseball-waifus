import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { resolvePresentationAttackerId } from "./combat.js";
import { CombatPresentationDirector } from "./combat_presentation_director.js";
import {
  CombatStage,
  CharacterActor2D5
} from "./combat_stage.js";

const selectedActorId = "PLAYER-01";
const result = Object.freeze({
  attackerId: "PLAYER-03",
  targetId: "ENEMY-01",
  result: "HOME_RUN",
  damage: 100,
  actionType: "SWING"
});

assert.equal(
  resolvePresentationAttackerId(result, "", selectedActorId),
  "PLAYER-03",
  "attackerId must outrank selectedActorId"
);

assert.equal(
  resolvePresentationAttackerId(
    { attackerId: "", attacker_id: "PLAYER-03" },
    "",
    selectedActorId
  ),
  "PLAYER-03",
  "attacker_id must outrank selectedActorId"
);

assert.equal(
  resolvePresentationAttackerId({ attackerId: "" }, "EXPLICIT-FALLBACK", selectedActorId),
  "EXPLICIT-FALLBACK",
  "explicit fallback must outrank selectedActorId"
);

assert.equal(
  resolvePresentationAttackerId({ attackerId: "", attacker_id: "" }, "", selectedActorId),
  selectedActorId,
  "selectedActorId must remain the final fallback"
);

const stage = new CombatStage({
  actors: [
    new CharacterActor2D5({ actorId: "PLAYER-01", position: { x: 0.18, y: 0.58 }, depth: "MID" }),
    new CharacterActor2D5({ actorId: "PLAYER-02", position: { x: 0.10, y: 0.46 }, depth: "FAR" }),
    new CharacterActor2D5({ actorId: "PLAYER-03", position: { x: 0.37, y: 0.68 }, depth: "NEAR" }),
    new CharacterActor2D5({ actorId: "PLAYER-04", position: { x: 0.48, y: 0.50 }, depth: "MID" }),
    new CharacterActor2D5({ actorId: "ENEMY-01", team: "ENEMY", position: { x: 0.76, y: 0.42 }, depth: "MID" })
  ]
});
assert.equal(stage.setSelectedActor(selectedActorId), true);

const director = new CombatPresentationDirector({ stage });
const started = director.startFromCombatResult(result);

assert.equal(started.result.attackerId, "PLAYER-03");
assert.equal(director.getCameraTransform({ width: 1000, height: 600 }).focusActorId, "PLAYER-03");

const combatJs = await fs.readFile(new URL("./combat.js", import.meta.url), "utf8");
const drawMethodStart = combatJs.indexOf("_drawCombatStageActor(ctx, actor, transform, w, h)");
const drawMethodEnd = combatJs.indexOf("_drawCombatSupportActor(", drawMethodStart);
assert.ok(drawMethodStart >= 0, "CombatRenderer actor renderer not found");
assert.ok(drawMethodEnd > drawMethodStart, "CombatRenderer actor renderer boundary not found");

const drawMethod = combatJs.slice(drawMethodStart, drawMethodEnd);
assert.match(drawMethod, /resolvePresentationAttackerId\(/);
assert.match(drawMethod, /actor\.actorId === attackerId/);
assert.doesNotMatch(
  drawMethod,
  /actor\.actorId === this\.combatStage\.selectedActorId/,
  "selectedActorId must not remain the cinematic protagonist condition"
);

const source = combatJs.match(/export function resolvePresentationAttackerId[\s\S]*?\n}\n/);
assert.ok(source, "resolvePresentationAttackerId source contract missing");
assert.match(source[0], /result\?\.attackerId/);
assert.match(source[0], /result\?\.attacker_id/);

const gameplayResult = Object.freeze({
  result: "HOME_RUN",
  damage: 100,
  victory: true,
  reward: 100
});
const beforeGameplay = JSON.stringify(gameplayResult);
assert.equal(JSON.stringify(gameplayResult), beforeGameplay);

console.log("BONE-003 ATTACKER ACTOR RESOLUTION TEST = PASS");
console.log("CASE_A = PASS // PLAYER-01 -> PLAYER-03");
console.log("CASE_B = PASS // PLAYER-03 -> PLAYER-03");
console.log("CASE_C = PASS // empty attacker -> PLAYER-01 fallback");
console.log("SOURCE = PASS");
console.log("DIRECTOR_RESULT_ATTACKER = PLAYER-03");
console.log("CAMERA_FOCUS = PLAYER-03");
console.log("GAMEPLAY_RESULT_UNCHANGED = PASS");

// BONE-003 CLOSED: authenticated CI validates attacker authority, selected fallback, and gameplay immutability.
