import { isCombatInitDTO, isTurnResultDTO } from "./api.js";
import { resolveClimaxTurn, resolveTacticalTurn } from "./combat_core.js";
import { AreaThemeManager } from "./area_theme_manager.js";
import { CombatStage, createCombatStageActors, renderCombatStageForeground, renderCombatStageWorld } from "./combat_stage.js";
import { BatterRenderer } from "./batter_renderer.js";
import { CombatEffects } from "./combat_effects.js";
import { CombatPresentationDirector } from "./combat_presentation_director.js";
import { CombatHUD } from "./combat_hud.js";
import { KytosCombatPresentation } from "./kytos_combat_presentation.js";
import { PerformanceAdapter } from "./performance_adapter.js";
import { AssetLoader, isHttpsUrl } from "./asset_loader.js";
import { getWaifuAssets, getWaifu } from "./waifu_database.js";
import {
  classifyTimingDelta,
  timingRingRadius,
  TIMING_RING_DURATION_MS,
  TIMING_RING_TARGET_MS,
  TIMING_RING_TARGET_RADIUS
} from "./timing_ring.js";

const RESULT_COLORS = {
  STRIKE: "#8ca8ff",
  FOUL: "#d6b3ff",
  OUT: "#ff7894",
  SINGLE: "#65d8ff",
  DOUBLE: "#64e1b2",
  TRIPLE: "#ffcd66",
  HOME_RUN: "#ff8b5c",
  FIELDING_ERROR: "#ff6e8e"
};

const TIMING_COLORS = {
  PERFECT: "#ffdf7e",
  GREAT: "#8ef0cc",
  GOOD: "#7ed1ff",
  NORMAL: "#b8bed0",
  BAD: "#ff889e"
};

const MAX_DPR = 2.5;

const SCRAP_REWARDS = Object.freeze({
  HOME_RUN: 100, SINGLE: 10, DOUBLE: 10, TRIPLE: 10, HIT: 10, OUT: 0, FOUL: 0
});

export function getScrapRewardForResult(result) {
  return Number(SCRAP_REWARDS[String(result || "").toUpperCase()]) || 0;
}
function cloneDTO(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizePoint(point, fallback) {
  if (!point || typeof point !== "object") {
    return fallback;
  }

  return {
    x: safeNumber(point.x, fallback.x),
    y: safeNumber(point.y, fallback.y)
  };
}

function resultLabel(result) {
  return String(result || "RESULT").replace(/_/g, " ");
}

function assetUrl(path) {
  return new URL(path, window.location.href).toString();
}

function descriptorPath(descriptor, kind = "") {
  if (!descriptor || typeof descriptor !== "object") {
    return "";
  }

  if (kind === "card" && descriptor.card_hd_url) {
    return String(descriptor.card_hd_url);
  }

  if (kind === "sprite" && descriptor.sprite_url) {
    return String(descriptor.sprite_url);
  }

  if (descriptor.path) {
    const path = String(descriptor.path);
    if (path.includes("/assets/production/") && /\\.svg$/i.test(path)) {
      return "";
    }
    return path;
  }

  return "";
}

class AssetBank {
  constructor() {
    this.images = new Map();
    this.failed = new Set();
    this.assetLoader = new AssetLoader();
  }

  async preload(descriptors = []) {
    const unique = [];
    const seen = new Set();

    for (const descriptor of descriptors) {
      const kind = typeof descriptor === "string" ? "" : String(descriptor?.kind || "");
      const path = typeof descriptor === "string" ? descriptor : descriptorPath(descriptor, kind);
      if (!path || seen.has(path)) {
        continue;
      }

      seen.add(path);
      unique.push(path);
    }

    await Promise.all(unique.map((path) => this.load(path)));
  }

  async load(path) {
    if (this.images.has(path) || this.failed.has(path)) {
      return this.images.get(path) || null;
    }

    try {
      if (isHttpsUrl(path)) {
        const remote = await this.assetLoader.load(path, {
          label: "WAIFU",
          archetype: "DEFAULT"
        });
        this.images.set(path, remote.image);
        return remote.image;
      }

      const image = new Image();
      image.decoding = "async";
      image.src = assetUrl(path);

      if (typeof image.decode === "function") {
        await image.decode();
      } else {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
      }

      this.images.set(path, image);
      return image;
    } catch {
      this.failed.add(path);
      return null;
    }
  }

  get(path) {
    return this.images.get(path) || null;
  }
}

export class CombatRenderer {
  constructor(canvas, {
    cutInRoot = document.querySelector("#cutin"),
    manifestUrl = null,
    onState = null,
    audioBridge = null,
    onScrapEarned = null,
    hapticsBridge = null,
    getHudResources = null,
    performanceAdapter = null,
    onTimingResult = null,
    onTacticalTurn = null,
    onClimaxStart = null,
    onLocalCombatResult = null,
    getEconomyBoosts = null,
    presentationDirector = null,
    onPresentationStep = null
  } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("CombatRenderer requires a canvas element");
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });

    if (!this.ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }

    this.cutinRoot = cutInRoot || null;
    this.cutinEyebrow = document.querySelector("#cutin-eyebrow");
    this.cutinTitle = document.querySelector("#cutin-title");
    this.cutinDetail = document.querySelector("#cutin-detail");
    this.cutinPortrait = document.querySelector("#cutin-portrait");
    this.eyeFocusOverlay = document.querySelector("#eye-focus-overlay");
    this.eyeFocusImage = document.querySelector("#eye-focus-image");
    this.activeWaifuCard = document.querySelector("#active-waifu-card");
    this.timingFeedback = document.querySelector("#timing-feedback");
    this.combatShell = canvas.closest(".combat-shell, .game-viewport");

    this.assetBank = new AssetBank();
    this.manifestUrl = manifestUrl;
    this.onState = onState;
    this.audioBridge = audioBridge;
    this.onScrapEarned = onScrapEarned;
    this.hapticsBridge = hapticsBridge || null;
    this.performanceAdapter = performanceAdapter || new PerformanceAdapter();
    this.onTimingResult = typeof onTimingResult === "function" ? onTimingResult : null;
    this.onTacticalTurn = typeof onTacticalTurn === "function" ? onTacticalTurn : null;
    this.onClimaxStart = typeof onClimaxStart === "function" ? onClimaxStart : null;
    this.onLocalCombatResult = typeof onLocalCombatResult === "function" ? onLocalCombatResult : null;
    this.getEconomyBoosts = typeof getEconomyBoosts === "function" ? getEconomyBoosts : () => ({ scrapMultiplier: 1, timingGraceMs: 0 });
    this.onPresentationStep = typeof onPresentationStep === "function" ? onPresentationStep : null;
    this.onEconomyTimingConsumed = null;
    this.onEconomyRewardConsumed = null;
    this.themeManager = new AreaThemeManager("cyberpunk");
    this.combatStage = new CombatStage();
    this.batterRenderer = new BatterRenderer({
      imageResolver: (path) => this.assetBank.get(path),
      getSpritePath: (batter) => this._spritePathForCharacter(batter)
    });
    this.combatEffects = new CombatEffects();
    this.combatPresentation = presentationDirector || new CombatPresentationDirector({
      stage: this.combatStage,
      onStep: (event) => {
        this._handleCombatPresentationStep(event);
        this.onPresentationStep?.(event);
      }
    });
    this.combatPresentation.setStage?.(this.combatStage);
    this.combatHud = new CombatHUD({ getResources: getHudResources });
    this.kytosPresentation = new KytosCombatPresentation();
    this.kytosPresentationState = null;

    this.state = null;
    this.lastTurn = null;
    this.matchReady = false;
    this.frameHandle = 0;
    this.cutInStartedAt = 0;
    this.cutInDurationMs = 880;
    this.resultPulse = 0;
    this.impactTimer = 0;
    this.impactKind = "";
    this.cameraShakeTimer = 0;
    this.cameraShakeDuration = 0.15;
    this.impactParticles = [];
    this.maxImpactParticles = this.performanceAdapter.getParticleBudget(28);
    this.scrapTurnIds = new Set();
    this.zanTimer = 0;
    this.zanDuration = 0.34;
    this.timingState = null;
    this.timingTimeout = 0;
    this.battlePhase = "TACTICAL";
    this.tacticalTurn = 0;
    this.tacticalMaxTurns = 5;
    this.bossMaxHp = 100;
    this.bossHp = 100;
    this.bossConcentration = 100;
    this.internalEnergy = 0;
    this.tacticalEffectiveness = 0;
    this.round = 1;
    this.lastTacticalEvent = null;
    this.lastTiming = null;
    this.eyeFocusUntil = 0;
    this.eyeFocusToken = 0;
    this.staticCanvas = document.createElement("canvas");
    this.staticCtx = this.staticCanvas.getContext("2d", { alpha: false });
    this.frameCanvas = document.createElement("canvas");
    this.frameCtx = this.frameCanvas.getContext("2d", { alpha: false });
    this.lastFrame = performance.now();

    this.handleViewportResize = () => this.resize();
    this.handleTimingPointer = (event) => {
      if (!this.timingState?.active) return;
      event.preventDefault();
      this.resolveTimingInput("pointer");
    };

    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(this.handleViewportResize)
      : null;

    if (this.resizeObserver) {
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    }

    window.addEventListener("resize", this.handleViewportResize, { passive: true });
    this.canvas.addEventListener("pointerdown", this.handleTimingPointer, { passive: false });
    window.visualViewport?.addEventListener("resize", this.handleViewportResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", this.handleViewportResize, { passive: true });

    this.resize();
    this.frameHandle = requestAnimationFrame((time) => this.frame(time));
  }

  setHapticsBridge(hapticsBridge) {
    this.hapticsBridge = hapticsBridge || null;
  }

  setPerformanceAdapter(performanceAdapter) {
    this.performanceAdapter = performanceAdapter || new PerformanceAdapter();
    this.maxImpactParticles = this.performanceAdapter.getParticleBudget(28);
    return this.performanceAdapter;
  }

  async setArea(areaId) {
    const theme = this.themeManager.setArea(areaId);
    await this.themeManager.preloadTheme(theme);
    this.audioBridge?.setBiome?.(String(areaId || "cyberpunk"));
    this._renderStaticLayer();
    return theme;
  }

  getAreaTheme() {
    return this.themeManager.getCurrentTheme();
  }

  beginBatterWindup() {
    return this.batterRenderer.beginWindup();
  }

  isTimingWindowActive() {
    return Boolean(this.timingState?.active);
  }

  beginTimingWindow() {
    if (!this.matchReady || this.timingState?.active || this.battlePhase === "VICTORY") return false;

    if (this.battlePhase === "TACTICAL") {
      this._playTacticalTurn();
      return true;
    }

    const startedAt = performance.now();
    const advantage = clamp(this.tacticalEffectiveness / 100, 0, 1);
    this.batterRenderer.beginWindup();
    this.timingState = {
      active: true,
      startedAt,
      targetMs: TIMING_RING_TARGET_MS,
      durationMs: TIMING_RING_DURATION_MS,
      greatWindowMs: 55 + advantage * 35,
      hitWindowMs: 135 + advantage * 55,
      radiusScale: 1 + advantage * 0.42
    };
    this.onClimaxStart?.({
      round: this.round,
      tactical_turns: this.tacticalTurn,
      boss_hp: this.bossHp,
      boss_concentration: this.bossConcentration,
      effectiveness: this.tacticalEffectiveness
    });
    this.audioBridge?.playClimaxWarning?.();
    window.clearTimeout(this.timingTimeout);
    this.timingTimeout = window.setTimeout(() => {
      this.resolveTimingInput("timeout");
    }, TIMING_RING_DURATION_MS);
    return true;
  }

  resolveTimingInput(source = "pointer") {
    if (!this.timingState?.active) return null;
    const current = this.timingState;
    const elapsedMs = performance.now() - current.startedAt;
    const rawDeltaMs = elapsedMs - current.targetMs;
    const timingGraceMs = Math.max(0, Number(this.getEconomyBoosts()?.timingGraceMs) || 0);
    const deltaMs = Math.sign(rawDeltaMs) * Math.max(0, Math.abs(rawDeltaMs) - timingGraceMs);
    const greatWindowMs = Number.isFinite(current.greatWindowMs) ? current.greatWindowMs : 55;
    const hitWindowMs = Number.isFinite(current.hitWindowMs) ? current.hitWindowMs : 135;
    const absoluteDelta = Math.abs(deltaMs);
    const grade = absoluteDelta <= greatWindowMs
      ? "GREAT"
      : absoluteDelta <= hitWindowMs
        ? "HIT"
        : "MISS";
    window.clearTimeout(this.timingTimeout);
    this.timingTimeout = 0;
    this.timingState = null;

    const timing = {
      grade,
      delta_ms: Math.round(deltaMs),
      elapsed_ms: Math.round(elapsedMs),
      target_ms: current.targetMs,
      great_window_ms: Math.round(current.greatWindowMs),
      hit_window_ms: Math.round(current.hitWindowMs),
      source,
      round: this.round,
      tactical_effectiveness: Math.round(this.tacticalEffectiveness),
      boss_hp_before: Math.round(this.bossHp)
    };

    this._resolveClimaxDamage(grade);

    this.lastTiming = timing;
    this.audioBridge?.playTimingResult?.(grade);
    this._activateEyeFocus(200);
    this._triggerTimingPreview(timing);
    this.onTimingResult?.(timing);
    this.onEconomyTimingConsumed?.();
    return timing;
  }

  _playTacticalTurn() {
    if (!this.matchReady || this.timingState?.active || this.battlePhase === "VICTORY") return null;
    if (this.tacticalTurn >= this.tacticalMaxTurns) {
      this.battlePhase = "CLIMAX";
      return this.beginTimingWindow();
    }

    const batter = this.state?.batter || {};
    const stats = batter.stats || batter.base_stats || {};
    const result = resolveTacticalTurn({
      turn: this.tacticalTurn + 1,
      power: stats.power ?? batter.power ?? 70,
      contact: stats.contact ?? batter.contact ?? 70,
      speed: stats.speed ?? batter.speed ?? 70,
      eye: stats.eye ?? batter.eye ?? 70,
      bossHp: this.bossHp,
      bossMaxHp: this.bossMaxHp,
      internalEnergy: this.internalEnergy,
      tacticalEffectiveness: this.tacticalEffectiveness,
      tacticalMaxTurns: this.tacticalMaxTurns
    });

    this.tacticalTurn = result.tactical_turn_after;
    this.bossHp = result.boss_hp_after;
    this.bossConcentration = result.boss_concentration_after;
    this.internalEnergy = result.energy_after;
    this.tacticalEffectiveness = result.effectiveness_after;
    this.lastTacticalEvent = result;
    this.combatPresentation.startFromCombatResult(result, {
      attackerId: this.state?.batter?.id,
      targetId: this.state?.pitcher?.id,
      actionType: "TACTICAL_HIT"
    });

    this.audioBridge?.playTacticalCard?.();
    this.audioBridge?.playTacticalCharge?.();
    this._applyWaifuFeedback("feedback-hit", "TACTICAL HIT");
    this.onTacticalTurn?.({
      ...result,
      boss_hp: this.bossHp,
      boss_concentration: this.bossConcentration,
      internal_energy: this.internalEnergy,
      effectiveness: this.tacticalEffectiveness
    });

    if (this.tacticalTurn >= this.tacticalMaxTurns) {
      this.battlePhase = "CLIMAX";
      window.clearTimeout(this.phaseTransitionTimeout);
      this.phaseTransitionTimeout = window.setTimeout(() => {
        this.phaseTransitionTimeout = 0;
        if (this.matchReady && this.battlePhase === "CLIMAX" && !this.timingState?.active) {
          this.beginTimingWindow();
        }
      }, 260);
    }
    return result;
  }

  _resolveClimaxDamage(grade) {
    const result = resolveClimaxTurn({
      grade,
      bossHp: this.bossHp,
      bossMaxHp: this.bossMaxHp,
      internalEnergy: this.internalEnergy,
      tacticalEffectiveness: this.tacticalEffectiveness,
      round: this.round
    });

    this.combatPresentation.startFromCombatResult(result, {
      attackerId: this.state?.batter?.id,
      targetId: this.state?.pitcher?.id,
      actionType: result.outcome || "CLIMAX_ACTION"
    });

    this.bossHp = result.boss_hp_after;
    this.bossConcentration = result.boss_concentration_after;
    this.impactTimer = result.outcome === "HOME_RUN" ? 0.42 : result.outcome === "HIT" ? 0.28 : 0.18;
    this.cameraShakeTimer = result.outcome === "HOME_RUN" ? 0.32 : result.outcome === "HIT" ? 0.18 : 0.12;
    this.impactKind = result.outcome === "HOME_RUN" ? "HOME_RUN" : result.outcome === "HIT" ? "HIT" : "STRIKE";

    if (result.damage > 0) {
      this._spawnImpactParticles(result.outcome === "HOME_RUN" ? 28 : 14);
      this._playAudio(result.outcome === "HOME_RUN" ? "result.home_run" : "result.hit");
    } else {
      this._playAudio("result.miss");
    }

    this.internalEnergy = result.energy_after;
    this.tacticalEffectiveness = result.effectiveness_after;
    if (result.victory) {
      this.battlePhase = "VICTORY";
      this.tacticalTurn = result.tactical_turn_after;
      this.onLocalCombatResult?.({
        type: "TurnResultDTO",
        match_id: String(this.state?.match_id || this.state?.matchId || "local-combat"),
        result: "VICTORY",
        match_end: true,
        state: {
          ...(this.state?.state || {}),
          match_complete: true
        },
        damage: result.damage,
        source: "combat-local-runtime"
      });
      this.onState?.(this.state);
      return result;
    }

    this.round = result.round_after;
    this.tacticalTurn = result.tactical_turn_after;
    this.battlePhase = result.phase;
    this.lastTacticalEvent = null;
    this.onState?.(this.state);
    return result;
  }

  getPresentationState() {
    return this.combatPresentation.getState();
  }

  continueUltimateCinematicAction(result = {}) {
    if (!this.matchReady || !this.state || !result || typeof result !== "object") return null;
    const attackerId = String(
      result.attackerId
      || result.attacker_id
      || this.combatStage.selectedActorId
      || this.state?.batter?.id
      || this.state?.batter?.character_id
      || ""
    );
    const targetId = String(
      result.targetId
      || result.target_id
      || this.state?.pitcher?.id
      || this.state?.pitcher?.character_id
      || ""
    );
    if (!attackerId || !targetId) return null;
    return this.combatPresentation.continueUltimateAction({
      ...result,
      attackerId,
      targetId,
      actionType: result.actionType || result.action_type || "ULTIMATE_ACTION"
    });
  }

  triggerUltimateCinematicStaging(characterId = null, targetId = null) {
    if (!this.matchReady || !this.state) return null;
    const attackerId = String(
      characterId
      || this.state?.batter?.id
      || this.state?.batter?.character_id
      || this.combatStage.selectedActorId
      || ""
    );
    const resolvedTargetId = String(
      targetId
      || this.state?.pitcher?.id
      || this.state?.pitcher?.character_id
      || ""
    );
    if (!attackerId || !resolvedTargetId) return null;

    return this.combatPresentation.startUltimateStaging({
      attackerId,
      targetId: resolvedTargetId
    });
  }

  getBattleLoopState() {
    return {
      phase: this.battlePhase,
      round: this.round,
      tactical_turn: this.tacticalTurn,
      tactical_max_turns: this.tacticalMaxTurns,
      boss_hp: this.bossHp,
      boss_max_hp: this.bossMaxHp,
      boss_concentration: this.bossConcentration,
      internal_energy: this.internalEnergy,
      tactical_effectiveness: this.tacticalEffectiveness,
      last_tactical_event: this.lastTacticalEvent,
      last_timing: this.lastTiming
    };
  }

  _activateEyeFocus(durationMs = 200) {
    this.eyeFocusUntil = performance.now() + durationMs;
    this.eyeFocusToken += 1;
    const token = this.eyeFocusToken;
    const avatar = document.querySelector("#waifu-avatar-img");
    if (avatar?.src && this.eyeFocusImage) this.eyeFocusImage.src = avatar.src;
    this.eyeFocusOverlay?.classList.add("is-active");
    window.setTimeout(() => {
      if (token === this.eyeFocusToken) this.eyeFocusOverlay?.classList.remove("is-active");
    }, durationMs);
  }

  async _awaitEyeFocus() {
    const remaining = this.eyeFocusUntil - performance.now();
    if (remaining <= 0) {
      this.eyeFocusOverlay?.classList.remove("is-active");
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
    this.eyeFocusOverlay?.classList.remove("is-active");
  }

  _triggerTimingPreview(timing) {
    const grade = String(timing?.grade || "MISS").toUpperCase();
    const feedback = grade === "GREAT"
      ? { label: "GREAT • HOME RUN", className: "feedback-home-run", haptic: "home_run" }
      : grade === "HIT"
        ? { label: "HIT", className: "feedback-hit", haptic: "good" }
        : { label: "MISS • STRIKE", className: "feedback-miss", haptic: "miss" };

    this._applyWaifuFeedback(feedback.className, feedback.label);
    this._playHaptics(feedback.haptic);
  }

  _applyWaifuFeedback(className, label = "") {
    if (this.activeWaifuCard) {
      this.activeWaifuCard.classList.remove("feedback-miss", "feedback-hit", "feedback-home-run");
      if (className) {
        void this.activeWaifuCard.offsetWidth;
        this.activeWaifuCard.classList.add(className);
        window.setTimeout(() => this.activeWaifuCard?.classList.remove(className), 900);
      }
    }
    if (this.timingFeedback) {
      const cinematicActive = Boolean(this.combatPresentation?.getState?.().active);
      this.timingFeedback.textContent = label;
      this.timingFeedback.classList.remove("is-visible");
      void this.timingFeedback.offsetWidth;
      if (label && !cinematicActive) this.timingFeedback.classList.add("is-visible");
      window.setTimeout(() => this.timingFeedback?.classList.remove("is-visible"), 900);
    }
  }

  beginBatterSwing() {
    return this.batterRenderer.beginSwing();
  }

  showHudBanner(title, detail = "", options = {}) {
    this.combatHud.showBanner(title, detail, options);
  }

  _spritePathForCharacter(character) {
    const id = String(character?.card_id || character?.id || "");
    const descriptor = (this.state?.assets?.sprites || []).find((item) => item?.id === id);
    return descriptorPath(descriptor, "sprite") || String(character?.sprite_url || "");
  }

  setKytosPresentationState(state = null) {
    this.kytosPresentationState = state ? state : null;
    return this.kytosPresentationState;
  }

  clearKytosPresentationState() {
    this.kytosPresentationState = null;
  }

  getKytosPresentationState() {
    return this.kytosPresentationState;
  }

  beginBatterWindup() {
    return this.batterRenderer.beginWindup();
  }

  beginBatterSwing() {
    return this.batterRenderer.beginSwing();
  }

  triggerCombatEffect(quality, options = {}) {
    this.combatEffects.trigger(quality, options);
  }

  setAudioBridge(audioBridge) {
    this.audioBridge = audioBridge || null;
  }

  async refreshWaifuAssets(characterId) {
    const id = String(characterId || "");
    if (!id || !this.state) return false;

    const assets = getWaifuAssets(id);
    const configured = getWaifu(id);
    const currentBatterId = String(
      this.state.batter?.id
      || this.state.batter?.character_id
      || this.state.batter?.card_id
      || ""
    );

    if (currentBatterId === id) {
      this.state = {
        ...this.state,
        batter: {
          ...(this.state.batter || {}),
          sprite_url: assets.spriteSheetUrl,
          card_hd_url: assets.cardArtUrl,
          stats: configured?.stats ? { ...configured.stats } : this.state.batter?.stats,
          archetype: configured?.archetype || this.state.batter?.archetype,
          quote_super: configured?.quote_super || this.state.batter?.quote_super,
          quote_idle: configured?.quote_idle || this.state.batter?.quote_idle,
          quote_victory: configured?.quote_victory || this.state.batter?.quote_victory,
          jiggle_intensity: configured?.jiggle_intensity ?? this.state.batter?.jiggle_intensity
        }
      };
      this.batterRenderer.setBatter(this.state.batter);
    }

    const cardAsset = {
      id,
      card_hd_url: assets.cardArtUrl,
      path: assets.cardArtUrl
    };
    const spriteAsset = {
      id,
      sprite_url: assets.spriteSheetUrl,
      path: assets.spriteSheetUrl
    };

    this.state = {
      ...this.state,
      assets: {
        ...(this.state.assets || {}),
        cards: [
          ...((this.state.assets?.cards || []).filter((asset) => asset?.id !== id)),
          cardAsset
        ],
        sprites: [
          ...((this.state.assets?.sprites || []).filter((asset) => asset?.id !== id)),
          spriteAsset
        ]
      }
    };

    await this.assetBank.preload([{
      ...cardAsset,
      kind: "card"
    }, {
      ...spriteAsset,
      kind: "sprite"
    }]);

    this._renderStaticLayer();
    this.onState?.(this.state);
    return true;
  }

  async triggerSuperSwingDemo(character = null) {
    const source = character || {};
    const id = String(source.id || source.character_id || "");
    const name = String(source.name || source.canonical?.display_name || id || "WAIFU");
    const configured = getWaifu(id);
    const archetype = String(
      source.archetype
      || source.canonical?.archetype
      || configured?.archetype
      || "POWER"
    ).toUpperCase();
    const assets = getWaifuAssets(id || source);
    const loaded = await this.assetBank.load(assets.cutinArtUrl);

    const activated = this.combatHud.triggerSuperSwing({
      name: configured?.name || name,
      archetype,
      quote_super: configured?.quote_super || source.quote_super || "¡SUPER SWING TEST!",
      skill_name: source.skill_name || "ADMIN TEST"
    }, loaded);

    if (activated) {
      this._playAudio("result.perfect");
      this._playHaptics("perfect_timing");
    }

    return activated;
  }

  async showGachaCutIn({ rarity, character } = {}) {
    const id = String(character?.character_id || "");
    const name = String(character?.canonical?.display_name || id || "UNKNOWN");
    const remoteAssets = getWaifuAssets(character);
    const cardPath = String(
      remoteAssets.cardArtUrl
      || character?.canonical?.visual?.card_hd_url
      || `./assets/production/cards/${id}--normal.jpg`
    );

    if (!this.cutinRoot || !id) {
      return false;
    }

    await this.assetBank.preload([{
      id,
      kind: "card",
      card_hd_url: cardPath,
      path: cardPath
    }]);

    this._triggerCutIn({
      result: String(rarity || "SSR") === "UR" ? "UR_REVEAL" : "SSR_REVEAL",
      timing: "",
      assets: {
        cards: [{
          id,
          card_hd_url: cardPath,
          path: cardPath
        }]
      },
      animation: {
        event: "CUT_IN",
        eyebrow: "WAIFU ACQUIRED",
        detail: `${rarity || "SSR"} • ${name}`,
        cut_in_card_id: id,
        cut_in_card_hd_url: cardPath,
        camera_shake: true
      }
    });

    return true;
  }

  _playHaptics(event) {
    if (!this.hapticsBridge || typeof this.hapticsBridge.handleGameEvent !== "function") return false;
    return Boolean(this.hapticsBridge.handleGameEvent(event));
  }

  _playAudio(soundId, options = {}) {
    if (!this.audioBridge || typeof this.audioBridge.play !== "function") {
      return false;
    }
    return Boolean(this.audioBridge.play(soundId, options));
  }

  async initialize() {
    if (!this.manifestUrl) return;
    try {
      const response = await fetch(this.manifestUrl, { cache: "no-cache" });
      if (!response.ok) {
        return;
      }

      const manifest = await response.json();
      await this.preloadManifest(manifest);
    } catch {
      // DTO-provided assets remain a valid source when no manifest is present.
    }
  }

  async preloadManifest(manifest) {
    const descriptors = [];

    for (const descriptor of manifest?.sprites || []) {
      const path = descriptorPath(descriptor, "sprite");
      if (path) {
        descriptors.push({ ...descriptor, path, kind: "sprite" });
      }
    }

    for (const descriptor of manifest?.cards || []) {
      const path = descriptorPath(descriptor, "card");
      if (path) {
        descriptors.push({ ...descriptor, path, kind: "card" });
      }
    }

    await this.assetBank.preload(descriptors);
  }

  async setCombatInit(dto) {
    if (!isCombatInitDTO(dto)) {
      throw new TypeError("Invalid CombatInitDTO");
    }

    this.state = cloneDTO(dto);
    this._syncCombatStageActors();
    await this.setArea(
      dto.area_id
      || dto.area?.id
      || dto.theme_id
      || dto.theme?.id
      || "cyberpunk"
    );
    this.lastTurn = null;
    this.matchReady = true;
    this.resultPulse = 0;
    this.timingState = null;
    this.battlePhase = "TACTICAL";
    this.tacticalTurn = 0;
    this.bossMaxHp = 100;
    this.bossHp = 100;
    this.bossConcentration = 100;
    this.internalEnergy = 0;
    this.tacticalEffectiveness = 0;
    this.round = 1;
    this.lastTacticalEvent = null;

    await this.assetBank.preload([
      ...(dto.assets?.sprites || []).map((asset) => ({ ...asset, kind: "sprite" })),
      ...(dto.assets?.cards || []).map((asset) => ({ ...asset, kind: "card" }))
    ]);

    this.batterRenderer.setBatter(dto.batter);
    this.onState?.(this.state);
  }

  async applyTurnResult(dto) {
    if (!isTurnResultDTO(dto)) {
      throw new TypeError("Invalid TurnResultDTO");
    }

    if (!this.matchReady || !this.state) {
      throw new Error("Combat renderer is not initialized");
    }

    await this._awaitEyeFocus();
    this.lastTurn = cloneDTO(dto);
    const areaId = dto.area_id || dto.area?.id || dto.theme_id || dto.theme?.id || dto.state?.area_id;
    if (areaId) {
      await this.setArea(areaId);
    }
    this.state = {
      ...this.state,
      state: cloneDTO(dto.state),
      home_team: dto.home_team || this.state.home_team,
      away_team: dto.away_team || this.state.away_team,
      ...(areaId ? { area_id: areaId } : {})
    };
    this._syncCombatStageActors();

    this.combatPresentation.startFromCombatResult(dto, {
      attackerId: this.state?.batter?.id,
      targetId: this.state?.pitcher?.id,
      actionType: dto?.event || dto?.action || dto?.animation?.event || "COMBAT_ACTION"
    });

    this._awardScrap(dto);

    await this.assetBank.preload([
      ...(dto.assets?.sprites || []).map((asset) => ({ ...asset, kind: "sprite" })),
      ...(dto.assets?.cards || []).map((asset) => ({ ...asset, kind: "card" }))
    ]);

    this.batterRenderer.setBatter(this.state.batter);
    this._triggerSuperSwingCutIn(dto);
    const turnEvent = String(
      dto?.event
      || dto?.animation?.event
      || dto?.action
      || ""
    ).toUpperCase();
    if (turnEvent === "PITCH" || turnEvent === "PITCHER_THROW" || turnEvent === "THROW") {
      this.batterRenderer.beginWindup();
    }

    this._triggerCutIn(dto);
    this._triggerVisualImpact(dto);
    this.resultPulse = 1;
    this.onState?.(this.state);
  }

  resize() {
    const container = this.canvas.parentElement || this.canvas;
    const rect = container.getBoundingClientRect();

    const viewport = window.visualViewport;
    const viewportWidth = safeNumber(viewport?.width, window.innerWidth);
    const viewportHeight = safeNumber(viewport?.height, window.innerHeight);

    const cssWidth = Math.max(1, safeNumber(rect.width, viewportWidth));
    const cssHeight = Math.max(1, safeNumber(rect.height, viewportHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    this.canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.staticCanvas.width = Math.max(1, Math.round(cssWidth * dpr));
    this.staticCanvas.height = Math.max(1, Math.round(cssHeight * dpr));
    this.frameCanvas.width = this.staticCanvas.width;
    this.frameCanvas.height = this.staticCanvas.height;

    this.staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.frameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.pixelWidth = cssWidth;
    this.pixelHeight = cssHeight;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this._renderStaticLayer();
  }

  dispose() {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.handleViewportResize);
    this.canvas.removeEventListener("pointerdown", this.handleTimingPointer);
    window.visualViewport?.removeEventListener("resize", this.handleViewportResize);
    window.visualViewport?.removeEventListener("scroll", this.handleViewportResize);
    window.clearTimeout(this.timingTimeout);
    window.clearTimeout(this.phaseTransitionTimeout);
    this.staticCanvas.width = 1;
    this.staticCanvas.height = 1;
    this.frameCanvas.width = 1;
    this.frameCanvas.height = 1;
  }

  frame(time) {
    const delta = clamp((time - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = time;

    this._update(delta);
    if (this.performanceAdapter.shouldRender(time)) {
      this._render(time);
    }

    this.frameHandle = requestAnimationFrame((next) => this.frame(next));
  }

  _update(delta) {
    this.combatHud.update(delta);

    if (this.timingState?.active && performance.now() - this.timingState.startedAt >= this.timingState.durationMs) {
      this.resolveTimingInput("timeout");
    }

    if (this.combatHud.isTimeFrozen()) {
      this.impactTimer = Math.max(0, this.impactTimer - delta);
      this.cameraShakeTimer = Math.max(0, this.cameraShakeTimer - delta);
      return;
    }

    this.batterRenderer.update(delta);
    this.combatPresentation.update(delta);
    this._syncCinematicOverlayState();
    this._syncCombatStageDataset();
    this.canvas.dataset.combatPresentationPhase = this.combatPresentation.getState().phase;
    this.canvas.dataset.combatPresentationActive = String(this.combatPresentation.isActive());
    this.combatEffects.update(
      delta,
      this.batterRenderer.lastBatPose
    );
    this.resultPulse = Math.max(0, this.resultPulse - delta * 2.1);
    this.impactTimer = Math.max(0, this.impactTimer - delta);
    this.cameraShakeTimer = Math.max(0, this.cameraShakeTimer - delta);
    this.zanTimer = Math.max(0, this.zanTimer - delta);

    for (const particle of this.impactParticles) {
      particle.age += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += particle.gravity * delta;
    }
    this.impactParticles = this.impactParticles.filter(
      (particle) => particle.age < particle.life
    );

    if (this.impactTimer === 0 && this.combatShell) {
      this.combatShell.classList.remove("is-glitching", "impact-hit", "impact-run", "impact-danger", "impact-super");
    }

    if (this.cutinRoot?.classList.contains("visible")) {
      const age = performance.now() - this.cutInStartedAt;
      if (age >= this.cutInDurationMs) {
        this.cutinRoot.classList.remove("visible");
      }
    }
  }

  _renderStaticLayer() {
    if (!this.staticCtx || !this.pixelWidth || !this.pixelHeight) {
      return;
    }

    const ctx = this.staticCtx;
    const w = this.pixelWidth;
    const h = this.pixelHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this._drawBackground(ctx, w, h);
    this._drawStadium(ctx, w, h);
    if (!this.matchReady || !this.state) {
      this._drawIdleGrid(ctx, w, h);
    }
    ctx.restore();
  }

  _render(time) {
    const w = this.pixelWidth;
    const h = this.pixelHeight;
    const target = this.impactTimer > 0 && this.frameCtx ? this.frameCtx : this.ctx;

    target.save();
    target.clearRect(0, 0, w, h);

    const legacyShake = this.combatEffects.shakeTimer > 0
      ? 0
      : (this.cameraShakeTimer > 0
        ? clamp(this.cameraShakeTimer / this.cameraShakeDuration, 0, 1)
        : 0);
    const effectShake = this.combatEffects.getCameraOffset();
    if (legacyShake > 0 || effectShake.x !== 0 || effectShake.y !== 0) {
      target.translate(
        (Math.random() * 6 - 3) * legacyShake + effectShake.x,
        (Math.random() * 6 - 3) * legacyShake + effectShake.y
      );
    }

    if (target === this.ctx) {
      this.ctx.drawImage(this.staticCanvas, 0, 0, w, h);
    } else {
      target.drawImage(this.staticCanvas, 0, 0, w, h);
      target.filter = "contrast(1.10) saturate(1.16)";
    }

    if (this.impactParticles.length > 0) {
      this._drawNeonParticles(target);
    }

    if (this.matchReady && this.state) {
      this._syncCinematicOverlayState();
      target.save();
      this.combatPresentation.applyCamera(target, w, h);
      this._drawMatchState(target, w, h);
      target.restore();
      const presentation = this.combatPresentation.getState();
      if (!(presentation.active && String(presentation.sequenceKind || "").startsWith("ULTIMATE"))) {
        this._drawBattleLoopHud(target, w, h);
      }
    }

    if (this.kytosPresentationState) {
      this.kytosPresentation.render(target, w, h, this.kytosPresentationState, { time });
      this.batterRenderer.draw(target, w, h, {
        accentColor: this.themeManager.getStrikeZoneColor(),
        scale: 0.86,
        anchorX: w * 0.5,
        anchorY: h * 0.78
      });
    }

    this._drawTimingRing(target, w, h, time);
    this.combatEffects.renderBatTrail(target);
    this.combatEffects.renderFlash(target, w, h);

    if (this.resultPulse > 0 && this.lastTurn) {
      this._drawResultPulse(target, w, h);
    }

    if (this.zanTimer > 0) {
      this._drawZanSlash(target, w, h);
    }

    const presentation = this.combatPresentation.getState();
    const ultimateActive = presentation.active && String(presentation.sequenceKind || "").startsWith("ULTIMATE");
    if (!ultimateActive) {
      this.combatHud.render(target, w, h, this.state, this.lastTurn);
    }
    this.canvas.dataset.combatStageUltimateHudSuppressed = String(ultimateActive);

    target.restore();

    if (target !== this.ctx) {
      this._presentImpactFrame(w, h);
    }
  }

  _presentImpactFrame(w, h) {
    const ctx = this.ctx;
    const split = clamp(this.impactTimer / 0.24, 0, 1);
    const offset = 1.5 + split * 1.5;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.staticCanvas, 0, 0, w, h);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.filter = "contrast(1.10) saturate(1.16)";
    ctx.drawImage(this.frameCanvas, 0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.24 * split;
    ctx.filter = "hue-rotate(300deg) saturate(4.2) contrast(1.14)";
    ctx.drawImage(this.frameCanvas, offset, 0, w, h);

    ctx.globalAlpha = 0.22 * split;
    ctx.filter = "hue-rotate(168deg) saturate(4.0) contrast(1.12)";
    ctx.drawImage(this.frameCanvas, -offset, 0, w, h);

    ctx.restore();
  }

  _syncCinematicOverlayState() {
    const presentation = this.combatPresentation?.getState?.() || {};
    const active = Boolean(presentation.active);
    const ultimateActive = active && String(presentation.sequenceKind || "").startsWith("ULTIMATE");
    const card = this.activeWaifuCard || document.querySelector("#active-waifu-card");
    const feedback = this.timingFeedback || document.querySelector("#timing-feedback");
    const root = document.querySelector("#app-container");

    if (card) {
      card.classList.toggle("is-cinematic-action", active);
      if (!active) card.removeAttribute("aria-hidden");
      else card.setAttribute("aria-hidden", "true");
    }
    feedback?.classList.toggle("is-cinematic-action", active);
    root?.classList.toggle("is-cinematic-ultimate", ultimateActive);
  }

  _handleCombatPresentationStep(event) {
    const phase = String(event?.phase || "").toUpperCase();
    const result = event?.result || {};

    if (phase === "ULTIMATE_TRIGGER" || phase === "ULTIMATE_STAGING") {
      this._syncCinematicOverlayState();
      this.batterRenderer.setState?.("IDLE");
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_CHARACTER_FOCUS") {
      this._syncCinematicOverlayState();
      this.batterRenderer.beginWindup();
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_ACTION_PREP") {
      this.batterRenderer.setState?.("WINDUP");
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_ACTION") {
      this.batterRenderer.beginSwing();
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_IMPACT") {
      const combatResult = String(result.result || "HIT").toUpperCase();
      this.combatEffects.trigger(combatResult, { result: combatResult });
      this._spawnImpactParticles(combatResult === "HOME_RUN" ? 28 : 16);
      this.impactTimer = Math.max(this.impactTimer, combatResult === "HOME_RUN" ? 0.42 : 0.2);
      this.cameraShakeTimer = Math.max(this.cameraShakeTimer, combatResult === "HOME_RUN" ? 0.28 : 0.14);
      this.impactKind = combatResult;
      this.canvas.dataset.combatStageUltimateImpact = "true";
      return;
    }
    if (phase === "ULTIMATE_REACTION") {
      this.canvas.dataset.combatStageUltimateImpact = "false";
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_RETURN") {
      this._syncCinematicOverlayState();
      this.batterRenderer.setState?.("IDLE");
      this.canvas.dataset.combatStageUltimateActive = "true";
      return;
    }
    if (phase === "ULTIMATE_COMPLETE") {
      this.batterRenderer.setState?.("IDLE");
      this.canvas.dataset.combatStageUltimateActive = "false";
      this.canvas.dataset.combatStageUltimateImpact = "false";
      this.canvas.dataset.combatStageUltimateActionComplete = "true";
      return;
    }

    const normalPhase = phase;
    if (normalPhase === "ATTACKER_FOCUS") {
      this.canvas.dataset.combatStageActionComplete = "false";
      this._syncCinematicOverlayState();
      this.timingFeedback?.classList.remove("is-visible");
      this.batterRenderer.beginWindup();
      return;
    }
    if (normalPhase === "ACTION") {
      this.batterRenderer.beginSwing();
      return;
    }
    if (normalPhase === "IMPACT") {
      this.combatEffects.trigger(result.result || "HIT", { result: result.result || "HIT" });
      this.impactTimer = Math.max(this.impactTimer, 0.16);
      return;
    }
    if (normalPhase === "COMBAT_RETURN") {
      this._syncCinematicOverlayState();
      this.timingFeedback?.classList.remove("is-visible");
      this.canvas.dataset.combatStageActionComplete = "true";
    }
  }

  _drawBackground(ctx, w, h) {
    this.themeManager.renderBackground(ctx, w, h, 0);
  }

  _drawStadium(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "rgba(4, 8, 20, 0.62)";
    ctx.fillRect(0, h * 0.3, w, h * 0.04);
    ctx.restore();
  }

  _drawIdleGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, 1);
    ctx.fillRect(w * 0.5, h * 0.25, 1, h * 0.58);
    ctx.restore();
  }

  _drawMatchState(ctx, w, h) {
    const camera = this.combatPresentation.getCameraTransform({ width: w, height: h });
    const groundColor = this.themeManager.getCurrentTheme()?.groundColor || "#10162a";
    const ultimateActive = String(this.combatPresentation.getState().sequenceKind || "").startsWith("ULTIMATE");
    renderCombatStageWorld(ctx, this.combatStage, w, h, {
      cameraTransform: camera,
      groundColor,
      showZones: false,
      showSetPieceLabels: !ultimateActive
    });

    for (const actor of this.combatStage.getSortedActors()) {
      const transform = this.combatStage.resolveActorTransform(actor.actorId, { width: w, height: h });
      if (transform) this._drawCombatStageActor(ctx, actor, transform, w, h);
    }

    this._drawCombatStageProjectile(ctx, w, h);
    renderCombatStageForeground(ctx, this.combatStage, w, h, camera);

    this._syncCombatStageDataset();
  }

  _drawCombatStageActor(ctx, actor, transform, w, h) {
    const color = actor.team === "ENEMY" ? "#ff007f" : "#00f3ff";
    const presentation = this.combatPresentation.getState();
    const motion = this.combatStage.resolveCinematicActorFrame(actor.actorId, {
      phase: presentation.phase,
      progress: presentation.progress,
      width: w,
      height: h
    }) || transform;

    if (actor.actorId === this.combatStage.selectedActorId) {
      this.batterRenderer.draw(ctx, w, h, {
        accentColor: color,
        scale: clamp(motion.scale * 0.82, 0.62, 0.98),
        anchorX: motion.x - w * 0.08,
        anchorY: motion.y
      });
      this._drawCombatActorRing(ctx, motion.x, motion.y + 8, 42 * motion.scale, color, true);
      return;
    }

    if (actor.team === "ENEMY") {
      this._drawCombatEnemyActor(ctx, actor, transform, w, h, motion);
      return;
    }

    this._drawCombatSupportActor(ctx, actor, motion, color);
  }

  _drawCombatSupportActor(ctx, actor, transform, color) {
    const radius = 28 * transform.scale;
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.globalAlpha = clamp(Number(transform.opacity ?? 1), 0, 1);
    ctx.fillStyle = "rgba(4, 8, 20, 0.82)";
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.72, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= 0.9;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.76;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.64, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.48)";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, radius * 0.12);
    ctx.lineTo(radius * 0.5, radius * 0.12);
    ctx.stroke();
    const cinematicUltimate = String(this.combatPresentation.getState().sequenceKind || "").startsWith("ULTIMATE");
    if (!cinematicUltimate) {
      ctx.textAlign = "center";
      ctx.font = "800 8px Rajdhani, system-ui, sans-serif";
      ctx.fillStyle = "#ccefff";
      ctx.globalAlpha = 0.78;
      ctx.fillText("FIXTURE", 0, radius * 1.34);
    }
    ctx.restore();
  }

  _drawCombatEnemyActor(ctx, actor, transform, w, h, motion = null) {
    const presentation = this.combatPresentation.getState();
    const frame = motion || transform;
    const radius = 42 * frame.scale;
    const t = presentation.progress || 0;
    const pulse = ["IMPACT", "ULTIMATE_IMPACT"].includes(presentation.phase)
      ? Math.sin(t * Math.PI)
      : ["TARGET_REACTION", "ULTIMATE_REACTION"].includes(presentation.phase)
        ? Math.sin(t * Math.PI)
        : 0;
    const x = frame.x;
    const y = frame.y;
    const rotation = (frame.rotationDeg ?? frame.rotation ?? 0) * Math.PI / 180;

    const sprite = this._combatSpriteForActor(actor.actorId);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = clamp(Number(frame.opacity ?? 1), 0, 1);
    ctx.scale(1 + pulse * 0.055, 1 - pulse * 0.035);

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(0, transform.elevation * h * 0.07 + radius * 1.03, radius * 0.7, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite) {
      const targetHeight = clamp(h * 0.34 * transform.scale, 170, 340);
      const ratio = sprite.naturalWidth > 0 ? sprite.naturalHeight / sprite.naturalWidth : 1.45;
      const targetWidth = targetHeight / ratio;
      ctx.save();
      ctx.scale(actor.facing < 0 ? -1 : 1, 1);
      ctx.globalAlpha = 0.98;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 14;
      ctx.drawImage(sprite, -targetWidth * 0.5, -targetHeight * 0.86, targetWidth, targetHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(34, 3, 24, 0.9)";
      ctx.beginPath();
      ctx.ellipse(0, 2, radius * 0.8, radius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff007f";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#ff007f";
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff8ab8";
      ctx.beginPath();
      ctx.arc(0, -radius * 0.64, radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    if (
      ["IMPACT", "ULTIMATE_IMPACT"].includes(presentation.phase)
      || ["TARGET_REACTION", "ULTIMATE_REACTION"].includes(presentation.phase)
    ) {
      const reactionPulse = ["IMPACT", "ULTIMATE_IMPACT"].includes(presentation.phase)
        ? 1 - (presentation.progress || 0)
        : 0.4;
      ctx.strokeStyle = "rgba(255,223,126," + clamp(reactionPulse, 0, 1) + ")";
      ctx.lineWidth = 4 + reactionPulse * 2;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius * (1.08 + reactionPulse * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }

    const cinematicUltimate = String(this.combatPresentation.getState().sequenceKind || "").startsWith("ULTIMATE");
    if (!cinematicUltimate) {
      ctx.textAlign = "center";
      ctx.font = "900 9px Orbitron, system-ui, sans-serif";
      ctx.fillStyle = "#ffd6e8";
      ctx.fillText(String(actor.visual?.name || "ENEMY"), 0, radius * 1.42);
      ctx.font = "700 7px Rajdhani, system-ui, sans-serif";
      ctx.fillStyle = "#ff8ab8";
      ctx.fillText("ENEMY ACTOR", 0, radius * 1.58);
    }
    ctx.restore();
  }

  _combatSpriteForActor(actorId) {
    const id = String(actorId || "");
    const descriptor = (this.state?.assets?.sprites || []).find((asset) => String(asset?.id || "") === id);
    const path = descriptorPath(descriptor, "sprite");
    return path ? this.assetBank.get(path) : null;
  }

  _drawCombatStageProjectile(ctx, w, h) {
    const state = this.combatPresentation.getState();
    if (!["ACTION", "IMPACT", "ULTIMATE_ACTION", "ULTIMATE_IMPACT"].includes(state.phase)) return;
    const attackerId = state.result?.attackerId || this.combatStage.selectedActorId;
    const targetId = state.result?.targetId;
    if (!attackerId || !targetId) return;

    const camera = this.combatPresentation.getCameraTransform({ width: w, height: h });
    const projectile = this.combatStage.resolveCinematicProjectile(attackerId, targetId, {
      phase: state.phase,
      progress: camera.progress,
      width: w,
      height: h
    });
    if (!projectile) return;

    const x = projectile.position.x * w;
    const y = projectile.position.y * h;
    const trail = 26 + 44 * (1 - projectile.travelProgress);

    ctx.save();
    ctx.strokeStyle = "rgba(255,223,126,0.64)";
    ctx.lineWidth = 5 + (1 - projectile.travelProgress) * 2;
    ctx.beginPath();
    ctx.moveTo(
      x - trail * (this.combatStage.getActor(attackerId)?.facing || 1),
      y + trail * 0.14
    );
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = "#fff5c7";
    ctx.shadowColor = "#ffdf7e";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, 8 + (1 - projectile.travelProgress) * 2, 0, Math.PI * 2);
    ctx.fill();

    if (state.phase === "IMPACT") {
      const impact = clamp(1 - (state.stepElapsedMs || 0) / 150, 0, 1);
      ctx.globalAlpha = impact;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        const inner = 14 + (1 - impact) * 8;
        const outer = 42 + (1 - impact) * 26;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawCombatActorRing(ctx, x, y, radius, color, selected = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = selected ? 0.76 : 0.4;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _syncCombatStageActors() {
    if (!this.combatStage) return;
    const batter = this.state?.batter || {};
    const enemy = this.state?.pitcher || {};
    this.combatStage.setActors(createCombatStageActors({ batter, enemy }));
    const selectedId = String(
      batter?.id || batter?.character_id || batter?.card_id
      || this.combatStage.getActors({ team: "PLAYER" })[0]?.actorId || ""
    );
    this.combatStage.setSelectedActor(selectedId);
    this._syncCombatStageDataset();
  }

  _syncCombatStageDataset() {
    if (!this.canvas || !this.combatStage) return;
    const stageState = this.combatStage.getState();
    const camera = this.combatPresentation.getCameraTransform({
      width: this.pixelWidth,
      height: this.pixelHeight
    });
    this.canvas.dataset.combatStageContract = stageState.contract;
    this.canvas.dataset.combatStageActorCount = String(stageState.actorCount);
    this.canvas.dataset.combatStagePlayerCount = String(stageState.playerCount);
    this.canvas.dataset.combatStageEnemyCount = String(stageState.enemyCount);
    this.canvas.dataset.combatStageDepthModel = stageState.depthModel.join(",");
    this.canvas.dataset.combatStageActorDepths = stageState.actorDepths.join(",");
    this.canvas.dataset.combatStageActorElevations = stageState.actorElevations.join(",");
    this.canvas.dataset.combatStageSetPieces = stageState.setPieces.map((piece) => piece.id).join(",");
    this.canvas.dataset.combatStageLayers = stageState.layers.map((layer) => layer.id).join(",");
    this.canvas.dataset.combatStageZones = Object.keys(stageState.zones).join(",");
    this.canvas.dataset.combatStageSelectedActor = stageState.selectedActorId;
    this.canvas.dataset.combatStageFilmable = String(stageState.filmable);
    this.canvas.dataset.combatStageActionContract = String(stageState.actionContract || "");
    this.canvas.dataset.combatStageActionPhases = (stageState.actionPhases || []).join(",");
    this.canvas.dataset.combatStageUltimateContract = String(stageState.ultimateContract || "");
    this.canvas.dataset.combatStageUltimatePhases = (stageState.ultimatePhases || []).join(",");
    const ultimateState = this.combatPresentation.getState();
    const ultimatePhase = String(ultimateState.phase || "");
    const ultimateFrames = [
      "ULTIMATE_STAGING",
      "ULTIMATE_CHARACTER_FOCUS",
      "ULTIMATE_ACTION_PREP",
      "ULTIMATE_ACTION",
      "ULTIMATE_IMPACT",
      "ULTIMATE_REACTION",
      "ULTIMATE_RETURN"
    ].includes(ultimatePhase)
      ? this.combatStage.getSortedActors().map((actor) => this.combatStage.resolveCinematicActorFrame(actor.actorId, {
        phase: ultimatePhase,
        progress: ultimateState.progress,
        width: this.pixelWidth,
        height: this.pixelHeight
      }))
      : [];
    const ultimateHeroFrame = ultimateFrames.find((frame) => frame?.actorId === stageState.selectedActorId);
    const ultimateSupportOpacities = ultimateFrames
      .filter((frame) => frame?.actorId !== stageState.selectedActorId)
      .filter((frame) => {
        const actor = this.combatStage.getActor(frame.actorId);
        return actor?.team === "PLAYER";
      })
      .map((frame) => Number(frame.opacity ?? 1));
    this.canvas.dataset.combatStageUltimateActive = String(
      ultimateState.sequenceKind.startsWith("ULTIMATE") && ultimateState.active === true
    );
    this.canvas.dataset.combatStageUltimateSequenceKind = String(ultimateState.sequenceKind || "");
    this.canvas.dataset.combatStageUltimatePhase = ultimatePhase;
    this.canvas.dataset.combatStageUltimateHeroScale = ultimateHeroFrame
      ? Number(ultimateHeroFrame.scale).toFixed(3)
      : "";
    this.canvas.dataset.combatStageUltimateSupportOpacity = ultimateSupportOpacities.length
      ? String(Math.min(...ultimateSupportOpacities).toFixed(3))
      : "";
    this.canvas.dataset.combatStageUltimateTeamStaged = String(
      ultimatePhase.startsWith("ULTIMATE_") && ultimateSupportOpacities.some((value) => value < 0.99)
    );
    this.canvas.dataset.combatStagePresentationPhase = String(this.combatPresentation.getState().phase || "");
    this.canvas.dataset.combatStageCharacterState = String(this.batterRenderer.getState() || "");
    this.canvas.dataset.combatStageCharacterMotion = String(
      this.batterRenderer.getCharacterMotion?.(this.pixelWidth, this.pixelHeight)?.rotationDeg || 0
    );
    const presentationState = this.combatPresentation.getState();
    const cinematicProjectile = [
      "ACTION",
      "IMPACT",
      "ULTIMATE_ACTION",
      "ULTIMATE_IMPACT"
    ].includes(presentationState.phase)
      ? this.combatStage.resolveCinematicProjectile(
        presentationState.result?.attackerId || stageState.selectedActorId,
        presentationState.result?.targetId || "",
        {
          phase: presentationState.phase,
          progress: presentationState.progress,
          width: this.pixelWidth,
          height: this.pixelHeight
        }
      )
      : null;
    const batPose = this.batterRenderer.lastBatPose;
    const characterMotion = this.batterRenderer.getCharacterMotion?.(this.pixelWidth, this.pixelHeight);
    this.canvas.dataset.combatStageProjectileContract = cinematicProjectile?.sourceAnchor || "";
    this.canvas.dataset.combatStageProjectileTarget = cinematicProjectile?.targetAnchor || "";
    this.canvas.dataset.combatStageProjectileTravel = cinematicProjectile
      ? String(Number(cinematicProjectile.travelProgress).toFixed(3))
      : "";
    this.canvas.dataset.combatStageUltimateResult = String(presentationState.result?.result || "");
    this.canvas.dataset.combatStageUltimateDamage = String(presentationState.result?.damage ?? "");
    this.canvas.dataset.combatStageCharacterState = String(this.batterRenderer.getState() || "");
    this.canvas.dataset.combatStageCharacterMotion = String(
      Number(characterMotion?.rotationDeg || 0).toFixed(3)
    );
    this.canvas.dataset.combatStageBatPose = batPose
      ? [
        Number(batPose.x).toFixed(2),
        Number(batPose.y).toFixed(2),
        Number(batPose.rotation).toFixed(3)
      ].join(",")
      : "";
    this.canvas.dataset.combatStageProjectileVisible = String(
      ["ACTION", "IMPACT"].includes(this.combatPresentation.getState().phase)
      && Boolean(this.combatPresentation.getState().result?.attackerId)
      && Boolean(this.combatPresentation.getState().result?.targetId)
    );
    this.canvas.dataset.combatStageReactionActive = String(
      ["IMPACT", "TARGET_REACTION"].includes(this.combatPresentation.getState().phase)
    );
    this.canvas.dataset.combatPresentationCameraAnchor = camera.cameraAnchor || "";
    this.canvas.dataset.combatPresentationCameraSource = camera.cameraSource || "";
  }

  _drawPlayerMarker(ctx, player, x, y, color) {
    ctx.save();
    ctx.translate(x, y);

    const cardId = String(player?.card_id || player?.id || "");
    const descriptor = (this.state?.assets?.sprites || []).find((item) => item?.id === cardId);
    const path = descriptorPath(descriptor, "sprite") || String(player?.sprite_url || "");
    const image = this.assetBank.get(path);

    if (image) {
      const targetHeight = clamp(this.pixelHeight * 0.22, 86, 150);
      const ratio = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 1.5;
      const targetWidth = targetHeight / ratio;

      ctx.globalAlpha = 0.96;
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12;
      ctx.drawImage(image, -targetWidth * 0.5, -targetHeight * 0.92, targetWidth, targetHeight);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.ellipse(0, 5, Math.max(24, targetWidth * 0.18), 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(2, 6, 15, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 44, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 44, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawStrikeZone(ctx, w, h) {
    const color = this.themeManager.getStrikeZoneColor();
    const x = w * 0.35;
    const y = h * 0.39;
    const zoneWidth = w * 0.3;
    const zoneHeight = h * 0.22;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, zoneWidth, zoneHeight);

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, zoneWidth, zoneHeight);
    ctx.restore();
  }

  _drawBase(ctx, point, occupied) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = occupied ? "#ffcd66" : "#ece8dc";
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }

  _drawRunners(ctx, state, diamond) {
    const bases = [
      ["first", diamond.first],
      ["second", diamond.second],
      ["third", diamond.third]
    ];

    for (const [baseName, point] of bases) {
      if (!state.bases?.[baseName]) {
        continue;
      }

      const runner = this._runnerForBase(state, baseName);
      if (runner) {
        const cardId = String(runner.card_id || runner.id || "");
        const descriptor = (this.state?.assets?.sprites || []).find((item) => item?.id === cardId);
        const path = descriptorPath(descriptor, "sprite") || String(runner.sprite_url || "");
        const image = this.assetBank.get(path);

        if (image) {
          const targetHeight = clamp(this.pixelHeight * 0.12, 42, 84);
          const ratio = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 1.5;
          const targetWidth = targetHeight / ratio;

          ctx.save();
          ctx.globalAlpha = 0.98;
          ctx.shadowColor = "rgba(0,0,0,0.42)";
          ctx.shadowBlur = 8;
          ctx.drawImage(
            image,
            point.x - targetWidth * 0.5,
            point.y - targetHeight - 8,
            targetWidth,
            targetHeight
          );
          ctx.restore();
          continue;
        }
      }

      ctx.save();
      ctx.fillStyle = "#ffcd66";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y - 13, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _runnerForBase(state, baseName) {
    const runners = state.runners || state.base_runners || {};
    const runner = runners?.[baseName];
    if (runner && typeof runner === "object") {
      return runner;
    }
    return null;
  }

  _drawBattleLoopHud(ctx, w, h) {
    const loop = this.getBattleLoopState();
    if (!loop || !this.matchReady) return;

    const phaseLabel = loop.phase === "TACTICAL"
      ? `TACTICAL // CARTA ${loop.tactical_turn}/${loop.tactical_max_turns}`
      : loop.phase === "CLIMAX"
        ? "CLIMAX // META CELL RAY"
        : "VICTORY // RAY REFLECTED";

    const barX = w * 0.08;
    const barW = w * 0.84;
    const hpRatio = clamp(loop.boss_hp / loop.boss_max_hp, 0, 1);
    const energyRatio = clamp(loop.internal_energy / 100, 0, 1);

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 11px Orbitron, system-ui, sans-serif";
    ctx.fillStyle = loop.phase === "CLIMAX" ? "#ffdf00" : "#00f3ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(`ROUND ${loop.round} • ${phaseLabel}`, w / 2, h * 0.205);

    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    ctx.font = "800 8px Rajdhani, system-ui, sans-serif";
    ctx.fillStyle = "#b8bed0";
    ctx.fillText("META CELL CORE", barX, h * 0.225);

    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(barX, h * 0.232, barW, 6);
    ctx.fillStyle = "#ff007f";
    ctx.fillRect(barX, h * 0.232, barW * hpRatio, 6);

    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(barX, h * 0.247, barW, 4);
    ctx.fillStyle = "#00f3ff";
    ctx.fillRect(barX, h * 0.247, barW * energyRatio, 4);

    if (loop.last_tactical_event) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#8ef0cc";
      ctx.fillText(`MOBS ×${loop.last_tactical_event.mob_count} • ENERGY ${loop.internal_energy}%`, barX + barW, h * 0.225);
    }
    ctx.restore();
  }

  _drawTimingRing(ctx, w, h, time) {
    const timing = this.timingState;
    if (!timing?.active) return;

    const elapsedMs = performance.now() - timing.startedAt;
    const baseRadius = timingRingRadius(elapsedMs);
    const radiusScale = Number(timing.radiusScale) || 1;
    const radius = TIMING_RING_TARGET_RADIUS * radiusScale
      + (baseRadius - TIMING_RING_TARGET_RADIUS) * radiusScale;
    const cx = w * 0.5;
    const cy = h * 0.52;
    const targetRadius = TIMING_RING_TARGET_RADIUS;
    const progress = clamp(elapsedMs / timing.durationMs, 0, 1);
    const pulse = 0.72 + Math.sin(time * 0.012) * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00f3ff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = progress > 0.82 ? "#ffdf00" : "#ff007f";
    ctx.lineWidth = 5;
    ctx.shadowColor = progress > 0.82 ? "#ffdf00" : "#ff007f";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 13px Orbitron, system-ui, sans-serif";
    ctx.fillText("TAP", cx, cy);

    ctx.globalAlpha = 0.68;
    ctx.font = "800 9px Rajdhani, system-ui, sans-serif";
    ctx.fillStyle = "#9cefff";
    ctx.fillText("TIMING", cx, cy + targetRadius + 22);

    ctx.restore();
  }

  _drawResultPulse(ctx, w, h) {
    const result = String(this.lastTurn?.result || "");
    const color = RESULT_COLORS[result] || "#ffffff";
    const alpha = clamp(this.resultPulse, 0, 1) * 0.22;
    const fontSize = clamp(w * 0.07, 18, 52);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 12;
    ctx.fillText(resultLabel(result), w / 2, h * 0.78);
    ctx.restore();
  }

  _diamondPoints(w, h) {
    return {
      home: { x: w * 0.5, y: h * 0.76 },
      first: { x: w * 0.68, y: h * 0.5 },
      second: { x: w * 0.5, y: h * 0.28 },
      third: { x: w * 0.32, y: h * 0.5 }
    };
  }

  _startCameraShake(duration = this.cameraShakeDuration) {
    this.cameraShakeTimer = Math.max(
      this.cameraShakeTimer,
      clamp(Number(duration) || this.cameraShakeDuration, 0.05, 0.2)
    );
  }

  _spawnImpactParticles(result) {
    const normalizedResult = String(result || "").toUpperCase();
    const count = normalizedResult === "HOME_RUN"
      ? this.maxImpactParticles
      : Math.min(18, this.maxImpactParticles);
    const originX = this.pixelWidth * 0.5;
    const originY = this.pixelHeight * 0.48;
    const colors = normalizedResult === "HOME_RUN"
      ? ["#ff007f", "#ffdf00", "#00f3ff", "#ffffff"]
      : ["#00f0ff", "#ff2b1f", "#ff0055"];

    this.impactParticles = [];
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 180;
      this.impactParticles.push({
        x: originX + (Math.random() * 32 - 16),
        y: originY + (Math.random() * 24 - 12),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 24,
        gravity: 70 + Math.random() * 90,
        age: 0,
        life: 0.24 + Math.random() * 0.22,
        size: 1.5 + Math.random() * 2.5,
        color: colors[index % colors.length]
      });
    }
  }

  _drawNeonParticles(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const particle of this.impactParticles) {
      const remaining = clamp(1 - particle.age / particle.life, 0, 1);
      const tail = Math.max(
        5,
        Math.min(18, Math.abs(particle.vx) * 0.018 + Math.abs(particle.vy) * 0.012)
      );

      ctx.globalAlpha = remaining * 0.9;
      ctx.strokeStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 6;
      ctx.lineWidth = particle.size;

      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x - particle.vx * 0.018,
        particle.y - particle.vy * 0.018 + tail * 0.04
      );
      ctx.stroke();
    }

    ctx.restore();
  }


  _triggerZanSlash() {
    this.zanTimer = Math.max(this.zanTimer, this.zanDuration);
  }

  _drawZanSlash(ctx, w, h) {
    const strength = clamp(this.zanTimer / this.zanDuration, 0, 1);
    const fade = this.zanTimer < 0.11
      ? clamp(this.zanTimer / 0.11, 0, 1)
      : 1;

    ctx.save();
    ctx.translate(w * 0.5, h * 0.52);
    ctx.rotate(-Math.PI / 3);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = fade * 0.9;

    const slashLength = Math.hypot(w, h) * 1.25;
    const slashHeight = 5 + strength * 10;
    const gradient = ctx.createLinearGradient(-slashLength * 0.5, 0, slashLength * 0.5, 0);
    gradient.addColorStop(0, "rgba(0,240,255,0)");
    gradient.addColorStop(0.16, "rgba(0,240,255,0.65)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.98)");
    gradient.addColorStop(0.78, "rgba(255,0,85,0.7)");
    gradient.addColorStop(1, "rgba(255,0,85,0)");

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f0ff";
    ctx.fillStyle = gradient;
    ctx.fillRect(-slashLength * 0.5, -slashHeight * 0.5, slashLength, slashHeight);

    ctx.globalAlpha = fade * 0.96;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff0055";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 46px system-ui, sans-serif";
    ctx.fillText("ZAN!", 0, -20);
    ctx.restore();
  }


  _isSuperSwingEvent(dto) {
    const event = String(
      dto?.animation?.event
      || dto?.event
      || dto?.action
      || ""
    ).toUpperCase();

    return Boolean(
      dto?.super_swing === true
      || dto?.animation?.super_swing === true
      || event === "SUPER_SWING"
    );
  }

  _triggerSuperSwingCutIn(dto) {
    if (!this._isSuperSwingEvent(dto)) return false;

    const batter = dto?.animation?.super_swing_waifu
      || dto?.super_swing_waifu
      || dto?.batter
      || this.state?.batter
      || {};

    const id = String(batter.id || batter.card_id || batter.character_id || "");
    const descriptor = (this.state?.assets?.cards || []).find(
      (asset) => String(asset?.id || "") === id
    );
    const portraitPath = descriptorPath(descriptor, "card");
    const portrait = portraitPath ? this.assetBank.get(portraitPath) : null;

    const triggered = this.combatHud.triggerSuperSwing({
      id,
      name: batter.name || batter.display_name || "Unknown Waifu",
      archetype: batter.archetype || batter.super_archetype || "POWER",
      quote_super: batter.quote_super || batter.super_quote || "¡Siente todo mi poder!",
      skill_name: batter.skill_name || batter.super_skill_name || "SUPER SWING!"
    }, portrait);

    if (triggered) {
      this._playAudio("result.perfect");
      this._playHaptics("perfect");
    }

    return triggered;
  }

  _triggerAudioForTurn(dto) {
    const result = String(dto?.result || "").toUpperCase();
    const timing = String(dto?.timing || "").toUpperCase();
    const event = String(
      dto?.event
      || dto?.animation?.event
      || dto?.action
      || ""
    ).toUpperCase();
    const hitResults = ["SINGLE", "DOUBLE", "TRIPLE", "HIT", "FIELDING_ERROR"];

    if (event === "SWING") {
      this._playAudio("bat.swing");
      this._playHaptics("swing");
    }

    if (result === "FOUL" || (timing === "BAD" && !hitResults.includes(result))) {
      this._playAudio("bat.foul");
      this._playHaptics("combat_error");
      return;
    }

    if (result === "MISS") {
      this._playAudio("result.miss");
      this._playHaptics("miss");
      return;
    }

    if (result === "HOME_RUN") {
      this._playAudio("result.home_run");
      this._playHaptics("home_run");
      return;
    }

    if (hitResults.includes(result) || event === "HIT") {
      if (timing === "PERFECT") {
        this._playAudio("result.perfect");
        this._playHaptics("perfect");
      } else {
        this._playAudio("result.hit");
        this._playHaptics("good");
      }
    }
  }

  _triggerVisualImpact(dto) {
    const result = String(dto?.result || "").toUpperCase();
    const timing = String(dto?.timing || "").toUpperCase();
    const theme = this.themeManager.getCurrentTheme();
    const hitLike = new Set(["SINGLE", "DOUBLE", "TRIPLE", "HIT", "FIELDING_ERROR"]);
    const effectQuality = result === "HOME_RUN"
      ? "HOME_RUN"
      : timing === "PERFECT" && hitLike.has(result)
        ? "PERFECT"
        : timing === "GOOD" && hitLike.has(result)
          ? "GOOD"
          : result === "FOUL"
            ? "FOUL"
            : result === "MISS"
              ? "MISS"
              : hitLike.has(result)
                ? "HIT"
                : null;

    if (effectQuality) {
      this.combatEffects.trigger(effectQuality, {
        color: theme.strikeZoneColor,
        result
      });
    }
    const event = String(
      dto?.event
      || dto?.animation?.event
      || dto?.action
      || ""
    ).toUpperCase();
    const isSwingEvent = event === "SWING" || event === "HIT";
    const hitResults = new Set(["SINGLE", "DOUBLE", "TRIPLE", "FIELDING_ERROR", "HIT"]);
    const runResults = new Set(["RUN", "STEAL", "STEAL_BLOCKED", "SAFE", "HOME_RUN"]);
    const dangerResults = new Set(["OUT", "STRIKE", "FOUL", "FIELDING_ERROR"]);
    const timingBad = String(dto?.timing || "").toUpperCase() === "BAD";
    const superResults = new Set(["HOME_RUN", "TRIPLE"]);

    let kind = "hit";
    if (runResults.has(result)) {
      kind = "run";
    } else if (dangerResults.has(result)) {
      kind = "danger";
    }

    if (timingBad) {
      kind = "danger";
    }

    this.impactKind = kind;
    this.impactTimer = superResults.has(result)
      ? 0.42
      : (isSwingEvent || hitResults.has(result) || runResults.has(result) || dangerResults.has(result) ? 0.24 : 0);

    const criticalImpact = Boolean(
      dto?.critical === true
      || dto?.animation?.critical === true
      || result === "HOME_RUN"
    );
    const cutInImpact = dto?.animation?.event === "CUT_IN";
    const hasImpactPresentation = Boolean(
      dto?.animation?.camera_shake === true
      || cutInImpact
      || criticalImpact
      || timingBad
    );

    if (hasImpactPresentation) {
      this._startCameraShake();
    }

    if (criticalImpact || cutInImpact) {
      this._triggerZanSlash();
    }

    if (hitResults.has(result) || superResults.has(result) || isSwingEvent) {
      this._spawnImpactParticles(result || "HIT");
    }

    this._applyServerWaifuFeedback(result, timing);
    this._triggerAudioForTurn(dto);

    if (
      !this.combatShell
      || (!hitResults.has(result) && !runResults.has(result) && !dangerResults.has(result) && !timingBad)
    ) {
      return;
    }

    this.combatShell.classList.remove(
      "is-glitching",
      "impact-hit",
      "impact-run",
      "impact-danger",
      "impact-super"
    );

    void this.combatShell.offsetWidth;

    this.combatShell.classList.add("is-glitching", `impact-${kind}`);
    if (superResults.has(result)) {
      this.combatShell.classList.add("impact-super");
    }
  }

  _applyServerWaifuFeedback(result, timing) {
    const normalized = String(result || "").toUpperCase();
    if (normalized === "HOME_RUN") {
      this._applyWaifuFeedback("feedback-home-run", "HOME RUN!");
      return;
    }
    if (["SINGLE", "DOUBLE", "TRIPLE", "HIT", "FIELDING_ERROR"].includes(normalized)) {
      this._applyWaifuFeedback("feedback-hit", "HIT");
      return;
    }
    if (["MISS", "STRIKE", "OUT", "FOUL"].includes(normalized) || String(timing || "").toUpperCase() === "BAD") {
      this._applyWaifuFeedback("feedback-miss", "MISS");
    }
  }

  _awardScrap(dto) {
    const amount = getScrapRewardForResult(dto?.result);
    if (amount <= 0 || typeof this.onScrapEarned !== "function") return;
    const turnId = String(dto?.turn_id || "");
    if (turnId && this.scrapTurnIds.has(turnId)) return;
    if (turnId) {
      this.scrapTurnIds.add(turnId);
      if (this.scrapTurnIds.size > 128) {
        const oldest = this.scrapTurnIds.values().next().value;
        this.scrapTurnIds.delete(oldest);
      }
    }
    const multiplier = Math.max(1, Number(this.getEconomyBoosts()?.scrapMultiplier) || 1);
    this.onScrapEarned({ amount: amount * multiplier, base_amount: amount, multiplier, result: String(dto.result || ""), turn_id: turnId || null });
    this.onEconomyRewardConsumed?.();
  }

  _triggerCutIn(dto) {
    if (!this.cutinRoot) {
      return;
    }

    const activeBatter = this.state?.batter || {};
    const cardId = String(
      dto.animation?.cut_in_card_id
      || dto.batter?.card_id
      || activeBatter.card_id
      || dto.pitcher?.card_id
      || ""
    );

    const cardAssets = [
      ...(dto.assets?.cards || []),
      ...(this.state?.assets?.cards || [])
    ];
    const descriptor = cardAssets.find((item) => item?.id === cardId);
    const portraitPath = descriptorPath(descriptor, "card")
      || String(dto.animation?.cut_in_card_hd_url || dto.animation?.cut_in_card_path || "");
    const portrait = this.assetBank.get(portraitPath);

    this.cutinEyebrow.textContent = dto.animation?.eyebrow || "GAME EVENT";
    this.cutinTitle.textContent = resultLabel(dto.result);
    this.cutinDetail.textContent = [
      dto.timing || "",
      dto.animation?.detail || ""
    ].filter(Boolean).join(" • ");

    if (portrait) {
      this.cutinPortrait.src = portrait.src;
      this.cutinPortrait.alt = "";
      this.cutinPortrait.style.opacity = "1";
    } else {
      this.cutinPortrait.removeAttribute("src");
      this.cutinPortrait.style.opacity = "0";
    }

    if (dto.animation?.event === "CUT_IN" || dto.animation?.camera_shake === true) {
      this._startCameraShake();
    }

    this.cutinRoot.classList.remove("visible");
    void this.cutinRoot.offsetWidth;
    this.cutinRoot.classList.add("visible");

    this.cutInStartedAt = performance.now();

    const panel = this.cutinRoot.querySelector(".cutin-panel");
    if (panel) {
      panel.animate(
        [
          { opacity: 0, transform: "translateX(9%) skewX(-6deg)" },
          { opacity: 1, transform: "translateX(0) skewX(-6deg)" }
        ],
        {
          duration: 320,
          easing: "cubic-bezier(.18,.84,.32,1)",
          fill: "forwards"
        }
      );
    }

    if (this.cutinPortrait) {
      this.cutinPortrait.animate(
        [
          { opacity: 0, transform: "translateY(6%) scale(.97)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ],
        {
          duration: 420,
          easing: "cubic-bezier(.18,.84,.32,1)",
          fill: "forwards"
        }
      );
    }

    const detailColor = TIMING_COLORS[String(dto.timing || "")] || "#c9d1e1";
    this.cutinDetail.style.color = detailColor;
  }
}
