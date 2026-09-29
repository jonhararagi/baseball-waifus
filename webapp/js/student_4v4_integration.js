import { BufferEnergyCreator } from "./buffer_energy_creator.js";
import { HealerDefensiveSupport } from "./healer_defensive_support.js";
import { DebufferDisruptor } from "./debuffer_disruptor.js";
import { BatterLeader } from "./batter_leader.js";
import { Student4v4Orchestrator } from "./student_4v4_orchestrator.js";
import { student4v4ResultToCombatResult } from "./student_4v4_combat_adapter.js";
import { buildStudent4v4PresentationModel } from "./student_4v4_presentation.js";

export const STUDENT_4V4_INTEGRATION_PHASE = Object.freeze({ IDLE: "IDLE", BUFFER: "BUFFER", HEALER: "HEALER", DEBUFFER: "DEBUFFER", BATTER: "BATTER", RESULT: "RESULT" });

function cloneFreeze(value) { return Object.freeze(JSON.parse(JSON.stringify(value))); }
function roleSeed(seed) { return String(seed); }

export class Student4v4Integration {
  constructor({ seed = "STUDENT-4V4-001", team = null } = {}) { this.seed = String(seed); this.team = team ? cloneFreeze(team) : null; this.reset(); }
  reset() {
    this.roles = {
      BUFFER: new BufferEnergyCreator({ seed: roleSeed(this.seed) }),
      HEALER: new HealerDefensiveSupport({ seed: roleSeed(this.seed) }),
      DEBUFFER: new DebufferDisruptor({ seed: roleSeed(this.seed) }),
      BATTER: new BatterLeader({ seed: roleSeed(this.seed) })
    };
    this.roleResults = {}; this.phase = "IDLE"; this.combinedResult = null; this.combatResult = null; return this.snapshot();
  }
  start() { this.reset(); this.phase = "BUFFER"; return this.snapshot(); }
  getCurrentRole() { return this.roles[this.phase] || null; }
  submitInput(input = {}) {
    const role = this.getCurrentRole(); if (!role) throw new Error("NO_ACTIVE_ROLE");
    const response = role.submitInput(input);
    if (response.accepted && response.result) this.roleResults[this.phase] = response.result;
    return response;
  }
  completeCurrentRolePerfect() {
    const role = this.getCurrentRole(); if (!role) throw new Error("NO_ACTIVE_ROLE");
    while (!role.getState().completed) {
      const state = role.getState();
      const current = state.current_note || state.current_threat || state.current_target || state.current_opportunity;
      if (!current) throw new Error("NO_ACTIVE_TARGET");
      let input;
      if (this.phase === "BUFFER") input = { noteId: current.id, timestampMs: current.target_ms };
      else if (this.phase === "HEALER") input = { threatId: current.id, zone: current.zone, timestampMs: current.target_ms };
      else if (this.phase === "DEBUFFER") input = { targetId: current.id, x: current.x, y: current.y, timestampMs: current.target_ms };
      else input = { opportunityId: current.id, timestampMs: current.target_ms };
      const response = this.submitInput(input); if (!response.accepted) throw new Error("DETERMINISTIC_INPUT_REJECTED:" + response.reason);
    }
    return this.advance();
  }
  advance() {
    if (this.phase === "IDLE") return this.start();
    if (this.phase === "BUFFER") { if (!this.roleResults.BUFFER) throw new Error("BUFFER_NOT_COMPLETE"); this.phase = "HEALER"; }
    else if (this.phase === "HEALER") { if (!this.roleResults.HEALER) throw new Error("HEALER_NOT_COMPLETE"); this.phase = "DEBUFFER"; }
    else if (this.phase === "DEBUFFER") { if (!this.roleResults.DEBUFFER) throw new Error("DEBUFFER_NOT_COMPLETE"); this.phase = "BATTER"; }
    else if (this.phase === "BATTER") {
      if (!this.roleResults.BATTER) throw new Error("BATTER_NOT_COMPLETE");
      const orchestrator = new Student4v4Orchestrator({ seed: this.seed, team: this.team });
      this.combinedResult = orchestrator.resolve(this.roleResults);
      this.combatResult = student4v4ResultToCombatResult(this.combinedResult); this.phase = "RESULT";
    }
    return this.snapshot();
  }
  getPresentationModel() { return this.combinedResult ? buildStudent4v4PresentationModel(this.combinedResult) : null; }
  snapshot() {
    const role = this.getCurrentRole();
    return cloneFreeze({ phase: this.phase, seed: this.seed, roleState: role ? role.getState() : null, roleResults: this.roleResults, combinedResult: this.combinedResult, combatResult: this.combatResult, presentation: this.getPresentationModel() });
  }
}
