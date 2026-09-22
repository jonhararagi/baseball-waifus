export const GAME_MODES = Object.freeze(["PRACTICE", "ENDLESS"]);
export const BIOMES = Object.freeze(["cyberpunk", "beach", "volcano", "forest"]);

const HIT_RESULTS = new Set(["SINGLE", "DOUBLE", "TRIPLE", "HIT"]);
const POWER_RESULTS = new Set(["HOME_RUN"]);
const DEFAULTS = Object.freeze({
  PRACTICE: { base_pitch_speed: 1, speed_growth: 0, base_score: 0 },
  ENDLESS: { base_pitch_speed: 1, speed_growth: 0.08, base_score: 100 }
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMode(mode) {
  const value = String(mode || "PRACTICE").toUpperCase();
  return GAME_MODES.includes(value) ? value : "PRACTICE";
}

function normalizeBiome(biome) {
  const value = String(biome || "cyberpunk").toLowerCase();
  return BIOMES.includes(value) ? value : "cyberpunk";
}

export class GameModeManager {
  constructor({
    recordSink = null,
    basePitchSpeed = 1,
    speedGrowth = 0.08
  } = {}) {
    this.recordSink = recordSink;
    this.basePitchSpeed = Math.max(0.01, Number(basePitchSpeed) || 1);
    this.speedGrowth = Math.max(0, Number(speedGrowth) || 0.08);
    this.state = this._fresh("PRACTICE", "cyberpunk");
  }

  start(mode = "PRACTICE", biome = "cyberpunk") {
    const normalizedMode = normalizeMode(mode);
    const normalizedBiome = normalizeBiome(biome);
    this.state = this._fresh(normalizedMode, normalizedBiome);
    return this.getState();
  }

  registerResult(result) {
    const normalized = String(result || "").toUpperCase();
    const hit = HIT_RESULTS.has(normalized);
    const homeRun = POWER_RESULTS.has(normalized);

    if (!hit && !homeRun) {
      return this.getState();
    }

    this.state.total_hits += 1;
    if (homeRun) this.state.home_runs += 1;

    const scoreGain = homeRun ? DEFAULTS.ENDLESS.base_score * 3 : DEFAULTS.ENDLESS.base_score;
    this.state.score += scoreGain;

    if (this.state.mode === "ENDLESS") {
      this.state.difficulty_step += 1;
      this.state.pitch_speed = this._calculatePitchSpeed(this.state.difficulty_step);
      this.state.pitch_speed_multiplier = this.state.pitch_speed / this.basePitchSpeed;
      this.state.current_combo = Math.max(1, this.state.current_combo + 1);
    } else {
      this.state.current_combo = 0;
    }

    this.state.last_result = normalized;

    if (this.state.score > this.state.high_score) {
      this.state.high_score = this.state.score;
      this.recordSink?.(this.state.biome, {
        high_score: this.state.high_score,
        best_hits: this.state.total_hits,
        best_home_runs: this.state.home_runs
      });
    }

    return this.getState();
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getPitchSpeed() {
    return this.state.pitch_speed;
  }

  getScore() {
    return this.state.score;
  }

  isPractice() {
    return this.state.mode === "PRACTICE";
  }

  isEndless() {
    return this.state.mode === "ENDLESS";
  }

  _calculatePitchSpeed(step) {
    return Number(
      (this.basePitchSpeed * (1 + (this.speedGrowth * Math.max(0, Number(step) || 0)))).toFixed(4)
    );
  }

  _fresh(mode, biome) {
    const defaults = DEFAULTS[mode];
    return {
      mode,
      biome,
      score: 0,
      high_score: 0,
      total_hits: 0,
      home_runs: 0,
      current_combo: 0,
      difficulty_step: 0,
      pitch_speed: defaults.base_pitch_speed * this.basePitchSpeed,
      pitch_speed_multiplier: 1,
      last_result: null
    };
  }
}

export { normalizeMode, normalizeBiome };
