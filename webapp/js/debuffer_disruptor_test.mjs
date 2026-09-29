import assert from "node:assert/strict";
import {
  DebufferDisruptor,
  DEBUFFER_GRADES,
  DEBUFF_TARGET_TYPES,
  classifyDebufferTiming,
  createDebufferTargetSequence
} from "./debuffer_disruptor.js";
import { debufferRoleResultToCombatResult } from "./debuffer_combat_adapter.js";
import { buildDebufferPresentationModel } from "./debuffer_disruptor_presentation.js";

const sequenceA = createDebufferTargetSequence("T036-SEED", 8);
const sequenceB = createDebufferTargetSequence("T036-SEED", 8);
assert.deepEqual(sequenceA, sequenceB, "same seed must generate the same target sequence");
assert.equal(sequenceA.every((target) => DEBUFF_TARGET_TYPES.includes(target.type)), true);
assert.equal(sequenceA.every((target) => target.x >= 0 && target.x <= 1 && target.y >= 0 && target.y <= 1), true);
assert.equal(sequenceA.every((target) => target.resolved === false && target.active === true), true);
assert.equal(sequenceA.every((target) => target.interaction_window_ms > target.good_window_ms), true);

for (const grade of DEBUFFER_GRADES) assert.ok(["PERFECT", "GREAT", "GOOD", "MISS"].includes(grade));
const classificationTarget = sequenceA[0];
assert.equal(classifyDebufferTiming(0, classificationTarget), "PERFECT");
assert.equal(classifyDebufferTiming(classificationTarget.great_window_ms, classificationTarget), "GREAT");
assert.equal(classifyDebufferTiming(classificationTarget.good_window_ms, classificationTarget), "GOOD");
assert.equal(classifyDebufferTiming(classificationTarget.interaction_window_ms, classificationTarget), "MISS");

function runSingle(deltaMs) {
  const game = new DebufferDisruptor({ seed: `GRADE-${deltaMs}`, count: 1 });
  const target = game.getCurrentTarget();
  return game.submitInput({ targetId: target.id, x: target.x, y: target.y, timestampMs: target.target_ms + deltaMs });
}

assert.equal(runSingle(0).grade, "PERFECT");
assert.equal(runSingle(60).grade, "GREAT");
assert.equal(runSingle(120).grade, "GOOD");
assert.equal(runSingle(190).grade, "MISS");

const invalid = new DebufferDisruptor({ seed: "INVALID", count: 2 });
const invalidTarget = invalid.getCurrentTarget();
const initialState = JSON.stringify(invalid.getState());
const invalidTargetInput = invalid.submitInput({ targetId: "unknown", x: invalidTarget.x, y: invalidTarget.y, timestampMs: invalidTarget.target_ms });
assert.equal(invalidTargetInput.accepted, false);
assert.equal(invalidTargetInput.reason, "INVALID_TARGET");
assert.equal(invalid.getState().current_index, 0);

const invalidPosition = invalid.submitInput({ targetId: invalidTarget.id, x: 1.2, y: invalidTarget.y, timestampMs: invalidTarget.target_ms });
assert.equal(invalidPosition.accepted, false);
assert.equal(invalidPosition.reason, "INVALID_POSITION");
assert.equal(invalid.getState().current_index, 0);

const invalidTimestamp = invalid.submitInput({ targetId: invalidTarget.id, x: invalidTarget.x, y: invalidTarget.y, timestampMs: "nope" });
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");
assert.equal(invalid.getState().current_index, 0);

const outOfRange = invalid.submitInput({ targetId: invalidTarget.id, x: invalidTarget.x + 0.2, y: invalidTarget.y, timestampMs: invalidTarget.target_ms });
assert.equal(outOfRange.accepted, false);
assert.equal(outOfRange.reason, "OUT_OF_RANGE");
assert.equal(invalid.getState().current_index, 0);
assert.equal(JSON.stringify({ ...invalid.getState(), current_target: undefined }), JSON.stringify({ ...JSON.parse(initialState), current_target: undefined }));

const firstValid = invalid.submitInput({ targetId: invalidTarget.id, x: invalidTarget.x, y: invalidTarget.y, timestampMs: invalidTarget.target_ms });
assert.equal(firstValid.accepted, true);
assert.equal(firstValid.grade, "PERFECT");
const duplicate = invalid.submitInput({ targetId: invalidTarget.id, x: invalidTarget.x, y: invalidTarget.y, timestampMs: invalidTarget.target_ms });
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.reason, "TARGET_ALREADY_RESOLVED");
assert.equal(invalid.getState().current_index, 1);

function runDeterministic(seed) {
  const game = new DebufferDisruptor({ seed, count: 5 });
  while (!game.completed) {
    const target = game.getCurrentTarget();
    const delta = target.index % 4 === 0 ? 0 : target.index % 4 === 1 ? 60 : target.index % 4 === 2 ? 120 : 190;
    game.submitInput({ targetId: target.id, x: target.x, y: target.y, timestampMs: target.target_ms + delta });
  }
  return game.getResult();
}

const resultA = runDeterministic("DETERMINISTIC");
const resultB = runDeterministic("DETERMINISTIC");
assert.deepEqual(resultA, resultB, "same seed and inputs must produce the same ROLE_RESULT");
assert.equal(resultA.type, "ROLE_RESULT");
assert.equal(resultA.role, "DEBUFFER");
assert.equal(resultA.targetsTotal, 5);
assert.equal(typeof resultA.disruptionPoints, "number");
assert.ok(["STRONG", "WEAK", "MINOR", "FAILED"].includes(resultA.debuffTier));
assert.equal(resultA.deterministic, true);
assert.equal(Object.isFrozen(resultA), true);

const combatResult = debufferRoleResultToCombatResult(resultA, { turn: 3 });
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.role, "DEBUFFER");
assert.equal(combatResult.outcome, "DISRUPTION_CAPTURED");
assert.equal(combatResult.disruption_points, resultA.disruptionPoints);
assert.equal(combatResult.debuff_tier, resultA.debuffTier);
assert.equal(combatResult.deterministic, true);
assert.equal(combatResult.role_result, resultA);
assert.equal(Object.isFrozen(combatResult), true);

const beforePresentation = JSON.stringify(resultA);
const state = new DebufferDisruptor({ seed: "PRESENTATION", count: 1 }).getState();
const model = buildDebufferPresentationModel({ state, result: resultA, lastGrade: "MISS" });
assert.equal(model.grade, resultA.debuffTier);
assert.equal(JSON.stringify(resultA), beforePresentation, "presentation model must not mutate ROLE_RESULT");

const restartGame = new DebufferDisruptor({ seed: "RESTART", count: 1 });
const restartTarget = restartGame.getCurrentTarget();
restartGame.submitInput({ targetId: restartTarget.id, x: restartTarget.x, y: restartTarget.y, timestampMs: restartTarget.target_ms });
assert.equal(restartGame.completed, true);
restartGame.start();
assert.equal(restartGame.completed, false);
assert.equal(restartGame.getState().current_index, 0);
assert.deepEqual(restartGame.getCurrentTarget(), restartTarget, "restart must restore the deterministic initial target");

const completionGame = new DebufferDisruptor({ seed: "COMPLETE", count: 1 });
const completionTarget = completionGame.getCurrentTarget();
completionGame.submitInput({ targetId: completionTarget.id, x: completionTarget.x, y: completionTarget.y, timestampMs: completionTarget.target_ms });
assert.equal(completionGame.completed, true);
const postCompletion = completionGame.submitInput({ targetId: completionTarget.id, x: completionTarget.x, y: completionTarget.y, timestampMs: completionTarget.target_ms });
assert.equal(postCompletion.accepted, false);
assert.equal(postCompletion.reason, "POST_COMPLETION");

console.log("[debuffer] deterministic spatial target sequence passed");
console.log("[debuffer] perfect/great/good/miss classification passed");
console.log("[debuffer] invalid, out-of-range and duplicate input handling passed");
console.log("[debuffer] ROLE_RESULT contract passed");
console.log("[debuffer] ROLE_RESULT -> COMBAT_RESULT adapter passed");
console.log("[debuffer] presentation isolation passed");
console.log("[debuffer] restart and post-completion handling passed");
