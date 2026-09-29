export function buildDebufferPresentationModel({ state, result = null, lastGrade = "" } = {}) {
  const target = state?.current_target || null;
  return Object.freeze({
    target,
    grade: result?.debuffTier || lastGrade || "READY",
    disruptionPoints: result?.disruptionPoints ?? state?.disruption_points ?? 0,
    score: result?.score ?? state?.score ?? 0,
    completed: Boolean(state?.completed),
    index: Math.min((state?.current_index ?? 0) + 1, state?.total_targets ?? 0),
    total: state?.total_targets ?? 0
  });
}

export class DebufferDisruptorPresentation {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError("DebufferDisruptorPresentation requires a root element");
    this.root = root;
  }

  render({ state, result = null, lastGrade = "" } = {}) {
    const model = buildDebufferPresentationModel({ state, result, lastGrade });
    const target = model.target;
    const targetMarkup = target
      ? `<div class="debuffer-target" style="left:${target.x * 100}%;top:${target.y * 100}%" aria-label="${target.type}"><span>${target.type}</span></div>`
      : "";
    const resultPanel = result
      ? `<div class="debuffer-result"><strong>${result.debuffTier}</strong><span>${result.score} SCORE · ${result.disruptionPoints} DISRUPTION</span></div>`
      : `<div class="debuffer-result"><strong>${model.grade}</strong><span>${model.score} SCORE · ${model.disruptionPoints} DISRUPTION</span></div>`;

    this.root.innerHTML = `
      <style>
        .debuffer-demo-card{width:min(760px,94vw);padding:24px;border:1px solid #ff3df2;background:#0b1020;color:#e9f8ff;font-family:Arial,sans-serif;box-shadow:0 0 30px #ff3df233;box-sizing:border-box}
        .debuffer-demo-card header{display:flex;align-items:end;justify-content:space-between;gap:16px}.debuffer-kicker{font-size:12px;letter-spacing:.16em;color:#ff3df2}.debuffer-demo-card h1{margin:4px 0 0;font-size:28px}.debuffer-status{display:flex;justify-content:space-between;margin:18px 0;color:#9eb4c7;font-size:12px}
        .debuffer-field{position:relative;height:340px;background:radial-gradient(circle at center,#15122b 0,#070a13 62%);border:1px solid #262e4a;overflow:hidden}.debuffer-field:before{content:"DISRUPTION FIELD";position:absolute;inset:12px;color:#34405c;font-size:10px;letter-spacing:.18em}.debuffer-target{position:absolute;transform:translate(-50%,-50%);width:74px;height:74px;border:2px solid #ff3df2;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 28px #ff3df255;animation:debuffer-pulse .9s ease-in-out infinite alternate}.debuffer-target:after{content:"";position:absolute;inset:10px;border:1px dashed #00eaff;border-radius:50%}.debuffer-target span{position:relative;z-index:1;font-size:9px;font-weight:800;color:#fff}.debuffer-crosshair{position:absolute;left:50%;top:50%;width:130px;height:130px;transform:translate(-50%,-50%);border:1px dashed #00eaff;border-radius:50%;opacity:.5}.debuffer-meter{height:12px;margin-top:12px;border:1px solid #00eaff;background:#070a13}.debuffer-meter-fill{height:100%;width:var(--meter);background:#00eaff;box-shadow:0 0 12px #00eaff88}.debuffer-actions{display:flex;gap:8px;margin-top:12px}.debuffer-capture,.debuffer-restart{flex:1;border:1px solid #00eaff;background:#11192b;color:#e9f8ff;padding:13px;font-weight:800;letter-spacing:.06em;cursor:pointer}.debuffer-restart{border-color:#ff3df2}.debuffer-result{display:flex;justify-content:space-between;gap:12px;padding:15px;margin-top:12px;border-left:3px solid #ff3df2;background:#111525}.debuffer-result strong{color:#ff3df2}@keyframes debuffer-pulse{from{transform:translate(-50%,-50%) scale(.92)}to{transform:translate(-50%,-50%) scale(1.06)}}@media(max-width:500px){.debuffer-demo-card{padding:16px}.debuffer-demo-card header{display:block}.debuffer-field{height:270px}.debuffer-result{display:block}.debuffer-result span{display:block;margin-top:6px}}
      </style>
      <section class="debuffer-demo-card" aria-label="Debuffer Disruptor">
        <header><span class="debuffer-kicker">STUDENT 4v4 // DEBUFFER</span><h1>DISRUPTOR</h1></header>
        <div class="debuffer-status"><span>TARGET ${model.index} / ${model.total}</span><span>SEED ${state?.seed ?? "-"}</span></div>
        <div class="debuffer-field">
          <div class="debuffer-crosshair"></div>
          ${targetMarkup}
        </div>
        <div class="debuffer-meter"><div class="debuffer-meter-fill" style="--meter:${Math.min(100, model.disruptionPoints)}%"></div></div>
        <div class="debuffer-actions">
          <button class="debuffer-capture" type="button" data-debuffer-capture ${target ? "" : "disabled"}>CAPTURE</button>
          <button class="debuffer-restart" type="button" data-debuffer-restart>RESTART</button>
        </div>
        ${resultPanel}
      </section>
    `;
  }

  bind({ onCapture, onRestart } = {}) {
    this.root.querySelector("[data-debuffer-capture]")?.addEventListener("click", () => onCapture?.());
    this.root.querySelector("[data-debuffer-restart]")?.addEventListener("click", () => onRestart?.());
  }
}
