export function loadConfig(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || "development");
  return Object.freeze({
    nodeEnv,
    production: nodeEnv === "production",
    port: Number(env.PORT || 8787),
    rewardSigningPrivateKeyPem: env.REWARD_SIGNING_PRIVATE_KEY
      ? String(env.REWARD_SIGNING_PRIVATE_KEY).replace(/\\n/g, "\n")
      : "",
    telegramBotToken: String(env.TELEGRAM_BOT_TOKEN || ""),
    telegramInitDataMaxAgeSeconds: Number(env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS || 3600),
    allowedOrigins: String(env.ALLOWED_ORIGINS || "*").split(",").map((value) => value.trim()).filter(Boolean),
    persistenceConfigured: false
  });
}
