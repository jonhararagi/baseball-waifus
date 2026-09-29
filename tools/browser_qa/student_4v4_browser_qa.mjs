
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
    { timeout: 8000 }
  );
}

async function clickVisible(page, locator) {
  await locator.waitFor({ state: "visible", timeout: 3000 });
  const box = await locator.boundingBox();
  assert.ok(box, "interactive element has no visible bounding box");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function waitForRoleTick(page, anchor, index, spacingMs) {
  const target = anchor + 500 + index * spacingMs;
  await page.waitForFunction(
    function (value) {
      return performance.now() >= value;
    },
    target,
    { timeout: 5000 }
  );
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

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  page.on("console", function (message) {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("pageerror", function (error) {
    errors.page.push(String(error?.stack || error));
  });
  page.on("requestfailed", function (request) {
    if (!request.url().endsWith("/favicon.ico")) {
      errors.requests.push({
        url: request.url(),
        error: request.failure()?.errorText || "unknown"
      });
    }
  });

  const evidence = { flow: [], buffer: [], healer: [], debuffer: [], batter: [] };

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await assertPhase(page, "INIT");
  await page.locator(".s4-shell").waitFor({ state: "visible" });
  assert.equal(await page.getByRole("button", { name: /^START$/ }).count(), 1);
  evidence.flow.push("LOAD");

  await page.getByRole("button", { name: /^START$/ }).click();
  await assertPhase(page, "BUFFER");
  evidence.flow.push("START");
  const bufferAnchor = await page.evaluate(function () { return performance.now(); });

  for (let i = 0; i < 6; i += 1) {
    await waitForRoleTick(page, bufferAnchor, i, 650);
    const lane = (await page.locator(".buffer-note").innerText()).trim().toUpperCase();
    assert.ok(["LIGHT", "MEDIUM", "HEAVY"].includes(lane), "invalid buffer lane: " + lane);
    evidence.buffer.push(lane);
    await clickVisible(page, page.locator(".buffer-lane[data-buffer-lane='" + lane + "']"));
  }

  await assertPhase(page, "HEALER");
  evidence.flow.push("BUFFER->HEALER");
  const healerAnchor = await page.evaluate(function () { return performance.now(); });

  for (let i = 0; i < 6; i += 1) {
    await waitForRoleTick(page, healerAnchor, i, 720);
    const zone = (await page.locator(".healer-zone.is-active").getAttribute("aria-label") || "").toUpperCase();
    assert.ok(["TOP", "LEFT", "RIGHT", "BOTTOM"].includes(zone), "invalid healer zone: " + zone);
    evidence.healer.push(zone);
    await clickVisible(page, page.locator(".healer-zone-button[data-healer-zone='" + zone + "']"));
  }

  await assertPhase(page, "DEBUFFER");
  evidence.flow.push("HEALER->DEBUFFER");
  const debufferAnchor = await page.evaluate(function () { return performance.now(); });

  for (let i = 0; i < 6; i += 1) {
    await waitForRoleTick(page, debufferAnchor, i, 700);
    const target = page.locator(".debuffer-target");
    await target.waitFor({ state: "visible", timeout: 3000 });
    const box = await target.boundingBox();
    assert.ok(box, "debuffer target has no visible bounding box");
    evidence.debuffer.push(await target.getAttribute("aria-label"));
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.locator(".debuffer-selection").waitFor({ state: "visible", timeout: 2000 });
    await clickVisible(page, page.locator("[data-debuffer-capture]"));
  }

  await assertPhase(page, "BATTER");
  evidence.flow.push("DEBUFFER->BATTER");
  const batterAnchor = await page.evaluate(function () { return performance.now(); });

  for (let i = 0; i < 4; i += 1) {
    await waitForRoleTick(page, batterAnchor, i, 900);
    evidence.batter.push(true);
    await clickVisible(page, page.locator("[data-batter-swing]"));
  }

  await assertPhase(page, "RESOLUTION");
  evidence.flow.push("BATTER->RESOLUTION");

  assert.equal(await page.locator(".s4-role.is-complete").count(), 4);
  const completeText = await page.locator(".s4-complete").innerText();
  assert.ok(completeText.includes("STUDENT 4V4 RESULT"));
  assert.ok(completeText.includes("COMBAT RESULT"));

  const resolutionText = await page.locator(".s4-section").filter({ hasText: "RESOLUTION" }).innerText();
  for (const metric of ["SCORE", "ACCURACY", "ENERGY", "PROTECTION", "DISRUPTION", "IMPACT"]) {
    assert.ok(resolutionText.includes(metric), "missing resolution metric: " + metric);
  }

  const completeNext = page.locator("#next");
  assert.equal(await completeNext.isDisabled(), true);
  assert.equal((await completeNext.innerText()).trim(), "COMPLETE");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-complete.png"), fullPage: true });

  evidence.flow.push("RESOLUTION->COMPLETE");
  await page.locator("#restart").click();
  await assertPhase(page, "INIT");
  evidence.flow.push("COMPLETE->RESET");

  await page.getByRole("button", { name: /^START$/ }).click();
  await assertPhase(page, "BUFFER");
  evidence.flow.push("RESET->START->BUFFER");
  assert.equal(await page.locator(".buffer-demo-card").count(), 1);
  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-reset.png"), fullPage: true });

  const overflow = await assertNoHorizontalOverflow(page);
  await context.close();
  await browser.close();
  return { viewport: { width: 1366, height: 768 }, flow: evidence, overflow };
}

async function runMobile() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const mobileConsole = [];
  const mobilePage = [];

  page.on("console", function (message) {
    if (message.type() === "error") mobileConsole.push(message.text());
  });
  page.on("pageerror", function (error) {
    mobilePage.push(String(error?.stack || error));
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
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

  await page.screenshot({ path: path.join(outputDir, "student-4v4-mobile-buffer.png"), fullPage: true });
  await context.close();
  await browser.close();
  return { viewport: { width: 390, height: 844 }, overflowBefore: before, overflowAfter: after, consoleErrors: mobileConsole, pageErrors: mobilePage };
}

try {
  const desktop = await runDesktop();
  const mobile = await runMobile();

  assert.deepEqual(errors.console, []);
  assert.deepEqual(errors.page, []);
  assert.deepEqual(errors.requests, []);
  assert.deepEqual(mobile.consoleErrors, []);
  assert.deepEqual(mobile.pageErrors, []);

  const report = {
    status: "PASS_REAL",
    browser: "Chromium via Playwright",
    desktop,
    mobile,
    consoleErrors: errors.console,
    pageErrors: errors.page,
    requestFailures: errors.requests
  };

  fs.writeFileSync(path.join(outputDir, "student-4v4-browser-qa.json"), JSON.stringify(report, null, 2));
  console.log("student_4v4_browser_qa: PASS_REAL");
} catch (error) {
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
