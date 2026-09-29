
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/student_4v4_demo.html";
const outputDir = process.env.ARTIFACT_DIR || path.resolve("qa_artifacts");
fs.mkdirSync(outputDir, { recursive: true });

const errors = { console: [], page: [], requests: [] };

function readPhase(page) {
  return page.evaluate(function () {
    return document.querySelector(".s4-phase")?.textContent?.trim() || "";
  });
}

async function waitForPhase(page, expected, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await readPhase(page) === expected) {
      console.log("PHASE", expected);
      return;
    }
    await page.waitForTimeout(50);
  }
  throw new Error("PHASE_TIMEOUT:" + expected + ":actual=" + await readPhase(page));
}

async function clickSelector(page, selector, attempts = 80) {
  const locator = page.locator(selector).first();
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await locator.click({ force: true, timeout: 250 });
      return;
    } catch {
      await page.waitForTimeout(25);
    }
  }
  throw new Error("cannot click " + selector + ": timeout");
}

async function clickDynamicBuffer(page) {
  const lane = await page.evaluate(function () {
    return document.querySelector(".buffer-note")?.textContent?.trim().toUpperCase() || "";
  });
  assert.ok(["LIGHT", "MEDIUM", "HEAVY"].includes(lane), "invalid buffer lane: " + lane);
  await clickSelector(page, ".buffer-lane[data-buffer-lane='" + lane + "']");
  return lane;
}

async function driveUntilPhase(page, activePhase, nextPhase, evidence, action, intervalMs = 70, maxMs = 10000) {
  const started = Date.now();
  let actions = 0;
  while (await readPhase(page) === activePhase) {
    if (Date.now() - started > maxMs) {
      throw new Error(activePhase + "_TRANSITION_TIMEOUT");
    }
    actions += 1;
    const value = await action(actions);
    if (value !== undefined) evidence.push(value);
    await page.waitForTimeout(intervalMs);
  }
  await waitForPhase(page, nextPhase, 5000);
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
  try {
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
      errors.requests.push({ url: request.url(), error: request.failure()?.errorText || "unknown" });
    }
  });

  const evidence = { flow: [], buffer: [], healer: [], debuffer: [], batter: [] };

  console.log("LOAD", baseUrl);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
  await waitForPhase(page, "INIT");
  assert.equal(await page.locator(".s4-shell").count(), 1);
  evidence.flow.push("LOAD");

  await page.locator("#next").click();
  await waitForPhase(page, "BUFFER");
  evidence.flow.push("START");

  await driveUntilPhase(
    page,
    "BUFFER",
    "HEALER",
    evidence.buffer,
    async () => clickDynamicBuffer(page),
    70
  );
  evidence.flow.push("BUFFER->HEALER");

  await driveUntilPhase(
    page,
    "HEALER",
    "DEBUFFER",
    evidence.healer,
    async () => {
      const zone = await page.evaluate(function () {
        return document.querySelector(".healer-zone.is-active")?.getAttribute("aria-label") || "";
      });
      assert.ok(["TOP", "LEFT", "RIGHT", "BOTTOM"].includes(zone), "invalid healer zone: " + zone);
      await clickSelector(page, ".healer-zone-button[data-healer-zone='" + zone + "']");
      return zone;
    },
    75
  );
  evidence.flow.push("HEALER->DEBUFFER");

  await driveUntilPhase(
    page,
    "DEBUFFER",
    "BATTER",
    evidence.debuffer,
    async () => {
      const point = await page.evaluate(function () {
        const target = document.querySelector(".debuffer-target");
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, type: target.getAttribute("aria-label") };
      });
      assert.ok(point, "missing debuffer target");
      await page.mouse.click(point.x, point.y);
      await page.waitForTimeout(10);
      await clickSelector(page, "[data-debuffer-capture]");
      return point.type || "TARGET";
    },
    75
  );
  evidence.flow.push("DEBUFFER->BATTER");

  await driveUntilPhase(
    page,
    "BATTER",
    "RESOLUTION",
    evidence.batter,
    async () => {
      await clickSelector(page, "[data-batter-swing]");
      return "SWING";
    },
    75
  );
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
  evidence.flow.push("RESOLUTION->COMPLETE");

  const completeOverflow = await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-complete.png") });

  await page.locator("#restart").click();
  await waitForPhase(page, "INIT");
  evidence.flow.push("COMPLETE->RESET");

  await page.getByRole("button", { name: /^START$/ }).click();
  await waitForPhase(page, "BUFFER");
  assert.equal(await page.locator(".buffer-demo-card").count(), 1);
  evidence.flow.push("RESET->START->BUFFER");
  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-reset.png") });

  const resetOverflow = await assertNoHorizontalOverflow(page);
    await context.close();
    return { viewport: { width: 1366, height: 768 }, evidence, completeOverflow, resetOverflow };
  } finally {
    await browser.close();
  }
}

async function runMobile() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
  page.on("console", function (message) {
    if (message.type() === "error") errors.console.push("mobile: " + message.text());
  });
  page.on("pageerror", function (error) {
    errors.page.push("mobile: " + String(error?.stack || error));
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
  await waitForPhase(page, "INIT");
  const before = await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /^START$/ }).click();
  await waitForPhase(page, "BUFFER");
  const after = await assertNoHorizontalOverflow(page);

  for (const selector of ["#next", "#restart", ".s4-role", ".buffer-demo-card"]) {
    const element = page.locator(selector).first();
    const box = await element.boundingBox();
    assert.ok(box, "missing mobile element: " + selector);
    assert.ok(box.x >= -1 && box.x + box.width <= 391, "mobile element outside viewport: " + selector);
  }

  await page.screenshot({ path: path.join(outputDir, "student-4v4-mobile-buffer.png") });
    await context.close();
    return { viewport: { width: 390, height: 844 }, overflowBefore: before, overflowAfter: after };
  } finally {
    await browser.close();
  }
}

try {
  const desktop = await runDesktop();
  const mobile = await runMobile();

  assert.deepEqual(errors.console, []);
  assert.deepEqual(errors.page, []);
  assert.deepEqual(errors.requests, []);

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
