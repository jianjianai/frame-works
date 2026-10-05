import type { Scene, SceneOptions } from "../../../src/engine/types";
import { assetUrl } from "../../../src/engine/types";
import { clamp, mix, phase, smooth, easeInOut, seeded } from "../../../src/engine/math";

export { clamp, mix, phase, smooth, easeInOut, seeded, assetUrl };

// 所有镜头按 1080×1920 的设计坐标绘制
export const DW = 1080;
export const DH = 1920;
export const RED = "#ff2a36";
export const INK = "#070707";
export const PAPER = "#efebe2";
export const SERIF = `"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif`;
export const SANS = `"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif`;

// 作品时间 0s = 歌曲 41.0s（mix.json 的 offset 要与它一致）
export const SONG_OFFSET = 41.0;
export const SONG = "films/work-a603fe8d/song.flac";
export const COVER = "films/work-a603fe8d/cover.jpg";
export const END = 40;

export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const bump = (t: number, a: number, b: number, c: number, d: number) =>
  smooth(phase(t, a, b)) * (1 - smooth(phase(t, c, d)));
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** 平滑噪声（-1..1），用于手持感 */
export const wobble = (t: number, seed = 0) =>
  Math.sin(t * 1.3 + seed) * 0.6 + Math.sin(t * 2.7 + seed * 2.1) * 0.3 + Math.sin(t * 5.1 + seed * 3.7) * 0.1;

// ---------------- 镜头协议 ----------------
export interface Env {
  quality: SceneOptions["quality"];
  /** 作品绝对时间的鼓点冲击 0..1 */
  pulse(absTime: number): number;
  /** 镜头在时间轴上的起点；beat(t) = pulse(start + t) */
  start: number;
  beat(t: number): number;
}
export interface Shot {
  draw(ctx: CanvasRenderingContext2D, t: number): void;
  dispose?(): void;
}
export type ShotFactory = (env: Env) => Shot | Promise<Shot>;

export async function makeEnv(quality: SceneOptions["quality"]): Promise<Env> {
  const env = await analyzeSong();
  const pulse = (t: number) => {
    if (!env) return 0;
    return env.pulse[clamp(Math.floor(t * ENV_FPS), 0, env.pulse.length - 1)];
  };
  return { quality, start: 0, pulse, beat: pulse };
}

/** 把一个镜头包装成 scene 图层；absStart 是它在时间轴上的预定起点（用于对齐鼓点） */
export async function createShotScene(options: SceneOptions, factory: ShotFactory, absStart: number): Promise<Scene> {
  const { width: W, height: H } = options;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const env = await makeEnv(options.quality);
  const shot = await factory({ ...env, start: absStart, beat: (t) => env.pulse(absStart + t) });
  await loadFonts();
  const s = W / DW;
  return {
    canvas,
    render(t) {
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      // 入镜：轻微的推镜冲击
      // 第一个镜头不推（保证片尾回到第一帧时完全一致）
      const k = absStart > 0 ? 1 + 0.06 * (1 - easeOut(t / 0.22)) : 1;
      if (k > 1.0005) {
        ctx.translate(DW / 2, DH / 2);
        ctx.scale(k, k);
        ctx.translate(-DW / 2, -DH / 2);
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, DW, DH);
      shot.draw(ctx, t);
    },
    dispose() {
      shot.dispose?.();
      canvas.width = canvas.height = 1;
    },
  };
}

let fontsReady: Promise<void> | null = null;
export function loadFonts() {
  fontsReady ??= (async () => {
    try {
      await Promise.all([
        document.fonts.load(`900 80px ${SERIF}`, "妈妈一百岁"),
        document.fonts.load(`400 80px ${SERIF}`, "妈妈一百岁"),
        document.fonts.load(`500 40px ${SANS}`, "妈妈吃饭了没"),
        document.fonts.load(`700 40px ${SANS}`, "妈妈吃饭了没"),
      ]);
    } catch { /* 回退字体 */ }
  })();
  return fontsReady;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  let p = imageCache.get(src);
  if (!p) {
    p = (async () => {
      const img = new Image();
      img.src = assetUrl(src);
      await img.decode();
      return img;
    })();
    imageCache.set(src, p);
  }
  return p;
}

export function offscreen(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return { canvas: c, ctx: c.getContext("2d")! };
}

// ---------------- 音频分析：歌曲低频冲击包络 ----------------
const ENV_FPS = 60;
interface Envelope { pulse: Float32Array; }
let envelope: Promise<Envelope | null> | null = null;
export function analyzeSong(): Promise<Envelope | null> {
  envelope ??= (async () => {
    try {
      const buf = await (await fetch(assetUrl(SONG))).arrayBuffer();
      const sr = 22050;
      const audio = await new OfflineAudioContext(1, sr, sr).decodeAudioData(buf);
      const chs = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
      const rate = audio.sampleRate;
      const hop = Math.round(rate / ENV_FPS);
      const n = Math.ceil(END * ENV_FPS) + 2;
      const bass = new Float32Array(n);
      const a = 1 - Math.exp((-2 * Math.PI * 140) / rate);
      let lp = 0;
      const start = Math.floor(SONG_OFFSET * rate);
      for (let i = 0; i < n; i++) {
        let eb = 0;
        for (let k = 0; k < hop; k++) {
          const idx = start + i * hop + k;
          let s = 0;
          for (const ch of chs) s += idx < ch.length ? ch[idx] : 0;
          lp += a * (s / chs.length - lp);
          eb += lp * lp;
        }
        bass[i] = Math.sqrt(eb / hop);
      }
      const onset = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let avg = 0, c = 0;
        for (let j = Math.max(0, i - 10); j < i; j++) { avg += bass[j]; c++; }
        onset[i] = Math.max(0, bass[i] - (c ? avg / c : bass[i]) * 1.15);
      }
      const sorted = Array.from(onset).sort((x, y) => x - y);
      const ref = sorted[Math.floor(sorted.length * 0.97)] || 1;
      const pulse = new Float32Array(n);
      const decay = Math.exp(-1 / (ENV_FPS * 0.13));
      for (let i = 0; i < n; i++) pulse[i] = Math.max(clamp(onset[i] / ref), i ? pulse[i - 1] * decay : 0);
      return { pulse };
    } catch (err) {
      console.warn("[mv] 音频分析失败", err);
      return null;
    }
  })();
  return envelope;
}

// ---------------- 绘图工具 ----------------
export type Pt = { x: number; y: number };

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function vgrad(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1, op: GlobalCompositeOperation = "lighter") {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.globalAlpha = clamp(alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number,
  o: { weight?: number; color?: string; align?: CanvasTextAlign; font?: string; alpha?: number; spacing?: number; shadow?: string; blur?: number; baseline?: CanvasTextBaseline } = {},
) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = `${o.weight ?? 700} ${Math.round(size)}px ${o.font ?? SERIF}`;
  ctx.fillStyle = o.color ?? PAPER;
  ctx.textAlign = o.align ?? "center";
  ctx.textBaseline = o.baseline ?? "middle";
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur ?? 12; }
  if (o.spacing) ctx.letterSpacing = `${o.spacing}px`;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** 逐字打出：返回已显示的前 n 个字 */
export const typed = (str: string, t: number, start: number, cps = 12) =>
  [...str].slice(0, Math.max(0, Math.floor((t - start) * cps))).join("");

export function rain(ctx: CanvasRenderingContext2D, t: number, o: { count: number; seed: number; alpha: number; len: number; speed: number; slant?: number; width?: number; color?: string; x0?: number; x1?: number; y0?: number; y1?: number }) {
  const r = seeded(o.seed);
  const x0 = o.x0 ?? 0, x1 = o.x1 ?? DW, y0 = o.y0 ?? 0, y1 = o.y1 ?? DH;
  const span = y1 - y0 + o.len;
  ctx.save();
  ctx.strokeStyle = o.color ?? "#ffffff";
  ctx.lineWidth = o.width ?? 2;
  ctx.lineCap = "round";
  const sl = o.slant ?? 0.12;
  for (let i = 0; i < o.count; i++) {
    const bx = r(), by = r(), sp = 0.7 + r() * 0.6, a = 0.4 + r() * 0.6;
    const y = y0 + ((by * span + t * o.speed * sp) % span) - o.len;
    const x = x0 + bx * (x1 - x0) + (y - y0) * sl;
    ctx.globalAlpha = o.alpha * a;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + o.len * sl, y + o.len);
    ctx.stroke();
  }
  ctx.restore();
}

/** 漂浮颗粒：花瓣 / 落叶 / 雪 / 灰尘 */
export function drift(ctx: CanvasRenderingContext2D, t: number, o: { count: number; seed: number; kind: "petal" | "leaf" | "snow" | "dust"; alpha: number; speed: number; color?: string; size?: number; wind?: number }) {
  const r = seeded(o.seed);
  ctx.save();
  ctx.fillStyle = o.color ?? "#fff";
  for (let i = 0; i < o.count; i++) {
    const bx = r(), by = r(), s = (0.5 + r()) * (o.size ?? 1), ph = r() * 10, sp = 0.6 + r() * 0.8;
    const y = ((by * (DH + 100) + t * o.speed * sp) % (DH + 100)) - 50;
    const x = ((bx * DW + Math.sin(t * 1.2 + ph) * 40 + t * (o.wind ?? 0) * sp) % (DW + 80) + DW + 80) % (DW + 80) - 40;
    ctx.globalAlpha = o.alpha * (0.5 + 0.5 * r());
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 2 * (r() - 0.5) + ph);
    ctx.beginPath();
    if (o.kind === "snow" || o.kind === "dust") ctx.arc(0, 0, 4 * s, 0, Math.PI * 2);
    else if (o.kind === "petal") ctx.ellipse(0, 0, 9 * s, 5 * s, 0, 0, Math.PI * 2);
    else { ctx.ellipse(0, 0, 14 * s, 6 * s, 0, 0, Math.PI * 2); }
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function bubble(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, o: { side: "left" | "right"; p: number; size?: number; bg?: string; color?: string; maxW?: number }) {
  if (o.p <= 0) return;
  const size = o.size ?? 40;
  ctx.save();
  ctx.font = `500 ${size}px ${SANS}`;
  const w = Math.min(ctx.measureText(str).width, o.maxW ?? 9999) + size * 1.1;
  const h = size * 1.9;
  const e = easeOut(o.p);
  const ax = o.side === "left" ? x : x - w;
  ctx.translate(o.side === "left" ? x : x, y + h / 2);
  ctx.scale(mix(0.6, 1, e), mix(0.6, 1, e));
  ctx.translate(-(o.side === "left" ? x : x), -(y + h / 2));
  ctx.globalAlpha *= clamp(o.p * 3);
  ctx.fillStyle = o.bg ?? "#ffffff";
  roundRect(ctx, ax, y, w, h, h * 0.32);
  ctx.fill();
  // 小尾巴
  ctx.beginPath();
  if (o.side === "left") { ctx.moveTo(ax + 6, y + h * 0.35); ctx.lineTo(ax - 14, y + h * 0.5); ctx.lineTo(ax + 6, y + h * 0.65); }
  else { ctx.moveTo(ax + w - 6, y + h * 0.35); ctx.lineTo(ax + w + 14, y + h * 0.5); ctx.lineTo(ax + w - 6, y + h * 0.65); }
  ctx.fill();
  ctx.fillStyle = o.color ?? "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(str, ax + size * 0.55, y + h / 2 + 1);
  ctx.restore();
}

// ---------------- 人物剪影 ----------------
export interface Person {
  x: number; y: number; h: number; dir?: number;
  child?: number; // 1 = 幼儿比例，0 = 成人
  mom?: boolean; // 发髻 + 裙子
  walk?: number; // 步态相位（弧度）；不给 = 站立
  stride?: number;
  stoop?: number; // 驼背 0..1
  sit?: number; // 坐下 0..1
  head?: number; // 低头（弧度，正值向下）
  lean?: number;
  handF?: Pt | null; handB?: Pt | null; // 手的世界坐标目标
  armF?: number; armB?: number; // 无目标时手臂角度（0 下垂，正值向前）
  color?: string; hair?: string; cane?: boolean;
  earF?: boolean; // 前手拿手机贴在耳边
}

function ik(S: Pt, T: Pt, l1: number, l2: number, bend: number): [Pt, Pt] {
  let dx = T.x - S.x, dy = T.y - S.y;
  let d = Math.hypot(dx, dy);
  const maxD = (l1 + l2) * 0.999;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  d = Math.max(d, 1e-3);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ea = a + b * bend;
  return [{ x: S.x + Math.cos(ea) * l1, y: S.y + Math.sin(ea) * l1 }, { x: S.x + dx, y: S.y + dy }];
}
const dirPt = (o: Pt, ang: number, len: number): Pt => ({ x: o.x + Math.sin(ang) * len, y: o.y + Math.cos(ang) * len });

/** 侧面剪影人物，脚底在 (x, y)，面朝 dir（1 向右） */
export function drawPerson(ctx: CanvasRenderingContext2D, p: Person) {
  const c = p.child ?? 0, h = p.h, dir = p.dir ?? 1;
  const headR = h * mix(0.068, 0.105, c);
  const legL = h * mix(0.48, 0.38, c);
  const thigh = legL * 0.52, shin = legL * 0.5;
  const torso = h * mix(0.3, 0.26, c);
  const neck = h * 0.03;
  const upper = h * mix(0.17, 0.15, c), fore = h * mix(0.165, 0.14, c);
  const legW = h * mix(0.07, 0.085, c), armW = h * mix(0.052, 0.065, c), bodyW = h * mix(0.15, 0.18, c);
  const stoop = p.stoop ?? 0, sit = p.sit ?? 0;
  const col = p.color ?? INK;
  const stride = p.stride ?? 1;

  // 腿
  const legAngles = (ph: number | undefined, side: number) => {
    let a1 = 0.03 * side, a2 = 0.03 * side;
    if (ph !== undefined) {
      const s = Math.sin(ph + (side > 0 ? 0 : Math.PI));
      const cph = Math.cos(ph + (side > 0 ? 0 : Math.PI));
      a1 = 0.45 * s * stride;
      a2 = a1 - 0.55 * Math.max(0, cph) * stride;
    }
    a1 = mix(a1, Math.PI / 2 - 0.08 + side * 0.03, sit);
    a2 = mix(a2, 0.08 + side * 0.05, sit);
    return [a1, a2];
  };
  const hip0: Pt = { x: 0, y: 0 };
  const legs = [1, -1].map((side) => {
    const [a1, a2] = legAngles(p.walk, side);
    const knee = dirPt(hip0, a1, thigh);
    const foot = dirPt(knee, a2, shin);
    return { knee, foot };
  });
  const dy = -Math.max(legs[0].foot.y, legs[1].foot.y); // 让较低的脚着地
  const hip: Pt = { x: 0, y: dy };
  const ta = stoop * 0.75 + sit * 0.12 + (p.lean ?? 0) + (p.walk !== undefined ? 0.05 : 0);
  const shoulder: Pt = { x: Math.sin(ta) * torso, y: dy - Math.cos(ta) * torso };
  const ha = ta + stoop * 0.35 + (p.head ?? 0);
  const headC: Pt = { x: shoulder.x + Math.sin(ha) * (neck + headR) + headR * 0.12, y: shoulder.y - Math.cos(ha) * (neck + headR) };

  const toLocal = (q: Pt): Pt => ({ x: (q.x - p.x) * dir, y: q.y - p.y });
  const arm = (target: Pt | null | undefined, ang: number) => {
    if (target) return ik(shoulder, toLocal(target), upper, fore, 1);
    const e = dirPt(shoulder, ang, upper);
    return [e, dirPt(e, ang + 0.3, fore)] as [Pt, Pt];
  };
  const swing = p.walk !== undefined ? 0.5 * Math.sin(p.walk) * stride : 0;
  const armF = p.earF
    ? ik(shoulder, { x: headC.x - headR * 0.15, y: headC.y + headR * 0.45 }, upper, fore, 1)
    : arm(p.handF, p.armF ?? -swing + 0.08);
  const armB = arm(p.handB, p.armB ?? swing - 0.05);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(dir, 1);
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const limb = (a: Pt, b: Pt, cc: Pt, w: number) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(cc.x, cc.y);
    ctx.stroke();
  };
  for (const L of legs) {
    limb(hip, { x: L.knee.x, y: L.knee.y + dy }, { x: L.foot.x, y: L.foot.y + dy }, legW);
    // 脚
    ctx.beginPath();
    ctx.ellipse(L.foot.x + legW * 0.45, L.foot.y + dy - legW * 0.2, legW * 0.75, legW * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  limb(shoulder, armB[0], armB[1], armW);
  // 躯干
  ctx.lineWidth = bodyW;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y - bodyW * 0.15);
  ctx.lineTo(shoulder.x, shoulder.y + bodyW * 0.25);
  ctx.stroke();
  if (p.mom && sit < 0.5) {
    ctx.beginPath();
    ctx.moveTo(hip.x - bodyW * 0.45 + shoulder.x * 0.15, hip.y - torso * 0.25);
    ctx.lineTo(hip.x + bodyW * 0.45 + shoulder.x * 0.15, hip.y - torso * 0.25);
    ctx.lineTo(hip.x + bodyW * 0.95, hip.y + thigh * 0.95);
    ctx.lineTo(hip.x - bodyW * 0.85, hip.y + thigh * 0.95);
    ctx.closePath();
    ctx.fill();
  }
  // 脖子 + 头
  ctx.lineWidth = headR * 0.7;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(headC.x - headR * 0.1, headC.y + headR * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headC.x, headC.y, headR, 0, Math.PI * 2);
  ctx.fill();
  // 鼻子
  ctx.beginPath();
  ctx.arc(headC.x + Math.cos(ha) * headR * 0.92, headC.y + Math.sin(ha) * headR * 0.92 + headR * 0.08, headR * 0.2, 0, Math.PI * 2);
  ctx.fill();
  if (p.mom) {
    ctx.fillStyle = p.hair ?? col;
    ctx.beginPath();
    ctx.arc(headC.x - Math.cos(ha) * headR * 0.85 + Math.sin(ha) * headR * 0.35, headC.y - Math.sin(ha) * headR * 0.85 - Math.cos(ha) * headR * 0.35, headR * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
  } else if (c > 0.5) {
    // 小孩的呆毛
    ctx.lineWidth = headR * 0.14;
    ctx.beginPath();
    ctx.moveTo(headC.x - headR * 0.1, headC.y - headR * 0.95);
    ctx.quadraticCurveTo(headC.x + headR * 0.1, headC.y - headR * 1.5, headC.x + headR * 0.45, headC.y - headR * 1.3);
    ctx.stroke();
  }
  limb(shoulder, armF[0], armF[1], armW);
  for (const hand of [armF[1], armB[1]]) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, armW * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.earF) {
    ctx.save();
    ctx.translate(armF[1].x, armF[1].y);
    ctx.rotate(-ha - 0.3);
    roundRect(ctx, -headR * 0.18, -headR * 0.75, headR * 0.36, headR * 0.9, headR * 0.08);
    ctx.fill();
    ctx.restore();
  }
  if (p.cane) {
    ctx.lineWidth = armW * 0.35;
    ctx.beginPath();
    ctx.moveTo(armF[1].x, armF[1].y - armW * 0.3);
    ctx.lineTo(armF[1].x + h * 0.04, 0);
    ctx.stroke();
  }
  ctx.restore();
  const world = (q: Pt): Pt => ({ x: p.x + q.x * dir, y: p.y + q.y });
  return { head: world(headC), headR, shoulder: world(shoulder), handF: world(armF[1]), handB: world(armB[1]), hip: world(hip) };
}

/** 摄像机：以 (fx, fy) 为焦点缩放并放到画面 (cx, cy) */
export function camera(ctx: CanvasRenderingContext2D, zoom: number, fx: number, fy: number, cx = DW / 2, cy = DH / 2, rot = 0) {
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-fx, -fy);
}

/** 画面级的鼓点抖动 */
export function shake(ctx: CanvasRenderingContext2D, t: number, amount: number) {
  if (amount <= 0.01) return;
  const f = Math.floor(t * 30);
  ctx.translate((hash(f + 0.3) - 0.5) * amount, (hash(f + 7.9) - 0.5) * amount);
}

// 一只手的剪影（手背朝上），wrinkle 为皱纹强度
export function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number, o: { wrinkle?: number; curl?: number; color?: string; arm?: boolean; mirror?: boolean; small?: boolean } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s * (o.mirror ? -1 : 1), s);
  const col = o.color ?? "#121110";
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineCap = "round";
  if (o.arm !== false) {
    ctx.lineWidth = 150;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(0, 900);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 92, 110, 0, 0, Math.PI * 2);
  ctx.fill();
  const curl = o.curl ?? 0;
  const fingers = [[-58, 150, -0.12], [-20, 175, -0.03], [20, 168, 0.04], [56, 135, 0.13]];
  ctx.lineWidth = 40;
  for (const [fx, len, a] of fingers) {
    const l = len * (1 - curl * 0.55);
    ctx.beginPath();
    ctx.moveTo(fx, -60);
    ctx.lineTo(fx + Math.sin(a) * l, -60 - Math.cos(a) * l);
    ctx.stroke();
  }
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(-70, 20);
  ctx.lineTo(-150 + curl * 50, -60);
  ctx.stroke();
  const w = o.wrinkle ?? 0;
  if (w > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${0.32 * w})`;
    ctx.lineWidth = 2.2;
    for (const [fx, len, a] of fingers) {
      for (const k of [0.45, 0.75]) {
        const px = fx + Math.sin(a) * len * k * (1 - curl * 0.55), py = -60 - Math.cos(a) * len * k * (1 - curl * 0.55);
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath();
          ctx.moveTo(px - 13, py + j * 6);
          ctx.quadraticCurveTo(px, py + j * 6 + 4, px + 13, py + j * 6);
          ctx.stroke();
        }
      }
    }
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-60, -20 + i * 18);
      ctx.bezierCurveTo(-20, -10 + i * 18, 20, -30 + i * 18, 60, -14 + i * 18);
      ctx.stroke();
    }
    // 青筋
    ctx.strokeStyle = `rgba(255,255,255,${0.18 * w})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, 100);
    ctx.bezierCurveTo(-30, 40, 10, 0, -10, -50);
    ctx.stroke();
  }
  ctx.restore();
}


/** 手机来电横幅（开头钩子 & 结尾循环用同一个）。ring 振动强度，press 按下拒绝，missed 变成未接来电 */
export function drawCallBanner(ctx: CanvasRenderingContext2D, t: number, o: { y: number; ring: number; press?: number; missed?: number; alpha?: number }) {
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const missed = o.missed ?? 0, press = o.press ?? 0;
  const x = 60, w = DW - 120, h = 190, y = o.y;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(Math.sin(t * 95) * 9 * o.ring, 0);
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "rgba(28,28,30,0.92)";
  roundRect(ctx, x, y, w, h, 48);
  ctx.fill();
  ctx.shadowBlur = 0;
  // 头像
  ctx.fillStyle = "#8f8a80";
  ctx.beginPath();
  ctx.arc(x + 100, y + h / 2, 56, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "妈", x + 100, y + h / 2 + 2, 56, { weight: 900, color: "#fff" });
  text(ctx, "妈妈", x + 186, y + 66, 46, { font: SANS, weight: 700, color: "#fff", align: "left" });
  ctx.save();
  ctx.globalAlpha *= 1 - missed;
  text(ctx, "邀请你语音通话…", x + 186, y + 128, 32, { font: SANS, weight: 400, color: "#b9b9b9", align: "left" });
  ctx.restore();
  if (missed > 0) {
    ctx.save();
    ctx.globalAlpha *= missed;
    text(ctx, "未接来电 (3)", x + 186, y + 128, 34, { font: SANS, weight: 600, color: RED, align: "left" });
    ctx.restore();
  }
  // 拒绝 / 接听
  const btn = (bx: number, col: string, rot: number, scale: number, alpha: number) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(bx, y + h / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    // 听筒
    ctx.rotate(rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 16, 24, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 21, 6, 9, 6, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  const fade = 1 - missed;
  btn(x + w - 230, RED, Math.PI * 0.78, 1 + press * 0.25 - press * press * 0.35, fade);
  btn(x + w - 100, "#34c759", 0, 1 + Math.sin(t * 12) * 0.05 * o.ring, fade);
  ctx.restore();
}
