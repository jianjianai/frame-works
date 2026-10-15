// 导演脚本：全片运镜（一条连续的世界镜头）、抖动和小冲、每一刻的光（环境亮度、暗角）、画面模式（回忆、墙缝视角）。
// 运镜按「情绪运镜」经验：每一镜的终点就是下一镜的起点，速度曲线就是情绪。
import { E, K, camPath, clamp, lerp, prog, punchAt, shakeAt, type Cam, type CamKey, type Ease, type V2 } from "./kit";
import { skeleton } from "./people";
import { herPose, hisPose } from "./story";
import { DIG_TIMES } from "./world";

const at = (f: (t: number) => V2, t: number) => f(t);
const hisMouth = (t: number) => skeleton(hisPose(t)).mouth;
const hisHead = (t: number) => skeleton(hisPose(t)).head;
const herHead = (t: number) => skeleton(herPose(t)).head;
const hisHandN = (t: number) => skeleton(hisPose(t)).hn;

/** 甩镜：先加速甩出，再同方向减速落定（两段速度在中点接上） */
function whip(t0: number, t1: number, a: [number, number, number], b: [number, number, number]): CamKey[] {
  const tm = t0 + (t1 - t0) * 0.37;
  const f = 0.41;
  const mid: [number, number, number] = [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), f))];
  return [K(t0, a[0], a[1], a[2], E.in(2.5)), K(tm, mid[0], mid[1], mid[2], E.out(3))];
}

const m26 = at(hisMouth, 76.8);
const h27 = at(hisHandN, 78.6);
const h38 = at(hisHead, 100.6);
const h39 = at(herHead, 102.8);
const m45 = at(hisMouth, 114.0);

/** 每一步挖墙往前冲一点 */
function digSteps(): CamKey[] {
  const keys: CamKey[] = [];
  let z = 11.6;
  for (const k of [86.01, 86.51, 87.01, 87.51]) {
    keys.push(K(k, 937 - (z - 11.6) * 0.5, 1765, z, E.out(4)));
    z += 0.9;
    keys.push(K(k + 0.14, 937 - (z - 11.6) * 0.5, 1765.5, z, E.linear));
  }
  return keys;
}

export const CAM_KEYS: CamKey[] = [
  // S1 两只手 → 穿墙 → 一路拉远到整栋楼（孤独：越拉越慢但不停）
  K(0.0, 906, 1774, 17.0, E.linear),
  K(1.3, 909, 1774, 17.6, E.inOut),
  K(2.1, 944, 1774, 17.6, E.linear),
  K(3.5, 946, 1774, 17.6, E.out(3)),
  // S2 楼里唯一的一点光：推向妈妈的格子
  K(8.3, 812, 1830, 0.62, E.inOut),
  K(10.1, 812, 1626, 4.8, E.linear),
  // S3 甩回他们那堵墙，停在他这边；哼声停了，慢慢逼近他手里的刀
  ...whip(12.02, 12.4, [814, 1630, 5.0], [985, 1772, 5.4]),
  K(12.4, 985, 1772, 5.4, E.linear),
  K(14.02, 994, 1788, 6.2, E.inOut),
  // S4 横移穿墙到她：敲两下，没有回应，拿出纸，吸气（直直落到嘴边，一顿）
  K(14.32, 872, 1792, 6.0, E.linear),
  K(15.05, 874, 1793, 6.0, E.out(3)),
  K(15.75, 893, 1797, 9.0, E.linear),
  K(15.93, 893, 1797, 9.0, E.back(1.4)),
  // S5 第一个字：光亮起的一下回弹，跟着字到墙缝
  K(16.25, 888, 1790, 8.4, E.linear),
  K(17.6, 887, 1789, 8.4, E.inOut),
  K(19.45, 916, 1775, 9.5, E.in(2.2)),
  // 被吸进墙缝，穿过墙
  K(19.8, 921, 1772, 40, E.linear),
  K(19.92, 931, 1772, 40, E.out(3)),
  // S6 他那边：背过身，停住、慢慢压暗
  K(20.5, 985, 1795, 6.2, E.linear),
  K(23.35, 989, 1770, 7.6, E.inOut),
  // S7 穿墙回她：慢慢凑近墙缝
  K(23.75, 885, 1782, 6.5, E.inOut),
  K(27.7, 903, 1765, 9.0, E.out(2)),
  // S8 两边同框：他一巴掌捂住墙缝
  K(27.98, 925, 1772, 7.2, E.linear),
  K(29.55, 924, 1770, 7.4, E.inOut),
  // S9 她额头抵墙：往下沉，再推进那张纸（进回忆）
  K(29.95, 889, 1772, 8.0, E.linear),
  K(31.55, 887, 1782, 8.2, E.in(2.2)),
  K(32.3, 886, 1784, 45, E.linear),
  // （32.3–37.7 是回忆，世界镜头不出现）
  K(37.7, 898.5, 1777.8, 40, E.out(2.5)),
  // S13 回到现在：同一个「341」，拉开看到她笑着看纸，再冲进墙缝
  K(38.4, 896, 1768, 20, E.in(2.2)),
  K(39.39, 921, 1770, 60, E.linear),
  K(39.47, 931, 1770, 60, E.back(1.3)),
  // S14 光冲进他的格子（回弹急推）
  K(40.05, 975, 1770, 7.0, E.linear),
  K(41.94, 978, 1766, 7.6, E.out(3)),
  // S15 他的脸第一次被照亮
  K(42.5, 968, 1745, 12, E.linear),
  K(43.92, 968, 1744, 12.6, E.linear),
  // S16 刺眼的一缩（fx），拉开看到楼上楼下的邻居
  K(45.55, 970, 1748, 11.5, E.inOut),
  K(46.6, 925, 1755, 2.3, E.linear),
  K(47.8, 925, 1758, 2.4, E.inOut),
  // S17 回到他：慢推到刀
  K(48.6, 990, 1785, 7.5, E.linear),
  K(49.98, 996, 1792, 9.0, E.out(2)),
  // S18 刀掉下去：停住
  K(50.45, 997, 1797, 9.5, E.linear),
  K(51.93, 997, 1798, 9.6, E.inOut),
  // S19 两只手隔着墙贴在一起：很慢地推近
  K(52.8, 925, 1772, 9.0, E.linear),
  K(55.98, 925, 1772, 12.0, E.inOut),
  // S20 拉开：整栋楼的人都在听
  K(59.6, 812, 1800, 0.72, E.inOut),
  // S21 落回她：161
  K(62.6, 878, 1790, 7.0, E.linear),
  K(64.0, 880, 1796, 8.5, E.out(3)),
  // S22 他哼回来了：往后舒一口气，两边同框
  K(66.5, 912, 1778, 6.2, E.linear),
  K(68.02, 913, 1777, 6.1, E.linear),
  // （68.02–72.06 是墙缝里的主观镜头）
  // S24 他的眼睛 → 拉开，他砸墙
  K(72.06, 936, 1752, 18, E.out(2.5)),
  K(72.45, 952, 1768, 7.0, E.linear),
  K(73.75, 950, 1768, 7.2, E.inOut),
  // S25 穿墙到她：掌心按在他砸的地方（稳住）
  K(74.05, 893, 1768, 7.5, E.linear),
  K(75.8, 896, 1764, 8.5, E.inOut),
  // S26 推到他的嘴：喊不出声（静止）
  K(76.1, m26.x + 6, m26.y, 10, E.out(3)),
  K(76.6, m26.x, m26.y, 14, E.linear),
  K(77.8, m26.x, m26.y, 14.2, E.inOut),
  // S27 他的手背：数字在涨（歪 3°）
  K(78.15, h27.x, h27.y - 4, 13, E.linear, 0.05),
  K(79.45, h27.x, h27.y - 4, 13.5, E.out(3), 0.05),
  // S28 直直落到刀上，一顿
  K(79.9, 948, 1806, 10, E.linear, 0),
  K(80.3, 948, 1806, 10, E.linear),
  K(81.75, 958, 1785, 9.5, E.inOut),
  // S29–S31 挖墙：每一下往前冲一点
  K(82.0, 945, 1768, 8.0, E.linear),
  K(83.85, 942, 1766, 9.0, E.out(2)),
  K(84.3, 939, 1764, 11, E.linear),
  K(85.8, 938, 1764, 11.5, E.linear),
  ...digSteps(),
  // S32 推进洞里，溶进十四年前（急推一震，然后愣住）
  K(87.9, 934, 1766, 15.6, E.in(2.2)),
  K(88.45, 926, 1768, 34, E.out(3)),
  K(88.85, 850, 1775, 5.6, E.linear),
  K(89.8, 852, 1776, 5.8, E.inOut),
  // S33 横移穿墙到小男孩，慢慢后退，再推到两只小手
  K(90.25, 985, 1782, 5.4, E.out(2)),
  K(91.55, 930, 1784, 4.6, E.in(2)),
  K(91.95, 933, 1780, 7.0, E.out(2)),
  // S34 回到现在：他握刀的手，猛挖
  K(92.3, 938, 1770, 8.0, E.linear),
  K(93.93, 941, 1766, 9.0, E.out(2)),
  // S35 洞里的光照在他脸上
  K(94.5, 950, 1755, 8.0, E.linear),
  K(95.4, 950, 1756, 8.1, E.inOut),
  // S36 跟着他的手臂穿墙
  K(96.0, 902, 1766, 8.0, E.linear),
  K(97.8, 900, 1766, 8.6, E.out(3)),
  // S37 握在一起的两只手：两个数字一跌一涨（慢推、压暗）
  K(98.2, 907, 1768, 14, E.linear),
  K(99.8, 907, 1768, 17, E.inOut),
  // S38 他想开口还字，说不出来（荷兰角）
  K(100.25, h38.x, h38.y + 3, 13, E.linear, -0.06),
  K(101.9, h38.x, h38.y + 3, 13.6, E.inOut, -0.06),
  // S39 她笑着唱（越推越慢）
  K(102.3, h39.x - 4, h39.y + 2, 13, E.out(2.5), 0),
  K(103.85, h39.x - 4, h39.y + 2, 15, E.inOut),
  // S40 沿墙横移：楼上的妈妈，楼下的老人
  K(104.45, 812, 1622, 6.0, E.linear),
  K(105.15, 812, 1625, 6.3, E.inOut),
  K(105.65, 985, 1895, 6.0, E.linear),
  K(106.15, 985, 1896, 6.2, E.inOut),
  // S41 回到两个人：他扒墙
  K(106.55, 925, 1765, 7.5, E.linear),
  K(107.85, 925, 1765, 7.8, E.inOut),
  // S42 她的脸，光一点点暗下去（几乎不动）
  K(108.25, 900, 1755, 12, E.linear),
  K(110.25, 900, 1755, 12.3, E.inOut),
  // S43 最后九个字；「起」唱完墙塌了（往下一沉）
  K(110.65, 928, 1772, 8.0, E.linear),
  K(111.45, 928, 1772, 8.1, E.out(2)),
  K(111.95, 945, 1790, 7.6, E.linear),
  // S44 静音：完全不动
  K(113.88, 947, 1790, 7.8, E.out(4)),
  // S45 他第一次开口：猛推到他的嘴，再跟着三个字落到她手上
  K(114.06, m45.x, m45.y, 12, E.linear),
  K(114.6, m45.x, m45.y + 4, 12.2, E.inOut),
  K(115.6, 950, 1797, 10, E.linear),
  // S46 甩到楼上的妈妈、楼下的老人，再拉开看光流过来
  ...whip(117.62, 117.92, [952, 1796, 10.4], [812, 1632, 6.0]),
  K(117.92, 812, 1632, 6.0, E.linear),
  ...whip(118.55, 118.85, [813, 1634, 6.1], [1030, 1890, 6.0]),
  K(118.85, 1030, 1890, 6.0, E.linear),
  K(119.45, 1030, 1891, 6.1, E.inOut),
  K(120.6, 925, 1770, 2.6, E.linear),
  // S47 急速拉远：整栋楼
  K(121.86, 925, 1772, 2.5, E.out(3)),
  K(123.3, 810, 1830, 0.55, E.linear),
  // S48 继续拉远升高：整座城
  K(125.91, 810, 1830, 0.52, E.inOut),
  K(129.6, 900, 900, 0.075, E.linear),
  // S49 夜空里飘满发光的字，然后往下落回那栋楼
  K(131.0, 900, 700, 0.07, E.inOut),
  K(134.5, 958, 1782, 6.0, E.linear),
  // S50 他抱着她哼歌：很慢地推近
  K(138.0, 962, 1780, 9.0, E.inOut),
  // S51 她的手指敲了两下
  K(138.4, 947, 1795, 16, E.linear),
  K(139.95, 947, 1795, 16.5, E.inOut),
  // S52 第一次面对面
  K(140.6, 968, 1776, 10, E.linear),
  K(146.0, 968, 1776, 10.6, E.inOut),
  // S53 两只手掌贴在一起，中间没有墙了：一路减速往后拉，最后一帧还在漂
  K(146.8, 952, 1764, 12, E.out(2.2)),
  K(153.0, 952, 1772, 3.0, E.linear),
];

interface Fx {
  t: number;
  shake?: number;
  decay?: number;
  punch?: number;
}
const FX: Fx[] = [
  { t: 12.45, shake: 6, punch: 0.03 }, // 哼声停了：一惊
  { t: 15.75, punch: 0.012 }, // 吸气：一顿
  { t: 27.95, shake: 7, punch: 0.03 }, // 一巴掌捂住墙缝
  { t: 39.4, shake: 6 },
  { t: 44.0, shake: 5, punch: -0.03 }, // 刺眼的一缩
  { t: 50.45, punch: 0.012 }, // 刀落地：一顿
  { t: 72.06, shake: 5 },
  ...[72.5, 72.9, 73.3, 73.65].map((t) => ({ t, shake: 7 })),
  { t: 80.3, punch: 0.012 },
  ...DIG_TIMES.map((t, i) => ({ t, shake: i < 9 ? 4 : 6 })),
  { t: 88.75, shake: 9 },
  { t: 111.45, shake: 10 },
  { t: 113.88, shake: 12, decay: 6 },
  { t: 139.01, punch: 0.012 },
];

/** 世界镜头（含抖动和小冲） */
export function worldCam(t: number): Cam & { sx: number; sy: number } {
  const c = camPath(t, CAM_KEYS);
  let sx = 0;
  let sy = 0;
  let k = 1;
  for (const f of FX) {
    if (t < f.t || t > f.t + 1.5) continue;
    if (f.shake) {
      const s = shakeAt(t, f.t, f.shake, f.decay ?? 14, Math.floor(f.t * 10));
      sx += s.x;
      sy += s.y;
    }
    if (f.punch) k *= punchAt(t, f.t, f.punch);
  }
  return { ...c, z: c.z * k, sx, sy };
}

// ---------- 画面模式 ----------
export type Mode = "world" | "paper" | "pov" | "past";
export interface ModeMix {
  a: Mode;
  b?: Mode;
  /** b 的比例 */
  p: number;
}
export function modeAt(t: number): ModeMix {
  if (t < 32.0) return { a: "world", p: 0 };
  if (t < 32.3) return { a: "world", b: "paper", p: E.smooth(prog(t, 32.0, 32.3)) };
  if (t < 37.7) return { a: "paper", p: 0 };
  if (t < 37.95) return { a: "paper", b: "world", p: E.smooth(prog(t, 37.7, 37.95)) };
  if (t >= 68.02 && t < 72.06) return { a: "pov", p: 0 };
  if (t >= 88.45 && t < 88.75) return { a: "world", b: "past", p: E.smooth(prog(t, 88.45, 88.75)) };
  if (t >= 88.75 && t < 91.85) return { a: "past", p: 0 };
  if (t >= 91.85 && t < 92.05) return { a: "past", b: "world", p: E.smooth(prog(t, 91.85, 92.05)) };
  return { a: "world", p: 0 };
}

/** 墙缝里的主观镜头：一线光里是她的手和那张纸 */
export function povCam(t: number): Cam & { sx: number; sy: number } {
  const p = prog(t, 68.02, 72.06);
  const s = shakeAt(t, 72.0, 6, 12, 5);
  return { x: 884, y: 1796, z: lerp(12, 14.5, p), r: 0, sx: s.x, sy: s.y };
}

/** 回忆里那张纸的镜头（设计像素空间） */
export function paperCam(t: number): { x: number; y: number; z: number } {
  if (t < 33.96) {
    const p = prog(t, 32.0, 33.96);
    return { x: lerp(470, 640, p), y: 470, z: lerp(1.28, 1.34, p) };
  }
  if (t < 35.91) {
    const p = E.inOut(prog(t, 33.96, 34.5));
    return { x: lerp(640, 540, p), y: lerp(470, 900, p), z: lerp(1.34, 0.98, p) };
  }
  if (t < 36.6) {
    const p = E.out(3)(prog(t, 35.91, 36.4));
    return { x: lerp(540, 690, p), y: lerp(900, 1420, p), z: lerp(0.98, 1.3, p) };
  }
  const p = E.in(2.2)(prog(t, 36.6, 37.95));
  return { x: lerp(690, 742, p), y: lerp(1420, 1395, p), z: lerp(1.3, 3.2, p) };
}

// ---------- 光 ----------
type LookKey = [number, number, number, number, number];
/** [时间, 环境光 r, g, b, 暗角] */
const LOOK: LookKey[] = [
  [0, 0.398, 0.433, 0.526, 0.52],
  [21.9, 0.398, 0.433, 0.526, 0.52],
  [22.6, 0.304, 0.328, 0.409, 0.68],
  [23.45, 0.304, 0.328, 0.409, 0.68],
  [23.7, 0.398, 0.433, 0.526, 0.5],
  [29.8, 0.398, 0.433, 0.526, 0.5],
  [30.6, 0.328, 0.351, 0.433, 0.62],
  [32.2, 0.398, 0.433, 0.526, 0.5],
  [55.98, 0.398, 0.433, 0.526, 0.45],
  [57.5, 0.421, 0.456, 0.55, 0.32],
  [59.6, 0.421, 0.456, 0.55, 0.34],
  [62.0, 0.398, 0.433, 0.526, 0.5],
  [64.0, 0.398, 0.433, 0.526, 0.45],
  [66.0, 0.445, 0.468, 0.538, 0.3],
  [68.0, 0.398, 0.433, 0.526, 0.42],
  [99.9, 0.398, 0.433, 0.526, 0.5],
  [102.0, 0.374, 0.398, 0.491, 0.62],
  [104.0, 0.374, 0.398, 0.491, 0.55],
  [108.0, 0.316, 0.339, 0.421, 0.68],
  [111.5, 0.257, 0.281, 0.351, 0.75],
  [112.0, 0.081, 0.092, 0.115, 0.88],
  [113.85, 0.081, 0.092, 0.115, 0.88],
  [114.2, 0.234, 0.234, 0.257, 0.6],
  [117.5, 0.304, 0.304, 0.328, 0.5],
  [121.86, 0.328, 0.328, 0.351, 0.38],
  [126.0, 0.351, 0.351, 0.386, 0.34],
  [132.0, 0.421, 0.398, 0.386, 0.34],
  [136.0, 0.538, 0.491, 0.445, 0.3],
  [140.0, 0.585, 0.526, 0.468, 0.24],
  [152.0, 0.585, 0.526, 0.468, 0.2],
];
export function look(t: number): { amb: [number, number, number]; vig: number } {
  let i = 0;
  while (i < LOOK.length - 1 && t >= LOOK[i + 1][0]) i++;
  const a = LOOK[i];
  const b = LOOK[Math.min(i + 1, LOOK.length - 1)];
  const p = a === b ? 0 : E.smooth(prog(t, a[0], b[0]));
  return { amb: [lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p)], vig: lerp(a[4], b[4], p) };
}

// ---------- 手背上的数字什么时候看得到 ----------
const within = (t: number, ranges: [number, number][]) => ranges.some(([a, b]) => t >= a && t < b);
/** 她的数字写在哪只手上：f 远侧（贴墙的那只）、n 近侧 */
export function herCounterHand(t: number): "n" | "f" {
  if (t < 15.0) return "f";
  if (t < 51.9) return "n";
  if (t < 60.4) return "f";
  return "n";
}
export const showHis = (t: number) => within(t, [[1.45, 4.2], [77.9, 79.6], [97.9, 99.95], [113.8, 118], [146, 152.1]]);
export const showMom = (t: number) => within(t, [[9.4, 12.02], [104.4, 105.4], [117.85, 118.6]]);
export const showOld = (t: number) => within(t, [[105.5, 106.25], [118.8, 119.5]]);
export const showBaby = (t: number) => within(t, [[9.4, 11.8]]);
/** 她的数字：除了回忆和远景，手在画面里就看得到 */
export const showHer = (t: number) => !within(t, [[32.3, 37.7], [88.6, 91.95]]);
/** 特别要读清楚的几处，数字放大 */
export function counterBoost(t: number) {
  if (within(t, [[77.9, 79.6], [97.9, 99.95]])) return 1.6;
  if (within(t, [[111.3, 118]])) return 1.5;
  if (within(t, [[0, 4.2], [59.6, 64.4]])) return 1.3;
  return 1;
}
export { clamp };
export type { Ease };
