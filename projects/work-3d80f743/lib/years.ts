// 间奏里她跑过的两个地方（lib/grow.ts 用；2026-10-25 用户「用过度的方法切两次地点，主角每次切换时位置一样」）：
//   A 秋天早上的公交站：候车亭（顶棚、两根柱子、玻璃后板上一张广告和一张线路图、长凳）、站牌（蓝牌头、白底上的线路号），
//     两棵叶子黄了的梧桐、地上的落叶、往下飘的叶子；候车亭左头两个等车的人低着头，谁也不抬头——飘起来的大叔就是从这里飘上去的。
//   B 冬天傍晚的学校门口：围墙（矮砖墙 + 铁栏杆）、两根门柱（左边那根挂着白底黑字的校牌）、拉出一半的伸缩门，
//     门里的教学楼一层层亮着灯、旗杆上的红旗，路灯亮着，光秃秃的梧桐；放学的学生低着头往外走。
// 都按她的坐标摆：X 是她在那里落地跪下的地方（grow.ts 给）；远处的城另挪一截，和十二年前那条街看着不是一个地方。
// 画的顺序：天、远处的城、人这一层的楼、街面、树和东西、背景里的人（people 回调：等车的人、学生、被她拽下来的人）、飘的叶子。

import { type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import type { Angles, MoveKey } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { type Cam, applyCam, viewOf } from "./cam";
import { type Block, INK, addEllipse, drawBlock, drawBlockGlow, drawCity, drawGlow, drawSky, drawStreet, part, planeTree, rectPath } from "./world";
import { HAND_FONT } from "./note";
import { type Walker, drawPerson, walkerAt } from "./people";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { STUDENT } from "./saved";

type V2 = [number, number];

// ——— 共用：落叶 ———
const LEAF_COLS: [string, string][] = [
  ["#e3a23c", "#c98a2e"],
  ["#eebd57", "#d6a444"],
  ["#cf6e34", "#b65d2a"],
  ["#d99436", "#bf7f2c"],
];
function leafPath(L: number, w: number) {
  const p = new Path2D();
  p.moveTo(-L, 0);
  p.quadraticCurveTo(-L * 0.1, -w, L, 0);
  p.quadraticCurveTo(-L * 0.1, w, -L, 0);
  p.closePath();
  return p;
}
const LEAF = leafPath(13, 7);

/** 地上的落叶（世界里固定的位置，按她的坐标） */
const GROUND_LEAVES = (() => {
  const r = seeded(511);
  return Array.from({ length: 90 }, () => ({ x: -1900 + r() * 4200, y: 8 + r() ** 1.4 * 330, rot: r() * 6.28, s: 0.75 + r() * 0.6, c: Math.floor(r() * LEAF_COLS.length) }));
})();
/** 往下飘的叶子：从树冠那么高一路打着转飘下来，循环 */
const FALL_LEAVES = (() => {
  const r = seeded(523);
  return Array.from({ length: 34 }, () => ({ x: -1700 + r() * 3800, ph: r(), v: 120 + r() * 90, amp: 30 + r() * 50, f: 0.8 + r() * 0.9, spin: 2 + r() * 3, s: 0.8 + r() * 0.5, c: Math.floor(r() * LEAF_COLS.length) }));
})();

function drawLeaf(g: CanvasRenderingContext2D, x: number, y: number, rot: number, sx: number, s: number, c: number, lw: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(sx * s, s);
  g.fillStyle = LEAF_COLS[c][0];
  g.fill(LEAF);
  g.strokeStyle = INK;
  g.lineWidth = lw / Math.max(0.3, s);
  g.stroke(LEAF);
  g.restore();
}

// ——— A 秋天早上的公交站 ———
const blocksA = new Map<number, Block[]>();
function blocksOfA(X: number): Block[] {
  let b = blocksA.get(X);
  if (!b) {
    b = [
      { x: X - 2350, w: 640, floors: 6, fh: 235, wall: "#ecd8b2", wallShade: "#ddc59c", seed: 531, shop: "#d9a441" },
      { x: X - 1650, w: 820, floors: 5, fh: 250, wall: "#e4b79c", wallShade: "#d4a388", seed: 532, shop: "#c96a52" },
      { x: X - 760, w: 700, floors: 7, fh: 225, wall: "#efe0c2", wallShade: "#e0cda9", seed: 533 },
      { x: X + 0, w: 760, floors: 6, fh: 240, wall: "#e8c7a4", wallShade: "#d9b38e", seed: 534, shop: "#6f8f86" },
      { x: X + 820, w: 640, floors: 8, fh: 215, wall: "#ead6b8", wallShade: "#dbc3a1", seed: 535 },
      { x: X + 1520, w: 720, floors: 5, fh: 245, wall: "#e2b9a6", wallShade: "#d2a592", seed: 536, shop: "#d9a441" },
    ];
    blocksA.set(X, b);
  }
  return b;
}

/** 候车亭（在她落地的地方后面）：x0..x1、顶棚底下的高度 */
export const SHELTER = { x0: -560, x1: 700, top: -830 };

function drawShelter(g: CanvasRenderingContext2D, X: number) {
  const x0 = X + SHELTER.x0;
  const x1 = X + SHELTER.x1;
  const top = SHELTER.top;
  const lw = 3.2;
  // 玻璃后板：三格，淡青色半透明，一道道斜的反光
  const gy0 = top + 46;
  const gy1 = -78;
  const glass = rectPath(x0 + 16, gy0, x1 - x0 - 32, gy1 - gy0);
  g.fillStyle = "rgba(198,224,228,0.5)";
  g.fill(glass);
  g.save();
  g.clip(glass);
  g.fillStyle = "rgba(255,255,255,0.28)";
  for (let x = x0 + 60; x < x1; x += 230) {
    g.beginPath();
    g.moveTo(x, gy1);
    g.lineTo(x + 90, gy0);
    g.lineTo(x + 140, gy0);
    g.lineTo(x + 50, gy1);
    g.closePath();
    g.fill();
  }
  g.restore();
  // 左格里一张广告（暖色：太阳、山、几行字），右格里一张线路图
  const bw = (x1 - x0) / 3;
  const ad = rectPath(x0 + 46, top + 110, bw - 70, 470);
  part(g, ad, "#f6d9ad", "#ead0a0", lw * 0.8, [5, 4]);
  g.save();
  g.clip(ad);
  g.fillStyle = "#f19366";
  g.beginPath();
  g.arc(x0 + 46 + (bw - 70) * 0.62, top + 230, 62, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#86b9ad";
  g.beginPath();
  g.moveTo(x0 + 30, top + 420);
  g.quadraticCurveTo(x0 + 120, top + 300, x0 + 200, top + 390);
  g.quadraticCurveTo(x0 + 260, top + 330, x0 + bw, top + 380);
  g.lineTo(x0 + bw, top + 600);
  g.lineTo(x0 + 30, top + 600);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,250,240,0.9)";
  g.fillRect(x0 + 70, top + 470, bw - 130, 16);
  g.fillRect(x0 + 70, top + 500, bw - 170, 12);
  g.fillRect(x0 + 70, top + 524, bw - 150, 12);
  g.restore();
  const map = rectPath(x1 - bw + 34, top + 140, bw - 80, 380);
  part(g, map, "#f4f1ea", "#e6e1d6", lw * 0.8, [5, 4]);
  g.strokeStyle = "#3d6ea5";
  g.lineWidth = 5;
  g.beginPath();
  const mx = x1 - bw + 34 + (bw - 80) / 2;
  g.moveTo(mx, top + 175);
  g.lineTo(mx, top + 490);
  g.stroke();
  g.fillStyle = "#3d6ea5";
  for (let k = 0; k < 7; k++) {
    const y = top + 180 + k * 50;
    g.beginPath();
    g.arc(mx, y, 7, 0, Math.PI * 2);
    g.fill();
    g.fillRect(mx + 16, y - 3, 40 + ((k * 37) % 30), 6);
  }
  // 格子之间的竖框
  g.strokeStyle = "#4d665e";
  g.lineWidth = 9;
  g.beginPath();
  for (let k = 1; k < 3; k++) {
    g.moveTo(x0 + bw * k, gy0);
    g.lineTo(x0 + bw * k, gy1);
  }
  g.moveTo(x0 + 16, gy1);
  g.lineTo(x1 - 16, gy1);
  g.stroke();
  // 长凳
  part(g, rectPath(x0 + bw * 1.08, -196, bw * 0.84, 22), "#c48c5c", "#a87548", lw, [5, 4]);
  part(g, rectPath(x0 + bw * 1.16, -174, 14, 174), "#6b7a78", null, lw * 0.8);
  part(g, rectPath(x0 + bw * 1.84, -174, 14, 174), "#6b7a78", null, lw * 0.8);
  // 两根柱子、顶棚（前沿一道浅色的边）
  part(g, rectPath(x0 - 6, top, 30, -top), "#5f7a72", "#4d665e", lw, [6, 4]);
  part(g, rectPath(x1 - 24, top, 30, -top), "#5f7a72", "#4d665e", lw, [6, 4]);
  const roof = new Path2D();
  roof.moveTo(x0 - 70, top - 46);
  roof.lineTo(x1 + 70, top - 60);
  roof.lineTo(x1 + 76, top);
  roof.lineTo(x0 - 64, top);
  roof.closePath();
  part(g, roof, "#6a877e", "#55716a", lw, [7, 5]);
  g.strokeStyle = "rgba(240,248,240,0.55)";
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x0 - 58, top - 38);
  g.lineTo(x1 + 60, top - 52);
  g.stroke();
}

/** 站牌：一根杆子，顶上蓝牌头（白色的公交车）、白底上一个大大的线路号和几行站名 */
function drawStopSign(g: CanvasRenderingContext2D, X: number) {
  const px = X + SHELTER.x1 + 170;
  const lw = 3.2;
  part(g, rectPath(px - 10, -1010, 20, 1010), "#7c8a90", "#68757b", lw, [4, 3]);
  const bx = px - 92;
  const top = -1080;
  part(g, rectPath(bx, top, 184, 340), "#f4f1ea", "#e4dfd3", lw, [6, 4]);
  part(g, rectPath(bx, top, 184, 70), "#3d6ea5", null, lw);
  // 白色的公交车
  g.fillStyle = "#f4f1ea";
  const cx = bx + 92;
  const cy = top + 36;
  g.beginPath();
  g.roundRect(cx - 40, cy - 20, 80, 36, 8);
  g.fill();
  g.fillStyle = "#3d6ea5";
  g.fillRect(cx - 32, cy - 13, 18, 12);
  g.fillRect(cx - 9, cy - 13, 18, 12);
  g.fillRect(cx + 14, cy - 13, 18, 12);
  g.fillStyle = "#f4f1ea";
  g.beginPath();
  g.arc(cx - 22, cy + 18, 7, 0, Math.PI * 2);
  g.arc(cx + 22, cy + 18, 7, 0, Math.PI * 2);
  g.fill();
  // 线路号、几行站名
  g.fillStyle = "#c9473d";
  g.beginPath();
  g.arc(cx, top + 130, 38, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff8ee";
  g.font = "bold 44px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("12", cx, top + 132);
  g.fillStyle = "rgba(70,80,96,0.55)";
  for (let k = 0; k < 4; k++) g.fillRect(bx + 26, top + 190 + k * 34, 132 - ((k * 29) % 40), 10);
}

/** 候车亭右头等车的两个人：低着头，谁也不抬头（大叔就是从他们旁边飘上去的；她救人、递砖都在他们眼前） */
const WAIT_SPECS: CastSpec[] = [passerby(3), passerby(5)];
const WAIT_POSES: Angles[] = [
  pose(4, { face: -0.62, ...legR(6, -8), ...legL(-6, -4), neck: -28, expression: "低头看", sad: 0.3, lookY: 1 }, (l) => ({ ...armL(-2, 24, 6, "grip", l), ...armR(6, 30, 0, "relax", l) })),
  pose(3, { face: -0.7, ...legR(4, -6), ...legL(-8, -4), neck: -24, expression: "低头看", sad: 0.4, lookY: 1 }, (l) => ({ ...armL(-4, 18, 6, "grip", l), ...armR(4, 20, 0, "relax", l) })),
];
const WAIT_MOVES = WAIT_SPECS.map((spec, i) => live([{ t: 0, x: 0, p: WAIT_POSES[i] }] as MoveKey[], { look: lookOf(spec), base: { wind: 0.3 }, idle: true, seed: 90 + i, springs: ARMS, follow: 0 }));
const WAIT_X = [560, 700];

export function drawBusStop(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number, sh: [number, number], X: number, people: () => void) {
  const far: Cam = { ...cam, x: cam.x + 2600 };
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawSky(g, base, far);
  drawCity(g, base, far, t, undefined, sh, { light: 1, haze: 0.04, trees: "autumn" });
  applyCam(g, base, cam, 1, sh);
  const v = viewOf(cam, 1);
  for (const b of blocksOfA(X)) {
    if (b.x > v.x1 + 50 || b.x + b.w < v.x0 - 50) continue;
    drawBlock(g, b, cam, 1, 2, 3.2, t);
    drawBlockGlow(g, b, cam, 1);
  }
  drawStreet(g, cam);
  // 地上的落叶
  for (const f of GROUND_LEAVES) {
    const x = X + f.x;
    if (x < v.x0 - 30 || x > v.x1 + 30) continue;
    drawLeaf(g, x, f.y, f.rot, 1, f.s * (0.9 + f.y / 900), f.c, 1.6);
  }
  for (const [dx, seed] of [
    [-1080, 41],
    [930, 47],
  ] as const) {
    if (X + dx > v.x0 - 600 && X + dx < v.x1 + 600) planeTree(g, X + dx, t, 3.2, seed, cam.z, "autumn");
  }
  if (X + SHELTER.x0 - 100 < v.x1 && X + SHELTER.x1 + 300 > v.x0) {
    drawShelter(g, X);
    drawStopSign(g, X);
  }
  WAIT_SPECS.forEach((spec, i) => {
    const x = X + WAIT_X[i];
    if (x < v.x0 - 200 || x > v.x1 + 200) return;
    drawPerson(g, spec, WAIT_MOVES[i](t).pose, x, 0, cam.z);
  });
  people();
  applyCam(g, base, cam, 1, sh);
  // 往下飘的叶子：从树冠那么高一路打着转飘下来，循环
  for (const f of FALL_LEAVES) {
    const span = 1500;
    const y = -1450 + ((((t + f.ph * 20) * f.v) % span) + span) % span;
    const x = X + f.x + f.amp * Math.sin(t * f.f + f.ph * 6) + 0.12 * (y + 1450);
    if (x < v.x0 - 40 || x > v.x1 + 40 || y < v.y0 - 40) continue;
    drawLeaf(g, x, y, t * f.spin * 0.3 + f.ph * 6, Math.cos(t * f.spin + f.ph * 9), f.s, f.c, 1.6);
  }
}

// ——— B 冬天傍晚的学校门口 ———
/** 门柱、门洞、伸缩门（按她落地跪下的地方） */
export const GATE = { lp0: -280, lp1: -130, rp0: 720, rp1: 870, top: -990, folding: 380 };
const blocksB = new Map<number, Block[]>();
function blocksOfB(X: number): Block[] {
  let b = blocksB.get(X);
  if (!b) {
    b = [
      { x: X - 2500, w: 700, floors: 7, fh: 225, wall: "#e6cdb6", wallShade: "#d6b9a0", seed: 541 },
      { x: X - 1760, w: 560, floors: 6, fh: 240, wall: "#dcc2b4", wallShade: "#cdb0a1", seed: 542, shop: "#9b6a8a" },
      { x: X + 1900, w: 680, floors: 7, fh: 230, wall: "#e4cfb4", wallShade: "#d4bb9d", seed: 543 },
      { x: X + 2640, w: 600, floors: 5, fh: 250, wall: "#dfc0ae", wallShade: "#cfab98", seed: 544, shop: "#6f8f86" },
    ];
    blocksB.set(X, b);
  }
  return b;
}

/** 门里的教学楼（在操场那头，D = 1.5 那一层：比围墙远、小一点，上面露出傍晚的天）：一长溜三层，每层一道红色的走廊栏杆，
 *  窗一格格亮着灯；楼顶正中一面钟。傍晚的颜色直接画（灰紫的墙、暖黄的灯）。操场上一根旗杆、一面红旗 */
function drawSchoolHouse(g: CanvasRenderingContext2D, X: number, t: number) {
  const x0 = X - 1700;
  const x1 = X + 2100;
  const fh = 220;
  const top = -3 * fh - 110;
  const lw = 3;
  part(g, rectPath(x0, top, x1 - x0, -top + 40), "#d3c0bd", "#c2adab", lw, [10, 8]);
  const r = seeded(551);
  for (let f = 0; f < 3; f++) {
    const y = -fh * (f + 1) - 50;
    for (let x = x0 + 60; x < x1 - 120; x += 150) {
      const lit = r() < 0.58;
      const win = rectPath(x, y + 40, 96, 112);
      g.fillStyle = lit ? "#ffd48e" : "#6f6a8a";
      g.fill(win);
      if (lit) drawGlow(g, x + 48, y + 96, 110, 0.32);
      g.strokeStyle = INK;
      g.lineWidth = lw * 0.7;
      g.stroke(win);
      g.beginPath();
      g.moveTo(x + 48, y + 40);
      g.lineTo(x + 48, y + 152);
      g.stroke();
    }
    part(g, rectPath(x0, y + 166, x1 - x0, 24), "#b0645a", "#98544b", lw * 0.8, [5, 4]);
  }
  const cx = X + 200;
  part(g, rectPath(cx - 120, top - 90, 240, 100), "#d3c0bd", "#c2adab", lw);
  g.fillStyle = "#f3ece2";
  g.beginPath();
  g.arc(cx, top - 46, 38, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = lw;
  g.stroke();
  g.lineWidth = lw * 1.1;
  g.beginPath();
  g.moveTo(cx, top - 46);
  g.lineTo(cx + 22, top - 50);
  g.moveTo(cx, top - 46);
  g.lineTo(cx - 4, top - 74);
  g.stroke();
  // 操场上的旗杆和红旗（风吹着慢慢飘）
  const px = X + 560;
  part(g, rectPath(px - 7, -1180, 14, 1180), "#c9c6c2", "#b1aeaa", 2.6, [3, 2]);
  const flag = new Path2D();
  const n = 12;
  const L = 190;
  const Hh = 124;
  const wav = (u: number) => 10 * u * Math.sin(t * 3.1 - u * 5.5);
  flag.moveTo(px + 6, -1170);
  for (let i = 1; i <= n; i++) flag.lineTo(px + 6 + L * (i / n), -1170 + wav(i / n) + 6 * (i / n));
  for (let i = n; i >= 0; i--) flag.lineTo(px + 6 + L * (i / n), -1170 + Hh + wav(i / n) - 4 * (i / n));
  flag.closePath();
  part(g, flag, "#d8473c", "#bd3a30", 2.6, [5, 4]);
}

/** 伸缩门：一节节 X 形的银色格子，从右边门柱拉出来一半 */
function drawFoldingGate(g: CanvasRenderingContext2D, X: number) {
  const x1 = X + GATE.rp0;
  const x0 = X + GATE.folding;
  const top = -300;
  const lw = 2.6;
  g.strokeStyle = INK;
  g.lineWidth = lw * 2.2;
  const draw = (col: string, w: number) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    const step = 46;
    for (let x = x0; x < x1 - 1; x += step) {
      g.moveTo(x, top + 20);
      g.lineTo(x + step, -40);
      g.moveTo(x, -40);
      g.lineTo(x + step, top + 20);
      g.moveTo(x, top);
      g.lineTo(x, -24);
    }
    g.moveTo(x0, top);
    g.lineTo(x1, top);
    g.moveTo(x0, -30);
    g.lineTo(x1, -30);
    g.stroke();
  };
  draw(INK, 9);
  draw("#d9dde0", 5);
  // 车头一个小机箱，底下几只轮子
  part(g, rectPath(x0 - 40, top - 30, 56, 300), "#c7ccd0", "#b0b6bb", lw, [5, 4]);
  g.fillStyle = INK;
  for (let x = x0; x < x1; x += 92) {
    g.beginPath();
    g.arc(x, -10, 9, 0, Math.PI * 2);
    g.fill();
  }
}

/** 一段围墙：矮砖墙 + 铁栏杆（尖头） */
function drawFence(g: CanvasRenderingContext2D, x0: number, x1: number) {
  const lw = 3.2;
  part(g, rectPath(x0, -250, x1 - x0, 250), "#b98478", "#a47064", lw, [8, 6]);
  g.strokeStyle = "rgba(120,70,60,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  for (let y = -210; y < 0; y += 42) {
    g.moveTo(x0, y);
    g.lineTo(x1, y);
  }
  g.stroke();
  part(g, rectPath(x0 - 8, -270, x1 - x0 + 16, 24), "#e3d6c8", "#d2c4b4", lw, [4, 3]);
  // 栏杆
  const bars = new Path2D();
  for (let x = x0 + 24; x < x1 - 10; x += 52) {
    bars.moveTo(x, -270);
    bars.lineTo(x, -680);
    bars.moveTo(x - 9, -672);
    bars.lineTo(x, -700);
    bars.lineTo(x + 9, -672);
  }
  bars.moveTo(x0, -640);
  bars.lineTo(x1, -640);
  bars.moveTo(x0, -330);
  bars.lineTo(x1, -330);
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.lineJoin = "round";
  g.stroke(bars);
  g.strokeStyle = "#4d5560";
  g.lineWidth = 5;
  g.stroke(bars);
}

/** 门柱：砖柱子、上面一个帽；左边那根挂着白底黑字的校牌 */
function drawPillar(g: CanvasRenderingContext2D, x0: number, x1: number, plaque: boolean) {
  const lw = 3.2;
  part(g, rectPath(x0, GATE.top, x1 - x0, -GATE.top), "#bf8070", "#a96d5e", lw, [9, 7]);
  part(g, rectPath(x0 - 16, GATE.top - 40, x1 - x0 + 32, 44), "#e6d8c8", "#d4c4b2", lw, [6, 4]);
  if (!plaque) return;
  const w = x1 - x0 - 34;
  const px = x0 + 17;
  const top = GATE.top + 90;
  part(g, rectPath(px, top, w, 560), "#f7f4ee", "#e8e3d8", lw * 0.9, [5, 4]);
  g.save();
  g.fillStyle = "#2a2426";
  g.font = `${Math.round(w * 0.78)}px ${HAND_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  "第三中学".split("").forEach((ch, i) => g.fillText(ch, px + w / 2, top + 76 + i * 132));
  g.restore();
}

/** 路灯：墨绿的杆子、弯出去的灯头，灯下一团暖光 */
function drawLamp(g: CanvasRenderingContext2D, x: number, t: number) {
  const lw = 3.2;
  part(g, rectPath(x - 12, -1080, 24, 1080), "#4f5f5a", "#3f4d49", lw, [5, 4]);
  const arm = new Path2D();
  arm.moveTo(x, -1060);
  arm.quadraticCurveTo(x + 20, -1130, x + 110, -1120);
  g.strokeStyle = INK;
  g.lineWidth = 16;
  g.stroke(arm);
  g.strokeStyle = "#4f5f5a";
  g.lineWidth = 9;
  g.stroke(arm);
  const head = new Path2D();
  head.moveTo(x + 70, -1130);
  head.lineTo(x + 160, -1130);
  head.lineTo(x + 140, -1096);
  head.lineTo(x + 90, -1096);
  head.closePath();
  part(g, head, "#4f5f5a", null, lw);
  g.fillStyle = "#fff0c8";
  g.fillRect(x + 92, -1098, 46, 8);
  const flick = 1 + 0.02 * Math.sin(t * 17);
  drawGlow(g, x + 115, -1080, 300 * flick, 0.6);
  drawGlow(g, x + 115, -40, 380, 0.22);
}

/** 放学的学生（校服：浅蓝衬衫、藏蓝西装外套；不穿外套时是浅蓝的运动校服），低着头往外走 */
const UNI = (i: number, hair: CastSpec["hair"], hc: string, scale: number, coat: boolean): CastSpec => ({
  ...STUDENT,
  name: `学生${i}`,
  scale,
  hair,
  hairColor: hc,
  top: coat ? { kind: "shirt" } : STUDENT.top,
  coat: coat ? { kind: "suit", color: "#4c6596", shade: "#40578a", long: -10, button: "#2e3a56" } : undefined,
  brows: { kind: hair === "short" ? "thick" : "soft", color: hc },
});
const KIDS_OUT: Walker[] = [
  { spec: UNI(1, "short", "#2f2e33", 0.92, true), x0: -560, dir: -1, step: 0.56, t0: 0.2, seed: 1 },
  { spec: UNI(2, "bob", "#3a3036", 0.88, true), x0: 480, dir: 1, step: 0.6, t0: 0.5, seed: 2 },
  { spec: UNI(3, "ponytail", "#2c2a30", 0.86, true), x0: 1320, dir: -1, step: 0.58, t0: 0.1, seed: 3 },
];

export function drawSchool(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number, sh: [number, number], X: number, people: () => void) {
  const far: Cam = { ...cam, x: cam.x - 2300 };
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawSky(g, base, far);
  drawCity(g, base, far, t, undefined, sh, { light: 0.3, haze: 0.06, trees: "bare" });
  applyCam(g, base, cam, 1, sh);
  const v = viewOf(cam, 1);
  for (const b of blocksOfB(X)) {
    if (b.x > v.x1 + 50 || b.x + b.w < v.x0 - 50) continue;
    drawBlock(g, b, cam, 1, 2, 3.2, t);
    drawBlockGlow(g, b, cam, 1);
  }
  applyCam(g, base, cam, 1.5, sh);
  drawSchoolHouse(g, X, t);
  applyCam(g, base, cam, 1, sh);
  drawStreet(g, cam);
  // 门里的操场地面（门洞里露出来一截，颜色浅一点）
  g.fillStyle = "rgba(230,214,200,0.5)";
  g.fillRect(X + GATE.lp1, -12, GATE.rp0 - GATE.lp1, 12);
  for (const [dx, seed] of [
    [-1250, 61],
    [1950, 67],
  ] as const) {
    if (X + dx > v.x0 - 600 && X + dx < v.x1 + 600) planeTree(g, X + dx, t, 3.2, seed, cam.z, "bare");
  }
  drawFence(g, X - 1900, X + GATE.lp0);
  drawFence(g, X + GATE.rp1, X + 2400);
  drawPillar(g, X + GATE.lp0, X + GATE.lp1, true);
  drawFoldingGate(g, X);
  drawPillar(g, X + GATE.rp0, X + GATE.rp1, false);
  drawLamp(g, X - 900, t);
  drawLamp(g, X + 1700, t);
  for (const w of KIDS_OUT) {
    const k = walkerAt({ ...w, wind: 0.3 }, t);
    const x = X + k.x;
    if (x < v.x0 - 200 || x > v.x1 + 200) continue;
    drawPerson(g, w.spec, k.pose, x, 0, cam.z);
  }
  people();
}
