import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  PurchaseAuthority,
  PURCHASE_AUTHORITY_RESULT
} from "../src/purchase_authority.mjs";
import {
  createPurchaseProviderVerifier,
  PURCHASE_PROVIDER_VERIFICATION
} from "../src/purchase_provider_verifier.mjs";
import {
  InMemoryPurchaseStore,
  PersistentPurchaseStore
} from "../src/purchase_store.mjs";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";

function fingerprint(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const purchase = {
  purchaseId: "fulfill-purchase-001",
  playerId: "player-fulfill-001",
  productId: "scrap_5000",
  amount: 1,
  currency: "XTR",
  provider: "test-provider",
  transactionId: "fulfill-txn-001",
  receipt: "fulfill-receipt-001",
  grantKind: "scrap",
  grantAmount: 5000
};

function verifierFor() {
  return createPurchaseProviderVerifier({
    verifyReceipt: async ({ purchaseId, playerId, productId, amount, currency, provider, transactionId, receipt }) => ({
      status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
      purchaseId,
      playerId,
      productId,
      amount,
      currency,
      provider,
      transactionId,
      receiptFingerprint: fingerprint(receipt),
      grantKind: purchase.grantKind,
      grantAmount: purchase.grantAmount
    }),
    verifyPurchaseCallback: async () => ({
      status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
      purchaseId: purchase.purchaseId,
      playerId: purchase.playerId,
      productId: purchase.productId,
      amount: purchase.amount,
      currency: purchase.currency,
      provider: purchase.provider,
      transactionId: purchase.transactionId,
      receiptFingerprint: fingerprint(purchase.receipt),
      grantKind: purchase.grantKind,
      grantAmount: purchase.grantAmount
    })
  });
}

function requestBody(overrides = {}) {
  return {
    product_id: purchase.productId,
    amount: purchase.amount,
    currency: purchase.currency,
    provider: purchase.provider,
    transaction_id: purchase.transactionId,
    receipt: purchase.receipt,
    ...overrides
  };
}

async function authorizeClaimed(store) {
  const authority = new PurchaseAuthority({ store, providerVerifier: verifierFor() });
  const authorized = await authority.authorize({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId,
    body: requestBody()
  });
  assert.equal(authorized.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  const claimed = authority.claim({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });
  assert.equal(claimed.status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);
  return authority;
}

test("A · claimed authorized purchase fulfills exactly once", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizeClaimed(store);

  const first = authority.fulfill({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });
  const second = authority.fulfill({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });

  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_FULFILLED);
  assert.equal(first.fulfillment_id, "purchase-grant:" + purchase.purchaseId);
  assert.equal(second.fulfillment_id, first.fulfillment_id);
  assert.equal(store.fulfillments.size, 1);
});

test("B · fulfillment without claim is rejected and creates no ledger entry", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = new PurchaseAuthority({ store, providerVerifier: verifierFor() });
  const authorized = await authority.authorize({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId,
    body: requestBody()
  });
  assert.equal(authorized.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);

  assert.throws(
    () => authority.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }),
    /must be claimed before fulfillment/
  );
  assert.equal(store.fulfillments.size, 0);
});

test("C · pending purchase cannot be fulfilled", () => {
  const store = new InMemoryPurchaseStore();
  store.createPendingPurchase({
    purchaseId: purchase.purchaseId,
    playerId: purchase.playerId,
    productId: purchase.productId,
    amount: purchase.amount,
    currency: purchase.currency,
    provider: purchase.provider,
    providerTransactionId: "pending:" + purchase.purchaseId,
    receiptFingerprint: fingerprint("pending:" + purchase.purchaseId),
    transactionKey: "test-provider:pending:" + purchase.purchaseId,
    grantKind: purchase.grantKind,
    grantAmount: purchase.grantAmount
  });
  const authority = new PurchaseAuthority({ store });
  assert.throws(
    () => authority.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }),
    /must be claimed before fulfillment|not authorized/
  );
  assert.equal(store.fulfillments.size, 0);
});

test("D · another player cannot fulfill the owner's purchase", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizeClaimed(store);
  assert.equal(
    authority.fulfill({ playerId: "player-attacker", purchaseId: purchase.purchaseId }),
    null
  );
  assert.equal(store.fulfillments.size, 0);
});

test("E · fulfillment rejects any client economic authority injection", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizeClaimed(store);
  assert.throws(
    () => authority.fulfill({
      playerId: purchase.playerId,
      purchaseId: purchase.purchaseId,
      body: {
        playerId: "attacker",
        amount: 999999999,
        resource: "SCRAP",
        grant: "fake",
        grant_kind: "SCRAP",
        grant_amount: 999999999,
        currency: "HAX",
        provider: "attacker-provider",
        transaction_id: "attacker-txn",
        claim_status: "GRANT_CLAIMED",
        authorized: true,
        verified: true,
        paid: true,
        reward: "999999"
      }
    }),
    /accepts no client authority fields/
  );
  assert.equal(store.fulfillments.size, 0);
});

test("F · persistent fulfillment survives restart and keeps stable identity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-fulfillment-restart-"));
  const filePath = join(directory, "purchases.json");
  try {
    const storeA = new PersistentPurchaseStore({ filePath });
    const authorityA = await authorizeClaimed(storeA);
    const first = authorityA.fulfill({
      playerId: purchase.playerId,
      purchaseId: purchase.purchaseId
    });
    assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED);

    const storeB = new PersistentPurchaseStore({ filePath });
    const authorityB = new PurchaseAuthority({ store: storeB, providerVerifier: verifierFor() });
    const second = authorityB.fulfill({
      playerId: purchase.playerId,
      purchaseId: purchase.purchaseId
    });
    assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_FULFILLED);
    assert.equal(second.fulfillment_id, first.fulfillment_id);

    const document = JSON.parse(await readFile(filePath, "utf8"));
    assert.equal(Object.keys(document.fulfillments).length, 1);
    assert.equal(document.fulfillments[first.fulfillment_id].purchaseId, purchase.purchaseId);
    assert.equal(document.fulfillments[first.fulfillment_id].grantAmount, purchase.grantAmount);
    assert.equal(document.fulfillments[first.fulfillment_id].status, "GRANT_FULFILLED");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("G · concurrent fulfillment requests return one FULFILLED and one ALREADY_FULFILLED", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-fulfillment-concurrency-"));
  const filePath = join(directory, "purchases.json");
  try {
    const store = new PersistentPurchaseStore({ filePath });
    const authority = await authorizeClaimed(store);
    const results = await Promise.all([
      Promise.resolve(authority.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId })),
      Promise.resolve(authority.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }))
    ]);
    assert.equal(results.filter((result) => result.status === PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED).length, 1);
    assert.equal(results.filter((result) => result.status === PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_FULFILLED).length, 1);
    assert.equal((await new PersistentPurchaseStore({ filePath }))._readDocument().fulfillments
      ? Object.keys((await new PersistentPurchaseStore({ filePath }))._readDocument().fulfillments).length
      : 0, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("H · duplicate provider callback cannot reset claim or fulfillment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-fulfillment-callback-"));
  const filePath = join(directory, "purchases.json");
  try {
    const store = new PersistentPurchaseStore({ filePath });
    const authority = new PurchaseAuthority({ store, providerVerifier: verifierFor() });
    assert.equal(
      (await authority.authorizeProviderCallback({ body: { callback_token: "callback-valid" } })).status,
      PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT
    );
    assert.equal(
      authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED
    );
    assert.equal(
      authority.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED
    );

    const restarted = new PurchaseAuthority({
      store: new PersistentPurchaseStore({ filePath }),
      providerVerifier: verifierFor()
    });
    assert.equal(
      (await restarted.authorizeProviderCallback({ body: { callback_token: "callback-valid" } })).status,
      PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP
    );
    assert.equal(
      restarted.fulfill({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_FULFILLED
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("I · GET purchase remains read-only before and after fulfillment", async () => {
  const purchaseStore = new InMemoryPurchaseStore();
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier: verifierFor()
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  const baseUrl = "http://127.0.0.1:" + instance.server.address().port;
  try {
    await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/authorize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: JSON.stringify(requestBody())
    });
    const claim = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(claim.status, 200);

    const before = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId, {
      headers: { "x-test-player-id": purchase.playerId }
    });
    const snapshotBefore = await before.json();

    const getAgain = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId, {
      headers: { "x-test-player-id": purchase.playerId }
    });
    assert.equal(getAgain.status, 200);
    assert.deepEqual(await getAgain.json(), snapshotBefore);
    assert.equal(purchaseStore.fulfillments.size, 0);

    const fulfilled = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(fulfilled.status, 200);
    assert.equal((await fulfilled.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED);

    const after = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId, {
      headers: { "x-test-player-id": purchase.playerId }
    });
    assert.equal(after.status, 200);
    assert.equal((await after.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);
    assert.equal(purchaseStore.fulfillments.size, 1);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("J · HTTP fulfillment enforces authentication, claim order and owner boundary", async () => {
  const purchaseStore = new InMemoryPurchaseStore();
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier: verifierFor()
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  const baseUrl = "http://127.0.0.1:" + instance.server.address().port;
  try {
    const authorize = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/authorize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: JSON.stringify(requestBody())
    });
    assert.equal(authorize.status, 200);

    const unclaimed = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(unclaimed.status, 409);
    assert.equal((await unclaimed.json()).error, "CLAIM_REQUIRED");

    const wrongOwner = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "attacker-player" },
      body: "{}"
    });
    assert.equal(wrongOwner.status, 404);
    assert.deepEqual(await wrongOwner.json(), { status: "NOT_FOUND", error: "NOT_FOUND" });

    const noAuth = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(noAuth.status, 401);

    const claim = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(claim.status, 200);

    const injected = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: JSON.stringify({ playerId: "attacker", amount: 999999999, grant_amount: 999999999, grant_kind: "scrap", currency: "HAX", provider: "fake", transaction_id: "fake", claim_status: "GRANT_CLAIMED", authorized: true, verified: true, paid: true, reward: "fake" })
    });
    assert.equal(injected.status, 400);
    assert.equal((await injected.json()).error, "CLIENT_AUTHORITY_FORBIDDEN");

    const fulfilled = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(fulfilled.status, 200);
    assert.equal((await fulfilled.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("K · duplicate fulfillment request after restart is already fulfilled", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-fulfillment-http-restart-"));
  const filePath = join(directory, "purchases.json");
  let instanceA;
  let instanceB;
  try {
    const config = loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" });
    const storeA = new PersistentPurchaseStore({ filePath });
    instanceA = createAuthorityServer({
      config,
      store: new InMemoryCombatStore(),
      signer: createEphemeralTestSigner(),
      purchaseStore: storeA,
      purchaseVerifier: verifierFor()
    });
    await new Promise((resolve) => instanceA.server.listen(0, resolve));
    const urlA = "http://127.0.0.1:" + instanceA.server.address().port;

    await fetch(urlA + "/v1/purchases/" + purchase.purchaseId + "/authorize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: JSON.stringify(requestBody())
    });
    await fetch(urlA + "/v1/purchases/" + purchase.purchaseId + "/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    const first = await fetch(urlA + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal((await first.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_FULFILLED);
    await new Promise((resolve) => instanceA.server.close(resolve));
    instanceA = null;

    instanceB = createAuthorityServer({
      config,
      store: new PersistentPurchaseStore({ filePath }),
      purchaseVerifier: verifierFor()
    });
    await new Promise((resolve) => instanceB.server.listen(0, resolve));
    const urlB = "http://127.0.0.1:" + instanceB.server.address().port;
    const second = await fetch(urlB + "/v1/purchases/" + purchase.purchaseId + "/fulfill", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal((await second.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_FULFILLED);
  } finally {
    if (instanceA) await new Promise((resolve) => instanceA.server.close(resolve));
    if (instanceB) await new Promise((resolve) => instanceB.server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

console.log("bone011_auth014_purchase_fulfillment_test: PASS");
