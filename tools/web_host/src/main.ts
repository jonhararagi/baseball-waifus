import { DiscordSDK } from "@discord/embedded-app-sdk";

type Host = "local" | "telegram" | "discord";

const status = document.querySelector<HTMLParagraphElement>("#status");
const query = new URLSearchParams(window.location.search);
const godotUrl = query.get("godot") || "./godot/index.html";

let host: Host = "local";
let discordSdk: DiscordSDK | null = null;

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

function handleGodotMessage(event: MessageEvent) {
  const data = event.data;
  if (!data || data.type !== "baseball-waifus-host") return;

  if (data.action === "ready") {
    setStatus(host === "telegram" ? "Telegram Mini App ready" : host === "discord" ? "Discord Activity ready" : "Local ready");
  }

  if (data.action === "expand" && host === "telegram") {
    (window as any).Telegram?.WebApp?.expand?.();
  }

  if (data.action === "fullscreen" && host === "discord") {
    const iframe = document.querySelector<HTMLIFrameElement>("#game-root iframe");
    iframe?.requestFullscreen?.();
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
    discordSdk = new DiscordSDK(query.get("client_id") || "");
    await discordSdk.ready();
    (window as any).__BASEBALL_WAIFUS_DISCORD_READY__ = true;
    setStatus("Discord Activity");
  }

  const iframe = document.createElement("iframe");
  iframe.src = withPlatform(godotUrl, host);
  iframe.allow = "autoplay; fullscreen; gamepad; microphone; camera";
  iframe.allowFullscreen = true;
  iframe.setAttribute("title", "Baseball Waifus");
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "0";
  document.querySelector("#game-root")?.replaceChildren(iframe);

  if (host === "local") {
    setStatus("Local web host");
  }
}

boot().catch((error) => setStatus("Host error: " + String(error)));
