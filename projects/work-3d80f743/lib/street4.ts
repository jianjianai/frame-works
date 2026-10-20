// 三④「同时拯救我自己」（93.9–95.55；同 93.90 时 94.23 拯 94.47 救 94.71 我 94.92 自 95.16 己 95.31，照第二幕「顺便拯救我自己」的字距；
// 94.02、95.02 重拍）：不切。镜头从街上的三个人身上升起来、往后退，一路退到整座城（白压在画面上面），街一点点打开：
// 西边那个路口（前奏里她救周磊的地方），一个年轻人飘了起来——周磊伸手攥住他的脚踝，「救」把他拽回街上，蹲下把那块「活下去」放进他手里，
// 砖暖暖地亮起来；街的最西头，千斤家门口，一个老太太从窗口飘出来，千斤踮着脚把一块砖递给她，「己」砖也亮了。
// 她救过的人，在救别人：退到最后，一条街从千斤家门口（左）到她（右）都在画面里，路口和千斤家门口两点暖暖的光，头顶是白。
// 世界坐标（街面 y = 0），人都在人这一层（D = 1）。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { drawGlow } from "./world";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { drawWordBrick } from "./brick";
import { HOME, drawHomeFront, drawPost } from "./home";
import { MISS_T, WALK_T, herX, pullCam, stoneState } from "./street3";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const SPREAD_T = {
  start: 93.9,
  /** 路口：周磊伸手够、「救」攥住拽下来、蹲下给砖（砖亮起来） */
  reach: 94.56,
  grab: 94.74,
  down: 94.98,
  give: 95.16,
  /** 千斤家门口：老太太从窗口飘出来，千斤踮脚递砖（「己」砖亮起来） */
  lady: 94.6,
  qgive: 95.32,
  end: 95.55,
};
const S = SPREAD_T;

// ——— 路口：周磊和飘起来的年轻人 ———
const ZHOU = CAST.周磊;
const YOUNG = CAST.年轻人;
/** 路口（前奏里救周磊的地方） */
const CROSS_X = -160;
const YOUNG_P = {
  飘: pose(-6, { face: -0.6, ground: false, float: 0.12, ...legR(10, -22, -40), ...legL(-6, -16, -44), neck: 20, expression: "闭眼", sad: 0.8 }, (l) => ({
    ...armL(110, 34, 0, "relax", l),
    ...armR(96, 30, 0, "relax", l),
  })),
  惊: pose(-2, { face: -0.6, ground: false, float: 0.12, ...legR(16, -34, -30), ...legL(-4, -20, -40), neck: -16, expression: "惊", lookY: 1 }, (l) => ({
    ...armL(70, 50, 0, "open", l),
    ...armR(56, 40, 0, "open", l),
  })),
  坐: pose(4, { face: -0.6, ground: false, ...legR(132, -100, 0), ...legL(140, -110, 0), neck: -10, expression: "含泪", lookX: 0.4, lookY: 0.6 }, (l) => ({
    ...armL(30, 70, 0, "flat", l),
    ...armR(24, 76, 0, "flat", l),
  })),
};
const youngMove = live(
  [
    { t: 93.8, x: 0, p: YOUNG_P.飘 },
    { t: S.grab, p: YOUNG_P.飘 },
    { t: S.grab + 0.12, ease: "out", p: YOUNG_P.惊 },
    { t: S.down - 0.04, p: YOUNG_P.惊 },
    { t: S.down + 0.1, ease: "inOut", p: YOUNG_P.坐 },
    { t: 97, p: YOUNG_P.坐 },
  ] as MoveKey[],
  { look: lookOf(YOUNG), base: { wind: 0.6 }, idle: true, seed: 111, springs: ARMS, follow: 0 },
);
/** 年轻人的鞋底离地多高：一直往上飘，攥住以后被拽下来坐在街上 */
const youngLift = (t: number) => (t < S.grab ? 300 + 200 * (t - S.start) : (300 + 200 * (S.grab - S.start)) * (1 - E.in2(ph(t, S.grab, S.down))));
function youngAt(t: number) {
  const p: PoseIn = { ...youngMove(t).pose };
  const j = castJoints(YOUNG, p);
  const sole = Math.max(j.ankleL[1], j.ankleR[1]) + 26;
  const sitK = E.io(ph(t, S.down - 0.08, S.down + 0.06));
  let root: V2 = mix([CROSS_X + 8 * Math.sin(t * 1.3), -youngLift(t) - sole], [CROSS_X - 60, -45 - j.hip[1]], sitK);
  const low = Math.max(j.ankleL[1] + 26, j.ankleR[1] + 26, j.hip[1] + 40);
  if (root[1] + low > 0) root = [root[0], -low];
  return { pose: p, root, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]] as V2, lap: [root[0] + (j.hip[0] + j.kneeL[0]) / 2 + 10, root[1] + j.hip[1] - 30] as V2 };
}
const ZHOU_P = {
  /** 站在路口仰头看见他 */
  看: pose(0, { face: -0.6, ...legR(10, -8), ...legL(-8, -6), neck: 24, expression: "惊", lookY: -1 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(-6, 16, 0, "relax", l),
  })),
  /** 踮脚伸手够他的脚踝 */
  够: pose(-6, { face: -0.6, ...legR(6, -4, 22), ...legL(-8, -6, 26), neck: 30, expression: "使劲", lookY: -1 }, (l) => ({
    ...armL(170, 10, 0, "grip", l),
    ...armR(150, 20, 0, "open", l),
  })),
  /** 拽下来：身子往后坐 */
  拽: pose(-14, { face: -0.6, ...legR(24, -30), ...legL(-14, -26), neck: 10, expression: "使劲", teeth: 0.4, lookY: -0.4 }, (l) => ({
    ...armL(90, 40, 0, "grip", l),
    ...armR(70, 50, 0, "open", l),
  })),
  /** 单膝跪在他跟前，把砖放进他手里（和前奏里她给他砖一样） */
  给: pose(24, { face: -0.6, ...legR(88, -96), ...legL(-6, -124, -130), thighR: 0.65, neck: -8, expression: "微笑", lookX: -0.3, lookY: 0.5 }, (l) => ({
    ...armL(40, 30, 0, "flat", l),
    ...armR(10, 30, 0, "relax", l),
  })),
};
const zhouMove = live(
  [
    { t: 93.8, x: 0, p: ZHOU_P.看 },
    { t: S.reach - 0.1, p: ZHOU_P.看 },
    { t: S.grab, ease: "inOut", p: ZHOU_P.够 },
    { t: S.grab + 0.06, p: ZHOU_P.够 },
    { t: S.down, ease: "inOut", p: ZHOU_P.拽 },
    { t: S.give - 0.02, ease: "inOut", p: ZHOU_P.给 },
    { t: 97, p: ZHOU_P.给 },
  ] as MoveKey[],
  { look: lookOf(ZHOU), base: { wind: 0.6 }, idle: true, seed: 113, springs: ARMS, follow: 0 },
);
function zhouAt(t: number, y: ReturnType<typeof youngAt>) {
  const p: PoseIn = { ...zhouMove(t).pose };
  const root: V2 = [CROSS_X + 150, 0];
  const k = ZHOU.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / k, (q[1] - root[1]) / k];
  // 攥住他的脚踝，跟着他下来；放砖时手伸到他怀里
  const w = E.io(ph(t, S.reach, S.grab)) * (1 - E.io(ph(t, S.down, S.down + 0.1)));
  if (w > 0.001) p.armL = { ...(p.armL as object), to: loc([y.ankle[0] + 6, y.ankle[1] + 6]), ik: w } as PoseIn["armL"];
  const wg = E.io(ph(t, S.down + 0.04, S.give));
  if (wg > 0.001) p.armL = { ...(p.armL as object), to: loc([y.lap[0] + 30, y.lap[1]]), ik: wg } as PoseIn["armL"];
  const j = castJoints(ZHOU, p);
  return { pose: p, root, palm: [root[0] + j.palmL[0], root[1] + j.palmL[1]] as V2 };
}

// ——— 千斤家门口：千斤和从窗口飘出来的老太太 ———
const QJ = CAST.千斤;
const LADY = CAST.老太太;
/** 窗口（一楼门脸左边那扇窗）、千斤站在门口 */
const WIN: V2 = [(HOME.win0 + HOME.win1) / 2, HOME.winTop + 40];
const QJ_X = HOME.door0 + 30;
const LADY_P = {
  飘: pose(-4, { face: 0.5, ground: false, float: 0.15, ...legR(10, -20, -40), ...legL(-6, -16, -44), neck: 16, expression: "难过", sad: 0.8, lookY: -0.6 }, (l) => ({
    ...armL(90, 40, 0, "relax", l),
    ...armR(70, 40, 0, "relax", l),
  })),
  抱砖: pose(0, { face: 0.5, ground: false, float: 0.15, ...legR(10, -20, -40), ...legL(-6, -16, -44), neck: -12, expression: "含泪", smile: 0.4, lookX: 0.3, lookY: 0.5 }, (l) => ({
    ...armL(30, 100, 0, "flat", l),
    ...armR(24, 104, 0, "flat", l),
  })),
};
const ladyMove = live(
  [
    { t: 93.8, x: 0, p: LADY_P.飘 },
    { t: S.qgive, p: LADY_P.飘 },
    { t: S.qgive + 0.2, ease: "inOut", p: LADY_P.抱砖 },
    { t: 97, p: LADY_P.抱砖 },
  ] as MoveKey[],
  { look: lookOf(LADY), base: { wind: 0.6 }, idle: true, seed: 115, springs: ARMS, follow: 0 },
);
function ladyAt(t: number) {
  const p: PoseIn = { ...ladyMove(t).pose };
  const j = castJoints(LADY, p);
  // 从窗口里慢慢飘出来（先往外、再往上），拿到砖以后停住、慢慢往回落一点
  const out = E.out(ph(t, S.lady, S.qgive));
  const back = E.io(ph(t, S.qgive, S.qgive + 0.6));
  const chest: V2 = [WIN[0] + 60 * out, WIN[1] - 170 * out + 60 * back];
  const c = [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 30];
  const root: V2 = [chest[0] - c[0], chest[1] - c[1]];
  return { pose: p, root, chest, show: t >= S.lady };
}
const QJ_P = {
  看: pose(0, { face: -0.6, ...legR(8, -6), ...legL(-8, -6), neck: 24, expression: "担心", lookX: -0.4, lookY: -0.9 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(-6, 16, 0, "relax", l),
  })),
  递: pose(-6, { face: -0.6, ...legR(6, -4, 22), ...legL(-8, -6, 26), neck: 28, expression: "微笑", lookX: -0.4, lookY: -1 }, (l) => ({
    ...armL(160, 16, 0, "flat", l),
    ...armR(20, 20, 0, "relax", l),
  })),
};
const qjMove = live(
  [
    { t: 93.8, x: 0, p: QJ_P.看 },
    { t: S.qgive - 0.36, p: QJ_P.看 },
    { t: S.qgive - 0.04, ease: "inOut", p: QJ_P.递 },
    { t: S.qgive + 0.2, p: QJ_P.递 },
    { t: S.qgive + 0.5, ease: "inOut", p: { ...QJ_P.看, expression: "微笑" } },
    { t: 97, p: { ...QJ_P.看, expression: "微笑" } },
  ] as MoveKey[],
  { look: lookOf(QJ), base: { wind: 0.6 }, idle: true, seed: 117, springs: ARMS, follow: 0 },
);
function qjAt(t: number, lady: ReturnType<typeof ladyAt>) {
  const p: PoseIn = { ...qjMove(t).pose };
  const root: V2 = [QJ_X, 0];
  const k = QJ.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / k, (q[1] - root[1]) / k];
  const w = E.io(ph(t, S.qgive - 0.3, S.qgive)) * (1 - E.io(ph(t, S.qgive + 0.15, S.qgive + 0.4)));
  if (w > 0.001) p.armL = { ...(p.armL as object), to: loc([lady.chest[0] + 30, lady.chest[1] + 40]), ik: w } as PoseIn["armL"];
  const j = castJoints(QJ, p);
  return { pose: p, root, palm: [root[0] + j.palmL[0], root[1] + j.palmL[1]] as V2 };
}

/** 一块砖、亮起来的暖光（砖越小越要靠光看出来） */
function brick(g: CanvasRenderingContext2D, at: V2, warm: number, z: number) {
  drawWordBrick(g, at[0], at[1], "活下去", 0, warm, 3 / Math.sqrt(Math.max(0.3, z)));
  // 光晕在画面上至少 60 像素（退远了也看得见）
  if (warm > 0.01) drawGlow(g, at[0], at[1], Math.max(120 + 140 * warm, (56 * warm) / z), 0.55 * warm);
}

/** 画④的路口和千斤家门口（人这一层，世界坐标）；她那边的三个人照旧由 street3 画 */
export function drawSpread(g: CanvasRenderingContext2D, t: number, z: number, view: { x0: number; x1: number }) {
  if (view.x0 < CROSS_X + 400 && view.x1 > CROSS_X - 400) {
    const y = youngAt(t);
    const zh = zhouAt(t, y);
    drawPerson(g, YOUNG, y.pose, y.root[0], y.root[1], z);
    drawPerson(g, ZHOU, zh.pose, zh.root[0], zh.root[1], z);
    // 周磊的砖：蹲下来时拿在手里，放进他怀里以后亮起来
    if (t >= S.down) {
      const at = t < S.give ? zh.palm : y.lap;
      brick(g, at, E.out(ph(t, S.give, S.give + 0.25)), z);
    }
  }
  if (view.x0 < HOME.post + 300 && view.x1 > HOME.win0 - 300) {
    drawHomeFront(g, t);
    drawPost(g);
    const l = ladyAt(t);
    const q = qjAt(t, l);
    if (l.show) drawPerson(g, LADY, l.pose, l.root[0], l.root[1], z);
    drawPerson(g, QJ, q.pose, q.root[0], q.root[1], z);
    const warm = E.out(ph(t, S.qgive, S.qgive + 0.25));
    const at = t < S.qgive ? q.palm : [l.chest[0], l.chest[1] + 70] as V2;
    if (t > S.qgive - 0.32) brick(g, at, warm, z);
  }
}

/**
 * ④的镜头：从③落地的取景（街上的三个人）柔和起步、一路减速（E.settle）往后退、往上升、往西挪，退到整座城：
 * 白压在画面上面，街在画面下边，一条街从千斤家（左）到她（右）都在画面里。退的时候先看见路口（周磊），最后看见千斤家门口
 */
export function spreadCam(t: number): Cam {
  const c0 = pullCam(S.start);
  const wide = aim(-740, -5000, 540, 960, 0.122);
  return camLerp(c0, wide, E.settle(ph(t, S.start + 0.05, S.end - 0.05)));
}

/**
 * ⑤的镜头：从④的整座城一下扎回她们身上（越扎越快，pow 2.2），96.02 副歌二进来那一拍落定、冲过一点（4%）再收回来；
 * 之后跟着往西走的她（她在画面偏右，前面留空，跟在后面的小石头也在画面里），她的铁靴每「咚」一下镜头往下一沉
 */
export function walkCam(t: number): Cam {
  const W = WALK_T;
  const over = 1 + 0.04 * (t < W.step0 ? 1 : 1 - E.out(ph(t, W.step0, W.step0 + 0.35)));
  const track = (tt: number): Cam => {
    const c = aim(herX(tt) - 40, -330, 620, 960, 1.45);
    return { ...c, z: c.z * over };
  };
  let c = track(t);
  if (t < W.step0) c = camLerp(spreadCam(W.dive), track(t), Math.pow(ph(t, W.dive, W.step0), 2.2));
  // ⑥ 他停下、飘起来：镜头不再跟着她，挪到两个人中间，跟着他往上抬一点；她牵住他往下一拽「咚」一震，之后慢慢凑近牵着的两只手
  const M = MISS_T;
  if (t > M.look - 0.1) {
    const two = (tt: number): Cam => {
      const st = stoneState(tt);
      return aim((herX(tt) + st.x) / 2 + 30, -340 - 0.6 * st.lift, 540, 960, 1.45);
    };
    c = camLerp(c, two(t), E.io(ph(t, M.look - 0.1, M.lift + 0.25)));
    const push = E.io(ph(t, M.land, M.end + 0.5));
    if (push > 0) c = { ...c, z: c.z * (1 + 0.08 * push) };
  }
  let dip = 0;
  for (let i = 0; i < 6; i++) dip += kick(t, W.step0 + i * 0.500042, 0.09);
  const land = kick(t, M.land, 0.1);
  return { ...c, z: c.z * (1 + 0.02 * land), y: c.y - (5 * dip + 6 * land * Math.sin((t - M.land) * 50)) / c.z };
}
