// 主歌二①「忍着想要挣脱的生活」（72.02–73.89；忍 72.06 着 72.15 想 72.21 要 72.39 挣 72.45 脱 72.69 的 72.96 生 73.14 活 73.35；
// 小节线 72.027）。故事「夜里，沉沉家」：间奏最后她抱着小石头抬头看天，这里在小节线上硬切到夜里——最高那栋楼顶层她那扇窗亮着，
// 窗外头顶就是白。她没穿铁靴，飘起来坐在窗框上：两条光着的腿垂在窗外，头发往上漂；拴在屋里椅子后腿上的脚绳绷直，翻过窗台拴在她脚踝上。
// 她手里攥着那把小折刀（小石头的妈妈掉在街上的那把），刀刃抵在窗台边的脚绳上；「挣脱」往绳子上一压，「生活」闭上眼。
// 镜头从窗外远处（白压在画面最上面，那扇窗小小的在下面）一路慢慢推向她。
// 主歌二②「做出不想做的承诺」（73.89–75.93；做 73.89 出 74.16 不 74.34 想 74.46 做 74.70 的 74.97 承 75.15 诺 75.30；小节线 74.03）：
// 「做出」两下敲门。她一惊睁开眼，转过头去看屋里左边那扇门；门慢慢开了——小石头站在门口，裹着妈妈那件橘色外套，
// 手里攥着被割断的那截红绳（另一头还拴在他脚踝上），看着她。「承诺」她手一松，刀掉在屋里的地上「当」。镜头接着慢慢推，顺着她的视线挪向门。
// 主歌二③「列车上坐错站的乘客」（75.93–77.94；列 75.93 车 76.17 上 76.32 坐 76.92 错 77.13 站 77.22 的 77.37 乘 77.46 客 77.58；
// 小节线 76.03）：他撒开红绳（拖在他脚踝后面），一路冲过屋子，弯腰捡起地上的刀；「坐」转过来朝着窗外抡起胳膊，把刀从她身边扔出窗外——
// 刀闪着光翻着掉进夜里；「的乘客」他转过身攥住她的手，哭着仰头看她。镜头跟着他挪回她身边，顺着掉下去的刀往下看一点，停在两只手上。
// 主歌二④「困惑着沉默」（77.94–79.56；困 77.94 惑 78.18 着 78.42 沉 78.60 默 78.81；小节线 78.03）：他攥着她的手往回一拉，
// 她没穿铁靴，轻飘飘地从窗台上浮回屋里（脚绳从椅子腿拽着她，浮在半空）；他撒开手冲到窗的左边，探出手把那扇开着的铁栅栏门拉过来，
// 「默」「哐」地关上，铁栏挡在窗前。镜头从窗前慢慢往后退，退回①开头那个取景：头顶压着白，关上铁栏的那扇窗小小的亮着。
// 主歌二⑤「但我还想做些什么」（79.56–81.87；但 79.56 我 79.62 还 79.80 想 79.92 做 80.16 些 80.37 什 80.64 么 80.79；小节线 80.03）：
// 在这一句开头切进屋里，近景：他跪在椅子边，把自己脚踝上那截被割断的红绳一圈圈绕在拴着她的麻绳上，「么」两只手往外一拉，结勒紧。
// 镜头从结上往上抬：她浮在半空低头看着他，他攥着系在一起的两根绳子仰头看她；她慢慢伸下手来。
// 主歌二⑥「其实还想要说很多」（81.87–83.85；其 81.87 实 82.17 还 82.38 想 82.47 要 82.71 说 82.92 很 83.22 多 83.37；小节线 82.03）：
// 他站起来踮着脚伸手够她的手，够不着；他脱掉妈妈那件下摆缝着铅的橘色外套，外套「咚」地掉在地上——没了这点分量，他也轻轻飘起来，
// 「很」两只手攥在一起；她把他拉到身边，两个人手牵手浮在半空，脚下系在一起的两根绳子拽着他们。镜头跟着他往上抬一点、凑近一点。

import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, ph } from "./cam";
import { INK, drawGlow, part } from "./world";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { ARMS, SMOOTH, live } from "./motion";
import { KID, legL, legR } from "./poses";
import { pose } from "./dawn";
import { homeWindow, roomMatrix, zInside } from "./night";
import { DOOR, KNOT, ROOM, type RoomAway } from "./room";
import { drawKnife } from "./knife";
import { drawPerson } from "./people";

type V2 = [number, number];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const SILL_T = {
  start: beatAt(144),
  /** 「挣脱」刀刃往绳子上一压 */
  press: 72.45,
  /** 「生活」闭上眼 */
  close: 73.14,
  end: 73.89,
};
const T = SILL_T;

export const KNOCK_T = {
  start: SILL_T.end,
  /** 「做」「出」两下敲门 */
  knock1: 73.92,
  knock2: 74.17,
  /** 一惊、睁开眼、转过头看门 */
  turn0: 73.97,
  turn1: 74.34,
  /** 门慢慢开了 */
  open0: 74.42,
  open1: 75.05,
  /** 「承」手一松，「诺」刀落地 */
  drop: 75.17,
  land: 75.31,
  end: 75.93,
};
const K = KNOCK_T;

export const THROW_T = {
  start: KNOCK_T.end,
  /** 冲过屋子（四步） */
  run0: 75.95,
  run1: 76.52,
  /** 弯腰捡起刀 */
  pick: 76.72,
  /** 转过来朝着窗外抡起胳膊，「坐」把刀扔出去 */
  wind: 76.86,
  rel: 77.0,
  /** 转过身攥住她的手（「的乘客」） */
  grab: 77.42,
  end: 77.94,
};
const TH = THROW_T;

export const SHUT_T = {
  start: THROW_T.end,
  /** 往回一拉：她离开窗台浮进屋里 */
  lift0: 77.98,
  /** 她进了窗（从这一刻起画在屋里） */
  inside: 78.16,
  /** 他撒开手，冲到窗的左边 */
  let: 78.22,
  run1: 78.6,
  /** 探出手抓住铁栅栏门往右一推，「默」关上 */
  swing0: 78.62,
  shut: beatAt(157) + 0.29,
  end: 79.56,
};
const SH = SHUT_T;

export const KNOT_T = {
  start: SHUT_T.end,
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

/** 她坐在窗框上：离窗近，比屋里的她大（窗台在屋子坐标 y = 1920，也就是窗的下沿） */
export const SILL_S = ROOM.s * 1.6;
const SILL: V2 = [430, 1920];

const P = {
  /** 正面坐在窗台上：大腿朝镜头伸出来（压短），小腿垂在窗外，脚尖朝下；两只手撑在身边的窗台上，攥着刀的那只在近处；仰着头看白 */
  坐: pose(0, { face: 0, ground: false, float: 0.45, ...legR(6, -10, -46), ...legL(-6, -8, -50), thighL: 0.42, thighR: 0.42, neck: 0, expression: "难过", sad: 0.9, tears: 0.5, lookX: 0.05, lookY: -1 }, (l) => ({
    shoulderL: -22 + l,
    elbowL: -10,
    wristL: 0,
    handL: "grip",
    shoulderR: 22 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
  /** 低头看着刀：刀刃压在绳子上 */
  压: pose(0, { face: 0, ground: false, float: 0.45, ...legR(6, -10, -46), ...legL(-6, -8, -50), thighL: 0.42, thighR: 0.42, neck: 0, expression: "忍着哭", tears: 0.7, lookX: 0.35, lookY: 0.9 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: -24,
    wristL: 0,
    handL: "grip",
    shoulderR: 22 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
  /** 闭上眼 */
  闭眼: pose(0, { face: 0, ground: false, float: 0.45, ...legR(6, -10, -46), ...legL(-6, -8, -50), thighL: 0.42, thighR: 0.42, neck: 6, expression: "闭眼", sad: 1, tears: 1, smile: -0.3 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: -24,
    wristL: 0,
    handL: "grip",
    shoulderR: 22 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
};
const P2 = {
  /** 敲门声：一惊，睁大眼，身子一缩，攥刀的手缩到胸前 */
  惊: pose(-4, { face: 0, ground: false, float: 0.45, ...legR(6, -10, -46), ...legL(-6, -8, -50), thighL: 0.42, thighR: 0.42, neck: 0, expression: "吓一跳", tears: 0.8, lookX: -0.7, lookY: 0.1 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: -60,
    wristL: 0,
    handL: "grip",
    shoulderR: 22 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
  /** 转过头看着门口的他（含着泪） */
  看他: pose(-2, { face: -0.12, headTurn: -0.75, ground: false, float: 0.45, ...legR(6, -10, -46), ...legL(-6, -8, -50), thighL: 0.42, thighR: 0.42, neck: 0, expression: "含泪", sad: 0.9, tears: 1, lookX: -0.9, lookY: 0.15 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: -60,
    wristL: 0,
    handL: "grip",
    shoulderR: 22 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
};
const P4 = {
  /** 浮在屋里半空：没了铁靴，两条腿垂着，脚尖朝下，头发往上漂；被他拽进来的那只手还伸着，低头看着冲到窗边的他 */
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
    { t: 71.5, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: P.坐 },
    { t: T.press - 0.12, p: P.坐 },
    { t: T.press + 0.16, ease: "inOut", p: P.压 },
    { t: T.close, p: P.压 },
    { t: T.close + 0.3, ease: "inOut", p: P.闭眼 },
    { t: K.knock1 + 0.02, p: P.闭眼 },
    { t: K.turn0 + 0.08, ease: "out", p: P2.惊 },
    { t: K.turn1 - 0.04, p: P2.惊 },
    { t: K.turn1 + 0.24, ease: "inOut", p: P2.看他 },
    { t: K.drop - 0.02, p: P2.看他 },
    { t: K.drop + 0.06, ease: "out", p: { ...P2.看他, handL: "open" } },
    // ③ 他冲进来：她的眼睛跟着他；刀被扔出窗外，她低头看着它掉下去；他攥住她的手，她转过头看着他
    { t: TH.run0 + 0.1, p: { ...P2.看他, handL: "open" } },
    { t: TH.run1, ease: "inOut", p: { ...P2.看他, handL: "open", headTurn: -0.2, lookX: 0.2, lookY: 0.5 } },
    { t: TH.rel - 0.02, p: { ...P2.看他, handL: "open", headTurn: -0.2, lookX: 0.2, lookY: 0.5 } },
    { t: TH.rel + 0.16, ease: "out", p: { ...P2.看他, handL: "open", headTurn: 0, expression: "吓一跳", tears: 1, lookX: 0.4, lookY: 1 } },
    { t: TH.grab - 0.18, p: { ...P2.看他, handL: "open", headTurn: 0, expression: "吓一跳", tears: 1, lookX: 0.4, lookY: 1 } },
    { t: TH.grab + 0.12, ease: "inOut", p: { ...P2.看他, face: -0.04, headTurn: 0, handL: "grip", expression: "含泪", sad: 1, tears: 1, lookX: 0.9, lookY: 0.3 } },
    { t: SH.lift0, p: { ...P2.看他, face: -0.04, headTurn: 0, handL: "grip", expression: "含泪", sad: 1, tears: 1, lookX: 0.9, lookY: 0.3 } },
    // ④ 浮进屋里
    { t: SH.lift0 + 0.32, ease: "inOut", p: P4.浮 },
    { t: KN.reach0, p: P4.浮 },
    // ⑤ 慢慢伸下手来，低头看着他
    { t: KN.end - 0.1, ease: "inOut", p: { ...P4.浮, shoulderL: -38, elbowL: 6, lookX: 0.7, lookY: 0.9, neck: -24 } },
    { t: FL.clasp - 0.05, p: { ...P4.浮, shoulderL: -38, elbowL: 6, lookX: 0.7, lookY: 0.9, neck: -24 } },
    // ⑥ 攥住他的手，把他拉到身边，哭着笑
    { t: FL.clasp + 0.3, ease: "inOut", p: { ...P4.浮, handL: "grip", shoulderL: -30, elbowL: 30, expression: "哭着笑", lookX: 0.6, lookY: 0.6, neck: -14 } },
    { t: 86, p: { ...P4.浮, handL: "grip", shoulderL: -30, elbowL: 30, expression: "哭着笑", lookX: 0.6, lookY: 0.6, neck: -14 } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0.3 }, idle: true, seed: 81, springs: ARMS, follow: 0 },
);

/** ④ 浮进屋里以后她这一刻（屋子坐标）：胯从窗台往屋里、往上浮（越往里画得越小），停在半空慢慢上下飘 */
function floatAt(t: number) {
  const p: PoseIn = { ...move(t).pose };
  const s0 = sillAt(SH.lift0);
  const u = E.out(ph(t, SH.lift0, SH.lift0 + 0.9));
  const sc = SILL_S + (1.5 - SILL_S) * E.io(ph(t, SH.lift0, SH.lift0 + 0.5));
  // ⑤ 切进屋里时她已经又浮高了一点（脚绳拉直）
  const hip: V2 = t >= KN.start ? [SILL[0] - 70, 800 + 10 * Math.sin(t * 2.1)] : mix(s0.hip, [SILL[0] - 40, 1330 + 10 * Math.sin(t * 2.1)], u);
  const j0 = jointsOf(p);
  const root: V2 = [hip[0] - j0.hip[0] * sc, hip[1] - j0.hip[1] * sc];
  // ⑥ 近处那只手攥住他伸上来的手
  const wc = E.io(ph(t, FL.clasp - 0.32, FL.clasp));
  if (wc > 0.001) p.armL = { ...(p.armL as object), to: [(CLASP[0] - root[0]) / sc, (CLASP[1] - root[1]) / sc], ik: wc } as PoseIn["armL"];
  const j = jointsOf(p);
  const at = (q: number[]): V2 => [root[0] + q[0] * sc, root[1] + q[1] * sc];
  return { pose: p, root, sc, palmL: at(j.palmL), ankleL: at(j.ankleL), head: at(j.head), hip: at(j.hip) };
}
/** 她这一刻（屋子坐标）：胯坐在窗台上；两只手 IK 撑在窗台上，近处那只攥着刀抵在绳子上 */
export function sillAt(t: number) {
  const p: PoseIn = { ...move(t).pose };
  const j0 = jointsOf(p);
  const s = SILL_S;
  // 没了铁靴：胯离窗台浮着一点、慢慢上下飘（脚绳拽着她）
  const hover = 22 + 7 * Math.sin(t * 2.1);
  const root: V2 = [SILL[0] - j0.hip[0] * s, SILL[1] - 26 - hover - j0.hip[1] * s];
  const loc = (q: V2): V2 => [(q[0] - root[0]) / s, (q[1] - root[1]) / s];
  // 远处那只手撑在身边的窗台上；近处那只攥着刀：先搁在腿边，「挣脱」挪到绳子翻过窗台的地方
  const rope = ropeSill();
  // 敲门那一下：攥刀的手缩到胸前
  const hold0 = mix([SILL[0] + 120, SILL[1] - 30], [rope[0] - 26, rope[1] - 40], E.io(ph(t, T.press - 0.1, T.press + 0.2)));
  const hold1 = mix(hold0, [SILL[0] + 96, SILL[1] - 300], E.out(ph(t, K.turn0, K.turn0 + 0.22)));
  // ③ 垂下来的手被他攥住
  const hold = mix(hold1, handMeet(), E.io(ph(t, TH.grab - 0.26, TH.grab)));
  p.armR = { ...(p.armR as object), to: loc([SILL[0] - 150, SILL[1] - 18]), ik: 1 } as PoseIn["armR"];
  // 被攥住的那只手往外伸，肘往下（不从脸前面拐过去）
  p.armL = { ...(p.armL as object), to: loc(hold), ik: 1, bend: t > TH.grab - 0.3 ? -1 : undefined } as PoseIn["armL"];
  const j = jointsOf(p);
  const at = (q: number[]): V2 => [root[0] + q[0] * s, root[1] + q[1] * s];
  return { pose: p, root, palmL: at(j.palmL), ankleL: at(j.ankleL), head: at(j.head), hip: at(j.hip) };
}
/** 刀：攥在手里时在手心；「承」手一松掉下去，落在窗台里面的地上（屋子坐标、转角） */
function knifeAt(t: number, s: { palmL: V2 }): { c: V2; rot: number; inHand: boolean; who?: "floor" | "boy" | "air"; k?: number } {
  const r0 = ropeSill();
  if (t < K.drop) {
    const pl = s.palmL;
    // 刀刃朝着绳子；缩到胸前以后刀尖朝上
    const a0 = Math.atan2(r0[1] - pl[1], r0[0] - pl[0]);
    const rot = a0 + (-1.2 - a0) * E.out(ph(t, K.turn0, K.turn0 + 0.22));
    return { c: pl, rot, inHand: true };
  }
  if (t >= TH.pick) {
    // 在他手里（扔出去以前）；扔出去以后朝着窗外（朝着镜头）飞出去、越来越大，翻着往下掉
    const b = stoneAt(Math.min(t, TH.rel));
    if (t < TH.rel) return { c: b.palm, rot: b.knifeRot, inHand: false, who: "boy", k: b.k };
    // 过肩甩出窗外（朝着镜头）：先往上一挑、翻着越过她右边，再往下掉出窗台，离镜头越近越大（最多 1.8 倍），出画面下边
    const d = t - TH.rel;
    const c: V2 = [b.palm[0] + 340 * d, b.palm[1] - 900 * d + 4200 * d * d];
    return { c, rot: b.knifeRot + 18 * d, inHand: false, who: "air", k: b.k * (1 + 0.8 * Math.min(1, d / 0.45)) };
  }
  const from = sillAt(K.drop).palmL;
  const u = ph(t, K.drop, K.land);
  const land: V2 = [from[0] + 110, SILL[1] - 80];
  const c = mix(from, land, u * u);
  const bounce = t > K.land ? 10 * Math.exp(-(t - K.land) / 0.06) * Math.abs(Math.sin((t - K.land) * 40)) : 0;
  // 落地以后在地上往右滑出去一截（停在她右边，看得见）
  const slide = KNIFE_SLIDE * E.out(ph(t, K.land, K.land + 0.35));
  return { c: [c[0] + slide, c[1] - bounce], rot: -1.2 + (0.12 + 1.2) * Math.min(1, u * 1.1), inHand: false, who: "floor" };
}
const KNIFE_SLIDE = 300;
/** 刀最后停在屋里地上的地方 */
const KNIFE_FLOOR = (): V2 => {
  const from = sillAt(K.drop).palmL;
  return [from[0] + 110 + KNIFE_SLIDE, SILL[1] - 80];
};
/** 脚绳翻过窗台的那一点（屋子坐标）：她身边、近处那条腿那边 */
export const ropeSill = (): V2 => [SILL[0] + 270, SILL[1] - 6];

/** 屋子坐标 → 世界坐标 */
const toWorld = (q: V2): V2 => {
  const m = roomMatrix();
  const r = m.transformPoint(new DOMPoint(q[0], q[1]));
  return [r.x, r.y];
};

/** 画窗框上的她、翻出窗台拴在她脚踝上的那截脚绳、刀（世界坐标的画布：按 roomMatrix 换到屋子坐标里画） */
export function drawSill(g: CanvasRenderingContext2D, t: number, z: number) {
  const s = sillAt(t);
  const m = roomMatrix();
  g.save();
  g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  const lw = 1 / Math.sqrt(Math.max(0.3, z * m.a * SILL_S));
  const kn = knifeAt(t, s);
  // 掉在窗台里面地上的刀（落地以后在她身后的地上）
  if (kn.who === "floor" && t >= K.land) {
    g.save();
    g.translate(kn.c[0], kn.c[1]);
    g.scale(SILL_S * 0.9, SILL_S * 0.9);
    drawKnife(g, 0, 0, kn.rot);
    g.restore();
  }
  // 窗框的下框（窗台板）：她坐在上面，两条腿垂到窗外
  const wn = homeWindow();
  const half = wn.w / 2 / m.a;
  g.save();
  g.lineJoin = "round";
  g.fillStyle = "#8f7a72";
  g.strokeStyle = INK;
  g.lineWidth = 9 * lw;
  g.beginPath();
  g.rect(540 - half - 30, SILL[1] - 26, half * 2 + 60, 46);
  g.fill();
  g.stroke();
  g.fillStyle = "rgba(40,28,40,0.25)";
  g.fillRect(540 - half - 30, SILL[1] + 8, half * 2 + 60, 12);
  g.restore();
  // ④ 浮起来离开窗台：进窗以前画在窗前，进了窗由屋里画（roomAwayAt 的 visitor）
  if (t >= SH.lift0) {
    if (t < SH.inside) {
      const f = floatAt(t);
      g.save();
      g.translate(f.root[0], f.root[1]);
      g.scale(f.sc, f.sc);
      drawChengtuo(g, f.pose, { line: lw });
      g.restore();
    }
    g.restore();
    return;
  }
  // 白从头顶照下来：她身上一层冷光（叠在身后屋里的暖光上）
  drawGlow(g, s.head[0], s.head[1] - 200, 520, 0.18);
  g.save();
  g.translate(s.root[0], s.root[1]);
  g.scale(SILL_S, SILL_S);
  drawChengtuo(g, s.pose, { line: lw });
  g.restore();
  // 脚绳：从窗台边垂下去拴在她近处那只脚踝上（绷直），脚踝上绕一圈
  const r0 = ropeSill();
  const ak = s.ankleL;
  g.lineCap = "round";
  g.strokeStyle = INK;
  g.lineWidth = 13 * lw;
  g.beginPath();
  g.moveTo(r0[0], r0[1]);
  g.lineTo(ak[0] + 6, ak[1] - 10);
  g.stroke();
  g.strokeStyle = "#a08a6e";
  g.lineWidth = 7 * lw;
  g.stroke();
  g.save();
  g.translate(ak[0], ak[1] - 8);
  g.beginPath();
  g.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = 11 * lw;
  g.stroke();
  g.strokeStyle = "#a08a6e";
  g.lineWidth = 6 * lw;
  g.stroke();
  g.restore();
  // 刀：攥在近处那只手里，刀刃朝着绳子
  const pl = s.palmL;
  const ang = kn.rot;
  // 攥在手里、往下掉的时候画在她前面；他扔出去的刀朝着镜头飞出窗外（越来越大），刀刃一闪一闪
  if (kn.inHand || (kn.who === "floor" && t < K.land) || kn.who === "air") {
    const k = kn.who === "air" ? (kn.k ?? 1) * 0.9 : SILL_S * 0.9;
    g.save();
    g.translate(kn.c[0], kn.c[1]);
    g.scale(k, k);
    drawKnife(g, 0, 0, ang);
    g.restore();
    if (kn.who === "air") {
      const d = t - TH.rel;
      const a = 0.8 * Math.max(0, Math.sin(d * 26)) * Math.exp(-d / 0.4);
      if (a > 0.02) drawGlow(g, kn.c[0] + Math.cos(ang) * 40 * k, kn.c[1] + Math.sin(ang) * 40 * k, 50 * k, a);
    }
  }
  // 刀刃上一闪（白的光）：「脱」「活」
  for (const tg of [72.69, 73.35]) {
    const d = t - tg;
    if (d < -0.05 || d > 0.35) continue;
    const a = Math.exp(-((d - 0.04) ** 2) / 0.006);
    const tip = add(pl, [Math.cos(ang) * 58 * SILL_S, Math.sin(ang) * 58 * SILL_S]);
    drawGlow(g, tip[0], tip[1], 60 * SILL_S, 0.9 * a);
  }
  g.restore();
}

/** 她的胯在世界里的哪（镜头推向这里） */
export function sillWorld(t: number) {
  const s = sillAt(t);
  return { hip: toWorld(s.hip), head: toWorld(s.head) };
}

/**
 * 主歌二①的镜头：硬切进来是窗外远处的全景（白压在画面最上面，她那扇窗小小的在下面），按对数匀速一路慢慢推向窗框上的她
 * （头 0.25 秒柔和起步），73.89 推到她坐着的整个人占画面一半多；下一镜接着推
 */
export function sillCam(t: number): Cam {
  const w = homeWindow();
  const far = aim(w.x + w.w / 2 - 30, w.y + w.h, 540, 1640, 1.6);
  if (t >= FL.start) {
    // ⑥ 接着⑤同框的取景，跟着飘上来的他往上抬一点、凑近一点（窗一直盖住整个画面）
    const zi = zInside();
    const both = aim(...toWorld([470, 1100]), 540, 980, zi * 1.2);
    const upper = aim(...toWorld([480, 990]), 540, 980, zi * 1.34);
    return camLerp(both, upper, E.io(ph(t, FL.rise, FL.end + 0.5)));
  }
  if (t >= KN.start) {
    // ⑤ 切进屋里：近景对着结和他的手（屋里 2.6 倍，系的时候慢慢凑近一点）；「么」以后往上抬，退到她和他同框（屋里 1.2 倍）
    const zi = zInside();
    const k0 = knotPoint(KN.start);
    const close = aim(...toWorld([k0[0] - 30, k0[1] - 60]), 560, 1060, zi * 2.6 * (1 + 0.06 * E.io(ph(t, KN.start, KN.pull))));
    // 退到她和他同框：窗还盖住整个画面（不露出窗外的铁栏），对准点不低于屋子坐标 y 1130
    const both = aim(...toWorld([470, 1100]), 540, 980, zi * 1.2);
    return camLerp(close, both, E.io(ph(t, KN.tilt0, KN.end + 0.2)));
  }
  if (t > SH.start) {
    // ④ 从攥着的两只手上慢慢往后退，退回①开头那个取景（头顶压着白，那扇窗小小的在下面）：对数匀速，头尾各柔和一点
    const u = ph(t, SH.start, SH.end);
    const e = 0.14;
    const k = u < e ? (u * u) / (2 * e) / (1 - e) : u > 1 - e ? 1 - ((1 - u) * (1 - u)) / (2 * e) / (1 - e) : (u - e / 2) / (1 - e);
    return camLerp(sillCam(SH.start), far, k);
  }
  const a = sillWorld(T.start);
  const near = aim(a.hip[0], a.hip[1] - 20, 540, 1080, 9);
  const rate = Math.log(near.z / far.z) / ((T.end - T.start) * (1 - 0.07));
  if (t > T.end) {
    // ②：推的速度接着①，慢慢减下来（对数倍数按指数收住）；顺着她的视线往门那边挪，门口的他和窗台上的她同框
    const d = t - T.end;
    const tau = 0.16;
    const z = near.z * Math.exp(rate * tau * (1 - Math.exp(-d / tau)));
    const mid = toWorld([150, SILL[1] - 20]);
    let p = mix([a.hip[0], a.hip[1] - 20], mid, E.io(ph(t, K.turn0, K.open1)));
    // ③ 跟着冲过来的他挪回她身边；刀扔出去，顺着它往下看一点；停在两只攥在一起的手上（再推近一点）
    const back = toWorld([SILL[0] + 200, SILL[1] - 40]);
    p = mix(p, back, E.io(ph(t, TH.run0 + 0.05, TH.run1 + 0.2)));
    const dip = E.io(ph(t, TH.rel - 0.02, TH.rel + 0.45));
    p = [p[0], p[1] + 5 * dip];
    const zz = z * (1 + 0.1 * E.io(ph(t, TH.run1, TH.end + 0.3)));
    return aim(p[0], p[1], 540, 1080, zz);
  }
  const u = ph(t, T.start, T.end);
  const k = u < 0.14 ? (u * u) / (2 * 0.14) / (1 - 0.07) : (u - 0.07) / (1 - 0.07);
  const z = far.z * Math.pow(near.z / far.z, k);
  // 位置按「看得见的范围」走：对准点从窗台慢慢挪到她
  const w2 = (1 / far.z - 1 / z) / (1 / far.z - 1 / near.z);
  return { x: far.x + (near.x - far.x) * w2, y: far.y + (near.y - far.y) * w2, z, r: 0 };
}

// ——— 小石头 ———
const STONE = CAST.小石头穿妈妈的外套;
/** ⑥ 脱了那件橘色外套：他自己的米白毛衣 */
const STONE_BARE = { ...CAST.小石头, coat: undefined };
const stoneSpec = (t: number) => (t >= FL.off ? STONE_BARE : STONE);
const STONE2 = {
  /** 站在门口：裹着妈妈的外套，近处那只手攥着被割断的红绳（另一头拴在他脚踝上），哭着看她 */
  站: pose(4, { face: 0.6, ...legR(6, -8), ...legL(-6, -4), neck: -6, expression: "忍着哭", tears: 0.8, lookX: 0.6, lookY: 0.4 }, (l) => ({
    shoulderL: 30 + l,
    elbowL: 90,
    wristL: 0,
    handL: "grip",
    shoulderR: -6 + l,
    elbowR: 16,
    wristR: 0,
    handR: "relax",
  })),
  /** 弯腰捡刀：身子压下去、膝盖弯着，近处那只手伸到地上 */
  捡: pose(46, { face: 0.6, ...legR(60, -80), ...legL(30, -70), neck: 14, expression: "使劲", tears: 0.8, lookX: 0.3, lookY: 0.8 }, (l) => ({
    shoulderL: 60 + l,
    elbowL: 10,
    wristL: 0,
    handL: "grip",
    shoulderR: -20 + l,
    elbowR: 30,
    wristR: 0,
    handR: "open",
  })),
  /** 站起来往后一仰，攥着刀的近处那只手抡到身后（过肩扔） */
  抡: pose(-12, { face: 0.6, ...legR(16, -8), ...legL(-14, -10), neck: 10, expression: "使劲", teeth: 0.5, tears: 0.9, lookX: 0.6, lookY: -0.2 }, (l) => ({
    shoulderL: -130 + l,
    elbowL: -50,
    wristL: 0,
    handL: "grip",
    shoulderR: 50 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
  /** 扔出去：胳膊从身后过肩往前上方甩出去，身子往前一送 */
  扔: pose(18, { face: 0.6, ...legR(20, -10), ...legL(-16, -12), neck: 4, expression: "使劲", teeth: 0.3, tears: 1, lookX: 0.6, lookY: 0.2 }, (l) => ({
    shoulderL: 150 + l,
    elbowL: 0,
    wristL: 0,
    handL: "open",
    shoulderR: -30 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
  /** ④ 冲到窗的左边，远处那只手探出窗外够那扇铁栅栏门 */
  伸手: pose(20, { face: -0.85, ...legR(30, -20), ...legL(-20, -30), neck: 10, expression: "使劲", teeth: 0.4, tears: 1, lookX: -0.6, lookY: -0.2 }, (l) => ({
    shoulderL: -40 + l,
    elbowL: 30,
    wristL: 0,
    handL: "open",
    shoulderR: 110 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
  /** 把门往右一推：手跟着门甩过去 */
  推: pose(10, { face: -0.85, ...legR(24, -16), ...legL(-14, -24), neck: 4, expression: "使劲", teeth: 0.6, tears: 1, lookX: 0.2, lookY: -0.1 }, (l) => ({
    shoulderL: -30 + l,
    elbowL: 30,
    wristL: 0,
    handL: "open",
    shoulderR: 80 + l,
    elbowR: 40,
    wristR: 0,
    handR: "open",
  })),
  /** 关上了：站在铁栏后面，回过头仰着脸看浮在半空的她 */
  回头: pose(0, { face: -0.6, headTurn: 1, ...legR(10, -8), ...legL(-6, -4), neck: 30, expression: "忍着哭", tears: 1, lookX: 0.6, lookY: -1 }, (l) => ({
    shoulderL: -10 + l,
    elbowL: 20,
    wristL: 0,
    handL: "relax",
    shoulderR: 10 + l,
    elbowR: 30,
    wristR: 0,
    handR: "relax",
  })),
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
  /** 跪着攥着系在一起的绳子，仰头看浮在半空的她 */
  仰望她: pose(6, { face: 0.6, headTurn: -0.6, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: 34, expression: "忍着哭", tears: 1, lookX: -0.5, lookY: -1 }, (l) => ({
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
  /** 转过身攥住她的手（身子往她那边探一点），仰头哭着看她 */
  攥: pose(16, { face: -0.6, ...legR(8, -8), ...legL(-6, -4), neck: 24, expression: "忍着哭", tears: 1, lookX: -0.4, lookY: -0.7 }, (l) => ({
    shoulderL: -10 + l,
    elbowL: 20,
    wristL: 0,
    handL: "relax",
    shoulderR: 70 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
};
const KRUN: [number, Record<string, unknown>][] = [
  [0, KID.跑_落地],
  [0.22, KID.跑_下沉],
  [0.5, KID.跑_蹬地],
  [0.76, KID.跑_腾空],
];
const runKeys: MoveKey[] = [];
{
  const N = 4;
  const step = (TH.run1 - TH.run0) / N;
  for (let k = 0; k <= N; k++) {
    for (const [at, p] of KRUN) {
      if (k === N && at > 0) break;
      const q = (k % 2 === 0 ? p : swapSides(p as Angles)) as Angles;
      runKeys.push({ t: TH.run0 + (k + at) * step, ease: SMOOTH, p: { ...q, face: 0.85, expression: "忍着哭", tears: 1, lookX: 0.7, lookY: 0.2 } } as MoveKey);
    }
  }
}
/** ④ 撒开她的手，朝左冲到窗的左边（四步） */
const runLeft: MoveKey[] = [];
{
  const N = 4;
  const step = (SH.run1 - SH.let) / N;
  for (let k = 0; k <= N; k++) {
    for (const [at, p] of KRUN) {
      if (k === N && at > 0) break;
      const q = (k % 2 === 0 ? p : swapSides(p as Angles)) as Angles;
      runLeft.push({ t: SH.let + 0.02 + (k + at) * step, ease: SMOOTH, p: { ...q, face: -0.85, expression: "忍着哭", tears: 1, lookX: -0.7, lookY: 0 } } as MoveKey);
    }
  }
}
const stoneMove = live(
  [
    { t: 73, x: 0, p: STONE2.站 },
    { t: TH.run0 - 0.02, p: STONE2.站 },
    ...runKeys,
    { t: TH.pick - 0.06, ease: "inOut", p: STONE2.捡 },
    { t: TH.pick + 0.04, p: STONE2.捡 },
    { t: TH.wind - 0.04, ease: "inOut", p: STONE2.抡 },
    { t: TH.rel + 0.02, ease: "in", p: STONE2.扔 },
    { t: TH.rel + 0.1, ease: "out", p: STONE2.扔 },
    { t: TH.grab - 0.06, ease: "inOut", p: STONE2.攥 },
    { t: SH.let - 0.04, p: STONE2.攥 },
    ...runLeft,
    { t: SH.swing0, ease: "out", p: STONE2.伸手 },
    { t: SH.shut - 0.02, ease: "inOut", p: STONE2.推 },
    { t: SH.shut + 0.3, ease: "inOut", p: STONE2.回头 },
    { t: KN.start - 0.02, p: STONE2.回头 },
    // ⑤ 切进屋里：跪在椅子边系绳子
    { t: KN.start, ease: SMOOTH, p: STONE2.系 },
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
/** 他站在门洞里（屋子坐标：根在门洞中间的地上） */
const STONE_ROOT: V2 = [(DOOR.x0 + DOOR.x1) / 2 + 10, ROOM.floor];
/** 冲到刀跟前站住的地方（离窗近：地上靠前，画得大一点） */
const STONE_STOP = (): V2 => [KNIFE_FLOOR()[0] - 60, SILL[1] - 90];
/** 扔完刀走到她跟前攥她的手的地方 */
const STONE_NEAR = (): V2 => [SILL[0] + 268, SILL[1] - 90];
/** 离窗越近画得越大（透视）：地板最里面（墙根）是屋里的大小，窗台那里是 1.6 倍 */
const depthK = (y: number) => ROOM.s * (1 + 0.6 * Math.max(0, Math.min(1, (y - ROOM.floor) / (SILL[1] - ROOM.floor))));
/** 他这一刻（屋子坐标）：根、缩放、手心、刀的转角；捡刀、攥她的手按 IK */
function stoneAt(t: number) {
  const p: PoseIn = { ...stoneMove(t).pose };
  const u = E.io(ph(t, TH.run0, TH.run1));
  const stop = STONE_STOP();
  // 扔完刀两步走到她跟前；④ 冲到窗的左边
  const root0: V2 = mix(mix(STONE_ROOT, stop, u), STONE_NEAR(), E.io(ph(t, TH.rel + 0.08, TH.grab - 0.02)));
  const root: V2 =
    t >= FL.start ? floatRoot(t) : t >= KN.start ? TIE_SPOT : mix(root0, CAGE_SPOT, E.io(ph(t, SH.let + 0.02, SH.run1)));
  // ⑥ 飘起来时还在同一个远近（画多大不变）
  const k = depthK(t >= KN.start ? TIE_SPOT[1] : root[1]);
  const sc = k * STONE.scale;
  const face = (p.face as number | undefined) ?? 0;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / sc, (q[1] - root[1]) / sc];
  // 捡刀：近处那只手伸到地上的刀上
  const wPick = E.io(ph(t, TH.pick - 0.14, TH.pick)) * (1 - E.io(ph(t, TH.pick + 0.04, TH.pick + 0.16)));
  if (wPick > 0.001) p.armL = { ...(p.armL as object), to: loc(add(KNIFE_FLOOR(), [-6, -10])), ik: wPick } as PoseIn["armL"];
  // 攥住她的手（④ 往回一拉，手跟着浮起来的她往上走一点，撒开）
  const wGrab = E.io(ph(t, TH.grab - 0.2, TH.grab)) * (1 - E.io(ph(t, SH.let - 0.04, SH.let + 0.08)));
  if (wGrab > 0.001) {
    const pull = t > SH.lift0 ? floatAt(Math.min(t, SH.let)).palmL : handMeet();
    p.armR = { ...(p.armR as object), to: loc(mix(handMeet(), pull, E.io(ph(t, SH.lift0, SH.let)))), ik: wGrab } as PoseIn["armR"];
  }
  // ⑤ 两只手在结上一圈圈绕（近处那只绕着麻绳转），「么」往外一拉；之后近处那只攥着结
  if (t >= FL.start) {
    // ⑥ 远处那只手往上伸着够她；飘上去以后攥住她的手（IK）
    const w = E.io(ph(t, FL.clasp - 0.3, FL.clasp));
    if (w > 0.001) p.armR = { ...(p.armR as object), to: loc(CLASP), ik: w } as PoseIn["armR"];
  } else if (t >= KN.start) {
    const kp = knotPoint(t);
    const ang = knotAngle(t);
    const d: V2 = [Math.cos(ang), Math.sin(ang)];
    const n: V2 = [-d[1], d[0]];
    const w = 2 * Math.PI * 3 * ph(t, KN.wrap0, KN.wrap1);
    const pull = E.out(ph(t, KN.pull - 0.06, KN.pull + 0.06));
    const circ: V2 = [kp[0] + n[0] * 16 * Math.cos(w) - d[0] * 10, kp[1] + n[1] * 16 * Math.cos(w) + 12 * Math.sin(w) - d[1] * 10];
    const handL: V2 = mix(circ, [kp[0] - d[0] * 46, kp[1] - d[1] * 46 + 6], pull);
    const handR: V2 = mix([kp[0] + d[0] * 18, kp[1] + d[1] * 18 + 4], [kp[0] + d[0] * 52, kp[1] + d[1] * 52 - 4], pull);
    const up = E.io(ph(t, KN.tilt0, KN.tilt0 + 0.3));
    p.armL = { ...(p.armL as object), to: loc(mix(handL, [kp[0] - 8, kp[1] + 4], up)), ik: 1 } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc(handR), ik: 1 - up } as PoseIn["armR"];
  }
  // ④ 远处那只手探到窗的左边、抓住铁栅栏门，跟着门往右推一下
  const wDoor = E.io(ph(t, SH.swing0 - 0.1, SH.swing0)) * (1 - E.io(ph(t, SH.shut - 0.08, SH.shut + 0.06)));
  if (wDoor > 0.001) {
    const hand: V2 = [-470 + 220 * E.in2(ph(t, SH.swing0, SH.shut)), SILL[1] - 380];
    p.armR = { ...(p.armR as object), to: loc(hand), ik: wDoor } as PoseIn["armR"];
  }
  const j = castJoints(stoneSpec(t), p);
  const at = (q: number[]): V2 => [root[0] + q[0] * k, root[1] + q[1] * k];
  const palm = at(j.palmL);
  const elbow = at(j.elbowL);
  const knifeRot = Math.atan2(palm[1] - elbow[1], palm[0] - elbow[0]);
  return { pose: p, root, k, palm, knifeRot, ankleL: at(j.ankleL) };
}
/** ⑥ 他的根：站起来（原地），飘起来往她那边上去，攥住手以后被她拉近一点 */
function floatRoot(t: number): V2 {
  const up = E.out(ph(t, FL.rise, FL.clasp + 0.05));
  const near = E.io(ph(t, FL.clasp, FL.end + 0.3));
  const r: V2 = mix([TIE_SPOT[0], TIE_SPOT[1] + 20], [560, 1250], up);
  return [r[0] - 20 * near, r[1] - 50 * near + 8 * Math.sin(t * 2.3) * up];
}
/** ⑥ 两只手攥在一起的地方 */
const CLASP: V2 = [470, 770];
/** ⑤ 他跪在椅子边系绳子的地方 */
const TIE_SPOT: V2 = [540, 1740];
/** 结系在她的脚绳上：离椅子腿那头不远（跪着的他手正好够得着） */
function knotPoint(t: number): V2 {
  const f = floatAt(t);
  const pull = t > KN.pull ? 5 * Math.exp(-(t - KN.pull) / 0.08) : 0;
  return [KNOT[0] + (f.ankleL[0] - KNOT[0]) * 0.15, KNOT[1] + (f.ankleL[1] - KNOT[1]) * 0.15 + pull];
}
const knotAngle = (t: number) => {
  const f = floatAt(t);
  return Math.atan2(f.ankleL[1] - KNOT[1], f.ankleL[0] - KNOT[0]);
};
/** ④ 他冲到窗的左边站住的地方 */
const CAGE_SPOT: V2 = [-380, SILL[1] - 90];
/** 两只手攥在一起的地方（她垂下来的手和他伸过来的手之间） */
const handMeet = (): V2 => [SILL[0] + 214, SILL[1] - 356];

function drawStone(g: CanvasRenderingContext2D, t: number) {
  const b = stoneAt(t);
  const p = b.pose;
  g.save();
  g.translate(b.root[0], b.root[1]);
  g.scale(b.k, b.k);
  drawPerson(g, stoneSpec(t), p, 0, 0, 1.4);
  g.restore();
  // 被割断的红绳：一头拴在近处那只脚踝上；在门口时攥在手里，冲进来时撒开、拖在他身后的地上
  const j = castJoints(stoneSpec(t), p);
  const at = (q: number[]): V2 => [b.root[0] + q[0] * b.k, b.root[1] + q[1] * b.k];
  const ank = at([j.ankleL[0], j.ankleL[1] - 4]);
  const hand = at(j.palmL);
  const held = t < TH.run0;
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  const rope = new Path2D();
  if (t >= KN.start) {
    // ⑤ 一头拴在他脚踝上，一头系在她的脚绳上（绕好以前那一截攥在他手里）
    const kp = knotPoint(t);
    const end = t < KN.wrap1 ? mix(hand, kp, E.io(ph(t, KN.wrap0, KN.wrap1))) : kp;
    rope.moveTo(ank[0], ank[1]);
    rope.quadraticCurveTo((ank[0] + end[0]) / 2 - 20, Math.max(ank[1], end[1]) + 20, end[0], end[1]);
  } else if (held) {
    rope.moveTo(hand[0], hand[1]);
    rope.quadraticCurveTo((hand[0] + ank[0]) / 2 + 26 * b.k, Math.max(hand[1], ank[1]) + 30 * b.k, ank[0], ank[1]);
    rope.moveTo(hand[0], hand[1]);
    rope.quadraticCurveTo(hand[0] - 8 * b.k, hand[1] + 26 * b.k, hand[0] - 2 * b.k, hand[1] + (46 + 3 * Math.sin(t * 3)) * b.k);
  } else {
    // 拖在身后的地上：从脚踝往后（往门那边）贴着地
    const floorY = b.root[1] - 4;
    const back = Math.min(1, (t - TH.run0) / 0.2);
    rope.moveTo(ank[0], ank[1]);
    rope.quadraticCurveTo(ank[0] - 40 * b.k, floorY, ank[0] - 120 * b.k * back - 40, floorY + 2);
    rope.lineTo(ank[0] - 210 * b.k * back - 60, floorY - 6 * Math.sin(t * 5));
  }
  g.strokeStyle = INK;
  g.lineWidth = 6.5 * (b.k / ROOM.s);
  g.stroke(rope);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6 * (b.k / ROOM.s);
  g.stroke(rope);
  g.restore();
  // 捡起来以后攥在手里的刀（扔出去以后由 drawSill 画在窗外）
  if (t >= TH.pick && t < TH.rel) {
    g.save();
    g.translate(b.palm[0], b.palm[1]);
    g.scale(b.k * 0.9, b.k * 0.9);
    drawKnife(g, 0, 0, b.knifeRot);
    g.restore();
  }
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
    g.fillStyle = "#8a6a5a";
    g.fillRect(cx - 200 * k, lo - 24 * k, 400 * k, 30 * k);
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
  const w = 115 * k;
  const ht = 46 * k;
  const heap = new Path2D();
  heap.moveTo(cx - w, floor);
  heap.quadraticCurveTo(cx - w * 0.95, floor - ht * 0.9 - settle, cx - w * 0.2, floor - ht - settle);
  heap.quadraticCurveTo(cx + w * 0.45, floor - ht * 1.12 - settle, cx + w * 0.92, floor - ht * 0.45);
  heap.quadraticCurveTo(cx + w * 1.08, floor - 4, cx + w * 0.86, floor);
  heap.closePath();
  part(g, heap, orange, shade, lw, [5, 4]);
  g.save();
  g.clip(heap);
  g.fillStyle = "#8a6a5a";
  g.fillRect(cx - w * 1.2, floor - ht * 0.32, w * 2.4, ht);
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

/** 这一刻屋里的样子：脚绳拉到窗口、门开了多少（敲门时门扇震一下）、门口的他 */
export function roomAwayAt(t: number): RoomAway {
  const rattle = 0.03 * (Math.exp(-Math.max(0, t - K.knock1) / 0.05) * (t > K.knock1 ? 1 : 0) + Math.exp(-Math.max(0, t - K.knock2) / 0.05) * (t > K.knock2 ? 1 : 0));
  const door = Math.max(rattle, 0.9 * E.io(ph(t, K.open0, K.open1)));
  // ④ 她浮进屋里以后由屋里画（在他后面），脚绳从椅子腿直接拉到她脚踝上
  const inside = t >= SH.inside;
  const f = inside ? floatAt(t) : null;
  return {
    rope: f ? f.ankleL : ropeSill(),
    door,
    visitor:
      t > K.knock1 - 0.2
        ? (g) => {
            if (f) {
              g.save();
              g.translate(f.root[0], f.root[1]);
              g.scale(f.sc, f.sc);
              drawChengtuo(g, f.pose, { line: 0.8 });
              g.restore();
            }
            drawKnot(g, t);
            drawLooseCoat(g, t);
            drawStone(g, t);
          }
        : undefined,
  };
}
/** ④ 铁栅栏门：「沉」探出手抓住往右一推，越转越快，「默」关上，弹一下 */
export function cageAt(t: number) {
  if (t < SH.swing0) return -0.32;
  const u = ph(t, SH.swing0, SH.shut);
  if (t < SH.shut) return -0.32 + 1.32 * u * u;
  const d = t - SH.shut;
  return 1 - 0.05 * Math.exp(-d / 0.07) * Math.abs(Math.sin(d * 34));
}
