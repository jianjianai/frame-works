// 通用工具：向量、缓动、运镜关键帧、抖动、噪声。全部只依赖时间，可以任意跳转。

export interface V2 {
  x: number;
  y: number;
}
export const v = (x: number, y: number): V2 => ({ x, y });
export const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: V2, k: number): V2 => ({ x: a.x * k, y: a.y * k });
export const len = (a: V2) => Math.hypot(a.x, a.y);
export const dist = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.y - b.y);
export const dir = (angle: number): V2 => ({ x: Math.cos(angle), y: Math.sin(angle) });
export const lerpV = (a: V2, b: V2, p: number): V2 => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** t 在 a→b 之间从 0 到 1（两端截断）。 */
export const prog = (t: number, a: number, b: number) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
/** 角度插值走最短的方向。 */
export const lerpAngle = (a: number, b: number, p: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * p;
};

export type Ease = (p: number) => number;
export const E = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  inOut: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  /** 越推越慢 */
  out: (k = 3) => (p: number) => 1 - Math.pow(1 - p, k),
  /** 越推越快 */
  in: (k = 2.2) => (p: number) => Math.pow(p, k),
  /** 回弹：冲过一点再回来 */
  back: (s = 1.6) => (p: number) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
};

/** 一段时间内的包络：a 起、b 满、c 开始退、d 归零。 */
export const env = (t: number, a: number, b: number, c: number, d: number) =>
  t <= a || t >= d ? 0 : t < b ? E.smooth(prog(t, a, b)) : t <= c ? 1 : 1 - E.smooth(prog(t, c, d));

// ---------- 随机与噪声（固定种子） ----------
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const hash2 = (a: number, b: number) => hash(a * 57.31 + b * 113.17);
/** 平滑的一维噪声，输出 -1..1。 */
export const noise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 101.3) * 2 - 1;
  const b = hash(i + 1 + seed * 101.3) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

// ---------- 运镜 ----------
export interface Cam {
  x: number;
  y: number;
  /** 每个世界单位等于多少设计像素（设计画面 1080×1920） */
  z: number;
  /** 旋转（弧度），荷兰角 */
  r: number;
}
export interface CamKey extends Cam {
  t: number;
  /** 从这一帧到下一帧的缓动 */
  e: Ease;
}
export const K = (t: number, x: number, y: number, z: number, e: Ease = E.inOut, r = 0): CamKey => ({ t, x, y, z, r, e });

/** 分段关键帧：位置线性插值，缩放在对数空间插值（推拉的速度感一致）。 */
export function camPath(t: number, keys: CamKey[]): Cam {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < b.t) {
      const p = a.e(prog(t, a.t, b.t));
      return {
        x: lerp(a.x, b.x, p),
        y: lerp(a.y, b.y, p),
        z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)),
        r: lerp(a.r, b.r, p),
      };
    }
  }
  return keys[keys.length - 1];
}

/** 衰减的抖动（设计像素）。 */
export function shakeAt(t: number, t0: number, amp: number, decay = 14, seed = 1): V2 {
  if (t < t0) return v(0, 0);
  const k = Math.exp(-(t - t0) * decay);
  if (k < 0.01) return v(0, 0);
  const f = 34;
  return v(noise((t - t0) * f, seed) * amp * k, noise((t - t0) * f, seed + 7) * amp * k);
}
/** 一下小冲：缩放乘 1 + amp，很快回来。 */
export function punchAt(t: number, t0: number, amp: number, dur = 0.22) {
  if (t < t0 || t > t0 + dur) return 1;
  const p = (t - t0) / dur;
  return 1 + amp * Math.sin(Math.PI * Math.min(1, p * 1.6)) * (1 - p);
}

// ---------- 颜色 ----------
export const rgba = (r: number, g: number, b: number, a = 1) =>
  `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`;
export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * k);
  const g = Math.min(255, ((n >> 8) & 255) * k);
  const b = Math.min(255, (n & 255) * k);
  return rgba(r, g, b);
};
