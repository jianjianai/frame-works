// 三③（模块 89.79–94.02，作品 83.79–88.02，两句「请你等等我」）：白天，街上。2026-10-25 用户第三次重做（「1:23.83~1:27.97 的镜头和动作设计全部重做……
// 上面这个人换一个方向，面向她，拉下来时要有动作和物理惯性要顺畅，不能生硬，情绪运镜也要配合好」）。
// 之后用户又说「距离地面太矮了，不要摇来摇去，在空中应该惯性所有人都向左飘」（第四版）：
// 阿满（绿帽子、棕夹克）朝着她来的方向（右）飘着，闭着眼往上升；她从右边冲进来，一蹲、蹬地往左上方扑出去（靴底离地约 390），
// 「等」90.45 在最高点刚往下掉的那一下攥住他的脚踝：被攥住的腿一下拽直、腰一折、两只手往上甩，猛地睁眼低头看她；
// 她的分量压上来，两个人一起往下一坠（约 110）、被他的浮力托住，又越升越快；她扑过来往左冲的劲儿带着两个人一直往左飘、越飘越慢，
// 身子顺着斜一点（她在下面带着走，他被拖着），不来回荡。她低头看见街面往下掉，吓一跳，又咬着牙抬头；他看着她，含着泪。
// 第二句「请」91.8 小石头从右边跑进来，蹲一下、跳起来，「你」92.25 两只手攥住她的铁靴，吊在她下面：三个人一下停住，「等等我」往下落、越落越快；
// 他先着地，往后退一步蹲着拽，93.02「咚」她的铁靴砸回街面（落在他左边），膝盖一弯；她站起来两只手往下一拽，把阿满拽到她左边，松手，
// 93.52 他坐在街上，哭着笑看着她；小石头站起来从后面抱着她的腰仰头笑。
// 镜头：一直框住阿满的头顶和街面（看得出离地多高），弹簧跟着（晚一点到）、跟着他们一路往左：往下坠时画面里先掉下去、再跟上，
// 往上升时退开；落下来时推近，「咚」一顶一震，落在三个人身上。
// 三⑤⑥（95.55–99.96，2026-10-20 重排剪掉，代码留着：⑦ 的溶接用到 walkCam / streetClasp）：
// 三⑤「就请你 / 放心大胆更妄为肆意」（95.55–97.98；就请你 95.5–95.97，放心大胆更妄为肆意 95.97 起；96.02 副歌二进来）：
// 镜头从④的整座城一下扎回她们身上，96.02 落定；她们往西回家：她的铁靴一拍一「咚」（96.02、96.52、97.02、97.52），
// 小石头松开她的腿，跟在她后面学她跺脚（晚半拍，每一下膝盖抬得老高、笑着跺下去）；她回头看他，笑了。
// 三⑥「迈步向前别害怕失去」（97.98–99.96；迈步向前别害怕失去 97.98 起；98.02、99.02 重拍）：走着走着，小石头跺完最后一下（98.27），
// 抬头看见天上的白（妈妈飞走的地方），不跺了，脸一下垮下来；脚跟慢慢离了地，脚尖也离了地，跟在后面的那声跺脚没了。
// 她听见身后没声了，99.0 停下、回过身，跑回两步，一把牵住他伸着的手，往下一拽，99.52「咚」他落回地上。两个人牵着手。
// 世界坐标（和第一幕同一条街，街面 y = 0）：在街东头那栋带青绿色铺面的五层楼前面（x 2810–3330）。

import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, kick, ph, shake } from "./cam";
import { ARMS, SMOOTH, live, smoothTrack } from "./motion";
import { CHEN, KID, armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const rotV = (v: V2, a: number): V2 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
/** 三次 Hermite：起点、起点速度、终点、终点速度，d 是这一段多长（秒） */
function herm(p0: number, v0: number, p1: number, v1: number, d: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * d * v0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * d * v1;
}
function herm2(p0: V2, v0: V2, p1: V2, v1: V2, d: number, u: number): V2 {
  return [herm(p0[0], v0[0], p1[0], v1[0], d, u), herm(p0[1], v0[1], p1[1], v1[1], d, u)];
}
/** a 起柔和地涨到 m，再柔和地落到 b */
const bump = (t: number, a: number, m: number, b: number) => (t <= a || t >= b ? 0 : t < m ? E.soft((t - a) / (m - a)) : E.soft((b - t) / (b - m)));

export const PULL_T = {
  /** 第一句「请你等等我」切到街上 */
  start: 89.79,
  /** 她从右边冲进来（一步）→ 89.95 踩实一蹲 → 90.0 蹬地往左上方扑出去 →「等」90.45 在最高点刚往下掉的那一下攥住他的脚踝 */
  plant: 89.95,
  take: 90.0,
  grab: 90.45,
  /** 两个人一起往下坠得最快 */
  fast: 90.68,
  /** 最低（她的靴底离街面还有两百多）；之后浮力赢了，又往上升 */
  low: 91.02,
  /** 又往上升的时候低头看见街面往下掉，吓一跳，又咬着牙抬头 */
  down0: 91.36,
  down1: 91.7,
  /** 第二句「请」小石头从右边跑进来（两步），蹲一下、跳起来，「你」92.25 一把攥住她的铁靴 */
  run0: 91.8,
  crouch: 92.02,
  jump: 92.07,
  hug: 92.25,
  /** 三个人不再往上，「等等我」往下落；小石头先着地、往后蹲着拽 */
  top: 92.36,
  kid: 92.78,
  /** 「咚」她的铁靴砸回街面（重拍） */
  land: beatAt(186),
  /** 她两只手往下一拽，把阿满拽到她左边，松手 → 他脚着地 → 坐在街上（重拍） */
  release: 93.2,
  feet: 93.36,
  sit: beatAt(187),
  /** 切到夜里的屋子（图层 act5 到这里） */
  cut: 94.02,
};
const T = PULL_T;
export const WALK_T = {
  /** 镜头从整座城扎下来 */
  dive: 95.55,
  /** 小石头松开她的腿 */
  let: 95.86,
  /** 她迈第一步（落在副歌二进来那一拍上），一拍一步 */
  step0: beatAt(192),
  end: 97.98,
};
const WK = WALK_T;
export const MISS_T = {
  start: WALK_T.end,
  /** 他跺最后一下、抬头看见白 */
  lastStomp: WALK_T.step0 + 0.25 + 4 * 0.500042,
  look: 98.36,
  /** 脚跟离地 → 脚尖离地，飘起来 */
  tiptoe: 98.6,
  lift: 98.86,
  /** 她听见没声了（又往前走了两步）：停下、回过身、跑回两步、牵住他的手、往下一拽，他「咚」落回地上 */
  stop: 99.1,
  turn: 99.17,
  run1: 99.4,
  grab: 99.45,
  land: beatAt(199),
  end: 99.96,
};
const MS = MISS_T;

const AMAN = CAST.阿满;
const STONE = CAST.小石头穿妈妈的外套;
/** 阿满飘在哪（x） */
const AX = 3010;

// ——— 她攥着的那一点（阿满的脚踝）怎么走：竖直方向按速度曲线积出来，横着被她往左冲的劲儿拖着走 ———
/** 攥住那一刻他的脚踝离地多高（她吊着，靴底离地约 380） */
const GRAB_H = 941;
/** 他一个人往上飘（每秒） */
const RISE = 280;
/**
 * 攥住以后他脚踝往上的速度（每秒，往上为正）：[时刻, 速度, 加速度]，一段段三次 Hermite 接起来（速度、加速度都连续）。
 * 攥住那一下他被一把拽停（往下 40）→ 她的分量压上来，越坠越快 → 他的浮力托住，越坠越慢（往下坠约 110）→
 * 浮力还是赢了，又越升越快 → 小石头攥住她的铁靴：一下停住
 */
const VK: [number, number, number][] = [
  [T.grab, -40, -1700],
  [T.fast, -300, 0],
  [T.low, 0, 300],
  [91.5, 120, 170],
  [92.0, 170, 0],
  [T.hug, 160, -1300],
  [T.top, 0, -1950],
];
function velAt(t: number) {
  for (let i = 1; i < VK.length; i++) {
    const [t1, v1, a1] = VK[i];
    if (t <= t1) {
      const [t0, v0, a0] = VK[i - 1];
      return herm(v0, a0, v1, a1, t1 - t0, (t - t0) / (t1 - t0));
    }
  }
  return 0;
}
const H_DT = 1 / 480;
let H_TAB: Float64Array | null = null;
function heightTab() {
  if (H_TAB) return H_TAB;
  const n = Math.ceil((T.top - T.grab) / H_DT) + 2;
  const tab = new Float64Array(n);
  let h = GRAB_H;
  tab[0] = h;
  for (let i = 1; i < n; i++) {
    h += velAt(T.grab + (i - 0.5) * H_DT) * H_DT;
    tab[i] = h;
  }
  return (H_TAB = tab);
}
/** 往下落那一段（停住 → 「咚」）：h = 停住时的高度 + ½·a·τ² + c·τ³，落地那一刻她的靴底正好贴着街面（小石头着了地往后拽，越落越快） */
let FALL: { h0: number; a0: number; c: number } | null = null;
function fall() {
  if (FALL) return FALL;
  const tab = heightTab();
  const h0 = tab[Math.round((T.top - T.grab) / H_DT)];
  const a0 = VK[VK.length - 1][2];
  const d = T.land - T.top;
  return (FALL = { h0, a0, c: (landH() - h0 - 0.5 * a0 * d * d) / (d * d * d) });
}
/** 她的靴底贴着街面时她攥着的那一点离地多高（按落地那一刻的姿势量） */
let LAND_H: number | null = null;
function landH() {
  if (LAND_H !== null) return LAND_H;
  const j = jointsOf(chenMove(T.land).pose);
  return (LAND_H = 8 - (j.palmL[1] + j.palmR[1]) / 2 + Math.max(j.ankleL[1], j.ankleR[1]) + 46);
}
function hAt(t: number) {
  if (t <= T.grab) return GRAB_H + RISE * (t - T.grab);
  if (t <= T.top) {
    const tab = heightTab();
    const u = (t - T.grab) / H_DT;
    const i = Math.min(tab.length - 2, Math.floor(u));
    return tab[i] + (tab[i + 1] - tab[i]) * (u - i);
  }
  const f = fall();
  const tau = Math.min(t, T.land) - T.top;
  return f.h0 + 0.5 * f.a0 * tau * tau + f.c * tau * tau * tau;
}
/**
 * 横着：她扑过来往左冲的劲儿（她比他沉得多）带着两个人一起往左飘，越飘越慢；小石头扑上来再往左带一点。
 * 一直往左，不来回（用户：「不要摇来摇去，在空中应该惯性所有人都向左飘」）
 */
const DRIFT: [number, number, number][] = [
  // [从什么时候起, 一共往左飘多远, 慢下来的时间常数]：起始速度 = 距离 / 时间常数
  [T.grab, 440, 0.9],
  [T.hug, 60, 0.45],
];
function qxAt(t: number) {
  let x = AX + 6 * Math.sin(Math.min(t, T.grab) * 1.3);
  for (const [t0, d, tau] of DRIFT) if (t > t0) x -= d * (1 - Math.exp(-(t - t0) / tau));
  return x;
}
/**
 * 身子跟着往左飘歪多少：往左飘的速度（攥住那一刻 = 1）慢半拍地跟着（一阶滞后，时间常数 LAG），
 * 从 0 柔和地涨起来、越飘越慢就慢慢回正，不过头、不来回
 */
const LAG = 0.6;
function driftLean(t: number) {
  let k = 0;
  const v0 = DRIFT[0][1] / DRIFT[0][2];
  for (const [t0, d, tau] of DRIFT) {
    const x = t - t0;
    if (x > 0) k += ((d / tau / v0) * tau * (Math.exp(-x / tau) - Math.exp(-x / LAG))) / (tau - LAG);
  }
  return k;
}
/** 她攥着的那一点（阿满的脚踝，世界坐标）：落地以后她两只手往下一拽，把他拽到她左边（松手以后他自己往下掉），脚着地 */
function qAt(t: number): V2 {
  if (t <= T.land) return [qxAt(t), -hAt(t)];
  const p0: V2 = [qxAt(T.land), -hAt(T.land)];
  const e = 1e-3;
  const v0: V2 = [(qxAt(T.land) - qxAt(T.land - e)) / e, (hAt(T.land - e) - hAt(T.land)) / e];
  const p1 = sitAnkle();
  const u = Math.min(1, (t - T.land) / (T.feet - T.land));
  return herm2(p0, v0, p1, [0, 120], T.feet - T.land, u);
}
// ——— 往左飘的时候身子怎么歪：她沉、在前面（下面）带着走，他轻、被拖着，两个人都斜成「/」；按往左飘的快慢歪，越飘越慢就慢慢回正，不来回荡 ———
/** 她的胯在攥住那一刻往哪走（往左扑、刚开始往下掉） */
const HER_V1: V2 = [-650, 80];
/** th：她的身子偏离竖直多少（胯在脚踝右边为正，往左飘时胯在前面：负，最多约 8°）；fa：他的身子绕胯转了多少（脚往左为正，最多约 9°） */
function swingAt(t: number): { th: number; fa: number } {
  if (t <= T.grab) return { th: 0, fa: 0 };
  const k = driftLean(Math.min(t, T.land));
  // 落地以后他的身子慢慢回正
  const after = t > T.land ? Math.exp(-(t - T.land) / 0.2) : 1;
  return { th: -0.3 * k, fa: 0.35 * k * after };
}

// ——— 阿满（朝右，面向她来的方向） ———
const AMAN_P = {
  /** 往上飘：闭着眼，仰着一点头，两只手软软地往上浮，腿垂着、脚尖朝下 */
  飘: pose(-4, { face: 0.45, ground: false, float: 0.12, ...legL(6, -18, -40), ...legR(-8, -26, -44), neck: 14, expression: "闭眼", sad: 0.8 }, (l) => ({
    ...armL(132, 40, 0, "relax", l),
    ...armR(112, 44, 0, "relax", l),
  })),
  /** 被一把拽住：被攥住的那条腿（L）一下拽直，另一条腿蜷上来，腰一折，两只手往上甩，猛地睁眼低头看她 */
  被拽: pose(22, { face: 0.45, ground: false, float: 0.12, ...legL(-2, -2, -30), ...legR(56, -96, -10), neck: -30, expression: "惊", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(164, 24, 0, "open", l),
    ...armR(150, 30, 0, "open", l),
  })),
  /** 低头看着吊在脚下的她，两只手张开稳住 */
  惊: pose(10, { face: 0.45, ground: false, float: 0.12, ...legL(0, -4, -30), ...legR(26, -52, -20), neck: -26, expression: "惊", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(64, 50, 0, "open", l),
    ...armR(128, 38, 0, "open", l),
  })),
  /** 看着她，含着泪，近处那只手朝她伸下来 */
  看她: pose(14, { face: 0.45, ground: false, float: 0.12, ...legL(0, -4, -30), ...legR(16, -40, -24), neck: -32, expression: "含泪", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(18, 14, 0, "open", l),
    ...armR(112, 40, 0, "relax", l),
  })),
  /** 小石头扑上来、三个人往下落：又一沉，两只手往上甩 */
  坠: pose(12, { face: 0.45, ground: false, float: 0.12, ...legL(0, -4, -30), ...legR(40, -76, -14), neck: -22, expression: "惊", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(158, 26, 0, "open", l),
    ...armR(140, 34, 0, "open", l),
  })),
  /** 被拽下来、往后一仰要坐下去：膝盖弯起来，两只手往后撑 */
  跌: pose(-16, { face: 0.45, ground: false, ...legL(120, -120, 0), ...legR(132, -128, 0), neck: 12, expression: "惊", lookX: 0.4, lookY: -0.5 }, (l) => ({
    ...armL(-50, 20, 0, "open", l),
    ...armR(-40, 24, 0, "open", l),
  })),
  /** 坐在街上：膝盖立起来，两只手往后撑着地，仰头看着她 */
  坐: pose(-4, { face: 0.45, ground: false, ...legL(146, -136, 0), ...legR(150, -142, 0), neck: 20, expression: "含泪", lookX: 0.4, lookY: -0.7 }, (l) => ({
    ...armL(-34, 22, 0, "open", l),
    ...armR(-44, 22, 0, "open", l),
  })),
  /** 看着她，哭着笑 */
  笑: pose(-2, { face: 0.45, ground: false, ...legL(146, -136, 0), ...legR(150, -142, 0), neck: 24, expression: "哭着笑", lookX: 0.4, lookY: -0.8 }, (l) => ({
    ...armL(-28, 24, 0, "relax", l),
    ...armR(-40, 22, 0, "open", l),
  })),
};
const amanMove = live(
  [
    { t: 89.7, x: 0, p: AMAN_P.飘 },
    { t: T.grab, p: AMAN_P.飘 },
    { t: T.grab + 0.08, ease: "out", p: AMAN_P.被拽 },
    { t: T.grab + 0.42, ease: "inOut", p: AMAN_P.惊 },
    { t: T.low + 0.16, ease: "inOut", p: AMAN_P.看她 },
    { t: T.hug, p: AMAN_P.看她 },
    { t: T.hug + 0.1, ease: "out", p: AMAN_P.坠 },
    { t: T.land, p: AMAN_P.坠 },
    { t: T.feet, ease: "inOut", p: AMAN_P.跌 },
    { t: T.sit + 0.06, ease: "out", p: AMAN_P.坐 },
    { t: T.sit + 0.4, ease: "inOut", p: AMAN_P.笑 },
  ] as MoveKey[],
  { look: lookOf(AMAN), base: { wind: 0.6 }, idle: true, seed: 101, springs: ARMS, follow: 0 },
);
/** 他坐在她左边哪里（胯的 x） */
const sitX = () => landX() - 300;
function sitRoot(t: number, p: PoseIn): V2 {
  const j = castJoints(AMAN, p);
  return [sitX() - j.hip[0], -45 - j.hip[1]];
}
/** 他坐下以后脚踝在哪（她把他拽下来，脚踝落到这里） */
let SIT_ANKLE: V2 | null = null;
function sitAnkle(): V2 {
  if (SIT_ANKLE) return SIT_ANKLE;
  const p = amanMove(T.sit + 0.06).pose;
  const r = sitRoot(T.sit + 0.06, p);
  const j = castJoints(AMAN, p);
  return (SIT_ANKLE = [r[0] + j.ankleL[0], r[1] + j.ankleL[1]]);
}
function amanAt(t: number) {
  const p: PoseIn = { ...amanMove(t).pose };
  const j = castJoints(AMAN, p);
  const q = qAt(t);
  // 身子绕胯转：被她拽歪的（单摆算的），落地以后被拽下来往后一仰
  let phi = swingAt(t).fa;
  phi -= 0.3 * E.io(ph(t, T.land + 0.05, T.feet));
  // 脚踝（L）钉在她攥着的那一点上
  const leg = rotV([j.ankleL[0] - j.hip[0], j.ankleL[1] - j.hip[1]], phi);
  let hip: V2 = [q[0] - leg[0], q[1] - leg[1]];
  // 脚着地以后一屁股坐下（越落越快）
  const k = E.in2(ph(t, T.feet - 0.1, T.sit));
  if (k > 0) {
    const sr = sitRoot(t, p);
    hip = mix(hip, [sr[0] + j.hip[0], sr[1] + j.hip[1]], k);
    phi *= 1 - k;
  }
  // 鞋底不进地面
  const lowest = Math.max(...[j.ankleL, j.ankleR].map((a) => hip[1] + rotV([a[0] - j.hip[0], a[1] - j.hip[1]], phi)[1] + 26));
  if (lowest > 0) hip = [hip[0], hip[1] - lowest];
  const root: V2 = [hip[0] - j.hip[0], hip[1] - j.hip[1]];
  const head = rotV([j.head[0] - j.hip[0], j.head[1] - j.hip[1]], phi);
  // 取景要框住的点（头、两只手、两只脚）
  const pts = [j.head, j.palmL, j.palmR, j.ankleL, j.ankleR].map((v) => {
    const r = rotV([v[0] - j.hip[0], v[1] - j.hip[1]], phi);
    return [hip[0] + r[0], hip[1] + r[1]] as V2;
  });
  return { pose: p, root, hip, phi, ankle: q, pts, top: hip[1] + head[1] - 90, lift: Math.max(0, -Math.min(0, lowest)) };
}

// ——— 她：冲进来、扑上去攥住他的脚踝，吊着荡，「咚」落回街面，把他拽下来 ———
const CHEN_P = {
  /** 踩实一蹲（拉满的弓）：膝盖弯下去、身子往前压，两手甩到身后，仰着头盯住他的脚踝 */
  蹲: pose(26, { face: -0.8, ground: false, ...legR(52, -74), ...legL(40, -66), neck: 44, expression: "使劲", teeth: 0.4, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(-56, 24, 10, "open", l),
    ...armR(-44, 28, 8, "open", l),
  })),
  /** 跳起来：两只手往上够 */
  跳: pose(-8, { face: -0.6, ground: false, ...legR(36, -64), ...legL(8, -20, 26), neck: 30, expression: "使劲", lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(168, 12, 0, "open", l),
    ...armR(158, 22, 0, "open", l),
  })),
  /** 够到最高：整个人抻直，两只手伸到头顶，腿甩在身后 */
  够: pose(-10, { face: -0.4, ground: false, ...legR(-12, -34, 20), ...legL(14, -52, 30), neck: 12, expression: "使劲", teeth: 0.3, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(178, 4, 0, "open", l),
    ...armR(170, 8, 0, "open", l),
  })),
  /** 两个人一起往下坠：腿被甩得往上蜷，咬着牙仰头看他 */
  坠: pose(-2, { face: -0.4, ground: false, ...legR(44, -78, 10), ...legL(24, -60, 16), neck: 12, expression: "使劲", teeth: 0.5, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 吊在他脚踝上：两只手攥着，身子直直地垂着，铁靴悬空，咬着牙仰头 */
  吊: pose(-4, { face: -0.4, ground: false, ...legR(16, -26, 10), ...legL(-6, -14, 16), neck: 6, expression: "使劲", teeth: 0.4, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 越坠越慢：伸直腿、脚尖往下够街面，低头盯着脚下 */
  够地: pose(-2, { face: -0.4, ground: false, ...legR(4, -4, -34), ...legL(-6, -2, -38), neck: -16, expression: "使劲", teeth: 0.6, lookX: -0.1, lookY: 1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 吊着乱蹬：一条腿蜷上来、一条蹬下去（两套换着来） */
  蹬A: pose(-4, { face: -0.4, ground: false, ...legR(40, -74, 0), ...legL(-14, -10, 24), neck: 6, expression: "使劲", teeth: 0.5, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  蹬B: pose(-4, { face: -0.4, ground: false, ...legR(-8, -16, 20), ...legL(34, -70, 0), neck: 6, expression: "使劲", teeth: 0.5, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 低头看见街面往下掉：吓一跳，腿缩起来 */
  往下看: pose(4, { face: -0.4, ground: false, ...legR(30, -60, 0), ...legL(22, -54, 6), neck: -26, expression: "吓一跳", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 小石头抱住她的腿：低头回过去看他 */
  看他: pose(2, { face: -0.4, ground: false, ...legR(14, -20, 0), ...legL(-4, -12, 6), neck: -24, expression: "惊", lookX: 0.6, lookY: 1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 往下落：腿伸下去等着落地 */
  落前: pose(-2, { face: -0.4, ground: false, ...legR(22, -32, 0), ...legL(6, -20, 4), neck: 16, expression: "使劲", teeth: 0.4, lookX: -0.1, lookY: -0.6 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 落地：膝盖一弯蹲下去，身子直着，两只手还举着攥住他的脚踝（落地那一刻根按姿势里两只手的位置算：身子一弯、手往前，人就往旁边窜） */
  落: pose(5, { face: -0.5, ground: false, ...legR(64, -100), ...legL(38, -80), neck: 22, expression: "使劲", teeth: 0.3, lookX: -0.1, lookY: -0.9 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 站起来、两只手往下一拽（姿势里的手是垂着的：IK 一撤就是这样） */
  拽下: pose(22, { face: -0.6, ground: false, ...legR(34, -44), ...legL(8, -24), neck: -10, expression: "使劲", teeth: 0.5, lookX: -0.5, lookY: 0.6 }, (l) => ({
    ...armL(30, 30, 0, "relax", l),
    ...armR(24, 34, 0, "relax", l),
  })),
  /** ⑥ 跑回来伸手够他（朝右）：近处那只手往前上方伸 */
  牵: pose(10, { face: 0.8, ...legR(30, -20), ...legL(-20, -24), neck: 20, expression: "担心", lookX: 0.4, lookY: -0.8 }, (l) => ({
    ...armL(130, 20, 0, "grip", l),
    ...armR(20, 30, 0, "relax", l),
  })),
  /** 往下一拽：身子往后坐 */
  拽: pose(-12, { face: 0.8, ...legR(30, -40), ...legL(-10, -30), neck: 10, expression: "使劲", lookX: 0.4, lookY: -0.4 }, (l) => ({
    ...armL(80, 30, 0, "grip", l),
    ...armR(-10, 30, 0, "relax", l),
  })),
  /** 站住牵着他，低头看着他，笑了一点 */
  牵站: pose(4, { face: 0.8, ...legR(8, -6), ...legL(-6, -4), neck: -14, expression: "微笑", smile: 0.5, lookX: 0.4, lookY: 0.6 }, (l) => ({
    ...armL(40, 30, 0, "grip", l),
    ...armR(-6, 20, 0, "relax", l),
  })),
  /** 站住：低头看着坐在地上的他，松一口气 */
  站: pose(6, { face: -0.6, ground: false, ...legR(12, -10), ...legL(-8, -6), neck: -12, expression: "微笑", smile: 0.45, lookX: -0.6, lookY: 0.6 }, (l) => ({
    ...armL(-6, 24, 0, "relax", l),
    ...armR(-10, 20, 0, "relax", l),
  })),
};
/** ⑤ 她走（朝左，按第一幕那套走法：落地 → 下沉 → 经过 → 蹬地，一拍一步） */
const WALK: [number, Angles, number][] = [
  [0, CHEN.走_落地, 0.03],
  [0.2, CHEN.走_下沉, 0.05],
  [0.48, CHEN.走_经过, 0],
  [0.74, CHEN.走_蹬地, 0],
];
function walkHome(): MoveKey[] {
  const out: MoveKey[] = [];
  for (let i = 0; i < 7; i++) {
    const foot = i % 2 === 0 ? "L" : "R";
    const prev = foot === "L" ? "R" : "L";
    // 第二步起回头看他（头往右后方转、笑），后面几步转回来看前面（⑥ 他在后面停下了，她还往前走了两步）
    const look = i >= 1 && i <= 3 ? { headTurn: 0.75, expression: "笑", lookX: 0.6, lookY: 0.3, neck: -2 } : { expression: "微笑", lookX: -0.5, lookY: 0 };
    for (const [at, q, squash] of WALK) {
      const t = WK.step0 + (i + at) * 0.500042;
      const p = foot === "L" ? q : swapSides(q);
      out.push({ t, ease: SMOOTH, squash, plant: at === 0 ? prev : foot, p: { ...p, ...look } } as MoveKey);
    }
  }
  return out;
}
/**
 * 她从右边冲进来（朝左）：切过来已经在跑，最后一步 L 在 T.plant 落地。跑的根匀速走（每秒 HER_RUN_V），
 * 一步多长按姿势表里站着那只脚往后挪多少反算（落地到蹬地这 0.38 步里脚相对胯往后挪约 125）——一步 0.24 秒、每秒 1300，脚不滑
 * （原来一步 0.16 秒，脚在街面上往前滑；用户：「脚步和地面移动不对齐」）
 */
const HER_RUN_STEP = 0.24;
const HER_RUN_V = 1300;
function herRunIn(): MoveKey[] {
  const out: MoveKey[] = [];
  const C: [number, Angles][] = [
    [0, CHEN.跑_落地],
    [0.19, CHEN.跑_踩实],
    [0.38, CHEN.跑_蹬地],
    [0.68, CHEN.跑_腾空],
  ];
  // 第 k 步在 T.plant + k·一步 落地（k = −2、−1 两整步，0 是最后落地的那一下）；k 是偶数时 L 落地
  for (let k = -2; k <= 0; k++)
    for (const [at, q] of C) {
      if (k === 0 && at > 0) break;
      const p = (k % 2 === 0 ? q : swapSides(q)) as Angles;
      out.push({ t: T.plant + (k + at) * HER_RUN_STEP, ease: SMOOTH, p: { ...p, neck: 22, expression: "使劲", lookX: -0.2, lookY: -0.9 } } as MoveKey);
    }
  out[0] = { ...out[0], x: 0, items: { bricks: 2 } } as MoveKey;
  return out;
}
const chenMove = live(
  [
    // 从右边冲进来（一步，朝左），踩实一蹲，蹬地往左上方扑出去，够到最高
    ...herRunIn(),
    // 踩实一蹲：落地的那只脚（L）钉住，身子顺着冲劲往前压下去
    { t: T.plant + 0.04, ease: "out", plant: "L", p: CHEN_P.蹲 },
    { t: T.take + 0.12, ease: "out", p: CHEN_P.跳 },
    { t: T.grab - 0.03, ease: "inOut", p: CHEN_P.够 },
    // 攥住：两个人一起往下坠，腿被甩得往上蜷
    { t: T.grab + 0.14, ease: "out", p: CHEN_P.坠 },
    // 越坠越慢：伸直腿、脚尖往下够街面，低头盯着脚下（差一点）
    { t: T.low - 0.1, ease: "inOut", p: CHEN_P.够地 },
    { t: T.low + 0.16, p: CHEN_P.够地 },
    // 又被带上去：低头看见街面往下掉，吓一跳，腿缩起来；再咬着牙抬头看他，腿乱蹬
    { t: T.down0 + 0.12, ease: "out", p: CHEN_P.往下看 },
    { t: T.down1, p: CHEN_P.往下看 },
    { t: T.down1 + 0.18, ease: "inOut", p: CHEN_P.蹬A },
    { t: T.down1 + 0.4, ease: "inOut", p: CHEN_P.蹬B },
    { t: T.hug - 0.04, ease: "inOut", p: CHEN_P.吊 },
    // 小石头抱住她的腿：低头回过去看他；往下落：腿伸下去等着落地
    { t: T.hug + 0.1, ease: "out", p: CHEN_P.看他 },
    { t: T.land - 0.05, ease: "inOut", p: CHEN_P.落前 },
    // 「咚」：膝盖一弯蹲下去（铁靴砸回街面）
    { t: T.land + 0.07, ease: "out", squash: 0.06, p: CHEN_P.落 },
    // 站起来，两只手往下一拽，把阿满拽到她左边；松手，手垂下来，低头看着他，松一口气
    { t: T.release, ease: "inOut", squash: 0, p: CHEN_P.拽下 },
    { t: T.sit, ease: "inOut", p: { ...CHEN_P.站, expression: "使劲", smile: 0 } },
    { t: T.sit + 0.3, ease: "inOut", p: CHEN_P.站 },
    // ⑤ 往西回家：一拍一步（铁靴「咚」），第二步起回头看跟在后面跺脚的小石头，笑了
    { t: WK.step0 - 0.3, plant: "R", p: CHEN_P.站 },
    ...walkHome(),
    // ⑥ 听见身后没声了：停下（脚落稳）、扭头 → 转过身（朝右，快：过正面那一下在转身里）→ 跑回两步 → 伸手牵住他 → 往下一拽 → 站住牵着他
    { t: MS.stop, ease: "out", plant: "L", p: { ...CHEN.站, headTurn: 0.8, expression: "担心", lookX: 0.7, lookY: -0.2 } },
    { t: MS.turn, ease: "inOut", p: { ...swapSides(CHEN.跑_蹬地), face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.4 } },
    { t: MS.turn + 0.08, ease: SMOOTH, p: { ...CHEN.跑_腾空, face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.5 } },
    { t: MS.turn + 0.16, ease: SMOOTH, p: { ...swapSides(CHEN.跑_落地), face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.5 } },
    { t: MS.run1, ease: "inOut", p: CHEN_P.牵 },
    { t: MS.land, ease: "out", p: CHEN_P.拽 },
    { t: MS.land + 0.3, ease: "inOut", p: CHEN_P.牵站 },
    { t: 102, p: CHEN_P.牵站 },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0.6, chestL: "under", chestR: "under" }, idle: true, seed: 103, springs: ARMS, follow: 0 },
);
/** 跑进来（往左，匀速）→ 踩实一蹲（落地那只脚钉住，根跟着脚走） */
const runX = (t: number): number =>
  t <= T.plant ? AX + 600 - HER_RUN_V * (t - T.start) : runX(T.plant) + chenMove(Math.min(t, T.take)).x - chenMove(T.plant).x;
/** 吊着的根：两只手在他的脚踝上（根 = 脚踝 − 姿势里两只手的位置） */
function hangRoot(p: PoseIn, q: V2): V2 {
  const j = jointsOf(p);
  return [q[0] + 6 - (j.palmL[0] + j.palmR[0]) / 2, q[1] + 8 - (j.palmL[1] + j.palmR[1]) / 2];
}
/** 扑上去（胯的路线，三次 Hermite）：从蹬地那一点往左上方冲出去（高约 470），越升越慢，在最高点刚往下掉的时候攥住 */
let JUMP: { p0: V2; p1: V2 } | null = null;
function jumpHip(t: number): V2 {
  if (!JUMP) {
    const p0 = chenMove(T.take).pose;
    const j0 = jointsOf(p0);
    const g0 = -(Math.max(j0.ankleL[1], j0.ankleR[1]) + 46);
    const p1 = chenMove(T.grab).pose;
    const r1 = hangRoot(p1, qAt(T.grab));
    const j1 = jointsOf(p1);
    JUMP = { p0: [runX(T.take) + j0.hip[0], g0 + j0.hip[1]], p1: [r1[0] + j1.hip[0], r1[1] + j1.hip[1]] };
  }
  const d = T.grab - T.take;
  return herm2(JUMP.p0, [-900, -2000], JUMP.p1, HER_V1, d, ph(t, T.take, T.grab));
}
/** 跑的时候根的高度：最后落地那一下（跑_落地）落地的那只脚正好贴着街面 */
let RUN_Y: number | null = null;
function runY() {
  if (RUN_Y === null) {
    const j = jointsOf(chenMove(T.plant).pose);
    RUN_Y = -(Math.max(j.ankleL[1], j.ankleR[1]) + 46);
  }
  return RUN_Y;
}
/** 她落地的地方（x）：落地前一刻吊着的位置 */
let LAND_X: number | null = null;
const landX = () => (LAND_X ??= chenAt(T.land - 1e-4, amanAt(T.land - 1e-4)).root[0]);
/** ⑤⑥（已剪掉）她回家的起点：按原来落地的地方（⑦ 的溶接要用，别跟着③变） */
const HOME_X = 3179.412;
/** ⑥ 她跑回去多远：跑到离他一臂远（停下那一刻算一次） */
let RUN_BACK: number | null = null;
function chenAt(t: number, aman: ReturnType<typeof amanAt>) {
  const p: PoseIn = { ...chenMove(t).pose };
  if (t > T.grab && t < T.land) {
    // 往左飘：她在前面（下面）带着走，身子斜过去一点（胯在攥着的手左边）；落地前站直
    const k = 1 - E.io(ph(t, T.land - 0.32, T.land - 0.02));
    p.rot = ((p.rot as number | undefined) ?? 0) - swingAt(t).th * k;
  }
  const j0 = jointsOf(p);
  const q = aman.ankle;
  const sole = Math.max(j0.ankleL[1], j0.ankleR[1]) + 46;
  const ground = -sole;
  let root: V2;
  // 跑的时候根的高度不动（跑的姿势表里有 lift：落地沉一点、腾空抬起来）；按「最低那只脚贴地」算的话腾空那一下也被按回地上，
  // 往前摆的脚贴着街面滑过去
  if (t < T.plant) root = [runX(t), runY()];
  else if (t < T.take) root = [runX(t), ground];
  else if (t < T.grab) {
    const h = jumpHip(t);
    root = [h[0] - j0.hip[0], h[1] - j0.hip[1]];
  } else if (t < T.land) root = hangRoot(p, q);
  else if (t < WK.dive) root = [landX(), ground];
  else root = [HOME_X + chenMove(t).x - chenMove(T.take).x, ground];
  // 靴底不进地面
  if (root[1] > ground) root = [root[0], ground];
  const loc = (v: V2): V2 => [v[0] - root[0], v[1] - root[1]];
  // 两只手攥着他的脚踝；落地以后把他拽下来，快到地上就松开。两只手一左一右按姿势里的样子分开一点（近处那只在脸前面靠左），
  // 都往一点上够的话近处那只胳膊横过她的脸
  const grip = E.io(ph(t, T.grab - 0.06, T.grab));
  const letGo = E.io(ph(t, T.release, T.release + 0.16));
  const hand: V2 = [q[0] + 6, q[1] + 8];
  const pm: V2 = [(j0.palmL[0] + j0.palmR[0]) / 2, (j0.palmL[1] + j0.palmR[1]) / 2];
  const spread = (v: number[]): V2 => [hand[0] + 0.5 * (v[0] - pm[0]), hand[1] + 0.5 * (v[1] - pm[1])];
  p.armL = { ...(p.armL as object), to: loc(spread(j0.palmL)), ik: grip * (1 - letGo) } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc(spread(j0.palmR)), ik: grip * (1 - letGo) } as PoseIn["armR"];
  // ⑥ 跑回两步（根往右挪），近处那只手牵住他的手（朝右的人整套镜像：IK 目标 x 取反）
  if (t >= MS.turn) {
    RUN_BACK ??= Math.max(60, stoneFreeRoot(MS.turn, 0)[0] - (HOME_X + chenMove(MS.turn).x - chenMove(T.take).x) - 235);
    root = [root[0] + RUN_BACK * E.io(ph(t, MS.turn, MS.run1 + 0.02)), root[1]];
    const w = E.io(ph(t, MS.run1 - 0.12, MS.grab));
    if (w > 0.001) {
      const cl = claspAt(t);
      const face = (p.face as number | undefined) ?? 0;
      p.armL = { ...(p.armL as object), to: [(face > 0 ? -1 : 1) * (cl[0] - root[0]), cl[1] - root[1]], ik: w } as PoseIn["armL"];
    }
  }
  const j = jointsOf(p);
  const at = (v: number[]): V2 => [root[0] + v[0], root[1] + v[1]];
  return { pose: p, root, hip: at(j.hip), ankle: at(j.ankleR), ankleL: at(j.ankleL), knee: at(j.kneeR), sole: -root[1] - sole, top: root[1] + j.head[1] - 80 };
}

// ——— 小石头：从右边跑过来，蹲一下、跳起来两只手攥住她的铁靴，吊在她下面；先着地，往后蹲着拽；她落地以后站起来从后面抱着她的腰，仰头冲她笑 ———
/** 跑的一步：[几分之几步, 姿势, 抬多高]（和前奏一样：蹬地、腾空时整个人离地，往前摆的脚不贴着街面滑） */
const KRUN: [number, Angles, number][] = [
  [0, KID.跑_落地 as Angles, 0],
  [0.22, KID.跑_下沉 as Angles, 0],
  [0.5, KID.跑_蹬地 as Angles, 8],
  [0.76, KID.跑_腾空 as Angles, 20],
];
const STONE_P = {
  /** 跑到她底下一蹲：仰头盯着她的铁靴 */
  蹲: pose(24, { face: -0.85, ...legR(56, -82), ...legL(44, -72), neck: 30, expression: "使劲", lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(-50, 30, 0, "open", l),
    ...armR(-40, 30, 0, "open", l),
  })),
  /** 跳起来：两只手往上够，腿蜷起来 */
  跳: pose(-4, { face: -0.7, ground: false, ...legR(40, -70), ...legL(10, -30, 20), neck: 30, expression: "使劲", lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(166, 14, 0, "open", l),
    ...armR(156, 20, 0, "open", l),
  })),
  /** 吊在她的铁靴上：两只手举过头攥着，腿垂着，咬着牙 */
  吊: pose(-2, { face: -0.5, ground: false, ...legR(22, -34, -10), ...legL(-6, -20, -14), neck: 22, expression: "使劲", teeth: 0.5, lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(172, 6, 0, "grip", l),
    ...armR(164, 10, 0, "grip", l),
  })),
  /** 着地：往后蹲着拽（两只手还攥着她的铁靴往下拉） */
  蹲拽: pose(-14, { face: -0.6, ground: false, ...legR(84, -128), ...legL(66, -116), neck: 16, expression: "使劲", teeth: 0.6, lookX: -0.3, lookY: -0.8 }, (l) => ({
    ...armL(110, 20, 0, "grip", l),
    ...armR(100, 24, 0, "grip", l),
  })),
  /** 站在她身后抱着她的腰，仰起头冲她笑 */
  笑: pose(-6, { face: -0.6, ground: false, ...legR(10, -8), ...legL(-8, -6), neck: 26, expression: "笑", lookX: -0.4, lookY: -0.9 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(60, 70, 0, "grip", l),
  })),
};
// 跑（和前奏那套一样：站着的那只脚钉在地上，根跟着脚走，不滑）：一步 0.13 秒，最后一步在 T.crouch 落地。
// 五步：从画面右边外面跑进来（三步的话起跑时已经在画面里，一下子冒出来；用户：「这里小石头是突然出现在屏幕里的」）
const KID_STEP = 0.13;
const KID_N = 5;
/** 他开始跑（之前站在画面右边外面） */
const KID_RUN0 = T.crouch - KID_N * KID_STEP;
const stoneKeys: MoveKey[] = [];
{
  for (let k = 0; k <= KID_N; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    const prev = k % 2 === 0 ? "R" : "L";
    for (const [at, q, lift] of KRUN) {
      if (k === KID_N && at > 0) break;
      const r = (foot === "L" ? q : swapSides(q)) as Angles;
      const t = T.crouch - (KID_N - k - at) * KID_STEP;
      stoneKeys.push({ t, ease: SMOOTH, plant: k === 0 && at === 0 ? undefined : at === 0 ? prev : foot, p: { ...r, lift, face: -0.85, expression: "使劲", lookX: -0.6, lookY: -0.6 } } as MoveKey);
    }
  }
  stoneKeys[0] = { ...stoneKeys[0], x: 0 } as MoveKey;
}
// 一蹲：落地的那只脚（L，KID_N 是奇数时换 R）钉住
stoneKeys.push({ t: T.jump - 0.01, ease: "out", plant: KID_N % 2 === 0 ? "L" : "R", p: STONE_P.蹲 });
stoneKeys.push({ t: T.jump + 0.1, ease: "out", p: STONE_P.跳 });
stoneKeys.push({ t: T.hug + 0.04, ease: "inOut", p: STONE_P.吊 });
stoneKeys.push({ t: T.kid - 0.02, p: STONE_P.吊 });
stoneKeys.push({ t: T.kid + 0.12, ease: "out", squash: 0.06, p: STONE_P.蹲拽 });
stoneKeys.push({ t: T.land + 0.06, squash: 0, p: STONE_P.蹲拽 });
stoneKeys.push({ t: T.land + 0.36, ease: "inOut", p: STONE_P.笑 });
stoneKeys.push({ t: T.sit, p: STONE_P.笑 });
// ⑤ 松开她的腿，跟在她后面学她跺脚：晚她半拍，膝盖抬得老高、笑着跺下去（一步一拍）
const STOMP = {
  站: pose(0, { face: -0.85, ...legR(6, -6), ...legL(-6, -4), neck: 10, expression: "笑", lookX: -0.4, lookY: -0.3 }, (l) => ({
    ...armL(-10, 30, 0, "fist", l),
    ...armR(10, 30, 0, "fist", l),
  })),
  抬: pose(-6, { face: -0.85, ...legR(96, -110, 10), ...legL(-4, -6), neck: 16, expression: "笑", lookX: -0.4, lookY: -0.5 }, (l) => ({
    ...armL(70, 70, 0, "fist", l),
    ...armR(-50, 60, 0, "fist", l),
  })),
  跺: pose(6, { face: -0.85, ...legR(22, -8, 0), ...legL(-18, -12), neck: 2, expression: "笑", teeth: 0.2, lookX: -0.4, lookY: 0.2 }, (l) => ({
    ...armL(-30, 40, 0, "fist", l),
    ...armR(30, 40, 0, "fist", l),
  })),
};
stoneKeys.push({ t: WK.let + 0.12, ease: "inOut", plant: "L", p: STOMP.站 });
for (let i = 0; i < 5; i++) {
  const t0 = WK.step0 + 0.25 + i * 0.500042;
  const sw = i % 2 === 1;
  const q = (a: Angles) => (sw ? swapSides(a) : a) as Angles;
  const stand = sw ? "R" : "L";
  const lead = sw ? "L" : "R";
  // 膝盖慢慢抬到最高（0.2 秒）→ 猛地跺下去（0.08 秒，蹲一下）→ 重心换到跺下去的那只脚
  stoneKeys.push({ t: t0 - 0.1, ease: "out", plant: stand, p: q(STOMP.抬) });
  stoneKeys.push({ t: t0, ease: "in", plant: stand, squash: 0.07, p: q(STOMP.跺) });
  stoneKeys.push({ t: t0 + 0.1, ease: "out", plant: lead, squash: 0, p: q(STOMP.跺) });
}
// ⑥ 抬头看见白（妈妈飞走的地方）→ 脸垮下来 → 踮起脚（脚跟离地）→ 脚尖也离了地，两只手慢慢往上张开 → 被她牵住、往下一拽落地 → 牵着她的手，含着泪笑
const FLOAT = {
  看: pose(-4, { face: -0.6, ...legR(10, -6), ...legL(-8, -6), neck: 32, expression: "难过", sad: 0.8, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(-6, 20, 0, "relax", l),
    ...armR(6, 20, 0, "relax", l),
  })),
  踮: pose(-6, { face: -0.6, ...legR(6, -4, 34), ...legL(-8, -6, 38), neck: 34, expression: "含泪", tears: 0.6, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(20, 30, 0, "relax", l),
    ...armR(30, 30, 0, "relax", l),
  })),
  飘: pose(-6, { face: -0.6, ground: false, float: 0.25, ...legR(10, -24, -40), ...legL(-6, -18, -44), neck: 32, expression: "含泪", tears: 0.8, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(78, 18, 0, "open", l),
    ...armR(140, 24, 0, "open", l),
  })),
  落: pose(10, { face: -0.6, ...legR(30, -40), ...legL(10, -30), neck: 0, expression: "吓一跳", tears: 0.8, lookX: 0.5, lookY: -0.4 }, (l) => ({
    ...armL(90, 20, 0, "grip", l),
    ...armR(20, 30, 0, "open", l),
  })),
  牵: pose(-2, { face: -0.6, headTurn: 0.85, ...legR(8, -6), ...legL(-6, -4), neck: 20, expression: "哭着笑", lookX: 0.5, lookY: -0.8 }, (l) => ({
    ...armL(70, 20, 0, "grip", l),
    ...armR(-6, 20, 0, "relax", l),
  })),
};
stoneKeys.push({ t: MS.look, ease: "inOut", plant: "L", p: FLOAT.看 });
stoneKeys.push({ t: MS.tiptoe + 0.2, ease: "inOut", plant: "L", p: FLOAT.踮 });
stoneKeys.push({ t: MS.lift + 0.3, ease: "inOut", p: FLOAT.飘 });
stoneKeys.push({ t: MS.grab, p: FLOAT.飘 });
stoneKeys.push({ t: MS.land, ease: "in", p: FLOAT.落 });
stoneKeys.push({ t: MS.land + 0.3, ease: "inOut", p: FLOAT.牵 });
stoneKeys.push({ t: 102, p: FLOAT.牵 });
const stoneMove = live(stoneKeys, { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 105, springs: ARMS, follow: 0 });
/** 他攥着的地方：她两只铁靴的靴口中间 */
const bootsOf = (c: ReturnType<typeof chenAt>): V2 => [(c.ankle[0] + c.ankleL[0]) / 2, (c.ankle[1] + c.ankleL[1]) / 2 + 10];
/** 吊着的根：两只手在她的铁靴上，人在她靴子右后方一点（根 = 攥着的地方 − 姿势里两只手的位置） */
function boyHangRoot(p: PoseIn, c: ReturnType<typeof chenAt>): V2 {
  const j = castJoints(STONE, p);
  const b = bootsOf(c);
  return [b[0] + 30 - (j.palmL[0] + j.palmR[0]) / 2, b[1] - (j.palmL[1] + j.palmR[1]) / 2];
}
/** 攥住那一刻吊着的根和它的速度（跳起来的路线对准它） */
let BOY_HANG: { p: V2; v: V2 } | null = null;
function boyHang0() {
  if (BOY_HANG) return BOY_HANG;
  const e = 0.01;
  const p = stoneMove(T.hug).pose;
  const a = boyHangRoot(p, chenAt(T.hug, amanAt(T.hug)));
  const b = boyHangRoot(p, chenAt(T.hug - e, amanAt(T.hug - e)));
  return (BOY_HANG = { p: a, v: [(a[0] - b[0]) / e, (a[1] - b[1]) / e] });
}
/**
 * 跑过来：在她底下右边 110 那一点蹬地；之前的位置按钉在地上的脚倒推（live 按没缩放的骨架算根挪多少，他按 STONE.scale 画，要乘上）
 */
const boyRunX = (t: number) => boyHang0().p[0] + 110 + (stoneMove(Math.min(t, T.jump)).x - stoneMove(T.jump).x) * STONE.scale;
/** 跳起来（根的路线，三次 Hermite）：往左上方蹿起来，正好攥住她的铁靴，带着往左的劲儿 */
function boyJump(t: number, groundY: number): V2 {
  const h = boyHang0();
  return herm2([boyRunX(T.jump), groundY], [-600, -900], h.p, [h.v[0] - 150, h.v[1]], T.hug - T.jump, ph(t, T.jump, T.hug));
}
/** 跑的时候根的高度：最后落地那一下（跑_落地）落地的那只脚正好贴着街面 */
let KID_RUN_Y: number | null = null;
function kidRunY() {
  if (KID_RUN_Y === null) {
    const j = castJoints(STONE, stoneMove(T.crouch).pose);
    KID_RUN_Y = -(Math.max(j.ankleL[1], j.ankleR[1]) + 18);
  }
  return KID_RUN_Y;
}
/** 他着地的那一刻（吊在她靴子上往下落，脚先碰到街面）和那时站在哪 */
let KID_DOWN: { t: number; x: number } | null = null;
function kidDown() {
  if (KID_DOWN) return KID_DOWN;
  KID_DOWN = { t: T.land, x: 0 };
  for (let t = T.top; t < T.land; t += 1 / 240) {
    const p = stoneMove(t).pose;
    const j = castJoints(STONE, p);
    const r = boyHangRoot(p, chenAt(t, amanAt(t)));
    if (r[1] + Math.max(j.ankleL[1], j.ankleR[1]) + 18 >= 0) {
      KID_DOWN = { t, x: r[0] };
      break;
    }
  }
  return KID_DOWN;
}
/** ⑤⑥（已剪掉）小石头松开她的腿那一刻站在哪：按原来的位置（⑦ 的溶接要用，别跟着③变） */
const STONE_LET = 3176.944;
function stoneAt(t: number, chen: ReturnType<typeof chenAt>): { pose: PoseIn; root: V2; lift: number } {
  const p: PoseIn = { ...stoneMove(t).pose };
  const k = STONE.scale;
  const j0 = castJoints(STONE, p);
  const sole = Math.max(j0.ankleL[1], j0.ankleR[1]) + 18;
  const groundY = -sole;
  let root: V2;
  // 跑的时候根的高度不动（姿势里的 lift 让他腾空）；按「最低那只脚贴地」算会把腾空按回地上
  if (t < T.crouch) root = [boyRunX(t), kidRunY()];
  else if (t < T.jump) root = [boyRunX(t), groundY];
  else if (t < T.hug) root = boyJump(t, groundY);
  else root = boyHangRoot(p, chen);
  // 着地以后往后退一步、蹲下去拽（她的靴子落在他左边，不砸在他身上）
  const kd = kidDown();
  const down = t >= T.hug && t >= kd.t;
  if (down) root = [kd.x + 120 * E.out(ph(t, kd.t, kd.t + 0.2)), groundY];
  if (root[1] > groundY) root = [root[0], groundY];
  // 两只手：攥着她的铁靴；她落地以后站起来，从后面抱住她的腰
  const boots = bootsOf(chen);
  const hold = mix(boots, [chen.hip[0] + 16, chen.hip[1] + 30], E.io(ph(t, T.land + 0.05, T.land + 0.36)));
  // ⑤ 松开她的腿以后自己走（脚钉在地上走，起点是松开那一刻的位置）；⑥ 飘起来、被她拽下来
  if (t >= WK.let) root = stoneFreeRoot(t, groundY);
  // 两只手攥着她的铁靴 / 环在她腰上（⑤ 松开）
  const w = E.io(ph(t, T.jump + 0.05, T.hug)) * (1 - E.io(ph(t, WK.let - 0.06, WK.let + 0.12)));
  const face = (p.face as number | undefined) ?? 0;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / k, (q[1] - root[1]) / k];
  p.armL = { ...(p.armL as object), to: loc([hold[0] - 12, hold[1] + 4]), ik: w, chest: "over" } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc([hold[0] + 10, hold[1] - 4]), ik: w } as PoseIn["armR"];
  // ⑥ 被她牵住的那只手（近处那只）跟着两只手牵着的地方走
  if (t >= MS.grab) p.armL = { ...(p.armL as object), to: loc(claspAt(t)), ik: 1, chest: "over" } as PoseIn["armL"];
  return { pose: p, root, lift: Math.max(0, groundY - root[1]) };
}
/** ⑥ 他飘起来多高（鞋底离地）：脚尖离地以后越飘越快，被她牵住往下一拽，「咚」落回地上 */
const stoneLift = (t: number) => (t < MS.lift ? 0 : t < MS.grab ? 170 * E.in2(ph(t, MS.lift, MS.grab)) : 170 * (1 - E.in2(ph(t, MS.grab, MS.land))));
/** 他松开她的腿以后的根（不靠她的位置算）：脚钉在地上走，⑥ 飘起来 */
function stoneFreeRoot(t: number, groundY: number): V2 {
  return [STONE_LET + 70 * E.io(ph(t, WK.let, WK.let + 0.3)) + stoneMove(t).x - stoneMove(WK.let).x, groundY - stoneLift(t)];
}
/** ⑥ 两只手牵着的地方：牵住以前就是他往上张开的近处那只手；牵住以后跟着往下一拽，落在两个人中间 */
function claspAt(t: number): V2 {
  const at = (tt: number): V2 => {
    const p: PoseIn = { ...stoneMove(tt).pose };
    const j = castJoints(STONE, p);
    const groundY = -(Math.max(j.ankleL[1], j.ankleR[1]) + 18);
    const r = stoneFreeRoot(tt, groundY);
    return [r[0] + j.palmL[0], r[1] + j.palmL[1]];
  };
  if (t < MS.grab) return at(t);
  CLASP0 ??= at(MS.grab);
  const r = stoneFreeRoot(MS.land + 0.3, 0);
  return mix(CLASP0, [r[0] - 80, -262], E.io(ph(t, MS.grab, MS.land + 0.25)));
}
let CLASP0: V2 | null = null;
/** ⑥ 两只手牵着的地方（⑦ 溶到夜里时对着它） */
export const streetClasp = (t: number) => claspAt(t);
/** 小石头这一刻站在哪（x）、飘起来多高：⑥ 的镜头 */
export const stoneState = (t: number) => ({ x: stoneFreeRoot(t, 0)[0], lift: stoneLift(t) });

/** 她这一刻站在哪（x）：⑤ 的镜头跟着她走 */
export const herX = (t: number) => chenAt(t, amanAt(t)).root[0];

/** 脚下一块软影子（离地越高越淡越小） */
function shadow(g: CanvasRenderingContext2D, x: number, lift: number, w: number) {
  const k = Math.max(0, 1 - lift / 900);
  if (k <= 0.02) return;
  g.save();
  g.fillStyle = `rgba(70,46,52,${0.26 * k})`;
  g.beginPath();
  g.ellipse(x + 12, 4, w * (0.5 + 0.5 * k), 16 * (0.6 + 0.4 * k), 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** 画三个人（人这一层，世界坐标）：阿满在最后面（上面），她，小石头抱在她身后 */
export function drawPull3(g: CanvasRenderingContext2D, t: number, z: number) {
  const a = amanAt(t);
  const c = chenAt(t, a);
  const s = stoneAt(t, c);
  shadow(g, a.hip[0] + 20, a.lift, 130);
  shadow(g, c.root[0], Math.max(0, c.sole), 120);
  if (t >= KID_RUN0) shadow(g, s.root[0], s.lift, 70);
  const line = 1 / Math.sqrt(Math.max(0.3, z));
  // 他被拽歪：整个人绕胯转（cast 的人在 pose 里写 rot 不管用）
  g.save();
  g.translate(a.hip[0], a.hip[1]);
  g.rotate(a.phi);
  g.translate(-a.hip[0], -a.hip[1]);
  drawPerson(g, AMAN, a.pose, a.root[0], a.root[1], z);
  g.restore();
  g.save();
  g.translate(c.root[0], c.root[1]);
  drawChengtuo(g, c.pose, { line });
  g.restore();
  // 小石头从画面右边外面跑进来（起跑前不画）
  if (t >= KID_RUN0) drawPerson(g, STONE, s.pose, s.root[0], s.root[1], z);
}

// ——— 镜头 ———
/**
 * 取景：框住两个人（小石头跑进来以后三个人）的头、手、脚——人在画面正中，横着左右各留 120；
 * 竖着最高那个头顶在画面上 190，街面在画面下面（92%，留一条看得见的街面；落地以后 81%，三个人在画面中间）：看得出离地多高，人又不小。
 * 离地越高退得越远，落下来就推近（0.98–1.36 倍）；装不下时街面让到画面下面去。
 * （用户：「这里的运镜需要优化一下」——原来街面放在 86%、往前面让 40、弹簧晚 0.3 秒，人小，偏在画面右边，阿满举着的手出画）
 */
function cam3Target(t: number): [number, number, number] {
  const a = amanAt(t);
  const c = chenAt(t, a);
  const jc = jointsOf(c.pose);
  const herPts = [jc.head, jc.palmL, jc.palmR, jc.ankleL, jc.ankleR].map((v) => [c.root[0] + v[0], c.root[1] + v[1]] as V2);
  const pts = [...a.pts, ...herPts];
  let x0 = Math.min(...pts.map((q) => q[0])) - 60;
  let x1 = Math.max(...pts.map((q) => q[0])) + 60;
  let top = Math.min(a.top, c.top);
  // 小石头跑进来：慢慢把他也框进来
  if (t >= T.run0) {
    const s = stoneAt(t, c);
    const js = castJoints(STONE, s.pose);
    const sx = [js.head, js.palmL, js.palmR, js.ankleL, js.ankleR].map((v) => s.root[0] + v[0]);
    const k = E.io(ph(t, T.run0 + 0.05, T.jump));
    x0 -= k * Math.max(0, x0 - (Math.min(...sx) - 60));
    x1 += k * Math.max(0, Math.max(...sx) + 60 - x1);
    top = Math.min(top, s.root[1] + js.head[1] - 70);
  }
  const after = E.soft(ph(t, T.land, T.sit + 0.2));
  const GY = 1760 - 210 * after;
  const TOPY = 190;
  const zV = (GY - TOPY) / -top;
  const zH = (1080 - 240) / (x1 - x0);
  const z = Math.min(1.36, Math.max(0.98, Math.min(zV, zH)));
  let cy = (960 - GY) / z;
  if (960 + (top - cy) * z < TOPY) cy = top - (TOPY - 960) / z;
  return [(x0 + x1) / 2, cy, z];
}
let CAM3: { x: (t: number) => V2; yz: (t: number) => V2; z: (t: number) => V2 } | null = null;
/** 横着的弹簧往前看多少（秒）：两个人一直往左飘，弹簧晚一点到会让人偏到画面右边，按这么多提前取景抵掉大半 */
const X_LEAD = 0.2;
/**
 * ③的镜头：取景（cam3Target）用弹簧跟（晚一点到，带惯性）：横着跟得紧（往前看 X_LEAD，人一直在画面正中）；两个人往下坠时画面里先掉下去再跟上；
 * 攥住一顶一震；坠到最低时再推近一点、屏住气；往上升时退开（街面往下掉）；小石头攥住她的靴子一顶；
 * 「咚」往里一顶、一沉、一震；坐下轻轻一顶；之后很慢地凑近三个人
 */
export function pullCam(t: number): Cam {
  if (!CAM3) {
    // 两条弹簧在同样的时刻取景，取一次就够
    const memo = new Map<number, [number, number, number]>();
    const at = (tt: number) => {
      let f = memo.get(tt);
      if (!f) memo.set(tt, (f = cam3Target(tt)));
      return f;
    };
    const ta = T.start - 0.02;
    const tb = T.cut + 0.05;
    CAM3 = {
      x: smoothTrack((tt) => [at(Math.min(tt + X_LEAD, tb))[0], 0], ta, tb, 7.5),
      yz: smoothTrack((tt) => [at(tt)[1], 0], ta, tb, 6.2),
      z: smoothTrack((tt) => [Math.log(at(tt)[2]), 0], ta, tb, 4.8),
    };
  }
  const cx = CAM3.x(t)[0];
  const cy = CAM3.yz(t)[0];
  const k1 = kick(t, T.grab, 0.12);
  const k2 = kick(t, T.hug, 0.1);
  const k3 = kick(t, T.land, 0.14);
  const k4 = kick(t, T.sit, 0.1);
  const z =
    Math.exp(CAM3.z(t)[0]) *
    (1 + 0.04 * k1 + 0.022 * k2 + 0.06 * k3 + 0.015 * k4) *
    (1 + 0.04 * bump(t, 90.75, T.low + 0.05, 91.45)) *
    (1 + 0.03 * E.soft(ph(t, T.sit, T.cut)));
  const [sx, sy] = shake(t, 9 * k1 + 5 * k2 + 22 * k3 + 4 * k4);
  // 「咚」一沉再弹回来
  const sink = t > T.land ? 30 * Math.exp(-(t - T.land) / 0.12) * Math.sin((t - T.land) * 26) : 0;
  return aim(cx + sx / z, cy + (sy - sink) / z, 540, 960, z);
}
