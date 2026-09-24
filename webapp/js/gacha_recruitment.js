import { SCAVENGER_SCRAP_COST } from "./gacha_controller.js";

const LABEL = { R: "COMÚN", SR: "RARA", SSR: "ÉPICA", UR: "LEGENDARIA" };
const CLASS = { R: "gacha-r", SR: "gacha-sr", SSR: "gacha-ssr", UR: "gacha-ur" };

export class GachaRecruitmentUI {
  constructor({ root, controller, onResult = null } = {}) {
    this.root = root; this.controller = controller; this.onResult = onResult; this.busy = false;
    this.scrap = root?.querySelector("#gacha-recruit-scrap");
    this.status = root?.querySelector("#gacha-recruit-status");
    this.stage = root?.querySelector("#gacha-reveal-stage");
    this.results = root?.querySelector("#gacha-results");
    this.one = root?.querySelector("#gacha-recruit-1");
    this.ten = root?.querySelector("#gacha-recruit-10");
    this.one?.addEventListener("click", () => this.pull(1));
    this.ten?.addEventListener("click", () => this.pull(10));
    root?.querySelector("#gacha-recruit-close")?.addEventListener("click", () => this.close());
    root?.addEventListener("click", (e) => { if (e.target === root) this.close(); });
  }
  open() { this.root?.removeAttribute("hidden"); requestAnimationFrame(() => this.root?.classList.add("is-open")); this.refresh(); this.clear(); }
  close() { if (this.busy) return; this.root?.classList.remove("is-open"); setTimeout(() => { if (!this.root?.classList.contains("is-open")) this.root?.setAttribute("hidden", ""); }, 180); }
  refresh() {
    const scrap = Number(this.controller?.getStatus?.().scavenger_scrap) || 0;
    if (this.scrap) this.scrap.textContent = scrap.toLocaleString("es-AR");
    if (this.one) this.one.disabled = this.busy || scrap < SCAVENGER_SCRAP_COST;
    if (this.ten) this.ten.disabled = this.busy || scrap < SCAVENGER_SCRAP_COST * 10;
  }
  clear() { if (this.results) this.results.innerHTML = ""; if (this.stage) { this.stage.className = "gacha-reveal-stage"; this.stage.innerHTML = ""; } if (this.status) this.status.textContent = "SELECCIONA UNA RECLUTACIÓN"; }
  async pull(count) {
    if (this.busy || !this.controller?.ready) return;
    this.busy = true; this.refresh(); this.stage?.classList.add("is-opening");
    if (this.status) this.status.textContent = count === 10 ? "ABRIENDO 10 CÁPSULAS..." : "ABRIENDO CÁPSULA...";
    try {
      const payload = count === 10 ? await this.controller.rollGachaTen() : { count: 1, results: [await this.controller.rollGacha()] };
      this.render(payload.results || []); this.onResult?.(payload);
    } catch (error) {
      if (this.status) this.status.textContent = String(error?.message || error).toUpperCase();
    } finally { this.busy = false; this.stage?.classList.remove("is-opening"); this.refresh(); }
  }
  render(results) {
    if (!this.results) return;
    this.results.innerHTML = "";
    for (const [index, result] of results.entries()) {
      const ch = result.character || {}, c = ch.canonical || {}, rarity = String(result.rarity || c.rarity || "R").toUpperCase();
      const card = document.createElement("article"); card.className = "gacha-result-card " + (CLASS[rarity] || CLASS.R); card.style.setProperty("--gacha-delay", index * 45 + "ms");
      const art = document.createElement("div"); art.className = "gacha-result-art";
      const url = c.visual?.card_hd_url || c.visual?.card_url || ch.pollinations?.card_hd_url || "";
      if (url) { const img = document.createElement("img"); img.src = url; img.alt = c.display_name || ch.character_id || "Waifu"; art.appendChild(img); } else art.textContent = "⚾";
      const stats = c.stats || c.base_stats || ch.stats || {};
      const meta = document.createElement("div"); meta.className = "gacha-result-meta";
      meta.innerHTML = "<span class='gacha-rarity'>" + (LABEL[rarity] || rarity) + "</span><strong class='gacha-character-name'>" + (c.display_name || ch.character_id || "UNKNOWN") + "</strong><span class='gacha-character-role'>" + (c.role || c.archetype || "WAIFU") + "</span><div class='gacha-stats'>" +
        ["power","contact","speed","eye"].map(k => "<span>" + k.slice(0,3).toUpperCase() + " <b>" + Number(stats[k] ?? c[k] ?? 0) + "</b></span>").join("") + "</div>";
      card.append(art, meta); this.results.appendChild(card);
    }
    const best = results.reduce((a,b) => ({R:0,SR:1,SSR:2,UR:3}[b.rarity] || 0) > ({R:0,SR:1,SSR:2,UR:3}[a?.rarity] || 0) ? b : a, results[0]);
    if (this.status) this.status.textContent = results.length > 1 ? "RECLUTAMIENTO COMPLETO // " + results.length + " WAIFUS" : (LABEL[best?.rarity] || "RECLUTA") + " // " + (best?.character?.canonical?.display_name || "UNKNOWN");
    this.stage?.classList.add("is-revealed");
  }
}
