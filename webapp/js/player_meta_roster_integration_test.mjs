import assert from "node:assert/strict";
import { createInitialPlayerMetaState, createPlayerIdentity, PlayerMetaAuthority } from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { createPlayerMetaRosterIntegration } from "./player_meta_roster_integration.js";
import { TeamManager } from "./team_manager.js";
class MemoryStorage { constructor() { this.data = new Map(); } getItem(key) { return this.data.has(key) ? this.data.get(key) : null; } setItem(key, value) { this.data.set(key, String(value)); } removeItem(key) { this.data.delete(key); } }
function createFixture(playerId = "roster-player") {
  const storage = new MemoryStorage(); const identity = createPlayerIdentity({ playerId });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw001", quantity: 1 });
  authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw003", quantity: 2 });
  authority.dispatch({ type: "ADD_CHARACTER", characterId: "bw008", quantity: 1 });
  adapter.save(authority.getSnapshot());
  return { storage, identity, adapter, authority, integration: createPlayerMetaRosterIntegration({ playerMetaIntegration: { authority, persistenceAdapter: adapter } }) };
}
const { integration, adapter, identity } = createFixture();
assert.equal(integration.isOwned("bw001"), true);
assert.equal(integration.getOwnership("bw003")?.quantity, 2);
assert.equal(integration.isUnlocked("bw008"), true);
assert.equal(integration.isOwned("bw999"), false);
assert.equal(integration.isUnlocked("bw999"), false);
assert.deepEqual(integration.setActiveBatter("bw001"), { active_batter: "bw001", supports: [null, null] });
integration.setSupport(0, "bw003"); integration.setSupport(1, "bw008");
assert.deepEqual(integration.getRoster(), { active_batter: "bw001", supports: ["bw003", "bw008"] });
assert.throws(() => integration.setSupport(1, "bw003"), /DUPLICATE_SUPPORT/);
assert.throws(() => integration.setSupport(0, "bw999"), /SUPPORT_NOT_UNLOCKED/);
assert.throws(() => integration.setActiveBatter("bw999"), /ACTIVE_BATTER_NOT_UNLOCKED/);
assert.throws(() => integration.setSupport(0, "bw001"), /ACTIVE_BATTER_CANNOT_BE_SUPPORT/);
const snapshot = integration.getSnapshot();
assert.equal(Object.isFrozen(snapshot), true); assert.equal(Object.isFrozen(snapshot.roster), true); assert.equal(Object.isFrozen(snapshot.inventory), true);
assert.deepEqual(integration.getInventory().bw003, { quantity: 2, unlocked: true });
assert.throws(() => { snapshot.roster.activeBatter = "bw008"; }, TypeError);
const view = integration.buildRosterView([{ character_id: "bw001" }, { character_id: "bw003" }, { character_id: "bw008" }, { character_id: "bw999" }]);
assert.deepEqual(view, [
  { character_id: "bw001", owned: true, unlocked: true, quantity: 1, active_batter: true, support_slot: null },
  { character_id: "bw003", owned: true, unlocked: true, quantity: 2, active_batter: false, support_slot: 0 },
  { character_id: "bw008", owned: true, unlocked: true, quantity: 1, active_batter: false, support_slot: 1 },
  { character_id: "bw999", owned: false, unlocked: false, quantity: 0, active_batter: false, support_slot: null }
]);
const persisted = adapter.load(identity); assert.deepEqual(persisted.roster, integration.getSnapshot().roster); assert.deepEqual(persisted.inventory.characters, integration.getSnapshot().inventory.characters);
const authorityB = new PlayerMetaAuthority(persisted); const integrationB = createPlayerMetaRosterIntegration({ playerMetaIntegration: { authority: authorityB, persistenceAdapter: adapter } });
assert.deepEqual(integrationB.getRoster(), integration.getRoster());
assert.deepEqual(integrationB.buildRosterView([{ character_id: "bw001" }, { character_id: "bw003" }]), [
  { character_id: "bw001", owned: true, unlocked: true, quantity: 1, active_batter: true, support_slot: null },
  { character_id: "bw003", owned: true, unlocked: true, quantity: 2, active_batter: false, support_slot: 0 }
]);
assert.deepEqual(integration.getRoster(), integrationB.getRoster());
const isolatedStorage = new MemoryStorage(); const isolatedAdapter = new PlayerMetaPersistenceAdapter({ storage: isolatedStorage });
const isolatedIdentity = createPlayerIdentity({ playerId: "other-player" }); const isolatedAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(isolatedIdentity)); isolatedAdapter.save(isolatedAuthority.getSnapshot());
const isolatedIntegration = createPlayerMetaRosterIntegration({ playerMetaIntegration: { authority: isolatedAuthority, persistenceAdapter: isolatedAdapter } });
assert.equal(isolatedIntegration.isOwned("bw001"), false);

const teamManager = new TeamManager({
  playerMetaRosterIntegration: integration,
  storage: fixture.storage,
  getCharacter: (id) => ({ character_id: id, canonical: { display_name: id } }),
  getInventory: () => integration.getInventory()
});
assert.deepEqual(teamManager.getRoster(), integration.getRoster());
assert.deepEqual(teamManager.getActiveBatterId(), "bw001");
assert.deepEqual(teamManager.getSupportWaifus().map((unit) => unit.character_id), ["bw003", "bw008"]);
teamManager.setSupport(0, "bw003");
assert.deepEqual(teamManager.getRoster(), { active_batter: "bw001", supports: ["bw003", "bw008"] });

const beforeInvalid = integration.getSnapshot(); assert.throws(() => integration.setRoster({ activeBatter: "bw999", supports: ["bw003", null] }), /ACTIVE_BATTER_NOT_UNLOCKED/); assert.deepEqual(integration.getSnapshot(), beforeInvalid);
console.log("player_meta_roster_integration_test: PASS");