import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
const context = await browser.newContext();
const page = await context.newPage();
const consoleErrors = [];

page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.goto(baseUrl + "/bone007_lifecycle_harness.html", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#gameCanvas");

const runCycle = async () => page.evaluate(async () => {
  const { CombatRenderer } = await import("./js/combat.js");
  const canvas = document.querySelector("#gameCanvas");
  const renderer = new CombatRenderer(canvas, {});

  await renderer.setCombatInit({
    type: "CombatInitDTO",
    match_id: "bone008-browser",
    home_team: { id: "home", name: "BASEWARRIORS" },
    away_team: { id: "away", name: "RIVAL" },
    batter: {
      id: "bw001",
      card_id: "bw001",
      faction: "cyber_tech",
      stats: { power: 90, contact: 90, speed: 90, eye: 90 }
    },
    pitcher: {
      id: "enemy001",
      card_id: "bw002",
      faction: "tactical_milspec"
    },
    state: {
      match_id: "bone008-browser",
      boss_hp: 100
    }
  });

  const tacticalResults = [];
  for (let i = 0; i < 5; i += 1) {
    const result = renderer.beginTimingWindow();
    tacticalResults.push({
      outcome: result?.outcome || null,
      tactical_turn_after: renderer.tacticalTurn,
      boss_hp: renderer.bossHp
    });
    if (i < 4) {
      if (result !== true) throw new Error("TACTICAL_AUTHORITY_DID_NOT_ADVANCE");
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 320));
  if (renderer.battlePhase !== "CLIMAX") throw new Error("CLIMAX_PHASE_NOT_REACHED");
  if (!renderer.isTimingWindowActive()) throw new Error("TIMING_WINDOW_NOT_ACTIVE");

  renderer.resolveTimingInput("browser-test");
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));

  const terminal = {
    phase: renderer.battlePhase,
    timingActive: renderer.isTimingWindowActive(),
    bossHp: renderer.bossHp,
    tacticalTurn: renderer.tacticalTurn
  };

  renderer.dispose();
  renderer.dispose();

  return {
    tacticalResults,
    terminal,
    lifecycle: renderer.getLifecycleDebugSnapshot()
  };
});

const first = await runCycle();
assert.equal(first.tacticalResults.length, 5);
assert.equal(first.tacticalResults[4].tactical_turn_after, 5);
assert.ok(["VICTORY", "TACTICAL", "DEFEAT"].includes(first.terminal.phase));
assert.equal(first.lifecycle.disposed, true);
assert.equal(first.lifecycle.frameHandle, 0);

const second = await runCycle();
assert.equal(second.tacticalResults.length, 5);
assert.equal(second.tacticalResults[4].tactical_turn_after, 5);
assert.equal(second.lifecycle.disposed, true);

if (consoleErrors.length) {
  throw new Error("Browser console/page errors: " + JSON.stringify(consoleErrors));
}

console.log(JSON.stringify({
  status: "PASS_REAL",
  first_cycle: first,
  second_cycle: second,
  console_errors: consoleErrors
}, null, 2));

await context.close();
await browser.close();
