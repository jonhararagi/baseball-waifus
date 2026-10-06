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
