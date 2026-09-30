const EVENT_TYPES = Object.freeze([
  "COMBAT_RESULT",
  "BATTLE_COMPLETED",
  "REWARD_GRANTED",
  "CHARACTER_ACQUIRED",
  "LEVEL_UP",
  "NEW_UNLOCK",
  "GACHA_RARE_REVEAL",
  "MISSION_COMPLETED",
  "BOSS_DEFEATED"
]);

const COMMAND_TYPES = Object.freeze([
  "SPRITE",
  "CAMERA",
  "FX",
  "AUDIO",
  "UI",
  "PARALLAX",
  "CUT_IN",
  "HIT_STOP",
  "HAPTIC"
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assertId(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > 128) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
}

export function createDomainEvent({
  type,
  eventId,
  source,
  sequence = 0,
  payload = {}
} = {}) {
  const normalizedType = String(type || "").toUpperCase();
  if (!EVENT_TYPES.includes(normalizedType)) throw new TypeError(`Unsupported event type: ${normalizedType}`);
  assertId(String(eventId || ""), "eventId");
  assertId(String(source || ""), "source");
  if (!Number.isInteger(sequence) || sequence < 0) throw new TypeError("sequence must be a non-negative integer");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("event payload must be an object");

  return deepFreeze({
    type: normalizedType,
    eventId: String(eventId),
    source: String(source),
    sequence,
    payload: clone(payload)
  });
}

export function createPresentationCommand({
  type,
  eventId,
  target = null,
  payload = {},
  durationMs = 0
} = {}) {
  const normalizedType = String(type || "").toUpperCase();
  if (!COMMAND_TYPES.includes(normalizedType)) throw new TypeError(`Unsupported presentation command: ${normalizedType}`);
  assertId(String(eventId || ""), "eventId");
  if (target !== null) assertId(String(target), "target");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("command payload must be an object");
  if (!Number.isFinite(Number(durationMs)) || Number(durationMs) < 0) throw new TypeError("durationMs must be non-negative");

  return deepFreeze({
    type: normalizedType,
    eventId: String(eventId),
    target: target === null ? null : String(target),
    durationMs: Number(durationMs),
    payload: clone(payload)
  });
}

export function presentationCommandsFromEvent(event, commands = []) {
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError("Domain event is required");
  if (!Array.isArray(commands)) throw new TypeError("commands must be an array");

  return deepFreeze(commands.map((command) => createPresentationCommand({
    ...command,
    eventId: command.eventId || event.eventId
  })));
}

export const PRESENTATION_EVENT_TYPES = EVENT_TYPES;
export const PRESENTATION_COMMAND_TYPES = COMMAND_TYPES;
