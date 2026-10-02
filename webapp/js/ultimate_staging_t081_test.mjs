import assert from "node:assert/strict";
import {
  CombatPresentationDirector,
  COMBAT_ULTIMATE_PHASE,
  COMBAT_ULTIMATE_STEP_DEFINITIONS
} from "./combat_presentation_director.js";
import {
  CombatStage,
  createCombatStageActors,
  COMBAT_STAGE_ULTIMATE_CONTRACT
} from "./combat_stage.js";

const stage = new CombatStage({
  actors: createCombatStageActors({
    batter: { id: "bw001", name: "Runtime Hero" },
    enemy: { id: "enemy-fixture", name: "Enemy Fixture" }
  })
});

const director = new CombatPresentationDirector({ stage });
const beforeStage = JSON.stringify(stage.getState());
const beforeActors = stage.getSortedActors().map((actor) => ({
  id: actor.actorId,
  x: actor.position.x,
  y: actor.position.y,
  scale: actor.scale,
  elevation: actor.elevation
}));

const initial = director.startUltimateStaging({
  attackerId: "bw001",
  targetId: "enemy-fixture"
});

assert.equal(initial.sequenceKind, "ULTIMATE_STAGING");
assert.equal(initial.phase, COMBAT_ULTIMATE_PHASE.TRIGGER);
assert.equal(initial.active, true);
assert.equal(initial.result.damage, 0);
assert.equal(director.getCurrentStep().actionIntent, "TRIGGER");
assert.equal(COMBAT_ULTIMATE_STEP_DEFINITIONS.length, 5);
assert.equal(stage.getState().ultimateContract, COMBAT_STAGE_ULTIMATE_CONTRACT.id);

const triggerCamera = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(triggerCamera.cameraAnchor, "FORMATION");

director.update(0.12);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.STAGING);

const hero = stage.getActor("bw001");
const support = stage.getActor("fixture-player-02");
const enemy = stage.getActor("enemy-fixture");
const heroStageFrame = stage.resolveCinematicActorFrame(hero.actorId, {
  phase: COMBAT_ULTIMATE_PHASE.STAGING,
  progress: director.getState().progress,
  width: 720,
  height: 1280
});
const supportStageFrame = stage.resolveCinematicActorFrame(support.actorId, {
  phase: COMBAT_ULTIMATE_PHASE.STAGING,
  progress: director.getState().progress,
  width: 720,
  height: 1280
});
const enemyStageFrame = stage.resolveCinematicActorFrame(enemy.actorId, {
  phase: COMBAT_ULTIMATE_PHASE.STAGING,
  progress: director.getState().progress,
  width: 720,
  height: 1280
});

assert.ok(heroStageFrame.scale > supportStageFrame.scale);
assert.ok(supportStageFrame.opacity < 1);
assert.ok(enemyStageFrame.opacity < 1);
assert.notEqual(heroStageFrame.offsetY, 0);

director.update(0.22);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.FOCUS);
assert.equal(director.getCurrentStep().animationState, "WINDUP");
assert.equal(director.getCameraTransform({ width: 720, height: 1280 }).cameraAnchor, "PLAYER_FOCUS");

const focusFrame = stage.resolveCinematicActorFrame(hero.actorId, {
  phase: COMBAT_ULTIMATE_PHASE.FOCUS,
  progress: 0.5,
  width: 720,
  height: 1280
});
assert.ok(focusFrame.scale > hero.scale);
assert.ok(focusFrame.emphasis > 0);

director.update(0.32);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.PREP);
assert.equal(director.getCurrentStep().animationState, "WINDUP");
assert.equal(director.getCameraTransform({ width: 720, height: 1280 }).cameraAnchor, "ACTION");

const prepFrame = stage.resolveCinematicActorFrame(hero.actorId, {
  phase: COMBAT_ULTIMATE_PHASE.PREP,
  progress: 0.5,
  width: 720,
  height: 1280
});
assert.ok(prepFrame.scale > focusFrame.scale);

director.update(0.36);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.RETURN);
assert.equal(director.getCurrentStep().animationState, "IDLE");
assert.equal(director.getCameraTransform({ width: 720, height: 1280 }).cameraAnchor, "RETURN");

director.update(0.32);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.COMPLETE);
assert.equal(director.getState().active, false);

const afterStage = JSON.stringify(stage.getState());
const afterActors = stage.getSortedActors().map((actor) => ({
  id: actor.actorId,
  x: actor.position.x,
  y: actor.position.y,
  scale: actor.scale,
  elevation: actor.elevation
}));
assert.equal(afterStage, beforeStage);
assert.deepEqual(afterActors, beforeActors);
assert.equal(director.getState().result.damage, 0);

console.log("T081 ULTIMATE CINEMATIC STAGING FOUNDATION = PASS_REAL");
console.log("trigger=PASS_REAL staging=PASS_REAL focus=PASS_REAL prep=PASS_REAL return=PASS_REAL gameplay_immutable=PASS_REAL");
