// 镜头：世界里的一点 (x, y) 放在画面中心，z 倍，r 歪的角度。
// 远处的层（D > 1）按针孔相机投影：画面 = 中心 + (世界 − 镜头) · z / D，镜头平移时远处动得慢，推拉时一起缩放。
//
// 两种画面（2026-10-30 加 B 站横屏）：
// - 取景都按竖屏 1080×1920 写（VW × VH）：aim 的画面位置、构图、toScreenV 都是竖屏画面上的；
// - 画、投影、剔除按这条时间轴的画面（W × H：竖屏 1080×1920，横屏 1920×1080）。
// 横屏时每个镜头在画之前过一道「横屏镜头」（setLens，镜头设计在 lib/wide.ts）：把竖屏的取景换成横屏的。
// 竖屏没有 lens，W、H 就是 VW、VH，算出来和原来一模一样。

import { timeline } from "@frame/engine/timeline";

/** 竖屏的设计画面（取景按它写） */
export const VW = 1080;
export const VH = 1920;
/** 这条时间轴的画面（设计像素）：画、投影、剔除按它 */
export let W = VW;
export let H = VH;
/** 横屏（B 站版） */
export let LANDSCAPE = false;

/**
 * 按这个场景实际画的画布设画面尺寸（每个场景的 createScene 开头调，传 SceneOptions 的 width、height）。
 * 按画布的横竖判断，不读 timeline()：静帧（封面）里按竖屏 1080×1920 画成片的一帧时，工作台可能正开着横屏那条时间轴
 */
export function syncFrame(width: number, height: number) {
  LANDSCAPE = width > height;
  if (!LANDSCAPE) {
    W = VW;
    H = VH;
    lens = null;
    return;
  }
  // 横的画布：时间轴也是横的就用它的设计尺寸（B 站 1920×1080）；不是（竖的时间轴上画横的静帧）按画布的比例，高 1080
  const tl = timeline();
  if (tl.width > tl.height) {
    W = tl.width;
    H = tl.height;
  } else {
    H = 1080;
    W = Math.round((1080 * width) / height);
  }
}

export interface Cam {
  x: number;
  y: number;
  z: number;
  r: number;
  /** 已经是这条时间轴画面上的镜头（横屏镜头换算过的） */
  o?: boolean;
}

/** 横屏镜头：竖屏的取景 → 横屏的（null：原样） */
let lens: ((c: Cam) => Cam) | null = null;
/** 这一镜（这一帧）用的横屏镜头；竖屏不起作用 */
export function setLens(f: ((c: Cam) => Cam) | null) {
  lens = LANDSCAPE ? f : null;
}
export const getLens = () => lens;
/** 画面上真正用的镜头 */
export const lensOf = (c: Cam): Cam => (lens && !c.o ? lens(c) : c);

/**
 * 横屏把竖屏画面当成一张底片重新取景：竖屏画面按 k 倍缩放，竖屏的画面中心落在横屏画面的 (W/2 + ox, H/2 + oy)；
 * r 再多歪一点。偏移按画面像素算：两个倍数不同的镜头（溶镜头两边）用同一组 k、ox、oy，画面上对得上的东西还对得上。
 */
export interface Reframe {
  k: number;
  ox: number;
  oy: number;
  r?: number;
}
export function reframe(c: Cam, f: Reframe): Cam {
  const z = c.z * f.k;
  const cr = Math.cos(c.r || 0);
  const sr = Math.sin(c.r || 0);
  // 画面 = R(r)·(世界 − 镜头)·z → 世界 = 镜头 + R(−r)·画面 / z；横屏画面中心在竖屏中心的 (−ox, −oy)
  const dx = -f.ox;
  const dy = -f.oy;
  return { x: c.x + (dx * cr + dy * sr) / z, y: c.y + (-dx * sr + dy * cr) / z, z, r: (c.r || 0) + (f.r ?? 0), o: true };
}

/** 把世界里的点 (px, py) 放到竖屏画面上的 (sx, sy)，z 倍 */
export const aim = (px: number, py: number, sx: number, sy: number, z: number, r = 0): Cam => ({ x: px - (sx - VW / 2) / z, y: py - (sy - VH / 2) / z, z, r });

/** 横屏镜头里用：把世界里的点放到这条时间轴画面上的 (sx, sy)（不再换算） */
export const aimO = (px: number, py: number, sx: number, sy: number, z: number, r = 0): Cam => ({ x: px - (sx - W / 2) / z, y: py - (sy - H / 2) / z, z, r, o: true });

/** 两个取景之间：倍数按对数插值；倍数差得多时位置按「看得见的范围」走（推近时位置早到，拉远时晚动） */
export function camLerp(a: Cam, b: Cam, e: number): Cam {
  const z = a.z * Math.pow(b.z / a.z, e);
  let w = e;
  if (Math.abs(Math.log(b.z / a.z)) > 0.08) w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  const c: Cam = { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z, r: a.r + (b.r - a.r) * e };
  if (a.o) c.o = true;
  return c;
}

/** 世界里的点在画面上的位置（D 是那一层的远近；含镜头旋转；横屏按横屏镜头） */
export const toScreen = (c0: Cam, x: number, y: number, D = 1): [number, number] => {
  const c = lensOf(c0);
  const dx = ((x - c.x) * c.z) / D;
  const dy = ((y - c.y) * c.z) / D;
  if (!c.r) return [W / 2 + dx, H / 2 + dy];
  const cr = Math.cos(c.r);
  const sr = Math.sin(c.r);
  return [W / 2 + dx * cr - dy * sr, H / 2 + dx * sr + dy * cr];
};

/** 取景用：世界里的点在竖屏画面上的位置（不换算成横屏） */
export const toScreenV = (c: Cam, x: number, y: number, D = 1): [number, number] => {
  const dx = ((x - c.x) * c.z) / D;
  const dy = ((y - c.y) * c.z) / D;
  if (!c.r) return [VW / 2 + dx, VH / 2 + dy];
  const cr = Math.cos(c.r);
  const sr = Math.sin(c.r);
  return [VW / 2 + dx * cr - dy * sr, VH / 2 + dx * sr + dy * cr];
};

/** 画这一层之前：设好变换（base 是设计坐标到画布像素的缩放） */
export function applyCam(ctx: CanvasRenderingContext2D, base: DOMMatrix, c0: Cam, D = 1, sh: [number, number] = [0, 0]) {
  const c = lensOf(c0);
  ctx.setTransform(base);
  ctx.translate(W / 2 + sh[0], H / 2 + sh[1]);
  if (c.r) ctx.rotate(c.r);
  const s = c.z / D;
  ctx.scale(s, s);
  ctx.translate(-c.x, -c.y);
}

/** 这一层在画面里看得见的世界范围（留一点边，歪着、抖着的时候也够） */
export function viewOf(c0: Cam, D = 1, margin = 1.2) {
  const c = lensOf(c0);
  // 画面转着的时候（⑫ 跟着她转 180°），转过去的画面要的世界范围更大
  const cr = Math.abs(Math.cos(c.r || 0));
  const sr = Math.abs(Math.sin(c.r || 0));
  const hw = (((W / 2) * cr + (H / 2) * sr) * D * margin) / c.z;
  const hh = (((H / 2) * cr + (W / 2) * sr) * D * margin) / c.z;
  return { x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh };
}

// ——— 速度曲线 ———
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ph = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const E = {
  io: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in2: (x: number) => x * x,
  soft: (x: number) => x * x * (3 - 2 * x),
  /** 柔和起步、一路减速（上一镜已经停住时接它） */
  settle: (x: number) => 1 - Math.pow(1 - x, 3) * (1 + 3 * x),
};

/** 抖：k 是强度（像素），按时间确定 */
export function shake(t: number, k: number): [number, number] {
  if (k < 0.01) return [0, 0];
  return [k * (Math.sin(t * 71.3) * 0.6 + Math.sin(t * 43.1 + 1.3) * 0.4), k * (Math.sin(t * 63.7 + 2.1) * 0.6 + Math.sin(t * 37.9) * 0.4)];
}

/** 一惊：从 t0 起按 decay 秒衰减 */
export const kick = (t: number, t0: number, decay = 0.1) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay));

/**
 * 转着甩的拖影（⑫ → 副歌一的转场）：把这一帧绕画面中间转着叠几层（ang：快门时间里画面转过的角度，弧度）。
 * buf / bctx：和画布一样大的暂存画布
 */
export function spinBlur(ctx: CanvasRenderingContext2D, buf: HTMLCanvasElement, bctx: CanvasRenderingContext2D, ang: number) {
  if (Math.abs(ang) < 0.006) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.clearRect(0, 0, w, h);
  bctx.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  const n = 9;
  for (let i = 1; i < n; i++) {
    ctx.globalAlpha = 1 / (i + 1);
    ctx.setTransform(1, 0, 0, 1, w / 2, h / 2);
    ctx.rotate((i / (n - 1) - 0.5) * Math.min(0.5, ang));
    ctx.drawImage(buf, -w / 2, -h / 2);
  }
  ctx.restore();
}
