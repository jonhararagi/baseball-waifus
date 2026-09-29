import { timingRingRadius, timingRingProgress } from "./timing_ring.js";

export function buildHealerPresentationModel({ state, elapsedMs = 0, lastGrade = "", result = null } = {}) {
  const threat = state?.current_threat || null;
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const delta = threat ? elapsed - threat.target_ms : 0;
  return Object.freeze({
    threat,
    ringRadius: threat ? timingRingRadius(Math.abs(delta)) : 34,
    ringProgress: threat ? timingRingProgress(Math.abs(delta)) : 1,
    grade: result?.healingTier || lastGrade || "READY",
    protectedPoints: result?.protectedPoints ?? state?.protected_points ?? 0,
    score: result?.score ?? state?.score ?? 0,
    completed: Boolean(state?.completed),
    index: Math.min((state?.current_index ?? 0) + 1, state?.total_threats ?? 0),
    total: state?.total_threats ?? 0
  });
}

export class HealerDefensivePresentation {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError("HealerDefensivePresentation requires a root element");
    this.root = root;
  }

  render({ state, elapsedMs = 0, lastGrade = "", result = null } = {}) {
    const model = buildHealerPresentationModel({ state, elapsedMs, lastGrade, result });
    const threat = model.threat;
    const zones = ["TOP", "LEFT", "RIGHT", "BOTTOM"].map((zone) => {
      const active = threat?.zone === zone;
      const position = {
        TOP: "left:50%;top:18%",
        LEFT: "left:18%;top:50%",
        RIGHT: "left:82%;top:50%",
        BOTTOM: "left:50%;top:82%"
      }[zone];
      return `<div class="healer-zone ${active ? "is-active" : ""}" style="${position}" aria-label="${zone}">${active ? "IMPACT" : ""}</div>`;
    }).join("");

    const resultPanel = result
      ? `<div class="healer-result"><strong>${result.healingTier}</strong><span>${result.score} SCORE · ${result.protectedPoints} PROTECTED</span></div>`
      : `<div class="healer-result"><strong>${model.grade}</strong><span>${model.score} SCORE · ${model.protectedPoints} PROTECTED</span></div>`;

    this.root.innerHTML = `
      <style>
        .healer-demo-card{width:min(760px,94vw);padding:24px;border:1px solid #00eaff;background:#0b1020;color:#e9f8ff;font-family:Arial,sans-serif;box-shadow:0 0 30px #00eaff33;box-sizing:border-box}
        .healer-demo-card header{display:flex;align-items:end;justify-content:space-between;gap:16px}.healer-kicker{font-size:12px;letter-spacing:.16em;color:#00eaff}.healer-demo-card h1{margin:4px 0 0;font-size:28px}.healer-status{display:flex;justify-content:space-between;margin:18px 0;color:#9eb4c7;font-size:12px}
        .healer-field{position:relative;height:340px;background:#070a13;border:1px solid #262e4a;overflow:hidden}.healer-shield{position:absolute;left:50%;top:50%;width:230px;height:230px;transform:translate(-50%,-50%);border:3px solid #00eaff;border-radius:50%;box-shadow:0 0 28px #00eaff55}.healer-shield:after{content:"SHIELD";position:absolute;inset:0;display:grid;place-items:center;color:#00eaff;font-weight:800;letter-spacing:.16em;font-size:12px}.healer-zone{position:absolute;transform:translate(-50%,-50%);width:68px;height:68px;border:2px dashed #ff3df2;border-radius:50%;display:grid;place-items:center;font-size:9px;color:#ff3df2;box-sizing:border-box}.healer-zone.is-active{background:#ff3df222;box-shadow:0 0 24px #ff3df2aa;border-style:solid;color:#fff}.healer-ring{position:absolute;left:50%;top:50%;width:112px;height:112px;transform:translate(-50%,-50%);border:2px solid #ff3df2;border-radius:50%;pointer-events:none}.healer-ring:after{content:"";position:absolute;left:50%;top:50%;width:var(--ring-radius);height:var(--ring-radius);transform:translate(-50%,-50%);border:3px solid #00eaff;border-radius:50%;opacity:.85}.healer-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.healer-zone-button,.healer-restart{border:1px solid #00eaff;background:#11192b;color:#e9f8ff;padding:13px 6px;font-weight:800;letter-spacing:.06em;cursor:pointer}.healer-zone-button:hover,.healer-restart:hover{background:#17263f}.healer-restart{width:100%;margin-top:10px;border-color:#ff3df2}.healer-result{display:flex;justify-content:space-between;gap:12px;padding:15px;margin-top:12px;border-left:3px solid #ff3df2;background:#111525}.healer-result strong{color:#ff3df2}@media(max-width:500px){.healer-demo-card{padding:16px}.healer-demo-card header{display:block}.healer-field{height:270px}.healer-shield{width:190px;height:190px}.healer-actions{grid-template-columns:repeat(2,1fr)}.healer-result{display:block}.healer-result span{display:block;margin-top:6px}}
      </style>
      <section class="healer-demo-card" aria-label="Healer Defensive Support">
        <header><span class="healer-kicker">STUDENT 4v4 // HEALER</span><h1>DEFENSIVE SUPPORT</h1></header>
        <div class="healer-status"><span>THREAT ${model.index} / ${model.total}</span><span>SEED ${state?.seed ?? "-"}</span></div>
        <div class="healer-field">
          <div class="healer-shield"></div>
          ${zones}
          <div class="healer-ring" style="--ring-radius:${Math.round(model.ringRadius)}px;--ring-progress:${model.ringProgress.toFixed(3)}"></div>
        </div>
        <div class="healer-actions" role="group" aria-label="Healer zones">
          ${["TOP", "LEFT", "RIGHT", "BOTTOM"].map((zone) => `<button class="healer-zone-button" type="button" data-healer-zone="${zone}" ${threat ? "" : "disabled"}>${zone}</button>`).join("")}
        </div>
        ${resultPanel}
        <button class="healer-restart" type="button" data-healer-restart>RESTART</button>
      </section>
    `;
  }

  bind({ onZone, onRestart } = {}) {
    this.root.querySelectorAll("[data-healer-zone]").forEach((button) => {
      button.addEventListener("click", () => onZone?.(button.dataset.healerZone));
    });
    this.root.querySelector("[data-healer-restart]")?.addEventListener("click", () => onRestart?.());
  }
}
