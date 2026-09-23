import { AssetLoader } from "./asset_loader.js";
import { getWaifuAssets, getArchetypeColor } from "./waifu_database.js";

const RARITY_PARTICLES = Object.freeze({
  N: "#aeb7c4",
  R: "#65d8ff",
  SR: "#b28cff",
  SSR: "#ff8b5c",
  UR: "#ffcd66"
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRarity(value) {
  return String(value || "R").toUpperCase();
}

function supportsCss3d() {
  if (typeof document === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }
  return CSS.supports("transform-style", "preserve-3d");
}

export class CardRenderer {
  constructor({
    root = null,
    canvasFallback = true,
    autoDeviceOrientation = true
  } = {}) {
    this.root = root;
    this.canvasFallback = canvasFallback;
    this.autoDeviceOrientation = autoDeviceOrientation;
    this.card = null;
    this.pointerTarget = null;
    this.lastTilt = { x: 0, y: 0 };
    this.orientationBound = false;
    this.supports3d = supportsCss3d();
    this.canvas = null;
    this.particleCanvas = null;
    this.particleContext = null;
    this.assetLoader = new AssetLoader();

    if (this.autoDeviceOrientation) this._bindOrientation();
  }

  mount(character, {
    assets = {},
    themeColor = null
  } = {}) {
    if (!this.root || typeof document === "undefined") {
      return null;
    }

    this.unmount();
    this.root.replaceChildren();

    const rarity = normalizeRarity(character?.canonical?.rarity);
    const accent = themeColor
      || character?.canonical?.visual?.accent
      || RARITY_PARTICLES[rarity]
      || "#00f0ff";

    const stage = document.createElement("div");
    stage.className = "card-stage";
    stage.dataset.rarity = rarity;

    const background = document.createElement("div");
    background.className = "card-layer card-layer-bg";
    background.style.setProperty("--card-accent", accent);

    const aura = document.createElement("div");
    aura.className = "card-layer card-layer-aura";
    aura.style.setProperty("--card-accent", accent);

    const art = document.createElement("img");
    art.className = "card-layer card-layer-art";
    art.alt = String(character?.canonical?.display_name || character?.character_id || "Waifu");
    art.draggable = false;
    art.crossOrigin = "anonymous";
    const remoteAssets = getWaifuAssets(character);
    const remoteCardUrl = remoteAssets.cardArtUrl;
    const fallbackColor = getArchetypeColor(character?.canonical?.archetype || character?.archetype || "DEFAULT");

    this.assetLoader.attach(
      art,
      remoteCardUrl,
      {
        label: character?.canonical?.display_name || character?.character_id || "WAIFU",
        archetype: character?.canonical?.archetype || character?.archetype || "DEFAULT",
        color: accent || fallbackColor,
        fallbackColor: "#0b0b14"
      }
    ).catch(() => {
      art.src = assets.card_hd_url
        || character?.canonical?.visual?.card_hd_url
        || "./assets/production/cards/" + String(character?.character_id || "") + "--normal.jpg";
    });

    const frame = document.createElement("div");
    frame.className = "card-layer card-layer-frame";
    frame.style.setProperty("--card-accent", accent);

    const badge = document.createElement("div");
    badge.className = "card-rarity-badge";
    badge.textContent = rarity;

    const title = document.createElement("div");
    title.className = "card-nameplate";
    title.textContent = String(character?.canonical?.display_name || character?.character_id || "UNKNOWN WAIFU");

    const stats = character?.canonical?.stats || {};
    const potential = Number(character?.canonical?.potential || 3);
    const statPanel = document.createElement("div");
    statPanel.className = "card-stat-panel";
    statPanel.innerHTML = [
      "<span>SWING <b>" + (Number(stats.power) || 0) + "</b></span>",
      "<span>TIMING <b>" + (Number(stats.timing_window) || 0.12).toFixed(2) + "</b></span>",
      "<span>SCRAP ×<b>" + (1 + Math.max(0, potential - 1) * 0.1).toFixed(2) + "</b></span>"
    ].join("");

    const particleField = document.createElement("div");
    particleField.className = "card-particles";
    for (let index = 0; index < 10; index += 1) {
      const particle = document.createElement("span");
      particle.style.setProperty("--particle-index", String(index));
      particleField.appendChild(particle);
    }

    stage.append(background, aura, particleField, art, frame, badge, title, statPanel);
    this.root.appendChild(stage);

    this.card = stage;
    this.pointerTarget = stage;

    if (!this.supports3d && this.canvasFallback) {
      this._mountCanvasFallback(stage, character, accent);
    }

    this._bindPointer(stage);
    this._applyTilt(0, 0);
    return stage;
  }

  unmount() {
    if (this.pointerTarget) {
      this.pointerTarget.onpointermove = null;
      this.pointerTarget.onpointerleave = null;
    }
    this.pointerTarget = null;
    this.card = null;
    this.root?.replaceChildren();
    this._destroyCanvasFallback();
  }

  _bindPointer(stage) {
    stage.onpointermove = (event) => {
      const rect = stage.getBoundingClientRect();
      const nx = rect.width ? ((event.clientX - rect.left) / rect.width - 0.5) * 2 : 0;
      const ny = rect.height ? ((event.clientY - rect.top) / rect.height - 0.5) * 2 : 0;
      this._applyTilt(-ny * 8, nx * 10);
    };

    stage.onpointerleave = () => this._applyTilt(0, 0);
  }

  _bindOrientation() {
    if (typeof window === "undefined" || this.orientationBound) return;
    this.orientationBound = true;

    window.addEventListener("deviceorientation", (event) => {
      if (!this.card) return;
      const x = clamp(Number(event.beta) || 0, -45, 45);
      const y = clamp(Number(event.gamma) || 0, -30, 30);
      this._applyTilt(x / 5, y / 4);
    });
  }

  _applyTilt(x, y) {
    this.lastTilt = { x, y };
    if (!this.card) return;

    this.card.style.setProperty("--tilt-x", x.toFixed(2) + "deg");
    this.card.style.setProperty("--tilt-y", y.toFixed(2) + "deg");
    this.card.style.transform = "perspective(900px) rotateX(" + x.toFixed(2) + "deg) rotateY(" + y.toFixed(2) + "deg)";
  }

  _mountCanvasFallback(stage, character, accent) {
    if (!this.canvasFallback) return;

    const canvas = document.createElement("canvas");
    canvas.className = "card-canvas-fallback";
    canvas.width = 720;
    canvas.height = 960;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#0b0b0f";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, "#06070c");
    context.globalAlpha = 0.25;
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;

    context.strokeStyle = accent;
    context.lineWidth = 10;
    context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "900 42px system-ui, sans-serif";
    context.fillText(String(character?.canonical?.display_name || "UNKNOWN WAIFU"), canvas.width / 2, 820);

    stage.appendChild(canvas);
    this.canvas = canvas;
    this.particleCanvas = canvas;
    this.particleContext = context;
  }

  _destroyCanvasFallback() {
    this.canvas = null;
    this.particleCanvas = null;
    this.particleContext = null;
  }
}

export { RARITY_PARTICLES };
