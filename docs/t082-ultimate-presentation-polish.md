# T082 · Ultimate Presentation Polish

## Status

**IMPLEMENTED**
- cinematic viewport suppression during the active Ultimate presentation;
- removal of non-essential combat HUD surfaces from the cinematic frame;
- removal of temporary stage/actor debug labels from Ultimate presentation;
- preservation of the existing CombatPresentationDirector, CombatStage, BatterRenderer and projectile contracts;
- HUD recovery after ULTIMATE_COMPLETE.

**NOT IMPLEMENTED**
- final character art;
- final VFX/audio production;
- new Ultimate gameplay mechanics;
- new projectile physics;
- new camera system;
- major HUD redesign.

## Presentation contract

T082 is a presentation-only polish pass on the T081/T081-B Ultimate sequence:

```text
ULTIMATE_TRIGGER
→ ULTIMATE_STAGING
→ ULTIMATE_CHARACTER_FOCUS
→ ULTIMATE_ACTION_PREP
→ ULTIMATE_ACTION
→ ULTIMATE_IMPACT
→ ULTIMATE_REACTION
→ ULTIMATE_RETURN
→ ULTIMATE_COMPLETE
```

The existing CombatPresentationDirector remains the only camera authority.

## Cinematic viewport

While an Ultimate presentation sequence is active, the app adds is-cinematic-ultimate to the root UI container.

The following combat-only UI is removed from the cinematic frame:
- scoreboard overlay;
- match information strip;
- combat action footer.

The existing active-character card and timing-feedback suppression from T080 remain active.

The viewport expands naturally because the hidden combat UI no longer consumes layout space. The header remains available for global app context.

## Scene readability

Temporary blockout labels such as FIXTURE, ENEMY ACTOR and set-piece identifiers are hidden during the Ultimate sequence.

The underlying stage geometry, actors, depth model, elevation, parallax and camera anchors remain unchanged.

This is presentation filtering, not removal of the underlying stage contract.

## Gameplay boundary

No gameplay value is calculated or mutated by T082.

The Ultimate presentation continues to consume a resolved presentation result. The presentation layer does not determine:
- damage;
- HP;
- turns;
- Timing Ring rules;
- victory / defeat;
- rewards;
- economy;
- progression;
- gacha;
- save state.

## Verification

T082 extends the existing T081-B unit and Browser QA contracts.

Browser proof verifies that the cinematic HUD is suppressed during ULTIMATE_ACTION, ULTIMATE_IMPACT and ULTIMATE_REACTION, and restored after ULTIMATE_COMPLETE.

The final proof remains a procedural 2.5D blockout, not production-ready art.
