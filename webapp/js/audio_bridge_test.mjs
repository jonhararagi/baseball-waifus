import assert from "node:assert/strict";
import { AudioBridge } from "./audio_bridge.js";

const calls = [];
const bridge = new AudioBridge({
  adapter: {
    play(soundId, options) {
      calls.push({ soundId, options });
      return true;
    }
  }
});

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

console.log("[audio-bridge] contract validation passed");
