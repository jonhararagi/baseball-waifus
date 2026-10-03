# BONE-002 - GACHA WEBAPP RUNTIME DATA

PRIORIDAD: P0

ESTADO: CLOSED

## HEAD inicial

`f392191dbd79feed3c5efd7b1f84ecc42b9fe90f`

## Causa confirmada

`webapp/js/gacha_controller_runtime.js` consume:

- `./data/game_schemas_recycled.json`
- `./data/characters_queue.json`

La autoridad de contenido permanece en:

- `data/game_schemas_recycled.json`
- `data/characters_queue.json`

La build ya copia ambos archivos a `webapp/data/` para integración y a `site/data/` para Pages. BONE-002 agregó assertions y browser proof para verificar que esas copias sean byte-identicas a la fuente canónica y que el runtime pueda consumirlas.

## Cadena verificada

```
data/
  game_schemas_recycled.json
  characters_queue.json
        |
        +--> webapp/data/       (CI integration runtime)
        |
        +--> site/data/         (Pages artifact)
        |
        +--> deployed /data/    (public runtime)
```

No se creó un catálogo alternativo ni se reconstruyeron personajes.

## Schema

Fuente canónica:

`data/game_schemas_recycled.json`

Validaciones:

- `schema.gacha`: PASS
- `schema.gacha.rates`: PASS
- `R=80`, `SR=15`, `SSR=4`, `UR=1`: PASS
- suma = 100: PASS
- `per_banner_counter`: PASS
- soft pity enabled, start 61, increment 0.5%: PASS
- hard pity enabled, limit 80, guaranteed UR: PASS

No hubo cambios de balance.

## Queue

Fuente canónica:

`data/characters_queue.json`

La normalización runtime produjo 17 unidades totales:

- 1 unidad top-level: `bw015`
- 16 unidades en `batch_units`

STARTER:

- `bw001`

`bw001` mantiene `acquisition.mode = STARTER` y `pool_eligible = false`.

Pools runtime, usando exactamente la semántica existente `pool_eligible !== false`:

- R: 2
- SR: 7
- SSR: 5
- UR: 2

Todos los pools son no vacíos. El STARTER no contamina ningún pool.

## Player Meta

Se instanció el `GachaController` moderno, que hereda el runtime Gacha y usa `GachaPlayerMetaIntegration`.

Resultado:

- Gacha initialize: PASS
- `ready = true`: PASS
- Player Meta integration: PASS
- STARTER `bw001` hidratado: PASS
- active batter inicial: PASS
- `pulls_since_UR = 0`: PASS
- Scrap sin consumir: PASS
- Fragments sin consumir: PASS

No se ejecutaron pulls reales.

## Tests

Nuevo contrato:

`webapp/js/bone002_gacha_runtime_data_test.mjs`

Salida CI:

- `BONE-002 GACHA RUNTIME DATA TEST = PASS`
- `R_POOL = 2`
- `SR_POOL = 7`
- `SSR_POOL = 5`
- `UR_POOL = 2`
- `GACHA_READY = PASS`
- `PLAYER_META = PASS`

Nuevo browser probe:

`webapp/js/bone002_browser_probe.mjs`

Salida CI:

- `BONE-002 BROWSER PROBE = PASS`
- `SCHEMA = LOADED`
- `QUEUE = LOADED`
- `R_POOL = PASS`
- `SR_POOL = PASS`
- `SSR_POOL = PASS`
- `UR_POOL = PASS`
- `GACHA_READY = PASS`
- `PLAYER_META = PASS`

Chromium real del runner:

`/usr/bin/google-chrome`

No se ejecutaron `rollGacha()` ni `rollGachaTen()`.

## CI

Workflow:

`Baseball Waifus Telegram Mini App`

Run:

`37138875792`

URL:

https://github.com/jonhararagi/baseball-waifus/actions/runs/37138875792

Job:

`111248981172`

Resultado:

`success`

Steps BONE-002:

- BONE-002 Gacha Runtime Data Contract: PASS
- BONE-002 Native Chromium Gacha Validation: PASS

Steps de deploy:

- Configure GitHub Pages: PASS
- Upload Pages artifact: PASS
- Deploy to GitHub Pages: PASS

## Deploy público

URL:

https://jonhararagi.github.io/baseball-waifus/

Schema público:

https://jonhararagi.github.io/baseball-waifus/data/game_schemas_recycled.json

- HTTP 200: PASS
- JSON válido: PASS
- rates canónicos: PASS
- pity canónico: PASS

Queue pública:

https://jonhararagi.github.io/baseball-waifus/data/characters_queue.json

- HTTP 200: PASS
- JSON válido: PASS
- STARTER `bw001`: PASS
- pool runtime R/SR/SSR/UR: PASS

## Diff de seguridad

Comparación:

`f392191dbd79feed3c5efd7b1f84ecc42b9fe90f` -> `3bf3b36e1768295b06f4e28dc65293e85f385064`

Archivos modificados:

- `.github/workflows/deploy-pages.yml`
- `webapp/js/bone002_browser_probe.mjs`
- `webapp/js/bone002_gacha_runtime_data_test.mjs`

No se tocaron combate, renderer, Timing Ring, rewards, shop, Telegram bridge, Godot gameplay, economía, nuevos personajes ni balance Gacha.

## Evidencia pública adicional

Schema público verificado por navegador remoto:

Run:

`9bf68858-b391-4f31-9c3c-96034887bf66`

HTTP 200 y JSON válido.

Queue pública verificada por navegador remoto:

Run:

`aaff7684-6ca6-4579-a3a2-7b4627bc2b83`

HTTP 200 y JSON válido.

## Estado final

`ESTADO: CLOSED`

BONE-003: no iniciado.

TMA: no requerido para este cierre.

