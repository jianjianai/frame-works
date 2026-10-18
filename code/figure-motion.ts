// 动作引擎：所有角色共用。姿势一律写成关节角度（度，和资源面板的参数一样，见 figureOptions），
// 关键帧之间按缓动插值；表情换成数值一起插（表情之间平滑过渡）；脚踩地按着地点算（figure.ts 的 groundHip）；
// 标了 plant 的那段，那只脚钉在地上不打滑（根的横向位置反过来算）；头发、围巾按身体的速度往后甩。
// 全部只依赖时间 t，可以任意跳转。

import {
  type FigureOptions,
  type Items,
  type Look,
  type PoseIn,
  BASE_LOOK,
  EXPRESSIONS,
  NEUTRAL,
  figureOptions,
  figurePose,
  figureRig,
} from "./figure";
import { type V2, blinkAt, breathAt, clamp01, ease as EASE } from "./rig";

/** 一个姿势：资源面板的参数（角度用度），只写要用的 */
export type Angles = FigureOptions;

export type EaseName = "linear" | "in" | "out" | "inOut" | "sine" | "hold" | "inQuad" | "outQuad" | "outBack";
const EASES: Record<EaseName, (x: number) => number> = {
  linear: EASE.linear,
  in: EASE.in,
  out: EASE.out,
  inOut: EASE.inOut,
  sine: EASE.sine,
  hold: (x) => (x < 1 ? 0 : 1),
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  outBack: (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2,
};

export interface MoveKey {
  /** 时刻（秒，动作自己的时间） */
  t: number;
  /** 这一帧的姿势：只写变了的，没写的接着上一帧 */
  p?: Angles;
  /** 角色根（两脚之间的地面）的横向位置，朝左为负；没写接着上一帧 */
  x?: number;
  /** 根从上一帧往这一帧挪多少（相对的，接在别的动作后面也对；和 x 二选一） */
  dx?: number;
  /** 落地压扁（正）/ 拉长（负） */
  squash?: number;
  /** 物品（这一帧起生效，例如靴子里少了一块砖） */
  items?: Items;
  /** 从上一帧到这一帧怎么走（默认 inOut） */
  ease?: EaseName | ((x: number) => number);
  /** 从上一帧到这一帧这只脚钉在地上不动（根的 x 跟着算，脚不打滑） */
  plant?: "L" | "R";
}

/** 表情的数值字段：表情名换成数值以后在关键帧之间插 */
const EXPR_NUM = ["blink", "happy", "sad", "fierce", "wide", "smile", "open", "blush", "tears", "squint", "round", "teeth", "wobble"] as const;

/** 一帧补全成完整的参数，并把表情名换成数值（这样两种表情之间能平滑过渡） */
function full(o: Angles): Record<string, unknown> {
  const p = figureOptions.parse(o) as Record<string, unknown>;
  const e = { ...NEUTRAL, ...EXPRESSIONS[p.expression as string] } as unknown as Record<string, number> & { look: V2 };
  for (const k of EXPR_NUM) if (p[k] === undefined) p[k] = e[k];
  if (p.lookX === undefined) p.lookX = e.look[0];
  if (p.lookY === undefined) p.lookY = e.look[1];
  return p;
}

interface Filled {
  t: number;
  o: Record<string, unknown>;
  x: number;
  /** 这一帧写了 x（没写的话根停在上一段走到的地方） */
  xSet: boolean;
  dx?: number;
  squash: number;
  items: Items;
  ease: (x: number) => number;
  plant?: "L" | "R";
}

/** 关键帧补全：没写的接着上一帧 */
function fill(keys: MoveKey[], base: Angles = {}): Filled[] {
  let raw: Angles = { ...base };
  let x = 0;
  let squash = 0;
  let items: Items = {};
  return keys.map((k) => {
    raw = { ...raw, ...k.p };
    x = k.x ?? x;
    squash = k.squash ?? 0;
    items = { ...items, ...k.items };
    const e = typeof k.ease === "function" ? k.ease : EASES[k.ease ?? "inOut"];
    return { t: k.t, o: full(raw), x, xSet: k.x !== undefined, dx: k.dx, squash, items, ease: e, plant: k.plant };
  });
}

/** 两帧之间插值：数字按缓动插，其余（手形、前后、开关）到一半时换 */
function mix(a: Record<string, unknown>, b: Record<string, unknown>, w: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(a)) {
    const va = a[k];
    const vb = b[k];
    out[k] = typeof va === "number" && typeof vb === "number" ? va + (vb - va) * w : w < 0.5 ? va : vb;
  }
  return out;
}

/** 某一时刻的参数（没算脚踩地、根的位置） */
function sampleFilled(F: Filled[], t: number) {
  if (t <= F[0].t) return { o: F[0].o, i: 0, w: 0 };
  for (let i = 1; i < F.length; i++) {
    if (t < F[i].t) {
      const w = F[i].ease(clamp01((t - F[i - 1].t) / (F[i].t - F[i - 1].t)));
      return { o: mix(F[i - 1].o, F[i].o, w), i, w };
    }
  }
  return { o: F[F.length - 1].o, i: F.length, w: 1 };
}

export interface MoveOpts {
  look?: Look;
  /** 所有关键帧共用的底（例如 face: -1） */
  base?: Angles;
  /** 呼吸和眨眼（种子让几个角色不同步） */
  idle?: boolean;
  seed?: number;
  /** 头发、围巾被身体的速度带着甩多少（默认 1） */
  follow?: number;
}

export interface MoveFrame {
  /** 画这一帧的姿势（drawFigure / drawChengtuo 用），胯已经按脚踩地放好 */
  pose: PoseIn;
  /** 根的横向位置（朝左为负）：画的时候 translate(x0 + x, 地面) */
  x: number;
  /** 这一刻的参数（角度，度）：要接着改一点再画时用 */
  options: Angles;
}

/**
 * 按关键帧放一个动作。返回这一刻的姿势和根的位置。
 * 动作都按「朝左 3/4」或正面写；要朝右把 base.face 改成正的（整套镜像），根的 x 取反。
 */
export function playMove(keys: MoveKey[], t: number, opts: MoveOpts = {}): MoveFrame {
  const look = opts.look ?? BASE_LOOK;
  const F = fill(keys, opts.base);
  const at = (tt: number) => {
    const { o, i, w } = sampleFilled(F, tt);
    const k0 = F[Math.max(0, Math.min(F.length - 1, i - 1))];
    const k1 = F[Math.min(F.length - 1, i)];
    const items = w < 1 && i > 0 ? k0.items : k1.items;
    const pose = figurePose(o as Angles, tt, look, items);
    pose.squash = i > 0 && i < F.length ? k0.squash + (k1.squash - k0.squash) * w : F[Math.min(F.length - 1, i)].squash;
    return { o, pose };
  };
  const x = rootX(F, t, at, look);
  const now = at(t);
  // 头发、围巾跟着身体的速度往后甩（身体往上冲，头发往下坠；落下来时头发往上扬）
  const dt = 1 / 30;
  const prev = at(t - dt);
  const px = rootX(F, t - dt, at, look);
  const hip = now.pose.hip as V2;
  const hip0 = prev.pose.hip as V2;
  const v: V2 = [(x - px) / dt, (hip[1] - hip0[1]) / dt];
  const k = 0.0012 * (opts.follow ?? 1);
  const drag = now.pose.drag as V2;
  now.pose.drag = [drag[0] - clampAbs(v[0] * k, 1.2), drag[1] - clampAbs(v[1] * k, 1.2)];
  if (opts.idle) {
    const e = now.pose.expr as { blink: number };
    e.blink = Math.max(e.blink, blinkAt(t, opts.seed ?? 0));
    now.pose.breath = breathAt(t, opts.seed ?? 0);
  }
  return { pose: now.pose, x, options: now.o as Angles };
}

const clampAbs = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** 脚在根的坐标里的横向位置（胯在 0） */
function footX(pose: PoseIn, side: "L" | "R", look: Look) {
  const rig = figureRig({ ...pose, hip: [0, 0] }, look);
  return rig.legs[side].end[0];
}

/**
 * 根的横向位置：一段一段往后算。没标 plant 的那段按关键帧的 x 插值；标了 plant 的那段，
 * 那只脚在地上的位置不变（根 = 脚的位置 − 脚相对根的位置），脚不会打滑。
 */
function rootX(F: Filled[], t: number, at: (t: number) => { pose: PoseIn }, look: Look): number {
  let x = F[0].x;
  for (let i = 1; i < F.length; i++) {
    const k0 = F[i - 1];
    const k1 = F[i];
    const end = Math.min(t, k1.t);
    if (t <= k0.t) break;
    if (k1.plant) {
      const anchor = x + footX(at(k0.t).pose, k1.plant, look);
      x = anchor - footX(at(end).pose, k1.plant, look);
    } else if (k1.xSet || k1.dx !== undefined) {
      const w = k1.ease(clamp01((end - k0.t) / (k1.t - k0.t)));
      const target = k1.dx !== undefined ? x + k1.dx : k1.x;
      x = end >= k1.t ? target : x + (target - x) * w;
    }
    if (t < k1.t) break;
  }
  return x;
}

/** 把一段动作挪到 t0 开始（接在别的动作后面）；skipFirst 去掉它的第一帧，直接从前一段的最后一帧过渡过去 */
export function shiftKeys(keys: MoveKey[], t0: number, skipFirst = false): MoveKey[] {
  return (skipFirst ? keys.slice(1) : keys).map((k) => ({ ...k, t: k.t + t0 }));
}

// ——— 走路、跑：一个周期由「一步」的几个关键姿势加上左右对调的另一步组成 ———

/** 左右对调：L 的手脚换给 R（走路的第二步） */
export function swapSides(o: Angles): Angles {
  const out: Record<string, unknown> = { ...o };
  const pairs: [string, string][] = [
    ["shoulderL", "shoulderR"],
    ["elbowL", "elbowR"],
    ["wristL", "wristR"],
    ["handL", "handR"],
    ["layerL", "layerR"],
    ["hipL", "hipR"],
    ["kneeL", "kneeR"],
    ["ankleL", "ankleR"],
    ["thighL", "thighR"],
  ];
  for (const [a, b] of pairs) {
    if (a in o || b in o) {
      out[a] = (o as Record<string, unknown>)[b];
      out[b] = (o as Record<string, unknown>)[a];
      if (out[a] === undefined) delete out[a];
      if (out[b] === undefined) delete out[b];
    }
  }
  return out as Angles;
}

export interface GaitStep {
  /** 一步里的位置（0..1，0 是前脚 L 落地） */
  at: number;
  p: Angles;
  ease?: EaseName;
  /** 这一刻再往上抬多少（跑步腾空） */
  lift?: number;
  squash?: number;
}

export interface GaitOpts extends MoveOpts {
  /** 一步的秒数（两步一个周期） */
  step: number;
  /** 第一步（L 落地）的时刻 */
  t0?: number;
}

/**
 * 走 / 跑：steps 是「一步」（L 脚落地 → R 脚落地之前）的关键姿势，第二步左右对调。
 * 站着的那只脚钉在地上，根的 x 按它反算，脚不打滑；返回每一步落地的时刻用来配「咚」。
 */
export function gait(steps: GaitStep[], t: number, o: GaitOpts): MoveFrame & { stepIndex: number } {
  const look = o.look ?? BASE_LOOK;
  const T = o.step;
  const t0 = o.t0 ?? 0;
  const keysOf = (swap: boolean): MoveKey[] =>
    [...steps, { ...steps[0], at: 1 }].map((s) => ({
      t: s.at * T,
      p: swap !== (s.at === 1) ? swapSides(s.p) : s.p,
      squash: s.squash,
      ease: s.ease,
    }));
  const half = (tt: number) => {
    const n = Math.floor((tt - t0) / T);
    const local = tt - t0 - n * T;
    const swap = ((n % 2) + 2) % 2 === 1;
    const F = fill(keysOf(swap), o.base);
    const { o: oo } = sampleFilled(F, local);
    // 腾空：一步里按 at 插的 lift
    const lifts = [...steps, { ...steps[0], at: 1 }];
    let lift = 0;
    for (let i = 1; i < lifts.length; i++) {
      const a = lifts[i - 1];
      const b = lifts[i];
      if (local / T <= b.at) {
        const w = EASES[b.ease ?? "inOut"](clamp01((local / T - a.at) / (b.at - a.at)));
        lift = (a.lift ?? 0) + ((b.lift ?? 0) - (a.lift ?? 0)) * w;
        break;
      }
    }
    const pose = figurePose({ ...(oo as Angles), lift: ((oo as Angles).lift ?? 0) + lift }, tt, look);
    const k = Math.min(F.length - 1, Math.max(1, F.findIndex((f) => f.t > local)));
    pose.squash = F[k - 1].squash + (F[k].squash - F[k - 1].squash) * clamp01((local - F[k - 1].t) / (F[k].t - F[k - 1].t));
    // 这一步站着的是落地的那只脚：偶数步 L，奇数步 R
    return { pose, o: oo as Angles, n, local, stance: (swap ? "R" : "L") as "L" | "R" };
  };
  // 一步走多远（朝左为负）：站着的脚从落地到下一步落地，相对根往后退了多少，根就往前走了多少
  const stepLen = footX(half(t0).pose, "L", look) - footX(half(t0 + T - 1e-4).pose, "L", look);
  // 根 = 这一步开始时的根 + 站着的脚相对根往后退了多少（脚在地上不动，根往前走）
  const rootAt = (tt: number) => {
    const h = half(tt);
    const start = footX(half(t0 + h.n * T).pose, h.stance, look);
    return h.n * stepLen + (start - footX(h.pose, h.stance, look));
  };
  const now = half(t);
  const x = rootAt(t);
  const dt = 1 / 30;
  const px = rootAt(t - dt);
  const hip = now.pose.hip as V2;
  const hip0 = half(t - dt).pose.hip as V2;
  const k = 0.0012 * (o.follow ?? 1);
  const drag = now.pose.drag as V2;
  now.pose.drag = [drag[0] - clampAbs(((x - px) / dt) * k, 1.6), drag[1] - clampAbs(((hip[1] - hip0[1]) / dt) * k, 1.6)];
  if (o.idle) {
    const e = now.pose.expr as { blink: number };
    e.blink = Math.max(e.blink, blinkAt(t, o.seed ?? 0));
    now.pose.breath = breathAt(t, o.seed ?? 0) * 0.5;
  }
  return { pose: now.pose, x, options: now.o, stepIndex: now.n };
}

/** gait 每一步落地（「咚」）的时刻 */
export function gaitSteps(from: number, to: number, step: number, t0 = 0): number[] {
  const out: number[] = [];
  for (let k = Math.ceil((from - t0) / step); t0 + k * step <= to; k++) out.push(t0 + k * step);
  return out;
}
