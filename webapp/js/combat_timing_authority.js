const DEFAULT_GREAT_WINDOW_MS = 55;
const DEFAULT_HIT_WINDOW_MS = 135;

function safeWindow(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function resolveTiming({
  elapsedMs,
  targetMs,
  greatWindowMs = DEFAULT_GREAT_WINDOW_MS,
  hitWindowMs = DEFAULT_HIT_WINDOW_MS,
  timingGraceMs = 0,
  source = "",
  round = 1,
  tacticalEffectiveness = 0,
  bossHpBefore = 0
} = {}) {
  const elapsed = Number(elapsedMs);
  const target = Number(targetMs);
  const rawDeltaMs = elapsed - target;
  const graceMs = Math.max(0, Number(timingGraceMs) || 0);
  const effectiveDeltaMs = Math.max(0, Math.abs(rawDeltaMs) - graceMs);
  const deltaMs = effectiveDeltaMs === 0
    ? 0
    : Math.sign(rawDeltaMs) * effectiveDeltaMs;
  const greatWindow = safeWindow(greatWindowMs, DEFAULT_GREAT_WINDOW_MS);
  const hitWindow = safeWindow(hitWindowMs, DEFAULT_HIT_WINDOW_MS);
  const absoluteDelta = Math.abs(deltaMs);

  const grade = absoluteDelta <= greatWindow
    ? "GREAT"
    : absoluteDelta <= hitWindow
      ? "HIT"
      : "MISS";

  return Object.freeze({
    grade,
    delta_ms: Math.round(deltaMs),
    elapsed_ms: Math.round(elapsed),
    target_ms: targetMs,
    great_window_ms: Math.round(greatWindow),
    hit_window_ms: Math.round(hitWindow),
    source,
    round,
    tactical_effectiveness: Math.round(Number(tacticalEffectiveness) || 0),
    boss_hp_before: Math.round(Number(bossHpBefore) || 0)
  });
}
