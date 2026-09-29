
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/student_4v4_demo.html";
const outputDir = process.env.ARTIFACT_DIR || path.resolve("qa_artifacts");
fs.mkdirSync(outputDir, { recursive: true });

const errors = { console: [], page: [], requests: [] };

async function assertPhase(page, expected) {
  await page.waitForFunction(
    function (value) {
      return document.querySelector(".s4-phase")?.textContent?.trim() === value;
    },
    expected,
    { timeout: 5000 }
  );
  console.log("PHASE", expected);
}

async function currentPhase(page) {
  return (await page.locator(".s4-phase").innerText({ timeout: 3000 })).trim();
}

async function clickVisible(page, locator) {
  await locator.waitFor({ state: "visible", timeout: 3000 });
  const box = await locator.boundingBox();
  assert.ok(box, "interactive element has no visible bounding box");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function assertNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(function () {
    return {
      innerWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    };
  });
  assert.ok(metrics.documentWidth <= metrics.innerWidth + 2, "document overflow: " + JSON.stringify(metrics));
  assert.ok(metrics.bodyWidth <= metrics.innerWidth + 2, "body overflow: " + JSON.stringify(metrics));
  return metrics;
}

async function driveBuffer(page, evidence) {
  const started = Date.now();
  let actions = 0;
  while ((await currentPhase(page)) === "BUFFER") {
    if (Date.now() - started > 9000) throw new Error("BUFFER transition timeout");
    const lane = (await page.locator(".buffer-note").innerText({ timeout: 2000 })).trim().toUpperCase();
    assert.ok(["LIGHT", "MEDIUM", "HEAVY"].includes(lane), "invalid buffer lane: " + lane);
    actions += 1;
    await clickVisible(page, page.locator(".buffer-lane[data-buffer-lane='" + lane + "']"));
    evidence.push({ lane, action: actions });
    await page.waitForTimeout(60);
  }
  console.log("BUFFER COMPLETE", evidence.length);
}

async function driveHealer(page, evidence) {
  const started = Date.now();
  let actions = 0;
  while ((await currentPhase(page)) === "HEALER") {
    if (Date.now() - started > 9000) throw new Error("HEALER transition timeout");
    const zone = (await page.locator(".healer-zone.is-active").getAttribute("aria-label", { timeout: 2000 }) || "").toUpperCase();
    assert.ok(["TOP", "LEFT", "RIGHT", "BOTTOM"].includes(zone), "invalid healer zone: " + zone);
    actions += 1;
    await clickVisible(page, page.locator(".healer-zone-button[data-healer-zone='" + zone + "']"));
    evidence.push({ zone, action: actions });
    await page.waitForTimeout(60);
  }
  console.log("HEALER COMPLETE", evidence.length);
}

async function driveDebuffer(page, evidence) {
  const started = Date.now();
  let actions = 0;
  while ((await currentPhase(page)) === "DEBUFFER") {
    if (Date.now() - started > 9000) throw new Error("DEBUFFER transition timeout");
    const target = page.locator(".debuffer-target");
    await target.waitFor({ state: "visible", timeout: 2000 });
    const box = await target.boundingBox();
    assert.ok(box, "debuffer target has no visible bounding box");
    actions += 1;
    evidence.push({ target: await target.getAttribute("aria-label"), action: actions });
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.locator(".debuffer-selection").waitFor({ state: "visible", timeout: 1500 });
    await clickVisible(page, page.locator("[data-debuffer-capture]"));
    await page.waitForTimeout(60);
  }
  console.log("DEBUFFER COMPLETE", evidence.length);
}

async function driveBatter(page, evidence) {
  const started = Date.now();
  let actions = 0;
  while ((await currentPhase(page)) === "BATTER") {
    if (Date.now() - started > 9000) throw new Error("BATTER transition timeout");
    actions += 1;
    await clickVisible(page, page.locator("[data-batter-swing]"));
    evidence.push({ swing: true, action: actions });
    await page.waitForTimeout(60);
  }
  console.log("BATTER COMPLETE", evidence.length);
}

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.setDefaultTimeout(3000);

  page.on("console", function (message) {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("pageerror", function (error) {
    errors.page.push(String(error?.stack || error));
  });
  page.on("requestfailed", function (request) {
    if (!request.url().endsWith("/favicon.ico")) {
      errors.requests.push({ url: request.url(), error: request.failure()?.errorText || "unknown" });
    }
  });

  const evidence = { flow: [], buffer: [], healer: [], debuffer: [], batter: [] };

  console.log("LOAD", baseUrl);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
  await assertPhase(page, "INIT");
  await page.locator(".s4-shell").waitFor({ state: "visible", timeout: 3000 });
  evidence.flow.push("LOAD");

  await page.getByRole("button", { name: /^START$/ }).click();
  await assertPhase(page, "BUFFER");
  evidence.flow.push("START");

  await driveBuffer(page, evidence.buffer);
  await assertPhase(page, "HEALER");
  evidence.flow.push("BUFFER->HEALER");

  await driveHealer(page, evidence.healer);
  await assertPhase(page, "DEBUFFER");
  evidence.flow.push("HEALER->DEBUFFER");

  await driveDebuffer(page, evidence.debuffer);
  await assertPhase(page, "BATTER");
  evidence.flow.push("DEBUFFER->BATTER");

  await driveBatter(page, evidence.batter);
  await assertPhase(page, "RESOLUTION");
  evidence.flow.push("BATTER->RESOLUTION");

  assert.equal(await page.locator(".s4-role.is-complete").count(), 4);
  const completeText = await page.locator(".s4-complete").innerText();
  assert.ok(completeText.includes("STUDENT 4V4 RESULT"));
  assert.ok(completeText.includes("COMBAT RESULT"));
  const resolutionText = await page.locator(".s4-section").filter({ hasText: "RESOLUTION" }).innerText();
  for (const metric of ["SCORE", "ACCURACY", "ENERGY", "PROTECTION", "DISRUPTION", "IMPACT"]) {
    assert.ok(resolutionText.includes(metric));
  }
  assert.equal(await page.locator("#next").isDisabled(), true);
  assert.equal((await page.locator("#next").innerText()).trim(), "COMPLETE");

  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-complete.png") });
  evidence.flow.push("RESOLUTION->COMPLETE");

  await page.locator("#restart").click();
  await assertPhase(page, "INIT");
  evidence.flow.push("COMPLETE->RESET");

  await page.getByRole("button", { name: /^START$/ }).click();
  await assertPhase(page, "BUFFER");
  assert.equal(await page.locator(".buffer-demo-card").count(), 1);
  evidence.flow.push("RESET->START->BUFFER");
  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-reset.png") });

  const overflow = await assertNoHorizontalOverflow(page);
  await context.close();
  await browser.close();
  return { viewport: { width: 1366, height: 768 }, evidence, overflow };
}

async function runMobile() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const mobileConsole = [];
  const mobilePage = [];
  page.on("console", function (message) { if (message.type() === "error") mobileConsole.push(message.text()); });
  page.on("pageerror", function (error) { mobilePage.push(String(error?.stack || error)); });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
  await assertPhase(page, "INIT");
  const before = await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /^START$/ }).click();
  await assertPhase(page, "BUFFER");
  const after = await assertNoHorizontalOverflow(page);

  for (const selector of ["#next", "#restart", ".s4-role", ".buffer-demo-card"]) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: 3000 });
    const box = await locator.boundingBox();
    assert.ok(box, "missing mobile element: " + selector);
    assert.ok(box.x >= -1 && box.x + box.width <= 391, "mobile element outside viewport: " + selector);
  }
  await page.screenshot({ path: path.join(outputDir, "student-4v4-mobile-buffer.png") });
  await context.close();
  await browser.close();
  return { viewport: { width: 390, height: 844 }, overflowBefore: before, overflowAfter: after, consoleErrors: mobileConsole, pageErrors: mobilePage };
}

const watchdog = setTimeout(function () {
  throw new Error("BROWSER_QA_GLOBAL_TIMEOUT");
}, 120000);

try {
  const desktop = await runDesktop();
  const mobile = await runMobile();
  clearTimeout(watchdog);

  const allConsole = [...errors.console, ...mobile.consoleErrors];
  const allPage = [...errors.page, ...mobile.pageErrors];
  assert.deepEqual(allConsole, []);
  assert.deepEqual(allPage, []);
  assert.deepEqual(errors.requests, []);

  const report = {
    status: "PASS_REAL",
    browser: "Chromium via Playwright",
    desktop,
    mobile,
    consoleErrors: allConsole,
    pageErrors: allPage,
    requestFailures: errors.requests
  };
  fs.writeFileSync(path.join(outputDir, "student-4v4-browser-qa.json"), JSON.stringify(report, null, 2));
  console.log("student_4v4_browser_qa: PASS_REAL");
} catch (error) {
  clearTimeout(watchdog);
  const report = {
    status: "FAIL_REAL",
    error: String(error?.stack || error),
    consoleErrors: errors.console,
    pageErrors: errors.page,
    requestFailures: errors.requests
  };
  fs.writeFileSync(path.join(outputDir, "student-4v4-browser-qa-failure.json"), JSON.stringify(report, null, 2));
  console.error("student_4v4_browser_qa: FAIL_REAL");
  console.error(JSON.stringify(report));
  process.exitCode = 1;
}
