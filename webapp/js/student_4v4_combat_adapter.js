import { COMBAT_RESULT_TYPE } from "./combat_core.js";
import { STUDENT_4V4_RESULT_TYPE } from "./student_4v4_orchestrator.js";

export function student4v4ResultToCombatResult(result, { turn = 1 } = {}) {
  if (!result || result.type !== STUDENT_4V4_RESULT_TYPE || result.deterministic !== true) {
    throw new TypeError("student4v4ResultToCombatResult requires a deterministic STUDENT_4V4_RESULT");
  }

  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: "STUDENT_4V4",
    outcome: result.success ? "STUDENT_4V4_COMBINED" : "STUDENT_4V4_FAILED",
    role: "STUDENT_4V4",
    turn: Math.max(1, Math.trunc(Number(turn) || 1)),
    score: Number(result.combinedScore) || 0,
    accuracy: Number(result.combinedAccuracy) || 0,
    energy_contribution: Number(result.energyContribution) || 0,
    protection_contribution: Number(result.protectionContribution) || 0,
    disruption_contribution: Number(result.disruptionContribution) || 0,
    impact_contribution: Number(result.impactContribution) || 0,
    success: Boolean(result.success),
    deterministic: true,
    student_4v4_result: result
  });
}
