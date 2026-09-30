import {
  GachaController as LegacyGachaController,
  calculateGachaProbabilities,
  SCAVENGER_SCRAP_COST
} from "./gacha_controller_runtime.js";
import {
  createPlayerIdentity,
  PlayerMetaAuthority,
  resolvePlayerIdentity
} from "./player_meta_state.js";
import { PlayerMetaPersistenceAdapter } from "./player_meta_persistence_adapter.js";
import { GachaPlayerMetaIntegration } from "./gacha_player_meta_integration.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isStorageLike(storage) {
  return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function";
}

export { calculateGachaProbabilities, SCAVENGER_SCRAP_COST };

export class GachaController extends LegacyGachaController {
  constructor(options = {}) {
    super(options);
    this._metaOperationDepth = 0;
    this._suppressMetaEmit = false;
    this.playerMetaIntegration = null;

    const metaStorage = options.playerMetaStorage || this.storage;
    if (isStorageLike(metaStorage)) {
      const identity = options.playerMetaIdentity
        ? createPlayerIdentity(options.playerMetaIdentity)
        : resolvePlayerIdentity({
          telegramUser: globalThis?.Telegram?.WebApp?.initDataUnsafe?.user || null,
          localPlayerId: options.localPlayerId || "local-player"
        });
      const persistenceAdapter = options.playerMetaPersistenceAdapter
        || new PlayerMetaPersistenceAdapter({ storage: metaStorage });
      const initialState = persistenceAdapter.load(identity);
      const authority = options.playerMetaAuthority || new PlayerMetaAuthority(initialState);
      this.playerMetaIntegration = new GachaPlayerMetaIntegration({
        identity,
        authority,
        persistenceAdapter,
        now: this.now
      });
    }
  }

  async initialize() {
    await super.initialize();
    if (!this.playerMetaIntegration) return this;
    const integration = this.playerMetaIntegration;
    const snapshot = integration.loadOrMigrate(this.state, (id) => this.queue.find((unit) => unit.character_id === id) || null);
    integration.authority.replaceSnapshot(snapshot);
    this.state = integration.hydrateGachaState(this.state, (id) => this.queue.find((unit) => unit.character_id === id) || null);
    super._emit();
    return this;
  }

  _refreshFromMeta() {
    if (!this.playerMetaIntegration || this._metaOperationDepth > 0) return;
    this.state = this.playerMetaIntegration.hydrateGachaState(
      this.state,
      (id) => this.queue.find((unit) => unit.character_id === id) || null
    );
  }

  getState() {
    this._refreshFromMeta();
    return super.getState();
  }

  getStatus() {
    this._refreshFromMeta();
    return super.getStatus();
  }

  getActiveBatter() {
    this._refreshFromMeta();
    return super.getActiveBatter();
  }

  getScavengerScrap() {
    this._refreshFromMeta();
    return super.getScavengerScrap();
  }

  getFragments() {
    this._refreshFromMeta();
    return super.getFragments();
  }

  _saveState() {
    if (this.playerMetaIntegration) return true;
    return super._saveState();
  }

  _emit(payload = null) {
    if (this._suppressMetaEmit) return;
    return super._emit(payload);
  }

  async rollGacha() {
    if (!this.playerMetaIntegration) return super.rollGacha();

    this._refreshFromMeta();
    const beforeState = clone(this.state);
    this._metaOperationDepth += 1;
    this._suppressMetaEmit = true;
    try {
      const result = await super.rollGacha();
      this.playerMetaIntegration.applyPull({
        characterId: result.character.character_id,
        cost: SCAVENGER_SCRAP_COST,
        duplicateFragmentReward: result.duplicate_fragment_reward,
        pullsSinceUR: result.pulls_since_UR,
        activateIfEmpty: beforeState.active_batter === null
      });
      this.state = this.playerMetaIntegration.hydrateGachaState(
        this.state,
        (id) => this.queue.find((unit) => unit.character_id === id) || null
      );
      result.fragments = this.state.fragment_bank;
      result.pulls_since_UR = this.state.pulls_since_UR;
      this._suppressMetaEmit = false;
      this._metaOperationDepth -= 1;
      super._emit(result);
      return result;
    } catch (error) {
      this.state = beforeState;
      this._suppressMetaEmit = false;
      this._metaOperationDepth -= 1;
      throw error;
    }
  }

  async rollGachaTen() {
    if (!this.playerMetaIntegration) return super.rollGachaTen();

    this._refreshFromMeta();
    if (this.getScavengerScrap() < SCAVENGER_SCRAP_COST * 10) {
      throw new Error("Not enough Scavenger Scrap for a 10x recruit");
    }

    const beforeMeta = this.playerMetaIntegration.getSnapshot();
    const beforeState = clone(this.state);
    try {
      const results = [];
      let lastStateBeforePull = null;
      for (let index = 0; index < 10; index += 1) {
        lastStateBeforePull = clone(this.state);
        results.push(await this.rollGacha());
      }

      const hasSrOrHigher = results.some((result) => ["SR", "SSR", "UR"].includes(result.rarity));
      if (!hasSrOrHigher) {
        this.playerMetaIntegration.migrateLegacyState(lastStateBeforePull, (id) => this.queue.find((unit) => unit.character_id === id) || null);
        this.state = this.playerMetaIntegration.hydrateGachaState(lastStateBeforePull, (id) => this.queue.find((unit) => unit.character_id === id) || null);
        const originalRng = this.rng;
        let rollCall = 0;
        this.rng = () => {
          rollCall += 1;
          return rollCall === 1 ? 0.8 : originalRng();
        };
        try {
          results[results.length - 1] = await this.rollGacha();
        } finally {
          this.rng = originalRng;
        }
        results[results.length - 1].ten_pull_guarantee = "SR";
      }

      return {
        count: 10,
        results,
        totals: results.reduce((summary, result) => {
          summary[result.rarity] = (summary[result.rarity] || 0) + 1;
          return summary;
        }, {}),
        state: this.getStatus()
      };
    } catch (error) {
      this.state = beforeState;
      this.playerMetaIntegration.authority.replaceSnapshot(beforeMeta);
      try {
        this.playerMetaIntegration.persistenceAdapter.save(beforeMeta);
      } catch {
        // Preserve the original ten-pull failure.
      }
      throw error;
    }
  }

  setActiveBatter(characterId) {
    if (!this.playerMetaIntegration) return super.setActiveBatter(characterId);
    this._refreshFromMeta();
    this.playerMetaIntegration.setActiveBatter(String(characterId || ""));
    this.state = this.playerMetaIntegration.hydrateGachaState(this.state, (id) => this.queue.find((unit) => unit.character_id === id) || null);
    this._emit();
    return this.state.active_batter;
  }

  addScrap(amount) {
    if (!this.playerMetaIntegration) return super.addScrap(amount);
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    if (delta === 0) return this.getScavengerScrap();
    this._refreshFromMeta();
    this.playerMetaIntegration.addCurrency("SCRAP", delta);
    this.state = this.playerMetaIntegration.hydrateGachaState(this.state, (id) => this.queue.find((unit) => unit.character_id === id) || null);
    this._emit();
    return this.state.scavenger_scrap;
  }

  addFragments(amount) {
    if (!this.playerMetaIntegration) return super.addFragments(amount);
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    if (delta === 0) return this.getFragments();
    this._refreshFromMeta();
    this.playerMetaIntegration.addCurrency("FRAGMENTS", delta);
    this.state = this.playerMetaIntegration.hydrateGachaState(this.state, (id) => this.queue.find((unit) => unit.character_id === id) || null);
    this._emit();
    return this.state.fragment_bank;
  }

  spendScrapAndFragments(cost = {}) {
    if (!this.playerMetaIntegration) return super.spendScrapAndFragments(cost);
    this._refreshFromMeta();
    this.playerMetaIntegration.spendCurrencies({
      scrap: Math.max(0, Math.floor(Number(cost.scrap) || 0)),
      fragments: Math.max(0, Math.floor(Number(cost.fragments) || 0))
    });
    this.state = this.playerMetaIntegration.hydrateGachaState(this.state, (id) => this.queue.find((unit) => this.queue.find((unit) => unit.character_id === id) || null)
    );
    this._emit();
    return { scrap: this.state.scavenger_scrap, fragments: this.state.fragment_bank };
  }

  // Placeholder to be corrected below
  
}

export function exposeGachaToWindow(controller) {
  if (typeof window === "undefined") return null;
  const api = {
    getState: () => controller.getState(),
    getStatus: () => controller.getStatus(),
    getActiveBatter: () => controller.getActiveBatter(),
    setActiveBatter: (characterId) => controller.setActiveBatter(characterId),
    getScavengerScrap: () => controller.getScavengerScrap(),
    getFragments: () => controller.getFragments(),
    addScrap: (amount) => controller.addScrap(amount),
    spendScrapAndFragments: (currency) => controller.spendScrapAndFragments(currency),
    initialize: () => controller.initialize(),
    rollGacha: () => controller.rollGacha(),
    rollGachaTen: () => controller.rollGachaTen(),
    getCharacters: () => controller.getCharacters(),
    subscribe: (listener) => controller.subscribe(listener)
  };
  window.BaseballWaifusGacha = api;
  return api;
}
