# BONE-003 - ATTACKER ID VS SELECTED ACTOR

PRIORIDAD: P0
ESTADO: CLOSED

## HEAD inicial

`9987f9ffbb06bcbbc1068d48d777cf09eb3ed99b`

## Causa confirmada

`CombatPresentationDirector` ya resolvía el atacante desde `result.attackerId`, incluyendo los comandos y el foco de cámara, mientras `CombatRenderer._drawCombatStageActor()` utilizaba `combatStage.selectedActorId` como condición primaria del protagonista visual.

Eso permitía la divergencia:

```
selectedActorId = PLAYER-01
attackerId      = PLAYER-03
```

La presentación podía enfocar PLAYER-03 mientras el branch principal de render trataba PLAYER-01 como héroe visual.

## Solución

Se agregó en `webapp/js/combat.js`:

`resolvePresentationAttackerId(result, fallback, selectedActorId)`

precedencia canónica:

1. `result.attackerId`
2. `result.attacker_id`
3. fallback explícito
4. `selectedActorId` como último fallback

Durante una secuencia activa, `_drawCombatStageActor()` usa el atacante resuelto como condición primaria:

```
actor.actorId === attackerId
```

Fuera de una secuencia activa, `selectedActorId` sigue funcionando como fallback visual.

No se reconstruyó CombatStage, CombatPresentationDirector ni el actor system.

## Archivos BONE-003

- `webapp/js/combat.js`
- `webapp/js/bone003_attacker_actor_resolution_test.mjs`
- `webapp/js/bone003_browser_probe.mjs`
- `.github/workflows/deploy-pages.yml`

No se modificaron sistemas de gameplay, economía, rewards, gacha, Player Meta, shop, Telegram, Godot o Timing Ring.

## Test de contrato

`webapp/js/bone003_attacker_actor_resolution_test.mjs`

Resultado CI:

- `BONE-003 ATTACKER ACTOR RESOLUTION TEST = PASS`
- `CASE_A = PASS // PLAYER-01 -> PLAYER-03`
- `CASE_B = PASS // PLAYER-03 -> PLAYER-03`
- `CASE_C = PASS // empty attacker -> PLAYER-01 fallback`
- `SOURCE = PASS`
- `DIRECTOR_RESULT_ATTACKER = PLAYER-03`
- `CAMERA_FOCUS = PLAYER-03`
- `GAMEPLAY_RESULT_UNCHANGED = PASS`

También se ejecutó el test existente:

`webapp/js/combat_stage_test.mjs`

y pasó junto con la suite existente de `combat_presentation_director_test.mjs`.

## Browser Chromium

Probe:

`webapp/js/bone003_browser_probe.mjs`

Runner Chromium real:

`/usr/bin/google-chrome`

Resultado final:

```
BONE-003 BROWSER PROBE = PASS
SELECTED_ACTOR = PLAYER-01
RESULT_ATTACKER = PLAYER-03
FOCUS_ACTOR = PLAYER-03
ACTION_ACTOR = PLAYER-03
CAMERA_ACTOR = PLAYER-03
PROJECTILE_SOURCE = PLAYER-03
RETURN_ACTOR = PLAYER-03
FORMATION_RESTORED = PASS
GAMEPLAY_RESULT_UNCHANGED = PASS
```

La prueba usa cuatro actores PLAYER y un ENEMY controlados, con PLAYER-01 seleccionado y PLAYER-03 como atacante real.

La secuencia validada fue:

```
ATTACKER_FOCUS
-> ACTION
-> COMBAT_RETURN
-> COMPLETE
```

PLAYER-03 transitó:

```
FOCUS -> ACTION -> RETURN -> IDLE
```

PLAYER-01 permaneció `IDLE` y no sustituyó al atacante.

## Incidente del primer Browser Probe

La primera ejecución del probe BONE-003 falló por un defecto del harness:

`TypeError: ctx.translate is not a function`

La causa fue un `fakeCtx` incompleto. Se corrigió únicamente `bone003_browser_probe.mjs` agregando las primitivas Canvas requeridas.

La siguiente ejecución de CI pasó completamente. No se modificó el runtime de combate para corregir este incidente.

## CI final

Workflow:

`Baseball Waifus Telegram Mini App`

Run:

`37141038358`

URL:

https://github.com/jonhararagi/baseball-waifus/actions/runs/37141038358

Job:

`111255353946`

Head SHA validado:

`114a56cb79c72f89e7273b45087474e1179e62f3`

Resultado:

`success`

Gates relevantes:

- Validate JavaScript syntax: PASS
- Validate P0 runtime integration: PASS
- BONE-001 Native Chromium Validation: PASS
- BONE-002 Native Chromium Gacha Validation: PASS
- BONE-003 Native Chromium Attacker Actor Validation: PASS
- T073 Character Presentation Browser QA: PASS
- T072 Character Journey Regression Suites: PASS
- T074 Character Art Production Browser QA: PASS
- Configure GitHub Pages: PASS
- Upload Pages artifact: PASS
- Deploy to GitHub Pages: PASS

BONE-001 tuvo un fallo transitorio en el primer intento del run por `OLD_PRODUCT_CACHE_PRESENT`. Se reejecutó el job sin cambios sobre BONE-001 y el gate pasó. No se reabrió ni modificó BONE-001.

## Implementación confirmada

Comparación contra:

`9987f9ffbb06bcbbc1068d48d777cf09eb3ed99b`

Los únicos archivos funcionales BONE-003 son los cuatro enumerados arriba.

No se tocaron:

- combate resolver;
- rewards;
- economy;
- gacha;
- Player Meta;
- shop;
- Telegram;
- Godot;
- BONE-001;
- BONE-002.

Balance:

`UNCHANGED`

Gameplay result:

`UNCHANGED`

## Deploy

Deploy Pages:

`PASS`

URL:

https://jonhararagi.github.io/baseball-waifus/

## Estado final

`ESTADO: CLOSED`

BONE-004: no iniciado.

