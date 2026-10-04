import assert from "node:assert/strict";
import fs from "node:fs";
import {
  COMBAT_STAMINA_ROUND_COST,
  resolveClimaxTurn,
  resolveTacticalTurn
} from "./combat_core.js";
import { CombatSessionAuthority } from "./combat_session_authority.js";

const combat = fs.readFileSync(new URL("./combat.js", import.meta.url), "utf8");
const authoritySource = fs.readFileSync(new URL("./combat_session_authority.js", import.meta.url), "utf8");

assert.ok(authoritySource.includes('from "./combat_core.js"'));
assert.equal(authoritySource.includes("./combat.js"), false);
assert.doesNotMatch(authoritySource, /CombatPresentationDirector|document\.|window\.|HTMLCanvasElement|canvas/);

const gameplayAssignments = /^(?:\s*)this\.(battlePhase|tacticalTurn|tacticalMaxTurns|bossMaxHp|bossHp|bossConcentration|playerStaminaMax|playerStamina|playerStaminaRoundCost|internalEnergy|tacticalEffectiveness|round)\s*=/m;
assert.equal(gameplayAssignments.test(combat), false);
assert.match(combat, /this\.combatAuthority\.startSession\(/);
assert.match(combat, /this\.combatAuthority\.resolveTacticalTurn\(\)/);
assert.match(combat, /this\.combatAuthority\.resolveClimaxTurn\(grade\)/);
assert.match(combat, /this\.canvas\.dataset\.combatTacticalTurn = String\(loopState\.tacticalTurn/);
assert.match(combat, /this\.canvas\.dataset\.combatTacticalMaxTurns = String\(loopState\.tacticalMaxTurns/);
assert.match(combat, /this\.canvas\.dataset\.combatPlayerStamina = String\(loopState\.playerStamina/);
assert.match(combat, /this\.canvas\.dataset\.combatPlayerStaminaMax = String\(loopState\.playerStaminaMax/);
assert.match(combat, /this\.canvas\.dataset\.combatTimingGrade = String\(loopState\.last_timing\?\.grade/);
assert.equal(combat.includes("loopState.tactical_turn"), false);
assert.equal(combat.includes("loopState.tactical_max_turns"), false);
assert.equal(combat.includes("loopState.player_stamina"), false);
assert.equal(combat.includes("loopState.player_stamina_max"), false);

const base = {
  tacticalTurn: 0,
  tacticalMaxTurns: 5,
  bossHp: 100,
  bossMaxHp: 100,
  internalEnergy: 0,
  tacticalEffectiveness: 0,
  round: 1,
  playerStamina: 70,
  playerStaminaMax: 70,
  playerStaminaRoundCost: COMBAT_STAMINA_ROUND_COST,
  phase: "TACTICAL",
  batter: { stats: { power: 90, contact: 85, speed: 80, eye: 88 } }
};

const authority = new CombatSessionAuthority();
const initial = authority.startSession(base);
assert.equal(initial.phase, "TACTICAL");
assert.equal(initial.tacticalTurn, 0);

for (let turn = 1; turn <= 5; turn += 1) {
  const before = authority.getState();
  const expected = resolveTacticalTurn({
    turn,
    power: base.batter.stats.power,
    contact: base.batter.stats.contact,
    speed: base.batter.stats.speed,
    eye: base.batter.stats.eye,
    bossHp: before.bossHp,
    bossMaxHp: before.bossMaxHp,
    internalEnergy: before.internalEnergy,
    tacticalEffectiveness: before.tacticalEffectiveness,
    tacticalMaxTurns: before.tacticalMaxTurns
  });
  const actual = authority.resolveTacticalTurn();
  assert.deepEqual(actual.result, expected);
  assert.equal(actual.state.bossHp, expected.boss_hp_after);
  assert.equal(actual.state.internalEnergy, expected.energy_after);
  assert.equal(actual.state.tacticalEffectiveness, expected.effectiveness_after);
  assert.equal(actual.state.tacticalTurn, expected.tactical_turn_after);
}

assert.equal(authority.getState().phase, "CLIMAX");

for (const grade of ["GREAT", "HIT", "MISS"]) {
  const testAuthority = new CombatSessionAuthority();
  testAuthority.startSession(base);
  for (let turn = 1; turn <= 5; turn += 1) testAuthority.resolveTacticalTurn();

  const before = testAuthority.getState();
  const expected = resolveClimaxTurn({
    grade,
    bossHp: before.bossHp,
    bossMaxHp: before.bossMaxHp,
    internalEnergy: before.internalEnergy,
    tacticalEffectiveness: before.tacticalEffectiveness,
    round: before.round,
    playerStamina: before.playerStamina,
    playerStaminaMax: before.playerStaminaMax,
    staminaRoundCost: before.playerStaminaRoundCost
  });
  const actual = testAuthority.resolveClimaxTurn(grade);
  assert.deepEqual(actual.result, expected);
  assert.equal(actual.state.phase, expected.phase);
  assert.equal(actual.state.playerStamina, expected.player_stamina_after);
}

const victoryAuthority = new CombatSessionAuthority();
victoryAuthority.startSession({
  ...base,
  bossHp: 1,
  tacticalTurn: 5,
  phase: "CLIMAX"
});
const victory = victoryAuthority.resolveClimaxTurn("GREAT");
assert.equal(victory.state.terminal, "VICTORY");
assert.equal(victory.state.phase, "VICTORY");

const defeatAuthority = new CombatSessionAuthority();
defeatAuthority.startSession({
  ...base,
  bossHp: 100,
  tacticalTurn: 5,
  phase: "CLIMAX",
  playerStamina: 25
});
const defeat = defeatAuthority.resolveClimaxTurn("MISS");
assert.equal(defeat.state.terminal, "DEFEAT");
assert.equal(defeat.state.phase, "DEFEAT");

console.log("BONE-008-002 STATIC = PASS_STATIC");
console.log("TACTICAL/CLIMAX EQUIVALENCE = PASS");
console.log("TERMINAL AUTHORITY = PASS");

import { CombatPresentationDirector } from "./combat_presentation_director.js";

const isolationAuthority = new CombatSessionAuthority();
isolationAuthority.startSession(base);
const gameplayBeforePresentation = isolationAuthority.getState();
const presentationDirector = new CombatPresentationDirector();
presentationDirector.startFromPresentationEvent?.({
  result: {
    result: "HOME_RUN",
    damage: 100,
    attackerId: "bw001",
    targetId: "enemy001",
    actionType: "CLIMAX_ACTION",
    terminal: true
  }
});
assert.deepEqual(isolationAuthority.getState(), gameplayBeforePresentation);
console.log("PRESENTATION OWNERSHIP ISOLATION = PASS");
