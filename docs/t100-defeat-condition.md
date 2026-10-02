# T100 · NORMAL COMBAT DEFEAT CONDITION

**Base SHA:** `e368ea9250d83be90d3e5ae0d2a3112e92b2d996`
**Implementation SHA:** `6745cacfe4c6144962123bd1ff5feeb69a574da5`

## Gameplay decision

La derrota normal se define como agotamiento de Stamina del bateador activo durante un combate que todavía no terminó en victoria.

La decisión reutiliza una estadística de personaje que el producto ya define como la resistencia/rendimiento que la jugadora conserva durante el partido antes de necesitar descanso. No se crea HP de jugador, daño enemigo ni una mecánica paralela.

### Contract

- `playerStamina` comienza con `batter.stamina` si está disponible, con fallback local `70`.
- `playerStaminaMax` queda limitado a `1..100`.
- Al resolver una ronda de Climax que no produce victoria, se consumen `25` puntos de Stamina.
- Si esa reducción alcanza `0`, el mismo resolver produce `DEFEAT`.
- La victoria tiene precedencia: una resolución que destruye `bossHp` termina en `VICTORY` y no consume el coste de ronda.
- La Stamina de combate se reinicia en cada `setCombatInit`; no se persiste como meta-progression.

### Terminal result

El resolver conserva `COMBAT_RESULT` y produce `phase/outcome/result = DEFEAT` junto con `match_end = true` cuando se agota la Stamina.

El runtime local usa entonces:

```text
GAMEPLAY FAILURE
↓
TurnResultDTO / DEFEAT
↓
match_end = true
↓
existing reward pipeline
↓
DEFEAT → []
↓
COMBAT_RETURN → COMPLETE
```

### Reward integrity

No se modificó la tabla T062:

```text
VICTORY → +100 SCRAP
DEFEAT  → []
```

El test de integración usa un resultado producido directamente por `resolveClimaxTurn()` para comprobar que la derrota llega al reward pipeline sin invocar el resolver manualmente y sin cambiar SCRAP.

### Runtime / QA

No se añadió query-param ni hook que fuerce `DEFEAT`. La condición puede alcanzarse mediante gameplay normal: fallar rondas de Climax consume Stamina hasta agotarla.

La observabilidad QA existente expone `data-combat-battle-phase`, `data-combat-player-stamina`, `data-combat-player-stamina-max` y `data-combat-result`.

### Scope

No se añadieron player HP, enemy attack/damage model, penalties, retry/revive, new combat engine, new combat UI ni nueva persistence architecture.

## Validation

- Combat Vertical Slice Tests: SUCCESS, Run `37009729685`.
- Player Meta Persistence Tests: SUCCESS, Run `37009729543`.
- `combat_core_test.mjs`: cubre DEFEAT, `match_end`, agotamiento y precedencia de victoria.
- `reward_pipeline_test.mjs`: cubre handoff desde el resultado real del core a `DEFEAT → []` sin modificar el SCRAP existente.

## Status

**CLOSED.**

**Next:** `T101 · NORMAL COMBAT DEFEAT BROWSER PROOF / NO-REWARD RETURN · TIMER: 1–2 horas`
