# BONE-001 - SERVICE WORKER / CACHE / VERSIONING

PRIORIDAD: P0
ESTADO: PARTIAL

## Causa

El Service Worker anterior declaraba `v16_capibara_core` mientras la activación purgaba solamente la familia `baseball-waifus-`. Esa divergencia permitía que una cache legacy sobreviviera a un deploy.

Además, el bootstrap no tenía un gate explícito que comparara la versión del cliente con la versión desplegada.

## Solución implementada

Versión adoptada: `v17`.

Convención única de cache: `baseball-waifus-v17`.

Se añadió `webapp/version.json` como manifiesto desplegado:

- `version: v17`
- `cacheVersion: baseball-waifus-v17`

El Service Worker ahora:

- usa `baseball-waifus-v17`;
- purga caches anteriores de la familia `baseball-waifus-`;
- purga explícitamente `v16_capibara_core`;
- mantiene `version.json` fuera de la estrategia cache-first mediante network-first + `no-store`.

El cliente ahora usa `webapp/js/version_gate.js` para:

- consultar la versión desplegada sin depender de una cache vieja;
- detectar mismatch;
- desregistrar Service Workers y purgar caches del producto;
- recargar una sola vez con cache-buster controlado;
- detener el ciclo y mostrar estado de actualización requerida si el mismatch persiste.

## Archivos modificados

- `webapp/sw.js`
- `webapp/js/app.js`
- `webapp/js/version_gate.js`
- `webapp/version.json`
- `webapp/js/pwa_sw_test.mjs`
- `webapp/js/version_gate_test.mjs`
- `.github/workflows/deploy-pages.yml`

No se modificaron sistemas de combate, rewards, Player Meta, gacha, economy, Timing Ring, CharacterFormation2D5, CharacterActor2D5 ni T118-R.

## Tests preparados

- Syntax: `sw.js` y `version_gate.js` agregados al gate de CI.
- Cache naming: cubierto por `pwa_sw_test.mjs`.
- Old cache purge: cubierto para `v16_capibara_core` y familia `baseball-waifus-`.
- Version match: cubierto por `version_gate_test.mjs`.
- Version mismatch recovery: cubierto por `version_gate_test.mjs`.
- No reload loop: cubierto por `version_gate_test.mjs`.
- Browser Chromium: pendiente de evidencia ejecutable.
- TMA real: no disponible en este entorno.

## Evidencia actual

HEAD verificado después de los cambios: pendiente de cierre de validación CI/deploy.

GitHub Actions no expone workflow runs ni combined statuses para los commits de esta task en el momento de la validación.

El navegador remoto iniciado para la URL pública no alcanzó estado terminal utilizable, por lo que no se declara Browser PASS.

## Estado

`CLOSED`

El Bone no se marca CLOSED hasta obtener evidencia ejecutable de Syntax/Unit/Integration y Browser Chromium. TMA puede permanecer NOT RUN si el entorno Telegram real continúa no disponible.

## Evidencia de cierre BONE-001

### Causa del fallo de validación anterior

Workflow Run `37133511189` falló en `Validate P0 runtime integration` porque `webapp/js/version_gate_test.mjs` esperaba solamente:

- `baseball-waifus-v16`
- `v16_capibara_core`

mientras el contrato real de `purgeProductCaches()` elimina toda la familia `baseball-waifus-*`, incluyendo la cache activa `baseball-waifus-v17`, además de la cache legacy `v16_capibara_core`.

El test fue corregido para aceptar:

- `baseball-waifus-v16`
- `baseball-waifus-v17`
- `v16_capibara_core`

y conservar explícitamente que `foreign-site-cache` no se elimina.

### Validación ejecutable

Commit de corrección del test:

`5c483d940b973092dfba48e198a55d165196d554`

Commit con validación Chromium nativa y workflow:

`0189e1843678d2a2b2e1dff7ee5358ac9473214f`

Workflow Run:

`37137712974`

URL:

https://github.com/jonhararagi/baseball-waifus/actions/runs/37137712974

Job:

`111245522644`

Conclusion:

`success`

Resultados del run:

- Validate JavaScript syntax: PASS
- Validate P0 runtime integration: PASS
- Prepare static site: PASS
- BONE-001 Native Chromium Validation: PASS
- Configure GitHub Pages: PASS
- Upload Pages artifact: PASS
- Deploy to GitHub Pages: PASS

Salida real del probe Chromium:

- `BONE-001 BROWSER PROBE = PASS`
- `VERSION = v17`
- `CACHE = baseball-waifus-v17`
- `LEGACY_CACHE = PURGED`
- `VERSION_GATE = match`
- `SERVICE_WORKER = READY`
- `RELOAD_LOOP = NOT_DETECTED`

El probe ejecutó Chrome/Chromium nativo del runner mediante CDP, sirvió una copia local de `site`, registró `./sw.js`, inspeccionó `caches.keys()` y comprobó el purge de `v16_capibara_core` y `baseball-waifus-v16`.

Deploy producido:

`https://jonhararagi.github.io/baseball-waifus/`

El endpoint público `/version.json` respondió HTTP `200` y devolvió:

- `version: "v17"`
- `cacheVersion: "baseball-waifus-v17"`

### Estado final

`CLOSED`

TMA:

`NOT RUN`

No se modificaron sistemas de gameplay ni otros Bones durante esta corrección.