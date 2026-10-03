# BONE-006 - CONCURRENCIA ROSTER / INVENTARIO / RECOMPENSA

PRIORIDAD: P0
ESTADO: CLOSED

Riesgo: una recompensa terminal y una mutacion de roster/inventario pueden competir y dejar snapshots incoherentes, duplicaciones o referencias invalidas.

Objetivo: version o revision de estado, validacion y aplicacion atomica/secuencial.

Casos: reward mientras cambia roster, venta/fusion simultanea, doble evento, dos tabs, cambio de dispositivo.

Cierre: concurrent reward PASS, roster mutation PASS, no duplicate PASS, no lost update PASS.

## BONE-006-CONCURRENCY-AUTH-001

Fecha: 2026-10-03
HEAD BEFORE: 26136b3b81678a254b1060c3cb7fc964c4cc2b6e
HEAD AFTER VALIDATED: c84781b8b589149e3a01665aaaebbc27ff58844d
TIMER: 90–120 minutos
RESULT: PASS / BONE-006 CLOSED

### Revision control

Player Meta persistence now uses a schema-versioned envelope with monotonic revision metadata:

schemaVersion
revision
state

The adapter rejects stale writes with STALE_WRITE and never silently overwrites a newer persisted snapshot.

The revision is tracked per player identity so one player's revision cannot contaminate another player's writer context.

An optional atomic compareAndSet storage contract is used by concurrency tests. Browser localStorage without CAS remains a compatibility backend and is not represented as distributed atomic storage.

### Stale write protection

PASS.

Two independent adapters can load the same revision. After writer A persists revision N+1, writer B saving with its old expected revision N is rejected.

Writer B then reloads the latest state and can reapply its intended mutation at N+2.

No silent overwrite and no silent merge are used.

### Reward concurrency

PASS.

Reward application remains one PlayerMeta transition:

authority proof
→ reward validation
→ dispatchBatch
→ RECORD_REWARD
→ single persistence save

A stale reward writer rolls back its tentative state, reloads the newest snapshot and rechecks the reward ledger.

The reward identity remains battle:<matchId>.

The duplicate-race test proves exactly one grant and one final reward ledger entry.

The reward amount remains +100 SCRAP for victory.

### Roster concurrency

PASS.

Roster writes are revision-aware. A stale roster mutation reloads the newest state, revalidates the requested active batter/support selection and retries only when the latest inventory still permits the requested roster.

No UI merge is used to conceal a conflict.

### Inventory concurrency

PASS.

Player Meta now validates roster ownership centrally.

When REMOVE_CHARACTER reduces a character to zero quantity, the same authoritative transition marks it locked, removes its progression entry and clears any active-batter/support references to that character.

This prevents snapshots of the form:

activeBatter = character
inventory says character is not owned

### Roster / inventory invariants

PASS.

The authoritative state preserves:

- ACTIVE_BATTER_NOT_UNLOCKED
- SUPPORT_NOT_UNLOCKED
- ACTIVE_BATTER_CANNOT_BE_SUPPORT
- DUPLICATE_SUPPORT

A conflict never becomes a persisted invalid snapshot.

### Two contexts / two tabs

PASS.

player_meta_concurrency_test.mjs simulates independent authorities and persistence adapters sharing an atomic test persistence backend.

The test demonstrates:

TWO WRITERS → ONE STALE → NO LOST UPDATE

### Device change

PASS.

Device A loads revision N.
Device A commits a mutation to N+1.
Device B attempts its stale N write and is rejected.
Device B reloads N+1 and successfully persists its intended mutation as N+2.

### Restart

PASS.

A fresh PlayerMetaPersistenceAdapter recovers the latest revision and state after the concurrent operations.

Backend PersistentCombatStore also persists match revision, nonce, turn sequence and reward ledger across restart.

### Backend durable store

PASS.

PersistentCombatStore now carries revision on authoritative combat state.

saveMatch accepts expectedRevision and increments revision atomically with the match state and optional reward ledger entry.

Stale authoritative combat writes are rejected with STATE_CONFLICT by CombatService.

Backend CI Run 37150898637 on commit 28f0ee364b59e84a63d2d4ea231ffcb2762e62ca = SUCCESS.

### Tests

Targeted Gacha / Player Meta workflow Run 37151168170 on commit 4fe74ed95cdf23d4bdd51051373341c4ce1cbe35 = SUCCESS.

The targeted suite includes:

- player_meta_authority_test
- player_meta_persistence_adapter_test
- persistence_authority_test
- player_meta_concurrency_test
- gacha_player_meta_migration_test
- gacha_player_meta_integration_test
- canonical_character_availability_test
- player_meta_roster_rehydration_test
- player_meta_roster_integration_test

The concurrency test explicitly covers reward race, reward duplicate, roster race, inventory race, two writers, device change, restart and identity isolation.

### Regression status

BONE-001: CLOSED, no files re-opened.
BONE-002: CLOSED.
BONE-003: CLOSED.
BONE-004 reward authority contract: PASS in backend authority suite and TMA workflow checkpoints.
BONE-005: CLOSED, no regression detected.
BONE-011: OPEN / unchanged.

The broad Player Meta Persistence Tests workflow remains red at Run 37151089702 because reward_pipeline_test.mjs fails at the pre-existing terminal-outcome assertion. The exact reward_pipeline_test.mjs content is byte-identical between BASE SHA 26136b3b81678a254b1060c3cb7fc964c4cc2b6e and the final BONE-006 head, and the same failure existed before this task at Run 37142700526. This is recorded as PRE-EXISTING FAILURE, not a BONE-006 regression.

The broad Telegram/Pages workflow was also not used as a closure signal for BONE-006 browser evidence. Targeted persistence/concurrency validation is the closure evidence for this bone.

### Scope

GAMEPLAY CHANGED: NO.
BALANCE CHANGED: NO.
COMBAT CORE CHANGED: NO.
GACHA RATES/PITY CHANGED: NO.
REWARD AMOUNT CHANGED: NO.
BONE-005: CLOSED.
BONE-004: BLOCKED.
BONE-011: OPEN / unchanged.

### Final status

BONE-006 = CLOSED.

Closure evidence exists for:

concurrent reward PASS
roster mutation PASS
inventory mutation PASS
no duplicate reward PASS
no lost update PASS
stale writer rejection PASS
successful reload/retry PASS
two contexts PASS
device change PASS
restart PASS
roster/inventory invariant PASS
reward ledger durability PASS
tests PASS

The global CI signal is not declared PASS because the unrelated pre-existing Player Meta Persistence workflow remains red.
