# Student 4v4 Combat Foundation

> Status: IMPLEMENTED / VERIFIED FOUNDATION
>
> T054 closure: the four role slices and sequential Student 4v4 resolution are implemented and Browser-QA verified. This document remains the architectural proposal/contract boundary; definitive competitive rules are still future work.
>
> This document defines the architecture boundary for the future student 4v4 competitive combat system. It is a design foundation, not an implementation specification for the complete combat system and not confirmed narrative canon.

## Scope

The future student combat format is a 4v4 competitive encounter in which all four active characters participate through distinct role-based arcade/rhythm interactions.

The intended pipeline is:

```text
PLAYER INPUT
      ↓
ROLE MINI-GAME
      ↓
GAMEPLAY RESULT
      ↓
COMBAT RESULT
      ↓
EVENTS
      ↓
PRESENTATION
```

The critical invariant is that presentation consumes gameplay results. UI, animation, VFX, audio and renderer code must not calculate damage, HP, shield, victory, defeat, energy or timing outcomes.

This document records only the architecture needed to implement that pipeline later. Exact balance values, formulas, encounter rules and final UX remain open unless explicitly marked otherwise.

## Current implementation audit

The repository already contains reusable combat infrastructure that should remain the foundation rather than be duplicated:

- `webapp/js/combat_core.js`: existing deterministic combat-result calculations and the `COMBAT_RESULT` contract. It currently serves the existing combat/Kytos flows and must not be replaced by a second combat core.
- `webapp/js/combat.js`: existing combat orchestration/rendering integration, including `BatterRenderer`, `CombatEffects`, `CombatHUD`, timing integration and Kytos presentation wiring.
- `webapp/js/batter_renderer.js`: existing batter presentation state machine. A future 4v4 Batter role should reuse/adapt this renderer rather than create another batter animation system.
- `webapp/js/timing_ring.js`: existing timing infrastructure. The future Batter role should reuse it where its interaction contract fits instead of introducing a parallel timing implementation.
- `webapp/js/combat_effects.js`: existing combat feedback/effects layer. Role results should feed it through presentation events rather than creating role-specific duplicate effect frameworks.
- `webapp/js/kytos_combat_vertical_slice.js`, `kytos_combat_presentation.js` and `kytos_combat_demo.js`: the working Kytos boss slice. These remain a separate boss-combat path.
- `webapp/js/kytos_tactical_decision.js`: the current Kytos-specific tactical decision layer. Its decisions must not be silently generalized into the student 4v4 role system.
- `webapp/js/api.js`: existing combat DTO validation and API boundary. Future network-facing 4v4 contracts should extend existing DTO conventions rather than bypassing them.

No new 4v4 combat implementation is introduced by this task.

## Student 4v4 model

### Status

`FUTURE / PROPOSAL`

A student match contains four active roles:

```text
TEAM A                         TEAM B

BATTER / LEADER                BATTER / LEADER
HEALER / DEFENSIVE SUPPORT     HEALER / DEFENSIVE SUPPORT
BUFFER / ENERGY CREATOR        BUFFER / ENERGY CREATOR
DEBUFFER / DISRUPTOR           DEBUFFER / DISRUPTOR
```

The four roles are gameplay responsibilities, not necessarily permanent character classes. A future roster/configuration layer may assign characters to these roles, but T033 does not define roster rules.

## Role contracts

The role contracts below describe the minimum responsibility boundary. They deliberately avoid final formulas.

### 1. BATTER / LEADER

`FUTURE / PROPOSAL`

Purpose: direct offensive pressure and the most immediate player-vs-opponent interaction.

Proposed interaction:

```text
opponent action / ball
        ↓
   timing target
        ↓
PLAYER INPUT
        ↓
PERFECT / GREAT / GOOD / NORMAL / BAD
        ↓
ROLE GAMEPLAY RESULT
```

The visual fantasy is a direct power duel in which the ball can travel between sides. A stronger timing result may create a more favorable combat result, while an exceptionally aligned interaction may permit a more spectacular clash presentation.

The exact mapping from timing grade to damage, pressure, energy or other combat values is `OPEN QUESTION`.

Reuse target: `BatterRenderer`, `timing_ring.js`, existing combat result/effects contracts.

### 2. HEALER / DEFENSIVE SUPPORT

`FUTURE / PROPOSAL`

Purpose: protect the team and manage defensive recovery.

Proposed interaction:

```text
incoming impact
        ↓
vulnerable / cracked zones
        ↓
PLAYER CURSOR / TOUCH
        ↓
BLOCK / REPAIR RESULT
        ↓
GAMEPLAY RESULT
```

Good interaction should preserve or potentially restore defensive resources. Poor interaction should allow greater shield deterioration.

Exact shield values, repair formulas, hit counts, recovery limits and failure states are `OPEN QUESTION`.

This role must not directly mutate a shield bar in UI code. It produces a gameplay result consumed by the combat state.

### 3. BUFFER / ENERGY CREATOR

`FUTURE / PROPOSAL`

Purpose: generate or modify favorable team energy through rhythm interaction.

Proposed interaction:

```text
LIGHT   MEDIUM   HEAVY
  ↓       ↓        ↓
       RHYTHM NOTES
             ↓
        PLAYER INPUT
             ↓
       TIMING RESULT
             ↓
       ENERGY RESULT
```

The three lanes are part of the proposed interaction model. Exact note patterns, scoring windows, energy generation and chaining rules are `OPEN QUESTION`.

Presentation may communicate positive or negative character reactions to performance. Those reactions are presentation-only and must not become a generative personality or dialogue system.

Reuse target: existing timing/input/effects infrastructure where compatible.

### 4. DEBUFFER / DISRUPTOR

`FUTURE / PROPOSAL`

Purpose: interfere with the opponent's state by intercepting hostile or unstable energy.

Proposed interaction:

```text
incoming dark / violet energy
             ↓
       PLAYER CONTROL
             ↓
        INTERCEPT
             ↓
       CAPTURE METER
             ↓
       GAMEPLAY RESULT
```

A race or threshold condition may determine which side gains an advantage, but the exact meter size, capture rate, failure behavior and advantage formula are `OPEN QUESTION`.

The player-controlled object is presentation/input surface only. Capture success belongs to gameplay.

## Common role result contract

`FUTURE / PROPOSAL`

Every role mini-game should converge into a common gameplay result shape rather than directly manipulating shared combat state.

Conceptual shape:

```js
{
  type: "ROLE_RESULT",
  match_id: "...",
  turn_id: "...",
  role: "BATTER | HEALER | BUFFER | DEBUFFER",
  action: "role-specific-action",
  grade: "role-specific-result",
  deltas: {
    energy: 0,
    shield: 0,
    pressure: 0
  },
  events: [],
  deterministic: true
}
```

This is a conceptual contract, not a request to add a production DTO in T033.

Rules:

1. The role mini-game emits a result.
2. A gameplay resolver applies that result to authoritative combat state.
3. The resolver emits a combat result/event.
4. Presentation consumes that result.
5. No renderer writes authoritative state.

The exact field set should be finalized when the first real role mini-game is implemented. `OPEN QUESTION`: whether the final production contract should reuse/extend `COMBAT_RESULT` directly or introduce a small role-result layer before combat resolution.

## Event boundary

`FUTURE / PROPOSAL`

The preferred flow is:

```text
Role input
   ↓
Role resolver
   ↓
ROLE_RESULT
   ↓
Combat resolver
   ↓
COMBAT_RESULT
   ↓
Presentation events
   ↓
Renderer / HUD / Audio / VFX
```

Examples of presentation-facing events may include:

- `BALL_CONTACT`
- `SHIELD_BLOCKED`
- `SHIELD_DAMAGED`
- `ENERGY_GAINED`
- `ENERGY_MODIFIED`
- `DISRUPTION_CAPTURED`
- `TIMING_GRADE`
- `CLASH`

These names are proposals only. They are not implemented event types and are not canon.

## Determinism

`FUTURE / PROPOSAL`

For a fixed initial combat state and identical player inputs:

```text
same state + same inputs = same role results + same combat result
```

Role mini-games must not use hidden randomness. If randomness becomes necessary in a future design, it must be explicitly seeded and owned by gameplay, never by presentation.

The deterministic test target should eventually cover:

- identical role input sequence produces identical results;
- different valid role choices can produce different results where the design requires consequence;
- presentation replay does not mutate the authoritative result;
- invalid role input is rejected safely and deterministically.

## Presentation boundary

`FUTURE / PROPOSAL`

Presentation systems may:

- display the active role;
- render timing targets;
- animate balls, notes, shields and characters;
- play audio and VFX;
- show result labels;
- react to combat events;
- expose input controls.

Presentation systems may not:

- calculate damage;
- decide whether a block succeeded;
- decide shield HP;
- decide energy gain;
- decide victory/defeat;
- alter timing grades;
- introduce random outcomes.

This preserves the architecture already validated by the Kytos vertical slice.

## Student 4v4 versus Kytos

These are separate combat layers:

```text
STUDENT 4v4
    ↓
Competitive combat
    ↓
Role-based arcade/rhythm mini-games

KYTOS
    ↓
Boss combat
    ↓
Existing Kytos framework
```

The existing Kytos boss framework remains the source of truth for Kytos encounters. T033 does not refactor it into the student framework and does not make the student framework a replacement for Kytos combat.

Shared low-level infrastructure is desirable when contracts genuinely match, such as timing, effects, rendering utilities and deterministic test conventions. Shared infrastructure must not imply shared gameplay rules.

## Future professional layer

`FUTURE / PROPOSAL`

Professional fights should reuse the student 4v4 framework:

```text
STUDENT 4v4
    ↓
PROFESSIONAL 4v4
```

Potential future modifiers include:

- greater energy;
- greater durability;
- somewhat longer encounters;
- one or two additional mechanics for selected opponents;
- level requirements;
- equipment requirements;
- scaled rewards.

The preferred implementation is configuration/encounter data/modifiers/progression requirements over the student combat framework. Do not create a separate `ProfessionalCombatSystem` unless a later technical requirement proves the shared architecture insufficient.

None of these mechanics are implemented or confirmed canon by T033.

## Future Valkyria layer

`FUTURE / PROPOSAL`

A Valkyria presented as a boss should reuse the Kytos-style boss framework:

```text
KYTOS BOSS FRAMEWORK
        ↓
VALKYRIA BOSS ENCOUNTER
```

T033 does not create Valkyria combat or alter the Kytos implementation.

`OPEN QUESTION`: which Valkyria-specific mechanics, if any, should be represented as boss-framework encounter configuration rather than new systems.

## Future humanoid Kytos layer

`FUTURE / PROPOSAL`

Humanoid Kytos may eventually use a combat format closer to student 4v4, while ordinary Kytos remain on the boss framework:

```text
ordinary Kytos → Kytos boss framework
humanoid Kytos → potentially 4v4-adjacent framework
```

The exact classification and implementation boundary are `OPEN QUESTION` and depend on future gameplay and narrative requirements. T033 does not implement this layer.

## Testing foundation

No executable 4v4 mini-game tests are added in T033 because the mini-games and their gameplay contracts do not yet exist. Creating tests that only assert proposed constants would provide little architectural value.

When the first role is implemented, the test contract should cover at minimum:

- valid role identity;
- valid input normalization/rejection;
- deterministic result generation;
- authoritative state changes occurring only in gameplay;
- presentation consuming results without mutation;
- compatibility with the shared combat-result contract.

The existing combat test infrastructure remains the intended CI home for future role tests when executable code is introduced.

## Open questions

These remain intentionally unresolved:

1. Is `ROLE_RESULT` a separate contract or a specialized `COMBAT_RESULT` subtype?
2. What is the authoritative turn/order model for four simultaneous roles?
3. Are all four role mini-games resolved sequentially, in parallel windows, or in a hybrid schedule?
4. How does Batter timing interact with energy generated by Buffer and disruption created by Debuffer?
5. How exactly does Healer shield recovery interact with incoming opponent pressure?
6. What is the final shared input abstraction for mouse, touch and keyboard/controller support?
7. Which existing timing implementation can be reused unchanged for each role, and where are distinct timing contracts genuinely required?
8. What constitutes a round, exchange and victory condition for student 4v4?
9. Can a character's role change between encounters without making roles permanent character classes?
10. Which presentation events should become stable contracts rather than internal implementation details?

Until these questions are resolved by a later implementation/design task, they remain `OPEN QUESTION` and must not be silently converted into gameplay rules.

## Not part of T033

The following remain outside this task:

- complete 4v4 combat;
- complete role mini-games;
- competitive balance;
- matchmaking;
- deckbuilding;
- collectible cards;
- elements;
- AI;
- progression;
- rewards/economy;
- SaveSystem integration;
- professional implementation;
- Valkyria implementation;
- humanoid Kytos implementation;
- narrative changes;
- roster changes;
- gacha changes;
- Kytos gameplay changes.

## Status summary

| Layer | Status | T033 action |
|---|---|---|
| Kytos boss combat | IMPLEMENTED / WORKING | Preserve |
| Student 4v4 | IMPLEMENTED / VERIFIED FOUNDATION | Preserve architecture; future product systems remain separate |
| Batter | IMPLEMENTED / WORKING SLICE | Preserve isolated role contract |
| Healer | IMPLEMENTED / WORKING SLICE | Preserve isolated role contract |
| Buffer | IMPLEMENTED / WORKING SLICE | Preserve isolated role contract |
| Debuffer | IMPLEMENTED / WORKING SLICE | Preserve isolated role contract |
| Professional 4v4 | FUTURE / PROPOSAL | Document relationship only |
| Valkyria boss | FUTURE / PROPOSAL | Document reuse only |
| Humanoid Kytos | FUTURE / PROPOSAL | Document possible relationship only |

## Implementation guardrails

Before any future 4v4 implementation:

```text
REUSE existing infrastructure
        ↓
ADAPT existing contracts where appropriate
        ↓
EXTEND only when a real gap is demonstrated
        ↓
CREATE new systems only as a last resort
```

The student framework must remain deterministic, testable, GitHub Pages compatible, and separate from the Kytos boss rules.
