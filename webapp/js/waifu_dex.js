const RARITIES = Object.freeze(["N", "R", "SR", "SSR", "UR"]);
const ROLES = Object.freeze(["Slugger", "Pitcher", "Outfielder"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRole(unit) {
  const specialization = String(unit?.canonical?.specialization || unit?.specialization || "").toLowerCase();
  const position = String(unit?.canonical?.position || unit?.position || "").toUpperCase();

  if (specialization.includes("pitch") || position === "P") return "Pitcher";
  if (
    specialization.includes("power")
    || specialization.includes("slug")
    || ["DH", "1B", "3B"].includes(position)
  ) return "Slugger";
  return "Outfielder";
}

function normalizeArea(unit) {
  return String(
    unit?.canonical?.favorite_area
    || unit?.canonical?.area_favorite
    || unit?.favorite_area
    || "ALL"
  );
}

function deriveStats(unit) {
  const stats = unit?.canonical?.stats || unit?.stats || {};
  const potential = Number(unit?.canonical?.potential ?? unit?.potential ?? 3);
  return {
    swingPower: Number(stats.power) || 0,
    timingWindow: Number(stats.timing_window)
      || Number((0.08 + (Number(stats.contact) || 50) / 1250).toFixed(3)),
    scrapMultiplier: Number(stats.scrap_multiplier)
      || Number((1 + Math.max(0, potential - 1) * 0.1).toFixed(2))
  };
}

export function matchesWaifuFilters(unit, filters = {}) {
  const rarity = String(filters.rarity || "ALL").toUpperCase();
  const role = String(filters.role || "ALL");
  const area = String(filters.area || "ALL");

  return (
    (rarity === "ALL" || String(unit?.canonical?.rarity || "").toUpperCase() === rarity)
    && (role === "ALL" || normalizeRole(unit) === role)
    && (area === "ALL" || normalizeArea(unit) === area)
  );
}

export function filterWaifus(units = [], filters = {}) {
  return units.filter((unit) => matchesWaifuFilters(unit, filters));
}

export class WaifuDex {
  constructor({
    root = null,
    grid = root?.querySelector("#gallery-grid") || null,
    rarityFilter = root?.querySelector("#dex-filter-rarity") || null,
    roleFilter = root?.querySelector("#dex-filter-role") || null,
    areaFilter = root?.querySelector("#dex-filter-area") || null,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = "baseball_waifus_gacha_v1",
    onSelect = null,
    onShare = null,
    onInspect = null
  } = {}) {
    this.root = root;
    this.grid = grid;
    this.rarityFilter = rarityFilter;
    this.roleFilter = roleFilter;
    this.areaFilter = areaFilter;
    this.storage = storage;
    this.storageKey = storageKey;
    this.onSelect = onSelect;
    this.onShare = onShare;
    this.onInspect = onInspect;
    this.units = [];
    this.state = { inventory: {}, active_batter: null };
    this.filters = { rarity: "ALL", role: "ALL", area: "ALL" };

    for (const element of [this.rarityFilter, this.roleFilter, this.areaFilter]) {
      element?.addEventListener("change", () => this.refreshFilters());
    }
  }

  setUnits(units = []) {
    this.units = Array.isArray(units) ? units : [];
    this._populateAreaFilter();
    return this;
  }

  loadState() {
    try {
      const parsed = JSON.parse(this.storage?.getItem(this.storageKey) || "{}");
      this.state = {
        inventory: parsed?.inventory && typeof parsed.inventory === "object" ? parsed.inventory : {},
        active_batter: parsed?.active_batter || null
      };
    } catch {
      this.state = { inventory: {}, active_batter: null };
    }
    return this.state;
  }

  getUnlockedCount() {
    return Object.keys(this.state.inventory).length;
  }

  getVisibleUnits() {
    return filterWaifus(this.units, this.filters);
  }

  refreshFilters() {
    this.filters = {
      rarity: this.rarityFilter?.value || "ALL",
      role: this.roleFilter?.value || "ALL",
      area: this.areaFilter?.value || "ALL"
    };
    this.refresh();
  }

  refresh() {
    if (!this.grid || typeof document === "undefined") return this;
    this.loadState();
    this.grid.replaceChildren();

    for (const unit of this.getVisibleUnits()) {
      this.grid.appendChild(this._createCard(unit));
    }
    return this;
  }

  _populateAreaFilter() {
    if (!this.areaFilter || typeof document === "undefined") return;
    const current = this.areaFilter.value || "ALL";
    const areas = [...new Set(this.units.map(normalizeArea).filter((area) => area !== "ALL"))].sort();
    this.areaFilter.replaceChildren();
    const all = document.createElement("option");
    all.value = "ALL";
    all.textContent = "TODAS LAS ÁREAS";
    this.areaFilter.appendChild(all);
    for (const area of areas) {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area.toUpperCase();
      this.areaFilter.appendChild(option);
    }
    this.areaFilter.value = areas.includes(current) ? current : "ALL";
  }

  _createCard(unit) {
    const id = String(unit?.character_id || "");
    const canonical = unit?.canonical || {};
    const unlocked = Boolean(this.state.inventory[id]);
    const role = normalizeRole(unit);
    const active = this.state.active_batter === id;
    const card = document.createElement("article");
    card.className = "dex-card " + (unlocked ? "is-unlocked" : "is-locked");
    if (active) card.classList.add("is-active");
    const artWrap = document.createElement("div");
    artWrap.className = "dex-art-wrap";
    artWrap.dataset.characterId = id;

    const image = document.createElement("img");
    image.className = "dex-card-art";
    image.alt = unlocked ? String(canonical.display_name || id) + " portrait" : "";
    image.loading = "lazy";
    image.decoding = "async";
    image.src = "./assets/production/cards/" + id + "--normal.jpg";
    if (!unlocked) image.classList.add("dex-locked-art");
    artWrap.appendChild(image);
    artWrap.addEventListener("click", () => this.onInspect?.(unit));

    const meta = document.createElement("div");
    meta.className = "dex-card-meta";

    const name = document.createElement("div");
    name.className = "dex-card-name";
    name.textContent = unlocked ? String(canonical.display_name || id) : "UNKNOWN WAIFU";

    const rarity = document.createElement("span");
    rarity.className = "dex-rarity";
    rarity.textContent = String(canonical.rarity || "?").toUpperCase();

    const roleLabel = document.createElement("div");
    roleLabel.className = "dex-position";
    roleLabel.textContent = "ROLE // " + role.toUpperCase();

    const factionLabel = document.createElement("div");
    factionLabel.className = "dex-faction";
    factionLabel.textContent = unlocked
      ? "FACTION // " + String(canonical.faction || "UNKNOWN").replace(/_/g, " ").toUpperCase()
      : "FACTION // ENCRYPTED";

    const areaLabel = document.createElement("div");
    areaLabel.className = "dex-position";
    areaLabel.textContent = "AREA // " + normalizeArea(unit).toUpperCase();

    const duplicate = document.createElement("div");
    duplicate.className = "dex-duplicates";
    duplicate.textContent = unlocked
      ? "DUPLICATES ×" + Math.max(1, Number(this.state.inventory[id]?.duplicate_count) || 1)
      : "LOCKED PROFILE";

    const stats = deriveStats(unit);
    const statLine = document.createElement("div");
    statLine.className = "dex-position";
    statLine.textContent = unlocked
      ? "PWR " + stats.swingPower + " • TWIN " + stats.timingWindow.toFixed(2) + " • SCRAP ×" + stats.scrapMultiplier.toFixed(2)
      : "ACCESS // LOCKED";

    meta.append(name, rarity, roleLabel, factionLabel, areaLabel, duplicate, statLine);

    if (unlocked) {
      const actions = document.createElement("div");
      actions.className = "dex-actions";

      const select = document.createElement("button");
      select.type = "button";
      select.className = "dex-select";
      select.textContent = this.state.active_batter === id ? "ACTIVE BATTER" : "SET ACTIVE";
      select.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onSelect?.(id);
      });

      const share = document.createElement("button");
      share.type = "button";
      share.className = "dex-share";
      share.textContent = "COMPARTIR / PRESUMIR";
      share.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onShare?.(unit);
      });

      actions.append(select, share);
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
}

export { RARITIES, ROLES, normalizeRole, normalizeArea, deriveStats };
