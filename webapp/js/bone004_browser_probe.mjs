import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { tmpdir } from "node:os";
import { CombatService } from "../../backend/src/combat_service.mjs";
import { InMemoryCombatStore } from "../../backend/src/combat_store.mjs";
import { createEphemeralTestSigner } from "../../backend/src/attestation_signer.mjs";

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

  const playerId = await evaluate("window.__BW_BONE004_TEST__.getPlayerId()");
  if (typeof playerId !== "string" || !playerId.trim()) throw new Error("Browser PlayerMeta identity unavailable");

  // Produce the terminal result and signature in Node using the real backend service.
  const backendStore = new InMemoryCombatStore();
  const backendSigner = createEphemeralTestSigner();
  const combatService = new CombatService({ store: backendStore, signer: backendSigner });
  const matchId = "bone004-backend-match";
  const terminalSeed = backendStore.createMatch({ matchId, playerId });
  terminalSeed.phase = "CLIMAX";
  terminalSeed.bossHp = 20;
  terminalSeed.internalEnergy = 100;
  terminalSeed.tacticalEffectiveness = 100;
  terminalSeed.playerStamina = 100;
  backendStore.saveMatch(terminalSeed, { expectedRevision: terminalSeed.revision });

  const authorityInit = await combatService.init(matchId, playerId);
  const serverTurnResult = await combatService.applyTurn({
    matchId,
    playerId,
    body: {
      action: { type: "BAT" },
      timing_grade: "GREAT",
      turn_id: authorityInit.state.turn_id
    }
  });

  if (!serverTurnResult.victory || serverTurnResult.outcome !== "VICTORY") {
    throw new Error("CombatService did not produce the expected terminal victory");
  }
  if (!serverTurnResult.reward_attestation) {
    throw new Error("CombatService did not return a backend-signed attestation");
  }
  if (
    serverTurnResult.match_id !== matchId
    || serverTurnResult.reward_attestation.match_id !== matchId
    || serverTurnResult.reward_attestation.player_id !== playerId
    || serverTurnResult.reward_attestation.turn_id !== serverTurnResult.turn_id
    || serverTurnResult.reward_attestation.nonce !== authorityInit.reward_authority.nonce
  ) {
    throw new Error("Backend turn result and attestation context do not match");
  }

  const authorityContext = {
    version: authorityInit.reward_authority.version,
    matchId: authorityInit.match_id,
    playerId,
    nonce: authorityInit.reward_authority.nonce,
    publicKeyJwk: authorityInit.reward_authority.public_key_jwk
  };

  console.log("BACKEND_SIGNER = NODE_EPHEMERAL_P256");
  console.log("SERVER_MATCH_ID = " + serverTurnResult.match_id);
  console.log("SERVER_PLAYER_ID = " + playerId);
  console.log("SERVER_TURN_ID = " + serverTurnResult.turn_id);
  console.log("SERVER_OUTCOME = " + serverTurnResult.outcome);
  console.log("SERVER_RESULT = " + serverTurnResult.result);
  console.log("SERVER_ATTESTATION = " + serverTurnResult.reward_attestation.version);
  console.log("SERVER_SIGNATURE_ALGORITHM = " + serverTurnResult.reward_attestation.algorithm);

  const serverExpression = "(async () => {"
    + "const hooks = window.__BW_BONE004_TEST__;"
    + "const turnResult = " + JSON.stringify(serverTurnResult) + ";"
    + "const context = " + JSON.stringify(authorityContext) + ";"
    + "const scrap = () => hooks.getPlayerMetaScrap();"
    + "if (scrap() !== 0) throw new Error('Economic state was not zero before backend handoff');"

    + "const unsigned = await hooks.serverTerminalResult({ ...turnResult, reward_attestation: { ...turnResult.reward_attestation, signature: '' } }, context);"
    + "if (unsigned !== null || scrap() !== 0) throw new Error('Missing signature was not rejected');"

    + "const tampered = await hooks.serverTerminalResult({ ...turnResult, outcome: 'DEFEAT', result: 'DEFEAT', state: { ...turnResult.state, outcome: 'DEFEAT' } }, context);"
    + "if (tampered !== null || scrap() !== 0) throw new Error('Tampered terminal result was not rejected');"

    + "const wrongPlayer = await hooks.serverTerminalResult(turnResult, { ...context, playerId: 'bone004-wrong-player' });"
    + "if (wrongPlayer !== null || scrap() !== 0) throw new Error('Wrong-player context was not rejected');"

    + "const wrongMatch = await hooks.serverTerminalResult(turnResult, { ...context, matchId: 'bone004-other-match' });"
    + "if (wrongMatch !== null || scrap() !== 0) throw new Error('Wrong-match context was not rejected');"

    + "const wrongNonce = await hooks.serverTerminalResult(turnResult, { ...context, nonce: context.nonce + '-wrong' });"
    + "if (wrongNonce !== null || scrap() !== 0) throw new Error('Wrong-nonce context was not rejected');"

    + "const accepted = await hooks.serverTerminalResult(turnResult, context);"
    + "const afterFirst = scrap();"
    + "if (!accepted?.applied?.ok || accepted.applied.duplicate || afterFirst !== 100) throw new Error('Backend attestation did not grant exactly +100 SCRAP');"

    + "const duplicate = await hooks.serverTerminalResult(turnResult, context);"
    + "const afterDuplicate = scrap();"
    + "if (!duplicate?.applied?.duplicate || afterDuplicate !== 100) throw new Error('Duplicate reward was not an economic no-op');"

    + "return {"
    + "missingSignatureRejected: true,"
    + "tamperedResultRejected: true,"
    + "wrongPlayerRejected: true,"
    + "wrongMatchRejected: true,"
    + "wrongNonceRejected: true,"
    + "attestationAccepted: true,"
    + "firstRewardAccepted: true,"
    + "scrapAfterFirst: afterFirst,"
    + "duplicateNoOp: true,"
    + "scrapAfterDuplicate: afterDuplicate,"
    + "playerMetaConsistent: afterDuplicate === 100"
    + "};"
    + "})()";
  const serverResult = await evaluate(serverExpression);

  if (
    !serverResult?.missingSignatureRejected
    || !serverResult?.tamperedResultRejected
    || !serverResult?.wrongPlayerRejected
    || !serverResult?.wrongMatchRejected
    || !serverResult?.wrongNonceRejected
  ) throw new Error("Backend-signed negative binding cases incomplete");
  console.log("MISSING_SIGNATURE = REJECTED");
  console.log("TAMPERED_RESULT = REJECTED");
  console.log("WRONG_PLAYER_CONTEXT = REJECTED");
  console.log("WRONG_MATCH_CONTEXT = REJECTED");
  console.log("WRONG_NONCE_CONTEXT = REJECTED");
  console.log("VALID_BACKEND_ATTESTATION = " + (serverResult.attestationAccepted ? "ACCEPTED" : "REJECTED"));
  console.log("FIRST_REWARD = " + (serverResult.firstRewardAccepted ? "ACCEPTED" : "REJECTED"));
  console.log("SCRAP_AFTER_FIRST = " + serverResult.scrapAfterFirst);
  console.log("DUPLICATE_REWARD = " + (serverResult.duplicateNoOp ? "NO_OP" : "FAILED"));
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
