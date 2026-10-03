import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { tmpdir } from "node:os";

const siteDir = process.env.SITE_DIR || process.argv[2] || "site";
const browserBin = process.env.BROWSER_BIN || "chromium";
const root = normalize(siteDir);
const pathname = "/index.html";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = createServer((req, res) => {
  try {
    const requestPath = decodeURIComponent(req.url.split("?")[0]);
    const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const file = normalize(join(root, relative));
    if (!file.startsWith(root + "/") && file !== root) throw new Error("Path traversal");
    const size = statSync(file).size;
    res.writeHead(200, {
      "content-type": mime[extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": size,
      "cache-control": "no-store"
    });
    res.end(readFileSync(file));
  } catch (error) {
    res.writeHead(error?.code === "ENOENT" ? 404 : 500);
    res.end(String(error?.message || error));
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const port = server.address().port;
const url = "http://127.0.0.1:" + port + pathname + "?qa=bone004";
const debugPort = 41000 + Math.floor(Math.random() * 10000);
const profile = mkdtempSync(join(tmpdir(), "bone004-chromium-"));
let chrome;
let ws;

async function waitForTarget() {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:" + debugPort + "/json/list");
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chromium CDP target unavailable");
}

let nextId = 1;
async function cdp(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return await new Promise((resolve, reject) => {
    const handler = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      ws.removeEventListener("message", handler);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result || {});
    };
    ws.addEventListener("message", handler);
  });
}

async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Browser evaluation failed");
  }
  return result.result?.value;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  console.log("BONE-004 BROWSER BIN = " + browserBin);
  console.log("BONE-004 PROBE URL = " + url);

  chrome = spawn(browserBin, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=" + debugPort,
    "--remote-allow-origins=*",
    "--user-data-dir=" + profile,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "ignore"] });

  const page = await waitForTarget();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await cdp("Page.navigate", { url });

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await evaluate("Boolean(window.__BW_BONE004_TEST__ && window.__BW_BONE004_TEST__.getPlayerId && window.__BW_BONE004_TEST__.getPlayerId())");
    if (ready) break;
    if (attempt === 119) throw new Error("BONE-004 QA hooks/player identity did not become ready");
    await sleep(250);
  }

  const initialScrap = await evaluate("window.__BW_BONE004_TEST__.getPlayerMetaScrap()");
  if (initialScrap !== 0) throw new Error("Expected zero initial Scrap");

  const localResult = await evaluate("window.__BW_BONE004_TEST__.localTerminalResult(" + JSON.stringify({
    type: "TurnResultDTO",
    match_id: "bone004-local-match",
    turn_id: "bone004-local-turn",
    result: "VICTORY",
    outcome: "VICTORY",
    match_end: true,
    state: { match_complete: true, outcome: "VICTORY" }
  }) + ")");
  const localScrap = await evaluate("window.__BW_BONE004_TEST__.getPlayerMetaScrap()");
  if (localResult?.economicRewardGranted !== false || localScrap !== 0) throw new Error("Local demo reward boundary failed");
  console.log("LOCAL_RESULT = DEMO_ONLY");
  console.log("LOCAL_REWARD = BLOCKED");

  const serverExpression = String.raw`(async () => {
    const authority = await import("./js/reward_authority.js");
    const playerId = window.__BW_BONE004_TEST__.getPlayerId();
    const matchId = "bone004-browser-match";
    const turnId = "bone004-browser-turn";
    const nonce = "bone004-browser-nonce";
    const outcome = "VICTORY";
    const result = "VICTORY";
    const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
    const canonical = authority.canonicalizeServerCombatAttestationPayload({ matchId, playerId, turnId, outcome, result, nonce });
    const signatureBuffer = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new TextEncoder().encode(canonical));
    let binary = "";
    for (const byte of new Uint8Array(signatureBuffer)) binary += String.fromCharCode(byte);
    const signature = btoa(binary).split("=")[0].split("+").join("-").split("/").join("_");
    const attestation = {
      version: authority.SERVER_COMBAT_ATTESTATION_V1,
      algorithm: "ECDSA_P256_SHA256",
      match_id: matchId,
      player_id: playerId,
      turn_id: turnId,
      outcome,
      result,
      nonce,
      signature
    };
    const context = {
      version: authority.SERVER_COMBAT_ATTESTATION_V1,
      matchId,
      playerId,
      nonce,
      publicKeyJwk
    };
    const turnResult = {
      type: "TurnResultDTO",
      match_id: matchId,
      turn_id: turnId,
      result,
      outcome,
      match_end: true,
      state: { match_complete: true, outcome }
    };

    const forgedResult = await window.__BW_BONE004_TEST__.serverTerminalResult({
      ...turnResult,
      reward_attestation: { ...attestation, signature: "" }
    }, context);
    const forgedScrap = window.__BW_BONE004_TEST__.getPlayerMetaScrap();
    if (forgedScrap !== 0 || forgedResult !== null) throw new Error("Forged server result changed economy");

    const tamperedResult = await window.__BW_BONE004_TEST__.serverTerminalResult({
      ...turnResult,
      outcome: "DEFEAT",
      result: "DEFEAT",
      state: { match_complete: true, outcome: "DEFEAT" },
      reward_attestation: attestation
    }, context);
    const tamperedScrap = window.__BW_BONE004_TEST__.getPlayerMetaScrap();
    if (tamperedScrap !== 0 || tamperedResult !== null) throw new Error("Tampered result changed economy");

    const validPipeline = await window.__BW_BONE004_TEST__.serverTerminalResult({
      ...turnResult,
      reward_attestation: attestation
    }, context);
    const validScrap = window.__BW_BONE004_TEST__.getPlayerMetaScrap();
    if (!validPipeline?.applied?.ok || validPipeline.applied.duplicate || validScrap !== 100) throw new Error("Valid server attestation did not grant canonical reward");

    const duplicatePipeline = await window.__BW_BONE004_TEST__.serverTerminalResult({
      ...turnResult,
      reward_attestation: attestation
    }, context);
    const duplicateScrap = window.__BW_BONE004_TEST__.getPlayerMetaScrap();
    if (!duplicatePipeline?.applied?.duplicate || duplicateScrap !== 100) throw new Error("Duplicate reward was not a no-op");

    return {
      forged: true,
      tampered: true,
      validAttestation: true,
      validReward: true,
      scrapAfterValid: validScrap,
      duplicate: true,
      scrapAfterDuplicate: duplicateScrap,
      playerMetaConsistent: duplicateScrap === 100
    };
  })()`;
  const serverResult = await evaluate(serverExpression);

  if (!serverResult?.forged || !serverResult?.tampered) throw new Error("Forgery/tamper cases incomplete");
  console.log("FORGED_SERVER_RESULT = REJECTED");
  console.log("TAMPERED_RESULT = REJECTED");
  console.log("VALID_SERVER_ATTESTATION = ACCEPTED");
  console.log("VALID_REWARD = ACCEPTED");
  console.log("SCRAP_AFTER_VALID = " + serverResult.scrapAfterValid);
  console.log("DUPLICATE_REWARD = NO_OP");
  console.log("SCRAP_AFTER_DUPLICATE = " + serverResult.scrapAfterDuplicate);
  console.log("PLAYER_META = " + (serverResult.playerMetaConsistent ? "CONSISTENT" : "INCONSISTENT"));
  console.log("BONE-004 BROWSER PROBE = PASS");
} catch (error) {
  console.error("BONE-004 BROWSER PROBE = FAIL");
  console.error(String(error?.stack || error));
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  try { chrome?.kill("SIGTERM"); } catch {}
  try { server.close(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
