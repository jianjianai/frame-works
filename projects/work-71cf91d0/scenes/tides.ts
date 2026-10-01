import type { Scene, SceneOptions } from "../../../src/engine/types";

// 《潮汐之间》 — 24s abstract tidal sea, Canvas 2D.
// Everything is a pure function of absolute time with fixed seeds, so any
// seek, reverse jump or offline export reconstructs the identical frame.

const TAU = Math.PI * 2;

/** Deterministic hash noise in [0,1) — no shared state, safe for re-entry. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Value noise: smooth interpolation between hash lattice points. */
function noise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

/** Layered ocean waves: sum of sines with per-octave deterministic phases. */
function waveHeight(x: number, t: number, seed: number): number {
  let sum = 0;
  sum += Math.sin(x * 1.9 + t * 0.9 + seed) * 1.0;
  sum += Math.sin(x * 3.7 - t * 1.4 + seed * 1.7) * 0.45;
  sum += Math.sin(x * 7.3 + t * 2.2 + seed * 2.3) * 0.2;
  sum += Math.sin(x * 13.9 - t * 3.1 + seed * 3.1) * 0.08;
  return sum / 1.73; // normalize roughly to [-1, 1]
}

/** Phases of the 24s film: calm rise, swell, moonrise, settle. */
function envelope(t: number): { swell: number; glow: number; dark: number } {
  const calm = Math.min(1, t / 4); // 0..1 over the first 4s
  const swell = 0.35 + 0.65 * smoothstep(3, 9, t) * (1 - 0.4 * smoothstep(18, 23, t));
  const glow = 0.25 + 0.75 * smoothstep(4, 10, t) * (1 - 0.55 * smoothstep(19, 24, t));
  const dark = 1 - 0.35 * smoothstep(19, 24, t);
  return { swell: swell * calm, glow: glow * calm, dark };
}

function smoothstep(a: number, b: number, x: number): number {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

const MOON_START = 12; // moonrise at 12s
const MOON_END = 18;

export function createScene(options: SceneOptions): Scene {
  const width = options.width;
  const height = options.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const sea = (
    t: number,
    yBase: number,
    amp: number,
    seed: number,
    fill: string | CanvasGradient,
  ) => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    const step = 8;
    for (let x = 0; x <= width + step; x += step) {
      const h = waveHeight(x / width * 6, t, seed);
      ctx.lineTo(x, yBase * height + h * amp * height);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const render = (time: number) => {
    const t = time;
    const { swell, glow, dark } = envelope(t);

    // --- sky gradient, darkened toward the end ---
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.62);
    const night = Math.round(10 + 14 * (1 - dark));
    sky.addColorStop(0, `rgb(${night},${night + 4},${night + 12})`);
    sky.addColorStop(1, `rgb(${night + 24},${night + 34},${night + 52})`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // --- stars (deterministic, fade in during calm, dim in glow) ---
    const starCount = 140;
    const starAlpha = 0.5 * (1 - glow * 0.7) * dark;
    for (let i = 0; i < starCount; i++) {
      const sx = hash(i * 1.37) * width;
      const sy = hash(i * 2.71 + 5) * height * 0.5;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i) * 1.4) + i);
      const r = 0.6 + hash(i * 3.1) * 1.4;
      ctx.globalAlpha = starAlpha * (0.3 + 0.7 * tw);
      ctx.fillStyle = "#cfe0ff";
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- moon: rises between 12s and 18s ---
    const rise = smoothstep(MOON_START, MOON_END, t);
    if (rise > 0) {
      const mx = width * 0.72;
      const my = height * (0.58 - 0.42 * rise);
      const mr = width * 0.045;
      const halo = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
      halo.addColorStop(0, `rgba(220,228,255,${0.28 * rise})`);
      halo.addColorStop(1, "rgba(220,228,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
      const body = ctx.createRadialGradient(
        mx - mr * 0.3, my - mr * 0.3, mr * 0.2, mx, my, mr,
      );
      body.addColorStop(0, "#f4f6ff");
      body.addColorStop(1, "#c9d4ee");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, TAU);
      ctx.fill();
    }

    // --- horizon glow band ---
    const glowY = height * 0.52;
    const band = ctx.createLinearGradient(0, glowY - height * 0.06, 0, glowY + height * 0.08);
    band.addColorStop(0, "rgba(120,170,200,0)");
    band.addColorStop(0.5, `rgba(150,200,225,${0.16 * glow + 0.05})`);
    band.addColorStop(1, "rgba(120,170,200,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, glowY - height * 0.06, width, height * 0.14);

    // --- sea base ---
    const seaTop = height * 0.52;
    const seaGrad = ctx.createLinearGradient(0, seaTop, 0, height);
    seaGrad.addColorStop(0, `rgb(${Math.round(18 * dark)},${Math.round(40 * dark)},${Math.round(58 * dark)})`);
    seaGrad.addColorStop(1, `rgb(${Math.round(5 * dark)},${Math.round(12 * dark)},${Math.round(22 * dark)})`);
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, seaTop - height * 0.02, width, height);

    // --- three wave layers, back to front ---
    const layers = [
      { yb: 0.56, amp: 0.016, seed: 1.3, depth: 0.55 },
      { yb: 0.66, amp: 0.03, seed: 4.1, depth: 0.8 },
      { yb: 0.8, amp: 0.05, seed: 7.9, depth: 1.15 },
    ];
    for (const L of layers) {
      const yBase = L.yb + (1 - swell) * 0.03;
      const amp = L.amp * (0.5 + swell * 0.9);
      // crest highlight gradient
      const g = ctx.createLinearGradient(0, (yBase - amp * 2) * height, 0, (yBase + amp * 3) * height);
      const top = 90 + 60 * glow;
      g.addColorStop(0, `rgba(${Math.round(top * L.depth)},${Math.round(170 * L.depth)},${Math.round(190 * L.depth)},${0.5 * glow + 0.12})`);
      g.addColorStop(1, "rgba(10,30,50,0)");
      sea(t, yBase, amp, L.seed, g);
      // moon glitter path on the front layer
      if (rise > 0 && L.depth > 1) {
        const mx = width * 0.72;
        ctx.save();
        ctx.globalAlpha = 0.5 * rise;
        for (let i = 0; i < 26; i++) {
          const p = i / 25;
          const gy = seaTop + p * (height - seaTop) * 0.9;
          const spread = 20 + p * width * 0.11;
          const gx = mx + (noise(t * 0.7 + i) - 0.5) * spread * 2;
          const gw = spread * (0.5 + 0.5 * noise(i * 3.3 + t * 0.4));
          ctx.fillStyle = "rgba(210,225,250,0.16)";
          ctx.fillRect(gx - gw / 2, gy, gw, 2.2);
        }
        ctx.restore();
      }
    }

    // --- spray particles on big swells (deterministic) ---
    const sprayN = Math.floor(60 * swell);
    for (let i = 0; i < sprayN; i++) {
      const px = hash(i * 5.13) * width;
      const ph = hash(i * 7.77);
      const y = height * (0.6 + ph * 0.25) + waveHeight((px / width) * 6, t, 7.9) * height * 0.05;
      const lift = Math.abs(Math.sin(t * (1 + ph) + i)) * 8 * swell;
      ctx.globalAlpha = 0.25 * swell * (0.4 + 0.6 * hash(i * 9.1));
      ctx.fillStyle = "#dceaf5";
      ctx.beginPath();
      ctx.arc(px, y - lift, 1 + hash(i * 2.2) * 1.8, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- final vignette ---
    const vig = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.45,
      width / 2, height / 2, height * 0.95,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, `rgba(0,0,5,${0.35 * dark})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  };

  return {
    canvas,
    render(time) {
      render(time);
    },
    dispose() {
      // single canvas, no external resources
    },
  };
}
