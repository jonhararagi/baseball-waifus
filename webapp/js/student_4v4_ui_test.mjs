import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator } from "./student_4v4_presentation_orchestrator.js";
import { Student4v4IntegratedUi, buildStudent4v4UiModel } from "./student_4v4_ui.js";

const ROLES = ["BUFFER", "HEALER", "DEBUFFER", "BATTER"];

function perfectInput(battle) {
  const state = battle.getCurrentRoleGame().getState();
  if (battle.currentPhase === "BUFFER") return { noteId: state.current_note.id, timestampMs: state.current_note.target_ms };
  if (battle.currentPhase === "HEALER") return { threatId: state.current_threat.id, zone: state.current_threat.zone, timestampMs: state.current_threat.target_ms };
  if (battle.currentPhase === "DEBUFFER") return { targetId: state.current_target.id, x: state.current_target.x, y: state.current_target.y, timestampMs: state.current_target.target_ms };
  return { opportunityId: state.current_opportunity.id, timestampMs: state.current_opportunity.target_ms };
}

function viewFor(battle, presentation) {
  return presentation.update(battle.snapshot());
}

function completeRole(battle, presentation) {
  const role = battle.currentPhase;
  while (battle.currentPhase === role) {
    assert.equal(battle.submitInput(perfectInput(battle)).accepted, true);
    viewFor(battle, presentation);
  }
}

const battle = new Student4v4BattleState({ seed: "T046-UI-001", battleId: "ui-battle-001" });
const presentation = new Student4v4PresentationOrchestrator();
const root = { innerHTML: "" };
const ui = new Student4v4IntegratedUi(root);

let view = viewFor(battle, presentation);
let model = ui.render(view);
assert.equal(model.phase, "INIT");
assert.deepEqual(model.roles.map((r) => r.status), ["pending", "pending", "pending", "pending"]);
assert.equal(model.activeRole, null);
assert.match(root.innerHTML, /ROLE TRACKER/);
assert.match(root.innerHTML, /RENDER/ === true ? /./ : /ROLE TRACKER/);

battle.start();
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.activeRole, "BUFFER");
assert.deepEqual(model.roles.map((r) => r.status), ["active", "pending", "pending", "pending"]);
assert.match(root.innerHTML, /BUFFER/);

completeRole(battle, presentation);
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.activeRole, "HEALER");
assert.deepEqual(model.roles.map((r) => r.status), ["completed", "active", "pending", "pending"]);

completeRole(battle, presentation);
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.activeRole, "DEBUFFER");

completeRole(battle, presentation);
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.activeRole, "BATTER");

completeRole(battle, presentation);
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.phase, "RESOLUTION");
assert.equal(model.activeRole, null);
assert.equal(model.resolution, null);

const gameplayBeforeResolution = JSON.stringify(battle.snapshot());
battle.resolve();
view = viewFor(battle, presentation);
model = ui.render(view);
assert.equal(model.phase, "COMPLETE");
assert.equal(model.completed, true);
assert.equal(model.resolution.combinedScore, battle.snapshot().student4v4Result.combinedScore);
assert.equal(model.resolution.combinedAccuracy, battle.snapshot().student4v4Result.combinedAccuracy);
assert.equal(model.student4v4Result.type, "STUDENT_4V4_RESULT");
assert.equal(model.combatResult.type, "COMBAT_RESULT");
assert.match(root.innerHTML, /COMPLETE/);
assert.match(root.innerHTML, /STUDENT 4V4 RESULT/);

const gameplayAfterUi = JSON.stringify(battle.snapshot());
assert.equal(gameplayAfterUi !== gameplayBeforeResolution, true);

const resultBefore = JSON.stringify(battle.snapshot().student4v4Result);
ui.render(view);
assert.equal(JSON.stringify(battle.snapshot().student4v4Result), resultBefore);

const modelA = buildStudent4v4UiModel(view);
const modelB = buildStudent4v4UiModel(view);
assert.deepEqual(modelA, modelB);
assert.equal(modelA.deterministic, true);

for (const role of ROLES) {
  assert.equal(modelA.roles.find((entry) => entry.role === role).completed, true);
  assert.equal(modelA.roles.find((entry) => entry.role === role).status, "completed");
}

const initialSnapshot = battle.snapshot();
assert.throws(() => { modelA.phase = "BUFFER"; }, TypeError);
assert.throws(() => { modelA.roles[0].status = "active"; }, TypeError);
assert.equal(JSON.stringify(battle.snapshot()), JSON.stringify(initialSnapshot));

const secondBattle = new Student4v4BattleState({ seed: "T046-DET" });
const secondPresentation = new Student4v4PresentationOrchestrator();
secondPresentation.update(secondBattle.snapshot());
secondBattle.start();
secondPresentation.update(secondBattle.snapshot());
while (secondBattle.currentPhase !== "RESOLUTION") {
  completeRole(secondBattle, secondPresentation);
}
secondBattle.resolve();
const secondView = secondPresentation.update(secondBattle.snapshot());
assert.deepEqual(buildStudent4v4UiModel(secondView), buildStudent4v4UiModel(secondView));

const resetBattle = new Student4v4BattleState({ seed: "T046-RESET" });
const resetPresentation = new Student4v4PresentationOrchestrator();
resetPresentation.update(resetBattle.snapshot());
resetBattle.start();
resetPresentation.update(resetBattle.snapshot());
resetBattle.reset();
const resetView = resetPresentation.update(resetBattle.snapshot());
const resetModel = buildStudent4v4UiModel(resetView);
assert.equal(resetModel.phase, "INIT");
assert.equal(resetModel.activeRole, null);
assert.deepEqual(resetModel.roles.map((r) => r.status), ["pending", "pending", "pending", "pending"]);

console.log("student_4v4_ui_test: PASS");
