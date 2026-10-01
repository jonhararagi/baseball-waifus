const STORAGE_KEY = "baseball_waifus_art_registry_v1";
const STATUS = Object.freeze(["DRAFT", "PROCESSED", "APPROVED", "MISSING"]);
const DEFAULT_RUNTIME_ROOT = "./assets/characters/approved/";

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function defaultBinding(characterId) {
  const id = normalizeId(characterId);
  return {
    character_id: id,
    status: "MISSING",
    runtime_path: id ? DEFAULT_RUNTIME_ROOT + id + ".png" : "",
    source: null,
    filename: null,
    mime: null,
    updated_at: null
  };
}

function readStore(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Local draft persistence is optional and must never block the game.
  }
}

export function getCharacterArtBinding(characterId, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  const stored = readStore(storage)[id];
  return { ...defaultBinding(id), ...(stored && typeof stored === "object" ? stored : {}) };
}

export function listCharacterArtBindings(characterIds = [], { storage = globalThis.localStorage } = {}) {
  return characterIds.map((id) => getCharacterArtBinding(id, { storage }));
}

export function saveLocalArtDraft(characterId, draft = {}, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  if (!id) throw new Error("character_id is required");
  const current = getCharacterArtBinding(id, { storage });
  const next = {
    ...current,
    ...draft,
    character_id: id,
    status: "DRAFT",
    source: draft.source || "LOCAL ART INPUT",
    updated_at: new Date().toISOString()
  };
  const store = readStore(storage);
  store[id] = next;
  writeStore(store, storage);
  return next;
}

export function setArtStatus(characterId, status, { storage = globalThis.localStorage } = {}) {
  const normalized = String(status || "").toUpperCase();
  if (!STATUS.includes(normalized)) throw new Error("Unknown art status: " + normalized);
  const id = normalizeId(characterId);
  if (!id) throw new Error("character_id is required");
  const current = getCharacterArtBinding(id, { storage });
  const next = { ...current, character_id: id, status: normalized, updated_at: new Date().toISOString() };
  const store = readStore(storage);
  store[id] = next;
  writeStore(store, storage);
  return next;
}

export function clearLocalArtDraft(characterId, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  const store = readStore(storage);
  const current = store[id];
  if (!current) return getCharacterArtBinding(id, { storage });
  delete store[id];
  writeStore(store, storage);
  return defaultBinding(id);
}

export function isApprovedArtBinding(binding) {
  return String(binding?.status || "").toUpperCase() === "APPROVED"
    && Boolean(String(binding?.runtime_path || "").trim());
}

export { STATUS as CHARACTER_ART_STATUSES, STORAGE_KEY as CHARACTER_ART_STORAGE_KEY };