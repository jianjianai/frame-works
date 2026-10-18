// 秤砣的动作：全部用动作引擎（figure-motion.ts）按关节角度（度）写关键帧，和资源面板的参数一样。
// 都按「朝左 3/4」（face: -1）写；要朝右把 face 改成 1（整套镜像），根的 x 取反。
// 所有函数只依赖时间 t，可以任意跳转。返回 { pose, x }：pose 给 drawChengtuo，x 是根（两脚之间的地面）的横向位置。

import { type Angles, type GaitStep, type MoveFrame, type MoveKey, gait, gaitSteps, playMove } from "./figure-motion";
import { CHENGTUO } from "./chengtuo-draw";

const LOOK = { look: CHENGTUO };

// ——— 走路：铁靴，一步一「咚」 ———
// 一步（L 脚落地 → R 脚落地）：落地（脚跟先着地）→ 下沉（膝盖吃住分量，后脚抬起）→ 经过（站直、摆动的脚收在身下）→ 上升（踮脚送出去，前脚伸出）。
// 铁靴重：落地那一下身子沉得多、轻轻压扁，抬脚低、慢，手臂摆得小。
const WALK: GaitStep[] = [
  {
    at: 0,
    squash: 0.02,
    p: { hipL: 19, kneeL: -3, ankleL: -8, hipR: -14, kneeR: -10, ankleR: -2, shoulderL: -11, elbowL: 10, shoulderR: 13, elbowR: 22, lean: 6, neck: -2 },
  },
  {
    at: 0.2,
    ease: "out",
    squash: 0.045,
    p: { hipL: 13, kneeL: -20, ankleL: 7, hipR: -18, kneeR: -24, ankleR: 8, shoulderL: -8, elbowL: 14, shoulderR: 10, elbowR: 26, lean: 9, neck: -4 },
  },
  {
    at: 0.48,
    ease: "inOut",
    p: { hipL: -2, kneeL: -4, ankleL: 6, hipR: 10, kneeR: -38, ankleR: 18, shoulderL: 0, elbowL: 14, shoulderR: 2, elbowR: 20, lean: 6, neck: -2 },
  },
  {
    at: 0.74,
    ease: "inOut",
    p: { hipL: -13, kneeL: -2, ankleL: 4, hipR: 22, kneeR: -16, ankleR: 0, shoulderL: 10, elbowL: 18, shoulderR: -9, elbowR: 14, lean: 5, neck: -1 },
  },
];

export interface WalkOpts {
  /** 一步的秒数（120 BPM 一步一拍是 0.5） */
  step?: number;
  /** 第一步（L 脚落地，「咚」）的时刻 */
  t0?: number;
  /** 再叠一点表情、朝向等（角度用度） */
  base?: Angles;
}

/** 走路（朝左）：返回姿势、根的位置 x（往左为负）和第几步。落地的那只脚钉在地上，不打滑。 */
export function walk(t: number, o: WalkOpts = {}) {
  return gait(WALK, t, { ...LOOK, step: o.step ?? 0.5, t0: o.t0, base: { face: -1, ...o.base }, idle: true });
}

/** 每一步落地（「咚」）的时刻 */
export function walkSteps(from: number, to: number, o: WalkOpts = {}): number[] {
  return gaitSteps(from, to, o.step ?? 0.5, o.t0 ?? 0);
}

// ——— 姿势（静止，角度用度；片子里的关键时刻，也是动作的关键帧） ———
type Pose = Angles & { items?: Record<string, boolean | number> };

/** 一条腿：胯、膝的角度，脚相对地面的角度（0 = 鞋底放平，正 = 脚尖翘起） */
const legL = (hip: number, knee: number, foot = 0): Angles => ({ hipL: hip, kneeL: knee, ankleL: foot - hip - knee });
const legR = (hip: number, knee: number, foot = 0): Angles => ({ hipR: hip, kneeR: knee, ankleR: foot - hip - knee });

/** 3/4 朝左站着：重心在后脚（R），前脚（L）放松、膝盖微弯，两手自然垂着、肘微弯 */
const STAND: Pose = {
  face: -1,
  ...legL(7, -9),
  ...legR(-4, -2),
  shoulderL: -5,
  elbowL: 14,
  wristL: 8,
  shoulderR: 7,
  elbowR: 16,
  wristR: -4,
  lean: 2,
};

/** 单膝跪（R 膝着地，L 脚在前踩稳），靴子挨着她 */
const KNEEL: Angles = { ...legL(78, -84), ...legR(-12, -98, -55), lean: 6 };

export const POSES: Record<string, Pose> = {
  站: STAND,
  仰头: { ...STAND, neck: 30, lean: -3, shoulderL: -2, shoulderR: 10, expression: "仰望" },
  "蹲（起跳前）": {
    face: -1,
    ...legL(66, -112, 0),
    ...legR(52, -104, 0),
    lean: 34,
    neck: 34,
    shoulderL: -46,
    elbowL: 18,
    wristL: 10,
    shoulderR: -34,
    elbowR: 22,
    expression: "使劲",
    lookY: -0.9,
  },
  空中抓住: {
    face: -1,
    ...legL(34, -62, -30),
    ...legR(8, -40, -40),
    lean: -6,
    neck: 30,
    shoulderL: 75,
    elbowL: 35,
    wristL: 10,
    handL: "open",
    shoulderR: 168,
    elbowR: 4,
    wristR: 6,
    handR: "grip",
    lift: 230,
    expression: "使劲",
    lookY: -1,
  },
  落地: {
    face: -1,
    ...legL(46, -70, 0),
    ...legR(30, -60, 0),
    lean: 32,
    neck: 18,
    shoulderL: 30,
    elbowL: 40,
    handL: "open",
    shoulderR: 150,
    elbowR: 10,
    handR: "grip",
    expression: "使劲",
    lookY: -0.6,
  },

  "单膝跪·掏砖": {
    face: -1,
    ...KNEEL,
    lean: 32,
    neck: -22,
    shoulderL: 18,
    elbowL: 42,
    wristL: -10,
    handL: "grip",
    shoulderR: 24,
    elbowR: 40,
    expression: "平常",
    lookY: 0.8,
  },
  递砖: {
    face: -1,
    ...KNEEL,
    lean: 8,
    neck: 10,
    shoulderL: 72,
    elbowL: 12,
    wristL: -22,
    handL: "flat",
    shoulderR: 18,
    elbowR: 34,
    expression: "微笑",
    lookX: -0.4,
    lookY: -0.3,
    items: { bricks: 1 },
  },
  半蹲: { face: 0, shoulderL: -18, elbowL: 15, wristL: 9, shoulderR: 18, elbowR: -15, wristR: -9, hipL: -54, kneeL: 74, ankleL: -20, hipR: 54, kneeR: -74, ankleR: 20, thighL: 0.52, thighR: 0.52 },
  抱臂: { face: 0, shoulderL: -17, elbowL: 115, wristL: -14, shoulderR: 17, elbowR: -99, wristR: 6 },
  挥手: { ...STAND, neck: -8, shoulderR: 138, elbowR: 38, wristR: 8, handR: "open", shoulderL: -4, elbowL: 16, expression: "微笑", lookX: -0.4, lookY: -0.5 },
  弯腰摸头: { ...STAND, ...legL(16, -14), ...legR(-6, -10), lean: 24, neck: -14, shoulderL: 62, elbowL: 18, wristL: -36, handL: "flat", shoulderR: -14, elbowR: 22, expression: "微笑", lookY: 0.7 },
  拽: {
    face: -1,
    ...legL(32, -44, 0),
    ...legR(-18, -26, 0),
    lean: -16,
    neck: 18,
    shoulderL: 168,
    elbowL: 14,
    handL: "grip",
    shoulderR: 160,
    elbowR: 20,
    handR: "grip",
    expression: "使劲",
    lookY: -0.8,
  },
  抱住: {
    face: -1,
    ...legL(16, -38, -35),
    ...legR(4, -24, -40),
    lean: 14,
    neck: -16,
    shoulderL: 34,
    elbowL: 112,
    wristL: 20,
    handL: "relax",
    shoulderR: 46,
    elbowR: 118,
    handR: "relax",
    lift: 120,
    expression: "心疼",
  },
  坐: {
    face: -1,
    ...legL(86, -76, 4),
    ...legR(80, -96, 4),
    lean: 8,
    neck: -4,
    shoulderL: 34,
    elbowL: 40,
    wristL: 10,
    shoulderR: 30,
    elbowR: 44,
    lookX: -0.4,
    lookY: 0.2,
  },
  写字: {
    face: -1,
    ...legL(84, -86, 0),
    ...legR(80, -84, 0),
    lean: 22,
    neck: -20,
    shoulderL: 48,
    elbowL: 84,
    wristL: -18,
    handL: "grip",
    shoulderR: 44,
    elbowR: 78,
    handR: "flat",
    expression: "平常",
    lookY: 0.9,
  },
  嘘: { ...STAND, neck: -4, shoulderL: 24, elbowL: 142, wristL: -10, handL: "point", expression: "嘘", lookX: -0.5 },
  拉钩: { ...STAND, ...legL(12, -12), lean: 8, neck: -8, shoulderL: 46, elbowL: 50, wristL: -10, handL: "pinky", expression: "心疼", lookY: 0.5 },
  从楼顶跳下: {
    face: -1,
    rot: -38,
    ...legL(-14, -40, -40),
    ...legR(-30, -20, -40),
    lean: 4,
    neck: 30,
    shoulderL: 150,
    elbowL: 10,
    handL: "open",
    shoulderR: 140,
    elbowR: 14,
    handR: "open",
    lift: 200,
    expression: "使劲",
  },
  倒着睡: {
    face: -1,
    rot: -90,
    ground: false,
    ...legL(4, -8, -20),
    ...legR(0, -4, -20),
    lean: 0,
    neck: -4,
    shoulderL: 8,
    elbowL: 14,
    shoulderR: 10,
    elbowR: 12,
    expression: "闭眼",
    float: 1,
    items: { boots: false },
  },
  弯腰握手: {
    face: -1,
    ...legL(24, -46, -40),
    ...legR(12, -34, -45),
    lean: 54,
    neck: -24,
    shoulderL: 74,
    elbowL: 6,
    wristL: -8,
    handL: "grip",
    shoulderR: 30,
    elbowR: 40,
    handR: "relax",
    lift: 160,
    float: 0.5,
    expression: "哭着笑",
    lookY: 0.9,
    items: { boots: false },
  },

};

// ——— 站着：呼吸、眨眼、重心轻轻晃 ———
/** 站着（默认 3/4 朝左的站姿，base 可以换成别的姿势）：呼吸、眨眼、重心很慢地晃 */
export function stand(t: number, base: Angles = STAND, seed = 0): MoveFrame {
  const sway = Math.sin(t * 0.9 + seed * 1.7);
  return playMove([{ t: 0, p: { ...base, lean: (base.lean ?? 0) + sway * 0.8, neck: (base.neck ?? 0) - sway * 0.5 } }], t, { ...LOOK, idle: true, seed });
}

// ——— 跑：铁靴跑，一步一「咚」，中间短短地腾空 ———
const RUN: GaitStep[] = [
  {
    at: 0,
    squash: 0.03,
    p: { face: -1, ...legL(30, -12, 6), ...legR(-28, -46, -30), shoulderL: -34, elbowL: 72, shoulderR: 36, elbowR: 84, handL: "fist", handR: "fist", lean: 16, neck: -6 },
  },
  {
    at: 0.22,
    ease: "out",
    squash: 0.06,
    p: { ...legL(18, -40, 0), ...legR(-8, -92, -10), shoulderL: -18, elbowL: 80, shoulderR: 20, elbowR: 88, lean: 19, neck: -8 },
  },
  {
    at: 0.5,
    ease: "inOut",
    lift: 8,
    p: { ...legL(-24, -8, -34), ...legR(40, -62, 10), shoulderL: 18, elbowL: 80, shoulderR: -16, elbowR: 76, lean: 16, neck: -6 },
  },
  {
    at: 0.76,
    ease: "out",
    lift: 22,
    p: { ...legL(-18, -56, -20), ...legR(40, -26, 14), shoulderL: 32, elbowL: 78, shoulderR: -30, elbowR: 70, lean: 15, neck: -5 },
  },
];

/** 跑（朝左）：一步 step 秒（默认 0.3），站着的脚钉在地上，两步之间短短地离地 */
export function run(t: number, o: WalkOpts = {}) {
  return gait(RUN, t, { ...LOOK, step: o.step ?? 0.3, t0: o.t0, base: { face: -1, expression: "使劲", ...o.base } });
}

// ——— 蹲 → 跳 → 空中抓住 → 往下坠 → 落地 ———
// 局部时间：0 仰头看着他，0.6 蹲到底（攒劲），1.09 起跳离地，1.44 在空中抓住他的脚踝，1.6 还往上冲了一点，
// 1.86 带着铁靴的分量越落越快、砸到地上，2.0 膝盖吃住，2.6 站稳（手还抓着他往下拽）。
export const JUMP_GRAB = { crouch: 0.6, launch: 1.09, grab: 1.44, apex: 1.6, land: 1.86 };

/** 跳起来抓的关键帧（接在别的动作后面用 shiftKeys） */
export function jumpGrabKeys(grabLift = 230): MoveKey[] {
  const J = JUMP_GRAB;
  return [
    { t: 0, p: { ...POSES.仰头 } },
    { t: 0.25, ease: "inOut", p: { ...POSES.仰头, ...legL(14, -22), ...legR(4, -18), lean: 6, neck: 26 } },
    { t: J.crouch, ease: "inOut", p: { ...POSES["蹲（起跳前）"] }, squash: 0.05 },
    {
      t: J.launch,
      ease: "in",
      dx: -18,
      squash: -0.08,
      p: {
        ...legL(-4, -2, -40),
        ...legR(-14, -6, -42),
        lean: -4,
        neck: 26,
        shoulderL: 120,
        elbowL: 20,
        handL: "open",
        shoulderR: 172,
        elbowR: 6,
        handR: "open",
        lift: 40,
        expression: "使劲",
        open: 0.35,
        teeth: 0,
        lookY: -1,
      },
    },
    { t: J.grab, ease: "out", dx: -12, squash: -0.03, p: { ...POSES.空中抓住, lift: grabLift } },
    { t: J.apex, ease: "out", dx: -2, squash: 0, p: { ...POSES.空中抓住, ...legL(26, -50, -25), shoulderR: 170, lift: grabLift + 18 } },
    {
      t: J.land,
      ease: "in",
      dx: -2,
      squash: -0.04,
      p: { ...POSES.空中抓住, ...legL(16, -14, 0), ...legR(-4, -10, 0), shoulderL: 95, elbowL: 30, shoulderR: 172, lift: 0, neck: 20 },
    },
    { t: J.land + 0.12, ease: "out", squash: 0.1, p: { ...POSES.落地 } },
    {
      t: 2.6,
      ease: "inOut",
      squash: 0,
      p: { ...POSES.落地, ...legL(18, -26), ...legR(6, -22), lean: 12, neck: 14, shoulderL: 10, elbowL: 30, handL: "relax", shoulderR: 118, elbowR: 16, expression: "坚定", lookY: -0.3 },
    },
  ];
}

/** 跳起来在空中抓住头顶的人、带着他坠下来落地（朝左）。grabLift：抓住时离地多高（默认 230） */
export function jumpGrab(t: number, grabLift = 230): MoveFrame {
  return playMove(jumpGrabKeys(grabLift), t, { ...LOOK, idle: t > 2.6 });
}

// ——— 单膝跪下，从靴筒里抽出一块砖，递出去，站起来 ———
// 局部时间：0 站着，0.5 跪下（L 脚往前踩稳），0.95 手伸进靴筒，1.35 抽出一块砖（很沉），2.0 托着递到他手边，
// 2.2 冲他笑，3.0 起身，3.45 站直，3.55 脚跟离地了一下（送出一块砖，她轻了，伏笔），3.8 落回去。
export const KNEEL_GIVE = { kneel: 0.5, reach: 0.95, pull: 1.35, give: 2.0, rise: 3.0, stood: 3.45, heel: 3.55 };

/** 跪下递砖的关键帧（接在别的动作后面用 shiftKeys） */
export function kneelGiveKeys(): MoveKey[] {
  const K = KNEEL_GIVE;
  return [
    { t: 0, p: { ...STAND, expression: "平常" } },
    { t: K.kneel, ease: "inOut", plant: "L", squash: 0.03, p: { ...POSES["单膝跪·掏砖"], lean: 14, neck: -8, shoulderL: 10, elbowL: 30, handL: "relax", lookY: 0.5 } },
    { t: K.reach, ease: "inOut", plant: "L", squash: 0, p: { ...POSES["单膝跪·掏砖"] } },
    {
      t: K.pull,
      ease: "out",
      plant: "L",
      items: { bricks: 1 },
      p: { ...POSES["单膝跪·掏砖"], lean: 22, neck: -10, shoulderL: 38, elbowL: 64, wristL: -24, handL: "grip", lookY: 0.4 },
    },
    { t: K.give, ease: "inOut", plant: "L", p: { ...POSES.递砖, expression: "平常", lookX: -0.4, lookY: -0.2 } },
    { t: K.give + 0.35, ease: "out", plant: "L", p: { ...POSES.递砖 } },
    { t: K.rise, plant: "L", p: { ...POSES.递砖, shoulderL: 30, elbowL: 30, handL: "relax" } },
    { t: K.stood, ease: "inOut", plant: "L", p: { ...STAND, expression: "微笑" } },
    { t: K.heel, ease: "out", plant: "L", p: { ...STAND, ...legL(7, -9, -14), ...legR(-4, -2, -16), lift: 7, expression: "微笑" } },
    { t: K.heel + 0.25, ease: "in", plant: "L", p: { ...STAND, expression: "微笑" }, squash: 0.02 },
    { t: K.heel + 0.45, ease: "out", p: { ...STAND, expression: "微笑" }, squash: 0 },
  ];
}

/** 单膝跪下、从靴筒掏砖递出去、再站起来（朝左）。hasBrick：砖在手里（用 holdBrick 画在 L 手上） */
export function kneelGive(t: number): MoveFrame & { hasBrick: boolean } {
  const K = KNEEL_GIVE;
  const f = playMove(kneelGiveKeys(), t, { ...LOOK, idle: true, seed: 3 });
  return { ...f, hasBrick: t >= K.pull - 0.05 && t < K.rise };
}

// ——— 打招呼：抬手、点头、笑 ———
/** 朝窗口（左上）的人打招呼：远侧的手抬起来（不挡脸）、点一下头、笑（朝左） */
export function greet(t: number): MoveFrame {
  const keys: MoveKey[] = [
    { t: 0, p: { ...STAND } },
    { t: 0.35, ease: "out", p: { ...POSES.挥手, neck: 4, expression: "微笑" } },
    { t: 0.6, ease: "inOut", p: { ...POSES.挥手, neck: -10 } },
    { t: 0.9, ease: "inOut", p: { ...POSES.挥手, neck: 2 } },
    // 放下来先收肘（手经过肩膀旁边），不从身前横扫过去
    { t: 1.2, ease: "inOut", p: { ...POSES.挥手, shoulderR: 60, elbowR: 110, wristR: 10, neck: 0 } },
    { t: 1.6, ease: "inOut", p: { ...STAND, expression: "微笑" } },
  ];
  return playMove(keys, t, { ...LOOK, idle: true, seed: 1 });
}

// ——— 弯腰摸摸孩子的头 ———
/** 弯腰、摸两下孩子的头（孩子的头顶在她身前约 −390 高）、直起来（朝左） */
export function patHead(t: number): MoveFrame {
  const P = POSES.弯腰摸头;
  const keys: MoveKey[] = [
    { t: 0, p: { ...STAND, expression: "微笑" } },
    { t: 0.45, ease: "inOut", p: { ...P } },
    { t: 0.7, ease: "inOut", p: { ...P, shoulderL: (P.shoulderL ?? 0) - 6, wristL: (P.wristL ?? 0) + 8 } },
    { t: 0.95, ease: "inOut", p: { ...P } },
    { t: 1.2, ease: "inOut", p: { ...P, shoulderL: (P.shoulderL ?? 0) - 6, wristL: (P.wristL ?? 0) + 8 } },
    { t: 1.75, ease: "inOut", p: { ...STAND, expression: "微笑" } },
  ];
  return playMove(keys, t, { ...LOOK, idle: true, seed: 2 });
}

// ——— 飘：光脚，像在水里（失重） ———
/** 光脚飘着（头发、围巾往上漂），身子像在水里一样慢慢地摆；base 可以叠别的姿势 */
export function float(t: number, base: Angles = {}): MoveFrame {
  const s = Math.sin(t * 1.1);
  const c = Math.cos(t * 0.8);
  const o: Angles = {
    face: -0.55,
    ...legL(-6 + 4 * s, -34 - 6 * c, -50),
    ...legR(6 - 3 * c, -22 + 5 * s, -45),
    lean: 4 + 3 * s,
    neck: 6 + 3 * c,
    rot: 3 * c,
    shoulderL: -44 - 7 * s,
    elbowL: 34 + 6 * c,
    wristL: 12,
    handL: "open",
    shoulderR: 40 + 6 * c,
    elbowR: 28 - 6 * s,
    wristR: -8,
    handR: "open",
    float: 1,
    lift: 70 + 8 * s,
    expression: "闭眼",
    smile: 0.3,
    blush: 0.4,
    ...base,
  };
  return playMove([{ t: 0, p: o, items: { boots: false, bricks: 0 } }], t, { ...LOOK, idle: false });
}

export type { MoveFrame, MoveKey };
export { playMove };
export { legL, legR, STAND };
