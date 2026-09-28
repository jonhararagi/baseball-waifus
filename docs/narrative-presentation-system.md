# BaseWarriors: Meta-Strike
# Narrative Presentation & Dialogue Contract

> TAREA 018  
> Estado: **DOCUMENTATION ONLY**  
> Alcance: auditoría de infraestructura narrativa y contrato técnico mínimo.  
> Runtime narrativo: **VERTICAL SLICE MÍNIMO IMPLEMENTADO**.  
> Autoridad de comportamiento de personajes: `docs/character-living-system.md`.  
> Autoridad de identidad de roster: `game/characters/character_archetypes.json`.

## 1. Audit

### Dialogue — PARTIAL
Existe `webapp/js/voice_system.js`, con líneas preescritas y resolución por evento/personaje. También existe feedback textual en Locker Room. No existe DialogueManager, cola de líneas, cursor narrativo, historial, branching ni runtime de diálogo.

### Scene — PARTIAL
`webapp/js/main_menu.js` gestiona vistas de aplicación (`combat`, `roster`, `gacha`, `dex`, `locker`, `leaderboard`, `settings`). No existe SceneManager narrativo. La navegación de aplicación no debe confundirse con escenas narrativas.

### Cutscene — NOT_FOUND
No se encontró pipeline de cutscenes/cinematics narrativas.

### Skip — FOUND
T017 define `REACTION_SIGNAL.SKIP` y el vertical slice narrativo ahora posee `NarrativeRuntime.skip()` como productor real. `LockerRoom` mantiene su consumo independiente.

### Advance — FOUND
`webapp/js/narrative_runtime.js` implementa `advance()` con cursor de diálogo y emisión de `DIALOGUE_ADVANCED`/completion.

### Character Presentation — PARTIAL
Existe presentación en Locker Room, Gallery/CardRenderer, CombatRenderer y RosterPanel. No existe una capa narrativa que controle personaje, expresión, portrait, entrada/salida o animación mediante datos de escena.

### Voice — FOUND
`webapp/js/voice_system.js` es reutilizable. Usa líneas preescritas, audio cuando está disponible y fallback mediante `speechSynthesis`. No genera texto dinámicamente.

### Event System — PARTIAL
Existen callbacks y eventos locales en MainMenu, LockerRoom, VoiceSystem y otros subsistemas, además de señales explícitas consumidas por ReactionRuleSystem. No existe EventBus/dispatcher narrativo global. No se recomienda crear uno solo para T018.

## 2. Current State

La arquitectura relevante es:

```
APP
 ├─ MainMenu → application view navigation
 ├─ RosterPanel / TeamManager → character selection
 ├─ LockerRoom
 │    ├─ Canvas presentation
 │    ├─ messageLabel
 │    ├─ update(delta)
 │    └─ ReactionRuleSystem
 ├─ VoiceSystem → prewritten voice/text presentation
 └─ SaveSystem → persistence
```

Existe suficiente infraestructura de presentación para reutilizarla y ahora existe un runtime narrativo mínimo aislado, limitado al vertical slice de T019.

## 3. T017 Audit

**ReactionRuleSystem: PASS.** Permanece especializado en señales, elegibilidad, prioridad, cooldown y `once`. No administra escenas, diálogo, combate, economía ni persistencia.

**INACTIVITY: PASS conceptual.** Está acoplada únicamente al ciclo existente del Locker Room mediante `update(delta)`.

**SKIP: PASS.** Existe como contrato preparado, sin productor falso.

**Duplicación: PASS.** No se creó un segundo VoiceSystem ni DialogueManager.

**Dependencias: PASS.** La dirección futura correcta es `Narrative → signal → ReactionRuleSystem → Voice/Presentation`.

## 4. Scene Contract

| Componente | Estado | Propósito |
|---|---|---|
| `id` | REQUIRED | Identificar escena |
| `participants` | REQUIRED | Participantes |
| `dialogue` | REQUIRED | Contenido narrativo |
| `presentation` | OPTIONAL | Control visual |
| `conditions` | OPTIONAL | Elegibilidad |
| `events` | OPTIONAL | Señales narrativas |
| `choices` | FUTURE | Branching posterior |
| `completion` | OPTIONAL | Política de finalización |

Contrato conceptual:

```
Scene
├── id
├── participants
├── dialogue
├── presentation?
├── conditions?
├── events?
├── choices? [future]
└── completion?
```

No todos los campos requieren implementación inicial.

## 5. Dialogue Contract

La unidad mínima debe ser una línea/beat:

```
DialogueLine
├── speaker        REQUIRED
├── text           REQUIRED
├── voice          OPTIONAL
├── presentation   OPTIONAL
├── duration       OPTIONAL
├── events         OPTIONAL
└── conditions     OPTIONAL
```

`speaker` usa un ID estable. `text` es preescrito y nunca generado por IA en runtime. `voice` reutiliza VoiceSystem. `presentation` es declarativa y no controla gameplay. `duration` solo es necesaria para auto-avance/timing. `events` emite señales narrativas. `conditions` determina elegibilidad sin absorber lógica de combate/economía.

## 6. Advance / Skip / Auto Advance

### ADVANCE
Avanza una unidad narrativa, cierra la presentación actual y muestra la siguiente. Puede emitir `DIALOGUE_ADVANCED`.

### SKIP
Solicita omitir contenido permitido por la escena. Debe respetar su política, cerrar/completar el contenido omitido, emitir `SKIP` y permitir que ReactionRuleSystem evalúe una reacción opcional. Nunca debe penalizar ni bloquear permanentemente.

### AUTO ADVANCE
Avanza automáticamente después de una condición temporal. Es opcional y no necesario para el primer runtime.

```
ADVANCE ≠ SKIP ≠ AUTO_ADVANCE
```

Son modos de transición del mismo estado narrativo, no tres sistemas independientes.

## 7. Character Presentation Contract

Una escena futura puede declarar:

```
character
visible
position
expression
portrait
animation
voice
effects
```

Estado inicial:
- personaje visible: REQUIRED para escenas con personajes;
- posición: OPTIONAL;
- expresión: OPTIONAL;
- portrait: OPTIONAL;
- animación: OPTIONAL;
- entrada/salida: FUTURE;
- voz: OPTIONAL;
- efectos: FUTURE.

Presentation solo ejecuta instrucciones narrativas. Nunca decide daño, HP, estadísticas, gacha, economía, recompensas o resultados de combate.

## 8. Event Contract

No se recomienda crear todavía un EventBus global.

| Evento | Estado | Uso |
|---|---|---|
| `SCENE_STARTED` | REQUIRED futuro | inicio |
| `DIALOGUE_STARTED` | REQUIRED futuro | inicio de unidad |
| `DIALOGUE_ADVANCED` | REQUIRED futuro | avance |
| `DIALOGUE_COMPLETED` | REQUIRED futuro | final de unidad |
| `SKIP` | REQUIRED para T017 | comportamiento Skip |
| `SCENE_COMPLETED` | REQUIRED futuro | cierre |
| `CHARACTER_ENTERED` | FUTURE | presentación |
| `CHARACTER_EXITED` | FUTURE | presentación |

La primera implementación puede usar callbacks locales o un dispatcher pequeño si el runtime lo necesita.

## 9. ReactionRule Integration

La frontera queda:

```
Narrative System
      │ signal
      ▼
ReactionRuleSystem
      │ eligible reaction
      ▼
Character / Voice / Presentation
```

Narrative conoce la progresión. ReactionRuleSystem evalúa señales. VoiceSystem presenta líneas/voz. Ninguno absorbe responsabilidades ajenas.

Flujo futuro:

```
user presses Skip
        ↓
NarrativeRuntime.skip()
        ↓
emit("SKIP", context)
        ↓
ReactionRuleSystem.trigger(...)
        ↓
eligible reaction
        ↓
VoiceSystem / Presentation
```

Esto es contrato, no implementación de T018.

## 10. Data / Runtime / Presentation / Reaction

**DATA** describe qué ocurre: escenas, líneas, participantes, condiciones, eventos y presentación declarativa.

**RUNTIME** ejecuta el estado: escena actual, línea actual, transición, input y completion.

**PRESENTATION** muestra texto, personajes, expresión, portrait, animación, voz y efectos.

**REACTION** evalúa señales, contexto, prioridad, cooldown y once.

Regla:

```
DATA → RUNTIME → PRESENTATION
              ↓
           SIGNAL
              ↓
        REACTION
```

Presentation no produce resultados gameplay.

## 11. Data-Driven Boundary

No se necesita todavía JSON definitivo, editor ni lenguaje de scripting. Cuando exista runtime, debe ser posible añadir escenas sin un switch central gigantesco, pero sin crear una arquitectura excesiva.

Primer objetivo futuro razonable:
- una escena;
- pocas líneas;
- un participante;
- avance manual;
- Skip;
- eventos mínimos.

## 12. Save Boundary

T018 no modifica SaveSystem. Una futura narrativa podría persistir escenas vistas, flags o decisiones, pero solo cuando exista una necesidad concreta. No se debe guardar toda la ejecución de una escena.

## 13. Known Limitations

El vertical slice de T019 ya dispone de runtime de escena, estado de diálogo, ADVANCE, productor real de SKIP, eventos locales y presentación de prueba. Las limitaciones restantes son deliberadas: no existe SceneManager narrativo general, branching, replay, persistencia narrativa, editor, localization, cinematic pipeline ni EventBus global.

`MainMenu` no es SceneManager narrativo. `VoiceSystem` no controla progresión. `messageLabel` del Locker Room es feedback contextual, no textbox narrativo. La validación de navegador, audio real, móvil y Telegram permanece pendiente cuando no existe un entorno de ejecución adecuado.

## 14. Implementation Boundary

T019 implementa únicamente el runtime narrativo mínimo y su presentación de prueba. No crea DialogueManager general, SceneManager global, branching, editor, localization, lip sync, cinematic pipeline, nuevo VoiceSystem, EventBus global, save narrativo ni contenido narrativo grande.

El vertical slice está compuesto por `narrative_runtime.js`, `narrative_presentation.js` y sus tests. La demo de presentación se activa mediante `?narrative_test=1` y no forma parte de la navegación normal.

No se modifica canon.

## 15. Open Questions

1. ¿El primer runtime vivirá como vista propia o dentro de una vista existente?
2. ¿Texto por DOM, Canvas o híbrido?
3. ¿La voz será síncrona con el avance?
4. ¿Qué escenas necesitan Skip?
5. ¿Qué eventos requieren persistencia?
6. ¿Qué parte de presentation será declarativa?
7. ¿Qué condiciones serán globales o locales?
8. ¿Cuándo una reacción puede interrumpir una línea?
9. ¿Qué prioridad exacta tendrá frente a escenas críticas?
10. ¿Qué primer personaje/escena representa mejor un vertical slice?

Todas quedan PENDING.

## 16. Decision

**RESULTADO T019: MINIMAL SAFE FOUNDATION.**

El contrato de T018 fue ejecutado mediante un vertical slice pequeño: una escena técnica, cuatro líneas, `ADVANCE`, `SKIP`, eventos locales, integración con `ReactionRuleSystem` y presentación reutilizando `VoiceSystem`. No se implementó branching, editor, localization, cinematic pipeline ni un EventBus global.


## 17. T020 Validation Status

**RESULTADO T020: QA DEL VERTICAL SLICE COMPLETADO SIN CAMBIOS FUNCIONALES.**

### Runtime QA Results

La ejecución real disponible fue la GitHub Action de T019 sobre el workflow de Pages. El job alcanzó y ejecutó realmente:

- `reaction_rules_test.mjs` — PASS_REAL.
- `narrative_runtime_test.mjs` — PASS_REAL.
- `narrative_presentation_test.mjs` — PASS_REAL.
- Los checks de sintaxis de `narrative_runtime.js`, `narrative_presentation.js` y `app.js` fueron ejecutados sin fallo.
- La ejecución completa del workflow terminó FAIL en `webapp/js/contract_test.mjs` por una declaración duplicada existente de `combatJs`. T019 no modifica ese archivo ni `combat.js`; el fallo es ajeno al vertical slice narrativo.

Secuencia verificada por los tests reales:

```
SCENE_STARTED
→ DIALOGUE_ADVANCED
→ DIALOGUE_ADVANCED
→ DIALOGUE_COMPLETED
→ SCENE_COMPLETED
```

y para Skip:

```
SCENE_STARTED
→ SKIP
→ SCENE_COMPLETED
```

El runtime termina en `COMPLETED` o `SKIPPED` y no permite `advance()` después de finalizar.

### Reaction / Azusa

`SKIP` llega a `ReactionRuleSystem` con contexto `dialogue` y el personaje de prueba `azusa`. La reacción experimental `REACTION_SKIP` se resuelve como:

> “¿Me estás prestando atención?!”

La prueba de `once` evita una segunda reacción dentro de la misma instancia. No se añadieron datos a fuentes canónicas de personajes.

### Voice

La presentación reutiliza `VoiceSystem`; no existe un sistema de voz duplicado. La integración fue verificada mediante el test de presentación con un adaptador de voz de prueba. La reproducción de archivo de audio real y el fallback `speechSynthesis` en navegador no fueron ejecutados y quedan NOT_RUN.

### Presentation / Navigation

La integración mediante `?narrative_test=1` permanece aislada del flujo normal. La revisión estática confirma que el montaje ocurre únicamente cuando el parámetro está presente y que la vista de prueba se oculta por defecto.

La validación interactiva en navegador, incluyendo ADVANCE/SKIP visual, reacción visible y estados DOM, queda NOT_RUN por ausencia de un navegador automatizado disponible en el entorno de esta tarea.

### Locker Room / INACTIVITY

T019 no modificó `webapp/js/locker_room.js`. El compare de T018→T019 contiene cero cambios en Locker Room, por lo que la detección INACTIVITY conserva su aislamiento respecto de `NarrativeRuntime`. La ejecución interactiva del Locker Room queda NOT_RUN.

### Mobile / PWA / Telegram

No hubo navegador móvil, instalación PWA ni Telegram Mini App real disponibles para ejecución. Resultado: NOT_RUN.

La revisión estática confirma que:

- `sw.js` conserva su estrategia genérica cache-first y puede cachear los módulos narrativos al solicitarlos.
- `NarrativeRuntime` no depende de Telegram, CloudStorage, HapticFeedback, BackButton ni pagos.
- La nueva vista narrativa no altera la navegación normal cuando `narrative_test` no está presente.

### Boundary Audit

La frontera permanece:

```
DATA
 ↓
NARRATIVE RUNTIME
 ↓
LOCAL NARRATIVE EVENT
 ↓
REACTION RULE
 ↓
VOICE / PRESENTATION
```

No se encontró control de cursor narrativo desde VoiceSystem, control de escena desde ReactionRuleSystem, ni mutación de datos de personaje desde Presentation.

**QA T020: sin correcciones funcionales requeridas.**
