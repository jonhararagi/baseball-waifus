import assert from "node:assert/strict";
import {
  BatterLeader,
  createBatterTimingSequence,
  classifyBatterTiming
} from "./batter_leader.js";
import { batterRoleResultToCombatResult } from "./batter_combat_adapter.js";

const sequenceA = createBatterTimingSequence("T037", 4);
const sequenceB = createBatterTimingSequence("T037", 4);
assert.deepEqual(sequenceA, sequenceB, "same seed must generate the same timing sequence");

assert.equal(classifyBatterTiming(0, sequenceA[0]), "PERFECT");
assert.equal(classifyBatterTiming(40, sequenceA[0]), "GREAT");
assert.equal(classifyBatterTiming(100, sequenceA[0]), "GOOD");
assert.equal(classifyBatterTiming(180, sequenceA[0]), "MISS");

function runDeterministic(inputs) {
  const game = new BatterLeader({ seed: "T037-DETERMINISM", count: inputs.length });
  for (let index = 0; index < inputs.length; index += 1) {
    const opportunity = game.getCurrentOpportunity();
    const response = game.submitInput({
      opportunityId: opportunity.id,
      timestampMs: opportunity.target_ms + inputs[index]
    });
    assert.equal(response.accepted, true);
  }
  return game.getResult();
}

const deterministicA = runDeterministic([0, 40, 100, 180]);
const deterministicB = runDeterministic([0, 40, 100, 180]);
assert.deepEqual(deterministicA, deterministicB, "same seed + same inputs must produce the same ROLE_RESULT");
assert.equal(deterministicA.role, "BATTER");
assert.equal(deterministicA.type, "ROLE_RESULT");
assert.equal(deterministicA.deterministic, true);
assert.equal(Object.isFrozen(deterministicA), true);
assert.equal(Object.isFrozen(deterministicA.hits), true);

const perfect = new BatterLeader({ seed: "PERFECT", count: 1 });
const perfectOpportunity = perfect.getCurrentOpportunity();
const perfectResponse = perfect.submitInput({ opportunityId: perfectOpportunity.id, timestampMs: perfectOpportunity.target_ms });
assert.equal(perfectResponse.grade, "PERFECT");
assert.equal(perfectResponse.hit.hit, true);
assert.equal(perfectResponse.result.impactPoints, 100);

const great = new BatterLeader({ seed: "GREAT", count: 1 });
const greatOpportunity = great.getCurrentOpportunity();
assert.equal(great.submitInput({ opportunityId: greatOpportunity.id, timestampMs: greatOpportunity.target_ms + 40 }).grade, "GREAT");

const good = new BatterLeader({ seed: "GOOD", count: 1 });
const goodOpportunity = good.getCurrentOpportunity();
assert.equal(good.submitInput({ opportunityId: goodOpportunity.id, timestampMs: goodOpportunity.target_ms + 100 }).grade, "GOOD");

const miss = new BatterLeader({ seed: "MISS", count: 1 });
const missOpportunity = miss.getCurrentOpportunity();
const missResponse = miss.submitInput({ opportunityId: missOpportunity.id, timestampMs: missOpportunity.target_ms + 180 });
assert.equal(missResponse.accepted, true);
assert.equal(missResponse.grade, "MISS");
assert.equal(missResponse.hit.hit, false);

const invalid = new BatterLeader({ seed: "INVALID", count: 2 });
const invalidOpportunity = invalid.getCurrentOpportunity();
const beforeInvalid = { index: invalid.getState().current_index, score: invalid.getState().score, impact: invalid.getState().impact_points };
assert.equal(invalid.submitInput({ opportunityId: "unknown", timestampMs: invalidOpportunity.target_ms }).reason, "INVALID_NOTE");
assert.deepEqual({ index: invalid.getState().current_index, score: invalid.getState().score, impact: invalid.getState().impact_points }, beforeInvalid);
assert.equal(invalid.submitInput({ opportunityId: invalidOpportunity.id, timestampMs: "bad" }).reason, "INVALID_TIMESTAMP");
assert.equal(invalid.submitInput({ opportunityId: invalidOpportunity.id, timestampMs: invalidOpportunity.target_ms + 300 }).reason, "OUT_OF_WINDOW");
assert.equal(invalid.getState().current_index, 0, "rejected input must not advance gameplay");

const firstValid = invalid.submitInput({ opportunityId: invalidOpportunity.id, timestampMs: invalidOpportunity.target_ms });
assert.equal(firstValid.accepted, true);
assert.equal(invalid.submitInput({ opportunityId: invalidOpportunity.id, timestampMs: invalidOpportunity.target_ms }).reason, "OPPORTUNITY_ALREADY_RESOLVED");

const completion = new BatterLeader({ seed: "COMPLETE", count: 1 });
const completionOpportunity = completion.getCurrentOpportunity();
const completionResponse = completion.submitInput({ opportunityId: completionOpportunity.id, timestampMs: completionOpportunity.target_ms });
assert.equal(completionResponse.completed, true);
assert.equal(completion.getState().completed, true);
assert.equal(completion.submitInput({ opportunityId: completionOpportunity.id, timestampMs: completionOpportunity.target_ms }).reason, "POST_COMPLETION");

const roleResult = completion.getResult();
const snapshot = JSON.stringify(roleResult);
const combatResult = batterRoleResultToCombatResult(roleResult, { turn: 2 });
assert.equal(combatResult.type, "COMBAT_RESULT");
assert.equal(combatResult.role, "BATTER");
assert.equal(combatResult.impact_points, roleResult.impactPoints);
assert.equal(combatResult.deterministic, true);
assert.equal(JSON.stringify(roleResult), snapshot, "adapter must not mutate ROLE_RESULT");

const restart = new BatterLeader({ seed: "RESTART", count: 2 });
const initialSequence = restart.getCurrentOpportunity();
restart.submitInput({ opportunityId: initialSequence.id, timestampMs: initialSequence.target_ms });
restart.start();
assert.equal(restart.getState().current_index, 0);
assert.equal(restart.getState().score, 0);
assert.deepEqual(restart.getCurrentOpportunity(), initialSequence, "restart must rebuild the same deterministic opportunity");

console.log("batter_leader_test: PASS");
