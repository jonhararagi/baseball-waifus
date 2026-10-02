# T087 · CombatStage Foreground Art Request

## Purpose

T087 creates the fourth and final production request in the current CombatStage 2.5D stage-art sequence. It reuses the T083 Art Studio / AI Asset Intake foundation and adds only the request, validation coverage and documentation needed to hand off a physical foreground asset later.

The production sequence is:

\`\`\`
FAR
→
MID
→
GROUND
→
FOREGROUND
\`\`\`

The FOREGROUND is a **near-camera cinematic framing layer**, not another background. Its job is to make the camera feel physically close to the stage while preserving combat legibility.

## IMPLEMENTED

- Production request: \`AR-T087-STAGE-FOREGROUND-01\`
- Status: \`REQUESTED\`
- Asset kind: \`STAGE_FOREGROUND\`
- Runtime semantic slot: \`stage.foreground\`
- Camera intent: \`WIDE\`
- Composition: \`FOREGROUND\`
- Production format: \`PNG\`
- Minimum resolution: \`2048 × 1152\`
- Deterministic filename: \`combat-stage--foreground--wide.png\`
- Deterministic target: \`assets/stages/combat-stage--foreground--wide.png\`
- Deterministic drop zone: \`tools/art_studio/inbox/AR-T087-STAGE-FOREGROUND-01/\`
- Existing T083 runtime-slot and deterministic-routing logic reused unchanged.
- Production request validation for slot, target, filename, format contract and safe paths.
- Fixture intake coverage through \`STAGE_FOREGROUND\` in a temporary test root.
- Negative coverage for wrong runtime slot, wrong target, wrong filename, unsafe target, wrong source format, undersized source and ambiguous source.
- FAR, MID and GROUND requests remain independently routed.
- Aiko / \`bw001\` remains untouched.
- No runtime CombatStage changes are introduced.

## Foreground role

The intended presentation stack is:

\`\`\`
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
\`\`\`

The foreground supplies:

- camera proximity;
- depth and parallax cues;
- scale relationships;
- edge framing;
- limited partial occlusion;
- cinematic near-space energy.

It is a **framing device**, not a main subject and not a replacement for the FAR, MID or GROUND layers.

## Camera

\`WIDE\`

The source image is composed broadly enough to survive existing presentation routes:

\`\`\`
FORMATION
PLAYER_FOCUS
ACTION
IMPACT
REACTION
RETURN
\`\`\`

and:

\`\`\`
push-in
pull-back
lateral movement
small framing adjustments
\`\`\`

The foreground must not depend on a rigid crop or a single fixed camera rectangle.

## Composition

\`FOREGROUND\`

Use large near-camera elements that may be partially cropped by the frame. Suitable abstract examples include:

- structural beams;
- arena edge architecture;
- near-camera lighting rigs;
- large translucent energy panels;
- partial industrial frames;
- near-camera railings;
- large sports-tech architectural silhouettes.

These elements should live primarily in the outer frame, corners or upper/lower edge bands.

They must not fill the scene or become the visual focus.

## Near-camera behavior and partial occlusion

The foreground is allowed to introduce:

- edge framing;
- corner framing;
- partial side obstruction;
- upper/lower cinematic framing.

Protected areas are:

\`\`\`
hero character
enemy
bat
projectile path
impact area
reaction area
\`\`\`

No foreground element should obscure a character face, the active bat, the projectile path or the impact anchor. The central actor silhouette remains protected during combat actions.

The production rule is:

> **The foreground may frame the fight. It must not hide the fight.**

## Camera-safe zones

Conceptually:

\`\`\`
SAFE
outer frame
corners
edge regions

PROTECTED
hero character
enemy
bat
projectile
impact area
reaction area
\`\`\`

No editor, mask system or runtime safety grid is added by T087. These are production composition rules for the external art handoff.

## Action readability

The visual route must remain readable as:

\`\`\`
BAT
→
PROJECTILE
→
ENEMY.IMPACT
\`\`\`

especially during ACTION, IMPACT and REACTION.

The foreground therefore avoids strong central objects, dense texture, character-like forms and any obstruction over the projectile or impact region.

## 2.5D depth relationship

Foreground is the closest stage-art layer and should provide the visual cue that a real near-space element sits between the camera and the actors.

The intended stack is:

\`\`\`
FAR
= distant atmosphere

MID
= environmental structures

GROUND
= shared physical combat surface

ACTORS
= character combatants

FOREGROUND
= near-camera framing
\`\`\`

This reinforces:

- near / mid / far separation;
- parallax;
- scale relationships;
- camera motion;
- occlusion.

The artwork must coexist with runtime presentation geometry such as \`PLAYER_RAMP\`, \`CENTER_PLATFORM\`, \`ENEMY_PLATFORM\` and \`FRONT_STEP\`, but must not bake those structures into the image.

## Relationship to FAR / MID / GROUND

### FAR

\`AR-T084-STAGE-BG-FAR-01\` remains:

\`\`\`
STAGE_BACKGROUND_FAR
→
stage.background.far
→
distant atmosphere / backplate
\`\`\`

T087 does not duplicate its atmospheric role.

### MID

\`AR-T085-STAGE-BG-MID-01\` remains:

\`\`\`
STAGE_BACKGROUND_MID
→
stage.background.mid
→
readable environmental structures
\`\`\`

T087 does not turn near-camera framing into another environmental background.

### GROUND

\`AR-T086-STAGE-GROUND-01\` remains:

\`\`\`
STAGE_GROUND
→
stage.ground
→
shared combat surface
\`\`\`

T087 does not bake ground geometry, ramps, platforms or steps into the foreground artwork.

## Visual target

Identity:

\`\`\`
ANIME
+
CYBERPUNK
+
SPORTS-TECH
+
COMBAT
+
2.5D
\`\`\`

The foreground should feel large because it is close to camera, not because it is visually louder than the characters.

Baseball identity may appear through abstract sports-tech arena language such as stadium lighting, rails, training-arena framing and ballpark-inspired architecture.

Do not use bases, pitcher mound, batter box, diamond, foul lines or runner lanes as the foreground's main visual grammar.

Avoid human-like silhouettes, mascot forms, mannequins and face-like structures.

## Generation prompt

\`\`\`text
Wide anime 2.5D cyberpunk sports-tech combat arena FOREGROUND layer for BaseWarriors: Meta-Strike, designed as a near-camera cinematic framing device physically positioned between the camera and the combat actors, large partially cropped arena architecture along outer edges and corners, structural beams, sports-tech rails, stadium lighting structures, translucent energy panels and abstract industrial-sport silhouettes, strong near-space depth cues, readable occlusion at the scene edges, protected clear space for four playable characters, one enemy, bat, projectile path, impact area and reaction area, compatible with FAR, MID, GROUND and runtime presentation geometry without baking gameplay geometry into the art, camera-safe composition for formation, player focus, action, impact, reaction and return, tolerant of push-in, pull-back, lateral movement and slight framing changes, restrained baseball-inspired sports-tech architecture, stylized anime shonen presentation, cinematic 2.5D parallax and scale relationships, cool cyan and magenta energy accents, visually subordinate framing with no central focal obstruction and no characters.
\`\`\`

## Negative prompt

\`\`\`text
No characters, no UI, no text, no readable signage, no logos, no watermark, no screenshot, no third-party likeness, no photorealism, no semirealistic 3D, no traditional baseball field, no baseball diamond, no bases, no pitcher mound, no batter box, no runner lanes, no crowd, no human silhouettes, no mascot silhouettes, no central obstruction, no face-like shapes, no obstruction over playable characters, no obstruction over enemy, no obstruction over bat, no obstruction over projectile path, no obstruction over impact area, no excessive micro-detail, no noisy texture, no fixed camera crop, no baked-in PLAYER_RAMP, no baked-in CENTER_PLATFORM, no baked-in ENEMY_PLATFORM, no baked-in FRONT_STEP, no giant central object, no dominant focal point, no character-shaped architectural forms.
\`\`\`

## Target and intake

The operator supplies only the original generated source in:

\`\`\`
tools/art_studio/inbox/AR-T087-STAGE-FOREGROUND-01/
\`\`\`

The repository determines:

\`\`\`
STAGE_FOREGROUND
→
stage.foreground
→
assets/stages/combat-stage--foreground--wide.png
\`\`\`

The operator does not manually choose the production filename, target path or drop zone.

## Validation

T087 covers:

- request exists and remains \`REQUESTED\`;
- asset kind is \`STAGE_FOREGROUND\`;
- runtime slot is \`stage.foreground\`;
- camera is \`WIDE\`;
- composition is \`FOREGROUND\`;
- target root is \`assets/stages/\`;
- filename and drop zone are deterministic;
- wrong runtime slot fails;
- wrong target fails;
- wrong filename fails;
- unsafe target fails;
- wrong source format fails;
- undersized source fails;
- ambiguous source fails;
- controlled fixture intake reaches \`VALIDATED\`;
- the fixture target is written only in the temporary test root;
- the production foreground PNG is never created by the fixture.

## Physical art readiness

\`\`\`
REQUEST = REQUESTED
PHYSICAL ART = NOT_READY
VISUAL QA = NOT_READY
\`\`\`

The request is a production handoff, not physical art. Prompt text, schema or fixture output does not count as visual production evidence.

## Aiko and gameplay boundary

Aiko / \`bw001\` remains independent of the foreground request.

T087 does not change:

- combat;
- damage;
- HP;
- turns;
- Timing Ring;
- Ultimate;
- combat resolution;
- rewards;
- gacha;
- economy;
- progression;
- save state.

It does not modify \`CombatStage\`, \`CombatRenderer\` or \`CombatPresentationDirector\`.

## IMPLEMENTED vs NOT IMPLEMENTED

### IMPLEMENTED

- FOREGROUND production request.
- \`stage.foreground\` runtime-slot semantics through the existing T083 mapping.
- Deterministic routing and naming.
- Validation and negative-path coverage.
- Fixture compatibility.
- Documentation.

### NOT IMPLEMENTED

- Physical foreground artwork.
- Runtime foreground asset loading.
- Final CombatStage art.
- Visual approval.
- Runtime visual proof.
- Aiko integration.
- New stage geometry, parallax or renderer systems.

## QA state

\`\`\`
BROWSER QA = NOT_RUN
VISUAL QA = NOT_READY
\`\`\`

CI is the validation checkpoint for this request and test coverage. CI success does not imply that physical foreground art exists or has visual approval.

## Next checkpoint

Because T084, T085, T086 and T087 currently define requests without physical stage art in \`assets/stages/\`, the next single checkpoint is:

\`\`\`
T088 · COMBAT STAGE ART REQUEST CONSISTENCY REVIEW
\`\`\`

This review should compare the four layer specifications as one visual production set before another physical intake is requested.
