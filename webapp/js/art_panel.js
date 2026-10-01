import {
  CHARACTER_ART_STATUSES,
  getCharacterArtBinding,
  saveLocalArtDraft,
  clearLocalArtDraft
} from "./character_art_registry.js";

function el(tag, props = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "textContent") node.textContent = String(value);
    else if (key === "className") node.className = String(value);
    else node[key] = value;
  }
  return node;
}

function revoke(url) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export class ArtPanel {
  constructor({
    root = typeof document !== "undefined" ? document.body : null,
    getCharacters = () => [],
    getCharacter = (id) => getCharacters().find((item) => item?.character_id === id) || null,
    storage = typeof globalThis !== "undefined" ? globalThis.localStorage : null
  } = {}) {
    this.root = root;
    this.getCharacters = getCharacters;
    this.getCharacter = getCharacter;
    this.storage = storage;
    this.selectedId = null;
    this.selectedFile = null;
    this.previewUrl = "";
    this.modal = null;
    this.statusNode = null;
    this.metaNode = null;
    this.lightImage = null;
    this.darkImage = null;
    this.previewState = "NOT_LOADED";
    this.previewDimensions = null;
  }

  mount() {
    if (this.modal || !this.root || typeof document === "undefined") return this.modal;
    const overlay = el("div", { className: "art-panel-overlay" });
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");

    const modal = el("section", { className: "art-panel-modal" });
    const header = el("header", { className: "art-panel-header" });
    const title = el("div");
    title.append(
      el("span", { className: "art-panel-kicker", textContent: "INTERNAL PRODUCTION TOOL" }),
      el("h2", { textContent: "ART PANEL" })
    );
    const close = el("button", { className: "art-panel-close", type: "button", textContent: "CLOSE" });
    close.addEventListener("click", () => this.close());
    header.append(title, close);

    const notice = el("div", {
      className: "art-panel-notice",
      textContent: "LOCAL ART INPUT is browser-only. Selection never uploads to GitHub and never marks APPROVED."
    });

    const controls = el("div", { className: "art-panel-controls" });
    const characterLabel = el("label", { className: "art-panel-field" });
    characterLabel.append(el("span", { textContent: "CHARACTER" }));
    const select = el("select", { id: "art-panel-character-select", name: "character" });
    select.addEventListener("change", () => {
      this.selectedId = select.value;
      this._resetLocalSelection();
      this._refreshCharacter();
    });
    characterLabel.append(select);

    const fileLabel = el("label", { className: "art-panel-field" });
    fileLabel.append(el("span", { textContent: "LOCAL ART // PNG / JPG / JPEG / SVG" }));
    const input = el("input", {
      id: "art-panel-file-input",
      type: "file",
      accept: "image/png,image/jpeg,image/jpg,image/svg+xml"
    });
    input.addEventListener("change", () => this._handleFile(input.files?.[0] || null));
    fileLabel.append(input);
    controls.append(characterLabel, fileLabel);

    const identity = el("div", { className: "art-panel-identity" });
    this.metaNode = identity;

    const previews = el("div", { className: "art-panel-previews" });
    const light = el("article", { className: "art-panel-preview art-panel-preview-light" });
    light.append(el("span", { textContent: "LIGHT PREVIEW" }));
    const lightStage = el("div", { className: "art-panel-preview-stage" });
    const lightImg = el("img", { alt: "Light background character art preview", decoding: "async" });
    lightStage.append(lightImg);
    light.append(lightStage);

    const dark = el("article", { className: "art-panel-preview art-panel-preview-dark" });
    dark.append(el("span", { textContent: "DARK PREVIEW" }));
    const darkStage = el("div", { className: "art-panel-preview-stage" });
    const darkImg = el("img", { alt: "Dark background character art preview", decoding: "async" });
    darkStage.append(darkImg);
    dark.append(darkStage);
    previews.append(light, dark);
    this.lightImage = lightImg;
    this.darkImage = darkImg;

    const pipeline = el("div", { className: "art-panel-pipeline" });
    pipeline.append(
      el("div", { textContent: "LOCAL ART" }),
      el("div", { textContent: "PROJECT ASSET" }),
      el("div", { textContent: "APPROVAL" }),
      el("strong", { textContent: "LOCAL INPUT → PROJECT FILE → EXPLICIT APPROVED MANIFEST" })
    );

    const status = el("div", { className: "art-panel-status", role: "status", "aria-live": "polite" });
    this.statusNode = status;
    const actionRow = el("div", { className: "art-panel-actions" });
    const associate = el("button", {
      className: "art-panel-button art-panel-button-primary",
      type: "button",
      textContent: "SAVE LOCAL DRAFT"
    });
    associate.addEventListener("click", () => this.associateAsset());
    const clear = el("button", {
      className: "art-panel-button",
      type: "button",
      textContent: "CLEAR LOCAL DRAFT"
    });
    clear.addEventListener("click", () => this.clearDraft());
    actionRow.append(associate, clear);

    modal.append(header, notice, controls, identity, previews, pipeline, status, actionRow);
    overlay.append(modal);
    this.root.append(overlay);
    this.modal = overlay;
    this._refreshCharacters();
    return overlay;
  }

  open(characterId = this.selectedId) {
    if (!this.modal) this.mount();
    if (!this.modal) return false;
    this._refreshCharacters();
    const ids = [...this.modal.querySelectorAll("select option")].map((option) => option.value);
    this.selectedId = ids.includes(String(characterId || "")) ? String(characterId) : (ids[0] || null);
    const select = this.modal.querySelector("#art-panel-character-select");
    if (select) select.value = this.selectedId || "";
    this._resetLocalSelection();
    this._refreshCharacter();
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

  isOpen() {
    return Boolean(this.modal && !this.modal.hidden);
  }

  getBinding(characterId = this.selectedId) {
    return getCharacterArtBinding(characterId, { storage: this.storage });
  }

  associateAsset() {
    if (!this.selectedId || !this.selectedFile || !this.previewUrl || this.previewState !== "LOADED") {
      this._setStatus("SELECT AN IMAGE AND WAIT FOR PREVIEW LOADED");
      return null;
    }
    const binding = saveLocalArtDraft(this.selectedId, {
      filename: this.selectedFile.name,
      mime: this.selectedFile.type || "image/*",
      width: this.previewDimensions?.width || null,
      height: this.previewDimensions?.height || null,
      source: "LOCAL ART INPUT",
      local_preview: this.previewUrl
    }, { storage: this.storage });
    this._setStatus("DRAFT SAVED LOCALLY // PROJECT ASSET UNCHANGED // NOT APPROVED");
    this._refreshCharacter();
    return binding;
  }

  clearDraft() {
    if (!this.selectedId) return;
    clearLocalArtDraft(this.selectedId, { storage: this.storage });
    this._setStatus("LOCAL ART DRAFT CLEARED");
    this._refreshCharacter();
    this._resetLocalSelection();
  }

  _refreshCharacters() {
    const select = this.modal?.querySelector("#art-panel-character-select");
    if (!select) return;
    const characters = this.getCharacters().filter((item) => item?.character_id);
    select.replaceChildren();
    for (const character of characters) {
      select.append(el("option", {
        value: String(character.character_id),
        textContent: String(character.canonical?.display_name || character.character_id)
      }));
    }
    if (!this.selectedId && characters[0]) this.selectedId = String(characters[0].character_id);
    if (this.selectedId) select.value = this.selectedId;
  }

  _refreshCharacter() {
    if (!this.selectedId) return;
    const character = this.getCharacter(this.selectedId);
    const canonical = character?.canonical || {};
    const binding = this.getBinding(this.selectedId);
    const localDraft = binding.local_draft || (!binding.project_asset && binding.status === "DRAFT" ? binding : null);

    if (this.metaNode) {
      this.metaNode.innerHTML = "";
      const rows = [
        ["character_id", this.selectedId],
        ["display_name", canonical.display_name || this.selectedId],
        ["LOCAL ART", localDraft?.filename || "NONE"],
        ["PROJECT ASSET", binding.project_asset ? binding.runtime_path : "MISSING"],
        ["APPROVAL", binding.status]
      ];
      if (binding.width && binding.height) rows.push(["dimensions", binding.width + " × " + binding.height]);
      for (const [label, value] of rows) {
        const row = el("div", { className: "art-panel-meta-row" });
        row.append(el("span", { textContent: label }), el("strong", { textContent: value }));
        this.metaNode.append(row);
      }
    }

    if (binding.status === "APPROVED") {
      this._setStatus("APPROVED // PROJECT ASSET IS THE RUNTIME AUTHORITY");
    } else if (binding.status === "PROCESSED") {
      this._setStatus("PROCESSED // PROJECT ASSET EXISTS // APPROVAL REQUIRED");
    } else if (binding.status === "DRAFT") {
      this._setStatus("DRAFT // LOCAL FILE ONLY // NOT A PROJECT ASSET");
    } else {
      this._setStatus("MISSING // NO APPROVED PROJECT ASSET");
    }
  }

  _handleFile(file) {
    this._resetLocalSelection();
    if (!file) return;
    const type = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(type);
    const extensionAllowed = /\.(png|jpe?g|svg)$/i.test(name);
    if (!allowed && !extensionAllowed) {
      this._setStatus("INVALID FORMAT // PNG OR JPG/JPEG REQUIRED");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      this._setStatus("FILE TOO LARGE // MAX 15 MB");
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.previewState = "LOADING";
    const onLoad = () => {
      if (!this.previewUrl) return;
      this.previewDimensions = {
        width: this.lightImage.naturalWidth || 0,
        height: this.lightImage.naturalHeight || 0
      };
      this.previewState = "LOADED";
      this._setStatus(
        "PREVIEW LOADED // " +
        this.previewDimensions.width + " × " + this.previewDimensions.height +
        " // LOCAL ART // DRAFT ONLY"
      );
    };
    this.lightImage.onload = onLoad;
    this.darkImage.onload = onLoad;
    this.lightImage.onerror = () => {
      this.previewState = "ERROR";
      this._setStatus("PREVIEW FAILED // SOURCE FILE NOT READ");
    };
    this.darkImage.onerror = () => {
      this.previewState = "ERROR";
      this._setStatus("DARK PREVIEW FAILED // SOURCE FILE NOT READ");
    };
    this.lightImage.src = this.previewUrl;
    this.darkImage.src = this.previewUrl;
  }

  _resetLocalSelection() {
    revoke(this.previewUrl);
    this.previewUrl = "";
    this.selectedFile = null;
    this.previewState = "NOT_LOADED";
    this.previewDimensions = null;
    if (this.lightImage) this.lightImage.removeAttribute("src");
    if (this.darkImage) this.darkImage.removeAttribute("src");
  }

  _setStatus(text) {
    if (this.statusNode) this.statusNode.textContent = String(text);
  }
}

export function createArtPanel(options = {}) {
  return new ArtPanel(options);
}

export { CHARACTER_ART_STATUSES };
