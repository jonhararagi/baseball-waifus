function assertCharacterId(id, label = "characterId") {
  if (typeof id !== "string" || !/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 128) {
    throw new TypeError(label + " must be a non-empty stable identifier");
  }
}

function normalizeSupportList(supports) {
  if (!Array.isArray(supports) || supports.length !== 2) throw new TypeError("supports must contain exactly two slots");
  return supports.map((id) => (id === null || id === undefined || id === "" ? null : String(id)));
}

function validateRosterSelection(snapshot, activeBatter, supports) {
  const normalizedActive = activeBatter === null || activeBatter === undefined || activeBatter === "" ? null : String(activeBatter);
  const normalizedSupports = normalizeSupportList(supports);
  if (normalizedActive !== null) {
    assertCharacterId(normalizedActive, "activeBatter");
    if (!snapshot.inventory.characters[normalizedActive]?.unlocked) throw new Error("ACTIVE_BATTER_NOT_UNLOCKED");
  }
  const seen = new Set();
  for (const support of normalizedSupports) {
    if (support === null) continue;
    assertCharacterId(support, "support");
    if (!snapshot.inventory.characters[support]?.unlocked) throw new Error("SUPPORT_NOT_UNLOCKED");
    if (support === normalizedActive) throw new Error("ACTIVE_BATTER_CANNOT_BE_SUPPORT");
    if (seen.has(support)) throw new Error("DUPLICATE_SUPPORT");
    seen.add(support);
  }
  return { activeBatter: normalizedActive, supports: normalizedSupports };
}

import { isStaleWriteError } from "./player_meta_persistence_adapter.js";

function persistRosterChange(integration, nextRoster) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const before = integration.authority.getSnapshot();
    try {
      const result = integration.authority.dispatch({
        type: "SET_ROSTER",
        activeBatter: nextRoster.activeBatter,
        supports: [...nextRoster.supports]
      });
      if (!result.ok) throw new Error(result.reason || "PLAYER_META_ACTION_REJECTED");
      const after = integration.authority.getSnapshot();
      integration.persistenceAdapter.save(after);
      return after;
    } catch (error) {
      integration.authority.replaceSnapshot(before);
      if (isStaleWriteError(error) && attempt === 0) {
        const latest = integration.persistenceAdapter.load(before.identity);
        validateRosterSelection(latest, nextRoster.activeBatter, nextRoster.supports);
        integration.authority.replaceSnapshot(latest);
        continue;
      }
      throw error;
    }
  }
  throw new Error("PLAYER_META_CONCURRENCY_RETRY_EXHAUSTED");
}

export class PlayerMetaRosterIntegration {
  constructor({ playerMetaIntegration } = {}) {
    if (!playerMetaIntegration?.authority || !playerMetaIntegration?.persistenceAdapter) throw new TypeError("PlayerMetaIntegration with authority and persistence adapter is required");
    this.playerMetaIntegration = playerMetaIntegration;
    this.authority = playerMetaIntegration.authority;
    this.persistenceAdapter = playerMetaIntegration.persistenceAdapter;
  }
  getSnapshot() { return this.authority.getSnapshot(); }
  getRoster() { const roster = this.getSnapshot().roster; return { active_batter: roster.activeBatter, supports: [...roster.supports] }; }
  getInventory() { return this.getSnapshot().inventory.characters; }
  getOwnership(characterId) {
    assertCharacterId(String(characterId));
    const entry = this.getInventory()[characterId];
    return entry ? { quantity: entry.quantity, unlocked: entry.unlocked } : null;
  }
  isOwned(characterId) { const entry = this.getOwnership(characterId); return Boolean(entry && entry.quantity > 0); }
  isUnlocked(characterId) { const entry = this.getOwnership(characterId); return Boolean(entry?.unlocked); }
  setRoster({ activeBatter = null, supports = [null, null] } = {}) {
    const nextRoster = validateRosterSelection(this.getSnapshot(), activeBatter, supports);
    persistRosterChange(this, nextRoster);
    return this.getRoster();
  }
  setActiveBatter(characterId) {
    const id = String(characterId || "");
    if (!id) throw new TypeError("active batter is required");
    const current = this.getRoster();
    return this.setRoster({ activeBatter: id, supports: current.supports.map((support) => support === id ? null : support) });
  }
  setSupport(slot, characterId = null) {
    const index = Math.floor(Number(slot));
    if (!Number.isInteger(index) || index < 0 || index > 1) throw new Error("Support slot must be 0 or 1");
    const current = this.getRoster();
    const supports = [...current.supports];
    supports[index] = characterId === null || characterId === undefined || characterId === "" ? null : String(characterId);
    return this.setRoster({ activeBatter: current.active_batter, supports });
  }
  clearSupport(slot) { return this.setSupport(slot, null); }
  buildRosterView(characters = []) {
    const snapshot = this.getSnapshot();
    const roster = snapshot.roster;
    const supportSlots = new Map(roster.supports.filter(Boolean).map((id, index) => [id, index]));
    return characters.map((unit) => {
      const id = String(unit?.character_id || "");
      const ownership = snapshot.inventory.characters[id] || null;
      return Object.freeze({
        character_id: id,
        owned: Boolean(ownership && ownership.quantity > 0),
        unlocked: Boolean(ownership?.unlocked),
        quantity: ownership?.quantity || 0,
        active_batter: roster.activeBatter === id,
        support_slot: supportSlots.has(id) ? supportSlots.get(id) : null
      });
    });
  }
}

export function createPlayerMetaRosterIntegration(options = {}) { return new PlayerMetaRosterIntegration(options); }