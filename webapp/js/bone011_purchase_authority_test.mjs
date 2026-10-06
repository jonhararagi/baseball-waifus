import assert from "node:assert/strict";
import { authorizePurchaseGrant, AUTHORIZED_GRANT } from "./purchase_authority.js";
import { ShopUI } from "./shop_ui.js";

function createController() {
  let scrap = 0;
  return {
    addScrap(amount) { scrap += amount; },
    getScrap() { return scrap; }
  };
}

const paid = { ok: true, status: "paid", simulated: false };
const cancelled = { ok: false, status: "cancelled", simulated: false };
const simulatedPaid = { ok: true, status: "paid", simulated: true };
const scrapGrant = { kind: "SCRAP", amount: 5000 };
const boostGrant = { kind: "BOOST", id: "focus", turns: 10 };

assert.equal(
  authorizePurchaseGrant({ paymentResult: paid, requestedGrant: scrapGrant }).allowed,
  false
);

assert.equal(
  authorizePurchaseGrant({ paymentResult: cancelled, requestedGrant: scrapGrant }).allowed,
  false
);

assert.deepEqual(
  authorizePurchaseGrant({
    paymentResult: simulatedPaid,
    requestedGrant: scrapGrant,
    environment: "development"
  }),
  {
    allowed: true,
    status: "authorized",
    reason: "development_simulation",
    mode: "SIMULATED_DEMO_ONLY"
  }
);

assert.equal(
  authorizePurchaseGrant({
    paymentResult: paid,
    requestedGrant: scrapGrant,
    environment: "production"
  }).allowed,
  false
);

assert.equal(
  authorizePurchaseGrant({
    paymentResult: paid,
    authorityGrant: {
      type: AUTHORIZED_GRANT,
      status: "authorized",
      kind: "SCRAP",
      amount: 5000
    },
    requestedGrant: scrapGrant
  }).allowed,
  true
);

assert.equal(
  authorizePurchaseGrant({
    paymentResult: paid,
    authorityGrant: {
      type: AUTHORIZED_GRANT,
      status: "authorized",
      kind: "SCRAP",
      amount: 25000
    },
    requestedGrant: scrapGrant
  }).allowed,
  false
);

assert.equal(
  authorizePurchaseGrant({
    paymentResult: paid,
    requestedGrant: boostGrant
  }).allowed,
  false
);

assert.equal(
  authorizePurchaseGrant({
    paymentResult: paid,
    authorityGrant: {
      type: AUTHORIZED_GRANT,
      status: "authorized",
      kind: "BOOST",
      id: "focus",
      turns: 10
    },
    requestedGrant: boostGrant
  }).allowed,
  true
);

const productionController = createController();
const productionShop = new ShopUI({
  controller: productionController,
  shopManager: {
    async buyScrapPack() {
      return paid;
    }
  }
});
await productionShop.buyPack("scrap_5000");
assert.equal(productionController.getScrap(), 0);

const productionBoostShop = new ShopUI({
  shopManager: {
    async buyBoost() {
      return paid;
    }
  }
});
let boostGrantCalls = 0;
productionBoostShop.boosts = {
  grant() { boostGrantCalls += 1; },
  getState() { return { scrap_multiplier_turns: 0, focus_turns: 0 }; },
  getScrapMultiplier() { return 1; },
  getTimingGraceMs() { return 0; }
};
await productionBoostShop.buyBoost("focus");
assert.equal(boostGrantCalls, 0);

globalThis.window = {
  __BASEBALL_WAIFUS_DEV__: true,
  location: { hostname: "localhost" }
};
const demoController = createController();
const demoShop = new ShopUI({ controller: demoController });
const demoResult = await demoShop.buyPack("scrap_5000");
assert.equal(demoResult.mode, "SIMULATED_DEMO_ONLY");
assert.equal(demoController.getScrap(), 5000);

console.log("[bone011] purchase authority gate cases passed");
