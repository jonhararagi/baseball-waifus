const TELEGRAM_SHARE_PATH = "https://t.me/share/url";

function resolveWebApp(webApp = null) {
  return webApp || globalThis?.window?.Telegram?.WebApp || null;
}

function resolveNavigator(navigatorRef = null) {
  return navigatorRef || globalThis?.navigator || null;
}

function normalizeShareCharacter(character = {}) {
  const canonical = character?.canonical || character || {};
  const name = String(
    canonical.display_name
    || canonical.name
    || character?.display_name
    || character?.name
    || character?.character_id
    || "UNKNOWN WAIFU"
  );
  const rarity = String(
    canonical.rarity
    || character?.rarity
    || "R"
  ).toUpperCase();
  return { name, rarity };
}

export function buildShareMessage(character = {}, rarityOverride = null) {
  const normalized = normalizeShareCharacter(character);
  const rarity = String(rarityOverride || normalized.rarity).toUpperCase();
  return `¡Acabo de reclutar a ${normalized.name} (${rarity}) en Baseball Waifus! ⚾✨ ¿Puedes superar mi equipo?`;
}

export function buildTelegramShareUrl(message, shareUrl = null) {
  const url = String(shareUrl || "");
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  params.set("text", String(message || ""));
  return TELEGRAM_SHARE_PATH + "?" + params.toString();
}

export function buildSharePayload(character = {}, rarityOverride = null, shareUrl = null) {
  const normalized = normalizeShareCharacter(character);
  const rarity = String(rarityOverride || normalized.rarity).toUpperCase();
  const message = buildShareMessage(character, rarity);
  return {
    name: normalized.name,
    rarity,
    message,
    telegram_url: buildTelegramShareUrl(message, shareUrl)
  };
}

export async function shareWaifu(payloadOrCharacter, {
  webApp = null,
  navigatorRef = null,
  shareUrl = null,
  clipboardFallback = true
} = {}) {
  const payload = payloadOrCharacter?.message
    ? payloadOrCharacter
    : buildSharePayload(payloadOrCharacter, null, shareUrl);
  const telegram = resolveWebApp(webApp);
  const navigatorObject = resolveNavigator(navigatorRef);

  if (telegram?.switchInlineQuery) {
    try {
      telegram.switchInlineQuery(payload.message);
      return { ok: true, mode: "telegram_inline_query", payload };
    } catch {
      // Fall through to Telegram share URL or browser APIs.
    }
  }

  if (telegram?.openTelegramLink) {
    try {
      telegram.openTelegramLink(payload.telegram_url);
      return { ok: true, mode: "telegram_share_url", payload };
    } catch {
      // Fall through to browser APIs.
    }
  }

  if (navigatorObject?.share) {
    try {
      await navigatorObject.share({
        title: "Baseball Waifus",
        text: payload.message,
        url: String(shareUrl || "")
      });
      return { ok: true, mode: "navigator_share", payload };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, mode: "share_cancelled", payload };
      }
    }
  }

  if (clipboardFallback && navigatorObject?.clipboard?.writeText) {
    try {
      await navigatorObject.clipboard.writeText(payload.message);
      return { ok: true, mode: "clipboard", payload };
    } catch {
      // Browser does not permit clipboard access in the current context.
    }
  }

  return { ok: false, mode: "unavailable", payload };
}
