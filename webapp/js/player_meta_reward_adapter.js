import { REWARD_KINDS, REWARD_RESULT_TYPE } from "./reward_resolver.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionsForReward(reward) {
  switch (reward.kind) {
    case "CURRENCY":
      return [{
        type: "ADD_CURRENCY",
        currency: reward.currency,
        amount: reward.amount
      }];
    case "CHARACTER":
      return [{
        type: "ADD_CHARACTER",
        characterId: reward.characterId,
        quantity: reward.quantity
      }];
    case "UNLOCK":
      return [{
        type: "SET_UNLOCK",
        id: reward.id,
        unlocked: reward.unlocked
      }];
    default:
      throw new TypeError(`Unsupported reward kind: ${reward.kind}`);
  }
}

function validateRewardResult(rewardResult) {
  if (!rewardResult || typeof rewardResult !== "object" || Array.isArray(rewardResult)) {
    throw new TypeError("REWARD_RESULT is required");
  }
  if (rewardResult.type !== REWARD_RESULT_TYPE || rewardResult.deterministic !== true) {
    throw new TypeError("Invalid REWARD_RESULT contract");
  }
  if (!Array.isArray(rewardResult.rewards)) throw new TypeError("REWARD_RESULT rewards must be an array");
  for (const reward of rewardResult.rewards) {
    if (!REWARD_KINDS.includes(reward?.kind)) throw new TypeError("Invalid REWARD_RESULT reward kind");
  }
}

export function applyRewardResultToPlayerMeta({
  authority,
  rewardResult,
  persistenceAdapter = null
} = {}) {
  if (!authority || typeof authority.dispatch !== "function" || typeof authority.getSnapshot !== "function") {
    throw new TypeError("PlayerMetaAuthority is required");
  }
  validateRewardResult(rewardResult);

  const sourceEventId = String(rewardResult.sourceEventId || "");
  if (!sourceEventId) throw new TypeError("REWARD_RESULT sourceEventId is required");
  if (typeof authority.hasAppliedReward === "function" && authority.hasAppliedReward(sourceEventId)) {
    return Object.freeze({
      ok: true,
      duplicate: true,
      sourceEventId,
      snapshot: authority.getSnapshot(),
      appliedRewards: []
    });
  }

  const before = authority.getSnapshot();
  try {
    for (const reward of rewardResult.rewards) {
      for (const action of actionsForReward(reward)) {
        const result = authority.dispatch(action);
        if (!result.ok) throw new Error(result.reason || "PLAYER_META_ACTION_REJECTED");
      }
    }

    const marked = authority.dispatch({ type: "RECORD_REWARD", sourceEventId });
    if (!marked.ok) {
      if (marked.reason === "REWARD_ALREADY_APPLIED") {
        return Object.freeze({ ok: true, duplicate: true, sourceEventId, snapshot: authority.getSnapshot(), appliedRewards: [] });
      }
      throw new Error(marked.reason || "REWARD_LEDGER_REJECTED");
    }

    const after = authority.getSnapshot();
    if (persistenceAdapter) {
      if (typeof persistenceAdapter.save !== "function") throw new TypeError("Invalid persistence adapter");
      persistenceAdapter.save(after);
    }

    return Object.freeze({
      ok: true,
      sourceEventId: rewardResult.sourceEventId,
      snapshot: after,
      appliedRewards: clone(rewardResult.rewards)
    });
  } catch (error) {
    authority.replaceSnapshot(before);
    throw error;
  }
}
