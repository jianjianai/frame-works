// 秤砣：二维骨架剪纸角色。
// 画法：深色描边 + 平涂 + 右下一道阴影；各部件按关节坐标拼起来，接缝不描边。
// 坐标：角色单位，原点在两脚之间的地面，往上为负；全身约 590 高。
// 朝向 face：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身）。正面和 3/4 各有一张用户画的线稿
// （正面 `秤砣-线稿.svg`，3/4 `秤砣-侧面线稿.svg`），转身时身子、脖子、脸、刘海、五官从一张平滑过渡到另一张。
// 姿势一律按「朝左 / 正面」写：armL / legL 在画面右边（3/4 时是靠近镜头的一侧），
// 角度 0 = 垂下，正 = 顺时针（朝左时就是往前）；face > 0 时整套镜像。

import {
  type Ink,
  type P,
  type V2,
  Frame,
  add,
  angleOf,
  bendAlong,
  bezierPolyline,
  clamp01,
  clockwisePoly,
  dirOf,
  drawMerged,
  drawPart,
  fillShaded,
  gusty,
  ik2,
  len,
  lerp,
  lerpPts,
  lerpV,
  loopSin,
  marksByBox,
  matchOutlines,
  merge,
  mul,
  nearestIndex,
  norm,
  polylinePath,
  resampleOpen,
  ribbonPts,
  rowSpan,
  smoothPath,
  strokeLine,
  sub,
} from "./rig";
import { SIDE_BANGS, SIDE_FACE, SIDE_IRIS, SIDE_MOUTH, SIDE_NECK, SIDE_NOSE, SIDE_TORSO } from "./chengtuo-side";

export const COLORS = {
  // 配色取自用户给的参考图（2026-10-17）：炭黑头发、灰调藏青外套、哑光芥末黄围巾、砖红袖标
  line: "#25262c",
  skin: "#fbe2d3",
  skinShade: "#f0cab7",
  blush: "240,150,150",
  hair: "#35343a",
  hairShade: "#2a292f",
  hairHi: "#4d4c54",
  coat: "#353f55",
  coatShade: "#2b3346",
  coatLight: "#424d66",
  sweater: "#f8f1e2",
  sweaterShade: "#e8dfca",
  scarf: "#e2b856",
  scarfShade: "#c99c40",
  band: "#bd5349",
  bandShade: "#9e433b",
  tights: "#494a4f",
  tightsShade: "#3d3e43",
  glove: "#3f495b",
  gloveShade: "#343d4d",
  boot: "#5a6675",
  bootShade: "#4c5765",
  bootRim: "#677382",
  bootInside: "#2e3136",
  rust: "#8f6049",
  sole: "#38393c",
  rivet: "#d6d2cb",
  rope: "#a08a6e",
  ropeShade: "#7d6a53",
  brick: "#cbc6bd",
  brickShade: "#b2ada4",
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
  tear: "#cfeefa",
};
const K = COLORS;

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
  /** 穿着铁靴 */
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
  /** 靴筒里露出几块砖（0..2） */
  bricks: number;
  /** 身上的物品：显示或隐藏 */
  items: Items;
}

/** 身上的物品（外套、铁靴、袖标画好后也放在这里） */
export interface Items {
  /** 围巾（摘了露出脖子） */
  scarf: boolean;
  /** 手套（摘了是光着的手） */
  gloves: boolean;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };
export type PoseIn = DeepPartial<Pose>;

// ——— 尺寸 ———
export const BODY = {
  // 按用户线稿量的（2026-10-17）：胯关节连线是原点
  thigh: 125,
  shin: 91.9,
  /** 穿靴时脚踝离地（靴子还没画，先和光脚一样） */
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
  bricks: 2,
  items: { scarf: true, gloves: true },
};

export function resolvePose(p: PoseIn): Pose {
  return merge(DEFAULT_POSE, p);
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
  mir: boolean;
  u: number;
  /** 身体转角（朝左为负） */
  th: number;
  /** 头的转角 */
  thh: number;
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
function bodyFns(th: number) {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return {
    W: (a: number, b: number) => Math.sqrt(a * a * c * c + b * b * s * s),
    fx: (phi: number, a: number, b: number) => a * Math.sin(phi) * c + b * Math.cos(phi) * s,
    fz: (phi: number, a: number, b: number) => -a * Math.sin(phi) * s + b * Math.cos(phi) * c,
  };
}

export function rigOf(pIn: PoseIn | Pose): Rig {
  const pose = resolvePose(pIn as PoseIn);
  const mir = pose.face > 0;
  const u = Math.min(1, Math.abs(pose.face));
  const th = -u * 0.7;
  const uh = Math.max(-1, Math.min(1, u + pose.headTurn));
  const thh = -uh * 0.62;
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
    const root = chest.p(sh[0], sh[1] - br);
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
    mir,
    u,
    th,
    thh,
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

/** 关节在画面里的位置（已按朝向镜像），用来对齐道具、别的角色。 */
export function jointsOf(pIn: PoseIn | Pose) {
  const r = rigOf(pIn);
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
export interface DrawOptions {
  /** 描边粗细倍数（特写时可以调细） */
  line?: number;
  /** 手里拿的东西：在手掌和手指之间画，参数是手的坐标系（局部 +y 指向指尖）和是否镜像 */
  hold?: { L?: (ctx: CanvasRenderingContext2D, hand: Frame, mir: boolean) => void; R?: (ctx: CanvasRenderingContext2D, hand: Frame, mir: boolean) => void };
  /** 在前面的手臂之前画（被抱的人等） */
  beforeFrontArms?: (ctx: CanvasRenderingContext2D) => void;
}

export function drawChengtuo(ctx: CanvasRenderingContext2D, pIn: PoseIn | Pose, opts: DrawOptions = {}) {
  const rig = rigOf(pIn);
  const { pose, mir, u } = rig;
  const ink: Ink = { line: K.line, lw: 3.0 * (opts.line ?? 1), shade: [mir ? -4 : 4, 4] };
  const farBack = (side: "L" | "R") => {
    const ap = side === "L" ? pose.armL : pose.armR;
    if (ap.layer) return ap.layer === "back";
    return side === "R" && u > 0.35;
  };
  // 正面（和腿合并描边用同一个界限）：上臂画在身子后面，见 drawUpperArm
  const front = u < 0.25;
  const scoped = (fn: () => void) => {
    ctx.save();
    if (pose.squash) ctx.scale(1 + pose.squash * 0.6, 1 - pose.squash);
    if (mir) ctx.scale(-1, 1);
    fn();
    ctx.restore();
  };

  scoped(() => {
    drawBackHair(ctx, rig, ink);
    if (farBack("R")) drawArm(ctx, rig, "R", ink, opts);
    if (farBack("L")) drawArm(ctx, rig, "L", ink, opts);
    drawLegs(ctx, rig, ink);
    const behind = front ? (["R", "L"] as const).filter((side) => !farBack(side)) : [];
    for (const side of behind) drawUpperArm(ctx, rig, side, ink);
    drawTorso(ctx, rig, ink, behind);
    if (pose.items.scarf) drawScarfWrap(ctx, rig, ink);
    drawHead(ctx, rig, ink);
  });
  // 前面的手臂和围巾垂下来那头：围巾挂在胸前，垂在身边、举起来的手臂在它后面（风把围巾吹过手臂时压在手臂上），
  // 横在胸前的前臂（抱臂、递东西、抱人）压在围巾上面
  const fronts = (["R", "L"] as const).filter((side) => !farBack(side));
  const drawFront = (side: "L" | "R") => (front ? drawForearm(ctx, rig, side, ink, opts) : drawArm(ctx, rig, side, ink, opts));
  scoped(() => {
    for (const side of fronts) if (!crossesChest(rig, side)) drawFront(side);
    if (pose.items.scarf) drawScarfEnd(ctx, rig, ink);
  });
  opts.beforeFrontArms?.(ctx);
  scoped(() => {
    for (const side of fronts) if (crossesChest(rig, side)) drawFront(side);
  });
}

/** 前臂横在胸前（朝身体中线那边伸）：抱臂、递东西、抱人。按前臂在胸口坐标里朝里的分量判断 */
function crossesChest(rig: Rig, side: "L" | "R") {
  const limb = rig.arms[side];
  const d = rotateV(sub(limb.end, limb.mid), -rig.chest.a);
  return (side === "L" ? -d[0] : d[0]) / BODY.foreArm > 0.35;
}

// ——— 头发（后面那一大片） ———
// 用户亲手画的线稿（2026-10-17，`public/ref/秤砣-线稿.svg` 的「头部」图层）换算成头的坐标：脸最宽处半宽 41、下巴在 48，
// 比例 0.905，中线 x=229.5。路径都是 [起点, 控制点1, 控制点2, 终点, 控制点1, …]（三次贝塞尔）。
/** 头发的整个轮廓：头顶 + 披下来的长发（画在身体后面） */
const HAIR_OUTLINE: V2[] = [
  [-0.48, -74.05], [60.53, -73.65], [58.11, -2.94], [58.11, -2.94], [58.11, -2.94], [63.76, 54.44], [63.4, 54.12],
  [63.04, 53.79], [73.87, 115.46], [70.23, 132.43], [66.59, 149.4], [56.89, 167.99], [56.53, 167.66], [56.17, 167.34],
  [-57.05, 165.97], [-57.05, 165.97], [-57.05, 165.97], [-74.02, 102.94], [-68.36, 80.71], [-62.71, 58.49], [-59.87, 7.17],
  [-59.84, 2.4], [-59.8, -2.37], [-61.49, -74.45], [-0.48, -74.04],
];
/** 齐刘海：下沿平，三道细缝（缝里露出额头） */
const BANGS: V2[] = [
  [37.91, -47.7], [51.3, -30.75], [45.67, -6.81], [45.63, -6.9], [45.58, -6.99], [28.09, -7.95], [28.09, -7.95],
  [28.09, -7.95], [28.31, -11.84], [27.86, -15.72], [27.41, -19.6], [23.98, -28.51], [23.93, -28.6], [23.89, -28.69],
  [24.89, -20.52], [24.66, -16.63], [24.44, -12.75], [23.06, -7.5], [23.02, -7.59], [22.97, -7.68], [3.2, -9.33],
  [3.2, -9.33], [3.2, -9.33], [0.68, -33.31], [0.63, -33.41], [0.59, -33.5], [-1.6, -8.42], [-1.6, -8.42], [-1.6, -8.42],
  [-23.99, -8.42], [-23.99, -8.42], [-23.99, -8.42], [-25.13, -13.9], [-25.13, -17.1], [-25.13, -20.29], [-24.44, -28.97],
  [-24.48, -29.06], [-24.53, -29.15], [-27.18, -21.43], [-27.63, -18.46], [-28.09, -15.49], [-28.55, -8.64], [-28.55, -8.64],
  [-28.55, -8.64], [-46.82, -7.04], [-46.82, -7.04], [-46.82, -7.04], [-48.46, -12.73], [-47.76, -21.0], [-47.07, -29.27],
  [-42.44, -42.63], [-34.71, -50.43], [-26.98, -58.23], [-11.89, -63.09], [2.32, -62.12], [16.53, -61.15], [31.22, -56.16],
  [37.91, -47.7],
];
/** 两边垂在脸边上的头发（盖住脸的边和耳根） */
const LOCK_L: V2[] = [
  [-36.4, 26.92], [-36.16, 26.69], [-49.93, 12.49], [-44.39, -17.84], [-44.39, -17.84], [-36.27, -17.52], [-36.27, -17.52],
  [-38.86, -6.83], [-36.65, 27.15], [-36.4, 26.93],
];
const LOCK_R: V2[] = [
  [37.09, -17.7], [40.76, -14.9], [33.43, 29.93], [33.43, 29.93], [33.43, 29.93], [48.94, 5.14], [45.92, -15.33],
  [42.91, -35.8], [33.43, -20.5], [37.09, -17.7],
];
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
const EYE_X = 20.52;
const EYE_Y = 7.97;
const IRIS_RX = 6.97;
const IRIS_RY = 9.96;
const EYE_OUT = 10.6;

/** 按 map 把一串三次贝塞尔点画成路径 */
function cubicPath(pts: V2[], map: (p: V2) => V2, close = true, path = new Path2D()): Path2D {
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

const smooth01 = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * 头发转到 3/4 时的横向位置（照三视图的 3/4 量的，用户 2026-10-18）：头顶那块几乎不挪，远侧（画面左）稍宽一点，盖住侧面刘海的边；
 * 披下来的一片往后脑勺挪一点（近侧多、远侧少）。w：0 头顶 → 1 披下来的部分。
 */
function hairTurnX(x: number, uh: number, w: number) {
  return x + uh * lerp(-1.2 + (2.2 * x) / 60, 4.5 + (2.5 * x) / 65, w);
}

// ——— 后面的头发：头顶照线稿，耳朵以下披下来的一片跟着受力弯、在风里飘 ———
/** 头发的整个轮廓（折线）：找每一行的左右边 */
const HAIR_POLY = bezierPolyline(HAIR_OUTLINE, 24);
/** 从这个高度往下是披下来的部分 */
const HAIR_PIVOT = 15;
/**
 * 发梢分成几绺，每绺收成一个圆尖，绺和绺之间往上分开一道 V（不是一刀切的直线，用户 2026-10-18）。
 * 数是每绺的尖比分缝处长多少；cut 是每道分缝往上画的细发丝线有多长（占整片长度的比例）。
 * 绺数是双数：中间那道缝正好在正中，飘起来时左右两半从这里分开。
 */
const HAIR_TIPS = [13, 19, 16, 22, 21, 17, 20, 12];
const HAIR_CUTS = [0.26, 0.2, 0.32, 0.38, 0.22, 0.3, 0.18];

/** 发梢那一线的高度：分缝处是一道中间低、两边高的弧，再加上每绺的尖（s：0 左边 → 1 右边） */
function hairEnd(s: number) {
  const n = HAIR_TIPS.length;
  const k = Math.min(n - 1, Math.floor(s * n));
  const u = (s * n - k) * 2 - 1;
  return 143 + 8 * (1 - (2 * s - 1) ** 2) + HAIR_TIPS[k] * (1 - Math.abs(u) ** 1.5);
}

/** 披下来的部分每隔 3 一行的左右边（线稿的轮廓；140 以下不再变宽） */
const HAIR_DY = 3;
const HAIR_ROWS: V2[] = Array.from({ length: 66 }, (_, i) => rowSpan(HAIR_POLY, Math.min(HAIR_PIVOT + i * HAIR_DY, 140)) ?? [-60, 60]);

/** 披下来那片上第 s 条（0 左边 → 1 右边）在高度 y 处的 x：头的坐标，还没转身、没受力；140 以下两边稍微收拢 */
function hairRestX(s: number, y: number) {
  const t = Math.max(0, Math.min(HAIR_ROWS.length - 1.001, (y - HAIR_PIVOT) / HAIR_DY));
  const i = Math.floor(t);
  const [l, r] = lerpV(HAIR_ROWS[i], HAIR_ROWS[i + 1], t - i);
  const cx = (l + r) / 2;
  return cx + (lerp(l, r, s) - cx) * (1 - 0.14 * smooth01(140, 178, y));
}

/**
 * 后面的头发：头顶照线稿，耳朵以下披下来的部分是几绺并排的头发（垂着时拼成一整片）。
 * 每绺从发根往下一段一段转向受力方向（重力 + 风 + 动作带起来的惯性，bendAlong），越往下转得越多：
 * - 横着吹时左边的头发从脑后绕过去、和右边的叠在一起，飘出去的一股自然变窄，右边从耳朵下面直接接出去；
 *   风大时中间几绺拉长、两边的短，收成尖；每绺按自己的节奏抖（4 秒一个循环）。
 * - 失重（float）、往下坠时受力朝上：左边几绺往左外侧、右边几绺往右外侧偏，从两边翻上去，越往上越散开；
 *   0 → 1 连续过渡，和风一起算（风把飘起来的头发吹向一边）。
 */
function drawBackHair(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const { head, thh, field, pose } = rig;
  const uh = -thh / 0.62;
  const P = HAIR_PIVOT;
  const t = pose.t;
  // 受力（头的坐标里，角度 0 = 正下方）
  const f = gusty(rotateV(field, -head.a), t);
  const phi = angleOf(f);
  const strength = Math.min(len(f), 1.5);
  const gust = clamp01(Math.abs(f[0]) / 1.2);
  const up = clamp01(0.3 - f[1]);
  const turn = (x: number, y: number) => hairTurnX(x, uh, smooth01(-5, 40, y));
  const restX = (s: number, y: number) => turn(hairRestX(s, y), y);
  const n = HAIR_TIPS.length;
  const N = HAIR_ROWS.length - 1;

  // 每绺：沿自己的中线从根往下逐段转（bendAlong），两边按垂直于中线的方向放（怎么弯都保持宽度）。
  // 飘起来时左边几绺往左、右边几绺往右偏一点（决定从哪边翻上去，中间两绺也要偏，不然在正中不稳、迟迟不起来），
  // 并且在发根附近就转上去，贴着头往上漂，不在两边绕出大弯
  const locks = HAIR_TIPS.map((_, k) => {
    const s0 = k / n;
    const s1 = (k + 1) / n;
    const sc = (s0 + s1) / 2;
    const fan = (sc - 0.5) * 2;
    // 飘起来时每绺对着的方向按位置往外散开（越靠外越往外），像一团往上漾的火苗
    const ang = bendAlong(
      phi + fan * up * 0.7,
      N,
      (i) => {
        const y = (i - 0.5) * HAIR_DY;
        return 0.03 * HAIR_DY * strength * ((1 + 0.5 * gust) * smooth01(0, 40, y) + 3 * up * (1 - smooth01(20, 70, y)));
      },
      (i) => -Math.sign(fan) * up * (0.25 + 0.2 * Math.abs(fan)) * smooth01(0, 20, i * HAIR_DY),
    );
    // 抖：风里一绺一绺地抖，失重时像在水里慢慢漾；越往发梢越大
    const a = ang.map((v, i) => {
      const r = i / N;
      return v + gust * 0.12 * loopSin(t, 5, k * 0.9 - i * 0.15) * r ** 1.5 + pose.float * 0.25 * loopSin(t, 1, k * 1.3 - i * 0.08) * r;
    });
    const C: V2[] = [[restX(sc, P), P]];
    for (let i = 1; i <= N; i++) {
      const y0 = P + (i - 1) * HAIR_DY;
      C.push(add(C[i - 1], rotateV([restX(sc, y0 + HAIR_DY) - restX(sc, y0), HAIR_DY], (a[i - 1] + a[i]) / 2)));
    }
    /** 这绺上第 s 条（s0..s1）在原来高度 y 处的点 */
    const at = (s: number, y: number): V2 => {
      const tt = Math.max(0, Math.min(N - 0.001, (y - P) / HAIR_DY));
      const i = Math.floor(tt);
      const f = tt - i;
      return add(lerpV(C[i], C[i + 1], f), rotateV([restX(s, y) - restX(sc, y), 0], lerp(a[i], a[i + 1], f)));
    };
    return { s0, s1, at };
  });
  /** 发梢那一线（风大时中间几绺拉长、两边的短） */
  const endY = (s: number) => hairEnd(s) + gust * (24 * (1 - (2 * s - 1) ** 2) - 6);
  const H = (q: V2): V2 => head.p(q[0], q[1]);

  // 每绺一块：右边往下 → 发梢 → 左边往上
  const NV = 24;
  const PER = 8;
  const pieces = locks.map(({ s0, s1, at }) => {
    const pts: V2[] = [];
    for (let i = 0; i <= NV; i++) pts.push(H(at(s1, lerp(P, endY(s1), i / NV))));
    for (let j = PER - 1; j >= 1; j--) {
      const s = lerp(s0, s1, j / PER);
      pts.push(H(at(s, endY(s))));
    }
    for (let i = NV; i >= 0; i--) pts.push(H(at(s0, lerp(P, endY(s0), i / NV))));
    return polylinePath(pts);
  });
  // 头顶：线稿耳朵以上那部分
  const firstBelow = HAIR_POLY.findIndex((q) => q[1] > P);
  let lastBelow = HAIR_POLY.length - 1;
  while (HAIR_POLY[lastBelow][1] <= P) lastBelow--;
  const dome = polylinePath(
    [...HAIR_POLY.slice(lastBelow + 1), ...HAIR_POLY.slice(0, firstBelow)].map(([x, y]) => head.p(turn(x, y), y)),
  );
  // 合并描边：每块先描两倍宽的边，再整个一起填色、加阴影（拼起来的地方不留缝）
  const all = new Path2D();
  for (const p of [dome, ...pieces]) all.addPath(p);
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of [dome, ...pieces]) ctx.stroke(p);
  fillShaded(ctx, all, K.hair, K.hairShade, ink);

  // 分缝往上的细发丝线（画在左边那绺的右边上）：分缝处粗、往上变细
  ctx.fillStyle = K.line;
  HAIR_CUTS.forEach((cut, i) => {
    const { s1, at } = locks[i];
    const line: V2[] = [];
    for (let j = 0; j <= 8; j++) line.push(H(at(s1, lerp(P, endY(s1), 1 - cut + (cut * j) / 8))));
    const widths = line.map((_, j) => ink.lw * (0.04 + 0.34 * (j / 8)));
    ctx.fill(smoothPath(ribbonPts(line, widths, 0.4)));
  });
}

export function drawBrickShape(ctx: CanvasRenderingContext2D, f: Frame, w: number, h: number, ink: Ink, color = K.brick, shade = K.brickShade) {
  const pts: P[] = [
    [...f.p(-w / 2, -h), 1] as P,
    [...f.p(w / 2, -h), 1] as P,
    [...f.p(w / 2, 0), 1] as P,
    [...f.p(-w / 2, 0), 1] as P,
  ];
  const path = smoothPath(pts);
  drawPart(ctx, path, color, shade, { ...ink, shade: [3, 3] }, ink.lw * 0.85);
  // 顶面一条亮边
  strokeLine(ctx, [f.p(-w / 2 + 4, -h + 4), f.p(w / 2 - 4, -h + 4)], "rgba(255,255,255,0.55)", 2);
}

// ——— 身体（用户线稿 `public/ref/秤砣-线稿.svg` 的「身体」图层，2026-10-17） ———
// 身体坐标：原点在两个胯关节连线的中点，y 向下；线稿像素 → ((X − 229.5)·0.905, (Y − 463.8)·0.905)，和头部同一个比例。
/** 围巾：绕脖子的一圈 */
const SCARF_WRAP: V2[] = [[-31.85, -163.68], [-31.13, -166.76], [-32.63, -171.52], [-31.73, -173.49], [-30.84, -175.46], [-24.35, -176.69], [-24.56, -176.77], [-24.77, -176.84], [-12.53, -180.37], [0.61, -180.26], [13.73, -180.14], [29.47, -175.99], [30.89, -174.21], [32.31, -172.42], [33.33, -167.57], [32.44, -165.77], [31.54, -163.97], [32.49, -163.06], [33.06, -161.52], [33.63, -159.97], [33.09, -153.49], [33.05, -153.66], [33.02, -153.84], [17.9, -142.54], [0.29, -143.07], [-17.32, -143.59], [-31.35, -151.69], [-32.11, -152.95], [-32.87, -154.22], [-32.56, -160.62], [-31.83, -163.7]];
/** 围脖上的褶：两边的小折痕、上沿那道弧（只描线） */
const SCARF_FOLDS: V2[][] = [
  [[-31.68, -165.41], [-31.68, -165.41], [-31.41, -164.14], [-30.77, -163.51], [-30.14, -162.87], [-30.32, -162.51], [-29.87, -162.19]],
  [[32, -164.1], [32, -164.1], [31, -162.83], [31, -162.83], [31, -162.83], [29.55, -161.2], [29.55, -161.2]],
  [[-24.53, -174.5], [-24.53, -174.5], [-25.25, -174.4], [-25.52, -173.04], [-25.8, -171.67], [-15.35, -165.68], [-1.17, -165.59], [13.01, -165.5], [26.18, -171.22], [25.55, -173.04], [24.92, -174.86], [25.01, -174.22], [24.83, -174.31]],
];
/** 围巾垂下来的一头（上端开口，塞在围脖下面） */
const SCARF_END: V2[] = [[10.26, -144], [10.26, -144], [8.75, -62.14], [9.61, -61.48], [10.47, -60.83], [32.08, -60.62], [32.51, -61.48], [32.95, -62.34], [31.43, -153.29], [31.41, -153.44]];
/** 流苏 */
const SCARF_FRINGE: V2[][] = [
  [[10.11, -61.17], [10.11, -61.17], [10.35, -44.91], [10.3, -45], [10.25, -45.1], [10.11, -44.42], [12.29, -44.3], [14.47, -44.18], [14.72, -45.26], [14.67, -45.36], [14.63, -45.46], [14.72, -61.16], [14.67, -61.26], [14.63, -61.36], [10.11, -61.16], [10.11, -61.16]],
  [[16.49, -60.99], [16.49, -60.99], [16.72, -44.73], [16.67, -44.82], [16.63, -44.92], [16.49, -44.24], [18.55, -44.11], [20.62, -44], [20.85, -45.08], [20.81, -45.18], [20.76, -45.28], [20.85, -60.98], [20.81, -61.08], [20.76, -61.18], [16.49, -60.98], [16.49, -60.98]],
  [[22.56, -60.99], [22.56, -60.99], [22.77, -44.73], [22.74, -44.82], [22.69, -44.92], [22.56, -44.24], [24.46, -44.11], [26.36, -44], [26.57, -45.08], [26.53, -45.18], [26.48, -45.28], [26.57, -60.98], [26.53, -61.08], [26.48, -61.18], [22.57, -60.98], [22.57, -60.98]],
  [[28.38, -61.35], [28.38, -61.35], [28.59, -45.09], [28.56, -45.18], [28.51, -45.28], [28.38, -44.6], [30.28, -44.48], [32.18, -44.36], [32.39, -45.45], [32.35, -45.54], [32.3, -45.64], [32.39, -61.34], [32.35, -61.44], [32.3, -61.54], [28.39, -61.34], [28.39, -61.34]],
];
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
const REST = {
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
function toLocal(pts: V2[], o: V2, a: number): V2[] {
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
const HAND_A = angleOf(sub(REST.wrist, REST.elbow));
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
/** 肩关节转到 3/4 时的位置：跟着身子轮廓上离它最近的那一点挪 */
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

function polyPath(pts: V2[], map: (p: V2) => V2): Path2D {
  const path = new Path2D();
  pts.forEach((q, i) => {
    const m = map(q);
    if (i) path.lineTo(m[0], m[1]);
    else path.moveTo(m[0], m[1]);
  });
  path.closePath();
  return path;
}

// ——— 手臂、手套 ———
/**
 * 肩膀那一圈：袖子和身子在这里是一块（参考图 `public/ref/秤砣-抱臂遮挡参考.png`），这里面它们互相重叠的地方不描线；
 * 胳膊和身子之间那条线从腋下（上臂大约三分之一处）才开始。
 */
const SHOULDER_MERGE_R = 32;
function shoulderZone(rig: Rig, side: "L" | "R"): Path2D {
  const [x, y] = rig.arms[side].root;
  const p = new Path2D();
  p.arc(x, y, SHOULDER_MERGE_R, 0, Math.PI * 2);
  return p;
}
/** 裁剪用：除了 path 以外的地方 */
function outside(path: Path2D): Path2D {
  const p = new Path2D();
  p.rect(-1e4, -1e4, 2e4, 2e4);
  p.addPath(path);
  return p;
}

/** 一只手臂的两节放到现在的姿势上（线稿画的是 L 即画面右边那只，R 整只镜像） */
function armPaths(rig: Rig, side: "L" | "R") {
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
  // 合并描边（两倍宽的边再盖上填色），但肩膀那一圈里压在身子上的边不描：身子外面一遍、肩膀圈外面一遍
  const torso = torsoPaths(rig).torso;
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const keep of [outside(torso), outside(shoulderZone(rig, side))]) {
    ctx.save();
    ctx.clip(keep, "evenodd");
    ctx.stroke(upper);
    ctx.stroke(lower);
    ctx.restore();
  }
  fillShaded(ctx, upper, K.sweater, K.sweaterShade, ink);
  fillShaded(ctx, lower, K.sweater, K.sweaterShade, ink);
  drawGlove(ctx, limb.tip, sx, ap.shape, ink, (c) => opts.hold?.[side]?.(c, limb.tip, rig.mir), !rig.pose.items.gloves);
}

/**
 * 正面时上臂和身子重叠的地方显示身子的轮廓线、不显示上臂的（用户 2026-10-17）：上臂画在身子后面，
 * 前臂和手套照样画在前面（抱臂、捂嘴这些动作要压在身子、脸前面）。
 */
function drawUpperArm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  drawPart(ctx, armPaths(rig, side).upper, K.sweater, K.sweaterShade, ink);
}

/** 前臂 + 手套（正面，上臂已经画在身子后面）：前臂和露出来的上臂接的地方不描线；上臂藏在身子后面的那段，前臂照常描 */
function drawForearm(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, opts: DrawOptions) {
  const { limb, sx, upper, lower } = armPaths(rig, side);
  const ap = side === "L" ? rig.pose.armL : rig.pose.armR;
  fillShaded(ctx, lower, K.sweater, K.sweaterShade, ink);
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
  ctx.save();
  ctx.clip(torsoPaths(rig).torso);
  ctx.stroke(lower);
  ctx.restore();
  drawGlove(ctx, limb.tip, sx, ap.shape, ink, (c) => opts.hold?.[side]?.(c, limb.tip, rig.mir), !rig.pose.items.gloves);
}

/**
 * 手套：手指在手掌后面，拿着的东西画在手掌和大拇指之间。握拳时收起手指，指一下时只留一根。
 * 手掌和手指、大拇指接的地方不描线（同一块手套，和刘海一个道理），手指之间的线留着。
 * bare：摘了手套，同样的手形画成皮肤色（和脸一样细线、手指不加阴影）。
 */
function drawGlove(ctx: CanvasRenderingContext2D, f: Frame, sx: number, shape: HandShape, ink: Ink, hold: (ctx: CanvasRenderingContext2D) => void, bare = false) {
  const on = ([x, y]: V2) => f.p(x * sx, y);
  const fingers = (shape === "fist" || shape === "grip" ? [] : shape === "point" || shape === "pinky" ? [HAND.fingers[1]] : HAND.fingers).map(
    (fi) => cubicPath(fi, on),
  );
  const base = bare ? K.skin : K.glove;
  const lw = ink.lw * (bare ? 0.6 : 0.8);
  for (const p of fingers) drawPart(ctx, p, base, bare ? null : K.gloveShade, ink, lw);
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
  hold(ctx);
  // 大拇指压在手掌上：只填色，描边扣掉手掌——和手掌接的地方也不描（用户 2026-10-17）
  const thumb = cubicPath(HAND.thumb, on);
  fillShaded(ctx, thumb, base, null, ink);
  ctx.save();
  const out = new Path2D();
  out.rect(-1e4, -1e4, 2e4, 2e4);
  out.addPath(palm);
  ctx.clip(out, "evenodd");
  ctx.stroke(thumb);
  ctx.restore();
}

// ——— 腿、光脚 ———
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
function legPaths(rig: Rig, side: "L" | "R"): Path2D[] {
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
  drawFoot(ctx, rig, "R", ink);
  drawFoot(ctx, rig, "L", ink);
  const pelvis = pelvisPath(rig);
  if (rig.u >= 0.25) {
    drawPart(ctx, pelvis, K.tights, null, ink);
    for (const side of ["R", "L"] as const) drawMerged(ctx, legPaths(rig, side), K.tights, K.tightsShade, ink);
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
  fillShaded(ctx, thighs, K.tights, K.tightsShade, ink);
  fillShaded(ctx, shR, K.tights, K.tightsShade, ink);
  fillShaded(ctx, shL, K.tights, K.tightsShade, ink);
}

// ——— 身子、脖子 ———
/** 身子、脖子放到现在的姿势上（转身时从正面线稿过渡到侧面线稿；呼吸时胸口以上起伏） */
function torsoPaths(rig: Rig): { neck: Path2D; torso: Path2D } {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const on = ([x, y]: V2): V2 => chest.p(x, y - br * clamp01(-y / 140));
  return { neck: polylinePath(lerpPts(...NECK_TURN, u), on), torso: polylinePath(lerpPts(...TORSO_TURN, u), on) };
}

/** sides：正面时画在身子后面的上臂。身子的边在这些上臂的肩膀圈里不描（袖子和身子在肩膀是一块），腋下往下照常描 */
function drawTorso(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, sides: ("L" | "R")[] = []) {
  const { neck, torso } = torsoPaths(rig);
  drawPart(ctx, neck, K.skin, K.skinShade, ink, ink.lw * 0.6);
  if (!sides.length) {
    drawPart(ctx, torso, K.sweater, K.sweaterShade, ink);
    return;
  }
  fillShaded(ctx, torso, K.sweater, K.sweaterShade, ink);
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
    ctx.stroke(torso);
    ctx.restore();
  }
}

// ——— 围巾 ———
/** 围巾放到现在的姿势上：绕脖子那圈、垂下来那头各自的映射 */
function scarfMaps(rig: Rig) {
  const { chest, th, pose, field } = rig;
  const { fx } = bodyFns(th);
  const br = pose.breath * 1.6;
  // 3/4：贴着身体的东西按椭圆柱转（a 半宽、b 半厚）
  const onBody = (a: number, b: number) => (x: number) => fx(Math.asin(Math.max(-1, Math.min(1, x / a))), a, b);
  const wrapX = onBody(37, 28);
  const endX = onBody(56, 34);

  // 垂下来的一头：从围脖下面出来，一段一段转向受力方向（走路、跳、弯腰、风，bendAlong）；
  // 受力朝上（失重、往下坠）时先往外侧（画面右边）偏，从外侧翻上去，不盖住脸（转角限制在 -2.8..1.4）；
  // 风里按 4 秒的循环抖，失重时慢慢漾
  const f = gusty(rotateV(field, -chest.a), pose.t);
  const gust = clamp01(Math.abs(f[0]) / 1.2);
  const up = clamp01(0.3 - f[1]);
  const STEPS = 20;
  const bend = bendAlong(
    angleOf(f),
    STEPS,
    (i) => (3.2 / STEPS) * Math.min(len(f), 1.5) * (1 + 0.5 * gust) * smooth01(0, 0.3, (i - 0.5) / STEPS),
    (i) => -0.9 * up * smooth01(0, 0.3, i / STEPS),
  ).map((a) => Math.max(-2.8, Math.min(1.4, a)));
  const PIV: V2 = [endX(21), -146.5];
  const LEN = 102;
  const endMap = ([x, y]: V2): V2 => {
    const lx = endX(x);
    const t = clamp01((y - PIV[1]) / LEN);
    const i = Math.min(STEPS - 1, Math.floor(t * STEPS));
    const a =
      lerp(bend[i], bend[i + 1], t * STEPS - i) +
      gust * (0.22 * loopSin(pose.t, 5, -t * 4) + 0.08 * loopSin(pose.t, 9, 1.7 - t * 6)) * t +
      pose.float * 0.25 * loopSin(pose.t, 1, t * 3) * t;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const dx = lx - PIV[0];
    const dy = y - PIV[1];
    return chest.p(PIV[0] + dx * c - dy * s, PIV[1] + dx * s + dy * c - br);
  };
  const wrapMap = ([x, y]: V2): V2 => chest.p(wrapX(x), y - br);
  return { endMap, wrapMap };
}

/** 绕脖子的一圈（画在头前面，下巴压在它上面） */
function drawScarfWrap(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const { wrapMap } = scarfMaps(rig);
  drawPart(ctx, cubicPath(SCARF_WRAP, wrapMap), K.scarf, K.scarfShade, ink, ink.lw * 0.8);
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const fold of SCARF_FOLDS) ctx.stroke(cubicPath(fold, wrapMap, false));
}

/**
 * 垂下来的一头（和手臂排前后，见 drawChengtuo）：裁掉绕脖子那圈盖住的地方，看上去还是塞在围脖下面；
 * 也裁掉脸（失重时从外侧翻上来，贴着脸边，不盖住脸）
 */
function drawScarfEnd(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const { endMap, wrapMap } = scarfMaps(rig);
  ctx.save();
  ctx.clip(outside(cubicPath(SCARF_WRAP, wrapMap)), "evenodd");
  ctx.clip(outside(facePathOf(rig)), "evenodd");
  // 流苏先画（压在垂下来那头的下沿后面）
  for (const fr of SCARF_FRINGE) drawPart(ctx, cubicPath(fr, endMap), K.scarf, K.scarfShade, ink, ink.lw * 0.6);
  fillShaded(ctx, cubicPath(SCARF_END, endMap), K.scarf, K.scarfShade, ink);
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 0.8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(cubicPath(SCARF_END, endMap, false));
  ctx.restore();
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
function faceHW(y: number): number {
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

// ——— 转身：脸、刘海、五官从正面线稿过渡到侧面线稿（chengtuo-side.ts） ———
/** 正面的脸：FACE_CURVE 是右半边（头顶到下巴），左半边镜像 */
const FRONT_FACE: V2[] = (() => {
  const half = bezierPolyline(FACE_CURVE, 32, false);
  return [...half, ...half.slice(1, -1).reverse().map(([x, y]): V2 => [-x, y])];
})();
/** 脸：头顶、最右、下巴、最左四个标志点之间逐点对应 */
const FACE_TURN: [V2[], V2[]] = (() => {
  const a = clockwisePoly(FRONT_FACE);
  const b = clockwisePoly(bezierPolyline(SIDE_FACE));
  const marks = (p: V2[]) => {
    const by = (f: (q: V2) => number) => p.reduce((bi, q, i) => (f(q) > f(p[bi]) ? i : bi), 0);
    return [by((q) => -q[1]), by((q) => q[0]), by((q) => q[1]), by((q) => -q[0])];
  };
  return matchOutlines(a, marks(a), b, marks(b), 32);
})();

/** 横向的分段线性映射：xs 里的每个位置对到 ys（两头按端点的斜率外推） */
function pieceLinear(xs: number[], ys: number[]) {
  return (x: number) => {
    let i = 0;
    while (i < xs.length - 2 && x > xs[i + 1]) i++;
    return ys[i] + ((x - xs[i]) / (xs[i + 1] - xs[i])) * (ys[i + 1] - ys[i]);
  };
}

/**
 * 刘海：侧面线稿只画了外轮廓（下沿一条直线），缝照正面的补上——
 * 正面的下沿（连同三道缝）按「左下角、两只眼珠、右下角」对齐的横向映射搬到侧面的下沿上，缝的深浅不变；
 * 上面的圆顶按弧长对应（头顶是标志点）。
 */
const BANGS_TURN: [V2[], V2[]] = (() => {
  const front = clockwisePoly(bezierPolyline(BANGS, 16));
  const side = clockwisePoly(bezierPolyline(SIDE_BANGS, 24));
  const [fR, fL] = marksByBox(front, [[1, 1], [0, 1]]);
  const [sR, sL] = marksByBox(side, [[1, 1], [0, 1]]);
  const walk = (p: V2[], a: number, b: number) => {
    const out: V2[] = [];
    for (let i = a; ; i = (i + 1) % p.length) {
      out.push(p[i]);
      if (i === b) return out;
    }
  };
  // 下沿：右下角 → 左下角，逐点搬过去
  const bottomF = walk(front, fR, fL);
  const [FR, FL, SR, SL] = [front[fR], front[fL], side[sR], side[sL]];
  const mapX = pieceLinear([FL[0], -EYE_X, EYE_X, FR[0]], [SL[0], SIDE_IRIS.R.c[0], SIDE_IRIS.L.c[0], SR[0]]);
  const base = (a: V2, b: V2, x: number) => a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
  const bottomS = bottomF.map(([x, y]): V2 => {
    const nx = mapX(x);
    return [nx, base(SL, SR, nx) + (y - base(FL, FR, x))];
  });
  // 圆顶：左下角 → 头顶 → 右下角
  const dome = (p: V2[], a: number, b: number) => {
    const d = walk(p, a, b);
    const top = d.reduce((bi, q, i) => (q[1] < d[bi][1] ? i : bi), 0);
    return [...resampleOpen(d.slice(0, top + 1), 24).slice(1), ...resampleOpen(d.slice(top), 24).slice(1, -1)];
  };
  // 侧面线稿里刘海的边和脸的边几乎重合：下沿以上，刘海的边至少比脸宽出一点，脸不从刘海边上露出来（露出来的一小条会被两边的头发压出一小截线）
  const sideFace = FACE_TURN[1];
  const cover = (p: V2): V2 => {
    if (p[1] > base(SL, SR, p[0]) - 8) return p;
    const span = rowSpan(sideFace, p[1]);
    if (!span) return p;
    return p[0] > (span[0] + span[1]) / 2 ? [Math.max(p[0], span[1] + 1.5), p[1]] : [Math.min(p[0], span[0] - 1.5), p[1]];
  };
  return [
    [...bottomF, ...dome(front, fL, fR)],
    [...bottomS, ...dome(side, sL, sR).map(cover)],
  ];
})();

/** 眼睛的位置和大小：正面在线稿的位置，3/4 按侧面线稿的眼珠放、横竖按眼珠的大小缩（s：-1 画面左，1 画面右） */
function eyeAt(s: number, uh: number) {
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

/**
 * 刘海在风里：两边贴着脸不动，中间的下半截往下风处飘、按位置错开地抖（4 秒一个循环）；
 * 受力朝上（失重、往下坠）时下沿往上翘，失重时慢慢漾。field 是头的坐标里的受力。
 */
function windBangs(pts: V2[], field: V2, pose: Pose): V2[] {
  const t = pose.t;
  const f = gusty(field, t);
  const wind = Math.max(-2, Math.min(2, f[0]));
  const up = clamp01(0.3 - f[1]);
  if (Math.abs(wind) < 1e-3 && up < 1e-3 && pose.float < 1e-3) return pts;
  const xs = pts.map((p) => p[0]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const cx = (x0 + x1) / 2;
  const hw = (x1 - x0) / 2;
  return pts.map(([x, y]) => {
    const w = smooth01(-40, -8, y) * (1 - smooth01(0.55, 0.95, Math.abs(x - cx) / hw));
    const dx = wind * 3.6 * (1 + 0.45 * loopSin(t, 5, x * 0.15));
    const dy = Math.abs(wind) * 2 * (0.55 + 0.45 * loopSin(t, 7, x * 0.2 + 1)) + up * 4 + pose.float * 1.5 * loopSin(t, 1, x * 0.1);
    return [x + dx * w, y - dy * w];
  });
}

/** 脸现在的轮廓（转身时从正面线稿过渡到侧面线稿） */
function faceOf(rig: Rig): V2[] {
  return lerpPts(...FACE_TURN, -rig.thh / 0.62);
}
function facePathOf(rig: Rig): Path2D {
  return polylinePath(faceOf(rig), ([x, y]) => rig.head.p(x, y));
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
    drawMouth(ctx, head, c[0], c[1], lerp(1, MOUTH_SIDE.wk, uh), lerp(0, MOUTH_SIDE.tilt, uh), e, ink);
  }

  // 两边的头发：盖住脸边和耳根，跟着脸走
  const locks = [LOCK_L, LOCK_R].map((lock) => cubicPath(lock, place));

  // 刘海：正面线稿 → 侧面线稿（缝照正面的补上），再按风、失重飘起来
  const bangs = polylinePath(windBangs(lerpPts(...BANGS_TURN, uh), rotateV(field, -head.a), pose), ([x, y]) => H(x, y));
  // 先填色、后描边。头发压在头发上的边不描（刘海后面是头发、两边的头发接着刘海，用户 2026-10-17），
  // 只描压在脸和耳朵上的边：刘海的下沿和几道缝、两边的头发贴着脸和耳朵的那一侧
  for (const p of [...locks, bangs]) fillShaded(ctx, p, K.hair, null, ink);
  const strokeOnSkin = (path: Path2D, under: Path2D[]) => {
    for (const skin of skins) {
      ctx.save();
      ctx.clip(skin);
      // 再扣掉别的头发盖住的地方
      const out = new Path2D();
      out.rect(-1e4, -1e4, 2e4, 2e4);
      for (const q of under) out.addPath(q);
      ctx.clip(out, "evenodd");
      ctx.strokeStyle = K.line;
      ctx.lineWidth = ink.lw * 0.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
      ctx.restore();
    }
  };
  for (const p of locks) strokeOnSkin(p, [bangs]);
  strokeOnSkin(bangs, locks);

  // 眉毛：透过刘海画在头发上，跟着眼睛走
  for (const [s, brow] of [[-1, BROW_L], [1, BROW_R]] as [number, V2[]][]) {
    const eye = eyes[s < 0 ? 0 : 1];
    drawBrow(ctx, head, brow, eye.x, eye.y, eye.sx, eye.sy, s, e, ink);
  }
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
    const b0 = botO(u) - e.happy * (botO(u) - topO(u)) * 0.78;
    // 闭眼时闭在眼睛中下部，不是落到最底下
    return b0 + (Math.min(b0, 3.2 * prof(u)) - b0) * e.blink;
  };
  const lid = (u: number) => {
    const t0 = topO(u);
    return (
      t0 +
      e.happy * 0.5 * (botO(u) - t0) +
      e.sad * 5 * Math.max(0, outer(u) + 0.15) +
      e.fierce * 5.5 * Math.max(0, -outer(u) + 0.15)
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
  const lift = -3 * e.wide - 0.8 * e.happy + 0.6 * e.blink;
  const map = ([x, y]: V2): V2 => {
    // 0 内端 → 1 外端
    const t = clamp01((Math.abs(x) - 18.5) / 18.2);
    const dy = lift + e.sad * (-3.4 * (1 - t) + 1.6 * t) + e.fierce * (3 * (1 - t) - 1.2 * t);
    return head.p(ex + (x - s * EYE_X) * sx, ey + (y + dy - EYE_Y) * sy);
  };
  ctx.strokeStyle = K.brow;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.lineCap = "round";
  ctx.stroke(cubicPath(brow, map, false));
}

/** 嘴：一道细弧，中间粗、两头细；张嘴时是一个小口。wk 横向缩放，tilt 斜度（转身时侧面线稿的嘴）。 */
function drawMouth(ctx: CanvasRenderingContext2D, head: Frame, mx: number, my: number, wk: number, tilt: number, e: Expr, ink: Ink) {
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(head.a);
  ctx.translate(mx, my);
  ctx.rotate(tilt);
  ctx.translate(-mx, -my);
  const s = e.smile - e.sad * 0.6;
  const o = e.open;
  const w = (6.8 + 1.6 * Math.abs(s) + o * 1.6) * wk;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (o < 0.08) {
    const pts: V2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const a = 1 - t;
      const y = (a * a + t * t) * (my - s * 2.4) + 2 * a * t * (my + s * 5.4);
      pts.push([mx - w + 2 * w * t, y]);
    }
    const widths = pts.map((_, i) => 0.35 + 0.5 * Math.sin((Math.PI * i) / 10));
    ctx.fillStyle = K.mouthLine;
    ctx.fill(smoothPath(ribbonPts(pts, widths, 0.5)));
  } else {
    const shape = new Path2D();
    shape.moveTo(mx - w, my - s * 1.4);
    shape.quadraticCurveTo(mx, my + s * 2.2, mx + w, my - s * 1.4);
    shape.quadraticCurveTo(mx, my + 2 + o * 13 + s * 3, mx - w, my - s * 1.4);
    shape.closePath();
    ctx.fillStyle = K.mouth;
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    ctx.fillStyle = K.tongue;
    ctx.beginPath();
    ctx.ellipse(mx, my + 3 + o * 9, w * 0.62, 3 + o * 3, 0, 0, Math.PI * 2);
    ctx.fill();
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

function rotateV(v: V2, a: number): V2 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

/** 手里拿着一块砖（给 DrawOptions.hold 用）：砖横在手掌上。 */
export function holdBrick(ctx: CanvasRenderingContext2D, hand: Frame) {
  const ink: Ink = { line: K.line, lw: 3, shade: [3, 3] };
  drawBrickShape(ctx, hand.child(0, 33, 0), 36, 27, ink);
}
