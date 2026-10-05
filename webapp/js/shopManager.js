const DEFAULT_INVOICES_KEY = "__BASEBALL_WAIFUS_INVOICES__";

function getTelegramWebApp(explicit) { return explicit || null; }

function resolveInvoiceUrl(id, explicitUrl = null, root = globalThis) {
  if (explicitUrl) return String(explicitUrl);
  const table = root?.window?.[DEFAULT_INVOICES_KEY] || root?.[DEFAULT_INVOICES_KEY];
  return String(table?.[id] || "");
}

export class ShopManager {
  constructor({ webApp = null, telegramBridge = null, invoiceUrls = {}, onStatus = null } = {}) {
    this.telegramBridge = telegramBridge || null;
    this.webApp = getTelegramWebApp(webApp);
    this.invoiceUrls = { ...invoiceUrls };
    this.onStatus = onStatus;
  }

  setWebApp(webApp) { this.webApp = getTelegramWebApp(webApp); return this; }
  setTelegramBridge(telegramBridge) { this.telegramBridge = telegramBridge || null; return this; }

  async openInvoice(id, { invoiceUrl = null, onPaid = null, onCancelled = null } = {}) {
    const url = invoiceUrl || this.invoiceUrls[id] || resolveInvoiceUrl(id);
    const openInvoice = this.telegramBridge?.openInvoice
      ? (invoice, callback) => this.telegramBridge.openInvoice(invoice, callback)
      : this.webApp?.openInvoice
        ? (invoice, callback) => { try { this.webApp.openInvoice(invoice, callback); return true; } catch { return false; } }
        : null;
    if (!openInvoice || !url) {
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
      try { if (!openInvoice(url, finish)) finish("failed"); } catch { finish("failed"); }
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
