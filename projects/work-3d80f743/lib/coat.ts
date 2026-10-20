// 副歌一③「在这个世界难免会迷茫」（47.92–49.98；在 47.94 这 48.06 个 48.24 世 48.30 界 48.36 难 48.42 免 48.48 会 48.75 迷 48.90 茫 49.11，
// 「茫」拖到 49.9；小节线 48.02、50.02）。接着②（同一个镜头）：母子俩一起被带着往上飘。妈妈顺着红绳两把把自己拽到儿子跟前，
// 脱下自己的橘色外套（下摆缝了一圈铅）裹在他身上——他一下有了分量，往下一沉，「茫」抱住了妈妈的脚踝，把她往下坠了一下；
// 妈妈低头看着他，哭着笑。沉沉从最高那栋楼那边冲过来（下一镜抓住小石头的脚踝）。

import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, camLerp, ph } from "./cam";
import { INK, part } from "./world";
import { ARMS, LIMP, SMOOTH, live } from "./motion";
import { CHEN, armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { DAWN_T, MOM, MOM_POSES, MOM_X, STONE, STONE_POSES, momLift, pose, streetAt } from "./dawn";

type V2 = [number, number];
const mix = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

export const COAT_T = {
  start: DAWN_T.end,
  /** 两把拽红绳（「这」「世」） */
  pull1: 48.06,
  pull2: 48.3,
  /** 拽到他跟前 */
  meet: 48.45,
  /** 外套从她身上脱下来、裹到他身上 */
  off: 48.55,
  wrap: 48.98,
  /** 「茫」他一沉，抱住她的脚踝 */
  grab: 49.11,
  /** 沉沉冲过来 */
  chen0: 49.3,
  end: 49.98,
};

/** 她脱了外套、他穿上她的外套 */
const MOM_BARE: CastSpec = { ...MOM, coat: undefined };
const STONE_COAT = CAST.小石头穿妈妈的外套;

export const MOM3 = {
  /** 把外套从肩膀上褪下来：两只手抓着领子往后、往下 */
  脱外套: pose(4, { face: -0.2, ground: false, ...legR(14, -30, -40), ...legL(-4, -20, -50), neck: -6, expression: "坚定", sad: 0.6, lookX: 0.2, lookY: 0.5 }, (l) => ({
    ...armL(-30, 130, 0, "grip", l),
    ...armR(-24, 126, 0, "grip", l),
  })),
  /** 把外套裹到他身上：两只手绕到他肩膀上 */
  裹: pose(10, { face: -0.2, ground: false, ...legR(16, -34, -40), ...legL(-4, -22, -50), neck: -14, expression: "含泪", lookX: 0.2, lookY: 0.7 }, (l) => ({
    ...armL(40, 60, 0, "grip", l),
    ...armR(46, 56, 0, "grip", l),
  })),
  /** 他抱着她的脚踝：远处的手还攥着红绳那头举着，近处的手往下伸向他，低头看着他哭着笑 */
  低头看他: pose(6, { face: -0.2, ground: false, ...legR(26, -46, -40), ...legL(0, -4, -40), neck: -26, expression: "哭着笑", lookX: 0.15, lookY: 1 }, (l) => ({
    ...armL(-6, 40, 0, "open", l),
    ...armR(150, 24, 0, "grip", l),
  })),
};
export const STONE3 = {
  /** 被拽下来：手伸向妈妈，看着她 */
  被拉下来: pose(4, { face: 0.6, ground: false, float: 0.1, rot: 0, ...legL(-4, -30, -40), ...legR(10, -24, -36), neck: -6, expression: "担心", lookX: -0.3, lookY: 0.5 }, (l) => ({
    ...armL(70, 40, 0, "open", l),
    ...armR(84, 30, 0, "open", l),
  })),
  /** 在妈妈怀里：手收在胸前，仰头看她 */
  被抱着: pose(0, { face: 0.6, ground: false, float: 0, rot: 0, ...legL(-2, -20, -40), ...legR(6, -16, -36), neck: 16, expression: "难过", lookX: -0.4, lookY: -0.7 }, (l) => ({
    ...armL(30, 110, 0, "relax", l),
    ...armR(36, 104, 0, "relax", l),
  })),
  /** 抱着妈妈的脚踝：两只手举过头顶环着她的脚踝（IK），腿垂着，仰着头哭 */
  抱脚踝: pose(0, { face: 0.6, ground: false, float: 0, rot: 0, ...legL(-2, -10, -44), ...legR(8, -18, -40), neck: 24, expression: "忍着哭", lookX: -0.2, lookY: -0.9 }, (l) => ({
    ...armL(165, 30, 0, "grip", l),
    ...armR(170, 26, 0, "grip", l),
  })),
};
/** ③她的关键帧（④接着往后加） */
export const MOM3_KEYS: MoveKey[] = [
    { t: 45.5, x: 0, p: MOM_POSES.拽绳 },
    { t: DAWN_T.land + 0.1, p: MOM_POSES.拽绳 },
    { t: 47.0, ease: "inOut", p: MOM_POSES.踮脚 },
    { t: DAWN_T.lift - 0.04, p: MOM_POSES.踮脚 },
    { t: DAWN_T.lift + 0.2, ease: "out", p: MOM_POSES.离地 },
    { t: 48.32, p: MOM_POSES.离地 },
    { t: COAT_T.off - 0.02, ease: "inOut", p: MOM3.脱外套 },
    { t: COAT_T.off + 0.16, ease: "inOut", p: MOM3.裹 },
    { t: COAT_T.wrap - 0.02, p: MOM3.裹 },
    { t: COAT_T.grab + 0.08, ease: "out", p: MOM3.低头看他 },
];
export const MOM3_OPTS = { look: lookOf(MOM), base: { wind: 0.6 }, idle: true, seed: 41, springs: ARMS, follow: 0 };
const momMove3 = live([...MOM3_KEYS, { t: 52, p: MOM3.低头看他 }], MOM3_OPTS);
/** ③他的关键帧（④接着往后加） */
export const STONE3_KEYS: MoveKey[] = [
    { t: 45.5, x: 0, p: STONE_POSES.飘 },
    { t: 46.7, p: STONE_POSES.飘 },
    { t: 47.3, ease: "inOut", p: STONE_POSES.够 },
    { t: 48.0, p: STONE_POSES.够 },
    { t: COAT_T.pull2, ease: "inOut", p: STONE3.被拉下来 },
    { t: COAT_T.meet + 0.06, ease: "inOut", p: STONE3.被抱着 },
    { t: COAT_T.wrap, p: STONE3.被抱着 },
    { t: COAT_T.grab, ease: "out", p: STONE3.抱脚踝 },
];
export const STONE3_OPTS = { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 43, springs: LIMP, follow: 0 };
const stoneMove3 = live([...STONE3_KEYS, { t: 52, p: STONE3.抱脚踝 }], STONE3_OPTS);

/** 她的根：接着②往上带；两把拽红绳各往上一窜；他抱住脚踝那一下往下一坠，再慢慢被带上去 */
export function momRoot(t: number): V2 {
  const climb = 210 * E.out(ph(t, COAT_T.pull1, COAT_T.pull1 + 0.14)) + 200 * E.out(ph(t, COAT_T.pull2, COAT_T.pull2 + 0.14));
  const dip = 80 * E.out(ph(t, COAT_T.grab, COAT_T.grab + 0.09)) * (1 - 0.7 * E.io(ph(t, COAT_T.grab + 0.09, COAT_T.grab + 0.6)));
  const rise = 60 * E.io(ph(t, 49.3, 50.4));
  return [MOM_X + 6 * Math.sin(t * 1.2), -momLift(t) - climb + dip - rise];
}

/** 这一刻的两个人：姿势、根、手里攥的地方（IK）、外套在哪 */
export function coatAt(t: number) {
  const T = COAT_T;
  const k = MOM.scale;
  const mRoot = momRoot(t);
  const mp: PoseIn = { ...momMove3(t).pose };
  const m0 = castJoints(MOM, mp);
  const at = (p: V2): V2 => [mRoot[0] + p[0], mRoot[1] + p[1]];
  const loc = (p: V2): V2 => [(p[0] - mRoot[0]) / k, (p[1] - mRoot[1]) / k];
  const head = at(m0.head as V2);
  const chest = at([(m0.shoulderL[0] + m0.shoulderR[0]) / 2, (m0.shoulderL[1] + m0.shoulderR[1]) / 2 + 40]);
  const ankleM = at(m0.ankleL as V2);

  // 他：先接着②往上飘，两把被拽到她胸前（跟着她走），外套一裹上就往下一沉，抱住她近处那只脚踝
  const s2 = streetAt(Math.min(t, DAWN_T.end + 0.6));
  const sp: PoseIn = { ...stoneMove3(t).pose };
  const sj = castJoints(STONE, sp);
  const s2j = castJoints(STONE, s2.stone.pose);
  const hip2: V2 = [s2.stone.root[0] + s2j.hip[0], s2.stone.root[1] + s2j.hip[1]];
  // 拽到跟前：他的头顶在她下巴底下（她的脸露在他头上面）
  const meet: V2 = [chest[0] + 34, chest[1] + 150];
  const hang: V2 = [ankleM[0] + 6 + 10 * Math.sin(t * 2.2), ankleM[1] + 182];
  const u = 0.5 * E.out(ph(t, T.pull1, T.pull1 + 0.14)) + 0.5 * E.out(ph(t, T.pull2, T.pull2 + 0.14));
  let hip = mix(hip2, meet, u);
  hip = mix(hip, hang, E.in2(ph(t, T.wrap, T.grab)));
  const sRoot: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
  const sk = STONE.scale;
  const sloc = (p: V2): V2 => [(p[0] - sRoot[0]) / sk, (p[1] - sRoot[1]) / sk];
  // 他抱住她的脚踝（朝右的人整套镜像：局部 x 取反）
  const g = E.out(ph(t, T.wrap + 0.06, T.grab));
  if (g > 0) {
    const a = sloc([ankleM[0] - 22, ankleM[1] + 10]);
    const b = sloc([ankleM[0] + 22, ankleM[1] + 4]);
    sp.armL = { ...(sp.armL as object), to: [-a[0], a[1]], ik: g } as PoseIn["armL"];
    sp.armR = { ...(sp.armR as object), to: [-b[0], b[1]], ik: g } as PoseIn["armR"];
  }

  // 她的手：拽之前攥在头正上方的红绳上（每拽一把上面那只手先往上够）；褪外套时交给姿势；裹的时候绕到他肩膀上
  const ropeIk = 1 - E.io(ph(t, T.meet - 0.06, T.meet + 0.04));
  const reach = 50 * (Math.sin(Math.PI * ph(t, T.pull1 - 0.1, T.pull1 + 0.12)) + Math.sin(Math.PI * ph(t, T.pull2 - 0.1, T.pull2 + 0.12)));
  const shL = at(m0.shoulderL as V2);
  const shR = at(m0.shoulderR as V2);
  const sjNow = castJoints(STONE, sp);
  const sShoulder: V2 = [sRoot[0] + (sjNow.shoulderL[0] + sjNow.shoulderR[0]) / 2, sRoot[1] + (sjNow.shoulderL[1] + sjNow.shoulderR[1]) / 2];
  const wrapIk = E.io(ph(t, T.off + 0.02, T.off + 0.2)) * (1 - E.io(ph(t, T.wrap + 0.02, T.grab + 0.06)));
  if (ropeIk > 0.001) {
    const hi: V2 = [head[0] + 4, head[1] - 175 * k - reach];
    const lo: V2 = [head[0] - 2, head[1] - 95 * k];
    mp.armR = { ...(mp.armR as object), to: loc(hi), ik: ropeIk } as PoseIn["armR"];
    mp.armL = { ...(mp.armL as object), to: loc(lo), ik: ropeIk } as PoseIn["armL"];
  } else if (wrapIk > 0.001) {
    mp.armR = { ...(mp.armR as object), to: loc([sShoulder[0] - 62, sShoulder[1] + 6]), ik: wrapIk } as PoseIn["armR"];
    mp.armL = { ...(mp.armL as object), to: loc([sShoulder[0] + 66, sShoulder[1] + 10]), ik: wrapIk } as PoseIn["armL"];
  }
  const mj = castJoints(MOM, mp);
  const palmL = at(mj.palmL as V2);
  const palmR = at(mj.palmR as V2);
  return {
    mom: { pose: mp, root: mRoot, spec: t < T.off ? MOM : MOM_BARE, palmL, palmR, shL, shR },
    stone: { pose: sp, root: sRoot, spec: t < T.wrap ? STONE : STONE_COAT, ankle: [sRoot[0] + sjNow.ankleL[0], sRoot[1] + sjNow.ankleL[1]] as V2 },
  };
}

/** 脱下来、裹过去的那件外套（橘色、下摆一圈铅）：领子两头在她两只手里，往下垂着、下摆张开一点；刚脱下来时在她肩上，裹好时盖住他 */
function drawCoat(g: CanvasRenderingContext2D, a: V2, b: V2, t: number) {
  const len = 230;
  const sw = 8 * Math.sin(t * 5);
  const mid: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const lo = Math.max(a[1], b[1]) + len;
  const p = new Path2D();
  // 领口：两头之间往下凹一点；两边往下摆张开，下摆两个圆角
  p.moveTo(a[0], a[1]);
  p.quadraticCurveTo(mid[0], mid[1] + 26, b[0], b[1]);
  p.quadraticCurveTo(b[0] + 18, b[1] + len * 0.5, b[0] + 30 + sw, lo - 14);
  p.quadraticCurveTo(b[0] + 30 + sw, lo + 6, b[0] + 8 + sw, lo + 4);
  p.lineTo(a[0] - 8 + sw, lo + 4);
  p.quadraticCurveTo(a[0] - 30 + sw, lo + 6, a[0] - 30 + sw, lo - 14);
  p.quadraticCurveTo(a[0] - 18, a[1] + len * 0.5, a[0], a[1]);
  p.closePath();
  part(g, p, "#f29a4a", "#de8538", 3, [6, 5]);
  g.save();
  g.clip(p);
  // 下摆缝着铅的那一圈、两道褶
  g.fillStyle = "#8a6a5a";
  g.fillRect(Math.min(a[0], b[0]) - 80, lo - 22, Math.abs(b[0] - a[0]) + 160, 40);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  for (const k of [0.36, 0.64]) {
    g.beginPath();
    g.moveTo(a[0] + (b[0] - a[0]) * k, mid[1] + 30);
    g.quadraticCurveTo(a[0] + (b[0] - a[0]) * k + sw * 0.6, mid[1] + len * 0.6, a[0] + (b[0] - a[0]) * k + sw, lo - 26);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.stroke(p);
}

/** 画③的两个人、红绳、那件外套（人这一层，世界坐标） */
export function drawCoat3(g: CanvasRenderingContext2D, t: number, z: number) {
  const T = COAT_T;
  const c = coatAt(t);
  drawPerson(g, c.mom.spec, c.mom.pose, c.mom.root[0], c.mom.root[1], z);
  // 红绳：他的脚踝 → 她远处那只手（拽之前从上面那只手到下面那只手，绕一圈）；挨近以后松下来，垂成一个弯
  const end = c.mom.palmR;
  const A = c.stone.ankle;
  const d = Math.hypot(end[0] - A[0], end[1] - A[1]);
  const sag = Math.max(0, 760 - d) * 0.5;
  const path = new Path2D();
  path.moveTo(A[0], A[1]);
  path.quadraticCurveTo((A[0] + end[0]) / 2 + 30, Math.max(A[1], end[1]) + sag, end[0], end[1]);
  if (t < T.meet) {
    path.lineTo(c.mom.palmL[0], c.mom.palmL[1]);
    path.moveTo(c.mom.palmL[0] + 13, c.mom.palmL[1] + 14);
    path.ellipse(c.mom.palmL[0], c.mom.palmL[1] + 14, 13, 6, 0.2, 0, Math.PI * 2);
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
  drawPerson(g, c.stone.spec, c.stone.pose, c.stone.root[0], c.stone.root[1], z);
  // 脱下来、裹过去的外套：领子在她两只手里（刚脱下来时在她肩上）
  if (t >= T.off && t < T.wrap) {
    const k = E.io(ph(t, T.off, T.off + 0.12));
    const a = mix([c.mom.shR[0] - 10, c.mom.shR[1] - 6], c.mom.palmR, k);
    const b = mix([c.mom.shL[0] + 10, c.mom.shL[1] - 6], c.mom.palmL, k);
    drawCoat(g, a, b, t);
  }
}

// ——— 沉沉：从最高那栋楼那边冲过来（朝右跑，铁靴一步一「咚」），慢下来停在他们左下 ———
const RUN = (p: typeof CHEN.跑_落地, swap: boolean) => ({ ...(swap ? swapSides(p) : p), face: 1 });
/** ③沉沉跑进来的关键帧（④接着往后加） */
export const CHEN3_KEYS: MoveKey[] = [
    { t: COAT_T.chen0, x: 0, p: RUN(CHEN.跑_蹬地, false) },
    { t: COAT_T.chen0 + 0.08, ease: SMOOTH, p: RUN(CHEN.跑_腾空, false) },
    { t: COAT_T.chen0 + 0.13, ease: SMOOTH, p: RUN(CHEN.跑_落地, true) },
    { t: COAT_T.chen0 + 0.2, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, true) },
    { t: COAT_T.chen0 + 0.28, ease: SMOOTH, p: RUN(CHEN.跑_腾空, true) },
    { t: COAT_T.chen0 + 0.33, ease: SMOOTH, p: RUN(CHEN.跑_落地, false) },
    { t: COAT_T.chen0 + 0.4, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, false) },
    { t: COAT_T.chen0 + 0.48, ease: SMOOTH, p: RUN(CHEN.跑_腾空, false) },
    { t: COAT_T.chen0 + 0.53, ease: SMOOTH, p: RUN(CHEN.跑_落地, true) },
    { t: COAT_T.chen0 + 0.6, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, true) },
    { t: COAT_T.chen0 + 0.68, ease: SMOOTH, p: RUN(CHEN.跑_腾空, true) },
];
export const CHEN3_OPTS = { look: CHENGTUO, base: { wind: 0.6, chestL: "under", chestR: "under" }, idle: false, seed: 51, springs: ARMS, follow: 0 } as const;
const chenRun = live([...CHEN3_KEYS, { t: 52, p: RUN(CHEN.跑_腾空, true) }], CHEN3_OPTS);
/** 她的根：从画面左边外面冲进来（每秒约 1500），快到他们跟前时慢下来 */
export function chenRoot(t: number): V2 {
  const u = ph(t, COAT_T.chen0, COAT_T.end + 0.3);
  return [-3200 + 760 * (1 - Math.pow(1 - u, 1.6)), 0];
}
export function drawChen3(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < COAT_T.chen0) return;
  const r = chenRoot(t);
  const pose = chenRun(t).pose;
  g.save();
  g.translate(r[0], r[1]);
  drawChengtuo(g, pose, { line: 1 / Math.sqrt(Math.max(0.3, z)) });
  g.restore();
}

// ——— 镜头 ———
/**
 * ③的镜头（以②的镜头为底）：跟着两个人（她的头到他的脚中间那一点），先往下（她把他拽下来），他一沉再跟着往下一点；
 * 沉沉冲进来时往左挪、往后退一点，把街面和冲过来的她框进来
 */
export function coatCam(t: number, base: (t: number) => Cam): Cam {
  const T = COAT_T;
  if (t <= T.start) return base(t);
  const c0 = base(t);
  const c = coatAt(t);
  const top = c.mom.root[1] - 600;
  const bottom = c.stone.root[1];
  const center: V2 = [(c.mom.root[0] + c.stone.root[0]) / 2, (top + bottom) / 2];
  let cam = camLerp(c0, aim(center[0] - 30, center[1], 540, 900, 0.95), E.io(ph(t, T.start, T.meet + 0.1)));
  cam = camLerp(cam, aim(-2470, -660, 540, 980, 0.86), E.io(ph(t, T.chen0, T.end + 0.2)));
  return cam;
}
