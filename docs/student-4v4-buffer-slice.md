# T034 · Buffer / Energy Creator Executable Slice

> Status: WORKING IMPLEMENTATION / DESIGN PROPOSAL
>
> This slice proves the T033 role boundary in executable code. It is not a final balance specification and does not create narrative canon.

## Scope

T034 implements only the `BUFFER / ENERGY CREATOR` role for the future Student 4v4 system.

```text
PLAYER INPUT
    ↓
BUFFER MINI-GAME
    ↓
ROLE_RESULT
    ↓
COMBAT_RESULT
    ↓
PRESENTATION
```

The slice is isolated from Kytos gameplay and does not alter the existing Kytos combat formulas.

## Reused infrastructure

- `webapp/js/timing_ring.js` is reused by the Buffer presentation for timing-ring geometry/progress.
- `webapp/js/combat_core.js` is reused only for the existing `COMBAT_RESULT` type contract.
- The combat-specific CI workflow is reused instead of creating a second workflow.

No second Combat Core, timing system or global renderer is introduced.

## Gameplay contract

`BufferEnergyCreator` owns only Buffer mini-game state:

- deterministic note sequence;
- lane identity (`LIGHT`, `MEDIUM`, `HEAVY`);
- deterministic timing windows;
- accepted/rejected player inputs;
- per-note grade (`PERFECT`, `GREAT`, `GOOD`, `MISS`);
- score and slice-local energy points;
- final `ROLE_RESULT`.

The current energy values and thresholds are implementation-slice values only. They are `FUTURE / PROPOSAL`, not final balance.

## Input safety

The gameplay object rejects:

- unknown note IDs;
- non-numeric timestamps;
- input after completion;
- input when no active note exists.

Rejected input does not advance the note sequence or mutate the authoritative result.

## Combat adapter

`buffer_combat_adapter.js` converts a completed Buffer `ROLE_RESULT` into the existing `COMBAT_RESULT` shape. It does not call or alter `resolveKytosHit()`, shield logic, timing logic or Kytos damage formulas.

This is intentionally an adapter boundary. The future 4v4 combat resolver may later replace or extend this adapter once the complete student combat contract is designed.

## Presentation

`BufferEnergyCreatorPresentation` renders the active lane, timing-ring feedback, grade and final energy result. It imports timing geometry from `timing_ring.js` and never owns Buffer gameplay state.

`buffer_demo.html` is a development-only isolated entry point. It does not modify the normal application flow or persistent game state.

## Determinism

The sequence is generated from an explicit seed. No `Math.random()` or hidden randomness is used.

```text
same seed + same input timestamps + same note sequence
=
same ROLE_RESULT
```

## Open questions carried forward

- Whether `ROLE_RESULT` remains a distinct production contract or becomes a specialized `COMBAT_RESULT` subtype.
- Final Buffer energy formulas and balance.
- Final note density, lane patterns and timing windows.
- How Buffer energy interacts with the simultaneous/ordered roles in the complete 4v4 match.
- Whether the production demo should be exposed through the main app's query-parameter demo router or remain an isolated development entry.

## Not implemented

- Healer
- Debuffer
- new Batter role
- complete Student 4v4 combat
- deckbuilding/cards
- progression
- professional combat
- Valkyria combat
- humanoid Kytos combat
- economy/rewards
- narrative/canon changes
