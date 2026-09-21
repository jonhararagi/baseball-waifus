# bw006 presentation v1: Akari Shimizu

## Canonical identity

- ID: `bw006`
- Name: Akari Shimizu
- Rarity: SR
- Element: Lightning
- Position: 1B
- Specialization: Defender
- Potential: 3
- Body preset: athletic
- Face style: sharp
- Hair: long
- Uniform: sleeveless
- Character identity: muscular_ice_wall
- Play identity: unexpected_small_ball

The catalog remains the single source of truth for gameplay identity and persistent character data. This presentation package does not modify those values.

## Visual direction

Akari is presented as a practical, muscular/tomboy first baseman whose visual strength comes from broad shoulders, a sturdy stance, long dark hair and restrained athletic uniform details.

Her Lightning identity is communicated through a controlled yellow accent rather than an RPG damage motif. The art uses:

- Hair: `#2f313f`
- Skin: `#c88b68`
- Uniform: `#f4f0df` baseline catalog tone, represented by a compatible ivory vector gradient
- Accent: `#f6d447`
- Eyes: `#302b38`

The expression set differentiates five presentation states:
`neutral`, `happy`, `focused`, `surprised`, `disappointed`.

## Asset requirements

All five SVGs are autonomous vector assets.

- No `<text>` elements.
- No external font dependency.
- No external image reference.
- No runtime-generated raster dependency.
- Independent expression files.
- Compatible with the existing `CharacterExpressionController` path contract.
- Intended to be replaceable by final painted/illustrated assets without changing the collection card or gameplay.

## Presentation contract

The runtime authority remains:

`CharacterArchetypeCatalog -> CharacterExpressionController -> BaseballCharacterCard`

The expression layer is presentation-only and never mutates PlayerData, CharacterRosterStore, stats, progression, rewards or baseball resolution.

## QA scene

`scenes/bw006_character_presentation_test.tscn` renders:

1. production BaseballCharacterCard for bw006;
2. five independent expression portraits;
3. canonical identity metadata;
4. palette and asset integrity checks.

When invoked with `--run-qa-capture`, the existing VisualQAExporter saves:

`res://qa_captures/bw006_character_presentation.png`

The workflow uses Godot 4.5.1-stable and a 15-second shell timeout as an outer safety boundary.

## Next unit

The next character should reuse this exact architecture and only introduce character-specific data and assets.
