// 逐字歌词的画法（scenes/lyrics.ts 用）：字形缓存、时间曲线、碎块和灰。
// 字和设定字是一套：思源宋体粗体（歌词的字单独截了子集 public/fonts/NotoSerifSC-Bold-lyrics.woff2，改字要重截，见 AGENTS.md），
// 白天深暖棕字 + 米白光，夜里反过来（暖白字 + 深色晕），回忆里是旧照片的褐色；四声「活下去」用她的手写体（龙藏体）。
// 歌词也守这个世界的规矩：绝望的字往上飘、化成灰，被拉住、被给了砖的字有分量（落下来一沉），发光的砖让字也暖起来。
// 卡拉 OK 三种样子：没唱的字淡（同一张图压低透明度），正在唱的字换成亮的暖橙（hl：深色描边 + 光晕，夜里是暖金），唱过的字实。
// 一个字只画一次存成图（按颜色、字号、画布倍数缓存），之后每帧只贴图。

import { assetUrl } from "@frame/engine/types";
import { HAND_FONT, loadHandFont } from "./note";
import { E, clamp01, shake } from "./cam";

export const LYRIC_FONT = "LyricSerif";
let loading: Promise<void> | null = null;
export function loadLyricFonts() {
  loading ??= (async () => {
    const face = new FontFace(LYRIC_FONT, `url(${assetUrl("films/work-3d80f743/fonts/NotoSerifSC-Bold-lyrics.woff2")})`, { weight: "700" });
    const [f] = await Promise.all([face.load(), loadHandFont()]);
    document.fonts.add(f);
  })();
  return loading;
}

// ——— 颜色 ———
export type Pal = "day" | "night" | "memory";
const PAL = {
  day: { ink: "#3a2629", accent: "#b4472f", hl: "#f0682c" },
  night: { ink: "#fff2dc", accent: "#ffb487", hl: "#ffc65e" },
  memory: { ink: "#5c4636", accent: "#9b573a", hl: "#dd7a3e" },
};

// ——— 字形缓存 ———
export interface Sprite {
  img: HTMLCanvasElement;
  /** 设计坐标里的宽高 */
  w: number;
  h: number;
}
type Font = "serif" | "hand";
const cache = new Map<string, Sprite>();
const family = (font: Font) => (font === "hand" ? `400 %spx ${HAND_FONT}, cursive` : `700 %spx ${LYRIC_FONT}, "Noto Serif SC", serif`);

/** 一个字（style：day / night / memory 是带光晕的字，glow 是发光用的暖光团；hl：正在唱的亮字，给颜色就用这个颜色） */
export function sprite(ch: string, font: Font, size: number, style: Pal | "glow", hot: boolean, k: number, hl: boolean | string = false): Sprite {
  const key = `${ch}|${font}|${size}|${style}|${hot ? 1 : 0}|${hl === true ? 1 : hl || 0}|${k.toFixed(3)}`;
  let s = cache.get(key);
  if (s) return s;
  const pad = size * 0.85;
  const fnt = family(font).replace("%s", String(size));
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = fnt;
  const cw = Math.max(size, probe.measureText(ch).width);
  const w = cw + pad * 2;
  const h = size + pad * 2;
  const img = document.createElement("canvas");
  img.width = Math.max(1, Math.ceil(w * k));
  img.height = Math.max(1, Math.ceil(h * k));
  const g = img.getContext("2d")!;
  g.scale(k, k);
  g.font = fnt;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  const x = w / 2;
  const y = h / 2 + (font === "hand" ? size * 0.04 : 0);
  if (style === "glow") {
    g.fillStyle = "#ffe7bd";
    g.shadowColor = "rgba(255,186,96,1)";
    for (const b of [0.75, 0.35]) {
      g.shadowBlur = size * b * k;
      g.fillText(ch, x, y);
    }
  } else if (hl) {
    // 正在唱：亮的暖色字 + 一圈深色细边（亮天上也认得出）+ 外面的光晕
    const c = PAL[style];
    const dark = style === "night" ? "rgba(36,18,24,0.9)" : "rgba(58,30,30,0.92)";
    g.shadowColor = style === "night" ? "rgba(20,10,24,0.85)" : "rgba(255,247,234,0.95)";
    g.strokeStyle = style === "night" ? "rgba(38,20,32,0.62)" : "rgba(255,250,242,0.92)";
    g.lineWidth = size * (font === "hand" ? 0.2 : 0.17);
    for (const b of [0.55, 0.25]) {
      g.shadowBlur = size * b * k;
      g.strokeText(ch, x, y);
    }
    g.shadowBlur = 0;
    g.strokeStyle = dark;
    g.lineWidth = size * (font === "hand" ? 0.09 : 0.075);
    g.strokeText(ch, x, y);
    const hc = typeof hl === "string" ? hl : c.hl;
    g.fillStyle = hc;
    g.fillText(ch, x, y);
    if (font === "hand") {
      g.strokeStyle = hc;
      g.lineWidth = size * 0.035;
      g.strokeText(ch, x, y);
    }
  } else if (style === "night") {
    const c = PAL.night;
    g.shadowColor = "rgba(20,10,24,0.85)";
    g.strokeStyle = "rgba(38,20,32,0.62)";
    g.lineWidth = size * 0.12;
    for (const b of [0.45, 0.2]) {
      g.shadowBlur = size * b * k;
      g.strokeText(ch, x, y);
    }
    g.shadowColor = "rgba(255,190,128,0.5)";
    g.shadowBlur = size * 0.7 * k;
    g.fillStyle = hot ? c.accent : c.ink;
    g.fillText(ch, x, y);
    g.shadowBlur = 0;
    g.fillText(ch, x, y);
  } else {
    const c = PAL[style];
    // 柔光（两层）+ 一圈细的米白边，把字从亮的天、暖色的楼面前托出来（和设定字一样）
    g.shadowColor = style === "memory" ? "rgba(255,244,226,0.85)" : "rgba(255,247,234,0.95)";
    g.strokeStyle = style === "memory" ? "rgba(255,248,236,0.8)" : "rgba(255,250,242,0.92)";
    g.lineWidth = size * (font === "hand" ? 0.16 : 0.13);
    for (const b of [0.55, 0.25]) {
      g.shadowBlur = size * b * k;
      g.strokeText(ch, x, y);
    }
    g.shadowBlur = 0;
    g.strokeText(ch, x, y);
    g.fillStyle = hot ? c.accent : c.ink;
    g.fillText(ch, x, y);
    if (font === "hand") {
      // 手写体笔画细：同色描一圈，粗一点才认得出
      g.strokeStyle = g.fillStyle;
      g.lineWidth = size * 0.035;
      g.strokeText(ch, x, y);
    }
  }
  s = { img, w, h };
  cache.set(key, s);
  return s;
}

// ——— 时间曲线 ———
export interface Key {
  t: number;
  v: number;
  e?: keyof typeof E | "lin" | "back";
}
export interface Key2 {
  t: number;
  x?: number;
  y?: number;
  e?: keyof typeof E | "lin" | "back";
}
const backOut = (x: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const ease = (name: Key["e"], u: number) => (name === "lin" ? u : name === "back" ? backOut(u) : (E[name ?? "io"] ?? E.io)(u));
export function sampleKey(keys: Key[] | undefined, t: number, dflt = 0) {
  if (!keys || !keys.length) return dflt;
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < b.t) return a.v + (b.v - a.v) * ease(a.e, (t - a.t) / (b.t - a.t));
  }
  return keys[keys.length - 1].v;
}
export function sampleKey2(keys: Key2[] | undefined, t: number): [number, number] {
  if (!keys || !keys.length) return [0, 0];
  const xs = keys.map((k) => ({ t: k.t, v: k.x ?? 0, e: k.e }));
  const ys = keys.map((k) => ({ t: k.t, v: k.y ?? 0, e: k.e }));
  return [sampleKey(xs, t), sampleKey(ys, t)];
}
/** 一下冲击：很快到位，再按 decay 秒弹回来 */
export const impulse = (u: number, decay = 0.18) => (u < 0 ? 0 : u < 0.035 ? u / 0.035 : Math.exp(-(u - 0.035) / decay));
/** 一下鼓起来再落回去（心跳、闪一下） */
export const bump = (u: number, decay = 0.14) => (u < 0 ? 0 : (1 - Math.exp(-u / 0.025)) * Math.exp(-u / decay));

// 固定种子的随机数
export function rnd(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ——— 碎：一个字碎成几块（粉末、裂） ———
export interface Shard {
  pts: [number, number][];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  vr: number;
}
/** 字的方块（-0.5..0.5）切成 3×3 格、每格两片三角，顶点抖一下 */
export function shards(seed: number): Shard[] {
  const r = rnd(seed);
  const n = 3;
  const P: [number, number][][] = [];
  for (let i = 0; i <= n; i++) {
    P.push([]);
    for (let j = 0; j <= n; j++) {
      const edge = i === 0 || j === 0 || i === n || j === n;
      P[i].push([j / n - 0.5 + (edge ? 0 : (r() - 0.5) * 0.18), i / n - 0.5 + (edge ? 0 : (r() - 0.5) * 0.18)]);
    }
  }
  const out: Shard[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const a = P[i][j];
      const b = P[i][j + 1];
      const c = P[i + 1][j + 1];
      const d = P[i + 1][j];
      for (const tri of r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        out.push({ pts: tri as [number, number][], cx, cy, vx: cx * 1.6 + (r() - 0.5) * 0.8, vy: cy * 0.8 - 0.2 - r() * 0.6, vr: (r() - 0.5) * 7 });
      }
    }
  return out;
}

// ——— 灰、光点、粉末 ———
export interface Mote {
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  ph: number;
}
export function motes(seed: number, n: number, up: boolean): Mote[] {
  const r = rnd(seed);
  return Array.from({ length: n }, () => ({
    ox: (r() - 0.5) * 0.8,
    oy: (r() - 0.5) * 0.8,
    vx: (r() - 0.5) * 50,
    vy: up ? -(50 + r() * 120) : 40 + r() * 90,
    r: 1.6 + r() * 3.2,
    life: 0.7 + r() * 0.8,
    ph: r() * 6.28,
  }));
}

/** 抖（像素），t0 起按 decay 衰减；t1 给了就在 t0–t1 一直抖 */
export function shakeAt(t: number, t0: number, k: number, decay = 0.25, t1?: number): [number, number] {
  if (t < t0) return [0, 0];
  const amp = t1 !== undefined ? (t <= t1 ? k : k * Math.exp(-(t - t1) / decay)) : k * Math.exp(-(t - t0) / decay);
  return shake(t, amp);
}

export { clamp01, E };
