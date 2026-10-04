import { createDomainEvent } from "./presentation_event_contract.js";

function safeId(value, fallback) {
  const normalized = String(value ?? "").trim();
  if (normalized && normalized.length <= 128) return normalized;
  return fallback;
}

function safeText(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function safeDamage(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function createCombatPresentationEvent({
  result,
  attackerId = null,
  targetId = null,
  actionType = null,
  terminal = null,
  sequence = 0
} = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("Authoritative combat result is required");
  }

  const normalizedAttackerId = safeId(
    result.attackerId ?? result.attacker_id ?? attackerId,
    "UNKNOWN_ATTACKER"
  );
  const normalizedTargetId = safeId(
    result.targetId ?? result.target_id ?? targetId,
    "UNKNOWN_TARGET"
  );
  const normalizedResult = safeText(
    result.result ?? result.outcome,
    "RESULT"
  ).toUpperCase();
  const normalizedOutcome = safeText(
    result.outcome,
    result.victory ? "VICTORY" : result.defeat ? "DEFEAT" : normalizedResult
  ).toUpperCase();
  const normalizedAction = safeText(
    result.actionType ?? result.action_type ?? result.action ?? actionType,
    "COMBAT_ACTION"
  ).toUpperCase();
  const normalizedTerminal = terminal === null
    ? Boolean(result.match_end || result.victory || result.defeat)
    : Boolean(terminal);

  return createDomainEvent({
    type: "COMBAT_RESULT",
    eventId: [
      "combat-presentation",
      normalizedAttackerId,
      normalizedTargetId,
      normalizedResult
    ].join(":"),
    source: "combat-session-authority",
    sequence,
    payload: {
      attacker_id: normalizedAttackerId,
      target_id: normalizedTargetId,
      action_type: normalizedAction,
      outcome: normalizedOutcome,
      result: normalizedResult,
      damage: safeDamage(result.damage),
      terminal: normalizedTerminal
    }
  });
}
