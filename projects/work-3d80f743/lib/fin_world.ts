// 重做那一段（lib/fin_t.ts）里世界上的东西：他妈妈那件外套、两边窗里关窗的人、抱住时炸开的暖光、落地的灰和裂缝、
// 白里的妈妈、她发梢化成的光。世界坐标（街面 y = 0）。

import { seeded } from "@frame/engine/math";
import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, H, W, applyCam, kick, ph, toScreen } from "./cam";
import { type Block, TOWER, Y_WHITE, drawGlow, part } from "./world";
import { LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { T8, T9 } from "./fin_t";
import { STONE_X, herAt } from "./fin_cast";
import { leadBand } from "./leadcoat";

type V2 = [number, number];

// ——————————————— 他妈妈那件橘色外套：堆在她家楼脚下（他 95.02 脱下来的） ———————————————
/** 外套那一堆的中心（和 lib/coatoff.ts 掉下来堆成一团的地方一样） */
export const COAT_X = STONE_X + 13;
export function drawCoatHeap(g: CanvasRenderingContext2D, t: number, line = 1) {
  const cx = COAT_X;
  const floor = 6;
  // 她那件短款堆起来的一团（原来按长外套 115 × 46）
  const w = 95;
  const ht = 40;
  // 她的靴底差一点碰到它（100.263）：被她带起来的风掀一下
  const lift = 6 * Math.exp(-Math.max(0, t - (T8.stop - 0.1)) / 0.25) * (t > T8.stop - 0.1 ? Math.abs(Math.sin((t - T8.stop) * 18)) : 0);
  const heap = new Path2D();
  heap.moveTo(cx - w, floor);
  heap.quadraticCurveTo(cx - w * 0.95, floor - ht * 0.9 - lift, cx - w * 0.2, floor - ht - lift);
  heap.quadraticCurveTo(cx + w * 0.45, floor - ht * 1.12 - lift, cx + w * 0.92, floor - ht * 0.45);
  heap.quadraticCurveTo(cx + w * 1.08, floor - 4, cx + w * 0.86, floor);
  heap.closePath();
  part(g, heap, "#f29a4a", "#de8538", 3.2 * line, [5, 4]);
  g.save();
  g.clip(heap);
  leadBand(g, cx - w * 1.2, floor - ht * 0.24, w * 2.4, ht * 0.24, 11, line);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - w * 0.3, floor - ht * 0.9);
  g.quadraticCurveTo(cx - w * 0.12, floor - ht * 0.55, cx - w * 0.22, floor - ht * 0.2);
  g.moveTo(cx + w * 0.3, floor - ht * 0.95);
  g.quadraticCurveTo(cx + w * 0.46, floor - ht * 0.55, cx + w * 0.4, floor - ht * 0.2);
  g.stroke();
  g.restore();
}

// ——————————————— 两边窗里的人：看着两个人坠下来、停住、又往上飘——一个接一个拉上窗帘、关了灯 ———————————————
/** 一栋楼第 f 层（0 是最上面一层）第 i 扇窗的玻璃（世界坐标）：和 world.ts 的 geomOf 同一套算法 */
function blockWindow(b: Block, f: number, i: number) {
  const u = b.fh / 128;
  const w = b.w / u;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const top = -b.floors * 128 - 60;
  const x = 20 + uw * i + uw * 0.18;
  const y = top + 70 + f * 128;
  return { x: b.x + x * u, y: y * u, w: uw * 0.64 * u, h: 74 * u, cage: { x: b.x + (x - 8) * u, y: (y - 8) * u, w: (uw * 0.64 + 16) * u, h: 96 * u } };
}
/** 关窗的那几扇：哪栋楼第几层第几扇、关的时刻、窗帘颜色、人站在窗的哪边、有没有防飘栏 */
const SHUTTERS: { b: Block; f: number; i: number; at: number; curtain: string; side: number; cage: boolean }[] = [
  { b: TOWER, f: 26, i: 1, at: T8.shut[0], curtain: "#9b5a52", side: 1, cage: true },
  { b: TOWER, f: 25, i: 2, at: T8.shut[1], curtain: "#5d6d86", side: -1, cage: true },
  { b: TOWER, f: 27, i: 1, at: T8.shut[2], curtain: "#8a7a52", side: 1, cage: true },
  { b: TOWER, f: 26, i: 2, at: T8.shut[3], curtain: "#6f5a7a", side: -1, cage: true },
  { b: TOWER, f: 24, i: 2, at: T8.shut[4], curtain: "#7f6550", side: 1, cage: true },
];
/**
 * 那几扇窗：两个人坠下来的时候窗里的人走到窗前看（人影：头和肩膀，头跟着两个人转）；到点前 0.2 秒往窗边一挪伸手，
 * 窗帘「啪」地从一边拉过来（0.1 秒），再过一下灯灭了。防飘栏的竖条画回去压在上面
 */
export function drawShutters(g: CanvasRenderingContext2D, t: number, pair: V2) {
  if (t < 99.6 || t > 112) return;
  for (const W of SHUTTERS) {
    const w = blockWindow(W.b, W.f, W.i);
    const d = t - W.at;
    const come = E.io(ph(t, 99.7 + (W.at - T8.shut[0]) * 0.3, 100.3 + (W.at - T8.shut[0]) * 0.3));
    const reach = E.io(ph(d, -0.2, 0));
    const close = E.out(ph(d, 0, 0.1));
    const off = E.io(ph(d, 0.14, 0.34));
    g.save();
    const glass = new Path2D();
    glass.rect(w.x, w.y, w.w, w.h);
    g.clip(glass);
    const lg = g.createLinearGradient(0, w.y, 0, w.y + w.h);
    lg.addColorStop(0, "rgb(255,214,150)");
    lg.addColorStop(1, "rgb(242,176,112)");
    g.fillStyle = lg;
    g.fillRect(w.x, w.y, w.w, w.h);
    if (come > 0.01) {
      // 人影：从屋里走到窗前，头跟着两个人转一点
      const look = Math.max(-1, Math.min(1, (pair[0] - (w.x + w.w / 2)) / 900));
      const cx = w.x + w.w * (0.5 + 0.12 * W.side * reach) + w.w * 0.08 * look;
      const sil = `rgba(64,44,48,${0.92 * come})`;
      g.fillStyle = sil;
      const hy = w.y + w.h * (0.42 + 0.3 * (1 - come));
      g.beginPath();
      g.arc(cx + w.w * 0.04 * look, hy, w.h * 0.14, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(cx, w.y + w.h * (0.98 + 0.3 * (1 - come)), w.w * 0.3, w.h * 0.36, 0, Math.PI, 0);
      g.fill();
      if (reach > 0) {
        g.lineCap = "round";
        g.strokeStyle = sil;
        g.lineWidth = w.h * 0.09;
        g.beginPath();
        g.moveTo(cx + W.side * w.w * 0.18, w.y + w.h * 0.72);
        g.lineTo(cx + W.side * w.w * (0.18 + 0.16 * reach), w.y + w.h * (0.72 - 0.34 * reach));
        g.stroke();
      }
    }
    if (close > 0) {
      const cw = w.w * close;
      const x0 = W.side < 0 ? w.x : w.x + w.w - cw;
      g.fillStyle = W.curtain;
      g.fillRect(x0, w.y, cw, w.h);
      g.strokeStyle = "rgba(0,0,0,0.18)";
      g.lineWidth = 3;
      for (let k = 1; k < 5; k++) {
        const x = x0 + (cw * k) / 5;
        g.beginPath();
        g.moveTo(x, w.y);
        g.lineTo(x, w.y + w.h);
        g.stroke();
      }
      g.fillStyle = `rgba(255,200,130,${0.32 * (1 - off)})`;
      g.fillRect(x0, w.y, cw, w.h);
      g.fillStyle = `rgba(30,26,40,${0.5 * off})`;
      g.fillRect(x0, w.y, cw, w.h);
    }
    g.restore();
    if (W.cage) {
      const c = w.cage;
      g.save();
      g.strokeStyle = "#3d2f33";
      g.lineWidth = 6;
      g.beginPath();
      for (let k = 1; k < 6; k++) {
        const bx = c.x + (c.w * k) / 6;
        g.moveTo(bx, c.y);
        g.lineTo(bx, c.y + c.h - 2 * (c.h / 96) * 8);
      }
      g.moveTo(c.x, c.y + (8 + 74 * 0.45) * (c.h / 96));
      g.lineTo(c.x + c.w, c.y + (8 + 74 * 0.45) * (c.h / 96));
      g.stroke();
      g.restore();
    }
  }
}

// ——————————————— 光 ———————————————
/**
 * 往上飘的人身上那团暖光（和前奏满天往上飘的人一样，远看像一盏灯）：他飘得越高越亮；抱住的那一下炸开、一圈一圈散掉。
 * z：镜头倍数（远景里按画面大小给一个下限）
 */
export function drawKidGlow(g: CanvasRenderingContext2D, t: number, at: V2, z: number) {
  let a = 0;
  let r = Math.max(110, 60 / z);
  if (t < T8.catch) a = 0.75 * Math.min(1, Math.max(0, (t - T8.kidUp - 0.2) / 0.8));
  else {
    const d = t - T8.catch;
    a = 0.95 * Math.exp(-d / 0.55);
    r *= 1 + 2.4 * E.out(Math.min(1, d / 0.7));
  }
  if (a > 0.01) drawGlow(g, at[0], at[1], r, a);
}
/** 她往下冲：身后几道风的线（越冲越长） */
export function drawDiveLines(g: CanvasRenderingContext2D, t: number, chest: V2, z: number) {
  if (t < T8.jump + 0.1 || t > T8.catch) return;
  const v = (t - T8.jump) / (T8.catch - T8.jump);
  const px = 1 / z;
  g.save();
  g.strokeStyle = "rgba(255,250,244,0.55)";
  g.lineCap = "round";
  g.lineWidth = Math.max(3, 2.4 * px);
  for (let i = 0; i < 6; i++) {
    const ox = (i - 2.5) * 34 + (i % 2 ? 8 : -8);
    const len = (160 + 420 * v) * (0.7 + 0.15 * (i % 3)) * Math.max(1, px / 3);
    const y0 = chest[1] - 380 - (i % 2) * 40;
    g.beginPath();
    g.moveTo(chest[0] + ox, y0);
    g.lineTo(chest[0] + ox, y0 - len);
    g.stroke();
  }
  g.restore();
}

// ——————————————— 落地：一团灰、几道裂缝 ———————————————
const CRACK = (() => {
  const r = seeded(9101);
  return Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI * (0.08 + (0.84 * k) / 6) + (r() - 0.5) * 0.2;
    const pts: V2[] = [[0, 0]];
    let x = 0;
    let y = 0;
    const len = 80 + r() * 90;
    for (let i = 0; i < 4; i++) {
      x += Math.cos(a) * (k % 2 ? 1 : -1) * (len / 4) + (r() - 0.5) * 10;
      y += Math.sin(a) * (len / 4) * 0.3 + (r() - 0.5) * 4;
      pts.push([x, y]);
    }
    return pts;
  });
})();
/** 铁靴「咚」地踩回街面：靴底两边各两团灰往外散，几道细裂缝 */
export function drawLandBurst(g: CanvasRenderingContext2D, t: number, x: number, at: number, z: number, big = 1) {
  const d = t - at;
  if (d < 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const grow = E.out(Math.min(1, d / 0.16));
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const c of CRACK) {
    const path = new Path2D();
    path.moveTo(x + c[0][0] * big, 4 + c[0][1]);
    const n = c.length - 1;
    for (let i = 1; i <= n; i++) {
      if (i - 1 > grow * n) break;
      const f = Math.min(1, grow * n - (i - 1));
      const [ax, ay] = c[i - 1];
      const [bx, by] = c[i];
      path.lineTo(x + (ax + (bx - ax) * f) * big, 4 + ay + (by - ay) * f);
    }
    g.strokeStyle = "rgba(255,240,220,0.5)";
    g.lineWidth = 4 * lw;
    g.save();
    g.translate(2 * lw, 2 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#6a5650";
    g.lineWidth = 3.2 * lw;
    g.stroke(path);
  }
  if (d < 0.8) {
    const u = Math.min(1, d / 0.75);
    g.fillStyle = `rgba(248,238,226,${0.62 * (1 - u) ** 1.4})`;
    for (const [dx, sz, k] of [
      [-90, 1, 0],
      [90, 1.1, 1],
      [-170, 0.7, 2],
      [170, 0.75, 3],
    ] as const) {
      g.beginPath();
      g.ellipse(x + dx * (0.7 + 1.0 * u) * big, -22 - 46 * u - k * 6, (60 + 90 * u) * sz * big, (26 + 34 * u) * sz * big, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

// ——————————————— 白里的妈妈：朝她张开手 → 放下了手 ———————————————
const MAMA = CAST.秤砣的妈妈;
/** 白里的她：张着手、闭着眼笑（淡淡的、发着光，看得出是妈妈：锈红色外套、长发、光着脚） */
const MAMA_OPEN = pose(-4, { face: -0.3, ground: false, float: 0.15, rot: 0, ...legR(8, -20, -50), ...legL(-6, -16, -54), neck: -14, expression: "释然", smile: 0.6, lookX: 0, lookY: 0.7 }, (l) => ({
  ...armL(-96, 14, 0, "open", l),
  ...armR(100, 14, 0, "open", l),
}));
const MAMA_DOWN = { ...MAMA_OPEN, expression: "微笑" as const, smile: 0.7, blink: 0.2, neck: -22, lookY: 1, ...armL(-12, 20, 0, "relax", -4), ...armR(14, 22, 0, "relax", -4) };
const mamaMove = live(
  [
    { t: 112, x: 0, p: MAMA_OPEN },
    { t: T9.momDown, p: MAMA_OPEN },
    { t: T9.momDown1, ease: "inOut", p: MAMA_DOWN },
    { t: 135, p: MAMA_DOWN },
  ] as MoveKey[],
  { look: lookOf(MAMA), base: { wind: 0.3 }, idle: true, seed: 863, springs: LIMP, follow: 0 },
);
/** 白里的妈妈在她头顶上的哪（世界坐标，根：脚底），按她的胸口：脚底贴着白的边，人在白里 */
export const mamaRootOf = (chest: V2): V2 => [chest[0] + 30, Y_WHITE - 10];
/**
 * 画白里的妈妈（白已经画好以后画）：淡淡的一层（screen 叠在白上，像光里浮出来的影子），淡进淡出。a：浓淡（0–1）
 */
export function drawMama(g: CanvasRenderingContext2D, t: number, root: V2, z: number, a: number, cv: { c: HTMLCanvasElement | null }, k = 0.45) {
  if (a <= 0.01) return;
  const p = mamaMove(t).pose;
  const j = jointsOf(p);
  // 画在一张小画布上，整个人统一淡下去（一层层透着画会看到手臂和身子叠在一起的地方）
  const M = g.getTransform();
  const box: [number, number, number, number] = [root[0] - 380 * k, root[1] - 640 * k, root[0] + 380 * k, root[1] + 120 * k];
  const pts = [
    [box[0], box[1]],
    [box[2], box[3]],
  ].map(([x, y]) => M.transformPoint(new DOMPoint(x, y)));
  const x0 = Math.floor(Math.min(pts[0].x, pts[1].x));
  const y0 = Math.floor(Math.min(pts[0].y, pts[1].y));
  const w = Math.ceil(Math.abs(pts[1].x - pts[0].x));
  const h = Math.ceil(Math.abs(pts[1].y - pts[0].y));
  if (w <= 0 || h <= 0) return;
  const c = (cv.c ??= document.createElement("canvas"));
  if (c.width < w || c.height < h) {
    c.width = Math.max(c.width, w);
    c.height = Math.max(c.height, h);
  }
  const bc = c.getContext("2d")!;
  bc.setTransform(1, 0, 0, 1, 0, 0);
  bc.clearRect(0, 0, c.width, c.height);
  bc.setTransform(M.a, M.b, M.c, M.d, M.e - x0, M.f - y0);
  bc.translate(root[0], root[1]);
  bc.scale(k, k);
  bc.translate(-root[0], -root[1]);
  drawGlow(bc, root[0] + j.neck[0] * MAMA.scale, root[1] + j.neck[1] * MAMA.scale + 40, 330, 0.5);
  drawPerson(bc, MAMA, p, root[0], root[1], z * k);
  // 往白里褪：一层暖白盖上去，像从光里浮出来
  bc.setTransform(1, 0, 0, 1, 0, 0);
  bc.globalCompositeOperation = "source-atop";
  bc.fillStyle = "rgba(255,246,236,0.52)";
  bc.fillRect(0, 0, w, h);
  bc.globalCompositeOperation = "source-over";
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = a * 0.62;
  g.drawImage(c, 0, 0, w, h, x0, y0, w, h);
  g.restore();
}

// ——————————————— 她的发梢化成光（白的边上） ———————————————
const MOTES = (() => {
  const r = seeded(8808);
  return Array.from({ length: 150 }, () => ({
    k: r(),
    a: (r() - 0.5) * Math.PI * 1.25,
    vx: (r() - 0.5) * 80,
    vy: -(60 + r() * 120),
    s: 3.2 + r() * 4.6,
    hue: [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20,
    ph: r() * 6,
  }));
})();
/**
 * 发梢化成的光：from 起一颗颗从发梢冒出来往上飘进白里，越往后越多；stop 以后不再冒，飘着的很快淡掉（被拉回来了）。
 * 画在白的上面（发梢就在白的边上）
 */
export function drawHairLight(g: CanvasRenderingContext2D, t: number, from: number, stop: number) {
  if (t < from) return;
  const h = herAt(t);
  const j = jointsOf(h.pose);
  const tip: V2 = [h.root[0] + j.head[0] - 4, h.root[1] + j.head[1] - 60];
  const k = E.io(ph(t, from, from + 0.8)) * (1 - E.io(ph(t, stop, stop + 0.4)));
  g.save();
  const rg = g.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 120);
  rg.addColorStop(0, `rgba(255,250,240,${0.5 * k})`);
  rg.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = rg;
  g.fillRect(tip[0] - 120, tip[1] - 120, 240, 240);
  const span = 2.2;
  for (const m of MOTES) {
    // 每颗按自己的相位循环冒出来（不是只冒一次）：t0 = from + 周期里的位置
    const period = 1.4;
    const t0 = from + m.k * span + Math.floor((t - from - m.k * span) / period) * period;
    if (t0 >= stop) continue;
    const a = t - t0;
    if (a < 0 || a > 1.3) continue;
    const x = tip[0] + 78 * Math.sin(m.a) + m.vx * a + 10 * Math.sin(a * 3 + m.ph);
    const y = tip[1] - 30 * Math.cos(m.a) + 40 * (1 - Math.cos(m.a)) + m.vy * a;
    const alpha = Math.min(1, a * 6) * (1 - a / 1.3) ** 1.1 * (0.7 + 0.3 * Math.sin(a * 8 + m.ph));
    g.globalAlpha = alpha * Math.min(1, (t - from) / 0.6);
    g.fillStyle = `hsl(${m.hue}, 82%, ${70 + 12 * Math.min(1, a)}%)`;
    g.beginPath();
    g.arc(x, y, m.s * (1 - 0.35 * a), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
/** 她眼角往上飘的泪珠（和开场光里的女人一样）：白的边上闭着眼时 */
export function drawFloatTears(g: CanvasRenderingContext2D, t: number, from: number, to: number) {
  if (t < from || t > to + 1) return;
  const h = herAt(t);
  const j = jointsOf(h.pose);
  const eye: V2 = [h.root[0] + j.head[0], h.root[1] + j.head[1] + 10];
  g.save();
  for (let i = 0; i < 6; i++) {
    const t0 = from + i * 0.32;
    const a = t - t0;
    if (a < 0 || a > 1.4 || t0 > to) continue;
    const side = i % 2 ? 1 : -1;
    const x = eye[0] + side * 22 + side * 10 * a + 4 * Math.sin(a * 5 + i);
    const y = eye[1] - 50 * a - 18 * a * a;
    g.globalAlpha = Math.min(1, a * 5) * (1 - a / 1.4);
    g.fillStyle = "rgba(226,240,255,0.95)";
    g.strokeStyle = "rgba(120,140,190,0.8)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.ellipse(x, y, 4.2, 5.6, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
  g.restore();
}
void kick;

// ——————————————— 手捧砖的近景：眼泪砸在她的字上 ———————————————
/**
 * 两滴眼泪从他的眼角掉下来，砸在砖上、洇开一块湿印（湿印留在砖上，慢慢淡一点）。eye：眼角（世界坐标），brick：砖的中心、转角
 */
export function drawBrickTears(g: CanvasRenderingContext2D, t: number, eye: V2, brick: { c: V2; rot: number }, z: number) {
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  T8.tears.forEach((tt, i) => {
    const dx = i === 0 ? -14 : 12;
    const hit: V2 = [brick.c[0] + dx * Math.cos(brick.rot), brick.c[1] - 6 + dx * Math.sin(brick.rot)];
    const fall = 0.3;
    const u = (t - (tt - fall)) / fall;
    if (u > 0 && u < 1) {
      const p: V2 = [eye[0] + (hit[0] - eye[0]) * u, eye[1] + (hit[1] - eye[1]) * u * u];
      const sz = 5.2 - 1.6 * u;
      g.save();
      g.fillStyle = "rgba(226,240,255,0.95)";
      g.strokeStyle = "rgba(110,130,185,0.8)";
      g.lineWidth = 1.4 * lw;
      g.beginPath();
      g.moveTo(p[0], p[1] - sz * 1.7);
      g.quadraticCurveTo(p[0] + sz * 1.05, p[1] + sz * 0.1, p[0], p[1] + sz);
      g.quadraticCurveTo(p[0] - sz * 1.05, p[1] + sz * 0.1, p[0], p[1] - sz * 1.7);
      g.fill();
      g.stroke();
      g.restore();
    }
    const d = t - tt;
    if (d >= 0) {
      // 砸开的一圈小水珠
      if (d < 0.18) {
        const v = d / 0.18;
        g.save();
        g.fillStyle = `rgba(226,240,255,${0.85 * (1 - v)})`;
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI * (0.1 + 0.2 * k);
          g.beginPath();
          g.arc(hit[0] + Math.cos(a) * 14 * v, hit[1] + Math.sin(a) * 8 * v, 1.8 * (1 - v) + 0.8, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      }
      // 湿印：砸下去以后洇开，留在砖上
      const w = E.out(Math.min(1, d / 0.35));
      g.save();
      g.translate(hit[0], hit[1]);
      g.rotate(brick.rot);
      g.fillStyle = "rgba(70,60,100,0.26)";
      g.beginPath();
      g.ellipse(0, 0, 3 + 7 * w, 2 + 4 * w, 0.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.4)";
      g.beginPath();
      g.ellipse(-2, -1.5, 1 + 1.4 * w, 0.8 + 0.7 * w, 0.2, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  });
}

// ——————————————— 尾奏：手一沉，砖暖了——全片最强的暖光 ———————————————
/**
 * 以砖为中心，soft-light 把整个画面提暖（亮处暖、深色的衣服头发不被染色），砖跟前叠一小团、一大团暖光（画在白和颗粒上面）。
 * c：砖的中心（世界坐标），w：亮到多少（0–1）
 */
export function drawWarmGlow(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, c: V2, w: number) {
  if (w <= 0.003) return;
  const [sx, sy] = toScreen(cam, c[0], c[1]);
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "soft-light";
  const wash = g.createRadialGradient(sx, sy, 0, sx, sy, 1500);
  wash.addColorStop(0, `rgba(255,186,110,${0.62 * w})`);
  wash.addColorStop(0.35, `rgba(255,190,120,${0.34 * w})`);
  wash.addColorStop(1, `rgba(255,200,150,${0.1 * w})`);
  g.fillStyle = wash;
  g.fillRect(0, 0, W, H);
  g.restore();
  g.save();
  applyCam(g, base, cam, 1);
  drawGlow(g, c[0], c[1], 50 + 16 * w, 0.75 * w);
  drawGlow(g, c[0], c[1], 150 * w, 0.26 * w);
  drawGlow(g, c[0], c[1] - 30, 380 * w, 0.08 * w);
  const far = Math.min(1, Math.max(0, (1 - cam.z) / 0.75));
  if (far > 0) {
    drawGlow(g, c[0], c[1], 30 / cam.z, 0.5 * w * far);
    drawGlow(g, c[0], c[1], 90 / cam.z, 0.25 * w * far);
  }
  g.restore();
}
