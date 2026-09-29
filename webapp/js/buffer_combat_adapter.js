import { COMBAT_RESULT_TYPE } from "./combat_core.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function bufferRoleResultToCombatResult(roleResult, {
  energyBefore = 0,
  maxEnergy = 100,
  turn = 1
} = {}) {
  if (!roleResult || roleResult.type !== "ROLE_RESULT" || roleResult.role !== "BUFFER") {
    throw new TypeError("bufferRoleResultToCombatResult requires a BUFFER ROLE_RESULT");
  }

  const before = clamp(Number(energyBefore) || 0, 0, Number(maxEnergy) || 100);
  const cap = Math.max(1, Number(maxEnergy) || 100);
  const delta = Math.max(0, Number(roleResult.energy_points) || 0);
  const after = clamp(before + delta, 0, cap);

  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: "ROLE",
    outcome: "ENERGY_CREATED",
    role: "BUFFER",
    turn: Math.max(1, Math.trunc(Number(turn) || 1)),
    grade: roleResult.energy_tier,
    score: Number(roleResult.score) || 0,
    accuracy: Number(roleResult.accuracy) || 0,
    energy_delta: after - before,
    energy_before: before,
    energy_after: after,
    success: Boolean(roleResult.success),
    deterministic: roleResult.deterministic === true,
    role_result: roleResult
  });
}
