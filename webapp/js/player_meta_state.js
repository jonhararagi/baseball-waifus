// CI evidence marker: keep Player Meta workflows explicitly runnable against the exact final SHA.
const SCHEMA_VERSION = 1;
const CURRENCY_IDS = Object.freeze(["SCRAP", "FRAGMENTS"]);
const ACTION_TYPES = Object.freeze([
  "ADD_CHARACTER",
  "REMOVE_CHARACTER",
  "ADD_CURRENCY",
  "SPEND_CURRENCY",
  "SET_UNLOCK",
  "UPDATE_GACHA_STATE",
  "SET_ROSTER",
  "RECORD_REWARD"
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!isObject(value) && !Array.isArray(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assertId(value, label = "id") {
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]+$/.test(value) || value.length > 128) {
    throw new TypeError(`${label} must be a non-empty stable identifier`);
  }
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
}

function normalizeCharacterEntry(entry) {
  if (!isObject(entry)) throw new TypeError("Invalid character inventory entry");
  assertNonNegativeInteger(entry.quantity, "character quantity");
  if (typeof entry.unlocked !== "boolean") throw new TypeError("character unlocked must be boolean");
  return { quantity: entry.quantity, unlocked: entry.unlocked };
}

export function createPlayerIdentity({ playerId = "local-player", provider = "local", telegramUserId = null } = {}) {
  assertId(String(playerId), "playerId");
  if (!["local", "telegram"].includes(provider)) throw new TypeError("Unsupported identity provider");
  if (telegramUserId !== null) assertId(String(telegramUserId), "telegramUserId");
  return deepFreeze({
    playerId: String(playerId),
    provider,
    ...(telegramUserId !== null ? { telegramUserId: String(telegramUserId) } : {})
  });
}

export function resolvePlayerIdentity({ telegramUser = null, localPlayerId = "local-player" } = {}) {
  const telegramId = telegramUser?.id;
  if (telegramId !== undefined && telegramId !== null) {
    return createPlayerIdentity({
      playerId: `telegram:${telegramId}`,
      provider: "telegram",
      telegramUserId: String(telegramId)
    });
  }
  return createPlayerIdentity({ playerId: localPlayerId, provider: "local" });
}

export function createInitialPlayerMetaState(identity = createPlayerIdentity()) {
  return freezeSnapshot({
    schemaVersion: SCHEMA_VERSION,
    identity,
    inventory: { characters: {} },
    currencies: { SCRAP: 0, FRAGMENTS: 0 },
    gacha: { pullsSinceUR: 0 },
    unlocks: {},
    roster: { activeBatter: null, supports: [null, null] },
    rewardLedger: {}
  });
}

export function validatePlayerMetaState(state) {
  if (!isObject(state)) throw new TypeError("PlayerMetaState must be an object");
  if (state.schemaVersion !== SCHEMA_VERSION) throw new TypeError("Unsupported PlayerMetaState schemaVersion");
  if (!isObject(state.identity)) throw new TypeError("PlayerMetaState identity is required");
  createPlayerIdentity(state.identity);
  if (!isObject(state.inventory) || !isObject(state.inventory.characters)) throw new TypeError("Invalid inventory");
  for (const [id, entry] of Object.entries(state.inventory.characters)) {
    assertId(id, "character id");
    normalizeCharacterEntry(entry);
  }
  if (!isObject(state.currencies)) throw new TypeError("Invalid currencies");
  for (const currency of CURRENCY_IDS) {
    if (!Object.prototype.hasOwnProperty.call(state.currencies, currency)) throw new TypeError(`Missing currency ${currency}`);
    assertNonNegativeInteger(state.currencies[currency], `${currency} balance`);
  }
  if (!isObject(state.gacha)) throw new TypeError("Invalid gacha state");
  if (!Number.isInteger(state.gacha.pullsSinceUR) || state.gacha.pullsSinceUR < 0 || state.gacha.pullsSinceUR > 79) {
    throw new TypeError("Invalid gacha pity state");
  }
  if (!isObject(state.unlocks)) throw new TypeError("Invalid unlocks");
  for (const [id, value] of Object.entries(state.unlocks)) {
    assertId(id, "unlock id");
    if (typeof value !== "boolean") throw new TypeError("Unlock flags must be boolean");
  }
  if (!isObject(state.rewardLedger)) throw new TypeError("Invalid reward ledger");
  for (const [eventId, applied] of Object.entries(state.rewardLedger)) {
    assertId(eventId, "reward event id");
    if (applied !== true) throw new TypeError("Reward ledger entries must be true");
  }
  if (!isObject(state.roster) || !Array.isArray(state.roster.supports) || state.roster.supports.length !== 2) {
    throw new TypeError("Invalid roster");
  }
  if (state.roster.activeBatter !== null) assertId(state.roster.activeBatter, "activeBatter");
  for (const support of state.roster.supports) if (support !== null) assertId(support, "support");
  return true;
}

export function freezeSnapshot(state) {
  const snapshot = clone(state);
  if (!isObject(snapshot.rewardLedger)) snapshot.rewardLedger = {};
  validatePlayerMetaState(snapshot);
  return deepFreeze(snapshot);
}

function actionResult(action, ok, reason, state) {
  return deepFreeze({
    ok,
    action: clone(action),
    reason: reason || null,
    snapshot: state
  });
}

function nextStateForAction(state, action) {
  const next = clone(state);
  const type = action?.type;
  if (!ACTION_TYPES.includes(type)) return { ok: false, reason: "INVALID_ACTION" };

  if (type === "ADD_CHARACTER" || type === "REMOVE_CHARACTER") {
    assertId(action.characterId, "characterId");
    assertNonNegativeInteger(action.quantity, "quantity");
    if (action.quantity === 0) return { ok: false, reason: "INVALID_QUANTITY" };
    const current = next.inventory.characters[action.characterId] || { quantity: 0, unlocked: false };
    if (type === "ADD_CHARACTER") {
      current.quantity += action.quantity;
      current.unlocked = true;
    } else {
      if (current.quantity < action.quantity) return { ok: false, reason: "INSUFFICIENT_CHARACTER_QUANTITY" };
      current.quantity -= action.quantity;
    }
    next.inventory.characters[action.characterId] = current;
  }

  if (type === "ADD_CURRENCY" || type === "SPEND_CURRENCY") {
    if (!CURRENCY_IDS.includes(action.currency)) return { ok: false, reason: "INVALID_CURRENCY" };
    assertNonNegativeInteger(action.amount, "amount");
    if (action.amount === 0) return { ok: false, reason: "INVALID_AMOUNT" };
    const current = next.currencies[action.currency];
    if (type === "SPEND_CURRENCY" && current < action.amount) return { ok: false, reason: "INSUFFICIENT_CURRENCY" };
    next.currencies[action.currency] = type === "ADD_CURRENCY" ? current + action.amount : current - action.amount;
  }

  if (type === "SET_UNLOCK") {
    assertId(action.id, "unlock id");
    if (typeof action.unlocked !== "boolean") return { ok: false, reason: "INVALID_UNLOCK_VALUE" };
    next.unlocks[action.id] = action.unlocked;
  }

  if (type === "UPDATE_GACHA_STATE") {
    assertNonNegativeInteger(action.pullsSinceUR, "pullsSinceUR");
    if (action.pullsSinceUR > 79) return { ok: false, reason: "INVALID_PITY" };
    next.gacha.pullsSinceUR = action.pullsSinceUR;
  }

  if (type === "RECORD_REWARD") {
    assertId(action.sourceEventId, "sourceEventId");
    if (next.rewardLedger[action.sourceEventId] === true) return { ok: false, reason: "REWARD_ALREADY_APPLIED" };
    next.rewardLedger[action.sourceEventId] = true;
  }

  if (type === "SET_ROSTER") {
    if (action.activeBatter !== null) assertId(action.activeBatter, "activeBatter");
    if (!Array.isArray(action.supports) || action.supports.length !== 2) return { ok: false, reason: "INVALID_SUPPORTS" };
    for (const support of action.supports) if (support !== null) assertId(support, "support");
    next.roster = { activeBatter: action.activeBatter, supports: [...action.supports] };
  }

  return { ok: true, state: freezeSnapshot(next) };
}

export class PlayerMetaAuthority {
  constructor(initialState = createInitialPlayerMetaState()) {
    validatePlayerMetaState(initialState);
    this._state = freezeSnapshot(initialState);
  }

  getSnapshot() {
    return this._state;
  }

  hasAppliedReward(sourceEventId) {
    assertId(sourceEventId, "sourceEventId");
    return this._state.rewardLedger[sourceEventId] === true;
  }

  dispatch(action) {
    if (!isObject(action) || typeof action.type !== "string") {
      return actionResult(action || null, false, "INVALID_ACTION", this._state);
    }
    try {
      const result = nextStateForAction(this._state, action);
      if (!result.ok) return actionResult(action, false, result.reason, this._state);
      this._state = result.state;
      return actionResult(action, true, null, this._state);
    } catch (error) {
      return actionResult(action, false, error.message || "INVALID_ACTION", this._state);
    }
  }

  dispatchBatch(actions = []) {
    if (!Array.isArray(actions) || actions.length === 0) {
      return deepFreeze({
        ok: false,
        actions: [],
        reason: "INVALID_ACTION_BATCH",
        snapshot: this._state
      });
    }

    let working = this._state;
    try {
      for (const action of actions) {
        if (!isObject(action) || typeof action.type !== "string") {
          return deepFreeze({
            ok: false,
            actions: clone(actions),
            reason: "INVALID_ACTION",
            snapshot: this._state
          });
        }
        const result = nextStateForAction(working, action);
        if (!result.ok) {
          return deepFreeze({
            ok: false,
            actions: clone(actions),
            reason: result.reason,
            snapshot: this._state
          });
        }
        working = result.state;
      }

      this._state = working;
      return deepFreeze({
        ok: true,
        actions: clone(actions),
        reason: null,
        snapshot: this._state
      });
    } catch (error) {
      return deepFreeze({
        ok: false,
        actions: clone(actions),
        reason: error.message || "INVALID_ACTION",
        snapshot: this._state
      });
    }
  }

  replaceSnapshot(state) {
    validatePlayerMetaState(state);
    this._state = freezeSnapshot(state);
    return this._state;
  }
}

export function serializePlayerMetaState(state) {
  validatePlayerMetaState(state);
  return JSON.stringify(state);
}

export function deserializePlayerMetaState(serialized) {
  if (typeof serialized !== "string") throw new TypeError("Serialized PlayerMetaState must be a string");
  return freezeSnapshot(JSON.parse(serialized));
}

export const PLAYER_META_SCHEMA_VERSION = SCHEMA_VERSION;
export const PLAYER_META_CURRENCIES = CURRENCY_IDS;
export const PLAYER_META_ACTION_TYPES = ACTION_TYPES;
