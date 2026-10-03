import { CharacterActor2D5 } from "./combat_stage.js";

export const CHARACTER_FORMATION_2D5_SLOTS = Object.freeze([
  Object.freeze({ slot: 0, position: { x: 0.19, y: 0.58 }, depth: "MID", scale: 0.94, rotation: 0, facing: 1, visible: true }),
  Object.freeze({ slot: 1, position: { x: 0.09, y: 0.46 }, depth: "FAR", scale: 0.84, rotation: 0, facing: 1, visible: true }),
  Object.freeze({ slot: 2, position: { x: 0.37, y: 0.68 }, depth: "NEAR", scale: 1.04, rotation: 0, facing: 1, visible: true }),
  Object.freeze({ slot: 3, position: { x: 0.48, y: 0.50 }, depth: "MID", scale: 0.96, rotation: 0, facing: 1, visible: true })
]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function normalizeSlot(slot, index) {
  const fallback = CHARACTER_FORMATION_2D5_SLOTS[index];
  return {
    slot: index,
    position: {
      x: Number.isFinite(Number(slot?.position?.x)) ? Number(slot.position.x) : fallback.position.x,
      y: Number.isFinite(Number(slot?.position?.y)) ? Number(slot.position.y) : fallback.position.y
    },
    depth: String(slot?.depth || fallback.depth).toUpperCase(),
    scale: Number.isFinite(Number(slot?.scale)) ? Number(slot.scale) : fallback.scale,
    rotation: Number.isFinite(Number(slot?.rotation)) ? Number(slot.rotation) : fallback.rotation,
    facing: Number(slot?.facing) < 0 ? -1 : 1,
    visible: slot?.visible !== false
  };
}

export class CharacterFormation2D5 {
  constructor({ slots = CHARACTER_FORMATION_2D5_SLOTS, actors = [] } = {}) {
    if (!Array.isArray(slots) || slots.length !== 4) throw new TypeError("CharacterFormation2D5 requires exactly 4 slots");
    this.slots = slots.map(normalizeSlot);
    this.actors = new Map();
    this.slotActors = new Map();
    this.lifecycle = "CREATE";
    if (Array.isArray(actors) && actors.length) this.populate(actors);
  }

  populate(actors = []) {
    if (!Array.isArray(actors) || actors.length > 4) throw new TypeError("CharacterFormation2D5 accepts up to 4 actors");
    this.clear();
    actors.forEach((actor, index) => this.attach(actor, index));
    this.lifecycle = "POPULATE";
    return this.getState();
  }

  attach(actor, slotIndex = 0) {
    if (!actor || !(actor instanceof CharacterActor2D5)) throw new TypeError("CharacterFormation2D5 accepts CharacterActor2D5 instances");
    const slot = this.slots[slotIndex];
    if (!slot) throw new RangeError("CharacterFormation2D5 slot must be 0..3");
    if (this.actors.has(actor.actorId)) throw new Error("Duplicate formation actor: " + actor.actorId);
    if (this.slotActors.has(slotIndex)) throw new Error("Formation slot already occupied: " + slotIndex);
    this.actors.set(actor.actorId, actor);
    this.slotActors.set(slotIndex, actor.actorId);
    return this.getActor(actor.actorId);
  }

  present() {
    for (const [slotIndex, actorId] of this.slotActors.entries()) {
      const actor = this.actors.get(actorId);
      const slot = this.slots[slotIndex];
      actor.position = Object.freeze({ ...slot.position });
      actor.depth = slot.depth;
      actor.scale = slot.scale;
      actor.rotation = slot.rotation;
      actor.facing = slot.facing;
      actor.visible = slot.visible;
    }
    this.lifecycle = "PRESENT";
    return this.getState();
  }

  clear() {
    this.actors.clear();
    this.slotActors.clear();
    this.lifecycle = "CLEAR";
    return this.getState();
  }

  getActor(actorId) { return this.actors.get(String(actorId || "")) || null; }
  getSlotActor(slotIndex) {
    const actorId = this.slotActors.get(Number(slotIndex));
    return actorId ? this.getActor(actorId) : null;
  }

  getState() {
    return {
      contract: "CHARACTER_FORMATION_2D5",
      presentationOnly: true,
      lifecycle: this.lifecycle,
      actorCount: this.actors.size,
      slotCount: this.slots.length,
      slots: clone(this.slots),
      actors: [...this.actors.values()].map((actor) => actor.getPresentationSnapshot())
    };
  }
}
