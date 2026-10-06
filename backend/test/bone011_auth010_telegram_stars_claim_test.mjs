import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createTelegramStarsProviderAdapter,
  buildTelegramStarsInvoicePayload,
  TELEGRAM_STARS_CURRENCY,
  TELEGRAM_STARS_PROVIDER,
  TELEGRAM_STARS_WEBHOOK_SECRET_HEADER
} from "../src/telegram_stars_adapter.mjs";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "../src/purchase_authority.mjs";
import { InMemoryPurchaseStore, PersistentPurchaseStore } from "../src/purchase_store.mjs";
import { PURCHASE_PROVIDER_VERIFICATION } from "../src/purchase_provider_verifier.mjs";

const secret = "auth010-webhook-secret";
const purchase = {
  purchaseId: "auth010-purchase-001",
  playerId: "telegram:81001",
  productId: "scrap_5000",
  amount: 50,
  currency: TELEGRAM_STARS_CURRENCY,
  provider: TELEGRAM_STARS_PROVIDER,
  transactionId: "auth010-tg-charge-001",
  providerTransactionId: "auth010-tg-charge-001",
  grantKind: "scrap",
  grantAmount: 5000
};

function pendingRecord(store) {
  return store.createPendingPurchase({
    ...purchase,
    receiptFingerprint: createHash("sha256").update("telegram-auth010-receipt", "utf8").digest("hex")
  });
}

function callback(overrides = {}) {
  return {
    update_id: 810010,
    message: {
      from: { id: 81001 },
      successful_payment: {
        currency: purchase.currency,
        total_amount: purchase.amount,
        invoice_payload: buildTelegramStarsInvoicePayload(purchase),
        telegram_payment_charge_id: purchase.transactionId,
        ...overrides
      }
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

async function runCallbackFlow(store) {
  pendingRecord(store);
  const adapter = createTelegramStarsProviderAdapter({
    webhookSecret: secret,
    purchaseStore: store
  });
  const authority = new PurchaseAuthority({
    store,
    providerVerifier: adapter.verifier
  });

  const verified = await adapter.verifyPurchaseCallback(input());
  assert.equal(verified.status, PURCHASE_PROVIDER_VERIFICATION.VERIFIED);
  assert.equal(verified.playerId, purchase.playerId);
  assert.equal(verified.transactionId, purchase.transactionId);
  assert.equal(verified.grantAmount, purchase.grantAmount);

  const authorized = await authority.authorizeProviderCallback(input());
  assert.equal(authorized.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(store.loadPurchase(purchase.purchaseId).authorizationStatus, "AUTHORIZED");
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "UNCLAIMED");

  const claim = authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
  assert.equal(claim.status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);
  const duplicateClaim = authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
  assert.equal(duplicateClaim.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED);

  const duplicateCallback = await authority.authorizeProviderCallback(input());
  assert.equal(duplicateCallback.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");

  return { adapter, authority };
}

test("AUTH-010 A · real Telegram Stars adapter callback promotes pending purchase to AUTHORIZED_GRANT then one-time claim", async () => {
  await runCallbackFlow(new InMemoryPurchaseStore());
});

test("AUTH-010 B · client injection cannot change verified identity, product, transaction or grant", async () => {
  const store = new InMemoryPurchaseStore();
  pendingRecord(store);
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const authority = new PurchaseAuthority({ store, providerVerifier: adapter.verifier });

  const body = callback();
  body.player_id = "attacker";
  body.product_id = "fake";
  body.amount = 999999;
  body.grant_amount = 999999;
  body.claimed = false;
  const result = await authority.authorizeProviderCallback({
    body,
    rawBody: Buffer.from(JSON.stringify(body), "utf8"),
    headers: { [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: secret }
  });

  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  const persisted = store.loadPurchase(purchase.purchaseId);
  assert.equal(persisted.playerId, purchase.playerId);
  assert.equal(persisted.productId, purchase.productId);
  assert.equal(persisted.amount, purchase.amount);
  assert.equal(persisted.grantAmount, purchase.grantAmount);
  assert.equal(persisted.claimStatus, "UNCLAIMED");
});

test("AUTH-010 C · conflicting callback cannot overwrite the authorized purchase", async () => {
  const store = new InMemoryPurchaseStore();
  const { authority } = await runCallbackFlow(store);
  const conflict = callback({ total_amount: 51 });
  const result = await authority.authorizeProviderCallback({
    body: conflict,
    rawBody: Buffer.from(JSON.stringify(conflict), "utf8"),
    headers: { [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: secret }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.ok([ "INVALID_INVOICE_PAYLOAD", "PURCHASE_AMOUNT_MISMATCH" ].includes(result.reason));
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");
});

test("AUTH-010 D · another Telegram user cannot claim the purchase", async () => {
  const store = new InMemoryPurchaseStore();
  const { authority } = await runCallbackFlow(store);
  assert.equal(
    authority.claim({ playerId: "telegram:81002", purchaseId: purchase.purchaseId }),
    null
  );
});

test("AUTH-010 E · unknown Telegram purchase is rejected safely", async () => {
  const store = new InMemoryPurchaseStore();
  const adapter = createTelegramStarsProviderAdapter({ webhookSecret: secret, purchaseStore: store });
  const result = await adapter.verifyPurchaseCallback(input());
  assert.equal(result.status, PURCHASE_PROVIDER_VERIFICATION.REJECTED);
  assert.equal(result.reason, "PURCHASE_NOT_FOUND");
});

test("AUTH-010 F · claimed state survives restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-auth010-"));
  const filePath = join(directory, "purchases.json");
  try {
    await runCallbackFlow(new PersistentPurchaseStore({ filePath }));
    const storeAfterRestart = new PersistentPurchaseStore({ filePath });
    const adapter = createTelegramStarsProviderAdapter({
      webhookSecret: secret,
      purchaseStore: storeAfterRestart
    });
    const authority = new PurchaseAuthority({
      store: storeAfterRestart,
      providerVerifier: adapter.verifier
    });

    const duplicateCallback = await authority.authorizeProviderCallback(input());
    assert.equal(duplicateCallback.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
    assert.equal(
      authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("AUTH-010 G · no economic side effect in AUTH-010", async () => {
  const store = new InMemoryPurchaseStore();
  const before = { scrap: 0, boosts: 0, playerMeta: null };
  await runCallbackFlow(store);
  const persisted = store.loadPurchase(purchase.purchaseId);
  assert.equal(before.scrap, 0);
  assert.equal(before.boosts, 0);
  assert.equal(before.playerMeta, null);
  assert.equal(persisted.grantAmount, 5000);
  assert.equal(persisted.claimStatus, "GRANT_CLAIMED");
});

console.log("bone011_auth010_telegram_stars_claim_test: PASS");
