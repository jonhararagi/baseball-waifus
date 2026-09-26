import assert from "node:assert/strict";
import { calculateTacticalTurn, calculateClimaxDamage } from "./combat.js";

const tactical = calculateTacticalTurn({ turn: 5, power: 90, contact: 85, speed: 80, eye: 88 });
assert.equal(tactical.turn, 5);
assert.ok(tactical.damage > 0);
assert.ok(tactical.mob_count >= 2);
assert.ok(tactical.charge > 0);
assert.ok(tactical.effectiveness <= 100);

const great = calculateClimaxDamage({ grade: "GREAT", effectiveness: 100, internalEnergy: 100 });
const hit = calculateClimaxDamage({ grade: "HIT", effectiveness: 50, internalEnergy: 50 });
const miss = calculateClimaxDamage({ grade: "MISS", effectiveness: 100, internalEnergy: 100 });
assert.ok(great > hit);
assert.ok(hit > 0);
assert.equal(miss, 0);

console.log("P17 combat loop helpers: OK");
