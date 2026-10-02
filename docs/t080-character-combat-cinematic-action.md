# T080 · Character Combat Cinematic Action Vertical Slice

## Contract

T080 consumes the T079 `CombatStage` and `CombatPresentationDirector` infrastructure to prove one real normal attack as a coordinated character-combat scene.

Canonical sequence:

```text
FORMATION
→ ATTACKER_FOCUS
→ ACTION
→ IMPACT
→ TARGET_REACTION
→ COMBAT_RETURN
→ COMPLETE
```

The presentation contract is:

```text
PLAYER DATA
→ GAMEPLAY SYSTEMS
→ BASEBALL / COMBAT RESULT
→ DOMAIN EVENT
→ CHARACTER PRESENTATION
→ CAMERA / ANIMATION / PROJECTILE / VFX / REACTION
```

Gameplay remains authoritative. The cinematic layer never calculates damage, HP, turn progression, Timing Ring rules, rewards, progression, gacha or save state.

## Character action

The canonical normal attack uses the existing `BatterRenderer` state machine:

```text
IDLE
→ WINDUP
→ SWING
→ FOLLOW_THROUGH
→ IDLE
```

T080 coordinates that animation with the presentation phase instead of starting `SWING` independently from multiple callers.

## Stage and anchors

The action consumes the T079 `CombatStage` actor and camera contracts.

Required actor anchors:

- `BODY`
- `HEAD`
- `BAT`
- `HAND`
- `PROJECTILE`
- `IMPACT`
- `REACTION`

The camera consumes actor-backed `FOCUS`, `ACTION`, `IMPACT` and `REACTION` anchors.

`resolveCinematicActorFrame()` supplies presentation-only body movement, emphasis, rotation and 2.5D staging.

`resolveCinematicProjectile()` binds the visual projectile to the attacker's `BAT` / `PROJECTILE` anchors and the enemy `IMPACT` anchor. It is not gameplay physics.

## UI feedback during cinematics

The existing tactical/timing feedback remains a combat UX surface, but it must not visually cover the character action once the presentation director owns the cinematic sequence.

During `ATTACKER_FOCUS`, `ACTION`, `IMPACT` and `TARGET_REACTION`, the large timing-feedback overlay is suppressed. The underlying event text remains available to the normal HUD after the sequence. This is presentation-only and does not alter timing, damage, HP or result resolution.
## Impact and reaction

The presentation director emits the `CONTACT` beat after the combat result has already been resolved.

At that point the renderer triggers existing `CombatEffects` feedback and presents the enemy response. The response is visual only: recoil, pulse, short displacement and rotation.

## Browser proof

The T080 browser probe proves the real route:

```text
HOME
→ COMBAT
→ FORMATION
→ CHARACTER_FOCUS
→ ACTION
→ PROJECTILE
→ IMPACT
→ ENEMY_REACTION
→ RETURN
```

It records phase progression, camera source, BatterRenderer state, character motion, bat pose, projectile provenance and screenshots for the major cinematic beats.

## Asset request for later production

The vertical slice establishes future action-art slots without creating an intake factory:

```text
CHARACTER HERO ART
CHARACTER ACTION ART
STAGE BACKGROUND
STAGE MIDGROUND
FOREGROUND
ENEMY ART
PROJECTILE
VFX
```

Blockout assets remain valid for T080. Physical production art is a later pipeline concern.
