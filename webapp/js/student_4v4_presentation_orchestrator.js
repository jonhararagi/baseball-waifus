import { STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";
import { STUDENT_4V4_BATTLE_PRESENTATION_PHASES } from "./student_4v4_battle_state_presentation.js";

const ROLE_ORDER = Object.freeze(["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);
const ROLE_PHASES = new Set(ROLE_ORDER);
const EVENT_TYPES = Object.freeze({
  BATTLE_STARTED: "BATTLE_STARTED",
  ROLE_STARTED: "ROLE_STARTED",
  ROLE_COMPLETED: "ROLE_COMPLETED",
  RESOLUTION_STARTED: "RESOLUTION_STARTED",
  BATTLE_COMPLETED: "BATTLE_COMPLETED",
  BATTLE_RESET: "BATTLE_RESET"
});

function cloneFreeze(value) {
  if (value === null || value === undefined || typeof value !== "object") return value;
  const clone = JSON.parse(JSON.stringify(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new TypeError("Student4v4PresentationOrchestrator requires a battle snapshot");
  }
  if (!STUDENT_4V4_BATTLE_PRESENTATION_PHASES.includes(snapshot.currentPhase)) {
    throw new TypeError("INVALID_BATTLE_PHASE");
  }
  if (typeof snapshot.seed !== "string") throw new TypeError("INVALID_BATTLE_SEED");
  if (!snapshot.roleResults || typeof snapshot.roleResults !== "object") {
    throw new TypeError("INVALID_ROLE_RESULTS");
  }
}

function roleStatus(snapshot, role) {
  return snapshot.roleResults[role] ? "completed" : snapshot.currentPhase === role ? "active" : "pending";
}

function buildRoles(snapshot) {
  return ROLE_ORDER.map((role) => Object.freeze({
    role,
    status: roleStatus(snapshot, role),
    active: snapshot.currentPhase === role,
    completed: Boolean(snapshot.roleResults[role])
  }));
}

export function buildStudent4v4PresentationSnapshot(snapshot) {
  validateSnapshot(snapshot);
  const activeRole = ROLE_PHASES.has(snapshot.currentPhase) ? snapshot.currentPhase : null;
  const completedRoles = ROLE_ORDER.filter((role) => Boolean(snapshot.roleResults[role]));

  return Object.freeze({
    type: "STUDENT_4V4_PRESENTATION_STATE",
    battleId: snapshot.battleId,
    seed: snapshot.seed,
    phase: snapshot.currentPhase,
    phaseIndex: snapshot.phaseIndex,
    started: Boolean(snapshot.started),
    completed: Boolean(snapshot.completed),
    resolved: Boolean(snapshot.resolved),
    activeRole,
    completedRoles: Object.freeze(completedRoles),
    roles: Object.freeze(buildRoles(snapshot)),
    roleResults: cloneFreeze(snapshot.roleResults),
    student4v4Result: cloneFreeze(snapshot.student4v4Result),
    combatResult: cloneFreeze(snapshot.combatResult),
    deterministic: snapshot.deterministic === true
  });
}

function deriveEvents(previous, current) {
  const events = [];
  if (!previous) {
    if (current.started) events.push({ type: EVENT_TYPES.BATTLE_STARTED, phase: current.phase });
    return events;
  }

  if (!previous.started && current.started) {
    events.push({ type: EVENT_TYPES.BATTLE_STARTED, phase: current.phase });
  }

  if (previous.activeRole !== current.activeRole && current.activeRole) {
    events.push({ type: EVENT_TYPES.ROLE_STARTED, role: current.activeRole });
  }

  for (const role of ROLE_ORDER) {
    if (!previous.completedRoles.includes(role) && current.completedRoles.includes(role)) {
      events.push({ type: EVENT_TYPES.ROLE_COMPLETED, role });
    }
  }

  if (previous.phase !== STUDENT_4V4_BATTLE_PHASE.RESOLUTION && current.phase === STUDENT_4V4_BATTLE_PHASE.RESOLUTION) {
    events.push({ type: EVENT_TYPES.RESOLUTION_STARTED, phase: current.phase });
  }

  if (!previous.completed && current.completed) {
    events.push({ type: EVENT_TYPES.BATTLE_COMPLETED, phase: current.phase });
  }

  if (previous.phase !== STUDENT_4V4_BATTLE_PHASE.INIT && current.phase === STUDENT_4V4_BATTLE_PHASE.INIT && !current.started) {
    events.push({ type: EVENT_TYPES.BATTLE_RESET, phase: current.phase });
  }

  return events;
}

export class Student4v4PresentationOrchestrator {
  constructor() {
    this.reset();
  }

  reset() {
    this.previousSnapshot = null;
    this.lastPresentation = null;
    return this;
  }

  update(snapshot) {
    const current = buildStudent4v4PresentationSnapshot(snapshot);
    const previous = this.lastPresentation;
    const events = deriveEvents(previous, current);
    this.previousSnapshot = cloneFreeze(snapshot);
    this.lastPresentation = current;
    return Object.freeze({
      presentation: current,
      events: cloneFreeze(events)
    });
  }

  build(snapshot) {
    return buildStudent4v4PresentationSnapshot(snapshot);
  }

  getSnapshot() {
    return this.lastPresentation;
  }
}

export { EVENT_TYPES as STUDENT_4V4_PRESENTATION_EVENT };
