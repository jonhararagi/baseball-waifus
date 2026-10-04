# BONE-007 - LIFECYCLE / MEMORY LEAKS

PRIORIDAD: P1
ESTADO: CLOSED

CombatRenderer crea RAF y listeners globales. Dispose existe, pero el ciclo completo de SPA debe demostrar que no deja RAF, ResizeObserver, timers ni listeners huérfanos.

Objetivo: CREATE -> MOUNT -> ACTIVE -> PAUSE/HIDE -> DISPOSE.

Target: Web y especialmente WebView/TMA movil.

Cierre: un RAF, listeners no duplicados, timers cancelados, renderer pausado cuando corresponde y estabilidad tras navegaciones repetidas.

## BONE-007-001 · COMBAT RENDERER LIFECYCLE & MEMORY LEAK VALIDATION

**Fecha:** 2026-10-04  
**HEAD BEFORE:** `3e157806e97b4e2b4b48ea803ad4f3ef38658ef2`  
**HEAD AFTER:** `32150d7cda635881e9c29c12b39a6cbf6e3c1fec`  
**TIMER:** 60–90 minutos  
**RESULT:** PASS / BONE-007 CLOSED

### Lifecycle contract

El renderer ahora cumple:

CREATE → MOUNT → ACTIVE → PAUSE/HIDE → DISPOSE

La vista SPA pausa/reanuda `CombatRenderer` al cambiar de vista. El renderer también reacciona a `document.visibilitychange`.

### Recursos auditados

- RAF: un frame activo por renderer; `pause()` cancela el handle; `dispose()` lo cancela y `frame()` no vuelve a programarlo cuando está pausado/disposed.
- ResizeObserver: creado una vez y desconectado durante dispose.
- `window.resize`: handler guardado y eliminado.
- `visualViewport.resize`: handler guardado y eliminado.
- `visualViewport.scroll`: handler guardado y eliminado.
- `canvas.pointerdown`: handler guardado y eliminado; no responde después de dispose.
- `document.visibilitychange`: handler guardado y eliminado.
- Timers: el renderer usa un registro de timeouts propios; `dispose()` limpia todo el registro. `timingTimeout` y `phaseTransitionTimeout` se cancelan explícitamente.
- Observers/callbacks: `dispose()` es idempotente y `getLifecycleDebugSnapshot()` permite verificar que no quedan recursos propios.

### Patch mínimo

No se modificó `webapp/js/combat_core.js`.

Se añadieron únicamente controles de lifecycle/QA a `webapp/js/combat.js` y el wiring de pausa/reanudación en `webapp/js/app.js`.

No se modificaron:

- damage;
- HP;
- hit/miss;
- victory/defeat;
- rewards;
- economy;
- Gacha;
- balance.

### Static evidence

**PASS_STATIC**

El nuevo `webapp/js/combat_lifecycle_test.mjs` valida presencia de:

- cancelación de RAF;
- desconexión de ResizeObserver;
- removal de listeners;
- limpieza de timers;
- guards de pause/dispose;
- dispose idempotente;
- API de observabilidad.

Combat Vertical Slice Tests Run `37183172046` = SUCCESS sobre `bec80637b2a01f85134809e85e95b6dde7042995`. El `combat.js` y el test estático no cambiaron después de ese checkpoint; los cambios posteriores pertenecen al harness de browser/QA.

### Real browser evidence

**PASS_REAL**

GitHub Actions Run `37183441077`, job `lifecycle-browser` = SUCCESS sobre el HEAD final.

El harness utilizó Chromium real mediante Playwright, sirviendo la WebApp localmente y aislando una página dedicada de lifecycle.

Resultado:

- 5 ciclos completos;
- CREATE/MOUNT activo = PASS;
- PAUSE = PASS;
- RESUME = PASS;
- DISPOSE = PASS;
- segundo DISPOSE = PASS;
- frameHandle = 0 después de dispose;
- ownedTimeouts = 0 después de dispose;
- ResizeObserver = desconectado;
- listeners antes/después = sin delta;
- RAF antes/después = sin delta;
- console/page errors = `[]`.

El harness registró 4 recursos 404 ajenos al contrato de lifecycle:
`assets/stadiums/cyber_city_bg.png`,
`assets/stadiums/cyber_dirt.png`,
`assets/characters/pitcher_android.png`,
`assets/characters/catcher_cyber.png`.
Estos no generaron `pageerror` ni errores JavaScript y no afectaron la prueba de lifecycle.

### Browser/public deployment note

El deploy público de Pages no pudo utilizarse como fuente de evidencia para BONE-007 porque el workflow amplio de Mini App Run `37183441145` quedó bloqueado por una falla preexistente de BONE-002:

`GACHA_NOT_READY`, `GACHA_READY`, `PLAYER_META_STARTER`, `PLAYER_META_ACTIVE_BATTER`.

Por ello la evidencia real de BONE-007 procede del Chromium CI aislado y reproducible, no de una falsa afirmación sobre un deploy público.

### Scope / regressions

**GAMEPLAY:** NO.  
**BALANCE:** NO.  
**COMBAT CORE:** sin cambios.  
**BONE-004:** BLOCKED / UNCHANGED.  
**BONE-005:** CLOSED.  
**BONE-006:** CLOSED.  
**BONE-011:** OPEN / unchanged.

### Final state

**BONE-007 = CLOSED.**
