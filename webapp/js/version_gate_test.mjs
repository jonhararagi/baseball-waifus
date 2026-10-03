import assert from "node:assert/strict";
import { CLIENT_VERSION, fetchDeployedVersion, purgeProductCaches, runClientVersionGate } from "./version_gate.js";

assert.equal(CLIENT_VERSION, "v17");
let requested = null;
const deployed = await fetchDeployedVersion(async (url, options) => {
  requested = { url, options };
  return { ok: true, status: 200, json: async () => ({ version: "v17", cacheVersion: "baseball-waifus-v17" }) };
});
assert.equal(deployed, "v17");
assert.equal(requested.options.cache, "no-store");
assert.equal(requested.options.headers["cache-control"], "no-cache");

const deleted = [];
const cacheApi = {
  keys: async () => ["baseball-waifus-v17", "baseball-waifus-v16", "v16_capibara_core", "foreign-site-cache"],
  delete: async (name) => { deleted.push(name); return true; }
};
const purged = await purgeProductCaches(cacheApi);
assert.deepEqual(purged.sort(), ["baseball-waifus-v16", "v16_capibara_core"].sort());
assert.deepEqual(deleted.sort(), ["baseball-waifus-v16", "v16_capibara_core"].sort());

const storage = new Map();
globalThis.window = {
  location: { href: "https://example.test/index.html", assign(url) { this.lastAssigned = url; } },
  sessionStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  }
};
globalThis.document = {
  querySelector: () => ({
    hidden: false,
    dataset: {},
    querySelector: () => ({ replaceChildren() {} })
  }),
  createTextNode: (value) => value
};

let reloads = 0;
let unregistered = 0;
let purgeCalls = 0;
const match = await runClientVersionGate({
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ version: "v17" }) }),
  reload: () => { reloads += 1; }
});
assert.equal(match.status, "match");
assert.equal(reloads, 0);

const mismatch = await runClientVersionGate({
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ version: "v18" }) }),
  unregister: async () => { unregistered += 1; },
  purge: async () => { purgeCalls += 1; },
  reload: () => { reloads += 1; }
});
assert.equal(mismatch.status, "recovering");
assert.equal(unregistered, 1);
assert.equal(purgeCalls, 1);
assert.equal(reloads, 1);

const blocked = await runClientVersionGate({
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ version: "v18" }) }),
  unregister: async () => { throw new Error("must not unregister twice"); },
  purge: async () => { throw new Error("must not purge twice"); },
  reload: () => { reloads += 1; }
});
assert.equal(blocked.status, "failed");
assert.equal(reloads, 1);

console.log("[BONE-001] version gate, cache purge, match, mismatch recovery and reload-loop guard passed");
