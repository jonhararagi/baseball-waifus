import { isCombatInitDTO, isTurnResultDTO } from "./api.js";

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

class AssetBank {
  constructor() {
    this.images = new Map();
    this.failed = new Set();
  }

  async preload(descriptors = []) {
    const unique = [];
    const seen = new Set();

    for (const descriptor of descriptors) {
      const path = typeof descriptor === "string" ? descriptor : descriptor?.path;
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
    onState = null
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

    this.assetBank = new AssetBank();
    this.manifestUrl = manifestUrl;
    this.onState = onState;

    this.state = null;
    this.lastTurn = null;
    this.matchReady = false;
    this.frameHandle = 0;
    this.cutInStartedAt = 0;
    this.cutInDurationMs = 880;
    this.resultPulse = 0;
    this.ballTrail = [];
    this.lastFrame = performance.now();

    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => this.resize())
      : null;

    if (this.resizeObserver) {
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    } else {
      window.addEventListener("resize", () => this.resize(), { passive: true });
    }

    this.resize();
    this.frameHandle = requestAnimationFrame((time) => this.frame(time));
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
      if (descriptor?.path) {
        descriptors.push({ ...descriptor, kind: "sprite" });
      }
    }

    for (const descriptor of manifest?.cards || []) {
      if (descriptor?.path) {
        descriptors.push({ ...descriptor, kind: "card" });
      }
    }

    await this.assetBank.preload(descriptors);
  }

  async setCombatInit(dto) {
    if (!isCombatInitDTO(dto)) {
      throw new TypeError("Invalid CombatInitDTO");
    }

    this.state = cloneDTO(dto);
    this.lastTurn = null;
    this.matchReady = true;
    this.resultPulse = 0;
    this.ballTrail = [];

    await this.assetBank.preload([
      ...(dto.assets?.sprites || []),
      ...(dto.assets?.cards || [])
    ]);

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
    this.state = {
      ...this.state,
      state: cloneDTO(dto.state),
      home_team: dto.home_team || this.state.home_team,
      away_team: dto.away_team || this.state.away_team
    };

    await this.assetBank.preload([
      ...(dto.assets?.sprites || []),
      ...(dto.assets?.cards || [])
    ]);

    this._prepareBallTrail(dto);
    this._triggerCutIn(dto);
    this.resultPulse = 1;
    this.onState?.(this.state);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.pixelWidth = rect.width;
    this.pixelHeight = rect.height;
  }

  dispose() {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
  }

  frame(time) {
    const delta = clamp((time - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = time;

    this._update(delta);
    this._render(time);

    this.frameHandle = requestAnimationFrame((next) => this.frame(next));
  }

  _update(delta) {
    this.resultPulse = Math.max(0, this.resultPulse - delta * 2.1);

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

  _render(time) {
    const ctx = this.ctx;
    const w = this.pixelWidth;
    const h = this.pixelHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this._drawBackground(ctx, w, h);
    this._drawStadium(ctx, w, h);

    if (this.matchReady && this.state) {
      this._drawMatchState(ctx, w, h);
    } else {
      this._drawIdleGrid(ctx, w, h);
    }

    if (this.ballTrail.length > 0) {
      this._drawBallTrail(ctx, time);
    }

    if (this.resultPulse > 0 && this.lastTurn) {
      this._drawResultPulse(ctx, w, h);
    }

    ctx.restore();
  }

  _drawBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#0b1020");
    gradient.addColorStop(0.55, "#111934");
    gradient.addColorStop(1, "#071019");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _drawStadium(ctx, w, h) {
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

    this._drawPlayerMarker(ctx, batter, w * 0.2, h * 0.72, "#ffcd66");
    this._drawPlayerMarker(ctx, pitcher, w * 0.8, h * 0.26, "#65d8ff");

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

    ctx.fillStyle = "rgba(2, 6, 15, 0.72)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 44, 0, 0, Math.PI * 2);
    ctx.stroke();

    const cardId = String(player.card_id || "");
    const descriptor = (this.state.assets?.cards || []).find((item) => item?.id === cardId);
    const path = descriptor?.path || player.card_path || "";
    const image = this.assetBank.get(path);

    if (image) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 35, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(image, -26, -35, 52, 70);
      ctx.restore();
    }

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

  _triggerCutIn(dto) {
    if (!this.cutinRoot) {
      return;
    }

    const cardId = String(
      dto.animation?.cut_in_card_id
      || dto.batter?.card_id
      || dto.pitcher?.card_id
      || ""
    );

    const descriptor = (dto.assets?.cards || []).find((item) => item?.id === cardId);
    const portraitPath = descriptor?.path || dto.animation?.cut_in_card_path || "";
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
