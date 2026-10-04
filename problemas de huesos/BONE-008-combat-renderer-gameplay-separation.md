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


## BONE-008-002 · COMBAT SESSION STATE TRANSITION OWNERSHIP

**Fecha:** 2026-10-04  
**BASE SHA:** `74b259557a001f7d0a9ac504d4a71ef0583afa65`  
**HEAD FINAL:** `5976dab4c02a55b3b89261091e02b3eb845610b9`  
**TIMER:** 60–90 minutos  
**RESULT:** PASS / CHECKPOINT CLOSED / BONE-008 OPEN

### Authority state

`webapp/js/combat_session_authority.js` ahora mantiene un snapshot interno de sesión y es responsable de:

- inicialización explícita mediante `startSession(snapshot)`;
- estado round/tacticalTurn/tacticalMaxTurns;
- boss HP/concentration;
- player stamina;
- energy/effectiveness;
- phase;
- terminal state.

Tactical y climax siguen reutilizando exclusivamente `webapp/js/combat_core.js`.

### Renderer ownership

`CombatRenderer` ya no asigna como fuente de verdad los campos:

- HP;
- stamina;
- energy;
- effectiveness;
- round;
- tactical turn;
- phase;
- victory/defeat.

El renderer consume el estado devuelto por `CombatSessionAuthority` mediante su snapshot y solo reacciona visualmente al resultado/phase.

No se creó EventBus ni se reescribió el renderer completo.

### Terminal authority

La terminalidad se determina en el authority:

`state.phase = VICTORY` o `DEFEAT`  
`state.terminal = VICTORY | DEFEAT | null`

El renderer utiliza `authoritative.terminal` únicamente como condición de presentación/callback, sin recalcular victory/defeat.

### Static / equivalence evidence

GitHub Actions Run **`37186817864`** = SUCCESS.

La suite ejecutó:

- `combat_session_authority_test.mjs` = PASS;
- equivalencia de 5 tactical turns = PASS;
- equivalencia GREAT/HIT/MISS = PASS;
- terminal VICTORY = PASS;
- terminal DEFEAT = PASS;
- `combat_lifecycle_test.mjs` = PASS;
- syntax validation = PASS.

### Browser evidence

El mismo Run **`37186817864`** ejecutó Chromium real con `bone008_authority_browser_test.mjs`:

**PASS_REAL**

Se verificaron dos ciclos reales:

`create → tactical ×5 → CLIMAX → timing → result → dispose`

con valores tácticos observados:

`boss HP: 100 → 81 → 60 → 38 → 14 → 1`

y sin errores de consola/page:

`console_errors = []`

El browser proof confirmó además dispose idempotente y recursos lifecycle limpios:

- `disposed=true`;
- `frameHandle=0`;
- `ownedTimeouts=0`;
- `resizeObserver=false`.

### Workflow status

`Combat Vertical Slice Tests` Run **`37186817864`** = SUCCESS.

El workflow amplio `Baseball Waifus Telegram Mini App` Run **`37186817878`** quedó rojo por la regresión preexistente de BONE-002:

`GACHA_NOT_READY`, `GACHA_READY`, `PLAYER_META_STARTER`, `PLAYER_META_ACTIVE_BATTER`.

Ese fallo no fue modificado ni causado por este checkpoint y permanece fuera de scope.

### Scope

**GAMEPLAY CHANGED:** NO.  
**BALANCE CHANGED:** NO.  
**COMBAT CORE:** NO se modificó.  
**REWARDS/GACHA/PITY:** NO.  
**BONE-004:** BLOCKED / UNCHANGED.  
**BONE-005:** CLOSED.  
**BONE-006:** CLOSED.  
**BONE-007:** CLOSED.  
**BONE-011:** OPEN / UNCHANGED.

### Estado

**BONE-008-002 = CLOSED.**  
**BONE-008 = OPEN / PARTIAL PROGRESS.**



### BONE-008-002 browser validation update

**Validated code HEAD:** `49fda47c1a346ddbf40d3d6adedebd2f7a698247`  
**Browser workflow:** Run `37186981284` = SUCCESS.

El proof Chromium actualizado añadió una ruta terminal real:

- terminal phase = `VICTORY`;
- terminal authority = `VICTORY`;
- boss HP = `0`;
- console/page errors = `[]`.

Se mantienen además los dos ciclos anteriores de tactical ×5 → CLIMAX/timing → resultado → dispose/remount.

**BONE-008-002 remains CLOSED.**  
**BONE-008 remains OPEN / PARTIAL PROGRESS.**


## BONE-008-003-R4 · EXECUTED PLAYER META FIXTURE & REAL PRESENTATION PROOF

**Fecha:** 2026-10-04  
**HEAD BEFORE:** `6d83f31d1c95ca0c0c2a0ada0a8712ef66091b79`  
**HEAD AFTER:** `00eee7b04ef4a624f17d71f7a5781f28264b01b6`  
**TIMER:** 60–90 minutos  
**RESULT:** BLOCKED

### Fixture execution

Se corrigió en `webapp/js/character_journey_browser_probe.mjs` el script registrado mediante `Page.addScriptToEvaluateOnNewDocument` para que la función se ejecute inmediatamente mediante IIFE antes de `Page.navigate`.

Static validation posterior: **PASS_STATIC**.

Browser evidence antes del fallo:

- Player Meta persisted envelope leído después de navegación: schemaVersion=1, revision=1.
- identity = local-player / local.
- bw001 unlocked=true, quantity=1.
- roster.activeBatter=bw001.
- runtime activeBatter=bw001.
- runtime inventory de Gacha contiene bw001 con `duplicate_count=1`.

### Browser proof

Workflow: **T094 Deterministic Normal Combat CDP QA**, Run **37192007128**.

El único browser proof real de esta task ejecutó Chromium real con el WebApp servido por CI. El workflow alcanzó el navegador y el harness empezó a validar el runtime real.

El proof falló antes de Home/presentation/combat porque una assertion introducida por este checkpoint asumió incorrectamente que la estructura de `window.BaseballWaifusGacha.getState().inventory.bw001` tendría `quantity`.

La evidencia real devuelta por el runtime fue:

```
activeBatter: "bw001"
inventory.bw001 = {
  character_id: "bw001",
  display_name: "Aiko Hanamori",
  rarity: "R",
  obtained_at: ...,
  duplicate_count: 1,
  last_obtained_at: ...
}
```

Por tanto el runtime sí expuso ownership canónico mediante `duplicate_count=1`, pero la assertion del harness produjo:

`T072 ASSERTION FAILED: BONE-008 runtime bw001 ownership missing`

### Retry rule

**ATTEMPTS:** 1 browser proof real.

No se ejecuta segundo browser proof, conforme a la orden de trabajo.

### Not reached

Por el fallo anterior quedaron **NOT_RUN**:

- HOME AIKO
- REAL DIRECTOR
- NORMAL SEQUENCE
- SAFE REPLACEMENT
- ACTION_TO_FOCUS
- FOCUS_TO_RETURN
- INVALID TRANSITIONS
- FINAL ACTOR STATE
- DIRECTOR ACTIVE
- COMBAT INTEGRATION
- LIFECYCLE

### Scope

**GAMEPLAY CHANGED:** NO.  
**BALANCE CHANGED:** NO.  
**COMBAT CORE:** no modificado.  
**PLAYER META runtime:** no modificado.  
**HOME:** no modificado.  
**PRESENTATION:** no modificado.  
**BONE-004:** BLOCKED / UNCHANGED.  
**BONE-005:** CLOSED.  
**BONE-006:** CLOSED.  
**BONE-007:** CLOSED.  
**BONE-011:** OPEN / UNCHANGED.

### Final state

**BONE-008-003-R4 = BLOCKED.**  
**BONE-008-003 = BLOCKED.**  
**BONE-008 = OPEN / PARTIAL PROGRESS.**

**CAUSE:** assertion del harness incompatible con la forma real de ownership del Gacha runtime (`duplicate_count` en lugar de `quantity`).

**NEEDS:** corregir la assertion del harness y ejecutar un nuevo checkpoint/browser proof según una futura orden del Cerebro. No se realiza ese retry dentro de R4.
