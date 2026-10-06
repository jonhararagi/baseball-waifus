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
