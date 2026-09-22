/**
 * Presentation-only audio contract.
 *
 * No audio provider is selected here. Implementations may be injected later
 * without changing CombatRenderer or gameplay contracts.
 */
export class AudioBridge {
  constructor({ adapter = null } = {}) {
    this.adapter = adapter;
  }

  play(soundId, options = {}) {
    if (typeof soundId !== "string" || soundId.trim() === "") {
      throw new TypeError("AudioBridge.play requires a non-empty soundId");
    }

    if (this.adapter && typeof this.adapter.play === "function") {
      return Boolean(this.adapter.play(soundId, options));
    }

    return false;
  }
}
