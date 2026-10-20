// 五② 尾奏两小节（136.02–140.02；138.02 小节线）：镜头接着跟他往上，天上的风把他往右带，从老钟家门前（窗口上方）飘过。
// 老钟刚被那一下震得扶住窗框，探出身子看见他；138.02 一脚踩上窗台扑出去，一把抓住他的脚踝，自己也被带离了窗台，吊在他脚下。
// 镜头往后退开：街两边的门一扇扇打开，人们走上街，抬头看天上的一老一小——阿满、年轻人从门里出来，周磊从右边路口跑来，
// 千斤和老太太从左边过来，还有哑铃店里的人（五③他们一个抓住一个的脚踝，连成人链）。
// 坐标是世界坐标；他在 lib/coatoff.ts，老钟在 lib/morning8.ts（zhongAt），时刻在 lib/t52.ts。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Cam, E, aim, camLerp, kick, ph, viewOf } from "./cam";
import { drawTinted } from "./world";
import { ARMS, type LiveOpts, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { CHAIN_T } from "./t52";
import { LAND_T } from "./t55";
import { stoneC4 } from "./coatoff";
import { cam51 } from "./stomp";

type V2 = [number, number];
const T = CHAIN_T;
export { CHAIN_T };

// ——— 街上的人 ———
type Angles = ReturnType<typeof pose>;
/** 走、跑的两步（f：朝向，正数朝右），站住抬头看（lx：眼睛往哪边看；point：远处那只手指着天上） */
export const stride = (f: number, run: boolean, a: boolean): Angles => {
  const k = a ? 1 : -1;
  const lean = run ? 16 : 4;
  return pose(lean, { face: f, ground: false, ...legR(k * (run ? 38 : 22), run ? -40 : -14, 0), ...legL(-k * (run ? 32 : 18), run ? -50 : -22, 0), neck: run ? 10 : 6, expression: "吓一跳", lookY: -0.4 }, (l) => ({
    ...armL(-k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
    ...armR(k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
  }));
};
export const lookUp = (f: number, lx: number, point: boolean): Angles =>
  pose(-4, { face: f, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 28, expression: "吓一跳", lookX: lx, lookY: -1 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...(point ? armR(150, 10, 0, "point", l) : armR(14, 24, 0, "relax", l)),
  }));

export interface Walker {
  spec: CastSpec;
  /** 从哪走到哪（根的 x）、站在离墙根多远（街面往镜头这边是正）；什么时候出来、什么时候站住；跑还是走；朝向；从门里出来的门在哪 */
  x0: number;
  x1: number;
  y1: number;
  t0: number;
  t1: number;
  run: boolean;
  face: number;
  door: number | null;
  lx: number;
  point: boolean;
  /** 五③ 还站在街上看（不跑去抓人） */
  stays: boolean;
  /** 五②的关键帧（到站住抬头看为止）和动作的底：五③（lib/link.ts）原样抄过去再往后接，弹簧接得上 */
  keys: MoveKey[];
  opts: LiveOpts;
  move: ReturnType<typeof live>;
}
function walker(spec: CastSpec, o: Omit<Walker, "spec" | "keys" | "opts" | "move">, seed: number): Walker {
  // 第一帧放在出来前 0.8 秒（弹簧从这里起算，放早了只是白算；从 100 秒起算时这里早已是同一个姿势）
  const keys: MoveKey[] = [{ t: o.t0 - 0.8, x: 0, p: stride(o.face, o.run, false) }];
  const step = o.run ? 0.17 : 0.24;
  let a = false;
  for (let t = o.t0 + step; t < o.t1; t += step) {
    keys.push({ t, ease: "inOut", p: stride(o.face, o.run, a) });
    a = !a;
  }
  keys.push({ t: o.t1 + 0.28, ease: "inOut", p: lookUp(o.face, o.lx, o.point) });
  const opts: LiveOpts = { look: lookOf(spec), base: { wind: 0.85 }, idle: true, seed, springs: ARMS, follow: 0 };
  return { spec, ...o, keys, opts, move: live([...keys, { t: 150, p: lookUp(o.face, o.lx, o.point) }], opts) };
}
/** 他们：从门里出来的往街上走两步站住，跑来的跑到跟前站住；都抬头看天上的一老一小（他们在画面里的哪边就往哪边看） */
export const CROWD: Walker[] = [
  // 阿满：最高那栋楼右边那栋五层楼的铺子里出来
  walker(CAST.阿满, { x0: -2390, x1: -2250, y1: 70, t0: T.doors0 + 0.1, t1: T.doors0 + 0.6, run: false, face: 0.6, door: -2390, lx: 0.5, point: false, stays: false }, 521),
  // 年轻人：老钟家右边那间小铺子里出来
  walker(CAST.年轻人, { x0: -1015, x1: -985, y1: 76, t0: T.doors0 + 0.35, t1: T.doors0 + 0.8, run: false, face: -0.6, door: -1015, lx: -0.5, point: true, stays: false }, 522),
  // 周磊：从右边路口跑来
  walker(CAST.周磊, { x0: -240, x1: -700, y1: 88, t0: T.doors0 + 0.2, t1: T.doors0 + 1.0, run: true, face: -0.85, door: null, lx: -0.5, point: true, stays: false }, 523),
  // 千斤：从左边（她家那栋楼那边）跑来
  walker(CAST.千斤, { x0: -3050, x1: -2450, y1: 96, t0: T.doors0 + 0.55, t1: T.doors0 + 1.25, run: true, face: 0.85, door: null, lx: 0.5, point: false, stays: false }, 524),
  // 老太太：跟在千斤后面慢慢走过来
  walker(CAST.老太太, { x0: -3050, x1: -2830, y1: 82, t0: T.doors0 + 0.85, t1: T.doors0 + 1.6, run: false, face: 0.6, door: null, lx: 0.5, point: false, stays: false }, 525),
  // 哑铃店里的人：楼脚的铺子里出来
  walker(passerby(6), { x0: -2790, x1: -2640, y1: 58, t0: T.doors0 + 0.7, t1: T.doors0 + 1.1, run: false, face: 0.6, door: -2790, lx: 0.5, point: false, stays: true }, 526),
];
/** 一个人这一刻：根、姿势；还没出来的不画 */
function walkerAt(w: Walker, t: number) {
  if (t < w.t0) return null;
  const u = ph(t, w.t0, w.t1);
  const x = w.x0 + (w.x1 - w.x0) * (w.run ? u : E.out(u));
  const y = w.door !== null ? -10 + (w.y1 + 10) * E.out(u) : w.y1;
  return { root: [x, y] as V2, pose: { ...w.move(t).pose } as PoseIn };
}

/** 门一扇扇打开（墙上的门洞，里面暗；门扇往里转开，窄下去）：人从门里出来之前 0.2 秒开 */
export function drawDoors(g: CanvasRenderingContext2D, t: number) {
  for (const w of CROWD) {
    if (w.door === null) continue;
    const k = E.out(ph(t, w.t0 - 0.22, w.t0 + 0.05));
    if (k <= 0) continue;
    const x = w.door;
    const dw = 110;
    const dh = 230;
    g.save();
    g.fillStyle = "#3b2c29";
    g.fillRect(x - dw / 2, -dh, dw, dh);
    // 门里一点暖光
    const gr = g.createLinearGradient(0, -dh, 0, 0);
    gr.addColorStop(0, "rgba(255,200,140,0.22)");
    gr.addColorStop(1, "rgba(255,200,140,0)");
    g.fillStyle = gr;
    g.fillRect(x - dw / 2, -dh, dw, dh);
    // 门扇：往里转开（宽度从整扇窄到一条）
    g.fillStyle = "#8a6450";
    g.fillRect(x - dw / 2, -dh, dw * (1 - 0.82 * k), dh);
    g.strokeStyle = "#4a3530";
    g.lineWidth = 4;
    g.strokeRect(x - dw / 2, -dh, dw, dh);
    g.restore();
  }
}
/** 街上的人（站在街面上，一起蒙一次早上的色）；不在画面里不画。onlyStays：五③跑去抓人的那几个由 lib/link.ts 画，这里只画还站着看的 */
export function drawCrowd(g: CanvasRenderingContext2D, t: number, cam: Cam, onlyStays = false) {
  const v = viewOf(cam, 1);
  // 五⑤ 跳过去以后（落回街上）哑铃店里的人回去了，只剩她救过的人
  if (t >= LAND_T.street0 - 1) return;
  const items = CROWD.filter((w) => !onlyStays || w.stays)
    .map((w) => ({ w, a: walkerAt(w, t) }))
    .filter((it) => it.a && it.a.root[0] > v.x0 - 300 && it.a.root[0] < v.x1 + 300) as { w: Walker; a: { root: V2; pose: PoseIn } }[];
  if (!items.length) return;
  const box: [number, number, number, number] = [Math.min(...items.map((it) => it.a.root[0])) - 400, -760, Math.max(...items.map((it) => it.a.root[0])) + 400, 220];
  drawTinted(g, box, (gg) => {
    // 离镜头近的（站得靠前的）后画
    for (const it of [...items].sort((p, q) => p.a.root[1] - q.a.root[1])) drawPerson(gg, it.w.spec, it.a.pose, it.a.root[0], it.a.root[1], cam.z);
  }, 0.85);
}


// ——— 镜头 ———
/** 手持呼吸：画面上约 3 像素 */
export const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/**
 * 五②的镜头：接着五①跟着他往上（0.6 秒接过去），跟着他被风往右带（他在画面上半截，下面露出老钟家那扇窗），倍数从 0.85 慢慢退到 0.65；
 * 138.02 老钟抓住那一下一震；之后柔和起步、一路减速地往后退开（0.42 倍），露出整条街和走上街的人
 */
export function cam52(t: number): Cam {
  const [bx, by] = breath(t);
  const k = stoneC4(t);
  const zf = 0.85 * Math.pow(0.65 / 0.85, E.io(ph(t, T.start, T.sweep1)));
  const follow = aim(k.root[0] + 60 + bx / zf, k.root[1] + 30 + by / zf, 540, 760, zf);
  let c = camLerp(cam51(T.start), follow, E.io(ph(t, T.start, T.start + 0.6)));
  const zw = 0.42;
  const wide = aim(-1760 + bx / zw, -760 + by / zw, 540, 880, zw);
  c = camLerp(c, wide, E.settle(ph(t, T.grab + 0.08, T.end + 0.3)));
  const kk = kick(t, T.grab, 0.1);
  return { ...c, z: c.z * (1 + 0.035 * kk), y: c.y + (8 * kk * Math.sin((t - T.grab) * 50)) / c.z };
}
