import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { CombatRuntimeController } from "./combat_runtime_controller.js";
import { CombatSessionAuthority } from "./combat_session_authority.js";

const runtimeSource = fs.readFileSync(new URL("./combat_runtime_controller.js", import.meta.url), "utf8");
const rendererSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const coreSource = fs.readFileSync(new URL("./combat_core.js", import.meta.url), "utf8");

test("runtime controller has no presentation or DOM dependencies", () => {
  assert.match(runtimeSource, /combat_session_authority\.js/);
  assert.doesNotMatch(runtimeSource, /combat\.js|CombatPresentationDirector|document\.|window\.|HTMLCanvasElement|CanvasRenderingContext2D|canvas\b/);
  assert.doesNotMatch(runtimeSource, /reward_pipeline|reward_authority|localStorage|sessionStorage/);
  assert.match(runtimeSource, /resolveTacticalTurn/);
  assert.match(runtimeSource, /resolveClimaxTurn/);
});

test("renderer delegates session and gameplay resolution to runtime controller", () => {
  assert.match(rendererSource, /CombatRuntimeController/);
  assert.match(rendererSource, /this\.combatRuntime\.startSession/);
  assert.match(rendererSource, /this\.combatRuntime\.resolveTacticalTurn/);
  assert.match(rendererSource, /this\.combatRuntime\.resolveClimaxTurn/);
  assert.doesNotMatch(rendererSource, /this\.combatAuthority\.startSession/);
  assert.doesNotMatch(rendererSource, /this\.combatAuthority\.resolveTacticalTurn/);
  assert.doesNotMatch(rendererSource, /this\.combatAuthority\.resolveClimaxTurn/);
  assert.match(rendererSource, /resolveTiming\(/);
  assert.match(rendererSource, /playTimingResult\?\.\(timing\.grade\)/);
  assert.match(rendererSource, /CombatPresentationDirector/);
});

test("runtime controller preserves authority outputs", () => {
  const authority = new CombatSessionAuthority();
  const runtime = new CombatRuntimeController({ authority });
  runtime.startSession({
    batter: {
      id: "bw001",
      stats: { power: 90, contact: 90, speed: 90, eye: 90, stamina: 70 }
    }
  });

  const tactical = runtime.resolveTacticalTurn();
  assert.equal(tactical.state.tacticalTurn, 1);
  assert.equal(tactical.result.outcome, "TACTICAL_HIT");

  while (runtime.getState().phase !== "CLIMAX") {
    runtime.resolveTacticalTurn();
  }

  for (const grade of ["GREAT", "HIT", "MISS"]) {
    const gradeAuthority = new CombatSessionAuthority();
    const gradeRuntime = new CombatRuntimeController({ authority: gradeAuthority });
    gradeRuntime.startSession({
      batter: {
        id: "bw001",
        stats: { power: 90, contact: 90, speed: 90, eye: 90, stamina: 70 }
      }
    });
    for (let turn = 0; turn < 5; turn += 1) gradeRuntime.resolveTacticalTurn();
    const transition = gradeRuntime.resolveClimaxTurn(grade);
    assert.ok(["HOME_RUN", "HIT", "STRIKE", "DEFEAT"].includes(transition.result.result));
    assert.equal(typeof transition.result.victory, "boolean");
    assert.equal(typeof transition.result.defeat, "boolean");
  }
});

test("runtime controller terminal outcomes remain authoritative", () => {
  const authority = new CombatSessionAuthority();
  const runtime = new CombatRuntimeController({ authority });
  runtime.startSession({
    batter: { id: "bw001", stats: { power: 100, contact: 100, speed: 100, eye: 100, stamina: 70 } }
  });
  for (let turn = 0; turn < 5; turn += 1) runtime.resolveTacticalTurn();
  const victory = runtime.resolveClimaxTurn("GREAT");
  assert.equal(victory.result.victory, true);
  assert.equal(victory.state.terminal, "VICTORY");

  const defeatAuthority = new CombatSessionAuthority();
  const defeatRuntime = new CombatRuntimeController({ authority: defeatAuthority });
  defeatRuntime.startSession({
    batter: { id: "bw001", stats: { power: 50, contact: 50, speed: 50, eye: 50, stamina: 1 } }
  });
  for (let turn = 0; turn < 5; turn += 1) defeatRuntime.resolveTacticalTurn();
  const defeat = defeatRuntime.resolveClimaxTurn("MISS");
  assert.equal(defeat.result.defeat, true);
  assert.equal(defeat.state.terminal, "DEFEAT");
});

assert.match(coreSource, /export function resolveTacticalTurn/);
assert.match(coreSource, /export function resolveClimaxTurn/);

console.log("BONE-008-006 RUNTIME CONTROLLER = PASS_STATIC");
console.log("AUTHORITY SEAM = PASS");
console.log("COMBAT CORE SOURCE = PASS");
