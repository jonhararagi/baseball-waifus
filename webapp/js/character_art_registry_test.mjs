import assert from "node:assert/strict";
import {
  getCharacterArtBinding,
  saveLocalArtDraft,
  setArtStatus,
  clearLocalArtDraft,
  isApprovedArtBinding,
  setProjectArtManifest
} from "./character_art_registry.js";

const data = new Map();
const storage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};

setProjectArtManifest({ schema_version: 1, assets: {} });

const missing = getCharacterArtBinding("bw001", { storage });
assert.equal(missing.character_id, "bw001");
assert.equal(missing.status, "MISSING");
assert.equal(missing.project_asset, false);
assert.match(missing.runtime_path, /assets\/characters\/approved\/bw001\.png$/);
assert.equal(isApprovedArtBinding(missing), false);

const draft = saveLocalArtDraft("bw001", {
  filename: "aiko-test.png",
  mime: "image/png"
}, { storage });
assert.equal(draft.status, "DRAFT");
assert.equal(draft.filename, "aiko-test.png");
assert.equal(draft.project_asset, false);
assert.equal(isApprovedArtBinding(draft), false);

assert.throws(
  () => setArtStatus("bw001", "APPROVED", { storage }),
  /repository-controlled/
);

setProjectArtManifest({
  schema_version: 1,
  assets: {
    bw001: {
      status: "PROCESSED",
      runtime_path: "./assets/characters/approved/bw001.png",
      filename: "bw001.png",
      mime: "image/png",
      width: 2048,
      height: 3072
    }
  }
});
const processed = getCharacterArtBinding("bw001", { storage });
assert.equal(processed.status, "PROCESSED");
assert.equal(processed.project_asset, true);
assert.equal(isApprovedArtBinding(processed), false);

setProjectArtManifest({
  schema_version: 1,
  assets: {
    bw001: {
      status: "APPROVED",
      runtime_path: "./assets/characters/approved/bw001.png",
      filename: "bw001.png",
      mime: "image/png",
      width: 2048,
      height: 3072,
      approved_at: "2026-10-01T00:00:00Z"
    }
  }
});
const approved = getCharacterArtBinding("bw001", { storage });
assert.equal(approved.status, "APPROVED");
assert.equal(approved.project_asset, true);
assert.equal(approved.width, 2048);
assert.equal(isApprovedArtBinding(approved), true);

const reset = clearLocalArtDraft("bw001", { storage });
assert.equal(reset.status, "APPROVED");
assert.equal(reset.project_asset, true);
assert.equal(isApprovedArtBinding(reset), true);

setProjectArtManifest({ schema_version: 1, assets: {} });
assert.equal(getCharacterArtBinding("bw001", { storage }).status, "MISSING");

console.log("character_art_registry_test: PASS");
