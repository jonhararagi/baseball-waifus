import assert from "node:assert/strict";
import {
  ACTION_CARD,
  ENERGY_TYPE,
  KYTOS_PHASE,
  applyActionCard,
  applyKytosPressure,
  beginEnergyTransfer,
  captureEnergyBall,
  chargeKytosEmergency,
  createCombatState,
  createFormation,
  launchEnergyBall,
  modifyEnergyBall,
  resolveClimax,
  resolveKytosHit,
  resolveTimingEvent,
  transferToBatter
} from "./kytos_combat_vertical_slice.js";

const formation = createFormation({
  batterId: "bw001",
  supportAId: "bw003",
  supportBId: "bw008",
  supportCId: "support-c"
});
assert.equal(formation.bases.length, 4);
assert.deepEqual(
  [formation.batter.id, ...formation.supports.map((unit) => unit.id)],
  ["bw001", "bw003", "bw008", "support-c"]
);

let state = createCombatState({ batterId: "bw001", supportAId: "bw003", supportBId: "bw008" });
state = beginEnergyTransfer(state, {
  sourceId: "bw003",
  energyType: ENERGY_TYPE.BUFF,
  energy: 40
});
assert.equal(state.energyBall.energy, 40);
state = captureEnergyBall(state, "bw008");
state = modifyEnergyBall(state, { energyType: ENERGY_TYPE.ATTACK, energyDelta: 10 });
state = launchEnergyBall(state, "bw001");
state = transferToBatter(state);
assert.equal(state.batter.storedEnergy, 50);

const buffered = applyActionCard(state, ACTION_CARD.BUFFER, { energy: 15 });
assert.equal(buffered.batter.attackBonus, 15);
const debuffed = applyActionCard(buffered, ACTION_CARD.DEBUFFER, { energy: 5 });
assert.equal(debuffed.batter.debuff, 5);

const hit = resolveKytosHit(debuffed, { timingAccuracy: 1 });
assert.equal(hit.damage, 30);
assert.equal(hit.kytos.hp, 70);

const shielded = createCombatState({ shield: 100 });
const pressured = applyKytosPressure(shielded, 41);
assert.equal(pressured.shield, 59);
assert.equal(pressured.phase, KYTOS_PHASE.INTERRUPTED);
assert.equal(pressured.lastResult, "INTERRUPTED_SUPPORT");

const emergencyStart = createCombatState({ kytosEnergy: 0 });
const emergency = chargeKytosEmergency(emergencyStart, 70);
assert.equal(emergency.phase, KYTOS_PHASE.EMERGENCY);
assert.equal(emergency.kytos.energy, 70);

const timing = resolveTimingEvent({ timingDeltaMs: 0, storedEnergy: 80, kytosEnergy: 20 });
assert.equal(timing.success, true);
assert.equal(timing.damage, 96);
assert.equal(timing.reflectedEnergy, 80);

const miss = resolveTimingEvent({ timingDeltaMs: 200, storedEnergy: 80, kytosEnergy: 20 });
assert.equal(miss.success, false);
assert.equal(miss.damage, 0);

const climaxState = {
  ...emergency,
  batter: { ...emergency.batter, storedEnergy: 100 }
};
const climax = resolveClimax(climaxState, { timingDeltaMs: 0 });
assert.equal(climax.phase, KYTOS_PHASE.VICTORY);
assert.equal(climax.kytos.hp, 0);

const deterministicInput = createCombatState({ kytosMaxHp: 100 });
const run = () => {
  let current = beginEnergyTransfer(deterministicInput, {
    sourceId: "bw003",
    energyType: ENERGY_TYPE.BUFF,
    energy: 40
  });
  current = captureEnergyBall(current, "bw008");
  current = modifyEnergyBall(current, { energyType: ENERGY_TYPE.ATTACK, energyDelta: 10 });
  current = launchEnergyBall(current, "bw001");
  current = transferToBatter(current);
  current = applyActionCard(current, ACTION_CARD.BUFFER, { energy: 10 });
  current = chargeKytosEmergency(current, 70);
  return resolveClimax({ ...current, phase: KYTOS_PHASE.EMERGENCY }, { timingDeltaMs: 20 });
};
assert.deepEqual(run(), run());

console.log("kytos_combat_vertical_slice_test: ok");
