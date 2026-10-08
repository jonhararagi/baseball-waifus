# BaseWarriors: Meta-Strike · Production Infrastructure Decision

Estado: SELECTED / NOT PROVISIONED  
Fecha de decisión: 2026-10-08  
Fuente: project decision recorded by AUTH-029

## 1. Decisión oficial

| Elemento | Decisión | Estado |
|---|---|---|
| PRIMARY HOSTING PROVIDER | Render | SELECTED / NOT PROVISIONED |
| FALLBACK PROVIDER | NOT SELECTED | NONE |
| DATABASE | Managed PostgreSQL | REQUIRED / NOT PROVISIONED |
| REGISTRY | GHCR | PREPARED / IMAGE NOT VERIFIED |
| DEPLOYMENT MODEL | Docker / OCI container | IMPLEMENTED / NOT DEPLOYED |
| IMAGE IDENTITY | ghcr.io/jonhararagi/baseball-waifus/basewarriors-authority@sha256:<digest> | DIGEST NOT VERIFIED |
| DOMAIN | NOT_CONFIGURED | PENDING PROVISIONING |
| HTTPS | REQUIRED | PENDING PROVISIONING |
| Telegram webhook | EXTERNAL / NOT_CONFIGURED | PENDING PROVISIONING |

Render is the **primary project choice** for the future production hosting path. This document does not claim that a Render account, service, database, domain, billing plan or deployment already exists.

## 2. State semantics

The repository distinguishes:

`SELECTED != CONFIGURED`  
`CONFIGURED != DEPLOYED`  
`DEPLOYED != VERIFIED`

Therefore:

- SELECTED means the project has chosen the provider.
- CONFIGURED means the external resources and runtime settings exist.
- DEPLOYED means the immutable image is running in the external environment.
- VERIFIED means production health, readiness and authority smoke evidence exist.

Current state:

`SELECTED = YES`  
`CONFIGURED = NO`  
`DEPLOYED = NO`  
`VERIFIED = NO`

## 3. Target architecture

The approved production topology is:

```
Web / PWA
   |
 HTTPS
   |
Render production service
   |
BaseWarriors Authority container
   |
Managed PostgreSQL
```

Image path:

```
GHCR
  |
immutable image digest
  |
Render production service
```

Telegram path:

```
Telegram
  |
HTTPS webhook
  |
Authority Backend
```

This is an infrastructure handoff target. No provider-specific deployment code is introduced by AUTH-029.

## 4. Provider capability contract

The future Render deployment must provide an environment compatible with:

- Docker / OCI container execution;
- HTTPS with a stable public endpoint;
- runtime secret/environment injection;
- restart/redeploy support;
- PostgreSQL network connectivity;
- health checks;
- access to the immutable GHCR image.

These capabilities are acceptance requirements for provisioning. AUTH-029 does not mark them as externally verified.

## 5. Runtime configuration

Production runtime must receive:

| Variable | Type | Required | Secret |
|---|---|---:|---:|
| NODE_ENV | PUBLIC CONFIG | Yes | No |
| PORT | PUBLIC CONFIG | Yes | No |
| REWARD_SIGNING_PRIVATE_KEY | SECRET | Yes | Yes |
| TELEGRAM_BOT_TOKEN | SECRET | Yes | Yes |
| TELEGRAM_INIT_DATA_MAX_AGE_SECONDS | PUBLIC CONFIG | Yes | No |
| ALLOWED_ORIGINS | PUBLIC CONFIG | Yes | No |
| AUTHORITY_PERSISTENCE_PROVIDER | PUBLIC CONFIG | Yes | No |
| AUTHORITY_PERSISTENCE_DSN | SECRET | Yes | Yes |

Required production persistence value:

`AUTHORITY_PERSISTENCE_PROVIDER=managed`

No real values are stored in this repository.

## 6. Domain / HTTPS

`DOMAIN = NOT_CONFIGURED`

`HTTPS = PENDING PROVISIONING`

The provisioning operator must obtain:

- a stable public HTTPS hostname;
- valid TLS;
- the exact WebApp origin for `ALLOWED_ORIGINS`;
- the final HTTPS backend URL for the frontend runtime configuration;
- the HTTPS Telegram webhook URL.

No hostname is invented in AUTH-029.

## 7. Database

Production persistence is:

`Managed PostgreSQL = REQUIRED`

Runtime contract:

```
AUTHORITY_PERSISTENCE_PROVIDER=managed
AUTHORITY_PERSISTENCE_DSN=<external secret>
```

No database is created by this checkpoint.

`ManagedCombatStore` and `ManagedPurchaseStore` are not modified.

Production readiness remains false until the managed persistence implementation is connected and externally provisioned according to the repository's existing store contract.

## 8. Image

Target immutable identity:

```
ghcr.io/jonhararagi/baseball-waifus/basewarriors-authority@sha256:<digest>
```

`latest` is not an accepted production rollback reference.

Current image status:

`NOT_VERIFIED`

AUTH-029 does not retry or execute the blocked AUTH-025 image publication.

## 9. Telegram

Production bot:

`EXTERNAL / NOT_CONFIGURED`

Webhook:

`EXTERNAL / NOT_CONFIGURED`

HTTPS:

`REQUIRED`

No Telegram Bot Token, webhook secret or Telegram account configuration is stored here.

## 10. Monitoring / operations

Required production observability:

- `/health`;
- `/ready`;
- container logs;
- restart visibility;
- database availability;
- deployment status.

Current status:

`MONITORING = NOT_CONFIGURED`

No managed monitoring service is claimed as active.

## 11. Backups / recovery

`Managed PostgreSQL backups = EXTERNAL / REQUIRED`

`Restore = EXTERNAL / REQUIRED`

`Retention = NOT_CONFIGURED`

The repository does not invent or claim a provider backup policy.

## 12. Rollback contract

Rollback must retain:

- current image digest;
- previous known-good image digest;
- associated configuration version;
- database schema compatibility;
- recovery evidence.

Do not use `latest`.

No rollback is executed by AUTH-029.

## 13. AUTH-030 provisioning checklist

All boxes remain intentionally unchecked:

- [ ] Render account/project available
- [ ] production service created
- [ ] registry access available
- [ ] immutable image available
- [ ] managed PostgreSQL created
- [ ] database DSN available
- [ ] GitHub/host secrets configured
- [ ] reward signing key configured
- [ ] Telegram Bot Token configured
- [ ] ALLOWED_ORIGINS configured
- [ ] domain configured
- [ ] HTTPS active
- [ ] Telegram webhook configured
- [ ] health endpoint reachable
- [ ] readiness endpoint reachable
- [ ] authority smoke test

## 14. Consistency status

Provider decision: PASS_STATIC  
Deployment model: PASS_STATIC  
Database contract: PASS_STATIC  
Configuration contract: PASS_STATIC  
Docker/OCI contract: PASS_STATIC  
Immutable image contract: PASS_STATIC  
Runbook consistency: PASS_STATIC

No external provisioning was performed.

## 15. Bone state at decision time

- BONE-004 = OPEN / BLOCKED
- BONE-005 = CLOSED
- BONE-006 = CLOSED
- BONE-010 = CLOSED
- BONE-011 = OPEN / IN PROGRESS
- GLOBAL GATE = CERRADO

## 16. Next handoff

`BONE-011-AUTH-030 · PRODUCTION INFRASTRUCTURE PROVISIONING`

AUTH-030 is the first checkpoint authorized to act on real external infrastructure.