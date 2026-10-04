import {
  COMBAT_STAMINA_ROUND_COST,
  resolveClimaxTurn,
  resolveTacticalTurn
} from "./combat_core.js";

function cloneSnapshot(snapshot) {
  return snapshot && typeof snapshot === "object"
    ? JSON.parse(JSON.stringify(snapshot))
    : {};
}

export class CombatSessionAuthority {
  resolveTacticalTurn(snapshot = {}) {
    const state = cloneSnapshot(snapshot);
    const batter = state.batter || {};
    const stats = batter.stats || batter.base_stats || {};

    return resolveTacticalTurn({
      turn: Number(state.tacticalTurn ?? 0) + 1,
      power: stats.power ?? batter.power ?? 70,
      contact: stats.contact ?? batter.contact ?? 70,
      speed: stats.speed ?? batter.speed ?? 70,
      eye: stats.eye ?? batter.eye ?? 70,
      bossHp: state.bossHp ?? 100,
      bossMaxHp: state.bossMaxHp ?? 100,
      internalEnergy: state.internalEnergy ?? 0,
      tacticalEffectiveness: state.tacticalEffectiveness ?? 0,
      tacticalMaxTurns: state.tacticalMaxTurns ?? 5
    });
  }

  resolveClimaxTurn(snapshot = {}, grade = "MISS") {
    const state = cloneSnapshot(snapshot);

    return resolveClimaxTurn({
      grade,
      bossHp: state.bossHp ?? 100,
      bossMaxHp: state.bossMaxHp ?? 100,
      internalEnergy: state.internalEnergy ?? 0,
      tacticalEffectiveness: state.tacticalEffectiveness ?? 0,
      round: state.round ?? 1,
      playerStamina: state.playerStamina ?? 70,
      playerStaminaMax: state.playerStaminaMax ?? 100,
      staminaRoundCost: state.playerStaminaRoundCost ?? COMBAT_STAMINA_ROUND_COST
    });
  }
}
