// 五③ 尾奏第三、四小节（140.02–144.02；142.02 小节线）的时刻和人链往上升多少。单独放一个文件：lib/coatoff.ts（他往上升、
// 往她那边飞）、lib/morning8.ts（老钟被抓住脚踝）、lib/link.ts（街上的人跑过来、一个抓住一个、镜头）都要用。

export const LINK_T = {
  start: 140.02,
  /** 小节线：站着看的人一下子都朝老钟脚下跑过去 */
  run0: 140.02,
  /**
   * 一个抓住上一个人的脚踝：周磊抓住老钟、千斤、阿满、老太太（年轻人把她托上去）、年轻人，一拍一个；
   * 前奏里被她拽下来的大叔、女学生从街两头跑来，半拍一个，越接越快
   */
  grabs: [141.02, 141.52, 142.02, 142.52, 143.02, 143.27, 143.52],
  /** 年轻人蹲下扶住老太太的腰、把她往上托 */
  boost0: 142.12,
  lift0: 142.25,
  end: 144.02,
};

/** smoothstep 从 a 涨到 b 的那条曲线，到 t 为止的面积（秒） */
function ssArea(t: number, a: number, b: number) {
  if (t <= a) return 0;
  const w = b - a;
  if (t >= b) return t - a - w / 2;
  const u = (t - a) / w;
  return w * (u * u * u - (u * u * u * u) / 2);
}

/** 人链比五②多升多少，不算接上一个人时往下坠的那几下（镜头跟它走） */
export function linkLiftSmooth(t: number) {
  if (t <= LINK_T.start) return 0;
  // 周磊抓住以后：每拍接上一个人、升一节（每秒多 900）；最后两个人半拍一个，再快一倍；最后一个人抓住以后整条人链离开街面，越升越快
  return 900 * ssArea(t, 140.95, 141.35) + 1000 * ssArea(t, 142.9, 143.15) + 800 * ssArea(t, 143.55, 144.1);
}

/** 人链比五②多升多少：每接上一个人，整条人链往下一坠再接着往上（多了一个人的分量） */
export function linkLift(t: number) {
  let r = linkLiftSmooth(t);
  for (const g of LINK_T.grabs) {
    const e = t - g;
    if (e > 0) r -= 30 * Math.exp(-e / 0.3) * Math.sin(Math.min(Math.PI, e * 9));
  }
  return r;
}

/** 他往她那边（左上方）飞：五②被风往右带，五③起慢慢掉头往左，越飞越偏左 */
export function linkDX(t: number) {
  return -140 * ssArea(t, 140.5, 142.5);
}
