import assert from "node:assert/strict";
import {
  PlayerMetaAuthority,
  PLAYER_META_SCHEMA_VERSION,
  createInitialPlayerMetaState,
  createPlayerIdentity,
  deserializePlayerMetaState,
  resolvePlayerIdentity,
  serializePlayerMetaState,
  validatePlayerMetaState
} from "./player_meta_state.js";

function fresh() {
  return new PlayerMetaAuthority(createInitialPlayerMetaState(createPlayerIdentity({ playerId: "test-player" })));
}

const initial = fresh().getSnapshot();
assert.equal(initial.schemaVersion, PLAYER_META_SCHEMA_VERSION);
assert.equal(initial.identity.playerId, "test-player");
assert.deepEqual(initial.currencies, { SCRAP: 0, FRAGMENTS: 0 });
assert.equal(initial.gacha.pullsSinceUR, 0);
assert.equal(validatePlayerMetaState(initial), true);

assert.throws(() => validatePlayerMetaState(null), TypeError);
assert.throws(() => validatePlayerMetaState({ ...initial, schemaVersion: 99 }), TypeError);
assert.throws(() => validatePlayerMetaState({ ...initial, currencies: { SCRAP: -1, FRAGMENTS: 0 } }), TypeError);
assert.throws(() => validatePlayerMetaState({ ...initial, identity: { playerId: "bad id", provider: "local" } }), TypeError);

const authority = fresh();
const addCharacter = authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw001", quantity: 2 });
assert.equal(addCharacter.ok, true);
assert.deepEqual(addCharacter.snapshot.inventory.characters.bw001, { quantity: 2, unlocked: true });

const addScrap = authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 1000 });
assert.equal(addScrap.ok, true);
const spendScrap = authority.dispatch({ type: "SPEND_CURRENCY", currency: "SCRAP", amount: 250 });
assert.equal(spendScrap.ok, true);
assert.equal(spendScrap.snapshot.currencies.SCRAP, 750);

const invalidSpend = authority.dispatch({ type: "SPEND_CURRENCY", currency: "SCRAP", amount: 9999 });
assert.equal(invalidSpend.ok, false);
assert.equal(invalidSpend.reason, "INSUFFICIENT_CURRENCY");
assert.equal(authority.getSnapshot().currencies.SCRAP, 750);

const invalidAction = authority.dispatch({ type: "ADD_CURRENCY", currency: "UNKNOWN", amount: 10 });
assert.equal(invalidAction.ok, false);
assert.equal(authority.getSnapshot().currencies.SCRAP, 750);

const beforeInvalidCharacter = authority.getSnapshot();
const invalidCharacter = authority.dispatch({ type: "ADD_CHARACTER", characterId: "bad id", quantity: 1 });
assert.equal(invalidCharacter.ok, false);
assert.strictEqual(authority.getSnapshot(), beforeInvalidCharacter);

const unlock = authority.dispatch({ type: "SET_UNLOCK", id: "tutorial_complete", unlocked: true });
assert.equal(unlock.ok, true);
assert.equal(unlock.snapshot.unlocks.tutorial_complete, true);

const pity = authority.dispatch({ type: "UPDATE_GACHA_STATE", pullsSinceUR: 12 });
assert.equal(pity.ok, true);
assert.equal(pity.snapshot.gacha.pullsSinceUR, 12);

const roster = authority.dispatch({ type: "SET_ROSTER", activeBatter: "bw001", supports: [null, null] });
assert.equal(roster.ok, true);
assert.deepEqual(roster.snapshot.roster.supports, [null, null]);

const snapshot = authority.getSnapshot();
assert.equal(Object.isFrozen(snapshot), true);
assert.equal(Object.isFrozen(snapshot.inventory), true);
assert.equal(Object.isFrozen(snapshot.currencies), true);
const stableScrap = snapshot.currencies.SCRAP;
assert.throws(() => { snapshot.currencies.SCRAP = 1; }, TypeError);
assert.equal(authority.getSnapshot().currencies.SCRAP, stableScrap);

const serialized = serializePlayerMetaState(snapshot);
const roundTrip = deserializePlayerMetaState(serialized);
assert.deepEqual(roundTrip, snapshot);
assert.equal(Object.isFrozen(roundTrip), true);

const telegram = resolvePlayerIdentity({ telegramUser: { id: 12345 } });
assert.deepEqual(telegram, {
  playerId: "telegram:12345",
  provider: "telegram",
  telegramUserId: "12345"
});
const local = resolvePlayerIdentity({ telegramUser: null, localPlayerId: "offline-test" });
assert.deepEqual(local, { playerId: "offline-test", provider: "local" });

const deterministicA = fresh();
const deterministicB = fresh();
const actions = [
  { type: "ADD_CHARACTER", characterId: "bw007", quantity: 1 },
  { type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 30 },
  { type: "UPDATE_GACHA_STATE", pullsSinceUR: 4 },
  { type: "SET_UNLOCK", id: "tutorial_complete", unlocked: true }
];
for (const action of actions) {
  assert.deepEqual(deterministicA.dispatch(action), deterministicB.dispatch(action));
}
assert.deepEqual(deterministicA.getSnapshot(), deterministicB.getSnapshot());

const invalidState = JSON.stringify({ ...initial, currencies: { SCRAP: -1, FRAGMENTS: 0 } });
assert.throws(() => deserializePlayerMetaState(invalidState), TypeError);

console.log("player_meta_authority_test: PASS");
