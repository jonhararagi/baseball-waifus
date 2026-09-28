# BaseWarriors: Meta-Strike
# Character Differentiation Pass

> TAREA 013
> Estado: DESIGN PROPOSAL
> Fuente canónica: `game/characters/character_archetypes.json`
> HEAD de referencia: `09a93e9b41c52ecd6d747d3bc7c2acf36a356308`

## 1. Purpose

Este documento transforma los hallazgos de T012 en una especificación conceptual de diferenciación.

No implementa cambios. No modifica el roster, canon, estadísticas, rarezas, gameplay, código, assets ni imágenes.

La regla central es preservar:

`CORE IDENTITY + CHARACTER FANTASY + GAMEPLAY IDENTITY + CANON`

La diferenciación debe aumentar la lectura inmediata de cada personaje sin convertir una propuesta de dirección artística en una nueva fuente de verdad.

Principio rector:

> **No rediseñar al personaje para resolver un solapamiento. Primero cambiar cómo se comporta, posa y comunica su identidad. Solo escalar el cambio visual cuando las capas de menor impacto no sean suficientes.**

## 2. Design Constraints

- `game/characters/character_archetypes.json` sigue siendo la fuente primaria.
- Las acciones de firma son vocabulario de identidad, no cambios de balance.
- La apariencia no determina estadísticas, rareza, elemento ni resultado deportivo.
- Las relaciones solo se utilizan cuando existe evidencia canónica; cuando no existe, se marca `UNKNOWN`.
- Fanservice no puede utilizarse como solución automática a un problema de identidad.
- Las propuestas de este documento son `DESIGN PROPOSAL`, no canon.
- Las prioridades P0-P3 son prioridades de trabajo, no rankings de personajes.
- No se propone corregir los 30 personajes.
- La regla actual de variantes permite modificar color de cabello, peinado y escala corporal global. Cualquier cambio estructural debe pasar por aprobación explícita.
- El catálogo actual utiliza `hair_style = long` en los 30 personajes. Esto se trata como problema de dirección artística global, no como instrucción para cambiar automáticamente el roster existente.

## 3. Global Hair Direction Problem

### Observación

Los 30 arquetipos canónicos utilizan `hair_style = long`. Por tanto, el cabello largo no puede funcionar actualmente como diferenciador estructural entre personajes del roster.

Esto no significa que el cabello largo sea incorrecto para los personajes existentes. Significa que, a escala de roster, deja de aportar suficiente información discriminativa.

### DESIGN PROPOSAL

En futuras incorporaciones y revisiones visuales, tratar el cabello como una distribución de siluetas, no como un valor por defecto.

Familias posibles:

| Family | Función de diseño |
|---|---|
| Short | despejar cuello/cabeza y cambiar lectura de silueta |
| Medium | punto intermedio entre corto y largo |
| Long | continuidad con parte importante del roster |
| Ponytail | crear una masa secundaria móvil |
| Twin tails | ampliar lectura lateral/superior |
| Braids | introducir ritmo lineal reconocible |
| Bob | compactar el volumen alrededor de la cabeza |
| Asymmetrical | crear un eje visual irregular |
| Other | permitir soluciones específicas cuando exista una razón de identidad |

No se establece un porcentaje comercial ni una cuota obligatoria.

Para los 30 personajes actuales, la propuesta es **NO CHANGE REQUIRED por defecto**. Las modificaciones de peinado solo deben aparecer cuando una revisión específica demuestre que el cambio aporta más identidad que riesgo de romper el diseño existente.

### Regla de decisión

Antes de cambiar cabello:

1. probar body language;
2. probar expresión;
3. probar pose;
4. probar accesorio;
5. probar silueta;
6. solo después evaluar peinado;
7. outfit estructural y rediseño mayor quedan como último recurso.

---

## 4. Yuna vs Towa

## 4.1 Current Identity

### bw004 Yuna Minase

**FACT:** SSR, Nature, CF, Runner, body preset Athletic, soft face, long hair, sporty uniform, green palette, faction Idol Sparkle.

**FACT:** archetype `sunny_nature_sprinter`.

**FACT:** play identity `aggressive_baserunner`.

**FACT:** signature action `delayed_steal`.

**FACT:** story hook: su obsesión por correr la lleva a estudiar cuándo no correr.

**FACT:** contraste: una corredora impulsiva aprende a frenar antes de lanzarse.

**Character Fantasy:** la corredora impulsiva que vive el béisbol como una carrera continua, pero cuyo crecimiento consiste en aprender que acelerar y detenerse son decisiones igualmente importantes.

**Primary Hook - DESIGN PROPOSAL:** **movimiento impulsivo convertido en lectura de timing**.

**Secondary Hooks - DESIGN PROPOSAL:**
- energía física inmediata;
- espontaneidad;
- reacción corporal antes de verbalizar;
- tensión entre acelerar y saber esperar.

**Visual Language - DESIGN PROPOSAL:** deportiva, natural, abierta y cinética. El cuerpo debería parecer preparado para iniciar una carrera incluso cuando está quieto.

**Body Language - DESIGN PROPOSAL:** centro de gravedad ligeramente adelantado, pasos cortos y vivos, brazos que acompañan el movimiento, cambios rápidos de dirección.

**Signature Expression - DESIGN PROPOSAL:** sonrisa competitiva o concentración súbita justo antes de ejecutar una decisión de carrera.

**Signature Pose - DESIGN PROPOSAL:** posición de salida contenida, con una pierna preparada para despegar pero sin ejecutar todavía el robo.

**Silhouette - DESIGN PROPOSAL:** silueta atlética y relativamente limpia, con énfasis en piernas y dirección de movimiento, sin necesitar una nueva estructura corporal.

**Relationship:** UNKNOWN en las fuentes canónicas consultadas para esta tarea. No se crea una relación nueva.

## 4.2 Towa Current Identity

### bw023 Towa Amami

**FACT:** SR, Light, CF, Runner, body preset Athletic, soft face, long hair, sporty uniform, blue/yellow palette, faction Idol Sparkle.

**FACT:** archetype `bright_athletic_show_runner`.

**FACT:** play identity `steal_home_threat`.

**FACT:** signature action `aggressive_extra_base`.

**FACT:** story hook: disfruta del momento de mayor riesgo, decidir si avanzar una base extra.

**FACT:** contraste: una imagen de idol ensayada se rompe cuando improvisa una carrera extra.

**Character Fantasy:** una atleta de escenario que controla su presentación hasta que la situación deportiva la obliga a improvisar.

**Primary Hook - DESIGN PROPOSAL:** **imagen pública controlada que se rompe en improvisación competitiva**.

**Secondary Hooks - DESIGN PROPOSAL:**
- teatralidad;
- conciencia de cómo la ven los demás;
- confianza escénica;
- explosión espontánea cuando aparece una oportunidad.

**Visual Language - DESIGN PROPOSAL:** más performativa que deportiva. Incluso en reposo debería parecer consciente de su presencia y de la mirada del equipo.

**Body Language - DESIGN PROPOSAL:** gestos más amplios, pasos limpios y deliberados, cambios de pose que parecen presentados a una audiencia.

**Signature Expression - DESIGN PROPOSAL:** sonrisa segura que cambia rápidamente a sorpresa o determinación cuando decide tomar una base extra.

**Signature Pose - DESIGN PROPOSAL:** pose de salida más abierta, con un gesto que comunica decisión pública antes del movimiento.

**Silhouette - DESIGN PROPOSAL:** mantener el cuerpo Athletic actual; diferenciar mediante la relación entre torso, brazos y gesto escénico antes de tocar cabello o proporciones.

**Relationship:** UNKNOWN en las fuentes canónicas consultadas para esta tarea. No se crea una relación nueva.

## 4.3 Overlap

T012 identificó una coincidencia estructural fuerte:

- CF;
- Runner;
- Athletic;
- soft face;
- long hair;
- sporty uniform;
- Idol Sparkle;
- velocidad muy alta;
- identidad visual brillante.

El solapamiento no significa que sus fantasías sean iguales.

La diferencia ya existente es:

**Yuna:** impulso -> espera -> robo retrasado.

**Towa:** presentación -> oportunidad -> improvisación -> base extra.

La propuesta consiste en hacer visible esa diferencia durante la presentación.

## 4.4 Differentiation Matrix

| Attribute | Yuna Current | Towa Current | Overlap | Proposed Direction | Risk |
|---|---|---|---|---|---|
| Hair | Long, green | Long, blue | HIGH | Mantener inicialmente; usar conducta y pose | LOW |
| Face | Soft | Soft | HIGH | Diferenciar expresión habitual, no rostro base | LOW |
| Eyes | Dark green | Blue | MEDIUM | Mantener; usar dirección de mirada | LOW |
| Body | Athletic | Athletic | HIGH | No cambiar cuerpo inicialmente | LOW |
| Silhouette | Athletic/sporty | Athletic/sporty | HIGH | Separar por postura y línea de brazos/piernas | LOW |
| Posture | Impulsiva | Escénica | MEDIUM | Hacer visible la preparación de carrera vs presentación | LOW |
| Walking | Propuesta: rápida | Propuesta: medida | MEDIUM | Ritmo corporal distinto | LOW |
| Running | Agresiva | Agresiva con improvisación | HIGH | Yuna más directa; Towa más explosiva en cambio de decisión | LOW |
| Idle | Energía contenida | Presencia performativa | MEDIUM | Idle diferente | LOW |
| Expression | Competitiva | Brillante/escénica | MEDIUM | Separar emoción previa a la acción | LOW |
| Uniform | Sporty | Sporty | HIGH | No cambiar estructura inicialmente | LOW |
| Accessories | UNKNOWN | UNKNOWN | UNKNOWN | No inventar accesorio canónico; evaluar solo si fuera necesario | LOW |
| Color | Green/nature | Blue/light | LOW | No usar color como solución principal | LOW |
| Personality | Impulsiva | Performativa/improvisadora | MEDIUM | Convertir contraste conceptual en comportamiento visible | LOW |
| Social behavior | UNKNOWN | UNKNOWN | UNKNOWN | No inventar relaciones | LOW |
| Gameplay fantasy | Aggressive baserunner | Steal-home threat | MEDIUM | Mantener acciones distintas: delayed steal vs extra base | LOW |
| Relationship | UNKNOWN | UNKNOWN | UNKNOWN | Sin propuesta de canon relacional | LOW |

## 4.5 Visual Language

**DESIGN PROPOSAL:** Yuna debe leerse como **acción retenida**. Towa debe leerse como **acción presentada**.

Yuna:
- menos poses abiertas;
- más inclinación hacia adelante;
- mirada buscando la defensa;
- manos preparadas para reaccionar;
- cambios rápidos de peso.

Towa:
- poses más abiertas;
- mayor conciencia del espacio y de quienes la observan;
- gestos de confianza;
- mirada que alterna entre compañero, público imaginario y objetivo deportivo;
- cambio brusco de compostura cuando aparece una oportunidad.

Esto permite diferenciarlas sin modificar rostro, cuerpo, uniforme o rareza.

## 4.6 Body Language

**Yuna:** restless / explosive / forward-oriented como categorías de diseño.

**Towa:** dramatic / confident / reactive como categorías de diseño.

Estas etiquetas son de lenguaje corporal, no nuevas etiquetas canónicas de personalidad.

## 4.7 Expression

**Yuna:** neutral alerta, sonrisa competitiva, concentración, frustración cuando debe esperar.

**Towa:** neutral presentacional, sonrisa confiada, sorpresa breve, entusiasmo cuando decide improvisar.

No se propone una personalidad artificialmente extrema.

## 4.8 Silhouette

Primera opción: no tocar el cuerpo.

Segunda opción, solo si Level 1 no basta: introducir una diferencia secundaria en la lectura de brazos, postura de hombros, posición de manos o elemento móvil del cabello.

Tercera opción: revisar peinado.

No se propone cambiar body preset ni outfit estructural en esta fase.

## 4.9 Proposed Direction

**PRIORIDAD: P0**

**Recommended Level: LEVEL 1**

Plan mínimo:

1. Yuna = pre-carrera contenida y baja.
2. Towa = presencia escénica más abierta.
3. Yuna = mirada hacia la defensa.
4. Towa = mirada hacia oportunidad/espacio.
5. Yuna = reacción rápida y compacta.
6. Towa = cambio de pose más teatral al tomar decisión.

**Canon Impact: LOW**

La propuesta trabaja presentación y performance, sin modificar datos canónicos.

**Implementation Risk: LOW**

---

## 5. Sora vs Kagari

## 5.1 Current Identity

### bw005 Sora Amamiya

**FACT:** SR, Water, C, Catcher, Power body, round face, long hair, standard uniform, blue palette, Tactical Milspec.

**FACT:** archetype `commanding_water_catcher`.

**FACT:** play identity `risk_manager`.

**FACT:** signature action `pitchout_read`.

**FACT:** story hook: protege a su pitcher incluso cuando eso exige una jugada conservadora.

**Character Fantasy:** catcher protectora que reduce riesgo y convierte la lectura defensiva en una forma de cuidado.

**Primary Hook - DESIGN PROPOSAL:** **protección mediante control del riesgo**.

**Secondary Hooks - DESIGN PROPOSAL:**
- paciencia;
- responsabilidad;
- comunicación defensiva;
- autoridad tranquila.

**Visual Language - DESIGN PROPOSAL:** sólida y estable. Menos teatralidad y más sensación de punto de apoyo del equipo.

**Body Language - DESIGN PROPOSAL:** postura baja y estable, movimientos cortos, manos preparadas para recibir y dirigir.

**Signature Expression - DESIGN PROPOSAL:** concentración tranquila antes de una decisión defensiva.

**Signature Pose - DESIGN PROPOSAL:** catcher stance estable, con atención puesta en pitcher y corredores.

**Silhouette - DESIGN PROPOSAL:** la masa corporal Power ya aporta lectura. No requiere rediseño.

**Relationship:** relación funcional con pitcher está explícita en su story hook; no se define una persona concreta.

### bw030 Kagari Homura

**FACT:** UR, Fire, C, Catcher, Power body, round face, long hair, standard uniform, red/orange palette, Tactical Milspec.

**FACT:** archetype `fire_command_catcher`.

**FACT:** play identity `rally_control`.

**FACT:** signature action `catcher_read`.

**FACT:** story hook: aprende que liderar no consiste en ordenar cada jugada, sino en leer a su pitcher.

**Character Fantasy:** líder de batería que aprende a transformar mando en confianza.

**Primary Hook - DESIGN PROPOSAL:** **liderazgo que aprende a ceder control**.

**Secondary Hooks - DESIGN PROPOSAL:**
- comunicación;
- presencia de capitana;
- confianza interpersonal;
- intensidad competitiva.

**Visual Language - DESIGN PROPOSAL:** más expansiva y comunicativa que Sora. Debe parecer que organiza el campo incluso cuando está quieta.

**Body Language - DESIGN PROPOSAL:** gestos claros de dirección, señales visibles, orientación del torso hacia compañeras y pitcher.

**Signature Expression - DESIGN PROPOSAL:** mirada firme que se suaviza cuando decide confiar.

**Signature Pose - DESIGN PROPOSAL:** postura de mando antes de la jugada, seguida por una pose de escucha/lectura.

**Silhouette - DESIGN PROPOSAL:** conservar Power body y standard uniform; la diferencia principal debe venir del comportamiento.

**Relationship:** la dinámica pitcher-catcher forma parte de su hook funcional, pero no se especifica una relación individual concreta.

## 5.2 Overlap

T012 identificó:

- C;
- Catcher;
- Power body;
- round face;
- long hair;
- standard uniform;
- Tactical Milspec;
- fuerte presencia defensiva.

La diferencia conceptual ya existente es útil:

**Sora:** protege.

**Kagari:** lidera y aprende a confiar.

No conviene separar este par mediante un cambio corporal grande. El comportamiento de catcher es el instrumento de menor impacto y mayor coherencia.

## 5.3 Visual Language

**Sora = anchor.**

- quietud;
- estabilidad;
- atención hacia el pitcher;
- gestos mínimos;
- respuesta controlada.

**Kagari = conductor.**

- señales;
- orientación del cuerpo hacia el grupo;
- gestos de llamada;
- transición visible entre mando y escucha.

## 5.4 Body Language

Sora puede usar categorías:

**defensive + precise + reserved**

Kagari:

**commanding + communicative + dramatic**

Estas categorías son propuestas de performance.

## 5.5 Expression

Sora:
- neutral concentrada;
- preocupación controlada;
- alivio discreto;
- aprobación silenciosa.

Kagari:
- concentración intensa;
- autoridad;
- frustración breve cuando una jugada se rompe;
- expresión de confianza cuando decide delegar.

No hacer que ninguna se vuelva caricaturescamente fría o explosiva.

## 5.6 Silhouette

No cambiar body preset, rostro ni uniforme en primera instancia.

La diferenciación debe venir de:

1. altura de la postura;
2. orientación de hombros;
3. posición de manos;
4. amplitud de gestos;
5. transición entre recibir, señalar y reaccionar.

## 5.7 Proposed Direction

**PRIORIDAD: P0**

**Recommended Level: LEVEL 1**

Sora:
> "Estoy aquí para que el riesgo no llegue a mi pitcher."

Kagari:
> "Estoy aquí para organizar al equipo, pero debo saber cuándo dejar que otra jugadora decida."

Las frases son fórmulas de diseño, no diálogo canónico.

**Canon Impact: LOW**

**Implementation Risk: LOW**

---

## 6. Kira vs Chika vs Aria

## 6.1 Current Identity

### bw007 Kira Kurosawa

**FACT:** SSR, Darkness, RF, Power, Power body, sharp face, long hair, jacket, Idol Sparkle.

**FACT:** archetype `dark_power_showwoman`.

**FACT:** play identity `late_count_batter`.

**FACT:** signature action `disciplined_take`.

**Character Fantasy - DESIGN PROPOSAL:** showwoman que disfruta controlar la expectativa del público y demuestra disciplina precisamente cuando todos esperan espectáculo.

**Primary Hook:** teatralidad disciplinada.

**Body Language:** amplia, elegante, consciente del espacio.

**Signature Expression:** confianza escénica que se vuelve concentración calculada.

**Signature Pose:** postura de bateo deliberadamente estilizada antes de decidir no hacer swing.

### bw019 Chika Raikou

**FACT:** SSR, Lightning, RF, Power, Athletic body, sharp face, long hair, jacket, Bosozoku Wild.

**FACT:** archetype `electric_athletic_brawler`.

**FACT:** play identity `pressure_hitter`.

**FACT:** signature action `hit_and_run_brawl`.

**Character Fantasy - DESIGN PROPOSAL:** bateadora frontal que transforma energía competitiva en presión inmediata, pero debe coordinarse con otra jugadora.

**Primary Hook:** presión frontal y energía física.

**Body Language:** compacta, adelantada, agresiva.

**Signature Expression:** desafío competitivo.

**Signature Pose:** preparación de swing con sensación de ataque inmediato.

### bw028 Aria Solis

**FACT:** SSR, Light, RF, Power, Curvy body, soft face, long hair, jacket, Idol Sparkle.

**FACT:** archetype `golden_light_social_star`.

**FACT:** play identity `team_first_star`.

**FACT:** signature action `team_first_hit`.

**Character Fantasy - DESIGN PROPOSAL:** estrella social que demuestra su valor aceptando que una jugada correcta puede hacerla menos visible.

**Primary Hook:** estrella que comparte protagonismo.

**Body Language:** abierta, social, relajada.

**Signature Expression:** sonrisa segura que permanece incluso al ceder protagonismo.

**Signature Pose:** gesto de reconocimiento hacia una compañera después de una acción útil para el equipo.

## 6.2 Overlap

T012 señaló una concentración de RF/Power con jacket en Kira, Chika y Aria.

La conclusión de diseño es importante:

> El problema es principalmente de familia, no una equivalencia total entre las tres.

No es necesario convertirlas en siluetas radicalmente distintas.

### Diferenciación propuesta

| Dimension | Kira | Chika | Aria |
|---|---|---|---|
| Fantasy | Showwoman disciplinada | Brawler de presión | Star team-first |
| Batting stance | Teatral y controlada | Adelantada y agresiva | Abierta y cooperativa |
| Pre-at-bat | Construye expectativa | Busca imponer ritmo | Lee al equipo |
| Expression | Confianza calculada | Desafío | Calidez segura |
| Team interaction | Juega con la expectativa | Aprende coordinación | Reconoce/produce protagonismo compartido |
| Signature action | Disciplined take | Hit-and-run brawl | Team-first hit |
| Silhouette | Elegante/amplia | Compacta/forward | Curvilínea/relajada |
| Fashion language | Showwoman | Street/brawler | Polished social star |

## 6.3 Proposed Direction

**PRIORIDAD: P1**

**Recommended Level: LEVEL 1**

No cambiar stats, rarezas ni gameplay.

Reforzar:

- Kira = expectativa y autocontrol;
- Chika = presión y movimiento hacia delante;
- Aria = interacción y cooperación visible.

### Canon Impact

**LOW**

La propuesta utiliza identidad ya presente en el catálogo.

### Implementation Risk

**LOW**

La mayor parte del cambio puede resolverse mediante pose, expresión y timing de presentación.

## 6.4 Fanservice

No utilizar fanservice para separar a las tres.

Si futuras variantes cosméticas incluyen fanservice:

- Kira puede apoyarse en teatralidad;
- Chika en actitud deportiva;
- Aria en elegancia/social presentation;

pero estas son **OPTIONAL FANSERVICE** y nunca sustituyen el hook principal.

---

## 7. Pitcher Differentiation

## 7.1 Current Group

| ID | Character | Archetype | Play Identity | Signature | Body | Face | Faction |
|---|---|---|---|---|---|---|---|
| bw002 | Reina Kurose | refined_ice_strategist | tempo_control | tempo_freeze | Athletic | Sharp | Shadow Magic |
| bw010 | Mei Kanzaki | lightning_precision_pitcher | count_trap | count_trap | Slim | Sharp | Cyber Tech |
| bw016 | Fuyuki Aono | reserved_ice_pitcher | pickoff_control | pickoff_check | Slim | Sharp | Cyber Tech |
| bw024 | Nene Kagetsu | fiery_red_ace | pressure_pitcher | pressure_sequence | Power | Sharp | Tactical Milspec |

El riesgo del grupo no es que las cuatro tengan la misma fantasía. Es que el lenguaje visual de pitcher puede tender a una misma lectura: postura fija, gesto serio, lanzamiento frontal.

## 7.2 Immediate Recognition Proposal

El jugador debería poder distinguirlas por el **ritual previo al lanzamiento**, antes de leer estadísticas.

### bw002 Reina

**Fantasy:** controlar el tempo.

**Pre-pitch ritual - DESIGN PROPOSAL:** pausa deliberada, respiración controlada, mirada al bateador y pequeño cambio de ritmo antes de entrar en movimiento.

**Stance:** vertical y elegante.

**Movement:** económico y preciso.

**Expression:** calma con una pequeña provocación.

**Tempo:** variable; parece decidir cuándo empieza realmente el lanzamiento.

**Visual motif:** control del espacio y del tiempo, no fuerza.

**Recommended Level:** LEVEL 1.

### bw010 Mei

**Fantasy:** atrapar al rival en un conteo.

**Pre-pitch ritual - DESIGN PROPOSAL:** comprobación breve y repetitiva, casi técnica, como si confirmara una secuencia.

**Stance:** compacta.

**Movement:** mecánico, limpio, sin gestos sobrantes.

**Expression:** concentración analítica.

**Tempo:** regular hasta el momento en que cambia la secuencia.

**Visual motif:** precisión y patrón.

**Recommended Level:** LEVEL 1.

### bw016 Fuyuki

**Fantasy:** castigar al corredor que se confía.

**Pre-pitch ritual - DESIGN PROPOSAL:** atención periférica al corredor antes de comprometerse con el plato.

**Stance:** ligeramente orientada hacia primera base.

**Movement:** pequeña interrupción o comprobación antes de lanzar.

**Expression:** reservada, casi ausente, hasta detectar una ventaja.

**Tempo:** deliberadamente irregular frente al corredor.

**Visual motif:** vigilancia silenciosa.

**Recommended Level:** LEVEL 1.

### bw024 Nene

**Fantasy:** controlar la presión mediante intensidad.

**Pre-pitch ritual - DESIGN PROPOSAL:** presencia física clara, preparación firme, respiración visible y entrada decidida al lanzamiento.

**Stance:** amplia y estable.

**Movement:** más explosivo que las otras tres.

**Expression:** confianza intensa.

**Tempo:** ascendente, como si construyera presión antes de ejecutar.

**Visual motif:** acumulación de intensidad.

**Recommended Level:** LEVEL 1.

## 7.3 Pitcher Matrix

| Attribute | Reina | Mei | Fuyuki | Nene |
|---|---|---|---|---|
| Core fantasy | Tempo | Pattern/count | Runner control | Pressure |
| Pre-pitch | Pause | Check | Runner glance | Build intensity |
| Stance | Upright | Compact | Side-aware | Broad |
| Movement | Elegant | Technical | Minimal/interrupted | Explosive |
| Expression | Controlled | Analytical | Reserved | Proud/intense |
| Tempo | Variable | Measured | Irregular vs runner | Escalating |
| Main visual cue | Timing | Sequence | Surveillance | Pressure |

Estas son categorías de dirección, no nuevas mecánicas.

## 7.4 Global Pitcher Rule

**DESIGN PROPOSAL:**

Cada pitcher debe poseer un **Pre-Pitch Signature** compuesto por:

`STANCE + RITUAL + GAZE + TEMPO + RELEASE BEHAVIOR`

No se requiere una animación exclusiva completa. Una diferencia de 1-2 gestos consistentes puede ser suficiente para producir reconocimiento.

## 7.5 Canon Safety

No cambiar:

- Pitch;
- Control;
- Stamina;
- rareza;
- elemento;
- especialización;
- signature action IDs.

**Canon Impact: LOW**

**Implementation Risk: LOW**

---

## 8. Body Language System

Este sistema es documental y no define animaciones técnicas.

## 8.1 Core Categories

| Category | Description |
|---|---|
| Confident | ocupa espacio y mantiene postura estable |
| Restless | micro-movimientos, cambios de peso y preparación constante |
| Precise | gestos pequeños y deliberados |
| Relaxed | postura suelta y recuperación rápida |
| Defensive | protege espacio propio o de otra persona |
| Dramatic | movimientos amplios y conscientes |
| Reserved | mínima gesticulación, atención interna |
| Explosive | acumulación breve seguida de movimiento rápido |
| Communicative | cuerpo orientado hacia otras personas |
| Observational | mirada y torso dedicados a leer información |

Estas categorías pueden combinarse. No son arquetipos de personalidad obligatorios.

## 8.2 States

### Idle

Debe responder a la pregunta:

> ¿Cómo ocupa el personaje un espacio cuando no tiene nada que hacer?

### Walk

Debe responder:

> ¿Cómo se desplaza cuando no está compitiendo?

### Run

Debe mostrar:

> ¿Qué parte del cuerpo parece liderar su movimiento?

### Combat Stance / Sports Stance

Debe mostrar:

> ¿Cómo prepara el cuerpo antes de tomar una decisión?

### Pre-action

Debe anticipar:

> ¿Qué hace justo antes de revelar su intención?

### Victory

Debe responder:

> ¿Celebra hacia dentro, hacia el equipo o hacia el público?

### Defeat

Debe responder:

> ¿Absorbe, expresa o transforma la frustración?

### Social Interaction

Debe mostrar:

> ¿Se acerca, mantiene distancia, lidera, escucha o reacciona?

## 8.3 Design Rule

Un personaje no necesita una animación única para cada estado.

Debe mantener una **firma corporal consistente** entre estados.

Ejemplo conceptual:

`confident + dramatic`

puede convertirse en una firma reconocible si ambos rasgos aparecen en idle, pre-action y victory.

---

## 9. Expression System

Las expresiones son una capa de identidad, no un catálogo genérico de caras.

Estados base:

- neutral;
- happy;
- angry;
- focused;
- embarrassed;
- surprised;
- competitive;
- confident;
- worried.

## DESIGN PROPOSAL

Cada personaje debería tener:

**Default expression + pressure expression + joy expression + failure expression**

La pregunta no es solo "¿qué emoción siente?", sino:

> "¿Cómo expresa esa emoción este personaje?"

Ejemplos conceptuales:

- una personalidad reservada puede mostrar preocupación con mirada y tensión de mandíbula;
- una personalidad dramática puede utilizar ojos y sonrisa de forma más amplia;
- una personalidad precisa puede expresar concentración con cambios mínimos;
- una personalidad comunicativa puede mirar a otra compañera antes de reaccionar.

No se asignan automáticamente estos estilos a personajes fuera de los casos ya estudiados.

---

## 10. Silhouette System

## 10.1 Components

La silueta debe revisarse mediante:

1. Hair silhouette
2. Shoulder line
3. Body proportions
4. Accessories
5. Uniform structure
6. Equipment
7. Stance
8. Pose

## 10.2 Safe Differentiators

Orden recomendado:

**LOW RISK**
- stance;
- pose;
- shoulder orientation;
- arm position;
- equipment handling;
- expression.

**MEDIUM RISK**
- accessories;
- hairstyle;
- minor uniform details;
- body-language-driven silhouette.

**HIGHER RISK**
- body preset;
- major uniform structure;
- face redesign;
- new canonical visual equipment.

## 10.3 Silhouette Test

Para una futura revisión:

1. quitar color;
2. quitar detalles internos;
3. reducir el personaje a una masa;
4. observar postura;
5. observar cabello;
6. observar accesorios/equipment;
7. comparar contra vecinos conceptuales.

Si dos personajes siguen siendo indistinguibles, escalar al siguiente nivel de cambio.

---

## 11. Character Design Change Levels

## LEVEL 0 - No change

Usar cuando la identidad ya es suficientemente legible.

**Effect:** ninguno.

**Canon Impact:** NONE.

**Implementation Risk:** LOW.

## LEVEL 1 - Performance / Body Language

Cambiar:

- postura;
- ritmo;
- idle;
- walking;
- pre-action;
- expression;
- signature pose.

No cambia la estructura visual.

**Canon Impact:** NONE/LOW.

**Implementation Risk:** LOW.

## LEVEL 2 - Secondary Visual Elements

Cambiar o introducir, con aprobación:

- accesorio;
- elemento móvil;
- detalle menor de uniforme;
- uso del equipamiento;
- peinado secundario.

**Canon Impact:** LOW/MEDIUM.

**Implementation Risk:** MEDIUM.

## LEVEL 3 - Primary Visual Identity

Cambiar:

- silueta estructural;
- body preset;
- rostro;
- estructura principal del uniforme;
- peinado principal de manera sustancial.

**Canon Impact:** MEDIUM/HIGH.

**Implementation Risk:** HIGH.

Regla:

> No saltar a LEVEL 3 si LEVEL 1 o LEVEL 2 resuelve la redundancia.

---

## 12. Priority Matrix

| Character / Group | Problem | Priority | Recommended Level | Canon Impact | Implementation Risk |
|---|---|---:|---|---|---|
| bw004 Yuna / bw023 Towa | CF + Runner + Athletic + soft face + long hair + sporty + Idol Sparkle | P0 | LEVEL 1 | LOW | LOW |
| bw005 Sora / bw030 Kagari | C + Catcher + Power + round face + long hair + standard + Tactical Milspec | P0 | LEVEL 1 | LOW | LOW |
| bw007 Kira / bw019 Chika / bw028 Aria | RF + Power + jacket family | P1 | LEVEL 1 | LOW | LOW |
| bw002 / bw010 / bw016 / bw024 | Pitcher family can converge in pre-pitch presentation | P1 | LEVEL 1 | LOW | LOW |
| Global future roster hair direction | All current archetypes use long hair | P2 | LEVEL 0 for current roster; future Level 1/2 review | LOW | MEDIUM |
| Other T012 low/medium overlap groups | No critical redesign required from this pass | P3 | LEVEL 0 unless future evidence changes | NONE | LOW |
| Remaining characters without identified critical overlap | No concrete issue requiring intervention | P3 | LEVEL 0 | NONE | LOW |

**Priority meaning:** order of design work only. It is not a quality ranking.

---

## 13. Canon Safety

## Existing canon preserved

No proposal changes:

- character IDs;
- names;
- rarity;
- element;
- position;
- specialization;
- statistics;
- potential;
- signature action IDs;
- body presets;
- face presets;
- base uniform;
- faction.

## Proposal labels

All new directions in this document are:

**DESIGN PROPOSAL**

They become canon only through an explicit future character-specific review.

## Canon Impact scale

### NONE
Performance-only interpretation with no data or asset contract change.

### LOW
Presentation detail that can be added without changing the canonical identity fields.

### MEDIUM
Affects a secondary visual field or requires explicit art approval.

### HIGH
Would modify a primary identity field or create continuity implications.

## Implementation Risk scale

### LOW
Can be prototyped without touching gameplay or character data.

### MEDIUM
Requires coordinated art/presentation work.

### HIGH
Requires source-of-truth changes, migration or major asset replacement.

## Fanservice Safety

`CHARACTER APPEAL ≠ FANSERVICE ≠ SEXUALIZATION ≠ EXPLICIT CONTENT`

Fanservice is not used as a differentiation shortcut.

If a future cosmetic uses optional fanservice, the character must already remain identifiable through:

- personality;
- silhouette;
- pose;
- gameplay identity;
- relationship or team role;
- visual language.

Fanservice remains **OPTIONAL FANSERVICE**, not the Primary Hook.

---

## 14. Market Validation Pending

**MARKET VALIDATION PENDING**

No external market evidence is used in this pass.

Therefore this document does not claim:

- that a particular silhouette sells better;
- that a particular hairstyle is more popular;
- that players prefer one personality;
- that a body type increases conversion;
- that fanservice increases retention;
- that one character design has greater commercial value.

All recommendations are internal design proposals based on repository evidence and T011/T012 principles.

---

## 15. Recommended Next Implementation

The next implementation task should be narrow and reversible.

## NEXT IMPLEMENTATION TASK

### Phase A - Presentation prototype

Implement **only presentation-level differentiation**, without editing canonical identity data.

Scope:

1. Add a documented per-character presentation profile for the six priority cases/groups:
   - Yuna;
   - Towa;
   - Sora;
   - Kagari;
   - Kira;
   - Chika;
   - Aria;
   - the four pitchers.

2. The profile should describe, at minimum:
   - idle posture;
   - pre-action posture;
   - signature pose;
   - expression emphasis;
   - movement tempo;
   - gaze direction;
   - interaction orientation.

3. Prototype the profiles in a presentation-only layer.
4. Do not alter PlayerData.
5. Do not alter combat results.
6. Do not alter stats, rarity, element, position or specialization.
7. Do not alter gacha/economy.
8. Do not add new characters.
9. Do not make the profile a second gameplay source of truth.
10. Compare the resulting silhouettes/poses against the overlap pairs.
11. If Level 1 fails to separate a pair, stop and request a Level 2 design decision rather than silently changing hair, body or outfit.

### Suggested implementation order

**P0**
- Yuna/Towa;
- Sora/Kagari.

**P1**
- Kira/Chika/Aria;
- pitcher pre-pitch signatures.

**P2**
- global future hair-direction tooling/documentation.

The next task must record exactly which proposal was implemented and leave non-selected proposals untouched.

---

## 16. Open Questions

1. Which existing presentation layer should own the future per-character body-language profile?
2. Can the current animation controller express the proposed differences without adding new gameplay-facing state?
3. Which secondary visual accessories are already available in the AvatarProfile contract?
4. Which of the proposed gestures can be expressed with the current 2D/3D prototype?
5. Does the current renderer support enough pose variation to separate Yuna/Towa and Sora/Kagari at a glance?
6. Should future character archetypes be allowed to use additional structural hair families directly in the canonical visual contract?
7. What exact criteria will define "Level 1 failed" before escalating to Level 2?
8. Which relationship data, if any, will become canon for these characters?
9. Which future expressions should be authored as reusable categories versus character-specific states?
10. What external market evidence, if any, should be collected later before making product-level visual decisions?

These remain OPEN/UNKNOWN unless a future source resolves them.

---

## Final Design Decision

This pass does not redesign the roster.

The concrete direction is:

**Yuna ≠ Towa**
through **impulse vs presentation**.

**Sora ≠ Kagari**
through **protection vs leadership/trust**.

**Kira ≠ Chika ≠ Aria**
through **disciplined showmanship vs frontal pressure vs team-first stardom**.

**Pitchers**
through **distinct pre-pitch rituals** rather than new statistics or abilities.

The global hair issue is treated as an art-direction problem for future distribution, not a mandate to rewrite the current 30.

The safest next step is therefore **LEVEL 1 presentation differentiation first**, with escalation only when evidence shows that performance and expression are insufficient.
