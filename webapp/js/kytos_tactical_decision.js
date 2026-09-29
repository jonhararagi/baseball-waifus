import { ACTION_CARD, applyActionCard } from "./kytos_combat_vertical_slice.js";

export const SUPPORT_ACTION = Object.freeze({
  BOOST: "BOOST",
  CHARGE: "CHARGE",
  PASS: "PASS"
});

export const BATTER_ORDER = Object.freeze({
  NORMAL_SWING: "NORMAL_SWING",
  POWER_SWING: "POWER_SWING"
});

const SUPPORT_EFFECTS = Object.freeze({
  [SUPPORT_ACTION.BOOST]: Object.freeze({ card: ACTION_CARD.BUFFER, energy: 15 }),
  [SUPPORT_ACTION.CHARGE]: Object.freeze({ card: ACTION_CARD.ATTACK, energy: 12 }),
  [SUPPORT_ACTION.PASS]: null
});

const BATTER_EFFECTS = Object.freeze({
  [BATTER_ORDER.NORMAL_SWING]: null,
  [BATTER_ORDER.POWER_SWING]: Object.freeze({ card: ACTION_CARD.BUFFER, energy: 12 })
});

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function assertChoice(value, allowed, label) {
  const normalized = normalize(value);
  if (!allowed.includes(normalized)) {
    throw new TypeError(`Unknown ${label}: ${normalized || "EMPTY"}`);
  }
  return normalized;
}

export function applySupportDecision(state, action) {
  const normalized = assertChoice(action, Object.values(SUPPORT_ACTION), "support action");
  const effect = SUPPORT_EFFECTS[normalized];
  const nextState = effect
    ? applyActionCard(state, effect.card, { energy: effect.energy })
    : { ...state, lastResult: "SUPPORT_PASS" };

  return {
    ...nextState,
    tactical: {
      ...(nextState.tactical || {}),
      supportAction: normalized
    },
    lastResult: normalized === SUPPORT_ACTION.PASS
      ? "SUPPORT_PASS"
      : nextState.lastResult
  };
}

export function applyBatterDecision(state, order) {
  const normalized = assertChoice(order, Object.values(BATTER_ORDER), "batter order");
  const effect = BATTER_EFFECTS[normalized];
  const nextState = effect
    ? applyActionCard(state, effect.card, { energy: effect.energy })
    : { ...state, lastResult: "NORMAL_SWING_READY" };

  return {
    ...nextState,
    tactical: {
      ...(nextState.tactical || {}),
      batterOrder: normalized
    },
    lastResult: normalized === BATTER_ORDER.NORMAL_SWING
      ? "NORMAL_SWING_READY"
      : nextState.lastResult
  };
}

export function getAvailableTacticalDecision(phase) {
  const normalized = normalize(phase);
  if (normalized === "SUPPORT_DECISION") return Object.values(SUPPORT_ACTION);
  if (normalized === "BATTER_DECISION") return Object.values(BATTER_ORDER);
  return [];
}

export const KYTOS_TACTICAL_DECISION_DESIGN_STATUS = Object.freeze({
  status: "WORKING IMPLEMENTATION",
  canon: "DESIGN PROPOSAL",
  boundary: "Two deterministic player decisions only. No deckbuilding, persistence, elements, progression, or new combat system."
});
