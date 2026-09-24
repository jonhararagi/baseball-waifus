const CACHE_NAME = 'v16_capibara_core';

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./data/waifus_config.json",
  "./data/game_schemas_recycled.json",
  "./data/characters_queue.json",
  "./js/app.js",
  "./js/admin_panel.js",
  "./js/api.js",
  "./js/audio_engine.js",
  "./js/asset_loader.js",
  "./js/audio_bridge.js",
  "./js/area_theme_manager.js",
  "./js/batter_renderer.js",
  "./js/card_renderer.js",
  "./js/combat.js",
  "./js/combat_effects.js",
  "./js/combat_hud.js",
  "./js/economy.js",
  "./js/gacha_controller.js",
  "./js/gacha_recruitment.js",
  "./js/shop_ui.js",
  "./js/roster_panel.js",
  "./js/gacha_engine.js",
  "./js/gallery.js",
  "./js/game_modes.js",
  "./js/haptics_bridge.js",
  "./js/locker_room.js",
  "./js/main_menu.js",
  "./js/mobile_haptics.js",
  "./js/performance_adapter.js",
  "./js/save_system.js",
  "./js/share_bridge.js",
  "./js/super_swing_cutin.js",
  "./js/team_manager.js",
  "./js/timing_ring.js",
  "./js/tma_bridge.js",
  "./js/upgrade_system.js",
  "./js/voice_system.js",
  "./js/waifu_database.js",
  "./js/waifu_dex.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

function isLocalGet(request) {
  if (request.method !== "GET") return false;
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

async function cacheResponse(request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) {
    return response;
  }

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
    await cache.addAll(PRECACHE_ASSETS);
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
