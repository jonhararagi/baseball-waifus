import assert from "node:assert/strict";
import {
  NARRATIVE_EVENT,
  NARRATIVE_STATE,
  NarrativeRuntime
} from "./narrative_runtime.js";
import {
  REACTION_SIGNAL,
  ReactionRuleSystem
} from "./reaction_rules.js";

const events = [];
const runtime = new NarrativeRuntime({
  onEvent: (event) => events.push(event)
});

const scene = {
  scene_id: "runtime-test-scene",
  dialogue_lines: [
    { speaker: "Test", text: "Line one." },
    { speaker: "Test", text: "Line two." },
    { speaker: "Test", text: "Line three." },
    { speaker: "Test", text: "Line four." }
  ]
};

const started = runtime.startScene(scene);
assert.equal(started.state, NARRATIVE_STATE.PLAYING);
assert.equal(started.cursor, 0);
assert.equal(events[0].type, NARRATIVE_EVENT.SCENE_STARTED);
assert.equal(runtime.getCurrentLine().text, "Line one.");

runtime.advance();
assert.equal(runtime.getState().cursor, 1);
assert.equal(events.at(-1).type, NARRATIVE_EVENT.DIALOGUE_ADVANCED);

runtime.advance();
assert.equal(runtime.getState().cursor, 2);
assert.equal(runtime.getCurrentLine().text, "Line three.");

runtime.skip();
assert.equal(runtime.getState().state, NARRATIVE_STATE.SKIPPED);
assert.equal(runtime.isFinished(), true);
assert.equal(events.at(-2).type, NARRATIVE_EVENT.SKIP);
assert.equal(events.at(-1).type, NARRATIVE_EVENT.SCENE_COMPLETED);

const completionEvents = [];
const completionRuntime = new NarrativeRuntime({
  onEvent: (event) => completionEvents.push(event.type)
});
completionRuntime.startScene({
  scene_id: "completion-test",
  dialogue_lines: [
    { speaker: "Test", text: "A" },
    { speaker: "Test", text: "B" }
  ]
});
completionRuntime.advance();
completionRuntime.advance();
assert.equal(completionRuntime.getState().state, NARRATIVE_STATE.COMPLETED);
assert.deepEqual(completionEvents, [
  NARRATIVE_EVENT.SCENE_STARTED,
  NARRATIVE_EVENT.DIALOGUE_ADVANCED,
  NARRATIVE_EVENT.DIALOGUE_COMPLETED,
  NARRATIVE_EVENT.SCENE_COMPLETED
]);

const reactionSystem = new ReactionRuleSystem({
  now: () => 1000
});
const reaction = reactionSystem.trigger({
  signal: REACTION_SIGNAL.SKIP,
  characterId: "azusa",
  context: "dialogue"
});
assert.equal(reaction?.reaction, "REACTION_SKIP");

const noReactionAfterOnce = reactionSystem.trigger({
  signal: REACTION_SIGNAL.SKIP,
  characterId: "azusa",
  context: "dialogue"
});
assert.equal(noReactionAfterOnce, null);

console.log("narrative_runtime_test: ok");
