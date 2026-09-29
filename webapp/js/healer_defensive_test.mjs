import assert from "node:assert/strict";
import {
  HealerDefensiveSupport,
  HEALER_GRADES,
  HEALER_ZONES,
  classifyHealerTiming,
  createHealerThreatSequence
} from "./healer_defensive_support.js";
import { healerRoleResultToCombatResult } from "./healer_combat_adapter.js";
import { buildHealerPresentationModel } from "./healer_defensive_presentation.js";

const sequenceA = createHealerThreatSequence("T035-SEED", 8);
const sequenceB = createHealerThreatSequence("T035-SEED", 8);
assert.deepEqual(sequenceA, sequenceB, "same seed must generate the same threat sequence");
assert.equal(sequenceA.every((threat) => HEALER_ZONES.includes(threat.zone)), true);
assert.equal(sequenceA.every((threat) => threat.resolved === false && threat.active === true), true);
assert.equal(sequenceA.every((threat) => threat.interaction_window_ms > threat.good_window_ms), true);

for (const grade of HEALER_GRADES) assert.ok(["PERFECT", "GREAT", "GOOD", "MISS"].includes(grade));
const classificationThreat = sequenceA[0];
assert.equal(classifyHealerTiming(0, classificationThreat), "PERFECT");
assert.equal(classifyHealerTiming(classificationThreat.great_window_ms, classificationThreat), "GREAT");
assert.equal(classifyHealerTiming(classificationThreat.good_window_ms, classificationThreat), "GOOD");
assert.equal(classifyHealerTiming(classificationThreat.interaction_window_ms, classificationThreat), "MISS");

function runSingle(deltaMs) {
  const game = new HealerDefensiveSupport({ seed: `GRADE-${deltaMs}`, count: 1 });
  const threat = game.getCurrentThreat();
  return game.submitInput({ threatId: threat.id, zone: threat.zone, timestampMs: threat.target_ms + deltaMs });
}

assert.equal(runSingle(0).grade, "PERFECT");
assert.equal(runSingle(60).grade, "GREAT");
assert.equal(runSingle(120).grade, "GOOD");
assert.equal(runSingle(190).grade, "MISS");

const invalid = new HealerDefensiveSupport({ seed: "INVALID", count: 2 });
const invalidThreat = invalid.getCurrentThreat();
const invalidThreatInput = invalid.submitInput({ threatId: "unknown", zone: invalidThreat.zone, timestampMs: invalidThreat.target_ms });
assert.equal(invalidThreatInput.accepted, false);
assert.equal(invalidThreatInput.reason, "INVALID_THREAT");
assert.equal(invalid.getState().current_index, 0);

const invalidTimestamp = invalid.submitInput({ threatId: invalidThreat.id, zone: invalidThreat.zone, timestampMs: "nope" });
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");
assert.equal(invalid.getState().current_index, 0);

const invalidZone = invalid.submitInput({ threatId: invalidThreat.id, zone: "NOWHERE", timestampMs: invalidThreat.target_ms });
assert.equal(invalidZone.accepted, false);
assert.equal(invalidZone.reason, "INVALID_ZONE");
assert.equal(invalid.getState().current_index, 0);

const outOfWindow = invalid.submitInput({ threatId: invalidThreat.id, zone: invalidThreat.zone, timestampMs: invalidThreat.target_ms + 221 });
assert.equal(outOfWindow.accepted, false);
assert.equal(outOfWindow.reason, "OUT_OF_WINDOW");
assert.equal(invalid.getState().current_index, 0);

const firstValid = invalid.submitInput({ threatId: invalidThreat.id, zone: invalidThreat.zone, timestampMs: invalidThreat.target_ms });
assert.equal(firstValid.accepted, true);
assert.equal(firstValid.grade, "PERFECT");
const duplicate = invalid.submitInput({ threatId: invalidThreat.id, zone: invalidThreat.zone, timestampMs: invalidThreat.target_ms });
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.reason, "THREAT_ALREADY_RESOLVED");
assert.equal(invalid.getState().current_index, 1);

function runDeterministic(seed) {
  const game = new HealerDefensiveSupport({ seed, count: 5 });
  while (!game.completed) {
    const threat = game.getCurrentThreat();
    const delta = threat.index % 4 === 0 ? 0 : threat.index % 4 === 1 ? 60 : threat.index % 4 === 2 ? 120 : 190;
    game.submitInput({ threatId: threat.id, zone: threat.zone, timestampMs: threat.target_ms + delta });
  }
  return game.getResult();
}

const resultA = runDeterministic("DETERMINISTIC");
const resultB = runDeterministic("DETERMINISTIC");
assert.deepEqual(resultA, resultB, "same seed and inputs must produce the same ROLE_RESULT");
assert.equal(resultA.type, "ROLE_RESULT");
assert.equal(resultA.role, "HEALER");
assert.equal(typeof resultA.protectedPoints, "number");
assert.ok(["GREAT", "GOOD", "NORMAL", "FAILED"].includes(resultA.healingTier));
assert.equal(resultA.deterministic, true);
assert.equal(Object.isFrozen(resultA), true);

const combatResult = healerRoleResultToCombatResult(resultA, { shieldBefore: 25, shieldMax: 100, turn: 2 });
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.role, "HEALER");
assert.equal(combatResult.outcome, "DEFENSE_PROTECTED");
assert.equal(combatResult.shield_before, 25);
assert.equal(combatResult.shield_after, Math.min(100, 25 + resultA.protectedPoints));
assert.equal(combatResult.deterministic, true);
assert.equal(combatResult.role_result, resultA);
assert.equal(Object.isFrozen(combatResult), true);

const beforePresentation = JSON.stringify(resultA);
const state = new HealerDefensiveSupport({ seed: "PRESENTATION", count: 1 }).getState();
const model = buildHealerPresentationModel({ state, result: resultA, lastGrade: "MISS" });
assert.equal(model.grade, resultA.healingTier);
assert.equal(JSON.stringify(resultA), beforePresentation, "presentation model must not mutate ROLE_RESULT");

const restartGame = new HealerDefensiveSupport({ seed: "RESTART", count: 1 });
const restartThreat = restartGame.getCurrentThreat();
restartGame.submitInput({ threatId: restartThreat.id, zone: restartThreat.zone, timestampMs: restartThreat.target_ms });
assert.equal(restartGame.completed, true);
restartGame.start();
assert.equal(restartGame.completed, false);
assert.equal(restartGame.getState().current_index, 0);
assert.deepEqual(restartGame.getCurrentThreat(), restartThreat, "restart must restore the deterministic initial threat");

const completionGame = new HealerDefensiveSupport({ seed: "COMPLETE", count: 1 });
const completionThreat = completionGame.getCurrentThreat();
completionGame.submitInput({ threatId: completionThreat.id, zone: completionThreat.zone, timestampMs: completionThreat.target_ms });
assert.equal(completionGame.completed, true);
const postCompletion = completionGame.submitInput({ threatId: completionThreat.id, zone: completionThreat.zone, timestampMs: completionThreat.target_ms });
assert.equal(postCompletion.accepted, false);
assert.equal(postCompletion.reason, "POST_COMPLETION");

console.log("[healer] deterministic threat sequence passed");
console.log("[healer] perfect/great/good/miss classification passed");
console.log("[healer] invalid and duplicate input handling passed");
console.log("[healer] ROLE_RESULT contract passed");
console.log("[healer] ROLE_RESULT -> COMBAT_RESULT adapter passed");
console.log("[healer] presentation isolation passed");
console.log("[healer] restart and post-completion handling passed");
