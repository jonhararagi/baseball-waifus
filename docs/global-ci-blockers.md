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

Classification: REPO BUGS + CI CONFIGURATION BUG, resolved in T041.

Run 36584777048 (2026-09-29) established the initial symptom: the character-presentation jobs reached their scene command and timed out at the 15s shell guard. The exporter also was not reliably recognizing the custom argument passed after "--"; T041 now reads Godot user arguments explicitly through get_cmdline_user_args().

After that was corrected, the runtime evidence isolated the renderer problem. On GitHub Actions, the capture job used Godot with --headless. Godot reported:

Parameter "t" is null.
at: texture_2d_get (servers/rendering/dummy/storage/texture_storage.h:106)
GDScript backtrace:
[0] _try_capture (res://game/ui/visual_qa_exporter.gd:59)

This proves the capture path was running against Godot's dummy rendering storage, so the viewport texture was not available for PNG capture. The correct CI repair was to run only the screenshot jobs under Xvfb with the project's normal gl_compatibility renderer, while keeping import/contract/generation jobs headless.

Additional isolated repository defects in the same QA block were repaired:
- bw007: PlayerData skill_roles were not loaded from character_identity.skill_roles. The scene assertion exposed the real catalog loader bug. The loader now reads the canonical nested skill-role field.
- bw009: the CI job downloaded Godot from a repository release URL that returned HTTP 404. It now uses the pinned official Godot release URL.
- bw015: the test's watermark assertion was incompatible with the actual prompt contract. The base prompt intentionally contains "no watermark"; the test now validates that phrase and normalizes catalog stat comparisons numerically to avoid JSON number-type equality issues.

Validation run 36587046887, head 4841fc05fa32ed5de4c5e200f0b79e118f9d0fb0, completed successfully for all Visual QA jobs and the accumulated frontend/P10 checks. The character presentation artifacts for bw004-bw012 were produced successfully.

The run also continues to emit unrelated import warnings for the corrupt webapp/assets/icons/icon-512.png and parse errors in situation_evaluator_test.tscn / tactical_calculator_test.tscn during project scanning. Those did not block the repaired Visual QA jobs and were not modified by T041.
