# Student 4v4 Orchestration Foundation

**Status:** IMPLEMENTED / VERIFIED FOUNDATION

## Integrated architecture

PLAYER INPUT → ROLE GAMEPLAY → ROLE_RESULT → Student4v4Orchestrator → STUDENT_4V4_RESULT → COMBAT_RESULT adapter → PRESENTATION

The implemented T042 integration uses the real T034 Buffer, T035 Healer, T036 Debuffer, and T037/T039 Batter modules. `Student4v4Integration` owns only sequence control and result collection. It does not calculate role scoring, timing, energy, protection, disruption, impact, damage, or victory.

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

## Playable development demo

`webapp/student_4v4_demo.html` is isolated from the normal application flow. START begins the real Buffer role. Each EXECUTE action completes the current real role with deterministic perfect inputs and advances to the next role. After Batter, the real `Student4v4Orchestrator` resolves the four results and the existing Student 4v4 adapter produces a `COMBAT_RESULT`. RESTART reconstructs all four role instances from the same seed.

The demo UI is presentation only. It does not calculate gameplay results.

## Validation

`student_4v4_integration_test.mjs` proves that all four role systems emit `ROLE_RESULT`, the orchestrator consumes them, the combined result converts to the existing `COMBAT_RESULT`, the presentation model consumes the result, repeated runs with the same seed are identical, a different seed is propagated to role instances, and reset clears the integrated result.

## Visual QA boundary

Student 4v4 integration is implemented in the webapp JavaScript layer. The existing Godot Visual QA pipeline targets Godot scenes and cannot execute these JavaScript role systems without introducing a second gameplay implementation. T042 therefore does not add a parallel Godot combat implementation or fake a Godot PASS. Browser/webapp visual QA remains a separate environment concern.

## Scope boundary

Future: concurrent 4v4 interaction, turn/battle orchestration beyond this sequential integration, PvP, matchmaking, ranking, progression, deckbuilding, economy, professionals, Valkyrias, humanoid Kytos, and definitive balance.

No canon changes are made.
