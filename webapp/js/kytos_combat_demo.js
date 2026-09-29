import {
  ACTION_CARD,
  beginEnergyTransfer,
  captureEnergyBall,
  applyActionCard,
  chargeKytosEmergency,
  createCombatState,
  launchEnergyBall,
  modifyEnergyBall,
  resolveClimax,
  resolveKytosHit,
  transferToBatter
} from "./kytos_combat_vertical_slice.js";
import {
  BATTER_ORDER,
  SUPPORT_ACTION,
  applyBatterDecision,
  applySupportDecision
} from "./kytos_tactical_decision.js";

export const KYTOS_DEMO_PHASE = Object.freeze({
  IDLE: "IDLE",
  FORMATION: "FORMATION",
  SUPPORT_DECISION: "SUPPORT_DECISION",
  ENERGY_TRANSFER: "ENERGY_TRANSFER",
  BUFF_DEBUFF: "BUFF_DEBUFF",
  BATTER_DECISION: "BATTER_DECISION",
  BATTER_READY: "BATTER_READY",
  SWING: "SWING",
  HIT: "HIT",
  KYTOS_DAMAGE: "KYTOS_DAMAGE",
  EMERGENCY: "EMERGENCY",
  TIMING: "TIMING",
  VICTORY: "VICTORY"
});

const STEP_ORDER = Object.freeze([
  KYTOS_DEMO_PHASE.FORMATION,
  KYTOS_DEMO_PHASE.SUPPORT_DECISION,
  KYTOS_DEMO_PHASE.ENERGY_TRANSFER,
  KYTOS_DEMO_PHASE.BUFF_DEBUFF,
  KYTOS_DEMO_PHASE.BATTER_DECISION,
  KYTOS_DEMO_PHASE.BATTER_READY,
  KYTOS_DEMO_PHASE.SWING,
  KYTOS_DEMO_PHASE.HIT,
  KYTOS_DEMO_PHASE.KYTOS_DAMAGE,
  KYTOS_DEMO_PHASE.EMERGENCY,
  KYTOS_DEMO_PHASE.TIMING,
  KYTOS_DEMO_PHASE.VICTORY
]);

function clone(value) {
  return structuredClone(value);
}

export class KytosCombatDemo {
  constructor({ renderer = null } = {}) {
    this.renderer = renderer;
    this.stepIndex = -1;
    this.phase = KYTOS_DEMO_PHASE.IDLE;
    this.state = null;
    this.presentation = {
      timing: null,
      event: "",
      selectedSupportAction: null,
      selectedBatterOrder: null
    };
    this.history = [];
    this.restart();
  }

  restart() {
    this.stepIndex = -1;
    this.phase = KYTOS_DEMO_PHASE.IDLE;
    this.state = createCombatState({
      batterId: "bw001",
      supportAId: "bw003",
      supportBId: "bw008",
      supportCId: "support-c",
      kytosMaxHp: 100,
      kytosMaxEnergy: 100
    });
    this.presentation = {
      timing: null,
      event: "",
      selectedSupportAction: null,
      selectedBatterOrder: null
    };
    this.history = [];
    this._syncPresentation();
    return this.snapshot();
  }

  canAdvance() {
    if (this.stepIndex >= STEP_ORDER.length - 1) return false;
    if (this.phase === KYTOS_DEMO_PHASE.SUPPORT_DECISION) return Boolean(this.presentation.selectedSupportAction);
    if (this.phase === KYTOS_DEMO_PHASE.BATTER_DECISION) return Boolean(this.presentation.selectedBatterOrder);
    return true;
  }

  getAvailableDecisions() {
    if (this.phase === KYTOS_DEMO_PHASE.SUPPORT_DECISION) return Object.values(SUPPORT_ACTION);
    if (this.phase === KYTOS_DEMO_PHASE.BATTER_DECISION) return Object.values(BATTER_ORDER);
    return [];
  }

  selectSupportAction(action) {
    if (this.phase !== KYTOS_DEMO_PHASE.SUPPORT_DECISION || this.presentation.selectedSupportAction) return this.snapshot();
    this.state = applySupportDecision(this.state, action);
    this.presentation = {
      ...this.presentation,
      selectedSupportAction: String(action).toUpperCase(),
      event: String(action).toUpperCase() + " SELECTED"
    };
    this._recordDecision();
    this._syncPresentation();
    return this.snapshot();
  }

  selectBatterOrder(order) {
    if (this.phase !== KYTOS_DEMO_PHASE.BATTER_DECISION || this.presentation.selectedBatterOrder) return this.snapshot();
    this.state = applyBatterDecision(this.state, order);
    this.presentation = {
      ...this.presentation,
      selectedBatterOrder: String(order).toUpperCase(),
      event: String(order).toUpperCase() + " SELECTED"
    };
    this._recordDecision();
    this._syncPresentation();
    return this.snapshot();
  }

  step({ autoSelectDefaults = false } = {}) {
    if (this.phase === KYTOS_DEMO_PHASE.SUPPORT_DECISION && !this.presentation.selectedSupportAction) {
      if (!autoSelectDefaults) return this.snapshot();
      this.selectSupportAction(SUPPORT_ACTION.PASS);
    }
    if (this.phase === KYTOS_DEMO_PHASE.BATTER_DECISION && !this.presentation.selectedBatterOrder) {
      if (!autoSelectDefaults) return this.snapshot();
      this.selectBatterOrder(BATTER_ORDER.NORMAL_SWING);
    }
    if (this.stepIndex >= STEP_ORDER.length - 1) return this.snapshot();

    this.stepIndex += 1;
    const phase = STEP_ORDER[this.stepIndex];
    this.presentation = {
      timing: null,
      event: phase,
      selectedSupportAction: this.presentation.selectedSupportAction || null,
      selectedBatterOrder: this.presentation.selectedBatterOrder || null
    };

    switch (phase) {
      case KYTOS_DEMO_PHASE.FORMATION:
        break;

      case KYTOS_DEMO_PHASE.SUPPORT_DECISION:
        this.presentation.event = "CHOOSE SUPPORT ACTION";
        break;

      case KYTOS_DEMO_PHASE.ENERGY_TRANSFER:
        this.state = beginEnergyTransfer(this.state, {
          sourceId: "bw003",
          energyType: "BUFF",
          energy: 60
        });
        this.state = launchEnergyBall(this.state, "bw008");
        break;

      case KYTOS_DEMO_PHASE.BUFF_DEBUFF:
        this.state = captureEnergyBall(this.state, "bw008");
        this.state = modifyEnergyBall(this.state, {
          energyType: "BUFF",
          energyDelta: 0
        });
        this.state = launchEnergyBall(this.state, "support-c");
        this.state = captureEnergyBall(this.state, "support-c");
        this.state = modifyEnergyBall(this.state, {
          energyType: "DEBUFF",
          energyDelta: 0
        });
        this.state = launchEnergyBall(this.state, "bw001");
        this.state = applyActionCard(this.state, ACTION_CARD.BUFFER, { energy: 10 });
        this.state = applyActionCard(this.state, ACTION_CARD.DEBUFFER, { energy: 5 });
        break;

      case KYTOS_DEMO_PHASE.BATTER_DECISION:
        this.presentation.event = "CHOOSE BATTER ORDER";
        break;

      case KYTOS_DEMO_PHASE.BATTER_READY:
        this.state = transferToBatter(this.state);
        this.renderer?.beginBatterWindup?.();
        break;

      case KYTOS_DEMO_PHASE.SWING:
        this.renderer?.beginBatterSwing?.();
        break;

      case KYTOS_DEMO_PHASE.HIT:
        this.state = resolveKytosHit(this.state, { timingAccuracy: 1 });
        this.renderer?.triggerCombatEffect?.("HIT", { result: this.state.lastResult });
        break;

      case KYTOS_DEMO_PHASE.KYTOS_DAMAGE:
        break;

      case KYTOS_DEMO_PHASE.EMERGENCY:
        this.state = chargeKytosEmergency(this.state, 30);
        this.renderer?.triggerCombatEffect?.("HIT", { result: this.state.lastResult });
        break;

      case KYTOS_DEMO_PHASE.TIMING:
        this.state = applyActionCard(this.state, ACTION_CARD.ATTACK, { energy: 45 });
        this.presentation.timing = {
          active: true,
          progress: 0.86,
          result: null
        };
        break;

      case KYTOS_DEMO_PHASE.VICTORY:
        this.state = resolveClimax(this.state, { timingDeltaMs: 0 });
        this.presentation.timing = {
          active: false,
          progress: 1,
          result: this.state.timing?.success ? "GREAT" : "MISS"
        };
        this.renderer?.triggerCombatEffect?.("PERFECT", { result: this.state.lastResult });
        break;

      default:
        break;
    }

    this.history.push({
      phase,
      gameplay: clone(this.state),
      presentation: clone(this.presentation)
    });
    this._syncPresentation();
    return this.snapshot();
  }

  snapshot() {
    return {
      phase: this.phase,
      stepIndex: this.stepIndex,
      state: clone(this.state),
      presentation: clone(this.presentation),
      history: clone(this.history)
    };
  }

  _recordDecision() {
    this.history.push({
      phase: this.phase,
      gameplay: clone(this.state),
      presentation: clone(this.presentation)
    });
  }

  _syncPresentation() {
    this.phase = this.stepIndex < 0
      ? KYTOS_DEMO_PHASE.IDLE
      : STEP_ORDER[this.stepIndex];

    const viewState = {
      ...this.state,
      demoPhase: this.phase,
      presentation: this.presentation
    };

    this.renderer?.setKytosPresentationState?.(viewState);
  }
}

export { STEP_ORDER };
