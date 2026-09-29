import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { buildStudent4v4UiModel } from "./student_4v4_ui.js";
import { Student4v4BufferInput } from "./student_4v4_buffer_input.js";
import { Student4v4HealerInput } from "./student_4v4_healer_input.js";
import { Student4v4DebufferInput } from "./student_4v4_debuffer_input.js";
import { Student4v4BatterInput } from "./student_4v4_batter_input.js";
import { STUDENT_4V4_ROLE_ORDER, STUDENT_4V4_RESULT_TYPE } from "./student_4v4_orchestrator.js";
import { COMBAT_RESULT_TYPE } from "./combat_core.js";

const ROLE_INPUTS = Object.freeze({
  BUFFER: Student4v4BufferInput,
  HEALER: Student4v4HealerInput,
  DEBUFFER: Student4v4DebufferInput,
  BATTER: Student4v4BatterInput
});

function buildInput(role, battle) {
  return new ROLE_INPUTS[role]({ battle, clock: () => 1000 });
}

function perfectPayload(battle) {
  const state = battle.getCurrentRoleGame()?.getState?.();
  assert.ok(state, "active role state is required");

  switch (battle.currentPhase) {
    case "BUFFER":
      return { noteId: state.current_note.id, lane: state.current_note.lane, timestampMs: state.current_note.target_ms };
    case "HEALER":
      return { threatId: state.current_threat.id, zone: state.current_threat.zone, timestampMs: state.current_threat.target_ms };
    case "DEBUFFER":
      return { targetId: state.current_target.id, targetType: state.current_target.type, position: { x: state.current_target.x, y: state.current_target.y }, timestampMs: state.current_target.target_ms };
    case "BATTER":
      return { opportunityId: state.current_opportunity.id, timestampMs: state.current_opportunity.target_ms };
    default:
      throw new Error("NO_ACTIVE_ROLE:" + battle.currentPhase);
  }
}

function submitThroughAdapter(role, adapter) {
  const payload = perfectPayload(adapter.battle);
  switch (role) {
    case "BUFFER": return adapter.submitLane(payload.lane, payload.timestampMs);
    case "HEALER": return adapter.submitThreat(payload);
    case "DEBUFFER": return adapter.submitTarget(payload);
    case "BATTER": return adapter.submitSwing(payload);
    default: throw new Error("UNKNOWN_ROLE:" + role);
  }
}

function runInteractiveBattle(seed) {
  const battle = new Student4v4BattleState({ seed, battleId: "t051-" + seed });
  const adapters = {};
  const phases = [];
  battle.start();

  while (battle.currentPhase !== "RESOLUTION") {
    const role = battle.currentPhase;
    phases.push(role);
    const adapter = adapters[role] || (adapters[role] = buildInput(role, battle));
    assert.equal(adapter.start().currentPhase, role);
    while (battle.currentPhase === role) {
      const response = submitThroughAdapter(role, adapter);
      assert.equal(response.accepted, true, role + " rejected valid input: " + (response.reason || "unknown"));
    }
  }

  phases.push("RESOLUTION");
  return { battle, adapters, phases };
}

function resolveInteractive(seed) {
  const run = runInteractiveBattle(seed);
  const battle = run.battle;
  const beforeResolve = battle.snapshot();

  assert.deepEqual(run.phases, ["BUFFER", "HEALER", "DEBUFFER", "BATTER", "RESOLUTION"]);
  assert.equal(beforeResolve.completed, false);
  assert.equal(beforeResolve.resolved, false);
  assert.deepEqual(Object.keys(beforeResolve.roleResults), STUDENT_4V4_ROLE_ORDER);

  const presentation = new Student4v4PresentationOrchestrator();
  const resolutionView = presentation.update(beforeResolve);
  assert.equal(resolutionView.presentation.phase, "RESOLUTION");
  assert.equal(resolutionView.presentation.activeRole, null);
  assert.equal(resolutionView.presentation.student4v4Result, null);
  assert.equal(resolutionView.presentation.combatResult, null);

  const gameplayBeforeUi = JSON.stringify(battle.snapshot());
  const uiModelBeforeResolve = buildStudent4v4UiModel(resolutionView);
  assert.equal(uiModelBeforeResolve.phase, "RESOLUTION");
  assert.equal(uiModelBeforeResolve.resolution, null);
  assert.equal(JSON.stringify(battle.snapshot()), gameplayBeforeUi);

  const resolved = battle.resolve();
  assert.equal(resolved.currentPhase, "COMPLETE");
  assert.equal(resolved.completed, true);
  assert.equal(resolved.resolved, true);
  assert.equal(resolved.student4v4Result.type, STUDENT_4V4_RESULT_TYPE);
  assert.equal(resolved.combatResult.type, COMBAT_RESULT_TYPE);
  assert.equal(resolved.combatResult.phase, "STUDENT_4V4");
  assert.equal(resolved.combatResult.student_4v4_result.type, STUDENT_4V4_RESULT_TYPE);

  for (const role of STUDENT_4V4_ROLE_ORDER) {
    const result = resolved.roleResults[role];
    assert.equal(result.type, "ROLE_RESULT");
    assert.equal(result.role, role);
    assert.equal(result.seed, seed);
    assert.equal(result.deterministic, true);
    assert.equal(Object.isFrozen(result), true);
  }

  assert.equal(Object.isFrozen(resolved.student4v4Result), true);
  assert.equal(Object.isFrozen(resolved.combatResult), true);
  assert.equal(Object.isFrozen(resolved.combatResult.student_4v4_result), true);

  const completedView = presentation.update(resolved);
  const uiModelAfterResolve = buildStudent4v4UiModel(completedView);
  assert.equal(uiModelAfterResolve.phase, "COMPLETE");
  assert.equal(uiModelAfterResolve.completed, true);
  assert.ok(uiModelAfterResolve.resolution);
  assert.equal(uiModelAfterResolve.student4v4Result.type, STUDENT_4V4_RESULT_TYPE);
  assert.equal(uiModelAfterResolve.combatResult.type, COMBAT_RESULT_TYPE);

  const resultSnapshot = JSON.stringify(battle.snapshot());
  assert.throws(() => { resolved.student4v4Result.combinedScore = -1; }, TypeError);
  assert.throws(() => { resolved.combatResult.score = -1; }, TypeError);
  assert.throws(() => { resolved.roleResults.BUFFER.score = -1; }, TypeError);
  assert.equal(JSON.stringify(battle.snapshot()), resultSnapshot);

  assert.throws(() => battle.resolve(), /ALREADY_RESOLVED/);
  const stale = run.adapters.BUFFER.submitLane("LIGHT", 0);
  assert.equal(stale.accepted, false);
  assert.equal(stale.reason, "INVALID_PHASE");

  return resolved;
}

const first = resolveInteractive("T051-FULL-001");
const second = resolveInteractive("T051-FULL-001");
assert.deepEqual(first.student4v4Result, second.student4v4Result);
assert.deepEqual(first.combatResult, second.combatResult);
assert.deepEqual(first.roleResults, second.roleResults);

const varied = resolveInteractive("T051-FULL-002");
assert.notEqual(varied.student4v4Result.seed, first.student4v4Result.seed);

const incomplete = new Student4v4BattleState({ seed: "T051-INCOMPLETE" });
incomplete.start();
assert.throws(() => incomplete.resolve(), /MISSING_ROLE_RESULT/);
assert.equal(incomplete.currentPhase, "BUFFER");

const invalidRole = new Student4v4BattleState({ seed: "T051-INVALID-ROLE" });
invalidRole.start();
const invalidSnapshot = JSON.stringify(invalidRole.snapshot());
assert.throws(() => invalidRole.submitRoleResult("HEALER", {
  type: "ROLE_RESULT", role: "HEALER", seed: "T051-INVALID-ROLE", score: 1, accuracy: 100,
  protectedPoints: 1, success: true, deterministic: true
}), /INVALID_PHASE/);
assert.equal(JSON.stringify(invalidRole.snapshot()), invalidSnapshot);

const duplicateRun = runInteractiveBattle("T051-DUPLICATE");
assert.throws(() => duplicateRun.battle.submitRoleResult("BUFFER", duplicateRun.battle.roleResults.BUFFER), /DUPLICATE_ROLE_RESULT:BUFFER/);

const resetBattle = new Student4v4BattleState({ seed: "T051-RESET" });
const resetAdapters = {};
resetBattle.start();
while (resetBattle.currentPhase !== "RESOLUTION") {
  const role = resetBattle.currentPhase;
  const adapter = resetAdapters[role] || (resetAdapters[role] = buildInput(role, resetBattle));
  adapter.start();
  while (resetBattle.currentPhase === role) assert.equal(submitThroughAdapter(role, adapter).accepted, true);
}
resetBattle.resolve();
assert.equal(resetBattle.currentPhase, "COMPLETE");
resetBattle.reset();
const resetSnapshot = resetBattle.snapshot();
assert.equal(resetSnapshot.currentPhase, "INIT");
assert.equal(resetSnapshot.started, false);
assert.equal(resetSnapshot.completed, false);
assert.equal(resetSnapshot.resolved, false);
assert.deepEqual(resetSnapshot.roleResults, {});
assert.equal(resetSnapshot.student4v4Result, null);
assert.equal(resetSnapshot.combatResult, null);
for (const role of STUDENT_4V4_ROLE_ORDER) assert.equal(resetBattle.roles[role].getState().completed, false);

console.log("student_4v4_full_resolution_test: PASS");
