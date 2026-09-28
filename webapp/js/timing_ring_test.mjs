import assert from "node:assert/strict";
import {
  TIMING_GREAT_WINDOW_MS,
  TIMING_HIT_WINDOW_MS,
  TIMING_RING_DURATION_MS,
  TIMING_RING_TARGET_MS,
  TIMING_RING_MAX_RADIUS,
  TIMING_RING_TARGET_RADIUS,
  classifyTimingDelta,
  timingRingProgress,
  timingRingRadius
} from "./timing_ring.js";

console.log("🧪 Timing Ring unit tests...");

assert.equal(classifyTimingDelta(0), "GREAT");
assert.equal(classifyTimingDelta(TIMING_GREAT_WINDOW_MS), "GREAT");
assert.equal(classifyTimingDelta(TIMING_GREAT_WINDOW_MS + 1), "HIT");
assert.equal(classifyTimingDelta(TIMING_HIT_WINDOW_MS), "HIT");
assert.equal(classifyTimingDelta(TIMING_HIT_WINDOW_MS + 1), "MISS");
assert.equal(classifyTimingDelta(Number.NaN), "MISS");

assert.equal(timingRingProgress(0), 0);
assert.equal(timingRingProgress(TIMING_RING_DURATION_MS), 1);
assert.equal(timingRingRadius(0), TIMING_RING_MAX_RADIUS);
assert.equal(timingRingRadius(TIMING_RING_DURATION_MS), TIMING_RING_TARGET_RADIUS);
assert.equal(timingRingRadius(TIMING_RING_TARGET_MS) < TIMING_RING_MAX_RADIUS, true);

assert.equal(typeof classifyTimingDelta(0), "string");

console.log("✅ Timing Ring tests passed.");
