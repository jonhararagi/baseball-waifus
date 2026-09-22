const DEFAULT_RATES = Object.freeze({
  N: 50,
  R: 35,
  SR: 10,
  SSR: 4,
  UR: 1
});

const DEFAULT_PITY = Object.freeze({
  SSR: 20,
  UR: 80
});

const RARITY_ORDER = Object.freeze(["N", "R", "SR", "SSR", "UR"]);

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.min(0.999999999, Math.max(0, number));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRates(rates = {}) {
  const normalized = Object.fromEntries(
    RARITY_ORDER.map((rarity) => [rarity, Math.max(0, Number(rates[rarity] ?? DEFAULT_RATES[rarity]))])
  );
  const total = RARITY_ORDER.reduce((sum, rarity) => sum + normalized[rarity], 0);
  if (Math.abs(total - 100) > 0.000001) {
    throw new Error("Gacha rates must sum to 100");
  }
  return Object.freeze(normalized);
}

function pickByRarity(pool, rarity, rng) {
  const candidates = Array.isArray(pool?.[rarity]) ? pool[rarity] : [];
  if (candidates.length === 0) return null;
  return clone(candidates[Math.floor(clampUnit(rng()) * candidates.length)]);
}

function rollRarity(rates, rng) {
  const roll = clampUnit(rng()) * 100;
  let cursor = 0;
  for (const rarity of RARITY_ORDER) {
    cursor += rates[rarity];
    if (roll < cursor) return rarity;
  }
  return "UR";
}

function rarityRank(rarity) {
  return RARITY_ORDER.indexOf(String(rarity || "").toUpperCase());
}

function normalizePool(pool = []) {
  if (Array.isArray(pool)) {
    return Object.fromEntries(RARITY_ORDER.map((rarity) => [
      rarity,
      pool.filter((item) => String(item?.canonical?.rarity || item?.rarity || "").toUpperCase() === rarity)
    ]));
  }

  return Object.fromEntries(RARITY_ORDER.map((rarity) => [
    rarity,
    Array.isArray(pool?.[rarity]) ? pool[rarity] : []
  ]));
}

function duplicateReward(rarity) {
  const rewards = Object.freeze({
    N: { fragments: 1, scrap: 2 },
    R: { fragments: 3, scrap: 8 },
    SR: { fragments: 8, scrap: 25 },
    SSR: { fragments: 20, scrap: 100 },
    UR: { fragments: 60, scrap: 300 }
  });
  return clone(rewards[String(rarity || "N").toUpperCase()] || rewards.N);
}

export class GachaEngine {
  constructor({
    rates = DEFAULT_RATES,
    pity = DEFAULT_PITY,
    rng = Math.random
  } = {}) {
    this.rates = normalizeRates(rates);
    this.pity = {
      SSR: Math.max(1, Math.floor(Number(pity.SSR ?? DEFAULT_PITY.SSR))),
      UR: Math.max(1, Math.floor(Number(pity.UR ?? DEFAULT_PITY.UR)))
    };
    this.rng = rng;
    this.counters = { SSR: 0, UR: 0 };
  }

  getRates() {
    return { ...this.rates };
  }

  getPityState() {
    return {
      ssr_counter: this.counters.SSR,
      ur_counter: this.counters.UR,
      ssr_in: Math.max(0, this.pity.SSR - this.counters.SSR),
      ur_in: Math.max(0, this.pity.UR - this.counters.UR)
    };
  }

  resetPity() {
    this.counters = { SSR: 0, UR: 0 };
  }

  rollSingle({ pool = [], inventory = {} } = {}) {
    const normalizedPool = normalizePool(pool);
    const nextSsrCounter = this.counters.SSR + 1;
    const nextUrCounter = this.counters.UR + 1;

    let rarity;
    let pityTriggered = null;

    if (nextUrCounter >= this.pity.UR) {
      rarity = "UR";
      pityTriggered = "UR";
    } else if (nextSsrCounter >= this.pity.SSR) {
      rarity = "SSR";
      pityTriggered = "SSR";
    } else {
      rarity = rollRarity(this.rates, this.rng);
    }

    let character = pickByRarity(normalizedPool, rarity, this.rng);

    if (!character) {
      const fallbackRarity = [...RARITY_ORDER]
        .reverse()
        .find((candidate) => normalizedPool[candidate]?.length);
      rarity = fallbackRarity || "N";
      character = pickByRarity(normalizedPool, rarity, this.rng);
    }

    if (!character) {
      throw new Error("Gacha pool is empty");
    }

    const id = String(character.character_id || character.id || "");
    const previous = inventory?.[id] || null;
    const duplicate = Boolean(previous);

    this.counters.SSR = rarityRank(rarity) >= rarityRank("SSR") ? 0 : nextSsrCounter;
    this.counters.UR = rarity === "UR" ? 0 : nextUrCounter;

    return {
      rarity,
      character,
      duplicate,
      pity_triggered: pityTriggered,
      reward: duplicate ? duplicateReward(rarity) : { fragments: 0, scrap: 0 },
      pity: this.getPityState()
    };
  }

  rollTen({ pool = [], inventory = {} } = {}) {
    const results = [];
    let hasSrOrHigher = false;

    for (let index = 0; index < 10; index += 1) {
      const result = this.rollSingle({ pool, inventory });
      results.push(result);
      if (rarityRank(result.rarity) >= rarityRank("SR")) {
        hasSrOrHigher = true;
      }
    }

    if (!hasSrOrHigher) {
      const replacementIndex = results.reduce((best, current, index) => {
        if (rarityRank(current.rarity) < rarityRank(results[best]?.rarity)) return index;
        return best;
      }, 0);

      const normalizedPool = normalizePool(pool);
      const guaranteed = pickByRarity(normalizedPool, "SR", this.rng);
      if (guaranteed) {
        const previous = results[replacementIndex];
        const guaranteedId = String(guaranteed.character_id || guaranteed.id || "");
        const guaranteedDuplicate = Boolean(inventory?.[guaranteedId]);
        results[replacementIndex] = {
          rarity: "SR",
          character: guaranteed,
          duplicate: guaranteedDuplicate,
          pity_triggered: "TEN_PULL_SR_GUARANTEE",
          reward: guaranteedDuplicate
            ? duplicateReward("SR")
            : { fragments: 0, scrap: 0 },
          pity: this.getPityState()
        };
      }
    }

    const totals = results.reduce((summary, result) => {
      summary.fragments += result.reward.fragments;
      summary.scrap += result.reward.scrap;
      summary[result.rarity] = (summary[result.rarity] || 0) + 1;
      return summary;
    }, { fragments: 0, scrap: 0 });

    return { results, totals, pity: this.getPityState() };
  }
}

export {
  DEFAULT_RATES,
  DEFAULT_PITY,
  RARITY_ORDER,
  duplicateReward
};
