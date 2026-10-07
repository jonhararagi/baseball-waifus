import assert from "node:assert/strict";
import { BaseballWaifusApi } from "./api.js";
import { CHECKOUT_STATUS, ShopManager } from "./shopManager.js";

global.window = {
  location: { hostname: "production.example" },
  setTimeout,
  clearTimeout
};

const requests = [];
const apiResponses = new Map();

global.fetch = async (url, options = {}) => {
  requests.push({
    url: String(url),
    method: String(options.method || "GET"),
    headers: { ...(options.headers || {}) },
    body: options.body === undefined ? null : String(options.body)
  });
  const key = String(options.method || "GET") + " " + String(url);
  const response = apiResponses.get(key);
  if (!response) throw new Error("Unexpected request: " + key);
  return new Response(JSON.stringify(response.body), {
    status: response.status || 200,
    headers: { "content-type": "application/json" }
  });
};

const telegramBridge = {
  getInitData: () => "query_id=real-client-init-data",
  openInvoice: (_url, callback) => {
    callback("paid");
    return true;
  }
};

const api = new BaseballWaifusApi({
  baseUrl: "https://authority.example",
  telegramBridge,
  timeoutMs: 1000
});

apiResponses.set("POST https://authority.example/v1/purchases", {
  body: {
    status: "PENDING",
    created: true,
    purchase_id: "purchase-auth013-001",
    player_id: "telegram:1001",
    product_id: "scrap_5000",
    provider: "telegram-stars",
    currency: "XTR",
    amount: 50,
    grant_kind: "scrap",
    grant_amount: 5000
  }
});
apiResponses.set("POST https://authority.example/v1/purchases/purchase-auth013-001/invoice", {
  body: {
    purchase_id: "purchase-auth013-001",
    provider: "telegram-stars",
    invoice_payload: "bwstars:v1:purchase-auth013-001:scrap_5000:50",
    invoice_url: "https://t.me/$/invoice/auth013"
  }
});
apiResponses.set("GET https://authority.example/v1/purchases/purchase-auth013-001", {
  body: {
    status: "AUTHORIZED_GRANT",
    purchase_id: "purchase-auth013-001",
    product_id: "scrap_5000",
    provider: "telegram-stars",
    currency: "XTR",
    amount: 50,
    grant_kind: "scrap",
    grant_amount: 5000
  }
});

const create = await api.createPendingPurchase("scrap_5000", "checkout-fixed-key");
assert.equal(create.status, "PENDING");
assert.deepEqual(JSON.parse(requests[0].body), { product_id: "scrap_5000" });
assert.equal(requests[0].headers["x-telegram-init-data"], "query_id=real-client-init-data");
assert.equal(requests[0].headers["Idempotency-Key"], "checkout-fixed-key");
assert.deepEqual(Object.keys(JSON.parse(requests[0].body)), ["product_id"]);

const invoice = await api.createPurchaseInvoice(create.purchase_id);
assert.equal(invoice.invoice_url, "https://t.me/$/invoice/auth013");
assert.equal(requests[1].body, "{}");
assert.equal(requests[1].headers["x-telegram-init-data"], "query_id=real-client-init-data");

const status = await api.getPurchaseStatus(create.purchase_id);
assert.equal(status.status, "AUTHORIZED_GRANT");

const storage = {
  data: new Map(),
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; },
  setItem(key, value) { this.data.set(key, String(value)); }
};

const checkoutManager = new ShopManager({ api, telegramBridge, storage });
const checkout = await checkoutManager.buyScrapPack("scrap_5000");
assert.equal(checkout.ok, true);
assert.equal(checkout.authorityStatus, "AUTHORIZED_GRANT");
assert.equal(checkout.economicSideEffect, false);
assert.equal(checkoutManager.getCheckoutState().status, CHECKOUT_STATUS.AUTHORIZED_PENDING_CLAIM);
assert.equal(checkout.purchaseStatus.status, "AUTHORIZED_GRANT");
assert.ok(storage.getItem("baseball_waifus_purchase_recovery_v1"));

let recoveryId = null;
const reconnectManager = new ShopManager({
  api: {
    configured: () => true,
    getPurchaseStatus: async (purchaseId) => {
      recoveryId = purchaseId;
      return { status: "PENDING", purchase_id: purchaseId, product_id: "scrap_5000" };
    }
  },
  storage
});
const recovered = await reconnectManager.recoverStoredPurchase("scrap_5000");
assert.equal(recovered.authorityStatus, "PENDING");
assert.equal(recoveryId, "purchase-auth013-001");

async function checkoutWithPayment(paymentStatus, statusDto = { status: "PENDING", purchase_id: "purchase-x", product_id: "scrap_5000" }) {
  const manager = new ShopManager({
    api: {
      configured: () => true,
      createPendingPurchase: async () => ({
        status: "PENDING",
        purchase_id: "purchase-x",
        product_id: "scrap_5000",
        provider: "telegram-stars",
        currency: "XTR",
        amount: 50
      }),
      createPurchaseInvoice: async () => ({
        purchase_id: "purchase-x",
        provider: "telegram-stars",
        invoice_payload: "payload",
        invoice_url: "https://t.me/$/invoice-x"
      }),
      getPurchaseStatus: async () => statusDto
    },
    telegramBridge: {
      openInvoice: (_url, callback) => {
        callback(paymentStatus);
        return true;
      }
    },
    storage: { getItem: () => null, setItem() {} }
  });
  return manager.buyScrapPack("scrap_5000");
}

const cancelled = await checkoutWithPayment("cancelled");
assert.equal(cancelled.ok, false);
assert.equal(cancelled.status, "cancelled");

const failed = await checkoutWithPayment("failed");
assert.equal(failed.ok, false);
assert.equal(failed.status, "failed");

const pending = await checkoutWithPayment("paid", {
  status: "PENDING",
  purchase_id: "purchase-x",
  product_id: "scrap_5000"
});
assert.equal(pending.ok, true);
assert.equal(pending.authorityStatus, "PENDING");
assert.equal(pending.economicSideEffect, false);

const productionStatic = new ShopManager({
  telegramBridge: {
    openInvoice: () => { throw new Error("static invoice must never be used in production"); }
  },
  storage: { getItem: () => null, setItem() {} }
});
global.window.__BASEBALL_WAIFUS_INVOICES__ = {
  scrap_5000: "https://t.me/$/static-forbidden"
};
const blockedStatic = await productionStatic.buyScrapPack("scrap_5000");
assert.equal(blockedStatic.ok, false);
assert.equal(blockedStatic.status, "api_unavailable");

global.window.location.hostname = "localhost";
const developmentManager = new ShopManager({
  telegramBridge: {
    openInvoice: (_url, callback) => { callback("paid"); return true; }
  },
  storage: { getItem: () => null, setItem() {} }
});
global.window.__BASEBALL_WAIFUS_INVOICES__ = { scrap_5000: "https://t.me/$/demo" };
const demo = await developmentManager.buyScrapPack("scrap_5000");
assert.equal(demo.ok, true);
assert.equal(demo.simulated, true);
assert.equal(demo.economicSideEffect, true);

console.log("purchase_checkout_test: PASS");
