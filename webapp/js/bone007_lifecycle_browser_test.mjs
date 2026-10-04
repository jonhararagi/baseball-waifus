import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"]
});
const context = await browser.newContext();
await context.addInitScript(() => {
  const listenerCounts = new Map();
  const keyFor = (target, type) => {
    const ctor = target?.constructor?.name || "EventTarget";
    return ctor + ":" + String(type);
  };
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    const key = keyFor(this, type);
    listenerCounts.set(key, (listenerCounts.get(key) || 0) + 1);
    return originalAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    const key = keyFor(this, type);
    listenerCounts.set(key, Math.max(0, (listenerCounts.get(key) || 0) - 1));
    return originalRemove.call(this, type, listener, options);
  };

  const activeRafs = new Set();
  const originalRaf = window.requestAnimationFrame.bind(window);
  const originalCancelRaf = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    let id = 0;
    id = originalRaf((time) => {
      activeRafs.delete(id);
      callback(time);
    });
    activeRafs.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    activeRafs.delete(id);
    return originalCancelRaf(id);
  };

  window.__BW_BONE007_ACTIVE_RAFS__ = activeRafs;
  window.__BW_BONE007_LISTENER_COUNTS_SNAPSHOT__ = () => Object.fromEntries(
    [...listenerCounts.entries()]
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  );
});

const page = await context.newPage();

const consoleErrors = [];
const resource404s = [];
page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const text = message.text();
  if (/Failed to load resource: the server responded with a status of 404/i.test(text)) {
    resource404s.push(text);
    return;
  }
  consoleErrors.push(text);
});
page.on("response", (response) => {
  if (response.status() === 404) resource404s.push(response.url());
});

const result = [];
await page.goto(baseUrl + "/bone007_lifecycle_harness.html", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.querySelector("#gameCanvas") instanceof HTMLCanvasElement);
const baseline = await page.evaluate(() => ({
  raf: window.__BW_BONE007_RAF_COUNT__?.(),
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
  assert.deepEqual(cycleResult.rafAfterPause, baseline.raf);
  result.push({ cycle, ...cycleResult });
}

const final = await page.evaluate(() => ({
  raf: window.__BW_BONE007_RAF_COUNT__?.(),
  listeners: window.__BW_BONE007_LISTENER_COUNTS__?.()
}));

assert.deepEqual(final.listeners, baseline.listeners);
assert.deepEqual(final.raf, baseline.raf);

if (consoleErrors.length) {
  throw new Error("Browser console/page errors: " + JSON.stringify(consoleErrors));
}

console.log(JSON.stringify({
  status: "PASS_REAL",
  cycles: result.length,
  baseline,
  final,
  console_errors: consoleErrors,
  resource_404s: [...new Set(resource404s)]
}, null, 2));

await context.close();
await browser.close();
