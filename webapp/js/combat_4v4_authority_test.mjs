import assert from "node:assert/strict";
import { CombatSessionAuthority } from "./combat_session_authority.js";
import { CombatRuntimeController } from "./combat_runtime_controller.js";

function makeUnit(team, index, { health = 1000, maxHealth = 1000, characterId = null } = {}) {
  const id = (team === "PLAYER" ? "p" : "e") + String(index);
  return {
    id,
    characterId: characterId || "bw" + String(index + (team === "PLAYER" ? 1 : 11)).padStart(3, "0"),
    displayName: team + " " + index,
    team,
    stats: { power: 72 + index, contact: 65 + index, speed: 58 + index, eye: 61 + index, stamina: 76 },
    maxHealth,
    health,
    temporary: false,
    source: "CANONICAL_CHARACTER"
  };
}

function makeSnapshot(options = {}) {
  const playerHealth = options.playerHealth ?? 1000;
  const playerMaxHealth = options.playerMaxHealth ?? 1000;
  const enemyHealth = options.enemyHealth ?? 1000;
  const enemyMaxHealth = options.enemyMaxHealth ?? 1000;
  return {
    mode: "4v4",
    player_team_units: Array.from({ length: 4 }, (_, i) => makeUnit("PLAYER", i + 1, { health: playerHealth, maxHealth: playerMaxHealth })),
    enemy_team_units: Array.from({ length: 4 }, (_, i) => makeUnit("ENEMY", i + 1, { health: enemyHealth, maxHealth: enemyMaxHealth }))
  };
}

function newAuthority(snapshot = makeSnapshot()) {
  const authority = new CombatSessionAuthority();
  authority.startSession(snapshot);
  return authority;
}

const base = makeSnapshot();
const authority = newAuthority(base);
let state = authority.getState();
assert.equal(state.mode, "4v4");
assert.equal(state.phase, "TACTICAL");
assert.equal(state.tacticalTurn, 0);
assert.equal(state.tacticalMaxTurns, 5);
assert.equal(state.players.length, 4);
assert.equal(state.enemies.length, 4);
assert.deepEqual(state.players.map((unit) => unit.team), ["PLAYER", "PLAYER", "PLAYER", "PLAYER"]);
assert.deepEqual(state.enemies.map((unit) => unit.team), ["ENEMY", "ENEMY", "ENEMY", "ENEMY"]);
assert.equal(new Set([...state.players, ...state.enemies].map((unit) => unit.id)).size, 8);
assert.equal(new Set([...state.players, ...state.enemies].map((unit) => unit.characterId)).size, 8);
assert.ok([...state.players, ...state.enemies].every((unit) => unit.health > 0 && unit.alive === true));

assert.throws(() => newAuthority({ ...makeSnapshot(), enemy_team_units: makeSnapshot().enemy_team_units.slice(0, 3) }), /exactly four enemy/);
const duplicateUnitIds = makeSnapshot();
duplicateUnitIds.enemy_team_units[0].id = duplicateUnitIds.player_team_units[0].id;
assert.throws(() => newAuthority(duplicateUnitIds), /ids must be unique/);
const duplicateCharacters = makeSnapshot();
duplicateCharacters.enemy_team_units[0].characterId = duplicateCharacters.player_team_units[0].characterId;
assert.throws(() => newAuthority(duplicateCharacters), /character ids must be unique/);
const invalidMember = makeSnapshot();
invalidMember.player_team_units[2].health = 0;
assert.throws(() => newAuthority(invalidMember), /must be alive/);
const missingCanonicalStats = makeSnapshot();
delete missingCanonicalStats.player_team_units[1].stats.power;
delete missingCanonicalStats.player_team_units[1].power;
assert.throws(() => newAuthority(missingCanonicalStats), /requires canonical power stat/);

authority.selectPlayerUnit("p2");
authority.selectEnemyUnit("e3");
assert.equal(authority.getState().selectedPlayerId, "p2");
assert.equal(authority.getState().selectedEnemyId, "e3");
assert.throws(() => authority.selectPlayerUnit("missing"), /INVALID_PLAYER_COMBATANT/);
assert.throws(() => authority.selectEnemyUnit("missing"), /INVALID_ENEMY_COMBATANT/);
const beforeAction = authority.getState();
const action = authority.resolveTacticalTurn();
assert.equal(action.result.mode, "4v4");
assert.equal(action.result.attacker_id, "p2");
assert.equal(action.result.target_id, "e3");
assert.ok(action.result.damage > 0);
assert.equal(action.state.enemies.find((unit) => unit.id === "e3").health, beforeAction.enemies.find((unit) => unit.id === "e3").health - action.result.damage);
assert.ok(action.result.enemy_response.damage > 0);
assert.equal(action.state.players.find((unit) => unit.id === action.result.enemy_response.targetId).health, action.result.enemy_response.targetHealthAfter);
assert.equal(action.state.tacticalTurn, 1);

const deterministicA = newAuthority(base);
const deterministicB = newAuthority(base);
for (let i = 0; i < 3; i++) {
  assert.deepEqual(deterministicA.resolveTacticalTurn(), deterministicB.resolveTacticalTurn());
}

const deathSnapshot = makeSnapshot();
deathSnapshot.enemy_team_units[0].maxHealth = 100;
deathSnapshot.enemy_team_units[0].health = 1;
const deathAuthority = newAuthority(deathSnapshot);
const playerDeath = deathAuthority.resolveTacticalTurn();
assert.equal(playerDeath.state.enemies.find((unit) => unit.id === "e1").health, 0);
assert.equal(playerDeath.state.enemies.find((unit) => unit.id === "e1").alive, false);
assert.throws(() => deathAuthority.selectEnemyUnit("e1"), /INVALID_ENEMY_COMBATANT/);
assert.throws(() => deathAuthority.selectPlayerUnit("missing"), /INVALID_PLAYER_COMBATANT/);

const victorySnapshot = makeSnapshot({ enemyHealth: 1, enemyMaxHealth: 1, playerHealth: 1000, playerMaxHealth: 1000 });
const victoryAuthority = newAuthority(victorySnapshot);
let victory = null;
for (let i = 0; i < 4 && !victory; i++) {
  const result = victoryAuthority.resolveTacticalTurn();
  if (result.state.terminal) victory = result;
}
assert.ok(victory, "all enemy units should be defeatable through real tactical actions");
assert.equal(victory.state.terminal, "VICTORY");
assert.equal(victory.state.phase, "VICTORY");
assert.equal(victory.state.enemies.filter((unit) => unit.health > 0).length, 0);
assert.equal(victory.result.outcome, "VICTORY");
assert.throws(() => victoryAuthority.resolveTacticalTurn(), /terminal/);
assert.throws(() => victoryAuthority.resolveClimaxTurn("GREAT"), /terminal/);

const defeatSnapshot = makeSnapshot({ playerHealth: 1, playerMaxHealth: 100, enemyHealth: 1000, enemyMaxHealth: 1000 });
const defeatAuthority = newAuthority(defeatSnapshot);
let defeat = null;
for (let i = 0; i < 4 && !defeat; i++) {
  const result = defeatAuthority.resolveTacticalTurn();
  if (result.state.terminal) defeat = result;
}
assert.ok(defeat, "deterministic enemy actions should be able to defeat all four player units");
assert.equal(defeat.state.terminal, "DEFEAT");
assert.equal(defeat.state.phase, "DEFEAT");
assert.equal(defeat.state.players.filter((unit) => unit.health > 0).length, 0);
assert.throws(() => defeatAuthority.resolveTacticalTurn(), /terminal/);

const ringRuntime = new CombatRuntimeController();
ringRuntime.startSession(makeSnapshot({ playerHealth: 2000, playerMaxHealth: 2000, enemyHealth: 2000, enemyMaxHealth: 2000 }));
const tacticalTurns = [];
for (let turn = 1; turn <= 5; turn++) {
  const resolved = ringRuntime.resolveTacticalTurn();
  tacticalTurns.push(resolved.result.turn);
}
assert.deepEqual(tacticalTurns, [1, 2, 3, 4, 5]);
assert.equal(ringRuntime.getState().phase, "CLIMAX");
const ringResolution = ringRuntime.resolveTimingInput({
  elapsedMs: 720,
  source: "pointer",
  timingWindow: { targetMs: 720, durationMs: 1400, greatWindowMs: 55, hitWindowMs: 135 }
});
assert.equal(ringResolution.timing.grade, "GREAT");
assert.equal(ringResolution.timing.source, "pointer");
assert.equal(ringResolution.transition.result.mode, "4v4");
assert.equal(ringResolution.transition.state.mode, "4v4");
assert.equal(ringResolution.transition.state.round, 2);
assert.equal(ringResolution.transition.state.tacticalTurn, 0);
assert.equal(ringResolution.transition.state.lastAction.kind, "TIMING_RING");
assert.ok(ringResolution.transition.result.damage > 0);
assert.ok(ringResolution.transition.state.enemies.reduce((sum, unit) => sum + unit.health, 0)
  < 8000);

console.log("combat_4v4_authority_test: PASS");
