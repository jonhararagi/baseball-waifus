import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MANAGED_PERSISTENCE_SCHEMA_VERSION,
  validateManagedDsn,
  withPostgresTransaction
} from "../src/postgres_persistence.mjs";
import { ManagedCombatStore } from "../src/managed_combat_store.mjs";
import { ManagedPurchaseStore } from "../src/managed_purchase_store.mjs";

class FakeClient {
  constructor(pool) { this.pool = pool; }
  async query(sql, params) { return this.pool.query(sql, params); }
  release() { this.pool.released = true; }
}

class FakePool {
  constructor() { this.calls = []; this.released = false; }
  async query(sql, params = []) {
    const textSql = String(sql);
    this.calls.push({ sql: textSql, params });
    if (textSql.trim() === "SELECT 1") return { rowCount: 1, rows: [{ one: 1 }] };
    if (textSql.includes("SELECT schema_version FROM bw_authority_schema")) {
      return { rowCount: 1, rows: [{ schema_version: MANAGED_PERSISTENCE_SCHEMA_VERSION }] };
    }
    if (textSql.includes("SELECT schema_version FROM bw_purchase_state")) {
      return { rowCount: 1, rows: [{ schema_version: MANAGED_PERSISTENCE_SCHEMA_VERSION }] };
    }
    return { rowCount: 0, rows: [] };
  }
  async connect() { return new FakeClient(this); }
  async end() {}
}

test("managed DSN accepts PostgreSQL URLs only", () => {
  assert.equal(validateManagedDsn("postgres://db.example/basewarriors").startsWith("postgres://"), true);
  assert.equal(validateManagedDsn("postgresql://db.example/basewarriors").startsWith("postgresql://"), true);
  assert.throws(() => validateManagedDsn("redis://db.example/basewarriors"), /postgres/);
  assert.throws(() => validateManagedDsn("not-a-dsn"), /Invalid managed persistence DSN/);
});

test("managed combat store becomes operational only after database initialization", async () => {
  const pool = new FakePool();
  const store = new ManagedCombatStore({ dsn: "postgres://db.example/basewarriors", pool });
  assert.equal(store.isDurable, true);
  assert.equal(store.isOperational, false);
  await store.initialize();
  assert.equal(store.isOperational, true);
  assert.ok(pool.calls.some((call) => call.sql.includes("bw_combat_matches")));
  await store.close();
});

test("managed purchase store becomes operational only after database initialization", async () => {
  const pool = new FakePool();
  const store = new ManagedPurchaseStore({ dsn: "postgres://db.example/basewarriors", pool });
  assert.equal(store.isDurable, true);
  assert.equal(store.isOperational, false);
  await store.initialize();
  assert.equal(store.isOperational, true);
  assert.ok(pool.calls.some((call) => call.sql.includes("bw_purchase_state")));
  await store.close();
});

test("transaction helper commits and releases the client", async () => {
  const pool = new FakePool();
  const result = await withPostgresTransaction(pool, async (client) => {
    await client.query("SELECT 1");
    return "ok";
  });
  assert.equal(result, "ok");
  assert.equal(pool.released, true);
  assert.ok(pool.calls.some((call) => call.sql === "BEGIN"));
  assert.ok(pool.calls.some((call) => call.sql === "COMMIT"));
});

test("transaction helper rolls back on failure", async () => {
  const pool = new FakePool();
  await assert.rejects(
    () => withPostgresTransaction(pool, async () => { throw new Error("expected"); }),
    /expected/
  );
  assert.ok(pool.calls.some((call) => call.sql === "ROLLBACK"));
});

test("live managed persistence remains optional in normal CI", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const combat = new ManagedCombatStore({ dsn: process.env.TEST_DATABASE_URL });
  const purchase = new ManagedPurchaseStore({ dsn: process.env.TEST_DATABASE_URL });
  try {
    await combat.initialize();
    await purchase.initialize();
    const matchId = "live-test-" + Date.now();
    const created = await combat.createMatch({ matchId, playerId: "player-live-test" });
    const saved = await combat.saveMatch({ ...created, bossHp: 90 }, { expectedRevision: created.revision });
    assert.equal((await combat.loadMatch(matchId)).bossHp, 90);
    assert.equal(saved.revision, 1);
    assert.equal(await combat.markRewardAuthorized("battle:" + matchId), true);
    assert.equal(await combat.markRewardAuthorized("battle:" + matchId), false);
    assert.equal(await combat.hasRewardAuthorized("battle:" + matchId), true);
  } finally {
    await combat.close();
    await purchase.close();
  }
});
