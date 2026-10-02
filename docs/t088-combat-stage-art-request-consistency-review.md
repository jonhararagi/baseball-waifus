# T088 · CombatStage Art Request Consistency Review

## Purpose

T088 reviews the four CombatStage 2.5D art requests as one production family and checks that their visual roles, technical routing and presentation constraints can coexist in the same frame.

## Review result

**PASS_REAL after normalization**

One real field-level inconsistency was found in T085: the request described itself as MIDGROUND in its visual role and prompt, but its schema field 'composition' was still 'BACKGROUND'.

The existing Art Studio schema already supports the dedicated 'MIDGROUND' composition vocabulary. The normalization therefore changes only T085 composition from 'BACKGROUND' to 'MIDGROUND'. Deterministic naming and routing remain unchanged because they are derived from asset kind, subject and camera.

No other semantic collision required a patch.

## Canonical stack

```text
CAMERA
  ↓
FOREGROUND
  ↓
ACTORS
  ↓
GROUND
  ↓
MID
  ↓
FAR
```

| Layer | Asset kind | Runtime slot | Visual role |
|---|---|---|---|
| FAR | STAGE_BACKGROUND_FAR | stage.background.far | distant atmosphere / backplate |
| MID | STAGE_BACKGROUND_MID | stage.background.mid | readable environmental structures / spatial landmarks |
| GROUND | STAGE_GROUND | stage.ground | shared physical combat surface |
| FOREGROUND | STAGE_FOREGROUND | stage.foreground | near-camera cinematic framing |

## Composition normalization

```text
FAR        = BACKGROUND
MID        = MIDGROUND
GROUND     = GROUND
FOREGROUND = FOREGROUND
```

This now matches the dedicated Art Studio vocabulary and the CombatStage layer semantics.

## Camera consistency

All four requests use WIDE and are written to tolerate FORMATION, PLAYER_FOCUS, ACTION, IMPACT, REACTION and RETURN, including push-in, pull-back, lateral movement and small framing changes.

No fixed-camera dependency or special skill-only camera asset was introduced.

## Target, naming and format consistency

All four requests use assets/stages/ with unique deterministic targets:

```text
combat-stage--background--far--wide.png
combat-stage--background--mid--wide.png
combat-stage--ground--wide.png
combat-stage--foreground--wide.png
```

All four use PNG with a minimum production size of 2048 × 1152.

## Depth consistency

FAR is limited to distant atmosphere and stadium-scale backplate forms.

MID is limited to readable secondary structures and spatial landmarks. Its composition field is now explicitly MIDGROUND.

GROUND remains the shared physical combat surface. It explicitly separates artwork from runtime presentation geometry and forbids baked PLAYER_RAMP, CENTER_PLATFORM, ENEMY_PLATFORM and FRONT_STEP structures.

FOREGROUND remains the near-camera framing device. Its strong shapes belong primarily in outer frame and edge regions, while hero, enemy, bat, projectile, impact and reaction regions remain protected.

## Visual density and actor readability

The combined requests describe a coherent progression:

```text
FAR        = low-detail atmosphere
MID        = medium-detail readable structures
GROUND     = controlled surface detail
FOREGROUND = large near-camera framing shapes
```

All four keep the standing priority CHARACTER > ACTION > RESULT. None requests secondary characters, mascots or human-like silhouettes.

## Baseball identity consistency

All four use baseball-inspired sports-tech language without restoring a traditional baseball simulation field as the dominant spatial grammar. The requests consistently reject core old-field anchors such as baseball diamond, bases, pitcher mound, batter box and runner lanes.

## 2.5D compatibility

The four requests are compatible with a single layered presentation:

```text
FAR
↓
MID
↓
GROUND
↓
ACTORS
↓
FOREGROUND
↓
CAMERA
```

Together they provide distinct depth roles for parallax, scale, camera movement and controlled occlusion without requiring a new renderer, geometry system, parallax manager or runtime loader.

## Backward compatibility

Preserved unchanged:

```text
AR-T083-AIKO-BW001-01
AR-T083-FIXTURE-001
AR-T084-STAGE-BG-FAR-01
AR-T085-STAGE-BG-MID-01
AR-T086-STAGE-GROUND-01
AR-T087-STAGE-FOREGROUND-01
```

Aiko remains REQUESTED. No request ID, target alias or globally optional schema field was changed.

## Test coverage

T088 adds a cross-layer consistency regression test covering the four asset kinds, four runtime slots, normalized compositions, common camera/format/resolution, unique targets, shared visual identity terms, baseball exclusions, role-specific prompt semantics, Ground runtime-geometry separation, Foreground protected areas, production-target absence and Aiko preservation.

## IMPLEMENTED

- Cross-layer consistency review.
- T085 composition normalized from BACKGROUND to MIDGROUND.
- Cross-layer regression test added.
- Unified four-layer contract documented.
- Deterministic routing and naming preserved.
- No production artwork generated.

## NOT IMPLEMENTED

- Physical FAR/MID/GROUND/FOREGROUND artwork.
- Runtime stage asset loading.
- Visual approval.
- Final CombatStage art assembly.

## QA state

```text
BROWSER QA = NOT_RUN
VISUAL QA = NOT_READY
```

CI remains the automated checkpoint for this review. CI success does not imply that physical stage art exists.

## Next checkpoint

With all four layer requests now consistent, the next work should be physical-art intake when an original stage source is actually available.

```text
T089 · COMBAT STAGE FAR PHYSICAL ART INTAKE
```

This is intentionally a single next checkpoint, not a parallel production queue.
