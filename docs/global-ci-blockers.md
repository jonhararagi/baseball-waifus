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