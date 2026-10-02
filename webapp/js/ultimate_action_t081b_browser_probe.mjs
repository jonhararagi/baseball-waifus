import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { extname, join, normalize, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const SITE_DIR = resolve(process.env.T072_SITE_DIR || "webapp");
const EVIDENCE_DIR = resolve(
  process.env.T072_EVIDENCE_DIR
  || join("browser-evidence", "T081-B", process.env.GITHUB_SHA || "local", process.env.GITHUB_RUN_ID || "local")
);
const BROWSER_BIN = process.env.BROWSER_BIN;
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon"
});

function requireCondition(condition, message, data = undefined) {
  if (!condition) {
    const suffix = data === undefined ? "" : " " + JSON.stringify(data);
    throw new Error("T081-B ASSERTION FAILED: " + message + suffix);
  }
}

mkdirSync(EVIDENCE_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function waitFor(condition, { timeoutMs = 20000, intervalMs = 25, label = "condition" } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await condition();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error("T081-B TIMEOUT: " + label);
}

async function startServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const raw = decodeURIComponent(String(req.url || "/").split("?")[0]);
      const requested = raw === "/" ? "/index.html" : raw;
      const filePath = resolve(root, "." + normalize(requested));
      const rel = relative(root, filePath);
      if (rel.startsWith("..") || rel.includes(".." + "\\") || rel.includes("../")) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error("not file");
      res.setHeader("Content-Type", MIME[extname(filePath).toLowerCase()] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      res.statusCode = 200;
      res.end(await readFile(filePath));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  requireCondition(address && typeof address === "object", "server address missing");
  return { server, baseUrl: "http://127.0.0.1:" + address.port + "/" };
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (!payload.id) return;
      const pending = this.pending.get(payload.id);
      if (!pending) return;
      this.pending.delete(payload.id);
      payload.error
        ? pending.reject(new Error(payload.error.message || "CDP error"))
        : pending.resolve(payload.result);
    });
    await new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP websocket open timeout")), 10000);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolvePromise();
      }, { once: true });
      this.ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP websocket error"));
      }, { once: true });
    });
  }

  async send(method, params = {}) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error("CDP timeout: " + method));
      }, 20000);
    });
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result?.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime exception");
  }
  return result?.result?.value;
}

async function click(cdp, selector) {
  const box = await evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el || el.disabled) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  requireCondition(box, "click target unavailable: " + selector);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const output = join(EVIDENCE_DIR, name + ".png");
  writeFileSync(output, Buffer.from(result.data, "base64"));
  return output;
}

async function freePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.listen(0, "127.0.0.1", resolvePromise);
    server.once("error", reject);
  });
  const address = server.address();
  const port = address.port;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  return port;
}

async function runtime(cdp) {
  return evaluate(cdp, `(() => {
    const canvas = document.querySelector('#gameCanvas');
    return {
      visible: Boolean(canvas?.getBoundingClientRect().width > 0 && canvas?.getBoundingClientRect().height > 0),
      phase: canvas?.dataset?.combatStageUltimatePhase || '',
      sequenceKind: canvas?.dataset?.combatStageUltimateSequenceKind || '',
      canvasHudSuppressed: canvas?.dataset?.combatStageUltimateHudSuppressed === 'true',
      active: canvas?.dataset?.combatStageUltimateActive === 'true',
      actionComplete: canvas?.dataset?.combatStageUltimateActionComplete === 'true',
      result: canvas?.dataset?.combatStageUltimateResult || '',
      damage: canvas?.dataset?.combatStageUltimateDamage || '',
      characterState: canvas?.dataset?.combatStageCharacterState || '',
      projectileSource: canvas?.dataset?.combatStageProjectileContract || '',
      projectileTarget: canvas?.dataset?.combatStageProjectileTarget || '',
      projectileTravel: canvas?.dataset?.combatStageProjectileTravel || '',
      cameraAnchor: canvas?.dataset?.combatPresentationCameraAnchor || '',
      cameraSource: canvas?.dataset?.combatPresentationCameraSource || '',
      timingFeedbackVisible: Boolean(document.querySelector('#timing-feedback')?.classList.contains('is-visible')),
      characterCardVisible: (() => {
        const el = document.querySelector('#active-waifu-card');
        if (!el) return false;
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && Number(style.opacity) > 0;
      })(),
      cinematicHud: {
        rootActive: document.querySelector('#app-container')?.classList.contains('is-cinematic-ultimate') || false,
        scoreboardDisplay: getComputedStyle(document.querySelector('.scoreboard-overlay'))?.display || '',
        matchStripDisplay: getComputedStyle(document.querySelector('.match-strip'))?.display || '',
        footerDisplay: getComputedStyle(document.querySelector('footer.cyber-footer'))?.display || ''
      }
    };
  })()`);
}

async function main() {
  requireCondition(BROWSER_BIN, "BROWSER_BIN missing");
  requireCondition(existsSync(SITE_DIR), "site directory missing");

  const { server, baseUrl } = await startServer(SITE_DIR);
  const port = await freePort();
  const browser = spawn(BROWSER_BIN, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--autoplay-policy=no-user-gesture-required",
    "--remote-allow-origins=*",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=" + String(port),
    "--user-data-dir=" + mkdtempSync(join(tmpdir(), "t081b-chrome-")),
    "about:blank"
  ], { stdio: "ignore" });

  let cdp;
  const exceptions = [];
  const timeline = [];
  const samples = [];
  const screenshots = {};

  try {
    const version = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + port + "/json/version")).json(); } catch { return null; }
    }, { label: "Chrome /json/version" });
    const targets = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + port + "/json/list")).json(); } catch { return null; }
    }, { label: "Chrome page target" });
    const page = targets.find((item) => item.type === "page") || targets[0];
    requireCondition(version?.webSocketDebuggerUrl && page?.webSocketDebuggerUrl, "CDP target unavailable");

    cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    cdp.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (payload.method === "Runtime.exceptionThrown") exceptions.push(payload.params?.exceptionDetails || null);
    });

    await cdp.send("Page.navigate", { url: baseUrl + "?qa=t081" });
    await waitFor(async () => (await evaluate(cdp, "document.readyState")) === "complete", { label: "document ready" });
    await waitFor(async () => evaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"), { label: "home visible" });
    await click(cdp, ".home-action-play");
    await waitFor(async () => {
      const s = await runtime(cdp);
      return s.visible && await evaluate(cdp, "typeof window.__BW_T081_TRIGGER_ULTIMATE__ === 'function'");
    }, { label: "combat and T081 hook ready" });

    const baseline = await evaluate(cdp, "window.__BW_T081B_GET_RUNTIME__()");
    screenshots.formation = await screenshot(cdp, "t081b-01-formation");

    await evaluate(cdp, "window.__BW_T081_TRIGGER_ULTIMATE__()");
    await waitFor(async () => (await runtime(cdp)).phase === "ULTIMATE_ACTION_PREP", { label: "ultimate action prep" });
    const prep = await runtime(cdp);
    timeline.push(prep.phase);
    samples.push(prep);
    screenshots.prep = await screenshot(cdp, "t081b-02-action-prep");

    const continued = await evaluate(cdp, `window.__BW_T081B_CONTINUE_ULTIMATE__({
      result: "HIT",
      damage: 24,
      actionType: "ULTIMATE_ACTION"
    })`);
    requireCondition(continued?.phase === "ULTIMATE_ACTION", "ultimate did not continue into action", continued);

    const actionDeadline = Date.now() + 4000;
    while (Date.now() < actionDeadline) {
      const state = await runtime(cdp);
      if (state.phase && timeline.at(-1) !== state.phase) {
        timeline.push(state.phase);
        samples.push(state);
        if (state.phase === "ULTIMATE_ACTION") screenshots.action = await screenshot(cdp, "t081b-03-action");
        if (state.phase === "ULTIMATE_IMPACT") screenshots.impact = await screenshot(cdp, "t081b-04-impact");
        if (state.phase === "ULTIMATE_REACTION") screenshots.reaction = await screenshot(cdp, "t081b-05-reaction");
        if (state.phase === "ULTIMATE_RETURN") screenshots.return = await screenshot(cdp, "t081b-06-return");
      }
      if (state.phase === "ULTIMATE_COMPLETE" && !state.active) break;
      await sleep(20);
    }

    const action = samples.find((entry) => entry.phase === "ULTIMATE_ACTION");
    const impact = samples.find((entry) => entry.phase === "ULTIMATE_IMPACT");
    const reaction = samples.find((entry) => entry.phase === "ULTIMATE_REACTION");
    const returned = samples.find((entry) => entry.phase === "ULTIMATE_RETURN");
    const complete = await runtime(cdp);
    const finalRuntime = await evaluate(cdp, "window.__BW_T081B_GET_RUNTIME__()");

    requireCondition(timeline.includes("ULTIMATE_ACTION_PREP"), "prep phase missing", timeline);
    requireCondition(timeline.includes("ULTIMATE_ACTION"), "action phase missing", timeline);
    requireCondition(timeline.includes("ULTIMATE_IMPACT"), "impact phase missing", timeline);
    requireCondition(timeline.includes("ULTIMATE_REACTION"), "reaction phase missing", timeline);
    requireCondition(timeline.includes("ULTIMATE_RETURN"), "return phase missing", timeline);
    requireCondition(timeline.includes("ULTIMATE_COMPLETE"), "complete phase missing", timeline);

    requireCondition(action?.characterState === "SWING" || action?.characterState === "FOLLOW_THROUGH", "BatterRenderer did not enter action state", action);
    requireCondition(action?.projectileSource === "BAT_TO_PROJECTILE", "ultimate projectile did not use BAT_TO_PROJECTILE", action);
    requireCondition(action?.projectileTarget === "IMPACT", "ultimate projectile target anchor missing", action);
    requireCondition(impact?.cameraAnchor === "IMPACT", "impact camera anchor missing", impact);
    requireCondition(reaction?.cameraAnchor === "REACTION" && reaction?.cameraSource === "ACTOR", "reaction camera anchor missing", reaction);
    requireCondition(returned?.cameraAnchor === "RETURN", "return camera anchor missing", returned);
    requireCondition(complete.actionComplete === true && complete.active === false, "ultimate did not cleanly complete", complete);
    requireCondition(
      complete?.cinematicHud?.rootActive === false
      && complete?.cinematicHud?.scoreboardDisplay !== "none"
      && complete?.cinematicHud?.matchStripDisplay !== "none"
      && complete?.cinematicHud?.footerDisplay !== "none"
      && complete?.canvasHudSuppressed === false,
      "HUD did not recover after Ultimate completion",
      complete
    );

    requireCondition(
      action?.timingFeedbackVisible === false && action?.characterCardVisible === false,
      "cinematic HUD obscured ultimate action",
      action
    );
    requireCondition(
      action?.cinematicHud?.rootActive === true
      && action?.cinematicHud?.scoreboardDisplay === "none"
      && action?.cinematicHud?.matchStripDisplay === "none"
      && action?.cinematicHud?.footerDisplay === "none"
      && action?.canvasHudSuppressed === true,
      "cinematic viewport HUD was not fully suppressed during action",
      action
    );
    requireCondition(
      impact?.timingFeedbackVisible === false && impact?.characterCardVisible === false,
      "cinematic HUD obscured ultimate impact",
      impact
    );
    requireCondition(
      impact?.cinematicHud?.rootActive === true
      && impact?.cinematicHud?.scoreboardDisplay === "none"
      && impact?.cinematicHud?.matchStripDisplay === "none"
      && impact?.cinematicHud?.footerDisplay === "none"
      && impact?.canvasHudSuppressed === true,
      "cinematic viewport HUD was not fully suppressed during impact",
      impact
    );
    requireCondition(
      reaction?.timingFeedbackVisible === false && reaction?.characterCardVisible === false,
      "cinematic HUD obscured ultimate reaction",
      reaction
    );
    requireCondition(
      reaction?.cinematicHud?.rootActive === true
      && reaction?.cinematicHud?.scoreboardDisplay === "none"
      && reaction?.cinematicHud?.matchStripDisplay === "none"
      && reaction?.cinematicHud?.footerDisplay === "none"
      && reaction?.canvasHudSuppressed === true,
      "cinematic viewport HUD was not fully suppressed during reaction",
      reaction
    );
    requireCondition(
      Number(finalRuntime?.battle?.boss_hp) === Number(baseline?.battle?.boss_hp)
      && Number(finalRuntime?.battle?.tactical_turn) === Number(baseline?.battle?.tactical_turn)
      && Number(finalRuntime?.battle?.internal_energy) === Number(baseline?.battle?.internal_energy),
      "gameplay state mutated by ultimate presentation",
      { baseline, finalRuntime }
    );
    requireCondition(
      JSON.stringify(finalRuntime?.stage) === JSON.stringify(baseline?.stage),
      "CombatStage base data mutated by ultimate presentation"
    );
    requireCondition(complete.result === "HIT" && complete.damage === "24", "resolved presentation result was not preserved", complete);
    requireCondition(exceptions.filter((item) => String(item?.text || item?.exception?.description || "").includes("/js/")).length === 0, "same-origin JS exception detected", exceptions);

    const evidence = {
      task: "T081-B",
      sha: process.env.GITHUB_SHA || "local",
      runId: process.env.GITHUB_RUN_ID || "local",
      journey: ["HOME", "COMBAT", "FORMATION", "ULTIMATE_TRIGGER", "ULTIMATE_STAGING", "ULTIMATE_CHARACTER_FOCUS", "ULTIMATE_ACTION_PREP", "ULTIMATE_ACTION", "ULTIMATE_IMPACT", "ULTIMATE_REACTION", "ULTIMATE_RETURN", "ULTIMATE_COMPLETE"],
      baseline,
      timeline,
      prep,
      action,
      impact,
      reaction,
      returned,
      complete,
      finalRuntime,
      screenshots,
      exceptions
    };
    writeFileSync(join(EVIDENCE_DIR, "t081b-browser-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

    console.log("T081-B Browser Automation = PASS_REAL");
    console.log("ACTION = PASS_REAL");
    console.log("PROJECTILE = PASS_REAL");
    console.log("IMPACT = PASS_REAL");
    console.log("ENEMY_REACTION = PASS_REAL");
    console.log("RETURN = PASS_REAL");
    console.log("GAMEPLAY_IMMUTABLE = PASS_REAL");
  } finally {
    cdp?.close();
    browser.kill("SIGTERM");
    server.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
