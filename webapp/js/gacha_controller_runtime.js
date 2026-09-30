import { buildSharePayload } from "./share_bridge.js";
import { duplicateReward } from "./gacha_engine.js";
const DEFAULT_SCHEMA_URL = "./data/game_schemas_recycled.json";
const DEFAULT_QUEUE_URL = "./data/characters_queue.json";
const DEFAULT_STORAGE_KEY = "baseball_waifus_gacha_v1";
const PULL_LIMIT = 80;
export const SCAVENGER_SCRAP_COST = 1000;

const TELEGRAM_CLOUD_KEY = "waifu_dex_state";

function callCloudMethod(cloudStorage, methodName, args = []) {
  return new Promise((resolve, reject) => {
    if (!cloudStorage || typeof cloudStorage[methodName] !== "function") {
      reject(new Error("Telegram CloudStorage unavailable"));
      return;
    }
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (error) reject(error instanceof Error ? error : new Error(String(error || "CloudStorage error")));
      else resolve(value);
    };
    try {
      const result = cloudStorage[methodName](...args, finish);
      if (result && typeof result.then === "function") {
        result.then((value) => finish(null, value)).catch(finish);
      } else if (result !== undefined && cloudStorage[methodName].length <= args.length) {
        finish(null, result);
      }
    } catch (error) {
      finish(error);
    }
  });
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clampUnit(value) {
  if (!Number.isFinite(Number(value))) {
    return 0.5;
  }
  return Math.min(0.999999999, Math.max(0, Number(value)));
}

function pickRandom(list, rng) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Gacha pool is empty");
  }
  return list[Math.floor(clampUnit(rng()) * list.length)];
}

function normalizeQueue(queue) {
  if (!isObject(queue)) {
    throw new TypeError("Invalid characters queue");
  }

  const units = [
    {
      schema_version: queue.schema_version,
      character_id: queue.character_id,
      canonical: queue.canonical,
      pollinations: queue.pollinations,
      pixel_art_generator: queue.pixel_art_generator,
      animation_layers: queue.animation_layers
    },
    ...(Array.isArray(queue.batch_units) ? queue.batch_units : [])
  ];

  return units
    .filter((unit) => isObject(unit?.canonical) && typeof unit.character_id === "string")
    .map((unit) => ({
      character_id: unit.character_id,
      canonical: unit.canonical,
      pollinations: unit.pollinations || null,
      pixel_art_generator: unit.pixel_art_generator || null,
      animation_layers: unit.animation_layers || null,
      production_targets: unit.production_targets || null
    }));
}

function validateSchema(schema) {
  if (!isObject(schema) || !isObject(schema.gacha)) {
    throw new TypeError("Invalid gacha schema");
  }

  const rates = schema.gacha.rates;
  const pity = schema.gacha.pity;

  if (
    !isObject(rates)
    || rates.status !== "active_canonical_game_table_v1"
    || !["R", "SR", "SSR", "UR"].every((rarity) => Number.isFinite(Number(rates[rarity])))
  ) {
    throw new Error("Canonical gacha rates are not active");
  }

  const total = Number(rates.R) + Number(rates.SR) + Number(rates.SSR) + Number(rates.UR);
  if (Math.abs(total - 100) > 0.000001) {
    throw new Error("Canonical gacha rates must sum to 100");
  }

  if (
    !isObject(pity)
    || pity.model !== "per_banner_counter"
    || !isObject(pity.soft_pity)
    || !isObject(pity.hard_pity)
  ) {
    throw new Error("Invalid gacha pity schema");
  }

  return schema;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function calculateGachaProbabilities(schema, pullNumber) {
  validateSchema(schema);

  const rates = schema.gacha.rates;
  const soft = schema.gacha.pity.soft_pity;
  const hard = schema.gacha.pity.hard_pity;
  const pull = Math.max(1, Math.min(PULL_LIMIT, Number(pullNumber) || 1));

  if (hard.enabled && pull >= Number(hard.pull_limit)) {
    return {
      R: 0,
      SR: 0,
      SSR: 0,
      UR: 100,
      soft_pity_active: false,
      hard_pity_triggered: true,
      ur_chance_percent: 100,
      pull_number: pull
    };
  }

  const softStart = Number(soft.start_pull);
  const increment = Number(soft.increment_per_pull_percent);
  const softPityActive = Boolean(
    soft.enabled
    && pull >= softStart
    && pull < Number(hard.pull_limit)
  );
  const urBonus = softPityActive
    ? (pull - softStart + 1) * increment
    : 0;

  const ur = Number(rates.UR) + urBonus;

  return {
    R: Number(rates.R) - urBonus,
    SR: Number(rates.SR),
    SSR: Number(rates.SSR),
    UR: ur,
    soft_pity_active: softPityActive,
    hard_pity_triggered: false,
    ur_chance_percent: ur,
    pull_number: pull
  };
}

function rollRarity(rates, rng) {
  const roll = clampUnit(rng()) * 100;
  let cursor = 0;

  for (const rarity of ["R", "SR", "SSR", "UR"]) {
    cursor += Number(rates[rarity]);
    if (roll < cursor) {
      return rarity;
    }
  }

  return "UR";
}

export class GachaController {
  constructor({
    schemaUrl = DEFAULT_SCHEMA_URL,
    queueUrl = DEFAULT_QUEUE_URL,
    storageKey = DEFAULT_STORAGE_KEY,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    fetchImpl = typeof globalThis !== "undefined" ? globalThis.fetch?.bind(globalThis) : null,
    audioBridge = null,
    cutInRenderer = null,
    hapticsBridge = null,
    cloudStorage = null,
    rng = Math.random,
    now = () => Date.now()
  } = {}) {
    this.schemaUrl = schemaUrl;
    this.queueUrl = queueUrl;
    this.storageKey = storageKey;
    this.storage = storage;
    this.fetchImpl = fetchImpl;
    this.audioBridge = audioBridge;
    this.cutInRenderer = cutInRenderer;
    this.hapticsBridge = hapticsBridge || null;
    this.cloudStorage = cloudStorage || null;
    this.cloudWritePromise = Promise.resolve(false);
    this.rng = rng;
    this.now = now;

    this.schema = null;
    this.queue = [];
    this.pools = {
      R: [],
      SR: [],
      SSR: [],
      UR: []
    };
    this.state = {
      pulls_since_UR: 0,
      inventory: {},
      active_batter: null,
      scavenger_scrap: 0,
      fragment_bank: 0
    };
    this.ready = false;
    this.listeners = new Set();
  }

  async initialize() {
    this.state = {
      pulls_since_UR: 0,
      inventory: {},
      active_batter: null,
      scavenger_scrap: 0,
      fragment_bank: 0
    };

    const restoredFromCloud = await this._restoreCloudState();
    if (!restoredFromCloud) {
      this._loadState();
    }

    if (typeof this.fetchImpl !== "function") {
      throw new Error("GachaController requires fetch");
    }

    const [schemaResponse, queueResponse] = await Promise.all([
      this.fetchImpl(this.schemaUrl, { cache: "no-cache" }),
      this.fetchImpl(this.queueUrl, { cache: "no-cache" })
    ]);

    if (!schemaResponse?.ok || !queueResponse?.ok) {
      throw new Error("Unable to load local gacha configuration");
    }

    const schema = await schemaResponse.json();
    const queue = await queueResponse.json();

    this.schema = validateSchema(schema);
    this.queue = normalizeQueue(queue);

    for (const rarity of Object.keys(this.pools)) {
      this.pools[rarity] = this.queue.filter(
        (unit) => String(unit.canonical?.rarity || "").toUpperCase() === rarity
      );
    }

    for (const rarity of Object.keys(this.pools)) {
      if (this.pools[rarity].length === 0) {
        throw new Error(`Missing local gacha pool for ${rarity}`);
      }
    }

    this.ready = true;
    this._emit();
    return this;
  }

  setHapticsBridge(hapticsBridge) {
    this.hapticsBridge = hapticsBridge || null;
  }

  setCloudStorage(cloudStorage) {
    this.cloudStorage = cloudStorage || null;
  }

  async flushPersistence() {
    return this.cloudWritePromise;
  }

  setAudioBridge(audioBridge) {
    this.audioBridge = audioBridge || null;
  }

  setCutInRenderer(renderer) {
    this.cutInRenderer = renderer || null;
  }

  getState() {
    return clone(this.state);
  }

  getStatus() {
    const pullsSinceUr = Number(this.state.pulls_since_UR) || 0;
    const scrap = Math.max(0, Number(this.state.scavenger_scrap) || 0);
    return {
      pulls_since_UR: pullsSinceUr,
      next_pull: Math.min(PULL_LIMIT, pullsSinceUr + 1),
      hard_pity_in: Math.max(0, PULL_LIMIT - pullsSinceUr),
      inventory_size: Object.keys(this.state.inventory || {}).length,
      active_batter: this.state.active_batter || null,
      scavenger_scrap: scrap,
      fragments: Math.max(0, Number(this.state.fragment_bank) || 0),
      recruit_cost: SCAVENGER_SCRAP_COST,
      can_afford_recruit: scrap >= SCAVENGER_SCRAP_COST,
      ready: this.ready
    };
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCharacters() {
    return clone(this.queue);
  }

  getCharacter(characterId) {
    const id = String(characterId || "");
    return clone(this.queue.find((unit) => unit.character_id === id) || null);
  }

  async rollGachaTen() {
    if (!this.ready) throw new Error("GachaController is not initialized");
    if (this.getScavengerScrap() < SCAVENGER_SCRAP_COST * 10) {
      throw new Error("Not enough Scavenger Scrap for a 10x recruit");
    }

    const results = [];
    let lastStateBeforePull = null;
    for (let index = 0; index < 10; index += 1) {
      lastStateBeforePull = clone(this.state);
      results.push(await this.rollGacha());
    }

    const hasSrOrHigher = results.some((result) => ["SR", "SSR", "UR"].includes(result.rarity));
    if (!hasSrOrHigher) {
      this.state = lastStateBeforePull;
      const originalRng = this.rng;
      let rollCall = 0;
      this.rng = () => {
        rollCall += 1;
        return rollCall === 1 ? 0.8 : originalRng();
      };
      try {
        results[results.length - 1] = await this.rollGacha();
      } finally {
        this.rng = originalRng;
      }
      results[results.length - 1].ten_pull_guarantee = "SR";
    }

    return {
      count: 10,
      results,
      totals: results.reduce((summary, result) => {
        summary[result.rarity] = (summary[result.rarity] || 0) + 1;
        return summary;
      }, {}),
      state: this.getStatus()
    };
  }

  getActiveBatter() {
    return this.state.active_batter || null;
  }

  getSharePayload(characterId, rarityOverride = null) {
    const character = this.getCharacter(characterId);
    if (!character) return null;
    return buildSharePayload(
      character,
      rarityOverride || character.canonical?.rarity || "R",
      typeof window !== "undefined" ? window.location.href : null
    );
  }

  setActiveBatter(characterId) {
    const id = String(characterId || "");
    if (!id || !this.state.inventory[id]) throw new Error("Active batter must be unlocked in the Waifu Dex");
    this.state.active_batter = id;
    this._saveState();
    this._emit();
    return id;
  }

  getScavengerScrap() {
    return Math.max(0, Number(this.state.scavenger_scrap) || 0);
  }

  addScrap(amount) {
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    this.state.scavenger_scrap = this.getScavengerScrap() + delta;
    this._saveState();
    this._emit();
    return this.state.scavenger_scrap;
  }

  getFragments() {
    return Math.max(0, Number(this.state.fragment_bank) || 0);
  }

  addFragments(amount) {
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    this.state.fragment_bank = this.getFragments() + delta;
    this._saveState();
    this._emit();
    return this.state.fragment_bank;
  }

  spendScrapAndFragments({ scrap = 0, fragments = 0 } = {}) {
    const scrapCost = Math.max(0, Math.floor(Number(scrap) || 0));
    const fragmentCost = Math.max(0, Math.floor(Number(fragments) || 0));
    if (this.getScavengerScrap() < scrapCost) throw new Error("Not enough Scavenger Scrap");
    if (this.getFragments() < fragmentCost) throw new Error("Not enough Fragments");
    this.state.scavenger_scrap = this.getScavengerScrap() - scrapCost;
    this.state.fragment_bank = this.getFragments() - fragmentCost;
    this._saveState();
    this._emit();
    return { scrap: this.state.scavenger_scrap, fragments: this.state.fragment_bank };
  }

  _spendScrap(amount) {
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    const current = this.getScavengerScrap();
    if (current < cost) throw new Error("Not enough Scavenger Scrap");
    this.state.scavenger_scrap = current - cost;
  }

  async rollGacha() {
    if (!this.ready) {
      throw new Error("GachaController is not initialized");
    }

    if (this.getScavengerScrap() < SCAVENGER_SCRAP_COST) {
      throw new Error("Not enough Scavenger Scrap");
    }

    this._playAudio("ui.confirm");
    this._playHaptics("ui_confirm");

    const pullNumber = Math.min(PULL_LIMIT, this.state.pulls_since_UR + 1);
    const probabilities = calculateGachaProbabilities(this.schema, pullNumber);
    const hardPityTriggered = probabilities.hard_pity_triggered;

    let rarity;
    if (hardPityTriggered) {
      rarity = "UR";
    } else {
      rarity = rollRarity(probabilities, this.rng);
    }

    const unit = pickRandom(this.pools[rarity], this.rng);
    const character = clone(unit);
    const characterId = character.character_id;

    const previous = this.state.inventory[characterId] || {
      character_id: characterId,
      display_name: character.canonical?.display_name || characterId,
      rarity,
      obtained_at: this.now(),
      duplicate_count: 0
    };

    previous.duplicate_count += 1;
    previous.last_obtained_at = this.now();

    const duplicateRewardData = previous.duplicate_count > 1 ? duplicateReward(rarity) : { fragments: 0, scrap: 0 };
    const duplicateFragmentReward = Math.max(0, Number(duplicateRewardData.fragments) || 0);
    if (duplicateFragmentReward > 0) {
      this.state.fragment_bank = this.getFragments() + duplicateFragmentReward;
    }

    this.state.inventory[characterId] = previous;
    if (!this.state.active_batter) this.state.active_batter = characterId;
    this.state.pulls_since_UR = rarity === "UR" ? 0 : pullNumber;
    this._spendScrap(SCAVENGER_SCRAP_COST);
    this._saveState();

    const result = {
      pull_number: pullNumber,
      rarity,
      character,
      duplicate_count: previous.duplicate_count,
      duplicate_fragment_reward: duplicateFragmentReward,
      fragments: this.getFragments(),
      pulls_since_UR: this.state.pulls_since_UR,
      soft_pity_active: probabilities.soft_pity_active,
      hard_pity_triggered: hardPityTriggered,
      probabilities: clone(probabilities),
      share: this.getSharePayload(characterId, rarity)
    };

    this._playAudio("gacha.reveal_" + String(rarity).toLowerCase());

    if (hardPityTriggered) {
      this._playAudio("gacha.pity_trigger");
    }

    if (rarity === "SSR" || rarity === "UR") {
      this._playHaptics("gacha_ssr");
      await this.cutInRenderer?.showGachaCutIn?.({
        rarity,
        character
      });
    }

    this._emit(result);
    return result;
  }

  _playHaptics(event) {
    if (!this.hapticsBridge || typeof this.hapticsBridge.handleGameEvent !== "function") return false;
    return Boolean(this.hapticsBridge.handleGameEvent(event));
  }

  _playAudio(soundId) {
    if (!this.audioBridge || typeof this.audioBridge.play !== "function") {
      return false;
    }
    return Boolean(this.audioBridge.play(soundId));
  }

  _applyPersistedState(parsed) {
    if (!isObject(parsed)) return false;
    const pulls = Number(parsed.pulls_since_UR);
    if (Number.isFinite(pulls) && pulls >= 0) this.state.pulls_since_UR = Math.min(PULL_LIMIT - 1, Math.floor(pulls));
    if (isObject(parsed.inventory)) this.state.inventory = parsed.inventory;
    const activeBatter = String(parsed.active_batter || "");
    this.state.active_batter = activeBatter && this.state.inventory[activeBatter] ? activeBatter : null;
    const scrap = Number(parsed.scavenger_scrap);
    if (Number.isFinite(scrap) && scrap >= 0) this.state.scavenger_scrap = Math.floor(scrap);
    const fragments = Number(parsed.fragment_bank);
    if (Number.isFinite(fragments) && fragments >= 0) this.state.fragment_bank = Math.floor(fragments);
    return true;
  }

  _serializeState() {
    return JSON.stringify({
      pulls_since_UR: this.state.pulls_since_UR,
      inventory: this.state.inventory,
      active_batter: this.state.active_batter,
      scavenger_scrap: this.state.scavenger_scrap,
      fragment_bank: this.getFragments()
    });
  }

  _loadState() {
    if (!this.storage || typeof this.storage.getItem !== "function") return;
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (raw) this._applyPersistedState(JSON.parse(raw));
    } catch {
      this.state = { pulls_since_UR: 0, inventory: {}, active_batter: null, scavenger_scrap: 0, fragment_bank: 0 };
    }
  }

  _writeLocalState() {
    if (!this.storage || typeof this.storage.setItem !== "function") return false;
    try {
      this.storage.setItem(this.storageKey, this._serializeState());
      return true;
    } catch {
      return false;
    }
  }

  async _restoreCloudState() {
    if (!this.cloudStorage) return false;
    try {
      const raw = await callCloudMethod(this.cloudStorage, "getItem", [TELEGRAM_CLOUD_KEY]);
      if (typeof raw !== "string" || raw.trim() === "") return false;
      const parsed = JSON.parse(raw);
      if (!isObject(parsed)) return false;
      this._applyPersistedState(parsed);
      this._writeLocalState();
      return true;
    } catch {
      return false;
    }
  }

  _pushCloudState(snapshot) {
    if (!this.cloudStorage) return;
    this.cloudWritePromise = this.cloudWritePromise
      .catch(() => false)
      .then(() => callCloudMethod(this.cloudStorage, "setItem", [TELEGRAM_CLOUD_KEY, snapshot]))
      .catch(() => false);
  }

  _saveState() {
    const snapshot = this._serializeState();
    this._writeLocalState();
    this._pushCloudState(snapshot);
  }

  _emit(payload = null) {
    for (const listener of this.listeners) {
      listener(this.getStatus(), payload);
    }
  }
}

export function exposeGachaToWindow(controller) {
  if (typeof window === "undefined") {
    return null;
  }

  const api = {
    getState: () => controller.getState(),
    getStatus: () => controller.getStatus(),
    getActiveBatter: () => controller.getActiveBatter(),
    setActiveBatter: (characterId) => controller.setActiveBatter(characterId),
    getScavengerScrap: () => controller.getScavengerScrap(),
    getFragments: () => controller.getFragments(),
    addScrap: (amount) => controller.addScrap(amount),
    spendScrapAndFragments: (currency) => controller.spendScrapAndFragments(currency),
    initialize: () => controller.initialize(),
    rollGacha: () => controller.rollGacha(),
    rollGachaTen: () => controller.rollGachaTen(),
    getCharacters: () => controller.getCharacters(),
    subscribe: (listener) => controller.subscribe(listener)
  };

  window.BaseballWaifusGacha = api;
  return api;
}
