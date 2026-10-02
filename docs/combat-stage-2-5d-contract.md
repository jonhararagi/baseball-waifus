# T078 · Combat Stage 2.5D Contract

T078 introduces the renderer-facing spatial contract for the canonical cinematic combat presentation.

The stage is presentation-only. It does not calculate or mutate damage, HP, turns, Timing Ring results, victory, defeat, rewards or economy.

Canonical flow: PLAYER DATA → GAMEPLAY → COMBAT RESULT → DOMAIN EVENT → COMBAT STAGE → CAMERA / ACTOR / VFX / AUDIO.

Stage layers: BACKGROUND, MIDGROUND, GROUND, FOREGROUND.
Presentation zones: PLAYER_ZONE and ENEMY_ZONE.
Actor staging: actorId, team, kind, position, depth, depthValue, scale, rotation, visual, state, cameraAnchors, actionAnchors and vfxAnchors.
Depth is explicit FAR / MID / NEAR and is presentation data only.
Camera anchors: FORMATION, PLAYER_FOCUS, ENEMY_FOCUS, ACTION, IMPACT, REACTION, RETURN.
Actor action/VFX anchors: BODY, HEAD, BAT, HAND, PROJECTILE, IMPACT, REACTION.
Future layer asset slots: stage.background.far, stage.background.mid, stage.ground, stage.foreground.
The T078 browser proof uses 4 player-side actors plus 1 enemy. Three player-side actors are T078 blockout fixtures, not new roster characters.
Baseball remains the attack language. The stage no longer treats pitcher, batter, bases or runners as its universal spatial grammar.
T078 reuses the existing Canvas 2D renderer and CombatPresentationDirector. No new combat engine, baseball simulator, Kytos expansion, Student 4V4 expansion, full 3D migration or Aiko dependency is introduced.
Verification target: FORMATION → SELECTED CHARACTER → PLAYER_FOCUS → ACTION → IMPACT → REACTION → RETURN.
T079 can build visual blockout and camera routes on this contract.
