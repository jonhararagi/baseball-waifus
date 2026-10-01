import { ARC0_TEAM11_RECRUITMENT } from "./narrative_arc0_team11.js";

const CHARACTER_STORY_BINDINGS = Object.freeze({
  bw001: Object.freeze({
    id: "bw001-story-arc0",
    characterId: "bw001",
    label: "ARC 0 · TEAM 11",
    title: "TEAM 11",
    status: "AVAILABLE",
    hook: "La primera prueba de Aiko dentro del Equipo 11, donde su forma de jugar tiene que encajar con una estrategia compartida.",
    sceneId: ARC0_TEAM11_RECRUITMENT.scene_id,
    scene: ARC0_TEAM11_RECRUITMENT
  })
});

export function getCharacterStoryBinding(characterId) {
  const id = String(characterId || "");
  return CHARACTER_STORY_BINDINGS[id] || null;
}

export { CHARACTER_STORY_BINDINGS };
