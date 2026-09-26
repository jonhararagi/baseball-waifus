const DEFAULT_THEME = Object.freeze({ header: "#0b0b0f", background: "#0b0b0f" });

export class TelegramNativeBridge {
  constructor({ telegram = globalThis?.window?.Telegram, leaderboard = null } = {}) {
    this.telegram = telegram || null;
    this.webApp = this.telegram?.WebApp || null;
    this.leaderboard = leaderboard;
    this.userId = null;
  }

  init() {
    const app = this.webApp;
    if (!app) return null;
    try {
      app.ready?.();
      app.expand?.();
      app.setHeaderColor?.(DEFAULT_THEME.header);
      app.setBackgroundColor?.(DEFAULT_THEME.background);
      if (app.setBottomBarColor) app.setBottomBarColor(DEFAULT_THEME.background);
    } catch {}
    this.userId = this.getUserId();
    if (this.userId != null) this.leaderboard?.setPlayerIdentity?.(this.userId, this.getUserName());
    return app;
  }

  getUserId() {
    const id = this.webApp?.initDataUnsafe?.user?.id;
    return id == null ? null : String(id);
  }

  getUserName() {
    const user = this.webApp?.initDataUnsafe?.user;
    return user?.first_name || user?.username || "PLAYER";
  }

  getThemeParams() {
    return { ...(this.webApp?.themeParams || {}) };
  }

  isAvailable() { return Boolean(this.webApp); }
  getCloudStorage() { return this.webApp?.CloudStorage || null; }
  getHapticFeedback() { return this.webApp?.HapticFeedback || null; }
  getBackButton() { return this.webApp?.BackButton || null; }
}

export function createTelegramNativeBridge(options = {}) {
  const bridge = new TelegramNativeBridge(options);
  bridge.init();
  return bridge;
}
