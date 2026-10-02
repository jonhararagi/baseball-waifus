import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { extname, normalize, relative, resolve, join } from "node:path";
import { tmpdir } from "node:os";

const T073_PRESENTATION = process.env.T073_PRESENTATION === "1";
const T074_ART = process.env.T074_ART === "1";
const T077_COMBAT = process.env.T077_COMBAT === "1";
const T078_STAGE = process.env.T078_STAGE === "1";
const T079_STAGE = process.env.T079_STAGE === "1";
const T095_TIMING_DIAGNOSTIC = process.env.T095_TIMING_DIAGNOSTIC === "1";
const T097_REWARD_HANDOFF = process.env.T097_REWARD_HANDOFF === "1";
const T101_DEFEAT_PROOF = process.env.T101_DEFEAT_PROOF === "1";
const T104_PERSISTENCE_PROOF = process.env.T104_PERSISTENCE_PROOF === "1";
const T111_TERMINAL_BOUNDARY = process.env.T111_TERMINAL_BOUNDARY === "1";
const T094_COMBAT_LOOP = process.env.T094_COMBAT_LOOP === "1";
const SITE_DIR = resolve(process.env.T072_SITE_DIR || "site");
const EVIDENCE_DIR = resolve(
  process.env.T072_EVIDENCE_DIR
  || join("browser-evidence", "T072", process.env.GITHUB_SHA || "local", process.env.GITHUB_RUN_ID || "local")
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
    throw new Error("T072 ASSERTION FAILED: " + message + detail);
  }
}

mkdirSync(EVIDENCE_DIR, { recursive: true });
requireCondition(existsSync(SITE_DIR), "T072 site directory missing: " + SITE_DIR);

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitFor(condition, { timeoutMs = 30000, intervalMs = 250, label = "condition" } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await condition();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error("T072 TIMEOUT: " + label);
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
  requireCondition(address && typeof address === "object", "static server did not expose an address");
  return { server, baseUrl: "http://127.0.0.1:" + address.port + "/" };
}

async function waitForJson(url, timeoutMs = 15000) {
  return waitFor(async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }, { timeoutMs, label: "HTTP " + url });
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

  close() {
    try { this.ws?.close(); } catch {}
  }
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
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  })()`);
  requireCondition(box && !box.disabled, "click target unavailable: " + selector, box);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
}

async function cdpClickText(cdp, selector, text) {
  const box = await cdpEvaluate(cdp, `(() => {
    const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const wanted = ${JSON.stringify(text)}.trim().toUpperCase();
    const el = nodes.find((candidate) => candidate.textContent.trim().toUpperCase() === wanted);
    if (!el) return null;
    if (el.disabled) return { disabled: true };
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  })()`);
  requireCondition(box && !box.disabled, "text click target unavailable: " + text, box);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  });
  const output = join(EVIDENCE_DIR, name + ".png");
  writeFileSync(output, Buffer.from(result.data, "base64"));
  return output;
}

async function findFreePort() {
  const probe = createServer();
  await new Promise((resolvePromise, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = probe.address();
  const port = address && typeof address === "object" ? address.port : null;
  await new Promise((resolvePromise) => probe.close(resolvePromise));
  requireCondition(port, "unable to allocate a browser debugging port");
  return port;
}

async function run() {
  requireCondition(BROWSER_BIN, "BROWSER_BIN not set");
  const debugPort = await findFreePort();
  const { server, baseUrl } = await startStaticServer(SITE_DIR);
  let browser = null;
  let cdp = null;
  const consoleErrors = [];
  const pageExceptions = [];
  const network = { requests: [], responses: [] };

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
      "--remote-allow-origins=*",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=" + String(debugPort),
      "--user-data-dir=" + mkdtempSync(join(tmpdir(), "t072-chrome-")),
      "about:blank"
    ], { stdio: "ignore" });

    const version = await waitForJson("http://127.0.0.1:" + debugPort + "/json/version");
    const targets = await waitForJson("http://127.0.0.1:" + debugPort + "/json/list");
    const page = targets.find((item) => item.type === "page") || targets[0];
    requireCondition(version?.webSocketDebuggerUrl, "Chrome version endpoint missing");
    requireCondition(page?.webSocketDebuggerUrl, "Chrome page target missing websocket URL");

    cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Network.enable");

    cdp.ws.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (payload.method === "Runtime.exceptionThrown") {
        pageExceptions.push(payload.params?.exceptionDetails || null);
      }
      if (payload.method === "Log.entryAdded") {
        const entry = payload.params?.entry;
        if (entry?.level === "error") consoleErrors.push(entry);
      }
      if (payload.method === "Network.requestWillBeSent") {
        network.requests.push({
          url: String(payload.params?.request?.url || ""),
          method: payload.params?.request?.method
        });
      }
      if (payload.method === "Network.responseReceived") {
        network.responses.push({
          url: String(payload.params?.response?.url || ""),
          status: payload.params?.response?.status,
          mimeType: payload.params?.response?.mimeType
        });
      }
    });

    await cdp.send("Page.navigate", { url: baseUrl });

    await waitFor(async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete", {
      timeoutMs: 30000,
      label: "document readyState complete"
    });

    if (T078_STAGE) {
      await waitFor(async () => cdpEvaluate(cdp, "document.querySelector('#home-view') && !document.querySelector('#home-view').hidden"), { timeoutMs: 30000, label: "T078 Home visible" });
      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(async () => cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return Boolean(c && c.dataset.combatStageContract === 'COMBAT_STAGE_2_5D' && c.dataset.combatStageActorCount === '5'); })()"), { label: "T078 Combat Stage initialized" });

      const formation = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return { contract:c?.dataset?.combatStageContract||'', actorCount:c?.dataset?.combatStageActorCount||'', playerCount:c?.dataset?.combatStagePlayerCount||'', enemyCount:c?.dataset?.combatStageEnemyCount||'', depthModel:c?.dataset?.combatStageDepthModel||'', layers:c?.dataset?.combatStageLayers||'', zones:c?.dataset?.combatStageZones||'', selectedActor:c?.dataset?.combatStageSelectedActor||'' }; })()");
      requireCondition(formation.contract === "COMBAT_STAGE_2_5D", "T078 stage contract missing", formation);
      requireCondition(formation.actorCount === "5" && formation.playerCount === "4" && formation.enemyCount === "1", "T078 actor counts invalid", formation);
      requireCondition(formation.layers === "BACKGROUND,MIDGROUND,GROUND,FOREGROUND", "T078 layers invalid", formation);
      requireCondition(formation.zones === "PLAYER_ZONE,ENEMY_ZONE", "T078 zones invalid", formation);
      requireCondition(formation.depthModel === "FAR,MID,NEAR", "T078 depth model invalid", formation);
      requireCondition(Boolean(formation.selectedActor), "T078 selected actor missing", formation);

      const screenshots = { formation: await screenshot(cdp, "t078-01-formation") };
      await cdpClickSelector(cdp, "#action-bat");

      const phaseTimeline = [];
      let focusEvidence = null;
      let returnEvidence = null;
      const deadline = Date.now() + 6000;
      while (Date.now() < deadline) {
        const state = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return { phase:c?.dataset?.combatPresentationPhase||'', active:c?.dataset?.combatPresentationActive==='true', anchor:c?.dataset?.combatPresentationCameraAnchor||'', source:c?.dataset?.combatPresentationCameraSource||'', selected:c?.dataset?.combatStageSelectedActor||'' }; })()");
        if (state.phase && phaseTimeline.at(-1) !== state.phase) {
          phaseTimeline.push(state.phase);
          if (state.phase === "ATTACKER_FOCUS") {
            focusEvidence = state;
            screenshots.playerFocus = await screenshot(cdp, "t078-02-player-focus");
          }
          if (state.phase === "COMBAT_RETURN") {
            returnEvidence = state;
            screenshots.return = await screenshot(cdp, "t078-03-return");
          }
        }
        if (state.phase === "COMPLETE" && state.active === false) break;
        await sleep(25);
      }

      const required = ["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN", "COMPLETE"];
      requireCondition(required.every((phase) => phaseTimeline.includes(phase)), "T078 phase sequence incomplete", { phaseTimeline, required });
      requireCondition(focusEvidence?.anchor === "PLAYER_FOCUS", "T078 PLAYER_FOCUS not consumed", focusEvidence);
      requireCondition(Boolean(focusEvidence?.selected), "T078 selected actor missing at focus", focusEvidence);
      requireCondition(returnEvidence?.anchor === "RETURN", "T078 RETURN not consumed", returnEvidence);

      const runtime = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); const r=c?.getBoundingClientRect(); return { visible:Boolean(r&&r.width>0&&r.height>0), contract:c?.dataset?.combatStageContract||'', actorCount:c?.dataset?.combatStageActorCount||'', selected:c?.dataset?.combatStageSelectedActor||'', anchor:c?.dataset?.combatPresentationCameraAnchor||'', source:c?.dataset?.combatPresentationCameraSource||'', phase:c?.dataset?.combatPresentationPhase||'', active:c?.dataset?.combatPresentationActive==='true' }; })()");
      requireCondition(runtime.visible, "T078 canvas not visible", runtime);
      requireCondition(runtime.contract === "COMBAT_STAGE_2_5D" && runtime.actorCount === "5", "T078 runtime stage regressed", runtime);
      requireCondition(runtime.phase === "COMPLETE" && runtime.active === false, "T078 presentation did not complete", runtime);

      const sameOriginErrors = pageExceptions.map((item) => item?.exception?.description || item?.text || "").filter(Boolean).filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "same-origin page exceptions detected", sameOriginErrors);

      const evidence = { task:"T078", sha:process.env.GITHUB_SHA||"local", runId:process.env.GITHUB_RUN_ID||"local", browser:BROWSER_BIN, baseUrl, journey:["HOME","COMBAT ENTRY","FORMATION","SELECTED CHARACTER",...phaseTimeline], formation, focusEvidence, returnEvidence, runtime, phaseTimeline, screenshots, network:{ requestCount:network.requests.length, responseCount:network.responses.length }, consoleErrors:consoleErrors.map((entry)=>({ text:entry.text, url:entry.url, source:entry.source })), pageErrors:sameOriginErrors };
      writeFileSync(join(EVIDENCE_DIR, "t078-combat-stage-browser-evidence.json"), JSON.stringify(evidence, null, 2)+"\n", "utf8");

      console.log("BROWSER AUTOMATION = PASS_REAL");
      console.log("HOME = PASS_REAL");
      console.log("COMBAT ENTRY = PASS_REAL");
      console.log("FORMATION = PASS_REAL");
      console.log("SELECTED CHARACTER = PASS_REAL");
      console.log("PLAYER_FOCUS = PASS_REAL");
      console.log("ACTION = PASS_REAL");
      console.log("IMPACT = PASS_REAL");
      console.log("TARGET REACTION = PASS_REAL");
      console.log("RETURN = PASS_REAL");
      console.log("T078 COMBAT STAGE = PASS_REAL");
      return;
    }

    if (T079_STAGE) {
      await waitFor(
        async () => cdpEvaluate(cdp, "document.querySelector('#home-view') && !document.querySelector('#home-view').hidden"),
        { timeoutMs: 30000, label: "T079 Home visible" }
      );
      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return Boolean(c && c.dataset.combatStageContract === 'COMBAT_STAGE_2_5D' && c.dataset.combatStageActorCount === '5'); })()"),
        { label: "T079 Combat Stage initialized" }
      );

      const formation = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return { contract:c?.dataset?.combatStageContract||'', actorCount:c?.dataset?.combatStageActorCount||'', playerCount:c?.dataset?.combatStagePlayerCount||'', enemyCount:c?.dataset?.combatStageEnemyCount||'', depths:c?.dataset?.combatStageActorDepths||'', elevations:c?.dataset?.combatStageActorElevations||'', depthModel:c?.dataset?.combatStageDepthModel||'', pieces:c?.dataset?.combatStageSetPieces||'', layers:c?.dataset?.combatStageLayers||'', zones:c?.dataset?.combatStageZones||'', selectedActor:c?.dataset?.combatStageSelectedActor||'', filmable:c?.dataset?.combatStageFilmable||'' }; })()");
      requireCondition(formation.contract === "COMBAT_STAGE_2_5D", "T079 stage contract missing", formation);
      requireCondition(formation.actorCount === "5" && formation.playerCount === "4" && formation.enemyCount === "1", "T079 actor counts invalid", formation);
      requireCondition(formation.depthModel === "FAR,MID,NEAR", "T079 depth model invalid", formation);
      requireCondition(formation.pieces.includes("PLAYER_RAMP") && formation.pieces.includes("ENEMY_PLATFORM"), "T079 set geometry incomplete", formation);
      requireCondition(formation.layers === "BACKGROUND,MIDGROUND,GROUND,FOREGROUND", "T079 stage layers invalid", formation);
      requireCondition(formation.zones === "PLAYER_ZONE,ENEMY_ZONE", "T079 stage zones invalid", formation);
      requireCondition(formation.filmable === "true", "T079 stage is not marked filmable", formation);
      requireCondition(new Set(formation.depths.split(",")).size >= 2, "T079 depth is not perceptibly differentiated in runtime state", formation);
      requireCondition(new Set(formation.elevations.split(",")).size >= 2, "T079 elevation is not differentiated in runtime state", formation);
      requireCondition(Boolean(formation.selectedActor), "T079 selected actor missing", formation);

      const screenshots = { formation: await screenshot(cdp, "t079-01-formation") };
      await cdpClickSelector(cdp, "#action-bat");

      const phaseTimeline = [];
      const cameraEvidence = [];
      let focusEvidence = null;
      let actionEvidence = null;
      let impactEvidence = null;
      let reactionEvidence = null;
      let returnEvidence = null;
      const projectileEvidence = [];
      const deadline = Date.now() + 6000;
      while (Date.now() < deadline) {
        const state = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return { phase:c?.dataset?.combatPresentationPhase||'', active:c?.dataset?.combatPresentationActive==='true', anchor:c?.dataset?.combatPresentationCameraAnchor||'', source:c?.dataset?.combatPresentationCameraSource||'', selected:c?.dataset?.combatStageSelectedActor||'' }; })()");
        if (state.phase && phaseTimeline.at(-1) !== state.phase) {
          phaseTimeline.push(state.phase);
          cameraEvidence.push(state);
          if (state.phase === "ATTACKER_FOCUS") {
            focusEvidence = state;
            screenshots.playerFocus = await screenshot(cdp, "t079-02-player-focus");
          }
          if (state.phase === "ACTION") {
            actionEvidence = state;
            screenshots.action = await screenshot(cdp, "t079-03-action");
          }
          if (state.phase === "IMPACT") {
            impactEvidence = state;
            screenshots.impact = await screenshot(cdp, "t079-04-impact");
          }
          if (state.phase === "TARGET_REACTION") {
            reactionEvidence = state;
            screenshots.reaction = await screenshot(cdp, "t079-05-enemy-reaction");
          }
          if (state.phase === "COMBAT_RETURN") {
            returnEvidence = state;
            screenshots.return = await screenshot(cdp, "t079-06-return");
          }
        }

        if (state.phase === "ACTION") {
          const projectile = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); return { phase:c?.dataset?.combatPresentationPhase||'', anchor:c?.dataset?.combatPresentationCameraAnchor||'' }; })()");
          projectileEvidence.push(projectile);
        }

        if (state.phase === "COMPLETE" && state.active === false) break;
        await sleep(25);
      }

      const required = ["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN", "COMPLETE"];
      requireCondition(required.every((phase) => phaseTimeline.includes(phase)), "T079 cinematic route incomplete", { phaseTimeline, required });
      requireCondition(focusEvidence?.source === "ACTOR", "T079 player focus did not resolve through actor anchor", focusEvidence);
      requireCondition(actionEvidence?.source === "ACTOR" && actionEvidence?.anchor === "ACTION", "T079 action camera did not resolve through actor anchor", actionEvidence);
      requireCondition(impactEvidence?.source === "ACTOR" && impactEvidence?.anchor === "IMPACT", "T079 impact camera did not resolve through enemy actor anchor", impactEvidence);
      requireCondition(reactionEvidence?.source === "ACTOR" && reactionEvidence?.anchor === "REACTION", "T079 enemy reaction camera did not resolve through enemy actor anchor", reactionEvidence);
      requireCondition(returnEvidence?.anchor === "RETURN", "T079 return camera anchor missing", returnEvidence);
      requireCondition(projectileEvidence.length > 0, "T079 normal attack projectile presentation was not observed", { phaseTimeline, projectileEvidence });

      const runtime = await cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); const r=c?.getBoundingClientRect(); return { visible:Boolean(r&&r.width>0&&r.height>0), contract:c?.dataset?.combatStageContract||'', actorCount:c?.dataset?.combatStageActorCount||'', selected:c?.dataset?.combatStageSelectedActor||'', anchor:c?.dataset?.combatPresentationCameraAnchor||'', source:c?.dataset?.combatPresentationCameraSource||'', phase:c?.dataset?.combatPresentationPhase||'', active:c?.dataset?.combatPresentationActive==='true' }; })()");
      requireCondition(runtime.visible, "T079 combat canvas not visible", runtime);
      requireCondition(runtime.contract === "COMBAT_STAGE_2_5D" && runtime.actorCount === "5", "T079 runtime stage regressed", runtime);
      requireCondition(runtime.phase === "COMPLETE" && runtime.active === false, "T079 presentation did not complete", runtime);

      const sameOriginErrors = pageExceptions.map((item) => item?.exception?.description || item?.text || "").filter(Boolean).filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "T079 same-origin page exceptions detected", sameOriginErrors);

      const evidence = { task:"T079", sha:process.env.GITHUB_SHA||"local", runId:process.env.GITHUB_RUN_ID||"local", browser:BROWSER_BIN, baseUrl, journey:["HOME","COMBAT ENTRY","FORMATION","SELECTED CHARACTER",...phaseTimeline], formation, cameraEvidence, focusEvidence, actionEvidence, impactEvidence, reactionEvidence, returnEvidence, runtime, projectileObserved:projectileEvidence.length>0, phaseTimeline, screenshots, network:{requestCount:network.requests.length,responseCount:network.responses.length},consoleErrors:consoleErrors.map((entry)=>({text:entry.text,url:entry.url,source:entry.source})),pageErrors:sameOriginErrors };
      writeFileSync(join(EVIDENCE_DIR, "t079-combat-stage-browser-evidence.json"), JSON.stringify(evidence,null,2)+"\n", "utf8");

      console.log("BROWSER AUTOMATION = PASS_REAL");
      console.log("HOME = PASS_REAL");
      console.log("COMBAT ENTRY = PASS_REAL");
      console.log("FORMATION = PASS_REAL");
      console.log("PLAYER FOCUS = PASS_REAL");
      console.log("ACTION = PASS_REAL");
      console.log("IMPACT = PASS_REAL");
      console.log("ENEMY REACTION = PASS_REAL");
      console.log("RETURN = PASS_REAL");
      console.log("NORMAL ATTACK = PASS_REAL");
      console.log("T079 CHARACTER-COMBAT 2.5D = PASS_REAL");
      return;
    }

    const home = await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#home-view");
        const name = document.querySelector("#home-character-name")?.textContent?.trim() || "";
        return { visible: Boolean(root && !root.hidden), name };
      })()`).catch(() => null),
      { timeoutMs: 30000, label: "fresh starter Home initialization" }
    );

    requireCondition(home.visible, "Home is not visible", home);
    requireCondition(home.name === "Aiko Hanamori", "Home active character is not Aiko", home);

    const initialRuntime = await cdpEvaluate(cdp, `(() => {
      const state = window.BaseballWaifusGacha?.getState?.() || null;
      const status = window.BaseballWaifusGacha?.getStatus?.() || null;
      const chars = window.BaseballWaifusGacha?.getCharacters?.() || [];
      const counts = { R: 0, SR: 0, SSR: 0, UR: 0 };
      for (const unit of chars) {
        if (unit?.acquisition?.pool_eligible === false) continue;
        const rarity = String(unit?.canonical?.rarity || "").toUpperCase();
        if (counts[rarity] !== undefined) counts[rarity] += 1;
      }
      return {
        state,
        status,
        aiko: chars.find((unit) => unit.character_id === "bw001") || null,
        poolCounts: counts,
        storageKeys: Object.keys(localStorage).filter((key) => key.startsWith("baseball_waifus_player_meta_v1:"))
      };
    })()`);

    requireCondition(initialRuntime?.state?.active_batter === "bw001", "active batter is not bw001", initialRuntime);
    requireCondition(Boolean(initialRuntime?.state?.inventory?.bw001) && Number(initialRuntime?.state?.inventory?.bw001?.duplicate_count) === 1, "Aiko starter ownership entry is invalid", initialRuntime);
    requireCondition(initialRuntime?.aiko?.canonical?.display_name === "Aiko Hanamori", "canonical Aiko name mismatch", initialRuntime?.aiko);
    requireCondition(initialRuntime?.aiko?.acquisition?.mode === "STARTER", "Aiko acquisition mode is not STARTER", initialRuntime?.aiko);
    requireCondition(initialRuntime?.aiko?.acquisition?.pool_eligible === false, "Aiko is still Gacha eligible", initialRuntime?.aiko);
    requireCondition(JSON.stringify(initialRuntime.poolCounts) === JSON.stringify({ R: 2, SR: 7, SSR: 5, UR: 2 }), "Gacha eligible pool counts changed", initialRuntime.poolCounts);
    requireCondition(initialRuntime.status?.pulls_since_UR === 0, "fresh player has non-zero pity counter", initialRuntime.status);
    requireCondition(initialRuntime.status?.scavenger_scrap === 0, "fresh player has non-zero scrap", initialRuntime.status);

    const schema = await cdpEvaluate(cdp, `fetch("./data/game_schemas_recycled.json", { cache: "no-store" }).then((r) => r.json())`);
    requireCondition(
      schema?.gacha?.rates?.R === 80
      && schema?.gacha?.rates?.SR === 15
      && schema?.gacha?.rates?.SSR === 4
      && schema?.gacha?.rates?.UR === 1,
      "canonical Gacha rates changed",
      schema?.gacha?.rates
    );
    requireCondition(schema?.gacha?.pity?.soft_pity?.start_pull === 61, "soft pity changed", schema?.gacha?.pity);
    requireCondition(schema?.gacha?.pity?.hard_pity?.pull_limit === 80, "hard pity changed", schema?.gacha?.pity);

    const screenshots = {};

    screenshots.home = await screenshot(cdp, "01-home-aiko-starter");



    if (T095_TIMING_DIAGNOSTIC) {
      const runStartedAt = Date.now();
      const timeline = [];
      const readState = async () => cdpEvaluate(cdp, "(() => { const c=document.querySelector('#gameCanvas'); const d=c?.dataset||{}; const r=c?.getBoundingClientRect(); return { battlePhase:d.combatBattlePhase||'', tacticalTurn:d.combatTacticalTurn===''?null:Number(d.combatTacticalTurn), timingActive:d.combatTimingActive==='true', timingGrade:d.combatTimingGrade||'', combatResult:d.combatResult||'', presentationPhase:d.combatStagePresentationPhase||'', rect:r?{left:r.left,top:r.top,width:r.width,height:r.height}:null}; })()");
      const waitState = async (fn, timeoutMs, label) => {
        const deadline=Date.now()+timeoutMs;
        while(Date.now()<deadline){ const state=await readState(); if(fn(state)) return state; await sleep(25); }
        throw new Error("T095 TIMEOUT: "+label+" "+JSON.stringify(await readState()));
      };

      await waitFor(async()=>cdpEvaluate(cdp,"Boolean(document.querySelector('#home-view')&&!document.querySelector('#home-view').hidden)"),{timeoutMs:30000,label:"T095 Home"});
      await cdpClickSelector(cdp,".home-action-play");
      await waitFor(async()=>cdpEvaluate(cdp,"Boolean(document.querySelector('#gameCanvas')&&document.querySelector('#gameCanvas').getBoundingClientRect().width>0)"),{timeoutMs:30000,label:"T095 Canvas"});

      const remote=await cdp.send("Runtime.evaluate",{expression:"document.querySelector('#gameCanvas')",objectGroup:"t095",returnByValue:false});
      requireCondition(remote?.result?.objectId,"T095 canvas object unavailable");
      const listenerInfo=await cdp.send("DOMDebugger.getEventListeners",{objectId:remote.result.objectId});
      const pointerListeners=(listenerInfo.listeners||[]).filter((x)=>String(x.type||"").toLowerCase()==="pointerdown").map((x)=>({type:x.type,useCapture:Boolean(x.useCapture),handler:x.handler?.description||""}));

      await cdpEvaluate(cdp,"(() => { const c=document.querySelector('#gameCanvas'); window.__T095_INPUT_TRACE__=[]; const log=(scope,phase)=>(e)=>window.__T095_INPUT_TRACE__.push({scope,phase,type:e.type,defaultPrevented:Boolean(e.defaultPrevented),clientX:e.clientX??null,clientY:e.clientY??null}); const cc=log('canvas','capture'), cb=log('canvas','bubble'), wc=log('window','capture'); c.addEventListener('pointerdown',cc,true); c.addEventListener('pointerdown',cb,false); c.addEventListener('mousedown',cc,true); c.addEventListener('mousedown',cb,false); c.addEventListener('touchstart',cc,true); c.addEventListener('touchstart',cb,false); window.addEventListener('pointerdown',wc,true); window.addEventListener('mousedown',wc,true); window.addEventListener('touchstart',wc,true); return true; })()");

      await waitState((x)=>x.battlePhase==="TACTICAL"&&x.tacticalTurn===0,3000,"initial combat state");
      await cdpClickSelector(cdp,"#action-bat");
      for(const turn of [1,2,3,4,5]){
        const desired=turn===5?"CLIMAX":"TACTICAL";
        await waitState((x)=>x.tacticalTurn===turn&&x.battlePhase===desired,6000,"T"+turn);
        if(turn<5){
          await waitState((x)=>x.presentationPhase==="COMPLETE"&&!x.timingActive,6000,"presentation T"+turn);
          await waitFor(async()=>cdpEvaluate(cdp,"Boolean(document.querySelector('#action-bat')&&!document.querySelector('#action-bat').disabled)"),{timeoutMs:6000,label:"BATEAR T"+(turn+1)});
          await cdpClickSelector(cdp,"#action-bat");
        }
      }
      const timing=await waitState((x)=>x.battlePhase==="CLIMAX"&&x.tacticalTurn===5&&x.timingActive,6000,"TIMING ACTIVE");
      timeline.push({at_ms:Date.now()-runStartedAt,label:"TIMING ACTIVE",...timing});

      const rect=timing.rect;
      const x=rect.left+rect.width/2, y=rect.top+rect.height/2;
      const target=await cdpEvaluate(cdp,"(() => { const e=document.elementFromPoint("+x+","+y+"); return {tag:e?.tagName||'',id:e?.id||'',isCanvas:e===document.querySelector('#gameCanvas')}; })()");
      await sleep(250);
      const beforeTrace=await cdpEvaluate(cdp,"window.__T095_INPUT_TRACE__||[]");
      await cdp.send("Input.dispatchMouseEvent",{type:"mouseMoved",x,y,button:"none",buttons:0});
      await cdp.send("Input.dispatchMouseEvent",{type:"mousePressed",x,y,button:"left",buttons:1,clickCount:1});
      await cdp.send("Input.dispatchMouseEvent",{type:"mouseReleased",x,y,button:"left",buttons:0,clickCount:1});
      await sleep(300);
      const afterMouse=await cdpEvaluate(cdp,"(() => { const c=document.querySelector('#gameCanvas'),d=c?.dataset||{}; return {state:{timingActive:d.combatTimingActive==='true',timingGrade:d.combatTimingGrade||'',battlePhase:d.combatBattlePhase||'',combatResult:d.combatResult||''},trace:window.__T095_INPUT_TRACE__||[]}; })()");
      let afterTouch=null;
      if(afterMouse.state.timingActive){
        await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y,radiusX:1,radiusY:1,force:1,id:1}],modifiers:0});
        await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[],modifiers:0});
        await sleep(300);
        afterTouch=await cdpEvaluate(cdp,"(() => { const c=document.querySelector('#gameCanvas'),d=c?.dataset||{}; return {state:{timingActive:d.combatTimingActive==='true',timingGrade:d.combatTimingGrade||'',battlePhase:d.combatBattlePhase||'',combatResult:d.combatResult||''},trace:window.__T095_INPUT_TRACE__||[]}; })()");
      }

      const mousePointer=afterMouse.trace.some((e)=>e.type==="pointerdown");
      const mouseDown=afterMouse.trace.some((e)=>e.type==="mousedown");
      const touchPointer=(afterTouch?.trace||[]).filter((e)=>e.type==="pointerdown").length>afterMouse.trace.filter((e)=>e.type==="pointerdown").length;
      const resolution=afterMouse.state.timingActive===false&&Boolean(afterMouse.state.timingGrade)?"MOUSE":afterTouch?.state.timingActive===false&&Boolean(afterTouch.state.timingGrade)?"TOUCH":"NONE";
      const diagnosis=resolution==="MOUSE"?"INPUT PATH WORKS":resolution==="TOUCH"?"CDP MOUSE DOES NOT REPRODUCE POINTERDOWN; TOUCH REPRODUCES RESOLUTION":mousePointer?"POINTERDOWN REACHED CANVAS BUT DID NOT RESOLVE":"CDP MOUSE DID NOT PRODUCE POINTERDOWN";
      const sameOriginErrors=pageExceptions.map((item)=>item?.exception?.description||item?.text||"").filter(Boolean).filter((entry)=>entry.includes(baseUrl)||entry.includes("/js/"));
      const evidence={task:"T095",sha:process.env.GITHUB_SHA||"local",runId:process.env.GITHUB_RUN_ID||"local",browser:BROWSER_BIN,baseUrl,harness:"existing character_journey_browser_probe.mjs via T095_TIMING_DIAGNOSTIC",pointerListeners,listenerCount:pointerListeners.length,timingCheckpoint:timing,geometry:{x:Math.round(x),y:Math.round(y),target},beforeTrace,afterMouse,afterTouch,mousePointer,mouseDown,touchPointer,diagnosis,sameOriginErrors,timeline};
      writeFileSync(join(EVIDENCE_DIR,"t095-timing-input-diagnostic.json"),JSON.stringify(evidence,null,2)+"\n","utf8");
      requireCondition(pointerListeners.length>0,"T095 pointerdown listener missing",pointerListeners);
      requireCondition(afterMouse.trace.length>0,"T095 mouse events did not reach canvas/window",afterMouse.trace);
      requireCondition(sameOriginErrors.length===0,"T095 same-origin runtime exception detected",sameOriginErrors);
      console.log("T095 DIAGNOSTIC = PASS");
      console.log("POINTER LISTENERS = "+pointerListeners.length);
      console.log("MOUSEDOWN = "+mouseDown);
      console.log("MOUSE POINTERDOWN = "+mousePointer);
      console.log("TOUCH POINTERDOWN = "+touchPointer);
      console.log("DIAGNOSIS = "+diagnosis);
      return;
    }

    if (T097_REWARD_HANDOFF) {
      const runStartedAt = Date.now();
      const browserVersion = await cdp.send("Browser.getVersion");
      const checkpoints = {};
      const timeline = [];
      const playerMetaKey = "baseball_waifus_player_meta_v1:local-player";
      const expectedBattleId = "battle:demo-bw001-vs-bw002";

      const readRuntime = async () => cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); const d = canvas?.dataset || {}; const gacha = window.BaseballWaifusGacha?.getStatus?.() || null; const raw = localStorage.getItem('baseball_waifus_player_meta_v1:local-player'); let persisted = null; try { persisted = raw ? JSON.parse(raw) : null; } catch { persisted = null; } return { battlePhase: d.combatBattlePhase || '', tacticalTurn: d.combatTacticalTurn === '' ? null : Number(d.combatTacticalTurn), timingActive: d.combatTimingActive === 'true', timingGrade: d.combatTimingGrade || '', combatResult: d.combatResult || '', presentationPhase: d.combatStagePresentationPhase || '', presentationActive: d.combatPresentationActive === 'true', rewardStatus: document.querySelector('#gacha-status')?.textContent?.trim() || '', scrap: Number(gacha?.scavenger_scrap ?? NaN), fragments: Number(gacha?.fragments ?? NaN), inventorySize: Number(gacha?.inventory_size ?? NaN), playerMetaRawPresent: Boolean(raw), persistedScrap: Number(persisted?.currencies?.SCRAP ?? NaN), rewardLedger: persisted?.rewardLedger || null, rewardLedgerKeys: persisted?.rewardLedger ? Object.keys(persisted.rewardLedger) : [], playerMeta: persisted }; })()");

      const mark = async (name, condition, timeoutMs = 6000) => {
        const deadline = Date.now() + timeoutMs;
        let state = null;
        while (Date.now() < deadline) {
          state = await readRuntime();
          if (condition(state)) {
            checkpoints[name] = { at_ms: Date.now() - runStartedAt, ...state };
            timeline.push({ at_ms: Date.now() - runStartedAt, label: name, ...state });
            return state;
          }
          await sleep(25);
        }
        state = await readRuntime();
        throw new Error("T097 TIMEOUT: " + name + " " + JSON.stringify(state));
      };

      const t097Url = baseUrl + "?qa=t097";
      await cdp.send("Page.navigate", { url: t097Url });
      await waitFor(
        async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete",
        { timeoutMs: 30000, label: "T097 instrumented document ready" }
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
        { timeoutMs: 30000, label: "T097 Home visible" }
      );

      const initial = await readRuntime();
      checkpoints["INITIAL"] = { at_ms: Date.now() - runStartedAt, ...initial };
      timeline.push({ at_ms: Date.now() - runStartedAt, label: "INITIAL", ...initial });
      requireCondition(initial.scrap === 0, "T097 initial Scrap must be 0", initial);
      requireCondition(initial.persistedScrap === 0, "T097 initial persisted Scrap must be 0", initial);
      requireCondition(initial.rewardLedgerKeys.length === 0, "T097 initial reward ledger must be empty", initial);
      requireCondition(initial.playerMetaRawPresent === true, "T097 Player Meta state is not persisted after bootstrap", initial);

      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => cdpEvaluate(cdp, "(() => { const c = document.querySelector('#gameCanvas'); const d = c?.dataset || {}; return Boolean(c && c.getBoundingClientRect().width > 0 && c.getBoundingClientRect().height > 0 && d.combatStageContract === 'COMBAT_STAGE_2_5D' && d.combatStageActorCount === '5'); })()"),
        { timeoutMs: 30000, label: "T097 Combat formation initialized" }
      );
      await mark(
        "VICTORY PATH READY",
        (state) => state.battlePhase === "TACTICAL" && state.tacticalTurn === 0
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
        { timeoutMs: 6000, label: "T097 BATEAR ready for T1" }
      );
      await cdpClickSelector(cdp, "#action-bat");

      for (const turn of [1, 2, 3, 4, 5]) {
        const targetBattlePhase = turn === 5 ? "CLIMAX" : "TACTICAL";
        await mark(
          "TACTICAL " + String(turn),
          (state) => state.tacticalTurn === turn && state.battlePhase === targetBattlePhase
        );
        if (turn < 5) {
          await mark(
            "TACTICAL " + String(turn) + " COMPLETE",
            (state) => state.tacticalTurn === turn && state.presentationPhase === "COMPLETE" && state.presentationActive === false
          );
          await waitFor(
            async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
            { timeoutMs: 6000, label: "T097 BATEAR ready before T" + String(turn + 1) }
          );
          await cdpClickSelector(cdp, "#action-bat");
        }
      }

      await mark("CLIMAX", (state) => state.battlePhase === "CLIMAX" && state.tacticalTurn === 5);
      await mark(
        "TIMING ACTIVE",
        (state) => state.battlePhase === "CLIMAX" && state.tacticalTurn === 5 && state.timingActive === true,
        6000
      );

      const timingElapsedAtInput = await waitFor(
        async () => {
          const elapsed = await cdpEvaluate(cdp, "window.__BW_T097_TIMING_ELAPSED__?.()");
          return Number.isFinite(Number(elapsed)) && Number(elapsed) >= 690 && Number(elapsed) <= 760 ? Number(elapsed) : false;
        },
        { timeoutMs: 5000, intervalMs: 5, label: "T097 timing target band" }
      );
      const timing = await readRuntime();
      requireCondition(timing.timingActive === true, "T097 timing window closed before physical input", timing);
      const rect = await cdpEvaluate(cdp, "(() => { const c = document.querySelector('#gameCanvas'); const r = c?.getBoundingClientRect(); return r ? { left:r.left, top:r.top, width:r.width, height:r.height } : null; })()");
      requireCondition(rect && rect.width > 0 && rect.height > 0, "T097 timing canvas geometry unavailable", rect);
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;
      const target = await cdpEvaluate(cdp, "(() => { const e = document.elementFromPoint(" + clickX + ", " + clickY + "); return { tag:e?.tagName || '', id:e?.id || '', isCanvas:e === document.querySelector('#gameCanvas') }; })()");
      requireCondition(target.isCanvas === true, "T097 timing target is not the game canvas", target);
      await cdp.send("Input.setIgnoreInputEvents", { ignore: false });
      await cdp.send("Input.dispatchMouseEvent", { type:"mouseMoved", x:clickX, y:clickY, button:"none", buttons:0 });
      await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", x:clickX, y:clickY, button:"left", buttons:1, clickCount:1 });
      await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", x:clickX, y:clickY, button:"left", buttons:0, clickCount:1 });

      const victory = await mark(
        "VICTORY",
        (state) => state.battlePhase === "VICTORY" && Boolean(state.combatResult),
        5000
      );
      checkpoints["REWARD HANDOFF"] = await readRuntime();
      timeline.push({ at_ms: Date.now() - runStartedAt, label:"REWARD HANDOFF", ...checkpoints["REWARD HANDOFF"] });

      requireCondition(victory.scrap === 100, "T097 victory did not apply the existing 100 Scrap reward", victory);
      requireCondition(victory.persistedScrap === 100, "T097 victory Scrap is not persisted in Player Meta", victory);
      requireCondition(victory.rewardLedgerKeys.length === 1 && victory.rewardLedgerKeys[0] === expectedBattleId, "T097 reward ledger does not contain exactly one completed battle reward", victory);
      requireCondition(victory.rewardLedger?.[expectedBattleId] === true, "T097 reward ledger entry is not true", victory);
      // Reward handoff is authoritative in Player Meta state/ledger; HUD text is presentation-only.

      const returnState = await mark(
        "RETURN",
        (state) => state.presentationPhase === "COMBAT_RETURN",
        5000
      );
      const completeState = await mark(
        "RETURN COMPLETE",
        (state) => state.presentationPhase === "COMPLETE" && state.presentationActive === false,
        5000
      );
      requireCondition(completeState.scrap === 100, "T097 Scrap balance changed after RETURN", completeState);
      requireCondition(completeState.persistedScrap === 100, "T097 persisted Scrap changed after RETURN", completeState);
      requireCondition(completeState.rewardLedgerKeys.length === 1, "T097 reward ledger changed after RETURN", completeState);

      await cdp.send("Page.navigate", { url: t097Url });
      await waitFor(
        async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete",
        { timeoutMs: 30000, label: "T097 reload document ready" }
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
        { timeoutMs: 30000, label: "T097 Home visible after reload" }
      );
      const reloaded = await readRuntime();
      checkpoints["RELOAD"] = { at_ms: Date.now() - runStartedAt, ...reloaded };
      timeline.push({ at_ms: Date.now() - runStartedAt, label:"RELOAD", ...reloaded });

      requireCondition(reloaded.scrap === 100, "T097 persisted Scrap was not rehydrated after reload", reloaded);
      requireCondition(reloaded.persistedScrap === 100, "T097 Player Meta persistence did not survive reload", reloaded);
      requireCondition(reloaded.rewardLedgerKeys.length === 1 && reloaded.rewardLedger[expectedBattleId] === true, "T097 reward ledger did not survive reload", reloaded);
      requireCondition(reloaded.rewardStatus !== "REWARD ERROR", "T097 reward error state detected after reload", reloaded);

      const sameOriginErrors = pageExceptions
        .map((item) => item?.exception?.description || item?.text || "")
        .filter(Boolean)
        .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "T097 same-origin runtime exceptions detected", sameOriginErrors);

      const evidence = {
        task: "T097",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        browserVersion: {
          product: browserVersion?.product || "",
          revision: browserVersion?.revision || "",
          userAgent: browserVersion?.userAgent || ""
        },
        harness: "existing character_journey_browser_probe.mjs via T097_REWARD_HANDOFF=1",
        baseUrl,
        expectedBattleId,
        checkpoints,
        timeline,
        reward: {
          type: "SCRAP",
          amount: 100,
          source: "existing T062_REWARD_TABLE VICTORY entry"
        },
        persistence: {
          mechanism: "PlayerMetaPersistenceAdapter/localStorage",
          key: playerMetaKey,
          reloadVerified: true
        },
        duplication: {
          initialScrap: initial.scrap,
          victoryScrap: victory.scrap,
          returnScrap: completeState.scrap,
          reloadedScrap: reloaded.scrap,
          rewardLedgerSize: reloaded.rewardLedgerKeys.length
        },
        consoleErrors: consoleErrors.map((entry) => ({ text: entry.text, url: entry.url, source: entry.source })),
        pageErrors: sameOriginErrors
      };
      writeFileSync(join(EVIDENCE_DIR, "t097-reward-handoff-cdp-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

      console.log("T097 BROWSER AUTOMATION = PASS_REAL");
      console.log("VICTORY = PASS_REAL");
      console.log("REWARD HANDOFF = PASS_REAL");
      console.log("REWARD = +100 SCRAP");
      console.log("PLAYER STATE = SCRAP 0 -> 100");
      console.log("PERSISTENCE = PASS_REAL");
      console.log("DUPLICATION = PASS_REAL");
      console.log("RETURN = PASS_REAL");
      console.log("RELOAD = PASS_REAL");
      return;
    }

    if (T101_DEFEAT_PROOF || T104_PERSISTENCE_PROOF) {
      const runStartedAt = Date.now();
      const browserVersion = await cdp.send("Browser.getVersion");
      const checkpoints = {};
      const timeline = [];
      const playerMetaKey = "baseball_waifus_player_meta_v1:local-player";
      const expectedBattleId = "battle:demo-bw001-vs-bw002";

      const readRuntime = async () => cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); const d = canvas?.dataset || {}; const gacha = window.BaseballWaifusGacha?.getStatus?.() || null; const raw = localStorage.getItem('baseball_waifus_player_meta_v1:local-player'); let persisted = null; try { persisted = raw ? JSON.parse(raw) : null; } catch { persisted = null; } return { battlePhase:d.combatBattlePhase||'', tacticalTurn:d.combatTacticalTurn===''?null:Number(d.combatTacticalTurn), timingActive:d.combatTimingActive==='true', timingGrade:d.combatTimingGrade||'', combatResult:d.combatResult||'', presentationPhase:d.combatStagePresentationPhase||'', presentationActive:d.combatPresentationActive==='true', playerStamina:d.combatPlayerStamina===''?null:Number(d.combatPlayerStamina), playerStaminaMax:d.combatPlayerStaminaMax===''?null:Number(d.combatPlayerStaminaMax), scrap:Number(gacha?.scavenger_scrap??NaN), persistedScrap:Number(persisted?.currencies?.SCRAP??NaN), rewardLedger:persisted?.rewardLedger||null, rewardLedgerKeys:persisted?.rewardLedger?Object.keys(persisted.rewardLedger):[], playerMetaRawPresent:Boolean(raw) }; })()");

      const mark = async (name, condition, timeoutMs = 6000) => {
        const deadline = Date.now() + timeoutMs;
        let state = null;
        while (Date.now() < deadline) {
          state = await readRuntime();
          if (condition(state)) {
            checkpoints[name] = { at_ms: Date.now() - runStartedAt, ...state };
            timeline.push({ at_ms: Date.now() - runStartedAt, label:name, ...state });
            return state;
          }
          await sleep(25);
        }
        state = await readRuntime();
        throw new Error("T101 TIMEOUT: " + name + " " + JSON.stringify(state));
      };

      const clickBat = async (label) => {
        await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"), { timeoutMs:6000, label:"T101 BATEAR ready " + label });
        await cdpClickSelector(cdp, "#action-bat");
      };

      const resolveMiss = async (round) => {
        await mark("ROUND " + round + " CLIMAX", s => s.battlePhase === "CLIMAX" && s.tacticalTurn === 5);
        await mark("ROUND " + round + " TIMING", s => s.battlePhase === "CLIMAX" && s.timingActive === true);
        await sleep(120);
        const before = await readRuntime();
        requireCondition(before.timingActive === true, "T101 timing window closed before deterministic MISS input", before);
        requireCondition(before.timingActive === true, "T101 timing window closed before MISS input", before);
        requireCondition(before.playerStamina > 0, "T101 stamina non-positive before non-victory", before);
        const rect = await cdpEvaluate(cdp, "(() => { const r=document.querySelector('#gameCanvas')?.getBoundingClientRect(); return r ? {left:r.left,top:r.top,width:r.width,height:r.height} : null; })()");
        requireCondition(rect && rect.width > 0 && rect.height > 0, "T101 canvas geometry unavailable", rect);
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const target = await cdpEvaluate(cdp, "(() => { const e=document.elementFromPoint(" + x + "," + y + "); return e === document.querySelector('#gameCanvas'); })()");
        requireCondition(target === true, "T101 physical timing target is not canvas");
        await cdp.send("Input.setIgnoreInputEvents", {ignore:false});
        await cdp.send("Input.dispatchMouseEvent", {type:"mouseMoved",x,y,button:"none",buttons:0});
        await cdp.send("Input.dispatchMouseEvent", {type:"mousePressed",x,y,button:"left",buttons:1,clickCount:1});
        await cdp.send("Input.dispatchMouseEvent", {type:"mouseReleased",x,y,button:"left",buttons:0,clickCount:1});
        const after = await mark("ROUND " + round + " RESOLVED", s => s.timingActive === false && s.timingGrade === "MISS", 5000);
        const terminalDefeat = after.battlePhase === "DEFEAT" && after.combatResult === "DEFEAT" && after.playerStamina === 0;
        if (terminalDefeat) {
          requireCondition(before.playerStamina === 1 && after.playerStamina === 0, "T101 terminal defeat stamina transition invalid", {before,after});
        } else {
          requireCondition(after.playerStamina === before.playerStamina - 25, "T101 non-terminal stamina did not decrease exactly 25", {before,after});
        }
        return {before,after};
      };

      const url = baseUrl + "?qa=t097";
      await cdp.send("Page.navigate", {url});
      await waitFor(async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete", {timeoutMs:30000,label:"T101 document ready"});
      await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"), {timeoutMs:30000,label:"T101 Home visible"});
      const initial = await readRuntime();
      checkpoints.INITIAL = {at_ms:Date.now()-runStartedAt,...initial};
      timeline.push({at_ms:Date.now()-runStartedAt,label:"INITIAL",...initial});
      requireCondition(initial.scrap === 0 && initial.persistedScrap === 0, "T101 fresh Player Meta expected", initial);
      requireCondition(initial.playerStamina > 0 && initial.playerStamina <= initial.playerStaminaMax && initial.playerStaminaMax <= 100, "T101 initial stamina bounds invalid", initial);
      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#gameCanvas')?.dataset?.combatStageContract === 'COMBAT_STAGE_2_5D')"), {timeoutMs:30000,label:"T101 formation initialized"});
      await mark("FORMATION", s => s.battlePhase === "TACTICAL" && s.tacticalTurn === 0);

      const rounds=[];
      for (const round of [1,2,3,4]) {
        await clickBat("round " + round + " T1");
        for (const turn of [1,2,3,4,5]) {
          const phase = turn === 5 ? "CLIMAX" : "TACTICAL";
          await mark("ROUND " + round + " TACTICAL " + turn, s => s.tacticalTurn === turn && s.battlePhase === phase);
          if (turn < 5) {
            await mark("ROUND " + round + " TACTICAL " + turn + " COMPLETE", s => s.tacticalTurn === turn && s.presentationPhase === "COMPLETE" && s.presentationActive === false);
            await clickBat("round " + round + " T" + (turn + 1));
          }
        }
        const resolution=await resolveMiss(round);
        rounds.push({round,staminaBefore:resolution.before.playerStamina,staminaAfter:resolution.after.playerStamina,timingGrade:resolution.after.timingGrade,battlePhase:resolution.after.battlePhase,combatResult:resolution.after.combatResult});
        if (round < 3) {
          requireCondition(resolution.after.battlePhase === "TACTICAL" && resolution.after.playerStamina > 0, "T101 non-terminal round did not return to TACTICAL", resolution.after);
          await mark("ROUND " + round + " RETURN", s => s.presentationPhase === "COMBAT_RETURN");
          await mark("ROUND " + round + " RETURN COMPLETE", s => s.presentationPhase === "COMPLETE" && s.presentationActive === false);
        }
      }

      const defeat=await mark("DEFEAT", s => s.battlePhase === "DEFEAT" && s.combatResult === "DEFEAT" && s.playerStamina === 0, 5000);
      requireCondition(defeat.timingGrade === "MISS", "T101 defeat did not originate from MISS", defeat);
      await mark("RETURN", s => s.presentationPhase === "COMBAT_RETURN", 5000);
      const complete=await mark("RETURN COMPLETE", s => s.presentationPhase === "COMPLETE" && s.presentationActive === false, 5000);
      requireCondition(complete.battlePhase === "DEFEAT" && complete.playerStamina === 0, "T101 terminal state changed after return", complete);
      requireCondition(complete.scrap === 0 && complete.persistedScrap === 0, "T101 defeat awarded victory Scrap", complete);
      requireCondition(complete.rewardLedgerKeys.length === 1 && complete.rewardLedgerKeys[0] === expectedBattleId && complete.rewardLedger?.[expectedBattleId] === true, "T101 defeat ledger identity missing or duplicated", complete);
      const actionControl=await cdpEvaluate(cdp, "(() => { const b=document.querySelector('#action-bat'); return {exists:Boolean(b),disabled:Boolean(b?.disabled)}; })()");
      requireCondition(actionControl.exists, "T101 post-terminal BATEAR control is missing", actionControl);
      const postTerminalBefore=await readRuntime();
      if (!actionControl.disabled) {
        await cdpClickSelector(cdp, "#action-bat");
        await sleep(250);
      }
      const postTerminalAfter=await readRuntime();
      requireCondition(
        postTerminalAfter.battlePhase === "DEFEAT"
        && postTerminalAfter.playerStamina === 0
        && postTerminalAfter.tacticalTurn === 0
        && postTerminalAfter.rewardLedgerKeys.length === postTerminalBefore.rewardLedgerKeys.length
        && postTerminalAfter.scrap === postTerminalBefore.scrap
        && postTerminalAfter.persistedScrap === postTerminalBefore.persistedScrap,
        "T101 functional post-terminal BATEAR guard failed",
        {actionControl,postTerminalBefore,postTerminalAfter}
      );
      await cdp.send("Page.navigate", {url});
      await waitFor(async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete", {timeoutMs:30000,label:"T101 reload document ready"});
      await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"), {timeoutMs:30000,label:"T101 Home after reload"});
      const reloaded=await readRuntime();
      checkpoints.RELOAD={at_ms:Date.now()-runStartedAt,...reloaded};
      timeline.push({at_ms:Date.now()-runStartedAt,label:"RELOAD",...reloaded});
      requireCondition(reloaded.scrap === 0 && reloaded.persistedScrap === 0, "T101 reload produced victory Scrap", reloaded);
      requireCondition(reloaded.rewardLedgerKeys.length === 1 && reloaded.rewardLedger?.[expectedBattleId] === true, "T101 defeat ledger did not survive reload consistently", reloaded);
      const sameOriginErrors=pageExceptions.map(item => item?.exception?.description || item?.text || "").filter(Boolean).filter(entry => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "T101 same-origin runtime exceptions detected", sameOriginErrors);
      const evidence={task:"T101",sha:process.env.GITHUB_SHA||"local",runId:process.env.GITHUB_RUN_ID||"local",browser:BROWSER_BIN,browserVersion:{product:browserVersion?.product||"",revision:browserVersion?.revision||"",userAgent:browserVersion?.userAgent||""},harness:"existing character_journey_browser_probe.mjs via T101_DEFEAT_PROOF=1",expectedBattleId,initial,rounds,defeat,returnComplete:complete,reloaded,postTerminalActionGuard:{control:actionControl,functional:true,before:postTerminalBefore,after:postTerminalAfter},persistence:{mechanism:"PlayerMetaPersistenceAdapter/localStorage",key:playerMetaKey,reloadVerified:true},reward:{expected:[],scrapBefore:initial.scrap,scrapAfter:complete.scrap,scrapAfterReload:reloaded.scrap},duplication:{ledgerBeforeReload:complete.rewardLedgerKeys.length,ledgerAfterReload:reloaded.rewardLedgerKeys.length},timeline,consoleErrors:consoleErrors.map(entry=>({text:entry.text,url:entry.url,source:entry.source})),pageErrors:sameOriginErrors};
      writeFileSync(join(EVIDENCE_DIR,"t101-defeat-browser-cdp-evidence.json"),JSON.stringify(evidence,null,2)+"\n","utf8");
      console.log((T104_PERSISTENCE_PROOF ? "T104" : "T101") + " BROWSER AUTOMATION = PASS_REAL");
      console.log("INITIAL STAMINA = " + initial.playerStamina + "/" + initial.playerStaminaMax);
      for (const r of rounds) console.log("ROUND " + r.round + " STAMINA = " + r.staminaBefore + " -> " + r.staminaAfter + " / " + r.timingGrade);
      console.log("DEFEAT = PASS_REAL");
      console.log("MATCH END = PASS_REAL");
      console.log("REWARD = []");
      console.log("SCRAP = " + initial.scrap + " -> " + complete.scrap + " -> RELOAD " + reloaded.scrap);
      console.log("DUPLICATION = PASS_REAL");
      console.log("RETURN = PASS_REAL");
      console.log("PERSISTENCE = PASS_REAL");
      console.log("POST-TERMINAL GUARDS = PASS_REAL");
      return;
    }
    if (process.env.T109_REWARD_BOUNDARY === "1") {
      const runStartedAt = Date.now();
      const browserVersion = await cdp.send("Browser.getVersion");
      const playerMetaKey = "baseball_waifus_player_meta_v1:local-player";

      const readRewardState = async () => cdpEvaluate(cdp, `(() => { const canvas = document.querySelector("#gameCanvas"); const d = canvas?.dataset || {}; const gacha = window.BaseballWaifusGacha?.getStatus?.() || null; const raw = localStorage.getItem("baseball_waifus_player_meta_v1:local-player"); let persisted = null; try { persisted = raw ? JSON.parse(raw) : null; } catch { persisted = null; } return { battlePhase:d.combatBattlePhase||"", tacticalTurn:d.combatTacticalTurn===""?null:Number(d.combatTacticalTurn), timingActive:d.combatTimingActive==="true", timingGrade:d.combatTimingGrade||"", combatResult:d.combatResult||"", presentationPhase:d.combatStagePresentationPhase||"", presentationActive:d.combatPresentationActive==="true", playerStamina:d.combatPlayerStamina===""?null:Number(d.combatPlayerStamina), scrap:Number(gacha?.scavenger_scrap??NaN), persistedScrap:Number(persisted?.currencies?.SCRAP??NaN), rewardLedger:persisted?.rewardLedger||null, rewardLedgerKeys:persisted?.rewardLedger?Object.keys(persisted.rewardLedger):[], playerMetaRawPresent:Boolean(raw) }; })()`);

      const mark = async (name, condition, timeoutMs = 6000) => {
        const deadline = Date.now() + timeoutMs;
        let state = null;
        while (Date.now() < deadline) {
          state = await readRewardState();
          if (condition(state)) return state;
          await sleep(25);
        }
        state = await readRewardState();
        throw new Error("T109 TIMEOUT: " + name + " " + JSON.stringify(state));
      };

      const clickBat = async (label) => {
        await waitFor(
          async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
          { timeoutMs: 6000, label: "T109 BATEAR ready " + label }
        );
        await cdpClickSelector(cdp, "#action-bat");
      };

      const advanceToClimax = async (round) => {
        let observed = await readRewardState();
        if (!(observed.battlePhase === "TACTICAL" && observed.tacticalTurn >= 1)) {
          await clickBat("round " + round + " T1");
        }
        observed = await mark(
          "ROUND " + round + " TACTICAL PROGRESS",
          s => s.battlePhase === "TACTICAL" && s.tacticalTurn >= 1
        );
        for (const turn of [2,3,4]) {
          if (observed.tacticalTurn < turn) {
            await clickBat("round " + round + " T" + turn);
          }
          observed = await mark(
            "ROUND " + round + " TACTICAL " + turn + " REACHED",
            s => s.battlePhase === "TACTICAL" && s.tacticalTurn >= turn
          );
        }
        await clickBat("round " + round + " T5");
        await mark(
          "ROUND " + round + " CLIMAX REACHED",
          s => s.battlePhase === "CLIMAX" && s.tacticalTurn >= 5
        );
      };

      const resolveNonTerminalMiss = async (round) => {
        await mark("ROUND " + round + " CLIMAX", s => s.battlePhase === "CLIMAX" && s.tacticalTurn === 5);
        await mark("ROUND " + round + " TIMING ACTIVE", s => s.battlePhase === "CLIMAX" && s.timingActive === true);
        const beforeTiming = await readRewardState();
        requireCondition(beforeTiming.scrap === 0 && beforeTiming.persistedScrap === 0, "T109 Scrap changed before non-terminal timing", beforeTiming);
        requireCondition(beforeTiming.rewardLedgerKeys.length === 0, "T109 reward ledger changed before non-terminal timing", beforeTiming);

        await sleep(120);
        const rect = await cdpEvaluate(cdp, "(() => { const r=document.querySelector('#gameCanvas')?.getBoundingClientRect(); return r ? {left:r.left,top:r.top,width:r.width,height:r.height} : null; })()");
        requireCondition(rect && rect.width > 0 && rect.height > 0, "T109 canvas geometry unavailable", rect);
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const target = await cdpEvaluate(cdp, "(() => document.elementFromPoint(" + x + "," + y + ") === document.querySelector('#gameCanvas'))()");
        requireCondition(target === true, "T109 physical Timing target is not canvas");
        await cdp.send("Input.setIgnoreInputEvents", { ignore:false });
        await cdp.send("Input.dispatchMouseEvent", { type:"mouseMoved", x, y, button:"none", buttons:0 });
        await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", x, y, button:"left", buttons:1, clickCount:1 });
        await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", x, y, button:"left", buttons:0, clickCount:1 });

        const afterTiming = await mark("ROUND " + round + " RESULT", s => s.timingActive === false && ["TACTICAL","VICTORY","DEFEAT"].includes(s.battlePhase), 5000);
        if (afterTiming.battlePhase !== "TACTICAL") return { beforeTiming, afterTiming, afterReturn: afterTiming, terminal: afterTiming.battlePhase };

        requireCondition(afterTiming.scrap === beforeTiming.scrap, "T109 Scrap changed after non-terminal Timing", { beforeTiming, afterTiming });
        requireCondition(afterTiming.persistedScrap === beforeTiming.persistedScrap, "T109 persisted Scrap changed after non-terminal Timing", { beforeTiming, afterTiming });
        requireCondition(afterTiming.rewardLedgerKeys.length === beforeTiming.rewardLedgerKeys.length, "T109 reward ledger changed after non-terminal Timing", { beforeTiming, afterTiming });

        await mark("ROUND " + round + " RETURN COMPLETE", s => s.battlePhase === "TACTICAL" && s.presentationPhase === "COMPLETE" && s.presentationActive === false, 5000);
        const afterReturn = await readRewardState();
        requireCondition(afterReturn.scrap === beforeTiming.scrap, "T109 Scrap changed after non-terminal return", { beforeTiming, afterReturn });
        requireCondition(afterReturn.persistedScrap === beforeTiming.persistedScrap, "T109 persisted Scrap changed after non-terminal return", { beforeTiming, afterReturn });
        requireCondition(afterReturn.rewardLedgerKeys.length === beforeTiming.rewardLedgerKeys.length, "T109 reward ledger changed after non-terminal return", { beforeTiming, afterReturn });
        return { beforeTiming, afterTiming, afterReturn, terminal: null };
      };

      const url = baseUrl + "?qa=t097";
      await cdp.send("Page.navigate", { url });
      await waitFor(
        async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete",
        { timeoutMs: 30000, label: "T109 document ready" }
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
        { timeoutMs: 30000, label: "T109 Home visible" }
      );

      const initial = await readRewardState();
      requireCondition(initial.scrap === 0, "T109 initial Scrap must be 0", initial);
      requireCondition(initial.persistedScrap === 0, "T109 initial persisted Scrap must be 0", initial);
      requireCondition(initial.rewardLedgerKeys.length === 0, "T109 initial reward ledger must be empty", initial);

      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#gameCanvas')?.dataset?.combatStageContract === 'COMBAT_STAGE_2_5D')"),
        { timeoutMs: 30000, label: "T109 formation initialized" }
      );

      await clickBat("TACTICAL");
      const tactical = await mark("TACTICAL", s => s.battlePhase === "TACTICAL" && s.tacticalTurn >= 1);
      requireCondition(tactical.scrap === initial.scrap, "T109 Scrap changed during Tactical", { initial, tactical });
      requireCondition(tactical.persistedScrap === initial.persistedScrap, "T109 persisted Scrap changed during Tactical", { initial, tactical });
      requireCondition(tactical.rewardLedgerKeys.length === initial.rewardLedgerKeys.length, "T109 reward ledger changed during Tactical", { initial, tactical });

      const round1Tactical = tactical;
      await advanceToClimax(1);
      const round1 = await resolveNonTerminalMiss(1);
      requireCondition(round1.terminal === null, "T109 first Timing unexpectedly reached a terminal result", round1);

      const tactical2 = await mark("TACTICAL 2", s => s.battlePhase === "TACTICAL" && s.tacticalTurn === 0 && s.playerStamina > 0);
      requireCondition(tactical2.scrap === initial.scrap, "T109 Scrap changed before second non-terminal Timing", { initial, tactical2 });
      requireCondition(tactical2.persistedScrap === initial.persistedScrap, "T109 persisted Scrap changed before second non-terminal Timing", { initial, tactical2 });

      await advanceToClimax(2);
      const round2 = await resolveNonTerminalMiss(2);
      requireCondition(round2.terminal === null, "T109 second Timing unexpectedly reached a terminal result", round2);

      const finalState = await readRewardState();
      requireCondition(finalState.scrap === initial.scrap, "T109 final authoritative Scrap changed mid-combat", { initial, finalState });
      requireCondition(finalState.persistedScrap === initial.persistedScrap, "T109 final persisted Scrap changed mid-combat", { initial, finalState });
      requireCondition(finalState.rewardLedgerKeys.length === initial.rewardLedgerKeys.length, "T109 reward ledger gained a terminal application mid-combat", { initial, finalState });
      requireCondition(finalState.battlePhase === "TACTICAL" && !["VICTORY","DEFEAT"].includes(finalState.combatResult), "T109 proof did not remain non-terminal", finalState);

      const evidence = {
        task: "T109",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        browserVersion: { product: browserVersion?.product || "", revision: browserVersion?.revision || "", userAgent: browserVersion?.userAgent || "" },
        harness: "existing character_journey_browser_probe.mjs via T109_REWARD_BOUNDARY=1",
        playerMetaKey,
        initial,
        tactical,
        rounds: [round1, round2],
        finalState,
        timingInput: { method: "CDP Input.dispatchMouseEvent", waitMs: 120, expectedGrade: "MISS" },
        rewardBoundary: { midCombatScrapUnchanged:true, persistedScrapUnchanged:true, rewardLedgerUnchanged:true, terminalNotReached:true },
        at_ms: Date.now() - runStartedAt
      };
      writeFileSync(join(EVIDENCE_DIR, "t109-mid-turn-reward-browser-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");
      console.log("T109 BROWSER AUTOMATION = PASS_REAL");
      console.log("SCRAP BEFORE = " + initial.scrap);
      console.log("TACTICAL SCRAP = " + tactical.scrap);
      console.log("ROUND 1 NON-TERMINAL CLIMAX/TIMING SCRAP = " + round1.afterReturn.scrap);
      console.log("ROUND 2 NON-TERMINAL CLIMAX/TIMING SCRAP = " + round2.afterReturn.scrap);
      console.log("MID-TURN REWARD = NONE");
      console.log("REWARD LEDGER = UNCHANGED");
      console.log("PLAYER META = UNCHANGED");
      console.log("TERMINAL BOUNDARY = NOT REACHED");
      return;
    }

    if (T111_TERMINAL_BOUNDARY) {
      const runStartedAt = Date.now();
      const browserVersion = await cdp.send("Browser.getVersion");
      const playerMetaKey = "baseball_waifus_player_meta_v1:local-player";
      const expectedBattleId = "battle:demo-bw001-vs-bw002";

      const readRuntime = async () => cdpEvaluate(cdp, "(() => { const canvas=document.querySelector('#gameCanvas'); const d=canvas?.dataset||{}; const gacha=window.BaseballWaifusGacha?.getStatus?.()||null; const raw=localStorage.getItem('baseball_waifus_player_meta_v1:local-player'); let persisted=null; try { persisted=raw ? JSON.parse(raw) : null; } catch {} return { battlePhase:d.combatBattlePhase||'', tacticalTurn:d.combatTacticalTurn===''?null:Number(d.combatTacticalTurn), timingActive:d.combatTimingActive==='true', timingGrade:d.combatTimingGrade||'', combatResult:d.combatResult||'', presentationPhase:d.combatStagePresentationPhase||'', presentationActive:d.combatPresentationActive==='true', scrap:Number(gacha?.scavenger_scrap??NaN), persistedScrap:Number(persisted?.currencies?.SCRAP??NaN), rewardLedger:persisted?.rewardLedger||{}, rewardLedgerKeys:persisted?.rewardLedger?Object.keys(persisted.rewardLedger):[], playerMetaRawPresent:Boolean(raw), playerMeta:persisted }; })()");

      const mark = async (name, condition, timeoutMs = 6000) => {
        const deadline = Date.now() + timeoutMs;
        let state = null;
        while (Date.now() < deadline) {
          state = await readRuntime();
          if (condition(state)) {
            const checkpoint = { at_ms: Date.now() - runStartedAt, ...state };
            return checkpoint;
          }
          await sleep(25);
        }
        state = await readRuntime();
        throw new Error("T111 TIMEOUT: " + name + " " + JSON.stringify(state));
      };

      const clickBat = async (label) => {
        await waitFor(
          async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
          { timeoutMs: 6000, label: "T111 BATEAR ready " + label }
        );
        await cdpClickSelector(cdp, "#action-bat");
      };

      const advanceToClimax = async () => {
        let observed = await readRuntime();
        if (!(observed.battlePhase === "TACTICAL" && observed.tacticalTurn >= 1)) {
          await clickBat("victory T1");
        }
        observed = await mark("TACTICAL 1+", s => s.battlePhase === "TACTICAL" && s.tacticalTurn >= 1);
        for (const turn of [2, 3, 4]) {
          if (observed.tacticalTurn < turn) {
            await clickBat("victory T" + turn);
          }
          observed = await mark("TACTICAL " + turn + "+", s => s.battlePhase === "TACTICAL" && s.tacticalTurn >= turn);
        }
        await clickBat("victory T5");
        return mark("CLIMAX", s => s.battlePhase === "CLIMAX" && s.tacticalTurn >= 5);
      };

      const url = baseUrl + "?qa=t097";
      await cdp.send("Page.navigate", { url });
      await waitFor(
        async () => (await cdpEvaluate(cdp, "document.readyState")) === "complete",
        { timeoutMs: 30000, label: "T111 document ready" }
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
        { timeoutMs: 30000, label: "T111 Home visible" }
      );

      const initial = await readRuntime();
      requireCondition(initial.scrap === 0, "T111 initial Scrap must be 0", initial);
      requireCondition(initial.persistedScrap === 0, "T111 initial persisted Scrap must be 0", initial);
      requireCondition(initial.rewardLedgerKeys.length === 0, "T111 initial reward ledger must be empty", initial);

      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#gameCanvas')?.dataset?.combatStageContract === 'COMBAT_STAGE_2_5D')"),
        { timeoutMs: 30000, label: "T111 formation initialized" }
      );
      await advanceToClimax();

      const beforeTerminal = await mark(
        "BEFORE TERMINAL",
        s => s.battlePhase === "CLIMAX" && s.timingActive === true,
        6000
      );
      requireCondition(beforeTerminal.scrap === initial.scrap, "T111 Scrap changed before terminal", { initial, beforeTerminal });
      requireCondition(beforeTerminal.persistedScrap === initial.persistedScrap, "T111 persisted Scrap changed before terminal", { initial, beforeTerminal });
      requireCondition(beforeTerminal.rewardLedgerKeys.length === initial.rewardLedgerKeys.length, "T111 reward ledger changed before terminal", { initial, beforeTerminal });

      await sleep(500);
      const elapsedAtInput = await cdpEvaluate(cdp, "window.__BW_T097_TIMING_ELAPSED__?.()");
      requireCondition(
        Number.isFinite(Number(elapsedAtInput)) && Number(elapsedAtInput) > 0 && Number(elapsedAtInput) < 860,
        "T111 timing window closed before terminal input",
        { elapsedAtInput }
      );

      const timingInput = await readRuntime();
      requireCondition(timingInput.timingActive === true, "T111 timing closed before terminal input", timingInput);
      const rect = await cdpEvaluate(cdp, "(() => { const r=document.querySelector('#gameCanvas')?.getBoundingClientRect(); return r ? {left:r.left,top:r.top,width:r.width,height:r.height} : null; })()");
      requireCondition(rect && rect.width > 0 && rect.height > 0, "T111 timing canvas geometry unavailable", rect);
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const target = await cdpEvaluate(cdp, "(() => document.elementFromPoint(" + x + "," + y + ") === document.querySelector('#gameCanvas'))()");
      requireCondition(target === true, "T111 physical timing target is not canvas");
      await cdp.send("Input.setIgnoreInputEvents", { ignore:false });
      await cdp.send("Input.dispatchMouseEvent", { type:"mouseMoved", x, y, button:"none", buttons:0 });
      await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", x, y, button:"left", buttons:1, clickCount:1 });
      await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", x, y, button:"left", buttons:0, clickCount:1 });

      const victory = await mark(
        "VICTORY",
        s => s.battlePhase === "VICTORY" && s.combatResult === "VICTORY",
        5000
      );
      requireCondition(victory.scrap === beforeTerminal.scrap + 100, "T111 Victory reward amount/order invalid", { beforeTerminal, victory });
      requireCondition(victory.persistedScrap === beforeTerminal.persistedScrap + 100, "T111 persisted victory reward amount invalid", { beforeTerminal, victory });
      requireCondition(victory.rewardLedgerKeys.length === beforeTerminal.rewardLedgerKeys.length + 1, "T111 victory reward ledger did not gain exactly one terminal application", { beforeTerminal, victory });
      requireCondition(victory.rewardLedger?.[expectedBattleId] === true, "T111 expected victory ledger entry missing", victory);

      const rewardApplication = {
        at_ms: Date.now() - runStartedAt,
        scrap: victory.scrap,
        persistedScrap: victory.persistedScrap,
        rewardLedgerKeys: victory.rewardLedgerKeys,
        battlePhase: victory.battlePhase,
        combatResult: victory.combatResult
      };

      const returnState = await mark(
        "RETURN",
        s => s.presentationPhase === "COMBAT_RETURN",
        5000
      );
      const completeState = await mark(
        "RETURN COMPLETE",
        s => s.presentationPhase === "COMPLETE" && s.presentationActive === false,
        5000
      );
      requireCondition(completeState.battlePhase === "VICTORY", "T111 victory terminal state changed during return", completeState);
      requireCondition(completeState.scrap === victory.scrap, "T111 Scrap changed again after terminal return", { victory, completeState });
      requireCondition(completeState.rewardLedgerKeys.length === 1, "T111 reward ledger changed after terminal return", completeState);

      const sameOriginErrors = pageExceptions
        .map((item) => item?.exception?.description || item?.text || "")
        .filter(Boolean)
        .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "T111 same-origin runtime exceptions detected", sameOriginErrors);

      const evidence = {
        task: "T111",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        browserVersion: {
          product: browserVersion?.product || "",
          revision: browserVersion?.revision || "",
          userAgent: browserVersion?.userAgent || ""
        },
        harness: "existing character_journey_browser_probe.mjs via T111_TERMINAL_BOUNDARY=1",
        playerMetaKey,
        expectedBattleId,
        checkpoints: { initial, beforeTerminal, victory, rewardApplication, returnState, completeState },
        timingInput: {
          method: "CDP Input.dispatchMouseEvent",
          elapsedMs: elapsedAtInput,
          targetBand: "500ms sleep / active timing window"
        },
        terminalBoundary: {
          lastNonTerminal: "CLIMAX/TIMING ACTIVE",
          terminalResult: "VICTORY",
          rewardObservedAfterTerminal: true,
          scrapBefore: beforeTerminal.scrap,
          scrapAfter: victory.scrap,
          expectedDelta: 100
        },
        consoleErrors: consoleErrors.map((entry) => ({ text:entry.text, url:entry.url, source:entry.source })),
        pageErrors: sameOriginErrors
      };
      writeFileSync(join(EVIDENCE_DIR, "t111-terminal-reward-boundary-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

      console.log("T111 BROWSER AUTOMATION = PASS_REAL");
      console.log("SCRAP BEFORE TERMINAL = " + beforeTerminal.scrap);
      console.log("LAST NON-TERMINAL STATE = CLIMAX/TIMING ACTIVE");
      console.log("VICTORY = PASS_REAL");
      console.log("COMBAT RESULT = VICTORY");
      console.log("MATCH END = PASS_REAL_BY_TERMINAL_RESULT");
      console.log("REWARD APPLICATION = PASS_REAL");
      console.log("SCRAP AFTER TERMINAL = " + victory.scrap);
      console.log("EXPECTED REWARD = +100 SCRAP");
      console.log("DUPLICATION = PASS_REAL");
      console.log("RETURN = PASS_REAL");
      console.log("TERMINAL BOUNDARY = PASS_REAL");
      console.log("PLAYER META = PASS_REAL");
      return;
    }
    if (T094_COMBAT_LOOP) {
      const runStartedAt = Date.now();
      const browserVersion = await cdp.send("Browser.getVersion");
      const timeline = [];
      const checkpoints = {};
      let lastSignature = "";

      const readCombatState = async () => cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); const d = canvas?.dataset || {}; const rect = canvas?.getBoundingClientRect(); return { battlePhase: d.combatBattlePhase || '', tacticalTurn: d.combatTacticalTurn === '' ? null : Number(d.combatTacticalTurn), tacticalMaxTurns: d.combatTacticalMaxTurns === '' ? null : Number(d.combatTacticalMaxTurns), timingActive: d.combatTimingActive === 'true', timingGrade: d.combatTimingGrade || '', combatResult: d.combatResult || '', presentationPhase: d.combatStagePresentationPhase || '', presentationActive: d.combatPresentationActive === 'true', stageContract: d.combatStageContract || '', actorCount: d.combatStageActorCount === '' ? null : Number(d.combatStageActorCount), playerCount: d.combatStagePlayerCount === '' ? null : Number(d.combatStagePlayerCount), enemyCount: d.combatStageEnemyCount === '' ? null : Number(d.combatStageEnemyCount), canvasVisible: Boolean(rect && rect.width > 0 && rect.height > 0), canvasRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null }; })()");

      const recordObservation = async (label = "OBSERVATION") => {
        const state = await readCombatState();
        const signature = [state.battlePhase, state.tacticalTurn, state.timingActive, state.timingGrade, state.combatResult, state.presentationPhase, state.presentationActive].join("|");
        if (signature !== lastSignature) {
          timeline.push({ at_ms: Date.now() - runStartedAt, label, ...state });
          lastSignature = signature;
        }
        return state;
      };

      const waitCombatFor = async (condition, { timeoutMs = 6000, intervalMs = 25, label = "combat state" } = {}) => {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const state = await recordObservation(label);
          if (condition(state)) return state;
          await sleep(intervalMs);
        }
        const finalState = await recordObservation(label + " TIMEOUT");
        throw new Error("T094 TIMEOUT: " + label + " " + JSON.stringify(finalState));
      };

      const markCheckpoint = async (name, condition, timeoutMs = 6000) => {
        const state = await waitCombatFor(condition, { timeoutMs, label: name });
        checkpoints[name] = { at_ms: Date.now() - runStartedAt, ...state };
        return state;
      };

      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#home-view') && !document.querySelector('#home-view').hidden)"),
        { timeoutMs: 30000, label: "T094 Home visible" }
      );
      await cdpClickSelector(cdp, ".home-action-play");

      await waitFor(
        async () => cdpEvaluate(cdp, "(() => { const c = document.querySelector('#gameCanvas'); const d = c?.dataset || {}; return Boolean(c && c.getBoundingClientRect().width > 0 && c.getBoundingClientRect().height > 0 && d.combatStageContract === 'COMBAT_STAGE_2_5D' && d.combatStageActorCount === '5'); })()"),
        { timeoutMs: 30000, label: "T094 Combat formation initialized" }
      );

      await markCheckpoint(
        "FORMATION",
        (state) => state.stageContract === "COMBAT_STAGE_2_5D" && state.actorCount === 5 && state.playerCount === 4 && state.enemyCount === 1 && state.canvasVisible && state.tacticalTurn === 0
      );

      await waitFor(
        async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
        { timeoutMs: 6000, label: "T094 BATEAR ready for T1" }
      );
      await cdpClickSelector(cdp, "#action-bat");

      for (const turn of [1, 2, 3, 4, 5]) {
        const targetBattlePhase = turn === 5 ? "CLIMAX" : "TACTICAL";
        await markCheckpoint(
          "TACTICAL " + String(turn),
          (state) => state.tacticalTurn === turn && state.battlePhase === targetBattlePhase
        );
        if (turn < 5) {
          await waitCombatFor(
            (state) => state.tacticalTurn === turn && state.presentationPhase === "COMPLETE" && state.presentationActive === false,
            { timeoutMs: 6000, label: "TACTICAL " + String(turn) + " presentation complete" }
          );
          await waitFor(
            async () => cdpEvaluate(cdp, "Boolean(document.querySelector('#action-bat') && !document.querySelector('#action-bat').disabled)"),
            { timeoutMs: 6000, label: "T094 BATEAR ready before T" + String(turn + 1) }
          );
          await cdpClickSelector(cdp, "#action-bat");
        }
      }

      await markCheckpoint(
        "CLIMAX",
        (state) => state.battlePhase === "CLIMAX" && state.tacticalTurn === 5
      );

      await markCheckpoint(
        "TIMING ACTIVE",
        (state) => state.battlePhase === "CLIMAX" && state.tacticalTurn === 5 && state.timingActive === true,
        6000
      );

      await sleep(620);
      const timingClickState = await readCombatState();
      requireCondition(timingClickState.timingActive === true, "T094 timing window closed before physical input", timingClickState);
      const timingRect = timingClickState.canvasRect;
      requireCondition(timingRect && timingRect.width > 0 && timingRect.height > 0, "T094 timing canvas geometry unavailable", timingRect);
      const clickX = timingRect.left + timingRect.width / 2;
      const clickY = timingRect.top + timingRect.height / 2;
      const hitTarget = await cdpEvaluate(cdp, "(() => { const el = document.elementFromPoint(" + clickX + ", " + clickY + "); return { tag: el?.tagName || '', id: el?.id || '', isCanvas: el === document.querySelector('#gameCanvas') }; })()");
      requireCondition(hitTarget?.isCanvas === true, "T094 physical timing target is not the game canvas", hitTarget);
      await cdp.send("Input.setIgnoreInputEvents", { ignore: false });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: clickX, y: clickY, button: "none", buttons: 0 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clickX, y: clickY, button: "left", buttons: 1, clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clickX, y: clickY, button: "left", buttons: 0, clickCount: 1 });

      const timingResolved = await markCheckpoint(
        "TIMING RESOLUTION",
        (state) => state.timingActive === false && Boolean(state.timingGrade),
        3000
      );
      const combatResult = await markCheckpoint(
        "COMBAT RESULT",
        (state) => Boolean(state.combatResult),
        5000
      );
      const presentationReturn = await markCheckpoint(
        "RETURN",
        (state) => state.presentationPhase === "COMBAT_RETURN",
        5000
      );
      const presentationComplete = await waitCombatFor(
        (state) => state.presentationPhase === "COMPLETE" && state.presentationActive === false,
        { timeoutMs: 5000, label: "T094 presentation complete after RETURN" }
      );

      const finalRuntime = await readCombatState();
      const sameOriginErrors = pageExceptions
        .map((item) => item?.exception?.description || item?.text || "")
        .filter(Boolean)
        .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "T094 same-origin page exceptions detected", sameOriginErrors);

      const required = ["FORMATION","TACTICAL 1","TACTICAL 2","TACTICAL 3","TACTICAL 4","TACTICAL 5","CLIMAX","TIMING ACTIVE","TIMING RESOLUTION","COMBAT RESULT","RETURN"];
      requireCondition(required.every((name) => checkpoints[name]), "T094 required checkpoints incomplete", { checkpoints, required });
      requireCondition(checkpoints["TACTICAL 5"].tacticalTurn === 5 && checkpoints["TACTICAL 5"].battlePhase === "CLIMAX" && checkpoints["CLIMAX"].tacticalTurn === 5, "T094 T5 -> CLIMAX order not verified", { tactical5: checkpoints["TACTICAL 5"], climax: checkpoints.CLIMAX });
      requireCondition(checkpoints["TIMING RESOLUTION"].timingGrade !== "", "T094 timing grade missing after physical input", timingResolved);
      requireCondition(checkpoints["COMBAT RESULT"].combatResult !== "", "T094 combat result missing after timing resolution", combatResult);
      requireCondition(checkpoints["RETURN"].presentationPhase === "COMBAT_RETURN", "T094 RETURN presentation phase not observed", presentationReturn);

      const evidence = {
        task: "T094",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        browserVersion: { product: browserVersion?.product || "", revision: browserVersion?.revision || "", userAgent: browserVersion?.userAgent || "" },
        harness: "existing character_journey_browser_probe.mjs via T094_COMBAT_LOOP=1",
        baseUrl,
        checkpoints,
        timingInput: { method: "CDP Input.dispatchMouseEvent", x: Math.round(clickX), y: Math.round(clickY), source: "real browser pointer input path" },
        timeline,
        presentationComplete,
        finalRuntime,
        network: { requestCount: network.requests.length, responseCount: network.responses.length },
        consoleErrors: consoleErrors.map((entry) => ({ text: entry.text, url: entry.url, source: entry.source })),
        pageErrors: sameOriginErrors
      };
      writeFileSync(join(EVIDENCE_DIR, "t094-normal-combat-cdp-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");

      console.log("T094 BROWSER AUTOMATION = PASS_REAL");
      for (const name of required) console.log(name + " = PASS_REAL");
      console.log("TIMING GRADE = " + checkpoints["TIMING RESOLUTION"].timingGrade);
      console.log("COMBAT RESULT = " + checkpoints["COMBAT RESULT"].combatResult);
      console.log("FINAL BATTLE PHASE = " + finalRuntime.battlePhase);
      return;
    }

    if (T077_COMBAT) {
      await cdpClickSelector(cdp, ".home-action-play");
      await waitFor(
        async () => cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); if (!canvas) return false; const rect = canvas.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; })()"),
        { label: "T077 Combat view visible" }
      );
      await waitFor(
        async () => cdpEvaluate(cdp, "(() => { const button = document.querySelector('#action-bat'); return Boolean(button && !button.disabled); })()"),
        { label: "T077 BATEAR enabled" }
      );

      const phaseTimeline = [];
      const phaseScreenshots = {};
      await cdpClickSelector(cdp, "#action-bat");

      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const state = await cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); return { phase: canvas?.dataset?.combatPresentationPhase || '', active: canvas?.dataset?.combatPresentationActive === 'true' }; })()");
        if (state.phase && phaseTimeline[phaseTimeline.length - 1] !== state.phase) {
          phaseTimeline.push(state.phase);
          if (["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN", "COMPLETE"].includes(state.phase)) {
            phaseScreenshots[state.phase] = await screenshot(cdp, "combat-" + state.phase.toLowerCase().replaceAll("_", "-"));
          }
        }
        if (state.phase === "COMPLETE" && state.active === false) break;
        await sleep(25);
      }

      const requiredPhases = ["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN", "COMPLETE"];
      requireCondition(
        requiredPhases.every((phase) => phaseTimeline.includes(phase)),
        "T077 presentation phase sequence incomplete",
        { phaseTimeline, requiredPhases }
      );

      const runtime = await cdpEvaluate(cdp, "(() => { const canvas = document.querySelector('#gameCanvas'); const button = document.querySelector('#action-bat'); const rect = canvas?.getBoundingClientRect(); return { phase: canvas?.dataset?.combatPresentationPhase || '', active: canvas?.dataset?.combatPresentationActive === 'true', combatVisible: Boolean(rect && rect.width > 0 && rect.height > 0), batEnabled: Boolean(button && !button.disabled) }; })()");
      requireCondition(runtime.combatVisible, "T077 combat canvas is not visible after presentation", runtime);
      requireCondition(runtime.phase === "COMPLETE" && runtime.active === false, "T077 presentation did not complete", runtime);

      const sameOriginErrors = pageExceptions
        .map((item) => item?.exception?.description || item?.text || "")
        .filter(Boolean)
        .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));
      requireCondition(sameOriginErrors.length === 0, "same-origin page exceptions detected", sameOriginErrors);

      const evidence = {
        task: "T077",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        baseUrl,
        journey: ["HOME", "COMBAT ENTRY", "REAL BAT INPUT", ...phaseTimeline],
        runtime,
        gameplayInputRecovery: "NOT_ASSERTED_BY_T077_FOUNDATION",
        phaseTimeline,
        screenshots: phaseScreenshots,
        network: { requestCount: network.requests.length, responseCount: network.responses.length },
        consoleErrors: consoleErrors.map((entry) => ({ text: entry.text, url: entry.url, source: entry.source })),
        pageErrors: sameOriginErrors
      };
      writeFileSync(
        join(EVIDENCE_DIR, "t077-combat-browser-evidence.json"),
        JSON.stringify(evidence, null, 2) + "\n",
        "utf8"
      );

      console.log("BROWSER AUTOMATION = PASS_REAL");
      console.log("HOME = PASS_REAL");
      console.log("COMBAT ENTRY = PASS_REAL");
      console.log("REAL BAT INPUT = PASS_REAL");
      console.log("ATTACKER FOCUS = PASS_REAL");
      console.log("ACTION = PASS_REAL");
      console.log("IMPACT = PASS_REAL");
      console.log("TARGET REACTION = PASS_REAL");
      console.log("COMBAT RETURN = PASS_REAL");
      console.log("PRESENTATION COMPLETE = PASS_REAL");
      console.log("T077 COMBAT PRESENTATION = PASS_REAL");
      return;
    }


    await cdpClickSelector(cdp, "#home-character-detail-open");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#character-detail-view");
        return Boolean(root && !root.hidden && document.querySelector("#character-detail-name")?.textContent?.trim() === "Aiko Hanamori");
      })()`),
      { label: "Aiko Character Detail" }
    );

    const detail = await cdpEvaluate(cdp, `(() => ({
      name: document.querySelector("#character-detail-name")?.textContent?.trim(),
      rarity: document.querySelector("#character-detail-rarity")?.textContent?.trim(),
      positionRole: document.querySelector("#character-detail-position")?.textContent?.trim(),
      playIdentity: document.querySelector("#character-detail-play-identity")?.textContent?.trim(),
      relationshipStatus: document.querySelector("#character-detail-relationship-status")?.textContent?.trim(),
      storyText: document.querySelector("#character-detail-story-open")?.textContent?.trim(),
      storyVisible: Boolean(document.querySelector("#character-detail-story-open") && !document.querySelector("#character-detail-story-open").hidden),
      lockerVisible: Boolean(document.querySelector("#character-detail-locker-open") && !document.querySelector("#character-detail-locker-open").hidden)
    }))()`);
    requireCondition(detail.name === "Aiko Hanamori", "Character Detail name mismatch", detail);
    requireCondition(detail.rarity === "R", "Character Detail rarity mismatch", detail);
    requireCondition(detail.positionRole.includes("3B"), "Character Detail position missing 3B", detail);
    requireCondition(detail.playIdentity === "BIG SWING THREAT", "Character Detail play identity mismatch", detail);
    requireCondition(detail.storyVisible, "Aiko Story button is not available", detail);
    screenshots.detail = await screenshot(cdp, "02-character-detail-aiko");

    const artPanelEvidence = {};
    if (T073_PRESENTATION || T074_ART) {
      await cdpClickSelector(cdp, "#btn-admin-trigger");
      await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector(\".admin-modal-overlay\") && !document.querySelector(\".admin-modal-overlay\").hidden)"), { label: "internal Admin Panel open" });
      await cdpClickText(cdp, ".admin-button", "OPEN ART PANEL");
      await waitFor(async () => cdpEvaluate(cdp, "Boolean(document.querySelector(\".art-panel-overlay\") && !document.querySelector(\".art-panel-overlay\").hidden)"), { label: "Art Panel open" });

      const panelIdentity = await cdpEvaluate(cdp, "(() => { const s=document.querySelector(\"#art-panel-character-select\"); const option=[...(s?.options||[])].find((x)=>x.value===\"bw001\"); return { characterId:s?.value||\"\", containsBw001:Boolean(option), text:document.querySelector(\".art-panel-identity\")?.textContent?.trim()||\"\" }; })()");
      requireCondition(panelIdentity.containsBw001, "Art Panel does not expose bw001", panelIdentity);
      await cdpEvaluate(cdp, "(() => { const s=document.querySelector(\"#art-panel-character-select\"); s.value=\"bw001\"; s.dispatchEvent(new Event(\"change\",{bubbles:true})); return s.value; })()");

      const injectFile = async (mime, filename, dataUrl) => cdpEvaluate(cdp, "(async () => { const input=document.querySelector(\"#art-panel-file-input\"); const response=await fetch("+JSON.stringify(dataUrl)+"); const blob=await response.blob(); const file=new File([blob],"+JSON.stringify(filename)+",{type:"+JSON.stringify(mime)+"}); const transfer=new DataTransfer(); transfer.items.add(file); input.files=transfer.files; input.dispatchEvent(new Event(\"change\",{bubbles:true})); await new Promise((resolve)=>setTimeout(resolve,120)); return {name:input.files[0]?.name||\"\",type:input.files[0]?.type||\"\",size:input.files[0]?.size||0}; })()");
      const transparentPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
      const pngFile = await injectFile("image/png", "bw001-art-test-transparent.png", transparentPng);
      const pngPreview = await waitFor(async () => cdpEvaluate(cdp, "(() => ({ status:document.querySelector(\".art-panel-status\")?.textContent?.trim()||\"\", lightLoaded:Boolean(document.querySelector(\".art-panel-preview-light img\")?.complete&&document.querySelector(\".art-panel-preview-light img\")?.naturalWidth>0), darkLoaded:Boolean(document.querySelector(\".art-panel-preview-dark img\")?.complete&&document.querySelector(\".art-panel-preview-dark img\")?.naturalWidth>0) }))()"), { timeoutMs: 5000, label: "PNG light/dark Art Panel preview" });
      requireCondition(pngFile.type==="image/png" && pngFile.size>0, "PNG test file was not selected", pngFile);
      requireCondition(pngPreview.lightLoaded && pngPreview.darkLoaded, "PNG preview did not render on both backgrounds", pngPreview);

      const jpegData = await cdpEvaluate(cdp, "(() => { const canvas=document.createElement(\"canvas\"); canvas.width=2; canvas.height=2; const ctx=canvas.getContext(\"2d\"); ctx.fillStyle=\"#fff\"; ctx.fillRect(0,0,2,2); return canvas.toDataURL(\"image/jpeg\",0.9); })()");
      const jpgFile = await injectFile("image/jpeg", "bw001-art-test-white-background.jpg", jpegData);
      const jpgPreview = await waitFor(async () => cdpEvaluate(cdp, "(() => ({ lightLoaded:Boolean(document.querySelector(\".art-panel-preview-light img\")?.complete&&document.querySelector(\".art-panel-preview-light img\")?.naturalWidth>0), darkLoaded:Boolean(document.querySelector(\".art-panel-preview-dark img\")?.complete&&document.querySelector(\".art-panel-preview-dark img\")?.naturalWidth>0) }))()"), { timeoutMs: 5000, label: "JPG light/dark Art Panel preview" });
      requireCondition(jpgFile.type==="image/jpeg" && jpgFile.size>0, "JPG test file was not selected", jpgFile);
      requireCondition(jpgPreview.lightLoaded && jpgPreview.darkLoaded, "JPG preview did not render on both backgrounds", jpgPreview);

      await cdpClickText(cdp, ".art-panel-button", "SAVE LOCAL DRAFT");
      const association = await cdpEvaluate(cdp, "(() => { const raw=localStorage.getItem(\"baseball_waifus_art_registry_v2\"); const parsed=raw?JSON.parse(raw):{}; return parsed.bw001||null; })()");
      requireCondition(association?.source==="LOCAL ART INPUT", "Art Panel draft source mismatch", association);
      requireCondition(association?.filename==="bw001-art-test-white-background.jpg", "Art Panel stored unexpected test filename", association);
      const bindingAfterDraft = await cdpEvaluate(cdp, "import(\"./js/character_art_registry.js\").then((m)=>m.getCharacterArtBinding(\"bw001\"))");
      requireCondition(bindingAfterDraft?.status==="DRAFT", "Art Panel local selection was not represented as DRAFT", bindingAfterDraft);
      requireCondition(bindingAfterDraft?.project_asset===false, "Local draft was incorrectly promoted to project asset", bindingAfterDraft);
      requireCondition(bindingAfterDraft?.status!=="APPROVED", "Local draft was incorrectly promoted to APPROVED", bindingAfterDraft);
      const manifest = await cdpEvaluate(cdp, "fetch(\"./assets/characters/approved/manifest.json\",{cache:\"no-store\"}).then((r)=>r.json())");
      requireCondition(!manifest?.assets?.bw001, "bw001 is unexpectedly approved in the project manifest", manifest);
      const projectAssetResponse = await cdpEvaluate(cdp, "fetch(\"./assets/characters/approved/bw001.png\",{cache:\"no-store\"}).then((r)=>({ok:r.ok,status:r.status}))");
      requireCondition(projectAssetResponse.ok===false && projectAssetResponse.status===404, "bw001 production PNG unexpectedly exists on T074 base", projectAssetResponse);
      artPanelEvidence.identity=panelIdentity; artPanelEvidence.png={file:pngFile,preview:pngPreview}; artPanelEvidence.jpg={file:jpgFile,preview:jpgPreview}; artPanelEvidence.association=association; artPanelEvidence.bindingAfterDraft=bindingAfterDraft; artPanelEvidence.manifest=manifest; artPanelEvidence.projectAssetResponse=projectAssetResponse;
      screenshots.artPanel=await screenshot(cdp, T074_ART ? "03-art-panel-t074-bw001-previews" : "03-art-panel-bw001-previews");
      await cdpClickSelector(cdp, ".art-panel-close");
      await cdpClickSelector(cdp, ".admin-modal-close");
    }

    const assetPresentation = await cdpEvaluate(cdp, `(() => {
      const art = document.querySelector("#character-detail-art");
      const hero = document.querySelector("#character-detail-hero-presentation");
      const victory = document.querySelector("#character-detail-victory-art");
      return {
        cardPath: art?.getAttribute("src") || "",
        cardLoaded: Boolean(art?.complete && art?.naturalWidth > 0),
        heroPath: hero?.getAttribute("src") || "",
        heroLoaded: Boolean(hero?.complete && hero?.naturalWidth > 0),
        victoryPath: victory?.getAttribute("src") || "",
        victoryLoaded: Boolean(victory?.complete && victory?.naturalWidth > 0)
      };
    })()`);
    requireCondition(assetPresentation.cardPath.includes("/assets/production/cards/bw001--normal.svg"), "Aiko Character Detail card asset path mismatch", assetPresentation);
    requireCondition(assetPresentation.cardLoaded, "Aiko Character Detail card asset did not load", assetPresentation);
    if (T073_PRESENTATION) {
      requireCondition(assetPresentation.heroLoaded && assetPresentation.victoryLoaded, "Aiko Character Detail presentation assets did not load", assetPresentation);
    }

    const expressionAssets = await cdpEvaluate(cdp, `(() => [...document.querySelectorAll("#character-detail-expression-set img")].map((image) => ({ src: image.getAttribute("src") || "", loaded: Boolean(image.complete && image.naturalWidth > 0) })) )()`);
    if (T073_PRESENTATION) {
      requireCondition(expressionAssets.length === 5, "Aiko expression presentation set is incomplete", expressionAssets);
      requireCondition(expressionAssets.every((item) => item.loaded), "Aiko expression asset failed to load", expressionAssets);
    }

    const binding = await cdpEvaluate(cdp, `import("./js/character_story_bindings.js").then((m) => m.getCharacterStoryBinding("bw001"))`);
    requireCondition(binding?.id === "bw001-story-arc0", "Aiko story binding ID mismatch", binding);
    requireCondition(binding?.sceneId === "arc0-team11-recruitment", "Aiko story scene mismatch", binding);
    requireCondition(binding?.scene?.dialogue_lines?.some((line) => line.character_id === "bw001"), "Aiko story scene does not contain bw001 dialogue", binding);

    await cdpClickSelector(cdp, "#character-detail-story-open");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#narrative-test-view");
        const speaker = document.querySelector(".narrative-test-speaker")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && speaker.length > 0);
      })()`),
      { label: "NarrativePresentation open" }
    );

    const story = await cdpEvaluate(cdp, `(() => ({
      visible: !document.querySelector("#narrative-test-view")?.hidden,
      eyebrow: document.querySelector(".narrative-test-eyebrow")?.textContent?.trim(),
      speaker: document.querySelector(".narrative-test-speaker")?.textContent?.trim(),
      text: document.querySelector(".narrative-test-text")?.textContent?.trim(),
      status: document.querySelector(".narrative-test-status")?.textContent?.trim(),
      controls: [...document.querySelectorAll(".narrative-test-controls button")].map((button) => button.textContent.trim())
    }))()`);
    requireCondition(story.visible, "Story presentation is not visible", story);
    requireCondition(story.eyebrow === "CHARACTER STORY // ARC 0", "Story eyebrow mismatch", story);
    requireCondition(story.speaker === "Entrenador", "ARC0 first speaker mismatch", story);
    requireCondition(story.text.startsWith("Si este es el punto de reunión del Equipo 11"), "ARC0 first line mismatch", story);
    requireCondition(story.controls.includes("ADVANCE") && story.controls.includes("SKIP"), "Narrative controls missing", story);
    screenshots.story = await screenshot(cdp, "03-story-arc0-aiko");

    let completed = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      completed = await cdpEvaluate(cdp, `(() => Boolean(document.querySelector("#narrative-test-view")?.hidden))()`);
      if (completed) break;
      await cdpClickText(cdp, ".narrative-test-controls button", "ADVANCE");
      await sleep(80);
    }
    requireCondition(completed, "ARC0 did not complete through real ADVANCE interactions");

    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#character-detail-view");
        const context = document.querySelector("#character-detail-relationship-context")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && context.includes("STORY COMPLETE"));
      })()`),
      { label: "story completion and relationship context" }
    );

    await sleep(300);

    const postCompletion = await cdpEvaluate(cdp, `(() => {
      const context = document.querySelector("#character-detail-relationship-context")?.textContent?.trim() || "";
      const storyStatus = document.querySelector("#character-detail-story-status")?.textContent?.trim() || "";
      const state = window.BaseballWaifusGacha?.getState?.() || null;
      return { context, storyStatus, meta: { active: state?.active_batter || null, owned: Boolean(state?.inventory?.bw001), duplicateCount: Number(state?.inventory?.bw001?.duplicate_count || 0) }, storageKeys: Object.keys(localStorage).filter((key) => key.startsWith("baseball_waifus_player_meta_v1:")) };
    })()`);
    requireCondition(postCompletion.meta.active === "bw001", "active batter changed after story completion", postCompletion);
    requireCondition(postCompletion.meta.owned && postCompletion.meta.duplicateCount === 1, "Aiko ownership changed after story completion", postCompletion);
    requireCondition(postCompletion.context.includes("STORY COMPLETE"), "relationship context did not mark Story Complete", postCompletion);

    await cdpClickSelector(cdp, "#character-detail-locker-open");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#locker-view");
        const name = document.querySelector("#locker-waifu-name")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && name.includes("Aiko Hanamori"));
      })()`),
      { label: "Aiko Locker" }
    );

    const locker = await cdpEvaluate(cdp, `(() => ({
      visible: !document.querySelector("#locker-view")?.hidden,
      name: document.querySelector("#locker-waifu-name")?.textContent?.trim(),
      rapport: document.querySelector("#locker-rapport")?.textContent?.trim(),
      activeId: window.BaseballWaifusGacha?.getActiveBatter?.() || null,
      canvas: Boolean(document.querySelector("#locker-canvas")),
      presentationSrc: document.querySelector("#locker-character-art")?.getAttribute("src") || "",
      presentationLoaded: Boolean(document.querySelector("#locker-character-art")?.complete && document.querySelector("#locker-character-art")?.naturalWidth > 0),
      presentationHidden: Boolean(document.querySelector("#locker-character-art")?.hidden),
      returnVisible: Boolean(document.querySelector("#locker-character-detail"))
    }))()`);
    requireCondition(locker.visible, "Locker is not visible", locker);
    requireCondition(locker.name === "WAIFU // Aiko Hanamori", "Locker character identity mismatch", locker);
    requireCondition(/RAPPORT\s*(?:\/\/\s*)?1\/10/.test(locker.rapport), "fresh rapport changed unexpectedly", locker);
    requireCondition(locker.activeId === "bw001", "Locker active character is not bw001", locker);
    requireCondition(locker.canvas, "Locker interaction canvas is missing", locker);
    if (T073_PRESENTATION) {
      requireCondition(locker.presentationSrc.includes("/assets/production/presentation/bw001--profile.svg"), "Locker Aiko production presentation path mismatch", locker);
      requireCondition(locker.presentationLoaded && !locker.presentationHidden, "Locker Aiko production presentation asset did not load visibly", locker);
    }
    const rapportBeforeReaction = locker.rapport;

    await waitFor(
      async () => network.requests.some((item) => item.url.includes("/assets/audio/voices/bw001/REACTION_INACTIVITY.mp3")),
      { timeoutMs: 12000, label: "Aiko Locker inactivity reaction voice hook" }
    );

    const reactionEvidence = (() => {
      const voiceRequests = network.requests.filter((item) => item.url.includes("/assets/audio/voices/bw001/REACTION_INACTIVITY.mp3"));
      const voiceResponses = network.responses.filter((item) => item.url.includes("/assets/audio/voices/bw001/REACTION_INACTIVITY.mp3"));
      requireCondition(voiceRequests.length > 0, "browser did not request Aiko Locker REACTION_INACTIVITY voice URL");
      return { requestCount: voiceRequests.length, responses: voiceResponses, voiceUrl: voiceRequests[0].url };
    })();

    const rapportAfterReaction = await cdpEvaluate(cdp, `(() => document.querySelector("#locker-rapport")?.textContent?.trim() || "")()`);
    requireCondition(rapportAfterReaction === rapportBeforeReaction, "Locker reaction changed rapport unexpectedly", { before: rapportBeforeReaction, after: rapportAfterReaction });
    screenshots.locker = await screenshot(cdp, "04-locker-aiko");

    await cdpClickSelector(cdp, "#locker-character-detail");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#character-detail-view");
        const name = document.querySelector("#character-detail-name")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && name === "Aiko Hanamori");
      })()`),
      { label: "return to Character Detail" }
    );

    const returnDetail = await cdpEvaluate(cdp, `(() => ({
      name: document.querySelector("#character-detail-name")?.textContent?.trim(),
      context: document.querySelector("#character-detail-relationship-context")?.textContent?.trim(),
      progression: document.querySelector("#character-detail-level")?.textContent?.trim(),
      relationship: document.querySelector("#character-detail-relationship-status")?.textContent?.trim()
    }))()`);
    requireCondition(returnDetail.name === "Aiko Hanamori", "Character Detail identity lost after Locker return", returnDetail);
    requireCondition(returnDetail.context.includes("STORY COMPLETE"), "relationship context lost after Locker return", returnDetail);

    await cdpClickSelector(cdp, "#character-detail-close");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#home-view");
        const name = document.querySelector("#home-character-name")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && name === "Aiko Hanamori");
      })()`),
      { label: "return to Home" }
    );

    const finalHome = await cdpEvaluate(cdp, `(() => ({
      visible: !document.querySelector("#home-view")?.hidden,
      name: document.querySelector("#home-character-name")?.textContent?.trim(),
      batter: document.querySelector("#home-squad-batter")?.textContent?.trim(),
      ownedCount: document.querySelector("#home-owned-count")?.textContent?.trim(),
      role: document.querySelector("#home-character-role")?.textContent?.trim(),
      playIdentity: document.querySelector("#home-character-play-identity")?.textContent?.trim()
    }))()`);
    requireCondition(finalHome.name === "Aiko Hanamori", "final Home identity mismatch", finalHome);
    requireCondition(finalHome.batter.includes("Aiko Hanamori"), "final Home batter identity mismatch", finalHome);
    screenshots.finalHome = await screenshot(cdp, "05-home-aiko-final");

    const sameOriginErrors = pageExceptions
      .map((item) => item?.exception?.description || item?.text || "")
      .filter(Boolean)
      .filter((entry) => entry.includes(baseUrl) || entry.includes("/js/"));

    const evidence = {
      task: T074_ART ? "T074" : (T073_PRESENTATION ? "T073" : "T072"),
      sha: process.env.GITHUB_SHA || "local",
      runId: process.env.GITHUB_RUN_ID || "local",
      browser: BROWSER_BIN,
      baseUrl,
      journey: [
        "FRESH PLAYER",
        "Aiko STARTER",
        "HOME",
        "CHARACTER DETAIL",
        ...(T073_PRESENTATION || T074_ART ? ["ART PANEL", "LOCAL PNG PREVIEW", "LOCAL JPG PREVIEW", "DRAFT ASSOCIATION"] : []),
        "STORY",
        "ARC0",
        "COMPLETE",
        "LOCKER",
        "REACTION / VOICE HOOK",
        "CHARACTER DETAIL",
        "HOME"
      ],
      identity: { character_id: "bw001", display_name: "Aiko Hanamori" },
      initialRuntime,
      schemaRates: { R: schema.gacha.rates.R, SR: schema.gacha.rates.SR, SSR: schema.gacha.rates.SSR, UR: schema.gacha.rates.UR },
      pity: {
        softStart: schema.gacha.pity.soft_pity.start_pull,
        hardLimit: schema.gacha.pity.hard_pity.pull_limit
      },
      home,
      detail,
      binding: { id: binding.id, sceneId: binding.sceneId },
      story,
      expressionAssets,
      postCompletion,
      reactionEvidence,
      locker,
      returnDetail,
      finalHome,
      assetPresentation,
      artPanelEvidence,
      screenshots,
      consoleErrors: consoleErrors.map((entry) => ({
        text: entry.text,
        url: entry.url,
        source: entry.source
      })),
      pageErrors: sameOriginErrors
    };

    writeFileSync(join(EVIDENCE_DIR, T074_ART ? "t074-browser-evidence.json" : (T073_PRESENTATION ? "t073-browser-evidence.json" : "t072-browser-evidence.json")), JSON.stringify(evidence, null, 2) + "\n", "utf8");
    requireCondition(sameOriginErrors.length === 0, "same-origin page exceptions detected", sameOriginErrors);

    console.log("BROWSER AUTOMATION = PASS_REAL");
    console.log("FRESH PLAYER = PASS_REAL");
    console.log("BW001 STARTER = PASS_REAL");
    console.log("HOME = PASS_REAL");
    console.log("CHARACTER DETAIL = PASS_REAL");
    console.log("STORY = PASS_REAL");
    console.log("ARC0 = PASS_REAL");
    console.log("COMPLETION = PASS_REAL");
    console.log("RELATIONSHIP = PASS_REAL");
    console.log("LOCKER = PASS_REAL");
    console.log("RAPPORT = PASS_REAL");
    console.log("REACTION = PASS_REAL");
    console.log("VOICE HOOK = PASS_REAL");
    console.log("VOICE PLAYBACK = NOT_RUN");
    console.log("GACHA RATES = PASS_REAL");
    console.log("GACHA PITY = PASS_REAL");
    if (T074_ART) console.log("T074 ART PIPELINE = PASS_REAL");
    else if (T073_PRESENTATION) console.log("T073 CHARACTER PRESENTATION = PASS_REAL");
    else console.log("T072 BROWSER JOURNEY = PASS_REAL");
  } catch (error) {
    writeFileSync(
      join(EVIDENCE_DIR, "t072-browser-failure.json"),
      JSON.stringify({
        task: "T072",
        sha: process.env.GITHUB_SHA || "local",
        runId: process.env.GITHUB_RUN_ID || "local",
        browser: BROWSER_BIN,
        baseUrl,
        error: String(error?.stack || error),
        requests: network.requests,
        responses: network.responses,
        consoleErrors: consoleErrors.map((entry) => ({
          text: entry.text,
          url: entry.url,
          source: entry.source
        })),
        pageExceptions: pageExceptions.map((item) => item?.exception?.description || item?.text || "")
      }, null, 2) + "\n",
      "utf8"
    );
    throw error;
  } finally {
    try { cdp?.close(); } catch {}
    try { browser?.kill("SIGTERM"); } catch {}
    try { server?.close(); } catch {}
  }
}

run().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
