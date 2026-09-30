# Reward System

**T062 status:** IMPLEMENTED / T062 BASELINE PROPOSAL

## Authority flow

The first integrated reward path is:

```text
REAL COMBAT COMPLETION
        ↓
COMBAT_RESULT
        ↓
DOMAIN EVENT
        ↓
RewardResolver
        ↓
REWARD_RESULT
        ↓
PlayerMetaRewardAdapter
        ↓
PlayerMetaAuthority
        ↓
PlayerMetaState
        ↓
PlayerMetaPersistenceAdapter
        ↓
REWARD_GRANTED / PRESENTATION COMMAND
```

Gameplay remains responsible for deciding the combat outcome. Reward resolution does not write state and presentation does not grant rewards.

## Real integration

The current runtime integration is connected at the authoritative combat-action completion path in `webapp/js/app.js`. When a real `TurnResultDTO` closes a match through `VICTORY`, `match_end`, or `state.match_complete`, the payload is converted to a `COMBAT_RESULT` and sent through `reward_pipeline.js`.

The integration does not use a fake battle result in runtime.

## T062 baseline reward table

| Outcome | Reward |
|---|---|
| VICTORY | +100 SCRAP |
| DEFEAT | no reward |

Status: **PROPOSAL / T062 BASELINE**. This is not final economy balance.

The table intentionally does not define XP, levels, equipment, crafting, event currency, PvP rewards, daily rewards or other future systems.

## Reward identity and duplicate protection

The reward application identity is derived from the stable combat identity:

`battle:<matchId>`

The Player Meta state contains a persistent `rewardLedger`. Before applying a reward, `PlayerMetaRewardAdapter` checks the ledger. An already recorded battle returns a successful duplicate/no-op result instead of crediting the reward again.

The ledger is persisted together with Player Meta, so reload/restart does not reset duplicate protection.

UI button state is not part of the protection boundary.

## Atomicity

Reward actions are applied through `PlayerMetaAuthority`. The adapter captures the previous immutable snapshot, applies all reward actions, records the reward identity, then persists the resulting snapshot once.

If any action or persistence operation fails, the authority is restored to the previous snapshot. No reward is reported as successfully applied.

This is an in-memory transaction plus one Player Meta persistence commit. It does not introduce a second transaction store.

## Presentation

A successful or duplicate application produces a `REWARD_GRANTED` domain event and a descriptive `UI` presentation command. The command contains reward data for display only.

Presentation cannot modify currencies, inventory, combat state or reward identity.

## Legacy economy

The historical per-turn `CombatRenderer.onScrapEarned` callback remains as a compatibility surface, but T062 removes its direct Player Meta credit path. It now reports the legacy turn-reward state without adding currency. Final battle rewards are granted only through the new Player Meta reward pipeline.

The legacy `SaveSystem` remains active and is not migrated in T062.

## Status vocabulary

- **IMPLEMENTED:** executable T062 reward path and tests.
- **PROPOSAL:** T062 reward amounts/balance.
- **LEGACY:** historical SaveSystem and per-turn reward callback.
- **FUTURE:** progression, collection UX, equipment, events and broader economy balancing.
- **UNKNOWN:** server-side authority requirements for production persistence.

## Explicit non-goals

T062 does not implement progression, levels, XP, equipment, crafting, new currencies, Gacha changes, Student 4v4 expansion, Kytos combat changes, or a new persistence authority.
