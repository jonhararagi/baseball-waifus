import assert from "node:assert/strict";
import { test } from "node:test";
import { createEphemeralTestSigner } from "../src/attestation_signer.mjs";
import { authorizeServerCombatResult } from "../../webapp/js/reward_authority.js";

test("backend ECDSA signature is accepted by the Web Crypto client verifier", async () => {
  const signer = createEphemeralTestSigner();
  const matchId = "compat-match";
  const playerId = "test-player";
  const turnId = "turn-006";
  const nonce = "nonce-compat-001";

  const attestation = signer.signAttestation({
    matchId,
    playerId,
    turnId,
    outcome: "VICTORY",
    result: "HOME_RUN",
    nonce
  });

  const turnResult = {
    type: "TurnResultDTO",
    match_id: matchId,
    turn_id: turnId,
    outcome: "VICTORY",
    result: "HOME_RUN",
    state: { match_complete: true, outcome: "VICTORY" }
  };

  const context = {
    version: "SERVER_COMBAT_ATTESTATION_V1",
    matchId,
    playerId,
    nonce,
    publicKeyJwk: signer.publicKeyJwk
  };

  const proof = await authorizeServerCombatResult({
    turnResult,
    attestation,
    authorityContext: context
  });
  assert.equal(proof.matchId, matchId);
  assert.equal(proof.playerId, playerId);

  await assert.rejects(
    () => authorizeServerCombatResult({
      turnResult,
      attestation: { ...attestation, result: "DEFEAT" },
      authorityContext: context
    }),
    /Reward authority rejected/
  );
});
