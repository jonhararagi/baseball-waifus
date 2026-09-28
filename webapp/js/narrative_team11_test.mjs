import assert from "node:assert/strict";
import {
  NARRATIVE_EVENT,
  NARRATIVE_STATE,
  NarrativeRuntime
} from "./narrative_runtime.js";
import { REACTION_SIGNAL, ReactionRuleSystem } from "./reaction_rules.js";
import { ARC0_TEAM11_RECRUITMENT } from "./narrative_arc0_team11.js";

const rosterIds = new Set(["bw001", "bw003", "bw008"]);
const events = [];
const runtime = new NarrativeRuntime({
  onEvent: (event) => events.push(event)
});

const started = runtime.startScene(ARC0_TEAM11_RECRUITMENT);

assert.equal(started.state, NARRATIVE_STATE.PLAYING);
assert.equal(started.cursor, 0);
assert.equal(ARC0_TEAM11_RECRUITMENT.dialogue_lines.length, 24);

const participantRosterIds = ARC0_TEAM11_RECRUITMENT.participants.filter((id) => rosterIds.has(id));
assert.deepEqual(participantRosterIds, ["bw001", "bw003", "bw008"]);

for (const id of participantRosterIds) {
  assert.equal(
    ARC0_TEAM11_RECRUITMENT.dialogue_lines.some((line) => line.character_id === id),
    true
  );
}

assert.equal(runtime.getCurrentLine().character_id, "protagonist");

const seenCharacters = new Set();
while (!runtime.isFinished()) {
  const line = runtime.getCurrentLine();
  if (line?.character_id) seenCharacters.add(line.character_id);
  runtime.advance();
}

assert.equal(seenCharacters.has("bw001"), true);
assert.equal(seenCharacters.has("bw003"), true);
assert.equal(seenCharacters.has("bw008"), true);
assert.equal(runtime.getState().state, NARRATIVE_STATE.COMPLETED);
assert.equal(events.at(-1).type, NARRATIVE_EVENT.SCENE_COMPLETED);

const skipRuntime = new NarrativeRuntime();
skipRuntime.startScene(ARC0_TEAM11_RECRUITMENT);
skipRuntime.advance();
skipRuntime.skip();
assert.equal(skipRuntime.getState().state, NARRATIVE_STATE.SKIPPED);
assert.equal(skipRuntime.isFinished(), true);

const reactionSystem = new ReactionRuleSystem({
  now: () => 1000
});
const reaction = reactionSystem.trigger({
  signal: REACTION_SIGNAL.SKIP,
  characterId: "azusa",
  context: "dialogue"
});
assert.equal(reaction?.reaction, "REACTION_SKIP");

console.log("narrative_team11_test: ok");
