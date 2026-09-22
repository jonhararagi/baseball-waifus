const DEFAULT_TIMEOUT_MS = 8000;

export const CHARACTER_FACTIONS = Object.freeze([
  "bosozoku_wild",
  "cyber_tech",
  "idol_sparkle",
  "tactical_milspec",
  "shadow_magic"
]);

function isCharacterRefDTO(value) {
  return Boolean(
    isObject(value)
    && typeof value.id === "string"
    && value.id.length > 0
    && typeof value.card_id === "string"
    && value.card_id.length > 0
    && typeof value.faction === "string"
    && CHARACTER_FACTIONS.includes(value.faction)
  );
}

async function requestWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string"
      ? payload
      : payload?.error || payload?.message || "Request failed";
    throw new Error(detail);
  }

  return payload;
}

export class TelegramBridge {
  constructor(telegram = window.Telegram) {
    this.telegram = telegram || null;
    this.webApp = this.telegram?.WebApp || null;
  }

  isAvailable() {
    return this.webApp !== null;
  }

  init() {
    if (!this.webApp) {
      return null;
    }

    this.webApp.ready();
    this.webApp.expand();
    return this.webApp;
  }

  getUser() {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  getStartParam() {
    return this.webApp?.initDataUnsafe?.start_param || "";
  }

  sendData(payload) {
    if (!this.webApp || typeof this.webApp.sendData !== "function") {
      return false;
    }

    this.webApp.sendData(JSON.stringify(payload));
    return true;
  }
}

export class BaseballWaifusApi {
  constructor({
    baseUrl = window.BASEBALL_WAIFUS_API_BASE_URL || "",
    telegramBridge = null,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = {}) {
    this.baseUrl = String(baseUrl || "").replace(/\/$/, "");
    this.telegramBridge = telegramBridge;
    this.timeoutMs = timeoutMs;
  }

  configured() {
    return this.baseUrl.length > 0;
  }

  async getCombatInit(matchId) {
    if (!this.configured()) {
      throw new Error("Combat API base URL is not configured");
    }

    const id = encodeURIComponent(String(matchId));
    const response = await requestWithTimeout(
      `${this.baseUrl}/v1/combat/${id}/init`,
      {
        method: "GET",
        headers: this._headers()
      },
      this.timeoutMs
    );

    return parseResponse(response);
  }

  async submitTurnAction(matchId, action) {
    if (!this.configured()) {
      throw new Error("Combat API base URL is not configured");
    }

    const id = encodeURIComponent(String(matchId));
    const response = await requestWithTimeout(
      `${this.baseUrl}/v1/combat/${id}/turn`,
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: JSON.stringify({
          match_id: String(matchId),
          action
        })
      },
      this.timeoutMs
    );

    return parseResponse(response);
  }

  _headers() {
    const headers = {
      accept: "application/json"
    };

    const initData = this.telegramBridge?.webApp?.initData;
    if (initData) {
      headers["x-telegram-init-data"] = initData;
    }

    return headers;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isCombatInitDTO(payload) {
  return Boolean(
    isObject(payload)
    && payload.type === "CombatInitDTO"
    && typeof payload.match_id === "string"
    && isObject(payload.state)
    && isObject(payload.home_team)
    && isObject(payload.away_team)
    && isCharacterRefDTO(payload.batter)
    && isCharacterRefDTO(payload.pitcher)
  );
}

export function isTurnResultDTO(payload) {
  return Boolean(
    isObject(payload)
    && payload.type === "TurnResultDTO"
    && typeof payload.turn_id === "string"
    && typeof payload.result === "string"
    && isObject(payload.state)
  );
}
