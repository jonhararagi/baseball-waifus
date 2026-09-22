import assert from "node:assert/strict";
import { getScrapRewardForResult } from "./combat.js";
import { GachaController, SCAVENGER_SCRAP_COST } from "./gacha_controller.js";
import { requestScrapPurchase, resolveScrapInvoiceUrl } from "./economy.js";

assert.equal(getScrapRewardForResult("HOME_RUN"), 100);
assert.equal(getScrapRewardForResult("SINGLE"), 10);
assert.equal(getScrapRewardForResult("DOUBLE"), 10);
assert.equal(getScrapRewardForResult("TRIPLE"), 10);
assert.equal(getScrapRewardForResult("HIT"), 10);
assert.equal(getScrapRewardForResult("OUT"), 0);
assert.equal(getScrapRewardForResult("FOUL"), 0);
assert.equal(getScrapRewardForResult("STRIKE"), 0);

const schema = { gacha: { rates: { status: "active_canonical_game_table_v1", R: 80, SR: 15, SSR: 4, UR: 1 }, pity: { model: "per_banner_counter", soft_pity: { enabled: true, start_pull: 61, increment_per_pull_percent: 0.5 }, hard_pity: { enabled: true, pull_limit: 80, guaranteed_rarity: "UR" } } } };
const queue = { character_id: "bw015", canonical: { display_name: "Momo Hoshino", rarity: "SSR" }, batch_units: [ { character_id: "bw016", canonical: { display_name: "Fuyuki Aono", rarity: "SR" } }, { character_id: "bw017", canonical: { display_name: "Yuzu Takahashi", rarity: "R" } }, { character_id: "bw024", canonical: { display_name: "Nene Kagetsu", rarity: "UR" } } ] };
function response(payload) { return { ok: true, async json() { return payload; } }; }
class MemoryStorage { constructor(seed = null) { this.value = seed; } getItem() { return this.value; } setItem(_key, value) { this.value = value; } }
const controller = new GachaController({ fetchImpl: async (url) => response(url.includes("schema") ? schema : queue), storage: new MemoryStorage(), rng: () => 0.999, now: () => 456 });
await controller.initialize();
controller.addScrap(SCAVENGER_SCRAP_COST);
assert.equal(controller.getScavengerScrap(), 1000);
const roll = await controller.rollGacha();
assert.equal(roll.rarity, "UR");
assert.equal(controller.getScavengerScrap(), 0);
await assert.rejects(() => controller.rollGacha(), /Not enough Scavenger Scrap/);
assert.equal(controller.getScavengerScrap(), 0);
controller.addScrap(110);
await assert.rejects(() => controller.rollGacha(), /Not enough Scavenger Scrap/);
assert.equal(controller.getScavengerScrap(), 110);

const invoiceUrl = "https://t.me/$baseball_waifus_1000";
assert.equal(resolveScrapInvoiceUrl(1000, invoiceUrl), invoiceUrl);
let invoiceCalls = [];
const paid = await requestScrapPurchase(1000, {
  webApp: {
    openInvoice(url, callback) {
      invoiceCalls.push(url);
      callback("paid");
    }
  },
  invoiceUrl
});
assert.deepEqual(invoiceCalls, [invoiceUrl]);
assert.deepEqual(paid, {
  ok: true,
  status: "paid",
  simulated: false,
  amount: 1000
});

const simulated = await requestScrapPurchase(250, {
  webApp: null,
  devFallback: true
});
assert.deepEqual(simulated, {
  ok: true,
  status: "paid",
  simulated: true,
  amount: 250
});

const unavailable = await requestScrapPurchase(250, {
  webApp: null,
  devFallback: false
});
assert.deepEqual(unavailable, {
  ok: false,
  status: "invoice_unavailable",
  simulated: false,
  amount: 250
});

console.log("[economy] scrap rewards, gacha affordability, and Stars hook passed");