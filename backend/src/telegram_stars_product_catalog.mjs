const PRODUCTS = Object.freeze({
  scrap_5000: Object.freeze({ productId: "scrap_5000", amount: 50, currency: "XTR", provider: "telegram-stars", grantKind: "scrap", grantAmount: 5000 }),
  scrap_25000: Object.freeze({ productId: "scrap_25000", amount: 200, currency: "XTR", provider: "telegram-stars", grantKind: "scrap", grantAmount: 25000 })
});

export const TELEGRAM_STARS_PRODUCTS = PRODUCTS;

export function getTelegramStarsProduct(productId) {
  const id = String(productId || "").trim();
  return PRODUCTS[id] ? Object.freeze({ ...PRODUCTS[id] }) : null;
}
