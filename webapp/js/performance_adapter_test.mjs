import assert from "node:assert/strict";
import { PerformanceAdapter } from "./performance_adapter.js";

const low = new PerformanceAdapter({
  navigatorRef: { hardwareConcurrency: 2, deviceMemory: 2 }
});
assert.equal(low.getTargetFps(), 30);
assert.equal(low.getParticleBudget(28), 11);

const high = new PerformanceAdapter({
  navigatorRef: { hardwareConcurrency: 8, deviceMemory: 8 }
});
assert.equal(high.getTargetFps(), 60);
assert.equal(high.getParticleBudget(28), 28);

assert.equal(high.shouldRender(1000), true);
assert.equal(high.shouldRender(1010), false);
assert.equal(high.shouldRender(1017), true);

console.log("performance_adapter_test: ok");
