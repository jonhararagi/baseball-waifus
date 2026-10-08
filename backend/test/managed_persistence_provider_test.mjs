import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
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

const liveTestOptions = { skip: !process.env.TEST_DATABASE_URL };

function liveDsn() {
  return process.env.TEST_DATABASE_URL;
}

function livePurchaseRecord(id, playerId) {
  return {
    purchaseId: id,
    playerId,
    productId: "scrap_5000",
    amount: 50,
    currency: "XTR",
    provider: "test-provider",
    providerTransactionId: "pending:" + id,
    receiptFingerprint: createHash("sha256").update("receipt:" + id).digest("hex"),
    grantKind: "scrap",
    grantAmount: 5000,
    claimStatus: "UNCLAIMED"
  };
}

test("REAL PostgreSQL schema initializes from an empty database", liveTestOptions, async () => {
  const combat = new ManagedCombatStore({ dsn: liveDsn() });
  const purchase = new ManagedPurchaseStore({ dsn: liveDsn() });
  try {
    await combat.initialize();
    await purchase.initialize();
    const tables = await combat.pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'bw_authority_schema',
          'bw_combat_matches',
          'bw_reward_ledger',
          'bw_purchase_state'
        )
      ORDER BY table_name
    `);
    assert.deepEqual(tables.rows.map((row) => row.table_name), [
      "bw_authority_schema",
      "bw_combat_matches",
      "bw_purchase_state",
      "bw_reward_ledger"
    ]);
  } finally {
    await combat.close();
    await purchase.close();
  }
});

test("REAL PostgreSQL combat durability survives close and reopen", liveTestOptions, async () => {
  const matchId = "live-combat-" + randomUUID().slice(0, 8);
  const playerId = "player-live-combat";
  const first = new ManagedCombatStore({ dsn: liveDsn() });
  try {
    await first.initialize();
    const created = await first.createMatch({ matchId, playerId });
    const saved = await first.saveMatch({ ...created, bossHp: 90 }, { expectedRevision: created.revision });
    assert.equal(saved.revision, 1);
  } finally {
    await first.close();
  }

  const second = new ManagedCombatStore({ dsn: liveDsn() });
  try {
    await second.initialize();
    const restored = await second.loadMatch(matchId);
    assert.equal(restored.playerId, playerId);
    assert.equal(restored.bossHp, 90);
    assert.equal(restored.revision, 1);
    assert.match(restored.nonce, /^[0-9a-f-]{36}$/);
  } finally {
    await second.close();
  }
});

test("REAL PostgreSQL combat revision rejects stale writer and reward ledger is exactly once", liveTestOptions, async () => {
  const matchId = "live-concurrency-" + randomUUID().slice(0, 8);
  const writerA = new ManagedCombatStore({ dsn: liveDsn() });
  const writerB = new ManagedCombatStore({ dsn: liveDsn() });
  try {
    await Promise.all([writerA.initialize(), writerB.initialize()]);
    const created = await writerA.createMatch({ matchId, playerId: "player-concurrency" });
    const snapshotA = await writerA.loadMatch(matchId);
    const snapshotB = await writerB.loadMatch(matchId);

    const savedA = await writerA.saveMatch(
      { ...snapshotA, bossHp: 80 },
      { expectedRevision: snapshotA.revision }
    );
    assert.equal(savedA.revision, 1);

    await assert.rejects(
      () => writerB.saveMatch(
        { ...snapshotB, bossHp: 70 },
        { expectedRevision: snapshotB.revision }
      ),
      (error) => error?.code === "STALE_WRITE"
    );
    assert.equal((await writerB.loadMatch(matchId)).bossHp, 80);

    const rewardId = "battle:" + matchId;
    const outcomes = await Promise.all(
      Array.from({ length: 8 }, () => writerA.markRewardAuthorized(rewardId))
    );
    assert.equal(outcomes.filter(Boolean).length, 1);
    assert.equal(await writerB.markRewardAuthorized(rewardId), false);
    assert.equal(await writerB.hasRewardAuthorized(rewardId), true);
    assert.equal((await writerB.loadMatch(matchId)).revision, 1);
    assert.equal(created.revision, 0);
  } finally {
    await Promise.all([writerA.close(), writerB.close()]);
  }
});

test("REAL PostgreSQL purchase durability, idempotency and concurrency survive store restart", liveTestOptions, async () => {
  const purchaseId = "live-purchase-" + randomUUID().slice(0, 8);
  const playerId = "telegram:live-purchase";
  const record = livePurchaseRecord(purchaseId, playerId);

  const storeA = new ManagedPurchaseStore({ dsn: liveDsn() });
  const storeB = new ManagedPurchaseStore({ dsn: liveDsn() });
  try {
    await Promise.all([storeA.initialize(), storeB.initialize()]);

    const creates = await Promise.all([
      storeA.createPendingPurchase(record),
      storeB.createPendingPurchase(record)
    ]);
    assert.equal(creates.filter((result) => result.created).length, 1);

    const pending = await storeA.loadPurchase(purchaseId);
    assert.equal(pending.authorizationStatus, "PENDING");

    const invoice = await storeA.setInvoiceForPurchase(
      purchaseId,
      "https://example.invalid/invoice/" + purchaseId,
      "invoice-payload"
    );
    assert.equal(invoice.status, "UPDATED");

    const authorizedRecord = {
      ...record,
      providerTransactionId: "provider-tx-" + purchaseId,
      receiptFingerprint: createHash("sha256").update("receipt-authorized:" + purchaseId).digest("hex")
    };
    const authorizations = await Promise.all([
      storeA.authorizePendingPurchase(authorizedRecord),
      storeB.authorizePendingPurchase(authorizedRecord)
    ]);
    assert.equal(
      authorizations.filter((result) => result.status === "AUTHORIZED_GRANT").length,
      1
    );
    assert.equal(
      authorizations.some((result) => result.status === "ALREADY_AUTHORIZED"),
      true
    );

    const claimed = await storeB.claimPurchase(purchaseId, playerId);
    assert.equal(claimed.status, "GRANT_CLAIMED");

    const grants = await Promise.all([
      storeA.applyPurchaseGrant(purchaseId, playerId),
      storeB.applyPurchaseGrant(purchaseId, playerId)
    ]);
    assert.equal(
      grants.filter((result) => result.status === "GRANT_APPLIED").length,
      1
    );
    assert.equal(
      grants.some((result) => result.status === "GRANT_ALREADY_APPLIED"),
      true
    );
    assert.equal(grants.find((result) => result.playerMeta)?.playerMeta.currencies.SCRAP, 5000);
  } finally {
    await Promise.all([storeA.close(), storeB.close()]);
  }

  const reopened = new ManagedPurchaseStore({ dsn: liveDsn() });
  try {
    await reopened.initialize();
    const restored = await reopened.loadPurchase(purchaseId);
    assert.equal(restored.authorizationStatus, "AUTHORIZED");
    assert.equal(restored.claimStatus, "GRANT_CLAIMED");
    const meta = await reopened.loadPlayerMeta(playerId);
    assert.equal(meta.currencies.SCRAP, 5000);
    assert.equal(meta.rewardLedger["purchase-grant:" + purchaseId], true);
    const duplicateGrant = await reopened.applyPurchaseGrant(purchaseId, playerId);
    assert.equal(duplicateGrant.status, "GRANT_ALREADY_APPLIED");
  } finally {
    await reopened.close();
  }
});

test("REAL PostgreSQL transaction rollback leaves no partial state", liveTestOptions, async () => {
  const store = new ManagedCombatStore({ dsn: liveDsn() });
  const table = "bw_test_transaction_rollback";
  try {
    await store.initialize();
    await store.pool.query(`CREATE TABLE IF NOT EXISTS ${table} (id integer PRIMARY KEY, value text NOT NULL)`);
    await store.pool.query(`TRUNCATE TABLE ${table}`);

    await assert.rejects(
      () => withPostgresTransaction(store.pool, async (client) => {
        await client.query(`INSERT INTO ${table}(id, value) VALUES (1, 'transient')`);
        throw new Error("intentional rollback");
      }),
      /intentional rollback/
    );

    const rows = await store.pool.query(`SELECT count(*)::int AS count FROM ${table}`);
    assert.equal(rows.rows[0].count, 0);
    await store.pool.query(`DROP TABLE ${table}`);
  } finally {
    await store.close();
  }
});
