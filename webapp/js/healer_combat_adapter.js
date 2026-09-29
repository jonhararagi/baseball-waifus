import { COMBAT_RESULT_TYPE } from "./combat_core.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function healerRoleResultToCombatResult(roleResult, {
  shieldBefore = 0,
  shieldMax = 100,
  turn = 1
} = {}) {
  if (!roleResult || roleResult.type !== "ROLE_RESULT" || roleResult.role !== "HEALER") {
    throw new TypeError("healerRoleResultToCombatResult requires a HEALER ROLE_RESULT");
  }

  const max = Math.max(1, Number(shieldMax) || 100);
  const before = clamp(Number(shieldBefore) || 0, 0, max);
  const delta = Math.max(0, Number(roleResult.protectedPoints) || 0);
  const after = clamp(before + delta, 0, max);

  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: "ROLE",
    outcome: "DEFENSE_PROTECTED",
    role: "HEALER",
    turn: Math.max(1, Math.trunc(Number(turn) || 1)),
    grade: roleResult.healingTier,
    score: Number(roleResult.score) || 0,
    accuracy: Number(roleResult.accuracy) || 0,
    shield_delta: after - before,
    shield_before: before,
    shield_after: after,
    success: Boolean(roleResult.success),
    deterministic: roleResult.deterministic === true,
    role_result: roleResult
  });
}
