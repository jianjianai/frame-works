// 剧情状态：每一刻每个人的姿势、手里的东西、手背上的数字、发光的字、光源。全部是时间的函数。
import { LINES } from "./lyrics";
import { E, clamp, env, hash2, lerp, lerpV, prog, v, type Ease, type V2 } from "./kit";
import { P, mixPose, skeleton, type Pose } from "./people";
import { ASH_CELL, CELL_W, DIG_TIMES, HER, HIM, MOM, NC, NR, OLD, cellX, floorY, WALL_X, HOLE_Y, holeRadius, T_COLLAPSE, cellCenter } from "./world";

// ================= 她 =================
const H_LIE = P({
  hip: v(836, 1808), torso: 0, neck: 0, face: -1,
  hf: v(917, 1774), ef: v(892, 1768),
  hn: v(856, 1801), en: v(866, 1822),
  fn: v(758, 1813), ff: v(754, 1815), kn: v(792, 1784), kf: v(788, 1786),
  eye: 0,
});
const H_LIE_OPEN = { ...H_LIE, eye: 1 };
const H_PILLOW = { ...H_LIE_OPEN, hn: v(905, 1814), en: v(882, 1824) };
const H_PAPER = { ...H_LIE_OPEN, hn: v(884, 1772), en: v(866, 1792) };
const H_TURN = P({
  hip: v(848, 1806), torso: -0.55, neck: 0.15, face: 0.05,
  hn: v(880, 1788), en: v(866, 1800), hf: v(902, 1812), ef: v(890, 1800),
  fn: v(800, 1814), ff: v(796, 1815), kn: v(826, 1790), kf: v(822, 1792),
});
const H_KNEEL = P({
  hip: v(864, 1800), torso: -0.96, neck: 0.25, face: 1,
  hf: v(917, 1772), ef: v(905, 1796),
  hn: v(886, 1786), en: v(872, 1796),
  fn: v(842, 1815), ff: v(846, 1816), kn: v(894, 1813), kf: v(890, 1814),
});
const H_FOREHEAD = { ...H_KNEEL, hip: v(858, 1800), torso: -0.8, neck: 0.3, eye: 0, hf: v(917, 1782), ef: v(902, 1800), hn: v(884, 1792), brow: 0.6 };
const H_LOOKPAPER = { ...H_KNEEL, neck: 0.65, hn: v(893, 1778), en: v(876, 1792), smile: 0.6 };
const H_PALM = P({
  hip: v(860, 1799), torso: -1.15, neck: 0.22, face: 1,
  hf: v(917, 1772), ef: v(902, 1790),
  hn: v(880, 1792), en: v(868, 1786),
  fn: v(836, 1815), ff: v(840, 1816), kn: v(890, 1812), kf: v(886, 1813),
});
const H_REST = P({
  hip: v(852, 1803), torso: -1.35, neck: 0.55, face: 1,
  hn: v(883, 1778), en: v(866, 1797), hf: v(880, 1801), ef: v(870, 1790),
  fn: v(828, 1815), ff: v(832, 1816), kn: v(884, 1812), kf: v(880, 1813),
});
const H_REST_PAPER = { ...H_REST, hn: v(888, 1770), neck: 0.4 };
const H_CRY = { ...H_PALM, hf: v(917, 1765), hn: v(882, 1806), en: v(868, 1800), eye: 0, tear: 1, smile: 0.7, brow: 0.6 };
const H_CALMPALM = { ...H_PALM, hf: v(917, 1750), ef: v(900, 1772) };
const H_HOLD = { ...H_KNEEL, hn: v(907, 1768), en: v(888, 1792) };
const H_HOLDSMILE = { ...H_HOLD, smile: 1 };
const H_SLUMP = { ...H_HOLD, hip: v(858, 1802), torso: -0.85, neck: 0.45, eye: 0.35, brow: 0.6, hf: v(917, 1790), ef: v(900, 1806) };
const H_FALLMID = P({
  hip: v(892, 1808), torso: -0.25, neck: -0.1, face: 0.1,
  hn: v(940, 1802), hf: v(934, 1812), fn: v(832, 1815), ff: v(836, 1816), kn: v(860, 1800), kf: v(862, 1802), eye: 0,
});
const H_LAP = P({
  hip: v(912, 1808), torso: -0.12, neck: -0.18, face: -1,
  hn: v(945, 1795), en: v(940, 1812), hf: v(931, 1817), ef: v(942, 1822),
  fn: v(838, 1814), ff: v(842, 1816), kn: v(876, 1798), kf: v(872, 1800), eye: 0,
});
const H_LAP_OPEN = { ...H_LAP, eye: 1 };
const H_LAP_PALM = { ...H_LAP_OPEN, hn: v(950, 1761), en: v(963, 1790), smile: 0.5 };

// ================= 他 =================
const M_LIE = P({
  hip: v(1014, 1808), torso: Math.PI, neck: 0, face: 1,
  hf: v(933, 1774), ef: v(958, 1768),
  hn: v(994, 1801), en: v(984, 1822),
  fn: v(1094, 1813), ff: v(1098, 1815), kn: v(1058, 1784), kf: v(1062, 1786),
  eye: 0, hum: 1,
});
const M_LIE_OPEN = { ...M_LIE, eye: 1, hum: 0 };
const M_HANDDOWN = { ...M_LIE_OPEN, hf: v(952, 1814), ef: v(962, 1796) };
const M_REACHKNIFE = { ...M_HANDDOWN, hn: v(1001, 1813), en: v(990, 1796) };
const M_KNIFECHEST = { ...M_HANDDOWN, hn: v(986, 1794), en: v(984, 1814) };
const M_SITAWAY = P({
  hip: v(948, 1808), torso: -1.12, neck: 0.5, face: 1,
  hn: v(1001, 1784), en: v(980, 1797),
  hf: v(1004, 1776), ef: v(985, 1784),
  fn: v(1006, 1815), ff: v(1010, 1816), kn: v(996, 1766), kf: v(1000, 1768),
});
const M_SITHOOD = { ...M_SITAWAY, hood: 1, neck: 0.75, eye: 0 };
const M_SLAP = { ...M_SITHOOD, hf: v(933, 1770), ef: v(944, 1750) };
const M_PUSHED = { ...M_SITHOOD, hf: v(960, 1752), ef: v(950, 1772), eye: 0.6 };
const M_UPRIGHT = P({
  hip: v(948, 1808), torso: -1.37, neck: -0.1, face: 1,
  hn: v(1000, 1786), en: v(985, 1801),
  hf: v(1003, 1778), ef: v(990, 1792),
  fn: v(1006, 1815), ff: v(1010, 1816), kn: v(992, 1770), kf: v(996, 1772),
  eye: 0.45, hood: 1,
});
const M_SHIELD = { ...M_UPRIGHT, hf: v(982, 1740), ef: v(975, 1765), eye: 0.15, brow: 0.5 };
const M_LOOKKNIFE = { ...M_UPRIGHT, neck: 0.65, hn: v(996, 1792), hf: v(1000, 1800), eye: 1, brow: 0.5 };
const M_TURNMID = P({
  hip: v(965, 1806), torso: -1.6, neck: 0, face: 0.02,
  hn: v(990, 1800), hf: v(958, 1800), fn: v(1000, 1815), ff: v(1004, 1816), kn: v(985, 1790), kf: v(988, 1792),
  hood: 0.5,
});
const M_PALM = P({
  hip: v(982, 1800), torso: -2.09, neck: -0.2, face: -1,
  hf: v(933, 1772), ef: v(948, 1792),
  hn: v(985, 1796), en: v(975, 1797),
  fn: v(1008, 1815), ff: v(1004, 1816), kn: v(958, 1813), kf: v(962, 1814),
});
const M_HUM = { ...M_PALM, eye: 0, hum: 1, smile: 0.3 };
const M_PEER = { ...M_PALM, hip: v(985, 1802), torso: -2.25, neck: -0.05, hf: v(933, 1760), ef: v(948, 1782) };
const M_PEERWIDE = { ...M_PEER, eye: 1.3 };
const M_BANG = { ...M_PALM, hf: v(934, 1748), ef: v(952, 1766), eye: 1.2, brow: 0.9, mouth: 0.25 };
const M_SHOUT = { ...M_PALM, neck: 0.8, mouth: 1, eye: 1.2, brow: 1, hn: v(950, 1766), en: v(966, 1782) };
const M_LOOKHAND = { ...M_PALM, neck: -0.35, hn: v(944, 1770), en: v(962, 1782), eye: 1.25, brow: 0.6 };
const M_GRAB = P({
  hip: v(982, 1802), torso: -2.3, neck: -0.35, face: -1,
  hn: v(946, 1814), en: v(960, 1796), hf: v(934, 1792), ef: v(950, 1800),
  fn: v(1008, 1815), ff: v(1004, 1816), kn: v(958, 1813), kf: v(962, 1814), eye: 1.1, brow: 0.9,
});
const M_DIG = P({
  hip: v(983, 1801), torso: -2.2, neck: -0.05, face: -1,
  hn: v(939, 1768), en: v(958, 1790), hf: v(934, 1738), ef: v(950, 1742),
  fn: v(1009, 1815), ff: v(1005, 1816), kn: v(959, 1813), kf: v(963, 1814), eye: 1.1, brow: 0.9,
});
const M_DIG2 = { ...M_DIG, hf: v(934, 1784), ef: v(952, 1800) };
const M_REACH = { ...M_DIG, hf: v(907, 1768), ef: v(940, 1758), brow: 0.6 };
const M_TRY = { ...M_REACH, neck: 0.35, eye: 1.2, brow: 1 };
const M_CATCH = P({
  hip: v(995, 1803), torso: -2.3, neck: -0.3, face: -1,
  hn: v(950, 1800), hf: v(944, 1812), fn: v(1022, 1815), ff: v(1018, 1816), kn: v(968, 1813), kf: v(972, 1814), eye: 1.2,
});
const M_CRADLE = P({
  hip: v(1002, 1802), torso: -2.12, neck: -0.7, face: -1,
  hn: v(947, 1797), en: v(962, 1784),
  hf: v(966, 1810), ef: v(985, 1814),
  fn: v(1030, 1815), ff: v(1026, 1816), kn: v(975, 1813), kf: v(979, 1814),
  brow: 0.9,
});
const M_SHOUT2 = { ...M_CRADLE, neck: -0.4, mouth: 1, eye: 1.15, brow: 1 };
const M_CRADLE_HOPE = { ...M_CRADLE, eye: 1.2, brow: 0.4 };
const M_CRADLE_HUM = { ...M_CRADLE, eye: 0, hum: 1, brow: 0.3 };
const M_CRADLE_LOOK = { ...M_CRADLE, eye: 1, smile: 0.6, brow: 0 };
const M_PALMDOWN = { ...M_CRADLE_LOOK, hn: v(951, 1761), en: v(966, 1776) };

// ================= 邻居 =================
const MOM_SIT = P({
  hip: v(800, 1668), torso: -1.37, neck: 0.5, face: 1,
  hn: v(832, 1648), en: v(820, 1666), hf: v(828, 1654), ef: v(815, 1670),
  fn: v(858, 1677), ff: v(862, 1678), kn: v(838, 1640), kf: v(842, 1642), eye: 0.8,
});
const MOM_LEAN = { ...MOM_SIT, neck: 0.85, eye: 0.6 };
const MOM_COVER = { ...MOM_SIT, hn: v(843, 1636), en: v(832, 1660), eye: 0.2 };
const MOM_LOOKHAND = { ...MOM_SIT, hn: v(835, 1626), en: v(828, 1646), neck: 0.35, eye: 1, brow: 0.6 };
const MOM_SHOUT = P({
  hip: v(820, 1662), torso: -0.35, neck: 0.55, face: 1,
  hn: v(852, 1676), hf: v(858, 1678), fn: v(780, 1678), ff: v(784, 1679), kn: v(800, 1676), kf: v(804, 1677),
  eye: 1, brow: 0.8,
});
const OLD_SIT = P({
  hip: v(1050, 1948), torso: -1.92, neck: -0.45, face: -1,
  hn: v(1022, 1932), en: v(1040, 1946), hf: v(1026, 1938), ef: v(1044, 1952),
  fn: v(1000, 1957), ff: v(1004, 1958), kn: v(1020, 1928), kf: v(1024, 1930), eye: 0,
});
const OLD_SHIELD = { ...OLD_SIT, neck: 0.1, hn: v(1022, 1878), en: v(1036, 1902), eye: 0.3 };
const OLD_LEAN = { ...OLD_SIT, hip: v(989, 1946), torso: -2.3, neck: -0.1, hn: v(960, 1930), hf: v(964, 1936), fn: v(1030, 1957), ff: v(1026, 1958), kn: v(965, 1952), kf: v(969, 1953), eye: 0, tear: 1, brow: 0.9 };
const OLD_SHOUT = { ...OLD_SIT, torso: -1.75, neck: 0.6, hn: v(1030, 1920), hf: v(1036, 1925), eye: 1, brow: 0.8 };

// ================= 小时候（闪回） =================
const GIRL_SCREAM = P({
  s: 0.62, hip: v(830, 1808), torso: -1.75, neck: 0.5, face: -1,
  hn: v(812, 1790), hf: v(816, 1795), fn: v(850, 1816), ff: v(846, 1816), kn: v(814, 1813), kf: v(818, 1814),
  mouth: 1, eye: 0, brow: 1, tear: 1,
});
const GIRL_QUIET = { ...GIRL_SCREAM, mouth: 0, neck: -0.1, eye: 1 };
const GIRL_WALL = P({
  s: 0.62, hip: v(885, 1810), torso: -1.25, neck: 0.1, face: 1,
  hf: v(917, 1786), hn: v(900, 1800), fn: v(870, 1816), ff: v(872, 1816), kn: v(900, 1814), kf: v(898, 1814),
  eye: 1, tear: 0.5,
});
const BOY_LISTEN = P({
  s: 0.62, hip: v(965, 1810), torso: -2.0, neck: -0.25, face: -1,
  hf: v(933, 1786), hn: v(950, 1802), fn: v(985, 1816), ff: v(982, 1816), kn: v(955, 1814), kf: v(958, 1814),
  eye: 0,
});
const BOY_HUM = { ...BOY_LISTEN, hum: 1 };

// ================= 关键帧轨道 =================
type Key = [number, Pose, Ease?];
function track(keys: Key[], t: number): Pose {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, pa, e] = keys[i];
    const [b, pb] = keys[i + 1];
    if (t < b) return pa === pb ? pa : mixPose(pa, pb, (e ?? E.smooth)(prog(t, a, b)));
  }
  return keys[keys.length - 1][1];
}

const HER_KEYS: Key[] = [
  [0, H_LIE], [14.05, H_LIE], [14.25, H_LIE_OPEN], [15.02, H_LIE_OPEN], [15.3, H_PILLOW], [15.62, H_PAPER],
  [23.55, H_PAPER], [24.15, H_TURN], [24.8, H_KNEEL],
  [29.85, H_KNEEL], [30.25, H_FOREHEAD], [36.9, H_FOREHEAD], [37.5, H_LOOKPAPER], [39.2, H_LOOKPAPER], [39.6, H_KNEEL],
  [51.7, H_KNEEL], [52.5, H_PALM], [59.7, H_PALM], [60.5, H_REST], [62.5, H_REST], [62.9, H_REST_PAPER], [63.7, H_REST_PAPER], [64.4, H_CRY],
  [70.4, H_CRY], [71.4, H_KNEEL], [73.95, H_KNEEL], [74.25, H_CALMPALM], [75.9, H_CALMPALM], [76.4, H_KNEEL],
  [95.75, H_KNEEL], [96.45, H_HOLD], [101.9, H_HOLD], [102.3, H_HOLDSMILE], [104.5, H_HOLDSMILE], [105.2, H_HOLD], [107.4, H_HOLD], [109.9, H_SLUMP],
  [T_COLLAPSE, H_SLUMP, E.in(2)], [111.72, H_FALLMID, E.out(2)], [111.98, H_LAP],
  [140.3, H_LAP], [140.7, H_LAP_OPEN], [146.05, H_LAP_OPEN], [146.8, H_LAP_PALM],
];
const HIM_KEYS: Key[] = [
  [0, M_LIE], [12.4, M_LIE], [12.5, M_LIE_OPEN], [12.55, M_LIE_OPEN], [12.9, M_HANDDOWN], [13.3, M_REACHKNIFE], [13.8, M_KNIFECHEST],
  [16.0, M_KNIFECHEST], [18.8, M_SITAWAY], [20.55, M_SITAWAY], [21.1, M_SITHOOD],
  [27.82, M_SITHOOD, E.out(3)], [27.95, M_SLAP], [39.4, M_SLAP, E.out(3)], [39.6, M_PUSHED], [39.9, M_PUSHED], [40.5, M_UPRIGHT],
  [43.95, M_UPRIGHT, E.out(2)], [44.25, M_SHIELD], [47.95, M_SHIELD], [48.45, M_LOOKKNIFE],
  [51.93, M_LOOKKNIFE], [52.35, M_TURNMID], [52.85, M_PALM],
  [64.0, M_PALM], [64.4, M_HUM], [67.7, M_HUM], [68.3, M_PEER], [72.06, M_PEER, E.out(3)], [72.2, M_PEERWIDE], [72.35, M_BANG],
  [75.93, M_BANG], [76.2, M_SHOUT], [77.94, M_SHOUT], [78.3, M_LOOKHAND],
  [79.56, M_LOOKHAND], [79.95, M_GRAB, E.out(3)], [80.25, M_GRAB], [80.7, M_DIG],
  [85.7, M_DIG], [85.95, M_DIG2], [95.42, M_DIG2, E.out(3)], [95.8, M_REACH],
  [100.05, M_REACH], [100.25, M_TRY], [100.9, M_TRY], [101.1, M_REACH], [101.25, M_REACH], [101.4, M_TRY], [101.85, M_TRY], [102.05, M_REACH],
  [T_COLLAPSE, M_REACH], [111.72, M_CATCH], [111.98, M_CRADLE],
  [113.84, M_CRADLE, E.out(4)], [113.98, M_SHOUT2], [114.95, M_SHOUT2], [115.4, M_CRADLE], [116.0, M_CRADLE], [116.4, M_CRADLE_HOPE],
  [132.0, M_CRADLE_HOPE], [132.6, M_CRADLE_HUM], [139.0, M_CRADLE_HUM], [139.15, M_CRADLE], [140.7, M_CRADLE], [141.2, M_CRADLE_LOOK],
  [146.05, M_CRADLE_LOOK], [146.8, M_PALMDOWN],
];
const MOM_KEYS: Key[] = [
  [0, MOM_SIT], [7.7, MOM_SIT], [8.2, MOM_LEAN], [10.6, MOM_LEAN], [11.6, MOM_SIT],
  [46.1, MOM_SIT], [46.5, MOM_COVER], [48.5, MOM_COVER], [49.5, MOM_SIT],
  [104.5, MOM_SIT], [104.9, MOM_LOOKHAND], [105.6, MOM_LOOKHAND], [106.0, MOM_SIT],
  [117.25, MOM_SIT], [117.8, MOM_SHOUT],
];
const OLD_KEYS: Key[] = [
  [0, OLD_SIT], [45.8, OLD_SIT], [46.15, OLD_SHIELD], [47.6, OLD_SHIELD], [48.3, OLD_SIT],
  [104.9, OLD_SIT], [105.6, OLD_LEAN], [117.6, OLD_LEAN], [118.1, OLD_SHOUT],
];
const GIRL_KEYS: Key[] = [
  [0, GIRL_SCREAM], [90.35, GIRL_SCREAM], [90.6, GIRL_QUIET], [90.75, GIRL_QUIET], [91.05, GIRL_WALL],
];
const BOY_KEYS: Key[] = [[0, BOY_LISTEN], [89.95, BOY_LISTEN], [90.15, BOY_HUM]];

// ================= 唱歌的嘴 =================
const HER_LINES = LINES.slice(0, 43);
const HER_CHAR_T: number[] = HER_LINES.flatMap((l) => l.chars.map((c) => c.t));
const HER_CHAR_D: number[] = HER_LINES.flatMap((l) => l.chars.map((c) => c.d));
function lastIndexAtOrBefore(arr: number[], t: number) {
  let lo = 0;
  let hi = arr.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
/** 她唱到 t 为止唱了几个字 */
export const herSung = (t: number) => lastIndexAtOrBefore(HER_CHAR_T, t) + 1;
/** 唱字时嘴张开的程度 */
function singMouth(t: number): number {
  const i = lastIndexAtOrBefore(HER_CHAR_T, t);
  if (i < 0) return 0;
  const t0 = HER_CHAR_T[i];
  const d = Math.max(0.12, HER_CHAR_D[i]);
  const u = t - t0;
  if (u > d + 0.12) return 0;
  const open = 0.45 + 0.4 * hash2(i, 3);
  return open * (u < 0.05 ? u / 0.05 : u < d ? 1 - 0.25 * (u / d) : 0.75 * (1 - (u - d) / 0.12));
}
/** 她在唱（含句尾余音）的强度 0..1，用来点亮她的格子 */
export function singing(t: number): number {
  if (t < 15.85 || t > 112) return 0;
  const i = lastIndexAtOrBefore(HER_CHAR_T, t + 0.05);
  if (i < 0) return 0;
  const since = t - (HER_CHAR_T[i] + HER_CHAR_D[i]);
  return since < 0 ? 1 : Math.exp(-since * 0.9);
}
/** 副歌2 唱到最后，她越来越弱 */
export const weakness = (t: number) => E.smooth(prog(t, 104, 111.4));

// ================= 小动作 =================
const bump = (t: number, t0: number, dur: number) => (t > t0 - dur && t < t0 ? Math.sin(Math.PI * ((t - (t0 - dur)) / dur)) : 0);
const KNOCKS = [14.45, 14.72];
const BANGS = [72.5, 72.9, 73.3, 73.65];
export const TAPS = [138.51, 139.01];
export const KID_TAPS = [91.28, 91.5, 91.7, 91.9];

function blink(t: number, seed: number) {
  // 每 3–5 秒眨一次眼
  const period = 3.6 + hash2(seed, 1) * 1.5;
  const ph = (t + hash2(seed, 2) * period) % period;
  return ph < 0.12 ? 1 - Math.sin((ph / 0.12) * Math.PI) : 1;
}

export function herPose(t: number): Pose {
  const p = { ...track(HER_KEYS, t) };
  if (t >= 15.9 && t < 111.9) p.mouth = Math.max(p.mouth, singMouth(t) * (1 - 0.55 * weakness(t)));
  // 吸气
  p.mouth = Math.max(p.mouth, 0.25 * env(t, 15.55, 15.7, 15.8, 15.92), 0.25 * env(t, 71.6, 71.75, 71.9, 72.05));
  if (p.eye > 0.8) p.eye *= blink(t, 1);
  for (const k of KNOCKS) p.hf = { x: p.hf.x - 6 * bump(t, k, 0.14), y: p.hf.y };
  for (const k of TAPS) p.hn = { x: p.hn.x, y: p.hn.y - 4 * bump(t, k, 0.16) };
  // 醒来以后跟着他一起哼（尾奏第二遍）
  if (t > 141 && t < 148.2) p.hum = Math.max(p.hum, env(t, 141, 141.5, 147.5, 148.2));
  return p;
}

export function hisPose(t: number): Pose {
  const p = { ...track(HIM_KEYS, t) };
  if (p.eye > 0.8 && p.eye < 1.15) p.eye *= blink(t, 2);
  for (const k of BANGS) p.hf = { x: p.hf.x + 15 * bump(t, k, 0.2), y: p.hf.y };
  if (t > 81.8 && t < 95.4) {
    for (const k of DIG_TIMES) p.hn = { x: p.hn.x + 13 * bump(t, k, 0.3), y: p.hn.y - 3 * bump(t, k, 0.3) };
    if (t > 85.9) p.hf = { x: p.hf.x + 6 * Math.abs(Math.sin((t - 85.9) * Math.PI * 2)), y: p.hf.y + 5 * Math.sin((t - 85.9) * Math.PI * 4) };
  }
  if (t > 106.2 && t < 108) p.hn = { x: 937 + 8 * Math.abs(Math.sin((t - 106.2) * 9)), y: 1745 + 22 * Math.sin((t - 106.2) * 4.5) };
  if (t > 113.4 && t < 113.86) p.mouth = Math.max(p.mouth, 0.3 * env(t, 113.45, 113.6, 113.75, 113.86));
  // 哼歌：前奏、间奏、尾奏第一遍
  return p;
}

export function momPose(t: number): Pose {
  const p = { ...track(MOM_KEYS, t) };
  // 「念念」：两个字
  p.mouth = Math.max(p.mouth, 0.4 * env(t, 8.28, 8.33, 8.45, 8.52), 0.4 * env(t, 8.6, 8.65, 8.78, 8.86));
  if (t > 117.85) p.mouth = Math.max(p.mouth, 0.9 * env(t, 117.88, 117.95, 119.2, 119.5));
  if (p.eye > 0.7) p.eye *= blink(t, 3);
  return p;
}
export function oldPose(t: number): Pose {
  const p = { ...track(OLD_KEYS, t) };
  if (t > 118) p.mouth = Math.max(p.mouth, 0.9 * env(t, 118.15, 118.25, 119.4, 119.7));
  return p;
}
export const girlPose = (t: number): Pose => {
  const p = { ...track(GIRL_KEYS, t) };
  if (t < 90.4) p.mouth = 0.55 + 0.45 * Math.abs(Math.sin(t * 7.5));
  for (const k of KID_TAPS.slice(0, 2)) p.hf = { x: p.hf.x - 4 * bump(t, k, 0.12), y: p.hf.y };
  return p;
};
export const boyPose = (t: number): Pose => {
  const p = { ...track(BOY_KEYS, t) };
  for (const k of KID_TAPS.slice(2)) p.hf = { x: p.hf.x + 4 * bump(t, k, 0.12), y: p.hf.y };
  return p;
};

// ================= 东西 =================
export interface Prop {
  at: V2;
  angle: number;
  show: boolean;
}
/** 小刀 */
export function knife(t: number, him: Pose): Prop {
  const hand = () => {
    const k = skeleton(him);
    const a = Math.atan2(k.hn.y - k.en.y, k.hn.x - k.en.x);
    return { at: k.hn, angle: a };
  };
  if (t < 13.22) return { at: v(1001, 1816.5), angle: 0.12, show: true };
  if (t < 50.25) return { ...hand(), show: true };
  if (t < 50.45) {
    const h = hand();
    const p = E.in(2)(prog(t, 50.25, 50.45));
    return { at: lerpV(h.at, v(996, 1816.5), p), angle: lerp(h.angle, 0.1, p), show: true };
  }
  if (t < 52.2) return { at: v(996, 1816.5), angle: 0.1, show: true };
  if (t < 80.15) return { at: lerpV(v(996, 1816.5), v(946, 1816.5), E.out(2)(prog(t, 52.2, 52.6))), angle: 0.1 + 0.6 * prog(t, 52.2, 52.6), show: true };
  if (t < T_COLLAPSE) {
    const h = hand();
    return { ...h, angle: t > 80.6 ? Math.PI : h.angle, show: true };
  }
  return { at: v(960, 1816.5), angle: 2.9, show: true };
}
/** 写满歌词的那张纸（在她近侧的手里） */
export function paper(t: number, her: Pose): Prop {
  if (t < 15.25) return { at: v(0, 0), angle: 0, show: false };
  const k = skeleton(her);
  if (t < T_COLLAPSE) return { at: v(k.hn.x + 2, k.hn.y - 9), angle: -0.06, show: true };
  const p = E.in(2)(prog(t, T_COLLAPSE, T_COLLAPSE + 0.35));
  return { at: lerpV(v(k.hn.x + 2, k.hn.y - 9), v(884, 1815), p), angle: lerp(-0.06, 1.45, p), show: t < 113.0 };
}

// ================= 手背上的数字 =================
const HIS_SHOUT = LINES[43].chars.map((c) => c.t);
export const LAND_DELAY = 1.0;
const NEAR_NEIGHBORS: { c: number; r: number; t: number }[] = [];
export function herCount(t: number): number {
  if (t < 113) return 341 - herSung(t);
  let n = 0;
  for (const s of HIS_SHOUT) if (t >= s + LAND_DELAY) n++;
  for (const nb of NEAR_NEIGHBORS) for (let k = 0; k < 3; k++) if (t >= nb.t + k * 0.25 + 1.15) n++;
  n += Math.round((1000 - 3 - NEAR_NEIGHBORS.length * 3) * E.inOut(prog(t, 122.3, 129.7)));
  return Math.min(1000, n);
}
export function hisCount(t: number): number {
  if (t < 113) return 1000 + herSung(t);
  let n = 1341;
  for (const s of HIS_SHOUT) if (t >= s) n--;
  return n;
}
export function momCount(t: number) {
  let n = 12;
  if (t >= 8.3) n--;
  if (t >= 8.62) n--;
  for (const c of LINES[44].chars) if (t >= c.t) n--;
  return n;
}
export function oldCount(t: number) {
  let n = 5;
  for (let k = 0; k < 3; k++) if (t >= 118.2 + k * 0.45) n--;
  return n;
}
export const NAME_T = [8.3, 8.62];
export const NAME_LAND = [9.85, 10.25];
export const babyCount = (t: number) => 1000 + (t >= NAME_LAND[0] ? 1 : 0) + (t >= NAME_LAND[1] ? 1 : 0);
/** 小时候的她：一声声喊「妈妈」，数字一路往下掉，他哼起歌才停在 352 */
export const girlCount = (t: number) => Math.round(lerp(636, 352, E.out(1.6)(prog(t, 88.3, 90.4))) / 2) * 2;
/** 数字上一次变化的时刻（用来做跳一下的动画） */
export function herCountChanged(t: number): number {
  if (t < 113) {
    const i = lastIndexAtOrBefore(HER_CHAR_T, t);
    return i < 0 ? -9 : HER_CHAR_T[i];
  }
  let last = -9;
  for (const s of HIS_SHOUT) if (t >= s + LAND_DELAY) last = s + LAND_DELAY;
  if (t > 122.3 && t < 129.7) last = t - 0.01;
  return last;
}

// ================= 楼里的其他人 =================
export interface Npc {
  c: number;
  r: number;
  k: number;
  wake: number;
  shout: number;
}
export const NPCS: Npc[] = [];
(function buildNpcs() {
  const near = [
    { c: 2, r: 12 }, { c: 5, r: 12 }, { c: 2, r: 11 }, { c: 5, r: 13 }, { c: 4, r: 11 }, { c: 3, r: 13 }, { c: 2, r: 13 }, { c: 5, r: 11 },
  ];
  for (let r = 0; r < NR; r++) {
    for (let c = 0; c < NC; c++) {
      const skip = (c === HER.c && r === HER.r) || (c === HIM.c && r === HIM.r) || (c === MOM.c && r === MOM.r) || (c === OLD.c && r === OLD.r) || (c === ASH_CELL.c && r === ASH_CELL.r);
      if (skip) continue;
      const d = Math.abs(c - 3.5) + Math.abs(r - 12);
      const ni = near.findIndex((n) => n.c === c && n.r === r);
      const shout = ni >= 0 ? 118.55 + ni * 0.24 : 121.95 + d * 0.12 + hash2(c, r) * 0.35;
      NPCS.push({ c, r, k: Math.floor(hash2(c * 3, r * 5) * 97), wake: 44.1 + d * 0.38 + hash2(r, c) * 0.6, shout });
      if (ni >= 0) NEAR_NEIGHBORS.push({ c, r, t: shout });
    }
  }
})();
/** 这一格里的人在 t 时的姿势 */
export function npcPose(n: Npc, t: number): Pose {
  const x = cellX(n.c);
  const fy = floorY(n.r);
  const h = hash2(n.c, n.r);
  const right = h > 0.5;
  const hipX = right ? x + 75 + h * 40 : x + CELL_W - 75 - (1 - h) * 40;
  const sleep = P({
    hip: v(hipX, fy - 12), torso: right ? 0.08 : Math.PI - 0.08, neck: 0, face: right ? -1 : 1,
    hn: v(hipX + (right ? 30 : -30), fy - 8), hf: v(hipX + (right ? 36 : -36), fy - 4),
    fn: v(hipX + (right ? -66 : 66), fy - 4), ff: v(hipX + (right ? -62 : 62), fy - 3),
    kn: v(hipX + (right ? -30 : 30), fy - 34), kf: v(hipX + (right ? -28 : 28), fy - 32), eye: 0,
  });
  const toRight = n.c <= HER.c;
  const face = toRight ? 1 : -1;
  const dy = n.r - HER.r;
  const look = clamp(dy * 0.22, -0.6, 0.6);
  const sx = toRight ? x + CELL_W - 70 : x + 70;
  const listen = P({
    hip: v(sx, fy - 12), torso: toRight ? -1.25 : -1.89, neck: toRight ? -look : look, face,
    hn: v(sx + face * 40, fy - 22), hf: v(sx + face * 44, fy - 16),
    fn: v(sx + face * 52, fy - 4), ff: v(sx + face * 56, fy - 3), kn: v(sx + face * 36, fy - 40), kf: v(sx + face * 40, fy - 38),
    eye: 1,
  });
  const shoutP = { ...listen, neck: (toRight ? -look : look) * 1.4 + (toRight ? -0.25 : 0.25), mouth: 0.9, brow: 0.8 };
  let p: Pose;
  if (t < n.wake) p = sleep;
  else if (t < n.wake + 0.9) p = mixPose(sleep, listen, E.smooth(prog(t, n.wake, n.wake + 0.9)));
  else if (t < n.shout - 0.2) p = listen;
  else p = mixPose(listen, shoutP, E.smooth(prog(t, n.shout - 0.2, n.shout)));
  if (t > n.shout + 1.4) p = { ...p, mouth: 0.9 * (1 - prog(t, n.shout + 1.4, n.shout + 2)) };
  return p;
}
/** 这一格因为有人喊「活下去」而亮起来的程度 */
export function cellLit(n: Npc, t: number) {
  if (t < n.shout) return 0;
  return E.smooth(prog(t, n.shout, n.shout + 0.5)) * (1 - 0.45 * prog(t, n.shout + 2, n.shout + 5));
}

// ================= 发光的字 =================
export interface Glyph {
  ch: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  /** w：世界坐标；s：屏幕坐标（设计像素） */
  sp: "w" | "s";
  /** warm：说出口的字；ghost：他无声地说的字（不发光） */
  kind: "warm" | "ghost";
  light: number;
}
type From = "mouth" | "crack" | "hole" | V2;
type To = "crack" | "fall" | "stuck" | "up" | "fade" | V2;
interface Place {
  sp: "w" | "s";
  x: number;
  y: number;
  size: number;
  from?: From;
  to?: To;
  fade?: number;
}
const S_Y = 1660;
const S_SIZE = 62;
const SCR = (y = S_Y, size = S_SIZE): Place => ({ sp: "s", x: 540, y, size, to: "up" });
const PLACES: Place[] = [
  { sp: "w", x: 870, y: 1742, size: 8.5, from: "mouth", to: "crack" }, // 0 反乌托邦中的争夺
  { sp: "w", x: 875, y: 1738, size: 8.5, from: "mouth", to: "crack" }, // 1 把愿望敲碎成粉末
  { sp: "w", x: 1010, y: 1714, size: 9.5, from: "crack", to: "fall" }, // 2 心灵也被挂上门锁
  { sp: "w", x: 1010, y: 1716, size: 9.5, from: "crack", to: "fall", fade: 0.75 }, // 3 看不清灯火
  { sp: "w", x: 868, y: 1714, size: 8.5, from: "mouth", to: "crack" }, // 4 但我还想做些什么
  { sp: "w", x: 872, y: 1712, size: 8, from: "mouth", to: "crack" }, // 5 其实还想要说很多
  { sp: "w", x: 880, y: 1716, size: 9, from: "mouth", to: "stuck" }, // 6 请你等等我
  { sp: "w", x: 878, y: 1718, size: 9, from: "mouth", to: "stuck" }, // 7 请你等等我
  SCR(), SCR(), SCR(), // 8–10 闪回：写歌
  SCR(), // 11 顺便拯救我自己
  { sp: "w", x: 1004, y: 1722, size: 15, from: "crack", to: "fall" }, // 12 只因为
  { sp: "w", x: 1004, y: 1708, size: 9, from: "crack", to: "fall" }, // 13 你那渴望自由的心脏
  { sp: "w", x: 975, y: 1700, size: 5.6, from: "crack", to: "fade" }, // 14 困在一张没空隙的网
  { sp: "w", x: 975, y: 1700, size: 5.6, from: "crack", to: "fade" }, // 15 我们的周围并非没光亮
  SCR(1600), // 16 只是太耀眼将我们灼伤
  { sp: "w", x: 1000, y: 1716, size: 7.5, from: "crack", to: "fall" }, // 17 在这个世界难免会迷茫
  { sp: "w", x: 1000, y: 1722, size: 6.4, from: "crack", to: "fall" }, // 18 但别再把小刀带在身上
  { sp: "w", x: 925, y: 1722, size: 6, from: "mouth", to: "fade" }, // 19 至少我还在为你而歌唱
  { sp: "w", x: 925, y: 1726, size: 5.6, from: "mouth", to: "fade" }, // 20 在黑暗漫长的反乌托邦
  SCR(1520), // 21 即便我们都在这黑暗漫长的反乌托邦（两行，见下）
  { sp: "w", x: 985, y: 1714, size: 7.5, from: "crack", to: "fall" }, // 22 忍着想要挣脱的生活
  { sp: "w", x: 872, y: 1712, size: 7.2, from: "mouth", to: "crack" }, // 23 做出不想做的承诺
  SCR(), SCR(), SCR(), SCR(), // 24–27
  SCR(), SCR(), // 28–29 请你等等我（他无声地说，另加 ghost）
  SCR(), SCR(), SCR(), // 30–32
  { sp: "w", x: 975, y: 1714, size: 7, from: "hole", to: "fall" }, // 33 同时拯救我自己
  { sp: "w", x: 905, y: 1720, size: 9, from: "mouth", to: "fade" }, // 34 就请你
  { sp: "w", x: 875, y: 1716, size: 7, from: "mouth", to: "fade" }, // 35 放心大胆更妄为肆意
  SCR(470), // 36 迈步向前别害怕失去
  SCR(), // 37 没有犯下任何错的你
  { sp: "w", x: 893, y: 1712, size: 5.2, from: "mouth", to: "fade", fade: 0.8 }, // 38 在我心里只用做自己
  SCR(), // 39 这段胡乱拼凑的词语
  { sp: "w", x: 897, y: 1712, size: 6.5, from: "mouth", to: "fade", fade: 0.62 }, // 40 如果伤到你也请你忘记
  { sp: "w", x: 893, y: 1716, size: 5.4, from: "mouth", to: "fade", fade: 0.45 }, // 41 但若你又找不到意义
  { sp: "w", x: 895, y: 1716, size: 6.8, from: "mouth", to: "up", fade: 0.4 }, // 42 希望这首歌能被记起
];
const CRACK_OUT: V2 = v(932, 1768);
const CRACK_IN: V2 = v(919, 1768);

function placeGlyphs(out: Glyph[], i: number, t: number, her: (t: number) => Pose) {
  const line = LINES[i];
  const pl = PLACES[i];
  const n = line.chars.length;
  const next = LINES[i + 1]?.start ?? line.end + 2;
  const lineEnd = line.chars[n - 1].t + line.chars[n - 1].d;
  if (t < line.start - 0.1 || t > Math.max(lineEnd, next) + 2.5) return;
  const twoRows = i === 21;
  for (let j = 0; j < n; j++) {
    const ch = line.chars[j];
    let sx: number;
    let sy: number;
    if (twoRows) {
      const row = j < 7 ? 0 : 1;
      const m = row === 0 ? 7 : n - 7;
      const jj = row === 0 ? j : j - 7;
      sx = pl.x + (jj - (m - 1) / 2) * pl.size * 1.06;
      sy = pl.y + row * pl.size * 1.35;
    } else {
      sx = pl.x + (j - (n - 1) / 2) * pl.size * 1.06;
      sy = pl.y;
    }
    const appear = prog(t, ch.t - 0.03, ch.t + 0.2);
    if (appear <= 0) continue;
    let from: V2;
    if (pl.sp === "s") from = v(sx, sy + 26);
    else if (pl.from === "mouth") from = skeleton(her(ch.t)).mouth;
    else if (pl.from === "crack" || pl.from === "hole") from = CRACK_OUT;
    else from = pl.from ?? v(sx, sy);
    const leaveStart = Math.min(lineEnd + 0.45, next - 0.08) + j * 0.035;
    const to = pl.to ?? "fade";
    const dur = to === "crack" ? 0.9 : to === "fall" ? 1.3 : to === "stuck" ? 0.5 : 0.8;
    const leave = prog(t, leaveStart, leaveStart + dur);
    let x: number;
    let y: number;
    let a = E.out(2)(appear);
    let size = pl.size * (0.55 + 0.45 * E.out(3)(appear));
    const fade = (pl.fade ?? 1) * (i === 42 ? 1 - j * 0.08 : 1) * (1 - 0.35 * weakness(ch.t));
    if (leave <= 0) {
      const p = E.out(3)(appear);
      x = lerp(from.x, sx, p);
      y = lerp(from.y, sy, p);
    } else {
      const p = E.in(2)(leave);
      if (to === "crack") {
        x = lerp(sx, CRACK_IN.x, p);
        y = lerp(sy, CRACK_IN.y + (j - n / 2) * 1.2, p);
        size *= 1 - 0.75 * p;
        a *= 1 - p * p;
      } else if (to === "fall") {
        x = sx + Math.sin(j * 1.7 + leave * 3) * 6 * leave;
        y = sy + 70 * p;
        size *= 1 - 0.5 * p;
        a *= 1 - p;
      } else if (to === "stuck") {
        x = lerp(sx, 913 - (j % 2) * 4, p);
        y = lerp(sy, 1752 + j * 7, p);
        size *= 1 - 0.35 * p;
        a *= 1 - 0.65 * p;
        // 堆在缝前慢慢暗下去，回忆开始前全部熄灭
        a *= 1 - prog(t, 31.4, 32.1);
      } else if (to === "up") {
        x = sx;
        y = sy - (pl.sp === "s" ? 40 : 20) * p;
        a *= 1 - p;
        if (i === 42 && j === n - 1) {
          // 最后一个字「起」飘起来，灭了
          y = sy - 26 * E.out(2)(prog(t, ch.t + 0.25, 112.0));
          a = E.out(2)(appear) * (1 - E.in(1.5)(prog(t, 111.6, 111.98)));
        }
      } else {
        x = sx;
        y = sy - 6 * p;
        a *= 1 - p;
      }
      if (to !== "stuck" && leave >= 1 && !(i === 42 && j === n - 1)) continue;
    }
    if (i === 42 && j === n - 1 && t > 111.98) continue;
    out.push({ ch: ch.c, x, y, size, alpha: clamp(a * fade), sp: pl.sp, kind: "warm", light: pl.sp === "w" ? clamp(a * fade) : 0 });
  }
}

/** 他无声地跟着说「请你等等我」：字是灰的、不发光 */
function ghostGlyphs(out: Glyph[], i: number, t: number) {
  const line = LINES[i];
  const n = line.chars.length;
  const end = line.chars[n - 1].t + line.chars[n - 1].d;
  for (let j = 0; j < n; j++) {
    const ch = line.chars[j];
    const a = prog(t, ch.t - 0.02, ch.t + 0.18) * (1 - prog(t, end + 0.3, end + 0.9));
    if (a <= 0) continue;
    const sx = 950 + (j - (n - 1) / 2) * 7 * 1.08;
    const from = skeleton(hisPose(ch.t)).mouth;
    const p = E.out(3)(prog(t, ch.t - 0.02, ch.t + 0.2));
    out.push({ ch: ch.c, x: lerp(from.x, sx, p), y: lerp(from.y, 1716, p), size: 7 * (0.6 + 0.4 * p), alpha: a * 0.85, sp: "w", kind: "ghost", light: 0 });
  }
}

/** 他喊出的「活下去」：三个大字从他嘴里冲出来，落进她手里 */
function hisShout(out: Glyph[], t: number) {
  const line = LINES[43];
  for (let j = 0; j < 3; j++) {
    const tc = line.chars[j].t;
    if (t < tc - 0.02 || t > tc + LAND_DELAY + 0.1) continue;
    const mouth = skeleton(hisPose(tc)).mouth;
    const slot = v(948 + (j - 1) * 14, 1722);
    const hand = skeleton(herPose(t)).hn;
    const a1 = prog(t, tc - 0.02, tc + 0.2);
    const fly = prog(t, tc + 0.55, tc + LAND_DELAY);
    const pos = fly > 0 ? lerpV(slot, hand, E.in(2)(fly)) : lerpV(mouth, slot, E.out(3)(a1));
    const size = 13 * (0.5 + 0.5 * E.out(3)(a1)) * (1 - 0.6 * fly);
    const alpha = a1 * (1 - E.in(3)(fly));
    out.push({ ch: line.chars[j].c, x: pos.x, y: pos.y, size, alpha, sp: "w", kind: "warm", light: alpha * 1.6 });
  }
}

/** 「念念」：妈妈叫婴儿的名字 */
function nameGlyphs(out: Glyph[], t: number) {
  if (t < 8.2 || t > 11.4) return;
  const mouth = skeleton(momPose(8.4)).mouth;
  const baby = v(842, 1638);
  ["念", "念"].forEach((ch, j) => {
    const t0 = NAME_T[j];
    const a = prog(t, t0 - 0.02, t0 + 0.25);
    if (a <= 0) return;
    const fly = E.inOut(prog(t, t0 + 0.2, NAME_LAND[j]));
    const slot = v(mouth.x + 4 + j * 7, mouth.y - 10);
    const pos = lerpV(lerpV(mouth, slot, E.out(3)(a)), baby, fly);
    const alpha = a * (1 - E.in(3)(prog(t, NAME_LAND[j] - 0.15, NAME_LAND[j] + 0.25)));
    out.push({ ch, x: pos.x, y: pos.y, size: 6 * (1 - 0.4 * fly), alpha, sp: "w", kind: "warm", light: alpha * 1.2 });
  });
}

/** 闪回：小女孩一声声喊「妈妈」 */
function mamaGlyphs(out: Glyph[], t: number) {
  if (t < 88.2 || t > 91.2) return;
  const g = skeleton(girlPose(88.5));
  for (let k = 0; k < 16; k++) {
    const t0 = 88.25 + k * 0.13;
    if (t0 > 90.35) break;
    const age = t - t0;
    if (age < 0 || age > 1.6) continue;
    const ang = -2.2 + hash2(k, 4) * 2.4;
    const r = 8 + age * (34 + hash2(k, 7) * 30);
    const p = v(g.mouth.x + Math.cos(ang) * r, g.mouth.y + Math.sin(ang) * r - age * 12);
    const a = prog(age, 0, 0.1) * (1 - prog(age, 0.7, 1.6)) * (t > 90.35 ? 1 - prog(t, 90.35, 90.9) : 1);
    for (let j = 0; j < 2; j++) out.push({ ch: "妈", x: p.x + (j - 0.5) * 6.4, y: p.y, size: 6, alpha: a, sp: "w", kind: "warm", light: a * 0.9 });
  }
}

/** 邻居们喊的「活下去」，和整栋楼一起流向她的光 */
export interface Spark {
  x: number;
  y: number;
  a: number;
  r: number;
}
const TARGET: V2 = v(946, 1792);
export function neighborStreams(t: number, glyphs: Glyph[], sparks: Spark[]) {
  if (t < 117.7 || t > 128) return;
  // 妈妈和老人的字（近景读得清）
  const mom = skeleton(momPose(118.0)).mouth;
  const old = skeleton(oldPose(118.4)).mouth;
  const shouters = [
    { from: mom, t0: 117.9, slot: v(860, 1622) },
    { from: old, t0: 118.25, slot: v(1045, 1852) },
  ];
  for (const s of shouters) {
    for (let j = 0; j < 3; j++) {
      const tc = s.t0 + j * 0.42;
      const a1 = prog(t, tc - 0.02, tc + 0.2);
      if (a1 <= 0) continue;
      const fly = prog(t, tc + 0.6, tc + 1.5);
      if (fly >= 1) continue;
      const slot = v(s.slot.x + (j - 1) * 10, s.slot.y);
      const pos = fly > 0 ? lerpV(slot, TARGET, E.in(2)(fly)) : lerpV(s.from, slot, E.out(3)(a1));
      const ch = "活下去"[j];
      glyphs.push({ ch, x: pos.x, y: pos.y, size: 9 * (1 - 0.5 * fly), alpha: a1 * (1 - fly * fly), sp: "w", kind: "warm", light: a1 * 1.1 });
    }
  }
  // 其他格子：每人三点光流过来
  for (const n of NPCS) {
    if (t < n.shout || t > n.shout + 2.6) continue;
    const c = cellCenter(n.c, n.r);
    const from = v(c.x, c.y - 10);
    for (let k = 0; k < 3; k++) {
      const t0 = n.shout + k * 0.22;
      const p = prog(t, t0, t0 + 1.25);
      if (p <= 0 || p >= 1) continue;
      const pos = lerpV(from, TARGET, E.in(2.2)(p));
      sparks.push({ x: pos.x + Math.sin(p * 9 + k) * 12 * (1 - p), y: pos.y + Math.cos(p * 7 + k) * 10 * (1 - p), a: Math.sin(Math.PI * p), r: 9 });
    }
  }
}

export function glyphsAt(t: number): { glyphs: Glyph[]; sparks: Spark[] } {
  const glyphs: Glyph[] = [];
  const sparks: Spark[] = [];
  if (t > 15.8 && t < 113) for (let i = 0; i < 43; i++) placeGlyphs(glyphs, i, t, herPose);
  if (t > 83.7 && t < 88) {
    ghostGlyphs(glyphs, 28, t);
    ghostGlyphs(glyphs, 29, t);
  }
  hisShout(glyphs, t);
  nameGlyphs(glyphs, t);
  mamaGlyphs(glyphs, t);
  neighborStreams(t, glyphs, sparks);
  return { glyphs, sparks };
}

/** 她指尖化成灰的程度（静音那 1.5 秒），他开口后退回去 */
export const ashAmount = (t: number) => E.smooth(prog(t, 112.1, 113.85)) * (1 - E.smooth(prog(t, 114.9, 115.8)));

/** 洞里透过来的光有多大 */
export const holeLight = (t: number) => clamp(holeRadius(t) / 12);
export { WALL_X, HOLE_Y };
