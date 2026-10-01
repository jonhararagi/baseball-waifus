import assert from "node:assert/strict";
import { CharacterDetailView } from "./character_detail_view.js";
import { NarrativePresentation } from "./narrative_presentation.js";
import { getCharacterStoryBinding } from "./character_story_bindings.js";

class FakeElement {
  constructor() {
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.src = "";
    this.alt = "";
    this.title = "";
    this.dataset = {};
    this.listeners = {};
    this.childNodes = [];
  }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  click() { this.listeners.click?.({ target: this }); }
  removeAttribute() { this.hidden = false; }
  setAttribute(name) { if (name === "hidden") this.hidden = true; }
  replaceChildren(...children) { this.childNodes = [...children]; }
  appendChild(child) { this.childNodes.push(child); return child; }
  append(...children) { this.childNodes.push(...children); }
}
class FakeRoot extends FakeElement {
  constructor() {
    super();
    this.elements = new Map();
    this.classList = { toggle() {} };
  }
  querySelector(selector) {
    if (!this.elements.has(selector)) this.elements.set(selector, new FakeElement());
    return this.elements.get(selector);
  }
}

globalThis.document = { createElement: () => new FakeElement() };

const aiko = {
  character_id: "bw001",
  canonical: {
    display_name: "Aiko Hanamori",
    rarity: "R",
    position: "3B",
    specialization: "power",
    element: "fire",
    faction: "bosozoku_wild",
    stats: { power: 72, contact: 64, speed: 51 },
    identity: {
      archetype: "powerful_firebrand",
      play_identity: "big_swing_threat",
      style_tags: ["power", "sporty", "warm", "competitive"],
      signature_action_ids: [],
      skill_roles: ["attack"],
      story_status: "none",
      story_hook: ""
    }
  }
};

const story = getCharacterStoryBinding("bw001");
assert.equal(story?.characterId, "bw001");
assert.equal(story?.sceneId, "arc0-team11-recruitment");
assert.equal(story?.scene?.participants.includes("bw001"), true);
assert.equal(story.scene.dialogue_lines.some(
  (line) => line.character_id === "bw001" && line.speaker === "Aiko Hanamori"
), true);

const detailRoot = new FakeRoot();
let storyEntry = null;
const detail = new CharacterDetailView({
  root: detailRoot,
  getCharacter: () => aiko,
  getInventoryEntry: () => ({ character_id: "bw001", duplicate_count: 1 }),
  getProgression: () => ({ level: 1, star_rank: 0, duplicate_count: 1 }),
  getStoryEntry: getCharacterStoryBinding,
  onStory: (characterId, entry) => { storyEntry = { characterId, entry }; }
});
detail.mount();
detail.open("bw001");

const storyButton = detailRoot.querySelector("#character-detail-story-open");
assert.equal(storyButton.hidden, false);
assert.equal(storyButton.disabled, false);
assert.equal(detail.model.unlocked, true);
assert.equal(detail.model.relationship.status, "RECRUITED");
assert.match(storyButton.textContent, /TEAM 11/);
storyButton.click();
assert.equal(storyEntry?.characterId, "bw001");
assert.deepEqual(storyEntry?.entry, {
  id: story.id,
  label: story.label,
  title: story.title,
  status: story.status,
  hook: story.hook,
  sceneId: story.sceneId
});

const voiceEvents = [];
const completionEvents = [];
const presentation = new NarrativePresentation({
  root: null,
  character: {
    character_id: "bw001",
    canonical: { display_name: "Aiko Hanamori" },
    dialogue: { REACTION_SKIP: "Aiko reacts to a skipped line." }
  },
  voiceSystem: {
    getDialogue: (character, event) => character.dialogue?.[event] || "",
    emit: async (event, character) => {
      voiceEvents.push({ event, characterId: character.character_id });
      return { ok: true, method: "test" };
    }
  },
  onComplete: (payload) => completionEvents.push(payload)
});

presentation.start(story.scene);
presentation.advance();
assert.equal(presentation.runtime.getCurrentLine().character_id, "bw001");
presentation.skip();

assert.deepEqual(voiceEvents, [{ event: "REACTION_SKIP", characterId: "bw001" }]);
assert.equal(completionEvents.length, 1);
assert.equal(completionEvents[0].character.character_id, "bw001");
assert.equal(completionEvents[0].state.state, "SKIPPED");

const completionPresentation = new NarrativePresentation({
  root: null,
  character: { character_id: "bw001", canonical: { display_name: "Aiko Hanamori" } },
  onComplete: (payload) => completionEvents.push(payload)
});
completionPresentation.start(story.scene);
while (!completionPresentation.runtime.isFinished()) completionPresentation.advance();

assert.equal(completionEvents.length, 2);
assert.equal(completionEvents.at(-1).state.state, "COMPLETED");

console.log("character_narrative_integration_test: PASS");
