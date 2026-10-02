# T077-R · Combat Vision Reconciliation

## Purpose

This document records the architectural reconciliation completed after T077.

Canonical product model:

> BaseWarriors: Meta-Strike is a cinematic 2.5D anime character-combat game where baseball is the thematic and functional language of attacks, abilities, timing and combat identity.

This task is an architecture decision record, not a gameplay rebalance or a request for a new combat simulator.

## Repository state audited

Repository: `jonhararagi/baseball-waifus`
Branch: `main`
HEAD at audit: `d2289f69812b36f51092643758372893580f9fe1`

Normative direction remains in `docs/reglas-irrompibles-del-juego.md`.
That document was not modified.

## Current game model

The repository currently contains several active or semi-active combat representations.

### WebApp combat

`webapp/js/combat.js` is a mixed runtime. It owns:

- legacy combat flow;
- 5-turn tactical progression;
- Climax and Timing Ring;
- damage and HP state transitions;
- combat rendering;
- BatterRenderer;
- CombatEffects;
- CombatPresentationDirector;
- HUD and reward callbacks.

The visible combat scene is still strongly baseball-oriented. The current match renderer draws:

- a baseball diamond;
- home / first / second / third;
- batter;
- pitcher;
- strike zone;
- runners;
- inning and half;
- baseball result labels.

Therefore T077 currently adds cinematic camera behavior on top of a baseball-match composition. It does not yet establish a true character-combat stage.

### Godot baseball core

`game/baseball/game_state.gd` is explicitly baseball-simulation state.

It owns:

- inning;
- half;
- outs;
- strikes;
- balls;
- score;
- three bases;
- base runners;
- batting indices;
- game-over / winner.

`game/baseball/baseball_simulator.gd` resolves:

- pitch zone probability;
- contact probability;
- timing grades;
- batted-ball results;
- hit distance classes;
- fielding candidates;
- home runs and other baseball outcomes.

`game/baseball/runner_system.gd`, fielding systems and the match event scheduler reinforce this baseball-first model.

This is a real gameplay system, not merely presentation.

### Student 4V4

The repository already contains a deterministic 4-role battle foundation:

`webapp/js/student_4v4_battle_state.js`
`webapp/js/student_4v4_combat_adapter.js`
`webapp/js/student_4v4_presentation_orchestrator.js`

The role order is:

`BUFFER → HEALER → DEBUFFER → BATTER`

The state layer consumes role results and converges them into a combat result.

The associated documentation still classifies the broader Student 4V4 model as FUTURE / PROPOSAL.

This system is useful as a gameplay boundary reference, but it is not yet the final cinematic combat stage.

### Kytos

Kytos is a working boss-combat vertical slice and is visually closer to the desired combat grammar.

It already represents:

- a central enemy;
- a batter;
- three support actors;
- energy-ball movement;
- transfer;
- attack;
- emergency;
- victory;
- deterministic presentation state.

However, the Kytos system is explicitly isolated and boss-specific. Its presentation uses bases and support positions and should not be silently generalized into the canonical combat architecture.

### Existing actor and animation infrastructure

Godot already contains reusable visual actor infrastructure:

- `AnimeAvatar2D`;
- `AvatarMotionController`;
- `AvatarTrajectoryController`;
- `AvatarRendererFactory`;
- `AvatarMatchPresenter`;
- `BaseballFieldAvatarPresenter`.

`AvatarMatchPresenter` creates separate batter and pitcher visual actors and maps gameplay events/results to poses.

`BaseballFieldAvatarPresenter` supports multiple defensive actors, temporary runners, movement trajectories and result-based reactions.

This is strong reusable presentation infrastructure, but the current actor taxonomy is still baseball-role-oriented rather than scene-combat-oriented.

### Existing 3D experiment

`game/avatar3d/pixel_3d_match_stage.gd` and `Pixel3DBaseballCharacter` prove that a Node3D staging experiment exists.

The stage can place a batter in 3D space and play:

`READY → LOAD → SWING → FOLLOW_THROUGH`

with a 3D ball trajectory.

This is an experiment and test surface, not a reason to migrate the product to 3D.

## Corrected game model

The canonical presentation loop is:

```
FORMATION
→ CHARACTER FOCUS
→ ACTION
→ BASEBALL ATTACK
→ PROJECTILE / SWING / CONTACT
→ IMPACT
→ ENEMY REACTION
→ RETURN
```

The player should perceive characters as actors inside a combat stage.

The baseball vocabulary remains:

- pitch;
- swing;
- bat;
- ball;
- trajectory;
- timing;
- contact;
- fielding.

The game state remains authoritative for results.

Presentation remains downstream.

Canonical architecture:

```
PLAYER DATA
→ GAMEPLAY SYSTEMS
→ BASEBALL / COMBAT RESULT
→ DOMAIN EVENTS
→ PRESENTATION
→ UI / AVATAR / AUDIO / VFX / CAMERA
```

## Classification

### KEEP

**KEEP: normative game direction**

`docs/reglas-irrompibles-del-juego.md` already states the desired combat-first 2.5D direction.

**KEEP: Player Data and roster authority**

Player identity, collection and roster systems already provide the right long-term character ownership boundary.

**KEEP: timing infrastructure**

`webapp/js/timing_ring.js` is reusable as the baseball-themed timing interaction. It should not become the whole combat model.

### REUSE / ADAPT

**REUSE / ADAPT: CombatPresentationDirector**

`webapp/js/combat_presentation_director.js` is the correct starting point for cinematic camera sequencing.

Adapt it from a camera sequence layered over a baseball match renderer into a stage-oriented presentation director.

**REUSE / ADAPT: BatterRenderer**

The batter animation surface is reusable.

Future combat actions should drive it through presentation commands rather than making the batter renderer own gameplay meaning.

**REUSE / ADAPT: AvatarRendererFactory + AnimeAvatar2D + motion controllers**

These provide the correct separation between actor identity and visual implementation.

They should become the visual substrate for CharacterActor-style staging without forcing a new avatar technology.

**REUSE / ADAPT: BaseballBallController and BattedBallEvent**

These are good foundations for baseball-as-combat-language.

The ball becomes a visual combat projectile whose final result is still decided by gameplay.

**REUSE / ADAPT: CombatEffects, audio bridge, haptics**

These are already presentation systems and should be fed by the cinematic event boundary.

**REUSE / ADAPT: Student 4V4 result boundary**

The role-result → combat-result separation is valuable for future canonical combat gameplay.

The role order itself should not become a mandatory cinematic sequence.

**REUSE / ADAPT: Kytos formation concepts**

The existence of an enemy-centered formation is informative for staging, but the Kytos gameplay rules and visual coordinates remain boss-specific.

### FREEZE

**FREEZE: baseball match presentation as the canonical combat composition**

The current diamond / pitcher / batter / inning / runner composition should not receive another layer of expansion as the long-term cinematic model.

It can remain as legacy compatibility while the new stage is introduced deliberately.

**FREEZE: Godot 3D migration**

Do not migrate the product to a full 3D combat renderer.

The current 3D experiment is evidence that 3D is technically possible, not evidence that it is architecturally required.

**FREEZE: Kytos generalization**

Do not turn Kytos-specific shield, energy-transfer or tactical mechanics into universal combat rules without explicit design.

**FREEZE: Student 4V4 role expansion**

Do not add more roles or mechanics until the visual combat model is reconciled.

### REBUILD

**REBUILD: the combat presentation stage abstraction**

The repository currently lacks a canonical, renderer-independent combat stage model containing:

- player actor zone;
- enemy zone;
- actor depth;
- actor scale;
- foreground / midground / background;
- camera anchors;
- action anchors;
- VFX anchors;
- return framing.

This should be reconstructed as a presentation-stage abstraction, not as a second gameplay engine.

**REBUILD: only the scene composition layer**

The current WebApp stage is still a baseball field illustration with character placement.

The next rebuild should target the composition layer:

```
COMBAT STAGE
├── BACKGROUND
├── MIDGROUND
├── PLAYER ZONE
├── ENEMY ZONE
├── FOREGROUND
├── CAMERA SPACE
└── ACTOR ANCHORS
```

The baseball field remains available as thematic geometry inside the stage, not as the mandatory spatial grammar.

## Map / Stage status

**PARTIAL / BLOCKOUT**

The current WebApp scene can produce a stylized baseball environment with a horizon/grid treatment and a diamond. This creates some depth cues, but it is not yet a filmable combat stage.

Observed limitations:

- depth is primarily implied by 2D scaling and composition;
- actor positions are hard-coded around baseball locations;
- no formal player-zone / enemy-zone contract exists;
- no formal foreground / midground / background layer contract exists;
- no actor depth coordinate is part of the canonical WebApp combat model;
- camera focus is currently pan/zoom over the existing match scene;
- parallax is not yet a stage-level contract;
- there is no canonical enemy staging abstraction independent from pitcher semantics.

The stage should therefore be treated as BLOCKOUT, not final.

## Camera status

**PARTIAL / FOUNDATION**

T077 added a reusable camera sequence with:

- attacker focus;
- action;
- impact;
- target reaction;
- return;
- zoom;
- pan;
- easing;
- deterministic transitions;
- cancellation fallback.

This is a valid foundation.

The missing piece is stage-aware targeting.

The camera currently receives abstract ATTACKER / TARGET / COMBAT focus labels rather than resolving explicit actor anchors in a multi-actor cinematic stage.

Therefore the next camera task is not a new camera engine. It is stage-anchor integration.

## Character Actor status

**PARTIAL**

The repository has visual actors and motion control, but no canonical cross-runtime CharacterActor contract.

Current reality:

```
PlayerData
→ AvatarProfile
→ AnimeAvatar2D / external renderer
→ pose / motion
```

The desired direction is:

```
Character identity
→ Combat Actor
→ position / depth / scale / anchors
→ visual renderer
→ pose / animation
```

The actor layer should remain presentation-only.

Enemy actors need the same level of staging support.

## Baseball system status

**KEEP AS GAMEPLAY LANGUAGE / FREEZE AS PRIMARY PRESENTATION MODEL**

The baseball gameplay systems are substantial and tested.

They contain genuine baseball simulation concepts that may remain useful where the design requires them.

However, these systems must no longer define the visual structure of combat.

The future canonical relation is:

```
BASEBALL MECHANIC
→ COMBAT ACTION
→ COMBAT RESULT
→ PRESENTATION
```

not:

```
BASEBALL MATCH
→ INNING
→ PITCH
→ HIT
→ SCORE
```

for every combat action.

## Combat status

**PARTIAL / MIXED**

The repository already has:

- 5-turn tactical progression;
- combat result calculation;
- Timing Ring;
- character batter presentation;
- Kytos combat slice;
- Student 4V4 result boundary;
- cinematic camera foundation.

The contradiction is that the primary WebApp combat renderer still presents the action as a baseball match.

The next phase should therefore separate:

```
GAMEPLAY RESULT
```

from:

```
FILMABLE COMBAT PRESENTATION
```

without throwing away the existing gameplay authority.

## Vertical slice definition

The correct next vertical slice is intentionally small:

```
1 FILMABLE COMBAT STAGE
+
4 CHARACTER ACTORS
+
1 ENEMY ACTOR
+
1 NORMAL BASEBALL ATTACK
+
1 CINEMATIC ULTIMATE
+
CAMERA FOCUS
+
IMPACT
+
ENEMY REACTION
+
RETURN
```

The slice should prove only the presentation architecture first.

### Normal attack

```
FORMATION
→ CHARACTER_FOCUS
→ SWING / ATTACK
→ BALL / CONTACT
→ IMPACT
→ ENEMY_REACTION
→ RETURN
```

### Ultimate

```
FORMATION
→ CHARACTER_FOCUS
→ CINEMATIC_STAGING
→ CHARACTER_ACTION
→ BASEBALL-BASED PROJECTILE / IMPACT
→ ENEMY_REACTION
→ RETURN
```

The Ultimate is presentation choreography at this stage.

Damage, victory, shields or special mechanics are not invented here.

## Evidence classification

**PASS_REAL**

- current GitHub `main` HEAD verified;
- current repository files and history inspected;
- T077 browser proof had previously been executed successfully on the current T077 branch history;
- repository workflows were inspected.

**PASS_STATIC**

- canonical game direction verified in normative documentation;
- current combat, baseball, actor and presentation architecture classified from source;
- current stage and camera limitations identified from code.

**PARTIAL**

- combat presentation foundation;
- stage abstraction;
- CharacterActor abstraction;
- camera stage targeting;
- Kytos canonical reuse boundary.

**NOT_READY**

- final cinematic combat presentation;
- final combat stage;
- production enemy actor system;
- full normal-attack choreography;
- full Ultimate choreography.

## Contradictions found

1. The canonical rules are combat-first, but the primary WebApp visual still frames action as a baseball match.

2. The Godot gameplay core remains a genuine baseball simulator. That is acceptable as an underlying mechanic source, but not as the mandatory player-facing combat model.

3. T077 camera sequencing exists, but it operates over the existing match composition rather than an explicit combat stage.

4. Batter and pitcher actors exist, but the actor abstraction is coupled to baseball roles rather than a general filmable combat-stage contract.

5. Student 4V4 provides a useful result boundary, but its role sequence should not become the visual sequence of every combat.

6. Kytos is the closest existing visual proof of enemy-centered combat staging, but it contains boss-specific mechanics that must remain isolated.

7. The existing Godot 3D stage proves a possible 3D experiment, but nothing observed requires a product-wide migration from the preferred 2D / 2.5D stack.

## Recommended next task

# T078 · COMBAT 2.5D STAGE + ACTOR ANCHOR FOUNDATION

Scope:

- create the reusable combat-stage presentation model;
- define player and enemy actor anchors;
- introduce X/Y/depth/scale as presentation data;
- define background/midground/foreground layers;
- adapt CombatPresentationDirector to consume stage anchors;
- keep Canvas 2D / existing renderer;
- keep gameplay authoritative and unchanged;
- provide one 4-player + 1-enemy staging proof;
- no new gameplay mechanics;
- no balance changes;
- no new baseball simulator;
- no Kytos expansion;
- no Student 4V4 expansion;
- no Aiko dependency.

Definition of success:

```
FORMATION
→ CHARACTER FOCUS
→ ACTION
→ IMPACT
→ ENEMY REACTION
→ RETURN
```

must be visually representable against an explicit filmable combat stage.

The implementation should then make T079 possible without rebuilding the camera architecture.

## References

Normative direction:
https://github.com/jonhararagi/baseball-waifus/blob/main/docs/reglas-irrompibles-del-juego.md

Presentation architecture:
https://github.com/jonhararagi/baseball-waifus/blob/main/docs/presentation-2d-architecture.md

WebApp combat:
https://github.com/jonhararagi/baseball-waifus/blob/main/webapp/js/combat.js

Combat result:
https://github.com/jonhararagi/baseball-waifus/blob/main/webapp/js/combat_core.js

T077 presentation director:
https://github.com/jonhararagi/baseball-waifus/blob/main/webapp/js/combat_presentation_director.js

Actor presentation:
https://github.com/jonhararagi/baseball-waifus/blob/main/game/avatar/avatar_match_presenter.gd

Field presentation:
https://github.com/jonhararagi/baseball-waifus/blob/main/game/avatar/baseball_field_avatar_presenter.gd

Godot baseball state:
https://github.com/jonhararagi/baseball-waifus/blob/main/game/baseball/game_state.gd

Godot simulator:
https://github.com/jonhararagi/baseball-waifus/blob/main/game/baseball/baseball_simulator.gd

Kytos working vertical slice:
https://github.com/jonhararagi/baseball-waifus/blob/main/webapp/js/kytos_combat_vertical_slice.js
