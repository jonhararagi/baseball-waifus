import assert from "node:assert/strict";
import { Student4v4BattleState, STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";
import {
  STUDENT_4V4_ROLE_ORDER,
  STUDENT_4V4_RESULT_TYPE
} from "./student_4v4_orchestrator.js";
import { COMBAT_RESULT_TYPE } from "./combat_core.js";
import { Student4v4BufferInput } from "./student_4v4_buffer_input.js";
import { Student4v4HealerInput } from "./student_4v4_healer_input.js";
import { Student4v4DebufferInput } from "./student_4v4_debuffer_input.js";
import { Student4v4BatterInput } from "./student_4v4_batter_input.js";
import {
  Student4v4PresentationOrchestrator
} from "./student_4v4_presentation_orchestrator.js";
import {
  buildStudent4v4RoleAdapterModels
} from "./student_4v4_role_adapters.js";
import { buildStudent4v4UiModel } from "./student_4v4_ui.js";
import { student4v4ResultToCombatResult } from "./student_4v4_combat_adapter.js";

const ROLE_INPUTS = Object.freeze({
  BUFFER: Student4v4BufferInput,
  HEALER: Student4v4HealerInput,
  DEBUFFER: Student4v4DebufferInput,
  BATTER: Student4v4BatterInput
});

function makeAdapter(role, battle) {
  return new ROLE_INPUTS[role]({ battle, clock: () => 1000 });
}

function perfectPayload(battle) {
  const state = battle.getCurrentRoleGame()?.getState?.();
  assert.ok(state, "active role state is required");

  switch (battle.currentPhase) {
    case "BUFFER":
      return {
        noteId: state.current_note.id,
        lane: state.current_note.lane,
        timestampMs: state.current_note.target_ms
      };
    case "HEALER":
      return {
        threatId: state.current_threat.id,
        zone: state.current_threat.zone,
        timestampMs: state.current_threat.target_ms
      };
    case "DEBUFFER":
      return {
        targetId: state.current_target.id,
        targetType: state.current_target.type,
        position: {
          x: state.current_target.x,
          y: state.current_target.y
        },
        timestampMs: state.current_target.target_ms
      };
    case "BATTER":
      return {
        opportunityId: state.current_opportunity.id,
        timestampMs: state.current_opportunity.target_ms
      };
    default:
      throw new Error("NO_ACTIVE_ROLE:" + battle.currentPhase);
  }
}

function submitThroughAdapter(adapter) {
  const payload = perfectPayload(adapter.battle);
  if (adapter instanceof Student4v4BufferInput) {
    return adapter.submitLane(payload.lane, payload.timestampMs);
  }
  if (adapter instanceof Student4v4HealerInput) {
    return adapter.submitThreat(payload);
  }
  if (adapter instanceof Student4v4DebufferInput) {
    return adapter.submitTarget(payload);
  }
  return adapter.submitSwing(payload);
}

function completeActiveRole(battle, adapter) {
  const role = battle.currentPhase;
  while (battle.currentPhase === role) {
    const response = submitThroughAdapter(adapter);
    assert.equal(response.accepted, true);
  }
}

function startRoleAdapter(role, battle, adapters) {
  const adapter = adapters[role] || (adapters[role] = makeAdapter(role, battle));
  const started = adapter.start();
  assert.equal(started.currentPhase, role);
  return adapter;
}

function runCompleteBattle(seed, { firstBufferMiss = false } = {}) {
  const battle = new Student4v4BattleState({
    seed,
    battleId: "gate-" + seed
  });
  const adapters = {};
  const roleResults = {};

  assert.equal(battle.snapshot().currentPhase, STUDENT_4V4_BATTLE_PHASE.INIT);
  assert.equal(battle.snapshot().started, false);
  assert.equal(battle.snapshot().completed, false);
  assert.equal(battle.snapshot().resolved, false);

  const buffer = startRoleAdapter("BUFFER", battle, adapters);
  assert.equal(battle.currentPhase, "BUFFER");

  const bufferBeforeInvalid = JSON.stringify(battle.snapshot());
  assert.equal(buffer.submitLane("INVALID", 0).accepted, false);
  assert.equal(buffer.getLastResponse().reason, "INVALID_LANE");
  assert.equal(JSON.stringify(battle.snapshot()), bufferBeforeInvalid);

  if (firstBufferMiss) {
    const current = battle.getCurrentRoleGame().getState().current_note;
    const miss = buffer.submitLane(current.lane, current.target_ms + 300);
    assert.equal(miss.accepted, true);
    assert.equal(miss.grade, "MISS");
    assert.equal(battle.snapshot().roleResults.BUFFER, undefined);
  } else {
    submitThroughAdapter(buffer);
  }

  while (battle.currentPhase === "BUFFER") completeActiveRole(battle, buffer);
  roleResults.BUFFER = battle.snapshot().roleResults.BUFFER;
  assert.equal(roleResults.BUFFER.type, "ROLE_RESULT");

  const duplicateSnapshot = JSON.stringify(battle.snapshot());
  assert.throws(
    () => battle.submitRoleResult("BUFFER", roleResults.BUFFER),
    /DUPLICATE_ROLE_RESULT:BUFFER/
  );
  assert.equal(JSON.stringify(battle.snapshot()), duplicateSnapshot);

  const wrongRoleSnapshot = JSON.stringify(battle.snapshot());
  assert.throws(
    () => battle.submitRoleResult("BATTER", {
      type: "ROLE_RESULT",
      role: "BATTER",
      seed,
      score: 1,
      accuracy: 1,
      impactPoints: 1,
      success: true,
      deterministic: true
    }),
    /INVALID_PHASE/
  );
  assert.equal(JSON.stringify(battle.snapshot()), wrongRoleSnapshot);

  const healer = startRoleAdapter("HEALER", battle, adapters);
  const healerBeforeMalformed = JSON.stringify(battle.snapshot());
  const malformedHealer = healer.submitThreat({ threatId: "bad", zone: "BAD", timestampMs: "bad" });
  assert.equal(malformedHealer.accepted, false);
  assert.equal(JSON.stringify(battle.snapshot()), healerBeforeMalformed);
  completeActiveRole(battle, healer);
  roleResults.HEALER = battle.snapshot().roleResults.HEALER;

  const debuffer = startRoleAdapter("DEBUFFER", battle, adapters);
  const debufferBeforeInvalid = JSON.stringify(battle.snapshot());
  const invalidTarget = debuffer.submitTarget({
    targetId: "missing",
    targetType: "ORB",
    position: { x: 0.5, y: 0.5 },
    timestampMs: 500
  });
  assert.equal(invalidTarget.accepted, false);
  assert.ok(
    ["INVALID_TARGET", "INVALID_TARGET_TYPE", "OUT_OF_RANGE", "INVALID_POSITION"].includes(invalidTarget.reason)
  );
  assert.equal(JSON.stringify(battle.snapshot()), debufferBeforeInvalid);
  completeActiveRole(battle, debuffer);
  roleResults.DEBUFFER = battle.snapshot().roleResults.DEBUFFER;

  const batter = startRoleAdapter("BATTER", battle, adapters);
  const batterBeforeInvalid = JSON.stringify(battle.snapshot());
  const invalidTimestamp = batter.submitSwing({
    opportunityId: battle.getCurrentRoleGame().getState().current_opportunity.id,
    timestampMs: "not-a-number"
  });
  assert.equal(invalidTimestamp.accepted, false);
  assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");
  assert.equal(JSON.stringify(battle.snapshot()), batterBeforeInvalid);
  completeActiveRole(battle, batter);
  roleResults.BATTER = battle.snapshot().roleResults.BATTER;

  assert.deepEqual(Object.keys(roleResults), STUDENT_4V4_ROLE_ORDER);
  assert.equal(battle.currentPhase, "RESOLUTION");

  const staleBuffer = adapters.BUFFER.submitLane("LIGHT", 0);
  assert.equal(staleBuffer.accepted, false);
  assert.equal(staleBuffer.reason, "INVALID_PHASE");

  const staleHealer = adapters.HEALER.submitThreat({
    threatId: "stale",
    zone: "TOP",
    timestampMs: 0
  });
  assert.equal(staleHealer.accepted, false);
  assert.equal(staleHealer.reason, "INVALID_PHASE");

  assert.throws(
    () => battle.submitInput({}),
    /INVALID_PHASE/
  );
  assert.equal(battle.currentPhase, "RESOLUTION");

  const presentation = new Student4v4PresentationOrchestrator();
  const beforePresentation = JSON.stringify(battle.snapshot());
  const resolutionView = presentation.update(battle.snapshot());
  assert.equal(resolutionView.presentation.phase, "RESOLUTION");
  assert.equal(resolutionView.presentation.student4v4Result, null);
  assert.equal(resolutionView.presentation.combatResult, null);
  assert.equal(JSON.stringify(battle.snapshot()), beforePresentation);

  const resolutionBefore = JSON.stringify(battle.snapshot());
  const uiBefore = buildStudent4v4UiModel(resolutionView);
  assert.equal(uiBefore.phase, "RESOLUTION");
  assert.equal(uiBefore.resolution, null);
  assert.equal(JSON.stringify(battle.snapshot()), resolutionBefore);

  const resolved = battle.resolve();
  assert.equal(resolved.currentPhase, "COMPLETE");
  assert.equal(resolved.completed, true);
  assert.equal(resolved.resolved, true);
  assert.equal(resolved.student4v4Result.type, STUDENT_4V4_RESULT_TYPE);
  assert.equal(resolved.combatResult.type, COMBAT_RESULT_TYPE);

  const expectedCombat = student4v4ResultToCombatResult(resolved.student4v4Result);
  assert.deepEqual(resolved.combatResult, expectedCombat);

  const completedView = presentation.update(battle.snapshot());
  assert.equal(completedView.presentation.phase, "COMPLETE");
  assert.equal(completedView.presentation.activeRole, null);
  assert.equal(completedView.presentation.completedRoles.length, 4);
  assert.equal(completedView.presentation.student4v4Result.type, STUDENT_4V4_RESULT_TYPE);
  assert.equal(completedView.presentation.combatResult.type, COMBAT_RESULT_TYPE);

  const gameplaySnapshot = JSON.stringify(battle.snapshot());
  const adapterModels = buildStudent4v4RoleAdapterModels(completedView.presentation);
  assert.deepEqual(Object.keys(adapterModels), STUDENT_4V4_ROLE_ORDER);
  const uiModel = buildStudent4v4UiModel(completedView);
  assert.equal(uiModel.phase, "COMPLETE");
  assert.equal(uiModel.student4v4Result.type, STUDENT_4V4_RESULT_TYPE);
  assert.equal(uiModel.combatResult.type, COMBAT_RESULT_TYPE);
  assert.equal(JSON.stringify(battle.snapshot()), gameplaySnapshot);

  assert.throws(() => { resolved.roleResults.BUFFER.score = -1; }, TypeError);
  assert.throws(() => { resolved.student4v4Result.combinedScore = -1; }, TypeError);
  assert.throws(() => { resolved.combatResult.score = -1; }, TypeError);
  assert.throws(() => { completedView.presentation.roleResults.BUFFER.score = -1; }, TypeError);
  assert.throws(() => { adapterModels.BUFFER.result.score = -1; }, TypeError);
  assert.throws(() => { uiModel.student4v4Result.combinedScore = -1; }, TypeError);
  assert.throws(() => { uiModel.combatResult.score = -1; }, TypeError);
  assert.equal(JSON.stringify(battle.snapshot()), gameplaySnapshot);

  assert.throws(() => battle.resolve(), /ALREADY_RESOLVED/);
  assert.throws(() => battle.start(), /ALREADY_COMPLETED/);
  assert.throws(() => battle.submitInput({}), /ALREADY_COMPLETED/);

  return {
    roleResults: resolved.roleResults,
    student4v4Result: resolved.student4v4Result,
    combatResult: resolved.combatResult,
    presentation: completedView.presentation,
    uiModel
  };
}

const first = runCompleteBattle("T052-END-TO-END");
const second = runCompleteBattle("T052-END-TO-END");
assert.deepEqual(first.roleResults, second.roleResults);
assert.deepEqual(first.student4v4Result, second.student4v4Result);
assert.deepEqual(first.combatResult, second.combatResult);
assert.deepEqual(first.presentation, second.presentation);
assert.deepEqual(first.uiModel, second.uiModel);

const varied = runCompleteBattle("T052-END-TO-END", { firstBufferMiss: true });
assert.notDeepEqual(varied.roleResults.BUFFER, first.roleResults.BUFFER);
assert.notEqual(varied.combatResult.score, first.combatResult.score);

const missing = new Student4v4BattleState({ seed: "T052-MISSING" });
missing.start();
assert.throws(() => missing.resolve(), /MISSING_ROLE_RESULT/);
assert.equal(missing.currentPhase, "BUFFER");

const reset = new Student4v4BattleState({ seed: "T052-RESET" });
const resetBuffer = new Student4v4BufferInput({ battle: reset, clock: () => 1000 });
resetBuffer.start();
completeActiveRole(reset, resetBuffer);
assert.equal(reset.currentPhase, "HEALER");
reset.reset();
const resetSnapshot = reset.snapshot();
assert.equal(resetSnapshot.currentPhase, "INIT");
assert.equal(resetSnapshot.started, false);
assert.equal(resetSnapshot.completed, false);
assert.equal(resetSnapshot.resolved, false);
assert.deepEqual(resetSnapshot.roleResults, {});
assert.equal(resetSnapshot.student4v4Result, null);
assert.equal(resetSnapshot.combatResult, null);
for (const role of STUDENT_4V4_ROLE_ORDER) {
  assert.equal(reset.roles[role].getState().completed, false);
}

const phaseGuard = new Student4v4BattleState({ seed: "T052-PHASE-GUARD" });
const healerGuard = new Student4v4HealerInput({ battle: phaseGuard, clock: () => 1000 });
const debufferGuard = new Student4v4DebufferInput({ battle: phaseGuard, clock: () => 1000 });
const batterGuard = new Student4v4BatterInput({ battle: phaseGuard, clock: () => 1000 });
assert.equal(healerGuard.start().accepted, false);
assert.equal(healerGuard.getLastResponse().reason, "INVALID_PHASE");
assert.equal(debufferGuard.start().accepted, false);
assert.equal(debufferGuard.getLastResponse().reason, "INVALID_PHASE");
assert.equal(batterGuard.start().accepted, false);
assert.equal(batterGuard.getLastResponse().reason, "INVALID_PHASE");
assert.equal(phaseGuard.currentPhase, "INIT");

console.log("student_4v4_production_gate_test: PASS");
