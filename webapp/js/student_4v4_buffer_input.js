import { BUFFER_LANES } from "./buffer_energy_creator.js";

function defaultClock() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return 0;
}

function snapshotOf(battle) {
  return battle.snapshot();
}

export class Student4v4BufferInput {
  constructor({ battle, clock = defaultClock } = {}) {
    if (!battle || typeof battle.submitInput !== "function" || typeof battle.snapshot !== "function") {
      throw new TypeError("Student4v4BufferInput requires a Student4v4BattleState");
    }
    if (typeof clock !== "function") {
      throw new TypeError("Student4v4BufferInput requires a clock function");
    }

    this.battle = battle;
    this.clock = clock;
    this.bufferStartedAt = null;
    this.lastResponse = null;
  }

  start() {
    if (this.battle.currentPhase === "INIT") {
      this.battle.start();
      this.bufferStartedAt = Number(this.clock());
      this.lastResponse = null;
      return snapshotOf(this.battle);
    }

    if (this.battle.currentPhase === "BUFFER" && this.bufferStartedAt !== null) {
      return snapshotOf(this.battle);
    }

    return snapshotOf(this.battle);
  }

  elapsedMs(now = this.clock()) {
    if (this.bufferStartedAt === null) return 0;
    const current = Number(now);
    if (!Number.isFinite(current)) return 0;
    return Math.max(0, Math.round(current - this.bufferStartedAt));
  }

  submitLane(lane, timestampMs = null) {
    if (this.battle.currentPhase !== "BUFFER") {
      const response = Object.freeze({
        accepted: false,
        reason: "INVALID_PHASE",
        state: snapshotOf(this.battle)
      });
      this.lastResponse = response;
      return response;
    }

    const normalizedLane = String(lane ?? "").toUpperCase();
    if (!BUFFER_LANES.includes(normalizedLane)) {
      const response = Object.freeze({
        accepted: false,
        reason: "INVALID_LANE",
        state: snapshotOf(this.battle)
      });
      this.lastResponse = response;
      return response;
    }

    const state = this.battle.getCurrentRoleGame()?.getState?.();
    const note = state?.current_note;
    if (!note || this.bufferStartedAt === null) {
      const response = Object.freeze({
        accepted: false,
        reason: "NO_ACTIVE_BUFFER",
        state: snapshotOf(this.battle)
      });
      this.lastResponse = response;
      return response;
    }

    const relativeTimestamp = timestampMs === null
      ? this.elapsedMs()
      : Number(timestampMs);

    if (!Number.isFinite(relativeTimestamp)) {
      const response = Object.freeze({
        accepted: false,
        reason: "INVALID_TIMESTAMP",
        state: snapshotOf(this.battle)
      });
      this.lastResponse = response;
      return response;
    }

    const response = this.battle.submitInput({
      noteId: note.id,
      lane: normalizedLane,
      timestampMs: Math.round(relativeTimestamp)
    });

    this.lastResponse = response;
    if (response.accepted && this.battle.currentPhase !== "BUFFER") {
      this.bufferStartedAt = null;
    }
    return response;
  }

  reset() {
    this.bufferStartedAt = null;
    this.lastResponse = null;
    return this;
  }

  getLastResponse() {
    return this.lastResponse;
  }
}
