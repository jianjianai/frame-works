import type { Scene, SceneOptions } from "../../../../src/engine/types";
import { assetUrl } from "../../../../src/engine/types";
import { clamp } from "../../../../src/engine/math";

/** Design space: everything is drawn in 1080×1920 units and scaled to the real canvas. */
export const W = 1080;
export const H = 1920;
export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];

// ---------------------------------------------------------------- 每支视频要改的
/** 字体目录：fetch-fonts.mjs 写到作品的 public/fonts/，这里写 films/<作品名>/fonts/。 */
export const FONT_DIR = "films/work-bdd5c2f8/fonts/";

// ---------------------------------------------------------------- music grid
/** 换歌要改：BPM 和第一拍的时间（秒）。 */
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

// ---------------------------------------------------------------- construction helpers (精细版，和素材库 s0rrow 一致)
export const lerp2 = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rotPt = ([x, y]: Pt, a: number, o: Pt = [0, 0]): Pt => {
  const dx = x - o[0],
    dy = y - o[1];
  return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
/** Outline of a tapered tube along a polyline (widths per point) — limbs, tails, hair locks.
 *  Returns points going down one side and back up the other, with rounded caps. */
export function tubePts(spine: Pt[], widths: number[], capA = true, capB = true): Pt[] {
  const n = spine.length;
  const left: Pt[] = [],
    right: Pt[] = [];
  const dir = (i: number): Pt => {
    const a = spine[Math.max(0, i - 1)],
      b = spine[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  for (let i = 0; i < n; i++) {
    const [dx, dy] = dir(i);
    const w = widths[Math.min(i, widths.length - 1)] / 2;
    left.push([spine[i][0] - dy * w, spine[i][1] + dx * w]);
    right.push([spine[i][0] + dy * w, spine[i][1] - dx * w]);
  }
  const out: Pt[] = [];
  if (capA) {
    const [dx, dy] = dir(0);
    const w = widths[0] / 2;
    out.push([spine[0][0] - dx * w * 0.7 - dy * w * 0.7, spine[0][1] - dy * w * 0.7 + dx * w * 0.7]);
  }
  out.push(...left);
  if (capB) {
    const [dx, dy] = dir(n - 1);
    const w = widths[Math.min(n - 1, widths.length - 1)] / 2;
    out.push([spine[n - 1][0] + dx * w * 0.8, spine[n - 1][1] + dy * w * 0.8]);
  }
  out.push(...right.reverse());
  if (capA) {
    const [dx, dy] = dir(0);
    const w = widths[0] / 2;
    out.push([spine[0][0] - dx * w * 0.7 + dy * w * 0.7, spine[0][1] - dy * w * 0.7 - dx * w * 0.7]);
  }
  return out;
}
/** Two-joint chain (shoulder→elbow→wrist, hip→knee→ankle) that bends toward `bend` (+1/-1). */
export function ik2(a: Pt, target: Pt, l1: number, l2: number, bend: number): [Pt, Pt] {
  const dx = target[0] - a[0],
    dy = target[1] - a[1];
  const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const ang = base - bend * Math.acos(Math.max(-1, Math.min(1, cos)));
  const elbow: Pt = [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
  const end: Pt = [a[0] + Math.cos(base) * d, a[1] + Math.sin(base) * d];
  return [elbow, end];
}
/** Fill a shape and clip to it while `inside` draws shading/texture; then stroke the outline. */
export function shaded(ctx: Ctx, path: () => void, fill: string, inside: (() => void) | null, stroke: string | null = C.ink, lw = 5) {
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  if (inside) {
    ctx.save();
    path();
    ctx.clip();
    inside();
    ctx.restore();
  }
  if (stroke && lw > 0) {
    path();
    paint(ctx, null, stroke, lw);
  }
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
/** [family, file, weight, unicode-range?]. The "-extra" files are small Google Fonts subsets with only the characters
 *  the 重置版 added (fetched through asset_import from fonts.googleapis.com/css2?family=…&text=…, since fetch-fonts.mjs
 *  can't run here). Their unicode-range makes the browser take just those characters from them, the rest from the
 *  main subsets. To add more text: fetch another "-extra" subset the same way and list it here. */
const FONT_FILES: [string, string, string, string?][] = [
  ["Gochi Hand", "gochi-hand.woff2", "400"],
  ["Permanent Marker", "permanent-marker.woff2", "400"],
  ["ZCOOL KuaiLe", "zcool-kuaile.woff2", "400"],
  ["Long Cang", "long-cang.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-400.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-700.woff2", "700"],
  // 结尾引导：点赞的人，生日那天消息 99+ / 回看：他在第几秒开的飞行模式？/ 答案打在评论区
  ["ZCOOL KuaiLe", "zcool-kuaile-extra.ttf", "400", "U+70B9,U+8D5E,U+7684,U+4EBA,U+FF0C,U+751F,U+65E5,U+90A3,U+5929,U+6D88,U+606F,U+56DE,U+770B,U+FF1A,U+4ED6,U+5728,U+7B2C,U+51E0,U+79D2,U+5F00,U+98DE,U+884C,U+6A21,U+5F0F,U+FF1F,U+7B54,U+6848,U+6253,U+8BC4,U+8BBA,U+533A"],
  // 小雨的通知和回复：上课大家是在笑阿杰差点说漏嘴…不是笑你啦 / 横幅上的字是我写的！
  ["Noto Sans SC", "noto-sans-sc-400-extra.ttf", "400", "U+4E0A,U+8BFE,U+5927,U+5BB6,U+662F,U+5728,U+7B11,U+963F,U+6770,U+5DEE,U+70B9,U+8BF4,U+6F0F,U+5634,U+2026,U+4E0D,U+4F60,U+5566,U+6A2A,U+5E45,U+7684,U+5B57,U+6211,U+5199,U+FF01"],
];
export function loadFonts(): Promise<void> {
  fontsReady ??= Promise.all(
    FONT_FILES.map(async ([family, file, weight, unicodeRange]): Promise<FontFace | null> => {
      const url = assetUrl(FONT_DIR + file);
      const desc: FontFaceDescriptors = unicodeRange ? { weight, unicodeRange } : { weight };
      // Load the bytes ourselves first (works where CSS url() font loading is restricted),
      // then fall back to a quoted URL source.
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        return await new FontFace(family, await res.arrayBuffer(), desc).load();
      } catch {
        // try the URL form below
      }
      try {
        return await new FontFace(family, `url("${new URL(url, location.href).href}")`, desc).load();
      } catch {
        return null; // fall back to system fonts if a file is missing
      }
    }),
  ).then((faces) => {
    // added in list order, so the small "-extra" subsets (last) are tried first for their characters
    for (const f of faces) if (f) document.fonts.add(f);
  });
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

// ---------------------------------------------------------------- camera
/** Ease in and out (cubic) — camera moves start and settle softly instead of the linear `phase`. */
export const easeInOut = (t: number) => {
  const v = clamp(t);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
/** A hand-held camera: a slow, smooth drift (a few sines, no frame-to-frame jitter) → [dx, dy, rot].
 *  `amp` ≈ pixels; 3–6 for a quiet shot, 8–12 when it should feel nervous. Different `seed` per shot. */
export function handheld(abs: number, amp = 5, seed = 0): [number, number, number] {
  const t = abs + seed * 13.7;
  const dx = (Math.sin(t * 0.83) * 0.6 + Math.sin(t * 1.91 + 1.3) * 0.3 + Math.sin(t * 3.7 + 0.4) * 0.1) * amp;
  const dy = (Math.sin(t * 0.67 + 2.1) * 0.6 + Math.sin(t * 1.53 + 0.7) * 0.3 + Math.sin(t * 3.1 + 1.9) * 0.1) * amp;
  const rot = (Math.sin(t * 0.59 + 0.9) * 0.7 + Math.sin(t * 1.37) * 0.3) * amp * 0.0007;
  return [dx, dy, rot];
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

// ---------------------------------------------------------------- offscreen filter pass
const offscreens = new Map<string, HTMLCanvasElement>();
/** Draw `draw` into an offscreen copy of the canvas (same transform), then composite it back
 *  through a CSS filter, e.g. "blur(2px)" (depth of field) or "sepia(0.8)". `key` lets several passes keep
 *  their own buffer. */
export function filtered(ctx: Ctx, filter: string, draw: (c: Ctx) => void, key = "a", alpha = 1) {
  const cv = ctx.canvas;
  let off = offscreens.get(key);
  if (!off || off.width !== cv.width || off.height !== cv.height) {
    off = document.createElement("canvas");
    off.width = cv.width;
    off.height = cv.height;
    offscreens.set(key, off);
  }
  const oc = off.getContext("2d")!;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.clearRect(0, 0, off.width, off.height);
  oc.setTransform(ctx.getTransform());
  oc.save();
  draw(oc);
  oc.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = filter;
  ctx.globalAlpha *= alpha;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}
