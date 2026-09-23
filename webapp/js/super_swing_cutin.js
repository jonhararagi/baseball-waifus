const DEFAULT_WAIFU = Object.freeze({
  name: "Roxie Vane",
  archetype: "POWER",
  quote_super: "¡IGNITION BUSTER!",
  skill_name: "Ignition Buster"
});

const PHASES = Object.freeze(["IDLE", "ENTER", "HOLD", "EXIT"]);

export class SuperSwingCutin {
  constructor({
    durations = null
  } = {}) {
    this.active = false;
    this.phase = "IDLE";
    this.timer = 0;
    this.durations = {
      ENTER: 150,
      HOLD: 700,
      EXIT: 200,
      ...(durations || {})
    };
    this.currentWaifu = null;
    this.bannerOffset = -300;
    this.speedLinesAngle = Math.PI / 6;
  }

  trigger(waifu = null) {
    if (this.active) return false;

    this.active = true;
    this.phase = "ENTER";
    this.timer = 0;
    this.currentWaifu = {
      ...DEFAULT_WAIFU,
      ...(waifu || {})
    };
    this.bannerOffset = -300;
    return true;
  }

  isFreezingTime() {
    return this.active && (this.phase === "ENTER" || this.phase === "HOLD");
  }

  update(dtMs = 0) {
    if (!this.active) return;

    const dt = Math.max(0, Number(dtMs) || 0);
    this.timer += dt;

    if (this.phase === "ENTER") {
      const progress = Math.min(1, this.timer / this.durations.ENTER);
      this.bannerOffset = -300 * (1 - Math.pow(progress, 2));

      if (this.timer >= this.durations.ENTER) {
        this.phase = "HOLD";
        this.timer = 0;
        this.bannerOffset = 0;
      }
      return;
    }

    if (this.phase === "HOLD") {
      if (this.timer >= this.durations.HOLD) {
        this.phase = "EXIT";
        this.timer = 0;
      }
      return;
    }

    if (this.phase === "EXIT") {
      const progress = Math.min(1, this.timer / this.durations.EXIT);
      this.bannerOffset = 400 * Math.pow(progress, 2);

      if (this.timer >= this.durations.EXIT) {
        this.active = false;
        this.phase = "IDLE";
        this.timer = 0;
        this.bannerOffset = -300;
      }
    }
  }

  render(ctx, width, height, { portrait = null } = {}) {
    if (!this.active || !ctx) return;

    const waifu = this.currentWaifu || DEFAULT_WAIFU;
    const themeColor = this._getArchetypeColor(waifu.archetype);
    const exitProgress = this.phase === "EXIT"
      ? Math.min(1, this.timer / this.durations.EXIT)
      : 0;

    ctx.save();

    const alpha = this.phase === "EXIT"
      ? 0.85 * (1 - exitProgress)
      : 0.85;

    ctx.fillStyle = `rgba(5, 5, 12, ${alpha})`;
    ctx.fillRect(0, 0, width, height);

    this._renderSpeedLines(ctx, width, height);

    const centerY = height * 0.42;
    const bannerHeight = Math.min(140, Math.max(112, height * 0.24));
    const bannerTop = centerY - bannerHeight / 2;

    ctx.save();
    ctx.translate(this.bannerOffset, 0);

    const left = -50;
    const right = width + 50;
    const skew = 34;

    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.beginPath();
    ctx.moveTo(left + skew, bannerTop + 10);
    ctx.lineTo(right + skew, bannerTop + 10);
    ctx.lineTo(right - skew, bannerTop + bannerHeight + 10);
    ctx.lineTo(left - skew, bannerTop + bannerHeight + 10);
    ctx.closePath();
    ctx.fill();

    const gradient = ctx.createLinearGradient(left, bannerTop, right, bannerTop);
    gradient.addColorStop(0, themeColor.secondary);
    gradient.addColorStop(0.45, themeColor.primary);
    gradient.addColorStop(1, themeColor.secondary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(left + skew, bannerTop);
    ctx.lineTo(right + skew, bannerTop);
    ctx.lineTo(right - skew, bannerTop + bannerHeight);
    ctx.lineTo(left - skew, bannerTop + bannerHeight);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = themeColor.glow;
    ctx.lineWidth = 4;
    ctx.shadowColor = themeColor.glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(left + skew, bannerTop);
    ctx.lineTo(right + skew, bannerTop);
    ctx.lineTo(right - skew, bannerTop + bannerHeight);
    ctx.lineTo(left - skew, bannerTop + bannerHeight);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    this._renderWaifuPortrait(ctx, width, centerY, themeColor, portrait);

    const textX = width * 0.32;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = themeColor.glow;
    ctx.shadowBlur = 12;
    ctx.font = "900 24px Impact, Arial Black, sans-serif";

    const skillText = String(waifu.skill_name || "SUPER SWING!").toUpperCase();
    ctx.fillText(skillText, textX, centerY - 15);

    ctx.font = "italic 700 15px sans-serif";
    ctx.fillStyle = "#FFE866";
    ctx.shadowBlur = 4;

    const quote = `"${String(waifu.quote_super || "¡Siente todo mi poder!")}"`;
    this._fillTextClamped(ctx, quote, textX, centerY + 22, Math.max(80, width * 0.61));

    ctx.restore();
    ctx.restore();
  }

  _fillTextClamped(ctx, text, x, y, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) {
      ctx.fillText(text, x, y);
      return;
    }

    let output = text;
    while (output.length > 1 && ctx.measureText(output + "…").width > maxWidth) {
      output = output.slice(0, -1);
    }
    ctx.fillText(output + "…", x, y);
  }

  _getArchetypeColor(archetype) {
    switch (String(archetype || "").toUpperCase()) {
      case "POWER":
        return { primary: "#FF3300", glow: "#FF9900", secondary: "#880000" };
      case "CONTACT":
        return { primary: "#00E5FF", glow: "#80F0FF", secondary: "#005588" };
      case "SPEED":
        return { primary: "#FFD700", glow: "#FFF066", secondary: "#887700" };
      case "EYE":
        return { primary: "#A855F7", glow: "#E9D5FF", secondary: "#581C87" };
      default:
        return { primary: "#FF007F", glow: "#FF80BF", secondary: "#880044" };
    }
  }

  _renderSpeedLines(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(width, height);
    const phase = this.timer * 0.002;

    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2 + phase + this.speedLinesAngle;
      const x1 = cx + Math.cos(angle) * 80;
      const y1 = cy + Math.sin(angle) * 80;
      const x2 = cx + Math.cos(angle) * radius;
      const y2 = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _renderWaifuPortrait(ctx, width, centerY, themeColor, portrait) {
    const portraitX = width * 0.15;
    const portraitY = centerY;
    const radius = Math.min(58, Math.max(44, width * 0.055));

    ctx.save();

    ctx.fillStyle = themeColor.secondary;
    ctx.shadowColor = themeColor.glow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, radius + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (portrait) {
      const ratio = portrait.naturalWidth > 0
        ? portrait.naturalHeight / portrait.naturalWidth
        : 1.4;
      const widthPx = Math.max(50, radius * 1.55);
      const heightPx = widthPx * ratio;

      ctx.save();
      ctx.beginPath();
      ctx.arc(portraitX, portraitY, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.98;
      ctx.drawImage(
        portrait,
        portraitX - widthPx / 2,
        portraitY - heightPx / 2,
        widthPx,
        heightPx
      );
      ctx.restore();
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initial = String(this.currentWaifu?.name || "W").charAt(0) || "W";
      ctx.fillText(initial, portraitX, portraitY);
    }

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  getState() {
    return {
      active: this.active,
      phase: this.phase,
      timer: this.timer,
      bannerOffset: this.bannerOffset,
      waifu: this.currentWaifu ? { ...this.currentWaifu } : null
    };
  }
}

export { DEFAULT_WAIFU, PHASES };
