export const STUDENT_4V4_RESULT_TYPE = "STUDENT_4V4_RESULT";
export const STUDENT_4V4_ROLE_ORDER = Object.freeze(["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);

const ROLE_CONTRACTS = Object.freeze({
  BUFFER: "energy_points",
  HEALER: "protectedPoints",
  DEBUFFER: "disruptionPoints",
  BATTER: "impactPoints"
});

function cloneAndFreeze(value) {
  if (value === undefined) return undefined;
  return Object.freeze(JSON.parse(JSON.stringify(value)));
}

function finiteNumber(value, field, role) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`Invalid ${field} in ${role} ROLE_RESULT`);
  }
  return number;
}

function validateRoleResult(roleResult, expectedRole, expectedSeed) {
  if (!roleResult || typeof roleResult !== "object") {
    throw new TypeError(`INVALID_ROLE_RESULT:${expectedRole}`);
  }
  if (roleResult.type !== "ROLE_RESULT" || roleResult.role !== expectedRole) {
    throw new TypeError(`INVALID_ROLE_RESULT:${expectedRole}`);
  }
  if (String(roleResult.seed) !== expectedSeed) {
    throw new TypeError(`MISMATCHED_SEED:${expectedRole}`);
  }
  if (roleResult.deterministic !== true) {
    throw new TypeError(`INVALID_ROLE_RESULT:${expectedRole}:NON_DETERMINISTIC`);
  }
  if (typeof roleResult.success !== "boolean") {
    throw new TypeError(`INVALID_ROLE_RESULT:${expectedRole}:SUCCESS`);
  }
  finiteNumber(roleResult.score, "score", expectedRole);
  finiteNumber(roleResult.accuracy, "accuracy", expectedRole);
  finiteNumber(roleResult[ROLE_CONTRACTS[expectedRole]], ROLE_CONTRACTS[expectedRole], expectedRole);
}

export function validateStudent4v4RoleResults(roleResults, expectedSeed = null) {
  if (!roleResults || typeof roleResults !== "object") {
    throw new TypeError("MISSING_ROLE_RESULT");
  }

  const entries = Array.isArray(roleResults)
    ? roleResults.map((result) => [result?.role, result])
    : Object.entries(roleResults);
  const seen = new Set();

  for (const [role, result] of entries) {
    if (!STUDENT_4V4_ROLE_ORDER.includes(role)) continue;
    if (seen.has(role)) throw new TypeError(`DUPLICATE_ROLE:${role}`);
    seen.add(role);
  }

  for (const role of STUDENT_4V4_ROLE_ORDER) {
    if (!seen.has(role)) throw new TypeError(`MISSING_ROLE_RESULT:${role}`);
  }

  const normalized = Object.fromEntries(
    STUDENT_4V4_ROLE_ORDER.map((role) => {
      const result = Array.isArray(roleResults)
        ? roleResults.find((entry) => entry?.role === role)
        : roleResults[role];
      return [role, result];
    })
  );

  const seed = expectedSeed == null ? String(normalized.BUFFER.seed) : String(expectedSeed);
  for (const role of STUDENT_4V4_ROLE_ORDER) {
    validateRoleResult(normalized[role], role, seed);
  }

  return Object.freeze({
    seed,
    bufferResult: normalized.BUFFER,
    healerResult: normalized.HEALER,
    debufferResult: normalized.DEBUFFER,
    batterResult: normalized.BATTER
  });
}

function averageAccuracy(results) {
  const total = STUDENT_4V4_ROLE_ORDER.reduce((sum, role) => sum + Number(results[`${role.toLowerCase()}Result`].accuracy), 0);
  return Math.round(total / STUDENT_4V4_ROLE_ORDER.length);
}

function resolveCombinedResult({ seed, team = null, bufferResult, healerResult, debufferResult, batterResult }) {
  const combinedScore = [bufferResult, healerResult, debufferResult, batterResult]
    .reduce((sum, result) => sum + Number(result.score), 0);
  const energyContribution = Math.max(0, Number(bufferResult.energy_points));
  const protectionContribution = Math.max(0, Number(healerResult.protectedPoints));
  const disruptionContribution = Math.max(0, Number(debufferResult.disruptionPoints));
  const impactContribution = Math.max(0, Number(batterResult.impactPoints));

  return Object.freeze({
    type: STUDENT_4V4_RESULT_TYPE,
    seed,
    team: cloneAndFreeze(team),
    resolution_order: STUDENT_4V4_ROLE_ORDER,
    bufferResult: cloneAndFreeze(bufferResult),
    healerResult: cloneAndFreeze(healerResult),
    debufferResult: cloneAndFreeze(debufferResult),
    batterResult: cloneAndFreeze(batterResult),
    combinedScore,
    combinedAccuracy: averageAccuracy({ bufferResult, healerResult, debufferResult, batterResult }),
    energyContribution,
    protectionContribution,
    disruptionContribution,
    impactContribution,
    success: Boolean(
      bufferResult.success || healerResult.success || debufferResult.success || batterResult.success
    ),
    deterministic: true
  });
}

export class Student4v4Orchestrator {
  constructor({ seed = null, team = null } = {}) {
    this.seed = seed == null ? null : String(seed);
    this.team = cloneAndFreeze(team);
    this.resolved = false;
    this.result = null;
  }

  resolve(roleResults) {
    if (this.resolved) throw new Error("ALREADY_RESOLVED");

    const validated = validateStudent4v4RoleResults(roleResults, this.seed);
    this.seed = validated.seed;
    this.result = resolveCombinedResult({ ...validated, team: this.team });
    this.resolved = true;
    return this.result;
  }

  reset() {
    this.resolved = false;
    this.result = null;
    return this;
  }

  getResult() {
    return this.result;
  }
}
