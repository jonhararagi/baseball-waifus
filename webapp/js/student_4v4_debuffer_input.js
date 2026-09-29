import { STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";
import { DEBUFF_TARGET_TYPES } from "./debuffer_disruptor.js";

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

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export class Student4v4DebufferInput {
  constructor({ battle, clock = defaultClock } = {}) {
    if (!battle || typeof battle.submitInput !== "function" || typeof battle.snapshot !== "function") {
      throw new TypeError("Student4v4DebufferInput requires a Student4v4BattleState");
    }
    if (typeof clock !== "function") {
      throw new TypeError("Student4v4DebufferInput requires a clock function");
    }

    this.battle = battle;
    this.clock = clock;
    this.debufferStartedAt = null;
    this.lastResponse = null;
    this.resolvedTargetIds = new Set();
  }

  start() {
    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.DEBUFFER) {
      const response = rejection("INVALID_PHASE", this.battle);
      this.lastResponse = response;
      return response;
    }

    if (this.debufferStartedAt === null) {
      const now = normalizeNumber(this.clock());
      this.debufferStartedAt = now ?? 0;
      this.lastResponse = null;
      this.resolvedTargetIds.clear();
    }

    return snapshotOf(this.battle);
  }

  elapsedMs(now = this.clock()) {
    if (this.debufferStartedAt === null) return 0;
    const current = normalizeNumber(now);
    if (current === null) return 0;
    return Math.max(0, Math.round(current - this.debufferStartedAt));
  }

  getCurrentTarget() {
    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.DEBUFFER || this.debufferStartedAt === null) {
      return null;
    }
    return this.battle.getCurrentRoleGame()?.getState?.()?.current_target || null;
  }

  submitTarget(payload = {}) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return this._reject("INVALID_INPUT");
    }

    if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.DEBUFFER) {
      return this._reject("INVALID_PHASE");
    }

    if (this.debufferStartedAt === null) {
      return this._reject("NO_ACTIVE_DEBUFFER");
    }

    const target = this.getCurrentTarget();
    if (!target) {
      return this._reject("NO_ACTIVE_TARGET");
    }

    const targetId = String(payload.targetId ?? "");
    if (this.resolvedTargetIds.has(targetId)) {
      return this._reject("DUPLICATE_INPUT");
    }
    if (!targetId || targetId !== target.id) {
      return this._reject("INVALID_TARGET");
    }

    const targetType = String(payload.targetType ?? "").toUpperCase();
    if (!DEBUFF_TARGET_TYPES.includes(targetType) || targetType !== target.type) {
      return this._reject("INVALID_TARGET_TYPE");
    }

    const position = payload.position;
    if (!position || typeof position !== "object" || Array.isArray(position)) {
      return this._reject("INVALID_POSITION");
    }

    const x = normalizeNumber(position.x);
    const y = normalizeNumber(position.y);
    if (x === null || y === null || x < 0 || x > 1 || y < 0 || y > 1) {
      return this._reject("INVALID_POSITION");
    }

    const timestampMs = payload.timestampMs === undefined || payload.timestampMs === null
      ? this.elapsedMs()
      : normalizeNumber(payload.timestampMs);

    if (timestampMs === null || timestampMs < 0) {
      return this._reject("INVALID_TIMESTAMP");
    }

    const response = this.battle.submitInput({
      targetId,
      x,
      y,
      timestampMs: Math.round(timestampMs)
    });

    this.lastResponse = response;

    if (response.accepted) {
      this.resolvedTargetIds.add(targetId);
      if (this.battle.currentPhase !== STUDENT_4V4_BATTLE_PHASE.DEBUFFER) {
        this.debufferStartedAt = null;
      }
    }

    return response;
  }

  reset() {
    this.debufferStartedAt = null;
    this.lastResponse = null;
    this.resolvedTargetIds.clear();
    return this;
  }

  getLastResponse() {
    return this.lastResponse;
  }

  isActive() {
    return this.battle.currentPhase === STUDENT_4V4_BATTLE_PHASE.DEBUFFER && this.debufferStartedAt !== null;
  }

  _reject(reason) {
    const response = rejection(reason, this.battle);
    this.lastResponse = response;
    return response;
  }
}
