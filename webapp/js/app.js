import {
  BaseballWaifusApi,
  TelegramBridge,
  isCombatInitDTO,
  isTurnResultDTO
} from "./api.js";
import { CombatRenderer } from "./combat.js";
import { AudioEngine } from "./audio_engine.js";
import {
  GachaController,
  exposeGachaToWindow
} from "./gacha_controller.js";
import { GalleryController } from "./gallery.js";
import { createHapticsBridge } from "./haptics_bridge.js";
import { buildSharePayload, shareWaifu } from "./share_bridge.js";
import { requestScrapPurchase } from "./economy.js";
import { CardRenderer } from "./card_renderer.js";
import { UpgradeSystem } from "./upgrade_system.js";
import { TeamManager } from "./team_manager.js";

function initializeTelegramNativeShell() {
  const webApp = window.Telegram?.WebApp || null;
  if (!webApp) return null;
  try {
    webApp.ready?.();
    webApp.expand?.();
    webApp.setHeaderColor?.("#0b0b0f");
    webApp.setBackgroundColor?.("#0b0b0f");
  } catch {
    // Partial Telegram WebApp surfaces remain a supported fallback.
  }
  return webApp;
}

const telegramWebApp = initializeTelegramNativeShell();
const telegram = new TelegramBridge(window.Telegram);
telegram.init();
const api = new BaseballWaifusApi({ telegramBridge: telegram });
const hapticsBridge = createHapticsBridge(telegramWebApp);
const cloudStorage = telegramWebApp?.CloudStorage || null;
const audioBridge = new AudioEngine();

const connectionState = document.querySelector("#connection-state");
const loadingState = document.querySelector("#loading-state");
const loadingDetail = loadingState?.querySelector(".loading-detail");
const inningValue = document.querySelector("#match-inning");
const countValue = document.querySelector("#match-count");
const outsValue = document.querySelector("#match-outs");
const awayValue = document.querySelector("#match-away");
const homeValue = document.querySelector("#match-home");
const scoreValue = document.querySelector("#match-score");
const batButton = document.querySelector("#action-bat");
const stealButton = document.querySelector("#action-steal");
const syncButton = document.querySelector("#action-sync");
const gachaButton = document.querySelector("#action-gacha");
const gachaPullValue = document.querySelector("#gacha-pull");
const gachaScrapValue = document.querySelector("#gacha-scrap");
const gachaDexValue = document.querySelector("#gacha-dex");
const gachaStatusValue = document.querySelector("#gacha-status");
const gachaFragmentsValue = document.querySelector("#gacha-fragments");
const audioMuteButton = document.querySelector("#audio-mute");
const audioVolumeSlider = document.querySelector("#audio-volume");
const galleryScrapReadout = document.querySelector("#gallery-scrap-readout");
const shareButton = document.querySelector("#action-share");
const navDexButton = document.querySelector("#nav-dex");
const galleryView = document.querySelector("#gallery-view");
const dexInspector = document.querySelector("#dex-card-inspector");
const dexInspectorName = document.querySelector("#dex-inspector-name");
const dexInspectorClose = document.querySelector("#dex-inspector-close");
const cardRenderer = new CardRenderer({
  root: document.querySelector("#dex-card-stage")
});
const combatShell = document.querySelector(".combat-shell");
const combatViewPieces = [...document.querySelectorAll(".combat-view-piece")];

let matchId = "";
let actionPending = false;
let gachaRolling = false;
let sharePayload = null;

const gachaController = new GachaController({
  audioBridge,
  hapticsBridge,
  cloudStorage
});

const teamManager = new TeamManager({
  storage: gachaController.storage,
  getCharacter: (id) => gachaController.getCharacter(id),
  getInventory: () => gachaController.getState().inventory,
  getExternalActive: () => gachaController.getActiveBatter(),
  persistActiveBatter: (id) => gachaController.setActiveBatter(id)
});

const upgradeSystem = new UpgradeSystem({
  storage: gachaController.storage,
  getWaifu: (id) => gachaController.getCharacter(id),
  getInventoryEntry: (id) => gachaController.getState().inventory?.[id] || null,
  getCurrencies: () => ({
    scrap: gachaController.getScavengerScrap(),
    fragments: gachaController.getFragments()
  }),
  consumeCurrencies: (cost) => gachaController.spendScrapAndFragments(cost)
});

function handleScrapEarned({ amount, result }) {
  if (amount <= 0) return;
  gachaController.addScrap(amount);
  if (gachaStatusValue) {
    gachaStatusValue.textContent = "+" + amount + " SCRAP // " + String(result).toUpperCase();
  }
}

const renderer = new CombatRenderer(document.querySelector("#combat-canvas"), {
  audioBridge,
  hapticsBridge,
  onScrapEarned: handleScrapEarned,
  getHudResources: () => ({
    scrap: gachaController.getScavengerScrap(),
    energy: renderer?.state?.energy
      ?? renderer?.state?.state?.energy
      ?? 100
  })
});
gachaController.setCutInRenderer(renderer);

const gallery = new GalleryController({
  root: galleryView,
  storage: gachaController.storage,
  storageKey: gachaController.storageKey,
  progressionProvider: (characterId) => upgradeSystem.getProgression(characterId),
  onInspect: (unit) => {
    if (dexInspector) dexInspector.hidden = false;
    if (dexInspectorName) {
      dexInspectorName.textContent = unit?.canonical?.display_name || unit?.character_id || "UNKNOWN WAIFU";
    }
    cardRenderer.mount(unit, {
      assets: {
        card_hd_url: "./assets/production/cards/" + String(unit?.character_id || "") + "--normal.jpg"
      },
      themeColor: unit?.canonical?.visual?.accent || null
    });
  },
  onShare: (unit) => {
    const payload = buildSharePayload(unit, null, window.location.href);
    sharePayload = payload;
    if (shareButton) shareButton.hidden = false;
    void shareWaifu(payload, { webApp: telegramWebApp });
  },
  onActiveBatterChange: (characterId) => {
    hapticsBridge.handleGameEvent("ui_confirm");
    try {
      teamManager.setActiveBatter(characterId);
    } catch {
      return;
    }
    if (renderer.state) {
      void renderer.setCombatInit(applyActiveRoster(renderer.state));
    }
  }
});
exposeGachaToWindow(gachaController);
window.BaseballWaifusTeam = {
  getRoster: () => teamManager.getRoster(),
  getActiveBatter: () => teamManager.getActiveWaifu(),
  setActiveBatter: (id) => teamManager.setActiveBatter(id),
  setSupport: (slot, id) => teamManager.setSupport(slot, id),
  clearSupport: (slot) => teamManager.clearSupport(slot),
  getTimingWindowMultiplier: (area) => teamManager.getTimingWindowMultiplier(area)
};
window.BaseballWaifusUpgrades = {
  getProgression: (id) => upgradeSystem.getProgression(id),
  getUpgradeCost: (id) => upgradeSystem.getUpgradeCost(id),
  canUpgrade: (id) => upgradeSystem.canUpgrade(id),
  upgradeWaifu: (id) => upgradeSystem.upgradeWaifu(id),
  getAllProgression: () => upgradeSystem.getAllProgression()
};

function setShareTarget(payload = null) {
  sharePayload = payload?.message ? payload : null;
  if (shareButton) shareButton.hidden = !sharePayload;
}

function updateGachaHud(status, result = null) {
  if (!status) return;
  if (gachaPullValue) gachaPullValue.textContent = status.pulls_since_UR + "/80";
  if (gachaScrapValue) gachaScrapValue.textContent = String(status.scavenger_scrap);
  if (gachaFragmentsValue) gachaFragmentsValue.textContent = String(status.fragments ?? gachaController.getFragments());
  if (galleryScrapReadout) galleryScrapReadout.textContent = "SCRAP // " + status.scavenger_scrap;
  if (gachaDexValue) gachaDexValue.textContent = String(status.inventory_size);
  if (gachaStatusValue) {
    gachaStatusValue.textContent = result
      ? result.rarity + " • " + (result.character.canonical?.display_name || result.character.character_id)
      : (status.ready ? (status.can_afford_recruit ? "READY" : "NEED SCRAP") : "LOADING");
  }
  if (gachaButton && !gachaRolling) {
    gachaButton.disabled = !status.ready || !status.can_afford_recruit;
  }
}

function setConnection(text, tone = "neutral") {
  connectionState.textContent = text;
  connectionState.style.color = tone === "error"
    ? "#ff6e8e"
    : tone === "ok"
      ? "#56e6a9"
      : "";
}

function setLoading(visible, detail = "") {
  loadingState.hidden = !visible;
  if (loadingDetail && detail) loadingDetail.textContent = detail;
}

function activeAssetDescriptors(characterId) {
  const id = String(characterId || "");
  return {
    card: { id, card_hd_url: "./assets/production/cards/" + id + "--normal.jpg", path: "./assets/production/cards/" + id + "--normal.jpg" },
    sprite: { id, sprite_url: "./assets/production/sprites/" + id + "_idle.png", path: "./assets/production/sprites/" + id + "_idle.png" }
  };
}

function applyActiveRoster(dto) {
  const active = teamManager.getActiveWaifu();
  if (!active) return teamManager.applyCombatModifiers(dto);
  const canonical = active.canonical || {};
  const assets = activeAssetDescriptors(active.character_id);
  const existingCards = Array.isArray(dto.assets?.cards) ? dto.assets.cards : [];
  const existingSprites = Array.isArray(dto.assets?.sprites) ? dto.assets.sprites : [];
  return teamManager.applyCombatModifiers({
    ...dto,
    batter: {
      ...(dto.batter || {}),
      id: active.character_id,
      name: canonical.display_name || active.character_id,
      card_id: active.character_id,
      element: canonical.element,
      rarity: canonical.rarity,
      faction: canonical.faction,
      position: canonical.position,
      specialization: canonical.specialization,
      stats: canonical.stats || {},
      sprite_url: assets.sprite.sprite_url,
      card_hd_url: assets.card.card_hd_url
    },
    active_batter: {
      character_id: active.character_id,
      stats: canonical.stats || {},
      card_hd_url: assets.card.card_hd_url,
      sprite_url: assets.sprite.sprite_url
    },
    assets: {
      ...(dto.assets || {}),
      cards: [...existingCards.filter((asset) => asset?.id !== active.character_id), assets.card],
      sprites: [...existingSprites.filter((asset) => asset?.id !== active.character_id), assets.sprite]
    }
  });
}

function createDemoCombatInit() {
  return {
    type: "CombatInitDTO",
    match_id: "demo-bw001-vs-bw002",
    area_id: "cyberpunk",
    state: {
      inning: 1,
      half: "TOP",
      outs: 0,
      balls: 0,
      strikes: 0,
      bases: { first: false, second: false, third: false }
    },
    home_team: { id: "demo-home", name: "Kurose Eleven", score: 0 },
    away_team: { id: "demo-away", name: "Hanamori Stars", score: 0 },
    batter: {
      id: "bw001", name: "Aiko Hanamori", card_id: "bw001",
      element: "fire", rarity: "R", faction: "bosozoku_wild"
    },
    pitcher: {
      id: "bw002", name: "Reina Kurose", card_id: "bw002",
      element: "ice", rarity: "SSR", faction: "shadow_magic"
    },
    assets: {
      cards: [
        { id: "bw001", card_hd_url: "./assets/production/cards/bw001--normal.jpg", path: "./assets/production/cards/bw001--normal.jpg" },
        { id: "bw002", card_hd_url: "./assets/production/cards/bw002--normal.jpg", path: "./assets/production/cards/bw002--normal.jpg" }
      ],
      sprites: [
        { id: "bw001", sprite_url: "./assets/production/sprites/bw001_idle.png", path: "./assets/production/sprites/bw001_idle.png" },
        { id: "bw002", sprite_url: "./assets/production/sprites/bw002_idle.png", path: "./assets/production/sprites/bw002_idle.png" }
      ]
    }
  };
}

async function initializeDefaultDemo() {
  if (api.configured() || renderer.matchReady) return false;
  const demoInitDTO = applyActiveRoster(createDemoCombatInit());
  await renderer.setCombatInit(demoInitDTO);
  updateHud(demoInitDTO);
  batButton.disabled = true;
  stealButton.disabled = true;
  setConnection("Local demo match", "ok");
  setLoading(false);
  return true;
}

function updateHud(state) {
  const matchState = state?.state || {};
  const inning = matchState.inning ?? "-";
  const half = matchState.half ?? "";
  const balls = matchState.balls ?? "-";
  const strikes = matchState.strikes ?? "-";
  const outs = matchState.outs ?? "-";
  const homeTeam = state?.home_team?.name || "HOME";
  const awayTeam = state?.away_team?.name || "AWAY";
  const homeScore = Number(state?.home_team?.score ?? 0);
  const awayScore = Number(state?.away_team?.score ?? 0);
  inningValue.textContent = half ? inning + " • " + half : String(inning);
  countValue.textContent = balls + "-" + strikes;
  outsValue.textContent = String(outs);
  awayValue.textContent = awayTeam;
  homeValue.textContent = homeTeam;
  scoreValue.textContent = awayScore + " - " + homeScore;
}

function setActionPending(pending) {
  actionPending = pending;
  batButton.disabled = pending;
  stealButton.disabled = pending;
}

async function syncCombat() {
  if (!api.configured()) {
    setConnection(telegram.isAvailable() ? "Telegram connected" : "Web client ready", "ok");
    setLoading(true, "Waiting for an authoritative combat payload.");
    return;
  }
  if (!matchId) {
    setConnection("Match not selected");
    setLoading(true, "Open the Mini App with a match identifier.");
    return;
  }
  setConnection("Syncing match");
  setLoading(true, "Loading authoritative combat state.");
  try {
    const payload = await api.getCombatInit(matchId);
    if (!isCombatInitDTO(payload)) throw new Error("Server returned an invalid CombatInitDTO");
    const rosterPayload = applyActiveRoster(payload);
    await renderer.setCombatInit(rosterPayload);
    updateHud(rosterPayload);
    setConnection(telegram.isAvailable() ? "Telegram connected" : "Web client ready", "ok");
    setLoading(false);
  } catch (error) {
    setConnection("Combat sync failed", "error");
    setLoading(true, String(error.message || error));
  }
}

async function sendAction(actionType) {
  if (!api.configured() || !matchId || actionPending) return;
  setActionPending(true);
  try {
    const payload = await api.submitTurnAction(matchId, { type: actionType, client_time_ms: Date.now() });
    if (!isTurnResultDTO(payload)) throw new Error("Server returned an invalid TurnResultDTO");
    await renderer.applyTurnResult(payload);
    updateHud({
      ...renderer.state,
      state: payload.state,
      home_team: payload.home_team || renderer.state.home_team,
      away_team: payload.away_team || renderer.state.away_team
    });
  } catch {
    setConnection("Action rejected", "error");
  } finally {
    setActionPending(false);
  }
}

batButton.addEventListener("click", () => {
  renderer.beginBatterWindup();
  sendAction("BAT");
});
stealButton.addEventListener("click", () => sendAction("STEAL"));
syncButton.addEventListener("click", syncCombat);

gachaButton?.addEventListener("click", async () => {
  if (!gachaController.ready || gachaRolling) return;
  gachaRolling = true;
  gachaButton.disabled = true;
  try {
    const result = await gachaController.rollGacha();
    setShareTarget(
      result?.rarity === "SSR" || result?.rarity === "UR"
        ? result.share
        : null
    );

    gallery.refresh();
    updateGachaHud(gachaController.getStatus(), result);
  } catch (error) {
    if (gachaStatusValue) gachaStatusValue.textContent = String(error.message || error).toUpperCase();
    setConnection("Gacha unavailable", "error");
  } finally {
    gachaRolling = false;
    updateGachaHud(gachaController.getStatus());
  }
});

gachaController.subscribe((status, result) => {
  if (result && (result.rarity === "SSR" || result.rarity === "UR")) {
    setShareTarget(result.share);
    if (result.rarity === "UR") {
      renderer.showHudBanner(
        "UR RECRUITED!",
        (result.character?.canonical?.display_name || result.character?.character_id || "UNKNOWN")
          + " • UR",
        { accent: "#ffcd66", duration: 1.8 }
      );
    }
  }
  updateGachaHud(status, result);
  gallery.refresh();
});

function setTelegramBackButton(visible) {
  const backButton = telegramWebApp?.BackButton;
  if (!backButton) return;
  try {
    if (visible) backButton.show?.();
    else backButton.hide?.();
  } catch {
    // Browser/older Telegram clients may expose a partial BackButton surface.
  }
}

function setView(view) {
  const showGallery = view === "gallery";
  if (galleryView) galleryView.hidden = !showGallery;
  if (combatShell) combatShell.hidden = showGallery;
  if (!showGallery && dexInspector) dexInspector.hidden = true;
  for (const element of combatViewPieces) element.hidden = showGallery;
  if (navDexButton) navDexButton.textContent = showGallery ? "VOLVER AL CAMPO" : "DEX / EQUIPO";
  setTelegramBackButton(showGallery);
  if (showGallery) {
    setShareTarget(null);
    gallery.refresh();
  }
}

function handleTelegramBackButton() {
  setView("combat");
}

navDexButton?.addEventListener("click", () => {
  setView(galleryView?.hidden ? "gallery" : "combat");
});

dexInspectorClose?.addEventListener("click", () => {
  if (dexInspector) dexInspector.hidden = true;
  cardRenderer.unmount();
});

telegramWebApp?.BackButton?.onClick?.(handleTelegramBackButton);

shareButton?.addEventListener("click", async () => {
  if (!sharePayload) return;
  const result = await shareWaifu(sharePayload, { webApp: telegramWebApp });
  if (gachaStatusValue) {
    gachaStatusValue.textContent = result.ok
      ? "SHARED // " + sharePayload.rarity
      : "SHARE UNAVAILABLE";
  }
});

function syncAudioControls() {
  const settings = audioBridge.getSettings();
  if (audioVolumeSlider) audioVolumeSlider.value = String(settings.volume);
  if (audioMuteButton) {
    audioMuteButton.textContent = settings.muted ? "AUDIO // OFF" : "AUDIO // ON";
    audioMuteButton.setAttribute("aria-pressed", settings.muted ? "true" : "false");
  }
}
audioVolumeSlider?.addEventListener("input", () => {
  audioBridge.setVolume(audioVolumeSlider.value);
  syncAudioControls();
});
audioMuteButton?.addEventListener("click", () => {
  audioBridge.toggleMute();
  syncAudioControls();
});
syncAudioControls();

function syncAudioLifecycle() {
  const hidden = document.visibilityState === "hidden";
  const telegramCollapsed = Boolean(
    telegramWebApp
    && "isExpanded" in telegramWebApp
    && telegramWebApp.isExpanded === false
  );
  if (hidden || telegramCollapsed) {
    void audioBridge.suspend?.();
  } else {
    void audioBridge.resume?.();
  }
}

document.addEventListener("visibilitychange", syncAudioLifecycle);
telegramWebApp?.onEvent?.("viewportChanged", syncAudioLifecycle);
syncAudioLifecycle();

window.requestScrapPurchase = (amount, options = {}) => requestScrapPurchase(amount, {
  webApp: telegramWebApp,
  ...options
});

window.addEventListener("message", async (event) => {
  const payload = event.data;
  if (isCombatInitDTO(payload)) {
    const rosterPayload = applyActiveRoster(payload);
    await renderer.setCombatInit(rosterPayload);
    updateHud(rosterPayload);
    setConnection("Embedded match ready", "ok");
    setLoading(false);
    return;
  }
  if (isTurnResultDTO(payload)) {
    await renderer.applyTurnResult(payload);
    updateHud({ ...renderer.state, state: payload.state });
    setConnection("Turn received", "ok");
    setLoading(false);
  }
});

async function initializeGallery() {
  try {
    await gallery.initialize();
  } catch {
    gallery.refresh();
  }
}

async function bootstrap() {
  const query = new URLSearchParams(window.location.search);
  matchId = query.get("match") || "";
  try {
    await gachaController.initialize();
    teamManager.sync();
    updateGachaHud(gachaController.getStatus());
    await initializeGallery();
  } catch {
    gachaButton.disabled = true;
    if (gachaStatusValue) gachaStatusValue.textContent = "OFFLINE";
    await initializeGallery();
  }
  if (!api.configured()) {
    try {
      await initializeDefaultDemo();
    } catch (error) {
      setConnection("Demo initialization failed", "error");
      setLoading(true, String(error.message || error));
    }
    return;
  }
  syncCombat();
}

renderer.initialize();
bootstrap();