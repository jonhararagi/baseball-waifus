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

async function boot() {
  host = detectHost();

  if (host === "telegram") {
    const tg = (window as any).Telegram.WebApp;
    tg.ready();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    setStatus("Telegram Mini App");
    window.dispatchEvent(new CustomEvent("baseball-waifus-host-ready", { detail: "telegram" }));
  }

  if (host === "discord") {
    discordSdk = new DiscordSDK(query.get("client_id") || "");
    await discordSdk.ready();
    (window as any).__BASEBALL_WAIFUS_DISCORD_READY__ = true;
    setStatus("Discord Activity");
    window.dispatchEvent(new CustomEvent("baseball-waifus-host-ready", { detail: "discord" }));
  }

  const iframe = document.createElement("iframe");
  iframe.src = godotUrl;
  iframe.allow = "autoplay; fullscreen; gamepad; microphone; camera";
  iframe.allowFullscreen = true;
  iframe.setAttribute("title", "Baseball Waifus");
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "0";
  document.querySelector("#game-root")?.replaceChildren(iframe);

  (window as any).BaseballWaifusHost = {
    ready: () => setStatus(host === "telegram" ? "Telegram Mini App ready" : host === "discord" ? "Discord Activity ready" : "Local ready"),
    expand: () => {
      if (host === "telegram") (window as any).Telegram.WebApp.expand?.();
    },
    fullscreen: () => iframe.requestFullscreen?.(),
    haptic: (style: "light" | "medium" | "heavy") => {
      if (host === "telegram") {
        (window as any).Telegram.WebApp.HapticFeedback?.impactOccurred(style);
      } else if (navigator.vibrate) {
        navigator.vibrate(style === "heavy" ? 35 : style === "medium" ? 25 : 15);
      }
    },
  };
}

boot().catch((error) => setStatus("Host error: " + String(error)));
