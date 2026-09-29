import { COMBAT_RESULT_TYPE } from "./combat_core.js";

export function batterRoleResultToCombatResult(roleResult, { turn = 1 } = {}) {
  if (!roleResult || roleResult.type !== "ROLE_RESULT" || roleResult.role !== "BATTER") {
    throw new TypeError("batterRoleResultToCombatResult requires a BATTER ROLE_RESULT");
  }

  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: "ROLE",
    outcome: roleResult.success ? "BATTER_IMPACT" : "BATTER_MISS",
    role: "BATTER",
    turn: Math.max(1, Math.trunc(Number(turn) || 1)),
    grade: roleResult.timingTier,
    score: Number(roleResult.score) || 0,
    accuracy: Number(roleResult.accuracy) || 0,
    impact_points: Math.max(0, Number(roleResult.impactPoints) || 0),
    timing_tier: roleResult.timingTier,
    success: Boolean(roleResult.success),
    deterministic: roleResult.deterministic === true,
    role_result: roleResult
  });
}
