import {
  AudioBridge,
  WebAudioSynthAdapter,
  playScavengerSFX
} from "./audio_bridge.js";

/** Public presentation-only audio facade. */
export {
  AudioBridge,
  WebAudioSynthAdapter,
  playScavengerSFX
};

export function createAudioBridge({ adapter = null, audioContextFactory = null } = {}) {
  const resolvedAdapter = adapter || new WebAudioSynthAdapter({ audioContextFactory });
  return new AudioBridge({ adapter: resolvedAdapter });
};
