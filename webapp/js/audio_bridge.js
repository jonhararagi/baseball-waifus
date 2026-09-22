/**
 * Presentation-only audio contract and lightweight synthesized SFX adapter.
 *
 * Stack #1 uses the browser-native Web Audio API. It intentionally follows
 * the small-envelope design goal of ZzFX-style arcade SFX without importing
 * ZzFX or any third-party runtime dependency.
 */
const SOUND_PROFILES = {
  "bat.swing": {
    frequency: 150,
    waveform: "square",
    duration: 0.09,
    end_frequency: 100,
    gain: 0.18
  },
  "bat.contact": {
    frequency: 880,
    waveform: "sawtooth",
    duration: 0.12,
    end_frequency: 100,
    gain: 0.24
  },
  "result.hit": {
    frequency: 880,
    waveform: "sawtooth",
    duration: 0.12,
    end_frequency: 100,
    gain: 0.24
  },
  "result.home_run": {
    frequency: 880,
    waveform: "sawtooth",
    duration: 0.15,
    end_frequency: 100,
    gain: 0.28
  }
};

export function playScavengerSFX(
  audioContext,
  frequency = 440,
  waveform = "square",
  duration = 0.1,
  gainAmount = 0.18,
  endFrequency = 100
) {
  if (!audioContext || typeof audioContext.createOscillator !== "function") {
    return false;
  }

  const safeDuration = Math.max(0.025, Math.min(Number(duration) || 0.1, 0.3));
  const safeFrequency = Math.max(40, Math.min(Number(frequency) || 440, 4000));
  const safeEndFrequency = Math.max(40, Math.min(Number(endFrequency) || 100, 4000));
  const safeGain = Math.max(0.001, Math.min(Number(gainAmount) || 0.18, 0.4));
  const currentTime = Number(audioContext.currentTime) || 0;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = waveform === "sawtooth" ? "sawtooth" : "square";
  oscillator.frequency.setValueAtTime(safeFrequency, currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    safeEndFrequency,
    currentTime + safeDuration
  );

  gain.gain.setValueAtTime(safeGain, currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.01,
    currentTime + safeDuration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(currentTime);
  oscillator.stop(currentTime + safeDuration);

  oscillator.onended = () => {
    oscillator.disconnect?.();
    gain.disconnect?.();
  };

  return true;
}

export class WebAudioSynthAdapter {
  constructor({ audioContextFactory = null } = {}) {
    this.audioContextFactory = audioContextFactory;
    this.audioContext = null;
  }

  _getContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    if (this.audioContextFactory) {
      this.audioContext = this.audioContextFactory();
      return this.audioContext;
    }

    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    this.audioContext = new AudioContextClass();
    return this.audioContext;
  }

  play(soundId, options = {}) {
    const profile = SOUND_PROFILES[soundId];
    if (!profile) {
      return false;
    }

    const audioContext = this._getContext();
    if (!audioContext) {
      return false;
    }

    if (audioContext.state === "suspended" && typeof audioContext.resume === "function") {
      audioContext.resume().catch(() => {});
    }

    return playScavengerSFX(
      audioContext,
      options.frequency ?? profile.frequency,
      options.waveform ?? profile.waveform,
      options.duration ?? profile.duration,
      options.gain ?? profile.gain,
      options.endFrequency ?? profile.end_frequency
    );
  }
}

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
