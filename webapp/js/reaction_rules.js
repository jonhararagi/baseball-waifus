export const REACTION_SIGNAL = Object.freeze({
  INACTIVITY: "INACTIVITY",
  SKIP: "SKIP"
});

export const REACTION_DEFAULTS = Object.freeze({
  inactivityThresholdSeconds: 8,
  cooldownSeconds: 20
});

export const REACTION_RULES = Object.freeze([
  Object.freeze({
    id: "locker-inactivity",
    signal: REACTION_SIGNAL.INACTIVITY,
    character: "*",
    reaction: "REACTION_INACTIVITY",
    cooldownSeconds: REACTION_DEFAULTS.cooldownSeconds,
    priority: 50,
    once: true,
    context: "locker"
  }),
  Object.freeze({
    id: "dialogue-skip",
    signal: REACTION_SIGNAL.SKIP,
    character: "*",
    reaction: "REACTION_SKIP",
    cooldownSeconds: REACTION_DEFAULTS.cooldownSeconds,
    priority: 50,
    once: true,
    context: "dialogue"
  })
]);

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function matches(rule, signal, characterId, context) {
  return normalize(rule.signal) === normalize(signal)
    && (rule.character === "*" || String(rule.character) === String(characterId || ""))
    && (!rule.context || rule.context === String(context || ""));
}

export class ReactionRuleSystem {
  constructor({
    rules = REACTION_RULES,
    now = () => Date.now()
  } = {}) {
    this.rules = Array.isArray(rules) ? rules.map((rule) => ({ ...rule })) : [];
    this.now = typeof now === "function" ? now : () => Date.now();
    this.cooldowns = new Map();
    this.once = new Set();
  }

  findEligible({
    signal,
    characterId = "",
    context = "",
    now = this.now()
  } = {}) {
    const candidates = this.rules
      .filter((rule) => matches(rule, signal, characterId, context))
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

    for (const rule of candidates) {
      const key = this._key(rule, characterId, context);
      if (rule.once && this.once.has(key)) continue;

      const last = this.cooldowns.get(key);
      const cooldownMs = Math.max(0, Number(rule.cooldownSeconds || 0) * 1000);
      if (Number.isFinite(last) && Number(now) - last < cooldownMs) continue;

      return { ...rule };
    }

    return null;
  }

  trigger({
    signal,
    characterId = "",
    context = "",
    now = this.now()
  } = {}) {
    const rule = this.findEligible({ signal, characterId, context, now });
    if (!rule) return null;

    const key = this._key(rule, characterId, context);
    this.cooldowns.set(key, Number(now));
    if (rule.once) this.once.add(key);

    return {
      ruleId: rule.id,
      signal: rule.signal,
      reaction: rule.reaction,
      characterId: String(characterId || ""),
      context: String(context || ""),
      priority: Number(rule.priority || 0)
    };
  }

  reset({ signal = null, characterId = "", context = "" } = {}) {
    const normalizedSignal = signal ? normalize(signal) : null;
    for (const rule of this.rules) {
      if (normalizedSignal && normalize(rule.signal) !== normalizedSignal) continue;
      const key = this._key(rule, characterId, context);
      this.cooldowns.delete(key);
      this.once.delete(key);
    }
  }

  _key(rule, characterId, context) {
    return [
      String(rule.id || ""),
      String(characterId || ""),
      String(context || "")
    ].join("|");
  }
}

export class InactivitySignalDetector {
  constructor({
    thresholdSeconds = REACTION_DEFAULTS.inactivityThresholdSeconds
  } = {}) {
    this.thresholdSeconds = Math.max(0.1, Number(thresholdSeconds) || REACTION_DEFAULTS.inactivityThresholdSeconds);
    this.elapsedSeconds = 0;
    this.triggered = false;
  }

  update(deltaSeconds = 0, active = true) {
    if (!active) {
      this.reset();
      return false;
    }

    this.elapsedSeconds += Math.max(0, Number(deltaSeconds) || 0);
    if (this.triggered || this.elapsedSeconds < this.thresholdSeconds) return false;

    this.triggered = true;
    return true;
  }

  reset() {
    this.elapsedSeconds = 0;
    this.triggered = false;
  }

  getElapsedSeconds() {
    return this.elapsedSeconds;
  }
}
