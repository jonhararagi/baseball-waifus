export const DEBUFFER_ROLE = "DEBUFFER";
export const DEBUFFER_GRADES = Object.freeze(["PERFECT", "GREAT", "GOOD", "MISS"]);
export const DEBUFF_TARGET_TYPES = Object.freeze(["ORB", "SHARD", "CORE"]);

const GRADE_SCORE = Object.freeze({ PERFECT: 100, GREAT: 75, GOOD: 50, MISS: 0 });
const GRADE_MULTIPLIER = Object.freeze({ PERFECT: 1, GREAT: 0.75, GOOD: 0.5, MISS: 0 });
const DISRUPTION_POWER = Object.freeze({ ORB: 20, SHARD: 25, CORE: 30 });
const DEBUFF_THRESHOLDS = Object.freeze({ WEAK: 0.25, STRONG: 0.6 });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function normalizeSeed(seed) {
  const text = String(seed ?? "DEBUFFER-001");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix(seed, index, salt) {
  return Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b9), salt) >>> 0;
}

export function createDebufferTargetSequence(seed = "DEBUFFER-001", count = 6, spacingMs = 700) {
  const normalizedSeed = normalizeSeed(seed);
  const safeCount = clamp(Math.trunc(Number(count) || 0), 1, 24);
  const safeSpacing = clamp(Number(spacingMs) || 700, 300, 5000);
  return Object.freeze(Array.from({ length: safeCount }, (_, index) => {
    const x = 0.15 + (mix(normalizedSeed, index, 0x85ebca6b) % 7000) / 10000;
    const y = 0.15 + (mix(normalizedSeed, index, 0xc2b2ae35) % 7000) / 10000;
    const type = DEBUFF_TARGET_TYPES[mix(normalizedSeed, index, 0x27d4eb2f) % DEBUFF_TARGET_TYPES.length];
    const intensity = 1 + (mix(normalizedSeed, index, 0x165667b1) % 3);
    return Object.freeze({
      id: `debuffer-target-${index + 1}`,
      index,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      target_ms: 500 + index * safeSpacing,
      perfect_window_ms: 45,
      great_window_ms: 95,
      good_window_ms: 160,
      interaction_window_ms: 220,
      intensity,
      type,
      active: true,
      resolved: false
    });
  }));
}

export function classifyDebufferTiming(deltaMs, target) {
  const delta = Math.abs(Number(deltaMs));
  if (!Number.isFinite(delta) || !target) return "MISS";
  if (delta <= target.perfect_window_ms) return "PERFECT";
  if (delta <= target.great_window_ms) return "GREAT";
  if (delta <= target.good_window_ms) return "GOOD";
  return "MISS";
}

function distanceSquared(aX, aY, bX, bY) {
  const dx = Number(aX) - Number(bX);
  const dy = Number(aY) - Number(bY);
  return dx * dx + dy * dy;
}

function calculateDisruptionPoints(target, grade) {
  return Math.round(DISRUPTION_POWER[target.type] * target.intensity * GRADE_MULTIPLIER[grade]);
}

function debuffTier(points, maxPoints) {
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= DEBUFF_THRESHOLDS.STRONG) return "STRONG";
  if (ratio >= DEBUFF_THRESHOLDS.WEAK) return "WEAK";
  if (points > 0) return "MINOR";
  return "FAILED";
}

function freezeResult(result) { return Object.freeze(JSON.parse(JSON.stringify(result))); }

export class DebufferDisruptor {
  constructor({ seed = "DEBUFFER-001", count = 6, spacingMs = 700, sequence = null } = {}) {
    this.seed = String(seed);
    this.sequence = sequence
      ? Object.freeze(sequence.map((target) => Object.freeze({ ...target })))
      : createDebufferTargetSequence(this.seed, count, spacingMs);
    this.reset();
  }

  reset() {
    this.index = 0;
    this.completed = false;
    this.captures = [];
    this.totalScore = 0;
    this.disruptionPoints = 0;
    this.rejectedInputs = [];
    this.resolvedTargetIds = new Set();
    return this.getState();
  }

  start() { return this.reset(); }

  getCurrentTarget() {
    if (this.completed) return null;
    const target = this.sequence[this.index] || null;
    return target ? Object.freeze({ ...target, active: true, resolved: false }) : null;
  }

  getState() {
    return Object.freeze({
      role: DEBUFFER_ROLE,
      seed: this.seed,
      active: !this.completed,
      completed: this.completed,
      current_index: this.index,
      total_targets: this.sequence.length,
      current_target: this.getCurrentTarget(),
      score: this.totalScore,
      disruption_points: this.disruptionPoints,
      rejected_inputs: this.rejectedInputs.length
    });
  }

  submitInput({ targetId, x, y, timestampMs } = {}) {
    if (this.completed) return this._reject("POST_COMPLETION");

    const requestedId = String(targetId || "");
    if (this.resolvedTargetIds.has(requestedId)) return this._reject("TARGET_ALREADY_RESOLVED");

    const current = this.getCurrentTarget();
    if (!current) return this._reject("NO_ACTIVE_TARGET");
    if (requestedId !== current.id) return this._reject("INVALID_TARGET");
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return this._reject("INVALID_POSITION");
    if (Number(x) < 0 || Number(x) > 1 || Number(y) < 0 || Number(y) > 1) return this._reject("INVALID_POSITION");
    if (!Number.isFinite(Number(timestampMs))) return this._reject("INVALID_TIMESTAMP");

    const deltaMs = Number(timestampMs) - current.target_ms;
    const absoluteDelta = Math.abs(deltaMs);
    if (absoluteDelta > current.interaction_window_ms) return this._reject("OUT_OF_RANGE");

    const distance = Math.sqrt(distanceSquared(x, y, current.x, current.y));
    const positionTolerance = 0.12;
    if (distance > positionTolerance) return this._reject("OUT_OF_RANGE");

    const grade = classifyDebufferTiming(deltaMs, current);
    const score = GRADE_SCORE[grade];
    const disruptionDelta = calculateDisruptionPoints(current, grade);
    const capture = Object.freeze({
      target_id: current.id,
      type: current.type,
      target_x: current.x,
      target_y: current.y,
      input_x: Number(x),
      input_y: Number(y),
      target_ms: current.target_ms,
      input_ms: Number(timestampMs),
      delta_ms: Math.round(deltaMs),
      distance: Number(distance.toFixed(6)),
      grade,
      score,
      intensity: current.intensity,
      disruption_points: disruptionDelta
    });

    this.captures.push(capture);
    this.resolvedTargetIds.add(current.id);
    this.totalScore += score;
    this.disruptionPoints += disruptionDelta;
    this.index += 1;
    if (this.index >= this.sequence.length) this.completed = true;

    return freezeResult({
      accepted: true,
      grade,
      capture,
      state: this.getState(),
      completed: this.completed,
      result: this.completed ? this.getResult() : null
    });
  }

  getResult() {
    const maxDisruptionPoints = this.sequence.reduce(
      (total, target) => total + DISRUPTION_POWER[target.type] * target.intensity,
      0
    );
    const averageScore = this.captures.length ? this.totalScore / this.captures.length : 0;
    return freezeResult({
      type: "ROLE_RESULT",
      role: DEBUFFER_ROLE,
      seed: this.seed,
      targetsTotal: this.sequence.length,
      captures: this.captures,
      score: this.totalScore,
      accuracy: Math.round(averageScore),
      disruptionPoints: this.disruptionPoints,
      debuffTier: debuffTier(this.disruptionPoints, maxDisruptionPoints),
      success: this.disruptionPoints > 0,
      deterministic: true
    });
  }

  _reject(reason) {
    const rejection = Object.freeze({ accepted: false, reason, state: this.getState() });
    this.rejectedInputs.push(reason);
    return rejection;
  }
}
