const RAPPORT_MIN = 1;
const RAPPORT_MAX = 10;
const DAILY_TAP_LIMIT = 50;
const DEFAULT_ACTIVE_SKIN = "uniform_default";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA");

export const SKINS = Object.freeze({
  uniform_default: Object.freeze({
    id: "uniform_default",
    name: "Uniform Default",
    unlockRapport: 1,
    colors: Object.freeze({
      primary: "#00e5ff",
      secondary: "#16243d",
      accent: "#ffffff",
      skin: "#f1c6a8"
    }),
    modifiers: Object.freeze({ contact: 1, power: 1 })
  }),
  volcano_bikini: Object.freeze({
    id: "volcano_bikini",
    name: "Volcano Bikini",
    unlockRapport: 5,
    colors: Object.freeze({
      primary: "#ff4d2f",
      secondary: "#641b15",
      accent: "#ffd166",
      skin: "#f1c6a8"
    }),
    modifiers: Object.freeze({ contact: 1.02, power: 1.04 })
  }),
  damage_skin: Object.freeze({
    id: "damage_skin",
    name: "Damage Skin",
    unlockRapport: 10,
    colors: Object.freeze({
      primary: "#a855f7",
      secondary: "#241438",
      accent: "#ffcf4a",
      skin: "#f1c6a8"
    }),
    modifiers: Object.freeze({ contact: 1.04, power: 1.06 })
  })
});

export const RAPPORT_REWARDS = Object.freeze({
  1: Object.freeze({ skins: ["uniform_default"], contact: 0, power: 0 }),
  2: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  3: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  4: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  5: Object.freeze({ skins: ["volcano_bikini"], contact: 0.02, power: 0.02 }),
  6: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  7: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  8: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  9: Object.freeze({ skins: [], contact: 0.02, power: 0.02 }),
  10: Object.freeze({ skins: ["damage_skin"], contact: 0.02, power: 0.02 })
});

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayKey(date = new Date()) {
  return DATE_FORMATTER.format(date);
}

function normalizeSkinId(value) {
  const id = String(value || DEFAULT_ACTIVE_SKIN);
  return SKINS[id] ? id : DEFAULT_ACTIVE_SKIN;
}

function defaultRapportEntry() {
  return {
    level: RAPPORT_MIN,
    unlockedSkins: [DEFAULT_ACTIVE_SKIN],
    activeSkin: DEFAULT_ACTIVE_SKIN
  };
}

function normalizeRapportEntry(value = {}) {
  const level = clampInt(value.level, RAPPORT_MIN, RAPPORT_MAX);
  const unlocked = Array.isArray(value.unlockedSkins)
    ? value.unlockedSkins.filter((id) => Boolean(SKINS[id]))
    : Array.isArray(value.unlocked_skins)
      ? value.unlocked_skins.filter((id) => Boolean(SKINS[id]))
      : [];

  if (!unlocked.includes(DEFAULT_ACTIVE_SKIN)) {
    unlocked.unshift(DEFAULT_ACTIVE_SKIN);
  }

  for (const [skinId, skin] of Object.entries(SKINS)) {
    if (level >= skin.unlockRapport && !unlocked.includes(skinId)) {
      unlocked.push(skinId);
    }
  }

  const persistedActiveSkin = value.activeSkin || value.active_skin;
  const activeSkin = unlocked.includes(normalizeSkinId(persistedActiveSkin))
    ? normalizeSkinId(persistedActiveSkin)
    : unlocked[0];

  return {
    level,
    unlockedSkins: [...new Set(unlocked)],
    activeSkin
  };
}

function normalizePersistence(input = {}) {
  const rapport = {};
  for (const [id, entry] of Object.entries(input.rapport || {})) {
    rapport[String(id)] = normalizeRapportEntry(entry);
  }

  const dailyDate = String(input.daily?.date || todayKey());
  const dailyTaps = dailyDate === todayKey()
    ? clampInt(input.daily?.taps, 0, DAILY_TAP_LIMIT)
    : 0;

  const activeWaifuId = input.activeWaifuId || input.active_waifu_id
    ? String(input.activeWaifuId || input.active_waifu_id)
    : null;

  return {
    activeWaifuId,
    rapport,
    daily: {
      date: dailyDate === todayKey() ? dailyDate : todayKey(),
      taps: dailyTaps
    }
  };
}

export class LockerRoom {
  constructor({
    saveSystem = null,
    voiceSystem = null,
    getWaifu = null,
    onChange = null
  } = {}) {
    this.saveSystem = saveSystem;
    this.voiceSystem = voiceSystem;
    this.getWaifu = getWaifu;
    this.onChange = onChange;
    this.state = normalizePersistence({});
    this.canvas = null;
    this.root = null;
    this.controls = null;
    this.pointerHandler = null;
    this.currentWaifu = null;
    this.tapFlash = 0;
    this.tapPulse = 0;
    this.message = "";
    this.messageTimer = 0;
    this.lastInteraction = null;
  }

  setSaveSystem(saveSystem = null) {
    this.saveSystem = saveSystem;
    return this;
  }

  setVoiceSystem(voiceSystem = null) {
    this.voiceSystem = voiceSystem;
    return this;
  }

  setWaifuProvider(getWaifu) {
    this.getWaifu = typeof getWaifu === "function" ? getWaifu : null;
    return this;
  }

  setActiveWaifu(waifuOrId) {
    const waifu = typeof waifuOrId === "string"
      ? this.getWaifu?.(waifuOrId)
      : waifuOrId;

    const id = String(
      waifu?.character_id
      || waifu?.id
      || waifu?.card_id
      || waifuOrId
      || ""
    );

    if (!id) {
      this.currentWaifu = null;
      this.state.activeWaifuId = null;
      this._render();
      return null;
    }

    this.currentWaifu = waifu || this.getWaifu?.(id) || {
      character_id: id,
      canonical: { display_name: id }
    };

    this.state.activeWaifuId = id;
    this._ensureWaifu(id);
    this._render();
    return this.getState();
  }

  getActiveWaifuId() {
    return this.state.activeWaifuId;
  }

  getRapport(id = this.state.activeWaifuId) {
    const key = String(id || "");
    if (!key) return RAPPORT_MIN;
    return this._ensureWaifu(key).level;
  }

  getRapportEntry(id = this.state.activeWaifuId) {
    const key = String(id || "");
    if (!key) return null;
    return clone(this._ensureWaifu(key));
  }

  getUnlockedSkins(id = this.state.activeWaifuId) {
    const entry = this.getRapportEntry(id);
    return entry ? [...entry.unlockedSkins] : [];
  }

  getActiveSkin(id = this.state.activeWaifuId) {
    const entry = this.getRapportEntry(id);
    return entry?.activeSkin || DEFAULT_ACTIVE_SKIN;
  }

  getSkinModifiers(id = this.state.activeWaifuId) {
    const skinId = this.getActiveSkin(id);
    const skin = SKINS[skinId] || SKINS[DEFAULT_ACTIVE_SKIN];
    const entry = this.getRapportEntry(id);
    const rapportPassive = Math.max(0, (entry?.level || RAPPORT_MIN) - RAPPORT_MIN) * 0.02;
    return {
      contact: Number((skin.modifiers.contact * (1 + rapportPassive)).toFixed(4)),
      power: Number((skin.modifiers.power * (1 + rapportPassive)).toFixed(4))
    };
  }

  tapActiveWaifu() {
    const id = this.state.activeWaifuId;
    if (!id) return { changed: false, reason: "NO_WAIFU" };

    this._rollDailyBoundary();
    const entry = this._ensureWaifu(id);
    const oldLevel = entry.level;

    let changed = false;
    let levelUp = false;
    if (this.state.daily.taps < DAILY_TAP_LIMIT) {
      this.state.daily.taps += 1;
      changed = true;

      if (entry.level < RAPPORT_MAX) {
        entry.level += 1;
        levelUp = entry.level > oldLevel;
        this._unlockEligibleSkins(entry);
      }
    }

    const waifu = this.currentWaifu || this.getWaifu?.(id) || null;
    const unlocked = [...entry.unlockedSkins];

    this.tapFlash = 1;
    this.tapPulse = 1;
    this.message = levelUp
      ? "RAPPORT UP! " + entry.level + "/10"
      : this.state.daily.taps >= DAILY_TAP_LIMIT
        ? "DAILY TAP LIMIT REACHED"
        : "GOOD TO SEE YOU!";

    this.lastInteraction = {
      event: "ON_TAP",
      id,
      changed,
      levelUp,
      rapport: entry.level,
      unlockedSkins: unlocked
    };

    this.voiceSystem?.emit?.("ON_TAP", waifu);
    this._persist();
    this._render();
    return clone(this.lastInteraction);
  }

  equipSkin(skinId, id = this.state.activeWaifuId) {
    const key = String(id || "");
    if (!key || !SKINS[String(skinId)]) {
      return { changed: false, reason: "UNKNOWN_SKIN" };
    }

    const entry = this._ensureWaifu(key);
    this._unlockEligibleSkins(entry);
    const normalized = normalizeSkinId(skinId);

    if (!entry.unlockedSkins.includes(normalized)) {
      return {
        changed: false,
        reason: "SKIN_LOCKED",
        rapport: entry.level,
        requiredRapport: SKINS[normalized].unlockRapport
      };
    }

    entry.activeSkin = normalized;
    this.state.activeWaifuId = key;

    if (!this.currentWaifu || String(this.currentWaifu.character_id || this.currentWaifu.id) !== key) {
      this.currentWaifu = this.getWaifu?.(key) || this.currentWaifu;
    }

    this._persist();
    this._render();
    return {
      changed: true,
      activeSkin: normalized,
      modifiers: this.getSkinModifiers(key)
    };
  }

  handleEvent(event, waifu = this.currentWaifu) {
    const normalizedEvent = String(event || "").toUpperCase();
    switch (normalizedEvent) {
      case "ON_TOUCH_LOCKER":
        this.voiceSystem?.emit?.("ON_TOUCH_LOCKER", waifu);
        return true;
      case "ON_TAP":
        this.voiceSystem?.emit?.("ON_TAP", waifu);
        return true;
      case "ON_SUPER_SWING":
      case "ON_VICTORY":
        this.voiceSystem?.emit?.(normalizedEvent, waifu);
        return true;
      default:
        return false;
    }
  }

  bindCanvas(canvas) {
    this.unbindCanvas();

    if (!canvas || typeof canvas.addEventListener !== "function") {
      return false;
    }

    this.canvas = canvas;
    this.pointerHandler = (event) => {
      const rect = canvas.getBoundingClientRect?.();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const x = Number(event.clientX) - rect.left;
      const y = Number(event.clientY) - rect.top;
      const point = this.characterBounds(rect.width, rect.height);
      if (
        x >= point.x
        && x <= point.x + point.width
        && y >= point.y
        && y <= point.y + point.height
      ) {
        event.preventDefault?.();
        this.tapActiveWaifu();
      }
    };

    canvas.addEventListener("pointerdown", this.pointerHandler, { passive: false });
    return true;
  }

  unbindCanvas() {
    if (this.canvas && this.pointerHandler) {
      this.canvas.removeEventListener("pointerdown", this.pointerHandler);
    }
    this.canvas = null;
    this.pointerHandler = null;
  }

  mount(root, {
    canvas = null,
    select = null,
    rapportLabel = null,
    skinLabel = null,
    messageLabel = null
  } = {}) {
    this.root = root || null;
    if (!this.root) return this;

    this.controls = { select, rapportLabel, skinLabel, messageLabel };

    if (canvas) {
      this.bindCanvas(canvas);
    }

    if (select) {
      select.addEventListener("change", () => {
        this.equipSkin(select.value);
      });
    }

    this.setActiveWaifu(
      this.state.activeWaifuId
      ? this.getWaifu?.(this.state.activeWaifuId)
      : this.getWaifu?.()
    );
    this._render();
    return this;
  }

  update(delta = 0) {
    const dt = Math.max(0, Number(delta) || 0);
    this.tapFlash = Math.max(0, this.tapFlash - dt * 3.5);
    this.tapPulse = Math.max(0, this.tapPulse - dt * 2.8);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    if (this.messageTimer === 0) this.message = "";
    this._render();
  }

  render(ctx, width, height) {
    if (!ctx) return;
    const w = Math.max(1, Number(width) || 1);
    const h = Math.max(1, Number(height) || 1);
    const id = this.state.activeWaifuId;
    const entry = id ? this._ensureWaifu(id) : defaultRapportEntry();
    const skinId = entry.activeSkin;
    const skin = SKINS[skinId] || SKINS[DEFAULT_ACTIVE_SKIN];
    const waifu = this.currentWaifu || {};

    ctx.save();
    const background = ctx.createLinearGradient(0, 0, 0, h);
    background.addColorStop(0, "#090d18");
    background.addColorStop(1, skin.colors.secondary);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = skin.colors.primary;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += Math.max(32, w / 12)) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const glow = 18 + this.tapPulse * 20;
    const centerX = w * 0.5;
    const centerY = h * 0.52;
    const scale = Math.min(w, h) / 360;
    const bodyWidth = 82 * scale;
    const bodyHeight = 148 * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1 + this.tapPulse * 0.025, 1 + this.tapPulse * 0.025);
    ctx.shadowColor = skin.colors.primary;
    ctx.shadowBlur = glow;
    ctx.fillStyle = skin.colors.primary;
    this._drawCharacterBody(ctx, bodyWidth, bodyHeight, skin, waifu);
    ctx.restore();

    if (this.tapFlash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + (this.tapFlash * 0.18) + ")";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      String(waifu.canonical?.display_name || waifu.display_name || waifu.name || id || "LOCKER"),
      centerX,
      34
    );

    ctx.fillStyle = skin.colors.accent;
    ctx.font = "900 12px system-ui, sans-serif";
    ctx.fillText("RAPPORT " + entry.level + "/10", centerX, h - 28);

    ctx.restore();
  }

  getPersistence() {
    this._rollDailyBoundary();
    return clone(this.state);
  }

  applyPersistence(input = {}) {
    this.state = normalizePersistence(input);
    this.currentWaifu = this.getWaifu?.(this.state.activeWaifuId);
    this._ensureActiveWaifu();
    this._render();
    return this.getState();
  }

  getState() {
    this._rollDailyBoundary();
    const id = this.state.activeWaifuId;
    const entry = id ? this._ensureWaifu(id) : null;
    return {
      activeWaifuId: id,
      rapport: entry ? clone(entry) : null,
      dailyTaps: this.state.daily.taps,
      dailyTapLimit: DAILY_TAP_LIMIT,
      activeSkin: entry?.activeSkin || DEFAULT_ACTIVE_SKIN,
      unlockedSkins: entry?.unlockedSkins || [DEFAULT_ACTIVE_SKIN],
      modifiers: this.getSkinModifiers(id)
    };
  }

  characterBounds(width, height) {
    const scale = Math.min(width, height) / 360;
    const bodyWidth = 100 * scale;
    const bodyHeight = 220 * scale;
    return {
      x: width * 0.5 - bodyWidth * 0.5,
      y: height * 0.52 - bodyHeight * 0.5,
      width: bodyWidth,
      height: bodyHeight
    };
  }

  _drawCharacterBody(ctx, bodyWidth, bodyHeight, skin, waifu) {
    const headRadius = bodyWidth * 0.43;
    const bodyTop = -bodyHeight * 0.18;
    const bodyBottom = bodyHeight * 0.55;

    ctx.fillStyle = skin.colors.secondary;
    ctx.beginPath();
    ctx.roundRect?.(
      -bodyWidth * 0.42,
      bodyTop,
      bodyWidth * 0.84,
      bodyBottom - bodyTop,
      bodyWidth * 0.18
    );
    if (!ctx.roundRect) ctx.rect(-bodyWidth * 0.42, bodyTop, bodyWidth * 0.84, bodyBottom - bodyTop);
    ctx.fill();

    ctx.fillStyle = skin.colors.skin;
    ctx.beginPath();
    ctx.arc(0, -bodyHeight * 0.43, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin.colors.primary;
    ctx.beginPath();
    ctx.arc(0, -bodyHeight * 0.48, headRadius * 1.02, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#17131c";
    ctx.beginPath();
    ctx.arc(-headRadius * 0.32, -bodyHeight * 0.43, headRadius * 0.08, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.32, -bodyHeight * 0.43, headRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin.colors.accent;
    ctx.font = "900 " + Math.max(8, bodyWidth * 0.11) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      String(waifu?.canonical?.position || waifu?.position || "WAIFU").slice(0, 9),
      0,
      bodyBottom - 12
    );

    if (skin.id === "volcano_bikini") {
      ctx.strokeStyle = skin.colors.accent;
      ctx.lineWidth = Math.max(2, bodyWidth * 0.035);
      ctx.beginPath();
      ctx.moveTo(-bodyWidth * 0.31, -bodyHeight * 0.02);
      ctx.lineTo(0, bodyHeight * 0.08);
      ctx.lineTo(bodyWidth * 0.31, -bodyHeight * 0.02);
      ctx.stroke();
    } else if (skin.id === "damage_skin") {
      ctx.strokeStyle = skin.colors.accent;
      ctx.lineWidth = Math.max(2, bodyWidth * 0.024);
      ctx.beginPath();
      ctx.moveTo(-bodyWidth * 0.18, -bodyHeight * 0.13);
      ctx.lineTo(bodyWidth * 0.02, bodyHeight * 0.03);
      ctx.lineTo(-bodyWidth * 0.08, bodyHeight * 0.22);
      ctx.moveTo(bodyWidth * 0.2, -bodyHeight * 0.08);
      ctx.lineTo(bodyWidth * 0.02, bodyHeight * 0.14);
      ctx.stroke();
    }
  }

  _ensureWaifu(id) {
    const key = String(id || "");
    if (!this.state.rapport[key]) {
      this.state.rapport[key] = defaultRapportEntry();
    }
    this.state.rapport[key] = normalizeRapportEntry(this.state.rapport[key]);
    this._unlockEligibleSkins(this.state.rapport[key]);
    return this.state.rapport[key];
  }

  _unlockEligibleSkins(entry) {
    for (const [skinId, skin] of Object.entries(SKINS)) {
      if (entry.level >= skin.unlockRapport && !entry.unlockedSkins.includes(skinId)) {
        entry.unlockedSkins.push(skinId);
      }
    }
  }

  _ensureActiveWaifu() {
    if (!this.state.activeWaifuId && typeof this.getWaifu === "function") {
      const candidate = this.getWaifu();
      const id = candidate?.character_id || candidate?.id || candidate?.card_id;
      if (id) this.setActiveWaifu(candidate);
    }
    if (this.state.activeWaifuId) {
      this._ensureWaifu(this.state.activeWaifuId);
    }
  }

  _rollDailyBoundary() {
    const today = todayKey();
    if (this.state.daily.date !== today) {
      this.state.daily = { date: today, taps: 0 };
    }
  }

  _persist() {
    this.saveSystem?.save?.();
    this.onChange?.(this.getState());
  }

  _render() {
    if (!this.controls) return;
    const state = this.getState();
    const { select, rapportLabel, skinLabel, messageLabel } = this.controls;

    if (rapportLabel) {
      rapportLabel.textContent = "RAPPORT " + state.rapport?.level + "/10";
    }
    if (skinLabel) {
      skinLabel.textContent = "SKIN // " + state.activeSkin.toUpperCase();
    }
    if (messageLabel) {
      messageLabel.textContent = this.message || "TAP THE WAIFU";
    }
    if (select) {
      select.replaceChildren();
      for (const skinId of state.unlockedSkins) {
        const skin = SKINS[skinId];
        const option = document.createElement("option");
        option.value = skinId;
        option.textContent = skin.name;
        option.selected = state.activeSkin === skinId;
        select.appendChild(option);
      }
    }
  }
}

export function getTodayKey(date = new Date()) {
  return todayKey(date);
}

export { RAPPORT_MIN, RAPPORT_MAX, DAILY_TAP_LIMIT, DEFAULT_ACTIVE_SKIN };
