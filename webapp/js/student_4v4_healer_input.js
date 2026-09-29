import { STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";

function defaultClock() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return 0;
}

function snapshotOf(battle) {
  return battle.snapshot();
}

function rejection(reason, battle) {
  return Object.freeze({
    accepted: false,
    reason,
    state: snapshotOf(battle)
  });
}

export class Student4v4HealerInput {
  constructor({ battle, clock = defaultClock } = {}) {
    if (!battle || typeof battle.submitInput !== "function" || typeof battle.snapshot !== "function") {
      throw new TypeError("Student4v4HealerInput requires a Student4v4BattleState");
    }
    if (typeof clock !== "function") {
      throw new TypeError("Student4v4HealerInput requires a clock function");
    }

    this.battle = battle;
    this.clock = clock;
    this.healerStartedAt = null;
    this.lastResponse = null;
  }

  start() {
    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.HEALER) {
      const response = rejection("INVALID_PHASE", this.battle);
      this.lastResponse = response;
      return response;
    }

    if (this.healerStartedAt === null) {
      const now = Number(this.clock());
      this.healerStartedAt = Number.isFinite(now) ? now : 0;
      this.lastResponse = null;
    }

    return snapshotOf(this.battle);
  }

  elapsedMs(now = this.clock()) {
    if (this.healerStartedAt === null) return 0;
    const current = Number(now);
    if (!Number.isFinite(current)) return 0;
    return Math.max(0, Math.round(current - this.healerStartedAt));
  }

  submitThreat(payload = {}) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      const response = rejection("INVALID_INPUT", this.battle);
      this.lastResponse = response;
      return response;
    }

    const { threatId, zone, timestampMs = null } = payload;

    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.HEALER) {
      const response = rejection("INVALID_PHASE", this.battle);
      this.lastResponse = response;
      return response;
    }

    const state = this.battle.getCurrentRoleGame()?.getState?.();
    const threat = state?.current_threat;

    if (!threat || this.healerStartedAt === null) {
      const response = rejection("NO_ACTIVE_HEALER", this.battle);
      this.lastResponse = response;
      return response;
    }

    const relativeTimestamp = timestampMs === null
      ? this.elapsedMs()
      : Number(timestampMs);

    const response = this.battle.submitInput({
      threatId,
      zone,
      timestampMs: Number.isFinite(relativeTimestamp)
        ? Math.round(relativeTimestamp)
        : relativeTimestamp
    });

    this.lastResponse = response;

    if (response.accepted && this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.HEALER) {
      this.healerStartedAt = null;
    }

    return response;
  }

  reset() {
    this.healerStartedAt = null;
    this.lastResponse = null;
    return this;
  }

  getLastResponse() {
    return this.lastResponse;
  }

  isActive() {
    return this.battle.currentPhase === STUDENT_4V4_BATTLE_PHASE.HEALER && this.healerStartedAt !== null;
  }
}
