import { DiscordSDK } from "@discord/embedded-app-sdk";

type Host = "local" | "telegram" | "discord";

const status = document.querySelector<HTMLParagraphElement>("#status");
const query = new URLSearchParams(window.location.search);
const godotUrl = query.get("godot") || "./godot/index.html";

let host: Host = "local";
let discordSdk: DiscordSDK | null = null;
let gameFrame: HTMLIFrameElement | null = null;

function setStatus(text: string) {
  if (status) status.textContent = text;
}

function detectHost(): Host {
  if ((window as any).Telegram?.WebApp) return "telegram";
  if (query.get("platform") === "discord") return "discord";
  return "local";
}

function withPlatform(url: string, platform: Host): string {
  if (platform === "local") return url;
  const target = new URL(url, window.location.href);
  target.searchParams.set("platform", platform);
  return target.toString();
}

function isTrustedGameMessage(event: MessageEvent): boolean {
  if (!gameFrame || event.source !== gameFrame.contentWindow) return false;
  const gameOrigin = new URL(gameFrame.src, window.location.href).origin;
  return event.origin === gameOrigin;
}

function handleGodotMessage(event: MessageEvent) {
  if (!isTrustedGameMessage(event)) return;

  const data = event.data;
  if (!data || typeof data !== "object" || data.type !== "baseball-waifus-host") return;

  if (data.action === "ready") {
    setStatus(host === "telegram" ? "Telegram Mini App ready" : host === "discord" ? "Discord Activity ready" : "Local ready");
    return;
  }

  if (data.action === "expand" && host === "telegram") {
    (window as any).Telegram?.WebApp?.expand?.();
    return;
  }

  if (data.action === "fullscreen" && host === "discord") {
    gameFrame?.requestFullscreen?.();
    return;
  }

  if (data.action === "haptic") {
    const style = data.style || "light";
    if (host === "telegram") {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } else if (navigator.vibrate) {
      navigator.vibrate(style === "heavy" ? 35 : style === "medium" ? 25 : 15);
    }
  }
}

window.addEventListener("message", handleGodotMessage);

async function boot() {
  host = detectHost();

  if (host === "telegram") {
    const tg = (window as any).Telegram.WebApp;
    tg.ready();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    setStatus("Telegram Mini App");
  }

  if (host === "discord") {
    const clientId = query.get("client_id") || "";
    if (!clientId) throw new Error("Falta client_id para Discord Activity");
    discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();
    (window as any).__BASEBALL_WAIFUS_DISCORD_READY__ = true;
    setStatus("Discord Activity");
  }

  gameFrame = document.createElement("iframe");
  gameFrame.src = withPlatform(godotUrl, host);
  gameFrame.allow = "autoplay; fullscreen; gamepad; microphone; camera";
  gameFrame.allowFullscreen = true;
  gameFrame.setAttribute("title", "Baseball Waifus");
  gameFrame.style.width = "100vw";
  gameFrame.style.height = "100vh";
  gameFrame.style.border = "0";
  document.querySelector("#game-root")?.replaceChildren(gameFrame);

  if (host === "local") {
    setStatus("Local web host");
  }
}

boot().catch((error) => setStatus("Host error: " + String(error)));
