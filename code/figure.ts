// 基础模型：所有剪纸角色共用的人（骨架、身子、四肢、手脚、脸和表情、正面 ↔ 3/4 转身、手臂和身子的前后、受力）。
// 角色在它上面换配色、发型、衣服、鞋和人物特点（Look：图层画在基础模型的各层之间），不改基础模型本身。第一个角色是秤砣（chengtuo-draw.ts）。
// 画法：深色描边 + 平涂 + 右下一道阴影；各部件按关节坐标拼起来，接缝不描边。
// 坐标：角色单位，原点在两脚之间的地面，往上为负；全身约 590 高。
// 朝向 face：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身）。正面和 3/4 各有一张用户画的线稿
// （作品 5b227852 的 `public/ref/秤砣-线稿.svg`、`秤砣-侧面线稿.svg`），转身时身子、脖子、脸、五官从一张平滑过渡到另一张。
// 姿势一律按「朝左 / 正面」写：armL / legL 在画面右边（3/4 时是靠近镜头的一侧），
// 角度 0 = 垂下，正 = 顺时针（朝左时就是往前）；face > 0 时整套镜像。

import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import {
  type Ink,
  type P,
  type V2,
  Frame,
  add,
  angleOf,
  bezierPolyline,
  blinkAt,
  breathAt,
  clamp01,
  clockwisePoly,
  dirOf,
  drawMerged,
  drawPart,
  fillShaded,
  ik2,
  len,
  lerp,
  lerpPts,
  lerpV,
  marksByBox,
  matchOutlines,
  merge,
  mul,
  nearestIndex,
  norm,
  polylinePath,
  ribbonPts,
  rowSpan,
  smoothPath,
  strokeLine,
  sub,
} from "./rig";
import { SIDE_FACE, SIDE_IRIS, SIDE_MOUTH, SIDE_NECK, SIDE_NOSE, SIDE_TORSO } from "./figure-side";

/** 基础模型的配色：角色用 Look.colors 换（皮肤、眼睛这些人物特点，上衣 top、下装 bottom 是衣服） */
export const BASE_COLORS = {
  line: "#25262c",
  skin: "#fbe2d3",
  skinShade: "#f0cab7",
  blush: "240,150,150",
  /** 上衣（身子和袖子的形状是基础模型的；基础模型是素色，角色换成自己的衣服） */
  top: "#e6e3de",
  topShade: "#d4d0c9",
  /** 上衣圆领下沿的细缝线 */
  topSeam: "#aaa59c",
  /** 下装（裆和两条腿） */
  bottom: "#5d5f66",
  bottomShade: "#4f5157",
  eye: "#34363d",
  liner: "#202126",
  sclera: "#ffffff",
  iris: "#33353c",
  irisLight: "#4a4d56",
  pupil: "#25262c",
  brow: "#1d1e23",
  nose: "#8a7a75",
  mouth: "#8c3e4f",
  mouthLine: "#5e5153",
  tongue: "#f29a9c",
  teeth: "#fffaf4",
  tear: "#cfeefa",
};
export type Palette = typeof BASE_COLORS;
/** 正在画的角色的配色（drawFigure 开始时换上、画完换回来） */
let K: Palette = BASE_COLORS;

export type HandShape = "open" | "relax" | "fist" | "grip" | "point" | "pinky" | "flat";

export interface ArmPose {
  /** 肩：0 垂下，正 = 顺时针 */
  a: number;
  /** 肘：相对上臂 */
  b: number;
  /** 手腕：相对前臂 */
  h: number;
  /** 给了就用 IK：手腕伸到这一点（角色坐标） */
  to?: V2;
  /** IK 的分量：0 用 a/b，1 用 to（默认有 to 就是 1）；关键帧之间渐变就能从摆臂过渡到伸手 */
  ik?: number;
  /** IK 时肘往哪边拱：正 = 顺时针一侧 */
  bend?: number;
  shape: HandShape;
  /** 画在身体后面还是前面（默认 3/4 时远侧的手在后） */
  layer?: "back" | "front";
  /** 拇指朝哪边（手的局部 x 方向，±1） */
  thumb?: number;
}

export interface LegPose {
  /** 大腿：0 垂下，正 = 顺时针 */
  a: number;
  /** 膝：相对大腿 */
  b: number;
  /** 脚：用 IK 时是绝对角度（0 = 鞋底放平），否则相对小腿 */
  f: number;
  /** 大腿朝镜头伸出来时（正面半蹲、蹲下）看上去变短：大腿在画面里的长度比例，默认 1 */
  thighK?: number;
  /** 给了就用 IK：脚踝到这一点 */
  to?: V2;
  /** IK 的分量（同手臂） */
  ik?: number;
  bend?: number;
  /** 这只脚穿着鞋（角色的 Look.shoe 打开时）；光着一只脚时设 false */
  boot: boolean;
}

export interface Expr {
  /** 闭眼 0..1 */
  blink: number;
  /** 笑眼（下眼睑往上推，1 = 弯成 ∩） */
  happy: number;
  /** 难过：外眼角压下来，嘴角往下 */
  sad: number;
  /** 使劲、坚决：内眼角压下来 */
  fierce: number;
  /** 睁大眼（惊） */
  wide: number;
  /** 嘴角：1 笑，-1 撇 */
  smile: number;
  /** 张嘴 0..1 */
  open: number;
  /** 眼珠看向（-1..1） */
  look: V2;
  blush: number;
  /** 眼泪 0..1 */
  tears: number;
  /** 眯眼：下眼皮推上来一点（温柔地笑、看远处），不弯成 ∩ */
  squint: number;
  /** 嘴圆起来（「哦」、惊讶的小圆嘴） */
  round: number;
  /** 露出咬紧的牙（使劲） */
  teeth: number;
  /** 嘴发抖、撇成波浪（忍着哭） */
  wobble: number;
}

export interface Pose {
  face: number;
  /** 头相对身体多转一点（正 = 更朝前） */
  headTurn: number;
  /** 胯（骨盆中心）的位置 */
  hip: V2;
  /** 整个人绕胯转（躺、翻、倒着） */
  rot: number;
  /** 上身前倾（相对骨盆，正 = 往前弯） */
  lean: number;
  /** 歪头 / 仰头 / 低头（朝左时正 = 仰） */
  neck: number;
  /** 呼吸 -1..1 */
  breath: number;
  /** 落地压扁（正）/ 起跳拉长（负） */
  squash: number;
  armL: ArmPose;
  armR: ArmPose;
  legL: LegPose;
  legR: LegPose;
  expr: Expr;
  /** 头发、围巾、衣摆往哪边垂：(0, 1) 正常，(0, -1) 飘起来 */
  gravity: V2;
  /** 惯性：动作带起来的头发、围巾（加在 gravity 上） */
  drag: V2;
  /** 水下一样的慢慢摆动 0..1（飘的时候） */
  float: number;
  /** 时间（秒）：摆动、眼泪用 */
  t: number;
  /** 身上的物品：显示或隐藏（每个角色自己定名字和默认值，见 Look.items） */
  items: Items;
}

/** 身上的物品：显示或隐藏、几块（每个角色自己定名字和默认值，见 Look.items） */
export type Items = Record<string, boolean | number>;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };
export type PoseIn = DeepPartial<Pose>;

// ——— 尺寸 ———
export const BODY = {
  // 按用户线稿量的（2026-10-17）：胯关节连线是原点
  thigh: 125,
  shin: 91.9,
  /** 穿鞋时脚踝离地（鞋底就在光脚的脚底下，骨架不变） */
  ankleBoot: 65.1,
  /** 光脚时脚踝离地（正面看脚背高） */
  ankleBare: 65.1,
  upperArm: 74.67,
  foreArm: 71.8,
  shoulderY: -142.8,
  neckY: -162.7,
  headUp: 55,
  /** 胯关节离中线（比线稿量的 26.6 往里收 5.4：正面站着时两条大腿根挨在一起，裆和参考图一样低） */
  hipW: 21.2,
  shoulderW: 37.6,
}

export const NEUTRAL: Expr = {
  blink: 0,
  happy: 0,
  sad: 0,
  fierce: 0,
  wide: 0,
  smile: 0.35,
  open: 0,
  look: [0, 0],
  blush: 0.3,
  tears: 0,
  squint: 0,
  round: 0,
  teeth: 0,
  wobble: 0,
};

export const DEFAULT_POSE: Pose = {
  face: 0,
  headTurn: 0,
  // 两腿伸直刚好够到脚踝（大腿 + 小腿 = 216.9，胯 ±21.2、脚踝 ±46.6、离地 65.1）：腿要是有一点富余，IK 会把膝盖顶弯，两边还弯得不对称
  hip: [0, -280.5],
  rot: 0,
  lean: 0,
  neck: 0,
  breath: 0,
  squash: 0,
  // 正面站姿照用户的人体三视图（`public/ref/秤砣-人体三视图.jpg`，2026-10-17）：手臂往外约 18°、几乎伸直，
  // 手套垂得比前臂更竖一点；两腿伸直，各往外约 5°（脚踝离中线 46.6）
  armL: { a: -0.26, b: -0.02, h: 0.26, shape: "relax" },
  armR: { a: 0.26, b: 0.02, h: -0.26, shape: "relax" },
  legL: { a: 0, b: 0, f: 0, thighK: 1, to: [46.6, -65.1], bend: 1, boot: true },
  legR: { a: 0, b: 0, f: 0, thighK: 1, to: [-46.6, -65.1], bend: 1, boot: true },
  expr: NEUTRAL,
  gravity: [0, 1],
  drag: [0, 0],
  float: 0,
  t: 0,
  items: {},
};

/** 补全姿势：没写的用默认姿势，物品用角色的默认值 */
export function resolvePose(p: PoseIn, look: Look = BASE_LOOK): Pose {
  return merge(merge(DEFAULT_POSE, { items: look.items ?? {} } as PoseIn), p);
}

/** 动作里的数是按原来的骨架写的（腿竖直 262 高、穿靴脚踝离地 34），用这两个换算到现在的骨架 */
export const LEG_K = 214.3 / 262;
/** 原来骨架的胯高 → 现在的 */
export const hipAt = (y: number) => -BODY.ankleBare + (y + 34) * LEG_K;
/** 原来骨架的脚踝位置 → 现在的 */
export const footAt = (x: number, y: number): V2 => [x * LEG_K, -BODY.ankleBare + (y + 34) * LEG_K];

// ——— 骨架 ———

export interface Limb {
  root: V2;
  mid: V2;
  end: V2;
  a1: number;
  a2: number;
  /** 上面那节在画面里的长度比例（大腿朝镜头时变短） */
  k?: number;
  /** 手 / 脚的坐标系 */
  tip: Frame;
}

export interface Rig {
  pose: Pose;
  /** 角色的外观（图层、配色） */
  look: Look;
  mir: boolean;
  u: number;
  /** 身体转角（朝左为负） */
  th: number;
  /** 头的转角 */
  thh: number;
  /** 头朝身体的反方向转（沿头的中线镜像着画） */
  headMir: boolean;
  pelvis: Frame;
  chest: Frame;
  head: Frame;
  neck: V2;
  arms: { L: Limb; R: Limb };
  legs: { L: Limb; R: Limb };
  field: V2;
  /** 3/4 时两腿整体沿胯往前挪了多少（跟着侧面线稿的毛衣下摆） */
  hipShift: number;
}

/** 两个角度之间走近路插值。 */
function mixAngle(a: number, b: number, w: number) {
  if (w >= 1) return b;
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * w;
}

/** 身体是一个椭圆柱：半宽 a、半厚 b。W 是转身后的轮廓半宽，fx 是表面上 φ 处（0 = 正前）的横坐标。 */
export function bodyFns(th: number) {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return {
    W: (a: number, b: number) => Math.sqrt(a * a * c * c + b * b * s * s),
    fx: (phi: number, a: number, b: number) => a * Math.sin(phi) * c + b * Math.cos(phi) * s,
    fz: (phi: number, a: number, b: number) => -a * Math.sin(phi) * s + b * Math.cos(phi) * c,
  };
}

export function figureRig(pIn: PoseIn | Pose, look: Look = BASE_LOOK): Rig {
  const pose = resolvePose(pIn as PoseIn, look);
  const mir = pose.face > 0;
  const u = Math.min(1, Math.abs(pose.face));
  const th = -u * 0.7;
  // 头的转向：身体转了 u、头再多转 headTurn；往身体的反方向转过了正面（uh < 0）时，头按转过去的量画、再沿头的中线镜像
  const uh = Math.max(-1, Math.min(1, u + pose.headTurn));
  const thh = -Math.abs(uh) * 0.62;
  const { fx } = bodyFns(th);
  const br = pose.breath * 1.6;
  const pelvis = new Frame(pose.hip[0], pose.hip[1], pose.rot);
  const chest = new Frame(pose.hip[0], pose.hip[1], pose.rot - pose.lean);
  const neck = chest.p(fx(0, 0, 10), BODY.neckY - br);
  const headBase = new Frame(neck[0], neck[1], chest.a + pose.neck);
  const hc = headBase.p(0, -BODY.headUp);
  const head = new Frame(hc[0], hc[1], headBase.a);
  const cth = Math.cos(th);

  const arm = (side: 1 | -1, ap: ArmPose): Limb => {
    // 肩关节：正面在线稿的位置，3/4 跟着侧面线稿的身子走
    const sh = lerpV(side === 1 ? REST.shoulder : [-REST.shoulder[0], REST.shoulder[1]], SHOULDER_SIDE[side === 1 ? "L" : "R"], u);
    // 厚外衣：袖子接在外衣的肩线上，正面往外挪，转到 3/4 挪回来
    const out = side * (look.shoulderOut?.(pose) ?? 0) * (1 - u);
    const root = chest.p(sh[0] + out, sh[1] - br);
    let a1 = chest.a + ap.a;
    let a2 = a1 + ap.b;
    const w = ap.to ? (ap.ik ?? 1) : 0;
    if (ap.to && w > 0) {
      const r = ik2(root, ap.to, BODY.upperArm, BODY.foreArm, ap.bend ?? -side);
      a1 = mixAngle(a1, r.a1, w);
      a2 = mixAngle(a2, r.a2, w);
    }
    const mid = add(root, mul(dirOf(a1), BODY.upperArm));
    const end = add(mid, mul(dirOf(a2), BODY.foreArm));
    return { root, mid, end, a1, a2, tip: new Frame(end[0], end[1], a2 + ap.h) };
  };
  // 3/4：两腿整体挪到侧面线稿毛衣下摆的下面（下摆往前多出一块，腿不挪的话下摆前面底下是空的、后面露出腿的一角）；
  // 用 IK 的脚的目标点跟着一起挪，腿还是原来的样子
  const hipShift = u * HIP_SIDE_SHIFT;
  const shiftV = rotateV([hipShift, 0], pelvis.a);
  const leg = (side: 1 | -1, lp: LegPose): Limb => {
    const root = pelvis.p(side * BODY.hipW * cth + hipShift, 0);
    const k = lp.thighK ?? 1;
    const thigh = BODY.thigh * k;
    let a1 = pelvis.a + lp.a;
    let a2 = a1 + lp.b;
    let fa = a2 + lp.f;
    const w = lp.to ? (lp.ik ?? 1) : 0;
    if (lp.to && w > 0) {
      const r = ik2(root, add(lp.to, shiftV), thigh, BODY.shin, lp.bend ?? 1);
      a1 = mixAngle(a1, r.a1, w);
      a2 = mixAngle(a2, r.a2, w);
      fa = mixAngle(fa, lp.f, w);
    }
    const mid = add(root, mul(dirOf(a1), thigh));
    const end = add(mid, mul(dirOf(a2), BODY.shin));
    return { root, mid, end, a1, a2, k, tip: new Frame(end[0], end[1], fa) };
  };
  return {
    pose,
    look,
    mir,
    u,
    th,
    thh,
    headMir: uh < 0,
    pelvis,
    chest,
    head,
    neck,
    arms: { L: arm(1, pose.armL), R: arm(-1, pose.armR) },
    legs: { L: leg(1, pose.legL), R: leg(-1, pose.legR) },
    field: add(pose.gravity, pose.drag),
    hipShift,
  };
}

// ——— 着地 ———
/** 光脚能着地的点（脚踝的局部坐标，画面左边那只）：脚尖、脚掌、脚跟 */
const BARE_SOLE: V2[] = [[-38, 63], [-20, 64.5], [0, 65], [12, 62]];
/** 跪着时膝盖着地的那一点在膝关节下面多远 */
const KNEE_R = 12;
/** 坐着时大腿后面着地：离骨头多远 */
const THIGH_R = 15;

/**
 * 身上能着地的点（画面坐标）：两只脚的鞋底（穿着鞋时问角色的 Look.soles）、膝盖、大腿后面（坐着）。
 * 脚踩地（ground）就是把最低的那一点放到地面上：站着是鞋底，跪着是膝盖，坐在地上是大腿后面。
 */
export function contactsOf(rig: Rig): V2[] {
  const pts: V2[] = [];
  for (const side of ["L", "R"] as const) {
    const limb = rig.legs[side];
    const lp = side === "L" ? rig.pose.legL : rig.pose.legR;
    const shod = (rig.look.shoe?.(rig, side) ?? false) && lp.boot;
    const own = shod ? rig.look.soles?.(rig, side) : undefined;
    if (own) pts.push(...own);
    else {
      const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
      for (const [x, y] of BARE_SOLE) pts.push(limb.tip.p(x * fx, y));
    }
    pts.push([limb.mid[0], limb.mid[1] + KNEE_R]);
    // 大腿后面（朝左时在大腿右边）：坐下时贴着地
    const back: V2 = [Math.cos(limb.a1) * THIGH_R, Math.sin(limb.a1) * THIGH_R];
    for (const k of [0.15, 0.5]) pts.push(add(lerpV(limb.root, limb.mid, k), back));
  }
  return pts;
}

/** 脚踩地时胯该放多高：把这个姿势（胯在 0 高度时）最低的着地点放到地面上 */
export function groundHip(pose: PoseIn, look: Look = BASE_LOOK): number {
  const rig = figureRig({ ...pose, hip: [0, 0] }, look);
  return -Math.max(...contactsOf(rig).map((p) => p[1]));
}

/** 关节在画面里的位置（已按朝向镜像），用来对齐道具、别的角色。 */
export function figureJoints(pIn: PoseIn | Pose, look: Look = BASE_LOOK) {
  const r = figureRig(pIn, look);
  const m = (v: V2): V2 => (r.mir ? [-v[0], v[1]] : v);
  return {
    head: m(r.head.o),
    neck: m(r.neck),
    hip: m(r.pelvis.o),
    wristL: m(r.arms.L.end),
    wristR: m(r.arms.R.end),
    elbowL: m(r.arms.L.mid),
    elbowR: m(r.arms.R.mid),
    shoulderL: m(r.arms.L.root),
    shoulderR: m(r.arms.R.root),
    ankleL: m(r.legs.L.end),
    ankleR: m(r.legs.R.end),
    kneeL: m(r.legs.L.mid),
    kneeR: m(r.legs.R.mid),
    /** 手掌中心 */
    palmL: m(r.arms.L.tip.p(0, 17)),
    palmR: m(r.arms.R.tip.p(0, 17)),
  };
}

// ——— 画 ———
export interface HoldInfo {
  layer: "back" | "front";
  shape: HandShape;
  sx: number;
}
export type HoldFn = (ctx: CanvasRenderingContext2D, hand: Frame, mir: boolean, info: HoldInfo) => void;

export interface DrawOptions {
  /** 描边粗细倍数（特写时可以调细） */
  line?: number;
  /**
   * 手里拿的东西：每只手调用两次，info.layer 为 back（整只手后面）和 front（手掌和大拇指之间），在其中一层画；
   * 参数是手的坐标系（局部 +y 指向指尖）、是否镜像、手形和左右（sx：这只手局部 x 的朝向，大拇指在 −x·sx 那边）。砖用 holdBrick。
   */
  hold?: { L?: HoldFn; R?: HoldFn };
  /** 在横在胸前的手臂之前画（被抱的人等） */
  beforeFrontArms?: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * 角色的外观：在基础模型上换配色、发型、衣服、鞋和人物特点。图层按从后往前的顺序画在基础模型的各层之间，
 * 函数都拿到骨架（rig，姿势和物品开关在 rig.pose 里）和画笔（ink）；不写就是基础模型本来的样子。
 */
export interface Look {
  /** 配色：换掉基础模型的颜色（皮肤、眼睛、上衣 top、下装 bottom…） */
  colors?: Partial<Palette>;
  /** 物品的默认值（Pose.items） */
  items?: Items;
  /** 上衣的圆领（默认有） */
  collar?: boolean;
  /** 袖子的颜色（默认是上衣的） */
  sleeve?(rig: Rig): [string, string];
  /** 手套的颜色；不写或返回 null 是光着手 */
  hands?(rig: Rig): [string, string] | null;
  /** 厚外衣：正面时两个肩关节各往外挪多少 */
  shoulderOut?(pose: Pose): number;
  /** 正面时上臂压在外衣上面（默认上臂藏在身子后面，显示身子的边） */
  armsOver?(rig: Rig): boolean;
  /** 身子在画面里另外占的几块（外衣的前襟）：压在身子上的手臂按它们裁掉描边、阴影 */
  bodyPieces?(rig: Rig): Path2D[];
  /** 最后面：后面的头发（头往身体反方向转时跟着头镜像） */
  backHair?(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink): void;
  /** 身子后面、手臂和腿前面：绕到脖子后面的东西（围脖的后半圈） */
  neckBack?(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink): void;
  /** 身子上面：外衣。sides：和身子在肩膀接成一块的上臂（这些上臂的肩膀圈里不描边，用 fillBodyPart / strokeBodyPart） */
  overTorso?(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, sides: ("L" | "R")[]): void;
  /** 脖子前面、头后面：围脖的前半圈、领子 */
  neckFront?(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink): void;
  /** 脸上面、眉毛下面：刘海、鬓发（头往反方向转时跟着头镜像） */
  frontHair?(ctx: CanvasRenderingContext2D, head: HeadView, ink: Ink): void;
  /** 人物特点：脸上另外的东西（雀斑、痣、眼镜），最后画 */
  face?(ctx: CanvasRenderingContext2D, head: HeadView, ink: Ink): void;
  /** 身边的手臂前面、横在胸前的手臂后面：挂在胸前的东西（围巾垂下来的一头） */
  chest?(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink): void;
  /** 前臂填色（代替袖子的颜色，例如卷起的袖子下面露出手臂） */
  forearm?(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", lower: Path2D, ink: Ink): void;
  /** 上臂上的东西（袖标、铆钉）：upper 是上臂的轮廓 */
  onUpperArm?(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", upper: Path2D, ink: Ink): void;
  /** 前臂上的东西（袖口翻边），画在手套前 */
  onForearm?(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink): void;
  /** 这只脚穿着鞋：不画光脚，鞋在 overLeg 里画 */
  shoe?(rig: Rig, side: "L" | "R"): boolean;
  /** 每条腿画完以后：鞋、靴子 */
  overLeg?(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink): void;
  /** 穿着鞋的脚能着地的点（画面坐标，鞋底和鞋面一圈）：脚踩地按它算；不写按光脚 */
  soles?(rig: Rig, side: "L" | "R"): V2[];
  /** 人物特点：头相对身子放大多少（小孩头大，1.25 左右），以脖子为中心 */
  headScale?: number;
  /** 人物特点：体型宽窄（横向缩放，壮的人 1.1–1.2） */
  width?: number;
}

/** 基础模型本身：素色上衣、下装，光头、光手、光脚 */
export const BASE_LOOK: Look = {};

/** 画头上东西（刘海、人物特点）用的：头的坐标和贴着脸的映射 */
export interface HeadView {
  rig: Rig;
  /** 头的坐标 → 画面 */
  H: (x: number, y: number) => V2;
  /** 头转到 3/4 的程度（0 正面 → 1） */
  uh: number;
  /** 贴着脸边的东西（耳朵、鬓发）：每一行按正面脸的左右边 → 现在脸的左右边横向映射，再到画面 */
  place: (p: V2) => V2;
  /** 皮肤（脸、耳朵）的轮廓 */
  skins: Path2D[];
  /** 只描压在皮肤上的边（头发压在头发上的边不描）：裁到皮肤里，再扣掉 under 盖住的地方 */
  strokeOnSkin: (path: Path2D, under: Path2D[], lw?: number) => void;
}

/** 画一个角色：基础模型 + look（不给 look 就是基础模型本身） */
export function drawFigure(ctx: CanvasRenderingContext2D, pIn: PoseIn | Pose, look: Look = BASE_LOOK, opts: DrawOptions = {}) {
  const prev = K;
  K = { ...BASE_COLORS, ...look.colors };
  const w = look.width ?? 1;
  if (w !== 1) {
    ctx.save();
    ctx.scale(w, 1);
  }
  try {
    render(ctx, figureRig(pIn, look), opts);
  } finally {
    K = prev;
    if (w !== 1) ctx.restore();
  }
}

function render(ctx: CanvasRenderingContext2D, rig: Rig, opts: DrawOptions) {
  const { pose, mir, u, look } = rig;
  const ink: Ink = { line: K.line, lw: 3.0 * (opts.line ?? 1), shade: [mir ? -4 : 4, 4] };
  const farBack = (side: "L" | "R") => {
    const ap = side === "L" ? pose.armL : pose.armR;
    if (ap.layer) return ap.layer === "back";
    return side === "R" && u >= 0.55;
  };
  // 正面（和腿合并描边用同一个界限）：上臂画在身子后面，见 drawUpperArm
  const front = u < 0.55;
  const scoped = (fn: () => void) => {
    ctx.save();
    if (pose.squash) ctx.scale(1 + pose.squash * 0.6, 1 - pose.squash);
    if (mir) ctx.scale(-1, 1);
    fn();
    ctx.restore();
  };

  // 头往身体的反方向转时：头（和后面的头发）沿头的中线镜像着画，光的方向、风在头上的方向跟着换回来
  const headView = (fn: (r: Rig, k: Ink) => void) => {
    const hs = look.headScale ?? 1;
    if (hs !== 1) {
      // 头以脖子为中心放大（小孩头大）
      ctx.save();
      ctx.translate(rig.neck[0], rig.neck[1]);
      ctx.scale(hs, hs);
      ctx.translate(-rig.neck[0], -rig.neck[1]);
    }
    if (!rig.headMir) {
      fn(rig, ink);
      if (hs !== 1) ctx.restore();
      return;
    }
    const { head } = rig;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(head.a);
    ctx.scale(-1, 1);
    ctx.rotate(-head.a);
    ctx.translate(-head.x, -head.y);
    fn({ ...rig, field: reflectOnHead(rig, rig.field) }, { ...ink, shade: [-ink.shade[0], ink.shade[1]] });
    ctx.restore();
    if (hs !== 1) ctx.restore();
  };

  scoped(() => {
    headView((r, k) => look.backHair?.(ctx, r, k));
    if (farBack("R")) drawArm(ctx, rig, "R", ink, opts);
    if (farBack("L")) drawArm(ctx, rig, "L", ink, opts);
    drawLegs(ctx, rig, ink);
    const behind = front ? (["R", "L"] as const).filter((side) => !farBack(side)) : [];
    const over = look.armsOver?.(rig) ?? false;
    if (!over) for (const side of behind) drawUpperArm(ctx, rig, side, ink);
    // 身子在这些手臂的肩膀圈里不描边：正面时画在身子后面的上臂，加上 3/4 时整只在身子后面的远侧手臂
    // （用户 2026-10-18：远侧肩膀的线要和参考图一样，从腋下才开始，不一直连到肩头）
    const merged = [...behind, ...(["R", "L"] as const).filter(farBack)];
    look.neckBack?.(ctx, rig, ink);
    drawTorso(ctx, rig, ink, merged);
    look.overTorso?.(ctx, rig, ink, merged);
    // 外衣上面的正面上臂：袖子盖着外衣的边
    if (over) for (const side of behind) drawUpperArmOver(ctx, rig, side, ink);
    look.neckFront?.(ctx, rig, ink);
    headView((r, k) => drawHead(ctx, r, k));
  });
  // 前面的手臂和挂在胸前的东西（围巾垂下来那头）：垂在身边、举起来的手臂在它后面（风把它吹过手臂时压在手臂上），
  // 横在胸前的前臂（抱臂、递东西、抱人）压在它上面
  const fronts = (["R", "L"] as const).filter((side) => !farBack(side));
  const drawFront = (side: "L" | "R") => (front ? drawForearm(ctx, rig, side, ink, opts) : drawArm(ctx, rig, side, ink, opts));
  scoped(() => {
    for (const side of fronts) if (!crossesChest(rig, side)) drawFront(side);
    look.chest?.(ctx, rig, ink);
  });
  opts.beforeFrontArms?.(ctx);
  scoped(() => {
    for (const side of fronts) if (crossesChest(rig, side)) drawFront(side);
  });
}

/** 向量沿头的中线镜像（头的坐标里 x 取反） */
function reflectOnHead(rig: Rig, v: V2): V2 {
  const l = rotateV(v, -rig.head.a);
  return rotateV([-l[0], l[1]], rig.head.a);
}

/** 前臂横在胸前（朝身体中线那边伸）：抱臂、递东西、抱人。按前臂在胸口坐标里朝里的分量判断 */
export function crossesChest(rig: Rig, side: "L" | "R") {
  const limb = rig.arms[side];
  const d = rotateV(sub(limb.end, limb.mid), -rig.chest.a);
  return (side === "L" ? -d[0] : d[0]) / BODY.foreArm > 0.35;
}

// ——— 头（用户亲手画的线稿，2026-10-17，`public/ref/秤砣-线稿.svg` 的「头部」图层） ———
// 换算成头的坐标：脸最宽处半宽 41、下巴在 48，比例 0.905，中线 x=229.5。路径都是 [起点, 控制点1, 控制点2, 终点, 控制点1, …]（三次贝塞尔）。
const EAR_L: V2[] = [
  [-39.97, 3.52], [-40.81, -0.8], [-55.11, 2.06], [-49.12, 14.92], [-43.13, 27.78], [-33.56, 26.4], [-33.61, 26.34],
  [-33.65, 26.28], [-39.13, 7.85], [-39.97, 3.52],
];
const EAR_R: V2[] = [
  [39.2, 3.62], [40.09, -0.64], [51.75, 3.04], [46.21, 15.53], [40.67, 28.02], [32.85, 26.09], [32.89, 26.03],
  [32.93, 25.98], [38.3, 7.9], [39.2, 3.62],
];
/** 眉毛（透过刘海画在头发上，往外眼角那头低一点） */
const BROW_L: V2[] = [[-35.78, -12.61], [-35.78, -12.61], [-28.77, -15.14], [-24.42, -15.75], [-20.07, -16.35], [-18.5, -16.11], [-18.5, -16.11]];
const BROW_R: V2[] = [[19.09, -15.75], [19.09, -15.75], [24.89, -15.99], [29.0, -15.38], [33.11, -14.78], [36.73, -13.33], [36.73, -13.33]];
/** 线稿里眼珠的中心 (±20.52, 7.97)、半径 6.97×9.96；外侧月牙眼白最宽到 10.6 */
export const EYE_X = 20.52;
const EYE_Y = 7.97;
const IRIS_RX = 6.97;
const IRIS_RY = 9.96;
const EYE_OUT = 10.6;

/** 按 map 把一串三次贝塞尔点画成路径 */
export function cubicPath(pts: V2[], map: (p: V2) => V2, close = true, path = new Path2D()): Path2D {
  let p = map(pts[0]);
  path.moveTo(p[0], p[1]);
  for (let i = 1; i + 2 < pts.length; i += 3) {
    const c = map(pts[i + 2]);
    const a = firmHandle(p, map(pts[i]), map(pts[i + 1]));
    const b = firmHandle(c, map(pts[i + 1]), a);
    path.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    p = c;
  }
  if (close) path.closePath();
  return path;
}

/**
 * 手柄几乎是零长（线稿里的尖角、编辑器留下的零点几个单位的小钩子）时，换成顺着曲线方向的一小段：
 * 显卡描边在这种点上会在轮廓外画出一小点白痕（头发右边耳朵高度那里）。形状看不出变化。
 */
function firmHandle(anchor: V2, handle: V2, other: V2): V2 {
  if (Math.hypot(handle[0] - anchor[0], handle[1] - anchor[1]) >= 1) return handle;
  const dx = other[0] - anchor[0];
  const dy = other[1] - anchor[1];
  const l = Math.hypot(dx, dy);
  if (l < 1e-6) return handle;
  return [anchor[0] + (dx / l) * 0.5, anchor[1] + (dy / l) * 0.5];
}

export const smooth01 = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ——— 身体（用户线稿 `public/ref/秤砣-线稿.svg` 的「身体」图层，2026-10-17） ———
// 身体坐标：原点在两个胯关节连线的中点，y 向下；线稿像素 → ((X − 229.5)·0.905, (Y − 463.8)·0.905)，和头部同一个比例。
/** 脖子（藏在围巾后面） */
const NECK: V2[] = [[-12.09, -174.17], [-11.28, -172.63], [-11.44, -169.06], [-11.44, -166.36], [-11.44, -163.66], [-11.56, -160.7], [-12.61, -159.86], [-13.66, -159.03], [13.55, -159.29], [13.1, -159.47], [12.64, -159.65], [10.94, -163.45], [10.8, -166.14], [10.64, -168.84], [11.09, -173.65], [12.26, -174.49], [13.44, -175.32], [-12.91, -175.7], [-12.09, -174.16]];
/** 身子（毛衣） */
const TORSO: V2[] = [[-0.15, -5.41], [15.75, -5.41], [47.18, -9.96], [49.04, -11.17], [50.89, -12.38], [41.88, -52.75], [39.23, -67.9], [36.58, -83.05], [48.31, -136.82], [44.53, -145.53], [40.75, -154.24], [8.55, -161.43], [0.6, -161.43], [-7.36, -161.43], [-39.54, -153.48], [-44.09, -145.91], [-48.63, -138.34], [-37.65, -88.35], [-39.54, -70.92], [-41.44, -53.5], [-52.79, -14.5], [-50.52, -11.47], [-48.25, -8.44], [-0.15, -5.41], [-0.15, -5.41]];
/** 手臂（画的是画面右边那只，上臂和前臂一整条，按肘关节切开） */
const ARM: V2[] = [[111.75, -15.82], [111.75, -15.82], [67.59, -70.62], [67.59, -70.62], [67.59, -70.62], [17.98, -134.24], [17.98, -134.24], [17.98, -134.24], [14.05, -138.9], [29.57, -150.64], [45.09, -162.38], [85.61, -87.4], [85.39, -87.66], [85.16, -87.92], [126.14, -30.21], [125.91, -26.69], [125.68, -23.17], [113.64, -14.31], [111.74, -15.82]];
/** 手套：手掌 */
const PALM: V2[] = [[111.49, -16.15], [111.49, -16.15], [130.19, 10.63], [133.38, 11.68], [136.56, 12.74], [148.67, 1.28], [148.46, -1.06], [148.26, -3.39], [125.73, -27.61], [125.65, -27.79], [125.57, -27.96], [111.5, -16.15], [111.5, -16.15]];
/** 手套：大拇指 */
const THUMB: V2[] = [[129.33, 5.53], [129.33, 5.53], [133.16, 18.7], [128.48, 20.83], [123.81, 22.95], [111.7, -6.37], [116.79, -16.15], [121.89, -25.92], [129.33, 5.52], [129.33, 5.52]];
/** 手套：三根手指 */
const FINGERS: V2[][] = [
  [[130.4, 7.01], [130.4, 7.01], [142.3, 24.44], [146.76, 22.1], [151.22, 19.77], [136.78, 1.92], [136.78, 1.92], [136.78, 1.92], [130.41, 7.01], [130.41, 7.01]],
  [[137.2, 1.7], [137.2, 1.7], [148.67, 24.01], [152.92, 19.33], [157.16, 14.66], [140.81, -2.98], [140.81, -2.98], [140.81, -2.98], [137.2, 1.69], [137.2, 1.69]],
  [[141.44, -2.76], [141.44, -2.76], [152.27, 18.48], [156.1, 13.81], [159.93, 9.14], [143.99, -6.16], [143.99, -6.16], [143.99, -6.16], [141.44, -2.76], [141.44, -2.76]],
];
/** 画面左边那条腿（大腿和小腿一整条，按膝关节切开） */
const LEG_R_SHAPE: V2[] = [[-49.93, -11.34], [-49.93, -11.34], [-57.37, 83.89], [-58.04, 87.95], [-58.72, 92], [-65.48, 133.2], [-67.5, 137.93], [-69.53, 142.65], [-70.21, 191.29], [-70.21, 195.34], [-70.21, 199.39], [-74.26, 211.52], [-73.53, 214.46], [-72.8, 217.39], [-52.25, 220.45], [-46.97, 215.8], [-41.7, 211.17], [-41.84, 177.78], [-40.49, 175.75], [-39.15, 173.73], [-32.68, 150.85], [-33.06, 139.96], [-33.44, 129.06], [-0.64, -7.3], [-1.05, -7.77], [-1.25, -8], [-13.48, -8.9], [-25.65, -9.73], [-31.74, -10.15], [-37.82, -10.55], [-42.37, -10.85], [-46.92, -11.15], [-49.95, -11.34], [-49.95, -11.34]];
/** 画面右边那条腿 */
const LEG_L_SHAPE: V2[] = [[48.13, -14.12], [48.13, -14.12], [53.82, 29.43], [53.82, 32.09], [53.82, 34.74], [54.96, 83.97], [56.09, 87], [57.23, 90.03], [66.7, 139.26], [67.07, 141.91], [67.45, 144.56], [70.1, 196.06], [70.1, 197.2], [70.1, 198.34], [73.13, 209.32], [73.13, 211.6], [73.13, 213.87], [64.8, 217.65], [63.67, 217.28], [62.52, 216.9], [46.24, 216.9], [45.49, 215.39], [44.73, 213.88], [43.6, 191.53], [42.08, 189.64], [40.57, 187.75], [35.26, 161.24], [34.88, 158.96], [34.5, 156.69], [27.31, 115.79], [26.55, 109.35], [26.55, 109.35], [0.95, -6.23], [0.95, -6.23], [6.78, -6.3], [48.13, -14.1], [48.13, -14.1]];
/** 光脚（画的是画面左边那只）：脚背内侧和大脚趾 */
const FOOT_IN: V2[] = [[-47.55, 215.23], [-47.55, 215.23], [-47.34, 230.75], [-47.12, 233.93], [-46.91, 237.12], [-45.38, 251.15], [-45.42, 254.36], [-45.45, 257.57], [-46.18, 259.88], [-48.02, 261.25], [-49.87, 262.62], [-52.76, 264.82], [-53.17, 267.78], [-53.59, 270.75], [-56.32, 272.2], [-57.45, 273.72], [-58.57, 275.24], [-66.99, 280.6], [-71.42, 278.52], [-75.86, 276.44], [-73.13, 268.64], [-69.85, 266.01], [-68.36, 265.8], [-47.54, 215.23], [-47.54, 215.23], [-47.54, 215.23], [-47.55, 215.23], [-47.55, 215.23]];
/** 光脚：其余的部分（填色用的轮廓） */
const FOOT_OUT: V2[] = [[-73.47, 276.85], [-73.47, 276.85], [-79.21, 280.26], [-81.12, 278.13], [-83.03, 276], [-81.75, 268.57], [-78.78, 267.08], [-78.78, 267.08], [-81.76, 275.79], [-81.76, 275.79], [-81.76, 275.79], [-85.79, 279.82], [-88.98, 275.79], [-92.17, 271.75], [-86.85, 266.23], [-87.04, 266.06], [-87.04, 266.06], [-89.19, 276], [-89.19, 276], [-81.75, 275.79], [-96.84, 279.19], [-95.78, 272.82], [-94.72, 266.44], [-93.23, 265.59], [-93.42, 265.42], [-93.42, 265.42], [-95.56, 274.52], [-95.56, 274.52], [-95.56, 274.52], [-100.02, 274.09], [-100.87, 270.48], [-101.72, 266.87], [-98.54, 265.59], [-93.86, 260.28], [-89.19, 254.97], [-76.86, 236.49], [-75.38, 232.87], [-73.89, 229.26], [-72.82, 213.54], [-73.01, 213.37], [-73.2, 213.2], [-47.96, 214.82], [-48.16, 214.65], [-48.16, 214.65], [-47.54, 215.23], [-47.54, 215.23], [-47.54, 215.23], [-68.36, 265.8], [-69.85, 266.01], [-69.85, 266.01], [-73.47, 276.85], [-73.47, 276.85]];
/** 光脚的线：三个小脚趾和外侧的边（照画的描） */
const FOOT_LINES: V2[][] = [
  [[-73.47, 276.85], [-73.47, 276.85], [-79.21, 280.26], [-81.12, 278.13], [-83.03, 276], [-81.75, 268.57], [-78.78, 267.08]],
  [[-81.76, 275.79], [-81.76, 275.79], [-85.79, 279.82], [-88.98, 275.79], [-92.17, 271.75], [-86.85, 266.23], [-87.04, 266.06]],
  [[-89.19, 276], [-81.75, 275.79], [-96.84, 279.19], [-95.78, 272.82], [-94.72, 266.44], [-93.23, 265.59], [-93.42, 265.42]],
  [[-95.56, 274.52], [-95.56, 274.52], [-100.02, 274.09], [-100.87, 270.48], [-101.72, 266.87], [-98.54, 265.59], [-93.86, 260.28], [-89.19, 254.97], [-76.86, 236.49], [-75.38, 232.87], [-73.89, 229.26], [-72.82, 213.54], [-73.01, 213.37], [-73.2, 213.2], [-47.96, 214.82], [-48.16, 214.65]],
];
/** 线稿里的关节（身体坐标）：肩、肘、腕在画面右边那只手臂上；腿两条都画了 */
export const REST = {
  // 肩关节放在手臂顶上那个圆头的中心（盖住身子的肩角）：原来放在线稿手臂顶端靠里，手臂一垂下来圆头就往下掉、露出身子方方的肩角
  shoulder: [37.56, -142.83] as V2,
  elbow: [76.48, -79.11] as V2,
  wrist: [118.84, -21.27] as V2,
  hipL: [26.07, -0.27] as V2,
  kneeL: [45.26, 123.28] as V2,
  ankleL: [59.28, 213.51] as V2,
  hipR: [-27.06, 0.27] as V2,
  kneeR: [-46.07, 123.28] as V2,
  ankleR: [-60.28, 215.14] as V2,
};


/** 把一串三次贝塞尔点采样成折线 */
function samplePts(pts: V2[], n = 10): V2[] {
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
  return out;
}

/** 从 from 到 to 的半圆，往 bulge 那边鼓 */
function capArc(from: V2, to: V2, bulge: V2, n = 10): V2[] {
  const m: V2 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const r = Math.hypot(from[0] - m[0], from[1] - m[1]);
  const a0 = Math.atan2(from[1] - m[1], from[0] - m[0]);
  let sweep = Math.atan2(to[1] - m[1], to[0] - m[0]) - a0;
  sweep = ((((sweep + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  const mid = a0 + sweep / 2;
  if (Math.cos(mid) * bulge[0] + Math.sin(mid) * bulge[1] < 0) sweep -= (Math.sign(sweep) || 1) * 2 * Math.PI;
  const out: V2[] = [];
  for (let k = 1; k < n; k++) {
    const a = a0 + (sweep * k) / n;
    out.push([m[0] + r * Math.cos(a), m[1] + r * Math.sin(a)]);
  }
  return out;
}

/**
 * 在关节处把一整条手臂 / 腿切成两节（切线垂直于骨头），两节在切口各补一个半圆：
 * 弯的时候接缝被半圆盖住，合并描边后看不出切口。
 */
function splitAtJoint(poly: V2[], J: V2, axis: V2): [V2[], V2[]] {
  const n = poly.length;
  const d = poly.map((p) => (p[0] - J[0]) * axis[0] + (p[1] - J[1]) * axis[1]);
  const s0 = d.findIndex((v) => v < 0);
  const at = (i: number) => (s0 + i) % n;
  const cross = (i: number, j: number): V2 => {
    const k = d[i] / (d[i] - d[j]);
    return [lerp(poly[i][0], poly[j][0], k), lerp(poly[i][1], poly[j][1], k)];
  };
  const near1: V2[] = [];
  const far: V2[] = [];
  const near2: V2[] = [];
  let X1: V2 | null = null;
  let X2: V2 | null = null;
  for (let k = 0; k < n; k++) {
    const i = at(k);
    const j = at(k + 1);
    if (!X1) near1.push(poly[i]);
    else if (!X2) far.push(poly[i]);
    else near2.push(poly[i]);
    if (!X1 && d[i] < 0 && d[j] >= 0) X1 = cross(i, j);
    else if (X1 && !X2 && d[i] >= 0 && d[j] < 0) X2 = cross(i, j);
  }
  const a = X1 ?? J;
  const b = X2 ?? J;
  const back: V2 = [-axis[0], -axis[1]];
  const upper = [b, ...near2, ...near1, a, ...capArc(a, b, axis)];
  const lower = [a, ...far, b, ...capArc(b, a, back)];
  return [upper, lower];
}

/** 身体坐标 → 骨头的局部坐标（原点 o、转角 a，局部 +y 顺着骨头） */
export function toLocal(pts: V2[], o: V2, a: number): V2[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => {
    const dx = x - o[0];
    const dy = y - o[1];
    return [dx * c + dy * s, -dx * s + dy * c];
  });
}

/** 统一成同一个绕向：几块拼成一条路径填色时，重叠的地方才不会被当成洞 */
function clockwise(pts: V2[]): V2[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  return area < 0 ? [...pts].reverse() : pts;
}

/** 手臂、腿切成上下两节，分别放进各自骨头的局部坐标 */
function limbPieces(shape: V2[], root: V2, mid: V2, end: V2) {
  const aU = angleOf(sub(mid, root));
  const aL = angleOf(sub(end, mid));
  const axis = norm(add(dirOf(aU), dirOf(aL)));
  const [up, lo] = splitAtJoint(samplePts(shape, 12), mid, axis);
  return { upper: clockwise(toLocal(up, root, aU)), lower: clockwise(toLocal(lo, mid, aL)) };
}

const ARM_PIECES = limbPieces(ARM, REST.shoulder, REST.elbow, REST.wrist);
const LEG_PIECES = {
  L: limbPieces(LEG_L_SHAPE, REST.hipL, REST.kneeL, REST.ankleL),
  R: limbPieces(LEG_R_SHAPE, REST.hipR, REST.kneeR, REST.ankleR),
};
/** 手套在手腕的局部坐标里（手腕原点，+y 指向指尖） */
export const HAND_A = angleOf(sub(REST.wrist, REST.elbow));
const HAND = {
  palm: toLocal(PALM, REST.wrist, HAND_A),
  thumb: toLocal(THUMB, REST.wrist, HAND_A),
  fingers: FINGERS.map((f) => toLocal(f, REST.wrist, HAND_A)),
};
/** 光脚在脚踝的局部坐标里（画的是画面左边那只，另一只镜像） */
const FOOT = {
  inner: toLocal(FOOT_IN, REST.ankleR, 0),
  outer: toLocal(FOOT_OUT, REST.ankleR, 0),
  lines: FOOT_LINES.map((l) => toLocal(l, REST.ankleR, 0)),
};

// ——— 转身：身子、脖子从正面线稿过渡到侧面线稿（chengtuo-side.ts） ———
/** 两张线稿的同一块按包围盒里的几个标志点切段、逐点对应（box：标志点在包围盒里的比例位置，按顺时针排） */
function turnPair(front: V2[], side: V2[], box: V2[], perSeg: number): [V2[], V2[]] {
  const a = clockwisePoly(bezierPolyline(front));
  const b = clockwisePoly(bezierPolyline(side));
  return matchOutlines(a, marksByBox(a, box), b, marksByBox(b, box), perSeg);
}
/** 身子：领口中间、右肩、右腰、右下角、下摆中间、左下角、左腰、左肩 */
const TORSO_TURN = turnPair(TORSO, SIDE_TORSO, [[0.5, 0], [1, 0.1], [1, 0.55], [1, 1], [0.5, 1], [0, 1], [0, 0.55], [0, 0.1]], 16);
/** 脖子：四个角 */
const NECK_TURN = turnPair(NECK, SIDE_NECK, [[0, 0], [1, 0], [1, 1], [0, 1]], 8);
/**
 * 脖子上半截跟着头转（headTurn 让头和身体转得不一样时，转过去的下颌比正面高、偏到一边，脖子顶不跟着就露出一道空隙）：
 * 侧面线稿的脖子换成相对脖子那一点（3/4 时往前挪了 6.44）的坐标，头往反方向转时再镜像一份
 */
const NECK_HEAD_TURN = {
  same: turnPair(NECK, SIDE_NECK.map(([x, y]): V2 => [x + 6.44, y]), [[0, 0], [1, 0], [1, 1], [0, 1]], 8),
  mirror: turnPair(NECK, SIDE_NECK.map(([x, y]): V2 => [-(x + 6.44), y]), [[0, 0], [1, 0], [1, 1], [0, 1]], 8),
};
/** 肩关节转到 3/4 时的位置：跟着身子轮廓上离它最近的那一点挪 */
/** 3/4 时围脖往前（画面左）挪多少：跟着脖子的中间走 */
export const WRAP_SIDE_SHIFT = (() => {
  const mid = (pts: V2[]) => pts.reduce((a, p) => a + p[0], 0) / pts.length;
  return mid(NECK_TURN[1]) - mid(NECK_TURN[0]);
})();
/** 3/4 时两腿往前（画面左）挪多少：跟着毛衣下摆中间那一点走 */
const HIP_SIDE_SHIFT = (() => {
  const i = nearestIndex(TORSO_TURN[0], [0, -5.4]);
  return TORSO_TURN[1][i][0] - TORSO_TURN[0][i][0];
})();
const SHOULDER_SIDE = (() => {
  const follow = (p: V2): V2 => {
    const i = nearestIndex(TORSO_TURN[0], p);
    return add(p, sub(TORSO_TURN[1][i], TORSO_TURN[0][i]));
  };
  return { L: follow(REST.shoulder), R: follow([-REST.shoulder[0], REST.shoulder[1]]) };
})();

export function polyPath(pts: V2[], map: (p: V2) => V2): Path2D {
  const path = new Path2D();
  pts.forEach((q, i) => {
    const m = map(q);
    if (i) path.lineTo(m[0], m[1]);
    else path.moveTo(m[0], m[1]);
  });
  path.closePath();
  return path;
}

// ——— 手臂、手 ———
/** 袖子的颜色：角色的 Look.sleeve，默认是上衣的 */
function sleeveColors(rig: Rig): [string, string] {
  return rig.look.sleeve?.(rig) ?? [K.top, K.topShade];
}

/** 前臂填色：角色的 Look.forearm（卷起的袖子等），默认整节是袖子的颜色 */
function fillForearm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", lower: Path2D, ink: Ink) {
  if (rig.look.forearm) rig.look.forearm(ctx, rig, side, lower, ink);
  else fillShaded(ctx, lower, ...sleeveColors(rig), ink);
}

/**
 * 肩膀那一圈：袖子和身子在这里是一块（参考图 `public/ref/秤砣-抱臂遮挡参考.png`），这里面它们互相重叠的地方不描线；
 * 胳膊和身子之间那条线从腋下（上臂大约三分之一处）才开始。
 */
const SHOULDER_MERGE_R = 32;
export function shoulderZone(rig: Rig, side: "L" | "R"): Path2D {
  const [x, y] = rig.arms[side].root;
  const p = new Path2D();
  p.arc(x, y, SHOULDER_MERGE_R, 0, Math.PI * 2);
  return p;
}
/** 裁剪用：除了 path 以外的地方 */
export function outside(path: Path2D): Path2D {
  const p = new Path2D();
  p.rect(-1e4, -1e4, 2e4, 2e4);
  p.addPath(path);
  return p;
}

/** 一只手臂的两节放到现在的姿势上（线稿画的是 L 即画面右边那只，R 整只镜像） */
export function armPaths(rig: Rig, side: "L" | "R") {
  const limb = rig.arms[side];
  const sx = side === "L" ? 1 : -1;
  const fU = new Frame(limb.root[0], limb.root[1], limb.a1);
  const fF = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  const on = (f: Frame) => ([x, y]: V2) => f.p(x * sx, y);
  return { limb, sx, upper: polyPath(ARM_PIECES.upper, on(fU)), lower: polyPath(ARM_PIECES.lower, on(fF)) };
}

function drawArm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, opts: DrawOptions) {
  const { limb, sx, upper, lower } = armPaths(rig, side);
  const ap = side === "L" ? rig.pose.armL : rig.pose.armR;
  const [base, shade] = sleeveColors(rig);
  strokeOverBody(ctx, rig, side, ink, [upper, lower]);
  fillShaded(ctx, upper, base, shade, ink);
  fillForearm(ctx, rig, side, lower, ink);
  unshadeShoulder(ctx, rig, side, upper, base);
  rig.look.onUpperArm?.(ctx, rig, side, upper, ink);
  rig.look.onForearm?.(ctx, rig, side, ink);
  drawGlove(ctx, limb.tip, sx, ap.shape, ink, (c, layer) => opts.hold?.[side]?.(c, limb.tip, rig.mir, { layer, shape: ap.shape, sx }), rig.look.hands?.(rig) ?? null);
}

/** 压在身子上的手臂合并描边（两倍宽的边再盖上填色），但肩膀那一圈里压在身子上的边不描：身子（连外套）外面一遍、肩膀圈外面一遍 */
function strokeOverBody(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, paths: Path2D[]) {
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const keep of [bodyPieces(rig).map(outside), [outside(shoulderZone(rig, side))]]) {
    ctx.save();
    for (const k of keep) ctx.clip(k, "evenodd");
    for (const p of paths) ctx.stroke(p);
    ctx.restore();
  }
}

/**
 * 肩膀那一圈里袖子压在身子上的那段不要右下的阴影月牙（用户 2026-10-18）：那里没有描线，月牙会变成一道像光照轮廓的深色边
 * （朝右时光的方向跟着镜像，月牙正好落在近侧手臂贴着身子的那条边上）
 */
function unshadeShoulder(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", upper: Path2D, base: string) {
  for (const b of bodyPieces(rig)) {
    ctx.save();
    ctx.clip(b);
    ctx.clip(shoulderZone(rig, side));
    ctx.fillStyle = base;
    ctx.fill(upper);
    ctx.restore();
  }
}

/** 穿外衣的正面（Look.armsOver）：上臂压在外衣上，肩膀那一圈和身子接成一块（同 3/4 的手臂）；前臂、手套之后另画（drawForearm） */
function drawUpperArmOver(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  const { upper } = armPaths(rig, side);
  const [base, shade] = sleeveColors(rig);
  strokeOverBody(ctx, rig, side, ink, [upper]);
  fillShaded(ctx, upper, base, shade, ink);
  unshadeShoulder(ctx, rig, side, upper, base);
  rig.look.onUpperArm?.(ctx, rig, side, upper, ink);
}

/**
 * 正面时上臂和身子重叠的地方显示身子的轮廓线、不显示上臂的（用户 2026-10-17）：上臂画在身子后面，
 * 前臂和手套照样画在前面（抱臂、捂嘴这些动作要压在身子、脸前面）。
 */
function drawUpperArm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  const { upper } = armPaths(rig, side);
  drawPart(ctx, upper, ...sleeveColors(rig), ink);
  rig.look.onUpperArm?.(ctx, rig, side, upper, ink);
}

/** 前臂 + 手套（正面，上臂已经画在身子后面）：前臂和露出来的上臂接的地方不描线；上臂藏在身子（连外套）后面的那段，前臂照常描 */
function drawForearm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, opts: DrawOptions) {
  const { limb, sx, upper, lower } = armPaths(rig, side);
  const ap = side === "L" ? rig.pose.armL : rig.pose.armR;
  fillForearm(ctx, rig, side, lower, ink);
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // 描两遍再并起来：上臂外面一遍，身子里面一遍（那里的上臂被身子挡着）
  ctx.save();
  const out = new Path2D();
  out.rect(-1e4, -1e4, 2e4, 2e4);
  out.addPath(upper);
  ctx.clip(out, "evenodd");
  ctx.stroke(lower);
  ctx.restore();
  // 上臂压在外衣上时（drawUpperArmOver）没有藏起来的那段
  if (!rig.look.armsOver?.(rig))
    for (const b of bodyPieces(rig)) {
      ctx.save();
      ctx.clip(b);
      ctx.stroke(lower);
      ctx.restore();
    }
  rig.look.onForearm?.(ctx, rig, side, ink);
  drawGlove(ctx, limb.tip, sx, ap.shape, ink, (c, layer) => opts.hold?.[side]?.(c, limb.tip, rig.mir, { layer, shape: ap.shape, sx }), rig.look.hands?.(rig) ?? null);
}

/**
 * 手：手指在手掌后面，拿着的东西画在手掌和大拇指之间。握拳时收起手指，指一下时只留一根。
 * 手掌和手指、大拇指接的地方不描线（同一块手套，和刘海一个道理），手指之间的线留着。
 * glove：手套的颜色和阴影；null 是光着手，同样的手形画成皮肤色（和脸一样细线、手指不加阴影）。
 */
function drawGlove(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  sx: number,
  shape: HandShape,
  ink: Ink,
  hold: (ctx: CanvasRenderingContext2D, layer: HoldInfo["layer"]) => void,
  glove: [string, string] | null = null,
) {
  const bare = !glove;
  const on = ([x, y]: V2) => f.p(x * sx, y);
  hold(ctx, "back");
  const fingers = (shape === "fist" || shape === "grip" ? [] : shape === "point" || shape === "pinky" ? [HAND.fingers[1]] : HAND.fingers).map(
    (fi) => cubicPath(fi, on),
  );
  const base = glove ? glove[0] : K.skin;
  const lw = ink.lw * (bare ? 0.6 : 0.8);
  for (const p of fingers) drawPart(ctx, p, base, glove ? glove[1] : null, ink, lw);
  // 手掌只填色（不加阴影：右下那道月牙正好落在手指根上，像一条线），描边时扣掉手指盖住的地方
  const palm = cubicPath(HAND.palm, on);
  fillShaded(ctx, palm, base, null, ink);
  ctx.save();
  for (const p of fingers) {
    const out = new Path2D();
    out.rect(-1e4, -1e4, 2e4, 2e4);
    out.addPath(p);
    ctx.clip(out, "evenodd");
  }
  ctx.strokeStyle = K.line;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(palm);
  ctx.restore();
  hold(ctx, "front");
  // 大拇指压在手掌上：只填色，描边扣掉手掌——和手掌接的地方也不描（用户 2026-10-17）
  const thumb = cubicPath(HAND.thumb, on);
  fillShaded(ctx, thumb, base, null, ink);
  ctx.save();
  const out = new Path2D();
  out.rect(-1e4, -1e4, 2e4, 2e4);
  out.addPath(palm);
  ctx.clip(out, "evenodd");
  // 重新设一遍描边：拿着的东西（砖顶的白色亮边）会改掉画笔，不设的话大拇指描成一圈浅色
  ctx.strokeStyle = K.line;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(thumb);
  ctx.restore();
}

// ——— 腿、光脚（鞋是角色的：Look.shoe / overLeg） ———
function drawFoot(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  const limb = rig.legs[side];
  // 线稿画的是画面左边那只，脚尖朝画面左边。正面时另一只镜像（两只脚尖往外分开）；
  // 转到 3/4 两只脚都朝她面向的那边（用户 2026-10-17），朝右时整个人镜像，两只脚就一起朝右
  const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
  const onFoot = ([x, y]: V2) => limb.tip.p(x * fx, y);
  // 线稿里脚是两块拼的：拼成一条路径一起填色、描两倍宽的边再盖上填色，中间那道斜线（连抗锯齿的细缝）都不出现；
  // 只另描脚趾缝的线
  const lw = ink.lw * 0.7;
  const foot = new Path2D();
  foot.addPath(cubicPath(FOOT.outer, onFoot));
  foot.addPath(cubicPath(FOOT.inner, onFoot));
  ctx.strokeStyle = K.line;
  ctx.lineWidth = lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(foot);
  ctx.fillStyle = K.skin;
  ctx.fill(foot);
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const l of FOOT.lines.slice(0, 3)) ctx.stroke(cubicPath(l, onFoot, false));
  // 大脚趾和二脚趾之间：只留大脚趾外侧那一小段（和别的脚趾缝一样长），往上那条长斜线不画
  ctx.stroke(cubicPath(FOOT.inner.slice(18, 22), onFoot, false));
}

/** 一条腿的两节（大腿、小腿）放到现在的姿势上 */
export function legPaths(rig: Rig, side: "L" | "R"): Path2D[] {
  const limb = rig.legs[side];
  const P = LEG_PIECES[side];
  const fT = new Frame(limb.root[0], limb.root[1], limb.a1);
  const fS = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  // 大腿朝镜头时顺着骨头压短（膝盖那个半圆也跟着压扁，膝盖的圆由小腿那头的半圆撑着）
  const k = limb.k ?? 1;
  return [polyPath(P.upper, (p) => fT.p(p[0], p[1] * k)), polyPath(P.lower, (p) => fS.p(p[0], p[1]))];
}

/**
 * 胯（裤袜的裆）：线稿里没画，两条腿一分开（正面半蹲）大腿根之间就会露出白的。上沿藏在毛衣下摆里，
 * 下沿是一道圆的裆；站着时被大腿盖住，和腿合并描边。
 */
function pelvisPath(rig: Rig): Path2D {
  const pts: P[] = [
    [-40, -12],
    [-37, 6],
    [-14, 19],
    [0, 21],
    [14, 19],
    [37, 6],
    [40, -12],
    [0, -16],
  ];
  // 和腿的几块统一绕向，拼成一个形状填色时重叠处才不会变成洞
  return smoothPath(clockwise(pts.map(([x, y]) => rig.pelvis.p(x * Math.cos(rig.th) + rig.hipShift, y))) as P[]);
}

/**
 * 腿：脚先画，裤腿的下沿压在脚踝上。正面时两条腿一起合并描边——同一条裤袜，大腿根挨在一起的地方不描线，
 * 到裆下才分开（和参考图一样）；转到 3/4 两条腿前后叠着，要各描各的。
 */
function drawLegs(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const boot = (side: "L" | "R") => (rig.look.shoe?.(rig, side) ?? false) && (side === "L" ? rig.pose.legL : rig.pose.legR).boot;
  for (const side of ["R", "L"] as const) if (!boot(side)) drawFoot(ctx, rig, side, ink);
  const pelvis = pelvisPath(rig);
  if (rig.u >= 0.25) {
    drawPart(ctx, pelvis, K.bottom, null, ink);
    for (const side of ["R", "L"] as const) {
      drawMerged(ctx, legPaths(rig, side), K.bottom, K.bottomShade, ink);
      rig.look.overLeg?.(ctx, rig, side, ink);
    }
    return;
  }
  const [thR, shR] = legPaths(rig, "R");
  const [thL, shL] = legPaths(rig, "L");
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of [pelvis, thR, shR, thL, shL]) ctx.stroke(p);
  // 两条大腿和裆拼成一个形状加阴影：右下那道月牙只出现在外轮廓上，不会沿着里侧在裆上面拉出一道
  const thighs = new Path2D();
  thighs.addPath(pelvis);
  thighs.addPath(thR);
  thighs.addPath(thL);
  fillShaded(ctx, thighs, K.bottom, K.bottomShade, ink);
  fillShaded(ctx, shR, K.bottom, K.bottomShade, ink);
  fillShaded(ctx, shL, K.bottom, K.bottomShade, ink);
  for (const side of ["R", "L"] as const) rig.look.overLeg?.(ctx, rig, side, ink);
}

// ——— 身子、脖子 ———
/** 身子、脖子放到现在的姿势上（转身时从正面线稿过渡到侧面线稿；呼吸时胸口以上起伏） */
export function torsoPaths(rig: Rig): { neck: Path2D; torso: Path2D } {
  const { chest, u, pose, thh, headMir } = rig;
  const br = pose.breath * 1.6;
  const on = ([x, y]: V2): V2 => chest.p(x, y - br * clamp01(-y / 140));
  // 脖子：下半截跟着身体转，上半截跟着头转（以脖子那一点为准），中间平滑过渡
  const nx = 10 * Math.sin(-0.7 * u);
  const body = lerpPts(...NECK_TURN, u);
  const head = lerpPts(...(headMir ? NECK_HEAD_TURN.mirror : NECK_HEAD_TURN.same), -thh / 0.62);
  // 再往下多画一截（藏在身子后面）：领口往下弯露出来的那块还是脖子，下沿的阴影也藏在身子后面
  const neck = body.map(([x, y], i): V2 => {
    const [hx, hy] = head[i];
    const w = smooth01(-162, -172, y);
    const ny = lerp(y, hy, w);
    return [lerp(x, hx + nx, w), ny > -164 ? ny + 12 : ny];
  });
  return { neck: polylinePath(neck, on), torso: polylinePath(lerpPts(...TORSO_TURN, u), on) };
}

/** sides：正面时画在身子后面的上臂。身子的边在这些上臂的肩膀圈里不描（袖子和身子在肩膀是一块），腋下往下照常描 */
function drawTorso(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, sides: ("L" | "R")[] = []) {
  const { neck, torso } = torsoPaths(rig);
  drawPart(ctx, neck, K.skin, K.skinShade, ink, ink.lw * 0.6);
  if (rig.look.collar === false) {
    drawTorsoBody(ctx, rig, ink, torso, sides);
    return;
  }
  const collar = collarOf(rig);
  // 领口往下弯的那块挖掉，后面的脖子露出来
  ctx.save();
  ctx.clip(outside(collar.opening), "evenodd");
  drawTorsoBody(ctx, rig, ink, torso, sides);
  ctx.restore();
  drawCollar(ctx, ink, collar);
}

function drawTorsoBody(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, torso: Path2D, sides: ("L" | "R")[]) {
  fillBodyPart(ctx, rig, torso, K.top, K.topShade, ink, sides);
  strokeBodyPart(ctx, rig, torso, ink, sides);
}

/** 身子上的一块（上衣身子、外衣前襟）填色：肩膀那一圈里不要右下的阴影月牙（用户 2026-10-18）：没有描线的地方剩一道月牙，像光照轮廓 */
export function fillBodyPart(ctx: CanvasRenderingContext2D, rig: Rig, path: Path2D, base: string, shade: string, ink: Ink, sides: ("L" | "R")[]) {
  fillShaded(ctx, path, base, shade, ink);
  for (const side of sides) {
    ctx.save();
    ctx.clip(path);
    ctx.clip(shoulderZone(rig, side));
    ctx.fillStyle = base;
    ctx.fill(path);
    ctx.restore();
  }
}

/** 身子上的一块描边：sides 的上臂在肩膀圈里压着的边不描（袖子和身子在肩膀是一块） */
export function strokeBodyPart(ctx: CanvasRenderingContext2D, rig: Rig, path: Path2D, ink: Ink, sides: ("L" | "R")[]) {
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // 不描的地方 = 每只手臂的（上臂 ∩ 肩膀圈）；它的补集 = 每只手臂各取「上臂外」或「肩膀圈外」，几只手臂的组合都描一遍
  const keeps = sides.map((side) => [outside(armPaths(rig, side).upper), outside(shoulderZone(rig, side))]);
  const combos = keeps.reduce<Path2D[][]>((acc, k) => acc.flatMap((c) => k.map((p) => [...c, p])), [[]]);
  for (const combo of combos) {
    ctx.save();
    for (const p of combo) ctx.clip(p, "evenodd");
    ctx.stroke(path);
    ctx.restore();
  }
}

/** 闭合折线在竖线 x 处最上面的 y（没有交点时返回 null） */
function colTop(poly: V2[], x: number): number | null {
  let top: number | null = null;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    if ((x0 <= x && x1 > x) || (x1 <= x && x0 > x)) {
      const y = y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      top = top === null ? y : Math.min(top, y);
    }
  }
  return top;
}

/**
 * 圆领（照三视图，用户 2026-10-18）：领口前面往下弯成一道 U，露出一点脖子根；下面一圈罗纹领的下沿是一道浅色细线，
 * 往两边接到肩膀。领子是圆的，转身时不压窄，宽度和位置跟着脖子根那一行走。戴着围巾时被围脖挡住。
 * opening：身子上要挖掉的那块（U 往上到身子上沿外面）；front：领口那道 U；seam：罗纹领的下沿。
 */
function collarOf(rig: Rig) {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const on = ([x, y]: V2): V2 => chest.p(x, y - br * clamp01(-y / 140));
  const neck = lerpPts(...NECK_TURN, u);
  const torso = lerpPts(...TORSO_TURN, u);
  const [l, r] = rowSpan(neck, -163) ?? [-11.2, 11.2];
  const cx = (l + r) / 2;
  const rx = (r - l) / 2;
  const top = (x: number) => colTop(torso, x) ?? -161;
  /** 从身子上沿往下弯的一道 U：半宽 w，正中往下 d */
  const arc = (w: number, d: number): V2[] =>
    Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      const x = cx + (t * 2 - 1) * w;
      return [x, top(x) + d * (1 - (2 * t - 1) ** 2)];
    });
  const open = (pts: V2[]) => {
    const p = new Path2D();
    pts.map(on).forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    return p;
  };
  const front = arc(rx, 6.5);
  return {
    opening: polylinePath([...front, [cx + rx, top(cx + rx) - 20], [cx - rx, top(cx - rx) - 20]], on),
    front: open(front),
    seam: open(arc(rx + 9, 11.5)),
  };
}

function drawCollar(ctx: CanvasRenderingContext2D, ink: Ink, collar: ReturnType<typeof collarOf>) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = K.topSeam;
  ctx.lineWidth = ink.lw * 0.55;
  ctx.stroke(collar.seam);
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw;
  ctx.stroke(collar.front);
}


/** 身子在画面里占的几块（上衣身子，加上角色外衣的前襟）：压在身子上的手臂按它们裁描边、阴影 */
export function bodyPieces(rig: Rig): Path2D[] {
  return [torsoPaths(rig).torso, ...(rig.look.bodyPieces?.(rig) ?? [])];
}
// ——— 头 ———
/**
 * 脸的轮廓（右半边，头的坐标，从头顶到下巴）：用户亲手画的脸形（2026-10-17，SVG），左右取平均变对称，
 * 按最宽处半宽 41、下巴在 48 等比缩放。上面最宽，往下收到左右下颌角，再收成一个圆圆的下巴；头顶那一段藏在刘海下面。
 */
const FACE_CURVE: V2[] = [
  [0, -52.75],
  [57.81, -52.75],
  [40.81, 18.53],
  [30.16, 32.98],
  [19.52, 47.43],
  [1.92, 48],
  [0, 48],
];
const FACE_HALF: V2[] = (() => {
  const c = FACE_CURVE;
  const bez = (p0: V2, p1: V2, p2: V2, p3: V2, t: number): V2 => {
    const a = 1 - t;
    return [
      a * a * a * p0[0] + 3 * a * a * t * p1[0] + 3 * a * t * t * p2[0] + t * t * t * p3[0],
      a * a * a * p0[1] + 3 * a * a * t * p1[1] + 3 * a * t * t * p2[1] + t * t * t * p3[1],
    ];
  };
  const out: V2[] = [];
  for (let i = 0; i < 20; i++) out.push(bez(c[0], c[1], c[2], c[3], i / 20));
  for (let i = 0; i < 10; i++) out.push(bez(c[3], c[4], c[5], c[6], i / 10));
  out.push(c[6]);
  return out;
})();

/** 脸在 y 处的半宽（右半边从上到下 y 一直增加，直接插值） */
export function faceHW(y: number): number {
  const h = FACE_HALF;
  if (y <= h[0][1]) return h[0][0];
  for (let i = 1; i < h.length; i++) {
    if (y <= h[i][1]) {
      const k = (y - h[i - 1][1]) / (h[i][1] - h[i - 1][1] || 1);
      return lerp(h[i - 1][0], h[i][0], k);
    }
  }
  return 0;
}

// ——— 转身：脸、五官从正面线稿过渡到侧面线稿（figure-side.ts） ———
/** 正面的脸：FACE_CURVE 是右半边（头顶到下巴），左半边镜像 */
const FRONT_FACE: V2[] = (() => {
  const half = bezierPolyline(FACE_CURVE, 32, false);
  return [...half, ...half.slice(1, -1).reverse().map(([x, y]): V2 => [-x, y])];
})();
/** 脸：头顶、最右、下巴、最左四个标志点之间逐点对应 */
export const FACE_TURN: [V2[], V2[]] = (() => {
  const a = clockwisePoly(FRONT_FACE);
  const b = clockwisePoly(bezierPolyline(SIDE_FACE));
  const marks = (p: V2[]) => {
    const by = (f: (q: V2) => number) => p.reduce((bi, q, i) => (f(q) > f(p[bi]) ? i : bi), 0);
    return [by((q) => -q[1]), by((q) => q[0]), by((q) => q[1]), by((q) => -q[0])];
  };
  return matchOutlines(a, marks(a), b, marks(b), 32);
})();

/** 眼睛的位置和大小：正面在线稿的位置，3/4 按侧面线稿的眼珠放、横竖按眼珠的大小缩（s：-1 画面左，1 画面右） */
export function eyeAt(s: number, uh: number) {
  const side = s < 0 ? SIDE_IRIS.R : SIDE_IRIS.L;
  return {
    x: lerp(s * EYE_X, side.c[0], uh),
    y: lerp(EYE_Y, side.c[1], uh),
    sx: lerp(1, side.rx / IRIS_RX, uh),
    sy: lerp(1, side.ry / IRIS_RY, uh),
  };
}
/** 鼻子：起点、控制点、终点 */
const NOSE_FRONT: V2[] = [[0.3, 19.1], [0.5, 20.9], [0, 22]];
const NOSE_SIDE: V2[] = [SIDE_NOSE[0], lerpV(SIDE_NOSE[0], SIDE_NOSE[3], 0.5), SIDE_NOSE[3]];
/** 嘴：正面线稿的嘴半宽 7.32；侧面按线稿的两个嘴角放（中点、半宽、斜度） */
const MOUTH_SIDE = (() => {
  const a = SIDE_MOUTH[0];
  const b = SIDE_MOUTH[SIDE_MOUTH.length - 1];
  return { c: lerpV(a, b, 0.5), wk: len(sub(b, a)) / 2 / 7.32, tilt: Math.atan2(b[1] - a[1], b[0] - a[0]) };
})();

/** 脸现在的轮廓（转身时从正面线稿过渡到侧面线稿） */
export function faceOf(rig: Rig): V2[] {
  return lerpPts(...FACE_TURN, -rig.thh / 0.62);
}
/** reflect：头镜像着画时（headMir），在没有镜像的画布上要用镜像过的脸 */
export function facePathOf(rig: Rig, reflect = false): Path2D {
  return polylinePath(faceOf(rig), ([x, y]) => rig.head.p(reflect ? -x : x, y));
}

function drawHead(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const { head, thh, pose, field } = rig;
  const e = pose.expr;
  const uh = -thh / 0.62;
  const H = (x: number, y: number): V2 => head.p(x, y);
  const ang = head.a;
  const thin = ink.lw * 0.6;

  // 脸：正面线稿 → 侧面线稿
  const face = faceOf(rig);
  const facePath = facePathOf(rig);
  // 贴着脸边的东西（耳朵、两边的头发）跟着脸的左右边走：每一行按正面脸的左右边 → 现在脸的左右边横向映射
  const [fy0, fy1] = [Math.min(...face.map((p) => p[1])) + 1, Math.max(...face.map((p) => p[1])) - 1];
  const place = ([x, y]: V2): V2 => {
    if (uh <= 0) return H(x, y);
    const yy = Math.max(fy0, Math.min(fy1, y));
    const from = rowSpan(FACE_TURN[0], yy);
    const to = rowSpan(face, yy);
    if (!from || !to) return H(x, y);
    return H(to[0] + ((x - from[0]) / (from[1] - from[0])) * (to[1] - to[0]), y);
  };

  /** 皮肤（脸、耳朵）：头发的边只在压着它们的地方描线 */
  const skins: Path2D[] = [];
  // 耳朵（画在脸后面，脸和两边的头发压住耳根）。转身时转到后面的那只缩回脸后面
  for (const [s, ear] of [[-1, EAR_L], [1, EAR_R]] as [number, V2[]][]) {
    const z = Math.cos((s * Math.PI) / 2 + thh);
    const k = clamp01(1 + z * 3.5);
    if (k < 0.12) continue;
    const map = ([x, y]: V2): V2 => {
      const edge = s * faceHW(y);
      return place([edge + (x - edge) * k, y]);
    };
    const earPath = cubicPath(ear, map);
    drawPart(ctx, earPath, K.skin, null, ink, thin);
    skins.push(earPath);
  }

  // 细线、不加阴影：下巴那道月牙阴影连着描边像一条粗线
  drawPart(ctx, facePath, K.skin, null, ink, thin);
  skins.push(facePath);

  const eyes = [-1, 1].map((s) => ({ s, ...eyeAt(s, uh) }));

  // 腮红：眼睛下面一团淡淡的晕染，裁在脸里面
  ctx.save();
  ctx.clip(facePath);
  for (const { s, x, y, sx } of eyes) {
    const c = H(x + s * 4 * sx, y + 23 - EYE_Y);
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(ang);
    ctx.scale(10.5 * sx, 6.2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${K.blush},${0.3 + 0.35 * e.blush})`);
    g.addColorStop(1, `rgba(${K.blush},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 眼睛、眼泪
  for (const { s, x, y, sx, sy } of eyes) drawEye(ctx, head, x, y, sx, sy, s, e, ink);
  if (e.tears > 0.01) for (const { s, x, y } of eyes) drawTears(ctx, head, x, y, s, e.tears, field, pose.t, ink);
  // 鼻子：一小笔
  {
    const [n0, n1, n2] = lerpPts(NOSE_FRONT, NOSE_SIDE, uh);
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(ang);
    ctx.strokeStyle = K.nose;
    ctx.lineWidth = ink.lw * 0.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(n0[0], n0[1]);
    ctx.quadraticCurveTo(n1[0], n1[1], n2[0], n2[1]);
    ctx.stroke();
    ctx.restore();
  }
  // 嘴
  {
    const c = lerpV([0, 32], MOUTH_SIDE.c, uh);
    drawMouth(ctx, head, c[0], c[1], lerp(1, MOUTH_SIDE.wk, uh), lerp(0, MOUTH_SIDE.tilt, uh), e, ink, pose.t);
  }

  // 刘海、鬓发（角色的）：只描压在脸和耳朵上的边
  const strokeOnSkin = (path: Path2D, under: Path2D[], lw = ink.lw * 0.8) => {
    for (const skin of skins) {
      ctx.save();
      ctx.clip(skin);
      // 再扣掉别的头发盖住的地方
      const out = new Path2D();
      out.rect(-1e4, -1e4, 2e4, 2e4);
      for (const q of under) out.addPath(q);
      ctx.clip(out, "evenodd");
      ctx.strokeStyle = K.line;
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
      ctx.restore();
    }
  };
  const view: HeadView = { rig, H, uh, place, skins, strokeOnSkin };
  rig.look.frontHair?.(ctx, view, ink);

  // 眉毛：透过刘海画在头发上，跟着眼睛走
  for (const [s, brow] of [[-1, BROW_L], [1, BROW_R]] as [number, V2[]][]) {
    const eye = eyes[s < 0 ? 0 : 1];
    drawBrow(ctx, head, brow, eye.x, eye.y, eye.sx, eye.sy, s, e, ink);
  }
  rig.look.face?.(ctx, view, ink);
}

/**
 * 眼睛（用户线稿）：竖着的深色大眼珠，只在外侧有一道月牙眼白；上眼线从内上角沿着眼睛上沿、绕过外侧，到外侧中下。
 * 局部坐标以眼珠中心为原点，u 朝外眼角为正。sx、sy 是转身时横向、纵向缩放的比例（侧面线稿的眼珠大小）。
 * 眨眼 = 上眼皮落下来（闭成眼睛中下部的一道弧）；笑 = 下眼皮推上来，到 1 弯成 ∩；难过外眼角压下、使劲内眼角压下。
 */
function drawEye(ctx: CanvasRenderingContext2D, head: Frame, ex: number, ey: number, sx: number, sy: number, s: number, e: Expr, ink: Ink) {
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(head.a);
  ctx.translate(ex, ey);
  ctx.scale(1, sy);
  ctx.translate(-ex, -ey);
  const ry = IRIS_RY * (1 + e.wide * 0.1);
  const out = EYE_OUT * (1 + e.wide * 0.08);
  const sq = (u: number, a: number) => Math.sqrt(Math.max(0, 1 - (u / a) ** 2));
  // 睁开时的上下沿：内侧就是眼珠的边，外侧是月牙
  const topO = (u: number) => (u <= 0 ? -ry * sq(u, IRIS_RX) : -0.3 - (ry - 0.3) * sq(u, out));
  const botO = (u: number) => (u <= 0 ? ry * sq(u, IRIS_RX) : -0.3 + (ry + 0.3) * sq(u, out));
  const prof = (u: number) => (botO(u) - topO(u)) / (2 * ry);
  const uc = (out - IRIS_RX) / 2;
  const hw = (out + IRIS_RX) / 2;
  const outer = (u: number) => (u - uc) / hw;
  const bottom = (u: number) => {
    const b0 = botO(u) - (e.happy * 0.78 + e.squint * 0.32) * (botO(u) - topO(u));
    // 闭眼时闭在眼睛中下部，不是落到最底下
    return b0 + (Math.min(b0, 3.2 * prof(u)) - b0) * e.blink;
  };
  const lid = (u: number) => {
    const t0 = topO(u);
    return (
      t0 +
      e.happy * 0.5 * (botO(u) - t0) +
      e.squint * 0.1 * (botO(u) - t0) +
      e.sad * 6.5 * Math.max(0, outer(u) + 0.15) +
      e.fierce * 7 * Math.max(0, -outer(u) + 0.15)
    );
  };
  const top = (u: number) => {
    const y = lid(u);
    const lo = bottom(u);
    return Math.min(lo, y + (lo - y) * e.blink);
  };
  const X = (u: number) => ex + s * u * sx;
  const N = 20;
  const us = Array.from({ length: N + 1 }, (_, i) => -IRIS_RX + ((out + IRIS_RX) * i) / N);
  const open = Math.max(...us.map((u) => bottom(u) - top(u)));
  if (open > 0.6) {
    const region = new Path2D();
    region.moveTo(X(us[0]), ey + top(us[0]));
    for (const u of us.slice(1)) region.lineTo(X(u), ey + top(u));
    for (const u of [...us].reverse()) region.lineTo(X(u), ey + bottom(u));
    region.closePath();
    ctx.save();
    ctx.clip(region);
    ctx.fillStyle = K.sclera;
    ctx.fill(region);
    // 眼珠：转身时两只都朝那边看
    const rx = IRIS_RX * sx * (1 - e.wide * 0.15);
    const iry = IRIS_RY * (1 - e.wide * 0.12);
    const ix = ex + e.look[0] * 2.4 * sx;
    const iy = ey + e.look[1] * 2.5;
    const g = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
    g.addColorStop(0, K.pupil);
    g.addColorStop(0.5, K.iris);
    g.addColorStop(1, K.irisLight);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(ix, iy, rx, iry, 0, 0, Math.PI * 2);
    ctx.fill();
    // 左上一个大高光
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(ix - rx * 0.3, iy - iry * 0.42, rx * 0.27, iry * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // 上眼皮投下的一道影子
    ctx.fillStyle = "rgba(40,40,50,0.14)";
    ctx.beginPath();
    ctx.moveTo(X(us[0]), ey + top(us[0]));
    for (const u of us.slice(1)) ctx.lineTo(X(u), ey + top(u));
    for (const u of [...us].reverse()) ctx.lineTo(X(u), ey + top(u) + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 外侧月牙下半圈的细线
    ctx.strokeStyle = K.liner;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = ink.lw * 0.32;
    ctx.lineCap = "round";
    ctx.beginPath();
    const lu = us.filter((u) => u >= 0.5);
    lu.forEach((u, i) => (i ? ctx.lineTo(X(u), ey + bottom(u)) : ctx.moveTo(X(u), ey + bottom(u))));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 上眼线：从内上角（u=-6.2）沿上沿到外眼角，再绕下来到外侧中下；比眼睛的边往外让 0.9
  const LINER_IN = -6.2;
  const LINER_END = 9.5;
  const pts: V2[] = [];
  for (let i = 0; i <= 16; i++) {
    const k = 0.5 - 0.5 * Math.cos((Math.PI * i) / 16);
    const u = LINER_IN + (out - LINER_IN) * k;
    pts.push([u, top(u)]);
  }
  for (let i = 1; i <= 4; i++) {
    const u = out - ((out - LINER_END) * i) / 4;
    pts.push([u, bottom(u)]);
  }
  const liner: V2[] = pts.map(([u, y]) => {
    const dx = (u - uc) * sx;
    const dy = y + 0.3;
    const l = Math.hypot(dx, dy) || 1;
    return [X(u) + ((s * dx) / l) * 0.9, ey + y + (dy / l) * 0.9];
  });
  const widths = liner.map((_, i) => {
    const t = i / (liner.length - 1);
    return 0.55 + 0.95 * (t < 0.65 ? t / 0.65 : 1 - (0.55 * (t - 0.65)) / 0.35);
  });
  drawLiner(ctx, liner, widths);
  ctx.restore();
}

function drawLiner(ctx: CanvasRenderingContext2D, pts: V2[], w: number[]) {
  const ribbon = ribbonPts(pts, w, 0.5);
  ctx.fillStyle = K.liner;
  ctx.fill(smoothPath(ribbon));
}

/** 眉毛（线稿的形状，透过刘海画在头发上）：难过时内端抬起，使劲时内端压下，惊讶时整条抬起。(ex, ey) 是这只眼睛现在的位置，跟着眼睛缩放。 */
function drawBrow(ctx: CanvasRenderingContext2D, head: Frame, brow: V2[], ex: number, ey: number, sx: number, sy: number, s: number, e: Expr, ink: Ink) {
  const lift = -4 * e.wide - 1 * e.happy + 0.6 * e.blink;
  const map = ([x, y]: V2): V2 => {
    // 0 内端 → 1 外端
    const t = clamp01((Math.abs(x) - 18.5) / 18.2);
    const dy = lift + e.sad * (-5.5 * (1 - t) + 2.2 * t) + e.fierce * (5 * (1 - t) - 1.6 * t);
    return head.p(ex + (x - s * EYE_X) * sx, ey + (y + dy - EYE_Y) * sy);
  };
  ctx.strokeStyle = K.brow;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.lineCap = "round";
  ctx.stroke(cubicPath(brow, map, false));
}

/**
 * 嘴：一道细弧，中间粗、两头细；张嘴时是一个小口。wk 横向缩放，tilt 斜度（转身时侧面线稿的嘴）。
 * round 收成小圆嘴（惊讶、「哦」），teeth 露出咬紧的牙（使劲），wobble 忍着哭时嘴抖成波浪（按时间 t 抖）。
 */
function drawMouth(ctx: CanvasRenderingContext2D, head: Frame, mx: number, my: number, wk: number, tilt: number, e: Expr, ink: Ink, t = 0) {
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(head.a);
  ctx.translate(mx, my);
  ctx.rotate(tilt);
  ctx.translate(-mx, -my);
  const s = e.smile - e.sad * 0.6;
  const o = e.open;
  const r = e.round;
  const w = (6.8 + 1.6 * Math.abs(s) + o * 1.6) * wk * (1 - 0.5 * r) * (1 + 0.45 * e.teeth);
  // 抖：沿着嘴一道小波浪，左右两个嘴角一上一下
  const wob = (k: number) => e.wobble * 1.3 * Math.sin(k * Math.PI * 3 + t * 13) * Math.sin(Math.PI * k);
  const jit = e.wobble * 0.9 * Math.sin(t * 17);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (o < 0.08 && e.teeth < 0.05) {
    const pts: V2[] = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      const a = 1 - k;
      const y = (a * a + k * k) * (my - s * 2.4) + 2 * a * k * (my + s * 5.4) + wob(k) + (k - 0.5) * 2 * jit;
      pts.push([mx - w + 2 * w * k, y]);
    }
    const widths = pts.map((_, i) => 0.35 + 0.5 * Math.sin((Math.PI * i) / 12));
    ctx.fillStyle = K.mouthLine;
    ctx.fill(smoothPath(ribbonPts(pts, widths, 0.5)));
  } else {
    const oo = Math.max(o, e.teeth * 0.3);
    const yl = my - s * 1.4 + jit;
    const yr = my - s * 1.4 - jit;
    const shape = new Path2D();
    shape.moveTo(mx - w, yl);
    shape.quadraticCurveTo(mx, my + s * 2.2 - r * oo * 7 + wob(0.5), mx + w, yr);
    shape.quadraticCurveTo(mx, my + 2 + oo * 13 + s * 3 + r * oo * 3, mx - w, yl);
    shape.closePath();
    ctx.fillStyle = K.mouth;
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    if (e.teeth < 0.5) {
      ctx.fillStyle = K.tongue;
      ctx.beginPath();
      ctx.ellipse(mx, my + 3 + oo * 9, w * 0.62, 3 + oo * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.teeth > 0.01) {
      // 上下两排牙：咬紧时几乎填满，中间一道缝
      const top = Math.min(yl, yr) - 8;
      const gap = my + (1 + oo * 6.5) * (0.6 + 0.4 * Math.min(1, s + 0.6));
      ctx.globalAlpha = Math.min(1, e.teeth * 1.5);
      ctx.fillStyle = K.teeth;
      ctx.fillRect(mx - w - 1, top, 2 * w + 2, gap - top - 0.6 + (1 - e.teeth) * -3);
      ctx.fillRect(mx - w - 1, gap + 0.6 + (1 - e.teeth) * 4, 2 * w + 2, 30);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = K.mouthLine;
    ctx.lineWidth = ink.lw * 0.5;
    ctx.stroke(shape);
  }
  ctx.restore();
}

function drawTears(ctx: CanvasRenderingContext2D, head: Frame, ex: number, ey: number, s: number, amt: number, field: V2, t: number, ink: Ink) {
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(head.a);
  // 眼眶里一汪水
  ctx.fillStyle = `rgba(207,238,250,${0.75 * Math.min(1, amt * 2)})`;
  ctx.beginPath();
  ctx.ellipse(ex, ey + 9, 9, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // 往下（或飘着时往上）走的泪
  const f = rotateV(field, -head.a);
  const fl = len(f) || 1;
  const d: V2 = [f[0] / fl, f[1] / fl];
  const start: V2 = d[1] >= 0 ? [ex + s * 6, ey + 10] : [ex + s * 10, ey - 3];
  const L = 13 * Math.min(1, amt * 1.4);
  ctx.strokeStyle = `rgba(150,205,235,0.85)`;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.quadraticCurveTo(start[0] + d[0] * L * 0.5 + s * 3, start[1] + d[1] * L * 0.5, start[0] + d[0] * L + s * 2, start[1] + d[1] * L);
  ctx.stroke();
  // 一颗泪珠，循环落下
  if (amt > 0.4) {
    const k = (t * 0.9 + (s > 0 ? 0.45 : 0)) % 1;
    const p: V2 = [start[0] + d[0] * (L + k * 22) + s * 2, start[1] + d[1] * (L + k * 22)];
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = K.tear;
    ctx.strokeStyle = "rgba(120,170,210,0.9)";
    ctx.lineWidth = ink.lw * 0.45;
    ctx.beginPath();
    ctx.ellipse(p[0], p[1], 3, 4, angleOf(d), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function rotateV(v: V2, a: number): V2 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}


/** 表情（每个角色都能用；参数里的 expression 选一种，再细调） */
export const EXPRESSIONS: Record<string, Partial<Expr>> = {
  平常: {},
  微笑: { smile: 1, squint: 0.5, blush: 0.5 },
  笑: { happy: 1, smile: 1, open: 0.35, blush: 0.7 },
  哭着笑: { happy: 0.7, sad: 0.4, smile: 0.9, open: 0.22, tears: 1, blush: 0.85 },
  含泪: { sad: 0.5, smile: 0.5, squint: 0.15, tears: 0.45, blush: 0.6 },
  忍着哭: { sad: 0.9, smile: -0.45, wobble: 1, tears: 0.55, blush: 0.6, look: [0, 0.3] },
  难过: { sad: 1, smile: -0.7, blink: 0.2, look: [0, 0.6] },
  担心: { sad: 0.75, wide: 0.25, smile: -0.3, look: [-0.35, 0.1] },
  心疼: { sad: 0.8, squint: 0.25, smile: 0.65, blush: 0.55, look: [0, 0.7] },
  惊: { wide: 1, open: 0.5, round: 0.8, smile: -0.1 },
  吓一跳: { wide: 1, sad: 0.3, open: 0.75, round: 0.3, smile: -0.4 },
  使劲: { fierce: 1, squint: 0.6, smile: -0.2, teeth: 1, open: 0.1 },
  坚定: { fierce: 0.7, squint: 0.2, smile: -0.15 },
  犹豫: { sad: 0.5, squint: 0.2, smile: -0.2, wobble: 0.2, look: [0.85, 0.5] },
  闭眼: { blink: 1, smile: 0.25 },
  哼歌: { blink: 1, happy: 0.4, smile: 0.5, open: 0.22, round: 0.5, blush: 0.6 },
  释然: { happy: 1, smile: 0.75, blush: 0.6 },
  仰望: { wide: 0.3, smile: 0, look: [0, -1] },
  低头看: { blink: 0.3, smile: 0.1, look: [0, 1] },
  嘘: { wide: 0.35, smile: 0, round: 1, open: 0.12, look: [-0.4, 0] },
};

// ——— 按关节角度摆姿势的参数（资源面板里调的就是它；角色在上面加自己的物品开关） ———
/**
 * 基础模型的参数。姿势按关节给角度（度）：0 = 垂下 / 伸直，正 = 顺时针（往画面左摆，朝左时就是往前）；
 * 除了肩和胯，每个关节都相对上一节骨头。L 是正面时画面右边、3/4 时靠近镜头的那只手臂 / 腿，R 是另一只。
 */
export const figureOptions = z.object({
  face: z.number().min(-1).max(1).default(0).describe("朝向：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身；朝右是整套镜像）"),
  headTurn: z.number().min(-1).max(1).default(0).describe("头比身体多转多少（正 = 更朝向侧面）"),

  expression: z
    .enum(["平常", "微笑", "笑", "哭着笑", "含泪", "忍着哭", "难过", "担心", "心疼", "惊", "吓一跳", "使劲", "坚定", "犹豫", "闭眼", "哼歌", "释然", "仰望", "低头看", "嘘"])
    .default("平常")
    .describe("表情；下面几项可以在它上面再调"),
  blink: z.number().min(0).max(1).optional().describe("闭眼（0..1，不写用表情里的值）"),
  happy: z.number().min(0).max(1).optional().describe("笑眼：下眼皮推上来，1 弯成 ∩（0..1，不写用表情里的值）"),
  sad: z.number().min(0).max(1).optional().describe("难过：外眼角压下、眉毛内端抬起（0..1，不写用表情里的值）"),
  fierce: z.number().min(0).max(1).optional().describe("使劲：内眼角压下、眉毛内端压下（0..1，不写用表情里的值）"),
  wide: z.number().min(0).max(1).optional().describe("睁大眼（0..1，不写用表情里的值）"),
  smile: z.number().min(-1).max(1).optional().describe("嘴角：1 笑，-1 撇（不写用表情里的值）"),
  open: z.number().min(0).max(1).optional().describe("张嘴（0..1，不写用表情里的值）"),
  lookX: z.number().min(-1).max(1).optional().describe("眼珠往左（−）右（+）看"),
  lookY: z.number().min(-1).max(1).optional().describe("眼珠往上（−）下（+）看"),
  blush: z.number().min(0).max(1).optional().describe("腮红（0..1，不写用表情里的值）"),
  tears: z.number().min(0).max(1).optional().describe("眼泪（0..1，不写用表情里的值）"),
  squint: z.number().min(0).max(1).optional().describe("眯眼：下眼皮推上来一点（0..1，不写用表情里的值）"),
  round: z.number().min(0).max(1).optional().describe("小圆嘴：惊讶、「哦」（0..1，不写用表情里的值）"),
  teeth: z.number().min(0).max(1).optional().describe("咬紧牙（0..1，不写用表情里的值）"),
  wobble: z.number().min(0).max(1).optional().describe("嘴发抖：忍着哭（0..1，不写用表情里的值）"),

  neck: z.number().min(-60).max(60).default(0).describe("脖子：正 = 仰头（朝左时；正面时是往画面右歪头）"),
  lean: z.number().min(-60).max(100).default(0).describe("腰：正 = 往前弯（正面时是往画面左歪）"),
  rot: z.number().min(-180).max(180).default(0).describe("整个人绕胯转（躺下、倒过来）"),

  shoulderL: z.number().min(-180).max(180).default(-15).describe("L 肩：0 垂下；正面时往外张是负"),
  elbowL: z.number().min(-170).max(170).default(-1).describe("L 肘（相对上臂）"),
  wristL: z.number().min(-120).max(120).default(15).describe("L 手腕（相对前臂）"),
  handL: z.enum(["relax", "open", "fist", "grip", "point", "pinky", "flat"]).default("relax").describe("L 手形：relax 放松、open 张开、fist 握拳、grip 抓住东西、point 伸一根手指、pinky 拉钩、flat 平托"),
  layerL: z.enum(["auto", "front", "back"]).default("auto").describe("L 手臂画在身体前面还是后面（auto：3/4 时远侧的在后）"),
  shoulderR: z.number().min(-180).max(180).default(15).describe("R 肩：0 垂下；正面时往外张是正"),
  elbowR: z.number().min(-170).max(170).default(1).describe("R 肘（相对上臂）"),
  wristR: z.number().min(-120).max(120).default(-15).describe("R 手腕（相对前臂）"),
  handR: z.enum(["relax", "open", "fist", "grip", "point", "pinky", "flat"]).default("relax").describe("R 手形：relax 放松、open 张开、fist 握拳、grip 抓住东西、point 伸一根手指、pinky 拉钩、flat 平托"),
  layerR: z.enum(["auto", "front", "back"]).default("auto").describe("R 手臂画在身体前面还是后面"),

  hipL: z.number().min(-150).max(150).default(-6).describe("L 胯：0 腿竖直；往前抬是正"),
  kneeL: z.number().min(-170).max(170).default(-1).describe("L 膝（相对大腿）：往后弯是负"),
  ankleL: z.number().min(-90).max(90).default(7).describe("L 脚（相对小腿）：小腿竖直时 0 = 脚放平"),
  thighL: z.number().min(0.4).max(1).default(1).describe("L 大腿的长度比例：正面蹲下、大腿朝镜头伸出来时压短"),
  hipR: z.number().min(-150).max(150).default(7).describe("R 胯"),
  kneeR: z.number().min(-170).max(170).default(-1).describe("R 膝（相对大腿）"),
  ankleR: z.number().min(-90).max(90).default(-6).describe("R 脚（相对小腿）"),
  thighR: z.number().min(0.4).max(1).default(1).describe("R 大腿的长度比例"),

  ground: z.boolean().default(true).describe("脚踩地：按腿的角度把低的那只脚放到地面上（关掉时胯停在站着的高度）"),
  lift: z.number().min(-300).max(600).default(0).describe("再往上抬多高（跳起来、飘着；全身约 590 高）"),
  float: z.number().min(0).max(1).default(0).describe("失重：0 垂着 → 0.5 没有重量 → 1 头发、围巾都往上漂，像在水里（连续过渡，和风一起算）"),
  wind: z.number().min(-2).max(2).default(0).describe("风：大小和方向，往画面左（−）或右（+）吹；头发、围巾跟着一阵一阵地飘（4 秒一个循环）"),
  idle: z.boolean().default(false).describe("呼吸和眨眼（按时间动）"),
  line: z.number().min(0.4).max(2).default(1).describe("描边粗细倍数（特写时调细）"),
});
export type FigureOptions = z.input<typeof figureOptions>;

const RAD = Math.PI / 180;
const EXPR_KEYS = ["blink", "happy", "sad", "fierce", "wide", "smile", "open", "blush", "tears", "squint", "round", "teeth", "wobble"] as const;

/** 参数 → 姿势（drawFigure 用的 PoseIn，可以再和动作、关键帧混合）。t：时间（呼吸、眨眼、飘的摆动）。look、items：脚踩地按这个角色和她穿的鞋算。 */
export function figurePose(options: FigureOptions = {}, t = 0, look: Look = BASE_LOOK, items?: Items): PoseIn {
  const o = figureOptions.parse(options);
  const expr: Expr = { ...NEUTRAL, ...EXPRESSIONS[o.expression] };
  for (const k of EXPR_KEYS) if (o[k] !== undefined) expr[k] = o[k];
  expr.look = [o.lookX ?? expr.look[0], o.lookY ?? expr.look[1]];
  if (o.idle) expr.blink = Math.max(expr.blink, blinkAt(t));
  const auto = (l: "auto" | "front" | "back") => (l === "auto" ? undefined : l);
  const pose: PoseIn = {
    face: o.face,
    headTurn: o.headTurn,
    neck: o.neck * RAD,
    lean: o.lean * RAD,
    rot: o.rot * RAD,
    breath: o.idle ? breathAt(t) : 0,
    t,
    armL: { a: o.shoulderL * RAD, b: o.elbowL * RAD, h: o.wristL * RAD, to: undefined, shape: o.handL, layer: auto(o.layerL) },
    armR: { a: o.shoulderR * RAD, b: o.elbowR * RAD, h: o.wristR * RAD, to: undefined, shape: o.handR, layer: auto(o.layerR) },
    legL: { a: o.hipL * RAD, b: o.kneeL * RAD, f: o.ankleL * RAD, thighK: o.thighL, to: undefined },
    legR: { a: o.hipR * RAD, b: o.kneeR * RAD, f: o.ankleR * RAD, thighK: o.thighR, to: undefined },
    expr,
    float: o.float,
    gravity: [0, 1 - 2 * o.float],
    // 风按画面方向给：朝右时整套镜像，这里先反过来
    drag: [o.face > 0 ? -o.wind : o.wind, 0],
  };
  // 物品（角色的）先放进去：穿不穿鞋影响哪里着地
  if (items) pose.items = items;
  const y = o.ground ? groundHip(pose, look) : DEFAULT_POSE.hip[1];
  pose.hip = [0, y - o.lift];
  return pose;
}

/** 按参数画基础模型（或给 look 画某个角色）：(x, y) 是两脚之间的地面，s = 1 时全身约 590 高。 */
export function figure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  options: FigureOptions = {},
  t = 0,
  look: Look = BASE_LOOK,
  opts: DrawOptions = {},
) {
  const o = figureOptions.parse(options);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawFigure(ctx, figurePose(o, t, look), look, { ...opts, line: o.line * (opts.line ?? 1) });
  ctx.restore();
}

export const resources = defineResources({
  figure: resource({
    kind: "character",
    title: "基础模型",
    description:
      "所有剪纸角色共用的人：骨架、身子、四肢、手脚、脸和 10 种表情（眼皮、眉毛、嘴可细调）、正面和 3/4 连续转身、手臂和身子的前后、风和失重。基础模型是光头、素色上衣下装、光手光脚；角色（例如秤砣）在它上面用 Look 换配色、发型、衣服、鞋和人物特点，不改基础模型。",
    tags: ["基础模型", "人", "剪纸", "骨架", "转身", "表情"],
    usage:
      "figure(ctx, x, y, s, { face, expression, shoulderL, … }, t, look)  // (x, y) 两脚之间的地面，s = 1 全身约 590 高；做新角色：写一个 Look（colors、backHair / frontHair 发型、overTorso 外衣、shoe / overLeg 鞋…），drawFigure(ctx, pose, look)",
    params: figureOptions,
    presets: {
      "3/4 朝左": { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -5, elbowL: 14, wristL: 8, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2 },
      "3/4 朝右": { face: 1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -5, elbowL: 14, wristL: 8, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2 },
      笑: { expression: "笑" },
      哭着笑: { expression: "哭着笑" },
      抱臂: { face: 0, shoulderL: -17, elbowL: 115, wristL: -14, shoulderR: 17, elbowR: -99, wristR: 6 },
      坐: { face: -1, hipL: 86, kneeL: -76, ankleL: -6, hipR: 80, kneeR: -96, ankleR: 20, lean: 8, neck: -4, shoulderL: 34, elbowL: 40, wristL: 10, shoulderR: 30, elbowR: 44, lookX: -0.4, lookY: 0.2 },
      呼吸眨眼: { idle: true },
    },

    preview: {
      width: 640,
      height: 960,
      duration: 4,
      background: "#f7ede8",
      draw(ctx, t, p) {
        const gy = 880;
        ctx.fillStyle = "rgba(90,70,110,0.12)";
        ctx.beginPath();
        ctx.ellipse(320, gy, 130, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        figure(ctx, 320, gy, Math.min(1.3, 840 / (650 + Math.max(0, p.lift))), p, t);
      },
    },
  }),
});
