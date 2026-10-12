import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { PlayerMetaAuthority, createPlayerIdentity } from "../../webapp/js/player_meta_state.js";
import { createPlayerMetaPersistenceAdapter } from "../../webapp/js/player_meta_persistence_adapter.js";
import { applyCombatRewardPipeline, createCombatResultFromTurnResult } from "../../webapp/js/reward_pipeline.js";
import { authorizeServerCombatResult, verifyServerCombatAttestation } from "../../webapp/js/reward_authority.js";

if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    compareAndSet(key, expected, next) {
      if ((values.has(key) ? values.get(key) : null) !== expected) return false;
      values.set(key, String(next));
      return true;
    }
  };
}

function snapshotMeta({ playerId, storage }) {
  const identity = createPlayerIdentity({ playerId, provider: "local" });
  const persistenceAdapter = createPlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(persistenceAdapter.load(identity));
  return { identity, persistenceAdapter, authority };
}

async function sendTurn(baseUrl, playerId, matchId, grade = "MISS") {
  const response = await fetch(`${baseUrl}/v1/combat/${encodeURIComponent(matchId)}/turn`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test-player-id": playerId
    },
    body: JSON.stringify({
      match_id: matchId,
      action: { type: "BAT", timing_grade: grade, timing_delta_ms: 0, timing_target_ms: 0 }
    })
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.type, "TurnResultDTO");
  return payload;
}

async function initMatch(baseUrl, playerId, matchId) {
  const response = await fetch(`${baseUrl}/v1/combat/${encodeURIComponent(matchId)}/init`, {
    headers: { "x-test-player-id": playerId }
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.type, "CombatInitDTO");
  assert.equal(payload.match_id, matchId);
  assert.equal(payload.reward_authority.version, "SERVER_COMBAT_ATTESTATION_V1");
  assert.ok(payload.reward_authority.nonce);
  assert.equal(payload.reward_authority.public_key_jwk.crv, "P-256");
  return payload;
}

async function tacticalRound(baseUrl, playerId, matchId) {
  const results = [];
  for (let i = 0; i < 5; i += 1) results.push(await sendTurn(baseUrl, playerId, matchId, "MISS"));
  assert.equal(results[4].state.phase, "CLIMAX");
  return results;
}

function authorityContext(init, playerId) {
  return {
    version: init.reward_authority.version,
    matchId: init.match_id,
    playerId,
    nonce: init.reward_authority.nonce,
    publicKeyJwk: init.reward_authority.public_key_jwk
  };
}

function terminalSummary(result, context, verification, pipeline, meta, persistenceAdapter, reloaded) {
  return {
    scenario: result.outcome,
    match_id: result.match_id,
    playerId: context.playerId,
    turn_id: result.turn_id,
    result: result.result,
    outcome: result.outcome,
    attestationPresent: Boolean(result.reward_attestation),
    attestationVerified: Boolean(verification?.ok),
    rewardReason: pipeline?.rewardResult?.reason || null,
    rewards: pipeline?.rewardResult?.rewards || [],
    scrap: meta.authority.getSnapshot().currencies.SCRAP,
    ledger: meta.authority.getSnapshot().rewardLedger,
    persistenceRevision: persistenceAdapter.getRevision(meta.identity),
    reloadedScrap: reloaded?.currencies?.SCRAP ?? null,
    reloadedLedger: reloaded?.rewardLedger ?? null
  };
}

test("T097-TC-001: real HTTP combat authority, signed terminal outcomes, idempotency and rejection", async (t) => {
  const playerId = "t097-player-e2e";
  const config = loadConfig({
    NODE_ENV: "test",
    PORT: "0",
    ALLOWED_ORIGINS: "*",
    AUTHORITY_PERSISTENCE_PROVIDER: "memory"
  });
  const store = new InMemoryCombatStore();
  const signer = createEphemeralTestSigner();
  const created = createAuthorityServer({ config, store, signer });
  await new Promise((resolve, reject) => {
    created.server.once("error", reject);
    created.server.listen(0, "127.0.0.1", resolve);
  });
  const address = created.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const trace = [];

  try {
    await t.test("victory: nested timing grade reaches the server resolver and credits exactly 100 Scrap", async () => {
      const matchId = "t097-victory-match";
      const init = await initMatch(baseUrl, playerId, matchId);
      const meta = snapshotMeta({ playerId, storage: createMemoryStorage() });
      const tactical = await tacticalRound(baseUrl, playerId, matchId);
      assert.equal(tactical[4].state.phase, "CLIMAX");

      const terminal = await sendTurn(baseUrl, playerId, matchId, "GREAT");
      assert.equal(terminal.outcome, "VICTORY");
      assert.equal(terminal.result, "HOME_RUN");
      assert.equal(terminal.match_end, true);
      assert.ok(terminal.damage > 0, "GREAT must produce server-calculated climax damage");
      assert.equal(terminal.turn_id, "turn-006");
      assert.ok(terminal.reward_attestation, "server must sign the terminal victory");

      const context = authorityContext(init, playerId);
      const verification = await verifyServerCombatAttestation({
        turnResult: terminal,
        attestation: terminal.reward_attestation,
        authorityContext: context
      });
      assert.equal(verification.ok, true, verification.reason || "signature verification failed");
      const proof = await authorizeServerCombatResult({
        turnResult: terminal,
        attestation: terminal.reward_attestation,
        authorityContext: context
      });
      const combatResult = createCombatResultFromTurnResult({ turnResult: terminal, matchId, playerId });
      const pipeline = applyCombatRewardPipeline({
        combatResult,
        authority: meta.authority,
        persistenceAdapter: meta.persistenceAdapter,
        authorityProof: proof
      });
      assert.equal(pipeline.rewardResult.rewards.length, 1);
      assert.deepEqual(pipeline.rewardResult.rewards[0], { kind: "CURRENCY", currency: "SCRAP", amount: 100 });
      assert.equal(meta.authority.getSnapshot().currencies.SCRAP, 100);
      assert.deepEqual(Object.keys(meta.authority.getSnapshot().rewardLedger), [`battle:${matchId}`]);
      assert.equal(meta.persistenceAdapter.getRevision(meta.identity), 1);
      const reloadedAdapter = createPlayerMetaPersistenceAdapter({ storage: meta.persistenceAdapter.storage });
      const reloaded = reloadedAdapter.load(meta.identity);
      assert.equal(reloaded.currencies.SCRAP, 100);
      assert.deepEqual(Object.keys(reloaded.rewardLedger), [`battle:${matchId}`]);

      const duplicate = applyCombatRewardPipeline({
        combatResult,
        authority: meta.authority,
        persistenceAdapter: meta.persistenceAdapter,
        authorityProof: proof
      });
      assert.equal(duplicate.applied.duplicate, true);
      assert.equal(meta.authority.getSnapshot().currencies.SCRAP, 100);
      assert.equal(Object.keys(meta.authority.getSnapshot().rewardLedger).length, 1);
      assert.equal(meta.persistenceAdapter.getRevision(meta.identity), 1);
      assert.equal(store.rewardLedger.has(`battle:${matchId}`), true);
      trace.push({
        ...terminalSummary(terminal, context, verification, pipeline, meta, meta.persistenceAdapter, reloaded),
        duplicateRejectedAsNoOp: duplicate.applied.duplicate,
        revisionAfterDuplicate: meta.persistenceAdapter.getRevision(meta.identity),
        serverAuthorityLedgerEntry: store.rewardLedger.has(`battle:${matchId}`)
      });
    });

    await t.test("defeat: server signs terminal identity but resolver grants no currency", async () => {
      const matchId = "t097-defeat-match";
      const init = await initMatch(baseUrl, playerId, matchId);
      const meta = snapshotMeta({ playerId, storage: createMemoryStorage() });
      let terminal = null;
      for (let round = 0; round < 4; round += 1) {
        await tacticalRound(baseUrl, playerId, matchId);
        terminal = await sendTurn(baseUrl, playerId, matchId, "MISS");
        if (round < 3) {
          assert.equal(terminal.match_end, false);
          assert.equal(terminal.damage, 0);
        }
      }
      assert.equal(terminal.outcome, "DEFEAT");
      assert.equal(terminal.result, "DEFEAT");
      assert.equal(terminal.match_end, true);
      assert.ok(terminal.reward_attestation, "server must sign the terminal defeat identity");

      const context = authorityContext(init, playerId);
      const verification = await verifyServerCombatAttestation({
        turnResult: terminal,
        attestation: terminal.reward_attestation,
        authorityContext: context
      });
      assert.equal(verification.ok, true, verification.reason || "defeat signature verification failed");
      const proof = await authorizeServerCombatResult({
        turnResult: terminal,
        attestation: terminal.reward_attestation,
        authorityContext: context
      });
      const combatResult = createCombatResultFromTurnResult({ turnResult: terminal, matchId, playerId });
      const pipeline = applyCombatRewardPipeline({
        combatResult,
        authority: meta.authority,
        persistenceAdapter: meta.persistenceAdapter,
        authorityProof: proof
      });
      assert.equal(pipeline.rewardResult.reason, "NO_REWARD_ON_DEFEAT");
      assert.deepEqual(pipeline.rewardResult.rewards, []);
      assert.equal(meta.authority.getSnapshot().currencies.SCRAP, 0);
      assert.deepEqual(Object.keys(meta.authority.getSnapshot().rewardLedger), [`battle:${matchId}`]);
      assert.equal(store.rewardLedger.has(`battle:${matchId}`), true);
      const reloadedAdapter = createPlayerMetaPersistenceAdapter({ storage: meta.persistenceAdapter.storage });
      const reloaded = reloadedAdapter.load(meta.identity);
      assert.equal(reloaded.currencies.SCRAP, 0);
      assert.deepEqual(Object.keys(reloaded.rewardLedger), [`battle:${matchId}`]);
      trace.push(terminalSummary(terminal, context, verification, pipeline, meta, meta.persistenceAdapter, reloaded));
    });

    await t.test("missing, tampered and identity-mismatched attestations do not mutate Player Meta", async () => {
      const matchId = "t097-invalid-match";
      const init = await initMatch(baseUrl, playerId, matchId);
      await tacticalRound(baseUrl, playerId, matchId);
      const terminal = await sendTurn(baseUrl, playerId, matchId, "GREAT");
      assert.equal(terminal.outcome, "VICTORY");
      const context = authorityContext(init, playerId);
      const invalidMeta = snapshotMeta({ playerId: "t097-invalid-player", storage: createMemoryStorage() });
      const before = JSON.stringify(invalidMeta.authority.getSnapshot());
      const storageKey = invalidMeta.persistenceAdapter.keyFor(invalidMeta.identity);
      const beforePersisted = invalidMeta.persistenceAdapter.storage.getItem(storageKey);
      const variants = [
        { name: "missing", attestation: null, context },
        {
          name: "tampered-signature",
          attestation: { ...terminal.reward_attestation, signature: (terminal.reward_attestation.signature.startsWith("A") ? "B" : "A") + terminal.reward_attestation.signature.slice(1) },
          context
        },
        {
          name: "identity-mismatch",
          attestation: terminal.reward_attestation,
          context: { ...context, playerId: "different-player" }
        }
      ];
      for (const variant of variants) {
        const verification = await verifyServerCombatAttestation({
          turnResult: terminal,
          attestation: variant.attestation,
          authorityContext: variant.context
        });
        assert.equal(verification.ok, false, `${variant.name} must fail verification`);
        assert.throws(() => applyCombatRewardPipeline({
          combatResult: createCombatResultFromTurnResult({ turnResult: terminal, matchId, playerId: invalidMeta.identity.playerId }),
          authority: invalidMeta.authority,
          persistenceAdapter: invalidMeta.persistenceAdapter,
          authorityProof: verification.proof
        }));
        assert.equal(JSON.stringify(invalidMeta.authority.getSnapshot()), before);
        assert.equal(invalidMeta.persistenceAdapter.storage.getItem(storageKey), beforePersisted);
        trace.push({
          scenario: `invalid-${variant.name}`,
          match_id: matchId,
          playerId: invalidMeta.identity.playerId,
          turn_id: terminal.turn_id,
          outcome: terminal.outcome,
          attestationPresent: Boolean(variant.attestation),
          verification: verification.reason,
          scrap: invalidMeta.authority.getSnapshot().currencies.SCRAP,
          ledgerEntries: Object.keys(invalidMeta.authority.getSnapshot().rewardLedger).length,
          persistedWrite: invalidMeta.persistenceAdapter.storage.getItem(storageKey) !== beforePersisted
        });
      }
    });

    assert.equal(store.rewardLedger.size, 3, "server-side authority ledger should contain each terminal battle exactly once");
    const evidencePath = process.env.T097_EVIDENCE_PATH;
    if (evidencePath) {
      const fs = await import("node:fs");
      const path = await import("node:path");
      fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
      fs.writeFileSync(evidencePath, JSON.stringify({
        task: "T097-TEST-CONTRACT-001",
        runtime: process.version,
        baseUrl: "isolated ephemeral loopback",
        signer: "ephemeral P-256; private key not serialized",
        serverStore: "in-memory isolated test store",
        scenarios: trace
      }, null, 2) + "\n");
    }
    console.log("T097_AUTHORITY_E2E_TRACE " + JSON.stringify(trace));
  } finally {
    await new Promise((resolve) => created.server.close(resolve));
  }
});
