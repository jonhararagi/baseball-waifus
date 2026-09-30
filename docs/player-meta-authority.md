# Player Meta Authority

> T056 · PLAYER META AUTHORITY CONTRACT
>
> Status: WORKING IMPLEMENTATION / DESIGN PROPOSAL

## Purpose

T056 establishes one client-side contract for durable player/meta data without migrating every existing consumer. The authority is `PlayerMetaAuthority`; callers submit explicit meta actions and receive an immutable snapshot/result. Existing SaveSystem, Gacha, Economy and Telegram layers remain outside this module until later integration tasks.

## State contract

`PlayerMetaState` currently contains only data already represented by the repository's existing save/gacha/roster foundations:

```text
schemaVersion
identity
inventory.characters[id] -> { quantity, unlocked }
currencies -> SCRAP, FRAGMENTS
gacha -> pullsSinceUR
unlocks -> boolean flags
roster -> activeBatter, supports[2]
```

The contract deliberately does not add Stars, new currencies, new progression flags, rates, prices, characters or rewards. The existing SaveSystem stores economy, inventory, progression, gacha and roster state, while the active GachaController remains the runtime gacha implementation.

## Identity

Identity is an adapter-level value, not an authentication system. `resolvePlayerIdentity()` prefers an existing Telegram user id when supplied and otherwise uses an explicit stable local id, defaulting to `local-player`. No backend account or authentication flow is introduced.

Telegram is therefore a source of identity information only. It is not the authority for meta mutations.

## Authority boundary

```text
PLAYER / SYSTEM ACTION
        ↓
META ACTION
        ↓
PlayerMetaAuthority.dispatch()
        ↓
VALIDATION
        ↓
NEW PLAYER_META_STATE
        ↓
IMMUTABLE SNAPSHOT
        ↓
PERSISTENCE ADAPTER (future)
```

Consumers should read snapshots. They should not mutate fields directly.

## Actions

Implemented action vocabulary:

- `ADD_CHARACTER`
- `REMOVE_CHARACTER`
- `ADD_CURRENCY`
- `SPEND_CURRENCY`
- `SET_UNLOCK`
- `UPDATE_GACHA_STATE`
- `SET_ROSTER`

Invalid actions return a rejected deterministic result and leave the authority unchanged.

## Gacha boundary

`pullsSinceUR` is represented as persisted meta state because the existing save/gacha layers already persist it. T056 does not alter canonical rates, soft pity, hard pity or banner behavior. The repository's active runtime authority remains `gacha_controller.js`; legacy `gacha_engine.js` is not imported by this contract. The existing controller does import `duplicateReward` from that legacy module, which remains a separate cleanup task.

## Persistence boundary

T056 does not replace SaveSystem or implement CloudStorage/backend persistence. Serialization is a pure boundary:

```text
PlayerMetaState
    ↓
serializePlayerMetaState()
    ↓
string / persistence adapter
    ↓
deserializePlayerMetaState()
    ↓
validated immutable PlayerMetaState
```

SaveSystem remains the existing save migration/versioning mechanism.

## Authority matrix

| Data | Authority | Readers | Writers in T056 |
|---|---|---|---|
| Character ownership | PlayerMetaAuthority contract | future UI/team/gacha consumers | `ADD_CHARACTER`, `REMOVE_CHARACTER` |
| Currency: SCRAP | PlayerMetaAuthority contract | future UI/shop/economy consumers | `ADD_CURRENCY`, `SPEND_CURRENCY` |
| Currency: FRAGMENTS | PlayerMetaAuthority contract | future UI/gacha consumers | `ADD_CURRENCY`, `SPEND_CURRENCY` |
| Gacha pity | PlayerMetaAuthority contract | Gacha/read models | `UPDATE_GACHA_STATE` |
| Unlock flags | PlayerMetaAuthority contract | future UI/narrative consumers | `SET_UNLOCK` |
| Active roster | PlayerMetaAuthority contract | future team/UI consumers | `SET_ROSTER` |
| Telegram identity | Identity adapter input | authority/read models | identity construction only |

The table intentionally does not claim consumers that were not established by repository inspection. The project state map confirms SaveSystem, roster/inventory, GachaController, Economy and API/Telegram foundations as existing layers.

## Immutability

Snapshots and action results are deeply frozen. A caller receives data for reading, not an editable authority object. A valid mutation is performed only through `dispatch()`.

## Versioning

`schemaVersion` is currently `1`. Validation rejects unsupported versions. No migration table is added because no historical PlayerMetaState schema exists yet. Existing SaveSystem migration remains independent until a future integration task establishes an explicit mapping.

## Out of scope

T056 does not implement persistence migration, backend authority, authentication, payments, shop/gacha rewrites, progression, PvP, Student 4v4 changes, Kytos changes, narrative changes or economy balancing. Student 4v4 and Kytos remain closed foundations; the project state map identifies player/meta authority as the next architectural boundary.
