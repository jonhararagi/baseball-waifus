const VIEWS = Object.freeze(["combat", "roster", "gacha", "dex", "settings"]);

export class MainMenu {
  constructor({
    root = null,
    onNavigate = null,
    onModeChange = null,
    onBiomeChange = null
  } = {}) {
    this.root = root;
    this.onNavigate = onNavigate;
    this.onModeChange = onModeChange;
    this.onBiomeChange = onBiomeChange;
    this.activeView = "combat";
    this.mode = "PRACTICE";
    this.biome = "cyberpunk";
  }

  mount() {
    if (!this.root || typeof document === "undefined") return this;
    this.root.replaceChildren();
    for (const view of VIEWS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "main-menu-button";
      button.dataset.view = view;
      button.textContent = view.toUpperCase();
      button.addEventListener("click", () => this.navigate(view));
      this.root.appendChild(button);
    }
    this._renderActive();
    return this;
  }

  navigate(view) {
    const normalized = VIEWS.includes(String(view)) ? String(view) : "combat";
    this.activeView = normalized;
    this._renderActive();
    this.onNavigate?.(normalized);
    return normalized;
  }

  setMode(mode) {
    this.mode = String(mode || "PRACTICE").toUpperCase();
    this.onModeChange?.(this.mode);
    return this.mode;
  }

  setBiome(biome) {
    this.biome = String(biome || "cyberpunk").toLowerCase();
    this.onBiomeChange?.(this.biome);
    return this.biome;
  }

  _renderActive() {
    const buttons = this.root?.querySelectorAll?.("[data-view]") || [];
    for (const button of buttons) {
      const active = button.dataset.view === this.activeView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
  }
}

export { VIEWS };
