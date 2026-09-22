export const MAX_SUPPORT_WAIFUS = 2;
export const BIOME_SYNERGY_MULTIPLIER = 1.15;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeArea(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function getFavoriteAreas(unit) {
  const value = unit?.canonical?.favorite_area ?? unit?.canonical?.area_favorite ?? unit?.favorite_area ?? null;
  if (Array.isArray(value)) return value.filter(Boolean).map(normalizeArea);
  if (value) return [normalizeArea(value)];
  return [];
}
export function hasBiomeSynergy(unit, stadiumArea) {
  const stadium = normalizeArea(stadiumArea);
  return Boolean(stadium && getFavoriteAreas(unit).includes(stadium));
}

export class TeamManager {
  constructor({
    getCharacter = () => null,
    getInventory = () => ({}),
    getExternalActive = () => null,
    persistActiveBatter = null,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = "baseball_waifus_team_v1"
  } = {}) {
    this.getCharacter = getCharacter;
    this.getInventory = getInventory;
    this.getExternalActive = getExternalActive;
    this.persistActiveBatter = persistActiveBatter;
    this.storage = storage;
    this.storageKey = storageKey;
    this.state = this._load();
    this._sanitizeState();
  }
  getRoster() {
    return { active_batter: this.state.active_batter, supports: [...this.state.supports] };
  }
  getActiveBatterId() { return this.state.active_batter; }
  getActiveWaifu() { return this.state.active_batter ? clone(this.getCharacter(this.state.active_batter)) : null; }
  getSupportIds() { return [...this.state.supports]; }
  getSupportWaifus() {
    return this.state.supports.filter(Boolean).map((id) => clone(this.getCharacter(id))).filter(Boolean);
  }
  setActiveBatter(waifuId) {
    const id = String(waifuId || "");
    if (!this._isUnlocked(id)) throw new Error("Only unlocked waifus can become the active batter");
    this.state.active_batter = id;
    this.state.supports = this.state.supports.filter((supportId) => supportId !== id);
    this._save();
    this.persistActiveBatter?.(id);
    return this.getRoster();
  }
  setSupport(slot, waifuId) {
    const index = Math.floor(Number(slot) || 0);
    if (index < 0 || index >= MAX_SUPPORT_WAIFUS) throw new Error("Support slot must be 0 or 1");
    const id = waifuId ? String(waifuId) : "";
    if (id && !this._isUnlocked(id)) throw new Error("Only unlocked waifus can enter the support roster");
    if (id && id === this.state.active_batter) throw new Error("Active batter cannot also be a support");
    if (id && this.state.supports.some((supportId, supportIndex) => supportId === id && supportIndex !== index)) {
      throw new Error("A waifu can only occupy one support slot");
    }
    this.state.supports[index] = id || null;
    this._save();
    return this.getRoster();
  }
  clearSupport(slot) { return this.setSupport(slot, null); }
  getTimingWindowMultiplier(stadiumArea) {
    return hasBiomeSynergy(this.getActiveWaifu(), stadiumArea) ? BIOME_SYNERGY_MULTIPLIER : 1;
  }
  applyCombatModifiers(dto) {
    const areaId = dto?.area_id || dto?.area?.id || "cyberpunk";
    const active = this.getActiveWaifu();
    return {
      ...dto,
      team_roster: this.getRoster(),
      active_batter: active ? {
        character_id: active.character_id,
        favorite_area: active.canonical?.favorite_area || active.canonical?.area_favorite || null
      } : null,
      team_modifiers: {
        ...(dto?.team_modifiers || {}),
        timing_window_multiplier: this.getTimingWindowMultiplier(areaId)
      }
    };
  }
  _isUnlocked(id) { return Boolean(id && this.getInventory()?.[id]); }
  _sanitizeState() {
    const inventory = this.getInventory() || {};
    const externalActive = String(this.getExternalActive?.() || "");
    if (!this.state.active_batter || !inventory[this.state.active_batter]) {
      this.state.active_batter = inventory[externalActive] ? externalActive : null;
    }
    const used = new Set();
    this.state.supports = this.state.supports
      .map((id) => String(id || ""))
      .map((id) => id && inventory[id] ? id : null)
      .map((id) => {
        if (!id || id === this.state.active_batter || used.has(id)) return null;
        used.add(id);
        return id;
      });
    this._save();
  }
  _load() {
    try {
      const raw = this.storage?.getItem?.(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        active_batter: parsed?.active_batter || null,
        supports: Array.isArray(parsed?.supports) ? [parsed.supports[0] || null, parsed.supports[1] || null] : [null, null]
      };
    } catch {
      return { active_batter: null, supports: [null, null] };
    }
  }
  _save() {
    try {
      this.storage?.setItem?.(this.storageKey, JSON.stringify({ schema: 1, active_batter: this.state.active_batter, supports: this.state.supports }));
    } catch {}
  }
}
