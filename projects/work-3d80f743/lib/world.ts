// 城：暖光电影感的老城区（样张 sheets/画风.ts）。六层居民楼、防盗窗（片子里的防飘栏）、空调外机、晾衣杆、花盆、
// 电线和梧桐；傍晚的暖光从左上斜着照进来，空气里飘着发亮的浮尘（就是灰），天顶是发光的「白」。
// 近处的东西和人物一样：深色描边、平涂、右下一道阴影；越远越只剩剪影，被暖色的空气冲淡。
// 坐标：世界单位和人物一样（人 s = 1 时 590 高），街面 y = 0，往上是负；远处的层按 D 投影（见 cam.ts）。

import { seeded } from "@frame/engine/math";
import { type Cam, H, W, applyCam, clamp01, toScreen, viewOf } from "./cam";

export const INK = "#2b2630";
/** 白的下沿（世界 y） */
export const Y_WHITE = -9200;

type P = [number, number];

/** 平涂 + 右下一道阴影 + 描边（和人物同一种画法）；lw = 0 不描边 */
export function part(g: CanvasRenderingContext2D, path: Path2D, fill: string, shade: string | null, lw = 3.2, off: P = [8, 6]) {
  g.fillStyle = fill;
  g.fill(path);
  if (shade) {
    g.save();
    g.clip(path);
    g.fillStyle = shade;
    g.fill(path);
    g.translate(-off[0], -off[1]);
    g.fillStyle = fill;
    g.fill(path);
    g.restore();
  }
  if (lw > 0) {
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke(path);
  }
}

const rect = (x: number, y: number, w: number, h: number) => {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
};

// ——— 天：地面是暖的杏色，越往上越淡，最上面是白 ———
const SKY: [number, number[]][] = [
  [0, [239, 196, 165]],
  [0.1, [242, 214, 193]],
  [0.32, [236, 226, 222]],
  [0.7, [247, 240, 233]],
  [0.93, [253, 250, 245]],
  [1, [255, 255, 255]],
];
export function skyAt(y: number) {
  const k = clamp01(y / Y_WHITE);
  for (let i = 1; i < SKY.length; i++) {
    if (k <= SKY[i][0]) {
      const [a, ca] = SKY[i - 1];
      const [b, cb] = SKY[i];
      const u = (k - a) / (b - a);
      return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * u)).join(",")})`;
    }
  }
  return "rgb(255,255,255)";
}

/** 天色（按人这一层的高度换算到画面上）；alpha < 1 时当作空气蒙在远处的楼上 */
export function drawSky(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, alpha = 1) {
  g.setTransform(base);
  const yTop = c.y - H / 2 / c.z;
  const yBot = c.y + H / 2 / c.z;
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, skyAt(yTop + ((yBot - yTop) * i) / 8));
  g.globalAlpha = alpha;
  g.fillStyle = gr;
  g.fillRect(-40, -40, W + 80, H + 80);
  g.globalAlpha = 1;
}

// ——— 居民楼 ———
export interface Block {
  x: number;
  w: number;
  floors: number;
  wall: string;
  wallShade: string;
  seed: number;
  /** 一层多高（层坐标） */
  fh: number;
}

/**
 * 一栋老居民楼（层坐标，地面 y = 0）：每层几户，窗外凸出来的防盗窗，有的挂空调外机、伸出晾衣杆晾着衣服、摆着花盆，
 * 傍晚有几扇亮着暖灯。detail：0 只有剪影和窗影，1 描边和窗，2 全部细节。按画面上一层有多高自动降细节。
 */
export function drawBlock(g: CanvasRenderingContext2D, b: Block, c: Cam, D: number, detail: number, lw: number, shadow = true) {
  const u = b.fh / 128;
  const s = c.z / D;
  const px = b.fh * s;
  if (px < 64) detail = Math.min(detail, 1);
  if (px < 20) detail = 0;
  const v = viewOf(c, D);
  g.save();
  g.translate(b.x, 0);
  g.scale(u, u);
  const w = b.w / u;
  const top = -b.floors * 128 - 60;
  const L = lw / u;
  const body = rect(0, top, w, -top + 3000);
  if (shadow && detail > 0) {
    g.save();
    g.translate(12 / (s * u), 9 / (s * u));
    g.fillStyle = "rgba(90,50,50,0.16)";
    g.fill(body);
    g.restore();
  }
  part(g, body, b.wall, detail > 0 ? b.wallShade : null, detail > 0 ? L : 0, [14, 10]);
  const r = seeded(b.seed);
  const tx = w * (0.15 + r() * 0.55);
  part(g, rect(tx, top - 70, 90, 70), b.wallShade, null, detail > 0 ? L : 0);
  if (detail > 0 && r() < 0.5) {
    g.strokeStyle = INK;
    g.lineWidth = L * 0.8;
    g.beginPath();
    g.moveTo(w * 0.8, top);
    g.lineTo(w * 0.8, top - 180);
    g.moveTo(w * 0.8 - 30, top - 130);
    g.lineTo(w * 0.8 + 30, top - 130);
    g.stroke();
  }
  // 看得见的楼层（层坐标 → 楼的局部）
  const yMin = (v.y0 - 0) / u;
  const yMax = (v.y1 - 0) / u;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  if (detail === 0) {
    // 太远太小时连窗影也不画（只剩剪影）
    if (px < 10) {
      g.restore();
      return;
    }
    g.fillStyle = "rgba(150,110,115,0.16)";
    for (let f = 0; f < b.floors; f++) {
      const y = top + 70 + f * 128;
      if (y > yMax || y + 80 < yMin) continue;
      for (let i = 0; i < units; i++) g.fillRect(20 + uw * i + uw * 0.2, y, uw * 0.6, 60);
    }
    g.restore();
    return;
  }
  for (let f = 0; f < b.floors; f++) {
    const y = top + 70 + f * 128;
    const rr = seeded(b.seed * 131 + f * 7);
    if (y - 60 > yMax || y + 140 < yMin) continue;
    if (detail > 1) {
      g.strokeStyle = "rgba(43,38,48,0.22)";
      g.lineWidth = L * 0.6;
      g.beginPath();
      g.moveTo(0, y - 14);
      g.lineTo(w, y - 14);
      g.stroke();
    }
    for (let i = 0; i < units; i++) {
      const wx = 20 + uw * i + uw * 0.18;
      const ww = uw * 0.64;
      const wh = 74;
      const kind = rr();
      const lit = rr() < 0.16;
      if (detail === 1) {
        g.fillStyle = lit ? "#ffd99a" : "#8a8f9b";
        g.fillRect(wx, y, ww, wh);
        if (kind < 0.7) {
          g.strokeStyle = INK;
          g.lineWidth = L * 0.6;
          g.strokeRect(wx - 6, y - 6, ww + 12, wh + 16);
        }
        continue;
      }
      part(g, rect(wx, y, ww, wh), lit ? "#ffd99a" : "#7f8796", lit ? "#f4c27a" : "#6c7382", L * 0.8, [5, 5]);
      // 防盗窗：凸出来的铁笼
      if (kind < 0.7) {
        g.strokeStyle = INK;
        g.lineWidth = L * 0.9;
        g.strokeRect(wx - 8, y - 8, ww + 16, wh + 22);
        g.lineWidth = L * 0.55;
        g.beginPath();
        for (let k = 1; k < 6; k++) {
          const bx = wx - 8 + ((ww + 16) * k) / 6;
          g.moveTo(bx, y - 8);
          g.lineTo(bx, y + wh + 14);
        }
        g.stroke();
        part(g, rect(wx - 12, y + wh + 12, ww + 24, 10), "#a39a96", null, L * 0.7);
        if (rr() < 0.45) {
          const pot = new Path2D();
          pot.moveTo(wx + 6, y + wh + 12);
          pot.lineTo(wx + 34, y + wh + 12);
          pot.lineTo(wx + 30, y + wh - 12);
          pot.lineTo(wx + 10, y + wh - 12);
          pot.closePath();
          part(g, pot, "#c77b5a", null, L * 0.6);
          const leaf = new Path2D();
          leaf.ellipse(wx + 20, y + wh - 26, 22, 16, 0, 0, Math.PI * 2);
          part(g, leaf, "#7e9b62", "#6a8652", L * 0.6, [4, 3]);
        }
      }
      // 空调外机
      if (kind > 0.55 && i === units - 1) {
        part(g, rect(wx + ww + 14, y + 26, 58, 44), "#e9e4dc", "#d6cfc4", L * 0.8, [4, 4]);
        g.strokeStyle = INK;
        g.lineWidth = L * 0.5;
        g.beginPath();
        g.arc(wx + ww + 43, y + 48, 14, 0, Math.PI * 2);
        g.stroke();
      }
      // 晾衣杆
      if (kind > 0.8 && i < units - 1) {
        const py = y - 2;
        g.strokeStyle = INK;
        g.lineWidth = L * 0.7;
        g.beginPath();
        g.moveTo(wx + ww, py);
        g.lineTo(wx + ww + 110, py - 6);
        g.stroke();
        const colors = ["#e8eef3", "#d77f6a", "#8fb2c9", "#f2d38a"];
        for (let k = 0; k < 3; k++) {
          const cx = wx + ww + 14 + k * 32;
          const cloth = new Path2D();
          cloth.moveTo(cx, py - 2);
          cloth.lineTo(cx + 24, py - 3);
          cloth.lineTo(cx + 22, py + 40 + (k % 2) * 10);
          cloth.lineTo(cx + 2, py + 42);
          cloth.closePath();
          part(g, cloth, colors[(k + b.seed + f) % 4], null, L * 0.6);
        }
      }
    }
  }
  g.restore();
}

interface Layer {
  D: number;
  haze: number;
  detail: number;
  lw: number;
  ground: string;
  blocks: Block[];
}

function row(seed: number, x0: number, x1: number, wMin: number, wMax: number, fMin: number, fMax: number, fh: number, walls: [string, string][], gaps: [number, number][] = []): Block[] {
  const r = seeded(seed);
  const out: Block[] = [];
  for (let x = x0; x < x1; ) {
    const w = wMin + r() * (wMax - wMin);
    const [wall, wallShade] = walls[Math.floor(r() * walls.length)];
    const b: Block = { x, w, floors: fMin + Math.floor(r() * (fMax - fMin + 1)), wall, wallShade, seed: Math.floor(r() * 9999), fh };
    if (!gaps.some(([a, c]) => b.x + b.w > a && b.x < c)) out.push(b);
    x += w + 30 + r() * 90;
  }
  return out;
}

export const LAYERS: Layer[] = [
  { D: 4, haze: 0.55, detail: 0, lw: 0, ground: "#dcc3b6", blocks: row(11, -14000, 14000, 500, 900, 8, 19, 190, [["#ddc8c4", "#d3bdb9"], ["#e3cfc6", "#d8c2b9"], ["#d9c6c8", "#cfbcbe"]]) },
  {
    D: 2.2,
    haze: 0.3,
    detail: 1,
    lw: 2.4,
    ground: "#cdb7ab",
    blocks: row(12, -9000, 9000, 420, 760, 6, 13, 190, [["#cfb9ae", "#c3aca1"], ["#d8c0b0", "#ccb2a2"], ["#c9b7b0", "#bca9a2"], ["#dcc6a8", "#cfb796"]]),
  },
  {
    D: 1.5,
    haze: 0.07,
    detail: 2,
    lw: 3.2,
    ground: "#bfb1a5",
    blocks: row(
      14,
      -6200,
      6200,
      380,
      620,
      5,
      9,
      190,
      [["#e9d6bd", "#dcc5a8"], ["#d99f86", "#c98b72"], ["#ead9a8", "#dcc890"], ["#dcb1a6", "#cf9f93"], ["#cfcbb5", "#c0bba3"]],
      [[-430, 520]],
    ),
  },
];

/** 全城最高那栋楼（和人在同一层）：一栋三十层的老塔楼，楼顶差一点碰到白，她住在顶层 */
export const TOWER: Block = { x: 430, w: 980, floors: 28, wall: "#f1e3cb", wallShade: "#e2cfb0", seed: 77, fh: 300 };

/** 梧桐、电线杆（D = 1.25，人身后、对面楼前） */
const TREES = [-1500, 380, 1700];
const POLES = [-420, 1250, -2300, 3000];

function planeTree(g: CanvasRenderingContext2D, x: number, t: number, lw: number) {
  const s = 1.4;
  const trunk = new Path2D();
  trunk.moveTo(x - 16 * s, 40);
  trunk.lineTo(x - 10 * s, -300 * s);
  trunk.lineTo(x - 50 * s, -420 * s);
  trunk.lineTo(x - 34 * s, -430 * s);
  trunk.lineTo(x + 2 * s, -330 * s);
  trunk.lineTo(x + 40 * s, -440 * s);
  trunk.lineTo(x + 54 * s, -430 * s);
  trunk.lineTo(x + 14 * s, -300 * s);
  trunk.lineTo(x + 18 * s, 40);
  trunk.closePath();
  part(g, trunk, "#b9a58d", "#9f8a72", lw, [6, 4]);
  const blobs: [number, number, number][] = [[-130, -520, 120], [10, -600, 140], [140, -510, 115], [-40, -450, 110], [80, -440, 100]];
  const sway = 4 * Math.sin(t * 0.7 + x);
  for (const [bx, by, r] of blobs) {
    const p = new Path2D();
    const n = 9;
    const cx = x + bx * s + sway;
    const cy = by * s;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * s * (0.9 + 0.12 * Math.sin(i * 2.7 + bx));
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.82;
      if (i === 0) p.moveTo(px, py);
      else p.quadraticCurveTo(cx + Math.cos(a - Math.PI / n) * rr * 1.15, cy + Math.sin(a - Math.PI / n) * rr * 0.95, px, py);
    }
    p.closePath();
    part(g, p, "#93ac6a", "#7a9457", lw, [16, 12]);
    g.save();
    g.clip(p);
    g.fillStyle = "rgba(255,228,150,0.45)";
    g.beginPath();
    g.arc(cx - r * s * 0.45, cy - r * s * 0.4, r * s * 0.6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

function drawStreetLife(g: CanvasRenderingContext2D, c: Cam, t: number) {
  const D = 1.25;
  const v = viewOf(c, D);
  const lw = 3.2;
  // 电线：相邻两根杆之间垂下来的弧
  const poles = [...POLES].sort((a, b) => a - b);
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  for (let i = 0; i + 1 < poles.length; i++) {
    const a = poles[i];
    const b = poles[i + 1];
    if (b < v.x0 || a > v.x1) continue;
    for (const [dy, sag] of [[0, 150], [10, 220], [40, 120]] as const) {
      g.beginPath();
      g.moveTo(a, -1180 + dy);
      g.quadraticCurveTo((a + b) / 2, -1180 + dy + sag * 2, b, -1180 + dy);
      g.stroke();
    }
  }
  for (const x of poles) {
    if (x < v.x0 - 100 || x > v.x1 + 100) continue;
    part(g, rect(x - 13, -1240, 26, 1300), "#8d8580", "#77706b", lw, [5, 4]);
    part(g, rect(x - 80, -1200, 160, 16), "#8d8580", null, lw);
  }
  for (const x of TREES) if (x > v.x0 - 500 && x < v.x1 + 500) planeTree(g, x, t, lw);
}

function drawGround(g: CanvasRenderingContext2D, c: Cam, D: number, color: string, lw: number) {
  const v = viewOf(c, D);
  g.fillStyle = color;
  g.fillRect(v.x0, 0, v.x1 - v.x0, 8000);
  if (lw > 0) {
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(v.x0, 0);
    g.lineTo(v.x1, 0);
    g.stroke();
  }
}

/**
 * 远处几层城（D > 1），每画完一层蒙一层空气（越远越淡）；between(D) 在蒙空气之前画这一层的人（远处飘着的人、对面街上走的人）。
 */
export function drawCity(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, between?: (D: number) => void, sh: [number, number] = [0, 0]) {
  for (const L of LAYERS) {
    applyCam(g, base, c, L.D, sh);
    const v = viewOf(c, L.D);
    drawGround(g, c, L.D, L.ground, L.lw);
    for (const b of L.blocks) {
      if (b.x + b.w < v.x0 || b.x > v.x1 || -b.floors * b.fh - 300 > v.y1) continue;
      drawBlock(g, b, c, L.D, L.detail, L.lw);
    }
    between?.(L.D);
    drawSky(g, base, c, L.haze);
  }
  // 梧桐、电线（对面楼前）
  applyCam(g, base, c, 1.25, sh);
  drawGround(g, c, 1.25, "#c4b6aa", 3.2);
  drawStreetLife(g, c, t);
  between?.(1.25);
}

/** 人这一层的街面：街沿一道窄边，往下是人行道（地砖缝按透视往下越来越疏、往两边斜开，看得出是平躺的地面） */
export function drawStreet(g: CanvasRenderingContext2D, c: Cam) {
  const v = viewOf(c, 1);
  g.fillStyle = "#cbbdb0";
  g.fillRect(v.x0, 0, v.x1 - v.x0, 8000);
  g.fillStyle = "#b8aa9d";
  g.fillRect(v.x0, 0, v.x1 - v.x0, 22);
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(v.x0, 0);
  g.lineTo(v.x1, 0);
  g.moveTo(v.x0, 22);
  g.lineTo(v.x1, 22);
  g.stroke();
  g.strokeStyle = "rgba(43,38,48,0.16)";
  g.lineWidth = 2.2;
  g.beginPath();
  for (let i = 1, y = 22; i < 9; i++) {
    y += 26 * i;
    g.moveTo(v.x0, y);
    g.lineTo(v.x1, y);
  }
  const step = 170;
  for (let x = Math.floor(v.x0 / step) * step; x < v.x1 + step; x += step) {
    g.moveTo(x, 22);
    g.lineTo(x + (x - c.x) * 1.6, 1200);
  }
  g.stroke();
}

// ——— 白 ———
export const whiteEdge = (x: number, t: number) => Y_WHITE + 34 * Math.sin(x / 520 + t * 0.6) + 18 * Math.sin(x / 190 - t * 0.9);

/**
 * 天上的白：下沿以上是发光的白，下沿一层肥皂泡一样的彩光（离得近时更宽、里面也流动着彩色），往下一点柔和的眩光。
 * flash 是有人被吸进去时整个画面亮一下。
 */
export function drawWhite(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, flash = 0) {
  const [, yEdge] = toScreen(c, 0, Y_WHITE);
  g.setTransform(base);
  const glare = 1400 * c.z;
  if (yEdge + glare > 0) {
    g.save();
    g.globalCompositeOperation = "screen";
    const gr = g.createLinearGradient(0, yEdge, 0, yEdge + glare);
    gr.addColorStop(0, "rgba(255,252,246,0.6)");
    gr.addColorStop(0.15, "rgba(255,248,238,0.22)");
    gr.addColorStop(0.5, "rgba(255,246,235,0.05)");
    gr.addColorStop(1, "rgba(255,246,235,0)");
    g.fillStyle = gr;
    g.fillRect(0, Math.max(-10, yEdge - 200), W, glare + 220);
    g.restore();
  }
  if (yEdge > -400) {
    applyCam(g, base, c, 1);
    const v = viewOf(c, 1);
    const path = new Path2D();
    const step = Math.max(8, 30 / c.z);
    path.moveTo(v.x0, v.y0 - 1000);
    for (let x = v.x0; x <= v.x1 + step; x += step) path.lineTo(x, whiteEdge(x, t));
    path.lineTo(v.x1 + step, v.y0 - 1000);
    path.closePath();
    // 下沿一层很淡的彩光，像肥皂泡的边：一道道细的叠在一起，模糊成一片
    const near = clamp01((c.z - 0.3) / 1.8);
    const band = (14 + 34 * near) / Math.max(0.5, c.z) + 10 / c.z;
    g.save();
    g.lineJoin = "round";
    const hues = [330, 30, 55, 150, 195, 255];
    for (let i = 0; i < hues.length; i++) {
      const hue = hues[i] + 18 * Math.sin(t * 0.8 + i);
      const a = 0.1 + 0.08 * near;
      g.save();
      g.translate(0, band * (0.3 + 0.6 * i) + (6 / c.z) * Math.sin(t * 0.7 + i * 1.7));
      // 三层越来越宽、越来越淡的线叠出柔边（比模糊滤镜快）
      for (const [kw, ka] of [[2.4, 0.45], [1.5, 0.75], [0.8, 1]] as const) {
        g.strokeStyle = `hsla(${hue}, 80%, ${84 + 3 * Math.sin(t * 1.3 + i * 2)}%, ${a * ka})`;
        g.lineWidth = band * kw;
        g.stroke(path);
      }
      g.restore();
    }
    g.restore();
    g.fillStyle = "#fffefb";
    g.fill(path);
    if (near > 0.05) {
      g.save();
      g.clip(path);
      g.globalAlpha = 0.45 * near;
      const r = seeded(5);
      for (let i = 0; i < 9; i++) {
        const x = v.x0 + (v.x1 - v.x0) * ((r() + t * 0.03 * (r() - 0.5) + 1) % 1);
        const y = Y_WHITE - 100 - r() * 600;
        const rad = 240 + r() * 380;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const hue = (r() * 360 + t * 25) % 360;
        gr.addColorStop(0, `hsla(${hue}, 90%, 86%, 0.9)`);
        gr.addColorStop(1, `hsla(${hue}, 90%, 92%, 0)`);
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.restore();
    }
  }
  if (flash > 0.001) {
    g.setTransform(base);
    g.fillStyle = `rgba(255,251,244,${Math.min(1, flash)})`;
    g.fillRect(0, 0, W, H);
  }
}

/** 碰到白的一下：一圈圈彩色光环往外扩（大小按画面像素算），中间一团白 */
export function drawBurst(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, x: number, y: number, age: number, scale = 1) {
  if (age < 0 || age > 1.6) return;
  const [sx, sy] = toScreen(c, x, y);
  g.setTransform(base);
  g.save();
  const hues = [330, 35, 60, 160, 200, 270];
  for (let i = 0; i < 4; i++) {
    const a = age - i * 0.09;
    if (a <= 0) continue;
    const k = 1 - Math.exp(-a / 0.28);
    const rad = (50 + 480 * k) * scale;
    const alpha = Math.max(0, 1 - a / 1.1) * 0.6;
    for (let j = 0; j < hues.length; j++) {
      g.strokeStyle = `hsla(${hues[(j + i) % hues.length]}, 85%, 74%, ${alpha / 2})`;
      g.lineWidth = (9 + 12 * (1 - k)) * scale;
      g.beginPath();
      g.arc(sx, sy, rad + j * 5 * scale, 0, Math.PI * 2);
      g.stroke();
    }
  }
  const core = Math.max(0, 1 - age / 0.5);
  if (core > 0) {
    const R = 260 * scale;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
    gr.addColorStop(0, `rgba(255,252,246,${core})`);
    gr.addColorStop(0.4, `rgba(255,236,226,${core * 0.5})`);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(sx - R, sy - R, R * 2, R * 2);
  }
  g.restore();
}

// ——— 灰：光里发亮的浮尘，一直在慢慢落 ———
let MOTE: HTMLCanvasElement | null = null;
export function moteSprite() {
  if (MOTE) return MOTE;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 48;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,248,232,1)");
  gr.addColorStop(0.25, "rgba(255,240,215,0.75)");
  gr.addColorStop(1, "rgba(255,236,210,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 48, 48);
  return (MOTE = cv);
}

const TILE = 1200;
const MOTES = (() => {
  const r = seeded(21);
  return Array.from({ length: 16 }, () => ({ x: r() * TILE, y: r() * TILE, s: 5 + r() * 9, v: 40 + r() * 60, ph: r() * 6.28 }));
})();

/** 浮尘（世界里一块块平铺；D 是这一层的远近，size 让近处的大一些） */
export function drawMotes(g: CanvasRenderingContext2D, c: Cam, t: number, D = 1, size = 1, alpha = 1) {
  const v = viewOf(c, D, 1.05);
  const k = c.z / D;
  const spr = moteSprite();
  g.save();
  g.globalCompositeOperation = "screen";
  const tx0 = Math.floor(v.x0 / TILE);
  const tx1 = Math.floor(v.x1 / TILE);
  const ty0 = Math.floor(v.y0 / TILE);
  const ty1 = Math.floor(v.y1 / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const shift = ((tx * 7 + ty * 13) % 5 + 5) % 5;
      // 拉远时每块少画几颗（画面上本来就小，数量照旧会太密、也太慢）
      const n = Math.max(4, Math.round(MOTES.length * Math.min(1, k / 0.6)));
      for (let i = 0; i < n; i++) {
        const m = MOTES[(i + shift * 3) % MOTES.length];
        const y = ty * TILE + ((m.y + t * m.v) % TILE);
        const x = tx * TILE + ((m.x + 30 * Math.sin(t * 0.6 + m.ph) + TILE) % TILE);
        const s = Math.max(2.2 / k, m.s * size) * 2.6;
        g.globalAlpha = alpha * (0.35 + 0.65 * Math.max(0, Math.sin(t * 2.1 + m.ph * 3)));
        g.drawImage(spr, x - s / 2, y - s / 2, s, s);
      }
    }
  }
  g.restore();
}

/** 远处往上飘的人：逆光的小剪影（层坐标，h 是身高） */
export function drawSilhouette(g: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, ph: number, alpha = 0.6) {
  const s = h / 140;
  g.save();
  g.translate(x, y);
  g.rotate(0.14 * Math.sin(t * 0.8 + ph));
  g.scale(s, s);
  const col = `rgba(132,98,110,${alpha})`;
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = "round";
  g.lineWidth = 12;
  const sw = Math.sin(t * 1.2 + ph);
  g.beginPath();
  g.moveTo(-8, 40);
  g.lineTo(-14 + sw * 3, 92);
  g.moveTo(8, 40);
  g.lineTo(12 - sw * 3, 94);
  g.moveTo(-16, -6);
  g.lineTo(-48, -46 + sw * 4);
  g.moveTo(16, -6);
  g.lineTo(48, -46 - sw * 4);
  g.stroke();
  g.beginPath();
  g.roundRect(-20, -16, 40, 60, 12);
  g.fill();
  g.beginPath();
  g.ellipse(0, -46, 22, 30, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// ——— 光 ———
/** 斜照进来的几道暖光（画面坐标，跟着镜头横向挪一点） */
export function drawSunbeams(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, k = 1) {
  if (k <= 0) return;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "screen";
  const shift = -((c.x * c.z) / 6) % 1400;
  const beams: [number, number, number][] = [[-500, 420, 0.13], [-60, 300, 0.09], [300, 260, 0.07], [900, 360, 0.1]];
  for (const [x0, w, a] of beams) {
    const kk = k * a * (0.85 + 0.15 * Math.sin(t * 0.6 + x0));
    const x = x0 + shift;
    const p = new Path2D();
    p.moveTo(x, -100);
    p.lineTo(x + w, -100);
    p.lineTo(x + w + 1500, H);
    p.lineTo(x + 1500, H);
    p.closePath();
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `rgba(255,236,200,${kk})`);
    gr.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = gr;
    g.fill(p);
  }
  g.restore();
}

/** 暖光（soft-light：只把亮处提暖，不把人染色）、纸的颗粒、很轻的暗角 */
export function drawGrade(g: CanvasRenderingContext2D, base: DOMMatrix, grain: HTMLCanvasElement, warm = 1, vig = 0.16) {
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "soft-light";
  const sun = g.createRadialGradient(60, 300, 0, 60, 300, 1800);
  sun.addColorStop(0, `rgba(255,200,130,${0.75 * warm})`);
  sun.addColorStop(1, "rgba(255,200,130,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.28;
  g.drawImage(grain, 0, 0, W, H);
  g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250);
  v.addColorStop(0, "rgba(60,30,40,0)");
  v.addColorStop(1, `rgba(60,30,40,${vig})`);
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}

export function makeGrain() {
  const cv = document.createElement("canvas");
  cv.width = 540;
  cv.height = 960;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(cv.width, cv.height);
  const r = seeded(3);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (r() - 0.5) * 34;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv;
}
