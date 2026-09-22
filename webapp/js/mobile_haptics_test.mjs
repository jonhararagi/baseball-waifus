import assert from "node:assert/strict";
import { MobileHaptics, PATTERNS } from "./mobile_haptics.js";

const calls = [];
const haptics = new MobileHaptics({
  navigatorRef: {
    vibrate(pattern) {
      calls.push(pattern);
      return true;
    }
  }
});

assert.equal(haptics.isAvailable(), true);
haptics.handleGameEvent("perfect");
haptics.handleGameEvent("good");
haptics.handleGameEvent("swing");
haptics.handleGameEvent("miss");

assert.deepEqual(calls, [
  PATTERNS.strong,
  PATTERNS.short,
  PATTERNS.pulse,
  PATTERNS.pulse
]);

console.log("mobile_haptics_test: ok");
