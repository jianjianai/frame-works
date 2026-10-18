// 《引力》草稿的基础工具：设计坐标 1080×1920、缓动、镜头、离屏缓冲、文字、颗粒和暗角。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { clamp, mix, easeInOut, seeded } from "@frame/engine/math";

export { clamp, mix, seeded };
export const W = 1080;
export const H = 1920;
export type C = CanvasRenderingContext2D;

// ---------- 缓动 ----------
export const ph = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6));
export const E = {
  lin: (x: number) => clamp(x),
  io: (x: number) => easeInOut(clamp(x)),
  out: (x: number) => 1 - Math.pow(1 - clamp(x), 3),
  out2: (x: number) => 1 - Math.pow(1 - clamp(x), 2),
  in: (x: number) => Math.pow(clamp(x), 3),
  in2: (x: number) => Math.pow(clamp(x), 2),
  pow: (x: number) => Math.pow(clamp(x), 2.3),
  // 柔和起步、一路减速
  soft: (x: number) => {
    const v = clamp(x);
    return 1 - Math.pow(1 - v, 3) * (1 + 3 * v);
  },
  back: (x: number) => {
    const v = clamp(x) - 1;
    return 1 + v * v * (2.4 * v + 1.4);
  },
};
export type Ease = (x: number) => number;

/** 一惊：at 之后按 decay 秒衰减的 1→0 */
export const kick = (t: number, at: number, decay = 0.1) => (t < at ? 0 : Math.exp(-(t - at) / decay));
export function shake(t: number, amp: number, seed = 1): [number, number] {
  return [
    (Math.sin(t * 91.3 + seed) * 0.7 + Math.sin(t * 57.1 + seed * 2.1) * 0.3) * amp,
    (Math.cos(t * 83.7 + seed * 3.3) * 0.7 + Math.sin(t * 41.9 + seed) * 0.3) * amp,
  ];
}

export type Key = [number, number, Ease?];
/** 关键帧：[时间, 值, 这一段的缓动] */
export function kf(t: number, ks: Key[]): number {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0, e] = ks[i];
    const [t1, v1] = ks[i + 1];
    if (t <= t1) {
      const x = (t - t0) / (t1 - t0 || 1e-6);
      return v0 + (v1 - v0) * (e ? e(x) : x);
    }
  }
  return ks[ks.length - 1][1];
}

// ---------- 镜头：世界坐标 (x, y) 放在画面 (sx, sy)，缩放 z，旋转 r ----------
export interface Cam {
  x: number;
  y: number;
  z: number;
  r?: number;
  sx?: number;
  sy?: number;
}
export function applyCam(c: C, k: Cam) {
  c.translate(k.sx ?? W / 2, k.sy ?? H / 2);
  if (k.r) c.rotate(k.r);
  c.scale(k.z, k.z);
  c.translate(-k.x, -k.y);
}
export function camLerp(a: Cam, b: Cam, e: number): Cam {
  return {
    x: mix(a.x, b.x, e),
    y: mix(a.y, b.y, e),
    z: Math.exp(mix(Math.log(a.z), Math.log(b.z), e)),
    r: mix(a.r ?? 0, b.r ?? 0, e),
    sx: mix(a.sx ?? W / 2, b.sx ?? W / 2, e),
    sy: mix(a.sy ?? H / 2, b.sy ?? H / 2, e),
  };
}
export type CamKey = [number, Cam, Ease?];
export function kcam(t: number, ks: CamKey[]): Cam {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, a, e] = ks[i];
    const [t1, b] = ks[i + 1];
    if (t <= t1) return camLerp(a, b, (e ?? E.io)((t - t0) / (t1 - t0 || 1e-6)));
  }
  return ks[ks.length - 1][1];
}
export const sY = (k: Cam, wy: number) => (wy - k.y) * k.z + (k.sy ?? H / 2);
export const sX = (k: Cam, wx: number) => (wx - k.x) * k.z + (k.sx ?? W / 2);
/** 镜头加抖动 */
export const jolt = (k: Cam, d: [number, number]): Cam => ({ ...k, x: k.x + d[0] / k.z, y: k.y + d[1] / k.z });

// ---------- 渲染环境（每一幕一个） ----------
export interface Buf {
  canvas: HTMLCanvasElement;
  c: C;
}
export const env = {
  width: W,
  height: H,
  bufs: [] as Buf[],
  t: 0,
};
function makeBuf(): Buf {
  const canvas = document.createElement("canvas");
  canvas.width = env.width;
  canvas.height = env.height;
  return { canvas, c: canvas.getContext("2d")! };
}
/** 取第 i 个离屏缓冲，清空并设好设计坐标 */
export function buf(i: number): Buf {
  while (env.bufs.length <= i) env.bufs.push(makeBuf());
  const b = env.bufs[i];
  if (b.canvas.width !== env.width || b.canvas.height !== env.height) {
    b.canvas.width = env.width;
    b.canvas.height = env.height;
  }
  b.c.setTransform(1, 0, 0, 1, 0, 0);
  b.c.globalAlpha = 1;
  b.c.globalCompositeOperation = "source-over";
  b.c.filter = "none";
  b.c.clearRect(0, 0, env.width, env.height);
  b.c.setTransform(env.width / W, 0, 0, env.height / H, 0, 0);
  return b;
}
/** 把缓冲按设计坐标整幅画回去 */
export function blit(c: C, b: Buf, alpha = 1, filter = "none") {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  if (filter !== "none") c.filter = filter;
  c.drawImage(b.canvas, 0, 0);
  c.restore();
}
/** 两个画面交叉溶解：先画 A，再把 B 以 e 的透明度盖上 */
export function dissolve(c: C, e: number, a: (c: C) => void, b: (c: C) => void, slot = 0) {
  if (e <= 0) return a(c);
  if (e >= 1) return b(c);
  a(c);
  const B = buf(slot);
  b(B.c);
  blit(c, B, e);
}
/** 竖向动态模糊（甩镜） */
export function smearV(c: C, amount: number, draw: (c: C) => void, slot = 1) {
  if (amount < 2) return draw(c);
  const B = buf(slot);
  draw(B.c);
  const n = 7;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const px = (amount * env.height) / H;
  for (let i = 0; i < n; i++) {
    c.globalAlpha = i === 0 ? 1 : 0.42;
    c.drawImage(B.canvas, 0, ((i - (n - 1) / 2) * px) / n);
  }
  c.restore();
}

/** 横向动态模糊（横着甩镜） */
export function smearH(c: C, amount: number, draw: (c: C) => void, slot = 2) {
  if (amount < 2) return draw(c);
  const B = buf(slot);
  draw(B.c);
  const n = 7;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const px = (amount * env.width) / W;
  for (let i = 0; i < n; i++) {
    c.globalAlpha = i === 0 ? 1 : 0.42;
    c.drawImage(B.canvas, ((i - (n - 1) / 2) * px) / n, 0);
  }
  c.restore();
}

// ---------- 画面整体 ----------
export function fill(c: C, color: string, alpha = 1) {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(0, 0, env.width, env.height);
  c.restore();
}
export function vignette(c: C, a0: number, inner = 420, outer = 1250, color = "92,66,104") {
  // 新画风：暗角很轻，带一点暖紫（不压抑）
  const a = a0 * 0.38;
  if (a <= 0) return;
  const g = c.createRadialGradient(W / 2, H / 2, inner, W / 2, H / 2, outer);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${a})`);
  c.save();
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.restore();
}
export function flash(c: C, a: number, color = "#ffffff") {
  if (a > 0.003) fill(c, color, clamp(a));
}

let grainTiles: HTMLCanvasElement[] = [];
function makeGrain() {
  const rnd = seeded(99);
  grainTiles = [0, 1, 2, 3].map(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + rnd() * 140;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  });
}
export function grain(c: C, t: number, a = 0.05) {
  if (!grainTiles.length) makeGrain();
  const f = Math.floor(t * 24);
  const tile = grainTiles[f % 4];
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = a;
  c.globalCompositeOperation = "overlay";
  const ox = (f * 73) % 256;
  const oy = (f * 151) % 256;
  for (let y = -oy; y < env.height; y += 256) for (let x = -ox; x < env.width; x += 256) c.drawImage(tile, x, y);
  c.restore();
}

// ---------- 文字 ----------
export const FONT = '"YinliSerif", "Noto Serif CJK SC", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif';
let fontLoaded: Promise<void> | null = null;
export function loadFont() {
  fontLoaded ??= (async () => {
    try {
      const f = new FontFace("YinliSerif", `url(${assetUrl("films/work-3d80f743/fonts/yinli-serif.woff2")})`);
      document.fonts.add(await f.load());
    } catch {
      /* 缺字时用系统字体 */
    }
  })();
  return fontLoaded;
}
export interface TextOpt {
  color?: string;
  alpha?: number;
  align?: CanvasTextAlign;
  weight?: number;
  shadow?: number;
  rot?: number;
  base?: CanvasTextBaseline;
}
export function text(c: C, s: string, x: number, y: number, size: number, o: TextOpt = {}) {
  if ((o.alpha ?? 1) <= 0.003) return;
  c.save();
  c.globalAlpha *= clamp(o.alpha ?? 1);
  c.translate(x, y);
  if (o.rot) c.rotate(o.rot);
  c.font = `${o.weight ?? 600} ${size}px ${FONT}`;
  c.textAlign = o.align ?? "center";
  c.textBaseline = o.base ?? "middle";
  if (o.shadow) {
    c.lineJoin = "round";
    c.strokeStyle = "rgba(62,49,73,0.78)";
    c.lineWidth = Math.max(5, size * 0.15);
    c.strokeText(s, 0, 0);
    c.shadowColor = "rgba(62,49,73,0.55)";
    c.shadowBlur = o.shadow;
  }
  c.fillStyle = o.color ?? "#fffaf2";
  c.fillText(s, 0, 0);
  c.restore();
}
/** 画面上的说明字：两行以内，淡入淡出，带一条细线 */
export function caption(c: C, lines: string[], t: number, a: number, b: number, y = 300, size = 64) {
  const al = Math.min(ph(t, a, a + 0.35), 1 - ph(t, b - 0.35, b));
  if (al <= 0) return;
  const rise = (1 - E.out(ph(t, a, a + 0.5))) * 18;
  lines.forEach((s, i) => text(c, s, W / 2, y + i * size * 1.45 + rise, size, { alpha: al, shadow: 18, weight: 700 }));
}
/** 一个字一个字写出来（石子上的字） */
export function writeOn(s: string, p: number) {
  const n = Math.floor(clamp(p) * s.length + 1e-6);
  return s.slice(0, n);
}

// ---------- 每一幕的场景 ----------
export interface Shot {
  a: number;
  b: number;
  draw: (c: C, t: number, u: number) => void;
  /** 开头和上一个镜头交叉溶解的秒数（时间跳跃时用） */
  xin?: number;
}
export function makeAct(options: SceneOptions, start: number, shots: Shot[]): Promise<Scene> {
  const { width, height } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d")!;
  return loadFont().then(() => ({
    canvas,
    render(time: number) {
      env.width = width;
      env.height = height;
      const t = time + start;
      env.t = t;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
      c.filter = "none";
      c.fillStyle = "#e9dce6";
      c.fillRect(0, 0, width, height);
      c.setTransform(width / W, 0, 0, height / H, 0, 0);
      let i = 0;
      for (let q = 0; q < shots.length; q++) if (t >= shots[q].a) i = q;
      const shot = shots[i];
      const prev = shots[i - 1];
      const x = shot.xin && prev ? (t - shot.a) / shot.xin : 1;
      if (x < 1 && prev) {
        c.save();
        prev.draw(c, t, t - prev.a);
        c.restore();
        const B = buf(3);
        B.c.save();
        shot.draw(B.c, t, t - shot.a);
        B.c.restore();
        blit(c, B, easeInOut(clamp(x)));
      } else {
        c.save();
        shot.draw(c, t, t - shot.a);
        c.restore();
      }
      c.setTransform(width / W, 0, 0, height / H, 0, 0);
      grain(c, t);
    },
    dispose() {
      canvas.width = canvas.height = 1;
      for (const b of env.bufs) b.canvas.width = b.canvas.height = 1;
      env.bufs = [];
    },
  }));
}
