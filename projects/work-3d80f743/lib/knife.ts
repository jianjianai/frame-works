// 副歌一④「但别再把小刀带在身上」（49.98–51.93；但 49.98 别 50.19 再 50.34 把 50.49 小 50.67 刀 50.85 带 51.06 在 51.33 身 51.45 上 51.66；
// 小节线 50.017）。接着③（同一个镜头）：「但」沉沉一把抓住小石头的脚踝往下拽，小石头的手从妈妈脚踝上滑下来、攥住了红绳——
// 三个人连在一根红绳上，还在往上飘，连沉沉的铁靴也离了地。镜头推到妈妈的手上：她哭着笑，「小刀」从口袋里拿出一把小折刀，
// 「带」割断缠在自己手腕上的红绳；镜头顺着掉下去的红绳甩下来，沉沉抱着小石头掉回街上，51.33 铁靴「咚」；刀掉在他们脚边。
// 妈妈一个人往上飘走（下一镜）。

import { CAST, type CastSpec, castJoints } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { INK } from "./world";
import { live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { MOM, MOM_X, pose } from "./dawn";
import { CHEN3_KEYS, CHEN3_OPTS, COAT_T, MOM3, MOM3_KEYS, MOM3_OPTS, STONE3, STONE3_KEYS, STONE3_OPTS, chenRoot, coatAt, momRoot } from "./coat";

type V2 = [number, number];
const mix = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

export const KNIFE_T = {
  start: COAT_T.end,
  /** 「但」沉沉抓住他的脚踝（小节线） */
  grab: beatAt(100),
  /** 往下拽：他的手从妈妈脚踝上滑到红绳上 */
  pull: 50.12,
  slip: 50.32,
  /** 沉沉的铁靴离了地 */
  boots: 50.5,
  /** 镜头推到妈妈的手上 */
  push0: 50.5,
  push1: 50.82,
  /** 「小刀」掏出小刀、伸到手腕上 */
  knife0: 50.62,
  knife1: 50.9,
  /** 「带」割断 */
  cut: 51.06,
  /** 镜头顺着掉下去的红绳甩下来，「在」铁靴落地 */
  whip0: 51.1,
  land: 51.33,
  /** 刀掉在街上 */
  clink: 51.52,
  end: 51.93,
};

const MOM_BARE: CastSpec = { ...MOM, coat: undefined };
const STONE_COAT = CAST.小石头穿妈妈的外套;

// ——— 姿势 ———
export const MOM4 = {
  /** 被拽着：远处的手攥着红绳垂在腰前，近处的手张着保持平衡，低头看着他们哭着笑 */
  被拽: pose(4, { face: -0.2, ground: false, ...legR(20, -40, -40), ...legL(-2, -10, -44), neck: -24, expression: "哭着笑", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(-20, 30, 0, "open", l),
    ...armR(20, 20, 0, "grip", l),
  })),
  /** 割绳：近处那只手拿着刀伸到远处那只手腕上 */
  割: pose(8, { face: -0.2, ground: false, ...legR(20, -40, -40), ...legL(-2, -12, -44), neck: -20, expression: "哭着笑", lookX: 0.1, lookY: 0.9 }, (l) => ({
    ...armL(30, 60, 0, "grip", l),
    ...armR(20, 30, 0, "grip", l),
  })),
  /** 割断了：两只手张开，往上飘走，低头看着他们 */
  张手: pose(-4, { face: -0.2, ground: false, float: 0.2, rot: -4, ...legR(10, -30, -50), ...legL(-6, -20, -54), neck: -30, expression: "哭着笑", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(-60, 20, 0, "open", l),
    ...armR(70, 20, 0, "open", l),
  })),
};
const STONE4 = {
  /** 攥着红绳：两只手举过头顶攥着（IK），被拴着的那条腿被沉沉往下拽，仰头看着妈妈哭 */
  攥绳: pose(0, { face: 0.6, ground: false, float: 0, rot: 0, ...legL(-6, -4, -40), ...legR(24, -40, -36), neck: 26, expression: "忍着哭", lookX: -0.2, lookY: -0.9 }, (l) => ({
    ...armL(165, 24, 0, "grip", l),
    ...armR(170, 20, 0, "grip", l),
  })),
  /** ⑥ 埋进沉沉怀里哭：两只手攥着她，头低下去，闭着眼 */
  埋头: pose(14, { face: 0.6, ground: false, float: 0, rot: 0, ...legL(64, -84, -20), ...legR(74, -92, -20), neck: -22, expression: "忍着哭", blink: 1, lookY: 0.6 }, (l) => ({
    ...armL(70, 110, 0, "grip", l),
    ...armR(80, 104, 0, "grip", l),
  })),
  /** 在沉沉怀里：腿蜷着，近处的手搂着她，远处的手伸向天上的妈妈 */
  伸手: pose(-6, { face: 0.6, ground: false, float: 0, rot: 0, ...legL(60, -80, -20), ...legR(70, -90, -20), neck: 34, expression: "忍着哭", lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(40, 70, 0, "relax", l),
    ...armR(165, 14, 0, "open", l),
  })),
};
const CHEN4 = {
  /** 抓住他的脚踝：两只手往前上方伸（IK），前脚扎住、后脚撑着 */
  抓: pose(10, { face: 1, ground: false, ...legR(30, -16, 0), ...legL(-24, -30, 0), neck: 18, expression: "使劲", teeth: 0.4, lookX: -0.3, lookY: -0.6 }, (l) => ({
    ...armL(110, 30, 0, "grip", l),
    ...armR(120, 24, 0, "grip", l),
  })),
  /** 往下拽：身子往后坐，两腿蹬开 */
  拽: pose(-20, { face: 1, ground: false, ...legR(40, -12, 0), ...legL(-30, -40, 0), neck: 14, expression: "使劲", teeth: 0.7, lookX: -0.3, lookY: -0.7 }, (l) => ({
    ...armL(130, 20, 0, "grip", l),
    ...armR(136, 16, 0, "grip", l),
  })),
  /** 铁靴离了地：两条腿悬着，一惊，低头看自己的脚 */
  离地: pose(-4, { face: 1, ground: false, ...legR(16, -30, -30), ...legL(-8, -40, -40), neck: -10, expression: "吓一跳", lookX: -0.2, lookY: 0.7 }, (l) => ({
    ...armL(150, 14, 0, "grip", l),
    ...armR(156, 10, 0, "grip", l),
  })),
  /** ⑥ 紧紧抱住他：身子弯下来护着他，低头贴着他的头，闭着眼 */
  抱紧: pose(26, { face: 1, ground: false, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: -18, expression: "难过", blink: 0.9, lookY: 0.6 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
  /** 落地接住：膝盖一弯蹲下去，两只手搂住他（IK），仰头看着天上 */
  接住: pose(12, { face: 1, ground: false, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: 42, expression: "难过", lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
};

const T = KNIFE_T;
/** ④妈妈的关键帧（⑤接着往后加） */
export const MOM4_KEYS: MoveKey[] = [
  ...MOM3_KEYS,
  { t: T.grab, p: MOM3.低头看他 },
  { t: T.slip, ease: "inOut", p: MOM4.被拽 },
  { t: T.knife0, p: MOM4.被拽 },
  { t: T.knife1, ease: "inOut", p: MOM4.割 },
  { t: T.cut + 0.02, p: MOM4.割 },
  { t: T.cut + 0.3, ease: "out", p: MOM4.张手 },
];
const momMove4 = live([...MOM4_KEYS, { t: 54, p: MOM4.张手 }], MOM3_OPTS);
const stoneMove4 = live(
  [
    ...STONE3_KEYS,
    { t: T.pull, p: STONE3.抱脚踝 },
    { t: T.slip, ease: "inOut", p: STONE4.攥绳 },
    { t: T.cut, p: STONE4.攥绳 },
    { t: T.land, ease: "out", p: STONE4.伸手 },
    // ⑥ 天上那一下亮光以后：埋进沉沉怀里哭
    { t: 54.25, p: STONE4.伸手 },
    { t: 54.7, ease: "inOut", p: STONE4.埋头 },
    { t: 73, p: STONE4.埋头 },
  ] as MoveKey[],
  STONE3_OPTS,
);
const chenMove4 = live(
  [
    ...CHEN3_KEYS,
    { t: T.grab - 0.06, ease: "out", p: CHEN4.抓 },
    { t: T.pull, p: CHEN4.抓 },
    { t: T.slip, ease: "inOut", p: CHEN4.拽 },
    { t: T.boots - 0.04, p: CHEN4.拽 },
    { t: T.boots + 0.16, ease: "out", p: CHEN4.离地 },
    { t: T.cut, p: CHEN4.离地 },
    { t: T.land + 0.04, ease: "out", squash: 0.08, p: CHEN4.接住 },
    { t: T.land + 0.2, ease: "out", squash: 0, p: CHEN4.接住 },
    // ⑥ 紧紧抱住他：低下头贴着他的头，闭着眼
    { t: 54.3, p: CHEN4.接住 },
    { t: 54.85, ease: "inOut", p: CHEN4.抱紧 },
    // 间奏接回现在：抱着小石头抬起头看着天（和七岁时仰头看妈妈一样）
    { t: 71.0, p: CHEN4.抱紧 },
    { t: 71.45, ease: "inOut", p: { ...CHEN4.接住, expression: "难过", tears: 0.8, lookX: 0.1, lookY: -1 } },
    { t: 73, p: { ...CHEN4.接住, expression: "难过", tears: 0.8, lookX: 0.1, lookY: -1 } },
  ] as MoveKey[],
  CHEN3_OPTS,
);

// ——— 位置 ———
/** 靴底离根多高（站着的姿势按它把靴底放到街面上） */
function soleOf(p: PoseIn) {
  const j = jointsOf(p);
  return Math.max(j.ankleL[1], j.ankleR[1]) + 46;
}
/** 妈妈的根：被拽住一下往下一顿，三个人一起被她带着往上（割断以前升约 330）；割断以后越飘越快 */
export function momRoot4(t: number): V2 {
  const base = momRoot(t);
  const dip = 34 * E.out(ph(t, T.grab, T.grab + 0.12)) * (1 - ph(t, T.grab + 0.12, T.slip + 0.1));
  const up = 330 * E.io(ph(t, T.slip, T.cut));
  const tau = Math.max(0, t - T.cut);
  return [base[0], base[1] + dip - up - (320 * tau + 760 * tau * tau)];
}

/** 妈妈这一刻：远处那只手攥着红绳那头（被拽到腰前），近处那只手掏刀、伸到手腕上割；割断以后两只手张开、往上飘走 */
function momAt4(t: number) {
  const mRoot = momRoot4(t);
  const mk = MOM.scale;
  const mp: PoseIn = { ...momMove4(t).pose };
  const m0 = castJoints(MOM_BARE, mp);
  const mAt = (p: V2): V2 => [mRoot[0] + p[0], mRoot[1] + p[1]];
  const mLoc = (p: V2): V2 => [(p[0] - mRoot[0]) / mk, (p[1] - mRoot[1]) / mk];
  const w = E.io(ph(t, T.grab, T.slip)) * (1 - E.io(ph(t, T.cut + 0.05, T.cut + 0.3)));
  const ropeHand: V2 = mix(mAt(m0.palmR as V2), [mRoot[0] - 40, mRoot[1] - 300], E.io(ph(t, T.grab, T.slip)));
  if (w > 0.001) mp.armR = { ...(mp.armR as object), to: mLoc(ropeHand), ik: w } as PoseIn["armR"];
  const pocket: V2 = [mRoot[0] + 34, mRoot[1] - 250];
  const wrist: V2 = [ropeHand[0] + 14, ropeHand[1] - 26];
  const kp = mix(pocket, wrist, E.io(ph(t, T.knife0 + 0.08, T.knife1)));
  const sl = E.out(ph(t, T.cut - 0.04, T.cut + 0.04));
  const slice: V2 = [kp[0] - 34 * sl, kp[1] + 10 * sl];
  const kIk = E.io(ph(t, T.knife0 - 0.04, T.knife0 + 0.08)) * (1 - E.io(ph(t, T.cut + 0.06, T.cut + 0.3)));
  if (kIk > 0.001) mp.armL = { ...(mp.armL as object), to: mLoc(slice), ik: kIk } as PoseIn["armL"];
  const mj = castJoints(MOM_BARE, mp);
  return { pose: mp, root: mRoot, palmL: mAt(mj.palmL as V2), palmR: mAt(mj.palmR as V2), ropeHand };
}

/** 割断以前连在一起的那一串：他攥着红绳（她手下面约 370）、身子吊在下面，沉沉攥着他的脚踝（够不着地就被带起来） */
function chainAt(t: number) {
  const m = momAt4(t);
  const c3 = coatAt(Math.min(t, T.grab));
  const sp: PoseIn = { ...stoneMove4(t).pose };
  const sk = STONE_COAT.scale;
  const sj = castJoints(STONE_COAT, sp);
  const ropeGrip: V2 = [m.palmR[0] - 6, m.palmR[1] + 370];
  const hipHang: V2 = [ropeGrip[0] + 8, ropeGrip[1] + 196];
  const c3j = castJoints(STONE_COAT, c3.stone.pose);
  const hip3: V2 = [c3.stone.root[0] + c3j.hip[0], c3.stone.root[1] + c3j.hip[1]];
  const hip = mix(hip3, hipHang, E.io(ph(t, T.pull, T.slip)));
  const sRoot: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
  const sloc = (p: V2): V2 => [-(p[0] - sRoot[0]) / sk, (p[1] - sRoot[1]) / sk];
  const grip = E.io(ph(t, T.pull + 0.04, T.slip));
  if (grip > 0.001) {
    sp.armL = { ...(sp.armL as object), to: sloc([ropeGrip[0] + 6, ropeGrip[1] + 20]), ik: grip } as PoseIn["armL"];
    sp.armR = { ...(sp.armR as object), to: sloc([ropeGrip[0] - 4, ropeGrip[1] - 10]), ik: grip } as PoseIn["armR"];
  }
  const sjNow = castJoints(STONE_COAT, sp);
  const ankle: V2 = [sRoot[0] + sjNow.ankleL[0], sRoot[1] + sjNow.ankleL[1]];
  const cp: PoseIn = { ...chenMove4(t).pose };
  const cj = jointsOf(cp);
  // 站着时铁靴底踩在街面上（按这个姿势算根）；手攥的地方够不着就被带起来
  const stand = -soleOf(cp);
  const handUp = -(cj.shoulderL[1] + cj.shoulderR[1]) / 2 + 90;
  const cx = t < T.grab ? chenRoot(t)[0] : chenRoot(T.grab)[0] + 10 * E.out(ph(t, T.grab, T.grab + 0.2));
  const cy = t >= T.grab ? Math.min(stand, ankle[1] + handUp) : t >= T.start ? stand * E.io(ph(t, T.start, T.grab)) : 0;
  return { m, sp, sRoot, ankle, ropeGrip, hip, cp, chen: [cx, cy] as V2 };
}

/** 这一刻的三个人（世界坐标），手都按 IK 攥在该攥的地方 */
export function knifeAt(t: number) {
  const m = momAt4(t);
  if (t < T.cut) {
    const c = chainAt(t);
    const cLoc = (p: V2): V2 => [-(p[0] - c.chen[0]), p[1] - c.chen[1]];
    const hold = E.io(ph(t, T.grab - 0.08, T.grab));
    if (hold > 0.001) {
      c.cp.armL = { ...(c.cp.armL as object), to: cLoc([c.ankle[0] - 4, c.ankle[1] + 8]), ik: hold } as PoseIn["armL"];
      c.cp.armR = { ...(c.cp.armR as object), to: cLoc([c.ankle[0] + 6, c.ankle[1] - 6]), ik: hold } as PoseIn["armR"];
    }
    return { mom: m, stone: { pose: c.sp, root: c.sRoot, ankle: c.ankle, ropeGrip: c.ropeGrip }, chen: { pose: c.cp, root: c.chen } };
  }
  // 割断以后：两个人从割断那一刻的地方一起掉下来（她先着地），他落进她怀里
  const cut = chainAt(T.cut - 1e-4);
  const fall = ph(t, T.cut, T.land);
  const cp: PoseIn = { ...chenMove4(t).pose };
  // 落到街上：落地那一刻铁靴底正好踩在街面上（按落地的姿势算），之后跟着姿势蹲下去
  const stand = -soleOf(cp);
  const drop = stand - cut.chen[1];
  const chen: V2 = [cut.chen[0], cut.chen[1] + drop * fall * fall];
  const sp: PoseIn = { ...stoneMove4(t).pose };
  const sj = castJoints(STONE_COAT, sp);
  const chest: V2 = [chen[0] + 64, chen[1] - 320];
  const fallHip: V2 = [cut.hip[0], cut.hip[1] + Math.max(0, drop) * fall * fall + 40 * fall];
  const hip = mix(fallHip, [chest[0] + 30, chest[1] + 70], E.io(ph(t, T.cut + 0.06, T.land + 0.08)));
  const sRoot: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
  const sjNow = castJoints(STONE_COAT, sp);
  const ankle: V2 = [sRoot[0] + sjNow.ankleL[0], sRoot[1] + sjNow.ankleL[1]];
  // 沉沉：先松开他的脚踝（掉下来时两只手还在他身上），落地时搂住他
  const cLoc = (p: V2): V2 => [-(p[0] - chen[0]), p[1] - chen[1]];
  const sh: V2 = [sRoot[0] + (sjNow.shoulderL[0] + sjNow.shoulderR[0]) / 2, sRoot[1] + (sjNow.shoulderL[1] + sjNow.shoulderR[1]) / 2 + 70];
  const hug = E.io(ph(t, T.cut + 0.02, T.land));
  cp.armL = { ...(cp.armL as object), to: cLoc(mix([ankle[0] - 4, ankle[1] + 8], [sh[0] + 30, sh[1] + 10], hug)), ik: 1 } as PoseIn["armL"];
  cp.armR = { ...(cp.armR as object), to: cLoc(mix([ankle[0] + 6, ankle[1] - 6], [sh[0] - 20, sh[1] + 34], hug)), ik: 1 } as PoseIn["armR"];
  return { mom: m, stone: { pose: sp, root: sRoot, ankle, ropeGrip: cut.ropeGrip }, chen: { pose: cp, root: chen } };
}

/** 那把小折刀：木柄、一截亮的刀刃（在她手心里；割断以后脱手，翻着掉到街上） */
export function drawKnife(g: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.lineJoin = "round";
  g.fillStyle = "#8a5a3c";
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  g.beginPath();
  g.roundRect(-30, -6, 34, 12, 4);
  g.fill();
  g.stroke();
  g.fillStyle = "#e9edf2";
  g.beginPath();
  g.moveTo(4, -5);
  g.lineTo(38, -2);
  g.lineTo(44, 2);
  g.lineTo(4, 5);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

/** 画④的三个人、红绳、刀（人这一层，世界坐标） */
export function drawKnife4(g: CanvasRenderingContext2D, t: number, z: number, withMom = true) {
  const k = knifeAt(t);
  if (withMom) drawPerson(g, MOM_BARE, k.mom.pose, k.mom.root[0], k.mom.root[1], z);
  // 红绳：割断以前从她远处那只手到他攥着的地方、再到他脚踝（拴着）；割断以后上面那截跟着她走，下面那截落下来
  const g0 = k.stone.ropeGrip;
  const path = new Path2D();
  if (t < T.cut) {
    path.moveTo(k.mom.palmR[0], k.mom.palmR[1]);
    path.lineTo(g0[0], g0[1]);
    path.quadraticCurveTo(g0[0] + 40, (g0[1] + k.stone.ankle[1]) / 2 + 30, k.stone.ankle[0], k.stone.ankle[1]);
  } else {
    // 下面那截：还拴在他脚踝上，断头松下来甩在旁边
    const u = E.out(ph(t, T.cut, T.cut + 0.35));
    const A = k.stone.ankle;
    const end: V2 = mix([g0[0], g0[1] + (A[1] - (g0[1] + 560))], [A[0] - 70, A[1] + 150], u);
    path.moveTo(end[0], end[1]);
    path.quadraticCurveTo((end[0] + A[0]) / 2 - 40, (end[1] + A[1]) / 2 + 30, A[0], A[1]);
    // 她手腕上剩的一小截（⑤以后跟着她画）
    if (withMom) {
      path.moveTo(k.mom.palmR[0], k.mom.palmR[1]);
      path.lineTo(k.mom.palmR[0] + 6, k.mom.palmR[1] + 50);
    }
  }
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5;
  g.stroke(path);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke(path);
  g.restore();
  // 他画在沉沉的身子和她近处那只手臂之间：攥他脚踝、搂着他的手在他前面
  const wm = g.getTransform();
  g.save();
  g.translate(k.chen.root[0], k.chen.root[1]);
  drawChengtuo(g, k.chen.pose, {
    line: 1 / Math.sqrt(Math.max(0.3, z)),
    beforeFrontArms: (cc) => {
      cc.save();
      cc.setTransform(wm);
      drawPerson(cc, STONE_COAT, k.stone.pose, k.stone.root[0], k.stone.root[1], z);
      cc.restore();
    },
  });
  g.restore();
  // 刀：掏出来以后在她近处那只手里；割断后 0.06 秒脱手，翻着掉到街上
  if (t >= T.knife0 + 0.06) {
    const drop = T.cut + 0.08;
    if (t < drop) drawKnife(g, k.mom.palmL[0] - 6, k.mom.palmL[1] + 4, -0.3);
    else {
      const p0 = knifeAt(drop).mom.palmL;
      const u = ph(t, drop, T.clink);
      const x = p0[0] + 40 * u;
      const y = u < 1 ? p0[1] + (-6 - p0[1]) * u * u : -6;
      drawKnife(g, x, y, -0.3 + (u < 1 ? 9 * u : 9 + 0.3 * Math.sin(Math.min(1, (t - T.clink) / 0.2) * Math.PI)));
    }
    // 割断那一下刀刃一闪
    const f = Math.exp(-Math.abs(t - T.cut) / 0.04);
    if (f > 0.05) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.fillStyle = `rgba(255,250,230,${0.8 * f})`;
      g.beginPath();
      g.ellipse(k.mom.palmL[0] + 20, k.mom.palmL[1], 46 * f, 7 * f, -0.4, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
}

// ——— 镜头 ———
/**
 * ④的镜头（以③的镜头为底）：先跟着三个人（被她带着往上）；「小刀」推到她的手上（刀、缠在手腕上的红绳，她的脸在上面）；
 * 割断以后停一拍，顺着掉下去的红绳往下甩到街上（0.23 秒，竖着拖影），「在」铁靴落地一震；之后跟着他们仰头，镜头往上抬一点
 */
export function knifeCam(t: number, base: (t: number) => Cam): Cam {
  if (t <= T.start) return base(t);
  let c = base(t);
  const k = knifeAt(Math.min(t, T.cut));
  // 三个人：她的头到沉沉的脚
  const top = k.mom.root[1] - 600;
  c = camLerp(c, aim(-2390, (top + 0) / 2, 540, 960, 0.86), E.io(ph(t, T.start, T.slip)));
  // 推到她的手上（刀、手腕上的红绳）
  const hand = k.mom.ropeHand;
  c = camLerp(c, aim(hand[0] + 10, hand[1] - 40, 540, 880, 1.5), E.io(ph(t, T.push0, T.push1)));
  // 甩下来：落在街上抱着他的沉沉
  if (t > T.whip0) {
    const kk = knifeAt(T.land + 0.2);
    c = camLerp(c, aim(kk.chen.root[0] + 70, -380, 540, 1140, 1.5), E.io(ph(t, T.whip0, T.land)));
  }
  // 落地一震；之后跟着他们仰头往上抬一点
  const up = E.io(ph(t, T.land + 0.12, T.end + 0.5));
  return { ...c, y: c.y - 220 * up, z: c.z * (1 + 0.035 * kick(t, T.land, 0.1)) };
}
export const knifeShake = (t: number) => 12 * kick(t, KNIFE_T.land, 0.07) + 4 * kick(t, KNIFE_T.cut, 0.05);
