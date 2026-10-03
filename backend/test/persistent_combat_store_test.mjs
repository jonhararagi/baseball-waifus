import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
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
  const store = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-test-001" });
  const created = validState(store);
  assert.equal(created.nonce, "nonce-test-001");
  assert.equal(store.loadMatch(created.matchId).matchId, created.matchId);

  const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(document.schemaVersion, PERSISTENCE_SCHEMA_VERSION);
  assert.ok(document.matches[created.matchId]);
  assert.deepEqual(document.rewardLedger, {});

  fs.rmSync(directory, { recursive: true, force: true });
});

test("restart recovery preserves match, nonce, turn sequence and reward ledger", () => {
  const { filePath, directory } = tempPath();
  const storeA = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-restart-001" });
  const state = validState(storeA, "restart-match", "player-restart");
  state.turnId = "turn-007";
  state.turnNumber = 7;
  state.phase = "CLIMAX";
  state.bossHp = 37;
  state.completed = true;
  storeA.saveMatch(state, { rewardId: "battle:restart-match" });
  assert.equal(storeA.hasRewardAuthorized("battle:restart-match"), true);

  const storeB = new PersistentCombatStore({ filePath, nonceFactory: () => "nonce-other-ignored" });
  const restored = storeB.loadMatch("restart-match");
  assert.deepEqual(restored, state);
  assert.equal(restored.nonce, "nonce-restart-001");
  assert.equal(storeB.hasRewardAuthorized("battle:restart-match"), true);
  assert.equal(storeB.markRewardAuthorized("battle:restart-match"), false);

  fs.rmSync(directory, { recursive: true, force: true });
});

test("player binding remains intact after restart", () => {
  const { filePath, directory } = tempPath();
  const store = new PersistentCombatStore({ filePath });
  validState(store, "binding-match", "player-a");
  const restoredStore = new PersistentCombatStore({ filePath });
  assert.equal(restoredStore.loadMatch("binding-match").playerId, "player-a");
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
    store.saveMatch(current);
  }));

  const final = store.loadMatch("concurrent-match");
  assert.equal(final.round, 31);
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(filePath, "utf8")));
  const leftovers = fs.readdirSync(directory).filter((name) => name.endsWith(".tmp"));
  assert.deepEqual(leftovers, []);

  await Promise.all(Array.from({ length: 20 }, async (_, index) => {
    const id = `battle:concurrent-${index}`;
    store.markRewardAuthorized(id);
  }));
  const rewardDocument = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(Object.keys(rewardDocument.rewardLedger).length, 20);

  const duplicateResults = await Promise.all(
    Array.from({ length: 25 }, async () => store.markRewardAuthorized("battle:duplicate"))
  );
  assert.equal(duplicateResults.filter(Boolean).length, 1);
  assert.equal(store.hasRewardAuthorized("battle:duplicate"), true);

  fs.rmSync(directory, { recursive: true, force: true });
});
