import {
  applyWaifuConfig,
  exportWaifuConfigJson,
  getConfigSnapshot,
  listWaifus,
  updateWaifuConfig
} from "./waifu_database.js";

export const ADMIN_STORAGE_VERSION = 1;
export const INFINITE_SCRAP_VALUE = 999999999;
export const ADMIN_HOTKEY = Object.freeze({
  ctrl: true,
  shift: true,
  key: "A"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampStat(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
}

function ensureString(value) {
  return String(value || "").trim();
}

function makeElement(tag, props = {}) {
  if (typeof document === "undefined") return null;
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "textContent") {
      element.textContent = String(value);
    } else if (key === "className") {
      element.className = String(value);
    } else if (key === "attributes") {
      for (const [attr, attrValue] of Object.entries(value || {})) {
        element.setAttribute(attr, String(attrValue));
      }
    } else {
      element[key] = value;
    }
  }
  return element;
}

export class AdminPanel {
  constructor({
    root = typeof document !== "undefined" ? document.body : null,
    saveSystem = null,
    getCharacter = null,
    onCharacterUpdated = null,
    onInfiniteScrapChange = null,
    onSuperSwingTest = null,
    onVoiceTest = null
  } = {}) {
    this.root = root;
    this.saveSystem = saveSystem;
    this.getCharacter = typeof getCharacter === "function" ? getCharacter : null;
    this.onCharacterUpdated = typeof onCharacterUpdated === "function" ? onCharacterUpdated : null;
    this.onInfiniteScrapChange = typeof onInfiniteScrapChange === "function"
      ? onInfiniteScrapChange
      : null;
    this.onSuperSwingTest = typeof onSuperSwingTest === "function"
      ? onSuperSwingTest
      : null;
    this.onVoiceTest = typeof onVoiceTest === "function" ? onVoiceTest : null;

    this.state = {
      infinite_scrap: false,
      finite_scrap_before_infinite: null
    };
    this.selectedId = listWaifus()[0]?.id || null;
    this.modal = null;
    this.form = null;
    this.statusNode = null;
    this.logoTapTimes = [];
    this.boundKeydown = (event) => this._handleKeydown(event);
    this.boundLogoPointer = () => this._handleLogoTap();

    if (this.root && typeof document !== "undefined") {
      this.mount();
    }
  }

  mount() {
    if (this.modal) return this.modal;

    const overlay = makeElement("div", {
      className: "admin-modal-overlay",
      attributes: {
        hidden: "true",
        "aria-hidden": "true"
      }
    });

    const modal = makeElement("section", {
      className: "admin-modal",
      attributes: {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "admin-panel-title"
      }
    });

    const header = makeElement("header", { className: "admin-modal-header" });
    const title = makeElement("div");
    const kicker = makeElement("span", {
      className: "admin-modal-kicker",
      textContent: "INTERNAL TOOL"
    });
    const heading = makeElement("h2", {
      id: "admin-panel-title",
      textContent: "ADMIN // WAIFU CONFIG"
    });
    title.append(kicker, heading);

    const closeButton = makeElement("button", {
      className: "admin-modal-close",
      type: "button",
      textContent: "CLOSE"
    });
    closeButton.addEventListener("click", () => this.close());
    header.append(title, closeButton);

    const notice = makeElement("div", {
      className: "admin-modal-notice",
      textContent: "Runtime overrides are local test data. The repository JSON remains the source configuration."
    });

    const body = makeElement("div", { className: "admin-modal-body" });
    const characterField = makeElement("label", { className: "admin-field" });
    characterField.append(
      makeElement("span", { textContent: "WAIFU" })
    );
    const select = makeElement("select", {
      id: "admin-waifu-select",
      name: "waifu"
    });
    for (const waifu of listWaifus()) {
      const option = makeElement("option", {
        value: waifu.id,
        textContent: waifu.name
      });
      if (waifu.id === this.selectedId) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener("change", () => {
      this.selectedId = select.value;
      this._loadForm();
    });
    characterField.appendChild(select);

    const imageGrid = makeElement("div", { className: "admin-grid admin-grid-images" });
    const imageInputs = {};
    for (const [key, label] of [
      ["avatar", "AVATAR URL"],
      ["card_art", "CARD ART URL"],
      ["cutin_art", "CUT-IN ART URL"]
    ]) {
      const field = makeElement("label", { className: "admin-field" });
      field.append(makeElement("span", { textContent: label }));
      const input = makeElement("input", {
        type: "url",
        autocomplete: "off",
        spellcheck: false,
        placeholder: "https://..."
      });
      field.appendChild(input);
      imageGrid.appendChild(field);
      imageInputs[key] = input;
    }

    const statGrid = makeElement("div", { className: "admin-grid admin-grid-stats" });
    const statInputs = {};
    for (const key of ["power", "contact", "speed", "eye"]) {
      const field = makeElement("label", { className: "admin-field" });
      field.append(makeElement("span", { textContent: key.toUpperCase() }));
      const input = makeElement("input", {
        type: "number",
        min: "0",
        max: "100",
        step: "1",
        inputMode: "numeric"
      });
      field.appendChild(input);
      statGrid.appendChild(field);
      statInputs[key] = input;
    }

    const testRow = makeElement("div", { className: "admin-test-row" });
    const infiniteLabel = makeElement("label", { className: "admin-toggle" });
    const infinite = makeElement("input", {
      type: "checkbox",
      id: "admin-infinite-scrap"
    });
    infinite.addEventListener("change", () => this.setInfiniteScrap(infinite.checked));
    infiniteLabel.append(infinite, makeElement("span", { textContent: "INFINITE SCRAP // TEST BALANCE" }));

    const superButton = makeElement("button", {
      className: "admin-button admin-button-accent",
      type: "button",
      textContent: "TEST SUPER SWING"
    });
    superButton.addEventListener("click", () => this.testSuperSwing());

    const voiceButton = makeElement("button", {
      className: "admin-button",
      type: "button",
      textContent: "TEST VOICE"
    });
    voiceButton.addEventListener("click", () => this.testVoice());

    testRow.append(infiniteLabel, superButton, voiceButton);

    const actionRow = makeElement("div", { className: "admin-action-row" });
    const applyButton = makeElement("button", {
      className: "admin-button admin-button-accent",
      type: "button",
      textContent: "APPLY HOT RELOAD"
    });
    applyButton.addEventListener("click", () => this._applyForm());

    const exportButton = makeElement("button", {
      className: "admin-button",
      type: "button",
      textContent: "EXPORT JSON.GZ"
    });
    exportButton.addEventListener("click", async () => {
      try {
        await this.exportCompressedFile();
        this._setStatus("CONFIG // EXPORTED");
      } catch (error) {
        this._setStatus("EXPORT ERROR // " + String(error.message || error));
      }
    });

    const resetButton = makeElement("button", {
      className: "admin-button",
      type: "button",
      textContent: "RESET LOCAL OVERRIDES"
    });
    resetButton.addEventListener("click", () => {
      const snapshot = this.resetToMemoryFallback();
      this.selectedId = snapshot.characters[0]?.id || null;
      this._refreshSelect();
      this._loadForm();
      this._persist();
      this._setStatus("CONFIG // MEMORY FALLBACK");
    });

    actionRow.append(applyButton, exportButton, resetButton);

    this.statusNode = makeElement("div", {
      className: "admin-status",
      role: "status",
      "aria-live": "polite",
      textContent: "READY // CTRL+SHIFT+A"
    });

    body.append(
      characterField,
      imageGrid,
      makeElement("div", {
        className: "admin-section-label",
        textContent: "BATTLE STATS // 0-100"
      }),
      statGrid,
      testRow,
      actionRow,
      this.statusNode
    );

    const form = makeElement("form", { className: "admin-form" });
    form.addEventListener("submit", (event) => event.preventDefault());
    form.append(body);

    modal.append(header, notice, form);
    overlay.appendChild(modal);
    this.root.appendChild(overlay);

    this.modal = overlay;
    this.form = {
      select,
      imageInputs,
      statInputs,
      infinite
    };

    window.addEventListener("keydown", this.boundKeydown);
    const logo = document.querySelector(".brand-mark");
    logo?.addEventListener("pointerup", this.boundLogoPointer, { passive: true });

    this._loadForm();
    return this.modal;
  }

  destroy() {
    window.removeEventListener?.("keydown", this.boundKeydown);
    document.querySelector(".brand-mark")?.removeEventListener?.("pointerup", this.boundLogoPointer);
    this.modal?.remove();
    this.modal = null;
  }

  open() {
    if (!this.modal) this.mount();
    if (!this.modal) return false;
    this._refreshSelect();
    this._loadForm();
    this.modal.hidden = false;
    this.modal.setAttribute("aria-hidden", "false");
    return true;
  }

  close() {
    if (!this.modal) return false;
    this.modal.hidden = true;
    this.modal.setAttribute("aria-hidden", "true");
    return true;
  }

  toggle() {
    if (!this.modal || this.modal.hidden) return this.open();
    return this.close();
  }

  isOpen() {
    return Boolean(this.modal && !this.modal.hidden);
  }

  selectWaifu(id) {
    const normalized = ensureString(id).toLowerCase();
    const known = listWaifus().find((waifu) => waifu.id === normalized);
    if (!known) throw new Error("Unknown waifu: " + id);
    this.selectedId = known.id;
    this._refreshSelect();
    this._loadForm();
    return clone(known);
  }

  updateImage(characterId, assetKey, url) {
    const key = String(assetKey || "");
    if (!["avatar", "card_art", "cutin_art"].includes(key)) {
      throw new Error("Unknown image field: " + key);
    }

    const value = ensureString(url);
    if (!/^https://.+/i.test(value)) {
      throw new Error("Image URLs must use HTTPS");
    }

    const updated = updateWaifuConfig(characterId, {
      assets: { [key]: value }
    });
    this._afterCharacterUpdate(updated);
    return updated;
  }

  updateStats(characterId, stats = {}) {
    const updated = updateWaifuConfig(characterId, {
      stats: {
        power: clampStat(stats.power),
        contact: clampStat(stats.contact),
        speed: clampStat(stats.speed),
        eye: clampStat(stats.eye)
      }
    });
    this._afterCharacterUpdate(updated);
    return updated;
  }

  applyCharacterForm() {
    return this._applyForm();
  }

  setInfiniteScrap(enabled) {
    this.state.infinite_scrap = Boolean(enabled);
    if (this.onInfiniteScrapChange) {
      this.onInfiniteScrapChange(this.state.infinite_scrap);
    }
    this._persist();
    this._setStatus(this.state.infinite_scrap
      ? "SCRAP // 999999999 TEST MODE"
      : "SCRAP // NORMAL MODE"
    );
    return this.state.infinite_scrap;
  }

  testSuperSwing(characterId = this.selectedId) {
    const character = this.getCharacter?.(characterId)
      || listWaifus().find((waifu) => waifu.id === characterId);
    if (!character) throw new Error("Unknown waifu: " + characterId);
    const result = this.onSuperSwingTest?.(character);
    this._setStatus("SUPER SWING // TEST FIRED");
    return result;
  }

  testVoice(characterId = this.selectedId) {
    const character = this.getCharacter?.(characterId)
      || listWaifus().find((waifu) => waifu.id === characterId);
    if (!character) throw new Error("Unknown waifu: " + characterId);
    const result = this.onVoiceTest?.(character);
    this._setStatus("VOICE // TEST FIRED");
    return result;
  }

  getPersistence() {
    return {
      version: ADMIN_STORAGE_VERSION,
      waifu_config: getConfigSnapshot(),
      infinite_scrap: this.state.infinite_scrap
    };
  }

  applyPersistence(value = {}) {
    const config = value?.waifu_config;
    if (config && Array.isArray(config.characters)) {
      applyWaifuConfig(config);
    }
    this.state.infinite_scrap = Boolean(value?.infinite_scrap);
    if (this.onInfiniteScrapChange) {
      this.onInfiniteScrapChange(this.state.infinite_scrap, true);
    }
    this._refreshSelect();
    this._loadForm();
    return this.getPersistence();
  }

  exportJson() {
    const json = exportWaifuConfigJson();
    JSON.parse(json);
    return json;
  }

  async exportCompressedFile(filename = "waifus_config.json.gz") {
    const json = this.exportJson();
    if (typeof document === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
      return json;
    }

    let blob;
    let finalName = filename;
    if (typeof CompressionStream === "function" && typeof TextEncoder === "function") {
      const stream = new CompressionStream("gzip");
      const writer = stream.writable.getWriter();
      await writer.write(new TextEncoder().encode(json));
      await writer.close();
      blob = await new Response(stream.readable).blob();
      finalName = filename.endsWith(".gz") ? filename : filename + ".gz";
    } else {
      blob = new Blob([json], { type: "application/json" });
      finalName = filename.replace(/.gz$/i, "");
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = finalName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    return json;
  }

  resetToMemoryFallback() {
    const current = getConfigSnapshot();
    const characters = current.characters.map((character) => ({
      ...character,
      assets: {
        ...character.assets
      },
      stats: {
        ...character.stats
      }
    }));
    return applyWaifuConfig({
      schema_version: 1,
      team: current.team,
      characters
    });
  }

  _applyForm() {
    if (!this.form || !this.selectedId) return null;

    const updated = updateWaifuConfig(this.selectedId, {
      assets: {
        avatar: ensureString(this.form.imageInputs.avatar.value),
        card_art: ensureString(this.form.imageInputs.card_art.value),
        cutin_art: ensureString(this.form.imageInputs.cutin_art.value)
      },
      stats: {
        power: clampStat(this.form.statInputs.power.value),
        contact: clampStat(this.form.statInputs.contact.value),
        speed: clampStat(this.form.statInputs.speed.value),
        eye: clampStat(this.form.statInputs.eye.value)
      }
    });

    this._afterCharacterUpdate(updated);
    this._persist();
    this._setStatus("CONFIG // HOT RELOADED");
    return updated;
  }

  _afterCharacterUpdate(character) {
    this.onCharacterUpdated?.(clone(character));
  }

  _persist() {
    this.saveSystem?.save?.();
  }

  _refreshSelect() {
    if (!this.form?.select) return;
    const currentId = this.selectedId;
    this.form.select.replaceChildren();
    for (const waifu of listWaifus()) {
      const option = makeElement("option", {
        value: waifu.id,
        textContent: waifu.name
      });
      option.selected = waifu.id === currentId;
      this.form.select.appendChild(option);
    }
  }

  _loadForm() {
    if (!this.form) return;
    const character = listWaifus().find((waifu) => waifu.id === this.selectedId);
    if (!character) return;

    this.form.select.value = character.id;
    this.form.imageInputs.avatar.value = character.avatarUrl;
    this.form.imageInputs.card_art.value = character.cardArtUrl;
    this.form.imageInputs.cutin_art.value = character.cutinArtUrl;
    this.form.statInputs.power.value = String(character.stats?.power ?? 0);
    this.form.statInputs.contact.value = String(character.stats?.contact ?? 0);
    this.form.statInputs.speed.value = String(character.stats?.speed ?? 0);
    this.form.statInputs.eye.value = String(character.stats?.eye ?? 0);
    this.form.infinite.checked = this.state.infinite_scrap;
  }

  _setStatus(text) {
    if (this.statusNode) this.statusNode.textContent = String(text);
  }

  _handleKeydown(event) {
    if (
      event.ctrlKey
      && event.shiftKey
      && String(event.key || "").toUpperCase() === ADMIN_HOTKEY.key
    ) {
      event.preventDefault();
      this.toggle();
    }
  }

  _handleLogoTap() {
    const now = Date.now();
    this.logoTapTimes = this.logoTapTimes.filter((timestamp) => now - timestamp <= 700);
    this.logoTapTimes.push(now);
    if (this.logoTapTimes.length >= 3) {
      this.logoTapTimes = [];
      this.open();
    }
  }
}

export function createAdminPanel(options = {}) {
  return new AdminPanel(options);
}
