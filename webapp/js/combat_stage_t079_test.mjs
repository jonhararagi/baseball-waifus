import assert from "node:assert/strict";
import { CombatStage, createCombatStageActors, COMBAT_STAGE_DEPTH, COMBAT_STAGE_SET_PIECES } from "./combat_stage.js";
import { CombatPresentationDirector } from "./combat_presentation_director.js";

const stage = new CombatStage({
  actors: createCombatStageActors({
    batter: { id: "bw001", name: "Aiko Hanamori" },
    enemy: { id: "enemy-fixture", name: "Enemy Fixture" }
  })
});
const snapshot = stage.getState();
assert.equal(snapshot.contract, "COMBAT_STAGE_2_5D");
assert.equal(snapshot.filmable, true);
assert.equal(snapshot.actorCount, 5);
assert.equal(snapshot.playerCount, 4);
assert.equal(snapshot.enemyCount, 1);
assert.deepEqual(snapshot.depthModel, ["FAR", "MID", "NEAR"]);
assert.ok(new Set(snapshot.actorDepths).size >= 2);
assert.ok(new Set(snapshot.actorElevations).size >= 2);
assert.ok(COMBAT_STAGE_SET_PIECES.every((id) => snapshot.setPieces.some((piece) => piece.id === id)));
assert.equal(stage.getActor("bw001").facing, 1);
assert.equal(stage.getActor("enemy-fixture").facing, -1);
assert.ok(stage.getActor("fixture-player-02").elevation > 0);
assert.ok(stage.getActorAnchor("enemy-fixture", "IMPACT"));
assert.ok(stage.getActorAnchor("enemy-fixture", "REACTION"));

const director = new CombatPresentationDirector({ stage });
director.startFromCombatResult({ attackerId: "bw001", targetId: "enemy-fixture", result: "HIT", damage: 10, actionType: "SWING" });
const focus = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(focus.cameraAnchor, "PLAYER_FOCUS");
assert.equal(focus.cameraSource, "ACTOR");

director.update(0.29);
const action = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(action.phase, "ACTION");
assert.equal(action.cameraAnchor, "ACTION");
assert.equal(action.cameraSource, "ACTOR");

director.update(0.23);
const impact = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(impact.phase, "IMPACT");
assert.equal(impact.cameraAnchor, "IMPACT");
assert.equal(impact.cameraSource, "ACTOR");

director.update(0.18);
const reaction = director.getCameraTransform({ width: 720, height: 1280 });
assert.equal(reaction.phase, "TARGET_REACTION");
assert.equal(reaction.cameraAnchor, "REACTION");
assert.equal(reaction.cameraSource, "ACTOR");

director.update(0.3);
assert.equal(director.getCameraTransform({ width: 720, height: 1280 }).phase, "COMBAT_RETURN");
director.update(0.3);
assert.equal(director.getState().phase, "COMPLETE");
assert.equal(director.getState().active, false);
console.log("T079 combat stage cinematic route: PASS");
