import {
  COMBAT_STAMINA_ROUND_COST,
  resolveClimaxTurn,
  resolveTacticalTurn
} from "./combat_core.js";

export { COMBAT_STAMINA_ROUND_COST };

function clone(value) {
  return value && typeof value === "object"
    ? JSON.parse(JSON.stringify(value))
    : value;
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

export class CombatSessionAuthority {
  constructor() {
    this.state = null;
    this.batter = null;
  }

  startSession(snapshot = {}) {
    this.batter = clone(snapshot.batter || null);
    this.state = createSessionState(snapshot);
    return this.getState();
  }

  getState() {
    return clone(this.state || createSessionState());
  }

  resolveTacticalTurn() {
    if (!this.state) throw new Error("Combat session is not initialized");
    if (this.state.terminal) throw new Error("Combat session is terminal");

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

  resolveClimaxTurn(grade = "MISS") {
    if (!this.state) throw new Error("Combat session is not initialized");
    if (this.state.terminal) throw new Error("Combat session is terminal");

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
}
