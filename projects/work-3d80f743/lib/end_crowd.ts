// 街坊：人链连起来以后（第二声起），街上的人都出来了，站在马路上、人行道上仰着头望着人链（前奏里路人都低着头走、没有人抬头）。
// 用户 2026-10-26（2:05.53，整条人链的大远景）：「这里下面太空了，需要优化」——镜头退到 0.2 倍时，老钟家两边的缺口（左边她家那栋楼和千斤家
// 之间的巷子、右边前奏的路口）露出远处几层城脚下一大片平平的地面（对面人行道 D 1.25 的地面，退远以后成了一条没有窗的「墙」）。
// 几排人按远近（D 1.05–1.2）站在这条带子里，脚落在带子的不同高度上，把它填满；人行道上（D 1）再站一排。
// 只在镜头退远时淡进来（和远处的高楼一样按 wide），街上近景一帧不变。人很小，姿势算一次存着。

import { type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, type PoseIn, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { type Cam, applyCam, toScreen, W } from "./cam";
import { drawTinted } from "./world";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { TE } from "./end_t";
import { X_K } from "./end_map";

/** 仰头望着的几种手：垂着（多一些）、捂着嘴、两只手攥在胸前、往上伸、往上指、两只手都伸上去 */
const ARMS: ((face: number) => Angles)[] = [
  () => ({ ...armL(-4, 16, 0, "relax", 0), ...armR(4, 18, 0, "relax", 0) }),
  () => ({ ...armL(-2, 20, 0, "relax", 0), ...armR(6, 14, 0, "relax", 0) }),
  () => ({ ...armL(24, 140, 10, "relax", 0), ...armR(4, 18, 0, "relax", 0) }),
  () => ({ ...armL(22, 112, 0, "fist", 0), ...armR(26, 104, 0, "fist", 0) }),
  () => ({ ...armL(-4, 16, 0, "relax", 0), ...armR(158, 12, 0, "open", 0) }),
  () => ({ ...armL(30, 40, 0, "relax", 0), ...armR(150, 8, 0, "point", 0) }),
  () => ({ ...armL(150, 14, 0, "open", 0), ...armR(160, 12, 0, "open", 0) }),
];

interface Person {
  D: number;
  x: number;
  spec: CastSpec;
  pose: PoseIn;
}

/**
 * 一排人：三三两两（每处 1–3 个，挨着站），处与处之间隔 gap0–gap1（层坐标），skip 里的那几段不站人（人链脚下、老钟家门口）。
 * 第一版一排排挨着站满，像演唱会，把人链脚下全盖住了
 */
function rowOf(D: number, x0: number, x1: number, gap0: number, gap1: number, seed: number, skip: [number, number][]): Person[] {
  const r = seeded(seed);
  const xs: number[] = [];
  for (let c = x0 + r() * gap0; c < x1; c += gap0 + r() * (gap1 - gap0)) {
    const n = 1 + Math.floor(r() * r() * 3);
    for (let i = 0; i < n; i++) xs.push(c + i * (60 + r() * 40));
  }
  const out: Person[] = [];
  for (const x of xs) {
    if (skip.some(([a, b]) => x > a && x < b)) continue;
    const spec = passerby(Math.floor(r() * 40));
    // 朝着人链（人链在 X_K 那条竖线上）：3/4 侧过来，仰着头
    const face = (x < X_K ? 1 : -1) * (0.55 + r() * 0.3);
    const arms = ARMS[Math.floor(r() * ARMS.length)](face);
    const p: Angles = {
      face,
      ...legR(4 + r() * 6, -4 - r() * 6),
      ...legL(-4 - r() * 6, -3 - r() * 4),
      lean: -4 - r() * 6,
      neck: 24 + r() * 14,
      expression: "仰望",
      sad: 0.2 + r() * 0.4,
      lookX: (x < X_K ? 1 : -1) * (0.2 + r() * 0.3),
      lookY: -1,
      wind: 0.5,
      ...arms,
    };
    out.push({ D, x, spec, pose: figurePose(p, 118 + r() * 4, lookOf(spec)) });
  }
  return out;
}

let ROWS: Person[][] | null = null;
const rows = () =>
  (ROWS ??= [
    // 远的排在前面先画（近的挡住远的）
    rowOf(1.18, X_K - 3300, X_K + 3000, 380, 820, 911, [[X_K - 200, X_K + 200]]),
    rowOf(1.09, X_K - 3200, X_K + 2900, 520, 1100, 912, [[X_K - 320, X_K + 320]]),
  ]);
let NEAR: Person[] | null = null;
/** 人行道上（D 1，楼前面）：老钟家门口和人链脚下空着 */
const nearRow = () => (NEAR ??= rowOf(1, X_K - 3000, X_K + 2700, 900, 1700, 914, [[-2140, -1120]]));

/** 这一刻街坊淡进来多少：人链连起来以后，镜头退远时 */
const shown = (t: number, wide: number) => (t < TE.chainCut ? 0 : wide);

/**
 * 每个人只画一次，存成一张小图（姿势不动；含暮色），之后每帧按镜头贴上去。
 * 每帧现画二十几个人，这一镜在服务器上一帧要多半秒（原来约 0.13 秒）
 */
const SPRITE_K = 0.36;
const BOX = { x0: -230, y0: -640, x1: 230, y1: 60 };
const sprites = new Map<Person, HTMLCanvasElement>();
function spriteOf(p: Person, z: number): HTMLCanvasElement {
  let cv = sprites.get(p);
  if (!cv) {
    cv = document.createElement("canvas");
    cv.width = Math.ceil((BOX.x1 - BOX.x0) * SPRITE_K);
    cv.height = Math.ceil((BOX.y1 - BOX.y0) * SPRITE_K);
    const cc = cv.getContext("2d")!;
    cc.setTransform(SPRITE_K, 0, 0, SPRITE_K, -BOX.x0 * SPRITE_K, -BOX.y0 * SPRITE_K);
    drawTinted(cc, [BOX.x0, BOX.y0, BOX.x1, BOX.y1], (g2) => drawPerson(g2, p.spec, p.pose, 0, 0, z), 1);
    sprites.set(p, cv);
  }
  return cv;
}

function drawRow(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, row: Person[], a: number) {
  if (!row.length) return;
  const D = row[0].D;
  applyCam(g, base, cam, D);
  g.save();
  // 远一点的淡一点（蒙着空气），不和人链抢
  g.globalAlpha = a * (D > 1 ? 0.8 : 0.9);
  for (const p of row) {
    // 看得见的才画
    const [sx] = toScreen(cam, p.x, 0, D);
    if (sx < -120 || sx > W + 120) continue;
    // 描边粗细按这一镜退得最远时（0.2 倍）定下来
    g.drawImage(spriteOf(p, 0.2 / p.D), p.x + BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0);
  }
  g.restore();
}

/** 马路上的几排（D 1.05–1.2）：画在远处的城和对面人行道之后、人这一层的楼之前（drawCity 的 between，D = 对面人行道那一层） */
export function drawCrowdFar(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number, wide: number) {
  // 退远以前那几秒，每帧先把两个人的小图画好（全在退开那一帧现画，播放会顿一下）
  if (t > TE.chainCut + 1.5 && t < TE.highCut + 1.6) {
    let n = 0;
    for (const p of [...rows().flat(), ...nearRow()]) {
      if (sprites.has(p)) continue;
      spriteOf(p, 0.2 / p.D);
      if (++n >= 2) break;
    }
  }
  const a = shown(t, wide);
  if (a < 0.01) return;
  for (const row of rows()) drawRow(g, base, cam, row, a);
}

/** 人行道上的一排（D 1）：画在楼和街面之后、坑和人链之前 */
export function drawCrowdNear(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number, wide: number) {
  const a = shown(t, wide);
  if (a < 0.01) return;
  drawRow(g, base, cam, nearRow(), a);
}
