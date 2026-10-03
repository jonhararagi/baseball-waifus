# BaseWarriors Authority Backend

Provider-neutral Node.js ESM backend for the BONE-004 production authority boundary.

## Purpose

This service separates the static WebApp from the server authority required for authenticated combat state, server-calculated results and SERVER_COMBAT_ATTESTATION_V1.

The client requests actions. The server owns combat state and computes the result. Only the server-side signer can emit a reward attestation.

## Endpoints

- GET /health
- GET /ready
- GET /v1/combat/:matchId/init
- POST /v1/combat/:matchId/turn

The current authoritative combat boundary supports BAT. STEAL remains outside this first backend implementation because no compatible server-side steal resolver exists in combat_core.js.

## Local development

Requirements: Node.js 20+.

Run tests:

    cd backend
    npm test

For a manually started local process, provide an externally managed P-256 private key through REWARD_SIGNING_PRIVATE_KEY. The repository must not contain that key.

In tests, the suite generates an ephemeral P-256 keypair in memory. The x-test-player-id bypass exists only when NODE_ENV=test.

## Production configuration

Required production configuration includes:

- REWARD_SIGNING_PRIVATE_KEY
- TELEGRAM_BOT_TOKEN
- ALLOWED_ORIGINS
- durable persistence replacing InMemoryCombatStore

Production startup refuses to start without REWARD_SIGNING_PRIVATE_KEY.

The /ready endpoint remains false until signing, authentication and durable persistence are configured.

## Security boundary

Production requests use x-telegram-init-data. The backend verifies Telegram WebApp init data server-side and derives playerId from the verified Telegram user id.

initDataUnsafe is never used by the backend as authentication.

Client result fields are rejected. Match ownership and turn sequencing are server-owned. A server-generated match nonce is bound into SERVER_COMBAT_ATTESTATION_V1.

The private signing key is never returned or stored in the repository. Test keys are ephemeral.

## Persistence boundary

InMemoryCombatStore is development/test only. Its reward ledger is not durable and does not make BONE-005 complete.

The store interface is isolated behind createMatch, loadMatch and saveMatch.

## Not production-ready

- durable persistence / reward ledger;
- production secret/key manager configuration;
- deployed backend origin;
- production deployment/operations;
- client-side turn-id/idempotency integration.

PRODUCTION BACKEND STATUS

IMPLEMENTED LOCALLY / NOT DEPLOYED
