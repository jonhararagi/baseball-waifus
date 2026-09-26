import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { classifyTimingDelta } from "./timing_ring.js";

const root = path.resolve("webapp/js");
const combat = fs.readFileSync(path.join(root, "combat.js"), "utf8");
const audio = fs.readFileSync(path.join(root, "audioManager.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "audio_engine.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.ok(combat.includes('this.battlePhase = "TACTICAL"'));
assert.ok(combat.includes("this.tacticalMaxTurns = 5"));
assert.ok(combat.includes("_playTacticalTurn()"));
assert.ok(combat.includes("_resolveClimaxDamage(grade)"));
assert.ok(combat.includes("greatWindowMs"));
assert.ok(combat.includes("radiusScale"));
assert.ok(combat.includes("_drawBattleLoopHud"));
assert.ok(audio.includes("playTacticalCard"));
assert.ok(audio.includes("playTacticalCharge"));
assert.ok(audio.includes("playClimaxWarning"));
assert.ok(engine.includes('"tactical.card"'));
assert.ok(engine.includes('"tactical.charge"'));
assert.ok(engine.includes('"climax.warning"'));
assert.ok(app.includes("onTacticalTurn"));
assert.ok(app.includes("onClimaxStart"));

assert.equal(classifyTimingDelta(0), "GREAT");
assert.equal(classifyTimingDelta(55), "GREAT");
assert.equal(classifyTimingDelta(135), "HIT");
assert.equal(classifyTimingDelta(136), "MISS");

console.log("PASS: tactical 5-turn loop, dynamic climax timing, HUD and audio hooks validated.");
