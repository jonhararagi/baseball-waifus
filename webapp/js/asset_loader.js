import { getArchetypeColor } from "./waifu_database.js";

const DEFAULT_TIMEOUT_MS = 8000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

function normalizeColor(value) {
  const color = String(value || "#00f0ff").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#00f0ff";
}

export function isHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createPlaceholderSvg({
  label = "WAIFU",
  color = "#00f0ff",
  secondary = "#0b0b14",
  size = 512
} = {}) {
  const safeColor = normalizeColor(color);
  const safeSecondary = normalizeColor(secondary);
  const safeLabel = String(label || "WAIFU")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 32);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${safeColor}"/>
        <stop offset="1" stop-color="${safeSecondary}"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="10" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" fill="#070a12"/>
    <circle cx="${size / 2}" cy="${size * 0.38}" r="${size * 0.2}" fill="url(#g)" filter="url(#glow)"/>
    <path d="M${size * 0.22} ${size * 0.88} Q${size * 0.5} ${size * 0.5} ${size * 0.78} ${size * 0.88}" fill="url(#g)" opacity=".8"/>
    <rect x="${size * 0.06}" y="${size * 0.06}" width="${size * 0.88}" height="${size * 0.88}" rx="${size * 0.04}" fill="none" stroke="${safeColor}" stroke-width="${Math.max(3, size * 0.014)}"/>
    <text x="50%" y="95%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="${Math.max(18, size * 0.065)}" font-weight="900">${safeLabel}</text>
  </svg>`;
}

export function toDataUri(svg) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(String(svg || ""));
}

function createImage(ImageCtor) {
  if (typeof ImageCtor === "function") return new ImageCtor();
  if (typeof globalThis !== "undefined" && typeof globalThis.Image === "function") {
    return new globalThis.Image();
  }
  throw new Error("Image constructor unavailable");
}

function setCrossOrigin(image) {
  if (image && "crossOrigin" in image) {
    image.crossOrigin = "anonymous";
  }
}

function waitForLoad(image, timeoutMs) {
  if (image.complete && (image.naturalWidth || image.width)) {
    return Promise.resolve(image);
  }

  if (typeof image.addEventListener !== "function") {
    return Promise.reject(new Error("Image object has no event API"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      finish(reject, new Error("IMAGE_LOAD_TIMEOUT"));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      image.removeEventListener?.("load", onLoad);
      image.removeEventListener?.("error", onError);
      image.removeEventListener?.("abort", onError);
    };

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };

    const onLoad = () => finish(resolve, image);
    const onError = () => finish(reject, new Error("IMAGE_LOAD_FAILED"));

    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", onError, { once: true });
    image.addEventListener("abort", onError, { once: true });
  });
}

export class AssetLoader {
  constructor({
    ImageCtor = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = null
  } = {}) {
    this.ImageCtor = ImageCtor;
    this.timeoutMs = Math.max(250, Number(timeoutMs) || DEFAULT_TIMEOUT_MS);
    this.cache = cache || new Map();
  }

  async load(url, {
    label = "WAIFU",
    archetype = "DEFAULT",
    color = null,
    fallbackColor = null,
    timeoutMs = this.timeoutMs
  } = {}) {
    const sourceUrl = String(url || "");
    const key = sourceUrl + "::" + String(label || "");
    const cached = this.cache.get(key);
    if (cached) return cached;

    const image = createImage(this.ImageCtor);
    setCrossOrigin(image);

    try {
      if (!isHttpsUrl(sourceUrl) && !sourceUrl.startsWith("data:")) {
        throw new Error("IMAGE_URL_MUST_BE_HTTPS_OR_DATA");
      }

      image.decoding = "async";
      image.src = sourceUrl;
      await waitForLoad(image, clamp(timeoutMs, 250, 30000));
      const result = {
        image,
        url: sourceUrl,
        fallback: false
      };
      this.cache.set(key, result);
      return result;
    } catch {
      const fallback = this._buildFallback({
        label,
        archetype,
        color: color || getArchetypeColor(archetype),
        fallbackColor
      });
      this.cache.set(key, fallback);
      return fallback;
    }
  }

  attach(imageElement, url, options = {}) {
    if (!imageElement || typeof imageElement !== "object") {
      return Promise.resolve({
        fallback: true,
        url: ""
      });
    }

    setCrossOrigin(imageElement);

    return this.load(url, options).then((result) => {
      setCrossOrigin(imageElement);
      imageElement.src = result.image?.src || result.url;
      imageElement.dataset.fallback = result.fallback ? "true" : "false";
      return result;
    });
  }

  _buildFallback({
    label,
    archetype,
    color = null,
    fallbackColor = "#0b0b14"
  } = {}) {
    const svg = createPlaceholderSvg({
      label,
      color: color || getArchetypeColor(archetype),
      secondary: fallbackColor
    });
    const dataUri = toDataUri(svg);
    const image = createImage(this.ImageCtor);
    setCrossOrigin(image);
    image.src = dataUri;
    image.decoding = "async";

    return {
      image,
      url: dataUri,
      fallback: true
    };
  }
}

export function createAssetLoader(options = {}) {
  return new AssetLoader(options);
}

export { DEFAULT_TIMEOUT_MS };
