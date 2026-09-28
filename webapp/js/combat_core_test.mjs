import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  COMBAT_RESULT_TYPE,
  calculateClimaxDamage,
  calculateTacticalTurn,
  resolveClimaxTurn,
  resolveTacticalTurn,
  resolveTimingGrade
} from "./combat_core.js";

assert.equal(resolveTimingGrade("GREAT"), "HOME_RUN");
assert.equal(resolveTimingGrade("HIT"), "HIT");
assert.equal(resolveTimingGrade("MISS"), "STRIKE");

const input = {
  turn: 1, power: 70, contact: 70, speed: 70, eye: 70,
  bossHp: 100, bossMaxHp: 100, internalEnergy: 0, tacticalEffectiveness: 0
};
const tacticalA = resolveTacticalTurn(input);
const tacticalB = resolveTacticalTurn(input);
assert.deepEqual(tacticalA, tacticalB);
assert.equal(tacticalA.type, COMBAT_RESULT_TYPE);
assert.equal(tacticalA.boss_hp_after, 100 - calculateTacticalTurn(input).damage);

const climax = resolveClimaxTurn({
  grade: "GREAT", bossHp: 100, bossMaxHp: 100,
  internalEnergy: 50, tacticalEffectiveness: 80, round: 2
});
assert.equal(climax.damage, calculateClimaxDamage({
  grade: "GREAT", internalEnergy: 50, effectiveness: 80
}));
assert.equal(climax.outcome, "HOME_RUN");
assert.equal(climax.boss_hp_after, 100 - climax.damage);
assert.equal(climax.victory, climax.boss_hp_after <= 0);

const coreSource = await readFile(fileURLToPath(new URL("./combat_core.js", import.meta.url)), "utf8");
assert.doesNotMatch(coreSource, /document\.|window\.|HTMLCanvasElement|CanvasRenderingContext2D/);
assert.doesNotMatch(coreSource, /(?:CombatRenderer|AudioManager|AudioBridge|CombatHUD|BatterRenderer|CombatEffects)/);

const timingSource = await readFile(fileURLToPath(new URL("./timing_ring.js", import.meta.url)), "utf8");
assert.doesNotMatch(timingSource, /damage|boss|victory|defeat|HOME_RUN|STRIKE/);

console.log("[combat-core] separation contracts passed");
