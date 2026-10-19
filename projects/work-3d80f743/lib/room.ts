// 她家（最高那栋楼顶层）夜里的屋子：屋子自己的坐标（地板 y = 0，天花板 y = −1000，人 590 高）。
// 左边一扇带防飘栏的窗，窗外上半截就是白（夜里也微微发光，偏冷），下面是很远很远的城的灯；窗下一张书桌、一盏台灯、一把椅子；
// 椅子右边的地上立着一排写好的砖（活下去、别怕、会好的……），后面一摞一摞还有很多；天花板上倒钉着一张床（床垫贴着天花板、床腿朝下），
// 床底下的地板上一个铁环，拴她的脚绳。台灯是屋里唯一的暖光。
// 她夜里的样子：脱了外套、围巾、手套和袖标，米白毛衣；铁靴脱下来以后是白袜子（光脚的脚趾近看像爪子）。

import { castLook } from "@materials/剪纸角色/code/cast";
import { type Look, type Rig, CHENGTUO, CHENGTUO_ITEMS, bootSoles, drawBoot, drawBrickShape, figurePose, figureRig } from "@materials/剪纸角色/code/chengtuo";
import { Frame, type Ink } from "@materials/剪纸角色/code/rig";
import { INK, addEllipse, drawGlow, part, rectPath } from "./world";
import { HAND_FONT } from "./note";

type V2 = [number, number];

export const ROOM = {
  floor: 0,
  ceil: -1000,
  x0: -820,
  x1: 820,
  win: { x0: -660, x1: -250, top: -900, bottom: -470 },
  desk: { x0: -700, x1: -250, top: -222 },
  chair: { x: -168, seat: -150 },
  bed: { x0: -60, x1: 540, legs: -880 },
  ring: 560,
  /** 地上那一排写好的砖（正面朝着镜头立着）：最右边先过镜头 */
  row: { x0: 96, dx: 66 },
  /** 脱下来的两只铁靴落在椅子右边 */
  boots: [-36, 26],
};

export const ROW_WORDS = ["活下去", "别怕", "会好的", "有我在", "你很重要", "天会亮的"];

/** 夜里的她：脱了外套、围巾、手套、袖标；bootL / bootR 是两只脚上还穿没穿着铁靴（脱掉以后是白袜子） */
export const NIGHT_ITEMS = { ...CHENGTUO_ITEMS, coat: false, scarf: false, gloves: false, band: false, boots: true, bricks: 2, bootL: true, bootR: true };
const SOCK = castLook({
  name: "袜子",
  scale: 1,
  colors: {},
  hair: "none",
  hairColor: "#000",
  shoes: { color: "#f6f2ec", shade: "#e2dbd0", sole: "#ebe4d9", style: "cloth", sock: "#f6f2ec" },
});
const bootOn = (rig: Rig, side: "L" | "R") => !!(rig.pose.items as Record<string, unknown>)[side === "L" ? "bootL" : "bootR"];
export const NIGHT_LOOK: Look = {
  ...CHENGTUO,
  items: NIGHT_ITEMS,
  shoe: () => true,
  soles: (rig, side) => (bootOn(rig, side) ? bootSoles(rig, side) : SOCK.soles!(rig, side)),
  overLeg: (ctx, rig, side, ink) => {
    if (bootOn(rig, side)) drawBoot(ctx, rig, side, ink);
    else SOCK.overLeg!(ctx, rig, side, ink);
  },
};

/** 一只脱下来立在地上的铁靴：(x, 0) 是鞋底中间，flip 靴尖朝右 */
export function drawLooseBoot(g: CanvasRenderingContext2D, x: number, y: number, rot: number, flip = false, lw = 3) {
  const pose = figurePose({ face: -0.8, ...{ hipL: 0, kneeL: 0, ankleL: 0 } }, 0, CHENGTUO);
  const rig = figureRig(pose, CHENGTUO);
  const a = rig.legs.L.end;
  // 靴底中间大概在脚踝下面 65、往前 28
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  if (flip) g.scale(-1, 1);
  g.translate(-a[0] + 28, -a[1] - 65);
  const ink: Ink = { line: INK, lw, shade: [4, 4] };
  drawBoot(g, { ...rig, pose: { ...rig.pose, items: { ...rig.pose.items, bricks: 2 } } }, "L", ink);
  g.restore();
}

/** 砖上写的字（龙藏体，她的手写）：f 是砖的坐标系（底边中点，y 往上为负），reveal 0..1 写到哪了（按字一个一个出来） */
export function brickWords(g: CanvasRenderingContext2D, f: Frame, w: number, h: number, words: string, reveal = 1, color = INK) {
  if (reveal <= 0) return;
  const m = g.getTransform();
  const P = (p: V2): V2 => {
    const q = m.transformPoint(new DOMPoint(p[0], p[1]));
    return [q.x, q.y];
  };
  const a = P(f.p(-w / 2, -h / 2));
  const b = P(f.p(w / 2, -h / 2));
  const c = P(f.p(0, -h / 2));
  const top = P(f.p(0, -h));
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const hgt = Math.hypot(top[0] - c[0], top[1] - c[1]) * 2;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(c[0], c[1]);
  g.rotate(ang);
  const chars = [...words];
  const fs = Math.min(hgt * 0.6, (len * 0.86) / chars.length);
  g.font = `${fs}px ${HAND_FONT}`;
  g.textBaseline = "middle";
  g.fillStyle = color;
  const total = chars.reduce((s, ch) => s + g.measureText(ch).width, 0);
  let x = -total / 2;
  const n = chars.length;
  chars.forEach((ch, i) => {
    const cw = g.measureText(ch).width;
    const k = Math.max(0, Math.min(1, reveal * n - i));
    if (k > 0) {
      g.save();
      // 一个字从上往下、从左往右一笔一笔出来（裁一块越来越大的斜角）
      g.beginPath();
      g.rect(x - 2, -fs * 0.7, (cw + 4) * Math.min(1, k * 1.6), fs * 1.4 * Math.min(1, 0.35 + k));
      g.clip();
      g.fillText(ch, x, fs * 0.04);
      g.restore();
    }
    x += cw;
  });
  g.restore();
}

/** 一块立着的砖（正面朝镜头）：(x, y) 底边中点，w×h，写着 words */
export function drawStandingBrick(g: CanvasRenderingContext2D, x: number, y: number, words: string, s = 1, reveal = 1, lw = 3) {
  const f = new Frame(x, y, 0);
  const W = 36 * s;
  const H = 27 * s;
  drawBrickShape(g, f, W, H, { line: INK, lw, shade: [3, 3] }, "#cec8be", "#b4aea5");
  brickWords(g, f, W, H, words, reveal);
}

/** 屋子后面的一层：墙、窗（窗外的白和城）、天花板、地板 */
export function drawRoomBack(g: CanvasRenderingContext2D, t: number) {
  const { x0, x1, ceil, win } = ROOM;
  // 墙：深的靛紫，往下一点点暖
  const wall = g.createLinearGradient(0, ceil, 0, 0);
  wall.addColorStop(0, "#2c2a46");
  wall.addColorStop(1, "#3d3450");
  g.fillStyle = wall;
  g.fillRect(x0 - 400, ceil - 400, x1 - x0 + 800, -ceil + 400);
  // 墙纸上淡淡的竖条
  g.fillStyle = "rgba(255,255,255,0.025)";
  for (let x = x0; x < x1; x += 70) g.fillRect(x, ceil, 26, -ceil);
  // 墙裙
  part(g, rectPath(x0 - 400, -160, x1 - x0 + 800, 160), "#3a3047", null, 2.6);
  // 窗外：上半截是白（夜里也亮着，偏冷），下沿一圈彩光；再往下是夜空，最底下是很远很远的城的灯
  g.save();
  g.beginPath();
  g.rect(win.x0, win.top, win.x1 - win.x0, win.bottom - win.top);
  g.clip();
  const sky = g.createLinearGradient(0, win.top, 0, win.bottom);
  sky.addColorStop(0, "#f2f6ff");
  sky.addColorStop(0.34, "#e6ecfb");
  sky.addColorStop(0.42, "#cfd2f4");
  sky.addColorStop(0.5, "#5d5a8c");
  sky.addColorStop(1, "#1f1d36");
  g.fillStyle = sky;
  g.fillRect(win.x0, win.top, win.x1 - win.x0, win.bottom - win.top);
  // 白的下沿：一道慢慢流动的彩光
  const ey = win.top + (win.bottom - win.top) * 0.4;
  for (const [i, c] of ["255,190,210", "255,230,170", "190,240,210", "180,215,255", "215,190,255"].entries()) {
    g.strokeStyle = `rgba(${c},0.55)`;
    g.lineWidth = 7;
    g.beginPath();
    for (let x = win.x0; x <= win.x1; x += 12) {
      const y = ey + i * 6 + 6 * Math.sin(x / 60 + t * 0.7 + i);
      if (x === win.x0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  // 很远的城：一粒粒暖色的灯
  for (let k = 0; k < 40; k++) {
    const r = Math.sin(k * 91.7) * 43758.5;
    const u = r - Math.floor(r);
    const v = Math.sin(k * 17.3) * 9631.1;
    const w = v - Math.floor(v);
    g.fillStyle = `rgba(255,${200 + Math.floor(w * 40)},140,${0.5 + 0.4 * Math.sin(t * 2 + k)})`;
    g.fillRect(win.x0 + u * (win.x1 - win.x0), win.bottom - 10 - w * 60, 3, 3);
  }
  g.restore();
  // 窗框、防飘栏（一根根竖着的铁条）、窗台
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.strokeRect(win.x0, win.top, win.x1 - win.x0, win.bottom - win.top);
  g.strokeStyle = "#5b5466";
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo((win.x0 + win.x1) / 2, win.top);
  g.lineTo((win.x0 + win.x1) / 2, win.bottom);
  g.stroke();
  g.lineWidth = 4;
  g.strokeStyle = "#2b2733";
  g.beginPath();
  for (let x = win.x0 + 34; x < win.x1; x += 46) {
    g.moveTo(x, win.top - 6);
    g.lineTo(x, win.bottom + 6);
  }
  g.moveTo(win.x0 - 10, win.top + 150);
  g.lineTo(win.x1 + 10, win.top + 150);
  g.stroke();
  part(g, rectPath(win.x0 - 22, win.bottom, win.x1 - win.x0 + 44, 20), "#57505f", null, 2.6);
  // 窗外的白漏进屋里：窗下墙上、地上一片冷光
  g.save();
  g.globalCompositeOperation = "lighter";
  const cool = g.createLinearGradient(win.x0, win.bottom, win.x0 + 300, 0);
  cool.addColorStop(0, "rgba(120,140,220,0.16)");
  cool.addColorStop(1, "rgba(120,140,220,0)");
  g.fillStyle = cool;
  g.beginPath();
  g.moveTo(win.x0, win.bottom);
  g.lineTo(win.x1, win.bottom);
  g.lineTo(win.x1 + 320, 0);
  g.lineTo(win.x0 + 200, 0);
  g.closePath();
  g.fill();
  g.restore();
  // 天花板一道梁、地板
  part(g, rectPath(x0 - 400, ceil - 60, x1 - x0 + 800, 60), "#26243a", null, 2.6);
  part(g, rectPath(x0 - 400, 0, x1 - x0 + 800, 600), "#4a3a40", null, 2.6);
  g.strokeStyle = "rgba(20,10,20,0.3)";
  g.lineWidth = 2;
  g.beginPath();
  for (let y = 40; y < 600; y += 60) {
    g.moveTo(x0 - 400, y);
    g.lineTo(x1 + 400, y);
  }
  g.stroke();
}

/** 天花板上倒钉着的床：床垫贴着天花板，床腿朝下；in 0..1 她躺进去了（被子鼓起来） */
export function drawCeilingBed(g: CanvasRenderingContext2D, t: number, blanket: (() => void) | null) {
  const { ceil, bed } = ROOM;
  // 床腿（四根短腿，往下伸）和床框
  for (const x of [bed.x0 + 20, bed.x1 - 40]) part(g, rectPath(x, ceil, 20, bed.legs - ceil), "#6a5248", "#57433a", 2.6, [3, 3]);
  part(g, rectPath(bed.x0, ceil + 20, bed.x1 - bed.x0, 40), "#8a6a58", "#735646", 3, [4, 4]);
  // 床垫贴着天花板
  part(g, rectPath(bed.x0 + 10, ceil + 56, bed.x1 - bed.x0 - 20, 36), "#d9d3dc", "#c3bcc8", 3, [3, 3]);
  // 枕头（在左头）
  const pillow = new Path2D();
  pillow.roundRect(bed.x0 + 24, ceil + 88, 120, 34, 14);
  part(g, pillow, "#efe9f0", "#dbd3dd", 2.6, [3, 3]);
  blanket?.();
  // 两根带子把被子绑在床上
  for (const x of [bed.x0 + 230, bed.x0 + 430]) {
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(x, ceil + 60);
    g.lineTo(x, ceil + 176);
    g.stroke();
    g.strokeStyle = "#c46b52";
    g.lineWidth = 5;
    g.stroke();
  }
}

/** 被子（在床垫下面，她躺进去以后盖在她身上；没人时平平地绑着） */
export function drawBlanket(g: CanvasRenderingContext2D, fill: number) {
  const { ceil, bed } = ROOM;
  const p = new Path2D();
  const y0 = ceil + 92;
  const bulge = 70 * fill;
  p.moveTo(bed.x0 + 120, y0);
  p.lineTo(bed.x1 - 20, y0);
  p.quadraticCurveTo(bed.x1 + 4, y0 + 20 + bulge * 0.6, bed.x1 - 40, y0 + 34 + bulge);
  p.quadraticCurveTo((bed.x0 + bed.x1) / 2, y0 + 50 + bulge * 1.2, bed.x0 + 140, y0 + 30 + bulge * 0.7);
  p.closePath();
  part(g, p, "#b7c3e0", "#9eabcc", 3, [4, 4]);
  // 被子上一道道褶
  g.strokeStyle = "rgba(60,70,110,0.35)";
  g.lineWidth = 2.4;
  g.beginPath();
  for (const k of [0.3, 0.55, 0.78]) {
    const x = bed.x0 + 120 + (bed.x1 - bed.x0 - 140) * k;
    g.moveTo(x, y0 + 4);
    g.quadraticCurveTo(x + 10, y0 + 20 + bulge * 0.5, x - 6, y0 + 30 + bulge * 0.9);
  }
  g.stroke();
}

/** 书桌、台灯（灯罩和亮的灯泡）、桌上一摞还没写的砖、笔筒；椅子 */
export function drawDesk(g: CanvasRenderingContext2D, t: number) {
  const { desk, chair } = ROOM;
  // 桌腿、桌面
  for (const x of [desk.x0 + 20, desk.x1 - 44]) part(g, rectPath(x, desk.top, 24, -desk.top), "#6e5246", "#5a4239", 2.6, [3, 3]);
  part(g, rectPath(desk.x0, desk.top - 4, desk.x1 - desk.x0, 26), "#8c6650", "#76533f", 3, [4, 4]);
  // 抽屉
  part(g, rectPath(desk.x0 + 60, desk.top + 22, 200, 60), "#7d5b48", null, 2.4);
  g.fillStyle = "#e0c070";
  g.beginPath();
  g.arc(desk.x0 + 160, desk.top + 52, 5, 0, Math.PI * 2);
  g.fill();
  // 桌上一摞还没写的砖（灰白的）
  for (let k = 0; k < 4; k++) drawStandingBrickBlank(g, desk.x0 + 70, desk.top - 4 - k * 27, 1);
  // 笔筒
  part(g, rectPath(desk.x0 + 150, desk.top - 64, 34, 60), "#a75d4c", "#8f4d3e", 2.4, [2, 2]);
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(desk.x0 + 160, desk.top - 64);
  g.lineTo(desk.x0 + 156, desk.top - 92);
  g.moveTo(desk.x0 + 172, desk.top - 64);
  g.lineTo(desk.x0 + 180, desk.top - 96);
  g.stroke();
  // 台灯：底座、弯脖子、灯罩
  const lx = desk.x0 + 260;
  part(g, rectPath(lx - 40, desk.top - 18, 80, 16), "#3f5a52", null, 2.6);
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(lx, desk.top - 16);
  g.quadraticCurveTo(lx - 20, desk.top - 170, lx + 70, desk.top - 230);
  g.stroke();
  g.strokeStyle = "#4f6f66";
  g.lineWidth = 5;
  g.stroke();
  const shade = new Path2D();
  shade.moveTo(lx + 30, desk.top - 250);
  shade.lineTo(lx + 120, desk.top - 230);
  shade.lineTo(lx + 140, desk.top - 170);
  shade.lineTo(lx + 40, desk.top - 196);
  shade.closePath();
  part(g, shade, "#3f6b62", "#33584f", 2.8, [3, 3]);
  g.fillStyle = "#fff4d6";
  g.beginPath();
  g.arc(lx + 92, desk.top - 182, 12, 0, Math.PI * 2);
  g.fill();
  // 椅子（她坐的那一把）：椅面、椅背在她身后（右边）
  part(g, rectPath(chair.x - 70, chair.seat, 150, 18), "#7a5a4a", "#654a3d", 2.6, [3, 3]);
  for (const x of [chair.x - 62, chair.x + 60]) part(g, rectPath(x, chair.seat + 18, 14, -chair.seat - 18), "#6e5246", null, 2.4);
  part(g, rectPath(chair.x + 64, chair.seat - 270, 16, 270), "#6e5246", null, 2.4);
}

/** 桌上没写字的砖 */
export function drawStandingBrickBlank(g: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  drawBrickShape(g, new Frame(x, y, 0), 36 * s, 27 * s, { line: INK, lw: 2.6, shade: [3, 3] }, "#cbc5bb", "#b2aca3");
}

/** 地上立着的一排写好的砖（最前面一排写着字，后面一摞一摞的只露出灰白的边） */
export function drawBrickRows(g: CanvasRenderingContext2D) {
  const { row } = ROOM;
  // 后面几摞（越往上越暗）
  for (let r = 3; r >= 1; r--) {
    for (let k = -1; k < 11; k++) {
      const x = row.x0 + k * 44 + (r % 2) * 18;
      drawBrickShape(g, new Frame(x, -r * 22, 0), 36, 27, { line: INK, lw: 2.2, shade: [2, 2] }, r === 1 ? "#bdb7ae" : "#a8a29a", "#99938b");
    }
  }
  // 最前面一排：一块一块写着字
  ROW_WORDS.forEach((w, i) => drawStandingBrick(g, row.x0 + i * row.dx, 0, w));
}

/** 台灯的暖光（叠在画好的屋子上：亮处提暖、灯下一团光） */
export function drawLampLight(g: CanvasRenderingContext2D, a = 1) {
  const { desk } = ROOM;
  const lx = desk.x0 + 352;
  const ly = desk.top - 170;
  g.save();
  g.globalCompositeOperation = "soft-light";
  const gr = g.createRadialGradient(lx, ly + 80, 10, lx, ly + 80, 700);
  gr.addColorStop(0, `rgba(255,190,110,${0.5 * a})`);
  gr.addColorStop(0.5, `rgba(255,170,100,${0.22 * a})`);
  gr.addColorStop(1, "rgba(255,170,100,0)");
  g.fillStyle = gr;
  g.fillRect(lx - 800, ly - 800, 1600, 1600);
  g.restore();
  drawGlow(g, lx, ly + 20, 220, 0.32 * a);
  drawGlow(g, lx - 10, desk.top - 10, 320, 0.12 * a);
}

/** 地上拴脚绳的铁环 */
export function drawFloorRing(g: CanvasRenderingContext2D) {
  const x = ROOM.ring;
  part(g, rectPath(x - 26, -8, 52, 12), "#4c4650", null, 2.4);
  g.beginPath();
  addEllipse(g, x, -20, 16, 12);
  g.strokeStyle = INK;
  g.lineWidth = 8;
  g.stroke();
  g.strokeStyle = "#7a747f";
  g.lineWidth = 4;
  g.stroke();
}
export const RING_AT: V2 = [ROOM.ring, -24];
