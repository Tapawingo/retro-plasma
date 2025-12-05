import { createRetroPlasma } from './retroPlasma';

const canvas = document.getElementById('plasma') as HTMLCanvasElement;

const plasma = createRetroPlasma(canvas, {
  baseHue: 143,
  hueRange: 0,
  saturation: 1.0,
  lightness: 0.2,
  speed: 0.1,
  pixelScale: 2.0,
  plasmaScale: 0.5,
  blobThreshold: 0.25,
  blobSoftness: 2.5,
  intensity: 0.7,
  hueShiftEnabled: false,
  hueShiftSpeed: 20,
  dither: {
    enabled: true,
    levels: 6,
    strength: 1.0,
  },
});

plasma.start();

(window as any).plasma = plasma;