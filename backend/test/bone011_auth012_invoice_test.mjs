import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { InMemoryPurchaseStore, PersistentPurchaseStore } from "../src/purchase_store.mjs";
import { PurchaseAuthority } from "../src/purchase_authority.mjs";
import { TelegramStarsInvoiceService } from "../src/telegram_stars_invoice_service.mjs";
import { buildTelegramStarsInvoicePayload } from "../src/telegram_stars_adapter.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function config() {
  return loadConfig({ NODE_ENV: "test", PORT: "0", ALLOWED_ORIGINS: "*" });
}

function fakeFetchFactory({ result = "https://t.me/$basewarriors-test-invoice", ok = true } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok, json: async () => ok ? { ok: true, result } : { ok: false, description: "provider rejected" } };
  };
  return { fetchImpl, calls };
}

async function start({ purchaseStore, invoiceService }) {
  const instance = createAuthorityServer({
    config: config(),
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner(),
    purchaseStore,
    purchaseVerifier: null,
    telegramStarsInvoiceService: invoiceService
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  return { instance, url: "http://127.0.0.1:" + instance.server.address().port };
}

function pending(store, playerId) {
  return new PurchaseAuthority({ store }).createPending({
    playerId,
    body: { product_id: "scrap_5000" },
    idempotencyKey: "invoice-test-" + playerId
  });
}

test("A · PENDING invoice uses persisted purchase price/product and correlates payload", async () => {
  const store = new InMemoryPurchaseStore();
  const created = pending(store, "telegram:12001");
  const { fetchImpl, calls } = fakeFetchFactory();
  const service = new TelegramStarsInvoiceService({ botToken: "test-bot-token", fetchImpl, apiBaseUrl: "https://api.telegram.test" });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const response = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "telegram:12001" },
      body: "{}"
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.purchase_id, created.purchase_id);
    assert.equal(body.provider, "telegram-stars");
    assert.equal(body.invoice_payload, buildTelegramStarsInvoicePayload({ purchaseId: created.purchase_id, productId: "scrap_5000", amount: 50 }));
    assert.match(body.invoice_url, /^https:\/\//);
    assert.equal(store.loadPurchase(created.purchase_id).authorizationStatus, "PENDING");
    assert.equal(store.loadPurchase(created.purchase_id).invoiceUrl, body.invoice_url);
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.currency, "XTR");
    assert.deepEqual(sent.prices, [{ label: "scrap_5000", amount: 50 }]);
    assert.equal(sent.payload, body.invoice_payload);
    assert.equal(sent.provider_token, "");
    assert.equal(sent.amount, undefined);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("B · unknown and foreign purchase return safe NOT_FOUND", async () => {
  const store = new InMemoryPurchaseStore();
  const service = new TelegramStarsInvoiceService({ botToken: "test", fetchImpl: fakeFetchFactory().fetchImpl });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const unknown = await fetch(url + "/v1/purchases/unknown/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": "telegram:12002" }, body: "{}"
    });
    assert.equal(unknown.status, 404);

    const created = pending(store, "telegram:12003");
    const foreign = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": "telegram:12004" }, body: "{}"
    });
    assert.equal(foreign.status, 404);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("C · client economic authority injection is rejected before provider call", async () => {
  const store = new InMemoryPurchaseStore();
  const created = pending(store, "telegram:12005");
  const { fetchImpl, calls } = fakeFetchFactory();
  const service = new TelegramStarsInvoiceService({ botToken: "test", fetchImpl });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const response = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-player-id": "telegram:12005" },
      body: JSON.stringify({
        amount: 999999, currency: "USD", productId: "fake", grantAmount: 999999,
        provider: "fake", purchaseId: "other", invoice_payload: "fake"
      })
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "CLIENT_AUTHORITY_FORBIDDEN");
    assert.equal(calls.length, 0);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("D · AUTHORIZED_GRANT and GRANT_CLAIMED cannot create invoices", async () => {
  const store = new InMemoryPurchaseStore();
  const service = new TelegramStarsInvoiceService({ botToken: "test", fetchImpl: fakeFetchFactory().fetchImpl });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const owner = "telegram:12006";
    const created = pending(store, owner);
    const verified = {
      purchaseId: created.purchase_id, playerId: owner, productId: "scrap_5000", amount: 50,
      currency: "XTR", provider: "telegram-stars", providerTransactionId: "tg-charge-12006",
      receiptFingerprint: "a".repeat(64), grantKind: "scrap", grantAmount: 5000
    };
    store.authorizePendingPurchase(verified);

    let response = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": owner }, body: "{}"
    });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "PURCHASE_NOT_PENDING");

    const claimed = pending(store, "telegram:12007");
    store.authorizePendingPurchase({ ...verified, purchaseId: claimed.purchase_id, playerId: "telegram:12007", providerTransactionId: "tg-charge-12007" });
    store.claimPurchase(claimed.purchase_id, "telegram:12007");

    response = await fetch(url + "/v1/purchases/" + claimed.purchase_id + "/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": "telegram:12007" }, body: "{}"
    });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "PURCHASE_NOT_PENDING");
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("E · missing Bot Token fails closed with 503 and no fake invoice", async () => {
  const store = new InMemoryPurchaseStore();
  const created = pending(store, "telegram:12008");
  let providerCalls = 0;
  const service = new TelegramStarsInvoiceService({ botToken: "", fetchImpl: async () => { providerCalls += 1; throw new Error("must not call"); } });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const response = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": "telegram:12008" }, body: "{}"
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "TELEGRAM_INVOICE_UNAVAILABLE");
    assert.equal(providerCalls, 0);
    assert.equal(store.loadPurchase(created.purchase_id).invoiceUrl, undefined);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("F · repeated invoice request reuses persisted handle and does not call Telegram twice", async () => {
  const store = new InMemoryPurchaseStore();
  const created = pending(store, "telegram:12009");
  const { fetchImpl, calls } = fakeFetchFactory();
  const service = new TelegramStarsInvoiceService({ botToken: "test-bot", fetchImpl });
  const { instance, url } = await start({ purchaseStore: store, invoiceService: service });
  try {
    const headers = { "content-type": "application/json", "x-test-player-id": "telegram:12009" };
    const one = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", { method: "POST", headers, body: "{}" });
    const two = await fetch(url + "/v1/purchases/" + created.purchase_id + "/invoice", { method: "POST", headers, body: "{}" });
    assert.equal(one.status, 200);
    assert.equal(two.status, 200);
    const first = await one.json();
    const second = await two.json();
    assert.equal(first.invoice_url, second.invoice_url);
    assert.equal(second.reused, true);
    assert.equal(calls.length, 1);
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
});

test("G · persistent restart recovers invoice association without changing economic status", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "basewarriors-auth012-"));
  const filePath = path.join(directory, "purchases.json");
  try {
    const storeA = new PersistentPurchaseStore({ filePath });
    const created = pending(storeA, "telegram:12010");
    const { fetchImpl } = fakeFetchFactory();
    const service = new TelegramStarsInvoiceService({ botToken: "test", fetchImpl });
    const first = await start({ purchaseStore: storeA, invoiceService: service });
    await fetch(first.url + "/v1/purchases/" + created.purchase_id + "/invoice", {
      method: "POST", headers: { "content-type": "application/json", "x-test-player-id": "telegram:12010" }, body: "{}"
    });
    await new Promise((resolve) => first.instance.server.close(resolve));

    const storeB = new PersistentPurchaseStore({ filePath });
    const recovered = storeB.loadPurchase(created.purchase_id);
    assert.equal(recovered.authorizationStatus, "PENDING");
    assert.equal(recovered.claimStatus, "UNCLAIMED");
    assert.equal(recovered.invoiceUrl, "https://t.me/$basewarriors-test-invoice");
    assert.equal(recovered.invoicePayload, buildTelegramStarsInvoicePayload({ purchaseId: created.purchase_id, productId: "scrap_5000", amount: 50 }));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("H · invoice creation alone never authorizes or claims", async () => {
  const store = new InMemoryPurchaseStore();
  const created = pending(store, "telegram:12011");
  const service = new TelegramStarsInvoiceService({ botToken: "test", fetchImpl: fakeFetchFactory().fetchImpl });
  const result = await service.createInvoice({ purchase: store.loadPurchase(created.purchase_id) });
  assert.equal(result.purchaseId, created.purchase_id);
  const after = store.loadPurchase(created.purchase_id);
  assert.equal(after.authorizationStatus, "PENDING");
  assert.equal(after.claimStatus, "UNCLAIMED");
  assert.equal(after.grantAmount, 5000);
});

console.log("bone011_auth012_invoice_test: PASS");
