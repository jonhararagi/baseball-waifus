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
    const path = decodeURIComponent(req.url.split("?")[0]);
    const relative = path === "/" ? "index.html" : path.replace(/^\/+/, "");
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

let nextId = 10;
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
    throw new Error(result.exceptionDetails.exception?.description || "Browser evaluation failed");
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
    "--user-data-dir=" + profile,
    "--remote-debugging-port=" + debugPort,
    "--remote-allow-origins=*",
    "about:blank"
  ], { stdio: ["ignore", "ignore", "inherit"] });

  const page = await waitForTarget();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await cdp("Page.navigate", { url });
  await sleep(7000);

  if (!await evaluate("Boolean(window.__BW_BONE004_TEST__)")) {
    throw new Error("BONE-004 QA hooks unavailable");
  }

  const initialScrap = await evaluate("window.__BW_BONE004_TEST__.getPlayerMetaScrap()");
  if (initialScrap !== 0) throw new Error("Expected zero initial Scrap");

  const localResult = await evaluate(
    "window.__BW_BONE004_TEST__.localTerminalResult(" + JSON.stringify({
      type: "TurnResultDTO",
      match_id: "bone004-match-001",
      turn_id: "local-turn-001",
      result: "VICTORY",
      outcome: "VICTORY",
      match_end: true,
      state: { match_complete: true, outcome: "VICTORY" }
    }) + ")"
  );
  const localScrap = await evaluate("window.__BW_BONE004_TEST__.getPlayerMetaScrap()");
  if (localResult?.economicRewardGranted !== false || localScrap !== 0) throw new Error("Local demo reward boundary failed");
  console.log("LOCAL_RESULT = DEMO_ONLY");
  console.log("LOCAL_REWARD = BLOCKED");

  const browserSetup = await evaluate("(async () => {" +
    "const module = await import('/js/reward_authority.js');" +
    "const keys = await crypto.subtle.generateKey({name:'ECDSA', namedCurve:'P-256'}, true, ['sign','verify']);" +
    "const publicKeyJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);" +
    "const playerId = window.__BW_BONE004_TEST__.getPlayerId();" +
    "const matchId = 'bone004-match-browser';" +
    "const nonce = 'bone004-browser-nonce';" +
    "const turnId = 'turn-browser-001';" +
    "const outcome = 'VICTORY';" +
    "const result = 'VICTORY';" +
    "const canonical = module.canonicalizeServerCombatAttestationPayload({matchId, playerId, turnId, outcome, result, nonce});" +
    "const signatureBuffer = await crypto.subtle.sign({name:'ECDSA', hash:'SHA-256'}, keys.privateKey, new TextEncoder().encode(canonical));" +
    "let binary = ''; for (const byte of new Uint8Array(signatureBuffer)) binary += String.fromCharCode(byte);" +
    "const signature = btoa(binary).replace(/\\\\+/g,'-').replace(/\\\\//g,'_').replace(/=+$/g,'');" +
    "const turnResult = {type:'TurnResultDTO', match_id:matchId, turn_id:turnId, result, outcome, match_end:true, state:{match_complete:true, outcome}};" +
    "const attestation = {version:module.SERVER_COMBAT_ATTESTATION_V1, algorithm:'ECDSA_P256_SHA256', match_id:matchId, player_id:playerId, turn_id:turnId, outcome, result, nonce, signature};" +
    "const context = {version:module.SERVER_COMBAT_ATTESTATION_V1, matchId, playerId, nonce, publicKeyJwk};" +
    "return {turnResult, attestation, context};" +
  "})()");

  const validRun = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult({...s.turnResult, reward_attestation:s.attestation}, s.context);" +
    "return {ok:Boolean(result?.applied?.ok), scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (!validRun.ok || validRun.scrap !== 100) throw new Error("Valid server attestation did not grant expected reward");
  console.log("VALID_SERVER_ATTESTATION = ACCEPTED");

  const forged = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult({...s.turnResult, reward_attestation:{...s.attestation, signature:''}}, s.context);" +
    "return {result, scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (forged.scrap !== 100) throw new Error("Forged result changed economy");
  console.log("FORGED_SERVER_RESULT = REJECTED");

  const tampered = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult({...s.turnResult, result:'DEFEAT', outcome:'DEFEAT', state:{match_complete:true,outcome:'DEFEAT'}, reward_attestation:s.attestation}, s.context);" +
    "return {result, scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (tampered.scrap !== 100) throw new Error("Tampered result changed economy");
  console.log("TAMPERED_RESULT = REJECTED");

  const wrongMatch = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult({...s.turnResult, match_id:'bone004-other-match', reward_attestation:s.attestation}, s.context);" +
    "return {result, scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (wrongMatch.scrap !== 100) throw new Error("Wrong match changed economy");
  console.log("MATCH_BINDING = PASS");

  const wrongPlayer = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "s.context = {...s.context, playerId:'bone004-other-player'};" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult(s.turnResult, s.context);" +
    "return {result, scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (wrongPlayer.scrap !== 100) throw new Error("Wrong player changed economy");
  console.log("PLAYER_BINDING = PASS");

  const wrongNonce = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "s.context = {...s.context, nonce:'bone004-other-nonce'};" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult(s.turnResult, s.context);" +
    "return {result, scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (wrongNonce.scrap !== 100) throw new Error("Wrong nonce changed economy");
  console.log("NONCE_BINDING = PASS");

  const duplicate = await evaluate("(async () => {" +
    "const s = " + JSON.stringify(browserSetup) + ";" +
    "const result = await window.__BW_BONE004_TEST__.serverTerminalResult({...s.turnResult, reward_attestation:s.attestation}, s.context);" +
    "return {duplicate:Boolean(result?.applied?.duplicate), scrap:window.__BW_BONE004_TEST__.getPlayerMetaScrap()};" +
  "})()");
  if (!duplicate.duplicate || duplicate.scrap !== 100) throw new Error("Duplicate reward not idempotent");
  console.log("DUPLICATE_REWARD = NO_OP");
  console.log("PLAYER_META = CONSISTENT");
  console.log("BONE-004 BROWSER PROBE = PASS");
} finally {
  try { chrome?.kill("SIGKILL"); } catch {}
  try { ws?.close?.(); } catch {}
  try { server.close(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
