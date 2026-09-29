# Global Art Pipeline Audit

Status: `WORKING / PROPOSAL`. Audited against `main` on 2026-09-29.

## Scope

This document records reusable repository infrastructure for a future production asset pipeline. It does not generate assets, change character canon, or establish new gameplay rules.

## Existing source of truth

The canonical gameplay/identity source remains:

`game/characters/character_archetypes.json`

The existing visual pipeline already separates character data from presentation through `AvatarProfile`, `AvatarEquipment`, `AnimeAvatar2D`, the procedural 3D renderer, and the avatar services described in the existing visual-system documents.

Existing production metadata also exists in:

- `data/characters_queue.json`
- `game/characters/character_archetypes.json`
- `game/characters/character_archetype_catalog.gd`

These should remain data sources, not generated-art output.

## Existing generation and preparation tools

### IMPLEMENTED

`tools/character_ai/` already contains reusable building blocks:

- `prompt_builder.py`
- `roster_prompt_builder.py`
- `style_presets.json`
- `model_catalog.json`
- `model_profiles.json`
- `benchmark_models.py`
- `comfy_client.py`
- `generate_service.py`
- `generate_svg_roster.py`
- `generate_motion_svg_roster.py`
- `validate_roster.py`
- `test_motion_svg_roster.py`
- `workflow_sdxl.json`

The repository also contains deterministic generated SVG roster prototypes under `assets/characters/generated/`, production raster fixtures under `assets/production/`, UI assets under `assets/ui/`, and visual references under `assets/art_reference/`.

### IMPLEMENTED / TECHNICAL QA

The repository already has:

- Visual QA scenes and headless capture via `game/ui/visual_qa_exporter.gd`.
- Dedicated Godot Visual QA workflow: `.github/workflows/visual_qa.yml`.
- Production artwork validation in `.github/workflows/deploy-pages.yml`.
- Canonical roster/generation queue tests for production targets.

These are reusable technical-QA foundations, not a substitute for human/editor approval.

## Existing external generation

`tools/generate_production_artwork.py` uses the Pollinations image endpoint for production raster generation.

Status: `BLOCKED_EXTERNAL` when generation is required and the provider returns HTTP 402 Payment Required.

The Pages workflow checks committed production fixtures first. It does not fabricate provider responses and does not bypass asset validation. If a future target is missing, the remote generator remains a real external dependency.

## Proposed future production flow

```
CHARACTER DATA
      ↓
VISUAL IDENTITY
      ↓
PROMPT TEMPLATE
      ↓
GENERATION
      ↓
TECHNICAL QA
      ↓
IDENTITY QA
      ↓
HUMAN / EDITOR APPROVAL
      ↓
APPROVED ASSET
      ↓
ASSET LIBRARY
      ↓
GAME INTEGRATION
```

A future asset record should distinguish at least:

- `character_base`
- `variant` / skin
- `portrait`
- `cutin`
- `cg`
- `background`
- `ui`
- `equipment`
- `vfx`
- `emote`
- `boss_art`

The pipeline should preserve a stable character identity across derived resources. Rarity, skin, equipment and character identity must remain separate data concepts.

## Reuse model

Preferred dependency direction:

```
approved character base
 ├─ portrait
 ├─ combat cut-in
 ├─ card
 ├─ expressions / emotes
 └─ narrative CG references
```

A skin should derive from an approved identity reference rather than becoming an unrelated character image. The same rule applies to portraits, cut-ins and cards whenever the production toolchain supports reference conditioning.

## Identity QA

Future automated checks should validate metadata and technical constraints such as:

- character ID;
- asset type;
- expected dimensions;
- file format;
- transparency requirements;
- missing/corrupt files;
- prohibited external references;
- stable naming;
- variant linkage.

Identity consistency still requires human/editor review. Automated checks must not silently approve visual drift.

## Dependency boundaries

The game runtime must not depend on a generation provider.

Generation tools may be local or external, but shipped gameplay should consume approved assets and existing visual contracts.

Potential future local tooling already documented by the repository includes ComfyUI for concept generation and open rigging paths such as Inochi2D and VRM/Three.js. No model weights or third-party assets should be redistributed without license review.

## Missing infrastructure

The repository does not yet provide a complete production-scale asset registry with approval state, immutable asset versions, provenance/licence records, automated identity comparison, and editor approval workflow.

Those are future pipeline work, not part of this audit.

## Status vocabulary

- `IMPLEMENTED`: exists and is exercised by the repository.
- `WORKING`: usable foundation, not yet a full production service.
- `PROPOSAL`: documented future architecture.
- `PENDING`: known work not yet implemented.
- `BLOCKED_EXTERNAL`: blocked by an external provider/service/account.
- `UNKNOWN`: insufficient evidence to classify.

## Scope guard

No roster, character stats, rarity, canon, gameplay, Kytos system, Student 4v4 system, NarrativeRuntime, SaveSystem, economy, gacha, Telegram or PWA behavior is changed by this document.
