# BONE-004 - OFFLINE COMBAT VS REWARD AUTHORITY

PRIORIDAD: P0
ESTADO: BLOCKED

## CURRENT OPERATIONAL STATUS

**Audit base HEAD:** `2ac887fea2907e43b278f874ae955c86c5448e2e`  
**Status:** `OPEN / BLOCKED`  
**Global gate:** `CERRADO`

Este resumen describe el estado operativo actual del repositorio. Los checkpoints de abajo se conservan como historial; las afirmaciones anteriores a AUTH-022/AUTH-023 que indicaban que no existía un managed persistence adapter están supersedidas por la implementación y validación posterior.

### Implemented in repository

- Authority backend Node.js ESM, con estado y resolución de combate server-side reutilizando `webapp/js/combat_core.js`.
- Contrato de attestation `SERVER_COMBAT_ATTESTATION_V1`, signer ECDSA P-256/SHA-256 y verificación cliente.
- Telegram init-data server verification; la identidad autenticada se deriva de datos verificados, no de `initDataUnsafe`.
- PostgreSQL persistence module en `backend/src/postgres_persistence.mjs`.
- `ManagedCombatStore` y su wiring productivo en `backend/src/persistence_provider.mjs`.
- `ManagedPurchaseStore` y su wiring en `backend/src/purchase_persistence_provider.mjs`.
- Configuración productiva fail-closed, Docker/OCI y workflows de publicación/contracto de deployment.

### Historical validation, not production evidence

GitHub Actions Run `37747902639` = `SUCCESS`, Job `113213689936`, checkout HEAD `8efeaadddb09ef8683934263308a6810698e2849`.

La ejecución utilizó PostgreSQL `16.15` y registró **157 PASS / 0 FAIL / 0 SKIPPED**. Incluyó integración real en CI para inicialización de schema, recuperación al cerrar/reabrir stores, concurrencia, idempotencia, rollback transaccional, persistencia de combate/compras y container build/smoke.

El compare desde ese HEAD de CI hasta el audit base `2ac887fea2907e43b278f874ae955c86c5448e2e` contiene cinco commits, pero **ninguno modifica archivos `backend/**`**. Los cambios posteriores fueron workflow de publicación y documentación; por ello la validación de CI sigue aplicando al código backend actual. Es evidencia de PostgreSQL de integración en CI, no de una instancia productiva externa.

### External production state

- **Hosting:** Render `SELECTED / NOT PROVISIONED`.
- **Managed PostgreSQL productivo:** `NOT PROVISIONED / NOT VERIFIED`.
- **GHCR image publication / immutable digest:** `NOT VERIFIED`. La existencia del workflow no prueba una publicación.
- **Production secrets:** `NOT VERIFIED`; la conexión GitHub disponible no expone APIs de secrets/environment values. No se leyeron ni registraron valores.
- **Domain / DNS / HTTPS:** `NOT CONFIGURED`.
- **Telegram production webhook:** `NOT CONFIGURED`.
- **Production deployment:** `NOT RUN`.
- **Production health/readiness and authority smoke:** `NOT RUN`.
- **Client verification against deployed production backend:** `NOT RUN`.

**Cause:** faltan recursos/configuración externos verificables, no una ausencia actual del adapter PostgreSQL en el repositorio.  
**Needs:** Render access/service provisioned, managed PostgreSQL productivo, imagen GHCR inmutable accesible, runtime secrets/configuration, domain/DNS/HTTPS, Telegram webhook, monitoring/backups/restore y deployment real seguido de smoke de producción.

BONE-004 permanece `OPEN / BLOCKED`. Esto no modifica BONE-005 ni BONE-006. AUTH-021 y los diagnósticos previos continúan abajo como evidencia histórica, sin borrar sus resultados.


El cliente puede ejecutar combate local cuando no existe API y producir resultados locales.

Eso sirve para demo y QA, pero no puede ser autoridad economica comercial.

Objetivo: distinguir modo demo de produccion y exigir resultado autoritativo verificable para economia real.

Cierre: local demo safe PASS, server validation PASS, forged result rejection PASS.

## Implementación BONE-004

**HEAD inicial de la tarea:** 3fd6ac7d15e87ae7d3b26ee1a9459f1185ca079e

**Implementación:** commits fd832040e59577451d232b3a1cbdb64cbf449e3a, 6912716871f2770e9e14c7834ba15ea731700bcb, 2237ddf2549d1e9d624cd83ae3bf3923e272bc20 y wiring P0 524707a066572434d1c7af54f3c2d89228302a2e.

**LOCAL_DEMO:** PASS. onLocalCombatResult ya no llama al reward pipeline. El resultado local se mantiene observable para demo/QA y la economía no recibe grant.

**AUTHORITY CONTRACT:** PASS en unit test. Se implementó SERVER_COMBAT_ATTESTATION_V1 con firma ECDSA P-256/SHA-256 y payload canónico de match_id, player_id, turn_id, outcome, result y nonce.

**REWARD GATE:** PASS en unit test. applyCombatRewardPipeline() exige una prueba de autoridad verificada antes de resolver recompensas o mutar Player Meta.

**FORGED/TAMPERED/BINDING:** PASS en unit test para firma ausente, outcome alterado, match alterado, player incorrecto, nonce incorrecto, replay a otro match y resultado de pipeline manipulado.

**DUPLICATE:** PASS en unit test. Se mantiene battle:<matchId> y rewardLedger; el segundo grant es no-op.

**P0 CONTRACT RUN:** Run 37142969041, step BONE-004 Reward Authority Contract = SUCCESS.

**BROWSER:** PASS. El probe corregido ejecutó Chromium real y validó LOCAL_DEMO, rechazo de forged/tampered, atestación ECDSA P-256 temporal, grant canónico +100 SCRAP y duplicado no-op.

**DEPLOY:** NOT COMPLETED. El workflow principal quedó bloqueado antes de deploy por BONE-001, cuyo probe reportó LEGACY_CACHE_PRESENT,OLD_PRODUCT_CACHE_PRESENT incluso en el reintento del run 37142855495. No se modificó BONE-001.

**PRODUCTION BACKEND:** NO PRESENTE. No existe en este repositorio un emisor backend de reward_attestation; por lo tanto el contrato de verificación del cliente no se declara como backend productivo implementado.

## Estado tras BONE-004-R

**HARNESS RECOVERY:** PASS. Se eliminó la construcción dinámica frágil del probe y se sustituyó por una única expresión CDP completa y determinista.

**BROWSER EVIDENCE:** Run `37144155230`, step `BONE-004 Native Chromium Reward Authority Validation` = SUCCESS. Artifact `bone004-reward-authority-browser-evidence` contiene:
- `LOCAL_RESULT = DEMO_ONLY`
- `LOCAL_REWARD = BLOCKED`
- `FORGED_SERVER_RESULT = REJECTED`
- `TAMPERED_RESULT = REJECTED`
- `VALID_SERVER_ATTESTATION = ACCEPTED`
- `VALID_REWARD = ACCEPTED`
- `SCRAP_AFTER_VALID = 100`
- `DUPLICATE_REWARD = NO_OP`
- `SCRAP_AFTER_DUPLICATE = 100`
- `PLAYER_META = CONSISTENT`
- `BONE-004 BROWSER PROBE = PASS`

**CI CONTRACT:** PASS. El mismo Run `37144155230`, step `BONE-004 Reward Authority Contract` = SUCCESS.

**GLOBAL CI:** BLOCKED por BONE-001 en Run `37144155227`. BONE-001 reportó su bloqueo de cache heredada y BONE-004 fue omitido en ese workflow. No se modificó BONE-001.

**PRODUCTION BACKEND:** NOT PRESENT. El browser proof usa exclusivamente una keypair temporal generada dentro del navegador; no existe emisor backend productivo en este repositorio.

**NEEDS:** backend productivo emisor de `reward_attestation` para retirar el último bloqueo comercial de BONE-004.

**GAMEPLAY CHANGES:** NONE.  
**BALANCE CHANGES:** NONE.  
**OTHER BONES TOUCHED:** NONE.  
**STATUS:** BLOCKED.

**BLOCKER ACTUAL:** PRODUCTION BACKEND EMITTER NOT PRESENT.

**NEXT:** BONE-005 cuando corresponda.


## BONE-004-R · BROWSER HARNESS RECOVERY

**HEAD BEFORE:** `b5b3005ef599fafc2f8bcf428992d0d89e83e863`  
**HEAD AFTER:** `127de485829a2b6f9efc07d2a0db08d9f88c1645`  
**COMMIT:** `test: recover BONE-004 browser authority validation`

**HARNESS RECOVERY:** PASS.  
**UNIT TEST:** PASS.  
**CHROMIUM:** PASS.  
**BACKEND PRODUCTION:** NOT PRESENT.  
**GAMEPLAY:** NO CHANGES.  
**BALANCE:** NO CHANGES.  
**OTHER BONES:** NO CHANGES.

**STATUS:** BONE-004 permanece BLOCKED únicamente por la ausencia real del backend productivo emisor de atestaciones. El blocker browser quedó resuelto.

## Production Authority Diagnostic

**Task:** `BONE-004-PROD-AUTH-001 · BACKEND AUTHORITY INFRASTRUCTURE DIAGNOSTIC`  
**HEAD BEFORE:** `c4b0368fe6ea4121c858e21175b912a0d180b4bc`  
**Diagnostic document:** `docs/architecture/reward-authority-backend-v1.md`  
**RESULT:** PASS / DIAGNOSTIC COMPLETE

### Infrastructure status

- **STATIC HOST:** GitHub Pages / static WebApp.
- **GAMEPLAY API:** contract only. `webapp/js/api.js` defines `GET /v1/combat/:matchId/init` and `POST /v1/combat/:matchId/turn`, but no server implementation exists.
- **REWARD_ATTESTATION_ISSUER:** absent.
- **PRODUCTION_SECRET_STORAGE:** absent from the repository and no production key-management boundary is configured here.
- **BACKEND_DEPLOYMENT:** absent.
- **PLAYER_IDENTITY_VERIFICATION:** absent on the server.
- **COMBAT_STATE_AUTHORITY:** local/client gameplay exists; authoritative server combat service is absent.
- **PERSISTENCE_AUTHORITY:** local Player Meta/persistence exists; authoritative backend persistence is absent.

### Authority map

`GAMEPLAY AUTHORITY` = current local/client gameplay implementation; future production server authority not implemented.

`REWARD AUTHORITY` = client-side attestation verifier is implemented; production issuer is absent.

`PERSISTENCE AUTHORITY` = local Player Meta + browser persistence exist; durable backend authority is not implemented and is explicitly dependent on BONE-005.

### Contract

`SERVER_COMBAT_ATTESTATION_V1` with `ECDSA_P256_SHA256` remains the verified client contract.

Canonical payload fields are:

`version`, `match_id`, `player_id`, `turn_id`, `outcome`, `result`, `nonce`.

The diagnostic found no demonstrated incompatibility, so the contract was not changed.

### Secret boundary

The production signing private key must live in a managed secret/key facility belonging to the future backend deployment environment and must never be stored in repository files, client JavaScript, HTML, localStorage or Telegram CloudStorage.

No provider or secret store was selected or configured in this task.

### Telegram identity boundary

The client currently forwards `x-telegram-init-data`. `initDataUnsafe` is not sufficient as production authentication proof. Server-side Telegram init-data verification is required before binding the trusted Telegram user identity to `player_id`.

No server-side validation exists today.

### Persistence dependency

BONE-004 requires durable idempotency for reward identity, nonce/replay state and reward transaction/audit state.

`BONE-004 backend reward authority`
`→` `BONE-005 persistence authority`

BONE-005 remains OPEN and was not implemented here.

### BONE-011 dependency

BONE-011 remains a separate paid-transaction/monetization authority boundary. Shared future interfaces include transaction identity, idempotency, server secrets, authenticated identity, durable persistence and audit trail.

BONE-011 was not implemented here.

### Infrastructure choice

Provider selection remains **NOT SELECTED**. The diagnostic documents three compatible categories:

- serverless functions;
- containerized API;
- managed application backend.

The required technical boundary is provider-neutral: separate HTTPS API, protected server secrets, authoritative combat state, durable persistence and idempotent reward authority.

### Scope safety

No production backend was created. No private key was created. No BONE-005 or BONE-011 implementation was started.

**RUNTIME:** UNCHANGED.  
**GAMEPLAY:** UNCHANGED.  
**BALANCE:** UNCHANGED.  
**BONE-004:** BLOCKED.



## BONE-004-PROD-AUTH-002

**Fecha:** 2026-10-03  
**HEAD BEFORE:** `988745f073df9a21f87ed7d2f79d3d4b3bed8057`  
**CURRENT VALIDATED HEAD:** `6d67d0577d2e96e01d98218eb996efc49f101f79`  

### Backend implementation

- **BACKEND:** PASS. Created provider-neutral `backend/` Node.js ESM authority service.
- **SERVER GAMEPLAY AUTHORITY:** PASS. Server loads authoritative match state and calculates tactical/climax results by importing the existing `webapp/js/combat_core.js`; no duplicated combat formulas were created.
- **CLIENT RESULT TRUST:** REJECTED. Economic/result fields supplied by the client are rejected rather than copied into authoritative state.
- **COMBAT STORE:** `InMemoryCombatStore` only. Interface is isolated for BONE-005 durable persistence.
- **NONCE:** generated server-side per match and included in the attestation payload.
- **TURN SEQUENCING:** server-owned expected turn ids; explicit replayed/out-of-sequence ids are rejected.
- **REWARD IDENTITY:** remains `battle:<matchId>`.
- **SERVER ATTESTATION:** PASS. P-256 ECDSA + SHA-256 uses IEEE P1363 signature bytes, matching the Web Crypto verifier.
- **HTTP:** `GET /health`, `GET /ready`, `GET /v1/combat/:matchId/init`, `POST /v1/combat/:matchId/turn`.

### Authentication

Production authentication code now verifies Telegram Mini App init data server-side from `x-telegram-init-data`, derives `telegram:<userId>`, and does not use `initDataUnsafe` as authority.

The test-only `x-test-player-id` bypass is gated by `NODE_ENV=test`.

Production Bot Token configuration remains external and is not stored in the repository.

### Signer / secret boundary

The signer loads `REWARD_SIGNING_PRIVATE_KEY` from external configuration and exposes only the public JWK. Tests generate an ephemeral P-256 keypair in memory.

No production private key was committed.

### Validation

GitHub Actions Run `37147971145` on HEAD `6d67d0577d2e96e01d98218eb996efc49f101f79`:

- backend syntax: PASS
- client/server ECDSA compatibility: PASS
- health: PASS
- readiness fail-closed without persistence: PASS
- forged client result rejection: PASS
- wrong player: PASS
- wrong match: PASS
- wrong turn: PASS
- replayed turn id: PASS
- terminal server result + attestation: PASS
- Web Crypto client verification: PASS

### Production status

**PERSISTENCE:** DEVELOPMENT ONLY.  
**AUTHENTICATION:** PRODUCTION-CAPABLE CODE, CONFIGURATION REQUIRED.  
**DEPLOYMENT:** NOT CONFIGURED.  
**PRIVATE KEY:** OUTSIDE REPOSITORY.  
**GAMEPLAY:** UNCHANGED.  
**BALANCE:** UNCHANGED.  
**BONE-005:** OPEN / dependency remains for durable Player Meta, reward ledger and concurrency-safe persistence.  
**BONE-011:** OPEN / unchanged.

### Final Bone state

`BONE-004` remains **BLOCKED**.

**REMAINING BLOCKER:** production infrastructure is not configured yet: durable persistence/reward ledger, external production secret/key configuration, Telegram Bot Token/environment configuration and deployed HTTPS backend origin are still required.



## BONE-005-PERSISTENCE-AUTH-001 · DEPENDENCY UPDATE

Fecha: 2026-10-03
BONE-005: CLOSED en su alcance de persistencia dual y durable filesystem/integration tests.

La dependencia de BONE-005 queda satisfecha para la implementación y validación local del backend: existe PersistentCombatStore, reward ledger durable, restart recovery y protección de migración Player Meta.

Esto NO convierte BONE-004 en producción.

BONE-004 permanece BLOCKED mientras falten:

- configuración externa de production secrets/private key;
- Telegram Bot Token en entorno productivo;
- backend HTTPS desplegado;
- persistence provider y operación productiva.

No se modificó BONE-011.


## BONE-004-PROD-AUTH-003

HEAD BEFORE: `72cb94c89f64c445b458df1191523a508f462c0e`
HEAD AFTER: `ff25a6049f8d96f6498536b0ea368a0af3e2dd9a`
TIMER: 90–120 minutos
RESULT: PASS / BONE-004 remains BLOCKED.

Container PASS. Production config PASS. Fail-closed production validation PASS. Secret boundary PASS. Explicit non-wildcard CORS PASS. Telegram server authentication boundary PASS. Existing ECDSA P-256 / IEEE P1363 signer PASS. Persistence provider boundary PASS.

`backend/src/persistence_provider.mjs` makes memory/filesystem/managed boundaries explicit. Filesystem remains development/integration only. Managed persistence is the production contract and is intentionally not implemented/configured in this repository.

Health PASS. Readiness PASS. Readiness exposes only booleans and deployment mode. Public API configuration remains runtime-based through `window.BASEBALL_WAIFUS_API_BASE_URL`; no production URL is hardcoded.

The manual `.github/workflows/backend-authority-deploy.yml` validates backend tests, external secrets/configuration, non-wildcard origins and reproducible image construction, then stops at an explicit provider-neutral handoff.

PRODUCTION DEPLOYMENT: NOT CONFIGURED.
PRODUCTION SMOKE TEST: NOT RUN.

IMPLEMENTED != CONFIGURED != DEPLOYED.

BONE-004 STATUS: BLOCKED.

REMAINING BLOCKER: external managed durable persistence, production signing key, Telegram Bot Token, HTTPS deployment and a real smoke test/client verification against the deployed backend.



### Production container validation update · 2026-10-04

Backend CI Run `37175529956` on implementation/workflow HEAD `4f5155e683c7ba593e17da1ac1ca977132b132b4` = SUCCESS.

Evidence:
- backend syntax PASS;
- backend authority tests PASS;
- 27 backend tests PASS;
- container image build PASS;
- container smoke /health PASS in isolated test runtime;
- image secret-safety checks PASS.

This proves the container artifact and local smoke contract only. It is not evidence of external HTTPS deployment or managed production persistence.


## BONE-004-PROD-AUTH-004 · EXTERNAL PRODUCTION PROVIDER ACTIVATION CHECKPOINT

**Fecha:** 2026-10-04  
**HEAD BEFORE:** `4636b32dc4dd2baf6aecfb060905184593dfa0bf`  
**RESULT:** BLOCKED / EXTERNAL PROVIDER NOT CONFIGURED  
**TIMER:** 60–90 minutos

### Verificación

- **Provider real:** NOT CONFIGURED. No aparece proveedor seleccionado ni configuración vendor-specific en el árbol del repositorio.
- **Production persistence:** NOT CONFIGURED. Solo existe el boundary `managed` y el filesystem provider de desarrollo/integration; no existe adapter gestionado externo.
- **Production secrets:** NOT VERIFIABLE DIRECTLY. La conexión GitHub disponible no expone la API de Secrets/Environment values. No se imprimió ni se creó ningún secreto.
- **Telegram Bot config:** NOT VERIFIABLE DIRECTLY por la misma restricción de acceso; el repositorio solo define el contrato externo `TELEGRAM_BOT_TOKEN`.
- **HTTPS backend:** NOT CONFIGURED. No existe URL productiva documentada ni endpoint externo candidato en el repositorio.
- **Production deployment workflow:** NO RUNS. La workflow `backend-authority-deploy.yml` es manual/provider-neutral y el historial de Actions no contiene ejecuciones de esa workflow.
- **Production smoke test:** NOT RUN porque no existe endpoint HTTPS productivo verificable.
- **Repository secret files:** no aparecen `.env`, `*.pem`, `*.key`, `*.p12`, `*.pfx` ni `*.jwk` como archivos de producción en el árbol auditado.

### Estado de Bones relacionados

- BONE-005: CLOSED.
- BONE-006: CLOSED.
- BONE-001: CLOSED.
- BONE-002: CLOSED.
- BONE-003: CLOSED.
- BONE-011: OPEN, sin cambios.

### Causa / Attempts / Needs

**CAUSE:** External production provider not configured.

**ATTEMPTS:** Single verification checkpoint against repository HEAD, deployment workflow history, provider/configuration search and production documentation.

**EVIDENCE:** No configured production provider, no documented HTTPS endpoint and no deployment workflow execution. GitHub Secrets/Environment secret values are not queryable through the available repository connector, so their contents were not inspected or inferred.

**NEEDS:** Provider + production persistence + externally managed `REWARD_SIGNING_PRIVATE_KEY` + `TELEGRAM_BOT_TOKEN` + HTTPS backend deployment + real production smoke test.

**STATUS:** BONE-004 remains BLOCKED.

No code, gameplay, balance, reward, Gacha, persistence contract or frontend API configuration was changed.
