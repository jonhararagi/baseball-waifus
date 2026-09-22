import { WaifuDex } from "./waifu_dex.js";
const DEFAULT_QUEUE_URL = "./data/characters_queue.json";
const DEFAULT_STORAGE_KEY = "baseball_waifus_gacha_v1";
const DEFAULT_MANIFEST_URL = "./assets/production/manifest.json";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normalizeQueue(queue) {
  const units = [
    { character_id: queue?.character_id, canonical: queue?.canonical },
    ...(Array.isArray(queue?.batch_units) ? queue.batch_units : [])
  ];
  return units.filter((unit) => isObject(unit?.canonical) && typeof unit.character_id === "string");
}
function emptyState() {
  return { pulls_since_UR: 0, inventory: {}, active_batter: null, scavenger_scrap: 0 };
}
function readState(storage, storageKey) {
  if (!storage || typeof storage.getItem !== "function") return emptyState();
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) || "{}");
    if (!isObject(parsed)) return emptyState();
    return {
      pulls_since_UR: Number(parsed.pulls_since_UR) || 0,
      inventory: isObject(parsed.inventory) ? parsed.inventory : {},
      active_batter: parsed.active_batter || null,
      scavenger_scrap: Math.max(0, Number(parsed.scavenger_scrap) || 0)
    };
  } catch {
    return emptyState();
  }
}
function writeState(storage, storageKey, patch) {
  if (!storage || typeof storage.setItem !== "function") return;
  storage.setItem(storageKey, JSON.stringify({ ...readState(storage, storageKey), ...patch }));
}
function manifestAssetPath(manifest, collection, characterId, token) {
  const items = Array.isArray(manifest?.[collection]) ? manifest[collection] : [];
  const descriptor = items.find((item) => String(item?.path || "").includes("/" + characterId + token));
  return descriptor?.path ? String(descriptor.path) : "";
}
function fallbackAssetPath(characterId, kind) {
  return kind === "card"
    ? "./assets/production/cards/" + characterId + "--normal.jpg"
    : "./assets/production/sprites/" + characterId + "_idle.png";
}
function labelFaction(faction) {
  return String(faction || "UNKNOWN").replace(/_/g, " ").toUpperCase();
}

export class GalleryController {
  constructor({
    root = null,
    grid = root?.querySelector("#gallery-grid") || null,
    activeLabel = root?.querySelector("#gallery-active-batter") || null,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = DEFAULT_STORAGE_KEY,
    queueUrl = DEFAULT_QUEUE_URL,
    manifestUrl = DEFAULT_MANIFEST_URL,
    fetchImpl = typeof globalThis !== "undefined" ? globalThis.fetch?.bind(globalThis) : null,
    onActiveBatterChange = null,
    onShare = null,
    onInspect = null,
    progressionProvider = null
  } = {}) {
    this.root = root;
    this.grid = grid;
    this.activeLabel = activeLabel;
    this.storage = storage;
    this.storageKey = storageKey;
    this.queueUrl = queueUrl;
    this.manifestUrl = manifestUrl;
    this.fetchImpl = fetchImpl;
    this.onActiveBatterChange = onActiveBatterChange;
    this.onShare = onShare;
    this.onInspect = onInspect;
    this.progressionProvider = progressionProvider;
    this.dex = new WaifuDex({
      root,
      grid,
      rarityFilter: root?.querySelector("#dex-filter-rarity") || null,
      roleFilter: root?.querySelector("#dex-filter-role") || null,
      areaFilter: root?.querySelector("#dex-filter-area") || null,
      storage,
      storageKey,
      onSelect: (id) => this.selectActiveBatter(id),
      onShare: (unit) => this.onShare?.(unit),
      onInspect: (unit) => this.onInspect?.(unit),
      progressionProvider: (characterId) => this.progressionProvider?.(characterId) || null
    });
    this.queue = [];
    this.manifest = null;
    this.state = readState(storage, storageKey);
    this.ready = false;
  }
  async initialize() {
    if (!this.grid) throw new Error("GalleryController requires #gallery-grid");
    if (typeof this.fetchImpl !== "function") throw new Error("GalleryController requires fetch");
    const queueResponse = await this.fetchImpl(this.queueUrl, { cache: "no-cache" });
    if (!queueResponse?.ok) throw new Error("Unable to load Waifu Dex queue");
    this.queue = normalizeQueue(await queueResponse.json());
    this.dex.setUnits(this.queue);
    try {
      const manifestResponse = await this.fetchImpl(this.manifestUrl, { cache: "no-cache" });
      if (manifestResponse?.ok) this.manifest = await manifestResponse.json();
    } catch {
      this.manifest = null;
    }
    this.ready = true;
    this.refresh();
    return this;
  }
  refresh() {
    this.state = readState(this.storage, this.storageKey);
    this.dex.setUnits(this.queue);
    this.dex.refresh();
    this._renderActiveLabel();
    return this;
  }
  getActiveBatter() {
    const id = String(this.state.active_batter || "");
    return this.queue.find((unit) => unit.character_id === id) || null;
  }
  selectActiveBatter(characterId) {
    const id = String(characterId || "");
    if (!this.state.inventory[id]) throw new Error("Only unlocked waifus can join the active roster");
    this.state.active_batter = id;
    writeState(this.storage, this.storageKey, { active_batter: id });
    this.refresh();
    this.onActiveBatterChange?.(id);
    return id;
  }
  _createCard(unit) {
    const id = unit.character_id;
    const canonical = unit.canonical || {};
    const unlocked = Boolean(this.state.inventory[id]);
    const card = document.createElement("article");
    card.className = "dex-card " + (unlocked ? "is-unlocked" : "is-locked");
    if (this.state.active_batter === id) card.classList.add("is-active");
    const artWrap = document.createElement("div");
    artWrap.className = "dex-art-wrap";
    const cardPath = manifestAssetPath(this.manifest, "cards", id, "--normal.") || fallbackAssetPath(id, "card");
    const cardImage = document.createElement("img");
    cardImage.className = "dex-card-art";
    cardImage.alt = unlocked ? (canonical.display_name || id) + " portrait" : "";
    cardImage.loading = "lazy";
    cardImage.decoding = "async";
    cardImage.src = cardPath;
    const missing = document.createElement("div");
    missing.className = "dex-missing";
    missing.textContent = "DATA MISSING";
    missing.hidden = true;
    cardImage.addEventListener("error", () => { cardImage.hidden = true; missing.hidden = false; });
    if (!unlocked) cardImage.classList.add("dex-locked-art");
    artWrap.append(cardImage, missing);
    const meta = document.createElement("div");
    meta.className = "dex-card-meta";
    const name = document.createElement("div");
    name.className = "dex-card-name";
    name.textContent = unlocked ? (canonical.display_name || id) : "UNKNOWN WAIFU";
    if (this.state.active_batter === id) name.dataset.active = "true";
    const rarity = document.createElement("span");
    rarity.className = "dex-rarity";
    rarity.textContent = String(canonical.rarity || "?").toUpperCase();
    const faction = document.createElement("div");
    faction.className = "dex-faction";
    faction.textContent = unlocked ? "FACTION // " + labelFaction(canonical.faction) : "FACTION // ENCRYPTED";
    const duplicate = document.createElement("div");
    duplicate.className = "dex-duplicates";
    const duplicateCount = unlocked ? Math.max(1, Number(this.state.inventory[id]?.duplicate_count) || 1) : 0;
    duplicate.textContent = unlocked ? "DUPLICATES ×" + duplicateCount : "LOCKED PROFILE";
    const position = document.createElement("div");
    position.className = "dex-position";
    position.textContent = unlocked
      ? String(canonical.position || "UTILITY").toUpperCase() + " // " + String(canonical.element || "neutral").toUpperCase()
      : "ACCESS // LOCKED";
    meta.append(name, rarity, faction, duplicate, position);
    if (unlocked) {
      const actions = document.createElement("div");
      actions.className = "dex-actions";

      const action = document.createElement("button");
      action.type = "button";
      action.className = "dex-select";
      action.textContent = this.state.active_batter === id ? "ACTIVE BATTER" : "SET ACTIVE";
      action.addEventListener("click", () => this.selectActiveBatter(id));

      const share = document.createElement("button");
      share.type = "button";
      share.className = "dex-share";
      share.textContent = "COMPARTIR / PRESUMIR";
      share.addEventListener("click", () => this.onShare?.(unit));

      actions.append(action, share);
      meta.appendChild(actions);
    } else {
      const lock = document.createElement("div");
      lock.className = "dex-lock";
      lock.textContent = "LOCKED";
      meta.appendChild(lock);
    }
    card.append(artWrap, meta);
    return card;
  }
  _renderActiveLabel() {
    if (!this.activeLabel) return;
    const unit = this.getActiveBatter();
    this.activeLabel.textContent = unit
      ? "ACTIVE BATTER // " + (unit.canonical.display_name || unit.character_id)
      : "ACTIVE BATTER // NONE SELECTED";
  }
}