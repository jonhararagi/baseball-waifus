import { timingRingRadius, timingRingProgress } from "./timing_ring.js";

export class BufferEnergyCreatorPresentation {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError("BufferEnergyCreatorPresentation requires a root element");
    this.root = root;
  }

  render({ state, elapsedMs = 0, lastGrade = "", result = null } = {}) {
    const note = state?.current_note || null;
    const elapsed = Math.max(0, Number(elapsedMs) || 0);
    const progress = note ? timingRingProgress(elapsed) : 1;
    const radius = note ? timingRingRadius(elapsed) : 34;
    const lanes = ["LIGHT", "MEDIUM", "HEAVY"].map((lane) => `
      <button class="buffer-lane" type="button" data-buffer-lane="${lane}" ${note ? "" : "disabled"}>
        <span>${lane}</span>
      </button>
    `).join("");
    const resultPanel = result
      ? `<div class="buffer-result"><strong>${result.energy_tier}</strong><span>${result.score} SCORE · ${result.energy_points} ENERGY</span></div>`
      : `<div class="buffer-result"><strong>${lastGrade || "READY"}</strong><span>${state?.score ?? 0} SCORE · ${state?.energy_points ?? 0} ENERGY</span></div>`;

    this.root.innerHTML = `
      <section class="buffer-demo-card" aria-label="Buffer Energy Creator">
        <header><span class="buffer-kicker">STUDENT 4v4 // BUFFER</span><h1>ENERGY CREATOR</h1></header>
        <div class="buffer-status"><span>NOTE ${Math.min((state?.current_index ?? 0) + 1, state?.total_notes ?? 0)} / ${state?.total_notes ?? 0}</span><span>SEED ${state?.seed ?? "-"}</span></div>
        <div class="buffer-field">
          <div class="buffer-ring" style="--ring-radius:${Math.round(radius)}px; --ring-progress:${progress.toFixed(3)}">
            <div class="buffer-target"></div>
            <div class="buffer-note">${note ? note.lane : "DONE"}</div>
          </div>
        </div>
        <div class="buffer-lanes" role="group" aria-label="Buffer lanes">${lanes}</div>
        ${resultPanel}
        <button class="buffer-restart" type="button" data-buffer-restart>RESTART</button>
      </section>
    `;
  }

  bind({ onLane, onRestart } = {}) {
    this.root.querySelectorAll("[data-buffer-lane]").forEach((button) => {
      button.addEventListener("click", () => onLane?.(button.dataset.bufferLane));
    });
    this.root.querySelector("[data-buffer-restart]")?.addEventListener("click", () => onRestart?.());
  }
}
