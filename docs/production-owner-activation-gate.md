# BaseWarriors: Meta-Strike · Production Owner Activation Gate

Estado: **BLOCKED / OWNER ACTION REQUIRED**  
Fecha de checkpoint: **2026-10-08**  
Repositorio: `jonhararagi/baseball-waifus`  
Branch: `main`  
Base SHA: `c25383b9e020eb5369cb196b3711523f67d2667d`

Este documento es el gate operativo del propietario para transformar el estado actual de infraestructura externa no accesible en una condición verificable de **PRODUCTION ACCESS READY**.

No crea infraestructura, no contiene secretos y no sustituye el runbook de despliegue.

Referencias operativas:

- `docs/production-deployment-runbook.md`
- `docs/production-infrastructure-decision.md`

## CURRENT BLOCKER

Estado actual confirmado en la documentación de infraestructura:

- **Primary provider:** Render, **SELECTED / NOT PROVISIONED**.
- **Fallback provider:** no seleccionado.
- **Managed PostgreSQL:** requerido, no provisionado/verificado.
- **GHCR image:** preparada como destino, digest de producción no verificado.
- **Production secrets:** requeridos externamente, no verificables desde la conexión GitHub disponible.
- **Domain / HTTPS:** no configurados.
- **Telegram production webhook:** no configurado.
- **Monitoring / backup:** no configurados.

La regla de continuidad es:

`SELECTED != CONFIGURED != DEPLOYED != VERIFIED`

Por protocolo, **AUTH-030 no debe repetirse como diagnóstico** y no se debe reintentar un deployment hasta que el propietario habilite el acceso operativo indicado en este gate.

## OWNER ACTION MATRIX

| ITEM | OWNER ACTION | WHERE IT MUST EXIST | HOW OBRERO WILL VERIFY IT | STATUS |
|---|---|---|---|---|
| Render account/workspace | Habilitar acceso operativo al workspace/proyecto de producción seleccionado | Render workspace | Sesión autorizada visible; workspace accesible y proyecto seleccionable | **REQUIRED / NOT VERIFIED** |
| Render production service | Crear/habilitar el servicio del Authority Backend | Render production | Servicio visible; configuración y deployment disponibles; logs accesibles | **REQUIRED / NOT PROVISIONED** |
| Managed PostgreSQL | Provisionar PostgreSQL gestionado y durable | Render/DB provider externo | Conexión real, schema init, readiness y restart durability | **REQUIRED / NOT PROVISIONED** |
| GHCR image | Publicar la imagen del backend con autorización efectiva | GitHub Container Registry | Imagen accesible por el deployment y digest verificable | **REQUIRED / NOT VERIFIED** |
| GHCR image digest | Fijar una referencia inmutable para producción | GHCR / deployment config | Digest `sha256:...` visible y utilizado por el service | **REQUIRED / NOT VERIFIED** |
| Production secrets | Configurar secretos runtime sin exponer valores | Render Secret Environment / secret manager | Presencia/utilización segura, sin imprimir valores | **REQUIRED / NOT VERIFIED** |
| ALLOWED_ORIGINS | Configurar el origen HTTPS exacto de la WebApp productiva | Render public environment/config | Valor presente, no wildcard y coincide con la WebApp real | **REQUIRED / NOT CONFIGURED** |
| Domain | Obtener hostname público estable para API | DNS / Render / domain registrar | URL real resolvible y asociada al backend | **REQUIRED / NOT CONFIGURED** |
| DNS | Publicar los registros necesarios | DNS provider | Resolución DNS verificable | **REQUIRED / NOT CONFIGURED** |
| HTTPS/TLS | Activar certificado TLS válido sobre el backend | Render / edge / domain | Endpoint HTTPS válido y certificado verificable | **REQUIRED / NOT CONFIGURED** |
| Telegram Bot | Seleccionar el bot de producción y disponer de su configuración operativa | Telegram / Bot management | Bot identificable y configuración de producción accesible sin revelar token | **REQUIRED / NOT VERIFIED** |
| Telegram webhook capability | Habilitar webhook HTTPS de producción | Telegram + backend HTTPS | Webhook real apuntando al endpoint HTTPS del backend | **REQUIRED / NOT CONFIGURED** |
| Monitoring | Habilitar observabilidad de `/health`, `/ready`, logs y restart | Hosting / monitoring platform | Métricas/logs/restart visibility visibles y utilizables | **REQUIRED / NOT CONFIGURED** |
| Backups | Activar backups de PostgreSQL y definir retención | Managed PostgreSQL provider | Política de backup visible y ejecución verificable | **REQUIRED / NOT CONFIGURED** |
| Restore procedure | Definir y probar procedimiento de recuperación | Managed PostgreSQL + owner ops | Evidencia de restore/control de recuperación | **REQUIRED / NOT VERIFIED** |
| Deployment permission | Otorgar permisos efectivos para build/publish/deploy | GitHub + Render | Obrero puede ejecutar las acciones autorizadas sin bypass | **REQUIRED / NOT VERIFIED** |

## REQUIRED SECRETS

Solo se documentan nombres y contratos. **Nunca guardar valores en el repositorio, issues, logs o este documento.**

| NAME | LOCATION | OWNER | REQUIRED | VERIFICATION METHOD |
|---|---|---|---:|---|
| `REWARD_SIGNING_PRIVATE_KEY` | Render secret/runtime environment | Owner infrastructure/security | Yes | Presencia utilizable; no se imprime el valor; startup/signing real lo consume |
| `TELEGRAM_BOT_TOKEN` | Render secret/runtime environment | Owner Telegram/backend | Yes | Presencia utilizable; Telegram auth real lo consume sin exponer el token |
| `AUTHORITY_PERSISTENCE_DSN` | Render secret/runtime environment | Owner database | Yes | Presencia utilizable; conexión PostgreSQL real y readiness |
| `AUTHORITY_PERSISTENCE_PROVIDER=managed` | Render public/runtime configuration | Owner infrastructure | Yes | Valor exacto `managed` visible en configuración no secreta |
| `ALLOWED_ORIGINS` | Render public/runtime configuration | Owner web/infrastructure | Yes | Origin HTTPS exacto, sin `*`, verificable contra la WebApp |
| `NODE_ENV=production` | Render public/runtime configuration | Owner infrastructure | Yes | Runtime reporta production; no fallback a development |

También forman parte del contrato productivo documentado en el runbook las variables de Telegram Stars/purchases cuando se active esa autoridad. No se deben reutilizar valores de prueba ni crear secretos ficticios.

## RENDER ACCESS GATE

La condición que desbloquea el próximo trabajo de infraestructura es:

**AUTHORIZED RENDER SESSION**

La sesión autorizada debe permitir al Obrero comprobar, sin recibir secretos en el chat:

1. workspace/proyecto accesible;
2. creación o edición del service disponible;
3. variables de entorno/configuración disponibles;
4. deployment/redeploy disponible;
5. logs disponibles;
6. URL pública del service visible.

El propietario no debe copiar credenciales, tokens ni claves privadas en el repositorio ni en mensajes de trabajo.

El siguiente deployment debe usar exclusivamente el proveedor ya decidido, **Render**, salvo una nueva decisión formal documentada por Cerebro.

## GHCR GATE

La identidad de imagen de producción debe ser inmutable:

`ghcr.io/jonhararagi/baseball-waifus/basewarriors-authority@sha256:<digest>`

Requisitos:

- **GHCR IMAGE = REQUIRED**
- **IMAGE DIGEST = REQUIRED**
- `latest` no es una referencia aceptable para rollback.

**AUTH-025 MUST NOT BE RETRIED** hasta que el propietario haya habilitado una sesión GitHub con autorización efectiva para publicar/usar la imagen. No cambiar `.github/workflows/backend-authority-image-publish.yml` como workaround.

## POSTGRES REQUIREMENT

El backend productivo debe recibir:

`AUTHORITY_PERSISTENCE_PROVIDER=managed`

`AUTHORITY_PERSISTENCE_DSN=<secret>`

La base requerida es **Managed PostgreSQL**.

La futura activación debe demostrar, en el entorno externo:

- conexión real;
- inicialización de schema;
- readiness;
- durabilidad tras restart;
- comportamiento de concurrencia;
- backups/restore según la política del proveedor.

No usar `PersistentCombatStore` filesystem ni `InMemoryCombatStore` como sustituto de producción.

No provisionar la database desde este gate.

## HTTPS REQUIREMENT

El propietario debe aportar:

- API domain estable;
- DNS funcional;
- HTTPS/TLS válido;
- `ALLOWED_ORIGINS` configurado al origen exacto de la WebApp;
- URL HTTPS final del backend;
- URL HTTPS para el webhook de Telegram.

No se debe inventar ningún hostname provisional como si fuera producción.

Hasta que la URL exista y responda externamente:

**HTTPS = NOT_CONFIGURED**

## TELEGRAM REQUIREMENT

La producción debe disponer de:

- bot de producción;
- `TELEGRAM_BOT_TOKEN` configurado externamente;
- webhook HTTPS;
- capacidad de validar `x-telegram-init-data` en el backend;
- para la autoridad de compras, webhook/callback Telegram Stars con su secret runtime correspondiente cuando esa ruta se active.

La autoridad backend no debe utilizar `initDataUnsafe` como prueba de identidad.

No configurar el webhook desde este gate.

No registrar tokens.

## MONITORING REQUIREMENT

Estado actual: **NOT_CONFIGURED**.

Como mínimo, el entorno debe permitir observar:

| CONTROL | REQUIRED STATUS | FUTURE VERIFICATION |
|---|---|---|
| `GET /health` | Required | PASS_REAL |
| `GET /ready` | Required | PASS_REAL |
| Container logs | Required | Visible without leaking secrets |
| Restart visibility | Required | Restart/recovery event observable |
| DB availability | Required | PostgreSQL health/readiness observable |
| Deployment status | Required | Running revision/image digest visible |

No marcar monitoring como VERIFIED por la existencia del código de health/readiness.

## BACKUP REQUIREMENT

Estado actual: **NOT_CONFIGURED**.

Managed PostgreSQL debe aportar:

- backup policy;
- retención;
- restore capability;
- responsable operativo;
- evidencia de recuperación antes de reactivar producción.

No afirmar que existen backups hasta que el proveedor los muestre y el propietario autorice la verificación.

## UNLOCK CONDITION

La única condición de desbloqueo es:

### PRODUCTION ACCESS READY

Solo puede declararse cuando el Obrero pueda verificar externamente, sin inferencias:

1. Render access;
2. Render production service;
3. GHCR publication/use access;
4. managed PostgreSQL;
5. production secrets/configuration;
6. domain + DNS + HTTPS;
7. Telegram production access;
8. deployment permission;
9. monitoring/restart visibility;
10. backup/restore readiness.

El gate no debe marcarse manualmente como READY.

Debe cambiar a READY únicamente como resultado de una futura verificación reproducible en el entorno externo.

## NEXT TASK

Cuando **PRODUCTION ACCESS READY** sea verificable, la siguiente única tarea autorizada es:

**BONE-011-AUTH-032 · PRODUCTION PROVISIONING AND DEPLOYMENT**

AUTH-032 debe:

- continuar desde el estado real de este gate;
- usar Render como proveedor ya seleccionado;
- usar GHCR con digest inmutable;
- conectar Managed PostgreSQL;
- configurar los secrets externamente;
- desplegar el Authority Backend;
- ejecutar health/readiness y smoke de producción;
- registrar evidencia REAL;
- no volver a repetir AUTH-028, AUTH-029, AUTH-030 ni AUTH-025 salvo cambio real de infraestructura.

Hasta entonces:

**PAUSE → SAVE STATE → REPORT**

No iniciar otra tarea de infraestructura por ausencia de acceso.

## CURRENT BONE / GATE STATE

- **BONE-004:** OPEN / BLOCKED
- **BONE-005:** CLOSED
- **BONE-006:** CLOSED
- **BONE-010:** CLOSED
- **BONE-011:** OPEN / IN PROGRESS
- **GLOBAL GATE:** CERRADO

La infraestructura productiva sigue siendo un requisito externo. Este documento no implica:

- deployment realizado;
- secrets configurados;
- PostgreSQL creado;
- imagen publicada;
- HTTPS activo;
- webhook configurado;
- monitoring activo;
- backups activos;
- production verified.

## TRACEABILITY

Este gate complementa, no reemplaza:

- `docs/production-infrastructure-decision.md` para la decisión de proveedor y topología;
- `docs/production-deployment-runbook.md` para el procedimiento técnico;
- los registros AUTH-025 y AUTH-030 para bloqueos previos ya documentados.

La regla operativa es:

**VERIFICAR REALIDAD > FABRICAR PROGRESO**
