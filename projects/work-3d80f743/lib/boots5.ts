// 四⑤ 第一声「活下去」（113.88–117.9；活 ~114.0、下 ~114.5、去 ~116.0 拖到 117.7）：她在半空里把两只脚伸到他脚边，
// 「活」光脚一只、再一只从靴筒里抽出来往她身后收，铁靴翻过来套在他脚上（她的铁靴，套在小孩脚上大得不合脚——和十二年前七岁的她
// 穿着妈妈的铁靴一样），套上一只他那条腿就被坠直一条；
// 「下」她松开手把他往右下一推，两只手朝下伸着，光着脚一下子轻了，往上飘，低头冲他笑了一下；铁靴一沉，他往下坠，远处那只手还伸着够她；
// 「去」116.02 他「咚」地踩回街面（落在他妈妈那件外套旁边），站在铁靴里仰着头；她越飘越高，仰起脸朝着白。
// 镜头：接着四④跟着两个人的取景，两个人一上一下分开时一直把两个人都框在里面（越分越开、越退越远），落地以后一路减速停在远景——
// 白压在画面最上面，她小小的一个往白里飘，他小小的一个站在楼脚下仰着头（和四②开头反过来）。
// 坐标是世界坐标；她（lib/dive.ts）、他（lib/coatoff.ts）各自的动作、位置在那两个文件里，时刻在 lib/t5.ts。

import { COLORS as CHEN_COLORS, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, cubicPath, toLocal } from "@materials/剪纸角色/code/figure";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { part } from "./world";
import { BOOTS5_T } from "./t5";
import { STOMP_T } from "./t51";
import { STONE_LAND_X, STONE_X, stoneC4 } from "./coatoff";
import { diveHer } from "./dive";
import { hug4Cam } from "./hug4";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const T = BOOTS5_T;
export { BOOTS5_T };

/** 铁靴在靴子自己的坐标里（脚踝在原点，画面左边那只的线稿，脚尖朝左）；靴筒里插着的那块砖和她穿着时一样（素材库默认两只都插着） */
const BOOT_L = {
  body: toLocal(BOOT.body, REST.ankleR, 0),
  rim: toLocal(BOOT.rim, REST.ankleR, 0),
  sole: toLocal(BOOT.sole, REST.ankleR, 0),
  brick: toLocal(BOOT.brick, REST.ankleR, 0),
  rust: BOOT.rust.map((r) => toLocal(r, REST.ankleR, 0)),
  ropes: BOOT.ropes.map((r) => toLocal(r, REST.ankleR, 0)),
  rivets: BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r })),
};
/** 一只铁靴：脚踝点在 a，转 rot（弧度，0 是小腿竖着），按她的大小（1 倍）画；line 描边倍数；sx 横着的倍数（−1 镜像：脚尖朝右） */
function boot(g: CanvasRenderingContext2D, a: V2, rot: number, line: number, sx = 1) {
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
  part(g, cubicPath(BOOT_L.brick, id), K.brick, K.brickShade, lw * 0.8, [2, 2]);
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
const shinRot = (knee: V2, ankle: V2) => -Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]);

/** 她还穿着的那只铁靴在哪：脚踝（世界坐标）、小腿的转角（jointsOf 已经按朝向镜像；她朝右，靴子也是镜像的，脚尖朝右） */
function herBoot(t: number, side: "L" | "R") {
  const h = diveHer(t);
  const j = jointsOf(h.pose);
  const a = side === "L" ? j.ankleL : j.ankleR;
  const k = side === "L" ? j.kneeL : j.kneeR;
  const ankle: V2 = [h.root[0] + a[0], h.root[1] + a[1]];
  const knee: V2 = [h.root[0] + k[0], h.root[1] + k[1]];
  return { a: ankle, rot: shinRot(knee, ankle) };
}
/** 铁靴翻过来套到他脚上用多久 */
const FLIP = 0.12;
/** 他脚上的一只铁靴：她的光脚一抽出来，靴子从她脚上的样子（脚尖朝右）翻过来套正在他脚上（剪纸一翻，脚尖朝左） */
function kidBoot(g: CanvasRenderingContext2D, t: number, side: "L" | "R", line: number) {
  const slip = side === "L" ? T.slipL : T.slipR;
  if (t < slip) return;
  // 五① 他从铁靴里飘出来以后，铁靴留在坑里立着（停在那一刻的样子）
  const s = stoneC4(Math.min(t, STOMP_T.rise0));
  const a = side === "L" ? s.ankleL : s.ankleR;
  const rot = shinRot(side === "L" ? s.kneeL : s.kneeR, a);
  const u = E.io(ph(t, slip, slip + FLIP));
  if (u >= 1) return boot(g, a, rot, line);
  const her = herBoot(slip - 1e-4, side);
  const sx = -1 + 2 * u;
  boot(g, mix(her.a, a, u), her.rot + (rot - her.rot) * u, line, Math.sign(sx || 1) * Math.max(0.06, Math.abs(sx)));
}
/** 他脚上的两只铁靴（她的脚抽出来以后）：远处那只先画，近处那只后画；between：两只中间要画的（四⑥ 插进近处那只靴口的砖） */
export function drawKidBoots(g: CanvasRenderingContext2D, t: number, z: number, between?: () => void) {
  const line = 1 / Math.sqrt(Math.max(0.3, z));
  kidBoot(g, t, "R", line);
  between?.();
  kidBoot(g, t, "L", line);
}

/**
 * 「咚」落地扬起的一团灰（铁靴两边各两团，往外散、越散越淡；落在外套旁边，中心在两只铁靴中间）。
 * 这时镜头已经退到 0.3 倍上下，灰要比人跟前的大一倍；颜色比墙和街面亮（同色的话远景里看不见）
 */
export function drawLandDust(g: CanvasRenderingContext2D, t: number) {
  const d = t - T.land;
  if (d < 0 || d > 0.8) return;
  const x = STONE_LAND_X - 30;
  const u = Math.min(1, d / 0.75);
  const a = 0.62 * (1 - u) ** 1.4;
  g.save();
  g.fillStyle = `rgba(248,238,226,${a})`;
  for (const [dx, sz, k] of [
    [-120, 1, 0],
    [110, 1.1, 1],
    [-230, 0.7, 2],
    [220, 0.75, 3],
  ] as const) {
    g.beginPath();
    g.ellipse(x + dx * (0.7 + 1.0 * u), -30 - 60 * u - k * 8, (90 + 120 * u) * sz, (40 + 46 * u) * sz, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/** 远景：白压在画面最上面，街在画面 1380（和四②开头一样）；叠手持呼吸 */
const WIDE = (t: number): Cam => {
  const [bx, by] = breath(t);
  return aim(STONE_X + 40 + bx / 0.14, by / 0.14, 540, 1380, 0.14);
};
/**
 * 四⑤的镜头：松手以前接着四④（跟着两个人）；松手以后一直把两个人都框在里面——中心在她的头和他的脚中间，倍数按两个人上下隔多远
 * （越分越开、越退越远，最多 0.62）；「咚」一震；落地起接着下坠时的退势往远景退（E.out：一路减速，最后停在远景——白在最上面、
 * 街在下面），中途不再加速，不往回推
 */
export function boots5Cam(t: number): Cam {
  const c4 = hug4Cam(t);
  if (t < T.release) return c4;
  const h = diveHer(t);
  const s = stoneC4(t);
  const top = h.chest[1] - 380;
  const bottom = s.root[1] + 60;
  const height = bottom - top;
  const z = Math.min(0.62, 1400 / (height + 420));
  const [bx, by] = breath(t);
  const both = aim((h.chest[0] + s.root[0]) / 2 + bx / z, (top + bottom) / 2 + by / z, 470, 960, z);
  let c = camLerp(c4, both, E.io(ph(t, T.release, T.release + 0.25)));
  c = camLerp(c, WIDE(t), E.out(ph(t, T.land, T.end - 0.05)));
  const kk = kick(t, T.land, 0.1);
  return { ...c, z: c.z * (1 + 0.025 * kk), y: c.y + (6 * kk * Math.sin((t - T.land) * 55)) / c.z };
}
