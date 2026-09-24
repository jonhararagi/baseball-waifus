export const TIMING_RING_DURATION_MS = 860;
export const TIMING_RING_TARGET_MS = 720;
export const TIMING_GREAT_WINDOW_MS = 55;
export const TIMING_HIT_WINDOW_MS = 135;
export const TIMING_RING_MAX_RADIUS = 128;
export const TIMING_RING_TARGET_RADIUS = 34;

export function classifyTimingDelta(deltaMs) {
  const absoluteDelta = Math.abs(Number(deltaMs));
  if (!Number.isFinite(absoluteDelta)) return "MISS";
  if (absoluteDelta <= TIMING_GREAT_WINDOW_MS) return "GREAT";
  if (absoluteDelta <= TIMING_HIT_WINDOW_MS) return "HIT";
  return "MISS";
}

export function timingRingProgress(elapsedMs) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  return Math.min(1, elapsed / TIMING_RING_TARGET_MS);
}

export function timingRingRadius(elapsedMs) {
  const progress = timingRingProgress(elapsedMs);
  return TIMING_RING_TARGET_RADIUS
    + (TIMING_RING_MAX_RADIUS - TIMING_RING_TARGET_RADIUS) * (1 - progress);
}

export function localResultForTimingGrade(grade) {
  switch (String(grade || "").toUpperCase()) {
    case "GREAT":
      return "HOME_RUN";
    case "HIT":
      return "HIT";
    default:
      return "STRIKE";
  }
}
