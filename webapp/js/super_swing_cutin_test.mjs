import assert from "node:assert/strict";
import { DEFAULT_WAIFU, PHASES, SuperSwingCutin } from "./super_swing_cutin.js";

const cutin = new SuperSwingCutin();

assert.deepEqual(cutin.getState().phase, "IDLE");
assert.equal(cutin.isFreezingTime(), false);

assert.equal(cutin.trigger({
  name: "Yuna",
  archetype: "SPEED",
  quote_super: "¡FULL THROTTLE!",
  skill_name: "Full Throttle"
}), true);

assert.equal(cutin.phase, PHASES[1]);
assert.equal(cutin.isFreezingTime(), true);
assert.equal(cutin.currentWaifu.name, "Yuna");

cutin.update(150);
assert.equal(cutin.phase, "HOLD");
assert.equal(cutin.bannerOffset, 0);
assert.equal(cutin.isFreezingTime(), true);

cutin.update(700);
assert.equal(cutin.phase, "EXIT");
assert.equal(cutin.isFreezingTime(), false);

cutin.update(200);
assert.equal(cutin.active, false);
assert.equal(cutin.phase, "IDLE");

assert.equal(cutin.trigger(), true);
assert.equal(cutin.currentWaifu.name, DEFAULT_WAIFU.name);
assert.equal(cutin.trigger({ name: "Blocked" }), false);

console.log("super_swing_cutin_test: ok");
