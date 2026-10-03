import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createAuthorityServer } from "../src/server.mjs";
import { loadConfig } from "../src/config.mjs";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { InMemoryCombatStore } from "../src/combat_store.mjs";

let instance;
let baseUrl;

async function request(path, options = {}) {
  return fetch(baseUrl + path, {
    signal: AbortSignal.timeout(5000),
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-test-player-id": "test-player-001",
      ...(options.headers || {})
    }
  });
}

before(async () => {
  const config = loadConfig({ ...process.env, NODE_ENV: "test", PORT: "0" });
  instance = createAuthorityServer({
    config,
    store: new InMemoryCombatStore(),
    signer: createEphemeralTestSigner()
  });
  await new Promise((resolve) => instance.server.listen(0, resolve));
  baseUrl = "http://127.0.0.1:" + instance.server.address().port;
});

after(async () => {
  await new Promise((resolve) => instance.server.close(resolve));
});

test("health is available", async () => {
  const response = await request("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "basewarriors-authority" });
});

test("ready fails closed without production persistence", async () => {
  const response = await request("/ready");
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ready, false);
  assert.equal(body.signing_key, true);
  assert.equal(body.authentication, true);
  assert.equal(body.persistence, false);
});

test("valid action is accepted and client result is rejected", async () => {
  const initResponse = await request("/v1/combat/match-001/init");
  assert.equal(initResponse.status, 200);
  const init = await initResponse.json();
  assert.equal(init.reward_authority.version, "SERVER_COMBAT_ATTESTATION_V1");
  assert.equal(init.reward_authority.public_key_jwk.kty, "EC");
  assert.equal(init.state.revision, 0);

  const forged = await request("/v1/combat/match-001/turn", {
    method: "POST",
    body: JSON.stringify({
      action: { type: "BAT" },
      timing_grade: "MISS",
      outcome: "VICTORY",
      result: "VICTORY",
      damage: 9999
    })
  });
  assert.equal(forged.status, 400);
  assert.equal((await forged.json()).error, "CLIENT_RESULT_FORBIDDEN");

  const valid = await request("/v1/combat/match-001/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, timing_grade: "MISS", turn_id: "turn-001" })
  });
  assert.equal(valid.status, 200);
  const result = await valid.json();
  assert.equal(result.result, "TACTICAL_HIT");
  assert.equal(result.outcome, "TACTICAL_HIT");
  assert.equal(result.victory, false);
});

test("wrong player is rejected", async () => {
  const response = await request("/v1/combat/match-001/init", { headers: { "x-test-player-id": "other-player" } });
  assert.equal(response.status, 403);
});

test("wrong match is rejected", async () => {
  const response = await request("/v1/combat/match-001/turn", {
    method: "POST",
    body: JSON.stringify({
      match_id: "different-match",
      action: { type: "BAT" },
      turn_id: "turn-002"
    })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "MATCH_ID_MISMATCH");
});

test("wrong turn is rejected", async () => {
  const response = await request("/v1/combat/match-001/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, turn_id: "turn-999" })
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "TURN_OUT_OF_SEQUENCE");
});

test("replayed turn id is rejected", async () => {
  const init = await request("/v1/combat/replay-match/init");
  assert.equal(init.status, 200);
  const first = await request("/v1/combat/replay-match/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, turn_id: "turn-001", timing_grade: "MISS" })
  });
  assert.equal(first.status, 200);
  const replay = await request("/v1/combat/replay-match/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, turn_id: "turn-001", timing_grade: "MISS" })
  });
  assert.equal(replay.status, 409);
  assert.equal((await replay.json()).error, "TURN_OUT_OF_SEQUENCE");
});

test("server terminal result creates an attestation without exposing the private key", async () => {
  const state = instance.store.createMatch({ matchId: "terminal-match", playerId: "test-player-001" });
  state.phase = "CLIMAX";
  state.bossHp = 20;
  state.internalEnergy = 100;
  state.tacticalEffectiveness = 100;
  state.playerStamina = 100;
  state.turnId = "turn-001";
  state.turnNumber = 1;
  instance.store.saveMatch(state);

  const response = await request("/v1/combat/terminal-match/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, timing_grade: "GREAT", turn_id: "turn-001" })
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.victory, true);
  assert.equal(body.outcome, "VICTORY");
  assert.equal(body.result, "HOME_RUN");
  assert.equal(body.match_end, true);
  assert.ok(body.reward_attestation);
  assert.equal(body.reward_attestation.player_id, "test-player-001");
  assert.equal(body.reward_attestation.private_key, undefined);
});


test("authoritative state conflict rejects stale concurrent turn", async () => {
  const initA = await request("/v1/combat/concurrency-match/init");
  assert.equal(initA.status, 200);
  const first = await request("/v1/combat/concurrency-match/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, timing_grade: "MISS", turn_id: "turn-001" })
  });
  assert.equal(first.status, 200);
  const staleReplay = await request("/v1/combat/concurrency-match/turn", {
    method: "POST",
    body: JSON.stringify({ action: { type: "BAT" }, timing_grade: "MISS", turn_id: "turn-001" })
  });
  assert.equal(staleReplay.status, 409);
  assert.equal((await staleReplay.json()).error, "TURN_OUT_OF_SEQUENCE");
});
