const DEFAULT_LINES = Object.freeze({
  ON_TAP: "¡Ey! Me alegra verte.",
  ON_SUPER_SWING: "¡Mira bien! ¡Este es mi Super Swing!",
  ON_VICTORY: "¡Ganamos! Sabía que podíamos hacerlo.",
  ON_TOUCH_LOCKER: "¿Me estabas buscando?",
});

const EVENT_KEYS = Object.freeze([
  "ON_TAP",
  "ON_SUPER_SWING",
  "ON_VICTORY",
  "ON_TOUCH_LOCKER"
]);

function normalizeEvent(event) {
  return String(event || "").toUpperCase();
}

function getWaifuId(waifu) {
  return String(
    waifu?.character_id
    || waifu?.id
    || waifu?.card_id
    || "unknown"
  );
}

function getDisplayName(waifu) {
  return String(
    waifu?.canonical?.display_name
    || waifu?.display_name
    || waifu?.name
    || "Waifu"
  );
}

function resolveLine(waifu, event) {
  const key = normalizeEvent(event);
  const dialogue = waifu?.dialogue || waifu?.voice_lines || waifu?.quotes || {};
  const value = dialogue[key]
    ?? dialogue[key.toLowerCase()]
    ?? waifu?.[key]
    ?? waifu?.[key.toLowerCase()]
    ?? DEFAULT_LINES[key];

  return String(value || (getDisplayName(waifu) + " says hello!"));
}

export class VoiceSystem {
  constructor({
    basePath = "./assets/audio/voices",
    audioFactory = null,
    speechSynthesis = null,
    AudioCtor = null,
    onError = null,
    pitch = 1.35,
    rate = 1.06,
    volume = 0.9
  } = {}) {
    this.basePath = String(basePath).replace(/\/$/, "");
    this.audioFactory = typeof audioFactory === "function"
      ? audioFactory
      : null;
    this.AudioCtor = AudioCtor || (
      typeof globalThis !== "undefined" && typeof globalThis.Audio === "function"
        ? globalThis.Audio
        : null
    );
    this.speechSynthesis = speechSynthesis
      || (typeof window !== "undefined" ? window.speechSynthesis : null);
    this.onError = typeof onError === "function" ? onError : null;
    this.pitch = Math.max(0.5, Math.min(2, Number(pitch) || 1.35));
    this.rate = Math.max(0.5, Math.min(2, Number(rate) || 1.06));
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0.9));
    this.currentAudio = null;
    this.lastPlayback = null;
    this.events = new Set(EVENT_KEYS);
  }

  registerEvent(event) {
    const key = normalizeEvent(event);
    if (key) this.events.add(key);
    return key;
  }

  getDialogue(waifu, event) {
    return resolveLine(waifu, event);
  }

  buildVoiceUrl(waifu, event) {
    const id = encodeURIComponent(getWaifuId(waifu));
    const key = encodeURIComponent(normalizeEvent(event));
    const relative = this.basePath + "/" + id + "/" + key + ".mp3";

    if (typeof window !== "undefined" && window.location?.href) {
      try {
        return new URL(relative, window.location.href).toString();
      } catch {
        return relative;
      }
    }

    return relative;
  }

  emit(event, waifu = null) {
    const key = normalizeEvent(event);
    if (!key || !this.events.has(key)) {
      return Promise.resolve({
        ok: false,
        method: "none",
        event: key,
        reason: "UNKNOWN_EVENT"
      });
    }

    return this.play(key, waifu);
  }

  async play(event, waifu = null) {
    const key = normalizeEvent(event);
    const url = this.buildVoiceUrl(waifu, key);
    const line = this.getDialogue(waifu, key);

    this.stop();

    const audioResult = await this._tryAudio(url);
    if (audioResult.ok) {
      this.lastPlayback = {
        ok: true,
        method: "audio",
        event: key,
        url,
        line
      };
      return { ...this.lastPlayback };
    }

    const speechResult = this._trySpeech(line, waifu);
    this.lastPlayback = {
      ok: Boolean(speechResult.ok),
      method: speechResult.ok ? "speechSynthesis" : "none",
      event: key,
      url,
      line,
      reason: speechResult.ok ? undefined : audioResult.reason || speechResult.reason
    };

    return { ...this.lastPlayback };
  }

  stop() {
    try {
      this.currentAudio?.pause?.();
      if (this.currentAudio) this.currentAudio.currentTime = 0;
    } catch {
      // Audio cleanup is best effort.
    }
    this.currentAudio = null;

    try {
      this.speechSynthesis?.cancel?.();
    } catch {
      // Speech cleanup is best effort.
    }
  }

  _createAudio(url) {
    if (this.audioFactory) return this.audioFactory(url);
    if (this.AudioCtor) return new this.AudioCtor(url);
    return null;
  }

  async _tryAudio(url) {
    const audio = this._createAudio(url);
    if (!audio) {
      return { ok: false, reason: "AUDIO_API_UNAVAILABLE" };
    }

    this.currentAudio = audio;

    try {
      audio.preload = "auto";
      if ("src" in audio && !audio.src) audio.src = url;
      if ("volume" in audio) audio.volume = this.volume;

      await this._waitForAudio(audio);

      if (typeof audio.play !== "function") {
        throw new Error("Audio object cannot play");
      }

      await audio.play();
      return { ok: true };
    } catch (error) {
      this.onError?.(error, { method: "audio", url });
      try {
        audio.pause?.();
      } catch {}
      this.currentAudio = null;
      return {
        ok: false,
        reason: error?.message || "AUDIO_LOAD_FAILED"
      };
    }
  }

  _waitForAudio(audio) {
    if (audio.readyState >= 3) {
      return Promise.resolve();
    }

    if (typeof audio.addEventListener !== "function") {
      return Promise.reject(new Error("Audio object has no event API"));
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (typeof audio.removeEventListener !== "function") return;
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("loadeddata", onReady);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("abort", onError);
      };
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn(value);
      };
      const onReady = () => finish(resolve);
      const onError = () => finish(reject, new Error("VOICE_AUDIO_NOT_FOUND_OR_UNREADABLE"));

      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("loadeddata", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("abort", onError, { once: true });

      try {
        audio.load?.();
      } catch (error) {
        finish(reject, error);
      }
    });
  }

  _trySpeech(line, waifu) {
    const synthesis = this.speechSynthesis;
    const UtteranceCtor = typeof globalThis !== "undefined"
      ? globalThis.SpeechSynthesisUtterance
      : null;

    if (!synthesis || typeof synthesis.speak !== "function" || !UtteranceCtor) {
      return { ok: false, reason: "SPEECH_SYNTHESIS_UNAVAILABLE" };
    }

    try {
      const utterance = new UtteranceCtor(line);
      utterance.pitch = this.pitch;
      utterance.rate = this.rate;
      utterance.volume = this.volume;
      utterance.lang = String(waifu?.voice_language || waifu?.language || "es-ES");

      const voices = typeof synthesis.getVoices === "function"
        ? synthesis.getVoices()
        : [];

      const preferred = voices.find((voice) =>
        String(voice.lang || "").toLowerCase().startsWith("es")
        && /female|woman|girl|sofia|paula|monica/i.test(String(voice.name || ""))
      ) || voices.find((voice) =>
        String(voice.lang || "").toLowerCase().startsWith("es")
      );

      if (preferred) utterance.voice = preferred;

      synthesis.speak(utterance);
      return { ok: true };
    } catch (error) {
      this.onError?.(error, { method: "speechSynthesis", line });
      return {
        ok: false,
        reason: error?.message || "SPEECH_SYNTHESIS_FAILED"
      };
    }
  }
}

export { DEFAULT_LINES, EVENT_KEYS, normalizeEvent, resolveLine };
