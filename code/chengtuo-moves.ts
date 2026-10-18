// 秤砣的动作：走、跑、蹲跳抓、单膝跪下掏砖递砖、飘，和片子里用到的姿势。
// 全部按「朝左 3/4」写（face: -1）；要朝右就把返回的姿势 face 改成 1（整套镜像），位移 x 取反。
// 所有函数只依赖时间 t，可以任意跳转。

import { type PoseIn, type Expr, LEG_K, NEUTRAL, footAt, hipAt } from "./chengtuo-draw";
import { type Key, type V2, blinkAt, breathAt, clamp01, ease, merge, sampleKeysPose } from "./rig";

// 下面的胯高、脚的位置都是按原来的骨架写的（腿竖直 262 高、脚踝离地 34），用 hipAt / footAt 换算到现在的骨架。
const G = -34; // 脚踝着地（原来的单位）
const GB = -34; // 光脚（靴子还没画，先一样）

/** 活着的脸：叠上眨眼。 */
export function alive(expr: Partial<Expr>, t: number, seed = 0): Partial<Expr> {
  const b = blinkAt(t, seed);
  return { ...expr, blink: Math.max(expr.blink ?? 0, b) };
}

/** 站着：呼吸、眨眼、一点点重心晃动。 */
export function stand(t: number, base: PoseIn = {}, seed = 0): PoseIn {
  const br = breathAt(t, seed);
  const sway = Math.sin(t * 0.9 + seed) * 0.012;
  const p: PoseIn = {
    breath: br,
    hip: [0, hipAt(-296 + br * 1.2)],
    lean: sway,
    neck: -sway * 0.6,
    armL: { a: -0.26 + br * 0.015 },
    armR: { a: 0.26 - br * 0.015 },
  };
  const out = merge(p, base);
  out.expr = alive({ ...NEUTRAL, ...(base.expr ?? {}) } as Expr, t, seed);
  out.t = t;
  return out;
}

/** 3/4 站姿（朝左）。 */
export const STAND34: PoseIn = {
  face: -1,
  hip: [0, hipAt(-297)],
  armL: { a: -0.08, b: 0.28, shape: "relax" },
  armR: { a: 0.14, b: 0.32, shape: "relax" },
  legL: { to: footAt(22, G) },
  legR: { to: footAt(-26, G) },
};

export interface WalkOpts {
  /** 两步一个周期的秒数（120 BPM 一步一拍就是 1） */
  period?: number;
  /** 一步走多远 */
  stride?: number;
  /** 抬脚多高 */
  lift?: number;
  /** 前倾 */
  lean?: number;
  /** 落地有多沉（0..1） */
  heavy?: number;
  /** 第一步落地的时刻 */
  t0?: number;
  barefoot?: boolean;
}

/**
 * 走路（朝左）：返回姿势和根的位移 x（往左为负），以及每一步落地的时刻（「咚」）。
 * 铁靴：脚抬得吃力、落得快，落地那一下身体往下一沉、头发往下甩。
 */
export function walk(t: number, o: WalkOpts = {}) {
  const T = o.period ?? 1;
  const S = o.stride ?? 76;
  const lift = o.lift ?? 34;
  const heavy = o.heavy ?? 1;
  const t0 = o.t0 ?? 0;
  const half = T / 2;
  const v = S / half;
  const x = -v * (t - t0);
  const ground = o.barefoot ? GB : G;
  const duty = 0.6;
  const reach = (v * duty * T) / 2;
  const footPhase = (tt: number, off: number) => {
    const ph = (((tt - t0) / T + off) % 1 + 1) % 1;
    if (ph < duty) return { rel: -reach + v * ph * T, h: 0, s: -1 };
    const s = (ph - duty) / (1 - duty);
    const p = ease.inOut(clamp01(s / 0.82));
    const h = lift * (s < 0.55 ? ease.out(s / 0.55) : 1 - ease.in((s - 0.55) / 0.45));
    return { rel: reach + (-reach - reach) * p, h, s };
  };
  const fL = footPhase(t, 0);
  const fR = footPhase(t, 0.5);
  // 离上一次落地多久
  const since = (((t - t0) % half) + half) % half;
  const dip = since < 0.07 ? since / 0.07 : Math.exp(-(since - 0.07) * 7);
  const lag = 0.09;
  const fLl = footPhase(t - lag, 0);
  const fRl = footPhase(t - lag, 0.5);
  const fwd = (f: { rel: number }) => -f.rel / reach;
  const br = breathAt(t);
  const pose: PoseIn = {
    face: -1,
    t,
    breath: br * 0.5,
    hip: [0, hipAt(-291 + 9 * heavy * dip - 4 * Math.sin((Math.PI * since) / half))],
    squash: 0.03 * heavy * dip,
    lean: (o.lean ?? 0.08) + 0.04 * heavy * dip,
    neck: -0.05 * heavy * dip,
    legL: { to: footAt(fL.rel, ground - fL.h), f: fL.s < 0 ? 0 : 0.18 * Math.sin(Math.PI * fL.s), bend: 1, boot: !o.barefoot },
    legR: { to: footAt(fR.rel - 6, ground - fR.h), f: fR.s < 0 ? 0 : 0.18 * Math.sin(Math.PI * fR.s), bend: 1, boot: !o.barefoot },
    armL: { a: 0.04 - 0.34 * fwd(fLl), b: 0.3 + 0.25 * clamp01(-fwd(fLl)), shape: "relax" },
    armR: { a: 0.1 - 0.3 * fwd(fRl), b: 0.32 + 0.22 * clamp01(-fwd(fRl)), shape: "relax" },
    drag: [0.22 * Math.min(1, v / 150), 0.35 * heavy * dip],
    expr: alive({ ...NEUTRAL }, t),
  };
  return { pose, x: x * LEG_K };
}

/** 每一步落地（「咚」）的时刻：t0 起每半个周期一次。 */
export function walkSteps(from: number, to: number, o: WalkOpts = {}): number[] {
  const half = (o.period ?? 1) / 2;
  const t0 = o.t0 ?? 0;
  const out: number[] = [];
  for (let k = Math.ceil((from - t0) / half); t0 + k * half <= to; k++) out.push(t0 + k * half);
  return out;
}

// ——— 蹲 → 跳 → 空中抓住 → 往下坠 → 落地 ———
// 局部时间：0 站着仰头，0.45 蹲到底，0.62 起跳，0.97 抓住，1.05 最高点，1.42 落地，1.9 站稳。
// 目标（被抓的脚踝）在头顶前上方 grab。
export function jumpGrab(t: number, grab: V2 = [-84, -790]): PoseIn {
  const up = { neck: 0.42, expr: { ...NEUTRAL, look: [-0.3, -0.9] as V2, smile: -0.1, fierce: 0.3 } };
  const air = (hipY: number, kneeBend: number) => ({
    hip: [0, hipAt(hipY)] as V2,
    legL: { to: footAt(10, hipY + 262 - kneeBend), bend: 1 },
    legR: { to: footAt(-24, hipY + 258 - kneeBend * 0.8), bend: 1 },
  });
  // 抓的是远侧那只手（在头后面伸上去，不挡脸）
  const reach = (to: V2, ik: number, a: number, b: number, shape: "relax" | "open" | "grip") => ({ a, b, h: 0.2, to, ik, bend: 1, shape });
  const R0: V2 = [-70, -560];
  const keys: Key<PoseIn>[] = [
    {
      t: 0,
      pose: {
        ...STAND34,
        ...up,
        armL: { a: -0.05, b: 0.3, h: 0, shape: "relax" },
        armR: reach(R0, 0, 0.1, 0.3, "relax"),
        legL: { to: footAt(22, G), bend: 1 },
        legR: { to: footAt(-26, G), bend: 1 },
        lean: 0,
        squash: 0,
        drag: [0, 0],
      },
    },
    {
      t: 0.45,
      ease: ease.inOut,
      pose: {
        hip: [8, hipAt(-228)],
        lean: 0.5,
        neck: 0.75,
        squash: 0.07,
        armL: { a: -1.05, b: 0.35, h: 0, shape: "relax" },
        armR: reach(R0, 0, -0.85, 0.4, "relax"),
        legL: { to: footAt(22, G), bend: 1 },
        legR: { to: footAt(-26, G), bend: 1 },
        expr: { ...NEUTRAL, look: [-0.3, -0.9], smile: -0.2, fierce: 0.8 },
        drag: [0, 0.2],
      },
    },
    {
      t: 0.62,
      ease: ease.out,
      pose: {
        hip: [-6, hipAt(-330)],
        lean: -0.06,
        neck: 0.55,
        squash: -0.08,
        armL: { a: 1.7, b: 0.5, h: 0, shape: "open" },
        armR: reach(R0, 0, 2.6, 0.15, "open"),
        legL: { to: footAt(16, G - 30), bend: 1 },
        legR: { to: footAt(-20, G - 22), bend: 1 },
        expr: { ...NEUTRAL, look: [-0.3, -1], smile: 0, fierce: 0.9, open: 0.25 },
        drag: [0, 0.9],
      },
    },
    {
      t: 0.97,
      ease: ease.out,
      pose: {
        ...air(-500, 26),
        lean: -0.08,
        neck: 0.5,
        squash: -0.03,
        armR: reach(grab, 1, 2.6, 0.15, "grip"),
        armL: { a: 0.9, b: 0.6, h: 0, shape: "open" },
        expr: { ...NEUTRAL, look: [-0.2, -1], smile: 0, fierce: 1, open: 0.3 },
        drag: [0, 0.6],
      },
    },
    {
      t: 1.07,
      ease: ease.sine,
      pose: {
        ...air(-520, 34),
        lean: -0.04,
        neck: 0.4,
        squash: 0,
        armR: reach([grab[0] + 4, grab[1] - 22], 1, 2.6, 0.15, "grip"),
        armL: { a: 0.5, b: 0.7, h: 0, shape: "open" },
        expr: { ...NEUTRAL, look: [-0.2, -1], smile: 0, fierce: 1, open: 0.1 },
        drag: [0, 0],
      },
    },
    {
      t: 1.42,
      ease: ease.in,
      pose: {
        ...air(-300, 4),
        lean: 0.02,
        neck: 0.35,
        squash: -0.04,
        armR: reach([grab[0] + 10, -575], 1, 2.6, 0.15, "grip"),
        armL: { a: 1.4, b: 0.5, h: 0, shape: "open" },
        legL: { to: footAt(16, G), bend: 1 },
        legR: { to: footAt(-26, G), bend: 1 },
        expr: { ...NEUTRAL, look: [-0.2, -0.8], fierce: 1, smile: -0.2 },
        drag: [0, -1.25],
      },
    },
    {
      t: 1.55,
      ease: ease.out,
      pose: {
        hip: [4, hipAt(-232)],
        lean: 0.38,
        neck: 0.2,
        squash: 0.11,
        armR: reach([grab[0] + 6, -490], 1, 2.6, 0.15, "grip"),
        armL: { a: 0.9, b: 0.9, h: 0, shape: "open" },
        legL: { to: footAt(16, G), bend: 1 },
        legR: { to: footAt(-26, G), bend: 1 },
        expr: { ...NEUTRAL, look: [-0.2, -0.5], fierce: 1, smile: -0.3, blink: 0.4 },
        drag: [0, 1.6],
      },
    },
    {
      t: 1.95,
      ease: ease.inOut,
      pose: {
        hip: [2, hipAt(-276)],
        lean: 0.12,
        neck: 0.25,
        squash: 0,
        armR: reach([grab[0] + 2, -470], 1, 2.6, 0.15, "grip"),
        armL: { a: 0.3, b: 0.5, h: 0, shape: "relax" },
        legL: { to: footAt(16, G), bend: 1 },
        legR: { to: footAt(-26, G), bend: 1 },
        expr: { ...NEUTRAL, look: [-0.2, -0.6], fierce: 0.4, smile: 0 },
        drag: [0, 0],
      },
    },
  ];
  const p = sampleKeysPose(keys, t);
  return { ...STAND34, ...p, face: -1, t, gravity: [0, 1] };
}

// ——— 单膝跪下，从靴筒里抽出一块砖，递出去 ———
// 局部时间：0 站着，0.55 跪下，1.0 手伸进靴筒，1.45 抽出来（砖少一块），2.0 递到前上方，之后停住。
// 砖在手里时 hasBrick 为真（在 hold.L 里画砖）。
export function kneelGive(t: number, to: V2 = [-190, -250]) {
  const keys: Key<PoseIn>[] = [
    {
      t: 0,
      pose: {
        ...STAND34,
        lean: 0.02,
        neck: 0,
        armL: { a: -0.08, b: 0.28, h: 0, to: [-84, -150], ik: 0, bend: -1, shape: "relax" },
        armR: { a: 0.14, b: 0.32, h: 0, to: [-80, -480], ik: 0, bend: 1, shape: "relax" },
        legL: { to: footAt(22, G), bend: 1, f: 0 },
        legR: { to: footAt(-26, G), bend: 1, f: 0 },
        expr: { ...NEUTRAL },
      },
    },
    {
      t: 0.55,
      ease: ease.inOut,
      pose: {
        hip: [18, hipAt(-150)],
        lean: 0.3,
        neck: -0.25,
        squash: 0.03,
        armL: { a: 0.2, b: 0.5, h: 0, to: [-84, -150], ik: 0, bend: -1, shape: "relax" },
        armR: { a: 0.6, b: 0.9, h: 0, shape: "relax" },
        legL: { to: footAt(165, -74), bend: 1, f: -1.1 },
        legR: { to: footAt(-88, G), bend: 1, f: 0 },
        expr: { ...NEUTRAL, look: [-0.3, 0.6], smile: 0.1 },
      },
    },
    {
      t: 1.0,
      ease: ease.inOut,
      pose: {
        hip: [14, hipAt(-152)],
        lean: 0.62,
        neck: -0.35,
        squash: 0,
        armL: { a: 0.2, b: 0.5, ik: 1, h: 0.2, to: [-84, -150], bend: -1, shape: "grip" },
        armR: { a: 0.8, b: 1.2, h: 0, shape: "relax" },
        legL: { to: footAt(165, -74), bend: 1, f: -1.1 },
        legR: { to: footAt(-88, G), bend: 1, f: 0 },
        expr: { ...NEUTRAL, look: [-0.4, 0.8], smile: 0 },
      },
    },
    {
      t: 1.45,
      ease: ease.inOut,
      pose: {
        hip: [14, hipAt(-154)],
        lean: 0.42,
        neck: -0.15,
        armL: { a: 0.2, b: 0.5, ik: 1, h: 0.1, to: [-132, -214], bend: -1, shape: "grip" },
        armR: { a: 0.75, b: 1.15, h: 0, shape: "relax" },
        legL: { to: footAt(165, -74), bend: 1, f: -1.1 },
        legR: { to: footAt(-88, G), bend: 1, f: 0 },
        expr: { ...NEUTRAL, look: [-0.3, 0.2], smile: 0.1 },
      },
    },
    {
      t: 2.05,
      ease: ease.inOut,
      pose: {
        hip: [10, hipAt(-156)],
        lean: 0.2,
        neck: 0.18,
        armL: { a: 0.2, b: 0.5, ik: 1, h: -0.25, to: to, bend: -1, shape: "flat" },
        armR: { a: 0.7, b: 1.1, h: 0, shape: "relax" },
        legL: { to: footAt(165, -74), bend: 1, f: -1.1 },
        legR: { to: footAt(-88, G), bend: 1, f: 0 },
        expr: { ...NEUTRAL, look: [-0.6, -0.3], smile: 0.75, happy: 0.35, blush: 0.6 },
      },
    },
  ];
  const p = sampleKeysPose(keys, t);
  const pose: PoseIn = { ...p, face: -1, t, breath: breathAt(t) * 0.6, bricks: t < 1.3 ? 2 : 1 };
  pose.expr = alive(pose.expr as Expr, t, 3);
  return { pose, hasBrick: t >= 1.25 };
}

// ——— 光脚飘起来（头发、衣摆、围巾往上，像在水里） ———
export function float(t: number, base: PoseIn = {}): PoseIn {
  const s = Math.sin(t * 1.1);
  const c = Math.cos(t * 0.8);
  const p: PoseIn = {
    face: -0.55,
    t,
    float: 1,
    gravity: [0, -1],
    hip: [0, hipAt(-296 + s * 6)],
    rot: 0.05 * c,
    lean: 0.06 + 0.04 * s,
    neck: 0.1 + 0.05 * c,
    armL: { a: -0.75 - 0.12 * s, b: 0.55 + 0.1 * c, h: 0.2, shape: "open" },
    armR: { a: 0.65 + 0.1 * c, b: 0.5 - 0.1 * s, h: -0.1, shape: "open" },
    legL: { to: undefined, a: -0.18 + 0.06 * s, b: -0.55 - 0.08 * c, f: 0.5, boot: false },
    legR: { to: undefined, a: 0.12 - 0.05 * c, b: -0.35 + 0.08 * s, f: 0.45, boot: false },
    bricks: 0,
    expr: { ...NEUTRAL, blink: 1, smile: 0.25, blush: 0.4 },
  };
  return merge(p, base);
}

// ——— 片子里用到的姿势（静止，给设定图和关键帧用） ———
export const POSES: Record<string, PoseIn> = {
  // 正面抱臂（用户的抱臂三视图，`public/ref/秤砣-抱臂三视图.png`）：上臂贴着身体两侧稍往外，肘弯到 90° 多，
  // 两条前臂横在胸前交叉：画面右边那只（armL）在上、略往上斜，另一只在下、略往下斜，手套抓住对面的胳膊
  // 正面半蹲、手扶膝盖（用户的半蹲三视图，`public/ref/秤砣-半蹲三视图.png`）：膝盖往两边分开，
  // 大腿朝镜头伸出来，看上去只有一半长（thighK）；小腿往里收到脚踝；手臂几乎伸直，手套扣在膝盖上
  半蹲: {
    face: 0,
    hip: [0, -190],
    legL: { to: [42.2, -65.1], bend: -1, thighK: 0.52 },
    legR: { to: [-42.2, -65.1], bend: 1, thighK: 0.52 },
    armL: { a: 0, b: 0, to: [64, -190], bend: -1, h: 0.15, shape: "relax" },
    armR: { a: 0, b: 0, to: [-64, -190], bend: 1, h: -0.15, shape: "relax" },
  },
  抱臂: {
    face: 0,
    armL: { a: -0.3, b: 2.0, h: -0.25, shape: "relax" },
    armR: { a: 0.3, b: -1.72, h: 0.1, shape: "relax" },
  },
  仰头: {
    ...STAND34,
    neck: 0.45,
    expr: { ...NEUTRAL, look: [-0.3, -1], smile: 0 },
  },
  挥手: {
    ...STAND34,
    armL: { a: 2.7, b: 0.5, h: -0.2, shape: "open" },
    neck: 0.08,
    expr: { ...NEUTRAL, happy: 1, smile: 0.9, open: 0.3, blush: 0.6 },
  },
  弯腰摸头: {
    ...STAND34,
    hip: [6, hipAt(-290)],
    lean: 0.42,
    neck: -0.2,
    armL: { to: [-120, -340], bend: -1, a: 0, b: 0, h: 0.6, shape: "open" },
    expr: { ...NEUTRAL, happy: 0.7, smile: 0.8, blush: 0.6 },
  },
  拽: {
    ...STAND34,
    hip: [30, hipAt(-250)],
    lean: -0.32,
    neck: 0.3,
    armL: { to: [-40, -600], bend: 1, a: 0, b: 0, h: 0.1, shape: "grip" },
    armR: { to: [-20, -580], bend: 1, a: 0, b: 0, h: 0.1, shape: "grip" },
    legL: { to: footAt(70, G), bend: 1 },
    legR: { to: footAt(-70, G), bend: 1 },
    expr: { ...NEUTRAL, fierce: 1, smile: -0.4, open: 0.2, look: [0, -1] },
  },
  抱住: {
    face: -0.3,
    lean: 0.06,
    neck: -0.12,
    armL: { a: 1.25, b: 1.5, h: 0.3, shape: "relax", layer: "front" },
    armR: { a: 1.05, b: 1.25, h: 0.3, shape: "relax", layer: "front" },
    expr: { ...NEUTRAL, blink: 1, smile: 0.3, sad: 0.3, blush: 0.7 },
  },
  坐: {
    face: -1,
    hip: [0, hipAt(-150)],
    lean: 0.08,
    neck: -0.05,
    armL: { a: 0.35, b: 0.6, shape: "relax" },
    armR: { a: 0.45, b: 0.65, shape: "relax" },
    legL: { to: footAt(-120, G), bend: 1 },
    legR: { to: footAt(-150, G), bend: 1 },
    expr: { ...NEUTRAL, look: [-0.4, 0.3] },
  },
  写字: {
    face: -1,
    hip: [0, hipAt(-150)],
    lean: 0.38,
    neck: -0.35,
    armL: { to: [-150, -250], bend: -1, a: 0, b: 0, h: 0.4, shape: "point" },
    armR: { to: [-130, -262], bend: -1, a: 0, b: 0, h: 0.3, shape: "flat" },
    legL: { to: footAt(-120, G), bend: 1 },
    legR: { to: footAt(-150, G), bend: 1 },
    expr: { ...NEUTRAL, look: [-0.4, 1], smile: 0.15, blink: 0.35 },
  },
  嘘: {
    ...STAND34,
    face: -0.5,
    neck: -0.05,
    armL: { to: [-22, -470], bend: -1, a: 0, b: 0, h: 2.6, shape: "point" },
    expr: { ...NEUTRAL, smile: 0, wide: 0.6, look: [-0.5, 0] },
  },
  拉钩: {
    ...STAND34,
    hip: [0, hipAt(-250)],
    lean: 0.3,
    armL: { to: [-120, -300], bend: -1, a: 0, b: 0, h: -0.4, shape: "pinky" },
    legL: { to: footAt(30, G), bend: 1 },
    legR: { to: footAt(-50, G), bend: 1 },
    expr: { ...NEUTRAL, sad: 0.4, smile: 0.4, look: [-0.5, 0.5] },
  },
  从楼顶跳下: {
    face: -0.6,
    hip: [0, hipAt(-296)],
    rot: 0.05,
    lean: 0.12,
    neck: -0.32,
    drag: [0, -1.7],
    armL: { a: 2.35, b: 0.35, h: 0, shape: "open" },
    armR: { a: -2.2, b: -0.35, h: 0, shape: "open" },
    legL: { to: undefined, a: 0.45, b: -0.95, f: 0 },
    legR: { to: undefined, a: -0.05, b: -0.45, f: 0 },
    expr: { ...NEUTRAL, fierce: 0.8, smile: -0.3, open: 0.35, look: [-0.2, 1] },
  },
  倒着睡: {
    face: -1,
    rot: Math.PI / 2,
    hip: [0, hipAt(-296)],
    gravity: [0, -1],
    float: 0.4,
    armL: { a: 0.3, b: 0.4, shape: "relax" },
    armR: { a: 0.1, b: 0.5, shape: "relax" },
    legL: { to: undefined, a: 0.05, b: -0.1, f: 0, boot: false },
    legR: { to: undefined, a: -0.05, b: -0.2, f: 0, boot: false },
    bricks: 0,
    expr: { ...NEUTRAL, blink: 1, smile: 0.15 },
  },
  弯腰握手: {
    face: -0.6,
    hip: [0, hipAt(-296)],
    gravity: [0, -1],
    float: 1,
    lean: 0.65,
    neck: -0.35,
    armL: { a: 0.35, b: 0.15, h: 0, shape: "open" },
    armR: { a: 0.1, b: 0.1, h: 0, shape: "relax" },
    legL: { to: undefined, a: -0.25, b: -0.3, f: 0.4, boot: false },
    legR: { to: undefined, a: -0.05, b: -0.2, f: 0.4, boot: false },
    bricks: 0,
    expr: { ...NEUTRAL, tears: 0.8, happy: 0.4, smile: 0.5, look: [-0.3, 1] },
  },
};

export const EXPRESSIONS: Record<string, Partial<Expr>> = {
  平常: {},
  笑: { happy: 1, smile: 1, open: 0.35, blush: 0.7 },
  哭着笑: { happy: 0.5, smile: 0.7, tears: 0.9, blush: 0.8 },
  难过: { sad: 1, smile: -0.5, look: [0, 0.6], blink: 0.15 },
  惊: { wide: 1, open: 0.55, smile: -0.2 },
  使劲: { fierce: 1, smile: -0.5, open: 0.25 },
  闭眼: { blink: 1, smile: 0.25 },
  哼歌: { blink: 1, happy: 0.4, smile: 0.4, open: 0.18, blush: 0.6 },
  仰望: { look: [0, -1], smile: 0, wide: 0.2 },
  心疼: { sad: 0.7, smile: 0.25, look: [0, 0.8], blush: 0.5 },
};

