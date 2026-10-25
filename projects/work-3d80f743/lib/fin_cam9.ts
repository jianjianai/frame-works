// 重做的四声「活下去」+ 尾奏（113.88–152）的镜头。时刻在 lib/fin_t.ts。草稿 finale1.ts / finale2.ts 的镜头路线：
// 贴着铁靴（「咚」）→ 抬到他仰着的脸 → 退开看他一只脚一只脚走出靴子 → 跟着他飞到老钟家窗前（老钟扑出来抓住）→ 顺着两个人的视线一路升到白的边上
// （她睁开眼）→ 顺着她的视线扎回街上（门一扇扇打开，人链一节节往上长）→ 贴着人链往上走 → 推到最顶上（他抓住她的脚踝）→ 往后拉：
// 一条从地面连到天上的手 → 推回去：她握住他的手 → 人链一沉，跟着她往下落、越退越开 → 构图 A（坑里的空铁靴）：她牵着他从上面落进画面 →
// 推近两个人：他在砖的背面写字、放进她手里（手一沉，砖暖了）→ 抱住 → 大家的手放在她肩上 → 低到她光着的脚：「咚」→ 拉开远景。

import { jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { castJoints } from "@materials/剪纸角色/code/cast";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { smoothTrack } from "./motion";
import { T9, breath, lerp } from "./fin_t";
import { BASE_X, topH } from "./fin_rise";
import { GRAB_X, K_LAND, STONE_BARE, X_LAND, clasp, herAt, herChest, kidAt } from "./fin_cast";
import { ZHONG_HOUSE } from "./dawn";
import { whip } from "./fin_cam8";

type V2 = [number, number];
const WN = ZHONG_HOUSE.win;

/** 贴着铁靴：「咚」 */
const bootCam = aim(K_LAND[0] - 18, -90, 540, 1180, 2.5);
/** 抬到他仰着的脸 */
const faceCam = (t: number) => {
  const k = kidAt(Math.min(t, T9.outL));
  const j = castJoints(STONE_BARE, k.pose);
  return aim(k.root[0] + j.head[0], k.root[1] + j.head[1] + 30, 540, 860, 3.0);
};
/** 退开：看他一只脚、再一只脚从铁靴里走出来 */
const outCam = aim(K_LAND[0] + 10, -230, 540, 1160, 1.75);
/** 跟着他被风带到老钟家窗前：把他和窗都框住（追他的胸口，晚一点到） */
const kidChest = smoothTrack((t) => kidAt(t).chest, T9.lift - 0.05, T9.crane + 0.2, 7);
const laoCam = (t: number) => {
  const c = kidChest(t);
  const win: V2 = [WN.x - 60, -470];
  const u = E.io(ph(t, T9.lift, T9.zhongGrab));
  const mid: V2 = [lerp(c[0], (c[0] + win[0]) / 2, u), lerp(c[1] + 60, (c[1] + win[1]) / 2 + 40, u)];
  return aim(mid[0], mid[1], 540, 980, lerp(1.6, 1.45, u));
};
/** 顺着两个人的视线一路升上去：白的边上的她 */
const topCam = (t: number) => {
  const c = herChest(t);
  return aim(c[0] + 10, c[1] + 40, 540, 900, 2.2 * (1 + 0.04 * ph(t, T9.top, T9.dive)));
};
/** 扎回街上：老钟家窗前（老钟探着身子死死攥着他）、街上一扇扇打开的门 */
const streetCam = aim((GRAB_X + K_LAND[0]) / 2 + 60, -520, 540, 1060, 0.95);
/** 人链往上长：镜头跟着顶上（他）往上、往后退，街面留在画面下面直到人链长高 */
const growCam = (t: number) => {
  const h = topH(Math.max(t, T9.join0));
  const z = lerp(0.95, 0.56, E.io(ph(t, 119.2, T9.ride)));
  const cy = Math.min(-520, -h + 420);
  const k = kidAt(t);
  return aim(lerp(streetCam.x, (k.root[0] + BASE_X) / 2 + 30, E.io(ph(t, 119.2, T9.ride))), cy, 540, 1000, z);
};
/** 贴着人链往上走：顶上的他留在画面上半截 */
const rideCam = (t: number) => {
  const k = kidAt(t);
  return aim(k.root[0] + 20, k.root[1] + 300, 540, 880, lerp(0.56, 0.5, E.io(ph(t, T9.ride, T9.topPush))));
};
/** 最顶上：推到他伸上去的手和她的脚踝（和开场她抓住周磊上下颠倒） */
const grabCam = (t: number) => {
  const h = herAt(t);
  const j = jointsOf(h.pose);
  return aim(h.root[0] + j.ankleR[0] + 10, h.root[1] + j.ankleR[1] + 60, 540, 900, 2.3);
};
/** 往后拉：一条从地面连到天上的手（整条人链、白、整座城） */
const WIDE = (t: number) => aim((BASE_X + herChest(t)[0]) / 2 + 40, -4500, 540, 960, 0.205 * (1 + 0.02 * ph(t, T9.wide1, T9.back)));
/** 推回去：她低头看着他，弯下腰，握住他的手 */
const handCam = (t: number) => {
  const c = herChest(t);
  return aim(c[0] + 40, c[1] + 200, 540, 900, 2.25);
};
/** 人链沉下来：跟着她往下落，越退越开 */
const sinkCam = (t: number) => {
  const c = herChest(t);
  const u = E.io(ph(t, T9.sink, 132.5));
  return aim(c[0] + 30, c[1] + lerp(200, 100, u), 540, lerp(900, 860, u), lerp(2.25, 1.0, u));
};
/** 构图 A：坑里她那双铁靴空着立在街上（和他穿着铁靴仰头那一镜、十二年前那一格同一个构图）——她牵着他从上面落进画面 */
const bootsShot = aim(K_LAND[0] + 120, -560, 540, 1080, 1.0);
/** 两个人：她光着脚落地，跪在他跟前 */
const twoCam = (t: number) => aim((X_LAND + kidAt(t).root[0]) / 2, -250, 540, 1060, 1.9);
/** 推到他的手：在砖的背面写「沉沉，明天见」；放进她手里、手一沉（两张脸还在画面里） */
const writeCam = (t: number) => {
  const k = kidAt(t);
  const b = k.her ? k.her.c : k.chest;
  return aim(b[0] - 20, b[1] - 40, 540, 1000, 3.1);
};
const giveCam = (t: number) => aim((X_LAND + kidAt(t).root[0]) / 2 - 10, -250, 540, 1020, 2.5);
/** 抱住：往后舒一口气；大家走过来把手放在她肩上 */
const ringCam = (t: number) => aim(X_LAND + 60, -300, 540, 1060, lerp(2.0, 1.25, E.io(ph(t, T9.hands - 0.5, T9.hands + 1.5))));
/** 低到她光着的脚（和开场她第一次出场时贴地拍铁靴一样） */
const footCam = aim(X_LAND + 40, -60, 540, 1260, 3.2);
/** 远景：铺满鞋的街上站满了光着脚的人 */
const endCam = aim(X_LAND + 120, -900, 540, 960, 0.6);

export function cam9(t: number): Cam {
  if (t < T9.lookUp) return bootCam;
  let k = camLerp(bootCam, faceCam(t), E.io(ph(t, T9.lookUp, T9.lookUp + 0.22)));
  k = camLerp(k, outCam, E.io(ph(t, T9.outL - 0.06, T9.outR + 0.14)));
  k = camLerp(k, laoCam(t), E.io(ph(t, T9.lift - 0.05, T9.lift + 0.4)));
  if (t < T9.crane) return k;
  if (t < T9.top) return whip(laoCam(T9.crane), topCam(t), ph(t, T9.crane, T9.top), 0.22);
  if (t < T9.dive) return topCam(t);
  if (t < T9.street) return whip(topCam(T9.dive), streetCam, ph(t, T9.dive, T9.street), 0.24);
  if (t < 119.2) return streetCam;
  if (t < T9.ride) return growCam(t);
  k = camLerp(growCam(T9.ride), rideCam(t), E.io(ph(t, T9.ride, T9.ride + 0.5)));
  if (t < T9.topPush) return k;
  k = camLerp(rideCam(T9.topPush), grabCam(t), E.io(ph(t, T9.topPush, 125.95)));
  if (t < T9.pull) return k;
  if (t < T9.wide1) return whip(grabCam(T9.pull), WIDE(t), ph(t, T9.pull, T9.wide1), 0.2);
  if (t < T9.back) return WIDE(t);
  k = camLerp(WIDE(T9.back), handCam(t), E.io(ph(t, T9.back, 129.15)));
  if (t < T9.sink) return k;
  k = camLerp(handCam(T9.sink), sinkCam(t), E.out(ph(t, T9.sink, T9.sink + 0.4)));
  k = camLerp(k, bootsShot, E.io(ph(t, T9.bootsShot0, T9.bootsShot1)));
  if (t < T9.land) return k;
  k = camLerp(bootsShot, twoCam(t), E.io(ph(t, T9.land + 0.1, T9.kneel + 0.5)));
  k = camLerp(k, writeCam(t), E.io(ph(t, 138.95, T9.write0 + 0.15)));
  k = camLerp(k, giveCam(t), E.io(ph(t, T9.write1 + 0.05, T9.give + 0.3)));
  k = camLerp(k, ringCam(t), E.out(ph(t, 142.75, T9.hug + 0.4)));
  k = camLerp(k, footCam, E.io(ph(t, T9.rise, T9.step - 0.05)));
  return camLerp(k, endCam, E.soft(ph(t, T9.wide, 151.5)));
}
/** 叠在镜头上的：「咚」、老钟抓住、他抓住她的脚踝、握住手、人链一沉、她落地、手一沉、光脚一步 */
export function cam9Kick(t: number): { z: number; sh: number } {
  const ks = kick(t, T9.stomp, 0.12);
  const kz = kick(t, T9.zhongGrab, 0.1);
  const ka = kick(t, T9.ankle, 0.12);
  const kh = kick(t, T9.hand, 0.2);
  const kk = kick(t, T9.sink, 0.15);
  const kl = kick(t, T9.land, 0.12);
  const kp = kick(t, T9.step, 0.12);
  return {
    z: 1 + 0.06 * ks + 0.02 * kz + 0.03 * ka + 0.015 * kh + 0.02 * kk + 0.025 * kl + 0.05 * kp,
    sh: 26 * ks + 7 * kz + 8 * ka + 14 * kk + 8 * kl + 14 * kp,
  };
}
/** 平静的段落叠一点手持呼吸（画面上约 3 像素） */
export function cam9Breath(t: number, c: Cam): Cam {
  const calm = Math.max(E.io(ph(t, T9.top, T9.top + 0.2)) * (1 - E.io(ph(t, T9.dive - 0.1, T9.dive))), E.io(ph(t, T9.land + 0.3, T9.land + 0.8)) * (1 - E.io(ph(t, T9.rise, T9.rise + 0.3))));
  if (calm <= 0) return c;
  const [bx, by] = breath(t);
  return { ...c, x: c.x + (calm * bx) / c.z, y: c.y + (calm * by) / c.z };
}
void clasp;
