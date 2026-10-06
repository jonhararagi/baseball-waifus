import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { test, after } from "node:test";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "../src/purchase_authority.mjs";
import { createPurchaseProviderVerifier, PURCHASE_PROVIDER_VERIFICATION } from "../src/purchase_provider_verifier.mjs";
import { InMemoryPurchaseStore, PersistentPurchaseStore } from "../src/purchase_store.mjs";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";

const RECEIPTS = new Map([
  ["receipt-valid", { playerId: "player-001", productId: "scrap_5000", amount: 1, currency: "XTR", provider: "test-provider", transactionId: "txn-001", purchaseId: "purchase-001", grantKind: "scrap", grantAmount: 5000 }],
  ["receipt-other-player", { playerId: "player-999", productId: "scrap_5000", amount: 1, currency: "XTR", provider: "test-provider", transactionId: "txn-other", purchaseId: "purchase-other", grantKind: "scrap", grantAmount: 5000 }],
  ["receipt-other-product", { playerId: "player-001", productId: "scrap_1000", amount: 1, currency: "XTR", provider: "test-provider", transactionId: "txn-product", purchaseId: "purchase-product", grantKind: "scrap", grantAmount: 1000 }],
  ["receipt-other-amount", { playerId: "player-001", productId: "scrap_5000", amount: 2, currency: "XTR", provider: "test-provider", transactionId: "txn-amount", purchaseId: "purchase-amount", grantKind: "scrap", grantAmount: 5000 }]
]);

function fingerprint(receipt) {
  return createHash("sha256").update(receipt, "utf8").digest("hex");
}

function verifierFor(receiptOverrides = {}) {
  return createPurchaseProviderVerifier({
    verifyReceipt: async ({ receipt }) => {
      if (receipt === "receipt-forged") return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "INVALID_RECEIPT" };
      if (receipt === "receipt-down") return { status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE, reason: "PROVIDER_UNAVAILABLE" };
      const verified = RECEIPTS.get(receipt);
      if (!verified) return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "UNKNOWN_RECEIPT" };
      return {
        status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
        ...verified,
        ...receiptOverrides,
        receiptFingerprint: fingerprint(receipt)
      };
    }
  });
}

function requestBody(overrides = {}) {
  return {
    product_id: "scrap_5000",
    amount: 1,
    currency: "XTR",
    provider: "test-provider",
    transaction_id: "txn-001",
    receipt: "receipt-valid",
    ...overrides
  };
}

function authority({ store = new InMemoryPurchaseStore(), providerVerifier = verifierFor(), production = false } = {}) {
  return new PurchaseAuthority({ store, providerVerifier, production });
}

test("A/H · valid first purchase produces AUTHORIZED_GRANT", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(result.grant_kind, "scrap");
  assert.equal(result.grant_amount, 5000);
});

test("B · forged receipt is rejected without grant", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-forged", body: requestBody({ receipt: "receipt-forged", transaction_id: "txn-forged" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.grant_amount, undefined);
});

test("C · provider unavailable returns UNAVAILABLE without grant", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-down", body: requestBody({ receipt: "receipt-down", transaction_id: "txn-down" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.UNAVAILABLE);
});

test("D · production without provider verifier is fail-closed", async () => {
  const result = await authority({ providerVerifier: null, production: true }).authorize({ playerId: "player-001", purchaseId: "purchase-no-provider", body: requestBody({ transaction_id: "txn-no-provider" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.UNAVAILABLE);
  assert.equal(result.reason, "PROVIDER_VERIFIER_NOT_CONFIGURED");
});

test("E · verified receipt for another player is rejected", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-other", body: requestBody({ transaction_id: "txn-other", receipt: "receipt-other-player" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.reason, "VERIFIED_RECEIPT_MISMATCH");
});

test("F · verified product mismatch is rejected", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-product", body: requestBody({ product_id: "scrap_5000", transaction_id: "txn-product", receipt: "receipt-other-product" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
});

test("G · verified amount mismatch is rejected", async () => {
  const result = await authority().authorize({ playerId: "player-001", purchaseId: "purchase-amount", body: requestBody({ amount: 1, transaction_id: "txn-amount", receipt: "receipt-other-amount" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
});

test("I · duplicate callback is idempotent", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store });
  const first = await auth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
  const second = await auth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
  assert.equal(second.grant_amount, first.grant_amount);
});

test("J · duplicate transaction with different data is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store });
  await auth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
  const result = await auth.authorize({ playerId: "player-001", purchaseId: "purchase-002", body: requestBody({ transaction_id: "txn-001", product_id: "scrap_1000", receipt: "receipt-other-product" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.reason, "TRANSACTION_ID_REUSED_WITH_DIFFERENT_DATA");
});

test("K · reconnect/repeat request preserves the original authorized grant", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-purchase-"));
  const filePath = join(directory, "purchases.json");
  try {
    const firstStore = new PersistentPurchaseStore({ filePath });
    const firstAuth = authority({ store: firstStore });
    const first = await firstAuth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
    const recoveredStore = new PersistentPurchaseStore({ filePath });
    const recoveredAuth = authority({ store: recoveredStore });
    const recovered = await recoveredAuth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
    assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    assert.equal(recovered.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
    assert.equal(recovered.grant_amount, 5000);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("L · client cannot self-declare authority", async () => {
  await assert.rejects(
    () => authority().authorize({ playerId: "player-001", purchaseId: "purchase-client-authority", body: requestBody({ transaction_id: "txn-client-authority", authorized: true }) }),
    /Client authority fields are not accepted/
  );
});

test("purchase_id cannot be reused with different identity data", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store });
  await auth.authorize({ playerId: "player-001", purchaseId: "purchase-001", body: requestBody() });
  const result = await auth.authorize({ playerId: "player-999", purchaseId: "purchase-001", body: requestBody({ transaction_id: "txn-new", receipt: "receipt-other-player" }) });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.reason, "PURCHASE_ID_REUSED_WITH_DIFFERENT_DATA");
});

let httpInstance;

test("HTTP endpoint authenticates player and returns an authorized grant", async () => {
  const config = loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" });
  httpInstance = createAuthorityServer({
    config,
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifierFor()
  });
  await new Promise((resolve) => httpInstance.server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${httpInstance.server.address().port}`;
  const response = await fetch(`${baseUrl}/v1/purchases/purchase-001/authorize`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-player-id": "player-001" },
    body: JSON.stringify(requestBody())
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(body.player_id, "player-001");
});

after(async () => {
  if (httpInstance) await new Promise((resolve) => httpInstance.server.close(resolve));
});
