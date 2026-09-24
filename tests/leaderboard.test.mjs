import assert from "node:assert/strict";
import { Leaderboard } from "../webapp/js/leaderboard.js";
const storage={data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}};
const board=new Leaderboard({storage,playerId:"p1",playerName:"Cari"});
board.record({homeRuns:2,scrapEarned:200}); board.record({homeRuns:1,scrapEarned:50});
const row=board.getPlayer(); assert.equal(row.home_runs,3); assert.equal(row.scrap_earned,250);
assert.equal(board.getEntries()[0].player_id,"p1");
console.log("✅ Leaderboard tests passed.");
