const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const KYTOS_PHASE = Object.freeze({
  FORMATION: "FORMATION",
  TRANSFER: "TRANSFER",
  CLIMAX: "CLIMAX",
  EMERGENCY: "EMERGENCY",
  VICTORY: "VICTORY",
  INTERRUPTED: "INTERRUPTED"
});

export const ENERGY_TYPE = Object.freeze({
  ATTACK: "ATTACK",
  BUFF: "BUFF",
  DEBUFF: "DEBUFF"
});

export const SUPPORT_ROLE = Object.freeze({
  BUFFER: "BUFFER",
  DEBUFFER: "DEBUFFER",
  HEALER: "HEALER",
  ENERGY_SUPPORT: "ENERGY_SUPPORT"
});

export const ACTION_CARD = Object.freeze({
  BUFFER: "BUFFER",
  DEBUFFER: "DEBUFFER",
  HEAL: "HEAL",
  ATTACK: "ATTACK"
});

const VALID_CARDS = new Set(Object.values(ACTION_CARD));
const VALID_ENERGY = new Set(Object.values(ENERGY_TYPE));

export function createFormation({
  batterId = "bw001",
  supportAId = "bw003",
  supportBId = "bw008",
  supportCId = "support-c"
} = {}) {
  return Object.freeze({
    batter: Object.freeze({ id: String(batterId), position: "BATTER" }),
    supports: Object.freeze([
      Object.freeze({ id: String(supportAId), position: "HOME_SUPPORT" }),
      Object.freeze({ id: String(supportBId), position: "LEFT_SUPPORT" }),
      Object.freeze({ id: String(supportCId), position: "RIGHT_SUPPORT" })
    ]),
    bases: Object.freeze([
      Object.freeze({ id: "base-home", position: "BATTER", shield: 100 }),
      Object.freeze({ id: "base-left", position: "SUPPORT_A", shield: 100 }),
      Object.freeze({ id: "base-top", position: "SUPPORT_B", shield: 100 }),
      Object.freeze({ id: "base-right", position: "SUPPORT_C", shield: 100 })
    ])
  });
}

export function createCombatState(options = {}) {
  const formation = createFormation(options);
  const kytosMaxHp = clamp(Number(options.kytosMaxHp) || 100, 1, 10000);
  const kytosMaxEnergy = clamp(Number(options.kytosMaxEnergy) || 100, 1, 1000);
  return {
    phase: KYTOS_PHASE.FORMATION,
    formation,
    shield: clamp(Number.isFinite(Number(options.shield)) ? Number(options.shield) : 100, 0, 100),
    kytos: {
      hp: kytosMaxHp,
      maxHp: kytosMaxHp,
      energy: clamp(Number(options.kytosEnergy) || 0, 0, kytosMaxEnergy),
      maxEnergy: kytosMaxEnergy,
      emergencyThreshold: clamp(Number.isFinite(Number(options.emergencyThreshold)) ? Number(options.emergencyThreshold) : 30, 1, 100)
    },
    batter: {
      id: formation.batter.id,
      storedEnergy: 0,
      attackBonus: 0,
      debuff: 0
    },
    energyBall: null,
    interruptedSupport: null,
    lastResult: null
  };
}

function assertCard(card) {
  const normalized = String(card || "").toUpperCase();
  if (!VALID_CARDS.has(normalized)) throw new TypeError("Unknown action card");
  return normalized;
}

function assertEnergyType(type) {
  const normalized = String(type || "").toUpperCase();
  if (!VALID_ENERGY.has(normalized)) throw new TypeError("Unknown energy type");
  return normalized;
}

export function createEnergyBall({ sourceId, energyType = ENERGY_TYPE.ATTACK, energy = 0 } = {}) {
  return Object.freeze({
    sourceId: String(sourceId || ""),
    energyType: assertEnergyType(energyType),
    energy: clamp(Number(energy) || 0, 0, 100),
    active: true
  });
}

export function captureEnergyBall(state, receiverId) {
  if (!state.energyBall?.active) return state;
  return {
    ...state,
    phase: KYTOS_PHASE.TRANSFER,
    energyBall: Object.freeze({
      ...state.energyBall,
      receiverId: String(receiverId),
      active: false
    }),
    lastResult: "BALL_CAPTURED"
  };
}

export function modifyEnergyBall(state, { energyType, energyDelta = 0 } = {}) {
  if (!state.energyBall || state.energyBall.active) return state;
  return {
    ...state,
    energyBall: Object.freeze({
      ...state.energyBall,
      energyType: assertEnergyType(energyType),
      energy: clamp(state.energyBall.energy + (Number(energyDelta) || 0), 0, 100),
      active: false
    }),
    lastResult: "BALL_MODIFIED"
  };
}

export function launchEnergyBall(state, targetId) {
  if (!state.energyBall || state.energyBall.active) return state;
  return {
    ...state,
    energyBall: Object.freeze({
      ...state.energyBall,
      targetId: String(targetId),
      active: true
    }),
    lastResult: "BALL_LAUNCHED"
  };
}

export function beginEnergyTransfer(state, { sourceId, energyType = ENERGY_TYPE.ATTACK, energy = 25 } = {}) {
  return {
    ...state,
    phase: KYTOS_PHASE.TRANSFER,
    energyBall: createEnergyBall({ sourceId, energyType, energy }),
    lastResult: "BALL_CREATED"
  };
}

export function applyActionCard(state, card, { energy = 10 } = {}) {
  const normalized = assertCard(card);
  if (normalized === ACTION_CARD.BUFFER) {
    return {
      ...state,
      batter: { ...state.batter, attackBonus: clamp(state.batter.attackBonus + Number(energy), 0, 50) },
      lastResult: "BUFFER_APPLIED"
    };
  }
  if (normalized === ACTION_CARD.DEBUFFER) {
    return {
      ...state,
      batter: { ...state.batter, debuff: clamp(state.batter.debuff + Number(energy), 0, 50) },
      lastResult: "DEBUFFER_APPLIED"
    };
  }
  if (normalized === ACTION_CARD.HEAL) {
    return {
      ...state,
      shield: clamp(state.shield + Number(energy), 0, 100),
      lastResult: "SHIELD_RESTORED"
    };
  }
  return {
    ...state,
    batter: { ...state.batter, storedEnergy: clamp(state.batter.storedEnergy + Number(energy), 0, 100) },
    lastResult: "ATTACK_CHARGED"
  };
}

export function transferToBatter(state) {
  const ball = state.energyBall;
  if (!ball?.active || String(ball.targetId) !== String(state.batter.id)) return state;
  const multiplier = ball.energyType === ENERGY_TYPE.BUFF ? 1.25 : ball.energyType === ENERGY_TYPE.DEBUFF ? 0.9 : 1;
  const gain = ball.energy * multiplier;
  return {
    ...state,
    phase: KYTOS_PHASE.TRANSFER,
    batter: {
      ...state.batter,
      storedEnergy: clamp(state.batter.storedEnergy + gain, 0, 100)
    },
    energyBall: null,
    lastResult: "BATTER_CHARGED"
  };
}

export function resolveKytosHit(state, { timingAccuracy = 1 } = {}) {
  const timing = clamp(Number(timingAccuracy), 0, 1);
  const attackEnergy = clamp(state.batter.storedEnergy + state.batter.attackBonus - state.batter.debuff, 0, 150);
  const damage = Math.round(attackEnergy * (0.5 + timing * 0.5));
  const hp = Math.max(0, state.kytos.hp - damage);
  const victory = hp === 0;
  return {
    ...state,
    phase: victory ? KYTOS_PHASE.VICTORY : KYTOS_PHASE.TRANSFER,
    kytos: { ...state.kytos, hp },
    batter: { ...state.batter, storedEnergy: 0, attackBonus: 0 },
    lastResult: victory ? "KYTOS_DEFEATED" : "KYTOS_HIT",
    damage
  };
}

export function applyKytosPressure(state, pressure) {
  const nextShield = clamp(state.shield - Math.max(0, Number(pressure) || 0), 0, 100);
  const interrupted = nextShield < 60;
  return {
    ...state,
    shield: nextShield,
    phase: interrupted ? KYTOS_PHASE.INTERRUPTED : state.phase,
    interruptedSupport: interrupted ? state.formation.supports[0].id : null,
    lastResult: interrupted ? "INTERRUPTED_SUPPORT" : "SHIELD_PRESSURED"
  };
}

export function chargeKytosEmergency(state, energy) {
  const nextEnergy = clamp(state.kytos.energy + Math.max(0, Number(energy) || 0), 0, state.kytos.maxEnergy);
  const emergency = nextEnergy >= state.kytos.maxEnergy * (state.kytos.emergencyThreshold / 100);
  return {
    ...state,
    phase: emergency ? KYTOS_PHASE.EMERGENCY : state.phase,
    kytos: { ...state.kytos, energy: nextEnergy },
    lastResult: emergency ? "KYTOS_EMERGENCY" : "KYTOS_CHARGING"
  };
}

export function resolveTimingEvent({ timingDeltaMs, storedEnergy, kytosEnergy }) {
  const delta = Math.abs(Number(timingDeltaMs));
  const accuracy = Number.isFinite(delta) ? clamp(1 - delta / 150, 0, 1) : 0;
  const energy = clamp(Number(storedEnergy) || 0, 0, 100);
  const enemyEnergy = clamp(Number(kytosEnergy) || 0, 0, 100);
  const success = delta <= 135;
  const multiplier = success ? 0.75 + accuracy * 0.75 : 0;
  const damage = Math.round(Math.max(0, energy * multiplier - enemyEnergy * 0.1));
  return Object.freeze({
    success,
    accuracy,
    multiplier,
    damage,
    reflectedEnergy: success ? Math.round(energy * accuracy) : 0
  });
}

export function resolveClimax(state, { timingDeltaMs } = {}) {
  const timing = resolveTimingEvent({
    timingDeltaMs,
    storedEnergy: state.batter.storedEnergy,
    kytosEnergy: state.kytos.energy
  });
  const hp = Math.max(0, state.kytos.hp - timing.damage);
  return {
    ...state,
    phase: hp === 0 ? KYTOS_PHASE.VICTORY : KYTOS_PHASE.EMERGENCY,
    kytos: { ...state.kytos, hp, energy: timing.success ? 0 : state.kytos.energy },
    batter: { ...state.batter, storedEnergy: 0 },
    lastResult: hp === 0 ? "KYTOS_DEFEATED" : timing.success ? "EMERGENCY_REFLECTED" : "TIMING_MISS",
    timing
  };
}

export const KYTOS_COMBAT_DESIGN_STATUS = Object.freeze({
  status: "WORKING IMPLEMENTATION",
  canon: "DESIGN PROPOSAL",
  boundary: "Vertical slice only. No persistent combat progression, elements, deckbuilding, lore, or protagonist anomaly."
});
