#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

export const CLAIM_STATUS = Object.freeze({
  VERIFIED: "VERIFIED", INSPECTED: "INSPECTED", INFERRED: "INFERRED",
  UNKNOWN: "UNKNOWN", BLOCKED: "BLOCKED", NOT_RUN: "NOT_RUN"
});

export const VERIFY_STATUS = Object.freeze({
  PASS_REAL: "PASS_REAL", PASS_INSPECTION: "PASS_INSPECTION",
  NOT_RUN: "NOT_RUN", NOT_OBSERVED: "NOT_OBSERVED",
  BLOCKED: "BLOCKED", FAILURE: "FAILURE"
});

export const METRIC_TYPE = Object.freeze({
  REAL: "REAL", ESTIMATED: "ESTIMATED", UNKNOWN: "UNKNOWN"
});

export const MAX_AUTO_REPAIR_ATTEMPTS = 3;

const ROOT = process.cwd();
const AGENT_DIR = path.join(ROOT, ".agent");
const files = {
  task: path.join(AGENT_DIR, "task.json"),
  state: path.join(AGENT_DIR, "state.json"),
  evidence: path.join(AGENT_DIR, "evidence.json"),
  tests: path.join(AGENT_DIR, "tests.json"),
  blockers: path.join(AGENT_DIR, "blockers.json")
};

function ensureAgentDir() {
  fs.mkdirSync(AGENT_DIR, { recursive: true });
}

function readJson(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJson(file, value) {
  ensureAgentDir();
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, file);
}

function now() { return new Date().toISOString(); }

export function loadState() {
  return readJson(files.state, { task: "UNKNOWN", phase: "INIT", status: "IN_PROGRESS" });
}

export function updateState(patch = {}) {
  const state = { ...loadState(), ...patch, updated_at: now() };
  writeJson(files.state, state);
  return state;
}

export function recordEvidence(entry) {
  const data = readJson(files.evidence, { task: "UNKNOWN", evidence: [] });
  const evidence = {
    timestamp: now(),
    status: VERIFY_STATUS.NOT_OBSERVED,
    ...entry
  };
  data.evidence = [...(Array.isArray(data.evidence) ? data.evidence : []), evidence];
  writeJson(files.evidence, data);
  return evidence;
}

export function recordTest(entry) {
  const data = readJson(files.tests, { task: "UNKNOWN", tests: [] });
  data.tests = [...(Array.isArray(data.tests) ? data.tests : []), { timestamp: now(), ...entry }];
  writeJson(files.tests, data);
  return data.tests.at(-1);
}

export function verifyFile(filePath) {
  const absolute = path.resolve(ROOT, filePath);
  const exists = fs.existsSync(absolute) && fs.statSync(absolute).isFile();
  const result = {
    type: "file_exists",
    source: "filesystem",
    target: filePath,
    status: exists ? CLAIM_STATUS.VERIFIED : CLAIM_STATUS.UNKNOWN,
    result: exists ? "file exists" : "file does not exist",
    timestamp: now()
  };
  recordEvidence({ ...result, status: exists ? VERIFY_STATUS.PASS_REAL : VERIFY_STATUS.FAILURE });
  return result;
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function gitSnapshot() {
  const snapshot = {
    branch: "UNKNOWN",
    head: "UNKNOWN",
    status: [],
    diffStat: "",
    timestamp: now()
  };
  try {
    snapshot.branch = git(["branch", "--show-current"]) || "DETACHED";
    snapshot.head = git(["rev-parse", "HEAD"]);
    snapshot.status = git(["status", "--short"]).split("\n").filter(Boolean);
    snapshot.diffStat = git(["diff", "--stat"]);
    recordEvidence({
      type: "git_snapshot", source: "git",
      command: "git status --short; git diff --stat; git rev-parse HEAD",
      result: snapshot, status: VERIFY_STATUS.PASS_REAL
    });
  } catch (error) {
    snapshot.error = error.message;
    recordEvidence({
      type: "git_snapshot", source: "git",
      command: "git status --short; git diff --stat; git rev-parse HEAD",
      result: error.message, status: VERIFY_STATUS.BLOCKED
    });
  }
  return snapshot;
}

export function verifyCommit(commit) {
  let exists = false;
  try {
    execFileSync("git", ["cat-file", "-e", commit + "^{commit}"], { cwd: ROOT, stdio: "ignore" });
    exists = true;
  } catch {}
  const result = {
    type: "git_commit",
    source: "git",
    target: commit,
    status: exists ? CLAIM_STATUS.VERIFIED : CLAIM_STATUS.UNKNOWN,
    result: exists ? "commit exists" : "commit not found",
    timestamp: now()
  };
  recordEvidence({ ...result, status: exists ? VERIFY_STATUS.PASS_REAL : VERIFY_STATUS.FAILURE });
  return result;
}

export function detectUnexpectedFiles(changedFiles = [], allowedPaths = []) {\n  return changedFiles.filter(file => !allowedPaths.some(prefix => file === prefix || file.startsWith(prefix.endsWith("/") ? prefix : prefix + "/")));\n}\n\nexport function verifyScope(baseCommit, allowedPaths = []) {
  let changed = [];
  try {
    const range = baseCommit ? [baseCommit + "...HEAD", "--name-only"] : ["--name-only"];
    changed = git(["diff", ...range]).split("\n").filter(Boolean);
  } catch {
    changed = [];
  }
  const unexpected = detectUnexpectedFiles(changed, allowedPaths);
  const result = {
    type: "scope_check",
    source: "git",
    command: baseCommit ? "git diff " + baseCommit + "...HEAD --name-only" : "git diff --name-only",
    changed_files: changed,
    unexpected_files: unexpected,
    status: unexpected.length ? "OUT_OF_SCOPE_CHANGE" : VERIFY_STATUS.PASS_REAL,
    timestamp: now()
  };
  recordEvidence(result);
  return result;
}

export function runTest(name, command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: options.timeoutMs ?? 120000,
    env: { ...process.env, ...(options.env || {}) }
  });
  const finished = Date.now();
  const status = result.error ? VERIFY_STATUS.NOT_RUN : (result.status === 0 ? VERIFY_STATUS.PASS_REAL : VERIFY_STATUS.FAILURE);
  const test = {
    name, command: [command, ...args].join(" "),
    started_at: new Date(started).toISOString(),
    finished_at: new Date(finished).toISOString(),
    duration_ms: finished - started,
    exit_code: result.status,
    status,
    stdout_summary: String(result.stdout || "").slice(-2000),
    stderr_summary: String(result.stderr || "").slice(-2000),
    reason: result.error?.message || undefined
  };
  recordTest(test);
  recordEvidence({
    type: "test", source: "process", command: test.command,
    exit_code: test.exit_code, result: test.stdout_summary,
    status
  });
  return test;
}

export function markNotRun(name, reason) {
  return recordTest({
    name, command: "", exit_code: null, status: VERIFY_STATUS.NOT_RUN,
    reason, stdout_summary: "", stderr_summary: ""
  });
}

export function repairAttempt(current = 0) {
  const next = Number(current) + 1;
  return {
    attempt: next,
    max_attempts: MAX_AUTO_REPAIR_ATTEMPTS,
    allowed: next <= MAX_AUTO_REPAIR_ATTEMPTS,
    status: next <= MAX_AUTO_REPAIR_ATTEMPTS ? "CONTINUE_REPAIR" : VERIFY_STATUS.BLOCKED
  };
}

export function classifyMetric(input = {}) {
  if (Number.isFinite(input.prompt_tokens) || Number.isFinite(input.completion_tokens) || Number.isFinite(input.total_tokens)) {
    return { ...input, measurement_type: METRIC_TYPE.REAL };
  }
  if (Number.isFinite(input.context_estimate) || Number.isFinite(input.estimated_tokens)) {
    return { ...input, measurement_type: METRIC_TYPE.ESTIMATED };
  }
  return { ...input, measurement_type: METRIC_TYPE.UNKNOWN };
}

export function claim(status, evidence = null) {
  if (!Object.values(CLAIM_STATUS).includes(status)) throw new Error("Invalid claim status");
  return { status, evidence };
}

function main(argv) {
  const [command, ...rest] = argv;
  if (command === "snapshot") return console.log(JSON.stringify(gitSnapshot(), null, 2));
  if (command === "file") return console.log(JSON.stringify(verifyFile(rest[0]), null, 2));
  if (command === "commit") return console.log(JSON.stringify(verifyCommit(rest[0]), null, 2));
  if (command === "scope") {
    const base = rest[0] || "";
    const task = readJson(files.task, {});
    return console.log(JSON.stringify(verifyScope(base, task.scope || []), null, 2));
  }
  if (command === "test") {
    const name = rest.shift();
    const executable = rest.shift();
    return console.log(JSON.stringify(runTest(name, executable, rest), null, 2));
  }
  if (command === "repair") return console.log(JSON.stringify(repairAttempt(Number(rest[0] || 0)), null, 2));
  if (command === "metric") {
    const payload = JSON.parse(rest[0] || "{}");
    return console.log(JSON.stringify(classifyMetric(payload), null, 2));
  }
  console.error("Usage: agent_guard.mjs <snapshot|file|commit|scope|test|repair|metric>");
  process.exitCode = 2;
}

if (import.meta.url === new URL(process.argv[1], "file:").href) main(process.argv.slice(2));
