// 副歌一 0:43.92–0:53.94 一镜到底（用户 2026-10-15 重定：「橘色衣服的人为了救这个小朋友，把自己有重量的东西给了这个孩子，
// 孩子抓着他的脚不愿放手，还在向上飘；主角过去抓住孩子的脚，3 人一起往上飘，僵持了一下，橘色衣服的人挣脱孩子的手，自己向上飘。
// 镜头对着地上的主角和孩子，天上发出彩色的光配合音效。运镜也要按照情绪运镜」）：
// ① 43.92 天亮了，网上的人一个个把自己拽回楼里，只有一个人逆着往上升——镜头扎下去追她（竖着拖影，拖影里从网换成街）
// ② 44.45 小石头的妈妈（橘色外套）闭着眼往上飘，光着脚追出来的小石头吊在她手上也离了地；她睁眼看着儿子，
//    把自己那件下摆缝了铅的橘色外套脱下来，裹在他身上（镜头跟着外套从她身上落到他身上，越推越慢）
// ③ 45.12 他一沉，把她的手拽下去一截；45.3 她松开手，他往下一坠，45.51 一把抱住她光着的脚踝，不撒手；两个人还在往上飘，画外「咚咚」越来越近
// ④ 46.01 秤砣冲进来一跳，抓住他的脚踝：三个人一沉，借着她的冲劲荡一下，又一起往上飘——她的靴子离了地。三个人吊成一串僵在半空；
//    妈妈低头看见秤砣离地的靴子，看懂了，冲儿子哭着笑了一下；掏出小刀，47.18 割断了拴着她和儿子的那根红绳（用户 2026-10-15：
//    「添加一个母亲割掉和孩子连接的绳子，这样就和后面的小刀连接上了」），再掰开他的手
// ⑤ 47.25 她往上一冲出了画面；镜头不追她，跟着往下掉的两个人，47.51「咚」秤砣落地接住孩子；47.75 天上炸开五颜六色的光，照在两张仰着的脸上
// ⑥ 47.94 灰落下来；他挣开她，裹着妈妈的大外套朝天上跳，太沉，「咚」「咚」，一次比一次低；她从后面抱住他。一把小刀从天上掉下来，50.01「叮」
// ⑦ 50.01 他伸手去够那把刀，她的手先盖住了它；她拿起来看了一眼，合上，揣进自己兜里
// ⑧ 51.93 他的脚跟又离了地，她把他按进怀里，下巴抵着他的头发哼歌，铁靴「咚」地跺稳；镜头越推越慢，停在她闭着的眼睛上（53.94 匹配溶解进十二年前）
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, flash, smearV, camLerp } from "./core";
import { figure, pose, rope, type Fig, type Pt, walk } from "./figure";
import { PAL, KID_MOM_LOOK, UMBRELLAS, crowdLook } from "./palette";
import { ash, door, crack } from "./world";
import { street } from "./sets";
import { qinFloatSleep } from "./pre1";
import { webShotB, webDraw, webCam, WEB_B } from "./web";

export { qinFloatSleep };
const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
/** 把世界里的一点放到画面上的某个位置 */
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toS = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];
/** 被拽一下：很快沉下去、慢慢缓回来（峰值 1） */
const dip = (s: number, rise = 0.05, fall = 0.3) => {
  if (s <= 0) return 0;
  const peak = rise * Math.log(1 + fall / rise);
  const n = (1 - Math.exp(-peak / rise)) * Math.exp(-peak / fall);
  return ((1 - Math.exp(-s / rise)) * Math.exp(-s / fall)) / n;
};

// ---------- 时间 ----------
export const X0 = -180; // 小石头家门口那条街（他家的门在 -813，妈妈飘到了粉房子前面；落地以后两个人在两栋房子中间的空当里，身后是城和天）
const MX = X0;
const HOME_DOOR = -813;
const T_STREET = 44.22; // 拖影里从网换成街
const T_LANDCAM = 44.5;
const T_EYES = 44.45; // 妈妈睁眼看儿子
const COAT: [number, number, number] = [44.58, 44.82, 45.12]; // 外套从肩上褪下来、到她手里、裹到他身上
const T_LETGO = 45.3; // 她松开手
const T_ANKLE = 45.513; // 他一把抱住她的脚踝
const T_JUMP = 45.763; // 秤砣起跳
const T_GRAB = 46.013; // 抓住他的脚踝（第 23 小节）
const T_LOOK = 46.45; // 妈妈低头看见秤砣离地的靴子
const T_SMILE = 46.72;
const T_PRY1 = 47.05;
const T_KNIFE_OUT = 46.86; // 从睡衣兜里掏出小刀
const T_CUT = 47.18; // 割断母子俩拴在一起的那根红绳
const T_FREE = 47.25; // 挣脱
const T_FLOOR = 47.513; // 秤砣落地接住孩子
const T_BURST = 47.75; // 天上炸开五颜六色的光
const T_LOOSE = 47.98; // 他挣开她
const J1: [number, number] = [48.33, 48.513]; // 第一跳：起跳、落地「咚」
const J2: [number, number] = [48.85, 49.013];
const T_HOLD = 49.25; // 她从后面抱住他
const T_KNIFE = 50.013; // 小刀「叮」
const T_REACH = 50.2;
const T_COVER = 50.6; // 她的手先盖住刀
const T_TAKE = 50.95;
const T_FOLD = 51.35;
const T_POCKET = 51.6;
const T_LIGHT = 51.98; // 他的脚跟又离了地
const T_HUG = 52.3;
const T_STOMP = 52.513;
const T_END = 53.94;

// ---------- 妈妈：脚踝上一截割断的红绳，一直往上飘 ----------
const V1 = 50; // 两个人往上飘的速度
const V2 = 26; // 他吊在她脚上以后
const DIP1 = 34;
const DIP2 = 30;
const Y_GRAB = -459; // 秤砣抓住时妈妈胯部的高度（她跳到最高点，手正好够到他的脚踝）
const Y0 = Y_GRAB + V1 * (T_ANKLE - 43.92) + V2 * (T_GRAB - T_ANKLE) - DIP1 * dip(T_GRAB - T_ANKLE);
const RISE3 = 44; // 三个人一起又往上飘的高度
const MOM_LOOK = { ...KID_MOM_LOOK, top: "#f39a5f", bottom: "#e08452" };
const MOM_INNER = { top: "#efe2f2", bottom: "#e6d6ec", legs: "#7d6266" }; // 外套里面是睡衣
const COAT_COL = "#f39a5f";
const KID_COAT = { top: COAT_COL, accent: "#e65a4f" };
/** 三个人荡一下：她冲过来的劲把一串人往左带（越往下荡得越多） */
const swing = (t: number) => (t < T_GRAB ? 0 : -26 * E.out(ph(t, T_GRAB, T_GRAB + 0.5)) + 14 * Math.sin((t - T_GRAB) * 7) * Math.exp(-(t - T_GRAB) / 0.35));
function momY(t: number): number {
  const tt = Math.min(t, T_FREE);
  let y = Y0 - V1 * (Math.min(tt, T_ANKLE) - 43.92) + 16 * dip(tt - COAT[2], 0.08, 0.3);
  if (tt > T_ANKLE) y -= V2 * (Math.min(tt, T_GRAB) - T_ANKLE);
  y += DIP1 * dip(tt - T_ANKLE);
  if (tt > T_GRAB) y += DIP2 * dip(tt - T_GRAB, 0.06, 0.25) - RISE3 * E.io(ph(tt, 46.12, 46.62)) + 3.5 * Math.sin((tt - 46.62) * 6.5) * win(tt, 46.6, 46.75, 47.1, 47.25);
  if (t > T_FREE) y -= 0.5 * 5200 * (t - T_FREE) ** 2; // 挣脱：往上一冲
  return y;
}
const momX = (t: number) => MX + Math.sin(t * 1.1) * 3 + swing(Math.min(t, T_FREE)) * 0.15;
/** 她的后手拉着吊在下面的他（他两只手攥着），他一裹上外套就把她的手拽下去一截 */
const momHoldHand = (t: number): Pt => [momX(t) - 30, momY(t) + 24 + 14 * dip(t - COAT[2], 0.08, 0.35)];
function momFig(t: number): Fig {
  const y = momY(t);
  const x = momX(t);
  const look = t < COAT[0] + 0.06 ? MOM_LOOK : MOM_INNER;
  const base: Fig = { x, y, grounded: false, kind: "woman", facing: -1, look, float: 0.85, lean: 0.03, legL: -0.06, legR: 0.12, kneeL: 0.3, kneeR: 0.5, barefoot: true, rim: 0.75, coat: t < COAT[0] + 0.06 ? 0.85 : 0.75 };
  if (t > T_FREE) return { ...base, lean: 0.05, aL: -2.6, aR: 2.6, head: 0.6, eyes: "closed", float: 1, legL: 0.05, legR: -0.05, kneeL: 0.15, kneeR: 0.2 };
  const opened = t > T_EYES;
  const lookDown = E.io(ph(t, T_LOOK, T_LOOK + 0.18));
  const smile = t > T_SMILE;
  const head = !opened ? 0.55 : t < T_LETGO ? -0.75 : mix(-0.85, -1.0, lookDown);
  const eyes: Fig["eyes"] = !opened ? "closed" : smile ? "smile" : "open";
  if (t < T_LETGO + 0.02) {
    // ② 后手拉着他；前手把外套从肩上褪下来，拎着它裹到他身上
    const hold = momHoldHand(t);
    const off = E.io(ph(t, COAT[0] - 0.1, COAT[0] + 0.08)); // 手伸到另一边肩上抓住领子
    const slide = E.io(ph(t, COAT[0] + 0.08, COAT[1]));
    const give = E.io(ph(t, COAT[1], COAT[2]));
    const back = E.io(ph(t, COAT[2], COAT[2] + 0.15));
    const kidSh = kidShoulders(t);
    let h: Pt = [x - 20, y + 14];
    h = lerpPt(h, [x + 6, y - 50], off);
    h = lerpPt(h, [x - 12, y + 6], slide);
    h = lerpPt(h, [kidSh[0] - 4, kidSh[1] - 6], give);
    h = lerpPt(h, [x - 26, y + 6], back);
    const open = E.io(ph(t, T_LETGO - 0.06, T_LETGO + 0.02));
    return { ...base, head, eyes, tears: opened ? 1 : 0, lean: mix(0.03, -0.28, Math.max(give, 0.5 * back)), hR: lerpPt(hold, [hold[0] + 4, hold[1] - 10], open), hL: h };
  }
  // ③④ 他吊在她脚上：她低头伸手够他；僵持时看见秤砣离地的靴子，哭着笑了一下；掏出小刀割断母子俩的红绳，再掰开他的手
  const out = E.io(ph(t, T_KNIFE_OUT - 0.14, T_KNIFE_OUT)); // 手伸到腰上的兜里
  const toRope = E.io(ph(t, T_KNIFE_OUT + 0.04, T_CUT - 0.04)); // 刀凑到脚踝上的绳子
  const slash = E.io(ph(t, T_CUT - 0.04, T_CUT + 0.05)); // 一割
  const pry2 = E.io(ph(t, T_PRY1 + 0.02, T_FREE - 0.02));
  const reach = E.io(ph(t, T_LETGO, T_LETGO + 0.25));
  const hR0: Pt = lerpPt([x - 26, y + 14], [x - 30, y + 30], reach);
  const hL0: Pt = lerpPt([x - 26, y + 6], [x - 14, y + 26], reach);
  const lean = mix(-0.14, -0.55, reach) - 0.35 * Math.max(toRope, pry2);
  const f: Fig = { ...base, head, eyes, tears: 1, lean };
  const jj = pose(f);
  let hR: Pt = lerpPt(hR0, [x + 8, y + 6], out);
  hR = lerpPt(hR, [jj.anL[0] - 2, jj.anL[1] + 14], toRope);
  hR = lerpPt(hR, [jj.anL[0] - 24, jj.anL[1] + 20], slash);
  return { ...f, hR, hL: lerpPt(hL0, [jj.anL[0] - 4, jj.anL[1] - 2], pry2) };
}
/** 她手里的小刀（割绳子的那一下到她升走） */
function momKnife(t: number, mj: ReturnType<typeof pose>): { p: Pt; rot: number } | null {
  if (t < T_KNIFE_OUT - 0.02 || t > T_FREE + 0.45) return null;
  const h = mj.handR;
  const toRope = E.io(ph(t, T_KNIFE_OUT + 0.04, T_CUT - 0.04));
  return { p: [h[0], h[1] + 2], rot: mix(-1.2, 2.4, toRope) + (t > T_CUT ? 0.6 * E.out(ph(t, T_CUT, T_CUT + 0.1)) : 0) };
}
const momAnkles = (t: number) => {
  const j = pose(momFig(t));
  return { L: j.anL, R: j.anR };
};

// ---------- 小石头：光着脚追出来 → 抱着妈妈 → 穿上她的鞋 → 吊在她脚上 → 被秤砣接住 → 跳 → 小刀 → 被她抱住 ----------
const KID = { kind: "kid" as const, rim: 0.8, bell: true, barefoot: true, look: KID_COAT, coat: 1.55 };
const kidLook = (t: number) => (t < COAT[2] ? {} : KID_COAT);
const kidCoat = (t: number) => (t < COAT[2] ? 0.3 : 1.55);
/** 吊在妈妈手上：两只手攥着她的手，光着的脚在空中乱蹬 */
function kidOnHand(t: number): Fig {
  const h = momHoldHand(t);
  const sink = dip(t - COAT[2], 0.08, 0.35);
  return { ...KID, look: kidLook(t), coat: kidCoat(t), x: h[0] + 6, y: h[1] + 64, grounded: false, facing: 1, lean: -0.05, head: 0.8, float: 0.4 - 0.2 * sink, legL: -0.2 + Math.sin(t * 9) * 0.25, legR: 0.25 - Math.sin(t * 9) * 0.25, kneeL: 0.5, kneeR: 0.3, hL: [h[0] - 2, h[1] + 2], hR: [h[0] + 3, h[1] + 4], eyes: t < T_EYES + 0.1 ? "wide" : "open", tears: 1 };
}
/** 外套裹到他身上时，他肩膀在哪（只按妈妈的手算） */
const kidShoulders = (t: number): Pt => {
  const h = momHoldHand(t);
  return [h[0] + 6, h[1] + 34];
};
/** 他吊在她的脚踝上（T_ANKLE 以后到挣脱） */
function kidHang(t: number): Fig {
  const a = momAnkles(Math.min(t, T_FREE));
  const mid: Pt = [(a.L[0] + a.R[0]) / 2, (a.L[1] + a.R[1]) / 2];
  const sw = swing(t) * 0.55;
  const pry1 = ph(t, T_CUT - 0.01, T_CUT + 0.07); // 绳子一断，一只手被震开
  const pry2 = ph(t, T_FREE - 0.06, T_FREE);
  const shakeHead = Math.sin((t - 45.6) * 14) * 0.25 * win(t, 45.6, 45.7, 46.0, 46.1);
  return { ...KID, look: KID_COAT, coat: 1.55, x: mid[0] + sw, y: mid[1] + 60, grounded: false, facing: 1, lean: sw * -0.004, head: 0.85 + shakeHead, float: 0.35, legL: -0.12 + Math.sin(t * 5) * 0.1, legR: 0.18 - Math.sin(t * 5) * 0.1, kneeL: 0.35, kneeR: 0.2, hL: lerpPt([a.L[0] - 2, a.L[1] + 3], [a.L[0] - 14, a.L[1] + 26], E.out(pry2)), hR: lerpPt([a.R[0] + 2, a.R[1] + 3], [a.R[0] + 16, a.R[1] + 22], E.out(pry1)), eyes: t > T_SMILE ? "wide" : "closed", tears: 1 };
}
const kidHangAnkle = (t: number): Pt => {
  const j = pose(kidHang(t));
  return [(j.anL[0] + j.anR[0]) / 2, (j.anL[1] + j.anR[1]) / 2];
};
/** 她松开手：他往下一坠，一把抱住她的脚踝 */
function kidSlide(t: number): Fig {
  const e = E.in2(ph(t, T_LETGO, T_ANKLE));
  const a = kidOnHand(T_LETGO);
  const b = kidHang(T_ANKLE);
  const jb = pose(b);
  return { ...KID, look: KID_COAT, coat: 1.55, x: mix(a.x, b.x, e), y: mix(a.y, b.y, e), grounded: false, facing: 1, lean: 0, head: 0.85, legL: mix(-0.2, -0.12, e), kneeL: 0.4, legR: mix(0.25, 0.18, e), kneeR: 0.25, float: 0.35, hL: lerpPt(a.hL!, jb.handL, e), hR: lerpPt(a.hR!, jb.handR, e), eyes: "wide", tears: 1 };
}

// ---------- 秤砣：从右边冲进来 → 起跳 → 抓住他的脚踝 → 吊着 → 落地接住他 → 跪着 ----------
const RUN_V = 540;
const Q_JUMP_X = MX + 74;
const GJ = 2240; // 起跳的重力（0.25 秒升到最高点）
const QIN_HANG = 105; // 她吊着时，胯部在他脚踝下面多少
const QK = MX - 30; // 落地以后跪着的地方（被荡到左边一点）
const qinApexHip = (): Pt => {
  const a = kidHangAnkle(T_GRAB);
  return [a[0], a[1] + QIN_HANG];
};
const QIN_STAND_HIP = -96;
/** 她的胯部（不带手）：只看妈妈和小石头吊着的样子，不反过来问小石头被接住以后 */
function qinHip(t: number): Pt {
  if (t < T_JUMP) return [Q_JUMP_X + RUN_V * (T_JUMP - t), QIN_STAND_HIP];
  const ap = qinApexHip();
  if (t < T_GRAB) {
    const s = t - T_JUMP;
    const v0 = GJ * (T_GRAB - T_JUMP);
    const y = QIN_STAND_HIP - v0 * s + 0.5 * GJ * s * s;
    return [mix(Q_JUMP_X, ap[0], E.out(ph(t, T_JUMP, T_GRAB))), y + (ap[1] - (QIN_STAND_HIP - 0.5 * GJ * (T_GRAB - T_JUMP) ** 2)) * ph(t, T_JUMP, T_GRAB)];
  }
  if (t < T_FREE) {
    const a = kidHangAnkle(t);
    return [a[0] + swing(t) * 0.45, a[1] + QIN_HANG];
  }
  // 往下掉：靴底正好在 T_FLOOR 落地
  const a = kidHangAnkle(T_FREE);
  const h0 = a[1] + QIN_HANG;
  const g = (2 * (QIN_STAND_HIP - h0)) / (T_FLOOR - T_FREE) ** 2;
  const s = Math.min(t, T_FLOOR) - T_FREE;
  return [mix(a[0] + swing(T_FREE) * 0.45, QK, E.io(ph(t, T_FREE, T_FLOOR))), h0 + 0.5 * g * s * s];
}
const qinRunning = (t: number) => t < T_JUMP;
function qinBody(t: number): Fig {
  const L = { kind: "qin" as const, rim: 0.85, facing: -1 as const };
  if (t < T_JUMP) {
    const w = walk((t - 44) * 2.6, 0.8);
    const brake = E.io(ph(t, T_JUMP - 0.12, T_JUMP));
    return { ...L, x: qinHip(t)[0], y: 0, lean: mix(-0.38, -0.05, brake), legL: w.legL * (1 - brake), legR: w.legR * (1 - brake) + 0.2 * brake, kneeL: w.kneeL * 1.6 + 0.6 * brake, kneeR: w.kneeR * 1.6 + 0.5 * brake, aL: w.aL * 2.2, aR: w.aR * 2.2, bendL: -1.2, bendR: -1.2, head: 0.75, eyes: "wide" };
  }
  const h = qinHip(t);
  if (t < T_FLOOR) {
    const air = t < T_GRAB;
    return { ...L, x: h[0], y: h[1], grounded: false, lean: air ? -0.12 : 0.02, legL: air ? 0.3 : -0.04, legR: air ? -0.35 : 0.12, kneeL: air ? 0.9 : 0.25, kneeR: air ? 0.6 : 0.35, float: air ? 0 : 0.22, head: 0.95, eyes: "wide" };
  }
  // 落地、跪下
  const land = kick(t, T_FLOOR, 0.12);
  const kneel = E.io(ph(t, T_FLOOR, T_FLOOR + 0.22));
  return { ...L, x: QK, y: 0, legL: mix(-0.2, -1.3, kneel), kneeL: mix(0.9, 1.75, kneel) + 0.4 * land, legR: mix(0.2, 0.25, kneel), kneeR: mix(0.9, 1.5, kneel), lean: 0.08, head: 0.9, eyes: "wide", tears: t > T_BURST ? 1 : 0 };
}

// ---------- 地上：她跪着，小石头在她怀里 → 挣开往前跳 → 被她从后面抱住 → 小刀 → 抱进怀里 ----------
const KID_RUN0 = QK - 34;
const KID_JUMP_X = QK - 168;
const kidGroundX = (t: number) => {
  if (t < T_LOOSE + 0.12) return KID_RUN0;
  if (t < J1[0]) return mix(KID_RUN0, KID_JUMP_X, E.io(ph(t, T_LOOSE + 0.12, J1[0])));
  if (t < J2[1]) return KID_JUMP_X - 10 * ph(t, J1[0], J2[1]);
  return KID_JUMP_X - 10;
};
const KID_STAY = KID_JUMP_X - 10;
const QIN_FRONT = KID_STAY + 96; // 她冲过来，跪在他面前（两个人面对面）
const qinGroundX = (t: number) => mix(QK, QIN_FRONT, E.io(ph(t, J2[1] - 0.12, T_HOLD)));
const jumpH = (t: number) => {
  const one = (j: [number, number], h: number) => (t > j[0] && t < j[1] ? 4 * h * ph(t, j[0], j[1]) * (1 - ph(t, j[0], j[1])) : 0);
  return one(J1, 34) + one(J2, 18);
};
const KNIFE_X = KID_STAY + 46; // 刀落在两个人中间
const T_TURN = J2[1] + 0.08; // 他转过身，面朝冲过来的她
function kidGround(t: number): Fig {
  // 在她怀里（落地时从她头顶滑进她怀里）
  if (t < T_LOOSE) {
    const q = pose(qinBody(t));
    const into = E.out(ph(t, T_FLOOR, T_FLOOR + 0.16));
    const fall = pose(kidHang(T_FREE));
    const dq = [qinHip(t)[0] - qinHip(T_FREE)[0], qinHip(t)[1] - qinHip(T_FREE)[1]];
    const drop = mix(fall.hip[1] + dq[1], q.neck[1] + 34, into);
    return { ...KID, x: mix(fall.hip[0] + dq[0], q.neck[0] - 24, into), y: drop, grounded: false, facing: 1, lean: 0.1, head: 0.95, legL: 0.8 * into, kneeL: 1.2 * into, legR: 0.6 * into, kneeR: 1.0 * into, float: 0.2 * (1 - into), aL: mix(-2.7, -0.5, into), aR: mix(2.7, 0.3, into), eyes: "wide", tears: 1 };
  }
  const x = kidGroundX(t);
  const h = jumpH(t);
  const turned = t > T_TURN;
  const kneel = E.io(ph(t, T_HOLD - 0.05, T_HOLD + 0.25));
  const reach = win(t, T_REACH, T_COVER + 0.05, T_TAKE, T_TAKE + 0.3);
  const lift = 16 * E.io(ph(t, T_LIGHT, T_HUG)) * (1 - E.io(ph(t, T_STOMP, T_STOMP + 0.3)));
  const hug = E.io(ph(t, T_HUG, T_HUG + 0.28));
  const stepping = t > T_LOOSE + 0.12 && t < J1[0];
  const w = walk((t - T_LOOSE) * 3.2, stepping ? 0.5 : 0);
  const up = turned ? 0 : 1;
  const lookUp = !turned ? 0.95 : t < T_KNIFE - 0.05 ? 0.15 : t < T_LIGHT ? mix(-0.55, 0.0, E.io(ph(t, T_TAKE, T_TAKE + 0.3))) : mix(0.0, 0.85, E.io(ph(t, T_LIGHT, T_LIGHT + 0.25)));
  if (hug > 0) {
    // 被她按进怀里：脸贴在她胸口
    const q = pose(qinFig(T_HUG + 0.28, true));
    return { ...KID, x: mix(x, q.neck[0] - 26, hug), y: mix(-lift - 60, q.neck[1] + 52, hug), grounded: false, facing: 1, lean: mix(0, 0.3, hug), head: mix(lookUp, -0.3, hug), legL: mix(1.25, 0.9, hug), kneeL: mix(1.7, 1.4, hug), legR: mix(-0.2, 0.5, hug), kneeR: 1.3, aL: -0.2, aR: 0.9, eyes: hug > 0.6 ? "closed" : "wide", tears: 1, float: 0.25 * (1 - hug) };
  }
  if (!turned) {
    return { ...KID, x, y: -h, facing: -1, head: lookUp, legL: w.legL, kneeL: w.kneeL, legR: w.legR, kneeR: w.kneeR, aL: -2.6 * up, aR: 2.4 * up, eyes: "wide", tears: 1 };
  }
  // 转过身面朝她，跪下；刀落在两个人中间，他伸手去够
  const kh = 60;
  return {
    ...KID,
    x,
    y: -kh * kneel * 0 - lift,
    grounded: true,
    facing: 1,
    head: lookUp,
    lean: 0.12 * reach,
    legL: mix(0.1, 1.25, kneel),
    kneeL: mix(0.2, 1.7, kneel),
    legR: mix(-0.1, -0.2, kneel),
    kneeR: mix(0.2, 1.4, kneel),
    hR: reach > 0.02 ? lerpPt([x + 16, -58], [KNIFE_X - 8, -10], reach) : undefined,
    aR: 0.4,
    aL: -0.2,
    eyes: t > T_KNIFE ? "open" : "wide",
    tears: 1,
    float: lift > 1 ? 0.45 : 0,
  };
}
/** 秤砣在地上：跪着搂着他 → 看他跳 → 冲过去跪在他面前扶住他的肩 → 先一步盖住小刀、拿起来、合上、揣进兜里 → 把他按进怀里 */
function qinFig(t: number, noKid = false): Fig {
  if (t < T_FLOOR - 0.001) {
    const b = qinBody(t);
    if (t < T_JUMP - 0.15) return b;
    // 起跳：两手伸向他的脚踝；抓住以后一直攥着
    const a0 = kidHangAnkle(Math.min(t, T_FREE));
    const a: Pt = t > T_FREE ? [a0[0] + qinHip(t)[0] - qinHip(T_FREE)[0], a0[1] + qinHip(t)[1] - qinHip(T_FREE)[1]] : a0;
    const reach = E.out(ph(t, T_JUMP - 0.15, T_GRAB));
    const bj = pose({ ...b, hL: undefined, hR: undefined });
    const rest: Pt = [bj.neck[0] - 10, bj.neck[1] - 70];
    return { ...b, hL: lerpPt(rest, [a[0] - 6, a[1] + 4], reach), hR: lerpPt(rest, [a[0] + 6, a[1] + 8], reach) };
  }
  const base = qinBody(t);
  const x = qinGroundX(t);
  const rush = ph(t, J2[1] - 0.12, T_HOLD);
  const head = t < T_LOOSE + 0.2 ? 0.9 : t < J2[1] ? 0.5 : t < T_KNIFE - 0.05 ? 0.05 : t < T_TAKE ? -0.55 : t < T_POCKET ? -0.1 : t < T_HUG ? 0.1 : -0.6;
  const f: Fig = { ...base, x, head, eyes: t > T_HUG + 0.3 ? "closed" : "open", tears: 1 };
  if (rush > 0 && rush < 1) {
    // 起身扑过去
    const r = Math.sin(Math.PI * rush);
    f.legL = mix(-1.3, -0.7, r);
    f.kneeL = mix(1.75, 1.0, r);
    f.legR = mix(0.25, 0.5, r);
    f.lean = 0.2 * r;
  }
  if (t > T_STOMP - 0.22 && t < T_STOMP) f.y = -12 * Math.sin(Math.PI * ph(t, T_STOMP - 0.22, T_STOMP)); // 前脚抬起来再跺下去
  if (noKid) return { ...f, lean: -0.22, head: -0.6 };
  // 落地接住他、跪着搂着他
  if (t < T_LOOSE + 0.15) {
    const go = E.io(ph(t, T_LOOSE, T_LOOSE + 0.15));
    const kj = pose(kidGround(t));
    return { ...f, hL: lerpPt([kj.hip[0] + 6, kj.hip[1] - 20], [x - 60, -110], go), hR: lerpPt([kj.neck[0] + 10, kj.neck[1] + 6], [x - 40, -130], go) };
  }
  // 伸着手看他跳
  if (t < J2[1] - 0.12) return { ...f, aL: -1.6, aR: -1.2, bendL: 0.4, bendR: 0.3, lean: -0.1 };
  const k = pose(kidGround(Math.min(t, T_HUG - 0.001)));
  // 扶住他的肩
  const hold = E.io(ph(t, T_HOLD - 0.12, T_HOLD + 0.12));
  const shL: Pt = [k.neck[0] + 8, k.neck[1] + 8];
  const shR: Pt = [k.neck[0] + 12, k.neck[1] + 14];
  let hL: Pt = lerpPt([x - 50, -120], shL, hold);
  const hR: Pt = lerpPt([x - 40, -110], shR, hold);
  // 前面那只手先一步盖住小刀；拿起来，收回自己这一边举到眼前看；合上；揣进兜里；再扶回他的肩
  const cover = E.io(ph(t, T_REACH, T_COVER));
  const take = E.io(ph(t, T_COVER + 0.12, T_TAKE));
  const look = E.io(ph(t, T_TAKE, T_TAKE + 0.25));
  const pocket = E.io(ph(t, T_POCKET, T_POCKET + 0.25));
  const back = E.io(ph(t, T_POCKET + 0.25, T_LIGHT + 0.1));
  hL = lerpPt(hL, [KNIFE_X + 2, -12], cover);
  hL = lerpPt(hL, [x - 22, -70], take);
  hL = lerpPt(hL, [x - 38, -146], look);
  hL = lerpPt(hL, [x + 4, -96], pocket);
  hL = lerpPt(hL, shL, back);
  const hug = E.io(ph(t, T_HUG, T_HUG + 0.28));
  const lean = mix(0.08, 0.2, cover * (1 - take)) - 0.05 * look;
  if (hug > 0) {
    const qq = pose({ ...f, lean: -0.22 });
    return { ...f, lean: mix(lean, -0.22, hug), head: mix(head, -0.6, hug), hL: lerpPt(hL, [qq.neck[0] - 44, qq.neck[1] + 46], hug), hR: lerpPt(hR, [qq.neck[0] - 34, qq.neck[1] + 8], hug) };
  }
  return { ...f, lean, hL, hR };
}

// ---------- 小刀：从白里掉回来（人烧成了灰，铁掉回人间），「叮」落在两个人中间；她拿起来、合上、揣进兜里 ----------
function knifeState(t: number): { p: Pt; rot: number; fold: number } | null {
  if (t < T_KNIFE - 0.45) return null;
  if (t < T_KNIFE) {
    const u = ph(t, T_KNIFE - 0.45, T_KNIFE);
    return { p: [KNIFE_X + 26 * (1 - u), mix(-1100, -6, u * u)], rot: 1.3 + u * 6, fold: 0 };
  }
  if (t < T_COVER + 0.12) {
    const b = Math.max(0, Math.sin(Math.PI * ph(t, T_KNIFE, T_KNIFE + 0.18))) * 14;
    return { p: [KNIFE_X, -6 - b], rot: 0.12 + 0.25 * Math.sin(Math.PI * ph(t, T_KNIFE, T_KNIFE + 0.18)), fold: 0 };
  }
  if (t > T_POCKET + 0.2) return null;
  const h = pose(qinFig(t)).handL;
  const fold = E.io(ph(t, T_FOLD, T_FOLD + 0.2));
  return { p: [h[0] + 2, h[1] + 3], rot: mix(0.12, -2.4, E.io(ph(t, T_COVER + 0.12, T_TAKE + 0.2))), fold };
}
function drawKnife(c: C, k: { p: Pt; rot: number; fold: number }, t: number) {
  c.save();
  c.translate(k.p[0], k.p[1]);
  c.rotate(k.rot);
  c.scale(0.95, 0.95);
  // 刀柄上拴着一截割断的红绳
  rope(c, [-30, 0], [-42 + Math.sin(t * 3) * 3, 22], 4, 2.2);
  c.fillStyle = "#3a2c22";
  c.fillRect(-34, -5, 36, 11);
  c.save();
  c.translate(0, 0);
  c.rotate(-k.fold * 2.9);
  c.fillStyle = "#d4d7dc";
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(46, -1);
  c.lineTo(52, 3);
  c.lineTo(0, 5);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.fillRect(6, -3, 34, 2);
  c.restore();
  c.restore();
  // 掉下来的时候一闪一闪
  if (t > T_KNIFE - 0.42 && t < T_KNIFE + 0.1) {
    const g = c.createRadialGradient(k.p[0], k.p[1], 0, k.p[0], k.p[1], 40);
    g.addColorStop(0, `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 60)})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(k.p[0] - 40, k.p[1] - 40, 80, 80);
  }
}

// ---------- 道具：妈妈那件橘色外套（下摆缝了一圈铅块） ----------
function coatShape(c: C, top: Pt, rot: number, s: number, t: number) {
  c.save();
  c.translate(top[0], top[1]);
  c.rotate(rot);
  c.scale(s, s);
  c.lineJoin = "round";
  const sway = Math.sin(t * 9) * 4;
  const body = () => {
    c.beginPath();
    c.moveTo(-16, 0);
    c.lineTo(16, 0);
    c.lineTo(28 + sway, 84);
    c.lineTo(-28 + sway, 84);
    c.closePath();
  };
  const sleeves = () => {
    c.beginPath();
    c.moveTo(-15, 2);
    c.lineTo(-30 + sway * 0.5, 54);
    c.lineTo(-20 + sway * 0.5, 56);
    c.lineTo(-8, 10);
    c.moveTo(15, 2);
    c.lineTo(30 + sway * 0.5, 54);
    c.lineTo(20 + sway * 0.5, 56);
    c.lineTo(8, 10);
  };
  c.strokeStyle = PAL.ink;
  c.lineWidth = 4;
  sleeves();
  c.stroke();
  body();
  c.stroke();
  c.fillStyle = "#d9824c";
  sleeves();
  c.fill();
  c.fillStyle = COAT_COL;
  body();
  c.fill();
  // 领子
  c.fillStyle = "#ffd9b8";
  c.fillRect(-10, 0, 20, 6);
  // 下摆缝的铅块
  c.fillStyle = "#6b6a80";
  for (let i = 0; i < 5; i++) c.fillRect(-24 + i * 10.5 + sway * 0.9, 76, 7, 8);
  c.restore();
}
/** 外套：在她身上 → 褪下来拎在她手里 → 裹到他身上 */
function coatFlight(c: C, t: number, mj: ReturnType<typeof pose>) {
  if (t < COAT[0] || t > COAT[2] + 0.05) return;
  const kidSh = kidShoulders(t);
  if (t < COAT[1]) {
    // 从她肩上滑下来，挂在她手上
    const e = E.io(ph(t, COAT[0], COAT[1]));
    const top = lerpPt([mj.neck[0], mj.neck[1] + 2], [mj.handL[0], mj.handL[1] + 2], e);
    coatShape(c, top, mix(0, -0.25, e), 1, t);
    return;
  }
  const e = E.io(ph(t, COAT[1], COAT[2]));
  const top = lerpPt([mj.handL[0], mj.handL[1] + 2], [kidSh[0], kidSh[1] - 8], e);
  coatShape(c, top, mix(-0.25, 0.05, e) - 0.6 * Math.sin(Math.PI * e), mix(1, 0.75, e), t);
}
/** 外套下摆的铅块（穿在身上时也看得见） */
function hemWeights(c: C, j: ReturnType<typeof pose>, len: number, flare: number) {
  c.fillStyle = "#6b6a80";
  for (let i = 0; i < 4; i++) c.fillRect(j.hip[0] - flare * 0.75 + i * flare * 0.45, j.hip[1] + len - 5, flare * 0.28, 5);
}

// ---------- 街上的人：一个打伞的人低着头从他们底下走过去；对面一个妈妈带着孩子站着，天上炸开光的时候捂住孩子的眼睛 ----------
function walkers(c: C, t: number) {
  // 低着头走过去（从吊着的三个人底下）
  if (t > 44.3 && t < 49.5) {
    const x = MX + 100 - 150 * (t - 44.3);
    const g = walk((t - 44.3) * 1.7, 0.32);
    figure(c, { x, y: -30, s: 0.82, kind: "plain", facing: -1, head: -0.75, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[2], look: crowdLook(31), aL: -0.5, bendL: -1.6, tone: 0.35, rim: 0.3 }, t);
  }
  // 对面的妈妈和孩子：站着低着头；光一炸，捂住孩子的眼睛，拉着他走开
  const go = ph(t, T_BURST + 0.35, T_BURST + 2.0);
  const x = MX + 196 + 160 * go * go;
  if (x > MX + 520) return;
  const g = walk((t - T_BURST) * 1.9, go > 0 ? 0.34 : 0);
  const cover = E.io(ph(t, T_BURST - 0.05, T_BURST + 0.15));
  const kidPeek = win(t, T_BURST - 0.25, T_BURST - 0.1, T_BURST, T_BURST + 0.12);
  figure(c, { x, y: -30, s: 0.82, kind: "woman", facing: go > 0 ? 1 : -1, head: -0.7, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[1], look: crowdLook(44), aL: -0.5, bendL: -1.6, hR: cover > 0.02 ? [x - 30 + 60 * (go > 0 ? 1 : 0), -30 - 70] : undefined, tone: 0.35, rim: 0.3 }, t);
  figure(c, { x: x - 30 + 60 * (go > 0 ? 1 : 0), y: -30, s: 0.48, kind: "kid", facing: go > 0 ? 1 : -1, head: mix(-0.5, 0.7, kidPeek), legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, look: crowdLook(47), tone: 0.35, rim: 0.3, bell: false }, t);
}

// ---------- 天上炸开五颜六色的光：从画面上方压下来，照在仰着的脸上 ----------
const PRISM = ["255,150,185", "255,192,128", "255,234,140", "150,228,190", "148,198,255", "200,168,255"];
function skyBurst(c: C, t: number) {
  const u = t - T_BURST;
  if (u < 0 || u > 2.4) return;
  const a = (1 - Math.exp(-u / 0.05)) * Math.exp(-u / 0.7);
  c.save();
  // 光柱：从画面上方斜着照下来，五颜六色
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 150 + Math.sin(i * 2.3) * 40;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(${PRISM[i % 6]},${0.42 * a})`);
    g.addColorStop(0.75, `rgba(${PRISM[i % 6]},${0.12 * a})`);
    g.addColorStop(1, `rgba(${PRISM[i % 6]},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 26, 0);
    c.lineTo(x + 26, 0);
    c.lineTo(x + 120 + (x - W / 2) * 0.5, H);
    c.lineTo(x - 50 + (x - W / 2) * 0.5, H);
    c.closePath();
    c.fill();
  }
  // 一圈圈彩色的光从上面扩下来
  for (let i = 0; i < 6; i++) {
    const r = 260 + u * 1600 - i * 110;
    if (r < 10) continue;
    c.strokeStyle = `rgba(${PRISM[i]},${0.42 * a})`;
    c.lineWidth = 80;
    c.beginPath();
    c.arc(W / 2, -420, r, 0, Math.PI);
    c.stroke();
  }
  c.globalCompositeOperation = "lighter";
  const g2 = c.createRadialGradient(W / 2, -300, 0, W / 2, -300, 1500);
  g2.addColorStop(0, `rgba(255,250,240,${0.8 * a})`);
  g2.addColorStop(0.5, `rgba(255,190,220,${0.25 * a})`);
  g2.addColorStop(1, "rgba(255,240,230,0)");
  c.fillStyle = g2;
  c.fillRect(0, 0, W, H);
  c.restore();
}

// ---------- 镜头 ----------
const DIVE_TO: Pt = [-1450, -420]; // 网那一镜的世界里，她逆着往上升的地方
function diveCam(t: number): Cam {
  const k0 = webCam(WEB_B);
  const u = ph(t, 43.92, T_LANDCAM);
  const z = Math.exp(mix(Math.log(k0.z), Math.log(1.1), u ** 2.1));
  const s0 = toS(k0, DIVE_TO);
  const sp = lerpPt(s0, [W / 2, 900], E.io(u));
  return { ...aimC(DIVE_TO, sp, z), r: mix(k0.r ?? 0, 0, E.io(u)) };
}
const pairAt = (t: number): Pt => [momX(t) - 18, momY(t) + 22];
/** 扎下去：街的镜头和网的镜头对齐（她们俩在两个世界里画面位置、大小一样） */
function streetDive(t: number): Cam {
  const k = diveCam(t);
  return aimC(pairAt(t), toS(k, DIVE_TO), k.z);
}
const LAND_S: Pt = [540, 860];
const LAND_Z = 2.6;
const COAT_Z = 2.95;
const TRIO_Z = 1.78;
function camAt(t: number): Cam {
  if (t < T_STREET + 0.12) return streetDive(t);
  // 落在两个人身上：越推越慢
  const d0 = streetDive(T_STREET + 0.12);
  const s0 = toS(d0, pairAt(T_STREET + 0.12));
  const uL = E.out(ph(t, T_STREET + 0.12, T_LANDCAM + 0.12));
  let k = aimC(pairAt(t), lerpPt(s0, LAND_S, uL), Math.exp(mix(Math.log(d0.z), Math.log(LAND_Z), uL)));
  // 跟着外套从她身上落到他身上：越推越慢
  const coat = aimC([momX(t) - 22, momY(t) + mix(-10, 40, E.io(ph(t, COAT[0], COAT[2])))], [540, 900], COAT_Z * (1 + 0.06 * E.out(ph(t, COAT[0], T_LETGO))));
  k = camLerp(k, coat, E.io(ph(t, 44.5, 44.8)));
  // 他滑下去、吊在她脚上：镜头跟着往下，退开一点；她冲进来时让出右下角
  const hang = aimC([momX(t) - 4, momY(t) + 140], [540, 860], 2.6);
  k = camLerp(k, hang, E.io(ph(t, T_LETGO, T_ANKLE + 0.1)));
  const trio = aimC([momX(t) + 30 * (1 - ph(t, T_GRAB, 46.4)), momY(t) + 200], [540, 900], TRIO_Z);
  k = camLerp(k, trio, E.io(ph(t, 45.62, T_GRAB + 0.1)));
  // 僵持：她低头看见秤砣离地的靴子——镜头推到她的脸上；再落到她掰开他的手
  const face = aimC([momX(t) - 6, momY(t) - 58], [540, 760], 3.05);
  k = camLerp(k, face, E.io(ph(t, T_LOOK + 0.15, T_SMILE + 0.1)));
  const hands = aimC([momX(t) - 2, momY(t) + 96], [540, 880], 3.1);
  k = camLerp(k, hands, E.io(ph(t, T_SMILE + 0.18, T_PRY1 + 0.05)));
  if (t < T_FREE) return k;
  // 她往上一冲出了画面——镜头不追，跟着往下掉的两个人
  const kp = camAt(T_FREE - 0.0001);
  const fallCam = (s: number) => aimC([qinHip(s)[0], qinHip(s)[1] - 120], [540, 900], 2.6);
  k = camLerp(kp, fallCam(t), E.io(ph(t, T_FREE, T_FREE + 0.18)));
  if (t < T_FLOOR) return k;
  // 落地：两个人缩在画面下面，仰着头，头顶是天
  const ground = aimC([QK + 36, -118], [540, 1280], 2.5 * (1 + 0.02 * ph(t, T_FLOOR, T_BURST)));
  k = camLerp(fallCam(T_FLOOR), ground, E.out(ph(t, T_FLOOR, T_FLOOR + 0.25)));
  // 光炸开：镜头被光推开一点
  const pushed = { ...ground, z: ground.z * (1 - 0.07 * E.out(ph(t, T_BURST, T_BURST + 0.4))) };
  k = camLerp(k, pushed, E.io(ph(t, T_BURST, T_BURST + 0.35)));
  // 灰落下来；他挣开她往前跳：镜头跟着他，慢一点
  const lag = (s: number) => aimC([mix(qinGroundX(s), kidGroundX(s), 0.55) + 10, -150 - jumpH(s - 0.06) * 0.5], [540, 1150], 2.3);
  k = camLerp(k, lag(t), E.io(ph(t, T_LOOSE - 0.05, T_LOOSE + 0.45)));
  // 她冲过去跪在他面前：两个人面对面，凑近
  const pair = aimC([(KID_STAY + QIN_FRONT) / 2, -100], [540, 1060], 2.75);
  k = camLerp(k, pair, E.io(ph(t, J2[1] - 0.1, T_HOLD + 0.35)));
  // 小刀从上面掉进画面，「叮」落在两个人中间：镜头落到刀上，两只手伸过去
  const knifeCam = aimC([KNIFE_X + 4, -42], [540, 1080], 3.6);
  k = camLerp(k, knifeCam, E.io(ph(t, T_KNIFE + 0.02, T_REACH + 0.4)));
  // 她拿起刀：镜头跟着刀抬到她眼前，再跟着揣进兜里
  const lookCam = aimC([QIN_FRONT - 30, -130], [540, 960], 3.3);
  k = camLerp(k, lookCam, E.io(ph(t, T_TAKE - 0.15, T_TAKE + 0.3)));
  const pocketCam = aimC([(KID_STAY + QIN_FRONT) / 2 + 10, -100], [540, 1020], 2.9);
  k = camLerp(k, pocketCam, E.io(ph(t, T_POCKET - 0.05, T_POCKET + 0.35)));
  // 他的脚跟又离了地：她把他按进怀里，镜头越推越慢，停在她闭着的眼睛上
  const eye = (s: number): Pt => {
    const q = pose(qinFig(s));
    return [q.head[0], q.head[1]];
  };
  const hugCam = (s: number) => aimC(eye(s), END_S, mix(2.9, END_Z, E.out(ph(s, T_HUG + 0.2, T_END))));
  return camLerp(k, hugCam(t), E.io(ph(t, T_HUG + 0.1, T_HUG + 0.75)));
}
/** 53.94 这一刻她闭着的眼睛在画面上的位置和镜头倍数（十二年前那一镜从这里溶进去） */
export const END_S: Pt = [540, 880];
export const END_Z = 4.4;
export const camS23 = camAt;

// ---------- 画 ----------
/** 母子俩夜里拴在一起的那根红绳：她的脚踝 → 他的脚踝；47.18 被她割断，两头各剩一截 */
function tieRope(c: C, t: number, mj: ReturnType<typeof pose> | null, kj: ReturnType<typeof pose>) {
  if (t < T_CUT && mj) {
    // 松松地垂成一个弯，往外荡开，不贴在他身上
    const a0 = mj.anL;
    const b0 = kj.anR;
    const d = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]);
    const bow = 34 + 0.25 * d + Math.sin(t * 2.3) * 6;
    c.save();
    c.strokeStyle = "#d65a4c";
    c.lineWidth = 3.4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(a0[0], a0[1]);
    c.quadraticCurveTo((a0[0] + b0[0]) / 2 + bow, (a0[1] + b0[1]) / 2 + 30, b0[0], b0[1]);
    c.stroke();
    c.restore();
    return;
  }
  const u = ph(t, T_CUT, T_CUT + 0.25);
  const sw = Math.sin(t * 2.7) * 5;
  if (mj) rope(c, mj.anL, [mj.anL[0] + 8 + sw, mj.anL[1] + 30 - 10 * (1 - u)], 6, 2.6); // 她脚踝上剩下的一截（和第一帧那个女人一样）
  rope(c, kj.anR, [kj.anR[0] - 10 + sw, kj.anR[1] + mix(40, 64, u)], 10, 2.6); // 他脚踝上剩下的一截（夜里他攥着它去敲她的门）
  // 割断的一下：绳头弹开，一小撮红线屑
  if (t < T_CUT + 0.3 && mj) {
    c.fillStyle = `rgba(214,90,76,${1 - u})`;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(mj.anL[0] - 10 - i * 6 * u * 3, mj.anL[1] + 20 + i * 4 + 30 * u, 1.8, 0, Math.PI * 2);
      c.fill();
    }
  }
}
function drawStreet(c: C, t: number, k: Cam) {
  const dawn = E.io(ph(t, 43.95, 45.6));
  street(c, k, t, { night: mix(0.35, 0, dawn), lights: mix(0.6, 0, dawn) });
  c.save();
  applyCam(c, k);
  // 他们家的门开着，门框上拴脚绳的铁环
  door(c, HOME_DOOR, 0, { open: 0.9, w: 100, h: 230 });
  walkers(c, t);
  const mjVisible = t < T_FREE + 0.5;
  const mj = mjVisible ? figure(c, momFig(t), t) : null;

  // 秤砣（吊着的时候在最下面，先画）
  const qBefore = t < T_FLOOR;
  let qj = null as ReturnType<typeof pose> | null;
  if (qBefore && t > 44.9) qj = figure(c, qinFig(t), t);
  // 小石头
  let kf: Fig;
  if (t < T_LETGO) kf = kidOnHand(t);
  else if (t < T_ANKLE) kf = kidSlide(t);
  else if (t < T_FREE) kf = kidHang(t);
  else kf = kidGround(t);
  if (!qBefore) qj = figure(c, qinFig(t), t);
  const kj = figure(c, kf, t);
  tieRope(c, t, mj, kj);
  if (mj) {
    const kn = momKnife(t, mj);
    if (kn) drawKnife(c, { p: kn.p, rot: kn.rot, fold: 0 }, t);
  }
  if (t > COAT[2]) hemWeights(c, kj, 1.55 * 50 * 0.6 * (1 - 1.5 * (kf.float ?? 0)) , 16);
  if (mj) coatFlight(c, t, mj);
  if (qBefore && qj && t > T_JUMP - 0.15) {
    // 抓着他脚踝的手画在鞋上面
    const q = pose(qinFig(t));
    c.fillStyle = "#f5d3bf";
    for (const h of [q.handL, q.handR]) {
      c.beginPath();
      c.arc(h[0], h[1], 4.8, 0, Math.PI * 2);
      c.fill();
    }
  }
  const ks = knifeState(t);
  if (ks) drawKnife(c, ks, t);
  // 她的靴子离开石板时，靴底掉下来的灰；落地、跳、跺脚的灰和裂纹
  if (t > T_GRAB && t < T_FREE) {
    const q = pose(qinFig(t));
    c.fillStyle = "rgba(250,240,242,0.85)";
    for (let i = 0; i < 6; i++) {
      const s = ((t * 1.7 + i * 0.37) % 1);
      c.beginPath();
      c.arc(q.toeL[0] - 10 + i * 6, q.toeL[1] + 8 + s * 120, 2.4, 0, Math.PI * 2);
      c.fill();
    }
  }
  crack(c, QK - 6, 0, 90, ph(t, T_FLOOR, T_FLOOR + 0.2));
  crack(c, KID_JUMP_X, 0, 34, ph(t, J1[1], J1[1] + 0.15) * 0.7);
  puff(c, t, T_FLOOR, QK - 6, 160, 0.8);
  puff(c, t, J1[1], KID_JUMP_X, 70, 0.5);
  puff(c, t, J2[1], KID_JUMP_X - 10, 50, 0.45);
  puff(c, t, T_STOMP, QIN_FRONT - 30, 80, 0.55);
  puff(c, t, T_KNIFE, KNIFE_X, 30, 0.4);
  c.restore();
  // 灰：她烧成的灰从光里落下来，越来越密
  const after = E.io(ph(t, T_BURST + 0.1, T_BURST + 0.9));
  ash(c, t, k, { n: mix(0.4, 1.0, after), speed: mix(1, 0.75, after) });
  skyBurst(c, t);
  // 抱住以后：暖光
  const warm = E.io(ph(t, T_HUG + 0.2, 53.3));
  if (warm > 0.01) {
    const q = pose(qinFig(t));
    const p = toS(k, [q.neck[0] - 10, q.neck[1] + 20]);
    const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 760);
    g.addColorStop(0, `rgba(${PAL.warmRGB},${0.3 * warm * (0.9 + 0.1 * Math.sin(t * 6))})`);
    g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
}
function puff(c: C, t: number, at: number, x: number, size: number, dur: number) {
  const u = t - at;
  if (u < 0 || u > dur) return;
  c.save();
  c.fillStyle = PAL.ash;
  c.globalAlpha = 0.85 * (1 - u / dur);
  for (let i = 0; i < 12; i++) {
    const a = (i / 11) * Math.PI;
    const r = 14 + u * size * (0.7 + (i % 3) * 0.2);
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 1.4, -6 - Math.sin(a) * r * 0.25 - u * 20, 8 + u * 22, 5 + u * 10, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

const impact = (t: number, k: Cam): Cam => {
  const a = kick(t, T_FLOOR, 0.12);
  const s = shake(t, 20 * kick(t, T_FLOOR, 0.11) + 8 * kick(t, T_GRAB, 0.09) + 6 * kick(t, T_ANKLE, 0.09) + 5 * kick(t, J1[1], 0.08) + 3 * kick(t, J2[1], 0.07) + 7 * kick(t, T_STOMP, 0.09) + 4 * kick(t, T_KNIFE, 0.06) + 6 * kick(t, T_BURST, 0.2), 3);
  return jolt({ ...k, z: k.z * (1 + 0.045 * a + 0.03 * kick(t, T_GRAB, 0.12)), y: k.y - (12 * a) / k.z }, s);
};

const s19: Shot = {
  a: 43.92,
  b: T_END,
  draw(c, t) {
    const k = impact(t, camAt(t));
    const kp = camAt(t - 1 / 60);
    const v = Math.abs((k.y - kp.y) * k.z) + Math.abs(Math.log(k.z / kp.z)) * 700;
    if (t < T_STREET + 0.12) {
      // 网那一镜接着往下扎：天亮了，网上的人把自己拽回楼里；拖影里换成街
      const kw = diveCam(t);
      const e = E.io(ph(t, T_STREET - 0.06, T_STREET + 0.12));
      const scene = (c: C) => {
        webDraw(c, t, { cam: kw, dawn: E.io(ph(t, 43.92, 44.3)) });
        if (e > 0) {
          c.save();
          c.globalAlpha = e;
          drawStreet(c, t, k);
          c.restore();
        }
        // 她们俩：在网的世界里也是这个大小、这个位置（逆着往上升，带一点暖光）
        c.save();
        applyCam(c, k);
        const pa = pairAt(t);
        const g = c.createRadialGradient(pa[0], pa[1], 0, pa[0], pa[1], 70 / k.z + 120);
        g.addColorStop(0, `rgba(255,200,150,${0.55 * (1 - e)})`);
        g.addColorStop(1, "rgba(255,200,150,0)");
        c.fillStyle = g;
        c.fillRect(pa[0] - 900, pa[1] - 900, 1800, 1800);
        const mj = figure(c, momFig(t), t);
        const kj = figure(c, kidOnHand(t), t);
        tieRope(c, t, mj, kj);
        c.restore();
      };
      smearV(c, Math.min(170, v * 0.55) * (1 - 0.5 * e), scene);
      return;
    }
    const smear = t < T_LANDCAM + 0.15 ? Math.min(120, v * 0.5) : t > T_FREE && t < T_FLOOR + 0.05 ? Math.min(60, v * 0.4) : 0;
    if (smear > 2) smearV(c, smear, (c) => drawStreet(c, t, k));
    else drawStreet(c, t, k);
    vignette(c, 0.38 + 0.12 * win(t, T_LOOK, T_SMILE, T_FREE, T_FLOOR) - 0.15 * E.io(ph(t, T_HUG, 53.4)));
    flash(c, 0.35 * kick(t, T_BURST, 0.18), "#fffaf2");
  },
};

export const chorus1Shots: Shot[] = [webShotB, s19];
