const PATTERNS = Object.freeze({
  strong: Object.freeze([100, 50, 100]),
  short: Object.freeze([50]),
  pulse: Object.freeze([15])
});

function resolveNavigator(navigatorRef = globalThis?.navigator) {
  return navigatorRef || null;
}

export class MobileHaptics {
  constructor({ navigatorRef = null } = {}) {
    this.navigator = resolveNavigator(navigatorRef);
    this.enabled = typeof this.navigator?.vibrate === "function";
    this.cleanups = new Set();
    this.lastPointerTapAt = 0;
  }

  isAvailable() {
    return this.enabled;
  }

  vibrate(pattern) {
    if (!this.enabled) return false;
    try {
      return Boolean(this.navigator.vibrate(pattern));
    } catch {
      return false;
    }
  }

  handleGameEvent(event) {
    switch (String(event || "").toLowerCase()) {
      case "perfect":
      case "home_run":
        return this.vibrate(PATTERNS.strong);
      case "good":
      case "hit":
      case "single_hit":
        return this.vibrate(PATTERNS.short);
      case "swing":
      case "miss":
        return this.vibrate(PATTERNS.pulse);
      default:
        return false;
    }
  }

  bindTapFeedback(target) {
    if (!target?.addEventListener) return () => {};
    const onPointerDown = (event) => {
      if (event?.pointerType && event.pointerType !== "touch" && event.pointerType !== "pen") return;
      const now = Date.now();
      if (now - this.lastPointerTapAt < 120) return;
      this.lastPointerTapAt = now;
      this.handleGameEvent("swing");
    };
    target.addEventListener("pointerdown", onPointerDown, { passive: true });
    const cleanup = () => target.removeEventListener("pointerdown", onPointerDown);
    this.cleanups.add(cleanup);
    return cleanup;
  }

  bindSwipe(target, callback, { threshold = 48 } = {}) {
    if (!target?.addEventListener || typeof callback !== "function") return () => {};

    let startX = 0;
    let startY = 0;
    let active = false;

    const onStart = (event) => {
      if (event?.pointerType && event.pointerType !== "touch") return;
      startX = Number(event.clientX || 0);
      startY = Number(event.clientY || 0);
      active = true;
    };

    const onEnd = (event) => {
      if (!active) return;
      active = false;
      const dx = Number(event.clientX || 0) - startX;
      const dy = Number(event.clientY || 0) - startY;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      callback({
        direction: dx < 0 ? "left" : "right",
        distance: Math.abs(dx),
        source: "touch"
      });
    };

    target.addEventListener("pointerdown", onStart, { passive: true });
    target.addEventListener("pointerup", onEnd, { passive: true });
    target.addEventListener("pointercancel", () => { active = false; }, { passive: true });

    const cleanup = () => {
      target.removeEventListener("pointerdown", onStart);
      target.removeEventListener("pointerup", onEnd);
    };
    this.cleanups.add(cleanup);
    return cleanup;
  }

  dispose() {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();
  }
}

export { PATTERNS };
