import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { CombatRuntimeController } from "./combat_runtime_controller.js";
import { CombatSessionAuthority } from "./combat_session_authority.js";

const runtimeSource = fs.readFileSync(new URL("./combat_runtime_controller.js", import.meta.url), "utf8");
const rendererSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const coreSource = fs.readFileSync(new URL("./combat_core.js", import.meta.url), "utf8");

function stripLineComments(line, state) {
  let output = "";
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1] || "";
    if (state.blockComment) {
      if (char === "*" && next === "/") {
        state.blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      output += char;
      if (char === "\\") {
        output += next;
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "/" && next === "*") {
      state.blockComment = true;
      i += 1;
      continue;
    }
    if (char === "/" && next === "/") break;
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      output += char;
      continue;
    }
    output += char;
  }
  return output;
}

function collectImportSpecifiers(source) {
  const imports = [];
  const state = { blockComment: false };
  let pending = "";
  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripLineComments(rawLine, state);
    const trimmed = line.trim();
    if (!pending && /^import\b/.test(trimmed) && !/^import\s*\(/.test(trimmed)) {
      pending = trimmed;
    } else if (pending) {
      pending += ` ${trimmed}`;
    } else {
      continue;
    }

    const sideEffect = pending.match(/^import\s+["']([^"']+)["']\s*;?$/);
    const fromImport = pending.match(/\bfrom\s+["']([^"']+)["']\s*;?$/);
    if (sideEffect) {
      imports.push(sideEffect[1]);
      pending = "";
      continue;
    }
    if (fromImport) {
      imports.push(fromImport[1]);
      pending = "";
      continue;
    }
    if (pending.endsWith(";")) pending = "";
  }
  return imports;
}

function hasApiCall(source, expression) {
  const escaped = expression.replace(/[.*+?^$()|[\]{}]/g, "\\$&");
  return new RegExp(`(?:^|[^\\w$])${escaped}\\s*\\(`).test(source);
}

function hasIdentifier(source, identifier) {
  const escaped = identifier.replace(/[.*+?^$()|[\]{}]/g, "\\$&");
  const cleaned = source.replace(/(?:\/\\*[\\s\\S]*?\\*\/|\/\/[^\\n\\r]*)/g, " ");
  return new RegExp(`(?:^|[^\\w$])${escaped}(?:$|[^\\w$])`).test(cleaned);
}

function assertImportBoundary(source, expected, label) {
  const imports = collectImportSpecifiers(source);
  for (const specifier of expected.present || []) {
    assert.equal(imports.includes(specifier), true, `${label}: missing import ${specifier}`);
  }
  for (const specifier of expected.absent || []) {
    assert.equal(imports.includes(specifier), false, `${label}: forbidden import ${specifier}`);
  }
  return imports;
}

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

test("runtime controller has deterministic import and API boundaries", () => {
  const imports = assertImportBoundary(runtimeSource, {
    present: ["./combat_session_authority.js", "./combat_timing_authority.js"],
    absent: ["./combat.js"]
  }, "RUNTIME CONTROLLER IMPORT BOUNDARY");

  assert.equal(hasApiCall(runtimeSource, "resolveTiming"), true);
  assert.equal(hasApiCall(runtimeSource, "resolveClimaxTurn"), true);
  assert.equal(hasApiCall(runtimeSource, "resolveTacticalTurn"), true);

  assert.equal(imports.includes("./combat_presentation_director.js"), false);
  for (const forbiddenIdentifier of [
    "document",
    "window",
    "HTMLCanvasElement",
    "CanvasRenderingContext2D",
    "CombatPresentationDirector",
    "reward_pipeline",
    "reward_authority",
    "localStorage",
    "sessionStorage"
  ]) {
    assert.equal(hasIdentifier(runtimeSource, forbiddenIdentifier), false, `forbidden runtime identifier: ${forbiddenIdentifier}`);
  }

  for (const forbiddenApi of [
    "querySelector",
    "getContext",
    "requestAnimationFrame",
    "addEventListener"
  ]) {
    assert.equal(hasApiCall(runtimeSource, forbiddenApi), false, `forbidden runtime API: ${forbiddenApi}`);
  }

  console.log("RUNTIME CONTROLLER IMPORT BOUNDARY = PASS");
  console.log("RUNTIME CONTROLLER API BOUNDARY = PASS");
});

test("renderer delegates tactical and timing resolution through exact gameplay APIs", () => {
  assertImportBoundary(rendererSource, {
    present: ["./combat_runtime_controller.js"],
    absent: ["./combat_timing_authority.js"]
  }, "RENDERER IMPORT BOUNDARY");

  assert.equal(hasApiCall(rendererSource, "this.combatRuntime.startSession"), true);
  assert.equal(hasApiCall(rendererSource, "this.combatRuntime.resolveTacticalTurn"), true);
  assert.equal(hasApiCall(rendererSource, "this.combatRuntime.resolveTimingInput"), true);

  for (const forbiddenApi of [
    "this.combatAuthority.startSession",
    "this.combatAuthority.resolveTacticalTurn",
    "this.combatAuthority.resolveClimaxTurn",
    "this.combatRuntime.resolveClimaxTurn",
    "resolveTiming"
  ]) {
    assert.equal(hasApiCall(rendererSource, forbiddenApi), false, `forbidden renderer gameplay API: ${forbiddenApi}`);
  }

  assert.equal(hasIdentifier(rendererSource, "_resolveClimaxDamage"), false);
  assert.equal(hasIdentifier(rendererSource, "CombatPresentationDirector"), true);
  assert.equal(hasApiCall(rendererSource, "_presentClimaxTransition"), true);

  console.log("RENDERER IMPORT BOUNDARY = PASS");
  console.log("RENDERER GAMEPLAY API BOUNDARY = PASS");
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
