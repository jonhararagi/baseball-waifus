import { TIMING_GREAT_WINDOW_MS, TIMING_HIT_WINDOW_MS, TIMING_RING_TARGET_MS } from "./timing_ring.js";

export const BATTER_ROLE = "BATTER";
export const BATTER_GRADES = Object.freeze(["PERFECT", "GREAT", "GOOD", "MISS"]);
export const BATTER_TIMING = Object.freeze({
  PERFECT_WINDOW_MS: 25,
  GREAT_WINDOW_MS: TIMING_GREAT_WINDOW_MS,
  GOOD_WINDOW_MS: TIMING_HIT_WINDOW_MS,
  INTERACTION_WINDOW_MS: 220,
  TARGET_MS: TIMING_RING_TARGET_MS
});

const GRADE_SCORE = Object.freeze({ PERFECT: 100, GREAT: 75, GOOD: 50, MISS: 0 });
const IMPACT_POINTS = Object.freeze({ PERFECT: 100, GREAT: 75, GOOD: 50, MISS: 0 });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function normalizeSeed(seed) {
  const text = String(seed ?? "BATTER-001");
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

export function createBatterTimingSequence(seed = "BATTER-001", count = 4, spacingMs = 900) {
  const normalizedSeed = normalizeSeed(seed);
  const safeCount = clamp(Math.trunc(Number(count) || 0), 1, 12);
  const safeSpacing = clamp(Number(spacingMs) || 900, 450, 5000);
  return Object.freeze(Array.from({ length: safeCount }, (_, index) => Object.freeze({
    id: `batter-opportunity-${index + 1}`,
    index,
    target_ms: 500 + index * safeSpacing,
    perfect_window_ms: BATTER_TIMING.PERFECT_WINDOW_MS,
    great_window_ms: BATTER_TIMING.GREAT_WINDOW_MS,
    good_window_ms: BATTER_TIMING.GOOD_WINDOW_MS,
    interaction_window_ms: BATTER_TIMING.INTERACTION_WINDOW_MS,
    clash_phase: mix(normalizedSeed, index, 0x85ebca6b) % 2 === 0 ? "CENTER" : "EDGE"
  })));
}

export function classifyBatterTiming(deltaMs, opportunity) {
  const delta = Math.abs(Number(deltaMs));
  if (!Number.isFinite(delta) || !opportunity) return "MISS";
  if (delta <= opportunity.perfect_window_ms) return "PERFECT";
  if (delta <= opportunity.great_window_ms) return "GREAT";
  if (delta <= opportunity.good_window_ms) return "GOOD";
  return "MISS";
}

function calculateTimingTier(score, attempts) {
  if (!attempts) return "FAILED";
  const accuracy = score / attempts;
  if (accuracy >= 90) return "PERFECT";
  if (accuracy >= 65) return "GREAT";
  if (accuracy >= 40) return "GOOD";
  return "MISS";
}

function freezeResult(result) {
  return Object.freeze(JSON.parse(JSON.stringify(result)));
}

export class BatterLeader {
  constructor({ seed = "BATTER-001", count = 4, spacingMs = 900, sequence = null } = {}) {
    this.seed = String(seed);
    this.sequence = sequence
      ? Object.freeze(sequence.map((opportunity) => Object.freeze({ ...opportunity })))
      : createBatterTimingSequence(this.seed, count, spacingMs);
    this.reset();
  }

  reset() {
    this.index = 0;
    this.completed = false;
    this.hits = [];
    this.totalScore = 0;
    this.impactPoints = 0;
    this.rejectedInputs = [];
    this.resolvedOpportunityIds = new Set();
    return this.getState();
  }

  start() { return this.reset(); }

  getCurrentOpportunity() {
    if (this.completed) return null;
    const opportunity = this.sequence[this.index] || null;
    return opportunity ? Object.freeze({ ...opportunity, active: true, resolved: false }) : null;
  }

  getState() {
    return Object.freeze({
      role: BATTER_ROLE,
      seed: this.seed,
      active: !this.completed,
      completed: this.completed,
      current_index: this.index,
      total_attempts: this.sequence.length,
      current_opportunity: this.getCurrentOpportunity(),
      score: this.totalScore,
      impact_points: this.impactPoints,
      rejected_inputs: this.rejectedInputs.length
    });
  }

  submitInput({ opportunityId, timestampMs } = {}) {
    if (this.completed) return this._reject("POST_COMPLETION");

    const requestedId = String(opportunityId || "");
    if (this.resolvedOpportunityIds.has(requestedId)) return this._reject("OPPORTUNITY_ALREADY_RESOLVED");

    const current = this.getCurrentOpportunity();
    if (!current) return this._reject("NO_ACTIVE_OPPORTUNITY");
    if (requestedId !== current.id) return this._reject("INVALID_NOTE");
    if (!Number.isFinite(Number(timestampMs))) return this._reject("INVALID_TIMESTAMP");

    const deltaMs = Number(timestampMs) - current.target_ms;
    if (Math.abs(deltaMs) > current.interaction_window_ms) return this._reject("OUT_OF_WINDOW");

    const grade = classifyBatterTiming(deltaMs, current);
    const score = GRADE_SCORE[grade];
    const impactDelta = IMPACT_POINTS[grade];
    const hit = grade !== "MISS";
    const attempt = Object.freeze({
      opportunity_id: current.id,
      target_ms: current.target_ms,
      input_ms: Number(timestampMs),
      delta_ms: Math.round(deltaMs),
      grade,
      score,
      impact_points: impactDelta,
      hit,
      clash_phase: current.clash_phase
    });

    this.hits.push(attempt);
    this.resolvedOpportunityIds.add(current.id);
    this.totalScore += score;
    this.impactPoints += impactDelta;
    this.index += 1;
    if (this.index >= this.sequence.length) this.completed = true;

    return freezeResult({
      accepted: true,
      grade,
      hit: attempt,
      state: this.getState(),
      completed: this.completed,
      result: this.completed ? this.getResult() : null
    });
  }

  getResult() {
    const averageScore = this.hits.length ? this.totalScore / this.hits.length : 0;
    return freezeResult({
      type: "ROLE_RESULT",
      role: BATTER_ROLE,
      seed: this.seed,
      attempts: this.sequence.length,
      hits: this.hits,
      score: this.totalScore,
      accuracy: Math.round(averageScore),
      impactPoints: this.impactPoints,
      timingTier: calculateTimingTier(this.totalScore, this.hits.length),
      success: this.impactPoints > 0,
      deterministic: true
    });
  }

  _reject(reason) {
    return Object.freeze({ accepted: false, reason, state: this.getState() });
  }
}
