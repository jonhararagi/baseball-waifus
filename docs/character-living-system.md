# BaseWarriors: Meta-Strike
# Character Living System + Player Behavior Reactions

> TAREA 016  
> Estado: DESIGN DOCUMENT  
> Base narrativa: T010-B → T015  
> Fuente canónica de roster: `game/characters/character_archetypes.json`  
> Principio: sistema determinista, preescrito y sin IA generativa.

## 1. Character Living System

### 1.1 Propósito

El sistema de personajes vivos busca que los personajes parezcan consistentes, atentos y emocionalmente reconocibles sin simular una IA general.

La cadena de identidad es:

`CHARACTER IDENTITY → PERSONALITY → GAMEPLAY ROLE → RELATIONSHIPS → COLLECTION → COSMETICS → OPTIONAL FANSERVICE`

La identidad no debe reducirse a rareza, color, uniforme, posición o atributo.

### 1.2 Character profile

Cada personaje puede disponer conceptualmente de:

- identidad;
- personalidad;
- voz y forma de hablar;
- hábitos de comportamiento;
- relaciones;
- conflictos;
- preferencias;
- humor;
- vulnerabilidades;
- desarrollo;
- recuerdos relevantes;
- identidad visual;
- identidad gameplay;
- identidad de colección;
- potencial cosmético;
- fanservice opcional.

Los campos nuevos de este documento son sistema propuesto y no modifican el catálogo canónico.

### 1.3 Personality contract

Una reacción debe respetar primero la personalidad del personaje.

Un mismo estímulo puede recibir interpretaciones distintas:

`PLAYER SIGNAL → CHARACTER FILTER → REACTION`

Por ejemplo, una pausa puede interpretarse como distracción, concentración, preocupación o una oportunidad para bromear.

Las frases son contenido preescrito. El sistema selecciona una reacción válida, no genera una respuesta nueva.

---

## 2. Relationship Framework

Las relaciones pueden existir entre:

- protagonista y alumnas;
- bateadora y bateadora;
- protagonista y Valkyria;
- protagonista y ex-Valkyria;
- alumnas y agentes;
- alumnas y personal médico;
- alumnas y personal técnico;
- entrenadores y otros equipos;
- equipo y antagonistas;
- personajes de soporte entre sí.

### 2.1 Relationship dimensions

Una relación puede representar:

- confianza;
- respeto;
- rivalidad;
- amistad;
- tensión;
- preocupación;
- admiración;
- conflicto;
- compañerismo;
- posible interés romántico.

`RELATIONSHIP ≠ ROMANCE`

El romance es una posible dimensión narrativa, no el resultado automático de aumentar confianza.

### 2.2 Relationship state

Sistema conceptual:

`NONE → AWARENESS → FAMILIARITY → TRUST / RIVALRY / TENSION → DEVELOPMENT`

No todas las relaciones necesitan recorrer todas las fases.

Una relación puede permanecer funcional y no romántica durante toda la campaña.

### 2.3 Character-specific interpretation

La misma acción del protagonista debe poder producir respuestas diferentes según quién la observe.

No existe una reacción universal obligatoria para todo el roster.

---

## 3. Support Character Framework

Principio:

`TEAM = PLAYERS + SPECIAL SUPPORT`

Un personaje de soporte no necesita ocupar una posición de bateadora.

Tipos posibles:

- Valkyria;
- ex-Valkyria;
- agente;
- entrenadora;
- especialista médica;
- especialista técnica;
- estratega;
- otro rol narrativamente compatible.

### 3.1 Support identity

Todo soporte recurrente debería tener:

- identidad;
- personalidad;
- función;
- relaciones;
- escenas;
- potencial de colección;
- potencial de variantes;
- fanservice contextual cuando corresponda.

No todos los equipos deben tener el mismo tipo de soporte.

El soporte amplía el mundo y las posibilidades del equipo. No sustituye la fantasía de dirigir a las jugadoras.

---

## 4. Azusa

### Estado

**DESIGN PROPOSAL**, apoyado en la función narrativa provisional establecida en T014-T015.

Azusa puede funcionar como ejemplo de soporte recurrente:

- figura de autoridad;
- personalidad estricta;
- experiencia superior;
- capacidad potencial de proteger al protagonista;
- desconfianza inicial de sus capacidades físicas;
- presencia más allá de su primera aparición;
- posible relevancia de colección;
- posibles variantes;
- relación progresiva con el protagonista.

Estas posibilidades no agregan canon adicional.

### 4.1 Long-term support role

Azusa puede mantenerse relevante mediante:

`INTRODUCTION → AUTHORITY → OBSERVATION → TRUST → RECURRING SUPPORT`

La relación no debe resolverse inmediatamente.

El romance permanece **PENDING** y no debe inferirse de confianza, protección o cercanía.

### 4.2 Reaction examples

Los siguientes son ejemplos de diseño, no diálogos canónicos:

- reacción a una pausa excesiva;
- corrección de una decisión;
- observación del entrenamiento;
- comentario sobre una selección repetida;
- interrupción humorística cuando el protagonista intenta avanzar demasiado rápido.

---

## 5. Student Fanservice Framework

### 5.1 Boundaries

`CHARACTER APPEAL ≠ FANSERVICE`

`FANSERVICE ≠ SEXUALIZATION`

`SEXUALIZATION ≠ EXPLICIT CONTENT`

El fanservice es opcional y secundario.

Para personajes estudiantes, la dirección propuesta es **ero-kawaii contextual y platform-safe**, siempre subordinada a personalidad, identidad y relaciones.

Posibles contextos:

- verano;
- playa;
- pijamas;
- festivales;
- outfits casuales;
- expresiones;
- poses;
- accesorios;
- situaciones cómicas;
- variantes temáticas;
- vergüenza;
- romance ligero.

Esto no constituye una orden de crear contenido sexual.

Los personajes adultos, Valkyrias, ex-Valkyrias y agentes pueden tener sus propios recursos de atractivo contextual.

### 5.2 Rule

Primero:

`PERSONALITY + IDENTITY + RELATIONSHIPS`

Después:

`COSMETIC / OPTIONAL FANSERVICE`

El fanservice nunca debe utilizarse para reparar una identidad débil.

No se hacen afirmaciones sobre ventas, popularidad, retención o preferencias del mercado.

---

## 6. Character Memory

La sensación de memoria debe separar tres capas.

### 6.1 Narrative memory

Hechos que realmente forman parte del canon de la historia.

Ejemplo conceptual:

Una personaje recuerda una conversación que ocurrió en una escena anterior.

Estado: **CANON CONFIRMED** únicamente cuando el hecho haya sido establecido en la historia.

### 6.2 System memory

Datos persistentes o temporales que el juego podría almacenar:

- última utilización;
- número de usos;
- última actividad;
- eventos vistos;
- escenas completadas;
- decisiones registradas;
- relación sistémica;
- flags de reacción.

Estado: **SISTEMA PROPUESTO**.

### 6.3 Apparent memory

Una reacción preescrita que da sensación de recuerdo sin almacenar una historia completa.

Ejemplo:

`IF use_count ≥ threshold → select contextual line`

La frase puede referirse a la experiencia repetida sin que exista una IA que recuerde conversaciones arbitrarias.

---

## 7. Player Behavior → Character Perception

Modelo central:

`PLAYER BEHAVIOR`
↓
`BEHAVIOR DETECTION`
↓
`CHARACTER INTERPRETATION`
↓
`DIEGETIC REACTION`

El sistema detecta una señal objetiva.

El personaje no describe el sistema. Interpreta la señal dentro del mundo.

Ejemplo de diseño:

`inactivity_time > threshold`

No producir:

> "Jugador inactivo durante 180 segundos."

Puede producir:

> "¿Entrenador?"

o una interpretación específica de personalidad.

Los textos anteriores son ejemplos, no canon.

### 7.1 Character filter

`SIGNAL → PERSONALITY FILTER → ELIGIBLE REACTION`

Esto evita que todos los personajes reaccionen igual.

Un personaje serio puede cuestionar la demora.

Uno tímido puede asumir que el protagonista está pensando.

Uno bromista puede convertirla en chiste.

Uno preocupado puede preguntar si está bien.

---

## 8. Detectable Behaviors

Las siguientes señales son candidatos de diseño futuro:

| Señal | Estado | Interpretación posible |
|---|---|---|
| Inactividad prolongada | CANDIDATO | distraído / pensativo |
| Diálogo extremadamente rápido | CANDIDATO | impaciente |
| Múltiples clics | CANDIDATO | apresurado |
| Skip de diálogo | ÚTIL | quiere avanzar |
| Skip de cinemática | ÚTIL | impaciente / ya la conoce |
| Repetir escena | POTENCIAL | perseverancia / interés |
| Repetir misión | POTENCIAL | práctica / insistencia |
| Cambiar constantemente de personaje | POTENCIAL | experimental / indeciso |
| Usar repetidamente una personaje | ÚTIL | preferencia / confianza |
| Permanecer mucho en menú | CANDIDATO | preparación / indecisión |
| Regresar repetidamente a una zona | POTENCIAL | curiosidad / búsqueda |
| Fallar repetidamente | ÚTIL | frustración / perseverancia |
| Completar muy rápido | POTENCIAL | eficiencia / prisa |
| Explorar mucho | ÚTIL | curiosidad |
| Ignorar contenido opcional | POTENCIAL | enfoque / prisa |
| Volver después de una ausencia | CANDIDATO | reencuentro |

Ninguna señal queda implementada por esta tarea.

---

## 9. Diegetic Reactions

Las reacciones deben pertenecer al mundo.

### Prohibido como dirección narrativa

- "Has estado inactivo."
- "Has pulsado Skip."
- "Has saltado la cinemática."
- "El sistema detectó que cambias mucho de personaje."

### Permitido como dirección narrativa

- "¿Entrenador?"
- "¿Deja de soñar despierto?"
- "¿Va a quedarse ahí mucho tiempo?"
- "T-tal vez está pensando..."
- "¿Se quedó congelado?"
- "¿Está bien?"

Los ejemplos no son canon.

### 9.1 Same signal, different personality

`INACTIVITY`

Puede producir:

- serio → preocupación práctica;
- tímido → interpretación benigna;
- bromista → comentario ligero;
- estricto → llamada de atención;
- competitivo → pregunta sobre el plan.

La reacción debe ser coherente con el personaje y con su relación actual.

---

## 10. Skip / Fast-Click Reactions

### 10.1 Principle

Skip y avance rápido pueden producir una reacción contextual opcional.

La reacción debe transformar:

`SKIP SIGNAL → IN-WORLD INTERPRETATION`

Nunca:

`SKIP SIGNAL → FOURTH-WALL EXPLANATION`

### 10.2 Azusa example

**DESIGN PROPOSAL**

Si el jugador avanza una escena de Azusa a una velocidad inusual, una reacción especial podría interrumpir brevemente:

> "¿Me estás prestando atención?"

La escena continúa.

Azusa no debe decir:

> "Sé que apretaste Skip."

ni:

> "Has saltado la cinemática."

### 10.3 Player freedom

Skip sigue siendo una herramienta legítima del jugador.

La reacción:

- no bloquea el avance;
- no castiga;
- no reduce estadísticas;
- no altera recompensas;
- no obliga a leer;
- no debe repetirse constantemente.

---

## 11. Emergent Player Personality

El sistema puede construir una percepción interna del protagonista.

| Señal | Etiqueta interna posible |
|---|---|
| Mucha inactividad | DISTRACTED / THOUGHTFUL |
| Muchos skips | IMPATIENT / FAST-PACED |
| Repetición constante | PERSISTENT / OBSESSIVE |
| Mucha exploración | CURIOUS |
| Uso constante de una personaje | PREFERENCE / TRUST |
| Cambio constante | EXPERIMENTAL / INDECISIVE |
| Fallos y reintentos | PERSISTENT |
| Preparación extensa | CAUTIOUS / METHODICAL |

Estas etiquetas:

- son internas;
- no son estadísticas RPG;
- no deben mostrarse obligatoriamente;
- no deben convertirse automáticamente en personalidad canon del protagonista.

### 11.1 Perception, not identity rewrite

El comportamiento del jugador puede modificar la **percepción** que un personaje tiene del protagonista.

No debe reescribir retrospectivamente su pasado ni su personalidad canónica.

---

## 12. No Generative AI

El sistema no necesita IA generativa.

Puede funcionar mediante:

- contadores;
- timers;
- timestamps;
- flags;
- patrones;
- thresholds;
- cooldowns;
- condiciones;
- tablas de reacción;
- prioridades;
- estados.

Ejemplo conceptual:

```
IF inactivity_time > threshold
    trigger_character_reaction()
```

```
IF skip_detected AND scene_has_awareness_reaction
    trigger_special_dialogue()
```

El contenido narrativo está escrito previamente.

El sistema únicamente decide si una reacción elegible puede aparecer.

---

## 13. Anti-Spam

Las reacciones deben proteger la experiencia de juego.

Mecanismos posibles:

- cooldown;
- una reacción por escena;
- reacción única por capítulo;
- flags de descubrimiento;
- límites de frecuencia;
- variantes de diálogo;
- prioridad de eventos;
- desactivación después de repetición excesiva;
- probabilidad controlada cuando no exista una razón narrativa para garantizarla.

### 13.1 Hard rule

El jugador que quiere avanzar rápidamente debe poder hacerlo.

Una reacción nunca debe convertir el Skip en una pelea con el propio juego.

---

## 14. Character Reaction Priority

Cuando varias señales producen eventos al mismo tiempo, la prioridad conceptual es:

`STORY CRITICAL`

>

`SPECIAL CHARACTER EVENT`

>

`PLAYER BEHAVIOR REACTION`

>

`AMBIENT DIALOGUE`

Una reacción de comportamiento no debe interrumpir un momento narrativo crítico.

La resolución debe ser determinista y reproducible.

---

## 15. Events and Banners

Eventos, banners y variantes pueden utilizar:

- personalidad;
- relaciones;
- memoria;
- situaciones;
- humor;
- evolución;
- fanservice contextual;
- presentación cosmética.

La variante debe ampliar la identidad, no reemplazarla.

`COSMETIC CHANGE → PRESENTATION CHANGE`

pero:

`COSMETIC CHANGE ≠ GAMEPLAY IDENTITY CHANGE`

Una variante de Azusa debe seguir siendo reconocible como Azusa.

Las variantes no crean automáticamente una nueva personalidad ni una nueva relación.

---

## 16. Community Identity

Objetivo de diseño:

Los jugadores deberían poder reconocer a una personaje por su identidad, no solamente por su color o rareza.

Ejemplo conceptual:

> "¿Azusa? ¿Cuál Azusa, la del uniforme o la del vestido de evento?"

Las variantes pueden ampliar la memoria visual y narrativa del personaje.

Este documento no afirma que esta estrategia produzca una determinada respuesta comercial.

---

## 17. System Data Model

**SISTEMA PROPUESTO**

Un futuro sistema podría separar:

```
PLAYER SIGNALS
    ↓
BEHAVIOR STATE
    ↓
CHARACTER PERCEPTION
    ↓
REACTION ELIGIBILITY
    ↓
DIALOGUE / PRESENTATION EVENT
```

### 17.1 Player signals

Datos objetivos:

- timestamps;
- contadores;
- eventos de navegación;
- acciones de gameplay;
- selección de personajes;
- escenas;
- skips;
- reintentos.

### 17.2 Behavior state

No necesita almacenar cada acción.

Puede conservar únicamente señales agregadas:

- inactivity_band;
- skip_frequency_band;
- repeat_band;
- exploration_band;
- character_preference_band;
- retry_band.

Las bandas son una propuesta para limitar almacenamiento y evitar una falsa necesidad de memoria total.

### 17.3 Character perception

La percepción puede ser:

`CHARACTER × BEHAVIOR BAND × CONTEXT`

Esto permite que dos personajes interpreten la misma conducta de manera distinta.

### 17.4 Reaction eligibility

Cada reacción futura debería declarar conceptualmente:

- trigger;
- character;
- context;
- required flags;
- cooldown;
- priority;
- variant pool;
- once-only flag;
- relationship requirement;
- canon status.

No se crea todavía ningún formato runtime.

---

## 18. Context Windows

Una reacción debe tener contexto suficiente.

Variables conceptuales:

- escena actual;
- arco;
- relación;
- personaje presente;
- último evento;
- frecuencia reciente;
- si ya se mostró la reacción;
- intensidad del comportamiento;
- disponibilidad de una interrupción segura.

La reacción no debe aparecer simplemente porque un contador cruzó un umbral.

---

## 19. Relationship-Aware Reactions

La misma señal puede cambiar con la relación.

Ejemplo conceptual:

`INACTIVITY + LOW TRUST`

→ interpretación más distante.

`INACTIVITY + HIGH TRUST`

→ interpretación más personal o preocupada.

Esto no crea romance.

El romance continúa siendo una dimensión separada y opcional.

---

## 20. Memory Safety

La memoria sistémica debe evitar dos errores:

### Error A: falsa omnisciencia

El personaje parece recordar cada acción de meses atrás.

### Error B: contradicción

El personaje afirma recordar algo que nunca fue registrado.

Regla:

> Si el sistema no tiene una señal o flag válida, la reacción no puede afirmar que el personaje recuerda el hecho.

La memoria aparente debe estar respaldada por una condición verificable.

---

## 21. Fanservice Safety

El sistema de reacciones no debe utilizar comportamiento del jugador como excusa para sexualizar automáticamente a un personaje.

Ejemplos de comportamiento:

- usar mucho una personaje;
- permanecer inactivo;
- repetir escenas;
- saltar diálogos.

No deben generar automáticamente fanservice sexual.

El fanservice contextual solo puede aparecer si la escena o evento ya lo contempla y es coherente con el personaje.

---

## 22. Implementation Boundaries

Esta tarea es documental.

No implementar:

- combate;
- gacha;
- economía;
- estadísticas;
- IDs;
- rarezas;
- personajes nuevos;
- gameplay;
- IA generativa;
- runtime;
- UI;
- banners reales;
- Telegram;
- save system;
- animaciones;
- assets.

Tampoco se modifica canon confirmado.

La futura implementación debe comenzar con un sistema pequeño de señales y tablas de reacción, no con una arquitectura de IA.

---

## 23. Open Questions

Quedan pendientes:

1. ¿Qué comportamientos se implementarán realmente?
2. ¿Qué personajes tendrán reacciones?
3. ¿Qué frecuencia será apropiada?
4. ¿Qué reacciones serán únicas?
5. ¿Cuánto durará cada reacción?
6. ¿Qué datos se guardarán?
7. ¿Qué comportamientos serán puramente locales?
8. ¿Cuáles podrán influir en relaciones?
9. ¿Cuáles serán únicamente easter eggs?
10. ¿Cómo se integrarán con escenas?
11. ¿Cómo evitar repetición?
12. ¿Qué personajes tendrán memoria explícita?
13. ¿Qué comportamientos pueden influir en la percepción del protagonista?
14. ¿Qué límites tendrá el sistema?
15. ¿Qué personajes de soporte, además de Azusa, necesitarán este tratamiento?
16. ¿Qué reacciones estarán disponibles durante Arc 0 y Arc 1?
17. ¿Qué señales deben permanecer exclusivamente de presentación?

Todas quedan **PENDIENTES**.

---

## 24. Canon / Proposal / Theory / Unknown / Pending

### CANON CONFIRMED

- El roster canónico existente y sus identidades base.
- La separación entre identidad de personaje, gameplay, colección y fanservice establecida por T010-B/T011.
- El protagonista y su función narrativa establecida en T014-T015.
- Azusa como figura narrativa provisional dentro de Arc 0/Arc 1.
- La continuidad del mundo y de los personajes existentes.

### SISTEMA PROPUESTO

- Character Living System.
- Relationship dimensions.
- Support Character Framework.
- Character Memory.
- Player Behavior Detection.
- Character Perception.
- Diegetic Reactions.
- Skip/Fast-Click Reactions.
- Emergent Player Personality.
- Anti-Spam.
- Reaction Priority.
- System Data Model.

### EJEMPLO DE IMPLEMENTACIÓN

Los fragmentos de pseudocódigo y las frases de reacción son únicamente ejemplos de cómo podría expresarse el sistema.

### PENDING

- señales definitivas;
- thresholds;
- personajes participantes;
- persistencia;
- relación con save data;
- impacto sobre relaciones;
- integración con escenas;
- contenido concreto;
- frecuencia;
- Arc 0/Arc 1 coverage.

### NO DEFINIDO

- cualquier IA generativa;
- memoria total del protagonista;
- cambios automáticos de personalidad;
- consecuencias permanentes por Skip;
- penalizaciones por comportamiento.

---

## 25. Design Principles

1. El personaje interpreta al jugador; no habla sobre el código.
2. La personalidad filtra la reacción.
3. Una señal no equivale a una emoción universal.
4. La memoria debe ser limitada y verificable.
5. Skip nunca debe convertirse en castigo.
6. Las reacciones deben ser opcionales y no intrusivas.
7. Las relaciones no implican romance automáticamente.
8. Fanservice no sustituye caracterización.
9. No se necesita IA generativa.
10. El sistema debe ser determinista y preescrito.
11. La identidad canónica no debe ser reescrita por comportamiento emergente.
12. Los eventos narrativos críticos tienen prioridad.
13. El sistema debe poder desactivarse o reducirse sin romper la historia.
14. Los personajes existentes conservan sus identidades de T011-T013.
15. Toda implementación futura debe comenzar con el mínimo conjunto de señales necesario para demostrar el concepto.

---

## 26. Next Implementation Boundary

La futura tarea técnica debería:

1. identificar las señales de comportamiento realmente disponibles en el runtime existente;
2. seleccionar un conjunto pequeño de señales iniciales;
3. crear un modelo determinista de estado;
4. definir tablas de reacción preescritas;
5. añadir cooldowns y prioridades;
6. conectar únicamente presentación/narrativa con esas señales;
7. validar que gameplay no dependa de la capa de reacción;
8. comprobar que Skip y comportamiento no generan penalizaciones;
9. probar repetición, persistencia y ausencia de datos;
10. mantener la posibilidad de desactivar el sistema.

La implementación no debe comenzar creando un “AI Character Manager”. El núcleo correcto es un **Reaction Rule System** determinista.

---

## 27. Scope

Este documento no modifica:

- roster;
- personajes;
- canon;
- gameplay;
- combate;
- economía;
- gacha;
- UI;
- WebApp;
- Godot;
- Telegram;
- Agent Guard;
- assets.

La única modificación prevista por T016 es:

`docs/character-living-system.md`
