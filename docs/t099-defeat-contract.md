# T099 · NORMAL COMBAT DEFEAT TERMINAL PATH

## Contract

El combate normal debe comunicar una derrota únicamente cuando una condición de gameplay real determine que el jugador perdió. La terminal debe viajar por el mismo borde de dominio utilizado por la victoria:

`GAMEPLAY FAILURE → COMBAT_RESULT/TurnResultDTO → outcome DEFEAT → terminal combat state → reward pipeline → no reward → return`.

El contrato de terminal previsto, alineado con el resultado de victoria ya existente, es:

```text
type: "TurnResultDTO"
result/outcome: "DEFEAT"
match_end: true
state.match_complete: true
```

Este contrato describe la forma que debe existir cuando el gameplay disponga de una condición de derrota. No significa que la implementación local actual ya produzca ese resultado.

## Audit

### Gameplay

`webapp/js/combat_core.js` contiene dos resolutores del combate local:

- `resolveTacticalTurn()`: reduce únicamente `bossHp` y puede avanzar a `TACTICAL` o `CLIMAX`.
- `resolveClimaxTurn()`: reduce `bossHp`; cuando llega a cero devuelve victoria, y de lo contrario devuelve fase `TACTICAL`.

No hay `playerHp`, `teamHp`, stamina terminal, contador de fracaso, GAME OVER ni otra condición de derrota en el modelo local auditado.

### Combat runtime

`webapp/js/combat.js` inicializa `battlePhase = "TACTICAL"`. Tras cinco turnos entra en `CLIMAX`. En `_resolveClimaxDamage()`, solo `result.victory` produce la transición terminal local a `VICTORY`. El resto vuelve a `result.phase`, actualmente `TACTICAL`.

Resultado: **no existe DEFEAT runtime normal reproducible**.

### Domain result

`webapp/js/reward_pipeline.js` ya acepta explícitamente `VICTORY` o `DEFEAT`. `app.js` también enruta ambos outcomes al mismo pipeline. Por tanto el borde de dominio está preparado parcialmente, pero el gameplay local no emite la rama `DEFEAT`.

### Rewards

`webapp/js/reward_resolver.js` ya define:

```text
VICTORY → +100 SCRAP
DEFEAT  → []
```

La razón existente para derrota es `NO_REWARD_ON_DEFEAT`. No se modifica.

### Persistence

`PlayerMetaRewardAdapter` no necesita una recompensa monetaria para registrar el `sourceEventId`. Con `DEFEAT → []`, el balance de SCRAP no debería incrementarse, mientras el ledger puede registrar el resultado para impedir duplicados. Esto queda como contrato existente, no como comportamiento de browser demostrado en T099.

### Presentation / Return

`CombatPresentationDirector` dispone del flujo genérico `COMBAT_RETURN → COMPLETE` y acepta un resultado normalizado sin exigir victoria. Sin embargo, el runtime local no tiene una terminal `DEFEAT` que lo active, y el HUD de battle loop solo representa explícitamente `TACTICAL`, `CLIMAX` y `VICTORY`.

Clasificación: **PARTIAL / NOT VERIFIED para DEFEAT player-facing**.

## QA Hook Decision

No se implementa un hook `?qa=defeat` ni equivalente en T099.

Motivo: un hook que escriba directamente `battlePhase = DEFEAT`, altere Player Meta o llame al reward resolver saltaría la condición de gameplay y produciría evidencia artificial.

El hook correcto debe quedar aguas arriba de una condición de derrota real, ser determinista y no persistente, y dejar que el runtime produzca el `DEFEAT` normalmente. Esa infraestructura no puede implementarse honestamente hasta decidir qué significa perder en el modelo de combate actual.

## Scope Boundary

T099 no añade:

- player/team HP;
- daño recibido por el equipo;
- nuevas mecánicas de enemigo;
- límite de rondas como derrota;
- stamina/energy loss terminal;
- penalizaciones, revive, retry o game over;
- nuevos sistemas de combate.

## Decision

**BLOCKED.**

El contrato de dominio puede fijarse, pero no existe una condición de gameplay legítima desde la cual producir la terminal local. Resolver ese vacío requiere una decisión de diseño y una implementación posterior, no un shortcut de QA.

**Next:** `T100 · NORMAL COMBAT DEFEAT CONDITION DECISION / MINIMAL IMPLEMENTATION · TIMER: 2–4 horas`.
