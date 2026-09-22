/**
 * Presentation-only audio contract and lightweight synthesized SFX adapter.
 *
 * Stack #1 uses the browser-native Web Audio API. It intentionally follows
 * the small-envelope design goal of ZzFX-style arcade SFX without importing
 * ZzFX or any third-party runtime dependency.
 */
export const SOUND_PROFILES = Object.freeze({
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
  "bat.foul": {
    notes: [
      {
        frequency: 118,
        waveform: "square",
        duration: 0.08,
        end_frequency: 72,
        gain: 0.09
      }
    ],
    noise: {
      duration: 0.11,
      gain: 0.14,
      highpass: 700
    }
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
  },
  "ui.confirm": {
    notes: [
      {
        frequency: 880,
        waveform: "square",
        duration: 0.05,
        end_frequency: 1060,
        gain: 0.11,
        delay: 0
      },
      {
        frequency: 1320,
        waveform: "triangle",
        duration: 0.07,
        end_frequency: 1510,
        gain: 0.085,
        delay: 0.045
      }
    ]
  },
  "gacha.reveal_ssr": {
    notes: [
      { frequency: 523.25, waveform: "triangle", duration: 0.22, gain: 0.09, delay: 0 },
      { frequency: 659.25, waveform: "triangle", duration: 0.24, gain: 0.08, delay: 0.05 },
      { frequency: 783.99, waveform: "triangle", duration: 0.27, gain: 0.075, delay: 0.1 },
      { frequency: 1046.5, waveform: "sine", duration: 0.38, gain: 0.07, delay: 0.15 },
      { frequency: 1568.0, waveform: "sine", duration: 0.46, gain: 0.035, delay: 0.2 }
    ]
  },
  "gacha.pity_trigger": {
    notes: [
      { frequency: 118, waveform: "sawtooth", duration: 0.17, end_frequency: 86, gain: 0.16, delay: 0 },
      { frequency: 104, waveform: "sawtooth", duration: 0.17, end_frequency: 74, gain: 0.14, delay: 0.13 },
      { frequency: 62, waveform: "square", duration: 0.34, end_frequency: 48, gain: 0.11, delay: 0.24 }
    ]
  }
});

export function playScavengerSFX(
  audioContext,
  frequency = 440,
  waveform = "square",
  duration = 0.1,
  gainAmount = 0.18,
  endFrequency = 100,
  startDelay = 0
) {
  if (!audioContext || typeof audioContext.createOscillator !== "function") {
    return false;
  }

  const safeDuration = Math.max(0.025, Math.min(Number(duration) || 0.1, 0.3));
  const safeFrequency = Math.max(40, Math.min(Number(frequency) || 440, 4000));
  const safeEndFrequency = Math.max(40, Math.min(Number(endFrequency) || 100, 4000));
  const safeGain = Math.max(0.001, Math.min(Number(gainAmount) || 0.18, 0.4));
  const currentTime = (Number(audioContext.currentTime) || 0) + Math.max(0, Number(startDelay) || 0);

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  const allowedWaveforms = new Set(["sine", "square", "triangle", "sawtooth"]);
  oscillator.type = allowedWaveforms.has(waveform) ? waveform : "square";
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


function playNoiseSFX(audioContext, {
  duration = 0.1,
  gainAmount = 0.12,
  highpass = 0
} = {}) {
  if (
    !audioContext
    || typeof audioContext.createBuffer !== "function"
    || typeof audioContext.createBufferSource !== "function"
    || typeof audioContext.createGain !== "function"
  ) {
    return false;
  }

  const sampleRate = Number(audioContext.sampleRate) || 44100;
  const safeDuration = Math.max(0.02, Math.min(Number(duration) || 0.1, 0.3));
  const sampleCount = Math.max(1, Math.floor(sampleRate * safeDuration));
  const buffer = audioContext.createBuffer(1, sampleCount, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const now = Number(audioContext.currentTime) || 0;
  const safeGain = Math.max(0.001, Math.min(Number(gainAmount) || 0.12, 0.4));

  source.buffer = buffer;
  gain.gain.setValueAtTime(safeGain, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + safeDuration);

  let destination = gain;
  if (highpass > 0 && typeof audioContext.createBiquadFilter === "function") {
    const filter = audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(
      Math.max(40, Math.min(Number(highpass) || 700, 12000)),
      now
    );
    filter.Q.setValueAtTime(0.7, now);
    gain.connect(filter);
    destination = filter;
  }

  source.connect(gain);
  destination.connect(audioContext.destination);
  source.start(now);
  source.stop(now + safeDuration);

  source.onended = () => {
    source.disconnect?.();
    gain.disconnect?.();
    if (destination !== gain) destination.disconnect?.();
  };

  return true;
}

function playSoundProfile(audioContext, profile, overrides = {}) {
  if (!audioContext || !profile) return false;

  const notes = Array.isArray(profile.notes) && profile.notes.length > 0
    ? profile.notes
    : [profile];

  let played = false;
  for (const note of notes) {
    const delay = Math.max(
      0,
      (Number(note.delay) || 0) + (Number(overrides.startDelay) || 0)
    );
    played = playScavengerSFX(
      audioContext,
      overrides.frequency ?? note.frequency ?? profile.frequency ?? 440,
      overrides.waveform ?? note.waveform ?? profile.waveform ?? "square",
      overrides.duration ?? note.duration ?? profile.duration ?? 0.1,
      overrides.gain ?? note.gain ?? profile.gain ?? 0.18,
      overrides.endFrequency ?? note.end_frequency ?? profile.end_frequency ?? 100,
      delay
    ) || played;
  }

  if (profile.noise) {
    played = playNoiseSFX(audioContext, profile.noise) || played;
  }

  return played;
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

    return playSoundProfile(audioContext, profile, options);
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
