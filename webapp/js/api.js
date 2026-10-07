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
    throw new ApiRequestError(detail, {
      status: Number(response.status) || null,
      code: typeof payload === "object" ? payload?.error || null : null,
      payload
    });
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

  init() { if (!this.webApp) return false; this.ready(); this.expand(); this.setHeaderColor("#0b0b0f"); this.setBackgroundColor("#0b0b0f"); this.setBottomBarColor("#0b0b0f"); return true; }

  getUser() {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  getStartParam() { return this.webApp?.initDataUnsafe?.start_param || ""; }
  getUserId() { const id=this.getUser()?.id; return id == null ? null : String(id); }
  getUserName() { const user=this.getUser(); return user?.first_name || user?.username || "PLAYER"; }
  getInitData() { return typeof this.webApp?.initData === "string" ? this.webApp.initData : ""; }
  getThemeParams() { return { ...(this.webApp?.themeParams || {}) }; }
  getHapticFeedback() { return this.webApp?.HapticFeedback || null; }
  getBackButton() { return this.webApp?.BackButton || null; }
  getIsExpanded() { return this.webApp?.isExpanded !== false; }
  ready() { try { this.webApp?.ready?.(); } catch {} return Boolean(this.webApp); }
  expand() { try { this.webApp?.expand?.(); } catch {} return Boolean(this.webApp); }
  setHeaderColor(c) { try { this.webApp?.setHeaderColor?.(String(c)); } catch {} return Boolean(this.webApp?.setHeaderColor); }
  setBackgroundColor(c) { try { this.webApp?.setBackgroundColor?.(String(c)); } catch {} return Boolean(this.webApp?.setBackgroundColor); }
  setBottomBarColor(c) { try { this.webApp?.setBottomBarColor?.(String(c)); } catch {} return Boolean(this.webApp?.setBottomBarColor); }
  onEvent(n,h) { try { this.webApp?.onEvent?.(String(n),h); } catch {} return Boolean(this.webApp?.onEvent); }
  openInvoice(u,cb) { if(!this.webApp?.openInvoice||!u)return false; try{this.webApp.openInvoice(String(u),cb);return true;}catch{return false;} }
  switchInlineQuery(q) { if(!this.webApp?.switchInlineQuery)return false; try{this.webApp.switchInlineQuery(String(q||""));return true;}catch{return false;} }
  openTelegramLink(u) { if(!this.webApp?.openTelegramLink||!u)return false; try{this.webApp.openTelegramLink(String(u));return true;}catch{return false;} }

  isNativeRuntime() {
    const initData = this.getInitData();
    return typeof initData === "string" && initData.trim().length > 0;
  }

  getCloudStorage() {
    if (!this.isNativeRuntime()) return null;
    return this.webApp?.CloudStorage || null;
  }

  sendData(payload) {
    if (!this.webApp || typeof this.webApp.sendData !== "function") {
      return false;
    }

    this.webApp.sendData(JSON.stringify(payload));
    return true;
  }
}

export class ApiRequestError extends Error {
  constructor(message, { status = null, code = null, payload = null } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.payload = payload;
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

  async createPendingPurchase(productId, idempotencyKey = "") {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const product = String(productId || "").trim();
    if (!product) throw new Error("productId is required");
    const headers = {
      ...this._headers(),
      "content-type": "application/json"
    };
    if (idempotencyKey) headers["Idempotency-Key"] = String(idempotencyKey);
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ product_id: product })
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPendingPurchaseDTO(payload)) throw new Error("Invalid pending purchase response");
    return payload;
  }

  async createPurchaseInvoice(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id + "/invoice",
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: "{}"
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseInvoiceDTO(payload)) throw new Error("Invalid purchase invoice response");
    return payload;
  }

  async claimPurchase(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id + "/claim",
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: "{}"
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseClaimDTO(payload)) throw new Error("Invalid purchase claim response");
    return payload;
  }

  async applyPurchaseGrant(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id + "/apply",
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: "{}"
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseApplyDTO(payload)) throw new Error("Invalid purchase grant application response");
    return payload;
  }

  async getPurchaseStatus(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id,
      {
        method: "GET",
        headers: this._headers()
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseStatusDTO(payload)) throw new Error("Invalid purchase status response");
    return payload;
  }

  async claimPurchase(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id + "/claim",
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: "{}"
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseClaimDTO(payload)) throw new Error("Invalid purchase claim response");
    return payload;
  }

  async applyPurchaseGrant(purchaseId) {
    if (!this.configured()) throw new Error("Purchase API base URL is not configured");
    const id = encodeURIComponent(String(purchaseId || ""));
    if (!id) throw new Error("purchaseId is required");
    const response = await requestWithTimeout(
      this.baseUrl + "/v1/purchases/" + id + "/apply",
      {
        method: "POST",
        headers: {
          ...this._headers(),
          "content-type": "application/json"
        },
        body: "{}"
      },
      this.timeoutMs
    );
    const payload = await parseResponse(response);
    if (!isPurchaseApplyDTO(payload)) throw new Error("Invalid purchase grant application response");
    return payload;
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

    const initData = this.telegramBridge?.getInitData?.();
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


const PURCHASE_STATUSES = Object.freeze([
  "PENDING",
  "AUTHORIZED_GRANT",
  "GRANT_CLAIMED",
  "GRANT_ALREADY_CLAIMED",
  "GRANT_APPLIED",
  "GRANT_ALREADY_APPLIED"
]);

const PURCHASE_CLAIM_STATUSES = Object.freeze([
  "GRANT_CLAIMED",
  "GRANT_ALREADY_CLAIMED"
]);

const PURCHASE_APPLY_STATUSES = Object.freeze([
  "GRANT_APPLIED",
  "GRANT_ALREADY_APPLIED"
]);

export function isPendingPurchaseDTO(payload) {
  return Boolean(
    isObject(payload)
    && payload.status === "PENDING"
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.product_id === "string"
    && payload.product_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.currency === "string"
    && Number.isFinite(Number(payload.amount))
  );
}

export function isPurchaseInvoiceDTO(payload) {
  return Boolean(
    isObject(payload)
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.invoice_payload === "string"
    && /^https:\/\//.test(String(payload.invoice_url || ""))
  );
}

export function isPurchaseStatusDTO(payload) {
  return Boolean(
    isObject(payload)
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && PURCHASE_STATUSES.includes(String(payload.status || ""))
  );
}

export { PURCHASE_STATUSES };

export function isPurchaseClaimDTO(payload) {
  return Boolean(
    isObject(payload)
    && PURCHASE_CLAIM_STATUSES.includes(String(payload.status || ""))
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.product_id === "string"
    && payload.product_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.grant_kind === "string"
    && Number.isFinite(Number(payload.grant_amount))
  );
}

export function isPurchaseApplyDTO(payload) {
  return Boolean(
    isObject(payload)
    && PURCHASE_APPLY_STATUSES.includes(String(payload.status || ""))
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.fulfillment_id === "string"
    && payload.fulfillment_id.length > 0
    && typeof payload.product_id === "string"
    && payload.product_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.grant_kind === "string"
    && Number.isFinite(Number(payload.grant_amount))
  );
}

export { PURCHASE_CLAIM_STATUSES, PURCHASE_APPLY_STATUSES };

export function isPurchaseClaimDTO(payload) {
  return Boolean(
    isObject(payload)
    && PURCHASE_CLAIM_STATUSES.includes(String(payload.status || ""))
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.product_id === "string"
    && payload.product_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.grant_kind === "string"
    && Number.isFinite(Number(payload.grant_amount))
  );
}

export function isPurchaseApplyDTO(payload) {
  return Boolean(
    isObject(payload)
    && PURCHASE_APPLY_STATUSES.includes(String(payload.status || ""))
    && typeof payload.purchase_id === "string"
    && payload.purchase_id.length > 0
    && typeof payload.fulfillment_id === "string"
    && payload.fulfillment_id.length > 0
    && typeof payload.product_id === "string"
    && payload.product_id.length > 0
    && typeof payload.provider === "string"
    && typeof payload.grant_kind === "string"
    && Number.isFinite(Number(payload.grant_amount))
  );
}

export { PURCHASE_CLAIM_STATUSES, PURCHASE_APPLY_STATUSES };
