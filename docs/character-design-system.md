# BaseWarriors: Meta-Strike · Character Design System

> TAREA 011 · Character Design System + Differentiation
>
> Estado: **DESIGN SYSTEM DOCUMENTAL**
>
> Este documento consolida el estado real del repositorio y propone un marco reutilizable para diseñar, revisar y ampliar personajes sin crear una segunda fuente de verdad.
>
> La investigación externa de mercado de T010-B sigue pendiente. Toda afirmación que dependa de comportamiento de mercado permanece **MARKET VALIDATION PENDING**.

## 1. Purpose

El objetivo es que un personaje de BaseWarriors: Meta-Strike pueda ser reconocible por una combinación de identidad visual, personalidad, función deportiva, relaciones y presentación, y no únicamente por color de pelo, ropa, rareza o fanservice.

El sistema se utiliza como herramienta de diseño y revisión. No cambia por sí mismo gameplay, balance, gacha, economía, UI, assets ni datos existentes.

**DESIGN PROPOSAL:** un personaje nuevo debería pasar por una prueba de identidad multidimensional antes de entrar al roster.

Pregunta de control:

> Si cambio el color de pelo y la ropa, ¿todavía puedo explicar quién es esta personaje y qué hace en un partido?

Preguntas complementarias:

- Si elimino la rareza, ¿sigue teniendo una identidad?
- Si elimino la presentación visual, ¿su personalidad sigue siendo reconocible?
- Si elimino la personalidad, ¿su función jugable sigue teniendo una razón clara para existir?
- Si elimino el gameplay, ¿quedan rasgos visuales, sociales o narrativos que la distingan?

Cuando el repositorio no contiene evidencia suficiente para responder una pregunta, el resultado se marca **UNKNOWN**.

---

## 2. Current Roster Audit

### 2.1 Fuente canónica

**FACT:** el roster técnico canónico contiene 30 personajes adultos, IDs `bw001` a `bw030`, en `game/characters/character_archetypes.json`.

**FACT:** `game/characters/character_archetype_catalog.gd` carga ese catálogo y construye `PlayerData` y `AvatarProfile`.

**FACT:** `docs/canon/character-art-canon-v1.md` declara ese JSON como fuente primaria de identidad.

**FACT:** `docs/character-roster-30.md` documenta las mismas 30 plantillas y la distribución R/SR/SSR/UR.

### 2.2 Otras fuentes encontradas

| Fuente | Alcance | Estado |
|---|---|---|
| `game/characters/character_archetypes.json` | Roster técnico completo bw001-bw030 | **FACT: CANÓNICA** |
| `game/characters/character_archetype_catalog.gd` | Loader/factory de PlayerData y AvatarProfile | **FACT: IMPLEMENTADA** |
| `data/characters_queue.json` | Cola de datos bw015-bw030 | **FACT: FUENTE SECUNDARIA/PRESENTE** |
| `webapp/data/waifus_config.json` | 8 personajes de la WebApp: Cari, Cami, Sunna, Chie, Scarlet, Chloe, Fenrir, Roxie Vane | **FACT: FUENTE WEBAPP SEPARADA** |
| `docs/characters/` | Presentaciones, diversidad, acciones y sistema de habilidades | **FACT: DOCUMENTACIÓN** |
| `docs/canon/` | Continuidad de personalidad, afinidad y arte | **FACT: DOCUMENTACIÓN CANÓNICA POR DOCUMENTO** |
| `data/factions.json` | Facciones y lenguaje visual/colección | **FACT: FUENTE DE FACCIONES** |

**OBSERVATION:** existen varias representaciones de personajes en el repositorio. No deben fusionarse en esta tarea. La autoridad del roster base continúa siendo `game/characters/character_archetypes.json`.

**UNKNOWN:** no se ha demostrado mediante una auditoría de ejecución que todos los consumidores del repositorio utilicen exclusivamente el catálogo canónico.

### 2.3 Roster canónico resumido

La siguiente tabla usa únicamente datos presentes en el catálogo. La columna Personality es una lectura documental de `style_tags`, arquetipo y semilla narrativa, no una personalidad inventada fuera del catálogo.

| ID | Nombre | Rareza | Rol/posición | Arquetipo | Personalidad documentada | Elemento | Función jugable | Identidad visual | Fuente |
|---|---|---|---|---|---|---|---|---|---|
| bw001 | Aiko Hanamori | R | 3B / power | powerful_firebrand | sporty, warm, competitive | fire | big_swing_threat | power, round, jacket | character_archetypes |
| bw002 | Reina Kurose | SSR | P / pitcher | refined_ice_strategist | elegant, controlled, formal | ice | tempo_control | athletic, sharp, standard | character_archetypes |
| bw003 | Miu Tachibana | SR | SS / contact | quick_witted_lightning_shortstop | energetic, street, sharp | lightning | gap_creator | balanced, soft, standard | character_archetypes |
| bw004 | Yuna Minase | SSR | CF / runner | sunny_nature_sprinter | athletic, outdoorsy, cheerful | nature | aggressive_baserunner | athletic, soft, sporty | character_archetypes |
| bw005 | Sora Amamiya | SR | C / catcher | commanding_water_catcher | strong, protective, serious | water | risk_manager | power, round, standard | character_archetypes |
| bw006 | Akari Shimizu | SR | 1B / defender | muscular_ice_wall | muscular, tomboy, practical | lightning | unexpected_small_ball | athletic, sharp, sleeveless | character_archetypes |
| bw007 | Kira Kurosawa | SSR | RF / power | dark_power_showwoman | dramatic, confident, voluptuous | darkness | late_count_batter | power, sharp, jacket | character_archetypes |
| bw008 | Nao Fujimoto | SR | 2B / contact | quiet_blue_contact_analyst | slim, quiet, academic | water | contact_manipulator | slim, soft, standard | character_archetypes |
| bw009 | Rika Moriyama | SR | LF / runner | earthy_runner_prankster | athletic, casual, playful | nature | first_to_third_pressure | athletic, round, sporty | character_archetypes |
| bw010 | Mei Kanzaki | SSR | DH / pitcher | lightning_precision_pitcher | slim, technical, focused | lightning | count_trap | slim, sharp, standard | character_archetypes |
| bw011 | Hina Sakuragi | R | C / catcher | gentle_light_catcher | feminine, kind, neat | light | sacrifice_support | balanced, soft, standard | character_archetypes |
| bw012 | Sayu Kisaragi | SR | SS / defender | quiet_nature_defender | natural, reserved, practical | nature | coverage_anchor | balanced, soft, sleeveless | character_archetypes |
| bw013 | Kaede Arakawa | SSR | 3B / power | dark_elegant_slugger | elegant, dark, curvy | darkness | sacrifice_power | power, sharp, jacket | character_archetypes |
| bw014 | Rin Asakura | SR | CF / runner | ice_speed_specialist | slim, athletic, quiet | ice | hit_for_speed | slim, soft, sporty | character_archetypes |
| bw015 | Momo Hoshino | SSR | DH / power | warm_curvy_power_hitter | warm, curvy, cheerful | fire | clutch_contact | curvy, warm, jacket | character_archetypes |
| bw016 | Fuyuki Aono | SR | P / pitcher | reserved_ice_pitcher | slim, reserved, traditional | ice | pickoff_control | slim, sharp, standard | character_archetypes |
| bw017 | Yuzu Takahashi | R | 2B / contact | golden_light_contact_worker | feminine, cheerful, tidy | light | situational_hitter | balanced, soft, standard | character_archetypes |
| bw018 | Koharu Nishiki | SR | LF / defender | green_field_guardian | natural, casual, freckled | nature | relay_specialist | balanced, round, sleeveless | character_archetypes |
| bw019 | Chika Raikou | SSR | RF / power | electric_athletic_brawler | athletic, tomboy, bold | lightning | pressure_hitter | athletic, sharp, jacket | character_archetypes |
| bw020 | Shiori Amane | SR | SS / contact | dark_quiet_contact_ghost | slim, dark, introverted | darkness | late_reaction_runner | slim, sharp, standard | character_archetypes |
| bw021 | Noa Mizuno | R | C / catcher | blue_casual_catcher | casual, easygoing, practical | water | pitchout_trap | balanced, round, standard | character_archetypes |
| bw022 | Ayame Tsukino | SSR | 1B / defender | dark_powerhouse_firstbase | muscular, tomboy, stoic | darkness | drawn_in_defense | power, sharp, sleeveless | character_archetypes |
| bw023 | Towa Amami | SR | CF / runner | bright_athletic_show_runner | athletic, idolish, bright | light | steal_home_threat | athletic, soft, sporty | character_archetypes |
| bw024 | Nene Kagetsu | UR | P / pitcher | fiery_red_ace | powerful, proud | fire | pressure_pitcher | power, sharp, standard | character_archetypes |
| bw025 | Itsuki Kogane | SR | 2B / defender | golden_ice_defensive_worker | athletic, earthy, quiet | ice | fundamental_play | athletic, soft, sleeveless | character_archetypes |
| bw026 | Ema Kuroyuri | SSR | 3B / contact | forest_curvy_contact_gardener | curvy, calm, botanical | nature | squeeze_specialist | curvy, round, standard | character_archetypes |
| bw027 | Hotaru Kazehaya | SR | LF / contact | teal_lightning_contact_spark | casual, expressive, restless | lightning | two_strike_survivor | balanced, soft, standard | character_archetypes |
| bw028 | Aria Solis | SSR | RF / power | golden_light_social_star | curvy, idol, polished | light | team_first_star | curvy, soft, jacket | character_archetypes |
| bw029 | Sena Yoru | SR | SS / runner | dark_fast_hikikomori_runner | athletic, hikikomori, messy | darkness | sudden_aggression | athletic, sharp, sporty | character_archetypes |
| bw030 | Kagari Homura | UR | C / catcher | fire_command_catcher | powerful, commanding, warm | fire | rally_control | power, round, standard | character_archetypes |

**OBSERVATION:** el catálogo ya contiene identidad multidimensional básica: arquetipo, style tags, play identity, story hook, signature action, cuerpo, rostro, cabello, uniforme, colores, ojos y facción.

**OBSERVATION:** las relaciones no aparecen como un campo estructurado común dentro del catálogo. Algunas semillas narrativas sugieren dinámicas, pero no constituyen un sistema de relaciones formal.

**UNKNOWN:** no existe evidencia en el catálogo de que cada personaje tenga actualmente una Relationship Hook explícita y persistente.

### 2.4 Estado de diferenciación sin cabello/ropa

**OBSERVATION:** la estructura actual sí permite diferenciar parcialmente sin depender del pelo o uniforme mediante cuerpo, rostro, facción, personalidad, play identity y signature action.

**OBSERVATION:** también existen zonas de solapamiento. Dos casos tienen la misma combinación registrada de posición, especialización, preset corporal, rostro, peinado, uniforme y facción:

- **bw004 Yuna Minase / bw023 Towa Amami:** CF, runner, athletic, soft, long, sporty, idol_sparkle.
- **bw005 Sora Amamiya / bw030 Kagari Homura:** C, catcher, power, round, long, standard, tactical_milspec.

**INFERENCE:** en esos pares, retirar color de pelo y ropa dejaría menos señales estructurales para diferenciarlas visualmente. La personalidad, elemento, story hook y play identity todavía ofrecen separación, pero el sistema debería exigir una señal visual o conductual adicional antes de aprobar nuevas incorporaciones similares.

**OBSERVATION:** el cabello está registrado como `long` para los 30 personajes del catálogo canónico.

**DESIGN PROPOSAL:** el cabello no debería ser la única variable visual de escape para resolver solapamientos. La futura revisión de arte debe considerar silueta, rostro, accesorios, postura y lenguaje corporal antes de aprobar una variante.

### 2.5 Rareza

**FACT:** distribución actual del catálogo: 4 R, 14 SR, 10 SSR y 2 UR.

**OBSERVATION:** la documentación canónica ya separa rareza de identidad y permite que una R tenga identidad propia sin requerir una habilidad de firma narrativa obligatoria.

**DESIGN PROPOSAL:** la rareza puede modificar presentación y colección, pero no debe funcionar como Primary Hook por sí sola.

---

## 3. Character Identity Model

El modelo propuesto para BaseWarriors es:

```
VISUAL IDENTITY
PERSONALITY IDENTITY
GAMEPLAY IDENTITY
ROLE IDENTITY
FACTION IDENTITY
RELATIONSHIP IDENTITY
COLLECTION IDENTITY
COSMETIC IDENTITY
OPTIONAL FANSERVICE
```

Cada personaje no necesita tener el mismo peso en cada dimensión.

### VISUAL IDENTITY
Silueta, rostro, cabello, paleta, outfit, accesorios, postura y lenguaje corporal.

**DESIGN PROPOSAL:** la identidad visual debe poder describirse en una frase sin depender de rareza.

### PERSONALITY IDENTITY
Hábitos, actitud, humor, competitividad, paciencia, disciplina, sociabilidad, contradicciones y forma de reaccionar.

**OBSERVATION:** el proyecto ya utiliza style tags, arquetipo y story hook como material de personalidad.

### GAMEPLAY IDENTITY
Play identity, especialización, posición y acción de firma.

**OBSERVATION:** el catálogo ya contiene `play_identity` y acciones de firma para las SR/SSR/UR documentadas.

### ROLE IDENTITY
La función que ocupa en el equipo: pitcher, catcher, runner, contact, power o defender.

**DESIGN PROPOSAL:** Role no debe ser el único Gameplay Hook. Dos runners deben poder exigir decisiones distintas.

### FACTION IDENTITY
Lenguaje visual y temático compartido.

**FACT:** `data/factions.json` define cinco familias de presentación: bosozoku_wild, cyber_tech, idol_sparkle, tactical_milspec y shadow_magic.

**DESIGN PROPOSAL:** la facción debe reforzar identidad, no reemplazar personalidad individual.

### RELATIONSHIP IDENTITY
Rivalidad, amistad, mentoría, cooperación, conflicto o conexión de equipo.

**UNKNOWN:** no existe un campo de relación común en el catálogo canónico.

**DESIGN PROPOSAL:** futuras relaciones deben registrarse como conexiones específicas de personaje, no inferirse solo por compartir facción.

### COLLECTION IDENTITY
Razones para recordar y coleccionar: identidad, historia, función, relaciones, expresiones, variantes y rareza.

**FACT:** el proyecto ya documenta R/SR/SSR/UR, afinidad, conversaciones y variantes visuales.

**DESIGN PROPOSAL:** la colección debe conservar el núcleo de identidad aunque cambie la rareza o la presentación.

### COSMETIC IDENTITY
Elementos que pueden variar sin cambiar la identidad central: outfit, paleta secundaria, tema, temporada, accesorios y presentación.

**FACT:** el canon visual limita las variantes técnicas actuales a color de cabello, peinado y body_scale 0.94–1.06.

**DESIGN PROPOSAL:** futuras skins pueden ampliar la presentación únicamente mediante contratos explícitos, sin modificar silenciosamente gameplay.

### OPTIONAL FANSERVICE
Fanservice es una capa opcional.

**FACT:** T010-B separa character appeal, fanservice, sexualization y explicit content.

**DESIGN PROPOSAL:** ningún personaje debe depender exclusivamente de fanservice para justificar su existencia, colección o función.

---

## 4. Hook System

Un **HOOK** es una señal de identidad suficientemente concreta para activar reconocimiento, curiosidad o expectativa.

### Primary Hook
La característica que permite recordar al personaje primero.

Puede ser:
- una contradicción de personalidad;
- una forma de jugar;
- una silueta;
- una relación;
- una combinación muy específica de actitud y función.

### Secondary Hook
Una segunda señal que confirma que se trata de ese personaje.

### Gameplay Hook
Qué decisión o patrón de juego cambia cuando se utiliza.

### Personality Hook
Qué comportamiento se reconoce aunque el personaje esté fuera del campo.

### Visual Hook
Qué se reconoce en una tarjeta, sprite o modelo sin leer el nombre.

### Relationship Hook
Qué vínculo crea una dinámica particular con otra persona o grupo.

### Cosmetic Hook
Qué elemento permite producir variantes reconocibles.

### Optional Fanservice Hook
Una capa adicional, solo cuando tenga sentido para la identidad y el contexto.

**DESIGN PROPOSAL:** una ficha de aprobación debería exigir al menos Primary Hook + Gameplay Hook + Personality Hook + Visual Hook. Relationship y Fanservice pueden quedar pendientes cuando el personaje todavía no los necesite.

---

## 5. Differentiation Matrix

La matriz se utiliza para detectar redundancias, no para puntuar personajes.

Estados:

- **STRONG DIFFERENTIATION:** varias dimensiones independientes separan al personaje.
- **OVERLAP:** comparte demasiados rasgos con otro personaje, pero conserva alguna diferencia útil.
- **DUPLICATE:** la combinación central resulta prácticamente indistinguible y requiere revisión antes de ampliarse.
- **WEAK IDENTITY:** depende demasiado de una sola señal.
- **UNKNOWN:** falta información para evaluar.

| Character | Visual Hook | Personality Hook | Gameplay Hook | Role | Faction | Relationship | Cosmetic Potential | Fanservice Potential | Primary Differentiator | Secondary Differentiator | Overlap Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bw001 Aiko | power silhouette + warm face | competitive/warm | big_swing_threat | 3B power | bosozoku | UNKNOWN | Strong | Optional | competitive power hitter | warm sporty presentation | OVERLAP with other 3B power |
| bw002 Reina | sharp athletic elegance | controlled/formal | tempo_control | P pitcher | shadow | UNKNOWN | Strong | Optional | rhythm-control pitcher | refined presentation | OVERLAP with P pitchers |
| bw003 Miu | balanced sharp-street read | energetic/quick-witted | gap_creator | SS contact | bosozoku | UNKNOWN | Strong | Optional | street shortstop | tactical improvisation | OVERLAP with SS/contact |
| bw004 Yuna | athletic runner silhouette | cheerful/outdoorsy | aggressive_baserunner | CF runner | idol | UNKNOWN | Strong | Optional | aggressive baserunner | bright outdoor identity | DUPLICATE visual tuple with bw023 |
| bw005 Sora | power catcher silhouette | protective/serious | risk_manager | C catcher | tactical | UNKNOWN | Strong | Optional | protective catcher | conservative risk reading | DUPLICATE visual tuple with bw030 |
| bw006 Akari | athletic muscular read | tomboy/practical | unexpected_small_ball | 1B defender | bosozoku | UNKNOWN | Strong | Optional | defensive contradiction | muscular silhouette | OVERLAP with bw022 |
| bw007 Kira | dramatic power silhouette | confident/theatrical | late_count_batter | RF power | idol | UNKNOWN | Strong | Optional | showwoman with discipline | dramatic presentation | OVERLAP with RF power |
| bw008 Nao | slim academic read | quiet/analytical | contact_manipulator | 2B contact | cyber | UNKNOWN | Strong | Optional | pattern-reading contact | academic restraint | OVERLAP with bw017 |
| bw009 Rika | athletic playful read | prankster | first_to_third_pressure | LF runner | bosozoku | UNKNOWN | Strong | Optional | playful baserunning | feint-based identity | OVERLAP with runners |
| bw010 Mei | slim technical read | focused/technical | count_trap | DH pitcher | cyber | UNKNOWN | Strong | Optional | technical count manipulation | precision aesthetic | OVERLAP with pitchers |
| bw011 Hina | soft balanced read | kind/neat | sacrifice_support | C catcher | idol | UNKNOWN | Strong | Optional | gentle support catcher | orderly presentation | OVERLAP with C |
| bw012 Sayu | balanced natural read | reserved/practical | coverage_anchor | SS defender | tactical | UNKNOWN | Strong | Optional | coverage defense | quiet discipline | OVERLAP with defenders |
| bw013 Kaede | dark elegant power | proud/altruistic tension | sacrifice_power | 3B power | shadow | UNKNOWN | Strong | Optional | power with sacrifice identity | dark elegance | OVERLAP with bw001 |
| bw014 Rin | slim speed silhouette | quiet/athletic | hit_for_speed | CF runner | tactical | UNKNOWN | Strong | Optional | speed-first offensive threat | quiet precision | OVERLAP with CF runners |
| bw015 Momo | curvy warm silhouette | cheerful/warm | clutch_contact | DH power | shadow | UNKNOWN | Strong | Optional | clutch power with team utility | warm presentation | OVERLAP with power hitters |
| bw016 Fuyuki | slim sharp read | reserved/traditional | pickoff_control | P pitcher | cyber | UNKNOWN | Strong | Optional | pickoff specialist | shy-to-aggressive contrast | OVERLAP with bw002 |
| bw017 Yuzu | soft tidy read | cheerful/neat | situational_hitter | 2B contact | idol | UNKNOWN | Strong | Optional | dependable situational hitter | tidy identity | OVERLAP with bw008 |
| bw018 Koharu | round/freckled read | casual/natural | relay_specialist | LF defender | shadow | UNKNOWN | Strong | Optional | relay specialist | freckles/casuality | OVERLAP with defenders |
| bw019 Chika | athletic bold silhouette | tomboy/bold | pressure_hitter | RF power | bosozoku | UNKNOWN | Strong | Optional | frontal pressure hitter | brawler energy | OVERLAP with RF power |
| bw020 Shiori | slim dark read | introverted | late_reaction_runner | SS contact | cyber | UNKNOWN | Strong | Optional | silent reaction timing | dark reserved presentation | OVERLAP with bw003 |
| bw021 Noa | balanced casual read | easygoing/practical | pitchout_trap | C catcher | tactical | UNKNOWN | Strong | Optional | relaxed catcher with trap identity | casual tone | OVERLAP with C |
| bw022 Ayame | power muscular silhouette | stoic/tomboy | drawn_in_defense | 1B defender | bosozoku | UNKNOWN | Strong | Optional | aggressive defensive positioning | muscular stoicism | OVERLAP with bw006 |
| bw023 Towa | athletic bright silhouette | idolish/bright | steal_home_threat | CF runner | idol | UNKNOWN | Strong | Optional | show runner | stage energy | DUPLICATE visual tuple with bw004 |
| bw024 Nene | power sharp ace read | proud/powerful | pressure_pitcher | P pitcher | tactical | UNKNOWN | Strong | Optional | ace pressure | red/fire identity | OVERLAP with P |
| bw025 Itsuki | athletic grounded read | quiet/earthy | fundamental_play | 2B defender | cyber | UNKNOWN | Strong | Optional | fundamentals defender | reliable execution | OVERLAP with defenders |
| bw026 Ema | curvy botanical read | calm/botanical | squeeze_specialist | 3B contact | shadow | UNKNOWN | Strong | Optional | squeeze specialist | patient temperament | OVERLAP with contact |
| bw027 Hotaru | balanced expressive read | restless/expressive | two_strike_survivor | LF contact | bosozoku | UNKNOWN | Strong | Optional | two-strike survival | restless energy | OVERLAP with contact |
| bw028 Aria | curvy polished silhouette | idol/polished | team_first_star | RF power | idol | UNKNOWN | Strong | Optional | star identity with team-first play | polished social persona | OVERLAP with RF power |
| bw029 Sena | athletic messy read | hikikomori/messy | sudden_aggression | SS runner | cyber | UNKNOWN | Strong | Optional | silent aggressive runner | social contradiction | OVERLAP with runners |
| bw030 Kagari | power round silhouette | commanding/warm | rally_control | C catcher | tactical | UNKNOWN | Strong | Optional | command catcher | warm leadership | DUPLICATE visual tuple with bw005 |

**OBSERVATION:** la matriz revela que el roster ya tiene numerosos Gameplay Hooks específicos, lo que reduce la dependencia del aspecto.

**INFERENCE:** el riesgo futuro no es únicamente crear dos personajes con el mismo rol. El mayor riesgo es repetir simultáneamente rol + silueta + rostro + uniforme + facción + comportamiento.

**DESIGN PROPOSAL:** antes de aprobar un personaje nuevo, comparar al menos Primary Hook, Visual Hook, Personality Hook y Gameplay Hook contra todo el roster, y revisar de forma manual cualquier coincidencia fuerte.

---

## 6. Overlap Analysis

### Solapamientos estructurales detectados

**OBSERVATION:** `bw004/bw023` comparten exactamente la combinación registrada de CF + runner + athletic + soft + long + sporty + idol_sparkle.

**DESIGN PROPOSAL:** diferenciarlas en futuras revisiones mediante postura, accesorios, lenguaje corporal, expresión recurrente o relación, sin tocar estadísticas ni canon existente automáticamente.

**OBSERVATION:** `bw005/bw030` comparten exactamente C + catcher + power + round + long + standard + tactical_milspec.

**DESIGN PROPOSAL:** introducir una señal de mando, gesto de campo, accesorio o lenguaje corporal claramente diferente antes de crear nuevas variantes de este grupo.

**OBSERVATION:** `bw002/bw016/bw024` comparten posición pitcher y especialización pitcher. bw002 y bw016 también comparten slim + sharp + long + standard; bw024 usa power en lugar de slim.

**DESIGN PROPOSAL:** conservar diferencias de ritmo, postura, silueta y comportamiento, evitando que el color elemental sea el único diferenciador.

**OBSERVATION:** `bw007/bw019/bw028` comparten RF + power y uniforme jacket. Sus arquetipos, cuerpos, rostros, facciones y personalidades aportan diferencias, pero el grupo debe revisarse como familia.

**OBSERVATION:** `bw003/bw020` comparten SS + contact y rostro sharp/soft respectivamente, con enfoques de personalidad y facción diferentes.

**OBSERVATION:** `bw008/bw017` comparten 2B + contact y uniforme standard, pero difieren en cuerpo, facción, personalidad y elemento.

**OBSERVATION:** `bw006/bw022` comparten defender, silueta atlética/power, tomboy y rasgos musculares. Sus posiciones, play identities y cuerpos ayudan a separar la función.

No se elimina ni se rediseña ningún personaje existente como consecuencia de este análisis.

---

## 7. Archetype Framework

El proyecto no necesita un único arquetipo cerrado. Necesita combinar cuatro ejes:

### Personality Archetype
Ejemplos documentados: competitive, reserved, cheerful, analytical, protective, tomboy, introverted, playful, commanding.

### Gameplay Archetype
Ejemplos documentados: big_swing_threat, tempo_control, aggressive_baserunner, pitchout_trap, squeeze_specialist, pressure_pitcher.

### Visual Archetype
Combinación de body preset, face style, hair, uniform, palette, accessories y postura.

### Relationship Archetype
Pendiente de formalización. Puede expresar rival, compañera de confianza, mentora, protegida, pareja de batería, rivalidad deportiva o vínculo de facción.

**DESIGN PROPOSAL:** un personaje nuevo debe ser una combinación, no una etiqueta única.

Ejemplo de estructura no canónica:

```
PERSONALITY: competitive + pragmatic
GAMEPLAY: high-risk baserunner
VISUAL: athletic + street
RELATIONSHIP: rival/protector
```

El ejemplo es únicamente una estructura de diseño y no agrega un personaje al canon.

---

## 8. Silhouette

**FACT:** el catálogo utiliza presets `power`, `athletic`, `balanced`, `slim` y `curvy`.

**FACT:** el sistema visual registra altura, hombros, cintura, cadera, busto y escala de cabeza, además de rostro y ropa.

**FACT:** todos los 30 personajes canónicos tienen actualmente `hair_style: long`.

**DESIGN PROPOSAL:** la silueta debe evaluarse en este orden:

1. proporción corporal;
2. postura;
3. rostro;
4. accesorio/headwear;
5. lenguaje de brazos y piernas;
6. uniforme;
7. cabello;
8. color.

El color de pelo no debe ser el primer recurso de diferenciación.

**DESIGN PROPOSAL:** una nueva silueta debe poder reconocerse en una miniatura monocromática antes de usar color.

---

## 9. Color

Separar funciones:

| Color | Función propuesta |
|---|---|
| Primary Color | Identidad individual |
| Secondary Color | Profundidad de outfit/presentación |
| Accent Color | Señal reconocible del personaje |
| Faction Color | Cohesión temática de grupo |
| Element Color | Señal de sistema/gameplay |
| Rarity Color | Señal de colección/UI |

**FACT:** las facciones ya tienen paletas propias en `data/factions.json`.

**FACT:** la UI documenta colores de rareza R/SR/SSR/UR.

**DESIGN PROPOSAL:** element y rarity deben permanecer como capas de sistema. No deberían reemplazar la paleta individual.

**DESIGN PROPOSAL:** una nueva personaje no debería depender de un color elemental para ser reconocible.

---

## 10. Body Type

**FACT:** el proyecto ya adopta diversidad corporal como principio de roster y dispone de cinco presets base.

**FACT:** `docs/characters/character-diversity-v1.md` establece que el cuerpo no es una escala automática de poder.

**DESIGN PROPOSAL:** considerar altura, complexión, proporción, athleticism y presentación adulta como herramientas de identidad visual.

No sexualizar automáticamente una diferencia corporal. El cuerpo debe servir a silueta, personalidad, lectura deportiva y variedad del roster.

---

## 11. Fashion

Separación conceptual:

- **BASE OUTFIT:** uniforme y silueta base.
- **COMBAT OUTFIT:** presentación deportiva utilizada en el partido.
- **CASUAL OUTFIT:** expresión fuera del campo.
- **EVENT OUTFIT:** tema temporal.
- **COSMETIC VARIANT:** variante de presentación.

**FACT:** el canon visual actual limita las variantes técnicas de plantilla a color de cabello, peinado y body_scale.

**DESIGN PROPOSAL:** una futura skin puede cambiar outfit, palette, theme, season o event, pero debe conservar suficientes señales de silueta, personalidad y núcleo visual.

---

## 12. Fanservice

Referencia obligatoria: `docs/character-appeal-fanservice-analysis.md`.

Mantener la separación:

```
CHARACTER APPEAL
≠ FANSERVICE
≠ SEXUALIZATION
≠ EXPLICIT CONTENT
```

**FACT:** T010-B clasificó fanservice en visual no sexual, temático, de personalidad, emocional, sugerente/corporal y contenido explícito separado.

**DESIGN PROPOSAL:** el fanservice debe ser opcional y contextual.

Debe poder:
- reforzar personalidad;
- acompañar eventos;
- ampliar colección;
- crear expresiones memorables;
- aportar humor o recompensa de presentación.

No debe:
- definir automáticamente el personaje;
- determinar gameplay;
- sustituir una personalidad;
- convertir rareza en sexualización;
- alterar estadísticas por su presentación.

**MARKET VALIDATION PENDING:** no existe evidencia externa en T010-B para afirmar qué categoría produce mayor conversión, retención, ventas o preferencia.

---

## 13. Collection

La identidad debe sobrevivir a R/SR/SSR/UR.

**FACT:** el proyecto tiene R/SR/SSR/UR y el canon de acciones ya diferencia la profundidad narrativa esperada por rareza.

**DESIGN PROPOSAL:** separar:

```
CHARACTER IDENTITY
≠ RARITY
≠ POWER
≠ COSMETIC
≠ STORY
≠ RELATIONSHIP
```

Una versión de mayor rareza puede ampliar presentación, historia o acción, pero no debería convertirse en una persona diferente.

**DESIGN PROPOSAL:** una futura variante coleccionable debe conservar:
- Primary Hook;
- Personality Hook;
- Visual Core;
- Gameplay Identity;
- al menos una señal de relación o historia cuando exista.

---

## 14. Cosmetics

Principio:

```
COSMETIC CHANGE
→ presentation changes

COSMETIC CHANGE
≠ gameplay identity change
```

Variantes posibles:
- outfit;
- palette;
- season;
- event;
- accessories;
- hairstyle;
- celebration pose;
- expressions;
- profile presentation.

**FACT:** el sistema actual ya separa AvatarProfile de PlayerData y establece que las variantes autorizadas no alteran estadísticas, rareza, elemento, posición o especialización.

**DESIGN PROPOSAL:** futuras skins deberían superar una prueba de reversibilidad: si se retira la skin, el jugador debe poder reconocer inmediatamente al personaje base.

---

## 15. Character Creation Template

Plantilla conceptual para futuras revisiones:

```
Character ID:
Name:

PRIMARY HOOK:

Visual Hook:
Personality Hook:
Gameplay Hook:
Role:
Faction:

Secondary Hooks:

Relationship Hook:
Collection Hook:
Cosmetic Hook:

Optional Fanservice Hook:

Silhouette:

Primary Color:
Secondary Color:
Accent:

Outfit Identity:

Personality Archetypes:
Gameplay Archetypes:
Visual Archetypes:
Relationship Archetype:

Differentiation:

Closest Existing Characters:

Overlap Risks:

Design Status:
FACT / PROPOSAL / PENDING
```

### Approval gate

**DESIGN PROPOSAL:** antes de aprobar una incorporación, responder:

1. ¿Cuál es el Primary Hook?
2. ¿Qué queda si quitamos cabello y ropa?
3. ¿Qué queda si quitamos rareza?
4. ¿Qué hace diferente al personaje durante un partido?
5. ¿Qué comportamiento la distingue fuera del partido?
6. ¿Qué relación podría producir una dinámica única?
7. ¿Qué variantes cosméticas puede soportar?
8. ¿Existe fanservice opcional sin convertirlo en identidad?
9. ¿Qué personaje existente es su vecino conceptual más cercano?
10. ¿Qué impide que se convierta en un clon?

---

## 16. Roster Expansion Rules

**DESIGN PROPOSAL**, revisada contra el estado actual:

1. Un nuevo personaje debe tener un Primary Hook.
2. Debe diferenciarse de personajes existentes en más de una dimensión.
3. Su gameplay no debe ser idéntico a otro sin una razón documentada.
4. La rareza no debe ser su única fuente de atractivo.
5. El fanservice debe ser opcional.
6. Los cambios cosméticos deben preservar identidad.
7. Las relaciones pueden utilizarse como herramienta de diferenciación.
8. La silueta debe revisarse antes de aprobar el diseño.
9. No utilizar cabello/color como única solución a un solapamiento.
10. No convertir facción o elemento en sustituto de personalidad.
11. Un personaje debe tener al menos una razón no-fanservice para ser memorable.
12. Si el personaje comparte rol, cuerpo, rostro y estilo de outfit con otro, exigir una diferencia adicional de comportamiento, silueta o gameplay.
13. No crear una nueva fuente de verdad de roster.
14. Registrar la fuente canónica utilizada para cada nuevo diseño.
15. No convertir una propuesta de personalidad en canon hasta que exista una entrada específica que la confirme.

---

## 17. Market Validation Pending

**MARKET VALIDATION PENDING**

Estas preguntas requieren investigación externa real antes de convertirse en afirmaciones:

- qué tipos de personajes atraen más jugadores;
- qué combinaciones de visual + personalidad son más utilizadas;
- qué tipos de fanservice aparecen con mayor frecuencia;
- qué cosméticos tienen mayor adopción;
- qué arquetipos aparecen con mayor frecuencia en productos comparables;
- qué elementos afectan conversión o retención;
- qué sistemas de relación producen mayor interacción;
- cómo se comporta la percepción de sexualización frente a character appeal;
- qué diseños mantienen identidad fuerte sin depender de sexualización;
- qué diferencias de diseño ayudan a la memorabilidad en rosters grandes.

**UNKNOWN:** T010-B no aportó evidencia externa para responder estas preguntas.

No se realizan rankings, puntuaciones ni conclusiones de mercado en este documento.

---

## 18. Competitor Differentiation Framework

No se realiza una comparación exhaustiva en T011.

Cuando exista investigación externa, utilizar:

| Dimension | BaseWarriors | Competitor A | Competitor B | Competitor C |
|---|---|---|---|---|
| Visual Identity | Pending | Pending | Pending | Pending |
| Character Identity | Pending | Pending | Pending | Pending |
| Gameplay Identity | Pending | Pending | Pending | Pending |
| Fanservice | Pending | Pending | Pending | Pending |
| Cosmetics | Pending | Pending | Pending | Pending |
| Collection | Pending | Pending | Pending | Pending |
| Tone | Pending | Pending | Pending | Pending |
| Relationship Design | Pending | Pending | Pending | Pending |

**DESIGN PROPOSAL:** la comparación debe describir patrones, no declarar ganadores.

---

## 19. BaseWarriors Design Pillars

### Pillar 1 · Baseball first, character always
**Purpose:** mantener el deporte como lenguaje de identidad.

**How it appears:** cada personaje tiene una manera particular de jugar, no solo estadísticas.

**What to avoid:** convertir habilidades en ataques RPG desconectados del béisbol.

### Pillar 2 · A character is a combination
**Purpose:** impedir personajes intercambiables.

**How it appears:** cuerpo + personalidad + función + relación + presentación.

**What to avoid:** crear una nueva personaje cambiando solamente pelo y color.

### Pillar 3 · Contradiction creates depth
**Purpose:** evitar arquetipos planos.

**How it appears:** una característica social o visual puede contrastar con su decisión deportiva.

**What to avoid:** hacer que el arquetipo determine automáticamente estadísticas.

### Pillar 4 · Silhouette before recolor
**Purpose:** lograr reconocimiento incluso sin color.

**How it appears:** proporción, postura, rostro, accesorios y lenguaje corporal.

**What to avoid:** usar color de pelo como solución universal.

### Pillar 5 · Rarity is a layer, not a personality
**Purpose:** proteger identidad a través de R/SR/SSR/UR.

**How it appears:** la rareza cambia presentación y valor de colección sin reemplazar al personaje.

**What to avoid:** tratar una UR como una personalidad automáticamente superior.

### Pillar 6 · Factions frame, characters differentiate
**Purpose:** crear cohesión sin clones.

**How it appears:** facción comparte lenguaje visual; cada personaje rompe el molde con hooks propios.

**What to avoid:** convertir la paleta de facción en identidad completa.

### Pillar 7 · Fanservice is an option, not a skeleton
**Purpose:** permitir presentación ecchi/adulta sin depender de ella.

**How it appears:** fanservice contextual puede acompañar personalidad, eventos y cosméticos.

**What to avoid:** usar sexualización como única razón para recordar o coleccionar una personaje.

### Pillar 8 · Gameplay and appearance remain separate
**Purpose:** preservar consistencia del sistema.

**How it appears:** AvatarProfile representa; PlayerData y sistemas de gameplay resuelven.

**What to avoid:** inferir estadísticas, resultados o rareza desde apariencia.

---

## 20. BaseWarriors Character North Star

**DESIGN PROPOSAL**

> **Reconocer a una personaje antes de leer su rareza y entender por qué juega así antes de mirar sus estadísticas.**

La experiencia buscada es que el jugador pueda reconocer una silueta, anticipar una actitud y asociarla con una forma de jugar.

La identidad no debe depender de una sola capa. El personaje debe sentirse como una persona deportiva concreta dentro del mundo de BaseWarriors, y no como una ficha intercambiable de un catálogo.

---

## 21. Open Questions

### UNKNOWN

1. ¿Qué relaciones serán realmente necesarias para diferenciar el roster a gran escala?
2. ¿Qué campos de personalidad deberán pasar de etiquetas a datos estructurados?
3. ¿Qué elementos visuales adicionales pueden introducirse sin romper el canon de variantes actual?
4. ¿Cuándo una variante deja de ser cosmetic y pasa a ser un personaje nuevo?
5. ¿Cómo se expresará Relationship Hook en la futura narrativa?
6. ¿Qué acciones de firma llegarán realmente al resolver?
7. ¿Qué criterios visuales deberán validar una silueta final antes de producción?
8. ¿Qué patrones de mercado respaldan o contradicen estos pilares?
9. ¿Qué políticas de plataforma afectan fanservice, monetización y presentación?
10. ¿Cómo se medirá internamente la redundancia del roster sin convertir la matriz en un ranking de personajes?

---

## 22. Scope and Continuity

Este documento es documental.

No modifica:
- gameplay;
- combat_core.js;
- combat.js;
- timing_ring.js;
- gacha;
- economy;
- Shop;
- Telegram;
- SaveSystem;
- PWA;
- Godot runtime;
- assets;
- UI;
- audio;
- VFX;
- Agent Guard;
- personajes existentes;
- rarezas;
- estadísticas;
- balance.

No crea personajes nuevos.

No genera assets.

No convierte propuestas en canon técnico.

La continuidad debe mantenerse con:

```
game/characters/character_archetypes.json
        ↓
character design system
        ↓
future character review
        ↓
explicit character-specific approval
```

El sistema documental no crea una segunda fuente de verdad.

---

## 23. Source Boundary

Fuentes principales inspeccionadas:

- `README.md`
- `docs/bitacora.md`
- `docs/ui-style-guide.md`
- `docs/character-appeal-fanservice-analysis.md`
- `docs/character-roster-30.md`
- `docs/avatar-visual-system.md`
- `docs/character-art-pipeline.md`
- `docs/characters/character-diversity-v1.md`
- `docs/characters/character-action-design-v1.md`
- `docs/canon/character-art-canon-v1.md`
- `docs/canon/character-personality-inspiration-bible-v1.md`
- `docs/canon/charm-and-affection-canon-v1.md`
- `game/characters/character_archetypes.json`
- `game/characters/character_archetype_catalog.gd`
- `game/characters/player_data.gd`
- `game/characters/character_roster_store.gd`
- `data/characters_queue.json`
- `data/factions.json`
- `webapp/data/waifus_config.json`

**FACT:** no external market source was required or used for this task.

**UNKNOWN:** market validation remains outside the evidence available in this execution.
