import { MobileHaptics } from "./mobile_haptics.js";

function resolveWebApp(webApp = null) {
  return webApp || globalThis?.window?.Telegram?.WebApp || null;
}

export class TelegramHapticsBridge {
  constructor(webApp = null, { mobileHaptics = null } = {}) {
    this.webApp = resolveWebApp(webApp);
    this.haptics = this.webApp?.HapticFeedback || null;
    this.mobileHaptics = mobileHaptics || new MobileHaptics();
  }

  isAvailable() {
    return Boolean(this.haptics || this.mobileHaptics?.isAvailable?.());
  }

  impactOccurred(style = "light") {
    try {
      this.haptics?.impactOccurred?.(style);
      return Boolean(this.haptics);
    } catch { return false; }
  }

  notificationOccurred(type = "error") {
    try {
      this.haptics?.notificationOccurred?.(type);
      return Boolean(this.haptics);
    } catch { return false; }
  }

  selectionChanged() {
    try {
      this.haptics?.selectionChanged?.();
      return Boolean(this.haptics);
    } catch { return false; }
  }

  handleGameEvent(event) {
    const normalized = String(event || "").toLowerCase();

    switch (normalized) {
      case "ui_confirm":
        return this.selectionChanged();
      case "perfect":
        this.mobileHaptics?.handleGameEvent?.("perfect");
        return this.impactOccurred("heavy");
      case "single_hit":
      case "hit":
      case "good":
        this.mobileHaptics?.handleGameEvent?.("good");
        return this.impactOccurred("light");
      case "home_run": {
        this.mobileHaptics?.handleGameEvent?.("home_run");
        this.notificationOccurred("success");
        this.impactOccurred("heavy");
        if (typeof window !== "undefined" && this.haptics) {
          window.setTimeout(() => this.impactOccurred("light"), 180);
          window.setTimeout(() => this.impactOccurred("heavy"), 360);
          window.setTimeout(() => this.impactOccurred("light"), 540);
        }
        return Boolean(this.haptics || this.mobileHaptics?.isAvailable?.());
      }
      case "swing":
        this.mobileHaptics?.handleGameEvent?.("swing");
        return this.impactOccurred("light");
      case "miss":
        this.mobileHaptics?.handleGameEvent?.("miss");
        return this.notificationOccurred("error");
      case "combat_error":
      case "foul":
      case "timing_bad":
        return this.notificationOccurred("error");
      default:
        return false;
    }
  }
}

export function createHapticsBridge(webApp = null, options = {}) {
  return new TelegramHapticsBridge(webApp, options);
}