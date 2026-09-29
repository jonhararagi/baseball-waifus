const ROLE_ORDER = Object.freeze(["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);
const VALID_STATUS = Object.freeze(["pending", "active", "completed"]);

function cloneFreeze(value) {
  if (value === undefined || value === null || typeof value !== "object") return value;
  const clone = JSON.parse(JSON.stringify(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

function validatePresentationSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new TypeError("INVALID_PRESENTATION_SNAPSHOT");
  }
  if (snapshot.type !== "STUDENT_4V4_PRESENTATION_STATE") {
    throw new TypeError("INVALID_PRESENTATION_SNAPSHOT_TYPE");
  }
  if (!Array.isArray(snapshot.roles)) {
    throw new TypeError("INVALID_PRESENTATION_ROLES");
  }
  if (!snapshot.roleResults || typeof snapshot.roleResults !== "object" || Array.isArray(snapshot.roleResults)) {
    throw new TypeError("INVALID_PRESENTATION_ROLE_RESULTS");
  }
  if (!["INIT", "BUFFER", "HEALER", "DEBUFFER", "BATTER", "RESOLUTION", "COMPLETE"].includes(snapshot.phase)) {
    throw new TypeError("INVALID_PRESENTATION_STATE");
  }
}

function findRoleEntry(snapshot, role) {
  const entry = snapshot.roles.find((candidate) => candidate?.role === role);
  if (!entry) throw new TypeError(`MISSING_ROLE:${role}`);
  if (!VALID_STATUS.includes(entry.status)) {
    throw new TypeError(`INVALID_ROLE_STATUS:${role}`);
  }
  if (typeof entry.active !== "boolean" || typeof entry.completed !== "boolean") {
    throw new TypeError(`INVALID_ROLE_FLAGS:${role}`);
  }
  return entry;
}

function validateRoleResult(role, result) {
  if (result === undefined || result === null) return null;
  if (typeof result !== "object") throw new TypeError(`INVALID_ROLE_RESULT:${role}`);
  if (result.type !== "ROLE_RESULT" || result.role !== role) {
    throw new TypeError(`INVALID_ROLE_RESULT:${role}`);
  }
  if (typeof result.success !== "boolean" || result.deterministic !== true) {
    throw new TypeError(`INVALID_ROLE_RESULT_FLAGS:${role}`);
  }
  return result;
}

function buildAdapter(snapshot, role) {
  validatePresentationSnapshot(snapshot);
  if (!ROLE_ORDER.includes(role)) throw new TypeError(`UNKNOWN_ROLE:${role}`);

  const entry = findRoleEntry(snapshot, role);
  const rawResult = snapshot.roleResults[role];

  if (entry.completed && (rawResult === undefined || rawResult === null)) {
    throw new TypeError(`MISSING_ROLE_RESULT:${role}`);
  }

  const result = validateRoleResult(role, rawResult);
  const output = {
    role,
    status: entry.status,
    active: entry.active,
    completed: entry.completed,
    result: result ? cloneFreeze(result) : null,
    displayState: Object.freeze({
      status: entry.status,
      active: entry.active,
      completed: entry.completed,
      hasResult: Boolean(result)
    })
  };

  return Object.freeze(output);
}

export function buildStudent4v4RoleAdapter(snapshot, role) {
  return buildAdapter(snapshot, role);
}

export function buildBufferPresentationAdapter(snapshot) {
  return buildAdapter(snapshot, "BUFFER");
}

export function buildHealerPresentationAdapter(snapshot) {
  return buildAdapter(snapshot, "HEALER");
}

export function buildDebufferPresentationAdapter(snapshot) {
  return buildAdapter(snapshot, "DEBUFFER");
}

export function buildBatterPresentationAdapter(snapshot) {
  return buildAdapter(snapshot, "BATTER");
}

export function buildStudent4v4RoleAdapterModels(snapshot) {
  return Object.freeze({
    BUFFER: buildBufferPresentationAdapter(snapshot),
    HEALER: buildHealerPresentationAdapter(snapshot),
    DEBUFFER: buildDebufferPresentationAdapter(snapshot),
    BATTER: buildBatterPresentationAdapter(snapshot)
  });
}

export { ROLE_ORDER as STUDENT_4V4_ROLE_ADAPTER_ORDER };
