const STORAGE_KEY = "baseball_waifus_audio_v1";

const BIOME_AMBIENT = Object.freeze({
  cyberpunk: Object.freeze({ tones: [110, 220], waveforms: ["sawtooth", "sine"] }),
  beach: Object.freeze({ tones: [174.61, 261.63], waveforms: ["sine", "triangle"] }),
  volcano: Object.freeze({ tones: [65.41, 98], waveforms: ["triangle", "sawtooth"] }),
  forest: Object.freeze({ tones: [196, 293.66], waveforms: ["sine", "triangle"] })
});

const SOUND_PROFILES = Object.freeze({
  "bat.swing": { notes: [{ frequency: 150, waveform: "square", duration: 0.09, endFrequency: 90, gain: 0.16 }] },
  "result.perfect": { notes: [
    { frequency: 1046.5, waveform: "sine", duration: 0.15, endFrequency: 1318.51, gain: 0.2 },
    { frequency: 659.25, waveform: "triangle", duration: 0.32, endFrequency: 329.63, gain: 0.07, delay: 0.01 },
    { frequency: 1760, waveform: "sine", duration: 0.2, endFrequency: 1320, gain: 0.09, delay: 0.055 }
  ] },
  "result.hit": { notes: [{ frequency: 520, waveform: "triangle", duration: 0.11, endFrequency: 300, gain: 0.15 }] },
  "result.home_run": { notes: [
    { frequency: 659.25, waveform: "triangle", duration: 0.2, endFrequency: 783.99, gain: 0.13 },
    { frequency: 783.99, waveform: "triangle", duration: 0.2, endFrequency: 1046.5, gain: 0.11, delay: 0.08 },
    { frequency: 1046.5, waveform: "sine", duration: 0.36, endFrequency: 1568, gain: 0.09, delay: 0.16 }
  ] },
  "result.miss": { noise: { duration: 0.16, gain: 0.13, highpass: 500 } },
  "bat.foul": {
    notes: [{ frequency: 118, waveform: "square", duration: 0.08, endFrequency: 72, gain: 0.08 }],
    noise: { duration: 0.11, gain: 0.13, highpass: 700 }
  },
  "ui.confirm": { notes: [
    { frequency: 880, waveform: "square", duration: 0.05, endFrequency: 1060, gain: 0.09 },
    { frequency: 1320, waveform: "triangle", duration: 0.07, endFrequency: 1510, gain: 0.07, delay: 0.045 }
  ] },
  "gacha.reveal_r": { notes: [
    { frequency: 523.25, waveform: "triangle", duration: 0.16, gain: 0.07 },
    { frequency: 659.25, waveform: "triangle", duration: 0.2, gain: 0.06, delay: 0.08 }
  ] },
  "gacha.reveal_sr": { notes: [
    { frequency: 523.25, waveform: "triangle", duration: 0.16, gain: 0.075 },
    { frequency: 659.25, waveform: "triangle", duration: 0.19, gain: 0.07, delay: 0.07 },
    { frequency: 783.99, waveform: "sine", duration: 0.24, gain: 0.065, delay: 0.14 }
  ] },
  "gacha.reveal_ssr": { notes: [
    { frequency: 523.25, waveform: "triangle", duration: 0.18, gain: 0.08 },
    { frequency: 659.25, waveform: "triangle", duration: 0.2, gain: 0.075, delay: 0.06 },
    { frequency: 783.99, waveform: "triangle", duration: 0.24, gain: 0.07, delay: 0.12 },
    { frequency: 1046.5, waveform: "sine", duration: 0.33, gain: 0.06, delay: 0.19 }
  ] },
  "gacha.reveal_ur": { notes: [
    { frequency: 392, waveform: "triangle", duration: 0.18, gain: 0.065 },
    { frequency: 523.25, waveform: "triangle", duration: 0.2, gain: 0.07, delay: 0.06 },
    { frequency: 659.25, waveform: "triangle", duration: 0.22, gain: 0.075, delay: 0.12 },
    { frequency: 783.99, waveform: "sine", duration: 0.24, gain: 0.08, delay: 0.18 },
    { frequency: 1046.5, waveform: "sine", duration: 0.33, gain: 0.075, delay: 0.25 },
    { frequency: 1568, waveform: "sine", duration: 0.48, gain: 0.045, delay: 0.33 }
  ] },
  "gacha.pity_trigger": { notes: [
    { frequency: 118, waveform: "sawtooth", duration: 0.17, endFrequency: 86, gain: 0.12 },
    { frequency: 104, waveform: "sawtooth", duration: 0.17, endFrequency: 74, gain: 0.11, delay: 0.13 },
    { frequency: 62, waveform: "square", duration: 0.34, endFrequency: 48, gain: 0.09, delay: 0.24 }
  ] }
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBiome(areaId) {
  const value = String(areaId || "cyberpunk").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(BIOME_AMBIENT, value) ? value : "cyberpunk";
}

function readStorage(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value));
  } catch {}
}

function setParam(param, value, time = null) {
  if (!param) return;
  const safeTime = time ?? undefined;
  if (typeof param.setTargetAtTime === "function" && safeTime !== undefined) {
    param.setTargetAtTime(value, safeTime, 0.012);
    return;
  }
  if (typeof param.setValueAtTime === "function") {
    param.setValueAtTime(value, safeTime ?? 0);
    return;
  }
  try { param.value = value; } catch {}
}

export class AudioEngine {
  constructor({
    audioContextFactory = null,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null,
    storageKey = STORAGE_KEY,
    assetMap = {}
  } = {}) {
    this.audioContextFactory = audioContextFactory;
    this.storage = storage;
    this.storageKey = storageKey;
    this.assetMap = { ...assetMap };
    this.audioContext = null;
    this.masterGain = null;
    this.ambientNodes = [];
    const persisted = readStorage(storage, storageKey);
    this.settings = {
      volume: clamp(Number.isFinite(Number(persisted.volume)) ? Number(persisted.volume) : 0.8, 0, 1),
      muted: Boolean(persisted.muted),
      biome: normalizeBiome(persisted.biome || "cyberpunk")
    };
    this.ambientBiome = this.settings.biome;
  }

  isSupported() {
    return Boolean(this._resolveAudioContextClass() || this.audioContextFactory);
  }

  getSettings() {
    return { ...this.settings };
  }

  setVolume(value) {
    this.settings.volume = clamp(Number(value) || 0, 0, 1);
    this._applyMasterGain();
    this._persist();
    return this.settings.volume;
  }

  setMuted(muted) {
    this.settings.muted = Boolean(muted);
    this._applyMasterGain();
    this._persist();
    return this.settings.muted;
  }

  toggleMute() {
    return this.setMuted(!this.settings.muted);
  }

  setBiome(areaId) {
    this.settings.biome = normalizeBiome(areaId);
    this.ambientBiome = this.settings.biome;
    this._persist();
    if (this.audioContext && !this.settings.muted) this._startAmbient();
    return this.settings.biome;
  }

  play(soundId, overrides = {}) {
    const id = String(soundId || "");
    if (!id || this.settings.muted || this.settings.volume <= 0) return false;
    if (this._playAsset(id)) return true;
    const profile = SOUND_PROFILES[id];
    if (!profile) return false;
    const context = this._getContext();
    if (!context) return false;
    if (context.state === "suspended" && typeof context.resume === "function") context.resume().catch(() => {});
    this._ensureMasterGain();
    const notes = Array.isArray(profile.notes) && profile.notes.length ? profile.notes : [profile];
    let played = false;
    for (const note of notes) {
      const delay = Math.max(0, Number(note.delay || 0) + Number(overrides.startDelay || 0));
      played = this._playTone({
        frequency: overrides.frequency ?? note.frequency ?? profile.frequency ?? 440,
        endFrequency: overrides.endFrequency ?? note.endFrequency ?? profile.endFrequency ?? 100,
        waveform: overrides.waveform ?? note.waveform ?? profile.waveform ?? "square",
        duration: overrides.duration ?? note.duration ?? profile.duration ?? 0.1,
        gain: overrides.gain ?? note.gain ?? profile.gain ?? 0.12,
        delay
      }) || played;
    }
    if (profile.noise) played = this._playNoise(profile.noise) || played;
    if (this.ambientNodes.length === 0) this._startAmbient();
    return played;
  }

  async suspend() {
    if (!this.audioContext?.suspend) return false;
    try { await this.audioContext.suspend(); return true; } catch { return false; }
  }

  async resume() {
    if (!this.audioContext?.resume) return false;
    try {
      await this.audioContext.resume();
      if (!this.settings.muted) this._startAmbient();
      return true;
    } catch { return false; }
  }

  getAudioContext() {
    return this.audioContext;
  }

  _persist() {
    writeStorage(this.storage, this.storageKey, this.settings);
  }

  _resolveAudioContextClass() {
    if (typeof window === "undefined") return null;
    return window.AudioContext || window.webkitAudioContext || null;
  }

  _getContext() {
    if (this.audioContext) return this.audioContext;
    try {
      if (this.audioContextFactory) {
        this.audioContext = this.audioContextFactory();
      } else {
        const ContextClass = this._resolveAudioContextClass();
        if (!ContextClass) return null;
        this.audioContext = new ContextClass();
      }
    } catch {
      this.audioContext = null;
      return null;
    }
    this._ensureMasterGain();
    return this.audioContext;
  }

  _ensureMasterGain() {
    if (!this.audioContext || this.masterGain) return this.masterGain;
    if (typeof this.audioContext.createGain !== "function" || !this.audioContext.destination) return null;
    try {
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this._applyMasterGain();
    } catch {
      this.masterGain = null;
    }
    return this.masterGain;
  }

  _applyMasterGain() {
    if (!this.masterGain?.gain) return;
    const target = this.settings.muted ? 0 : this.settings.volume;
    setParam(this.masterGain.gain, target, Number(this.audioContext?.currentTime) || 0);
  }

  _playTone({ frequency, endFrequency, waveform, duration, gain, delay }) {
    const context = this.audioContext;
    if (!context || typeof context.createOscillator !== "function" || !this.masterGain) return false;
    const now = (Number(context.currentTime) || 0) + Math.max(0, Number(delay) || 0);
    const safeDuration = clamp(Number(duration) || 0.1, 0.025, 1);
    const safeFrequency = clamp(Number(frequency) || 440, 40, 8000);
    const safeEndFrequency = clamp(Number(endFrequency) || safeFrequency, 40, 8000);
    const safeGain = clamp(Number(gain) || 0.1, 0.001, 0.45);
    const allowed = new Set(["sine", "square", "triangle", "sawtooth"]);
    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = allowed.has(String(waveform)) ? String(waveform) : "sine";
      setParam(oscillator.frequency, safeFrequency, now);
      if (typeof oscillator.frequency.exponentialRampToValueAtTime === "function") {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, safeEndFrequency), now + safeDuration);
      } else {
        setParam(oscillator.frequency, safeEndFrequency, now + safeDuration);
      }
      setParam(gainNode.gain, safeGain, now);
      if (typeof gainNode.gain.exponentialRampToValueAtTime === "function") {
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + safeDuration);
      }
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      oscillator.start(now);
      oscillator.stop(now + safeDuration);
      oscillator.onended = () => {
        oscillator.disconnect?.();
        gainNode.disconnect?.();
      };
      return true;
    } catch {
      return false;
    }
  }

  _playNoise({ duration = 0.1, gain = 0.12, highpass = 0 } = {}) {
    const context = this.audioContext;
    if (!context || typeof context.createBuffer !== "function" || typeof context.createBufferSource !== "function" || !this.masterGain) return false;
    const sampleRate = Number(context.sampleRate) || 44100;
    const safeDuration = clamp(Number(duration) || 0.1, 0.025, 0.5);
    const samples = Math.max(1, Math.floor(sampleRate * safeDuration));
    try {
      const buffer = context.createBuffer(1, samples, sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const gainNode = context.createGain();
      source.buffer = buffer;
      const now = Number(context.currentTime) || 0;
      setParam(gainNode.gain, clamp(Number(gain) || 0.12, 0.001, 0.4), now);
      if (typeof gainNode.gain.exponentialRampToValueAtTime === "function") gainNode.gain.exponentialRampToValueAtTime(0.01, now + safeDuration);
      if (highpass > 0 && typeof context.createBiquadFilter === "function") {
        const filter = context.createBiquadFilter();
        filter.type = "highpass";
        setParam(filter.frequency, clamp(Number(highpass) || 700, 40, 16000), now);
        if (filter.Q) setParam(filter.Q, 0.7, now);
        source.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(this.masterGain);
        source.onended = () => { source.disconnect?.(); gainNode.disconnect?.(); filter.disconnect?.(); };
      } else {
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.onended = () => { source.disconnect?.(); gainNode.disconnect?.(); };
      }
      source.start(now);
      source.stop(now + safeDuration);
      return true;
    } catch {
      return false;
    }
  }

  _startAmbient() {
    this._stopAmbient();
    if (!this.audioContext || this.settings.muted || this.settings.volume <= 0) return false;
    const profile = BIOME_AMBIENT[this.ambientBiome];
    if (!profile || !this.masterGain || typeof this.audioContext.createOscillator !== "function") return false;
    const now = Number(this.audioContext.currentTime) || 0;
    try {
      this.ambientNodes = profile.tones.map((frequency, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        oscillator.type = profile.waveforms[index] || "sine";
        setParam(oscillator.frequency, frequency, now);
        setParam(gain.gain, 0.018, now);
        oscillator.connect(gain);
        gain.connect(this.masterGain);
        oscillator.start(now);
        return { oscillator, gain };
      });
      return this.ambientNodes.length > 0;
    } catch {
      this._stopAmbient();
      return false;
    }
  }

  _stopAmbient() {
    for (const node of this.ambientNodes) {
      try { node.oscillator.stop?.(); } catch {}
      node.oscillator.disconnect?.();
      node.gain.disconnect?.();
    }
    this.ambientNodes = [];
  }

  _playAsset(soundId) {
    const url = this.assetMap[soundId];
    if (!url || typeof Audio !== "function") return false;
    try {
      const player = new Audio(url);
      player.preload = "auto";
      player.volume = this.settings.volume;
      player.muted = this.settings.muted;
      const result = player.play();
      result?.catch?.(() => {});
      return true;
    } catch {
      return false;
    }
  }
}

export { BIOME_AMBIENT, SOUND_PROFILES, STORAGE_KEY };
