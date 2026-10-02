# T081 · Cinematic Ultimate Choreography Foundation

## Status

**IMPLEMENTED:** Ultimate staging choreography plus the T081-B action/projectile/impact/reaction presentation checkpoint.

**NOT IMPLEMENTED:** final character art, final VFX/audio production, and new gameplay Ultimate mechanics.

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

The runtime exposes **QA-only** triggers when the page is opened with `?qa=t081`:

```text
window.__BW_T081_TRIGGER_ULTIMATE__()
window.__BW_T081B_CONTINUE_ULTIMATE__(result)
window.__BW_T081B_GET_RUNTIME__()
```

The first starts the T081 staging sequence. The second continues from `ULTIMATE_ACTION_PREP` using a supplied already-resolved presentation result. The third returns presentation, gameplay and stage snapshots for browser immutability proof.

These are presentation test hooks, not player-facing Ultimate mechanics.

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

## T081-B implemented checkpoint

Implemented as a separate continuation from `ULTIMATE_ACTION_PREP`:

```text
ULTIMATE_ACTION_PREP
→ ULTIMATE_ACTION
→ ULTIMATE_IMPACT
→ ULTIMATE_REACTION
→ ULTIMATE_RETURN
→ ULTIMATE_COMPLETE
```

The continuation consumes a pre-resolved presentation result. The result can carry an existing combat outcome and damage value, but the presentation layer never calculates or mutates gameplay state.

The existing baseball presentation path is reused through `BatterRenderer` and `CombatStage.resolveCinematicProjectile()`. The projectile remains presentation-only and is anchored to:

```text
BAT
→ PROJECTILE
→ ENEMY.IMPACT
```

Impact invokes existing `CombatEffects` and particle/camera feedback. Enemy recoil is expressed through the existing stage actor frame resolver, without introducing a gameplay reaction state.

Return resets the BatterRenderer to `IDLE`, restores the camera through `RETURN`, and lets the T080 cinematic HUD cleanup recover after `ULTIMATE_COMPLETE`.

Final art, final VFX/audio and player-facing Ultimate gameplay rules remain outside T081-B.

## Asset status

No AI-generated production asset is required.

Aiko remains independent and does not block this checkpoint.
