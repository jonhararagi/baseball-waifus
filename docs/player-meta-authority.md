# Player Meta Authority

> T056 · PLAYER META AUTHORITY CONTRACT
>
> Status: WORKING IMPLEMENTATION / DESIGN PROPOSAL

## Purpose

T056 establishes one client-side contract for durable player/meta data without migrating every existing consumer. The authority is `PlayerMetaAuthority`; callers submit explicit meta actions and receive an immutable snapshot/result. T057 adds a controlled persistence boundary without replacing the existing `SaveSystem`.

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
Persistence Adapter
        ↓
existing compatible storage boundary
```

Consumers should read snapshots. They should not mutate fields directly. The persistence adapter never dispatches gameplay/meta actions and never becomes a second authority.

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

`pullsSinceUR` is represented as persisted meta state because the existing save/gacha layers already persist it. T056/T057 do not alter canonical rates, soft pity, hard pity or banner behavior. The repository's active runtime authority remains `gacha_controller.js`; legacy `gacha_engine.js` is not imported by this contract. The existing controller does import `duplicateReward` from that legacy module, which remains a separate cleanup task.

## Persistence boundary

T057 implements `PlayerMetaPersistenceAdapter` in `webapp/js/player_meta_persistence_adapter.js`.

```text
PlayerMetaAuthority snapshot
        ↓
validatePlayerMetaState()
        ↓
serializePlayerMetaState()
        ↓
PlayerMetaPersistenceAdapter.save()
        ↓
compatible storage boundary
        ↓
PlayerMetaPersistenceAdapter.load()
        ↓
deserializePlayerMetaState()
        ↓
validation
        ↓
immutable PlayerMetaState
```

The adapter uses the existing browser `localStorage`-compatible boundary by default and accepts an injected storage implementation for deterministic testing. It does not replace or modify `SaveSystem`; it owns only the namespaced Player Meta record. The current SaveSystem continues to own its existing save document, migration and application behavior.

`clear(identity)` removes only the Player Meta record for that identity. It does not reset or delete the broader SaveSystem document.

### Storage identity

Player Meta records are namespaced as:

```text
baseball_waifus_player_meta_v1:<encoded playerId>
```

The `playerId` comes from the existing T056 identity contract. Telegram identity is represented as `telegram:<id>` when resolved from the existing Telegram user, while local identity defaults to `local-player` or an explicit stable local id. T057 does not authenticate or create accounts.

### Load behavior

Missing data is not corruption. `load(identity)` returns the T056 initial state for that identity.

Persisted data that cannot be parsed, has an unsupported schema, violates the PlayerMetaState contract, or belongs to another identity is rejected with `PlayerMetaPersistenceError`. The adapter never silently repairs corrupt data into a valid-looking state.

### Versioning

`schemaVersion` is currently `1`. T057 rejects unknown versions through the official T056 deserializer/validator. No cross-version migration or downgrade is implemented.

### Determinism and atomicity

Serialization is deterministic for an equivalent PlayerMetaState. The adapter validates before writing, then performs one storage write. Browser `localStorage.setItem()` is used as the existing synchronous storage boundary; no multi-record transaction is introduced.

## Authority matrix

| Data | Authority | Persistence owner | Writers |
|---|---|---|---|
| Character ownership | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `ADD_CHARACTER`, `REMOVE_CHARACTER` |
| Currency: SCRAP | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `ADD_CURRENCY`, `SPEND_CURRENCY` |
| Currency: FRAGMENTS | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `ADD_CURRENCY`, `SPEND_CURRENCY` |
| Gacha pity | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `UPDATE_GACHA_STATE` |
| Unlock flags | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `SET_UNLOCK` |
| Active roster | PlayerMetaAuthority contract | PlayerMetaPersistenceAdapter | `SET_ROSTER` |
| Telegram identity | Identity adapter input | storage key only | identity construction |

The persistence adapter is a transport/storage boundary, not a gameplay or meta writer. Gacha, Economy and future consumers must continue to submit changes through `PlayerMetaAuthority`.

## Immutability

Snapshots and action results are deeply frozen. `PlayerMetaPersistenceAdapter.load()` reconstructs a fresh frozen snapshot through the official T056 deserializer. It never returns a mutable reference held by storage or by a previous runtime snapshot.

## Versioning

`schemaVersion` is currently `1`. Validation rejects unsupported versions. No migration table is added because no historical PlayerMetaState schema exists yet. Existing SaveSystem migration remains independent.

## Testing

`webapp/js/player_meta_persistence_adapter_test.mjs` covers:

- initial load;
- save/load round trip;
- deep immutability;
- invalid saves;
- corrupted JSON and invalid persisted states;
- schema rejection;
- identity isolation;
- deterministic serialized representation;
- clear behavior;
- no cross-contamination of unrelated storage.

`player-meta-tests.yml` runs the T056 authority test, T057 persistence test and syntax checks in GitHub Actions. Combat CI remains unchanged.

## Out of scope

T057 does not replace SaveSystem, implement SaveSystem migration, migrate all existing persistence, introduce Telegram CloudStorage as a new authority, implement backend authority, authentication, payments, shop/gacha rewrites, progression, PvP, Student 4v4 changes, Kytos changes, narrative changes or economy balancing. T058 is the future controlled Gacha/Player Meta integration task and is not implemented here.
