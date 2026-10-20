// 五⑤ 最后一镜的镜头和淡出（时刻见 lib/t55.ts，模块时间 = 作品时间 + 20）。一镜到底：
// 从五④最后的近景（2.85 倍，跟着她往下落）柔和起步一路退到整座城（0.17 倍：白压在上面，街在下面）——砖那团暖光像一盏灯从白的边上
// 落回城里，松了手的人一个个先落回街上；快到街面时往下推（柔和起步、一路减速），落在一群人身上（0.92 倍，她在左边三分之一、
// 大家在她右边，坑里她那双空铁靴在左边），她光着脚落地，镜头慢慢凑近；她低头看一眼坑里的铁靴，再抬起头；镜头低下去到她光着的脚
// （和开场她第一次出场时贴地拍铁靴一样，4 倍），往前一步「咚」一震；停一会儿，淡出。
// （试过从铁靴贴着地挪到她的脚：千斤站在她和坑中间，挡在画面正中，不用。）
// 退和推之间是同一件事（落回城里），不来回：退到整座城时人在画面上半截往下落，推下去时跟着他们落地。

import { type Cam, E, H, W, aim, camLerp, kick, ph } from "./cam";
import { breath } from "./chain";
import { cam54 } from "./meet";
import { HER_C0, HER_LAND, LAND_T, landChest } from "./t55";

const T = LAND_T;

/** 整座城：白的边压在画面上面，街面在下面，她家那栋楼在左边；停着时很慢地往下漂、凑近一点 */
function wideCam(s: number): Cam {
  const [bx, by] = breath(s);
  const z = 0.17 * (1 + 0.08 * E.io(ph(s, T.wide1, T.near0 + 0.6)));
  return aim(-2620 + bx / z, -4380 + 260 * E.io(ph(s, T.wide1, T.near0 + 0.6)) + by / z, 540, 960, z);
}
/**
 * 落在一群人身上（0.92 倍：坑里那双空铁靴在左边看得见），之后很慢地凑近她（1.35 倍：她和怀里的他在画面中间偏右一点，
 * 千斤放在她肩上的手、周磊放在他背上的手、左边坑里的空铁靴都在画面里，别的人慢慢出画）
 */
function groupCam(s: number): Cam {
  const [bx, by] = breath(s);
  const u = E.io(ph(s, T.land + 0.6, T.low0 - 0.1));
  const z = 0.92 * Math.pow(1.35 / 0.92, u);
  return aim(HER_LAND[0] + 200 - 243 * u + bx / z, -330 + 30 * u + by / z, 540, 1000 - 20 * u, z);
}
/** 贴着地：她光着的脚在画面偏左，往前那一步迈向右边的空处（照开场她第一次出场时贴地拍铁靴，4 倍） */
function feetCam(s: number): Cam {
  const [bx, by] = breath(s);
  const z = 4 * (1 + 0.04 * ph(s, T.low1, T.end));
  return aim(HER_LAND[0] + 20 + bx / z, -60 + by / z, 460, 1360, z);
}

/** 五⑤ 的镜头 */
export function cam55(s: number): Cam {
  // 开头接着五④的近景，跟着她往下落（她胸口往下走多少，镜头跟着走多少）
  const c0 = cam54(Math.min(s, T.start));
  const c = landChest(s);
  let cam: Cam = { ...c0, x: c0.x + (c[0] - HER_C0[0]), y: c0.y + (c[1] - HER_C0[1]) };
  cam = camLerp(cam, wideCam(s), E.io(ph(s, T.wide0, T.wide1)));
  cam = camLerp(cam, groupCam(s), E.settle(ph(s, T.near0, T.near1)));
  cam = camLerp(cam, feetCam(s), E.io(ph(s, T.low0, T.low1)));
  const kk = kick(s, T.step, 0.1);
  return { ...cam, z: cam.z * (1 + 0.03 * kk), y: cam.y + (5 * kk * Math.sin((s - T.step) * 55)) / cam.z };
}
/** 最后淡出（画面坐标） */
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
