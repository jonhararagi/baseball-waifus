import { STUDENT_4V4_BATTLE_PHASE } from "./student_4v4_battle_state.js";

export const STUDENT_4V4_BATTLE_PRESENTATION_PHASES = Object.freeze([
  STUDENT_4V4_BATTLE_PHASE.INIT,
  STUDENT_4V4_BATTLE_PHASE.BUFFER,
  STUDENT_4V4_BATTLE_PHASE.HEALER,
  STUDENT_4V4_BATTLE_PHASE.DEBUFFER,
  STUDENT_4V4_BATTLE_PHASE.BATTER,
  STUDENT_4V4_BATTLE_PHASE.RESOLUTION,
  STUDENT_4V4_BATTLE_PHASE.COMPLETE
]);

export function buildStudent4v4BattleStatePresentationModel(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new TypeError("buildStudent4v4BattleStatePresentationModel requires a battle snapshot");
  }
  if (!STUDENT_4V4_BATTLE_PRESENTATION_PHASES.includes(snapshot.currentPhase)) {
    throw new TypeError("INVALID_BATTLE_PHASE");
  }

  const roles = ["BUFFER", "HEALER", "DEBUFFER", "BATTER"].map((role) => Object.freeze({
    role,
    active: snapshot.currentPhase === role,
    completed: Boolean(snapshot.roleResults?.[role])
  }));

  return Object.freeze({
    title: "STUDENT 4V4 BATTLE",
    battleId: snapshot.battleId,
    seed: snapshot.seed,
    phase: snapshot.currentPhase,
    phaseIndex: snapshot.phaseIndex,
    started: snapshot.started,
    completed: snapshot.completed,
    resolved: snapshot.resolved,
    roles: Object.freeze(roles),
    hasStudent4v4Result: Boolean(snapshot.student4v4Result),
    hasCombatResult: Boolean(snapshot.combatResult),
    deterministic: snapshot.deterministic === true
  });
}
