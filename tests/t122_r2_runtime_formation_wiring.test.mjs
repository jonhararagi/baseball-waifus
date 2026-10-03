import assert from "node:assert/strict";
import { CombatPresentationDirector } from "../webapp/js/combat_presentation_director.js";
import { CombatStage, createCombatStageActors } from "../webapp/js/combat_stage.js";

const actors = createCombatStageActors({
  batter: { id: "runtime-batter", name: "Runtime Batter" },
  enemy: { id: "runtime-enemy", name: "Runtime Enemy" }
});
const stage = new CombatStage({ actors });
const director = new CombatPresentationDirector({ stage });

const formation = director.getFormation();
assert.ok(formation, "runtime formation must be created");
assert.equal(formation.getState().actorCount, 4);
assert.equal(formation.getState().slotCount, 4);
assert.deepEqual(
  formation.getState().actors.map((actor) => actor.actorId),
  actors.slice(0, 4).map((actor) => actor.actorId)
);

const before = new Map(
  stage.getActors({ team: "PLAYER" }).map((actor) => [actor.actorId, actor.getPresentationSnapshot()])
);

assert.equal(director.getState().formationInitialized, true);
assert.equal(director.getState().formationActorCount, 4);

for (const actor of stage.getActors({ team: "PLAYER" })) {
  const snapshot = actor.getPresentationSnapshot();
  const original = before.get(actor.actorId);
  assert.deepEqual(snapshot.position, original.position);
  assert.equal(snapshot.depth, original.depth);
  assert.equal(snapshot.scale, original.scale);
  assert.equal(snapshot.rotation, original.rotation);
  assert.equal(snapshot.facing, original.facing);
  assert.equal(snapshot.visible, original.visible);
  assert.equal(snapshot.presentationState, "IDLE");
}

console.log("T122-R2 runtime formation wiring: PASS");
