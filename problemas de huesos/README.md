# PROBLEMAS DE HUESOS

Quality Gate estructural de BaseWarriors: Meta-Strike.

REGLA MAESTRA: NO AVANZAR CON NUEVAS FEATURES DE PRODUCTO MIENTRAS EXISTA UN HUESO CRITICO ABIERTO.

Prioridad: ESTABILIDAD > CONTINUIDAD > SEGURIDAD/ECONOMIA > PERSISTENCIA > CICLO DE VIDA > PRESENTACION > VELOCIDAD.

Estados: OPEN, IN_PROGRESS, BLOCKED, VERIFYING, CLOSED.

## Inventario

| ID | Problema | Prioridad | Estado |
|---|---|---:|---|
| BONE-001 | Service Worker, cache y versionado | P0 | CLOSED |
| BONE-002 | Datos runtime faltantes del Gacha WebApp | P0 | CLOSED |
| BONE-003 | attackerId vs selectedActorId | P0 | CLOSED |
| BONE-004 | Autoridad de recompensa offline/local | P0 | OPEN |
| BONE-005 | Persistencia dual Player Meta/local/Telegram | P0 | CLOSED |
| BONE-006 | Concurrencia roster/inventario/recompensa | P0 | CLOSED |
| BONE-007 | Lifecycle, RAF, timers y listeners | P1 | CLOSED |
| BONE-008 | Separacion CombatRenderer/gameplay/presentation | P1 | CLOSED |
| BONE-009 | Multiples runtimes de gameplay | P1 | CLOSED |
| BONE-010 | Duplicacion de bridges Telegram | P1 | OPEN |
| BONE-011 | Monetizacion y autoridad backend | P0 | OPEN |

## Gate

Mientras exista un P0/P1 en OPEN, IN_PROGRESS, BLOCKED o VERIFYING, el gate permanece CERRADO.

Solo se permiten durante este periodo tareas de diagnostico, reparacion, pruebas, observabilidad, documentacion de continuidad e infraestructura necesaria para cerrar un hueso.

Cada reparacion debe tener evidencia reproducible. Las tareas derivadas deben usar timer de 1 a 2 horas maximo salvo motivo tecnico documentado.

## Apertura

El gate solo se abre cuando todos los huesos relevantes esten CLOSED y exista un checkpoint final con HEAD, tests, runtime/browser evidence, persistencia y estado TMA/Web.

La estimacion de progreso del proyecto no puede abrir este gate.

## Objetivo arquitectonico

PLAYER DATA -> GAMEPLAY AUTHORITY -> COMBAT RESULT -> DOMAIN EVENTS -> REWARD AUTHORITY -> PERSISTENCE -> PRESENTATION -> PLATFORM ADAPTER.

Esta carpeta es una deuda controlada del producto, no una lista decorativa.

## Checkpoint parcial BONE-008

- **BONE-008:** OPEN.
- **BONE-008-001:** CLOSED.
- **Resultado:** primer seam real `CombatRenderer → CombatSessionAuthority → combat_core.js`, validado con static PASS_STATIC y Chromium PASS_REAL.


### Checkpoint parcial BONE-008-002

- **BONE-008:** OPEN.
- **BONE-008-001:** CLOSED.
- **BONE-008-002:** CLOSED.
- **Resultado:** `CombatSessionAuthority` ahora posee el session state y determina las transiciones tactical/climax/terminal; `CombatRenderer` consume el snapshot y no muta la fuente de verdad de gameplay.
- **Evidence:** Static/equivalence PASS y Chromium PASS_REAL en Combat Vertical Slice Tests Run `37186817864`.

- **BONE-008-002 browser update:** Chromium Run `37186981284` = SUCCESS; terminal VICTORY proof = PASS_REAL.


### Checkpoint parcial BONE-008-003

- **BONE-008:** OPEN.
- **BONE-008-001:** CLOSED.
- **BONE-008-002:** CLOSED.
- **BONE-008-003:** BLOCKED.
- **Resultado:** existe el contrato y adapter `CombatResult → COMBAT_RESULT Presentation Event → CombatPresentationDirector`, pero el browser proof con el director real encontró una incompatibilidad de estados visuales al reemplazar secuencias activas.
- **Static:** PASS_STATIC; negative presentation isolation PASS_STATIC; equivalence PASS.
- **Browser attempts:** Run `37189204507` y Run `37189292162` = FAIL_REAL por transiciones `ACTION → FOCUS` y `FOCUS → RETURN`, respectivamente.
- **CAUSE:** reemplazo de una secuencia de presentación activa no compatible con la máquina `IDLE → FOCUS → ACTION → RETURN → IDLE`.
- **RULE:** dos fallos por la misma causa; no se realizan retries adicionales en esta task.


### Checkpoint parcial BONE-008-006

- BONE-008: OPEN.
- BONE-008-006: CLOSED.
- Resultado: extracción real de la orquestación runtime de CombatRenderer hacia CombatRuntimeController.
- Arquitectura: CombatRenderer → CombatRuntimeController → CombatSessionAuthority → combat_core.js; presentation permanece separado.
- Static: PASS_STATIC.
- Combat Vertical Slice CI: Run 37259281591 = SUCCESS.
- Browser: PASS_REAL. Chromium alcanzó cinco tactical turns, CLIMAX, timing y terminal VICTORY.
- Console: console_errors=[].
- GAMEPLAY: NO CHANGE.
- BALANCE: NO CHANGE.


### Checkpoint parcial BONE-008-007

- **BONE-008:** OPEN.
- **BONE-008-007:** BLOCKED.
- **Resultado:** la orquestación runtime de timing fue extraída a `CombatRuntimeController`, pero el cierre queda bloqueado por el detector negativo estático del test.
- **Browser:** T094/T095 PASS_REAL.
- **Gameplay:** sin cambios.
- **Balance:** sin cambios.

### Checkpoint final BONE-008

- **BONE-008-001:** CLOSED.
- **BONE-008-002:** CLOSED.
- **BONE-008-003:** CLOSED.
- **BONE-008-004:** CLOSED.
- **BONE-008-005:** CLOSED.
- **BONE-008-006:** CLOSED.
- **BONE-008-007:** CLOSED.
- **BONE-008:** CLOSED.

**Arquitectura final:** `CombatRenderer → CombatRuntimeController → CombatSessionAuthority → combat_core.js`.

**Timing:** `CombatRenderer → CombatRuntimeController → CombatTimingAuthority`.

**CI:** Run `37290899872` = SUCCESS.

**Combat Vertical Slice:** Run `37290899887` = SUCCESS.

**Browser:** `PASS_REAL`, terminal `VICTORY`.

**GAMEPLAY:** NO CHANGE.

**BALANCE:** NO CHANGE.

**PRODUCTION:** NO CHANGE.

**Gate:** GLOBAL GATE remains CLOSED because BONE-004, BONE-009, BONE-010 and BONE-011 remain open.


## BONE-009 — Authority Map & Multi-Runtime Contract

BONE-009 is CLOSED at the current checkpoint. The current Web/TMA product has one Web gameplay authority chain. Godot remains a separate native/future runtime and is not a simultaneous Web production resolver. Kytos and Student 4v4 remain non-authoritative slices. See docs/architecture/bone-009-authority-map.md and webapp/js/bone009_multi_runtime_contract_test.mjs for the deterministic contract.

BONE-004 remains OPEN/BLOCKED and is not changed by BONE-009.
