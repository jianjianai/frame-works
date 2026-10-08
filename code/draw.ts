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
export const FONT_DIR = "films/work-xxxxxxxx/fonts/"; // ← 改成本作品的内部名称（work-…）

// ---------------------------------------------------------------- music grid
/** 换歌要改：BPM 和第一拍的时间（秒）。现在是《i have no friends》的（115 BPM，第一拍 0.265）。 */
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
/** [family, file, weight, unicode-range?]. 主子集由 fetch-fonts.mjs 生成。不能跑脚本时补字：用 asset_import 下载
 *  fonts.googleapis.com/css2?family=…&text=…（只含新字的小子集），存成 public/fonts/<名字>-extra.ttf，在下面加一行并写上这些字的
 *  unicode-range（这些字从 extra 文件取，其余从主子集取）。extra 放在列表最后。 */
const FONT_FILES: [string, string, string, string?][] = [
  ["Gochi Hand", "gochi-hand.woff2", "400"],
  ["Permanent Marker", "permanent-marker.woff2", "400"],
  ["ZCOOL KuaiLe", "zcool-kuaile.woff2", "400"],
  ["Long Cang", "long-cang.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-400.woff2", "400"],
  ["Noto Sans SC", "noto-sans-sc-700.woff2", "700"],
  // 例（重置版结尾引导新增的字）：["ZCOOL KuaiLe", "zcool-kuaile-extra.ttf", "400", "U+70B9,U+8D5E,U+7684"],
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
let ROOT = 1;
/** Device pixels per design unit at the scene's root (designScene sets a pure scale there). For overlays drawn in
 *  screen space whatever the camera (red-pen notes, line widths in design px: mirrors 的 story.ts `px`/`toDesign`). */
export const rootScale = () => ROOT;
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
      ROOT = s;
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
/** A cleared offscreen copy of the canvas (same size) with ctx's transform, for multi-pass effects. `key` lets
 *  several passes keep their own buffer (don't nest two passes with the same key). */
export function buffer(ctx: Ctx, key: string): Ctx {
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
  oc.globalAlpha = 1;
  oc.globalCompositeOperation = "source-over";
  oc.filter = "none";
  oc.clearRect(0, 0, off.width, off.height);
  oc.setTransform(ctx.getTransform());
  return oc;
}
/** Lay a buffer back over ctx pixel for pixel. */
export function blit(ctx: Ctx, src: Ctx, op: GlobalCompositeOperation = "source-over", alpha = 1, filter = "none") {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = op;
  ctx.globalAlpha *= alpha;
  ctx.filter = filter;
  ctx.drawImage(src.canvas, 0, 0);
  ctx.restore();
}
/** Draw `draw` into an offscreen copy of the canvas (same transform), then composite it back
 *  through a CSS filter, e.g. "blur(2px)" (depth of field) or "sepia(0.8)". `key` lets several passes keep
 *  their own buffer. */
export function filtered(ctx: Ctx, filter: string, draw: (c: Ctx) => void, key = "a", alpha = 1, op: GlobalCompositeOperation = "source-over") {
  const oc = buffer(ctx, key);
  oc.save();
  draw(oc);
  oc.restore();
  blit(ctx, oc, op, alpha, filter);
}

// ---------------------------------------------------------------- light and shadow (重置版 · 光影)
// 用户：光影和美感也是留存的关键，特别是开头。Light comes from somewhere: a key light that colours what it touches
// (the candle, warm), the dark that swallows what it doesn't, a cold rim from behind (the moon), shadows thrown by
// the figures, and glow/dust in the air. These work on any figure drawn with drawKid/drawPerson.
/** Device pixels per design unit at ctx's transform (shifts and blurs that must follow the camera). */
export function devScale(ctx: Ctx) {
  const t = ctx.getTransform();
  return Math.hypot(t.a, t.b);
}
/** A candle's flicker: about 1 ± 0.1, never periodic-looking. */
export const flicker = (abs: number, seed = 0) =>
  1 + 0.045 * Math.sin(abs * 23 + seed) + 0.03 * Math.sin(abs * 37.3 + seed * 2) + 0.025 * Math.sin(abs * 9.1 + seed * 3);
/** A figure's alpha, for lighting it: `draw` once into its own buffer. Use the result before drawing another mask
 *  with the same key. */
export function figureMask(ctx: Ctx, draw: (c: Ctx) => void, key = "figure"): Ctx {
  const m = buffer(ctx, "mask:" + key);
  m.save();
  draw(m);
  m.restore();
  return m;
}
/** erase `cut` (a path filled in design units: what stands in front of the figure, e.g. a desk) from a buffer */
function cutOut(b: Ctx, cut?: (c: Ctx) => void) {
  if (!cut) return;
  b.save();
  b.globalCompositeOperation = "destination-out";
  b.fillStyle = "#000";
  cut(b);
  b.restore();
}
/** Light (or shade) on the figure only: `paint` fills in design units; the result is cut to the mask (minus `cut`)
 *  and laid over with `op` ("screen" for a key light that tints, "lighter" for a glow, "source-over" for shade). */
export function onFigure(ctx: Ctx, mask: Ctx, paint: (c: Ctx) => void, op: GlobalCompositeOperation = "source-over", alpha = 1, cut?: (c: Ctx) => void) {
  if (alpha <= 0.005) return;
  const b = buffer(ctx, "onFigure");
  b.save();
  paint(b);
  b.restore();
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "destination-in";
  b.drawImage(mask.canvas, 0, 0);
  b.restore();
  cutOut(b, cut);
  blit(ctx, b, op, alpha);
}
/** Rim light, the way a cel painter does it: a band of light just inside the ink outline, along the edges of a
 *  figure that face a light. (ux, uy) points from the figure toward the light; `width` = the band, `ink` = the
 *  outline it sits inside (design units). `cut` erases what stands in front of the figure. */
export function rimLight(ctx: Ctx, mask: Ctx, ux: number, uy: number, width: number, color: string, alpha = 1, op: GlobalCompositeOperation = "lighter", ink = 7, cut?: (c: Ctx) => void, reach?: [number, number, number]) {
  if (alpha <= 0.005) return;
  const k = devScale(ctx);
  const n = Math.hypot(ux, uy) || 1;
  const sx = -ux / n,
    sy = -uy / n;
  const b = buffer(ctx, "rim");
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.drawImage(mask.canvas, 0, 0);
  b.globalCompositeOperation = "destination-in"; // at least `ink` in from the lit edge…
  b.drawImage(mask.canvas, sx * ink * k, sy * ink * k);
  b.globalCompositeOperation = "destination-out"; // …and no more than ink + width
  b.drawImage(mask.canvas, sx * (ink + width) * k, sy * (ink + width) * k);
  b.globalCompositeOperation = "source-in";
  b.fillStyle = color;
  b.fillRect(0, 0, b.canvas.width, b.canvas.height);
  b.restore();
  if (reach) {
    // strongest near the light, gone at `reach[2]` from it
    const [rx, ry, rr] = reach;
    const g = b.createRadialGradient(rx, ry, 0, rx, ry, rr);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    b.save();
    b.globalCompositeOperation = "destination-in";
    b.fillStyle = g;
    b.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
    b.restore();
  }
  cutOut(b, cut);
  blit(ctx, b, op, alpha, `blur(${Math.max(0.6, width * k * 0.3).toFixed(1)}px)`);
}
/** The shadow a point light at `light` throws of a figure onto the wall behind it: the figure scaled `k` away from
 *  the light, flattened to `color`, softened by `soft` design units. `clip` (optional) limits where it can fall
 *  (it must call c.clip()); `figure` (its mask) keeps it off the figure itself, so it can be laid over the finished
 *  picture — after the light — and darken the light on the wall too. */
export function castShadow(ctx: Ctx, light: Pt, k: number, draw: (c: Ctx) => void, color: string, soft: number, alpha = 1, clip?: (c: Ctx) => void, figure?: Ctx) {
  if (alpha <= 0.005) return;
  const b = buffer(ctx, "cast");
  b.save();
  if (clip) clip(b);
  b.translate(light[0], light[1]);
  b.scale(k, k);
  b.translate(-light[0], -light[1]);
  draw(b);
  b.restore();
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "source-in";
  b.fillStyle = color;
  b.fillRect(0, 0, b.canvas.width, b.canvas.height);
  b.restore();
  const out = figure ? buffer(ctx, "cast2") : b;
  if (figure) {
    // blur first, then take the figure out (sharp), so no dark fringe creeps onto him
    blit(out, b, "source-over", 1, `blur(${(soft * devScale(ctx)).toFixed(1)}px)`);
    out.save();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.globalCompositeOperation = "destination-out";
    out.drawImage(figure.canvas, 0, 0);
    out.restore();
    blit(ctx, out, "source-over", alpha);
  } else blit(ctx, b, "source-over", alpha, `blur(${(soft * devScale(ctx)).toFixed(1)}px)`);
}
/** Dust turning in a light: `n` specks inside the ellipse (x, y, rx, ry), rising slowly, brightest in the middle.
 *  `rgb` is "r,g,b". */
export function motes(ctx: Ctx, abs: number, x: number, y: number, rx: number, ry: number, n: number, seed: number, rgb = "255,225,180", alpha = 1, size = 2.6) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const u = hash(seed + i * 3.7) * 2 - 1;
    const v = ((hash(seed + i * 5.1) + abs * (0.025 + 0.03 * hash(seed + i * 1.9))) % 1) * 2 - 1; // rising
    const px = x + rx * (u * 0.9 + Math.sin(abs * (0.6 + hash(seed + i) * 0.6) + i) * 0.06),
      py = y - ry * v;
    const d = Math.min(1, Math.hypot(u, v));
    const tw = 0.55 + 0.45 * Math.sin(abs * (2 + 3 * hash(seed + i * 7.3)) + i * 1.3);
    const a = alpha * (1 - d) * tw;
    if (a <= 0.01) continue;
    const r = size * (0.6 + 0.8 * hash(seed + i * 2.3));
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.2);
    g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
    g.addColorStop(0.4, `rgba(${rgb},${(a * 0.6).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(px - r * 2.2, py - r * 2.2, r * 4.4, r * 4.4);
  }
  ctx.restore();
}
/** Vertical motion blur for a whip-tilt: `draw` once, then average `n` copies spread over `px` design units up and
 *  down (additive, so it stays a true average). */
export function smearV(ctx: Ctx, draw: (c: Ctx) => void, px: number, key = "smear", n = 9) {
  smear(ctx, draw, 0, px, key, n);
}
/** Motion blur along (dx, dy) design units — a whip-pan in any direction: `draw` once, then average `n` copies
 *  spread along the vector, centred. Call it at the scene's base transform (the camera goes inside `draw`). Smear
 *  length = the picture's speed (px/s) ÷ 48 (a 1/48 s shutter); the next shot carries on in the same direction,
 *  slowing, with its own smear (《mirrors》 act1: bathroom → hallway at 1.13–1.54). */
export function smear(ctx: Ctx, draw: (c: Ctx) => void, dx: number, dy: number, key = "smear", n = 9) {
  if (Math.hypot(dx, dy) < 2) {
    draw(ctx);
    return;
  }
  const a = buffer(ctx, key + "A");
  a.save();
  draw(a);
  a.restore();
  const b = buffer(ctx, key + "B");
  const k = devScale(ctx);
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "lighter";
  b.globalAlpha = 1 / n;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    b.drawImage(a.canvas, u * dx * k, u * dy * k);
  }
  b.restore();
  blit(ctx, b);
}
/** Zoom blur (a crash zoom, a push through a transition): `draw` once, then average `n` copies scaled from 1 to
 *  1 + amount about the design point (cx, cy). Call it at the scene's base transform. A rush into something at the
 *  end of one shot and a decelerating push at the start of the next, both blurred, read as one move (《mirrors》
 *  act1: his face → the birthmark on the drum hit, 3.95–4.25). */
export function zoomBlur(ctx: Ctx, draw: (c: Ctx) => void, cx: number, cy: number, amount: number, key = "zoomBlur", n = 10) {
  if (amount < 0.004) {
    draw(ctx);
    return;
  }
  const a = buffer(ctx, key + "A");
  a.save();
  draw(a);
  a.restore();
  const b = buffer(ctx, key + "B");
  const t = ctx.getTransform();
  const px = t.a * cx + t.c * cy + t.e,
    py = t.b * cx + t.d * cy + t.f;
  b.save();
  b.globalCompositeOperation = "lighter";
  b.globalAlpha = 1 / n;
  for (let i = 0; i < n; i++) {
    const s = 1 + (amount * i) / (n - 1);
    b.setTransform(s, 0, 0, s, px - s * px, py - s * py);
    b.drawImage(a.canvas, 0, 0);
  }
  b.restore();
  blit(ctx, b);
}
/** Bloom: the bright parts of the finished picture (a flame, a lit screen, a lit face) bleed a soft glow into the
 *  dark around them, the way a lens does at night. Call it last, on the scene's own canvas. `threshold` (contrast)
 *  decides how bright a thing must be to glow. */
export function bloom(ctx: Ctx, amount = 0.3, radius = 26, threshold = 2.6) {
  if (amount <= 0.005) return;
  const b = buffer(ctx, "bloom");
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.filter = `brightness(0.72) contrast(${threshold}) blur(${(radius * devScale(ctx)).toFixed(1)}px)`;
  b.drawImage(ctx.canvas, 0, 0);
  b.filter = "none";
  blit(ctx, b, "screen", amount);
}
/** An out-of-focus light: a soft disc with a slightly brighter rim (the way a lens draws a far point of light). */
export function bokehDisc(ctx: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  if (a <= 0.005) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${(a * 0.55).toFixed(3)})`);
  g.addColorStop(0.8, `rgba(${rgb},${(a * 0.72).toFixed(3)})`);
  g.addColorStop(0.93, `rgba(${rgb},${a.toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
/** A soft light shaft (moonlight through a window, sun through a door): the quad `pts` filled with `rgb`, fading
 *  from `a0` at (x0, y0) to nothing at (x1, y1), its edges softened by `soft` design units, added as light. */
export function lightShaft(ctx: Ctx, pts: Pt[], x0: number, y0: number, x1: number, y1: number, rgb: string, a0: number, soft = 24, key = "shaft") {
  if (a0 <= 0.005) return;
  filtered(
    ctx,
    `blur(${(soft * devScale(ctx)).toFixed(1)}px)`,
    (c) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(${rgb},${a0.toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    },
    key,
    1,
    "lighter",
  );
}

// ---------------------------------------------------------------- the look (重新设计版)
/** His world before the twist is grey: draw `draw` desaturated (sat 0..1). Things that stay warm (the candle, the
 *  airplane toggle, the red "!") are drawn after this, outside it. */
export function grade(ctx: Ctx, sat: number, draw: (c: Ctx) => void, key = "grade") {
  if (sat >= 0.999) {
    draw(ctx);
    return;
  }
  filtered(ctx, `saturate(${sat.toFixed(3)}) brightness(0.97)`, draw, key);
}

// film grain tiles (built once): mid-grey noise, so laid over the picture in "overlay" it adds grain, not colour
let filmTiles: HTMLCanvasElement[] | null = null;
function grainTiles(): HTMLCanvasElement[] {
  if (filmTiles) return filmTiles;
  let s = 20261005;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  filmTiles = [0, 1, 2, 3].map(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const img = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 100;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  return filmTiles;
}

/** Memories, through a film camera. The picture keeps its colours (用户要求：回忆不改变画面颜色); only the camera is laid
 *  over it: a gate weave at 18 fps, coarse grain, dust, a hair and the odd scratch (dark grey, never white — white
 *  specks read as dandruff on a phone), a slight exposure flicker and a neutral vignette. */
export function oldFilm(ctx: Ctx, abs: number, draw: (c: Ctx) => void, _key = "film", amount = 1) {
  const f = Math.floor(abs * 18);
  ctx.save();
  ctx.translate((hash(f * 1.3) - 0.5) * 2.5 * amount, (hash(f * 2.1) - 0.5) * 2.5 * amount);
  draw(ctx);
  ctx.restore();
  // grain
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.34 * amount;
  ctx.translate(-((f * 97) % 256), -((f * 61) % 256));
  ctx.scale(1.5, 1.5);
  ctx.fillStyle = ctx.createPattern(grainTiles()[f % 4], "repeat")!;
  ctx.fillRect(0, 0, W + 400, H + 400);
  ctx.restore();
  ctx.save();
  // exposure flicker (neutral)
  const fl = (hash(f * 3.7) - 0.5) * 0.06 * amount;
  ctx.globalAlpha = Math.abs(fl);
  ctx.fillStyle = fl > 0 ? "#fff" : "#000";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  // dust, a hair, the odd scratch
  ctx.globalAlpha = 0.55 * amount;
  ctx.fillStyle = "#1c1c1c";
  for (let i = 0; i < 8; i++) {
    if (hash(f + i * 9.7) < 0.55) continue;
    ctx.beginPath();
    ctx.arc(hash(f * 7.1 + i) * W, hash(f * 3.3 + i * 2) * H, 1.5 + hash(f + i) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (hash(f * 0.61) > 0.8) {
    const hx = hash(f * 2.9) * W,
      hy = hash(f * 4.3) * H;
    ctx.strokeStyle = "rgba(20,20,20,0.6)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.bezierCurveTo(hx + 30, hy - 20, hx + 50, hy + 30, hx + 80, hy + 10);
    ctx.stroke();
  }
  ctx.restore();
  // old-screen vertical lines at random (用户要求：回忆播放时也随机出现竖线): two that wander and come and go, one to
  // three that jump every frame, and now and then a short burst — the same lines as the cut into the memory. Masked by
  // linesOutsideCentre: faint inside a circle in the middle of the screen, stronger the further out they run.
  const burst = hash(Math.floor(abs * 3) * 1.37) > 0.72 && (abs * 3) % 1 < 0.35;
  const lines = (hash(f * 0.37) > 0.45 ? 1 + Math.floor(hash(f * 0.91) * 3) : 0) + (burst ? 10 : 0);
  linesOutsideCentre(ctx, (c) => {
    for (let k = 0; k < 2; k++) {
      if (Math.sin(abs * (0.9 + k * 0.7) + k * 2.1) < 0.1) continue;
      c.globalAlpha = (0.3 + 0.25 * hash(f + k * 3.3)) * amount;
      c.fillStyle = k ? "#f3efe6" : "#0c0c0c";
      c.fillRect(W * (0.25 + 0.5 * hash(k * 5.3)) + Math.sin(abs * (1.3 + k)) * 160 + (hash(f * 1.1 + k) - 0.5) * 6, -60, 1.5 + k, H + 120);
    }
    for (let k = 0; k < lines; k++) {
      c.globalAlpha = (0.25 + 0.5 * hash(f * 2.3 + k)) * amount;
      c.fillStyle = hash(k * 9.1 + f) > 0.45 ? "#0c0c0c" : "#f3efe6";
      c.fillRect(hash(f * 3.1 + k * 7.3) * W, -60, 1 + hash(f + k * 1.7) * (k % 6 === 0 ? 5 : 2), H + 120);
    }
  });
  // a mild neutral vignette (a strong one hurt the look — the old-screen cut into the memory carries the cue instead)
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(0.38 * amount).toFixed(2)})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.restore();
}

/** Blink every 2.6–4 s for ~0.12 s: returns "shut" during a blink, else `base`. `seed` desyncs characters. */
export function blinkEyes<T extends string>(abs: number, seed: number, base: T): T | "shut" {
  const period = 2.6 + hash(seed) * 1.4;
  const t = (abs + hash(seed * 3.1) * period) % period;
  return t < 0.12 ? "shut" : base;
}

/** Old-screen vertical lines, faint inside a circle in the middle of the screen and stronger the further out they
 *  run (用户：中心区域圆圈里不明显，越到边缘越明显 — a radial mask, not a per-line fade). `draw` paints the lines. */
export function linesOutsideCentre(ctx: Ctx, draw: (c: Ctx) => void, key = "lines") {
  filtered(
    ctx,
    "none",
    (c) => {
      draw(c);
      c.save();
      c.globalAlpha = 1;
      c.globalCompositeOperation = "destination-in";
      const g = c.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.78);
      g.addColorStop(0, "rgba(0,0,0,0.08)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      c.fillStyle = g;
      c.fillRect(-100, -100, W + 200, H + 200);
      c.restore();
    },
    key,
  );
}

// ---------------------------------------------------------------- reusable pieces from the 重置版 (素材库)
/** The cut into a memory, like an old screen (two beats, no sound effect — 用户定的回忆标准): p 0→1. The present
 *  breaks up into flickering vertical lines and a jitter; around `at` (0..1, default the middle) it dissolves into
 *  the memory, which is drawn through `oldFilm`, and the lines thin out as the memory settles. Best as a match cut:
 *  the same face, same size, same place on both sides (重置版 act1 `shotOldScreen`: his reflection in the black
 *  phone → his face this morning). */
export function oldScreenCut(ctx: Ctx, abs: number, p: number, drawNow: (c: Ctx) => void, drawMemory: (c: Ctx) => void, at = 0.5) {
  const dens = Math.sin(Math.PI * Math.min(1, clamp(p) * 1.15));
  const f = Math.floor(abs * 24);
  const u = clamp((p - at + 0.115) / 0.27);
  const mix = u * u * (3 - 2 * u);
  ctx.save();
  ctx.translate((hash(f * 1.9) - 0.5) * 7 * dens, (hash(f * 2.7) - 0.5) * 3 * dens);
  if (mix < 1) drawNow(ctx);
  if (mix > 0) filtered(ctx, "none", (c) => oldFilm(c, abs, drawMemory), "xfade", mix);
  ctx.restore();
  // the lines: dark and light, mostly thin, a few thick, jumping every frame — densest in the middle of the cut
  const n = Math.floor(8 + 40 * dens);
  linesOutsideCentre(ctx, (c) => {
    for (let k = 0; k < n; k++) {
      c.globalAlpha = (0.3 + 0.6 * hash(f * 2.3 + k)) * (0.35 + 0.65 * dens);
      c.fillStyle = hash(k * 9.1 + f) > 0.45 ? "#0c0c0c" : "#f3efe6";
      c.fillRect(hash(f * 3.1 + k * 7.3) * W, -60, 1 + hash(f + k * 1.7) * (k % 6 === 0 ? 7 : 2.5), H + 120);
    }
  });
  // and the screen flickers
  ctx.save();
  ctx.globalAlpha = 0.3 * dens * hash(f * 5.7);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.restore();
}

/** A figure lit from behind (the sun in a window, a lit doorway, the moon): draws it, then a rim of light just inside
 *  its outline along the edges that face the light ((ux, uy) points toward the light). Morning sun:
 *  "rgb(255,238,200)", 0.5, width 5; a warm doorway: "rgb(255,222,165)", 0.55, width 6; moonlight: a cold blue, lower.
 *  All figures share one mask buffer ("rimFig") — each mask is used at once. */
export function rimFigure(ctx: Ctx, draw: (c: Ctx) => void, ux: number, uy: number, color = "rgb(255,238,200)", alpha = 0.5, width = 5, ink = 6) {
  draw(ctx);
  if (alpha <= 0.01) return;
  const m = figureMask(ctx, draw, "rimFig");
  rimLight(ctx, m, ux, uy, width, color, alpha, "lighter", ink);
}

/** A figure's shadow on the ground from a lamp or the sun: its silhouette sheared flat onto the floor — the feet at
 *  `foot` stay put and the top of the head (`height` design units above the feet) lands at `tip` (where the light
 *  throws it: away from the light, long when the light is low or close). `sx` widens/narrows it, `soft` blurs it
 *  (design units; softer the further the shadow runs). Draw it on the ground before the figure. 重置版 act4
 *  `walkShadow` swings it round him as he walks past each street lamp. */
export function groundShadow(ctx: Ctx, draw: (c: Ctx) => void, foot: Pt, height: number, tip: Pt, alpha = 0.5, soft = 4, sx = 1, color = "#04050b") {
  if (alpha <= 0.02) return;
  const [fx, fy] = foot;
  const kx = (tip[0] - fx) / -height,
    ky = (tip[1] - fy) / -height;
  const b = buffer(ctx, "groundShadow");
  b.save();
  b.transform(sx, 0, kx, ky, fx - sx * fx - kx * fy, fy - ky * fy);
  draw(b);
  b.restore();
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "source-in";
  b.fillStyle = color;
  b.fillRect(0, 0, b.canvas.width, b.canvas.height);
  b.restore();
  blit(ctx, b, "source-over", alpha, `blur(${(soft * devScale(ctx)).toFixed(1)}px)`);
}
