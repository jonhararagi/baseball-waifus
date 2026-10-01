# BaseWarriors: Meta-Strike Character Asset Factory

## Purpose

The character asset factory converts canonical character data plus an externally generated source asset into deterministic, reviewable runtime assets.

The repository owns:

`input -> validation -> processing -> manifest -> report`

External generation is offline and provider-agnostic. OpenArt, Runway, Figma, or another provider may produce source material, but no provider API is required by the game or by the runtime asset resolver.

## Canonical authority

Character identity comes from `game/characters/character_archetypes.json`. T067 does not create new characters and does not replace that authority.

The asset manifest at `data/character_asset_manifest.json` is the production mapping for visual assets. It describes asset coverage and status, but it is not a second gameplay character database.

## Asset contract

Each character entry contains:

- `character_id`
- `display_name`
- `rarity`
- `role`
- `position`
- `play_identity`
- `visual_identity`
- `asset_set`

Each asset entry contains a path and one of `MISSING`, `DRAFT`, `READY`, or `VALIDATED`.

Required identity consistency is checked against the canonical character source when the factory validates the manifest.

## Processing contract

Supported source formats:

- SVG for existing vector art and deterministic composition.
- PNG/JPEG for externally generated raster art.

Raster processing uses Pillow when processing is requested. Validation of PNG headers, SVG dimensions, paths, duplicate paths, character IDs, and manifest contracts does not require network access.

Processing never edits or deletes the source file.

For raster assets, the factory can normalize:

- crop
- center
- scale
- padding
- RGBA/RGB output

Transparency is checked only where the asset contract requires it. The factory does not assume that an external generator supplied a clean alpha channel.

SVG assets are copied as deterministic runtime assets or composed into deterministic presentation wrappers. No automatic character deformation is performed.

## Quality gate

`MISSING -> DRAFT -> READY -> VALIDATED`

READY means the file exists and satisfies the production shape contract. VALIDATED additionally means the complete manifest validation has passed.

A valid file extension alone is never a production pass.

## Vertical slice

T067 demonstrates the factory with canonical character `bw001 / Aiko Hanamori`, selected because the repository already contains canonical metadata plus existing generated portrait and expression assets.

The slice intentionally does not generate new character content. It composes:

- portrait: existing `assets/characters/generated/bw001.svg`
- card: deterministic presentation wrapper
- battle idle: deterministic runtime wrapper
- alternate expression: existing `bw001_neutral.svg`
- presentation: deterministic profile wrapper

This proves the production chain without pretending that missing battle-action, cut-in, victory, defeat, story, or event art already exists.

## Consistency rules

Across portrait, card, battle, expression, and future cut-ins, preserve:

- canonical silhouette and body preset
- hair color and hair style
- eye color
- uniform identity
- character accent palette
- role/position visual motif
- framing appropriate to the asset type

Generation prompts should reuse the same character identity block and differ only in pose, camera, expression, or presentation purpose.

Do not imitate a named external franchise.

## Runtime boundary

The game consumes committed runtime assets. Generation credentials and provider URLs never enter gameplay code. Asset production is build-time/offline.

## Commands

From repository root:

`python tools/character_asset_factory.py validate`

`python tools/character_asset_factory.py report`

`python tools/character_asset_factory.py process --character bw001`

The process command is deterministic for committed SVG inputs and deterministic parameters. External image generation happens before the factory and is intentionally outside the reproducibility guarantee.

## CI

The asset validation workflow runs the manifest validation and factory tests. It is a quality gate, not an image generator.
