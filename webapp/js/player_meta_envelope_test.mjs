import assert from "node:assert/strict";
import { extractPlayerMetaState } from "./player_meta_envelope.mjs";

const state = {
  schemaVersion: 1,
  identity: { playerId: "local-player", provider: "local" },
  currencies: { SCRAP: 0, FRAGMENTS: 0 },
  rewardLedger: {}
};
assert.equal(extractPlayerMetaState({ schemaVersion: 1, revision: 4, state }), state);
assert.equal(extractPlayerMetaState(state), state);
assert.throws(() => extractPlayerMetaState({ schemaVersion: 1, revision: -1, state }), /Invalid Player Meta persistence envelope/);
assert.throws(() => extractPlayerMetaState({ schemaVersion: 1, revision: 1, state: { currencies: { SCRAP: "0" }, rewardLedger: {} } }), /Invalid Player Meta state payload/);
assert.throws(() => extractPlayerMetaState({ schemaVersion: 1, revision: 1 }), /Invalid Player Meta persistence envelope/);
console.log("PLAYER META ENVELOPE EXTRACTION = PASS_STATIC");
