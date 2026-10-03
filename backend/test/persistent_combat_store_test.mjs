import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  PersistentCombatStore,
  PersistentCombatStoreError,
  PERSISTENCE_SCHEMA_VERSION
} from "../src/persistent_combat_store.mjs";

function tempPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "basewarriors-authority-"));
  return {
    directory,
    filePath: path.join(directory, "authority-state.json")
  };
}

function validState(store, matchId = "durable-match", playerId = "telegram:1001") {
  return store.createMatch({ matchId, playerId });
}

test("persistent store create/load and schema", () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-test-000001" });
  const created = validState(store);
  assert.equal(created.nonce, "nonce-test-000001");
  assert.equal(created.revision, 0);
  assert.equal(store.loadMatch(created.matchId).revision, 0);

  const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(document.schemaVersion, PERSISTENCE_SCHEMA_VERSION);
  assert.ok(document.matches[created.matchId]);
  assert.equal(document.matches[created.matchId].revision, 0);
  assert.deepEqual(document.rewardLedger, {});

  fs.rmSync(directory, { recursive: true, force: true });
});

test("restart recovery preserves match, revision, nonce, turn sequence and reward ledger", () => {
  const { filePath, directory } = tempPath();
  const storeA = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-restart-001" });
  const state = validState(storeA, "restart-match", "player-restart");
  state.turnId = "turn-007";
  state.turnNumber = 7;
  state.phase = "CLIMAX";
  state.bossHp = 37;
  state.completed = true;
  const saved = storeA.saveMatch(state, {
    rewardId: "battle:restart-match",
    expectedRevision: 0
  });
  assert.equal(saved.revision, 1);
  assert.equal(storeA.hasRewardAuthorized("battle:restart-match"), true);

  const storeB = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-other-ignored" });
  const restored = storeB.loadMatch("restart-match");
  assert.deepEqual(restored, saved);
  assert.equal(restored.revision, 1);
  assert.equal(restored.nonce, "nonce-restart-001");
  assert.equal(storeB.hasRewardAuthorized("battle:restart-match"), true);
  assert.equal(storeB.markRewardAuthorized("battle:restart-match"), false);

  fs.rmSync(directory, { recursive: true, force: true });
});

test("stale revision cannot overwrite and retry after reload succeeds", () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-stale-000001" });
  const created = validState(store, "stale-match", "player-stale");
  const writerA = store.loadMatch(created.matchId);
  const writerB = store.loadMatch(created.matchId);

  writerA.bossHp = 80;
  const savedA = store.saveMatch(writerA, { expectedRevision: writerA.revision });
  assert.equal(savedA.revision, 1);

  writerB.bossHp = 70;
  assert.throws(
    () => store.saveMatch(writerB, { expectedRevision: writerB.revision }),
    (error) => error?.code === "STALE_WRITE"
  );
  assert.equal(store.loadMatch(created.matchId).bossHp, 80);

  const latest = store.loadMatch(created.matchId);
  latest.bossHp = 70;
  const savedB = store.saveMatch(latest, { expectedRevision: latest.revision });
  assert.equal(savedB.revision, 2);
  assert.equal(store.loadMatch(created.matchId).bossHp, 70);

  fs.rmSync(directory, { recursive: true, force: true });
});

test("concurrent reward authorization stays exactly once at the ledger boundary", () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-ledger-000001" });
  validState(store, "ledger-match", "player-ledger");
  const results = Array.from({ length: 25 }, () => store.markRewardAuthorized("battle:ledger-match"));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(store.hasRewardAuthorized("battle:ledger-match"), true);

  const restarted = new PersistentCombatStore({ filePath });
  assert.equal(restarted.markRewardAuthorized("battle:ledger-match"), false);
  assert.equal(restarted.hasRewardAuthorized("battle:ledger-match"), true);

  fs.rmSync(directory, { recursive: true, force: true });
});

test("player binding and nonce persist with revision", () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-binding-000001" });
  const created = validState(store, "binding-match", "player-a");
  const writer = store.loadMatch("binding-match");
  writer.turnId = "turn-002";
  const saved = store.saveMatch(writer, { expectedRevision: 0 });
  const restoredStore = new PersistentCombatStore({ filePath });
  assert.equal(restoredStore.loadMatch("binding-match").playerId, "player-a");
  assert.equal(restoredStore.loadMatch("binding-match").nonce, "nonce-binding-000001");
  assert.equal(restoredStore.loadMatch("binding-match").revision, saved.revision);
  assert.notEqual(restoredStore.loadMatch("binding-match").playerId, "player-b");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("corrupt, empty and invalid-schema persistence fail closed", () => {
  const { filePath, directory } = tempPath();
  const cases = [
    "",
    "{not-json",
    JSON.stringify({ schemaVersion: 999, matches: {}, rewardLedger: {} }),
    JSON.stringify({ schemaVersion: 1, matches: {}, rewardLedger: { "battle:x": false } }),
    JSON.stringify({
      schemaVersion: 1,
      matches: {
        x: { matchId: "x", playerId: "p" }
      },
      rewardLedger: {}
    })
  ];

  for (const raw of cases) {
    fs.writeFileSync(filePath, raw);
    const store = new PersistentCombatStore({ filePath });
    assert.throws(() => store.loadMatch("x"), PersistentCombatStoreError);
  }

  fs.rmSync(directory, { recursive: true, force: true });
});

test("atomic writes leave valid JSON and no temp documents under controlled concurrency", async () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath });
  validState(store, "concurrent-match", "player-concurrent");

  await Promise.all(Array.from({ length: 30 }, async () => {
    const current = store.loadMatch("concurrent-match");
    current.round += 1;
    try {
      store.saveMatch(current, { expectedRevision: current.revision });
    } catch (error) {
      if (error?.code !== "STALE_WRITE") throw error;
    }
  }));

  const final = store.loadMatch("concurrent-match");
  assert.ok(final.round >= 2);
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(filePath, "utf8")));
  const leftovers = fs.readdirSync(directory).filter((name) => name.endsWith(".tmp"));
  assert.deepEqual(leftovers, []);

  fs.rmSync(directory, { recursive: true, force: true });
});
