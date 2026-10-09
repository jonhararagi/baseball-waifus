# BaseWarriors Authority Backend

Provider-neutral Node.js ESM backend for the BONE-004 authority boundary.

## Production configuration contract

Required runtime configuration:
- NODE_ENV=production
- PORT
- REWARD_SIGNING_PRIVATE_KEY
- TELEGRAM_BOT_TOKEN
- TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
- ALLOWED_ORIGINS
- AUTHORITY_PERSISTENCE_PROVIDER=managed
- AUTHORITY_PERSISTENCE_DSN
- PURCHASE_PROVIDER=telegram-stars
- TELEGRAM_STARS_WEBHOOK_SECRET

Production rejects wildcard CORS, never falls back to memory/filesystem, and fails closed when the managed database cannot initialize. The production config gate also requires `PURCHASE_PROVIDER=telegram-stars` and an externally supplied `TELEGRAM_STARS_WEBHOOK_SECRET`; missing or unsupported purchase provider configuration prevents startup.

The repository includes provider-neutral PostgreSQL-compatible managed adapters; external runtime configuration still supplies the DSN and credentials.

## Persistence boundary

src/persistence_provider.mjs isolates provider selection:
- memory: development/test
- filesystem: development/integration
- managed: production contract only, no provider implementation bundled

## Health/readiness

/health is unauthenticated and reports only basic availability.
/ready reports only boolean signing_key, authentication, persistence, deployment_mode and deployment. It never returns secret values.

## Container

Build with:
docker build --ignorefile backend/.dockerignore -f backend/Dockerfile .

The image copies only backend/src, backend/package.json, webapp/js/combat_core.js and webapp/js/reward_authority.js. Secrets arrive only at runtime.

## Deployment workflow

.github/workflows/backend-authority-deploy.yml is workflow_dispatch only. It verifies backend tests, required external production configuration, container build and basic image secret safety. It does not deploy to any cloud provider because none is configured.

## Frontend API boundary

webapp/js/api.js reads window.BASEBALL_WAIFUS_API_BASE_URL:
- empty: API not configured, local demo/QA can continue;
- configured: server authority path is available.

No production URL is hardcoded by this task.

## Status

IMPLEMENTED: backend authority, Telegram server auth, ECDSA attestation, durable development persistence, concurrency, production config contract, Docker and deployment contract.
CONFIGURED: no external production secrets/provider in repository.
DEPLOYED: no.

BONE-004 remains BLOCKED until an external environment provides secrets, managed persistence, HTTPS deployment and a real smoke test.


## Payment provider adapter

`src/purchase_provider_adapter.mjs` defines the provider-neutral boundary for a future real payment integration.

States:
- `NOT_CONFIGURED`
- `CONFIGURED_UNAVAILABLE`
- `READY`

Provider selection and credential presence are external configuration only. No real provider credentials are stored in the repository. Production currently accepts only the integrated `telegram-stars` callback contract; the generic provider adapter remains unavailable for arbitrary provider names in production.

Production remains NOT CONFIGURED until a real provider adapter, production credentials, durable production operations and external deployment are supplied.


## Telegram Stars invoice authority

`POST /v1/purchases/:purchaseId/invoice` creates or reuses a Telegram Stars invoice for an authenticated player's PENDING purchase.

The server owns:
- purchase ownership;
- product and amount;
- currency;
- deterministic invoice payload.

The endpoint never authorizes or claims a purchase. A verified `successful_payment` callback remains the authority transition.

Telegram Bot Token is injected only through external runtime configuration. No token is stored in the repository or returned by the API.

The repository contains no production Telegram credentials and no deployed provider. Tests inject a simulated HTTP provider.


## Server-side purchase grant application

After an authorized purchase is claimed, `POST /v1/purchases/:purchaseId/apply` applies the persisted purchase grant through the existing `PlayerMetaAuthority`.

The endpoint accepts no client economic authority fields. The purchase record supplies the grant amount and grant kind. The operation records `purchase-grant:<purchaseId>` in Player Meta's reward ledger and writes the corresponding fulfillment in the same durable PurchaseStore document.

Repeated application returns `GRANT_ALREADY_APPLIED` and does not duplicate the balance.


## Telegram Stars production configuration gate

`loadConfig(env)` captures `TELEGRAM_STARS_WEBHOOK_SECRET` for the in-process adapter through a non-enumerable property. `createAuthorityServer()` consumes that validated configuration and does not independently reread `process.env`.

The production workflow requires these externally managed settings without echoing their values:

- `PURCHASE_PROVIDER=telegram-stars`
- `TELEGRAM_STARS_WEBHOOK_SECRET`

Presence alone does not establish that Telegram callbacks are arriving or that purchases are operational. `/ready` still requires the provider adapter to be `READY` and managed purchase persistence to be operational. No payments or production webhook were activated by AUTH-037.
