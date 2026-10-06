import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "../src/purchase_authority.mjs";
import { InMemoryPurchaseStore, PersistentPurchaseStore } from "../src/purchase_store.mjs";
import {
  createTelegramStarsProviderAdapter,
  TELEGRAM_STARS_WEBHOOK_SECRET_HEADER
} from "../src/telegram_stars_adapter.mjs";

const webhookSecret = "auth011-test-secret";
const instances = [];
const tempDirectories = [];

async function startTestServer() {
  const purchaseStore = new InMemoryPurchaseStore();
  const purchaseAdapter = createTelegramStarsProviderAdapter({
    webhookSecret,
    purchaseStore
  });
  const instance = createAuthorityServer({
    config: loadConfig({ NODE_ENV: "test", PORT: "0", ALLOWED_ORIGINS: "*" }),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseProviderAdapter: purchaseAdapter
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  instances.push(instance);
  return { instance, purchaseStore, baseUrl: "http://127.0.0.1:" + instance.server.address().port };
}

function headers(playerId) {
  return {
    "content-type": "application/json",
    accept: "application/json",
    "x-test-player-id": playerId
  };
}

async function createPurchase(baseUrl, playerId, body, key) {
  const requestHeaders = headers(playerId);
  if (key) requestHeaders["idempotency-key"] = key;
  return fetch(baseUrl + "/v1/purchases", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body)
  });
}

afterEach(async () => {
  while (instances.length) {
    const item = instances.pop();
    await new Promise((resolve) => item.server.close(resolve));
  }
  while (tempDirectories.length) await rm(tempDirectories.pop(), { recursive: true, force: true });
});

test("A · authenticated purchase creation returns server-priced PENDING in XTR", async () => {
  const { baseUrl, purchaseStore } = await startTestServer();
  const response = await createPurchase(baseUrl, "telegram:9101", { product_id: "scrap_5000" }, "order-a");
  assert.equal(response.status, 201);
  const body = await response.json();

  assert.equal(body.status, PURCHASE_AUTHORITY_RESULT.PENDING);
  assert.equal(body.created, true);
  assert.match(body.purchase_id, /^purchase-/);
  assert.equal(body.player_id, "telegram:9101");
  assert.equal(body.product_id, "scrap_5000");
  assert.equal(body.amount, 50);
  assert.equal(body.currency, "XTR");
  assert.equal(body.provider, "telegram-stars");
  assert.equal(body.grant_kind, "scrap");
  assert.equal(body.grant_amount, 5000);
  assert.equal(body.provider_transaction_id, null);
  assert.equal(body.invoice.currency, "XTR");
  assert.equal(body.invoice.amount, 50);
  assert.match(body.invoice.invoice_payload, /^bwstars:v1:/);

  const saved = purchaseStore.loadPurchase(body.purchase_id);
  assert.equal(saved.authorizationStatus, "PENDING");
  assert.equal(saved.claimStatus, "UNCLAIMED");
  assert.equal(saved.playerId, "telegram:9101");
  assert.ok(typeof saved.createdAt === "string");
});

test("B · idempotency key is server-bound and cannot change product", async () => {
  const { baseUrl } = await startTestServer();
  const first = await createPurchase(baseUrl, "telegram:9102", { product_id: "scrap_5000" }, "same-order");
  const firstBody = await first.json();

  const repeat = await createPurchase(baseUrl, "telegram:9102", { product_id: "scrap_5000" }, "same-order");
  const repeatBody = await repeat.json();
  assert.equal(repeat.status, 200);
  assert.equal(repeatBody.created, false);
  assert.equal(repeatBody.purchase_id, firstBody.purchase_id);

  const conflict = await createPurchase(baseUrl, "telegram:9102", { product_id: "scrap_25000" }, "same-order");
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, "IDEMPOTENCY_CONFLICT");
});

test("C · client identity/economic/payment authority injection is rejected", async () => {
  const { baseUrl } = await startTestServer();
  const forbidden = [
    ["amount", 999999],
    ["currency", "USD"],
    ["grant_amount", 999999],
    ["grant_kind", "scrap"],
    ["provider", "fake"],
    ["player_id", "telegram:attacker"],
    ["telegramUserId", "attacker"],
    ["purchase_id", "purchase-existing"],
    ["transaction_id", "fake-tx"],
    ["status", "AUTHORIZED_GRANT"],
    ["authorized", true],
    ["successful_payment", {}]
  ];

  for (const [field, value] of forbidden) {
    const response = await createPurchase(
      baseUrl,
      "telegram:9103",
      { product_id: "scrap_5000", [field]: value },
      "inject-" + field
    );
    assert.equal(response.status, 400, field);
    assert.equal((await response.json()).error, "CLIENT_AUTHORITY_FORBIDDEN", field);
  }
});

test("D · unknown product is rejected and the server owns the Stars amount", async () => {
  const { baseUrl } = await startTestServer();
  const unknown = await createPurchase(baseUrl, "telegram:9104", { product_id: "unknown-product" }, "unknown-product");
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).error, "UNKNOWN_PRODUCT");

  const valid = await createPurchase(
    baseUrl,
    "telegram:9104",
    { product_id: "scrap_5000", amount: 51 },
    "server-price"
  );
  assert.equal(valid.status, 400);
});

test("E · pending purchase survives PersistentPurchaseStore restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "basewarriors-auth011-"));
  tempDirectories.push(directory);
  const filePath = join(directory, "purchases.json");

  const storeA = new PersistentPurchaseStore({ filePath });
  const authA = new PurchaseAuthority({ store: storeA });
  const created = authA.createPending({
    playerId: "telegram:9105",
    body: { product_id: "scrap_5000" },
    idempotencyKey: "restart-order"
  });

  assert.equal(created.status, PURCHASE_AUTHORITY_RESULT.PENDING);

  const storeB = new PersistentPurchaseStore({ filePath });
  const authB = new PurchaseAuthority({ store: storeB });
  const recovered = authB.getStatus({
    playerId: "telegram:9105",
    purchaseId: created.purchase_id
  });
  assert.equal(recovered.status, PURCHASE_AUTHORITY_RESULT.PENDING);
  assert.equal(recovered.product_id, "scrap_5000");
  assert.equal(recovered.currency, "XTR");
});

test("F · verified Telegram successful_payment promotes PENDING and duplicate callback is a no-op", async () => {
  const { baseUrl } = await startTestServer();
  const create = await createPurchase(baseUrl, "telegram:9106", { product_id: "scrap_5000" }, "promotion-order");
  assert.equal(create.status, 201);
  const pending = await create.json();

  const callbackBody = {
    update_id: 911,
    message: {
      from: { id: 9106 },
      successful_payment: {
        currency: "XTR",
        total_amount: 50,
        invoice_payload: pending.invoice.invoice_payload,
        telegram_payment_charge_id: "tg-charge-9106"
      }
    }
  };

  const callbackRequest = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: webhookSecret
    },
    body: JSON.stringify(callbackBody)
  };

  const promoted = await fetch(baseUrl + "/v1/purchases/provider-callback", callbackRequest);
  assert.equal(promoted.status, 200);
  const promotedBody = await promoted.json();
  assert.equal(promotedBody.status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);
  assert.equal(promotedBody.player_id, "telegram:9106");
  assert.equal(promotedBody.currency, "XTR");

  const status = await fetch(baseUrl + "/v1/purchases/" + encodeURIComponent(pending.purchase_id), {
    headers: headers("telegram:9106")
  });
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT);

  const claim = await fetch(baseUrl + "/v1/purchases/" + encodeURIComponent(pending.purchase_id) + "/claim", {
    method: "POST",
    headers: headers("telegram:9106"),
    body: "{}"
  });
  assert.equal(claim.status, 200);
  assert.equal((await claim.json()).status, PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED);

  const duplicateCallback = await fetch(baseUrl + "/v1/purchases/provider-callback", callbackRequest);
  assert.equal(duplicateCallback.status, 200);
  assert.equal((await duplicateCallback.json()).status, PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP);
});

test("G · different identity cannot read another purchase or use its invoice", async () => {
  const { baseUrl, purchaseStore } = await startTestServer();
  const create = await createPurchase(baseUrl, "telegram:9107", { product_id: "scrap_5000" }, "owner-order");
  const pending = await create.json();

  const foreignRead = await fetch(baseUrl + "/v1/purchases/" + encodeURIComponent(pending.purchase_id), {
    headers: headers("telegram:9108")
  });
  assert.equal(foreignRead.status, 404);

  const callbackBody = {
    message: {
      from: { id: 9108 },
      successful_payment: {
        currency: "XTR",
        total_amount: 50,
        invoice_payload: pending.invoice.invoice_payload,
        telegram_payment_charge_id: "tg-charge-9108"
      }
    }
  };
  const response = await fetch(baseUrl + "/v1/purchases/provider-callback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [TELEGRAM_STARS_WEBHOOK_SECRET_HEADER]: webhookSecret
    },
    body: JSON.stringify(callbackBody)
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, "PURCHASE_IDENTITY_MISMATCH");
  assert.equal(purchaseStore.loadPurchase(pending.purchase_id).authorizationStatus, "PENDING");
});

test("H · client cannot promote a PENDING purchase with transaction or authorization fields", async () => {
  const { baseUrl, purchaseStore } = await startTestServer();
  const create = await createPurchase(baseUrl, "telegram:9109", { product_id: "scrap_5000" }, "fake-payment");
  const pending = await create.json();

  const forged = await fetch(baseUrl + "/v1/purchases/" + encodeURIComponent(pending.purchase_id) + "/authorize", {
    method: "POST",
    headers: headers("telegram:9109"),
    body: JSON.stringify({
      product_id: "scrap_5000",
      amount: 50,
      currency: "XTR",
      provider: "telegram-stars",
      transaction_id: "fake-transaction",
      receipt: "fake-receipt",
      status: "AUTHORIZED_GRANT"
    })
  });
  assert.equal(forged.status, 400);
  assert.equal((await forged.json()).error, "CLIENT_AUTHORITY_FORBIDDEN");
  assert.equal(purchaseStore.loadPurchase(pending.purchase_id).authorizationStatus, "PENDING");
});

test("I · player identity is derived from authentication transport", async () => {
  const { baseUrl, purchaseStore } = await startTestServer();
  const response = await createPurchase(baseUrl, "telegram:9110", {
    product_id: "scrap_5000"
  }, "identity-derived");
  const body = await response.json();
  assert.equal(body.player_id, "telegram:9110");
  assert.equal(purchaseStore.loadPurchase(body.purchase_id).playerId, "telegram:9110");
});

console.log("bone011_auth011_purchase_creation_test: PASS");
