import assert from "node:assert/strict";
import { Student4v4BattleState } from "./student_4v4_battle_state.js";
import { Student4v4PresentationOrchestrator, buildStudent4v4PresentationSnapshot } from "./student_4v4_presentation_orchestrator.js";
import {
  buildBufferPresentationAdapter,
  buildHealerPresentationAdapter,
  buildDebufferPresentationAdapter,
  buildBatterPresentationAdapter,
  buildStudent4v4RoleAdapter,
  buildStudent4v4RoleAdapterModels
} from "./student_4v4_role_adapters.js";

const ROLE_ORDER = ["BUFFER", "HEALER", "DEBUFFER", "BATTER"];

function perfectInput(battle) {
  const state = battle.getCurrentRoleGame().getState();
  switch (battle.currentPhase) {
    case "BUFFER":
      return { noteId: state.current_note.id, timestampMs: state.current_note.target_ms };
    case "HEALER":
      return {
        threatId: state.current_threat.id,
        zone: state.current_threat.zone,
        timestampMs: state.current_threat.target_ms
      };
    case "DEBUFFER":
      return {
        targetId: state.current_target.id,
        x: state.current_target.x,
        y: state.current_target.y,
        timestampMs: state.current_target.target_ms
      };
    case "BATTER":
      return { opportunityId: state.current_opportunity.id, timestampMs: state.current_opportunity.target_ms };
    default:
      throw new Error("NO_ACTIVE_ROLE");
  }
}

function completeRole(battle) {
  const role = battle.currentPhase;
  while (battle.currentPhase === role) {
    const response = battle.submitInput(perfectInput(battle));
    assert.equal(response.accepted, true);
  }
}

function completeBattle(seed) {
  const battle = new Student4v4BattleState({ seed });
  const presentation = new Student4v4PresentationOrchestrator();
  presentation.update(battle.snapshot());
  battle.start();
  presentation.update(battle.snapshot());

  while (battle.currentPhase !== "RESOLUTION") {
    completeRole(battle);
    presentation.update(battle.snapshot());
  }

  battle.resolve();
  const view = presentation.update(battle.snapshot());
  return { battle, presentation, view };
}

const first = completeBattle("T045-DETERMINISTIC");
const second = completeBattle("T045-DETERMINISTIC");

assert.deepEqual(first.view.presentation, second.view.presentation);
assert.deepEqual(
  buildStudent4v4RoleAdapterModels(first.view.presentation),
  buildStudent4v4RoleAdapterModels(second.view.presentation)
);

const models = buildStudent4v4RoleAdapterModels(first.view.presentation);
for (const role of ROLE_ORDER) {
  assert.equal(models[role].role, role);
  assert.equal(models[role].status, "completed");
  assert.equal(models[role].active, false);
  assert.equal(models[role].completed, true);
  assert.equal(models[role].displayState.hasResult, true);
  assert.equal(models[role].result.type, "ROLE_RESULT");
  assert.equal(models[role].result.role, role);
  assert.equal(Object.isFrozen(models[role]), true);
  assert.equal(Object.isFrozen(models[role].result), true);
}

assert.notEqual(
  buildBufferPresentationAdapter(first.view.presentation).result,
  buildBufferPresentationAdapter(first.view.presentation).result
);

const beforeGameplay = JSON.stringify(first.battle.snapshot());
const adapterAgain = buildStudent4v4RoleAdapterModels(first.view.presentation);
assert.equal(JSON.stringify(first.battle.snapshot()), beforeGameplay);
assert.deepEqual(adapterAgain, models);

const mutableAdapter = buildBufferPresentationAdapter(first.view.presentation);
assert.throws(() => { mutableAdapter.status = "active"; }, TypeError);
assert.throws(() => { mutableAdapter.result.score = -1; }, TypeError);
assert.equal(JSON.stringify(first.battle.snapshot()), beforeGameplay);

const resetBattle = new Student4v4BattleState({ seed: "T045-RESET" });
const resetPresentation = new Student4v4PresentationOrchestrator();
resetPresentation.update(resetBattle.snapshot());
resetBattle.start();
resetPresentation.update(resetBattle.snapshot());
resetBattle.submitInput(perfectInput(resetBattle));
resetPresentation.update(resetBattle.snapshot());
resetBattle.reset();
const resetView = resetPresentation.update(resetBattle.snapshot()).presentation;
const resetModels = buildStudent4v4RoleAdapterModels(resetView);

for (const role of ROLE_ORDER) {
  assert.equal(resetModels[role].status, "pending");
  assert.equal(resetModels[role].active, false);
  assert.equal(resetModels[role].completed, false);
  assert.equal(resetModels[role].result, null);
}

const pendingBattle = new Student4v4BattleState({ seed: "T045-PENDING" });
pendingBattle.start();
const pendingPresentation = buildStudent4v4PresentationSnapshot(pendingBattle.snapshot());
const pendingModels = buildStudent4v4RoleAdapterModels(pendingPresentation);
assert.equal(pendingModels.BUFFER.status, "active");
assert.equal(pendingModels.BUFFER.active, true);
assert.equal(pendingModels.BUFFER.completed, false);
assert.equal(pendingModels.BUFFER.result, null);
assert.equal(pendingModels.HEALER.status, "pending");
assert.equal(pendingModels.BATTER.status, "pending");

const baseSnapshot = first.view.presentation;
const missingRole = {
  ...baseSnapshot,
  roles: baseSnapshot.roles.filter((entry) => entry.role !== "HEALER")
};
assert.throws(() => buildHealerPresentationAdapter(missingRole), /MISSING_ROLE:HEALER/);

assert.throws(() => buildStudent4v4RoleAdapterModels(null), /INVALID_PRESENTATION_SNAPSHOT/);
assert.throws(() => buildStudent4v4RoleAdapterModels(undefined), /INVALID_PRESENTATION_SNAPSHOT/);
assert.throws(() => {
  buildBufferPresentationAdapter({ ...baseSnapshot, phase: "BROKEN" });
}, /INVALID_PRESENTATION_STATE/);

assert.throws(() => {
  buildStudent4v4RoleAdapterModels({ ...baseSnapshot, roleResults: {
    ...baseSnapshot.roleResults,
    BUFFER: null
  }});
}, /MISSING_ROLE_RESULT:BUFFER/);

assert.throws(() => {
  buildStudent4v4RoleAdapterModels({ ...baseSnapshot, roleResults: {
    ...baseSnapshot.roleResults,
    BUFFER: { type: "BROKEN", role: "BUFFER" }
  }});
}, /INVALID_ROLE_RESULT:BUFFER/);

assert.throws(() => {
  buildStudent4v4RoleAdapter(baseSnapshot, "UNKNOWN");
}, /UNKNOWN_ROLE/);

assert.throws(() => {
  buildStudent4v4RoleAdapterModels({
    ...baseSnapshot,
    roles: baseSnapshot.roles.map((entry) =>
      entry.role === "BUFFER" ? { ...entry, status: "BROKEN" } : entry
    )
  });
}, /INVALID_ROLE_STATUS:BUFFER/);

const sourceRoleResult = first.view.presentation.roleResults.BUFFER;
const isolated = buildBufferPresentationAdapter(first.view.presentation);
assert.notEqual(isolated.result, sourceRoleResult);
assert.deepEqual(isolated.result, sourceRoleResult);
assert.equal(first.view.presentation.roleResults.BUFFER.score, sourceRoleResult.score);

console.log("student_4v4_role_adapters_test: PASS");
