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
import { evaluatePurchaseReadiness, purchaseReadinessSatisfied } from "../src/purchase_readiness.mjs";

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

function callbackVerifierFor({ calls = null, resultOverrides = {} } = {}) {
  return createPurchaseProviderVerifier({
    verifyReceipt: async ({ receipt }) => {
      const verified = RECEIPTS.get(receipt);
      if (!verified) return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "UNKNOWN_RECEIPT" };
      return { status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED, ...verified, receiptFingerprint: fingerprint(receipt) };
    },
    verifyPurchaseCallback: async ({ body }) => {
      if (calls) calls.count += 1;
      if (body?.callback_token === "callback-down") {
        return { status: PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE, reason: "PROVIDER_UNAVAILABLE" };
      }
      if (body?.callback_token === "callback-rejected") {
        return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "CALLBACK_REJECTED" };
      }
      if (body?.callback_token !== "callback-valid") {
        return { status: PURCHASE_PROVIDER_VERIFICATION.REJECTED, reason: "INVALID_CALLBACK" };
      }
      return {
        status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
        purchaseId: "purchase-callback-001",
        playerId: "player-001",
        productId: "scrap_5000",
        amount: 1,
        currency: "XTR",
        provider: "test-provider",
        transactionId: "txn-callback-001",
        receiptFingerprint: fingerprint("callback-receipt-001"),
        grantKind: "scrap",
        grantAmount: 5000,
        ...resultOverrides
      };
    }
  });
}



test("CALLBACK-1 · verified provider callback creates AUTHORIZED_GRANT", async () => {
  const result = await authority({ providerVerifier: callbackVerifierFor() }).authorizeProviderCallback({
    body: { callback_token: "callback-valid" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(result.player_id, "player-001");
  assert.equal(result.grant_kind, "scrap");
  assert.equal(result.grant_amount, 5000);
});

test("CALLBACK-2 · identical callback returns DUPLICATE_NO_OP", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store, providerVerifier: callbackVerifierFor() });
  const first = await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  const second = await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(second.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
});

test("CALLBACK-3 · same purchase_id with different verified data is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store, providerVerifier: callbackVerifierFor() });
  await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  const conflict = authority({
    store,
    providerVerifier: callbackVerifierFor({ resultOverrides: { productId: "scrap_1000", grantAmount: 1000, transactionId: "txn-callback-002" } })
  });
  const result = await conflict.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.reason, "IDEMPOTENCY_CONFLICT");
});

test("CALLBACK-4 · same provider transaction with different data is rejected", async () => {
  const store = new InMemoryPurchaseStore();
  const first = authority({ store, providerVerifier: callbackVerifierFor() });
  await first.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  const second = authority({
    store,
    providerVerifier: callbackVerifierFor({
      resultOverrides: { purchaseId: "purchase-callback-002", productId: "scrap_1000", grantAmount: 1000 }
    })
  });
  const result = await second.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.REJECTED);
  assert.equal(result.reason, "IDEMPOTENCY_CONFLICT");
});

test("CALLBACK-5 · provider verifier unavailable returns UNAVAILABLE", async () => {
  const result = await authority({ providerVerifier: callbackVerifierFor() }).authorizeProviderCallback({
    body: { callback_token: "callback-down" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.UNAVAILABLE);
  assert.equal(result.reason, "PROVIDER_UNAVAILABLE");
});

test("CALLBACK-6 · callback verifier absent in production blocks callback", async () => {
  const verifier = createPurchaseProviderVerifier({
    verifyReceipt: async () => ({ status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED })
  });
  const result = await authority({ providerVerifier: verifier, production: true }).authorizeProviderCallback({
    body: { callback_token: "callback-valid" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.UNAVAILABLE);
  assert.equal(result.reason, "CALLBACK_VERIFIER_NOT_CONFIGURED");
});

test("CALLBACK-7 · request grant_amount injection cannot alter verified grant", async () => {
  const result = await authority({ providerVerifier: callbackVerifierFor() }).authorizeProviderCallback({
    body: { callback_token: "callback-valid", grant_amount: 999999999 }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(result.grant_amount, 5000);
});

test("CALLBACK-8 · request grant_kind injection cannot alter verified grant", async () => {
  const result = await authority({ providerVerifier: callbackVerifierFor() }).authorizeProviderCallback({
    body: { callback_token: "callback-valid", grant_kind: "stars" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(result.grant_kind, "scrap");
});

test("CALLBACK-9 · request player_id injection cannot alter verified identity", async () => {
  const result = await authority({ providerVerifier: callbackVerifierFor() }).authorizeProviderCallback({
    body: { callback_token: "callback-valid", player_id: "attacker-player" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(result.player_id, "player-001");
});

test("CALLBACK-10 · callback authorization is recoverable through GET status", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store, providerVerifier: callbackVerifierFor() });
  await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  const status = auth.getStatus({ playerId: "player-001", purchaseId: "purchase-callback-001" });
  assert.equal(status.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(status.grant_amount, 5000);
});

test("CALLBACK-11 · repeated status lookup causes no additional purchase mutation", async () => {
  const store = new InMemoryPurchaseStore();
  const auth = authority({ store, providerVerifier: callbackVerifierFor() });
  const first = await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  const before = store.loadPurchase("purchase-callback-001");
  const statusA = auth.getStatus({ playerId: "player-001", purchaseId: "purchase-callback-001" });
  const statusB = auth.getStatus({ playerId: "player-001", purchaseId: "purchase-callback-001" });
  assert.equal(statusA.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(statusB.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.deepEqual(store.loadPurchase("purchase-callback-001"), before);
});

test("CALLBACK-12 · persistent callback authorization survives purchase store restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-callback-purchase-"));
  const filePath = join(directory, "purchases.json");
  try {
    const storeA = new PersistentPurchaseStore({ filePath });
    const authA = authority({ store: storeA, providerVerifier: callbackVerifierFor() });
    const first = await authA.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
    assert.equal(first.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);

    const storeB = new PersistentPurchaseStore({ filePath });
    const authB = authority({ store: storeB, providerVerifier: callbackVerifierFor() });
    const recovered = await authB.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
    assert.equal(recovered.status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CALLBACK-13 · first callback verification executes exactly once", async () => {
  const calls = { count: 0 };
  const result = await authority({ providerVerifier: callbackVerifierFor({ calls }) }).authorizeProviderCallback({
    body: { callback_token: "callback-valid" }
  });
  assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(calls.count, 1);
});

test("CALLBACK-14 · duplicate callback is verified before dedupe because raw callback data is not trusted", async () => {
  const calls = { count: 0 };
  const auth = authority({ providerVerifier: callbackVerifierFor({ calls }) });
  await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  await auth.authorizeProviderCallback({ body: { callback_token: "callback-valid" } });
  assert.equal(calls.count, 2);
});

test("CALLBACK-HTTP · provider callback endpoint does not use x-test-player-id as authority", async () => {
  const verifier = callbackVerifierFor();
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifier
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/v1/purchases/provider-callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-player-id": "attacker-player"
      },
      body: JSON.stringify({ callback_token: "callback-valid", player_id: "attacker-player", grant_amount: 999999 })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    assert.equal(body.player_id, "player-001");
    assert.equal(body.grant_amount, 5000);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

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
let httpBaseUrl;

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
  httpBaseUrl = `http://127.0.0.1:${httpInstance.server.address().port}`;
  const response = await fetch(`${httpBaseUrl}/v1/purchases/purchase-001/authorize`, {
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


test("M · GET purchase status returns AUTHORIZED_GRANT without provider revalidation", async () => {
  let verifierCalls = 0;
  const countingVerifier = createPurchaseProviderVerifier({
    verifyReceipt: async (input) => {
      verifierCalls += 1;
      return verifierFor().verifyReceipt(input);
    }
  });

  const statusInstance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: countingVerifier
  });
  await new Promise((resolve) => statusInstance.server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${statusInstance.server.address().port}`;

  try {
    const authorize = await fetch(`${baseUrl}/v1/purchases/purchase-001/authorize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "player-001" },
      body: JSON.stringify(requestBody())
    });
    assert.equal(authorize.status, 200);
    assert.equal(verifierCalls, 1);

    verifierCalls = 0;
    const first = await fetch(`${baseUrl}/v1/purchases/purchase-001`, {
      headers: { "x-test-player-id": "player-001" }
    });
    const second = await fetch(`${baseUrl}/v1/purchases/purchase-001`, {
      headers: { "x-test-player-id": "player-001" }
    });

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.deepEqual(await first.json(), {
      status: PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT,
      purchase_id: "purchase-001",
      player_id: "player-001",
      product_id: "scrap_5000",
      grant_kind: "scrap",
      grant_amount: 5000,
      currency: "XTR",
      provider: "test-provider",
      provider_transaction_id: "txn-001"
    });
    assert.deepEqual(await second.json(), {
      status: PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT,
      purchase_id: "purchase-001",
      player_id: "player-001",
      product_id: "scrap_5000",
      grant_kind: "scrap",
      grant_amount: 5000,
      currency: "XTR",
      provider: "test-provider",
      provider_transaction_id: "txn-001"
    });
    assert.equal(verifierCalls, 0);
  } finally {
    await new Promise((resolve) => statusInstance.server.close(resolve));
  }
});

test("N · GET purchase status returns 401 without authenticated identity", async () => {
  const response = await fetch(`${httpBaseUrl}/v1/purchases/purchase-001`);
  assert.equal(response.status, 401);
});

test("O · GET unknown and wrong-player purchase both return safe NOT_FOUND", async () => {
  const unknown = await fetch(`${httpBaseUrl}/v1/purchases/unknown-purchase`, {
    headers: { "x-test-player-id": "player-001" }
  });
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { status: "NOT_FOUND", error: "NOT_FOUND" });

  const otherPlayer = await fetch(`${httpBaseUrl}/v1/purchases/purchase-001`, {
    headers: { "x-test-player-id": "player-999" }
  });
  assert.equal(otherPlayer.status, 404);
  const body = await otherPlayer.json();
  assert.deepEqual(body, { status: "NOT_FOUND", error: "NOT_FOUND" });
  assert.equal(body.player_id, undefined);
  assert.equal(body.product_id, undefined);
  assert.equal(body.grant_amount, undefined);
  assert.equal(body.provider_transaction_id, undefined);
});

test("P · persistent purchase status survives store restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-purchase-status-"));
  const filePath = join(directory, "purchases.json");
  let firstInstance;
  let recoveredInstance;
  try {
    const config = loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" });
    const firstStore = new PersistentPurchaseStore({ filePath });
    firstInstance = createAuthorityServer({
      config,
      store: new InMemoryCombatStore(),
      signer: createEphemeralTestSigner(),
      purchaseStore: firstStore,
      purchaseVerifier: verifierFor()
    });
    await new Promise((resolve) => firstInstance.server.listen(0, resolve));
    const firstUrl = `http://127.0.0.1:${firstInstance.server.address().port}`;

    const authorize = await fetch(`${firstUrl}/v1/purchases/purchase-001/authorize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "player-001" },
      body: JSON.stringify(requestBody())
    });
    assert.equal(authorize.status, 200);
    await new Promise((resolve) => firstInstance.server.close(resolve));
    firstInstance = null;

    const recoveredStore = new PersistentPurchaseStore({ filePath });
    recoveredInstance = createAuthorityServer({
      config,
      store: new InMemoryCombatStore(),
      signer: createEphemeralTestSigner(),
      purchaseStore: recoveredStore,
      purchaseVerifier: {
        verifyReceipt: async () => {
          throw new Error("provider verifier must not run during status recovery");
        }
      }
    });
    await new Promise((resolve) => recoveredInstance.server.listen(0, resolve));
    const recoveredUrl = `http://127.0.0.1:${recoveredInstance.server.address().port}`;

    const recovered = await fetch(`${recoveredUrl}/v1/purchases/purchase-001`, {
      headers: { "x-test-player-id": "player-001" }
    });
    assert.equal(recovered.status, 200);
    assert.deepEqual(await recovered.json(), {
      status: PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT,
      purchase_id: "purchase-001",
      player_id: "player-001",
      product_id: "scrap_5000",
      grant_kind: "scrap",
      grant_amount: 5000,
      currency: "XTR",
      provider: "test-provider",
      provider_transaction_id: "txn-001"
    });
  } finally {
    if (firstInstance) await new Promise((resolve) => firstInstance.server.close(resolve));
    if (recoveredInstance) await new Promise((resolve) => recoveredInstance.server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test("Q · repeated status lookup has no duplicate grant mutation", async () => {
  const purchaseStore = new InMemoryPurchaseStore();
  const verifier = verifierFor();
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier: verifier
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  const url = `http://127.0.0.1:${instance.server.address().port}`;
  try {
    const authorize = await fetch(`${url}/v1/purchases/purchase-001/authorize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "player-001" },
      body: JSON.stringify(requestBody())
    });
    assert.equal(authorize.status, 200);
    const before = purchaseStore.loadPurchase("purchase-001");

    for (let i = 0; i < 3; i += 1) {
      const response = await fetch(`${url}/v1/purchases/purchase-001`, {
        headers: { "x-test-player-id": "player-001" }
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    }

    const after = purchaseStore.loadPurchase("purchase-001");
    assert.deepEqual(after, before);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});


function productionReadinessConfig() {
  return loadConfig({
    NODE_ENV: "production",
    PORT: "0",
    REWARD_SIGNING_PRIVATE_KEY: "fixture-key-material",
    TELEGRAM_BOT_TOKEN: "fixture-bot-token",
    ALLOWED_ORIGINS: "https://example.github.io",
    AUTHORITY_PERSISTENCE_PROVIDER: "managed",
    AUTHORITY_PERSISTENCE_DSN: "fixture://managed-persistence"
  });
}

function readinessServerParts({ purchaseStore, purchaseVerifier = verifierFor(), combatStore = { isDurable: true } }) {
  return {
    config: productionReadinessConfig(),
    store: combatStore,
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier
  };
}

test("R1 · production without purchase provider is not ready", async () => {
  const instance = createAuthorityServer(readinessServerParts({
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: null
  }));
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/ready");
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.ready, false);
    assert.equal(body.purchase_authority, true);
    assert.equal(body.purchase_persistence, false);
    assert.equal(body.purchase_provider, false);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("R2 · production with non-durable purchase persistence is not ready", async () => {
  const instance = createAuthorityServer(readinessServerParts({
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifierFor()
  }));
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/ready");
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.ready, false);
    assert.equal(body.purchase_authority, true);
    assert.equal(body.purchase_persistence, false);
    assert.equal(body.purchase_provider, true);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("R3 · production purchase authority is ready with configured provider and durable injected store", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-purchase-readiness-"));
  const purchaseStore = new PersistentPurchaseStore({ filePath: join(directory, "purchases.json") });
  const instance = createAuthorityServer(readinessServerParts({
    purchaseStore,
    purchaseVerifier: verifierFor()
  }));
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/ready");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ready, true);
    assert.equal(body.purchase_authority, true);
    assert.equal(body.purchase_persistence, true);
    assert.equal(body.purchase_provider, true);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test("R4 · combat readiness cannot mask missing purchase readiness", async () => {
  const instance = createAuthorityServer(readinessServerParts({
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: null
  }));
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/ready");
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ready, false);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("R5 · test mode accepts injected purchase provider/store without changing the authority contract", () => {
  const config = loadConfig({ NODE_ENV: "test", PORT: "0", ALLOWED_ORIGINS: "*" });
  const purchaseStore = new InMemoryPurchaseStore();
  const verifier = verifierFor();
  const authority = new PurchaseAuthority({
    store: purchaseStore,
    providerVerifier: verifier,
    production: false
  });
  const status = evaluatePurchaseReadiness({ config, purchaseAuthority: authority, purchaseStore });
  assert.equal(status.purchase_authority, true);
  assert.equal(status.purchase_persistence, false);
  assert.equal(status.purchase_provider, true);
  assert.equal(purchaseReadinessSatisfied(status), false);
});

test("R6 · purchase readiness response exposes no secrets", async () => {
  const instance = createAuthorityServer(readinessServerParts({
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: null
  }));
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/ready");
    const body = await response.json();
    assert.equal(body.private_key, undefined);
    assert.equal(body.telegram_bot_token, undefined);
    assert.equal(body.persistence_dsn, undefined);
    assert.equal(body.receipt, undefined);
    assert.equal(body.provider_verifier, undefined);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("R7 · readiness evaluation never invokes receipt verification or authorization", async () => {
  let verifierCalls = 0;
  let authorizeCalls = 0;
  const providerVerifier = createPurchaseProviderVerifier({
    verifyReceipt: async () => {
      verifierCalls += 1;
      return { status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED };
    }
  });
  const purchaseAuthority = Object.freeze({
    authorize: async () => {
      authorizeCalls += 1;
      return { status: PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT };
    },
    getStatus: () => null,
    providerVerifier
  });
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-purchase-readiness-noop-"));
  const purchaseStore = new PersistentPurchaseStore({ filePath: join(directory, "purchases.json") });
  const status = evaluatePurchaseReadiness({
    config: productionReadinessConfig(),
    purchaseAuthority,
    purchaseStore
  });
  assert.equal(purchaseReadinessSatisfied(status), true);
  assert.equal(verifierCalls, 0);
  assert.equal(authorizeCalls, 0);
  await rm(directory, { recursive: true, force: true });
});


test("CALLBACK-TRANSPORT-1 · raw body, headers and parsed body reach the verifier intact", async () => {
  const captured = {};
  const verifier = createPurchaseProviderVerifier({
    verifyPurchaseCallback: async ({ rawBody, headers, body }) => {
      captured.rawBody = Buffer.from(rawBody);
      captured.headers = headers;
      captured.body = body;
      return {
        status: PURCHASE_PROVIDER_VERIFICATION.REJECTED,
        reason: "TRANSPORT_PROBE_ONLY"
      };
    }
  });
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifier
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const rawBody = '{"callback_token":"callback-valid", "grant_amount":999999}';
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/v1/purchases/provider-callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-provider-signature": "signature-fixture",
        "x-provider-event-id": "event-fixture",
        "x-test-player-id": "attacker-player"
      },
      body: rawBody
    });
    assert.equal(response.status, 409);
    assert.equal(captured.rawBody.toString("utf8"), rawBody);
    assert.equal(captured.headers["x-provider-signature"], "signature-fixture");
    assert.equal(captured.headers["x-provider-event-id"], "event-fixture");
    assert.equal(captured.headers["x-test-player-id"], "attacker-player");
    assert.deepEqual(captured.body, {
      callback_token: "callback-valid",
      grant_amount: 999999
    });
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("CALLBACK-TRANSPORT-2 · oversized callback is rejected before verifier/economic authority", async () => {
  let verifierCalls = 0;
  const verifier = createPurchaseProviderVerifier({
    verifyPurchaseCallback: async () => {
      verifierCalls += 1;
      return { status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED };
    }
  });
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifier
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const oversized = "x".repeat(64 * 1024 + 1);
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/v1/purchases/provider-callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: oversized
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, "BODY_TOO_LARGE");
    assert.equal(verifierCalls, 0);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("CALLBACK-TRANSPORT-3 · request identity/economic injection cannot influence a verified provider event", async () => {
  const verifier = createPurchaseProviderVerifier({
    verifyPurchaseCallback: async ({ body, rawBody, headers }) => {
      assert.equal(headers["x-test-player-id"], "attacker-player");
      assert.match(rawBody.toString("utf8"), /grant_amount/);
      assert.equal(body.player_id, "attacker-player");
      assert.equal(body.grant_amount, 999999);
      return {
        status: PURCHASE_PROVIDER_VERIFICATION.VERIFIED,
        purchaseId: "purchase-transport-001",
        playerId: "player-001",
        productId: "scrap_5000",
        amount: 1,
        currency: "XTR",
        provider: "test-provider",
        transactionId: "txn-transport-001",
        receiptFingerprint: fingerprint("transport-receipt"),
        grantKind: "scrap",
        grantAmount: 5000
      };
    }
  });
  const instance = createAuthorityServer({
    config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore: new InMemoryPurchaseStore(),
    purchaseVerifier: verifier
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/v1/purchases/provider-callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-player-id": "attacker-player"
      },
      body: JSON.stringify({
        callback_token: "callback-valid",
        player_id: "attacker-player",
        grant_amount: 999999
      })
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
    assert.equal(result.player_id, "player-001");
    assert.equal(result.grant_amount, 5000);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("CALLBACK-TRANSPORT-4 · rejected and unavailable verifiers never create a purchase record", async () => {
  for (const status of [PURCHASE_PROVIDER_VERIFICATION.REJECTED, PURCHASE_PROVIDER_VERIFICATION.UNAVAILABLE]) {
    const purchaseStore = new InMemoryPurchaseStore();
    const verifier = createPurchaseProviderVerifier({
      verifyPurchaseCallback: async () => ({
        status,
        reason: status === PURCHASE_PROVIDER_VERIFICATION.REJECTED ? "CALLBACK_REJECTED" : "PROVIDER_UNAVAILABLE"
      })
    });
    const instance = createAuthorityServer({
      config: loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" }),
      store: new InMemoryCombatStore(),
      signer: createEphemeralTestSigner(),
      purchaseStore,
      purchaseVerifier: verifier
    });
    await new Promise((resolve) => instance.server.listen(0, resolve));
    try {
      const response = await fetch("http://127.0.0.1:" + instance.server.address().port + "/v1/purchases/provider-callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"callback_token":"blocked"}'
      });
      assert.equal(response.status, status === PURCHASE_PROVIDER_VERIFICATION.REJECTED ? 409 : 503);
      assert.equal(purchaseStore.loadPurchase("purchase-callback-001"), null);
    } finally {
      await new Promise((resolve) => instance.server.close(resolve));
    }
  }
});
