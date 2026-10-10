import test from "node:test";
import assert from "node:assert/strict";
import { CharacterActor2D5, CombatStage } from "../webapp/js/combat_stage.js";
import { CombatPresentationDirector } from "../webapp/js/combat_presentation_director.js";

function stageActors(generation = "initial") {
  return [
    new CharacterActor2D5({ actorId: "bw001", team: "PLAYER", visual: { generation } }),
    new CharacterActor2D5({ actorId: "bw003", team: "PLAYER", visual: { generation } }),
    new CharacterActor2D5({ actorId: "bw004", team: "PLAYER", visual: { generation } }),
    new CharacterActor2D5({ actorId: "bw005", team: "PLAYER", visual: { generation } }),
    new CharacterActor2D5({ actorId: "bw002", team: "ENEMY", visual: { generation } })
  ];
}
function resultEvent(id) {
  return {
    type: "COMBAT_RESULT",
    eventId: id,
    payload: {
      attacker_id: "bw001", target_id: "bw002", result: "HIT",
      outcome: "HIT", damage: 1, action_type: "SWING", terminal: false
    }
  };
}
function buildDirector(stage) {
  return new CombatPresentationDirector({
    stage,
    onStep(step) {
      const actorId = String(step?.result?.attackerId || step?.result?.attacker_id || "");
      const actor = stage.getActor(actorId);
      if (!actor) return;
      if (step.phase === "ATTACKER_FOCUS") actor.setPresentationState("FOCUS");
      else if (step.phase === "ACTION") actor.setPresentationState("ACTION");
      else if (step.phase === "COMBAT_RETURN") actor.setPresentationState("RETURN");
      else if (step.phase === "COMPLETE") actor.resetPresentationState();
    }
  });
}
function progressToAction(director, stage) {
  for (let i = 0; i < 8 && director.active && director.phase !== "ACTION"; i++) director.update(0.5);
  assert.equal(director.active, true);
  assert.equal(director.phase, "ACTION");
  assert.equal(stage.getActor("bw001").presentationState, "ACTION");
}
test("stage replacement while a presentation is active reuses the new stage actor generation", () => {
  const stage = new CombatStage({ actors: stageActors("generation-1") });
  const director = buildDirector(stage);
  const authoritySnapshot = Object.freeze({
    phase: "CLIMAX", tacticalTurn: 5, bossHp: 1, scrap: 0, persistedScrap: 0,
    rewardLedgerKeys: Object.freeze([])
  });
  const initialAuthority = JSON.stringify(authoritySnapshot);

  director.startFromPresentationEvent(resultEvent("actor-identity-1"));
  progressToAction(director, stage);
  assert.strictEqual(stage.getActor("bw001"), director.formation.actors.get("bw001"));

  stage.setActors(stageActors("generation-2"));
  assert.notStrictEqual(stage.getActor("bw001"), director.formation.actors.get("bw001"),
    "fixture must reproduce the stage-map generation replacement");
  assert.equal(director.formation.actors.get("bw001").presentationState, "ACTION");

  assert.doesNotThrow(() => director.startFromPresentationEvent(resultEvent("actor-identity-2")));
  assert.strictEqual(stage.getActor("bw001"), director.formation.actors.get("bw001"),
    "formation must be rebuilt from the current stage actor references");
  progressToAction(director, stage);

  assert.doesNotThrow(() => director.startFromPresentationEvent(resultEvent("actor-identity-3")));
  assert.strictEqual(stage.getActor("bw001"), director.formation.actors.get("bw001"));
  for (let i = 0; i < 12 && director.active; i++) director.update(0.5);
  assert.equal(director.active, false);
  assert.equal(director.phase, "COMPLETE");
  assert.strictEqual(stage.getActor("bw001"), director.formation.actors.get("bw001"));
  assert.equal(JSON.stringify(authoritySnapshot), initialAuthority,
    "presentation lifecycle must not mutate combat authority/reward state");
});
