import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  buildTelegramStarsInvoicePayload,
  createTelegramStarsProviderAdapter,
  createTelegramStarsProviderAdapterFromConfig,
  TELEGRAM_STARS_PROVIDER,
  TELEGRAM_STARS_CURRENCY,
  TELEGRAM_STARS_WEBHOOK_SECRET_HEADER
} from "../src/telegram_stars_adapter.mjs";
import { PURCHASE_PROVIDER_ADAPTER_STATUS } from "../src/purchase_provider_adapter.mjs";
import { PURCHASE_PROVIDER_VERIFICATION } from "../src/purchase_provider_verifier.mjs";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "../src/purchase_authority.mjs";
import { InMemoryPurchaseStore } from "../src/purchase_store.mjs";
import { loadConfig } from "../src/config.mjs";

const secret = "telegram-stars-test-webhook-secret";

const purchase = {
  purchaseId: "purchase-stars-001",
  playerId: "telegram:7001",
  productId: "scrap_5000",
  amount: 50,
  currency: TELEGRAM_STARS_CURRENCY,
  provider: TELEGRAM_STARS_PROVIDER,
  transactionId: "tg-charge-001",
  receipt: "not-used-by-callback",
  grantKind: "scrap",
  grantAmount: 5000
};

function seedPurchase(store) {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(callback()))
    .digest("hex");
  store.savePurchase({
    purchaseId: purchase.purchaseId,
    playerId: purchase.playerId,
    productId: purchase.productId,
    amount: purchase.amount,
    currency: purchase.currency,
    provider: purchase.provider,
    providerTransactionId: purchase.transactionId,
    receiptFingerprint: fingerprint,
    grantKind: purchase.grantKind,
    grantAmount: purchase.grantAmount
  });
}

function callback({ from = {}, successfulPayment = {}, ...topLevel } = {}) {
  const payment = {
    currency: purchase.currency,
    total_amount: purchase.amount,
    invoice_payload: buildTelegramStarsInvoicePayload(purchase),
    telegram_payment_charge_id: purchase.transactionId,
    ...successfulPayment
  };
  return {
    update_id: 901,
    ...topLevel,
    message: {
      from: { id: 7001, ...from },
      successful_payment: payment
    }
  };
}

function input(overrides = {}) {
  const body = callback(overrides);
  return {
    body,
    rawBody: Buffer.from(JSON.stringify(body), "utf8"),
    headers: { [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: secret }
  };
}

test("A · valid Telegram Stars successful_payment is VERIFIED", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input());
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.READY);
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.VERIFIED);
  assert.equal(result.provider, TELEGRAM_STARS_PROVIDER);
  assert.equal(result.currency, "XTR");
  assert.equal(result.playerId, purchase.playerId);
  assert.equal(result.grantAmount, 5000);
});

test("B · wrong currency is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input({
    successfulPayment: { currency: "USD" }
  }));
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "INVALID_CURRENCY");
});

test("C · missing successful_payment is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback({
    body: { message: { from: { id: 7001 } } },
    rawBody: Buffer.from('{"message":{"from":{"id":7001}}}'),
    headers: { [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: secret }
  });
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "SUCCESSFUL_PAYMENT_MISSING");
});

test("D · invalid invoice payload is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input({
    successfulPayment: { invoice_payload: "forged" }
  }));
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "INVALID_INVOICE_PAYLOAD");
});

test("E · unknown purchase is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input());
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "PURCHASE_NOT_FOUND");
});

test("F · identity mismatch is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input({
    from: { id: 8002 }
  }));
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "PURCHASE_IDENTITY_MISMATCH");
});

test("G · amount mismatch is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input({
    successfulPayment: {
      total_amount: 51,
      invoice_payload: buildTelegramStarsInvoicePayload({ ...purchase, amount: 51 })
    }
  }));
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "PURCHASE_AMOUNT_MISMATCH");
});

test("H · first callback authorizes and duplicate callback is NO_OP", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const authority = new PurchaseAuthority({
    store,
    providerVerifier: adapter.verifier
  });
  const verified = await adapter.verifyPurchaseCallback(input());
  assert.equal(verified.status, PURCHASE_PROVIDER_VERIFICATION.VERIFIED);
  const first = await authority.authorizeProviderCallback(input());
  const second = await authority.authorizeProviderCallback(input());
  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
});

test("I · conflicting duplicate transaction is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const authority = new PurchaseAuthority({ store, providerVerifier: adapter.verifier });
  const firstVerified = await adapter.verifyPurchaseCallback(input());
  assert.equal(firstVerified.status, PURCHASE_PROVIDER_VERIFICATION.VERIFIED);
  const first = await authority.authorizeProviderCallback(input());
  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);

  const conflicting = await authority.authorizeProviderCallback(input({
    successfulPayment: {
      provider_payment_charge_id: "provider-charge-conflict"
    }
  }));
  assert.equal(conflicting.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(conflicting.reason, "IDEMPOTENCY_CONFLICT");
});

test("J · missing webhook credential is not READY", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: "", purchaseStore: store });
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE);
  const result = await adapter.verifyPurchaseCallback(input());
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE);
});

test("K · invalid webhook secret is rejected and status does not expose it", async () => {
  const store = new InMemoryPurchaseStore();
  seedPurchase(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback({
    ...input(),
    headers: { [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: "wrong-secret" }
  });
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "TELEGRAM_WEBHOOK_AUTH_INVALID");
  const status = adapter.getStatus();
  assert.doesNotMatch(JSON.stringify(status), /telegram-stars-test-webhook-secret/);
});

test("L · config seam marks Telegram Stars credential without exposing its value", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    PURCHASE_PROVIDER: "telegram-stars",
    PURCHASE_PROVIDER_ENDPOINT: "",
    TELEGRAM_STARS_WEBHOOK_SECRET: secret,
    REWARD_SIGNING_PRIVATE_KEY: "test-only",
    TELEGRAM_BOT_TOKEN: "test-only",
    ALLOWED_ORIGINS: "https://example.github.io",
    AUTHORITY_PERSISTENCE_PROVIDER: "managed",
    AUTHORITY_PERSISTENCE_DSN: "managed://test"
  });
  assert.equal(config.purchaseProvider, TELEGRAM_STARS_PROVIDER);
  assert.equal(config.purchaseProviderCredentialConfigured, true);
  assert.equal(config.purchaseProviderConfigConfigured, true);
  assert.equal("telegramStarsWebhookSecret" in config, false);
  assert.equal(config.telegramStarsWebhookSecretConfigured, true);
  assert.doesNotMatch(JSON.stringify(config), /telegram-stars-test-webhook-secret/);
});

test("M · config adapter stays unavailable until the purchase store dependency exists", () => {
  const config = loadConfig({
    NODE_ENV: "test",
    PURCHASE_PROVIDER: "telegram-stars",
    TELEGRAM_STARS_WEBHOOK_SECRET: secret
  });
  const adapter = createTelegramStarsProviderAdapterFromConfig(config);
  assert.equal(adapter.getStatus().state, PURCHASE_PROVIDER_ADAPTER_STATUS.CONFIGURED_UNAVAILABLE);
});

console.log("telegram_stars_adapter_test: PASS");
