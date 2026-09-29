import assert from "node:assert/strict";
import { Student4v4Orchestrator, STUDENT_4V4_RESULT_TYPE } from "./student_4v4_orchestrator.js";
import { student4v4ResultToCombatResult } from "./student_4v4_combat_adapter.js";
import { buildStudent4v4PresentationModel } from "./student_4v4_presentation.js";

const seed = "T038-SEED-001";

function roleResult(role, contribution, score, accuracy = score) {
  const contributionField = {
    BUFFER: ["energy_points", contribution],
    HEALER: ["protectedPoints", contribution],
    DEBUFFER: ["disruptionPoints", contribution],
    BATTER: ["impactPoints", contribution]
  }[role];

  return Object.freeze({
    type: "ROLE_RESULT",
    role,
    seed,
    score,
    accuracy,
    [contributionField[0]]: contributionField[1],
    success: contribution > 0,
    deterministic: true,
    hits: Object.freeze([])
  });
}

function makeRoles(overrides = {}) {
  return {
    BUFFER: overrides.BUFFER ?? roleResult("BUFFER", 30, 100),
    HEALER: overrides.HEALER ?? roleResult("HEALER", 40, 100),
    DEBUFFER: overrides.DEBUFFER ?? roleResult("DEBUFFER", 50, 100),
    BATTER: overrides.BATTER ?? roleResult("BATTER", 60, 100)
  };
}

const roles = makeRoles();
const orchestrator = new Student4v4Orchestrator({ seed, team: { id: "student-team-a" } });
const result = orchestrator.resolve(roles);

assert.equal(result.type, STUDENT_4V4_RESULT_TYPE);
assert.equal(result.seed, seed);
assert.deepEqual(result.resolution_order, ["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);
assert.equal(result.combinedScore, 400);
assert.equal(result.combinedAccuracy, 100);
assert.equal(result.energyContribution, 30);
assert.equal(result.protectionContribution, 40);
assert.equal(result.disruptionContribution, 50);
assert.equal(result.impactContribution, 60);
assert.equal(result.success, true);
assert.equal(result.deterministic, true);
assert.equal(Object.isFrozen(result), true);
assert.equal(Object.isFrozen(result.bufferResult), true);

assert.throws(() => orchestrator.resolve(roles), /ALREADY_RESOLVED/);

const second = new Student4v4Orchestrator({ seed, team: { id: "student-team-a" } }).resolve(makeRoles());
assert.deepEqual(second, result);

const missing = { ...roles };
delete missing.HEALER;
assert.throws(() => new Student4v4Orchestrator().resolve(missing), /MISSING_ROLE_RESULT:HEALER/);

const duplicate = [roles.BUFFER, roles.HEALER, roles.DEBUFFER, roles.BATTER, roles.BATTER];
assert.throws(() => new Student4v4Orchestrator().resolve(duplicate), /DUPLICATE_ROLE:BATTER/);

const invalid = makeRoles({ BATTER: { type: "NOT_ROLE_RESULT", role: "BATTER", seed, score: 1, accuracy: 1, impactPoints: 1, success: true, deterministic: true } });
assert.throws(() => new Student4v4Orchestrator().resolve(invalid), /INVALID_ROLE_RESULT:BATTER/);

const mismatched = makeRoles({ DEBUFFER: { ...roles.DEBUFFER, seed: "OTHER-SEED" } });
assert.throws(() => new Student4v4Orchestrator({ seed }).resolve(mismatched), /MISMATCHED_SEED:DEBUFFER/);

const snapshotBefore = JSON.stringify(roles);
new Student4v4Orchestrator({ seed }).resolve(roles);
assert.equal(JSON.stringify(roles), snapshotBefore);

const bufferChanged = new Student4v4Orchestrator({ seed }).resolve(makeRoles({ BUFFER: roleResult("BUFFER", 90, 140, 90) }));
assert.equal(bufferChanged.energyContribution, 90);
assert.equal(bufferChanged.combinedScore, 440);

const healerChanged = new Student4v4Orchestrator({ seed }).resolve(makeRoles({ HEALER: roleResult("HEALER", 90, 140, 90) }));
assert.equal(healerChanged.protectionContribution, 90);

const debufferChanged = new Student4v4Orchestrator({ seed }).resolve(makeRoles({ DEBUFFER: roleResult("DEBUFFER", 90, 140, 90) }));
assert.equal(debufferChanged.disruptionContribution, 90);

const batterChanged = new Student4v4Orchestrator({ seed }).resolve(makeRoles({ BATTER: roleResult("BATTER", 90, 140, 90) }));
assert.equal(batterChanged.impactContribution, 90);

const combatResult = student4v4ResultToCombatResult(result, { turn: 2 });
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.phase, "STUDENT_4V4");
assert.equal(combatResult.role, "STUDENT_4V4");
assert.equal(combatResult.turn, 2);
assert.equal(combatResult.energy_contribution, 30);
assert.equal(combatResult.protection_contribution, 40);
assert.equal(combatResult.disruption_contribution, 50);
assert.equal(combatResult.impact_contribution, 60);
assert.equal(combatResult.deterministic, true);

const presentation = buildStudent4v4PresentationModel(result);
assert.equal(presentation.combinedScore, 400);
assert.equal(presentation.combinedAccuracy, 100);
assert.deepEqual(presentation.resolutionOrder, ["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);
assert.equal(presentation.roles.length, 4);
assert.equal(presentation.roles[0].contribution, 30);
assert.equal(presentation.deterministic, true);

const resettable = new Student4v4Orchestrator({ seed });
resettable.resolve(roles);
resettable.reset();
assert.equal(resettable.getResult(), null);
const afterReset = resettable.resolve(roles);
assert.deepEqual(afterReset, result);

console.log("student_4v4_orchestrator_test: PASS");
