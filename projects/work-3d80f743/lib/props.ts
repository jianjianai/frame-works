// 第一幕的道具和近处的场景：公文包、文件、写着「活下去」的砖、老钟的茶杯、近景（路灯、花箱、自行车）、
// 老钟家（两层老房子，一楼的窗里亮着暖灯）、最高那栋楼的楼顶、地上的软影子。都按世界坐标画（街面 y = 0，往上是负）。

import { type HoldFn, type Look, type PoseIn, drawBrickShape, figureRig } from "@materials/剪纸角色/code/chengtuo";
import type { Ink } from "@materials/剪纸角色/code/rig";
import { INK, TOWER, addEllipse, drawGlow, part, rectPath } from "./world";
import { HAND_FONT } from "./note";

type V2 = [number, number];

// ——— 公文包 ———
/** 公文包：宽、高、盖子那一截多高 */
export const CASE = { w: 150, h: 104, lid: 26 };

/** 公文包：棕色皮面、上面一个提手、两个铜锁扣；open（弧度）> 0 时盖子从后面那条边掀开，露出里面的文件 */
export function drawBriefcase(g: CanvasRenderingContext2D, x: number, y: number, rot: number, open = 0) {
  const { w, h, lid } = CASE;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const top = -h / 2;
  const seam = top + lid;
  const body = new Path2D();
  body.roundRect(-w / 2, seam - 4, w, h / 2 - seam + 4, [4, 4, 12, 12]);
  part(g, body, "#7a4b2e", "#633a22", 3, [5, 5]);
  // 皮面上一道缝线
  g.strokeStyle = "rgba(240,210,170,0.35)";
  g.lineWidth = 2;
  g.setLineDash([6, 6]);
  g.beginPath();
  g.roundRect(-w / 2 + 8, seam + 4, w - 16, h / 2 - seam - 12, 8);
  g.stroke();
  g.setLineDash([]);
  if (open > 0.01) {
    g.fillStyle = "#3b261a";
    g.fillRect(-w / 2 + 6, seam - 6, w - 12, 8);
    g.fillStyle = "#f3efe6";
    g.fillRect(-w / 2 + 14, seam - 12 - 8 * open, w - 40, 10);
  }
  g.save();
  g.translate(w / 2, seam);
  g.rotate(-open);
  g.translate(-w / 2, -seam);
  const handle = new Path2D();
  handle.moveTo(-26, top + 2);
  handle.lineTo(-24, top - 16);
  handle.quadraticCurveTo(0, top - 30, 24, top - 16);
  handle.lineTo(26, top + 2);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.stroke(handle);
  g.strokeStyle = "#5b3a26";
  g.lineWidth = 6;
  g.stroke(handle);
  const lidP = new Path2D();
  lidP.roundRect(-w / 2, top, w, lid, [12, 12, 4, 4]);
  part(g, lidP, "#875636", "#6f4328", 3, [4, 4]);
  // 皮面上的高光
  g.fillStyle = "rgba(255,230,200,0.18)";
  g.fillRect(-w / 2 + 10, top + 5, w * 0.5, 5);
  for (const cx of [-w * 0.3, w * 0.3]) part(g, rectPath(cx - 9, seam - 8, 18, 14), "#dcb560", "#c49c4a", 2.4, [2, 2]);
  g.restore();
  g.restore();
}

/** 从掀开的盖子里飞出来的几张文件：先蹦起来，再一左一右飘着落下，落地后平躺在地上。a 是砸地以后过了多久 */
export function makePapers(seed: () => number, n = 6) {
  return Array.from({ length: n }, () => ({
    vx: -260 + seed() * 440,
    vy: -560 + seed() * 240,
    ph: seed() * 6,
    sw: 40 + seed() * 50,
    spin: (seed() - 0.5) * 7,
    d: seed() * 0.08,
  }));
}
export function drawPapers(g: CanvasRenderingContext2D, papers: ReturnType<typeof makePapers>, x0: number, a0: number) {
  if (a0 <= 0) return;
  for (const p of papers) {
    const a = a0 - p.d;
    if (a <= 0) continue;
    const tau = 0.22;
    const y0 = -CASE.h;
    let y = y0 + p.vy * tau * (1 - Math.exp(-a / tau)) + 150 * a;
    const x = x0 + p.vx * 0.3 * (1 - Math.exp(-a / 0.3)) + p.sw * Math.sin(a * 3 + p.ph) * Math.min(1, a * 2);
    const landed = y >= -2;
    if (landed) y = -2;
    const flat = landed ? 0.14 : 1;
    g.save();
    g.translate(x, y);
    g.rotate(landed ? 0 : 0.6 * Math.sin(a * p.spin + p.ph));
    g.scale(1, flat);
    part(g, rectPath(-22, -29, 44, 58), "#f7f3eb", "#e4ddd0", 2.4, [3, 3]);
    if (!landed) {
      g.strokeStyle = "rgba(43,38,48,0.35)";
      g.lineWidth = 2;
      g.beginPath();
      for (let k = 0; k < 4; k++) {
        g.moveTo(-14, -16 + k * 10);
        g.lineTo(14 - (k === 3 ? 10 : 0), -16 + k * 10);
      }
      g.stroke();
    }
    g.restore();
  }
}

// ——— 砖 ———
/**
 * 一块写着「活下去」的砖（拿在手里画；托着 / 提着两种拿法和素材库的 holdBrick 一样），warm 0..1 暖起来。
 * 托着（掌心朝上）时放进 late，等两个人都画完再画：递砖时两只手叠在一起，砖不能被另一个人的手挡住。at.p 记下砖在画面上的中心（像素）。
 */
/** 掌心朝上托在近处那只手（L）里的砖，中心在人身上的位置（人的坐标，k、w 是身高和胖瘦；和 brickHold 画的位置一样）：交接时让两个人手里的砖叠在一起 */
export function brickCenter(look: Look, pose: PoseIn, k = 1, w = 1): V2 {
  const rig = figureRig(pose, look);
  const c = rig.arms.L.tip.child(-9.5, 30, -Math.PI / 2).p(0, -13.5);
  return [(rig.mir ? -c[0] : c[0]) * k * w, c[1] * k];
}

export function brickHold(warm: () => number, at: { p: V2 | null }, late: (() => void)[]): HoldFn {
  return (ctx, hand, _mir, info) => {
    const present = info.shape === "flat";
    if (present !== (info.layer === "front")) return;
    if (present) {
      const m = ctx.getTransform();
      late.push(() => {
        ctx.save();
        ctx.setTransform(m);
        drawBrick(ctx, hand, info.sx, true, warm, at);
        ctx.restore();
      });
    } else drawBrick(ctx, hand, info.sx, false, warm, at);
  };
}

function drawBrick(ctx: CanvasRenderingContext2D, hand: Parameters<HoldFn>[1], sx: number, present: boolean, warm: () => number, at: { p: V2 | null }) {
  const f = present ? hand.child(-9.5 * sx, 30, (-Math.PI / 2) * sx) : hand.child(2.5 * sx, 56, 0);
  const w = warm();
  const mixc = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * w)).join(",")})`;
  const ink: Ink = { line: INK, lw: 3, shade: [3, 3] };
  drawBrickShape(ctx, f, 36, 27, ink, mixc([206, 200, 190], [255, 214, 150]), mixc([180, 174, 165], [236, 176, 108]));
  // 字：按画面方向写正（人朝右时整个人是镜像画的）
  const m = ctx.getTransform();
  const P = (p: V2): V2 => {
    const q = m.transformPoint(new DOMPoint(p[0], p[1]));
    return [q.x, q.y];
  };
  const a = P(f.p(-18, -13.5));
  const b = P(f.p(18, -13.5));
  const c = P(f.p(0, -13.5));
  const top = P(f.p(0, -27));
  let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (ang > Math.PI / 2) ang -= Math.PI;
  if (ang < -Math.PI / 2) ang += Math.PI;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const hgt = Math.hypot(top[0] - c[0], top[1] - c[1]) * 2;
  at.p = c;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(c[0], c[1]);
  ctx.rotate(ang);
  ctx.font = `${Math.max(4, hgt * 0.62)}px ${HAND_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = w > 0.5 ? "#6a3a20" : INK;
  ctx.fillText("活下去", 0, hgt * 0.04, len * 0.86);
  ctx.restore();
}

/** 老钟手里的茶杯（攥着：杯子在手掌里，杯口朝上），冒一缕热气 */
export const cupHold: HoldFn = (ctx, hand, _mir, info) => {
  if (info.layer !== "front") return;
  const f = hand.child(-6 * info.sx, 24, 0);
  ctx.save();
  const m = ctx.getTransform();
  const o = m.transformPoint(new DOMPoint(f.p(0, 0)[0], f.p(0, 0)[1]));
  const k = Math.hypot(m.a, m.b);
  ctx.setTransform(k, 0, 0, k, o.x, o.y);
  const cup = new Path2D();
  cup.moveTo(-17, -24);
  cup.lineTo(17, -24);
  cup.lineTo(13, 14);
  cup.quadraticCurveTo(0, 20, -13, 14);
  cup.closePath();
  part(ctx, cup, "#f4f0e8", "#ddd6ca", 3, [3, 3]);
  part(ctx, rectPath(-16, -10, 32, 7), "#7aa0b8", null, 0);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -32);
  ctx.bezierCurveTo(-12, -46, 6, -54, -2, -70);
  ctx.stroke();
  ctx.restore();
};

/** 地上一块软软的影子（太阳在左上，影子往右偏一点）：x 是中心，w 是半宽 */
export function groundShadow(g: CanvasRenderingContext2D, x: number, w: number, a: number, y = 6) {
  if (a < 0.01 || w < 2) return;
  g.save();
  g.translate(x, y);
  g.scale(1, 0.16);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w);
  gr.addColorStop(0, `rgba(84,50,62,${a})`);
  gr.addColorStop(0.6, `rgba(84,50,62,${a * 0.55})`);
  gr.addColorStop(1, "rgba(84,50,62,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, w, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// ——— 近景（离镜头比人更近的一层）：镜头一动它们划得比人快，画面就有了纵深 ———
export type FgKind = "lamp" | "planter" | "bike" | "bollard";
export function drawForegroundItem(g: CanvasRenderingContext2D, kind: FgKind, x: number, t: number) {
  if (kind === "lamp") {
    // 老式路灯：细杆、顶上一个弯脖子灯罩
    part(g, rectPath(x - 11, -1500, 22, 1520), "#554b48", "#463d3b", 3.2, [5, 4]);
    part(g, rectPath(x - 28, -40, 56, 60), "#554b48", null, 3.2);
    const neck = new Path2D();
    neck.moveTo(x, -1490);
    neck.quadraticCurveTo(x - 10, -1600, x - 120, -1580);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke(neck);
    g.strokeStyle = "#554b48";
    g.lineWidth = 9;
    g.stroke(neck);
    const shade = new Path2D();
    shade.moveTo(x - 170, -1560);
    shade.lineTo(x - 70, -1560);
    shade.lineTo(x - 90, -1600);
    shade.lineTo(x - 150, -1600);
    shade.closePath();
    part(g, shade, "#463d3b", null, 3.2);
    // 杆子朝光的一侧一道暖边
    g.fillStyle = "rgba(255,214,160,0.55)";
    g.fillRect(x - 11, -1500, 5, 1500);
  } else if (kind === "bollard") {
    part(g, rectPath(x - 18, -84, 36, 104), "#8d8580", "#77706b", 3.2, [4, 3]);
    part(g, rectPath(x - 23, -92, 46, 14), "#6f6862", null, 3.2);
  } else if (kind === "planter") {
    part(g, rectPath(x - 90, -46, 180, 66), "#9c7558", "#86634a", 3.2, [5, 4]);
    const sway = 4 * Math.sin(t * 1.1 + x);
    for (let i = 0; i < 6; i++) {
      const bx = x - 72 + i * 29;
      const leaf = new Path2D();
      leaf.ellipse(bx + sway * 0.6, -66 - (i % 3) * 9, 22, 26, 0.2 * Math.sin(i * 1.7), 0, Math.PI * 2);
      part(g, leaf, i % 2 ? "#6f8c55" : "#7f9d5f", "#5f7a48", 2.4, [3, 3]);
    }
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i % 2 ? "#e39a90" : "#f0c86e";
      g.beginPath();
      g.arc(x - 50 + i * 50 + sway, -88 - (i % 2) * 8, 9, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // 靠在路边的旧自行车（只露出车轮和车架下半截）
    g.save();
    g.translate(x, 0);
    g.scale(0.55, 0.55);
    g.translate(-x, 0);
    g.strokeStyle = INK;
    g.lineWidth = 7;
    for (const wx of [x - 110, x + 110]) {
      g.beginPath();
      g.arc(wx, -70, 70, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeStyle = "#4f7383";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(x - 110, -70);
    g.lineTo(x - 20, -170);
    g.lineTo(x + 70, -170);
    g.lineTo(x + 110, -70);
    g.moveTo(x - 20, -170);
    g.lineTo(x + 10, -70);
    g.lineTo(x + 70, -170);
    g.moveTo(x - 30, -190);
    g.lineTo(x - 10, -190);
    g.moveTo(x + 70, -170);
    g.lineTo(x + 60, -210);
    g.lineTo(x + 100, -215);
    g.stroke();
    g.restore();
  }
}

// ——— 最高那栋楼的楼顶（开场天上的镜头里露出一角）：栏杆、电视天线、晾着的白床单、一盆花——有人在这里过日子 ———
export const TOWER_ROOF = (-TOWER.floors * 128 - 60) * (TOWER.fh / 128);
export function drawRoof(g: CanvasRenderingContext2D, t: number, sheetOn = true) {
  const y = TOWER_ROOF;
  const x0 = TOWER.x;
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x0 + 10, y - 96);
  g.lineTo(x0 + 700, y - 96);
  for (let x = x0 + 14; x < x0 + 700; x += 46) {
    g.moveTo(x, y);
    g.lineTo(x, y - 96);
  }
  g.stroke();
  g.strokeStyle = "#a39a96";
  g.lineWidth = 2;
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x0 + 70, y);
  g.lineTo(x0 + 70, y - 420);
  for (const [dy, half] of [
    [-400, 56],
    [-350, 44],
    [-300, 32],
  ]) {
    g.moveTo(x0 + 70 - half, y + dy);
    g.lineTo(x0 + 70 + half, y + dy + 6);
  }
  g.stroke();
  g.strokeStyle = "#8d8580";
  g.lineWidth = 3;
  g.stroke();
  const ax = x0 + 190;
  const bx = x0 + 560;
  g.strokeStyle = INK;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(ax, y);
  g.lineTo(ax, y - 300);
  g.moveTo(bx, y);
  g.lineTo(bx, y - 300);
  g.stroke();
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(ax, y - 290);
  g.quadraticCurveTo((ax + bx) / 2, y - 262, bx, y - 290);
  g.stroke();
  const flap = 18 * Math.sin(t * 2.2) + 10 * Math.sin(t * 3.7 + 1);
  const sheet = new Path2D();
  if (!sheetOn) {
    potAndBush(g, x0, y);
    return;
  }
  sheet.moveTo(ax + 30, y - 284);
  sheet.quadraticCurveTo((ax + bx) / 2, y - 258, bx - 30, y - 284);
  sheet.quadraticCurveTo(bx - 10 + flap, y - 190, bx - 20 + flap * 1.6, y - 110);
  sheet.quadraticCurveTo((ax + bx) / 2 + flap, y - 140 + flap * 0.4, ax + 40 + flap * 0.8, y - 120);
  sheet.quadraticCurveTo(ax + 20 + flap * 0.3, y - 200, ax + 30, y - 284);
  sheet.closePath();
  part(g, sheet, "#f8f5ef", "#e6e0d6", 3, [6, 5]);
  potAndBush(g, x0, y);
}
function potAndBush(g: CanvasRenderingContext2D, x0: number, y: number) {
  const pot = new Path2D();
  pot.moveTo(x0 + 16, y);
  pot.lineTo(x0 + 86, y);
  pot.lineTo(x0 + 78, y - 60);
  pot.lineTo(x0 + 24, y - 60);
  pot.closePath();
  // 一丛灌木（几团叶子挤在一起，不是一个圆）
  const leaves = new Path2D();
  addEllipse(leaves, x0 + 28, y - 78, 30, 22, -0.5);
  addEllipse(leaves, x0 + 74, y - 80, 30, 22, 0.5);
  addEllipse(leaves, x0 + 50, y - 108, 28, 26, 0);
  addEllipse(leaves, x0 + 90, y - 112, 18, 15, 0.8);
  part(g, leaves, "#86a35f", "#70894e", 3, [5, 4]);
  part(g, pot, "#c4775a", "#ad6448", 3, [4, 3]);
}

// ——— 老钟家：两层的老房子（和人在同一层），一楼的窗里亮着暖灯，老钟站在窗后 ———
export interface House {
  x0: number;
  x1: number;
  top: number;
  win: { x: number; w: number; sill: number; top: number };
}

/** 墙、二楼的窗、门、壁灯、信箱、空调外机、晾衣杆、爬藤、门口一盆花；一楼那扇窗只挖出亮着灯的屋子（窗框在 drawHouseWindowFront 里画） */
export function drawHouse(g: CanvasRenderingContext2D, h: House, t: number) {
  const { x0, x1, top } = h;
  const wall = new Path2D();
  wall.rect(x0, top, x1 - x0, -top + 40);
  part(g, wall, "#eed9b7", "#dfc6a0", 3.2, [14, 10]);
  // 墙上的光：左上亮一点
  const lg = g.createLinearGradient(x0, top, x1, 0);
  lg.addColorStop(0, "rgba(255,244,222,0.35)");
  lg.addColorStop(0.5, "rgba(255,244,222,0)");
  lg.addColorStop(1, "rgba(130,80,100,0.12)");
  g.fillStyle = lg;
  g.fill(wall);
  part(g, rectPath(x0, -90, x1 - x0, 92), "#d8c09f", null, 2.6);
  // 墙角往上爬的藤
  g.strokeStyle = "#5f7c48";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x0 + 26, 0);
  for (let y = 0; y > -1040; y -= 40) g.lineTo(x0 + 26 + 14 * Math.sin(y / 70), y);
  g.stroke();
  for (let y = -30; y > -1020; y -= 56) {
    const lx = x0 + 26 + 14 * Math.sin(y / 70);
    const leaf = new Path2D();
    leaf.ellipse(lx + (y % 112 === 0 ? 20 : -16), y, 20, 13, y % 112 === 0 ? 0.5 : -0.5, 0, Math.PI * 2);
    part(g, leaf, "#86a35f", "#70894e", 2.2, [3, 2]);
  }
  // 屋檐（瓦）
  const eave = new Path2D();
  eave.moveTo(x0 - 40, top + 4);
  eave.lineTo(x1 + 40, top + 4);
  eave.lineTo(x1 + 10, top - 46);
  eave.lineTo(x0 - 10, top - 46);
  eave.closePath();
  part(g, eave, "#a86f58", "#93604b", 3.2, [6, 5]);
  g.strokeStyle = "rgba(60,30,30,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  for (let x = x0; x < x1 + 30; x += 34) {
    g.moveTo(x, top + 4);
    g.lineTo(x + 10, top - 46);
  }
  g.stroke();
  // 二楼的窗（防飘栏）
  for (const wx of [x0 + 110, x0 + 470]) {
    part(g, rectPath(wx, -1180, 220, 260), "#626d82", "#556074", 3, [6, 6]);
    g.fillStyle = "rgba(196,206,222,0.28)";
    g.beginPath();
    g.moveTo(wx + 30, -920);
    g.lineTo(wx + 110, -1180);
    g.lineTo(wx + 150, -1180);
    g.lineTo(wx + 70, -920);
    g.closePath();
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.strokeRect(wx - 12, -1192, 244, 290);
    g.lineWidth = 2;
    g.beginPath();
    for (let k = 1; k < 6; k++) {
      g.moveTo(wx - 12 + (244 * k) / 6, -1192);
      g.lineTo(wx - 12 + (244 * k) / 6, -902);
    }
    g.stroke();
    part(g, rectPath(wx - 20, -905, 260, 16), "#a39a96", null, 2.6);
  }
  // 窗台上两盆花
  for (const px of [x0 + 130, x0 + 520]) {
    const pot = new Path2D();
    pot.moveTo(px, -905);
    pot.lineTo(px + 34, -905);
    pot.lineTo(px + 30, -940);
    pot.lineTo(px + 4, -940);
    pot.closePath();
    part(g, pot, "#c4775a", null, 2.4);
    const leaf = new Path2D();
    addEllipse(leaf, px + 4, -950, 16, 11, -0.6);
    addEllipse(leaf, px + 30, -950, 16, 11, 0.6);
    addEllipse(leaf, px + 17, -965, 15, 14, 0);
    part(g, leaf, "#7f9b5c", "#69844b", 2.4, [3, 3]);
    g.fillStyle = "#e9877a";
    g.beginPath();
    addEllipse(g, px + 10, -968, 6, 6);
    addEllipse(g, px + 26, -962, 5, 5);
    g.fill();
  }
  // 左边窗下的空调外机、一根冷凝水管、一道锈水印
  {
    const ax = x0 + 150;
    part(g, rectPath(ax, -870, 160, 96), "#f2efe8", "#e1ddd3", 3, [5, 5]);
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(ax + 108, -822, 32, 0, Math.PI * 2);
    for (let k = -2; k <= 2; k++) {
      g.moveTo(ax + 108 + k * 12, -850);
      g.lineTo(ax + 108 + k * 12, -794);
    }
    g.stroke();
    g.strokeStyle = "#9c968f";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(ax + 20, -774);
    g.lineTo(ax + 20, -620);
    g.stroke();
    g.fillStyle = "rgba(140,92,70,0.15)";
    g.fillRect(ax + 60, -774, 7, 120);
  }
  // 右边窗台伸出一根竹竿，晾着衬衫、裤子、毛巾（被风往右吹）
  {
    const py = -930;
    const pxA = x0 + 640;
    const pxB = x1 + 170;
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(pxA, py);
    g.lineTo(pxB, py - 14);
    g.stroke();
    g.strokeStyle = "#c9b98f";
    g.lineWidth = 5;
    g.stroke();
    const clothes: [number, number, string, string][] = [
      [0.2, 0, "#f3efe6", "#ddd7cb"],
      [0.46, 1, "#7f93a8", "#6d8196"],
      [0.7, 2, "#e8c76a", "#d4b258"],
      [0.88, 0, "#c9705c", "#b35f4c"],
    ];
    for (const [u, kind, fill, shade] of clothes) {
      const cx = pxA + (pxB - pxA) * u;
      const cy = py - 14 * u;
      const sw = 0.1 + 0.07 * Math.sin(t * 1.8 + u * 9);
      g.save();
      g.translate(cx, cy);
      g.scale(1.6, 1.6);
      g.rotate(-sw);
      const p = new Path2D();
      if (kind === 0) {
        p.moveTo(-16, 0);
        p.lineTo(16, 0);
        p.lineTo(28, 12);
        p.lineTo(22, 22);
        p.lineTo(15, 17);
        p.lineTo(15, 48);
        p.lineTo(-15, 48);
        p.lineTo(-15, 17);
        p.lineTo(-22, 22);
        p.lineTo(-28, 12);
        p.closePath();
      } else if (kind === 1) {
        p.moveTo(-13, 0);
        p.lineTo(13, 0);
        p.lineTo(14, 58);
        p.lineTo(3, 58);
        p.lineTo(0, 16);
        p.lineTo(-3, 58);
        p.lineTo(-14, 58);
        p.closePath();
      } else p.rect(-12, 0, 24, 40);
      part(g, p, fill, shade, 2, [3, 3]);
      g.restore();
      // 衣夹
      g.fillStyle = INK;
      g.fillRect(cx - 3, cy - 8, 6, 10);
    }
  }
  // 门（在窗的右边）、门上的门牌、窗左边的绿信箱、门口一盆花
  const door = new Path2D();
  door.rect(x1 - 150, -720, 120, 722);
  part(g, door, "#8d6a54", "#7a5944", 3.2, [6, 5]);
  g.strokeStyle = "rgba(60,36,30,0.4)";
  g.lineWidth = 2.4;
  g.strokeRect(x1 - 134, -690, 88, 300);
  g.strokeRect(x1 - 134, -360, 88, 320);
  g.fillStyle = "#e6c46a";
  g.beginPath();
  g.arc(x1 - 52, -360, 7, 0, Math.PI * 2);
  g.fill();
  part(g, rectPath(x1 - 117, -780, 54, 34), "#5b7fa6", null, 2.4);
  part(g, rectPath(h.win.x - h.win.w / 2 - 140, -470, 64, 84), "#6f9a72", "#5e8661", 2.8, [4, 4]);
  part(g, rectPath(h.win.x - h.win.w / 2 - 140, -440, 64, 8), "#3e5a42", null, 0);
  const pot = new Path2D();
  pot.moveTo(x1 + 10, 0);
  pot.lineTo(x1 + 90, 0);
  pot.lineTo(x1 + 82, -70);
  pot.lineTo(x1 + 18, -70);
  pot.closePath();
  const bush = new Path2D();
  addEllipse(bush, x1 + 22, -104, 38, 30, -0.5);
  addEllipse(bush, x1 + 80, -104, 38, 30, 0.5);
  addEllipse(bush, x1 + 50, -140, 40, 36, 0);
  part(g, bush, "#7a985a", "#668249", 2.8, [5, 4]);
  for (const [dx, dy, c] of [
    [-20, -140, "#f0c86e"],
    [18, -150, "#e39a90"],
    [30, -110, "#f0c86e"],
  ] as const) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x1 + 50 + dx, dy, 9, 0, Math.PI * 2);
    g.fill();
  }
  part(g, pot, "#c4775a", "#ad6448", 2.8, [4, 3]);
  // 窗左边一盏壁灯：暖光晕在墙上
  {
    const lx = h.win.x - h.win.w / 2 - 110;
    const ly = -640;
    drawGlow(g, lx, ly + 20, 200, 0.55);
    part(g, rectPath(lx - 6, ly - 40, 12, 30), "#6f5a4c", null, 2.4);
    const shadeP = new Path2D();
    shadeP.moveTo(lx - 26, ly - 12);
    shadeP.lineTo(lx + 26, ly - 12);
    shadeP.lineTo(lx + 18, ly + 36);
    shadeP.lineTo(lx - 18, ly + 36);
    shadeP.closePath();
    part(g, shadeP, "#ffe2a8", "#f3cf86", 2.6, [3, 3]);
  }
  // 一楼的窗：亮着暖灯的屋子（墙上一盏小灯、一个挂历、一个书架）
  const { x, w, sill, top: wt } = h.win;
  const room = g.createLinearGradient(0, wt, 0, sill);
  room.addColorStop(0, "#f8d8a0");
  room.addColorStop(1, "#ebb67c");
  g.fillStyle = room;
  g.fillRect(x - w / 2, wt, w, sill - wt);
  drawGlow(g, x + w * 0.3, wt + 60, 90, 0.8);
  g.fillStyle = "rgba(255,244,210,0.95)";
  g.beginPath();
  g.arc(x + w * 0.3, wt + 60, 22, 0, Math.PI * 2);
  g.fill();
  part(g, rectPath(x - w * 0.42, wt + 40, 70, 90), "#f3efe6", null, 2.4);
  g.fillStyle = "#c95a4a";
  g.fillRect(x - w * 0.42, wt + 40, 70, 18);
  // 书架
  part(g, rectPath(x + w * 0.12, wt + 130, 120, 160), "#a3765a", null, 2.4);
  const books = ["#c96a52", "#6f8f86", "#e0b45a", "#7f93a8", "#b56b80"];
  for (let k = 0; k < 10; k++) {
    g.fillStyle = books[k % books.length];
    g.fillRect(x + w * 0.12 + 8 + (k % 5) * 21, wt + 140 + Math.floor(k / 5) * 72, 16, 60);
  }
}

/** 一楼的窗框、窗台、窗台上的花盆（画在老钟前面）；窗外装着防飘栏 */
export function drawHouseWindowFront(g: CanvasRenderingContext2D, h: House) {
  const { x, w, sill, top } = h.win;
  const frame = new Path2D();
  frame.rect(x - w / 2 - 18, top - 18, w + 36, sill - top + 36);
  frame.rect(x - w / 2, top, w, sill - top);
  g.fillStyle = "#8f6f58";
  g.fill(frame, "evenodd");
  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.stroke(frame);
  // 窗棂
  g.strokeStyle = "#8f6f58";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(x, top);
  g.lineTo(x, top + (sill - top) * 0.32);
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.stroke();
  part(g, rectPath(x - w / 2 - 34, sill + 14, w + 68, 22), "#a39a96", "#8f8682", 3, [4, 4]);
  const pot = new Path2D();
  pot.moveTo(x + w / 2 - 70, sill + 14);
  pot.lineTo(x + w / 2 - 22, sill + 14);
  pot.lineTo(x + w / 2 - 28, sill - 24);
  pot.lineTo(x + w / 2 - 64, sill - 24);
  pot.closePath();
  part(g, pot, "#c4775a", null, 2.6);
  const leaf = new Path2D();
  addEllipse(leaf, x + w / 2 - 62, sill - 40, 18, 13, -0.6);
  addEllipse(leaf, x + w / 2 - 30, sill - 40, 18, 13, 0.6);
  addEllipse(leaf, x + w / 2 - 46, sill - 58, 17, 17, 0);
  part(g, leaf, "#7a985a", "#668249", 2.6, [4, 3]);
  g.fillStyle = "#e39a90";
  g.beginPath();
  addEllipse(g, x + w / 2 - 54, sill - 60, 7, 7);
  addEllipse(g, x + w / 2 - 36, sill - 52, 6, 6);
  g.fill();
}
