const DEPTH_SCALE = Object.freeze({ FAR: 0.82, MID: 1, NEAR: 1.16 });
const DEPTH_ORDER = Object.freeze({ FAR: 10, MID: 20, NEAR: 30 });
export const COMBAT_STAGE_DEPTH = Object.freeze({ FAR: "FAR", MID: "MID", NEAR: "NEAR" });
export const COMBAT_STAGE_LAYERS = Object.freeze(["BACKGROUND", "MIDGROUND", "GROUND", "FOREGROUND"]);
export const COMBAT_STAGE_CAMERA_ANCHORS = Object.freeze(["FORMATION", "PLAYER_FOCUS", "ENEMY_FOCUS", "ACTION", "IMPACT", "REACTION", "RETURN"]);
export const COMBAT_STAGE_ACTOR_ANCHORS = Object.freeze(["BODY", "HEAD", "BAT", "HAND", "PROJECTILE", "IMPACT", "REACTION"]);

const ACTOR_CAMERA_ALIAS = Object.freeze({ PLAYER_FOCUS: "FOCUS", ENEMY_FOCUS: "FOCUS", ACTION: "ACTION", IMPACT: "IMPACT", REACTION: "REACTION" });
const DEFAULT_ZONES = Object.freeze({
  PLAYER_ZONE: Object.freeze({ x: 0.08, y: 0.36, width: 0.56, height: 0.46 }),
  ENEMY_ZONE: Object.freeze({ x: 0.64, y: 0.25, width: 0.29, height: 0.52 })
});
const DEFAULT_LAYERS = Object.freeze([
  Object.freeze({ id: "BACKGROUND", parallax: 0.08, assetSlot: "stage.background.far", zIndex: 0 }),
  Object.freeze({ id: "MIDGROUND", parallax: 0.22, assetSlot: "stage.background.mid", zIndex: 10 }),
  Object.freeze({ id: "GROUND", parallax: 0.55, assetSlot: "stage.ground", zIndex: 20 }),
  Object.freeze({ id: "FOREGROUND", parallax: 1, assetSlot: "stage.foreground", zIndex: 40 })
]);
const DEFAULT_CAMERA_ANCHORS = Object.freeze({
  FORMATION: Object.freeze({ x: 0.5, y: 0.52, zoom: 0.9, rotationDeg: 0, shot: "GENERAL", angle: "HIGH" }),
  PLAYER_FOCUS: Object.freeze({ x: 0.27, y: 0.56, zoom: 1.14, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  ENEMY_FOCUS: Object.freeze({ x: 0.77, y: 0.47, zoom: 1.14, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  ACTION: Object.freeze({ x: 0.32, y: 0.54, zoom: 1.2, rotationDeg: 0, shot: "CLOSE_UP", angle: "LOW" }),
  IMPACT: Object.freeze({ x: 0.72, y: 0.46, zoom: 1.26, rotationDeg: 0, shot: "CLOSE_UP", angle: "LOW" }),
  REACTION: Object.freeze({ x: 0.76, y: 0.47, zoom: 1.1, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" }),
  RETURN: Object.freeze({ x: 0.5, y: 0.53, zoom: 0.96, rotationDeg: 0, shot: "GENERAL", angle: "HIGH" })
});
const DEFAULT_PLAYER_POSITIONS = Object.freeze([
  Object.freeze({ x: 0.22, y: 0.49, depth: "MID", scale: 0.92 }),
  Object.freeze({ x: 0.28, y: 0.67, depth: "NEAR", scale: 1 }),
  Object.freeze({ x: 0.46, y: 0.72, depth: "NEAR", scale: 1.02 }),
  Object.freeze({ x: 0.55, y: 0.52, depth: "MID", scale: 0.94 })
]);
const DEFAULT_ENEMY_POSITION = Object.freeze({ x: 0.78, y: 0.45, depth: "MID", scale: 1.04 });

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
function buildActorAnchors(position, depth, scale) {
  const depthOffset = depth === "NEAR" ? 0.035 : depth === "FAR" ? -0.025 : 0;
  const focusZoom = clamp(1.08 + scale * 0.1, 1.08, 1.28);
  return {
    BODY: { x: position.x, y: position.y },
    HEAD: { x: position.x, y: clamp(position.y - 0.07, 0, 1) },
    BAT: { x: clamp(position.x - 0.035, 0, 1), y: clamp(position.y - 0.045, 0, 1) },
    HAND: { x: clamp(position.x - 0.01, 0, 1), y: clamp(position.y - 0.02, 0, 1) },
    PROJECTILE: { x: clamp(position.x + 0.08, 0, 1), y: clamp(position.y - 0.015, 0, 1) },
    IMPACT: { x: clamp(position.x + depthOffset, 0, 1), y: clamp(position.y - 0.02, 0, 1) },
    REACTION: { x: clamp(position.x + depthOffset * 0.5, 0, 1), y: clamp(position.y - 0.01, 0, 1) },
    FOCUS: { x: position.x, y: clamp(position.y - 0.04, 0, 1), zoom: focusZoom, rotationDeg: 0, shot: "MEDIUM", angle: "EYE_LEVEL" },
    ACTION: { x: clamp(position.x - 0.03, 0, 1), y: clamp(position.y - 0.04, 0, 1), zoom: clamp(focusZoom + 0.05, 1.12, 1.34), rotationDeg: 0, shot: "CLOSE_UP", angle: "LOW" }
  };
}
export function createCombatActor({
  actorId, team = "PLAYER", kind = "CHARACTER", position = { x: 0.5, y: 0.5 }, depth = "MID",
  scale = null, rotation = 0, visual = {}, state = "IDLE", cameraAnchors = {}, actionAnchors = {}, vfxAnchors = {}
} = {}) {
  const id = String(actorId || "").trim();
  if (!id) throw new TypeError("Combat actor requires actorId");
  const normalizedDepth = normalizeDepth(depth);
  const normalizedPosition = normalizePoint(position, { x: 0.5, y: 0.5 });
  const normalizedScale = clamp(finite(scale, DEPTH_SCALE[normalizedDepth]), 0.55, 1.5);
  const generated = buildActorAnchors(normalizedPosition, normalizedDepth, normalizedScale);
  return deepFreeze({
    actorId: id, team: String(team || "PLAYER").toUpperCase(), kind: String(kind || "CHARACTER").toUpperCase(),
    position: deepFreeze(normalizedPosition), depth: normalizedDepth, depthValue: DEPTH_ORDER[normalizedDepth],
    scale: normalizedScale, rotation: clamp(finite(rotation, 0), -45, 45),
    visual: deepFreeze({ ...(visual && typeof visual === "object" ? clone(visual) : {}) }),
    state: String(state || "IDLE").toUpperCase(),
    cameraAnchors: deepFreeze({
      FOCUS: normalizeAnchor(cameraAnchors?.FOCUS, generated.FOCUS),
      ACTION: normalizeAnchor(cameraAnchors?.ACTION, generated.ACTION)
    }),
    actionAnchors: deepFreeze({
      BODY: generated.BODY, HEAD: generated.HEAD, BAT: generated.BAT, HAND: generated.HAND,
      PROJECTILE: generated.PROJECTILE, IMPACT: generated.IMPACT, REACTION: generated.REACTION,
      ...(actionAnchors && typeof actionAnchors === "object" ? clone(actionAnchors) : {})
    }),
    vfxAnchors: deepFreeze({
      BODY: generated.BODY, HEAD: generated.HEAD, BAT: generated.BAT, HAND: generated.HAND,
      PROJECTILE: generated.PROJECTILE, IMPACT: generated.IMPACT, REACTION: generated.REACTION,
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
      team: "PLAYER", kind: primary ? "CHARACTER" : "FIXTURE",
      position, depth: position.depth, scale: position.scale,
      visual: primary
        ? { name: batter?.name || batter?.display_name || "Selected Character", source: "RUNTIME_CHARACTER" }
        : { name: "ALLY FIXTURE " + String(index + 1).padStart(2, "0"), source: "T078_BLOCKOUT_FIXTURE" }
    });
  });
  players.push(createCombatActor({
    actorId: enemyId, team: "ENEMY", kind: "ENEMY",
    position: DEFAULT_ENEMY_POSITION, depth: DEFAULT_ENEMY_POSITION.depth, scale: DEFAULT_ENEMY_POSITION.scale,
    visual: { name: enemy?.name || enemy?.display_name || "Enemy", source: enemy?.id ? "RUNTIME_TARGET" : "T078_BLOCKOUT_FIXTURE" }
  }));
  return players;
}
export class CombatStage {
  constructor({ width = 720, height = 1280, zones = DEFAULT_ZONES, layers = DEFAULT_LAYERS, cameraAnchors = DEFAULT_CAMERA_ANCHORS, actors = [] } = {}) {
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
    if (actor && alias && actor.cameraAnchors?.[alias]) return deepFreeze({ ...actor.cameraAnchors[alias], source: "ACTOR", actorId: actor.actorId, anchorName });
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
  resolveActorTransform(actorId, { width = this.designWidth, height = this.designHeight } = {}) {
    const actor = this.getActor(actorId);
    if (!actor) return null;
    return deepFreeze({
      actorId: actor.actorId, team: actor.team, kind: actor.kind,
      x: clamp(actor.position.x, 0, 1) * Math.max(1, Number(width) || this.designWidth),
      y: clamp(actor.position.y, 0, 1) * Math.max(1, Number(height) || this.designHeight),
      depth: actor.depth, depthValue: actor.depthValue, scale: actor.scale, rotation: actor.rotation
    });
  }
  getLayer(id) { return this.layers.find((layer) => layer.id === String(id || "").toUpperCase()) || null; }
  getState() {
    return deepFreeze({
      contract: "COMBAT_STAGE_2_5D", designSize: { width: this.designWidth, height: this.designHeight },
      zones: clone(this.zones),
      layers: this.layers.map((layer) => ({ id: layer.id, parallax: layer.parallax, assetSlot: layer.assetSlot, zIndex: layer.zIndex })),
      cameraAnchors: COMBAT_STAGE_CAMERA_ANCHORS.slice(), actorAnchors: COMBAT_STAGE_ACTOR_ANCHORS.slice(),
      depthModel: ["FAR", "MID", "NEAR"], actorCount: this.actors.size,
      playerCount: this.getActors({ team: "PLAYER" }).length, enemyCount: this.getActors({ team: "ENEMY" }).length,
      actorDepths: this.getSortedActors().map((actor) => actor.depth),
      selectedActorId: this.selectedActorId, presentationOnly: true
    });
  }
}
function drawLayerTransform(ctx, cameraTransform, layer) {
  if (!ctx || !layer) return;
  const cameraX = finite(cameraTransform?.x, 0), cameraY = finite(cameraTransform?.y, 0);
  const factor = clamp(finite(layer.parallax, 0), 0, 1);
  ctx.save(); ctx.translate(-cameraX * (1 - factor), -cameraY * (1 - factor));
}
export function renderCombatStageWorld(ctx, stage, width, height, { cameraTransform = null, groundColor = "#10162a", showZones = true } = {}) {
  if (!ctx || !(stage instanceof CombatStage)) return false;
  const w = Math.max(1, Number(width) || stage.designWidth), h = Math.max(1, Number(height) || stage.designHeight);
  const camera = cameraTransform || { x: 0, y: 0 };
  const midground = stage.getLayer("MIDGROUND");
  if (midground) {
    drawLayerTransform(ctx, camera, midground);
    const horizon = h * 0.31;
    ctx.fillStyle = "rgba(4, 8, 20, 0.94)"; ctx.fillRect(0, horizon - h * 0.12, w, h * 0.18);
    ctx.fillStyle = "rgba(0, 243, 255, 0.12)";
    for (let x = 0; x < w; x += Math.max(52, w / 11)) {
      const towerHeight = h * (0.035 + ((x / Math.max(1, w)) % 0.08));
      ctx.fillRect(x, horizon - towerHeight, Math.max(18, w * 0.018), towerHeight);
    }
    ctx.restore();
  }
  const ground = stage.getLayer("GROUND");
  if (ground) {
    drawLayerTransform(ctx, camera, ground);
    const horizon = h * 0.34;
    ctx.fillStyle = groundColor; ctx.beginPath();
    ctx.moveTo(0, horizon); ctx.lineTo(w, horizon); ctx.lineTo(w * 0.96, h); ctx.lineTo(w * 0.04, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(0, 243, 255, 0.13)"; ctx.lineWidth = 1;
    for (let yIndex = 0; yIndex < 9; yIndex += 1) {
      const progress = yIndex / 8, y = horizon + Math.pow(progress, 1.7) * (h - horizon);
      ctx.beginPath(); ctx.moveTo(w * 0.04, y); ctx.lineTo(w * 0.96, y); ctx.stroke();
    }
    for (let xIndex = -6; xIndex <= 6; xIndex += 1) {
      const bottomX = w * (0.5 + xIndex * 0.12);
      ctx.beginPath(); ctx.moveTo(w * 0.5, horizon); ctx.lineTo(bottomX, h); ctx.stroke();
    }
    if (showZones) {
      for (const [id, zone] of Object.entries(stage.zones)) {
        ctx.save();
        const playerZone = id === "PLAYER_ZONE";
        ctx.strokeStyle = playerZone ? "rgba(0, 243, 255, 0.38)" : "rgba(255, 0, 127, 0.42)";
        ctx.fillStyle = playerZone ? "rgba(0, 243, 255, 0.035)" : "rgba(255, 0, 127, 0.035)";
        ctx.setLineDash([7, 8]); ctx.lineWidth = 2;
        ctx.fillRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
        ctx.strokeRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
        ctx.setLineDash([]); ctx.font = "800 9px Rajdhani, system-ui, sans-serif";
        ctx.fillStyle = playerZone ? "#8fefff" : "#ff8ab8"; ctx.fillText(id.replace("_", " "), zone.x * w + 8, zone.y * h + 15);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  return true;
}
export function renderCombatStageForeground(ctx, stage, width, height, cameraTransform = null) {
  if (!ctx || !(stage instanceof CombatStage)) return false;
  const layer = stage.getLayer("FOREGROUND");
  if (!layer) return false;
  drawLayerTransform(ctx, cameraTransform || { x: 0, y: 0 }, layer);
  const w = Math.max(1, Number(width) || stage.designWidth), h = Math.max(1, Number(height) || stage.designHeight);
  ctx.fillStyle = "rgba(2, 5, 12, 0.52)"; ctx.fillRect(0, 0, w, h * 0.06); ctx.fillRect(0, h * 0.94, w, h * 0.06);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.11)"; ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath(); ctx.moveTo(0, h * 0.95); ctx.lineTo(w * 0.3, h * 0.86); ctx.lineTo(w * 0.7, h * 0.86); ctx.lineTo(w, h * 0.95); ctx.stroke();
  ctx.restore(); return true;
}
export const DEFAULT_COMBAT_STAGE = Object.freeze(new CombatStage({ actors: createCombatStageActors() }));
