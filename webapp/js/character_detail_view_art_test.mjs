import assert from "node:assert/strict";
import {
  buildCharacterDetailViewModel,
  resolveCharacterDetailArt
} from "./character_detail_view.js";

const character = {
  character_id: "bw001",
  canonical: {
    display_name: "Aiko Hanamori",
    rarity: "R",
    position: "3B",
    specialization: "POWER",
    element: "FIRE",
    stats: {}
  }
};

const missingBinding = {
  status: "MISSING",
  runtime_path: "./assets/characters/approved/bw001.png",
  project_asset: false
};

const fallback = resolveCharacterDetailArt("bw001", missingBinding);
assert.deepEqual(fallback, {
  artPath: "./assets/production/cards/bw001--normal.svg",
  heroPath: "./assets/production/presentation/bw001--profile.svg",
  victoryPath: "./assets/production/presentation/bw001--victory.svg",
  source: "LEGACY_BW001_FALLBACK"
});

const approvedFixture = {
  status: "APPROVED",
  runtime_path: "./assets/characters/approved/bw001.png",
  filename: "bw001.png",
  mime: "image/png",
  width: 2048,
  height: 3072,
  project_asset: true
};

const approved = resolveCharacterDetailArt("bw001", approvedFixture);
assert.deepEqual(approved, {
  artPath: "./assets/characters/approved/bw001.png",
  heroPath: "./assets/characters/approved/bw001.png",
  victoryPath: "./assets/characters/approved/bw001.png",
  source: "APPROVED_ART_REGISTRY"
});

const fallbackModel = buildCharacterDetailViewModel({
  character,
  artBinding: missingBinding
});
assert.equal(fallbackModel.artPath, "./assets/production/cards/bw001--normal.svg");
assert.equal(fallbackModel.heroPath, "./assets/production/presentation/bw001--profile.svg");
assert.equal(fallbackModel.victoryPath, "./assets/production/presentation/bw001--victory.svg");
assert.equal(fallbackModel.artSource, "LEGACY_BW001_FALLBACK");

const approvedModel = buildCharacterDetailViewModel({
  character,
  artBinding: approvedFixture
});
assert.equal(approvedModel.artPath, "./assets/characters/approved/bw001.png");
assert.equal(approvedModel.heroPath, "./assets/characters/approved/bw001.png");
assert.equal(approvedModel.victoryPath, "./assets/characters/approved/bw001.png");
assert.equal(approvedModel.artSource, "APPROVED_ART_REGISTRY");

console.log("character_detail_view_art_test: PASS");
