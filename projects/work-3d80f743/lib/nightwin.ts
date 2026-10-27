// 主歌二①–④（72.02–79.56）2026-10-25 用户重新设计（「还是不行，按照我的改」），同一天又按用户的四句改了一次（「还是不对」）：
// 镜头在屋里，对着窗那面墙（lib/winwall.ts），一个镜头到底。她没穿铁靴是失重的：她的「下」是真实的上（所以睡在天花板上）。
// 镜头倒过来就是站在她的世界里看。刀、小石头、铁靴有分量，按真实的重力掉——倒着的画面里就是「往上掉」。
// ① 72.02–73.89「忍着想要挣脱的生活」：间奏最后的小节线上硬切进来，画面已经倒着。她坐在窗的上框上（倒过来看就是她的窗台），
//    膝盖立着、脚踩在框上，攥着那把小刀抵在脚踝边的脚绳上，整句都在犹豫（用户：「这句唱完才开始拉绳子」）：「挣」压上去，
//    「脱」停住、手发抖、刀刃一闪，「的」松开一点，「生活」闭上眼。镜头几乎不动，只往刀和绳子推 6%，「脱」以后停住。
// ② 73.89–75.93「做出不想做的承诺」（用户：「开始拉一次，结束拉一次」）：「做」脚绳被（画面外的）小石头猛地一拉：她被扯离窗框、
//    转过去一半（画面里横过来：头朝左，拴着的脚被拽向右上），转的时候刀从手里甩出去，往画面上方（真实的地板）掉出画面，
//    「不想」落地「当」（画面外）。她横着悬在半空，回头看着窗外的白，「的承」闭上眼。镜头一震、往后让一点框住横过来的她。
//    「诺」第二下：镜头和她一起转回正（屋子在画面里转 180°，她转回头朝上），她被拽向屋里；镜头一边转一边往后拉远，
//    露出地上攥着绳子的小石头——两个人都在画面里。她低头看见他，他仰头哭着看她。
// ③ 75.93–77.94「列车上坐错站的乘客」：他接着一把一把往下拽（76.01、76.51），她一截截落下来；77.01 他撒开绳子上前一步抱住她的腿，
//    往下一坠，77.51 她踩进地上立着的那双铁靴「咚」——分量回来了，他还抱着她。镜头往两个人推近一点。
// ④ 77.94–79.56「困惑着沉默」：他松开手，低头看见脚边那把刀（他妈妈的刀），就地蹲下捡起来，站起来看一眼，「默」从她头顶扔出窗——
//    刀翻着、闪着光飞进夜里，往白那边掉下去不见了。镜头跟着刀抬到窗口，停住，两个人都不说话。

import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H as SH, W as SW, kick, ph } from "./cam";
import { INK, drawGlow, drawGrade } from "./world";
import { ARMS, LIMP, live, smoothTrack } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { drawKnife } from "./knife";
import { ROOM, bootLow, looseBoot } from "./room";
import { WIN, W_FLOOR, applyWall, drawOutside, drawWallLight, drawWallSet, wallToScreen } from "./winwall";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const rot = (p: V2, a: number): V2 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const unit = (d: V2): V2 => {
  const L = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / L, d[1] / L];
};

export const NW_T = {
  start: beatAt(144),
  /** ① 整句都在犹豫（用户：「这句唱完才开始拉绳子」）：「挣」刀刃压到绳子上，「脱」停住、手发抖、刀刃一闪，「的」松开一点，「生活」闭上眼 */
  press: 72.45,
  stop: 72.69,
  ease: 72.96,
  close: 73.14,
  /** ② 「做」第一下拉：扯离窗框、转过去一半；刀甩出手，「不想」落地（用户：「开始拉一次，结束拉一次」） */
  pull1: 73.89,
  slip: 73.93,
  clang: 74.4,
  /** 「诺」第二下：镜头和她一起转回正（到 turn1），一边往后拉远到两个人（wide0 → wide1），转正时她低头看见他 */
  pull2: 75.3,
  turn1: 75.92,
  wide0: 75.38,
  wide1: 76.45,
  /** ③ 两把拽（踩在拍上）、上前一步抱住她的腿、踩进铁靴「咚」 */
  hauls: [beatAt(152), beatAt(153)] as const,
  hug: beatAt(154),
  land: beatAt(155),
  /** ④ 他松开、看见脚边的刀、蹲下捡、站起来看一眼、往后一抡、「默」扔出去 */
  look: 77.94,
  pick: 78.26,
  up: 78.46,
  wind: 78.62,
  rel: beatAt(157) + 0.29,
  end: 79.56,
};
const T = NW_T;
const [H1, H2] = T.hauls;
/** ② 第二下转回正的进度（镜头和她一起）：一拽起来就转，慢慢停稳 */
const turnE = (t: number) => {
  const u = ph(t, T.pull2, T.turn1);
  return 0.6 * E.out(u) + 0.4 * E.io(u);
};

// ——— 位置（窗墙坐标，真实的上下：y 朝下是真实的往下） ———
/** 上框那块板朝屋里的那一面（倒过来就是她的窗台面） */
const LEDGE_Y = WIN.y0 + 4;
/** ① 她的胯（她是倒着的：胯在板底下，身子往真实的下方伸）。朝着画面右边坐（倒着看），脚在胯的真实左边 */
const SEAT: V2 = [640, LEDGE_Y + 34];
/** 他站的地方（窗左边的地上：①里在画面外），③ 上前一步抱住她的地方 */
const BOY_SPOT: V2 = [-20, 1772];
const HUG_SPOT: V2 = [70, 1772];
/** 那双铁靴立在他右边，她落进去；刀掉在他和铁靴中间、靠墙一点的地上（他跪下去手够得着，也不被他的腿和铁靴挡住；④ 他就地跪下捡） */
const BOOT_Y = 1764;
const BOOT_X: [number, number] = [230, 300];
const KNIFE_REST: V2 = [152, 1686];
/** 脚绳另一头：从他手里垂到地上，往镜头这边拖出画面 */
const FAR: V2 = [-180, 3000];
/** ① 脚绳往他手里去的那一头（他在画面外） */
const ROPE_TO: V2 = [70, 1390];
/** ② 第二下以后她拴着的脚踝在哪（浮在铁靴上方，慢慢往下带一点）；③ 两把拽下来以后在哪 */
const A2: V2 = [284, 1050];
const A2B: V2 = [276, 1100];
const A3: V2 = [268, 1440];
/** 地上离镜头越近画得越大：墙根是屋里的大小，往镜头这边 280 是 1.6 倍 */
const floorK = (y: number) => ROOM.s * (1 + 0.6 * Math.max(0, Math.min(1, (y - W_FLOOR) / 280)));
const STAND_S = floorK(BOOT_Y);

// ——— 她（姿势按她自己的上下写：① 她的世界里坐着；画的时候整个人再转 θ） ———
/** ① 坐在框上（倒着的画面里朝右）：远处的膝盖立起来，拴着的那条腿往前伸、脚踩在框上，弯着腰看着脚踝边的刀 */
const SIT = pose(30, { face: 0.75, ground: false, float: 0, ...legL(122, -62, 0), ...legR(140, -134, -2), neck: -22, expression: "难过", sad: 0.9, tears: 0.6, lookX: 0.45, lookY: 1 }, (l) => ({
  ...armL(40, 40, 0, "grip", l),
  ...armR(-20, 30, 0, "open", l),
}));
const PRESS: Angles = { ...SIT, neck: -32, expression: "忍着哭", teeth: 0.4, tears: 0.8 };
const HESIT: Angles = { ...SIT, neck: -28, expression: "犹豫", wobble: 0.6, tears: 1 };
const CLOSE: Angles = { ...SIT, neck: -18, expression: "闭眼", sad: 1, tears: 1, smile: -0.3 };
/** 「挣」被脚踝一把扯离窗框：拴着的那条腿（L）扯直，另一条蜷着，身子往后仰，两只手甩开（刀甩出手），吓一跳 */
const SWING = pose(-14, { face: -0.6, ground: false, float: 0.7, ...legL(-4, -4, -40), ...legR(-20, -76, -30), neck: 16, expression: "吓一跳", tears: 1, lookX: 0.2, lookY: -0.4 }, (l) => ({
  ...armL(150, 30, 0, "open", l),
  ...armR(120, 40, 0, "open", l),
}));
/** 横着悬在半空：手慢慢落下来，回头看着窗外的白（她的「下」） */
const HANG = pose(-6, { face: -0.6, ground: false, float: 0.7, ...legL(-4, -4, -40), ...legR(-16, -70, -30), neck: -16, expression: "含泪", sad: 1, tears: 1, lookX: -0.2, lookY: 1 }, (l) => ({
  ...armL(70, 40, 0, "open", l),
  ...armR(96, 30, 0, "open", l),
}));
const HANG_CLOSE: Angles = { ...HANG, neck: -24, expression: "闭眼", smile: -0.3 };
/** ② 「做」第二下：又一惊，手甩到头顶 */
const YANK = pose(-6, { face: -0.6, ground: false, float: 0.7, ...legL(-6, -6, -44), ...legR(-14, -70, -30), neck: -10, expression: "吓一跳", tears: 1, lookX: 0.1, lookY: -0.6 }, (l) => ({
  ...armL(140, 60, 0, "open", l),
  ...armR(150, 20, 0, "open", l),
}));
/** 转正以后浮着（拴着的腿朝下），低头看着拽她的人 */
const FLOAT = pose(-4, { face: -0.6, ground: false, float: 0.7, rot: 2, ...legL(-6, -6, -44), ...legR(-12, -62, -30), neck: -18, expression: "含泪", sad: 1, tears: 1, lookX: -0.5, lookY: 0.9 }, (l) => ({
  ...armL(110, 30, 10, "open", l),
  ...armR(124, 26, 10, "open", l),
}));
/** 看清是他：忍着哭 */
const SEE: Angles = { ...FLOAT, neck: -26, expression: "忍着哭", teeth: 0.2, lookX: -0.6, lookY: 1 };
/** ③ 两把之间：手慢慢落下来，往下看他 */
const DRIFT = pose(-2, { face: -0.6, ground: false, float: 0.7, rot: 4, ...legL(-6, -8, -44), ...legR(-12, -60, -30), neck: -24, expression: "含泪", sad: 0.95, tears: 1, lookX: -0.5, lookY: 1 }, (l) => ({
  ...armL(96, 40, 10, "open", l),
  ...armR(112, 34, 10, "open", l),
}));
const HAULED = pose(-8, { face: -0.6, ground: false, float: 0.7, rot: 6, ...legL(-8, -6, -44), ...legR(-16, -76, -30), neck: -18, expression: "吓一跳", tears: 1, lookX: -0.4, lookY: 1 }, (l) => ({
  ...armL(142, 30, 10, "open", l),
  ...armR(162, 22, 10, "open", l),
}));
/** 他抱住她的腿：腿并拢伸直往下够靴口，两只手垂下来伸向他 */
const HUGGED = pose(6, { face: -0.6, ground: false, float: 0.3, ...legL(-2, -4, -20), ...legR(2, -6, -20), neck: -30, expression: "忍着哭", tears: 1, lookX: -0.6, lookY: 1 }, (l) => ({
  ...armL(18, 16, 0, "open", l),
  ...armR(24, 18, 0, "open", l),
}));
/** 「咚」落进铁靴：膝盖一弯，头发、围巾一下沉下来 */
const LAND = pose(10, { face: -0.6, ground: false, float: 0, ...legR(24, -40, 0), ...legL(14, -32, 0), neck: -24, expression: "含泪", tears: 1, lookX: -0.7, lookY: 0.9 }, (l) => ({
  ...armL(12, 16, 0, "relax", l),
  ...armR(14, 20, 0, "relax", l),
}));
/** 站在铁靴里，低头看着抱着她腿的他 */
const STAND = pose(4, { face: -0.6, ground: false, float: 0, ...legR(5, -4, 0), ...legL(-4, -3, 0), neck: -24, expression: "含泪", sad: 0.9, tears: 1, lookX: -0.7, lookY: 0.9 }, (l) => ({
  ...armL(4, 10, 0, "relax", l),
  ...armR(6, 14, 6, "relax", l),
}));
/** ④ 看着他捡起刀（困惑：眉头皱着），刀扔出去时抬头看着窗 */
const STAND_KNIFE: Angles = { ...STAND, expression: "担心", tears: 0.9, lookX: -0.8, lookY: 0.8 };
const STAND_WIN: Angles = { ...STAND, neck: 22, expression: "含泪", tears: 1, lookX: 0.3, lookY: -0.9 };
const STAND_HIM: Angles = { ...STAND, neck: -18, expression: "含泪", sad: 1, tears: 1, lookX: -0.8, lookY: 0.7 };

const herMove = live(
  [
    { t: 71.5, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: SIT },
    { t: T.press - 0.1, p: SIT },
    { t: T.press + 0.14, ease: "inOut", p: PRESS },
    { t: T.stop, p: PRESS },
    { t: T.stop + 0.12, ease: "out", p: HESIT },
    { t: T.close, p: HESIT },
    { t: T.close + 0.26, ease: "inOut", p: CLOSE },
    { t: T.pull1 - 0.02, p: CLOSE },
    // 扯离窗框的一下先甩开手（刀甩出去），再转过身（face 过 0 时 IK 已经撤了）
    { t: T.pull1 + 0.06, ease: "out", p: { ...SWING, face: 0.75 } },
    { t: T.pull1 + 0.22, ease: "inOut", p: SWING },
    { t: T.pull1 + 0.6, ease: "inOut", p: HANG },
    // 「的承」闭上眼（认了），「诺」又被拽一把
    { t: 74.95, p: HANG },
    { t: 75.22, ease: "inOut", p: HANG_CLOSE },
    { t: T.pull2 - 0.02, p: HANG_CLOSE },
    { t: T.pull2 + 0.1, ease: "out", p: YANK },
    // 转正了：低头看清拽她的是他
    { t: T.turn1, ease: "inOut", p: SEE },
    { t: H1 - 0.03, p: SEE },
    { t: H1 + 0.07, ease: "out", p: HAULED },
    { t: H1 + 0.36, ease: "inOut", p: DRIFT },
    { t: H2 - 0.03, p: DRIFT },
    { t: H2 + 0.07, ease: "out", p: HAULED },
    { t: T.hug - 0.05, ease: "inOut", p: DRIFT },
    { t: T.hug + 0.14, ease: "out", p: HUGGED },
    { t: T.land - 0.05, ease: "inOut", p: { ...HUGGED, ...legR(5, -4, 0), ...legL(-4, -3, 0) } },
    { t: T.land, p: { ...HUGGED, ...legR(5, -4, 0), ...legL(-4, -3, 0) } },
    { t: T.land + 0.07, ease: "out", p: LAND },
    { t: T.land + 0.36, ease: "inOut", p: STAND },
    { t: T.look + 0.1, ease: "inOut", p: STAND_KNIFE },
    { t: T.rel - 0.05, p: STAND_KNIFE },
    { t: T.rel + 0.2, ease: "inOut", p: STAND_WIN },
    { t: 79.15, p: STAND_WIN },
    { t: 79.45, ease: "inOut", p: STAND_HIM },
    { t: 80, p: STAND_HIM },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 71, springs: LIMP, follow: 0 },
);

/**
 * 她这一刻的转角（真实坐标里画的时候整个人转多少）：① 倒着（π），「挣」转过去一半（π/2，甩过头一点再回来，悬着时轻轻晃）；
 * ②「做」和镜头一起转回正（→ 0；镜头 r 同时 π → 2π，画面里她转 90°、屋子转 180°，同一个方向）
 */
const herTheta = (t: number) => {
  const d = t - T.pull1;
  const e1 = d <= 0 ? 0 : E.out(Math.min(1, d / 0.42)) + (d > 0.42 ? 0.1 * Math.exp(-(d - 0.42) / 0.22) * Math.sin((d - 0.42) * 10) : 0);
  const sway = 0.05 * Math.sin((t - T.pull1) * 2.2) * ph(t, T.pull1 + 0.4, T.pull1 + 1);
  return (Math.PI - (Math.PI / 2) * e1 + sway) * (1 - turnE(t));
};
/** 她离镜头多远（画多大）：① 在窗口；被拽向屋里、离镜头近一点；③ 落到铁靴那一远近 */
const herScale = (t: number) => {
  const a = ROOM.s + 0.06 * E.out(ph(t, T.pull1, T.pull1 + 0.4)) + (1.44 - ROOM.s - 0.06) * E.out(ph(t, T.pull2, T.wide1));
  return a + (STAND_S - a) * E.io(ph(t, H1 - 0.1, T.land));
};

/** 落地时（铁靴里）站着的根：按「咚」那一刻的姿势算一次 */
let STAND_ROOT: V2 | null = null;
function standRoot(): V2 {
  if (!STAND_ROOT) {
    const p: PoseIn = { ...herMove(T.land).pose, items: { boots: true, bricks: 0, gloves: false } };
    const j = jointsOf(p);
    const sole = Math.max(j.ankleL[1], j.ankleR[1]) + bootLow(0, 1);
    STAND_ROOT = [(BOOT_X[0] + BOOT_X[1]) / 2 - ((j.ankleL[0] + j.ankleR[0]) / 2) * STAND_S, BOOT_Y - sole * STAND_S];
  }
  return STAND_ROOT;
}

/** ① 坐着时拴着的脚踝在哪（踩在框上）：「挣」从这里被扯走 */
let SEAT_ANKLE: V2 | null = null;
const seatAnkle = (): V2 => (SEAT_ANKLE ??= herSeat(T.pull1 - 0.01).ankleL);
/** 一把拽：t0 起 dur 秒拽到（0 → 1），过头一点再弹回来 */
const bump = (t: number, t0: number, dur: number) => {
  const d = t - (t0 + dur);
  const over = d > 0 ? 0.08 * Math.exp(-d / 0.09) * Math.sin(d * 30) : 0;
  return E.out(ph(t, t0 - 0.01, t0 + dur)) + over;
};
/** 「挣」以后拴着的脚踝在哪（她按它放）：第一下沿着绳子往他那边扯一截；第二下拽到铁靴上方的半空；③ 两把各拽一截到他够得着的地方 */
function ankleAt(t: number): V2 {
  const a0 = seatAnkle();
  const d1 = unit([ROPE_TO[0] - a0[0], ROPE_TO[1] - a0[1]]);
  const s1 = 230 * bump(t, T.pull1, 0.14);
  // 悬着时绳子绷着，脚踝跟着身子轻轻晃
  const sw = 8 * Math.sin((t - T.pull1) * 2.2) * ph(t, T.pull1 + 0.4, T.pull1 + 1);
  let p: V2 = [a0[0] + d1[0] * s1 - d1[1] * sw, a0[1] + d1[1] * s1 + d1[0] * sw];
  p = mix(p, mix(A2, A2B, E.soft(ph(t, T.pull2 + 0.4, H1))), bump(t, T.pull2, 0.24));
  const k3 = 0.5 * E.out(ph(t, H1 - 0.02, H1 + 0.14)) + 0.5 * E.out(ph(t, H2 - 0.02, H2 + 0.14));
  return mix(p, A3, k3);
}

/** ① 坐在框上（按胯放，倒着） */
function herSeat(t: number) {
  const p: PoseIn = { ...herMove(t).pose };
  return place(t, p, SEAT, "hip");
}
/** 摆好她：anchor 是胯或拴着的脚踝在真实坐标里的位置；θ、大小按时间；手的 IK 在 place 以后另加 */
function place(t: number, p: PoseIn, anchor: V2, by: "hip" | "ankle") {
  const th = herTheta(t);
  const s = herScale(t);
  // 头发、围巾的「下」：失重时往真实的上漂（她倒着时就是她的下）；落进铁靴以后分量回来
  const fl = 0.75 * (1 - E.io(ph(t, T.land - 0.05, T.land + 0.2)));
  p.gravity = [-Math.sin(th) * (1 - 2 * fl), Math.cos(th) * (1 - 2 * fl)];
  const j = jointsOf(p);
  const ref = by === "hip" ? j.hip : j.ankleL;
  const toW = (q: number[]): V2 => {
    const r = rot([(q[0] - j.hip[0]) * s, (q[1] - j.hip[1]) * s], th);
    return [hipW[0] + r[0], hipW[1] + r[1]];
  };
  const off = rot([(ref[0] - j.hip[0]) * s, (ref[1] - j.hip[1]) * s], th);
  const hipW: V2 = [anchor[0] - off[0], anchor[1] - off[1]];
  const toL = (w: V2): V2 => {
    const r = rot([(w[0] - hipW[0]) / s, (w[1] - hipW[1]) / s], -th);
    return [r[0] + j.hip[0], r[1] + j.hip[1]];
  };
  return { pose: p, hipW, th, s, j, toW, toL, ankleL: toW(j.ankleL), palmL: toW(j.palmL), palmR: toW(j.palmR), head: toW(j.head), hip: hipW };
}

/** 她这一刻：① 按胯坐在框上，攥刀的手 IK 到绳子上、另一只手撑着框；「挣」起按脚踝；他抱住以后往下坠进铁靴 */
function herAt(t: number) {
  const p: PoseIn = { ...herMove(t).pose };
  if (t >= T.land) p.items = { boots: true, bricks: 0, gloves: false };
  let h = t < T.pull1 ? place(t, p, SEAT, "hip") : place(t, p, ankleAt(t), "ankle");
  // 他抱住她的腿往下一坠：根落到站在铁靴里的地方（越来越快，「咚」到底）
  const d = E.in2(ph(t, T.hug, T.land));
  if (d > 0) {
    const sr = standRoot();
    const j = jointsOf(p);
    const standHip: V2 = [sr[0] + j.hip[0] * STAND_S, sr[1] + j.hip[1] * STAND_S];
    h = place(t, p, t >= T.land ? standHip : mix(h.hipW, standHip, d), "hip");
  }
  // 落进铁靴以后，近处那只手（R）放到抱着她腿的他头上；他松开去捡刀时拿开
  const wHead = E.io(ph(t, T.land + 0.05, T.land + 0.45)) * (1 - E.io(ph(t, T.look, T.look + 0.2)));
  if (wHead > 0.001) {
    const top = hisHeadTop(t);
    const armR0 = p.armR;
    p.armR = { ...(armR0 as object), to: h.toL(top), ik: 1 } as PoseIn["armR"];
    const palm0 = h.toW(jointsOf(p).palmR);
    p.armR = { ...(armR0 as object), to: h.toL([2 * top[0] - palm0[0], 2 * top[1] - palm0[1]]), ik: wHead } as PoseIn["armR"];
    h = { ...h, palmL: h.toW(jointsOf(p).palmL), palmR: h.toW(jointsOf(p).palmR), j: jointsOf(p) };
  }
  const wK = 1 - E.out(ph(t, T.pull1, T.slip));
  const wB = 1 - E.out(ph(t, T.pull1, T.pull1 + 0.1));
  if (wB > 0.001) {
    // ① 攥刀的手：刀刃横着压在脚踝边的绳子上（「挣」压上去，「脱」停住、手发抖，「的」松开一点）；「做」一扯，手甩开、刀甩出去（IK 撤掉）；
    // 另一只手撑在身后的框上
    const r = ropeAt(h.ankleL, KNIFE_ON);
    const press = E.io(ph(t, T.press - 0.1, T.press + 0.14)) * (1 - 0.6 * E.io(ph(t, T.ease, T.ease + 0.3)));
    const tremble = (t > T.stop ? 4 * Math.sin(t * 70) * Math.exp(-(t - T.stop) / 0.5) : 0) + 1.5 * Math.sin(t * 47);
    // 刀刃（方向同 knifeAt 里她手上的刀）横着搭在绳子上：没压时刀刃中间在绳子她这边一点，压上去时刀刃中间落到绳子上
    const bd: V2 = [Math.cos(h.th + 0.4), Math.sin(h.th + 0.4)];
    const back = 24 * 0.9 * h.s + 30 * (1 - press) + tremble;
    const knifeAt: V2 = [r[0] - bd[0] * back, r[1] - bd[1] * back];
    // 朝右时素材库整套镜像：IK 的目标按没镜像的坐标给
    const ikTo = (w: V2): V2 => {
      const q = h.toL(w);
      return (p.face ?? 0) > 0 ? [-q[0], q[1]] : q;
    };
    const armL0 = p.armL;
    if (wK > 0.001) {
      p.armL = { ...(armL0 as object), to: ikTo(knifeAt), ik: 1 } as PoseIn["armL"];
      // IK 对准的是手腕：按手心差多少再挪一次，让手心（刀）正好落在要的地方
      const palm0 = h.toW(jointsOf(p).palmL);
      p.armL = { ...(armL0 as object), to: ikTo([2 * knifeAt[0] - palm0[0], 2 * knifeAt[1] - palm0[1]]), ik: wK } as PoseIn["armL"];
    }
    p.armR = { ...(p.armR as object), to: ikTo([SEAT[0] + 120, LEDGE_Y + 6]), ik: wB } as PoseIn["armR"];
    h = { ...h, palmL: h.toW(jointsOf(p).palmL), palmR: h.toW(jointsOf(p).palmR), j: jointsOf(p) };
  }
  return h;
}
/** ① 脚绳上离脚踝 a 有 d 远的那一点（绳子从脚踝往他手里拉过去） */
function ropeAt(a: V2, d: number): V2 {
  const u = unit([ROPE_TO[0] - a[0], ROPE_TO[1] - a[1]]);
  return [a[0] + u[0] * d, a[1] + u[1] * d];
}
/** ① 刀压在绳子上离脚踝多远 */
const KNIFE_ON = 56;
/** 她的两条腿在高度 y 那里的中点（他抱住的地方）：胯 → 膝 → 脚踝 */
function legAt(h: ReturnType<typeof herAt>, y: number): V2 {
  const m = (a: number[], b: number[]): V2 => h.toW([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  const pts = [m(h.j.hip, h.j.hip), m(h.j.kneeL, h.j.kneeR), m(h.j.ankleL, h.j.ankleR)];
  if (y <= pts[0][1]) return pts[0];
  for (let i = 0; i < 2; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (y <= b[1]) return mix(a, b, (y - a[1]) / Math.max(1, b[1] - a[1]));
  }
  return pts[2];
}

// ——— 小石头：站在窗左边的地上，攥着她的脚绳一把一把往下拽；③ 上前一步抱住她的腿；④ 就地蹲下捡起刀，从窗口扔出去 ———
const STONE = CAST.小石头穿妈妈的外套;
const HIM = {
  /** 攥着绳子，仰头看着她（朝右），身子往后坐一点 */
  拉: pose(-8, { face: 0.6, ...legR(14, -10), ...legL(-16, -14), neck: 18, expression: "坚定", tears: 0.8, lookX: 0.5, lookY: -0.8 }, (l) => ({
    ...armL(60, 40, 0, "grip", l),
    ...armR(80, 30, 0, "grip", l),
  })),
  /** 一把拽下来：身子往后一仰 */
  拉_仰: pose(-18, { face: 0.6, ...legR(20, -14), ...legL(-20, -18), neck: 14, expression: "使劲", teeth: 0.6, tears: 1, lookX: 0.5, lookY: -0.7 }, (l) => ({
    ...armL(50, 50, 0, "grip", l),
    ...armR(70, 40, 0, "grip", l),
  })),
  /** 攥着绳子仰头看着她，哭着 */
  仰望: pose(-6, { face: 0.6, ...legR(12, -8), ...legL(-12, -10), neck: 26, expression: "忍着哭", tears: 1, lookX: 0.5, lookY: -0.9 }, (l) => ({
    ...armL(60, 40, 0, "grip", l),
    ...armR(80, 30, 0, "grip", l),
  })),
  /** 上前一步：撒开绳子扑过去 */
  扑: pose(16, { face: 0.6, ...legR(30, -20), ...legL(-24, -30), neck: 16, expression: "使劲", tears: 1, lookX: 0.5, lookY: -0.6 }, (l) => ({
    ...armL(80, 30, 0, "open", l),
    ...armR(70, 40, 0, "open", l),
  })),
  /** 抱住她的腿：脸贴在她腿上，闭着眼哭 */
  抱: pose(10, { face: 0.6, ...legR(10, -8), ...legL(-14, -12), neck: 4, expression: "闭眼", sad: 1, tears: 1 }, (l) => ({
    ...armL(80, 60, 0, "grip", l),
    ...armR(70, 70, 0, "grip", l),
  })),
  /** 往下一坠：身子往后坐，把她拽下来 */
  抱_坠: pose(-6, { face: 0.6, ...legR(30, -40), ...legL(10, -40), neck: 8, expression: "使劲", teeth: 0.5, tears: 1 }, (l) => ({
    ...armL(80, 60, 0, "grip", l),
    ...armR(70, 70, 0, "grip", l),
  })),
  /** 她落进铁靴：还抱着，仰头看着她 */
  抱_仰: pose(-4, { face: 0.6, ...legR(10, -8), ...legL(-14, -12), neck: 28, expression: "忍着哭", tears: 1, lookX: 0.4, lookY: -0.9 }, (l) => ({
    ...armL(80, 60, 0, "grip", l),
    ...armR(70, 70, 0, "grip", l),
  })),
  /** ④ 松开手，低头看见脚边那把刀 */
  看刀: pose(8, { face: 0.6, ...legR(8, -6), ...legL(-8, -6), neck: -20, expression: "吓一跳", tears: 1, lookX: 0.5, lookY: 0.9 }, (l) => ({
    ...armL(16, 30, 0, "relax", l),
    ...armR(-6, 16, 0, "relax", l),
  })),
  /**
   * 就地蹲下：单膝跪下去、上身只往前倾一点，后面那只脚脚尖着地，近处那只手伸到脚边的刀上，远处那只手垂在膝盖边
   * （原来前倾 46°、后脚翘在半空，外套跟着身子斜成一块板，看着像侧身摔倒；检查页 sheets/捡刀.ts）
   */
  蹲: pose(26, { face: 0.6, ...legR(92, -96), ...legL(-4, -92, -96), thighR: 0.65, neck: -6, expression: "忍着哭", tears: 1, lookX: 0.3, lookY: 0.9 }, (l) => ({
    ...armL(40, 10, 0, "grip", l),
    ...armR(-14, 34, 0, "relax", l),
  })),
  /** 站起来低头看着手里的刀（妈妈的刀） */
  看: pose(8, { face: 0.6, ...legR(8, -6), ...legL(-8, -6), thighR: 1, neck: -20, expression: "忍着哭", sad: 1, tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => ({
    ...armL(50, 70, 0, "grip", l),
    ...armR(-6, 16, 0, "relax", l),
  })),
  /** 往后一仰，攥着刀的手抡到身后（过肩扔） */
  抡: pose(-12, { face: 0.6, ...legR(16, -8), ...legL(-14, -10), neck: 10, expression: "使劲", teeth: 0.5, tears: 0.9, lookX: 0.6, lookY: -0.6 }, (l) => ({
    ...armL(-130, -50, 0, "grip", l),
    ...armR(50, 20, 0, "open", l),
  })),
  /** 扔出去：胳膊从身后过肩往前上方甩出去，身子往前一送 */
  扔: pose(18, { face: 0.6, ...legR(20, -10), ...legL(-16, -12), neck: 16, expression: "使劲", teeth: 0.3, tears: 1, lookX: 0.6, lookY: -0.8 }, (l) => ({
    ...armL(150, 0, 0, "open", l),
    ...armR(-30, 20, 0, "open", l),
  })),
  /** 扔完：手垂下来，回头看着她（不说话） */
  回头: pose(2, { face: 0.6, ...legR(8, -6), ...legL(-8, -6), neck: 22, expression: "忍着哭", tears: 1, lookX: 0.4, lookY: -0.8 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(-6, 16, 0, "relax", l),
  })),
};
const himMove = live(
  [
    { t: 72, x: 0, p: HIM.拉 },
    // ② 两下拽（第一下在画面外）；转正以后攥着，仰头哭着看她
    ...[T.pull1, T.pull2].flatMap((P): MoveKey[] => [
      { t: P - 0.04, p: HIM.拉 },
      { t: P + 0.1, ease: "out", p: HIM.拉_仰 },
      { t: P + 0.4, ease: "inOut", p: HIM.拉 },
    ]),
    { t: T.turn1 - 0.1, ease: "inOut", p: HIM.仰望 },
    // ③ 两把
    ...[H1, H2].flatMap((P): MoveKey[] => [
      { t: P - 0.04, ease: "inOut", p: HIM.拉 },
      { t: P + 0.12, ease: "out", squash: 0.035, p: HIM.拉_仰 },
      { t: P + 0.32, ease: "inOut", squash: 0, p: HIM.拉 },
    ]),
    // 撒开绳子上前一步，抱住她的腿，往下一坠
    { t: T.hug - 0.26, p: HIM.拉 },
    { t: T.hug - 0.08, ease: "inOut", p: HIM.扑 },
    { t: T.hug + 0.06, ease: "out", p: HIM.抱 },
    { t: T.land - 0.02, ease: "inOut", p: HIM.抱_坠 },
    { t: T.land + 0.08, ease: "out", squash: 0.04, p: HIM.抱 },
    { t: T.land + 0.4, ease: "inOut", squash: 0, p: HIM.抱_仰 },
    // ④
    { t: T.look, p: HIM.抱_仰 },
    { t: T.look + 0.12, ease: "out", p: HIM.看刀 },
    { t: T.pick, ease: "inOut", p: HIM.蹲 },
    { t: T.up, ease: "inOut", p: HIM.看 },
    { t: T.wind - 0.02, p: HIM.看 },
    { t: T.wind + 0.12, ease: "inOut", p: HIM.抡 },
    { t: T.rel + 0.02, ease: "in", p: HIM.扔 },
    { t: T.rel + 0.12, ease: "out", p: HIM.扔 },
    { t: 79.3, ease: "inOut", p: HIM.回头 },
    { t: 80, p: HIM.回头 },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0 }, idle: true, seed: 73, springs: ARMS, follow: 0 },
);
const himRoot = (t: number): V2 => mix(BOY_SPOT, HUG_SPOT, E.io(ph(t, T.hug - 0.26, T.hug)));
/** 他头顶在哪（按不加 IK 的姿势算：她的手放上去用，不能反过来依赖她） */
function hisHeadTop(t: number): V2 {
  const root = himRoot(t);
  const k = floorK(root[1]);
  const j = castJoints(STONE, himMove(t).pose);
  return [root[0] + j.head[0] * k + 6, root[1] + j.head[1] * k - 64];
}
/** 他这一刻：根、大小、两只手心；拽绳子、抱腿、捡刀按 IK */
function himAt(t: number) {
  const p: PoseIn = { ...himMove(t).pose };
  const root = himRoot(t);
  const k = floorK(root[1]);
  const sc = k * STONE.scale;
  const H = 590 * sc;
  const loc = (q: V2): V2 => [(-(q[0] - root[0])) / sc, (q[1] - root[1]) / sc];
  // 拽绳子：两只手在绳子上（她的脚踝 → 他胸口），一把拽到胸口、攥着，到下一把之前才再往前倒手
  const wRope = 1 - E.io(ph(t, T.hug - 0.26, T.hug - 0.1));
  if (wRope > 0.001) {
    const a = herAt(t).ankleL;
    const chest: V2 = [root[0] + 40, root[1] - H * 0.6];
    const dir = unit([a[0] - chest[0], a[1] - chest[1]]);
    let reach = 150;
    const pulls = [T.pull1, T.pull2, H1, H2];
    for (let i = 0; i < pulls.length; i++) {
      const P = pulls[i];
      if (t < P - 0.04) break;
      const next = pulls[i + 1];
      const back = next === undefined ? 0 : E.io(ph(t, Math.max(P + 0.13, next - 0.35), next - 0.06));
      reach = 150 + (40 - 150) * E.out(ph(t, P - 0.04, P + 0.13)) * (1 - back);
    }
    const on = (d: number): V2 => [chest[0] + dir[0] * d, chest[1] + dir[1] * d];
    p.armL = { ...(p.armL as object), to: loc(on(reach + 30)), ik: wRope } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc(on(reach - 30)), ik: wRope } as PoseIn["armR"];
  }
  // 抱住她的腿：两只手搂在她腿上他胸口那么高的地方（她往下坠时腿从他怀里滑下去）
  const wHug = E.io(ph(t, T.hug - 0.12, T.hug + 0.04)) * (1 - E.io(ph(t, T.look, T.look + 0.14)));
  if (wHug > 0.001) {
    const h = herAt(t);
    const y0 = root[1] - H * 0.52;
    const q = legAt(h, y0);
    p.armL = { ...(p.armL as object), to: loc([q[0] - 30, y0 + 8]), ik: wHug } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc([q[0] - 46, y0 - 16]), ik: wHug } as PoseIn["armR"];
  }
  // 捡刀：近处那只手伸到脚边的刀上
  const wPick = E.io(ph(t, T.pick - 0.14, T.pick)) * (1 - E.io(ph(t, T.pick + 0.04, T.up)));
  if (wPick > 0.001) p.armL = { ...(p.armL as object), to: loc([KNIFE_REST[0] - 6, KNIFE_REST[1] - 12]), ik: wPick } as PoseIn["armL"];
  const j = castJoints(STONE, p);
  const at = (q: number[]): V2 => [root[0] + q[0] * k, root[1] + q[1] * k];
  const palm = at(j.palmL);
  const elbow = at(j.elbowL);
  return { pose: p, root, k, palmL: palm, palmR: at(j.palmR), knifeRot: Math.atan2(palm[1] - elbow[1], palm[0] - elbow[0]) };
}

/** 他的头（世界坐标）和他这一刻画的大小（k：随地板远近的缩放）；终章第三声的回忆（scenes/recall.ts）溶进来时用它对上他的脸 */
export function nwHisHead(t: number): { head: V2; k: number } {
  const h = himAt(t);
  const j = castJoints(STONE, h.pose);
  return { head: [h.root[0] + j.head[0] * h.k, h.root[1] + j.head[1] * h.k], k: h.k };
}

// ——— 刀 ———
/**
 * 刀这一刻：她手里 →「挣」一扯甩出手，往（真实的）下掉、往他那边偏（倒着的画面里往右上掉出画面），「的」落在他脚边、弹一下 →
 * 他手里 → 从她头顶扔出窗（越飞越远、越小，翻着），出了窗往下掉
 */
type KnifeState = { c: V2; rot: number; s: number; out: boolean; flat?: boolean };
function knifeAt(t: number): KnifeState | null {
  if (t < T.slip) {
    const h = herAt(t);
    return { c: h.palmL, rot: h.th + 0.4, s: h.s * 0.9, out: false };
  }
  if (t < T.pick) {
    const h0 = herAt(T.slip);
    const from = h0.palmL;
    const fallT = T.clang - T.slip;
    const d = t - T.slip;
    const u = Math.min(1, d / fallT);
    const y = from[1] + (KNIFE_REST[1] - from[1]) * u * u;
    const x = from[0] + (KNIFE_REST[0] - from[0]) * u;
    const after = d - fallT;
    const bounce = after > 0 ? 18 * Math.exp(-after / 0.07) * Math.abs(Math.sin(after * 30)) : 0;
    const r0 = h0.th + 0.4;
    const s = h0.s * 0.9 + (floorK(KNIFE_REST[1]) * 0.9 - h0.s * 0.9) * u;
    // 落地以后刀尖朝着镜头躺着（画面里短一截，露在他的腿和铁靴中间）；落地那一下在画面外
    return { c: [x, y - bounce], rot: after > 0 ? 1.2 : r0 + 9 * d, s, out: false, flat: after > 0 };
  }
  if (t < T.rel) {
    const b = himAt(t);
    return { c: b.palmL, rot: b.knifeRot, s: b.k * 0.9, out: false };
  }
  // 扔出窗：从他手里往窗洞里飞（高高地从她头顶上过去，越来越远、越来越小），过了窗那一面往下掉（只在窗洞里看得见）
  const b0 = himAt(T.rel);
  const d = t - T.rel;
  const u = Math.min(1, d / 0.36);
  const v = E.out(u);
  const tgt: V2 = [(WIN.x0 + WIN.x1) / 2 + 40, WIN.y0 + 300];
  const c = mix(b0.palmL, tgt, v);
  const arc = -520 * Math.sin(Math.PI * v);
  const fall = d > 0.36 ? 0.5 * 6000 * (d - 0.36) ** 2 : 0;
  const s = b0.k * 0.9 * (1 - 0.6 * v) * (d > 0.36 ? Math.exp(-(d - 0.36) * 1.5) : 1);
  return { c: [c[0], c[1] + arc + fall], rot: b0.knifeRot + 16 * d, s, out: u > 0.9 };
}

// ——— 镜头 ———
const centerOf = (h: ReturnType<typeof herAt>): V2 => h.toW([(h.j.shoulderL[0] + h.j.shoulderR[0] + 2 * h.j.hip[0]) / 4, (h.j.shoulderL[1] + h.j.shoulderR[1] + 2 * h.j.hip[1]) / 4]);
let FOLLOW: ((t: number) => V2) | null = null;
/** 「做」以后镜头跟着她（晚一点到，带惯性）：身子的中间往拴着的脚踝挪一点（横过来时框住整个人，头不出画） */
function follow(t: number): V2 {
  if (!FOLLOW)
    FOLLOW = smoothTrack(
      (tt) => {
        const h = herAt(tt);
        return mix(centerOf(h), h.ankleL, 0.2);
      },
      T.pull1 - 0.05,
      T.end,
      13,
    );
  return FOLLOW(t);
}
/** ②「不想」刀落地以后推向她的脸：脸在世界里的位置（悬着时取一次）、推完脸在画面上的位置、推多少 */
let HANG_FACE: V2 | null = null;
const hangFace = (): V2 => (HANG_FACE ??= herAt(74.75).head);
const FACE_TO: V2 = [310, 970];
const Z_FACE = 1.14;
/** 推近的进度：「不想」刀落地起越推越慢（「诺」被拽的时候还在动），「诺」一拽，镜头被拽开 */
const faceE = (t: number) => E.settle(ph(t, T.clang + 0.05, T.clang + 1.25)) * (1 - E.out(ph(t, T.pull2, T.pull2 + 0.25)));
/** 推近 f 倍，同时把世界里的一点 p 挪到画面上的 s（e 是进度；镜头转着也对） */
function pushTo(c: Cam, p: V2, s: V2, f: number, e: number): Cam {
  if (e <= 0) return c;
  const s0 = wallToScreen(c, p);
  const z = c.z * Math.pow(f, e);
  const dx = s0[0] + (s[0] - s0[0]) * e - SW / 2;
  const dy = s0[1] + (s[1] - s0[1]) * e - SH / 2;
  const cs = Math.cos(-c.r);
  const sn = Math.sin(-c.r);
  return { ...c, x: p[0] - (dx * cs - dy * sn) / z, y: p[1] - (dx * sn + dy * cs) / z, z };
}
/** ① 镜头推完停在哪（窗墙坐标；倒着看，往真实的左上挪就是画面里往右下） */
const CAM1: V2 = [575, 700];
/** ① 横过来以后退到多少倍（她整个人横着在画面里） */
const Z_HANG = 1.12;
/** ② 拉远以后两个人都在画面里：他在左下、她浮在右上，窗在她身后 */
const WIDE: V2 = [150, 1010];
const Z_WIDE = 1.06;
/** ③ 第二把：镜头被她带着往下一截、往前挤一点 */
const STEP: V2 = [150, 1090];
const Z_STEP = 1.11;
/** ③ 抱住以后推近两个人（两张脸在画面上 4 成，脚下留着地上的刀，窗在她身后露一截） */
const PAIR: V2 = [185, 1300];
const Z_PAIR = 1.32;
/** ④ 他跪下去捡刀：顺着他的视线跟着往下多少 */
const KNEEL_DY = 85;
/** ④ 刀扔出窗：抬到窗口，窗和窗下的两个人都在画面里（他不贴画面左边） */
const WV: V2 = [350, 1095];
const Z_WV = 1.12;
/** ④ 静着的时候往两个人那边很慢地推 */
const HUSH: V2 = [170, 1250];
/** 以世界里的一点 p 为中心推近 f 倍（p 在画面上不动） */
const pushAt = (c: Cam, p: V2, f: number): Cam => ({ ...c, x: p[0] + (c.x - p[0]) / f, y: p[1] + (c.y - p[1]) / f, z: c.z * f });
/**
 * 镜头（窗墙坐标）：① 倒着，对着窗和坐在框上的她，几乎不动、很慢地推向刀和绳子；「挣」一震，往后让到 1.12 倍、跟着横过来的她（他还在画面外）；
 * ②「做」和她一起转回正（r π → 2π），一边转一边往后拉远到两个人；
 * ③ 第二把镜头被她带着往下一截、往前挤一点（晚一点到，带着惯性）；他扑上去抱住时屏一下，抱住起柔和起步、越推越慢地推近两个人
 *   （拥抱不猛推，温暖靠光），跟着她落进铁靴；每一把一沉，「咚」一沉一顶；
 * ④ 他低头看刀、跪下去捡，镜头顺着他的视线跟着往下，站起来跟着回来；看刀、往后抡时屏住；扔出去跟着刀抬到窗口（刀在前、镜头晚一点），
 *   之后不停死：往两个人那边很慢地推，到切还在动（沉默）
 */
export function nwCam(t: number): Cam {
  const PI = Math.PI;
  // ① 一进来就是这个取景，只往刀和绳子推 6%，「脱」以后停住（犹豫要停得住）
  const u1 = E.settle(ph(t, T.start, T.stop + 0.12));
  let c: Cam = { x: CAM1[0] + 24 * (1 - u1), y: CAM1[1] - 40 * (1 - u1), z: 1.34 * (1 + 0.06 * u1), r: PI };
  c = { ...c, x: c.x + 2 * Math.sin(t * 1.3), y: c.y + 2 * Math.sin(t * 0.9 + 1) };
  if (t < T.pull1) return c;
  // 「做」：被她一把带过去（起步就快、很快停住），往后让一点、跟着她；对准点不往他那边去（x ≥ 600：他在倒着的画面右边外面）
  const f = follow(t);
  const w1 = E.out(ph(t, T.pull1 + 0.02, T.pull1 + 0.38));
  c = { ...c, x: c.x + (Math.max(f[0], 600) - c.x) * w1, y: c.y + (f[1] - c.y) * w1, z: c.z * Math.pow(Z_HANG / c.z, w1) };
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, T.pull1, 0.09)) };
  // 「不想」刀落地（她手里什么都没了）：以她的脸为中心越推越慢地推近，脸挪到画面左边三分之一；她回头看白、闭上眼（认了）
  if (t < T.pull2) return pushTo(c, hangFace(), FACE_TO, Z_FACE, faceE(t));
  // ②「做」：和她一起转回正，跟着她，再往后拉远到两个人
  c = { ...c, r: PI * (1 + turnE(t)) };
  const fx = f[0] + (Math.max(f[0], 600) - f[0]) * (1 - E.io(ph(t, T.pull2, T.turn1)));
  c = { ...c, x: fx, y: f[1] };
  const ww = E.io(ph(t, T.wide0, T.wide1));
  c = { ...c, x: c.x + (WIDE[0] - c.x) * ww, y: c.y + (WIDE[1] - c.y) * ww, z: Z_HANG * Math.pow(Z_WIDE / Z_HANG, ww) };
  c = { ...c, z: c.z * (1 + 0.035 * kick(t, T.pull2, 0.09)) };
  c = pushTo(c, hangFace(), FACE_TO, Z_FACE, faceE(t));
  if (t < H1) return c;
  const to = (a: Cam, p: V2, z: number, w: number): Cam => ({ ...a, x: a.x + (p[0] - a.x) * w, y: a.y + (p[1] - a.y) * w, z: a.z * Math.pow(z / a.z, w) });
  // ③ 第二把：被她带着往下一截、往前挤一点（晚一点到）；他撒手扑过去时屏住
  c = to(c, STEP, Z_STEP, E.out(ph(t, H2 + 0.02, H2 + 0.34)));
  // 抱住：柔和起步、越推越慢地推近两个人，跟着她往下落进铁靴（「咚」以后还在很慢地凑近）
  c = to(c, PAIR, Z_PAIR, E.settle(ph(t, T.hug, T.hug + 1.3)));
  // ④ 他低头看刀、跪下去：顺着他的视线跟着往下；站起来跟着回来，看刀、往后抡时屏住
  const w4a = E.io(ph(t, T.look + 0.04, T.pick + 0.06)) * (1 - E.io(ph(t, T.pick + 0.08, T.up + 0.1)));
  c = { ...c, y: c.y + KNEEL_DY * w4a };
  // 扔出去：跟着刀抬到窗口（刀在前，镜头晚一点），之后不停死，往两个人那边很慢地推
  c = to(c, WV, Z_WV, E.out(ph(t, T.rel - 0.03, T.rel + 0.5)));
  c = pushAt(c, HUSH, 1 + 0.03 * ph(t, T.rel + 0.1, T.end));
  // 冲击（套在所有分支外面）：每一把一沉，「咚」一沉一顶，捡起刀一顿
  for (const P of [H1, H2]) c = { ...c, y: c.y + (14 * kick(t, P + 0.03, 0.1)) / c.z };
  c = { ...c, y: c.y + (18 * kick(t, T.land, 0.1)) / c.z, z: c.z * (1 + 0.02 * kick(t, T.land, 0.12)) };
  return { ...c, z: c.z * (1 + 0.012 * kick(t, T.pick, 0.12)) };
}
/** 抱住起两个人身边的一团暖光（画在人后面，不给人物染色）：满屋夜色里只有他们暖 */
const warmAt = (t: number) => 0.2 * E.settle(ph(t, T.hug - 0.05, T.hug + 0.8));
/** ④ 扔完以后静着：四周慢慢压暗 */
const hushAt = (t: number) => 0.12 * E.soft(ph(t, T.rel + 0.3, T.end));
/** ② 刀落地到「诺」：她认了，四周慢慢收暗；被拽回来、转正看见他时松开 */
const resignAt = (t: number) => 0.14 * E.soft(ph(t, T.clang, T.pull2)) * (1 - E.out(ph(t, T.pull2, T.turn1)));
/** 镜头一震（画面像素）：两下拽、两把拉、抱住、「咚」 */
function nwShake(t: number) {
  return 9 * kick(t, T.pull1, 0.08) + 8 * kick(t, T.pull2, 0.08) + 4 * (kick(t, H1 + 0.03, 0.1) + kick(t, H2 + 0.03, 0.1)) + 3 * kick(t, T.hug, 0.08) + 9 * kick(t, T.land, 0.1);
}

// ——— 画 ———
function strokeRope(g: CanvasRenderingContext2D, p: Path2D) {
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.stroke(p);
  g.strokeStyle = "#a08a6e";
  g.lineWidth = 6.5;
  g.stroke(p);
  g.restore();
}
/** 她的脚绳：从拴着的脚踝拉到他手里（①在画面外），再从他手里垂到地上、往镜头这边拖出画面；他撒了手以后从她的靴口垂到地上 */
function drawRope(g: CanvasRenderingContext2D, t: number, h: ReturnType<typeof herAt>) {
  const a = t >= T.land ? h.toW([(h.j.ankleL[0] * 2 + h.j.kneeL[0]) / 3, (h.j.ankleL[1] * 2 + h.j.kneeL[1]) / 3]) : h.ankleL;
  const b = himAt(t);
  const floor = b.root[1] + 6;
  const p = new Path2D();
  if (t < T.hug - 0.1) {
    const top = b.palmL;
    const low = b.palmR;
    p.moveTo(a[0], a[1]);
    p.lineTo(top[0], top[1]);
    p.lineTo(low[0], low[1]);
    p.quadraticCurveTo(low[0] + 20, floor, low[0] - 60, floor);
    p.lineTo(FAR[0], FAR[1]);
  } else {
    // 撒了手：绳子从她脚下垂到地上，从他身后拖到镜头这边
    const f2 = BOOT_Y + 8;
    p.moveTo(a[0], a[1]);
    p.quadraticCurveTo(a[0] - 20, f2, a[0] - 120, f2 + 4);
    p.quadraticCurveTo(BOY_SPOT[0], f2 + 16, FAR[0], FAR[1]);
  }
  strokeRope(g, p);
}
function drawHer(g: CanvasRenderingContext2D, h: ReturnType<typeof herAt>, lw: number) {
  g.save();
  g.translate(h.hipW[0], h.hipW[1]);
  g.rotate(h.th);
  g.scale(h.s, h.s);
  g.translate(-h.j.hip[0], -h.j.hip[1]);
  drawChengtuo(g, h.pose, { line: lw });
  g.restore();
}
function drawKnifeAt(g: CanvasRenderingContext2D, k: KnifeState) {
  g.save();
  g.translate(k.c[0], k.c[1]);
  if (k.flat) {
    // 躺在地上、朝着镜头：沿刀身压短
    g.rotate(k.rot);
    g.scale(k.s * 0.55, k.s);
    drawKnife(g, 0, 0, 0);
  } else {
    g.scale(k.s, k.s);
    drawKnife(g, 0, 0, k.rot);
  }
  g.restore();
}

/** 主歌二①–④ 一帧（t：作品时间） */
export function drawNightWindow(g: CanvasRenderingContext2D, base: DOMMatrix, grain: HTMLCanvasElement, t: number) {
  const c = nwCam(t);
  const sh: [number, number] = (() => {
    const k = nwShake(t);
    return [k * Math.sin(t * 71.3), k * Math.sin(t * 63.7 + 2.1)];
  })();
  const h = herAt(t);
  const b = himAt(t);
  const kn = knifeAt(t);
  const lw = 1 / Math.sqrt(Math.max(0.5, c.z));
  drawOutside(g, base, c, t);
  // 扔出窗的刀：过了窗那一面就在墙后面（只从窗洞里露出来）
  if (kn && kn.out) {
    applyWall(g, base, c, sh);
    drawKnifeAt(g, kn);
    const a = 0.8 * Math.exp(-((t - T.rel - 0.45) ** 2) / 0.004);
    if (a > 0.02) drawGlow(g, kn.c[0], kn.c[1], 60, a);
  }
  applyWall(g, base, c, sh);
  drawWallSet(g);
  drawGlow(g, 175, 1380, 700, warmAt(t));
  // 地上的东西：落在地上的刀（靠墙，在铁靴和他后面）、铁靴
  const onFloor = t >= T.clang - 0.02 && t < T.pick;
  if (kn && onFloor) drawKnifeAt(g, kn);
  if (t < T.land) for (const x of BOOT_X) looseBoot(g, x, BOOT_Y - bootLow(0, STAND_S), 0, STAND_S);
  // 她；脚绳在他手里时画在她前面（从脚踝往他那边、往镜头这边拉），撒了手以后垂在地上（她后面）
  if (t >= T.hug - 0.1) drawRope(g, t, h);
  drawHer(g, h, lw);
  if (t < T.hug - 0.1) drawRope(g, t, h);
  // ① 白从窗外照在她身上
  if (t < T.turn1) drawGlow(g, h.head[0], h.head[1], 300 * h.s, 0.12 * (1 - ph(t, T.pull2, T.turn1)));
  // 他
  g.save();
  g.translate(b.root[0], b.root[1]);
  g.scale(b.k, b.k);
  drawPerson(g, STONE, b.pose, 0, 0, b.k * c.z);
  g.restore();
  // 刀（手里、往下掉的路上）
  if (kn && !kn.out && !onFloor) {
    drawKnifeAt(g, kn);
    if (t < T.slip)
      for (const tg of [T.stop, 73.35]) {
        const d = t - tg;
        if (d > -0.05 && d < 0.35) drawGlow(g, kn.c[0], kn.c[1], 70, 0.9 * Math.exp(-((d - 0.04) ** 2) / 0.006));
      }
  }
  applyWall(g, base, c, sh);
  drawWallLight(g, 1);
  drawGlow(g, (WIN.x0 + WIN.x1) / 2, WIN.y0 + 60, 300, 0.12);
  drawGrade(g, base, grain, 0.6, 0.3 + resignAt(t) + hushAt(t));
}
