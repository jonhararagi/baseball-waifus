const IMAGE_PROVIDER_BASE = "https://api.dicebear.com/9.x/lorelei/png";
const CONFIG_URL = "./data/waifus_config.json";
const CONFIG_STORAGE_KEY = "baseball_waifus_waifu_config_v1";

export const ARCHETYPE_COLORS = Object.freeze({
  POWER: "#ff3b30",
  CONTACT: "#00e5ff",
  SPEED: "#ffd166",
  EYE: "#a855f7",
  DEFAULT: "#00f0ff"
});

const MEMORY_FALLBACK_CONFIG = Object.freeze({
  schema_version: 1,
  team: "Team Problemas de Capibara",
  characters: [
    ["cari", "Cari", "capybara", "POWER", "Slugger", [82, 74, 78, 62], "Cari-Capybara"],
    ["cami", "Cami", "capybara", "EYE", "Strategist", [62, 76, 61, 91], "Cami-Capybara"],
    ["sunna", "Sunna", "serpent", "POWER", "Vanguard", [79, 66, 69, 72], "Sunna-Serpent"],
    ["chie", "Chie", "mouse", "CONTACT", "Contact", [58, 89, 84, 76], "Chie-Mouse"],
    ["scarlet", "Scarlet", "fruit_bat", "POWER", "Slugger", [86, 71, 67, 73], "Scarlet-Bat"],
    ["chloe", "Chloe", "fruit_bat", "SPEED", "Support", [59, 72, 93, 79], "Chloe-Bat"],
    ["fenrir", "Fenrir", "wolf", "SPEED", "Runner", [72, 68, 96, 70], "Fenrir-Wolf"]
  ].map(([id, name, species, archetype, role, stats, seed]) => ({
    id,
    name,
    species,
    archetype,
    role,
    stats: {
      power: stats[0],
      contact: stats[1],
      speed: stats[2],
      eye: stats[3]
    },
    assets: {
      avatar: IMAGE_PROVIDER_BASE + "?seed=" + seed + "&size=512&backgroundColor=0b0b14",
      card_art: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-Card&size=1024&backgroundColor=0b0b14",
      cutin_art: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-Cutin&size=1024&backgroundColor=0b0b14",
      sprite: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-Sprite&size=256&backgroundColor=0b0b14"
    }
  }))
});

let activeConfig = cloneConfig(MEMORY_FALLBACK_CONFIG);
let configSource = "memory";
let initialized = false;

function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clampStat(value, fallback = 50) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(100, Math.max(0, Math.round(number)))
    : fallback;
}

function safeUrl(value, fallback) {
  const text = String(value || "");
  try {
    return new URL(text).protocol === "https:" ? text : fallback;
  } catch {
    return fallback;
  }
}

function createGeneratedAssets(character = {}) {
  const name = String(character.name || character.id || "Waifu");
  const seed = encodeURIComponent(name + "-" + String(character.id || "waifu"));
  return {
    avatar: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-avatar&size=512&backgroundColor=0b0b14",
    card_art: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-card&size=1024&backgroundColor=0b0b14",
    cutin_art: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-cutin&size=1024&backgroundColor=0b0b14",
    sprite: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-sprite&size=256&backgroundColor=0b0b14"
  };
}

function normalizeCharacter(input = {}) {
  const id = normalizeId(input.id || input.character_id || input.card_id || input.name || "waifu");
  const generated = createGeneratedAssets({ ...input, id });
  const stats = input.stats || {};
  const assets = input.assets || {};
  return {
    id,
    name: String(input.name || input.display_name || id),
    species: String(input.species || "unknown"),
    archetype: String(input.archetype || "POWER").toUpperCase(),
    role: String(input.role || "Support"),
    stats: {
      power: clampStat(stats.power),
      contact: clampStat(stats.contact),
      speed: clampStat(stats.speed),
      eye: clampStat(stats.eye)
    },
    assets: {
      avatar: safeUrl(assets.avatar || input.avatarUrl, generated.avatar),
      card_art: safeUrl(assets.card_art || input.cardArtUrl, generated.card_art),
      cutin_art: safeUrl(assets.cutin_art || input.cutinArtUrl, generated.cutin_art),
      sprite: safeUrl(assets.sprite || input.spriteSheetUrl, generated.sprite)
    }
  };
}

function normalizeConfig(input = {}) {
  const characters = Array.isArray(input.characters)
    ? input.characters.map(normalizeCharacter)
    : [];

  const deduped = [];
  const seen = new Set();
  for (const character of characters) {
    if (seen.has(character.id)) continue;
    seen.add(character.id);
    deduped.push(character);
  }

  return {
    schema_version: 1,
    team: String(input.team || "Team Problemas de Capibara"),
    characters: deduped
  };
}

function mergeConfig(base, overrides) {
  const source = normalizeConfig(base);
  const patch = overrides && typeof overrides === "object"
    ? overrides
    : {};
  const patchCharacters = Array.isArray(patch.characters) ? patch.characters : [];
  const byId = new Map(source.characters.map((character) => [character.id, character]));

  for (const candidate of patchCharacters) {
    const normalized = normalizeCharacter(candidate);
    const current = byId.get(normalized.id);
    byId.set(normalized.id, {
      ...(current || {}),
      ...normalized,
      stats: {
        ...(current?.stats || {}),
        ...normalized.stats
      },
      assets: {
        ...(current?.assets || {}),
        ...normalized.assets
      }
    });
  }

  return {
    schema_version: 1,
    team: String(patch.team || source.team),
    characters: [...byId.values()]
  };
}

function persistLocalConfig(storage) {
  try {
    storage?.setItem?.(CONFIG_STORAGE_KEY, JSON.stringify(activeConfig));
  } catch {
    // Local config is an optional cache. Memory state remains authoritative for this tab.
  }
}

function readLocalConfig(storage) {
  try {
    const raw = storage?.getItem?.(CONFIG_STORAGE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export let WAIFU_DATABASE = Object.freeze({});

function rebuildDatabase(config = activeConfig) {
  const next = {};
  for (const character of config.characters) {
    next[character.id] = {
      id: character.id,
      name: character.name,
      species: character.species,
      archetype: character.archetype,
      role: character.role,
      stats: { ...character.stats },
      avatarUrl: character.assets.avatar,
      cardArtUrl: character.assets.card_art,
      cutinArtUrl: character.assets.cutin_art,
      spriteSheetUrl: character.assets.sprite
    };
  }
  WAIFU_DATABASE = Object.freeze(next);
}

rebuildDatabase();

export async function initializeWaifuDatabase({
  fetchImpl = typeof globalThis !== "undefined" ? globalThis.fetch : null,
  url = CONFIG_URL,
  storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null
} = {}) {
  let remote = null;
  if (typeof fetchImpl === "function") {
    try {
      const response = await fetchImpl(url, { cache: "no-cache" });
      if (!response.ok) throw new Error("WAIFU_CONFIG_HTTP_" + response.status);
      remote = normalizeConfig(await response.json());
    } catch {
      remote = null;
    }
  }

  const local = readLocalConfig(storage);
  activeConfig = mergeConfig(
    remote || MEMORY_FALLBACK_CONFIG,
    local || {}
  );
  configSource = remote ? "json" : "memory";
  initialized = true;
  rebuildDatabase();
  return getConfigSnapshot();
}

export function isWaifuDatabaseInitialized() {
  return initialized;
}

export function getWaifuConfigSource() {
  return configSource;
}

export function getConfigSnapshot() {
  return cloneConfig(activeConfig);
}

export function getWaifu(characterId) {
  return WAIFU_DATABASE[normalizeId(characterId)] || null;
}

export function getWaifuAssets(characterOrId) {
  const id = typeof characterOrId === "string"
    ? normalizeId(characterOrId)
    : normalizeId(
      characterOrId?.id
      || characterOrId?.character_id
      || characterOrId?.card_id
      || characterOrId?.canonical?.display_name
    );

  const known = WAIFU_DATABASE[id];
  if (known) {
    return {
      avatarUrl: known.avatarUrl,
      cardArtUrl: known.cardArtUrl,
      cutinArtUrl: known.cutinArtUrl,
      spriteSheetUrl: known.spriteSheetUrl
    };
  }

  const fallback = normalizeCharacter(
    typeof characterOrId === "string"
      ? { id: characterOrId }
      : characterOrId
  );
  return {
    avatarUrl: fallback.assets.avatar,
    cardArtUrl: fallback.assets.card_art,
    cutinArtUrl: fallback.assets.cutin_art,
    spriteSheetUrl: fallback.assets.sprite
  };
}

export function getArchetypeColor(archetype = "DEFAULT") {
  const key = String(archetype || "DEFAULT").toUpperCase();
  return ARCHETYPE_COLORS[key] || ARCHETYPE_COLORS.DEFAULT;
}

export function listWaifus() {
  return Object.values(WAIFU_DATABASE).map((waifu) => ({
    ...waifu,
    assets: getWaifuAssets(waifu)
  }));
}

export function updateWaifuConfig(characterId, patch = {}, {
  persist = false,
  storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null
} = {}) {
  const id = normalizeId(characterId);
  const current = activeConfig.characters.find((character) => character.id === id);
  if (!current) throw new Error("Unknown waifu: " + id);

  const merged = normalizeCharacter({
    ...current,
    ...patch,
    id,
    stats: {
      ...current.stats,
      ...(patch.stats || {})
    },
    assets: {
      ...current.assets,
      ...(patch.assets || {})
    }
  });

  activeConfig = {
    ...activeConfig,
    characters: activeConfig.characters.map((character) =>
      character.id === id ? merged : character
    )
  };

  configSource = "runtime";
  rebuildDatabase();

  if (persist) persistLocalConfig(storage);
  return cloneConfig(merged);
}

export function applyWaifuConfig(config, {
  persist = false,
  storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null
} = {}) {
  activeConfig = normalizeConfig(config);
  configSource = "runtime";
  rebuildDatabase();
  if (persist) persistLocalConfig(storage);
  return getConfigSnapshot();
}

export function exportWaifuConfigJson() {
  return JSON.stringify(activeConfig, null, 2);
}

export function createRemoteWaifuAssets(character = {}) {
  return getWaifuAssets(character);
}

export const WAIFU_CONFIG_URL = CONFIG_URL;
export const WAIFU_CONFIG_STORAGE_KEY = CONFIG_STORAGE_KEY;

