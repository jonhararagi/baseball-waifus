const STORAGE_KEY = "baseball_waifus_art_registry_v2";
const STATUS = Object.freeze(["MISSING", "DRAFT", "PROCESSED", "APPROVED"]);
const DEFAULT_RUNTIME_ROOT = "./assets/characters/approved/";
let projectManifest = Object.freeze({
  schema_version: 1,
  status_contract: STATUS,
  approved_root: DEFAULT_RUNTIME_ROOT,
  assets: {}
});

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeManifest(manifest) {
  const assets = manifest?.assets && typeof manifest.assets === "object" ? manifest.assets : {};
  const normalized = {};
  for (const [rawId, rawEntry] of Object.entries(assets)) {
    const id = normalizeId(rawId);
    if (!id || !rawEntry || typeof rawEntry !== "object") continue;
    const status = String(rawEntry.status || "").toUpperCase();
    if (!["PROCESSED", "APPROVED"].includes(status)) continue;
    const runtimePath = String(
      rawEntry.runtime_path
      || (status === "APPROVED" ? DEFAULT_RUNTIME_ROOT + id + ".png" : "")
    ).trim();
    if (!runtimePath) continue;
    normalized[id] = {
      character_id: id,
      status,
      runtime_path: runtimePath,
      filename: String(rawEntry.filename || runtimePath.split("/").pop() || ""),
      mime: String(rawEntry.mime || ""),
      width: Number.isFinite(Number(rawEntry.width)) ? Number(rawEntry.width) : null,
      height: Number.isFinite(Number(rawEntry.height)) ? Number(rawEntry.height) : null,
      source: rawEntry.source || "PROJECT ASSET",
      approved_at: rawEntry.approved_at || null,
      updated_at: rawEntry.updated_at || null
    };
  }
  return {
    schema_version: Number(manifest?.schema_version || 1),
    status_contract: STATUS,
    approved_root: String(manifest?.approved_root || DEFAULT_RUNTIME_ROOT),
    assets: normalized
  };
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
    width: null,
    height: null,
    project_asset: false,
    approved_at: null,
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

export function setProjectArtManifest(manifest = {}) {
  projectManifest = Object.freeze(normalizeManifest(manifest));
  return projectManifest;
}

export async function loadProjectArtManifest({
  url = "./assets/characters/approved/manifest.json",
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") return projectManifest;
  try {
    const response = await fetchImpl(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Project art manifest HTTP " + response.status);
    return setProjectArtManifest(await response.json());
  } catch {
    // A missing/unavailable manifest is a safe MISSING state, never an approval.
    return projectManifest;
  }
}

export function getProjectArtManifest() {
  return projectManifest;
}

export function getCharacterArtBinding(characterId, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  const base = defaultBinding(id);
  const project = projectManifest.assets[id];
  if (project) {
    const localDraft = readStore(storage)[id];
    return {
      ...base,
      ...project,
      character_id: id,
      project_asset: true,
      local_draft: localDraft || null
    };
  }
  const stored = readStore(storage)[id];
  if (stored && typeof stored === "object") {
    return {
      ...base,
      ...stored,
      character_id: id,
      status: "DRAFT",
      project_asset: false
    };
  }
  return base;
}

export function listCharacterArtBindings(characterIds = [], options = {}) {
  return characterIds.map((id) => getCharacterArtBinding(id, options));
}

export function saveLocalArtDraft(characterId, draft = {}, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  if (!id) throw new Error("character_id is required");
  const current = getCharacterArtBinding(id, { storage });
  const next = {
    ...current,
    ...draft,
    character_id: id,
    status: current.project_asset ? current.status : "DRAFT",
    project_asset: Boolean(current.project_asset),
    source: draft.source || "LOCAL ART INPUT",
    updated_at: new Date().toISOString()
  };
  const store = readStore(storage);
  store[id] = {
    filename: next.filename,
    mime: next.mime,
    local_preview: next.local_preview || null,
    source: "LOCAL ART INPUT",
    updated_at: next.updated_at
  };
  writeStore(store, storage);
  return getCharacterArtBinding(id, { storage });
}

export function setArtStatus(characterId, status, { storage = globalThis.localStorage } = {}) {
  const normalized = String(status || "").toUpperCase();
  if (normalized !== "DRAFT") {
    throw new Error("Project asset status is repository-controlled; browser may only save DRAFT");
  }
  return saveLocalArtDraft(characterId, {}, { storage });
}

export function clearLocalArtDraft(characterId, { storage = globalThis.localStorage } = {}) {
  const id = normalizeId(characterId);
  const store = readStore(storage);
  delete store[id];
  writeStore(store, storage);
  return getCharacterArtBinding(id, { storage });
}

export function isApprovedArtBinding(binding) {
  return String(binding?.status || "").toUpperCase() === "APPROVED"
    && Boolean(binding?.project_asset)
    && Boolean(String(binding?.runtime_path || "").trim());
}

export { STATUS as CHARACTER_ART_STATUSES, STORAGE_KEY as CHARACTER_ART_STORAGE_KEY };
