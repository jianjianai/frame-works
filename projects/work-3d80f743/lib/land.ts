// 五⑤ 最后一镜的镜头、溶、淡出（时刻见 lib/t55.ts；下面的 s 都是故事时间）。
// 天上：从五④最后的近景柔和起步往后退，跟着抱在一起的两个人往下落，看见人链一个个松手散开；溶到街上（同一个画面位置、同样大小
// 的两个人，往下落的那几秒跳过去）；落地以后柔和地停在一群人身上、慢慢推近；低下来到她光着的脚（照开场她第一次出场时贴地拍铁靴
// 那样），往前一步「咚」一震；停一会儿，淡出。

import { type Cam, E, H, W, aim, camLerp, kick, ph, toScreen } from "./cam";
import { breath } from "./chain";
import { cam54 } from "./meet";
import { HER_LAND, LAND_T, landChest } from "./t55";

const T = LAND_T;

/** 天上（故事时间 = 画面时间）：从五④最后的近景（2.85 倍）柔和起步退到 0.72 倍，跟着两个人往下落（他们在画面上半截，下面是散开的人链） */
function skyCam(s: number): Cam {
  const [bx, by] = breath(s);
  const c = landChest(s);
  const z = 0.72;
  const wide = aim(c[0] + 30 + bx / z, c[1] + 120 + by / z, 540, 760, z);
  return camLerp(cam54(s), wide, E.io(ph(s, T.start + 0.05, 149.7)));
}
/** 溶的那一刻天上的两个人在画面上哪、多大（街上的镜头照着它放） */
function matchAt(t: number): { at: [number, number]; z: number } {
  const a = skyCam(t);
  return { at: toScreen(a, ...landChest(t)), z: a.z };
}
/**
 * 街上（故事时间）：溶的时候照着天上那一刻（两个人在画面上同一个地方、一样大）；溶完接着跟着两个人往下落，落地以后柔和地停在
 * 一群人身上（0.92 倍，她在左边三分之一、大家在她右边，坑里她那双铁靴在最左边），慢慢推近；156.62 起低下来到她光着的脚（4 倍），往前一步「咚」一震；之后很慢地再凑一点
 */
function streetCam(s: number): Cam {
  const [bx, by] = breath(s);
  const m = matchAt(Math.min(s - T.JUMP, T.dis1));
  const c = landChest(s);
  let cam = aim(c[0], c[1], m.at[0], m.at[1], m.z);
  const zg = 0.92 * Math.pow(1.07, E.io(ph(s, T.walk0, T.low0)));
  const group = aim(HER_LAND[0] + 300 + bx / zg, -330 + by / zg, 540, 1000, zg);
  cam = camLerp(cam, group, E.settle(ph(s, T.dis1 + T.JUMP, T.land + 0.5)));
  // 和开场她第一次出场时贴地拍铁靴一样（4 倍）：光着的脚在画面偏左，往前那一步迈向右边的空处
  const zl = 4 * (1 + 0.04 * ph(s, T.low1, T.end));
  const low = aim(HER_LAND[0] + 20 + bx / zl, -60 + by / zl, 460, 1360, zl);
  cam = camLerp(cam, low, E.io(ph(s, T.low0, T.low1)));
  const kk = kick(s, T.step, 0.1);
  return { ...cam, z: cam.z * (1 + 0.03 * kk), y: cam.y + (5 * kk * Math.sin((s - T.step) * 55)) / cam.z };
}
/** 五⑤ 的镜头（故事时间）：溶以前是天上，跳过去以后是街上 */
export function cam55(s: number): Cam {
  return s >= T.street0 - 1 ? streetCam(s) : skyCam(s);
}
/** 溶到街上的进度（画面时间）：0 只有天上，1 只有街上 */
export const dissolveAt = (t: number) => E.io(ph(t, T.dis0, T.dis1));
/** 最后淡出（画面坐标，故事时间） */
export function drawFade(g: CanvasRenderingContext2D, base: DOMMatrix, s: number) {
  const k = E.io(ph(s, T.fade0, T.end));
  if (k <= 0) return;
  g.save();
  g.setTransform(base);
  g.globalAlpha = k;
  g.fillStyle = "#0d0e11";
  g.fillRect(0, 0, W, H);
  g.restore();
}
