import assert from "node:assert/strict";
import {
  CombatStage,
  createCombatStageActors,
  COMBAT_STAGE_ACTION_CONTRACT
} from "./combat_stage.js";
import { CombatPresentationDirector } from "./combat_presentation_director.js";
import { BatterRenderer, BATTER_STATES } from "./batter_renderer.js";

const stage = new CombatStage({
  actors: createCombatStageActors({
    batter: { id: "bw001", name: "Runtime Character" },
    enemy: { id: "enemy-fixture", name: "Enemy Fixture" }
  })
});

const actor = stage.getActor("bw001");
const enemy = stage.getActor("enemy-fixture");
assert.ok(actor);
assert.ok(enemy);
assert.equal(stage.getState().actionContract, COMBAT_STAGE_ACTION_CONTRACT.id);
assert.deepEqual(stage.getState().actionPhases, [...COMBAT_STAGE_ACTION_CONTRACT.phases]);

for (const anchor of ["FOCUS", "ACTION", "IMPACT", "REACTION"]) {
  assert.ok(actor.cameraAnchors[anchor], "attacker camera anchor missing: " + anchor);
}
for (const anchor of ["BAT", "HAND", "PROJECTILE", "IMPACT", "REACTION"]) {
  assert.ok(stage.getActorAnchor(actor.actorId, anchor), "attacker action anchor missing: " + anchor);
  assert.ok(stage.getActorAnchor(enemy.actorId, anchor), "enemy action anchor missing: " + anchor);
}

const formation = stage.resolveCinematicActorFrame(actor.actorId, {
  phase: "COMBAT_RETURN",
  progress: 1,
  width: 720,
  height: 1280
});
const actionFrame = stage.resolveCinematicActorFrame(actor.actorId, {
  phase: "ACTION",
  progress: 0.5,
  width: 720,
  height: 1280
});
assert.ok(Math.abs(actionFrame.offsetX) > 10, "character lunge motion was not established");
assert.ok(Math.abs(actionFrame.offsetY) > 4, "character body lift was not established");
assert.ok(actionFrame.scale > formation.scale, "action emphasis did not change scale");

const projectileEarly = stage.resolveCinematicProjectile(actor.actorId, enemy.actorId, {
  phase: "ACTION",
  progress: 0.1,
  width: 720,
  height: 1280
});
const projectileLate = stage.resolveCinematicProjectile(actor.actorId, enemy.actorId, {
  phase: "ACTION",
  progress: 0.9,
  width: 720,
  height: 1280
});
const projectileImpact = stage.resolveCinematicProjectile(actor.actorId, enemy.actorId, {
  phase: "IMPACT",
  progress: 0.5,
  width: 720,
  height: 1280
});
assert.equal(projectileEarly.targetAnchor, "IMPACT");
assert.equal(projectileEarly.sourceAnchor, "BAT_TO_PROJECTILE");
assert.ok(projectileLate.travelProgress > projectileEarly.travelProgress, "projectile did not travel across action");
assert.ok(projectileImpact.travelProgress === 1, "impact projectile did not resolve to target");
assert.ok(projectileImpact.position.x !== projectileEarly.position.x || projectileImpact.position.y !== projectileEarly.position.y);

const batter = new BatterRenderer();
batter.setBatter({ id: "bw001", jersey_number: "01" });
batter.beginWindup();
assert.equal(batter.getState(), BATTER_STATES.WINDUP);
batter.update(0.1);
const prepMotion = batter.getCharacterMotion();
batter.beginSwing();
batter.update(0.1);
const swingMotion = batter.getCharacterMotion();
assert.equal(batter.getState(), BATTER_STATES.SWING);
assert.ok(Math.abs(swingMotion.rotationDeg) > Math.abs(prepMotion.rotationDeg), "swing motion did not exceed prep motion");

const director = new CombatPresentationDirector({ stage });
director.startFromCombatResult({
  attackerId: actor.actorId,
  targetId: enemy.actorId,
  result: "HIT",
  damage: 10,
  actionType: "SWING"
});
assert.equal(director.getState().phase, "ATTACKER_FOCUS");
assert.equal(director.getState().progress, 0);
assert.equal(director.getCurrentStep().actionIntent, "PREPARE");
director.update(0.24);
assert.equal(director.getState().phase, "ACTION");
assert.ok(director.getState().progress >= 0);
assert.equal(director.getCurrentStep().animationState, "SWING");
assert.equal(director.getCommands()[1].payload.projectile_beat, "RELEASE_TO_IMPACT");

director.update(0.26);
assert.equal(director.getState().phase, "IMPACT");
assert.equal(director.getCurrentStep().actionIntent, "CONTACT");
assert.equal(director.getCommands()[2].payload.projectile_beat, "CONTACT");
director.update(0.15);
assert.equal(director.getState().phase, "TARGET_REACTION");
assert.equal(director.getCurrentStep().actionIntent, "REACTION");
director.update(0.3);
assert.equal(director.getState().phase, "COMBAT_RETURN");
assert.equal(director.getCurrentStep().animationState, "IDLE");
director.update(0.32);
assert.equal(director.getState().phase, "COMPLETE");
assert.equal(director.getState().active, false);
assert.deepEqual(director.getState().result, {
  attackerId: actor.actorId,
  targetId: enemy.actorId,
  result: "HIT",
  damage: 10,
  actionType: "SWING"
});

console.log("T080 CHARACTER COMBAT CINEMATIC ACTION = PASS_REAL");
console.log("anchors=PASS_REAL motion=PASS_REAL projectile=PASS_REAL director=PASS_REAL return=PASS_REAL");
