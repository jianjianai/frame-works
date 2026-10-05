import type { Scene, SceneOptions } from "../../../../src/engine/types";
import { assetUrl } from "../../../../src/engine/types";
import { clamp } from "../../../../src/engine/math";

/** Design space: everything is drawn in 1080×1920 units and scaled to the real canvas. */
export const W = 1080;
export const H = 1920;
export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];

// ---------------------------------------------------------------- music grid
export const BPM = 115;
export const BEAT = 60 / BPM;
export const BEAT0 = 0.265;
export const beatAt = (k: number) => BEAT0 + k * BEAT;
/** Seconds since the most recent beat. */
export const sinceBeat = (abs: number) => {
  const k = Math.floor((abs - BEAT0) / BEAT);
  return abs - beatAt(k);
};
/** 1 on every beat, decaying quickly. */
export const pulse = (abs: number, decay = 7) => Math.exp(-decay * sinceBeat(abs));

// ---------------------------------------------------------------- easing
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const backOut = (t: number) => {
  const v = clamp(t);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2);
};
export const win = (t: number, a: number, b: number) => t >= a && t < b;
/** 0→1 over [a, a+fi], 1, then 1→0 over [b-fo, b]. */
export const env = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) =>
  t < a || t > b ? 0 : Math.min(fi > 0 ? clamp((t - a) / fi) : 1, fo > 0 ? clamp((b - t) / fo) : 1);

// ---------------------------------------------------------------- deterministic noise + line boil
export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
let boil = 0;
/** Hand-drawn "line boil": shapes re-jitter 8 times per second. */
export function setBoil(abs: number) {
  boil = Math.floor(abs * 8);
}
export const jit = (seed: number, amp: number) => (hash(seed * 12.9898 + boil * 78.233) - 0.5) * 2 * amp;

// ---------------------------------------------------------------- palette
export const C = {
  ink: "#17161a",
  skin: "#f3dcae",
  skinShade: "#e2c08c",
  hair: "#7a5a2b",
  hairDark: "#4f3a1a",
  hoodie: "#2e6f96",
  hoodieDark: "#22536f",
  tee: "#f4f2ea",
  pants: "#4d4030",
  shoe: "#1d1b1c",
  eye: "#aeb8cc",
  xBlue: "#2a6a8d",
  xWhite: "#f6f6f2",
  maroon: "#7d2546",
  candle: "#ffc65a",
  red: "#e8343c",
  orange: "#ff9f0a",
  paper: "#efe6d2",
  night: "#141b33",
};

// ---------------------------------------------------------------- rough shapes
function spline(ctx: Ctx, p: Pt[], closed: boolean) {
  const n = p.length;
  if (n < 2) return;
  const at = (i: number): Pt => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  ctx.moveTo(p[0][0], p[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1),
      p1 = at(i),
      p2 = at(i + 1),
      p3 = at(i + 2);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1],
    );
  }
  if (closed) ctx.closePath();
}
const jitter = (pts: Pt[], seed: number, amp: number): Pt[] =>
  pts.map(([x, y], i) => [x + jit(seed + i * 3.1, amp), y + jit(seed + i * 5.7 + 0.5, amp)]);

/** Append a closed hand-drawn shape to the current path (for even-odd holes). */
export function addBlob(ctx: Ctx, pts: Pt[], seed: number, amp = 1.6) {
  spline(ctx, jitter(pts, seed, amp), true);
}
/** Smooth closed hand-drawn shape through points. */
export function blob(ctx: Ctx, pts: Pt[], seed: number, amp = 1.6) {
  ctx.beginPath();
  spline(ctx, jitter(pts, seed, amp), true);
}
/** Smooth open hand-drawn curve through points. */
export function curve(ctx: Ctx, pts: Pt[], seed: number, amp = 1.4) {
  ctx.beginPath();
  spline(ctx, jitter(pts, seed, amp), false);
}
/** Polygon with straight (wobbly) edges — good for spiky hair and sharp things. */
export function poly(ctx: Ctx, pts: Pt[], seed: number, amp = 1.4, closed = true) {
  const p = jitter(pts, seed, amp);
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
  if (closed) ctx.closePath();
}
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, n = 14, rot = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx,
      y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}
export function oval(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, amp = 1.5, rot = 0) {
  blob(ctx, ellipsePts(cx, cy, rx, ry, rx + ry > 120 ? 16 : 10, rot), seed, amp);
}
export function rrectPts(x: number, y: number, w: number, h: number, r: number): Pt[] {
  r = Math.min(r, w / 2, h / 2);
  const k = 0.29 * r;
  return [
    [x + r, y],
    [x + w / 2, y],
    [x + w - r, y],
    [x + w - k, y + k],
    [x + w, y + r],
    [x + w, y + h / 2],
    [x + w, y + h - r],
    [x + w - k, y + h - k],
    [x + w - r, y + h],
    [x + w / 2, y + h],
    [x + r, y + h],
    [x + k, y + h - k],
    [x, y + h - r],
    [x, y + h / 2],
    [x, y + r],
    [x + k, y + k],
  ];
}
export function rbox(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, seed: number, amp = 1.4) {
  blob(ctx, rrectPts(x, y, w, h, r), seed, amp);
}
/** Clean (non-jittered) rounded rectangle path, for UI. */
export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, seed: number, amp = 1.5) {
  const mx = (x1 + x2) / 2,
    my = (y1 + y2) / 2;
  curve(ctx, [[x1, y1], [mx, my], [x2, y2]], seed, amp);
}
export function paint(ctx: Ctx, fill?: string | CanvasGradient | null, stroke: string | null = C.ink, lw = 5) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}
export function inkLine(ctx: Ctx, pts: Pt[], seed: number, lw = 4, color = C.ink, amp = 1.3) {
  curve(ctx, pts, seed, amp);
  paint(ctx, null, color, lw);
}

/** Scribbly hatch fill inside the current clip — used for shading. */
export function hatch(ctx: Ctx, x: number, y: number, w: number, h: number, gap: number, seed: number, color: string, lw = 2, angle = -0.6) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  const len = w + h;
  for (let i = -len; i < len; i += gap) {
    const cx = x + w / 2 + -dy * i,
      cy = y + h / 2 + dx * i;
    ctx.beginPath();
    ctx.moveTo(cx - dx * len + jit(seed + i, 2), cy - dy * len);
    ctx.lineTo(cx + dx * len, cy + dy * len + jit(seed + i * 2, 2));
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- text
export const F = {
  en: "'Gochi Hand', 'Comic Sans MS', cursive",
  marker: "'Permanent Marker', 'Gochi Hand', cursive",
  cn: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Sans CJK SC', 'PingFang SC', sans-serif",
  pen: "'Long Cang', 'ZCOOL KuaiLe', 'Noto Sans CJK SC', cursive",
  ui: "'Noto Sans SC', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
export interface TextStyle {
  size: number;
  font?: string;
  weight?: number | string;
  fill?: string;
  stroke?: string;
  lw?: number;
  align?: CanvasTextAlign;
  base?: CanvasTextBaseline;
  alpha?: number;
  shadow?: number;
}
export function font(size: number, family = F.cn, weight: number | string = 400) {
  return `${weight} ${Math.round(size * 100) / 100}px ${family}`;
}
export function text(ctx: Ctx, s: string, x: number, y: number, st: TextStyle) {
  ctx.save();
  ctx.font = font(st.size, st.font ?? F.cn, st.weight ?? 400);
  ctx.textAlign = st.align ?? "center";
  ctx.textBaseline = st.base ?? "middle";
  if (st.alpha !== undefined) ctx.globalAlpha *= st.alpha;
  if (st.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = st.shadow;
    ctx.shadowOffsetY = st.shadow * 0.25;
  }
  if (st.stroke && (st.lw ?? 0) > 0) {
    ctx.lineWidth = st.lw!;
    ctx.lineJoin = "round";
    ctx.strokeStyle = st.stroke;
    ctx.strokeText(s, x, y);
    ctx.shadowColor = "transparent";
  }
  ctx.fillStyle = st.fill ?? "#fff";
  ctx.fillText(s, x, y);
  ctx.restore();
}
export function measure(ctx: Ctx, s: string, size: number, family = F.cn, weight: number | string = 400) {
  ctx.save();
  ctx.font = font(size, family, weight);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}
/** Text that "writes on" character by character (0..1 progress). */
export function writeOn(s: string, p: number) {
  const chars = Array.from(s);
  return chars.slice(0, Math.round(clamp(p) * chars.length)).join("");
}

// ---------------------------------------------------------------- fonts
let fontsReady: Promise<void> | null = null;
const FONT_FILES: [string, string, string][] = [
  ["Gochi Hand", "gochi-hand.woff2", "400"],
  ["Permanent Marker", "permanent-marker.woff2", "400"],
  ["ZCOOL KuaiLe", "zcool-kuaile.woff2", "400"],
  ["Long Cang", "long-cang.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-400.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-700.woff2", "700"],
];
export function loadFonts(): Promise<void> {
  fontsReady ??= Promise.all(
    FONT_FILES.map(async ([family, file, weight]) => {
      const url = assetUrl("films/work-bdd5c2f8/fonts/" + file);
      // Load the bytes ourselves first (works where CSS url() font loading is restricted),
      // then fall back to a quoted URL source.
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        document.fonts.add(await new FontFace(family, await res.arrayBuffer(), { weight }).load());
        return;
      } catch {
        // try the URL form below
      }
      try {
        document.fonts.add(await new FontFace(family, `url("${new URL(url, location.href).href}")`, { weight }).load());
      } catch {
        // Fall back to system fonts if a file is missing.
      }
    }),
  ).then(() => undefined);
  return fontsReady;
}

// ---------------------------------------------------------------- scene scaffold
export type DrawFn = (ctx: Ctx, abs: number, local: number) => void;
/**
 * Standard canvas scene in 1080×1920 design units.
 * `t0` is the absolute song time at which this layer starts, so drawing code can
 * use absolute times that line up with the lyrics.
 */
export async function designScene(options: SceneOptions, t0: number, draw: DrawFn, prepare?: () => Promise<void>): Promise<Scene> {
  await loadFonts();
  if (prepare) await prepare();
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d")!;
  const s = options.width / W;
  return {
    canvas,
    render(time) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      const abs = t0 + time;
      setBoil(abs);
      ctx.save();
      draw(ctx, abs, time);
      ctx.restore();
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}

/** Zoom/rotate the whole frame around (cx, cy). */
export function camera(ctx: Ctx, cx: number, cy: number, zoom: number, rot = 0, dx = 0, dy = 0) {
  ctx.translate(cx + dx, cy + dy);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);
}
export function shake(abs: number, amount: number, seed = 1): Pt {
  if (amount <= 0) return [0, 0];
  const f = Math.floor(abs * 30);
  return [(hash(f * 1.7 + seed) - 0.5) * 2 * amount, (hash(f * 2.3 + seed + 9) - 0.5) * 2 * amount];
}
export function fillBg(ctx: Ctx, color: string | CanvasGradient) {
  ctx.fillStyle = color;
  ctx.fillRect(-60, -60, W + 120, H + 120);
}
export function vgrad(ctx: Ctx, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
/** Paper-white flash / dip-to-black helpers. */
export function flash(ctx: Ctx, a: number, color = "#fff") {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = color;
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.restore();
}
/** Small handwritten caption like a film time-card, e.g. "23:58" or "今天早些时候". */
export function card(ctx: Ctx, s: string, x: number, y: number, a: number, size = 40, align: CanvasTextAlign = "left") {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const w = measure(ctx, s, size, F.cn);
  const bx = align === "left" ? x : align === "right" ? x - w : x - w / 2;
  ctx.fillStyle = "rgba(10,10,14,0.55)";
  rr(ctx, bx - 18, y - size * 0.75, w + 36, size * 1.5, 12);
  ctx.fill();
  text(ctx, s, bx + w / 2, y + 2, { size, font: F.cn, fill: "#fff" });
  ctx.restore();
}
