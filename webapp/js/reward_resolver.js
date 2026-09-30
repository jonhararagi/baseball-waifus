const REWARD_KINDS = Object.freeze(["CURRENCY", "CHARACTER", "UNLOCK"]);
const CURRENCIES = Object.freeze(["SCRAP", "FRAGMENTS"]);

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
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]+$/.test(value) || value.length > 128) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
}

function normalizeReward(reward) {
  if (!reward || typeof reward !== "object" || Array.isArray(reward)) {
    throw new TypeError("Invalid reward");
  }

  const kind = String(reward.kind || "").toUpperCase();
  if (!REWARD_KINDS.includes(kind)) throw new TypeError(`Unsupported reward kind: ${kind}`);

  if (kind === "CURRENCY") {
    if (!CURRENCIES.includes(reward.currency)) throw new TypeError("Invalid reward currency");
    if (!Number.isInteger(reward.amount) || reward.amount <= 0) throw new TypeError("Currency reward amount must be positive");
    return { kind, currency: reward.currency, amount: reward.amount };
  }

  if (kind === "CHARACTER") {
    assertId(reward.characterId, "characterId");
    if (!Number.isInteger(reward.quantity) || reward.quantity <= 0) throw new TypeError("Character reward quantity must be positive");
    return { kind, characterId: reward.characterId, quantity: reward.quantity };
  }

  assertId(reward.id, "unlock id");
  if (reward.unlocked !== true) throw new TypeError("Unlock rewards must set unlocked=true");
  return { kind, id: reward.id, unlocked: true };
}

export const REWARD_RESULT_TYPE = "REWARD_RESULT";
export const REWARD_KINDS = REWARD_KINDS;

export function resolveBattleRewards({
  battleResult,
  rewards = [],
  sourceEventId = "UNSPECIFIED_EVENT"
} = {}) {
  if (!battleResult || typeof battleResult !== "object" || Array.isArray(battleResult)) {
    throw new TypeError("A validated battle result is required");
  }
  assertId(String(sourceEventId), "sourceEventId");
  if (!Array.isArray(rewards)) throw new TypeError("rewards must be an array");

  const normalized = rewards.map(normalizeReward);
  return deepFreeze({
    type: REWARD_RESULT_TYPE,
    sourceEventId: String(sourceEventId),
    playerId: battleResult.playerId ? String(battleResult.playerId) : null,
    battleResultType: String(battleResult.type || "BATTLE_RESULT"),
    rewards: clone(normalized),
    deterministic: true
  });
}
