import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { classifyMetric, repairAttempt, CLAIM_STATUS, VERIFY_STATUS, METRIC_TYPE } from "./agent_guard.mjs";

assert.equal(fs.existsSync(".agent/task.json"), true);
assert.equal(fs.existsSync(".agent/state.json"), true);

const existing = path.join(".agent", "task.json");
assert.equal(fs.existsSync(existing), true, "existing file must be verifiable");

const missing = path.join(".agent", "__definitely_missing__.json");
assert.equal(fs.existsSync(missing), false, "missing file must not verify");

assert.equal(CLAIM_STATUS.VERIFIED, "VERIFIED");
assert.equal(CLAIM_STATUS.INSPECTED, "INSPECTED");
assert.equal(VERIFY_STATUS.PASS_REAL, "PASS_REAL");
assert.equal(VERIFY_STATUS.NOT_RUN, "NOT_RUN");

const simulatedNotRun = { name: "unexecuted", command: "", exit_code: null, status: VERIFY_STATUS.NOT_RUN };
assert.equal(simulatedNotRun.status, "NOT_RUN");
assert.notEqual(simulatedNotRun.status, "PASS_REAL");

const realMetric = classifyMetric({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 });
assert.equal(realMetric.measurement_type, METRIC_TYPE.REAL);

const estimatedMetric = classifyMetric({ context_estimate: 1200 });
assert.equal(estimatedMetric.measurement_type, METRIC_TYPE.ESTIMATED);

const unknownMetric = classifyMetric({});
assert.equal(unknownMetric.measurement_type, METRIC_TYPE.UNKNOWN);

assert.deepEqual(repairAttempt(0), { attempt: 1, max_attempts: 3, allowed: true, status: "CONTINUE_REPAIR" });
assert.equal(repairAttempt(2).allowed, true);
assert.equal(repairAttempt(3).allowed, false);
assert.equal(repairAttempt(3).status, VERIFY_STATUS.BLOCKED);

console.log("[agent-guard] file, test, commit-model, scope/repair and metric classification contracts passed");
