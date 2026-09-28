import assert from "node:assert/strict";
import { KytosCombatPresentation } from "./kytos_combat_presentation.js";
import {
  ACTION_CARD,
  KYTOS_PHASE,
  applyActionCard,
  applyKytosPressure,
  beginEnergyTransfer,
  captureEnergyBall,
  chargeKytosEmergency,
  createCombatState,
  launchEnergyBall,
  modifyEnergyBall,
  resolveClimax,
  resolveKytosHit
} from "./kytos_combat_vertical_slice.js";

const presentation = new KytosCombatPresentation();

const fakeContext = new Proxy({}, {
  get: () => () => {},
  set: () => true
});

let state = createCombatState({ kytosMaxHp: 100, kytosMaxEnergy: 100 });
const original = structuredClone(state);

let model = presentation.buildModel(state, 720, 1280);
assert.equal(model.formation.batterId, "bw001");
assert.deepEqual(model.formation.supportIds, ["bw003", "bw008", "support-c"]);
assert.equal(model.shield, 100);
assert.equal(model.hp, 100);
assert.equal(model.emergency, false);
presentation.render(fakeContext, 720, 1280, state, { time: 0 });
assert.deepEqual(state, original, "presentation must not mutate initial combat state");

state = beginEnergyTransfer(state, {
  sourceId: "bw003",
  energyType: "BUFF",
  energy: 40
});
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.energyBall.energyType, "BUFF");
assert.equal(model.energyBall.sourceId, "bw003");
assert.equal(model.energyBall.active, true);

state = captureEnergyBall(state, "bw008");
state = modifyEnergyBall(state, { energyType: "ATTACK", energyDelta: 10 });
state = launchEnergyBall(state, "bw001");
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.energyBall.targetId, "bw001");
assert.equal(model.energyBall.active, true);
assert.ok(model.energyBall.x > 0 && model.energyBall.y > 0);

state = applyActionCard(state, ACTION_CARD.BUFFER, { energy: 10 });
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.result, "BUFFER_APPLIED");
presentation.render(fakeContext, 720, 1280, state, { time: 250 });
assert.equal(state.batter.attackBonus, 10);

state = applyKytosPressure(state, 45);
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.shield, 55);
assert.equal(model.interrupted, true);
assert.equal(model.result, "INTERRUPTED_SUPPORT");
presentation.render(fakeContext, 720, 1280, state, { time: 500 });

const beforeEmergencyPresentation = structuredClone(state);
state = chargeKytosEmergency(state, 30);
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.emergency, true);
assert.equal(model.phase, KYTOS_PHASE.EMERGENCY);
presentation.render(fakeContext, 720, 1280, state, { time: 750 });
assert.notDeepEqual(state, beforeEmergencyPresentation);
const afterEmergencyPresentation = structuredClone(state);
presentation.render(fakeContext, 720, 1280, state, { time: 800 });
assert.deepEqual(state, afterEmergencyPresentation, "presentation must not modify emergency gameplay result");

state = {
  ...state,
  batter: { ...state.batter, storedEnergy: 45 }
};
state = resolveKytosHit(state, { timingAccuracy: 1 });
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.hp, 45);
assert.equal(model.victory, false);
presentation.render(fakeContext, 720, 1280, state, { time: 1000 });

state = resolveClimax({
  ...state,
  batter: { ...state.batter, storedEnergy: 100 }
}, { timingDeltaMs: 0 });
model = presentation.buildModel(state, 720, 1280);
assert.equal(model.victory, true);
assert.equal(model.hp, 0);
assert.equal(model.result, "KYTOS_DEFEATED");
presentation.render(fakeContext, 720, 1280, state, { time: 1250 });


console.log("kytos_combat_presentation_test: ok");
