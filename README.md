# RetroPlasma
*Dithered Plasma Background*

A tiny, dependency-free **TypeScript** library for creating animated, **dithered plasma backgrounds** in the browser.

- Pure TS, no runtime dependencies
- Configurable hue, brightness, blob size & dithering
- Great as a background for hero sections, landing pages, and visual experiments
- Ships as an ES module + UMD build

---

## Demo

**[Live Demo →](https://tapawingo.github.io/retro-plasma/)**

After cloning the repo:

```bash
npm install
npm run dev
```

Then open the printed URL (usually `http://localhost:5173`) to see the live plasma demo.

## Installation

For now, you can install directly from the repo or copy the `src/retroPlasma.ts` file into your project.

If/when published to npm, usage would look like:
```bash
npm install retroPlasma
```

```ts
import {
  createRetroPlasma,
  PlasmaConfig,
} from "retroPlasma";
```

## Quick start

Minimal HTML:
```html
<canvas id="plasma"></canvas>

<style>
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: black;
  }

  #plasma {
    position: fixed;
    inset: 0;
    z-index: -1;
  }
</style>
```

TypeScript:
```ts
import {
  createRetroPlasma,
  PlasmaConfig,
} from "./retroPlasma";

const canvas = document.getElementById("plasma") as HTMLCanvasElement;

const config: Partial<PlasmaConfig> = {
  baseHue: 149,           // green
  hueRange: 0,            // no hue wobble
  saturation: 1.0,
  lightness: 0.2,         // max brightness for blobs

  speed: 0.1,
  pixelScale: 2,          // internal resolution (higher => more pixelated & faster)

  plasmaScale: 0.5,       // <1 = bigger blobs, >1 = smaller blobs
  blobThreshold: 0.25,    // lower = more area lights up
  blobSoftness: 2.5,      // >1 = softer, fatter peaks
  intensity: 0.7,         // overall brightness of blobs

  hueShiftEnabled: false, // stay green
  hueShiftSpeed: 20,      // used only if hueShiftEnabled = true

  dither: {
    enabled: true,
    levels: 6,
    strength: 1.0,
  },
};

const plasma = createRetroPlasma(canvas, config);
plasma.start();
```

## API
`createRetroPlasma(canvas, config?)`

Creates and returns an instance of `RetroPlasma`.

```ts
export function createRetroPlasma(
  canvas: HTMLCanvasElement,
  config?: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }
): RetroPlasma;
```

`class RetroPlasma`
Methods:

- `start(): void`<br/>Start the animation loop.

- `stop(): void`<br/>Stop the animation loop and remove the resize listener.

- `updateConfig(config: Partial<PlasmaConfig> & { dither?: Partial<DitherConfig> }): void`<br/>Update config at runtime (e.g. sliders, UI controls).

## Configuration
`PlasmaConfig`
```ts
export interface PlasmaConfig {
  // Color
  baseHue: number;          // 0–360, degrees on color wheel
  hueRange: number;         // how far to swing around baseHue
  saturation: number;       // 0–1
  lightness: number;        // 0–1, max lightness for bright blobs

  // Animation
  speed: number;            // overall animation speed
  pixelScale: number;       // internal resolution scale (>1 = more pixelated)

  // Plasma / blob shaping
  plasmaScale: number;      // <1 = bigger blobs, >1 = smaller blobs
  blobThreshold: number;    // 0–1, lower => more area lights up
  blobSoftness: number;     // >1 = softer peaks, <1 = sharper peaks
  intensity: number;        // overall blob brightness multiplier

  // Hue shifting
  hueShiftEnabled: boolean; // rotate hue over time?
  hueShiftSpeed: number;    // degrees per second of hue rotation

  // Dithering
  dither: DitherConfig;
}

export interface DitherConfig {
  enabled: boolean; // turn ordered dithering on/off
  levels: number;   // brightness quantization levels (2–32)
  strength: number; // 0 = no pattern, 1 = full Bayer pattern
}
```

You never have to provide the full config. Everything is optional when using `createRetroPlasma` or `updateConfig`. Sensible defaults are applied under the hood.

## Development
Clone the repo and run:
```bash
npm install
npm run dev
```

To build the library:
```bash
npm run build
```

This produces a `dist/` folder containing ES and UMD builds.

You can also run:
```bash
npm run preview
```
to serve the built demo.