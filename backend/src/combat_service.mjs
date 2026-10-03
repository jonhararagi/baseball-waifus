import { resolveTacticalTurn, resolveClimaxTurn } from "../../webapp/js/combat_core.js";
import { AuthorityError } from "./errors.mjs";

const ACTIONS = new Set(["BAT"]);

function normalizeGrade(value) {
  const grade = String(value || "MISS").toUpperCase();
  if (!["GREAT", "HIT", "MISS"].includes(grade)) {
    throw new AuthorityError(400, "INVALID_TIMING_GRADE", "timing_grade must be GREAT, HIT or MISS");
  }
  return grade;
}

function normalizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AuthorityError(400, "INVALID_ACTION_BODY", "JSON action body is required");
  }
  for (const forbidden of ["outcome", "result", "damage", "victory", "defeat", "reward", "scrap", "boss_hp_after"]) {
    if (Object.prototype.hasOwnProperty.call(body, forbidden)) {
      throw new AuthorityError(400, "CLIENT_RESULT_FORBIDDEN", "Client result field is not accepted: " + forbidden);
    }
  }
  const action = String(body.action?.type || body.type || "").toUpperCase();
  if (!ACTIONS.has(action)) {
    throw new AuthorityError(400, "UNSUPPORTED_ACTION", "Only BAT is supported by the current authoritative combat boundary");
  }
  return Object.freeze({
    action,
    timingGrade: normalizeGrade(body.timing_grade),
    requestedTurnId: body.turn_id ? String(body.turn_id) : null
  });
}

function stateDTO(state) {
  return {
    match_id: state.matchId,
    turn_id: state.turnId,
    phase: state.phase,
    boss_hp: state.bossHp,
    boss_max_hp: state.bossMaxHp,
    internal_energy: state.internalEnergy,
    tactical_effectiveness: state.tacticalEffectiveness,
    player_stamina: state.playerStamina,
    player_stamina_max: state.playerStaminaMax,
    round: state.round,
    tactical_turn: state.tacticalTurn,
    completed: state.completed
  };
}

export class CombatService {
  constructor({ store, signer }) {
    this.store = store;
    this.signer = signer;
  }

  getOrCreateMatch(matchId, playerId) {
    const loaded = this.store.loadMatch(matchId);
    if (!loaded) return this.store.createMatch({ matchId, playerId });
    if (loaded.playerId !== playerId) {
      throw new AuthorityError(403, "MATCH_PLAYER_MISMATCH", "Match does not belong to authenticated player");
    }
    return loaded;
  }

  async init(matchId, playerId) {
    const state = this.getOrCreateMatch(matchId, playerId);
    return {
      type: "CombatInitDTO",
      match_id: state.matchId,
      state: stateDTO(state),
      home_team: { id: "basewarriors-home", name: "BASEWARRIORS" },
      away_team: { id: "basewarriors-rival", name: "RIVAL" },
      batter: { id: "player-batter-001", card_id: "bw001", faction: "cyber_tech" },
      pitcher: { id: "rival-pitcher-001", card_id: "bw002", faction: "tactical_milspec" },
      reward_authority: {
        version: "SERVER_COMBAT_ATTESTATION_V1",
        nonce: state.nonce,
        public_key_jwk: this.signer?.publicKeyJwk || null
      }
    };
  }

  async applyTurn({ matchId, playerId, body }) {
    if (body?.match_id !== undefined && String(body.match_id) !== String(matchId)) {
      throw new AuthorityError(400, "MATCH_ID_MISMATCH", "Client match_id does not match the request path");
    }

    const input = normalizeBody(body);
    const state = this.getOrCreateMatch(matchId, playerId);
    if (state.completed) throw new AuthorityError(409, "MATCH_COMPLETED", "Match is already completed");
    if (input.requestedTurnId && input.requestedTurnId !== state.turnId) {
      throw new AuthorityError(409, "TURN_OUT_OF_SEQUENCE", "turn_id does not match the server expected turn");
    }

    const processedTurnId = state.turnId;
    let coreResult;
    let responseOutcome;

    if (state.phase === "TACTICAL") {
      coreResult = resolveTacticalTurn({
        turn: state.tacticalTurn,
        bossHp: state.bossHp,
        bossMaxHp: state.bossMaxHp,
        internalEnergy: state.internalEnergy,
        tacticalEffectiveness: state.tacticalEffectiveness
      });
      responseOutcome = coreResult.outcome;
      state.bossHp = coreResult.boss_hp_after;
      state.internalEnergy = coreResult.energy_after;
      state.tacticalEffectiveness = coreResult.effectiveness_after;
      state.phase = coreResult.phase === "CLIMAX" ? "CLIMAX" : "TACTICAL";
      state.tacticalTurn = coreResult.phase === "CLIMAX" ? 5 : coreResult.tactical_turn_after;
    } else if (state.phase === "CLIMAX") {
      coreResult = resolveClimaxTurn({
        grade: input.timingGrade,
        bossHp: state.bossHp,
        bossMaxHp: state.bossMaxHp,
        internalEnergy: state.internalEnergy,
        tacticalEffectiveness: state.tacticalEffectiveness,
        round: state.round,
        playerStamina: state.playerStamina,
        playerStaminaMax: state.playerStaminaMax
      });
      responseOutcome = coreResult.victory
        ? "VICTORY"
        : coreResult.defeat
          ? "DEFEAT"
          : coreResult.outcome;

      state.bossHp = coreResult.boss_hp_after;
      state.playerStamina = coreResult.player_stamina_after;
      state.internalEnergy = coreResult.energy_after;
      state.tacticalEffectiveness = coreResult.effectiveness_after;

      if (coreResult.match_end) {
        state.phase = coreResult.phase;
        state.completed = true;
      } else {
        state.phase = "TACTICAL";
        state.round = coreResult.round_after;
        state.tacticalTurn = 1;
      }
    } else {
      throw new AuthorityError(409, "INVALID_MATCH_PHASE", "Match is not actionable");
    }

    let rewardAttestation = null;
    if (coreResult.victory) {
      if (!this.signer) {
        throw new AuthorityError(503, "REWARD_SIGNER_NOT_CONFIGURED", "Terminal reward authority is not configured");
      }
      const rewardId = "battle:" + state.matchId;
      if (!this.store.hasRewardAuthorized(rewardId)) {
        rewardAttestation = this.signer.signAttestation({
          matchId: state.matchId,
          playerId: state.playerId,
          turnId: processedTurnId,
          outcome: "VICTORY",
          result: coreResult.result || "VICTORY",
          nonce: state.nonce
        });
        this.store.markRewardAuthorized(rewardId);
      }
    }

    state.turnNumber += 1;
    state.turnId = "turn-" + String(state.turnNumber).padStart(3, "0");
    const saved = this.store.saveMatch(state);

    return {
      type: "TurnResultDTO",
      match_id: saved.matchId,
      turn_id: processedTurnId,
      result: coreResult.result || coreResult.outcome,
      outcome: responseOutcome,
      phase: coreResult.phase,
      damage: coreResult.damage,
      victory: Boolean(coreResult.victory),
      defeat: Boolean(coreResult.defeat),
      match_end: Boolean(coreResult.match_end),
      state: stateDTO(saved),
      reward_attestation: rewardAttestation
    };
  }
}
