import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import {
  Student4v4PresentationOrchestrator,
  buildStudent4v4PresentationSnapshot,
  STUDENT_4V4_PRESENTATION_EVENT
} from "./student_4v4_presentation_orchestrator.js";

const SEED = "T044-PRESENTATION-001";
const ROLE_ORDER = ["BUFFER", "HEALER", "DEBUFFER", "BATTER"];

function perfectInput(battle) {
  const role = battle.getCurrentRoleGame();
  assert.ok(role, "active role is required");
  const state = role.getState();
  if (battle.currentPhase === "BUFFER") {
    return { noteId: state.current_note.id, timestampMs: state.current_note.target_ms };
  }
  if (battle.currentPhase === "HEALER") {
    return { threatId: state.current_threat.id, zone: state.current_threat.zone, timestampMs: state.current_threat.target_ms };
  }
  if (battle.currentPhase === "DEBUFFER") {
    return { targetId: state.current_target.id, x: state.current_target.x, y: state.current_target.y, timestampMs: state.current_target.target_ms };
  }
  return { opportunityId: state.current_opportunity.id, timestampMs: state.current_opportunity.target_ms };
}

function completeCurrentRole(battle) {
  const phase = battle.currentPhase;
  while (!battle.completed && battle.currentPhase === phase) {
    const response = battle.submitInput(perfectInput(battle));
    assert.equal(response.accepted, true);
  }
}

function runToComplete(seed) {
  const battle = new Student4v4BattleState({ seed, battleId: `battle-${seed}` });
  const presentation = new Student4v4PresentationOrchestrator();
  const initial = battle.snapshot();
  const initialView = presentation.update(initial);
  assert.deepEqual(initialView.events, []);
  assert.equal(initialView.presentation.phase, "INIT");
  assert.equal(initialView.presentation.activeRole, null);
  assert.deepEqual(initialView.presentation.completedRoles, []);

  battle.start();
  let view = presentation.update(battle.snapshot());
  assert.deepEqual(view.events.map((event) => event.type), [
    STUDENT_4V4_PRESENTATION_EVENT.BATTLE_STARTED,
    STUDENT_4V4_PRESENTATION_EVENT.ROLE_STARTED
  ]);
  assert.equal(view.presentation.activeRole, "BUFFER");
  assert.equal(view.presentation.roles[0].status, "active");

  for (const role of ROLE_ORDER) {
    assert.equal(battle.currentPhase, role);
    completeCurrentRole(battle);
    view = presentation.update(battle.snapshot());
    assert.equal(view.presentation.roles.find((entry) => entry.role === role).status, "completed");
    assert.equal(view.presentation.completedRoles.includes(role), true);
    if (role !== "BATTER") {
      const nextRole = ROLE_ORDER[ROLE_ORDER.indexOf(role) + 1];
      assert.equal(view.presentation.activeRole, nextRole);
      assert.equal(view.events.some((event) => event.type === "ROLE_COMPLETED" && event.role === role), true);
      assert.equal(view.events.some((event) => event.type === "ROLE_STARTED" && event.role === nextRole), true);
    }
  }

  assert.equal(battle.currentPhase, "RESOLUTION");
  view = presentation.update(battle.snapshot());
  assert.equal(view.presentation.phase, "RESOLUTION");
  assert.equal(view.presentation.activeRole, null);
  assert.equal(view.presentation.student4v4Result, null);
  assert.equal(view.presentation.combatResult, null);
  assert.equal(view.events.some((event) => event.type === "RESOLUTION_STARTED"), true);
  assert.equal(view.events.some((event) => event.type === "ROLE_COMPLETED" && event.role === "BATTER"), true);

  const beforeResolve = JSON.stringify(battle.snapshot());
  battle.resolve();
  view = presentation.update(battle.snapshot());
  assert.equal(view.presentation.phase, "COMPLETE");
  assert.equal(view.presentation.completed, true);
  assert.equal(view.presentation.resolved, true);
  assert.equal(view.presentation.activeRole, null);
  assert.equal(view.presentation.completedRoles.length, 4);
  assert.equal(view.presentation.student4v4Result.type, "STUDENT_4V4_RESULT");
  assert.equal(view.presentation.combatResult.type, "COMBAT_RESULT");
  assert.equal(view.events.some((event) => event.type === "BATTLE_COMPLETED"), true);
  assert.equal(JSON.stringify(battle.snapshot()).includes(JSON.parse(beforeResolve).seed), true);

  return { battle, presentation, result: view.presentation };
}

const { battle, presentation, result } = runToComplete(SEED);

assert.equal(result.type, "STUDENT_4V4_PRESENTATION_STATE");
assert.equal(Object.isFrozen(result), true);
assert.equal(Object.isFrozen(result.roles), true);
assert.equal(Object.isFrozen(result.completedRoles), true);
assert.equal(Object.isFrozen(result.roleResults), true);
assert.equal(Object.isFrozen(result.student4v4Result), true);
assert.equal(Object.isFrozen(result.combatResult), true);
assert.notEqual(result.roleResults, battle.snapshot().roleResults);
assert.notEqual(result.student4v4Result, battle.snapshot().student4v4Result);
assert.notEqual(result.combatResult, battle.snapshot().combatResult);

const gameplayBefore = JSON.stringify(battle.snapshot());
assert.throws(() => { result.phase = "BUFFER"; }, TypeError);
assert.throws(() => { result.roleResults.BUFFER.score = -1; }, TypeError);
assert.throws(() => { result.student4v4Result.combinedScore = -1; }, TypeError);
assert.equal(JSON.stringify(battle.snapshot()), gameplayBefore);

const beforeBuild = JSON.stringify(battle.snapshot());
const pureA = buildStudent4v4PresentationSnapshot(battle.snapshot());
const pureB = buildStudent4v4PresentationSnapshot(battle.snapshot());
assert.deepEqual(pureA, pureB);
assert.equal(JSON.stringify(battle.snapshot()), beforeBuild);
assert.equal(presentation.getSnapshot().phase, "COMPLETE");

const deterministicA = runToComplete("T044-DETERMINISTIC").result;
const deterministicB = runToComplete("T044-DETERMINISTIC").result;
assert.deepEqual(deterministicA, deterministicB);

const resettable = new Student4v4PresentationOrchestrator();
const resetBattle = new Student4v4BattleState({ seed: "T044-RESET" });
resettable.update(resetBattle.snapshot());
resetBattle.start();
resettable.update(resetBattle.snapshot());
resettable.reset();
assert.equal(resettable.getSnapshot(), null);
resetBattle.reset();
const resetView = resettable.update(resetBattle.snapshot());
assert.equal(resetView.presentation.phase, "INIT");
assert.deepEqual(resetView.events, []);

const sideEffectBattle = new Student4v4BattleState({ seed: "T044-NO-GAMEPLAY" });
const sideEffectBefore = JSON.stringify(sideEffectBattle.snapshot());
const sideEffectPresentation = new Student4v4PresentationOrchestrator();
sideEffectPresentation.build(sideEffectBattle.snapshot());
assert.equal(JSON.stringify(sideEffectBattle.snapshot()), sideEffectBefore);
assert.equal(sideEffectBattle.currentPhase, "INIT");

console.log("student_4v4_presentation_orchestrator_test: PASS");
