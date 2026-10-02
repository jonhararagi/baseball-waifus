# T086 · Combat Stage Ground Art Request

## Purpose

T086 creates the third production request for the existing CombatStage 2.5D art supply chain. It reuses the T083 Art Studio / intake foundation and extends the scene sequence without creating a new renderer, stage system, physics layer or runtime asset loader.

The production sequence is:

```
FAR
→
MID
→
GROUND
→
FOREGROUND
```

## Implemented

- Production request: `AR-T086-STAGE-GROUND-01`
- Status: `REQUESTED`
- Asset kind: `STAGE_GROUND`
- Runtime semantic slot: `stage.ground`
- Camera intent: `WIDE`
- Composition: `GROUND`
- Production format: `PNG`
- Minimum resolution: `2048 × 1152`
- Deterministic filename: `combat-stage--ground--wide.png`
- Deterministic target: `assets/stages/combat-stage--ground--wide.png`
- Deterministic drop zone: `tools/art_studio/inbox/AR-T086-STAGE-GROUND-01/`
- Stage runtime-slot validation reused from T083.
- Fixture intake proof using the existing T083 controlled source.
- Negative-path validation for wrong runtime slot, wrong target, unsafe target, wrong format and undersized source.
- FAR and MID requests remain intact and independently routed.

## Ground role

`STAGE_GROUND` represents the shared physical combat surface visually supporting the actors. It is not a wallpaper and it is not a second MIDGROUND.

```
FAR
= distant atmosphere

MID
= environmental structures

GROUND
= shared physical combat surface
```

The ground must communicate physical support for players, enemy, set pieces, movement staging, camera framing and impact presentation.

## Runtime slot

The semantic relationship is deterministic:

```
STAGE_GROUND
→
stage.ground
```

The request layer reuses the existing T083 mapping. It does not redefine the CombatStage runtime layer model from T078.

## Camera and composition

Camera: `WIDE`.

The asset must tolerate:

```
FORMATION
PLAYER_FOCUS
ACTION
IMPACT
REACTION
RETURN
```

including push-in, pull-back, lateral movement and slight camera-angle changes.

Composition: `GROUND`.

The surface should contain perspective, depth lanes, large readable shapes, actor support areas and camera-safe composition. It should preserve a visible near / mid / far sense without becoming a flat illustration.

## Runtime geometry compatibility

The runtime already provides presentation geometry concepts including:

```
PLAYER_RAMP
CENTER_PLATFORM
ENEMY_PLATFORM
FRONT_STEP
```

The art must coexist with those structures. The artwork must not bake them in as final geometry.

The intended relationship is:

```
ART
+
RUNTIME PRESENTATION GEOMETRY
```

No new GroundRenderer, parallax system, physics, navigation or StageRenderer is introduced.

## Actor readability

The surface must favor large readable planes, controlled contrast and directional perspective. It should avoid high-frequency micro-detail, busy patterns beneath feet and strong central focal points that compete with character silhouettes.

## Baseball identity

Baseball remains a thematic combat language, not the dominant field layout.

Allowed visual vocabulary includes:

- sport-tech floor panels;
- energy tracks;
- arena markings;
- training-zone motifs;
- reinforced panels;
- abstract baseball-inspired field geometry.

The request explicitly rejects a traditional baseball-field composition and avoids using a diamond, bases, mound, batter box or runner lanes as the dominant spatial grammar.

## Relationship to FAR and MID

T084 remains the FAR request:

```
AR-T084-STAGE-BG-FAR-01
→
STAGE_BACKGROUND_FAR
→
stage.background.far
```

T085 remains the MID request:

```
AR-T085-STAGE-BG-MID-01
→
STAGE_BACKGROUND_MID
→
stage.background.mid
```

T086 adds:

```
AR-T086-STAGE-GROUND-01
→
STAGE_GROUND
→
stage.ground
```

The three requests are complementary and do not share target names.

## Generation request card

### WHAT IS EXPECTED

Original production ground surface art for the BaseWarriors: Meta-Strike CombatStage 2.5D. It must read as the shared physical combat surface supporting players, enemy, set geometry, movement staging, camera framing and impact presentation without baking runtime geometry into the artwork.

### CAMERA

`WIDE`

### COMPOSITION

`GROUND`

### SUBJECT

`combat-stage`

### ENVIRONMENT

Cyberpunk sports-tech combat arena ground plane with a perspective surface, depth lanes, large readable panels and abstract baseball-inspired arena markings. It is a combat floor, not a traditional baseball field.

### VISUAL NOTES

GROUND layer only. Support PLAYER_ZONE, ENEMY_ZONE, PLAYER_RAMP, CENTER_PLATFORM, ENEMY_PLATFORM and FRONT_STEP as runtime presentation geometry without baking those structures into the artwork. Maintain near/mid/far depth cues, directional perspective, actor support areas and camera-safe negative space. Use large controlled surfaces, subtle sport-tech energy tracks, reinforced panels and abstract arena geometry. Avoid high-frequency texture noise, strong patterns directly beneath feet and dominant focal points. The surface must remain coherent through FORMATION, PLAYER_FOCUS, ACTION, IMPACT, REACTION and RETURN, including push-in, pull-back, lateral movement and slight angle changes. Distinct from FAR atmosphere and MID environmental structures.

### GENERATION PROMPT

```text
Wide anime 2.5D cyberpunk sports-tech combat arena GROUND surface for BaseWarriors: Meta-Strike, cinematic perspective floor designed as the shared physical combat surface beneath four playable characters and one enemy, large readable surface planes, clear depth lanes and directional perspective, subtle near mid far separation, broad actor support areas, abstract baseball-inspired arena geometry without a traditional baseball field layout, reinforced sport-tech floor panels, restrained energy tracks, training-zone motifs and layered surface seams, compatible with runtime ramps and platforms without baking them into the artwork, camera-safe composition for formation, player focus, action, impact, reaction and return, readable character silhouettes and clean foot placement, controlled visual density, stylized anime shonen presentation, cinematic 2.5D depth, cool cyan and magenta sports-tech lighting accents, no characters, no UI, designed as a stage floor rather than promotional illustration.
```

### NEGATIVE PROMPT

```text
No characters, no UI, no text, no logos, no watermark, no screenshot, no third-party likeness, no photorealism, no semirealistic 3D, no traditional baseball field dominating composition, no baseball diamond dominating composition, no bases, no pitcher mound, no batter box, no runner lanes, no crowd of people, no giant central object, no excessive texture noise, no tiny repeated detail, no high-frequency micro-detail, no busy pattern beneath actor feet, no dominant focal point at center, no baked-in PLAYER_RAMP, no baked-in CENTER_PLATFORM, no baked-in ENEMY_PLATFORM, no baked-in FRONT_STEP, no fixed camera-frame crop.
```

## Target and intake

The operator supplies only the original generated source in:

```text
tools/art_studio/inbox/AR-T086-STAGE-GROUND-01/
```

The repository determines:

```
STAGE_GROUND
→
stage.ground
→
assets/stages/combat-stage--ground--wide.png
```

The operator does not choose the production filename, target path or drop zone.

## Validation

T086 validates:

- request exists and remains `REQUESTED`;
- asset kind is `STAGE_GROUND`;
- runtime slot is `stage.ground`;
- camera is `WIDE`;
- composition is `GROUND`;
- target root is `assets/stages/`;
- filename and drop zone are deterministic;
- wrong runtime slot is rejected;
- wrong target is rejected;
- unsafe target paths are rejected;
- wrong format is rejected by request semantics;
- undersized source is rejected;
- controlled fixture intake reaches `VALIDATED`;
- the fixture target is written only inside the temporary test root;
- no production ground PNG is created by the test.

## Fixture proof

The fixture uses:

```text
tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg
```

as the controlled source material, but routes it through a new `STAGE_GROUND` request in a temporary root.

This proves production semantics without creating a fake production asset.

## Physical art readiness

```text
REQUEST = REQUESTED
PHYSICAL ART = NOT_READY
VISUAL QA = NOT_READY
```

A request is not physical art. The target PNG must remain absent until an original external source is supplied through the intake boundary.

## IMPLEMENTED vs NOT IMPLEMENTED

### IMPLEMENTED

- GROUND production request.
- `stage.ground` runtime semantics.
- Deterministic routing and naming.
- Request validation.
- Fixture compatibility.
- Documentation and test coverage.

### NOT IMPLEMENTED

- Physical ground artwork.
- Runtime ground asset loading.
- Complete CombatStage art set.
- FOREGROUND request.
- Final visual polish.
- Visual production approval.
- Aiko integration.

## Gameplay boundary

T086 does not modify:

```
damage
HP
turns
Timing Ring
Ultimate
combat resolution
rewards
economy
gacha
progression
save
```

No changes are made to CombatStage, CombatRenderer or CombatPresentationDirector behavior.

## QA status

```
BROWSER QA: NOT_RUN
VISUAL QA: NOT_READY
```

## Next checkpoint

Only one next task is selected:

```
T087 · COMBAT STAGE FOREGROUND ART REQUEST
```

This is the correct next production-request slice because no equivalent FOREGROUND request is present in the current pipeline.

