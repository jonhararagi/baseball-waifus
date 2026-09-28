# BaseWarriors: Meta-Strike
# Character Appeal + Fanservice Analysis

> TAREA 010-B
> Research date: 2026-09-28
> Status: PARTIAL
>
> This document deliberately separates repository evidence from design proposals.
> No external market research was available in this execution. Therefore no claim
> about current market performance, player preference, sales, retention, or policy
> is presented as market evidence.

## 1. Evidence boundary

### Repository observations

The repository documentation describes a character-driven baseball game with anime/ecchi presentation, female adult characters, R/SR/SSR/UR rarity, character specializations, elements, progression, training, equipment, happiness/confidence, collection and gacha.

Character cards are documented as reusable components containing portrait, rarity, position, element, specialization and summarized statistics. The UI documentation also describes an independent expressive state for character cards and replaceable portraits.

The Character Creator documentation covers body proportions, hair, face, uniform, colors, cap and baseball poses.

Sources inspected:
- docs/bitacora.md
- docs/ui-style-guide.md
- README.md

Classification: OBSERVATION.

### External market evidence

No external source was available for inspection in this execution.

Classification: UNKNOWN.

Therefore this document does not claim that any particular character-design pattern is currently successful in the market.

## 2. Character Appeal Taxonomy

Character appeal is treated as a composite rather than as a synonym for physical attractiveness.

### Visual identity
Silhouette, face, hair, palette, outfit, accessories and pose language.

Potential functions: immediate recognition, roster differentiation, visual memory and cosmetic variation.
Classification: DESIGN PROPOSAL.

### Personality identity
Speech behavior, humor, confidence, shyness, competitiveness, seriousness, eccentricity and recurring reactions.

Potential functions: characterization, memorability, emotional attachment and differentiation between similar silhouettes.
Classification: DESIGN PROPOSAL.

### Gameplay identity
Combat role, baseball specialization, timing relationship, team contribution and ability identity.

The repository already associates characters with baseball specializations and gameplay statistics.
Classification: OBSERVATION + DESIGN PROPOSAL.

### Relationship identity
Teammates, rivals, mentors, friendships and faction relationships.

Potential functions: context, dialogue opportunities and character development.
Classification: DESIGN PROPOSAL.

### Collection identity
Rarity, alternate cosmetics, event variants, progression states, expressions and character-specific presentation.

The repository documents R/SR/SSR/UR rarity, character cards and replaceable portraits.
Classification: OBSERVATION + DESIGN PROPOSAL.

## 3. Fanservice Taxonomy

Fanservice and character appeal are intentionally separated.

### A. Visual non-sexual fanservice
Expressive poses, exaggerated reactions, celebration animations, humorous gestures, accessories and distinctive outfits.
Potential functions: CHARACTERIZATION, MEMORABILITY, HUMOR, REWARD.
Classification: DESIGN PROPOSAL.

### B. Thematic fanservice
Seasonal events, festival outfits, beach themes, Halloween, Christmas and birthdays.
Potential functions: EVENT ENGAGEMENT, COLLECTION, COSMETICS, CHARACTERIZATION.
Classification: DESIGN PROPOSAL.

### C. Personality fanservice
Embarrassing reactions, rivalry banter, teasing, recurring jokes and exaggerated character habits.
Potential functions: CHARACTERIZATION, HUMOR, COMMUNITY DISCUSSION, EMOTIONAL ATTACHMENT.
Classification: DESIGN PROPOSAL.

### D. Emotional fanservice
Trust scenes, private conversations, friendship progression, personal stories and character-specific milestones.
Potential functions: EMOTIONAL ATTACHMENT, CHARACTERIZATION, COLLECTION.
Classification: DESIGN PROPOSAL.

### E. Suggestive/corporeal fanservice
Revealing outfits, body-emphasis poses, suggestive framing and ecchi situations.
Potential functions: ATTRACT, COSMETIC COLLECTION, EVENT PRESENTATION, CHARACTER APPEAL.
Important limitation: no causal relationship with sales, retention or conversion is asserted.
Classification: DESIGN PROPOSAL.

### F. Explicit sexual content
This is a separate category from fanservice. No explicit-content design is proposed by this document.
Classification: OUTSIDE CURRENT DESIGN SCOPE.

## 4. Functional model

Proposed internal model:

CHARACTER APPEAL -> CHARACTERIZATION -> COLLECTION -> OPTIONAL FANSERVICE

rather than:

FANSERVICE -> CHARACTER

Fanservice should remain one available design instrument instead of becoming the definition of every character.

| Element | Possible function | BaseWarriors direction |
|---|---|---|
| Silhouette | Recognition | Required |
| Face | Recognition/emotion | Required |
| Hair | Recognition/cosmetic variation | Strong |
| Outfit | Identity/cosmetics | Strong |
| Personality | Memorability/attachment | Required |
| Gameplay role | Play relevance | Required |
| Relationships | Attachment/context | Strong |
| Lore | Context | Selective |
| Expressions | Characterization/reward | Strong |
| Skins | Collection/cosmetics | Optional |
| Seasonal themes | Events/collection | Optional |
| Suggestive fanservice | Appeal/cosmetics | Optional |
| Explicit sexual content | Separate category | Not part of this framework |

These are design recommendations, not market measurements.

## 5. What makes a character collectible?

Proposed model:

VISUAL HOOK + PERSONALITY HOOK + GAMEPLAY HOOK + TEAM ROLE + RELATIONSHIP HOOK + COSMETIC HOOK + OPTIONAL FANSERVICE HOOK

The important principle is redundancy of appeal: if one hook does not interest a player, another can still provide a reason to remember the character.

This is a DESIGN PROPOSAL, not a verified statement about universal player behavior.

## 6. BaseWarriors Character Framework

Every future character concept can be reviewed through:

- Visual Hook: what can be recognized from silhouette, face, hair, palette or outfit?
- Personality Hook: what behavior makes the character distinct?
- Gameplay Hook: what does the player do differently when using this character?
- Team Role: why would this character occupy a place in a team?
- Faction Identity: what visual, thematic or behavioral traits connect the character to a faction?
- Relationship Hook: who does the character interact with and why?
- Cosmetic Hook: what can change visually without changing gameplay?
- Optional Fanservice Hook: is there a fanservice element that reinforces the character rather than replacing the character?

The last field is explicitly optional.

## 7. Preliminary BaseWarriors fanservice direction

These are DESIGN PROPOSALS, not established canon.

### Could fit
- character-specific expressions;
- humorous baseball situations;
- celebration poses;
- rivalry reactions;
- seasonal costumes;
- fashion-oriented skins;
- playful ecchi presentation when consistent with the character;
- event outfits that communicate personality;
- cosmetic variants that preserve gameplay identity.

### Should be used selectively
- revealing outfits;
- body-emphasis framing;
- suggestive poses;
- event-specific ecchi scenes.

Selection should depend on the character and context rather than being applied uniformly.

### Should remain separate
- explicit sexual content;
- gameplay power;
- rarity value;
- combat resolution;
- economic advantage.

The character should not require sexualization to justify gameplay relevance.

## 8. Character appeal versus sexualization

Character appeal = everything that makes the player recognize, understand, remember or enjoy a character.

Fanservice = optional material deliberately designed to reward or appeal to an established audience.

Sexualization = presentation that emphasizes sexual attractiveness or sexualized body presentation.

Explicit content = a separate category involving explicit sexual material.

These categories can overlap, but they are not interchangeable.
Classification: DESIGN PROPOSAL / TERMINOLOGY FRAMEWORK.

## 9. Cosmetics

Potential categories:
- uniforms;
- alternate outfits;
- accessories;
- hairstyles;
- seasonal clothing;
- celebration poses;
- expressions;
- visual effects;
- profile presentation.

The existing project documentation already separates visual character presentation from gameplay statistics.
Classification: OBSERVATION + DESIGN PROPOSAL.

## 10. Streamer Mode

Streamer Mode should remain a presentation-layer concept.

It may conceptually alter camera framing, selected visual effects, cosmetic presentation, optional character poses and optional dialogue presentation.

It must not alter combat, damage, HP, statistics, AI, progression, economy, gacha or rewards.

Classification: DESIGN PROPOSAL.
No implementation is included.

## 11. Open Questions

These require external market research or dedicated product testing:

1. Which character-appeal dimensions correlate with stronger player preference?
2. How much does visual design contribute relative to personality or gameplay identity?
3. Which fanservice categories are most commonly used across current anime character-collection products?
4. How are seasonal cosmetics used in current live-service products?
5. What evidence exists for emotional or relationship systems increasing engagement?
6. How do players distinguish character appeal from sexualization?
7. What fanservice patterns generate community discussion without becoming the primary identity of the product?
8. What current platform policies distinguish allowed, monetizable, advertizable and streamable content?
9. Which current market examples demonstrate successful character identity without relying primarily on sexualization?

Until researched, these remain UNKNOWN.

## 12. Design guardrails

1. Every character should have at least one non-fanservice reason to be memorable.
2. Gameplay identity should not depend on sexualization.
3. Fanservice may reinforce personality, event identity or collection value.
4. Cosmetics should not silently alter gameplay.
5. Different characters may use different levels and types of fanservice.
6. Character appeal should be evaluated across visual, personality, gameplay and relationship dimensions.
7. Do not infer commercial success from visual appeal alone.
8. Do not treat rarity as proof of character quality.
9. Do not make fanservice the universal visual language of the roster.
10. Revisit these principles after actual market research is available.

Classification: DESIGN PROPOSAL.

## 13. Current conclusion

The repository provides enough internal material to define a character-design framework, but not enough evidence to claim a market analysis.

Current defensible direction:

CHARACTER IDENTITY -> PERSONALITY -> GAMEPLAY ROLE -> RELATIONSHIPS -> COLLECTION/COSMETICS -> OPTIONAL FANSERVICE

rather than making fanservice the foundation of the product.

This is a preliminary design direction only. External market evidence remains required before converting these observations into market-backed product decisions.