import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
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
  purchaseId: "claim-purchase-001",
  playerId: "player-claim-001",
  productId: "scrap_5000",
  amount: 1,
  currency: "XTR",
  provider: "test-provider",
  transactionId: "claim-txn-001",
  receipt: "claim-receipt-001",
  grantKind: "scrap",
  grantAmount: 5000
};

function verifierFor() {
  return createPurchaseProviderVerifier({
    verifyReceipt: async ({ purchaseId, playerId, productId, amount, currency, provider, transactionId, receipt }) => {
      if (purchaseId !== purchase.purchaseId || playerId !== purchase.playerId || productId !== purchase.productId) {
        return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "RECEIPT_REJECTED" };
      }
      return {
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
      };
    },
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

async function authorizedAuthority(store = new InMemoryPurchaseStore()) {
  const authority = new PurchaseAuthority({
    store,
    providerVerifier: verifierFor(),
    production: false
  });
  const result = await authority.authorize({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId,
    body: requestBody()
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  return authority;
}

test("A · first claim transitions AUTHORIZED_GRANT to GRANT_CLAIMED without economic side effects", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizedAuthority(store);

  const result = authority.claim({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId,
    body: {}
  });

  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");
  assert.equal(result.grant_amount, 5000);
  assert.equal(result.scrap, undefined);
});

test("B · repeated claim returns GRANT_ALREADY_CLAIMED and performs no second transition", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizedAuthority(store);

  const first = authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });
  const second = authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId });

  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED);
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");
});

test("C · claimed state survives purchase store restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-claim-restart-"));
  const filePath = join(directory, "purchases.json");
  try {
    const storeA = new PersistentPurchaseStore({ filePath });
    const authorityA = await authorizedAuthority(storeA);
    assert.equal(
      authorityA.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED
    );

    const storeB = new PersistentPurchaseStore({ filePath });
    const authorityB = new PurchaseAuthority({
      store: storeB,
      providerVerifier: verifierFor()
    });
    assert.equal(
      authorityB.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("D · duplicate provider callback preserves GRANT_CLAIMED", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = new PurchaseAuthority({
    store,
    providerVerifier: verifierFor()
  });

  const callback = { callback_token: "callback-valid" };
  const firstCallback = await authority.authorizeProviderCallback({ body: callback });
  assert.equal(firstCallback.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);

  const claim = authority.claim({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });
  assert.equal(claim.status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);

  const duplicateCallback = await authority.authorizeProviderCallback({ body: callback });
  assert.equal(duplicateCallback.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");

  const afterCallbackClaim = authority.claim({
    playerId: purchase.playerId,
    purchaseId: purchase.purchaseId
  });
  assert.equal(afterCallbackClaim.status, PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED);
});

test("E · another player cannot claim someone else's purchase", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizedAuthority(store);
  const result = authority.claim({
    playerId: "player-attacker",
    purchaseId: purchase.purchaseId
  });

  assert.equal(result, null);
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "UNCLAIMED");
});

test("F · claim rejects all client authority/economic injection fields", async () => {
  const store = new InMemoryPurchaseStore();
  const authority = await authorizedAuthority(store);
  assert.throws(
    () => authority.claim({
      playerId: purchase.playerId,
      purchaseId: purchase.purchaseId,
      body: {
        playerId: "attacker",
        player_id: "attacker",
        amount: 999999,
        resource: "scrap",
        grant: "fake",
        authority: "trusted",
        claimed: false,
        grant_amount: 999999
      }
    }),
    /Claim endpoint accepts no client authority fields/
  );
  assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "UNCLAIMED");
});

test("G · unknown purchase returns safe NOT_FOUND semantics", async () => {
  const authority = new PurchaseAuthority({
    store: new InMemoryPurchaseStore(),
    providerVerifier: verifierFor()
  });

  assert.equal(
    authority.claim({ playerId: purchase.playerId, purchaseId: "missing-purchase" }),
    null
  );
});

test("H · GET remains read-only before and after claim", async () => {
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

    const before = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId, {
      headers: { "x-test-player-id": purchase.playerId }
    });
    assert.equal(before.status, 200);
    assert.equal((await before.json()).status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    assert.equal(purchaseStore.loadPurchase(purchase.purchaseId).claimStatus, "UNCLAIMED");

    const after = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId, {
      headers: { "x-test-player-id": purchase.playerId }
    });
    assert.equal(after.status, 200);
    assert.equal((await after.json()).status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    assert.equal(purchaseStore.loadPurchase(purchase.purchaseId).claimStatus, "UNCLAIMED");
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("I · concurrent claims have exactly one winner", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-claim-concurrency-"));
  const filePath = join(directory, "purchases.json");
  try {
    const store = new PersistentPurchaseStore({ filePath });
    const authority = await authorizedAuthority(store);

    const results = await Promise.all([
      Promise.resolve(authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId })),
      Promise.resolve(authority.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }))
    ]);

    assert.equal(results.filter((result) => result.status === PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED).length, 1);
    assert.equal(results.filter((result) => result.status === PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED).length, 1);
    assert.equal(store.loadPurchase(purchase.purchaseId).claimStatus, "GRANT_CLAIMED");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("J · persistent callback + claim survives reconstruction without economic grant execution", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-claim-callback-restart-"));
  const filePath = join(directory, "purchases.json");
  try {
    const storeA = new PersistentPurchaseStore({ filePath });
    const authA = new PurchaseAuthority({
      store: storeA,
      providerVerifier: verifierFor()
    });
    assert.equal(
      (await authA.authorizeProviderCallback({ body: { callback_token: "callback-valid" } })).status,
      PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT
    );
    assert.equal(
      authA.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED
    );

    const storeB = new PersistentPurchaseStore({ filePath });
    const authB = new PurchaseAuthority({
      store: storeB,
      providerVerifier: verifierFor()
    });
    assert.equal(
      (await authB.authorizeProviderCallback({ body: { callback_token: "callback-valid" } })).status,
      PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP
    );
    assert.equal(
      authB.claim({ playerId: purchase.playerId, purchaseId: purchase.purchaseId }).status,
      PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("K · HTTP claim endpoint authenticates and rejects authority injection", async () => {
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

    const claim = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: "{}"
    });
    assert.equal(claim.status, 200);
    assert.equal((await claim.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);

    const duplicate = await fetch(baseUrl + "/v1/purchases/" + purchase.purchaseId + "/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": purchase.playerId },
      body: JSON.stringify({ amount: 999999, claimed: false })
    });
    assert.equal(duplicate.status, 400);
    assert.equal((await duplicate.json()).error, "CLIENT_AUTHORITY_FORBIDDEN");

    const after = purchaseStore.loadPurchase(purchase.purchaseId);
    assert.equal(after.claimStatus, "GRANT_CLAIMED");
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

console.log("purchase_claim_authority_test: PASS");
