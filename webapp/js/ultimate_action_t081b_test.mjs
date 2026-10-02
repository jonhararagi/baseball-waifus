import assert from "node:assert/strict";
import {
  CombatPresentationDirector,
  COMBAT_ULTIMATE_PHASE,
  COMBAT_ULTIMATE_ACTION_STEP_DEFINITIONS
} from "./combat_presentation_director.js";
import {
  CombatStage,
  createCombatStageActors
} from "./combat_stage.js";

const stage = new CombatStage({
  actors: createCombatStageActors({
    batter: { id: "bw001", name: "Runtime Hero" },
    enemy: { id: "enemy-fixture", name: "Enemy Fixture" }
  })
});

const director = new CombatPresentationDirector({ stage });
const gameplaySnapshot = Object.freeze({
  damage: 24,
  hp: 100,
  turn: 3,
  energy: 60,
  victory: false
});

director.startUltimateStaging({
  attackerId: "bw001",
  targetId: "enemy-fixture"
});

director.update(0.12);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.STAGING);
director.update(0.22);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.FOCUS);
director.update(0.32);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.PREP);

const beforeStage = JSON.stringify(stage.getState());
const continued = director.continueUltimateAction({
  attackerId: "bw001",
  targetId: "enemy-fixture",
  result: "HIT",
  damage: gameplaySnapshot.damage,
  actionType: "ULTIMATE_ACTION"
});

assert.equal(continued.sequenceKind, "ULTIMATE_ACTION");
assert.equal(continued.phase, COMBAT_ULTIMATE_PHASE.ACTION);
assert.equal(director.getCurrentStep().actionIntent, "ULTIMATE_SWING");
assert.equal(director.getCurrentStep().animationState, "SWING");
const actionCamera = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(actionCamera.cameraAnchor, "ACTION");
assert.equal(actionCamera.phase, COMBAT_ULTIMATE_PHASE.ACTION);
assert.equal(JSON.stringify(stage.getState()), beforeStage);
assert.equal(director.getCommands()[0].payload.camera_anchor, "ACTION");
assert.equal(director.getCommands()[0].payload.damage, gameplaySnapshot.damage);
assert.equal(director.getCommands()[0].payload.action_type, "ULTIMATE_ACTION");
assert.equal(COMBAT_ULTIMATE_ACTION_STEP_DEFINITIONS.length, 4);

const earlyProjectile = stage.resolveCinematicProjectile("bw001", "enemy-fixture", {
  phase: COMBAT_ULTIMATE_PHASE.ACTION,
  progress: 0.2,
  width: 720,
  height: 1280
});
const lateProjectile = stage.resolveCinematicProjectile("bw001", "enemy-fixture", {
  phase: COMBAT_ULTIMATE_PHASE.ACTION,
  progress: 0.9,
  width: 720,
  height: 1280
});
const impactProjectile = stage.resolveCinematicProjectile("bw001", "enemy-fixture", {
  phase: COMBAT_ULTIMATE_PHASE.IMPACT,
  progress: 0.5,
  width: 720,
  height: 1280
});

assert.equal(earlyProjectile.sourceAnchor, "BAT_TO_PROJECTILE");
assert.equal(earlyProjectile.targetAnchor, "IMPACT");
assert.ok(lateProjectile.travelProgress > earlyProjectile.travelProgress);
assert.equal(impactProjectile.travelProgress, 1);

const actionFrame = stage.resolveCinematicActorFrame("bw001", {
  phase: COMBAT_ULTIMATE_PHASE.ACTION,
  progress: 0.5,
  width: 720,
  height: 1280
});
const impactFrame = stage.resolveCinematicActorFrame("enemy-fixture", {
  phase: COMBAT_ULTIMATE_PHASE.IMPACT,
  progress: 0.5,
  width: 720,
  height: 1280
});
const reactionFrame = stage.resolveCinematicActorFrame("enemy-fixture", {
  phase: COMBAT_ULTIMATE_PHASE.REACTION,
  progress: 0.5,
  width: 720,
  height: 1280
});

assert.ok(actionFrame.scale > stage.getActor("bw001").scale);
assert.ok(Math.abs(actionFrame.rotationDeg) > 0);
assert.ok(Math.abs(impactFrame.offsetX) > 1);
assert.ok(Math.abs(reactionFrame.offsetX) > 1);

director.update(0.3);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.IMPACT);
assert.equal(director.getCurrentStep().actionIntent, "ULTIMATE_CONTACT");
director.update(0.15);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.REACTION);
assert.equal(director.getCurrentStep().actionIntent, "ULTIMATE_REACTION");
director.update(0.26);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.RETURN);
assert.equal(director.getCurrentStep().animationState, "IDLE");
director.update(0.3);
assert.equal(director.getState().phase, COMBAT_ULTIMATE_PHASE.COMPLETE);
assert.equal(director.getState().active, false);
assert.equal(director.getCameraTransform({ width: 720, height: 1280 }).phase, COMBAT_ULTIMATE_PHASE.COMPLETE);
assert.equal(JSON.stringify(stage.getState()), beforeStage);

assert.equal(JSON.stringify(stage.getState()), beforeStage);
assert.equal(director.getState().result.damage, gameplaySnapshot.damage);
assert.deepEqual(gameplaySnapshot, {
  damage: 24,
  hp: 100,
  turn: 3,
  energy: 60,
  victory: false
});

console.log("T081-B ULTIMATE ACTION + PROJECTILE + IMPACT + REACTION = PASS_REAL");
console.log("action=PASS_REAL projectile=PASS_REAL impact=PASS_REAL reaction=PASS_REAL return=PASS_REAL gameplay_immutable=PASS_REAL");
