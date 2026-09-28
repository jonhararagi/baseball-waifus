import { NarrativePresentation } from "./narrative_presentation.js";
import { NARRATIVE_STATE } from "./narrative_runtime.js";
import { ARC0_TEAM11_FIRST_TEST } from "./narrative_arc0_team11_choice.js";

export class Team11ChoicePresentation extends NarrativePresentation {
  constructor(options = {}) {
    super(options);
    this.phase = "IDLE";
    this.selectedChoice = null;
    this.choiceElements = {};
  }

  mount() {
    super.mount();
    if (!this.root || typeof document === "undefined") return this;

    const panel = this.root.querySelector(".narrative-test-panel");
    if (!panel) return this;

    const choice = document.createElement("div");
    choice.className = "narrative-test-choice";
    choice.hidden = true;

    const prompt = document.createElement("div");
    prompt.className = "narrative-test-status";
    prompt.textContent = ARC0_TEAM11_FIRST_TEST.choice.prompt;

    const options = document.createElement("div");
    options.className = "narrative-test-controls";

    const buttons = new Map();
    for (const option of ARC0_TEAM11_FIRST_TEST.choice.options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-button action-primary";
      button.textContent = option.id + " · " + option.label;
      button.dataset.choiceId = option.id;
      button.addEventListener("click", () => this.choose(option.id));
      buttons.set(option.id, button);
      options.appendChild(button);
    }

    choice.append(prompt, options);
    panel.appendChild(choice);
    this.choiceElements = { choice, buttons };
    this._render();
    return this;
  }

  start() {
    this.phase = "INTRO";
    this.selectedChoice = null;
    this.reactionMessage = "";
    return this.runtime.startScene(ARC0_TEAM11_FIRST_TEST.intro);
  }

  advance() {
    if (this.phase === "INTRO") {
      const state = this.runtime.getState();
      if (state.cursor === state.lineCount - 1) {
        const result = this.runtime.advance();
        this.phase = "CHOICE";
        this._render();
        return result;
      }
      return this.runtime.advance();
    }

    if (this.phase === "BRANCH") {
      const state = this.runtime.getState();
      if (state.cursor === state.lineCount - 1) {
        const result = this.runtime.advance();
        this.phase = "COMMON";
        this.runtime.startScene(ARC0_TEAM11_FIRST_TEST.common);
        this._render();
        return result;
      }
      return this.runtime.advance();
    }

    return this.runtime.advance();
  }

  choose(choiceId) {
    if (this.phase !== "CHOICE") return this.runtime.getState();
    const normalized = String(choiceId || "").toUpperCase();
    if (!ARC0_TEAM11_FIRST_TEST.branches[normalized]) return this.runtime.getState();
    this.selectedChoice = normalized;
    this.phase = "BRANCH";
    const result = this.runtime.startScene(ARC0_TEAM11_FIRST_TEST.branches[normalized]);
    this._render();
    return result;
  }

  skip() {
    if (this.phase === "CHOICE") {
      this.runtime.startScene(ARC0_TEAM11_FIRST_TEST.common);
      this.phase = "SKIPPED";
      const result = super.skip();
      this._render();
      return result;
    }
    return super.skip();
  }

  getChoiceState() {
    return Object.freeze({
      visible: this.phase === "CHOICE",
      prompt: ARC0_TEAM11_FIRST_TEST.choice.prompt,
      options: ARC0_TEAM11_FIRST_TEST.choice.options.map((option) => ({ ...option })),
      selected: this.selectedChoice,
      phase: this.phase
    });
  }

  isFinished() {
    return this.phase === "SKIPPED"
      || this.runtime.getState().state === NARRATIVE_STATE.SKIPPED
      || (this.phase === "COMMON" && this.runtime.getState().state === NARRATIVE_STATE.COMPLETED);
  }

  _render() {
    super._render();
    const visible = this.phase === "CHOICE";
    if (this.choiceElements.choice) {
      this.choiceElements.choice.hidden = !visible;
    }
    for (const [id, button] of this.choiceElements.buttons || []) {
      button.disabled = !visible || Boolean(this.selectedChoice);
      button.setAttribute("aria-pressed", String(this.selectedChoice === id));
    }
    if (visible) {
      if (this.elements.status) this.elements.status.textContent = "CHOICE • SELECT ONE";
      if (this.elements.text) this.elements.text.textContent = ARC0_TEAM11_FIRST_TEST.choice.prompt;
    }
  }
}