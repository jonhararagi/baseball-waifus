import { randomUUID } from "node:crypto";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableMatchId(value) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) throw new TypeError("matchId must be a stable identifier");
  return id;
}

function nextTurnId(turnNumber) {
  return "turn-" + String(turnNumber).padStart(3, "0");
}

export class InMemoryCombatStore {
  constructor({ nonceFactory = randomUUID } = {}) {
    this.matches = new Map();
    this.rewardLedger = new Set();
    this.nonceFactory = nonceFactory;
    this.isDurable = false;
  }

  createMatch({ matchId, playerId }) {
    const id = stableMatchId(matchId);
    if (this.matches.has(id)) return clone(this.matches.get(id));
    const state = {
      matchId: id,
      playerId: String(playerId),
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
    this.matches.set(id, clone(state));
    return clone(state);
  }

  loadMatch(matchId) {
    const state = this.matches.get(stableMatchId(matchId));
    return state ? clone(state) : null;
  }

  saveMatch(state, { rewardId = null } = {}) {
    const id = stableMatchId(state?.matchId);
    if (!state || state.matchId !== id) throw new TypeError("Invalid combat state");
    this.matches.set(id, clone(state));
    if (rewardId !== null) this.rewardLedger.add(String(rewardId));
    return clone(state);
  }

  markRewardAuthorized(rewardId) {
    const id = String(rewardId);
    if (this.rewardLedger.has(id)) return false;
    this.rewardLedger.add(id);
    return true;
  }

  hasRewardAuthorized(rewardId) {
    return this.rewardLedger.has(String(rewardId));
  }
}

export { nextTurnId };
