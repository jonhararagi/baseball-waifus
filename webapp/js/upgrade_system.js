import { deriveStats } from "./waifu_dex.js";

export const MAX_WAIFU_LEVEL = 50;
export const STAR_RANK_THRESHOLDS = Object.freeze([3, 8, 15, 25, 40]);
export const STAR_RANK_TIMING_BONUS = Object.freeze([0, 0.02, 0.04, 0.06, 0.08, 0.10]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}
function normalizeInventoryEntry(entry) {
  return entry && typeof entry === "object" ? entry : null;
}
export function getStarRank(duplicateCount = 0) {
  const duplicates = Math.max(0, Math.floor(Number(duplicateCount) || 0));
  let rank = 0;
  for (let index = 0; index < STAR_RANK_THRESHOLDS.length; index += 1) {
    if (duplicates >= STAR_RANK_THRESHOLDS[index]) rank = index + 1;
  }
  return rank;
}
export function getTimingBonusMultiplier(starRank = 0) {
  const index = Math.max(0, Math.min(STAR_RANK_TIMING_BONUS.length - 1, Math.floor(Number(starRank) || 0)));
  return STAR_RANK_TIMING_BONUS[index];
}
export function getUpgradeCost(level = 1) {
  const currentLevel = Math.max(1, Math.min(MAX_WAIFU_LEVEL, Math.floor(Number(level) || 1)));
  if (currentLevel >= MAX_WAIFU_LEVEL) return null;
  return {
    current_level: currentLevel,
    next_level: currentLevel + 1,
    scrap: 100 + ((currentLevel - 1) * 25),
    fragments: 1 + Math.floor((currentLevel - 1) / 5)
  };
}

export class UpgradeSystem {
  constructor({
    getWaifu = () => null,
    getInventoryEntry = () => null,
    getCurrencies = () => ({ scrap: 0, fragments: 0 }),
    consumeCurrencies = () => false,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = "baseball_waifus_upgrade_v1"
  } = {}) {
    this.getWaifu = getWaifu;
    this.getInventoryEntry = getInventoryEntry;
    this.getCurrencies = getCurrencies;
    this.consumeCurrencies = consumeCurrencies;
    this.storage = storage;
    this.storageKey = storageKey;
    this.progression = this._load();
  }
  canUpgrade(waifuId) {
    const id = String(waifuId || "");
    if (!id || !this.getInventoryEntry(id)) return false;
    const progression = this.getProgression(id);
    const cost = getUpgradeCost(progression.level);
    if (!cost) return false;
    const currencies = this._readCurrencies();
    return currencies.scrap >= cost.scrap && currencies.fragments >= cost.fragments;
  }
  getUpgradeCost(waifuId) {
    const id = String(waifuId || "");
    if (!id || !this.getInventoryEntry(id)) return null;
    return getUpgradeCost(this.getProgression(id).level);
  }
  upgradeWaifu(waifuId) {
    const id = String(waifuId || "");
    if (!this.getInventoryEntry(id)) throw new Error("Waifu must be unlocked before upgrading");
    const progression = this.getProgression(id);
    const cost = getUpgradeCost(progression.level);
    if (!cost) throw new Error("Waifu is already level 50");
    const currencies = this._readCurrencies();
    if (currencies.scrap < cost.scrap || currencies.fragments < cost.fragments) {
      throw new Error("Not enough Scrap or Fragments");
    }
    const spent = this.consumeCurrencies({ ...cost });
    if (spent === false) throw new Error("Unable to consume upgrade currencies");
    this.progression[id] = { level: progression.level + 1 };
    this._save();
    return this.getProgression(id);
  }
  getProgression(waifuId) {
    const id = String(waifuId || "");
    const waifu = this.getWaifu(id);
    const inventory = normalizeInventoryEntry(this.getInventoryEntry(id));
    if (!waifu || !inventory) return null;
    const level = Math.max(1, Math.min(MAX_WAIFU_LEVEL, Math.floor(Number(this.progression[id]?.level) || 1)));
    const duplicates = Math.max(0, Math.floor(Number(inventory.duplicate_count) || 0));
    const starRank = getStarRank(duplicates);
    const base = deriveStats(waifu);
    const timingBonus = getTimingBonusMultiplier(starRank);
    return {
      waifu_id: id,
      level,
      star_rank: starRank,
      duplicate_count: duplicates,
      timing_bonus_multiplier: timingBonus,
      stats: {
        swingPower: base.swingPower + ((level - 1) * 2),
        timingWindow: round(base.timingWindow * (1 + timingBonus), 4),
        scrapMultiplier: round(base.scrapMultiplier + ((level - 1) * 0.01), 2)
      },
      next_cost: getUpgradeCost(level)
    };
  }
  getAllProgression() {
    return Object.keys(this.progression).reduce((result, id) => {
      const value = this.getProgression(id);
      if (value) result[id] = value;
      return result;
    }, {});
  }
  _readCurrencies() {
    const currency = this.getCurrencies?.() || {};
    return {
      scrap: Math.max(0, Math.floor(Number(currency.scrap) || 0)),
      fragments: Math.max(0, Math.floor(Number(currency.fragments) || 0))
    };
  }
  _load() {
    try {
      const raw = this.storage?.getItem?.(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && parsed.waifus && typeof parsed.waifus === "object" ? parsed.waifus : {};
    } catch {
      return {};
    }
  }
  _save() {
    try {
      this.storage?.setItem?.(this.storageKey, JSON.stringify({ schema: 1, waifus: clone(this.progression) }));
    } catch {}
  }
}
