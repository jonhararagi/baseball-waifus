# T081 · Cinematic Ultimate Choreography Foundation

## Status

**IMPLEMENTED:** Ultimate staging choreography foundation only.

**PROPOSED / NOT IMPLEMENTED:** Ultimate action projectile, impact, enemy reaction and final VFX/audio production.

T081 is intentionally a checkpoint. It does not introduce a new combat Ultimate mechanic.

## Implemented contract

```text
ULTIMATE_TRIGGER
→ ULTIMATE_STAGING
→ ULTIMATE_CHARACTER_FOCUS
→ ULTIMATE_ACTION_PREP
→ ULTIMATE_RETURN
→ ULTIMATE_COMPLETE
```

The sequence is presentation-only.

It consumes the existing CombatStage and actor/camera anchors. The selected actor becomes the hero subject while the other three player actors and the enemy receive temporary staging transforms.

## Character

During `ULTIMATE_CHARACTER_FOCUS` and `ULTIMATE_ACTION_PREP`, the existing `BatterRenderer` enters and remains in `WINDUP`.

T081 does not start `SWING`, does not launch a projectile and does not resolve an impact.

## Team staging

During the Ultimate staging phases:

- support actors move slightly outward;
- support actors scale down;
- support actors become visually subordinate;
- enemy remains physically present but visually de-emphasized;
- the stage remains the same 2.5D CombatStage.

No stage actor data is mutated. The transforms are presentation-only.

## Camera

The existing `CombatPresentationDirector` remains the sole camera authority.

```text
FORMATION
→ PLAYER_FOCUS
→ ACTION
→ RETURN
```

No second camera director or skill-specific camera system is introduced.

## UI

The existing T080 cinematic HUD visibility behavior is reused. The character card and large timing feedback are suppressed while the presentation sequence is active and recover after `ULTIMATE_COMPLETE`.

## Trigger boundary

The runtime exposes a **QA-only** trigger when the page is opened with `?qa=t081`:

```text
window.__BW_T081_TRIGGER_ULTIMATE__()
```

It calls `CombatRenderer.triggerUltimateCinematicStaging()`.

This is a presentation test hook, not a player-facing Ultimate mechanic.

The future gameplay layer must provide:

```text
GAMEPLAY RESULT / DOMAIN EVENT
→ ULTIMATE PRESENTATION
```

without allowing presentation to determine damage, HP, turns, victory, defeat, rewards or economy.

## Gameplay boundary

T081 does not modify:

- damage;
- HP;
- turn resolution;
- Timing Ring rules;
- victory / defeat;
- rewards;
- economy;
- gacha;
- save state.

The contract test explicitly verifies the CombatStage actor data remains unchanged after the presentation completes.

## Future checkpoint T081-B

Not implemented here:

```text
ACTION
→ BASEBALL PROJECTILE
→ IMPACT
→ ENEMY REACTION
```

That remains a separate checkpoint so the task stays recoverable and small.

## Asset status

No AI-generated production asset is required.

Aiko remains independent and does not block this checkpoint.
