# T058 · Gacha / Player Meta Integration

## Status

`WORKING IMPLEMENTATION / DESIGN PROPOSAL`

T058 connects the active `gacha_controller.js` runtime to the existing `PlayerMetaAuthority` and `PlayerMetaPersistenceAdapter` without changing Gacha rules or replacing the existing SaveSystem.

## Authority boundary

```text
GachaController
    ↓
Gacha / Player Meta Integration
    ↓
PlayerMetaAuthority
    ↓
immutable PLAYER_META_STATE
    ↓
PlayerMetaPersistenceAdapter
    ↓
existing compatible storage boundary
```

The responsibilities remain separate:

- **Gacha runtime:** resolves rarity, pity, pool selection, duplicate rewards and pull sequencing using its existing rules.
- **PlayerMetaAuthority:** owns character ownership, SCRAP, FRAGMENTS, `gacha.pullsSinceUR` and roster state.
- **PlayerMetaPersistenceAdapter:** serializes and stores the authoritative Player Meta snapshot.

The integration is a boundary. It is not a second inventory, currency or Gacha state authority.

## Runtime compatibility

The previous `gacha_controller.js` implementation is retained as `gacha_controller_runtime.js` and is wrapped by the public `gacha_controller.js` entry point. This keeps the existing runtime behavior and imports stable while inserting the Player Meta boundary at the official controller API.

The legacy `gacha_engine.js` remains outside the integration authority. Its existing `duplicateReward()` export continues to be used by the active controller and is not duplicated by T058.

## Pull atomicity

A single pull is committed through one Player Meta transaction boundary:

```text
SPEND_CURRENCY(SCRAP)
        +
ADD_CHARACTER
        +
ADD_CURRENCY(FRAGMENTS) when duplicate reward exists
        +
UPDATE_GACHA_STATE
        +
SET_ROSTER when the first pull establishes the active batter
        ↓
PlayerMetaAuthority snapshot
        ↓
PlayerMetaPersistenceAdapter.save()
```

If any action is rejected, the authority returns to its pre-operation snapshot and the invalid operation does not become persistent state.

The existing Gacha calculation itself is unchanged. No rates, pity thresholds, costs or duplicate reward values are rebalanced by T058.

## Legacy migration

On the first runtime initialization for an identity, if the T057 Player Meta record does not exist, the integration imports the existing Gacha save model once:

- `duplicate_count` → `inventory.characters[id].quantity`
- owned characters → `unlocked: true`
- `scavenger_scrap` → `currencies.SCRAP`
- `fragment_bank` → `currencies.FRAGMENTS`
- `pulls_since_UR` → `gacha.pullsSinceUR`
- `active_batter` → `roster.activeBatter`

After migration, the Player Meta snapshot becomes the source for Gacha state reads and mutations.

## Rehydration

The Gacha controller maintains its existing UI-facing state shape as a derived read model. It is hydrated from the immutable Player Meta snapshot before external reads and after Player Meta mutations.

This preserves existing consumers such as the Gacha UI, roster UI and gallery while avoiding a second persistent inventory/currency authority.

## Persistence and SaveSystem

T058 does not replace or modify `SaveSystem`. The existing SaveSystem remains responsible for its broader application save document and compatibility migration.

Gacha Meta mutations do not directly write the Gacha-specific localStorage record or Telegram CloudStorage after Player Meta integration is active. Player Meta persistence goes through `PlayerMetaPersistenceAdapter`.

Existing SaveSystem compatibility can still provide a legacy application snapshot, but the active Gacha read model refreshes from Player Meta before Gacha operations so that a stale legacy snapshot cannot become the permanent Meta authority.

## Determinism

The Gacha RNG, seed/input behavior and existing probability calculations are unchanged. T058 adds no new RNG source and does not introduce `Math.random()` into the integration boundary.

The integration tests verify that equivalent initial Player Meta state plus equivalent RNG/input produces equivalent Gacha result and final Player Meta state.

## Validation

`webapp/js/gacha_player_meta_integration_test.mjs` covers:

- valid pull and cost;
- character acquisition;
- pity update;
- save/load rehydration;
- deterministic resolution;
- duplicate reward path;
- invalid payloads;
- insufficient currency;
- invalid pity;
- immutable snapshots;
- multi-player isolation;
- protection against stale derived-state reads.

The dedicated workflow is `.github/workflows/gacha-player-meta-tests.yml`. Existing Player Meta authority/persistence tests remain included.

## Out of scope

T058 does not implement or rebalance:

- Shop or payments;
- Telegram Stars;
- Economy redesign;
- backend authority or authentication;
- progression;
- roster redesign;
- teams;
- combat/Kytos/Student 4v4;
- narrative systems;
- new Gacha banners, rates or pity rules.

No canon changes are introduced.
