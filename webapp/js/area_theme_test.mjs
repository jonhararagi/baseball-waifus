import assert from "node:assert/strict";
import { AreaThemeManager, AREA_THEMES } from "./area_theme_manager.js";

const manager = new AreaThemeManager("cyberpunk");

assert.equal(manager.getCurrentTheme().id, "cyberpunk");
assert.equal(manager.getStrikeZoneColor(), "#00f0ff");
assert.equal(manager.getCurrentTheme().pitcherBlur, 3);

manager.setArea("volcano");
assert.equal(manager.getCurrentTheme().id, "volcano");
assert.equal(manager.getCurrentTheme().name, "Infierno de Magma");
assert.equal(manager.getStrikeZoneColor(), "#ff4500");
assert.equal(manager.getCurrentTheme().pitcherBlur, 4);

manager.setArea("invalid_area");
assert.equal(manager.getCurrentTheme().id, "volcano");

assert.equal(Object.keys(AREA_THEMES).length, 4);
assert.equal(AREA_THEMES.beach.groundColor, "#e3c28d");
assert.equal(AREA_THEMES.forest.id, "forest");

console.log("[area-theme] AreaThemeManager tests passed");
