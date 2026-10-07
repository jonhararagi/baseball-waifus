# BONE-011 - MONETIZACION / AUTORIDAD BACKEND

PRIORIDAD: P0
ESTADO: OPEN

El cliente abre invoice y el callback puede disparar acreditacion local de Scrap o boosts.

Eso no puede ser la autoridad economica definitiva en un producto comercial.

Objetivo: separar payment result de grant authority y asegurar idempotencia, receipt, doble callback y reconexion.

Cierre: paid single grant PASS, duplicate callback rejected PASS, forged client result rejected PASS, reconnect consistent PASS.

## BONE-011-AUTH-001 · CLIENT PURCHASE GRANT AUTHORITY GATE

Estado del checkpoint: CLOSED.
Estado de BONE-011: OPEN / IN_PROGRESS.

HEAD BEFORE:
5563b343dca5abbc0ff6e678c9759d1cbae28eab

Implementacion:
- Se creo `webapp/js/purchase_authority.js` como gate reutilizable entre PAYMENT_RESULT y AUTHORIZED_GRANT.
- `paid` sin una confirmacion de grant queda bloqueado en produccion.
- Scrap y boosts pasan por el mismo gate antes de cualquier mutacion economica local.
- El gate exige que el grant coincida con el recurso solicitado; no acepta un monto/cantidad distinta.
- El fallback de compra simulado conserva uso de QA/desarrollo y queda identificado como `SIMULATED_DEMO_ONLY`.
- No se creo backend falso, firma falsa, secreto, keypair ni bypass productivo.
- No se reutilizo la atestacion de BONE-004 para pagos.

Tests:
- payment=paid + authority ausente -> GRANT BLOCKED.
- payment=cancelled -> GRANT BLOCKED.
- payment=paid + simulated development -> GRANT ALLOWED, `SIMULATED_DEMO_ONLY`.
- payment=paid + production authority ausente -> GRANT BLOCKED.
- payment=paid + authority grant coincidente -> GRANT ALLOWED.
- grant con recurso/monto/cantidad incorrectos -> GRANT BLOCKED.
- Scrap y boosts no mutan estado cuando el authority gate bloquea.
- Test determinista: `webapp/js/bone011_purchase_authority_test.mjs`.

Validacion local:
- El contrato del gate fue ejecutado en Node y los casos de frontera pasaron.
- La prueba de ShopUI verifico que un `paid` sin authority no llama `addScrap` ni `boosts.grant`.
- No se ejecuto workflow global ni browser probe.

Archivos funcionales modificados:
- `webapp/js/purchase_authority.js`
- `webapp/js/shop_ui.js`
- `webapp/js/bone011_purchase_authority_test.mjs`

Gameplay:
NO CHANGE.

BONE-004:
OPEN / BLOCKED / UNCHANGED.

BONE-010:
CLOSED / UNCHANGED.

Pendiente de BONE-011:
- Integrar una autoridad de compra backend real.
- Verificar criptograficamente/autoritativamente el grant antes de permitir la ruta de produccion.
- Resolver idempotencia, receipts, callbacks duplicados, reconexion y persistencia de grants.
- No declarar BONE-011 CLOSED hasta disponer de evidencia real de autoridad economica productiva.

HEAD AFTER:
80f1a3dd06453127ee5ca7caec79b2ed0c845800

## BONE-011-AUTH-002-R · BACKEND SYNTAX RECOVERY

Estado del checkpoint: CLOSED.
Estado de BONE-011: OPEN / IN_PROGRESS.

HEAD BEFORE:
32bc65ba55407a1acf038e084fb2554e0466ae87

HEAD AFTER:
f8ffd7efc624ce8d2d315876f3e4ae1e2f93555f

TIMER:
20–30 minutos.

Recovery:
- La implementación de Purchase Authority había quedado bloqueada por un error de sintaxis en los tres patrones de rutas de `backend/src/server.mjs`.
- La recovery corrigió exclusivamente los matchers de:
  - `GET /v1/combat/:matchId/init`
  - `POST /v1/combat/:matchId/turn`
  - `POST /v1/purchases/:purchaseId/authorize`
- La solución utiliza `new RegExp(...)` y preserva la semántica de las rutas.
- Workflow `37475223425` terminó exitosamente.

Validacion:
- Workflow `37475223425` = SUCCESS.
- Backend tests = `40 PASS / 0 FAIL`.
- SYNTAX = PASS.
- ROUTE MATCHING = PASS.
- PRODUCTION CONFIG = PASS.
- BONE-011 AUTHORITY TESTS = PASS.

Casos BONE-011 validados:
- valid purchase;
- forged receipt;
- provider unavailable;
- missing provider;
- identity mismatch;
- product mismatch;
- amount mismatch;
- first grant;
- duplicate;
- conflict;
- reconnect;
- client authority injection.

Scope:
- GAMEPLAY: NO CHANGE.
- BALANCE: NO CHANGE.
- BROWSER: NOT RUN.
- No se modificó runtime funcional, Purchase Authority ni ningún archivo fuera de este checkpoint antes de su registro documental.

Production:
PRODUCTION STATUS: NOT CONFIGURED

La recovery de sintaxis y la suite verde no significan producción configurada. Todavía no existe:
- proveedor de pagos real;
- verificación real de receipts contra el proveedor;
- integración productiva;
- managed persistence productiva;
- callbacks reales;
- evidencia productiva de idempotencia/reconexión.

BONE-004:
OPEN / BLOCKED / UNCHANGED.

BONE-010:
CLOSED / UNCHANGED.

GLOBAL GATE:
CERRADO.


## BONE-011-AUTH-003 · PURCHASE STATUS AND RECONNECT CONTRACT

Estado del checkpoint: CLOSED.
Estado de BONE-011: OPEN / IN_PROGRESS.

**HEAD BEFORE:** `e3c8fe412fa12ac0734d4eac2ad3d1d966c9f284`
**IMPLEMENTATION COMMIT:** `2b862ed9917a1d7fb1c2e952c4684ab92331f212`  
**CI VALIDATION:** Run `37488381736` = SUCCESS on the identical tested tree `27615ad8673c1680b3201ef4839fd60bdd196c04`.

### Endpoint

Se añadió:

`GET /v1/purchases/:purchaseId`

La lectura pasa por `PurchaseAuthority.getStatus()` y el `PurchaseStore` existente.

- requiere la identidad autenticada existente;
- devuelve únicamente una compra perteneciente al jugador autenticado;
- una compra desconocida devuelve `404 NOT_FOUND`;
- una compra de otro jugador devuelve la misma respuesta segura y no filtra campos de la compra;
- la consulta no ejecuta nuevamente `providerVerifier`;
- la consulta no crea grants ni muta estado económico.

### Reconnect / persistence

Se verificó el flujo:

`authorize` → persistencia del purchase record → nueva instancia del store → `GET` → recuperación de `AUTHORIZED_GRANT`.

La prueba usa `PersistentPurchaseStore` para demostrar recovery tras reinicio del proceso y `InMemoryPurchaseStore` para los casos HTTP rápidos.

### Tests

La suite BONE-011 cubre:

- authorized purchase lookup;
- repeated lookup;
- reconnect recovery;
- wrong-player isolation;
- unknown purchase;
- ausencia de provider revalidation durante GET;
- no duplicate grant mutation;
- HTTP authentication y status codes.

El endpoint reutiliza el contrato y la identidad existentes; no modifica `POST /v1/purchases/:purchaseId/authorize`.

### Producción

No se implementó proveedor real de pagos ni deployment productivo.

**PRODUCTION STATUS:** NOT CONFIGURED.

BONE-011 permanece **OPEN / IN PROGRESS**.

BONE-004 permanece **OPEN / BLOCKED**.

BONE-010 permanece **CLOSED**.

GLOBAL GATE permanece **CERRADO** por los Bones críticos restantes.


## BONE-011-AUTH-004 · PURCHASE READINESS AND FAIL-CLOSED DEPLOYMENT GATE

Estado del checkpoint: CLOSED.  
Estado de BONE-011: OPEN / IN PROGRESS.

HEAD BEFORE: 6a6b8d6d335054e428e7ad3a304ae6914bcd2f13
HEAD AFTER: checkpoint final de este cambio, reportado al validar main.
TIMER: 1–2 horas.

Implementación:
- nuevo seam puro backend/src/purchase_readiness.mjs;
- GET /ready incorpora purchase_authority, purchase_persistence y purchase_provider;
- overall ready exige la autoridad económica además de signing/authentication/combat persistence;
- readiness no ejecuta authorize ni verifyReceipt;
- readiness no expone secretos.

Tests BONE-011 añadidos R1–R7:
- production sin provider;
- purchase persistence no durable;
- provider + persistence durable inyectados;
- combat ready pero purchase no ready;
- test mode;
- secret safety;
- no verification/authorization durante readiness.

Production: NOT CONFIGURED.
BONE-004: OPEN / BLOCKED / unchanged.
BONE-010: CLOSED / unchanged.
BONE-011: OPEN / IN PROGRESS.
GLOBAL GATE: CERRADO.
GAMEPLAY: NO CHANGE.
BALANCE: NO CHANGE.


## BONE-011-AUTH-005 · PROVIDER PURCHASE CALLBACK AUTHORITY CONTRACT

Estado del checkpoint: CLOSED.  
Estado de BONE-011: OPEN / IN PROGRESS.

HEAD BEFORE: `ab75a66ea6a3b2af6ccea12f7fa735d5520ed226`  
HEAD AFTER: `5d5fe2b12255f31c88c37953874315b3a57ba857`  
TIMER: 1–2 horas.

### Callback authority seam

Se añadió el seam provider-neutral `verifyPurchaseCallback(...)` a `backend/src/purchase_provider_verifier.mjs`.

El resultado confiable del callback es exclusivamente el evento verificado por el provider verifier. `PurchaseAuthority` no deriva identidad ni grant desde `x-test-player-id` ni desde campos económicos no verificados del request.

El callback especializado:

`HTTP callback → provider verifier → verified provider event → PurchaseAuthority → PurchaseStore`

reutiliza el mismo contrato de idempotencia y persistencia existente.

### Endpoint

Se añadió:

`POST /v1/purchases/provider-callback`

La ruta no autentica al comprador mediante `x-test-player-id`. La identidad final procede del resultado `VERIFIED` del provider verifier.

### Idempotencia

Se conserva la semántica existente:

- primera recepción verificada → `AUTHORIZED_GRANT`;
- callback idéntico repetido → `DUPLICATE_NO_OP`;
- mismo `purchase_id` o `provider + transaction_id` con datos verificados incompatibles → `REJECTED`;
- verifier unavailable → `UNAVAILABLE`;
- verifier de callback ausente en production → `UNAVAILABLE` / fail-closed.

Para seguridad, el callback se verifica antes de deduplicar: los datos crudos del proveedor no se consideran confiables para decidir que una compra ya existe.

### GET status / recovery

`GET /v1/purchases/:purchaseId` permanece sin cambios de semántica y recupera la compra persistida después del callback. Las lecturas repetidas no generan una nueva mutación económica.

### Security boundary

Tests demostraron que:

- request `player_id` no puede sustituir la identidad verificada;
- request `grant_kind` no puede sustituir el grant verificado;
- request `grant_amount` no puede sustituir el grant verificado;
- el endpoint callback no depende de `x-test-player-id`;
- no se exponen secretos del proveedor.

### Tests / workflow

Workflow backend existente:

Run `37497428233` = SUCCESS.

Se validaron:

- syntax;
- backend authority suite;
- callback authority;
- callback HTTP endpoint;
- idempotency;
- persistent recovery;
- container smoke.

### Producción

PRODUCTION STATUS: NOT CONFIGURED.

No se implementó Telegram Stars real, ningún proveedor real, credencial, Bot Token, API key, webhook externo ni deployment cloud.

### Dependencias / Gate

BONE-004: OPEN / BLOCKED / UNCHANGED.  
BONE-010: CLOSED / UNCHANGED.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.

Remaining blocker de BONE-011: conectar posteriormente un provider adapter real con verificación criptográfica/autoridad real y su persistence/operación productiva; esta task únicamente deja preparado el seam.


## BONE-011-AUTH-006 · CALLBACK RAW-BODY & AUTHENTICATION TRANSPORT SEAM

Fecha: 2026-10-06  
HEAD BEFORE: `bbfcdffb5e9c6e12779390665b31aa2d180c5c45`  
HEAD AFTER: `bbfcdffb5e9c6e12779390665b31aa2d180c5c45`  
TIMER: 45–75 minutos  
RESULT: PASS

Se endureció exclusivamente el transporte HTTP del callback provider-neutral.

### Raw body / headers

El endpoint `POST /v1/purchases/provider-callback` ahora realiza una sola lectura del request y conserva:

- `rawBody` como `Buffer` con los bytes recibidos antes de `JSON.parse`;
- `headers` como representación explícita de los headers HTTP recibidos;
- `body` como payload JSON parseado.

El provider verifier recibe los tres valores sin reconstruir el raw body mediante `JSON.stringify`.

### Fail-closed transport

El límite existente de 64 KiB se mantiene y un body excesivo devuelve `413 BODY_TOO_LARGE` antes de invocar al verifier.

Los datos de transporte no son autoridad económica. La autoridad continúa dependiendo exclusivamente del resultado `VERIFIED` producido por `PurchaseProviderVerifier` y consumido por `PurchaseAuthority`.

### Negative coverage

Los tests dirigidos verifican:

- raw body exacto;
- headers relevantes;
- parsed body disponible;
- oversized callback rechazado;
- `x-test-player-id`, `player_id` y `grant_amount` no pueden alterar el evento verificado;
- verifier `REJECTED` no crea purchase;
- verifier `UNAVAILABLE` no crea purchase;
- idempotencia y persistent recovery permanecen intactos.

### Validation

GitHub Actions Run `37499083138` = SUCCESS.

- backend syntax = PASS;
- backend authority / BONE-011 suite = PASS;
- callback HTTP transport = PASS;
- raw-body transport = PASS_STATIC;
- headers transport = PASS_STATIC;
- negative injection = PASS;
- idempotency = PASS;
- persistent recovery = PASS;
- container smoke = PASS.

Browser: NOT REQUIRED / NOT RUN.

### Scope

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.  
BONE-004: OPEN / BLOCKED / UNCHANGED.  
BONE-005: CLOSED / UNCHANGED.  
BONE-006: CLOSED / UNCHANGED.  
BONE-007: CLOSED / UNCHANGED.  
BONE-008: CLOSED / UNCHANGED.  
BONE-009: CLOSED / UNCHANGED.  
BONE-010: CLOSED / UNCHANGED.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

Production provider remains NOT CONFIGURED. No real provider, secret, API key or credential was introduced.


## BONE-011-AUTH-007 · ONE-TIME PURCHASE GRANT CLAIM AUTHORITY

Estado del checkpoint: CLOSED.  
Estado de BONE-011: OPEN / IN PROGRESS.

HEAD BEFORE: `dd6f024179fa750de7b6e8bbfb10831df17c043f`  
HEAD AFTER: `2e296a4517a59fda59d7f67db709c6c00eb342e7`  
TIMER: ~1.5–2.5 horas.  
RESULT: PASS

### Claim authority

Se añadió la frontera durable:

`AUTHORIZED_GRANT → UNCLAIMED → GRANT_CLAIMED → GRANT_ALREADY_CLAIMED`

con endpoint:

`POST /v1/purchases/:purchaseId/claim`

La identidad procede de la autenticación existente y no de campos del request.

El endpoint no acepta autoridad económica enviada por el cliente. Se rechazan campos como playerId, amount, resource, grant, authority, claimed y grant_amount.

### Persistence

`PurchaseStore` mantiene la única fuente de verdad del estado de compra mediante `claimStatus`.

Los registros históricos sin claimStatus se interpretan de forma compatible como `UNCLAIMED`, preservando AUTH-006.

`PersistentPurchaseStore.claimPurchase()` realiza la transición y la escritura atómica en el mismo documento de compra. No se creó un ledger paralelo.

### Exactly-once claim

Primera reclamación:

`GRANT_CLAIMED`

Reclamación posterior:

`GRANT_ALREADY_CLAIMED`

No se ejecuta ninguna mutación de Scrap, boosts, Player Meta ni otra economía en AUTH-007.

Dos llamadas concurrentes sobre la misma compra produjeron exactamente un ganador y un resultado ya reclamado.

### Callback interaction

Un callback duplicado mantiene la compra ya reclamada. `authorizeProviderCallback()` conserva el registro existente y no devuelve su estado a `UNCLAIMED`.

La secuencia verificada fue:

`callback → AUTHORIZED_GRANT → claim → GRANT_CLAIMED → duplicate callback → claim → GRANT_ALREADY_CLAIMED`

### Identity / read-only / unknown

- otro jugador no puede reclamar la compra;
- purchaseId desconocido produce semántica segura NOT_FOUND;
- `GET /v1/purchases/:purchaseId` permanece read-only;
- status después de claim refleja `GRANT_CLAIMED`.

### Tests

GitHub Actions Run `37520223734` = SUCCESS.

El workflow ejecutó:

- backend syntax = PASS;
- backend authority suite = PASS;
- production/security config suite = PASS;
- purchase claim authority suite = PASS;
- container smoke = PASS.

La suite alcanzó **82/82 PASS** en el checkpoint final, incluyendo los nuevos casos A–K de AUTH-007.

### Scope

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.  
ECONOMY APPLICATION: NO CHANGE.  
GACHA/PITY: NO CHANGE.  
BONE-004: OPEN / BLOCKED / UNCHANGED.  
BONE-005: CLOSED / UNCHANGED.  
BONE-006: CLOSED / UNCHANGED.  
BONE-007: CLOSED / UNCHANGED.  
BONE-008: CLOSED / UNCHANGED.  
BONE-009: CLOSED / UNCHANGED.  
BONE-010: CLOSED / UNCHANGED.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

### Production

No provider real de pagos fue creado ni configurado en AUTH-007.

No se añadieron secrets, private keys, Bot Tokens ni deployment productivo.

AUTH-007 cierra únicamente la frontera de claim durable; BONE-011 completo permanece abierto hasta la autoridad monetaria productiva y sus dependencias.


## BONE-011-AUTH-008 · PRODUCTION PROVIDER ADAPTER CONTRACT & CONFIGURATION SEAM

Fecha: 2026-10-06  
HEAD BEFORE: `65dddadb195273e6aef75103d40fcb871fb000ed`  
IMPLEMENTATION VALIDATED HEAD: `a24f22426d9a2b99a4db731ad069f435cfcbdf94`  
TIMER: ~1.5–2.5 horas  
RESULT: PASS / CHECKPOINT CLOSED

### Provider adapter boundary

Se añadió `backend/src/purchase_provider_adapter.mjs` como seam explícito para un proveedor futuro, sin seleccionar ni implementar un proveedor real.

Estados definidos:

- `NOT_CONFIGURED`
- `CONFIGURED_UNAVAILABLE`
- `READY`

El adapter encapsula el acceso al `PurchaseProviderVerifier`; `PurchaseAuthority` continúa siendo la única autoridad del grant y `PurchaseStore` continúa siendo la fuente de verdad de la compra.

### Configuration seam

`backend/src/config.mjs` ahora reconoce externamente:

- `PURCHASE_PROVIDER`
- `PURCHASE_PROVIDER_ENDPOINT`
- `PURCHASE_PROVIDER_CREDENTIAL`

El contenido del credential no se copia al objeto de configuración: únicamente se conserva su estado de presencia.

Con proveedor ausente, el estado es `NOT_CONFIGURED`.  
Con proveedor declarado pero sin credential/verificador/availability real, el estado es `CONFIGURED_UNAVAILABLE`.  
El estado `READY` solamente puede producirse mediante la inyección explícita de un adapter verificado y disponible.

### Fail-closed

Un adapter no configurado o no disponible devuelve `UNAVAILABLE` y nunca puede producir un grant.

Una respuesta de provider malformada se clasifica como `REJECTED / INVALID_PROVIDER_RESPONSE`.

No existe fallback a pago simulado dentro del boundary productivo.

### Secret safety

El status del adapter no contiene credenciales.  
La configuración no almacena el valor de `PURCHASE_PROVIDER_CREDENTIAL`.  
Los endpoints de readiness no exponen credenciales, receipts ni material criptográfico.

No se añadieron secrets, Bot Tokens, API keys, webhook secrets ni credentials reales.

### Compatibility / regressions

AUTH-005 callback authority permanece operativo.  
AUTH-006 raw-body transport permanece operativo.  
AUTH-007 one-time claim permanece operativo, incluyendo exactly-once claim y recovery.

### Validation

GitHub Actions Run `37523976239` = SUCCESS.

- backend syntax = PASS;
- backend authority suite = PASS;
- AUTH-007 claim tests = PASS;
- provider adapter/configuration tests = PASS;
- secret safety = PASS;
- production readiness boundaries = PASS;
- container smoke = PASS.

Suite final: **89 PASS / 0 FAIL**.

### Production status

**PRODUCTION STATUS: NOT CONFIGURED.**

No existe proveedor real seleccionado o conectado en el repositorio. No se conectaron Telegram Stars ni otro payment provider. No se crearon credenciales ni deployment externo.

BONE-011 continúa **OPEN / IN PROGRESS**.

BONE-004 continúa **OPEN / BLOCKED**.

BONE-005 continúa **CLOSED**.  
BONE-006 continúa **CLOSED**.  
BONE-010 continúa **CLOSED**.  
BONE-011 AUTH-008 solamente deja preparado el seam de integración futura.

### Scope

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.  
GACHA/PITY: NO CHANGE.  
ECONOMIC APPLICATION: NO CHANGE.  
GLOBAL GATE: CERRADO.


## BONE-011-AUTH-009 · TELEGRAM STARS PROVIDER ADAPTER

Fecha: 2026-10-06  
HEAD BEFORE: `3f3643160732aec865da39f3884306d73ad50445`  
IMPLEMENTATION HEAD: `b4cafa763757bc4a223382cacb6f85c240359e18`  
TIMER: 1.5–2.5 horas  
RESULT: PASS / CHECKPOINT CLOSED

### Implementación

Se añadió `backend/src/telegram_stars_adapter.mjs` dentro del seam provider-neutral de AUTH-008.

El adapter valida eventos Telegram `successful_payment` mediante el header de webhook de Telegram, verifica `currency = XTR`, identidad `message.from.id`, transaction id, invoice payload determinista `bwstars:v1` y correlación server-side contra el PurchaseStore existente.

El adapter produce únicamente un evento provider-neutral `VERIFIED`. No calcula ni aplica grants. PurchaseAuthority continúa siendo la autoridad económica y PurchaseStore la fuente de verdad.

### Seguridad y fail-closed

Se validaron:

- provider ausente;
- credential ausente;
- webhook secret inválido;
- `successful_payment` ausente;
- currency incorrecta;
- amount inválido/incompatible;
- invoice payload inválido;
- purchase inexistente;
- identity mismatch;
- product mismatch;
- transaction mismatch;
- duplicado/conflicto de evento.

El valor del webhook secret no queda expuesto en status/config serializable. No se añadieron credenciales reales, Bot Token, API keys ni secretos al repositorio.

### Compatibilidad

`PurchaseProviderAdapter` ahora soporta providers callback-only sin romper el contrato AUTH-008.

AUTH-005, AUTH-006, AUTH-007 y AUTH-008 permanecieron PASS en la suite de regresión.

### Validation

GitHub Actions Run `37525464161` = SUCCESS.  
Job `112481219857` = SUCCESS.  
Suite completa: `103 PASS / 0 FAIL`.

La ejecución incluyó syntax, backend authority, provider adapter/configuration, Telegram Stars adapter, purchase claim/persistence y container smoke.

### Producción

IMPLEMENTED: Telegram Stars adapter.

CONFIGURED: NO.

DEPLOYED: NO.

REAL TELEGRAM BOT: NO.

REAL CREDENTIALS: NO.

PRODUCTION EVIDENCE: NO.

No se ejecutó deployment externo ni llamada productiva a Telegram.

### Dependencias / Gate

BONE-004: OPEN / BLOCKED / unchanged.  
BONE-005: CLOSED / unchanged.  
BONE-006: CLOSED / unchanged.  
BONE-010: CLOSED / unchanged.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.  
GACHA/PITY: NO CHANGE.


## BONE-011-AUTH-010-R · TELEGRAM STARS PENDING PROMOTION RECOVERY

Fecha: 2026-10-06
HEAD BEFORE: 100d92b042ce848678ee37afa22be2ba88023f04
HEAD AFTER IMPLEMENTATION: 62922fea677600ba089896b3f52159417384372a
TIMER: ~1–2.5 horas
STATUS: PASS / RECOVERY COMPLETE

Causa reproducida en AUTH-010: la promoción PENDING → AUTHORIZED_GRANT estaba bloqueada porque PurchaseAuthority._persistVerifiedRecord() comparaba el registro pendiente con la identidad final de pago mediante samePurchase(), aunque la transacción Telegram definitiva todavía no existía en el estado PENDING.

Corrección causal:
- los registros PENDING se promueven mediante PurchaseStore.authorizePendingPurchase() sin exigir igualdad de identidad de pago final antes de la promoción;
- PersistentPurchaseStore.createPendingPurchase() ahora conserva la identidad pendiente sintética pendiente:<purchaseId>, igual que InMemoryPurchaseStore.

Evidencia:
- GitHub Actions Run 37528904073 = SUCCESS.
- Suite backend: 110 PASS / 0 FAIL.
- AUTH-010 A–G = PASS.
- AUTH-009 purchase authority tests = PASS dentro de la suite completa.
- purchase_claim_authority_test = PASS.
- telegram_stars_adapter_test = PASS.
- Container smoke = PASS.
- AUTH-010 restart claim/promotion = PASS.
- duplicate callback = DUPLICATE_NO_OP.
- identity isolation = PASS.
- client injection protection = PASS.
- no economic side effect in AUTH-010 = PASS.

Scope:
GAMEPLAY: NO CHANGE.
BALANCE: NO CHANGE.
GACHA: NO CHANGE.
PLAYER META: NO CHANGE.
BONE-004: unchanged / production still not configured.
BONE-005: CLOSED.
BONE-006: CLOSED.
BONE-011: OPEN / IN PROGRESS.

PRODUCTION:
NOT CONFIGURED. No real provider credentials, Bot Token or production deployment were added.

La recuperación queda persistida en main. 


## BONE-011-AUTH-011 · TELEGRAM STARS PURCHASE CREATION & PENDING FLOW

Fecha: 2026-10-06
HEAD BEFORE: e17072be22567ca014663e431fac95e4c20eb814
HEAD AFTER: 3f6e2c54e1d9bc284ec12f46d152fc0ffdd2cbb8
TIMER: ~1.5–2.5 horas
STATUS: CLOSED / CHECKPOINT COMPLETE

### Implementación

Se añadió el seam server-side de creación de compra:

POST /v1/purchases

La solicitud autenticada acepta únicamente product_id y, opcionalmente, Idempotency-Key.

PurchaseAuthority genera server-side el purchaseId, deriva playerId de la identidad autenticada y toma producto/precio/grant de un catálogo server-side.

Productos Stars soportados por el catálogo actual:
- scrap_5000 = 50 XTR → 5000 SCRAP
- scrap_25000 = 200 XTR → 25000 SCRAP

La compra queda:
PENDING
UNCLAIMED
provider=telegram-stars
currency=XTR
provider transaction externo ausente hasta successful_payment.

La respuesta incluye un invoice_payload determinista basado en purchaseId, productId y amount mediante el adapter Telegram Stars existente.

### Idempotencia

Idempotency-Key queda vinculada server-side a la identidad del jugador y al producto mediante purchaseId derivado del hash.

Repetición con la misma identidad/producto devuelve el mismo purchase PENDING sin crear una segunda compra.

Reutilización con otro producto devuelve IDEMPOTENCY_CONFLICT.

Sin Idempotency-Key se genera un purchaseId aleatorio server-side; sigue sin existir grant económico en la creación PENDING.

### Security boundary

El endpoint rechaza inyección de:
- purchaseId;
- playerId / telegramUserId;
- amount;
- currency;
- provider;
- transactionId;
- grantKind / grantAmount;
- status / authorized / verified;
- successful_payment.

La autoridad Telegram final no se obtiene del cliente.

### Pending → Authorized

La promoción no ocurre al crear PENDING.

El flujo verificado existente permanece:
Telegram successful_payment
→ TelegramStarsAdapter
→ VERIFIED
→ PurchaseAuthority
→ AUTHORIZED_GRANT
→ claim.

AUTH-010-R sigue siendo la corrección causal para la promoción PENDING → AUTHORIZED_GRANT y no fue revertida.

### Persistence / restart

PersistentPurchaseStore conserva el registro PENDING y su estado tras reconstrucción del proceso.

GET /v1/purchases/:purchaseId ahora puede devolver explícitamente PENDING para reconexión del jugador autenticado.

No se aplican Scrap, boosts ni Player Meta durante esta task.

### Tests

Workflow backend:
Run 37548761332 = SUCCESS.

Suite completa:
119 PASS / 0 FAIL.

La nueva suite:
backend/test/bone011_auth011_purchase_creation_test.mjs

cubre:
- authenticated server-priced PENDING;
- idempotency;
- unknown product;
- amount/currency/provider/identity/purchaseId injection;
- fake authorization/status/transaction;
- persistent PENDING restart;
- verified Telegram Stars promotion;
- duplicate callback;
- one-time claim;
- foreign identity isolation;
- no economic grant side effect.

Las suites existentes AUTH-009/AUTH-010 y claim/provider/persistence continúan PASS dentro de los 119 tests.

### Production status

IMPLEMENTED: YES
CONFIGURED: NO
DEPLOYED: NO
REAL TELEGRAM BOT: NO
REAL CREDENTIALS: NO
PRODUCTION EVIDENCE: NO

No se realizó ninguna llamada real a Telegram ni deployment externo.

BONE-004: OPEN / BLOCKED / unchanged.
BONE-005: CLOSED / unchanged.
BONE-006: CLOSED / unchanged.
BONE-010: CLOSED / unchanged.
BONE-011: OPEN / IN PROGRESS.

GAMEPLAY: NO CHANGE.
BALANCE: NO CHANGE.
GACHA/PITY: NO CHANGE.
PLAYER META: NO CHANGE.


## BONE-011-AUTH-012 · TELEGRAM STARS INVOICE LINK AUTHORITY SEAM

Fecha: 2026-10-06  
HEAD BEFORE: 384158704aadee5bdd7c495233edf500d81e731d  
HEAD AFTER: c72e3e3f115905bfbba594aff82fa5d008cc5dd4  
TIMER: 1.5–2.5 horas  
RESULT: PASS / CHECKPOINT CLOSED

Se implementó el seam server-side:

POST /v1/purchases/:purchaseId/invoice

La operación autentica al jugador, resuelve el purchase desde PurchaseAuthority, exige ownership y estado PENDING, y reconstruye el invoice payload exclusivamente a partir del purchase persistido y del catálogo Telegram Stars.

### Implementación

- nuevo `TelegramStarsInvoiceService`;
- llamada provider-specific encapsulada a `createInvoiceLink`;
- Bot Token solo server-side mediante configuración externa;
- moneda y precio server-owned (`XTR` y catálogo Telegram Stars);
- `invoice_payload` determinista y correlacionado con `purchaseId/productId/amount`;
- respuesta devuelve únicamente `purchase_id`, provider, invoice payload y invoice URL;
- `invoiceUrl` y `invoicePayload` se persisten en `PurchaseStore`;
- `AUTHORIZED_GRANT` y `GRANT_CLAIMED` no pueden crear nuevas invoices;
- unknown/foreign purchase devuelve NOT_FOUND;
- request body con campos económicos/authority es rechazado;
- creación de invoice no autoriza ni reclama el purchase.

### Persistencia / restart

`InMemoryPurchaseStore` y `PersistentPurchaseStore` soportan `setInvoiceForPurchase()`.

El registro conserva:
- purchaseId;
- product;
- amount;
- currency;
- provider;
- invoice payload;
- invoice URL;
- authorizationStatus=PENDING;
- claimStatus=UNCLAIMED.

Se verificó recovery tras reconstrucción de `PersistentPurchaseStore`.

### Fail-closed

Sin Bot Token el endpoint responde 503 con `TELEGRAM_INVOICE_UNAVAILABLE`.

No se fabrica una URL de pago productiva.

No se registra ni devuelve el Bot Token.

### Tests

GitHub Actions backend Run 37549763581 = SUCCESS.

Suite backend completa:
127 PASS / 0 FAIL.

AUTH-012 targeted:
- PENDING invoice creation: PASS;
- server price/product authority: PASS;
- payload correlation: PASS;
- unknown purchase: PASS;
- foreign identity: PASS;
- client economic injection: PASS;
- AUTHORIZED_GRANT blocked: PASS;
- GRANT_CLAIMED blocked: PASS;
- missing Bot Token fail-closed: PASS;
- repeated request reuses invoice handle: PASS;
- persistent restart recovery: PASS;
- no economic side effect: PASS.

Las suites AUTH-007..AUTH-011 existentes continúan PASS dentro de la ejecución completa.

### Producción

IMPLEMENTED: YES
CONFIGURED: NO
DEPLOYED: NO
REAL TELEGRAM CALL: NO
REAL BOT TOKEN: NO
PRODUCTION EVIDENCE: NO

Los tests utilizan provider HTTP simulado inyectado; no se generaron ni almacenaron credenciales reales.

BONE-004: OPEN / BLOCKED / unchanged.
BONE-005: CLOSED / unchanged.
BONE-006: CLOSED / unchanged.
BONE-010: CLOSED / unchanged.
BONE-011: OPEN / IN PROGRESS.
GLOBAL GATE: CERRADO.

GAMEPLAY: NO CHANGE.
BALANCE: NO CHANGE.


## BONE-011-AUTH-014 · SERVER-SIDE PURCHASE GRANT FULFILLMENT LEDGER

Fecha: 2026-10-06  
HEAD BEFORE: `6dd48128ae3ec415d9b5c125fd50ad720268c0c6`  
IMPLEMENTATION HEAD: `c10c2099257eaa36a3e6c2a9253d868fb5f7077d`  
TIMER: ~1.5–2.5 horas  
RESULT: PASS / CHECKPOINT CLOSED

### Fulfillment authority

Se añadió la transición durable:

`AUTHORIZED_GRANT → UNCLAIMED → GRANT_CLAIMED → GRANT_FULFILLED`

mediante `POST /v1/purchases/:purchaseId/fulfill`.

La operación es server-side y autenticada. No acepta body económico ni identidad de cliente como autoridad. El grant se obtiene exclusivamente del purchase record persistido.

No se aplica todavía el grant a Player Meta, Scrap ni boosts. AUTH-014 registra la fulfillment económica auditable para que una etapa posterior pueda consumirla.

### Ledger durable

`PurchaseStore` sigue siendo la única fuente de verdad de la compra. El documento durable existente incorpora `fulfillments` sin crear un PurchaseStore paralelo.

La identidad determinista es:

`purchase-grant:<purchaseId>`

El registro conserva:

- fulfillmentId;
- purchaseId;
- playerId;
- productId;
- grantKind;
- grantAmount;
- currency;
- provider;
- providerTransactionId;
- status;
- createdAt;
- fulfilledAt.

La validación exige purchase existente, `GRANT_CLAIMED`, identidad/producto coincidentes y estado `GRANT_FULFILLED`.

### Exactly-once / concurrency

Primera fulfillment:

`GRANT_FULFILLED`

Segunda fulfillment del mismo purchase:

`GRANT_ALREADY_FULFILLED`

Dos requests concurrentes en el mismo boundary persistente produjeron exactamente un resultado de cada tipo y un único ledger record.

### Restart / callback

El ledger sobrevive a una nueva instancia de `PersistentPurchaseStore`.

Secuencia verificada:

`authorize → claim → fulfill → restart → fulfill`

Resultado después de restart:

`GRANT_ALREADY_FULFILLED`

Un callback duplicado posterior a claim + fulfill conserva el purchase y el fulfillment existentes; no resetea claim ni crea un segundo ledger record.

### Invalid states / identity

- purchase inexistente → `NOT_FOUND`;
- jugador distinto → `NOT_FOUND`;
- purchase `PENDING` / no autorizada → fulfillment rechazada;
- purchase autorizado pero `UNCLAIMED` → `CLAIM_REQUIRED`;
- payload con amount, grant, currency, provider, transaction, claimStatus, authorized, verified, paid, reward u otros campos económicos → rechazado;
- `GET /v1/purchases/:purchaseId` permanece read-only.

No se exponen datos del purchase ajeno a través del endpoint de fulfillment.

### Regressions / scope

AUTH-007 claim, AUTH-009 Telegram Stars adapter, AUTH-010-R promotion recovery, AUTH-011 purchase creation, AUTH-012 invoice authority y AUTH-013 checkout permanecen dentro de la suite backend completa.

No se modificaron:

- PlayerMetaAuthority;
- gameplay;
- combat;
- Gacha;
- pity;
- boosts runtime;
- CombatRenderer;
- Combat Core;
- reward amounts.

### Validation

GitHub Actions Run `37553061081` = SUCCESS.

Job `112572839903` = SUCCESS.

Suite backend:
`138 PASS / 0 FAIL`

Incluye:
- syntax PASS;
- AUTH-014 fulfillment suite PASS;
- AUTH-007 claim regression PASS;
- AUTH-012 invoice regression PASS;
- AUTH-013 relevant checkout/authority regression PASS;
- container smoke PASS.

Production:
IMPLEMENTED: YES.  
CONFIGURED: NO.  
DEPLOYED: NO.

No se añadieron secrets, Bot Token, API keys, production database ni deployment externo.

BONE-004: OPEN / BLOCKED / unchanged.  
BONE-005: CLOSED / unchanged.  
BONE-006: CLOSED / unchanged.  
BONE-007: CLOSED / unchanged.  
BONE-008: CLOSED / unchanged.  
BONE-009: CLOSED / unchanged.  
BONE-010: CLOSED / unchanged.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.


## BONE-011-AUTH-015-R · SERVER-SIDE PURCHASE GRANT APPLICATION AUTHORITY

Fecha: 2026-10-06  
HEAD BASE VALIDADO: `4ea0194fa23565e2841fd88e13af81ebee5ab19f`  
HEAD AFTER: `14eedc65ca4aca1eeec34626dcdc7edf67444f3e`  
TIMER: ~2–3 horas  
RESULT: PASS / CHECKPOINT CLOSED

Se completó la aplicación económica server-side de una compra previamente autorizada y reclamada.

### Frontera

`POST /v1/purchases/:purchaseId/apply`

El request acepta únicamente un body vacío. La identidad se toma de la autenticación y la economía se deriva exclusivamente del purchase persistido.

Secuencia:

`AUTHORIZED_GRANT → GRANT_CLAIMED → GRANT_APPLIED`

### Player Meta + Reward Ledger

`PurchaseStore` reutiliza `PlayerMetaAuthority`.

La aplicación ejecuta una sola transición:

`ADD_CURRENCY + RECORD_REWARD`

mediante `dispatchBatch`, y persiste en el mismo documento durable:

- `playerMeta`;
- `fulfillments`;
- purchase state.

La identidad idempotente continúa siendo:

`purchase-grant:<purchaseId>`

El purchase sigue siendo la fuente de verdad para `grantAmount`, `grantKind`, `playerId` y demás datos económicos.

No se creó un segundo economy store ni un segundo reward ledger.

### Exactly-once / restart / concurrency

First application:
`GRANT_APPLIED`

Repeated application:
`GRANT_ALREADY_APPLIED`

Tras reconstruir `PersistentPurchaseStore`, el retry conserva un único grant y un único reward-ledger entry.

Dos aplicaciones concurrentes sobre la misma compra producen exactamente un único grant efectivo y un único fulfillment.

### Security

Se rechazan como autoridad de cliente los campos económicos/identidad de aplicación, incluyendo:

`playerId`, `amount`, `resource`, `grant`, `fulfillmentId`.

Purchase desconocido, ownership ajeno, estado PENDING y estado UNCLAIMED no aplican economía.

### Validation

GitHub Actions Run `37559199877` = SUCCESS.  
Job `112592385178` = SUCCESS.

Backend suite:
`147 PASS / 0 FAIL`

Incluye las suites AUTH-015, AUTH-014, AUTH-007, AUTH-009, AUTH-010-R, AUTH-011, AUTH-012, persistence, production config y authority regression.

Container smoke:
PASS.

### Scope

GAMEPLAY: NO CHANGE.  
BALANCE: NO CHANGE.  
GACHA: NO CHANGE.  
COMBAT: NO CHANGE.  
BONE-004: OPEN / BLOCKED / unchanged.  
BONE-005: CLOSED / unchanged.  
BONE-006: CLOSED / unchanged.  
BONE-010: CLOSED / unchanged.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.

### Production

IMPLEMENTED: YES.  
CONFIGURED: NO.  
DEPLOYED: NO.  
REAL TELEGRAM BOT: NO.  
REAL CREDENTIALS: NO.  
PRODUCTION EVIDENCE: NO.

AUTH-015-R no implica cierre de BONE-011 completo ni deployment productivo.


---

## BONE-011-AUTH-016 · CLIENT PURCHASE CLAIM & SERVER GRANT APPLICATION INTEGRATION

**Fecha:** 2026-10-07  
**HEAD BEFORE:** `3af3ce0c2656d19bed58f3e9ccc3aff17bfb429d`  
**HEAD AFTER:** `b94f43cc4593d4bf655a2b64877422b6fdef3394`  
**TIMER:** ~2–3 horas  
**RESULT:** PASS / CHECKPOINT CLOSED

Se cerró la integración cliente del checkout server-authoritative para los productos server-supported `scrap_5000` y `scrap_25000`.

### Flujo

`createPendingPurchase → createPurchaseInvoice → Telegram openInvoice → paid → GET status → claim → apply → GRANT_APPLIED`

El cliente nunca aporta autoridad económica en claim/apply. Ambos endpoints envían exclusivamente `{}` y la identidad viaja por la autenticación Telegram existente.

### API client

Se añadieron:

- `claimPurchase(purchaseId)`;
- `applyPurchaseGrant(purchaseId)`;
- validadores DTO para `GRANT_CLAIMED`, `GRANT_ALREADY_CLAIMED`, `GRANT_APPLIED` y `GRANT_ALREADY_APPLIED`;
- errores HTTP estructurados sin alterar la autoridad server-side.

### ShopManager / recovery

El checkout real ahora continúa automáticamente:

`AUTHORIZED_GRANT → CLAIMING → GRANT_CLAIMED → APPLYING → GRANT_APPLIED`

También soporta:

- `GRANT_ALREADY_CLAIMED` → continúa a apply;
- `GRANT_ALREADY_APPLIED` → estado terminal seguro;
- `PENDING` → `WAITING_AUTHORITY`, sin claim/apply;
- timeout de claim/apply → recovery conservado;
- reload → `recoverStoredPurchase(productId)` retoma el estado server-side;
- recovery se limpia solamente tras estado terminal aplicado.

### UI / economía

`ShopUI` no ejecuta `addScrap()` para compras reales.

La única acreditación local conserva la ruta explícita `SIMULATED_DEMO_ONLY` en desarrollo.

La confirmación real muestra `RECOMPENSA ACREDITADA` solamente cuando el backend devuelve `GRANT_APPLIED` o `GRANT_ALREADY_APPLIED`.

No se creó un segundo ledger, reward authority, purchase authority ni economy store.

### Security / injection

Los tests verifican que payloads cliente con `amount`, `grant_amount`, `player_id`, `authorized`, `verified` o `claimed` no se convierten en side effect económico local.

La ruta de producción mantiene:

`Telegram PAYMENT RESULT → Backend PurchaseAuthority → Claim → Apply → PlayerMetaAuthority`

### Browser QA

El harness `webapp/bone011_purchase_checkout_browser_harness.html` se publicó por GitHub Pages y se ejecutó en una página renderizada con mocks del backend/provider, sin compra real.

Resultado:

`browser_checkout = PASS_REAL`

Flujo observado:

`SHOP OPEN → CREATE PURCHASE → CREATE INVOICE → PAID → AUTHORIZED → CLAIM → APPLY → CONFIRMED`

Requests observados:

`create, invoice, telegram_open_invoice, status, claim, apply`

`local_economic_side_effect = 0`

`final_status = GRANT_APPLIED`

`console_errors = []`

### CI

- Gacha Player Meta Integration Tests Run `37560140073` = SUCCESS sobre el código funcional del checkout.
- Baseball Waifus Visual QA Run `37560332707` = SUCCESS sobre `b94f43cc4593d4bf655a2b64877422b6fdef3394`.
- Baseball Waifus Telegram Mini App Run `37560332747` = SUCCESS sobre `b94f43cc4593d4bf655a2b64877422b6fdef3394`.
- `purchase_checkout_test.mjs` reportó PASS.
- Las suites anteriores de AUTH-015-R / AUTH-014 mantienen evidencia PASS según el checkpoint backend previo.

### Scope

**GAMEPLAY:** NO CHANGE.  
**BALANCE:** NO CHANGE.  
**GACHA:** NO CHANGE.  
**PITY:** NO CHANGE.  
**COMBAT:** NO CHANGE.  
**BONE-004:** OPEN / BLOCKED / unchanged.  
**BONE-005:** CLOSED / unchanged.  
**BONE-006:** CLOSED / unchanged.  
**BONE-010:** CLOSED / unchanged.  
**BONE-011:** OPEN / IN PROGRESS.  
**GLOBAL GATE:** CERRADO.

### Production

`IMPLEMENTED: YES`  
`CONFIGURED: NO`  
`DEPLOYED: NO`

AUTH-016 integra la ruta cliente contra la autoridad backend ya existente, pero no constituye deployment productivo real ni cierre completo de BONE-011.


## BONE-011-AUTH-017 · TELEGRAM STARS PRODUCTION READINESS & DEPLOYMENT PREFLIGHT

Fecha: 2026-10-07  
HEAD BASE VALIDADO: `2e21deb6678b20bcd71942219b850ee7b97aa929`  
RESULT: PASS / PREFLIGHT COMPLETE  
TIMER: ~1.5–2.5 horas de contrato; detenido al límite externo.

IMPLEMENTED: YES.  
CONFIGURED: NO.  
DEPLOYED: NO.  
REAL_PROVIDER: NOT_CONFIGURED.  
REAL_PAYMENT: NOT_RUN.  
REAL_WEBHOOK: NOT_RUN.  
REAL_PERSISTENCE: NOT_CONFIGURED.

La auditoría de AUTH-010-R→016 confirma que la cadena de autoridad Telegram Stars está implementada y respaldada por suites CI previas. AUTH-016 mantiene browser harness PASS_REAL con `local_economic_side_effect=0`, pero no es evidencia de un pago real.

El backend production readiness permanece fail-closed cuando falta purchase provider/persistence/secrets. No se encontraron archivos de secretos rastreados ni configuración de proveedor externo en el árbol actual. `.github/workflows/backend-authority-deploy.yml` continúa como contrato provider-neutral y no registra ninguna ejecución de deployment productivo.

Evidence:
- AUTH-010-R Run `37528904073` = SUCCESS, 110 PASS / 0 FAIL.
- AUTH-012 Run `37549763581` = SUCCESS, 127 PASS / 0 FAIL.
- AUTH-014 Run `37553061081` = SUCCESS, 138 PASS / 0 FAIL.
- AUTH-015-R Run `37559199877` = SUCCESS, 147 PASS / 0 FAIL.
- AUTH-016 Gacha Player Meta Run `37560140073` = SUCCESS.
- AUTH-016 Telegram Mini App Run `37560332747` = SUCCESS.
- AUTH-016 Visual QA Run `37560332707` = SUCCESS.

BLOCKER:
external production provider + managed persistence + HTTPS deployment + production secrets are not configured/verified.

No code/runtime change, no deployment, no real Telegram call, no real payment verification.

BONE-004: OPEN / BLOCKED / unchanged.  
BONE-005: CLOSED / unchanged.  
BONE-006: CLOSED / unchanged.  
BONE-010: CLOSED / unchanged.  
BONE-011: OPEN / IN PROGRESS.  
GLOBAL GATE: CERRADO.
