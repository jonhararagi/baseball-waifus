import assert from "node:assert/strict";
import { CombatEffects, QUALITY_PROFILES } from "./combat_effects.js";

const effects = new CombatEffects();

assert.equal(QUALITY_PROFILES.PERFECT.shakePx, 8);
assert.equal(QUALITY_PROFILES.HOME_RUN.shakePx, 8);
assert.equal(QUALITY_PROFILES.GOOD.shakePx, 4);
assert.equal(QUALITY_PROFILES.HIT.shakePx, 4);
assert.equal(QUALITY_PROFILES.FOUL.shakePx, 2);
assert.equal(QUALITY_PROFILES.MISS.shakePx, 2);

effects.trigger("HOME_RUN", { color: "#ff4500" });
assert.equal(effects.shakePx, 8);
assert.equal(effects.trailColor, "#ff4500");

effects.trigger("FOUL", { color: "#ff007f" });
assert.equal(effects.shakePx, 2);
assert.equal(effects.trailColor, "#ff007f");

console.log("[combat-effects] quality shake tiers and biome trail color passed");
