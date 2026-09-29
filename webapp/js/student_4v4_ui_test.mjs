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

function update(battle, presentation, ui) {
  const view = presentation.update(battle.snapshot());
  return ui.render(view);
}

function completeRole(battle, presentation, ui) {
  const role = battle.currentPhase;
  while (battle.currentPhase === role) {
    assert.equal(battle.submitInput(perfectInput(battle)).accepted, true);
    update(battle, presentation, ui);
  }
}

function run(seed) {
  const battle = new Student4v4BattleState({ seed, battleId: "ui-" + seed });
  const presentation = new Student4v4PresentationOrchestrator();
  const ui = new Student4v4IntegratedUi({ innerHTML: "" });

  const initial = update(battle, presentation, ui);
  assert.equal(initial.phase, "INIT");
  assert.deepEqual(initial.roles.map((r) => r.status), ["pending", "pending", "pending", "pending"]);

  battle.start();
  let model = update(battle, presentation, ui);
  assert.equal(model.activeRole, "BUFFER");
  assert.deepEqual(model.roles.map((r) => r.status), ["active", "pending", "pending", "pending"]);

  for (const role of ROLES) {
    assert.equal(battle.currentPhase, role);
    completeRole(battle, presentation, ui);
    model = update(battle, presentation, ui);
    assert.equal(model.roles.find((r) => r.role === role).status, "completed");
    if (role !== "BATTER") {
      const next = ROLES[ROLES.indexOf(role) + 1];
      assert.equal(model.activeRole, next);
    }
  }

  assert.equal(model.phase, "RESOLUTION");
  assert.equal(model.activeRole, null);
  assert.equal(model.resolution, null);

  const beforeRender = JSON.stringify(battle.snapshot());
  battle.resolve();
  model = update(battle, presentation, ui);
  const afterRender = JSON.stringify(battle.snapshot());
  assert.equal(afterRender, JSON.stringify(battle.snapshot()));

  assert.equal(model.phase, "COMPLETE");
  assert.equal(model.completed, true);
  assert.equal(model.roles.length, 4);
  assert.equal(model.roles.every((r) => r.completed && r.result?.type === "ROLE_RESULT"), true);
  assert.equal(model.resolution.combinedScore, battle.snapshot().student4v4Result.combinedScore);
  assert.equal(model.resolution.combinedAccuracy, battle.snapshot().student4v4Result.combinedAccuracy);
  assert.equal(model.student4v4Result.type, "STUDENT_4V4_RESULT");
  assert.equal(model.combatResult.type, "COMBAT_RESULT");
  assert.match(ui.root.innerHTML, /ROLE TRACKER/);
  assert.match(ui.root.innerHTML, /RESOLUTION/);
  assert.match(ui.root.innerHTML, /COMPLETE/);
  assert.match(ui.root.innerHTML, /COMBAT RESULT/);

  const resultBefore = JSON.stringify(battle.snapshot().student4v4Result);
  ui.render(presentation.getSnapshot() ? { presentation: presentation.getSnapshot(), events: [] } : null);
  assert.equal(JSON.stringify(battle.snapshot().student4v4Result), resultBefore);
  assert.equal(JSON.stringify(battle.snapshot()) !== beforeRender, true);

  const frozen = buildStudent4v4UiModel({
    presentation: presentation.getSnapshot(),
    events: []
  });
  assert.equal(frozen.deterministic, true);
  assert.throws(() => { frozen.phase = "BUFFER"; }, TypeError);
  assert.throws(() => { frozen.roles[0].status = "active"; }, TypeError);

  return frozen;
}

const first = run("T046-DETERMINISTIC");
const second = run("T046-DETERMINISTIC");
assert.deepEqual(first, second);

const resetBattle = new Student4v4BattleState({ seed: "T046-RESET" });
const resetPresentation = new Student4v4PresentationOrchestrator();
const resetUi = new Student4v4IntegratedUi({ innerHTML: "" });
update(resetBattle, resetPresentation, resetUi);
resetBattle.start();
update(resetBattle, resetPresentation, resetUi);
resetBattle.reset();
const resetModel = update(resetBattle, resetPresentation, resetUi);
assert.equal(resetModel.phase, "INIT");
assert.equal(resetModel.activeRole, null);
assert.deepEqual(resetModel.roles.map((r) => r.status), ["pending", "pending", "pending", "pending"]);
assert.equal(resetModel.resolved, false);

const sideEffectBattle = new Student4v4BattleState({ seed: "T046-NO-SIDE-EFFECT" });
const sideEffectPresentation = new Student4v4PresentationOrchestrator();
const sideEffectUi = new Student4v4IntegratedUi({ innerHTML: "" });
sideEffectPresentation.update(sideEffectBattle.snapshot());
const gameplayBefore = JSON.stringify(sideEffectBattle.snapshot());
sideEffectUi.render(sideEffectPresentation.update(sideEffectBattle.snapshot()));
assert.equal(JSON.stringify(sideEffectBattle.snapshot()), gameplayBefore);

console.log("student_4v4_ui_test: PASS");
