/**
 * Central catalog and renderer for visual stadium biomes.
 * Combat logic remains independent from these presentation settings.
 */
export const AREA_THEMES = Object.freeze({
  cyberpunk: Object.freeze({
    id: "cyberpunk",
    name: "Sector Neón 01",
    bgParallax: "./assets/stadiums/cyber_city_bg.png",
    groundTexture: "./assets/stadiums/cyber_dirt.png",
    groundColor: "#0b0b1a",
    pitcherSprite: "./assets/characters/pitcher_android.png",
    catcherSprite: "./assets/characters/catcher_cyber.png",
    strikeZoneColor: "#00f0ff",
    particleColor: "rgba(0, 240, 255, 0.6)",
    pitcherBlur: 3
  }),
  beach: Object.freeze({
    id: "beach",
    name: "Playa Paraíso",
    bgParallax: "./assets/stadiums/beach_resort_bg.png",
    groundTexture: "./assets/stadiums/sand_field.png",
    groundColor: "#e3c28d",
    pitcherSprite: "./assets/characters/pitcher_summer.png",
    catcherSprite: "./assets/characters/catcher_beach.png",
    strikeZoneColor: "#ff007f",
    particleColor: "rgba(255, 255, 255, 0.7)",
    pitcherBlur: 2
  }),
  volcano: Object.freeze({
    id: "volcano",
    name: "Infierno de Magma",
    bgParallax: "./assets/stadiums/volcano_bg.png",
    groundTexture: "./assets/stadiums/volcanic_ash.png",
    groundColor: "#1f0a05",
    pitcherSprite: "./assets/characters/pitcher_fire.png",
    catcherSprite: "./assets/characters/catcher_volcano.png",
    strikeZoneColor: "#ff4500",
    particleColor: "rgba(255, 69, 0, 0.8)",
    pitcherBlur: 4
  }),
  forest: Object.freeze({
    id: "forest",
    name: "Bosque Bioluminiscente",
    bgParallax: "./assets/stadiums/forest_bg.png",
    groundTexture: "./assets/stadiums/moss_field.png",
    groundColor: "#091c13",
    pitcherSprite: "./assets/characters/pitcher_forest.png",
    catcherSprite: "./assets/characters/catcher_forest.png",
    strikeZoneColor: "#39ff14",
    particleColor: "rgba(115, 255, 0, 0.6)",
    pitcherBlur: 3
  })
});

function getImageFactory(imageFactory) {
  if (typeof imageFactory === "function") return imageFactory;
  if (typeof Image !== "undefined") return () => new Image();
  return null;
}

export class AreaThemeManager {
  constructor(defaultAreaId = "cyberpunk", { imageFactory = null } = {}) {
    this.imageCache = new Map();
    this.failedAssets = new Set();
    this.imageFactory = getImageFactory(imageFactory);
    this.currentTheme = AREA_THEMES[defaultAreaId] || AREA_THEMES.cyberpunk;
    void this.preloadTheme(this.currentTheme);
  }

  setArea(areaId) {
    const normalizedId = String(areaId || "").toLowerCase();
    if (!AREA_THEMES[normalizedId]) {
      return this.currentTheme;
    }

    this.currentTheme = AREA_THEMES[normalizedId];
    void this.preloadTheme(this.currentTheme);
    return this.currentTheme;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  async preloadTheme(theme = this.currentTheme) {
    if (!theme || !this.imageFactory) return [];

    const assets = [
      theme.bgParallax,
      theme.groundTexture,
      theme.pitcherSprite,
      theme.catcherSprite
    ].filter(Boolean);

    return Promise.all(assets.map((src) => this._loadImage(src)));
  }

  _loadImage(src) {
    const path = String(src || "");
    if (!path || this.imageCache.has(path) || this.failedAssets.has(path)) {
      return Promise.resolve(this.imageCache.get(path) || null);
    }

    return new Promise((resolve) => {
      try {
        const image = this.imageFactory();
        if (!image) {
          resolve(null);
          return;
        }

        image.decoding = "async";
        image.onload = () => {
          this.imageCache.set(path, image);
          resolve(image);
        };
        image.onerror = () => {
          this.failedAssets.add(path);
          resolve(null);
        };
        image.src = path;
      } catch {
        this.failedAssets.add(path);
        resolve(null);
      }
    });
  }

  getImage(src) {
    return this.imageCache.get(String(src || "")) || null;
  }

  renderBackground(ctx, width, height, cameraOffsetY = 0) {
    const theme = this.currentTheme;
    const bgImg = this.getImage(theme.bgParallax);
    const backgroundHeight = height * 0.6;

    if (bgImg) {
      ctx.drawImage(bgImg, 0, cameraOffsetY * 0.15, width, backgroundHeight);
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, backgroundHeight);
    grad.addColorStop(0, theme.groundColor);
    grad.addColorStop(1, "#050508");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, backgroundHeight);
  }

  renderGround(ctx, width, height, cameraOffsetY = 0) {
    const theme = this.currentTheme;
    const groundImg = this.getImage(theme.groundTexture);
    const groundStartY = height * 0.52 + cameraOffsetY;
    const groundHeight = height * 0.48;

    if (groundImg) {
      ctx.drawImage(groundImg, 0, groundStartY, width, groundHeight);
      return;
    }

    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, groundStartY, width, groundHeight);
  }

  renderPitcher(ctx, x, y, width, height) {
    const theme = this.currentTheme;
    const pitcherImg = this.getImage(theme.pitcherSprite);

    ctx.save();
    ctx.filter = "blur(" + Math.max(0, Number(theme.pitcherBlur) || 0) + "px)";

    if (pitcherImg) {
      ctx.drawImage(
        pitcherImg,
        x - width / 2,
        y - height / 2,
        width,
        height
      );
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(x, y, width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getStrikeZoneColor() {
    return this.currentTheme.strikeZoneColor;
  }

  getParticleColor() {
    return this.currentTheme.particleColor;
  }
}
