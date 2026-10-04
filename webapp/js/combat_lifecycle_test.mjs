import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "webapp/js/combat.js"),
  "utf8"
);

assert.match(source, /requestAnimationFrame\(\(time\) => this\.frame\(time\)\)/);
assert.match(source, /cancelAnimationFrame\(this\.frameHandle\)/);
assert.match(source, /ResizeObserver/);
assert.match(source, /this\.resizeObserver\?\.disconnect\(\)/);
assert.match(source, /window\.removeEventListener\("resize", this\.handleViewportResize\)/);
assert.match(source, /window\.visualViewport\?\.removeEventListener\("resize", this\.handleViewportResize\)/);
assert.match(source, /window\.visualViewport\?\.removeEventListener\("scroll", this\.handleViewportResize\)/);
assert.match(source, /this\.canvas\.removeEventListener\("pointerdown", this\.handleTimingPointer\)/);
assert.match(source, /document\.removeEventListener\("visibilitychange", this\.handleDocumentVisibility\)/);
assert.match(source, /this\._clearOwnedTimeouts\(\)/);
assert.match(source, /this\.disposed/);
assert.match(source, /this\.paused/);
assert.match(source, /pause\(\)/);
assert.match(source, /resume\(\)/);
assert.match(source, /getLifecycleDebugSnapshot\(\)/);

const ownedTimerCalls = (source.match(/this\._setOwnedTimeout\(/g) || []).length;
assert.ok(ownedTimerCalls >= 4, "renderer timers should go through owned timeout tracking");

const rawWindowTimeouts = (source.match(/window\.setTimeout\(/g) || []).length;
assert.equal(rawWindowTimeouts, 1, "only the owned-timeout helper should call window.setTimeout");

assert.match(source, /if \(this\.disposed \|\| this\.paused\)/);
assert.match(source, /if \(!this\.disposed && !this\.paused\)/);

console.log("BONE-007 lifecycle static proof: PASS_STATIC");
