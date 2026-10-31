// 主歌二①–④（72.02–79.56）2026-10-25 用户重新设计：镜头在屋里，对着窗那面墙。
// 这里是这面墙的画法（「窗墙坐标」：和屋子坐标同一个单位，墙面上的人按屋里的大小 ROOM.s 画；y 朝下）：
// 墙纸、墙根的踢脚线、天花板、地板，窗洞（窗框、窗台板、上框那块板——她倒过来坐在它上面）、靠墙码着的写好的砖，
// 窗外的夜（远处的城、头顶的白），台灯的暖光（灯在镜头后面）和从窗外照进来的白的冷光。
// 镜头可以转（倒过来看就是她的世界：天花板在脚下）：窗外的夜跟着一起转。

import { type Cam, H, LANDSCAPE, VH, VW, W, kick, lensOf } from "./cam";
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
export function applyWall(g: CanvasRenderingContext2D, base: DOMMatrix, c0: Cam, sh: [number, number] = [0, 0]) {
  const c = lensOf(c0);
  g.setTransform(base);
  g.translate(W / 2 + sh[0], H / 2 + sh[1]);
  if (c.r) g.rotate(c.r);
  g.scale(c.z, c.z);
  g.translate(-c.x, -c.y);
}
/** 窗墙坐标里的一点在竖屏画面上的位置（取景用） */
export function wallToScreen(c: Cam, p: V2): V2 {
  const dx = (p[0] - c.x) * c.z;
  const dy = (p[1] - c.y) * c.z;
  const cs = Math.cos(c.r || 0);
  const sn = Math.sin(c.r || 0);
  return [VW / 2 + dx * cs - dy * sn, VH / 2 + dx * sn + dy * cs];
}
/** 画的时候：窗墙坐标里的一点在这条时间轴画面上的位置（横屏按横屏镜头） */
function wallToOut(c0: Cam, p: V2): V2 {
  const c = lensOf(c0);
  const dx = (p[0] - c.x) * c.z;
  const dy = (p[1] - c.y) * c.z;
  const cs = Math.cos(c.r || 0);
  const sn = Math.sin(c.r || 0);
  return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs];
}
/** 世界里的镜头（画面上的，不再换算）：让世界里的 pw 落在画面上的 sp（转角 r） */
function anchorCam(pw: V2, sp: V2, z: number, r: number): Cam {
  const dx = sp[0] - W / 2;
  const dy = sp[1] - H / 2;
  const cs = Math.cos(-r);
  const sn = Math.sin(-r);
  return { x: pw[0] - (dx * cs - dy * sn) / z, y: pw[1] - (dx * sn + dy * cs) / z, z, r, o: true };
}

/**
 * 窗外的夜（先画满整个画面，墙再盖上去，只从窗洞里露出来）：上半截是头顶的白（眩光、光柱），中间是夜空，
 * 下面远远的是城（远处几层楼、一格格亮着的窗）。很远：镜头推拉、平移时只跟着动一点；镜头转，它跟着转
 */
export function drawOutside(g: CanvasRenderingContext2D, base: DOMMatrix, c0: Cam, t: number) {
  const c = lensOf(c0);
  const wallToScreen = wallToOut;
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

/**
 * 横屏才看得见的窗左边那截墙（2026-10-30 用户看着横屏 1:17.02：「房间有点空，需要添加一点装饰」）：
 * 墙根一个矮木柜（一格书、两个抽屉），柜上一盆垂下来的绿萝、一罐签字笔、两块还没写字的砖；
 * 墙上贴着一张小时候的蜡笔画（穿着大铁靴的小女孩牵着妈妈）；地上一块旧的椭圆地毯。
 * 都在窗墙坐标 x < −140：竖屏和横屏①②（倒着的那两段）的画面外。竖屏不画
 */
function wallDecor(g: CanvasRenderingContext2D) {
  const lw = 3.5;
  // 地毯：褪了色的红，里面一圈浅色的虚线边
  const rug = new Path2D();
  rug.ellipse(-440, W_FLOOR + 74, 290, 46, 0, 0, Math.PI * 2);
  part(g, rug, "#9a5d55", "#86504a", 3, [0, 7]);
  g.save();
  g.strokeStyle = "rgba(236,214,190,0.5)";
  g.lineWidth = 5;
  g.setLineDash([14, 10]);
  g.beginPath();
  g.ellipse(-440, W_FLOOR + 74, 250, 32, 0, 0, Math.PI * 2);
  g.stroke();
  g.restore();
  // 矮木柜：上面一格敞开的书架，下面两个抽屉。做矮是为了柜上的东西低过横屏左边那列歌词
  // （1:17.4–1:17.8 镜头往下推，柜子在画面上往上走，原来柜上的绿萝从「乘客」两个字底下扫过）
  const x0 = -640;
  const x1 = -300;
  const top = 1424;
  const mid = 1540;
  part(g, rectPath(x0, top, x1 - x0, W_FLOOR - top), "#a87a5c", "#946649", lw, [8, 6]);
  g.fillStyle = "#6e4a3a";
  g.fillRect(x0 + 18, top + 14, x1 - x0 - 36, mid - top - 14);
  g.strokeStyle = "rgba(46,37,48,0.55)";
  g.lineWidth = 2.5;
  g.strokeRect(x0 + 18, top + 14, x1 - x0 - 36, mid - top - 14);
  part(g, rectPath(x0 - 16, top - 22, x1 - x0 + 32, 24), "#8f6247", null, lw);
  // 一排书（最后一本斜靠着）
  const books: [number, number, string][] = [
    [26, 86, "#6f6a8e"],
    [32, 74, "#b07a5a"],
    [22, 92, "#6f8f86"],
    [30, 80, "#c9a35a"],
    [26, 70, "#8a5a5a"],
    [34, 84, "#7d8aa0"],
  ];
  let bx = x0 + 28;
  for (const [w, h, c] of books) {
    part(g, rectPath(bx, mid - h, w, h), c, null, 2.5);
    g.fillStyle = "rgba(255,246,232,0.35)";
    g.fillRect(bx + 3, mid - h + 12, w - 6, 5);
    bx += w + 2;
  }
  g.save();
  g.translate(bx + 6, mid);
  g.rotate(0.36);
  part(g, rectPath(0, -80, 26, 80), "#a3676b", null, 2.5);
  g.restore();
  // 两个抽屉
  const dw = (x1 - x0 - 44) / 2;
  for (const dx of [x0 + 18, x0 + 26 + dw]) {
    part(g, rectPath(dx, mid + 10, dw, W_FLOOR - mid - 30), "#b48867", null, 2.5);
    g.fillStyle = "#e3c27a";
    g.beginPath();
    g.arc(dx + dw / 2, mid + 10 + (W_FLOOR - mid - 30) / 2, 7, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
  }
  // 柜上：左头两块没写的砖（矮的放在歌词扫过的那一头：作品 1:17.4–1:17.8、回忆 2:02.6–2:02.8 歌词在它上面），
  // 中间一罐签字笔，右头一盆绿萝顺着柜子右边垂下来
  const shelf = top - 22;
  brickAt(g, -584, shelf, 112, 42, "", 0);
  brickAt(g, -578, shelf - 42, 112, 42, "", -0.03);
  const jar = new Path2D();
  jar.roundRect(-498, shelf - 74, 56, 74, 10);
  g.fillStyle = "rgba(196,212,226,0.4)";
  g.fill(jar);
  for (const [dx, tip, ang] of [
    [-12, 66, -0.16],
    [-3, 82, -0.04],
    [6, 74, 0.08],
    [14, 60, 0.2],
  ] as const) {
    const bx0 = -470 + dx;
    const by0 = shelf - 20;
    const ex = bx0 + Math.sin(ang) * (tip + 50);
    const ey = by0 - Math.cos(ang) * (tip + 50);
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(bx0, by0);
    g.lineTo(ex, ey);
    g.stroke();
    g.strokeStyle = "#3d3540";
    g.lineWidth = 5;
    g.stroke();
  }
  // 一支笔上的价签（和她写字那支一样）
  g.fillStyle = "#f4ead8";
  g.save();
  g.translate(-473 + Math.sin(-0.04) * 96, shelf - 20 - Math.cos(-0.04) * 96);
  g.rotate(-0.04);
  g.fillRect(-9, -7, 18, 14);
  g.strokeStyle = "#c0533a";
  g.lineWidth = 1.5;
  g.strokeRect(-9, -7, 18, 14);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke(jar);
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-490, shelf - 60);
  g.lineTo(-490, shelf - 18);
  g.stroke();
  // 绿萝：陶盆、盆沿几片、顺着柜子右边垂下来几串
  const PX = -362;
  const pot = new Path2D();
  pot.moveTo(PX - 38, shelf - 76);
  pot.lineTo(PX + 38, shelf - 76);
  pot.lineTo(PX + 30, shelf);
  pot.lineTo(PX - 30, shelf);
  pot.closePath();
  const leaf = (x: number, y: number, s: number, a: number) => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.scale(s, s);
    const p = new Path2D();
    p.moveTo(0, 0);
    p.bezierCurveTo(-14, -6, -16, -24, 0, -30);
    p.bezierCurveTo(16, -24, 14, -6, 0, 0);
    part(g, p, "#6f9a5a", "#5d8549", 2.2 / s, [3, 2]);
    g.strokeStyle = "rgba(46,60,40,0.45)";
    g.lineWidth = 1.4 / s;
    g.beginPath();
    g.moveTo(0, -3);
    g.lineTo(0, -24);
    g.stroke();
    g.restore();
  };
  // 垂下来的藤（先画，叶子压在上面）
  const vines: [number, number, number][] = [
    [PX + 28, PX + 96, shelf + 222],
    [PX + 12, PX + 70, shelf + 142],
    [PX - 34, PX - 46, shelf + 102],
  ];
  g.strokeStyle = "#4f6e42";
  g.lineWidth = 3;
  for (const [sx, ex, ey] of vines) {
    g.beginPath();
    g.moveTo(sx, shelf - 60);
    g.bezierCurveTo(sx + 40, shelf - 20, ex - 20, shelf + 60, ex, ey);
    g.stroke();
  }
  for (const [sx, ex, ey] of vines) {
    for (let k = 1; k <= 6; k++) {
      const u = k / 6;
      // 沿着藤大致的位置挂叶子（左右交替）
      const x = sx + (ex - sx) * u + 30 * Math.sin(Math.PI * u) + (k % 2 ? -8 : 8);
      const y = shelf - 50 + (ey - (shelf - 50)) * u;
      leaf(x, y, 0.85 - 0.25 * u, Math.PI + (k % 2 ? 0.5 : -0.5));
    }
  }
  part(g, pot, "#c46a4a", "#ad5a3d", lw, [5, 4]);
  part(g, rectPath(PX - 44, shelf - 88, 88, 16), "#b85f42", null, lw);
  // 盆沿上的叶子往两边、往下垂，不往上冒（柜上不放高的东西，低过歌词）
  for (const [dx, dy, s, a] of [
    [-14, -84, 1.0, -1.35],
    [0, -90, 1.0, -0.75],
    [16, -90, 1.0, 0.75],
    [30, -84, 1.0, 1.35],
    [-24, -78, 0.9, -2.1],
    [40, -78, 0.9, 2.1],
  ] as const)
    leaf(PX - 10 + dx, shelf + dy, s, a);
  // 墙上贴着的蜡笔画：她小时候画的，穿着妈妈的大铁靴牵着妈妈，天上一个太阳
  g.save();
  // 横屏左边那列歌词（作品 75.9–79.3）在画面上不动、墙跟着镜头走，扫过的是窗墙 x −580…−410：画贴在它右边
  g.translate(-300, 1030);
  g.rotate(-0.05);
  part(g, rectPath(-72, -56, 144, 112), "#efe6d2", "#e2d6bd", 2.5, [4, 3]);
  g.fillStyle = "rgba(232,222,196,0.75)";
  for (const s of [-1, 1]) {
    g.save();
    g.translate(s * 60, -54);
    g.rotate(s * 0.5);
    g.fillRect(-14, -6, 28, 12);
    g.restore();
  }
  g.lineCap = "round";
  g.lineJoin = "round";
  const crayon = (c: string, w: number, pts: [number, number][]) => {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  // 地
  crayon("#7aa35a", 4, [[-62, 38], [-30, 34], [0, 39], [30, 35], [62, 38]]);
  // 太阳
  g.fillStyle = "#e9a13b";
  g.beginPath();
  g.arc(46, -34, 9, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    crayon("#e9a13b", 2.5, [[46 + Math.cos(a) * 13, -34 + Math.sin(a) * 13], [46 + Math.cos(a) * 19, -34 + Math.sin(a) * 19]]);
  }
  // 妈妈：长头发、裙子
  crayon("#5a3a30", 4, [[-34, -28], [-38, -6], [-36, 4]]);
  crayon("#5a3a30", 4, [[-22, -28], [-18, -6], [-20, 4]]);
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(-28, -24, 8, 0, Math.PI * 2);
  g.stroke();
  crayon("#d77a8a", 4, [[-28, -15], [-38, 16], [-18, 16], [-28, -15]]);
  crayon(INK, 2.5, [[-32, 16], [-32, 34]]);
  crayon(INK, 2.5, [[-24, 16], [-24, 34]]);
  // 牵着的手
  crayon(INK, 2.5, [[-22, -4], [-4, 6], [8, 4]]);
  // 小时候的她：小一号，黄衣服，脚上一双大大的灰铁靴
  g.beginPath();
  g.arc(12, -4, 6, 0, Math.PI * 2);
  g.stroke();
  crayon("#2e2530", 3, [[6, -8], [12, -12], [18, -8]]);
  crayon("#e0b040", 4, [[12, 2], [6, 20], [18, 20], [12, 2]]);
  crayon("#6a7280", 6, [[4, 28], [10, 28], [10, 34], [2, 34]]);
  crayon("#6a7280", 6, [[14, 28], [20, 28], [22, 34], [14, 34]]);
  g.restore();
}

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
  if (LANDSCAPE) wallDecor(g);
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
