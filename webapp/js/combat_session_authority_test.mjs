import assert from "node:assert/strict";
import fs from "node:fs";
import { CombatSessionAuthority } from "./combat_session_authority.js";
import {
  COMBAT_STAMINA_ROUND_COST,
  resolveTacticalTurn,
  resolveClimaxTurn
} from "./combat_core.js";

const combat = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const authoritySource = fs.readFileSync(new URL("./combat_session_authority.js", import.meta.url), "utf8");

assert.ok(authoritySource.includes('from "./combat_core.js"'));
assert.doesNotMatch(authoritySource, /from ["']./combat.js["']/);
assert.doesNotMatch(authoritySource, /CombatPresentationDirector|document\.|window\.|HTMLCanvasElement|canvas/);

assert.doesNotMatch(combat, /from ["']./combat_core.js["']/);
assert.match(combat, /CombatSessionAuthority/);
assert.match(combat, /this\.combatAuthority\.resolveTacticalTurn/);
assert.match(combat, /this\.combatAuthority\.resolveClimaxTurn/);
assert.doesNotMatch(combat, /\bresolveTacticalTurn\s*\(/);
assert.doesNotMatch(combat, /\bresolveClimaxTurn\s*\(/);

const authority = new CombatSessionAuthority();
const snapshot = {
  tacticalTurn: 0,
  bossHp: 100,
  bossMaxHp: 100,
  internalEnergy: 0,
  tacticalEffectiveness: 0,
  tacticalMaxTurns: 5,
  round: 1,
  playerStamina: 70,
  playerStaminaMax: 70,
  playerStaminaRoundCost: COMBAT_STAMINA_ROUND_COST,
  batter: {
    stats: { power: 90, contact: 85, speed: 80, eye: 88 }
  }
};

const tacticalExpected = resolveTacticalTurn(snapshot);
const tacticalActual = authority.resolveTacticalTurn(snapshot);
assert.deepEqual(tacticalActual, tacticalExpected);

const afterTactical = {
  ...snapshot,
  tacticalTurn: tacticalActual.tactical_turn_after,
  bossHp: tacticalActual.boss_hp_after,
  internalEnergy: tacticalActual.energy_after,
  tacticalEffectiveness: tacticalActual.effectiveness_after
};

const climaxExpected = resolveClimaxTurn({
  ...afterTactical,
  grade: "GREAT"
});
const climaxActual = authority.resolveClimaxTurn(afterTactical, "GREAT");
assert.deepEqual(climaxActual, climaxExpected);

assert.equal(Object.prototype.hasOwnProperty.call(authority, "canvas"), false);
assert.equal(Object.prototype.hasOwnProperty.call(authority, "presentation"), false);

console.log("BONE-008-001 static/authority seam = PASS_STATIC");
console.log("TACTICAL authority equivalence = PASS");
console.log("CLIMAX authority equivalence = PASS");
