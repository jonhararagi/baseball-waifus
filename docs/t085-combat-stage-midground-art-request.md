# T085 · CombatStage Midground Art Request

## Purpose

T085 creates the second production request for the existing CombatStage 2.5D art supply chain. It reuses the T083 Art Studio / intake foundation and complements, but does not replace, `AR-T084-STAGE-BG-FAR-01`.

## Implemented

- Production request: `AR-T085-STAGE-BG-MID-01`
- Asset kind: `STAGE_BACKGROUND_MID`
- Runtime semantic slot: `stage.background.mid`
- Camera intent: `WIDE`
- Composition: `MIDGROUND`
- Production format: PNG
- Minimum resolution: `2048 × 1152`
- Deterministic filename: `combat-stage--background--mid--wide.png`
- Deterministic target: `assets/stages/combat-stage--background--mid--wide.png`
- Deterministic drop zone: `tools/art_studio/inbox/AR-T085-STAGE-BG-MID-01/`
- Stage runtime-slot semantics are inherited from the generic T083 request tool.
- Fixture intake proves the same MID semantics in a temporary root without writing production assets.

## Relationship to FAR

`AR-T084-STAGE-BG-FAR-01` remains the source of truth for the FAR production request:

```text
FAR = distant atmosphere / backplate
MID = readable environmental structures / spatial landmarks
```

T085 does not redefine the CombatStage layer model. Runtime remains authoritative for `BACKGROUND`, `MIDGROUND`, `GROUND` and `FOREGROUND`.

## Production request card

### WHAT IS EXPECTED

An original production midground environment layer for the BaseWarriors: Meta-Strike CombatStage 2.5D. It supplies readable secondary arena structures behind the combat actors and must remain distinct from the distant FAR backplate.

### CAMERA

`WIDE`

The image supports the full stage and must remain coherent as the CombatPresentationDirector moves through formation, player focus, action, impact, reaction and return. It is not a fixed gameplay camera view.

### COMPOSITION

`MIDGROUND`

Use large readable structures, deep overlapping forms, controlled visual density and negative space around the actors. The request uses the schema's dedicated MIDGROUND vocabulary so the request field matches the CombatStage visual role directly.

### DEPTH ROLE

```text
FAR BACKPLATE
      ↓
MIDGROUND STRUCTURES
      ↓
PLAYERS / ENEMY
      ↓
GROUND / FOREGROUND
```

### SUBJECT / ENVIRONMENT

`combat-stage`

Cyberpunk sports-tech combat arena at midground depth, with tiered arena structures, elevated walkways, large structural beams, energy rails and stadium-scale silhouettes. Baseball is atmospheric identity only, not the spatial grammar.

### VISUAL NOTES

Prioritize large shapes, layered depth cues, readable silhouettes and camera-tolerant perspective lines. The midground must never compete with the characters or enemy and must not behave like a flat wallpaper.

### GENERATION PROMPT

```text
Wide anime 2.5D cyberpunk sports-tech combat arena MIDGROUND for BaseWarriors: Meta-Strike, secondary environmental structures at readable mid distance, tiered arena architecture, elevated walkways, large industrial-sport structural beams, subtle digital advertising panels with no readable text, energy rails, stadium-scale silhouettes, strong layered depth between a distant FAR background and the combat actors, cinematic negative space around four characters and one enemy, controlled visual density, cool cyan and magenta sports-tech energy, stylized anime shonen presentation, built for subtle parallax and filmable camera movement across formation, character focus, action, impact, reaction and return, no characters.
```

### NEGATIVE PROMPT

```text
No characters, no UI, no text overlays, no readable advertising copy, no watermark, no logo, no game screenshot, no third-party character likeness, no baseball diamond composition, no bases, no pitcher mound, no batter box, no runner lanes, no foreground obstruction, no giant central object, no character-shaped silhouettes, no photorealism, no semirealistic 3D look, no tiny clutter.
```

## Target and intake

The operator supplies only the original generated source in:

```text
tools/art_studio/inbox/AR-T085-STAGE-BG-MID-01/
```

The tool determines:

```text
STAGE_BACKGROUND_MID
        ↓
stage.background.mid
        ↓
assets/stages/combat-stage--background--mid--wide.png
```

The operator does not choose the production filename or target path.

## Validation and fixture proof

The T085 tests verify:

- request exists and is `REQUESTED`;
- runtime slot equals `stage.background.mid`;
- target root is `assets/stages/`;
- filename and drop zone are deterministic;
- FAR request remains unchanged;
- wrong runtime slot is rejected;
- wrong target is rejected;
- unsafe target paths are rejected;
- wrong format metadata is rejected by the request contract;
- undersized physical source files are rejected by the existing image validator;
- a controlled SVG fixture can traverse `GENERATED → IMPORTED → VALIDATED` under MID semantics in a temporary root;
- no production `assets/stages/` file is created by the fixture test.

## Aiko and gameplay boundary

Aiko / `bw001` is untouched. `AR-T083-AIKO-BW001-01` remains `REQUESTED` and still requires the original physical asset.

T085 does not modify CombatStage runtime, combat resolution, damage, HP, turns, Timing Ring, Ultimate, rewards, economy, gacha, progression or save state.

## Implemented vs not implemented

### Implemented

- real MIDGROUND production request
- deterministic `stage.background.mid` slot semantics
- deterministic routing and naming
- stage-specific validation coverage
- fixture compatibility
- documentation

### Not implemented

- physical MIDGROUND production artwork
- runtime loader changes
- complete CombatStage art set
- GROUND / FOREGROUND requests
- final visual approval
- automatic external AI generation
- Aiko integration

## Production readiness

```text
REQUEST = REQUESTED
PHYSICAL ART = NOT_READY
```

The request is ready for external generation. Approval remains blocked until a real physical source crosses the intake and validation boundary.
