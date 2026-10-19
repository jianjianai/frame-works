// 让人动起来活：在素材库的动作引擎（figure-motion.ts 的 playMove）上多三样，关键帧还是关节角度（度）：
//   1. 跟随和过冲：肩、肘、手腕、脖子（飘着的人连腿和整个人的转）按弹簧跟着身体走——晚一点到、冲过一点再回来，
//      不是几个姿势之间硬插值（硬插值就是「僵」：所有关节同时起步、同时停）。
//   2. 叠加的连续小动作（飘着时四肢像在水里慢慢摆、哭的时候肩膀一抽一抽……），按时间给，单位度。
//   3. 风：base 里给 wind，头发、围巾、衣角按素材库的 4 秒循环一阵一阵地飘（pose.t 用片子的绝对时间）。
// 关键帧和弹簧在开始时算好一次（playMove 每帧都重新解析全部关键帧）。全部只依赖时间 t，可以任意跳转。

import {
  type Angles,
  type Items,
  type Look,
  type MoveKey,
  type PoseIn,
  EXPRESSIONS,
  NEUTRAL,
  figureOptions,
  figurePose,
  figureRig,
} from "@materials/剪纸角色/code/chengtuo";
import { blinkAt, breathAt, ease as EASE } from "@materials/剪纸角色/code/rig";

type V2 = [number, number];
type Rec = Record<string, unknown>;
export type Num = Record<string, number>;

const EASES: Record<string, (x: number) => number> = {
  ...EASE,
  hold: (x) => (x < 1 ? 0 : 1),
  outBack: (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2,
};
/**
 * 关键帧的 ease 写成 SMOOTH：这一段不缓动停顿，而是按前后几帧连成一条平滑曲线（速度连续穿过关键帧）。
 * 走、跑这种循环动作用它；每段都用 inOut 的话每个关键帧都停一下，人一顿一顿地走、头发跟着一顿一顿地甩。
 */
export const SMOOTH = (x: number) => x;

const EXPR_NUM = ["blink", "happy", "sad", "fierce", "wide", "smile", "open", "blush", "tears", "squint", "round", "teeth", "wobble"] as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 每个参数的取值范围（从资源参数里读）：弹簧冲过头、叠加的小动作不能超出（超出会报错） */
const RANGE: Record<string, [number, number]> = (() => {
  const out: Record<string, [number, number]> = {};
  const shape = (figureOptions as unknown as { shape: Record<string, unknown> }).shape;
  for (const [k, v] of Object.entries(shape)) {
    let z = v as { def?: { innerType?: unknown }; minValue?: number | null; maxValue?: number | null };
    while (z.def?.innerType) z = z.def.innerType as typeof z;
    if (typeof z.minValue === "number" && typeof z.maxValue === "number") out[k] = [z.minValue, z.maxValue];
  }
  return out;
})();

/** 一帧补全成完整的参数，表情名换成数值（两种表情之间能平滑过渡） */
function full(o: Angles): Rec {
  const p = figureOptions.parse(o) as Rec;
  const e = { ...NEUTRAL, ...EXPRESSIONS[p.expression as string] } as unknown as Num & { look: V2 };
  for (const k of EXPR_NUM) if (p[k] === undefined) p[k] = e[k];
  if (p.lookX === undefined) p.lookX = e.look[0];
  if (p.lookY === undefined) p.lookY = e.look[1];
  return p;
}

interface Filled {
  t: number;
  o: Rec;
  x: number;
  xSet: boolean;
  dx?: number;
  squash: number;
  items: Items;
  ease: (x: number) => number;
  /** 这一段按前后几帧连成平滑曲线（SMOOTH） */
  smooth: boolean;
  plant?: "L" | "R";
}

function fill(keys: MoveKey[], base: Angles = {}): Filled[] {
  let raw: Angles = { ...base };
  let x = 0;
  let items: Items = {};
  return keys.map((k) => {
    // 换了表情名：上一帧留下的表情数值（眯眼、使劲、眼泪、看哪儿……）要清掉，不然它们比表情名优先，旧表情一直卡在脸上
    // （《引力》前奏：跑步的最后一帧带着「使劲」的数值，后面写的担心、仰望、微笑全被盖住，眼睛一直眯成两个小尖）
    if (k.p?.expression !== undefined) {
      const r = raw as Rec;
      for (const f of [...EXPR_NUM, "lookX", "lookY"]) if (!(f in k.p)) delete r[f];
    }
    raw = { ...raw, ...k.p };
    x = k.x ?? x;
    items = { ...items, ...k.items };
    const e = typeof k.ease === "function" ? k.ease : EASES[k.ease ?? "inOut"];
    return { t: k.t, o: full(raw), x, xSet: k.x !== undefined, dx: k.dx, squash: k.squash ?? 0, items, ease: e, smooth: k.ease === SMOOTH, plant: k.plant };
  });
}

/** t 落在哪一段：返回后一帧的下标 i（0 = 第一帧之前，F.length = 最后一帧之后）和段内的进度 w（已缓动） */
function seg(F: Filled[], t: number): { i: number; w: number } {
  if (t <= F[0].t) return { i: 0, w: 0 };
  if (t >= F[F.length - 1].t) return { i: F.length, w: 1 };
  let lo = 1;
  let hi = F.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (F[m].t > t) hi = m;
    else lo = m + 1;
  }
  return { i: lo, w: F[lo].ease(clamp01((t - F[lo - 1].t) / (F[lo].t - F[lo - 1].t))) };
}

function mix(a: Rec, b: Rec, w: number): Rec {
  const out: Rec = {};
  for (const k of Object.keys(a)) {
    const va = a[k];
    const vb = b[k];
    out[k] = typeof va === "number" && typeof vb === "number" ? va + (vb - va) * w : w < 0.5 ? va : vb;
  }
  return out;
}

function sample(F: Filled[], t: number): Rec {
  const { i, w } = seg(F, t);
  if (i === 0) return F[0].o;
  if (i === F.length) return F[F.length - 1].o;
  if (F[i].smooth) return spline(F, i, t);
  return mix(F[i - 1].o, F[i].o, w);
}

/** 平滑段：前后各多看一帧，按三次 Hermite 曲线插（切线 = 前后两帧的差 ÷ 时间差，时间不均匀也对） */
function spline(F: Filled[], i: number, t: number): Rec {
  const k0 = F[Math.max(0, i - 2)];
  const k1 = F[i - 1];
  const k2 = F[i];
  const k3 = F[Math.min(F.length - 1, i + 1)];
  const h = k2.t - k1.t;
  const u = clamp01((t - k1.t) / h);
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  const out: Rec = {};
  for (const key of Object.keys(k1.o)) {
    const v1 = k1.o[key];
    const v2 = k2.o[key];
    if (typeof v1 !== "number" || typeof v2 !== "number") {
      out[key] = u < 0.5 ? v1 : v2;
      continue;
    }
    const v0 = typeof k0.o[key] === "number" ? (k0.o[key] as number) : v1;
    const v3 = typeof k3.o[key] === "number" ? (k3.o[key] as number) : v2;
    const m1 = k1 === k0 ? 0 : ((v2 - v0) / (k2.t - k0.t)) * h;
    const m2 = k3 === k2 ? 0 : ((v3 - v1) / (k3.t - k1.t)) * h;
    const v = h00 * v1 + h10 * m1 + h01 * v2 + h11 * m2;
    // 曲线会冲过关键帧一点：按参数的范围夹住（超出会报错）
    const r = RANGE[key];
    out[key] = r ? Math.max(r[0], Math.min(r[1], v)) : v;
  }
  return out;
}

/** 弹簧：[角频率 rad/s, 阻尼比]。角频率越小越「慢半拍」，阻尼比越小冲得越过（0.4 冲过约 25%，0.6 约 10%） */
export type Spring = [number, number];

/** 常用的几组：上身跟着身子走（肩快、肘慢、手腕最慢），头晚一点 */
export const ARMS: Record<string, Spring> = {
  shoulderL: [15, 0.5],
  shoulderR: [14, 0.5],
  elbowL: [11, 0.42],
  elbowR: [10.5, 0.42],
  wristL: [8.5, 0.38],
  wristR: [8, 0.38],
  neck: [12, 0.5],
};
/** 飘着的人：腿和整个人的转也晃悠悠地跟着（落地、跪下时不要用在腿上） */
export const LIMP: Record<string, Spring> = {
  ...ARMS,
  hipL: [9, 0.4],
  hipR: [8.5, 0.4],
  kneeL: [7.5, 0.36],
  kneeR: [7, 0.36],
  ankleL: [6.5, 0.34],
  ankleR: [6, 0.34],
  rot: [6, 0.45],
  lean: [12, 0.55],
};

export interface LiveOpts {
  look: Look;
  /** 所有关键帧共用的底（朝向、风） */
  base?: Angles;
  /** 呼吸和眨眼 */
  idle?: boolean;
  seed?: number;
  /** 头发、围巾被根和胯的速度带着甩多少（默认 1；0 = 不算，在场景里按世界里的速度给 withDrag） */
  follow?: number;
  /** 哪些关节按弹簧跟着走 */
  springs?: Record<string, Spring>;
  /** 叠在上面的连续小动作（度）：改 o 里的数 */
  add?: (t: number, o: Num) => void;
}

export interface LiveFrame {
  pose: PoseIn;
  /** 根的横向位置 */
  x: number;
  /** 这一刻的参数（度） */
  options: Angles;
}

const GRID = 1 / 60;

/** 编好一段动作：返回按时间取姿势的函数 */
export function live(keys: MoveKey[], opts: LiveOpts) {
  const look = opts.look;
  const F = fill(keys, opts.base);
  const t0 = F[0].t;
  const t1 = F[F.length - 1].t;

  // ——— 弹簧：先在 1/60 秒的格子上把原始的角度卷积成「跟着走」的角度 ———
  const fields = Object.keys(opts.springs ?? {});
  const kernels = fields.map((f) => {
    const [w, z] = opts.springs![f];
    const wd = w * Math.sqrt(1 - z * z);
    const n = Math.ceil(4.5 / (z * w) / GRID);
    const h = new Float64Array(n);
    let s = 0;
    for (let i = 0; i < n; i++) {
      const tau = (i + 1) * GRID;
      h[i] = Math.exp(-z * w * tau) * Math.sin(wd * tau);
      s += h[i];
    }
    for (let i = 0; i < n; i++) h[i] /= s;
    return h;
  });
  const maxK = Math.max(1, ...kernels.map((h) => h.length));
  const g0 = t0 - maxK * GRID;
  const gN = Math.ceil((t1 + maxK * GRID - g0) / GRID) + 1;
  const raw = fields.map(() => new Float64Array(gN));
  for (let j = 0; j < gN; j++) {
    const o = sample(F, g0 + j * GRID);
    fields.forEach((f, m) => (raw[m][j] = o[f] as number));
  }
  const smooth = fields.map((f, m) => {
    const h = kernels[m];
    const x = raw[m];
    const y = new Float64Array(gN);
    for (let j = 0; j < gN; j++) {
      let acc = 0;
      for (let i = 0; i < h.length; i++) acc += h[i] * x[Math.max(0, j - i - 1)];
      y[j] = acc;
    }
    return y;
  });
  const smoothAt = (m: number, t: number) => {
    const u = (t - g0) / GRID;
    if (u <= 0) return smooth[m][0];
    if (u >= gN - 1) return smooth[m][gN - 1];
    const j = Math.floor(u);
    const f = u - j;
    return smooth[m][j] * (1 - f) + smooth[m][j + 1] * f;
  };

  const optionsAt = (t: number): Rec => {
    const o = { ...sample(F, t) };
    fields.forEach((f, m) => (o[f] = smoothAt(m, t)));
    opts.add?.(t, o as Num);
    for (const k in RANGE) {
      const v = o[k];
      if (typeof v === "number") o[k] = Math.max(RANGE[k][0], Math.min(RANGE[k][1], v));
    }
    return o;
  };
  const itemsAt = (t: number) => {
    const { i, w } = seg(F, t);
    if (i === 0) return F[0].items;
    if (i === F.length) return F[F.length - 1].items;
    return w < 1 ? F[i - 1].items : F[i].items;
  };
  const squashAt = (t: number) => {
    const { i, w } = seg(F, t);
    if (i === 0 || i === F.length) return F[Math.min(F.length - 1, i)].squash;
    return F[i - 1].squash + (F[i].squash - F[i - 1].squash) * w;
  };

  // ——— 根：标了 plant 的那段那只脚钉在地上（按没加小动作的腿算，腿不加小动作就不会滑） ———
  // figurePose 每次都要把全部参数校验一遍（很慢）：同一时刻只算一次
  const rawMemo = new Map<number, PoseIn>();
  const rawPose = (t: number) => {
    const k = Math.round(t * 1e4);
    let p = rawMemo.get(k);
    if (!p) {
      p = figurePose(sample(F, t) as Angles, t, look, itemsAt(t));
      if (rawMemo.size > 400) rawMemo.clear();
      rawMemo.set(k, p);
    }
    return p;
  };
  const footX = (pose: PoseIn, side: "L" | "R") => figureRig({ ...pose, hip: [0, 0] }, look).legs[side].end[0];
  // 每一帧开始时根在哪（只算一次）
  const xKey: number[] = [F[0].x];
  const footStart: number[] = [0];
  for (let i = 1; i < F.length; i++) {
    const k0 = F[i - 1];
    const k1 = F[i];
    let x = xKey[i - 1];
    if (k1.plant) {
      footStart[i] = footX(rawPose(k0.t), k1.plant);
      x = x + footStart[i] - footX(rawPose(k1.t), k1.plant);
    } else if (k1.xSet || k1.dx !== undefined) x = k1.dx !== undefined ? x + k1.dx : k1.x;
    xKey.push(x);
  }
  const rootX = (t: number) => {
    const { i, w } = seg(F, t);
    if (i === 0) return xKey[0];
    if (i === F.length) return xKey[F.length - 1];
    const k1 = F[i];
    const x0 = xKey[i - 1];
    // 平滑段（走、跑）：关键帧上按钉住的脚算准，关键帧之间匀速走——逐帧按脚反推的话，换脚那一刻两只脚的速度接不上，人每一步顿一下
    if (k1.plant && k1.smooth) {
      // 前后各多看一帧的位置，三次 Hermite 曲线连起来（速度也连续）
      const i0 = Math.max(0, i - 2);
      const i3 = Math.min(F.length - 1, i + 1);
      const ta = F[i - 1].t;
      const h = k1.t - ta;
      const u = clamp01((t - ta) / h);
      const m1 = i0 === i - 1 ? (xKey[i] - x0) : ((xKey[i] - xKey[i0]) / (k1.t - F[i0].t)) * h;
      const m2 = i3 === i ? (xKey[i] - x0) : ((xKey[i3] - x0) / (F[i3].t - ta)) * h;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * x0 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * xKey[i] + (u3 - u2) * m2;
    }
    if (k1.plant) return x0 + footStart[i] - footX(rawPose(t), k1.plant);
    if (k1.xSet || k1.dx !== undefined) return x0 + (xKey[i] - x0) * w;
    return x0;
  };

  const frameMemo = new Map<number, LiveFrame>();
  const frame = (t: number): LiveFrame => {
    const k = Math.round(t * 1e4);
    let f = frameMemo.get(k);
    if (!f) {
      const o = optionsAt(t);
      const pose = figurePose(o as Angles, t, look, itemsAt(t));
      pose.squash = squashAt(t);
      f = { pose, x: rootX(t), options: o as Angles };
      if (frameMemo.size > 400) frameMemo.clear();
      frameMemo.set(k, f);
    }
    return f;
  };

  return (t: number): LiveFrame => {
    // 记住的那一帧不能改：拷一份再加头发甩动、眨眼、呼吸
    const f = frame(t);
    const now: LiveFrame = { ...f, pose: { ...f.pose, expr: { ...(f.pose.expr as object) } } };
    const follow = opts.follow ?? 1;
    if (follow > 0) {
      // 速度按约 0.1 秒取平均（逐帧差分会把每一步落地的小起伏都甩进头发里）；前一个时刻取在 1/30 秒的格子上，播放时和前几帧共用
      const tp = Math.round((t - 0.1) * 30) / 30;
      const dt = Math.max(0.05, t - tp);
      const prev = frame(tp);
      const v: V2 = [(now.x - prev.x) / dt, ((now.pose.hip as V2)[1] - (prev.pose.hip as V2)[1]) / dt];
      withDrag(now.pose, v, follow);
    }
    if (opts.idle) {
      const e = now.pose.expr as { blink: number };
      e.blink = Math.max(e.blink, blinkAt(t, opts.seed ?? 0));
      now.pose.breath = breathAt(t, opts.seed ?? 0);
    }
    return now;
  };
}

/** 头发、围巾按身体在世界里的速度 v（单位 / 秒）往反方向甩（改 pose.drag） */
export function withDrag(pose: PoseIn, v: V2, follow = 1, max = 0.9) {
  const k = 0.0012 * follow;
  const c = (a: number) => Math.max(-max, Math.min(max, a));
  const d = (pose.drag as V2 | undefined) ?? [0, 0];
  pose.drag = [d[0] - c(v[0] * k), d[1] - c(v[1] * k)];
}

/** 一下一下的抽动（哭的时候肩膀一抽、一抽）：period 秒一次，返回 0..1 */
export const hitch = (t: number, period: number, phase = 0) => {
  const s = Math.sin(((t + phase) / period) * Math.PI * 2);
  return s > 0 ? s ** 3 : 0;
};
/** 一下冲击以后衰减着来回晃：t0 时刻开始，period 秒一个来回，decay 秒衰减到 1/e */
export const ring = (t: number, t0: number, period: number, decay: number) =>
  t < t0 ? 0 : Math.exp(-(t - t0) / decay) * Math.sin(((t - t0) / period) * Math.PI * 2);
/** 0 → 1 的平滑开关 */
export const fade = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/**
 * 镜头追一个会动的点（胸口、砖）：按临界阻尼的弹簧追，晚一点到、不跟着抖——人身上一下的动作（砖坠一下、扔东西）
 * 才看得见，镜头死盯着的话这些动作全被镜头抵消了。[ta, tb] 里预先算好，ta 之前直接用 fn；w 越大追得越紧。
 */
export function smoothTrack(fn: (t: number) => V2, ta: number, tb: number, w: number, dt = 1 / 60) {
  const n = Math.ceil((tb - ta) / dt) + 1;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const p = fn(ta);
  const p0 = fn(ta - dt);
  let [x, y] = p;
  let vx = (p[0] - p0[0]) / dt;
  let vy = (p[1] - p0[1]) / dt;
  for (let i = 0; i < n; i++) {
    xs[i] = x;
    ys[i] = y;
    const f = fn(ta + (i + 1) * dt);
    for (let s = 0; s < 4; s++) {
      const h = dt / 4;
      vx += (w * w * (f[0] - x) - 2 * w * vx) * h;
      vy += (w * w * (f[1] - y) - 2 * w * vy) * h;
      x += vx * h;
      y += vy * h;
    }
  }
  return (t: number): V2 => {
    if (t <= ta) return fn(t);
    const u = (t - ta) / dt;
    if (u >= n - 1) return [xs[n - 1], ys[n - 1]];
    const i = Math.floor(u);
    const f = u - i;
    return [xs[i] + (xs[i + 1] - xs[i]) * f, ys[i] + (ys[i + 1] - ys[i]) * f];
  };
}
