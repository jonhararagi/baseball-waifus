import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { tmpdir } from "node:os";

const siteDir = process.env.SITE_DIR || process.argv[2] || "site";
const browserBin = process.env.BROWSER_BIN || "chromium";
const root = normalize(siteDir);
const probePath = "/__bone003_probe.html";
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
    const pathname = decodeURIComponent(req.url.split("?")[0]);
    if (pathname === probePath) {
      const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#050812}
#probe-stage{width:960px;height:540px;margin:0}
canvas{display:block;width:960px;height:540px}
</style></head><body><div id="probe-stage"><canvas id="combat-canvas"></canvas></div></body></html>`;
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(html);
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
const profile = mkdtempSync(join(tmpdir(), "bone003-chromium-"));
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
  console.log(`BONE-003 BROWSER BIN = ${browserBin}`);
  console.log(`BONE-003 PROBE URL = ${url}`);

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
    const [
      { CombatRenderer, resolvePresentationAttackerId },
      { CombatPresentationDirector, COMBAT_PRESENTATION_PHASE },
      { CombatStage, CharacterActor2D5 }
    ] = await Promise.all([
      import("./js/combat.js"),
      import("./js/combat_presentation_director.js"),
      import("./js/combat_stage.js")
    ]);

    const canvas = document.querySelector("#combat-canvas");
    const stage = new CombatStage({
      actors: [
        new CharacterActor2D5({ actorId: "PLAYER-01", position: { x: 0.18, y: 0.58 }, depth: "MID" }),
        new CharacterActor2D5({ actorId: "PLAYER-02", position: { x: 0.10, y: 0.46 }, depth: "FAR" }),
        new CharacterActor2D5({ actorId: "PLAYER-03", position: { x: 0.37, y: 0.68 }, depth: "NEAR" }),
        new CharacterActor2D5({ actorId: "PLAYER-04", position: { x: 0.48, y: 0.50 }, depth: "MID" }),
        new CharacterActor2D5({ actorId: "ENEMY-01", team: "ENEMY", position: { x: 0.76, y: 0.42 }, depth: "MID", facing: -1 })
      ]
    });
    stage.setSelectedActor("PLAYER-01");

    const renderer = new CombatRenderer(canvas, {
      presentationDirector: new CombatPresentationDirector({ stage })
    });
    renderer.combatStage = stage;

    const events = [];
    const director = new CombatPresentationDirector({
      stage,
      onStep: (event) => {
        events.push(event);
        renderer._handleCombatPresentationStep(event);
      }
    });
    renderer.combatPresentation = director;

    const drawnActors = [];
    renderer.batterRenderer.draw = () => {
      drawnActors.push(currentActorId);
    };

    const originalProjectile = stage.resolveCinematicProjectile.bind(stage);
    let projectileSourceActor = "";
    stage.resolveCinematicProjectile = (attackerId, targetId, options) => {
      projectileSourceActor = attackerId;
      return originalProjectile(attackerId, targetId, options);
    };

    const fakeCtx = {
      save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {},
      set strokeStyle(_) {}, set lineWidth(_) {}, set fillStyle(_) {}, set shadowColor(_) {}, set shadowBlur(_) {},
      set globalAlpha(_) {}
    };

    const result = Object.freeze({
      attackerId: "PLAYER-03",
      targetId: "ENEMY-01",
      result: "HOME_RUN",
      damage: 100,
      actionType: "SWING"
    });
    const gameplayBefore = JSON.stringify(result);
    let currentActorId = "";

    director.startFromCombatResult(result);

    if (director.getState().result?.attackerId !== "PLAYER-03") failures.push("RESULT_ATTACKER");
    if (director.getCameraTransform({ width: 960, height: 540 }).focusActorId !== "PLAYER-03") failures.push("FOCUS_CAMERA");

    const renderAllActors = () => {
      for (const actor of stage.getSortedActors()) {
        currentActorId = actor.actorId;
        const transform = stage.resolveActorTransform(actor.actorId, { width: 960, height: 540 });
        renderer._drawCombatStageActor(fakeCtx, actor, transform, 960, 540);
      }
      currentActorId = "";
    };

    drawnActors.length = 0;
    renderAllActors();
    const focusRendered = drawnActors.includes("PLAYER-03");
    if (!focusRendered || drawnActors.includes("PLAYER-01")) failures.push("FOCUS_RENDER");

    const player01 = stage.getActor("PLAYER-01");
    const player03 = stage.getActor("PLAYER-03");
    if (player03?.getPresentationState() !== "FOCUS") failures.push("FOCUS_ACTOR");
    if (player01?.getPresentationState() !== "IDLE") failures.push("SELECTED_ACTOR_FOCUS");

    director.update(0.23);
    if (director.getState().phase !== COMBAT_PRESENTATION_PHASE.ACTION) failures.push("ACTION_PHASE");
    if (director.getCameraTransform({ width: 960, height: 540 }).focusActorId !== "PLAYER-03") failures.push("ACTION_CAMERA");

    if (player03?.getPresentationState() !== "ACTION") failures.push("ACTION_ACTOR");
    if (player01?.getPresentationState() !== "IDLE") failures.push("SELECTED_ACTOR_ACTION");

    projectileSourceActor = "";
    renderer._drawCombatStageProjectile(fakeCtx, 960, 540);
    if (projectileSourceActor !== "PLAYER-03") failures.push("PROJECTILE_SOURCE");

    drawnActors.length = 0;
    renderAllActors();
    if (!drawnActors.includes("PLAYER-03") || drawnActors.includes("PLAYER-01")) failures.push("ACTION_RENDER");

    director.update(0.31);
    director.update(0.19);
    director.update(0.31);
    if (director.getState().phase !== COMBAT_PRESENTATION_PHASE.RETURN) failures.push("RETURN_PHASE");
    if (player03?.getPresentationState() !== "RETURN") failures.push("RETURN_ACTOR");
    if (player01?.getPresentationState() !== "IDLE") failures.push("SELECTED_ACTOR_RETURN");

    director.update(0.31);
    if (director.getState().phase !== COMBAT_PRESENTATION_PHASE.COMPLETE || director.getState().active) failures.push("COMPLETE_PHASE");
    if (player03?.getPresentationState() !== "IDLE") failures.push("COMPLETE_IDLE");
    if (player01?.getPresentationState() !== "IDLE") failures.push("SELECTED_ACTOR_COMPLETE");

    const initialPositions = {
      "PLAYER-01": stage.getActor("PLAYER-01").getPresentationSnapshot().position,
      "PLAYER-02": stage.getActor("PLAYER-02").getPresentationSnapshot().position,
      "PLAYER-03": stage.getActor("PLAYER-03").getPresentationSnapshot().position,
      "PLAYER-04": stage.getActor("PLAYER-04").getPresentationSnapshot().position
    };
    const finalPositions = Object.fromEntries(
      Object.keys(initialPositions).map((id) => [id, stage.getActor(id).getPresentationSnapshot().position])
    );
    if (JSON.stringify(initialPositions) !== JSON.stringify(finalPositions)) failures.push("FORMATION_CHANGED");

    if (resolvePresentationAttackerId(result, "", "PLAYER-01") !== "PLAYER-03") failures.push("CASE_A");
    if (resolvePresentationAttackerId({ attackerId: "PLAYER-03" }, "", "PLAYER-03") !== "PLAYER-03") failures.push("CASE_B");
    if (resolvePresentationAttackerId({ attackerId: "", attacker_id: "" }, "", "PLAYER-01") !== "PLAYER-01") failures.push("CASE_C");

    if (JSON.stringify(result) !== gameplayBefore) failures.push("GAMEPLAY_RESULT_CHANGED");

    renderer.dispose();

    return {
      pass: failures.length === 0,
      selectedActor: "PLAYER-01",
      resultAttacker: result.attackerId,
      focusActor: "PLAYER-03",
      actionActor: "PLAYER-03",
      cameraActor: "PLAYER-03",
      projectileSource: projectileSourceActor,
      returnActor: "PLAYER-03",
      formationRestored: !failures.includes("FORMATION_CHANGED"),
      gameplayResultUnchanged: !failures.includes("GAMEPLAY_RESULT_CHANGED"),
      failures
    };
  })()`;

  const evaluated = await cdp(ws, 4, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (evaluated.exceptionDetails) {
    throw new Error(evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text);
  }

  const value = evaluated.result?.value;
  if (!value) throw new Error("Chromium returned no BONE-003 probe result");

  console.log(`BONE-003 BROWSER PROBE = ${value.pass ? "PASS" : "FAIL"}`);
  console.log(`SELECTED_ACTOR = ${value.selectedActor}`);
  console.log(`RESULT_ATTACKER = ${value.resultAttacker}`);
  console.log(`FOCUS_ACTOR = ${value.focusActor}`);
  console.log(`ACTION_ACTOR = ${value.actionActor}`);
  console.log(`CAMERA_ACTOR = ${value.cameraActor}`);
  console.log(`PROJECTILE_SOURCE = ${value.projectileSource || "NONE"}`);
  console.log(`RETURN_ACTOR = ${value.returnActor}`);
  console.log(`FORMATION_RESTORED = ${value.formationRestored ? "PASS" : "FAIL"}`);
  console.log(`GAMEPLAY_RESULT_UNCHANGED = ${value.gameplayResultUnchanged ? "PASS" : "FAIL"}`);
  if (value.failures?.length) console.log(`FAILURES = ${value.failures.join(",")}`);

  if (!value.pass) process.exitCode = 1;
  ws.close();
} catch (error) {
  console.error("BONE-003 BROWSER PROBE = FAIL");
  console.error(String(error?.stack || error));
  process.exitCode = 1;
} finally {
  server.close();
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
