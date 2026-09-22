import assert from "node:assert/strict";
import { AudioEngine } from "./audio_engine.js";

class FakeParam {
  constructor(value = 0) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
}
class FakeNode {
  constructor() { this.gain = new FakeParam(0); this.frequency = new FakeParam(0); this.Q = new FakeParam(0); this.connected = []; }
  connect(node) { this.connected.push(node); return node; }
  disconnect() { this.connected = []; }
  start() {}
  stop() {}
}
class FakeBuffer {
  constructor(length) { this.data = new Float32Array(length); }
  getChannelData() { return this.data; }
}
class FakeAudioContext {
  constructor() { this.state = "running"; this.currentTime = 0; this.sampleRate = 44100; this.destination = new FakeNode(); this.oscillators = []; }
  createGain() { return new FakeNode(); }
  createOscillator() { const node = new FakeNode(); this.oscillators.push(node); return node; }
  createBuffer(channels, length) { assert.equal(channels, 1); return new FakeBuffer(length); }
  createBufferSource() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
  async suspend() { this.state = "suspended"; }
  async resume() { this.state = "running"; }
}
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, value); }
}
const storage = new MemoryStorage();
let contexts = 0;
const engine = new AudioEngine({ storage, audioContextFactory: () => { contexts += 1; return new FakeAudioContext(); } });
assert.equal(engine.isSupported(), true);
assert.equal(engine.play("bat.swing"), true);
assert.equal(contexts, 1);
assert.ok(engine.getAudioContext().oscillators.length >= 3);
engine.setBiome("forest");
assert.equal(engine.getSettings().biome, "forest");
assert.ok(engine.getAudioContext().oscillators.length >= 5);
engine.setVolume(0.42);
assert.equal(engine.getSettings().volume, 0.42);
assert.equal(JSON.parse(storage.getItem("baseball_waifus_audio_v1")).volume, 0.42);
engine.setMuted(true);
assert.equal(engine.play("result.hit"), false);
engine.toggleMute();
assert.equal(engine.getSettings().muted, false);
assert.equal(engine.play("result.perfect"), true);
assert.equal(engine.play("unknown.sound"), false);
assert.equal(engine.setBiome("not-a-biome"), "cyberpunk");
const restored = new AudioEngine({ storage, audioContextFactory: () => new FakeAudioContext() });
assert.equal(restored.getSettings().volume, 0.42);
assert.equal(restored.getSettings().muted, false);
assert.equal(restored.getSettings().biome, "cyberpunk");
console.log("audio_engine_test: ok");
