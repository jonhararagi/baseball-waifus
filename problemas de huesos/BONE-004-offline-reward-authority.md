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

**BROWSER:** BLOCKED. El probe Chromium alcanzó LOCAL_RESULT = DEMO_ONLY y LOCAL_REWARD = BLOCKED, pero la construcción dinámica del JavaScript evaluado en el harness falló en dos intentos controlados. No se hará un tercer intento dentro de esta task.

**DEPLOY:** NOT COMPLETED. El workflow principal quedó bloqueado antes de deploy por BONE-001, cuyo probe reportó LEGACY_CACHE_PRESENT,OLD_PRODUCT_CACHE_PRESENT incluso en el reintento del run 37142855495. No se modificó BONE-001.

**PRODUCTION BACKEND:** NO PRESENTE. No existe en este repositorio un emisor backend de reward_attestation; por lo tanto el contrato de verificación del cliente no se declara como backend productivo implementado.

## Blocker

~~~
CAUSE:
BONE-004 browser harness todavía contiene un defecto de construcción dinámica de la expresión CDP.

ATTEMPTS:
2

EVIDENCE:
unit contract PASS;
local economy block PASS;
BONE-004 Chromium no alcanzó validación server completa;
main deploy bloqueado además por BONE-001.

NEEDS:
corrección aislada del harness browser y posteriormente un backend real capaz de emitir atestaciones firmadas.
~~~

**GAMEPLAY CHANGES:** NONE.  
**BALANCE CHANGES:** NONE.  
**OTHER BONES TOUCHED:** NONE.  
**STATUS:** BLOCKED.

**NEXT:** BONE-004 browser harness recovery, luego BONE-005 cuando corresponda.
