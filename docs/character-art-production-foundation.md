# Character Art Production Foundation

## T074 contract

The production path is:

`LOCAL ART INPUT → PROJECT ASSET → APPROVED → CHARACTER PRESENTATION → LOCKER PRIMARY ART`

The browser Art Panel is a review/input surface. It is not a Git client and it has no upload authority.

## State meanings

- **MISSING**: no approved project asset is registered for the character.
- **DRAFT**: a local file was selected and/or its local association was saved in browser storage. The file is not in the repository.
- **PROCESSED**: a real project asset exists in the production location but has not been approved for runtime.
- **APPROVED**: the real project asset is present and explicitly registered as approved in `assets/characters/approved/manifest.json`.

The browser must never promote LOCAL ART INPUT to APPROVED.

## Creator workflow

1. Open Art Panel.
2. Select the target character, for example `bw001 · Aiko Hanamori`.
3. Select the real PNG/JPG/JPEG from the device.
4. Inspect the same source over light and dark preview stages.
5. Associate it as a local DRAFT if desired.
6. Incorporate the original file into the repository through the normal development/GitHub workflow. Do not use the browser as an upload client.
7. Verify the physical project path and file format/dimensions.
8. Add or update the corresponding manifest entry only after the physical asset exists.
9. Reopen the Art Panel and confirm PROJECT ASSET / APPROVED.
10. Verify Character Detail and Locker. APPROVED primary art is the only production art eligible for Locker primary presentation; otherwise the existing fallback remains active.

## Aiko status at T074

The procedural/generated SVGs under `assets/characters/generated/` are prototype art and are not an acceptable substitute for final Aiko art. T074 does not copy, rename, convert, or approve them.

If no real production asset has been supplied, the expected state is:

- ART PIPELINE = ready
- AIKO FINAL ART = NOT_READY
- `bw001` = MISSING until a real project asset is supplied and approved

## Expression contract

Profile/primary art and expression assets are separate bindings. T074 does not generate new expressions and does not promote expression assets into primary art.

## Voice

`VOICE PLAYBACK = NOT_READY` remains unchanged.
