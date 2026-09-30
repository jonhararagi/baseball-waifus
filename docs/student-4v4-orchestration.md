# Student 4v4 Orchestration Foundation

**Status:** IMPLEMENTED / VERIFIED FOUNDATION

## Integrated architecture

PLAYER INPUT → ROLE GAMEPLAY → ROLE_RESULT → Student4v4Orchestrator → STUDENT_4V4_RESULT → COMBAT_RESULT adapter → PRESENTATION

The closed Student 4v4 foundation uses the real T034 Buffer, T035 Healer, T036 Debuffer, and T037/T039 Batter modules through `Student4v4BattleState` and `Student4v4Orchestrator`. The legacy `Student4v4Integration` compatibility state machine was removed during T054 because it duplicated the authoritative battle-state path.

## Fixed integration order

1. BUFFER
2. HEALER
3. DEBUFFER
4. BATTER
5. COMBINED RESULT

All four roles receive the same integration seed. This is required by the existing orchestrator contract, which rejects mixed role seeds. The seed therefore propagates unchanged through every ROLE_RESULT and into the combined result.

## Combined result

The existing T038 formula remains authoritative:

- `combinedScore` = sum of role scores.
- `combinedAccuracy` = arithmetic mean of role accuracies.
- `energyContribution` = Buffer `energy_points`.
- `protectionContribution` = Healer `protectedPoints`.
- `disruptionContribution` = Debuffer `disruptionPoints`.
- `impactContribution` = Batter `impactPoints`.

No Kytos formula or common combat core was modified.

## T044 presentation orchestration

`Student4v4PresentationOrchestrator` is a presentation-only boundary over `Student4v4BattleState.snapshot()`.

The presentation pipeline is:

GAMEPLAY STATE → `Student4v4PresentationOrchestrator` → `STUDENT_4V4_PRESENTATION_STATE` → future UI / renderer / animation / audio

The orchestrator never advances a battle, executes a role, calculates score, generates RNG, or modifies any ROLE_RESULT, STUDENT_4V4_RESULT, or COMBAT_RESULT. It creates isolated frozen snapshots containing the current phase, derived `activeRole`, completed roles, role status, role results, combined result, and combat result.

Presentation events are descriptive only: `BATTLE_STARTED`, `ROLE_STARTED`, `ROLE_COMPLETED`, `RESOLUTION_STARTED`, `BATTLE_COMPLETED`, and `BATTLE_RESET`. They contain no gameplay commands.

## Playable development demo

`webapp/student_4v4_demo.html` is isolated from the normal application flow. It executes the real T034 Buffer, T035 Healer, T036 Debuffer, and T037/T039 Batter through `Student4v4BattleState`; `Student4v4PresentationOrchestrator` remains presentation-only. RESTART resets both gameplay and presentation snapshot history.

The demo UI does not calculate gameplay results.

## Validation

The role and battle-state tests cover deterministic gameplay and integration. `student_4v4_presentation_orchestrator_test.mjs` additionally proves role progression, resolution, completion, reset, deterministic presentation snapshots, snapshot isolation/freeze, descriptive events, and absence of gameplay side effects.

## Visual QA boundary

Student 4v4 integration and presentation orchestration are implemented in the webapp JavaScript layer. The existing Godot Visual QA pipeline targets Godot scenes and cannot execute these JavaScript role systems without introducing a second gameplay implementation. T044 therefore does not add a parallel Godot combat implementation or fake a Godot PASS. Browser/webapp visual QA remains a separate environment concern.

## Scope boundary

T054 closure boundary: Student 4v4 sequential foundation/vertical slice is closed and verified. Future work remains concurrent 4v4 interaction, PvP, matchmaking, ranking, progression, deckbuilding, economy, professionals, Valkyrias, humanoid Kytos, definitive balance, and final product UI.

No canon changes are made.
