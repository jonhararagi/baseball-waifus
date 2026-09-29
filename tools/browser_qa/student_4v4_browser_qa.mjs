import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/student_4v4_demo.html";
const outputDir = process.env.ARTIFACT_DIR || path.resolve("qa_artifacts");
fs.mkdirSync(outputDir, { recursive: true });

const errors = { console: [], page: [], requests: [] };

async function phase(page, expected) {
  await page.waitForFunction(
    (value) => document.querySelector(".s4-phase")?.textContent?.trim() === value,
    expected
  );
}

async function noOverflow(page) {
  return page.evaluate(() => {
    const w = window.innerWidth;
    return {
      innerWidth: w,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    };
  });
}

async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("pageerror", (error) => errors.page.push(String(error?.stack || error)));
  page.on("requestfailed", (request) => {
    if (!request.url().endsWith("/favicon.ico")) {
      errors.requests.push({ url: request.url(), error: request.failure()?.errorText || "unknown" });
    }
  });

  const evidence = { flow: [], buffer: [], healer: [], debuffer: [], batter: [] };

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await phase(page, "INIT");
  assert.equal(await page.locator(".s4-shell").count(), 1);
  assert.equal(await page.getByRole("button", { name: /^START$/ }).count(), 1);
  evidence.flow.push("LOAD");

  await page.getByRole("button", { name: /^START$/ }).click();
  await phase(page, "BUFFER");
  evidence.flow.push("START");

  for (let i = 0; i < 6; i += 1) {
    await page.waitForTimeout(i === 0 ? 500 : 650);
    const lane = (await page.locator(".buffer-note").innerText()).trim().toUpperCase();
    assert.ok(["LIGHT", "MEDIUM", "HEAVY"].includes(lane));
    await page.locator(`.buffer-lane[data-buffer-lane="${lane}"]`).click();
    evidence.buffer.push(lane);
  }
  await phase(page, "HEALER");
  evidence.flow.push("BUFFER→HEALER");

  for (let i = 0; i < 6; i += 1) {
    await page.waitForTimeout(i === 0 ? 500 : 720);
    const zone = (await page.locator(".healer-zone.is-active").getAttribute("aria-label") || "").toUpperCase();
    assert.ok(["TOP", "LEFT", "RIGHT", "BOTTOM"].includes(zone));
    await page.locator(`.healer-zone-button[data-healer-zone="${zone}"]`).click();
    evidence.healer.push(zone);
  }
  await phase(page, "DEBUFFER");
  evidence.flow.push("HEALER→DEBUFFER");

  for (let i = 0; i < 6; i += 1) {
    await page.waitForTimeout(i === 0 ? 500 : 700);
    const target = page.locator(".debuffer-target");
    await target.waitFor({ state: "visible", timeout: 3000 });
    const box = await target.boundingBox();
    assert.ok(box);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.locator(".debuffer-selection").waitFor({ state: "visible", timeout: 2000 });
    await page.locator("[data-debuffer-capture]").click();
    evidence.debuffer.push(true);
  }
  await phase(page, "BATTER");
  evidence.flow.push("DEBUFFER→BATTER");

  for (let i = 0; i < 4; i += 1) {
    await page.waitForTimeout(i === 0 ? 500 : 900);
    const swing = page.locator("[data-batter-swing]");
    assert.equal(await swing.isEnabled(), true);
    await swing.click();
    evidence.batter.push(true);
  }
  await phase(page, "RESOLUTION");
  evidence.flow.push("BATTER→RESOLUTION");

  assert.equal(await page.locator(".s4-role.is-complete").count(), 4);
  const complete = await page.locator(".s4-complete").innerText();
  assert.ok(complete.includes("STUDENT 4V4 RESULT"));
  assert.ok(complete.includes("COMBAT RESULT"));
  const resolution = await page.locator(".s4-section").filter({ hasText: "RESOLUTION" }).innerText();
  for (const metric of ["SCORE", "ACCURACY", "ENERGY", "PROTECTION", "DISRUPTION", "IMPACT"]) assert.ok(resolution.includes(metric));
  evidence.flow.push("RESOLUTION→COMPLETE");

  assert.equal(await page.locator("#next").isDisabled(), true);
  assert.equal((await page.locator("#next").innerText()).trim(), "COMPLETE");

  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-complete.png"), fullPage: true });

  await page.locator("#restart").click();
  await phase(page, "INIT");
  evidence.flow.push("COMPLETE→RESET");

  await page.getByRole("button", { name: /^START$/ }).click();
  await phase(page, "BUFFER");
  assert.equal(await page.locator(".buffer-demo-card").count(), 1);
  evidence.flow.push("RESET→START→BUFFER");

  await page.screenshot({ path: path.join(outputDir, "student-4v4-desktop-reset.png"), fullPage: true });
  evidence.overflow = await noOverflow(page);

  await context.close();
  await browser.close();
  return evidence;
}

async function runMobile() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await phase(page, "INIT");
  const before = await noOverflow(page);
  await page.getByRole("button", { name: /^START$/ }).click();
  await phase(page, "BUFFER");
  const after = await noOverflow(page);

  for (const selector of ["#next", "#restart", ".s4-role", ".buffer-demo-card"]) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: 3000 });
    const box = await locator.boundingBox();
    assert.ok(box);
    assert.ok(box.x >= -1 && box.x + box.width <= 391);
  }

  await page.screenshot({ path: path.join(outputDir, "student-4v4-mobile-buffer.png"), fullPage: true });
  await context.close();
  await browser.close();
  return { overflowBefore: before, overflowAfter: after, consoleErrors, pageErrors };
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
    consoleErrors: [...errors.console],
    pageErrors: [...errors.page],
    requestFailures: [...errors.requests]
  };
  fs.writeFileSync(path.join(outputDir, "student-4v4-browser-qa.json"), JSON.stringify(report, null, 2));
  console.log("student_4v4_browser_qa: PASS_REAL");
} catch (error) {
  const report = {
    status: "FAIL_REAL",
    error: String(error?.stack || error),
    consoleErrors: [...errors.console],
    pageErrors: [...errors.page],
    requestFailures: [...errors.requests]
  };
  fs.writeFileSync(path.join(outputDir, "student-4v4-browser-qa-failure.json"), JSON.stringify(report, null, 2));
  console.error("student_4v4_browser_qa: FAIL_REAL");
  console.error(JSON.stringify(report));
  process.exitCode = 1;
}
