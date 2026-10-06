const DEFAULT_MAX_AGE_SECONDS = 3600;

function splitList(value, fallback = []) {
  if (value === undefined || value === null || String(value).trim() === "") return [...fallback];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function positiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || "development").toLowerCase();
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test or production");
  }

  const persistenceProvider = String(env.AUTHORITY_PERSISTENCE_PROVIDER || "").trim().toLowerCase();
  const persistenceFilePath = env.AUTHORITY_PERSISTENCE_FILE ? String(env.AUTHORITY_PERSISTENCE_FILE) : "";
  const persistenceDsn = env.AUTHORITY_PERSISTENCE_DSN ? String(env.AUTHORITY_PERSISTENCE_DSN) : "";
  const allowedOrigins = splitList(env.ALLOWED_ORIGINS, nodeEnv === "production" ? [] : ["*"]);

  const purchaseProvider = String(env.PURCHASE_PROVIDER || "").trim();
  const purchaseProviderEndpoint = String(env.PURCHASE_PROVIDER_ENDPOINT || "").trim();
  const purchaseProviderCredentialConfigured = Boolean(
    String(env.PURCHASE_PROVIDER_CREDENTIAL || "").trim()
  );
  const telegramStarsWebhookSecret = String(
    env.TELEGRAM_STARS_WEBHOOK_SECRET || ""
  ).trim();

  return Object.freeze({
    nodeEnv,
    production: nodeEnv === "production",
    test: nodeEnv === "test",
    development: nodeEnv === "development",
    deploymentMode: nodeEnv,
    port: positiveInteger(env.PORT, 8787),
    rewardSigningPrivateKeyPem: env.REWARD_SIGNING_PRIVATE_KEY
      ? String(env.REWARD_SIGNING_PRIVATE_KEY).replace(/\\n/g, "\n")
      : "",
    telegramBotToken: String(env.TELEGRAM_BOT_TOKEN || ""),
    telegramInitDataMaxAgeSeconds: positiveInteger(
      env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
      DEFAULT_MAX_AGE_SECONDS
    ),
    allowedOrigins,
    persistenceProvider,
    persistenceFilePath,
    persistenceDsn,
    persistenceConfigured: Boolean(
      (persistenceProvider === "filesystem" && persistenceFilePath)
      || (persistenceProvider === "managed" && persistenceDsn)
    ),
    purchaseProvider,
    purchaseProviderEndpoint,
    purchaseProviderConfigured: Boolean(purchaseProvider),
    purchaseProviderCredentialConfigured: Boolean(
      purchaseProviderCredentialConfigured
      || (purchaseProvider === "telegram-stars" && telegramStarsWebhookSecret)
    ),
    telegramStarsWebhookSecret,
    purchaseProviderConfigConfigured: purchaseProvider === "telegram-stars"
      ? Boolean(purchaseProvider && telegramStarsWebhookSecret)
      : Boolean(purchaseProvider && purchaseProviderEndpoint)
  });
}

export function validateProductionConfig(config) {
  if (!config?.production) return Object.freeze({ ok: true });

  const missing = [];
  if (!config.rewardSigningPrivateKeyPem) missing.push("REWARD_SIGNING_PRIVATE_KEY");
  if (!config.telegramBotToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!Array.isArray(config.allowedOrigins) || config.allowedOrigins.length === 0) {
    missing.push("ALLOWED_ORIGINS");
  }

  if (config.allowedOrigins?.includes("*")) {
    throw new Error("Production ALLOWED_ORIGINS must be explicit; wildcard '*' is forbidden");
  }
  if (config.persistenceProvider !== "managed") {
    throw new Error("Production persistence requires AUTHORITY_PERSISTENCE_PROVIDER=managed");
  }
  if (!config.persistenceDsn) missing.push("AUTHORITY_PERSISTENCE_DSN");

  if (missing.length) {
    throw new Error("Production configuration missing: " + missing.join(", "));
  }

  return Object.freeze({ ok: true });
}
