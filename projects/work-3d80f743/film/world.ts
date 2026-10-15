// 世界：一栋笼屋楼的剖面（一格一格只够躺下的小隔间）、她和他之间的那堵墙（裂缝、洞、塌开），以及整座城。
// 世界坐标单位约等于厘米，y 向下。
import { clamp, hash, hash2, prog, E, type V2 } from "./kit";

export const CELL_W = 220;
export const CELL_H = 130;
export const WALL = 10;
export const STEP_X = CELL_W + WALL;
export const STEP_Y = CELL_H + WALL;
export const NC = 7;
export const NR = 26;
export const B_W = NC * STEP_X + WALL; // 1620
export const B_H = NR * STEP_Y + WALL; // 3650
export const GROUND = 3700;

export interface Cell {
  c: number;
  r: number;
}
export const HER: Cell = { c: 3, r: 12 };
export const HIM: Cell = { c: 4, r: 12 };
export const MOM: Cell = { c: 3, r: 11 };
export const OLD: Cell = { c: 4, r: 13 };
/** 空着的一格，地上只剩一捧灰 */
export const ASH_CELL: Cell = { c: 2, r: 9 };

export const cellX = (c: number) => WALL + c * STEP_X;
export const cellY = (r: number) => WALL + r * STEP_Y;
export const floorY = (r: number) => cellY(r) + CELL_H;
export const cellCenter = (c: number, r: number): V2 => ({ x: cellX(c) + CELL_W / 2, y: cellY(r) + CELL_H / 2 });

/** 她和他之间那堵墙：x 920–930 */
export const WALL_L = cellX(HER.c) + CELL_W; // 920
export const WALL_R = cellX(HIM.c); // 930
export const WALL_X = (WALL_L + WALL_R) / 2; // 925
export const FLOOR = floorY(HER.r); // 1820
export const CEIL = cellY(HER.r); // 1690
/** 裂缝（两人每晚贴手的位置）和后来挖开的洞的中心 */
export const CRACK_TOP = 1747;
export const CRACK_BOT = 1797;
export const HOLE_Y = 1768;
/** 墙塌开的范围 */
export const OPEN_TOP = 1712;
export const T_COLLAPSE = 111.45;

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// ---------- 纹理 ----------
export interface WorldTex {
  mesh: CanvasPattern | null;
  windows: CanvasPattern | null;
  meshTile: HTMLCanvasElement;
  windowTile: HTMLCanvasElement;
}
export function makeWorldTex(): WorldTex {
  const meshTile = document.createElement("canvas");
  meshTile.width = meshTile.height = 24;
  const m = meshTile.getContext("2d")!;
  m.strokeStyle = "rgba(150,158,170,0.55)";
  m.lineWidth = 1.2;
  m.beginPath();
  m.moveTo(0.5, 0);
  m.lineTo(0.5, 24);
  m.moveTo(0, 0.5);
  m.lineTo(24, 0.5);
  m.stroke();
  const windowTile = document.createElement("canvas");
  windowTile.width = 46;
  windowTile.height = 28;
  const w = windowTile.getContext("2d")!;
  w.fillStyle = "#3b4048";
  w.fillRect(0, 0, 46, 28);
  w.fillStyle = "#23262c";
  w.fillRect(2, 2, 44, 26);
  w.fillStyle = "#2c3036";
  w.fillRect(3, 20, 42, 6);
  return { mesh: null, windows: null, meshTile, windowTile };
}
function ensurePatterns(ctx: CanvasRenderingContext2D, tex: WorldTex) {
  if (!tex.mesh) {
    tex.mesh = ctx.createPattern(tex.meshTile, "repeat");
    tex.mesh?.setTransform(new DOMMatrix().scale(0.5)); // 一格 12 个单位
  }
  if (!tex.windows) {
    tex.windows = ctx.createPattern(tex.windowTile, "repeat");
    tex.windows?.setTransform(new DOMMatrix().scale(5)); // 一格 = 一个隔间 230×140
  }
}

// ---------- 墙上的洞 ----------
/** 挖墙的时刻（踩在节拍上），每一下洞大一点 */
export const DIG_TIMES = [82.01, 82.51, 83.01, 83.51, 84.01, 84.51, 85.01, 85.51, 85.9, 86.01, 86.51, 87.01, 87.51, 92.01, 92.51, 93.01, 93.51, 94.01, 94.51];
export function holeRadius(t: number): number {
  if (t < 82.0) return 0;
  let r = 0;
  for (let i = 0; i < DIG_TIMES.length; i++) {
    const k = DIG_TIMES[i];
    if (t >= k) r += (i < 9 ? 0.62 : i < 13 ? 0.85 : 0.95) * E.out(3)(prog(t, k, k + 0.12));
  }
  // 扒墙：洞裂开
  r += 3.2 * E.out(2)(prog(t, 106.4, 107.9));
  return r;
}
/** 0..1，墙塌开的程度 */
export const collapseP = (t: number) => E.out(2)(prog(t, T_COLLAPSE, T_COLLAPSE + 0.3));

/** 洞的锯齿形状：在墙上的竖直范围（剖面里墙是一条竖带，洞就是带子上的缺口） */
function jag(y: number, seed: number) {
  return (hash(Math.floor(y / 2.3) + seed) - 0.5) * 2.4;
}

// ---------- 碎块 ----------
interface Chunk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  rot: number;
  t0: number;
}
const CHUNKS: Chunk[] = [];
(function buildChunks() {
  // 挖墙时溅出的碎渣（两边都有）
  for (let i = 0; i < DIG_TIMES.length; i++) {
    for (let k = 0; k < 4; k++) {
      const h = hash2(i, k);
      CHUNKS.push({
        x: WALL_X + (h - 0.5) * 6,
        y: HOLE_Y + (hash2(k, i) - 0.5) * 14,
        vx: (h > 0.5 ? 1 : -1) * (30 + 60 * hash2(i + 3, k)),
        vy: -40 - 50 * hash2(i, k + 9),
        s: 1.2 + 1.6 * hash2(i + 7, k),
        rot: h * 6,
        t0: DIG_TIMES[i] + 0.02,
      });
    }
  }
  // 塌墙
  for (let k = 0; k < 46; k++) {
    const hy = hash2(k, 99);
    CHUNKS.push({
      x: WALL_L + hash2(k, 5) * WALL,
      y: OPEN_TOP + hy * (FLOOR - OPEN_TOP),
      vx: (hash2(k, 11) - 0.35) * 70,
      vy: -10 - hash2(k, 13) * 30,
      s: 2 + hash2(k, 17) * 5,
      rot: hash2(k, 19) * 6,
      t0: T_COLLAPSE + hy * 0.12,
    });
  }
})();
const GRAV = 900;
function chunkPos(ch: Chunk, t: number): V2 | null {
  if (t < ch.t0) return null;
  const dt = t - ch.t0;
  let x = ch.x + ch.vx * Math.min(dt, 0.5);
  let y = ch.y + ch.vy * dt + 0.5 * GRAV * dt * dt;
  const floor = FLOOR - ch.s * 0.5;
  if (y > floor) {
    y = floor;
    // 落地后不再滑
    const tHit = (-ch.vy + Math.sqrt(ch.vy * ch.vy + 2 * GRAV * (floor - ch.y))) / GRAV;
    x = ch.x + ch.vx * Math.min(tHit, 0.5);
  }
  return { x, y };
}

// ---------- 画楼 ----------
export interface WorldState {
  era: "now" | "past";
  t: number;
  z: number;
  view: Rect;
  tex: WorldTex;
}

const C_BODY = "#4b5059";
const C_IN = "#30343b";
const C_IN2 = "#272a30";
const C_FLOOR = "#555a63";
const C_MAT = "#41454d";

export function drawSkyAndGround(ctx: CanvasRenderingContext2D, view: Rect) {
  const g = ctx.createLinearGradient(0, -16000, 0, GROUND);
  g.addColorStop(0, "#07090d");
  g.addColorStop(0.75, "#10131a");
  g.addColorStop(1, "#1a1e26");
  ctx.fillStyle = g;
  ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
  if (view.y1 > GROUND) {
    ctx.fillStyle = "#0e1013";
    ctx.fillRect(view.x0, GROUND, view.x1 - view.x0, view.y1 - GROUND);
  }
}

/** 画我们这栋楼（不含人物）。 */
export function drawBuilding(ctx: CanvasRenderingContext2D, ws: WorldState) {
  const { view, z, t, era } = ws;
  ensurePatterns(ctx, ws.tex);
  const x0 = Math.max(0, view.x0);
  const x1 = Math.min(B_W, view.x1);
  const y0 = Math.max(0, view.y0);
  const y1 = Math.min(B_H, view.y1);
  if (x1 <= x0 || y1 <= y0) return;
  // 楼体（墙和楼板）
  ctx.fillStyle = C_BODY;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // 楼顶和楼底边缘
  if (view.y1 > B_H) {
    ctx.fillStyle = "#3a3e45";
    ctx.fillRect(0, B_H, B_W, GROUND - B_H);
  }
  // 远景：只画窗格
  if (z < 0.33) {
    if (ws.tex.windows) {
      ctx.fillStyle = ws.tex.windows;
      ctx.fillRect(0, 0, B_W, B_H);
    }
    return;
  }
  const c0 = Math.max(0, Math.floor((view.x0 - WALL) / STEP_X));
  const c1 = Math.min(NC - 1, Math.floor((view.x1 - WALL) / STEP_X));
  const r0 = Math.max(0, Math.floor((view.y0 - WALL) / STEP_Y));
  const r1 = Math.min(NR - 1, Math.floor((view.y1 - WALL) / STEP_Y));
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const x = cellX(c);
      const y = cellY(r);
      // 室内：上暗下亮一点
      if (z > 0.8) {
        const g = ctx.createLinearGradient(0, y, 0, y + CELL_H);
        g.addColorStop(0, C_IN2);
        g.addColorStop(1, C_IN);
        ctx.fillStyle = g;
      } else ctx.fillStyle = C_IN;
      ctx.fillRect(x, y, CELL_W, CELL_H);
      if (z > 0.5) {
        // 地上的薄床垫和枕头
        ctx.fillStyle = C_MAT;
        ctx.fillRect(x + 6, y + CELL_H - 6, CELL_W - 12, 6);
        if (z > 1.2) {
          ctx.fillStyle = C_FLOOR;
          ctx.fillRect(x, y + CELL_H - 1.5, CELL_W, 1.5);
        }
      }
      if (z > 2.2) drawCellDetail(ctx, c, r, x, y, t, era);
      // 一格只剩一捧灰：说完了字的人（拉远时就能看到）
      if (era === "now" && c === ASH_CELL.c && r === ASH_CELL.r && z > 0.4) drawAshPile(ctx, x + 96, y + CELL_H, 0.9);
    }
  }
  // 两人之间那堵墙：裂缝 / 洞 / 塌开
  if (view.x0 < WALL_R + 40 && view.x1 > WALL_L - 40 && view.y0 < FLOOR + 20 && view.y1 > CEIL - 20) drawSharedWall(ctx, ws);
  // 笼屋的铁丝网门（远一点才画，近景时它在镜头后面）
  if (z < 3.2 && z > 0.3 && ws.tex.mesh) {
    ctx.save();
    ctx.globalAlpha = clamp((3.2 - z) / 1.2) * 0.35;
    ctx.fillStyle = ws.tex.mesh;
    for (let r = r0; r <= r1; r++) ctx.fillRect(Math.max(x0, WALL), cellY(r), Math.min(x1, B_W - WALL) - Math.max(x0, WALL), CELL_H);
    ctx.restore();
  }
}

function drawCellDetail(ctx: CanvasRenderingContext2D, c: number, r: number, x: number, y: number, t: number, era: string) {
  // 墙上的水渍和裂纹，固定种子
  ctx.strokeStyle = "rgba(20,22,26,0.55)";
  ctx.lineWidth = 0.8;
  const n = 2 + Math.floor(hash2(c, r) * 3);
  for (let i = 0; i < n; i++) {
    const sx = x + 20 + hash2(c * 7 + i, r) * (CELL_W - 40);
    const sy = y + 8 + hash2(c, r * 5 + i) * 40;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (hash2(i, c) - 0.5) * 10, sy + 8 + hash2(r, i) * 10);
    ctx.lineTo(sx + (hash2(i + 2, c) - 0.5) * 14, sy + 20 + hash2(r, i + 4) * 14);
    ctx.stroke();
  }
  // 挂在墙上的一件衣服 / 一个袋子
  if (hash2(c, r + 3) > 0.45) {
    const hx = x + 30 + hash2(c + 1, r) * 120;
    ctx.fillStyle = "#3a3e45";
    ctx.beginPath();
    ctx.roundRect(hx, y + 14, 16 + hash2(c, r) * 10, 22 + hash2(r, c) * 10, 3);
    ctx.fill();
  }
  // 枕头：住在墙边的两个人枕头靠着那堵墙
  ctx.fillStyle = "#5a5f68";
  if (c === HER.c && r === HER.r) {
    ctx.beginPath();
    ctx.roundRect(WALL_L - 34, FLOOR - 9, 30, 7, 3);
    ctx.fill();
  } else if (c === HIM.c && r === HIM.r) {
    ctx.beginPath();
    ctx.roundRect(WALL_R + 4, FLOOR - 9, 30, 7, 3);
    ctx.fill();
  } else {
    const left = hash2(c, r + 9) > 0.5;
    ctx.beginPath();
    ctx.roundRect(left ? x + 10 : x + CELL_W - 40, y + CELL_H - 13, 30, 7, 3);
    ctx.fill();
  }
  // 过去：她的格子里地上有一捧灰（妈妈）
  if (era === "past" && c === HER.c && r === HER.r) drawAshPile(ctx, 776, FLOOR, 1);
  void t;
}

/** 字说完的人化成的一捧灰 */
export function drawAshPile(ctx: CanvasRenderingContext2D, x: number, floor: number, s: number) {
  ctx.fillStyle = "#6f737a";
  ctx.beginPath();
  ctx.moveTo(x - 26 * s, floor);
  ctx.quadraticCurveTo(x - 16 * s, floor - 7 * s, x - 4 * s, floor - 9 * s);
  ctx.quadraticCurveTo(x + 8 * s, floor - 11 * s, x + 16 * s, floor - 5 * s);
  ctx.quadraticCurveTo(x + 22 * s, floor - 2 * s, x + 28 * s, floor);
  ctx.closePath();
  ctx.fill();
  // 一条围巾
  ctx.strokeStyle = "#565a61";
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, floor - 1.5 * s);
  ctx.quadraticCurveTo(x - 12 * s, floor - 12 * s, x + 6 * s, floor - 7 * s);
  ctx.stroke();
  ctx.fillStyle = "#83878d";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(x + (hash(i * 3.1) - 0.5) * 50 * s, floor - 1 - hash(i * 7.7) * 3 * s, 1.4 * s, 1.4 * s);
  }
}

/** 两人之间那堵墙：剖面里是一条竖带。裂缝是带子上的一道细缝，洞是带子上的缺口，塌了就只剩上半截。 */
function drawSharedWall(ctx: CanvasRenderingContext2D, ws: WorldState) {
  const { t, era } = ws;
  const hr = era === "now" ? holeRadius(t) : 0;
  const cp = era === "now" ? collapseP(t) : 0;
  // 先把墙的这一段重新画实，再挖开
  ctx.fillStyle = C_BODY;
  ctx.fillRect(WALL_L, CEIL, WALL, FLOOR - CEIL);
  // 墙面上的灰尘颗粒（哼歌时会震动，由 story 控制，这里画静态纹理）
  ctx.fillStyle = "rgba(30,32,37,0.5)";
  for (let i = 0; i < 26; i++) {
    const yy = CEIL + 6 + hash(i * 3.7) * (FLOOR - CEIL - 12);
    ctx.fillRect(WALL_L + 1 + hash(i * 9.1) * 8, yy, 0.9, 0.9);
  }
  if (era === "now" && cp <= 0) {
    // 裂缝：带子中间一条锯齿线
    ctx.strokeStyle = "#16181c";
    ctx.lineWidth = hr > 0 ? 0.9 : 0.75;
    ctx.beginPath();
    for (let y = CRACK_TOP; y <= CRACK_BOT; y += 2.3) {
      const x = WALL_X + jag(y, 3) * 0.9;
      if (y === CRACK_TOP) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (hr > 0 && cp < 1) {
    ctx.fillStyle = C_IN;
    ctx.beginPath();
    const top = HOLE_Y - hr;
    const bot = HOLE_Y + hr;
    ctx.moveTo(WALL_L - 0.5, top + jag(top, 1));
    for (let y = top; y <= bot; y += 2) ctx.lineTo(WALL_L - 0.5 + Math.abs(jag(y, 5)) * 0.4, y);
    ctx.lineTo(WALL_R + 0.5, bot + jag(bot, 2));
    for (let y = bot; y >= top; y -= 2) ctx.lineTo(WALL_R + 0.5 - Math.abs(jag(y, 8)) * 0.4, y);
    ctx.closePath();
    ctx.fill();
    // 洞边的裂纹（扒墙时向外裂开）
    const crackP = prog(t, 106.3, 107.9);
    if (crackP > 0) {
      ctx.strokeStyle = "#1a1c20";
      ctx.lineWidth = 0.7;
      for (let k = 0; k < 4; k++) {
        const up = k % 2 === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(WALL_X, HOLE_Y + up * hr);
        ctx.lineTo(WALL_X + (hash(k) - 0.5) * 6, HOLE_Y + up * (hr + 10 * crackP * (1 + hash(k + 5))));
        ctx.lineTo(WALL_X + (hash(k + 1) - 0.5) * 8, HOLE_Y + up * (hr + 22 * crackP * (1 + hash(k + 7))));
        ctx.stroke();
      }
    }
  }
  if (cp > 0) {
    // 塌开：从 OPEN_TOP 到地面全空，边缘锯齿
    const top = OPEN_TOP + (1 - cp) * (HOLE_Y - OPEN_TOP);
    ctx.fillStyle = C_IN;
    ctx.beginPath();
    ctx.moveTo(WALL_L - 0.5, FLOOR);
    ctx.lineTo(WALL_L - 0.5, top + jag(top, 4) * 2);
    for (let x = WALL_L; x <= WALL_R; x += 1.5) ctx.lineTo(x, top + Math.abs(jag(x * 3, 6)) * 3);
    ctx.lineTo(WALL_R + 0.5, FLOOR);
    ctx.closePath();
    ctx.fill();
    // 墙根残留的一小截
    ctx.fillStyle = C_BODY;
    ctx.fillRect(WALL_L + 1, FLOOR - 4, WALL - 2, 4);
  }
  // 碎块
  if (era === "now" && t > 82) {
    ctx.fillStyle = "#5d626b";
    for (const ch of CHUNKS) {
      const p = chunkPos(ch, t);
      if (!p) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ch.rot + (t - ch.t0) * 3 * (p.y < FLOOR - ch.s ? 1 : 0));
      ctx.fillRect(-ch.s / 2, -ch.s / 2, ch.s, ch.s * 0.7);
      ctx.restore();
    }
  }
}

// ---------- 整座城 ----------
export interface Tower {
  x0: number;
  x1: number;
  top: number;
  /** 这栋楼「活下去」亮起来的时刻和起点高度 */
  lightT: number;
  lightY: number;
}
export const CITY: Tower[] = [];
(function buildCity() {
  let x = B_W + 260;
  let i = 0;
  while (x < 15000) {
    const w = 900 + hash(i * 3.3) * 1700;
    const top = -2600 + hash(i * 7.1) * 4300;
    CITY.push({ x0: x, x1: x + w, top, lightT: 126.0 + hash(i * 5.7) * 2.6, lightY: top + (GROUND - top) * (0.3 + hash(i) * 0.5) });
    x += w + 220 + hash(i * 1.9) * 520;
    i++;
  }
  x = -260;
  i = 50;
  while (x > -15000) {
    const w = 900 + hash(i * 3.3) * 1700;
    const top = -2600 + hash(i * 7.1) * 4300;
    CITY.push({ x0: x - w, x1: x, top, lightT: 126.0 + hash(i * 5.7) * 2.6, lightY: top + (GROUND - top) * (0.3 + hash(i) * 0.5) });
    x -= w + 220 + hash(i * 1.9) * 520;
    i++;
  }
})();
/** 高架铁路和列车 */
export const RAIL_Y = 2950;
export const trainX = (t: number) => -11000 + (t - 118) * 700;
export const TRAIN_LEN = 8 * 560;

export function drawCity(ctx: CanvasRenderingContext2D, ws: WorldState) {
  const { view } = ws;
  ensurePatterns(ctx, ws.tex);
  for (const b of CITY) {
    if (b.x1 < view.x0 || b.x0 > view.x1) continue;
    ctx.fillStyle = "#30343b";
    ctx.fillRect(b.x0, b.top, b.x1 - b.x0, GROUND - b.top);
    if (ws.tex.windows) {
      ctx.save();
      ctx.fillStyle = ws.tex.windows;
      ctx.fillRect(b.x0 + 20, b.top + 30, b.x1 - b.x0 - 40, GROUND - b.top - 60);
      ctx.restore();
    }
    // 楼顶的水箱
    ctx.fillStyle = "#262a30";
    ctx.fillRect(b.x0 + (b.x1 - b.x0) * 0.2, b.top - 120, 160, 120);
  }
  // 高架铁路
  if (view.y0 < RAIL_Y + 200 && view.y1 > RAIL_Y - 200) {
    ctx.fillStyle = "#24272c";
    ctx.fillRect(view.x0, RAIL_Y, view.x1 - view.x0, 40);
    for (let px = Math.floor(view.x0 / 900) * 900; px < view.x1; px += 900) ctx.fillRect(px, RAIL_Y, 60, GROUND - RAIL_Y);
    const tx = trainX(ws.t);
    ctx.fillStyle = "#3a3f47";
    for (let k = 0; k < 8; k++) ctx.fillRect(tx + k * 560, RAIL_Y - 150, 540, 140);
    ctx.fillStyle = "#1f2227";
    for (let k = 0; k < 8; k++) for (let w = 0; w < 6; w++) ctx.fillRect(tx + k * 560 + 30 + w * 85, RAIL_Y - 125, 60, 60);
  }
}
