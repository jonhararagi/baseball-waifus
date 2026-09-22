const QUALITY_PROFILES = Object.freeze({
  PERFECT: { shakePx: 8, flashAlpha: 0.34, trailWidth: 10, trailDuration: 0.28 },
  HOME_RUN: { shakePx: 8, flashAlpha: 0.40, trailWidth: 12, trailDuration: 0.34 },
  GOOD: { shakePx: 4, flashAlpha: 0.12, trailWidth: 7, trailDuration: 0.24 },
  HIT: { shakePx: 4, flashAlpha: 0.12, trailWidth: 7, trailDuration: 0.24 },
  FOUL: { shakePx: 2, flashAlpha: 0.05, trailWidth: 4, trailDuration: 0.16 },
  MISS: { shakePx: 2, flashAlpha: 0.04, trailWidth: 3, trailDuration: 0.12 }
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class CombatEffects {
  constructor() {
    this.shakePx = 0;
    this.shakeTimer = 0;
    this.shakeDuration = 0.2;
    this.flashAlpha = 0;
    this.flashTimer = 0;
    this.flashDuration = 0.22;
    this.trailTimer = 0;
    this.trailDuration = 0;
    this.trailWidth = 4;
    this.trailColor = "#00f0ff";
    this.trailPoints = [];
  }

  trigger(quality, { color = "#00f0ff", result = "" } = {}) {
    const key = String(quality || result || "HIT").toUpperCase();
    const profile = QUALITY_PROFILES[key]
      || (String(result).toUpperCase() === "HOME_RUN" ? QUALITY_PROFILES.HOME_RUN : QUALITY_PROFILES.HIT);

    this.shakePx = profile.shakePx;
    this.shakeTimer = this.shakeDuration;
    this.flashAlpha = profile.flashAlpha;
    this.flashTimer = this.flashDuration;
    this.trailWidth = profile.trailWidth;
    this.trailDuration = profile.trailDuration;
    this.trailTimer = profile.trailDuration;
    this.trailColor = color;
    this.trailPoints = [];
    return profile;
  }

  update(delta = 0, batPose = null) {
    const dt = clamp(Number(delta) || 0, 0, 0.08);
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.trailTimer = Math.max(0, this.trailTimer - dt);

    if (batPose && this.trailTimer > 0) {
      this.trailPoints.push({
        x: batPose.x + Math.cos(batPose.rotation) * batPose.length * 0.28,
        y: batPose.y + Math.sin(batPose.rotation) * batPose.length * 0.28,
        age: 0
      });
      if (this.trailPoints.length > 12) this.trailPoints.shift();
    }

    for (const point of this.trailPoints) point.age += dt;
    this.trailPoints = this.trailPoints.filter((point) => point.age < this.trailDuration);
  }

  getCameraOffset() {
    if (this.shakeTimer <= 0 || this.shakePx <= 0) return { x: 0, y: 0 };

    const strength = clamp(this.shakeTimer / this.shakeDuration, 0, 1);
    return {
      x: (Math.random() * 2 - 1) * this.shakePx * strength,
      y: (Math.random() * 2 - 1) * this.shakePx * strength
    };
  }

  renderBatTrail(ctx) {
    if (!ctx || this.trailPoints.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let index = 1; index < this.trailPoints.length; index += 1) {
      const point = this.trailPoints[index];
      const previous = this.trailPoints[index - 1];
      const alpha = clamp(1 - point.age / Math.max(0.001, this.trailDuration), 0, 1);
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = this.trailColor;
      ctx.shadowColor = this.trailColor;
      ctx.shadowBlur = 12;
      ctx.lineWidth = this.trailWidth * alpha;

      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderFlash(ctx, width, height) {
    if (!ctx || this.flashTimer <= 0 || this.flashAlpha <= 0) return;
    const alpha = (this.flashTimer / this.flashDuration) * this.flashAlpha;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export { QUALITY_PROFILES };
