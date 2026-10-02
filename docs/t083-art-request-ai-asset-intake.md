# T083 · Art Request / AI Asset Intake Foundation

## Purpose

T083 adds a repository-oriented request and intake layer above the existing character asset factory.

Production boundary:

    REQUEST
    ↓
    EXTERNAL GENERATION
    ↓
    DROP ZONE
    ↓
    SOURCE VALIDATION
    ↓
    DETERMINISTIC NAME
    ↓
    DETERMINISTIC TARGET
    ↓
    ARCHIVE / TRACE
    ↓
    VALIDATION
    ↓
    APPROVAL

External image generation stays external. This repository does not call an image model API.

## Implemented

- Canonical request schema in tools/art_studio/art_request_schema.json.
- Request registry in tools/art_studio/art_requests.json.
- Explicit request lifecycle:
  REQUESTED → GENERATED → IMPORTED → VALIDATED → APPROVED.
- Validation failures transition to REJECTED with an explicit code and message.
- Deterministic drop zone:
  tools/art_studio/inbox/<request_id>/
- Deterministic source archive:
  tools/art_studio/archive/<request_id>/<original_filename>
- Deterministic target roots and names.
- Safe relative path enforcement.
- Exactly-one-supported-source rule for each drop zone.
- PNG, JPEG and SVG integrity/dimension validation.
- Character compatibility against the canonical character source.
- Reuse of the existing character_asset_factory for canonical lookup, format policy, dimensions and manifest rules.
- Character approval handoff into data/character_asset_manifest.json.
- SHA-256 traceability from original source to archived source and target.
- CLI commands for request creation, list/show, external-generation handoff, ingest, validation and approval/rejection.

## Request card

Every request records the production intent:

    WHAT IS EXPECTED
    CAMERA
    COMPOSITION
    SUBJECT
    ENVIRONMENT
    VISUAL NOTES
    GENERATION PROMPT
    NEGATIVE PROMPT
    FORMAT
    MINIMUM WIDTH / HEIGHT
    TARGET NAME
    TARGET PATH
    DROP ZONE

The person generating the image supplies the art, not the repository naming or routing.

## Camera vocabulary

    FRONT
    3/4_FRONT
    3/4_BACK
    SIDE
    LOW_ANGLE
    HIGH_ANGLE
    WIDE
    MEDIUM
    CLOSE
    TOP
    PROFILE

## Composition vocabulary

    FULL_BODY
    HALF_BODY
    PORTRAIT
    ACTION_POSE
    BATTLE_ACTION
    CUTIN
    BACKGROUND
    MIDGROUND
    GROUND
    FOREGROUND
    PROP
    FX

## Asset kinds

Character requests:

    CHARACTER_PORTRAIT
    CHARACTER_CARD
    CHARACTER_BATTLE_IDLE
    CHARACTER_BATTLE_ACTION
    CHARACTER_CUTIN
    CHARACTER_VICTORY
    CHARACTER_DEFEAT
    CHARACTER_EVENT

Combat Stage readiness:

    STAGE_BACKGROUND_FAR
    STAGE_BACKGROUND_MID
    STAGE_GROUND
    STAGE_FOREGROUND
    STAGE_FX_BACK
    STAGE_FX_FRONT

Generic:

    VFX
    PROP

A test-only stage fixture kind exists exclusively under tools/art_studio/fixtures/ and never routes into production assets.

## State machine

    REQUESTED → GENERATED → IMPORTED → VALIDATED → APPROVED

Any validation-stage failure goes to:

    REJECTED

REJECTED and APPROVED are terminal. The tool does not silently reopen requests.

## Naming and target routing

The tool derives the production filename from structured metadata.

Examples:

    bw001--battle--action--3-4-front.png
    fixture-stage--background--far--wide.svg

The user never supplies target_name, target_path or drop_zone when creating a request.

Target routing is fixed by asset kind:

    CHARACTER_* → assets/characters/approved/
    STAGE_*     → assets/stages/
    VFX         → assets/vfx/
    PROP        → assets/production/
    TEST_*      → tools/art_studio/fixtures/outputs/

Absolute paths and parent traversal are rejected.

## Drop zone and traceability

A generated asset is placed unchanged into:

    tools/art_studio/inbox/<request_id>/

The ingest step requires exactly one supported source file.

The original filename is preserved in the trace. The source is copied to a deterministic archive, then copied to the deterministic target. The original source remains under the request drop zone, so the intake process does not destroy the operator's supplied file.

Each accepted source records:

    filename
    format
    width
    height
    sha256
    drop_path
    archive_path
    target_path

## Validation

The request layer performs:

    request schema validation
    state validation
    safe-path validation
    request compatibility
    supported-format check
    source discovery
    image integrity
    dimensions

For character requests, the existing character asset factory remains authoritative for:

    canonical character lookup
    asset-type format policy
    minimum dimensions
    physical image dimensions

No second character asset factory is introduced.

## Character handoff

Character IDs remain sourced from:

    game/characters/character_archetypes.json

Approval updates the mapped existing entry in:

    data/character_asset_manifest.json

The manifest keeps its existing VALIDATED / REAL_PRODUCTION_ART vocabulary. The request registry owns the separate APPROVED state.

Aiko / bw001 is still not a production asset merely because a request exists. The sample Aiko request remains REQUESTED until a real physical source file is supplied and validated.

## Sample requests

AR-T083-AIKO-BW001-01

    state: REQUESTED
    character: bw001
    format: PNG
    minimum: 1024 × 1536
    camera: 3/4_FRONT
    composition: ACTION_POSE
    target: assets/characters/approved/

This is an actual production request record, not an asset.

AR-T083-FIXTURE-001

    state: GENERATED
    kind: TEST_STAGE_BACKGROUND_FAR
    source: tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg

This is a controlled CI fixture. It must never be treated as production art.

## CLI

    python tools/art_studio/art_request.py create ...
    python tools/art_studio/art_request.py list
    python tools/art_studio/art_request.py show <request_id>
    python tools/art_studio/art_request.py generate <request_id>
    python tools/art_studio/art_request.py ingest <request_id>
    python tools/art_studio/art_request.py validate <request_id>
    python tools/art_studio/art_request.py approve <request_id>
    python tools/art_studio/art_request.py reject <request_id> --reason "..."

Create accepts production semantics only. Target name, final path and drop zone are calculated by the tool.

## Failure handling

Examples:

    missing drop zone
    no supported source
    ambiguous multiple supported sources
    format mismatch
    invalid image
    dimensions below request minimum
    existing target
    unsafe target
    unknown character
    character factory format mismatch

The failed request records:

    failure.code
    failure.message

and moves to REJECTED when the failure happens during an executable lifecycle step.

## Implemented vs not implemented

Implemented:

    request registry
    request schema
    request state machine
    drop-zone contract
    deterministic naming
    deterministic target routing
    source archive and traceability
    validation
    character factory reuse
    character manifest handoff
    CLI
    deterministic tests
    CI

Not implemented:

    automatic external AI generation
    OpenArt / Midjourney / Stable Diffusion integration
    final character artwork
    final stage artwork
    final VFX production
    Aiko final asset integration
    cloud storage
    asset editor GUI
    database migration
    Telegram or mobile integration

T083 is a production-intake foundation. The repository orders and validates the handoff; the human remains responsible for generating and supplying the original art.
