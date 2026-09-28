import assert from "node:assert/strict";
import {
  REACTION_DEFAULTS,
  REACTION_SIGNAL,
  ReactionRuleSystem,
  InactivitySignalDetector
} from "./reaction_rules.js";

const detector = new InactivitySignalDetector({ thresholdSeconds: 5 });
assert.equal(detector.update(4.9, true), false);
assert.equal(detector.update(0.1, true), true);
assert.equal(detector.update(1, true), false);
detector.reset();
assert.equal(detector.update(5, false), false);
assert.equal(detector.update(5, true), true);

let now = 1000;
const system = new ReactionRuleSystem({ now: () => now });

const eligible = system.findEligible({
  signal: REACTION_SIGNAL.INACTIVITY,
  characterId: "bw001",
  context: "locker"
});
assert.equal(eligible?.id, "locker-inactivity");

const first = system.trigger({
  signal: REACTION_SIGNAL.INACTIVITY,
  characterId: "bw001",
  context: "locker"
});
assert.equal(first?.reaction, "REACTION_INACTIVITY");

now += 100;
assert.equal(system.trigger({
  signal: REACTION_SIGNAL.INACTIVITY,
  characterId: "bw001",
  context: "locker"
}), null);

now += REACTION_DEFAULTS.cooldownSeconds * 1000;
assert.equal(system.trigger({
  signal: REACTION_SIGNAL.INACTIVITY,
  characterId: "bw001",
  context: "locker"
}), null);

const skip = system.trigger({
  signal: REACTION_SIGNAL.SKIP,
  characterId: "bw001",
  context: "dialogue"
});
assert.equal(skip?.reaction, "REACTION_SKIP");

assert.equal(system.findEligible({
  signal: REACTION_SIGNAL.INACTIVITY,
  characterId: "bw001",
  context: "dialogue"
}), null);

console.log("reaction_rules_test: ok");
