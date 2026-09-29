export const HEALER_ROLE = "HEALER";
export const HEALER_GRADES = Object.freeze(["PERFECT", "GREAT", "GOOD", "MISS"]);
export const HEALER_ZONES = Object.freeze(["TOP", "LEFT", "RIGHT", "BOTTOM"]);

const GRADE_SCORE = Object.freeze({ PERFECT: 100, GREAT: 75, GOOD: 50, MISS: 0 });
const GRADE_MULTIPLIER = Object.freeze({ PERFECT: 1, GREAT: 0.75, GOOD: 0.5, MISS: 0 });
const HEALING_THRESHOLDS = Object.freeze({ GOOD: 0.45, GREAT: 0.75 });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed) {
  const text = String(seed ?? "HEALER-001");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix(seed, index, salt) {
  return Math.imul(
    seed ^ Math.imul(index + 1, 0x9e3779b9),
    salt
  ) >>> 0;
}

export function createHealerThreatSequence(seed = "HEALER-001", count = 6, spacingMs = 720) {
  const normalizedSeed = normalizeSeed(seed);
  const safeCount = clamp(Math.trunc(Number(count) || 0), 1, 24);
  const safeSpacing = clamp(Number(spacingMs) || 720, 300, 5000);

  return Object.freeze(Array.from({ length: safeCount }, (_, index) => {
    const zone = HEALER_ZONES[mix(normalizedSeed, index, 0x85ebca6b) % HEALER_ZONES.length];
    const intensity = 1 + (mix(normalizedSeed, index, 0xc2b2ae35) % 3);
    const targetMs = 500 + index * safeSpacing;
    return Object.freeze({
      id: `healer-threat-${index + 1}`,
      index,
      zone,
      x: [50, 18, 82, 50][HEALER_ZONES.indexOf(zone)],
      y: [18, 50, 50, 82][HEALER_ZONES.indexOf(zone)],
      target_ms: targetMs,
      perfect_window_ms: 45,
      great_window_ms: 95,
      good_window_ms: 160,
      interaction_window_ms: 220,
      intensity,
      active: true,
      resolved: false
    });
  }));
}

export function classifyHealerTiming(deltaMs, threat) {
  const delta = Math.abs(Number(deltaMs));
  if (!Number.isFinite(delta) || !threat) return "MISS";
  if (delta <= threat.perfect_window_ms) return "PERFECT";
  if (delta <= threat.great_window_ms) return "GREAT";
  if (delta <= threat.good_window_ms) return "GOOD";
  return "MISS";
}

function calculateProtectedPoints(threat, grade) {
  return Math.round(threat.intensity * 20 * GRADE_MULTIPLIER[grade]);
}

function healingTier(protectedPoints, maxProtectedPoints) {
  const ratio = maxProtectedPoints > 0 ? protectedPoints / maxProtectedPoints : 0;
  if (ratio >= HEALING_THRESHOLDS.GREAT) return "GREAT";
  if (ratio >= HEALING_THRESHOLDS.GOOD) return "GOOD";
  if (protectedPoints > 0) return "NORMAL";
  return "FAILED";
}

function freezeResult(result) {
  return Object.freeze(JSON.parse(JSON.stringify(result)));
}

export class HealerDefensiveSupport {
  constructor({ seed = "HEALER-001", count = 6, spacingMs = 720, sequence = null } = {}) {
    this.seed = String(seed);
    this.sequence = sequence
      ? Object.freeze(sequence.map((threat) => Object.freeze({ ...threat })))
      : createHealerThreatSequence(this.seed, count, spacingMs);
    this.reset();
  }

  reset() {
    this.index = 0;
    this.completed = false;
    this.hits = [];
    this.totalScore = 0;
    this.protectedPoints = 0;
    this.rejectedInputs = [];
    this.resolvedThreatIds = new Set();
    return this.getState();
  }

  start() {
    return this.reset();
  }

  getCurrentThreat() {
    if (this.completed) return null;
    const threat = this.sequence[this.index] || null;
    if (!threat) return null;
    return Object.freeze({ ...threat, active: true, resolved: false });
  }

  getState() {
    return Object.freeze({
      role: HEALER_ROLE,
      seed: this.seed,
      active: !this.completed,
      completed: this.completed,
      current_index: this.index,
      total_threats: this.sequence.length,
      current_threat: this.getCurrentThreat(),
      score: this.totalScore,
      protected_points: this.protectedPoints,
      rejected_inputs: this.rejectedInputs.length
    });
  }

  submitInput({ threatId, zone, timestampMs } = {}) {
    if (this.completed) return this._reject("POST_COMPLETION");

    const requestedId = String(threatId || "");
    if (this.resolvedThreatIds.has(requestedId)) return this._reject("THREAT_ALREADY_RESOLVED");

    const current = this.getCurrentThreat();
    if (!current) return this._reject("NO_ACTIVE_THREAT");
    if (requestedId !== current.id) return this._reject("INVALID_THREAT");
    if (!Number.isFinite(Number(timestampMs))) return this._reject("INVALID_TIMESTAMP");
    if (String(zone || "").toUpperCase() !== current.zone) return this._reject("INVALID_ZONE");

    const deltaMs = Number(timestampMs) - current.target_ms;
    const absoluteDelta = Math.abs(deltaMs);
    if (absoluteDelta > current.interaction_window_ms) {
      return this._reject("OUT_OF_WINDOW");
    }

    const grade = classifyHealerTiming(deltaMs, current);
    const score = GRADE_SCORE[grade];
    const protectedDelta = calculateProtectedPoints(current, grade);
    const hit = Object.freeze({
      threat_id: current.id,
      zone: current.zone,
      target_ms: current.target_ms,
      input_ms: Number(timestampMs),
      delta_ms: Math.round(deltaMs),
      grade,
      score,
      intensity: current.intensity,
      protected_points: protectedDelta
    });

    this.hits.push(hit);
    this.resolvedThreatIds.add(current.id);
    this.totalScore += score;
    this.protectedPoints += protectedDelta;
    this.index += 1;
    if (this.index >= this.sequence.length) this.completed = true;

    return freezeResult({
      accepted: true,
      grade,
      hit,
      state: this.getState(),
      completed: this.completed,
      result: this.completed ? this.getResult() : null
    });
  }

  getResult() {
    const maxProtectedPoints = this.sequence.reduce((total, threat) => total + threat.intensity * 20, 0);
    const averageScore = this.hits.length ? this.totalScore / this.hits.length : 0;
    return freezeResult({
      type: "ROLE_RESULT",
      role: HEALER_ROLE,
      seed: this.seed,
      threats_total: this.sequence.length,
      hits: this.hits,
      score: this.totalScore,
      accuracy: Math.round(averageScore),
      protectedPoints: this.protectedPoints,
      healingTier: healingTier(this.protectedPoints, maxProtectedPoints),
      success: this.protectedPoints > 0,
      deterministic: true
    });
  }

  _reject(reason) {
    const rejection = Object.freeze({ accepted: false, reason, state: this.getState() });
    this.rejectedInputs.push(reason);
    return rejection;
  }
}
