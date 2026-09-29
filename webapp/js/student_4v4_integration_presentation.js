import { STUDENT_4V4_INTEGRATION_PHASE } from "./student_4v4_integration.js";

const ROLE_META = Object.freeze({ BUFFER: "energyContribution", HEALER: "protectionContribution", DEBUFFER: "disruptionContribution", BATTER: "impactContribution" });

export function buildStudent4v4IntegrationPresentationModel(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new TypeError("snapshot required");
  const result = snapshot.combinedResult;
  return Object.freeze({
    phase: snapshot.phase,
    seed: snapshot.seed,
    currentRole: snapshot.phase === STUDENT_4V4_INTEGRATION_PHASE.RESULT ? null : snapshot.phase,
    roles: Object.freeze(Object.keys(ROLE_META).map((role) => Object.freeze({
      role,
      completed: Boolean(snapshot.roleResults?.[role]),
      contribution: result ? Number(result[ROLE_META[role]]) : 0,
      success: Boolean(snapshot.roleResults?.[role]?.success)
    }))),
    combinedScore: result?.combinedScore ?? 0,
    combinedAccuracy: result?.combinedAccuracy ?? 0,
    success: Boolean(result?.success),
    deterministic: snapshot.combatResult?.deterministic === true || snapshot.combinedResult?.deterministic === true
  });
}

export class Student4v4IntegrationPresentation {
  constructor(root) { if (!(root instanceof HTMLElement)) throw new TypeError("Student4v4IntegrationPresentation requires a root element"); this.root = root; }
  render(snapshot) {
    const model = buildStudent4v4IntegrationPresentationModel(snapshot);
    const cards = model.roles.map((entry) => '<article class="student4v4-role ' + (entry.completed ? "is-complete" : "") + '"><strong>' + entry.role + '</strong><span>' + (entry.completed ? "+" + entry.contribution : "READY") + '</span><small>' + (entry.completed ? (entry.success ? "SUCCESS" : "FAILED") : "PENDING") + '</small></article>').join("");
    const current = model.currentRole ? "CURRENT ROLE <b>" + model.currentRole + "</b>" : "COMBINED RESULT";
    this.root.innerHTML = '<section class="student4v4-card" aria-label="Student 4v4 Integration"><span class="student4v4-kicker">STUDENT 4V4 // INTEGRATION</span><h1>TEAM COMBAT FLOW</h1><div class="student4v4-current">' + current + '</div><div class="student4v4-role-grid">' + cards + '</div><div class="student4v4-flow">PLAYER INPUT → ROLE RESULT → ORCHESTRATOR → COMBAT RESULT</div><div class="student4v4-result-grid"><span>SCORE <b>' + model.combinedScore + '</b></span><span>ACCURACY <b>' + model.combinedAccuracy + '%</b></span><span>SEED <b>' + model.seed + '</b></span></div><div class="student4v4-status">' + model.phase + '</div></section>';
  }
}
