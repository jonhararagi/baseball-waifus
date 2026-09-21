import {
  BaseballWaifusApi,
  TelegramBridge,
  isCombatInitDTO,
  isTurnResultDTO
} from "./api.js";
import { CombatRenderer } from "./combat.js";

const telegram = new TelegramBridge();
telegram.init();

const api = new BaseballWaifusApi({ telegramBridge: telegram });
const renderer = new CombatRenderer(document.querySelector("#combat-canvas"));

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

let matchId = "";
let actionPending = false;

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

renderer.initialize();

const query = new URLSearchParams(window.location.search);
matchId = query.get("match") || "";

if (!api.configured()) {
  setConnection(
    telegram.isAvailable() ? "Telegram connected" : "Web client ready",
    "ok"
  );
  setLoading(true, "Waiting for an authoritative combat payload.");
} else {
  syncCombat();
}
