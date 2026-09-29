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

function normalizeTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export class Student4v4BatterInput {
  constructor({ battle, clock = defaultClock } = {}) {
    if (!battle || typeof battle.submitInput !== "function" || typeof battle.snapshot !== "function") {
      throw new TypeError("Student4v4BatterInput requires a Student4v4BattleState");
    }
    if (typeof clock !== "function") {
      throw new TypeError("Student4v4BatterInput requires a clock function");
    }

    this.battle = battle;
    this.clock = clock;
    this.batterStartedAt = null;
    this.lastResponse = null;
    this.resolvedOpportunityIds = new Set();
  }

  start() {
    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.BATTER) {
      const response = rejection("INVALID_PHASE", this.battle);
      this.lastResponse = response;
      return response;
    }

    if (this.batterStartedAt === null) {
      const now = Number(this.clock());
      this.batterStartedAt = Number.isFinite(now) ? now : 0;
      this.lastResponse = null;
      this.resolvedOpportunityIds.clear();
    }

    return snapshotOf(this.battle);
  }

  elapsedMs(now = this.clock()) {
    if (this.batterStartedAt === null) return 0;
    const current = Number(now);
    if (!Number.isFinite(current)) return 0;
    return Math.max(0, Math.round(current - this.batterStartedAt));
  }

  getCurrentOpportunity() {
    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.BATTER || this.batterStartedAt === null) {
      return null;
    }
    return this.battle.getCurrentRoleGame()?.getState?.()?.current_opportunity || null;
  }

  submitSwing(payload = {}) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return this._reject("INVALID_INPUT");
    }

    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.BATTER) {
      return this._reject("INVALID_PHASE");
    }

    if (this.batterStartedAt === null) {
      return this._reject("NO_ACTIVE_BATTER");
    }

    const opportunityId = String(payload.opportunityId ?? "");
    if (this.resolvedOpportunityIds.has(opportunityId)) {
      return this._reject("OPPORTUNITY_ALREADY_RESOLVED");
    }

    const opportunity = this.getCurrentOpportunity();
    if (!opportunity) {
      return this._reject("NO_ACTIVE_OPPORTUNITY");
    }

    if (!opportunityId || opportunityId !== opportunity.id) {
      return this._reject("INVALID_OPPORTUNITY");
    }

    const timestampMs = payload.timestampMs === undefined || payload.timestampMs === null
      ? this.elapsedMs()
      : normalizeTimestamp(payload.timestampMs);

    if (timestampMs === null) {
      return this._reject("INVALID_TIMESTAMP");
    }

    const response = this.battle.submitInput({
      opportunityId,
      timestampMs: Math.round(timestampMs)
    });

    this.lastResponse = response;

    if (response.accepted) {
      this.resolvedOpportunityIds.add(opportunityId);
    }

    if (response.accepted && this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.BATTER) {
      this.batterStartedAt = null;
    }

    return response;
  }

  reset() {
    this.batterStartedAt = null;
    this.lastResponse = null;
    this.resolvedOpportunityIds.clear();
    return this;
  }

  getLastResponse() {
    return this.lastResponse;
  }

  isActive() {
    return this.battle.currentPhase === STUDENT_4V4_BATTLE_PHASE.BATTER && this.batterStartedAt !== null;
  }

  _reject(reason) {
    const response = rejection(reason, this.battle);
    this.lastResponse = response;
    return response;
  }
}
