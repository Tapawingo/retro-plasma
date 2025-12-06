// retroPlasma.ts

export interface DitherConfig {
    /** Enable / disable ordered dithering */
    enabled: boolean;
    /** Number of brightness levels to quantize into (2–32 is reasonable) */
    levels: number;
    /** How strong the dithering pattern is (0 = none, 1 = full Bayer pattern) */
    strength: number;
  }
  
  export interface PlasmaConfig {
    /** Base hue (degrees) */
    baseHue: number;
    /** Range of hue variation (degrees) */
    hueRange: number;
    /** Saturation (0–1) for the blobs' colors */
    saturation: number;
    /** Max lightness (0–1) for bright parts of the blobs */
    lightness: number;
    /** Speed of the plasma animation. */
    speed: number;
    /** Pixel scaling factor for resolution: <1 = higher res, >1 = lower res */
    pixelScale: number;
    /** Scale of the plasma pattern: <1 = bigger blobs, >1 = smaller blobs */
    plasmaScale: number;
    /** Value where blobs “start”. Lower = larger blobs. 0–1. */
    blobThreshold: number;
    /** How soft the falloff is: >1 = softer centers, <1 = sharper/needle. */
    blobSoftness: number;
    /** Overall brightness of the blobs (after shaping), 0–1+. */
    intensity: number;
    /** Enable / disable hue shifting over time. */
    hueShiftEnabled: boolean;
    /** Speed of hue shift (degrees per second). */
    hueShiftSpeed: number;
    /** Dithering configuration */
    dither: DitherConfig;
  }
  
  export class RetroPlasma {
    private static readonly DEFAULT_CONFIG: PlasmaConfig = {
      baseHue: 220,
      hueRange: 120,
      saturation: 0.9,
      lightness: 0.8,
      speed: 0.15,
      pixelScale: 1.0,
  
      plasmaScale: 1.0,
      blobThreshold: 0.35,
      blobSoftness: 2.0,
      intensity: 1.0,
  
      hueShiftEnabled: false,
      hueShiftSpeed: 40,
      dither: {
        enabled: true,
        levels: 6,
        strength: 1.0,
      },
    };
  
    private static readonly BAYER_4X4: number[][] = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
  
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: PlasmaConfig;
  
    private animationId: number | null = null;
    private imageData: ImageData | null = null;
    private started = false;
  
    constructor(
      canvas: HTMLCanvasElement,
      config?: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }
    ) {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('2D canvas context not supported.');
      }
  
      this.canvas = canvas;
      this.ctx = ctx;
      this.config = RetroPlasma.mergeConfig(config);
  
      this.canvas.style.display = 'block';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      (this.canvas.style as any).imageRendering = 'pixelated';
  
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener('resize', this.handleResize);
      this.handleResize();
    }
  
    /**
     * Start the animation loop.
     */
    public start(): void {
      if (this.started) return;
      this.started = true;
      const loop = (timestamp: number) => {
        if (!this.started) return;
        this.renderFrame(timestamp);
        this.animationId = window.requestAnimationFrame(loop);
      };
      this.animationId = window.requestAnimationFrame(loop);
    }
  
    /**
     * Stop the animation loop and detach listeners.
     */
    public stop(): void {
      this.started = false;
      if (this.animationId !== null) {
        window.cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      window.removeEventListener('resize', this.handleResize);
    }
  
    /**
     * Update configuration at runtime.
     * Example:
     *   plasma.updateConfig({ baseHue: 300, dither: { strength: 0.2 } });
     */
    public updateConfig(
      config: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }
    ): void {
      if (config.dither) {
        this.config.dither = {
          ...this.config.dither,
          ...config.dither,
        };
      }
  
      const { dither, ...rest } = config;
      this.config = {
        ...this.config,
        ...rest,
        dither: this.config.dither,
      };
  
      this.handleResize();
    }
  
    private static mergeConfig(
      config?: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }
    ): PlasmaConfig {
      const base = { ...this.DEFAULT_CONFIG };
      if (!config) return base;
  
      const mergedDither: DitherConfig = {
        ...base.dither,
        ...(config.dither ?? {}),
      };
  
      const { dither, ...rest } = config;
      return {
        ...base,
        ...rest,
        dither: mergedDither,
      };
    }
  
    private handleResize(): void {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
  
      const scale = this.config.pixelScale <= 0 ? 1 : this.config.pixelScale;
  
      const internalWidth = Math.max(1, Math.floor(rect.width / scale));
      const internalHeight = Math.max(1, Math.floor(rect.height / scale));
  
      if (
        this.canvas.width !== internalWidth ||
        this.canvas.height !== internalHeight
      ) {
        this.canvas.width = internalWidth;
        this.canvas.height = internalHeight;
        this.imageData = this.ctx.createImageData(internalWidth, internalHeight);
      }
    }
  
    private renderFrame(timestamp: number): void {
      if (!this.imageData) {
        this.handleResize();
        if (!this.imageData) return;
      }

      const width = this.canvas.width;
      const height = this.canvas.height;
      const data = this.imageData.data;

      const time = timestamp * 0.001 * this.config.speed;
  
      const baseHue = this.config.baseHue;
      const hueRange = this.config.hueRange;
      const saturation = this.config.saturation;
      const maxLightness = this.config.lightness;
  
      const { blobThreshold, blobSoftness, intensity } = this.config;
  
      const pulse = (Math.sin(time * 2.0) + 1) * 0.5;
  
      const hueShiftAngle = this.config.hueShiftEnabled
        ? time * this.config.hueShiftSpeed
        : 0;
  
      let index = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const v = this.computePlasmaValue(x, y, width, height, time, pulse);
  
          let blob = 0;
          if (v > blobThreshold) {
            blob = (v - blobThreshold) / (1 - blobThreshold);
          }
  
          const softness = Math.max(0.01, blobSoftness);
          blob = Math.pow(blob, softness);
  
          let brightness = RetroPlasma.clamp(blob * intensity, 0, 1);
          brightness = this.applyDither(brightness, x, y);
  
          const hue =
            (baseHue + hueRange * (brightness - 0.5) * 2 + hueShiftAngle) % 360;
  
          const lightness = brightness * maxLightness;
  
          const { r, g, b } = RetroPlasma.hslToRgb(
            hue,
            saturation,
            lightness
          );
  
          data[index++] = r;
          data[index++] = g;
          data[index++] = b;
          data[index++] = 255;
        }
      }

      this.ctx.putImageData(this.imageData, 0, 0);
    }
  
    private computePlasmaValue(
      x: number,
      y: number,
      width: number,
      height: number,
      time: number,
      pulse: number
    ): number {
      const nx = x / width;
      const ny = y / height;
  
      const cx = nx - 0.5;
      const cy = ny - 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
  
      const s = this.config.plasmaScale;
  
      let v = 0;
      v += Math.sin(nx * 10.0 * s + time * 1.3);
      v += Math.sin(ny * 10.0 * s - time * 1.7);
      v += Math.sin((nx + ny) * 8.0 * s + time * 0.7);
      v += Math.sin(dist * 20.0 * s - time * 1.1);
  
      v = v * 0.125 + 0.5;
  
      v = v * 0.7 + pulse * 0.3;
  
      return RetroPlasma.clamp(v, 0, 1);
    }
  
    private applyDither(value: number, x: number, y: number): number {
      const cfg = this.config.dither;
      if (!cfg.enabled || cfg.levels <= 1) {
        return RetroPlasma.clamp(value, 0, 1);
      }
  
      const levels = Math.max(2, Math.floor(cfg.levels));
      const clamped = RetroPlasma.clamp(value, 0, 1);
      const scaled = clamped * levels;
  
      let baseLevel = Math.floor(scaled);
      if (baseLevel >= levels) baseLevel = levels - 1;
  
      const frac = scaled - baseLevel;
  
      const bayerValue = RetroPlasma.BAYER_4X4[y & 3][x & 3];
  
      const matrixThreshold = bayerValue / 15;
  
      const strength = RetroPlasma.clamp(cfg.strength, 0, 1);
  
      const threshold = 0.5 * (1 - strength) + matrixThreshold * strength;
  
      let level = baseLevel;
      if (frac > threshold && level < levels - 1) {
        level++;
      }
  
      if (levels <= 1) return clamped;
      return level / (levels - 1);
    }
  
    private static clamp(value: number, min: number, max: number): number {
      return value < min ? min : value > max ? max : value;
    }
  
    private static hslToRgb(
      h: number,
      s: number,
      l: number
    ): { r: number; g: number; b: number } {
      const hue = (((h % 360) + 360) % 360) / 360; // 0..1
      const sat = RetroPlasma.clamp(s, 0, 1);
      const lig = RetroPlasma.clamp(l, 0, 1);
  
      if (sat === 0) {
        const v = Math.round(lig * 255);
        return { r: v, g: v, b: v };
      }
  
      const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
      const p = 2 * lig - q;
  
      const hue2rgb = (pVal: number, qVal: number, tVal: number): number => {
        let t = tVal;
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return pVal + (qVal - pVal) * 6 * t;
        if (t < 1 / 2) return qVal;
        if (t < 2 / 3) return pVal + (qVal - pVal) * (2 / 3 - t) * 6;
        return pVal;
      };
  
      const r = hue2rgb(p, q, hue + 1 / 3);
      const g = hue2rgb(p, q, hue);
      const b = hue2rgb(p, q, hue - 1 / 3);
  
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
      };
    }
  }
  
  /**
   * Convenience helper.
   */
  export function createRetroPlasma(
    canvas: HTMLCanvasElement,
    config?: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }
  ): RetroPlasma {
    return new RetroPlasma(canvas, config);
  }
  