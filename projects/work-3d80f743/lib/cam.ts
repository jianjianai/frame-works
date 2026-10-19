// 镜头：世界里的一点 (x, y) 放在画面中心 (540, 960)，z 倍，r 歪的角度。
// 远处的层（D > 1）按针孔相机投影：画面 = 中心 + (世界 − 镜头) · z / D，镜头平移时远处动得慢，推拉时一起缩放。

export const W = 1080;
export const H = 1920;

export interface Cam {
  x: number;
  y: number;
  z: number;
  r: number;
}

/** 把世界里的点 (px, py) 放到画面上的 (sx, sy)，z 倍 */
export const aim = (px: number, py: number, sx: number, sy: number, z: number, r = 0): Cam => ({ x: px - (sx - W / 2) / z, y: py - (sy - H / 2) / z, z, r });

/** 两个取景之间：倍数按对数插值；倍数差得多时位置按「看得见的范围」走（推近时位置早到，拉远时晚动） */
export function camLerp(a: Cam, b: Cam, e: number): Cam {
  const z = a.z * Math.pow(b.z / a.z, e);
  let w = e;
  if (Math.abs(Math.log(b.z / a.z)) > 0.08) w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z, r: a.r + (b.r - a.r) * e };
}

/** 世界里的点在画面上的位置（D 是那一层的远近） */
export const toScreen = (c: Cam, x: number, y: number, D = 1): [number, number] => [W / 2 + ((x - c.x) * c.z) / D, H / 2 + ((y - c.y) * c.z) / D];

/** 画这一层之前：设好变换（base 是设计坐标到画布像素的缩放） */
export function applyCam(ctx: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, D = 1, sh: [number, number] = [0, 0]) {
  ctx.setTransform(base);
  ctx.translate(W / 2 + sh[0], H / 2 + sh[1]);
  if (c.r) ctx.rotate(c.r);
  const s = c.z / D;
  ctx.scale(s, s);
  ctx.translate(-c.x, -c.y);
}

/** 这一层在画面里看得见的世界范围（留一点边，歪着、抖着的时候也够） */
export function viewOf(c: Cam, D = 1, margin = 1.2) {
  const hw = ((W / 2) * D * margin) / c.z;
  const hh = ((H / 2) * D * margin) / c.z;
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
