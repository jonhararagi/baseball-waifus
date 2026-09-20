# Sistema de defensa y captura

## Objetivo

Un resultado que todavía puede depender de una captura no se cierra como `OUT` dentro de `BaseballSimulator`.

El simulador devuelve:

`FIELDING_CANDIDATE`

y el `FieldingResolver` determina el resultado final.

## Flujo

```text
Timing + stats de bateo
        ↓
BaseballSimulator
        ↓
FIELDING_CANDIDATE
        ↓
BattedBallEvent
        ↓
FieldingResolver
        ↓
Defense + posicionamiento + timing + calidad del contacto
        ↓
CAUGHT → OUT
MISS   → SINGLE
```

## Regla v1

La fórmula actual está versionada como `fielding_v1`.

Valores normalizados:

- `defense_score = effective_defense / 120`
- `positioning_score = 1 - distance(defender, ball_target) / 420`
- `timing_score = player timing`
- `ball_handling_score = 1 - contact_quality`

Fórmula:

```text
chance =
    0.05
  + defense_score * 0.48
  + positioning_score * 0.16
  + timing_score * 0.16
  + ball_handling_score * 0.08
  + zone_bonus
```

`chance` queda limitada entre `0.08` y `0.92`.

El bonus de zona actual es pequeño y favorece posiciones de infield:

- SS
- 2B
- 1B
- 3B

La tirada se realiza con `RandomNumberGenerator`, no mediante IA.

## Principio de diseño

La defensa no garantiza una captura.

Una defensora con estadísticas altas puede fallar y una defensora peor puede conseguir una captura. La estadística modifica la probabilidad, mientras la posición y el timing modifican la situación concreta.

El renderer nunca decide el resultado. El renderer recibe la resolución ya calculada.

## Resultado

El `FieldingResolver` devuelve además:

- posición defensiva;
- id de defensora;
- chance calculada;
- roll;
- versión de regla;
- motivo `CAUGHT` o `FIELDING MISS`.

Esto permite auditar y balancear el sistema.

## Pendiente

La v1 resuelve específicamente el candidato de out generado por contacto débil.

Todavía queda ampliar el sistema para:

- atrapadas de line drives;
- fly balls largos;
- rebotes;
- errores de lanzamiento;
- doble play;
- asistencia defensiva;
- cadena captura → lanzamiento → siguiente base.