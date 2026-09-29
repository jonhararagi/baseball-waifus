import assert from "node:assert/strict";
import {
  BATTER_ORDER,
  SUPPORT_ACTION,
  applyBatterDecision,
  applySupportDecision,
  getAvailableTacticalDecision
} from "./kytos_tactical_decision.js";
import {
  ACTION_CARD,
  applyActionCard,
  beginEnergyTransfer,
  captureEnergyBall,
  createCombatState,
  launchEnergyBall,
  modifyEnergyBall,
  resolveKytosHit,
  transferToBatter
} from "./kytos_combat_vertical_slice.js";

function prepare(supportAction, batterOrder) {
  let state = createCombatState({
    batterId: "bw001",
    supportAId: "bw003",
    supportBId: "bw008",
    supportCId: "support-c"
  });

  state = applySupportDecision(state, supportAction);
  state = beginEnergyTransfer(state, {
    sourceId: "bw003",
    energyType: "BUFF",
    energy: 60
  });
  state = launchEnergyBall(state, "bw008");
  state = captureEnergyBall(state, "bw008");
  state = modifyEnergyBall(state, { energyType: "BUFF" });
  state = launchEnergyBall(state, "support-c");
  state = captureEnergyBall(state, "support-c");
  state = modifyEnergyBall(state, { energyType: "DEBUFF" });
  state = launchEnergyBall(state, "bw001");
  state = applyActionCard(state, ACTION_CARD.BUFFER, { energy: 10 });
  state = applyActionCard(state, ACTION_CARD.DEBUFFER, { energy: 5 });
  state = applyBatterDecision(state, batterOrder);
  state = transferToBatter(state);
  return resolveKytosHit(state, { timingAccuracy: 1 });
}

assert.deepEqual(
  getAvailableTacticalDecision("SUPPORT_DECISION"),
  Object.values(SUPPORT_ACTION)
);
assert.deepEqual(
  getAvailableTacticalDecision("BATTER_DECISION"),
  Object.values(BATTER_ORDER)
);

const passNormal = prepare(SUPPORT_ACTION.PASS, BATTER_ORDER.NORMAL_SWING);
const boostNormal = prepare(SUPPORT_ACTION.BOOST, BATTER_ORDER.NORMAL_SWING);
const chargeNormal = prepare(SUPPORT_ACTION.CHARGE, BATTER_ORDER.NORMAL_SWING);
const passPower = prepare(SUPPORT_ACTION.PASS, BATTER_ORDER.POWER_SWING);

assert.equal(passNormal.damage, 59);
assert.equal(boostNormal.damage, 74);
assert.equal(chargeNormal.damage, 61);
assert.equal(passPower.damage, 71);
assert.notEqual(passNormal.damage, boostNormal.damage);
assert.notEqual(passNormal.damage, chargeNormal.damage);
assert.notEqual(passNormal.damage, passPower.damage);

const repeated = prepare(SUPPORT_ACTION.BOOST, BATTER_ORDER.POWER_SWING);
const repeatedAgain = prepare(SUPPORT_ACTION.BOOST, BATTER_ORDER.POWER_SWING);
assert.deepEqual(repeated, repeatedAgain);

assert.throws(
  () => applySupportDecision(createCombatState(), "INVALID"),
  /Unknown support action/
);
assert.throws(
  () => applyBatterDecision(createCombatState(), "INVALID"),
  /Unknown batter order/
);

assert.equal(passNormal.tactical.supportAction, SUPPORT_ACTION.PASS);
assert.equal(passPower.tactical.batterOrder, BATTER_ORDER.POWER_SWING);

console.log("kytos_tactical_decision_test: ok");
