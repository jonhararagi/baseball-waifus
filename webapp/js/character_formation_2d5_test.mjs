import assert from "node:assert/strict";
import { CharacterActor2D5 } from "./combat_stage.js";
import { CHARACTER_FORMATION_2D5_SLOTS, CharacterFormation2D5 } from "./character_formation_2d5.js";

const actors = [0, 1, 2, 3].map((index) => new CharacterActor2D5({
  actorId: `formation-test-${index + 1}`,
  position: { x: 0.5, y: 0.5 }, depth: "MID", scale: 1, rotation: 0, facing: 1, visible: true
}));

const formation = new CharacterFormation2D5();
assert.equal(formation.getState().lifecycle, "CREATE");
formation.populate(actors);
assert.equal(formation.getState().lifecycle, "POPULATE");
assert.equal(formation.getState().actorCount, 4);
assert.equal(formation.getState().slotCount, 4);
formation.present();
assert.equal(formation.getState().lifecycle, "PRESENT");

for (let index = 0; index < 4; index += 1) {
  const actor = formation.getSlotActor(index);
  const slot = CHARACTER_FORMATION_2D5_SLOTS[index];
  assert.ok(actor);
  assert.deepEqual(actor.position, slot.position);
  assert.equal(actor.depth, slot.depth);
  assert.equal(actor.scale, slot.scale);
  assert.equal(actor.rotation, slot.rotation);
  assert.equal(actor.facing, slot.facing);
  assert.equal(actor.visible, slot.visible);
  assert.equal(actor.presentationState, "IDLE");
}

const snapshotsBeforeFocus = actors.map((actor) => actor.getPresentationSnapshot());
const focused = formation.getSlotActor(1);
focused.setPresentationState("FOCUS");
assert.equal(focused.presentationState, "FOCUS");
focused.setPresentationState("ACTION");
assert.equal(focused.presentationState, "ACTION");
focused.setPresentationState("RETURN");
assert.equal(focused.presentationState, "RETURN");
focused.resetPresentationState();
assert.equal(focused.presentationState, "IDLE");

for (let index = 0; index < 4; index += 1) {
  const actor = actors[index];
  const before = snapshotsBeforeFocus[index];
  const after = actor.getPresentationSnapshot();
  assert.deepEqual(after.position, before.position);
  assert.equal(after.depth, before.depth);
  assert.equal(after.scale, before.scale);
  assert.equal(after.rotation, before.rotation);
  assert.equal(after.facing, before.facing);
  assert.equal(after.visible, before.visible);
}

assert.equal(focused.getPresentationSnapshot().presentationOnly, true);
assert.equal(formation.getState().presentationOnly, true);
assert.equal(formation.getState().actorCount, 4);

formation.clear();
assert.equal(formation.getState().actorCount, 0);
assert.equal(formation.getState().lifecycle, "CLEAR");

console.log("T121 four-actor 2.5D formation foundation: PASS");
