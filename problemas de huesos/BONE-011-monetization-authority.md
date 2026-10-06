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
