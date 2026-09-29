# Student 4v4 Orchestration Foundation

**Status:** WORKING IMPLEMENTATION / DESIGN PROPOSAL

T038 composes the four isolated Student 4v4 role results without introducing a second combat core.

## Architecture

```text
BUFFER ROLE_RESULT ─┐
HEALER ROLE_RESULT ─┤
DEBUFFER ROLE_RESULT├─> Student4v4Orchestrator
BATTER ROLE_RESULT ─┘          |
                               v
                       STUDENT_4V4_RESULT
                               |
                               v
                    COMBAT_RESULT adapter
                               |
                               v
                    presentation model
```

The orchestrator consumes completed role results. It does not execute timing, input, scoring, damage, healing, energy generation, or disruption gameplay.

## Resolution order

The fixed deterministic order is:

1. BUFFER
2. HEALER
3. DEBUFFER
4. BATTER
5. Combined result

There are no turns or concurrent role simulations in T038.

## Contract

`STUDENT_4V4_RESULT` contains the seed, optional team snapshot, the four frozen role results, each role's contribution, combined score/accuracy, success, and `deterministic: true`.

The first working formula is intentionally simple:

- `combinedScore` = sum of the four role scores.
- `combinedAccuracy` = arithmetic mean of the four role accuracies, rounded to an integer.
- `energyContribution` = Buffer `energy_points`.
- `protectionContribution` = Healer `protectedPoints`.
- `disruptionContribution` = Debuffer `disruptionPoints`.
- `impactContribution` = Batter `impactPoints`.
- `success` = true when at least one validated role reports success.

These values are implementation-level design proposals, not final balance and not narrative canon.

## Validation

The orchestrator rejects missing roles, duplicate roles, malformed role results, mismatched seeds, non-deterministic role results, and a second resolution after completion. Input role results are never mutated.

`reset()` clears the orchestrator resolution state so the same seed and role results can be resolved again identically.

## Kytos separation

The Student 4v4 layer imports only the existing `COMBAT_RESULT` type for its adapter. It does not modify `combat_core.js`, Kytos formulas, `resolveKytosHit()`, or Kytos presentation/gameplay.

Kytos remains on its existing boss-combat framework. Student 4v4 is a separate composition layer.

## Future / Proposal

The following remain outside T038 and are not implemented: full 4v4 battle UI/orchestration, PvP, matchmaking, ranking, progression, deckbuilding, economy, professionals, Valkyrias, humanoid Kytos, advanced AI, tournaments, and definitive balance.

No canon changes are made by this implementation.
