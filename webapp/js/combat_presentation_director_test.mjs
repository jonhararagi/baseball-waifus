import assert from "node:assert/strict";
import {
  CombatPresentationDirector,
  COMBAT_PRESENTATION_PHASE,
  COMBAT_PRESENTATION_PHASES
} from "./combat_presentation_director.js";
import { createPresentationCommand } from "./presentation_event_contract.js";
import { resolveClimaxTurn } from "./combat_core.js";

const cues = [];
const director = new CombatPresentationDirector({
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
assert.notEqual(commands[0], commands[1]);
assert.equal(COMBAT_PRESENTATION_PHASES.at(-1), COMBAT_PRESENTATION_PHASE.COMPLETE);

const cameraA = director.getCameraTransform({ width: 1000, height: 600 });
director.update(0.12);
const cameraB = director.getCameraTransform({ width: 1000, height: 600 });
assert.notDeepEqual(cameraA, cameraB);
assert.equal(cameraB.phase, COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS);

director.update(0.7);
assert.equal(director.getState().phase, COMBAT_PRESENTATION_PHASE.IMPACT);
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
const integration = new CombatPresentationDirector();
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

console.log("T077 combat presentation director: PASS");
