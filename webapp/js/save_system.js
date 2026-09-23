export const SAVE_VERSION = 2;
export const SAVE_STORAGE_KEY = "baseball_waifus_save_v2";
export const SAVE_DEFAULTS = Object.freeze({
  settings: Object.freeze({
    volume: 0.8,
    muted: false,
    quality: "auto"
  }),
  records: Object.freeze({
    cyberpunk: { high_score: 0, best_hits: 0, best_home_runs: 0 },
    beach: { high_score: 0, best_hits: 0, best_home_runs: 0 },
    volcano: { high_score: 0, best_hits: 0, best_home_runs: 0 },
    forest: { high_score: 0, best_hits: 0, best_home_runs: 0 }
  }),
  locker: Object.freeze({
    active_waifu_id: null,
    rapport: {},
    daily: { date: "", taps: 0 }
  }),
  admin: Object.freeze({
    version: 1,
    waifu_config: null,
    infinite_scrap: false
  })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nonNegative(value, fallback = 0) {
  return Math.max(0, Math.floor(numberOr(value, fallback)));
}

function normalizeRecords(records = {}) {
  const result = clone(SAVE_DEFAULTS.records);
  for (const biome of Object.keys(result)) {
    const source = isObject(records?.[biome]) ? records[biome] : {};
    result[biome] = {
      high_score: nonNegative(source.high_score),
      best_hits: nonNegative(source.best_hits),
      best_home_runs: nonNegative(source.best_home_runs)
    };
  }
  return result;
}

export function migrateSaveState(input = {}) {
  const source = isObject(input) ? clone(input) : {};
  const version = nonNegative(source.version, 0);

  const economy = isObject(source.economy)
    ? source.economy
    : {
        scrap: source.scavenger_scrap,
        fragments: source.fragment_bank
      };

  const inventory = isObject(source.inventory) ? source.inventory : {};
  const progression = isObject(source.progression) ? source.progression : {};
  const roster = isObject(source.roster)
    ? source.roster
    : {
        active_batter: source.active_batter,
        supports: source.supports
      };
  const gacha = isObject(source.gacha)
    ? source.gacha
    : {
        pulls_since_UR: source.pulls_since_UR
      };
  const settings = isObject(source.settings) ? source.settings : {};

  const locker = isObject(source.locker) ? source.locker : {};
  const lockerRapport = isObject(locker.rapport)
    ? locker.rapport
    : {};
  const normalizedLockerRapport = {};
  for (const [id, entry] of Object.entries(lockerRapport)) {
    const safe = isObject(entry) ? entry : {};
    const level = Math.min(10, Math.max(1, nonNegative(safe.level, 1) || 1));
    const unlocked = Array.isArray(safe.unlocked_skins)
      ? safe.unlocked_skins
      : Array.isArray(safe.unlockedSkins)
        ? safe.unlockedSkins
        : [];
    const uniqueSkins = [...new Set(["uniform_default", ...unlocked].filter((skin) => typeof skin === "string"))];
    const activeSkin = uniqueSkins.includes(String(safe.active_skin || safe.activeSkin || "uniform_default"))
      ? String(safe.active_skin || safe.activeSkin || "uniform_default")
      : "uniform_default";
    normalizedLockerRapport[id] = {
      level,
      unlocked_skins: uniqueSkins,
      active_skin: activeSkin
    };
  }

  const lockerDate = String(locker.daily?.date || "");

  const admin = isObject(source.admin) ? source.admin : {};
  const adminWaifuConfig = isObject(admin.waifu_config) && Array.isArray(admin.waifu_config.characters)
    ? clone(admin.waifu_config)
    : null;
  const todayTaps = Math.min(50, nonNegative(locker.daily?.taps));

  const migratedInventory = {};
  for (const [id, entry] of Object.entries(inventory)) {
    const safe = isObject(entry) ? entry : {};
    const progress = isObject(progression[id]) ? progression[id] : {};
    migratedInventory[id] = {
      ...safe,
      duplicate_count: nonNegative(safe.duplicate_count),
      level: Math.min(50, Math.max(1, nonNegative(safe.level, numberOr(progress.level, 1)) || 1)),
      star_rank: nonNegative(safe.star_rank, numberOr(progress.star_rank, 0))
    };
  }

  return {
    version: SAVE_VERSION,
    saved_at: new Date().toISOString(),
    economy: {
      scrap: nonNegative(economy.scrap),
      fragments: nonNegative(economy.fragments)
    },
    inventory: migratedInventory,
    progression: clone(progression),
    gacha: {
      pity: {
        pulls_since_UR: Math.min(79, nonNegative(gacha.pulls_since_UR))
      }
    },
    roster: {
      active_batter: roster.active_batter || null,
      supports: Array.isArray(roster.supports)
        ? [roster.supports[0] || null, roster.supports[1] || null]
        : [null, null]
    },
    settings: {
      volume: Math.min(1, Math.max(0, numberOr(settings.volume, SAVE_DEFAULTS.settings.volume))),
      muted: Boolean(settings.muted),
      quality: ["auto", "low", "medium", "high"].includes(settings.quality)
        ? settings.quality
        : SAVE_DEFAULTS.settings.quality
    },
    records: normalizeRecords(source.records),
    locker: {
      active_waifu_id: locker.active_waifu_id || locker.activeWaifuId || null,
      rapport: normalizedLockerRapport,
      daily: {
        date: lockerDate,
        taps: todayTaps
      }
    },
    admin: {
      version: Math.max(1, nonNegative(admin.version, 1)),
      waifu_config: adminWaifuConfig,
      infinite_scrap: Boolean(admin.infinite_scrap)
    }
  };
}

export class SaveSystem {
  constructor({
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = SAVE_STORAGE_KEY,
    providers = {},
    appliers = {}
  } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.providers = { ...providers };
    this.appliers = { ...appliers };
    this.state = migrateSaveState({});
  }

  setProviders(providers = {}) {
    this.providers = { ...this.providers, ...providers };
    return this;
  }

  setAppliers(appliers = {}) {
    this.appliers = { ...this.appliers, ...appliers };
    return this;
  }

  collect() {
    const gachaState = this.providers.gachaState?.() || {};
    const teamRoster = this.providers.teamRoster?.() || {};
    const audioSettings = this.providers.audioSettings?.() || {};
    const progression = this.providers.progression?.() || {};
    const records = this.providers.records?.() || this.state.records;
    const lockerRoom = this.providers.lockerRoom?.() || this.state.locker;
    const adminPanel = this.providers.adminPanel?.() || this.state.admin;

    const inventory = {};
    for (const [id, entry] of Object.entries(gachaState.inventory || {})) {
      const progress = progression[id] || {};
      inventory[id] = {
        character_id: entry?.character_id || id,
        display_name: entry?.display_name || id,
        rarity: entry?.rarity || null,
        obtained_at: entry?.obtained_at || null,
        last_obtained_at: entry?.last_obtained_at || null,
        duplicate_count: nonNegative(entry?.duplicate_count),
        level: Math.min(50, Math.max(1, nonNegative(progress.level, 1) || 1)),
        star_rank: nonNegative(progress.star_rank)
      };
    }

    const state = migrateSaveState({
      version: SAVE_VERSION,
      saved_at: new Date().toISOString(),
      economy: {
        scrap: gachaState.scavenger_scrap,
        fragments: gachaState.fragment_bank
      },
      inventory,
      progression,
      gacha: {
        pity: {
          pulls_since_UR: gachaState.pulls_since_UR
        }
      },
      roster: teamRoster,
      settings: {
        volume: audioSettings.volume,
        muted: audioSettings.muted,
        quality: this.providers.quality?.() || "auto"
      },
      records,
      locker: lockerRoom,
      admin: adminPanel
    });

    this.state = state;
    return clone(state);
  }

  save() {
    const state = this.collect();
    try {
      this.storage?.setItem?.(this.storageKey, JSON.stringify(state));
      return clone(state);
    } catch {
      return clone(state);
    }
  }

  load() {
    let raw = null;
    try {
      raw = this.storage?.getItem?.(this.storageKey);
    } catch {
      raw = null;
    }

    this.state = raw
      ? migrateSaveState(JSON.parse(raw))
      : migrateSaveState({});

    this._apply(this.state);
    return clone(this.state);
  }

  apply(state) {
    this.state = migrateSaveState(state);
    this._apply(this.state);
    this.save();
    return clone(this.state);
  }

  exportJson() {
    return JSON.stringify(this.collect(), null, 2);
  }

  async exportFile(filename = "baseball-waifus-save.json") {
    const json = this.exportJson();
    if (typeof document === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
      return json;
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return json;
  }

  async importJson(json) {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return this.apply(parsed);
  }

  async importFile(file) {
    if (!file || typeof file.text !== "function") {
      throw new TypeError("A JSON save file is required");
    }
    return this.importJson(await file.text());
  }

  updateRecord(biome, patch = {}) {
    const records = normalizeRecords(this.state.records);
    if (!Object.prototype.hasOwnProperty.call(records, biome)) return records;
    records[biome] = {
      high_score: Math.max(records[biome].high_score, nonNegative(patch.high_score)),
      best_hits: Math.max(records[biome].best_hits, nonNegative(patch.best_hits)),
      best_home_runs: Math.max(records[biome].best_home_runs, nonNegative(patch.best_home_runs))
    };
    this.state.records = records;
    this.save();
    return clone(records[biome]);
  }

  reset() {
    try {
      this.storage?.removeItem?.(this.storageKey);
    } catch {}
    this.state = migrateSaveState({});
    this._apply(this.state);
    return clone(this.state);
  }

  _apply(state) {
    this.appliers.gacha?.(state);
    this.appliers.team?.(state);
    this.appliers.progression?.(state);
    this.appliers.audio?.(state.settings);
    this.appliers.quality?.(state.settings.quality);
    this.appliers.records?.(state.records);
    this.appliers.lockerRoom?.(state.locker);
    this.appliers.adminPanel?.(state.admin);
  }
}

export function createSaveSystem(options = {}) {
  return new SaveSystem(options);
}
