const IMAGE_PROVIDER_BASE = "https://api.dicebear.com/9.x/lorelei/png";
const CONFIG_URL = "./data/waifus_config.json";
const CONFIG_STORAGE_KEY = "baseball_waifus_waifu_config_v2";

export const ARCHETYPE_COLORS = Object.freeze({
  POWER: "#ff3b30",
  CONTACT: "#00e5ff",
  SPEED: "#ffd166",
  EYE: "#a855f7",
  DEFAULT: "#00f0ff"
});

const MEMORY_FALLBACK_CONFIG = {
  "schema_version": 2,
  "characters": [
    {
      "id": "cari",
      "name": "Cari",
      "team": "Team Problemas de Capibara",
      "species": "capybara",
      "role": "Slugger",
      "archetype": "POWER",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 82,
      "contact": 74,
      "speed": 78,
      "eye": 62,
      "quote_super": "¡YO LE PEGARÉ!",
      "quote_idle": "¡Vamos, vamos!",
      "quote_victory": "¡Ganamos! ¡Eso estuvo genial!",
      "jiggle_intensity": 0.18,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Cari-Capybara-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "cami",
      "name": "Cami",
      "team": "Team Problemas de Capibara",
      "species": "capybara",
      "role": "Strategist",
      "archetype": "EYE",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 62,
      "contact": 76,
      "speed": 61,
      "eye": 91,
      "quote_super": "Calculado. Ahora batea.",
      "quote_idle": "La estrategia primero.",
      "quote_victory": "Funcionó exactamente como esperaba.",
      "jiggle_intensity": 0.08,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Cami-Capybara-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "sunna",
      "name": "Sunna",
      "team": "Team Problemas de Capibara",
      "species": "serpent",
      "role": "Vanguard",
      "archetype": "POWER",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 79,
      "contact": 66,
      "speed": 69,
      "eye": 72,
      "quote_super": "¡No apartaré la mirada!",
      "quote_idle": "El sol está ahí...",
      "quote_victory": "¡Lo logramos!",
      "jiggle_intensity": 0.12,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Sunna-Serpent-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "chie",
      "name": "Chie",
      "team": "Team Problemas de Capibara",
      "species": "mouse",
      "role": "Contact",
      "archetype": "CONTACT",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 58,
      "contact": 89,
      "speed": 84,
      "eye": 76,
      "quote_super": "¡Golpe limpio!",
      "quote_idle": "Tranquila... apunta.",
      "quote_victory": "¡Kachi desu!",
      "jiggle_intensity": 0.1,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Chie-Mouse-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "scarlet",
      "name": "Scarlet",
      "team": "Team Problemas de Capibara",
      "species": "fruit_bat",
      "role": "Slugger",
      "archetype": "POWER",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 86,
      "contact": 71,
      "speed": 67,
      "eye": 73,
      "quote_super": "¡Muerde la pelota!",
      "quote_idle": "La noche también juega.",
      "quote_victory": "¡Victoria dulce!",
      "jiggle_intensity": 0.22,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Scarlet-Bat-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "chloe",
      "name": "Chloe",
      "team": "Team Problemas de Capibara",
      "species": "fruit_bat",
      "role": "Support",
      "archetype": "SPEED",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 59,
      "contact": 72,
      "speed": 93,
      "eye": 79,
      "quote_super": "¡Más rápido!",
      "quote_idle": "¿Necesitas algo?",
      "quote_victory": "Buen trabajo.",
      "jiggle_intensity": 0.14,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Chloe-Bat-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "fenrir",
      "name": "Fenrir",
      "team": "Team Problemas de Capibara",
      "species": "wolf",
      "role": "Runner",
      "archetype": "SPEED",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 72,
      "contact": 68,
      "speed": 96,
      "eye": 70,
      "quote_super": "¡Que empiece la cacería!",
      "quote_idle": "La luna me guía.",
      "quote_victory": "¡Esta carrera es mía!",
      "jiggle_intensity": 0.1,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Fenrir-Wolf-Cutin&size=1024&backgroundColor=0b0b14"
      }
    },
    {
      "id": "roxie_vane",
      "name": "Roxie Vane",
      "team": "Legends",
      "species": "human",
      "role": "Legend",
      "archetype": "POWER",
      "avatar_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane&size=512&backgroundColor=0b0b14",
      "card_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane-Card&size=1024&backgroundColor=0b0b14",
      "cutin_art_url": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane-Cutin&size=1024&backgroundColor=0b0b14",
      "power": 90,
      "contact": 74,
      "speed": 70,
      "eye": 78,
      "quote_super": "¡IGNITION BUSTER!",
      "quote_idle": "Power check. Ready.",
      "quote_victory": "¡That's a home run!",
      "jiggle_intensity": 0.2,
      "assets": {
        "avatar": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane&size=512&backgroundColor=0b0b14",
        "card_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane-Card&size=1024&backgroundColor=0b0b14",
        "cutin_art": "https://api.dicebear.com/9.x/lorelei/png?seed=Roxie-Vane-Cutin&size=1024&backgroundColor=0b0b14"
      }
    }
  ]
};

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

function clampJiggle(value, fallback = 0.12) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(1, Math.max(0, number))
    : fallback;
}

function safeUrl(value, fallback) {
  const text = String(value || "").trim();
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
  const legacyAssets = input.assets || {};

  const avatar = legacyAssets.avatar || input.avatar_url || input.avatarUrl;
  const cardArt = legacyAssets.card_art || input.card_art_url || input.cardArtUrl;
  const cutinArt = legacyAssets.cutin_art || input.cutin_art_url || input.cutinArtUrl;

  return {
    id,
    name: String(input.name || input.display_name || id),
    team: String(input.team || "Team Problemas de Capibara"),
    species: String(input.species || "unknown"),
    archetype: String(input.archetype || "POWER").toUpperCase(),
    role: String(input.role || "Support"),
    stats: {
      power: clampStat(stats.power ?? input.power),
      contact: clampStat(stats.contact ?? input.contact),
      speed: clampStat(stats.speed ?? input.speed),
      eye: clampStat(stats.eye ?? input.eye)
    },
    assets: {
      avatar: safeUrl(avatar, generated.avatar),
      card_art: safeUrl(cardArt, generated.card_art),
      cutin_art: safeUrl(cutinArt, generated.cutin_art),
      sprite: safeUrl(legacyAssets.sprite || input.sprite_url || input.spriteUrl, generated.sprite)
    },
    quote_super: String(input.quote_super || "¡SUPER SWING!"),
    quote_idle: String(input.quote_idle || ""),
    quote_victory: String(input.quote_victory || ""),
    jiggle_intensity: clampJiggle(input.jiggle_intensity)
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
    schema_version: 2,
    characters: deduped
  };
}

function mergeConfig(base, overrides) {
  const source = normalizeConfig(base);
  const patch = overrides && typeof overrides === "object" ? overrides : {};
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
    schema_version: 2,
    characters: [...byId.values()]
  };
}

function persistLocalConfig(storage) {
  try {
    storage?.setItem?.(CONFIG_STORAGE_KEY, JSON.stringify(activeConfig));
  } catch {
    // Local config is optional. Memory state remains authoritative for this tab.
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
      team: character.team,
      species: character.species,
      archetype: character.archetype,
      role: character.role,
      stats: { ...character.stats },
      avatarUrl: character.assets.avatar,
      cardArtUrl: character.assets.card_art,
      cutinArtUrl: character.assets.cutin_art,
      spriteSheetUrl: character.assets.sprite,
      quote_super: character.quote_super,
      quote_idle: character.quote_idle,
      quote_victory: character.quote_victory,
      jiggle_intensity: character.jiggle_intensity
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
      if (!response?.ok) throw new Error("WAIFU_CONFIG_HTTP_" + (response?.status || "ERROR"));
      remote = normalizeConfig(await response.json());
    } catch {
      remote = null;
    }
  }

  const local = readLocalConfig(storage);
  activeConfig = mergeConfig(remote || MEMORY_FALLBACK_CONFIG, local || {});
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
    typeof characterOrId === "string" ? { id: characterOrId } : characterOrId
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
    characters: activeConfig.characters.map((character) => (
      character.id === id ? merged : character
    ))
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

export function resetWaifuDatabaseToMemory({
  persist = false,
  storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null
} = {}) {
  activeConfig = cloneConfig(MEMORY_FALLBACK_CONFIG);
  configSource = "memory";
  rebuildDatabase();
  if (persist) persistLocalConfig(storage);
  return getConfigSnapshot();
}

export function exportWaifuConfigObject() {
  return {
    schema_version: 2,
    characters: activeConfig.characters.map((character) => ({
      id: character.id,
      name: character.name,
      team: character.team,
      species: character.species,
      role: character.role,
      archetype: character.archetype,
      avatar_url: character.assets.avatar,
      card_art_url: character.assets.card_art,
      cutin_art_url: character.assets.cutin_art,
      power: character.stats.power,
      contact: character.stats.contact,
      speed: character.stats.speed,
      eye: character.stats.eye,
      quote_super: character.quote_super,
      quote_idle: character.quote_idle,
      quote_victory: character.quote_victory,
      jiggle_intensity: character.jiggle_intensity
    }))
  };
}

export function exportWaifuConfigJson() {
  return JSON.stringify(exportWaifuConfigObject(), null, 2);
}

export function createRemoteWaifuAssets(character = {}) {
  return getWaifuAssets(character);
}

export const WAIFU_CONFIG_URL = CONFIG_URL;
export const WAIFU_CONFIG_STORAGE_KEY = CONFIG_STORAGE_KEY;
