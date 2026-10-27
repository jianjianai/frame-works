// 终章（lib/end_t.ts）的两个人：路线、动作、铁靴从她脚上换到他脚上、两块砖、他妈妈那件外套。世界坐标（街面 y = 0，往上为负）。
//
// 路线（占位见 lib/end_map.ts：一条竖线上，风往左吹）：
//   他：老钟窗户左边（X_K）脱下外套、举起「妈妈，明天见」，95.30 脚跟离地，越飞越快，被风往左带一点，99.02 在楼的一半被她抱住。
//   她：顶层最右那扇窗撞开防飘栏，97.92 往右下扑，头朝下越冲越快，正好在 99.02 迎上他；铁靴带着两个人往下坠、越坠越慢，
//       往右漂回 X_K 上方，100.27 靴底离地一点停住；又慢慢往上飘；交靴、掰手，103.45 松手。
//   他穿着铁靴往下坠，104.02「咚」落回 X_K；她光着脚一下子冲上去，越升越慢，被风往左带到楼顶的角上，112.0 停在白的边上。
//   他跺地（109.02）、从靴子里出来（113.96 / 114.46）往上飘，老钟攥住他的脚踝（115.02）；人链（lib/end_rise.ts）一节节把他送上去，
//   最后一个人站在街上不离地，整条人链绕着地上那一点随风摆，131.96 荡到她跟前。他朝她喊（第三声的回忆在 scenes/recall.ts），125.52 她已经倒挂着攥住楼顶的栏杆（翻身不拍），脚尖一点点化成光；
//   他正好把砖递到她手里（不翻面），132.01 立即亮起来；134.02 松开栏杆翻过来抱住他；看砖、眼泪掉在砖上（136.02）、闭上眼；
//   138.02 超强光；140.3 她抱着他落下来、140.5 人链散开，146.03 光着脚落在
//   坑的左边（X_LAND）；放下他（砖给他抱着），往后退一步，148.53 光着脚跺一下，地上一个坑（去捡外套给他穿上那段 2026-10-27 删了）。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { E, ph } from "./cam";
import { part } from "./world";
import { ARMS, hitch, live, withDrag } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { TE, type V2, mix } from "./end_t";
import { HER, KID } from "./end_poses";
import { CORNER, RAIL_TOP, X_K, herWindow } from "./end_map";
import { BS, HALF, drawEndBrick } from "./end_brick";
import { RIM_TOP, bootPt, drawBoot, shinRot } from "./end_boot";
import { H_GRAB, K_ARRIVE, chainTop } from "./end_rise";
import { coatButtons, leadBand, standCollar } from "./leadcoat";

// ——————————————— 地方 ———————————————
/** 他抱着她落回街上以后：她站在坑的左边，他被放在她右边，他妈妈那件外套（被跺地那一下掀到坑的左边）在他右边 */
export const X_LAND = X_K - 700;
const KID_DOWN = X_LAND + 120;
/** 外套：脱下来堆在他脚边（左前）→ 跺地那一下被掀飞到她落地那块地方的左边（她去捡起来给他穿上） */
export const COAT_X0 = X_K - 170;
// 落在她左边稍远一点（2026-10-26 原来 X_K − 840，外套堆的右沿就在她左脚边，她往左一迈就踩在外套上）
export const COAT_X1 = X_K - 940;
/** 坑（两只铁靴底下）；跺下去那一下铁靴陷进去多深 */
export const CRATER_X = X_K - 14;
export const STOMP_SINK = 24;
/** 穿着她的铁靴站在街上时他的根：铁靴的底（脚踝下面 63.6）踩在街面上，他的脚踝在根上方 39 */
export const KID_BOOT_Y = 39 - 63.6;

// ——————————————— 他飞上去（被抱住以前） ———————————————
const STONE_COAT = CAST.小石头穿妈妈的外套;
export const STONE: CastSpec = { ...CAST.小石头, coat: undefined };
const SC = STONE.scale;
/** 他胸口相对根（飘着、被抱着的姿势） */
const KID_CHEST: V2 = [4, -232];
/** 抱住时他的根离地多高（楼的一半）、被风往左带到哪 */
const H_C = 4100;
const X_C = X_K - 300;
function kidSolo(t: number): V2 {
  if (t < TE.lift0) return [X_K, 0];
  const u = Math.min(1, (t - TE.lift0) / (TE.catch - TE.lift0));
  return [X_K + (X_C - X_K) * Math.pow(u, 1.5), -H_C * Math.pow(u, 1.7)];
}

// ——————————————— 她的胸口 ———————————————
/** 胸口：两肩中点往胯那边挪 1/4（转身、倒过来时跟着身子转） */
export const chestOf = (j: { shoulderL: number[]; shoulderR: number[]; hip: number[] }): V2 => {
  const sx = (j.shoulderL[0] + j.shoulderR[0]) / 2;
  const sy = (j.shoulderL[1] + j.shoulderR[1]) / 2;
  return [sx + 0.25 * (j.hip[0] - sx), sy + 0.25 * (j.hip[1] - sy)];
};
const herOff = (p: PoseIn) => chestOf(jointsOf(p));
const BOOTED = { boots: true, bricks: 2 };
const BARE = { boots: false, bricks: 0 };
const OFF_REACH = herOff(figurePose({ ...HER.够地 }, 0, CHENGTUO, BOOTED));
const OFF_HOVER = herOff(figurePose({ ...HER.开 }, 0, CHENGTUO, BARE));
const OFF_STAND = herOff(figurePose({ ...HER.站抱 }, 0, CHENGTUO, BARE));

const WIN = herWindow();
const WIN_C: V2 = [WIN.x + WIN.w / 2, WIN.y + WIN.h / 2];
/** 撞开防飘栏那一下她在窗口（胸口）；扑出去那一刻 */
const BURST: V2 = [WIN_C[0] + 40, WIN_C[1] + 70];
const FALL_START: V2 = [WIN_C[0] + 150, WIN_C[1] + 150];
/** 抱住那一刻（她头朝下）她的胸口相对他的胸口；身子甩过来以后（面对面，他在她右边低一点） */
const CATCH_OFF: V2 = [-20, -190];
const HOLD_OFF: V2 = [-60, -112];
/** ② 他接住她那一刻（她头朝下搂着他）她的胸口相对他的胸口 */
const DIVE_OFF: V2 = [-115, -175];
/** ② 接住那一下她左手把砖按在他胸前的地方（相对他的胸口） */
const PRESS: V2 = [-30, -10];
const KID_AT_CATCH = kidSolo(TE.catch);
const CHEST_AT_CATCH: V2 = [KID_AT_CATCH[0] + KID_CHEST[0] + CATCH_OFF[0], KID_AT_CATCH[1] + KID_CHEST[1] + CATCH_OFF[1]];
/** 停住：她的靴底离地 280（够地的姿势；原来 30，用户：「离地面太近了，需要远一点」） */
const STOP_Y = -280 + OFF_REACH[1];
/** 抱着他时她胸口横着在哪，他才正好在 X_K 上方 */
const X_STOP = X_K - KID_CHEST[0] + HOLD_OFF[0];
const T_IN = TE.stop - TE.catch;
/** 惯性：从抱住那一刻的速度匀减速，停在 STOP_Y */
const V_CATCH = (2 * (STOP_Y - CHEST_AT_CATCH[1])) / T_IN;
/** 扑下来：从窗口起步，越冲越快，到抱住时正好是 V_CATCH（速度接上） */
const FALL = TE.catch - TE.jump;
const FALL_V0 = (2 * (CHEST_AT_CATCH[1] - FALL_START[1])) / FALL - V_CATCH;
const FALL_A = (V_CATCH - FALL_V0) / FALL;
const DX_DIVE = CHEST_AT_CATCH[0] - FALL_START[0];
/** 惯性往右漂：起步速度接上扑下来时横着的速度 */
const DX_FALL = X_STOP - CHEST_AT_CATCH[0];
const K_FALL = Math.max(1.2, ((1.15 * DX_DIVE) / FALL) * T_IN / Math.max(1, DX_FALL));
/** 又飘起来：每秒往上 160（柔和地起来） */
const RISE_V = 160;
const riseS = (s: number, tau: number) => Math.max(0, s - tau * (1 - Math.exp(-s / tau)));

/** 白的边上停住的地方（胸口）：楼顶右边那个角的外面（悬在半空），头顶刚好在白底下，光着的脚在栏杆旁边 */
const HOVER: V2 = [CORNER[0] + 96, -8560 + OFF_HOVER[1]];
/** 倒挂：两只手攥着楼顶右边那个角的栏杆，身子被白往上拽（用户 2026-10-26：「这里主角不应该是抓住楼顶的栅栏吗？」） */
const HANG_J = jointsOf(figurePose({ ...HER.倒挂 }, 0, CHENGTUO, BARE));
const RAIL_GRIP: V2 = [CORNER[0] - 20, RAIL_TOP + 3];
const HOLD_ROOT: V2 = [RAIL_GRIP[0] - (HANG_J.palmL[0] + HANG_J.palmR[0]) / 2, RAIL_GRIP[1] - (HANG_J.palmL[1] + HANG_J.palmR[1]) / 2];
const HOLD_C: V2 = [HOLD_ROOT[0] + chestOf(HANG_J)[0], HOLD_ROOT[1] + chestOf(HANG_J)[1]];
/** 两只手攥栏杆的地方（远处那只、近处那只） */
const RAIL_L: V2 = [CORNER[0] + 2, RAIL_TOP + 4];
const RAIL_R: V2 = [CORNER[0] - 46, RAIL_TOP + 3];
/** 他到她跟前时的根（举过头顶的砖正好在她胸口前面） */
export const K_ARR: V2 = K_ARRIVE;
/** 落地那一刻她的胸口（站着、抱着他） */
const P_LAND: V2 = [X_LAND + OFF_STAND[0], OFF_STAND[1]];

// 松手以后往上冲：一下子轻了，越升越快、再越升越慢地停在白底下（按速度积出来的表）
const UP0 = TE.release;
const UP1 = 112.0;
let UP: { y: Float64Array; x0: number; y0: number } | null = null;
function upTable() {
  if (UP) return UP;
  const c0 = chestHold(UP0);
  const T = UP1 - UP0;
  const n = Math.ceil(T * 120) + 2;
  const D = c0[1] - HOVER[1];
  // 速度：从每秒 160 柔和地接过去，冲到最快，再按 (1 − u)^1.5 慢下来；先积两部分，再按总高度定最快多快
  const w = (s: number) => 1 - Math.exp(-s / 0.12);
  let I0 = 0;
  let I1 = 0;
  for (let i = 0; i < n - 1; i++) {
    const s = (i + 0.5) / 120;
    const u = Math.min(1, s / T);
    I0 += (RISE_V * (1 - w(s))) / 120;
    I1 += (Math.pow(1 - u, 1.5) * w(s)) / 120;
  }
  const c = (D - I0) / I1;
  const y = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const s = (i - 0.5) / 120;
    const u = Math.min(1, s / T);
    y[i] = y[i - 1] + (RISE_V * (1 - w(s)) + c * Math.pow(1 - u, 1.5) * w(s)) / 120;
  }
  UP = { y, x0: c0[0], y0: c0[1] };
  return UP;
}
/** 抱住以后到松手：两个人按她的胸口走 */
function chestHold(t: number): V2 {
  if (t < TE.stop) {
    const s = t - TE.catch;
    const v = s / T_IN;
    return [CHEST_AT_CATCH[0] + DX_FALL * (1 - Math.pow(1 - v, K_FALL)), CHEST_AT_CATCH[1] + V_CATCH * s - (V_CATCH * s * s) / (2 * T_IN)];
  }
  const s = t - TE.stop;
  return [X_STOP, STOP_Y - RISE_V * riseS(s, 0.3)];
}
/** 她的胸口（世界坐标）：落地以前 */
export function herChest(t: number): V2 {
  if (t < TE.jump) return mix(BURST, FALL_START, E.out(ph(t, TE.bang, TE.jump)));
  if (t < TE.catch) {
    const s = t - TE.jump;
    return [FALL_START[0] + DX_DIVE * Math.pow(s / FALL, 1.15), FALL_START[1] + FALL_V0 * s + 0.5 * FALL_A * s * s];
  }
  if (t < TE.release) return chestHold(t);
  if (t < UP1) {
    const U = upTable();
    const s = t - UP0;
    const f = Math.min(U.y.length - 1.001, s * 120);
    const i = Math.floor(f);
    const up = U.y[i] + (U.y[i + 1] - U.y[i]) * (f - i);
    const u = Math.min(1, s / (UP1 - UP0));
    return [U.x0 + (HOVER[0] - U.x0) * (1 - Math.pow(1 - u, 2.2)), U.y0 - up];
  }
  const bob = (t0: number): V2 => {
    const k = E.io(ph(t0, UP1, UP1 + 0.8));
    return [HOVER[0] + 6 * Math.sin((t0 - UP1) * 1.1) * k, HOVER[1] + 9 * Math.sin((t0 - UP1) * 0.8) * k];
  };
  if (t < TE.flip0) return bob(t);
  if (t < TE.hug) {
    // 翻身不拍（2026-10-27 用户：「不用添加翻身的动作」「她之前就抓好了」）：回忆盖着的时候她就倒挂在栏杆上方了；之后倒挂着轻轻晃
    const a: V2 = HOLD_C;
    const k = E.io(ph(t, TE.hang, TE.hang + 0.6));
    return [a[0] + 5 * Math.sin((t - TE.hang) * 1.3) * k, a[1] + 4 * Math.sin((t - TE.hang) * 2.1) * k];
  }
  if (t < TE.pairDown) {
    // ② 松开栏杆，头朝下朝他扑过去（横着蹬出去先快、竖着越坠越快）；他接住她（embrace）以后胸口贴着他，
    // 腿从楼那边荡下来转正：胸口从他左上方（头朝下）挪到抱着他的地方（和抱着往下坠时一样）
    const k = kidRoot(t);
    const kc: V2 = [k[0] + KID_CHEST[0], k[1] + KID_CHEST[1]];
    if (t < TE.embrace) {
      const hold: V2 = [HOLD_C[0] + 5 * Math.sin((TE.hug - TE.hang) * 1.3), HOLD_C[1] + 4 * Math.sin((TE.hug - TE.hang) * 2.1)];
      const ke = kidRoot(TE.embrace);
      const to: V2 = [ke[0] + KID_CHEST[0] + DIVE_OFF[0], ke[1] + KID_CHEST[1] + DIVE_OFF[1]];
      const u = ph(t, TE.hug, TE.embrace);
      return [hold[0] + (to[0] - hold[0]) * (u * (1.6 - 0.6 * u)), hold[1] + (to[1] - hold[1]) * u * u];
    }
    const off = mix(DIVE_OFF, HOLD_OFF, E.io(ph(t, TE.embrace, TE.upright)));
    return [kc[0] + off[0], kc[1] + off[1]];
  }
  // 人链散开，抱着他慢慢落回街上：开头几乎不动，越落越快，到一半最快，再越落越慢，落地那一刻速度是 0
  const p0 = herChest(TE.pairDown - 1e-4);
  const u = ph(t, TE.pairDown, TE.herLand);
  const s = u * u * u * (u * (6 * u - 15) + 10);
  const sway = 14 * Math.sin(u * Math.PI * 2) * (1 - u);
  return [p0[0] + (P_LAND[0] - p0[0]) * s + sway, p0[1] + (P_LAND[1] - p0[1]) * s];
}

// ——————————————— 他的根 ———————————————
/** 抱着时他的胸口相对她的胸口：抱住那一下从头朝下的位置甩到面对面 */
function holdOff(t: number): V2 {
  return mix(CATCH_OFF, HOLD_OFF, E.io(ph(t, TE.catch, TE.catch + 0.36)));
}
let DROP0: { p: V2; v: V2 } | null = null;
const KID_DROP = TE.land - TE.release;
/** 从铁靴里出来的那一刻他的根 */
const OUT_ROOT: V2 = [X_K, KID_BOOT_Y + STOMP_SINK];
/** 老钟攥住他那一刻他的根（老钟窗户左边，脚踝在老钟探出窗的手上） */
const GRAB_ROOT: V2 = [X_K + 10, -H_GRAB];
/** 被放下、去捡外套、走回来 */
const kidStreetX = (t: number) => {
  const toCoat = E.io(ph(t, 139.36, 139.86));
  const back = E.io(ph(t, 140.06, 140.5));
  return KID_DOWN + (COAT_X1 - 70 - KID_DOWN) * toCoat - (COAT_X1 - 70 - KID_DOWN) * back + 20 * back;
};
export function kidRoot(t: number): V2 {
  if (t < TE.catch) return kidSolo(t);
  if (t < TE.release) {
    const c = herChest(t);
    const o = holdOff(t);
    return [c[0] - o[0] - KID_CHEST[0], c[1] - o[1] - KID_CHEST[1]];
  }
  if (t < TE.land) {
    if (!DROP0) {
      const a = kidRoot(TE.release - 1e-4);
      const b = kidRoot(TE.release - 0.01);
      DROP0 = { p: a, v: [(a[0] - b[0]) / (0.01 - 1e-4), (a[1] - b[1]) / (0.01 - 1e-4)] };
    }
    const s = t - TE.release;
    const g = (2 * (KID_BOOT_Y - DROP0.p[1] - DROP0.v[1] * KID_DROP)) / (KID_DROP * KID_DROP);
    const u = s / KID_DROP;
    return [DROP0.p[0] + (X_K - DROP0.p[0]) * u, DROP0.p[1] + DROP0.v[1] * s + 0.5 * g * s * s];
  }
  if (t < TE.out1) return [X_K, KID_BOOT_Y + STOMP_SINK * E.out(ph(t, TE.stomp, TE.stomp + 0.05))];
  if (t < TE.zGrab) {
    // 一只脚、再一只脚拔出来（身子提起来 140），离了地往上冲，被老钟一把攥住
    if (t < TE.out2 + 0.1) {
      const u = E.io(ph(t, TE.out1, TE.out2 + 0.1));
      return [OUT_ROOT[0], OUT_ROOT[1] - 140 * u];
    }
    const D = TE.zGrab - (TE.out2 + 0.1);
    const u = (t - (TE.out2 + 0.1)) / D;
    const h = (a: number, va: number, b: number, vb: number) => {
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * D * va + (-2 * u3 + 3 * u2) * b + (u3 - u2) * D * vb;
    };
    return [h(OUT_ROOT[0], 0, GRAB_ROOT[0], 0), h(OUT_ROOT[1] - 140, -420, GRAB_ROOT[1], -500)];
  }
  if (t < TE.pairDown) {
    // 被攥住：一拽一顿；之后人链一节节把他送上去，随风摆，一阵风把他荡到她跟前（lib/end_rise.ts 的 chainTop）
    const s = t - TE.zGrab;
    const tug = 34 * Math.exp(-s / 0.14) * Math.sin(s * 26);
    const strain = t < TE.zOut ? 4 * Math.sin(t * 13) * E.io(ph(t, TE.zGrab + 0.4, TE.zOut)) : 0;
    const c = chainTop(t);
    const bob = t > TE.arrive ? 5 * Math.sin((t - TE.arrive) * 2.3) * E.io(ph(t, TE.arrive, TE.arrive + 0.6)) : 0;
    // ② 接住扑过来的她：被撞得往右、往下一晃，再回来（人链跟着）
    const s2 = (t - TE.embrace) / 0.22;
    const hit = s2 > 0 ? s2 * Math.exp(1 - s2) : 0;
    return [c[0] + 48 * hit, c[1] + tug + strain + bob + 24 * hit];
  }
  if (t < TE.putDown) {
    // 在她怀里（落回街上）
    const c = t < TE.herLand ? herChest(t) : landedChest(t);
    return [c[0] - HOLD_OFF[0] - KID_CHEST[0], c[1] - HOLD_OFF[1] - KID_CHEST[1]];
  }
  // 放下来，站在她右边
  const held = (() => {
    const c = landedChest(TE.putDown);
    return [c[0] - HOLD_OFF[0] - KID_CHEST[0], c[1] - HOLD_OFF[1] - KID_CHEST[1]] as V2;
  })();
  const u = E.io(ph(t, TE.putDown, TE.putDown + 0.4));
  return [held[0] + (KID_DOWN - held[0]) * u, held[1] * (1 - u)];
}

// ——————————————— 动作 ———————————————
const KID_KEYS: MoveKey[] = [
  { t: 94.0, x: 0, p: KID.仰望 },
  { t: TE.shrug0, p: KID.仰望 },
  { t: TE.shrug0 + 0.14, ease: "out", p: KID.脱 },
  { t: TE.off + 0.16, p: KID.脱 },
  { t: TE.raise1, ease: "inOut", p: KID.举 },
  { t: TE.lift0, p: KID.举 },
  { t: TE.lift0 + 0.4, ease: "inOut", p: KID.飘 },
  // 看见她从上面扑下来：一惊，把砖收到胸前
  { t: 98.66, p: KID.飘 },
  { t: 98.84, ease: "out", p: KID.惊 },
  { t: TE.catch + 0.02, p: KID.惊 },
  { t: TE.catch + 0.3, ease: "inOut", p: KID.被抱 },
  // 快到地面：低头看着底下的街面
  { t: 99.78, p: KID.被抱 },
  { t: 100.05, ease: "inOut", p: KID.看地 },
  { t: 100.42, p: KID.看地 },
  { t: 100.72, ease: "inOut", p: KID.被抱 },
  // 她看自己的铁靴：他看着她
  { t: TE.decide + 0.1, p: KID.被抱 },
  { t: TE.decide + 0.32, ease: "inOut", p: KID.看她 },
  // 铁靴套上一只，那条腿就被坠直一条
  { t: TE.boot1[2] - 0.02, p: KID.看她 },
  { t: TE.boot1[2] + 0.12, ease: "out", p: { ...KID.看她, ...legL(-4, -6, 0) } },
  { t: TE.boot2[2] - 0.02, p: { ...KID.看她, ...legL(-4, -6, 0) } },
  { t: TE.boot2[2] + 0.1, ease: "out", p: KID.套 },
  // 明白过来：攥住她的围巾，拼命摇头
  { t: TE.clutch - 0.04, p: KID.套 },
  { t: TE.clutch + 0.1, ease: "out", p: KID.攥 },
  // 她摸他的头：不摇了，缩着脖子闭上眼哭（和第一天被她摸头时一样缩着脖子）；自己松开攥着围巾的手
  { t: TE.patOn - 0.02, p: KID.攥 },
  { t: TE.patOn + 0.16, ease: "inOut", p: KID.被摸 },
  { t: TE.letGo, p: KID.被摸 },
  { t: TE.letGo + 0.12, ease: "inOut", p: { ...KID.被摸, handL: "open" } },
  // 松手：铁靴一沉，往下坠，远处那只手往上伸着够她
  { t: TE.release + 0.04, ease: "inOut", p: { ...KID.被摸, handL: "open", handR: "open", blink: 0 } },
  { t: TE.release + 0.24, ease: "inOut", p: KID.坠 },
  { t: TE.land - 0.02, p: KID.坠 },
  { t: TE.land + 0.1, ease: "out", squash: 0.1, p: KID.站仰 },
  // 天上掉下来一块砖：伸着的手垂下来，头跟着它一路低下来；「咚」砸在靴尖前面，一惊，低头看着它
  { t: TE.land + 0.12, p: KID.站仰 },
  { t: TE.brickHit - 0.2, ease: "inOut", p: { ...KID.看砖, neck: 24, lookY: -0.9, expression: "吓一跳" } },
  { t: TE.brickHit - 0.04, ease: "inOut", p: { ...KID.看砖, neck: 2, lookY: 0.3, expression: "吓一跳" } },
  { t: TE.brickHit + 0.06, ease: "out", squash: 0.04, p: { ...KID.看砖, expression: "吓一跳" } },
  { t: TE.brickHit + 0.24, ease: "inOut", p: KID.看砖 },
  // （第一视角里捡起她那块砖）抱在胸口，仰着头
  { t: TE.pov + 0.1, p: KID.看砖 },
  { t: TE.smile - 0.1, ease: "inOut", p: KID.抱砖仰 },
  // 跺地：拼命抬起一只铁靴，跺下去
  { t: TE.heave0, p: KID.抱砖仰 },
  { t: TE.heave1, ease: "inOut", p: KID.抬靴 },
  { t: TE.stomp - 0.05, p: { ...KID.抬靴, legR: undefined, ...legR(92, -86, 0) } as never },
  { t: TE.stomp, ease: "in", squash: 0.14, p: KID.跺 },
  { t: TE.stomp + 0.12, ease: "out", p: KID.跺 },
  { t: TE.stomp + 0.7, ease: "inOut", p: KID.仰 },
  // 一只、再一只脚从她的铁靴里拔出来，往上冲；老钟攥住他的脚踝
  { t: TE.out1 - 0.12, p: KID.仰 },
  { t: TE.out1 + 0.1, ease: "inOut", p: KID.出L },
  { t: TE.out2 + 0.1, ease: "inOut", p: KID.出R },
  { t: TE.out2 + 0.34, ease: "inOut", p: KID.飞 },
  { t: TE.zGrab - 0.02, p: KID.飞 },
  { t: TE.zGrab + 0.08, ease: "out", squash: -0.06, p: KID.被拽 },
  { t: TE.zGrab + 0.4, ease: "inOut", p: KID.被拽 },
  { t: TE.zGrab + 0.8, ease: "inOut", p: KID.挣 },
  { t: TE.zOut, p: KID.挣 },
  { t: TE.zOut + 0.1, ease: "out", squash: -0.04, p: KID.挣 },
  // 低头看见街上的人一个个跑来抓住、救他：哭着笑（眼睛先往下、头再跟）
  { t: TE.joins[0] + 0.1, p: KID.挣 },
  { t: TE.joins[0] + 0.25, ease: "out", p: { ...KID.挣, lookX: 0.1, lookY: 0.9 } },
  { t: TE.joins[0] + 0.55, ease: "inOut", p: KID.看人 },
  // 越飘越高，往下看着大家；第三声前抬起头找白的边上的她，「活」朝她拼命喊（远处那只手伸直了够她）；
  // 之后（镜头在她那边）两只手抱好砖（2026-10-27 重排：原来第三声更深地低下头，镜头从他往下把每个人看过去）
  { t: TE.call0, p: KID.看人 },
  { t: TE.call - 0.1, ease: "inOut", p: KID.找她 },
  { t: TE.call + 0.1, ease: "out", p: KID.喊 },
  { t: 123.2, p: KID.喊 },
  { t: 123.9, ease: "inOut", p: KID.高处 },
  { t: TE.pull0 - 0.4, p: KID.高处 },
  // 第四声风把他往右、再往左荡：抬头找她
  { t: TE.pull0 + 0.6, ease: "inOut", p: KID.高处仰 },
  // 「在这反乌托邦里」荡向她：把砖举起来伸过去，句子唱完递到她手里；她一接过来就松开栏杆抱住他
  // 荡过去的路上两只手把砖往左伸给她，越伸越用力，身子探过去（用户 2026-10-27：「小石头用力向左递」）
  { t: TE.hand - 1.8, p: KID.高处仰 },
  { t: TE.hand - 1.0, ease: "inOut", p: KID.递左 },
  { t: TE.hand + 0.05, p: KID.递左 },
  // ① 交到她手里以后：近处那只手去摸她的脸（IK 见 kidAt），远处那只攥着拳收到胸口，哭着笑看着她；
  // ② 她松开栏杆翻过来：两只手张开去接她，抱住以后搂住她的脖子（用户 2026-10-27：「小石头胳膊动作需要继续打磨」——原来两只手一直直直地举着）
  { t: TE.hand + 0.45, ease: "inOut", p: KID.摸脸 },
  { t: TE.hug - 0.4, p: KID.摸脸 },
  // ② 她要松手了：两只手张开等着接她；接住以后搂住她
  { t: TE.hug - 0.05, ease: "inOut", p: KID.接她 },
  { t: TE.embrace - 0.02, p: KID.接她 },
  { t: TE.embrace + 0.3, ease: "inOut", p: KID.被抱2 },
  // 落回街上，被放下来：站着，抱着砖，仰头看她
  { t: TE.putDown, p: KID.被抱2 },
  { t: TE.putDown + 0.4, ease: "inOut", p: KID.站看 },
  // （她给他披上外套那段 2026-10-27 删了）
  // 她光着脚跺下去：一惊，低头看坑，再抬头看她，哭着笑
  { t: TE.stomp2, p: KID.站看 },
  { t: TE.stomp2 + 0.08, ease: "out", squash: 0.04, p: { ...KID.站看, expression: "吓一跳", neck: -18, lookX: -0.4, lookY: 0.9 } },
  { t: TE.stomp2 + 0.9, p: { ...KID.站看, expression: "吓一跳", neck: -18, lookX: -0.4, lookY: 0.9 } },
  { t: TE.stomp2 + 1.3, ease: "inOut", p: { ...KID.站看, expression: "哭着笑", neck: 16, lookY: -0.5 } },
  { t: 153, p: { ...KID.站看, expression: "哭着笑", neck: 16, lookY: -0.5 } },
] as MoveKey[];

const HER_KEYS: MoveKey[] = [
  { t: 97.4, x: 0, items: BOOTED, p: HER.扑 },
  { t: TE.jump + 0.02, p: HER.扑 },
  { t: TE.jump + 0.2, ease: "inOut", p: HER.冲 },
  // 头朝下一直冲到他跟前，两只手环住他；抱住以后身子才甩过来
  { t: TE.catch + 0.02, p: HER.冲 },
  { t: TE.catch + 0.36, ease: "inOut", p: HER.抱 },
  { t: TE.catch + 0.62, ease: "inOut", p: HER.抱坠 },
  // 快到地面：两只脚使劲往下够石板——差一点
  { t: 99.86, p: HER.抱坠 },
  { t: 100.14, ease: "inOut", p: HER.够地 },
  { t: TE.stop + 0.18, p: HER.够地 },
  // 又飘起来了：看着他（心疼）；窗一扇扇关上，她看了一眼
  { t: TE.stop + 0.5, ease: "inOut", p: HER.抱升 },
  { t: 100.95, p: HER.抱升 },
  { t: 101.15, ease: "inOut", p: HER.看窗 },
  { t: 101.5, p: HER.看窗 },
  { t: 101.72, ease: "inOut", p: HER.抱升 },
  // 看看他，看看自己的铁靴
  { t: TE.decide, p: HER.抱升 },
  { t: TE.decide + 0.08, ease: "inOut", p: HER.看靴 },
  // 近处那只（L）：膝盖抬起来，近处那只手攥住靴口拔下来，翻过来套到他近处那只脚上；再远处那只（R）
  { t: TE.boot1[0] - 0.06, ease: "inOut", p: HER.拔L },
  { t: TE.boot1[1], p: HER.拔L },
  { t: TE.boot1[2] - 0.04, ease: "inOut", p: { ...HER.看靴, ...legL(-6, -20, -46) } },
  { t: TE.boot2[0] + 0.04, ease: "inOut", p: { ...HER.拔R, ...legL(-6, -20, -46) } },
  { t: TE.boot2[1], p: { ...HER.拔R, ...legL(-6, -20, -46) } },
  { t: TE.boot2[2] - 0.02, ease: "inOut", p: HER.光脚抱 },
  // 他攥着围巾摇头：她含着泪冲他笑，伸手摸摸他的头（和第一天一样）
  { t: TE.pat0 - 0.04, p: HER.光脚抱 },
  { t: TE.patOn, ease: "inOut", p: HER.摸头 },
  { t: TE.release, p: HER.摸头 },
  // 松手：光着脚一下子轻了，往上冲，低头冲他笑
  { t: TE.release + 0.22, ease: "out", p: HER.放 },
  { t: 104.4, p: HER.放 },
  { t: 104.9, ease: "inOut", p: HER.升 },
  { t: TE.smile + 0.08, p: HER.升 },
  { t: TE.smile + 0.42, ease: "inOut", p: HER.笑 },
  { t: TE.faceUp0, p: HER.笑 },
  { t: TE.faceUp1, ease: "inOut", p: HER.仰 },
  // 慢放：到了白的边上，闭上眼睛，张开手
  { t: 109.95, p: HER.仰 },
  { t: 111.2, ease: "inOut", p: HER.开 },
  // 第三声（2026-10-27 重排）：他喊完溶进回忆，她一直在画外闭着眼；拍上切回来她已经倒挂着抓住栏杆（翻身不拍，用户：「不用添加翻身的动作」）
  { t: TE.flip0, p: HER.开 },
  { t: TE.flip0 + 0.001, ease: "hold", p: HER.倒挂 },
  { t: TE.hang + 0.15, p: HER.倒挂 },
  { t: TE.hang + 0.45, ease: "inOut", p: HER.倒挂哭 },
  { t: TE.hand - 0.5, p: HER.倒挂哭 },
  // 远处那只手松开栏杆接住砖，一接过来就亮（不翻面），哭着笑；
  // 立即松开栏杆抱住他，被砖坠着转正（用户 2026-10-26：「主角接到之后立即正过来，把之前等一会正过来情节的去掉」；
  // 原来接住以后看砖、抬头看他哭着笑，过 2 秒才抱住，再 1.3 秒才转正）：腿从左边（楼那边）荡下来，不从他身上扫过去（180° 和 −180° 是同一个样子，换过去不动）
  { t: TE.hand - 0.12, ease: "inOut", p: HER.接 },
  { t: TE.hand + 0.08, ease: "inOut", p: HER.哭笑 },
  { t: TE.hug, p: HER.哭笑 },
  { t: TE.hug + 0.001, ease: "hold", p: { ...HER.哭笑, rot: -180 } },
  // ② 头朝下朝他扑过去 → 他接住 → 腿从楼那边荡下来转正，荡过头一点再回来
  { t: TE.hug + 0.2, ease: "out", p: HER.扑他 },
  { t: TE.embrace, ease: "inOut", p: HER.倒抱 },
  { t: TE.upright, ease: "inOut", p: HER.抱他 },
  { t: TE.upright + 0.15, ease: "out", p: { ...HER.抱他, rot: 7 } },
  { t: TE.upright + 0.34, ease: "inOut", p: HER.抱他 },
  // 转正以后睁开眼，低头看着手里的砖（自己写的「活下去」），哭着笑，一滴眼泪往下掉在砖上；砸下去以后闭上眼，哭着笑
  { t: TE.eyesOpen - 0.04, p: HER.抱他 },
  { t: TE.eyesOpen + 0.16, ease: "inOut", p: HER.抱他看 },
  { t: TE.eyesShut, p: HER.抱他看 },
  { t: TE.eyesShut + 0.5, ease: "inOut", p: HER.抱他闭眼 },
  // 抱着他慢慢落下来
  { t: TE.pairDown + 0.2, p: HER.抱他闭眼 },
  { t: TE.pairDown + 0.9, ease: "inOut", p: HER.落 },
  { t: TE.herLand - 0.3, p: HER.落 },
  { t: TE.herLand, ease: "inOut", squash: 0.05, p: HER.站抱 },
  { t: TE.herLand + 0.2, p: HER.站抱 },
  // 放下他（砖给他抱着）
  { t: TE.putDown, ease: "inOut", p: HER.放下 },
  { t: TE.putDown + 0.25, p: HER.放下 },
  // 直起身看着他，往后退一步（2026-10-27 去捡他妈妈的外套、走回来跪下给他披上那段删了，用户：「应该删减后面结尾无聊的内容」；
  // 原来的转身、迈步、捡、跪披、站起来的关键帧在版本 d52d6bd）
  { t: TE.putDown + 0.55, ease: "inOut", p: HER.站弓 },
  { t: TE.back - 0.18, ease: "inOut", p: HER.退抬 },
  { t: TE.back, ease: "inOut", p: HER.退落 },
  { t: TE.back + 0.14, ease: "inOut", p: HER.收 },
  { t: TE.back + 0.3, ease: "inOut", p: HER.站空 },
  // 抬起一只光脚、抬到最高憋一口气——「嘭」跺下去（膝盖跟着一沉），地上一个坑
  { t: TE.stomp2 - 0.6, p: HER.站空 },
  { t: TE.stomp2 - 0.24, ease: "inOut", p: HER.抬脚 },
  { t: TE.stomp2 - 0.12, ease: "out", p: HER.抬脚憋 },
  { t: TE.stomp2, ease: "in", squash: 0.08, p: HER.跺2 },
  { t: TE.stomp2 + 0.2, ease: "out", p: HER.跺2 },
  { t: TE.stomp2 + 1.1, ease: "inOut", p: HER.笑看 },
  { t: 153, p: HER.笑看 },
] as MoveKey[];

/** 她：手臂、脖子按弹簧跟；倒挂时手臂一直在抖（使劲攥着），哭的时候肩膀一抽一抽 */
const herMove = live(HER_KEYS, {
  look: CHENGTUO,
  base: { chestL: "under", chestR: "under", wind: -0.6 },
  idle: true,
  seed: 1021,
  springs: ARMS,
  follow: 0,
  add: (t, o) => {
    // 倒挂着使劲攥着：手臂一直在抖；哭的时候肩膀一抽一抽
    if (t > TE.hang && t < TE.hand) {
      o.elbowL += 2.5 * Math.sin(t * 31);
      o.elbowR += 2.5 * Math.sin(t * 29 + 1);
      o.neck += 3 * hitch(t, 1.1);
    }
  },
});
const kidMove = live(KID_KEYS, {
  look: lookOf(STONE),
  base: { wind: -0.7 },
  idle: true,
  seed: 1011,
  springs: ARMS,
  follow: 0,
  add: (t, o) => {
    // 攥着她的围巾拼命摇头；她的手落到他头上就不摇了
    if (t > TE.clutch && t < TE.patOn + 0.2) o.neck += 9 * Math.sin((t - TE.clutch) * 21) * Math.min(1, (t - TE.clutch) / 0.1) * (1 - E.io(ph(t, TE.patOn - 0.04, TE.patOn + 0.14)));
  },
});

// ——————————————— 铁靴：她脚上 → 被她近处那只手拔下来、翻过来 → 套在他脚上 → 留在坑里 ———————————————
type Side = "L" | "R";
const BOOT_T = (side: Side) => (side === "L" ? TE.boot1 : TE.boot2);
const OUT_T = (side: Side) => (side === "L" ? TE.out1 : TE.out2);
function herRaw(t: number) {
  return herMove(t).pose;
}
/**
 * 落地以后哪只脚钉在地上：从这一刻起按这只脚反推根（往左一步、屈膝捡、往右一步、跪下、站起来、退一步、跺脚都不打滑）。
 * null：原地转身（过正面时两条腿整套镜像，不能钉脚），根不动。（用户 2026-10-26：「2:21.57~2:28.90 的动作全部优化一下」——原来是按关键帧的 x 整个人平移）
 */
const PLANT: [number, Side | null][] = [
  [TE.herLand, "R"],
  [TE.back, "L"],
];
const LAND_DT = 1 / 120;
let LAND_XS: Float64Array | null = null;
function landedX(t: number): number {
  if (!LAND_XS) {
    const n = Math.ceil((TE.end + 0.5 - TE.herLand) / LAND_DT) + 1;
    const xs = new Float64Array(n);
    let x = herMove(TE.herLand).x;
    let prevSide: Side | null = null;
    let prevFoot = 0;
    for (let i = 0; i < n; i++) {
      const tt = TE.herLand + i * LAND_DT;
      let side: Side | null = null;
      for (const [t0, sd] of PLANT) if (tt >= t0) side = sd;
      if (side) {
        const j = jointsOf(herRaw(tt));
        const f = side === "L" ? j.ankleL[0] : j.ankleR[0];
        if (side === prevSide) x += prevFoot - f;
        prevFoot = f;
      }
      prevSide = side;
      xs[i] = x;
    }
    LAND_XS = xs;
  }
  const u = Math.max(0, (t - TE.herLand) / LAND_DT);
  const i = Math.min(LAND_XS.length - 2, Math.floor(u));
  const f = Math.min(1, u - i);
  return LAND_XS[i] + (LAND_XS[i + 1] - LAND_XS[i]) * f;
}
/** 落地以后她的根：按钉在地上的那只脚反推 */
const landedRoot = (t: number): V2 => [X_LAND + landedX(t), 0];
function landedChest(t: number): V2 {
  const r = landedRoot(t);
  const c = herOff(herRaw(t));
  return [r[0] + c[0], r[1] + c[1]];
}
/** 她的根（世界坐标） */
function herRootRaw(t: number): V2 {
  if (t >= TE.herLand) return landedRoot(t);
  const c = herChest(t);
  const o = herOff(herRaw(t));
  return [c[0] - o[0], c[1] - o[1]];
}
function herBootOn(t: number, side: Side) {
  const r = herRootRaw(t);
  const j = jointsOf(herRaw(t));
  const a = side === "L" ? j.ankleL : j.ankleR;
  const k = side === "L" ? j.kneeL : j.kneeR;
  const ankle: V2 = [r[0] + a[0], r[1] + a[1]];
  const knee: V2 = [r[0] + k[0], r[1] + k[1]];
  return { a: ankle, rot: shinRot(knee, ankle) };
}
/** 他的两条腿（只看腿：手的 IK 不影响） */
function kidLegs(t: number) {
  const p = kidMove(t).pose;
  const root = kidRoot(t);
  const j = castJoints(STONE, p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  return { ankleL: at(j.ankleL), ankleR: at(j.ankleR), kneeL: at(j.kneeL), kneeR: at(j.kneeR) };
}
function kidBootOn(t: number, side: Side) {
  const k = kidLegs(t);
  const a = side === "L" ? k.ankleL : k.ankleR;
  return { a, rot: shinRot(side === "L" ? k.kneeL : k.kneeR, a) };
}
const STAY = new Map<Side, { a: V2 }>();
/** 一只靴子这一刻：在谁脚上 / 在她手里 / 留在坑里，脚踝点、转角、镜像 */
export function bootState(t: number, side: Side): { on: "her" | "hand" | "kid" | "stay"; a: V2; rot: number; sx: number } {
  // 跺下去以后铁靴陷在坑里；他一只脚、再一只脚从靴子里出来，靴子留在坑里立着
  if (t >= OUT_T(side) + 0.1) {
    let s = STAY.get(side);
    if (!s) STAY.set(side, (s = { a: kidBootOn(OUT_T(side) - 0.12, side).a }));
    return { on: "stay", a: s.a, rot: 0, sx: 1 };
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
  // 跺下去：铁靴陷进坑里（脚踝跟着根往下）
  return { on: "kid", a: k.a, rot: t > TE.land + 0.2 && t < TE.out1 ? 0 : k.rot, sx: 1 };
}
/** 靴口上沿的中点（世界坐标） */
export function bootRim(t: number, side: Side): V2 {
  const s = bootState(t, side);
  return bootPt(s.a, s.rot, s.sx, RIM_TOP);
}

// ——————————————— 两块砖 ———————————————
interface BrickNow {
  c: V2;
  rot: number;
  flipY: number;
}
const RAISE_Y = 355;
/** 他往左递砖：砖心相对他的根（两只胳膊伸直），最后再往左一送 */
const REACH: V2 = [-125, -295];
const REACH_PUSH = 30;
/**
 * 他那块「妈妈，明天见」被她抱住那一下就从手里滑出去掉了（用户 2026-10-26，1:39.05：「小石头手上的妈妈明天见的砖，被她抱住的时候就掉了，
 * 不要一直拿着」；原来一直抱在胸前，落地以后插在近处那只铁靴的靴口上）：带着两个人往下坠的势头、加上重力，翻着往左下掉（风往左），
 * 比他们掉得快，越过他们落到街上，弹一下躺在那里——落在她那块「活下去」后来砸下来的地方左边 400 多（第一视角捡砖时不在画面里，免得分不清是哪块）
 */
export const GIFT_DROP = TE.catch + 0.05;
const GIFT_G = 2600;
const GIFT_REST_Y = -12;
let GIFT_FALL: { p: V2; v: V2; T: number } | null = null;
function giftFall() {
  if (!GIFT_FALL) {
    const held = (t: number): V2 => {
      const r = kidRoot(t);
      return [r[0] + KID_CHEST[0] - 30, r[1] + KID_CHEST[1] + 22];
    };
    const p = held(GIFT_DROP);
    const q = held(GIFT_DROP - 0.01);
    const v: V2 = [(p[0] - q[0]) / 0.01 - 900, (p[1] - q[1]) / 0.01];
    // 落到街面的时刻：p.y + v.y·s + ½g·s² = 躺着的高度
    const d = GIFT_REST_Y - p[1];
    const T = (-v[1] + Math.sqrt(v[1] * v[1] + 2 * GIFT_G * d)) / GIFT_G;
    GIFT_FALL = { p, v, T };
  }
  return GIFT_FALL;
}
/** 掉下去的那块砖落在街上的时刻（配一声轻的「嗒」） */
export const giftLandAt = () => GIFT_DROP + giftFall().T;
function giftLoose(t: number): BrickNow {
  const F = giftFall();
  const s = Math.min(t - GIFT_DROP, F.T);
  const c: V2 = [F.p[0] + F.v[0] * s, F.p[1] + F.v[1] * s + 0.5 * GIFT_G * s * s];
  // 翻着掉，落地时正好翻满一圈（字朝上）
  const spin = 0.06 - ((0.06 + 2 * Math.PI) / F.T) * s;
  if (t - GIFT_DROP < F.T) return { c, rot: spin, flipY: -1 };
  // 落地：一弹，翻平躺下
  const e = t - GIFT_DROP - F.T;
  const hop = 26 * Math.exp(-e / 0.08) * Math.abs(Math.sin(e * 24));
  const flat = Math.round(spin / Math.PI) * Math.PI;
  return { c: [c[0] - 30 * (1 - Math.exp(-e / 0.1)), c[1] - hop], rot: flat + (spin - flat) * Math.exp(-e / 0.05), flipY: -1 };
}
export function giftAt(t: number, root: V2, palmL: V2): BrickNow {
  if (t >= GIFT_DROP) return giftLoose(t);
  const hang: V2 = [palmL[0] - 6, palmL[1] + 20];
  const raised: V2 = [root[0] - 2, root[1] - RAISE_Y];
  const chest: V2 = [root[0] + KID_CHEST[0] - 30, root[1] + KID_CHEST[1] + 22];
  const u = E.io(ph(t, TE.raise0, TE.raise1));
  let c = mix(hang, raised, u);
  const h = E.io(ph(t, 98.68, 98.86));
  c = mix(c, chest, h);
  return { c, rot: -0.08 * (1 - u) + 0.06 * h, flipY: -1 };
}
/** 他那块砖画在哪一层：拎在身边（人后面）、举过头顶（人前面）、抱在胸前（身子前面、近处那只手臂后面）；掉了以后单独画（drawLooseGift） */
const giftLayer = (t: number): "back" | "front" | "arms" | "loose" => {
  if (t >= GIFT_DROP) return "loose";
  if (t >= 98.7) return "arms";
  return t > (TE.raise0 + TE.raise1) / 2 ? "front" : "back";
};
/**
 * 她那块「活下去」：他落地以后从天上掉下来（她丢下来的，和十二年前妈妈丢给她的木牌一样），104.52「咚」砸在他靴尖前面（「活下去」朝上），
 * 一弹；第一视角里捡起来以后在他手里。落地那一刻还在画面上面：落地以后才从画面上边掉进来
 */
export const HB_REST: V2 = [X_K - 160, -12];
const HB_V = 2800;
const HB_G = 2200;
export function herBrickAt(t: number, kid?: { root: V2 }): BrickNow | null {
  if (t < TE.land) return null;
  const d = TE.brickHit - t;
  if (d > 0) {
    // 倒着算：砸地时每秒 2800 往下，越往上越慢；慢慢翻着落下来
    const y = HB_REST[1] - (HB_V * d - 0.5 * HB_G * d * d);
    return { c: [HB_REST[0] - 160 * d, y], rot: 0.9 * d + 0.05 * Math.sin(d * 14), flipY: -1 };
  }
  const e = -d;
  if (t < TE.pov + 0.2) {
    const hop = 16 * Math.exp(-e / 0.07) * Math.abs(Math.sin(e * 26));
    return { c: [HB_REST[0], HB_REST[1] - hop], rot: 0.08 * Math.exp(-e / 0.06) * Math.sin(e * 45), flipY: -1 };
  }
  if (t < TE.hand) {
    // 他手里：抱在胸口（「活下去」朝外）；人链升到顶上时两只手举过头顶
    const r = kid ? kid.root : kidRoot(t);
    const chest: V2 = [r[0] + KID_CHEST[0] - 30, r[1] + KID_CHEST[1] + 22];
    // 两只手往左伸直递给她（荡过去的路上伸出去，最后用力再一送，到她跟前正好递到她手里）
    const up = E.io(ph(t, TE.hand - 1.8, TE.hand - 0.9));
    const push = E.io(ph(t, TE.hand - 0.3, TE.hand));
    const c = mix(chest, [r[0] + REACH[0] - REACH_PUSH * push, r[1] + REACH[1]], up);
    return { c, rot: 0.04 * (1 - up), flipY: -1 };
  }
  if (t < TE.putDown + 0.15) return herHoldBrick(t);
  // 落地放下他：交给他抱在胸口
  const r = kid ? kid.root : kidRoot(t);
  const chest: V2 = [r[0] + KID_CHEST[0] - 30, r[1] + KID_CHEST[1] + 22];
  const from = herHoldBrick(TE.putDown + 0.15);
  return { c: mix(from.c, chest, E.io(ph(t, TE.putDown + 0.15, TE.putDown + 0.45))), rot: from.rot * (1 - E.io(ph(t, TE.putDown + 0.15, TE.putDown + 0.45))), flipY: -1 };
}
/** 她提前多久松开栏杆伸手去接 */
const REACH_HER = 1.4;
/** ① 接住以后她左手伸直的方向：从肩膀朝着接住的那一点，接住那一下往下一沉再回来；IK 的目标放在很远的地方，胳膊就一直是直的 */
function straightAim(t: number, p: PoseIn, root: V2): V2 {
  const j = jointsOf(p);
  const sh: V2 = [root[0] + j.shoulderL[0], root[1] + j.shoulderL[1]];
  const at = herBrickAt(TE.hand - 1e-4)!.c;
  let a = Math.atan2(at[1] - sh[1], at[0] - HALF - sh[0]);
  const s = (t - TE.hand) / 0.09;
  a += s > 0 ? 0.13 * s * Math.exp(1 - s) : 0;
  return [sh[0] + Math.cos(a) * 900, sh[1] + Math.sin(a) * 900];
}
/** 她接砖、托砖时左手肘往哪边拱（IK 的 bend） */
const ELBOW_OUT = 1;
/** 在她手里的砖（不翻面，「活下去」一直朝外）：接过来 → 收到怀里 → 翻过来抱住他，夹在两个人中间 → 落地放下他时交给他 */
function herHoldBrick(t: number): BrickNow {
  // ① 接住以后砖攥在她伸直的左手里（按她的拳头算；接住那 0.12 秒从递过来的地方接过去）
  const given = herBrickAt(TE.hand - 1e-4)!.c;
  const fist = (tt: number): V2 => {
    const h = herAt(tt);
    const j = jointsOf(h.pose);
    const r = h.root;
    const pa: V2 = [r[0] + j.palmL[0], r[1] + j.palmL[1]];
    // 砖横着，靠她这一头攥在拳头里（只攥住头上一小截，不挡「活」字）
    return [pa[0] + HALF + 12, pa[1] + 2];
  };
  let c: V2 = mix(given, fist(Math.min(t, TE.hug - 1e-3)), E.io(ph(t, TE.hand, TE.hand + 0.12)));
  // ① 接住以后左手一直伸直举着砖（用户 2026-10-27，2:12.48：「后面手不用往后缩回去，手不用弯」——原来 0.9 秒里收到怀里），翻身扑过去时才带过去
  // 抱住他：夹在两个人中间（她胸口右边；靠右一点，她近处那只前臂不挡住「活」字）
  // ② 扑过去时左手带着砖，他接住她那一下夹在两个人中间（他胸口左上，和她转正以后抱着时同一个地方）
  if (t > TE.hug) {
    const ch = t < TE.herLand ? herChest(t) : landedChest(t);
    const k2 = t < TE.pairDown ? kidRoot(t) : null;
    const mid: V2 = t < TE.upright && k2 ? [k2[0] + KID_CHEST[0] + HOLD_OFF[0] + 80, k2[1] + KID_CHEST[1] + HOLD_OFF[1] + 36] : [ch[0] + 80, ch[1] + 36];
    // 扑过去时左手举着砖跟着扑过去，接住那一下按在他左胸前（她这一侧，不挡他的脸）；腿荡下来转正的时候才夹到两个人中间
    const ke = kidRoot(Math.min(t, TE.pairDown - 1e-3));
    const press: V2 = [ke[0] + KID_CHEST[0] + PRESS[0], ke[1] + KID_CHEST[1] + PRESS[1]];
    c = t < TE.embrace ? mix(c, press, E.io(ph(t, TE.hug, TE.embrace))) : mix(press, mid, E.io(ph(t, TE.embrace + 0.05, TE.upright + 0.05)));
  }
  return { c, rot: t > TE.hug ? -0.15 * E.io(ph(t, TE.embrace, TE.upright + 0.05)) : 0, flipY: -1 };
}
/** 砖亮到多亮：一接过来（「去」128.02）0.4 秒亮到头，之后很慢地一明一暗 */
export const warmAt = (t: number) => (t < TE.glow ? 0 : E.out(ph(t, TE.glow, TE.glow + 0.4)) * (0.94 + 0.06 * Math.sin((t - TE.glow) * 5.2)));

/**
 * 摸头时她近处那只手的手腕：手掌贴在他头顶的头发上（离头的中心 44 + 8），手指朝他后脑勺那边，手腕在靠她这边；
 * 揉的时候沿着头顶来回两下（和第一幕摸他的头一样）
 */
function patAt(t: number): { wrist: V2; dir: V2 } {
  const k = kidAt(t);
  const j = castJoints(k.spec, k.pose);
  const hs = k.spec.headScale ?? 1;
  const d: V2 = [(j.head[0] - j.neck[0]) * hs, (j.head[1] - j.neck[1]) * hs];
  const l = Math.hypot(d[0], d[1]) || 1;
  const up: V2 = [d[0] / l, d[1] / l];
  // 横着朝他后脑勺（他朝左，后脑勺在右边）
  const side: V2 = [-up[1], up[0]];
  const rub = t > TE.patOn && t < TE.patUp ? Math.sin(4 * Math.PI * ph(t, TE.patOn, TE.patUp)) : 0;
  const s = -17 + 11 * rub;
  // 手指顺着头顶往后脑勺、稍微往下（贴着头形）
  const a = 0.42 + 0.06 * rub;
  const dir: V2 = [side[0] * Math.cos(a) - side[1] * Math.sin(a), side[0] * Math.sin(a) + side[1] * Math.cos(a)];
  // 头顶（头发底下）离头的中心 53 个头的单位，手腕再高 7
  const r = 53 * k.spec.scale * hs + 6.9;
  return { wrist: [k.root[0] + j.neck[0] + d[0] + up[0] * r + side[0] * s, k.root[1] + j.neck[1] + d[1] + up[1] * r + side[1] * s], dir };
}
/** 她围巾垂在胸前那一头（他攥着的地方）：按她没加 IK 的姿势算 */
function scarfOf(t: number): V2 {
  const hr = herRootRaw(t);
  const hj = jointsOf(herRaw(t));
  return [hr[0] + hj.neck[0] + 14, hr[1] + hj.neck[1] + 70];
}

// ——————————————— 他这一刻 ———————————————
export interface KidNow {
  spec: CastSpec;
  pose: PoseIn;
  root: V2;
  chest: V2;
  head: V2;
  ankleL: V2;
  ankleR: V2;
  gift: BrickNow;
  her: BrickNow | null;
}
const kidMemo = new Map<number, KidNow>();
/** ① 他摸她脸的地方（相对她头的中心；她倒挂着，脸颊靠他这边） */
const CHEEK: V2 = [56, 28];
/** ② 搂她脖子的两只手（相对她的脖子） */
const NECK_L: V2 = [10, 30];
const NECK_R: V2 = [-30, 6];
export function kidAt(t: number): KidNow {
  const key = Math.round(t * 1e4);
  const hit = kidMemo.get(key);
  if (hit) return hit;
  const spec = t < TE.off || t >= TE.coatOn1 ? STONE_COAT : STONE;
  const p: PoseIn = { ...kidMove(t).pose };
  const root = kidRoot(t);
  {
    const r0 = kidRoot(t - 0.05);
    withDrag(p, [-(root[0] - r0[0]) / 0.05, (root[1] - r0[1]) / 0.05], 0.5, 0.8);
  }
  const sc = spec.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  const ik = (side: "L" | "R", q: V2, w: number) => {
    if (w <= 0.001) return;
    const k = side === "L" ? "armL" : "armR";
    p[k] = { ...(p[k] as object), to: loc(q), ik: Math.min(1, w) } as PoseIn["armL"];
  };
  const j0 = castJoints(spec, p);
  const palmL: V2 = [root[0] + j0.palmL[0], root[1] + j0.palmL[1]];
  const gift = giftAt(t, root, palmL);
  const her = herBrickAt(t, { root });
  const ends = (b: BrickNow): [V2, V2] => {
    const cs = Math.cos(b.rot);
    const sn = Math.sin(b.rot);
    return [
      [b.c[0] + HALF * cs - 4 * sn, b.c[1] + HALF * sn + 4 * cs],
      [b.c[0] - HALF * cs - 4 * sn, b.c[1] - HALF * sn + 4 * cs],
    ];
  };
  // 他那块：举起来以后两只手在砖的两头；收到胸前抱着；攥她围巾时只剩远处那只手抱着；坠的时候近处那只抱着、远处那只往上够她
  // 被她抱住那一下砖滑出去：手松开（掉了以后手不跟着砖走）
  if (t > TE.raise0 && t < GIFT_DROP + 0.12) {
    const held = t < GIFT_DROP ? gift : giftAt(GIFT_DROP - 1e-4, root, palmL);
    const [e1, e2] = ends(held);
    const w = E.io(ph(t, TE.raise0, TE.raise0 + 0.16)) * (1 - E.io(ph(t, GIFT_DROP - 0.02, GIFT_DROP + 0.12)));
    ik("L", e1, w);
    ik("R", e2, w);
  }
  // 被她抱住以后（砖滑出去了）：两只手搂住她的脖子（近处那只搭在她脖子这边，远处那只绕到她脖子后面）；攥围巾时近处那只换过去，松手时放开
  // （原来只摆角度，拳头缩在自己脸跟前，用户 2026-10-26：「小石头胳膊的动作优化一下」）
  if (t > GIFT_DROP + 0.1 && t < TE.release + 0.15) {
    const hr = herRootRaw(t);
    const neck = jointsOf(herRaw(t)).neck;
    const nk: V2 = [hr[0] + neck[0], hr[1] + neck[1]];
    const w = E.io(ph(t, GIFT_DROP + 0.1, GIFT_DROP + 0.3)) * (1 - E.io(ph(t, TE.release, TE.release + 0.15)));
    ik("L", [nk[0] - 4, nk[1] + 34], w * (1 - E.io(ph(t, TE.clutch - 0.2, TE.clutch - 0.08))));
    ik("R", [nk[0] - 36, nk[1] + 10], w);
  }
  // 近处那只手攥着她的围巾（垂在她胸前那一头）；她摸着他的头，他自己松开了手
  if (t > TE.clutch - 0.08 && t < TE.release + 0.1) {
    ik("L", scarfOf(t), E.io(ph(t, TE.clutch - 0.08, TE.clutch + 0.06)) * (1 - E.io(ph(t, TE.letGo, TE.release + 0.1))));
  }
  // 她那块（第一视角以后）：抱在胸口；举过头顶；交出去
  if (her && t > TE.pov && t < TE.hand + 0.1) {
    const [e1, e2] = ends(her);
    ik("L", e1, 1 - E.io(ph(t, TE.hand, TE.hand + 0.1)));
    // 从靴子里出来往上冲时远处那只手松开砖往上伸；朝她喊完（镜头在她那边）再抱好砖
    const far = t < TE.out2 ? 1 : t < 123.3 ? 1 - E.io(ph(t, TE.out2, TE.out2 + 0.25)) : E.io(ph(t, 123.3, 123.7));
    // 往左伸给她时远处那只手挪到砖的右半边（左边那头留给她的左手来接）
    const give = E.io(ph(t, TE.hand - 1.8, TE.hand - 0.9));
    ik("R", mix(e2, [her.c[0] + 0.25 * HALF, her.c[1] + 4], give), far * (1 - E.io(ph(t, TE.hand, TE.hand + 0.1))));
  }
  // ① 她接住砖以后：近处那只手摸着她倒过来的脸（脸颊靠他这边），哭得一抽一抽；她松开栏杆时放开
  if (t > TE.hand + 0.3 && t < TE.hug) {
    const hr = herRootRaw(t);
    const hd = jointsOf(herRaw(t)).head;
    const sob = 5 * Math.sin((t - TE.hand) * 9.5);
    const w = E.io(ph(t, TE.hand + 0.3, TE.hand + 0.95)) * (1 - E.io(ph(t, TE.hug - 0.4, TE.hug - 0.05)));
    ik("L", [hr[0] + hd[0] + CHEEK[0], hr[1] + hd[1] + CHEEK[1] + sob], w);
  }
  // ② 翻过来抱住他以后：两只手搂住她的脖子（近处那只搭在她脖子这边，远处那只绕到后面），落回街上被放下时松开
  if (t > TE.embrace - 0.05 && t < TE.putDown + 0.2) {
    const hr = herRootRaw(t);
    const neck = jointsOf(herRaw(t)).neck;
    const nk: V2 = [hr[0] + neck[0], hr[1] + neck[1]];
    const w = E.io(ph(t, TE.embrace - 0.05, TE.embrace + 0.25)) * (1 - E.io(ph(t, TE.putDown - 0.1, TE.putDown + 0.2)));
    ik("L", [nk[0] + NECK_L[0], nk[1] + NECK_L[1]], w);
    ik("R", [nk[0] + NECK_R[0], nk[1] + NECK_R[1]], w);
  }
  // 落回街上：她把砖给他抱着
  if (her && t > TE.putDown + 0.1) {
    const [e1, e2] = ends(her);
    const w = E.io(ph(t, TE.putDown + 0.1, TE.putDown + 0.4));
    ik("L", e1, w);
    ik("R", e2, w);
  }
  const j = castJoints(spec, p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  const chest = at(chestOf(j));
  const out: KidNow = { spec, pose: p, root, chest, head: at(j.head), ankleL: at(j.ankleL), ankleR: at(j.ankleR), gift, her };
  if (kidMemo.size > 400) kidMemo.clear();
  kidMemo.set(key, out);
  return out;
}

// ——————————————— 她这一刻 ———————————————
export interface HerNow {
  pose: PoseIn;
  root: V2;
  chest: V2;
  head: V2;
}
const herMemo = new Map<number, HerNow>();
export function herAt(t: number): HerNow {
  const key = Math.round(t * 1e4);
  const hit = herMemo.get(key);
  if (hit) return hit;
  const p: PoseIn = { ...herRaw(t) };
  const root = herRootRaw(t);
  // 头发、围巾的「下」：顺着身子往脚那头；失重再乘上去。倒挂时白把她往上拽：头发、围巾往脚那头（朝着白）
  const fl = (p.float as number | undefined) ?? 0;
  const r = (p.rot as number | undefined) ?? 0;
  p.gravity = [-Math.sin(r) * (1 - 2 * fl), Math.cos(r) * (1 - 2 * fl)];
  if (t >= TE.flip0 && t < TE.upright) {
    // 翻过来以后被白往上拽（世界里朝上）
    const k = E.io(ph(t, TE.flip0, TE.hang)) * (1 - E.io(ph(t, TE.hug, TE.upright)));
    const g = p.gravity as V2;
    p.gravity = [g[0] * (1 - k), g[1] * (1 - k) - 1 * k];
  }
  // 头发、围巾按她在世界里的速度往反方向甩（往下冲时往上扬，往上冲时往下拖）；朝右的人横着取反
  if (t < TE.herLand) {
    // 切到攥栏杆的特写那一下身子是跳过去的（翻身省掉），不算进速度
    const c0 = herChest(t >= TE.flip0 && t - 0.05 < TE.flip0 ? TE.flip0 : t - 0.05);
    const c1 = herChest(t);
    const v: V2 = [(c1[0] - c0[0]) / 0.05, (c1[1] - c0[1]) / 0.05];
    withDrag(p, [-v[0], v[1]], 0.55, 0.85);
  }
  // 铁靴拔下来以后那只脚光着
  if (t >= TE.boot1[0] + 0.1) p.legL = { ...(p.legL as object), boot: false } as PoseIn["legL"];
  if (t >= TE.boot2[0] + 0.1) p.legR = { ...(p.legR as object), boot: false } as PoseIn["legR"];
  // 她朝右：局部坐标横着取反（落地以后转身朝左去捡外套时不取反）
  const mir = ((p.face as number | undefined) ?? 1) > 0 ? -1 : 1;
  const loc = (q: V2): V2 => [mir * (q[0] - root[0]), q[1] - root[1]];
  const ik = (side: "L" | "R", q: V2, w: number, chest?: "over" | "under") => {
    if (w <= 0.001) return;
    const k = side === "L" ? "armL" : "armR";
    p[k] = { ...(p[k] as object), to: loc(q), ik: Math.min(1, w), ...(chest ? { chest } : {}) } as PoseIn["armL"];
  };
  // 抱着他：两只手环在他背上；拔靴时近处那只手去攥靴口；掰他的手指；松手时张开
  const hold = E.io(ph(t, TE.catch - 0.1, TE.catch)) * (1 - E.io(ph(t, TE.release, TE.release + 0.15)));
  if (hold > 0) {
    const k = kidRoot(t);
    const kc: V2 = [k[0] + KID_CHEST[0], k[1] + KID_CHEST[1]];
    const back: V2 = [kc[0] + 40, kc[1] + 10];
    const back2: V2 = [kc[0] + 34, kc[1] - 22];
    ik("R", back2, hold);
    let near = back;
    for (const side of ["L", "R"] as Side[]) {
      const [b0, , b2] = BOOT_T(side);
      const w = E.io(ph(t, b0 - 0.12, b0 + 0.02)) * (1 - E.io(ph(t, b2, b2 + 0.12)));
      if (w > 0) {
        const rim = bootRim(t, side);
        near = mix(near, [rim[0] - 4, rim[1] + 6], w);
      }
    }
    // 摸摸他的头（和第一天在街上一样）：近处那只手从靴口上抬起来，放到他头顶，手掌贴着头发揉两下，松手前一直放在他头上
    const pw = E.io(ph(t, TE.pat0, TE.patOn)) * (1 - E.io(ph(t, TE.release, TE.release + 0.12)));
    const pat = pw > 0 ? patAt(t) : null;
    if (pat) near = mix(near, pat.wrist, pw);
    ik("L", near, hold, "over");
    if (pat) {
      // 手掌平贴着头发：按 IK 定下来的前臂算手腕要翻多少（最多 75°）；她朝右，画面里的角度镜像回局部的
      const jj = jointsOf(p);
      const ang = (a: number[], b: number[]) => Math.atan2(-(b[0] - a[0]), b[1] - a[1]);
      let dh = Math.atan2(-pat.dir[0], pat.dir[1]) - ang(jj.elbowL, jj.wristL);
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      const arm = p.armL as { h: number };
      const h = mir * Math.max(-1.3, Math.min(1.3, dh));
      p.armL = { ...(p.armL as object), h: arm.h + (h - arm.h) * pw } as PoseIn["armL"];
    }
  }
  // 倒挂：两只手攥着楼顶栏杆；他荡过来的最后半秒，远处那只松开栏杆朝他伸过去，他到跟前时砖正好放进她手里
  // （原来递到的前 0.1 秒才松手，接住以后紧接着就翻身抱他，「接住」那一下看不出来）。
  // 特写里（2026-10-27，翻身省掉）：切过去时两只手还在栏杆上方，越落越快地砸到栏杆上攥住（近处那只先到）
  // 用户 2026-10-27：「主角拿砖的手应该用左手，而不是右手」——接砖、收到怀里的是近处那只（左手 L），远处那只（右手 R）一直攥着栏杆
  const grip = (t >= TE.flip0 ? 1 : 0) * (1 - E.io(ph(t, TE.hug, TE.hug + 0.12)));
  if (grip > 0) {
    ik("R", RAIL_R, grip);
    const b = t > TE.hand - REACH_HER ? herBrickAt(Math.min(t, TE.hand - 1e-4)) : null;
    if (b && t >= TE.hand) {
      // ① 接住以后：胳膊一直伸直（用户 2026-10-27，2:12.98：「手不要弯曲」——原来砖一坠，手去找砖，胳膊就在肘上折起来）。
      // 朝着接住的那一点、再往外伸出去很远的一点做 IK（够不着就是直的），砖跟着拳头走（herHoldBrick 按她的手算）；接住那一下胳膊带着砖往下一沉
      ik("L", straightAim(t, p, root), grip);
      p.armL = { ...(p.armL as object), bend: ELBOW_OUT } as PoseIn["armL"];
    } else if (b) {
      const cs = Math.cos(b.rot);
      const sn = Math.sin(b.rot);
      // 左手托着砖靠她这一头（手腕在砖头外面一点、下沿，手掌顺着砖头竖上去，见下面 holdHand），前臂从肩膀往上斜过来，不横在字前面
      const end: V2 = [b.c[0] - HALF * cs - 6, b.c[1] - HALF * sn + 20];
      // 用户 2026-10-27：「主角应该提前就伸手接，要伸直，不要弯曲」——提前 1.4 秒松开栏杆，胳膊伸直朝着荡过来的砖（够不着时 IK 就是直的），
      // 接住那一刻砖正好在她伸直的手上（X_ARRIVE 按这个定）
      const w = E.io(ph(t, TE.hand - REACH_HER, TE.hand - REACH_HER + 0.7));
      ik("L", mix(RAIL_L, end, w), grip);
      if (t < TE.hand - 0.03) p.armL = { ...(p.armL as object), shape: "open" } as PoseIn["armL"];
      // 手肘朝外（朝白那边）拱，前臂从外侧绕下来托住砖，不从脸前经过、也不缩到头后面
      p.armL = { ...(p.armL as object), bend: ELBOW_OUT } as PoseIn["armL"];
    } else ik("L", RAIL_L, grip);
  }
  // ① 左手托着砖：手掌顺着砖靠她那一头竖上去（贴着砖头，不盖住「活」字；原来手顺着前臂直着伸出去，一团黑手套压在字上）
  if (t > TE.hand - 0.2 && t < TE.hug + 0.1) {
    // 接住以后手腕不折：攥着砖顺着胳膊直着伸出去
    const w = E.io(ph(t, TE.hand - 0.2, TE.hand)) * (1 - E.io(ph(t, TE.hand, TE.hand + 0.12)));
    const jj = jointsOf(p);
    const ang = (a: number[], b: number[]) => Math.atan2(-(b[0] - a[0]), b[1] - a[1]);
    let dh = Math.atan2(-0, -1) - ang(jj.elbowL, jj.wristL);
    while (dh > Math.PI) dh -= 2 * Math.PI;
    while (dh < -Math.PI) dh += 2 * Math.PI;
    const arm = p.armL as { h: number };
    const h = mir * Math.max(-1.4, Math.min(1.4, dh));
    p.armL = { ...(p.armL as object), h: arm.h + (h - arm.h) * w, shape: t < TE.hand - 0.03 ? "open" : "grip" } as PoseIn["armL"];
  }
  // 倒挂着两只手攥着栏杆：两条胳膊画在头和身子后面（她的头比肩宽，胳膊从肩膀直着下去会挡在脸前；像倒立时胳膊在耳朵两边）。
  // 用户 2026-10-27（2:05.80）：「手臂和头的透视有问题」。远处那只松开栏杆去接砖时、近处那只松开栏杆抱他时换回原来的画法
  if (t >= TE.flip0 && t < TE.hug) {
    p.armR = { ...(p.armR as object), layer: "back" } as PoseIn["armR"];
    if (t < TE.hand - REACH_HER) p.armL = { ...(p.armL as object), layer: "back" } as PoseIn["armL"];
  }
  // 抱住他（往下一沉、抱着落下来、落地）；放下他时松开
  if (t > TE.hug - 0.1 && t < TE.putDown + 0.4) {
    const k = kidRoot(t);
    const kc: V2 = [k[0] + KID_CHEST[0], k[1] + KID_CHEST[1]];
    const w = E.io(ph(t, TE.hug - 0.1, TE.hug + 0.3)) * (1 - E.io(ph(t, TE.putDown, TE.putDown + 0.35)));
    ik("R", [kc[0] + 34, kc[1] - 18], w);
    // 转正以后近处那只手搂在他腰上（低一点，前臂不挡住夹在两个人中间的砖：镜头停在她脸上时看得见「活下去」和掉在上面的眼泪）
    const waist: V2 = [kc[0] + 40, kc[1] + 14 + 56 * E.io(ph(t, TE.upright - 0.25, TE.upright + 0.2))];
    // 翻过来的时候左手一直托着砖（砖跟着挪到两个人中间），夹好了再搂到他腰上（原来松开栏杆那一下两只手都垂下来，砖自己飘着）
    const keep = t < TE.upright + 0.15 ? 1 - E.io(ph(t, TE.upright - 0.15, TE.upright + 0.15)) : 0;
    if (t < TE.hug) ik("L", straightAim(t, p, root), 1);
    else if (keep > 0) {
      const bh = herHoldBrick(t);
      const eh: V2 = [bh.c[0] - HALF * Math.cos(bh.rot) - 6, bh.c[1] - HALF * Math.sin(bh.rot) + 20];
      ik("L", mix(waist, eh, keep), Math.max(w, keep), "over");
    } else ik("L", waist, w, "over");
  }
  // 外套：捡起来、拎着走回来、举着领子给他披上
  if (t > TE.coatPick - 0.2 && t < TE.coatOn1 + 0.35) {
    const c = coatHands(t);
    const w = E.io(ph(t, TE.coatPick - 0.2, TE.coatPick)) * (1 - E.io(ph(t, TE.coatOn1, TE.coatOn1 + 0.35)));
    // 两只手各捏靠自己这一侧的那一头：朝左时近处那只（L）在画面右边，捏右边那头（不隔着身子去够远的那头）。
    // 蹲下捡的时候近处那只肩膀高、够不着地：远处那只一只手捏住领子中间拎起来，拎到半空近处那只再接过去一起拿
    const left = ((p.face as number | undefined) ?? 1) < 0;
    const both = E.io(ph(t, TE.coatPick + 0.12, TE.coatPick + 0.4));
    const mid: V2 = [(c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2];
    ik("L", left ? c[1] : c[0], w * both);
    ik("R", mix(mid, left ? c[0] : c[1], both), w);
  }
  const j = jointsOf(p);
  const chest = chestOf(j);
  const out: HerNow = { pose: p, root, chest: [root[0] + chest[0], root[1] + chest[1]], head: [root[0] + j.head[0], root[1] + j.head[1]] };
  if (herMemo.size > 400) herMemo.clear();
  herMemo.set(key, out);
  return out;
}

// ——————————————— 他妈妈那件外套 ———————————————
/** 她捡起外套、拎着领子的两只手（世界坐标）：弯腰捏住 → 拎起来 → 转回来拎着走到他跟前 → 举到他肩上 */
function coatHands(t: number): [V2, V2] {
  const r = landedRoot(t);
  // 捏住靠她这一头的领子（外套堆右边那一截），拎起来时整团跟着手走
  const pick: V2 = [COAT_X1 + 66, -48];
  const lifted: V2 = [r[0] - 60, -330];
  const carry: V2 = [r[0] + 84, -350];
  const k = kidAt(Math.min(t, TE.coatOn1));
  const j = castJoints(k.spec, k.pose);
  const onKid: V2 = [k.root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, k.root[1] + Math.min(j.shoulderL[1], j.shoulderR[1]) - 14];
  let c = mix(pick, lifted, E.io(ph(t, TE.coatPick + 0.05, TE.coatPick + 0.35)));
  c = mix(c, carry, E.io(ph(t, TE.coatPick + 0.3, TE.coatPick + 0.6)));
  c = mix(c, onKid, E.io(ph(t, TE.coatOn0, TE.coatOn1 - 0.15)));
  return [
    [c[0] - 26, c[1]],
    [c[0] + 26, c[1] - 4],
  ];
}

// ——————————————— 画 ———————————————
const lineOf = (z: number) => 1 / Math.sqrt(Math.max(0.3, z));
/** 他（世界坐标）：手里的砖、脚上的铁靴（套上以后，跺地以后留在坑里的由 drawStayBoots 画） */
export function drawKid(g: CanvasRenderingContext2D, t: number, z: number, opts: { boots?: boolean } = {}) {
  const k = kidAt(t);
  const line = lineOf(z);
  const M = g.getTransform();
  const layer = giftLayer(t);
  // 手里的砖画在他身子前面、近处那只手臂后面
  const before = (cc: CanvasRenderingContext2D) => {
    cc.save();
    cc.setTransform(M);
    if (layer === "arms") drawEndBrick(cc, "gift", k.gift.c, k.gift.rot, BS, -1, 0, line);
    if (k.her && ((t >= TE.pov && t < TE.hand + 0.05) || t >= TE.putDown + 0.15)) drawEndBrick(cc, "her", k.her.c, k.her.rot, BS, k.her.flipY, t >= TE.putDown ? warmAt(t) : 0, line);
    cc.restore();
  };
  if (layer === "back") drawEndBrick(g, "gift", k.gift.c, k.gift.rot, BS, -1, 0, line);
  drawPerson(g, k.spec, k.pose, k.root[0], k.root[1], z, { beforeFrontArms: before });
  if (layer === "front") drawEndBrick(g, "gift", k.gift.c, k.gift.rot, BS, -1, 0, line);
  if (opts.boots !== false) drawKidBoots(g, t, z);
}
/** 他那块「妈妈，明天见」掉了以后（往下掉、躺在街上）：画在两个人后面 */
export function drawLooseGift(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < GIFT_DROP) return;
  const b = giftLoose(t);
  drawEndBrick(g, "gift", b.c, b.rot, BS, -1, 0, lineOf(z));
}
/** 他脚上的铁靴：远处那只、近处那只 */
export function drawKidBoots(g: CanvasRenderingContext2D, t: number, z: number) {
  const line = lineOf(z);
  const r = bootState(t, "R");
  const l = bootState(t, "L");
  if (r.on === "kid" || r.on === "stay") drawBoot(g, r.a, r.rot, line, 1, true);
  if (l.on === "kid" || l.on === "stay") drawBoot(g, l.a, l.rot, line, 1, true);
}
/** 她（世界坐标）；inner：抱着他时他画在她的身子和近处那只手臂之间 */
export function drawHer(g: CanvasRenderingContext2D, t: number, z: number, inner?: (g: CanvasRenderingContext2D) => void) {
  const h = herAt(t);
  const line = lineOf(z);
  const M = g.getTransform();
  g.save();
  g.translate(h.root[0], h.root[1]);
  drawChengtuo(g, h.pose, {
    line,
    beforeFrontArms: (cc) => {
      cc.save();
      cc.setTransform(M);
      inner?.(cc);
      // 她手里的砖（接过来以后、交给他以前）画在她身子前面、手臂后面
      if (t >= TE.hand + 0.05 && t < TE.putDown + 0.15) {
        const b = herHoldBrick(t);
        drawEndBrick(cc, "her", b.c, b.rot, BS, b.flipY, warmAt(t), line);
      }
      cc.restore();
    },
  });
  g.restore();
  // 在她手里的那只靴子
  for (const side of ["R", "L"] as Side[]) {
    const s = bootState(t, side);
    if (s.on === "hand") drawBoot(g, s.a, s.rot, line, s.sx, true);
  }
}
/** 抱着他的时候：两个人一起画 */
export const holding = (t: number) => (t >= TE.catch && t < TE.release) || (t >= TE.hug && t < TE.putDown + 0.2);
/** 她那块砖：从天上掉下来、落在地上（第一视角以前） */
export function drawGroundBrick(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < TE.land || t >= TE.pov + 0.2) return;
  const b = herBrickAt(t);
  if (b) drawEndBrick(g, "her", b.c, b.rot, BS, b.flipY, 0, lineOf(z));
}

// 外套：从肩上滑下去、掉在他脚边（左前）→ 跺地那一下被掀到坑的左边 → 他捡起来 → 披在她肩上
let COAT_FROM: { a: V2; b: V2 } | null = null;
const ORANGE = "#f29a4a";
const ORANGE_SH = "#de8538";
function heapPath(cx: number, floor: number, lift: number, w = 115, ht = 46) {
  const heap = new Path2D();
  heap.moveTo(cx - w, floor);
  heap.quadraticCurveTo(cx - w * 0.95, floor - ht * 0.9 - lift, cx - w * 0.2, floor - ht - lift);
  heap.quadraticCurveTo(cx + w * 0.45, floor - ht * 1.12 - lift, cx + w * 0.92, floor - ht * 0.45);
  heap.quadraticCurveTo(cx + w * 1.08, floor - 4, cx + w * 0.86, floor);
  heap.closePath();
  return heap;
}
function drawHeap(g: CanvasRenderingContext2D, cx: number, floor: number, lift: number, lw: number, rot = 0) {
  const w = 115;
  const ht = 46;
  g.save();
  g.translate(cx, floor);
  g.rotate(rot);
  g.translate(-cx, -floor);
  const heap = heapPath(cx, floor, lift, w, ht);
  part(g, heap, ORANGE, ORANGE_SH, 3.2 * lw, [5, 4]);
  g.save();
  g.clip(heap);
  leadBand(g, cx - w * 1.2, floor - ht * 0.32, w * 2.4, ht * 0.32, 11, lw);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - w * 0.3, floor - ht * 0.9);
  g.quadraticCurveTo(cx - w * 0.12, floor - ht * 0.55, cx - w * 0.22, floor - ht * 0.2);
  g.moveTo(cx + w * 0.3, floor - ht * 0.95);
  g.quadraticCurveTo(cx + w * 0.46, floor - ht * 0.55, cx + w * 0.4, floor - ht * 0.2);
  g.stroke();
  g.restore();
  g.restore();
}
/** 地上的外套（滑下去、掉下来、堆着、被掀开；捡起来以后不画） */
export function drawCoat(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < TE.off || t > TE.coatPick + 0.15) return;
  const lw = lineOf(z);
  if (t < TE.thud) {
    if (!COAT_FROM) {
      const k = kidAt(TE.off - 0.001);
      const sp = STONE_COAT;
      const j = castJoints(sp, k.pose);
      COAT_FROM = { a: [k.root[0] + j.shoulderR[0], k.root[1] + j.shoulderR[1]], b: [k.root[0] + j.shoulderL[0], k.root[1] + j.shoulderL[1]] };
    }
    const { a, b } = COAT_FROM;
    const floor = 6;
    const len = 170;
    const fall = Math.min(1, (t - TE.off) / (TE.thud - TE.off));
    const top0 = Math.min(a[1], b[1]);
    const yTop = top0 + (floor - 30 - top0) * fall * fall;
    const lo = Math.min(yTop + len, floor);
    const h = lo - yTop;
    const spread = 1 + 0.8 * Math.max(0, 1 - h / len);
    const cx = (a[0] + b[0]) / 2 + (COAT_X0 - (a[0] + b[0]) / 2) * fall * fall;
    const half = (Math.abs(b[0] - a[0]) / 2 + 14) * spread;
    const A: V2 = [cx - half, yTop];
    const B: V2 = [cx + half, yTop];
    const path = new Path2D();
    path.moveTo(A[0], A[1]);
    path.quadraticCurveTo(cx, yTop + 24, B[0], B[1]);
    path.quadraticCurveTo(B[0] + 14 * spread, yTop + h * 0.5, B[0] + 26 * spread, lo);
    path.lineTo(A[0] - 26 * spread, lo);
    path.quadraticCurveTo(A[0] - 14 * spread, yTop + h * 0.5, A[0], A[1]);
    path.closePath();
    part(g, path, ORANGE, ORANGE_SH, 3.2 * lw, [5, 4]);
    g.save();
    g.clip(path);
    leadBand(g, cx - 200, lo - 24, 400, 24, 11, lw);
    standCollar(g, A, [cx, yTop + 24], B, 8, lw);
    g.restore();
    return;
  }
  // 堆在地上：落地一弹；跺地那一下被掀起来、翻着落到坑的左边
  const ds = t - TE.stomp;
  if (ds < 0) {
    const settle = Math.exp(-(t - TE.thud) / 0.06) * Math.sin((t - TE.thud) * 40) * 8;
    drawHeap(g, COAT_X0, 6, settle, lw);
    return;
  }
  if (t < TE.coatPick - 0.05) {
    const fly = 0.62;
    const u = Math.min(1, ds / fly);
    const x = COAT_X0 + (COAT_X1 - COAT_X0) * E.out(u);
    const hop = 120 * Math.sin(Math.PI * u) * (1 - u * 0.3);
    const rot = -0.5 * Math.sin(Math.PI * u);
    const settle = u >= 1 ? Math.exp(-(ds - fly) / 0.08) * Math.sin((ds - fly) * 36) * 10 : 0;
    drawHeap(g, x, 6 - hop, settle, lw, rot);
    return;
  }
  // 她捏住领子拎起来：一团从地上被提起来
  const c = coatHands(t);
  const lift = E.io(ph(t, TE.coatPick - 0.05, TE.coatPick + 0.15));
  const hx = (c[0][0] + c[1][0]) / 2;
  const hy = (c[0][1] + c[1][1]) / 2;
  drawHeap(g, COAT_X1 + (hx - COAT_X1) * lift, 6 + (hy + 60 - 6) * lift, 0, lw);
}
/**
 * 一件挂着的外套（他妈妈那件：橘色，下摆缝了铅）：领子在 (cx, top)，肩宽 w，长 len。
 * part：all 整件（拎在手里）、back 后片和袖子（披在她身上时画在她后面）、front 两片前襟和领子（压在她身子上、手臂后面）
 */
function hangingCoat(g: CanvasRenderingContext2D, cx: number, top: number, w: number, len: number, lw: number, part0: "all" | "back" | "front", sway = 0) {
  const sh = top + len * 0.12;
  const hemY = top + len;
  const hw = w / 2;
  const sleeve = (side: number) => {
    const p = new Path2D();
    const x0 = cx + side * hw * 0.92;
    p.moveTo(x0 - side * 6, sh - 8);
    p.quadraticCurveTo(x0 + side * hw * 0.3, sh + len * 0.1, x0 + side * hw * 0.26 + sway, sh + len * 0.56);
    p.lineTo(x0 + side * hw * 0.02 + sway, sh + len * 0.58);
    p.quadraticCurveTo(x0 - side * hw * 0.06, sh + len * 0.3, x0 - side * hw * 0.16, sh + 6);
    p.closePath();
    part(g, p, ORANGE_SH, null, 3 * lw);
    // 袖口一圈
    g.strokeStyle = "rgba(150,70,30,0.6)";
    g.lineWidth = 4 * lw;
    g.beginPath();
    g.moveTo(x0 + side * hw * 0.26 + sway, sh + len * 0.53);
    g.lineTo(x0 + side * hw * 0.04 + sway, sh + len * 0.55);
    g.stroke();
  };
  const body = () => {
    const p = new Path2D();
    p.moveTo(cx - hw * 0.3, top);
    p.quadraticCurveTo(cx, top + len * 0.05, cx + hw * 0.3, top);
    p.lineTo(cx + hw, sh);
    p.quadraticCurveTo(cx + hw * 1.06, top + len * 0.6, cx + hw * 1.12 + sway, hemY);
    p.lineTo(cx - hw * 1.12 + sway, hemY);
    p.quadraticCurveTo(cx - hw * 1.06, top + len * 0.6, cx - hw, sh);
    p.closePath();
    return p;
  };
  const hem = (p: Path2D) => {
    g.save();
    g.clip(p);
    leadBand(g, cx - w * 1.4, hemY - len * 0.07, w * 2.8, len * 0.07, 11, lw);
    g.restore();
  };
  if (part0 === "all") {
    sleeve(-1);
    sleeve(1);
    const p = body();
    part(g, p, ORANGE, ORANGE_SH, 3.2 * lw, [5, 4]);
    hem(p);
    // 前襟敞开的那道缝、两个口袋
    g.strokeStyle = "rgba(150,70,30,0.55)";
    g.lineWidth = 3 * lw;
    g.beginPath();
    g.moveTo(cx, top + len * 0.05);
    g.lineTo(cx + sway, hemY);
    g.moveTo(cx - hw * 0.7, top + len * 0.62);
    g.lineTo(cx - hw * 0.3, top + len * 0.62);
    g.moveTo(cx + hw * 0.3, top + len * 0.62);
    g.lineTo(cx + hw * 0.7, top + len * 0.62);
    g.stroke();
    // 立领、门襟一排大扣子（和穿在身上那件一样）
    standCollar(g, [cx - hw * 0.3, top], [cx, top + len * 0.05], [cx + hw * 0.3, top], 7, lw);
    coatButtons(g, [0.2, 0.34, 0.48].map((f) => [cx - 7 + sway * f, top + len * f] as V2), 3.2, lw);
    return;
  }
  if (part0 === "back") {
    sleeve(-1);
    sleeve(1);
    const p = body();
    part(g, p, ORANGE_SH, null, 3.2 * lw);
    hem(p);
    return;
  }
  // 前襟：从两个肩头垂下来的两片（中间敞开，露出她的毛衣和围巾）
  for (const side of [-1, 1]) {
    const p = new Path2D();
    p.moveTo(cx + side * hw * 0.3, top);
    p.lineTo(cx + side * hw, sh);
    p.quadraticCurveTo(cx + side * hw * 1.06, top + len * 0.6, cx + side * hw * 1.12 + sway, hemY);
    p.lineTo(cx + side * hw * 0.5 + sway, hemY);
    p.quadraticCurveTo(cx + side * hw * 0.44, top + len * 0.5, cx + side * hw * 0.3, top);
    p.closePath();
    part(g, p, ORANGE, ORANGE_SH, 3.2 * lw, [4, 3]);
    hem(p);
    if (side < 0) coatButtons(g, [0.2, 0.36, 0.52].map((f) => [cx - hw * (0.3 + 0.2 * f) + sway * f - 6, top + (hemY - top) * f] as V2), 3.2, lw);
  }
}
/** 她手里拎着的外套（捡起来 → 拎着走回来 → 举着领子给他披上：抖开、绕到他身后）；披好那一刻换成他穿着外套的样子 */
export function drawCoatInHands(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < TE.coatPick + 0.15 || t > TE.coatOn1 + 0.15) return;
  const lw = lineOf(z);
  const [a, b] = coatHands(t);
  const cx = (a[0] + b[0]) / 2;
  const top = Math.min(a[1], b[1]) + 4;
  // 先拎着一小团，披上去那一下才抖开（他的个子：肩宽约 120，长到膝盖）
  const open = E.io(ph(t, TE.coatOn0, TE.coatOn1 - 0.2));
  const w = 120 + 50 * open;
  const len = Math.min(-top - 6, 170 + 70 * open);
  g.save();
  g.globalAlpha = 1 - E.io(ph(t, TE.coatOn1 - 0.02, TE.coatOn1 + 0.15));
  hangingCoat(g, cx, top, w, Math.max(60, len), lw, "all", 8 * Math.sin((t - TE.coatPick) * 5));
  g.restore();
}
/** 她光着脚跺下去的地方（远处那只脚落下的地方） */
export function herStompX(): number {
  const h = herAt(TE.stomp2);
  return h.root[0] + jointsOf(h.pose).ankleR[0];
}
/** 她落地以后的根（往前一步时挪） */
export const herLandRoot = landedRoot;
export { herMove, kidMove, armL, armR };
