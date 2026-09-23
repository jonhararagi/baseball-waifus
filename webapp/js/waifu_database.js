const IMAGE_PROVIDER_BASE = "https://api.dicebear.com/9.x/lorelei/png";

export const ARCHETYPE_COLORS = Object.freeze({
  POWER: "#ff3b30",
  CONTACT: "#00e5ff",
  SPEED: "#ffd166",
  EYE: "#a855f7",
  DEFAULT: "#00f0ff"
});

export const WAIFU_DATABASE = Object.freeze({
  cari: Object.freeze({
    id: "cari",
    name: "Cari",
    archetype: "POWER",
    role: "Slugger",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Cari-Capybara&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Cari-Capybara-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Cari-Capybara-Sprite&size=256&backgroundColor=0b0b14"
  }),
  cami: Object.freeze({
    id: "cami",
    name: "Cami",
    archetype: "EYE",
    role: "Strategist",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Cami-Capybara&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Cami-Capybara-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Cami-Capybara-Sprite&size=256&backgroundColor=0b0b14"
  }),
  sunna: Object.freeze({
    id: "sunna",
    name: "Sunna",
    archetype: "POWER",
    role: "Vanguard",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Sunna-Serpent&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Sunna-Serpent-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Sunna-Serpent-Sprite&size=256&backgroundColor=0b0b14"
  }),
  chie: Object.freeze({
    id: "chie",
    name: "Chie",
    archetype: "CONTACT",
    role: "Contact",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Chie-Mouse&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Chie-Mouse-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Chie-Mouse-Sprite&size=256&backgroundColor=0b0b14"
  }),
  scarlet: Object.freeze({
    id: "scarlet",
    name: "Scarlet",
    archetype: "POWER",
    role: "Slugger",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Scarlet-Bat&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Scarlet-Bat-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Scarlet-Bat-Sprite&size=256&backgroundColor=0b0b14"
  }),
  chloe: Object.freeze({
    id: "chloe",
    name: "Chloe",
    archetype: "SPEED",
    role: "Support",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Chloe-Bat&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Chloe-Bat-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Chloe-Bat-Sprite&size=256&backgroundColor=0b0b14"
  }),
  fenrir: Object.freeze({
    id: "fenrir",
    name: "Fenrir",
    archetype: "SPEED",
    role: "Runner",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Fenrir-Wolf&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Fenrir-Wolf-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Fenrir-Wolf-Sprite&size=256&backgroundColor=0b0b14"
  }),
  aiko_hanamori: Object.freeze({
    id: "aiko_hanamori",
    name: "Aiko Hanamori",
    archetype: "CONTACT",
    role: "Slugger",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Aiko-Hanamori&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Aiko-Hanamori-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Aiko-Hanamori-Sprite&size=256&backgroundColor=0b0b14"
  }),
  reina_kurose: Object.freeze({
    id: "reina_kurose",
    name: "Reina Kurose",
    archetype: "EYE",
    role: "Pitcher",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Reina-Kurose&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Reina-Kurose-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Reina-Kurose-Sprite&size=256&backgroundColor=0b0b14"
  }),
  roxie_vane: Object.freeze({
    id: "roxie_vane",
    name: "Roxie Vane",
    archetype: "POWER",
    role: "Slugger",
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=Roxie-Vane&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=Roxie-Vane-Card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=Roxie-Vane-Sprite&size=256&backgroundColor=0b0b14"
  })
});

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function slugSeed(value) {
  return encodeURIComponent(String(value || "Waifu"));
}

export function createRemoteWaifuAssets(character = {}) {
  const id = normalizeId(
    character?.id
      || character?.character_id
      || character?.card_id
      || character?.canonical?.display_name
      || "waifu"
  );
  const displayName = String(
    character?.canonical?.display_name
      || character?.display_name
      || character?.name
      || id
  );
  const seed = slugSeed(displayName + "-" + id);

  return Object.freeze({
    avatarUrl: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-avatar&size=512&backgroundColor=0b0b14",
    cardArtUrl: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-card&size=1024&backgroundColor=0b0b14",
    spriteSheetUrl: IMAGE_PROVIDER_BASE + "?seed=" + seed + "-sprite&size=256&backgroundColor=0b0b14"
  });
}

export function getWaifu(characterId) {
  const id = normalizeId(characterId);
  return WAIFU_DATABASE[id] || null;
}

export function getWaifuAssets(characterOrId) {
  const id = typeof characterOrId === "string"
    ? normalizeId(characterOrId)
    : normalizeId(
      characterOrId?.id
        || characterOrId?.character_id
        || characterOrId?.card_id
        || characterOrId?.canonical?.display_name
    );

  const known = WAIFU_DATABASE[id];
  if (known) {
    return {
      avatarUrl: known.avatarUrl,
      cardArtUrl: known.cardArtUrl,
      spriteSheetUrl: known.spriteSheetUrl
    };
  }

  return createRemoteWaifuAssets(
    typeof characterOrId === "string"
      ? { id: characterOrId }
      : characterOrId
  );
}

export function getArchetypeColor(archetype = "DEFAULT") {
  const key = String(archetype || "DEFAULT").toUpperCase();
  return ARCHETYPE_COLORS[key] || ARCHETYPE_COLORS.DEFAULT;
}

export function listWaifus() {
  return Object.values(WAIFU_DATABASE).map((waifu) => ({
    ...waifu,
    assets: getWaifuAssets(waifu)
  }));
}
