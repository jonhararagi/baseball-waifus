const EMPTY_IDENTITY = Object.freeze({
  archetype: "IDENTITY // UNKNOWN",
  playIdentity: "PLAYSTYLE // UNKNOWN",
  storyStatus: "none",
  storyHook: "",
  signatureActions: [],
  skillRoles: [],
  styleTags: [],
  faction: "",
  element: ""
});

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeInteger(value, fallback = 0) {
  const number = Math.floor(safeNumber(value, fallback));
  return Number.isFinite(number) ? number : fallback;
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function humanize(value) {
  return cleanText(value, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => cleanText(value)).filter(Boolean))];
}

function statValue(canonical, key) {
  return safeInteger(canonical?.stats?.[key], 0);
}

export function buildCharacterDetailViewModel({
  character = null,
  inventoryEntry = null,
  progression = null,
  roster = null,
  currencies = null,
  canUpgrade = false,
  upgradeCost = null
} = {}) {
  if (!character?.character_id) return null;

  const canonical = character.canonical || {};
  const identity = canonical.identity || EMPTY_IDENTITY;
  const quantity = safeInteger(inventoryEntry?.quantity, 0);
  const unlocked = Boolean(inventoryEntry?.unlocked && quantity > 0);
  const active = String(roster?.activeBatter || "") === String(character.character_id);

  const styleTags = uniqueStrings(identity.style_tags);
  const signatureActions = uniqueStrings(identity.signature_action_ids);
  const skillRoles = uniqueStrings(identity.skill_roles);

  return {
    id: String(character.character_id),
    name: cleanText(canonical.display_name, String(character.character_id)),
    rarity: humanize(canonical.rarity || "R"),
    position: humanize(canonical.position || "UNKNOWN"),
    specialization: humanize(canonical.specialization || "UTILITY"),
    element: humanize(canonical.element || "UNKNOWN"),
    level: safeInteger(progression?.level, 1),
    starRank: safeInteger(progression?.star_rank, 0),
    duplicates: Math.max(quantity, safeInteger(progression?.duplicate_count, quantity)),
    unlocked,
    active,
    artPath: cleanText(
      canonical.visual?.card_hd_url
        || canonical.visual?.card_url
        || canonical.visual?.avatar_url
        || "./assets/production/cards/" + String(character.character_id) + "--normal.jpg"
    ),
    identity: {
      archetype: humanize(identity.archetype, EMPTY_IDENTITY.archetype),
      playIdentity: humanize(identity.play_identity, EMPTY_IDENTITY.playIdentity),
      styleTags,
      faction: humanize(canonical.faction || identity.faction, "UNKNOWN FACTION"),
      element: humanize(canonical.element || identity.element, "UNKNOWN"),
      storyStatus: humanize(identity.story_status, "none"),
      storyHook: cleanText(identity.story_hook),
      signatureActions,
      signatureActionLabels: signatureActions.map(humanize),
      skillRoles: skillRoles.map(humanize)
    },
    progression: {
      level: safeInteger(progression?.level, 1),
      starRank: safeInteger(progression?.star_rank, 0),
      duplicateCount: Math.max(quantity, safeInteger(progression?.duplicate_count, quantity)),
      canUpgrade: Boolean(canUpgrade && unlocked && upgradeCost),
      nextCost: upgradeCost
        ? {
            scrap: Math.max(0, safeInteger(upgradeCost.scrap, 0)),
            fragments: Math.max(0, safeInteger(upgradeCost.fragments, 0)),
            nextLevel: safeInteger(upgradeCost.next_level, safeInteger(progression?.level, 1) + 1)
          }
        : null
    },
    relationship: {
      status: active ? "ACTIVE IN YOUR SQUAD" : unlocked ? "RECRUITED" : "NOT RECRUITED",
      quantity,
      isActive: active
    },
    resources: {
      scrap: Math.max(0, safeInteger(currencies?.scrap, 0)),
      fragments: Math.max(0, safeInteger(currencies?.fragments, 0))
    },
    stats: {
      power: statValue(canonical, "power"),
      contact: statValue(canonical, "contact"),
      speed: statValue(canonical, "speed"),
      pitch: statValue(canonical, "pitch"),
      control: statValue(canonical, "control"),
      defense: statValue(canonical, "defense"),
      critical: statValue(canonical, "critical"),
      stamina: statValue(canonical, "stamina")
    }
  };
}

export class CharacterDetailView {
  constructor({
    root = null,
    getCharacter = () => null,
    getInventoryEntry = () => null,
    getProgression = () => null,
    getRoster = () => null,
    getCurrencies = () => ({ scrap: 0, fragments: 0 }),
    canUpgrade = () => false,
    getUpgradeCost = () => null,
    onUpgrade = null,
    onUse = null,
    onClose = null
  } = {}) {
    Object.assign(this, {
      root,
      getCharacter,
      getInventoryEntry,
      getProgression,
      getRoster,
      getCurrencies,
      canUpgrade,
      getUpgradeCost,
      onUpgrade,
      onUse,
      onClose
    });
    this.characterId = null;
    this.model = null;
    this.bound = false;
  }

  mount() {
    if (!this.root) return this;

    if (!this.bound) {
      this.root.querySelector?.("#character-detail-close")?.addEventListener("click", () => this.close());
      this.root.querySelector?.("#character-detail-upgrade")?.addEventListener("click", () => {
        void this.upgrade();
      });
      this.root.querySelector?.("#character-detail-use")?.addEventListener("click", () => {
        this.onUse?.(this.characterId);
      });
      this.root.addEventListener?.("click", (event) => {
        if (event.target === this.root) this.close();
      });
      this.bound = true;
    }

    return this;
  }

  open(characterId) {
    const id = cleanText(characterId);
    if (!id) return null;
    this.characterId = id;
    this.root?.removeAttribute("hidden");
    this.refresh();
    globalThis.requestAnimationFrame?.(() => this.root?.classList.add("is-open"));
    return this.model;
  }

  close() {
    this.root?.classList.remove("is-open");
    this.root?.setAttribute("hidden", "");
    this.onClose?.();
  }

  getViewModel() {
    const id = this.characterId;
    if (!id) return null;

    const character = this.getCharacter?.(id);
    const progression = this.getProgression?.(id);
    const upgradeCost = progression ? this.getUpgradeCost?.(id) : null;

    return buildCharacterDetailViewModel({
      character,
      inventoryEntry: this.getInventoryEntry?.(id),
      progression,
      roster: this.getRoster?.(),
      currencies: this.getCurrencies?.(),
      canUpgrade: this.canUpgrade?.(id),
      upgradeCost
    });
  }

  refresh() {
    this.model = this.getViewModel();
    this.render(this.model);
    return this.model;
  }

  text(selector, value) {
    const element = this.root?.querySelector?.(selector);
    if (element) element.textContent = String(value ?? "");
  }

  render(model) {
    if (!this.root) return;

    if (!model) {
      this.close();
      return;
    }

    this.root.classList?.toggle("is-locked-character", !model.unlocked);
    this.root.classList?.toggle("is-active-character", model.active);

    this.text("#character-detail-name", model.name);
    this.text("#character-detail-rarity", model.rarity);
    this.text("#character-detail-position", model.position + " • " + model.specialization);
    this.text("#character-detail-play-identity", model.identity.playIdentity);
    this.text("#character-detail-archetype", model.identity.archetype);
    this.text("#character-detail-element", model.identity.element);
    this.text("#character-detail-faction", model.identity.faction);

    const storyBlock = this.root.querySelector?.("#character-detail-story");
    const storyStatus = this.root.querySelector?.("#character-detail-story-status");
    const storyHook = this.root.querySelector?.("#character-detail-story-hook");
    if (storyStatus) storyStatus.textContent = model.identity.storyStatus;
    if (storyHook) {
      storyHook.textContent = model.identity.storyHook || "NO STORY HOOK REGISTERED";
      storyHook.hidden = !model.identity.storyHook;
    }
    if (storyBlock) storyBlock.hidden = false;

    const tags = this.root.querySelector?.("#character-detail-style-tags");
    if (tags) {
      tags.replaceChildren();
      for (const tag of model.identity.styleTags) {
        const chip = document.createElement("span");
        chip.className = "character-detail-tag";
        chip.textContent = humanize(tag);
        tags.appendChild(chip);
      }
      tags.hidden = model.identity.styleTags.length === 0;
    }

    const actions = this.root.querySelector?.("#character-detail-signature-actions");
    if (actions) {
      actions.replaceChildren();
      for (const label of model.identity.signatureActionLabels) {
        const chip = document.createElement("span");
        chip.className = "character-detail-action-chip";
        chip.textContent = label;
        actions.appendChild(chip);
      }
      actions.hidden = model.identity.signatureActionLabels.length === 0;
    }

    const roles = this.root.querySelector?.("#character-detail-skill-roles");
    if (roles) {
      roles.textContent = model.identity.skillRoles.join(" • ") || "NO SKILL ROLE REGISTERED";
    }

    this.text("#character-detail-level", "LV " + model.progression.level);
    this.text("#character-detail-stars", "RANK " + model.progression.starRank);
    this.text("#character-detail-duplicates", "DUPLICATES ×" + model.progression.duplicateCount);
    this.text("#character-detail-relationship-status", model.relationship.status);
    this.text("#character-detail-scrap", model.resources.scrap.toLocaleString("en-US"));
    this.text("#character-detail-fragments", model.resources.fragments.toLocaleString("en-US"));

    const cost = model.progression.nextCost;
    this.text(
      "#character-detail-upgrade-cost",
      cost ? "COST " + cost.scrap + " SCRAP • " + cost.fragments + " FRAGMENTS • → LV " + cost.nextLevel : "MAX LEVEL"
    );

    const upgradeButton = this.root.querySelector?.("#character-detail-upgrade");
    if (upgradeButton) {
      upgradeButton.disabled = !model.progression.canUpgrade;
      upgradeButton.textContent = model.progression.canUpgrade ? "MEJORAR" : model.unlocked ? (cost ? "FALTA RECURSO" : "MAX LEVEL") : "RECLUTA PRIMERO";
    }

    const useButton = this.root.querySelector?.("#character-detail-use");
    if (useButton) {
      useButton.disabled = !model.unlocked;
      useButton.textContent = model.active ? "USAR EN COMBATE" : "USAR EN COMBATE";
    }

    const art = this.root.querySelector?.("#character-detail-art");
    if (art) {
      art.alt = model.name;
      art.src = model.artPath;
      art.onerror = () => {
        if (art.dataset.fallbackTried === "true") {
          art.hidden = true;
          return;
        }
        art.dataset.fallbackTried = "true";
        art.src = "./assets/production/sprites/" + model.id + "_idle.png";
      };
    }

    const statSelectors = ["power", "contact", "speed", "pitch", "control", "defense", "critical", "stamina"];
    for (const stat of statSelectors) {
      this.text("#character-detail-stat-" + stat, model.stats[stat]);
    }
  }

  async upgrade() {
    if (!this.characterId) return null;
    if (!this.model?.progression.canUpgrade) return null;

    const result = await this.onUpgrade?.(this.characterId);
    this.refresh();
    return result;
  }
}

export const CHARACTER_DETAIL_LABELS = Object.freeze({
  MIRAR: "MIRAR",
  CONOCER: "CONOCER",
  MEJORAR: "MEJORAR",
  USAR: "USAR EN COMBATE"
});
