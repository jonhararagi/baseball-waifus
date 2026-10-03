import { createDomainEvent, createPresentationCommand } from "./presentation_event_contract.js";
import { resolveStandardBattleRewards } from "./reward_resolver.js";
import { applyRewardResultToPlayerMeta } from "./player_meta_reward_adapter.js";
import { assertRewardAuthorityMatchesCombatResult } from "./reward_authority.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertStableId(value, label) {
  const normalized = String(value || "");
  if (!/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    throw new TypeError(label + " must be a stable identifier");
  }
  return normalized;
}

export function createCombatResultFromTurnResult({
  turnResult,
  matchId,
  playerId = null
} = {}) {
  if (!turnResult || typeof turnResult !== "object") {
    throw new TypeError("TurnResultDTO is required");
  }
  const normalizedMatchId = assertStableId(matchId, "matchId");
  const turnId = assertStableId(turnResult.turn_id, "turnId");
  const explicitResult = String(turnResult.result || "").toUpperCase();
  const candidateOutcomes = [
    turnResult.outcome,
    turnResult.state?.outcome
  ].map((value) => String(value || "").toUpperCase());
  const explicitOutcome = candidateOutcomes.find((value) => ["VICTORY", "DEFEAT"].includes(value)) || "";
  const outcome = explicitOutcome || (
    explicitResult === "VICTORY"
      ? "VICTORY"
      : explicitResult === "DEFEAT"
        ? "DEFEAT"
        : ""
  );

  if (!["VICTORY", "DEFEAT"].includes(outcome)) {
    throw new TypeError("Turn result does not contain a terminal combat outcome");
  }

  return Object.freeze({
    type: "COMBAT_RESULT",
    battleId: "battle:" + normalizedMatchId,
    playerId: playerId ? String(playerId) : null,
    matchId: normalizedMatchId,
    turnId,
    outcome,
    result: String(turnResult.result || outcome),
    damage: Number.isFinite(Number(turnResult.damage)) ? Number(turnResult.damage) : null,
    source: "combat-runtime"
  });
}

export function applyCombatRewardPipeline({
  combatResult,
  authority,
  persistenceAdapter,
  authorityProof,
  sequence = 0
} = {}) {
  if (!combatResult || combatResult.type !== "COMBAT_RESULT") {
    throw new TypeError("COMBAT_RESULT is required");
  }

  assertRewardAuthorityMatchesCombatResult(authorityProof, combatResult);

  const eventId = assertStableId(combatResult.battleId, "battleId");
  const combatEvent = createDomainEvent({
    type: "COMBAT_RESULT",
    eventId: eventId + ":result",
    source: combatResult.source || "combat-runtime",
    sequence,
    payload: combatResult
  });

  const rewardResult = resolveStandardBattleRewards({
    battleResult: combatResult,
    sourceEventId: eventId
  });

  const applied = applyRewardResultToPlayerMeta({
    authority,
    rewardResult,
    persistenceAdapter
  });

  const rewardEvent = applied.duplicate
    ? null
    : createDomainEvent({
      type: "REWARD_GRANTED",
      eventId: eventId + ":reward",
      source: "reward-pipeline",
      sequence: sequence + 1,
      payload: {
        combatEventId: combatEvent.eventId,
        rewardResult
      }
    });

  const presentation = rewardEvent
    ? createPresentationCommand({
      type: "UI",
      eventId: rewardEvent.eventId,
      target: "reward-status",
      payload: {
        kind: "REWARD_GRANTED",
        outcome: combatResult.outcome,
        rewards: clone(applied.appliedRewards),
        message: "BATTLE REWARD"
      },
      durationMs: 1600
    })
    : null;

  return Object.freeze({
    combatEvent,
    rewardResult,
    applied,
    rewardEvent,
    presentation
  });
}

export const REWARD_PIPELINE_STATUS = Object.freeze({
  status: "WORKING IMPLEMENTATION",
  balance: "T062 BASELINE / PROPOSAL",
  authority: "SERVER_COMBAT_ATTESTATION_V1",
  presentation: "PRESENTATION_CONTRACT"
});
