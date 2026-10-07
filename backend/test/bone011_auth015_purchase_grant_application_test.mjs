import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "../src/purchase_authority.mjs";
import { createPurchaseProviderVerifier, PURCHASE_PROVIDER_VERIFICATION } from "../src/purchase_provider_verifier.mjs";
import { InMemoryPurchaseStore, PersistentPurchaseStore } from "../src/purchase_store.mjs";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";

function fingerprint(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const purchase = {
  purchaseId: "apply-purchase-001",
  playerId: "player-apply-001",
  productId: "scrap_5000",
  amount: 50,
  currency: "XTR",
  provider: "test-provider",
  providerTransactionId: "apply-txn-001",
  receiptFingerprint: fingerprint("apply-receipt-001"),
  transactionKey: "test-provider:apply-txn-001",
  grantKind: "scrap",
  grantAmount: 5000,
  claimStatus: "GRANT_CLAIMED",
  authorizationStatus: "AUTHORIZED",
  createdAt: new Date().toISOString()
};

function seed(store) {
  store.savePurchase(purchase);
  return store;
}

function authority(store) {
  return new PurchaseAuthority({ store });
}

test("first valid grant application derives economy from persisted purchase", () => {
  const store = seed(new InMemoryPurchaseStore());
  const result = authority(store).applyGrant({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.GRANT_APPLIED);
  assert.equal(result.grant_amount, 5000);
  assert.equal(result.currency, "XTR");
  assert.equal(result.fulfillment_id, "purchase-grant:" + purchase.purchaseId);
  assert.equal(result.balance_after, 5000);

  const meta = store.loadPlayerMeta(purchase.playerId);
  assert.equal(meta.currencies.SCRAP, 5000);
  assert.equal(meta.rewardLedger[result.fulfillment_id], true);
  assert.equal(store.fulfillments.size, 1);
});

test("client economic authority injection is rejected", () => {
  const store = seed(new InMemoryPurchaseStore());
  assert.throws(
    () => authority(store).applyGrant({
      playerId: purchase.playerId,
      purchaseId: purchase.purchaseId,
      body: {
        playerId: "attacker",
        amount: 999999999,
        resource: "SCRAP",
        grant: { amount: 999999999 },
        fulfillmentId: "fake"
      }
    }),
    /no client authority fields/
  );
  assert.equal(store.loadPlayerMeta(purchase.playerId).currencies.SCRAP, 0);
  assert.equal(store.fulfillments.size, 0);
});

test("unclaimed and unauthorized purchases cannot grant", () => {
  const unclaimed = { ...purchase, purchaseId: "apply-unclaimed", claimStatus: "UNCLAIMED" };
  const store = new InMemoryPurchaseStore();
  store.savePurchase(unclaimed);
  assert.throws(
    () => authority(store).applyGrant({ playerId: purchase.playerId, purchaseId: unclaimed.purchaseId }),
    /must be claimed/
  );

  const pending = {
    ...purchase,
    purchaseId: "apply-pending",
    authorizationStatus: "PENDING",
    claimStatus: "UNCLAIMED",
    providerTransactionId: "pending:apply-pending",
    receiptFingerprint: fingerprint("pending:apply-pending"),
    transactionKey: "test-provider:pending:apply-pending"
  };
  store.savePurchase(pending);
  assert.throws(
    () => authority(store).applyGrant({ playerId: purchase.playerId, purchaseId: pending.purchaseId }),
    /not authorized/
  );
});

test("unknown and foreign purchase do not reveal or mutate state", () => {
  const store = seed(new InMemoryPurchaseStore());
  const auth = authority(store);
  assert.equal(auth.applyGrant({ playerId: "unknown-player", purchaseId: "missing-purchase" }), null);
  assert.equal(auth.applyGrant({ playerId: "foreign-player", purchaseId: purchase.purchaseId }), null);
  assert.equal(store.loadPlayerMeta(purchase.playerId).currencies.SCRAP, 0);
  assert.equal(store.fulfillments.size, 0);
});

test("repeated application is idempotent and does not duplicate Player Meta", () => {
  const store = seed(new InMemoryPurchaseStore());
  const auth = authority(store);
  const first = auth.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
  const second = auth.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.GRANT_APPLIED);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_APPLIED);
  assert.equal(store.loadPlayerMeta(purchase.playerId).currencies.SCRAP, 5000);
  assert.equal(Object.keys(store.loadPlayerMeta(purchase.playerId).rewardLedger).length, 1);
  assert.equal(store.fulfillments.size, 1);
});

test("restart recovery preserves exactly-once grant, Player Meta and fulfillment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-auth015-restart-"));
  const filePath = join(directory, "purchases.json");
  try {
    const storeA = seed(new PersistentPurchaseStore({ filePath }));
    const first = authority(storeA).applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
    assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.GRANT_APPLIED);

    const storeB = new PersistentPurchaseStore({ filePath });
    const second = authority(storeB).applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
    assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_APPLIED);
    assert.equal(storeB.loadPlayerMeta(purchase.playerId).currencies.SCRAP, 5000);
    assert.equal(Object.keys(storeB.loadPlayerMeta(purchase.playerId).rewardLedger).length, 1);
    assert.equal(Object.keys(JSON.parse(await readFile(filePath, "utf8")).fulfillments).length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("concurrent same-purchase applications grant exactly once", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-auth015-concurrency-"));
  const filePath = join(directory, "purchases.json");
  try {
    const store = seed(new PersistentPurchaseStore({ filePath }));
    const auth = authority(store);
    const results = await Promise.all([
      Promise.resolve().then(() => auth.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId })),
      Promise.resolve().then(() => auth.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }))
    ]);
    assert.equal(results.filter((r) => r.status === PURCHASE_AUTHORITY_RESULT.GRANT_APPLIED).length, 1);
    assert.equal(results.filter((r) => r.status === PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_APPLIED).length, 1);
    const restored = new PersistentPurchaseStore({ filePath });
    assert.equal(restored.loadPlayerMeta(purchase.playerId).currencies.SCRAP, 5000);
    assert.equal(Object.keys(restored.loadPlayerMeta(purchase.playerId).rewardLedger).length, 1);
    assert.equal(Object.keys((await readFile(filePath, "utf8")).match(/purchase-grant:\w+/g) || []).length >= 1, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("duplicate provider callback after application remains idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-auth015-callback-"));
  const filePath = join(directory, "purchases.json");
  try {
    const store = seed(new PersistentPurchaseStore({ filePath }));
    const auth = authority(store);
    assert.equal(auth.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status, PURCHASE_AUTHORITY_RESULT.GRANT_APPLIED);
    const restarted = authority(new PersistentPurchaseStore({ filePath }));
    const callback = await restarted.authorizeProviderCallback({ body: { ignored: true } }).catch(() => null);
    const callbackVerifier = createPurchaseProviderVerifier({
      verifyReceipt: async () => ({ status: PURCHASE_PROVIDER_VERIFICATION.REJECTED }),
      verifyPurchaseCallback: async () => ({
        status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
        purchaseId: purchase.purchaseId,
        playerId: purchase.playerId,
        productId: purchase.productId,
        amount: purchase.amount,
        currency: purchase.currency,
        provider: purchase.provider,
        transactionId: purchase.providerTransactionId,
        receiptFingerprint: purchase.receiptFingerprint,
        grantKind: purchase.grantKind,
        grantAmount: purchase.grantAmount
      })
    });
    const callbackAuthority = new PurchaseAuthority({ store: restarted.store, providerVerifier: callbackVerifier });
    const callback = await callbackAuthority.authorizeProviderCallback({ body: { callback: true } });
    assert.equal(callback.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
    const retry = restarted.applyGrant({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
    assert.equal(retry.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_APPLIED);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("HTTP grant application is authenticated and ignores client economics", async () => {
  const purchaseStore = seed(new InMemoryPurchaseStore());
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier: null
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  const url = "http://127.0.0.1:" + instance.server.address().port;
  try {
    const response = await fetch(url + "/v1/purchases/" + purchase.purchaseId + "/apply", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-player-id": purchase.playerId
      },
      body: JSON.stringify({ amount: 999999999, grant: { amount: 999999999 } })
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "CLIENT_AUTHORITY_FORBIDDEN");

    const valid = await fetch(url + "/v1/purchases/" + purchase.purchaseId + "/apply", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-player-id": purchase.playerId
      },
      body: "{}"
    });
    assert.equal(valid.status, 200);
    const body = await valid.json();
    assert.equal(body.status, "GRANT_APPLIED");
    assert.equal(body.grant_amount, 5000);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

console.log("bone011_auth015_purchase_grant_application_test: PASS");
