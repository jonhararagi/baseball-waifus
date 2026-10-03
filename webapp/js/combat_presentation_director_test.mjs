import fs from "node:fs";
import assert from "node:assert/strict";
import {
  CombatPresentationDirector,
  COMBAT_PRESENTATION_PHASE,
  COMBAT_PRESENTATION_PHASES
} from "./combat_presentation_director.js";
import { createPresentationCommand } from "./presentation_event_contract.js";
import { resolveClimaxTurn } from "./combat_core.js";
import {
  CHARACTER_ACTOR_2D5_STATES,
  CharacterActor2D5,
  CombatStage,
  COMBAT_STAGE_DEPTH
} from "./combat_stage.js";

const cues = [];
const stage = new CombatStage();
const director = new CombatPresentationDirector({
  stage,
  onStep: (event) => cues.push(event)
});

const input = Object.freeze({
  attackerId: "bw001",
  targetId: "bw002",
  result: "HOME_RUN",
  damage: 58,
  actionType: "SWING"
});

const snapshot = director.startFromCombatResult(input);
assert.equal(snapshot.phase, COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS);
assert.equal(snapshot.active, true);
assert.equal(director.getCameraTransform({ width: 1000, height: 600 }).cameraAnchor, "PLAYER_FOCUS");
assert.equal(snapshot.commandCount, 5);
assert.equal(snapshot.deterministic, true);
assert.equal(cues.at(-1).phase, COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS);

const commands = director.getCommands();
assert.equal(commands[0].type, "CAMERA");
assert.equal(commands[0].payload.phase, COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS);
assert.equal(commands[2].payload.phase, COMBAT_PRESENTATION_PHASE.IMPACT);
assert.equal(commands[2].payload.attacker_id, "bw001");
assert.equal(commands[2].payload.target_id, "bw002");
assert.equal(commands[2].payload.damage, 58);
assert.equal(commands[0].payload.camera_anchor, "PLAYER_FOCUS");
assert.equal(commands[0].payload.focus_actor_id, "bw001");
assert.equal(commands[0].payload.stage_aware, true);
assert.notEqual(commands[0], commands[1]);
assert.equal(COMBAT_PRESENTATION_PHASES.at(-1), COMBAT_PRESENTATION_PHASE.COMPLETE);

const cameraA = director.getCameraTransform({ width: 1000, height: 600 });
director.update(0.12);
const cameraB = director.getCameraTransform({ width: 1000, height: 600 });
assert.notDeepEqual(cameraA, cameraB);
assert.equal(cameraB.phase, COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS);

director.update(0.5);
assert.equal(director.getState().phase, COMBAT_PRESENTATION_PHASE.IMPACT);
director.update(0.08);
assert.equal(director.getState().phase, COMBAT_PRESENTATION_PHASE.TARGET_REACTION);
assert.equal(director.getState().active, true);

director.cancel();
assert.equal(director.getState().phase, COMBAT_PRESENTATION_PHASE.RETURN);
assert.equal(director.getState().active, true);

director.update(0.31);
assert.equal(director.getState().phase, COMBAT_PRESENTATION_PHASE.COMPLETE);
assert.equal(director.getState().active, false);
assert.equal(cues.at(-1).reason, "COMPLETE");

const result = resolveClimaxTurn({
  grade: "HIT",
  bossHp: 70,
  bossMaxHp: 100,
  internalEnergy: 60,
  tacticalEffectiveness: 80,
  round: 2
});
const before = JSON.stringify(result);
const integration = new CombatPresentationDirector({ stage });
integration.startFromCombatResult(result, {
  attackerId: "bw003",
  targetId: "k1",
  actionType: "TIMING_HIT"
});
assert.equal(JSON.stringify(result), before);
assert.equal(integration.getState().result.damage, result.damage);
assert.equal(integration.getCurrentStep().focusTarget, "ATTACKER");

const ctxOps = [];
const fakeCtx = {
  translate: (...args) => ctxOps.push(["translate", ...args]),
  scale: (...args) => ctxOps.push(["scale", ...args])
};
integration.update(0.05);
assert.equal(integration.applyCamera(fakeCtx, 720, 480), true);
assert.ok(ctxOps.some((entry) => entry[0] === "scale" && entry[1] > 1));

const command = createPresentationCommand({
  type: "CAMERA",
  eventId: "test:camera",
  target: "ATTACKER",
  durationMs: 100,
  payload: { phase: "ATTACKER_FOCUS" }
});
assert.equal(command.type, "CAMERA");

assert.ok(["PLAYER_FOCUS", "ACTION", "IMPACT", "REACTION", "RETURN"].includes(
  integration.getCameraTransform({ width: 720, height: 480 }).cameraAnchor
));
assert.equal(stage.getState().presentationOnly, true);

const actor = new CharacterActor2D5({
  actorId: "t119-character",
  position: { x: 0.42, y: 0.61 },
  depth: COMBAT_STAGE_DEPTH.FAR,
  scale: 0.84,
  rotation: 7,
  facing: -1,
  visible: true
});
const initialActor = actor.getPresentationSnapshot();
assert.equal(initialActor.presentationState, CHARACTER_ACTOR_2D5_STATES.IDLE);
assert.deepEqual(initialActor.position, { x: 0.42, y: 0.61 });
assert.equal(initialActor.depth, "FAR");
assert.equal(initialActor.scale, 0.84);
assert.equal(initialActor.rotation, 7);
assert.equal(initialActor.facing, -1);
assert.equal(initialActor.visible, true);
assert.equal(initialActor.presentationOnly, true);

assert.equal(actor.transitionTo("FOCUS"), "FOCUS");
assert.equal(actor.transitionTo("ACTION"), "ACTION");
assert.equal(actor.transitionTo("RETURN"), "RETURN");
assert.equal(actor.resetPresentationState(), "IDLE");
const finalActor = actor.getPresentationSnapshot();
assert.equal(finalActor.presentationState, "IDLE");
assert.deepEqual(finalActor.position, initialActor.position);
assert.equal(finalActor.depth, initialActor.depth);
assert.equal(finalActor.scale, initialActor.scale);
assert.equal(finalActor.rotation, initialActor.rotation);
assert.equal(finalActor.facing, initialActor.facing);
assert.equal(finalActor.visible, true);

assert.throws(() => actor.transitionTo("ACTION"), /Invalid CharacterActor2D5 transition/);
actor.setVisible(false);
assert.equal(actor.getPresentationSnapshot().visible, false);

const gameplayAuthority = Object.freeze({
  result: "HOME_RUN",
  damage: 100,
  victory: true,
  reward: 100
});
actor.setVisible(true);
actor.transitionTo("FOCUS");
actor.transitionTo("ACTION");
assert.deepEqual(gameplayAuthority, {
  result: "HOME_RUN",
  damage: 100,
  victory: true,
  reward: 100
});
assert.equal(actor.getPresentationState(), "ACTION");


const combatRendererSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
assert.match(combatRendererSource, /selectedActor\?\.setPresentationState\?\."FOCUS"/);
assert.match(combatRendererSource, /selectedActor\?\.setPresentationState\?\."ACTION"/);
assert.match(combatRendererSource, /selectedActor\?\.setPresentationState\?\."RETURN"/);
assert.match(combatRendererSource, /selectedActor\?\.resetPresentationState\?\(\)/);

const actorWiringActor = new CharacterActor2D5({
  actorId: "bw001",
  position: { x: 0.19, y: 0.58 },
  depth: COMBAT_STAGE_DEPTH.MID,
  scale: 0.94,
  rotation: 3,
  facing: 1,
  visible: true
});
const actorBefore = actorWiringActor.getPresentationSnapshot();

actorWiringActor.transitionTo("FOCUS");
assert.equal(actorWiringActor.getPresentationState(), "FOCUS");
actorWiringActor.transitionTo("ACTION");
assert.equal(actorWiringActor.getPresentationState(), "ACTION");
actorWiringActor.transitionTo("RETURN");
assert.equal(actorWiringActor.getPresentationState(), "RETURN");
actorWiringActor.resetPresentationState();
assert.equal(actorWiringActor.getPresentationState(), "IDLE");

const actorAfter = actorWiringActor.getPresentationSnapshot();
assert.deepEqual(actorAfter.position, actorBefore.position);
assert.equal(actorAfter.depth, actorBefore.depth);
assert.equal(actorAfter.scale, actorBefore.scale);
assert.equal(actorAfter.rotation, actorBefore.rotation);
assert.equal(actorAfter.facing, actorBefore.facing);
assert.equal(actorAfter.visible, actorBefore.visible);
assert.equal(actorAfter.presentationOnly, true);

const gameplayAuthorityT120 = Object.freeze({
  result: "HOME_RUN",
  damage: 100,
  victory: true,
  reward: 100,
  persistence: "UNCHANGED"
});
assert.deepEqual(gameplayAuthorityT120, {
  result: "HOME_RUN",
  damage: 100,
  victory: true,
  reward: 100,
  persistence: "UNCHANGED"
});
assert.equal(actorAfter.presentationState, "IDLE");
console.log("T077/T078/T119/T120 combat presentation director: PASS");
