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

The current runtime integration is connected at the terminal combat-result boundary in `webapp/js/app.js`.

- Server/embedded combat: a terminal `TurnResultDTO` with explicit `VICTORY` or `DEFEAT` is converted to `COMBAT_RESULT`.
- Local playable combat: `CombatRenderer` exposes the real terminal result from its existing climax resolver through `onLocalCombatResult`, without changing combat formulas.

Both paths use the same `reward_pipeline.js`. The runtime does not manufacture a fake battle result as a substitute for combat.

## BONE-004 authoritative reward boundary

La autoridad económica queda separada del resultado local:

~~~
LOCAL COMBAT
→ DEMO / QA ONLY
→ NO REAL ECONOMY GRANT

SERVER COMBAT
→ SERVER_COMBAT_ATTESTATION_V1
→ REWARD AUTHORITY VALIDATION
→ COMBAT_RESULT AUTHORITATIVE
→ REWARD PIPELINE
→ PLAYER META
~~~

El cliente valida una atestación ECDSA P-256/SHA-256 sobre un payload canónico vinculado a match_id, player_id, turn_id, outcome, result y nonce. Una prueba ausente o inválida no alcanza resolveStandardBattleRewards() ni PlayerMetaAuthority.

El resultado local sigue siendo válido para demo/QA, pero no constituye autoridad económica comercial.

El repositorio todavía no contiene un backend productivo que emita estas atestaciones. La implementación actual establece y verifica la frontera de autoridad del cliente, no un servidor de economía.

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

A newly applied reward produces a `REWARD_GRANTED` domain event and a descriptive `UI` presentation command. Duplicate applications are successful no-ops and deliberately emit no new `REWARD_GRANTED` presentation event. The command contains reward data for display only.

Presentation cannot modify currencies, inventory, combat state or reward identity.

## Legacy economy

The historical per-turn `CombatRenderer.onScrapEarned` callback remains as a compatibility surface, but T062 removes its direct Player Meta credit path. It reports legacy turn-reward data only and cannot grant currency. Final battle rewards are granted only through the new Player Meta reward pipeline.

The legacy `SaveSystem` remains active and is not migrated in T062.

## Status vocabulary

- **IMPLEMENTED:** executable T062 reward path and tests.
- **PROPOSAL:** T062 reward amounts/balance.
- **LEGACY:** historical SaveSystem and per-turn reward callback.
- **FUTURE:** progression, collection UX, equipment, events and broader economy balancing.
- **UNKNOWN:** server-side authority requirements for production persistence.

## Explicit non-goals

T062 does not implement progression, levels, XP, equipment, crafting, new currencies, Gacha changes, Student 4v4 expansion, Kytos combat changes, or a new persistence authority.
