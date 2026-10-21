// 三「明天见」①「发着光的半平米」（88.02–89.91；发 88.17 着 88.26 光 88.53 的 88.68 半 88.83 平 89.16 米 89.43，照第二幕
// 「两块五的签字笔」同一段旋律的字距；每秒一下重拍 88.02、89.02…，音乐是满的）：早上。镜头从⑧仰头看的天花板往下摇回侧面的屋子
// （和⑦往上抬正好反过来），摇的时候溶过去，时间往后跳一点：他已经起来了，穿回那件下摆缝着铅的外套、穿上鞋，站在桌子前面的地上，
// 攥着她的脚绳；早上的太阳透过铁栏在地上照出一小块亮的「半平米」，她那两只铁靴被他摆在这块光里。他一把一把（88.52、89.02、89.52，
// 三把踩在拍上）把还睡着的她从天花板的床上拉下来：她从被子里滑出来，脚先下来，整个人从横着转成竖着，头发往上漂，闭着眼；
// 拉下来的绳子在他脚边盘成一圈圈。89.9 她飘在那两只铁靴上面，脚尖离靴口一点点。
// 三②「胡乱哼唱的旋律」（89.91–91.95；胡 89.88 乱 90.06 哼 90.30 唱 90.54 的 90.75 旋 90.87 律 91.17，照「东拼西凑的词句」的字距；
// 90.02、91.02 重拍）：同一个镜头。她在铁靴上面慢慢睁开眼，往下看见自己的铁靴和攥着绳子的他（睡着时飘歪了一点）；
// 他往前一步蹲下，把两只铁靴推到她脚底下，站起来仰着头朝她伸出手——别像我妈妈那样飞走。她犹豫了一下，转过头看了一眼窗外，
// 再回过头来看着他，伸下手，一边往下踩进铁靴，91.02「咚」落回地上，两只手正好攥在一起。他笑了；她低头看着他，也笑了一点。
// 镜头接着①慢慢凑近，「咚」一震，再一路凑近两张脸。
// 坐标都是屋子坐标（lib/room.ts），屋子按 setRoomAway 画：她、他、绳子、铁靴、地上的光从这里的钩子画进去。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, camLerp, kick, ph } from "./cam";
import { INK, drawGlow, part } from "./world";
import { ARMS, LIMP, live } from "./motion";
import { legL, legR } from "./poses";
import { CHEN2 } from "./poses2";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { BED_DX, KNOT, ROOM, type RoomAway, bootLow, looseBoot, strokeRope } from "./room";
import { aimRoom } from "./write";
import { DOWN_PX, downPx } from "./bed";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const MORN_T = {
  start: beatAt(176),
  /** 从仰头看的天花板溶回侧面的屋子（时间在这里跳过去：他已经起来了） */
  mix0: 88.1,
  mix1: 88.4,
  /** 镜头往下摇到桌前的他和地上那块光（E.settle，和仰头看的画面一起走，见 bed.ts 的 downPx） */
  tilt1: 89.1,
  /** 三把拉绳（踩在拍上） */
  pulls: [beatAt(177), beatAt(178), beatAt(179)],
  end: 89.91,
};
const M = MORN_T;
export const HUM_T = {
  start: MORN_T.end,
  /** 睁开眼（睡着时飘歪了一点） */
  wake0: 89.96,
  wake1: 90.26,
  /** 他往前一步、蹲下把铁靴推到她脚底下（靴子在地上擦着滑过去）、站起来仰头伸手 */
  step0: 90.12,
  step1: 90.3,
  push0: 90.3,
  push1: 90.5,
  rise1: 90.68,
  /** 她犹豫：转过头看一眼窗外 */
  doubt0: 90.46,
  doubt1: 90.8,
  /** 回过头、伸下手、往下踩进铁靴 */
  drop0: 90.84,
  /** 「咚」落回地上，两只手攥在一起 */
  land: beatAt(182),
  /** 他松开绳子 */
  let: 91.3,
  end: 91.95,
};
const HM = HUM_T;
/** 仰头看的画面淡掉多少（侧面的屋子盖上来） */
export const morningMix = (t: number) => E.soft(ph(t, M.mix0, M.mix1));

/** 离窗越近画得越大（透视）：地板最里面（墙根）是屋里的大小，窗台那里是 1.6 倍 */
const depthK = (y: number) => ROOM.s * (1 + 0.6 * Math.max(0, Math.min(1, (y - ROOM.floor) / (1920 - ROOM.floor))));

// ——— 地上那块光、光里的两只铁靴 ———
/** 那块光（地板上的梯形：后沿窄、前沿宽）：后沿 y、前沿 y，各自的左右 */
const PATCH = { y0: 1650, y1: 1790, back: [548, 852] as V2, front: [500, 912] as V2 };
/** 两只铁靴立在光里（靴底踩在这一远近的地上） */
const BOOT_Y = 1712;
const BOOT_X = [652, 744];

/** 地上那块光：暖白的一块（边是虚的），三道铁栏的影子顺着光的方向斜着穿过去 */
function sunPatch(g: CanvasRenderingContext2D, t: number) {
  const P = PATCH;
  const quad = (u0: number, u1: number, grow = 0) => {
    const p = new Path2D();
    const b = (u: number) => P.back[0] + (P.back[1] - P.back[0]) * u;
    const f = (u: number) => P.front[0] + (P.front[1] - P.front[0]) * u;
    p.moveTo(b(u0) - grow, P.y0 - grow * 0.4);
    p.lineTo(b(u1) + grow, P.y0 - grow * 0.4);
    p.lineTo(f(u1) + grow * 1.2, P.y1 + grow * 0.5);
    p.lineTo(f(u0) - grow * 1.2, P.y1 + grow * 0.5);
    p.closePath();
    return p;
  };
  const shimmer = 1 + 0.04 * Math.sin(t * 3.1);
  g.save();
  // 虚边：一圈比一圈小、越往里越亮
  for (const [grow, a] of [
    [26, 0.12],
    [12, 0.18],
    [0, 0.26],
    [-14, 0.3],
  ]) {
    g.fillStyle = `rgba(255,240,206,${a * shimmer})`;
    g.fill(quad(0, 1, grow));
  }
  // 铁栏的影子（淡、软）
  g.fillStyle = "rgba(150,100,84,0.2)";
  for (const u of [0.25, 0.5, 0.75]) g.fill(quad(u - 0.018, u + 0.018));
  g.restore();
}
/** 光里飘着的几粒灰（亮的） */
function motes(g: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 9; i++) {
    const ph0 = i * 2.39;
    const x = 560 + ((i * 97) % 340) + 18 * Math.sin(t * 0.7 + ph0);
    const y = 1690 - ((t * 26 + i * 61) % 260) + 8 * Math.cos(t * 0.9 + ph0);
    const a = 0.35 * Math.max(0, Math.sin(Math.PI * (((t * 26 + i * 61) % 260) / 260)));
    drawGlow(g, x, y, 9, a);
  }
}
/** 两只铁靴这一刻在哪（② 他蹲下把它们推到她脚底下，在地上擦着滑过去） */
function bootsAt(t: number): [number, number] {
  const u = E.io(ph(t, HM.push0 + 0.03, HM.push1));
  if (u <= 0) return [BOOT_X[0], BOOT_X[1]];
  const end = standAt().boots;
  return [BOOT_X[0] + (end[0] - BOOT_X[0]) * u, BOOT_X[1] + (end[1] - BOOT_X[1]) * u];
}
/** 地上那两只铁靴（她踩进去以后就是她脚上的，不再另画） */
function drawBoots(g: CanvasRenderingContext2D, t: number) {
  if (t >= HM.land) return;
  const s = depthK(BOOT_Y);
  for (const x of bootsAt(t)) looseBoot(g, x, BOOT_Y - bootLow(0, s), 0, s);
}

// ——— 她：被拉着脚绳从床里滑出来，从横着转成竖着，睡着 ———
/** 躺在床里时胯在哪（和 room.ts 一样）、最后飘在铁靴上面时胯在哪 */
const BED_HIP: V2 = [990 + BED_DX, 400];
const END_HIP: V2 = [652, 1138];
/** 她最后在多远（和铁靴同一个远近，画大一点） */
const HER_END_S = depthK(BOOT_Y);
const HER = {
  /** 半路：脚先往下，身子斜着，还睡着 */
  滑: pose(0, { face: -1, ground: false, float: 0.5, rot: -48, ...legR(14, -16, -30), ...legL(4, -10, -26), neck: -12, expression: "闭眼", smile: 0.4 }, () => ({
    shoulderL: 20,
    elbowL: 30,
    wristL: 0,
    handL: "relax",
    shoulderR: 34,
    elbowR: 24,
    wristR: 0,
    handR: "relax",
  })),
  /** 飘在铁靴上面：竖着，腿软软地垂着、脚尖朝下，头发往上漂，手松松地浮起来，闭着眼，头歪着 */
  飘: pose(-4, { face: -0.7, ground: false, float: 0.5, rot: 0, ...legR(12, -24, -52), ...legL(-4, -20, -56), neck: -14, expression: "闭眼", smile: 0.45 }, () => ({
    shoulderL: 8,
    elbowL: 34,
    wristL: 10,
    handL: "relax",
    shoulderR: 18,
    elbowR: 26,
    wristR: 8,
    handR: "relax",
  })),
};
/** ② 她醒了以后的几个样子（腿还是飘着的那样垂着，直到踩进铁靴） */
const HER2 = {
  /** 睁开眼，往下看：铁靴、他 */
  醒: { ...HER.飘, expression: "平常" as const, blink: 0.3, smile: 0.1, neck: -16, lookX: -0.3, lookY: 0.9 },
  /** 看着他 */
  看他: { ...HER.飘, expression: "平常" as const, blink: 0.12, smile: 0.1, neck: -16, lookX: -0.8, lookY: 0.75 },
  /** 犹豫：转过头看一眼窗外（窗在镜头这边、往上看） */
  犹豫: pose(-4, { face: -0.22, headTurn: 0.1, ground: false, float: 0.5, rot: 0, ...legR(12, -24, -52), ...legL(-4, -20, -56), neck: 2, expression: "犹豫", lookX: 0.15, lookY: -0.55 }, () => ({
    shoulderL: 8,
    elbowL: 34,
    wristL: 10,
    handL: "relax",
    shoulderR: 18,
    elbowR: 26,
    wristR: 8,
    handR: "relax",
  })),
  /** 回过头看着他、往下踩：腿伸直，脚尖往下够 */
  踩: pose(-2, { face: -0.6, ground: false, float: 0.3, rot: 0, ...legR(6, -6, -20), ...legL(-4, -4, -22), neck: -18, expression: "含泪", smile: 0.15, lookX: -0.8, lookY: 0.8 }, () => ({
    shoulderL: 10,
    elbowL: 20,
    wristL: 0,
    handL: "open",
    shoulderR: 20,
    elbowR: 24,
    wristR: 6,
    handR: "relax",
  })),
  /** 「咚」落地那一下：膝盖一弯，头发、围巾一下沉下来 */
  落: pose(10, { face: -0.6, ground: false, float: 0, rot: 0, ...legR(24, -40, 0), ...legL(14, -32, 0), neck: -20, expression: "含泪", smile: 0.2, lookX: -0.8, lookY: 0.8 }, () => ({
    shoulderL: 10,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 14,
    elbowR: 30,
    wristR: 6,
    handR: "relax",
  })),
  /** 站在铁靴里，攥着他的手，低头看着他，含着泪笑了一点 */
  站: pose(2, { face: -0.6, ground: false, float: 0, rot: 0, ...legR(5, -4, 0), ...legL(-4, -3, 0), neck: -20, expression: "含泪", smile: 0.65, tears: 0.55, blush: 0.5, lookX: -0.8, lookY: 0.8 }, () => ({
    shoulderL: 10,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 10,
    elbowR: 24,
    wristR: 6,
    handR: "relax",
  })),
};
const P = M.pulls;
const HER_KEYS = [
    { t: 87.9, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: CHEN2.躺床 },
    { t: P[0] - 0.02, p: CHEN2.躺床 },
    { t: P[0] + 0.32, ease: "inOut", p: HER.滑 },
    { t: P[1] + 0.05, p: HER.滑 },
    { t: P[2] + 0.1, ease: "inOut", p: HER.飘 },
    // ② 睁开眼往下看 → 看着他 → 犹豫（看一眼窗外）→ 回过头往下踩 → 「咚」→ 站住
    { t: HM.wake0, p: HER.飘 },
    { t: HM.wake1, ease: "inOut", p: HER2.醒 },
    { t: HM.wake1 + 0.16, ease: "inOut", p: HER2.看他 },
    { t: HM.doubt0, p: HER2.看他 },
    { t: HM.doubt0 + 0.16, ease: "inOut", p: HER2.犹豫 },
    { t: HM.doubt1, p: HER2.犹豫 },
    { t: HM.drop0 + 0.1, ease: "inOut", p: HER2.踩 },
    // 脚进了靴筒（被靴子挡着）就放平，落地那一刻和地上那两只靴子对上
    { t: HM.land - 0.05, ease: "inOut", p: { ...HER2.踩, ...legR(5, -4, 0), ...legL(-4, -3, 0) } },
    { t: HM.land, p: { ...HER2.踩, ...legR(5, -4, 0), ...legL(-4, -3, 0) } },
    { t: HM.land + 0.07, ease: "out", p: HER2.落 },
    { t: HM.land + 0.36, ease: "inOut", p: HER2.站 },
    { t: 94, p: HER2.站 },
  ] as MoveKey[];
const HER_OPTS = { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 95, follow: 0 };
/** ①：飘着的她腿、整个人的转也晃悠悠地跟着（LIMP） */
const herMove = live(HER_KEYS, { ...HER_OPTS, springs: LIMP });
/** ② 要踩进铁靴落地：腿不跟弹簧（不然落地时脚还翘着，靴子是歪的）；手臂、脖子的弹簧和①一样，90.4 换过来（腿早就停在飘着的样子上了，接得上） */
const herMove2 = live(HER_KEYS, { ...HER_OPTS, springs: ARMS });
const HER_SWAP = 90.4;
const herPose = (t: number) => (t < HER_SWAP ? herMove(t) : herMove2(t));
/** 三把拉下来了多少（0 在床里，1 飘在铁靴上面）：每一把猛地拉一截、再顺着滑一点 */
function pulled(t: number) {
  let k = 0;
  for (const p of P) k += (1 / 3) * (0.75 * E.out(ph(t, p, p + 0.16)) + 0.25 * E.soft(ph(t, p + 0.1, p + 0.45)));
  return k;
}
/** ② 她站在铁靴里时根在哪（两脚中间的地上）、铁靴最后被推到哪（她两只脚踝底下）：按「咚」那一刻的姿势算一次 */
const STAND_X = 700;
let STAND: { root: V2; boots: [number, number] } | null = null;
function standAt() {
  if (STAND) return STAND;
  const p: PoseIn = { ...herMove2(HM.land).pose, items: { boots: true, bricks: 0, gloves: false } };
  const j = jointsOf(p);
  const s = HER_END_S;
  const sole = Math.max(j.ankleL[1], j.ankleR[1]) + bootLow(0, 1);
  const root: V2 = [STAND_X - ((j.ankleL[0] + j.ankleR[0]) / 2) * s, BOOT_Y - sole * s];
  STAND = { root, boots: [root[0] + j.ankleR[0] * s, root[0] + j.ankleL[0] * s].sort((a, b) => a - b) as [number, number] };
  return STAND;
}
/** ② 两只手攥在一起的地方：他伸上来、她伸下来，「咚」那一刻攥住，跟着她落地往下一点 */
const CLASP_MEET: V2 = [606, 1262];
const CLASP_REST: V2 = [612, 1318];
const claspAt = (t: number): V2 => mix(CLASP_MEET, CLASP_REST, E.io(ph(t, HM.land - 0.02, HM.land + 0.3)));

function herAt(t: number) {
  const p: PoseIn = { ...herPose(t).pose };
  const k = pulled(t);
  // 先往下、再往左（贴着床边滑出来，再被拉到他跟前）；② 睡着时飘歪了一点（往右）
  const c: V2 = [1010 + BED_DX, 940];
  const drift = E.io(ph(t, HM.wake0 - 0.05, HM.doubt0 + 0.1));
  const end: V2 = [END_HIP[0] + 42 * drift, END_HIP[1] - 12 * drift];
  const hip: V2 = [(1 - k) ** 2 * BED_HIP[0] + 2 * (1 - k) * k * c[0] + k * k * end[0], (1 - k) ** 2 * BED_HIP[1] + 2 * (1 - k) * k * c[1] + k * k * end[1]];
  const bob = 8 * Math.sin(t * 2.2) * k * (1 - E.io(ph(t, HM.drop0, HM.land)));
  const s = ROOM.s + (HER_END_S - ROOM.s) * k;
  // 头发、围巾：转着的时候按身子的「下」算重力（和 room.ts 躺床一样），失重 0.5 时往上漂
  const fl = (p.float as number | undefined) ?? 0;
  const r = (((p.rot as number | undefined) ?? 0) * Math.PI) / 180;
  p.gravity = [-Math.sin(r) * (1 - 2 * fl), Math.cos(r) * (1 - 2 * fl)];
  const worn = t >= HM.land;
  if (worn) p.items = { boots: true, bricks: 0, gloves: false };
  const j = jointsOf(p);
  let root: V2 = [hip[0] - j.hip[0] * s, hip[1] + bob - j.hip[1] * s];
  // ② 往下踩进铁靴：根从飘着的地方落到站在铁靴里的地方（越来越快，「咚」到底）；落地以后钉在铁靴里（脚踝在铁靴上）
  const d = E.in2(ph(t, HM.drop0, HM.land));
  if (d > 0) {
    const st = standAt();
    const sole = Math.max(j.ankleL[1], j.ankleR[1]) + bootLow(0, 1);
    const stand: V2 = [STAND_X - ((j.ankleL[0] + j.ankleR[0]) / 2) * s, BOOT_Y - sole * s];
    root = worn ? stand : mix(root, stand, d);
    void st;
  }
  // ② 近处那只手伸下去，攥住他伸上来的手
  const w = E.io(ph(t, HM.drop0, HM.land - 0.02));
  if (w > 0.001) {
    const cl = claspAt(t);
    p.armL = { ...(p.armL as object), to: [(cl[0] - root[0]) / s, (cl[1] - root[1]) / s], ik: w, bend: -1 } as PoseIn["armL"];
  }
  const jj = w > 0.001 ? jointsOf(p) : j;
  const at = (q: number[]): V2 => [root[0] + q[0] * s, root[1] + q[1] * s];
  // 绳子拴在脚踝上；穿上铁靴以后从靴口出来
  const ank = at(jj.ankleL);
  const rope: V2 = worn ? mix(ank, at(jj.kneeL), 0.42) : ank;
  return { pose: p, root, s, ankleL: rope, worn };
}

// ——— 他：站在桌子前面的地上，穿着外套，攥着她的脚绳一把一把往下拉 ———
const STONE = CAST.小石头穿妈妈的外套;
const HIM_ROOT: V2 = [418, 1738];
const HIM_K = depthK(HIM_ROOT[1]);
const HIM = {
  /** 攥着绳子，仰头看着睡着的她（朝右），身子往后坐一点 */
  拉: pose(-8, { face: 0.6, ...legR(14, -10), ...legL(-16, -14), neck: 18, expression: "坚定", lookX: 0.5, lookY: -0.8 }, (l) => ({
    shoulderL: 60 + l,
    elbowL: 40,
    wristL: 0,
    handL: "grip",
    shoulderR: 80 + l,
    elbowR: 30,
    wristR: 0,
    handR: "grip",
  })),
  /** 一把拉下去：身子往后一仰 */
  拉_仰: pose(-18, { face: 0.6, ...legR(20, -14), ...legL(-20, -18), neck: 14, expression: "坚定", teeth: 0.2, lookX: 0.5, lookY: -0.7 }, (l) => ({
    shoulderL: 50 + l,
    elbowL: 50,
    wristL: 0,
    handL: "grip",
    shoulderR: 70 + l,
    elbowR: 40,
    wristR: 0,
    handR: "grip",
  })),
};
const himKeys: MoveKey[] = [{ t: 87.9, x: 0, p: HIM.拉 }];
for (const p of P) {
  himKeys.push({ t: p - 0.04, p: HIM.拉 });
  himKeys.push({ t: p + 0.12, ease: "out", p: HIM.拉_仰 });
  himKeys.push({ t: p + 0.4, ease: "inOut", p: HIM.拉 });
}
// 拉到了：看着飘在铁靴上面的她
himKeys.push({ t: P[2] + 0.42, ease: "inOut", p: { ...HIM.拉, neck: 6, lookX: 0.7, lookY: -0.3 } });
/** ② 往前一步、蹲下推铁靴、站起来踮着脚仰头伸手、她落地以后笑 */
const HIM2 = {
  迈: pose(8, { face: 0.6, ...legR(28, -12), ...legL(-22, -18), neck: 8, expression: "坚定", lookX: 0.6, lookY: 0.2 }, (l) => ({
    shoulderL: 60 + l,
    elbowL: 40,
    wristL: 0,
    handL: "grip",
    shoulderR: 40 + l,
    elbowR: 30,
    wristR: 0,
    handR: "open",
  })),
  蹲推: pose(30, { face: 0.6, ...legR(76, -100), ...legL(14, -70), neck: 10, expression: "使劲", lookX: 0.5, lookY: 0.3 }, (l) => ({
    shoulderL: 50 + l,
    elbowL: 50,
    wristL: 0,
    handL: "grip",
    shoulderR: 60 + l,
    elbowR: 10,
    wristR: 0,
    handR: "open",
  })),
  仰望: pose(-6, { face: 0.6, ...legR(6, -4, 22), ...legL(-8, -6, 26), neck: 30, expression: "忍着哭", tears: 0.5, lookX: 0.45, lookY: -1 }, (l) => ({
    shoulderL: 50 + l,
    elbowL: 50,
    wristL: 0,
    handL: "grip",
    shoulderR: 150 + l,
    elbowR: 10,
    wristR: 0,
    handR: "open",
  })),
  笑: pose(-2, { face: 0.6, ...legR(6, -6), ...legL(-6, -4), neck: 24, expression: "哭着笑", lookX: 0.45, lookY: -0.9 }, (l) => ({
    shoulderL: 10 + l,
    elbowL: 20,
    wristL: 0,
    handL: "relax",
    shoulderR: 120 + l,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
};
himKeys.push({ t: HM.step0, p: { ...HIM.拉, neck: 6, lookX: 0.7, lookY: -0.3 } });
himKeys.push({ t: HM.step0 + 0.1, ease: "inOut", p: HIM2.迈 });
himKeys.push({ t: HM.push0 + 0.06, ease: "inOut", p: HIM2.蹲推 });
himKeys.push({ t: HM.push1, p: HIM2.蹲推 });
himKeys.push({ t: HM.rise1, ease: "inOut", p: HIM2.仰望 });
himKeys.push({ t: HM.land, p: HIM2.仰望 });
himKeys.push({ t: HM.land + 0.3, ease: "inOut", p: HIM2.笑 });
himKeys.push({ t: 94, p: HIM2.笑 });
const himMove = live(himKeys, { look: lookOf(STONE), base: { wind: 0 }, idle: true, seed: 97, springs: ARMS, follow: 0 });

/** 他的两只手在绳子上（交替：一只手往上够着攥住、拉到胸前，另一只手松开往上换） */
function handsAt(t: number, chest: V2, ankle: V2): [V2, V2] {
  const d: V2 = [ankle[0] - chest[0], ankle[1] - chest[1]];
  const len = Math.hypot(d[0], d[1]) || 1;
  const u: V2 = [d[0] / len, d[1] / len];
  const on = (a: number, drop = 0): V2 => [chest[0] + u[0] * a, chest[1] + u[1] * a + drop];
  const HIGH = 112;
  const LOW = 18;
  let a = HIGH;
  let b = LOW;
  for (let i = 0; i < P.length; i++) {
    const w = E.io(ph(t, P[i] - 0.02, P[i] + 0.2));
    // 这一把：上面那只手拉到下面，下面那只松开、滑到上面（每一把两只手对调）
    const top = i % 2 === 0 ? "a" : "b";
    if (top === "a") {
      a = HIGH + (LOW - HIGH) * w;
      b = LOW + (HIGH - LOW) * E.io(ph(t, P[i] + 0.12, P[i] + 0.34));
    } else {
      b = HIGH + (LOW - HIGH) * w;
      a = LOW + (HIGH - LOW) * E.io(ph(t, P[i] + 0.12, P[i] + 0.34));
    }
    if (t < P[i] + 0.34) break;
  }
  return [on(a, 6), on(b)];
}
/** ② 他往前一步：根从 (418, 1738) 挪到铁靴左边 */
const HIM_STEP = 104;
function himAt(t: number, ankle: V2) {
  const p: PoseIn = { ...himMove(t).pose };
  const root: V2 = [HIM_ROOT[0] + HIM_STEP * E.io(ph(t, HM.step0, HM.step1)), HIM_ROOT[1]];
  const k = HIM_K;
  const sc = k * STONE.scale;
  const face = (p.face as number | undefined) ?? 0;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / sc, (q[1] - root[1]) / sc];
  const j0 = castJoints(STONE, p);
  const chest: V2 = [root[0] + ((j0.shoulderL[0] + j0.shoulderR[0]) / 2) * k, root[1] + ((j0.shoulderL[1] + j0.shoulderR[1]) / 2 + 40) * k];
  let [ha, hb] = handsAt(t, chest, ankle);
  // ② 一只手（armL）攥着绳子（贴在胸前，顺着绳子的方向）；另一只手（armR）去推铁靴、再往上伸给她；她落地以后松开绳子
  const w2 = E.io(ph(t, HM.step0, HM.step0 + 0.16));
  if (w2 > 0) {
    const d: V2 = [ankle[0] - chest[0], ankle[1] - chest[1]];
    const len = Math.hypot(d[0], d[1]) || 1;
    const hold: V2 = [chest[0] + (d[0] / len) * 34, chest[1] + (d[1] / len) * 34];
    const drop: V2 = [chest[0] - 10, chest[1] + 90];
    ha = mix(ha, mix(hold, drop, E.io(ph(t, HM.let, HM.let + 0.25))), w2);
    const bx = bootsAt(t)[0];
    const bs = depthK(BOOT_Y);
    const pushPt: V2 = [bx - 44 * bs, BOOT_Y - 74 * bs];
    const wPush = E.io(ph(t, HM.push0 - 0.08, HM.push0 + 0.04)) * (1 - E.io(ph(t, HM.push1, HM.rise1)));
    const wUp = E.io(ph(t, HM.push1, HM.rise1 + 0.06));
    let target = mix(hb, pushPt, wPush);
    target = mix(target, claspAt(t), wUp);
    hb = mix(hb, target, w2);
  }
  p.armL = { ...(p.armL as object), to: loc(ha), ik: 1 } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc(hb), ik: 1 } as PoseIn["armR"];
  const j = castJoints(STONE, p);
  const at = (q: number[]): V2 => [root[0] + q[0] * k, root[1] + q[1] * k];
  return { pose: p, root, k, palmL: at(j.palmL), palmR: at(j.palmR), ankleL: at(j.ankleL), holding: t < HM.let + 0.1 };
}

// ——— 绳子 ———
/** 她的脚绳盘在他脚边的那几圈的中心、贴着地拉到椅子腿去的那一段上系着他的红绳的地方（在铁靴左边，看得见） */
const COIL: V2 = [HIM_ROOT[0] + 70, HIM_ROOT[1] + 4];
const RED_KNOT: V2 = [574, 1676];
/** 后面那一层（画在铁靴后面）：从那几圈贴着地拉到椅子后腿的结上，路过红绳的结；他的红绳从他脚踝拉到这个结 */
function ropesBack(g: CanvasRenderingContext2D, him: ReturnType<typeof himAt>) {
  g.save();
  const floor = new Path2D();
  floor.moveTo(COIL[0] + 40, COIL[1] - 6);
  floor.quadraticCurveTo((COIL[0] + RED_KNOT[0]) / 2, COIL[1] - 4, RED_KNOT[0], RED_KNOT[1]);
  floor.quadraticCurveTo((RED_KNOT[0] + KNOT[0]) / 2 + 10, ROOM.floor + 6, KNOT[0], ROOM.floor - 4);
  floor.lineTo(KNOT[0], KNOT[1]);
  strokeRope(g, floor, 5);
  const box = new Path2D();
  box.rect(KNOT[0] - 10, KNOT[1] - 9, 20, 18);
  part(g, box, "#a08a6e", null, 3);
  // 他的红绳：一头拴在他脚踝上，一头系在她的脚绳上
  const red = new Path2D();
  red.moveTo(him.ankleL[0], him.ankleL[1]);
  red.quadraticCurveTo((him.ankleL[0] + RED_KNOT[0]) / 2, COIL[1] + 10, RED_KNOT[0], RED_KNOT[1]);
  g.lineCap = "round";
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.stroke(red);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 4;
  g.stroke(red);
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.ellipse(RED_KNOT[0] + (i - 1) * 10, RED_KNOT[1], 5, 12, 0.25, 0, Math.PI * 2);
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.stroke();
    g.strokeStyle = "#d8352b";
    g.lineWidth = 4.5;
    g.stroke();
  }
  g.restore();
}
/** 前面那一层：盘在他脚边的几圈（拉下来的那些），从他下面那只手松着垂到那几圈上；绷着的一段 脚踝 → 上面那只手 → 下面那只手 */
function ropesFront(g: CanvasRenderingContext2D, t: number, her: ReturnType<typeof herAt>, him: ReturnType<typeof himAt>) {
  const dist = (p: V2) => Math.hypot(p[0] - her.ankleL[0], p[1] - her.ankleL[1]);
  // 绳子从她的脚踝过他攥着的手：①两只手（近的在上），② 只剩攥绳子的那只（armL），他松开以后松松地垂到地上
  const one = t >= HM.step0 + 0.1;
  const hands: V2[] = !him.holding ? [] : one ? [him.palmL] : dist(him.palmL) < dist(him.palmR) ? [him.palmL, him.palmR] : [him.palmR, him.palmL];
  const coils = 1 + 2.4 * pulled(t);
  g.save();
  const coil = new Path2D();
  for (let i = 0; i < Math.ceil(coils); i++) {
    const frac = Math.min(1, coils - i);
    const cx = COIL[0] + (i % 2 ? 6 : -4);
    const cy = COIL[1] - 2 - i * 7;
    coil.moveTo(cx, cy + 11);
    coil.ellipse(cx, cy, 50 - i * 3, 11, 0, Math.PI * 0.5, Math.PI * 0.5 + Math.PI * 2 * frac);
  }
  strokeRope(g, coil, 5);
  if (hands.length) {
    const lo = hands[hands.length - 1];
    const slack = new Path2D();
    slack.moveTo(lo[0], lo[1]);
    slack.quadraticCurveTo(lo[0] + 10, COIL[1] - 30, COIL[0] - 30, COIL[1] - 12);
    strokeRope(g, slack, 5);
    const taut = new Path2D();
    taut.moveTo(her.ankleL[0], her.ankleL[1]);
    for (const h of hands) taut.lineTo(h[0], h[1]);
    strokeRope(g, taut, 5);
  } else {
    // 松开了：从她靴口垂到地上，接到那几圈上
    const a = her.ankleL;
    const fall = new Path2D();
    fall.moveTo(a[0], a[1]);
    fall.bezierCurveTo(a[0] - 30, a[1] + 120, COIL[0] + 140, COIL[1] - 4, COIL[0] + 30, COIL[1] - 10);
    strokeRope(g, fall, 5);
  }
  // 绑在她腿上的一圈（脚踝上；穿上铁靴以后在靴口上面）
  const loop = new Path2D();
  loop.ellipse(her.ankleL[0], her.ankleL[1] - 4, 9 * her.s, 4 * her.s, 0, 0, Math.PI * 2);
  strokeRope(g, loop, 4);
  g.restore();
}

/** 这一刻屋里的样子：早上的光、灯灭着；她在床里 → 被拉下来（画在她平常那一层），他、绳子、光里的铁靴画在最前面 */
export function morningAway(t: number): RoomAway {
  const her = herAt(t);
  const him = himAt(t, her.ankleL);
  return {
    lamp: 0,
    day: 1,
    boots: false,
    quilt: 1 - E.io(ph(t, P[0] - 0.04, P[0] + 0.34)),
    floor: (g) => sunPatch(g, t),
    sleeper: (g) => {
      g.save();
      g.translate(her.root[0], her.root[1]);
      g.scale(her.s, her.s);
      drawChengtuo(g, her.pose, { line: 0.8 });
      g.restore();
    },
    visitor: (g) => {
      ropesBack(g, him);
      drawBoots(g, t);
      ropesFront(g, t, her, him);
      g.save();
      g.translate(him.root[0], him.root[1]);
      g.scale(him.k, him.k);
      drawPerson(g, STONE, him.pose, 0, 0, 1.4);
      g.restore();
    },
    after: (g) => {
      // 那块光亮一点（「发着光的半平米」），光里飘着几粒灰
      const b = bootsAt(t);
      const c: V2 = [(b[0] + b[1]) / 2, BOOT_Y - 30];
      drawGlow(g, c[0], c[1], 300, 0.26 + 0.04 * Math.sin(t * 2.7));
      motes(g, t);
    },
  };
}

/**
 * 侧面的镜头（屋子坐标的取景）：从天花板底下（她的床在画面上边）往下摇到桌前的他、地上那块光（E.settle，和仰头看的画面一起走，
 * 画面上一共 600 像素），落在「上面被拉下来的她、中间拉绳的他、下面光里的铁靴」上；停住以后叠一点很慢的手持呼吸。
 * ② 接着慢慢凑近两张脸（1.35 → 1.85，E.soft 一直到 92.35，下一镜接着还在动），「咚」那一下往里一震
 */
export function morningCam(t: number): Cam {
  const z = 1.35;
  const off = (DOWN_PX - downPx(t)) / z;
  const h = ph(t, M.tilt1 - 0.2, M.tilt1 + 0.3);
  const dx = 3 * h * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1));
  const dy = 3 * h * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19));
  let c = aimRoom([640 + dx / z, 1290 - off + dy / z], 540, 960, z);
  const u = ph(t, HM.start + 0.04, HM.end + 0.4);
  if (u > 0) c = camLerp(c, aimRoom([628 + dx / 1.85, 1180 + dy / 1.85], 540, 960, 1.85), E.soft(u));
  const kk = kick(t, HM.land, 0.1);
  return { ...c, z: c.z * (1 + 0.016 * kk), y: c.y + 4 * kk * Math.sin((t - HM.land) * 60) / c.z };
}
