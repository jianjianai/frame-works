// 重做的 1:35.5–1:53.9（副歌二 + 静）里的两个人：路线、动作、铁靴从她脚上换到他脚上、两块砖。时刻在 lib/fin_t.ts（作品时间）。
// 世界坐标（街面 y = 0，往上为负）；人按 1 倍画。
//
// 路线（草稿的物理：她从楼顶扑下来，楼的一半抱住往上飘的他，惯性带着两个人往下坠、越坠越慢，快到地面时停住，又开始往上飘）：
//   他：她家那栋楼脚下（STONE_X −3390，他妈妈那件外套堆在脚边），97.40 脚离地，越飘越快（H_C·u^1.7），99.013 飘到楼的一半。
//   她：从顶层最左那扇窗扑出去，头朝下越冲越快，正好在 99.013 迎上他。
//   抱住以后按她的胸口走（她重）：从抱住那一刻她的速度线性地减速，100.263 停住——她的靴底离他妈妈那件外套只差一点；
//   之后又开始往上飘（每秒 150），天上的风把两个人往右带（每秒 360，越飘越快地起来），经过两边一扇扇窗；
//   103.5 她把铁靴都套在他脚上、松手：他带着铁靴往下坠，104.013「咚」落在街上（K_LAND）；她光着脚一下子轻了，越升越快地往白里去。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { COLORS as CHEN_COLORS } from "@materials/剪纸角色/code/chengtuo";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, cubicPath, toLocal } from "@materials/剪纸角色/code/figure";
import { E, ph } from "./cam";
import { part } from "./world";
import { ARMS, LIMP, live, withDrag } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { drawPen } from "./room";
import { homeWindow } from "./night";
import { HER, HER9, HER9B, HER9_STEP_DOWN, HER9_STEP_UP, KID, KID9 } from "./fin_poses";
import { T8, T9, herm, lerp, mix } from "./fin_t";
import { H_GRAB, TOP_H, topH } from "./fin_rise";
import { drawFinBrick, shenTip } from "./fin_brick";

type V2 = [number, number];

// ——————————————— 地方 ———————————————
/** 他站的地方（她家那栋楼楼脚下；他妈妈那件外套堆在脚边） */
export const STONE_X = -3390;
/** 抱住时他的鞋底离地多高：楼的一半（楼顶 −8541） */
const H_C = 4050;
/** 停住时她的靴底在哪：离他妈妈那件外套（顶上约 −40）只差一点 */
const STOP_SOLE = -52;
/** 他胸口相对他的根（飘着的姿势） */
const KID_CHEST: V2 = [2, -224];
/** 抱住那一刻（她头朝下）她的胸口相对他的胸口；身子甩过来以后（面对面，他在她右边低一点） */
const CATCH_OFF: V2 = [-20, -190];
const HOLD_OFF: V2 = [-60, -112];
/** 她胸口相对根（按姿势） */
export const chestOff = (p: PoseIn): V2 => {
  const j = jointsOf(p);
  return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
};
/** 她那扇窗（顶层最左） */
const WIN = homeWindow();
export const WIN_C: V2 = [WIN.x + WIN.w / 2, WIN.y + WIN.h / 2];

// ——————————————— 他的路线 ———————————————
const FLY = T8.catch - T8.kidUp;
/** 抱住以前他的根 */
function kidSolo(t: number): V2 {
  if (t < T8.kidUp) return [STONE_X, 0];
  const u = Math.min(1, (t - T8.kidUp) / FLY);
  return [STONE_X + 6 * Math.sin((t - T8.kidUp) * 2.3) * u, -H_C * Math.pow(u, 1.7)];
}
const KID_AT_CATCH = kidSolo(T8.catch);
const CHEST_AT_CATCH: V2 = [KID_AT_CATCH[0] + KID_CHEST[0] + CATCH_OFF[0], KID_AT_CATCH[1] + KID_CHEST[1] + CATCH_OFF[1]];

// ——————————————— 她的胸口（抱住以后两个人一起按它走） ———————————————
/** 停住那一刻她胸口的高度：靴底贴着 STOP_SOLE（够地的姿势胸口在根上方 382） */
const STOP_Y = STOP_SOLE - 382;
const T_IN = T8.stop - T8.catch;
/** 惯性：从抱住那一刻的速度线性减速，停在 STOP_Y（D = v0·T/2） */
const V_CATCH = (2 * (STOP_Y - CHEST_AT_CATCH[1])) / T_IN;
/** 扑下来：从窗口起步 v0，越冲越快，到抱住时正好是 V_CATCH（速度接上） */
const FALL = T8.catch - T8.jump;
const FALL_START: V2 = [WIN_C[0] + 30, WIN_C[1] + 70];
const FALL_V0 = (2 * (CHEST_AT_CATCH[1] - FALL_START[1])) / FALL - V_CATCH;
/** 抱住以后横着：往右漂一点（停住时她的靴底正好在外套上方） */
const X_STOP = STONE_X + 42;
/** 又飘起来：往上每秒 150、往右每秒 360（都柔和地起来） */
const RISE_V = 150;
const DRIFT_V = 360;
const riseS = (s: number, tau: number) => Math.max(0, s - tau * (1 - Math.exp(-s / tau)));
/** 松手以后她往上升：越升越慢地升到白底下（ease-out 2.2），起步那一下速度柔和地起来；横着往右漂一点 */
const HER_TOP_Y = -8940;
const UP_T = 111.8 - T8.release;
let UP_TABLE: Float64Array | null = null;

function chestHold(t: number): V2 {
  if (t < T8.stop) {
    const s = t - T8.catch;
    const y = CHEST_AT_CATCH[1] + V_CATCH * s - (V_CATCH * s * s) / (2 * T_IN);
    const x = CHEST_AT_CATCH[0] + (X_STOP - CHEST_AT_CATCH[0]) * E.out(s / T_IN);
    return [x, y];
  }
  const s = t - T8.stop;
  return [X_STOP + DRIFT_V * riseS(s, 0.6), STOP_Y - RISE_V * riseS(s, 0.3)];
}
const CHEST_AT_RELEASE = chestHold(T8.release);
const V_RELEASE: V2 = (() => {
  const a = chestHold(T8.release);
  const b = chestHold(T8.release - 0.01);
  return [(a[0] - b[0]) / 0.01, (a[1] - b[1]) / 0.01];
})();

/** 她的胸口（世界坐标） */
export function herChest(t: number): V2 {
  if (t >= T9.start) return herChest9(t);
  if (t < T8.jump) {
    // 窗口里：扑出来以前（镜头甩上来时她正从窗里探出来）
    return mix(WIN_C, FALL_START, E.out(ph(t, T8.jump - 0.16, T8.jump)));
  }
  if (t < T8.catch) {
    const s = t - T8.jump;
    const a = (V_CATCH - FALL_V0) / FALL;
    return [FALL_START[0] + (CHEST_AT_CATCH[0] - FALL_START[0]) * Math.pow(s / FALL, 1.4), FALL_START[1] + FALL_V0 * s + 0.5 * a * s * s];
  }
  if (t < T8.release) return chestHold(t);
  // 松手：一下子轻了，越升越快地起来，再越升越慢地停在白底下
  if (!UP_TABLE) {
    const n = Math.ceil(UP_T * 120) + 2;
    UP_TABLE = new Float64Array(n);
    const D = CHEST_AT_RELEASE[1] - HER_TOP_Y;
    let y = 0;
    for (let i = 1; i < n; i++) {
      const s = (i - 0.5) / 120;
      const u = Math.min(1, s / UP_T);
      // 目标速度（ease-out 2.2 的导数），起步时从松手那一刻的速度（每秒 150）柔和地接过去
      const vt = u < 1 ? (2.2 * D * Math.pow(1 - u, 1.2)) / UP_T : 0;
      const w = 1 - Math.exp(-s / 0.14);
      const v = -V_RELEASE[1] * (1 - w) + vt * w;
      y += v / 120;
      UP_TABLE[i] = y;
    }
  }
  const s = t - T8.release;
  const f = Math.min(UP_TABLE.length - 1.001, s * 120);
  const i = Math.floor(f);
  const up = UP_TABLE[i] + (UP_TABLE[i + 1] - UP_TABLE[i]) * (f - i);
  const x = CHEST_AT_RELEASE[0] + V_RELEASE[0] * 0.55 * (1 - Math.exp(-s / 0.55));
  return [x + 10 * Math.sin(s * 0.9) * Math.min(1, s), CHEST_AT_RELEASE[1] - up];
}

/** 抱着时他的胸口相对她的胸口（抱住那一下从头朝下的位置甩到面对面） */
function holdOff(t: number): V2 {
  return mix(CATCH_OFF, HOLD_OFF, E.io(ph(t, T8.catch, T8.catch + 0.36)));
}
/** 松手那一刻他的根和速度（往下坠时接着用） */
let DROP0: { p: V2; v: V2 } | null = null;
const KID_DROP = T8.land - T8.release;
/** 他的根（世界坐标） */
export function kidRoot(t: number): V2 {
  if (t >= T9.start) return kidRoot9(t);
  if (t < T8.catch) return kidSolo(t);
  if (t < T8.release) {
    const c = herChest(t);
    const o = holdOff(t);
    return [c[0] - o[0] - KID_CHEST[0], c[1] - o[1] - KID_CHEST[1]];
  }
  if (!DROP0) {
    const a = kidRoot(T8.release - 1e-4);
    const b = kidRoot(T8.release - 0.01);
    DROP0 = { p: a, v: [(a[0] - b[0]) / (0.01 - 1e-4), (a[1] - b[1]) / (0.01 - 1e-4)] };
  }
  if (t >= T8.land) return K_LAND;
  const s = t - T8.release;
  const g = (2 * (KID_BOOT_Y - DROP0.p[1] - DROP0.v[1] * KID_DROP)) / (KID_DROP * KID_DROP);
  return [DROP0.p[0] + DROP0.v[0] * s * (1 - s / (2 * KID_DROP + 0.4)), DROP0.p[1] + DROP0.v[1] * s + 0.5 * g * s * s];
}
/** 穿着她的铁靴站在街上时他的根：铁靴的底（脚踝下面 63.6）踩在街面上，他的脚踝在根上方 39 */
export const KID_BOOT_Y = 39 - 63.6;
/** 他落在哪（铁靴「咚」地踩在街上） */
export const K_LAND: V2 = (() => {
  const a = chestHold(T8.release - 1e-4);
  const o = HOLD_OFF;
  const p: V2 = [a[0] - o[0] - KID_CHEST[0], a[1] - o[1] - KID_CHEST[1]];
  const b = chestHold(T8.release - 0.01);
  const vx = (a[0] - b[0]) / (0.01 - 1e-4);
  return [Math.round(p[0] + vx * KID_DROP * (1 - KID_DROP / (2 * KID_DROP + 0.4))), KID_BOOT_Y];
})();

// ——————————————— 四声「活下去」+ 尾奏（scenes/act9.ts）：他和她的路线 ———————————————
/** 跺下去那一下铁靴陷进坑里多深 */
export const STOMP_SINK = 24;
/** 老钟扑出窗口抓住他的地方（他的根）：老钟家那扇窗左边上方 */
export const GRAB_X = -1700;
/** 她落回街上的地方（她的根）：她那双铁靴（坑里）右边；他落在她右边 */
export const X_LAND = K_LAND[0] + 150;
export const X_KID2 = X_LAND + 165;
/** 她停在白的边上：act8 最后那一刻的位置（横着轻轻晃） */
const HOVER = (() => {
  // act8 的路线在 111.8 以后已经停在 HER_TOP_Y
  return [CHEST_AT_RELEASE[0] + V_RELEASE[0] * 0.55, HER_TOP_Y] as V2;
})();
function herChest9(t: number): V2 {
  const sway = 10 * Math.sin((t - T8.release) * 0.9);
  if (t < T9.sink) {
    const dip = 60 * E.io(ph(t, T9.eyes, 119.2)) + 10 * Math.exp(-Math.max(0, t - T9.ankle) / 0.2) * (t > T9.ankle ? 1 : 0);
    return [HOVER[0] + sway, HOVER[1] + dip];
  }
  // 整条人链一下子沉了：先猛地一沉，再慢慢落回城里（越落越快、快到街面越落越慢），138.013 光着脚落地
  const y0 = HOVER[1] + 60;
  const x0 = HOVER[0] + 10 * Math.sin((T9.sink - T8.release) * 0.9);
  const yEnd = -382 + 4;
  const D = yEnd - y0;
  const s = t - T9.sink;
  const T = T9.land - T9.sink;
  const jolt = 70 * E.out(Math.min(1, s / 0.22));
  const u = Math.min(1, s / T);
  const y = y0 + jolt * (1 - u) + (D - 0) * (u * u * (3 - 2 * u)) * (1 - 0.0) ;
  const x = x0 + (X_LAND + 18 - x0) * E.io(u);
  return [x, Math.min(y, yEnd)];
}
/** 他：跺地 → 一只脚、再一只脚从铁靴里出来 → 风把他往老钟家窗口带 → 老钟一把抓住 → 把老钟拽出窗 → 人链一个个接上往上长 → 抓住她的脚踝 → 握住她的手 → 挂在她手上落回街上 */
const V_TOP0 = (() => (topH(T9.join0 + 0.02) - topH(T9.join0)) / 0.02)();
const X_TOP = HOVER[0] + 34;
/** 握住她的手以后两个人手握在一起的地方：她胸口的右下方（她远处那只手伸下来） */
export const clasp = (t: number): V2 => {
  const c = herChest(t);
  const bend = E.io(ph(t, T9.reach, T9.hand));
  return [c[0] + 70 + 10 * bend + 55 * E.io(ph(t, T9.sink, T9.sink + 1.5)), c[1] + 210 + 60 * bend];
};
/** 他的远处那只手举直时手心相对他的根（挂、抓的姿势） */
const KID_PALM_UP: V2 = [-35, -352];
function kidRoot9(t: number): V2 {
  if (t < T9.stomp) return K_LAND;
  const r0: V2 = [K_LAND[0], K_LAND[1] + STOMP_SINK];
  if (t < T9.outL) return [K_LAND[0], K_LAND[1] + STOMP_SINK * E.out(ph(t, T9.stomp, T9.stomp + 0.05))];
  if (t < T9.lift) {
    const u = E.io(ph(t, T9.outL, T9.lift));
    return [r0[0] - 6 * u, r0[1] - 140 * u];
  }
  if (t < T9.zhongGrab) {
    const D = T9.zhongGrab - T9.lift;
    const u = (t - T9.lift) / D;
    return [herm(r0[0] - 6, 0, GRAB_X, 300, D, u), herm(r0[1] - 140, -320, -H_GRAB, -160, D, u)];
  }
  if (t < T9.zhongOut) {
    const s = t - T9.zhongGrab;
    const strain = E.io(ph(t, T9.zhongGrab + 0.3, T9.zhongOut));
    const tug = 30 * Math.exp(-s / 0.16) * Math.sin(s * 24);
    return [GRAB_X + 10 * Math.sin(t * 2.1) * (1 - strain * 0.5), -H_GRAB + tug - 70 * strain - 5 * Math.sin(t * 13) * strain];
  }
  if (t < T9.join0) {
    const D = T9.join0 - T9.zhongOut;
    const u = (t - T9.zhongOut) / D;
    return [GRAB_X, herm(-H_GRAB - 70, -260, -topH(T9.join0), -V_TOP0, D, u)];
  }
  if (t < T9.reach) {
    const bob = t > T9.ankle ? 4 * Math.sin((t - T9.ankle) * 3) : 0;
    return [lerp(GRAB_X, X_TOP, E.io(ph(t, T9.join0, T9.ankle))), -topH(Math.min(t, T9.ankle)) + bob];
  }
  // 松开她的脚踝，往上伸手；她弯下腰握住——之后挂在她手上
  const hold: V2 = [X_TOP, -TOP_H - 40 * E.io(ph(t, T9.reach, T9.hand))];
  const c = clasp(t);
  const hang: V2 = [c[0] - KID_PALM_UP[0], c[1] - KID_PALM_UP[1]];
  const w = E.io(ph(t, T9.hand - 0.1, T9.sink + 0.2));
  const p = mix(hold, hang, w);
  if (p[1] >= 0) return [p[0], 0];
  return p;
}
/** 他落回街上的那一刻（脚着地） */
export const KID_LAND9 = (() => {
  for (let t = T9.sink; t < T9.land; t += 0.005) if (kidRoot9(t)[1] >= 0) return t;
  return T9.land;
})();

const KID_KEYS9: MoveKey[] = [
  { t: 112.6, p: KID.抱砖仰 },
  { t: 113.05, ease: "inOut", p: KID9.定 },
  { t: 113.3, p: KID9.定 },
  { t: 113.78, ease: "inOut", p: KID9.抬靴 },
  { t: 113.94, p: KID9.抬靴 },
  { t: T9.stomp, ease: "in", squash: 0.14, p: KID9.跺 },
  { t: T9.stomp + 0.12, ease: "out", p: KID9.跺 },
  { t: T9.lookUp + 0.2, ease: "inOut", p: KID9.仰 },
  { t: T9.outL + 0.08, ease: "inOut", p: KID9.出L },
  { t: T9.outR + 0.08, ease: "inOut", p: KID9.出R },
  { t: T9.lift + 0.2, ease: "inOut", p: KID9.飞 },
  { t: T9.zhongGrab - 0.02, p: KID9.飞 },
  { t: T9.zhongGrab + 0.08, ease: "out", squash: -0.06, p: KID9.被拽 },
  { t: T9.zhongGrab + 0.4, ease: "inOut", p: KID9.被拽 },
  { t: T9.zhongGrab + 0.8, ease: "inOut", p: KID9.挣 },
  { t: T9.zhongOut, p: KID9.挣 },
  { t: T9.zhongOut + 0.1, ease: "out", squash: -0.04, p: KID9.挣 },
  // 周磊抓住老钟：低头看见街上的人一个个跑来抓上来，哭着笑（眼睛先往下、头再跟）；再仰起头朝着她
  { t: T9.join0 + 0.1, p: KID9.挣 },
  { t: T9.join0 + 0.2, ease: "out", p: { ...KID9.挣, lookX: 0.1, lookY: 0.9 } },
  { t: T9.join0 + 0.5, ease: "inOut", p: KID9.看人 },
  { t: 121.9, p: KID9.看人 },
  { t: 122.0, ease: "out", p: { ...KID9.看人, lookX: -0.3, lookY: -1 } },
  { t: 122.35, ease: "inOut", p: KID9.挣 },
  { t: 125.6, p: KID9.挣 },
  { t: T9.ankle, ease: "inOut", p: KID9.抓 },
  { t: T9.ankle + 0.08, ease: "out", squash: -0.05, p: KID9.抓 },
  { t: 128.8, p: KID9.抓 },
  { t: T9.hand, ease: "inOut", p: KID9.挂 },
  { t: KID_LAND9 - 0.04, p: KID9.挂 },
  { t: KID_LAND9 + 0.1, ease: "out", squash: 0.08, p: KID9.站 },
  { t: KID_LAND9 + 0.3, ease: "inOut", p: KID9.站 },
  // 她跪下来；他把她那块砖翻到背面，掏出那支两块五的笔，一笔一画地写
  { t: T9.kneel + 0.2, p: KID9.站 },
  { t: T9.write0 - 0.1, ease: "inOut", p: KID9.写 },
  { t: T9.write1, p: KID9.写 },
  { t: T9.give + 0.2, ease: "inOut", p: KID9.看她 },
  { t: T9.hug, p: KID9.看她 },
  { t: T9.hug + 0.35, ease: "inOut", p: KID9.被抱 },
  { t: T9.rise - 0.1, p: KID9.被抱 },
  { t: T9.rise + 0.3, ease: "inOut", p: KID9.牵 },
  { t: 153, p: KID9.牵 },
] as MoveKey[];
const HER_KEYS9: MoveKey[] = [
  { t: T9.eyes - 0.06, p: HER.伸 },
  { t: T9.eyes + 0.08, ease: "out", p: HER9.睁眼 },
  { t: T9.eyes + 0.4, p: HER9.睁眼 },
  { t: 118.6, ease: "inOut", p: HER9.看 },
  { t: T9.ankle - 0.04, p: HER9.看 },
  { t: T9.ankle + 0.1, ease: "out", p: HER9.被抓 },
  { t: T9.momDown - 0.2, p: HER9.被抓 },
  { t: T9.momDown + 0.25, ease: "inOut", p: HER9.看妈妈 },
  { t: T9.momDown1, p: HER9.看妈妈 },
  { t: T9.back + 0.1, ease: "inOut", p: { ...HER9.被抓, expression: "哭着笑" as const } },
  { t: T9.reach, p: { ...HER9.被抓, expression: "哭着笑" as const } },
  { t: T9.hand - 0.05, ease: "inOut", p: HER9.弯 },
  { t: T9.sink, p: HER9.弯 },
  { t: T9.sink + 0.45, ease: "inOut", p: HER9.落 },
  { t: T9.land - 0.35, p: HER9.落 },
  { t: T9.land, ease: "inOut", squash: 0.05, p: HER9.站 },
  { t: T9.land + 0.16, ease: "out", p: HER9.站 },
  // 跪下来，看着他把她那块砖翻过来、在背面写字；放进她手里——手一沉，砖暖了：低头看着字，哭着笑
  { t: T9.kneel, p: HER9.站 },
  { t: T9.kneel + 0.4, ease: "inOut", p: HER9B.跪 },
  { t: T9.write0 - 0.1, ease: "inOut", p: HER9B.看写 },
  { t: T9.heavy - 0.05, p: HER9B.看写 },
  { t: T9.heavy + 0.1, ease: "out", squash: 0.03, p: HER9B.捧 },
  // 抱住他（大家走过来把手放在她肩上：看看左边、右边，再低头抱着他）
  { t: T9.hug, p: HER9B.捧 },
  { t: T9.hug + 0.4, ease: "inOut", p: HER9B.抱 },
  { t: T9.hands + 0.15, p: HER9B.抱 },
  { t: T9.hands + 0.4, ease: "inOut", p: { ...HER9B.抱, blink: 0, neck: 8, lookX: -0.8, lookY: 0 } },
  { t: T9.hands + 0.9, p: { ...HER9B.抱, blink: 0, neck: 8, lookX: -0.8, lookY: 0 } },
  { t: T9.hands + 1.2, ease: "inOut", p: { ...HER9B.抱, blink: 0, neck: 8, lookX: 0.8, lookY: 0 } },
  { t: T9.hands + 1.7, p: { ...HER9B.抱, blink: 0, neck: 8, lookX: 0.8, lookY: 0 } },
  { t: T9.hands + 2.0, ease: "inOut", p: HER9B.抱 },
  // 站起来，往前一步：「咚」
  { t: T9.rise, p: HER9B.抱 },
  { t: T9.rise + 0.4, ease: "inOut", p: HER9B.站 },
  { t: T9.step - 0.22, ease: "inOut", p: HER9_STEP_UP },
  { t: T9.step, ease: "in", squash: 0.05, p: HER9_STEP_DOWN },
  { t: T9.step + 0.2, ease: "out", p: HER9_STEP_DOWN },
  { t: 153, p: HER9_STEP_DOWN },
] as MoveKey[];

// ——————————————— 他的动作 ———————————————
export const STONE_BARE = { ...CAST.小石头, coat: undefined };
const SC = STONE_BARE.scale;
const kidMove = live(
  [
    { t: 95.2, x: 0, p: KID.踮 },
    { t: T8.kidUp - 0.02, p: KID.踮 },
    { t: T8.kidUp + 0.22, ease: "inOut", p: KID.飘 },
    // 看见她从上面扑下来：一惊，把砖收到胸前
    { t: 98.66, p: KID.飘 },
    { t: 98.84, ease: "out", p: KID.惊 },
    { t: T8.catch + 0.02, p: KID.惊 },
    { t: T8.catch + 0.3, ease: "inOut", p: KID.被抱 },
    // 快到地面：低头看着底下妈妈那件外套（差一点）
    { t: 99.78, p: KID.被抱 },
    { t: 100.05, ease: "inOut", p: KID.看地 },
    { t: 100.42, p: KID.看地 },
    { t: 100.72, ease: "inOut", p: KID.被抱 },
    // 她看自己的铁靴：他也跟着低头看
    { t: T8.decide + 0.1, p: KID.被抱 },
    { t: T8.decide + 0.32, ease: "inOut", p: KID.看她 },
    // 铁靴套上一只，那条腿就被坠直一条（近处那条、再远处那条）
    { t: T8.boot1[2] - 0.02, p: KID.看她 },
    { t: T8.boot1[2] + 0.12, ease: "out", p: { ...KID.看她, ...legL(-4, -6, 0) } },
    { t: T8.boot2[2] - 0.02, p: { ...KID.看她, ...legL(-4, -6, 0) } },
    { t: T8.boot2[2] + 0.1, ease: "out", p: { ...KID.套, neck: 16, expression: "担心", lookX: -0.5, lookY: -0.8 } },
    // 松手：铁靴一沉，往下坠，远处那只手往上伸着够她
    { t: T8.release, p: { ...KID.套, neck: 16, expression: "担心", lookX: -0.5, lookY: -0.8 } },
    { t: T8.release + 0.22, ease: "inOut", p: KID.坠 },
    { t: T8.land - 0.02, p: KID.坠 },
    { t: T8.land + 0.1, ease: "out", squash: 0.09, p: KID.站仰 },
    { t: T8.land + 0.3, ease: "inOut", p: KID.站仰 },
    // 低头看见靴尖旁边那块砖；先把自己那块插进近处那只铁靴的靴口（腾出手），从腰那儿笨笨地折下去捡起来
    { t: 104.36, ease: "inOut", p: KID.看砖 },
    { t: 104.62, p: KID.看砖 },
    { t: 104.86, ease: "inOut", p: KID.弯腰 },
    { t: 104.94, p: KID.弯腰 },
    { t: 105.2, ease: "inOut", p: KID.读 },
    { t: 105.78, p: KID.读 },
    // 抬起头：抱在胸口，仰头看她
    { t: 105.98, ease: "inOut", p: KID.抱砖仰 },
    // 和十二年前七岁的她一样：远处那只手伸上去够，哭着喊她
    { t: 107.62, p: KID.抱砖仰 },
    { t: 107.9, ease: "inOut", p: KID.够她 },
    { t: 109.6, p: KID.够她 },
    { t: 110.0, ease: "inOut", p: KID.抱砖仰 },
    ...KID_KEYS9,
  ] as MoveKey[],
  { look: lookOf(STONE_BARE), base: { wind: 0.85 }, idle: true, seed: 811, springs: ARMS, follow: 0 },
);

// ——— 砖 ———
const BS = 1 / 1.22;
/** 砖的半长（街上的大小），两只手捏在两头往里一点 */
const HALF = (116 * BS) / 2 - 6;
/** 举过头顶时砖的中心（相对他的根） */
const RAISE: V2 = [-2, -357];

/** 他那块「妈妈，明天见」这一刻在哪（世界坐标）：举过头顶 → 收到胸前 → 落地以后插进近处那只铁靴的靴口 */
function giftAt(t: number, root: V2, chest: V2): { c: V2; rot: number } {
  const raised: V2 = [root[0] + RAISE[0], root[1] + RAISE[1]];
  const atChest: V2 = [chest[0] - 30, chest[1] + 22];
  const toChest = E.io(ph(t, 98.68, 98.86));
  let c = mix(raised, atChest, toChest);
  let rot = 0.06 * toChest;
  // 104.36–104.58 竖过来插进近处那只铁靴的靴口（插进去一小半，上头露出 50），插好就松手
  const ins = E.io(ph(t, 104.36, 104.58));
  if (ins > 0) {
    const rim = bootRim(t, "L");
    const into: V2 = [rim[0] + 6, rim[1] - 8];
    c = mix(c, into, ins);
    rot = rot + (-Math.PI / 2 - rot) * ins;
  }
  return { c, rot };
}

// ——— 他脚上的铁靴（她的，按她的大小画） ———
const BOOT_L = {
  body: toLocal(BOOT.body, REST.ankleR, 0),
  rim: toLocal(BOOT.rim, REST.ankleR, 0),
  sole: toLocal(BOOT.sole, REST.ankleR, 0),
  brick: toLocal(BOOT.brick, REST.ankleR, 0),
  rust: BOOT.rust.map((r) => toLocal(r, REST.ankleR, 0)),
  ropes: BOOT.ropes.map((r) => toLocal(r, REST.ankleR, 0)),
  rivets: BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r })),
};
/** 靴口上沿的中点（靴子自己的坐标：脚踝在原点） */
const RIM_TOP: V2 = (() => {
  let top = 1e9;
  let xs = 0;
  let n = 0;
  for (const p of BOOT_L.rim) if (p[1] < top) top = p[1];
  for (const p of BOOT_L.rim) if (p[1] < top + 8) {
    xs += p[0];
    n++;
  }
  return [xs / Math.max(1, n), top];
})();
/** 一只铁靴：脚踝点在 a，转 rot（0 是小腿竖着），按她的大小画；sx 横着的倍数（−1 镜像：脚尖朝右）；brick 靴筒里插不插着砖 */
export function drawBoot(g: CanvasRenderingContext2D, a: V2, rot: number, line: number, sx = 1, brick = true) {
  const K = CHEN_COLORS;
  const id = (p: V2): V2 => p;
  const lw = 3 * line;
  g.save();
  g.translate(a[0], a[1]);
  g.rotate(rot);
  g.scale(sx, 1);
  part(g, cubicPath(BOOT_L.body, id), K.boot, K.bootShade, lw, [4, 3]);
  g.fillStyle = K.rust;
  for (const r of BOOT_L.rust) g.fill(cubicPath(r, id));
  g.strokeStyle = K.rope;
  g.lineWidth = 4;
  for (const r of BOOT_L.ropes) g.stroke(cubicPath(r, id, false));
  if (brick) part(g, cubicPath(BOOT_L.brick, id), K.brick, K.brickShade, lw * 0.8, [2, 2]);
  part(g, cubicPath(BOOT_L.rim, id), K.bootRim, K.bootShade, lw, [2, 2]);
  g.fillStyle = K.rivet;
  for (const d of BOOT_L.rivets) {
    g.beginPath();
    g.arc(d.c[0], d.c[1], d.r, 0, Math.PI * 2);
    g.fill();
  }
  part(g, cubicPath(BOOT_L.sole, id), K.sole, null, lw);
  g.restore();
}
/** 小腿的转角：膝盖到脚踝（竖直往下是 0） */
const shinRot = (knee: V2, ankle: V2) => -Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]);
/** 在 rot 转角下，靴子自己坐标里的点 p 落在哪（脚踝在 a，sx 镜像） */
const bootPt = (a: V2, rot: number, sx: number, p: V2): V2 => {
  const x = p[0] * sx;
  return [a[0] + x * Math.cos(rot) - p[1] * Math.sin(rot), a[1] + x * Math.sin(rot) + p[1] * Math.cos(rot)];
};

// ——————————————— 他这一刻 ———————————————
interface KidNow {
  pose: PoseIn;
  root: V2;
  chest: V2;
  ankleL: V2;
  ankleR: V2;
  kneeL: V2;
  kneeR: V2;
  gift: { c: V2; rot: number };
  /** 她那块「活下去」（震出来以后）：中心、转角、翻面（正数背面朝外） */
  her: { c: V2; rot: number; flipY: number } | null;
}
const kidMemo = new Map<number, KidNow>();
export function kidAt(t: number): KidNow {
  const key = Math.round(t * 1e4);
  const hit = kidMemo.get(key);
  if (hit) return hit;
  const p: PoseIn = { ...kidMove(t).pose };
  const root = kidRoot(t);
  {
    const r0 = kidRoot(t - 0.05);
    withDrag(p, [(root[0] - r0[0]) / 0.05, (root[1] - r0[1]) / 0.05], 0.5, 0.8);
  }
  const loc = (q: V2): V2 => [(q[0] - root[0]) / SC, (q[1] - root[1]) / SC];
  const j0 = castJoints(STONE_BARE, p);
  const chest: V2 = [root[0] + (j0.shoulderL[0] + j0.shoulderR[0]) / 2, root[1] + (j0.shoulderL[1] + j0.shoulderR[1]) / 2 + 30];
  const gift = giftAt(t, root, chest);
  // 两只手捏着自己那块砖的两头（落地以后近处那只手送它进靴口，远处那只松开去够她 / 撑一下）
  const wNear = 1 - E.io(ph(t, 104.58, 104.7));
  const wFar = 1 - E.io(ph(t, T8.release, T8.release + 0.15));
  const cs = Math.cos(gift.rot);
  const sn = Math.sin(gift.rot);
  const end = (d: number): V2 => [gift.c[0] + d * cs - 4 * sn, gift.c[1] + d * sn + 4 * cs];
  if (wNear > 0) p.armL = { ...(p.armL as object), to: loc(end(HALF)), ik: wNear } as PoseIn["armL"];
  if (wFar > 0 && t < T8.release + 0.15) p.armR = { ...(p.armR as object), to: loc(end(-HALF)), ik: wFar } as PoseIn["armR"];
  // 她那块：弯腰捡起来、捧到脸前、翻过来、抱到胸口
  const her = herBrickAt(t, root);
  if (her && t >= 104.7) {
    const w = E.io(ph(t, 104.7, 104.9));
    const c2 = Math.cos(her.rot);
    const s2 = Math.sin(her.rot);
    const e2 = (d: number): V2 => [her.c[0] + d * c2 - 4 * s2, her.c[1] + d * s2 + 4 * c2];
    p.armL = { ...(p.armL as object), to: loc(e2(HALF)), ik: w } as PoseIn["armL"];
    // 和十二年前七岁的她一样，远处那只手松开砖伸上去够她（107.62–109.6），近处那只抱着
    const wR = w * (1 - E.io(ph(t, 107.6, 107.84)) + E.io(ph(t, 109.6, 109.9)) - E.io(ph(t, T9.outL - 0.05, T9.outL + 0.15)));
    if (wR > 0.001) p.armR = { ...(p.armR as object), to: loc(e2(-HALF)), ik: Math.min(1, wR) } as PoseIn["armR"];
  }
  // 最顶上：远处那只手抓住她远处那只脚踝；她弯下腰时松开、往上伸，握住她的手（一直握着落回街上）
  if (t >= T9.ankle - 0.35 && t < T9.kneel + 0.25) {
    const h = herAt(t);
    const hj = jointsOf(h.pose);
    const ankle: V2 = [h.root[0] + hj.ankleR[0], h.root[1] + hj.ankleR[1] + 6];
    const to = mix(ankle, clasp(Math.min(t, T9.land)), E.io(ph(t, T9.reach, T9.hand)));
    const w = E.io(ph(t, T9.ankle - 0.35, T9.ankle)) * (1 - E.io(ph(t, T9.kneel, T9.kneel + 0.25)));
    p.armR = { ...(p.armR as object), to: loc(to), ik: w } as PoseIn["armR"];
  }
  // 尾奏：近处那只手托着砖（放进她手心以后松开），远处那只握着笔写字；站起来以后近处那只手牵着她
  if (t >= T9.kneel + 0.2 && her) {
    const cs = Math.cos(her.rot);
    const sn = Math.sin(her.rot);
    const wHold = E.io(ph(t, T9.kneel + 0.2, 138.9)) * (1 - E.io(ph(t, T9.give, T9.give + 0.2)));
    if (wHold > 0) p.armL = { ...(p.armL as object), to: loc([her.c[0] + HALF * 0.6 * cs, her.c[1] + 10 + HALF * 0.6 * sn]), ik: wHold } as PoseIn["armL"];
    const pen = penAt(t, root, her);
    const wPen = E.io(ph(t, 138.8, 139.1)) * (1 - E.io(ph(t, T9.write1 + 0.2, T9.write1 + 0.4)));
    if (wPen > 0) p.armR = { ...(p.armR as object), to: loc(pen.palm), ik: wPen } as PoseIn["armR"];
  }
  if (t >= T9.rise) {
    const h = herAtRaw(t);
    const handP: V2 = [(h.root[0] + root[0]) / 2 + 20, -250];
    p.armL = { ...(p.armL as object), to: loc(handP), ik: E.io(ph(t, T9.rise + 0.1, T9.rise + 0.4)) } as PoseIn["armL"];
  }
  const j = castJoints(STONE_BARE, p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  const out: KidNow = { pose: p, root, chest, ankleL: at(j.ankleL), ankleR: at(j.ankleR), kneeL: at(j.kneeL), kneeR: at(j.kneeR), gift, her };
  if (kidMemo.size > 300) kidMemo.clear();
  kidMemo.set(key, out);
  return out;
}

// ——— 她那块「活下去」：落地那一下从近处那只铁靴的靴口震出来，翻着跟头落在他脚边（背面朝上） ———
let RIM_OUT: V2 | null = null;
/** 它落在哪（街面上，他靴尖前面靠镜头一点） */
const HB_REST: V2 = [K_LAND[0] - 120, -10];
function herBrickAt(t: number, root: V2): { c: V2; rot: number; flipY: number } | null {
  if (t >= T9.kneel + 0.2) return brickEnd(t, root);
  if (t < T8.brickOut) return null;
  const fly = 0.32;
  const d = t - T8.brickOut;
  if (d < fly) {
    RIM_OUT ??= bootRim(T8.brickOut, "L");
    const rim = RIM_OUT;
    const u = d / fly;
    const y = rim[1] - 40 + (HB_REST[1] - rim[1] + 40) * u * u - 120 * Math.sin(Math.PI * u);
    return { c: [rim[0] + (HB_REST[0] - rim[0]) * u, y], rot: -Math.PI / 2 + (Math.PI * 2 + Math.PI / 2) * E.out(u), flipY: 1 };
  }
  if (t < 104.9) {
    const e = d - fly;
    return { c: HB_REST, rot: 0.08 * Math.exp(-e / 0.05) * Math.sin(e * 45), flipY: 1 };
  }
  // 捡起来（104.9 捏住）→ 捧到脸前（105.2）→ 翻过来（105.15–105.32，她的字）→ 抱到胸口（105.8–105.98）
  const face: V2 = [root[0] - 46, root[1] - 236];
  const chestP: V2 = [root[0] - 36, root[1] - 240];
  const up = E.io(ph(t, 104.94, 105.2));
  let c = mix(HB_REST, face, up);
  c = mix(c, chestP, E.io(ph(t, 105.8, 105.98)));
  const flipY = Math.cos(Math.PI * E.io(ph(t, 105.15, 105.32)));
  return { c, rot: 0.04 * Math.sin(t * 23) * E.io(ph(t, 105.2, 105.4)) * (1 - ph(t, 105.8, 105.98)), flipY };
}

// ——————————————— 她的动作 ———————————————
const herMove = live(
  [
    { t: 97.6, x: 0, p: HER.扑 },
    { t: T8.jump + 0.02, p: HER.扑 },
    { t: T8.jump + 0.18, ease: "inOut", p: HER.冲 },
    // 头朝下一直冲到他跟前，两只手环住他；抱住以后身子才甩过来
    { t: T8.catch + 0.02, p: HER.冲 },
    { t: T8.catch + 0.36, ease: "inOut", p: HER.抱 },
    { t: T8.catch + 0.62, ease: "inOut", p: HER.抱坠 },
    // 快到地面：两只脚使劲往下够石板——差一点
    { t: 99.86, p: HER.抱坠 },
    { t: 100.14, ease: "inOut", p: HER.够地 },
    { t: T8.stop + 0.18, p: HER.够地 },
    // 又飘起来了：看着他（心疼）；窗里的人一扇扇关上窗，她看了一眼
    { t: T8.stop + 0.5, ease: "inOut", p: HER.抱升 },
    { t: 100.86, p: HER.抱升 },
    { t: 101.02, ease: "inOut", p: { ...HER.抱升, neck: 6, expression: "难过", lookX: 0.8, lookY: -0.3 } },
    { t: 101.42, p: { ...HER.抱升, neck: 6, expression: "难过", lookX: 0.8, lookY: -0.3 } },
    { t: 101.62, ease: "inOut", p: HER.抱升 },
    // 看看他，看看自己的铁靴（妈妈用过的办法）
    { t: T8.decide, p: HER.抱升 },
    { t: T8.decide + 0.16, ease: "inOut", p: HER.看靴 },
    // 近处那只（L）：膝盖抬起来，近处那只手攥住靴口拔下来，翻过来套到他近处那只脚上
    { t: T8.boot1[0] - 0.12, p: HER.看靴 },
    { t: T8.boot1[0] + 0.02, ease: "inOut", p: HER.拔L },
    { t: T8.boot1[1], p: HER.拔L },
    { t: T8.boot1[2] - 0.04, ease: "inOut", p: { ...HER.看靴, ...legL(-6, -20, -46) } },
    // 远处那只（R）
    { t: T8.boot2[0] + 0.02, ease: "inOut", p: { ...HER.拔R, ...legL(-6, -20, -46) } },
    { t: T8.boot2[1], p: { ...HER.拔R, ...legL(-6, -20, -46) } },
    { t: T8.boot2[2] - 0.02, ease: "inOut", p: HER.光脚抱 },
    // 松手：光着脚一下子轻了，往上飘，低头冲他笑
    { t: T8.release, p: HER.光脚抱 },
    { t: T8.release + 0.22, ease: "out", p: HER.放 },
    { t: 104.3, p: HER.放 },
    { t: 104.7, ease: "inOut", p: HER.升 },
    // 网里：低头冲他笑了一下
    { t: 106.6, p: HER.升 },
    { t: T8.smile, ease: "inOut", p: HER.笑 },
    { t: 107.6, p: HER.笑 },
    { t: 108.1, ease: "inOut", p: HER.升 },
    // 仰起脸朝着白，两只手举起来
    { t: 109.4, p: HER.升 },
    { t: 110.0, ease: "inOut", p: HER.仰 },
    // 白的边上：闭上眼睛，张开手；白里的妈妈朝她张开手，她把手伸过去
    { t: 112.4, p: HER.仰 },
    { t: 112.95, ease: "inOut", p: HER.开 },
    { t: T8.reach, p: HER.开 },
    { t: T8.flash, ease: "inOut", p: HER.伸 },
    ...HER_KEYS9,
  ] as MoveKey[],
  { look: CHENGTUO, base: { chestL: "under", chestR: "under" }, idle: true, seed: 821, springs: ARMS, follow: 0 },
);

// ——— 铁靴：她脚上 → 被她近处那只手拔下来、翻过来 → 套在他脚上 ———
type Side = "L" | "R";
const BOOT_T = (side: Side) => (side === "L" ? T8.boot1 : T8.boot2);
/** 她还穿着的那只靴子（她朝右：靴子镜像，脚尖朝右） */
function herBootOn(t: number, side: Side) {
  const h = herAtRaw(t);
  const j = jointsOf(h.pose);
  const a = side === "L" ? j.ankleL : j.ankleR;
  const k = side === "L" ? j.kneeL : j.kneeR;
  const ankle: V2 = [h.root[0] + a[0], h.root[1] + a[1]];
  const knee: V2 = [h.root[0] + k[0], h.root[1] + k[1]];
  return { a: ankle, rot: shinRot(knee, ankle) };
}
/** 他脚上那只靴子在哪（脚踝、小腿转角）；五① 以后留在坑里的样子在 act9 里另算 */
function kidBootOn(t: number, side: Side) {
  const k = kidLegs(t);
  const a = side === "L" ? k.ankleL : k.ankleR;
  return { a, rot: shinRot(side === "L" ? k.kneeL : k.kneeR, a) };
}
/** 他的两条腿（只看腿：手的 IK 不影响，铁靴、砖要用它，避免绕回来） */
function kidLegs(t: number) {
  const p = kidMove(t).pose;
  const root = kidRoot(t);
  const j = castJoints(STONE_BARE, p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  return { ankleL: at(j.ankleL), ankleR: at(j.ankleR), kneeL: at(j.kneeL), kneeR: at(j.kneeR) };
}
/** 一只靴子这一刻：在谁脚上 / 在她手里，脚踝点、转角、镜像 */
export function bootState(t: number, side: Side): { on: "her" | "hand" | "kid" | "stay"; a: V2; rot: number; sx: number } {
  // 「活」跺下去以后铁靴陷在坑里；他一只脚、再一只脚从靴子里出来，靴子留在坑里立着
  if (t >= T9.stomp + 0.06) {
    const k = kidBootOn(T9.stomp + 0.06, side);
    return { on: t >= (side === "L" ? T9.outL : T9.outR) ? "stay" : "kid", a: k.a, rot: 0, sx: 1 };
  }
  const [b0, b1, b2] = BOOT_T(side);
  if (t < b0 + 0.1) {
    const h = herBootOn(t, side);
    return { on: "her", a: h.a, rot: h.rot, sx: -1 };
  }
  if (t < b2) {
    // 拔下来（顺着小腿往下拽 60）→ 拿过去、一边翻过来 → 套上他的脚
    const h = herBootOn(b0 + 0.1, side);
    const pull = E.out(ph(t, b0 + 0.1, b1));
    const pulled: V2 = [h.a[0] - 60 * Math.sin(h.rot) * pull, h.a[1] + 60 * Math.cos(h.rot) * pull];
    const k = kidBootOn(Math.min(t, b2), side);
    const u = E.io(ph(t, b1, b2));
    const a = mix(pulled, [k.a[0], k.a[1] - 20 * (1 - u)], u);
    const sx = -1 + 2 * E.io(ph(t, b1 + 0.04, b2 - 0.06));
    return { on: "hand", a, rot: h.rot + (k.rot - h.rot) * u + 0.5 * Math.sin(Math.PI * u), sx: Math.sign(sx || 1) * Math.max(0.08, Math.abs(sx)) };
  }
  const k = kidBootOn(t, side);
  return { on: "kid", a: k.a, rot: k.rot, sx: 1 };
}
/** 靴口上沿的中点（世界坐标）：她的手攥这里；他插砖插进这里 */
export function bootRim(t: number, side: Side): V2 {
  const s = bootState(t, side);
  return bootPt(s.a, s.rot, s.sx, RIM_TOP);
}

// ——————————————— 她这一刻 ———————————————
interface HerNow {
  pose: PoseIn;
  root: V2;
  chest: V2;
}
function herAtRaw(t: number): HerNow {
  const p: PoseIn = { ...herMove(t).pose };
  const off = chestOff(p);
  // 落回街上以后光着脚站着（根就是脚底）
  if (t >= T9.land) {
    const root: V2 = [X_LAND, 0];
    return { pose: p, root, chest: [root[0] + off[0], root[1] + off[1]] };
  }
  const c = herChest(t);
  const root: V2 = [c[0] - off[0], c[1] - off[1]];
  return { pose: p, root, chest: c };
}
const herMemo = new Map<number, HerNow>();
export function herAt(t: number): HerNow {
  const key = Math.round(t * 1e4);
  const hit = herMemo.get(key);
  if (hit) return hit;
  const raw = herAtRaw(t);
  const p = raw.pose;
  const root = raw.root;
  // 头发、围巾的「下」：顺着身子往脚那头（头朝下时朝上）；失重再乘上去
  const fl = (p.float as number | undefined) ?? 0;
  const r = (p.rot as number | undefined) ?? 0;
  p.gravity = [-Math.sin(r) * (1 - 2 * fl), Math.cos(r) * (1 - 2 * fl)];
  // 头发、围巾按她在世界里的速度往反方向甩（往下冲时往上扬，往上升时往下拖）；朝右的人横着取反
  {
    const c0 = herChest(t - 0.05);
    const v: V2 = [(raw.chest[0] - c0[0]) / 0.05, (raw.chest[1] - c0[1]) / 0.05];
    const face = (p.face as number | undefined) ?? 0;
    withDrag(p, [face > 0 ? -v[0] : v[0], v[1]], 0.55, 0.85);
  }
  // 铁靴拔下来以后那只脚光着
  if (t >= T8.boot1[0] + 0.1) p.legL = { ...(p.legL as object), boot: false } as PoseIn["legL"];
  if (t >= T8.boot2[0] + 0.1) p.legR = { ...(p.legR as object), boot: false } as PoseIn["legR"];
  const loc = (q: V2): V2 => [-(q[0] - root[0]), q[1] - root[1]];
  // 两只手环在他背上（他抱着砖在胸前）；拔靴时近处那只手去攥靴口；松手时张开
  const hold = E.io(ph(t, T8.catch - 0.1, T8.catch)) * (1 - E.io(ph(t, T8.release, T8.release + 0.15)));
  if (hold > 0) {
    const k = kidAt(t);
    const back: V2 = [k.chest[0] + 40, k.chest[1] + 10];
    const back2: V2 = [k.chest[0] + 34, k.chest[1] - 22];
    p.armR = { ...(p.armR as object), to: loc(back2), ik: hold } as PoseIn["armR"];
    let near = back;
    for (const side of ["L", "R"] as Side[]) {
      const [b0, , b2] = BOOT_T(side);
      const w = E.io(ph(t, b0 - 0.12, b0 + 0.02)) * (1 - E.io(ph(t, b2, b2 + 0.12)));
      if (w > 0) {
        const rim = bootRim(t, side);
        near = mix(near, [rim[0] - 4, rim[1] + 6], w);
      }
    }
    p.armL = { ...(p.armL as object), to: loc(near), ik: hold, chest: "over" } as PoseIn["armL"];
  }
  // 四声「活下去」最后：弯下腰，远处那只手伸下去握住他的手，一直握着落回街上（她跪下来时松开）
  const wc = E.io(ph(t, T9.reach + 0.1, T9.hand)) * (1 - E.io(ph(t, T9.kneel, T9.kneel + 0.25)));
  if (wc > 0) p.armR = { ...(p.armR as object), to: loc(clasp(Math.min(t, T9.land))), ik: wc } as PoseIn["armR"];
  // 尾奏：近处那只手摊开在他跟前接砖（手一沉）、抱住他时把砖按在胸口；远处那只手抱着他的背，站起来以后牵着他
  if (t >= 140.7) {
    const b = brickEnd(t, kidRoot(t));
    const near: V2 = t < T9.hug ? palmAt(t) : [b.c[0] - 30, b.c[1] + 8];
    p.armL = { ...(p.armL as object), to: loc(near), ik: E.io(ph(t, 140.7, 141.1)) } as PoseIn["armL"];
  }
  if (t >= T9.hug) {
    const kr = kidRoot(t);
    const back: V2 = [kr[0] + 30, kr[1] - 236];
    const handP: V2 = [(root[0] + kr[0]) / 2 + 20, -250];
    const to = mix(back, handP, E.io(ph(t, T9.rise, T9.rise + 0.4)));
    p.armR = { ...(p.armR as object), to: loc(to), ik: E.io(ph(t, T9.hug, T9.hug + 0.35)) } as PoseIn["armR"];
  }
  const out = { pose: p, root, chest: raw.chest };
  if (herMemo.size > 300) herMemo.clear();
  herMemo.set(key, out);
  return out;
}

// ——————————————— 画 ———————————————
const lineOf = (z: number) => 1 / Math.sqrt(Math.max(0.3, z));
/** 他（世界坐标）：自己那块砖、手里她那块；脚上的铁靴（套上以后） */
export function drawKid(g: CanvasRenderingContext2D, t: number, z: number) {
  const k = kidAt(t);
  const line = lineOf(z);
  const M = g.getTransform();
  // 他那块砖（还在手里时）画在他身子前面、近处那只手臂后面；插进靴口以后在两只靴子中间画（drawKidBoots）
  const before = (cc: CanvasRenderingContext2D) => {
    cc.save();
    cc.setTransform(M);
    if (t < 104.5) drawFinBrick(cc, "gift", k.gift.c, k.gift.rot, BS, -1, t);
    if (k.her && t >= 104.7 && t < T9.give) drawFinBrick(cc, "her", k.her.c, k.her.rot, BS, k.her.flipY, t);
    cc.restore();
  };
  // 远处那只铁靴（套上以后）先画、再画他、再画近处那只
  const boots = (side: Side) => {
    if (t >= T9.start) return;
    const s = bootState(t, side);
    if (s.on === "kid") drawBoot(g, s.a, s.rot, line, 1, side === "R" || t < T8.brickOut);
  };
  // 他的脚伸在靴筒里：两只靴子都画在他后面（远处那只先、近处那只后）——先套上的是近处那只
  drawPerson(g, STONE_BARE, k.pose, k.root[0], k.root[1], z, { beforeFrontArms: before });
  boots("R");
  if (t >= 104.5 && t < T9.start) {
    // 插在近处那只靴口里的「妈妈，明天见」（靴筒盖住插进去的一截）
    drawFinBrick(g, "gift", k.gift.c, k.gift.rot, BS, -1, t);
  }
  boots("L");
  // 她那块：震出来、落在地上（捡起来以后由 before 画在他手里）
  if (k.her && t < 104.7) drawFinBrick(g, "her", k.her.c, k.her.rot, BS, k.her.flipY, t);
  // 尾奏：他手里那支两块五的笔（按街上的大小画）
  if (k.her && t >= T9.kneel) {
    const pen = penAt(t, k.root, k.her);
    if (pen.on) {
      g.save();
      g.translate(pen.tip[0], pen.tip[1]);
      g.scale(BS, BS);
      drawPen(g, [(pen.palm[0] - pen.tip[0]) / BS, (pen.palm[1] - pen.tip[1]) / BS], [0, 0], line);
      g.restore();
    }
  }
}
/** 她（世界坐标）；holding：抱着他时他画在她的身子和近处那只手臂之间 */
export function drawHer(g: CanvasRenderingContext2D, t: number, z: number, inner?: (g: CanvasRenderingContext2D) => void) {
  const h = herAt(t);
  const line = lineOf(z);
  const M = g.getTransform();
  g.save();
  g.translate(h.root[0], h.root[1]);
  drawChengtuo(g, h.pose, {
    line,
    beforeFrontArms: inner
      ? (cc) => {
          cc.save();
          cc.setTransform(M);
          inner(cc);
          cc.restore();
        }
      : undefined,
  });
  g.restore();
  // 尾奏：放进她手里以后，那块砖（背面「沉沉，明天见」朝上）在她手上；亮起来
  if (t >= T9.give) {
    const b = brickEnd(t, kidRoot(t));
    drawFinBrick(g, "her", b.c, b.rot, BS, b.flipY, t, warmAt(t), line);
  }
  // 在她手里的那只靴子
  for (const side of ["R", "L"] as Side[]) {
    const s = bootState(t, side);
    if (s.on === "hand") drawBoot(g, s.a, s.rot, line, s.sx, true);
  }
}
/** 抱住以后到松手以前：两个人一起画 */
export const holding = (t: number) => t >= T8.catch && t < T8.release;
export { herMove, kidMove };
void LIMP;
void armL;
void armR;
void herm;

/** 「活」以后两只铁靴（他穿着、跺下去、从里面走出来以后留在坑里立着）和插在近处那只靴口上的「妈妈，明天见」：远处那只、砖、近处那只 */
export function drawStayBoots(g: CanvasRenderingContext2D, t: number, z: number) {
  const line = lineOf(z);
  const r = bootState(t, "R");
  drawBoot(g, r.a, r.rot, line, 1, true);
  const k = kidAt(Math.min(t, T9.stomp + 0.05));
  const rim = bootRim(t, "L");
  const gift = { c: [rim[0] + 6, rim[1] - 8] as V2, rot: -Math.PI / 2 };
  void k;
  drawFinBrick(g, "gift", gift.c, gift.rot, BS, -1, t);
  const l = bootState(t, "L");
  drawBoot(g, l.a, l.rot, line, 1, false);
}
export { BS };

// ——————————————— 尾奏：他在她那块砖的背面写「沉沉，明天见」，放进她手里（手一沉，砖暖了）；抱住；站起来往前一步 ———————————————
/** 她摊开的手心（近处那只，跪着时伸在她前面、他跟前）：砖放上去以后一沉，弹一下，稳住 */
export function palmAt(t: number): V2 {
  const d = t - T9.heavy;
  const dip = d > 0 ? 20 * (1 - Math.exp(-d / 0.06)) - 9 * Math.exp(-d / 0.18) * Math.sin(d * 18) * (1 - Math.exp(-d / 0.05)) : 0;
  return [X_LAND + 120, -206 + dip];
}
/** 写字时砖在哪（他近处那只手托着，背面朝上对着镜头） */
const writeAt = (root: V2): V2 => [root[0] - 64, root[1] - 214];
/** 尾奏里她那块砖：他翻到背面、托着写字 → 放进她手心 → 她抱着他时按在胸口 → 站起来抱在胸口 */
function brickEnd(t: number, root: V2): { c: V2; rot: number; flipY: number } {
  const chestP: V2 = [root[0] - 36, root[1] - 240];
  const w = writeAt(root);
  // 翻过来（138.9–139.15），挪到写字的地方
  const u = E.io(ph(t, 138.9, 139.15));
  let c = mix(chestP, w, u);
  const flipY = -Math.cos(Math.PI * u);
  let rot = 0;
  // 放进她手心
  const g = E.io(ph(t, T9.write1 + 0.05, T9.give));
  if (g > 0) c = mix(c, [palmAt(t)[0], palmAt(t)[1] - 12], g);
  // 抱住他：按在她胸口；站起来抱在胸口
  if (t > T9.hug) {
    const h = herAtRaw(t);
    const hc: V2 = [h.chest[0] + 46, h.chest[1] + 70];
    const k = E.io(ph(t, T9.hug, T9.hug + 0.4));
    c = mix(c, hc, k);
    rot = -0.2 * k;
  }
  return { c, rot, flipY };
}
/** 写字时笔在哪：笔尖在砖上（按写到第几个字），手心在笔尖右上；掏出来以前、收起来以后在裤兜那儿 */
export function penAt(t: number, root: V2, brick: { c: V2; rot: number }): { tip: V2; palm: V2; on: boolean } {
  const pocket: V2 = [root[0] + 18, root[1] - 150];
  const tipLocal = shenTip(t);
  const tip: V2 = [brick.c[0] + tipLocal[0] * BS, brick.c[1] + tipLocal[1] * BS];
  const out = E.io(ph(t, 138.95, T9.write0 - 0.05));
  const away = E.io(ph(t, T9.write1 + 0.02, T9.write1 + 0.24));
  const at = mix(mix(pocket, tip, out), pocket, away);
  return { tip: at, palm: [at[0] + 26, at[1] - 20], on: out > 0.05 && away < 0.95 };
}

/** 砖亮起来到多亮（0–1）：142.013 手一沉的那一下 0.4 秒亮到头，之后很慢地一明一暗 */
export const warmAt = (t: number) => (t < T9.heavy ? 0 : E.out(ph(t, T9.heavy, T9.heavy + 0.4)) * (0.94 + 0.06 * Math.sin((t - T9.heavy) * 5.2)));
/** 尾奏里她那块砖在哪（给暖光用） */
export const endBrick = (t: number) => brickEnd(t, kidRoot(t));
