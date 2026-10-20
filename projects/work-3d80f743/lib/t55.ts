// 五⑤ 最后一镜：落回街上。时刻、她往下落的路线、落在哪。单独放一个文件：lib/dive.ts（她）、lib/coatoff.ts（他在她怀里）、
// lib/link.ts / lib/morning8.ts（人链散开、落在她身边）、lib/land.ts（镜头、淡出）、scenes/act7.ts 都要用。
// 这里写的是模块时间：act7 图层的 offset 比作品时间多 20 秒（150.02 在作品里是 130.02）。
//
// 2026-10-20 全片重排以后，五①–④ 挪进了四声「活下去」，尾奏（作品 129.87–148）整段留给这一镜，一镜到底、按真实时间演：
// 「在这反乌托邦里」起她抱着他慢慢往下落，人链从上往下一个个松手，像一朵花往下开；镜头一路退到整座城——砖那团暖光像一盏灯
// 从白的边上落回城里，松了手的人一个个先落回街上；快到街面时镜头推下去，158.02（作品 138.02，小节线）她光着脚落在坑边，
// 她那双铁靴还立在坑里；千斤、周磊走过来把手放在她肩上、他背上；她低头看了一眼坑里的空铁靴，再抬起头；镜头低下来到她光着的脚，
// 往前一步，168.52「咚」（作品 148.52，音乐 148.0 停了以后）；淡出到 172（作品 152）。
// 原来尾奏只剩 4 秒，往下落的那 5 秒跳过去（溶到街上，故事时间比画面时间晚 5 秒）；现在不跳了。

type V2 = [number, number];

export const LAND_T = {
  start: 150.02,
  /** 老钟先松开他的脚踝，下面的人从上往下一个个松手（往两边飘开，像一朵花往下开） */
  zhongRelease: 150.3,
  release0: 150.45,
  releaseStep: 0.15,
  /** 镜头退到整座城 */
  wide0: 150.06,
  wide1: 153.7,
  /** 快到街面时往下推，落在一群人身上 */
  near0: 155.9,
  near1: 158.8,
  /** 快落地：还抱着他，两条腿往下伸 */
  legs0: 157.0,
  /** 光着脚落在街上（作品 138.02，小节线；膝盖一软） */
  land: 158.02,
  /** 千斤、周磊走过来，把手放在她肩上、他背上（作品 140.5、141.0） */
  walk0: 159.55,
  hand1: 160.5,
  hand2: 161.0,
  /** 她低头看了一眼坑里那双空铁靴（作品 144.0），再抬起头看着前面（作品 145.3） */
  boots0: 164.0,
  look1: 165.3,
  /** 镜头低下来到她光着的脚（作品 145.9–147.3） */
  low0: 165.9,
  low1: 167.3,
  /** 抬脚往前一步，「咚」（作品 148.52：音乐 148.0 停了以后） */
  step0: 167.95,
  step: 168.52,
  /** 淡出（作品 150.4–152） */
  fade0: 170.4,
  end: 172.0,
};
/** 画面时间 → 故事时间（一镜到底，不再跳过去；留着这个名字给 scenes/act7.ts 用） */
export const storyT = (t: number) => t;
/** 第 i 个人（lib/link.ts 的 MEMBERS：周磊、千斤、阿满、老太太、年轻人、大叔、女学生）松手的时刻：从上往下 */
export const releaseOf = (i: number, _n: number) => LAND_T.release0 + LAND_T.releaseStep * i;
/** 第 i 个人落回街上的时刻：吊得低的先落地（最下面的女学生 154.9），越往上越晚，都在她之前 */
export const touchOf = (i: number, n: number) => 154.9 + 0.26 * (n - 1 - i);
/** 老钟（吊在最上面）最后落地 */
export const ZHONG_TOUCH = 156.75;

/** 150.02 时她胸口在哪、他（根）在她胸口的哪里（按五④算出来的：lib/dive.ts、lib/coatoff.ts） */
export const HER_C0: V2 = [-2278.2, -8893.4];
export const KID_REL: V2 = [58.2, 233.1];
/** 她落在哪（根，光着的脚）：坑的右边，她那双铁靴立在坑里（往左 240） */
export const HER_LAND: V2 = [-2900, 10];
/** 站着时胸口在根的哪里 */
export const STAND_CHEST: V2 = [7.6, -382.8];
/** 往前那一步身子挪多远（按后脚钉在地上、两条腿的角度算出来的，他在她怀里跟着一样挪） */
export const STEP_DX = 54;

/**
 * 五⑤ 她胸口在哪：抱着他从白的边上落回街上——开头几乎不动（人链在她脚下一个个松手），越落越快，到一半最快（每秒约 2000，
 * 这时镜头在整座城上，画面上走得不快），之后越落越慢，158.02 光着脚落地（落地那一刻速度是 0，膝盖一软由姿势给）；
 * 往左飘 610 到坑的右边；往前一步时跟着往前
 */
export function landChest(s: number): V2 {
  const T = LAND_T;
  const end: V2 = [HER_LAND[0] + STAND_CHEST[0], HER_LAND[1] + STAND_CHEST[1]];
  if (s >= T.land) {
    const step = STEP_DX * smooth(ph(s, T.step0, T.step));
    return [end[0] + step, end[1]];
  }
  const ky = smoother(ph(s, T.start, T.land));
  const kx = smooth(ph(s, T.start + 0.8, T.land - 1.4));
  return [HER_C0[0] + (end[0] - HER_C0[0]) * kx, HER_C0[1] + (end[1] - HER_C0[1]) * ky];
}
const ph = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (x: number) => x * x * (3 - 2 * x);
const smoother = (x: number) => x * x * x * (x * (6 * x - 15) + 10);
