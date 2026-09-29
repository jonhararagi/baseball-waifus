# Global CI Blockers

Status: audited 2026-09-29 on main.

## Cari spriteSheetUrl

Classification: REPO_BUG.

`waifu_database_test.mjs` validates `avatarUrl`, `cardArtUrl`, and `spriteSheetUrl` after resetting the in-memory fallback. The fallback configuration omitted sprite data, while `normalizeCharacter()` already owns a deterministic HTTPS sprite fallback through the existing DiceBear provider.

Fix: `resetWaifuDatabaseToMemory()` now normalizes the fallback configuration instead of cloning it raw. No fake URL or new asset provider was introduced.

## CharacterRosterStore save contract

Classification: REPO_BUG.

`game/characters/character_roster_store.gd` defines `save_state()` without arguments, while `_replace_character()` passed a candidate dictionary to it. The correct existing helper for writing a supplied sanitized snapshot is `_write_state(candidate)`.

Fix: `_replace_character()` now calls `_write_state(candidate)`. The persistence contract itself was not redesigned.

## Production artwork generation

Classification: EXTERNAL / BLOCKED_EXTERNAL when generation is required.

The configured generator in `tools/generate_production_artwork.py` uses the Pollinations image endpoint. The known CI failure is HTTP 402 Payment Required. The repository already contains the required production raster fixtures for the current workflow targets, so the Pages workflow now verifies those committed fixtures first and only invokes the remote generator when a required asset is actually missing.

This does not fake provider responses, bypass validation, or modify the provider. If future production targets are missing and the generator returns HTTP 402, generation remains an external blocker requiring provider/account intervention.

## Browser QA

Browser automation and deployed-site access remain external to this repository environment. Static inspection is not treated as Browser QA.

## Godot Visual QA scene execution

Classification: REPO_BUGS, resolved in T041.

Run 36584777048 (2026-09-29) showed the affected character-presentation jobs reaching the scene command but timing out at the 15s shell guard. The common exporter path attempted ViewportTexture.get_image() before waiting for RenderingServer.frame_post_draw; this could stall the headless capture path, preventing the exporter watchdog from running. T041 changed the exporter to use the existing frame-post-draw capture path directly.

Additional isolated failures in the same run were repository defects:
- bw007: the fixture cast CardScript.new() to BaseballCharacterCard and asserted the result non-null. Runtime evidence showed that cast produced null; the fixture now uses the instantiated Control and the existing setup() contract.
- bw009: the CI job downloaded Godot from a repository release URL that returned HTTP 404. It now uses the pinned official Godot release URL used by the other jobs.
- bw015: the test incorrectly rejected the word watermark in base_prompt, even though the actual prompt intentionally contains no watermark; the policy belongs in negative_prompt, so the assertion now checks that field.

The run also exposed unrelated import warnings for the corrupt webapp/assets/icons/icon-512.png, plus parse errors in situation_evaluator_test.tscn and tactical_calculator_test.tscn. These did not identify the character-scene root cause and were not modified by T041.
