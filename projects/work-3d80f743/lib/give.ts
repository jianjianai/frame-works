// 第二幕⑪「妄想用它拯救你」（35.88–37.8，时间见 lib/roof.ts 的 GIVE_T）：这一镜的镜头、砖的暖光。
// 2026-10-20 改：回到楼顶上两个人抱着坐着的那一刻（和⑧最后同一个样子、同一个取景），沉沉从外套兜里掏出「活下去」放进千斤手里，
// 砖一沉、暖起来，千斤哭着笑了，沉沉歪过头靠着她笑。两个人、砖都由 lib/roof.ts 画（抱着的画法接着⑧）。
// 镜头（「交出一样重要的东西」）：切过来就是⑧最后那个两张脸的近景，屏着气几乎不动；她掏砖时柔和起步往下落到两个人中间、
// 跟着砖推近（中心就是砖，越推越慢）；放进手里砖一沉，镜头跟着一沉；砖暖起来以后往上抬到千斤哭着笑的脸，往后舒一口气。
// （原来是她抱着砖从最高那栋楼的楼顶跳下来、跑到漂成风筝的千斤跟前递给她，2026-10-20 换掉）

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { drawGlow } from "./world";
import { GIVE_T, HUG_T, type makeRoof } from "./roof";

type V2 = [number, number];

export function makeGive(roof: ReturnType<typeof makeRoof>) {
  const T = GIVE_T;
  /** 沉沉和千斤都由 lib/roof.ts 画（⑪ 还抱在一起） */
  const draw = (_g: CanvasRenderingContext2D, _t: number, _z: number) => {};
  /** 砖暖起来时漫开的一团光（画在蒙色的人和夜色上面）；照在千斤脸上 */
  const drawGlowOver = (g: CanvasRenderingContext2D, t: number) => {
    const w = roof.brickWarm(t);
    const b = roof.qjBrickAt(t);
    if (!b || w <= 0.01) return;
    // 光从砖的四周漫出来（中心不压在字上，字看得清）
    drawGlow(g, b[0], b[1] + 30, 110 + 80 * w, 0.4 * w);
    drawGlow(g, b[0], b[1] - 80, 240 + 120 * w, 0.24 * w);
  };

  /** 两张脸中间（⑧ 最后那个取景按它算） */
  const facesMid = (t: number): V2 => {
    const [f1, f2] = roof.facesAt(t);
    return [(f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2];
  };
  /**
   * ⑪ 的镜头（情绪运镜「交出一样重要的东西」，不切）：切过来是⑧最后那个两张脸的近景，屏着气几乎不动；
   * 她伸手掏砖起柔和起步、一路减速地推近，推镜的中心就是交接的那一点（千斤放在腿上的手和她的脸之间，固定不动：只推不横移，
   * 跟着砖左右挪会晃）；砖放进手里、一沉，镜头跟着一沉；砖暖起来、她把砖抱进怀里哭着笑，镜头往后舒一口气、微微抬起来。
   */
  const cam = (t: number): Cam => {
    const f0 = facesMid(HUG_T.end);
    let c = aim(f0[0], f0[1] + 30, 540, 900, 2.45 * 1.025 * (1 + 0.012 * E.soft(ph(t, T.start, T.pocket0))));
    // 交接的那一点（放砖那一刻她的手）和两张脸：取两者偏手的一点放在画面中间偏下，两个人都在画面里
    const hand = roof.lapAt(T.give);
    const fg = facesMid(T.give);
    const px = hand[0] * 0.5 + fg[0] * 0.5;
    const py = hand[1] * 0.6 + fg[1] * 0.4;
    c = camLerp(c, aim(px, py, 540, 1000, 2.95), E.settle(ph(t, T.pocket0, T.drop + 0.1)));
    // 砖暖起来：往后舒一口气、抬起来到两张脸和怀里的砖
    const fm = facesMid(T.smile + 0.3);
    const bw = roof.qjBrickAt(T.smile + 0.4) ?? hand;
    c = camLerp(c, aim((fm[0] + bw[0]) / 2, (fm[1] + bw[1]) / 2 + 20, 540, 960, 2.55), E.io(ph(t, T.warm, T.end)));
    // 砖一沉：镜头跟着一沉
    const kd = kick(t, T.drop, 0.12);
    c = { ...c, z: c.z * (1 + 0.03 * kd), y: c.y - (14 * kd) / c.z };
    return c;
  };
  const shakeK = (t: number) => 6 * kick(t, T.drop, 0.08);

  return { draw, drawGlowOver, cam, shakeK };
}
