import { COMBAT_STAMINA_ROUND_COST, CombatSessionAuthority } from "./combat_session_authority.js";

function clone(value) {
  return value && typeof value === "object"
    ? JSON.parse(JSON.stringify(value))
    : value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export class CombatRuntimeController {
  constructor({ authority = null } = {}) {
    this.authority = authority || new CombatSessionAuthority();
    this.started = false;
  }

  startSession(snapshot = {}) {
    const configuredStamina = safeNumber(
      snapshot?.batter?.stamina ?? snapshot?.batter?.stats?.stamina,
      70
    );
    const stamina = clamp(Math.round(configuredStamina), 1, 100);

    const state = this.authority.startSession({
      ...snapshot,
      phase: "TACTICAL",
      tacticalTurn: 0,
      bossMaxHp: 100,
      bossHp: 100,
      bossConcentration: 100,
      playerStaminaMax: stamina,
      playerStamina: stamina,
      playerStaminaRoundCost: COMBAT_STAMINA_ROUND_COST,
      internalEnergy: 0,
      tacticalEffectiveness: 0,
      round: 1,
      tacticalMaxTurns: 5
    });

    this.started = true;
    return state;
  }

  getState() {
    return this.authority.getState();
  }

  resolveTacticalTurn() {
    this.assertStarted();
    return this.authority.resolveTacticalTurn();
  }

  resolveClimaxTurn(grade = "MISS") {
    this.assertStarted();
    return this.authority.resolveClimaxTurn(grade);
  }

  assertStarted() {
    if (!this.started) {
      throw new Error("Combat runtime is not initialized");
    }
  }
}
