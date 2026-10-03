import assert from "node:assert/strict";
import { CombatPresentationDirector } from "../webapp/js/combat_presentation_director.js";
import { CombatStage, createCombatStageActors } from "../webapp/js/combat_stage.js";

const actors = createCombatStageActors({
  batter: { id: "runtime-batter", name: "Runtime Batter" },
  enemy: { id: "runtime-enemy", name: "Runtime Enemy" }
});
const stage = new CombatStage();
stage.setActors(actors);
stage.setSelectedActor("fixture-player-02");

const events = [];
const director = new CombatPresentationDirector({
  stage,
  onStep: (event) => {
    events.push({ phase: event.phase, reason: event.reason });
    const formation = director.getFormation();
    const attacker = formation?.getActor("fixture-player-02");
    if (!attacker) return;

    if (event.phase === "ATTACKER_FOCUS") attacker.setPresentationState("FOCUS");
    if (event.phase === "ACTION") attacker.setPresentationState("ACTION");
    if (event.phase === "COMBAT_RETURN") attacker.setPresentationState("RETURN");
    if (event.phase === "COMPLETE") attacker.resetPresentationState();
  }
});

const formation = director.getFormation();
assert.ok(formation, "runtime formation must exist");
assert.equal(formation.getState().actorCount, 4);
assert.equal(formation.getState().slotCount, 4);

const before = new Map(
  stage.getActors({ team: "PLAYER" }).map((actor) => [actor.actorId, actor.getPresentationSnapshot()])
);
const stableIds = ["runtime-batter", "fixture-player-03", "fixture-player-04"];

director.startFromCombatResult({
  attackerId: "fixture-player-02",
  targetId: "runtime-enemy",
  result: "HOME_RUN",
  damage: 10,
  actionType: "NORMAL_ATTACK"
});

const attacker = formation.getActor("fixture-player-02");
assert.ok(attacker, "focused actor must belong to runtime formation");
assert.equal(attacker.getPresentationState(), "FOCUS");
for (const actorId of stableIds) assert.equal(formation.getActor(actorId).getPresentationState(), "IDLE");

director.update(0.22);
assert.equal(attacker.getPresentationState(), "ACTION");
for (const actorId of stableIds) assert.equal(formation.getActor(actorId).getPresentationState(), "IDLE");

director.update(0.30);
director.update(0.18);
for (const actorId of stableIds) assert.equal(formation.getActor(actorId).getPresentationState(), "IDLE");

director.update(0.30);
assert.equal(attacker.getPresentationState(), "RETURN");
for (const actorId of stableIds) assert.equal(formation.getActor(actorId).getPresentationState(), "IDLE");

director.update(0.30);
assert.equal(attacker.getPresentationState(), "IDLE");
assert.equal(director.getState().formationActorCount, 4);

for (const actor of stage.getActors({ team: "PLAYER" })) {
  const finalSnapshot = actor.getPresentationSnapshot();
  const original = before.get(actor.actorId);
  assert.deepEqual(finalSnapshot.position, original.position);
  assert.equal(finalSnapshot.depth, original.depth);
  assert.equal(finalSnapshot.scale, original.scale);
  assert.equal(finalSnapshot.rotation, original.rotation);
  assert.equal(finalSnapshot.facing, original.facing);
  assert.equal(finalSnapshot.visible, original.visible);
  assert.equal(finalSnapshot.presentationState, "IDLE");
}

assert.deepEqual(
  events.map((event) => event.phase),
  ["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN", "COMPLETE"]
);

console.log("T122-R3 runtime formation normal attack flow: PASS");
