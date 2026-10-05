import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { tmpdir } from "node:os";

const siteDir = process.env.SITE_DIR || process.argv[2] || "site";
const browserBin = process.env.BROWSER_BIN || "chromium";
const root = normalize(siteDir);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json"
};

const server = createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(req.url.split("?")[0]);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
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
const url = `http://127.0.0.1:${port}/?bone002=1`;
const debugPort = 40000 + Math.floor(Math.random() * 10000);
const profile = mkdtempSync(join(tmpdir(), "bone002-chromium-"));
let chrome;

async function waitForTarget() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
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

async function cdp(ws, id, method, params = {}) {
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

try {
  console.log(`BONE-002 BROWSER BIN = ${browserBin}`);
  console.log(`BONE-002 PROBE URL = ${url}`);

  chrome = spawn(browserBin, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${debugPort}`,
    "--remote-allow-origins=*",
    "about:blank"
  ], { stdio: ["ignore", "ignore", "ignore"] });

  const page = await waitForTarget();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  await cdp(ws, 1, "Runtime.enable");
  await cdp(ws, 2, "Page.enable");
  await cdp(ws, 3, "Page.navigate", { url });

  const expression = `(async () => {
    const failures = [];
    const waitFor = async (predicate, timeoutMs = 15000) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        try {
          if (await predicate()) return true;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    };

    const schemaResponse = await fetch("./data/game_schemas_recycled.json", { cache: "no-store" });
    const queueResponse = await fetch("./data/characters_queue.json", { cache: "no-store" });
    if (!schemaResponse.ok) failures.push("SCHEMA_HTTP_" + schemaResponse.status);
    if (!queueResponse.ok) failures.push("QUEUE_HTTP_" + queueResponse.status);

    const schema = await schemaResponse.json();
    const queue = await queueResponse.json();

    if (schema?.gacha?.rates?.status !== "active_canonical_game_table_v1") failures.push("SCHEMA_STATUS");
    const rates = schema?.gacha?.rates || {};
    if (rates.R !== 80 || rates.SR !== 15 || rates.SSR !== 4 || rates.UR !== 1) failures.push("BALANCE_RATES");
    if (rates.R + rates.SR + rates.SSR + rates.UR !== 100) failures.push("RATE_SUM");

    const pity = schema?.gacha?.pity || {};
    if (pity.model !== "per_banner_counter") failures.push("PITY_MODEL");
    if (pity.soft_pity?.enabled !== true || pity.soft_pity?.start_pull !== 61 || pity.soft_pity?.increment_per_pull_percent !== 0.5) failures.push("SOFT_PITY");
    if (pity.hard_pity?.enabled !== true || pity.hard_pity?.pull_limit !== 80 || pity.hard_pity?.guaranteed_rarity !== "UR") failures.push("HARD_PITY");

    const units = [
      { character_id: queue.character_id, canonical: queue.canonical, acquisition: queue.acquisition },
      ...(Array.isArray(queue.batch_units) ? queue.batch_units : [])
    ];
    const pools = { R: [], SR: [], SSR: [], UR: [] };
    const starters = [];
    for (const unit of units) {
      if (unit.acquisition?.mode === "STARTER") starters.push(unit.character_id);
      const rarity = String(unit.canonical?.rarity || "").toUpperCase();
      if (unit.acquisition?.pool_eligible !== false && pools[rarity]) pools[rarity].push(unit.character_id);
    }
    for (const rarity of ["R", "SR", "SSR", "UR"]) {
      if (pools[rarity].length === 0) failures.push(rarity + "_POOL_EMPTY");
    }
    for (const starter of starters) {
      if (Object.values(pools).some((pool) => pool.includes(starter))) failures.push("STARTER_IN_POOL_" + starter);
    }

    const hookReady = await waitFor(() => Boolean(window.__BW_BONE002_GACHA__), 20000);
    if (!hookReady) {
      failures.push("HOOK_NOT_INSTALLED");
    }

    const hook = window.__BW_BONE002_GACHA__ || null;
    const bootstrapError = hook?.getBootstrapError?.() || null;
    if (bootstrapError) failures.push("BOOTSTRAP_ERROR");

    const appReady = hookReady && await waitFor(() => hook?.getReady?.() === true, 20000);
    if (!appReady) {
      failures.push("GACHA_NOT_READY");
    }

    const status = hook?.getStatus?.() || null;
    const state = hook?.getState?.() || null;
    if (status?.ready !== true) failures.push("GACHA_READY");
    if (!state || !starters.every((id) => Number(state.inventory?.[id]?.duplicate_count || 0) >= 1)) failures.push("PLAYER_META_STARTER");
    if (!state || !starters.includes(state.active_batter)) failures.push("PLAYER_META_ACTIVE_BATTER");
    if (state && state.pulls_since_UR !== 0) failures.push("PLAYER_META_PITY_CHANGED");
    if (state && state.scavenger_scrap !== 0) failures.push("PLAYER_META_SCRAP_CHANGED");
    if (state && state.fragment_bank !== 0) failures.push("PLAYER_META_FRAGMENTS_CHANGED");

    return {
      pass: failures.length === 0,
      schema: schemaResponse.ok && failures.every((item) => !item.startsWith("SCHEMA_") && item !== "BALANCE_RATES" && item !== "RATE_SUM" && item !== "PITY_MODEL" && item !== "SOFT_PITY" && item !== "HARD_PITY"),
      queue: queueResponse.ok && failures.every((item) => !item.startsWith("QUEUE_") && !item.startsWith("R_POOL") && !item.startsWith("SR_POOL") && !item.startsWith("SSR_POOL") && !item.startsWith("UR_POOL")),
      pools,
      gachaReady: status?.ready === true,
      playerMeta: Boolean(state && starters.every((id) => Number(state.inventory?.[id]?.duplicate_count || 0) >= 1) && starters.includes(state.active_batter)),
      bootstrapError,
      failures
    };
  })()`;

  const result = await cdp(ws, 4, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);

  const value = result.result?.value;
  if (!value) throw new Error("Chromium returned no probe result");

  console.log(`BONE-002 BROWSER PROBE = ${value.pass ? "PASS" : "FAIL"}`);
  console.log(`SCHEMA = ${value.schema ? "LOADED" : "FAIL"}`);
  console.log(`QUEUE = ${value.queue ? "LOADED" : "FAIL"}`);
  console.log(`R_POOL = ${value.pools.R?.length > 0 ? "PASS" : "FAIL"}`);
  console.log(`SR_POOL = ${value.pools.SR?.length > 0 ? "PASS" : "FAIL"}`);
  console.log(`SSR_POOL = ${value.pools.SSR?.length > 0 ? "PASS" : "FAIL"}`);
  console.log(`UR_POOL = ${value.pools.UR?.length > 0 ? "PASS" : "FAIL"}`);
  console.log(`GACHA_READY = ${value.gachaReady ? "PASS" : "FAIL"}`);
  console.log(`PLAYER_META = ${value.playerMeta ? "PASS" : "FAIL"}`);
  console.log(`BOOTSTRAP_ERROR = ${value.bootstrapError || "NONE"}`);
  if (value.failures?.length) console.log(`FAILURES = ${value.failures.join(",")}`);

  if (!value.pass) process.exitCode = 1;
  ws.close();
} catch (error) {
  console.error("BONE-002 BROWSER PROBE = FAIL");
  console.error(String(error?.stack || error));
  process.exitCode = 1;
} finally {
  server.close();
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
