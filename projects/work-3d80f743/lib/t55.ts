// 五⑤ 最后一镜（148.02 起；150.02 小节线；音乐 148 起淡出、152 停，片子到 154）：落回街上。时刻、她往下落的路线、落在哪。
// 单独放一个文件：lib/dive.ts（她）、lib/coatoff.ts（他在她怀里）、lib/link.ts / lib/morning8.ts（人链散开、落在她身边）、
// lib/land.ts（镜头、溶、淡出）、scenes/act7.ts 都要用。
//
// 「故事时间」：天上往下落的那一大段跳过去——溶到街上的时候同时画天上（故事时间 = 画面时间）和街上（故事时间 = 画面时间 + JUMP），
// 溶完以后整个画面都按故事时间画。下面写着「故事时间」的时刻都是这样算的。

type V2 = [number, number];

export const LAND_T = {
  start: 148.02,
  /**
   * 天上：老钟先松开他的脚踝，下面拉着老钟的人跟着一起荡开，再从上往下一个个松手（每个隔 0.1 秒）——往两边散开、慢慢飘下去，
   * 像一朵花往下开（从最下面松起的话镜头只看得见上面几个人，他们到溶以前才松，看不出散开）
   */
  zhongRelease: 148.3,
  release0: 148.4,
  releaseStep: 0.1,
  /** 溶到街上（画面时间） */
  dis0: 149.62,
  dis1: 150.02,
  JUMP: 5,
  // ——— 以下是故事时间（画面时间 + 5） ———
  /** 溶的时候街上从这一刻起：她抱着他还在街面上方，慢慢落下来 */
  street0: 154.62,
  /** 光着脚落在街上（画面 150.5） */
  land: 155.5,
  /** 千斤、周磊走过来，把手放在她肩上（画面 151.05、151.35） */
  walk0: 155.6,
  hand1: 156.05,
  hand2: 156.35,
  /** 镜头低下来到她脚上（画面 151.62–152.3） */
  low0: 156.62,
  low1: 157.3,
  /** 抬脚往前一步，「咚」（画面 152.4，音乐停了以后） */
  step0: 156.98,
  step: 157.4,
  /** 淡出（画面 153.4–154） */
  fade0: 158.4,
  end: 159.0,
};
/** 画面时间 → 故事时间（溶完以后跳过往下落的那 5 秒） */
export const storyT = (t: number) => (t >= LAND_T.dis1 ? t + LAND_T.JUMP : t);
/** 第 i 个人（lib/link.ts 的 MEMBERS：周磊、千斤、阿满、老太太、年轻人、大叔、女学生）松手的时刻：从上往下 */
export const releaseOf = (i: number, _n: number) => LAND_T.release0 + LAND_T.releaseStep * i;

/** 148.02 时她胸口在哪、他（根）在她胸口的哪里（按五④算出来的：lib/dive.ts、lib/coatoff.ts） */
export const HER_C148: V2 = [-2278.2, -8893.4];
export const KID_REL: V2 = [58.2, 234.8];
/** 她落在哪（根，光着的脚）：坑的右边，她那双铁靴立在坑里（往左 240） */
export const HER_LAND: V2 = [-2900, 10];
/** 站着时胸口在根的哪里 */
export const STAND_CHEST: V2 = [7.6, -382.8];
/** 往前那一步身子挪多远（按后脚钉在地上、两条腿的角度算出来的，他在她怀里跟着一样挪） */
export const STEP_DX = 54;

/** smoothstep 从 a 涨到 b 的那条曲线，到 t 为止的面积（秒） */
function ssArea(t: number, a: number, b: number) {
  if (t <= a) return 0;
  const w = b - a;
  if (t >= b) return t - a - w / 2;
  const u = (t - a) / w;
  return w * (u * u * u - (u * u * u * u) / 2);
}
/** 三次 Hermite（一维） */
function herm(a: number, va: number, b: number, vb: number, dt: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * dt * va + (-2 * u3 + 3 * u2) * b + (u3 - u2) * dt * vb;
}

/**
 * 五⑤ 她胸口在哪（故事时间）：天上抱着他慢慢往下落（越落越快一点，到每秒 380，往左偏一点）；跳过去以后在街面上方 480，
 * 越落越慢，155.5 光着脚落地；往前一步时跟着往前
 */
export function landChest(s: number): V2 {
  const T = LAND_T;
  if (s < T.street0 - 1) return [HER_C148[0] - 24 * ssArea(s, T.start, 149.6), HER_C148[1] + 380 * ssArea(s, T.start, 149.3)];
  const end: V2 = [HER_LAND[0] + STAND_CHEST[0], HER_LAND[1] + STAND_CHEST[1]];
  const T1 = T.land - T.street0;
  const u = Math.min(1, Math.max(0, (s - T.street0) / T1));
  const step = STEP_DX * smooth(ph(s, T.step0, T.step));
  return [end[0] + step, herm(end[1] - 480, 450, end[1], 0, T1, u)];
}
const ph = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (x: number) => x * x * (3 - 2 * x);
