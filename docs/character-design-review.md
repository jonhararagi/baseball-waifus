# BaseWarriors: Meta-Strike · Character Design Review + Roster Differentiation

> TAREA 012 · Auditoría del roster canónico de 30 personajes
>
> **Estado:** DIAGNÓSTICO DOCUMENTAL
>
> **Fuente canónica primaria:** `game/characters/character_archetypes.json`
>
> Esta revisión aplica `docs/character-design-system.md` y `docs/character-appeal-fanservice-analysis.md`. No cambia canon, gameplay, balance, rareza, relaciones, arte ni datos.

## 1. Purpose

La pregunta de esta revisión es:

> ¿Los 30 personajes conservan una identidad reconocible cuando se retiran señales superficiales como cabello, ropa, rareza y color?

La auditoría busca detectar redundancias, no decidir qué personaje es mejor o peor.

Se distingue entre:

- **FACT:** dato directamente presente en una fuente inspeccionada.
- **OBSERVATION:** patrón visible al cruzar varias fuentes.
- **INFERENCE:** interpretación razonable derivada de esos datos.
- **DESIGN PROPOSAL:** posible dirección futura, no canon.
- **UNKNOWN:** información que no está suficientemente registrada.

No se realizan rankings ni puntuaciones.

---

## 2. Review Methodology

Se inspeccionaron:

- `game/characters/character_archetypes.json`
- `game/characters/character_archetype_catalog.gd`
- `data/characters_queue.json`
- `webapp/data/waifus_config.json`
- `docs/character-design-system.md`
- `docs/character-appeal-fanservice-analysis.md`
- `docs/character-roster-30.md`
- `docs/avatar-visual-system.md`
- `docs/character-art-pipeline.md`
- `docs/characters/character-diversity-v1.md`
- `docs/characters/character-action-design-v1.md`
- `docs/canon/character-art-canon-v1.md`
- `docs/canon/character-personality-inspiration-bible-v1.md`
- `docs/canon/charm-and-affection-canon-v1.md`

**FACT:** el catálogo canónico contiene 30 personajes adultos, `bw001` a `bw030`.

**FACT:** el catálogo registra rareza, elemento, posición, especialización, stats, cuerpo, rostro, cabello, uniforme, identidad, tags, play identity, story status, story hook, contrast, skill roles y facción.

**OBSERVATION:** el catálogo proporciona bastante más información para Gameplay Identity que para Relationship Identity.

**OBSERVATION:** todos los 30 personajes tienen `hair_style: long`.

**OBSERVATION:** el sistema de variantes visuales canónico permite actualmente modificar `hair_color`, `hair_style` y `body_scale`, con escala 0.94–1.06.

**UNKNOWN:** no existe un campo común de Relationship Hook en el catálogo canónico.

### Differentiation tests

Cada prueba es conceptual:

- **TEST A / Hair removed:** ¿quedan silueta, cuerpo, rostro, personalidad o función suficientes?
- **TEST B / Outfit removed:** ¿personality y gameplay siguen separando al personaje?
- **TEST C / Rarity removed:** ¿la identidad sobrevive sin R/SR/SSR/UR?
- **TEST D / Stats removed:** ¿el play identity y la acción de firma comunican una fantasía?
- **TEST E / Color removed:** ¿la silueta, rostro, comportamiento o concepto siguen funcionando?
- **TEST F / Outfit changed:** ¿el personaje podría llevar otra presentación sin dejar de ser reconocible?

Estados:

- **PASS:** la identidad conserva varias señales independientes.
- **PARTIAL:** conserva identidad, pero depende de una señal importante o comparte demasiado con otro personaje.
- **FAIL:** la información disponible no permite encontrar una identidad suficiente.
- **UNKNOWN:** faltan datos para realizar una conclusión responsable.

---

## 3. Canonical Roster

| ID | Name | Rarity | Role | Element | Faction |
|---|---|---|---|---|---|
| bw001 | Aiko Hanamori | R | 3B / power | fire | bosozoku_wild |
| bw002 | Reina Kurose | SSR | P / pitcher | ice | shadow_magic |
| bw003 | Miu Tachibana | SR | SS / contact | lightning | bosozoku_wild |
| bw004 | Yuna Minase | SSR | CF / runner | nature | idol_sparkle |
| bw005 | Sora Amamiya | SR | C / catcher | water | tactical_milspec |
| bw006 | Akari Shimizu | SR | 1B / defender | lightning | bosozoku_wild |
| bw007 | Kira Kurosawa | SSR | RF / power | darkness | idol_sparkle |
| bw008 | Nao Fujimoto | SR | 2B / contact | water | cyber_tech |
| bw009 | Rika Moriyama | SR | LF / runner | nature | bosozoku_wild |
| bw010 | Mei Kanzaki | SSR | DH / pitcher | lightning | cyber_tech |
| bw011 | Hina Sakuragi | R | C / catcher | light | idol_sparkle |
| bw012 | Sayu Kisaragi | SR | SS / defender | nature | tactical_milspec |
| bw013 | Kaede Arakawa | SSR | 3B / power | darkness | shadow_magic |
| bw014 | Rin Asakura | SR | CF / runner | ice | tactical_milspec |
| bw015 | Momo Hoshino | SSR | DH / power | fire | shadow_magic |
| bw016 | Fuyuki Aono | SR | P / pitcher | ice | cyber_tech |
| bw017 | Yuzu Takahashi | R | 2B / contact | light | idol_sparkle |
| bw018 | Koharu Nishiki | SR | LF / defender | nature | shadow_magic |
| bw019 | Chika Raikou | SSR | RF / power | lightning | bosozoku_wild |
| bw020 | Shiori Amane | SR | SS / contact | darkness | cyber_tech |
| bw021 | Noa Mizuno | R | C / catcher | water | tactical_milspec |
| bw022 | Ayame Tsukino | SSR | 1B / defender | darkness | bosozoku_wild |
| bw023 | Towa Amami | SR | CF / runner | light | idol_sparkle |
| bw024 | Nene Kagetsu | UR | P / pitcher | fire | tactical_milspec |
| bw025 | Itsuki Kogane | SR | 2B / defender | ice | cyber_tech |
| bw026 | Ema Kuroyuri | SSR | 3B / contact | nature | shadow_magic |
| bw027 | Hotaru Kazehaya | SR | LF / contact | lightning | bosozoku_wild |
| bw028 | Aria Solis | SSR | RF / power | light | idol_sparkle |
| bw029 | Sena Yoru | SR | SS / runner | darkness | cyber_tech |
| bw030 | Kagari Homura | UR | C / catcher | fire | tactical_milspec |

---

## 4. Character-by-Character Review

### bw001 · Aiko Hanamori

- **Rarity:** R
- **Role:** 3B / power
- **Gameplay identity:** `big_swing_threat`
- **Personality:** power, sporty, warm, competitive
- **Visual identity:** power / round / long / jacket
- **Faction / element:** bosozoku_wild / fire
- **Style tags:** power, sporty, warm, competitive
- **Signature action:** NONE
- **Relationship identity:** UNKNOWN
- **Collection identity:** R identity centered on power-hitter fantasy, warm competitive personality and collection/affinity systems.
- **Cosmetic potential:** jacket/sporty silhouette, warm accent, power-body presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** warm competitive power hitter.
- **Secondary Hook:** strong-looking player whose contrast explicitly rejects the slow/torpe stereotype.
- **Differentiator:** big-swing threat plus warm competitiveness.
- **Overlap risks:** 3B/power family, especially bw013.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the warm, forceful slugger.
- **Status:** DISTINCT, with secondary 3B/power overlap.

### bw002 · Reina Kurose

- **Rarity:** SSR
- **Role:** P / pitcher
- **Gameplay identity:** `tempo_control`
- **Personality:** elegant, controlled, formal, pitcher
- **Visual identity:** athletic / sharp / long / standard
- **Faction / element:** shadow_magic / ice
- **Style tags:** elegant, controlled, formal, pitcher
- **Signature action:** `tempo_freeze`
- **Relationship identity:** UNKNOWN
- **Collection identity:** SSR pitcher with a defined story seed, signature action and refined strategic fantasy.
- **Cosmetic potential:** refined standard uniform, sharp silhouette, ice accent.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** pitcher who controls the opponent's tempo.
- **Secondary Hook:** formal refinement contrasted with deliberate provocation.
- **Differentiator:** tempo control rather than raw pitching pressure.
- **Overlap risks:** pitcher family, especially bw010/bw016/bw024.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the composed tempo strategist.
- **Status:** DISTINCT.

### bw003 · Miu Tachibana

- **Rarity:** SR
- **Role:** SS / contact
- **Gameplay identity:** `gap_creator`
- **Personality:** energetic, street, sharp, contact
- **Visual identity:** balanced / soft / long / standard
- **Faction / element:** bosozoku_wild / lightning
- **Signature action:** `hit_and_run_signal`
- **Relationship identity:** UNKNOWN
- **Collection identity:** SR tactical shortstop built around reading openings.
- **Cosmetic potential:** street/sport identity and lightning accent.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** quick-witted gap creator.
- **Secondary Hook:** sacrifices spotlight to open space.
- **Differentiator:** proactive infield-space creation.
- **Overlap risks:** SS/contact family, especially bw020.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the fast-thinking opportunist who manufactures openings.
- **Status:** DISTINCT.

### bw004 · Yuna Minase

- **Rarity:** SSR
- **Role:** CF / runner
- **Gameplay identity:** `aggressive_baserunner`
- **Personality:** athletic, outdoorsy, cheerful, runner
- **Visual identity:** athletic / soft / long / sporty
- **Faction / element:** idol_sparkle / nature
- **Signature action:** `delayed_steal`
- **Relationship identity:** UNKNOWN
- **Collection identity:** SSR speed specialist with a clear impulsive-versus-restraint story hook.
- **Cosmetic potential:** sporty outfit language, outdoor/nature accent.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** aggressive runner learning when not to run.
- **Secondary Hook:** cheerful outdoor athlete.
- **Differentiator:** speed tempered by delayed decisions.
- **Overlap risks:** HIGH with bw023.
- **Identity confidence:** HIGH
- **Tests A-F:** PARTIAL / PASS / PASS / PASS / PARTIAL / PARTIAL
- **Character Fantasy:** the impulsive speedster learning restraint.
- **Status:** OVERLAP RISK.

### bw005 · Sora Amamiya

- **Rarity:** SR
- **Role:** C / catcher
- **Gameplay identity:** `risk_manager`
- **Personality:** strong, protective, serious, catcher
- **Visual identity:** power / round / long / standard
- **Faction / element:** tactical_milspec / water
- **Signature action:** `pitchout_read`
- **Relationship identity:** UNKNOWN
- **Collection identity:** protective catcher identity with conservative decision-making.
- **Cosmetic potential:** tactical/milspec framing and protective silhouette.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** protective risk-manager catcher.
- **Secondary Hook:** imposing body paired with patient control.
- **Differentiator:** defensive risk management.
- **Overlap risks:** HIGH with bw030 visually/structurally.
- **Identity confidence:** HIGH
- **Tests A-F:** PARTIAL / PASS / PASS / PASS / PARTIAL / PARTIAL
- **Character Fantasy:** the catcher who protects the pitcher through controlled decisions.
- **Status:** OVERLAP RISK.

### bw006 · Akari Shimizu

- **Rarity:** SR
- **Role:** 1B / defender
- **Gameplay identity:** `unexpected_small_ball`
- **Personality:** muscular, tomboy, practical, defender
- **Visual identity:** athletic / sharp / long / sleeveless
- **Faction / element:** bosozoku_wild / lightning
- **Signature action:** `defensive_shift_bait`
- **Relationship identity:** UNKNOWN
- **Collection identity:** muscular defender with tactical contradiction.
- **Cosmetic potential:** sleeveless athletic/tomboy silhouette.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** intimidating-looking defender who wins with small-ball positioning.
- **Secondary Hook:** practical tomboy.
- **Differentiator:** deceptive defensive decision-making.
- **Overlap risks:** MEDIUM with bw022.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the intimidating defender who outthinks instead of overpowering.
- **Status:** DISTINCT.

### bw007 · Kira Kurosawa

- **Rarity:** SSR
- **Role:** RF / power
- **Gameplay identity:** `late_count_batter`
- **Personality:** dramatic, confident, voluptuous, power
- **Visual identity:** power / sharp / long / jacket
- **Faction / element:** idol_sparkle / darkness
- **Signature action:** `disciplined_take`
- **Relationship identity:** UNKNOWN
- **Collection identity:** theatrical power character with discipline beneath presentation.
- **Cosmetic potential:** showwoman presentation and jacket silhouette.
- **Optional fanservice:** optional, but not required by identity.
- **Primary Hook:** theatrical slugger who wins by refusing bad swings.
- **Secondary Hook:** dramatic confidence.
- **Differentiator:** disciplined patience hidden under showmanship.
- **Overlap risks:** MEDIUM with bw019/bw028.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the showwoman who turns theatrics into disciplined offense.
- **Status:** DISTINCT.

### bw008 · Nao Fujimoto

- **Rarity:** SR
- **Role:** 2B / contact
- **Gameplay identity:** `contact_manipulator`
- **Personality:** slim, quiet, academic, contact
- **Visual identity:** slim / soft / long / standard
- **Faction / element:** cyber_tech / water
- **Signature action:** `count_probe`
- **Relationship identity:** UNKNOWN
- **Collection identity:** analytical contact player with pattern-reading fantasy.
- **Cosmetic potential:** academic/cyber presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** quiet analyst who manipulates the count to learn patterns.
- **Secondary Hook:** reserved academic personality.
- **Differentiator:** information gathering through contact play.
- **Overlap risks:** MEDIUM with bw017.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the silent pattern analyst.
- **Status:** DISTINCT.

### bw009 · Rika Moriyama

- **Rarity:** SR
- **Role:** LF / runner
- **Gameplay identity:** `first_to_third_pressure`
- **Personality:** athletic, casual, playful, runner
- **Visual identity:** athletic / round / long / sporty
- **Faction / element:** bosozoku_wild / nature
- **Signature action:** `lead_feint`
- **Relationship identity:** UNKNOWN
- **Collection identity:** playful runner whose jokes double as attention tests.
- **Cosmetic potential:** casual/sporty/nature identity.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** prankster baserunner who manipulates defensive attention.
- **Secondary Hook:** casual playful temperament.
- **Differentiator:** feint and psychological pressure.
- **Overlap risks:** MEDIUM with runner group.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the playful runner who turns misdirection into pressure.
- **Status:** DISTINCT.

### bw010 · Mei Kanzaki

- **Rarity:** SSR
- **Role:** DH / pitcher
- **Gameplay identity:** `count_trap`
- **Personality:** slim, technical, focused, pitcher
- **Visual identity:** slim / sharp / long / standard
- **Faction / element:** cyber_tech / lightning
- **Signature action:** `count_trap`
- **Relationship identity:** UNKNOWN
- **Collection identity:** technical pitcher with pattern-based identity.
- **Cosmetic potential:** cyber/technical presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** technical pitcher who traps the opponent in predictable counts.
- **Secondary Hook:** focused record-keeping personality.
- **Differentiator:** deliberate count traps.
- **Overlap risks:** MEDIUM with bw002/bw016.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the precision engineer of pitch sequencing.
- **Status:** DISTINCT.

### bw011 · Hina Sakuragi

- **Rarity:** R
- **Role:** C / catcher
- **Gameplay identity:** `sacrifice_support`
- **Personality:** feminine, kind, neat, catcher
- **Visual identity:** balanced / soft / long / standard
- **Faction / element:** idol_sparkle / light
- **Signature action:** NONE
- **Relationship identity:** UNKNOWN
- **Collection identity:** gentle support catcher and affinity character.
- **Cosmetic potential:** neat/idol presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** gentle catcher who prioritizes team support.
- **Secondary Hook:** neat, kind presentation.
- **Differentiator:** supportive sacrifice identity.
- **Overlap risks:** MEDIUM with catcher group.
- **Identity confidence:** MEDIUM
- **Tests A-F:** PARTIAL / PASS / PASS / PARTIAL / PARTIAL / PASS
- **Character Fantasy:** the gentle team-first catcher.
- **Status:** DISTINCT, but needs future narrative reinforcement.

### bw012 · Sayu Kisaragi

- **Rarity:** SR
- **Role:** SS / defender
- **Gameplay identity:** `coverage_anchor`
- **Personality:** natural, reserved, practical, defender
- **Visual identity:** balanced / soft / long / sleeveless
- **Faction / element:** tactical_milspec / nature
- **Signature action:** `coverage_switch`
- **Relationship identity:** UNKNOWN
- **Collection identity:** quiet defensive specialist.
- **Cosmetic potential:** natural/tactical/sleeveless identity.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** quiet defender who wins through coverage decisions.
- **Secondary Hook:** reserved practical temperament.
- **Differentiator:** positional coverage.
- **Overlap risks:** MEDIUM with defender group.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the unseen coverage anchor.
- **Status:** DISTINCT.

### bw013 · Kaede Arakawa

- **Rarity:** SSR
- **Role:** 3B / power
- **Gameplay identity:** `sacrifice_power`
- **Personality:** elegant, dark, curvy, power
- **Visual identity:** power / sharp / long / jacket
- **Faction / element:** shadow_magic / darkness
- **Signature action:** `sacrifice_bunt`
- **Relationship identity:** UNKNOWN
- **Collection identity:** proud slugger learning team sacrifice.
- **Cosmetic potential:** elegant dark power silhouette.
- **Optional fanservice:** optional, not required.
- **Primary Hook:** proud power hitter who deliberately gives up power to advance a teammate.
- **Secondary Hook:** elegant dark presentation.
- **Differentiator:** sacrifice-versus-pride contradiction.
- **Overlap risks:** MEDIUM with bw001.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the proud slugger who learns to win collectively.
- **Status:** DISTINCT.

### bw014 · Rin Asakura

- **Rarity:** SR
- **Role:** CF / runner
- **Gameplay identity:** `hit_for_speed`
- **Personality:** slim, athletic, quiet, runner
- **Visual identity:** slim / soft / long / sporty
- **Faction / element:** tactical_milspec / ice
- **Signature action:** `drag_bunt`
- **Relationship identity:** UNKNOWN
- **Collection identity:** speed specialist with bunting identity.
- **Cosmetic potential:** sporty/ice/speed presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** speed specialist who turns bunting into a weapon.
- **Secondary Hook:** quiet athleticism.
- **Differentiator:** speed plus drag-bunt threat.
- **Overlap risks:** MEDIUM with bw004/bw023.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the speed specialist who makes the short game dangerous.
- **Status:** DISTINCT.

### bw015 · Momo Hoshino

- **Rarity:** SSR
- **Role:** DH / power
- **Gameplay identity:** `clutch_contact`
- **Personality:** warm, curvy, cheerful, power
- **Visual identity:** curvy / warm / long / jacket
- **Faction / element:** shadow_magic / fire
- **Signature action:** `sacrifice_fly_focus`
- **Relationship identity:** UNKNOWN
- **Collection identity:** warm power hitter with clutch team utility.
- **Cosmetic potential:** warm/curvy/jacket presentation.
- **Optional fanservice:** optional.
- **Primary Hook:** cheerful power hitter who values the run over the highlight.
- **Secondary Hook:** warm team-oriented temperament.
- **Differentiator:** clutch sacrifice-fly focus.
- **Overlap risks:** MEDIUM with power hitters.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the cheerful clutch hitter who creates the run.
- **Status:** DISTINCT.

### bw016 · Fuyuki Aono

- **Rarity:** SR
- **Role:** P / pitcher
- **Gameplay identity:** `pickoff_control`
- **Personality:** slim, reserved, traditional, pitcher
- **Visual identity:** slim / sharp / long / standard
- **Faction / element:** cyber_tech / ice
- **Signature action:** `pickoff_check`
- **Relationship identity:** UNKNOWN
- **Collection identity:** reserved pitcher with sudden assertiveness against runners.
- **Cosmetic potential:** traditional/technical/ice presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** reserved pitcher who becomes active when a runner overcommits.
- **Secondary Hook:** traditional, quiet demeanor.
- **Differentiator:** pickoff control.
- **Overlap risks:** MEDIUM with bw002.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PARTIAL / PASS
- **Character Fantasy:** the quiet pitcher with a hidden defensive bite.
- **Status:** DISTINCT.

### bw017 · Yuzu Takahashi

- **Rarity:** R
- **Role:** 2B / contact
- **Gameplay identity:** `situational_hitter`
- **Personality:** feminine, cheerful, tidy, contact
- **Visual identity:** balanced / soft / long / standard
- **Faction / element:** idol_sparkle / light
- **Signature action:** NONE
- **Relationship identity:** UNKNOWN
- **Collection identity:** conventional-looking situational contact player.
- **Cosmetic potential:** tidy idol/light presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** dependable situational hitter.
- **Secondary Hook:** cheerful tidy personality.
- **Differentiator:** context-first batting identity.
- **Overlap risks:** MEDIUM with bw008.
- **Identity confidence:** MEDIUM
- **Tests A-F:** PARTIAL / PASS / PASS / PARTIAL / PARTIAL / PASS
- **Character Fantasy:** the reliable situational worker.
- **Status:** PARTIALLY DISTINCT.

### bw018 · Koharu Nishiki

- **Rarity:** SR
- **Role:** LF / defender
- **Gameplay identity:** `relay_specialist`
- **Personality:** natural, casual, freckled, defender
- **Visual identity:** balanced / round / long / sleeveless
- **Faction / element:** shadow_magic / nature
- **Signature action:** `relay_chain`
- **Relationship identity:** UNKNOWN
- **Collection identity:** relaxed defensive relay specialist.
- **Cosmetic potential:** freckles, natural field presentation, sleeveless outfit.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** relay specialist who makes ordinary recoveries valuable.
- **Secondary Hook:** casual/freckled field identity.
- **Differentiator:** assist-chain defense.
- **Overlap risks:** LOW to MEDIUM with defenders.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the field guardian who turns recovery into coordination.
- **Status:** DISTINCT.

### bw019 · Chika Raikou

- **Rarity:** SSR
- **Role:** RF / power
- **Gameplay identity:** `pressure_hitter`
- **Personality:** athletic, tomboy, bold, power
- **Visual identity:** athletic / sharp / long / jacket
- **Faction / element:** bosozoku_wild / lightning
- **Signature action:** `hit_and_run_brawl`
- **Relationship identity:** UNKNOWN
- **Collection identity:** frontal pressure hitter whose signature requires coordination.
- **Cosmetic potential:** athletic/tomboy/jacket identity.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** bold pressure hitter who attacks the defense's impatience.
- **Secondary Hook:** tomboyish frontal energy.
- **Differentiator:** aggressive pressure plus coordinated play.
- **Overlap risks:** HIGH group overlap with bw007/bw028.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the aggressive brawler who weaponizes pressure.
- **Status:** OVERLAP RISK at family level, not duplicate.

### bw020 · Shiori Amane

- **Rarity:** SR
- **Role:** SS / contact
- **Gameplay identity:** `late_reaction_runner`
- **Personality:** slim, dark, introverted, contact
- **Visual identity:** slim / sharp / long / standard
- **Faction / element:** cyber_tech / darkness
- **Signature action:** `delayed_steal_read`
- **Relationship identity:** UNKNOWN
- **Collection identity:** introverted contact/runner hybrid.
- **Cosmetic potential:** dark cyber/silent presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** silent observer who steals when attention drops.
- **Secondary Hook:** introverted social behavior.
- **Differentiator:** stealth-like timing rather than direct speed.
- **Overlap risks:** MEDIUM with bw003 and bw029.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the invisible opportunist.
- **Status:** DISTINCT.

### bw021 · Noa Mizuno

- **Rarity:** R
- **Role:** C / catcher
- **Gameplay identity:** `pitchout_trap`
- **Personality:** casual, easygoing, practical, catcher
- **Visual identity:** balanced / round / long / standard
- **Faction / element:** tactical_milspec / water
- **Signature action:** NONE
- **Relationship identity:** UNKNOWN
- **Collection identity:** relaxed catcher with practical trap identity.
- **Cosmetic potential:** casual water/tactical presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** easygoing catcher who disguises practical traps.
- **Secondary Hook:** relaxed personality hiding a plan.
- **Differentiator:** pitchout trap.
- **Overlap risks:** MEDIUM with catcher group.
- **Identity confidence:** MEDIUM
- **Tests A-F:** PARTIAL / PASS / PASS / PARTIAL / PARTIAL / PASS
- **Character Fantasy:** the laid-back catcher who already has a plan.
- **Status:** PARTIALLY DISTINCT.

### bw022 · Ayame Tsukino

- **Rarity:** SSR
- **Role:** 1B / defender
- **Gameplay identity:** `drawn_in_defense`
- **Personality:** muscular, tomboy, stoic, defender
- **Visual identity:** power / sharp / long / sleeveless
- **Faction / element:** bosozoku_wild / darkness
- **Signature action:** `drawn_in_infield`
- **Relationship identity:** UNKNOWN
- **Collection identity:** stoic powerhouse defender using risky positioning.
- **Cosmetic potential:** powerhouse/tomboy/sleeveless silhouette.
- **Optional fanservice:** optional, not identity-defining.
- **Primary Hook:** powerhouse defender willing to expose herself to protect home.
- **Secondary Hook:** stoic tomboy.
- **Differentiator:** drawn-in defensive risk.
- **Overlap risks:** MEDIUM with bw006.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the stoic wall who accepts positional risk.
- **Status:** DISTINCT.

### bw023 · Towa Amami

- **Rarity:** SR
- **Role:** CF / runner
- **Gameplay identity:** `steal_home_threat`
- **Personality:** athletic, idolish, bright, runner
- **Visual identity:** athletic / soft / long / sporty
- **Faction / element:** idol_sparkle / light
- **Signature action:** `aggressive_extra_base`
- **Relationship identity:** UNKNOWN
- **Collection identity:** bright show-runner with improvisational extra-base identity.
- **Cosmetic potential:** idol/sporty/bright presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** bright show-runner who thrives on risky extra bases.
- **Secondary Hook:** rehearsed idol image contrasted with improvisation.
- **Differentiator:** aggressive extra-base decision.
- **Overlap risks:** HIGH with bw004.
- **Identity confidence:** HIGH
- **Tests A-F:** PARTIAL / PASS / PASS / PASS / PARTIAL / PARTIAL
- **Character Fantasy:** the stage-bright runner who breaks choreography at the decisive moment.
- **Status:** OVERLAP RISK.

### bw024 · Nene Kagetsu

- **Rarity:** UR
- **Role:** P / pitcher
- **Gameplay identity:** `pressure_pitcher`
- **Personality:** powerful, red, proud, pitcher
- **Visual identity:** power / sharp / long / standard
- **Faction / element:** tactical_milspec / fire
- **Signature action:** `pressure_sequence`
- **Relationship identity:** UNKNOWN
- **Collection identity:** UR ace fantasy built around controlled pressure.
- **Cosmetic potential:** ace/standard/fire presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** proud ace who learns that pressure is not maximum force.
- **Secondary Hook:** fire/red ace identity.
- **Differentiator:** pressure sequencing.
- **Overlap risks:** MEDIUM with pitchers.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the ace who controls intensity rather than simply increasing it.
- **Status:** DISTINCT.

### bw025 · Itsuki Kogane

- **Rarity:** SR
- **Role:** 2B / defender
- **Gameplay identity:** `fundamental_play`
- **Personality:** athletic, earthy, quiet, defender
- **Visual identity:** athletic / soft / long / sleeveless
- **Faction / element:** cyber_tech / ice
- **Signature action:** `fundamental_double_play`
- **Relationship identity:** UNKNOWN
- **Collection identity:** fundamentals-first defensive worker.
- **Cosmetic potential:** grounded athletic/sleeveless identity.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** defender whose fantasy is perfect execution of fundamentals.
- **Secondary Hook:** quiet humility.
- **Differentiator:** fundamental double-play execution.
- **Overlap risks:** LOW to MEDIUM with defenders.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the dependable fundamentals specialist.
- **Status:** DISTINCT.

### bw026 · Ema Kuroyuri

- **Rarity:** SSR
- **Role:** 3B / contact
- **Gameplay identity:** `squeeze_specialist`
- **Personality:** curvy, calm, botanical, contact
- **Visual identity:** curvy / round / long / standard
- **Faction / element:** shadow_magic / nature
- **Signature action:** `squeeze_play`
- **Relationship identity:** UNKNOWN
- **Collection identity:** calm contact player with high-coordination squeeze fantasy.
- **Cosmetic potential:** botanical/green/standard presentation.
- **Optional fanservice:** optional, not required.
- **Primary Hook:** calm contact specialist built around squeeze coordination.
- **Secondary Hook:** botanical patience.
- **Differentiator:** squeeze specialist.
- **Overlap risks:** LOW to MEDIUM with contact group.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the patient gardener who waits for coordinated openings.
- **Status:** DISTINCT.

### bw027 · Hotaru Kazehaya

- **Rarity:** SR
- **Role:** LF / contact
- **Gameplay identity:** `two_strike_survivor`
- **Personality:** casual, expressive, restless, contact
- **Visual identity:** balanced / soft / long / standard
- **Faction / element:** bosozoku_wild / lightning
- **Signature action:** `two_strike_foul_control`
- **Relationship identity:** UNKNOWN
- **Collection identity:** restless hitter whose identity is surviving difficult counts.
- **Cosmetic potential:** expressive/casual/lightning presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** restless contact hitter who refuses to give away a two-strike turn.
- **Secondary Hook:** expressive impatience.
- **Differentiator:** two-strike survival.
- **Overlap risks:** LOW to MEDIUM with contact group.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the stubborn survivor of bad counts.
- **Status:** DISTINCT.

### bw028 · Aria Solis

- **Rarity:** SSR
- **Role:** RF / power
- **Gameplay identity:** `team_first_star`
- **Personality:** curvy, idol, polished, power
- **Visual identity:** curvy / soft / long / jacket
- **Faction / element:** idol_sparkle / light
- **Signature action:** `team_first_hit`
- **Relationship identity:** UNKNOWN
- **Collection identity:** polished star whose identity is deliberately team-first.
- **Cosmetic potential:** idol/polished/jacket presentation.
- **Optional fanservice:** optional, not identity-defining.
- **Primary Hook:** public star who chooses team value over spotlight.
- **Secondary Hook:** polished social persona.
- **Differentiator:** team-first power play.
- **Overlap risks:** HIGH family overlap with bw007/bw019.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the star who willingly gives away the spotlight.
- **Status:** OVERLAP RISK at family level, not duplicate.

### bw029 · Sena Yoru

- **Rarity:** SR
- **Role:** SS / runner
- **Gameplay identity:** `sudden_aggression`
- **Personality:** athletic, hikikomori, messy, runner
- **Visual identity:** athletic / sharp / long / sporty
- **Faction / element:** cyber_tech / darkness
- **Signature action:** `silent_steal`
- **Relationship identity:** UNKNOWN
- **Collection identity:** social withdrawal contrasted with aggressive baserunning.
- **Cosmetic potential:** messy/cyber/sporty presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** hikikomori who communicates through aggressive baserunning.
- **Secondary Hook:** sudden aggression after quiet observation.
- **Differentiator:** social contradiction plus silent steal.
- **Overlap risks:** MEDIUM with bw020 and runner group.
- **Identity confidence:** HIGH
- **Tests A-F:** PASS / PASS / PASS / PASS / PASS / PASS
- **Character Fantasy:** the withdrawn player who becomes expressive only on the bases.
- **Status:** DISTINCT.

### bw030 · Kagari Homura

- **Rarity:** UR
- **Role:** C / catcher
- **Gameplay identity:** `rally_control`
- **Personality:** powerful, commanding, warm, catcher
- **Visual identity:** power / round / long / standard
- **Faction / element:** tactical_milspec / fire
- **Signature action:** `catcher_read`
- **Relationship identity:** UNKNOWN
- **Collection identity:** UR command catcher whose growth is learning to trust the pitcher.
- **Cosmetic potential:** command/milspec/fire presentation.
- **Optional fanservice:** NONE / UNKNOWN
- **Primary Hook:** commanding catcher learning to lead through trust.
- **Secondary Hook:** warm leadership.
- **Differentiator:** rally control through pitcher-reading.
- **Overlap risks:** HIGH with bw005 visually/structurally.
- **Identity confidence:** HIGH
- **Tests A-F:** PARTIAL / PASS / PASS / PASS / PARTIAL / PARTIAL
- **Character Fantasy:** the field commander who learns that leadership includes surrendering control.
- **Status:** OVERLAP RISK.

---

## 5. Differentiation Tests

### Roster-level result

**OBSERVATION:** no character requires rarety or hair color as its sole identity according to the available catalog.

**OBSERVATION:** SR/SSR/UR characters generally have additional identity material through story hooks, contrasts and signature actions.

**OBSERVATION:** the four R characters have less narrative differentiation in the catalog because the action-design documentation explicitly does not require signature actions for R characters.

**INFERENCE:** the R tier is the area where future narrative/affinity content can provide additional identity without altering gameplay.

### Test summary

| Test | Result pattern |
|---|---|
| A · Hair removed | Mostly PASS; PARTIAL concentrated in visually similar families |
| B · Outfit removed | Mostly PASS because gameplay/personality fields remain |
| C · Rarity removed | PASS across roster; rarity is not the identity source |
| D · Stats removed | PASS for most due to play identity/signature actions; PARTIAL for some R characters |
| E · Color removed | Mostly PASS; visual-family overlaps remain |
| F · Outfit changed | Mostly PASS; strongest risk in Yuna/Towa and Sora/Kagari |

**OBSERVATION:** the most serious problem is not a universal failure of identity. It is concentration of several shared visual variables inside a few families.

---

## 6. Character Fantasy

**OBSERVATION:** the roster already distinguishes Role from Fantasy through play identity, story hook, contrast and signature action.

Examples:

- Reina = tempo strategist, not simply pitcher.
- Fuyuki = pickoff-control pitcher, not simply pitcher.
- Nene = pressure-sequence ace, not simply pitcher.
- Yuna = impulsive speedster learning restraint.
- Rika = playful runner manipulating defensive attention.
- Sena = socially withdrawn runner expressing herself through bases.
- Sora = protective risk manager.
- Kagari = commanding rally controller learning trust.

**INFERENCE:** Gameplay Identity is currently one of the strongest differentiation layers in the roster.

**DESIGN PROPOSAL:** preserve the pattern `ROLE + FANTASY + BEHAVIORAL CONTRAST` for future characters.

---

## 7. Personality Differentiation

**OBSERVATION:** personality is encoded primarily through `style_tags`, `archetype`, `story_hook` and `contrast`.

Strong documented contrasts include:

- Kira: theatrical presentation vs disciplined takes.
- Akari: intimidating appearance vs small-ball positioning.
- Miu: energetic street identity vs willingness to sacrifice spotlight.
- Yuna: impulsive running vs learning restraint.
- Sena: social withdrawal vs aggressive baserunning.
- Kagari: commanding leadership vs learning to trust.

**OBSERVATION:** Relationship identity is not structurally represented as a common catalog field.

**UNKNOWN:** the roster cannot currently be audited for relationship differentiation with the same confidence as personality or gameplay.

**DESIGN PROPOSAL:** future character reviews should not require a relationship hook when none exists, but should mark it explicitly as UNKNOWN rather than inventing one.

---

## 8. Visual Differentiation

### Strong existing dimensions

The catalog contains:

- body preset;
- height;
- shoulder/waist/hip proportions;
- bust;
- head scale;
- face style;
- skin;
- hair color;
- uniform color;
- accent;
- eye color;
- hair style;
- uniform style.

**OBSERVATION:** despite these fields, all 30 characters currently use long hair.

**INFERENCE:** hair length has little value as a differentiator at roster level because it has become a constant.

**DESIGN PROPOSAL:** future visual reviews should prioritize silhouette, face, posture, accessories and body proportions before changing hair color.

---

## 9. Gameplay Differentiation

**FACT:** the roster contains distinct `play_identity` values such as:

- big_swing_threat;
- tempo_control;
- gap_creator;
- aggressive_baserunner;
- risk_manager;
- unexpected_small_ball;
- late_count_batter;
- contact_manipulator;
- first_to_third_pressure;
- count_trap;
- sacrifice_support;
- coverage_anchor;
- sacrifice_power;
- hit_for_speed;
- clutch_contact;
- pickoff_control;
- situational_hitter;
- relay_specialist;
- pressure_hitter;
- late_reaction_runner;
- pitchout_trap;
- drawn_in_defense;
- steal_home_threat;
- pressure_pitcher;
- fundamental_play;
- squeeze_specialist;
- two_strike_survivor;
- team_first_star;
- sudden_aggression;
- rally_control.

**OBSERVATION:** every canonical character has a distinct `play_identity` string.

**INFERENCE:** this provides a strong conceptual foundation for differentiation, although distinct labels do not by themselves prove distinct final gameplay behavior.

**UNKNOWN:** some future resolver behavior remains pending according to `docs/characters/character-action-design-v1.md`.

---

## 10. Relationship Differentiation

**FACT:** affinity and dialogue systems exist as documented systems.

**FACT:** `docs/canon/charm-and-affection-canon-v1.md` documents ten conversations per character.

**UNKNOWN:** this review does not have a standardized relationship taxonomy in `character_archetypes.json`.

**OBSERVATION:** Relationship Identity therefore cannot be compared consistently across all 30 characters from the canonical roster alone.

**DESIGN PROPOSAL:** future relationship review should classify only documented links such as rival, mentor, friend, partner, leader or team connection and leave missing relationships as UNKNOWN.

---

## 11. Cosmetic Differentiation

**FACT:** canonical variants currently allow hair color, hair style and body scale.

**FACT:** body scale is limited to 0.94–1.06.

**DESIGN PROPOSAL:** future cosmetic systems can use outfit, seasonal theme, accessories and presentation only if the canonical variant contract is explicitly expanded.

Per-character cosmetic identity should preserve the character's Primary Hook rather than becoming a new identity.

---

## 12. Fanservice Review

The audit follows:

```
CHARACTER APPEAL
≠ FANSERVICE
≠ SEXUALIZATION
≠ EXPLICIT CONTENT
```

**FACT:** T010-B established this distinction and documented fanservice as optional.

**OBSERVATION:** the current canonical roster does not require a Fanservice Hook for any character.

**DESIGN PROPOSAL:** keep fanservice as NONE / UNKNOWN unless an explicit character or event design requires it.

### Optional Fanservice status

| Group | Review |
|---|---|
| All 30 characters | NONE / UNKNOWN unless explicitly documented elsewhere |
| Kira, Momo, Kaede, Ema, Aria | Existing body/style tags may support optional adult presentation, but this is not proof of a fanservice identity |
| Remaining roster | No need to add fanservice merely for differentiation |

**MARKET VALIDATION PENDING:** no commercial or engagement effect is inferred.

---

## 13. High-Risk Overlaps

### HIGH · bw004 Yuna Minase ↔ bw023 Towa Amami

**Shared:**
- CF;
- runner;
- athletic body preset;
- soft face;
- long hair;
- sporty uniform;
- idol_sparkle faction;
- closely related bright/runner presentation.

**Not shared:**
- Yuna: nature, cheerful/outdoorsy, aggressive_baserunner, delayed_steal.
- Towa: light, idolish/bright, steal_home_threat, aggressive_extra_base.

**Type of overlap:**
- **VISUAL:** HIGH
- **ROLE:** HIGH
- **PERSONALITY:** MEDIUM
- **GAMEPLAY/FANTASY:** MEDIUM
- **FACTION:** HIGH
- **ARCHETYPE:** MEDIUM/HIGH
- **RELATIONSHIP:** UNKNOWN

**INFERENCE:** these two can look interchangeable before their gameplay identity is explained.

**DESIGN PROPOSAL:** give their future visual language different body language, stance, accessories or facial expression patterns. Do not solve the overlap only by recoloring hair.

**Change risk:** MEDIUM.

### HIGH · bw005 Sora Amamiya ↔ bw030 Kagari Homura

**Shared:**
- C;
- catcher;
- power body;
- round face;
- long hair;
- standard uniform;
- tactical_milspec faction.

**Not shared:**
- Sora: water, protective/serious, risk_manager, pitchout_read.
- Kagari: fire, commanding/warm, rally_control, catcher_read.

**Type of overlap:**
- **VISUAL:** HIGH
- **ROLE:** HIGH
- **PERSONALITY:** MEDIUM
- **GAMEPLAY/FANTASY:** MEDIUM
- **FACTION:** HIGH
- **ARCHETYPE:** MEDIUM/HIGH
- **RELATIONSHIP:** UNKNOWN

**INFERENCE:** the pair is structurally close enough that rarity/color can become an accidental differentiator if no other signals are added.

**DESIGN PROPOSAL:** emphasize different catcher body language, leadership behavior, stance and equipment handling.

**Change risk:** MEDIUM.

---

## 14. Secondary Overlap Groups

### Pitchers

Members: bw002, bw010, bw016, bw024.

**OBSERVATION:** all four have different play identities:
tempo_control, count_trap, pickoff_control, pressure_pitcher.

**OBSERVATION:** bw002/bw016 share slim + sharp + long + standard.

**OBSERVATION:** bw010 also uses slim + sharp + long + standard.

**INFERENCE:** the pitcher family has a meaningful visual overlap even though its gameplay fantasies differ.

**DESIGN PROPOSAL:** differentiate stance, wind-up attitude, field posture, facial expression and equipment handling.

**Risk:** MEDIUM.

### RF / Power

Members: bw007, bw019, bw028.

**OBSERVATION:** all share RF/power and jacket uniform.

**Not shared:** body preset, face style, faction, element, personality and play identity vary.

**INFERENCE:** this is a family overlap rather than a character duplicate.

**DESIGN PROPOSAL:** reinforce three different fantasies: disciplined showwoman, frontal pressure brawler, team-first public star.

**Risk:** MEDIUM/HIGH family-level.

### SS / Contact / adjacent runner

Members: bw003, bw020, bw029.

**OBSERVATION:** bw003 and bw020 are SS/contact; bw029 is SS/runner.

**OBSERVATION:** bw020 and bw029 share cyber_tech, darkness, athletic/slim-sharp presentation and stealth-like timing concepts.

**INFERENCE:** bw020/bw029 require careful behavioral distinction because both can read as quiet/hidden aggression.

**DESIGN PROPOSAL:** preserve bw020 as observation/count-reading identity and bw029 as social-contrast/sudden-aggression identity.

**Risk:** MEDIUM.

### 2B / Contact-Defender

Members: bw008, bw017, bw025.

**OBSERVATION:** bw008/bw017 share 2B/contact; bw025 is 2B/defender.

**OBSERVATION:** their personalities and factions are distinct.

**INFERENCE:** functional overlap exists, but fantasy overlap is limited.

**Risk:** LOW/MEDIUM.

### Runners

Members: bw004, bw009, bw014, bw023, bw029.

**OBSERVATION:** every runner has a different play identity.

**OBSERVATION:** bw004/bw023 have the strongest visual overlap.

**OBSERVATION:** bw020 is not a runner specialization but its play identity contains runner behavior, creating an adjacent fantasy overlap with bw029.

**DESIGN PROPOSAL:** maintain distinct runner fantasies: restraint, feint, short-game speed, extra-base risk, silent aggression.

**Risk:** HIGH only for bw004/bw023; MEDIUM for adjacent families.

### Defenders

Members: bw006, bw012, bw018, bw022, bw025.

**OBSERVATION:** each has a distinct play identity.

**OBSERVATION:** bw006/bw022 share muscular/tomboy/defender territory.

**INFERENCE:** visual personality overlap is stronger than functional overlap.

**DESIGN PROPOSAL:** maintain Akari's deceptive small-ball/positioning identity and Ayame's drawn-in defensive risk as explicit behavioral contrasts.

**Risk:** MEDIUM.

### Catchers

Members: bw005, bw011, bw021, bw030.

**OBSERVATION:** all four have different play identities: risk_manager, sacrifice_support, pitchout_trap, rally_control.

**OBSERVATION:** bw005/bw030 are the strongest visual overlap.

**INFERENCE:** the catcher group is functionally differentiated but visually concentrated.

**Risk:** HIGH for bw005/bw030, MEDIUM elsewhere.

---

## 15. Differentiation Proposals

These are proposals only. None changes canon.

### Proposal 01 · Yuna / Towa

**Target:** Visual language  
**Current overlap:** same broad CF runner + athletic/soft/long/sporty/idol presentation.  
**Possible differentiation:** separate stance, facial expression, accessory language and movement personality.  
**Expected identity effect:** Yuna reads as impulsive outdoor athlete; Towa reads as polished stage runner who improvises.  
**Change risk:** MEDIUM.

### Proposal 02 · Yuna / Towa

**Target:** Personality expression  
**Current overlap:** both are bright/positive runners.  
**Possible differentiation:** preserve Yuna's learning-to-brake contradiction and Towa's rehearsed-image-versus-improvisation contradiction in dialogue and animation direction.  
**Expected identity effect:** same broad optimism, different behavioral fantasy.  
**Change risk:** LOW.

### Proposal 03 · Sora / Kagari

**Target:** Visual/body language  
**Current overlap:** power/round/long/standard/tactical catcher.  
**Possible differentiation:** Sora's posture communicates protection and observation; Kagari's posture communicates command and rally direction.  
**Expected identity effect:** defensive guardian versus field commander.  
**Change risk:** MEDIUM.

### Proposal 04 · Sora / Kagari

**Target:** Personality expression  
**Current overlap:** serious/command-oriented catcher family.  
**Possible differentiation:** keep Sora conservative and pitcher-protective; keep Kagari explicitly trust-oriented and delegation-oriented.  
**Expected identity effect:** two leadership fantasies instead of one.  
**Change risk:** LOW.

### Proposal 05 · Pitcher family

**Target:** Visual silhouette  
**Current overlap:** several slim/sharp/long/standard configurations.  
**Possible differentiation:** vary stance, shoulder language, glove position, pre-pitch posture and facial expression.  
**Expected identity effect:** pitchers remain one family while individual pitch fantasies become immediately readable.  
**Change risk:** MEDIUM.

### Proposal 06 · RF power family

**Target:** Behavioral fantasy  
**Current overlap:** RF/power/jacket.  
**Possible differentiation:** preserve Kira as theatrical discipline, Chika as frontal pressure, Aria as team-first star.  
**Expected identity effect:** same position, three distinct social/gameplay fantasies.  
**Change risk:** LOW.

### Proposal 07 · SS contact family

**Target:** Behavior  
**Current overlap:** Miu and Shiori both occupy SS/contact territory.  
**Possible differentiation:** Miu should read through visible improvisation and gap creation; Shiori through observation and delayed reaction.  
**Expected identity effect:** energetic opportunist versus invisible observer.  
**Change risk:** LOW.

### Proposal 08 · SS runner adjacency

**Target:** Fantasy  
**Current overlap:** Shiori and Sena both use quiet/stealth-like baserunning concepts.  
**Possible differentiation:** Shiori = information advantage; Sena = social withdrawal converted into sudden aggression.  
**Expected identity effect:** tactical stealth versus emotional expression.  
**Change risk:** LOW.

### Proposal 09 · Defender family

**Target:** Silhouette/body language  
**Current overlap:** Akari and Ayame share muscular/tomboy/defender territory.  
**Possible differentiation:** Akari reads as practical tactical utility; Ayame reads as stoic positional commitment and home protection.  
**Expected identity effect:** clever defender versus risk-taking wall.  
**Change risk:** LOW/MEDIUM.

### Proposal 10 · R characters

**Target:** Characterization  
**Current overlap:** Aiko, Hina, Yuzu and Noa have fewer narrative/signature-action fields.  
**Possible differentiation:** use future approved dialogue, affinity and story material to reinforce already documented core identities.  
**Expected identity effect:** stronger identity without changing rarity or gameplay.  
**Change risk:** LOW.

### Proposal 11 · Whole roster

**Target:** Hair/silhouette  
**Current overlap:** all canonical characters use long hair.  
**Possible differentiation:** future art review may consider silhouette, headwear, stance and facial expression before relying on hair color.  
**Expected identity effect:** broader recognition independent of recolor.  
**Change risk:** HIGH if applied retroactively because the current art canon explicitly restricts variants.

### Proposal 12 · Relationship layer

**Target:** Relationship Identity  
**Current overlap:** relationships cannot be compared because the common field is absent.  
**Possible differentiation:** future documentation may explicitly record only confirmed rival/friend/mentor/team links.  
**Expected identity effect:** adds social recognition without changing gameplay.  
**Change risk:** MEDIUM/HIGH because it can affect narrative canon.

---

## 16. Change Risk

| Risk | Meaning for this review |
|---|---|
| LOW | presentation or documentation direction that does not require changing canon |
| MEDIUM | could affect existing art direction, dialogue or presentation |
| HIGH | could require changes to canon, existing assets, relationships or the canonical visual contract |

**OBSERVATION:** most useful differentiation proposals can be implemented later through presentation or characterization without touching gameplay.

**DESIGN PROPOSAL:** do not alter the canonical JSON merely to fix a visual overlap discovered by this audit.

---

## 17. Roster Review Matrix

| ID | Name | Primary Hook | Secondary Hook | Character Fantasy | Gameplay Identity | Visual Identity | Personality Identity | Relationship Identity | Overlap Risk | Differentiation Status |
|---|---|---|---|---|---|---|---|---|---|---|
| bw001 | Aiko | warm competitive power | anti-slow slugger | warm forceful slugger | big_swing_threat | power/round/jacket | warm competitive | UNKNOWN | Medium | DISTINCT |
| bw002 | Reina | tempo strategist | refined provocation | composed tempo strategist | tempo_control | athletic/sharp | controlled formal | UNKNOWN | Medium | DISTINCT |
| bw003 | Miu | gap creator | energetic tactician | quick opportunist | gap_creator | balanced/soft | energetic street | UNKNOWN | Medium | DISTINCT |
| bw004 | Yuna | impulsive speedster | learns restraint | speedster learning restraint | aggressive_baserunner | athletic/soft/sporty | cheerful outdoorsy | UNKNOWN | High | OVERLAP RISK |
| bw005 | Sora | protective risk manager | patient guardian | protective catcher | risk_manager | power/round/standard | serious protective | UNKNOWN | High | OVERLAP RISK |
| bw006 | Akari | tactical intimidating defender | small-ball contradiction | clever intimidating defender | unexpected_small_ball | athletic/sharp/sleeveless | tomboy practical | UNKNOWN | Medium | DISTINCT |
| bw007 | Kira | theatrical disciplined slugger | confident showwoman | disciplined showwoman | late_count_batter | power/sharp/jacket | dramatic confident | UNKNOWN | Medium | DISTINCT |
| bw008 | Nao | pattern analyst | provocative observer | silent pattern analyst | contact_manipulator | slim/soft/standard | quiet academic | UNKNOWN | Medium | DISTINCT |
| bw009 | Rika | prankster runner | attention feints | playful pressure runner | first_to_third_pressure | athletic/round/sporty | casual playful | UNKNOWN | Medium | DISTINCT |
| bw010 | Mei | count trapper | technical unpredictability | precision pitch engineer | count_trap | slim/sharp/standard | technical focused | UNKNOWN | Medium | DISTINCT |
| bw011 | Hina | gentle support catcher | neat presence | team-first catcher | sacrifice_support | balanced/soft/standard | kind neat | UNKNOWN | Medium | PARTIALLY DISTINCT |
| bw012 | Sayu | coverage anchor | reserved aggression | unseen defensive anchor | coverage_anchor | balanced/soft/sleeveless | reserved practical | UNKNOWN | Medium | DISTINCT |
| bw013 | Kaede | proud sacrificial slugger | dark elegance | proud slugger learning sacrifice | sacrifice_power | power/sharp/jacket | elegant dark | UNKNOWN | Medium | DISTINCT |
| bw014 | Rin | speed + bunt | quiet precision | short-game speed specialist | hit_for_speed | slim/soft/sporty | quiet athletic | UNKNOWN | Medium | DISTINCT |
| bw015 | Momo | cheerful clutch power | team utility | clutch team hitter | clutch_contact | curvy/warm/jacket | warm cheerful | UNKNOWN | Medium | DISTINCT |
| bw016 | Fuyuki | pickoff pitcher | quiet hidden bite | reserved pitcher with bite | pickoff_control | slim/sharp/standard | reserved traditional | UNKNOWN | Medium | DISTINCT |
| bw017 | Yuzu | situational reliability | tidy cheerfulness | dependable worker | situational_hitter | balanced/soft/standard | cheerful tidy | UNKNOWN | Medium | PARTIALLY DISTINCT |
| bw018 | Koharu | relay specialist | relaxed field identity | coordination guardian | relay_specialist | balanced/round/sleeveless | casual natural | UNKNOWN | Low/Medium | DISTINCT |
| bw019 | Chika | pressure brawler | coordinated aggression | frontal pressure hitter | pressure_hitter | athletic/sharp/jacket | tomboy bold | UNKNOWN | High family | OVERLAP RISK |
| bw020 | Shiori | silent observer | delayed reaction | invisible opportunist | late_reaction_runner | slim/sharp/standard | introverted dark | UNKNOWN | Medium | DISTINCT |
| bw021 | Noa | laid-back trap catcher | practical plan | relaxed strategic catcher | pitchout_trap | balanced/round/standard | easygoing practical | UNKNOWN | Medium | PARTIALLY DISTINCT |
| bw022 | Ayame | stoic defensive wall | home protection | risk-taking defensive wall | drawn_in_defense | power/sharp/sleeveless | stoic tomboy | UNKNOWN | Medium | DISTINCT |
| bw023 | Towa | show-runner | improvises beyond choreography | bright risk runner | steal_home_threat | athletic/soft/sporty | idolish bright | UNKNOWN | High | OVERLAP RISK |
| bw024 | Nene | pressure ace | controlled intensity | controlled ace | pressure_pitcher | power/sharp/standard | proud powerful | UNKNOWN | Medium | DISTINCT |
| bw025 | Itsuki | fundamentals specialist | quiet humility | reliable executioner | fundamental_play | athletic/soft/sleeveless | quiet earthy | UNKNOWN | Low/Medium | DISTINCT |
| bw026 | Ema | squeeze specialist | patient botanist | coordinated patient hitter | squeeze_specialist | curvy/round/standard | calm botanical | UNKNOWN | Low/Medium | DISTINCT |
| bw027 | Hotaru | two-strike survivor | restless expression | stubborn count survivor | two_strike_survivor | balanced/soft/standard | restless expressive | UNKNOWN | Low/Medium | DISTINCT |
| bw028 | Aria | team-first star | polished public image | star who gives spotlight away | team_first_star | curvy/soft/jacket | idol polished | UNKNOWN | High family | OVERLAP RISK |
| bw029 | Sena | silent aggressive runner | social contradiction | withdrawn player expressing through bases | sudden_aggression | athletic/sharp/sporty | hikikomori messy | UNKNOWN | Medium | DISTINCT |
| bw030 | Kagari | command catcher | leadership through trust | field commander learning trust | rally_control | power/round/standard | commanding warm | UNKNOWN | High | OVERLAP RISK |

---

## 18. Overlap Map

This is a diagnostic map, not a quality ranking.

### HIGH RISK

- bw004 ↔ bw023
- bw005 ↔ bw030
- RF/power family: bw007 / bw019 / bw028

### MEDIUM RISK

- pitcher family: bw002 / bw010 / bw016 / bw024
- SS/contact/runner adjacency: bw003 / bw020 / bw029
- defender family: bw006 / bw012 / bw018 / bw022 / bw025
- catcher family: bw011 / bw021 plus the high-risk pair
- 2B/contact: bw008 / bw017

### LOW RISK

- bw018 / bw025 as functional defenders
- bw026 / bw027 as contact specialists
- most characters whose play identity, personality contrast and silhouette are independently documented.

**OBSERVATION:** LOW does not mean superior. It means fewer overlap signals were found during this audit.

---

## 19. Design Recommendations

### IMMEDIATE DESIGN ATTENTION

1. **bw004 / bw023:** separate visual/body-language identity.
2. **bw005 / bw030:** separate catcher command/protection presentation.
3. **RF/power family:** preserve distinct fantasies rather than adding more recolor-based differentiation.
4. **Pitcher family:** make stance and pre-pitch behavior carry more identity.

### FUTURE REVIEW

1. Add structured Relationship Identity only when relationships are canonically confirmed.
2. Review the four R characters after future dialogue/affinity content is confirmed.
3. Review SS/contact/runner adjacency when the action system receives full implementation.
4. Review all long-hair visual templates during a future art-direction pass.

### NO CHANGE REQUIRED

The current evidence supports retaining the existing identity structure for most of the roster. The presence of overlap does not imply that a character should be removed or rewritten.

### MARKET VALIDATION PENDING

Do not infer from this audit that any character type, fanservice category, cosmetic strategy or rarity structure has stronger commercial performance.

---

## 20. Market Validation Pending

The following remain outside the evidence available to this review:

- which character archetypes attract more players;
- which visual/personality combinations improve conversion;
- which cosmetics have greater adoption;
- which fanservice categories affect engagement;
- whether relationship systems improve retention;
- whether visual uniqueness correlates with monetization;
- whether rarity changes collection motivation independently of identity.

**MARKET VALIDATION PENDING:** T010/T010-B did not provide external market evidence.

---

## 21. Open Questions

### UNKNOWN

1. ¿Qué relaciones canónicas conectan realmente a los 30 personajes?
2. ¿Qué personajes tendrán contenido narrativo adicional en producción?
3. ¿Las signature actions producirán diferencias de gameplay observables una vez implementadas?
4. ¿Qué cambios de silueta son compatibles con la dirección artística final?
5. ¿Cuándo una variante cosmética debe convertirse en una nueva entrada de personaje?
6. ¿Cómo se expresará Relationship Hook sin crear una segunda fuente de canon?
7. ¿Qué parte de la diferenciación visual puede resolverse mediante pose y animación?
8. ¿Qué resultados aportaría una futura investigación externa de mercado?
9. ¿Qué políticas de plataforma afectarán fanservice y presentación?

---

## 22. Canon Safety

**FACT:** ningún dato canónico fue modificado durante esta revisión.

No se cambiaron:

- nombres;
- IDs;
- rarezas;
- posiciones;
- especializaciones;
- elementos;
- stats;
- potencial;
- facciones;
- personalidad;
- historia;
- acciones;
- reglas de variantes.

Todas las diferencias propuestas son **DESIGN PROPOSAL**.

---

## 23. Scope

Este documento es un diagnóstico.

No implementa:

- personajes;
- gameplay;
- balance;
- gacha;
- economía;
- combat;
- assets;
- UI;
- audio;
- VFX;
- PWA;
- Telegram;
- Agent Guard.

La secuencia utilizada es:

```
DETECT
→ ANALYZE
→ DOCUMENT
→ PROPOSE
```

No:

```
DETECT
→ MODIFY
```
