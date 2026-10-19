// 第二幕的场景和道具（地点见 地图.md）：
// - 哑铃店：最高那栋楼的一楼。楼是小比例的（一层 300，人 590 高），楼脚的铺面按人的比例画成一圈裙楼：门头红底白字的招牌「哑铃」，
//   卷帘门拉到顶，里面一排排铁架上摆着哑铃（好几格已经卖空了），门口一个展台摆着最大的那只。
// - 千斤家那栋楼：巷子对面（1410–2250 是巷子）的 24 层老楼，一楼是她家：门边一扇亮着灯的窗（妈妈在窗里），门口一根铁桩。
// - 道具：哑铃、铁链、挂锁、红线、铁桩、黄发卡、签字笔。
// 都按世界坐标画（街面 y = 0，往上是负），和人在同一层（D = 1）；画法和人物一样：深色描边、平涂、右下一道阴影。

import type { HoldFn } from "@materials/剪纸角色/code/chengtuo";
import { type Block, INK, addEllipse, drawGlow, part, rectPath } from "./world";
import { NOTE_FONT } from "./note";

type V2 = [number, number];

/** 千斤家那栋楼：最高那栋楼右边隔一条窄巷，24 层，楼顶约 −7341。x ≥ 2200 在第一幕的任何画面里都看不到 */
export const NEIGHBOR: Block = { x: 2250, w: 800, floors: 24, fh: 300, wall: "#e6bfa8", wallShade: "#d6ab92", seed: 91 };
export const NEIGHBOR_ROOF = (-NEIGHBOR.floors * 128 - 60) * (NEIGHBOR.fh / 128);

/** 哑铃店（最高那栋楼一楼的铺面）：裙楼 740–1400、高 860；门洞；门口展台（台面高 150） */
export const SHOP = { x0: 740, x1: 1400, top: -860, open: { x0: 800, x1: 1340, top: -690 }, stand: { x: 1180, w: 230, top: -150 } };

/** 千斤家（千斤家那栋楼的一楼）：楼角一根铁桩、窗（窗台 −300，妈妈在窗里）、门 */
export const HOME = {
  x0: NEIGHBOR.x,
  x1: NEIGHBOR.x + NEIGHBOR.w,
  top: -880,
  win: { x0: 2330, x1: 2620, sill: -300, top: -700 },
  door: { x0: 2672, x1: 2812, top: -690 },
  /** 铁桩在楼角（巷子口）：她被风吹着往左漂，飘在巷子口上面 */
  stake: 2282,
};

const IRON = "#3f3d46";
const IRON_SHADE = "#2e2c34";
const STEEL = "#8c8a94";
const STEEL_SHADE = "#6f6d78";

// ——— 哑铃 ———
/**
 * 哑铃（侧面：中间一根把手，两头各三片铁饼，里面的最大）。中心在把手中间，s = 1 是店里最大的那只（全长约 360）。
 * rot 弧度；sx < 1 是斜着看（抱在怀里时把手朝着镜头斜过去，变短）。
 */
export function drawDumbbell(g: CanvasRenderingContext2D, x: number, y: number, rot: number, s = 1, lw = 3, sx = 1) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s * sx, s);
  const L = lw / s;
  // 把手：钢的，上面一道道防滑纹
  const bar = new Path2D();
  bar.roundRect(-112, -12, 224, 24, 6);
  part(g, bar, STEEL, STEEL_SHADE, L, [3, 3]);
  g.strokeStyle = "rgba(40,36,44,0.35)";
  g.lineWidth = L * 0.6;
  g.beginPath();
  for (let k = -84; k <= 84; k += 12) {
    g.moveTo(k, -10);
    g.lineTo(k + 4, 10);
  }
  g.stroke();
  for (const side of [-1, 1]) {
    // 卡箍
    const collar = new Path2D();
    collar.roundRect(side > 0 ? 96 : -112, -24, 16, 48, 4);
    part(g, collar, STEEL, STEEL_SHADE, L, [2, 2]);
    // 三片铁饼：里面的最大
    const plates: [number, number, number][] = [
      [112, 26, 88],
      [140, 22, 76],
      [164, 16, 62],
    ];
    for (const [x0, w, h] of plates) {
      const p = new Path2D();
      p.roundRect(side > 0 ? x0 : -x0 - w, -h, w, h * 2, 7);
      part(g, p, IRON, IRON_SHADE, L, [5, 5]);
      // 顶上一道亮边（光从左上来）
      g.fillStyle = "rgba(220,214,230,0.28)";
      g.fillRect(side > 0 ? x0 + 4 : -x0 - w + 4, -h + 6, w - 10, 6);
    }
    // 外端一个小帽
    const cap = new Path2D();
    cap.roundRect(side > 0 ? 180 : -188, -14, 8, 28, 3);
    part(g, cap, STEEL, null, L);
  }
  g.restore();
}

// ——— 铁链 ———
/** 沿着一串点（折线）画一条铁链：一节平着（看得见圈）、一节侧着（一道粗线），交替 */
export function drawChain(g: CanvasRenderingContext2D, pts: V2[], link = 24, lw = 3) {
  if (pts.length < 2) return;
  // 按弧长每 link 放一节
  const seg: { p: V2; a: number }[] = [];
  let carry = link / 2;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const a = Math.atan2(by - ay, bx - ax);
    let d = carry;
    while (d <= len) {
      seg.push({ p: [ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len], a });
      d += link * 0.78;
    }
    carry = d - len;
  }
  g.save();
  g.lineCap = "round";
  seg.forEach(({ p, a }, i) => {
    g.save();
    g.translate(p[0], p[1]);
    g.rotate(a);
    if (i % 2 === 0) {
      g.beginPath();
      g.ellipse(0, 0, link * 0.55, link * 0.32, 0, 0, Math.PI * 2);
      g.strokeStyle = INK;
      g.lineWidth = lw * 2.4;
      g.stroke();
      g.strokeStyle = "#7d7b86";
      g.lineWidth = lw * 1.1;
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(-link * 0.55, 0);
      g.lineTo(link * 0.55, 0);
      g.strokeStyle = INK;
      g.lineWidth = lw * 2.6;
      g.stroke();
      g.strokeStyle = "#a3a1ac";
      g.lineWidth = lw * 1.1;
      g.stroke();
    }
    g.restore();
  });
  g.restore();
}

// ——— 挂锁 ———
/** 挂锁（黄铜锁身、钢锁梁）：(x, y) 是锁身中心；open 0..1 锁梁弹起来、转开 */
export function drawPadlock(g: CanvasRenderingContext2D, x: number, y: number, rot: number, open = 0, s = 1, lw = 3) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  const L = lw / s;
  // 锁梁：开的时候往上弹 12、绕左腿转开
  g.save();
  g.translate(-11, -16 - 12 * open);
  g.rotate(-0.9 * open);
  const sh = new Path2D();
  sh.moveTo(0, 6);
  sh.lineTo(0, -14);
  sh.arc(11, -14, 11, Math.PI, 0);
  sh.lineTo(22, open > 0.2 ? -6 : 6);
  g.lineCap = "round";
  g.strokeStyle = INK;
  g.lineWidth = L * 4.2;
  g.stroke(sh);
  g.strokeStyle = "#b9b7c0";
  g.lineWidth = L * 2.2;
  g.stroke(sh);
  g.restore();
  const body = new Path2D();
  body.roundRect(-19, -16, 38, 34, 7);
  part(g, body, "#d8ad4c", "#b98e33", L, [3, 3]);
  g.fillStyle = "rgba(255,240,200,0.5)";
  g.fillRect(-14, -12, 14, 4);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(0, 2, 4, 0, Math.PI * 2);
  g.fill();
  g.fillRect(-1.6, 2, 3.2, 8);
  g.restore();
}

// ——— 铁桩、红线 ———
/** 门口的铁桩（拴人的）：一根矮铁柱，顶上一个铁环，红线拴在环上 */
export function drawStake(g: CanvasRenderingContext2D, x: number, lw = 3) {
  part(g, rectPath(x - 15, -140, 30, 150), "#4c4650", "#3c3740", lw, [4, 3]);
  part(g, rectPath(x - 21, -150, 42, 16), "#5a5460", null, lw);
  g.beginPath();
  g.arc(x, -164, 11, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = lw * 2.4;
  g.stroke();
  g.strokeStyle = "#7a747f";
  g.lineWidth = lw;
  g.stroke();
}
/** 铁桩顶上的环（红线拴的那一点） */
export const stakeRing = (x: number): V2 => [x, -164];

/** 红线：从 a 到 b，sag 往下垂多少（绷直时 0） */
export function drawThread(g: CanvasRenderingContext2D, a: V2, b: V2, sag = 0, lw = 3) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 + sag;
  g.save();
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(a[0], a[1]);
  g.quadraticCurveTo(mx, my, b[0], b[1]);
  g.strokeStyle = "rgba(60,20,24,0.55)";
  g.lineWidth = lw * 1.9;
  g.stroke();
  g.strokeStyle = "#d9473a";
  g.lineWidth = lw * 1.05;
  g.stroke();
  g.restore();
}

// ——— 拿在手里的东西 ———
/** 千斤的黄发卡（拿在手指间） */
export const hairclipHold: HoldFn = (ctx, hand, _mir, info) => {
  if (info.layer !== "front") return;
  const a = hand.child(-4 * info.sx, 30, 0).p(0, 0);
  const b = hand.child(-4 * info.sx, 30, 0).p(0, 26);
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  ctx.strokeStyle = "#f2c94c";
  ctx.lineWidth = 4.6;
  ctx.stroke();
  ctx.restore();
};

/** 签字笔：透明的笔杆、蓝色的笔帽套在笔尾，笔尖朝下（拿在手里：笔杆沿着手指，笔尖从指尖下面伸出来） */
export const penHold: HoldFn = (ctx, hand, _mir, info) => {
  if (info.layer !== "front") return;
  const f = hand.child(-6 * info.sx, 22, 0.35 * info.sx);
  const tip = f.p(0, 70);
  const end = f.p(0, -52);
  const cap = f.p(0, -30);
  ctx.save();
  ctx.lineCap = "round";
  // 笔杆
  ctx.strokeStyle = INK;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(end[0], end[1]);
  ctx.lineTo(tip[0], tip[1]);
  ctx.stroke();
  ctx.strokeStyle = "#e9eef2";
  ctx.lineWidth = 7;
  ctx.stroke();
  // 里面的笔芯
  ctx.strokeStyle = "#5d7fc4";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cap[0], cap[1]);
  ctx.lineTo(tip[0], tip[1]);
  ctx.stroke();
  // 笔帽（套在笔尾）
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(end[0], end[1]);
  ctx.lineTo(cap[0], cap[1]);
  ctx.stroke();
  ctx.strokeStyle = "#3f6fc6";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();
};
/** 笔尖在哪（手的坐标系里，和 penHold 一样） */
export const penTip = (hand: Parameters<HoldFn>[1], sx: number): V2 => hand.child(-6 * sx, 22, 0.35 * sx).p(0, 70);

// ——— 哑铃店（最高那栋楼的一楼） ———
const r01 = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 店里面（门洞里看得见的）：昏黄的灯、后墙一排排铁架和哑铃（有几格已经空了）。柜台另外画（老板在柜台后面） */
export function drawShopBack(g: CanvasRenderingContext2D, t: number) {
  const { x0, x1, top } = SHOP.open;
  g.save();
  g.beginPath();
  g.rect(x0, top, x1 - x0, -top);
  g.clip();
  g.fillStyle = "#5b4a4c";
  g.fillRect(x0, top, x1 - x0, -top);
  // 顶上两盏灯，往下一团暖光
  const lg = g.createLinearGradient(0, top, 0, 0);
  lg.addColorStop(0, "rgba(255,206,140,0.55)");
  lg.addColorStop(0.6, "rgba(255,190,120,0.18)");
  lg.addColorStop(1, "rgba(80,50,60,0.25)");
  g.fillStyle = lg;
  g.fillRect(x0, top, x1 - x0, -top);
  // 铁架：三层
  const shelves = [-560, -400, -240];
  for (const [i, sy] of shelves.entries()) {
    part(g, rectPath(x0 + 20, sy, x1 - x0 - 210, 14), "#8a8290", null, 2.6);
    // 架子上的哑铃：大小不一，好几格已经卖空了
    for (let k = 0; k < 7; k++) {
      if (r01(i * 13 + k) < 0.32) continue;
      const s = 0.2 + 0.1 * r01(i * 7 + k * 3) + i * 0.03;
      drawDumbbell(g, x0 + 70 + k * 52, sy - 88 * s * 0.6 - 2, 0, s, 2.6);
    }
  }
  for (const px of [x0 + 20, x1 - 190]) part(g, rectPath(px - 6, -620, 12, 620), "#8a8290", null, 2.4);
  // 吊灯
  for (const lx of [x0 + 140, x0 + 380]) {
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(lx, top);
    g.lineTo(lx, top + 70);
    g.stroke();
    const shade = new Path2D();
    shade.moveTo(lx - 34, top + 98);
    shade.lineTo(lx + 34, top + 98);
    shade.lineTo(lx + 16, top + 70);
    shade.lineTo(lx - 16, top + 70);
    shade.closePath();
    part(g, shade, "#3f6b62", null, 2.4);
    g.fillStyle = "#fff1cf";
    g.beginPath();
    g.arc(lx, top + 104, 9, 0, Math.PI * 2);
    g.fill();
    drawGlow(g, lx, top + 110, 150, 0.55 + 0.05 * Math.sin(t * 9 + lx));
  }
  g.restore();
}
/** 柜台（右边；老板画在它后面，排队的人画在它前面） */
export function drawShopCounter(g: CanvasRenderingContext2D) {
  const { x1 } = SHOP.open;
  part(g, rectPath(x1 - 180, -250, 170, 250), "#8c6a52", "#77583f", 3, [5, 4]);
  part(g, rectPath(x1 - 190, -262, 190, 18), "#a07c60", null, 3);
}
/** 店里面整个（检查页用）：后墙 + 柜台 */
export function drawShopInterior(g: CanvasRenderingContext2D, t: number) {
  drawShopBack(g, t);
  drawShopCounter(g);
}

/** 哑铃店的门面：裙楼的墙、门头招牌「哑铃」、卷到顶的卷帘门、门洞的边框、门口的展台（最大的那只哑铃另外画，会被人拿走） */
export function drawShopFacade(g: CanvasRenderingContext2D, t: number) {
  const { x0, x1, top, open, stand } = SHOP;
  // 墙（门洞挖空：上面一截、左右两边）
  const wall = new Path2D();
  wall.rect(x0, top, x1 - x0, open.top - top);
  wall.rect(x0, open.top, open.x0 - x0, -open.top);
  wall.rect(open.x1, open.top, x1 - open.x1, -open.top);
  part(g, wall, "#e7d3b0", "#d8c19a", 3.2, [10, 8]);
  // 檐口
  part(g, rectPath(x0 - 16, top - 20, x1 - x0 + 32, 26), "#cdb38c", null, 3.2);
  // 卷帘门卷在门洞顶上
  part(g, rectPath(open.x0 - 6, open.top, open.x1 - open.x0 + 12, 34), "#b9b4ae", "#a6a19b", 3, [3, 3]);
  g.strokeStyle = "rgba(60,50,56,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  for (let yy = open.top + 8; yy < open.top + 34; yy += 8) {
    g.moveTo(open.x0, yy);
    g.lineTo(open.x1, yy);
  }
  g.stroke();
  // 门头招牌：暗红底、白字「哑铃」，两边各一个小哑铃
  const sx0 = x0 + 50;
  const sx1 = x1 - 50;
  const sy0 = top + 22;
  const sy1 = open.top - 22;
  const board = new Path2D();
  board.roundRect(sx0, sy0, sx1 - sx0, sy1 - sy0, 6);
  part(g, board, "#b24a3d", "#983b30", 3.2, [6, 5]);
  g.strokeStyle = "rgba(255,236,214,0.55)";
  g.lineWidth = 2.4;
  g.strokeRect(sx0 + 10, sy0 + 10, sx1 - sx0 - 20, sy1 - sy0 - 20);
  const cy = (sy0 + sy1) / 2;
  g.save();
  g.font = `700 ${(sy1 - sy0) * 0.66}px ${NOTE_FONT}, "Noto Serif SC", serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fff6ea";
  g.fillText("哑  铃", (sx0 + sx1) / 2, cy + 4);
  g.restore();
  drawDumbbell(g, sx0 + 64, cy, 0, 0.24, 2.4);
  drawDumbbell(g, sx1 - 64, cy, 0, 0.24, 2.4);
  // 招牌底下一排小灯泡（傍晚刚亮）
  for (let lx = sx0 + 30; lx < sx1 - 20; lx += 60) {
    g.fillStyle = "#fff0c8";
    g.beginPath();
    g.arc(lx, sy1 + 8, 5, 0, Math.PI * 2);
    g.fill();
    drawGlow(g, lx, sy1 + 8, 40, 0.35);
  }
  // 门洞两边的柱子、门槛
  part(g, rectPath(open.x0 - 14, open.top, 14, -open.top), "#cdb38c", null, 3);
  part(g, rectPath(open.x1, open.top, 14, -open.top), "#cdb38c", null, 3);
  part(g, rectPath(open.x0 - 14, -18, open.x1 - open.x0 + 28, 20), "#b8a084", null, 3);
  // 门边墙上贴的旧告示（不写字，一块块褪色的纸）
  for (const [px, py, w, h] of [
    [x0 + 14, -520, 34, 46],
    [x0 + 12, -440, 30, 40],
    [x1 - 50, -560, 36, 48],
  ] as const) {
    part(g, rectPath(px, py, w, h), "#efe6d6", "#e0d5c2", 2, [2, 2]);
  }
  // 展台：一个包了铁皮边的木台子
  const st = new Path2D();
  st.rect(stand.x - stand.w / 2, stand.top, stand.w, -stand.top);
  part(g, st, "#9a6f52", "#82593f", 3, [5, 4]);
  part(g, rectPath(stand.x - stand.w / 2 - 10, stand.top - 14, stand.w + 20, 16), "#6f6b74", null, 3);
}

/** 展台上那只哑铃放着时的位置（中心） */
export const STAND_DUMBBELL: V2 = [SHOP.stand.x, SHOP.stand.top - 14 - 88];

// ——— 千斤家（千斤家那栋楼的一楼） ———
/** 窗里面：妈妈的屋子（一盏吊灯、桌子、墙上的挂历），亮着暖灯。人（窗里的妈妈）画在它和窗框之间 */
export function drawHomeInterior(g: CanvasRenderingContext2D, t: number, lamp = 1) {
  const { x0, x1, sill, top } = HOME.win;
  g.save();
  g.beginPath();
  g.rect(x0, top, x1 - x0, sill - top);
  g.clip();
  g.fillStyle = "#cfa98e";
  g.fillRect(x0, top, x1 - x0, sill - top);
  const lg = g.createRadialGradient(x0 + 150, top + 60, 10, x0 + 150, top + 60, 420);
  lg.addColorStop(0, `rgba(255,214,150,${0.85 * lamp})`);
  lg.addColorStop(1, "rgba(120,80,80,0.35)");
  g.fillStyle = lg;
  g.fillRect(x0, top, x1 - x0, sill - top);
  // 挂历、一张旧照片
  part(g, rectPath(x0 + 210, top + 60, 56, 70), "#f4efe6", "#e4dccd", 2.2, [2, 2]);
  part(g, rectPath(x0 + 210, top + 60, 56, 16), "#c9574a", null, 2.2);
  part(g, rectPath(x0 + 34, top + 74, 48, 40), "#8d6f5b", null, 2.2);
  // 吊灯
  g.strokeStyle = INK;
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(x0 + 150, top);
  g.lineTo(x0 + 150, top + 40);
  g.stroke();
  const shade = new Path2D();
  shade.moveTo(x0 + 120, top + 66);
  shade.lineTo(x0 + 180, top + 66);
  shade.lineTo(x0 + 164, top + 40);
  shade.lineTo(x0 + 136, top + 40);
  shade.closePath();
  part(g, shade, "#e0c27a", null, 2.2);
  g.restore();
}
/** 窗里的桌子（画在窗里的妈妈前面：她坐在桌前，桌面挡住她的腰以下） */
export function drawHomeTable(g: CanvasRenderingContext2D) {
  const { x0, x1, sill, top } = HOME.win;
  g.save();
  g.beginPath();
  g.rect(x0, top, x1 - x0, sill - top);
  g.clip();
  part(g, rectPath(x0 + 40, sill - 96, 250, 20), "#8a6248", null, 2.4);
  part(g, rectPath(x0 + 60, sill - 76, 210, 80), "#7a553e", "#694833", 2.4, [3, 3]);
  // 桌上一只碗
  const bowl = new Path2D();
  bowl.moveTo(x0 + 220, sill - 96);
  bowl.quadraticCurveTo(x0 + 240, sill - 118, x0 + 260, sill - 96);
  bowl.closePath();
  part(g, bowl, "#eef0f2", null, 2);
  g.restore();
}

/** 千斤家的门面：一楼的墙（窗和门挖空）、窗框和窗台、门（door 0 关上 … 1 开着，门缝里漏出屋里的暖光）、门口一级台阶、
 *  门边的壁灯、信箱、一盆花。inDoorway 画走进门洞的人（门板关上时挡住她）。铁桩另外画（在人前面） */
export function drawHomeFacade(g: CanvasRenderingContext2D, t: number, door: number, inDoorway?: () => void) {
  const { x0, x1, top, win, door: d } = HOME;
  const wall = new Path2D();
  wall.rect(x0, top, x1 - x0, -top);
  // 挖掉窗和门
  wall.rect(win.x1, win.top, win.x0 - win.x1, win.sill - win.top);
  wall.rect(d.x1, d.top, d.x0 - d.x1, -d.top);
  part(g, wall, "#e2c4ad", "#d2ae95", 3.2, [10, 8]);
  // 墙裙、檐口
  part(g, rectPath(x0, -110, win.x0 - x0, 110), "#c7a48a", null, 2.6);
  part(g, rectPath(win.x1, -110, d.x0 - win.x1, 110), "#c7a48a", null, 2.6);
  part(g, rectPath(d.x1, -110, x1 - d.x1, 110), "#c7a48a", null, 2.6);
  part(g, rectPath(x0 - 14, top - 18, x1 - x0 + 28, 24), "#c79c80", null, 3.2);
  // 窗框、十字窗棂、窗台
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.strokeRect(win.x0, win.top, win.x1 - win.x0, win.sill - win.top);
  part(g, rectPath(win.x0 - 8, win.top - 10, win.x1 - win.x0 + 16, 14), "#8a6a56", null, 2.6);
  g.strokeStyle = "#8a6a56";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo((win.x0 + win.x1) / 2, win.top);
  g.lineTo((win.x0 + win.x1) / 2, win.sill);
  g.moveTo(win.x0, win.top + 130);
  g.lineTo(win.x1, win.top + 130);
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 2.2;
  g.strokeRect((win.x0 + win.x1) / 2 - 5, win.top, 10, win.sill - win.top);
  part(g, rectPath(win.x0 - 18, win.sill, win.x1 - win.x0 + 36, 18), "#b9a493", null, 2.6);
  // 门：开着时是一道暖光的门洞，门板往里转（看得见的门板变窄）；关上时整块门板
  const dw = d.x1 - d.x0;
  const lit = new Path2D();
  lit.rect(d.x0, d.top, dw, -d.top);
  g.fillStyle = "#ffd59a";
  g.fill(lit);
  if (door > 0.01) drawGlow(g, (d.x0 + d.x1) / 2, -300, 260 * door, 0.6 * door);
  // 走进门洞的人：画在门洞的暖光前面、门板后面（只露出门洞里那一截）
  if (inDoorway) {
    g.save();
    g.beginPath();
    g.rect(d.x0, d.top, dw, -d.top);
    g.clip();
    inDoorway();
    g.restore();
  }
  const leaf = new Path2D();
  const open = dw * door * 0.86;
  leaf.rect(d.x0 + open, d.top, dw - open, -d.top);
  part(g, leaf, "#8a5a3e", "#744830", 3, [4, 4]);
  if (door < 0.5) {
    // 门上的小窗、门把手
    part(g, rectPath(d.x0 + open + 30, d.top + 70, Math.max(0, dw - open - 60), 120), "#6a5560", null, 2.4);
    g.fillStyle = "#e0c070";
    g.beginPath();
    g.arc(d.x0 + open + 22, -330, 6, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.strokeRect(d.x0, d.top, dw, -d.top);
  // 台阶
  part(g, rectPath(d.x0 - 26, -34, dw + 52, 36), "#bcae9f", "#a99a8b", 3, [3, 3]);
  // 门边的壁灯
  part(g, rectPath(d.x1 + 22, -560, 30, 46), "#f6e2b4", null, 2.4);
  drawGlow(g, d.x1 + 37, -540, 120, 0.5);
  // 信箱（门右边，花盆上面）
  part(g, rectPath(d.x1 + 30, -470, 70, 90), "#5f8a6e", "#4f765c", 2.6, [3, 3]);
  // 门边一盆花
  const pot = new Path2D();
  pot.moveTo(d.x1 + 20, 0);
  pot.lineTo(d.x1 + 104, 0);
  pot.lineTo(d.x1 + 96, -70);
  pot.lineTo(d.x1 + 28, -70);
  pot.closePath();
  const leaves = new Path2D();
  addEllipse(leaves, d.x1 + 40, -96, 34, 24, -0.5);
  addEllipse(leaves, d.x1 + 88, -100, 32, 24, 0.5);
  addEllipse(leaves, d.x1 + 64, -128, 30, 28, 0);
  part(g, leaves, "#86a35f", "#70894e", 3, [5, 4]);
  part(g, pot, "#c4775a", "#ad6448", 3, [4, 3]);
}
