import assert from "node:assert/strict";
import { Student4v4Integration } from "./student_4v4_integration.js";

function run(seed) {
  const flow = new Student4v4Integration({ seed: seed || "T042-INTEGRATION-001", team: { id: "student-team-demo" } });
  flow.start();
  flow.completeCurrentRolePerfect();
  flow.completeCurrentRolePerfect();
  flow.completeCurrentRolePerfect();
  flow.completeCurrentRolePerfect();
  return flow.snapshot();
}

const first = run("T042-INTEGRATION-001");
const second = run("T042-INTEGRATION-001");
assert.equal(first.phase, "RESULT");
assert.deepEqual(first, second);
for (const role of ["BUFFER", "HEALER", "DEBUFFER", "BATTER"]) {
  assert.equal(first.roleResults[role].type, "ROLE_RESULT");
  assert.equal(first.roleResults[role].deterministic, true);
}
assert.equal(first.combinedResult.type, "STUDENT_4V4_RESULT");
assert.deepEqual(first.combinedResult.resolution_order, ["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);
assert.equal(first.combinedResult.deterministic, true);
assert.equal(first.combatResult.type, "COMBAT_RESULT");
assert.equal(first.combatResult.phase, "STUDENT_4V4");
assert.equal(first.combatResult.deterministic, true);
assert.equal(first.presentation.roles.length, 4);
assert.equal(first.presentation.deterministic, true);

const other = run("T042-INTEGRATION-002");
assert.equal(other.seed, "T042-INTEGRATION-002");
assert.equal(other.roleResults.BUFFER.seed, "T042-INTEGRATION-002::BUFFER");
assert.notDeepEqual(other.roleResults, first.roleResults);

const reset = new Student4v4Integration({ seed: "T042-RESET" });
reset.start(); reset.completeCurrentRolePerfect(); reset.reset();
assert.equal(reset.snapshot().phase, "IDLE");
assert.equal(reset.snapshot().combinedResult, null);

const idle = new Student4v4Integration({ seed: "T042-IDLE" });
assert.throws(() => idle.submitInput({}), /NO_ACTIVE_ROLE/);

console.log("student_4v4_integration_test: PASS");
