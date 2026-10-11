import {
  COMBAT_RESULT_TYPE,
  COMBAT_STAMINA_ROUND_COST,
  calculateClimaxDamage,
  calculateTacticalTurn,
  resolveClimaxTurn,
  resolveTimingGrade,
  resolveTacticalTurn
} from "./combat_core.js";

export { COMBAT_STAMINA_ROUND_COST };

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}
function numberOr(value, fallback, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function createSessionState(snapshot = {}) {
  const batter = snapshot.batter || {};
  const stats = batter.stats || batter.base_stats || {};
  const staminaDefault = numberOr(batter.stamina ?? stats.stamina, 70, 1, 100);
  const playerStaminaMax = Math.round(numberOr(snapshot.playerStaminaMax, staminaDefault, 1, 100));
  const bossMaxHp = numberOr(snapshot.bossMaxHp, 100, 1);
  const tacticalMaxTurns = Math.max(1, Math.round(numberOr(snapshot.tacticalMaxTurns, 5, 1, 5)));
  const phase = String(snapshot.phase || snapshot.battlePhase || "TACTICAL").toUpperCase();
  return {
    round: Math.max(1, Math.round(numberOr(snapshot.round, 1, 1))),
    tacticalTurn: Math.max(0, Math.round(numberOr(snapshot.tacticalTurn, 0, 0, tacticalMaxTurns))),
    tacticalMaxTurns,
    bossHp: numberOr(snapshot.bossHp, bossMaxHp, 0, bossMaxHp),
    bossMaxHp,
    bossConcentration: numberOr(snapshot.bossConcentration, 100, 0, 100),
    playerStamina: numberOr(snapshot.playerStamina, playerStaminaMax, 0, playerStaminaMax),
    playerStaminaMax,
    playerStaminaRoundCost: Math.round(numberOr(snapshot.playerStaminaRoundCost, COMBAT_STAMINA_ROUND_COST, 1, playerStaminaMax)),
    internalEnergy: numberOr(snapshot.internalEnergy, 0, 0, 100),
    tacticalEffectiveness: numberOr(snapshot.tacticalEffectiveness, 0, 0, 100),
    phase,
    terminal: phase === "VICTORY" || phase === "DEFEAT" ? phase : null
  };
}

const FOUR_V_FOUR_COUNT = 4;
const FOUR_V_FOUR_MAX_TURNS = 5;

function normalizeCombatant(raw, team) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("4v4 combatant must be an object");
  const id = String(raw.id || "").trim();
  const characterId = String(raw.characterId || raw.character_id || raw.canonical?.character_id || "").trim();
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(id)) throw new TypeError("4v4 combatant requires a stable id");
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(characterId)) throw new TypeError("4v4 combatant requires a canonical characterId");
  const sourceStats = raw.stats || raw.base_stats || raw.canonical?.stats || {};
  const requiredCanonicalStat = (value, name, max = 100) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      throw new TypeError("4v4 combatant requires canonical " + name + " stat");
    }
    return Math.min(max, numeric);
  };
  const stats = {
    power: requiredCanonicalStat(sourceStats.power ?? raw.power, "power"),
    contact: requiredCanonicalStat(sourceStats.contact ?? raw.contact, "contact"),
    speed: requiredCanonicalStat(sourceStats.speed ?? raw.speed, "speed"),
    eye: requiredCanonicalStat(sourceStats.eye ?? sourceStats.control ?? raw.eye, "eye/control"),
    stamina: requiredCanonicalStat(sourceStats.stamina ?? raw.stamina, "stamina", 200)
  };
  const maxHealth = Math.round(numberOr(raw.maxHealth ?? raw.max_health, Math.max(1, stats.stamina), 1, 1000));
  const health = Math.round(numberOr(raw.health ?? raw.hp, maxHealth, 0, maxHealth));
  if (health <= 0) throw new TypeError("4v4 initial combatants must be alive");
  return {
    id,
    characterId,
    displayName: String(raw.displayName || raw.display_name || raw.canonical?.display_name || characterId),
    team,
    stats,
    maxHealth,
    health,
    alive: true,
    temporary: raw.temporary === true,
    source: String(raw.source || (raw.temporary === true ? "TEMPORARY_CANONICAL_LOCAL" : "CANONICAL_CHARACTER"))
  };
}

function normalizeFourVFourTeams(snapshot) {
  const playerInput = snapshot.player_team_units || snapshot.playerTeam || snapshot.playerUnits;
  const enemyInput = snapshot.enemy_team_units || snapshot.enemyTeam || snapshot.enemyUnits;
  if (!Array.isArray(playerInput) || playerInput.length !== FOUR_V_FOUR_COUNT) {
    throw new TypeError("4v4 requires exactly four player combatants");
  }
  if (!Array.isArray(enemyInput) || enemyInput.length !== FOUR_V_FOUR_COUNT) {
    throw new TypeError("4v4 requires exactly four enemy combatants");
  }
  const players = playerInput.map((unit) => normalizeCombatant(unit, "PLAYER"));
  const enemies = enemyInput.map((unit) => normalizeCombatant(unit, "ENEMY"));
  const ids = [...players, ...enemies].map((unit) => unit.id);
  if (new Set(ids).size !== ids.length) throw new TypeError("4v4 combatant ids must be unique across both teams");
  const characterIds = [...players, ...enemies].map((unit) => unit.characterId);
  if (new Set(characterIds).size !== characterIds.length) throw new TypeError("4v4 canonical character ids must be unique across both teams");
  return { players, enemies };
}
function hasLivingTeam(units) { return units.some((unit) => unit.health > 0); }
function findAliveUnit(units, id) { return units.find((unit) => unit.id === id && unit.health > 0) || null; }
function weakestLivingUnit(units) {
  return units.filter((unit) => unit.health > 0)
    .sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth) || a.id.localeCompare(b.id))[0] || null;
}
function applyDamage(units, targetId, damage) {
  return units.map((unit) => {
    if (unit.id !== targetId) return unit;
    const health = Math.max(0, unit.health - Math.max(0, Math.round(Number(damage) || 0)));
    return { ...unit, health, alive: health > 0 };
  });
}
function terminalForTeams(players, enemies) {
  if (!hasLivingTeam(enemies)) return "VICTORY";
  if (!hasLivingTeam(players)) return "DEFEAT";
  return null;
}
function unitStats(unit) {
  return { power: unit.stats.power, contact: unit.stats.contact, speed: unit.stats.speed, eye: unit.stats.eye };
}
function createFourVFourSessionState(snapshot) {
  const { players, enemies } = normalizeFourVFourTeams(snapshot);
  return {
    mode: "4v4",
    round: 1,
    tacticalTurn: 0,
    tacticalMaxTurns: FOUR_V_FOUR_MAX_TURNS,
    bossHp: enemies.reduce((sum, unit) => sum + unit.health, 0),
    bossMaxHp: enemies.reduce((sum, unit) => sum + unit.maxHealth, 0),
    bossConcentration: 100,
    playerStamina: players.reduce((sum, unit) => sum + unit.stats.stamina, 0),
    playerStaminaMax: players.reduce((sum, unit) => sum + unit.stats.stamina, 0),
    playerStaminaRoundCost: COMBAT_STAMINA_ROUND_COST,
    internalEnergy: 0,
    tacticalEffectiveness: 0,
    phase: "TACTICAL",
    terminal: null,
    players,
    enemies,
    selectedPlayerId: players[0].id,
    selectedEnemyId: enemies[0].id,
    playerActionCount: 0,
    enemyActionCount: 0,
    lastAction: null
  };
}

export class CombatSessionAuthority {
  constructor() { this.state = null; this.batter = null; }

  startSession(snapshot = {}) {
    const mode = String(snapshot.mode || snapshot.game_mode || "").toLowerCase();
    const nextState = mode === "4v4" ? createFourVFourSessionState(snapshot) : createSessionState(snapshot);
    this.batter = clone(snapshot.batter || null);
    this.state = nextState;
    return this.getState();
  }

  getState() {
    if (!this.state) return clone(createSessionState());
    return clone(this.state);
  }

  selectPlayerUnit(unitId) {
    if (!this.state || this.state.mode !== "4v4") throw new Error("4v4 session is not initialized");
    const unit = findAliveUnit(this.state.players, String(unitId || ""));
    if (!unit) throw new Error("INVALID_PLAYER_COMBATANT");
    this.state = { ...this.state, selectedPlayerId: unit.id };
    return this.getState();
  }

  selectEnemyUnit(unitId) {
    if (!this.state || this.state.mode !== "4v4") throw new Error("4v4 session is not initialized");
    const unit = findAliveUnit(this.state.enemies, String(unitId || ""));
    if (!unit) throw new Error("INVALID_ENEMY_COMBATANT");
    this.state = { ...this.state, selectedEnemyId: unit.id };
    return this.getState();
  }

  resolveTacticalTurn() {
    if (!this.state) throw new Error("Combat session is not initialized");
    if (this.state.terminal) throw new Error("Combat session is terminal");
    if (this.state.mode === "4v4") return this.resolveFourVFourTacticalTurn();
    const stats = this.batter?.stats || this.batter?.base_stats || {};
    const result = resolveTacticalTurn({
      turn: this.state.tacticalTurn + 1,
      power: stats.power ?? this.batter?.power ?? 70,
      contact: stats.contact ?? this.batter?.contact ?? 70,
      speed: stats.speed ?? this.batter?.speed ?? 70,
      eye: stats.eye ?? this.batter?.eye ?? 70,
      bossHp: this.state.bossHp,
      bossMaxHp: this.state.bossMaxHp,
      internalEnergy: this.state.internalEnergy,
      tacticalEffectiveness: this.state.tacticalEffectiveness,
      tacticalMaxTurns: this.state.tacticalMaxTurns
    });
    this.state = {
      ...this.state,
      bossHp: result.boss_hp_after,
      bossConcentration: result.boss_concentration_after,
      internalEnergy: result.energy_after,
      tacticalEffectiveness: result.effectiveness_after,
      tacticalTurn: result.tactical_turn_after,
      phase: result.phase,
      terminal: null
    };
    return Object.freeze({ result, state: this.getState() });
  }

  resolveFourVFourTacticalTurn() {
    if (this.state.phase !== "TACTICAL") throw new Error("4v4 tactical phase is not active");
    const tacticalTurn = this.state.tacticalTurn + 1;
    const attacker = findAliveUnit(this.state.players, this.state.selectedPlayerId) || weakestLivingUnit(this.state.players);
    const target = findAliveUnit(this.state.enemies, this.state.selectedEnemyId) || weakestLivingUnit(this.state.enemies);
    if (!attacker) throw new Error("NO_LIVING_PLAYER_COMBATANT");
    if (!target) throw new Error("NO_LIVING_ENEMY_COMBATANT");

    const tactical = calculateTacticalTurn({ turn: tacticalTurn, ...unitStats(attacker) });
    const enemiesAfterPlayer = applyDamage(this.state.enemies, target.id, tactical.damage);
    const terminalAfterPlayer = terminalForTeams(this.state.players, enemiesAfterPlayer);
    let players = this.state.players;
    let enemies = enemiesAfterPlayer;
    let enemyResponse = null;
    let enemyDamage = 0;
    let enemyActionCount = this.state.enemyActionCount;
    if (!terminalAfterPlayer) {
      const livingEnemies = enemies.filter((unit) => unit.health > 0);
      const enemyAttacker = livingEnemies[enemyActionCount % livingEnemies.length];
      const enemyTarget = weakestLivingUnit(players);
      if (enemyAttacker && enemyTarget) {
        const enemyTactical = calculateTacticalTurn({ turn: tacticalTurn, ...unitStats(enemyAttacker) });
        enemyDamage = enemyTactical.damage;
        players = applyDamage(players, enemyTarget.id, enemyDamage);
        enemyResponse = {
          attackerId: enemyAttacker.id,
          targetId: enemyTarget.id,
          damage: enemyDamage,
          targetHealthAfter: Math.max(0, enemyTarget.health - enemyDamage)
        };
        enemyActionCount += 1;
      }
    }

    const terminal = terminalForTeams(players, enemies);
    const nextEnergy = Math.round(numberOr(this.state.internalEnergy + tactical.charge, 0, 0, 100));
    const nextEffectiveness = Math.round(numberOr(this.state.tacticalEffectiveness * 0.55 + tactical.effectiveness * 0.45, 0, 0, 100));
    const phase = terminal || (tacticalTurn >= this.state.tacticalMaxTurns ? "CLIMAX" : "TACTICAL");
    const nextPlayer = findAliveUnit(players, this.state.selectedPlayerId) || weakestLivingUnit(players);
    const nextEnemy = findAliveUnit(enemies, this.state.selectedEnemyId) || weakestLivingUnit(enemies);
    const enemyHp = enemies.reduce((sum, unit) => sum + unit.health, 0);
    const enemyMax = enemies.reduce((sum, unit) => sum + unit.maxHealth, 0);

    this.state = {
      ...this.state,
      players,
      enemies,
      round: this.state.round,
      tacticalTurn,
      internalEnergy: nextEnergy,
      tacticalEffectiveness: nextEffectiveness,
      phase,
      terminal,
      selectedPlayerId: nextPlayer?.id || "",
      selectedEnemyId: nextEnemy?.id || "",
      playerActionCount: this.state.playerActionCount + 1,
      enemyActionCount,
      lastAction: { kind: "TACTICAL", attackerId: attacker.id, targetId: target.id, damage: tactical.damage, enemyResponse },
      bossHp: enemyHp,
      bossConcentration: Math.round(100 * enemyHp / Math.max(1, enemyMax))
    };
    const result = Object.freeze({
      type: COMBAT_RESULT_TYPE,
      mode: "4v4",
      phase,
      outcome: terminal || "TACTICAL_HIT",
      result: terminal || "TACTICAL_HIT",
      turn: tacticalTurn,
      tactical_turn_after: tacticalTurn,
      tacticalMaxTurns: this.state.tacticalMaxTurns,
      mob_count: tactical.mob_count,
      charge: tactical.charge,
      energy_after: nextEnergy,
      effectiveness_after: nextEffectiveness,
      damage: tactical.damage,
      player_damage: tactical.damage,
      enemy_damage: enemyDamage,
      attacker_id: attacker.id,
      target_id: target.id,
      enemy_response: enemyResponse,
      boss_hp_before: target.health,
      boss_hp_after: Math.max(0, target.health - tactical.damage),
      victory: terminal === "VICTORY",
      defeat: terminal === "DEFEAT",
      match_end: Boolean(terminal)
    });
    return Object.freeze({ result, state: this.getState() });
  }

  resolveClimaxTurn(grade = "MISS") {
    if (!this.state) throw new Error("Combat session is not initialized");
    if (this.state.terminal) throw new Error("Combat session is terminal");
    if (this.state.mode === "4v4") return this.resolveFourVFourClimaxTurn(grade);
    const result = resolveClimaxTurn({
      grade,
      bossHp: this.state.bossHp,
      bossMaxHp: this.state.bossMaxHp,
      internalEnergy: this.state.internalEnergy,
      tacticalEffectiveness: this.state.tacticalEffectiveness,
      round: this.state.round,
      playerStamina: this.state.playerStamina,
      playerStaminaMax: this.state.playerStaminaMax,
      staminaRoundCost: this.state.playerStaminaRoundCost
    });
    const terminal = result.victory ? "VICTORY" : result.defeat ? "DEFEAT" : null;
    this.state = {
      ...this.state,
      bossHp: result.boss_hp_after,
      bossConcentration: result.boss_concentration_after,
      playerStamina: result.player_stamina_after,
      internalEnergy: result.energy_after,
      tacticalEffectiveness: result.effectiveness_after,
      round: result.round_after,
      tacticalTurn: result.tactical_turn_after,
      phase: result.phase,
      terminal
    };
    return Object.freeze({ result, state: this.getState() });
  }

  resolveFourVFourClimaxTurn(grade = "MISS") {
    if (this.state.phase !== "CLIMAX") throw new Error("4v4 Timing Ring phase is not active");
    const normalizedGrade = String(grade || "MISS").toUpperCase();
    const attacker = findAliveUnit(this.state.players, this.state.selectedPlayerId) || weakestLivingUnit(this.state.players);
    const target = findAliveUnit(this.state.enemies, this.state.selectedEnemyId) || weakestLivingUnit(this.state.enemies);
    if (!attacker) throw new Error("NO_LIVING_PLAYER_COMBATANT");
    if (!target) throw new Error("NO_LIVING_ENEMY_COMBATANT");

    const damage = calculateClimaxDamage({
      grade: normalizedGrade,
      effectiveness: this.state.tacticalEffectiveness,
      internalEnergy: this.state.internalEnergy
    });
    const enemiesAfterPlayer = applyDamage(this.state.enemies, target.id, damage);
    const terminalAfterPlayer = terminalForTeams(this.state.players, enemiesAfterPlayer);
    let players = this.state.players;
    let enemies = enemiesAfterPlayer;
    let enemyResponse = null;
    let enemyDamage = 0;
    let enemyActionCount = this.state.enemyActionCount;
    if (!terminalAfterPlayer) {
      const livingEnemies = enemies.filter((unit) => unit.health > 0);
      const enemyAttacker = livingEnemies[enemyActionCount % livingEnemies.length];
      const enemyTarget = weakestLivingUnit(players);
      if (enemyAttacker && enemyTarget) {
        const enemyTactical = calculateTacticalTurn({
          turn: ((this.state.round - 1) % FOUR_V_FOUR_MAX_TURNS) + 1,
          ...unitStats(enemyAttacker)
        });
        enemyDamage = enemyTactical.damage;
        players = applyDamage(players, enemyTarget.id, enemyDamage);
        enemyResponse = {
          attackerId: enemyAttacker.id,
          targetId: enemyTarget.id,
          damage: enemyDamage,
          targetHealthAfter: Math.max(0, enemyTarget.health - enemyDamage)
        };
        enemyActionCount += 1;
      }
    }

    const terminal = terminalForTeams(players, enemies);
    const phase = terminal || "TACTICAL";
    const nextPlayer = findAliveUnit(players, this.state.selectedPlayerId) || weakestLivingUnit(players);
    const nextEnemy = findAliveUnit(enemies, this.state.selectedEnemyId) || weakestLivingUnit(enemies);
    const nextRound = terminal ? this.state.round : this.state.round + 1;
    const enemyHp = enemies.reduce((sum, unit) => sum + unit.health, 0);
    const enemyMax = enemies.reduce((sum, unit) => sum + unit.maxHealth, 0);
    this.state = {
      ...this.state,
      players,
      enemies,
      round: nextRound,
      tacticalTurn: 0,
      internalEnergy: 0,
      tacticalEffectiveness: 0,
      phase,
      terminal,
      selectedPlayerId: nextPlayer?.id || "",
      selectedEnemyId: nextEnemy?.id || "",
      enemyActionCount,
      lastAction: { kind: "TIMING_RING", grade: normalizedGrade, attackerId: attacker.id, targetId: target.id, damage, enemyResponse },
      bossHp: enemyHp,
      bossConcentration: Math.round(100 * enemyHp / Math.max(1, enemyMax))
    };
    const outcome = terminal || resolveTimingGrade(normalizedGrade);
    const result = Object.freeze({
      type: COMBAT_RESULT_TYPE,
      mode: "4v4",
      phase,
      outcome,
      result: outcome,
      grade: normalizedGrade,
      damage,
      player_damage: damage,
      enemy_damage: enemyDamage,
      attacker_id: attacker.id,
      target_id: target.id,
      enemy_response: enemyResponse,
      boss_hp_before: target.health,
      boss_hp_after: Math.max(0, target.health - damage),
      player_stamina_before: this.state.playerStamina,
      player_stamina_after: this.state.playerStamina,
      player_stamina_max: this.state.playerStaminaMax,
      energy_after: 0,
      effectiveness_after: 0,
      tactical_turn_after: 0,
      round_after: nextRound,
      victory: terminal === "VICTORY",
      defeat: terminal === "DEFEAT",
      match_end: Boolean(terminal)
    });
    return Object.freeze({ result, state: this.getState() });
  }
}
