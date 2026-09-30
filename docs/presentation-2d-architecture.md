# 2D Presentation Architecture Foundation

**T061 status:** IMPLEMENTED FOUNDATION / DESIGN PROPOSAL  
**Visual direction:** 2D anime / PNG sprites / layered composition / camera / VFX / audio / UI.

## Presentation authority rule

The presentation path is:

```text
GAMEPLAY RESULT / DOMAIN EVENT
            ↓
PRESENTATION COMMAND
            ↓
SPRITES / PNG
            ↓
CAMERA / LAYERS
            ↓
VFX / AUDIO / HAPTICS
            ↓
UI FEEDBACK
```

Presentation represents already-decided state. It must never calculate damage, HP, shield, victory, rewards or timing outcomes.

## Implemented foundation

`webapp/js/presentation_event_contract.js` defines immutable event and presentation-command contracts.

Supported presentation command categories:

- `SPRITE`
- `CAMERA`
- `FX`
- `AUDIO`
- `UI`
- `PARALLAX`
- `CUT_IN`
- `HIT_STOP`
- `HAPTIC`

Commands contain explicit event IDs and payload data. No command has a gameplay mutation API.

## Existing infrastructure to reuse

### Sprites / PNG

The existing production asset manifest and `AssetLoader` / `AssetBank` path in `combat.js` already supports raster production sprites and cards. Future presentation should reuse those descriptors instead of creating another asset registry.

### Batter

`BatterRenderer` already owns the visual state machine:

```text
IDLE → WINDUP → SWING → FOLLOW_THROUGH → IDLE
```

It should remain a renderer/presentation component.

### Timing

`timing_ring.js` is the existing timing geometry/classification foundation. T061 does not create another timing system.

### Effects

`CombatEffects` already provides reusable presentation effects including camera shake, flash and bat trails. Future effects should build on this surface.

### HUD / cut-ins

`CombatHUD` provides top-bar UI, result banners and Super Swing cut-in integration. `SuperSwingCutin` is an existing reusable presentation component.

### Audio

`audio_bridge.js` contains the existing synthesized presentation SFX contract and sound profiles. Future events should request audio through this bridge rather than embedding audio logic into gameplay.

### Haptics

The existing combat renderer accepts a haptics bridge. Haptics remain presentation feedback.

## Mixed / legacy presentation audit

The current `CombatRenderer` is **MIXED**. It contains presentation orchestration plus legacy combat-flow/result handling and resource/reward callbacks.

T061 does not perform a mass refactor because changing this surface could alter established combat behavior.

The architectural rule for new work is therefore:

- new gameplay calculates results outside presentation;
- presentation consumes result/event data;
- legacy mixed paths remain documented until isolated migration tasks are safe.

## Performance / platform guidance

The preferred presentation stack for Telegram Mini App, Web, Windows and future Android is:

```text
PNG / sprites
+ camera transforms
+ layer composition
+ small reusable VFX
+ audio
+ UI
```

Avoid introducing heavyweight 3D or runtime asset-generation requirements for presentation polish.

## Event examples

A combat result can produce:

```text
COMBAT_RESULT
  ↓
COMBAT_EVENT
  ↓
CAMERA + HIT_STOP + FX + AUDIO + UI
```

The event may contain a decided value such as `damage: 180`. Presentation may display that value and amplify it visually, but it must not recalculate it.

Future meta events can use the same boundary:

- `CHARACTER_ACQUIRED`
- `REWARD_GRANTED`
- `LEVEL_UP`
- `NEW_UNLOCK`
- `GACHA_RARE_REVEAL`
- `MISSION_COMPLETED`
- `BOSS_DEFEATED`

These are proposal-level event vocabulary, not implemented product features.

## Status vocabulary

- **CONFIRMED:** observed in repository and reused as-is.
- **IMPLEMENTED:** T061 contract/code exists and is tested.
- **PARTIAL:** infrastructure exists but remains mixed or incomplete.
- **LEGACY:** active historical system that should not be silently replaced.
- **PROPOSAL:** architecture intended for future implementation.
- **FUTURE:** deliberately outside T061.
- **UNKNOWN:** requires a future audit or environment-specific validation.
