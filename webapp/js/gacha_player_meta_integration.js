import {
  createInitialPlayerMetaState,
  createPlayerIdentity,
  PlayerMetaAuthority
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
}

function transaction(authority, persistenceAdapter, actions) {
  const before = authority.getSnapshot();
  try {
    for (const action of actions) {
      const result = authority.dispatch(action);
      if (!result.ok) throw new Error(result.reason || "PLAYER_META_ACTION_REJECTED");
    }
    const after = authority.getSnapshot();
    persistenceAdapter.save(after);
    return after;
  } catch (error) {
    authority.replaceSnapshot(before);
    try { persistenceAdapter.save(before); } catch { /* preserve the original failure */ }
    throw error;
  }
}

export class GachaPlayerMetaIntegration {
  constructor({ identity, authority, persistenceAdapter, now = () => Date.now() } = {}) {
    if (!authority || typeof authority.dispatch !== "function") throw new TypeError("PlayerMetaAuthority is required");
    if (!persistenceAdapter || typeof persistenceAdapter.save !== "function") throw new TypeError("PlayerMetaPersistenceAdapter is required");
    this.identity = createPlayerIdentity(identity || {});
    this.authority = authority;
    this.persistenceAdapter = persistenceAdapter;
    this.now = now;
  }

  getSnapshot() {
    return this.authority.getSnapshot();
  }

  getProgression(characterId) {
    const id = String(characterId || "");
    if (!id) return null;
    const snapshot = this.authority.getSnapshot();
    const ownership = snapshot.inventory.characters[id];
    if (!ownership?.unlocked || ownership.quantity <= 0) return null;
    const progression = snapshot.progression.characters[id];
    return progression ? { level: progression.level } : null;
  }

  hasPersistedState() {
    const key = this.persistenceAdapter.keyFor(this.identity);
    return this.persistenceAdapter.storage.getItem(key) !== null;
  }

  loadOrMigrate(legacyState, characterLookup = () => null) {
    if (this.hasPersistedState()) {
      return this.persistenceAdapter.load(this.identity);
    }

    const state = this.migrateLegacyState(legacyState, characterLookup);
    this.persistenceAdapter.save(state);
    return state;
  }

  ensureInitialCharacters(characterIds = [], activeBatter = null) {
    const ids = [...new Set((Array.isArray(characterIds) ? characterIds : [])
      .map((id) => String(id || ""))
      .filter(Boolean))];
    const current = this.authority.getSnapshot();
    const actions = ids
      .filter((id) => !current.inventory.characters[id]?.unlocked)
      .map((characterId) => ({ type: "ADD_CHARACTER", characterId, quantity: 1 }));
    const nextActiveBatter = current.roster.activeBatter
      || (activeBatter && current.inventory.characters[String(activeBatter)]?.unlocked
        ? String(activeBatter)
        : ids[0] || null);
    if (nextActiveBatter !== current.roster.activeBatter) {
      actions.push({ type: "SET_ROSTER", activeBatter: nextActiveBatter, supports: [...current.roster.supports] });
    }
    return actions.length ? transaction(this.authority, this.persistenceAdapter, actions) : current;
  }

  migrateLegacyState(legacyState, characterLookup = () => null) {
    if (!isObject(legacyState)) throw new TypeError("Invalid legacy Gacha state");
    const initial = createInitialPlayerMetaState(this.identity);
    this.authority.replaceSnapshot(initial);

    const actions = [];
    for (const [characterId, entry] of Object.entries(legacyState.inventory || {})) {
      const quantity = Math.max(0, Math.floor(Number(entry?.duplicate_count) || 0));
      if (quantity > 0) actions.push({ type: "ADD_CHARACTER", characterId, quantity });
    }
    const scrap = Math.max(0, Math.floor(Number(legacyState.scavenger_scrap) || 0));
    const fragments = Math.max(0, Math.floor(Number(legacyState.fragment_bank) || 0));
    if (scrap > 0) actions.push({ type: "ADD_CURRENCY", currency: "SCRAP", amount: scrap });
    if (fragments > 0) actions.push({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: fragments });
    actions.push({
      type: "UPDATE_GACHA_STATE",
      pullsSinceUR: Math.min(79, Math.max(0, Math.floor(Number(legacyState.pulls_since_UR) || 0)))
    });

    const activeBatter = legacyState.active_batter && legacyState.inventory?.[legacyState.active_batter]
      ? legacyState.active_batter
      : null;
    actions.push({ type: "SET_ROSTER", activeBatter, supports: [null, null] });

    if (actions.length) transaction(this.authority, this.persistenceAdapter, actions);
    return this.authority.getSnapshot();
  }

  hydrateGachaState(currentState, characterLookup = () => null) {
    const snapshot = this.authority.getSnapshot();
    const next = clone(currentState || {});
    next.pulls_since_UR = snapshot.gacha.pullsSinceUR;
    next.scavenger_scrap = snapshot.currencies.SCRAP;
    next.fragment_bank = snapshot.currencies.FRAGMENTS;
    next.active_batter = snapshot.roster.activeBatter;
    next.inventory = {};

    for (const [characterId, metaEntry] of Object.entries(snapshot.inventory.characters)) {
      const existing = currentState?.inventory?.[characterId] || {};
      const character = characterLookup(characterId) || {};
      next.inventory[characterId] = {
        character_id: characterId,
        display_name: existing.display_name || character.canonical?.display_name || characterId,
        rarity: existing.rarity || character.canonical?.rarity || "R",
        obtained_at: existing.obtained_at || this.now(),
        duplicate_count: metaEntry.quantity,
        last_obtained_at: existing.last_obtained_at || this.now()
      };
    }
    return next;
  }

  applyPull({ characterId, cost, duplicateFragmentReward = 0, pullsSinceUR, activateIfEmpty = true } = {}) {
    if (typeof characterId !== "string" || characterId.length === 0) throw new TypeError("characterId is required");
    assertNonNegativeInteger(cost, "Gacha cost");
    assertNonNegativeInteger(duplicateFragmentReward, "duplicate fragment reward");
    assertNonNegativeInteger(pullsSinceUR, "pullsSinceUR");
    if (pullsSinceUR > 79) throw new RangeError("pullsSinceUR must remain below 80");

    const current = this.authority.getSnapshot();
    if (current.currencies.SCRAP < cost) throw new Error("INSUFFICIENT_CURRENCY");

    const actions = [
      { type: "SPEND_CURRENCY", currency: "SCRAP", amount: cost },
      { type: "ADD_CHARACTER", characterId, quantity: 1 }
    ];
    if (duplicateFragmentReward > 0) {
      actions.push({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: duplicateFragmentReward });
    }
    actions.push({ type: "UPDATE_GACHA_STATE", pullsSinceUR });

    const activeBatter = activateIfEmpty && current.roster.activeBatter === null
      ? characterId
      : current.roster.activeBatter;
    actions.push({
      type: "SET_ROSTER",
      activeBatter,
      supports: [...current.roster.supports]
    });

    return transaction(this.authority, this.persistenceAdapter, actions);
  }

  addCurrency(currency, amount) {
    assertNonNegativeInteger(amount, "amount");
    if (amount === 0) return this.authority.getSnapshot();
    return transaction(this.authority, this.persistenceAdapter, [
      { type: "ADD_CURRENCY", currency, amount }
    ]);
  }

  spendCurrencies({ scrap = 0, fragments = 0 } = {}) {
    assertNonNegativeInteger(scrap, "scrap");
    assertNonNegativeInteger(fragments, "fragments");
    const actions = [];
    if (scrap > 0) actions.push({ type: "SPEND_CURRENCY", currency: "SCRAP", amount: scrap });
    if (fragments > 0) actions.push({ type: "SPEND_CURRENCY", currency: "FRAGMENTS", amount: fragments });
    if (!actions.length) return this.authority.getSnapshot();
    return transaction(this.authority, this.persistenceAdapter, actions);
  }

  migrateLegacyProgression(legacyProgression = {}) {
    if (!isObject(legacyProgression)) return this.authority.getSnapshot();
    const current = this.authority.getSnapshot();
    const actions = [];
    for (const [characterId, entry] of Object.entries(legacyProgression)) {
      const ownership = current.inventory.characters[characterId];
      if (!ownership?.unlocked || ownership.quantity <= 0) continue;
      const legacyLevel = Number(entry?.level ?? entry);
      if (!Number.isInteger(legacyLevel) || legacyLevel < 1) continue;
      const level = Math.min(50, legacyLevel);
      const currentLevel = current.progression.characters[characterId]?.level || 1;
      if (level > currentLevel) actions.push({ type: "SET_CHARACTER_PROGRESSION", characterId, level });
    }
    return actions.length ? transaction(this.authority, this.persistenceAdapter, actions) : current;
  }

  upgradeCharacter(characterId, { nextLevel, scrapCost = 0, fragmentsCost = 0 } = {}) {
    const id = String(characterId || "");
    if (!id) throw new TypeError("characterId is required");
    if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > 50) throw new RangeError("nextLevel must be between 1 and 50");
    assertNonNegativeInteger(scrapCost, "scrapCost");
    assertNonNegativeInteger(fragmentsCost, "fragmentsCost");
    const current = this.authority.getSnapshot();
    const ownership = current.inventory.characters[id];
    if (!ownership?.unlocked || ownership.quantity <= 0) throw new Error("CHARACTER_NOT_OWNED");
    const currentLevel = current.progression.characters[id]?.level || 1;
    if (nextLevel !== currentLevel + 1) throw new Error("INVALID_CHARACTER_LEVEL_STEP");
    if (currentLevel >= 50) throw new Error("CHARACTER_LEVEL_MAX");
    const actions = [];
    if (scrapCost > 0) actions.push({ type: "SPEND_CURRENCY", currency: "SCRAP", amount: scrapCost });
    if (fragmentsCost > 0) actions.push({ type: "SPEND_CURRENCY", currency: "FRAGMENTS", amount: fragmentsCost });
    actions.push({ type: "SET_CHARACTER_PROGRESSION", characterId: id, level: nextLevel });
    return transaction(this.authority, this.persistenceAdapter, actions);
  }

  setActiveBatter(characterId) {
    if (typeof characterId !== "string" || characterId.length === 0) throw new TypeError("active batter is required");
    const current = this.authority.getSnapshot();
    if (!current.inventory.characters[characterId]?.unlocked) throw new Error("ACTIVE_BATTER_NOT_UNLOCKED");
    return transaction(this.authority, this.persistenceAdapter, [{
      type: "SET_ROSTER",
      activeBatter: characterId,
      supports: [...current.roster.supports]
    }]);
  }
}

export function createGachaPlayerMetaIntegration(options = {}) {
  return new GachaPlayerMetaIntegration(options);
}
