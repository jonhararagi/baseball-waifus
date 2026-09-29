import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { buildDebufferPresentationAdapter } from "./student_4v4_role_adapters.js";
import { Student4v4DebufferInput } from "./student_4v4_debuffer_input.js";

function completeRolePerfect(battle) {
  while (battle.currentPhase !== "DEBUFFER") {
    if (battle.currentPhase === "INIT") {
      battle.start();
      continue;
    }
    const role = battle.getCurrentRoleGame();
    const state = role.getState();
    const current = state.current_note || state.current_threat;
    if (!current) throw new Error("UNEXPECTED_PRE_DEBUFFER_STATE");
    if (battle.currentPhase === "BUFFER") {
      battle.submitInput({ noteId: current.id, lane: current.lane, timestampMs: current.target_ms });
    } else {
      battle.submitInput({ threatId: current.id, zone: current.zone, timestampMs: current.target_ms });
    }
  }
}

function perfectTargetInput(battle) {
  const target = battle.getCurrentRoleGame().getState().current_target;
  return {
    targetId: target.id,
    targetType: target.type,
    position: { x: target.x, y: target.y },
    timestampMs: target.target_ms
  };
}

function runPerfect(seed) {
  const battle = new Student4v4BattleState({ seed });
  const input = new Student4v4DebufferInput({ battle, clock: () => 0 });
  completeRolePerfect(battle);
  input.start();

  const responses = [];
  while (battle.currentPhase === "DEBUFFER") {
    const payload = perfectTargetInput(battle);
    responses.push(input.submitTarget(payload));
  }

  const snapshot = battle.snapshot();
  const presentation = new Student4v4PresentationOrchestrator();
  const view = presentation.update(snapshot);
  const adapter = buildDebufferPresentationAdapter(view.presentation);
  return { battle, input, responses, snapshot, view, adapter };
}

const first = runPerfect("T049-DETERMINISTIC");
const second = runPerfect("T049-DETERMINISTIC");

assert.equal(first.responses.every((response) => response.accepted), true);
assert.equal(first.responses.length, 6);
assert.equal(first.battle.currentPhase, "BATTER");
assert.equal(first.snapshot.roleResults.BUFFER.type, "ROLE_RESULT");
assert.equal(first.snapshot.roleResults.HEALER.type, "ROLE_RESULT");
assert.equal(first.snapshot.roleResults.DEBUFFER.type, "ROLE_RESULT");
assert.equal(first.snapshot.roleResults.DEBUFFER.role, "DEBUFFER");
assert.equal(first.snapshot.roleResults.DEBUFFER.deterministic, true);
assert.equal(first.adapter.status, "completed");
assert.equal(first.adapter.active, false);
assert.equal(first.adapter.completed, true);
assert.deepEqual(first.snapshot.roleResults.DEBUFFER, second.snapshot.roleResults.DEBUFFER);
assert.deepEqual(first.adapter.result, second.adapter.result);

const initial = new Student4v4BattleState({ seed: "T049-INVALID" });
const invalidInput = new Student4v4DebufferInput({ battle: initial, clock: () => 0 });
const beforeStart = JSON.stringify(initial.snapshot());
assert.equal(invalidInput.submitTarget(null).accepted, false);
assert.equal(invalidInput.getLastResponse().reason, "INVALID_INPUT");
assert.equal(JSON.stringify(initial.snapshot()), beforeStart);

completeRolePerfect(initial);
invalidInput.start();
const target = initial.getCurrentRoleGame().getState().current_target;
const beforeInvalid = JSON.stringify(initial.snapshot());

const invalidTarget = invalidInput.submitTarget({
  targetId: "missing",
  targetType: target.type,
  position: { x: target.x, y: target.y },
  timestampMs: target.target_ms
});
assert.equal(invalidTarget.accepted, false);
assert.equal(invalidTarget.reason, "INVALID_TARGET");
assert.equal(JSON.stringify(initial.snapshot()), beforeInvalid);

const invalidType = invalidInput.submitTarget({
  targetId: target.id,
  targetType: "INVALID",
  position: { x: target.x, y: target.y },
  timestampMs: target.target_ms
});
assert.equal(invalidType.accepted, false);
assert.equal(invalidType.reason, "INVALID_TARGET_TYPE");
assert.equal(JSON.stringify(initial.snapshot()), beforeInvalid);

const invalidPosition = invalidInput.submitTarget({
  targetId: target.id,
  targetType: target.type,
  position: { x: Number.NaN, y: target.y },
  timestampMs: target.target_ms
});
assert.equal(invalidPosition.accepted, false);
assert.equal(invalidPosition.reason, "INVALID_POSITION");
assert.equal(JSON.stringify(initial.snapshot()), beforeInvalid);

const invalidTimestamp = invalidInput.submitTarget({
  targetId: target.id,
  targetType: target.type,
  position: { x: target.x, y: target.y },
  timestampMs: "bad"
});
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");
assert.equal(JSON.stringify(initial.snapshot()), beforeInvalid);

const valid = invalidInput.submitTarget({
  targetId: target.id,
  targetType: target.type,
  position: { x: target.x, y: target.y },
  timestampMs: target.target_ms
});
assert.equal(valid.accepted, true);
assert.equal(valid.grade, "PERFECT");

const duplicate = invalidInput.submitTarget({
  targetId: target.id,
  targetType: target.type,
  position: { x: target.x, y: target.y },
  timestampMs: target.target_ms
});
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.reason, "DUPLICATE_INPUT");
assert.equal(initial.getCurrentRoleGame().getState().current_index, 1);

const postCompletion = new Student4v4BattleState({ seed: "T049-POST" });
const postInput = new Student4v4DebufferInput({ battle: postCompletion, clock: () => 0 });
completeRolePerfect(postCompletion);
postInput.start();
while (postCompletion.currentPhase === "DEBUFFER") {
  assert.equal(postInput.submitTarget(perfectTargetInput(postCompletion)).accepted, true);
}
assert.equal(postCompletion.currentPhase, "BATTER");
const afterComplete = postInput.submitTarget({
  targetId: "anything",
  targetType: "ORB",
  position: { x: 0.5, y: 0.5 },
  timestampMs: 500
});
assert.equal(afterComplete.accepted, false);
assert.equal(afterComplete.reason, "INVALID_PHASE");

const resetBattle = new Student4v4BattleState({ seed: "T049-RESET" });
const resetInput = new Student4v4DebufferInput({ battle: resetBattle, clock: () => 1000 });
completeRolePerfect(resetBattle);
resetInput.start();
const resetTarget = resetBattle.getCurrentRoleGame().getState().current_target;
resetInput.submitTarget({
  targetId: resetTarget.id,
  targetType: resetTarget.type,
  position: { x: resetTarget.x, y: resetTarget.y },
  timestampMs: resetTarget.target_ms
});
resetBattle.reset();
resetInput.reset();
assert.equal(resetBattle.currentPhase, "INIT");
assert.equal(resetInput.isActive(), false);
assert.equal(resetInput.elapsedMs(2000), 0);
assert.equal(resetInput.getLastResponse(), null);

const presentationBefore = JSON.stringify(first.snapshot);
const purePresentation = buildDebufferPresentationAdapter(first.view.presentation);
assert.equal(JSON.stringify(first.snapshot), presentationBefore);
assert.equal(purePresentation.result.type, "ROLE_RESULT");

const variedBattle = new Student4v4BattleState({ seed: "T049-VARIED" });
const variedInput = new Student4v4DebufferInput({ battle: variedBattle, clock: () => 0 });
completeRolePerfect(variedBattle);
variedInput.start();
const variedFirst = variedInput.getCurrentTarget();
const variedResponse = variedInput.submitTarget({
  targetId: variedFirst.id,
  targetType: variedFirst.type,
  position: { x: Math.min(1, variedFirst.x + 0.2), y: variedFirst.y },
  timestampMs: variedFirst.target_ms + variedFirst.interaction_window_ms
});
assert.equal(variedResponse.accepted, true);
assert.equal(["MISS", "GOOD"].includes(variedResponse.grade), true);
assert.notDeepEqual(
  variedBattle.snapshot().roleResults.DEBUFFER,
  first.snapshot.roleResults.DEBUFFER
);

console.log("student_4v4_debuffer_input_test: PASS");
