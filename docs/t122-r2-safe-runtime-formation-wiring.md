# T122-R2 · SAFE RUNTIME FORMATION WIRING PATCH

**HEAD BEFORE:** `9cf4e1d4d328bcba37a5d2d5c01d44ac591fa4e9`

## Status

Runtime presentation wiring implemented without rebuilding `combat.js` or `combat_stage.js`.

## Safe integration point

`CombatPresentationDirector` now creates a `CharacterFormation2D5` from the four existing PLAYER actors exposed by its real `CombatStage` dependency.

The Formation remains presentation-only. No gameplay resolver, combat result, reward, persistence, gacha, economy or Timing Ring logic was changed.

## Runtime contract

`CombatPresentationDirector → CombatStage PLAYER actors → CharacterFormation2D5`

The formation is populated and presented during director initialization. Existing actor instances are reused.

Observability:

- `formationInitialized`
- `formationActorCount`

## QA

The focused T122-R2 integration test verifies:

- runtime formation exists
- four existing PLAYER actors are attached
- four formation slots are valid
- existing actor presentation snapshots remain unchanged

The normal attack state machine is intentionally not expanded by this checkpoint.

## Preserved constraints

`T118-R = BLOCKED / UNCHANGED`

No large-file reconstruction was performed.
