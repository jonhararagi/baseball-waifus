const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const COMBAT_RESULT_TYPE = "COMBAT_RESULT";

export function calculateTacticalTurn({ turn = 1, power = 70, contact = 70, speed = 70, eye = 70 } = {}) {
  const t = clamp(Number(turn) || 1, 1, 5);
  const offense = clamp((Number(power) + Number(contact) + Number(speed) + Number(eye)) / 4, 1, 100);
  const cardPower = clamp(offense * 0.55 + Number(power) * 0.45, 1, 100);
  const mobCount = 2 + (t % 2) + (cardPower >= 82 ? 1 : 0);
  const damage = Math.round(clamp(7 + cardPower * 0.12 + t * 1.5, 6, 24));
  const charge = Math.round(clamp(10 + Number(contact) * 0.08 + Number(eye) * 0.04, 8, 22));
  const effectiveness = Math.round(clamp(damage * 2.2 + charge * 1.4, 0, 100));
  return { turn: t, mob_count: mobCount, damage, charge, effectiveness };
}

export function calculateClimaxDamage({ grade = "MISS", effectiveness = 0, internalEnergy = 0 } = {}) {
  const g = String(grade).toUpperCase();
  const eff = clamp(Number(effectiveness) || 0, 0, 100);
  const energy = clamp(Number(internalEnergy) || 0, 0, 100);
  if (g === "GREAT") return Math.round(clamp(42 + eff * 0.38 + energy * 0.28, 42, 95));
  if (g === "HIT") return Math.round(clamp(18 + eff * 0.20 + energy * 0.12, 18, 50));
  return 0;
}

export function resolveTimingGrade(grade) {
  switch (String(grade || "").toUpperCase()) {
    case "GREAT": return "HOME_RUN";
    case "HIT": return "HIT";
    default: return "STRIKE";
  }
}

export function resolveTacticalTurn({
  turn = 1,
  power = 70,
  contact = 70,
  speed = 70,
  eye = 70,
  bossHp = 100,
  bossMaxHp = 100,
  internalEnergy = 0,
  tacticalEffectiveness = 0,
  tacticalMaxTurns = 5
} = {}) {
  const tactical = calculateTacticalTurn({ turn, power, contact, speed, eye });
  const maxHp = Number(bossMaxHp) || 100;
  const nextBossHp = clamp(Number(bossHp) - tactical.damage, 1, maxHp);
  const bossConcentration = Math.round(clamp((nextBossHp / maxHp) * 100, 0, 100));
  const nextEnergy = Math.round(clamp(Number(internalEnergy) + tactical.charge, 0, 100));
  const nextEffectiveness = Math.round(clamp(
    Number(tacticalEffectiveness) * 0.55 + tactical.effectiveness * 0.45,
    0,
    100
  ));
  const phase = tactical.turn >= Number(tacticalMaxTurns || 5) ? "CLIMAX" : "TACTICAL";
  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase,
    outcome: "TACTICAL_HIT",
    ...tactical,
    energy_delta: tactical.charge,
    boss_hp_before: Number(bossHp),
    boss_hp_after: nextBossHp,
    boss_concentration_after: bossConcentration,
    energy_after: nextEnergy,
    effectiveness_after: nextEffectiveness,
    tactical_turn_after: tactical.turn,
    victory: false
  });
}

export function resolveClimaxTurn({
  grade = "MISS",
  bossHp = 100,
  bossMaxHp = 100,
  internalEnergy = 0,
  tacticalEffectiveness = 0,
  round = 1
} = {}) {
  const normalizedGrade = String(grade || "MISS").toUpperCase();
  const damage = calculateClimaxDamage({
    grade: normalizedGrade,
    effectiveness: tacticalEffectiveness,
    internalEnergy
  });
  const maxHp = Number(bossMaxHp) || 100;
  const nextBossHp = Math.max(0, Number(bossHp) - damage);
  const victory = nextBossHp <= 0;
  return Object.freeze({
    type: COMBAT_RESULT_TYPE,
    phase: victory ? "VICTORY" : "TACTICAL",
    outcome: resolveTimingGrade(normalizedGrade),
    grade: normalizedGrade,
    damage,
    boss_hp_before: Number(bossHp),
    boss_hp_after: nextBossHp,
    boss_concentration_after: Math.round(clamp((nextBossHp / maxHp) * 100, 0, 100)),
    energy_after: victory ? 100 : 0,
    effectiveness_after: victory ? 100 : 0,
    round_after: victory ? Number(round) : Number(round) + 1,
    tactical_turn_after: 0,
    victory
  });
}
