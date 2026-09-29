import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { buildBatterPresentationAdapter } from "./student_4v4_role_adapters.js";
import { Student4v4BatterInput } from "./student_4v4_batter_input.js";

function perfectRoleInput(battle) {
  const role = battle.getCurrentRoleGame();
  assert.ok(role, "active role is required");
  const state = role.getState();

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
        position: { x: state.current_target.x, y: state.current_target.y },
        timestampMs: state.current_target.target_ms
      };
    default:
      throw new Error("UNEXPECTED_PRE_BATTER_PHASE");
  }
}

function completePreBatter(battle) {
  battle.start();
  while (battle.currentPhase !== "BATTER") {
    const response = battle.submitInput(perfectRoleInput(battle));
    assert.equal(response.accepted, true);
  }
}

function runBatter(seed, deltas) {
  const battle = new Student4v4BattleState({ seed, battleId: `batter-input-${seed}` });
  completePreBatter(battle);
  const input = new Student4v4BatterInput({ battle, clock: () => 1000 });
  const started = input.start();
  assert.equal(started.currentPhase, "BATTER");

  const responses = [];
  for (const delta of deltas) {
    const opportunity = input.getCurrentOpportunity();
    assert.ok(opportunity, "batter opportunity should exist");
    responses.push(input.submitSwing({
      opportunityId: opportunity.id,
      timestampMs: opportunity.target_ms + delta
    }));
  }

  return { battle, input, responses };
}

const first = runBatter("T050-DETERMINISTIC", [0, 40, 100, 180]);
const second = runBatter("T050-DETERMINISTIC", [0, 40, 100, 180]);

assert.equal(first.responses.every((response) => response.accepted), true);
assert.deepEqual(first.battle.snapshot(), second.battle.snapshot());
assert.deepEqual(first.battle.roleResults.BATTER, second.battle.roleResults.BATTER);

const grades = first.responses.map((response) => response.grade);
assert.deepEqual(grades, ["PERFECT", "GREAT", "GOOD", "MISS"]);
assert.equal(first.battle.currentPhase, "RESOLUTION");
assert.equal(first.input.isActive(), false);
assert.equal(first.battle.roleResults.BATTER.type, "ROLE_RESULT");
assert.equal(first.battle.roleResults.BATTER.role, "BATTER");
assert.equal(first.battle.roleResults.BATTER.deterministic, true);
assert.equal(first.battle.roleResults.BATTER.impactPoints, 225);
assert.equal(Object.isFrozen(first.battle.roleResults.BATTER), true);

const varied = runBatter("T050-VARIATION", [0, 40, 100, 0]);
assert.notDeepEqual(varied.battle.roleResults.BATTER, first.battle.roleResults.BATTER);
assert.ok(varied.battle.roleResults.BATTER.impactPoints > first.battle.roleResults.BATTER.impactPoints);

const invalidBeforeStart = new Student4v4BattleState({ seed: "T050-INVALID-PHASE" });
const invalidInput = new Student4v4BatterInput({ battle: invalidBeforeStart, clock: () => 500 });
const beforeStart = JSON.stringify(invalidBeforeStart.snapshot());
assert.equal(invalidInput.start().reason, "INVALID_PHASE");
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeStart);

completePreBatter(invalidBeforeStart);
const batterInput = new Student4v4BatterInput({ battle: invalidBeforeStart, clock: () => 1000 });
assert.equal(batterInput.start().currentPhase, "BATTER");

const opportunity = batterInput.getCurrentOpportunity();
const beforeInvalid = JSON.stringify(invalidBeforeStart.snapshot());

assert.equal(batterInput.submitSwing(null).reason, "INVALID_INPUT");
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeInvalid);

assert.equal(
  batterInput.submitSwing({
    opportunityId: "missing-opportunity",
    timestampMs: opportunity.target_ms
  }).reason,
  "INVALID_OPPORTUNITY"
);
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeInvalid);

assert.equal(
  batterInput.submitSwing({
    opportunityId: opportunity.id,
    timestampMs: Number.NaN
  }).reason,
  "INVALID_TIMESTAMP"
);
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeInvalid);

assert.equal(
  batterInput.submitSwing({
    opportunityId: opportunity.id,
    timestampMs: -1
  }).reason,
  "INVALID_TIMESTAMP"
);
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeInvalid);

assert.equal(
  batterInput.submitSwing({
    opportunityId: opportunity.id,
    timestampMs: opportunity.target_ms + opportunity.interaction_window_ms + 1
  }).reason,
  "OUT_OF_WINDOW"
);
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), beforeInvalid);

const accepted = batterInput.submitSwing({
  opportunityId: opportunity.id,
  timestampMs: opportunity.target_ms
});
assert.equal(accepted.accepted, true);
const afterFirst = JSON.stringify(invalidBeforeStart.snapshot());
assert.equal(batterInput.submitSwing({
  opportunityId: opportunity.id,
  timestampMs: opportunity.target_ms
}).reason, "OPPORTUNITY_ALREADY_RESOLVED");
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), afterFirst);

const preBatterBeforePresentation = JSON.stringify(invalidBeforeStart.snapshot());
const presentation = new Student4v4PresentationOrchestrator();
const view = presentation.update(invalidBeforeStart.snapshot());
assert.equal(view.presentation.phase, "BATTER");
assert.equal(buildBatterPresentationAdapter(view.presentation).status, "active");
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), preBatterBeforePresentation);

while (invalidBeforeStart.currentPhase === "BATTER") {
  const current = batterInput.getCurrentOpportunity();
  assert.ok(current);
  const response = batterInput.submitSwing({
    opportunityId: current.id,
    timestampMs: current.target_ms
  });
  assert.equal(response.accepted, true);
  presentation.update(invalidBeforeStart.snapshot());
}

assert.equal(invalidBeforeStart.currentPhase, "RESOLUTION");
const completedView = presentation.update(invalidBeforeStart.snapshot());
const adapter = buildBatterPresentationAdapter(completedView.presentation);
assert.equal(adapter.status, "completed");
assert.equal(adapter.active, false);
assert.equal(adapter.completed, true);
assert.equal(adapter.result.type, "ROLE_RESULT");
assert.equal(adapter.result.role, "BATTER");

const roleResultBeforePresentationMutation = JSON.stringify(adapter.result);
assert.equal(JSON.stringify(invalidBeforeStart.snapshot().roleResults.BATTER), roleResultBeforePresentationMutation);

const presentationBeforeMutation = JSON.stringify(invalidBeforeStart.snapshot());
assert.equal(JSON.stringify(presentation.build(invalidBeforeStart.snapshot())), JSON.stringify(completedView.presentation));
assert.equal(JSON.stringify(invalidBeforeStart.snapshot()), presentationBeforeMutation);

const wrongPhaseCases = [
  { phase: "INIT", reason: "INVALID_PHASE" },
  { phase: "BUFFER", reason: "INVALID_PHASE" },
  { phase: "HEALER", reason: "INVALID_PHASE" },
  { phase: "DEBUFFER", reason: "INVALID_PHASE" }
];

for (const { phase, reason } of wrongPhaseCases) {
  const battle = new Student4v4BattleState({ seed: `T050-PHASE-${phase}` });
  const input = new Student4v4BatterInput({ battle, clock: () => 0 });
  if (phase === "INIT") {
    assert.equal(input.submitSwing({}).reason, reason);
    continue;
  }
  battle.start();
  while (battle.currentPhase !== phase) {
    const response = battle.submitInput(perfectRoleInput(battle));
    assert.equal(response.accepted, true);
  }
  assert.equal(input.submitSwing({}).reason, reason);
}

const resolutionCase = runBatter("T050-RESOLUTION", [0, 0, 0, 0]);
assert.equal(resolutionCase.battle.currentPhase, "RESOLUTION");
assert.equal(resolutionCase.input.submitSwing({}).reason, "INVALID_PHASE");

const completeCase = runBatter("T050-COMPLETE", [0, 0, 0, 0]);
completeCase.battle.resolve();
assert.equal(completeCase.battle.currentPhase, "COMPLETE");
assert.equal(completeCase.input.submitSwing({}).reason, "INVALID_PHASE");

const resetBattle = new Student4v4BattleState({ seed: "T050-RESET" });
completePreBatter(resetBattle);
const resetInput = new Student4v4BatterInput({ battle: resetBattle, clock: () => 3000 });
resetInput.start();
const resetOpportunity = resetInput.getCurrentOpportunity();
resetInput.submitSwing({
  opportunityId: resetOpportunity.id,
  timestampMs: resetOpportunity.target_ms
});
resetBattle.reset();
resetInput.reset();

assert.equal(resetBattle.currentPhase, "INIT");
assert.equal(resetBattle.snapshot().roleResults.BATTER, undefined);
assert.equal(resetInput.elapsedMs(), 0);
assert.equal(resetInput.getCurrentOpportunity(), null);
assert.equal(resetInput.getLastResponse(), null);

const postResetStart = resetInput.start();
assert.equal(postResetStart.reason, "INVALID_PHASE");

console.log("student_4v4_batter_input_test: PASS");
