// 秤砣（《引力》的女主）= 基础模型（figure.ts）+ 她自己的配色、发型、衣服、鞋（Look：图层画在基础模型的各层之间，基础模型不改）。
// 发型：黑色齐刘海长直发（后面的头发、刘海、鬓发，随风飘、失重往上漂）；衣服：米白毛衣、深灰裤袜、芥末黄围巾、藏青手套、
// 藏青外套（袖子卷到小臂）、左臂红袖标；鞋：插着砖的生锈铁靴。物品都可以单独开关（Pose.items，见 ChengtuoItems）。
// 头发和围巾是用户画的线稿（作品 5b227852 的 `public/ref/秤砣-线稿.svg`、`秤砣-侧面线稿.svg`），
// 外套、袖标、铁靴是和用户一起画的服装线稿（`秤砣-服装线稿.svg`、`秤砣-服装侧面线稿.svg`，换算成 chengtuo-costume.ts）。

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
  drawPart,
  fillShaded,
  gusty,
  len,
  lerp,
  lerpPts,
  lerpV,
  loopSin,
  marksByBox,
  matchOutlines,
  polylinePath,
  resampleOpen,
  ribbonPts,
  rowSpan,
  smoothPath,
  strokeLine,
  sub,
} from "./rig";
import {
  type DrawOptions,
  type HeadView,
  type HoldInfo,
  type Look,
  type Pose,
  type PoseIn,
  type Rig,
  BODY,
  EYE_X,
  FACE_TURN,
  HAND_A,
  REST,
  WRAP_SIDE_SHIFT,
  bodyFns,
  cubicPath,
  drawFigure,
  facePathOf,
  figureJoints,
  figureRig,
  fillBodyPart,
  outside,
  polyPath,
  rotateV,
  smooth01,
  strokeBodyPart,
  toLocal,
  EAR_SIDE_IN,
  faceHW,
  faceOf,
} from "./figure";
import { SIDE_IRIS } from "./figure-side";
import { SIDE_BANGS } from "./chengtuo-side";
import { BAND, BOOT, COAT_FRONT, COAT_SIDE, CUFF, SHOULDER_RIVET } from "./chengtuo-costume";

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
  /** 毛衣上的细缝线（罗纹领的下沿） */
  sweaterSeam: "#b4aa94",
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


/** 秤砣身上的物品（Pose.items）：显示或隐藏 */
export interface ChengtuoItems {
  /** 围巾（摘了露出脖子） */
  scarf: boolean;
  /** 手套（摘了是光着的手） */
  gloves: boolean;
  /** 外套：两片前襟、口袋、翻领，袖子卷到小臂中间（下面露出手臂），肩头一颗铆钉 */
  coat: boolean;
  /** 红袖标（她的左上臂） */
  band: boolean;
  /** 铁靴（单只脱掉用 legL / legR 的 boot） */
  boots: boolean;
  /** 靴筒里插着几块砖（0..2：1 是画面左边那只靴子，2 是两只都有） */
  bricks: number;
}
export const CHENGTUO_ITEMS: ChengtuoItems = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 2 };
/** 姿势里的物品（drawFigure 已经补上了默认值） */
const items = (rig: Rig) => rig.pose.items as Partial<ChengtuoItems>;

// ——— 头发 ———
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
  // 两头补上正好在 P 这一行的点：头顶这块的下边和下面几绺的上边严丝合缝，不然漏出一条缝、露出描边（耳朵高度两边各一小段横线）
  const onRow = (a: V2, b: V2): V2 => [lerp(a[0], b[0], (P - a[1]) / (b[1] - a[1])), P];
  const dome = polylinePath(
    [
      onRow(HAIR_POLY[lastBelow], HAIR_POLY[(lastBelow + 1) % HAIR_POLY.length]),
      ...HAIR_POLY.slice(lastBelow + 1),
      ...HAIR_POLY.slice(0, firstBelow),
      onRow(HAIR_POLY[firstBelow - 1], HAIR_POLY[firstBelow]),
    ].map(([x, y]) => head.p(turn(x, y), y)),
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


/** 刘海下沿的高度（头的坐标）：后面那缕鬓发从这里垂下来 */
const BANGS_BOTTOM_Y = -6.64;

/**
 * 3/4 时后面那缕鬓发（盖着耳根）：直直地垂下来（用户 2026-10-18）——整缕按刘海下沿那一行横向映射，
 * 不像耳朵那样一行一行贴着脸边走（下颌往里收，贴着走就斜了）；线稿里这缕的尖往里收，再横向错切一点，
 * 压在脸上的内侧边（看得见的那条线）竖直；再跟耳朵一起往脸这边收。
 */
function lockBack(h: HeadView, pts: V2[]): Path2D {
  const { rig, H, uh, place } = h;
  const from = rowSpan(FACE_TURN[0], BANGS_BOTTOM_Y);
  const to = rowSpan(faceOf(rig), BANGS_BOTTOM_Y);
  if (uh <= 0 || !from || !to) return cubicPath(pts, place);
  const k = (to[1] - to[0]) / (from[1] - from[0]);
  const [top, tip] = [LOCK_R[0], LOCK_R[3]];
  const shear = ((top[0] - tip[0]) / (tip[1] - top[1])) * k * uh;
  const face = faceOf(rig);
  return cubicPath(pts, ([x, y]) => {
    let nx = to[0] + (x - from[0]) * k + shear * (y - BANGS_BOTTOM_Y) - EAR_SIDE_IN * uh;
    // 耳朵以上那段的外沿（压在后脑勺上，深色压深色看不见）不往里收，还是一行一行贴着脸的后沿：
    // 不然刘海下面、耳朵上面露出一道头皮的细缝（两条线）
    const w = 1 - smooth01(-8, 0, y);
    const fr = rowSpan(FACE_TURN[0], y);
    const tr = rowSpan(face, y);
    if (w > 0 && x > faceHW(y) && fr && tr) {
      const r = tr[0] + ((x - fr[0]) * (tr[1] - tr[0])) / (fr[1] - fr[0]);
      if (r > nx) nx += (r - nx) * w;
    }
    return H(nx, y);
  });
}

/** 远侧那缕（画面左边，正面线稿的坐标）压在脸上的部分往脸的左边上收：k = 1 不动，0 收到边上 */
function tuckLock(pts: V2[], k: number): V2[] {
  if (k >= 1) return pts;
  return pts.map(([x, y]) => {
    const edge = -faceHW(y);
    return [x > edge ? edge + (x - edge) * k : x, y];
  });
}

/** 刘海和两边的头发（Look.frontHair）：盖住脸边和耳根，跟着脸走；先填色、后描边，头发压在头发上的边不描（用户 2026-10-17），只描压在脸和耳朵上的边 */
function drawFrontHair(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink) {
  const { rig, H, uh, place } = h;
  const { head, field, pose } = rig;
  const f = rotateV(field, -head.a);
  // 转身时远侧那缕（LOCK_L）绕到脸后面（用户 2026-10-18：「face -1 时左边的被脸遮挡」）：
  // 压在脸上的那半截往脸的边上收，转过一半收完，之后整缕画在脸后面（只露出脸外面的部分），不会一下跳到后面
  const tuck = clamp01(1 - uh / 0.5);
  const far = cubicPath(tuckLock(windLock(LOCK_L, f, pose, -1), tuck), place);
  const near = lockBack(h, windLock(LOCK_R, f, pose, 1));
  const locks = tuck > 0 ? [far, near] : [near];
  // 刘海：正面线稿 → 侧面线稿（缝照正面的补上），再按风、失重飘起来
  const bangs = polylinePath(windBangs(lerpPts(...BANGS_TURN, uh), f, pose), ([x, y]) => H(x, y));
  if (tuck <= 0) {
    ctx.save();
    const out = new Path2D();
    out.rect(-1e4, -1e4, 2e4, 2e4);
    out.addPath(facePathOf(rig));
    ctx.clip(out, "evenodd");
    fillShaded(ctx, far, K.hair, null, ink);
    ctx.restore();
  }
  for (const p of [...locks, bangs]) fillShaded(ctx, p, K.hair, null, ink);
  for (const p of locks) h.strokeOnSkin(p, [bangs]);
  h.strokeOnSkin(bangs, locks);
}
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

/**
 * 鬓发在风里（用户 2026-10-18：「这个头发也要能被风影响」）：发根在刘海下沿钉住，越往下越顺着受力偏——
 * 风往下风处摆、一阵一阵地抖（4 秒一个循环），受力朝上（失重、往下坠）时往外漾起来。
 * pts 是正面线稿的坐标；out：这缕在脸的哪一边（1 右、-1 左），漾起来往外；field 是头的坐标里的受力。
 */
function windLock(pts: V2[], field: V2, pose: Pose, out: 1 | -1): V2[] {
  const t = pose.t;
  const f = gusty(field, t);
  const wind = Math.max(-2, Math.min(2, f[0]));
  const up = clamp01(0.3 - f[1]);
  if (Math.abs(wind) < 1e-3 && up < 1e-3 && pose.float < 1e-3) return pts;
  // 整缕绕发根转的角度（y 朝下，尖往右摆是负的），越往下转得越多，像一缕软的头发弯过去
  const a = -(wind * 0.3 * (1 + 0.35 * loopSin(t, 5, out)) + out * (up * 0.9 + pose.float * 0.12 * loopSin(t, 1, out)));
  const tipY = Math.max(...pts.map((p) => p[1]));
  const root: V2 = [pts.reduce((s, p) => s + p[0], 0) / pts.length, BANGS_BOTTOM_Y];
  return pts.map(([x, y]) => {
    const r = a * smooth01(BANGS_BOTTOM_Y, tipY, y);
    const dx = x - root[0];
    const dy = y - root[1];
    return [root[0] + dx * Math.cos(r) - dy * Math.sin(r), root[1] + dx * Math.sin(r) + dy * Math.cos(r)];
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


// ——— 围巾（用户线稿 `public/ref/秤砣-线稿.svg` 的「身体」图层，身体坐标） ———
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
// ——— 围巾 ———
/** 围巾放到现在的姿势上：绕脖子那圈、垂下来那头各自的映射 */
function scarfMaps(rig: Rig) {
  const { chest, th, pose, field } = rig;
  const { fx } = bodyFns(th);
  const br = pose.breath * 1.6;
  // 3/4：垂下来那头贴在胸前，按椭圆柱转（a 半宽、b 半厚）
  const onBody = (a: number, b: number) => (x: number) => fx(Math.asin(Math.max(-1, Math.min(1, x / a))), a, b);
  const endX = onBody(56, 34);
  // 绕脖子那圈是圆的（用户 2026-10-18）：转身时不压窄，整圈跟着脖子平移
  const wrapShift = rig.u * WRAP_SIDE_SHIFT;

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
  const wrapMap = ([x, y]: V2): V2 => chest.p(x + wrapShift, y - br);
  return { endMap, wrapMap };
}

/**
 * 绕脖子的一圈（下巴压在它上面），按上沿那道弧（SCARF_FOLDS[2]）分成前后两半：
 * 弧上面是绕到脖子后面的半圈，画在脖子后面（仰头时能看到脖子，后半圈只从脖子两边露出来）；
 * 弧下面是前面的半圈，压在脖子前面，那道弧就是它的上边。
 */
function drawScarfWrap(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, part: "back" | "front") {
  const { wrapMap } = scarfMaps(rig);
  const wrap = cubicPath(SCARF_WRAP, wrapMap);
  // 分界：上沿那道弧，两头水平往外接到围脖外面
  const arc = bezierPolyline(SCARF_FOLDS[2], 12, false);
  const [a0, a1] = [arc[0], arc[arc.length - 1]];
  const lower = polylinePath([[a0[0] - 40, a0[1]], ...arc, [a1[0] + 40, a1[1]], [a1[0] + 40, a1[1] + 60], [a0[0] - 40, a0[1] + 60]], wrapMap);
  ctx.save();
  ctx.clip(part === "front" ? lower : outside(lower), part === "front" ? "nonzero" : "evenodd");
  drawPart(ctx, wrap, K.scarf, K.scarfShade, ink, ink.lw * 0.8);
  ctx.restore();
  if (part === "back") return;
  ctx.strokeStyle = K.line;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // 前半圈的上边（压在脖子、后半圈上）
  ctx.lineWidth = ink.lw * 0.8;
  ctx.stroke(cubicPath(SCARF_FOLDS[2], wrapMap, false));
  // 两边的小折痕
  ctx.lineWidth = ink.lw * 0.5;
  for (const fold of SCARF_FOLDS.slice(0, 2)) ctx.stroke(cubicPath(fold, wrapMap, false));
}

/**
 * 垂下来的一头（和手臂排前后，见 drawChengtuo）：裁掉绕脖子那圈盖住的地方，看上去还是塞在围脖下面；
 * 也裁掉脸（失重时从外侧翻上来，贴着脸边，不盖住脸）
 */
function drawScarfEnd(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  const { endMap, wrapMap } = scarfMaps(rig);
  ctx.save();
  ctx.clip(outside(cubicPath(SCARF_WRAP, wrapMap)), "evenodd");
  ctx.clip(outside(facePathOf(rig, rig.headMir)), "evenodd");
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

// ——— 外套、袖标、铁靴（用户和 AI 一起画的服装线稿 `秤砣-服装线稿.svg`、`秤砣-服装侧面线稿.svg`，换算在 chengtuo-costume.ts） ———
/** 外套的一块：正面和 3/4 两张线稿按包围盒里的几个标志点逐点对应（两张的标志点位置不同时各给一组） */
function coatPair(front: V2[], side: V2[], boxF: V2[], boxS: V2[] = boxF, perSeg = 12): [V2[], V2[]] {
  const a = clockwisePoly(bezierPolyline(front));
  const b = clockwisePoly(bezierPolyline(side));
  return matchOutlines(a, marksByBox(a, boxF), b, marksByBox(b, boxS), perSeg);
}
const CORNERS: V2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
/**
 * 前襟：l 是正面画面左边那片（3/4 朝左时远的那片），r 是右边那片（近的那片，连着后背多出来的一块）。
 * 标志点：肩头、领口那头、门襟下角、下摆外角；翻领：领口那头、翻领的缺口、下面的尖。
 */
const COAT_TURN = {
  l: coatPair(COAT_FRONT.l, COAT_SIDE.l, CORNERS),
  r: coatPair(COAT_FRONT.r, COAT_SIDE.r, CORNERS),
  lapelL: coatPair(COAT_FRONT.lapelL, COAT_SIDE.lapelL, [[1, 0], [1, 1], [0, 0.2]], [[1, 0], [0, 1], [0.4, 0.25]], 8),
  lapelR: coatPair(COAT_FRONT.lapelR, COAT_SIDE.lapelR, [[0, 0], [1, 0.25], [0, 1]], undefined, 8),
  pocketL: coatPair(COAT_FRONT.pocketL, COAT_SIDE.pocketL, CORNERS, CORNERS, 6),
  pocketR: coatPair(COAT_FRONT.pocketR, COAT_SIDE.pocketR, CORNERS, CORNERS, 6),
};

/** 外套放到现在的姿势上（跟着胸口走，和身子一样呼吸） */
/**
 * 外套（前襟、翻领、口袋）放到现在的姿势上。别的角色也能穿（cast.ts）：size 整件放大（以领口为中心，大一号的外套），
 * long 下摆往下多长多少（身体坐标）。
 */
export function coatOf(rig: Rig, size = 1, long = 0) {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const NECK_Y = -156;
  const on = ([x0, y0]: V2): V2 => {
    const x = x0 * size;
    const y = NECK_Y + (y0 - NECK_Y) * size + long * clamp01((y0 + 60) / 100);
    return chest.p(x, y - br * clamp01(-y / 140));
  };
  const get = (k: keyof typeof COAT_TURN) => polylinePath(lerpPts(...COAT_TURN[k], u), on);
  return { l: get("l"), r: get("r"), lapelL: get("lapelL"), lapelR: get("lapelR"), pocketL: get("pocketL"), pocketR: get("pocketR") };
}

/** 穿外套时正面两个肩关节各往外挪多少（袖子接在外套的肩线上，照拆件图） */
const COAT_SHOULDER_OUT = 6;

/** 外套的两片前襟：压在身子上的手臂按它们裁描边（Look.bodyPieces） */
function coatPieces(rig: Rig): Path2D[] {
  if (!items(rig).coat) return [];
  const c = coatOf(rig);
  return [c.l, c.r];
}

/** 别的角色穿外套用：前襟两片（压在身上的手臂按它们裁描边） */
export function coatPanels(rig: Rig, size = 1, long = 0): Path2D[] {
  const c = coatOf(rig, size, long);
  return [c.l, c.r];
}

/** 外套：两片前襟（口袋、翻领压在上面），肩膀那一圈和上臂接成一块，和毛衣身子同样处理 */
export function drawCoat(
  ctx: CanvasRenderingContext2D,
  rig: Rig,
  ink: Ink,
  sides: ("L" | "R")[],
  fill: string = K.coat,
  shade: string = K.coatShade,
  size = 1,
  long = 0,
) {
  const c = coatOf(rig, size, long);
  const lw = ink.lw * 0.8;
  for (const [panel, lapel, pocket] of [
    [c.l, c.lapelL, c.pocketL],
    [c.r, c.lapelR, c.pocketR],
  ]) {
    fillBodyPart(ctx, rig, panel, fill, shade, ink, sides);
    ctx.save();
    ctx.clip(panel);
    drawPart(ctx, pocket, fill, shade, ink, lw);
    drawPart(ctx, lapel, fill, shade, ink, lw);
    ctx.restore();
    strokeBodyPart(ctx, rig, panel, ink, sides);
  }
}

/** 袖子的颜色：穿外套时是外套的 */
function sleeveColors(rig: Rig): [string, string] {
  return items(rig).coat ? [K.coat, K.coatShade] : [K.sweater, K.sweaterShade];
}

const UPPER_A = angleOf(sub(REST.elbow, REST.shoulder));
/** 袖口翻边在前臂的局部坐标里（肘原点，+y 指向手腕）；它中间往下露出手臂 */
const CUFF_L = toLocal(CUFF, REST.elbow, HAND_A);
const CUFF_Y = (Math.min(...CUFF_L.map((p) => p[1])) + Math.max(...CUFF_L.map((p) => p[1]))) / 2;
/** 袖标、肩头铆钉在上臂的局部坐标里 */
const BAND_L = toLocal(BAND, REST.shoulder, UPPER_A);
const RIVET_L = toLocal([SHOULDER_RIVET.c], REST.shoulder, UPPER_A)[0];

/** 前臂填色：穿外套时袖口往下是光着的手臂（照拆件图，外套袖子卷到小臂中间） */
function forearmFill(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", lower: Path2D, ink: Ink) {
  const [base, shade] = sleeveColors(rig);
  fillShaded(ctx, lower, base, shade, ink);
  if (!items(rig).coat) return;
  const limb = rig.arms[side];
  const f = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  ctx.save();
  ctx.clip(lower);
  ctx.clip(polyPath([[-80, CUFF_Y], [80, CUFF_Y], [80, 200], [-80, 200]], ([x, y]) => f.p(x, y)));
  fillShaded(ctx, lower, K.skin, K.skinShade, ink);
  ctx.restore();
}

function drawCuff(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  if (!items(rig).coat) return;
  const limb = rig.arms[side];
  const sx = side === "L" ? 1 : -1;
  const f = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  drawPart(ctx, cubicPath(CUFF_L, ([x, y]) => f.p(x * sx, y)), K.coat, K.coatShade, ink, ink.lw * 0.8);
}

/** 袖标在她的左臂上：正面是画面右边那只（L）；朝右时整套镜像，她的左臂成了远的那只（R） */
function drawBand(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", upper: Path2D, ink: Ink) {
  if (!items(rig).band || side !== (rig.mir ? "R" : "L")) return;
  const limb = rig.arms[side];
  const sx = side === "L" ? 1 : -1;
  const f = new Frame(limb.root[0], limb.root[1], limb.a1);
  ctx.save();
  ctx.clip(upper);
  drawPart(ctx, cubicPath(BAND_L, ([x, y]) => f.p(x * sx, y)), K.band, K.bandShade, ink, ink.lw * 0.8);
  ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, [x, y]: V2, r: number, ink: Ink) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = K.rivet;
  ctx.fill();
  ctx.strokeStyle = K.line;
  ctx.lineWidth = ink.lw * 0.4;
  ctx.stroke();
}

function drawShoulderRivet(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  if (!items(rig).coat) return;
  const limb = rig.arms[side];
  const sx = side === "L" ? 1 : -1;
  const f = new Frame(limb.root[0], limb.root[1], limb.a1);
  drawDot(ctx, f.p(RIVET_L[0] * sx, RIVET_L[1]), SHOULDER_RIVET.r, ink);
}

/** 铁靴着地：鞋底和靴筒一圈（跪着时靴筒前面贴着地） */
export function bootSoles(rig: Rig, side: "L" | "R"): V2[] {
  const m = bootMap(rig, side);
  const anchors = (pts: V2[]) => pts.filter((_, i) => i % 3 === 0);
  return [...anchors(BOOT_L.sole), ...anchors(BOOT_L.body)].map(m);
}

/** 铁靴在脚踝的局部坐标里（画的是画面左边那只，另一只镜像，同光脚） */
const BOOT_L = {
  body: toLocal(BOOT.body, REST.ankleR, 0),
  sole: toLocal(BOOT.sole, REST.ankleR, 0),
  rim: toLocal(BOOT.rim, REST.ankleR, 0),
  brick: toLocal(BOOT.brick, REST.ankleR, 0),
  ropes: BOOT.ropes.map((r) => toLocal(r, REST.ankleR, 0)),
  rust: BOOT.rust.map((r) => toLocal(r, REST.ankleR, 0)),
  rivets: BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r })),
  frontRivet: { c: toLocal([BOOT.frontRivet.c], REST.ankleR, 0)[0], r: BOOT.frontRivet.r },
};
/** 靴口上沿最低的地方（局部 y）：上沿往上、靴筒轮廓以内是靴口里面 */
const BOOT_RIM_TOP = Math.max(...BOOT_L.rim.slice(0, 4).map((p) => p[1]));
/** 站着时（默认姿势）画面左边那条腿小腿的角度：线稿里的靴筒就是这个角度，弯腿时靴筒跟着小腿转 */
const SHIN_STAND = angleOf([-46.6 + BODY.hipW, -65.1 + 280.5]);

/** 铁靴的脚踝能弯的最大角度（弧度）：脚再勾、再绷，靴子整只跟着小腿转（跪着时鞋尖朝下抵着地） */
const BOOT_FLEX = 0.3;

/**
 * 靴子上的点放到现在的姿势上：往上（靴筒）跟着小腿，脚踝往下（鞋头、鞋底）跟着脚，中间平滑过渡；
 * 铁的靴子弯不了多少，脚相对小腿的角度按 BOOT_FLEX 软限制
 */
export function bootMap(rig: Rig, side: "L" | "R") {
  const limb = rig.legs[side];
  const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
  const shinA = limb.a2 - (side === "R" ? SHIN_STAND : -SHIN_STAND);
  const d = limb.tip.a - shinA;
  const bend = Math.atan2(Math.sin(d), Math.cos(d));
  const shin = new Frame(limb.end[0], limb.end[1], shinA);
  const foot = new Frame(limb.end[0], limb.end[1], shinA + BOOT_FLEX * Math.tanh(bend / BOOT_FLEX));
  return ([x, y]: V2): V2 => lerpV(foot.p(x * fx, y), shin.p(x * fx, y), smooth01(15, -25, y));
}

/** 铁靴：靴筒（锈斑、两道麻绳、正面一颗大铆钉）→ 插着的砖 → 靴口翻边一圈铆钉 → 鞋底 */
export function drawBoot(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  const m = bootMap(rig, side);
  const lw = ink.lw * 0.8;
  const body = cubicPath(BOOT_L.body, m);
  const rim = cubicPath(BOOT_L.rim, m);
  fillShaded(ctx, body, K.boot, K.bootShade, ink);
  ctx.save();
  ctx.clip(body);
  // 靴口里面：靴筒上沿和翻边上沿之间那一小条（后面那圈靴口的里侧）
  ctx.save();
  ctx.clip(outside(rim), "evenodd");
  ctx.fillStyle = K.bootInside;
  ctx.fill(polyPath([[-120, -300], [120, -300], [120, BOOT_RIM_TOP], [-120, BOOT_RIM_TOP]], m));
  ctx.restore();
  ctx.fillStyle = K.rust;
  for (const r of BOOT_L.rust) ctx.fill(cubicPath(r, m));
  ctx.lineCap = "round";
  for (const r of BOOT_L.ropes) {
    const rope = cubicPath(r, m, false);
    ctx.strokeStyle = K.line;
    ctx.lineWidth = ink.lw * 1.7;
    ctx.stroke(rope);
    ctx.strokeStyle = K.rope;
    ctx.lineWidth = ink.lw * 0.95;
    ctx.stroke(rope);
  }
  drawDot(ctx, m(BOOT_L.frontRivet.c), BOOT_L.frontRivet.r, ink);
  ctx.restore();
  ctx.strokeStyle = K.line;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.stroke(body);
  if ((items(rig).bricks ?? 0) >= (side === "R" ? 1 : 2)) drawPart(ctx, cubicPath(BOOT_L.brick, m), K.brick, K.brickShade, ink, lw);
  drawPart(ctx, rim, K.bootRim, K.bootShade, ink, lw);
  for (const d of BOOT_L.rivets) drawDot(ctx, m(d.c), d.r, ink);
  drawPart(ctx, cubicPath(BOOT_L.sole, m), K.sole, null, ink, lw);
}

/**
 * 手里拿着一块砖（给 DrawOptions.hold 用：hold: { L: holdBrick }）。按手形分两种拿法（用户 2026-10-18：原来砖压在整个手掌上、手指从砖底下伸出来，别扭）：
 * - 托着（flat，递砖）：砖平放在掌心那一侧，底边贴着手掌的边，大拇指扶在砖边上（画在手掌和大拇指之间）；
 * - 提着（其他手形）：砖横着挂在手底下，整块在手后面，手掌和手指压在砖的上半截，像握着上沿拎着。
 * 不给 info（老写法）时按托着画。
 */
export function holdBrick(ctx: CanvasRenderingContext2D, hand: Frame, _mir = false, info: HoldInfo = { layer: "front", shape: "flat", sx: 1 }) {
  const present = info.shape === "flat";
  if (present !== (info.layer === "front")) return;
  const ink: Ink = { line: K.line, lw: 3, shade: [3, 3] };
  const { sx } = info;
  if (present) drawBrickShape(ctx, hand.child(-9.5 * sx, 30, (-Math.PI / 2) * sx), 36, 27, ink);
  else drawBrickShape(ctx, hand.child(2.5 * sx, 56, 0), 36, 27, ink);
}


// ——— 秤砣的外观：基础模型上的各层 ———
export const CHENGTUO: Look = {
  colors: { top: K.sweater, topShade: K.sweaterShade, topSeam: K.sweaterSeam, bottom: K.tights, bottomShade: K.tightsShade },
  items: { ...CHENGTUO_ITEMS },
  sleeve: sleeveColors,
  hands: (rig) => (items(rig).gloves ? [K.glove, K.gloveShade] : null),
  shoulderOut: (pose) => (pose.items.coat ? COAT_SHOULDER_OUT : 0),
  // 穿外套的正面：上臂压在前襟上（照拆件图：袖子盖着前襟的边，袖标整个露出来）
  armsOver: (rig) => !!items(rig).coat,
  bodyPieces: coatPieces,
  backHair: drawBackHair,
  // 围脖：绕到脖子后面的半圈在脖子后面，前面的半圈压在脖子前面
  neckBack: (ctx, rig, ink) => {
    if (items(rig).scarf) drawScarfWrap(ctx, rig, ink, "back");
  },
  overTorso: (ctx, rig, ink, sides) => {
    if (items(rig).coat) drawCoat(ctx, rig, ink, sides);
  },
  neckFront: (ctx, rig, ink) => {
    if (items(rig).scarf) drawScarfWrap(ctx, rig, ink, "front");
  },
  frontHair: drawFrontHair,
  chest: (ctx, rig, ink) => {
    if (items(rig).scarf) drawScarfEnd(ctx, rig, ink);
  },
  forearm: forearmFill,
  onUpperArm: (ctx, rig, side, upper, ink) => {
    drawBand(ctx, rig, side, upper, ink);
    drawShoulderRivet(ctx, rig, side, ink);
  },
  onForearm: drawCuff,
  shoe: (rig) => !!items(rig).boots,
  // 铁靴着地：鞋底和靴筒一圈（跪着时靴筒前面贴着地）
  soles: bootSoles,
  overLeg: (ctx, rig, side, ink) => {
    if (items(rig).boots && (side === "L" ? rig.pose.legL : rig.pose.legR).boot) drawBoot(ctx, rig, side, ink);
  },
};

/** 秤砣的骨架（物品默认值、穿外套时的肩宽都按她算） */
export function rigOf(pIn: PoseIn | Pose): Rig {
  return figureRig(pIn, CHENGTUO);
}

/** 秤砣的关节在画面里的位置（已按朝向镜像），用来对齐道具、别的角色。 */
export function jointsOf(pIn: PoseIn | Pose) {
  return figureJoints(pIn, CHENGTUO);
}

/** 画秤砣：pose 是基础模型的姿势（物品在 pose.items，见 ChengtuoItems），opts 同 drawFigure（hold 手里拿的东西等） */
export function drawChengtuo(ctx: CanvasRenderingContext2D, pIn: PoseIn | Pose, opts: DrawOptions = {}) {
  drawFigure(ctx, pIn, CHENGTUO, opts);
}
