import {
  BaseballWaifusApi,
  TelegramBridge,
  isCombatInitDTO,
  isTurnResultDTO
} from "./api.js";
import { CombatRenderer } from "./combat.js";
import { createAudioBridge } from "./audio.js";
import {
  GachaController,
  exposeGachaToWindow
} from "./gacha_controller.js";

const telegram = new TelegramBridge();
telegram.init();

const api = new BaseballWaifusApi({ telegramBridge: telegram });
const audioBridge = createAudioBridge();
const renderer = new CombatRenderer(document.querySelector("#combat-canvas"), {
  audioBridge
});

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
const gachaDexValue = document.querySelector("#gacha-dex");
const gachaStatusValue = document.querySelector("#gacha-status");

let matchId = "";
let actionPending = false;

const gachaController = new GachaController({
  audioBridge,
  cutInRenderer: renderer
});
exposeGachaToWindow(gachaController);

function updateGachaHud(status, result = null) {
  if (!status) {
    return;
  }

  if (gachaPullValue) {
    gachaPullValue.textContent = `${status.pulls_since_UR}/80`;
  }
  if (gachaDexValue) {
    gachaDexValue.textContent = String(status.inventory_size);
  }
  if (gachaStatusValue) {
    gachaStatusValue.textContent = result
      ? `${result.rarity} • ${result.character.canonical?.display_name || result.character.character_id}`
      : (status.ready ? "READY" : "LOADING");
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
  if (loadingDetail && detail) {
    loadingDetail.textContent = detail;
  }
}

function createDemoCombatInit() {
  return {
    type: "CombatInitDTO",
    match_id: "demo-bw001-vs-bw002",
    state: {
      inning: 1,
      half: "TOP",
      outs: 0,
      balls: 0,
      strikes: 0,
      bases: {
        first: false,
        second: false,
        third: false
      }
    },
    home_team: {
      id: "demo-home",
      name: "Kurose Eleven",
      score: 0
    },
    away_team: {
      id: "demo-away",
      name: "Hanamori Stars",
      score: 0
    },
    batter: {
      id: "bw001",
      name: "Aiko Hanamori",
      card_id: "bw001",
      element: "fire",
      rarity: "R",
      faction: "bosozoku_wild"
    },
    pitcher: {
      id: "bw002",
      name: "Reina Kurose",
      card_id: "bw002",
      element: "ice",
      rarity: "SSR",
      faction: "shadow_magic"
    },
    assets: {
      cards: [
        {
          id: "bw001",
          card_hd_url: "./assets/production/cards/bw001--normal.jpg",
          path: "./assets/production/cards/bw001--normal.jpg"
        },
        {
          id: "bw002",
          card_hd_url: "./assets/production/cards/bw002--normal.jpg",
          path: "./assets/production/cards/bw002--normal.jpg"
        }
      ],
      sprites: [
        {
          id: "bw001",
          sprite_url: "./assets/production/sprites/bw001_idle.png",
          path: "./assets/production/sprites/bw001_idle.png"
        },
        {
          id: "bw002",
          sprite_url: "./assets/production/sprites/bw002_idle.png",
          path: "./assets/production/sprites/bw002_idle.png"
        }
      ]
    }
  };
}

async function initializeDefaultDemo() {
  if (api.configured() || renderer.matchReady) {
    return false;
  }

  const demoInitDTO = createDemoCombatInit();
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

  inningValue.textContent = half ? `${inning} • ${half}` : String(inning);
  countValue.textContent = `${balls}-${strikes}`;
  outsValue.textContent = String(outs);
  awayValue.textContent = awayTeam;
  homeValue.textContent = homeTeam;
  scoreValue.textContent = `${awayScore} - ${homeScore}`;
}

function setActionPending(pending) {
  actionPending = pending;
  batButton.disabled = pending;
  stealButton.disabled = pending;
}

async function syncCombat() {
  if (!api.configured()) {
    setConnection(
      telegram.isAvailable() ? "Telegram connected" : "Web client ready",
      "ok"
    );
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
    if (!isCombatInitDTO(payload)) {
      throw new Error("Server returned an invalid CombatInitDTO");
    }

    await renderer.setCombatInit(payload);
    updateHud(payload);
    setConnection(
      telegram.isAvailable() ? "Telegram connected" : "Web client ready",
      "ok"
    );
    setLoading(false);
  } catch (error) {
    setConnection("Combat sync failed", "error");
    setLoading(true, String(error.message || error));
  }
}

async function sendAction(actionType) {
  if (!api.configured() || !matchId || actionPending) {
    return;
  }

  setActionPending(true);

  try {
    const payload = await api.submitTurnAction(matchId, {
      type: actionType,
      client_time_ms: Date.now()
    });

    if (!isTurnResultDTO(payload)) {
      throw new Error("Server returned an invalid TurnResultDTO");
    }

    await renderer.applyTurnResult(payload);
    updateHud({
      ...renderer.state,
      state: payload.state,
      home_team: payload.home_team || renderer.state.home_team,
      away_team: payload.away_team || renderer.state.away_team
    });
  } catch (error) {
    setConnection("Action rejected", "error");
  } finally {
    setActionPending(false);
  }
}

batButton.addEventListener("click", () => sendAction("BAT"));
stealButton.addEventListener("click", () => sendAction("STEAL"));
syncButton.addEventListener("click", syncCombat);

gachaButton?.addEventListener("click", async () => {
  if (!gachaController.ready) {
    return;
  }

  gachaButton.disabled = true;
  try {
    const result = await gachaController.rollGacha();
    updateGachaHud(gachaController.getStatus(), result);
  } catch (error) {
    if (gachaStatusValue) {
      gachaStatusValue.textContent = "ERROR";
    }
    setConnection("Gacha failed", "error");
  } finally {
    gachaButton.disabled = false;
  }
});

gachaController.subscribe((status, result) => {
  updateGachaHud(status, result);
});

window.addEventListener("message", async (event) => {
  const payload = event.data;

  if (isCombatInitDTO(payload)) {
    await renderer.setCombatInit(payload);
    updateHud(payload);
    setConnection("Embedded match ready", "ok");
    setLoading(false);
    return;
  }

  if (isTurnResultDTO(payload)) {
    await renderer.applyTurnResult(payload);
    updateHud({
      ...renderer.state,
      state: payload.state
    });
    setConnection("Turn received", "ok");
    setLoading(false);
  }
});

async function bootstrap() {
  const query = new URLSearchParams(window.location.search);
  matchId = query.get("match") || "";

  try {
    await gachaController.initialize();
    updateGachaHud(gachaController.getStatus());
  } catch (error) {
    gachaButton.disabled = true;
    if (gachaStatusValue) {
      gachaStatusValue.textContent = "OFFLINE";
    }
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
