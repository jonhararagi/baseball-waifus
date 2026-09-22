const DEFAULT_TARGET_FPS = 60;
const LOW_END_FPS = 30;

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export class PerformanceAdapter {
  constructor({
    navigatorRef = null,
    windowRef = null,
    lowEnd = null,
    sampleSize = 24
  } = {}) {
    this.navigator = navigatorRef || globalThis?.navigator || null;
    this.window = windowRef || globalThis?.window || null;
    const hardwareConcurrency = Math.max(1, Math.floor(finiteNumber(this.navigator?.hardwareConcurrency, 4)));
    const deviceMemory = finiteNumber(this.navigator?.deviceMemory, 4);
    this.hardwareConcurrency = hardwareConcurrency;
    this.deviceMemory = deviceMemory;
    this.lowEnd = lowEnd == null
      ? hardwareConcurrency <= 4 || deviceMemory <= 4
      : Boolean(lowEnd);

    this.sampleSize = Math.max(8, Math.floor(Number(sampleSize) || 24));
    this.targetFps = this.lowEnd ? LOW_END_FPS : DEFAULT_TARGET_FPS;
    this.frameInterval = 1000 / this.targetFps;
    this.lastRenderedAt = 0;
    this.renderDeltas = [];
    this.particleScale = this.lowEnd ? 0.4 : 1;
  }

  getTargetFps() {
    return this.targetFps;
  }

  setTargetFps(fps) {
    this.targetFps = Number(fps) <= LOW_END_FPS ? LOW_END_FPS : DEFAULT_TARGET_FPS;
    this.frameInterval = 1000 / this.targetFps;
    return this.targetFps;
  }

  shouldRender(timestamp) {
    const now = finiteNumber(timestamp, 0);
    if (!this.lastRenderedAt) {
      this.lastRenderedAt = now;
      return true;
    }

    const delta = now - this.lastRenderedAt;
    if (delta < this.frameInterval) return false;

    this.lastRenderedAt = now;
    this._recordRenderDelta(delta);
    return true;
  }

  getParticleBudget(baseCount = 28) {
    const base = Math.max(0, Math.floor(Number(baseCount) || 0));
    return Math.max(4, Math.floor(base * this.particleScale));
  }

  getStatus() {
    return {
      low_end: this.lowEnd,
      hardware_concurrency: this.hardwareConcurrency,
      device_memory: this.deviceMemory,
      target_fps: this.targetFps,
      particle_scale: this.particleScale
    };
  }

  _recordRenderDelta(delta) {
    this.renderDeltas.push(delta);
    if (this.renderDeltas.length > this.sampleSize) {
      this.renderDeltas.shift();
    }

    if (this.lowEnd || this.renderDeltas.length < Math.min(this.sampleSize, 12)) {
      return;
    }

    const average = this.renderDeltas.reduce((sum, value) => sum + value, 0) / this.renderDeltas.length;
    if (average > 24) {
      this.setTargetFps(LOW_END_FPS);
      this.particleScale = 0.6;
    } else if (average < 16 && this.targetFps === LOW_END_FPS) {
      this.setTargetFps(DEFAULT_TARGET_FPS);
      this.particleScale = 1;
    }
  }
}

export { DEFAULT_TARGET_FPS, LOW_END_FPS };
