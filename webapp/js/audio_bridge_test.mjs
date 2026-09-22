import assert from "node:assert/strict";
import {
  AudioBridge,
  WebAudioSynthAdapter,
  playScavengerSFX,
  SOUND_PROFILES
} from "./audio.js";

const calls = [];
const bridge = new AudioBridge({
  adapter: {
    play(soundId, options) {
      calls.push({ soundId, options });
      return true;
    }
  }
});

for (const soundId of [
  "ui.confirm",
  "gacha.reveal_ssr",
  "gacha.pity_trigger",
  "bat.foul"
]) {
  assert.ok(SOUND_PROFILES[soundId], `missing sound profile: ${soundId}`);
}

assert.equal(bridge.play("bat.swing", { volume: 0.8 }), true);
assert.deepEqual(calls, [
  { soundId: "bat.swing", options: { volume: 0.8 } }
]);

const inertBridge = new AudioBridge();
assert.equal(inertBridge.play("hit.critical"), false);

assert.throws(
  () => inertBridge.play(""),
  /non-empty soundId/
);

assert.throws(
  () => inertBridge.play(null),
  /non-empty soundId/
);

const oscillatorState = {
  started: false,
  stopped: false,
  waveform: "",
  frequency: null,
  gain: null
};

const fakeContext = {
  currentTime: 10,
  destination: {},
  state: "running",
  createOscillator() {
    const oscillator = {
      frequency: {
        setValueAtTime(value) {
          oscillatorState.frequency = { start: value };
        },
        exponentialRampToValueAtTime(value, time) {
          oscillatorState.frequency.end = { value, time };
        }
      },
      connect() {},
      disconnect() {},
      start() {
        oscillatorState.started = true;
      },
      stop() {
        oscillatorState.stopped = true;
      },
      onended: null
    };
    Object.defineProperty(oscillator, "type", {
      get() {
        return oscillatorState.waveform;
      },
      set(value) {
        oscillatorState.waveform = value;
      }
    });
    return oscillator;
  },
  createGain() {
    return {
      gain: {
        setValueAtTime(value) {
          oscillatorState.gain = { start: value };
        },
        exponentialRampToValueAtTime(value, time) {
          oscillatorState.gain.end = { value, time };
        }
      },
      connect() {},
      disconnect() {}
    };
  }
};

assert.equal(playScavengerSFX(fakeContext, 150, "square", 0.09), true);
assert.equal(oscillatorState.waveform, "square");
assert.equal(oscillatorState.frequency.start, 150);
assert.equal(oscillatorState.started, true);
assert.equal(oscillatorState.stopped, true);

const noiseContext = {
  ...fakeContext,
  sampleRate: 44100,
  createBuffer(_channels, length) {
    const data = new Float32Array(length);
    return { getChannelData() { return data; } };
  },
  createBufferSource() {
    return {
      buffer: null,
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
      onended: null
    };
  }
};

const noiseAdapter = new WebAudioSynthAdapter({
  audioContextFactory: () => noiseContext
});
assert.equal(noiseAdapter.play("bat.foul"), true);
assert.equal(noiseAdapter.play("gacha.reveal_ssr"), true);

const adapter = new WebAudioSynthAdapter({
  audioContextFactory: () => fakeContext
});

assert.equal(adapter.play("result.home_run"), true);
assert.equal(oscillatorState.waveform, "sawtooth");
assert.equal(oscillatorState.frequency.start, 880);

const facade = (await import("./audio.js")).createAudioBridge({
  adapter: {
    play(soundId) {
      return soundId === "bat.swing";
    }
  }
});
assert.equal(facade.play("bat.swing"), true);
assert.equal(facade.play("unknown.sound"), false);

console.log("[audio-bridge] synthesized SFX and facade validation passed");
