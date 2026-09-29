export const BUFFER_ROLE = "BUFFER";
export const BUFFER_GRADES = Object.freeze(["PERFECT", "GREAT", "GOOD", "MISS"]);
export const BUFFER_LANES = Object.freeze(["LIGHT", "MEDIUM", "HEAVY"]);

const LANE_POWER = Object.freeze({ LIGHT: 10, MEDIUM: 20, HEAVY: 30 });
const GRADE_SCORE = Object.freeze({ PERFECT: 100, GREAT: 75, GOOD: 50, MISS: 0 });
const GRADE_MULTIPLIER = Object.freeze({ PERFECT: 1, GREAT: 0.75, GOOD: 0.5, MISS: 0 });
const ENERGY_TIER_THRESHOLDS = Object.freeze({ MEDIUM: 60, HEAVY: 120 });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed) {
  const text = String(seed ?? "BUFFER-001");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function laneFor(seed, index) {
  const mixed = Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b9), 0x85ebca6b) >>> 0;
  return BUFFER_LANES[mixed % BUFFER_LANES.length];
}

export function createBufferSequence(seed = "BUFFER-001", count = 6, spacingMs = 650) {
  const normalizedSeed = normalizeSeed(seed);
  const safeCount = clamp(Math.trunc(Number(count) || 0), 1, 32);
  const safeSpacing = clamp(Number(spacingMs) || 650, 200, 5000);
  return Object.freeze(Array.from({ length: safeCount }, (_, index) => Object.freeze({
    id: `buffer-note-${index + 1}`,
    index,
    lane: laneFor(normalizedSeed, index),
    target_ms: 500 + index * safeSpacing,
    perfect_window_ms: 45,
    great_window_ms: 95,
    good_window_ms: 160
  })));
}

export function classifyBufferTiming(deltaMs, note) {
  const delta = Math.abs(Number(deltaMs));
  if (!Number.isFinite(delta) || !note) return "MISS";
  if (delta <= note.perfect_window_ms) return "PERFECT";
  if (delta <= note.great_window_ms) return "GREAT";
  if (delta <= note.good_window_ms) return "GOOD";
  return "MISS";
}

function calculateEnergyDelta(lane, grade) {
  return Math.round(LANE_POWER[lane] * GRADE_MULTIPLIER[grade]);
}

function freezeResult(result) {
  return Object.freeze(JSON.parse(JSON.stringify(result)));
}

export class BufferEnergyCreator {
  constructor({ seed = "BUFFER-001", count = 6, spacingMs = 650, sequence = null } = {}) {
    this.seed = String(seed);
    this.sequence = sequence ? Object.freeze(sequence.map((note) => Object.freeze({ ...note }))) : createBufferSequence(this.seed, count, spacingMs);
    this.reset();
  }

  reset() {
    this.index = 0;
    this.completed = false;
    this.hits = [];
    this.totalScore = 0;
    this.energyPoints = 0;
    this.rejectedInputs = [];
    return this.getState();
  }

  start() {
    this.reset();
    return this.getState();
  }

  getCurrentNote() {
    return this.completed ? null : this.sequence[this.index] || null;
  }

  getState() {
    return Object.freeze({
      role: BUFFER_ROLE,
      seed: this.seed,
      active: !this.completed,
      completed: this.completed,
      current_index: this.index,
      total_notes: this.sequence.length,
      current_note: this.getCurrentNote(),
      score: this.totalScore,
      energy_points: this.energyPoints
    });
  }

  submitInput({ noteId, timestampMs, lane } = {}) {
    if (this.completed) return this._reject("POST_COMPLETION");
    const current = this.getCurrentNote();
    if (!current) {
      this.completed = true;
      return this._reject("NO_ACTIVE_NOTE");
    }
    if (String(noteId || "") !== current.id) return this._reject("INVALID_NOTE");
    if (lane !== undefined && !BUFFER_LANES.includes(String(lane).toUpperCase())) {
      return this._reject("INVALID_LANE");
    }
    if (!Number.isFinite(Number(timestampMs))) return this._reject("INVALID_TIMESTAMP");

    const normalizedLane = lane === undefined ? current.lane : String(lane).toUpperCase();
    const laneMatches = normalizedLane === current.lane;
    const deltaMs = Number(timestampMs) - current.target_ms;
    const grade = laneMatches ? classifyBufferTiming(deltaMs, current) : "MISS";
    const score = GRADE_SCORE[grade];
    const energyDelta = calculateEnergyDelta(current.lane, grade);
    const hit = Object.freeze({
      note_id: current.id,
      lane: current.lane,
      input_lane: normalizedLane,
      lane_match: laneMatches,
      target_ms: current.target_ms,
      input_ms: Number(timestampMs),
      delta_ms: Math.round(deltaMs),
      grade,
      score,
      energy_delta: energyDelta
    });

    this.hits.push(hit);
    this.totalScore += score;
    this.energyPoints += energyDelta;
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
    const averageScore = this.hits.length ? this.totalScore / this.hits.length : 0;
    const energyTier = this.energyPoints >= ENERGY_TIER_THRESHOLDS.HEAVY
      ? "HEAVY"
      : this.energyPoints >= ENERGY_TIER_THRESHOLDS.MEDIUM
        ? "MEDIUM"
        : "LIGHT";
    return freezeResult({
      type: "ROLE_RESULT",
      role: BUFFER_ROLE,
      seed: this.seed,
      notes_total: this.sequence.length,
      hits: this.hits,
      score: this.totalScore,
      accuracy: Math.round(averageScore),
      energy_points: this.energyPoints,
      energy_tier: energyTier,
      success: this.energyPoints > 0,
      deterministic: true
    });
  }

  _reject(reason) {
    const rejection = Object.freeze({ accepted: false, reason, state: this.getState() });
    this.rejectedInputs.push(reason);
    return rejection;
  }
}
