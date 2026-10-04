# BONE-008 - COMBAT RENDERER / GAMEPLAY SEPARATION

PRIORIDAD: P1
ESTADO: OPEN

Objetivo global:

PLAYER DATA → GAMEPLAY → COMBAT RESULT → DOMAIN EVENT → PRESENTATION → RENDER

La presentación no debe decidir damage, HP, hit/miss, result, victory, defeat, reward ni persistence.

## BONE-008-001 · COMBAT AUTHORITY SEAM EXTRACTION

**Fecha:** 2026-10-04  
**BASE SHA:** `48e0238eab6a9912d9f785056829f77f7d6fb513`  
**HEAD AFTER:** `a4cb1ff7d8d823a450d658d7c66a0a800a2eddea`  
**TIMER:** 60–90 minutos  
**RESULT:** PASS / CHECKPOINT CLOSED

### Authority seam

Se creó `webapp/js/combat_session_authority.js`.

Responsabilidad:

- recibir snapshot de gameplay;
- resolver tactical turn;
- resolver climax turn;
- reutilizar directamente `webapp/js/combat_core.js`;
- devolver el resultado normativo existente.

El authority no importa `combat.js`, `CombatPresentationDirector`, DOM, `window` ni Canvas.

No se duplicaron fórmulas ni números de combate.

### CombatRenderer ownership

`webapp/js/combat.js` dejó de importar directamente `resolveTacticalTurn` y `resolveClimaxTurn`.

Ahora utiliza:

`CombatRenderer → CombatSessionAuthority → combat_core.js`

El renderer continúa gestionando únicamente la aplicación del resultado a su estado/presentation existente durante este checkpoint.

La constante `COMBAT_STAMINA_ROUND_COST` sigue siendo la misma y fue reexportada por el seam para preservar compatibilidad sin alterar reglas.

### Static evidence

GitHub Actions **Run `37184933599`**:

- `combat_session_authority_test.mjs` = PASS_STATIC;
- tactical authority equivalence = PASS;
- climax authority equivalence = PASS;
- combat vertical slice suite = PASS;
- syntax validation = PASS.

### Browser evidence

El mismo Run **`37184933599`** ejecutó Chromium real sobre el WebApp servido localmente:

- BONE-008 authority browser proof = **PASS_REAL**;
- 2 ciclos completos de creación → resolución tactical ×5 → climax/timing → resultado → dispose/remount;
- console/page errors = **0**;
- dispose posterior: `disposed=true`, `frameHandle=0`, `ownedTimeouts=0`, `resizeObserver=false`.

El browser proof inyecta un director de presentation mínimo para aislar específicamente la autoridad de combate; la suite de combat/presentation existente permanece PASS por separado. Los 404 reportados pertenecen a assets opcionales del harness y no produjeron errores de consola/runtime ni alteraron el resultado de combate.

### Scope

**GAMEPLAY CHANGED:** NO.  
**BALANCE CHANGED:** NO.  
**GACHA:** NO.  
**REWARDS:** NO.  
**TIMING WINDOWS:** NO.  
**COMBAT CORE:** no se modificó.  
**BONE-004:** BLOCKED / UNCHANGED.  
**BONE-005:** CLOSED.  
**BONE-006:** CLOSED.  
**BONE-007:** CLOSED.  
**BONE-011:** OPEN / UNCHANGED.

### Estado del hueso

**BONE-008 = OPEN.**

**BONE-008-001 = CLOSED.**

Quedan fuera de este checkpoint otras superficies todavía mezcladas en `CombatRenderer` y la extracción completa de toda la autoridad/presentation boundary. Este checkpoint establece el primer seam real sin reescribir el renderer.

**NEXT CHECKPOINT:** queda para planificación posterior del Cerebro; el Obrero no emite una nueva tarea.
