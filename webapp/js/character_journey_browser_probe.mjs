import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { extname, normalize, relative, resolve, join } from "node:path";
import { tmpdir } from "node:os";

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

async function run() {
  requireCondition(BROWSER_BIN, "BROWSER_BIN not set");
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
      "--remote-debugging-port=9222",
      "--user-data-dir=" + mkdtempSync(join(tmpdir(), "t072-chrome-")),
      "about:blank"
    ], { stdio: "ignore" });

    const version = await waitForJson("http://127.0.0.1:9222/json/version");
    const targets = await waitForJson("http://127.0.0.1:9222/json/list");
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

    await cdpClickText(cdp, ".narrative-test-controls button", "SKIP");

    await waitFor(
      async () => cdpEvaluate(cdp, `(() => {
        const root = document.querySelector("#character-detail-view");
        const context = document.querySelector("#character-detail-relationship-context")?.textContent?.trim() || "";
        return Boolean(root && !root.hidden && context.includes("STORY SEEN"));
      })()`),
      { label: "SKIP reaction return to Character Detail" }
    );

    const reactionEvidence = (() => {
      const voiceRequests = network.requests.filter((item) => item.url.includes("/assets/audio/voices/bw001/REACTION_SKIP.mp3"));
      const voiceResponses = network.responses.filter((item) => item.url.includes("/assets/audio/voices/bw001/REACTION_SKIP.mp3"));
      requireCondition(voiceRequests.length > 0, "browser did not request Aiko REACTION_SKIP voice URL");
      return { requestCount: voiceRequests.length, responses: voiceResponses, voiceUrl: voiceRequests[0].url };
    })();

    await cdpClickSelector(cdp, "#character-detail-story-open");
    await waitFor(
      async () => cdpEvaluate(cdp, `(() => Boolean(document.querySelector("#narrative-test-view") && !document.querySelector("#narrative-test-view").hidden))()`),
      { label: "ARC0 replay after reaction proof" }
    );

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
      returnVisible: Boolean(document.querySelector("#locker-character-detail"))
    }))()`);
    requireCondition(locker.visible, "Locker is not visible", locker);
    requireCondition(locker.name === "WAIFU // Aiko Hanamori", "Locker character identity mismatch", locker);
    requireCondition(locker.rapport === "RAPPORT // 1/10", "fresh rapport changed unexpectedly", locker);
    requireCondition(locker.activeId === "bw001", "Locker active character is not bw001", locker);
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
      task: "T072",
      sha: process.env.GITHUB_SHA || "local",
      runId: process.env.GITHUB_RUN_ID || "local",
      browser: BROWSER_BIN,
      baseUrl,
      journey: [
        "FRESH PLAYER",
        "Aiko STARTER",
        "HOME",
        "CHARACTER DETAIL",
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
      postCompletion,
      reactionEvidence,
      locker,
      returnDetail,
      finalHome,
      screenshots,
      consoleErrors: consoleErrors.map((entry) => ({
        text: entry.text,
        url: entry.url,
        source: entry.source
      })),
      pageErrors: sameOriginErrors
    };

    writeFileSync(join(EVIDENCE_DIR, "t072-browser-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");
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
    console.log("T072 BROWSER JOURNEY = PASS_REAL");
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
