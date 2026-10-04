import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"]
});
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

const result = [];
await page.goto(baseUrl + "/?qa=bone007&kytos_demo=1", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof window.__BW_BONE007_LIFECYCLE__ === "function");
await page.waitForTimeout(1200);

// Pause the singleton app renderer so the five independent lifecycle cycles
// measure only the renderer instances created by this test.
await page.evaluate(() => window.__BW_BONE007_NAVIGATE__("home"));

const baseline = await page.evaluate(() => ({
  lifecycle: window.__BW_BONE007_LIFECYCLE__(),
  listeners: window.__BW_BONE007_LISTENER_COUNTS__?.()
}));

for (let cycle = 1; cycle <= 5; cycle += 1) {
  const cycleResult = await page.evaluate(async () => {
    const canvas = document.querySelector("#gameCanvas");
    const { CombatRenderer } = await import("./js/combat.js");
    const before = window.__BW_BONE007_LISTENER_COUNTS__?.();

    const renderer = new CombatRenderer(canvas, {});
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const active = renderer.getLifecycleDebugSnapshot();

    const paused = renderer.pause();
    const rafAfterPause = window.__BW_BONE007_RAF_COUNT__?.();

    const resumed = renderer.resume();
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));

    const disposed = renderer.dispose();
    const disposedAgain = renderer.dispose();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const after = window.__BW_BONE007_LISTENER_COUNTS__?.();

    return {
      active,
      paused,
      resumed,
      disposed,
      disposedAgain,
      rafAfterPause,
      before,
      after
    };
  });

  assert.equal(cycleResult.active.disposed, false);
  assert.equal(cycleResult.active.paused, false);
  assert.ok(cycleResult.active.frameHandle > 0, "active renderer must own one RAF");

  assert.equal(cycleResult.paused.paused, true);
  assert.equal(cycleResult.paused.frameHandle, 0);
  assert.equal(cycleResult.paused.ownedTimeouts, 0);

  assert.equal(cycleResult.resumed.active, true);
  assert.equal(cycleResult.resumed.paused, false);
  assert.ok(cycleResult.resumed.frameHandle > 0, "resume must schedule one RAF");

  assert.equal(cycleResult.disposed.disposed, true);
  assert.equal(cycleResult.disposed.paused, true);
  assert.equal(cycleResult.disposed.frameHandle, 0);
  assert.equal(cycleResult.disposed.ownedTimeouts, 0);
  assert.equal(cycleResult.disposed.resizeObserver, false);

  assert.equal(cycleResult.disposedAgain.disposed, true);
  assert.equal(cycleResult.disposedAgain.disposeCount, cycleResult.disposed.disposeCount);

  assert.deepEqual(cycleResult.after, cycleResult.before);
  result.push({ cycle, ...cycleResult });
}

const final = await page.evaluate(() => ({
  lifecycle: window.__BW_BONE007_LIFECYCLE__(),
  raf: window.__BW_BONE007_RAF_COUNT__?.(),
  listeners: window.__BW_BONE007_LISTENER_COUNTS__?.()
}));

assert.equal(final.lifecycle.disposed, false);
assert.equal(final.lifecycle.paused, true);
assert.equal(final.lifecycle.frameHandle, 0);
assert.equal(final.lifecycle.ownedTimeouts, 0);
assert.deepEqual(final.listeners, baseline.listeners);
assert.deepEqual(final.raf, { active: 0 });

if (consoleErrors.length) {
  throw new Error("Browser console/page errors: " + JSON.stringify(consoleErrors));
}

console.log(JSON.stringify({
  status: "PASS_REAL",
  cycles: result.length,
  baseline,
  final,
  console_errors: consoleErrors
}, null, 2));

await context.close();
await browser.close();
