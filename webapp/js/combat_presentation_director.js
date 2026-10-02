import { createPresentationCommand } from "./presentation_event_contract.js";

export const COMBAT_PRESENTATION_PHASE = Object.freeze({
  IDLE: "COMBAT_IDLE",
  ATTACKER_FOCUS: "ATTACKER_FOCUS",
  ACTION: "ACTION",
  IMPACT: "IMPACT",
  TARGET_REACTION: "TARGET_REACTION",
  RETURN: "COMBAT_RETURN",
  COMPLETE: "COMPLETE"
});

export const COMBAT_ULTIMATE_PHASE = Object.freeze({
  TRIGGER: "ULTIMATE_TRIGGER",
  STAGING: "ULTIMATE_STAGING",
  FOCUS: "ULTIMATE_CHARACTER_FOCUS",
  PREP: "ULTIMATE_ACTION_PREP",
  ACTION: "ULTIMATE_ACTION",
  IMPACT: "ULTIMATE_IMPACT",
  REACTION: "ULTIMATE_REACTION",
  RETURN: "ULTIMATE_RETURN",
  COMPLETE: "ULTIMATE_COMPLETE"
});

const STEP_DEFINITIONS = Object.freeze([
  Object.freeze({
    phase: COMBAT_PRESENTATION_PHASE.ATTACKER_FOCUS,
    durationMs: 220,
    focusTarget: "ATTACKER",
    focusActor: "ATTACKER",
    cameraAnchor: "PLAYER_FOCUS",
    zoom: 1.08,
    panX: 0.045,
    panY: 0.015,
    easing: "ease_out",
    actionIntent: "PREPARE",
    animationState: "WINDUP"
  }),
  Object.freeze({
    phase: COMBAT_PRESENTATION_PHASE.ACTION,
    durationMs: 300,
    focusTarget: "ATTACKER",
    focusActor: "ATTACKER",
    cameraAnchor: "ACTION",
    zoom: 1.14,
    panX: 0.02,
    panY: 0,
    easing: "ease_in_out",
    actionIntent: "SWING",
    animationState: "SWING",
    projectileBeat: "RELEASE_TO_IMPACT"
  }),
  Object.freeze({
    phase: COMBAT_PRESENTATION_PHASE.IMPACT,
    durationMs: 180,
    focusTarget: "TARGET",
    focusActor: "TARGET",
    cameraAnchor: "IMPACT",
    zoom: 1.20,
    panX: -0.045,
    panY: -0.012,
    easing: "ease_out",
    actionIntent: "CONTACT",
    animationState: "FOLLOW_THROUGH",
    projectileBeat: "CONTACT"
  }),
  Object.freeze({
    phase: COMBAT_PRESENTATION_PHASE.TARGET_REACTION,
    durationMs: 300,
    focusTarget: "TARGET",
    focusActor: "TARGET",
    cameraAnchor: "REACTION",
    zoom: 1.10,
    panX: -0.085,
    panY: -0.02,
    easing: "ease_in_out",
    actionIntent: "REACTION",
    animationState: "REACTION"
  }),
  Object.freeze({
    phase: COMBAT_PRESENTATION_PHASE.RETURN,
    durationMs: 300,
    focusTarget: "COMBAT",
    focusActor: null,
    cameraAnchor: "RETURN",
    zoom: 1,
    panX: 0,
    panY: 0,
    easing: "ease_in",
    actionIntent: "RESET",
    animationState: "IDLE"
  })
]);

const ULTIMATE_STEP_DEFINITIONS = Object.freeze([
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.TRIGGER,
    durationMs: 120,
    focusTarget: "COMBAT",
    focusActor: null,
    cameraAnchor: "FORMATION",
    zoom: 0.92,
    panX: 0,
    panY: 0,
    easing: "ease_out",
    actionIntent: "TRIGGER",
    animationState: "IDLE"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.STAGING,
    durationMs: 220,
    focusTarget: "COMBAT",
    focusActor: null,
    cameraAnchor: "FORMATION",
    zoom: 0.98,
    panX: 0,
    panY: 0,
    easing: "ease_in_out",
    actionIntent: "TEAM_STAGING",
    animationState: "IDLE"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.FOCUS,
    durationMs: 320,
    focusTarget: "ATTACKER",
    focusActor: "ATTACKER",
    cameraAnchor: "PLAYER_FOCUS",
    zoom: 1.16,
    panX: 0.055,
    panY: 0.01,
    easing: "ease_out",
    actionIntent: "FOCUS",
    animationState: "WINDUP"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.PREP,
    durationMs: 360,
    focusTarget: "ATTACKER",
    focusActor: "ATTACKER",
    cameraAnchor: "ACTION",
    zoom: 1.24,
    panX: 0.025,
    panY: -0.005,
    easing: "ease_in_out",
    actionIntent: "PREPARE",
    animationState: "WINDUP"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.RETURN,
    durationMs: 320,
    focusTarget: "COMBAT",
    focusActor: null,
    cameraAnchor: "RETURN",
    zoom: 0.96,
    panX: 0,
    panY: 0,
    easing: "ease_in",
    actionIntent: "RESET",
    animationState: "IDLE"
  })
]);

const ULTIMATE_ACTION_STEP_DEFINITIONS = Object.freeze([
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.ACTION,
    durationMs: 300,
    focusTarget: "ATTACKER",
    focusActor: "ATTACKER",
    cameraAnchor: "ACTION",
    zoom: 1.28,
    panX: 0.02,
    panY: -0.01,
    easing: "ease_in_out",
    actionIntent: "ULTIMATE_SWING",
    animationState: "SWING",
    projectileBeat: "RELEASE_TO_IMPACT"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.IMPACT,
    durationMs: 150,
    focusTarget: "TARGET",
    focusActor: "TARGET",
    cameraAnchor: "IMPACT",
    zoom: 1.30,
    panX: -0.06,
    panY: -0.015,
    easing: "ease_out",
    actionIntent: "ULTIMATE_CONTACT",
    animationState: "FOLLOW_THROUGH",
    projectileBeat: "CONTACT"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.REACTION,
    durationMs: 260,
    focusTarget: "TARGET",
    focusActor: "TARGET",
    cameraAnchor: "REACTION",
    zoom: 1.12,
    panX: -0.10,
    panY: -0.02,
    easing: "ease_in_out",
    actionIntent: "ULTIMATE_REACTION",
    animationState: "REACTION"
  }),
  Object.freeze({
    phase: COMBAT_ULTIMATE_PHASE.RETURN,
    durationMs: 300,
    focusTarget: "COMBAT",
    focusActor: null,
    cameraAnchor: "RETURN",
    zoom: 0.96,
    panX: 0,
    panY: 0,
    easing: "ease_in",
    actionIntent: "RESET",
    animationState: "IDLE"
  })
]);

const PHASES = Object.freeze([
  ...STEP_DEFINITIONS.map((step) => step.phase),
  COMBAT_PRESENTATION_PHASE.COMPLETE
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeString(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function safeDamage(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function easeOut(value) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeIn(value) {
  const t = clamp(value, 0, 1);
  return t * t * t;
}

function easeInOut(value) {
  const t = clamp(value, 0, 1);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function interpolate(from, to, progress, easing = "ease_in_out") {
  const eased = easing === "ease_out"
    ? easeOut(progress)
    : easing === "ease_in"
      ? easeIn(progress)
      : easeInOut(progress);
  return from + (to - from) * eased;
}

function normalizePresentationInput(result, fallback = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("Combat presentation result is required");
  }

  return Object.freeze({
    attackerId: safeString(
      result.attackerId
      ?? result.attacker_id
      ?? result.actorId
      ?? fallback.attackerId,
      "UNKNOWN_ATTACKER"
    ),
    targetId: safeString(
      result.targetId
      ?? result.target_id
      ?? result.defenderId
      ?? fallback.targetId,
      "UNKNOWN_TARGET"
    ),
    result: safeString(result.result ?? result.outcome ?? fallback.result, "RESULT").toUpperCase(),
    damage: safeDamage(result.damage),
    actionType: safeString(
      result.actionType
      ?? result.action_type
      ?? result.action
      ?? result.event
      ?? fallback.actionType,
      "COMBAT_ACTION"
    ).toUpperCase()
  });
}

function buildCommands(sequenceId, combatResult, stepDefinitions = STEP_DEFINITIONS, stage = null) {
  return Object.freeze(stepDefinitions.map((step, index) => createPresentationCommand({
    type: "CAMERA",
    eventId: sequenceId + ":" + String(index + 1),
    target: step.focusTarget,
    durationMs: step.durationMs,
    payload: {
      phase: step.phase,
      focus_target: step.focusTarget,
      camera_anchor: step.cameraAnchor || step.focusTarget,
      focus_actor_id: step.focusActor === "TARGET"
        ? combatResult.targetId
        : step.focusActor === "ATTACKER"
          ? combatResult.attackerId
          : null,
      stage_aware: Boolean(stage),
      zoom: step.zoom,
      pan_x: step.panX,
      pan_y: step.panY,
      easing: step.easing,
      action_intent: step.actionIntent || "",
      animation_state: step.animationState || "",
      projectile_beat: step.projectileBeat || "",
      attacker_id: combatResult.attackerId,
      target_id: combatResult.targetId,
      action_type: combatResult.actionType,
      combat_result: combatResult.result,
      damage: combatResult.damage
    }
  })));
}

export class CombatPresentationDirector {
  constructor({ onStep = null, stepDefinitions = STEP_DEFINITIONS, stage = null } = {}) {
    if (!Array.isArray(stepDefinitions) || stepDefinitions.length < 2) {
      throw new TypeError("CombatPresentationDirector requires deterministic steps");
    }

    this.stepDefinitions = Object.freeze(stepDefinitions.map((step) => Object.freeze({ ...step })));
    this.activeStepDefinitions = this.stepDefinitions;
    this.onStep = typeof onStep === "function" ? onStep : null;
    this.stage = stage && typeof stage.getCameraAnchor === "function" ? stage : null;
    this.reset();
  }

  setStage(stage) {
    this.stage = stage && typeof stage.getCameraAnchor === "function" ? stage : null;
    return this.stage;
  }

  reset() {
    this.sequenceId = "";
    this.sequenceKind = "NORMAL_ACTION";
    this.result = null;
    this.commands = Object.freeze([]);
    this.activeStepDefinitions = this.stepDefinitions;
    this.stepIndex = -1;
    this.stepElapsedMs = 0;
    this.phase = COMBAT_PRESENTATION_PHASE.IDLE;
    this.active = false;
    return this.getState();
  }

  startUltimateStaging({ attackerId, targetId, result = "ULTIMATE_STAGING", actionType = "ULTIMATE_STAGING" } = {}) {
    const normalized = normalizePresentationInput({
      attackerId,
      targetId,
      result,
      damage: 0,
      actionType
    });
    this.sequenceId = "ultimate-staging:" + normalized.attackerId + ":" + normalized.targetId;
    this.sequenceKind = "ULTIMATE_STAGING";
    this.activeStepDefinitions = ULTIMATE_STEP_DEFINITIONS;
    this.result = normalized;
    this.commands = buildCommands(this.sequenceId, normalized, this.activeStepDefinitions, this.stage);
    this.stepIndex = 0;
    this.stepElapsedMs = 0;
    this.phase = ULTIMATE_STEP_DEFINITIONS[0].phase;
    this.active = true;
    this._emitStep("START");
    return this.getState();
  }

  continueUltimateAction(result, fallback = {}) {
    if (!this.active || !this.sequenceKind.startsWith("ULTIMATE") || this.phase !== COMBAT_ULTIMATE_PHASE.PREP) {
      return null;
    }

    const normalized = normalizePresentationInput(result, {
      ...fallback,
      attackerId: fallback.attackerId || this.result?.attackerId,
      targetId: fallback.targetId || this.result?.targetId,
      actionType: fallback.actionType || "ULTIMATE_ACTION"
    });

    this.sequenceId = "ultimate-action:" + normalized.attackerId + ":" + normalized.targetId + ":" + normalized.result;
    this.sequenceKind = "ULTIMATE_ACTION";
    this.activeStepDefinitions = ULTIMATE_ACTION_STEP_DEFINITIONS;
    this.result = normalized;
    this.commands = buildCommands(this.sequenceId, normalized, this.activeStepDefinitions, this.stage);
    this.stepIndex = 0;
    this.stepElapsedMs = 0;
    this.phase = ULTIMATE_ACTION_STEP_DEFINITIONS[0].phase;
    this.active = true;
    this._emitStep("CONTINUE");
    return this.getState();
  }

  startFromCombatResult(result, fallback = {}) {
    const normalized = normalizePresentationInput(result, fallback);
    this.sequenceId = "combat-presentation:" + normalized.attackerId + ":" + normalized.targetId + ":" + normalized.result;
    this.sequenceKind = "NORMAL_ACTION";
    this.activeStepDefinitions = this.stepDefinitions;
    this.result = normalized;
    this.commands = buildCommands(this.sequenceId, normalized, this.activeStepDefinitions, this.stage);
    this.stepIndex = 0;
    this.stepElapsedMs = 0;
    this.phase = this.activeStepDefinitions[0].phase;
    this.active = true;
    this._emitStep("START");
    return this.getState();
  }

  update(deltaSeconds = 0) {
    if (!this.active) return this.getState();

    let remainingMs = clamp(Number(deltaSeconds) || 0, 0, 0.5) * 1000;
    while (this.active && remainingMs > 0) {
      const step = this.activeStepDefinitions[this.stepIndex];
      const stepDuration = Math.max(1, Number(step.durationMs) || 1);
      const availableMs = Math.max(0, stepDuration - this.stepElapsedMs);

      if (remainingMs < availableMs) {
        this.stepElapsedMs += remainingMs;
        remainingMs = 0;
        break;
      }

      remainingMs -= availableMs;
      this.stepElapsedMs = stepDuration;
      if (this.stepIndex >= this.activeStepDefinitions.length - 1) {
        this.active = false;
        this.phase = this.sequenceKind === "ULTIMATE_STAGING"
          ? COMBAT_ULTIMATE_PHASE.COMPLETE
          : COMBAT_PRESENTATION_PHASE.COMPLETE;
        this.stepIndex = this.activeStepDefinitions.length;
        this.stepElapsedMs = 0;
        this._emitStep("COMPLETE");
        break;
      }

      this.stepIndex += 1;
      this.stepElapsedMs = 0;
      this.phase = this.activeStepDefinitions[this.stepIndex].phase;
      this._emitStep("ENTER");
    }

    return this.getState();
  }

  cancel() {
    if (!this.active) return this.getState();

    const returnPhase = this.sequenceKind.startsWith("ULTIMATE")
      ? COMBAT_ULTIMATE_PHASE.RETURN
      : COMBAT_PRESENTATION_PHASE.RETURN;
    const returnIndex = Math.max(0, this.activeStepDefinitions.findIndex(
      (step) => step.phase === returnPhase
    ));
    this.stepIndex = returnIndex;
    this.stepElapsedMs = 0;
    this.phase = this.activeStepDefinitions[returnIndex].phase;
    this.active = true;
    this._emitStep("CANCEL_FALLBACK");
    return this.getState();
  }

  isActive() {
    return this.active;
  }

  getCurrentStep() {
    if (!this.active || this.stepIndex < 0 || this.stepIndex >= this.activeStepDefinitions.length) {
      return null;
    }
    return this.activeStepDefinitions[this.stepIndex];
  }

  getCommands() {
    return this.commands;
  }

  getCameraTransform({ width = 1, height = 1 } = {}) {
    const safeWidth = Math.max(1, Number(width) || 1);
    const safeHeight = Math.max(1, Number(height) || 1);
    const step = this.getCurrentStep();

    if (!step) {
      return Object.freeze({
        phase: this.phase,
        focusTarget: "COMBAT",
        zoom: 1,
        x: 0,
        y: 0,
        progress: 1,
        easing: "linear"
      });
    }

    const durationMs = Math.max(1, Number(step.durationMs) || 1);
    const progress = clamp(this.stepElapsedMs / durationMs, 0, 1);
    const currentStepIndex = this.stepIndex;
    const previous = currentStepIndex > 0
      ? this.activeStepDefinitions[currentStepIndex - 1]
      : Object.freeze({ zoom: 1, panX: 0, panY: 0 });

    if (this.stage?.getCameraAnchor) {
      const resolveStageAnchor = (stageStep, fallbackName) => {
        const anchorName = stageStep?.cameraAnchor || fallbackName;
        const focusActorId = stageStep?.focusActor === "TARGET"
          ? this.result?.targetId
          : stageStep?.focusActor === "ATTACKER"
            ? this.result?.attackerId
            : null;
        return this.stage.getCameraAnchor(anchorName, { actorId: focusActorId });
      };
      const currentAnchor = resolveStageAnchor(step, step.cameraAnchor || step.focusTarget);
      const previousAnchor = currentStepIndex > 0
        ? resolveStageAnchor(previous, previous.cameraAnchor || previous.focusTarget)
        : this.stage.getCameraAnchor("FORMATION");
      const fromX = (0.5 - Number(previousAnchor.x || 0.5)) * safeWidth;
      const fromY = (0.5 - Number(previousAnchor.y || 0.5)) * safeHeight;
      const toX = (0.5 - Number(currentAnchor.x || 0.5)) * safeWidth;
      const toY = (0.5 - Number(currentAnchor.y || 0.5)) * safeHeight;
      return Object.freeze({
        phase: step.phase,
        focusTarget: step.focusTarget,
        focusActorId: step.focusActor === "TARGET"
          ? this.result?.targetId || null
          : step.focusActor === "ATTACKER"
            ? this.result?.attackerId || null
            : null,
        cameraAnchor: step.cameraAnchor || step.focusTarget,
        cameraSource: currentAnchor.source || "STAGE",
        shot: currentAnchor.shot || "GENERAL",
        angle: currentAnchor.angle || "EYE_LEVEL",
        zoom: interpolate(Number(previousAnchor.zoom || 1), Number(currentAnchor.zoom || 1), progress, step.easing),
        x: interpolate(fromX, toX, progress, step.easing),
        y: interpolate(fromY, toY, progress, step.easing),
        rotationDeg: interpolate(Number(previousAnchor.rotationDeg || 0), Number(currentAnchor.rotationDeg || 0), progress, step.easing),
        progress,
        easing: step.easing
      });
    }
    return Object.freeze({
      phase: step.phase,
      focusTarget: step.focusTarget,
      cameraAnchor: step.cameraAnchor || step.focusTarget,
      zoom: interpolate(previous.zoom, step.zoom, progress, step.easing),
      x: interpolate(previous.panX, step.panX, progress, step.easing) * safeWidth,
      y: interpolate(previous.panY, step.panY, progress, step.easing) * safeHeight,
      rotationDeg: 0,
      progress,
      easing: step.easing
    });
  }

  applyCamera(ctx, width, height) {
    if (!ctx || !this.active) return false;

    const transform = this.getCameraTransform({ width, height });
    ctx.translate(width * 0.5 + transform.x, height * 0.5 + transform.y);
    if (Number(transform.rotationDeg)) ctx.rotate((Number(transform.rotationDeg) * Math.PI) / 180);
    ctx.scale(transform.zoom, transform.zoom);
    ctx.translate(-width * 0.5, -height * 0.5);
    return true;
  }

  getState() {
    const step = this.getCurrentStep();
    const durationMs = Math.max(1, Number(step?.durationMs) || 1);
    const progress = step
      ? clamp(this.stepElapsedMs / durationMs, 0, 1)
      : 1;
    return Object.freeze({
      sequenceId: this.sequenceId,
      sequenceKind: this.sequenceKind,
      phase: this.phase,
      stepIndex: this.stepIndex,
      stepElapsedMs: this.stepElapsedMs,
      progress,
      active: this.active,
      result: this.result,
      commandCount: this.commands.length,
      deterministic: true
    });
  }

  _emitStep(reason) {
    this.onStep?.(Object.freeze({
      sequenceId: this.sequenceId,
      sequenceKind: this.sequenceKind,
      phase: this.phase,
      stepIndex: this.stepIndex,
      reason,
      result: this.result,
      hooks: Object.freeze({
        camera: true,
        audio: ["ATTACKER_FOCUS", "ATTACK", "IMPACT", "REACTION", "RETURN"],
        vfx: ["ATTACKER_FOCUS", "ATTACK", "IMPACT", "REACTION", "RETURN"],
        haptics: ["IMPACT", "REACTION"]
      })
    }));
  }
}

export const COMBAT_PRESENTATION_PHASES = PHASES;
export const COMBAT_ULTIMATE_ACTION_STEP_DEFINITIONS = ULTIMATE_ACTION_STEP_DEFINITIONS;
export const COMBAT_ULTIMATE_STEP_DEFINITIONS = ULTIMATE_STEP_DEFINITIONS;
export const COMBAT_PRESENTATION_STEP_DEFINITIONS = STEP_DEFINITIONS;
