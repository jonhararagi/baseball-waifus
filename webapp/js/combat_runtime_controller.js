import { COMBAT_STAMINA_ROUND_COST, CombatSessionAuthority } from "./combat_session_authority.js";
import { resolveTiming } from "./combat_timing_authority.js";
import {
  TIMING_RING_DURATION_MS,
  TIMING_RING_TARGET_MS
} from "./timing_ring.js";

const GREAT_WINDOW_BASE_MS = 55;
const GREAT_WINDOW_ADVANTAGE_MS = 35;
const HIT_WINDOW_BASE_MS = 135;
const HIT_WINDOW_ADVANTAGE_MS = 55;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clone(value) {
  return value && typeof value === "object"
    ? JSON.parse(JSON.stringify(value))
    : value;
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

  getTimingWindow() {
    this.assertStarted();
    const state = this.getState();
    const advantage = clamp(safeNumber(state.tacticalEffectiveness, 0) / 100, 0, 1);

    return Object.freeze({
      targetMs: TIMING_RING_TARGET_MS,
      durationMs: TIMING_RING_DURATION_MS,
      greatWindowMs: GREAT_WINDOW_BASE_MS + advantage * GREAT_WINDOW_ADVANTAGE_MS,
      hitWindowMs: HIT_WINDOW_BASE_MS + advantage * HIT_WINDOW_ADVANTAGE_MS
    });
  }

  resolveTimingInput({
    elapsedMs,
    source = "pointer",
    timingGraceMs = 0,
    timingWindow = null
  } = {}) {
    this.assertStarted();

    const state = this.getState();
    const window = timingWindow || this.getTimingWindow();
    const timing = resolveTiming({
      elapsedMs,
      targetMs: window.targetMs,
      greatWindowMs: window.greatWindowMs,
      hitWindowMs: window.hitWindowMs,
      timingGraceMs,
      source,
      round: state.round,
      tacticalEffectiveness: state.tacticalEffectiveness,
      bossHpBefore: state.bossHp
    });

    const transition = this.resolveClimaxTurn(timing.grade);

    return Object.freeze({
      timing,
      transition
    });
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
