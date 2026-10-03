# T121 · FOUR-ACTOR 2.5D FORMATION FOUNDATION

**Fecha:** 2026-10-03

**HEAD BEFORE:** `84b3eaa84fb4e2269677af77e3bc05047548eaf3`

**HEAD AFTER:** `b2be8cec88ffeb54928906be7e3b476200a1d941`

## Estado

Implementation committed on `main`.

## Foundation

`CharacterFormation2D5` reuses the existing `CharacterActor2D5` foundation and provides exactly four presentation slots.

Each slot preserves:

- position
- depth
- scale
- rotation
- facing
- visibility

Lifecycle:

`CREATE → POPULATE → PRESENT → CLEAR`

## Actor isolation

The formation is `presentationOnly`. It does not decide damage, target, hit/miss, combat result, victory, defeat, reward or persistence.

The unit test focuses Actor 2 through:

`FOCUS → ACTION → RETURN → IDLE`

and verifies that the other three actors retain their presentation transforms and visibility.

## QA

Local Node validation performed:

- `node --check` on formation implementation: PASS
- `node --check` on formation test: PASS
- isolated formation behavior test with a contract-compatible Actor harness: PASS

The repository's existing browser/Actions infrastructure was not expanded for T121. No new workflow was created.

## Preserved constraints

`T118-R = BLOCKED / UNCHANGED`

No reward, persistence, gacha, economy, Timing Ring, combat-result mapping, victory, defeat or T118-R workflow changes were made.

## Progress

`≈96,9% → ≈97,1%` structural.
