import http from "node:http";
import { URL } from "node:url";
import { loadConfig, validateProductionConfig } from "./config.mjs";
import { authenticateRequest, authenticationConfigured } from "./auth.mjs";
import { createAttestationSigner } from "./attestation_signer.mjs";
import { CombatService } from "./combat_service.mjs";
import { createPersistenceStore, persistenceReadiness } from "./persistence_provider.mjs";
import { createPurchaseStore } from "./purchase_persistence_provider.mjs";
import {
  createPurchaseProviderAdapterFromConfig
} from "./purchase_provider_adapter.mjs";
import {
  createTelegramStarsProviderAdapterFromConfig
} from "./telegram_stars_adapter.mjs";
import { evaluatePurchaseReadiness, purchaseReadinessSatisfied } from "./purchase_readiness.mjs";
import { PurchaseAuthority, PURCHASE_AUTHORITY_RESULT } from "./purchase_authority.mjs";
import { AuthorityError, isAuthorityError } from "./errors.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "connection": "close"
};

function jsonResponse(res, status, payload, origin = "null") {
  res.writeHead(status, {
    ...JSON_HEADERS,
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type, x-telegram-init-data, x-test-player-id",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function corsOrigin(request, config) {
  const requested = request.headers?.origin || "";
  if (config.allowedOrigins.includes("*") && !config.production) return "*";
  if (!requested) return config.production ? "null" : "*";
  return config.allowedOrigins.includes(requested) ? requested : "null";
}

async function readJson(request, limitBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limitBytes) throw new AuthorityError(413, "BODY_TOO_LARGE", "Request body exceeds the configured limit");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {
    throw new AuthorityError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

async function readRawJson(request, limitBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limitBytes) throw new AuthorityError(413, "BODY_TOO_LARGE", "Request body exceeds the configured limit");
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);
  let body = {};
  if (rawBody.length > 0) {
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new AuthorityError(400, "INVALID_JSON", "Request body must be valid JSON");
    }
  }
  return Object.freeze({ rawBody, body });
}

function cloneHeaders(request) {
  const source = request?.headers || {};
  const entries = Object.entries(source).map(([name, value]) => [
    String(name).toLowerCase(),
    Array.isArray(value) ? Object.freeze([...value]) : value
  ]);
  return Object.freeze(Object.fromEntries(entries));
}

function readiness(config, signer, store, purchaseAuthority, purchaseStore, purchaseProviderAdapter) {
  const persistence = persistenceReadiness(config, store);
  const purchase = evaluatePurchaseReadiness({
    config,
    purchaseAuthority,
    purchaseStore,
    purchaseProviderAdapter
  });
  return {
    ready: Boolean(
      signer
      && authenticationConfigured(config)
      && persistence
      && purchaseReadinessSatisfied(purchase)
    ),
    signing_key: Boolean(signer),
    authentication: authenticationConfigured(config),
    persistence,
    ...purchase,
    deployment_mode: config.deploymentMode,
    deployment: false
  };
}

function purchaseStatusCode(status) {
  if (
    status === PURCHASE_AUTHORITY_RESULT.AUTHORIZED_GRANT
    || status === PURCHASE_AUTHORITY_RESULT.DUPLICATE_NO_OP
    || status === PURCHASE_AUTHORITY_RESULT.GRANT_CLAIMED
    || status === PURCHASE_AUTHORITY_RESULT.GRANT_ALREADY_CLAIMED
  ) return 200;
  if (status === PURCHASE_AUTHORITY_RESULT.UNAVAILABLE || status === PURCHASE_AUTHORITY_RESULT.BLOCKED) return 503;
  return 409;
}

export function createAuthorityServer({
  config = loadConfig(),
  store = null,
  signer = null,
  purchaseStore = null,
  purchaseVerifier = null,
  purchaseAuthority = null,
  purchaseProviderAdapter = null
} = {}) {
  const activeStore = store || createPersistenceStore(config);
  const activeSigner = signer || (config.rewardSigningPrivateKeyPem ? createAttestationSigner({ privateKeyPem: config.rewardSigningPrivateKeyPem }) : null);
  const service = new CombatService({ store: activeStore, signer: activeSigner });
  const activePurchaseStore = purchaseStore || createPurchaseStore(config);
  const activePurchaseAdapter = purchaseProviderAdapter
    || (purchaseVerifier ? null : (
      config.purchaseProvider === "telegram-stars"
        ? createTelegramStarsProviderAdapterFromConfig(config, { purchaseStore: activePurchaseStore })
        : createPurchaseProviderAdapterFromConfig(config)
    ));
  const activePurchaseVerifier = purchaseVerifier || activePurchaseAdapter?.verifier;
  const activePurchaseAuthority = purchaseAuthority || new PurchaseAuthority({
    store: activePurchaseStore,
    providerVerifier: activePurchaseVerifier,
    production: config.production
  });

  const server = http.createServer(async (request, response) => {
    const origin = corsOrigin(request, config);
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "content-type, x-telegram-init-data, x-test-player-id",
        "access-control-allow-methods": "GET,POST,OPTIONS"
      });
      response.end();
      return;
    }
    try {
      const url = new URL(request.url || "/", "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse(response, 200, { ok: true, service: "basewarriors-authority" }, origin);
      }
      if (request.method === "GET" && url.pathname === "/ready") {
        const status = readiness(
          config,
          activeSigner,
          activeStore,
          activePurchaseAuthority,
          activePurchaseStore,
          activePurchaseAdapter
        );
        return jsonResponse(response, status.ready ? 200 : 503, status, origin);
      }
      const initMatch = url.pathname.match(new RegExp("^/v1/combat/([^/]+)/init$"));
      if (request.method === "GET" && initMatch) {
        const auth = await authenticateRequest(request, config);
        return jsonResponse(response, 200, await service.init(decodeURIComponent(initMatch[1]), auth.playerId), origin);
      }
      const turnMatch = url.pathname.match(new RegExp("^/v1/combat/([^/]+)/turn$"));
      if (request.method === "POST" && turnMatch) {
        const auth = await authenticateRequest(request, config);
        const body = await readJson(request);
        return jsonResponse(response, 200, await service.applyTurn({ matchId: decodeURIComponent(turnMatch[1]), playerId: auth.playerId, body }), origin);
      }
      const callbackMatch = url.pathname.match(new RegExp("^/v1/purchases/provider-callback$"));
      if (request.method === "POST" && callbackMatch) {
        const { rawBody, body } = await readRawJson(request);
        const result = await activePurchaseAuthority.authorizeProviderCallback({
          body,
          rawBody,
          headers: cloneHeaders(request)
        });
        return jsonResponse(response, purchaseStatusCode(result.status), result, origin);
      }

      const purchaseStatusMatch = url.pathname.match(new RegExp("^/v1/purchases/([^/]+)$"));
      if (request.method === "GET" && purchaseStatusMatch) {
        const auth = await authenticateRequest(request, config);
        const result = activePurchaseAuthority.getStatus({
          purchaseId: decodeURIComponent(purchaseStatusMatch[1]),
          playerId: auth.playerId
        });
        if (!result) {
          return jsonResponse(response, 404, {
            status: "NOT_FOUND",
            error: "NOT_FOUND"
          }, origin);
        }
        return jsonResponse(response, 200, result, origin);
      }

      const claimMatch = url.pathname.match(new RegExp("^/v1/purchases/([^/]+)/claim$"));
      if (request.method === "POST" && claimMatch) {
        const auth = await authenticateRequest(request, config);
        const body = await readJson(request);
        const result = await activePurchaseAuthority.claim({
          purchaseId: decodeURIComponent(claimMatch[1]),
          playerId: auth.playerId,
          body
        });
        if (!result) {
          return jsonResponse(response, 404, {
            status: "NOT_FOUND",
            error: "NOT_FOUND"
          }, origin);
        }
        return jsonResponse(response, 200, result, origin);
      }

      const purchaseMatch = url.pathname.match(new RegExp("^/v1/purchases/([^/]+)/authorize$"));
      if (request.method === "POST" && purchaseMatch) {
        const auth = await authenticateRequest(request, config);
        const body = await readJson(request);
        const result = await activePurchaseAuthority.authorize({
          purchaseId: decodeURIComponent(purchaseMatch[1]),
          playerId: auth.playerId,
          body
        });
        return jsonResponse(response, purchaseStatusCode(result.status), result, origin);
      }
      return jsonResponse(response, 404, { error: "NOT_FOUND", message: "Endpoint not found" }, origin);
    } catch (error) {
      const authorityError = isAuthorityError(error) ? error : new AuthorityError(500, "INTERNAL_ERROR", "Internal authority service error");
      return jsonResponse(response, authorityError.status, { error: authorityError.code, message: authorityError.message }, origin);
    }
  });

  return Object.freeze({
    server,
    store: activeStore,
    service,
    signer: activeSigner,
    purchaseStore: activePurchaseStore,
    purchaseAuthority: activePurchaseAuthority,
    purchaseProviderAdapter: activePurchaseAdapter
  });
}

export async function startServer(config = loadConfig()) {
  if (config.production) validateProductionConfig(config);
  const created = createAuthorityServer({ config });
  await new Promise((resolve) => created.server.listen(config.port, resolve));
  return created;
}

if (process.argv[1] && process.argv[1].endsWith("server.mjs")) {
  startServer()
    .then(({ server }) => console.log("[basewarriors-authority] listening on", server.address()))
    .catch((error) => { console.error("[basewarriors-authority] failed to start:", error); process.exitCode = 1; });
}
