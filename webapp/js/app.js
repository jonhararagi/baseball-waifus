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
import { SaveSystem } from "./save_system.js";
import { GameModeManager } from "./game_modes.js";
import { MainMenu } from "./main_menu.js";

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
const gachaTenButton = document.querySelector("#action-gacha-ten");
const mainMenuRoot = document.querySelector("#main-menu");
const rosterView = document.querySelector("#roster-view");
const settingsView = document.querySelector("#settings-view");
const rosterActiveSelect = document.querySelector("#roster-active-select");
const rosterSupport0 = document.querySelector("#roster-support-0");
const rosterSupport1 = document.querySelector("#roster-support-1");
const rosterApplyButton = document.querySelector("#roster-apply");
const rosterSummary = document.querySelector("#roster-summary");
const settingsQuality = document.querySelector("#settings-quality");
const settingsSaveStatus = document.querySelector("#settings-save-status");
const saveExportButton = document.querySelector("#save-export");
const saveImportInput = document.querySelector("#save-import");
const saveResetButton = document.querySelector("#save-reset");
const playModeSelect = document.querySelector("#play-mode");
const playBiomeSelect = document.querySelector("#play-biome");
const playScore = document.querySelector("#play-score");
const playSpeed = document.querySelector("#play-speed");
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

let qualitySetting = "auto";
let savedRecords = {};

const saveSystem = new SaveSystem({
  providers: {
    gachaState: () => gachaController.getState(),
    teamRoster: () => teamManager.getRoster(),
    progression: () => upgradeSystem.getAllProgression(),
    audioSettings: () => audioBridge.getSettings(),
    quality: () => qualitySetting,
    records: () => savedRecords
  },
  appliers: {
    gacha: (state) => {
      if (!state?.economy) return;
      gachaController.state = {
        ...gachaController.state,
        pulls_since_UR: state.gacha?.pity?.pulls_since_UR ?? gachaController.state.pulls_since_UR,
        inventory: state.inventory || gachaController.state.inventory,
        active_batter: state.roster?.active_batter || gachaController.state.active_batter,
        scavenger_scrap: state.economy.scrap,
        fragment_bank: state.economy.fragments
      };
      gachaController._saveState?.();
    },
    team: (state) => {
      teamManager.state = {
        active_batter: state.roster?.active_batter || null,
        supports: Array.isArray(state.roster?.supports)
          ? [state.roster.supports[0] || null, state.roster.supports[1] || null]
          : [null, null]
      };
      teamManager.sync();
    },
    progression: (state) => {
      upgradeSystem.progression = state.progression || {};
      upgradeSystem._save?.();
    },
    audio: (settings) => {
      audioBridge.setVolume(settings.volume);
      audioBridge.setMuted(settings.muted);
    },
    quality: (quality) => {
      qualitySetting = quality || "auto";
      document.documentElement.dataset.quality = qualitySetting;
      if (settingsQuality) settingsQuality.value = qualitySetting;
    },
    records: (records) => {
      savedRecords = records || {};
    }
  }
});

const gameModes = new GameModeManager({
  recordSink: (biome, record) => {
    savedRecords = { ...savedRecords, [biome]: { ...(savedRecords[biome] || {}), ...record } };
    saveSystem.updateRecord(biome, record);
  }
});

const mainMenu = new MainMenu({
  root: mainMenuRoot,
  onNavigate: (view) => setMainMenuView(view),
  onModeChange: (mode) => startGameMode(mode, playBiomeSelect?.value || "cyberpunk"),
  onBiomeChange: (biome) => startGameMode(playModeSelect?.value || "PRACTICE", biome)
});

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
  const progression = upgradeSystem.getProgression(active.character_id);
  const effectiveStats = progression?.stats || canonical.stats || {};
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
      stats: effectiveStats,
      progression: progression || null,
      sprite_url: assets.sprite.sprite_url,
      card_hd_url: assets.card.card_hd_url
    },
    active_batter: {
      character_id: active.character_id,
      stats: effectiveStats,
      progression: progression || null,
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

function updatePlayHud() {
  const state = gameModes.getState();
  if (playScore) playScore.textContent = "SCORE // " + state.score;
  if (playSpeed) playSpeed.textContent = "PITCH ×" + Number(state.pitch_speed_multiplier || 1).toFixed(2);
}

function syncRosterControls() {
  if (!rosterActiveSelect || !rosterSupport0 || !rosterSupport1) return;
  const characters = gachaController.getCharacters().filter((unit) => gachaController.getState().inventory?.[unit.character_id]);
  const addOptions = (select, selected, allowEmpty = false) => {
    select.replaceChildren();
    if (allowEmpty) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "NONE";
      select.appendChild(empty);
    }
    for (const unit of characters) {
      const option = document.createElement("option");
      option.value = unit.character_id;
      option.textContent = unit.canonical?.display_name || unit.character_id;
      option.selected = unit.character_id === selected;
      select.appendChild(option);
    }
  };
  const roster = teamManager.getRoster();
  addOptions(rosterActiveSelect, roster.active_batter, false);
  addOptions(rosterSupport0, roster.supports[0], true);
  addOptions(rosterSupport1, roster.supports[1], true);
  if (rosterSummary) {
    const active = teamManager.getActiveWaifu();
    rosterSummary.textContent = "BATTER // " + (active?.canonical?.display_name || "NONE")
      + " • SUPPORT // " + teamManager.getSupportIds().filter(Boolean).length + "/2";
  }
}

function startGameMode(mode, biome) {
  const state = gameModes.start(mode, biome);
  playModeSelect && (playModeSelect.value = state.mode);
  playBiomeSelect && (playBiomeSelect.value = state.biome);
  updatePlayHud();
  void renderer.setArea(state.biome);
  return state;
}

function simulateLocalTurn() {
  const state = gameModes.getState();
  const roll = Math.random();
  const result = state.mode === "ENDLESS"
    ? (roll < 0.08 ? "HOME_RUN" : roll < 0.45 ? "SINGLE" : roll < 0.68 ? "DOUBLE" : roll < 0.78 ? "TRIPLE" : "OUT")
    : (roll < 0.06 ? "HOME_RUN" : roll < 0.48 ? "SINGLE" : roll < 0.7 ? "DOUBLE" : roll < 0.8 ? "TRIPLE" : "OUT");

  const current = renderer.state?.state || {};
  const dto = {
    type: "TurnResultDTO",
    turn_id: "local-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    result,
    timing: result === "OUT" ? "BAD" : result === "HOME_RUN" ? "PERFECT" : "GOOD",
    event: result === "OUT" ? "SWING" : "HIT",
    area_id: state.biome,
    state: {
      ...current,
      balls: result === "OUT" ? Math.min(3, Number(current.balls || 0) + 1) : 0,
      strikes: result === "OUT" ? Math.min(2, Number(current.strikes || 0) + 1) : 0
    }
  };
  void renderer.applyTurnResult(dto).then(() => {
    gameModes.registerResult(result);
    updatePlayHud();
    saveSystem.save();
  });
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
  if (!api.configured() || !matchId || actionPending) {
    if (!api.configured() && actionType === "BAT") {
      simulateLocalTurn();
    }
    return;
  }
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

gachaTenButton?.addEventListener("click", async () => {
  if (!gachaController.ready || gachaRolling) return;
  gachaRolling = true;
  gachaTenButton.disabled = true;
  try {
    const result = await gachaController.rollGachaTen();
    gallery.refresh();
    updateGachaHud(gachaController.getStatus());
    syncRosterControls();
    if (gachaStatusValue) gachaStatusValue.textContent = "10X // " + Object.entries(result.totals).map(([rarity, count]) => rarity + "×" + count).join(" • ");
    saveSystem.save();
  } catch (error) {
    if (gachaStatusValue) gachaStatusValue.textContent = String(error.message || error).toUpperCase();
    setConnection("Gacha unavailable", "error");
  } finally {
    gachaRolling = false;
    updateGachaHud(gachaController.getStatus());
    gachaTenButton.disabled = false;
  }
});

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
  syncRosterControls();
  saveSystem.save();
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

function setMainMenuView(view) {
  const active = String(view || "combat");
  const showGallery = active === "dex";
  const showRoster = active === "roster";
  const showSettings = active === "settings";
  if (combatShell) combatShell.hidden = !(!showGallery && !showRoster && !showSettings);
  if (galleryView) galleryView.hidden = !showGallery;
  if (rosterView) rosterView.hidden = !showRoster;
  if (settingsView) settingsView.hidden = !showSettings;
  for (const element of combatViewPieces) element.hidden = showGallery || showRoster || showSettings;
  if (active === "gacha") {
    const target = document.querySelector("#action-gacha");
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }
  if (active === "roster") syncRosterControls();
  if (active === "dex") gallery.refresh();
  setTelegramBackButton(showGallery || showRoster || showSettings);
}

function setView(view) {
  setMainMenuView(view === "gallery" ? "dex" : view);
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

rosterApplyButton?.addEventListener("click", () => {
  try {
    const active = rosterActiveSelect?.value;
    const support0 = rosterSupport0?.value || null;
    const support1 = rosterSupport1?.value || null;
    teamManager.setActiveBatter(active);
    teamManager.setSupport(0, support0);
    teamManager.setSupport(1, support1);
    syncRosterControls();
    if (renderer.state) void renderer.setCombatInit(applyActiveRoster(renderer.state));
    saveSystem.save();
    if (settingsSaveStatus) settingsSaveStatus.textContent = "ROSTER // SAVED";
  } catch (error) {
    if (settingsSaveStatus) settingsSaveStatus.textContent = String(error.message || error).toUpperCase();
  }
});

settingsQuality?.addEventListener("change", () => {
  qualitySetting = settingsQuality.value;
  document.documentElement.dataset.quality = qualitySetting;
  saveSystem.save();
  if (settingsSaveStatus) settingsSaveStatus.textContent = "SETTINGS // SAVED";
});

saveExportButton?.addEventListener("click", async () => {
  await saveSystem.exportFile();
  if (settingsSaveStatus) settingsSaveStatus.textContent = "SAVE // EXPORTED";
});

saveImportInput?.addEventListener("change", async () => {
  const file = saveImportInput.files?.[0];
  if (!file) return;
  try {
    await saveSystem.importFile(file);
    gallery.refresh();
    syncRosterControls();
    updateGachaHud(gachaController.getStatus());
    if (settingsSaveStatus) settingsSaveStatus.textContent = "SAVE // IMPORTED";
  } catch (error) {
    if (settingsSaveStatus) settingsSaveStatus.textContent = "IMPORT ERROR // " + String(error.message || error);
  } finally {
    saveImportInput.value = "";
  }
});

saveResetButton?.addEventListener("click", () => {
  saveSystem.reset();
  gachaController.storage?.removeItem?.(gachaController.storageKey);
  teamManager.storage?.removeItem?.(teamManager.storageKey);
  upgradeSystem.storage?.removeItem?.(upgradeSystem.storageKey);
  window.localStorage?.removeItem?.("baseball_waifus_audio_v1");
  window.location.reload();
});

playModeSelect?.addEventListener("change", () => startGameMode(playModeSelect.value, playBiomeSelect?.value || "cyberpunk"));
playBiomeSelect?.addEventListener("change", () => startGameMode(playModeSelect?.value || "PRACTICE", playBiomeSelect.value));

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
    if (saveSystem.storage?.getItem?.(saveSystem.storageKey)) {
      saveSystem.load();
    } else {
      saveSystem.save();
    }
    updateGachaHud(gachaController.getStatus());
    syncRosterControls();
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
mainMenu.mount();
startGameMode("PRACTICE", "cyberpunk");
bootstrap();