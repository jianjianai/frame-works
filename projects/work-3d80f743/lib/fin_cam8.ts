// 重做的副歌二（1:35.5–1:53.9）的镜头和天花板那一镜（她醒来）。时刻在 lib/fin_t.ts（作品时间）。
// 一镜到底的那段每一段都是「把世界里的一点放到画面某处」（aim），下一段从上一段在交接时刻的值出发（camLerp / whip），整段不跳。

import { type MoveKey, CHENGTUO } from "@materials/剪纸角色/code/chengtuo";
import { lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, H, aim, camLerp, kick, ph } from "./cam";
import { Y_WHITE } from "./world";
import { ARMS, live, smoothTrack } from "./motion";
import { CLASP, type CeilingCast, HER as BED_HER, HER_BED, HIS_BED, STONE_BED, placeHer, placeHim } from "./bed";
import { T8, breath, lerp, mix } from "./fin_t";
import { K_LAND, STONE_X, WIN_C, herAt, herChest, kidAt, kidRoot } from "./fin_cast";
import { ZHONG_HOUSE } from "./dawn";

type V2 = [number, number];

// ——————————————— 天花板那一镜：她醒来，他那张床空了 ———————————————
const herBedMove = live(
  [
    { t: 95.3, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: { ...BED_HER.睡, headTurn: 0.48, smile: 0.4 } },
    { t: T8.grope - 0.04, p: { ...BED_HER.睡, headTurn: 0.48, smile: 0.4 } },
    // 手指在床缝上攥了一下：空的
    { t: T8.grope + 0.06, ease: "out", p: { ...BED_HER.睡, headTurn: 0.48, smile: 0.1, handL: "fist" } },
    // 睁开眼，一惊；扭过头去看他那张床
    { t: T8.wake - 0.02, p: { ...BED_HER.睡, headTurn: 0.48, smile: 0.1, handL: "relax" } },
    { t: T8.wake + 0.06, ease: "out", p: { ...BED_HER.睡, headTurn: 0.48, expression: "惊", sad: 0.4, smile: -0.3, lookX: 0.6, lookY: 0.2, handL: "open" } },
    { t: T8.look + 0.12, ease: "inOut", p: { ...BED_HER.睡, headTurn: 0.62, expression: "惊", sad: 0.7, smile: -0.5, open: 0.3, lookX: 1, lookY: 0.1, handL: "open" } },
    { t: 97, p: { ...BED_HER.睡, headTurn: 0.62, expression: "惊", sad: 0.7, smile: -0.5, open: 0.3, lookX: 1, lookY: 0.1, handL: "open" } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 801, springs: ARMS, follow: 0 },
);
/** 他那张床空着时也给一个他（只用来定红绳垂下来的地方：解下来的绳头早掉下去了） */
const himGone = placeHim({ ...live([{ t: 90, x: 0, p: { face: -0.55, ground: false } }] as MoveKey[], { look: lookOf(STONE_BED), springs: {}, follow: 0 })(91).pose }, CLASP, [HIS_BED.x1 - 50, -150]);
export function ceilCast(t: number): CeilingCast {
  // 她近处那只手：一直伸在床缝上（他抽走以后空着）；醒来时往他那张床上摸过去
  const reach = E.io(ph(t, T8.look - 0.02, T8.look + 0.2));
  const hand = mix(CLASP, [HIS_BED.x0 + 70, -232], reach);
  const her = placeHer({ ...herBedMove(t).pose }, hand, [HER_BED.x0 + 70, -120]);
  // 天快亮：比他走的时候（四①）亮一点
  return { her, him: himGone, lightT: 87.42, untie: 1, empty: true };
}
/** 天花板那一镜的镜头（天花板坐标）：两张床（她的脸、他那张空床）→ 一惊一顶 → 顺着她的视线挪到空床 → 她扑起来：镜头猛地冲向她 */
export function ceilCam(t: number): Cam {
  const [bx, by] = breath(t, 2.5);
  const z0 = 2.25 * (1 + 0.025 * ph(t, T8.cut, T8.wake));
  let x = -30;
  let y = -278;
  const look = E.io(ph(t, T8.look, T8.look + 0.25));
  x = lerp(x, 60, look);
  // 扑起来：冲向她的脸（越冲越快）
  const rush = E.in2(ph(t, T8.rush, T8.out));
  x = lerp(x, -175, rush);
  y = lerp(y, -318, rush);
  const z = z0 * (1 + 0.05 * kick(t, T8.wake, 0.1)) * Math.exp(1.5 * rush);
  return { x: x + bx / z, y: y + by / z, z, r: 0 };
}
/** 冲的时候的放射模糊多强（0–1） */
export const rushBlur = (t: number) => E.in2(ph(t, T8.rush + 0.05, T8.out));

// ——————————————— 窗外的一镜到底 ———————————————
/** 两个取景之间甩过去：位置 E.io，倍数中途退到 zMid（看得见一路擦过去的楼和窗） */
export function whip(a: Cam, b: Cam, e: number, zMid: number): Cam {
  const k = camLerp(a, b, E.io(e));
  const dip = Math.sin(Math.PI * Math.min(1, Math.max(0, e)));
  return { ...k, z: Math.exp(Math.log(k.z) + (Math.log(zMid) - Math.log(k.z)) * dip) };
}
/** 她那扇窗：窗在画面上半截，铁栅栏门关着；「咚」窗一震，「哐」栏门被撞开 */
const winCam0 = aim(WIN_C[0] + 30, WIN_C[1] + 40, 540, 760, 1.7);
/** 街上的他：踮着脚举着砖，飘起来以后镜头只跟一半（他在画面里往上走） */
const kidCam = (t: number) => {
  const r = kidRoot(t);
  return aim(STONE_X + 6, -230 + 0.55 * r[1], 540, 1100, 1.45 * (1 + 0.03 * ph(t, T8.street, T8.whip)));
};
/** 甩回她的窗口：她正从窗里扑出来 */
const winCam1 = aim(WIN_C[0] + 70, WIN_C[1] + 180, 540, 700, 0.95);
/** 她跳下去以后：两个人都框在里面——她从上面头朝下往下冲，他从下面往上飘；越近推得越近，撞上的那一刻正好推到最近 */
function fallCam(t: number): Cam {
  const c = herChest(t);
  const k = kidRoot(t);
  const top = c[1] - 520;
  const bot = k[1] + 60;
  const z = Math.max(0.27, Math.min(1.5, 1350 / Math.max(1, bot - top)));
  const midY = (top + bot) / 2;
  // 他还没进画面时，让她留在画面上半截
  const cy = Math.min(midY, c[1] - 250 + (0.36 * H) / z);
  return aim((c[0] + k[0]) / 2 + 20, cy, 540, 960, z);
}
/** 抱住以后一起往下坠、越坠越慢：镜头跟着两个人（她的胸口），街面从画面底下升上来；停住的那一下推近她的靴底和外套之间那一点缝 */
function pairCam(t: number): Cam {
  const c = herChest(t);
  const h = herAt(t);
  const near = E.io(Math.min(1, Math.max(0, 1 - (h.root[1] * -1 - 60) / 1100)));
  const hush = E.io(ph(t, T8.stop - 0.32, T8.stop + 0.3));
  const gapY = h.root[1];
  const fx = c[0] + 40;
  const fy = lerp(c[1] + 130, gapY - 170, hush);
  return aim(fx, fy, 540, lerp(900, 1010, near), lerp(1.5, 1.75, near) * (1 + 0.12 * hush));
}
/** 又往上飘：镜头跟着两个人，慢慢退开，把两边一扇扇关上的窗框进来 */
function riseCam(t: number): Cam {
  const c = herChest(t);
  const u = E.io(ph(t, T8.stop + 0.3, T8.shut[4] + 0.2));
  return aim(c[0] + 70, c[1] + 120, 540, lerp(1010, 980, u), lerp(1.96, 1.45, u));
}
/** 她看看自己的铁靴：镜头顺着她的视线落到靴子上（两张脸还在画面上半截），越推越慢 */
function bootsCam(t: number): Cam {
  const c = herChest(t);
  return aim(c[0] + 40, c[1] + 120, 540, 960, 2.0 * (1 + 0.06 * E.out(ph(t, T8.boot1[0], T8.release))));
}
/** 松手：镜头跟着他往下掉（她往上出了画面） */
const dropCam = (t: number) => {
  const k = kidAt(t);
  return aim(k.chest[0], k.chest[1] + 60, 540, 1020, 2.0);
};
/** 落地以后：他站在铁靴里；推到震出来落在他脚边的那块砖 */
const groundCam = (t: number) => aim(K_LAND[0] - 40, -200, 540, 1060, 2.0 * (1 + 0.04 * ph(t, T8.land, T8.brickOut + 0.15)));
/** 手捧砖的近景（在同一个镜头里推上去，不切）：先落在地上那块砖上，他弯下腰捡起来，镜头跟着砖抬到他脸前——
 *  砖、两只手、他哭着的脸都在画面里，两滴眼泪砸在字上 */
const brickAt = smoothTrack(
  (t) => {
    const k = kidAt(t);
    return k.her ? [k.her.c[0], k.her.c[1]] : [K_LAND[0] - 120, -10];
  },
  104.3,
  106.2,
  10,
);
const brickFloor = (t: number) => {
  const b = brickAt(t);
  return aim(b[0] + 10, b[1] - 60, 540, 1120, 4.3);
};
const brickCam = (t: number) => {
  const b = brickAt(t);
  const up = E.io(ph(t, 104.94, 105.3));
  return aim(b[0] + 6, b[1] - 60 * (1 - up) - 40 * up, 540, lerp(1120, 1180, up), lerp(4.3, 3.7, up) * (1 + 0.06 * ph(t, 105.3, 105.95)));
};
/** 她往上升（越升越慢）：镜头跟着她 */
const herCam = (t: number) => {
  const c = herChest(t);
  return aim(c[0] + 10, c[1] + 40, 540, 960, 1.15);
};
/** 她低头冲他笑：推到她的脸 */
const herClose = (t: number) => {
  const h = herAt(t);
  return aim(h.chest[0] - 4, h.chest[1] - 80, 540, 840, 2.5);
};
/** 构图 A：穿着她的大铁靴仰着头的他（和十二年前七岁的她同一个构图），镜头同样一点点往后退 */
export function mirrorCam(t: number): Cam {
  const head: V2 = [K_LAND[0] + 16, -300];
  const a = aim(head[0], head[1], 540, 760, 2.15);
  const b = aim(K_LAND[0] + 40, -560, 540, 1060, 0.98);
  return camLerp(a, b, E.settle(ph(t, T8.mirror, T8.gazeUp + 0.3)));
}
/** 再顺着他的视线甩上去：她升过最高那栋楼的楼顶（楼顶在画面左边），升进光里 */
const topCam = (t: number) => {
  const c = herChest(t);
  return aim(c[0] - 150, c[1] + 40, 540, 960, lerp(1.5, 1.2, ph(t, T8.gazeUp, T8.glare)));
};
/** 静：老钟在一楼窗后端着茶杯（几乎不动） */
export const zhongCam = (t: number) => {
  const W = ZHONG_HOUSE.win;
  return aim(W.x - 20, W.sill - 150, 540, 960, 2.7 * (1 + 0.015 * ph(t, T8.silent, T8.edge)));
};
/** 静：白的边在画面上的高度（全片第一帧是 260；这里往下一点，白里能装下妈妈） */
export const EDGE_Y = 420;
/** 静：白的边上——和全片第一帧同一个构图（1.35 倍，歪一点） */
export const edgeCam = (t: number) => {
  const c = herChest(t);
  const u = ph(t, T8.edge, T8.end);
  return aim(c[0] + 10, Y_WHITE, 540, EDGE_Y, 1.35 * (1 + 0.03 * u), -0.03 + 0.012 * u);
};

/** 窗外一镜到底的镜头（96.263–112.0） */
export function camOut(t: number): Cam {
  if (t < T8.dive0) return winCam0;
  if (t < T8.street) return whip(winCam0, kidCam(T8.street), ph(t, T8.dive0, T8.street), 0.3);
  if (t < T8.whip) return kidCam(t);
  const wEnd = T8.jump - 0.04;
  if (t < wEnd) return whip(kidCam(T8.whip), winCam1, ph(t, T8.whip, wEnd), 0.3);
  if (t < T8.catch) return camLerp(winCam1, fallCam(t), E.io(ph(t, wEnd, wEnd + 0.32)));
  if (t < T8.stop + 0.3) return camLerp(fallCam(T8.catch), pairCam(t), E.out(ph(t, T8.catch, T8.catch + 0.26)));
  let k = camLerp(pairCam(T8.stop + 0.3), riseCam(t), E.io(ph(t, T8.stop + 0.3, T8.stop + 0.9)));
  if (t < T8.decide) return k;
  k = camLerp(k, bootsCam(t), E.io(ph(t, T8.decide, T8.boot1[0] + 0.1)));
  if (t < T8.release) return k;
  const kd = camLerp(bootsCam(T8.release), dropCam(t), E.io(ph(t, T8.release, T8.release + 0.22)));
  if (t < T8.land) return kd;
  k = camLerp(dropCam(T8.land), groundCam(t), E.out(ph(t, T8.land, T8.land + 0.3)));
  k = camLerp(k, brickFloor(t), E.io(ph(t, 104.16, 104.62)));
  k = camLerp(k, brickCam(t), E.io(ph(t, 104.7, 104.95)));
  if (t < T8.upward) return k;
  k = whip(brickCam(T8.upward), herCam(t), ph(t, T8.upward, T8.upward + 0.42), 0.36);
  k = camLerp(k, herClose(t), E.io(ph(t, T8.smile - 0.45, T8.smile)));
  if (t < T8.gazeDown) return k;
  if (t < T8.mirror) return whip(herClose(T8.gazeDown), mirrorCam(T8.mirror), ph(t, T8.gazeDown, T8.mirror), 0.3);
  if (t < T8.gazeUp) return mirrorCam(t);
  return whip(mirrorCam(T8.gazeUp), topCam(t), ph(t, T8.gazeUp, T8.gazeUp + 0.42), 0.3);
}
/** 一惊、一震（叠在镜头上）：「咚」窗一震、「哐」栏门、抱住、落地 */
export function camKick(t: number): { z: number; sh: number } {
  const kc = kick(t, T8.catch, 0.12);
  const kl = kick(t, T8.land, 0.12);
  const kw = kick(t, T8.out, 0.09);
  const kg = kick(t, T8.cage, 0.1);
  return { z: 1 + 0.05 * kc + 0.035 * kl + 0.02 * kg, sh: 22 * kc + 16 * kl + 7 * kw + 10 * kg };
}
