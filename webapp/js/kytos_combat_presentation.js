const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const PHASE_LABELS = Object.freeze({
  FORMATION: "FORMATION",
  TRANSFER: "ENERGY TRANSFER",
  CLIMAX: "CLIMAX",
  EMERGENCY: "EMERGENCY",
  VICTORY: "VICTORY",
  INTERRUPTED: "INTERRUPTED"
});

const RESULT_LABELS = Object.freeze({
  BALL_CREATED: "ENERGY BALL",
  BALL_CAPTURED: "CAPTURE",
  BALL_MODIFIED: "MODIFIED",
  BALL_LAUNCHED: "RELAUNCH",
  BUFFER_APPLIED: "BUFF",
  DEBUFFER_APPLIED: "DEBUFF",
  ATTACK_CHARGED: "BATTER CHARGED",
  SHIELD_PRESSURED: "SHIELD PRESSURED",
  INTERRUPTED_SUPPORT: "SUPPORT INTERRUPTED",
  KYTOS_HIT: "KYTOS DAMAGED",
  KYTOS_EMERGENCY: "KYTOS EMERGENCY",
  EMERGENCY_REFLECTED: "TIMING SUCCESS",
  TIMING_MISS: "TIMING MISS",
  KYTOS_DEFEATED: "KYTOS DEFEATED"
});

const ENERGY_LABELS = Object.freeze({
  ATTACK: "ATTACK",
  BUFF: "BUFF",
  DEBUFF: "DEBUFF"
});

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function safeId(value, fallback = "UNKNOWN") {
  const id = String(value ?? "").trim();
  return id || fallback;
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class KytosCombatPresentation {
  constructor({ theme = {} } = {}) {
    this.theme = {
      cyan: theme.cyan || "#00f3ff",
      pink: theme.pink || "#ff007f",
      yellow: theme.yellow || "#ffdf00",
      red: theme.red || "#ff4d6d",
      white: theme.white || "#f4f7ff",
      muted: theme.muted || "#8d9ab4",
      shield: theme.shield || "#62e6ff",
      support: theme.support || "#8ef0cc"
    };
    this.lastResult = "";
    this.lastPhase = "";
  }

  buildModel(state, width, height) {
    const w = Math.max(1, safeNumber(width, 720));
    const h = Math.max(1, safeNumber(height, 1280));
    const center = { x: w * 0.5, y: h * 0.40 };
    const supports = {
      top: { x: w * 0.5, y: h * 0.18 },
      left: { x: w * 0.23, y: h * 0.39 },
      right: { x: w * 0.77, y: h * 0.39 }
    };
    const batter = { x: w * 0.5, y: h * 0.78 };
    const bases = {
      home: { x: w * 0.5, y: h * 0.70 },
      left: { x: w * 0.30, y: h * 0.49 },
      top: { x: w * 0.5, y: h * 0.30 },
      right: { x: w * 0.70, y: h * 0.49 }
    };

    const formation = state?.formation || {};
    const supportList = formation.supports || [];
    const shield = clamp(safeNumber(state?.shield, 100), 0, 100);
    const kytos = state?.kytos || {};
    const hp = clamp(safeNumber(kytos.hp, 0), 0, Math.max(1, safeNumber(kytos.maxHp, 100)));
    const maxHp = Math.max(1, safeNumber(kytos.maxHp, 100));
    const energy = clamp(safeNumber(kytos.energy, 0), 0, Math.max(1, safeNumber(kytos.maxEnergy, 100)));
    const maxEnergy = Math.max(1, safeNumber(kytos.maxEnergy, 100));
    const emergencyThreshold = clamp(safeNumber(kytos.emergencyThreshold, 30), 1, 100);
    const emergency = String(state?.phase || "") === "EMERGENCY"
      || energy >= maxEnergy * emergencyThreshold / 100;
    const victory = String(state?.phase || "") === "VICTORY" || hp <= 0;

    const sourceId = safeId(state?.energyBall?.sourceId, "");
    const targetId = safeId(
      state?.energyBall?.targetId || state?.energyBall?.receiverId,
      ""
    );

    const positions = {
      [safeId(supportList[0]?.id)]: supports.left,
      [safeId(supportList[1]?.id)]: supports.top,
      [safeId(supportList[2]?.id)]: supports.right,
      [safeId(formation.batter?.id)]: batter
    };

    let energyBall = null;
    if (state?.energyBall) {
      const from = positions[sourceId] || center;
      const to = positions[targetId] || center;
      energyBall = {
        sourceId,
        targetId,
        x: (from.x + to.x) * 0.5,
        y: (from.y + to.y) * 0.5,
        radius: clamp(Math.min(w, h) * 0.018, 8, 16),
        active: Boolean(state.energyBall.active),
        energy: clamp(safeNumber(state.energyBall.energy, 0), 0, 100),
        energyType: String(state.energyBall.energyType || "ATTACK").toUpperCase()
      };
    }

    return Object.freeze({
      phase: String(state?.phase || "FORMATION").toUpperCase(),
      phaseLabel: PHASE_LABELS[String(state?.phase || "FORMATION").toUpperCase()] || "COMBAT",
      result: String(state?.lastResult || "").toUpperCase(),
      resultLabel: RESULT_LABELS[String(state?.lastResult || "").toUpperCase()] || "",
      formation: Object.freeze({
        batterId: safeId(formation.batter?.id),
        supportIds: Object.freeze(supportList.map((item) => safeId(item?.id)))
      }),
      center,
      supports,
      batter,
      bases,
      shield,
      hp,
      maxHp,
      hpRatio: hp / maxHp,
      energy,
      maxEnergy,
      energyRatio: energy / maxEnergy,
      emergency,
      victory,
      interrupted: String(state?.phase || "").toUpperCase() === "INTERRUPTED"
        || String(state?.lastResult || "").toUpperCase() === "INTERRUPTED_SUPPORT",
      energyBall,
      pointDistance
    });
  }

  render(ctx, width, height, state, { time = 0 } = {}) {
    if (!ctx || !state) return null;
    const model = this.buildModel(state, width, height);

    this._drawBases(ctx, model);
    this._drawSupports(ctx, model);
    this._drawKytos(ctx, model, time);
    this._drawBatterMarker(ctx, model);
    if (model.energyBall) this._drawEnergyBall(ctx, model.energyBall, time);
    this._drawStatus(ctx, model);
    this.lastResult = model.result;
    this.lastPhase = model.phase;
    return model;
  }

  _drawBases(ctx, model) {
    ctx.save();
    for (const [name, point] of Object.entries(model.bases)) {
      const active = name === "home" ? model.formation.batterId : true;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "rgba(8, 15, 28, 0.9)";
      ctx.strokeStyle = model.shield < 60 ? this.theme.red : this.theme.shield;
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = model.shield < 60 ? 14 : 8;
      ctx.fillRect(-12, -12, 24, 24);
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();

      ctx.fillStyle = this.theme.muted;
      ctx.font = "800 8px Rajdhani, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name.toUpperCase(), point.x, point.y + 23);

      if (active) {
        const barW = Math.min(110, widthSafe(model.bases, point));
        ctx.fillStyle = "rgba(255,255,255,.10)";
        ctx.fillRect(point.x - barW * 0.5, point.y + 28, barW, 4);
        ctx.fillStyle = model.shield < 60 ? this.theme.red : this.theme.shield;
        ctx.fillRect(point.x - barW * 0.5, point.y + 28, barW * model.shield / 100, 4);
      }
    }
    ctx.restore();
  }

  _drawSupports(ctx, model) {
    const ids = model.formation.supportIds;
    const entries = [
      ["left", ids[0]],
      ["top", ids[1]],
      ["right", ids[2]]
    ];

    for (const [slot, id] of entries) {
      const point = model.supports[slot];
      ctx.save();
      const interrupted = model.interrupted && slot === "left";
      ctx.globalAlpha = interrupted ? 0.48 : 1;
      ctx.fillStyle = "rgba(7, 12, 25, 0.86)";
      ctx.strokeStyle = interrupted ? this.theme.red : this.theme.support;
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.theme.white;
      ctx.font = "900 9px Orbitron, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SUPPORT", point.x, point.y - 5);
      ctx.fillStyle = interrupted ? this.theme.red : this.theme.muted;
      ctx.font = "800 8px Rajdhani, system-ui, sans-serif";
      ctx.fillText(id, point.x, point.y + 9);
      ctx.restore();
    }
  }

  _drawKytos(ctx, model, time) {
    const pulse = 0.92 + Math.sin(safeNumber(time, 0) * 0.004) * 0.08;
    const radius = Math.min(90, Math.max(54, Math.min(model.center.x, model.center.y) * 0.23));
    const emergency = model.emergency;
    const defeated = model.victory;

    ctx.save();
    ctx.translate(model.center.x, model.center.y);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = emergency ? 0.30 : 0.16;
    ctx.fillStyle = emergency ? this.theme.red : this.theme.pink;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.55 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = defeated ? "rgba(255,255,255,.18)" : "rgba(7, 10, 22, .96)";
    ctx.strokeStyle = defeated ? this.theme.white : emergency ? this.theme.red : this.theme.pink;
    ctx.lineWidth = defeated ? 3 : 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = emergency ? 28 : 18;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 1.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = this.theme.white;
    ctx.font = "900 13px Orbitron, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(defeated ? "KYTOS DEFEATED" : "KYTOS", 0, -8);

    ctx.fillStyle = emergency ? this.theme.red : this.theme.muted;
    ctx.font = "800 9px Rajdhani, system-ui, sans-serif";
    ctx.fillText(emergency ? "EMERGENCY" : "CORE", 0, 10);

    const barW = Math.min(150, radius * 2.2);
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(-barW * 0.5, radius + 18, barW, 7);
    ctx.fillStyle = defeated ? this.theme.white : emergency ? this.theme.red : this.theme.pink;
    ctx.fillRect(-barW * 0.5, radius + 18, barW * model.hpRatio, 7);

    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(-barW * 0.5, radius + 29, barW, 4);
    ctx.fillStyle = emergency ? this.theme.yellow : this.theme.cyan;
    ctx.fillRect(-barW * 0.5, radius + 29, barW * model.energyRatio, 4);

    ctx.fillStyle = this.theme.muted;
    ctx.font = "700 8px Rajdhani, system-ui, sans-serif";
    ctx.fillText(`HP ${Math.round(model.hp)}/${Math.round(model.maxHp)} • ENERGY ${Math.round(model.energy)}%`, 0, radius + 47);
    ctx.restore();
  }

  _drawBatterMarker(ctx, model) {
    ctx.save();
    ctx.fillStyle = "rgba(7, 12, 25, .78)";
    ctx.strokeStyle = this.theme.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(model.batter.x, model.batter.y, 54, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.theme.white;
    ctx.font = "900 10px Orbitron, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`BATTER • ${model.formation.batterId}`, model.batter.x, model.batter.y + 4);
    ctx.restore();
  }

  _drawEnergyBall(ctx, ball, time) {
    const pulse = 1 + Math.sin(safeNumber(time, 0) * 0.012) * 0.18;
    const color = ball.energyType === "BUFF"
      ? this.theme.support
      : ball.energyType === "DEBUFF"
        ? this.theme.red
        : this.theme.cyan;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = this.theme.white;
    ctx.font = "900 8px Rajdhani, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ENERGY_LABELS[ball.energyType] || "ENERGY", ball.x, ball.y - ball.radius - 9);
    ctx.restore();
  }

  _drawStatus(ctx, model) {
    if (!model.resultLabel && !model.phaseLabel) return;

    const title = model.victory
      ? "KYTOS DEFEATED"
      : model.interrupted
        ? "SUPPORT INTERRUPTED"
        : model.resultLabel || model.phaseLabel;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = model.victory ? this.theme.yellow : model.interrupted ? this.theme.red : this.theme.cyan;
    ctx.font = "900 12px Orbitron, system-ui, sans-serif";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillText(title, model.center.x, model.center.y + 125);

    if (model.result === "BUFFER_APPLIED" || model.result === "DEBUFFER_APPLIED") {
      ctx.font = "900 10px Rajdhani, system-ui, sans-serif";
      ctx.fillStyle = model.result === "BUFFER_APPLIED" ? this.theme.support : this.theme.red;
      ctx.fillText(model.result === "BUFFER_APPLIED" ? "BUFF • ATK ↑" : "DEBUFF • DEF ↓", model.center.x, model.center.y + 145);
    }
    ctx.restore();
  }
}

function widthSafe(bases, point) {
  const nearest = Object.values(bases).find((candidate) => candidate !== point);
  return nearest ? clamp(pointDistance(point, nearest) * 0.45, 58, 110) : 82;
}

export { PHASE_LABELS, RESULT_LABELS };
