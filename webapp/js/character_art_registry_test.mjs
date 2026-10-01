import assert from "node:assert/strict";
import {
  getCharacterArtBinding,
  saveLocalArtDraft,
  setArtStatus,
  clearLocalArtDraft,
  isApprovedArtBinding
} from "./character_art_registry.js";

const data = new Map();
const storage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};

const missing = getCharacterArtBinding("bw001", { storage });
assert.equal(missing.character_id, "bw001");
assert.equal(missing.status, "MISSING");
assert.match(missing.runtime_path, /assets\/characters\/approved\/bw001\.png$/);
assert.equal(isApprovedArtBinding(missing), false);

const draft = saveLocalArtDraft("bw001", {
  filename: "aiko-test.png",
  mime: "image/png"
}, { storage });
assert.equal(draft.status, "DRAFT");
assert.equal(draft.filename, "aiko-test.png");

const approved = setArtStatus("bw001", "APPROVED", { storage });
assert.equal(approved.status, "APPROVED");
assert.equal(isApprovedArtBinding(approved), true);

const reset = clearLocalArtDraft("bw001", { storage });
assert.equal(reset.status, "MISSING");
assert.equal(isApprovedArtBinding(reset), false);

console.log("character_art_registry_test: PASS");
