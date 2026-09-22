function resolveWebApp(webApp = null) {
  return webApp || globalThis?.window?.Telegram?.WebApp || null;
}

export class TelegramHapticsBridge {
  constructor(webApp = null) {
    this.webApp = resolveWebApp(webApp);
    this.haptics = this.webApp?.HapticFeedback || null;
  }

  isAvailable() { return Boolean(this.haptics); }

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
    switch (String(event || "").toLowerCase()) {
      case "ui_confirm": return this.selectionChanged();
      case "single_hit":
      case "hit": return this.impactOccurred("light");
      case "home_run":
      case "gacha_ssr":
      case "gacha_ur": return this.impactOccurred("heavy");
      case "combat_error":
      case "foul":
      case "timing_bad": return this.notificationOccurred("error");
      default: return false;
    }
  }
}

export function createHapticsBridge(webApp = null) {
  return new TelegramHapticsBridge(webApp);
}