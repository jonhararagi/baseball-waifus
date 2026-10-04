import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveTiming } from "./combat_timing_authority.js";

const combatSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const authoritySource = fs.readFileSync(new URL("./combat_timing_authority.js", import.meta.url), "utf8");

assert.match(authoritySource, /resolveTiming/);
assert.doesNotMatch(authoritySource, /CombatRenderer|CombatPresentationDirector|document\.|window\.|HTMLCanvasElement|canvas\b/);
assert.doesNotMatch(authoritySource, /from ["']\.\/combat\.js["']/);

const make = (elapsedMs, timingGraceMs = 0) => resolveTiming({
  elapsedMs,
  targetMs: 720,
  greatWindowMs: 90,
  hitWindowMs: 190,
  timingGraceMs,
  source: "test",
  round: 2,
  tacticalEffectiveness: 100,
  bossHpBefore: 42
});

assert.equal(make(720).grade, "GREAT");
assert.equal(make(810).grade, "GREAT");
assert.equal(make(811).grade, "HIT");
assert.equal(make(910).grade, "HIT");
assert.equal(make(911).grade, "MISS");

assert.equal(make(815, 25).delta_ms, 70);
assert.equal(make(815, 25).grade, "GREAT");
assert.equal(make(695, 30).delta_ms, 0);
assert.equal(Object.is(make(695, 30).delta_ms, -0), false);
assert.equal(make(695, 30).grade, "GREAT");
assert.equal(make(745, 30).delta_ms, 0);
assert.equal(Object.is(make(745, 30).delta_ms, -0), false);

const dto = make(750);
assert.deepEqual(dto, {
  grade: "GREAT",
  delta_ms: 30,
  elapsed_ms: 750,
  target_ms: 720,
  great_window_ms: 90,
  hit_window_ms: 190,
  source: "test",
  round: 2,
  tactical_effectiveness: 100,
  boss_hp_before: 42
});
assert.equal(Object.isFrozen(dto), true);
assert.equal(resolveTiming({
  elapsedMs: 750,
  targetMs: 720,
  greatWindowMs: 90,
  hitWindowMs: 190,
  timingGraceMs: 0,
  source: "test",
  round: 2,
  tacticalEffectiveness: 100,
  bossHpBefore: 42
}).grade, dto.grade);

assert.doesNotMatch(combatSource, /absoluteDelta\s*<=\s*greatWindowMs/);
assert.doesNotMatch(combatSource, /absoluteDelta\s*<=\s*hitWindowMs/);
assert.doesNotMatch(combatSource, /\?\s*"GREAT"\s*:\s*absoluteDelta/);
assert.match(combatSource, /resolveTiming\(/);
assert.match(combatSource, /playTimingResult\?\.\(timing\.grade\)/);
assert.doesNotMatch(combatSource, /playTimingResult\?\.\(grade\)/);

const previousLogic = ({ elapsedMs, targetMs, greatWindowMs, hitWindowMs, timingGraceMs }) => {
  const rawDeltaMs = elapsedMs - targetMs;
  const deltaMs = Math.sign(rawDeltaMs) * Math.max(0, Math.abs(rawDeltaMs) - Math.max(0, Number(timingGraceMs) || 0));
  const absoluteDelta = Math.abs(deltaMs);
  return absoluteDelta <= greatWindowMs
    ? "GREAT"
    : absoluteDelta <= hitWindowMs
      ? "HIT"
      : "MISS";
};

for (const input of [
  { elapsedMs: 650, targetMs: 720, greatWindowMs: 90, hitWindowMs: 190, timingGraceMs: 0 },
  { elapsedMs: 720, targetMs: 720, greatWindowMs: 90, hitWindowMs: 190, timingGraceMs: 0 },
  { elapsedMs: 805, targetMs: 720, greatWindowMs: 90, hitWindowMs: 190, timingGraceMs: 10 },
  { elapsedMs: 950, targetMs: 720, greatWindowMs: 90, hitWindowMs: 190, timingGraceMs: 25 }
]) {
  assert.equal(resolveTiming(input).grade, previousLogic(input));
}

console.log("BONE-008-004 STATIC = PASS_STATIC");
console.log("TIMING AUTHORITY = PASS");
console.log("LEGACY TIMING EQUIVALENCE = PASS");
