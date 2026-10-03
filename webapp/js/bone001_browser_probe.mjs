import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { tmpdir } from "node:os";

const siteDir = process.env.SITE_DIR || process.argv[2] || "site";
const browserBin = process.env.BROWSER_BIN || "chromium";
const root = normalize(siteDir);
const probePath = "/__bone001_probe.html";
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
    if (pathname === probePath) {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      });
      res.end("<!doctype html><meta charset=\"utf-8\"><title>BONE-001 Probe</title>");
      return;
    }
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
const url = `http://127.0.0.1:${port}${probePath}`;
const debugPort = 40000 + Math.floor(Math.random() * 10000);
const profile = mkdtempSync(join(tmpdir(), "bone001-chromium-"));
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
  console.log(`BONE-001 BROWSER BIN = ${browserBin}`);
  console.log(`BONE-001 PROBE URL = ${url}`);

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
  await new Promise((resolve) => setTimeout(resolve, 750));

  const expression = `(async () => {
    const failures = [];
    const loads = Number(sessionStorage.getItem("bone001.browser.loads") || "0") + 1;
    sessionStorage.setItem("bone001.browser.loads", String(loads));
    if (loads !== 1) failures.push("RELOAD_LOOP");

    const versionResponse = await fetch("./version.json", { cache: "no-store" });
    if (!versionResponse.ok) throw new Error("version.json HTTP " + versionResponse.status);
    const version = await versionResponse.json();
    if (version.version !== "v17") failures.push("VERSION=" + version.version);
    if (version.cacheVersion !== "baseball-waifus-v17") failures.push("CACHE_VERSION=" + version.cacheVersion);

    const gate = await import("./js/version_gate.js");
    const gateResult = await gate.runClientVersionGate({
      reload: () => failures.push("UNEXPECTED_RELOAD")
    });
    if (gateResult.status !== "match") failures.push("VERSION_GATE=" + gateResult.status);

    if (!("serviceWorker" in navigator)) throw new Error("SERVICE_WORKER_UNAVAILABLE");

    await caches.open("v16_capibara_core");
    await caches.open("baseball-waifus-v16");

    const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;

    if (!registration.active) failures.push("SERVICE_WORKER_NOT_ACTIVE");

    const cacheNames = await caches.keys();
    if (!cacheNames.includes("baseball-waifus-v17")) failures.push("ACTIVE_CACHE_MISSING");
    if (cacheNames.includes("v16_capibara_core")) failures.push("LEGACY_CACHE_PRESENT");
    if (cacheNames.includes("baseball-waifus-v16")) failures.push("OLD_PRODUCT_CACHE_PRESENT");

    return {
      pass: failures.length === 0,
      version: version.version,
      cache: cacheNames.includes("baseball-waifus-v17") ? "baseball-waifus-v17" : "MISSING",
      legacy: cacheNames.includes("v16_capibara_core") ? "PRESENT" : "PURGED",
      gate: gateResult.status,
      serviceWorker: registration.active ? "READY" : "NOT_READY",
      reloadLoop: failures.some((item) => item === "RELOAD_LOOP" || item === "UNEXPECTED_RELOAD") ? "DETECTED" : "NOT_DETECTED",
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

  console.log(`BONE-001 BROWSER PROBE = ${value.pass ? "PASS" : "FAIL"}`);
  console.log(`VERSION = ${value.version}`);
  console.log(`CACHE = ${value.cache}`);
  console.log(`LEGACY_CACHE = ${value.legacy}`);
  console.log(`VERSION_GATE = ${value.gate}`);
  console.log(`SERVICE_WORKER = ${value.serviceWorker}`);
  console.log(`RELOAD_LOOP = ${value.reloadLoop}`);
  if (value.failures?.length) console.log(`FAILURES = ${value.failures.join(",")}`);

  if (!value.pass) process.exitCode = 1;
  ws.close();
} catch (error) {
  console.error("BONE-001 BROWSER PROBE = FAIL");
  console.error(String(error?.stack || error));
  process.exitCode = 1;
} finally {
  server.close();
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
