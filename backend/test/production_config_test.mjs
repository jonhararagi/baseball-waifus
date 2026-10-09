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
import { createTelegramStarsProviderAdapterFromConfig } from "../src/telegram_stars_adapter.mjs";
import { createPurchaseProviderAdapterFromConfig, PURCHASE_PROVIDER_ADAPTER_STATUS } from "../src/purchase_provider_adapter.mjs";
import { evaluatePurchaseReadiness, purchaseReadinessSatisfied } from "../src/purchase_readiness.mjs";

function productionEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    PORT: "8787",
    REWARD_SIGNING_PRIVATE_KEY: "test-key-material",
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "https://example.github.io",
    AUTHORITY_PERSISTENCE_PROVIDER: "managed",
    AUTHORITY_PERSISTENCE_DSN: "postgres://db.example/basewarriors",
    PURCHASE_PROVIDER: "telegram-stars",
    TELEGRAM_STARS_WEBHOOK_SECRET: "test-stars-webhook-secret",
    ...overrides
  };
}

test("production config accepts only explicit external boundaries", () => {
  const config = loadConfig(productionEnv());
  assert.deepEqual(validateProductionConfig(config), { ok: true });
});


test("production fails when PURCHASE_PROVIDER is missing", () => {
  const config = loadConfig(productionEnv({ PURCHASE_PROVIDER: "" }));
  assert.throws(() => validateProductionConfig(config), /PURCHASE_PROVIDER/);
});

test("production rejects unsupported purchase providers without echoing the value", () => {
  const secretLikeProvider = "unsupported-provider-sentinel";
  const config = loadConfig(productionEnv({ PURCHASE_PROVIDER: secretLikeProvider }));
  assert.throws(
    () => validateProductionConfig(config),
    (error) => /unsupported provider/.test(error.message) && !error.message.includes(secretLikeProvider)
  );
});

test("production fails when Telegram Stars webhook secret is missing", () => {
  const config = loadConfig(productionEnv({ TELEGRAM_STARS_WEBHOOK_SECRET: "" }));
  assert.throws(() => validateProductionConfig(config), /TELEGRAM_STARS_WEBHOOK_SECRET/);
});

test("Telegram Stars webhook secret is in-process only and not JSON-serialized", () => {
  const sentinel = "test-stars-secret-must-not-serialize";
  const config = loadConfig(productionEnv({ TELEGRAM_STARS_WEBHOOK_SECRET: sentinel }));
  assert.equal(config.telegramStarsWebhookSecret, sentinel);
  assert.equal(config.telegramStarsWebhookSecretConfigured, true);
  assert.doesNotMatch(JSON.stringify(config), new RegExp(sentinel));
  assert.equal(Object.isFrozen(config), true);
});

test("purchase provider readiness is NOT_CONFIGURED when absent", () => {
  const config = loadConfig({ NODE_ENV: "test" });
  const store = { loadPurchase() {}, isDurable: true, isOperational: true };
  const adapter = createPurchaseProviderAdapterFromConfig(config);
  const status = evaluatePurchaseReadiness({
    config,
    purchaseAuthority: { authorize() {}, getStatus() {} },
    purchaseStore: store,
    purchaseProviderAdapter: adapter
  });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED);
  assert.equal(status.purchase_provider, false);
  assert.equal(purchaseReadinessSatisfied(status), false);
});

test("purchase provider configured but unavailable remains not ready", () => {
  const config = loadConfig(productionEnv());
  const store = { loadPurchase() {}, isDurable: true, isOperational: true };
  const adapter = createTelegramStarsProviderAdapterFromConfig(config, {
    webhookSecret: config.telegramStarsWebhookSecret,
    purchaseStore: store,
    available: false
  });
  const status = evaluatePurchaseReadiness({
    config,
    purchaseAuthority: { authorize() {}, getStatus() {} },
    purchaseStore: store,
    purchaseProviderAdapter: adapter
  });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE);
  assert.equal(status.purchase_provider, false);
  assert.equal(purchaseReadinessSatisfied(status), false);
});

test("purchase provider reaches READY only with adapter and managed purchase persistence operational", () => {
  const config = loadConfig(productionEnv());
  const store = { loadPurchase() {}, isDurable: true, isOperational: true };
  const adapter = createTelegramStarsProviderAdapterFromConfig(config, {
    webhookSecret: config.telegramStarsWebhookSecret,
    purchaseStore: store,
    available: true
  });
  const status = evaluatePurchaseReadiness({
    config,
    purchaseAuthority: { authorize() {}, getStatus() {} },
    purchaseStore: store,
    purchaseProviderAdapter: adapter
  });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.READY);
  assert.equal(status.purchase_persistence, true);
  assert.equal(status.purchase_provider, true);
  assert.equal(purchaseReadinessSatisfied(status), true);
});

test("configured provider cannot make readiness pass if managed persistence is unavailable", () => {
  const config = loadConfig(productionEnv());
  const store = { loadPurchase() {}, isDurable: true, isOperational: false };
  const adapter = createTelegramStarsProviderAdapterFromConfig(config, {
    webhookSecret: config.telegramStarsWebhookSecret,
    purchaseStore: store,
    available: true
  });
  const status = evaluatePurchaseReadiness({
    config,
    purchaseAuthority: { authorize() {}, getStatus() {} },
    purchaseStore: store,
    purchaseProviderAdapter: adapter
  });
  assert.equal(status.purchase_provider, true);
  assert.equal(status.purchase_persistence, false);
  assert.equal(purchaseReadinessSatisfied(status), false);
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

test("production provider selection creates managed durable stores without development fallback", () => {
  const config = loadConfig(productionEnv());
  const combatStore = createPersistenceStore(config);
  const purchaseStore = createPurchaseStore(config);
  assert.equal(combatStore.constructor.name, "ManagedCombatStore");
  assert.equal(purchaseStore.constructor.name, "ManagedPurchaseStore");
  assert.equal(combatStore.isDurable, true);
  assert.equal(purchaseStore.isDurable, true);
  assert.equal(combatStore.isOperational, false);
  assert.equal(purchaseStore.isOperational, false);
  assert.equal(persistenceReadiness(config, combatStore), false);
  assert.equal(purchasePersistenceReadiness(config, purchaseStore), false);
  void combatStore.close();
  void purchaseStore.close();
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
  const rendered = JSON.stringify(body);
  for (const sentinel of [
    "private-key-sentinel",
    "bot-token-sentinel",
    "stars-secret-sentinel",
    "postgres://user:password@db/private",
    "password"
  ]) assert.equal(rendered.includes(sentinel), false);
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
