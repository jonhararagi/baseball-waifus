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
| BONE-008 | Separacion CombatRenderer/gameplay/presentation | P1 | OPEN |
| BONE-009 | Multiples runtimes de gameplay | P1 | OPEN |
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