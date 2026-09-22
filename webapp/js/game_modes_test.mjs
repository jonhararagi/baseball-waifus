import assert from "node:assert/strict";
import { GameModeManager } from "./game_modes.js";

const records = [];
const manager = new GameModeManager({
  basePitchSpeed: 1,
  speedGrowth: 0.1,
  recordSink: (biome, record) => records.push({ biome, record })
});

manager.start("PRACTICE", "beach");
assert.equal(manager.getPitchSpeed(), 1);
manager.registerResult("HOME_RUN");
assert.equal(manager.getScore(), 300);
assert.equal(manager.getPitchSpeed(), 1);

manager.start("ENDLESS", "volcano");
manager.registerResult("HIT");
assert.equal(manager.getScore(), 100);
assert.equal(manager.getPitchSpeed(), 1.1);
manager.registerResult("HOME_RUN");
assert.equal(manager.getScore(), 400);
assert.equal(manager.getPitchSpeed(), 1.2);
assert.equal(manager.getState().difficulty_step, 2);
assert.equal(manager.getState().total_hits, 2);
assert.equal(manager.getState().home_runs, 1);
assert.equal(records.length > 0, true);
assert.equal(records.at(-1).biome, "volcano");

console.log("game_modes_test: ok");
