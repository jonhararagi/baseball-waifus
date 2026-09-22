function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function textValue(value, fallback = "-") {
  return value === undefined || value === null ? fallback : String(value);
}

export class CombatHUD {
  constructor({ getResources = null } = {}) {
    this.getResources = getResources;
    this.banner = null;
    this.bannerTimer = 0;
    this.bannerDuration = 1.45;
    this.time = 0;
    this.lastBannerTurnId = "";
  }

  update(delta = 0) {
    const dt = clamp(Number(delta) || 0, 0, 0.08);
    this.time += dt;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    if (this.bannerTimer === 0) this.banner = null;
  }

  showBanner(title, detail = "", { accent = "#00f0ff", duration = 1.45 } = {}) {
    this.banner = {
      title: String(title || "GAME EVENT"),
      detail: String(detail || ""),
      accent
    };
    this.bannerDuration = Math.max(0.2, Number(duration) || 1.45);
    this.bannerTimer = this.bannerDuration;
  }

  render(ctx, width, height, state = null, lastTurn = null) {
    if (!ctx) return;

    const matchState = state?.state || {};
    const resources = this.getResources?.() || {};
    const scrap = Math.max(0, Number(resources.scrap) || 0);
    const energy = clamp(Number(resources.energy ?? 100) || 0, 0, 100);

    this.renderTopBar(ctx, width, height, matchState, energy, scrap);

    const turnResult = String(lastTurn?.result || "").toUpperCase();
    const turnId = String(lastTurn?.turn_id || "");
    if (
      turnResult === "HOME_RUN"
      && this.bannerTimer <= 0
      && turnId
      && turnId !== this.lastBannerTurnId
    ) {
      this.lastBannerTurnId = turnId;
      this.showBanner("HOME RUN!", "PERFECT IMPACT", { accent: "#ff8b5c" });
    }

    if (this.banner && this.bannerTimer > 0) this.renderBanner(ctx, width, height);
  }

  renderTopBar(ctx, width, height, matchState, energy, scrap) {
    const panelWidth = Math.min(width - 20, 520);
    const panelX = (width - panelWidth) * 0.5;

    ctx.save();
    ctx.fillStyle = "rgba(5, 8, 16, 0.78)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.fillRect(panelX, 10, panelWidth, 50);
    ctx.strokeRect(panelX, 10, panelWidth, 50);

    ctx.font = "900 9px system-ui, sans-serif";
    ctx.fillStyle = "#8d9ab4";
    ctx.textAlign = "left";
    ctx.fillText("BALL", panelX + 12, 25);
    ctx.fillText("STRIKE", panelX + 76, 25);
    ctx.fillText("OUT", panelX + 151, 25);

    ctx.font = "900 16px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(textValue(matchState.balls, "0"), panelX + 12, 45);
    ctx.fillText(textValue(matchState.strikes, "0"), panelX + 76, 45);
    ctx.fillText(textValue(matchState.outs, "0"), panelX + 151, 45);

    const resourceX = panelX + 216;
    const barWidth = panelWidth - 228;

    ctx.font = "800 8px system-ui, sans-serif";
    ctx.fillStyle = "#8d9ab4";
    ctx.fillText("ENERGY", resourceX, 24);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(resourceX, 30, barWidth, 6);
    ctx.fillStyle = "#39ff14";
    ctx.fillRect(resourceX, 30, barWidth * (energy / 100), 6);

    ctx.fillStyle = "#8d9ab4";
    ctx.fillText("SCRAP", resourceX, 49);
    ctx.font = "900 12px system-ui, sans-serif";
    ctx.fillStyle = "#ffcd66";
    ctx.textAlign = "right";
    ctx.fillText(String(scrap), panelX + panelWidth - 10, 49);

    ctx.restore();
  }

  renderBanner(ctx, width, height) {
    const banner = this.banner;
    const life = clamp(this.bannerTimer / this.bannerDuration, 0, 1);
    const centerY = height * 0.42;
    const bannerWidth = Math.min(width - 26, 560);

    ctx.save();
    ctx.translate(width * 0.5, centerY);
    ctx.globalAlpha = life;
    ctx.fillStyle = "rgba(7, 10, 19, 0.88)";
    ctx.strokeStyle = banner.accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = banner.accent;
    ctx.shadowBlur = 22;

    ctx.beginPath();
    ctx.moveTo(-bannerWidth * 0.5 + 16, -42);
    ctx.lineTo(bannerWidth * 0.5 - 16, -42);
    ctx.lineTo(bannerWidth * 0.5, -26);
    ctx.lineTo(bannerWidth * 0.5, 30);
    ctx.lineTo(bannerWidth * 0.5 - 16, 46);
    ctx.lineTo(-bannerWidth * 0.5 + 16, 46);
    ctx.lineTo(-bannerWidth * 0.5, 30);
    ctx.lineTo(-bannerWidth * 0.5, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.fillStyle = banner.accent;
    ctx.font = "900 28px system-ui, sans-serif";
    ctx.fillText(banner.title, 0, -2);

    ctx.fillStyle = "#dfe7f6";
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.fillText(banner.detail, 0, 24);

    ctx.restore();
  }
}
