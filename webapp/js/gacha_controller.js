const DEFAULT_SCHEMA_URL = "./data/game_schemas_recycled.json";
const DEFAULT_QUEUE_URL = "./data/characters_queue.json";
const DEFAULT_STORAGE_KEY = "baseball_waifus_gacha_v1";
const PULL_LIMIT = 80;

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
      inventory: {}
    };
    this.ready = false;
    this.listeners = new Set();
  }

  async initialize() {
    this._loadState();

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
    return {
      pulls_since_UR: pullsSinceUr,
      next_pull: Math.min(PULL_LIMIT, pullsSinceUr + 1),
      hard_pity_in: Math.max(0, PULL_LIMIT - pullsSinceUr),
      inventory_size: Object.keys(this.state.inventory || {}).length,
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

  async rollGacha() {
    if (!this.ready) {
      throw new Error("GachaController is not initialized");
    }

    this._playAudio("ui.confirm");

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

    this.state.inventory[characterId] = previous;
    this.state.pulls_since_UR = rarity === "UR" ? 0 : pullNumber;
    this._saveState();

    const result = {
      pull_number: pullNumber,
      rarity,
      character,
      duplicate_count: previous.duplicate_count,
      pulls_since_UR: this.state.pulls_since_UR,
      soft_pity_active: probabilities.soft_pity_active,
      hard_pity_triggered: hardPityTriggered,
      probabilities: clone(probabilities)
    };

    if (hardPityTriggered) {
      this._playAudio("gacha.pity_trigger");
    }

    if (rarity === "SSR" || rarity === "UR") {
      this._playAudio("gacha.reveal_ssr");
      await this.cutInRenderer?.showGachaCutIn?.({
        rarity,
        character
      });
    }

    this._emit(result);
    return result;
  }

  _playAudio(soundId) {
    if (!this.audioBridge || typeof this.audioBridge.play !== "function") {
      return false;
    }
    return Boolean(this.audioBridge.play(soundId));
  }

  _loadState() {
    if (!this.storage || typeof this.storage.getItem !== "function") {
      return;
    }

    try {
      const parsed = JSON.parse(this.storage.getItem(this.storageKey) || "{}");
      if (!isObject(parsed)) {
        return;
      }

      const pulls = Number(parsed.pulls_since_UR);
      if (Number.isFinite(pulls) && pulls >= 0) {
        this.state.pulls_since_UR = Math.min(PULL_LIMIT - 1, Math.floor(pulls));
      }

      if (isObject(parsed.inventory)) {
        this.state.inventory = parsed.inventory;
      }
    } catch {
      this.state = {
        pulls_since_UR: 0,
        inventory: {}
      };
    }
  }

  _saveState() {
    if (!this.storage || typeof this.storage.setItem !== "function") {
      return;
    }

    try {
      this.storage.setItem(
        this.storageKey,
        JSON.stringify({
          pulls_since_UR: this.state.pulls_since_UR,
          inventory: this.state.inventory
        })
      );
    } catch {
      // Stateless mode remains playable when localStorage is unavailable.
    }
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
    initialize: () => controller.initialize(),
    rollGacha: () => controller.rollGacha(),
    subscribe: (listener) => controller.subscribe(listener)
  };

  window.BaseballWaifusGacha = api;
  return api;
}
