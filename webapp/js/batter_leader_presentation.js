import { BatterRenderer } from "./batter_renderer.js";
import { timingRingProgress, timingRingRadius } from "./timing_ring.js";

export class BatterLeaderPresentation {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError("BatterLeaderPresentation requires a root element");
    this.root = root;
    this.renderer = new BatterRenderer();
    this.lastGrade = "READY";
  }

  render({ state, elapsedMs = 0, lastGrade = this.lastGrade, result = null } = {}) {
    this.lastGrade = lastGrade || "READY";
    const opportunity = state?.current_opportunity || null;
    const progress = opportunity ? timingRingProgress(elapsedMs) : 1;
    const radius = opportunity ? timingRingRadius(elapsedMs) : 34;
    const displayResult = result
      ? `<strong>${result.timingTier}</strong><span>${result.score} SCORE · ${result.impactPoints} IMPACT</span>`
      : `<strong>${this.lastGrade}</strong><span>${state?.score ?? 0} SCORE · ${state?.impact_points ?? 0} IMPACT</span>`;

    this.root.innerHTML = `
      <section class="batter-demo-card" aria-label="Batter Leader">
        <header><span class="batter-kicker">STUDENT 4v4 // BATTER</span><h1>CLASH SWING</h1></header>
        <div class="batter-status"><span>ATTEMPT ${Math.min((state?.current_index ?? 0) + 1, state?.total_attempts ?? 0)} / ${state?.total_attempts ?? 0}</span><span>SEED ${state?.seed ?? "-"}</span></div>
        <div class="batter-field">
          <canvas data-batter-canvas width="640" height="420" aria-label="Batter field"></canvas>
          <div class="batter-timing" style="--ring-radius:${Math.round(radius)}px; --ring-progress:${progress.toFixed(3)}">
            <div class="batter-ring"></div><div class="batter-target"></div>
          </div>
          <div class="batter-grade">${this.lastGrade}</div>
        </div>
        <div class="batter-controls">
          <button type="button" data-batter-swing ${opportunity ? "" : "disabled"}>SWING</button>
          <button type="button" data-batter-restart>RESTART</button>
        </div>
        <div class="batter-result">${displayResult}</div>
      </section>
    `;

    const canvas = this.root.querySelector("[data-batter-canvas]");
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#070a12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.renderer.draw(ctx, canvas.width, canvas.height, { anchorX: 190, anchorY: 330, scale: 0.9 });
      ctx.fillStyle = "rgba(0,240,255,0.18)";
      ctx.fillRect(350, 260, 210, 2);
      ctx.fillStyle = "rgba(255,0,190,0.9)";
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.fillText("CLASH", 470, 245);
    }
  }

  update(deltaSeconds = 0) {
    this.renderer.update(deltaSeconds);
  }

  triggerSwing() {
    if (this.renderer.getState() === "FOLLOW_THROUGH") {
      this.renderer.setState("IDLE");
    }
    return this.renderer.beginWindup();
  }

  bind({ onSwing, onRestart } = {}) {
    this.root.querySelector("[data-batter-swing]")?.addEventListener("click", () => onSwing?.());
    this.root.querySelector("[data-batter-restart]")?.addEventListener("click", () => onRestart?.());
  }
}
