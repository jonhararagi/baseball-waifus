# Reward Authority Backend v1

**Estado documental:** DIAGNOSTIC / CONTRACT BOUNDARY  
**Production backend:** NOT IMPLEMENTED  
**Production secret storage:** ABSENT  
**Provider selection:** NOT SELECTED

## 1. Current state

The repository currently has a static WebApp and a Godot gameplay codebase, plus a local web host.

Observed infrastructure:

- GitHub Pages is the current WebApp/static deployment boundary through `.github/workflows/deploy-pages.yml`.
- `webapp/js/api.js` contains a client API contract for:
  - `GET /v1/combat/:matchId/init`
  - `POST /v1/combat/:matchId/turn`
- `webapp/js/reward_authority.js` contains the client-side verifier for `SERVER_COMBAT_ATTESTATION_V1`.
- No tracked `backend/`, `server/`, `functions/` or `api/` implementation was found.
- No backend deployment workflow was found.
- No tracked private-key material, `.pem`, `.key`, `.p12`, `.pfx`, `.jwk` or `.env` file was found.
- `tools/web_host` is a frontend host/tooling package, not an economic API.
- The repository therefore does not currently contain a production reward-attestation issuer.

## 2. Why GitHub Pages is insufficient

GitHub Pages is used here as a static frontend host. The current deployment workflow builds the `site/` directory and publishes it through GitHub Pages.

A production reward authority needs server-side capabilities that a static host does not provide:

- authenticated request handling;
- authoritative combat-state storage;
- server-side result calculation;
- private ECDSA signing key protection;
- replay/nonce tracking;
- persistent reward idempotency;
- auditable economic transactions.

The WebApp must remain distributable from GitHub Pages. The reward authority must be a separate HTTPS backend/API boundary.

## 3. Authority boundaries

### A. Gameplay Authority

Current state:

- The repository contains executable local gameplay authority in the existing WebApp/Godot systems.
- `webapp/js/api.js` defines a server combat contract, but no server implementation is present.
- Therefore **server-authoritative gameplay is not implemented**.

Future production responsibility:

- own authoritative combat state;
- own turn ordering;
- validate player actions against that state;
- calculate combat result;
- decide terminal outcome;
- create the authoritative result input for attestation.

The client must not be allowed to submit an arbitrary terminal result and receive a valid attestation.

### B. Reward Authority

Current state:

- `webapp/js/reward_authority.js` verifies the server attestation.
- `webapp/js/reward_pipeline.js` requires a verified authority proof before the economic reward path can execute.
- The repository has no production signer.

Therefore **client verification exists, production reward issuance does not**.

Future production responsibility:

- determine whether a terminal result is reward-eligible;
- assign reward identity;
- issue an authoritative attestation;
- enforce idempotency and replay policy;
- provide the canonical reward authorization to the client or a server-side grant path.

### C. Persistence Authority

Current state:

- `PlayerMetaAuthority` exists as a client-side state authority.
- `PlayerMetaPersistenceAdapter` currently persists through browser storage.
- BONE-005 explicitly tracks dual local/Telegram persistence and is still OPEN.
- No authoritative backend persistence implementation exists.

Therefore **local persistence exists, authoritative persistent backend storage does not**.

Future production responsibility:

- durable player meta;
- reward ledger;
- inventory/currency;
- transaction/audit identity;
- concurrency-safe writes;
- migration/version handling.

## 4. Current SERVER_COMBAT_ATTESTATION_V1 contract

The verified client contract is:

- version: `SERVER_COMBAT_ATTESTATION_V1`
- algorithm: `ECDSA_P256_SHA256`
- payload fields:
  - `version`
  - `match_id`
  - `player_id`
  - `turn_id`
  - `outcome`
  - `result`
  - `nonce`

Canonicalization is JSON serialization of the normalized payload in this order:

`version, match_id, player_id, turn_id, outcome, result, nonce`

The current client verifier additionally checks:

- attestation version;
- signature algorithm;
- match binding;
- player binding;
- turn binding;
- outcome binding;
- result binding;
- nonce binding;
- ECDSA P-256 / SHA-256 signature validity.

The current contract is suitable as the verification boundary. This task does not change it.

## 5. Backend responsibilities

The minimum production architecture needs an authoritative combat service in front of the reward signer.

Contract boundary:

`POST /v1/combat/:matchId/turn`

Expected high-level flow:

`authenticated player`
→ `load authoritative match state`
→ `validate action + turn`
→ `calculate next state/result`
→ `persist authoritative combat state`
→ `if terminal + reward eligible: create SERVER_COMBAT_ATTESTATION_V1`
→ `return TurnResultDTO + reward_attestation`

The server must not sign a result merely because the client supplied the result.

Required server responsibilities:

- maintain authoritative match state;
- validate `matchId` ownership;
- validate `turnId`;
- generate and retain server-side nonce/nonce identity;
- calculate result from authoritative state;
- prevent duplicate turn submission;
- issue attestation only for server-calculated state;
- make reward identity idempotent;
- write an auditable ledger entry.

Open design dependency:

The repository currently has a `TurnResultDTO` contract but not a server combat implementation. A production backend therefore requires an authoritative combat service before the attestation issuer can be trusted as an economic authority.

## 6. Secret management requirements

The ECDSA private signing key must never exist in:

- `assets/`;
- `data/`;
- Git history;
- HTML;
- client JavaScript;
- `localStorage`;
- Telegram CloudStorage.

Production placement requirement:

**A managed secret/key store owned by the future backend deployment environment, outside this repository.**

No provider is selected in this task.

The repository may contain only the public verification key material needed by a client contract or a securely delivered public configuration. The private key must remain server-side.

## 7. Telegram identity boundary

The current client API sends:

`x-telegram-init-data`

when Telegram WebApp init data is available. `api.js` also exposes `initDataUnsafe` for client UX/identity use.

For production authentication, `initDataUnsafe` must not be treated as cryptographic proof.

Future backend responsibility:

1. receive the raw Telegram init data from `x-telegram-init-data`;
2. validate the Telegram Mini App authentication data server-side using Telegram's documented verification procedure;
3. derive the trusted Telegram user identity on the server;
4. bind the authenticated identity to `player_id`;
5. reject player identifiers supplied by the client when they conflict with the authenticated identity.

Current status:

**No server-side Telegram identity verification is implemented in this repository.**

## 8. Persistence dependency with BONE-005

BONE-004 reward authority depends on BONE-005 because production reward idempotency cannot safely rely on browser-local state.

Required server persistence for reward authority:

- authoritative reward identity, such as `battle:<matchId>`;
- attestation/reward transaction identity;
- player binding;
- match binding;
- nonce/replay status;
- reward grant status;
- audit timestamps and outcome metadata.

BONE-005 must define the durable Player Meta/persistence authority and its migration/concurrency rules.

Boundary:

`BONE-004 reward authority`
→ requires durable reward idempotency
→ depends on `BONE-005 persistence authority`

This task does not migrate Player Meta.

## 9. Monetization dependency with BONE-011

BONE-011 is a separate economic authority boundary:

- BONE-004 = combat-result reward authority;
- BONE-011 = paid transaction / monetization authority.

Shared interfaces include:

- transaction identity;
- idempotency;
- authenticated player identity;
- protected server secrets;
- durable audit trail;
- persistent transaction/ledger storage.

BONE-011 is not implemented or closed by this task.

## 10. Deployment boundary

Current boundary:

`GitHub Pages = STATIC FRONTEND HOST`

Future boundary:

`HTTPS BACKEND / SERVERLESS / MANAGED API = AUTHORITY SERVICES`

The existing GitHub Pages deployment remains unchanged.

The future backend must expose a separate HTTPS base URL and must not depend on the browser as a server.

### Infrastructure categories

| Category | Contract fit | Secret storage | Persistence | Local development | CI deployment |
|---|---|---|---|---|---|
| Serverless Functions | suitable | platform-managed secret/key facility required | requires managed datastore or external DB | usually straightforward | usually straightforward |
| Containerized API | suitable | container/orchestrator secret facility required | managed DB or attached durable service required | strong parity with production | requires container deployment path |
| Managed application backend | suitable | platform-managed secret/key facility required | provider-managed datastore or external DB | depends on platform tooling | depends on platform tooling |

Technical decision status:

**Provider NOT SELECTED.**

The repository currently needs a provider-neutral HTTPS backend boundary with secret storage and durable persistence. Selecting a specific vendor belongs to the infrastructure implementation task, not this diagnostic.

## 11. Local development contract

Local development must be able to exercise the backend boundary without production secrets.

Minimum local contract:

- local HTTPS-capable or equivalent development API;
- deterministic test identities;
- generated ephemeral ECDSA P-256 keypair for tests only;
- in-memory or disposable datastore for contract tests;
- no production reward grants;
- no production credentials;
- deterministic replay/idempotency fixtures.

The local environment may emulate server infrastructure, but it must never be documented as production.

## 12. Production readiness checklist

### Backend
- [ ] authoritative combat-state service exists;
- [ ] `POST /v1/combat/:matchId/turn` implemented;
- [ ] server computes result from authoritative state;
- [ ] server issues `SERVER_COMBAT_ATTESTATION_V1`;
- [ ] server-side nonce/replay protection exists.

### Identity
- [ ] Telegram init data verified server-side;
- [ ] trusted server player identity derived from verified authentication;
- [ ] player binding enforced.

### Security
- [ ] ECDSA private key is outside repository and client;
- [ ] secret/key management exists;
- [ ] key rotation procedure exists;
- [ ] client only receives public verification material.

### Persistence
- [ ] durable reward ledger exists;
- [ ] reward identity is idempotent;
- [ ] concurrent duplicate grants are safe;
- [ ] audit trail exists;
- [ ] BONE-005 persistence authority is compatible with this boundary.

### Operations
- [ ] separate backend HTTPS origin;
- [ ] health/readiness checks;
- [ ] structured server logs;
- [ ] deployment workflow;
- [ ] rollback/version strategy;
- [ ] monitoring/error reporting.

### Commercial boundary
- [ ] no localStorage/CloudStorage grant authority;
- [ ] no browser-only signer;
- [ ] no client-provided result accepted as authoritative;
- [ ] BONE-011 remains separately controlled.

## 13. Explicit non-goals

This task does not:

- implement a production backend;
- deploy an API;
- select a vendor;
- create a production database;
- create or store a production private signing key;
- implement Telegram authentication;
- migrate Player Meta;
- close BONE-004;
- implement BONE-005;
- implement BONE-011;
- modify combat gameplay;
- modify rewards or balance;
- modify GitHub Pages deployment logic.

## Production conclusion

The repository currently contains a **client-side reward authority verifier and a client API contract, but no production backend authority**.

The next implementation must establish a real server boundary where gameplay state, result calculation, signing, identity binding, replay protection and durable reward idempotency are server-side responsibilities.

PRODUCTION BACKEND STATUS:
NOT IMPLEMENTED


## BONE-004-PROD-AUTH-002 · Current implementation status

The provider-neutral backend described by this document now exists under `backend/`.

Implemented locally:

- Node.js ESM HTTP server with native `node:http`;
- authenticated `GET /v1/combat/:matchId/init`;
- authenticated `POST /v1/combat/:matchId/turn`;
- server-side combat authority reusing `webapp/js/combat_core.js`;
- server-generated match nonce;
- server-owned turn sequence;
- client-result rejection;
- SERVER_COMBAT_ATTESTATION_V1 signer using ECDSA P-256 / SHA-256 / IEEE P1363;
- production Telegram init-data verification boundary;
- fail-closed `/ready` when persistence is not configured;
- client compatibility proof against `webapp/js/reward_authority.js`.

The current store is `InMemoryCombatStore` and is development/test only.

Production deployment remains unconfigured. BONE-005 must provide the durable persistence boundary before BONE-004 can close.

PRODUCTION BACKEND STATUS:

IMPLEMENTED LOCALLY / NOT DEPLOYED


## Current implementation checkpoint · 2026-10-03

The repository now contains the first provider-neutral backend authority implementation created for BONE-004 and the durable persistence implementation completed by BONE-005.

### Durable persistence

backend/src/persistent_combat_store.mjs provides a filesystem-backed schema-versioned store containing:

- authoritative combat matches;
- durable rewardLedger;
- atomic temp-file + fsync + rename writes;
- validation and fail-closed recovery;
- same-document match/reward persistence.

The CombatService contract remains provider-neutral and can continue using InMemoryCombatStore for fast tests.

### Client persistence boundary

PlayerMetaAuthority is the modern client state authority.

Legacy Gacha/local/Telegram data is migration/cache input only. Existing Player Meta wins over a later legacy snapshot. Cloud corruption does not silently fall back to stale local data.

### Production boundary

This is still NOT A PRODUCTION DEPLOYMENT.

The durable filesystem adapter is a development/integration provider. BONE-004 remains blocked until production secrets, Telegram bot configuration, deployment and production persistence operations are configured outside this repository.


## Production readiness matrix · BONE-004-PROD-AUTH-003

| Component | Status |
|---|---|
| Server authority | PASS |
| Telegram auth code | PASS |
| ECDSA signer code | PASS |
| Durable development persistence | PASS |
| Concurrency | PASS |
| Container | PASS |
| Production env contract | PASS |
| Secret boundary | PASS |
| Production database provider | NOT CONFIGURED |
| HTTPS deployment | NOT CONFIGURED |
| Production secrets | NOT CONFIGURED |
| Production smoke test | NOT RUN |

IMPLEMENTED means the repository contains and validates the code/contract.
CONFIGURED means external runtime secrets and provider settings exist. They do not exist here.
DEPLOYED means a real HTTPS backend exists and passes an authenticated smoke test. This has not occurred.

The manual `.github/workflows/backend-authority-deploy.yml` is a provider-neutral deployment contract, not deployment evidence.

Earlier BONE-004 diagnostics that state the production backend was absent are historical records. The repository now contains the local/server authority implementation and deployment boundary, while production infrastructure remains unconfigured.



## Container smoke validation · 2026-10-04

GitHub Actions Run `37175529956` on HEAD `4f5155e683c7ba593e17da1ac1ca977132b132b4` passed backend syntax, all 27 backend tests, container image build and container health smoke in test mode.

The deployment contract remains provider-neutral and is not evidence of external production deployment.
