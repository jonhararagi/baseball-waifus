import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { CombatRuntimeController } from "./combat_runtime_controller.js";
import { CombatSessionAuthority } from "./combat_session_authority.js";

const runtimeSource = fs.readFileSync(new URL("./combat_runtime_controller.js", import.meta.url), "utf8");
const rendererSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const coreSource = fs.readFileSync(new URL("./combat_core.js", import.meta.url), "utf8");

const makeSnapshot = (stamina = 70) => ({
  batter: {
    id: "bw001",
    stats: {
      power: 90,
      contact: 85,
      speed: 80,
      eye: 88,
      stamina
    }
  }
});

test("runtime controller has no presentation or DOM dependencies", () => {
  assert.match(runtimeSource, /combat_session_authority\.js/);
  assert.match(runtimeSource, /combat_timing_authority\.js/);
  assert.doesNotMatch(runtimeSource, /from ["']\.\/combat\.js["']/);
  assert.doesNotMatch(runtimeSource, /CombatPresentationDirector/);
  for (const forbidden of [
    "document.",
    "window.",
    "HTMLCanvasElement",
    "CanvasRenderingContext2D",
    "querySelector(",
    "getContext(",
    "requestAnimationFrame",
    "addEventListener",
    "reward_pipeline",
    "reward_authority",
    "localStorage",
    "sessionStorage"
  ]) {
    assert.equal(runtimeSource.includes(forbidden), false, `forbidden runtime dependency: ${forbidden}`);
  }
  assert.match(runtimeSource, /resolveTiming\(/);
  assert.match(runtimeSource, /resolveClimaxTurn\(/);
});

test("renderer delegates tactical and timing resolution to runtime without direct gameplay resolvers", () => {
  assert.match(rendererSource, /CombatRuntimeController/);
  assert.match(rendererSource, /this\.combatRuntime\.startSession/);
  assert.match(rendererSource, /this\.combatRuntime\.resolveTacticalTurn/);
  assert.match(rendererSource, /this\.combatRuntime\.resolveTimingInput/);
  assert.doesNotMatch(rendererSource, /from "\.\/combat_timing_authority\.js"/);
  assert.doesNotMatch(rendererSource, /\bresolveTiming\s*\(/);
  assert.doesNotMatch(rendererSource, /this\.combatRuntime\.resolveClimaxTurn\(/);
  assert.doesNotMatch(rendererSource, /function _resolveClimaxDamage|_resolveClimaxDamage\(/);
  assert.match(rendererSource, /_presentClimaxTransition\(/);
  assert.match(rendererSource, /CombatPresentationDirector/);
});

test("timing windows preserve the existing zero and maximum effectiveness balance", () => {
  const zeroAuthority = {
    state: {
      tacticalEffectiveness: 0,
      round: 1,
      bossHp: 100
    },
    startSession(snapshot) { this.state = { ...this.state, ...snapshot }; return this.getState(); },
    getState() { return { ...this.state }; },
    resolveClimaxTurn() { return { result: {}, state: this.getState() }; },
    resolveTacticalTurn() { return { result: {}, state: this.getState() }; }
  };
  const zeroRuntime = new CombatRuntimeController({ authority: zeroAuthority });
  zeroRuntime.startSession(makeSnapshot());
  assert.deepEqual(zeroRuntime.getTimingWindow(), {
    targetMs: 720,
    durationMs: 860,
    greatWindowMs: 55,
    hitWindowMs: 135
  });

  const maxAuthority = {
    state: {
      tacticalEffectiveness: 100,
      round: 1,
      bossHp: 100
    },
    startSession(snapshot) { this.state = { ...this.state, ...snapshot }; return this.getState(); },
    getState() { return { ...this.state }; },
    resolveClimaxTurn() { return { result: {}, state: this.getState() }; },
    resolveTacticalTurn() { return { result: {}, state: this.getState() }; }
  };
  const maxRuntime = new CombatRuntimeController({ authority: maxAuthority });
  maxRuntime.startSession(makeSnapshot());
  maxAuthority.state.tacticalEffectiveness = 100;
  assert.deepEqual(maxRuntime.getTimingWindow(), {
    targetMs: 720,
    durationMs: 860,
    greatWindowMs: 90,
    hitWindowMs: 190
  });
});

test("timing grade uses the real CombatTimingAuthority and forwards grace", () => {
  const authority = new CombatSessionAuthority();
  const runtime = new CombatRuntimeController({ authority });
  runtime.startSession(makeSnapshot());

  let seenGrade = null;
  const originalResolveClimaxTurn = authority.resolveClimaxTurn.bind(authority);
  authority.resolveClimaxTurn = (grade) => {
    seenGrade = grade;
    return originalResolveClimaxTurn(grade);
  };

  for (let i = 0; i < 5; i += 1) {
    runtime.resolveTacticalTurn();
  }

  const window = runtime.getTimingWindow();
  const great = runtime.resolveTimingInput({
    elapsedMs: window.targetMs + window.greatWindowMs + 5,
    source: "test-grace",
    timingGraceMs: 10,
    timingWindow: window
  });

  assert.equal(great.timing.grade, "GREAT");
  assert.equal(great.timing.source, "test-grace");
  assert.equal(great.timing.target_ms, 720);
  assert.equal(great.timing.great_window_ms, Math.round(window.greatWindowMs));
  assert.equal(seenGrade, "GREAT");
  assert.equal(great.transition.result.victory, true);
});

test("timing controller covers HIT and MISS through the real timing authority", () => {
  for (const [elapsedMs, expectedGrade] of [
    [720 + 100, "HIT"],
    [720 + 220, "MISS"]
  ]) {
    const authority = new CombatSessionAuthority();
    const runtime = new CombatRuntimeController({ authority });
    runtime.startSession(makeSnapshot());

    for (let i = 0; i < 5; i += 1) runtime.resolveTacticalTurn();

    const transition = runtime.resolveTimingInput({
      elapsedMs,
      source: expectedGrade.toLowerCase(),
      timingGraceMs: 0
    });

    assert.equal(transition.timing.grade, expectedGrade);
    assert.equal(transition.transition.result.victory, expectedGrade === "HIT" ? true : false);
  }
});

test("terminal defeat remains authoritative through timing runtime", () => {
  const authority = new CombatSessionAuthority();
  const runtime = new CombatRuntimeController({ authority });
  runtime.startSession(makeSnapshot(1));

  for (let i = 0; i < 5; i += 1) runtime.resolveTacticalTurn();

  const transition = runtime.resolveTimingInput({
    elapsedMs: 720 + 220,
    source: "timeout",
    timingGraceMs: 0
  });

  assert.equal(transition.timing.grade, "MISS");
  assert.equal(transition.transition.result.defeat, true);
  assert.equal(transition.transition.state.terminal, "DEFEAT");
});

test("runtime controller preserves tactical and climax authority outputs", () => {
  const authority = new CombatSessionAuthority();
  const runtime = new CombatRuntimeController({ authority });
  runtime.startSession(makeSnapshot());

  const tactical = runtime.resolveTacticalTurn();
  assert.equal(tactical.state.tacticalTurn, 1);
  assert.equal(tactical.result.outcome, "TACTICAL_HIT");

  while (runtime.getState().phase !== "CLIMAX") {
    runtime.resolveTacticalTurn();
  }

  const climax = runtime.resolveClimaxTurn("MISS");
  assert.ok(["HOME_RUN", "HIT", "STRIKE"].includes(climax.result.result));
});

test("core remains the normative rules source", () => {
  assert.match(coreSource, /export function resolveTacticalTurn/);
  assert.match(coreSource, /export function resolveClimaxTurn/);
});

console.log("BONE-008-007 TEST BUILD = 20261005-A");
console.log("BONE-008-007 RUNTIME CONTROLLER = PASS_STATIC");
console.log("TIMING WINDOW = PASS");
console.log("TIMING RESOLUTION = PASS");
console.log("CLIMAX AUTHORITY = PASS");
console.log("PRESENTATION SEPARATION = PASS_STATIC");
