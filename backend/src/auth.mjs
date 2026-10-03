import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthorityError } from "./errors.mjs";

function getHeader(request, name) {\n  const headers = request?.headers || {};\n  return typeof headers.get === "function" ? headers.get(name) : headers[String(name).toLowerCase()] || null;\n}\n\nfunction parseTelegramInitData(raw) {
  const params = new URLSearchParams(String(raw || ""));
  const hash = params.get("hash");
  if (!hash) throw new AuthorityError(401, "TELEGRAM_HASH_MISSING", "Telegram init data hash is required");
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + value)
    .join("\n");
  return { params, hash, dataCheckString };
}

function verifyTelegramInitData(raw, botToken, maxAgeSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!botToken) throw new AuthorityError(503, "TELEGRAM_AUTH_NOT_CONFIGURED", "Production Telegram authentication is not configured");

  const { params, hash, dataCheckString } = parseTelegramInitData(raw);
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const provided = Buffer.from(String(hash), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new AuthorityError(401, "TELEGRAM_AUTH_INVALID", "Telegram init data signature is invalid");
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isInteger(authDate) || nowSeconds - authDate > maxAgeSeconds || authDate > nowSeconds + 30) {
    throw new AuthorityError(401, "TELEGRAM_AUTH_EXPIRED", "Telegram init data is expired or invalid");
  }

  let user;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch {
    throw new AuthorityError(401, "TELEGRAM_USER_INVALID", "Telegram user payload is invalid");
  }
  if (!user || !Number.isInteger(Number(user.id))) {
    throw new AuthorityError(401, "TELEGRAM_USER_MISSING", "Telegram user identity is missing");
  }

  return Object.freeze({
    playerId: "telegram:" + String(user.id),
    provider: "telegram",
    telegramUserId: String(user.id)
  });
}

export async function authenticateRequest(request, {
  nodeEnv = "development",
  telegramBotToken = "",
  telegramInitDataMaxAgeSeconds = 3600
} = {}) {
  if (nodeEnv === "test") {
    const playerId = getHeader(request, "x-test-player-id");
    if (!playerId || !/^[A-Za-z0-9._:-]+$/.test(playerId)) {
      throw new AuthorityError(401, "TEST_IDENTITY_REQUIRED", "Test identity is required");
    }
    return Object.freeze({ playerId, provider: "test", telegramUserId: null });
  }

  const rawInitData = getHeader(request, "x-telegram-init-data");
  if (!rawInitData) {
    throw new AuthorityError(401, "AUTHENTICATION_REQUIRED", "Server-verifiable Telegram init data is required");
  }

  return verifyTelegramInitData(rawInitData, telegramBotToken, telegramInitDataMaxAgeSeconds);
}

export function authenticationConfigured({ nodeEnv, telegramBotToken } = {}) {
  return nodeEnv === "test" || Boolean(telegramBotToken);
}
