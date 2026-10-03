import {
  createInitialPlayerMetaState,
  createPlayerIdentity,
  deserializePlayerMetaState,
  serializePlayerMetaState,
  validatePlayerMetaState
} from "./player_meta_state.js";

export const PLAYER_META_PERSISTENCE_SCHEMA_VERSION = 1;
export const PLAYER_META_STORAGE_KEY_PREFIX = "baseball_waifus_player_meta_v1:";

function isStorageLike(storage) {
  return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function";
}

function assertIdentity(identity) {
  const normalized = createPlayerIdentity(identity || {});
  if (normalized.provider === "telegram" && !normalized.telegramUserId) {
    throw new TypeError("Telegram identity requires telegramUserId");
  }
  return normalized;
}

function identitiesMatch(expected, actual) {
  return expected.playerId === actual.playerId
    && expected.provider === actual.provider
    && (expected.telegramUserId || null) === (actual.telegramUserId || null);
}

function storageKey(identity, keyPrefix) {
  const normalized = assertIdentity(identity);
  return `${keyPrefix}${encodeURIComponent(normalized.playerId)}`;
}

function assertRevision(value, label = "revision") {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
}

export class PlayerMetaPersistenceError extends Error {
  constructor(message, cause = null, { code = "PERSISTENCE_ERROR", currentRevision = null } = {}) {
    super(message);
    this.name = "PlayerMetaPersistenceError";
    this.cause = cause;
    this.code = code;
    this.currentRevision = currentRevision;
  }
}

export class StalePlayerMetaWriteError extends PlayerMetaPersistenceError {
  constructor(expectedRevision, currentRevision) {
    super(
      `STALE_WRITE: expected revision ${expectedRevision}, current revision ${currentRevision}`,
      null,
      { code: "STALE_WRITE", currentRevision }
    );
    this.name = "StalePlayerMetaWriteError";
    this.expectedRevision = expectedRevision;
  }
}

function parseRecord(serialized, expectedIdentity) {
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new PlayerMetaPersistenceError("Persisted PlayerMetaState is invalid or corrupted", error);
  }

  if (
    parsed
    && typeof parsed === "object"
    && !Array.isArray(parsed)
    && Object.prototype.hasOwnProperty.call(parsed, "state")
  ) {
    if (parsed.schemaVersion !== PLAYER_META_PERSISTENCE_SCHEMA_VERSION) {
      throw new TypeError("Unsupported PlayerMeta persistence schemaVersion");
    }
    assertRevision(parsed.revision, "persistence revision");
    const state = deserializePlayerMetaState(JSON.stringify(parsed.state));
    if (!identitiesMatch(expectedIdentity, state.identity)) {
      throw new TypeError("Persisted PlayerMetaState identity mismatch");
    }
    return { revision: parsed.revision, state };
  }

  const state = deserializePlayerMetaState(serialized);
  if (!identitiesMatch(expectedIdentity, state.identity)) {
    throw new TypeError("Persisted PlayerMetaState identity mismatch");
  }
  return { revision: 0, state };
}

export class PlayerMetaPersistenceAdapter {
  constructor({
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    keyPrefix = PLAYER_META_STORAGE_KEY_PREFIX
  } = {}) {
    if (!isStorageLike(storage)) throw new TypeError("A compatible persistence storage is required");
    if (typeof keyPrefix !== "string" || keyPrefix.length === 0) throw new TypeError("keyPrefix must be non-empty");
    this.storage = storage;
    this.keyPrefix = keyPrefix;
    this._revisions = new Map();
    this._lastKey = null;
  }

  _readCurrentRecord(identity) {
    const normalizedIdentity = assertIdentity(identity);
    const key = storageKey(normalizedIdentity, this.keyPrefix);
    let serialized;
    try {
      serialized = this.storage.getItem(key);
    } catch (error) {
      throw new PlayerMetaPersistenceError("PlayerMetaState read failed", error);
    }

    if (serialized === null) {
      return {
        key,
        serialized: null,
        revision: 0,
        state: createInitialPlayerMetaState(normalizedIdentity)
      };
    }

    try {
      const parsed = parseRecord(serialized, normalizedIdentity);
      return { key, serialized, ...parsed };
    } catch (error) {
      if (error instanceof PlayerMetaPersistenceError) throw error;
      throw new PlayerMetaPersistenceError("Persisted PlayerMetaState is invalid or corrupted", error);
    }
  }

  save(state, { expectedRevision = null } = {}) {
    validatePlayerMetaState(state);

    const identity = assertIdentity(state.identity);
    const key = storageKey(identity, this.keyPrefix);
    const resolvedExpectedRevision = expectedRevision === null
      ? (this._revisions.get(key) ?? 0)
      : expectedRevision;
    assertRevision(resolvedExpectedRevision, "expectedRevision");

    const current = this._readCurrentRecord(identity);
    if (resolvedExpectedRevision !== current.revision) {
      this._revisions.set(current.key, current.revision);
      this._lastKey = current.key;
      throw new StalePlayerMetaWriteError(resolvedExpectedRevision, current.revision);
    }

    const nextRevision = current.revision + 1;
    const envelope = {
      schemaVersion: PLAYER_META_PERSISTENCE_SCHEMA_VERSION,
      revision: nextRevision,
      state: JSON.parse(serializePlayerMetaState(state))
    };
    const serialized = JSON.stringify(envelope);

    try {
      if (typeof this.storage.compareAndSet === "function") {
        const swapped = this.storage.compareAndSet(current.key, current.serialized, serialized);
        if (!swapped) {
          const latest = this._readCurrentRecord(identity);
          this._revisions.set(latest.key, latest.revision);
          this._lastKey = latest.key;
          throw new StalePlayerMetaWriteError(resolvedExpectedRevision, latest.revision);
        }
      } else {
        const verification = this._readCurrentRecord(identity);
        if (verification.revision !== expectedRevision) {
          this._revisions.set(verification.key, verification.revision);
          this._lastKey = verification.key;
          throw new StalePlayerMetaWriteError(resolvedExpectedRevision, verification.revision);
        }
        this.storage.setItem(current.key, serialized);
      }
    } catch (error) {
      if (error instanceof PlayerMetaPersistenceError) throw error;
      throw new PlayerMetaPersistenceError("PlayerMetaState persistence failed", error);
    }

    this._revisions.set(current.key, nextRevision);
    this._lastKey = current.key;
    return Object.freeze({
      ok: true,
      playerId: state.identity.playerId,
      schemaVersion: PLAYER_META_PERSISTENCE_SCHEMA_VERSION,
      revision: nextRevision
    });
  }

  load(identity) {
    const normalizedIdentity = assertIdentity(identity);
    const current = this._readCurrentRecord(normalizedIdentity);
    this._revisions.set(current.key, current.revision);
    this._lastKey = current.key;
    return current.state;
  }

  getRevision(identity = null) {
    if (identity !== null) {
      return this._revisions.get(storageKey(identity, this.keyPrefix)) ?? 0;
    }
    return this._lastKey ? (this._revisions.get(this._lastKey) ?? 0) : 0;
  }

  clear(identity) {
    const normalizedIdentity = assertIdentity(identity);
    const key = storageKey(normalizedIdentity, this.keyPrefix);
    try {
      this.storage.removeItem?.(key);
    } catch (error) {
      throw new PlayerMetaPersistenceError("PlayerMetaState clear failed", error);
    }
    const key = storageKey(normalizedIdentity, this.keyPrefix);
    this._revisions.set(key, 0);
    this._lastKey = key;
    return Object.freeze({ ok: true, playerId: normalizedIdentity.playerId });
  }

  keyFor(identity) {
    return storageKey(identity, this.keyPrefix);
  }
}

export function createPlayerMetaPersistenceAdapter(options = {}) {
  return new PlayerMetaPersistenceAdapter(options);
}

export function isStaleWriteError(error) {
  return error?.code === "STALE_WRITE";
}
