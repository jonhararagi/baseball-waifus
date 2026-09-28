export const NARRATIVE_STATE = Object.freeze({
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED"
});

export const NARRATIVE_EVENT = Object.freeze({
  SCENE_STARTED: "SCENE_STARTED",
  DIALOGUE_ADVANCED: "DIALOGUE_ADVANCED",
  DIALOGUE_COMPLETED: "DIALOGUE_COMPLETED",
  SKIP: "SKIP",
  SCENE_COMPLETED: "SCENE_COMPLETED"
});

function normalizeLine(line = {}) {
  if (!line || typeof line !== "object") {
    throw new TypeError("DialogueLine must be an object");
  }
  const speaker = String(line.speaker || "").trim();
  const text = String(line.text || "");
  if (!speaker) throw new TypeError("DialogueLine.speaker is required");
  if (!text) throw new TypeError("DialogueLine.text is required");
  return {
    speaker,
    text,
    ...(line.character_id ? { character_id: String(line.character_id) } : {}),
    ...(line.voice_id ? { voice_id: String(line.voice_id) } : {}),
    ...(Number.isFinite(Number(line.duration)) ? { duration: Number(line.duration) } : {})
  };
}

function normalizeScene(scene = {}) {
  if (!scene || typeof scene !== "object") {
    throw new TypeError("Scene must be an object");
  }
  const sceneId = String(scene.scene_id || "").trim();
  if (!sceneId) throw new TypeError("Scene.scene_id is required");
  if (!Array.isArray(scene.dialogue_lines) || scene.dialogue_lines.length === 0) {
    throw new TypeError("Scene.dialogue_lines must contain at least one line");
  }
  return Object.freeze({
    scene_id: sceneId,
    dialogue_lines: Object.freeze(scene.dialogue_lines.map(normalizeLine))
  });
}

export class NarrativeRuntime {
  constructor({ onEvent = null } = {}) {
    this.onEvent = typeof onEvent === "function" ? onEvent : null;
    this.state = NARRATIVE_STATE.IDLE;
    this.scene = null;
    this.cursor = -1;
  }

  startScene(scene) {
    this.scene = normalizeScene(scene);
    this.cursor = 0;
    this.state = NARRATIVE_STATE.PLAYING;
    this._emit(NARRATIVE_EVENT.SCENE_STARTED, {
      sceneId: this.scene.scene_id,
      cursor: this.cursor,
      line: this.getCurrentLine()
    });
    return this.getState();
  }

  advance() {
    if (this.state !== NARRATIVE_STATE.PLAYING || !this.scene) {
      return this.getState();
    }

    if (this.cursor < this.scene.dialogue_lines.length - 1) {
      this.cursor += 1;
      this._emit(NARRATIVE_EVENT.DIALOGUE_ADVANCED, {
        sceneId: this.scene.scene_id,
        cursor: this.cursor,
        line: this.getCurrentLine()
      });
      return this.getState();
    }

    this._emit(NARRATIVE_EVENT.DIALOGUE_COMPLETED, {
      sceneId: this.scene.scene_id,
      cursor: this.cursor,
      line: this.getCurrentLine()
    });
    this.state = NARRATIVE_STATE.COMPLETED;
    this._emit(NARRATIVE_EVENT.SCENE_COMPLETED, {
      sceneId: this.scene.scene_id,
      cursor: this.cursor,
      state: this.state
    });
    return this.getState();
  }

  skip() {
    if (this.state !== NARRATIVE_STATE.PLAYING || !this.scene) {
      return this.getState();
    }

    this._emit(NARRATIVE_EVENT.SKIP, {
      sceneId: this.scene.scene_id,
      cursor: this.cursor,
      line: this.getCurrentLine()
    });
    this.state = NARRATIVE_STATE.SKIPPED;
    this._emit(NARRATIVE_EVENT.SCENE_COMPLETED, {
      sceneId: this.scene.scene_id,
      cursor: this.cursor,
      state: this.state
    });
    return this.getState();
  }

  getCurrentLine() {
    if (!this.scene || this.cursor < 0) return null;
    return this.scene.dialogue_lines[this.cursor] || null;
  }

  isFinished() {
    return this.state === NARRATIVE_STATE.COMPLETED
      || this.state === NARRATIVE_STATE.SKIPPED;
  }

  getState() {
    return Object.freeze({
      state: this.state,
      sceneId: this.scene?.scene_id || null,
      cursor: this.cursor,
      lineCount: this.scene?.dialogue_lines.length || 0,
      line: this.getCurrentLine(),
      finished: this.isFinished()
    });
  }

  _emit(type, payload = {}) {
    this.onEvent?.({
      type,
      ...payload
    });
  }
}

export { normalizeLine, normalizeScene };
