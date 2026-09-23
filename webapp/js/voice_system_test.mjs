import assert from "node:assert/strict";
import { VoiceSystem } from "./voice_system.js";

const speechCalls = [];
globalThis.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.pitch = 1;
    this.rate = 1;
    this.volume = 1;
    this.lang = "";
    this.voice = null;
  }
};

const speechSynthesis = {
  voices: [{ name: "Anime Spanish Female", lang: "es-ES" }],
  getVoices() {
    return this.voices;
  },
  speak(utterance) {
    speechCalls.push(utterance);
  },
  cancel() {}
};

function brokenAudioFactory() {
  return {
    readyState: 0,
    listeners: new Map(),
    addEventListener(name, callback) {
      this.listeners.set(name, callback);
    },
    removeEventListener(name) {
      this.listeners.delete(name);
    },
    load() {
      queueMicrotask(() => this.listeners.get("error")?.());
    },
    pause() {},
    play() {
      return Promise.resolve();
    },
    volume: 1,
    src: ""
  };
}

const voice = new VoiceSystem({
  audioFactory: brokenAudioFactory,
  speechSynthesis
});

const result = await voice.emit("ON_TAP", {
  character_id: "bw001",
  canonical: { display_name: "Aiko Hanamori" },
  dialogue: {
    ON_TAP: "¡Hola, equipo!"
  }
});

assert.equal(result.ok, true);
assert.equal(result.method, "speechSynthesis");
assert.equal(result.line, "¡Hola, equipo!");
assert.equal(speechCalls.length, 1);
assert.equal(speechCalls[0].pitch, 1.35);
assert.equal(speechCalls[0].rate, 1.06);
assert.equal(speechCalls[0].lang, "es-ES");

console.log("voice_system_test: ok");
