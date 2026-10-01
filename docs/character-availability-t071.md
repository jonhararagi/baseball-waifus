# T071 · Canonical Character Availability

## Decision

`bw001 · Aiko Hanamori` is the starter character for a fresh web player state.

Repository evidence:

- `PlayerMeta` starts with an empty character inventory and has no existing starter assignment.
- The local demo already uses `bw001` as the player batting identity.
- `assets/ui/starter_card_frame.svg` exists as starter presentation infrastructure.
- The canonical roster contains `bw001` in `game/characters/character_archetypes.json`.

## Distribution boundary

Aiko is present in the runtime character catalog but explicitly excluded from Gacha rarity pools.

The eligible pools remain R: 2, SR: 7, SSR: 5, UR: 2.

The Gacha table remains `R80 / SR15 / SSR4 / UR1`.
Soft pity remains 61 and hard pity remains 80.

## Initial Player State

When no Player Meta record exists and the migrated state has no owned characters, the normal Player Meta authority receives:

```text
ADD_CHARACTER(bw001, 1)
SET_ROSTER(activeBatter = bw001)
```

No currency, reward, progression bonus, or alternate persistence layer is created.
Existing Player Meta state takes precedence.

## Canonical identity

The access path resolves `bw001 · Aiko Hanamori` from the same runtime character catalog consumed by Collection, Roster and Character Detail.

The new path does not use `waifu_database.js` or `waifus_config.json` as an authority.

## Journey

```text
PLAYER HOME
 ↓
Aiko starter
 ↓
CHARACTER DETAIL
 ↓
STORY / ARC0
 ↓
RELATIONSHIP / LOCKER
```

## Non-goals

No Gacha rebalance, pity change, economy change, combat change, new character, artwork, voice file, Relationship System, PlayerMeta schema change, Home redesign, Collection redesign, or mass legacy cleanup.