import { randomUUID } from "node:crypto";
import {
  MANAGED_PERSISTENCE_SCHEMA_VERSION,
  createPostgresPool,
  postgresStoreError,
  validateManagedDsn,
  withPostgresTransaction
} from "./postgres_persistence.mjs";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bw_authority_schema (
  singleton boolean PRIMARY KEY DEFAULT true,
  schema_version integer NOT NULL
);
INSERT INTO bw_authority_schema(singleton, schema_version)
VALUES (true, ${MANAGED_PERSISTENCE_SCHEMA_VERSION})
ON CONFLICT (singleton) DO UPDATE SET schema_version = EXCLUDED.schema_version;

CREATE TABLE IF NOT EXISTS bw_combat_matches (
  match_id text PRIMARY KEY,
  player_id text NOT NULL,
  revision bigint NOT NULL,
  state jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS bw_reward_ledger (
  reward_id text PRIMARY KEY
);
`;

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function stableId(value, label = "id") {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 256) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
  return id;
}

export class ManagedCombatStore {
  constructor({ dsn, pool = null } = {}) {
    this.dsn = validateManagedDsn(dsn);
    this.pool = createPostgresPool({ dsn: this.dsn, pool });
    this.isDurable = true;
    this.isOperational = false;
  }

  async initialize() {
    try {
      await this.pool.query("SELECT 1");
      await this.pool.query(SCHEMA_SQL);
      const result = await this.pool.query("SELECT schema_version FROM bw_authority_schema WHERE singleton = true");
      if (Number(result.rows[0]?.schema_version) !== MANAGED_PERSISTENCE_SCHEMA_VERSION) {
        throw new Error("Unsupported managed persistence schema version");
      }
      this.isOperational = true;
      return true;
    } catch (error) {
      this.isOperational = false;
      throw postgresStoreError("Managed combat persistence initialization failed", error);
    }
  }

  async close() {
    if (typeof this.pool.end === "function") await this.pool.end();
    this.isOperational = false;
  }

  async createMatch({ matchId, playerId }) {
    const id = stableId(matchId, "matchId");
    const owner = stableId(playerId, "playerId");
    const state = {
      matchId: id, playerId: owner, revision: 0, turnId: "turn-001", turnNumber: 1,
      phase: "TACTICAL", bossHp: 100, bossMaxHp: 100, internalEnergy: 0,
      tacticalEffectiveness: 0, playerStamina: 100, playerStaminaMax: 100,
      round: 1, tacticalTurn: 1, nonce: randomUUID(), completed: false
    };
    try {
      await this.pool.query(
        "INSERT INTO bw_combat_matches(match_id, player_id, revision, state) VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (match_id) DO NOTHING",
        [id, owner, 0, JSON.stringify(state)]
      );
      return await this.loadMatch(id);
    } catch (error) {
      throw postgresStoreError("Managed combat match creation failed", error);
    }
  }

  async loadMatch(matchId) {
    const id = stableId(matchId, "matchId");
    try {
      const result = await this.pool.query(
        "SELECT state, revision, player_id FROM bw_combat_matches WHERE match_id = $1", [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      const state = typeof row.state === "string" ? JSON.parse(row.state) : row.state;
      return clone({ ...state, playerId: row.player_id, revision: Number(row.revision) });
    } catch (error) {
      throw postgresStoreError("Managed combat match load failed", error);
    }
  }

  async saveMatch(state, { rewardId = null, expectedRevision = null } = {}) {
    const id = stableId(state?.matchId, "matchId");
    const expected = Number.isSafeInteger(expectedRevision)
      ? expectedRevision
      : (Number.isSafeInteger(state?.revision) ? state.revision : 0);
    if (!Number.isSafeInteger(expected) || expected < 0) throw new TypeError("Invalid expected revision");
    if (rewardId !== null) stableId(rewardId, "rewardId");

    try {
      return await withPostgresTransaction(this.pool, async (client) => {
        const currentResult = await client.query(
          "SELECT revision FROM bw_combat_matches WHERE match_id = $1 FOR UPDATE", [id]
        );
        const current = currentResult.rows[0];
        if (!current) throw postgresStoreError("Combat match does not exist");

        const currentRevision = Number(current.revision);
        if (expected !== currentRevision) {
          const conflict = postgresStoreError("STALE_WRITE");
          conflict.code = "STALE_WRITE";
          conflict.currentRevision = currentRevision;
          throw conflict;
        }

        const next = clone({ ...state, revision: currentRevision + 1 });
        await client.query(
          "UPDATE bw_combat_matches SET player_id=$2, revision=$3, state=$4::jsonb WHERE match_id=$1",
          [id, next.playerId, next.revision, JSON.stringify(next)]
        );
        if (rewardId !== null) {
          await client.query(
            "INSERT INTO bw_reward_ledger(reward_id) VALUES ($1) ON CONFLICT (reward_id) DO NOTHING", [rewardId]
          );
        }
        return clone(next);
      });
    } catch (error) {
      if (error?.code === "STALE_WRITE") throw error;
      throw postgresStoreError("Managed combat match save failed", error);
    }
  }

  async markRewardAuthorized(rewardId) {
    const id = stableId(rewardId, "rewardId");
    try {
      const result = await this.pool.query(
        "INSERT INTO bw_reward_ledger(reward_id) VALUES ($1) ON CONFLICT (reward_id) DO NOTHING", [id]
      );
      return result.rowCount === 1;
    } catch (error) {
      throw postgresStoreError("Managed reward authorization failed", error);
    }
  }

  async hasRewardAuthorized(rewardId) {
    const id = stableId(rewardId, "rewardId");
    try {
      const result = await this.pool.query("SELECT 1 FROM bw_reward_ledger WHERE reward_id=$1", [id]);
      return result.rowCount === 1;
    } catch (error) {
      throw postgresStoreError("Managed reward ledger read failed", error);
    }
  }
}
