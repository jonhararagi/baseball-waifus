const DEFAULT_INVOICES_KEY = "__BASEBALL_WAIFUS_INVOICES__";

function getTelegramWebApp(explicit) {
  return explicit || globalThis?.window?.Telegram?.WebApp || null;
}

function resolveInvoiceUrl(id, explicitUrl = null, root = globalThis) {
  if (explicitUrl) return String(explicitUrl);
  const table = root?.window?.[DEFAULT_INVOICES_KEY] || root?.[DEFAULT_INVOICES_KEY];
  return String(table?.[id] || "");
}

export class ShopManager {
  constructor({ webApp = null, invoiceUrls = {}, onStatus = null } = {}) {
    this.webApp = getTelegramWebApp(webApp);
    this.invoiceUrls = { ...invoiceUrls };
    this.onStatus = onStatus;
  }

  setWebApp(webApp) { this.webApp = getTelegramWebApp(webApp); return this; }

  async openInvoice(id, { invoiceUrl = null, onPaid = null, onCancelled = null } = {}) {
    const url = invoiceUrl || this.invoiceUrls[id] || resolveInvoiceUrl(id);
    const telegram = this.webApp;
    if (!telegram?.openInvoice || !url) {
      const result = { ok: false, status: "invoice_unavailable", id };
      this.onStatus?.(result);
      return result;
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (status) => {
        if (settled) return;
        settled = true;
        const normalized = String(status || "unknown").toLowerCase();
        const result = { ok: normalized === "paid", status: normalized, id };
        this.onStatus?.(result);
        if (result.ok) onPaid?.(result);
        else onCancelled?.(result);
        resolve(result);
      };
      try { telegram.openInvoice(url, finish); } catch { finish("failed"); }
    });
  }

  async buyScrapPack(id, options = {}) {
    return this.openInvoice(id, options);
  }

  async buyBoost(id, options = {}) {
    return this.openInvoice(id, options);
  }
}

export { DEFAULT_INVOICES_KEY };
