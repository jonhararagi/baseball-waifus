import pg from "pg";

const { Pool } = pg;

export const MANAGED_PERSISTENCE_SCHEMA_VERSION = 1;

export function validateManagedDsn(dsn) {
  const value = String(dsn || "").trim();
  let url;
  try { url = new URL(value); } catch { throw new Error("Invalid managed persistence DSN"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    throw new Error("Managed persistence DSN must use postgres:// or postgresql:// with a host");
  }
  return value;
}

export function createPostgresPool({ dsn, max = 10, pool = null } = {}) {
  if (pool) return pool;
  return new Pool({
    connectionString: validateManagedDsn(dsn),
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
}

export async function withPostgresTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export function postgresStoreError(message, cause = null) {
  const error = new Error(message);
  error.name = "ManagedPersistenceError";
  error.cause = cause;
  return error;
}
