# Character Card UI v1

## Purpose

BaseballCharacterCard is the reusable collection-card presentation for Baseball Waifus. It makes character identity, rarity and baseball role immediately legible without coupling the visual layer to gameplay authority.

## Data authority

The card reads PlayerData for owned-instance values, CharacterArchetypeCatalog for canonical character identity, and CharacterExpressionController for portrait/expression resolution.

The card does not mutate statistics, probabilities, inventory, rewards, roster persistence, equipment or match state.

## Visual contract

1. Portrait area with dedicated frame.
2. Rarity badge for R/SR/SSR/UR.
3. Procedural vector element icon, with no emoji or platform-dependent glyph.
4. Character name.
5. Position, element and specialization.
6. Level and potential.
7. Play identity from the canonical character catalog.
8. Eight compact stat bars: PWR, CON, SPD, DEF, PIT, CTL, CRT, STA.
9. Optional character comment.
10. Entry and expression transition animation.

## Rarity language

Rarity changes visual hierarchy, never gameplay results.

- R: restrained neutral frame.
- SR: blue technical/sport presentation.
- SSR: violet premium presentation.
- UR: gold premium presentation.

## Element iconography

CardElementIcon draws its own symbols:
- Fire: flame.
- Water: drop.
- Ice: crystal.
- Lightning: bolt.
- Nature: leaf.
- Darkness: eclipse.
- Light: star.
- Neutral: circle.

The icon layer can later be replaced by final SVG assets without changing the card API.

## Animation

The card uses a short scale/fade entry transition and a subtle hover response. These are presentation-only.

## Portrait pipeline

Portrait selection is delegated to CharacterExpressionController. The intended expression asset path is assets/characters/expressions/<character_id>_<expression>.svg, with fallback to the generated character asset.

## QA

scenes/character_card_test.gd validates rarity, name, metadata, level/potential, eight stat bars, expression validation and comment binding.

The test is structural until Godot 4.x is actually executed.