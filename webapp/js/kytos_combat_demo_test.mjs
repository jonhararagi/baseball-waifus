import assert from "node:assert/strict";
import { KytosCombatDemo, KYTOS_DEMO_PHASE, STEP_ORDER } from "./kytos_combat_demo.js";
import { KytosCombatPresentation } from "./kytos_combat_presentation.js";

function runDemo() {
  const rendererCalls = [];
  const renderer = {
    setKytosPresentationState: (state) => rendererCalls.push(structuredClone(state)),
    beginBatterWindup: () => rendererCalls.push({ presentationAction: "WINDUP" }),
    beginBatterSwing: () => rendererCalls.push({ presentationAction: "SWING" }),
    triggerCombatEffect: (quality) => rendererCalls.push({ presentationAction: "EFFECT", quality })
  };

  const demo = new KytosCombatDemo({ renderer });
  assert.equal(demo.phase, KYTOS_DEMO_PHASE.IDLE);
  assert.equal(demo.canAdvance(), true);

  const snapshots = [];
  while (demo.stepIndex < STEP_ORDER.length - 1) {
    if (demo.phase === KYTOS_DEMO_PHASE.SUPPORT_DECISION) demo.selectSupportAction("PASS");
    if (demo.phase === KYTOS_DEMO_PHASE.BATTER_DECISION) demo.selectBatterOrder("NORMAL_SWING");
    snapshots.push(demo.step({ autoSelectDefaults: true }));
  }

  return { demo, snapshots, rendererCalls };
}

const first = runDemo();
const phases = first.snapshots.map((snapshot) => snapshot.phase);
assert.deepEqual(phases, STEP_ORDER);
assert.equal(first.demo.phase, KYTOS_DEMO_PHASE.VICTORY);
assert.equal(first.demo.state.phase, "VICTORY");
assert.equal(first.demo.state.kytos.hp, 0);
assert.equal(first.demo.state.timing.success, true);
assert.equal(first.demo.state.lastResult, "KYTOS_DEFEATED");
assert.equal(first.demo.state.tactical.supportAction, "PASS");
assert.equal(first.demo.state.tactical.batterOrder, "NORMAL_SWING");
assert.equal(first.demo.state.batter.storedEnergy, 0);
assert.ok(first.demo.state.shield <= 100);


const timingSnapshot = first.snapshots.find((snapshot) => snapshot.phase === KYTOS_DEMO_PHASE.TIMING);
assert.equal(timingSnapshot.presentation.timing.active, true);
assert.equal(timingSnapshot.state.lastResult, "ATTACK_CHARGED");

const batterReadySnapshot = first.snapshots.find((snapshot) => snapshot.phase === KYTOS_DEMO_PHASE.BATTER_READY);
assert.equal(batterReadySnapshot.state.batter.storedEnergy, 54);

const hitSnapshot = first.snapshots.find((snapshot) => snapshot.phase === KYTOS_DEMO_PHASE.HIT);
assert.equal(hitSnapshot.state.kytos.hp, 41);
assert.equal(hitSnapshot.state.lastResult, "KYTOS_HIT");

const emergencySnapshot = first.snapshots.find((snapshot) => snapshot.phase === KYTOS_DEMO_PHASE.EMERGENCY);
assert.equal(emergencySnapshot.state.phase, "EMERGENCY");
assert.equal(emergencySnapshot.state.kytos.energy, 30);

const presentation = new KytosCombatPresentation();
const gameplayBefore = structuredClone(first.demo.state);
const model = presentation.buildModel(first.demo.state, 720, 1280);
assert.equal(model.victory, true);
assert.equal(model.hp, 0);
assert.equal(model.formation.batterId, "bw001");
assert.deepEqual(first.demo.state, gameplayBefore, "presentation model must be read-only");

const fakeContext = new Proxy({}, {
  get: () => () => {},
  set: () => true
});
presentation.render(fakeContext, 720, 1280, {
  ...first.demo.state,
  presentation: first.snapshots.find((snapshot) => snapshot.phase === KYTOS_DEMO_PHASE.TIMING).presentation
}, { time: 1000 });
assert.deepEqual(first.demo.state, gameplayBefore, "presentation render must not mutate gameplay");

const second = runDemo();
assert.deepEqual(
  first.snapshots.map((snapshot) => ({ phase: snapshot.phase, state: snapshot.state, presentation: snapshot.presentation })),
  second.snapshots.map((snapshot) => ({ phase: snapshot.phase, state: snapshot.state, presentation: snapshot.presentation })),
  "identical demo runs must be deterministic"
);

first.demo.restart();
assert.equal(first.demo.phase, KYTOS_DEMO_PHASE.IDLE);
assert.equal(first.demo.state.kytos.hp, 100);
assert.equal(first.demo.state.kytos.energy, 0);
first.demo.step();
assert.equal(first.demo.phase, KYTOS_DEMO_PHASE.FORMATION);
assert.equal(first.demo.state.phase, "FORMATION");
assert.equal(first.demo.canAdvance(), true);

console.log("kytos_combat_demo_test: ok");
