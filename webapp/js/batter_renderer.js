const BATTER_STATES = Object.freeze({
  IDLE: "IDLE",
  WINDUP: "WINDUP",
  SWING: "SWING",
  FOLLOW_THROUGH: "FOLLOW_THROUGH"
});

const STATE_DURATIONS = Object.freeze({
  WINDUP: 0.34,
  SWING: 0.20,
  FOLLOW_THROUGH: 0.56
});

const TRANSITIONS = Object.freeze({
  IDLE: new Set(["WINDUP", "SWING"]),
  WINDUP: new Set(["SWING", "IDLE"]),
  SWING: new Set(["FOLLOW_THROUGH", "IDLE"]),
  FOLLOW_THROUGH: new Set(["IDLE", "SWING"])
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeState(value) {
  const state = String(value || "").toUpperCase();
  return BATTER_STATES[state] || BATTER_STATES.IDLE;
}

export class BatterRenderer {
  constructor({
    imageResolver = null,
    getSpritePath = null,
    fallbackPalette = null
  } = {}) {
    this.imageResolver = imageResolver;
    this.getSpritePath = getSpritePath;
    this.fallbackPalette = fallbackPalette || {
      hair: "#7a4a34",
      skin: "#e8ae86",
      uniform: "#f2f4f8",
      accent: "#00f0ff",
      bat: "#c38b4d"
    };

    this.batter = null;
    this.state = BATTER_STATES.IDLE;
    this.stateElapsed = 0;
    this.time = 0;
    this.breath = 0;
    this.weightShift = 0;
    this.hipRotation = 0;
    this.swingProgress = 0;
    this.followThroughProgress = 0;
    this.lastBatPose = null;
  }

  setBatter(batter = null) {
    this.batter = batter ? { ...batter } : null;
    return this.batter;
  }

  getState() {
    return this.state;
  }

  transitionTo(nextState) {
    const next = normalizeState(nextState);
    if (next === this.state) {
      this.stateElapsed = 0;
      return this.state;
    }

    const allowed = TRANSITIONS[this.state] || new Set();
    if (!allowed.has(next)) {
      throw new Error("Invalid BatterRenderer transition: " + this.state + " -> " + next);
    }

    this.state = next;
    this.stateElapsed = 0;
    if (next === BATTER_STATES.SWING) this.swingProgress = 0;
    if (next === BATTER_STATES.FOLLOW_THROUGH) this.followThroughProgress = 0;
    return this.state;
  }

  setState(nextState) {
    return this.transitionTo(nextState);
  }

  beginWindup() {
    if (this.state === BATTER_STATES.IDLE || this.state === BATTER_STATES.FOLLOW_THROUGH) {
      return this.transitionTo(BATTER_STATES.WINDUP);
    }
    return this.state;
  }

  beginSwing() {
    if (this.state === BATTER_STATES.WINDUP || this.state === BATTER_STATES.IDLE) {
      return this.transitionTo(BATTER_STATES.SWING);
    }
    return this.state;
  }

  update(delta = 0) {
    const dt = clamp(safeNumber(delta, 0), 0, 0.08);
    this.time += dt;
    this.stateElapsed += dt;
    this.breath = Math.sin(this.time * 3.1) * 0.5 + 0.5;

    if (this.state === BATTER_STATES.WINDUP) {
      this.weightShift = clamp(this.stateElapsed / STATE_DURATIONS.WINDUP, 0, 1);
      if (this.stateElapsed >= STATE_DURATIONS.WINDUP) this.transitionTo(BATTER_STATES.SWING);
    } else if (this.state === BATTER_STATES.SWING) {
      this.swingProgress = clamp(this.stateElapsed / STATE_DURATIONS.SWING, 0, 1);
      this.hipRotation = Math.sin(this.swingProgress * Math.PI) * 0.34;
      if (this.stateElapsed >= STATE_DURATIONS.SWING) this.transitionTo(BATTER_STATES.FOLLOW_THROUGH);
    } else if (this.state === BATTER_STATES.FOLLOW_THROUGH) {
      this.followThroughProgress = clamp(
        this.stateElapsed / STATE_DURATIONS.FOLLOW_THROUGH,
        0,
        1
      );
      this.hipRotation = 0.34 * (1 - this.followThroughProgress * 0.45);
      if (this.stateElapsed >= STATE_DURATIONS.FOLLOW_THROUGH) this.transitionTo(BATTER_STATES.IDLE);
    } else {
      this.weightShift = 0;
      this.hipRotation *= 0.9;
    }

    return this.state;
  }

  getBatPose(width = 360, height = 640) {
    const baseX = width * 0.27;
    const baseY = height * 0.76;
    const swing = this.state === BATTER_STATES.SWING
      ? this.swingProgress
      : this.state === BATTER_STATES.FOLLOW_THROUGH
        ? this.followThroughProgress
        : 0;

    let rotation = -1.04;
    if (this.state === BATTER_STATES.WINDUP) {
      rotation = -1.48 + this.weightShift * 0.18;
    } else if (this.state === BATTER_STATES.SWING) {
      rotation = -1.48 + swing * 2.05;
    } else if (this.state === BATTER_STATES.FOLLOW_THROUGH) {
      rotation = 0.55 + this.followThroughProgress * 0.55;
    }

    return {
      x: baseX + this.hipRotation * width * 0.035,
      y: baseY - this.breath * height * 0.006,
      rotation,
      length: clamp(width * 0.34, 96, 170)
    };
  }

  draw(ctx, width, height, { accentColor = this.fallbackPalette.accent, scale = 1 } = {}) {
    if (!ctx) return;

    const pose = this.getBatPose(width, height);
    this.lastBatPose = pose;

    const spritePath = this.getSpritePath?.(this.batter);
    const image = spritePath ? this.imageResolver?.(spritePath) : null;
    if (image) {
      this.drawSprite(ctx, image, pose, width, height, scale, accentColor);
    } else {
      this.drawProcedural(ctx, pose, width, height, accentColor, scale);
    }
  }

  drawSprite(ctx, image, pose, width, height, scale = 1, accentColor = "#00f0ff") {
    const targetHeight = clamp(height * 0.52 * scale, 190, 430);
    const ratio = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 1.45;
    const targetWidth = targetHeight / ratio;

    ctx.save();
    ctx.translate(pose.x + width * 0.12, pose.y);
    ctx.scale(-1, 1);
    ctx.translate(-targetWidth * 0.5, -targetHeight * 0.84);
    ctx.globalAlpha = 0.98;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 16;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    ctx.restore();

    this.drawBat(ctx, pose, accentColor);
  }

  drawProcedural(ctx, pose, width, height, accentColor, scale = 1) {
    const s = clamp(height / 640, 0.72, 1.28) * scale;
    const x = pose.x + width * 0.08;
    const y = pose.y;
    const p = this.fallbackPalette;
    const breathing = (this.breath - 0.5) * 3.5;
    const shoulderTilt = this.weightShift * 0.09;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.hipRotation * 0.45);
    ctx.translate(0, breathing);

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 150 * s, 67 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = p.skin;
    ctx.lineCap = "round";
    ctx.lineWidth = 18 * s;
    ctx.beginPath();
    ctx.moveTo(-20 * s, 82 * s);
    ctx.lineTo(-32 * s, 150 * s);
    ctx.moveTo(18 * s, 82 * s);
    ctx.lineTo(42 * s, 145 * s);
    ctx.stroke();

    ctx.fillStyle = "#10131c";
    ctx.beginPath();
    ctx.ellipse(-38 * s, 150 * s, 24 * s, 10 * s, -0.08, 0, Math.PI * 2);
    ctx.ellipse(47 * s, 145 * s, 24 * s, 10 * s, 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(shoulderTilt);
    ctx.fillStyle = p.uniform;
    ctx.beginPath();
    ctx.moveTo(-45 * s, -40 * s);
    ctx.quadraticCurveTo(-58 * s, 20 * s, -49 * s, 73 * s);
    ctx.quadraticCurveTo(0, 94 * s, 49 * s, 73 * s);
    ctx.quadraticCurveTo(58 * s, 20 * s, 45 * s, -40 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.hair;
    ctx.beginPath();
    ctx.moveTo(-42 * s, -44 * s);
    ctx.quadraticCurveTo(0, -72 * s, 42 * s, -44 * s);
    ctx.lineTo(34 * s, 35 * s);
    ctx.quadraticCurveTo(0, 52 * s, -34 * s, 35 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.ellipse(0, -57 * s, 29 * s, 34 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.hair;
    ctx.beginPath();
    ctx.ellipse(0, -63 * s, 34 * s, 38 * s, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(35 * s, -28 * s, 18 * s, 42 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(11, 15, 25, 0.72)";
    ctx.font = "900 " + (22 * s) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(this.batter?.jersey_number || "01"), 0, 25 * s);

    ctx.fillStyle = accentColor;
    ctx.fillRect(-48 * s, 58 * s, 96 * s, 5 * s);

    ctx.strokeStyle = p.skin;
    ctx.lineWidth = 16 * s;
    ctx.beginPath();
    ctx.moveTo(-37 * s, -14 * s);
    ctx.lineTo(-70 * s, 14 * s);
    ctx.moveTo(37 * s, -12 * s);
    ctx.lineTo(68 * s, 4 * s);
    ctx.stroke();

    ctx.restore();

    this.drawBat(ctx, { ...pose, x, y: y + 8 * s }, accentColor);
    ctx.restore();
  }

  drawBat(ctx, pose, accentColor) {
    ctx.save();
    ctx.translate(pose.x, pose.y - 12);
    ctx.rotate(pose.rotation);

    const length = pose.length;
    const grip = Math.max(6, length * 0.08);

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = this.fallbackPalette.bat;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-length * 0.48, 0);
    ctx.lineTo(length * 0.38, 0);
    ctx.stroke();

    ctx.strokeStyle = "#f7f2e8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-length * 0.48, 0);
    ctx.lineTo(-length * 0.48 + grip, 0);
    ctx.stroke();

    ctx.restore();
  }
}

export { BATTER_STATES };
