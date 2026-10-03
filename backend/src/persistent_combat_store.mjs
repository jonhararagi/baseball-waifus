import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const PERSISTENCE_SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stableId(value, label = "id") {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id) || id.length > 256) {
    throw new TypeError(`${label} must be a stable identifier`);
  }
  return id;
}

function nextTurnId(turnNumber) {
  return "turn-" + String(turnNumber).padStart(3, "0");
}

function nonNegativeFinite(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a non-negative finite number`);
}

function nonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
}

function validateMatchState(state) {
  if (!isObject(state)) throw new TypeError("Invalid combat state");
  const matchId = stableId(state.matchId, "matchId");
  const playerId = stableId(state.playerId, "playerId");
  if (state.matchId !== matchId || state.playerId !== playerId) throw new TypeError("Invalid combat identity");
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) throw new TypeError("Invalid revision");
  if (typeof state.turnId !== "string" || !/^turn-\d+$/.test(state.turnId)) throw new TypeError("Invalid turnId");
  nonNegativeInteger(state.turnNumber, "turnNumber");
  if (state.turnNumber < 1) throw new TypeError("turnNumber must start at 1");
  if (!["TACTICAL", "CLIMAX", "VICTORY", "DEFEAT"].includes(state.phase)) throw new TypeError("Invalid combat phase");
  for (const [key, value] of [
    ["bossHp", state.bossHp],
    ["bossMaxHp", state.bossMaxHp],
    ["internalEnergy", state.internalEnergy],
    ["tacticalEffectiveness", state.tacticalEffectiveness],
    ["playerStamina", state.playerStamina],
    ["playerStaminaMax", state.playerStaminaMax]
  ]) nonNegativeFinite(value, key);
  if (state.bossHp > state.bossMaxHp) throw new TypeError("bossHp cannot exceed bossMaxHp");
  if (state.playerStamina > state.playerStaminaMax) throw new TypeError("playerStamina cannot exceed playerStaminaMax");
  nonNegativeInteger(state.round, "round");
  if (state.round < 1) throw new TypeError("round must start at 1");
  nonNegativeInteger(state.tacticalTurn, "tacticalTurn");
  if (state.tacticalTurn < 1 || state.tacticalTurn > 5) throw new TypeError("tacticalTurn must be between 1 and 5");
  if (typeof state.nonce !== "string" || state.nonce.length < 16 || state.nonce.length > 256) throw new TypeError("Invalid match nonce");
  if (typeof state.completed !== "boolean") throw new TypeError("completed must be boolean");
  return true;
}

function emptyDocument() {
  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    matches: {},
    rewardLedger: {}
  };
}

function validateDocument(document) {
  if (!isObject(document)) throw new TypeError("Persistent combat document must be an object");
  if (document.schemaVersion !== PERSISTENCE_SCHEMA_VERSION) {
    throw new TypeError("Unsupported persistence schemaVersion");
  }
  if (!isObject(document.matches)) throw new TypeError("Invalid matches collection");
  if (!isObject(document.rewardLedger)) throw new TypeError("Invalid reward ledger");
  for (const [matchId, state] of Object.entries(document.matches)) {
    const normalizedMatchId = stableId(matchId, "matchId");
    if (normalizedMatchId !== matchId) throw new TypeError("Invalid persisted match key");
    const normalizedState = {
      ...state,
      revision: state.revision === undefined ? 0 : state.revision
    };
    validateMatchState(normalizedState);
    if (normalizedState.matchId !== matchId) throw new TypeError("Persisted match identity mismatch");
    document.matches[matchId] = normalizedState;
  }
  for (const [rewardId, applied] of Object.entries(document.rewardLedger)) {
    stableId(rewardId, "rewardId");
    if (applied !== true) throw new TypeError("Reward ledger entries must be true");
  }
  return true;
}

export class PersistentCombatStoreError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = "PersistentCombatStoreError";
    this.cause = cause;
  }
}

export class PersistentCombatStore {
  constructor({ filePath, nonceFactory = randomUUID } = {}) {
    if (typeof filePath !== "string" || filePath.trim() === "") {
      throw new TypeError("PersistentCombatStore requires a filePath");
    }
    this.filePath = path.resolve(filePath);
    this.nonceFactory = nonceFactory;
    this.isDurable = true;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  _readDocument() {
    let raw;
    try {
      raw = fs.readFileSync(this.filePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return emptyDocument();
      throw new PersistentCombatStoreError("Unable to read persistent combat state", error);
    }

    if (raw.length === 0) {
      throw new PersistentCombatStoreError("Persistent combat state is empty");
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new PersistentCombatStoreError("Persistent combat state is corrupted", error);
    }

    try {
      validateDocument(parsed);
    } catch (error) {
      throw new PersistentCombatStoreError("Persistent combat state failed validation", error);
    }
    return parsed;
  }

  _writeDocument(document) {
    try {
      validateDocument(document);
    } catch (error) {
      throw new PersistentCombatStoreError("Refusing to persist invalid combat state", error);
    }

    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    let descriptor = null;
    try {
      const serialized = JSON.stringify(document);
      descriptor = fs.openSync(temporaryPath, "wx", 0o600);
      fs.writeFileSync(descriptor, serialized, "utf8");
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = null;
      fs.renameSync(temporaryPath, this.filePath);
      try {
        const directoryDescriptor = fs.openSync(directory, "r");
        try { fs.fsyncSync(directoryDescriptor); } finally { fs.closeSync(directoryDescriptor); }
      } catch {
        // Directory fsync is platform-dependent; file fsync + atomic rename remain mandatory.
      }
    } catch (error) {
      if (descriptor !== null) {
        try { fs.closeSync(descriptor); } catch {}
      }
      try { fs.rmSync(temporaryPath, { force: true }); } catch {}
      throw new PersistentCombatStoreError("Atomic persistence write failed", error);
    }
  }

  createMatch({ matchId, playerId }) {
    const id = stableId(matchId, "matchId");
    const owner = stableId(playerId, "playerId");
    const document = this._readDocument();
    if (document.matches[id]) return clone(document.matches[id]);

    const state = {
      matchId: id,
      playerId: owner,
      revision: 0,
      turnId: nextTurnId(1),
      turnNumber: 1,
      phase: "TACTICAL",
      bossHp: 100,
      bossMaxHp: 100,
      internalEnergy: 0,
      tacticalEffectiveness: 0,
      playerStamina: 100,
      playerStaminaMax: 100,
      round: 1,
      tacticalTurn: 1,
      nonce: String(this.nonceFactory()),
      completed: false
    };

    validateMatchState(state);
    document.matches[id] = clone(state);
    this._writeDocument(document);
    return clone(state);
  }

  loadMatch(matchId) {
    const id = stableId(matchId, "matchId");
    const document = this._readDocument();
    const state = document.matches[id];
    return state ? clone(state) : null;
  }

  saveMatch(state, { rewardId = null, expectedRevision = null } = {}) {
    const id = stableId(state?.matchId, "matchId");
    validateMatchState({
      ...state,
      revision: state?.revision === undefined ? 0 : state.revision
    });
    if (state.matchId !== id) throw new TypeError("Invalid combat state identity");
    if (rewardId !== null) stableId(rewardId, "rewardId");

    const document = this._readDocument();
    const current = document.matches[id];
    if (!current) throw new PersistentCombatStoreError("Combat match does not exist");
    const currentRevision = Number.isSafeInteger(current.revision) ? current.revision : 0;
    const expected = expectedRevision === null
      ? (Number.isSafeInteger(state.revision) ? state.revision : currentRevision)
      : expectedRevision;
    if (!Number.isSafeInteger(expected) || expected < 0) {
      throw new PersistentCombatStoreError("Invalid expected revision");
    }
    if (expected !== currentRevision) {
      const error = new PersistentCombatStoreError(
        `STALE_WRITE: expected revision ${expected}, current revision ${currentRevision}`
      );
      error.code = "STALE_WRITE";
      error.currentRevision = currentRevision;
      throw error;
    }

    const next = clone(state);
    next.revision = currentRevision + 1;
    validateMatchState(next);
    document.matches[id] = next;
    if (rewardId !== null) document.rewardLedger[rewardId] = true;
    this._writeDocument(document);
    return clone(next);
  }

  markRewardAuthorized(rewardId) {
    const id = stableId(rewardId, "rewardId");
    const document = this._readDocument();
    if (document.rewardLedger[id] === true) return false;
    document.rewardLedger[id] = true;
    this._writeDocument(document);
    return true;
  }

  hasRewardAuthorized(rewardId) {
    const id = stableId(rewardId, "rewardId");
    return this._readDocument().rewardLedger[id] === true;
  }
}
