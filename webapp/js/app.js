import {
  BaseballWaifusApi,
  TelegramBridge,
  isCombatInitDTO,
  isTurnResultDTO
} from "./api.js";
import { CombatRenderer } from "./combat.js";
import { AudioManager } from "./audioManager.js";
import { Leaderboard } from "./leaderboard.js";
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
import { MainMenu, VIEWS } from "./main_menu.js";
import { MobileHaptics } from "./mobile_haptics.js";
import { PerformanceAdapter } from "./performance_adapter.js";
import {
  getWaifuAssets,
  getWaifu,
  listWaifus,
  initializeWaifuDatabase
} from "./waifu_database.js";
import { LockerRoom } from "./locker_room.js";
import { VoiceSystem } from "./voice_system.js";
import { AdminPanel, INFINITE_SCRAP_VALUE } from "./admin_panel.js";
import { localResultForTimingGrade } from "./timing_ring.js";
import { GachaRecruitmentUI } from "./gacha_recruitment.js";
import { RosterPanel } from "./roster_panel.js";

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
const audioBridge = new AudioManager();
const mobileHaptics = new MobileHaptics();
const performanceAdapter = new PerformanceAdapter();

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
const hudScrapValue = document.querySelector("#hud-scrap");
const audioMuteButton = document.querySelector("#audio-mute");
const audioVolumeSlider = document.querySelector("#audio-volume");
const gachaTenButton = document.querySelector("#action-gacha-ten");
const mainMenuRoot = document.querySelector("#main-menu");
const rosterView = document.querySelector("#roster-view");
const settingsView = document.querySelector("#settings-view");
const lockerView = document.querySelector("#locker-view");
const lockerCanvas = document.querySelector("#locker-canvas");
const lockerSkinSelect = document.querySelector("#locker-skin-select");
const lockerWaifuName = document.querySelector("#locker-waifu-name");
const lockerRapport = document.querySelector("#locker-rapport");
const lockerSkinLabel = document.querySelector("#locker-skin-label");
const lockerPassives = document.querySelector("#locker-passives");
const lockerDaily = document.querySelector("#locker-daily");
const lockerMessage = document.querySelector("#locker-message");
const lockerSkinCatalog = document.querySelector("#locker-skin-catalog");
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
const superSwingButton = document.querySelector("#btn-superswing");
const navRosterButton = document.querySelector("#btn-nav-roster");
const navGachaButton = document.querySelector("#btn-nav-gacha");
const navShopButton = document.querySelector("#btn-nav-shop");
const gachaRecruitmentRoot = document.querySelector("#gacha-recruitment-modal");
const rosterPanelRoot = document.querySelector("#roster-panel");
const leaderboardRoot = document.querySelector("#leaderboard-panel");
const leaderboardClose = document.querySelector("#leaderboard-close");
leaderboardClose?.addEventListener("click", () => { leaderboardRoot?.classList.remove("is-open"); window.setTimeout(() => leaderboardRoot?.setAttribute("hidden", ""), 180); setView("combat"); });
const shopRoot = document.querySelector("#shop-panel");
const adminTriggerButton = document.querySelector("#btn-admin-trigger");
const waifuActiveName = document.querySelector("#waifu-active-name");
const waifuActiveRole = document.querySelector("#waifu-active-role");
const waifuAvatarImg = document.querySelector("#waifu-avatar-img");
const waifuPowerBar = document.querySelector("#waifu-pwr-bar");
const waifuSpeedBar = document.querySelector("#waifu-spd-bar");
const timingFeedback = document.querySelector("#timing-feedback");
const cardRenderer = new CardRenderer({
  root: document.querySelector("#dex-card-stage")
});
const combatShell = document.querySelector(".combat-shell, .game-viewport");
const combatViewPieces = [...document.querySelectorAll(".combat-view-piece")];

let matchId = "";
let actionPending = false;
let gachaRolling = false;
let sharePayload = null;
let adminPanel = null;
let finiteScrapBeforeInfinite = null;

const leaderboard = new Leaderboard({
  storage: window.localStorage,
  cloudStorage,
  playerId: telegramWebApp?.initDataUnsafe?.user?.id || "local-player",
  playerName: telegramWebApp?.initDataUnsafe?.user?.first_name || "PLAYER"
});

const gachaController = new GachaController({
  audioBridge,
  hapticsBridge,
  cloudStorage
});

const gachaRecruitment = new GachaRecruitmentUI({
  root: gachaRecruitmentRoot,
  controller: gachaController,
  audio: audioBridge,
  onResult: (payload) => {
    gallery.refresh();
    updateGachaHud(gachaController.getStatus(), payload?.results?.[0] || null);
    syncRosterControls();
    saveSystem.save();
  }
});

const shopUI = new ShopUI({
  root: shopRoot,
  controller: gachaController,
  webApp: telegramWebApp,
  onBalanceChange: () => updateGachaHud(gachaController.getStatus())
});

const teamManager = new TeamManager({
  storage: gachaController.storage,
  getCharacter: (id) => gachaController.getCharacter(id),
  getInventory: () => gachaController.getState().inventory,
  getExternalActive: () => gachaController.getActiveBatter(),
  persistActiveBatter: (id) => gachaController.setActiveBatter(id)
});

const voiceSystem = new VoiceSystem();

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

const lockerRoom = new LockerRoom({
  voiceSystem,
  getWaifu: (id = null) => {
    if (id) return gachaController.getCharacter(id);
    return teamManager.getActiveWaifu()
      || gachaController.getCharacters().find((unit) => gachaController.getState().inventory?.[unit.character_id])
      || null;
  }
});

function handleScrapEarned({ amount, result }) {
  if (amount <= 0) return;
  leaderboard.record({ homeRuns: String(result).toUpperCase() === "HOME_RUN" ? 1 : 0, scrapEarned: amount });
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
    records: () => savedRecords,
    lockerRoom: () => lockerRoom.getPersistence(),
    adminPanel: () => adminPanel?.getPersistence() || { version: 1, waifu_config: null, infinite_scrap: false }
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
    },
    lockerRoom: (state) => {
      lockerRoom.applyPersistence(state || {});
    },
    adminPanel: (state) => {
      adminPanel?.applyPersistence(state || {});
    }
  }
});

lockerRoom.setSaveSystem(saveSystem);

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

const renderer = new CombatRenderer(document.querySelector("#combat-canvas, #gameCanvas"), {
  audioBridge,
  hapticsBridge,
  onScrapEarned: handleScrapEarned,
  performanceAdapter,
  onTimingResult: (timing) => {
    void sendAction("BAT", timing);
  },
  onTacticalTurn: (event) => {
    if (timingFeedback) {
      timingFeedback.textContent = `TACTICAL ${event.turn}/5 • MOBS ×${event.mob_count} • ENERGY ${event.energy}%`;
    }
    if (event.turn < 5) batButton.disabled = false;
  },
  onClimaxStart: (state) => {
    if (timingFeedback) {
      timingFeedback.textContent = `CLIMAX • META CELL RAY • CORE ${Math.round(state.boss_concentration)}%`;
    }
  },
  getEconomyBoosts: () => ({ scrapMultiplier: shopUI.getScrapMultiplier(), timingGraceMs: shopUI.getTimingGraceMs() }),
  getHudResources: () => ({
    scrap: gachaController.getScavengerScrap(),
    energy: renderer?.state?.energy
      ?? renderer?.state?.state?.energy
      ?? 100
  })
});
gachaController.setCutInRenderer(renderer);
renderer.onEconomyTimingConsumed = () => shopUI.consumeTimingTurn?.();
renderer.onEconomyRewardConsumed = () => shopUI.consumeRewardTurn?.();
const rosterPanel = new RosterPanel({
  root: rosterPanelRoot,
  getCharacters: () => gachaController.getCharacters(),
  getInventory: () => gachaController.getState().inventory || {},
  getActiveId: () => teamManager.getActiveBatterId(),
  onSetActive: async (characterId) => {
    teamManager.setActiveBatter(characterId);
    gachaController.setActiveBatter(characterId);
    const active = teamManager.getActiveWaifu();
    refreshActiveWaifuCard();
    if (renderer.state && active) {
      await renderer.setCombatInit(applyActiveRoster(renderer.state));
    }
    syncRosterControls();
    saveSystem.save();
  }
});


function applyAdminInfiniteScrap(enabled, fromPersistence = false) {
  const current = gachaController.getScavengerScrap();

  if (enabled) {
    if (!fromPersistence && finiteScrapBeforeInfinite === null) {
      finiteScrapBeforeInfinite = current;
    }
    gachaController.state.scavenger_scrap = INFINITE_SCRAP_VALUE;
  } else if (finiteScrapBeforeInfinite !== null) {
    gachaController.state.scavenger_scrap = finiteScrapBeforeInfinite;
    finiteScrapBeforeInfinite = null;
  }

  gachaController._saveState?.();
  updateGachaHud(gachaController.getStatus());
}

function handleAdminCharacterUpdated(character) {
  const id = String(character?.id || "");
  if (!id) return;

  const active = teamManager.getActiveWaifu();
  if (String(active?.character_id || active?.id || "") === id && renderer.state) {
    void renderer.refreshWaifuAssets(id);
  }

  if (!dexInspector?.hidden) {
    const unit = gachaController.getCharacter(id);
    if (unit) {
      cardRenderer.mount(unit, {
        themeColor: unit?.canonical?.visual?.accent || null
      });
    }
  }

  gallery.refresh();
  refreshLockerRoom();
  saveSystem.save();
}

function getAdminCharacter(id) {
  const configCharacter = getWaifu(id);
  if (configCharacter) return configCharacter;
  return gachaController.getCharacter(id) || null;
}

adminPanel = new AdminPanel({
  root: document.body,
  saveSystem,
  getCharacter: getAdminCharacter,
  onCharacterUpdated: handleAdminCharacterUpdated,
  onInfiniteScrapChange: applyAdminInfiniteScrap,
  onScrapGrant: (amount) => {
    const total = gachaController.addScrap(amount);
    updateGachaHud(gachaController.getStatus());
    return total;
  },
  onUnlockAllSkins: () => {
    const ids = [
      ...new Set([
        ...gachaController.getCharacters().map((unit) => unit.character_id),
        ...listWaifus().map((waifu) => waifu.id)
      ])
    ];
    const result = lockerRoom.unlockAllSkins(ids);
    refreshLockerRoom();
    saveSystem.save();
    return result;
  },
  onSuperSwingTest: (character) => renderer.triggerSuperSwingDemo(character),
  onVoiceTest: (character) => voiceSystem.emit("ON_TAP", character)
});

function getActiveLockerWaifu() {
  return teamManager.getActiveWaifu()
    || gachaController.getCharacters().find((unit) => gachaController.getState().inventory?.[unit.character_id])
    || null;
}

function refreshActiveWaifuCard() {
  const active = getActiveLockerWaifu();
  if (!active) return;
  const canonical = active.canonical || {};
  const stats = canonical.stats || {};
  const displayName = canonical.display_name || active.character_id || "WAIFU";
  const role = String(canonical.specialization || canonical.position || canonical.archetype || "WAIFU").toUpperCase();
  if (waifuActiveName) waifuActiveName.textContent = displayName;
  if (waifuActiveRole) waifuActiveRole.textContent = role + " • TYPE-" + String(canonical.rarity || "R");
  if (waifuAvatarImg) {
    const assets = getWaifuAssets(active);
    if (assets.avatarUrl) waifuAvatarImg.src = assets.avatarUrl;
  }
  if (waifuPowerBar) waifuPowerBar.style.width = Math.max(0, Math.min(100, Number(stats.power ?? stats.contact ?? 0))) + "%";
  if (waifuSpeedBar) waifuSpeedBar.style.width = Math.max(0, Math.min(100, Number(stats.speed ?? stats.eye ?? 0))) + "%";
}

function refreshLockerRoom() {
  refreshActiveWaifuCard();
  const active = getActiveLockerWaifu();
  if (active) lockerRoom.setActiveWaifu(active);

  const state = lockerRoom.getState();
  if (lockerWaifuName) {
    lockerWaifuName.textContent = "WAIFU // " + (
      active?.canonical?.display_name
      || active?.display_name
      || active?.name
      || active?.character_id
      || "NONE"
    );
  }
  if (lockerRapport) lockerRapport.textContent = "RAPPORT // " + (state.rapport?.level || 1) + "/10";
  if (lockerSkinLabel) lockerSkinLabel.textContent = "SKIN // " + state.activeSkin.toUpperCase();
  if (lockerPassives) {
    lockerPassives.textContent =
      "PASSIVE // CONTACT +" + Math.round((state.modifiers.contact - 1) * 100) + "% • POWER +" +
      Math.round((state.modifiers.power - 1) * 100) + "%";
  }
  if (lockerDaily) lockerDaily.textContent = "DAILY TAPS // " + state.dailyTaps + "/" + state.dailyTapLimit;
  if (lockerSkinCatalog) {
    lockerSkinCatalog.replaceChildren();
    for (const skinId of state.unlockedSkins) {
      const card = document.createElement("div");
      card.className = "locker-skin-card";
      card.dataset.active = String(skinId === state.activeSkin);
      const skin = lockerRoom.constructor === LockerRoom ? skinId : skinId;
      card.style.setProperty("--locker-accent",
        skinId === "volcano_bikini" ? "#ff4d2f" :
        skinId === "damage_skin" ? "#a855f7" : "#00e5ff"
      );
      card.textContent = skin.replaceAll("_", " ").toUpperCase() + (skinId === state.activeSkin ? " // ACTIVE" : "");
      lockerSkinCatalog.appendChild(card);
    }
  }
}

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
  if (hudScrapValue) hudScrapValue.textContent = String(status.scavenger_scrap);
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
  if (gachaTenButton && !gachaRolling) {
    gachaTenButton.disabled = !status.ready || Number(status.scavenger_scrap) < 10000;
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
  const character = gachaController.getCharacter(id) || { character_id: id, canonical: { display_name: id } };
  const remote = getWaifuAssets(character);
  return {
    card: {
      id,
      card_hd_url: remote.cardArtUrl,
      path: remote.cardArtUrl
    },
    sprite: {
      id,
      sprite_url: remote.spriteSheetUrl,
      path: remote.spriteSheetUrl
    }
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
  batButton.disabled = false;
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

function simulateLocalTurn(timing = {}) {
  const state = gameModes.getState();
  const grade = String(timing.grade || "MISS").toUpperCase();
  const result = localResultForTimingGrade(grade);
  const current = renderer.state?.state || {};
  const isStrike = result === "STRIKE";
  const dto = {
    type: "TurnResultDTO",
    turn_id: "local-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    result,
    timing: grade,
    timing_delta_ms: Number(timing.delta_ms ?? 0),
    event: isStrike ? "SWING" : "HIT",
    area_id: state.biome,
    state: {
      ...current,
      balls: isStrike ? Math.min(3, Number(current.balls || 0) + 1) : 0,
      strikes: isStrike ? Math.min(2, Number(current.strikes || 0) + 1) : 0
    }
  };
  void renderer.applyTurnResult(dto).then(() => {
    gameModes.registerResult(result);
    updatePlayHud();
    saveSystem.save();
    if (timingFeedback) timingFeedback.textContent = grade + " • " + result.replace("_", " ");
    batButton.disabled = false;
  }).catch(() => {
    batButton.disabled = false;
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
  const topHomeScore = document.querySelector("#score-home");
  const topAwayScore = document.querySelector("#score-away");
  const topInning = document.querySelector("#hud-inning");
  const topBalls = document.querySelector("#cnt-balls");
  const topStrikes = document.querySelector("#cnt-strikes");
  const topOuts = document.querySelector("#cnt-outs");
  const topHomeLabel = document.querySelector("#score-home-label");
  const topAwayLabel = document.querySelector("#score-away-label");
  if (topHomeScore) topHomeScore.textContent = String(homeScore);
  if (topAwayScore) topAwayScore.textContent = String(awayScore);
  if (topInning) topInning.textContent = "INNING " + String(inning) + " • " + String(half || "TOP").toUpperCase();
  if (topBalls) topBalls.textContent = String(balls);
  if (topStrikes) topStrikes.textContent = String(strikes);
  if (topOuts) topOuts.textContent = String(outs);
  if (topHomeLabel) topHomeLabel.textContent = homeTeam;
  if (topAwayLabel) topAwayLabel.textContent = awayTeam;
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

async function sendAction(actionType, timing = {}) {
  if (!api.configured() || !matchId || actionPending) {
    if (!api.configured() && actionType === "BAT") {
      simulateLocalTurn(timing);
    } else if (actionType === "BAT") {
      batButton.disabled = false;
    }
    return;
  }

  setActionPending(true);
  try {
    const payload = await api.submitTurnAction(matchId, {
      type: actionType,
      client_time_ms: Date.now(),
      ...(actionType === "BAT"
        ? {
          timing_grade: String(timing.grade || "MISS").toUpperCase(),
          timing_delta_ms: Number(timing.delta_ms ?? 0),
          timing_target_ms: Number(timing.target_ms ?? 0)
        }
        : {})
    });
    if (!isTurnResultDTO(payload)) throw new Error("Server returned an invalid TurnResultDTO");
    await renderer.applyTurnResult(payload);
    if (payload.super_swing === true || payload.animation?.super_swing === true || payload.animation?.event === "SUPER_SWING") {
      lockerRoom.handleEvent("ON_SUPER_SWING", getActiveLockerWaifu());
    }
    if (payload.result === "VICTORY" || payload.match_end === true || payload.state?.match_complete === true) {
      lockerRoom.handleEvent("ON_VICTORY", getActiveLockerWaifu());
    }
    gameModes.registerResult(payload.result);
    updatePlayHud();
    saveSystem.save();
    updateHud({
      ...renderer.state,
      state: payload.state,
      home_team: payload.home_team || renderer.state.home_team,
      away_team: payload.away_team || renderer.state.away_team
    });
    if (timingFeedback) {
      const grade = String(timing.grade || payload.timing || "").toUpperCase();
      timingFeedback.textContent = grade ? grade + " • " + String(payload.result || "").replaceAll("_", " ") : String(payload.result || "");
    }
  } catch (error) {
    setConnection("Action rejected", "error");
    batButton.disabled = false;
  } finally {
    setActionPending(false);
  }
}


batButton.addEventListener("click", () => {
  if (actionPending || renderer.isTimingWindowActive?.()) return;
  const started = renderer.beginTimingWindow?.();
  if (started) {
    batButton.disabled = true;
  }
});

stealButton.addEventListener("click", () => sendAction("STEAL"));
syncButton.addEventListener("click", syncCombat);

superSwingButton?.addEventListener("click", async () => {
  if (actionPending) return;
  superSwingButton.disabled = true;
  try {
    await renderer.triggerSuperSwingDemo(getActiveLockerWaifu());
  } finally {
    window.setTimeout(() => {
      superSwingButton.disabled = false;
    }, 1100);
  }
});

adminTriggerButton?.addEventListener("click", () => {
  adminPanel?.toggle();
});

navRosterButton?.addEventListener("click", () => {
  rosterPanel.open();
});

navGachaButton?.addEventListener("click", () => {
  gachaRecruitment.open();
});

navShopButton?.addEventListener("click", () => {
  shopUI.open();
});

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
  const showLocker = active === "locker";
  const showCombat = !showGallery && !showRoster && !showSettings && !showLocker;
  if (combatShell) combatShell.hidden = !showCombat;
  if (galleryView) galleryView.hidden = !showGallery;
  if (rosterView) rosterView.hidden = !showRoster;
  if (settingsView) settingsView.hidden = !showSettings;
  if (lockerView) lockerView.hidden = !showLocker;
  for (const element of combatViewPieces) {
    element.hidden = !showCombat;
  }
  if (active === "gacha") {
    const target = document.querySelector("#action-gacha");
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }
  if (active === "leaderboard") { leaderboard.render(leaderboardRoot?.querySelector("#leaderboard-list")); leaderboardRoot?.removeAttribute("hidden"); requestAnimationFrame(() => leaderboardRoot?.classList.add("is-open")); }
  if (active === "roster") syncRosterControls();
  if (active === "dex") gallery.refresh();
  if (active === "locker") refreshLockerRoom();
  setTelegramBackButton(showGallery || showRoster || showSettings || showLocker || active === "leaderboard");
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
    lockerRoom.setActiveWaifu(active);
    teamManager.setSupport(0, support0);
    teamManager.setSupport(1, support1);
    syncRosterControls();
    lockerRoom.setActiveWaifu(active);
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
    syncAudioControls();
    updatePlayHud();
    if (settingsSaveStatus) settingsSaveStatus.textContent = "SAVE // IMPORTED";
  } catch (error) {
    if (settingsSaveStatus) settingsSaveStatus.textContent = "IMPORT ERROR // " + String(error.message || error);
  } finally {
    saveImportInput.value = "";
  }
});

lockerSkinSelect?.addEventListener("change", () => {
  const result = lockerRoom.equipSkin(lockerSkinSelect.value);
  if (result.changed) refreshLockerRoom();
});

if (lockerCanvas) {
  lockerRoom.mount(lockerView, {
    canvas: lockerCanvas,
    select: lockerSkinSelect,
    rapportLabel: lockerRapport,
    skinLabel: lockerSkinLabel,
    messageLabel: lockerMessage
  });
}

let lockerFrameHandle = 0;
let lockerLastFrame = performance.now();
function lockerFrame(time) {
  const delta = Math.min(0.08, Math.max(0, (time - lockerLastFrame) / 1000));
  lockerLastFrame = time;
  lockerRoom.update(delta);
  refreshLockerRoom();
  lockerFrameHandle = requestAnimationFrame(lockerFrame);
}
lockerFrameHandle = requestAnimationFrame(lockerFrame);

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

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log("[PWA] ServiceWorker registrado con éxito:", reg.scope))
        .catch((err) => console.warn("[PWA] Fallo en registro de ServiceWorker:", err));
    }, { once: true });
  }
}

function installMobileGestures() {
  mobileHaptics.bindTapFeedback(batButton);
  mobileHaptics.bindSwipe(mainMenuRoot, ({ direction }) => {
    const currentIndex = VIEWS.indexOf(mainMenu.activeView);
    if (currentIndex < 0) return;
    if (direction === "left") {
      mainMenu.nextView();
    } else {
      mainMenu.previousView();
    }
  });
}

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
    if (payload.super_swing === true || payload.animation?.super_swing === true || payload.animation?.event === "SUPER_SWING") {
      lockerRoom.handleEvent("ON_SUPER_SWING", getActiveLockerWaifu());
    }
    if (payload.result === "VICTORY" || payload.match_end === true || payload.state?.match_complete === true) {
      lockerRoom.handleEvent("ON_VICTORY", getActiveLockerWaifu());
    }
    gameModes.registerResult(payload.result);
    updatePlayHud();
    saveSystem.save();
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
    await initializeWaifuDatabase();
    await gachaController.initialize();
    teamManager.sync();
    if (saveSystem.storage?.getItem?.(saveSystem.storageKey)) {
      saveSystem.load();
    } else {
      saveSystem.save();
    }
    refreshLockerRoom();
    syncAudioControls();
    updateGachaHud(gachaController.getStatus());
    syncRosterControls();
    rosterPanel.refresh();
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
installMobileGestures();
registerServiceWorker();
startGameMode("PRACTICE", "cyberpunk");
bootstrap();