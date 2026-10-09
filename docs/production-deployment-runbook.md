# BaseWarriors: Meta-Strike · Production Deployment Runbook

Estado: HANDOFF / NO DEPLOYMENT
Fecha de revisión: 2026-10-09
Fuente: código y workflows actuales de main

Este runbook define el camino operativo para activar el Authority Backend cuando exista infraestructura externa autorizada. No selecciona proveedor, no crea infraestructura y no contiene secretos.

## 1. Production prerequisites

Requisitos externos:

- Host compatible con Docker/OCI y HTTPS estable.
- Registry accesible para obtener una imagen inmutable.
- PostgreSQL gestionado, durable y accesible desde el backend.
- Secret manager/runtime configuration para producción.
- Bot Telegram de producción y configuración del webhook Telegram Stars.
- Origen público estable de la WebApp para CORS.

La publicación de imagen está preparada en el workflow existente para:

ghcr.io/jonhararagi/baseball-waifus/basewarriors-authority

La publicación real no se considera existente hasta que haya evidencia de un workflow de publicación exitoso o un registry externo equivalente.

## 2. Runtime configuration

| Variable | Required | Optional | Secret | Public config | Default | Production fail-closed |
|---|---|---|---|---|---|---|
| NODE_ENV | Sí | No | No | Sí | development | Debe ser production |
| PORT | Sí | No | No | Sí | 8787 | El host debe entregar un puerto válido |
| REWARD_SIGNING_PRIVATE_KEY | Sí | No | Sí | No | vacío | Startup rechazado si falta |
| TELEGRAM_BOT_TOKEN | Sí | No | Sí | No | vacío | Startup/config inválidos si falta |
| TELEGRAM_INIT_DATA_MAX_AGE_SECONDS | Sí | No | No | Sí | 3600 | Mantener valor positivo explícito |
| ALLOWED_ORIGINS | Sí | No | No | Sí | vacío en production | Vacío o * rechazado |
| AUTHORITY_PERSISTENCE_PROVIDER | Sí | No | No | Sí | vacío | Debe ser managed |
| AUTHORITY_PERSISTENCE_DSN | Sí | No | Sí | No | vacío | Debe existir y ser PostgreSQL válido |
| PURCHASE_PROVIDER | Sí en production | No | No | Sí | vacío | Debe ser telegram-stars; ausente/no soportado bloquea startup |
| TELEGRAM_STARS_WEBHOOK_SECRET | Sí en production | No | Sí | No | vacío | Si falta, la configuración productiva falla cerrada |
| PURCHASE_PROVIDER_ENDPOINT | Solo dev/test genérico | Sí | No | Sí | vacío | No sustituye al provider integrado en production |
| PURCHASE_PROVIDER_CREDENTIAL | Solo dev/test genérico | Sí | Sí | No | vacío | No habilita un provider productivo alternativo |

Regla absoluta: ningún secret se almacena en Git, Dockerfile, frontend o documentación.

El gate productivo actual solo acepta `PURCHASE_PROVIDER=telegram-stars` y exige `TELEGRAM_STARS_WEBHOOK_SECRET`. `loadConfig()` conserva el secreto únicamente para uso interno del proceso en una propiedad no enumerable; el server usa esa configuración validada y no vuelve a leer `process.env` dentro del adapter. La presencia del secreto no demuestra un webhook activo ni que el proveedor esté operativo: `/ready` sigue dependiendo del adapter y de los stores operativos.

## 3. Container contract

Startup actual:

node backend/src/server.mjs

Container port:

8787

Usuario:

node, no root.

La imagen contiene el backend y los módulos frontend que el backend reutiliza, incluido combat_core.js, reward_authority.js y player_meta_state.js.

La imagen no recibe secrets mediante ARG ni ENV en el Dockerfile. Los secrets llegan únicamente en runtime.

La referencia de despliegue debe ser una versión inmutable, idealmente:

ghcr.io/jonhararagi/baseball-waifus/basewarriors-authority@sha256:<digest>

No usar latest para rollback.

## 4. PostgreSQL contract

Production exige:

AUTHORITY_PERSISTENCE_PROVIDER=managed

AUTHORITY_PERSISTENCE_DSN=postgres://... o postgresql://...

El adapter actual usa pg con pool máximo 10, connection timeout de 5 segundos e idle timeout de 30 segundos.

Combat schema:

- bw_authority_schema
- bw_combat_matches
- bw_reward_ledger

Purchase schema:

- bw_purchase_state

Las inicializaciones se realizan durante startup. Un fallo de conexión o schema impide considerar el servicio operativo.

Schema version actual: 1.

Concurrencia:

- combat usa revision y bloqueo transaccional para detectar stale writes;
- reward ledger usa clave única y ON CONFLICT DO NOTHING;
- purchase persistence usa transacciones y FOR UPDATE.

TLS:

El código valida el protocolo PostgreSQL, pero no fuerza una opción TLS específica en el Pool. La instancia administrada debe proporcionar transporte seguro mediante TLS o red privada equivalente. Es un requisito del entorno externo.

Backup/restore:

EXTERNAL / REQUIRED. El repositorio no implementa backups gestionados de PostgreSQL.

Filesystem y memory:

- filesystem = development/integration;
- memory = development/test;
- ninguno cuenta como production persistence.

## 5. HTTPS / domain contract

El backend debe exponerse únicamente mediante HTTPS y certificado TLS válido.

La URL pública del backend no está fijada en el repositorio y no debe inventarse.

CORS:

ALLOWED_ORIGINS=<origen exacto de la WebApp productiva>

Nunca usar * en production.

Frontend:

window.BASEBALL_WAIFUS_API_BASE_URL

Vacío = API no configurada, compatible con local/QA.
URL configurada = autoridad server-side disponible.

## 6. Telegram webhook contract

Identidad del cliente:

x-telegram-init-data → server verification → telegram:<userId>

El backend no usa initDataUnsafe como autoridad.

Telegram Stars callback:

POST /v1/purchases/provider-callback

Header de autenticación del callback:

x-telegram-bot-api-secret-token

Secret runtime:

TELEGRAM_STARS_WEBHOOK_SECRET

El callback verifica secreto, usuario, moneda XTR, importe, transaction ID, invoice payload y coincidencia con la purchase persistida.

El webhook debe apuntar a la URL HTTPS real del backend. No se configura desde este repositorio.

El callback verificado es autoridad de compra; el cliente no puede convertir paid en recompensa por sí mismo.

## 7. Health / readiness

GET /health

PASS significa solamente que el proceso HTTP responde HTTP 200 con el documento básico de disponibilidad. No demuestra que production esté completamente lista.

GET /ready

PASS significa que las dependencias críticas están operativas, incluyendo:

- signing_key;
- authentication;
- persistence;
- purchase authority;
- purchase persistence;
- purchase provider cuando monetización esté activa;
- deployment_mode=production.

El endpoint no debe exponer private key, Bot Token, DSN ni webhook secret.

## 8. Authority smoke test

Solo después de disponer de un host real:

1. GET /health → PASS_REAL.
2. GET /ready → PASS_REAL.
3. Desde Telegram WebApp, enviar init data real.
4. GET /v1/combat/<test-match>/init → PASS_REAL.
5. POST /v1/combat/<test-match>/turn con una acción válida → PASS_REAL.
6. Intentar identidad incorrecta o payload económico manipulado → rechazo.
7. En un match de prueba controlado, comprobar SERVER_COMBAT_ATTESTATION_V1 y ECDSA_P256_SHA256.
8. Verificar la firma con webapp/js/reward_authority.js.
9. Confirmar que el reward solo se acepta después de attestation verificable.
10. Confirmar persistence tras reinicio.
11. Para compras, validar callback/claim/apply con un entorno y cuenta de prueba controlados. No realizar pagos de usuarios finales durante el smoke inicial.

No usar mocks, servidores locales ni container smoke como evidencia de producción.

## 9. Rollback

Registrar siempre:

- current image digest;
- previous known-good image digest;
- configuración asociada;
- compatibilidad de schema.

Rollback:

1. identificar digest actual;
2. seleccionar digest anterior conocido como sano;
3. revisar compatibilidad de DB;
4. desplegar imagen anterior por digest;
5. ejecutar /health y /ready;
6. ejecutar authority smoke controlado.

No usar latest.

El rollback operativo pertenece al hosting. No existe automatización vendor-specific en el repositorio.

## 10. Recovery

Container restart:

Los stores PostgreSQL se inicializan en startup. Las transacciones no confirmadas realizan rollback.

Database connection loss:

Operaciones que no pueden persistir fallan; readiness debe permanecer no operativa si el store no está inicializado.

Host restart:

Combat state, reward ledger y purchase state dependen del PostgreSQL gestionado, no del filesystem temporal del container.

Database restore:

Requiere backup administrado del proveedor. Después de restore:

- validar schema version;
- validar integridad;
- arrancar backend;
- comprobar /ready;
- ejecutar smoke authority;
- revisar purchase state antes de reactivar callbacks.

## 11. Security checks

Antes de activar:

- CORS productivo sin wildcard;
- secrets solo en secret manager/runtime;
- ningún secret en Docker build history/context;
- private signing key ausente de respuestas y JWK público;
- Bot Token, DSN y webhook secret fuera de logs/respuestas;
- initDataUnsafe fuera de la autoridad backend;
- amount/grant económico determinado server-side;
- reward identity conservando battle:<matchId>;
- imagen identificada por digest;
- PostgreSQL productivo gestionado y durable.

## 12. Final activation checklist

### Infrastructure

- [ ] Host Docker/OCI elegido.
- [ ] Registry disponible.
- [ ] PostgreSQL gestionado operativo.
- [ ] Backup/restore policy definida.
- [ ] DNS configurado.
- [ ] HTTPS/TLS activo.
- [ ] URL pública estable disponible.

### Secrets/config

- [ ] REWARD_SIGNING_PRIVATE_KEY
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
- [ ] ALLOWED_ORIGINS
- [ ] AUTHORITY_PERSISTENCE_PROVIDER=managed
- [ ] AUTHORITY_PERSISTENCE_DSN
- [ ] PURCHASE_PROVIDER=telegram-stars
- [ ] TELEGRAM_STARS_WEBHOOK_SECRET

### Image

- [ ] Build PASS.
- [ ] Imagen publicada realmente.
- [ ] Digest registrado.
- [ ] Container corre como node.
- [ ] No hay secrets en la imagen.

### Telegram

- [ ] Bot production seleccionado.
- [ ] Webhook HTTPS configurado.
- [ ] Secret token configurado.
- [ ] init data real verificada.
- [ ] Callback Stars real verificado.

### Runtime

- [ ] /health = PASS_REAL
- [ ] /ready = PASS_REAL
- [ ] combat init = PASS_REAL
- [ ] combat turn = PASS_REAL
- [ ] attestation = PASS_REAL
- [ ] client verification = PASS_REAL
- [ ] purchase authority = PASS_REAL

## Current state

IMPLEMENTED:
- Authority Backend;
- ManagedCombatStore;
- ManagedPurchaseStore;
- Telegram identity verification;
- Telegram Stars callback verification;
- ECDSA reward attestation;
- fail-closed production configuration;
- Docker contract;
- provider-neutral deployment workflow.

EXTERNAL:
- hosting provider;
- registry publication usable for deployment;
- production secret values;
- production PostgreSQL instance;
- DNS/TLS;
- public HTTPS endpoint;
- production Telegram webhook;
- real production smoke.

NOT VERIFIED:
- production deployment;
- production health/readiness;
- production authority smoke;
- production purchase smoke.

Therefore:

BONE-004 = OPEN / BLOCKED
BONE-011 = OPEN / IN PROGRESS
GLOBAL GATE = CERRADO

This runbook is a handoff artifact. It does not activate or imply production deployment.
