import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { buildBufferPresentationAdapter } from "./student_4v4_role_adapters.js";
import { Student4v4BufferInput } from "./student_4v4_buffer_input.js";
import { BUFFER_LANES } from "./buffer_energy_creator.js";

function run(seed, inputs) {
  let now = 0;
  const battle = new Student4v4BattleState({ seed, battleId: `buffer-input-${seed}` });
  const input = new Student4v4BufferInput({ battle, clock: () => now });
  const presentation = new Student4v4PresentationOrchestrator();

  input.start();
  presentation.update(battle.snapshot());

  const responses = [];
  for (const event of inputs) {
    now = event.atMs;
    responses.push(input.submitLane(event.lane, event.atMs));
  }

  const view = presentation.update(battle.snapshot());
  const adapter = buildBufferPresentationAdapter(view.presentation);
  return { battle, input, responses, view, adapter };
}

function perfectSequence(count = 6) {
  let now = 500;
  const events = [];
  const battle = new Student4v4BattleState({ seed: "T047-TEMPLATE" });
  battle.start();
  while (battle.currentPhase === "BUFFER" && events.length < count) {
    const note = battle.getCurrentRoleGame().getState().current_note;
    events.push({ lane: note.lane, atMs: note.target_ms });
    battle.submitInput({ noteId: note.id, lane: note.lane, timestampMs: note.target_ms });
  }
  return events;
}

const seed = "T047-BUFFER-001";
const referenceBattle = new Student4v4BattleState({ seed });
referenceBattle.start();
const referenceEvents = [];
while (referenceBattle.currentPhase === "BUFFER") {
  const note = referenceBattle.getCurrentRoleGame().getState().current_note;
  referenceEvents.push({ lane: note.lane, atMs: note.target_ms });
  referenceBattle.submitInput({ noteId: note.id, lane: note.lane, timestampMs: note.target_ms });
}
assert.equal(referenceEvents.length, referenceBattle.roleResults.BUFFER.notes_total);

const first = run(seed, referenceEvents);
const second = run(seed, referenceEvents);

assert.equal(first.responses.every((response) => response.accepted), true);
assert.equal(first.battle.currentPhase, "HEALER");
assert.deepEqual(first.battle.snapshot().roleResults.BUFFER, second.battle.snapshot().roleResults.BUFFER);
assert.deepEqual(first.adapter.result, second.adapter.result);
assert.equal(first.adapter.status, "completed");
assert.equal(first.view.presentation.activeRole, "HEALER");
assert.equal(first.view.presentation.completedRoles.includes("BUFFER"), true);
assert.equal(first.view.events.some((event) => event.type === "ROLE_COMPLETED" && event.role === "BUFFER"), true);
assert.equal(first.view.events.some((event) => event.type === "ROLE_STARTED" && event.role === "HEALER"), true);

const varied = run(seed, referenceEvents.map((event, index) => ({
  lane: event.lane,
  atMs: event.atMs + (index === 0 ? 200 : 0)
})));
assert.notDeepEqual(varied.battle.snapshot().roleResults.BUFFER, first.battle.snapshot().roleResults.BUFFER);

const invalid = new Student4v4BattleState({ seed: "T047-INVALID" });
let now = 0;
const invalidInput = new Student4v4BufferInput({ battle: invalid, clock: () => now });
const beforeStart = JSON.stringify(invalid.snapshot());
const beforePhaseResponse = invalidInput.submitLane("LIGHT", 500);
assert.equal(beforePhaseResponse.accepted, false);
assert.equal(beforePhaseResponse.reason, "INVALID_PHASE");
assert.equal(JSON.stringify(invalid.snapshot()), beforeStart);

invalidInput.start();
const activeState = invalid.getCurrentRoleGame().getState();
const invalidLane = invalidInput.submitLane("ULTRA", activeState.current_note.target_ms);
assert.equal(invalidLane.accepted, false);
assert.equal(invalidLane.reason, "INVALID_LANE");
assert.equal(invalid.snapshot().currentPhase, "BUFFER");
assert.equal(invalid.snapshot().roleResults.BUFFER, undefined);

const wrongLane = BUFFER_LANES.find((lane) => lane !== activeState.current_note.lane);
const wrongLaneResponse = invalidInput.submitLane(wrongLane, activeState.current_note.target_ms);
assert.equal(wrongLaneResponse.accepted, true);
assert.equal(wrongLaneResponse.grade, "MISS");

const currentAfterWrongLane = invalid.getCurrentRoleGame().getState().current_note;
const invalidTimestamp = invalidInput.submitLane(currentAfterWrongLane.lane, Number.NaN);
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");
assert.equal(invalid.getCurrentRoleGame().getState().current_index, 1);

const postCompletionBattle = new Student4v4BattleState({ seed: "T047-POST" });
let postNow = 0;
const postInput = new Student4v4BufferInput({ battle: postCompletionBattle, clock: () => postNow });
postInput.start();
while (postCompletionBattle.currentPhase === "BUFFER") {
  const note = postCompletionBattle.getCurrentRoleGame().getState().current_note;
  postNow = note.target_ms;
  const response = postInput.submitLane(note.lane);
  assert.equal(response.accepted, true);
}
assert.equal(postInput.submitLane("LIGHT", 1000).accepted, false);
assert.equal(postInput.getLastResponse().reason, "INVALID_PHASE");
assert.equal(postCompletionBattle.currentPhase, "HEALER");

postCompletionBattle.reset();
postInput.reset();
assert.equal(postCompletionBattle.snapshot().currentPhase, "INIT");
assert.equal(postInput.elapsedMs(), 0);
postInput.start();
assert.equal(postCompletionBattle.currentPhase, "BUFFER");

const replayA = run("T047-REPLAY", perfectSequence());
const replayB = run("T047-REPLAY", perfectSequence());
assert.deepEqual(replayA.battle.snapshot(), replayB.battle.snapshot());

const gameplayBeforePresentation = JSON.stringify(first.battle.snapshot());
const pureView = first.view.presentation;
assert.throws(() => { pureView.phase = "BUFFER"; }, TypeError);
assert.equal(JSON.stringify(first.battle.snapshot()), gameplayBeforePresentation);

console.log("student_4v4_buffer_input_test: PASS");
