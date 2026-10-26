// 终章里离开她脚的铁靴（她的，按她的大小画）：在她手里、套在他脚上、留在坑里。画法照素材库的铁靴（chengtuo-costume 的 BOOT），
// 和 lib/fin_cast.ts 的 drawBoot 一样：靴子自己的坐标里脚踝在原点，小腿竖着时 rot = 0。

import { COLORS as CHEN_COLORS } from "@materials/剪纸角色/code/chengtuo";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, cubicPath, toLocal } from "@materials/剪纸角色/code/figure";
import { part } from "./world";

type V2 = [number, number];

const BOOT_L = {
  body: toLocal(BOOT.body, REST.ankleR, 0),
  rim: toLocal(BOOT.rim, REST.ankleR, 0),
  sole: toLocal(BOOT.sole, REST.ankleR, 0),
  brick: toLocal(BOOT.brick, REST.ankleR, 0),
  rust: BOOT.rust.map((r) => toLocal(r, REST.ankleR, 0)),
  ropes: BOOT.ropes.map((r) => toLocal(r, REST.ankleR, 0)),
  rivets: BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r })),
};
/** 靴口上沿的中点（靴子自己的坐标：脚踝在原点） */
export const RIM_TOP: V2 = (() => {
  let top = 1e9;
  let xs = 0;
  let n = 0;
  for (const p of BOOT_L.rim) if (p[1] < top) top = p[1];
  for (const p of BOOT_L.rim)
    if (p[1] < top + 8) {
      xs += p[0];
      n++;
    }
  return [xs / Math.max(1, n), top];
})();
/** 靴底最低的地方（靴子自己的坐标：脚踝在原点） */
export const SOLE_Y = (() => {
  let y = -1e9;
  for (const p of BOOT_L.sole) if (p[1] > y) y = p[1];
  return y;
})();
/** 一只铁靴：脚踝点在 a，转 rot（0 是小腿竖着），sx 横着的倍数（−1 镜像：脚尖朝右）；brick 靴筒里插不插着砖 */
export function drawBoot(g: CanvasRenderingContext2D, a: V2, rot: number, line: number, sx = 1, brick = true) {
  const K = CHEN_COLORS;
  const id = (p: V2): V2 => p;
  const lw = 3 * line;
  g.save();
  g.translate(a[0], a[1]);
  g.rotate(rot);
  g.scale(sx, 1);
  part(g, cubicPath(BOOT_L.body, id), K.boot, K.bootShade, lw, [4, 3]);
  g.fillStyle = K.rust;
  for (const r of BOOT_L.rust) g.fill(cubicPath(r, id));
  g.strokeStyle = K.rope;
  g.lineWidth = 4;
  for (const r of BOOT_L.ropes) g.stroke(cubicPath(r, id, false));
  if (brick) part(g, cubicPath(BOOT_L.brick, id), K.brick, K.brickShade, lw * 0.8, [2, 2]);
  part(g, cubicPath(BOOT_L.rim, id), K.bootRim, K.bootShade, lw, [2, 2]);
  g.fillStyle = K.rivet;
  for (const d of BOOT_L.rivets) {
    g.beginPath();
    g.arc(d.c[0], d.c[1], d.r, 0, Math.PI * 2);
    g.fill();
  }
  part(g, cubicPath(BOOT_L.sole, id), K.sole, null, lw);
  g.restore();
}
/** 小腿的转角：膝盖到脚踝（竖直往下是 0） */
export const shinRot = (knee: V2, ankle: V2) => -Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]);
/** 在 rot 转角下，靴子自己坐标里的点 p 落在哪（脚踝在 a，sx 镜像） */
export const bootPt = (a: V2, rot: number, sx: number, p: V2): V2 => {
  const x = p[0] * sx;
  return [a[0] + x * Math.cos(rot) - p[1] * Math.sin(rot), a[1] + x * Math.sin(rot) + p[1] * Math.cos(rot)];
};
