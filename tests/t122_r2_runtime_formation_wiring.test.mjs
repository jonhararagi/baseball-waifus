import assert from "node:assert/strict";
import { CombatPresentationDirector } from "../webapp/js/combat_presentation_director.js";
import { CombatStage, createCombatStageActors } from "../webapp/js/combat_stage.js";

const actors = createCombatStageActors({
  batter: { id: "runtime-batter", name: "Runtime Batter" },
  enemy: { id: "runtime-enemy", name: "Runtime Enemy" }
});
const stage = new CombatStage();
const director = new CombatPresentationDirector({ stage });

assert.equal(director.getFormation(), null, "formation must wait for runtime actors");

stage.setActors(actors);
director.startFromCombatResult({
  attackerId: "runtime-batter",
  targetId: "runtime-enemy",
  result: "HOME_RUN",
  damage: 10,
  actionType: "NORMAL_ATTACK"
});

const formation = director.getFormation();
assert.ok(formation, "runtime formation must be created after actors exist");
assert.equal(formation.getState().actorCount, 4);
assert.equal(formation.getState().slotCount, 4);
assert.deepEqual(
  formation.getState().actors.map((actor) => actor.actorId),
  actors.slice(0, 4).map((actor) => actor.actorId)
);

for (const actor of stage.getActors({ team: "PLAYER" })) {
  const snapshot = actor.getPresentationSnapshot();
  assert.deepEqual(snapshot.position, formation.getActor(actor.actorId).position);
  assert.equal(snapshot.depth, formation.getActor(actor.actorId).depth);
  assert.equal(snapshot.scale, formation.getActor(actor.actorId).scale);
  assert.equal(snapshot.rotation, formation.getActor(actor.actorId).rotation);
  assert.equal(snapshot.facing, formation.getActor(actor.actorId).facing);
  assert.equal(snapshot.visible, formation.getActor(actor.actorId).visible);
  assert.equal(snapshot.presentationState, "IDLE");
}

assert.equal(director.getState().formationInitialized, true);
assert.equal(director.getState().formationActorCount, 4);
console.log("T122-R2 runtime formation wiring: PASS");
