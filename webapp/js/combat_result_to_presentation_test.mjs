import assert from "node:assert/strict";
import fs from "node:fs";
import { CombatSessionAuthority } from "./combat_session_authority.js";
import { createCombatPresentationEvent } from "./combat_result_to_presentation.js";
import { CombatPresentationDirector } from "./combat_presentation_director.js";

const adapterSource = fs.readFileSync(new URL("./combat_result_to_presentation.js", import.meta.url), "utf8");
const directorSource = fs.readFileSync(new URL("./combat_presentation_director.js", import.meta.url), "utf8");
const rendererSource = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");

assert.match(adapterSource, /presentation_event_contract\.js/);
assert.doesNotMatch(adapterSource, /combat\.js|combat_session_authority\.js|reward_pipeline\.js|localStorage|document\.|window\.|HTMLCanvasElement|CanvasRenderingContext2D/);
assert.doesNotMatch(directorSource, /combat_core\.js|combat_session_authority\.js|reward_pipeline\.js|reward_authority\.js/);
assert.match(rendererSource, /createCombatPresentationEvent/);
assert.match(rendererSource, /startFromPresentationEvent/);
assert.equal((rendererSource.match(/startFromCombatResult/g) || []).length, 0);

const authority = new CombatSessionAuthority();
authority.startSession({
  tacticalTurn: 0,
  tacticalMaxTurns: 5,
  bossHp: 100,
  bossMaxHp: 100,
  internalEnergy: 0,
  tacticalEffectiveness: 0,
  round: 1,
  playerStamina: 70,
  playerStaminaMax: 70,
  playerStaminaRoundCost: 25,
  phase: "TACTICAL",
  batter: { id: "bw001", stats: { power: 90, contact: 90, speed: 90, eye: 90 } }
});

const tactical = authority.resolveTacticalTurn();
const tacticalBefore = JSON.stringify(authority.getState());
const tacticalEvent = createCombatPresentationEvent({
  result: tactical.result,
  attackerId: "bw001",
  targetId: "enemy001",
  actionType: "TACTICAL_HIT"
});
assert.equal(tacticalEvent.type, "COMBAT_RESULT");
assert.equal(tacticalEvent.payload.outcome, String(tactical.result.outcome).toUpperCase());
assert.equal(tacticalEvent.payload.result, String(tactical.result.result ?? tactical.result.outcome).toUpperCase());
assert.equal(tacticalEvent.payload.damage, Number(tactical.result.damage) || 0);
assert.equal(tacticalEvent.payload.terminal, false);
assert.equal(JSON.stringify(authority.getState()), tacticalBefore);

assert.ok(Object.isFrozen(tacticalEvent));
assert.ok(Object.isFrozen(tacticalEvent.payload));
assert.throws(() => {
  tacticalEvent.payload.damage = 99999;
}, TypeError);
assert.equal(tacticalEvent.payload.damage, Number(tactical.result.damage) || 0);
assert.equal(JSON.stringify(authority.getState()), tacticalBefore);

const director = new CombatPresentationDirector();
const presentation = director.startFromPresentationEvent(tacticalEvent);
assert.equal(presentation.result.damage, tacticalEvent.payload.damage);
assert.equal(presentation.result.outcome, tacticalEvent.payload.outcome);
assert.equal(presentation.result.terminal, false);

for (const grade of ["GREAT", "HIT", "MISS"]) {
  const testAuthority = new CombatSessionAuthority();
  testAuthority.startSession({
    tacticalTurn: 0,
    tacticalMaxTurns: 5,
    bossHp: 100,
    bossMaxHp: 100,
    internalEnergy: 0,
    tacticalEffectiveness: 0,
    round: 1,
    playerStamina: 70,
    playerStaminaMax: 70,
    playerStaminaRoundCost: 25,
    phase: "TACTICAL",
    batter: { id: "bw001", stats: { power: 90, contact: 90, speed: 90, eye: 90 } }
  });
  for (let i = 0; i < 5; i += 1) testAuthority.resolveTacticalTurn();
  const transition = testAuthority.resolveClimaxTurn(grade);
  const event = createCombatPresentationEvent({
    result: transition.result,
    attackerId: "bw001",
    targetId: "enemy001",
    actionType: transition.result.outcome
  });
  assert.equal(event.payload.outcome, String(transition.result.outcome).toUpperCase());
  assert.equal(event.payload.result, String(transition.result.result ?? transition.result.outcome).toUpperCase());
  assert.equal(event.payload.damage, Number(transition.result.damage) || 0);
  assert.equal(event.payload.terminal, Boolean(transition.state.terminal));
}

const rendererBefore = JSON.stringify(authority.getState());
const mutated = Object.assign({}, tacticalEvent.payload);
mutated.damage = 99999;
assert.notEqual(mutated.damage, tacticalEvent.payload.damage);
assert.equal(JSON.stringify(authority.getState()), rendererBefore);
assert.equal(authority.getState().bossHp, tactical.state.bossHp);

console.log("BONE-008-003 STATIC = PASS_STATIC");
console.log("NEGATIVE PRESENTATION ISOLATION = PASS_STATIC");
console.log("COMBAT RESULT → PRESENTATION EVENT EQUIVALENCE = PASS");
