import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { extname, normalize, relative, resolve, join } from "node:path";
import { tmpdir } from "node:os";

const SITE_DIR = resolve(process.env.T072_SITE_DIR || "webapp");
const EVIDENCE_DIR = resolve(
  process.env.T072_EVIDENCE_DIR
  || join("browser-evidence", "T080", process.env.GITHUB_SHA || "local", process.env.GITHUB_RUN_ID || "local")
);
const BROWSER_BIN = process.env.BROWSER_BIN;
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
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
    const detail = data === undefined ? "" : " " + JSON.stringify(data);
    throw new Error("T080 ASSERTION FAILED: " + message + detail);
  }
}

mkdirSync(EVIDENCE_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitFor(condition, { timeoutMs = 30000, intervalMs = 25, label = "condition" } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await condition();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error("T080 TIMEOUT: " + label);
}

async function startStaticServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const rawPath = decodeURIComponent(String(req.url || "/").split("?")[0]);
      const requested = rawPath === "/" ? "/index.html" : rawPath;
      const filePath = resolve(root, "." + normalize(requested));
      const rel = relative(root, filePath);
      if (rel.startsWith("..") || rel.includes("..\\") || rel.includes("../")) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }
      const info = await stat(filePath);
      if (!info.isFile()) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
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
  requireCondition(address && typeof address === "object", "static server did not expose address");
  return { server, baseUrl: "http://127.0.0.1:" + address.port + "/" };
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 0;
    this.pending = new Map();
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (!payload.id) return;
      const pending = this.pending.get(payload.id);
      if (!pending) return;
      this.pending.delete(payload.id);
      if (payload.error) pending.reject(new Error(payload.error.message || "CDP error"));
      else pending.resolve(payload.result);
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
        reject(new Error("CDP command timeout: " + method));
      }, 20000);
    });
  }
  close() { try { this.ws?.close(); } catch {} }
}

async function cdpEvaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result?.exceptionDetails) {
    throw new Error(
      "CDP evaluate: "
      + (result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed")
    );
  }
  return result?.result?.value;
}

async function cdpClickSelector(cdp, selector) {
  const box = await cdpEvaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    if (el.disabled) return { disabled: true };
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  requireCondition(box && !box.disabled, "click target unavailable: " + selector, box);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const output = join(EVIDENCE_DIR, name + ".png");
  writeFileSync(output, Buffer.from(result.data, "base64"));
  return output;
}

async function findFreePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = address && typeof address === "object" ? address.port : 0;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  requireCondition(port, "browser debug port unavailable");
  return port;
}

function readRuntime(cdp) {
  return cdpEvaluate(cdp, `(() => {
    const c = document.querySelector('#gameCanvas');
    const r = c?.getBoundingClientRect();
    return {
      visible: Boolean(r && r.width > 0 && r.height > 0),
      contract: c?.dataset?.combatStageContract || '',
      actionContract: c?.dataset?.combatStageActionContract || '',
      actionPhases: c?.dataset?.combatStageActionPhases || '',
      actorCount: c?.dataset?.combatStageActorCount || '',
      selectedActor: c?.dataset?.combatStageSelectedActor || '',
      phase: c?.dataset?.combatPresentationPhase || '',
      active: c?.dataset?.combatPresentationActive === 'true',
      cameraAnchor: c?.dataset?.combatPresentationCameraAnchor || '',
      cameraSource: c?.dataset?.combatPresentationCameraSource || '',
      characterState: c?.dataset?.combatStageCharacterState || '',
      characterMotion: c?.dataset?.combatStageCharacterMotion || '',
      batPose: c?.dataset?.combatStageBatPose || '',
      projectileSource: c?.dataset?.combatStageProjectileContract || '',
      projectileTarget: c?.dataset?.combatStageProjectileTarget || '',
      projectileTravel: c?.dataset?.combatStageProjectileTravel || '',
      actionComplete: c?.dataset?.combatStageActionComplete === 'true',
      timingFeedbackVisible: Boolean(document.querySelector('#timing-feedback')?.classList.contains('is-visible')),
      timingFeedbackText: document.querySelector('#timing-feedback')?.textContent || '',
      characterCardClassList: [...(document.querySelector('#active-waifu-card')?.classList || [])],
      characterCardVisible: (() => {
        const el = document.querySelector('#active-waifu-card');
        if (!el) return false;
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && Number(style.opacity) > 0;
      })(),
      timingFeedbackClassList: [...(document.querySelector('#timing-feedback')?.classList || [])]
    };
  })()`);
}

async function run() {
  requireCondition(BROWSER_BIN, "BROWSER_BIN not set");
  requireCondition(existsSync(SITE_DIR), "site directory missing: " + SITE_DIR);
  const debugPort = await findFreePort();
  const { server, baseUrl } = await startStaticServer(SITE_DIR);
  let browser = null;
  let cdp = null;
  const consoleErrors = [];
  const pageExceptions = [];
  const screenshots = {};
  const timeline = [];
  const samples = [];

  try {
    browser = spawn(BROWSER_BIN, [
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
      "--remote-debugging-port=" + String(debugPort),
      "--user-data-dir=" + mkdtempSync(join(tmpdir(), "t080-chrome-")),
      "about:blank"
    ], { stdio: "ignore" });

    const version = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + debugPort + "/json/version")).json(); } catch { return null; }
    }, { label: "Chrome version endpoint" });
    const targets = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + debugPort + "/json/list")).json(); } catch { return null; }
    }, { label: "Chrome page target" });
    const page = targets.find((item) => item.type === "page") || targets[0];
    requireCondition(version?.webSocketDebuggerUrl && page?.webSocketDebuggerUrl, "Chrome CDP target unavailable");

    cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    cdp.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (payload.method === "Runtime.exceptionThrown") {
        pageExceptions.push(payload.params?.exceptionDetails || null);
      }
      if (payload.method === "Log.entryAdded" && payload.params?.entry?.level === "error") {
        consoleErrors.push(payload.params.entry);
      }
    });

    await cdp.send("Page.navigate", { url: baseUrl });
    await waitFor(async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete", { label: "document ready" });
    await waitFor(
      async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
      { label: "home view visible" }
    );

    screenshots.formation = await (async () => {
      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => {
          const s = await readRuntime(cdp);
          return s.contract === "COMBAT_STAGE_2_5D" && s.actorCount === "5" && Boolean(s.selectedActor);
        },
        { label: "combat stage initialized" }
      );
      return screenshot(cdp, "t080-01-formation");
    })();

    const formation = await readRuntime(cdp);
    requireCondition(formation.contract === "COMBAT_STAGE_2_5D", "stage contract missing", formation);
    requireCondition(formation.actionContract === "CHARACTER_CINEMATIC_ACTION", "T080 action contract missing", formation);
    requireCondition(formation.actionPhases === "ATTACKER_FOCUS,ACTION,IMPACT,TARGET_REACTION,COMBAT_RETURN", "T080 phase contract invalid", formation);
    requireCondition(formation.actorCount === "5", "T080 vertical slice actor count invalid", formation);

    await cdpClickSelector(cdp, "#action-bat");

    const deadline = Date.now() + 7000;
    while (Date.now() < deadline) {
      const state = await readRuntime(cdp);
      if (state.phase && timeline.at(-1) !== state.phase) {
        timeline.push(state.phase);
        samples.push({ ...state, atMs: Date.now() });
        if (state.phase === "ATTACKER_FOCUS") screenshots.focus = await screenshot(cdp, "t080-02-character-focus");
        if (state.phase === "ACTION") screenshots.action = await screenshot(cdp, "t080-03-swing-action");
        if (state.phase === "IMPACT") screenshots.impact = await screenshot(cdp, "t080-04-impact");
        if (state.phase === "TARGET_REACTION") screenshots.reaction = await screenshot(cdp, "t080-05-enemy-reaction");
        if (state.phase === "COMBAT_RETURN") screenshots.return = await screenshot(cdp, "t080-06-return");
      }
      if (samples.length && samples.at(-1).phase === "ACTION") {
        const samePhaseSample = { ...state, atMs: Date.now() };
        samples.push(samePhaseSample);
      }
      if (state.phase === "COMPLETE" && state.active === false) break;
      await sleep(20);
    }

    const focus = samples.find((entry) => entry.phase === "ATTACKER_FOCUS");
    const actionSamples = samples.filter((entry) => entry.phase === "ACTION");
    const action = actionSamples[0];
    const actionLater = actionSamples.at(-1);
    const impact = samples.find((entry) => entry.phase === "IMPACT");
    const reaction = samples.find((entry) => entry.phase === "TARGET_REACTION");
    const returned = samples.find((entry) => entry.phase === "COMBAT_RETURN");
    const complete = await readRuntime(cdp);

    requireCondition(timeline.includes("ATTACKER_FOCUS"), "character focus phase not observed", timeline);
    requireCondition(timeline.includes("ACTION"), "action phase not observed", timeline);
    requireCondition(timeline.includes("IMPACT"), "impact phase not observed", timeline);
    requireCondition(timeline.includes("TARGET_REACTION"), "enemy reaction phase not observed", timeline);
    requireCondition(timeline.includes("COMBAT_RETURN"), "return phase not observed", timeline);
    requireCondition(timeline.includes("COMPLETE"), "presentation did not complete", timeline);
    requireCondition(focus?.cameraAnchor === "PLAYER_FOCUS" && focus?.cameraSource === "ACTOR", "character focus did not use actor camera anchor", focus);
    requireCondition(action?.characterState === "SWING" || action?.characterState === "FOLLOW_THROUGH", "action did not drive BatterRenderer state", action);
    requireCondition(focus?.timingFeedbackVisible === false, "timing feedback obscured character focus", focus);
    requireCondition(focus?.characterCardVisible === false, "active character card obscured cinematic focus", focus);
    requireCondition(focus?.characterCardClassList.includes("is-cinematic-action"), "cinematic character class was not applied", focus);
    requireCondition(action?.characterCardVisible === false && actionLater?.characterCardVisible === false, "active character card obscured cinematic action", { action, actionLater });
    requireCondition(action?.timingFeedbackVisible === false && actionLater?.timingFeedbackVisible === false, "timing feedback obscured cinematic action", { action, actionLater });
    requireCondition(impact?.timingFeedbackVisible === false && reaction?.timingFeedbackVisible === false, "timing feedback remained visible during impact/reaction", { impact, reaction });
    requireCondition(action?.characterMotion !== actionLater?.characterMotion || action?.batPose !== actionLater?.batPose, "character motion did not visibly evolve during action", { action, actionLater });
    requireCondition(action?.projectileSource === "BAT_TO_PROJECTILE", "projectile did not originate from bat/projectile anchors", action);
    requireCondition(action?.projectileTarget === "IMPACT", "projectile target anchor missing", action);
    requireCondition(Number(actionLater?.projectileTravel || 0) >= Number(action?.projectileTravel || 0), "projectile travel did not advance", { action, actionLater });
    requireCondition(impact?.cameraAnchor === "IMPACT", "impact camera anchor missing", impact);
    requireCondition(reaction?.cameraAnchor === "REACTION" && reaction?.cameraSource === "ACTOR", "enemy reaction did not use enemy actor anchor", reaction);
    requireCondition(returned?.cameraAnchor === "RETURN", "return camera anchor missing", returned);
    requireCondition(complete.visible, "combat canvas not visible at completion", complete);
    requireCondition(complete.actionComplete === true, "cinematic action completion was not recorded", complete);

    const sameOriginErrors = pageExceptions
      .map((item) => item?.exception?.description || item?.text || "")
      .filter(Boolean)
      .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
    requireCondition(sameOriginErrors.length === 0, "same-origin browser exceptions detected", sameOriginErrors);

    const evidence = {
      task: "T080",
      sha: process.env.GITHUB_SHA || "local",
      runId: process.env.GITHUB_RUN_ID || "local",
      browser: BROWSER_BIN,
      baseUrl,
      journey: ["HOME", "COMBAT", "FORMATION", "CHARACTER_FOCUS", "ACTION", "PROJECTILE", "IMPACT", "REACTION", "RETURN"],
      formation,
      focus,
      action,
      actionLater,
      impact,
      reaction,
      returned,
      complete,
      timeline,
      screenshots,
      consoleErrors: consoleErrors.map((entry) => ({ text: entry.text, url: entry.url, source: entry.source })),
      pageErrors: sameOriginErrors
    };
    writeFileSync(join(EVIDENCE_DIR, "t080-character-combat-browser-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

    console.log("T080 Browser Automation = PASS_REAL");
    console.log("FORMATION = PASS_REAL");
    console.log("CHARACTER_FOCUS = PASS_REAL");
    console.log("ACTION = PASS_REAL");
    console.log("PROJECTILE = PASS_REAL");
    console.log("IMPACT = PASS_REAL");
    console.log("ENEMY_REACTION = PASS_REAL");
    console.log("RETURN = PASS_REAL");
  } finally {
    cdp?.close();
    if (browser) browser.kill("SIGTERM");
    server.close();
  }
}

run().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
