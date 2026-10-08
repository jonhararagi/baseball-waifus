import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig, validateProductionConfig } from "../src/config.mjs";
import { createPersistenceStore, persistenceReadiness } from "../src/persistence_provider.mjs";
import { createPurchaseStore, purchasePersistenceReadiness } from "../src/purchase_persistence_provider.mjs";
import { ManagedCombatStore } from "../src/managed_combat_store.mjs";
import { ManagedPurchaseStore } from "../src/managed_purchase_store.mjs";
import { createAuthorityServer } from "../src/server.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";

function productionEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    PORT: "8787",
    REWARD_SIGNING_PRIVATE_KEY: "test-key-material",
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "https://example.github.io",
    AUTHORITY_PERSISTENCE_PROVIDER: "managed",
    AUTHORITY_PERSISTENCE_DSN: "external://provider-not-connected",
    ...overrides
  };
}

test("production config accepts only explicit external boundaries", () => {
  const config = loadConfig(productionEnv());
  assert.deepEqual(validateProductionConfig(config), { ok: true });
});

test("production fails without signing key", () => {
  assert.throws(() => validateProductionConfig(loadConfig(productionEnv({ REWARD_SIGNING_PRIVATE_KEY: "" }))), /REWARD_SIGNING_PRIVATE_KEY/);
});

test("production fails without Telegram Bot Token", () => {
  assert.throws(() => validateProductionConfig(loadConfig(productionEnv({ TELEGRAM_BOT_TOKEN: "" }))), /TELEGRAM_BOT_TOKEN/);
});

test("production fails without managed persistence", () => {
  const config = loadConfig(productionEnv({ AUTHORITY_PERSISTENCE_PROVIDER: "filesystem", AUTHORITY_PERSISTENCE_FILE: "/tmp/authority.json", AUTHORITY_PERSISTENCE_DSN: "" }));
  assert.throws(() => validateProductionConfig(config), /managed/);
});

test("production fails with wildcard CORS", () => {
  assert.throws(() => validateProductionConfig(loadConfig(productionEnv({ ALLOWED_ORIGINS: "*" }))), /wildcard/);
});

test("production fails without explicit origins", () => {
  assert.throws(() => validateProductionConfig(loadConfig(productionEnv({ ALLOWED_ORIGINS: "" }))), /ALLOWED_ORIGINS/);
});

test("production startup does not fall back to filesystem", () => {
  assert.throws(() => createAuthorityServer({ config: loadConfig(productionEnv()) }), /Managed production persistence is not configured/);
});

test("health/readiness exposes no secret material", async () => {
  const instance = createAuthorityServer({
    config: loadConfig({ NODE_ENV: "test", PORT: "0", ALLOWED_ORIGINS: "*" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner()
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  const url = "http://127.0.0.1:" + instance.server.address().port;
  const health = await fetch(url + "/health");
  assert.equal(health.status, 200);
  const ready = await fetch(url + "/ready");
  assert.equal(ready.status, 503);
  const body = await ready.json();
  assert.equal(body.ready, false);
  assert.equal(body.deployment_mode, "test");
  assert.equal("private_key" in body, false);
  assert.equal("telegram_bot_token" in body, false);
  assert.equal("persistence_dsn" in body, false);
  await new Promise((resolve) => instance.server.close(resolve));
});

test("public JWK excludes private key material", () => {
  const signer = createEphemeralTestSigner();
  assert.equal("d" in signer.publicKeyJwk, false);
});

test("docker files exclude secret injection directives", async () => {
  const fs = await import("node:fs/promises");
  const dockerfile = await fs.readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  const dockerignore = await fs.readFile(new URL("../.dockerignore", import.meta.url), "utf8");
  assert.doesNotMatch(dockerfile, /ARG\s+REWARD_SIGNING_PRIVATE_KEY/);
  assert.doesNotMatch(dockerfile, /ENV\s+REWARD_SIGNING_PRIVATE_KEY/);
  assert.match(dockerignore, /\.env/);
  assert.match(dockerignore, /\*\.pem/);
  assert.match(dockerignore, /\*\.key/);
});
