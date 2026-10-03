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