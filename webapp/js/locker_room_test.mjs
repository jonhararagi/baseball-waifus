import assert from "node:assert/strict";
import {
  LockerRoom,
  SKINS,
  DAILY_TAP_LIMIT
} from "./locker_room.js";
import { SaveSystem } from "./save_system.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.get(key) ?? null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

const storage = new MemoryStorage();
const events = [];
const waifu = {
  character_id: "bw001",
  canonical: {
    display_name: "Aiko Hanamori",
    position: "SLUGGER"
  },
  dialogue: {
    ON_TAP: "¡Contacto!"
  }
};

let locker;
const saveSystem = new SaveSystem({
  storage,
  providers: {
    gachaState: () => ({
      scavenger_scrap: 0,
      fragment_bank: 0,
      pulls_since_UR: 0,
      inventory: {
        bw001: {
          character_id: "bw001",
          display_name: "Aiko Hanamori",
          rarity: "R"
        }
      }
    }),
    teamRoster: () => ({ active_batter: "bw001", supports: [null, null] }),
    progression: () => ({}),
    audioSettings: () => ({ volume: 0.8, muted: false }),
    quality: () => "auto",
    records: () => ({}),
    lockerRoom: () => locker.getPersistence()
  },
  appliers: {
    lockerRoom: (state) => locker.applyPersistence(state)
  }
});

locker = new LockerRoom({
  saveSystem,
  getWaifu: () => waifu,
  voiceSystem: {
    emit: (event) => {
      events.push(event);
      return Promise.resolve({ ok: true, method: "speechSynthesis" });
    }
  }
});

locker.setActiveWaifu(waifu);
assert.equal(locker.getRapport("bw001"), 1);
assert.deepEqual(locker.getUnlockedSkins("bw001"), ["uniform_default"]);

for (let i = 0; i < 4; i += 1) {
  locker.tapActiveWaifu();
}

assert.equal(locker.getRapport("bw001"), 5);
assert.ok(locker.getUnlockedSkins("bw001").includes("volcano_bikini"));
assert.ok(events.filter((event) => event === "ON_TAP").length >= 4);

assert.equal(locker.equipSkin("volcano_bikini").changed, true);
assert.equal(locker.getActiveSkin("bw001"), "volcano_bikini");
assert.equal(locker.getSkinModifiers("bw001").power > 1, true);

for (let i = 0; i < 5; i += 1) {
  locker.tapActiveWaifu();
}

assert.equal(locker.getRapport("bw001"), 10);
assert.ok(locker.getUnlockedSkins("bw001").includes("damage_skin"));
assert.equal(locker.equipSkin("damage_skin").changed, true);

const saved = saveSystem.save();
assert.equal(saved.locker.rapport.bw001.level, 10);
assert.equal(saved.locker.rapport.bw001.active_skin, SKINS.damage_skin.id);

locker = new LockerRoom({
  saveSystem,
  getWaifu: () => waifu,
  voiceSystem: {
    emit: () => Promise.resolve({ ok: true })
  }
});

saveSystem.setProviders({ lockerRoom: () => locker.getPersistence() });
saveSystem.setAppliers({ lockerRoom: (state) => locker.applyPersistence(state) });
saveSystem.load();

assert.equal(locker.getRapport("bw001"), 10);
assert.equal(locker.getActiveSkin("bw001"), "damage_skin");

let attempts = 0;
while (attempts < DAILY_TAP_LIMIT + 5) {
  locker.tapActiveWaifu();
  attempts += 1;
}

assert.equal(locker.getState().dailyTaps, DAILY_TAP_LIMIT);

console.log("locker_room_test: ok");
