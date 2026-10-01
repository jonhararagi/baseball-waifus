# BaseWarriors: Meta-Strike
# Product Direction Rebase

**T064-R · PRODUCT DIRECTION REBASE**

**Estado:** CANONICAL PRODUCT DIRECTION  
**Fecha de auditoría:** 2026-10-01 UTC  
**Audited HEAD:** `72a2c5cfe15ce247c0eaf3ac29c2f360dc5a51a6`

Este documento es la referencia de dirección de producto para continuar el desarrollo de BaseWarriors: Meta-Strike. No reemplaza los documentos de canon narrativo, autoridad de datos, arquitectura técnica, combate, arte o QA. Su función es resolver una pregunta superior:

> ¿Qué experiencia debe construir el conjunto de sistemas existentes?

---

## 1. PRODUCT VISION

BaseWarriors: Meta-Strike debe evolucionar como:

```
ANIME HERO-COLLECTOR
        +
4V4 COMBAT DIRECTION
        +
BASEBALL IDENTITY
```

El béisbol no es un simple tema visual. Es el lenguaje de acción que da identidad al combate:

- pitching;
- batting;
- timing;
- lectura del lanzamiento;
- swing;
- base running;
- posiciones;
- clutch moments;
- composición de equipo;
- lectura del campo.

La colección tampoco es una gacha con personajes deportivos pegados encima.

El personaje es el centro del producto. La adquisición, progression, roster, combate, relación, historia, presentación y eventos deben reforzarse mutuamente.

La propuesta de valor del producto queda:

```
DISCOVER A CHARACTER
    ↓
DESIRE THE CHARACTER
    ↓
OBTAIN THE CHARACTER
    ↓
BUILD THE CHARACTER
    ↓
USE THE CHARACTER
    ↓
UNDERSTAND THE CHARACTER
    ↓
CONNECT WITH THE CHARACTER
    ↓
COLLECT MORE
    ↓
RETURN
```

---

## 2. PLAYER FANTASY

La fantasía objetivo es:

```
CONOZCO UN PERSONAJE
 ↓
LO QUIERO EN MI EQUIPO
 ↓
LO CONSIGO
 ↓
LO DESARROLLO
 ↓
LO PRUEBO EN COMBATE
 ↓
CONOZCO SU PERSONALIDAD
 ↓
DESCUBRO SU HISTORIA
 ↓
LO VEO EN EVENTOS
 ↓
CONOZCO OTROS PERSONAJES
 ↓
QUIERO SEGUIR COLECCIONANDO
```

La emoción principal no debe ser:

> “Tengo muchas estadísticas y una gacha.”

Debe ser:

> “Quiero ver qué puede hacer esta personaje, cómo se comporta y qué lugar puede ocupar en mi equipo.”

---

## 3. CURRENT PRODUCT REALITY

### 3.1 Ruta Web/TMA realmente activa

`webapp/index.html` carga `webapp/js/app.js`.

La inicialización real de la WebApp conecta:

- `GachaController`;
- `GalleryController`;
- `UpgradeSystem`;
- `TeamManager`;
- `RosterPanel`;
- `SaveSystem`;
- `LockerRoom`;
- `ShopManager`;
- `ShopUI`;
- `MainMenu`;
- `CombatRenderer`;
- `RewardPipeline`.

Por lo tanto, la WebApp posee una cantidad importante de foundation real.

### 3.2 Lo que parece “producto” pero no es la ruta normal

`project.godot` utiliza `res://scenes/hub.tscn` como main scene.

Ese Hub de Godot contiene conceptualmente:

- personaje inicial;
- comentarios;
- Historia;
- Equipo;
- Entrenamiento;
- Equipamiento;
- Gacha;
- Inventario;
- Crónicas;
- Eventos;
- Opciones;
- botón de jugar.

Sin embargo, ese Hub utiliza `PlayerProgressStore`, `CharacterRosterStore` y otras superficies Godot separadas de la ruta normal de Player Meta de la WebApp.

Por lo tanto:

**FACT:** existe un Hub jugable/documentado en la rama Godot.

**FACT:** el flujo Web/TMA activo no utiliza ese Hub como experiencia de entrada.

**PRODUCT CONCLUSION:** no debe contarse el Hub de Godot como solución completa de Home/Lobby para el producto Web/TMA.

### 3.3 La WebApp actual

`MainMenu` expone:

```
combat
roster
gacha
dex
locker
leaderboard
settings
```

Esto es navegación funcional, no un verdadero Home/Lobby.

La experiencia comienza alrededor del combate y después ofrece módulos.

---

## 4. CHARACTER EXPERIENCE AUDIT

**Resultado global: PARTIAL**

### Lo que ya existe

El catálogo técnico contiene 30 personajes adultos `bw001`–`bw030` y registra, entre otros:

- rareza;
- elemento;
- posición;
- especialización;
- estadísticas;
- identidad;
- arquetipo;
- style tags;
- play identity;
- signature actions;
- story status;
- story hooks;
- contrast;
- skill roles;
- facción;
- datos visuales.

Esto es una foundation fuerte para character design.

La documentación de diseño también establece una diferenciación basada en personalidad, función deportiva, relaciones y presentación.

### Lo que falta en la experiencia

En la WebApp, el personaje todavía aparece principalmente como:

```
CARD
+
STATS
+
RARITY
+
ROSTER SLOT
```

en vez de:

```
IDENTITY
+
PERSONALITY
+
GAMEPLAY FANTASY
+
RELATIONSHIP
+
PROGRESSION
+
STORY
+
PRESENTATION
```

La experiencia de personaje está fragmentada entre Gallery, RosterPanel, LockerRoom y Gacha.

### Hallazgo crítico

Existe además una ruptura de identidad de datos:

- `game/characters/character_archetypes.json` contiene el roster canónico de 30;
- `data/characters_queue.json` contiene la cola activa de `bw015`–`bw030`;
- `webapp/data/waifus_config.json` y el fallback de `waifu_database.js` conservan nombres históricos como Cari, Cami, Sunna y Roxie Vane.

Esto es una **ARCHITECTURE ISSUE / LEGACY** de coherencia de producto, aunque no se reabre dentro de T064-R.

La regla futura debe ser que ningún nuevo flujo de character experience dependa de esos identificadores históricos como identidad primaria.

---

## 5. SQUAD FANTASY AUDIT

**Resultado: PARTIAL**

### Foundation

El repositorio tiene:

- `TeamManager`;
- `PlayerMetaRosterIntegration`;
- un batter activo;
- dos supports;
- selección de personajes desbloqueados;
- reglas de exclusión de duplicados en supports;
- integración de roster con combate;
- foundation Student 4v4 con roles Buffer, Healer, Debuffer y Batter.

### Gap de producto

La navegación actual comunica:

> “elige un batter y dos supports”

más que:

> “estás construyendo una unidad de combate.”

La foundation técnica 4V4 existe, pero la ruta normal de `app.js` no ejecuta ni presenta directamente la experiencia Student 4v4 como el centro del producto.

Por tanto:

**KEEP:** foundation Student 4v4 ya construida.

**EVOLVE:** convertir la composición de equipo en una fantasía visible, sin reabrir la construcción de roles ni añadir nuevas mecánicas.

**PRODUCT GAP:** el jugador todavía no recibe suficiente feedback de que sus elecciones forman un squad.

---

## 6. COMBAT FANTASY AUDIT

**Resultado: PARTIAL**

No se modifica combate en T064-R.

### Foundation existente

Existe:

- `CombatRenderer`;
- `Timing Ring`;
- `BatterRenderer`;
- `CombatEffects`;
- cámara;
- shake;
- flash;
- bat trails;
- audio;
- haptics;
- Super Swing;
- cut-ins;
- HUD;
- combat result flow;
- Reward Pipeline;
- foundation Student 4v4;
- Kytos deterministic slice.

### Gap de producto

La presentación técnica existe, pero parte de la experiencia sigue siendo una demostración de sistemas:

```
INPUT
→ TIMING
→ RESULT
→ FX
```

y todavía no comunica de forma constante:

```
THIS CHARACTER
→
THIS DECISION
→
THIS PLAYSTYLE
→
THIS MOMENT
```

Además, `CombatRenderer` continúa identificado documentalmente como MIXED porque conserva parte de lógica de combate/presentation histórica.

**KEEP:** efectos, timing, audio, cut-ins y renderer existentes.

**EVOLVE:** character-driven presentation.

**REPLACE LATER:** aislamiento completo de las partes legacy mezcladas del renderer, mediante una tarea explícita y separada.

---

## 7. COLLECTION AUDIT

**Resultado: PARTIAL → FUNCTIONAL FOUNDATION**

### Ya existe

`WaifuDex` y `GalleryController` ofrecen:

- owned/unowned;
- locked;
- rarity;
- role;
- area;
- duplicates;
- active batter;
- progression;
- card inspector;
- share.

T063 añadió la lectura de colección desde Player Meta.

### Por qué todavía no es una experiencia fuerte de collection

La colección todavía es principalmente un navegador de registros.

Le faltan, como experiencia cohesionada:

- descubrimiento motivado;
- metas de colección;
- lectura rápida de identidad;
- character detail como destino principal;
- conexión emocional clara;
- relación entre “quiero esta personaje” y “quiero usarla”.

La collection foundation no está equivocada.

Está incompleta como experiencia de producto.

**KEEP:** Player Meta como autoridad y WaifuDex/Gallery como superficie.

**EVOLVE:** convertir la colección en el lugar donde la intención del jugador se transforma en deseo y decisión.

---

## 8. PROGRESSION AUDIT

**Resultado: FOUNDATION / PARTIAL**

T063 estableció:

```
PlayerMetaAuthority
 ↓
PlayerMetaState
 ↓
progression.characters
 ↓
PlayerMetaPersistenceAdapter
```

`UpgradeSystem` conserva las reglas:

- MAX level 50;
- star rank derivado de duplicados;
- upgrade costs;
- timing bonus.

La progression ya es real y persistente.

### Gap

No existe todavía una experiencia completa de progression:

```
LEVEL
+
STAR
+
MILESTONE
+
CHARACTER IDENTITY
+
LONG-TERM GOAL
```

La mayor parte de la progression sigue apareciendo como metadato.

Además, `RosterPanel` sigue leyendo `inventory.level` para su detalle visual, mientras la autoridad moderna vive en Player Meta progression. Esto puede producir una lectura de nivel desactualizada o reducida a `Lv 1` en esa superficie.

**Clasificación:** UX GAP / PRODUCT GAP.

No se corrige aquí porque T064-R es únicamente dirección.

---

## 9. RELATIONSHIP AUDIT

**Resultado: FOUNDATION / PARTIAL**

Existe infraestructura real para:

- `LockerRoom`;
- rapport;
- skins;
- reacción a interacción;
- ReactionRuleSystem;
- VoiceSystem;
- memoria aparente;
- señales de comportamiento;
- reacciones a Skip;
- documentación de relationship framework.

La documentación separa correctamente:

```
RELATIONSHIP ≠ ROMANCE
```

### Gap

La relationship system todavía vive separada del loop de colección.

El jugador puede:

```
OWN CHARACTER
→
OPEN LOCKER
→
INTERACT
```

pero no existe todavía una cadena cohesionada:

```
OWN
→
USE
→
KNOW
→
TRUST
→
STORY
→
EVENT
```

No crear una nueva relación system por esta observación.

**KEEP:** LockerRoom + ReactionRuleSystem + VoiceSystem.

**EVOLVE:** conectar la identidad existente con character experience y narrative progression.

---

## 10. HOME / LOBBY AUDIT

**Resultado: PRODUCT GAP**

### Lo que existe

Godot posee un Hub conceptual funcional.

Web posee `MainMenu` y varias vistas.

### Lo que no existe en la ruta Web/TMA

No hay actualmente una Home que responda de forma inmediata:

- quién es mi personaje principal;
- cuál es mi squad;
- qué está pasando ahora;
- qué debería hacer después;
- qué contenido está activo;
- qué personaje quiero mirar;
- por qué quiero regresar mañana.

La WebApp empieza como una aplicación de juego, no como una residencia del jugador.

### Dirección

El Home debe convertirse en:

```
PLAYER HOME
 ↓
CHARACTER PRESENCE
 ↓
CURRENT TEAM
 ↓
CURRENT GOAL
 ↓
PLAY / COLLECTION / STORY
```

No debe convertirse en un dashboard corporativo lleno de widgets.

---

## 11. LIVE-SERVICE AUDIT

**Resultado: MISSING / FOUNDATION FRAGMENTS**

### Existe

- Gacha;
- shop;
- Telegram Stars bridge;
- reward pipeline;
- economy boosts;
- event/narrative documentation;
- design proposals for events and banners.

### No existe como producto consolidado en la ruta Web/TMA

- live event runtime;
- timed banner system;
- mission system;
- login reward loop;
- seasonal content runtime;
- durable limited-content scheduler;
- live content home surface.

El panel Godot de “Eventos” es un placeholder/reserva de integración, no un live-service real.

**KEEP:** existing reward, gacha and narrative foundations.

**POSTPONE:** live-service orchestration.

La razón es de secuencia de producto: lanzar live-service sobre una experiencia base que todavía no comunica claramente al personaje genera contenido alrededor de un loop incompleto.

---

## 12. PRESENTATION AUDIT

**Resultado: PARTIAL**

### Foundation real

Existe:

- camera;
- cut-ins;
- particles;
- flash;
- shake;
- trails;
- audio;
- haptics;
- UI motion;
- card inspector;
- Super Swing presentation;
- expression assets;
- 2D presentation contracts;
- character presentation tests.

### Gap

La presentation está más madura alrededor del combate que alrededor de la vida del personaje.

El juego puede amplificar:

```
HIT
→
FLASH
→
SHAKE
→
CUT-IN
```

pero todavía amplifica menos:

```
CHARACTER
→
LOOK
→
PERSONALITY
→
RELATIONSHIP
→
STORY
→
RETURN VALUE
```

Esto explica por qué una gran parte de la foundation puede existir y, aun así, la aplicación sentirse como una demo técnica.

---

## 13. ASSET AUDIT

### Production assets observados

La rama contiene aproximadamente:

- 12 production card assets;
- 32 production sprite assets;
- 60 expression SVG assets para 12 personajes;
- 30 generated character SVGs de roster;
- múltiples assets de UI y presentación.

### Estado futuro por personaje

| Asset | Estado actual | Dirección |
|---|---|---|
| Portrait | PARTIAL | production-grade character portrait |
| Card | PARTIAL | production-grade card |
| Battle sprite | PARTIAL | full pose/action coverage |
| Expressions | PARTIAL | broader expression set |
| Cut-in | PARTIAL | character-specific |
| Special attack presentation | PARTIAL | character-specific spectacle |
| Victory | PARTIAL | character-specific |
| Defeat | PARTIAL | character-specific |
| Story presentation | PARTIAL | scene-ready presentation |
| Event art | MISSING | future content production |

El pipeline existente ya distingue catálogo, generación, validación, assets y manifest.

**KEEP:** pipeline intercambiable de proveedor.

**EVOLVE:** producir assets a partir de character experience real, no en grandes lotes desconectados del producto.

---

## 14. EXTERNAL PRODUCTION STACK

La futura cadena de producción puede usar:

```
Character Data
→
Art Direction
→
Prompt / Reference Generation
→
External Provider
→
PNG
→
Background Removal
→
Crop
→
Validation
→
Resize / Sprite / Portrait / Cut-in
→
Manifest
→
GitHub
```

Los proveedores pueden incluir, según disponibilidad:

- OpenArt;
- Runway;
- Figma;
- Tavily;
- Superpowers;
- Linear;
- GitHub.

La arquitectura de producto no debe depender de uno solo.

La autoridad debe permanecer en los datos, no en la herramienta que produce una imagen.

---

## 15. CHARACTER VALUE MODEL

Cada personaje debe justificar su presencia mediante varias capas:

```
IDENTITY
+
PERSONALITY
+
GAMEPLAY
+
SQUAD ROLE
+
PROGRESSION
+
RELATIONSHIP
+
STORY
+
PRESENTATION
+
COLLECTION VALUE
```

Rareza no reemplaza identidad.

Fanservice no reemplaza personalidad.

Estadísticas no reemplazan fantasy.

Una ilustración bonita no reemplaza gameplay identity.

---

## 16. FOMO DIRECTION

La presión temporal debe venir de contenido interesante:

- eventos;
- banners;
- recompensas temporales;
- variantes;
- escenas;
- oportunidades de colección.

No utilizar:

- castigos artificiales;
- bloqueo agresivo de progression;
- urgencia falsa;
- pérdida extrema de progreso;
- manipulación emocional.

La sensación deseada es:

> “No quiero perderme esta historia/personaje/evento.”

No:

> “Tengo miedo de abandonar el juego.”

---

## 17. PRINCIPAL CONTRADICTION

La contradicción central detectada es:

```
TECHNICAL FOUNDATION
        ↓
WORKING SYSTEM
        ↓
       X
        ↓
PLAYER FANTASY
```

El punto X no es principalmente un bug.

Es una capa de producto ausente.

Los sistemas existen pero están distribuidos como módulos:

```
GACHA
GALLERY
ROSTER
LOCKER
COMBAT
NARRATIVE TEST
SHOP
REWARDS
```

y todavía no forman de manera continua una única experiencia emocional.

La transformación correcta es:

```
MODULES
 ↓
CHARACTER-CENTRIC EXPERIENCE
 ↓
PLAYER LOOP
```

---

## 18. KEEP

Conservar como foundation:

- PlayerMetaAuthority;
- PlayerMetaState;
- PlayerMetaPersistenceAdapter;
- GachaController;
- GachaPlayerMetaIntegration;
- PlayerMetaRosterIntegration;
- TeamManager;
- UpgradeSystem como rules layer;
- WaifuDex;
- GalleryController;
- LockerRoom;
- ReactionRuleSystem;
- VoiceSystem;
- RewardPipeline;
- RewardResolver;
- existing combat/timing infrastructure;
- Student 4v4 technical foundation;
- NarrativeRuntime;
- 2D Presentation contracts;
- production asset pipeline;
- GitHub Actions QA;
- Godot architecture como infraestructura secundaria.

---

## 19. EVOLVE

Prioridades de evolución de producto:

### Evolve 1 · Character Experience

El personaje debe convertirse en el eje de las superficies existentes.

### Evolve 2 · Home / Lobby

El Home debe conectar al jugador con personaje, squad, goal y next action.

### Evolve 3 · Collection UX

La colección debe comunicar deseo, identidad y progression.

### Evolve 4 · Character-driven Presentation

La presentación debe mostrar personalidad y gameplay identity, no solamente impacto visual.

### Evolve 5 · Narrative Integration

NarrativeRuntime debe salir gradualmente del estado de test y entrar en una experiencia de producto.

### Evolve 6 · Live-Service

Solo después de que el loop base sea coherente debe crecer el calendario de eventos y banners.

---

## 20. REPLACE LATER

No son tareas inmediatas:

- legacy character config/fallbacks de la WebApp;
- duplicated/overlapping Telegram bridge ownership;
- mixed CombatRenderer responsibilities;
- broad SaveSystem overlap with Player Meta;
- legacy Gacha balance implementation in `gacha_engine.js`;
- Godot/Web identity synchronization where sources overlap.

Cada sustitución debe tener su propia migración/compatibility task.

---

## 21. LEGACY

Clasificar como LEGACY pero mantener mientras no bloqueen:

- `SaveSystem` como active legacy application save;
- `webapp/data/waifus_config.json`;
- historical `waifu_database.js` fallback identity data;
- Godot Hub authority surfaces;
- old gacha engine balance logic;
- mixed renderer paths;
- legacy navigation assumptions.

Legacy no significa “borrar”.

Significa “no diseñar el futuro alrededor de esto”.

---

## 22. PRODUCT GAPS

Los gaps de producto más importantes son:

1. No existe un Home/Lobby Web/TMA realmente central.
2. El personaje todavía no es el centro visible del loop.
3. 4V4 es una foundation técnica, no una fantasía visible en la navegación normal.
4. Collection funciona, pero todavía no genera suficiente deseo.
5. Relationship existe, pero permanece aislada de collection/story loop.
6. Narrative runtime existe, pero la ruta normal todavía lo trata como test/vertical slice.
7. Live-service no está ensamblado como producto.
8. Production assets no cubren de forma uniforme el roster activo.

---

## 23. UX GAPS

- navegación tipo herramienta en lugar de residencia del jugador;
- character detail fragmentado;
- progression poco visible en roster;
- squad identity débil en navegación;
- next action poco clara;
- poca continuidad entre gacha, character, locker y story;
- falta de un “estado del día” del jugador sin inventar contenido nuevo.

---

## 24. PRESENTATION GAPS

- poca presencia persistente del personaje fuera de combat;
- demasiada concentración de polish en hit feedback;
- faltan beats de character acquisition → reveal → identity;
- faltan presentation loops de victory/idle/story con identidad por personaje;
- muchos assets siguen siendo placeholders, prototipos o coberturas parciales;
- character-specific spectacle todavía no escala al roster completo.

---

## 25. ARCHITECTURAL RISKS

### Risk A · Multiple character representations

Canonical roster y historical WebApp identity data pueden divergir.

### Risk B · Product/architecture split

Godot tiene un Hub que parece resolver Home, mientras Web/TMA posee otra experiencia.

### Risk C · Player Meta not yet universal everywhere

Player Meta es la autoridad moderna para el meta principal, pero algunos sistemas legacy siguen almacenando datos superpuestos.

### Risk D · 4V4 not fully exposed in normal product flow

La foundation existe, pero el player-facing shell no la convierte todavía en la fantasía central.

### Risk E · Presentation maturity is uneven

Combat polish está más avanzado que character/lobby/story presentation.

### Risk F · Live-service before loop closure

Eventos y banners serían prematuros si el jugador todavía no tiene una razón clara para apegarse al roster.

---

## 26. PRODUCT NORTH STAR

La experiencia objetivo es:

```
HOME
 ↓
CHARACTER
 ↓
SQUAD
 ↓
COMBAT
 ↓
RESULT
 ↓
REWARD
 ↓
PROGRESSION
 ↓
COLLECTION
 ↓
STORY
 ↓
EVENT
 ↓
NEW CHARACTER
 ↓
NEW COMBAT
```

Y el loop emocional:

```
DISCOVER
 ↓
DESIRE
 ↓
OBTAIN
 ↓
DEVELOP
 ↓
USE
 ↓
UNDERSTAND
 ↓
CONNECT
 ↓
COLLECT
 ↓
RETURN
```

El jugador debe reconocer el hilo conductor en todo momento:

> “Estoy construyendo un equipo de personajes que quiero conocer y usar.”

---

## 27. ARCHITECTURAL CONSTRAINTS

Toda evolución futura debe respetar:

```
PLAYER DATA
 ↓
GAMEPLAY SYSTEMS
 ↓
BASEBALL / COMBAT RESULT
 ↓
DOMAIN EVENTS
 ↓
PRESENTATION
 ↓
UI / AVATAR / AUDIO / VFX
```

Y:

- PlayerMetaAuthority es la autoridad moderna del player/meta;
- progression es estado persistente, no otra authority;
- UpgradeSystem calcula reglas;
- Roster integration controla ownership/selection boundary;
- RewardResolver calcula rewards;
- RewardAdapter aplica rewards;
- SaveSystem permanece LEGACY / ACTIVE hasta migración explícita;
- UI no decide gameplay;
- presentation no decide gameplay;
- providers de arte son intercambiables;
- no construir sistemas nuevos cuando una superficie existente puede evolucionar.

---

## 28. ASSET / CHARACTER PRODUCTION PRINCIPLE

No producir grandes batches de personajes solamente porque existe una lista de 30.

Primero validar:

```
CHARACTER
→
EXPERIENCE
→
PRESENTATION
→
COLLECTION VALUE
```

Después escalar producción.

La pipeline debe poder cambiar de proveedor sin alterar:

- character ID;
- gameplay identity;
- Player Meta;
- progression;
- roster;
- narrative identity.

---

## 29. NEXT MILESTONES

### Milestone A · Character-Centric Home + Character Experience

Objetivo:

Convertir la Web/TMA en una experiencia donde el personaje principal del jugador sea visible inmediatamente y funcione como puerta hacia roster, collection, progression y play.

### Milestone B · Collection UX

Objetivo:

Transformar WaifuDex/Gallery de browser funcional a collection destination.

### Milestone C · Character Presentation

Objetivo:

Añadir presencia, acquisition reveal, idle, victory, story presentation y character-specific combat feedback sobre assets existentes.

### Milestone D · Narrative Product Integration

Objetivo:

Conectar NarrativeRuntime a una ruta real de story/character discovery sin rehacer el runtime.

### Milestone E · Live-Service Foundation

Objetivo:

Construir events, banners, missions y temporal content alrededor del loop ya demostrado.

---

## 30. NON-GOALS OF THIS REBASE

T064-R no:

- reescribe gameplay;
- modifica combate;
- rebalancea Gacha;
- modifica pity/rates;
- modifica rewards;
- migra SaveSystem;
- migra TMA;
- expande Student 4v4;
- genera nuevos personajes;
- genera nuevos assets;
- implementa eventos;
- implementa monetización;
- crea backend;
- reemplaza Godot;
- reemplaza la WebApp completa.

Su función es fijar dirección para que las siguientes tareas no vuelvan a interpretar BaseWarriors como “un juego de béisbol con una gacha”.

---

## 31. SUCCESS CONDITION

BaseWarriors está correctamente orientado cuando todas las siguientes frases sean verdaderas:

- el personaje es el centro emocional;
- el equipo es una decisión, no un selector;
- el béisbol es la identidad de la acción;
- la colección es una fuente de deseo;
- progression produce apego y mastery;
- relationship añade contexto;
- story explica quién es cada personaje;
- presentation hace visibles esas capas;
- events presentan nuevas razones para jugar;
- cada nuevo character fortalece el loop.

---

## 32. STATUS VOCABULARY

- **FOUNDATION:** existe arquitectura reutilizable.
- **KEEP:** debe conservarse.
- **EVOLVE:** debe crecer sin cambiar su responsabilidad.
- **REPLACE LATER:** requiere migración explícita futura.
- **LEGACY:** activo histórico que no debe gobernar el futuro.
- **CONTENT GAP:** falta contenido de producto.
- **UX GAP:** el sistema existe pero no está expresado bien al jugador.
- **PRESENTATION GAP:** la lógica existe pero carece de comunicación visual suficiente.
- **ARCHITECTURE ISSUE:** riesgo de autoridad, duplicación o acoplamiento.
- **PRODUCT GAP:** falta una pieza necesaria de la experiencia.
- **NOT AN ISSUE:** comportamiento correcto y deliberado.

---

## 33. FINAL PRODUCT DECISION

**BaseWarriors: Meta-Strike no debe construirse como “un juego de béisbol que también tiene personajes”.**

Debe construirse como:

> **un anime hero-collector de combate 4V4 cuya identidad jugable y estética nacen del béisbol.**

El béisbol define cómo se juega.

Los personajes definen por qué importa.

La colección define qué quiere conseguir el jugador.

La progression define por qué quiere seguir con ellos.

La relación y la historia definen por qué le importan.

La presentación define por qué lo recuerda.

Los eventos definen por qué vuelve.

Este es el norte que debe regir las siguientes implementaciones.
