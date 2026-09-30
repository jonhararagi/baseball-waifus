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

function storageKey(identity, keyPrefix) {
  const normalized = assertIdentity(identity);
  return `${keyPrefix}${encodeURIComponent(normalized.playerId)}`;
}

export class PlayerMetaPersistenceError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = "PlayerMetaPersistenceError";
    this.cause = cause;
  }
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
  }

  save(state) {
    validatePlayerMetaState(state);
    const serialized = serializePlayerMetaState(state);
    const key = storageKey(state.identity, this.keyPrefix);
    try {
      this.storage.setItem(key, serialized);
    } catch (error) {
      throw new PlayerMetaPersistenceError("PlayerMetaState persistence failed", error);
    }
    return Object.freeze({
      ok: true,
      playerId: state.identity.playerId,
      schemaVersion: PLAYER_META_PERSISTENCE_SCHEMA_VERSION
    });
  }

  load(identity) {
    const normalizedIdentity = assertIdentity(identity);
    const key = storageKey(normalizedIdentity, this.keyPrefix);
    let serialized;
    try {
      serialized = this.storage.getItem(key);
    } catch (error) {
      throw new PlayerMetaPersistenceError("PlayerMetaState read failed", error);
    }

    if (serialized === null) return createInitialPlayerMetaState(normalizedIdentity);

    try {
      const state = deserializePlayerMetaState(serialized);
      if (state.identity.playerId !== normalizedIdentity.playerId) {
        throw new TypeError("Persisted PlayerMetaState identity mismatch");
      }
      validatePlayerMetaState(state);
      return state;
    } catch (error) {
      throw new PlayerMetaPersistenceError("Persisted PlayerMetaState is invalid or corrupted", error);
    }
  }

  clear(identity) {
    const normalizedIdentity = assertIdentity(identity);
    const key = storageKey(normalizedIdentity, this.keyPrefix);
    try {
      this.storage.removeItem?.(key);
    } catch (error) {
      throw new PlayerMetaPersistenceError("PlayerMetaState clear failed", error);
    }
    return Object.freeze({ ok: true, playerId: normalizedIdentity.playerId });
  }

  keyFor(identity) {
    return storageKey(identity, this.keyPrefix);
  }
}

export function createPlayerMetaPersistenceAdapter(options = {}) {
  return new PlayerMetaPersistenceAdapter(options);
}
