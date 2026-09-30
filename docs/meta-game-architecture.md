# Meta Game Architecture Foundation

**T062 status:** REWARD PIPELINE IMPLEMENTED / T062 BASELINE PROPOSAL  
**Scope:** authority boundaries, reward flow, progression boundary, collection/roster ownership, persistence boundary.

## Architecture boundary

The intended authoritative flow is:

```text
PLAYER ACTION
      ↓
GAMEPLAY SYSTEM
      ↓
RESULT
      ↓
EVENT
      ↓
REWARD RESOLUTION
      ↓
PLAYER META AUTHORITY
      ↓
PLAYER META STATE
      ↓
PERSISTENCE
      ↓
UI / COLLECTION / PROGRESSION
```

A gameplay system produces a result. A reward resolver calculates explicit rewards without owning player state. A Player Meta adapter applies those rewards through `PlayerMetaAuthority`. Persistence remains an adapter concern.

## Confirmed / implemented

### Player Meta

`webapp/js/player_meta_state.js` is the current Player Meta authority contract.

`PlayerMetaAuthority` owns immutable snapshots for:

- character ownership;
- SCRAP and FRAGMENTS;
- Gacha pity state;
- unlock flags;
- active batter and two support slots.

Mutations occur through `dispatch()`. Reward application may use the atomic `dispatchBatch()` boundary. Callers receive frozen snapshots.

### Persistence

`webapp/js/player_meta_persistence_adapter.js` is the explicit Player Meta persistence adapter.

The historical `SaveSystem` remains active and is NOT replaced by T061. Its existing migration/versioning surface still contains economy, inventory, progression, Gacha and roster data.

A future migration from SaveSystem to Player Meta persistence requires an explicit authority/migration task. T061 does not perform that migration.

### Roster

`webapp/js/player_meta_roster_integration.js` routes roster ownership/selection through Player Meta. `TeamManager` remains a consumer/integration layer rather than a second ownership authority.

### Gacha

The active Gacha runtime remains `gacha_controller.js` / `gacha_controller_runtime.js` with Player Meta integration already established by previous work. T061 does not alter rates, pity, banners or Gacha formulas.

Gacha may determine an acquisition, but Player Meta is the ownership boundary.

### Reward pipeline

T062 turns the reward foundation into a real integrated path:

- `reward_resolver.js`: pure deterministic reward resolution and the explicit T062 baseline table;
- `player_meta_reward_adapter.js`: atomic application through Player Meta plus durable reward identity recording;
- `reward_pipeline.js`: COMBAT_RESULT → REWARD_RESULT → Player Meta → REWARD_GRANTED presentation boundary;
- `reward_pipeline_test.mjs`: persistence, duplicate, atomicity and combat-result integration coverage.

The resolver owns no inventory, currencies, roster, pity or persistence. The T062 baseline is +100 SCRAP on explicit VICTORY and no reward on explicit DEFEAT. The balance is a proposal, not final economy balance.

### Progression

Progression is deliberately a boundary, not a completed system:

```text
REWARD
  ↓
PROGRESSION INPUT
  ↓
PLAYER META
```

No XP formula, level curve, progression table or new progression authority is introduced by T061.

### Collection

Collection ownership is derived from `PlayerMetaState.inventory.characters`. Future collection UI may derive views such as OWNED, LOCKED, DUPLICATE and UPGRADEABLE, but must not create another ownership store.

## Authority matrix

| Domain | Current authority | Status |
|---|---|---|
| Player Meta | `PlayerMetaAuthority` | IMPLEMENTED |
| Character ownership | Player Meta inventory | IMPLEMENTED |
| Currencies | Player Meta currencies | IMPLEMENTED |
| Gacha pity/acquisition integration | Gacha runtime + Player Meta integration | IMPLEMENTED |
| Roster selection/ownership view | Player Meta + roster integration | IMPLEMENTED |
| Legacy persistence | `SaveSystem` | LEGACY / ACTIVE |
| Player Meta persistence | `PlayerMetaPersistenceAdapter` | IMPLEMENTED |
| Reward calculation | `RewardResolver` + T062 reward table | IMPLEMENTED / PROPOSAL BALANCE |
| Progression | no dedicated authority | FUTURE / PROPOSAL |
| Combat result | existing combat systems | IMPLEMENTED |
| Presentation | existing renderer/HUD/effects + presentation contracts | PARTIAL / MIXED |

## Event boundary

T061 uses immutable domain events as a transport boundary. Events carry already-decided data. They do not execute gameplay mutations.

`presentation_event_contract.js` also defines presentation commands for sprites, camera, FX, audio, UI, parallax, cut-ins, hit-stop and haptics. These are descriptive commands, not gameplay operations.

## Contradictions / deferred work

### RESOLVED

- New reward code does not write directly into inventory/currency state.
- Reward application is routed through PlayerMetaAuthority actions.
- Presentation commands are immutable data and do not receive gameplay authority.

### DOCUMENTED / DEFERRED

- SaveSystem still stores a broad legacy state that overlaps Player Meta. No silent migration is performed.
- Some existing combat/presentation code remains mixed. T061 establishes the boundary without a mass renderer refactor.
- The historical per-turn combat reward callback remains as a compatibility surface but no longer credits Player Meta. The integrated terminal battle route uses only the T062 RewardResolver → PlayerMeta path.

### OPEN / UNKNOWN

- Final reward balance tables.
- Final progression model.
- Backend/server authority requirements.
- Final collection UI.
- Final migration plan for historical SaveSystem data.
- Whether all future meta events require durable event IDs beyond the current explicit contract.
- Server-side reward authority and reconciliation remain UNKNOWN for production backend deployment.

## Out of scope

No shop overhaul, economy rebalance, Gacha rebalance, equipment, quests, PvP, Student 4v4 expansion, Kytos changes, narrative changes, or final progression tree are part of T062.
