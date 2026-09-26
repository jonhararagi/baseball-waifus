import { requestScrapPurchase, EconomyBoostManager } from "./economy.js";

const PACKS = [
  { id: "scrap_5000", amount: 5000, stars: 50, label: "SCRAP x5.000" },
  { id: "scrap_25000", amount: 25000, stars: 200, label: "SCRAP x25.000" }
];
const BOOSTS = [
  { id: "scrap_multiplier", turns: 10, cost: 1000, label: "SCRAP RUSH x2", detail: "Duplica el Scrap de 10 resultados con recompensa" },
  { id: "focus", turns: 10, cost: 1500, label: "FOCUS +20ms", detail: "Amplía 20ms el margen efectivo del Timing Ring durante 10 bateos" }
];

export class ShopUI {
  constructor({ root, controller, webApp = null, shopManager = null, onBalanceChange = null } = {}) {
    this.root = root; this.controller = controller; this.webApp = webApp; this.shopManager = shopManager; this.onBalanceChange = onBalanceChange;
    this.boosts = new EconomyBoostManager();
    this.status = root?.querySelector("#shop-status"); this.scrap = root?.querySelector("#shop-scrap"); this.boostState = root?.querySelector("#shop-boost-state");
    root?.querySelector("#shop-close")?.addEventListener("click", () => this.close());
    root?.addEventListener("click", (e) => { if (e.target === root) this.close(); });
    root?.querySelectorAll("[data-shop-pack]")?.forEach((b) => b.addEventListener("click", () => this.buyPack(b.dataset.shopPack)));
    root?.querySelectorAll("[data-shop-boost]")?.forEach((b) => b.addEventListener("click", () => this.buyBoost(b.dataset.shopBoost)));
    this.render();
  }
  open() { this.root?.removeAttribute("hidden"); requestAnimationFrame(() => this.root?.classList.add("is-open")); this.render(); }
  close() { this.root?.classList.remove("is-open"); setTimeout(() => { if (!this.root?.classList.contains("is-open")) this.root?.setAttribute("hidden", ""); }, 180); }
  setStatus(text) { if (this.status) this.status.textContent = text; }
  render() {
    const scrap = this.controller?.getScavengerScrap?.() || 0;
    if (this.scrap) this.scrap.textContent = scrap.toLocaleString("es-AR");
    const state = this.boosts.getState();
    if (this.boostState) this.boostState.textContent = "RUSH: " + state.scrap_multiplier_turns + " turnos • FOCUS: " + state.focus_turns + " turnos";
    this.root?.querySelectorAll("[data-shop-boost]")?.forEach((button) => { button.disabled = scrap < Number(button.dataset.cost || 0); });
  }
  async buyPack(id) {
    const pack = PACKS.find((item) => item.id === id);
    if (!pack) return;
    this.setStatus("ABRIENDO INVOICE DE TELEGRAM STARS...");
    const result = this.shopManager ? await this.shopManager.buyScrapPack(pack.id) : await requestScrapPurchase(pack.amount, { webApp: this.webApp });
    if (!result.ok) { this.setStatus("COMPRA NO COMPLETADA // " + result.status.toUpperCase()); return; }
    this.controller?.addScrap?.(pack.amount);
    this.setStatus("+" + pack.amount.toLocaleString("es-AR") + " SCRAP // COMPRA CONFIRMADA");
    this.render(); this.onBalanceChange?.();
  }
  async buyBoost(id) {
    const boost = BOOSTS.find((item) => item.id === id);
    if (!boost) return;
    if (!this.shopManager) { this.setStatus("STARS SHOP UNAVAILABLE"); return; }
    this.setStatus("ABRIENDO INVOICE DE TELEGRAM STARS...");
    const result = await this.shopManager.buyBoost(boost.id);
    if (!result.ok) { this.setStatus("COMPRA NO COMPLETADA // " + result.status.toUpperCase()); return; }
    this.boosts.grant(boost.id, boost.turns);
    this.setStatus(boost.label + " ACTIVADO // STARS");
    this.render(); this.onBalanceChange?.();
  }
  getScrapMultiplier() { return this.boosts.getScrapMultiplier(); }
  getTimingGraceMs() { return this.boosts.getTimingGraceMs(); }
  consumeTurn() { const state = this.boosts.consumeTurn(); this.render(); return state; }
  consumeTimingTurn() { const state = this.boosts.consumeTimingTurn(); this.render(); return state; }
  consumeRewardTurn() { const state = this.boosts.consumeRewardTurn(); this.render(); return state; }
  getBoostState() { return this.boosts.getState(); }
}
