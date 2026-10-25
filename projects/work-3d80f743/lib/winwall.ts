// 主歌二①–④（72.02–79.56）2026-10-25 用户重新设计：镜头在屋里，对着窗那面墙。
// 这里是这面墙的画法（「窗墙坐标」：和屋子坐标同一个单位，墙面上的人按屋里的大小 ROOM.s 画；y 朝下）：
// 墙纸、墙根的踢脚线、天花板、地板，窗洞（窗框、窗台板、上框那块板——她倒过来坐在它上面）、靠墙码着的写好的砖，
// 窗外的夜（远处的城、头顶的白），台灯的暖光（灯在镜头后面）和从窗外照进来的白的冷光。
// 镜头可以转（倒过来看就是她的世界：天花板在脚下）：窗外的夜跟着一起转。

import { type Cam, H, W, kick } from "./cam";
import { INK, Y_WHITE, drawCity, drawGlow, drawGrade, drawSky, drawWhite, part, rectPath } from "./world";
import { brickAt } from "./room";

type V2 = [number, number];

/** 天花板下沿、墙根 */
export const W_CEIL = 210;
export const W_FLOOR = 1640;
/** 窗洞（上框 y0：倒过来时她坐在这块板上；下框 y1 是真的窗台） */
export const WIN = { x0: 250, x1: 870, y0: 430, y1: 1170 };
const WALL = "#cdae97";
const WOOD = "#8c5f47";
const WOOD_D = "#74493a";

/** 窗墙坐标 → 画面（镜头 c：对准点、倍数、转角） */
export function applyWall(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, sh: [number, number] = [0, 0]) {
  g.setTransform(base);
  g.translate(W / 2 + sh[0], H / 2 + sh[1]);
  if (c.r) g.rotate(c.r);
  g.scale(c.z, c.z);
  g.translate(-c.x, -c.y);
}
/** 窗墙坐标里的一点在画面上的位置 */
export function wallToScreen(c: Cam, p: V2): V2 {
  const dx = (p[0] - c.x) * c.z;
  const dy = (p[1] - c.y) * c.z;
  const cs = Math.cos(c.r || 0);
  const sn = Math.sin(c.r || 0);
  return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs];
}
/** 世界里的镜头：让世界里的 pw 落在画面上的 sp（转角 r） */
function anchorCam(pw: V2, sp: V2, z: number, r: number): Cam {
  const dx = sp[0] - W / 2;
  const dy = sp[1] - H / 2;
  const cs = Math.cos(-r);
  const sn = Math.sin(-r);
  return { x: pw[0] - (dx * cs - dy * sn) / z, y: pw[1] - (dx * sn + dy * cs) / z, z, r };
}

/**
 * 窗外的夜（先画满整个画面，墙再盖上去，只从窗洞里露出来）：上半截是头顶的白（眩光、光柱），中间是夜空，
 * 下面远远的是城（远处几层楼、一格格亮着的窗）。很远：镜头推拉、平移时只跟着动一点；镜头转，它跟着转
 */
export function drawOutside(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number) {
  const mid = wallToScreen(c, [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2]);
  const top = wallToScreen(c, [(WIN.x0 + WIN.x1) / 2, WIN.y0]);
  const zf = 0.18 * Math.pow(c.z / 1.3, 0.2);
  // 远处的城：天际线在窗洞下面三成的地方
  const cityAt: V2 = [mid[0] + (wallToScreen(c, [(WIN.x0 + WIN.x1) / 2, WIN.y0 + (WIN.y1 - WIN.y0) * 0.8])[0] - mid[0]), wallToScreen(c, [(WIN.x0 + WIN.x1) / 2, WIN.y0 + (WIN.y1 - WIN.y0) * 0.8])[1]];
  const cc = anchorCam([-2400 + (c.x - 560) * 0.4, -2700], cityAt, zf, c.r || 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawSky(g, base, cc);
  drawCity(g, base, cc, t, undefined, [0, 0], { light: 1, haze: 0, wide: 1 });
  // 头顶的白：下沿（那圈肥皂泡似的淡彩）在窗洞上面两成的地方，上面一片发亮，往下打眩光和光柱
  const edge = wallToScreen(c, [(WIN.x0 + WIN.x1) / 2, WIN.y0 + (WIN.y1 - WIN.y0) * 0.2]);
  const wc = anchorCam([0, Y_WHITE], edge, 0.32 * Math.pow(c.z / 1.3, 0.2), c.r || 0);
  void top;
  g.save();
  drawWhite(g, base, wc, t, 0);
  g.restore();
}

/** 窗的木框、上框和下框的两块板、窗洞里一圈墙的厚度 */
function drawWindowFrame(g: CanvasRenderingContext2D) {
  const { x0, x1, y0, y1 } = WIN;
  // 窗洞里墙的厚度（四边一圈，比墙面暗一点）
  g.save();
  g.fillStyle = "#b8967f";
  const d = 26;
  const reveal = new Path2D();
  reveal.moveTo(x0, y0);
  reveal.lineTo(x1, y0);
  reveal.lineTo(x1 - d, y0 + d);
  reveal.lineTo(x0 + d, y0 + d);
  reveal.closePath();
  reveal.moveTo(x0, y1);
  reveal.lineTo(x1, y1);
  reveal.lineTo(x1 - d, y1 - d);
  reveal.lineTo(x0 + d, y1 - d);
  reveal.closePath();
  g.fill(reveal);
  g.fillStyle = "#a9876f";
  const side = new Path2D();
  side.moveTo(x0, y0);
  side.lineTo(x0 + d, y0 + d);
  side.lineTo(x0 + d, y1 - d);
  side.lineTo(x0, y1);
  side.closePath();
  side.moveTo(x1, y0);
  side.lineTo(x1 - d, y0 + d);
  side.lineTo(x1 - d, y1 - d);
  side.lineTo(x1, y1);
  side.closePath();
  g.fill(side);
  g.strokeStyle = "rgba(46,37,48,0.5)";
  g.lineWidth = 2.5;
  g.strokeRect(x0 + d, y0 + d, x1 - x0 - 2 * d, y1 - y0 - 2 * d);
  g.restore();
  // 两扇窗往屋里开着，贴在两边（玻璃反一点光）
  for (const [hx, dir] of [
    [x0, 1],
    [x1, -1],
  ] as const) {
    const w = 64 * dir;
    const sash = new Path2D();
    sash.moveTo(hx, y0 + 6);
    sash.lineTo(hx + w, y0 + 30);
    sash.lineTo(hx + w, y1 - 30);
    sash.lineTo(hx, y1 - 6);
    sash.closePath();
    g.fillStyle = "rgba(150,170,200,0.35)";
    g.fill(sash);
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(hx + w * 0.3, y0 + 80);
    g.lineTo(hx + w * 0.7, y0 + 260);
    g.stroke();
    g.lineWidth = 10;
    g.lineJoin = "round";
    g.strokeStyle = WOOD_D;
    g.stroke(sash);
    g.lineWidth = 2.5;
    g.strokeStyle = INK;
    g.stroke(sash);
    g.beginPath();
    g.moveTo(hx, (y0 + y1) / 2);
    g.lineTo(hx + w, (y0 + y1) / 2);
    g.lineWidth = 8;
    g.strokeStyle = WOOD_D;
    g.stroke();
  }
  // 木框（两边、上下）
  const fr = new Path2D();
  fr.rect(x0 - 34, y0 - 10, 34, y1 - y0 + 20);
  fr.rect(x1, y0 - 10, 34, y1 - y0 + 20);
  part(g, fr, WOOD, WOOD_D, 4, [4, 3]);
  // 下框的窗台板、上框那块板（一样宽、一样厚：倒过来看，上框就是她的窗台）
  part(g, rectPath(x0 - 60, y1 - 4, x1 - x0 + 120, 40), "#9a7f73", "#86695e", 4, [4, 3]);
  part(g, rectPath(x0 - 60, y0 - 36, x1 - x0 + 120, 40), "#9a7f73", "#86695e", 4, [4, 3]);
}

/** 靠墙码着的写好的砖（窗底下、窗两边；和屋里地上那几排一样的字） */
const WALL_BRICKS: [number, number, string, number][] = [
  [-180, 0, "抱抱你", 0.01],
  [-52, 0, "别怕", -0.01],
  [76, 0, "会好的", 0],
  [204, 0, "有我在", 0.01],
  [332, 0, "你很重要", 0],
  [460, 0, "吃饱饭", -0.01],
  [588, 0, "天会亮的", 0.01],
  [716, 0, "慢慢来", 0],
  [844, 0, "再撑一下", -0.01],
  [972, 0, "我等你", 0],
  [1100, 0, "晚安", 0.01],
  [-116, 1, "多喝水", 0],
  [12, 1, "你值得", 0.01],
  [140, 1, "早点睡", -0.01],
  [268, 1, "会过去的", 0],
  [652, 1, "我在呢", 0],
  [780, 1, "不怪你", 0.01],
  [908, 1, "别哭", -0.01],
  [204, 2, "抱抱你", 0],
  [716, 2, "有我在", 0],
];

/** 窗那面墙：墙纸、天花板、地板、窗洞（窗外那一层要先画）、窗框、靠墙码着的砖；坐标是窗墙坐标 */
export function drawWallSet(g: CanvasRenderingContext2D) {
  const { x0, x1, y0, y1 } = WIN;
  // 墙（窗洞挖空）
  const wall = new Path2D();
  wall.rect(-1400, W_CEIL, 3400, W_FLOOR - W_CEIL);
  wall.rect(x1, y0, -(x1 - x0), y1 - y0);
  g.fillStyle = WALL;
  g.fill(wall, "evenodd");
  g.save();
  g.clip(wall, "evenodd");
  g.fillStyle = "rgba(140,104,96,0.08)";
  for (let x = -1400; x < 2000; x += 64) g.fillRect(x, W_CEIL, 26, W_FLOOR - W_CEIL);
  g.restore();
  // 天花板、地板、踢脚线
  g.fillStyle = "#5c4752";
  g.fillRect(-1400, W_CEIL - 1400, 3400, 1400);
  g.fillStyle = "#4a3943";
  g.fillRect(-1400, W_CEIL - 16, 3400, 16);
  g.fillStyle = "#7b5646";
  g.fillRect(-1400, W_FLOOR, 3400, 1800);
  g.strokeStyle = "rgba(60,36,30,0.4)";
  g.lineWidth = 3;
  for (let y = W_FLOOR + 46; y < W_FLOOR + 1800; y += 62) {
    g.beginPath();
    g.moveTo(-1400, y);
    g.lineTo(2000, y);
    g.stroke();
  }
  g.fillStyle = "#5e4038";
  g.fillRect(-1400, W_FLOOR - 18, 3400, 18);
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-1400, W_FLOOR);
  g.lineTo(2000, W_FLOOR);
  g.moveTo(-1400, W_CEIL);
  g.lineTo(2000, W_CEIL);
  g.stroke();
  drawWindowFrame(g);
  // 靠墙码着的砖
  for (const [x, row, w, r] of WALL_BRICKS) brickAt(g, x, W_FLOOR - row * 42, 112, 42, w, r);
}

/**
 * 光：台灯在镜头后面（对面墙边的桌上），暖光照在这面墙上、往四角暗下去（multiply）；
 * 白的冷光从窗外头顶照进来：窗洞四周漫开一圈，窗前地上照出一块（screen）。k：冷光多亮
 */
export function drawWallLight(g: CanvasRenderingContext2D, k = 1) {
  const cx = (WIN.x0 + WIN.x1) / 2;
  g.save();
  g.globalCompositeOperation = "multiply";
  const lg = g.createRadialGradient(cx, 1250, 0, cx, 1250, 2100);
  lg.addColorStop(0, "rgb(255,246,232)");
  lg.addColorStop(0.4, "rgb(238,212,192)");
  lg.addColorStop(0.75, "rgb(160,126,140)");
  lg.addColorStop(1, "rgb(70,56,90)");
  g.fillStyle = lg;
  g.fillRect(-1400, W_CEIL - 1400, 3400, 4600);
  g.restore();
  if (k <= 0) return;
  g.save();
  g.globalCompositeOperation = "screen";
  // 窗洞四周（上面亮：白在头顶）
  const wg = g.createRadialGradient(cx, WIN.y0 + 80, 40, cx, WIN.y0 + 200, 760);
  wg.addColorStop(0, `rgba(196,206,238,${0.34 * k})`);
  wg.addColorStop(1, "rgba(196,206,238,0)");
  g.fillStyle = wg;
  g.fillRect(-1400, W_CEIL - 1400, 3400, 4600);
  // 窗前地上一块冷光（从头顶斜着照进来：靠墙窄、往镜头这边宽，边是虚的）
  for (const [grow, a] of [
    [40, 0.08],
    [18, 0.12],
    [0, 0.16],
  ]) {
    const p = new Path2D();
    p.moveTo(WIN.x0 + 40 - grow, W_FLOOR + 6);
    p.lineTo(WIN.x1 - 40 + grow, W_FLOOR + 6);
    p.lineTo(WIN.x1 + 120 + grow * 1.4, W_FLOOR + 240 + grow);
    p.lineTo(WIN.x0 - 120 - grow * 1.4, W_FLOOR + 240 + grow);
    p.closePath();
    g.fillStyle = `rgba(190,200,236,${a * k})`;
    g.fill(p);
  }
  g.restore();
}

/** 一帧的底：窗外、墙、光（人和东西在 between 里画：墙之后、光之前） */
export function drawWinwall(g: CanvasRenderingContext2D, base: DOMMatrix, grain: HTMLCanvasElement, c: Cam, t: number, between?: () => void, sh: [number, number] = [0, 0]) {
  drawOutside(g, base, c, t);
  applyWall(g, base, c, sh);
  drawWallSet(g);
  between?.();
  applyWall(g, base, c, sh);
  drawWallLight(g, 1);
  drawGlow(g, (WIN.x0 + WIN.x1) / 2, WIN.y0 + 60, 300, 0.12);
  drawGrade(g, base, grain, 0.6, 0.3);
  void kick;
}
