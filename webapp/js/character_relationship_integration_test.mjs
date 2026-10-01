import assert from "node:assert/strict";
import fs from "node:fs";
import { CharacterDetailView } from "./character_detail_view.js";
import { NarrativePresentation } from "./narrative_presentation.js";
import { getCharacterStoryBinding } from "./character_story_bindings.js";
import { LockerRoom } from "./locker_room.js";
import { SaveSystem } from "./save_system.js";
import { VoiceSystem } from "./voice_system.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

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
    this.classList = { toggle() {} };
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
  constructor() { super(); this.elements = new Map(); }
  querySelector(selector) {
    if (!this.elements.has(selector)) this.elements.set(selector, new FakeElement());
    return this.elements.get(selector);
  }
}

globalThis.document = { createElement: () => new FakeElement() };

const appSource = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(appSource, /#locker-character-detail/);
assert.match(appSource, /characterDetailView\.open\(id\)/);
assert.match(indexSource, /id="locker-character-detail"/);

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
assert.ok(story?.scene?.participants?.includes("bw001"));
assert.ok(story.scene.dialogue_lines.some(
  (line) => line.character_id === "bw001" && line.speaker === "Aiko Hanamori"
));

const storage = new MemoryStorage();
const voiceSystem = new VoiceSystem({
  audioFactory: () => ({
    readyState: 3,
    pause() {},
    play() { return Promise.resolve(); },
    volume: 1,
    src: ""
  })
});
const voiceEvents = [];
const originalEmit = voiceSystem.emit.bind(voiceSystem);
voiceSystem.emit = (event, character) => {
  voiceEvents.push({ event, characterId: character?.character_id || null });
  return originalEmit(event, character);
};

let locker;
const saveSystem = new SaveSystem({
  storage,
  providers: {
    gachaState: () => ({
      scavenger_scrap: 0,
      fragment_bank: 0,
      pulls_since_UR: 0,
      inventory: {
        bw001: {
          character_id: "bw001",
          display_name: "Aiko Hanamori",
          rarity: "R"
        }
      }
    }),
    teamRoster: () => ({ active_batter: "bw001", supports: [null, null] }),
    progression: () => ({}),
    audioSettings: () => ({ volume: 0.8, muted: false }),
    quality: () => "auto",
    records: () => ({}),
    lockerRoom: () => locker.getPersistence()
  },
  appliers: {
    lockerRoom: (state) => locker.applyPersistence(state)
  }
});

locker = new LockerRoom({
  saveSystem,
  getWaifu: (id) => id === "bw001" ? aiko : null,
  voiceSystem
});
locker.applyPersistence({
  active_waifu_id: "bw001",
  rapport: {
    bw001: {
      level: 4,
      unlocked_skins: ["uniform_default"],
      active_skin: "uniform_default"
    }
  },
  daily: { date: "", taps: 0 }
});
saveSystem.save();

let relationshipContext = null;
let enteredLockerId = null;
const detailRoot = new FakeRoot();
const detail = new CharacterDetailView({
  root: detailRoot,
  getCharacter: () => aiko,
  getInventoryEntry: () => ({ unlocked: true, quantity: 1 }),
  getProgression: () => ({ level: 1, star_rank: 0, duplicate_count: 1 }),
  getRoster: () => ({ activeBatter: "bw001" }),
  getStoryEntry: getCharacterStoryBinding,
  getRelationshipContext: () => relationshipContext,
  onLocker: (id) => {
    enteredLockerId = id;
    locker.setActiveWaifu(aiko);
    return true;
  }
});
detail.mount();
detail.open("bw001");

assert.equal(detail.model.id, "bw001");
assert.equal(detail.model.name, "Aiko Hanamori");
assert.equal(detail.model.relationship.storyStatus, "NOT SEEN");
assert.equal(detailRoot.querySelector("#character-detail-locker-open").hidden, false);
assert.equal(detailRoot.querySelector("#character-detail-locker-open").disabled, false);

const presentation = new NarrativePresentation({
  root: null,
  voiceSystem,
  character: aiko,
  onComplete: (payload) => {
    relationshipContext = {
      characterId: payload.character.character_id,
      storyStatus: payload.state.state === "COMPLETED" ? "COMPLETED" : "SEEN",
      storyCompleted: payload.state.state === "COMPLETED",
      sceneId: payload.scene.scene_id
    };
    detail.refresh();
  }
});

presentation.start(story.scene);
while (!presentation.runtime.isFinished()) presentation.advance();

assert.equal(relationshipContext.characterId, "bw001");
assert.equal(relationshipContext.storyStatus, "COMPLETED");
assert.equal(relationshipContext.storyCompleted, true);
assert.equal(detail.model.relationship.storyCompleted, true);
assert.equal(detail.model.story.status, "COMPLETED");
assert.equal(
  detailRoot.querySelector("#character-detail-relationship-context").textContent,
  "STORY COMPLETE // RELATIONSHIP CONTEXT READY"
);
assert.equal(
  detailRoot.querySelector("#character-detail-locker-open").textContent,
  "LOCKER // CONTINUE CONNECTION"
);

detailRoot.querySelector("#character-detail-locker-open").click();
assert.equal(enteredLockerId, "bw001");
assert.equal(locker.getActiveWaifuId(), "bw001");
assert.equal(locker.getRapport("bw001"), 4, "Story completion must not mutate rapport");

saveSystem.load();
assert.equal(locker.getRapport("bw001"), 4, "Persisted rapport must survive story context navigation");
assert.equal(locker.getActiveWaifuId(), "bw001");

assert.equal(locker.handleEvent("ON_TOUCH_LOCKER", aiko), true);
assert.ok(voiceEvents.some(
  (event) => event.event === "ON_TOUCH_LOCKER" && event.characterId === "bw001"
));
assert.equal(locker.handleEvent("SKIP", aiko), true);
assert.ok(voiceEvents.some(
  (event) => event.event === "REACTION_SKIP" && event.characterId === "bw001"
));

assert.equal(locker.getActiveWaifuId(), "bw001");

console.log("character_relationship_integration_test: PASS");
