// 二维骨架剪纸的通用工具：关节坐标、两节 IK、平滑路径、合并描边、阴影、关键帧、眨眼呼吸。
// 角度约定：0 = 竖直向下，正 = 画布顺时针（朝左的角色里就是往前摆）。

export type V2 = [number, number];
/** 带第三个值 1 的点是尖角，其余点画成圆滑曲线。 */
export type P = [number, number] | [number, number, number];

export const dirOf = (a: number): V2 => [-Math.sin(a), Math.cos(a)];
export const angleOf = (v: V2): number => Math.atan2(-v[0], v[1]);
export const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];
export const len = (a: V2): number => Math.hypot(a[0], a[1]);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpV = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const norm = (a: V2): V2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 一个关节的坐标系：原点 (x, y)，转角 a。局部 +y 是骨头的方向。 */
export class Frame {
  constructor(
    public x: number,
    public y: number,
    public a: number,
  ) {}
  p(lx: number, ly: number): V2 {
    const c = Math.cos(this.a);
    const s = Math.sin(this.a);
    return [this.x + lx * c - ly * s, this.y + lx * s + ly * c];
  }
  child(lx: number, ly: number, da: number): Frame {
    const [x, y] = this.p(lx, ly);
    return new Frame(x, y, this.a + da);
  }
  get o(): V2 {
    return [this.x, this.y];
  }
}

/** 两节 IK：从 root 伸到 target，返回两节的绝对角度。bend 正 = 关节朝顺时针一侧拱出。 */
export function ik2(root: V2, target: V2, l1: number, l2: number, bend: number) {
  const d = sub(target, root);
  const dist = Math.min(Math.max(len(d), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const base = angleOf(d);
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const a1 = base + (bend >= 0 ? alpha : -alpha);
  const mid = add(root, mul(dirOf(a1), l1));
  const reach = add(root, mul(norm(d), dist));
  const a2 = angleOf(sub(reach, mid));
  return { a1, a2 };
}

const mid = (a: P, b: P): V2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const corner = (p: P) => p.length > 2 && p[2] === 1;

/** 穿过（圆滑点附近）这些点的闭合或开放路径。 */
export function smoothPath(pts: P[], closed = true, path = new Path2D()): Path2D {
  const n = pts.length;
  if (n < 2) return path;
  if (!closed) {
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i];
      if (corner(p)) path.lineTo(p[0], p[1]);
      else {
        const m = mid(p, pts[i + 1]);
        path.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
    }
    path.lineTo(pts[n - 1][0], pts[n - 1][1]);
    return path;
  }
  const start = corner(pts[0]) ? [pts[0][0], pts[0][1]] : mid(pts[n - 1], pts[0]);
  path.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    const prev = pts[(i - 1 + n) % n];
    if (corner(p)) {
      if (i > 0) path.lineTo(p[0], p[1]);
    } else {
      if (i > 0 && corner(prev)) {
        const m0 = mid(prev, p);
        path.lineTo(m0[0], m0[1]);
      }
      const m = mid(p, next);
      path.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
  }
  path.closePath();
  return path;
}

/** 两端圆头的条（袖子、腿）：p0 半径 r0 到 p1 半径 r1。 */
export function capsule(p0: V2, p1: V2, r0: number, r1: number, path = new Path2D()): Path2D {
  const psi = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  const n0 = psi - Math.PI / 2;
  path.moveTo(p0[0] + r0 * Math.cos(n0), p0[1] + r0 * Math.sin(n0));
  path.lineTo(p1[0] + r1 * Math.cos(n0), p1[1] + r1 * Math.sin(n0));
  path.arc(p1[0], p1[1], r1, n0, n0 + Math.PI);
  path.lineTo(p0[0] - r0 * Math.cos(n0), p0[1] - r0 * Math.sin(n0));
  path.arc(p0[0], p0[1], r0, n0 + Math.PI, n0 + Math.PI * 2);
  path.closePath();
  return path;
}

/** 沿中心线、按半宽 w 生成一条带子的轮廓点（头发、围巾）；尾端收成圆尖。 */
export function ribbonPts(c: V2[], w: number[], tip = 0.6): P[] {
  const n = c.length;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    const d = norm(sub(b, a));
    const nrm: V2 = [-d[1], d[0]];
    left.push([c[i][0] + nrm[0] * w[i], c[i][1] + nrm[1] * w[i]]);
    right.push([c[i][0] - nrm[0] * w[i], c[i][1] - nrm[1] * w[i]]);
  }
  const d = norm(sub(c[n - 1], c[n - 2]));
  const end: P = [c[n - 1][0] + d[0] * w[n - 1] * tip, c[n - 1][1] + d[1] * w[n - 1] * tip];
  const first = left[0];
  const last = right[0];
  return [[first[0], first[1], 1], ...left.slice(1), end, ...right.slice(1).reverse(), [last[0], last[1], 1]];
}

export const wrapAngle = (a: number) => {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
};

/**
 * 一条受力的链（头发、围巾）：从 root 沿 rootDir 出发，越往末端越顺着 field 的方向。
 * 按角度转过去；field 朝上时从 side 那一侧（-1..1，朝外）翻上去，spread 是往外散多少。
 */
export function chain(
  root: V2,
  rootDir: V2,
  segs: number,
  segLen: number,
  field: V2,
  opts: { stiff?: number; wave?: number; phase?: number; curl?: number; side?: number; spread?: number } = {},
): V2[] {
  // 合力弱时（下坠中、失重）头发也大体顺着它，只是没那么服帖
  const strength = Math.min(1, 0.6 + 0.6 * len(field));
  const fd = norm(field);
  const out = (opts.side ?? 0) * (opts.spread ?? 0.32) * clamp01(-fd[1] + 0.3);
  const target = angleOf(norm([fd[0] + out, fd[1]]));
  const ra = angleOf(rootDir);
  const delta = wrapAngle(target - ra);
  // 反过来受力（飘起来、往下坠）时发根也跟着翻上去，不然会横着甩成两只翅膀
  const stiff0 = opts.stiff ?? 0.25;
  const stiff = stiff0 + (0.8 - stiff0) * clamp01(-field[1]);
  const pts: V2[] = [root];
  let p = root;
  for (let i = 0; i < segs; i++) {
    const k = i / Math.max(1, segs - 1);
    const w = (stiff + (1 - stiff) * k) * strength;
    const bend = (opts.wave ?? 0) * Math.sin((opts.phase ?? 0) + i * 0.9) * (0.3 + k) + (opts.curl ?? 0) * k;
    p = add(p, mul(dirOf(ra + delta * w + bend), segLen));
    pts.push(p);
  }
  return pts;
}

export interface Ink {
  line: string;
  lw: number;
  /** 阴影偏移（光从左上来，影子在右下）。 */
  shade: V2;
}

/** 平涂 + 右下的一道阴影。 */
export function fillShaded(ctx: CanvasRenderingContext2D, path: Path2D, base: string, shade: string | null, ink: Ink) {
  ctx.fillStyle = base;
  ctx.fill(path);
  if (!shade) return;
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = shade;
  ctx.fill(path);
  ctx.translate(-ink.shade[0], -ink.shade[1]);
  ctx.fillStyle = base;
  ctx.fill(path);
  ctx.restore();
}

/** 几块拼成一个整体：外面一圈描边，里面的接缝不描。 */
export function drawMerged(
  ctx: CanvasRenderingContext2D,
  paths: Path2D[],
  base: string,
  shade: string | null,
  ink: Ink,
) {
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of paths) ctx.stroke(p);
  for (const p of paths) fillShaded(ctx, p, base, shade, ink);
}

export function drawPart(ctx: CanvasRenderingContext2D, path: Path2D, base: string, shade: string | null, ink: Ink, lw = ink.lw) {
  fillShaded(ctx, path, base, shade, ink);
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(path);
}

export function strokeLine(ctx: CanvasRenderingContext2D, pts: P[], color: string, lw: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(smoothPath(pts, false));
}

// ——— 缓动 ———
export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  sine: (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  outBack: (x: number) => {
    const c = 1.5;
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
  },
  outQuad: (x: number) => 1 - (1 - x) * (1 - x),
  inQuad: (x: number) => x * x,
};
export type Ease = (x: number) => number;

/** 把两个姿势（任意嵌套的数字、数组、字符串）按 t 混合；字符串和布尔在一半时切换。 */
export function blend<T>(a: T, b: T, t: number): T {
  if (typeof a === "number" && typeof b === "number") return (a + (b - a) * t) as T;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => blend(v, b[i], t)) as T;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const out: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    for (const k of keys) {
      const va = (a as Record<string, unknown>)[k];
      const vb = (b as Record<string, unknown>)[k];
      out[k] = va === undefined ? vb : vb === undefined ? va : blend(va, vb, t);
    }
    return out as T;
  }
  return (t < 0.5 ? a : b) as T;
}

/** 深合并：b 里有的覆盖 a。 */
export function merge<T>(a: T, b: unknown): T {
  if (b === undefined) return a;
  if (Array.isArray(b) || typeof b !== "object" || b === null) return b as T;
  if (typeof a !== "object" || a === null || Array.isArray(a)) return b as T;
  const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
  for (const [k, v] of Object.entries(b)) out[k] = v === undefined ? undefined : merge(out[k], v);
  return out as T;
}

export interface Key<T> {
  t: number;
  pose: T;
  /** 从上一个关键帧到这一帧的缓动 */
  ease?: Ease;
}

/** 关键帧取值：落在两帧之间时按后一帧的缓动混合。 */
export function sampleKeysPose<T>(keys: Key<T>[], t: number): T {
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].t) {
      const k0 = keys[i - 1];
      const k1 = keys[i];
      const x = (t - k0.t) / (k1.t - k0.t);
      return blend(k0.pose, k1.pose, (k1.ease ?? ease.inOut)(x));
    }
  }
  return keys[keys.length - 1].pose;
}

// ——— 待机：呼吸和眨眼（只依赖时间） ———
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 呼吸：-1..1，一次约 3.6 秒。 */
export const breathAt = (t: number, seed = 0) => Math.sin((t / 3.6 + seed * 0.37) * Math.PI * 2);

/** 眨眼：0 睁开 → 1 闭上。每 2.4–4.6 秒一次，一次 0.16 秒；偶尔连眨两下。 */
export function blinkAt(t: number, seed = 0): number {
  const period = 3.5;
  const k = Math.floor(t / period);
  let v = 0;
  for (const j of [k - 1, k]) {
    const start = j * period + hash(j + seed * 17) * 2.2;
    const local = t - start;
    const one = (x: number) => (x < 0 || x > 0.16 ? 0 : x < 0.06 ? x / 0.06 : 1 - (x - 0.06) / 0.1);
    v = Math.max(v, one(local));
    if (hash(j * 3.1 + seed) > 0.72) v = Math.max(v, one(local - 0.24));
  }
  return v;
}

// ——— 轮廓变形：两张线稿（正面 ↔ 侧面）的同一块逐点对应，转身时按比例混合 ———

/** 三次贝塞尔点列 [起点, 控制点1, 控制点2, 终点, …] 采样成折线，每段 n 个点（闭合的不重复起点） */
export function bezierPolyline(pts: V2[], n = 16, closed = true): V2[] {
  const out: V2[] = [pts[0]];
  for (let i = 1; i + 2 < pts.length; i += 3) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const a = 1 - t;
      out.push([
        a * a * a * p0[0] + 3 * a * a * t * p1[0] + 3 * a * t * t * p2[0] + t * t * t * p3[0],
        a * a * a * p0[1] + 3 * a * a * t * p1[1] + 3 * a * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  }
  // 去掉重合的点（线稿里零长的小段）
  const clean = out.filter((p, i) => i === 0 || len(sub(p, out[i - 1])) > 1e-3);
  if (closed && clean.length > 1 && len(sub(clean[0], clean[clean.length - 1])) < 1e-3) clean.pop();
  return clean;
}

/** 统一成画面上顺时针（y 朝下）的绕向 */
export function clockwisePoly(pts: V2[]): V2[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  return area < 0 ? [...pts].reverse() : pts;
}

/** 轮廓上离 p 最近的点的下标 */
export function nearestIndex(poly: V2[], p: V2): number {
  let best = 0;
  let bd = Infinity;
  poly.forEach((q, i) => {
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** 闭合折线从下标 a 走到 b（绕回），按弧长均匀取 count 个点（含 a，不含 b） */
export function arcSlice(poly: V2[], a: number, b: number, count: number): V2[] {
  const n = poly.length;
  const path: V2[] = [];
  for (let i = a; ; i = (i + 1) % n) {
    path.push(poly[i]);
    if (i === b && path.length > 1) break;
    if (path.length > n + 1) break;
  }
  return resampleOpen(path, count + 1).slice(0, count);
}

/** 开放折线按弧长均匀取 count 个点（含两端） */
export function resampleOpen(path: V2[], count: number): V2[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + len(sub(path[i], path[i - 1])));
  const total = acc[acc.length - 1] || 1;
  const out: V2[] = [];
  let j = 1;
  for (let k = 0; k < count; k++) {
    const s = (total * k) / Math.max(1, count - 1);
    while (j < path.length - 1 && acc[j] < s) j++;
    const seg = acc[j] - acc[j - 1] || 1;
    out.push(lerpV(path[j - 1], path[j], clamp01((s - acc[j - 1]) / seg)));
  }
  return out;
}

/**
 * 两条闭合轮廓逐点对应：各自在几个标志点（按顺时针的顺序，轮廓上的下标）切成同样多段，
 * 每段按弧长取 perSeg 个点。返回点数相同的两组点，混合用 lerpPts。
 */
export function matchOutlines(a: V2[], marksA: number[], b: V2[], marksB: number[], perSeg: number): [V2[], V2[]] {
  const outA: V2[] = [];
  const outB: V2[] = [];
  for (let k = 0; k < marksA.length; k++) {
    const k1 = (k + 1) % marksA.length;
    outA.push(...arcSlice(a, marksA[k], marksA[k1], perSeg));
    outB.push(...arcSlice(b, marksB[k], marksB[k1], perSeg));
  }
  return [outA, outB];
}

/** 按包围盒找标志点：guesses 是包围盒里的比例位置（0..1），取轮廓上离它最近的点 */
export function marksByBox(poly: V2[], guesses: V2[]): number[] {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return guesses.map(([gx, gy]) => nearestIndex(poly, [lerp(x0, x1, gx), lerp(y0, y1, gy)]));
}

export const lerpPts = (a: V2[], b: V2[], t: number): V2[] => (t <= 0 ? a : t >= 1 ? b : a.map((p, i) => lerpV(p, b[i], t)));

/** 闭合折线在高度 y 处最左、最右的 x（没有交点时返回 null） */
export function rowSpan(poly: V2[], y: number): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
      const x = x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
  }
  return lo <= hi ? [lo, hi] : null;
}

/** 折线画成路径（闭合） */
export function polylinePath(pts: V2[], map: (p: V2) => V2 = (p) => p, path = new Path2D()): Path2D {
  pts.forEach((q, i) => {
    const m = map(q);
    if (i) path.lineTo(m[0], m[1]);
    else path.moveTo(m[0], m[1]);
  });
  path.closePath();
  return path;
}
