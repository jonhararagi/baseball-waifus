# BONE-005 - PERSISTENCIA DUAL

PRIORIDAD: P0
ESTADO: CLOSED

Existen PlayerMetaAuthority, SaveSystem/localStorage, legacy Gacha state y Telegram CloudStorage.

Objetivo: una jerarquia de autoridad inequívoca, migracion determinista y proteccion contra overwrite con estado antiguo.

Cierre: new device PASS, Cloud to local rehydration PASS, stale local cannot overwrite PASS, migration PASS.

## BONE-005-PERSISTENCE-AUTH-001

Fecha: 2026-10-03
HEAD BEFORE: febc0131116a39c8d8c523acfe0f4e0f8c5715d4
HEAD AFTER VALIDATED: 219d99e2b4d67d799ccfe49693eff6bed4bfabb0
TIMER: 90–120 minutos
RESULT: PASS

### Autoridad de persistencia

La jerarquía quedó demostrada como:

PLAYER IDENTITY → PLAYER META AUTHORITY → AUTHORITATIVE STATE → PERSISTENCE ADAPTER → LOCAL CACHE / TELEGRAM CACHE / BACKEND DURABLE STORE

La fuente de autoridad moderna es Player Meta. Legacy Gacha, localStorage y Telegram CloudStorage permanecen como fuentes de migración/cache y no pueden reemplazar silenciosamente un Player Meta ya persistido.

### Backend durable

Se implementó backend/src/persistent_combat_store.mjs con:

- schema version 1;
- colecciones matches y rewardLedger en el mismo documento;
- validación fail-closed de schema, identidad, turn sequence, nonce, estado de combate y reward ledger;
- escritura mediante archivo temporal + fsync + rename atómico;
- permisos del archivo temporal 0600;
- almacenamiento durable por filesystem, reemplazable posteriormente por otro provider sin modificar CombatService;
- InMemoryCombatStore conservado para tests rápidos.

No se guardan secretos ni private keys.

### Reward ledger

La identidad continúa siendo battle:<matchId>.

La prueba de persistencia verifica:
first authorization → accepted
process restart → ledger recovered
second authorization → false / NO_OP

El match y el reward ledger se guardan en la misma operación persistente cuando el reward se autoriza desde CombatService.

No se modificó el reward base ni el balance.

### Player Meta / new device

PASS.

Se reprodujo:
DEVICE A / Cloud state
→ DEVICE B sin PlayerMeta moderno
→ Cloud legacy leído mediante el bridge existente
→ migración determinista a Player Meta
→ persistencia local moderna
→ segunda inicialización recupera el mismo estado.

Se verificaron SCRAP, FRAGMENTS, inventory, pity, active batter, identity y reward ledger.

### Precedencia y stale-local protection

PASS.

Caso reproducido:
REMOTE/CLOUD SCRAP = 900
LOCAL legacy SCRAP = 100

Resultado persistido:
PlayerMeta SCRAP = 900

En una inicialización posterior con Cloud legacy = 100, el Player Meta moderno sigue devolviendo 900.

Un snapshot legacy posterior no sobrescribe un Player Meta existente.

### Legacy migration

PASS.

La migración legacy Gacha → Player Meta conserva el estado soportado y es idempotente: una segunda migración devuelve el estado moderno ya persistido.

No se alteraron rates, pity, roster rules ni fórmulas de combate.

### Cloud → local

PASS.

Se reutiliza el CloudStorage existente; no se creó un segundo Telegram bridge.

Lecturas Cloud corruptas o JSON inválido ahora fallan cerradas en lugar de caer silenciosamente al legacy local.

### Identity isolation

PASS.

Se verificaron dos identidades Telegram distintas sobre el mismo storage sin cruce de snapshots.

La persistencia moderna valida playerId, provider y telegramUserId.

### Corruption safety

PASS.

Backend y Player Meta verifican explícitamente:

- JSON corrupto;
- archivo vacío;
- schema version inválido;
- reward ledger inválido;
- match incompleto;
- identidad persistida inválida;
- currency negativa;
- estado persistido inválido.

La regla resultante es:
CORRUPTED STATE → FAIL CLOSED

### Restart recovery

PASS.

La prueba reconstruye una segunda instancia del store usando la misma ubicación y recupera matchId, playerId, turnId, turnNumber, phase, bossHp, completed, nonce y reward ledger.

### Concurrency / serialization

PASS.

Las operaciones controladas dentro del mismo proceso producen JSON válido, no dejan temporales residuales, no duplican rewards y preservan las mutaciones secuenciales. No se introdujo coordinación distribuida innecesaria.

### Tests / CI

BACKEND CI: Run 37149995577 = SUCCESS.
npm test = 14/14 PASS.

Incluye create/load, schema, restart, player binding, corruption fail-closed, atomic write y reward ledger duplicate protection.

CLIENT TARGETED CI: Run 37149981537 = SUCCESS.

Incluye Player Meta authority/persistence, new-device, Cloud→local, stale-local protection, modern precedence, legacy migration, identity isolation, corruption y roster integration.

El workflow amplio Player Meta Persistence Tests continúa mostrando una falla ajena a este BONE en reward_pipeline_test.mjs; ese workflow ya estaba rojo antes del inicio de BONE-005 y sus asserts pertenecen a la regresión de BONE-004. No se modificó ese pipeline dentro de esta task.

### Regresiones protegidas

- BONE-001: CLOSED, sin archivos tocados.
- BONE-002: CLOSED, la suite Gacha/Player Meta continúa PASS.
- BONE-003: CLOSED, sin archivos tocados.
- BONE-004 reward authority verifier: PASS dentro de la suite backend y compatibilidad Web Crypto.
- BONE-011: OPEN, sin cambios.

### Scope

GAMEPLAY CHANGES: NO.
BALANCE CHANGES: NO.
GACHA RATES/PITY: NO.
COMBAT CORE: NO se modificó webapp/js/combat_core.js.
TELEGRAM BRIDGE: NO se creó otro bridge.
DEPLOYMENT: NO realizado.
OTHER BONES IMPLEMENTED: NO.

### Estado final

BONE-005 = CLOSED.

BONE-004 = BLOCKED y no se declara producción.

La persistencia durable implementada aquí es un provider filesystem reproducible para desarrollo/integración. BONE-004 todavía requiere configuración real de secrets, Telegram Bot Token, backend HTTPS desplegado y persistence provider/operaciones productivas.

DOCUMENTATION CHECKPOINT: el estado documental se registra en el commit posterior de documentación de esta task.
