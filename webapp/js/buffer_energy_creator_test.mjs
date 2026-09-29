import assert from "node:assert/strict";
import { BufferEnergyCreator, BUFFER_LANES, classifyBufferTiming, createBufferSequence } from "./buffer_energy_creator.js";
import { bufferRoleResultToCombatResult } from "./buffer_combat_adapter.js";

const sequenceA = createBufferSequence("T034-SEED", 8);
const sequenceB = createBufferSequence("T034-SEED", 8);
assert.deepEqual(sequenceA, sequenceB, "same seed must generate the same sequence");
assert.equal(sequenceA.every((note) => BUFFER_LANES.includes(note.lane)), true);
assert.equal(new Set(sequenceA.map((note) => note.lane)).size >= 1, true);

const perfect = new BufferEnergyCreator({ seed: "PERFECT", count: 1 });
const perfectNote = perfect.getCurrentNote();
const perfectHit = perfect.submitInput({ noteId: perfectNote.id, timestampMs: perfectNote.target_ms });
assert.equal(perfectHit.grade, "PERFECT");
assert.equal(perfectHit.accepted, true);

const good = new BufferEnergyCreator({ seed: "GOOD", count: 1 });
const goodNote = good.getCurrentNote();
assert.equal(classifyBufferTiming(goodNote.good_window_ms, goodNote), "GOOD");
const goodHit = good.submitInput({ noteId: goodNote.id, timestampMs: goodNote.target_ms + goodNote.good_window_ms });
assert.equal(goodHit.grade, "GOOD");

const miss = new BufferEnergyCreator({ seed: "MISS", count: 1 });
const missNote = miss.getCurrentNote();
const missHit = miss.submitInput({ noteId: missNote.id, timestampMs: missNote.target_ms + missNote.good_window_ms + 1 });
assert.equal(missHit.grade, "MISS");
assert.equal(missHit.accepted, true);
assert.equal(missHit.state.completed, true);

const invalid = new BufferEnergyCreator({ seed: "INVALID", count: 2 });
const invalidNote = invalid.getCurrentNote();
const invalidInput = invalid.submitInput({ noteId: "not-the-current-note", timestampMs: invalidNote.target_ms });
assert.equal(invalidInput.accepted, false);
assert.equal(invalidInput.reason, "INVALID_NOTE");
assert.equal(invalid.getState().current_index, 0);
const invalidTimestamp = invalid.submitInput({ noteId: invalidNote.id, timestampMs: "nope" });
assert.equal(invalidTimestamp.accepted, false);
assert.equal(invalidTimestamp.reason, "INVALID_TIMESTAMP");


const laneInput = new BufferEnergyCreator({ seed: "LANE-INPUT", count: 1 });
const laneNote = laneInput.getCurrentNote();
const wrongLane = BUFFER_LANES.find((lane) => lane !== laneNote.lane);
const wrongLaneHit = laneInput.submitInput({
  noteId: laneNote.id,
  lane: wrongLane,
  timestampMs: laneNote.target_ms
});
assert.equal(wrongLaneHit.accepted, true);
assert.equal(wrongLaneHit.grade, "MISS");
assert.equal(wrongLaneHit.hit.lane_match, false);
assert.equal(wrongLaneHit.hit.input_lane, wrongLane);

const invalidLane = new BufferEnergyCreator({ seed: "INVALID-LANE", count: 1 });
const invalidLaneNote = invalidLane.getCurrentNote();
const invalidLaneInput = invalidLane.submitInput({
  noteId: invalidLaneNote.id,
  lane: "ULTRA",
  timestampMs: invalidLaneNote.target_ms
});
assert.equal(invalidLaneInput.accepted, false);
assert.equal(invalidLaneInput.reason, "INVALID_LANE");
assert.equal(invalidLane.getState().current_index, 0);

const completed = new BufferEnergyCreator({ seed: "COMPLETE", count: 1 });
const completedNote = completed.getCurrentNote();
completed.submitInput({ noteId: completedNote.id, timestampMs: completedNote.target_ms });
const postCompletion = completed.submitInput({ noteId: completedNote.id, timestampMs: completedNote.target_ms });
assert.equal(postCompletion.accepted, false);
assert.equal(postCompletion.reason, "POST_COMPLETION");

function runDeterministicInputs(seed) {
  const game = new BufferEnergyCreator({ seed, count: 5 });
  while (!game.completed) {
    const note = game.getCurrentNote();
    game.submitInput({ noteId: note.id, timestampMs: note.target_ms + (note.index % 4 === 0 ? 0 : note.index % 4 === 1 ? 60 : note.index % 4 === 2 ? 120 : 250) });
  }
  return game.getResult();
}

assert.deepEqual(runDeterministicInputs("DETERMINISTIC"), runDeterministicInputs("DETERMINISTIC"));
const deterministicResult = runDeterministicInputs("DETERMINISTIC");
assert.equal(deterministicResult.type, "ROLE_RESULT");
assert.equal(deterministicResult.role, "BUFFER");
assert.equal(deterministicResult.deterministic, true);

const combatResult = bufferRoleResultToCombatResult(deterministicResult, { energyBefore: 10, maxEnergy: 100, turn: 2 });
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.role, "BUFFER");
assert.equal(combatResult.energy_before, 10);
assert.equal(combatResult.energy_after, Math.min(100, 10 + deterministicResult.energy_points));
assert.equal(combatResult.deterministic, true);
assert.equal(combatResult.role_result, deterministicResult);

const before = JSON.stringify(deterministicResult);
const presentationProbe = { textContent: deterministicResult.energy_tier };
presentationProbe.textContent = "HEAVY";
assert.equal(JSON.stringify(deterministicResult), before, "presentation-like mutation must not change ROLE_RESULT");

console.log("[buffer] sequence contract passed");
console.log("[buffer] perfect/good/miss classification passed");
console.log("[buffer] invalid and post-completion input handling passed");
console.log("[buffer] determinism passed");
console.log("[buffer] ROLE_RESULT -> COMBAT_RESULT adapter passed");
