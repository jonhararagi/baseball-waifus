import { BufferEnergyCreator } from "./buffer_energy_creator.js";
import { HealerDefensiveSupport } from "./healer_defensive_support.js";
import { DebufferDisruptor } from "./debuffer_disruptor.js";
import { BatterLeader } from "./batter_leader.js";
import { Student4v4Orchestrator, STUDENT_4V4_ROLE_ORDER } from "./student_4v4_orchestrator.js";
import { student4v4ResultToCombatResult } from "./student_4v4_combat_adapter.js";

export const STUDENT_4V4_BATTLE_PHASE = Object.freeze({
  INIT: "INIT",
  BUFFER: "BUFFER",
  HEALER: "HEALER",
  DEBUFFER: "DEBUFFER",
  BATTER: "BATTER",
  RESOLUTION: "RESOLUTION",
  COMPLETE: "COMPLETE"
});

const ROLE_CLASSES = Object.freeze({
  BUFFER: BufferEnergyCreator,
  HEALER: HealerDefensiveSupport,
  DEBUFFER: DebufferDisruptor,
  BATTER: BatterLeader
});

const ROLE_CONTRIBUTION_FIELDS = Object.freeze({
  BUFFER: "energy_points",
  HEALER: "protectedPoints",
  DEBUFFER: "disruptionPoints",
  BATTER: "impactPoints"
});

function deepFreezeClone(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  const clone = JSON.parse(JSON.stringify(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

function validateRoleResult(role, result, expectedSeed) {
  if (!result || typeof result !== "object" || result.type !== "ROLE_RESULT" || result.role !== role) {
    throw new TypeError(`INVALID_ROLE_RESULT:${role}`);
  }
  if (String(result.seed) !== expectedSeed) throw new TypeError(`MISMATCHED_SEED:${role}`);
  if (result.deterministic !== true) throw new TypeError(`INVALID_ROLE_RESULT:${role}:NON_DETERMINISTIC`);
  if (typeof result.success !== "boolean") throw new TypeError(`INVALID_ROLE_RESULT:${role}:SUCCESS`);
  if (!Number.isFinite(Number(result.score)) || !Number.isFinite(Number(result.accuracy))) {
    throw new TypeError(`INVALID_ROLE_RESULT:${role}:SCORE`);
  }
  const contribution = ROLE_CONTRIBUTION_FIELDS[role];
  if (!Number.isFinite(Number(result[contribution]))) {
    throw new TypeError(`INVALID_ROLE_RESULT:${role}:CONTRIBUTION`);
  }
}

function phaseForRoleIndex(index) {
  return STUDENT_4V4_ROLE_ORDER[index] || STUDENT_4V4_BATTLE_PHASE.RESOLUTION;
}

export class Student4v4BattleState {
  constructor({ seed = "STUDENT-4V4-STATE-001", battleId = null, team = null } = {}) {
    this.seed = String(seed);
    this.battleId = battleId == null ? `student-4v4-${this.seed}` : String(battleId);
    this.team = deepFreezeClone(team);
    this.reset();
  }

  reset() {
    this.roles = Object.fromEntries(
      STUDENT_4V4_ROLE_ORDER.map((role) => [role, new ROLE_CLASSES[role]({ seed: this.seed })])
    );
    this.currentPhase = STUDENT_4V4_BATTLE_PHASE.INIT;
    this.phaseIndex = 0;
    this.started = false;
    this.completed = false;
    this.resolved = false;
    this.roleResults = {};
    this.student4v4Result = null;
    this.combatResult = null;
    return this.snapshot();
  }

  start() {
    if (this.completed) throw new Error("ALREADY_COMPLETED");
    if (this.started) throw new Error("ALREADY_STARTED");
    if (this.currentPhase !== STUDENT_4V4_BATTLE_PHASE.INIT) throw new Error("INVALID_PHASE");
    this.started = true;
    this._transitionTo(STUDENT_4V4_BATTLE_PHASE.BUFFER, 0);
    return this.snapshot();
  }

  getCurrentRoleGame() {
    if (!this.started || this.currentPhase === STUDENT_4V4_BATTLE_PHASE.INIT || this.currentPhase === STUDENT_4V4_BATTLE_PHASE.RESOLUTION || this.currentPhase === STUDENT_4V4_BATTLE_PHASE.COMPLETE) {
      return null;
    }
    return this.roles[this.currentPhase] || null;
  }

  submitInput(input = {}) {
    if (!this.started) throw new Error("INVALID_PHASE");
    if (this.completed) throw new Error("ALREADY_COMPLETED");
    if (this.currentPhase === STUDENT_4V4_BATTLE_PHASE.RESOLUTION) throw new Error("INVALID_PHASE");

    const role = this.getCurrentRoleGame();
    if (!role) throw new Error("INVALID_PHASE");
    const response = role.submitInput(input);
    if (response.accepted && response.result) {
      this.submitRoleResult(this.currentPhase, response.result);
    }
    return response;
  }

  submitRoleResult(role, result) {
    if (this.completed) throw new Error("ALREADY_COMPLETED");
    if (this.roleResults[role]) throw new Error(`DUPLICATE_ROLE_RESULT:${role}`);
    if (!this.started || this.currentPhase === STUDENT_4V4_BATTLE_PHASE.INIT) throw new Error("INVALID_PHASE");
    if (this.currentPhase === STUDENT_4V4_BATTLE_PHASE.RESOLUTION) throw new Error("INVALID_PHASE");
    if (role !== this.currentPhase) throw new Error("INVALID_PHASE");

    validateRoleResult(role, result, this.seed);
    this.roleResults[role] = deepFreezeClone(result);

    const nextIndex = this.phaseIndex + 1;
    if (nextIndex < STUDENT_4V4_ROLE_ORDER.length) {
      this._transitionTo(phaseForRoleIndex(nextIndex), nextIndex);
    } else {
      this._transitionTo(STUDENT_4V4_BATTLE_PHASE.RESOLUTION, nextIndex);
    }
    return this.snapshot();
  }

  resolve() {
    if (this.resolved) throw new Error("ALREADY_RESOLVED");
    if (!this.started) throw new Error("INVALID_PHASE");
    if (this.completed) throw new Error("ALREADY_COMPLETED");
    if (this.currentPhase !== STUDENT_4V4_BATTLE_PHASE.RESOLUTION) {
      throw new Error("MISSING_ROLE_RESULT");
    }

    for (const role of STUDENT_4V4_ROLE_ORDER) {
      if (!this.roleResults[role]) throw new Error(`MISSING_ROLE_RESULT:${role}`);
    }

    const orchestrator = new Student4v4Orchestrator({ seed: this.seed, team: this.team });
    this.student4v4Result = orchestrator.resolve(this.roleResults);
    this.combatResult = student4v4ResultToCombatResult(this.student4v4Result);
    this.resolved = true;
    this.completed = true;
    this._transitionTo(STUDENT_4V4_BATTLE_PHASE.COMPLETE, STUDENT_4V4_ROLE_ORDER.length + 1);
    return this.snapshot();
  }

  advance() {
    if (!this.started) throw new Error("INVALID_PHASE");
    if (this.completed) throw new Error("ALREADY_COMPLETED");
    if (this.currentPhase === STUDENT_4V4_BATTLE_PHASE.RESOLUTION) return this.resolve();
    throw new Error(`INVALID_PHASE:${this.currentPhase}`);
  }

  snapshot() {
    return deepFreezeClone({
      battleId: this.battleId,
      seed: this.seed,
      currentPhase: this.currentPhase,
      phaseIndex: this.phaseIndex,
      started: this.started,
      completed: this.completed,
      resolved: this.resolved,
      deterministic: true,
      roleResults: this.roleResults,
      student4v4Result: this.student4v4Result,
      combatResult: this.combatResult
    });
  }

  _transitionTo(phase, phaseIndex) {
    const allowed = Object.values(STUDENT_4V4_BATTLE_PHASE);
    if (!allowed.includes(phase)) throw new Error("INVALID_PHASE");
    this.currentPhase = phase;
    this.phaseIndex = phaseIndex;
  }
}
