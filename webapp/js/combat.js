import { isCombatInitDTO, isTurnResultDTO } from "./api.js";
import { AreaThemeManager } from "./area_theme_manager.js";
import { BatterRenderer } from "./batter_renderer.js";
import { CombatEffects } from "./combat_effects.js";
import { CombatHUD } from "./combat_hud.js";

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
const DEFAULT_MANIFEST_URL = "./assets/production/manifest.json";

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
    manifestUrl = DEFAULT_MANIFEST_URL,
    onState = null,
    audioBridge = null,
    onScrapEarned = null,
    hapticsBridge = null,
    getHudResources = null
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
    this.combatShell = canvas.closest(".combat-shell");

    this.assetBank = new AssetBank();
    this.manifestUrl = manifestUrl;
    this.onState = onState;
    this.audioBridge = audioBridge;
    this.onScrapEarned = onScrapEarned;
    this.hapticsBridge = hapticsBridge || null;
    this.themeManager = new AreaThemeManager("cyberpunk");
    this.batterRenderer = new BatterRenderer({
      imageResolver: (path) => this.assetBank.get(path),
      getSpritePath: (batter) => this._spritePathForCharacter(batter)
    });
    this.combatEffects = new CombatEffects();
    this.combatHud = new CombatHUD({ getResources: getHudResources });

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
    this.maxImpactParticles = 28;
    this.scrapTurnIds = new Set();
    this.zanTimer = 0;
    this.zanDuration = 0.34;
    this.ballTrail = [];
    this.staticCanvas = document.createElement("canvas");
    this.staticCtx = this.staticCanvas.getContext("2d", { alpha: false });
    this.frameCanvas = document.createElement("canvas");
    this.frameCtx = this.frameCanvas.getContext("2d", { alpha: false });
    this.lastFrame = performance.now();

    this.handleViewportResize = () => this.resize();

    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(this.handleViewportResize)
      : null;

    if (this.resizeObserver) {
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    }

    window.addEventListener("resize", this.handleViewportResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.handleViewportResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", this.handleViewportResize, { passive: true });

    this.resize();
    this.frameHandle = requestAnimationFrame((time) => this.frame(time));
  }

  setHapticsBridge(hapticsBridge) {
    this.hapticsBridge = hapticsBridge || null;
  }

  async setArea(areaId) {
    const theme = this.themeManager.setArea(areaId);
    await this.themeManager.preloadTheme(theme);
    this._renderStaticLayer();
    return theme;
  }

  getAreaTheme() {
    return this.themeManager.getCurrentTheme();
  }

  beginBatterWindup() {
    return this.batterRenderer.beginWindup();
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

  setAudioBridge(audioBridge) {
    this.audioBridge = audioBridge || null;
  }

  async showGachaCutIn({ rarity, character } = {}) {
    const id = String(character?.character_id || "");
    const name = String(character?.canonical?.display_name || id || "UNKNOWN");
    const cardPath = String(
      character?.canonical?.visual?.card_hd_url
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
    this.ballTrail = [];

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

    this._awardScrap(dto);

    await this.assetBank.preload([
      ...(dto.assets?.sprites || []).map((asset) => ({ ...asset, kind: "sprite" })),
      ...(dto.assets?.cards || []).map((asset) => ({ ...asset, kind: "card" }))
    ]);

    this.batterRenderer.setBatter(this.state.batter);
    const turnEvent = String(
      dto?.event
      || dto?.animation?.event
      || dto?.action
      || ""
    ).toUpperCase();
    if (turnEvent === "PITCH" || turnEvent === "PITCHER_THROW" || turnEvent === "THROW") {
      this.batterRenderer.beginWindup();
    } else if (
      turnEvent === "SWING"
      || turnEvent === "HIT"
      || dto?.result
    ) {
      this.batterRenderer.beginSwing();
    }

    this._prepareBallTrail(dto);
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
    window.visualViewport?.removeEventListener("resize", this.handleViewportResize);
    window.visualViewport?.removeEventListener("scroll", this.handleViewportResize);
    this.staticCanvas.width = 1;
    this.staticCanvas.height = 1;
    this.frameCanvas.width = 1;
    this.frameCanvas.height = 1;
  }

  frame(time) {
    const delta = clamp((time - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = time;

    this._update(delta);
    this._render(time);

    this.frameHandle = requestAnimationFrame((next) => this.frame(next));
  }

  _update(delta) {
    this.batterRenderer.update(delta);
    this.combatEffects.update(
      delta,
      this.batterRenderer.lastBatPose
    );
    this.combatHud.update(delta);

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

    for (const point of this.ballTrail) {
      point.age += delta;
    }

    this.ballTrail = this.ballTrail.filter((point) => point.age < 0.72);

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

    const legacyShake = this.cameraShakeTimer > 0
      ? clamp(this.cameraShakeTimer / this.cameraShakeDuration, 0, 1)
      : 0;
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
      this._drawMatchState(target, w, h);
    }

    this.combatEffects.renderBatTrail(target);
    this.combatEffects.renderFlash(target, w, h);

    if (this.ballTrail.length > 0) {
      this._drawBallTrail(target, time);
    }

    if (this.resultPulse > 0 && this.lastTurn) {
      this._drawResultPulse(target, w, h);
    }

    if (this.zanTimer > 0) {
      this._drawZanSlash(target, w, h);
    }

    this.combatHud.render(target, w, h, this.state, this.lastTurn);

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

  _drawBackground(ctx, w, h) {
    this.themeManager.renderBackground(ctx, w, h, 0);
  }

  _drawStadium(ctx, w, h) {
    this.themeManager.renderGround(ctx, w, h, 0);
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#7f8db1";
    ctx.lineWidth = 1;

    const horizon = h * 0.34;

    for (let x = 0; x <= w; x += Math.max(48, w / 14)) {
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
    }

    for (let y = horizon; y <= h; y += Math.max(24, h / 12)) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

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
    const state = this.state.state || {};
    const diamond = this._diamondPoints(w, h);

    ctx.save();
    ctx.fillStyle = "#254f3f";
    ctx.globalAlpha = 0.96;
    ctx.beginPath();
    ctx.moveTo(diamond.home.x, diamond.home.y);
    ctx.lineTo(diamond.first.x, diamond.first.y);
    ctx.lineTo(diamond.second.x, diamond.second.y);
    ctx.lineTo(diamond.third.x, diamond.third.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(250, 248, 240, 0.88)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(diamond.home.x, diamond.home.y);
    ctx.lineTo(diamond.first.x, diamond.first.y);
    ctx.lineTo(diamond.second.x, diamond.second.y);
    ctx.lineTo(diamond.third.x, diamond.third.y);
    ctx.closePath();
    ctx.stroke();

    this._drawBase(ctx, diamond.home, false);
    this._drawBase(ctx, diamond.first, Boolean(state.bases?.first));
    this._drawBase(ctx, diamond.second, Boolean(state.bases?.second));
    this._drawBase(ctx, diamond.third, Boolean(state.bases?.third));

    const batter = this.state.batter || {};
    const pitcher = this.state.pitcher || {};

    const theme = this.themeManager.getCurrentTheme();
    this.batterRenderer.draw(ctx, w, h, {
      accentColor: theme.strikeZoneColor,
      scale: 1
    });
    this.themeManager.renderPitcher(
      ctx,
      w * 0.8,
      h * 0.26,
      clamp(w * 0.16, 64, 104),
      clamp(h * 0.22, 96, 138)
    );
    this._drawStrikeZone(ctx, w, h);

    ctx.font = "800 11px system-ui, sans-serif";
    ctx.fillStyle = "#dfe7f6";
    ctx.textAlign = "left";
    ctx.fillText(String(batter.name || "Batter"), w * 0.06, h * 0.92);

    ctx.textAlign = "right";
    ctx.fillText(String(pitcher.name || "Pitcher"), w * 0.94, h * 0.08);

    ctx.textAlign = "center";
    ctx.font = "900 12px system-ui, sans-serif";
    ctx.fillStyle = "#ffcd66";
    ctx.fillText("BASEBALL WAIFUS", w / 2, h * 0.1);

    const half = String(state.half || "TOP");
    const inning = safeNumber(state.inning, 0);
    ctx.fillStyle = "#8f9bb3";
    ctx.font = "700 10px system-ui, sans-serif";
    ctx.fillText(`INNING ${inning} • ${half}`, w / 2, h * 0.15);

    this._drawRunners(ctx, state, diamond);
    ctx.restore();
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

  _prepareBallTrail(dto) {
    const trajectory = dto.animation?.trajectory || {};
    const from = normalizePoint(trajectory.from, {
      x: this.pixelWidth * 0.2,
      y: this.pixelHeight * 0.72
    });
    const to = normalizePoint(trajectory.to, {
      x: this.pixelWidth * 0.8,
      y: this.pixelHeight * 0.26
    });
    const arc = safeNumber(trajectory.arc, -0.12);
    const segments = 14;

    this.ballTrail = [];

    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y
        + (to.y - from.y) * t
        + Math.sin(t * Math.PI) * this.pixelHeight * arc;

      this.ballTrail.push({
        x,
        y,
        age: i * 0.028
      });
    }
  }

  _drawBallTrail(ctx, time) {
    const visible = this.ballTrail.filter((point) => point.age < 0.62);

    for (const point of visible) {
      const alpha = clamp(1 - point.age / 0.72, 0, 1);

      ctx.save();
      ctx.globalAlpha = alpha * 0.52;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (visible.length === 0) {
      return;
    }

    const phase = (time / 1000) % 1;
    const current = visible[
      Math.min(visible.length - 1, Math.floor(phase * visible.length))
    ];

    if (current) {
      ctx.save();
      ctx.fillStyle = "#fff6d8";
      ctx.shadowColor = "#fff6d8";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(current.x, current.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
    const colors = ["#00f0ff", "#ff2b1f", "#ff0055"];

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
        color: this.themeManager.getParticleColor()
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

  _triggerAudioForTurn(dto) {
    const result = String(dto?.result || "").toUpperCase();
    const timing = String(dto?.timing || "").toUpperCase();

    if (result === "FOUL" || timing === "BAD") {
      this._playAudio("bat.foul");
      this._playHaptics("combat_error");
    }
    const event = String(
      dto?.event
      || dto?.animation?.event
      || dto?.action
      || ""
    ).toUpperCase();

    if (event === "SWING") {
      this._playAudio("bat.swing", {
        frequency: 150,
        waveform: "square",
        duration: 0.09
      });
      return;
    }

    if (result === "HOME_RUN") {
      this._playAudio("result.home_run", {
        frequency: 880,
        waveform: "sawtooth",
        duration: 0.15
      });
      this._playHaptics("home_run");
      return;
    }

    if (
      event === "HIT"
      || ["SINGLE", "DOUBLE", "TRIPLE", "HIT", "FIELDING_ERROR"].includes(result)
    ) {
      this._playAudio("result.hit", {
        frequency: 880,
        waveform: "sawtooth",
        duration: 0.12
      });
      this._playHaptics(result === "SINGLE" || result === "HIT" ? "single_hit" : "hit");
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
    this.onScrapEarned({ amount, result: String(dto.result || ""), turn_id: turnId || null });
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
