import assert from "node:assert/strict";
import { NARRATIVE_EVENT } from "./narrative_runtime.js";
import { NarrativePresentation } from "./narrative_presentation.js";

const events = [];
const fakeVoice = {
  getDialogue: (character, event) => character.dialogue?.[event] || "",
  emit: async (event, character) => {
    events.push({ event, characterId: character.character_id });
    return { ok: true, method: "test" };
  }
};

const presentation = new NarrativePresentation({
  voiceSystem: fakeVoice,
  character: {
    character_id: "azusa",
    canonical: { display_name: "Azusa" },
    dialogue: {
      REACTION_SKIP: "¿Me estás prestando atención?!"
    }
  }
});

const runtimeEvents = [];
presentation.runtime.onEvent = (event) => {
  runtimeEvents.push(event.type);
  presentation._handleEvent(event);
};

presentation.start({
  scene_id: "presentation-test",
  dialogue_lines: [
    { speaker: "Test", text: "One" },
    { speaker: "Test", text: "Two" },
    { speaker: "Test", text: "Three" }
  ]
});
presentation.advance();
presentation.advance();
presentation.skip();

assert.equal(runtimeEvents.includes(NARRATIVE_EVENT.SKIP), true);
assert.equal(
  presentation.reactionMessage,
  "¿Me estás prestando atención?!"
);
assert.deepEqual(events, [
  { event: "REACTION_SKIP", characterId: "azusa" }
]);

console.log("narrative_presentation_test: ok");
