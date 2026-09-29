import assert from "node:assert/strict";
import { BatterRenderer, BATTER_STATES } from "./batter_renderer.js";

const renderer = new BatterRenderer();

assert.equal(renderer.getState(), BATTER_STATES.IDLE);

renderer.setState(BATTER_STATES.WINDUP);
assert.equal(renderer.getState(), BATTER_STATES.WINDUP);

for (let index = 0; index < 5; index += 1) {
  renderer.update(0.08);
}
assert.equal(renderer.getState(), BATTER_STATES.SWING);

const pose = renderer.getBatPose(360, 640);
assert.ok(Number.isFinite(pose.rotation));
assert.ok(pose.length > 0);

const anchoredPose = renderer.getBatPose(720, 1280, { anchorX: 360, anchorY: 998.4 });
assert.equal(anchoredPose.x, 360);
assert.ok(Math.abs(anchoredPose.y - 998.4) <= 8);

renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
assert.equal(renderer.getState(), BATTER_STATES.FOLLOW_THROUGH);

renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
renderer.update(0.08);
assert.equal(renderer.getState(), BATTER_STATES.IDLE);

assert.throws(
  () => renderer.setState("NOT_A_STATE"),
  /Invalid BatterRenderer transition/
);

console.log("[batter-renderer] IDLE -> WINDUP -> SWING -> FOLLOW_THROUGH -> IDLE passed");
