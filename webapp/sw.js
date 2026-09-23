const CACHE_NAME = "baseball-waifus-rc1-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/api.js",
  "./js/audio_engine.js",
  "./js/audio_bridge.js",
  "./js/area_theme_manager.js",
  "./js/batter_renderer.js",
  "./js/card_renderer.js",
  "./js/combat.js",
  "./js/combat_effects.js",
  "./js/combat_hud.js",
  "./js/economy.js",
  "./js/gacha_controller.js",
  "./js/gacha_engine.js",
  "./js/gallery.js",
  "./js/game_modes.js",
  "./js/haptics_bridge.js",
  "./js/main_menu.js",
  "./js/mobile_haptics.js",
  "./js/performance_adapter.js",
  "./js/save_system.js",
  "./js/share_bridge.js",
  "./js/team_manager.js",
  "./js/super_swing_cutin.js",
  "./js/tma_bridge.js",
  "./js/upgrade_system.js",
  "./js/waifu_dex.js",
  "./data/game_schemas_recycled.json",
  "./data/characters_queue.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

const isLocalGet = (request) => {
  if (request.method !== "GET") return false;
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
};

async function cacheResponse(request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    return caches.match("./index.html");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);

    try {
      const manifestResponse = await fetch("./assets/production/manifest.json", { cache: "no-cache" });
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const paths = [
          ...(Array.isArray(manifest.sprites) ? manifest.sprites : []),
          ...(Array.isArray(manifest.cards) ? manifest.cards : [])
        ]
          .map((asset) => asset?.path || asset?.sprite_url || asset?.card_hd_url)
          .filter(Boolean)
          .map((path) => new URL(String(path), self.location.href).toString());

        await Promise.all(paths.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Procedural fallbacks keep presentation functional when an optional asset is absent.
          }
        }));
      }
    } catch {
      // The production asset manifest is optional in local/dev builds.
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith("baseball-waifus-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (!isLocalGet(event.request)) return;
  event.respondWith(cacheFirst(event.request));
});
