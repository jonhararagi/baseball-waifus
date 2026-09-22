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

export { DEFAULT_INVOICE_TABLE_KEY };
