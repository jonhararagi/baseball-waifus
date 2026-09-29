import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { buildHealerPresentationAdapter } from "./student_4v4_role_adapters.js";
import { Student4v4BufferInput } from "./student_4v4_buffer_input.js";
import { Student4v4HealerInput } from "./student_4v4_healer_input.js";

function completeBuffer(battle) {
  const bufferInput = new Student4v4BufferInput({ battle, clock: () => 0 });
  bufferInput.start();

  while (battle.currentPhase === "BUFFER") {
    const note = battle.getCurrentRoleGame().getState().current_note;
    const response = bufferInput.submitLane(note.lane, note.target_ms);
    assert.equal(response.accepted, true);
  }

  return bufferInput;
}

function runHealer(seed, deltaForThreat) {
  let now = 1000;
  const battle = new Student4v4BattleState({ seed, battleId: "healer-input-" + seed });
  const bufferInput = completeBuffer(battle);
  assert.equal(battle.currentPhase, "HEALER");

  const healerInput = new Student4v4HealerInput({ battle, clock: () => now });
  const presentation = new Student4v4PresentationOrchestrator();

  const startResponse = healerInput.start();
  assert.equal(startResponse.currentPhase, "HEALER");
  presentation.update(battle.snapshot());

  const responses = [];
  while (battle.currentPhase === "HEALER") {
    const threat = battle.getCurrentRoleGame().getState().current_threat;
    const delta = typeof deltaForThreat === "function" ? deltaForThreat(threat.index) : Number(deltaForThreat);
    now = 1000 + threat.target_ms + delta;
    responses.push(
      healerInput.submitThreat({
        threatId: threat.id,
        zone: threat.zone,
        timestampMs: threat.target_ms + delta
      })
    );
    presentation.update(battle.snapshot());
  }

  const view = presentation.getSnapshot();
  const adapter = buildHealerPresentationAdapter(view);
  return { battle, bufferInput, healerInput, presentation, responses, adapter };
}

const gradeRun = (index) => index % 4 === 0 ? 0 : index % 4 === 1 ? 60 : index % 4 === 2 ? 120 : 190;
const first = runHealer("T048-DETERMINISTIC", gradeRun);
const second = runHealer("T048-DETERMINISTIC", gradeRun);

assert.equal(first.responses.every((response) => response.accepted), true);
assert.equal(first.battle.currentPhase, "DEBUFFER");
assert.equal(first.battle.roleResults.BUFFER.type, "ROLE_RESULT");
assert.equal(first.battle.roleResults.HEALER.type, "ROLE_RESULT");
assert.equal(first.battle.roleResults.HEALER.role, "HEALER");
assert.equal(first.battle.roleResults.DEBUFFER, undefined);
assert.equal(first.battle.student4v4Result, null);
assert.equal(first.battle.combatResult, null);
assert.deepEqual(first.battle.roleResults.HEALER, second.battle.roleResults.HEALER);
assert.deepEqual(first.adapter.result, second.adapter.result);
assert.equal(first.adapter.status, "completed");
assert.equal(first.adapter.completed, true);
assert.equal(first.presentation.getSnapshot().activeRole, "DEBUFFER");

const grades = new Set(first.responses.map((response) => response.grade));
assert.deepEqual(grades, new Set(["PERFECT", "GREAT", "GOOD", "MISS"]));

const state = first.battle.snapshot();
assert.equal(state.currentPhase, "DEBUFFER");
assert.equal(state.roleResults.HEALER.threats_total, first.responses.length);
assert.equal(state.roleResults.HEALER.deterministic, true);
assert.ok(Object.isFrozen(state.roleResults.HEALER));

const perfect = runHealer("T048-VARIATION", 0);
const misses = runHealer("T048-VARIATION", 190);
assert.notDeepEqual(perfect.battle.roleResults.HEALER, misses.battle.roleResults.HEALER);
assert.ok(perfect.battle.roleResults.HEALER.protectedPoints > misses.battle.roleResults.HEALER.protectedPoints);
assert.notEqual(perfect.battle.roleResults.HEALER.success, misses.battle.roleResults.HEALER.success);

const invalidBeforeStart = new Student4v4BattleState({ seed: "T048-INVALID-PHASE" });
const invalidInput = new Student4v4HealerInput({ battle: invalidBeforeStart, clock: () => 0 });
const before = JSON.stringify(invalidBeforeStart.snapshot());
const rejectedStart = invalidInput.start();
assert.equal(rejectedStart.accepted, false);
assert.equal(rejectedStart.reason, "INVALID_PHASE");
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), before);

const invalidBattle = new Student4v4BattleState({ seed: "T048-INVALID" });
completeBuffer(invalidBattle);
let clock = 2000;
const input = new Student4v4HealerInput({ battle: invalidBattle, clock: () => clock });
assert.equal(input.start().currentPhase, "HEALER");

const currentThreat = invalidBattle.getCurrentRoleGame().getState().current_threat;
const invalidStructure = input.submitThreat(null);
assert.equal(invalidStructure.accepted, false);
assert.equal(invalidStructure.reason, "INVALID_INPUT");
assert.equal(invalidBattle.snapshot().roleResults.HEALER, undefined);
assert.equal(invalidBattle.getCurrentRoleGame().getState().current_index, 0);

const invalidThreat = input.submitThreat({
  threatId: "unknown",
  zone: currentThreat.zone,
  timestampMs: currentThreat.target_ms
});
assert.equal(invalidThreat.accepted, false);
assert.equal(invalidThreat.reason, "INVALID_THREAT");

const invalidZone = input.submitThreat({
  threatId: currentThreat.id,
  zone: "NOWHERE",
  timestampMs: currentThreat.target_ms
});
assert.equal(invalidZone.accepted, false);
assert.equal(invalidZone.reason, "INVALID_ZONE");

const invalidTimestamp = input.submitThreat({
  threatId: currentThreat.id,
  zone: currentThreat.zone,
  timestampMs: Number.NaN
});
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");

const outOfWindow = input.submitThreat({
  threatId: currentThreat.id,
  zone: currentThreat.zone,
  timestampMs: currentThreat.target_ms + 221
});
assert.equal(outOfWindow.accepted, false);
assert.equal(outOfWindow.reason, "OUT_OF_WINDOW");

const firstAccepted = input.submitThreat({
  threatId: currentThreat.id,
  zone: currentThreat.zone,
  timestampMs: currentThreat.target_ms
});
assert.equal(firstAccepted.accepted, true);

const duplicate = input.submitThreat({
  threatId: currentThreat.id,
  zone: currentThreat.zone,
  timestampMs: currentThreat.target_ms
});
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.reason, "THREAT_ALREADY_RESOLVED");
assert.equal(invalidBattle.snapshot().roleResults.HEALER, undefined);
assert.equal(invalidBattle.getCurrentRoleGame().getState().current_index, 1);

const wrongPhaseBattle = new Student4v4BattleState({ seed: "T048-WRONG-PHASE" });
completeBuffer(wrongPhaseBattle);
const wrongPhaseInput = new Student4v4HealerInput({ battle: wrongPhaseBattle, clock: () => 0 });
wrongPhaseInput.start();
while (wrongPhaseBattle.currentPhase === "HEALER") {
  const threat = wrongPhaseBattle.getCurrentRoleGame().getState().current_threat;
  assert.equal(
    wrongPhaseInput.submitThreat({ threatId: threat.id, zone: threat.zone, timestampMs: threat.target_ms }).accepted,
    true
  );
}
assert.equal(wrongPhaseBattle.currentPhase, "DEBUFFER");
const afterHealer = wrongPhaseInput.submitThreat({ threatId: "late", zone: "TOP", timestampMs: 500 });
assert.equal(afterHealer.accepted, false);
assert.equal(afterHealer.reason, "INVALID_PHASE");

const resetBattle = new Student4v4BattleState({ seed: "T048-RESET" });
completeBuffer(resetBattle);
const resetInput = new Student4v4HealerInput({ battle: resetBattle, clock: () => 100 });
resetInput.start();
const resetThreat = resetBattle.getCurrentRoleGame().getState().current_threat;
resetInput.submitThreat({ threatId: resetThreat.id, zone: resetThreat.zone, timestampMs: resetThreat.target_ms });
resetBattle.reset();
resetInput.reset();
assert.equal(resetBattle.snapshot().currentPhase, "INIT");
assert.equal(resetBattle.snapshot().roleResults.BUFFER, undefined);
assert.equal(resetBattle.snapshot().roleResults.HEALER, undefined);
assert.equal(resetInput.elapsedMs(), 0);
assert.equal(resetInput.getLastResponse(), null);
const postResetStart = resetInput.start();
assert.equal(postResetStart.accepted, false);
assert.equal(postResetStart.reason, "INVALID_PHASE");

const sideEffectBattle = new Student4v4BattleState({ seed: "T048-SIDE-EFFECT" });
completeBuffer(sideEffectBattle);
const sideEffectInput = new Student4v4HealerInput({ battle: sideEffectBattle, clock: () => 0 });
sideEffectInput.start();
const threat = sideEffectBattle.getCurrentRoleGame().getState().current_threat;
const beforePresentation = JSON.stringify(sideEffectBattle.snapshot());
const presentationView = new Student4v4PresentationOrchestrator();
presentationView.update(sideEffectBattle.snapshot());
presentationView.update(sideEffectBattle.snapshot());
assert.equal(JSON.stringify(sideEffectBattle.snapshot()), beforePresentation);
assert.equal(presentationView.getSnapshot().phase, "HEALER");
assert.equal(presentationView.getSnapshot().activeRole, "HEALER");
assert.equal(presentationView.getSnapshot().roleResults.HEALER, undefined);
assert.ok(threat.id);

const finalResponse = first.healerInput.submitThreat({
  threatId: "late",
  zone: "TOP",
  timestampMs: 1
});
assert.equal(finalResponse.accepted, false);
assert.equal(finalResponse.reason, "INVALID_PHASE");

console.log("student_4v4_healer_input_test: PASS");
