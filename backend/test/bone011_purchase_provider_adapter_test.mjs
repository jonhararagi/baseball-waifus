import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPurchaseProviderAdapter,
  createPurchaseProviderAdapterFromConfig,
  PURCHASE_PROVIDER_ADAPTER_STATUS
} from "../src/purchase_provider_adapter.mjs";
import { PURCHASE_PROVIDER_VERIFICATION } from "../src/purchase_provider_verifier.mjs";
import { loadConfig } from "../src/config.mjs";

function verifiedReceipt() {
  return Object.freeze({
    status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
    purchaseId: "purchase-001",
    playerId: "player-001",
    productId: "scrap_5000",
    amount: 1,
    currency: "XTR",
    provider: "test-provider",
    transactionId: "txn-001",
    receiptFingerprint: "a".repeat(64),
    grantKind: "scrap",
    grantAmount: 5000
  });
}

test("provider absent is NOT_CONFIGURED and cannot grant", async () => {
  const adapter = createPurchaseProviderAdapter();
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED);
  const result = await adapter.verifyReceipt({ receipt: "anything" });
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE);
  assert.equal(result.reason, "PROVIDER_NOT_CONFIGURED");
});

test("provider configured without credential is CONFIGURED_UNAVAILABLE", async () => {
  const adapter = createPurchaseProviderAdapter({
    provider: "test-provider",
    credentialsConfigured: false,
    available: false,
    verifyReceipt: async () => verifiedReceipt()
  });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE);
  assert.equal(adapter.getStatus().ready, false);
  const result = await adapter.verifyReceipt({});
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE);
});

test("provider configured and available becomes READY", async () => {
  const adapter = createPurchaseProviderAdapter({
    provider: "test-provider",
    credentialsConfigured: true,
    available: true,
    verifyReceipt: async () => verifiedReceipt()
  });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.READY);
  const result = await adapter.verifyReceipt({ receipt: "provider-receipt" });
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.VERIFIED);
  assert.equal(result.grantAmount, 5000);
});

test("malformed provider response remains outside authorized boundary", async () => {
  const adapter = createPurchaseProviderAdapter({
    provider: "test-provider",
    credentialsConfigured: true,
    available: true,
    verifyReceipt: async () => ({ malformed: true })
  });
  const result = await adapter.verifyReceipt({});
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE);
});

test("provider unavailable never becomes VERIFIED", async () => {
  const adapter = createPurchaseProviderAdapter({
    provider: "test-provider",
    credentialsConfigured: true,
    available: false,
    verifyReceipt: async () => verifiedReceipt()
  });
  const result = await adapter.verifyReceipt({});
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE);
});

test("adapter status contains no credential material", () => {
  const secret = "PROVIDER-SECRET-MUST-NOT-LEAK";
  const adapter = createPurchaseProviderAdapter({
    provider: "test-provider",
    credentialsConfigured: true,
    available: false,
    verifyReceipt: async () => verifiedReceipt()
  });
  const status = adapter.getStatus();
  assert.equal("credential" in status, false);
  assert.doesNotMatch(JSON.stringify(status), /PROVIDER-SECRET-MUST-NOT-LEAK/);

  const config = loadConfig({
    NODE_ENV: "production",
    PURCHASE_PROVIDER: "test-provider",
    PURCHASE_PROVIDER_ENDPOINT: "https://provider.invalid",
    PURCHASE_PROVIDER_CREDENTIAL: secret,
    REWARD_SIGNING_PRIVATE_KEY: "not-real-test-material",
    TELEGRAM_BOT_TOKEN: "not-real-test-material",
    ALLOWED_ORIGINS: "https://example.github.io",
    AUTHORITY_PERSISTENCE_PROVIDER: "managed",
    AUTHORITY_PERSISTENCE_DSN: "managed://test"
  });
  assert.equal(config.purchaseProviderCredentialConfigured, true);
  assert.equal("purchaseProviderCredential" in config, false);
  assert.doesNotMatch(JSON.stringify(config), /PROVIDER-SECRET-MUST-NOT-LEAK/);
});

test("config-only adapter distinguishes NOT_CONFIGURED from CONFIGURED_UNAVAILABLE", () => {
  const absent = createPurchaseProviderAdapterFromConfig(loadConfig({ NODE_ENV: "test" }));
  assert.equal(absent.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.NOT_CONFIGURED);

  const configured = createPurchaseProviderAdapterFromConfig(loadConfig({
    NODE_ENV: "test",
    PURCHASE_PROVIDER: "test-provider",
    PURCHASE_PROVIDER_ENDPOINT: "https://provider.invalid"
  }));
  assert.equal(configured.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE);
  assert.equal(configured.getStatus().provider, "test-provider");
});