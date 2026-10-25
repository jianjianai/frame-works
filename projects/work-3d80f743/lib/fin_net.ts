// 重做那一段（lib/fin_t.ts）她光着脚往上升时穿过的那张网（天亮时还没散完：夜里被家里人用红绳拴住的人还挂在天上）：
// 她家那栋楼右边的天上，红绳拴在楼右边那一列的窗上；她从这几个人中间升过去，他们一个个睁开眼看着她过去（草稿：「网上的人睁开眼看着她」）。
// 画法照 lib/brick6.ts（拴着的人、红绳、绳结），世界坐标。远处几层的网照样用 brick6.ts 的 drawNet4Far。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Cam, viewOf } from "./cam";
import { TOWER, drawTinted } from "./world";
import { LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { cross, knot, rope } from "./net";
import { herChest } from "./fin_cast";

type V2 = [number, number];

/** 她家那栋楼第 f 层（0 最上面）最右那扇窗的窗台右下角（红绳拴在防飘栏上） */
function towerSill(f: number): V2 {
  const u = TOWER.fh / 128;
  const top = -TOWER.floors * 128 - 60;
  return [TOWER.x + TOWER.w - 30 * u, (top + 70 + f * 128 + 80) * u];
}
/** 拴着的人：仰着头、闭着眼（夜里飘上来，被拽住以后就这样挂着）；A 两只手往上够，B 一只手垂着 */
const HANG_A = pose(0, { face: 0.85, ground: false, float: 0, rot: 6, ...legL(-6, -30, -40), ...legR(8, -18, -36), neck: 18, expression: "闭眼", sad: 0.6, lookX: 0.1, lookY: -1 }, (l) => ({
  ...armL(150, 20, 0, "open", l),
  ...armR(166, 14, 0, "open", l),
}));
const HANG_B = pose(4, { face: -0.85, ground: false, float: 0, rot: -4, ...legL(-2, -12, -44), ...legR(10, -26, -40), neck: 10, expression: "闭眼", sad: 0.7, lookX: 0, lookY: 0.4 }, (l) => ({
  ...armL(16, 26, 0, "relax", l),
  ...armR(152, 20, 0, "open", l),
}));
interface Hanger {
  hip: V2;
  spec: CastSpec;
  anchor: V2;
  ph: number;
  move: ReturnType<typeof live>;
  /** 红绳画在她前面（她从这根绳子后面升过去） */
  front: boolean;
}
/** 一个拴着的人：她升到跟前时睁开眼，转过眼睛看她（吓一跳 → 仰望，只动眼睛和脖子） */
function hanger(hip: V2, n: number, anchor: V2, base: typeof HANG_A, see: number, look: { x: number; y: number; neck: number }, seed: number, front = false): Hanger {
  const spec = passerby(n);
  const seeP = { ...base, expression: "吓一跳", sad: 0.3, lookX: look.x, lookY: look.y, neck: look.neck };
  const after = { ...base, expression: "仰望", sad: 0.7, lookX: look.x * 0.6, lookY: look.y - 0.3, neck: look.neck + 6 };
  const move = live(
    [
      { t: 104, x: 0, p: base },
      { t: see - 0.22, p: base },
      { t: see + 0.06, ease: "inOut", p: seeP },
      { t: see + 0.7, ease: "inOut", p: after },
      { t: 140, p: after },
    ] as MoveKey[],
    { look: lookOf(spec), base: { wind: 0.5 }, idle: true, seed, springs: LIMP, follow: 0 },
  );
  return { hip, spec, anchor, ph: seed * 0.37, move, front };
}
/** 她升到这个高度的时刻（看她用） */
function passAt(y: number): number {
  for (let t = 104; t < 112; t += 0.01) if (herChest(t)[1] < y) return t;
  return 112;
}
let NET: Hanger[] | null = null;
function net(): Hanger[] {
  if (NET) return NET;
  NET = [
    hanger([-2500, -5640], 21, towerSill(10), { ...HANG_B, face: 0.85, rot: 4 }, passAt(-5480), { x: 0.8, y: 0.2, neck: 4 }, 71),
    hanger([-1900, -6080], 9, towerSill(8), { ...HANG_A, face: -0.85, rot: -6 }, passAt(-5950), { x: -0.8, y: 0.1, neck: -4 }, 72, true),
    hanger([-2420, -6760], 17, towerSill(6), HANG_A, passAt(-6600), { x: 0.7, y: 0.5, neck: -10 }, 73),
    hanger([-1980, -7260], 4, towerSill(4), { ...HANG_B, face: -0.85 }, passAt(-7120), { x: -0.8, y: 0.3, neck: 0 }, 74, true),
    hanger([-2640, -7760], 26, towerSill(2), { ...HANG_A, face: 0.85 }, passAt(-7640), { x: 0.7, y: 0.6, neck: -14 }, 75),
  ];
  return NET;
}
function hangerAt(h: Hanger, t: number) {
  const p: PoseIn = { ...h.move(t).pose };
  const hip: V2 = [h.hip[0] + 8 * Math.sin(t * 0.7 + h.ph), h.hip[1] + 10 * Math.sin(t * 1.1 + h.ph) + 5 * Math.sin(t * 2.3 + h.ph * 2)];
  const j = castJoints(h.spec, p);
  const root: V2 = [hip[0] - j.hip[0], hip[1] - j.hip[1]];
  return { pose: p, root, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]] as V2 };
}
/** 网在不在画面里 */
function inView(cam: Cam) {
  const v = viewOf(cam, 1);
  return !(v.x1 < -3000 || v.x0 > -1500 || v.y1 < -8400 || v.y0 > -4800);
}
function drawRope(g: CanvasRenderingContext2D, s: [V2, V2], cam: Cam) {
  const ga = g.globalAlpha;
  g.globalAlpha = ga * (0.5 + 0.5 * Math.min(1, Math.max(0, (cam.z - 0.2) / 0.4)));
  rope(g, s, cam.z, 2.4, cam.z > 0.3);
  g.globalAlpha = ga;
}
/** 她后面的红绳、拴着的人（一起蒙一次天色） */
export function drawFinNet(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  if (!inView(cam)) return;
  const v = viewOf(cam, 1);
  const items = net().map((h) => ({ h, q: hangerAt(h, t) }));
  for (const it of items) if (!it.h.front) drawRope(g, [it.q.ankle, it.h.anchor], cam);
  const vis = items.filter((it) => it.q.root[0] > v.x0 - 300 && it.q.root[0] < v.x1 + 300 && it.q.root[1] > v.y0 - 600 && it.q.root[1] < v.y1 + 600);
  if (!vis.length) return;
  let box: [number, number, number, number] = [1e9, 1e9, -1e9, -1e9];
  for (const it of vis) box = [Math.min(box[0], it.q.root[0] - 420), Math.min(box[1], it.q.root[1] - 720), Math.max(box[2], it.q.root[0] + 420), Math.max(box[3], it.q.root[1] + 120)];
  drawTinted(g, box, (gg) => {
    for (const it of vis) drawPerson(gg, it.h.spec, it.q.pose, it.q.root[0], it.q.root[1], cam.z);
  }, 0.85);
}
/** 画在她前面的：她从后面升过去的那几根红绳、所有绳结 */
export function drawFinNetFront(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  if (!inView(cam)) return;
  const segs = net().map((h) => {
    const q = hangerAt(h, t);
    return { s: [q.ankle, h.anchor] as [V2, V2], front: h.front };
  });
  for (const it of segs) if (it.front) drawRope(g, it.s, cam);
  for (let a = 0; a < segs.length; a++)
    for (let b = a + 1; b < segs.length; b++) {
      const c = cross(segs[a].s[0], segs[a].s[1], segs[b].s[0], segs[b].s[1]);
      if (c) knot(g, c, cam.z, 1);
    }
}
void armL;
void armR;
