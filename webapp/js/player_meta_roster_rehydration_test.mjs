import assert from "node:assert/strict";
import { GachaController, SCAVENGER_SCRAP_COST } from "./gacha_controller.js";
import { PlayerMetaAuthority, createInitialPlayerMetaState, createPlayerIdentity } from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { createPlayerMetaRosterIntegration } from "./player_meta_roster_integration.js";
import { TeamManager } from "./team_manager.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

const schema = {
  gacha: {
    rates: { status: "active_canonical_game_table_v1", R: 100 },
    pity: { model: "per_banner_counter", soft_pity: { enabled: false }, hard_pity: { enabled: true, pull_limit: 80 } }
  }
};

const queue = {
  batch_units: [
    { character_id: "bw001", canonical: { display_name: "Aiko", rarity: "R" } },
    { character_id: "bw003", canonical: { display_name: "Miu", rarity: "R" } },
    { character_id: "bw008", canonical: { display_name: "Nao", rarity: "R" } }
  ]
};

function fetchImpl(url) {
  return Promise.resolve({
    ok: true,
    json: async () => String(url).includes("game_schemas") ? schema : queue
  });
}

function makeController(storage, playerId) {
  const identity = createPlayerIdentity({ playerId });
  const adapter = new PlayerMetaPersistenceAdapter({ storage });
  const authority = new PlayerMetaAuthority(createInitialPlayerMetaState(identity));
  return new GachaController({
    storage,
    playerMetaStorage: storage,
    playerMetaIdentity: identity,
    playerMetaPersistenceAdapter: adapter,
    playerMetaAuthority: authority,
    fetchImpl,
    rng: (() => {
      const values = [0.01, 0.00, 0.01, 0.34, 0.01, 0.67];
      let index = 0;
      return () => values[Math.min(index++, values.length - 1)];
    })(),
    now: () => 123456789
  });
}

const storage = new MemoryStorage();
const controller = makeController(storage, "qa-player-a");
await controller.initialize();
await controller.addScrap(SCAVENGER_SCRAP_COST * 3);

const first = await controller.rollGacha();
const second = await controller.rollGacha();
const third = await controller.rollGacha();
assert.deepEqual(
  [first.character.character_id, second.character.character_id, third.character.character_id],
  ["bw001", "bw003", "bw008"]
);

const metaBeforeRoster = controller.playerMetaIntegration.getSnapshot();
assert.equal(metaBeforeRoster.inventory.characters.bw001.quantity, 1);
assert.equal(metaBeforeRoster.inventory.characters.bw001.unlocked, true);
assert.equal(metaBeforeRoster.inventory.characters.bw003.quantity, 1);
assert.equal(metaBeforeRoster.inventory.characters.bw008.quantity, 1);
assert.equal(metaBeforeRoster.roster.activeBatter, "bw001");
assert.deepEqual(metaBeforeRoster.roster.supports, [null, null]);

const roster = createPlayerMetaRosterIntegration({ playerMetaIntegration: controller.playerMetaIntegration });
roster.setSupport(0, "bw003");
roster.setSupport(1, "bw008");

const persisted = new PlayerMetaPersistenceAdapter({ storage }).load(createPlayerIdentity({ playerId: "qa-player-a" }));
assert.deepEqual(persisted.inventory.characters, controller.playerMetaIntegration.getSnapshot().inventory.characters);
assert.deepEqual(persisted.roster, { activeBatter: "bw001", supports: ["bw003", "bw008"] });

const rehydratedAuthority = new PlayerMetaAuthority(persisted);
const rehydratedRoster = createPlayerMetaRosterIntegration({
  playerMetaIntegration: {
    authority: rehydratedAuthority,
    persistenceAdapter: new PlayerMetaPersistenceAdapter({ storage })
  }
});
assert.deepEqual(rehydratedRoster.getRoster(), { active_batter: "bw001", supports: ["bw003", "bw008"] });
assert.equal(rehydratedRoster.isOwned("bw001"), true);
assert.equal(rehydratedRoster.isUnlocked("bw001"), true);
assert.equal(rehydratedRoster.getOwnership("bw003").quantity, 1);

const rehydratedTeam = new TeamManager({
  playerMetaRosterIntegration: rehydratedRoster,
  getCharacter: (id) => ({ character_id: id, canonical: { display_name: id } })
});
assert.equal(rehydratedTeam.getActiveBatterId(), "bw001");
assert.deepEqual(rehydratedTeam.getSupportIds(), ["bw003", "bw008"]);

assert.throws(() => { persisted.roster.supports[0] = "bw999"; }, TypeError);
assert.throws(() => { persisted.inventory.characters.bw001.quantity = 99; }, TypeError);
assert.equal(rehydratedRoster.getOwnership("bw001").quantity, 1);

const controllerReloaded = makeController(storage, "qa-player-a");
await controllerReloaded.initialize();
assert.equal(controllerReloaded.getActiveBatter(), "bw001");
assert.equal(controllerReloaded.getState().inventory.bw001.duplicate_count, 1);
assert.equal(controllerReloaded.getState().inventory.bw003.duplicate_count, 1);
assert.equal(controllerReloaded.getState().inventory.bw008.duplicate_count, 1);

const isolatedStorage = storage;
const otherIdentity = createPlayerIdentity({ playerId: "qa-player-b" });
const otherAdapter = new PlayerMetaPersistenceAdapter({ storage: isolatedStorage });
const otherAuthority = new PlayerMetaAuthority(createInitialPlayerMetaState(otherIdentity));
otherAdapter.save(otherAuthority.getSnapshot());
const isolated = otherAdapter.load(otherIdentity);
assert.equal(isolated.inventory.characters.bw001, undefined);
assert.equal(isolated.roster.activeBatter, null);
assert.deepEqual(isolated.roster.supports, [null, null]);
assert.notEqual(otherAdapter.keyFor(otherIdentity), otherAdapter.keyFor(createPlayerIdentity({ playerId: "qa-player-a" })));

const rehydratedAgain = new PlayerMetaPersistenceAdapter({ storage }).load(createPlayerIdentity({ playerId: "qa-player-a" }));
assert.deepEqual(rehydratedAgain, persisted);
assert.equal(JSON.stringify(rehydratedAgain), JSON.stringify(persisted));

console.log("T060 player-meta -> roster rehydration QA: PASS");
