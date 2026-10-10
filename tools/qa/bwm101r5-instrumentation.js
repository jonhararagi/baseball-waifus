import { CharacterActor2D5, CombatStage } from "../combat_stage.js";
import { CharacterFormation2D5 } from "../character_formation_2d5.js";
import { CombatPresentationDirector } from "../combat_presentation_director.js";
import { CombatRenderer } from "../combat.js";

const K = "__BWM101R5_DIAGNOSTICS__";
const root = window[K] || (window[K] = {
  version: "BWM-101-R7-C2", startedAt: new Date().toISOString(), sequence: 0,
  events: [], instrumentationErrors: [], status: "ACTIVE", droppedEvents: 0
});
const objectRefs = new WeakMap();
let nextObjectRef = 1;
const seenDivergence = new Set();
const ensureSignatures = new WeakMap();
const refs = { stage: null, director: null, formation: null };

function safe(value) {
  try { return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? String(item) : item)); }
  catch (error) { return { serializationError: String(error) }; }
}
function objectRefId(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) return null;
  let id = objectRefs.get(value);
  if (!id) { id = "object-ref-" + nextObjectRef++; objectRefs.set(value, id); }
  return id;
}
function actorInfo(value) {
  return value ? {
    actorId: value.actorId ?? value.id ?? null,
    objectRefId: objectRefId(value),
    team: value.team ?? value.teamId ?? value.side ?? null,
    state: value.presentationState ?? value.state ?? null,
    visible: value.visible ?? null
  } : null;
}
function record(type, data = {}) {
  const event = Object.assign({
    prefix: "[BWM101R7C2]", seq: ++root.sequence, type,
    at: performance.now(), wallTime: new Date().toISOString()
  }, safe(data));
  root.events.push(event);
  if (root.events.length > 8000) {
    const removed = root.events.length - 8000;
    root.events.splice(0, removed);
    root.droppedEvents = Number(root.droppedEvents || 0) + removed;
  }
  try { console.debug("[BWM101R7C2]" + JSON.stringify(event)); } catch {}
  return event;
}
function mapSnapshot(map) {
  if (!(map instanceof Map)) return null;
  return [...map.entries()].map(([key, value]) => ({ key: String(key), ...actorInfo(value) }));
}
function actorArgsSnapshot(args) {
  const output = [];
  args.forEach((value, argIndex) => {
    const items = Array.isArray(value) ? value : value && typeof value === "object" && (value.actorId || value.id) ? [value] : [];
    if (items.length) output.push({ argIndex, length: items.length, actors: items.map(actorInfo) });
    else if (value === null || ["string", "number", "boolean", "undefined"].includes(typeof value)) output.push({ argIndex, value: value === undefined ? null : value });
    else if (Array.isArray(value)) output.push({ argIndex, length: value.length, actors: [] });
  });
  return output;
}
function getOwnerContext(owner, method, args, phase = "snapshot", result = undefined) {
  if (owner instanceof CombatStage) refs.stage = owner;
  if (owner instanceof CombatPresentationDirector) {
    refs.director = owner;
    if (owner.stage) refs.stage = owner.stage;
  }
  if (owner instanceof CharacterFormation2D5) refs.formation = owner;
  if (owner instanceof CombatPresentationDirector && owner.formation) refs.formation = owner.formation;
  if (method === "_createRuntimeFormation" && phase === "after" && result instanceof CharacterFormation2D5) refs.formation = result;

  const director = owner instanceof CombatPresentationDirector ? owner : refs.director;
  const stage = owner instanceof CombatStage ? owner : director?.stage || refs.stage;
  let formation = owner instanceof CharacterFormation2D5 ? owner : director?.formation || refs.formation;
  if (method === "_createRuntimeFormation" && phase === "after" && result instanceof CharacterFormation2D5) formation = result;
  const stageMap = stage?.actors instanceof Map ? stage.actors : null;
  const formationMap = formation?.actors instanceof Map ? formation.actors : null;
  const stageActors = mapSnapshot(stageMap);
  const formationActors = mapSnapshot(formationMap);
  const stageById = stageMap || new Map();
  const formationById = formationMap || new Map();
  const divergence = [];
  for (const [actorId, stageActor] of stageById.entries()) {
    const formationActor = formationById.get(actorId);
    if (formationActor && formationActor !== stageActor) {
      divergence.push({
        actorId: String(actorId),
        stageObjectRefId: objectRefId(stageActor),
        stageState: stageActor.presentationState ?? stageActor.state ?? null,
        formationObjectRefId: objectRefId(formationActor),
        formationState: formationActor.presentationState ?? formationActor.state ?? null,
        sameReference: false
      });
    }
  }
  const directorState = director ? {
    active: director.active ?? null, phase: director.phase ?? null,
    sequenceId: director.sequenceId ?? null, stepIndex: director.stepIndex ?? null
  } : null;
  return {
    method, phase, ownerRefId: objectRefId(owner), ownerType: owner?.constructor?.name || null,
    arguments: actorArgsSnapshot(args),
    incomingStageRefId: method === "setStage" ? objectRefId(args?.[0]) : null,
    returnedFormationRefId: method === "_createRuntimeFormation" && phase === "after" ? objectRefId(result) : null,
    directorRefId: objectRefId(director), directorState,
    stageRefId: objectRefId(stage), stageActors,
    formationRefId: objectRefId(formation), formationActors,
    identityDivergences: divergence
  };
}
function lifecycleSnapshot(method) {
  return (owner, args, meta = {}) => getOwnerContext(owner, method, args, meta.phase || "snapshot", meta.result);
}
function recordFirstDivergence(method, before, after) {
  for (const row of after?.identityDivergences || []) {
    const key = row.actorId;
    const wasAlreadySameDivergence = (before?.identityDivergences || []).some(item => item.actorId === key
      && item.stageObjectRefId === row.stageObjectRefId && item.formationObjectRefId === row.formationObjectRefId);
    if (wasAlreadySameDivergence || seenDivergence.has(key)) continue;
    seenDivergence.add(key);
    record("T101.actorIdentity.firstDivergence", {
      operation: method, actorId: row.actorId, stageObjectRefId: row.stageObjectRefId,
      formationObjectRefId: row.formationObjectRefId, stageState: row.stageState, formationState: row.formationState,
      before, after,
      causalInterpretation: "first divergence observed by enabled trace; not proof of origin if already divergent before this wrapper"
    });
  }
}
function wrap(proto, method, type, snapshot) {
  if (!proto || typeof proto[method] !== "function") {
    root.instrumentationErrors.push({ method, type, error: "method missing" });
    return;
  }
  const original = proto[method];
  if (original.__bwm101r7c2Wrapped) return;
  function wrapped(...args) {
    const before = snapshot ? snapshot(this, args, { phase: "before" }) : {};
    const call = record(type + ":before", { method, args: actorArgsSnapshot(args), before });
    try {
      const result = Reflect.apply(original, this, args);
      if (this instanceof CombatStage) refs.stage = this;
      if (this instanceof CombatPresentationDirector) {
        refs.director = this;
        if (this.stage) refs.stage = this.stage;
        if (method === "_createRuntimeFormation" && result instanceof CharacterFormation2D5) refs.formation = result;
        else if (this.formation) refs.formation = this.formation;
      }
      if (this instanceof CharacterFormation2D5) refs.formation = this;
      const after = snapshot ? snapshot(this, args, { phase: "after", result }) : {};
      const compactResult = result instanceof CharacterFormation2D5
        ? { type: "CharacterFormation2D5", objectRefId: objectRefId(result), actors: mapSnapshot(result.actors) }
        : safe(result);
      record(type + ":after", {
        method, callSeq: call.seq, result: compactResult,
        resultObjectRefId: result && typeof result === "object" ? objectRefId(result) : null,
        after
      });
      recordFirstDivergence(type, before, after);
      return result;
    } catch (error) {
      const after = snapshot ? snapshot(this, args, { phase: "exception" }) : {};
      record(type + ":exception", {
        method, callSeq: call.seq, before,
        error: { name: error?.name || "Error", message: String(error?.message || error), stack: String(error?.stack || "") },
        after
      });
      recordFirstDivergence(type, before, after);
      throw error;
    }
  }
  Object.defineProperty(wrapped, "__bwm101r7c2Wrapped", { value: true });
  Object.defineProperty(wrapped, "name", { value: original.name, configurable: true });
  proto[method] = wrapped;
}
function wrapEnsure(proto) {
  const method = "_ensureRuntimeFormation", type = "T101.lifecycle.CombatPresentationDirector._ensureRuntimeFormation";
  const original = proto?.[method];
  if (typeof original !== "function") {
    root.instrumentationErrors.push({ method, type, error: "method missing" });
    return;
  }
  if (original.__bwm101r7c2Wrapped) return;
  const signature = snapshot => JSON.stringify({
    stageRefId: snapshot?.stageRefId,
    stageActors: (snapshot?.stageActors || []).map(item => [item.actorId || item.key, item.objectRefId]),
    formationRefId: snapshot?.formationRefId,
    formationActors: (snapshot?.formationActors || []).map(item => [item.actorId || item.key, item.objectRefId]),
    divergence: snapshot?.identityDivergences
  });
  function wrapped(...args) {
    const before = getOwnerContext(this, method, args);
    const beforeSignature = signature(before);
    const beforeFormation = this.formation;
    const startedAt = performance.now();
    try {
      const result = Reflect.apply(original, this, args);
      refs.director = this;
      if (this.stage) refs.stage = this.stage;
      if (this.formation) refs.formation = this.formation;
      const after = getOwnerContext(this, method, args);
      const afterSignature = signature(after);
      const priorObserved = ensureSignatures.get(this);
      const changed = result !== beforeFormation || this.formation !== beforeFormation || beforeSignature !== afterSignature;
      const decisionChanged = priorObserved !== beforeSignature || priorObserved !== afterSignature;
      // One compound before/after event on change/new relationship, not every frame.
      if (changed || decisionChanged) {
        record(type + ":decision", {
          method, elapsedCallMs: performance.now() - startedAt,
          resultObjectRefId: result && typeof result === "object" ? objectRefId(result) : null,
          formationWasAbsent: !beforeFormation,
          referenceChanged: before?.formationRefId !== after?.formationRefId,
          before, after
        });
        recordFirstDivergence(type, before, after);
      }
      ensureSignatures.set(this, afterSignature);
      return result;
    } catch (error) {
      const after = getOwnerContext(this, method, args);
      record(type + ":exception", {
        method, before, after,
        error: { name: error?.name || "Error", message: String(error?.message || error), stack: String(error?.stack || "") }
      });
      throw error;
    }
  }
  Object.defineProperty(wrapped, "__bwm101r7c2Wrapped", { value: true });
  Object.defineProperty(wrapped, "name", { value: original.name, configurable: true });
  proto[method] = wrapped;
}
function readOnlyRuntimeState(renderer) {
  const authority = renderer?.combatRuntime?.state || null;
  return {
    battlePhase: authority?.phase ?? null, tacticalTurn: authority?.tacticalTurn ?? null,
    combatResult: authority?.combatResult ?? null, lastTiming: safe(renderer?.lastTiming ?? null),
    presentation: renderer?.combatPresentation ? {
      active: renderer.combatPresentation.active ?? null, phase: renderer.combatPresentation.phase ?? null,
      sequenceId: renderer.combatPresentation.sequenceId ?? null, stepIndex: renderer.combatPresentation.stepIndex ?? null
    } : null
  };
}

wrap(CharacterActor2D5?.prototype, "transitionTo", "T101.actor.transitionTo", (actor, args) => ({
  actor: actorInfo(actor), requestedState: args[0] ?? null,
  eventId: window.__BWM_CURRENT_PRESENTATION_EVENT_ID__ ?? null,
  turn: window.__BWM_CURRENT_TACTICAL_TURN__ ?? null,
  identity: getOwnerContext(actor, "transitionTo", args),
  stackAtCall: new Error("BWM101R7C2 transition origin").stack
}));
wrap(CombatStage?.prototype, "setActors", "T101.lifecycle.CombatStage.setActors", lifecycleSnapshot("setActors"));
wrap(CombatPresentationDirector?.prototype, "setStage", "T101.lifecycle.CombatPresentationDirector.setStage", lifecycleSnapshot("setStage"));
wrap(CombatPresentationDirector?.prototype, "_createRuntimeFormation", "T101.lifecycle.CombatPresentationDirector._createRuntimeFormation", lifecycleSnapshot("_createRuntimeFormation"));
wrapEnsure(CombatPresentationDirector?.prototype);
wrap(CharacterFormation2D5?.prototype, "populate", "T101.lifecycle.CharacterFormation2D5.populate", lifecycleSnapshot("populate"));
wrap(CharacterFormation2D5?.prototype, "attach", "T101.lifecycle.CharacterFormation2D5.attach", lifecycleSnapshot("attach"));
wrap(CharacterFormation2D5?.prototype, "clear", "T101.lifecycle.CharacterFormation2D5.clear", lifecycleSnapshot("clear"));

for (const method of ["startFromPresentationEvent", "_finishFormationActorsForReplacement", "_emitStep"]) {
  wrap(CombatPresentationDirector?.prototype, method, "T101.director." + method, (director, args) => {
    const event = args[0]?.payload ? args[0] : null;
    const id = event?.payload?.attacker_id ?? event?.attacker_id ?? director?.result?.attackerId ?? null;
    const stage = director?.stage || refs.stage;
    const formation = director?.formation || refs.formation;
    const stageActor = id != null && stage?.actors instanceof Map ? stage.actors.get(String(id)) : null;
    const formationActor = id != null && formation?.actors instanceof Map ? formation.actors.get(String(id)) : null;
    return {
      ...getOwnerContext(director, method, args),
      eventId: event?.eventId ?? director?.sequenceId ?? null, eventType: event?.type ?? null,
      attackerId: id, targetId: event?.payload?.target_id ?? event?.target_id ?? null,
      stageActor: actorInfo(stageActor), formationActor: actorInfo(formationActor),
      sameActorIdentity: stageActor && formationActor ? stageActor === formationActor : null,
      stackAtCall: new Error("BWM101R7C2 director origin").stack
    };
  });
}
wrap(CombatRenderer?.prototype, "_handleCombatPresentationStep", "T101.renderer.presentationStep", (renderer, args) => {
  const id = args[0]?.result?.attackerId ?? args[0]?.result?.attacker_id ?? renderer?.combatStage?.selectedActorId ?? null;
  const actor = id != null && renderer?.combatStage?.actors instanceof Map ? renderer.combatStage.actors.get(String(id)) : null;
  return {
    event: safe(args[0]), turn: renderer?.combatRuntime?.state?.tacticalTurn ?? null,
    actorId: id, actor: actorInfo(actor), identity: getOwnerContext(renderer, "_handleCombatPresentationStep", args),
    presentation: renderer?.combatPresentation ? {
      active: renderer.combatPresentation.active ?? null, phase: renderer.combatPresentation.phase ?? null,
      sequenceId: renderer.combatPresentation.sequenceId ?? null, stepIndex: renderer.combatPresentation.stepIndex ?? null
    } : null
  };
});
wrap(CombatRenderer?.prototype, "resolveTimingInput", "T118.resolveTimingInput", (renderer, args) => {
  const timing = renderer?.timingState || null;
  const now = performance.now();
  const storage = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/player.?meta|reward|scrap|ledger/i.test(key || "")) storage[key] = localStorage.getItem(key);
    }
  } catch {}
  return {
    source: args[0] ?? "pointer", timingState: safe(timing), active: timing?.active ?? null,
    startedAt: timing?.startedAt ?? null, elapsedMs: timing?.startedAt == null ? null : now - timing.startedAt,
    targetMs: timing?.targetMs ?? null, durationMs: timing?.durationMs ?? null,
    hitWindowMs: timing?.hitWindowMs ?? null, greatWindowMs: timing?.greatWindowMs ?? null,
    phase: renderer?.combatRuntime?.state?.phase ?? null,
    tacticalTurn: renderer?.combatRuntime?.state?.tacticalTurn ?? null,
    before: readOnlyRuntimeState(renderer), persistedRewardState: storage,
    stackAtCall: new Error("BWM101R7C2 resolver origin").stack
  };
});
function input(event) {
  if (!/pointer|mouse|touch|click/i.test(event.type)) return;
  record("T118.dom-input", {
    eventType: event.type, target: event.target?.id ?? event.target?.tagName ?? null,
    x: event.clientX ?? null, y: event.clientY ?? null, isTrusted: event.isTrusted
  });
}
for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "touchstart", "touchend"]) window.addEventListener(type, input, true);

if (!Object.getOwnPropertyDescriptor(CombatRenderer.prototype, "handleTimingPointer")) {
  Object.defineProperty(CombatRenderer.prototype, "handleTimingPointer", {
    configurable: true,
    set(fn) {
      const wrappedHandler = function(event) {
        record("T118.handleTimingPointer:before", {
          eventType: event?.type ?? null, isTrusted: event?.isTrusted ?? null,
          target: event?.target?.id ?? event?.target?.tagName ?? null,
          timingState: safe(this.timingState ?? null), state: readOnlyRuntimeState(this)
        });
        try {
          const result = Reflect.apply(fn, this, [event]);
          record("T118.handleTimingPointer:after", { eventType: event?.type ?? null, state: readOnlyRuntimeState(this) });
          return result;
        } catch (error) {
          record("T118.handleTimingPointer:exception", {
            eventType: event?.type ?? null,
            error: { name: error?.name || "Error", message: String(error?.message || error), stack: String(error?.stack || "") }
          });
          throw error;
        }
      };
      Object.defineProperty(this, "handleTimingPointer", { value: wrappedHandler, writable: true, configurable: true });
    },
    get() { return undefined; }
  });
}
record("harness.ready", {
  wrapped: [
    "CharacterActor2D5.transitionTo", "CombatStage.setActors", "CombatPresentationDirector.setStage",
    "CombatPresentationDirector._createRuntimeFormation", "CombatPresentationDirector._ensureRuntimeFormation",
    "CharacterFormation2D5.populate", "CharacterFormation2D5.attach", "CharacterFormation2D5.clear",
    "CombatPresentationDirector.startFromPresentationEvent", "CombatPresentationDirector._finishFormationActorsForReplacement",
    "CombatPresentationDirector._emitStep", "CombatRenderer._handleCombatPresentationStep", "CombatRenderer.resolveTimingInput"
  ],
  instrumentationErrors: root.instrumentationErrors
});
