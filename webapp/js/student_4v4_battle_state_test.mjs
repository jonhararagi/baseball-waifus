import assert from "node:assert/strict";
import { Student4v4BattleState, STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";
import { Student4v4Orchestrator } from "./student_4v4_orchestrator.js";
import { buildStudent4v4BattleStatePresentationModel } from "./student_4v4_battle_state_presentation.js";

const ROLE_ORDER = ["BUFFER", "HEALER", "DEBUFFER", "BATTER"];
const SEED = "T043-STATE-001";

function currentPerfectInput(state) {
  const game = state.getCurrentRoleGame();
  assert.ok(game, "an active role game is required");
  const roleState = game.getState();
  if (state.currentPhase === "BUFFER") {
    return { noteId: roleState.current_note.id, timestampMs: roleState.current_note.target_ms };
  }
  if (state.currentPhase === "HEALER") {
    return {
      threatId: roleState.current_threat.id,
      zone: roleState.current_threat.zone,
      timestampMs: roleState.current_threat.target_ms
    };
  }
  if (state.currentPhase === "DEBUFFER") {
    return {
      targetId: roleState.current_target.id,
      x: roleState.current_target.x,
      y: roleState.current_target.y,
      timestampMs: roleState.current_target.target_ms
    };
  }
  return {
    opportunityId: roleState.current_opportunity.id,
    timestampMs: roleState.current_opportunity.target_ms
  };
}

function completeCurrentRole(state) {
  const rolePhase = state.currentPhase;
  while (!state.completed && state.currentPhase === rolePhase) {
    const response = state.submitInput(currentPerfectInput(state));
    assert.equal(response.accepted, true);
  }
}

function runBattle(seed) {
  const battle = new Student4v4BattleState({ seed, battleId: `battle-${seed}` });
  assert.equal(battle.snapshot().currentPhase, STUDENT_4V4_BATTLE_PHASE.INIT);
  battle.start();
  const phases = [];
  while (battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.RESOLUTION) {
    phases.push(battle.currentPhase);
    completeCurrentRole(battle);
  }
  phases.push(battle.currentPhase);
  const resolution = battle.resolve();
  phases.push(resolution.currentPhase);
  return { battle, phases, resolution };
}

const battle = new Student4v4BattleState({ seed: SEED, battleId: "T043-BATTLE-A" });
const initial = battle.snapshot();
assert.equal(initial.currentPhase, "INIT");
assert.equal(initial.phaseIndex, 0);
assert.equal(initial.seed, SEED);
assert.equal(initial.started, false);
assert.equal(initial.completed, false);
assert.equal(initial.resolved, false);
assert.equal(initial.deterministic, true);

assert.throws(() => battle.submitInput({}), /INVALID_PHASE/);
battle.start();
assert.equal(battle.snapshot().currentPhase, "BUFFER");
assert.equal(battle.snapshot().phaseIndex, 0);
assert.throws(() => battle.start(), /ALREADY_STARTED/);
assert.throws(() => battle.resolve(), /MISSING_ROLE_RESULT/);

const invalidRoleResult = {
  type: "ROLE_RESULT",
  role: "BUFFER",
  seed: "WRONG-SEED",
  score: 100,
  accuracy: 100,
  energy_points: 10,
  success: true,
  deterministic: true
};
assert.throws(() => battle.submitRoleResult("BUFFER", invalidRoleResult), /MISMATCHED_SEED:BUFFER/);
assert.equal(battle.snapshot().currentPhase, "BUFFER");
assert.equal(Object.keys(battle.snapshot().roleResults).length, 0);

for (const expectedRole of ROLE_ORDER) {
  assert.equal(battle.currentPhase, expectedRole);
  completeCurrentRole(battle);
  assert.equal(battle.snapshot().roleResults[expectedRole].role, expectedRole);
  assert.equal(battle.snapshot().roleResults[expectedRole].seed, SEED);
}

assert.equal(battle.currentPhase, "RESOLUTION");
assert.equal(battle.phaseIndex, 4);
assert.equal(Object.keys(battle.roleResults).length, 4);

const roleSnapshotBefore = JSON.stringify(battle.roleResults);
const battleSnapshotBeforePresentation = battle.snapshot();
const presentation = buildStudent4v4BattleStatePresentationModel(battleSnapshotBeforePresentation);
assert.deepEqual(presentation.roles.map((role) => role.role), ROLE_ORDER);
assert.equal(presentation.phase, "RESOLUTION");
assert.equal(presentation.hasStudent4v4Result, false);
assert.equal(presentation.hasCombatResult, false);
assert.equal(presentation.deterministic, true);
assert.equal(JSON.stringify(battle.roleResults), roleSnapshotBefore);

const expectedCombined = new Student4v4Orchestrator({ seed: SEED }).resolve(battle.roleResults);
const resolved = battle.resolve();
assert.deepEqual(resolved.student4v4Result, expectedCombined);
assert.equal(resolved.student4v4Result.type, "STUDENT_4V4_RESULT");
assert.equal(resolved.combatResult.type, "COMBAT_RESULT");
assert.equal(resolved.combatResult.phase, "STUDENT_4V4");
assert.equal(resolved.currentPhase, "COMPLETE");
assert.equal(resolved.completed, true);
assert.equal(resolved.resolved, true);
assert.equal(Object.isFrozen(resolved.roleResults.BUFFER), true);
assert.equal(Object.isFrozen(resolved.student4v4Result), true);
assert.equal(Object.isFrozen(resolved.combatResult), true);
assert.throws(() => battle.resolve(), /ALREADY_RESOLVED/);
assert.throws(() => battle.start(), /ALREADY_COMPLETED/);
assert.throws(() => battle.submitInput({}), /ALREADY_COMPLETED/);

const duplicateResult = resolved.roleResults.BUFFER;
assert.throws(() => battle.submitRoleResult("BUFFER", duplicateResult), /ALREADY_COMPLETED/);

const invalidDuplicate = new Student4v4BattleState({ seed: "T043-DUPLICATE" });
invalidDuplicate.start();
completeCurrentRole(invalidDuplicate);
assert.equal(invalidDuplicate.currentPhase, "HEALER");
assert.throws(() => invalidDuplicate.submitRoleResult("BUFFER", invalidDuplicate.roleResults.BUFFER), /DUPLICATE_ROLE_RESULT:BUFFER/);

const deterministicA = runBattle("T043-DETERMINISTIC");
const deterministicB = runBattle("T043-DETERMINISTIC");
assert.deepEqual(deterministicA.resolution, deterministicB.resolution);
assert.deepEqual(deterministicA.phases, ["BUFFER", "HEALER", "DEBUFFER", "BATTER", "RESOLUTION", "COMPLETE"]);

const differentSeed = runBattle("T043-DETERMINISTIC-OTHER");
assert.notDeepEqual(differentSeed.resolution.student4v4Result, deterministicA.resolution.student4v4Result);

const resettable = new Student4v4BattleState({ seed: "T043-RESET" });
resettable.start();
completeCurrentRole(resettable);
resettable.reset();
const resetSnapshot = resettable.snapshot();
assert.equal(resetSnapshot.currentPhase, "INIT");
assert.equal(resetSnapshot.phaseIndex, 0);
assert.equal(resetSnapshot.started, false);
assert.equal(resetSnapshot.completed, false);
assert.equal(resetSnapshot.resolved, false);
assert.deepEqual(resetSnapshot.roleResults, {});
assert.equal(resetSnapshot.student4v4Result, null);
assert.equal(resetSnapshot.combatResult, null);
const resetRun = runBattle("T043-RESET");
const resetRun2 = runBattle("T043-RESET");
assert.deepEqual(resetRun.resolution, resetRun2.resolution);

console.log("student_4v4_battle_state_test: PASS");
