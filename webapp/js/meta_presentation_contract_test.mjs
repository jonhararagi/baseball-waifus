import assert from "node:assert/strict";
import {
  createDomainEvent,
  createPresentationCommand,
  presentationCommandsFromEvent
} from "./presentation_event_contract.js";

const result = Object.freeze({
  type: "COMBAT_RESULT",
  playerId: "player-a",
  outcome: "VICTORY",
  damage: 180
});

const event = createDomainEvent({
  type: "COMBAT_RESULT",
  eventId: "battle-001-result",
  source: "student-4v4",
  sequence: 3,
  payload: result
});

const command = createPresentationCommand({
  type: "CAMERA",
  eventId: event.eventId,
  payload: { zoom: 1.2, shake: 8 },
  durationMs: 180
});

assert.equal(event.type, "COMBAT_RESULT");
const repeatedEvent = createDomainEvent({
  type: "COMBAT_RESULT",
  eventId: "battle-001-result",
  source: "student-4v4",
  sequence: 3,
  payload: result
});

assert.deepEqual(repeatedEvent, event);
assert.equal(command.type, "CAMERA");
assert.equal(command.payload.zoom, 1.2);
assert(Object.isFrozen(event));
assert(Object.isFrozen(command));

const batch = presentationCommandsFromEvent(event, [
  { type: "SPRITE", target: "bw001", payload: { state: "HIT" } },
  { type: "FX", target: "impact", payload: { quality: "PERFECT" } },
  { type: "AUDIO", target: "result.perfect", payload: {} }
]);

assert.equal(batch.length, 3);
assert(batch.every((entry) => entry.eventId === event.eventId));

const before = JSON.stringify(result);
assert.throws(() => {
  command.payload.zoom = 99;
}, TypeError);
assert.equal(JSON.stringify(result), before);

assert.throws(() => createDomainEvent({
  type: "COMBAT_RESULT",
  eventId: "",
  source: "combat",
  payload: {}
}), /eventId/);

assert.throws(() => createPresentationCommand({
  type: "UNKNOWN",
  eventId: "event-1"
}), /Unsupported presentation command/);

console.log("meta_presentation_contract_test: PASS");
