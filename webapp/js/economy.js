const DEFAULT_INVOICE_TABLE_KEY = "__BASEBALL_WAIFUS_SCRAP_INVOICES__";

function resolveWindow() {
  return globalThis?.window || null;
}

export function isDevelopmentEnvironment() {
  const win = resolveWindow();
  if (win?.__BASEBALL_WAIFUS_DEV__ === true) return true;
  const hostname = String(win?.location?.hostname || "");
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "[::1]";
}

export function resolveScrapInvoiceUrl(amount, explicitUrl = null, root = globalThis) {
  if (explicitUrl) return String(explicitUrl);
  const win = root?.window || root;
  const table = win?.[DEFAULT_INVOICE_TABLE_KEY];
  const normalized = Math.max(0, Math.floor(Number(amount) || 0));
  if (!table || typeof table !== "object" || normalized <= 0) return "";
  return String(table[normalized] || "");
}

function simulateScrapPurchase(amount, onResult) {
  const result = {
    ok: true,
    status: "paid",
    simulated: true,
    amount
  };
  onResult?.(result);
  return Promise.resolve(result);
}

export async function requestScrapPurchase(amount, {
  webApp = null,
  invoiceUrl = null,
  onResult = null,
  devFallback = isDevelopmentEnvironment()
} = {}) {
  const normalized = Math.max(0, Math.floor(Number(amount) || 0));
  if (normalized <= 0) {
    return {
      ok: false,
      status: "invalid_amount",
      simulated: false,
      amount: normalized
    };
  }

  const telegram = webApp || resolveWindow()?.Telegram?.WebApp || null;
  const activeInvoiceUrl = resolveScrapInvoiceUrl(normalized, invoiceUrl, globalThis);

  if (telegram?.openInvoice && activeInvoiceUrl) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (status) => {
        if (settled) return;
        settled = true;
        const normalizedStatus = String(status || "unknown").toLowerCase();
        const result = {
          ok: normalizedStatus === "paid",
          status: normalizedStatus,
          simulated: false,
          amount: normalized
        };
        onResult?.(result);
        resolve(result);
      };
      try {
        telegram.openInvoice(activeInvoiceUrl, finish);
      } catch {
        finish("failed");
      }
    });
  }

  if (Boolean(devFallback)) {
    return simulateScrapPurchase(normalized, onResult);
  }

  const result = {
    ok: false,
    status: "invoice_unavailable",
    simulated: false,
    amount: normalized
  };
  onResult?.(result);
  return result;
}

export class EconomyBoostManager {
  constructor({ storage = globalThis.localStorage } = {}) {
    this.storage = storage;
    try { this.boosts = JSON.parse(this.storage?.getItem?.("baseball_waifus_shop_boosts_v1") || "{}") || {}; } catch { this.boosts = {}; }
    this.normalize();
  }
  normalize() {
    this.boosts.scrap_multiplier_turns = Math.max(0, Math.floor(Number(this.boosts.scrap_multiplier_turns) || 0));
    this.boosts.focus_turns = Math.max(0, Math.floor(Number(this.boosts.focus_turns) || 0));
  }
  getState() { this.normalize(); return { ...this.boosts }; }
  getScrapMultiplier() { return this.boosts.scrap_multiplier_turns > 0 ? 2 : 1; }
  getTimingGraceMs() { return this.boosts.focus_turns > 0 ? 20 : 0; }
  consumeTurn() {
    if (this.boosts.scrap_multiplier_turns > 0) this.boosts.scrap_multiplier_turns--;
    if (this.boosts.focus_turns > 0) this.boosts.focus_turns--;
    this._save();
    return this.getState();
  }
  grant(type, turns) {
    const n = Math.max(1, Math.floor(Number(turns) || 0));
    if (type === "scrap_multiplier") this.boosts.scrap_multiplier_turns += n;
    if (type === "focus") this.boosts.focus_turns += n;
    this._save();
    return this.getState();
  }
  clear() { this.boosts = { scrap_multiplier_turns: 0, focus_turns: 0 }; this._save(); }
  _save() { try { this.storage?.setItem?.("baseball_waifus_shop_boosts_v1", JSON.stringify(this.boosts)); } catch {} }
}
export { DEFAULT_INVOICE_TABLE_KEY };
