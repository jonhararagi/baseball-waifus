import { buildStudent4v4RoleAdapterModels } from "./student_4v4_role_adapters.js";

const ROLE_ORDER = Object.freeze(["BUFFER", "HEALER", "DEBUFFER", "BATTER"]);

function freezeClone(value) {
  if (value === null || value === undefined || typeof value !== "object") return value;
  const clone = JSON.parse(JSON.stringify(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

function formatContribution(role, result) {
  if (!result) return "—";
  const fields = {
    BUFFER: "energy_points",
    HEALER: "protectedPoints",
    DEBUFFER: "disruptionPoints",
    BATTER: "impactPoints"
  };
  const value = Number(result[fields[role]]);
  return Number.isFinite(value) ? String(value) : "—";
}

export function buildStudent4v4UiModel(presentationView) {
  if (!presentationView?.presentation) throw new TypeError("PRESENTATION_VIEW_REQUIRED");
  const snapshot = presentationView.presentation;
  const adapters = buildStudent4v4RoleAdapterModels(snapshot);
  const result = snapshot.student4v4Result;

  const roles = ROLE_ORDER.map((role) => {
    const adapter = adapters[role];
    return Object.freeze({
      role,
      status: adapter.status,
      active: adapter.active,
      completed: adapter.completed,
      result: adapter.result,
      contribution: formatContribution(role, adapter.result)
    });
  });

  const activeAdapter = snapshot.activeRole ? adapters[snapshot.activeRole] : null;

  return Object.freeze({
    type: "STUDENT_4V4_UI_MODEL",
    battleId: snapshot.battleId,
    seed: snapshot.seed,
    phase: snapshot.phase,
    activeRole: snapshot.activeRole,
    started: snapshot.started,
    completed: snapshot.completed,
    resolved: snapshot.resolved,
    deterministic: snapshot.deterministic,
    roles: Object.freeze(roles),
    active: activeAdapter ? Object.freeze({
      role: activeAdapter.role,
      status: activeAdapter.status,
      result: activeAdapter.result,
      contribution: formatContribution(activeAdapter.role, activeAdapter.result)
    }) : null,
    resolution: result ? Object.freeze({
      combinedScore: result.combinedScore,
      combinedAccuracy: result.combinedAccuracy,
      energyContribution: result.energyContribution,
      protectionContribution: result.protectionContribution,
      disruptionContribution: result.disruptionContribution,
      impactContribution: result.impactContribution,
      success: result.success
    }) : null,
    student4v4Result: freezeClone(snapshot.student4v4Result),
    combatResult: freezeClone(snapshot.combatResult),
    events: freezeClone(presentationView.events || [])
  });
}

function statusLabel(status) {
  return status === "completed" ? "COMPLETED" : status === "active" ? "ACTIVE" : "PENDING";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class Student4v4IntegratedUi {
  constructor(root) {
    if (!root || typeof root !== "object") throw new TypeError("Student4v4IntegratedUi requires a root");
    this.root = root;
  }

  render(presentationView) {
    const model = buildStudent4v4UiModel(presentationView);
    const roleCards = model.roles.map((entry) =>
      '<article class="s4-role ' + (entry.active ? "is-active " : "") + (entry.completed ? "is-complete" : "") + '">' +
        '<div class="s4-role-top"><strong>' + entry.role + '</strong><span class="s4-status">' + statusLabel(entry.status) + '</span></div>' +
        '<small>' + (entry.completed ? "CONTRIBUTION +" + escapeHtml(entry.contribution) : entry.active ? "CURRENT ROLE" : "WAITING") + '</small>' +
      '</article>'
    ).join("");

    const active = model.active
      ? '<div class="s4-active-copy"><span class="s4-label">ACTIVE ROLE</span><strong>' + model.active.role + '</strong><span>' + statusLabel(model.active.status) + (model.active.result ? " · RESULT READY" : " · EXECUTE ROLE") + '</span></div>'
      : '<div class="s4-active-copy"><span class="s4-label">CURRENT PHASE</span><strong>' + model.phase + '</strong><span>' + (model.phase === "COMPLETE" ? "BATTLE COMPLETE" : "AWAITING START") + '</span></div>';

    const resolution = model.resolution
      ? '<section class="s4-section"><div class="s4-section-title">RESOLUTION</div><div class="s4-metrics">' +
          '<span>SCORE<b>' + escapeHtml(model.resolution.combinedScore) + '</b></span>' +
          '<span>ACCURACY<b>' + escapeHtml(model.resolution.combinedAccuracy) + '%</b></span>' +
          '<span>ENERGY<b>' + escapeHtml(model.resolution.energyContribution) + '</b></span>' +
          '<span>PROTECTION<b>' + escapeHtml(model.resolution.protectionContribution) + '</b></span>' +
          '<span>DISRUPTION<b>' + escapeHtml(model.resolution.disruptionContribution) + '</b></span>' +
          '<span>IMPACT<b>' + escapeHtml(model.resolution.impactContribution) + '</b></span>' +
        '</div></section>'
      : "";

    const complete = model.completed
      ? '<section class="s4-section s4-complete"><div class="s4-section-title">COMPLETE</div><strong>STUDENT 4V4 RESULT</strong><span>' + (model.student4v4Result?.success ? "SUCCESS" : "RESOLVED") + '</span><small>COMBAT RESULT: ' + escapeHtml(model.combatResult?.phase || "STUDENT_4V4") + '</small></section>'
      : "";

    const eventText = model.events.length
      ? model.events.map((event) => event.type + (event.role ? " / " + event.role : "")).join(" · ")
      : "NO PRESENTATION EVENTS";

    this.root.innerHTML =
      '<section class="s4-shell" aria-label="Student 4v4 integrated UI">' +
        '<header class="s4-header"><div><span class="s4-kicker">BASEWARRIORS // STUDENT 4V4</span><h1>TACTICAL BATTLE SURFACE</h1></div><div class="s4-phase">' + escapeHtml(model.phase) + '</div></header>' +
        '<div class="s4-meta"><span>BATTLE <b>' + escapeHtml(model.battleId) + '</b></span><span>SEED <b>' + escapeHtml(model.seed) + '</b></span><span>PHASE <b>' + escapeHtml(model.phase) + '</b></span></div>' +
        '<section class="s4-section"><div class="s4-section-title">ROLE TRACKER</div><div class="s4-roles">' + roleCards + '</div></section>' +
        '<section class="s4-active">' + active + '<div class="s4-flow">BATTLE STATE → PRESENTATION SNAPSHOT → ROLE ADAPTERS → UI</div></section>' +
        '<section class="s4-section"><div class="s4-section-title">ACTIVE ROLE PANEL</div><div class="s4-panel-copy">' + (model.active ? "Presentation data is sourced from the active Role Adapter. No gameplay is calculated here." : "No active role.") + '</div></section>' +
        resolution + complete +
        '<div class="s4-events">EVENTS · ' + escapeHtml(eventText) + '</div>' +
      '</section>';

    return model;
  }
}
