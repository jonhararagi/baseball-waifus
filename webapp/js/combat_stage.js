const DEPTH_SCALE = Object.freeze({ FAR: 0.82, MID: 1, NEAR: 1.16 });
const DEPTH_ORDER = Object.freeze({ FAR: 10, MID: 20, NEAR: 30 });
export const COMBAT_STAGE_DEPTH = Object.freeze({ FAR: "FAR", MID: "MID", NEAR: "NEAR" });
export const COMBAT_STAGE_LAYERS = Object.freeze(["BACKGROUND", "MIDGROUND", "GROUND", "FOREGROUND"]);
export const COMBAT_STAGE_CAMERA_ANCHORS = Object.freeze(["FORMATION", "PLAYER_FOCUS", "ENEMY_FOCUS", "ACTION", "IMPACT", "REACTION", "RETURN"]);
export const COMBAT_STAGE_ACTOR_ANCHORS = Object.freeze(["BODY", "HEAD", "BAT", "HAND", "PROJECTILE", "IMPACT", "REACTION"]);
export const COMBAT_STAGE_SET_PIECES = Object.freeze(["PLAYER_RAMP", "CENTER_PLATFORM", "ENEMY_PLATFORM", "FRONT_STEP"]);
export const COMBAT_STAGE_ACTION_CONTRACT = Object.freeze({
  id: "CHARACTER_CINEMATIC_ACTION",
  phases: Object.freeze(["ATTACKER_FOCUS", "ACTION", "IMPACT", "TARGET_REACTION", "COMBAT_RETURN"]),
  anchors: COMBAT_STAGE_ACTOR_ANCHORS,
  projectileSource: "BAT_TO_PROJECTILE",
  projectileTarget: "IMPACT"
});
export const COMBAT_STAGE_ULTIMATE_CONTRACT = Object.freeze({
  id: "ULTIMATE_CINEMATIC_STAGING",
  phases: Object.freeze([
    "ULTIMATE_TRIGGER",
    "ULTIMATE_STAGING",
    "ULTIMATE_CHARACTER_FOCUS",
    "ULTIMATE_ACTION_PREP",
    "ULTIMATE_RETURN"
  ]),
  cameraAnchors: Object.freeze(["FORMATION", "PLAYER_FOCUS", "ACTION", "RETURN"]),
  staging: "TEMPORARY_PRESENTATION_ONLY",
  gameplayAuthority: "EXTERNAL_RESULT"
});

const ACTOR_CAMERA_ALIAS = Object.freeze({
  PLAYER_FOCUS: "FOCUS",
  ENEMY_FOCUS: "FOCUS",
  ACTION: "ACTION",
  IMPACT: "IMPACT",
  REACTION: "REACTION"
});
const DEFAULT_ZONES = Object.freeze({
  PLAYER_ZONE: Object.freeze({ x: 0.07, y: 0.34, width: 0.54, height: 0.49 }),
  ENEMY_ZONE: Object.freeze({ x: 0.63, y: 0.22, width: 0.31, height: 0.55 })
});
const DEFAULT_LAYERS = Object.freeze([
  Object.freeze({ id: "BACKGROUND", parallax: 0.06, assetSlot: "stage.background.far", zIndex: 0 }),
  Object.freeze({ id: "MIDGROUND", parallax: 0.18, assetSlot: "stage.background.mid", zIndex: 10 }),
  Object.freeze({ id: "GROUND", parallax: 0.58, assetSlot: "stage.ground", zIndex: 20 }),
  Object.freeze({ id: "FOREGROUND", parallax: 1, assetSlot: "stage.foreground", zIndex: 40 })
]);
const DEFAULT_CAMERA_ANCHORS = Object.freeze({
  FORMATION: Object.freeze({ x: 0.5, y: 0.5, zoom: 0.92, rotationDeg: 0, shot: "GENERAL", angle: "HIGH" }),
  PLAYER_FOCUS: Object.freeze({ x: 0.25, y: 0.54, zoom: 1.13, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  ENEMY_FOCUS: Object.freeze({ x: 0.78, y: 0.43, zoom: 1.13, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  ACTION: Object.freeze({ x: 0.34, y: 0.51, zoom: 1.2, rotationDeg: -2, shot: "CLOSE_UP", angle: "LOW" }),
  IMPACT: Object.freeze({ x: 0.71, y: 0.43, zoom: 1.26, rotationDeg: 2, shot: "CLOSE_UP", angle: "LOW" }),
  REACTION: Object.freeze({ x: 0.79, y: 0.45, zoom: 1.1, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  RETURN: Object.freeze({ x: 0.5, y: 0.51, zoom: 0.96, rotationDeg: 0, shot: "GENERAL", angle: "HIGH" })
});
const DEFAULT_SET_PIECES = Object.freeze([
  Object.freeze({ id: "PLAYER_RAMP", type: "RAMP", x: 0.08, y: 0.63, width: 0.34, height: 0.18, elevation: 0.16, depth: "MID", zone: "PLAYER_ZONE" }),
  Object.freeze({ id: "CENTER_PLATFORM", type: "PLATFORM", x: 0.39, y: 0.55, width: 0.22, height: 0.1, elevation: 0.1, depth: "NEAR", zone: "PLAYER_ZONE" }),
  Object.freeze({ id: "ENEMY_PLATFORM", type: "PLATFORM", x: 0.66, y: 0.37, width: 0.23, height: 0.1, elevation: 0.2, depth: "MID", zone: "ENEMY_ZONE" }),
  Object.freeze({ id: "FRONT_STEP", type: "RAMP", x: 0.23, y: 0.82, width: 0.54, height: 0.1, elevation: 0.08, depth: "NEAR", zone: "PLAYER_ZONE" })
]);
const DEFAULT_PLAYER_POSITIONS = Object.freeze([
  Object.freeze({ x: 0.19, y: 0.58, depth: "MID", scale: 0.94, elevation: 0.16, facing: 1 }),
  Object.freeze({ x: 0.09, y: 0.46, depth: "FAR", scale: 0.84, elevation: 0.06, facing: 1 }),
  Object.freeze({ x: 0.37, y: 0.68, depth: "NEAR", scale: 1.04, elevation: 0.08, facing: 1 }),
  Object.freeze({ x: 0.48, y: 0.5, depth: "MID", scale: 0.96, elevation: 0.2, facing: 1 })
]);
const DEFAULT_ENEMY_POSITION = Object.freeze({ x: 0.76, y: 0.42, depth: "MID", scale: 1.06, elevation: 0.2, facing: -1 });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function finite(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
function normalizeDepth(value) {
  const depth = String(value || "").toUpperCase();
  return Object.prototype.hasOwnProperty.call(DEPTH_SCALE, depth) ? depth : "MID";
}
function normalizePoint(value, fallback) {
  return { x: clamp(finite(value?.x, fallback.x), 0, 1), y: clamp(finite(value?.y, fallback.y), 0, 1) };
}
function normalizeAnchor(value, fallback) {
  const source = value && typeof value === "object" ? value : {};
  const base = fallback && typeof fallback === "object" ? fallback : DEFAULT_CAMERA_ANCHORS.RETURN;
  return deepFreeze({
    x: clamp(finite(source.x, base.x), 0, 1),
    y: clamp(finite(source.y, base.y), 0, 1),
    zoom: clamp(finite(source.zoom, base.zoom), 0.5, 2),
    rotationDeg: clamp(finite(source.rotationDeg, base.rotationDeg || 0), -15, 15),
    shot: String(source.shot || base.shot || "GENERAL").toUpperCase(),
    angle: String(source.angle || base.angle || "EYE_LEVEL").toUpperCase()
  });
}
function normalizeZone(value, fallback) {
  const source = value && typeof value === "object" ? value : {};
  return deepFreeze({
    x: clamp(finite(source.x, fallback.x), 0, 1),
    y: clamp(finite(source.y, fallback.y), 0, 1),
    width: clamp(finite(source.width, fallback.width), 0.02, 1),
    height: clamp(finite(source.height, fallback.height), 0.02, 1)
  });
}
function normalizeSetPiece(piece, index) {
  const fallback = DEFAULT_SET_PIECES[index % DEFAULT_SET_PIECES.length];
  return deepFreeze({
    id: String(piece?.id || fallback.id).toUpperCase(),
    type: String(piece?.type || fallback.type).toUpperCase(),
    x: clamp(finite(piece?.x, fallback.x), 0, 1),
    y: clamp(finite(piece?.y, fallback.y), 0, 1),
    width: clamp(finite(piece?.width, fallback.width), 0.04, 0.9),
    height: clamp(finite(piece?.height, fallback.height), 0.03, 0.5),
    elevation: clamp(finite(piece?.elevation, fallback.elevation), 0, 0.5),
    depth: normalizeDepth(piece?.depth || fallback.depth),
    zone: String(piece?.zone || fallback.zone).toUpperCase()
  });
}
function buildActorAnchors(position, depth, scale, elevation) {
  const depthOffset = depth === "NEAR" ? 0.035 : depth === "FAR" ? -0.025 : 0;
  const elevationOffset = clamp(elevation, 0, 0.5) * 0.06;
  const focusZoom = clamp(1.08 + scale * 0.1, 1.08, 1.3);
  const base = { x: position.x, y: clamp(position.y - elevationOffset, 0, 1) };
  return {
    BODY: base,
    HEAD: { x: position.x, y: clamp(base.y - 0.08, 0, 1) },
    BAT: { x: clamp(position.x - 0.04, 0, 1), y: clamp(base.y - 0.05, 0, 1) },
    HAND: { x: clamp(position.x - 0.01, 0, 1), y: clamp(base.y - 0.02, 0, 1) },
    PROJECTILE: { x: clamp(position.x + 0.085, 0, 1), y: clamp(base.y - 0.02, 0, 1) },
    IMPACT: { x: clamp(position.x + depthOffset, 0, 1), y: clamp(base.y - 0.015, 0, 1) },
    REACTION: { x: clamp(position.x + depthOffset * 0.5, 0, 1), y: clamp(base.y, 0, 1) },
    FOCUS: { x: position.x, y: clamp(base.y - 0.05, 0, 1), zoom: focusZoom, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" },
    ACTION: { x: clamp(position.x - 0.035, 0, 1), y: clamp(base.y - 0.045, 0, 1), zoom: clamp(focusZoom + 0.06, 1.12, 1.36), rotationDeg: 0, shot: "CLOSE_UP", angle: "LOW" },
    IMPACT_CAMERA: { x: clamp(position.x + depthOffset, 0, 1), y: clamp(base.y - 0.035, 0, 1), zoom: clamp(focusZoom + 0.08, 1.12, 1.4), rotationDeg: depth === "NEAR" ? -2 : 1, shot: "CLOSE_UP", angle: "LOW" },
    REACTION_CAMERA: { x: clamp(position.x + depthOffset * 0.6, 0, 1), y: clamp(base.y - 0.02, 0, 1), zoom: clamp(focusZoom + 0.01, 1.08, 1.3), rotationDeg: depth === "FAR" ? -1 : 0, shot: "MEDIUM", angle: "EYE_LEVEL" }
  };
}
export function createCombatActor({
  actorId, team = "PLAYER", kind = "CHARACTER", position = { x: 0.5, y: 0.5 }, depth = "MID",
  scale = null, rotation = 0, elevation = 0, facing = null, visual = {}, state = "IDLE",
  cameraAnchors = {}, actionAnchors = {}, vfxAnchors = {}
} = {}) {
  const id = String(actorId || "").trim();
  if (!id) throw new TypeError("Combat actor requires actorId");
  const normalizedDepth = normalizeDepth(depth);
  const normalizedPosition = normalizePoint(position, { x: 0.5, y: 0.5 });
  const normalizedScale = clamp(finite(scale, DEPTH_SCALE[normalizedDepth]), 0.55, 1.5);
  const normalizedElevation = clamp(finite(elevation, 0), 0, 0.5);
  const normalizedFacing = finite(facing, String(team).toUpperCase() === "ENEMY" ? -1 : 1) < 0 ? -1 : 1;
  const generated = buildActorAnchors(normalizedPosition, normalizedDepth, normalizedScale, normalizedElevation);
  return deepFreeze({
    actorId: id, team: String(team || "PLAYER").toUpperCase(), kind: String(kind || "CHARACTER").toUpperCase(),
    position: deepFreeze(normalizedPosition), depth: normalizedDepth, depthValue: DEPTH_ORDER[normalizedDepth],
    scale: normalizedScale, elevation: normalizedElevation, facing: normalizedFacing, rotation: clamp(finite(rotation, 0), -45, 45),
    visual: deepFreeze({ ...(visual && typeof visual === "object" ? clone(visual) : {}) }),
    state: String(state || "IDLE").toUpperCase(),
    cameraAnchors: deepFreeze({
      FOCUS: normalizeAnchor(cameraAnchors?.FOCUS, generated.FOCUS),
      ACTION: normalizeAnchor(cameraAnchors?.ACTION, generated.ACTION),
      IMPACT: normalizeAnchor(cameraAnchors?.IMPACT, generated.IMPACT_CAMERA),
      REACTION: normalizeAnchor(cameraAnchors?.REACTION, generated.REACTION_CAMERA)
    }),
    actionAnchors: deepFreeze({
      BODY: generated.BODY, HEAD: generated.HEAD, BAT: generated.BAT, HAND: generated.HAND, PROJECTILE: generated.PROJECTILE, IMPACT: generated.IMPACT, REACTION: generated.REACTION,
      ...(actionAnchors && typeof actionAnchors === "object" ? clone(actionAnchors) : {})
    }),
    vfxAnchors: deepFreeze({
      BODY: generated.BODY, HEAD: generated.HEAD, BAT: generated.BAT, HAND: generated.HAND, PROJECTILE: generated.PROJECTILE, IMPACT: generated.IMPACT, REACTION: generated.REACTION,
      ...(vfxAnchors && typeof vfxAnchors === "object" ? clone(vfxAnchors) : {})
    })
  });
}
export function createCombatStageActors({ batter = {}, enemy = {} } = {}) {
  const batterId = String(batter?.id || batter?.character_id || batter?.card_id || "selected-character");
  const enemyId = String(enemy?.id || enemy?.character_id || enemy?.card_id || "enemy-fixture");
  const players = DEFAULT_PLAYER_POSITIONS.map((position, index) => {
    const primary = index === 0;
    return createCombatActor({
      actorId: primary ? batterId : "fixture-player-" + String(index + 1).padStart(2, "0"),
      team: "PLAYER", kind: primary ? "CHARACTER" : "FIXTURE", position, depth: position.depth, scale: position.scale, elevation: position.elevation, facing: position.facing,
      visual: primary
        ? { name: batter?.name || batter?.display_name || "Selected Character", source: "RUNTIME_CHARACTER" }
        : { name: "ALLY FIXTURE " + String(index + 1).padStart(2, "0"), source: "T078_BLOCKOUT_FIXTURE" }
    });
  });
  players.push(createCombatActor({
    actorId: enemyId, team: "ENEMY", kind: "ENEMY", position: DEFAULT_ENEMY_POSITION,
    depth: DEFAULT_ENEMY_POSITION.depth, scale: DEFAULT_ENEMY_POSITION.scale, elevation: DEFAULT_ENEMY_POSITION.elevation, facing: DEFAULT_ENEMY_POSITION.facing,
    visual: { name: enemy?.name || enemy?.display_name || "Enemy", source: enemy?.id ? "RUNTIME_TARGET" : "T078_BLOCKOUT_FIXTURE" }
  }));
  return players;
}
export class CombatStage {
  constructor({ width = 720, height = 1280, zones = DEFAULT_ZONES, layers = DEFAULT_LAYERS, cameraAnchors = DEFAULT_CAMERA_ANCHORS, setPieces = DEFAULT_SET_PIECES, actors = [] } = {}) {
    this.designWidth = Math.max(1, finite(width, 720));
    this.designHeight = Math.max(1, finite(height, 1280));
    this.zones = deepFreeze({
      PLAYER_ZONE: normalizeZone(zones?.PLAYER_ZONE, DEFAULT_ZONES.PLAYER_ZONE),
      ENEMY_ZONE: normalizeZone(zones?.ENEMY_ZONE, DEFAULT_ZONES.ENEMY_ZONE)
    });
    this.layers = deepFreeze((Array.isArray(layers) ? layers : DEFAULT_LAYERS).map((layer, index) => deepFreeze({
      id: String(layer?.id || COMBAT_STAGE_LAYERS[index] || "LAYER_" + index).toUpperCase(),
      parallax: clamp(finite(layer?.parallax, DEFAULT_LAYERS[index]?.parallax || 0), 0, 1),
      assetSlot: String(layer?.assetSlot || ""), zIndex: finite(layer?.zIndex, index * 10)
    })));
    this.setPieces = deepFreeze((Array.isArray(setPieces) ? setPieces : DEFAULT_SET_PIECES).map(normalizeSetPiece));
    this.cameraAnchors = deepFreeze(Object.fromEntries(COMBAT_STAGE_CAMERA_ANCHORS.map((name) => [
      name, normalizeAnchor(cameraAnchors?.[name], DEFAULT_CAMERA_ANCHORS[name])
    ])));
    this.actors = new Map();
    this.selectedActorId = "";
    this.setActors(actors);
  }
  setActors(actors = []) {
    if (!Array.isArray(actors)) throw new TypeError("CombatStage actors must be an array");
    const next = new Map();
    for (const actor of actors) {
      const normalized = actor?.actorId ? actor : createCombatActor(actor);
      if (next.has(normalized.actorId)) throw new Error("Duplicate combat stage actor: " + normalized.actorId);
      next.set(normalized.actorId, normalized);
    }
    this.actors = next;
    if (!this.selectedActorId || !this.actors.has(this.selectedActorId)) this.selectedActorId = this.getActors({ team: "PLAYER" })[0]?.actorId || "";
    return this.getState();
  }
  setSelectedActor(actorId) {
    const id = String(actorId || "");
    if (!this.actors.has(id)) return false;
    this.selectedActorId = id;
    return true;
  }
  getActor(actorId) { return this.actors.get(String(actorId || "")) || null; }
  getActors({ team = null } = {}) {
    const all = [...this.actors.values()];
    if (!team) return all;
    const wanted = String(team).toUpperCase();
    return all.filter((actor) => actor.team === wanted);
  }
  getSortedActors() { return [...this.actors.values()].sort((a, b) => a.depthValue - b.depthValue); }
  getCameraAnchor(name, { actorId = null } = {}) {
    const anchorName = String(name || "").toUpperCase();
    const actor = actorId ? this.getActor(actorId) : null;
    const alias = ACTOR_CAMERA_ALIAS[anchorName];
    if (actor && alias) {
      const actorAnchor = actor.cameraAnchors?.[alias];
      if (actorAnchor) return deepFreeze({ ...actorAnchor, source: "ACTOR", actorId: actor.actorId, anchorName });
    }
    if (anchorName === "FORMATION") {
      const actors = this.getActors();
      if (actors.length > 0) {
        const x = actors.reduce((sum, item) => sum + item.position.x, 0) / actors.length;
        const y = actors.reduce((sum, item) => sum + (item.position.y - item.elevation * 0.04), 0) / actors.length;
        return deepFreeze({ ...this.cameraAnchors.FORMATION, x: clamp(x, 0.25, 0.75), y: clamp(y, 0.35, 0.68), source: "STAGE_DERIVED", actorId: null, anchorName });
      }
    }
    const stageAnchor = this.cameraAnchors[anchorName];
    if (stageAnchor) return deepFreeze({ ...stageAnchor, source: "STAGE", actorId: actor?.actorId || null, anchorName });
    return deepFreeze({ ...DEFAULT_CAMERA_ANCHORS.RETURN, source: "FALLBACK", actorId: actor?.actorId || null, anchorName: "RETURN" });
  }
  getActorAnchor(actorId, anchorName) {
    const actor = this.getActor(actorId);
    if (!actor) return null;
    const name = String(anchorName || "").toUpperCase();
    const source = actor.actionAnchors?.[name] || actor.vfxAnchors?.[name];
    return source ? deepFreeze(clone(source)) : null;
  }
  resolveCinematicActorFrame(actorId, { phase = "FORMATION", progress = 0, width = this.designWidth, height = this.designHeight } = {}) {
    const actor = this.getActor(actorId);
    const base = this.resolveActorTransform(actorId, { width, height });
    if (!actor || !base) return null;

    const normalizedPhase = String(phase || "FORMATION").toUpperCase();
    const t = clamp(finite(progress, 0), 0, 1);
    const forward = actor.facing < 0 ? -1 : 1;
    let offsetX = 0;
    let offsetY = 0;
    let rotationDeg = base.rotation;
    let scale = base.scale;
    let emphasis = 0;
    let opacity = 1;
    const selectedActorId = this.selectedActorId;
    const isHero = actor.actorId === selectedActorId;
    const hero = this.getActor(selectedActorId);
    const heroX = hero?.position?.x ?? actor.position.x;

    if (normalizedPhase === "ULTIMATE_STAGING") {
      if (isHero) {
        offsetY = -0.022;
        scale *= 1.05;
        emphasis = 0.45;
      } else if (actor.team === "PLAYER") {
        const direction = actor.position.x < heroX ? -1 : 1;
        offsetX = direction * 0.026;
        offsetY = 0.018;
        scale *= 0.88;
        opacity = 0.72;
      } else if (actor.team === "ENEMY") {
        offsetX = 0.02;
        offsetY = -0.008;
        scale *= 0.94;
        opacity = 0.84;
      }
    } else if (normalizedPhase === "ULTIMATE_CHARACTER_FOCUS") {
      if (isHero) {
        offsetX = forward * 0.012;
        offsetY = -0.026;
        rotationDeg += -forward * 2.5;
        scale *= 1.12;
        emphasis = 0.85;
      } else if (actor.team === "PLAYER") {
        const direction = actor.position.x < heroX ? -1 : 1;
        offsetX = direction * 0.045;
        offsetY = 0.024;
        scale *= 0.80;
        opacity = 0.56;
      } else if (actor.team === "ENEMY") {
        offsetX = 0.028;
        offsetY = -0.01;
        scale *= 0.90;
        opacity = 0.70;
      }
    } else if (normalizedPhase === "ULTIMATE_ACTION_PREP") {
      if (isHero) {
        offsetX = forward * 0.018;
        offsetY = -0.035;
        rotationDeg += -forward * 3.2;
        scale *= 1.16;
        emphasis = 1;
      } else if (actor.team === "PLAYER") {
        const direction = actor.position.x < heroX ? -1 : 1;
        offsetX = direction * 0.035;
        offsetY = 0.028;
        scale *= 0.78;
        opacity = 0.5;
      } else if (actor.team === "ENEMY") {
        offsetX = 0.035;
        offsetY = -0.012;
        scale *= 0.88;
        opacity = 0.66;
      }
    } else if (normalizedPhase === "ULTIMATE_RETURN") {
      const settle = 1 - t;
      if (isHero) {
        offsetY = -0.035 * settle;
        scale *= 1 + 0.16 * settle;
        rotationDeg += -forward * 3.2 * settle;
        emphasis = settle;
      } else if (actor.team === "PLAYER") {
        const direction = actor.position.x < heroX ? -1 : 1;
        offsetX = direction * 0.035 * settle;
        offsetY = 0.028 * settle;
        scale *= 1 - 0.22 * settle;
        opacity = 1 - 0.5 * settle;
      } else if (actor.team === "ENEMY") {
        offsetX = 0.035 * settle;
        offsetY = -0.012 * settle;
        scale *= 1 - 0.12 * settle;
        opacity = 1 - 0.34 * settle;
      }
    } else if (normalizedPhase === "ATTACKER_FOCUS") {
      const prep = Math.sin(t * Math.PI);
      offsetX = -forward * 0.012 * prep;
      offsetY = -0.008 * prep;
      rotationDeg += -forward * 2.2 * prep;
      emphasis = 0.35 * prep;
    } else if (normalizedPhase === "ACTION") {
      const swing = Math.sin(t * Math.PI);
      offsetX = forward * (0.02 + 0.042 * swing);
      offsetY = -0.012 * swing;
      rotationDeg += forward * 4.5 * swing;
      scale *= 1 + 0.045 * swing;
      emphasis = swing;
    } else if (normalizedPhase === "IMPACT") {
      const hit = Math.sin(t * Math.PI);
      offsetX = forward * 0.015 * hit;
      offsetY = -0.008 * hit;
      rotationDeg += forward * 1.6 * hit;
      emphasis = 0.7 + hit * 0.3;
    } else if (normalizedPhase === "TARGET_REACTION") {
      const recoil = 1 - t;
      offsetX = -forward * 0.052 * recoil;
      offsetY = -0.014 * Math.sin(t * Math.PI);
      rotationDeg += -forward * 7 * Math.sin(t * Math.PI);
      scale *= 1 - 0.035 * Math.sin(t * Math.PI);
      emphasis = recoil;
    }

    return deepFreeze({
      actorId: actor.actorId,
      phase: normalizedPhase,
      progress: t,
      x: clamp(actor.position.x + offsetX, 0, 1) * width,
      y: clamp(actor.position.y - actor.elevation * 0.065 + offsetY, 0, 1) * height,
      baseX: base.x,
      baseY: base.y,
      offsetX: offsetX * width,
      offsetY: offsetY * height,
      rotationDeg,
      scale,
      depth: actor.depth,
      elevation: actor.elevation,
      facing: actor.facing,
      emphasis,
      opacity: clamp(opacity, 0, 1),
      presentationOnly: true
    });
  }
  resolveCinematicProjectile(attackerId, targetId, { phase = "ACTION", progress = 0, width = this.designWidth, height = this.designHeight } = {}) {
    const attacker = this.getActor(attackerId);
    const target = this.getActor(targetId);
    if (!attacker || !target) return null;

    const t = clamp(finite(progress, 0), 0, 1);
    const normalizedPhase = String(phase || "ACTION").toUpperCase();
    const bat = this.getActorAnchor(attacker.actorId, "BAT");
    const projectile = this.getActorAnchor(attacker.actorId, "PROJECTILE");
    const impact = this.getActorAnchor(target.actorId, "IMPACT");
    if (!bat || !projectile || !impact) return null;

    const frame = this.resolveCinematicActorFrame(attacker.actorId, { phase: normalizedPhase, progress: t, width, height });
    const frameDx = frame ? frame.offsetX / width : 0;
    const frameDy = frame ? frame.offsetY / height : 0;
    const swingAttach = normalizedPhase === "ACTION" ? clamp((t - 0.08) / 0.42, 0, 1) : 1;
    const source = {
      x: bat.x + (projectile.x - bat.x) * swingAttach + frameDx,
      y: bat.y + (projectile.y - bat.y) * swingAttach + frameDy
    };
    const travel = normalizedPhase === "ACTION"
      ? clamp((t - 0.18) / 0.7, 0, 1)
      : normalizedPhase === "IMPACT"
        ? 1
        : 0;
    const eased = travel * travel * (3 - 2 * travel);
    const x = source.x + (impact.x - source.x) * eased;
    const y = source.y + (impact.y - source.y) * eased - Math.sin(eased * Math.PI) * 0.055;

    return deepFreeze({
      phase: normalizedPhase,
      progress: t,
      travelProgress: eased,
      sourceAnchor: travel < 0.98 ? "BAT_TO_PROJECTILE" : "PROJECTILE",
      targetAnchor: "IMPACT",
      start: deepFreeze({ x: source.x, y: source.y }),
      end: deepFreeze({ x: impact.x, y: impact.y }),
      position: deepFreeze({ x, y }),
      presentationOnly: true
    });
  }
  getSetPiece(id) { return this.setPieces.find((piece) => piece.id === String(id || "").toUpperCase()) || null; }
  resolveActorTransform(actorId, { width = this.designWidth, height = this.designHeight } = {}) {
    const actor = this.getActor(actorId);
    if (!actor) return null;
    const safeWidth = Math.max(1, Number(width) || this.designWidth);
    const safeHeight = Math.max(1, Number(height) || this.designHeight);
    return deepFreeze({
      actorId: actor.actorId, team: actor.team, kind: actor.kind,
      x: clamp(actor.position.x, 0, 1) * safeWidth,
      y: clamp(actor.position.y - actor.elevation * 0.065, 0, 1) * safeHeight,
      baseY: clamp(actor.position.y, 0, 1) * safeHeight,
      depth: actor.depth, depthValue: actor.depthValue, scale: actor.scale, elevation: actor.elevation, facing: actor.facing, rotation: actor.rotation
    });
  }
  getLayer(id) { return this.layers.find((layer) => layer.id === String(id || "").toUpperCase()) || null; }
  getState() {
    return deepFreeze({
      contract: "COMBAT_STAGE_2_5D",
      designSize: { width: this.designWidth, height: this.designHeight },
      zones: clone(this.zones),
      layers: this.layers.map((layer) => ({ id: layer.id, parallax: layer.parallax, assetSlot: layer.assetSlot, zIndex: layer.zIndex })),
      setPieces: clone(this.setPieces),
      cameraAnchors: COMBAT_STAGE_CAMERA_ANCHORS.slice(),
      actorAnchors: COMBAT_STAGE_ACTOR_ANCHORS.slice(),
      actionContract: COMBAT_STAGE_ACTION_CONTRACT.id,
      actionPhases: COMBAT_STAGE_ACTION_CONTRACT.phases.slice(),
      ultimateContract: COMBAT_STAGE_ULTIMATE_CONTRACT.id,
      ultimatePhases: COMBAT_STAGE_ULTIMATE_CONTRACT.phases.slice(),
      depthModel: ["FAR", "MID", "NEAR"],
      actorCount: this.actors.size,
      playerCount: this.getActors({ team: "PLAYER" }).length,
      enemyCount: this.getActors({ team: "ENEMY" }).length,
      actorDepths: this.getSortedActors().map((actor) => actor.depth),
      actorElevations: this.getSortedActors().map((actor) => actor.elevation),
      selectedActorId: this.selectedActorId,
      filmable: true,
      presentationOnly: true
    });
  }
}
function drawLayerTransform(ctx, cameraTransform, layer) {
  if (!ctx || !layer) return;
  const cameraX = finite(cameraTransform?.x, 0), cameraY = finite(cameraTransform?.y, 0);
  const factor = clamp(finite(layer.parallax, 0), 0, 1);
  ctx.save();
  ctx.translate(-cameraX * (1 - factor), -cameraY * (1 - factor));
}
function drawStageBackground(ctx, w, h) {
  const horizon = h * 0.3;
  ctx.fillStyle = "rgba(2, 5, 18, 0.98)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0, 243, 255, 0.08)";
  ctx.fillRect(0, horizon, w, 2);
  for (let i = 0; i < 13; i += 1) {
    const x = i * (w / 12) - w * 0.04;
    const height = h * (0.08 + (i % 4) * 0.035);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 0, 127, 0.10)" : "rgba(0, 243, 255, 0.09)";
    ctx.fillRect(x, horizon - height, Math.max(22, w * 0.055), height);
  }
}
function drawStageMidground(ctx, w, h) {
  const horizon = h * 0.34;
  ctx.fillStyle = "rgba(9, 13, 29, 0.9)";
  ctx.fillRect(0, horizon - h * 0.05, w, h * 0.18);
  ctx.strokeStyle = "rgba(0, 243, 255, 0.16)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i += 1) {
    const x = w * (0.06 + i * 0.12);
    ctx.beginPath(); ctx.moveTo(x, horizon - h * 0.04); ctx.lineTo(x + w * 0.03, horizon + h * 0.08); ctx.stroke();
  }
}
function drawSetPiece(ctx, piece, w, h) {
  const x = piece.x * w, y = piece.y * h, pw = piece.width * w, ph = piece.height * h;
  const lift = piece.elevation * h * 0.11;
  const depthScale = DEPTH_SCALE[piece.depth] || 1;
  ctx.save();
  ctx.translate(0, -lift * 0.35);
  ctx.fillStyle = "rgba(5, 8, 18, 0.96)";
  ctx.strokeStyle = "rgba(0, 243, 255, 0.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (piece.type === "RAMP") {
    ctx.moveTo(x, y + ph); ctx.lineTo(x + pw, y + ph * 0.72); ctx.lineTo(x + pw, y); ctx.lineTo(x, y + ph * 0.34);
  } else {
    ctx.moveTo(x, y + ph); ctx.lineTo(x + pw, y + ph); ctx.lineTo(x + pw, y); ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = piece.depth === "NEAR" ? "rgba(255, 0, 127, 0.10)" : "rgba(0, 243, 255, 0.09)";
  ctx.fillRect(x, y, pw, Math.max(5, ph * 0.12));
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath(); ctx.moveTo(x, y + ph * 0.2); ctx.lineTo(x + pw, y + ph * (piece.type === "RAMP" ? 0.08 : 0.2)); ctx.stroke();
  ctx.globalAlpha = 0.34 + depthScale * 0.08;
  ctx.font = "800 7px Rajdhani, system-ui, sans-serif";
  ctx.fillStyle = "#d7e9ff"; ctx.fillText(piece.id.replace("_", " "), x + 8, y + 12);
  ctx.restore();
}
export function renderCombatStageWorld(ctx, stage, width, height, { cameraTransform = null, groundColor = "#10162a", showZones = true } = {}) {
  if (!ctx || !(stage instanceof CombatStage)) return false;
  const w = Math.max(1, Number(width) || stage.designWidth), h = Math.max(1, Number(height) || stage.designHeight);
  const camera = cameraTransform || { x: 0, y: 0 };
  const background = stage.getLayer("BACKGROUND");
  if (background) { drawLayerTransform(ctx, camera, background); drawStageBackground(ctx, w, h); ctx.restore(); }
  const midground = stage.getLayer("MIDGROUND");
  if (midground) { drawLayerTransform(ctx, camera, midground); drawStageMidground(ctx, w, h); ctx.restore(); }
  const ground = stage.getLayer("GROUND");
  if (ground) {
    drawLayerTransform(ctx, camera, ground);
    const horizon = h * 0.34;
    ctx.fillStyle = groundColor; ctx.beginPath();
    ctx.moveTo(0, horizon); ctx.lineTo(w, horizon); ctx.lineTo(w * 0.97, h); ctx.lineTo(w * 0.03, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(0, 243, 255, 0.13)"; ctx.lineWidth = 1;
    for (let yIndex = 0; yIndex < 8; yIndex += 1) {
      const progress = yIndex / 7, y = horizon + Math.pow(progress, 1.7) * (h - horizon);
      ctx.beginPath(); ctx.moveTo(w * 0.04, y); ctx.lineTo(w * 0.96, y); ctx.stroke();
    }
    for (let xIndex = -5; xIndex <= 5; xIndex += 1) {
      const bottomX = w * (0.5 + xIndex * 0.14);
      ctx.beginPath(); ctx.moveTo(w * 0.5, horizon); ctx.lineTo(bottomX, h); ctx.stroke();
    }
    for (const piece of stage.setPieces) drawSetPiece(ctx, piece, w, h);
    if (showZones) {
      for (const [id, zone] of Object.entries(stage.zones)) {
        ctx.save();
        const playerZone = id === "PLAYER_ZONE";
        ctx.strokeStyle = playerZone ? "rgba(0, 243, 255, 0.2)" : "rgba(255, 0, 127, 0.22)";
        ctx.fillStyle = playerZone ? "rgba(0, 243, 255, 0.018)" : "rgba(255, 0, 127, 0.018)";
        ctx.setLineDash([8, 10]); ctx.lineWidth = 1.5;
        ctx.fillRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
        ctx.strokeRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
        ctx.setLineDash([]);
        ctx.font = "800 8px Rajdhani, system-ui, sans-serif";
        ctx.fillStyle = playerZone ? "#8fefff" : "#ff8ab8";
        ctx.fillText(id.replace("_", " "), zone.x * w + 8, zone.y * h + 13);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  return true;
}
export function renderCombatStageForeground(ctx, stage, width, height, cameraTransform = null) {
  if (!ctx || !(stage instanceof CombatStage)) return false;
  const layer = stage.getLayer("FOREGROUND"); if (!layer) return false;
  drawLayerTransform(ctx, cameraTransform || { x: 0, y: 0 }, layer);
  const w = Math.max(1, Number(width) || stage.designWidth), h = Math.max(1, Number(height) || stage.designHeight);
  ctx.fillStyle = "rgba(2, 5, 12, 0.42)";
  ctx.fillRect(0, 0, w, h * 0.055); ctx.fillRect(0, h * 0.94, w, h * 0.06);
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath(); ctx.moveTo(0, h * 0.96); ctx.lineTo(w * 0.26, h * 0.89); ctx.lineTo(w * 0.74, h * 0.89); ctx.lineTo(w, h * 0.96); ctx.stroke();
  for (const x of [0.05, 0.95]) { ctx.fillStyle = "rgba(0,243,255,0.12)"; ctx.fillRect(w * x, h * 0.68, Math.max(3, w * 0.006), h * 0.27); }
  ctx.restore(); return true;
}
export const DEFAULT_COMBAT_STAGE = Object.freeze(new CombatStage({ actors: createCombatStageActors() }));
