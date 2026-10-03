import assert from "node:assert/strict";
import {
  createInitialPlayerMetaState,
  createPlayerIdentity,
  PlayerMetaAuthority
} from "./player_meta_state.js";
import {
  PlayerMetaPersistenceAdapter,
  PlayerMetaPersistenceError
} from "./player_meta_persistence_adapter.js";

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  compareAndSet(key, expectedValue, nextValue) {
    const current = this.getItem(key);
    if (current !== (expectedValue === null ? null : String(expectedValue))) return false;
    this.data.set(key, String(nextValue));
    return true;
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

function identity(playerId) {
  return createPlayerIdentity({ playerId });
}

function stateFor(playerId) {
  return createInitialPlayerMetaState(identity(playerId));
}

const storage = new MemoryStorage();
const adapter = new PlayerMetaPersistenceAdapter({ storage });
const localIdentity = identity("player-a");

// INITIAL LOAD: absence is a valid initial state, not corruption.
const initial = adapter.load(localIdentity);
assert.deepEqual(initial, stateFor("player-a"));
assert.equal(Object.isFrozen(initial), true);

// SAVE / LOAD: authority output survives a round trip without reference sharing.
const authority = new PlayerMetaAuthority(initial);
authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw001", quantity: 2 });
authority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 500 });
authority.dispatch({ type: "UPDATE_GACHA_STATE", pullsSinceUR: 17 });
const savedState = authority.getSnapshot();
const saveResult = adapter.save(savedState);
assert.deepEqual(saveResult, { ok: true, playerId: "player-a", schemaVersion: 1, revision: 1 });
assert.equal(adapter.getRevision(), 1);
const loaded = adapter.load(localIdentity);
assert.deepEqual(loaded, savedState);
assert.notStrictEqual(loaded, savedState);
assert.notStrictEqual(loaded.inventory, savedState.inventory);

// IMMUTABILITY: load returns a deep-frozen T056 snapshot.
assert.equal(Object.isFrozen(loaded), true);
assert.equal(Object.isFrozen(loaded.inventory), true);
assert.equal(Object.isFrozen(loaded.inventory.characters), true);
assert.equal(Object.isFrozen(loaded.currencies), true);
assert.equal(Object.isFrozen(loaded.gacha), true);
assert.equal(Object.isFrozen(loaded.roster), true);
assert.throws(() => { loaded.currencies.SCRAP = 1; }, TypeError);
assert.throws(() => { loaded.inventory.characters.bw001.quantity = 99; }, TypeError);
assert.equal(adapter.load(localIdentity).currencies.SCRAP, 600);
assert.equal(adapter.getRevision(), 1);

const writerA = new PlayerMetaPersistenceAdapter({ storage });
const writerB = new PlayerMetaPersistenceAdapter({ storage });
const writerAState = writerA.load(localIdentity);
const writerBState = writerB.load(localIdentity);
assert.equal(writerA.getRevision(), 1);
assert.equal(writerB.getRevision(), 1);

const writerAAuthority = new PlayerMetaAuthority(writerAState);
writerAAuthority.dispatch({ type: "ADD_CURRENCY", currency: "SCRAP", amount: 100 });
const writerBAuthority = new PlayerMetaAuthority(writerBState);
writerBAuthority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 5 });

const writerASaved = writerA.save(writerAAuthority.getSnapshot());
assert.equal(writerASaved.revision, 2);
assert.throws(
  () => writerB.save(writerBAuthority.getSnapshot()),
  (error) => error instanceof PlayerMetaPersistenceError && error.code === "STALE_WRITE"
);
assert.deepEqual(writerB.load(localIdentity).currencies, { SCRAP: 600, FRAGMENTS: 0 });

writerBAuthority.replaceSnapshot(writerB.load(localIdentity));
writerBAuthority.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 5 });
const retry = writerB.save(writerBAuthority.getSnapshot());
assert.equal(retry.revision, 3);
assert.deepEqual(writerB.load(localIdentity).currencies, { SCRAP: 600, FRAGMENTS: 5 });

// INVALID SAVE: persistence refuses invalid PlayerMetaState values.
assert.throws(() => adapter.save(null), TypeError);
assert.throws(() => adapter.save({ ...savedState, schemaVersion: 99 }), TypeError);
assert.throws(() => adapter.save({
  ...savedState,
  currencies: { SCRAP: -1, FRAGMENTS: 0 }
}), TypeError);
assert.throws(() => adapter.save({
  ...savedState,
  inventory: { characters: { bw001: { quantity: -1, unlocked: true } } }
}), TypeError);

// CORRUPTED LOAD: malformed persisted data is rejected, never normalized into a valid state.
const key = adapter.keyFor(localIdentity);
const validPersistedRecord = storage.getItem(key);
for (const corrupted of [
  "{not-json",
  JSON.stringify({ ...savedState, schemaVersion: 99 }),
  JSON.stringify({ ...savedState, currencies: { SCRAP: -1, FRAGMENTS: 0 } }),
  JSON.stringify({ ...savedState, roster: { activeBatter: "bw001", supports: [null] } }),
  JSON.stringify({ ...savedState, gacha: {} })
]) {
  storage.setItem(key, corrupted);
  assert.throws(() => adapter.load(localIdentity), PlayerMetaPersistenceError);
}
// Restore the valid record after corruption tests. The adapter never silently repairs it.
storage.setItem(key, validPersistedRecord);
assert.deepEqual(adapter.load(localIdentity).currencies, { SCRAP: 600, FRAGMENTS: 5 });

// IDENTITY / NO CROSS-CONTAMINATION: player keys are isolated.
const playerB = identity("player-b");
const stateB = new PlayerMetaAuthority(stateFor("player-b"));
stateB.dispatch({ type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 42 });
adapter.save(stateB.getSnapshot());
assert.equal(adapter.load(localIdentity).identity.playerId, "player-a");
assert.equal(adapter.load(localIdentity).currencies.SCRAP, 500);
assert.equal(adapter.load(playerB).identity.playerId, "player-b");
assert.equal(adapter.load(playerB).currencies.FRAGMENTS, 42);
assert.notEqual(adapter.keyFor(localIdentity), adapter.keyFor(playerB));

// DETERMINISM: equivalent states produce byte-identical persisted representations.
const deterministicStorageA = new MemoryStorage();
const deterministicStorageB = new MemoryStorage();
const deterministicA = new PlayerMetaPersistenceAdapter({ storage: deterministicStorageA });
const deterministicB = new PlayerMetaPersistenceAdapter({ storage: deterministicStorageB });
const equivalentA = new PlayerMetaAuthority(stateFor("deterministic"));
const equivalentB = new PlayerMetaAuthority(stateFor("deterministic"));
for (const action of [
  { type: "ADD_CHARACTER", characterId: "bw009", quantity: 1 },
  { type: "ADD_CURRENCY", currency: "FRAGMENTS", amount: 25 },
  { type: "SET_UNLOCK", id: "tutorial_complete", unlocked: true }
]) {
  assert.deepEqual(equivalentA.dispatch(action), equivalentB.dispatch(action));
}
deterministicA.save(equivalentA.getSnapshot());
deterministicB.save(equivalentB.getSnapshot());
assert.equal(
  deterministicStorageA.getItem(deterministicA.keyFor(equivalentA.getSnapshot().identity)),
  deterministicStorageB.getItem(deterministicB.keyFor(equivalentB.getSnapshot().identity))
);

// CLEAR: only the Player Meta record disappears; unrelated storage remains.
storage.setItem("unrelated-save", "keep-me");
adapter.save(savedState);
const clearResult = adapter.clear(localIdentity);
assert.deepEqual(clearResult, { ok: true, playerId: "player-a" });
assert.deepEqual(adapter.load(localIdentity), stateFor("player-a"));
assert.equal(storage.getItem("unrelated-save"), "keep-me");

// Persistence does not become a second authority: it only consumes authority snapshots.
assert.equal(typeof adapter.save, "function");
assert.equal(typeof adapter.load, "function");
assert.equal(typeof adapter.clear, "function");

console.log("player_meta_persistence_adapter_test: PASS");
