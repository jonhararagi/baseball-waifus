import {
  NARRATIVE_EVENT,
  NarrativeRuntime
} from "./narrative_runtime.js";
import {
  REACTION_SIGNAL,
  ReactionRuleSystem
} from "./reaction_rules.js";
import { ARC0_PROLOGUE_TEAM11 } from "./narrative_arc0_prologue.js";

export class NarrativePresentation {
  constructor({
    root = null,
    voiceSystem = null,
    reactionRules = new ReactionRuleSystem(),
    character = { character_id: "azusa", canonical: { display_name: "Azusa" } },
    onComplete = null,
    onExit = null
  } = {}) {
    this.root = root;
    this.voiceSystem = voiceSystem;
    this.reactionRules = reactionRules;
    this.character = character;
    this.onComplete = typeof onComplete === "function" ? onComplete : null;
    this.onExit = typeof onExit === "function" ? onExit : null;
    this.reactionMessage = "";
    this._completionNotified = false;
    this.runtime = new NarrativeRuntime({
      onEvent: (event) => this._handleEvent(event)
    });
    this.elements = {};
  }

  mount() {
    if (!this.root || typeof document === "undefined") return this;
    this.root.hidden = false;
    this.root.replaceChildren();

    const panel = document.createElement("div");
    panel.className = "narrative-test-panel";

    const eyebrow = document.createElement("div");
    eyebrow.className = "narrative-test-eyebrow";
    eyebrow.textContent = "CHARACTER STORY // ARC 0";

    const speaker = document.createElement("div");
    speaker.className = "narrative-test-speaker";

    const text = document.createElement("div");
    text.className = "narrative-test-text";
    text.setAttribute("aria-live", "polite");

    const status = document.createElement("div");
    status.className = "narrative-test-status";

    const reaction = document.createElement("div");
    reaction.className = "narrative-test-reaction";
    reaction.setAttribute("aria-live", "polite");

    const controls = document.createElement("div");
    controls.className = "narrative-test-controls";

    const advanceButton = document.createElement("button");
    advanceButton.type = "button";
    advanceButton.className = "action-button action-primary";
    advanceButton.textContent = "ADVANCE";
    advanceButton.addEventListener("click", () => this.advance());

    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.className = "action-button action-secondary";
    skipButton.textContent = "SKIP";
    skipButton.addEventListener("click", () => this.skip());

    const returnButton = document.createElement("button");
    returnButton.type = "button";
    returnButton.className = "action-button action-secondary";
    returnButton.textContent = "RETURN TO CHARACTER";
    returnButton.addEventListener("click", () => this.exit());

    controls.append(advanceButton, skipButton, returnButton);
    panel.append(eyebrow, speaker, text, reaction, status, controls);
    this.root.appendChild(panel);

    this.elements = { speaker, text, status, reaction, advanceButton, skipButton, returnButton };
    this._render();
    return this;
  }

  setCharacter(character = null) {
    if (character && typeof character === "object") this.character = character;
    return this.character;
  }

  start(scene) {
    this.reactionMessage = "";
    this._completionNotified = false;
    const activeScene = scene?.scene_id === "narrative-runtime-vertical-slice"
      ? ARC0_PROLOGUE_TEAM11
      : scene;
    return this.runtime.startScene(activeScene);
  }

  advance() {
    return this.runtime.advance();
  }

  skip() {
    return this.runtime.skip();
  }

  close() {
    if (this.root) this.root.hidden = true;
    return this;
  }

  exit() {
    this.close();
    this.onExit?.({ character: this.character, state: this.runtime.getState() });
    return this.runtime.getState();
  }

  _handleEvent(event) {
    if (event.type === NARRATIVE_EVENT.SCENE_COMPLETED && !this._completionNotified) {
      this._completionNotified = true;
      this.onComplete?.({ character: this.character, scene: this.runtime.scene, state: this.runtime.getState() });
    }
    if (event.type === NARRATIVE_EVENT.SKIP) {
      const characterId = String(
        event.line?.character_id
        || this.character?.character_id
        || this.character?.id
        || "azusa"
      );
      const reaction = this.reactionRules.trigger({
        signal: REACTION_SIGNAL.SKIP,
        characterId,
        context: "dialogue"
      });

      if (reaction) {
        this.reactionMessage = this.voiceSystem?.getDialogue?.(
          this.character,
          reaction.reaction
        ) || "¿Me estás prestando atención?";
        void this.voiceSystem?.emit?.(reaction.reaction, this.character);
      }
    }
    this._render();
  }

  _render() {
    const line = this.runtime.getCurrentLine();
    const state = this.runtime.getState();

    if (this.elements.speaker) {
      this.elements.speaker.textContent = line?.speaker || "—";
    }
    if (this.elements.text) {
      this.elements.text.textContent = line?.text || "Escena finalizada.";
    }
    if (this.elements.status) {
      this.elements.status.textContent =
        state.state + " • LINE " + (state.cursor + 1) + "/" + state.lineCount;
    }
    if (this.elements.reaction) {
      this.elements.reaction.textContent = this.reactionMessage
        ? "REACTION // " + this.reactionMessage
        : "";
    }
    if (this.elements.advanceButton) {
      this.elements.advanceButton.disabled = state.finished;
    }
    if (this.elements.skipButton) {
      this.elements.skipButton.disabled = state.finished;
    }
    if (this.elements.returnButton) {
      this.elements.returnButton.disabled = false;
    }
  }
}
