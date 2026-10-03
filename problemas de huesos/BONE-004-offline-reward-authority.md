# BONE-004 - OFFLINE COMBAT VS REWARD AUTHORITY

PRIORIDAD: P0
ESTADO: BLOCKED

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

