# T079 · Character-Combat 2.5D Vision Conversion

T079 evolves the T078 spatial foundation into a cinematic character-combat blockout.

## Direction
Canonical presentation is CHARACTER COMBAT 2.5D. Baseball remains the attack language, not the universal scene grammar.

Primary runtime composition:
4 PLAYER ACTORS + 1 ENEMY ACTOR inside a filmable stage.

Legacy baseball semantics such as pitcher, batter, bases, runners and inning remain available to gameplay/compatibility systems, but are not used to lay out the primary combat scene.

## Stage blockout
The stage now contains explicit background, midground, ground and foreground layers, player/enemy zones, non-uniform actor positions, depth, elevation and set geometry.

Set geometry is presentation-only:
PLAYER_RAMP, CENTER_PLATFORM, ENEMY_PLATFORM, FRONT_STEP.

Actors carry depth FAR/MID/NEAR, scale, elevation and facing. Elevation changes the visual world Y position without introducing terrain physics or gameplay rules.

## Cinematic camera
CombatPresentationDirector continues to own presentation sequencing and consumes actor camera anchors.

Route:
FORMATION → PLAYER_FOCUS → ACTION → IMPACT → REACTION → RETURN.

PLAYER_FOCUS and ACTION resolve from the selected actor. IMPACT and REACTION resolve from the target enemy actor when available. Stage fallbacks remain intact.

## Normal attack blockout
The normal attack proof reuses the existing combat result path and BatterRenderer swing. T079 adds a presentation-only baseball projectile between the actor PROJECTILE anchor and enemy IMPACT anchor, followed by visual impact/reaction emphasis.

No damage, HP, turn, Timing Ring, reward, progression, economy, gacha or save logic is changed.

## Visual boundary
T079 is a blockout, not production artwork. Three supporting player actors remain T078 blockout fixtures.

The target visual reading is: four character actors visibly confronting an enemy inside a spatial combat set, with camera movement, depth, elevation and impact staging.

T080 can extend this into a deeper camera/action vertical slice without rebuilding the stage.
