# T084 · CombatStage Art Intake Slice

## Purpose

T084 creates the first real production request for the CombatStage 2.5D art pipeline. It uses the T083 Art Request / AI Asset Intake foundation and does not replace the runtime CombatStage or create a second stage asset system.

## Implemented

- Production request: `AR-T084-STAGE-BG-FAR-01`
- Asset kind: `STAGE_BACKGROUND_FAR`
- Runtime semantic slot: `stage.background.far`
- Camera intent: `WIDE`
- Composition: `BACKGROUND`
- Format: `PNG`
- Minimum resolution: `2048 × 1152`
- Deterministic filename: `combat-stage--background--far--wide.png`
- Deterministic target: `assets/stages/combat-stage--background--far--wide.png`
- Deterministic drop zone: `tools/art_studio/inbox/AR-T084-STAGE-BG-FAR-01/`
- Stage-specific runtime-slot validation
- Fixture-based intake proof using the existing T083 controlled source path
- Backward-compatible optional `runtime_slot` field in the T083 request schema

## Production request card

### WHAT IS EXPECTED

An original production far-background plate for the BaseWarriors: Meta-Strike CombatStage 2.5D. The asset establishes distant arena scale and cinematic depth while preserving readable negative space for the characters, enemy, camera and foreground.

### CAMERA

`WIDE`

The image is a backplate for the FAR layer, not a gameplay camera view. It must remain coherent while the CombatPresentationDirector moves between formation, player focus, action, impact, reaction and return.

### COMPOSITION

`BACKGROUND`

Deep background, large readable silhouettes, atmospheric layering, usable negative space and no dominant foreground object. No characters are required.

### SUBJECT

`combat-stage`

### ENVIRONMENT

A cyberpunk sports-tech combat arena at stadium scale, treated as a deep background plate rather than a conventional baseball field.

### VISUAL NOTES

Anime, stylized, cinematic and 2.5D-ready. Use distant architecture, field-light structures, scoreboard-inspired forms without readable text and energy lanes to suggest sports technology. Baseball may be suggested atmospherically, but the image must not reinstate the old universal diamond, bases or pitcher/batter layout.

### GENERATION PROMPT

```text
Wide anime 2.5D cyberpunk sports-tech combat arena background plate for BaseWarriors: Meta-Strike, distant stadium-scale architecture, layered atmospheric depth, readable large silhouettes, cinematic negative space for four character combatants and one enemy, subtle baseball-inspired sports-tech architecture, field-light structures, scoreboard-like architecture without readable text, energy lanes, cool cyan and magenta accents, stylized anime shonen presentation, designed specifically as a FAR background layer with subtle parallax and filmable camera movement, no characters.
```

### NEGATIVE PROMPT

```text
No characters, no UI, no text overlays, no watermark, no logos, no camera frame, no giant foreground props, no baseball diamond composition, no bases layout, no pitcher mound, no batter box, no runners, no third-party character likeness, no game screenshot recreation, no dominant object centered over the combatants.
```

## Depth contract

The request belongs only to the existing:

```text
BACKGROUND
  ↓
FAR
  ↓
stage.background.far
```

The request does not redefine the runtime layer system. T078/T079 CombatStage remains the authority for:

```text
BACKGROUND
MIDGROUND
GROUND
FOREGROUND
```

## Intake contract

The operator places the original generated file unchanged in:

```text
tools/art_studio/inbox/AR-T084-STAGE-BG-FAR-01/
```

The T083 intake tool computes the production filename and target path. The operator does not choose either.

For the real production request the only accepted production format is PNG as recorded by the request, with a minimum of 2048×1152.

A test fixture may use the same `STAGE_BACKGROUND_FAR` semantics with a controlled SVG in CI. The fixture remains outside `assets/stages/` in the test's temporary root.

## Implemented vs not implemented

Implemented:

- real T084 production request
- request schema compatibility
- deterministic runtime-slot semantics
- deterministic target routing
- deterministic naming
- deterministic drop zone
- stage-specific request validation
- fixture-based stage intake proof
- documentation

Not implemented:

- final background artwork
- physical production PNG
- runtime loader changes
- complete CombatStage art set
- MIDGROUND, GROUND or FOREGROUND production requests
- final background visual QA
- automatic external AI generation
- Aiko integration
- new rendering or parallax systems

## Production readiness

Current physical-art state:

```text
REQUEST = REQUESTED
PHYSICAL ART = NOT_READY
```

The request is valid and ready for an external art-generation handoff. Approval must wait for the original physical source, validation and runtime proof.
