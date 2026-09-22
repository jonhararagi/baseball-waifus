import assert from "node:assert/strict";
import { isCombatInitDTO, isTurnResultDTO } from "./api.js";

const combatInit = {
  type: "CombatInitDTO",
  match_id: "match-001",
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
  home_team: { name: "HOME", score: 0 },
  away_team: { name: "AWAY", score: 0 },
  batter: { id: "bw001", card_id: "bw001" },
  pitcher: { id: "bw002", card_id: "bw002" },
  assets: {
    cards: [
      { id: "bw001", path: "./assets/demo-characters/bw001.svg" },
      { id: "bw002", path: "./assets/demo-characters/bw002.svg" }
    ],
    sprites: [
      { id: "bw001", path: "./assets/demo-characters/bw001.svg" },
      { id: "bw002", path: "./assets/demo-characters/bw002.svg" }
    ]
  }
};

const turnResult = {
  type: "TurnResultDTO",
  turn_id: "turn-001",
  result: "SINGLE",
  timing: "GREAT",
  state: combatInit.state
};

assert.equal(
  combatInit.batter.id === "bw001"
  && combatInit.pitcher.id === "bw002"
  && combatInit.assets.cards.length === 2
  && combatInit.assets.sprites.length === 2,
  true
);

assert.equal(isCombatInitDTO(combatInit), true);
assert.equal(isCombatInitDTO({ ...combatInit, type: "invalid" }), false);
assert.equal(isCombatInitDTO(null), false);

assert.equal(isTurnResultDTO(turnResult), true);
assert.equal(isTurnResultDTO({ ...turnResult, result: 42 }), false);
assert.equal(isTurnResultDTO(null), false);

console.log("[webapp-contract] DTO validation passed");
