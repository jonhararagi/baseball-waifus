import http from "node:http";
import { URL } from "node:url";
import { loadConfig } from "./config.mjs";
import { authenticateRequest, authenticationConfigured } from "./auth.mjs";
import { createAttestationSigner } from "./attestation_signer.mjs";
import { CombatService } from "./combat_service.mjs";
import { InMemoryCombatStore } from "./combat_store.mjs";
import { AuthorityError, isAuthorityError } from "./errors.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "connection": "close"
};

function jsonResponse(res, status, payload, origin = "*") {
  res.writeHead(status, {
    ...JSON_HEADERS,
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type, x-telegram-init-data, x-test-player-id",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function corsOrigin(request, config) {
  const requested = request.headers?.origin || "*";
  if (config.allowedOrigins.includes("*")) return "*";
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
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AuthorityError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

function readiness(config, signer) {
  return {
    ready: Boolean(signer && authenticationConfigured(config) && config.persistenceConfigured),
    signing_key: Boolean(signer),
    authentication: authenticationConfigured(config),
    persistence: Boolean(config.persistenceConfigured),
    deployment: false
  };
}

export function createAuthorityServer({ config = loadConfig(), store = new InMemoryCombatStore(), signer = null } = {}) {
  let activeSigner = signer;
  if (!activeSigner && config.rewardSigningPrivateKeyPem) {
    activeSigner = createAttestationSigner({ privateKeyPem: config.rewardSigningPrivateKeyPem });
  }
  const service = new CombatService({ store, signer: activeSigner });

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
        const status = readiness(config, activeSigner);
        return jsonResponse(response, status.ready ? 200 : 503, status, origin);
      }

      const initMatch = url.pathname.match(/^\/v1\/combat\/([^/]+)\/init$/);
      if (request.method === "GET" && initMatch) {
        const auth = await authenticateRequest(request, config);
        const payload = await service.init(decodeURIComponent(initMatch[1]), auth.playerId);
        return jsonResponse(response, 200, payload, origin);
      }

      const turnMatch = url.pathname.match(/^\/v1\/combat\/([^/]+)\/turn$/);
      if (request.method === "POST" && turnMatch) {
        const auth = await authenticateRequest(request, config);
        const body = await readJson(request);
        const payload = await service.applyTurn({
          matchId: decodeURIComponent(turnMatch[1]),
          playerId: auth.playerId,
          body
        });
        return jsonResponse(response, 200, payload, origin);
      }

      return jsonResponse(response, 404, { error: "NOT_FOUND", message: "Endpoint not found" }, origin);
    } catch (error) {
      const authorityError = isAuthorityError(error)
        ? error
        : new AuthorityError(500, "INTERNAL_ERROR", "Internal authority service error");
      return jsonResponse(response, authorityError.status, {
        error: authorityError.code,
        message: authorityError.message
      }, origin);
    }
  });

  return Object.freeze({ server, store, service, signer: activeSigner });
}

export async function startServer(config = loadConfig()) {
  if (config.production && !config.rewardSigningPrivateKeyPem) {
    throw new Error("Production server cannot start without REWARD_SIGNING_PRIVATE_KEY");
  }
  const created = createAuthorityServer({ config });
  await new Promise((resolve) => created.server.listen(config.port, resolve));
  return created;
}

if (process.argv[1] && process.argv[1].endsWith("server.mjs")) {
  startServer()
    .then(({ server }) => console.log("[basewarriors-authority] listening on", server.address()))
    .catch((error) => {
      console.error("[basewarriors-authority] failed to start:", error);
      process.exitCode = 1;
    });
}
