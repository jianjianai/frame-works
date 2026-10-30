// 主歌二⑤⑥（79.56 起；①–④ 72.02–79.56 在 lib/nightwin.ts：屋里对着窗那面墙，2026-10-25 用户重新设计）。
// 主歌二⑤「但我还想做些什么」（79.56–81.87；但 79.56 我 79.62 还 79.80 想 79.92 做 80.16 些 80.37 什 80.64 么 80.79；小节线 80.03）：
// 切进屋里（对着门、桌子那面墙），近景：他跪在椅子边，把自己脚踝上那截被割断的红绳一圈圈绕在拴着她的麻绳上，「么」两只手往外一拉，结勒紧。
// 镜头从结上往上抬：她穿着铁靴站在他身边（④ 刚被他拽下来踩进铁靴），低头看着他，慢慢伸下手来摸他的头。
// 2026-10-25 起她站着（用户：「里她站着」）；原来她浮在半空。
// 主歌二⑥「其实还想要说很多」（81.87–83.85，2026-10-20 重排剪掉，代码还在）：他站起来踮着脚够她的手，脱掉缝着铅的外套飘起来，
// 「很」两只手攥在一起。（⑤ 改成她站着以后⑥和⑤接不上，要用的话先改）

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, ph } from "./cam";
import { INK, part } from "./world";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { roomMatrix, zInside } from "./night";
import { KNOT, ROOM, type RoomAway } from "./room";
import { drawPerson } from "./people";
import { leadBand, standCollar } from "./leadcoat";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const KNOT_T = {
  start: 79.56,
  /** 一圈圈绕上去 */
  wrap0: 79.68,
  wrap1: 80.6,
  /** 「么」往外一拉，勒紧 */
  pull: 80.79,
  /** 镜头往上抬；她伸下手来 */
  tilt0: 80.9,
  reach0: 81.2,
  end: 81.87,
};
const KN = KNOT_T;

export const FLOAT_T = {
  start: KNOT_T.end,
  /** 站起来踮脚够她的手 */
  reach: 82.1,
  /** 脱外套：从肩上滑下去，「咚」掉在地上 */
  off: 82.26,
  thud: beatAt(165),
  /** 飘起来，「很」攥住她的手 */
  rise: 82.4,
  clasp: 83.22,
  end: 83.85,
};
const FL = FLOAT_T;

/** ⑥ 她浮在屋里的位置按原来坐窗台的地方算（屋子坐标） */
const SILL: V2 = [430, 1920];
/** 离窗越近画得越大（透视）：地板最里面（墙根）是屋里的大小，窗台那里是 1.6 倍 */
const depthK = (y: number) => ROOM.s * (1 + 0.6 * Math.max(0, Math.min(1, (y - ROOM.floor) / (SILL[1] - ROOM.floor))));

// ——— 她 ———
/** ⑤ 她穿着铁靴站在他右边远一点（两脚中间的地上，屋子坐标；近景里只看得见结和他的手，「么」以后退开才同框） */
const STAND5: V2 = [1180, 1700];
const STAND5_S = depthK(STAND5[1]);
const HER5 = {
  /** 站在铁靴里，低头看着跪着系绳子的他，含着泪 */
  站: pose(4, { face: -0.6, ...legR(5, -4), ...legL(-4, -3), neck: -22, expression: "含泪", sad: 0.9, tears: 1, lookX: -0.7, lookY: 0.9 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(14, 26, 6, "relax", l),
  })),
  /** 「么」以后弯一点腰，近处那只手慢慢伸下去摸他的头（IK） */
  摸: pose(20, { face: -0.6, ...legR(8, -8), ...legL(-6, -6), neck: -26, expression: "含泪", smile: 0.15, tears: 1, lookX: -0.7, lookY: 0.9 }, (l) => ({
    ...armL(60, 20, 0, "open", l),
    ...armR(14, 26, 6, "relax", l),
  })),
};
const P4 = {
  /** ⑥ 浮在屋里半空：没了铁靴，两条腿垂着，脚尖朝下，头发往上漂 */
  浮: pose(-4, { face: -0.36, ground: false, float: 0.5, ...legR(14, -30, -54), ...legL(-4, -26, -58), thighL: 1, thighR: 1, neck: -18, expression: "含泪", sad: 1, tears: 1, lookX: -0.6, lookY: 0.9 }, (l) => ({
    shoulderL: 60 + l,
    elbowL: 10,
    wristL: 0,
    handL: "open",
    shoulderR: -40 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
};
const move = live(
  [
    { t: 79, x: 0, items: { boots: true, bricks: 0, gloves: false }, p: HER5.站 },
    { t: KN.reach0 - 0.1, p: HER5.站 },
    { t: KN.end - 0.2, ease: "inOut", p: HER5.摸 },
    { t: KN.end, p: HER5.摸 },
    // ⑥（剪掉了）
    { t: FL.start + 0.1, items: { boots: false, bricks: 0, gloves: false }, ease: "inOut", p: P4.浮 },
    { t: FL.clasp - 0.05, p: { ...P4.浮, shoulderL: -38, elbowL: 6, lookX: 0.7, lookY: 0.9, neck: -24 } },
    { t: FL.clasp + 0.3, ease: "inOut", p: { ...P4.浮, handL: "grip", shoulderL: -30, elbowL: 30, expression: "哭着笑", lookX: 0.6, lookY: 0.6, neck: -14 } },
    { t: 86, p: { ...P4.浮, handL: "grip", shoulderL: -30, elbowL: 30, expression: "哭着笑", lookX: 0.6, lookY: 0.6, neck: -14 } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 81, springs: ARMS, follow: 0 },
);

/** 她这一刻（屋子坐标）：⑤ 站在铁靴里（「么」以后近处那只手伸下去摸他的头）；⑥ 浮在半空 */
function herAt(t: number) {
  const p: PoseIn = { ...move(t).pose };
  if (t < FL.start) {
    const sc = STAND5_S;
    const root: V2 = STAND5;
    const w = E.io(ph(t, KN.reach0, KN.end));
    if (w > 0.001) {
      const head = stoneHead(t);
      p.armL = { ...(p.armL as object), to: [(head[0] + 10 - root[0]) / sc, (head[1] - 30 - root[1]) / sc], ik: w } as PoseIn["armL"];
    }
    const j = jointsOf(p);
    const at = (q: number[]): V2 => [root[0] + q[0] * sc, root[1] + q[1] * sc];
    // 绳子拴在脚踝上，从靴口出来
    const rope = mix(at(j.ankleL), at(j.kneeL), 0.42);
    return { pose: p, root, sc, palmL: at(j.palmL), ankleL: rope, head: at(j.head), hip: at(j.hip) };
  }
  return floatAt(t, p);
}
/** ⑥ 浮在半空（胯在屋子坐标里的位置，慢慢上下飘） */
function floatAt(t: number, p: PoseIn) {
  const sc = 1.5;
  const hip: V2 = [SILL[0] - 70, 800 + 10 * Math.sin(t * 2.1)];
  const j0 = jointsOf(p);
  const root: V2 = [hip[0] - j0.hip[0] * sc, hip[1] - j0.hip[1] * sc];
  // 近处那只手攥住他伸上来的手
  const wc = E.io(ph(t, FL.clasp - 0.32, FL.clasp));
  if (wc > 0.001) p.armL = { ...(p.armL as object), to: [(CLASP[0] - root[0]) / sc, (CLASP[1] - root[1]) / sc], ik: wc } as PoseIn["armL"];
  const j = jointsOf(p);
  const at = (q: number[]): V2 => [root[0] + q[0] * sc, root[1] + q[1] * sc];
  return { pose: p, root, sc, palmL: at(j.palmL), ankleL: at(j.ankleL), head: at(j.head), hip: at(j.hip) };
}

/** 屋子坐标 → 世界坐标 */
const toWorld = (q: V2): V2 => {
  const m = roomMatrix();
  const r = m.transformPoint(new DOMPoint(q[0], q[1]));
  return [r.x, r.y];
};

/**
 * 主歌二⑤⑥ 的镜头（屋里，对着门、桌子那面墙）：⑤ 近景对着结和他的手（屋里 2.6 倍，系的时候慢慢凑近一点）；
 * 「么」以后往上抬、退到站着的她和跪着的他同框（屋里 1.2 倍）。⑥ 接着往上抬一点、凑近一点
 */
export function sillCam(t: number): Cam {
  const zi = zInside();
  const both = aim(...toWorld([930, 1250]), 540, 980, zi * 1.2);
  if (t >= FL.start) {
    const upper = aim(...toWorld([480, 990]), 540, 980, zi * 1.34);
    return camLerp(both, upper, E.io(ph(t, FL.rise, FL.end + 0.5)));
  }
  const k0 = knotPoint(KN.start);
  const close = aim(...toWorld([k0[0] - 30, k0[1] - 60]), 560, 1060, zi * 2.6 * (1 + 0.06 * E.io(ph(t, KN.start, KN.pull))));
  return camLerp(close, both, E.io(ph(t, KN.tilt0, KN.end - 0.3)));
}

// ——— 小石头 ———
const STONE = CAST.小石头穿妈妈的外套;
/** ⑥ 脱了那件橘色外套：他自己的米白毛衣 */
const STONE_BARE = { ...CAST.小石头, coat: undefined };
const stoneSpec = (t: number) => (t >= FL.off ? STONE_BARE : STONE);
const STONE2 = {
  /** ⑤ 跪在椅子边，两只手把红绳绕在她的脚绳上（低头看着结） */
  系: pose(30, { face: 0.6, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: -12, expression: "坚定", tears: 0.9, lookX: 0.4, lookY: 0.9 }, (l) => ({
    shoulderL: 40 + l,
    elbowL: 60,
    wristL: 0,
    handL: "grip",
    shoulderR: 50 + l,
    elbowR: 50,
    wristR: 0,
    handR: "grip",
  })),
  /** 跪着攥着系在一起的绳子，仰头看站在身边的她 */
  仰望她: pose(6, { face: 0.6, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: 34, expression: "忍着哭", tears: 1, lookX: 0.6, lookY: -1 }, (l) => ({
    shoulderL: 40 + l,
    elbowL: 60,
    wristL: 0,
    handL: "grip",
    shoulderR: 20 + l,
    elbowR: 30,
    wristR: 0,
    handR: "relax",
  })),
  /** ⑥ 站起来踮着脚，远处那只手往上伸着够她的手（够不着），仰头哭着看她 */
  够她: pose(-6, { face: -0.6, ...legR(4, -4, 20), ...legL(-8, -6, 24), neck: 30, expression: "忍着哭", tears: 1, lookX: -0.4, lookY: -1 }, (l) => ({
    shoulderL: -20 + l,
    elbowL: 20,
    wristL: 0,
    handL: "relax",
    shoulderR: 172 + l,
    elbowR: 6,
    wristR: 0,
    handR: "open",
  })),
  /** 脱外套：两只肩膀往后一耸，胳膊往后甩，外套从身上滑下去 */
  脱: pose(8, { face: -0.6, ...legR(4, -4, 10), ...legL(-8, -6, 14), neck: 16, expression: "使劲", tears: 1, lookX: -0.4, lookY: -0.6 }, (l) => ({
    shoulderL: -50 + l,
    elbowL: 20,
    wristL: 0,
    handL: "open",
    shoulderR: -40 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
  /** 飘起来：没了分量，腿垂着，远处那只手伸向她 */
  飘: pose(-4, { face: -0.6, ground: false, float: 0.3, ...legR(10, -26, -50), ...legL(-6, -20, -54), neck: 24, expression: "含泪", tears: 1, lookX: -0.4, lookY: -0.9 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: 20,
    wristL: 0,
    handL: "open",
    shoulderR: 150 + l,
    elbowR: 10,
    wristR: 0,
    handR: "open",
  })),
  /** 攥着她的手浮在她身边，哭着笑看着她 */
  牵着: pose(-2, { face: -0.6, ground: false, float: 0.3, ...legR(14, -30, -50), ...legL(-4, -24, -56), neck: 18, expression: "哭着笑", lookX: -0.5, lookY: -0.6 }, (l) => ({
    shoulderL: -20 + l,
    elbowL: 20,
    wristL: 0,
    handL: "relax",
    shoulderR: 130 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
};
const stoneMove = live(
  [
    { t: 79, x: 0, p: STONE2.系 },
    { t: KN.pull + 0.06, p: STONE2.系 },
    { t: KN.tilt0 + 0.3, ease: "inOut", p: STONE2.仰望她 },
    // ⑥ 站起来踮脚够她的手 → 脱外套 → 飘起来攥住她的手
    { t: FL.start + 0.02, p: STONE2.仰望她 },
    { t: FL.reach, ease: "inOut", p: STONE2.够她 },
    { t: FL.off - 0.02, p: STONE2.够她 },
    { t: FL.off + 0.16, ease: "inOut", p: STONE2.脱 },
    { t: FL.rise + 0.25, ease: "inOut", p: STONE2.飘 },
    { t: FL.clasp + 0.12, ease: "inOut", p: STONE2.牵着 },
    { t: 86, p: STONE2.牵着 },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0 }, idle: true, seed: 83, springs: ARMS, follow: 0 },
);
/** ⑤ 他跪在椅子边系绳子的地方（结就在手边） */
const TIE_SPOT: V2 = [690, 1748];
/** ⑥ 两只手攥在一起的地方 */
const CLASP: V2 = [470, 770];
/** ⑥ 他的根：站起来（原地），飘起来往她那边上去，攥住手以后被她拉近一点 */
function floatRoot(t: number): V2 {
  const up = E.out(ph(t, FL.rise, FL.clasp + 0.05));
  const near = E.io(ph(t, FL.clasp, FL.end + 0.3));
  const r: V2 = mix([TIE_SPOT[0], TIE_SPOT[1] + 20], [560, 1250], up);
  return [r[0] - 20 * near, r[1] - 50 * near + 8 * Math.sin(t * 2.3) * up];
}
/** 结系在她的脚绳上：离椅子腿那头不远（跪着的他手正好够得着） */
function knotPoint(t: number): V2 {
  const a = herAnkle(t);
  const pull = t > KN.pull ? 5 * Math.exp(-(t - KN.pull) / 0.08) : 0;
  // 沿麻绳从椅子腿往她脚踝那边 27%（原来 15%，绕上去的几圈压在他身上；用户 2026-10-30，1:20.39：「绳几圈需要向右移动一点」）
  return [KNOT[0] + (a[0] - KNOT[0]) * 0.27, KNOT[1] + (a[1] - KNOT[1]) * 0.27 + pull];
}
const knotAngle = (t: number) => {
  const a = herAnkle(t);
  return Math.atan2(a[1] - KNOT[1], a[0] - KNOT[0]);
};
/** 她的脚踝（结和绳子按它算；她的手要摸他的头，不能反过来按她的姿势算，免得互相等）：⑤ 站着时不动 */
function herAnkle(t: number): V2 {
  if (t < FL.start) {
    const p: PoseIn = { ...move(KN.start).pose };
    const j = jointsOf(p);
    const at = (q: number[]): V2 => [STAND5[0] + q[0] * STAND5_S, STAND5[1] + q[1] * STAND5_S];
    return mix(at(j.ankleL), at(j.kneeL), 0.42);
  }
  return herAt(t).ankleL;
}
/** ⑤ 他的头（她伸手去摸） */
function stoneHead(t: number): V2 {
  const p: PoseIn = { ...stoneMove(t).pose };
  const k = depthK(TIE_SPOT[1]);
  const j = castJoints(STONE, p);
  return [TIE_SPOT[0] + j.head[0] * k, TIE_SPOT[1] + j.head[1] * k];
}
/** 他这一刻（屋子坐标）：根、缩放、两只手心；系绳子、⑥ 攥手按 IK */
function stoneAt(t: number) {
  const p: PoseIn = { ...stoneMove(t).pose };
  const root: V2 = t >= FL.start ? floatRoot(t) : TIE_SPOT;
  const k = depthK(TIE_SPOT[1]);
  const sc = k * STONE.scale;
  const face = (p.face as number | undefined) ?? 0;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / sc, (q[1] - root[1]) / sc];
  if (t >= FL.start) {
    // ⑥ 远处那只手往上伸着够她；飘上去以后攥住她的手（IK）
    const w = E.io(ph(t, FL.clasp - 0.3, FL.clasp));
    if (w > 0.001) p.armR = { ...(p.armR as object), to: loc(CLASP), ik: w } as PoseIn["armR"];
  } else {
    // ⑤ 两只手在结上一圈圈绕（近处那只绕着麻绳转），「么」往外一拉；之后近处那只攥着结
    const kp = knotPoint(t);
    const ang = knotAngle(t);
    const d: V2 = [Math.cos(ang), Math.sin(ang)];
    const n: V2 = [-d[1], d[0]];
    const w = 2 * Math.PI * 3 * ph(t, KN.wrap0, KN.wrap1);
    const pull = E.out(ph(t, KN.pull - 0.06, KN.pull + 0.06));
    const circ: V2 = [kp[0] + n[0] * 16 * Math.cos(w) - d[0] * 10, kp[1] + n[1] * 16 * Math.cos(w) + 12 * Math.sin(w) - d[1] * 10];
    const handL: V2 = mix(circ, [kp[0] - d[0] * 46, kp[1] - d[1] * 46 + 6], pull);
    // 远处那只（R）一直攥在结旁边（绕的时候、「么」一拉都是），不往外甩（用户 2026-10-30 在「调整画面」1:20.87 摆的：手腕在他自己的坐标里
    // 比原来拉出去的地方往回 82、往上 8；「前面没改」：绕的时候也在这里）
    const back: V2 = [(face > 0 ? -1 : 1) * 82 * sc, -8 * sc];
    const handR: V2 = [kp[0] + d[0] * 52 + back[0], kp[1] + d[1] * 52 - 4 + back[1]];
    const up = E.io(ph(t, KN.tilt0, KN.tilt0 + 0.3));
    // 肘朝下（用户 2026-10-30，1:20.07：「这里小石头倒v」）
    p.armL = { ...(p.armL as object), to: loc(mix(handL, [kp[0] - 8, kp[1] + 4], up)), ik: 1, bend: "down" } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc(handR), ik: 1 - up, bend: "down" } as PoseIn["armR"];
  }
  const j = castJoints(stoneSpec(t), p);
  const at = (q: number[]): V2 => [root[0] + q[0] * k, root[1] + q[1] * k];
  return { pose: p, root, k, palm: at(j.palmL), ankleL: at(j.ankleL) };
}

function drawStone(g: CanvasRenderingContext2D, t: number) {
  const b = stoneAt(t);
  g.save();
  g.translate(b.root[0], b.root[1]);
  g.scale(b.k, b.k);
  drawPerson(g, stoneSpec(t), b.pose, 0, 0, 1.4);
  g.restore();
  // 被割断的红绳：一头拴在他近处那只脚踝上，一头系在她的脚绳上（绕好以前那一截攥在他手里）
  const j = castJoints(stoneSpec(t), b.pose);
  const at = (q: number[]): V2 => [b.root[0] + q[0] * b.k, b.root[1] + q[1] * b.k];
  const ank = at([j.ankleL[0], j.ankleL[1] - 4]);
  const hand = at(j.palmL);
  const kp = knotPoint(t);
  const end = t < KN.wrap1 ? mix(hand, kp, E.io(ph(t, KN.wrap0, KN.wrap1))) : kp;
  const rope = new Path2D();
  rope.moveTo(ank[0], ank[1]);
  rope.quadraticCurveTo((ank[0] + end[0]) / 2 - 20, Math.max(ank[1], end[1]) + 20, end[0], end[1]);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5 * (b.k / ROOM.s);
  g.stroke(rope);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6 * (b.k / ROOM.s);
  g.stroke(rope);
  g.restore();
}

/**
 * ⑥ 他脱下来的那件橘色外套：从肩上滑下去、往下掉，「咚」掉在他脚边的地上堆成一团（下摆那圈铅先着地）。
 * 掉的时候按副歌一妈妈脱下来那件的画法（领口往下凹、下摆张开、两道褶、下摆一圈铅）
 */
let COAT_FROM: { a: V2; b: V2; k: number } | null = null;
function drawLooseCoat(g: CanvasRenderingContext2D, t: number) {
  if (t < FL.off) return;
  if (!COAT_FROM) {
    const b0 = stoneAt(FL.off);
    const j = castJoints(STONE, b0.pose);
    const at = (q: number[]): V2 => [b0.root[0] + q[0] * b0.k, b0.root[1] + q[1] * b0.k];
    COAT_FROM = { a: at(j.shoulderR), b: at(j.shoulderL), k: b0.k };
  }
  const { a, b, k } = COAT_FROM;
  const floor = TIE_SPOT[1] + 20;
  const len = 170 * k;
  const lw = 3.2;
  const orange = "#f29a4a";
  const shade = "#de8538";
  const d = t - FL.off;
  // 领口跟着重力往下掉（落地正好在「咚」那一拍），下摆先碰到地、外套往下塌
  const fall = Math.min(1, d / (FL.thud - FL.off));
  const top0 = Math.min(a[1], b[1]);
  const yTop = top0 + (floor - 30 - top0) * fall * fall;
  const lo = Math.min(yTop + len, floor);
  const h = lo - yTop;
  const spread = 1 + 0.8 * Math.max(0, 1 - h / len);
  const cx = (a[0] + b[0]) / 2;
  const half = (Math.abs(b[0] - a[0]) / 2) * spread;
  if (t < FL.thud) {
    const A: V2 = [cx - half, yTop];
    const B: V2 = [cx + half, yTop];
    const path = new Path2D();
    path.moveTo(A[0], A[1]);
    path.quadraticCurveTo(cx, yTop + 24 * k, B[0], B[1]);
    path.quadraticCurveTo(B[0] + 14 * k * spread, yTop + h * 0.5, B[0] + 26 * k * spread, lo);
    path.lineTo(A[0] - 26 * k * spread, lo);
    path.quadraticCurveTo(A[0] - 14 * k * spread, yTop + h * 0.5, A[0], A[1]);
    path.closePath();
    part(g, path, orange, shade, lw, [5, 4]);
    g.save();
    g.clip(path);
    leadBand(g, cx - 200 * k, lo - 12 * k, 400 * k, 12 * k, 11 * k);
    standCollar(g, A, [cx, yTop + 24 * k], B, 8 * k);
    g.strokeStyle = "rgba(160,80,30,0.45)";
    g.lineWidth = 3;
    for (const f of [-0.35, 0.35]) {
      g.beginPath();
      g.moveTo(cx + half * f, yTop + 30 * k);
      g.quadraticCurveTo(cx + half * f * 1.2, yTop + h * 0.6, cx + half * f * 1.4, lo - 26 * k);
      g.stroke();
    }
    g.restore();
    return;
  }
  // 堆在地上的一团（落地一弹）：下摆那圈铅压在底下，两道褶
  const settle = Math.exp(-(t - FL.thud) / 0.06) * Math.sin((t - FL.thud) * 40) * 8;
  // 她那件短款堆起来的一团（原来按长外套 115 × 46）
  const w = 95 * k;
  const ht = 40 * k;
  const heap = new Path2D();
  heap.moveTo(cx - w, floor);
  heap.quadraticCurveTo(cx - w * 0.95, floor - ht * 0.9 - settle, cx - w * 0.2, floor - ht - settle);
  heap.quadraticCurveTo(cx + w * 0.45, floor - ht * 1.12 - settle, cx + w * 0.92, floor - ht * 0.45);
  heap.quadraticCurveTo(cx + w * 1.08, floor - 4, cx + w * 0.86, floor);
  heap.closePath();
  part(g, heap, orange, shade, lw, [5, 4]);
  g.save();
  g.clip(heap);
  leadBand(g, cx - w * 1.2, floor - ht * 0.24, w * 2.4, ht * 0.24, 11);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - w * 0.3, floor - ht * 0.9);
  g.quadraticCurveTo(cx - w * 0.12, floor - ht * 0.55, cx - w * 0.22, floor - ht * 0.2);
  g.moveTo(cx + w * 0.3, floor - ht * 0.95);
  g.quadraticCurveTo(cx + w * 0.46, floor - ht * 0.55, cx + w * 0.4, floor - ht * 0.2);
  g.stroke();
  g.restore();
}

/** ⑤ 红绳在她的麻绳上绕出来的结：一圈圈绕上去，「么」一拉勒紧（画在麻绳上） */
function drawKnot(g: CanvasRenderingContext2D, t: number) {
  if (t < KN.start) return;
  const kp = knotPoint(t);
  const ang = knotAngle(t);
  const n = Math.min(3, 3 * ph(t, KN.wrap0, KN.wrap1) + 0.6);
  const tight = 1 - 0.3 * E.out(ph(t, KN.pull - 0.04, KN.pull + 0.06));
  g.save();
  g.translate(kp[0], kp[1]);
  g.rotate(ang);
  g.lineCap = "round";
  for (let i = 0; i < Math.floor(n); i++) {
    const x = (i - 1) * 11 * tight;
    g.beginPath();
    g.ellipse(x, 0, 6 * tight, 15 * tight, 0.25, 0, Math.PI * 2);
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = "#d8352b";
    g.lineWidth = 5;
    g.stroke();
  }
  // 系好以后剩下的一小截线头
  if (t > KN.pull - 0.1) {
    g.beginPath();
    g.moveTo(14 * tight, 6);
    g.quadraticCurveTo(26, 20, 22 + 4 * Math.sin(t * 3), 38);
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = "#d8352b";
    g.lineWidth = 5;
    g.stroke();
  }
  g.restore();
}

/** ⑤⑥ 屋里的样子：脚绳从椅子腿拉到她脚踝上；她、结、外套、他从门洞那一层画进去 */
export function roomAwayAt(t: number): RoomAway {
  if (t < KN.start) return { door: 0 };
  const f = herAt(t);
  return {
    rope: f.ankleL,
    door: 0,
    visitor: (g) => {
      drawLooseCoat(g, t);
      drawStone(g, t);
      // 结画在他后面：绕在麻绳上的红绳不被他的手挡住（用户 2026-10-30，1:19.73：「右手把红线挡住了」）
      drawKnot(g, t);
      g.save();
      g.translate(f.root[0], f.root[1]);
      g.scale(f.sc, f.sc);
      drawChengtuo(g, f.pose, { line: 0.8 });
      g.restore();
    },
  };
}
