// 四⑥ 第二声「活下去」（117.9–121.89；活 ~118.0、下 ~118.5、去 ~120.0 拖到 121.8）：
// 117.9 从远景切到他跟前：⑤落地时从近处那只铁靴里震出来的那块砖斜靠在远处那只铁靴上，背面朝外。
// 「活」他低头看见，腿在铁靴里直着（她的铁靴高到他大腿），只能从腰那儿笨笨地折下去，远处那只手捏住砖靠上那一头；直起身拎到脸前面，
// 绕长边一翻——是她的字「活下去」（她写给自己、插不进塞满的靴筒的那块，三⑨）。镜头慢慢推到砖上的字和他的脸。
// 「下」他把砖抱到胸口，仰起头；镜头顺着他的视线往上甩（越甩越快，背景竖着拖影，和四③一样），甩到楼顶右边那张红绳网里：
// 风把她从楼的上空往右带过来，她从网中间穿过去——网上的人脚踝上都拴着红绳，只有她的脚踝上什么都没有；网上的人转过头看她。
// 「去」她低头看他一眼，笑了一下，再仰起脸朝着白。镜头停在网和她上面，白压在画面上面。
// 网（这一个天快亮，夜里往白里飞、被红绳拽住的人还没被收回去）：近处这一层是这里的几个人（拴在她家那栋楼楼顶右边的栏杆上、
// 右边那排楼的窗上），远处几层用副歌一那张网（不收）。三③窗口那一镜看得见她家那栋楼左半边上空，那里没有网：这几个人都在楼顶右边以外。
// 坐标是世界坐标；他（lib/coatoff.ts）、她（lib/dive.ts）各自的动作、位置在那两个文件里，时刻在 lib/t6.ts。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Cam, E, aim, camLerp, ph, viewOf } from "./cam";
import { STREET, TOWER, drawTinted } from "./world";
import { LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { cross, drawNetLayer, knot, rope } from "./net";
import { BRICK6_T } from "./t6";
import { STONE_LAND_X, stoneC4 } from "./coatoff";
import { diveHer } from "./dive";

type V2 = [number, number];
const T = BRICK6_T;
export { BRICK6_T };

// ——— 网 ———
/** 楼上的窗外托板（和 lib/world.ts 的 geomOf 同一套算法）：第 f 层（0 是最上面）第 i 扇 */
function sillOf(b: (typeof STREET)[number], f: number, i: number): V2 {
  const u = b.fh / 128;
  const w = b.w / u;
  const top = -b.floors * 128 - 60;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const wx = 20 + uw * Math.min(units - 1, Math.max(0, i)) + uw * 0.18;
  return [b.x + (wx + (uw * 0.64) / 2) * u, (top + 70 + f * 128 + 74 + 16) * u];
}
/** 楼顶女儿墙上 k（0 左头 … 1 右头）那一点 */
const roofOf = (b: typeof TOWER, k: number): V2 => [b.x + b.w * k, -b.floors * b.fh - 40];

/** 拴着的人：两只手往上够（A），一只手举着、低头看着拴住自己的红绳（B）；脚踝上的红绳拴在近处那条腿（L） */
const HANG_A = pose(0, { face: 0.85, ground: false, float: 0, rot: 6, ...legL(-6, -30, -40), ...legR(8, -18, -36), neck: 18, expression: "难过", sad: 0.7, lookX: 0.1, lookY: -1 }, (l) => ({
  ...armL(150, 20, 0, "open", l),
  ...armR(166, 14, 0, "open", l),
}));
const HANG_B = pose(4, { face: -0.85, ground: false, float: 0, rot: -4, ...legL(-2, -12, -44), ...legR(10, -26, -40), neck: -22, expression: "难过", sad: 0.9, lookX: 0, lookY: 0.9 }, (l) => ({
  ...armL(16, 26, 0, "relax", l),
  ...armR(152, 20, 0, "open", l),
}));

interface Hanger {
  /** 胯（世界坐标）、哪个路人、红绳拴在哪、晃的相位、姿势；front：红绳画在她前面（她从这根绳子后面穿过去） */
  hip: V2;
  spec: CastSpec;
  anchor: V2;
  ph: number;
  move: ReturnType<typeof live>;
  front: boolean;
  /**
   * 五④ 他升到她跟前要从这个人身边经过：镜头在街上、这一片不在任何画面里的时候（131–143）挪开一点（胯往哪挪），
   * 红绳从楼顶栏杆改拴到右边那个人的脚踝上（原来那根横在她脚下，他和老钟正好要从那里上来）
   */
  shift?: { dx: number; dy: number; to: number };
}
/**
 * 一个拴着的人：先照原来的样子（仰头够白 / 低头看红绳）；她从身边升过去时（see）转过头看她（眼睛和脖子，短发的人不转头：
 * 头转到 ±0.3 左右短发会翻出去）——look：看她时的眼睛方向和脖子
 */
function hanger(hip: V2, n: number, anchor: V2, base: typeof HANG_A, see: number, look: { x: number; y: number; neck: number }, seed: number, front = false, late?: typeof HANG_A): Hanger {
  const spec = passerby(n);
  const seeP = { ...base, expression: "吓一跳", sad: 0.4, lookX: look.x, lookY: look.y, neck: look.neck };
  const after = { ...base, expression: "仰望", sad: 0.8, lookX: look.x, lookY: look.y, neck: look.neck };
  const move = live(
    [
      { t: 104, x: 0, p: base },
      { t: see - 0.2, p: base },
      { t: see + 0.06, ease: "inOut", p: seeP },
      { t: see + 0.5, ease: "inOut", p: after },
      { t: 130, p: after },
      // 五④ 以前（镜头在街上、这一片不在画面里）换个样子：人链从身边升上来时不像伸手去抓他们
      ...(late ? [{ t: 137, p: after }, { t: 139, ease: "inOut", p: late }, { t: 150, p: late }] : []),
    ] as MoveKey[],
    { look: lookOf(spec), base: { wind: 0.4 }, idle: true, seed, springs: LIMP, follow: 0 },
  );
  return { hip, spec, anchor, ph: seed * 0.37, move, front };
}
/**
 * 楼顶右边那张网（人这一层）：她从左下方漂过来、往上穿过去（她的路线见 lib/dive.ts 的 herChest：120.2 在 (−2350, −8270)，
 * 121.89 在 (−2280, −8800)）。红绳拴在她家那栋楼楼顶右边的栏杆上（往左下）、右边那排楼的窗上（往右下，很长），交叉的地方打结；
 * 有一个结正好在她穿过去的地方（约 (−2385, −8445)）
 */
const NET4: Hanger[] = [
  // 右下：红绳往右下拴到右边那排楼的窗上，低头看着红绳（举起来的手往前伸，不挡在脸前）；她升到跟前时抬眼往左上看她
  // （五④ 以前把往前伸的那只手举到头顶，转过头看人链从左边升上来：原来那只手正好朝着人链里的老钟，像要去抓他）
  hanger([-1860, -8130], 14, sillOf(STREET[0], 2, 0), { ...HANG_B, face: -0.85, rot: -4, ...armR(118, 24, 0, "open", 4) }, 120.25, { x: -0.7, y: -0.4, neck: 8 }, 61, false,
    { ...HANG_B, face: -0.85, rot: -4, ...armR(158, 18, 0, "open", 4), expression: "吓一跳", sad: 0.5, lookX: -0.8, lookY: -0.5, neck: 12 }),
  // 右上：一根很长的红绳横着拴到楼顶栏杆上（画在她前面：她从这根绳子后面升过去），仰头够白；转过头往左看她
  // （五④ 以前挪到右边一点、红绳改拴到右边远一点那个人的脚踝上，见 Hanger.shift）
  { ...hanger([-2060, -8680], 6, roofOf(TOWER, 0.95), { ...HANG_A, face: -0.85, rot: -6 }, 120.42, { x: -0.6, y: 0.1, neck: 0 }, 62, true), shift: { dx: 135, dy: 25, to: 3 } },
  // 左上：楼顶右边外面的天上，比横着那根红绳高出一截（脚底贴着楼顶、贴着那根红绳的话像站在楼顶上、走钢丝），举着的手伸进白里
  // （和副歌一那张网一样）；红绳往右下拴到右边那排楼的窗上，和横着那根在她左边打个结；低头看她从底下升上来
  hanger([-2600, -8830], 12, sillOf(STREET[0], 0, 0), HANG_A, 120.6, { x: 0.6, y: 0.8, neck: -18 }, 63),
  // 右边远一点：红绳往右下，仰头够白；转过头往左下看她
  hanger([-1700, -8590], 3, sillOf(STREET[0], 1, 1), { ...HANG_B, face: -0.85 }, 120.5, { x: -0.8, y: 0.3, neck: 2 }, 64),
];

/** 挪开、改拴红绳的时候（五①–③镜头在街上，这一片不在任何画面里） */
const SHIFT_T0 = 131;
const SHIFT_T1 = 143;
const SHIFT_SWAP = 137;
/** 红绳拴在哪：挪开的那个人 137 起改拴到另一个人的脚踝上 */
function anchorAt(h: Hanger, t: number): V2 {
  if (!h.shift || t < SHIFT_SWAP) return h.anchor;
  return hangerAt(NET4[h.shift.to], t).ankle;
}
/** 红绳画不画在人前面：改拴以后不再横在她脚下，照常画在人后面 */
const frontAt = (h: Hanger, t: number) => h.front && !(h.shift && t >= SHIFT_SWAP);
/** 一个拴着的人这一刻：被白往上扯、一下一下慢慢晃（和副歌一那张网一样的晃法）；胯、根、姿势、脚踝（红绳拴在这里） */
function hangerAt(h: Hanger, t: number) {
  const pose: PoseIn = { ...h.move(t).pose };
  const k = h.shift ? E.io(ph(t, SHIFT_T0, SHIFT_T1)) : 0;
  const hip: V2 = [
    h.hip[0] + (h.shift?.dx ?? 0) * k + 8 * Math.sin(t * 0.7 + h.ph),
    h.hip[1] + (h.shift?.dy ?? 0) * k + 10 * Math.sin(t * 1.1 + h.ph) + 5 * Math.sin(t * 2.3 + h.ph * 2),
  ];
  const j = castJoints(h.spec, pose);
  const root: V2 = [hip[0] - j.hip[0], hip[1] - j.hip[1]];
  return { pose, root, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]] as V2 };
}

/**
 * 远处几层的网（副歌一那张，不收）：只在镜头退到 0.62 倍以下才淡进来（drawWorld 的 walkers 里按层画）。
 * 天快亮、隔得远，只剩淡淡的一层（0.3）：原样画的话四⑤最后那个远景整片天都是红线，盖过了她和他
 */
export function drawNet4Far(g: CanvasRenderingContext2D, t: number, D: number, z: number) {
  if (D !== 4 && D !== 2.2 && D !== 1.5) return;
  const ga = g.globalAlpha;
  g.globalAlpha = ga * 0.3;
  drawNetLayer(g, t, D, z, [], false);
  g.globalAlpha = ga;
}

/** 整张网（连往右下拉到右边那排楼的长红绳）在不在画面里 */
function netInView(cam: Cam) {
  const v = viewOf(cam, 1);
  return !(v.x1 < -2900 || v.x0 > 1300 || v.y1 < -9400 || v.y0 > -1200);
}
/** 一根红绳（画面上不管远近都是 2.4 像素粗，近了加深色描边；退到远景时淡一点，和远处那几层一起是淡淡的一片）；不在画面里不画 */
function drawRope(g: CanvasRenderingContext2D, s: [V2, V2], cam: Cam) {
  const v = viewOf(cam, 1);
  if (Math.max(s[0][0], s[1][0]) < v.x0 || Math.min(s[0][0], s[1][0]) > v.x1) return;
  const ga = g.globalAlpha;
  g.globalAlpha = ga * (0.5 + 0.5 * Math.min(1, Math.max(0, (cam.z - 0.2) / 0.4)));
  rope(g, s, cam.z, 2.4, cam.z > 0.3);
  g.globalAlpha = ga;
}
/** 近处这一层的网（世界坐标，人这一层）：她后面的红绳、拴着的人（一起蒙一次天快亮的色）；不在画面里就不画 */
export function drawNet4(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  if (!netInView(cam)) return;
  const v = viewOf(cam, 1);
  const items = NET4.map((h) => ({ h, q: hangerAt(h, t) }));
  for (const it of items) if (!frontAt(it.h, t)) drawRope(g, [it.q.ankle, anchorAt(it.h, t)], cam);
  const vis = items.filter((it) => it.q.root[0] > v.x0 - 300 && it.q.root[0] < v.x1 + 300 && it.q.root[1] > v.y0 - 600 && it.q.root[1] < v.y1 + 600);
  if (!vis.length) return;
  let box: [number, number, number, number] = [1e9, 1e9, -1e9, -1e9];
  for (const it of vis) box = [Math.min(box[0], it.q.root[0] - 420), Math.min(box[1], it.q.root[1] - 720), Math.max(box[2], it.q.root[0] + 420), Math.max(box[3], it.q.root[1] + 120)];
  drawTinted(g, box, (gg) => {
    for (const it of vis) drawPerson(gg, it.h.spec, it.q.pose, it.q.root[0], it.q.root[1], cam.z);
  }, 0.85);
}
/** 画在她前面的：她从后面穿过去的那根红绳、所有绳结（结压在两根绳子上面） */
export function drawNet4Front(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  if (!netInView(cam)) return;
  const segs = NET4.map((h) => {
    const q = hangerAt(h, t);
    return { s: [q.ankle, anchorAt(h, t)] as [V2, V2], front: frontAt(h, t) };
  });
  for (const it of segs) if (it.front) drawRope(g, it.s, cam);
  for (let a = 0; a < segs.length; a++)
    for (let b = a + 1; b < segs.length; b++) {
      const c = cross(segs[a].s[0], segs[a].s[1], segs[b].s[0], segs[b].s[1]);
      if (c) knot(g, c, cam.z, 1);
    }
}

// ——— 镜头 ———
/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/**
 * 四⑥的镜头：117.9 切到他跟前（1.9 倍：他在画面右边，靴子上斜靠着的那块砖在左边，脚底在画面 1400）；拿起来以后柔和起步、一路减速地
 * 推到砖上的字和他的脸上（2.6 倍）；119.45 顺着他的视线往上甩（E.io，越甩越快、到她跟前收住，倍数一路退到 0.85），甩到网里的她；
 * 之后跟着她，只跟一半（她在画面里慢慢往上走、往白那边去），白压在画面上面；叠手持呼吸，不往回推
 */
export function cam6(t: number): Cam {
  const [bx, by] = breath(t);
  const z0 = 1.9;
  const near = aim(STONE_LAND_X - 60 + bx / z0, -190 + by / z0, 540, 1000, z0);
  const z1 = 2.6;
  const s = stoneC4(Math.min(t, T.whip0));
  const close = aim(s.root[0] - 55 + bx / z1, s.root[1] - 280 + by / z1, 540, 980, z1);
  let c = camLerp(near, close, E.settle(ph(t, T.rise0 + 0.1, T.whip0 + 0.12)));
  if (t > T.whip0) {
    const z2 = 0.85;
    const h = diveHer(t);
    const net = aim(h.chest[0] + 20 + bx / z2, (h.chest[1] - 8350) / 2 + by / z2, 540, 1000, z2);
    c = camLerp(c, net, E.io(ph(t, T.whip0, T.whip1)));
  }
  return c;
}
/** 往上甩时镜头这一帧在画面上竖着走了多少像素（给背景拖影用） */
export function smear6(t: number): number {
  if (t <= T.whip0 || t >= T.whip1) return 0;
  const a = cam6(t);
  const b = cam6(t - 1 / 60);
  return (a.y - b.y) * a.z;
}
