import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { extname, normalize, relative, resolve, join } from "node:path";
import { tmpdir } from "node:os";

const SITE_DIR = resolve(process.env.T081_SITE_DIR || "webapp");
const EVIDENCE_DIR = resolve(
  process.env.T081_EVIDENCE_DIR
  || join("browser-evidence", "T081", process.env.GITHUB_SHA || "local", process.env.GITHUB_RUN_ID || "local")
);
const BROWSER_BIN = process.env.BROWSER_BIN;

function assertCondition(condition, message, data = undefined) {
  if (condition) return;
  throw new Error(
    "T081 ASSERTION FAILED: " + message
    + (data === undefined ? "" : " " + JSON.stringify(data))
  );
}

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
  ".webp": "image/webp"
});

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
  throw new Error("T081 TIMEOUT: " + label);
}

async function startServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const raw = decodeURIComponent(String(req.url || "/").split("?")[0]);
      const requested = raw === "/" ? "/index.html" : raw;
      const filePath = resolve(root, "." + normalize(requested));
      const rel = relative(root, filePath);
      assertCondition(!rel.startsWith("..") && !rel.includes("../") && !rel.includes("..\\"), "unsafe static path");
      const info = await stat(filePath);
      assertCondition(info.isFile(), "not a file");
      res.setHeader("Content-Type", MIME[extname(filePath).toLowerCase()] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      res.end(await readFile(filePath));
    } catch (error) {
      res.statusCode = error?.message?.startsWith("T081 ASSERTION") ? 500 : 404;
      res.end(error?.message || "Not found");
    }
  });
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  assertCondition(address && typeof address === "object", "server address missing");
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
      const pending = payload.id ? this.pending.get(payload.id) : null;
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
  close() {
    try { this.ws?.close(); } catch {}
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result?.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description
      || result.exceptionDetails.text
      || "Runtime evaluation failed"
    );
  }
  return result?.result?.value;
}

async function click(cdp, selector) {
  const clicked = await evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el || el.disabled) return false;
    el.click();
    return true;
  })()`);
  assertCondition(clicked, "click target unavailable: " + selector);
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const path = join(EVIDENCE_DIR, name + ".png");
  writeFileSync(path, Buffer.from(result.data, "base64"));
  return path;
}

async function freePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = address?.port || 0;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  assertCondition(port, "debug port missing");
  return port;
}

function runtime(cdp) {
  return evaluate(cdp, `(() => {
    const canvas = document.querySelector('#gameCanvas');
    const rect = canvas?.getBoundingClientRect();
    return {
      visible: Boolean(rect && rect.width > 0 && rect.height > 0),
      contract: canvas?.dataset?.combatStageContract || '',
      ultimateContract: canvas?.dataset?.combatStageUltimateContract || '',
      ultimatePhases: canvas?.dataset?.combatStageUltimatePhases || '',
      sequenceKind: canvas?.dataset?.combatStageUltimateSequenceKind || '',
      phase: canvas?.dataset?.combatStageUltimatePhase || '',
      active: canvas?.dataset?.combatStageUltimateActive === 'true',
      cameraAnchor: canvas?.dataset?.combatPresentationCameraAnchor || '',
      cameraSource: canvas?.dataset?.combatPresentationCameraSource || '',
      actorCount: canvas?.dataset?.combatStageActorCount || '',
      playerCount: canvas?.dataset?.combatStagePlayerCount || '',
      enemyCount: canvas?.dataset?.combatStageEnemyCount || '',
      selectedActor: canvas?.dataset?.combatStageSelectedActor || '',
      characterState: canvas?.dataset?.combatStageCharacterState || '',
      heroScale: canvas?.dataset?.combatStageUltimateHeroScale || '',
      supportOpacity: canvas?.dataset?.combatStageUltimateSupportOpacity || '',
      teamStaged: canvas?.dataset?.combatStageUltimateTeamStaged === 'true',
      cardVisible: (() => {
        const el = document.querySelector('#active-waifu-card');
        if (!el) return false;
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && Number(style.opacity) > 0;
      })()
    };
  })()`);
}

async function run() {
  assertCondition(BROWSER_BIN, "BROWSER_BIN not set");
  assertCondition(existsSync(SITE_DIR), "site directory missing");
  const { server, baseUrl } = await startServer(SITE_DIR);
  const port = await freePort();
  const chrome = spawn(BROWSER_BIN, [
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
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + mkdtempSync(join(tmpdir(), "t081-chrome-")),
    "about:blank"
  ], { stdio: "ignore" });

  let cdp = null;
  const exceptions = [];
  const timeline = [];
  const samples = [];
  const shots = {};

  try {
    const version = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + port + "/json/version")).json(); } catch { return null; }
    }, { label: "Chrome version" });
    const targets = await waitFor(async () => {
      try { return await (await fetch("http://127.0.0.1:" + port + "/json/list")).json(); } catch { return null; }
    }, { label: "Chrome page target" });
    const page = targets.find((item) => item.type === "page") || targets[0];
    assertCondition(version?.webSocketDebuggerUrl && page?.webSocketDebuggerUrl, "Chrome CDP unavailable");

    cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    cdp.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (payload.method === "Runtime.exceptionThrown") {
        exceptions.push(payload.params?.exceptionDetails || null);
      }
    });

    await cdp.send("Page.navigate", { url: baseUrl + "?qa=t081" });
    await waitFor(() => evaluate(cdp, "document.readyState === 'complete'"), { label: "document ready" });
    await waitFor(() => evaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"), {
      label: "home visible"
    });

    await click(cdp, '.main-menu-button[data-view="combat"]');
    await waitFor(() => {
      return evaluate(cdp, `(() => {
        const c = document.querySelector('#gameCanvas');
        const shell = document.querySelector('.game-viewport');
        const home = document.querySelector('#home-view');
        return c?.dataset?.combatStageContract === 'COMBAT_STAGE_2_5D'
          && c?.dataset?.combatStageActorCount === '5'
          && shell && !shell.hidden
          && home && home.hidden
          && Boolean(window.__BW_T081_TRIGGER_ULTIMATE__);
      })()`);
    }, { label: "real combat view and T081 QA trigger" });

    const initial = await runtime(cdp);
    assertCondition(initial.visible === true, "combat canvas is not visibly mounted", initial);
    assertCondition(initial.ultimateContract === "ULTIMATE_CINEMATIC_STAGING", "ultimate contract missing", initial);
    const t081Phases = [
      "ULTIMATE_TRIGGER",
      "ULTIMATE_STAGING",
      "ULTIMATE_CHARACTER_FOCUS",
      "ULTIMATE_ACTION_PREP"
    ];
    const implementedPhases = String(initial.ultimatePhases || "").split(",").filter(Boolean);
    assertCondition(
      implementedPhases.slice(0, t081Phases.length).join(",") === t081Phases.join(",")
      && implementedPhases.includes("ULTIMATE_RETURN"),
      "ultimate phase contract no longer contains the T081 staging prefix and return",
      initial
    );
    assertCondition(initial.actorCount === "5" && initial.playerCount === "4" && initial.enemyCount === "1", "actor staging invalid", initial);

    const triggerResult = await evaluate(cdp, "window.__BW_T081_TRIGGER_ULTIMATE__()");
    assertCondition(triggerResult?.sequenceKind === "ULTIMATE_STAGING", "QA ultimate trigger did not start presentation sequence", triggerResult);

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const state = await runtime(cdp);
      if (state.phase && timeline.at(-1) !== state.phase) {
        timeline.push(state.phase);
        samples.push({ ...state, atMs: Date.now() });
        if (state.phase === "ULTIMATE_STAGING") shots.staging = await screenshot(cdp, "t081-01-team-staging");
        if (state.phase === "ULTIMATE_CHARACTER_FOCUS") shots.focus = await screenshot(cdp, "t081-02-character-focus");
        if (state.phase === "ULTIMATE_ACTION_PREP") shots.prep = await screenshot(cdp, "t081-03-action-prep");
        if (state.phase === "ULTIMATE_RETURN") shots.return = await screenshot(cdp, "t081-04-return");
      }
      if (state.phase === "ULTIMATE_COMPLETE") break;
      await sleep(20);
    }

    const trigger = samples.find((entry) => entry.phase === "ULTIMATE_TRIGGER");
    const staging = samples.find((entry) => entry.phase === "ULTIMATE_STAGING");
    const focus = samples.find((entry) => entry.phase === "ULTIMATE_CHARACTER_FOCUS");
    const prep = samples.find((entry) => entry.phase === "ULTIMATE_ACTION_PREP");
    const returned = samples.find((entry) => entry.phase === "ULTIMATE_RETURN");
    const complete = await runtime(cdp);

    assertCondition(timeline.includes("ULTIMATE_TRIGGER"), "ultimate trigger phase not observed", timeline);
    assertCondition(timeline.includes("ULTIMATE_STAGING"), "cinematic staging phase not observed", timeline);
    assertCondition(timeline.includes("ULTIMATE_CHARACTER_FOCUS"), "character focus phase not observed", timeline);
    assertCondition(timeline.includes("ULTIMATE_ACTION_PREP"), "action prep phase not observed", timeline);
    assertCondition(timeline.includes("ULTIMATE_RETURN"), "return phase not observed", timeline);
    assertCondition(timeline.includes("ULTIMATE_COMPLETE"), "ultimate sequence did not complete", timeline);

    assertCondition(staging?.cameraAnchor === "FORMATION", "team staging did not remain in formation anchor", staging);
    assertCondition(staging?.teamStaged === true, "support actors did not enter temporary staged composition", staging);
    assertCondition(Number(staging?.supportOpacity || 1) < 1, "support actor emphasis did not change", staging);
    assertCondition(focus?.cameraAnchor === "PLAYER_FOCUS" && focus?.cameraSource === "ACTOR", "ultimate focus did not use actor camera anchor", focus);
    assertCondition(focus?.characterState === "WINDUP", "ultimate focus did not enter existing BatterRenderer windup", focus);
    assertCondition(Number(focus?.heroScale || 0) > 0, "ultimate hero scale proof missing", focus);
    assertCondition(focus?.cardVisible === false, "HUD card obscured ultimate focus", focus);
    assertCondition(prep?.cameraAnchor === "ACTION" && prep?.cameraSource === "ACTOR", "ultimate prep did not use action actor camera anchor", prep);
    assertCondition(prep?.characterState === "WINDUP", "ultimate prep changed to a gameplay action state", prep);
    assertCondition(returned?.cameraAnchor === "RETURN", "ultimate return anchor missing", returned);
    assertCondition(complete.sequenceKind === "ULTIMATE_STAGING", "ultimate sequence kind was lost at completion", complete);
    assertCondition(complete.phase === "ULTIMATE_COMPLETE" && complete.active === false, "ultimate completion state invalid", complete);
    assertCondition(complete.cardVisible === true, "HUD card did not recover after ultimate staging", complete);
    assertCondition(
      !exceptions.some((entry) => String(entry?.exception?.description || entry?.text || "").includes("/js/")),
      "same-origin JS browser exception detected",
      exceptions
    );

    const evidence = {
      task: "T081",
      sha: process.env.GITHUB_SHA || "local",
      runId: process.env.GITHUB_RUN_ID || "local",
      journey: ["HOME", "COMBAT", "FORMATION", "ULTIMATE_TRIGGER", "ULTIMATE_STAGING", "ULTIMATE_CHARACTER_FOCUS", "ULTIMATE_ACTION_PREP", "ULTIMATE_RETURN", "ULTIMATE_COMPLETE"],
      contractNote: "T081 validates the staging prefix while T081-B extends the reusable contract with action, impact and reaction phases.",
      initial,
      trigger,
      staging,
      focus,
      prep,
      returned,
      complete,
      timeline,
      screenshots: shots,
      gameplayMutation: "Presentation-only QA trigger. No combat result, HP, damage, turn or economy mutation.",
      pageExceptions: exceptions
    };
    writeFileSync(join(EVIDENCE_DIR, "t081-ultimate-staging-browser-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

    console.log("T081 Browser Automation = PASS_REAL");
    console.log("ULTIMATE_TRIGGER = PASS_REAL");
    console.log("CINEMATIC_STAGING = PASS_REAL");
    console.log("CHARACTER_FOCUS = PASS_REAL");
    console.log("ACTION_PREP = PASS_REAL");
    console.log("RETURN = PASS_REAL");
  } finally {
    cdp?.close();
    chrome.kill("SIGTERM");
    server.close();
  }
}

run().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
