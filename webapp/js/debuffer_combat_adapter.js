import { COMBAT_RESULT_TYPE } from "./combat_core.js";

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export function debufferRoleResultToCombatResult(roleResult, { turn = 1 } = {}) {
  if (!roleResult || roleResult.type !== "ROLE_RESULT" || roleResult.role !== "DEBUFFER") {
    throw new TypeError("debufferRoleResultToCombatResult requires a DEBUFFER ROLE_RESULT");
  }

  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: "ROLE",
    outcome: "DISRUPTION_CAPTURED",
    role: "DEBUFFER",
    turn: Math.max(1, Math.trunc(Number(turn) || 1)),
    grade: roleResult.debuffTier,
    score: Number(roleResult.score) || 0,
    accuracy: Number(roleResult.accuracy) || 0,
    disruption_points: Math.max(0, Number(roleResult.disruptionPoints) || 0),
    debuff_tier: roleResult.debuffTier,
    success: Boolean(roleResult.success),
    deterministic: roleResult.deterministic === true,
    role_result: roleResult
  });
}
