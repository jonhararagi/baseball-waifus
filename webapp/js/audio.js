import {
  AudioBridge,
  WebAudioSynthAdapter,
  playScavengerSFX,
  SOUND_PROFILES
} from "./audio_bridge.js";

/** Public presentation-only audio facade. */
export {
  AudioBridge,
  WebAudioSynthAdapter,
  playScavengerSFX,
  SOUND_PROFILES
};

export function createAudioBridge({ adapter = null, audioContextFactory = null } = {}) {
  const resolvedAdapter = adapter || new WebAudioSynthAdapter({ audioContextFactory });
  return new AudioBridge({ adapter: resolvedAdapter });
};
