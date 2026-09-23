import assert from "node:assert/strict";
import { CombatHUD } from "./combat_hud.js";

const hud = new CombatHUD({
  getResources: () => ({ scrap: 123, energy: 80 })
});

assert.equal(typeof hud.triggerSuperSwing, "function");
assert.equal(typeof hud.isTimeFrozen, "function");
assert.equal(hud.isTimeFrozen(), false);

assert.equal(hud.triggerSuperSwing({
  id: "bw001",
  name: "Aiko Hanamori",
  archetype: "CONTACT",
  quote_super: "¡FULL CONTACT!",
  skill_name: "Full Contact"
}), true);

assert.equal(hud.isTimeFrozen(), true);
hud.update(0.15);
assert.equal(hud.cutin.phase, "HOLD");
assert.equal(hud.isTimeFrozen(), true);

hud.update(0.70);
assert.equal(hud.cutin.phase, "EXIT");
assert.equal(hud.isTimeFrozen(), false);

hud.update(0.20);
assert.equal(hud.cutin.active, false);
assert.equal(hud.cutin.phase, "IDLE");

console.log("combat_hud_test: ok");
