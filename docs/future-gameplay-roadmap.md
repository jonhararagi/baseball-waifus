# Future Gameplay Roadmap

> Status: FUTURE / MAYBE
>
> This document records ideas that should not be treated as implemented systems or confirmed canon. They exist to prevent useful design decisions from being forgotten.

## Professional Fights

Status: FUTURE / PROPOSAL

Professional fights should reuse the normal 4v4 competitive combat framework rather than introduce a separate combat engine.

Core concept:
- Same 4v4 structure and role-based minigames.
- Same fundamental combat rules.
- Professional opponents have more energy and higher durability than ordinary opponents.
- Matches are somewhat longer.
- Some professional opponents introduce one or two additional mechanics.
- Progression through professional tiers requires stronger characters and/or better equipment.
- Equipment and level progression should become practically necessary as the professional difficulty increases.
- Rewards should scale with the professional tier.

Design principle:

```
Student / Normal 4v4
        ↓
Professional 4v4
        ↓
More energy + more durability
        ↓
Longer encounters + occasional extra mechanics
        ↓
Higher level / better equipment requirements
```

The professional layer should preferably be implemented as configuration, encounter data, modifiers, and progression requirements on top of the existing 4v4 combat systems, not as a duplicate `ProfessionalCombatSystem`.

### What is NOT intended

- Not a completely new combat system.
- Not simply an extreme HP sponge.
- Not a mandatory second version of every minigame.
- Not a replacement for the student tournament system.
- Not current implementation.
- Not confirmed story canon.

## Relationship to Other Future Combat Layers

### Student tournaments
FUTURE / PROPOSAL

4v4 competitive combat with active roles:
- Batter / Leader: timing and direct power duel.
- Healer / Defensive Support: shield defense/reflex.
- Buffer / Energy Creator: three-lane rhythm interaction.
- Debuffer / Disruptor: active energy capture.

### Kytos bosses
WORKING IMPLEMENTATION

The existing Kytos boss framework is separate from ordinary 4v4 competitive combat and should remain the basis for Kytos encounters.

### Valkyria boss encounters
FUTURE / PROPOSAL

Valkyrias can use the existing Kytos-style boss framework when presented as boss-like opponents. They do not require a third standard combat engine.

### Humanoid Kytos
FUTURE / PROPOSAL

Humanoid Kytos may use a combat format closer to the 4v4 tournament system, while ordinary Kytos continue using the boss framework.

## Implementation Order

The intended order is:

1. Stabilize and validate the student 4v4 competitive framework.
2. Build professional fights as an extension/configuration of that framework.
3. Add professional progression, level gates, equipment requirements and rewards.
4. Add special professional encounter mechanics selectively.
5. Later expand into Valkyria boss encounters and advanced/humanoid Kytos according to the narrative roadmap.

These items remain future design until an implementation task explicitly promotes them.
