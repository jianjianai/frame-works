// 城：暖光电影感的老城区。六层居民楼、防飘栏（窗外的铁笼）、空调外机、太阳能热水器、晾衣杆、电线、梧桐；
// 傍晚的太阳在左上方，斜着照进来：楼和街上有一道道斜的影子（楼缝里漏下来的光），影子是偏紫的暖灰，不压暗、不发黑；
// 空气里飘着发亮的浮尘（就是「灰」），越远的楼越淡、越暖，只剩剪影和几点亮着的窗；天顶是发光的「白」，下沿一圈肥皂泡似的彩光。
// 近处的东西和人物一样：深色描边、平涂、右下一道阴影。
// 坐标：世界单位和人物一样（人 s = 1 时 590 高），街面 y = 0，往上是负；远处的层按 D 投影（见 cam.ts）。

import { seeded } from "@frame/engine/math";
import { type Cam, H, W, applyCam, clamp01, toScreen, viewOf } from "./cam";

export const INK = "#2e2530";
/** 白的下沿（世界 y） */
export const Y_WHITE = -9200;

type P = [number, number];

// ——— 黄昏到夜（第二幕⑧：千斤一个人攥着栏杆等，太阳落下去，城里的窗一扇扇亮了） ———
// 只有⑧以后的镜头设（每帧开头 setDusk，画完 setDusk(0)），别的镜头都是 0，样子一点不变。
let DUSK = 0;
let LIGHTS = 0;
/** dark：天黑了多少（0 白天 → 0.4 傍晚最红 → 1 夜里）；lights：夜里亮起来的窗（0 → 1，一组组随机亮起来） */
export function setDusk(dark: number, lights = dark) {
  DUSK = clamp01(dark);
  LIGHTS = clamp01(lights);
}
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** 傍晚的暖（升起来又退掉）、夜（0 → 1） */
const sunsetK = () => ss(0, 0.4, DUSK) * (1 - ss(0.45, 0.95, DUSK));
const nightK = () => ss(0.3, 1, DUSK);
/** 白天的光（斜影子、光柱、浮尘）还剩多少 */
export const dayLeft = () => 1 - ss(0, 0.45, DUSK);
const mixRGB = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
/** 楼、人在黄昏、夜里蒙的一层色 [r, g, b, a]：傍晚偏暖的粉橙、夜里深的蓝紫；白天是 null */
export function duskTint(): number[] | null {
  if (DUSK <= 0.002) return null;
  const s = sunsetK();
  const n = nightK();
  const col = mixRGB([238, 128, 104], [26, 28, 76], n);
  return [...col.map(Math.round), 0.16 * s * (1 - n) + 0.64 * n];
}
const tintCss = (k: number[], scale = 1) => `rgba(${k[0]},${k[1]},${k[2]},${k[3] * scale})`;
const hexRGB = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** 一个颜色蒙上黄昏那层色以后（平涂的地面、远处只剩剪影的楼） */
function tinted(hex: string): string {
  const k = duskTint();
  if (!k) return hex;
  const c = mixRGB(hexRGB(hex), k, k[3]).map(Math.round);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
/** 夜里窗里的灯：大多暖黄，有的偏橙、有的偏白（按组） */
const NIGHT_LAMPS = ["#ffd58f", "#ffc779", "#fff0cf"];
/** 夜里会亮起来的窗分几组（每组同时亮；组按随机数排，所以满城的窗是一扇扇随机亮起来的） */
const NG = 14;
/** 夜里亮着的窗的比例 */
const NIGHT_SHARE = 0.56;

/**
 * 在当前坐标系里把 draw() 画的东西蒙上黄昏那层色（只蒙它自己：先画在一张小画布上，source-atop 填色，再贴回来；不用 filter，
 * 软件渲染时 filter 一帧要一秒）。box 是这些东西在当前坐标系里的范围 [x0, y0, x1, y1]；白天直接画。
 */
const TINT_CANVAS: { c: HTMLCanvasElement | null } = { c: null };
export function drawTinted(g: CanvasRenderingContext2D, box: [number, number, number, number], draw: (cc: CanvasRenderingContext2D) => void, scale = 1) {
  const k = duskTint();
  if (!k || k[3] * scale < 0.004) {
    draw(g);
    return;
  }
  const M = g.getTransform();
  const pts = [
    [box[0], box[1]],
    [box[2], box[1]],
    [box[0], box[3]],
    [box[2], box[3]],
  ].map(([x, y]) => M.transformPoint(new DOMPoint(x, y)));
  const cw = g.canvas.width;
  const ch = g.canvas.height;
  const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.x))));
  const y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.y))));
  const x1 = Math.min(cw, Math.ceil(Math.max(...pts.map((p) => p.x))));
  const y1 = Math.min(ch, Math.ceil(Math.max(...pts.map((p) => p.y))));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return;
  const cv = (TINT_CANVAS.c ??= document.createElement("canvas"));
  if (cv.width < w || cv.height < h) {
    cv.width = Math.max(cv.width, w);
    cv.height = Math.max(cv.height, h);
  }
  const bc = cv.getContext("2d")!;
  bc.setTransform(1, 0, 0, 1, 0, 0);
  bc.clearRect(0, 0, w, h);
  bc.setTransform(M.a, M.b, M.c, M.d, M.e - x0, M.f - y0);
  draw(bc);
  bc.setTransform(1, 0, 0, 1, 0, 0);
  bc.globalCompositeOperation = "source-atop";
  bc.fillStyle = tintCss(k, scale);
  bc.fillRect(0, 0, w, h);
  bc.globalCompositeOperation = "source-over";
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(cv, 0, 0, w, h, x0, y0, w, h);
  g.restore();
}

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

export const rectPath = (x: number, y: number, w: number, h: number) => {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
};

/** 往路径里加一个椭圆（先挪到它的起点：直接 ellipse 会从上一个点连一条直线过来） */
export function addEllipse(p: Path2D | CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rot = 0) {
  p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
  p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}

// ——— 小贴图（只做一次）———
function sprite(size: number, stops: [number, string][]) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return cv;
}
let GLOW: HTMLCanvasElement | null = null;
/** 一团暖光（用 lighter 叠：亮着的窗、路灯、人身上的光） */
export const glowSprite = () =>
  (GLOW ??= sprite(128, [
    [0, "rgba(255,226,170,1)"],
    [0.22, "rgba(255,210,150,0.55)"],
    [0.55, "rgba(255,190,140,0.16)"],
    [1, "rgba(255,180,140,0)"],
  ]));
let MOTE: HTMLCanvasElement | null = null;
export const moteSprite = () =>
  (MOTE ??= sprite(48, [
    [0, "rgba(255,250,236,1)"],
    [0.25, "rgba(255,240,215,0.75)"],
    [1, "rgba(255,236,210,0)"],
  ]));

/** 在 (x, y) 叠一团光，r 是半径（当前坐标系），a 透明度 */
export function drawGlow(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  if (a <= 0.003 || r <= 0) return;
  const op = g.globalCompositeOperation;
  const ga = g.globalAlpha;
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = Math.min(1, a);
  g.drawImage(glowSprite(), x - r, y - r, r * 2, r * 2);
  g.globalAlpha = ga;
  g.globalCompositeOperation = op;
}

// ——— 天：街上是暖的杏色，越往上越淡，最上面是白 ———
// 越往上越靠近光：空气是发亮的杏金色（不是白），白的边才亮得出来；白下面那一圈眩光在 drawWhite 里叠
const SKY: [number, number[]][] = [
  [0, [244, 197, 160]],
  [0.07, [247, 210, 176]],
  [0.2, [249, 221, 194]],
  [0.45, [250, 227, 204]],
  [0.75, [250, 224, 200]],
  [0.92, [249, 219, 194]],
  [1, [250, 222, 198]],
];
/** 傍晚：下面是橙粉，往上是粉紫，白下面一圈淡粉 */
const SKY_SUNSET: [number, number[]][] = [
  [0, [236, 150, 118]],
  [0.2, [240, 162, 134]],
  [0.45, [230, 160, 156]],
  [0.75, [214, 168, 186]],
  [0.92, [232, 204, 214]],
  [1, [246, 230, 230]],
];
/** 夜里：下面被城里的灯映成暗暗的紫红，往上是深蓝，白下面一圈冷的亮 */
const SKY_NIGHT: [number, number[]][] = [
  [0, [86, 60, 90]],
  [0.2, [62, 54, 100]],
  [0.45, [44, 48, 98]],
  [0.75, [52, 58, 114]],
  [0.92, [118, 118, 164]],
  [1, [210, 210, 230]],
];
function skyTab(tab: [number, number[]][], k: number): number[] {
  for (let i = 1; i < tab.length; i++) {
    if (k <= tab[i][0]) {
      const [a, ca] = tab[i - 1];
      const [b, cb] = tab[i];
      const u = (k - a) / (b - a);
      return ca.map((v, j) => v + (cb[j] - v) * u);
    }
  }
  return tab[tab.length - 1][1];
}
export function skyRGB(y: number): number[] {
  const k = clamp01(y / Y_WHITE);
  let c = k >= 1 ? [255, 255, 252] : skyTab(SKY, k);
  if (DUSK > 0.002) {
    c = mixRGB(c, skyTab(SKY_SUNSET, k), sunsetK());
    c = mixRGB(c, skyTab(SKY_NIGHT, k), nightK());
  }
  return c.map(Math.round);
}
export const skyAt = (y: number) => `rgb(${skyRGB(y).join(",")})`;

/** 天色（按人这一层的高度换算到画面上）；alpha < 1 时当作空气蒙在远处的楼上 */
export function drawSky(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, alpha = 1) {
  g.setTransform(base);
  // 画面转着时（副歌一转场），天的渐变跟着转：沿着世界里「往下」在画面上的方向
  const dx = -Math.sin(c.r || 0);
  const dy = Math.cos(c.r || 0);
  const L = (W / 2) * Math.abs(dx) + (H / 2) * Math.abs(dy);
  const gr = g.createLinearGradient(W / 2 - dx * L, H / 2 - dy * L, W / 2 + dx * L, H / 2 + dy * L);
  for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, skyAt(c.y + (-L + (2 * L * i) / 6) / c.z));
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
  /** 一楼是铺面（卷帘门、遮阳棚、招牌） */
  shop?: string;
  /** 楼顶只有女儿墙和水箱（不要天线、太阳能热水器：离镜头很近的矮房子，楼顶的东西会显得很大） */
  plainRoof?: boolean;
  /** 只在镜头拉开到整座城上时才从雾里浮出来（远处补的高楼：前奏街上的镜头里看不见它们，画面不变） */
  wide?: boolean;
  /** 后来在楼顶上加盖的层数：下面原来那些层的窗、花盆、晾衣杆一样不变（每层的随机数按原来的层号取） */
  topFloors?: number;
  /** [层, 第几扇]（0 是最上面一层、最左一扇）：这扇窗的防飘栏开着、玻璃不画（场景自己画窗里的屋子和开着的栏门） */
  openCage?: [number, number];
}

interface Laundry {
  x: number;
  y: number;
  len: number;
  items: { dx: number; kind: number; color: string; shade: string }[];
}
interface Geom {
  w: number;
  top: number;
  body: Path2D;
  slabs: Path2D;
  glass: Path2D;
  lit: Path2D;
  litAt: P[];
  sheen: Path2D;
  frames: Path2D;
  cageShadow: Path2D;
  cages: Path2D;
  bars: Path2D;
  shelves: Path2D;
  pots: Path2D;
  leaves: Path2D;
  acs: Path2D;
  fans: Path2D;
  drips: Path2D;
  laundry: Laundry[];
  roofFill: Path2D;
  roofLines: Path2D;
  solar: Path2D | null;
  solarTubes: Path2D | null;
  dots: Path2D;
  dotsLit: Path2D;
  shopFront: { x: number; w: number; awning: string; open: number }[];
  /** 夜里一组组亮起来的窗（玻璃、窗中心、远看的一格格窗） */
  nightLit: Path2D[];
  nightAt: P[][];
  nightDots: Path2D[];
  /** 开着防飘栏的那扇窗（楼自己的坐标） */
  special: { x: number; y: number; w: number; h: number } | null;
}
const GEOMS = new WeakMap<Block, Geom>();

const LAUNDRY = [
  ["#f3efe6", "#ddd7cb"],
  ["#c9705c", "#b35f4c"],
  ["#93b1c6", "#7f9db3"],
  ["#e8c76a", "#d4b258"],
  ["#d9d3c8", "#c4bdb1"],
  ["#7f93a8", "#6d8196"],
];

/** 楼的几何按楼自己的坐标算一次（一层 128 高、宽 w/u），画的时候缩放 u = fh/128 */
function geomOf(b: Block): Geom {
  const hit = GEOMS.get(b);
  if (hit) return hit;
  const u = b.fh / 128;
  const w = b.w / u;
  const top = -b.floors * 128 - 60;
  const r = seeded(b.seed);
  const body = rectPath(0, top, w, -top + 3000);
  const slabs = new Path2D();
  const glass = new Path2D();
  const lit = new Path2D();
  const litAt: P[] = [];
  const sheen = new Path2D();
  const frames = new Path2D();
  const cageShadow = new Path2D();
  const cages = new Path2D();
  const bars = new Path2D();
  const shelves = new Path2D();
  const pots = new Path2D();
  const leaves = new Path2D();
  const acs = new Path2D();
  const fans = new Path2D();
  const drips = new Path2D();
  const laundry: Laundry[] = [];
  const dots = new Path2D();
  const dotsLit = new Path2D();
  const nightLit = Array.from({ length: NG }, () => new Path2D());
  const nightAt: P[][] = Array.from({ length: NG }, () => []);
  const nightDots = Array.from({ length: NG }, () => new Path2D());
  // 夜里哪扇窗亮、什么时候亮：另一串随机数（不动原来那串，白天的窗、铁笼、花盆一样不变）
  const rn = seeded(b.seed * 7919 + 13);
  let special: Geom["special"] = null;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const floorsDrawn = b.shop ? b.floors - 1 : b.floors;
  for (let f = 0; f < b.floors; f++) {
    const y = top + 70 + f * 128;
    const rr = seeded(b.seed * 131 + (f - (b.topFloors ?? 0)) * 7);
    if (f > 0) {
      slabs.moveTo(0, y - 16);
      slabs.lineTo(w, y - 16);
    }
    for (let i = 0; i < units; i++) {
      const wx = 20 + uw * i + uw * 0.18;
      const ww = uw * 0.64;
      const wh = 74;
      const kind = rr();
      const isLit = rr() < 0.17;
      const open = !!b.openCage && b.openCage[0] === f && b.openCage[1] === i;
      const th = rn();
      const ng = !isLit && !open && th < NIGHT_SHARE ? Math.min(NG - 1, Math.floor((th / NIGHT_SHARE) * NG)) : -1;
      // 远看只剩一格格窗
      (isLit ? dotsLit : dots).rect(wx, y, ww, wh);
      if (ng >= 0) nightDots[ng].rect(wx, y, ww, wh);
      if (f >= floorsDrawn) continue;
      if (open) special = { x: wx, y, w: ww, h: wh };
      else (isLit ? lit : glass).rect(wx, y, ww, wh);
      if (ng >= 0) {
        nightLit[ng].rect(wx, y, ww, wh);
        nightAt[ng].push([wx + ww / 2, y + wh / 2]);
      }
      if (isLit) litAt.push([wx + ww / 2, y + wh / 2]);
      else if (!open) {
        // 玻璃上一道斜的反光
        sheen.moveTo(wx + ww * 0.12, y + wh);
        sheen.lineTo(wx + ww * 0.42, y);
        sheen.lineTo(wx + ww * 0.62, y);
        sheen.lineTo(wx + ww * 0.32, y + wh);
        sheen.closePath();
      }
      frames.rect(wx - 4, y - 4, ww + 8, wh + 8);
      // 防飘栏：凸出来的铁笼，底下一块托板，影子落在右下的墙上
      if (kind < 0.72) {
        // （开着的那扇：铁笼的门打开了，前面的栏杆由场景画；托板和花盆照旧）
        if (!open) {
          cageShadow.rect(wx - 8 + 12, y - 8 + 12, ww + 16, wh + 22);
          cages.rect(wx - 8, y - 8, ww + 16, wh + 22);
          for (let k = 1; k < 6; k++) {
            const bx = wx - 8 + ((ww + 16) * k) / 6;
            bars.moveTo(bx, y - 8);
            bars.lineTo(bx, y + wh + 14);
          }
          bars.moveTo(wx - 8, y + wh * 0.45);
          bars.lineTo(wx + ww + 8, y + wh * 0.45);
        }
        shelves.rect(wx - 12, y + wh + 12, ww + 24, 10);
        if (rr() < 0.5) {
          const px = wx + 4 + rr() * (ww - 40);
          const more = rr() < 0.5;
          // （开着的那扇不放花盆：叶子会被窗里画的屋子盖住，只剩一个空盆；随机数照样取，别的窗不变）
          if (!open) {
            pots.moveTo(px, y + wh + 12);
            pots.lineTo(px + 28, y + wh + 12);
            pots.lineTo(px + 24, y + wh - 12);
            pots.lineTo(px + 4, y + wh - 12);
            pots.closePath();
            // 一丛：三团叶子挤在一起（单独一个圆像棒棒糖）
            const lx = px + 14;
            const ly = y + wh - 20;
            addEllipse(leaves, lx - 11, ly - 4, 13, 9, -0.6);
            addEllipse(leaves, lx + 11, ly - 5, 13, 9, 0.6);
            addEllipse(leaves, lx, ly - 15, 11, 12, 0);
            if (more) addEllipse(leaves, lx + 22, ly - 18, 9, 7, 0.9);
          }
        }
      }
      // 空调外机：底下拖一道锈水印
      if (kind > 0.55 && i === units - 1) {
        const ax = wx + ww + 14;
        acs.rect(ax, y + 26, 60, 44);
        fans.moveTo(ax + 45 + 14, y + 48);
        fans.arc(ax + 45, y + 48, 14, 0, Math.PI * 2);
        fans.moveTo(ax + 8, y + 34);
        fans.lineTo(ax + 24, y + 34);
        fans.moveTo(ax + 8, y + 42);
        fans.lineTo(ax + 24, y + 42);
        drips.rect(ax + 10, y + 70, 5, 40 + rr() * 50);
      }
      // 晾衣杆：伸出窗外，挂着衣服
      if (kind > 0.8 && i < units - 1) {
        const items: Laundry["items"] = [];
        const n = 2 + Math.floor(rr() * 2);
        for (let k = 0; k < n; k++) {
          const c = LAUNDRY[Math.floor(rr() * LAUNDRY.length)];
          items.push({ dx: 16 + k * 36, kind: Math.floor(rr() * 3), color: c[0], shade: c[1] });
        }
        laundry.push({ x: wx + ww, y: y - 2, len: 40 + n * 36, items });
      }
    }
  }
  // 楼顶：女儿墙、水箱、天线，有的楼顶有太阳能热水器
  const roofFill = new Path2D();
  const roofLines = new Path2D();
  roofFill.rect(-6, top - 18, w + 12, 20);
  const tx = w * (0.12 + r() * 0.4);
  roofFill.rect(tx, top - 86, 96, 68);
  roofFill.rect(tx + 10, top - 96, 76, 12);
  if (r() < 0.6 && !b.plainRoof) {
    const ax = w * (0.6 + r() * 0.3);
    roofLines.moveTo(ax, top - 18);
    roofLines.lineTo(ax, top - 210);
    roofLines.moveTo(ax - 34, top - 170);
    roofLines.lineTo(ax + 34, top - 166);
    roofLines.moveTo(ax - 24, top - 140);
    roofLines.lineTo(ax + 24, top - 137);
  }
  let solar: Path2D | null = null;
  let solarTubes: Path2D | null = null;
  if (r() < 0.55 && !b.plainRoof) {
    const sx = w * (0.5 + r() * 0.25);
    solar = new Path2D();
    solar.moveTo(sx, top - 18);
    solar.lineTo(sx + 40, top - 110);
    solar.lineTo(sx + 170, top - 110);
    solar.lineTo(sx + 130, top - 18);
    solar.closePath();
    solarTubes = new Path2D();
    for (let k = 1; k < 7; k++) {
      const q = k / 7;
      solarTubes.moveTo(sx + 130 * q, top - 18);
      solarTubes.lineTo(sx + 40 + 130 * q, top - 110);
    }
    solarTubes.moveTo(sx + 40, top - 118);
    solarTubes.lineTo(sx + 170, top - 118);
  }
  const shopFront: Geom["shopFront"] = [];
  if (b.shop) {
    const n = Math.max(1, Math.round(w / 300));
    const sw = w / n;
    for (let k = 0; k < n; k++) shopFront.push({ x: k * sw + 14, w: sw - 28, awning: k % 2 ? b.shop : "#6f8f86", open: r() });
  }
  const geom: Geom = {
    w,
    top,
    body,
    slabs,
    glass,
    lit,
    litAt,
    sheen,
    frames,
    cageShadow,
    cages,
    bars,
    shelves,
    pots,
    leaves,
    acs,
    fans,
    drips,
    laundry,
    roofFill,
    roofLines,
    solar,
    solarTubes,
    dots,
    dotsLit,
    shopFront,
    nightLit,
    nightAt,
    nightDots,
    special,
  };
  GEOMS.set(b, geom);
  return geom;
}

/** 开场前把所有楼的几何算好（第一次画到时才算的话，镜头拉出全城那一下会卡住） */
export function prepareCity() {
  for (const L of LAYERS) for (const b of L.blocks) geomOf(b);
  geomOf(TOWER);
  geomOf(TOWER_HOME);
  for (const b of STREET) geomOf(b);
  geomOf(QJ_HOME);
}

/** 一件晾着的衣服（衣架坐标：挂在 (0,0)，往下垂），sway 被风吹的角度 */
function cloth(g: CanvasRenderingContext2D, kind: number, color: string, shade: string, sway: number, L: number) {
  const p = new Path2D();
  if (kind === 0) {
    // 短袖衫
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
    // 裤子
    p.moveTo(-13, 0);
    p.lineTo(13, 0);
    p.lineTo(14, 58);
    p.lineTo(3, 58);
    p.lineTo(0, 16);
    p.lineTo(-3, 58);
    p.lineTo(-14, 58);
    p.closePath();
  } else {
    // 毛巾
    p.rect(-12, 0, 24, 40);
  }
  g.save();
  g.rotate(sway);
  part(g, p, color, shade, L * 0.6, [3, 3]);
  g.restore();
}

/**
 * 一栋老居民楼（层坐标，地面 y = 0）。detail：0 只有剪影和窗影，1 描边和窗，2 全部细节；按画面上一层有多高自动降细节。
 * t：时间（晾的衣服被风吹）。
 */
export function drawBlock(g: CanvasRenderingContext2D, b: Block, c: Cam, D: number, detail: number, lw: number, t = 0) {
  const u = b.fh / 128;
  const s = c.z / D;
  const px = b.fh * s;
  if (px < 60) detail = Math.min(detail, 1);
  if (px < 16) detail = 0;
  const G = geomOf(b);
  g.save();
  g.translate(b.x, 0);
  g.scale(u, u);
  const L = lw / u;
  if (detail === 0) {
    g.fillStyle = tinted(b.wall);
    g.fill(G.body);
    g.fill(G.roofFill);
    if (px > 6) {
      g.fillStyle = DUSK > 0.002 ? `rgba(34,30,66,${0.22 + 0.22 * nightK()})` : "rgba(140,96,104,0.22)";
      g.fill(G.dots);
      g.fillStyle = "rgba(255,214,150,0.85)";
      g.fill(G.dotsLit);
      const on = nightOn();
      for (let i = 0; i < on; i++) {
        g.fillStyle = NIGHT_LAMPS[i % 3];
        g.fill(G.nightDots[i]);
      }
    }
    g.restore();
    return;
  }
  // 楼身：右下落一块影子在后面的楼上
  g.save();
  g.translate(14 / (s * u), 10 / (s * u));
  g.fillStyle = "rgba(110,64,80,0.14)";
  g.fill(G.body);
  g.restore();
  g.fillStyle = b.wall;
  g.fill(G.body);
  // 光：左上亮、右下暗（像有体积）
  const shade = g.createLinearGradient(0, G.top, G.w, 0);
  shade.addColorStop(0, "rgba(255,244,222,0.30)");
  shade.addColorStop(0.45, "rgba(255,244,222,0)");
  shade.addColorStop(1, "rgba(120,72,96,0.14)");
  g.fillStyle = shade;
  g.fill(G.body);
  // 楼顶
  g.fillStyle = b.wallShade;
  g.fill(G.roofFill);
  if (detail > 1 && G.solar && G.solarTubes) {
    g.fillStyle = "#7f8fa6";
    g.fill(G.solar);
    g.strokeStyle = "rgba(230,236,245,0.7)";
    g.lineWidth = L * 0.6;
    g.stroke(G.solarTubes);
    g.strokeStyle = INK;
    g.lineWidth = L * 0.8;
    g.stroke(G.solar);
  }
  g.strokeStyle = INK;
  g.lineWidth = L * 0.8;
  g.stroke(G.roofFill);
  g.stroke(G.roofLines);
  if (detail === 1) {
    g.fillStyle = "#7d8597";
    g.fill(G.glass);
    g.fillStyle = "#ffd99a";
    g.fill(G.lit);
    g.strokeStyle = INK;
    g.lineWidth = L * 0.6;
    g.stroke(G.cages);
    duskOver(g, G, L, false);
    g.strokeStyle = INK;
    g.lineWidth = L;
    g.stroke(G.body);
    g.restore();
    return;
  }
  // 楼层之间一道线
  g.strokeStyle = "rgba(60,40,50,0.16)";
  g.lineWidth = L * 0.7;
  g.stroke(G.slabs);
  // 锈水印
  g.fillStyle = "rgba(140,92,70,0.16)";
  g.fill(G.drips);
  // 窗：深色玻璃上一道斜的反光；亮着的窗是暖黄的
  g.fillStyle = "#5f6a7f";
  g.fill(G.glass);
  g.fillStyle = "rgba(196,206,222,0.28)";
  g.fill(G.sheen);
  g.fillStyle = "#ffd896";
  g.fill(G.lit);
  g.strokeStyle = "#f1e8db";
  g.lineWidth = L * 1.6;
  g.stroke(G.frames);
  g.strokeStyle = INK;
  g.lineWidth = L * 0.6;
  g.stroke(G.frames);
  // 防飘栏
  g.fillStyle = "rgba(100,58,76,0.16)";
  g.fill(G.cageShadow);
  g.strokeStyle = INK;
  g.lineWidth = L * 0.95;
  g.stroke(G.cages);
  g.lineWidth = L * 0.55;
  g.stroke(G.bars);
  part(g, G.shelves, "#b3a9a3", null, L * 0.7);
  // 花盆
  part(g, G.pots, "#c4775a", null, L * 0.6);
  part(g, G.leaves, "#7f9b5c", "#69844b", L * 0.6, [4, 3]);
  // 空调外机
  part(g, G.acs, "#ece7df", "#d6cfc4", L * 0.8, [4, 4]);
  g.strokeStyle = INK;
  g.lineWidth = L * 0.5;
  g.stroke(G.fans);
  // 晾衣杆、衣服（被风吹）
  for (const ln of G.laundry) {
    g.strokeStyle = INK;
    g.lineWidth = L * 1.4;
    g.beginPath();
    g.moveTo(ln.x, ln.y);
    g.lineTo(ln.x + ln.len, ln.y - 6);
    g.stroke();
    g.strokeStyle = "#c8beb2";
    g.lineWidth = L * 0.7;
    g.stroke();
    for (const it of ln.items) {
      g.save();
      g.translate(ln.x + it.dx, ln.y - (6 * it.dx) / ln.len);
      cloth(g, it.kind, it.color, it.shade, 0.1 + 0.07 * Math.sin(t * 1.7 + it.dx * 0.13 + b.seed), L);
      g.restore();
    }
  }
  // 一楼的铺面：卷帘门、门里的暖光、遮阳棚
  for (const sf of G.shopFront) {
    const y0 = -150;
    const inner = rectPath(sf.x, y0 + 22, sf.w, -y0 - 22);
    g.fillStyle = "#4e4048";
    g.fill(inner);
    // 屋里亮着灯
    g.fillStyle = "rgba(255,200,130,0.55)";
    g.fillRect(sf.x + 6, y0 + 22 + (-y0 - 22) * (1 - sf.open) * 0.55, sf.w - 12, (-y0 - 22) * 0.5);
    // 卷帘拉下来一半
    const sh = (-y0 - 22) * (0.25 + 0.4 * (1 - sf.open));
    g.fillStyle = "#b9b4ae";
    g.fillRect(sf.x, y0 + 22, sf.w, sh);
    g.strokeStyle = "rgba(60,50,56,0.35)";
    g.lineWidth = L * 0.5;
    g.beginPath();
    for (let yy = y0 + 30; yy < y0 + 22 + sh; yy += 9) {
      g.moveTo(sf.x, yy);
      g.lineTo(sf.x + sf.w, yy);
    }
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = L * 0.8;
    g.stroke(inner);
    // 遮阳棚
    const aw = new Path2D();
    aw.moveTo(sf.x - 10, y0 + 8);
    aw.lineTo(sf.x + sf.w + 10, y0 + 8);
    aw.lineTo(sf.x + sf.w + 24, y0 + 40);
    aw.lineTo(sf.x - 24, y0 + 40);
    aw.closePath();
    part(g, aw, sf.awning, null, L * 0.8);
    g.save();
    g.clip(aw);
    g.fillStyle = "rgba(255,250,240,0.55)";
    for (let xx = sf.x - 24; xx < sf.x + sf.w + 24; xx += 36) g.fillRect(xx, y0, 16, 50);
    g.restore();
  }
  duskOver(g, G, L, true);
  g.strokeStyle = INK;
  g.lineWidth = L;
  g.stroke(G.body);
  g.restore();
}

/** 夜里亮起来了几组窗 */
const nightOn = () => (DUSK > 0.002 ? Math.min(NG, Math.floor(LIGHTS * NG + 1e-6)) : 0);
/** 黄昏、夜里：整栋楼蒙上那层色，再把亮着的窗（白天就亮着的、夜里一组组亮起来的）重新点亮，铁栏杆压在窗上 */
function duskOver(g: CanvasRenderingContext2D, G: Geom, L: number, bars: boolean) {
  const k = duskTint();
  if (!k) return;
  g.fillStyle = tintCss(k);
  g.fill(G.body);
  g.fill(G.roofFill);
  if (G.solar) g.fill(G.solar);
  g.fillStyle = "#ffd896";
  g.fill(G.lit);
  const on = nightOn();
  for (let i = 0; i < on; i++) {
    g.fillStyle = NIGHT_LAMPS[i % 3];
    g.fill(G.nightLit[i]);
  }
  if (bars) {
    g.strokeStyle = INK;
    g.lineWidth = L * 0.55;
    g.stroke(G.bars);
  }
}

/** 亮着的窗冒出一团暖光（画在空气后面也行：远的楼窗光就是一个个小暖点） */
export function drawBlockGlow(g: CanvasRenderingContext2D, b: Block, c: Cam, D: number, a = 1) {
  const s = c.z / D;
  if (b.fh * s < 34) return;
  const G = geomOf(b);
  const u = b.fh / 128;
  const v = viewOf(c, D);
  // 天黑了窗光显得更亮
  const al = 0.45 * a * (1 + 0.7 * nightK());
  const glow = ([x, y]: P) => {
    const wx = b.x + x * u;
    const wy = y * u;
    if (wx < v.x0 || wx > v.x1 || wy < v.y0 || wy > v.y1) return;
    drawGlow(g, wx, wy, 90 * u, al);
  };
  for (const p of G.litAt) glow(p);
  const on = nightOn();
  for (let i = 0; i < on; i++) for (const p of G.nightAt[i]) glow(p);
}

/** 开着防飘栏的那扇窗在世界里的位置（玻璃的范围） */
export function specialWindow(b: Block): { x: number; y: number; w: number; h: number } | null {
  const sp = geomOf(b).special;
  if (!sp) return null;
  const u = b.fh / 128;
  return { x: b.x + sp.x * u, y: sp.y * u, w: sp.w * u, h: sp.h * u };
}

interface Layer {
  D: number;
  haze: number;
  detail: number;
  lw: number;
  ground: string;
  blocks: Block[];
}

function row(seed: number, x0: number, x1: number, wMin: number, wMax: number, fMin: number, fMax: number, fh: number, walls: [string, string][], gaps: [number, number][] = [], shop?: string[]): Block[] {
  const r = seeded(seed);
  const out: Block[] = [];
  for (let x = x0; x < x1; ) {
    const w = wMin + r() * (wMax - wMin);
    const [wall, wallShade] = walls[Math.floor(r() * walls.length)];
    const b: Block = { x, w, floors: fMin + Math.floor(r() * (fMax - fMin + 1)), wall, wallShade, seed: Math.floor(r() * 9999), fh };
    if (shop && r() < 0.75) b.shop = shop[Math.floor(r() * shop.length)];
    if (!gaps.some(([a, c]) => b.x + b.w > a && b.x < c)) out.push(b);
    x += w + 30 + r() * 90;
  }
  return out;
}

export const LAYERS: Layer[] = [
  { D: 4, haze: 0.5, detail: 0, lw: 0, ground: "#e0c2b2", blocks: row(11, -14000, 14000, 500, 900, 8, 19, 190, [["#ead2c3", "#dfc4b6"], ["#e8d6c6", "#dccabb"], ["#e4cdc6", "#d8c0b9"]]) },
  {
    D: 2.2,
    haze: 0.26,
    detail: 1,
    lw: 2.4,
    ground: "#d3b7a8",
    blocks: row(12, -9000, 9000, 420, 760, 6, 13, 190, [["#dcb6a4", "#cfa796"], ["#e2c2aa", "#d5b29a"], ["#d8b8ae", "#cba99f"], ["#e4cba0", "#d6ba8e"]]),
  },
  {
    D: 1.5,
    haze: 0.05,
    detail: 2,
    lw: 3.2,
    ground: "#c9b3a2",
    blocks: row(
      14,
      -6200,
      6200,
      380,
      620,
      5,
      9,
      190,
      [["#efd8b8", "#e1c6a2"], ["#e7ac92", "#d6987e"], ["#ecd09a", "#dcbd84"], ["#e3b2a4", "#d39f91"], ["#d2d0b2", "#c2bf9f"], ["#dcc5b6", "#cdb3a3"]],
      [[-430, 520]],
      ["#c96a52", "#d9a441", "#6f8f86", "#9b6a8a"],
    ),
  },
];

// 远处高低错落的高楼（用户 2026-10-19：全城那个画面「中间有点空」）：远处两层城里各插几栋高的，天际线有起伏，城占的画面高一点。
// 都比最高那栋楼矮得多（远处的层被透视压小）；街上的镜头里它们藏在近处的楼后面
{
  const far: [number, number, number, number][] = [
    // x、宽、层数、墙色的序号
    [-9300, 460, 34, 0],
    [-6900, 400, 28, 1],
    [-5500, 520, 38, 2],
    [-2700, 420, 30, 1],
    [900, 480, 36, 0],
    [3300, 400, 27, 2],
    [5600, 520, 33, 1],
    [8100, 440, 40, 0],
    [10900, 420, 29, 2],
  ];
  const walls: [string, string][] = [
    ["#ead2c3", "#dfc4b6"],
    ["#e8d6c6", "#dccabb"],
    ["#e4cdc6", "#d8c0b9"],
  ];
  far.forEach(([x, w, floors, k], i) => LAYERS[0].blocks.push({ x, w, floors, fh: 190, wall: walls[k][0], wallShade: walls[k][1], seed: 900 + i, wide: true }));
  const mid: [number, number, number][] = [
    [-7200, 440, 19],
    [-4000, 400, 17],
    [2300, 460, 21],
    [5400, 420, 16],
    [7700, 480, 18],
  ];
  mid.forEach(([x, w, floors], i) => LAYERS[1].blocks.push({ x, w, floors, fh: 190, wall: ["#dcb6a4", "#e2c2aa", "#d8b8ae"][i % 3], wallShade: ["#cfa796", "#d5b29a", "#cba99f"][i % 3], seed: 950 + i, wide: true }));
}

/**
 * 全城最高那栋楼（和人在同一层）：一栋三十层的老塔楼，楼顶差一点碰到白，她住在顶层，楼脚下是哑铃店。
 * 在她往前走的方向（左边）：前奏里她救完人往家走，16 秒走到 −2370，楼就在她前面（用户 2026-10-19：「这栋楼不是主角的家，
 * 主角的家应该在主角向前走的位置，在左边」；原来在她跑来的那边 430–1410）。
 */
export const TOWER: Block = { x: -3700, w: 980, floors: 28, wall: "#f1e1c6", wallShade: "#e0ccac", seed: 77, fh: 300 };
/**
 * 第二幕里的最高那栋楼：沉沉家（顶层最左那扇，离千斤家最近）的防飘栏开着——她穿着铁靴，用不着（故事里后来小石头替她关上）。
 * 只在第二幕用（第一幕全城那个镜头里还是 TOWER，远得看不出来）；窗里的屋子、开着的栏门在 lib/night.ts 画。
 */
export const TOWER_HOME: Block = { ...TOWER, openCage: [0, 0] };

/**
 * 街这一边（和人在同一层）的一排老居民楼：最高那栋楼原来的位置换成一栋普通的大窗户老楼（前奏里她刹车、跳起来时身后还是它的下半截），
 * 往右一路补齐到她跑来的方向；左边最高那栋楼的后面再接两栋。老钟家和它旁边的小铺子、五层楼在 scenes/act1.ts（跟着老钟的窗算）。
 * 救周磊的那一块（−885…430）留空：那是个路口，前奏里那几个镜头身后是对面的街和城（用户 2026-10-19：「把地图的房子也补一下」）。
 */
export const STREET: Block[] = [
  { x: 430, w: 980, floors: 7, wall: "#f1e1c6", wallShade: "#e0ccac", seed: 77, fh: 300 },
  { x: 1470, w: 560, floors: 6, wall: "#e9c3a8", wallShade: "#dbb195", seed: 401, fh: 230, shop: "#c96a52" },
  { x: 2090, w: 660, floors: 8, wall: "#e2d3b0", wallShade: "#d3c29c", seed: 402, fh: 215 },
  { x: 2810, w: 520, floors: 5, wall: "#e6b39d", wallShade: "#d69f88", seed: 403, fh: 240, shop: "#6f8f86" },
  { x: 3390, w: 700, floors: 7, wall: "#ecd5a6", wallShade: "#dcc290", seed: 404, fh: 220, shop: "#d9a441" },
  { x: -6140, w: 680, floors: 6, wall: "#ecd5a6", wallShade: "#dcc290", seed: 313, fh: 220, shop: "#d9a441" },
  { x: -6740, w: 540, floors: 4, wall: "#dcc5b6", wallShade: "#cdb3a3", seed: 314, fh: 240 },
];

/**
 * 千斤家那栋楼：最高那栋楼左边，隔一条宽巷子（−4660…−3700）的一栋三十层老楼（楼顶 −7922，比最高那栋楼矮 620）。一楼是她家（门口一根拴人的铁桩），
 * 她从门口飘起来、顺着巷子飘到最高那栋楼旁边的高空；沉沉从楼顶扑出去抱住她，两个人在天上慢慢往左飘，落在这栋楼的楼顶上。
 * 原来二十层，用户 2026-10-19 要「左边房子加高一点」：上面加盖十层（topFloors），下面二十层一样不变。
 * 巷子原来 360 宽，2026-10-24 用户要「两栋楼的间隙改得远一点，让他们在空中慢慢下落飘得远一点」：这栋楼和左边两栋一起往左挪 600。
 * （2026-10-24 试过降三层让⑦ 抱着往下沉得多一点，用户：「左边的房子太矮了，应该是抱住之后在中间慢慢飘过去，把房子变矮速度感就提升了，这样不行」——
 * 楼顶就在这个高度，⑦ 抱住以后在巷子中间几乎平着慢慢飘过去，快到楼顶才斜着滑下来。）
 * 楼顶不放天线（plainRoof）：⑦ 两个人就站在楼顶上，天线正好立在沉沉身后，细线像一个准星。
 */
export const QJ_HOME: Block = { x: -5400, w: 740, floors: 30, topFloors: 10, wall: "#e6cbb0", wallShade: "#d7b99b", seed: 406, fh: 260, plainRoof: true };

// ——— 斜照的光：楼缝里漏下来的阳光，在楼面和地上落成一道道斜的影子（影子偏紫的暖灰，用 multiply，不发黑） ———
const BAND_SLOPE = 0.62;
/** 每一层自己的影子带（层坐标里固定，镜头动时有视差） */
function bandsOf(D: number): [number, number][] {
  const r = seeded(Math.round(D * 100) + 7);
  const out: [number, number][] = [];
  for (let x = -16000; x < 16000; ) {
    const w = 380 + r() * 700;
    out.push([x, w]);
    x += w + 420 + r() * 1100;
  }
  return out;
}
const BANDS = new Map<number, [number, number][]>();
export function drawLightBands(g: CanvasRenderingContext2D, c: Cam, D: number, clip: Path2D | null, strength = 1) {
  strength *= dayLeft();
  if (strength <= 0.01) return;
  let bands = BANDS.get(D);
  if (!bands) BANDS.set(D, (bands = bandsOf(D)));
  const v = viewOf(c, D, 1.1);
  const nx = 1 / Math.hypot(1, BAND_SLOPE);
  const ny = -BAND_SLOPE * nx;
  g.save();
  if (clip) g.clip(clip);
  g.globalCompositeOperation = "multiply";
  for (const [x0, w] of bands) {
    // 带子在可见范围里吗（带子是斜的：上面往左偏）
    const xa = x0 + BAND_SLOPE * v.y0;
    const xb = x0 + w + BAND_SLOPE * v.y1;
    if (xb < v.x0 || xa > v.x1) continue;
    const span = w * nx;
    const gr = g.createLinearGradient(x0, 0, x0 + nx * span, ny * span);
    const col = (a: number) => `rgba(176,128,150,${a * strength})`;
    gr.addColorStop(0, col(0));
    gr.addColorStop(0.16, col(0.5));
    gr.addColorStop(0.84, col(0.5));
    gr.addColorStop(1, col(0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x0 + BAND_SLOPE * v.y0 - 40, v.y0);
    g.lineTo(x0 + w + BAND_SLOPE * v.y0 + 40, v.y0);
    g.lineTo(x0 + w + BAND_SLOPE * v.y1 + 40, v.y1);
    g.lineTo(x0 + BAND_SLOPE * v.y1 - 40, v.y1);
    g.closePath();
    g.fill();
  }
  g.restore();
}

// ——— 梧桐、电线杆、电线（D = 1.25，对面人行道上） ———
export const TREES = [-2900, -1500, 380, 1700, 3100];
const POLES = [-420, 1250, -2300, 3000, -4200];
const ST_D = 1.25;

/** 梧桐的季节：夏天绿叶（街上原来的样子）、秋天黄叶（间奏的公交站）、冬天光秃秃的只剩枝杈（间奏的学校门口） */
export type TreeLook = "green" | "autumn" | "bare";
const CANOPY: Record<"green" | "autumn", { base: string; mid: string; lit: string; dapple: string }> = {
  green: { base: "#6f8c4d", mid: "#86a35a", lit: "rgba(214,222,128,0.75)", dapple: "rgba(70,96,52,0.35)" },
  autumn: { base: "#c98a34", mid: "#dfa748", lit: "rgba(255,226,142,0.8)", dapple: "rgba(150,88,38,0.32)" },
};
export function planeTree(g: CanvasRenderingContext2D, x: number, t: number, lw: number, seed: number, px = 1, look: TreeLook = "green") {
  const s = 1.4;
  // 画面上很小的时候不画树皮的斑、叶子的碎影
  const fine = px > 0.45;
  const r = seeded(seed);
  const trunk = new Path2D();
  trunk.moveTo(x - 18 * s, 40);
  trunk.lineTo(x - 11 * s, -300 * s);
  trunk.lineTo(x - 54 * s, -430 * s);
  trunk.lineTo(x - 36 * s, -440 * s);
  trunk.lineTo(x + 2 * s, -336 * s);
  trunk.lineTo(x + 42 * s, -452 * s);
  trunk.lineTo(x + 58 * s, -440 * s);
  trunk.lineTo(x + 15 * s, -300 * s);
  trunk.lineTo(x + 20 * s, 40);
  trunk.closePath();
  part(g, trunk, "#c2ad94", "#a48f78", lw, [7, 5]);
  // 梧桐的树皮：一块块浅色斑
  if (fine) {
    g.save();
    g.clip(trunk);
    g.fillStyle = "rgba(240,230,210,0.55)";
    g.beginPath();
    for (let i = 0; i < 9; i++) addEllipse(g, x + (r() - 0.5) * 26 * s, -r() * 420 * s, 8 + r() * 9, 14 + r() * 16);
    g.fill();
    g.fillStyle = "rgba(120,98,82,0.35)";
    g.beginPath();
    for (let i = 0; i < 6; i++) addEllipse(g, x + (r() - 0.5) * 26 * s, -r() * 420 * s, 5 + r() * 6, 10 + r() * 10);
    g.fill();
    g.restore();
  }
  // 树冠：几团，左上被太阳照亮，右下暗
  const blobs: [number, number, number][] = [
    [-150, -520, 120],
    [10, -610, 145],
    [150, -510, 118],
    [-60, -440, 112],
    [90, -430, 104],
    [-200, -430, 80],
    [220, -440, 84],
  ];
  const sway = 5 * Math.sin(t * 0.8 + x * 0.01);
  const canopy = new Path2D();
  const lights: [number, number, number][] = [];
  for (const [bx, by, rad] of blobs) {
    const n = 10;
    const cx = x + bx * s + sway * (0.6 + rad / 300);
    const cy = by * s;
    const R = rad * s;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = R * (0.88 + 0.14 * Math.sin(i * 2.7 + bx));
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.82;
      if (i === 0) canopy.moveTo(px, py);
      else canopy.quadraticCurveTo(cx + Math.cos(a - Math.PI / n) * rr * 1.16, cy + Math.sin(a - Math.PI / n) * rr * 0.96, px, py);
    }
    canopy.closePath();
    lights.push([cx, cy, R]);
  }
  if (look === "bare") {
    bareCrown(g, x, s, lw, seed, t);
    return;
  }
  const pal = CANOPY[look];
  g.strokeStyle = INK;
  g.lineWidth = lw * 2;
  g.lineJoin = "round";
  g.stroke(canopy);
  g.fillStyle = pal.base;
  g.fill(canopy);
  g.save();
  g.clip(canopy);
  // 中间调
  g.fillStyle = pal.mid;
  for (const [cx, cy, R] of lights) {
    g.beginPath();
    g.ellipse(cx - R * 0.18, cy - R * 0.16, R * 0.78, R * 0.62, 0, 0, Math.PI * 2);
    g.fill();
  }
  // 被太阳照亮的那一侧
  g.fillStyle = pal.lit;
  for (const [cx, cy, R] of lights) {
    g.beginPath();
    g.ellipse(cx - R * 0.42, cy - R * 0.4, R * 0.42, R * 0.3, -0.4, 0, Math.PI * 2);
    g.fill();
  }
  // 叶子的小碎影
  g.fillStyle = pal.dapple;
  if (fine) for (const [cx, cy, R] of lights) {
    for (let k = 0; k < 4; k++) {
      const a = k * 1.7 + cx * 0.01;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * R * 0.5 + R * 0.2, cy + Math.sin(a) * R * 0.4 + R * 0.25, R * 0.16, R * 0.1, a, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

/** 冬天的梧桐：树干分出来的两根大杈接着往上分枝（三层，一层比一层细），枝梢在风里轻轻晃 */
function bareCrown(g: CanvasRenderingContext2D, x: number, s: number, lw: number, seed: number, t: number) {
  const r = seeded(seed + 101);
  const segs: [number, number, number, number, number][] = [];
  const grow = (x0: number, y0: number, ang: number, len: number, w: number, depth: number) => {
    const sway = depth >= 2 ? 0.03 * Math.sin(t * 0.9 + x0 * 0.01 + depth) : 0;
    const a = ang + sway;
    const x1 = x0 + Math.sin(a) * len;
    const y1 = y0 - Math.cos(a) * len;
    segs.push([x0, y0, x1, y1, w]);
    if (depth >= 3) return;
    const n = depth === 0 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.5 + r() * 0.25) + (r() - 0.5) * 0.2;
      grow(x1, y1, a + spread, len * (0.62 + r() * 0.16), w * 0.62, depth + 1);
    }
  };
  // 树干分出来的两根大杈（和夏天的树干同一个形状）的顶端
  grow(x - 45 * s, -435 * s, -0.42, 150 * s, 13 * s, 0);
  grow(x + 50 * s, -446 * s, 0.38, 160 * s, 13 * s, 0);
  grow(x + 2 * s, -336 * s, 0.05, 210 * s, 12 * s, 1);
  g.save();
  g.lineCap = "round";
  g.strokeStyle = INK;
  for (const [x0, y0, x1, y1, w] of segs) {
    g.lineWidth = w + lw * 1.4;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }
  g.strokeStyle = "#b29c84";
  for (const [x0, y0, x1, y1, w] of segs) {
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }
  g.restore();
}

function drawStreetLife(g: CanvasRenderingContext2D, c: Cam, t: number, trees: TreeLook | "none" = "green") {
  const v = viewOf(c, ST_D);
  const lw = 3.2;
  const poles = [...POLES].sort((a, b) => a - b);
  // 电线：相邻两根杆之间垂下来的弧，上面停着几只麻雀
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  for (let i = 0; i + 1 < poles.length; i++) {
    const a = poles[i];
    const b = poles[i + 1];
    if (b < v.x0 || a > v.x1) continue;
    for (const [dy, sag] of [[0, 150], [12, 230], [44, 120]] as const) {
      g.beginPath();
      g.moveTo(a, -1180 + dy);
      g.quadraticCurveTo((a + b) / 2, -1180 + dy + sag * 2, b, -1180 + dy);
      g.stroke();
    }
    // 麻雀：停在最上面那根线上（二次曲线 y = -1180 + 2·sag·u(1−u)·2，sag 150）
    const r = seeded(i * 31 + 5);
    g.fillStyle = INK;
    for (let k = 0; k < 3; k++) {
      const u = 0.2 + r() * 0.6;
      const bx = a + (b - a) * u;
      const yy = -1180 + 600 * u * (1 - u);
      const bob = Math.sin(t * 3 + k * 2.1 + i) > 0.96 ? -4 : 0;
      g.beginPath();
      addEllipse(g, bx, yy - 12 + bob, 13, 10);
      addEllipse(g, bx - 10, yy - 22 + bob, 7, 7);
      g.fill();
      g.beginPath();
      g.moveTo(bx + 10, yy - 14 + bob);
      g.lineTo(bx + 24, yy - 6 + bob);
      g.lineTo(bx + 10, yy - 8 + bob);
      g.fill();
    }
  }
  for (const x of poles) {
    if (x < v.x0 - 100 || x > v.x1 + 100) continue;
    part(g, rectPath(x - 13, -1240, 26, 1300), "#8f8681", "#77706b", lw, [5, 4]);
    part(g, rectPath(x - 80, -1200, 160, 16), "#8f8681", null, lw);
    part(g, rectPath(x - 60, -1160, 22, 30), "#e8e2d8", null, lw * 0.7);
    part(g, rectPath(x + 38, -1160, 22, 30), "#e8e2d8", null, lw * 0.7);
  }
  TREES.forEach((x, i) => {
    if (trees !== "none" && x > v.x0 - 500 && x < v.x1 + 500) planeTree(g, x, t, lw, i * 17 + 3, c.z / ST_D, trees);
  });
}

function drawGround(g: CanvasRenderingContext2D, c: Cam, D: number, color: string, lw: number) {
  const v = viewOf(c, D);
  g.fillStyle = tinted(color);
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
 * light：楼上的斜影子有多重（0..1）；haze：额外的空气（推近成近景时，背景淡一点、像虚了焦）。
 */
export function drawCity(
  g: CanvasRenderingContext2D,
  base: DOMMatrix,
  c: Cam,
  t: number,
  between?: (D: number) => void,
  sh: [number, number] = [0, 0],
  o: { light?: number; haze?: number; wide?: number; trees?: TreeLook | "none" } = {},
) {
  const light = o.light ?? 1;
  const extra = o.haze ?? 0;
  const wide = o.wide ?? 0;
  for (const L of LAYERS) {
    applyCam(g, base, c, L.D, sh);
    const v = viewOf(c, L.D);
    drawGround(g, c, L.D, L.ground, L.lw);
    const clip = new Path2D();
    clip.rect(v.x0, 0, v.x1 - v.x0, 8000);
    for (const b of L.blocks) {
      if (b.x + b.w < v.x0 || b.x > v.x1 || -b.floors * b.fh - 300 > v.y1) continue;
      if (b.wide) {
        if (wide <= 0.01) continue;
        g.globalAlpha = wide;
        drawBlock(g, b, c, L.D, L.detail, L.lw, t);
        g.globalAlpha = 1;
        continue;
      }
      drawBlock(g, b, c, L.D, L.detail, L.lw, t);
      clip.rect(b.x, -b.floors * b.fh - 80, b.w, b.floors * b.fh + 80);
    }
    if (L.D < 3 && light > 0) drawLightBands(g, c, L.D, clip, light * (L.D > 2 ? 0.6 : 1));
    for (const b of L.blocks) {
      if (b.x + b.w < v.x0 || b.x > v.x1) continue;
      if (b.wide && wide <= 0.01) continue;
      drawBlockGlow(g, b, c, L.D, (L.D > 3 ? 0.6 : 1) * (b.wide ? wide : 1));
    }
    between?.(L.D);
    drawSky(g, base, c, Math.min(1, L.haze + extra * (L.D > 2 ? 0.5 : 1)));
  }
  // 梧桐、电线（对面人行道）
  applyCam(g, base, c, ST_D, sh);
  drawGround(g, c, ST_D, "#c7b3a3", 3.2);
  {
    // 马路：一道路沿、路面上的斜影
    const v = viewOf(c, ST_D);
    g.fillStyle = "#b8a294";
    g.fillRect(v.x0, 0, v.x1 - v.x0, 18);
    g.strokeStyle = INK;
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(v.x0, 18);
    g.lineTo(v.x1, 18);
    g.stroke();
    const road = new Path2D();
    road.rect(v.x0, 0, v.x1 - v.x0, 8000);
    if (light > 0) drawLightBands(g, c, ST_D, road, light * 0.8);
  }
  drawStreetLife(g, c, t, o.trees);
  between?.(ST_D);
  if (extra > 0) drawSky(g, base, c, extra * 0.7);
}

/** 人这一层的街面：人行道（地砖缝按透视往下越来越疏、往两边斜开，看得出是平躺的地面） */
export function drawStreet(g: CanvasRenderingContext2D, c: Cam) {
  const v = viewOf(c, 1);
  g.fillStyle = "#dcc7b0";
  g.fillRect(v.x0, 0, v.x1 - v.x0, 8000);
  // 越往下（离镜头越近）越暖、越亮一点
  const gr = g.createLinearGradient(0, 0, 0, 900);
  gr.addColorStop(0, "rgba(150,110,120,0.16)");
  gr.addColorStop(1, "rgba(255,236,210,0.12)");
  g.fillStyle = gr;
  g.fillRect(v.x0, 0, v.x1 - v.x0, 900);
  g.fillStyle = "#bea996";
  g.fillRect(v.x0, 0, v.x1 - v.x0, 22);
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(v.x0, 0);
  g.lineTo(v.x1, 0);
  g.moveTo(v.x0, 22);
  g.lineTo(v.x1, 22);
  g.stroke();
  g.strokeStyle = "rgba(60,40,50,0.14)";
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
 * 天上的白：下沿以上是发光的白，下沿一层肥皂泡一样的彩光（离得近时更宽、里面也流动着彩色），往下一片柔和的眩光和光柱。
 * flash 是有人被吸进去时整个画面亮一下。
 */
export function drawWhite(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, flash = 0) {
  // 白的下沿在没转的画面上的高度；画面转着时眩光和光柱跟着转（pad：转开后露出来的角）
  const yEdge = H / 2 + (Y_WHITE - c.y) * c.z;
  const pad = c.r ? Math.abs(Math.sin(c.r)) * H + 40 : 0;
  g.setTransform(base);
  const glare = 1500 * c.z;
  if (yEdge + glare > -pad) {
    g.save();
    if (c.r) {
      g.translate(W / 2, H / 2);
      g.rotate(c.r);
      g.translate(-W / 2, -H / 2);
    }
    g.globalCompositeOperation = "screen";
    const gr = g.createLinearGradient(0, yEdge, 0, yEdge + glare);
    gr.addColorStop(0, "rgba(255,252,246,0.75)");
    gr.addColorStop(0.12, "rgba(255,246,232,0.32)");
    gr.addColorStop(0.45, "rgba(255,240,226,0.08)");
    gr.addColorStop(1, "rgba(255,240,226,0)");
    g.fillStyle = gr;
    g.fillRect(-pad, Math.max(-10 - pad, yEdge - 200), W + 2 * pad, glare + 220);
    // 白往下打的光柱（一根根很淡的斜光，慢慢地挪）
    const k = clamp01(1 - (yEdge - 0) / (H * 1.6)) * clamp01((yEdge + glare) / 600);
    if (k > 0.01) {
      for (let i = 0; i < 7; i++) {
        const x = ((i * 233 + 80 + t * 9 * (i % 2 ? 1 : -1) - c.x * c.z * 0.15) % (W + 400)) - 200;
        const wd = 60 + ((i * 97) % 110);
        const ray = g.createLinearGradient(0, yEdge, 0, yEdge + glare * 0.8);
        const a = 0.13 * k * (0.7 + 0.3 * Math.sin(t * 0.7 + i * 1.9));
        ray.addColorStop(0, `rgba(255,250,238,${a})`);
        ray.addColorStop(1, "rgba(255,250,238,0)");
        g.fillStyle = ray;
        g.beginPath();
        g.moveTo(x, yEdge);
        g.lineTo(x + wd, yEdge);
        g.lineTo(x + wd * 2.2 + 220, yEdge + glare * 0.8);
        g.lineTo(x + 220, yEdge + glare * 0.8);
        g.closePath();
        g.fill();
      }
    }
    g.restore();
  }
  if (yEdge > -400 - pad) {
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
      for (const [kw, ka] of [[2.4, 0.45], [1.5, 0.75], [0.8, 1]] as const) {
        g.strokeStyle = `hsla(${hue}, 82%, ${84 + 3 * Math.sin(t * 1.3 + i * 2)}%, ${a * ka})`;
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

/**
 * 拉开到整座城上时，远处天际线后面的一层暖金色余晖（画在天上、远处的城之前：远处的楼衬成剪影）。
 * 按最远那层城的地面算它在画面上的高度，k 是强度。
 */
export function drawAfterglow(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, k: number) {
  if (k <= 0.01) return;
  const [, yFar] = toScreen(c, 0, 0, LAYERS[0].D);
  const cy = yFar - 120;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "screen";
  g.translate(W / 2, cy);
  g.scale(1, 0.34);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 900);
  gr.addColorStop(0, `rgba(255,206,140,${0.55 * k})`);
  gr.addColorStop(0.45, `rgba(255,198,150,${0.28 * k})`);
  gr.addColorStop(1, "rgba(255,190,160,0)");
  g.fillStyle = gr;
  g.fillRect(-900, -900, 1800, 1800);
  g.restore();
}

/**
 * 拉开到整座城上时，白往下打的几道宽宽的斜光（耶稣光）：从白的下沿斜着照下来，穿过满天往上飘的人，落在城上，
 * 越往下越宽、越淡，慢慢地挪（screen：只把亮处提亮）。k：0 不画，1 拉开到整座城上。
 */
export function drawRays(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, k: number) {
  if (k <= 0.01) return;
  const [, yEdge] = toScreen(c, 0, Y_WHITE);
  const top = Math.max(-80, yEdge - 30);
  const len = H * 1.05 - top;
  if (len < 200) return;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "screen";
  const rays: [number, number, number, number][] = [
    // 画面上的起点 x、上沿宽、透明度、挪动的快慢
    [40, 120, 0.22, 0.9],
    [250, 60, 0.15, -0.6],
    [430, 170, 0.2, 0.5],
    [640, 80, 0.16, -0.8],
    [780, 140, 0.19, 0.7],
    [990, 70, 0.13, -0.5],
  ];
  for (const [x0, w0, a0, sp] of rays) {
    const x = x0 + 26 * Math.sin(t * 0.21 * sp + x0) - c.x * c.z * 0.05;
    const a = a0 * k * (0.8 + 0.2 * Math.sin(t * 0.5 + x0 * 0.01));
    const slant = 0.32;
    const w1 = w0 * 2.4;
    const p = new Path2D();
    p.moveTo(x, top);
    p.lineTo(x + w0, top);
    p.lineTo(x + w0 + slant * len + (w1 - w0) / 2, top + len);
    p.lineTo(x + slant * len - (w1 - w0) / 2, top + len);
    p.closePath();
    const gr = g.createLinearGradient(0, top, 0, top + len);
    gr.addColorStop(0, `rgba(255,248,232,${a})`);
    gr.addColorStop(0.45, `rgba(255,236,206,${a * 0.6})`);
    gr.addColorStop(1, "rgba(255,226,196,0)");
    g.fillStyle = gr;
    g.fill(p);
  }
  g.restore();
}

/** 碰到白的一下：一圈圈彩色光环往外扩（大小按画面像素算），中间一团白，碎光往四周散 */
export function drawBurst(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, x: number, y: number, age: number, scale = 1) {
  if (age < 0 || age > 1.8) return;
  const [sx, sy] = toScreen(c, x, y);
  if (sx < -900 * scale || sx > W + 900 * scale || sy < -900 * scale || sy > H + 900 * scale) return;
  g.setTransform(base);
  g.save();
  // 一圈像肥皂泡的边一样的彩色冲击波（越扩越淡、越细），后面跟一圈更淡的
  const hues = [330, 35, 60, 160, 200, 270];
  for (let i = 0; i < 2; i++) {
    const a = age - i * 0.14;
    if (a <= 0) continue;
    const k = 1 - Math.exp(-a / 0.3);
    const rad = (60 + 520 * k) * scale;
    const alpha = Math.max(0, 1 - a / 1.2) * (i ? 0.35 : 0.7);
    for (let j = 0; j < hues.length; j++) {
      g.strokeStyle = `hsla(${hues[j]}, 90%, 74%, ${alpha * 0.5})`;
      g.lineWidth = (6 + 12 * (1 - k)) * scale;
      g.beginPath();
      g.arc(sx, sy, rad + (j - 2.5) * 4.5 * scale, 0, Math.PI * 2);
      g.stroke();
    }
  }
  const core = Math.max(0, 1 - age / 0.5);
  if (core > 0) {
    const R = 280 * scale;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
    gr.addColorStop(0, `rgba(255,252,246,${core})`);
    gr.addColorStop(0.4, `rgba(255,236,226,${core * 0.5})`);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(sx - R, sy - R, R * 2, R * 2);
  }
  // 碎光：往四周散开，慢慢落下来变成灰
  const r = seeded(Math.round(x) * 7 + 3);
  g.globalCompositeOperation = "lighter";
  const spr = moteSprite();
  for (let i = 0; i < 26; i++) {
    const ang = r() * Math.PI * 2;
    const sp = (120 + r() * 340) * scale;
    const k = 1 - Math.exp(-age / 0.35);
    const px = sx + Math.cos(ang) * sp * k;
    const py = sy + Math.sin(ang) * sp * k * 0.7 + 90 * scale * age * age;
    const s = (10 + r() * 16) * scale * (1 - age / 2);
    g.globalAlpha = Math.max(0, 1 - age / 1.8) * (0.6 + 0.4 * Math.sin(age * 9 + i));
    g.drawImage(spr, px - s, py - s, s * 2, s * 2);
  }
  g.restore();
}

/** 碰到白以后，他化成的灰像雪一样慢慢落下来（大小、散开按画面像素算，跟着那一点走），持续约 4 秒 */
export function drawAshFall(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, x: number, y: number, age: number, scale = 1) {
  if (age < 0.1 || age > 4.2) return;
  const [sx, sy] = toScreen(c, x, y);
  if (sx < -600 || sx > W + 600 || sy < -400 || sy > H + 200) return;
  g.setTransform(base);
  g.save();
  const r = seeded(Math.round(x) * 13 + 7);
  const spr = moteSprite();
  const fade = Math.min(1, (4.2 - age) / 1.2) * Math.min(1, age / 0.4);
  for (let i = 0; i < 40; i++) {
    const ang = r() * Math.PI * 2;
    const sp = (30 + r() * 170) * scale;
    const k = 1 - Math.exp(-age / 0.6);
    const fall = (26 + r() * 40) * scale * age + 10 * scale * age * age;
    const px = sx + Math.cos(ang) * sp * k + 14 * scale * Math.sin(age * 1.4 + i * 1.7);
    const py = sy + Math.abs(Math.sin(ang)) * sp * k * 0.4 + fall;
    const sz = (2.2 + r() * 3.2) * scale;
    const tw = 0.6 + 0.4 * Math.sin(age * 5 + i);
    g.globalAlpha = fade * tw * 0.85;
    g.fillStyle = i % 3 ? "#cdb6c6" : "#f3e2d0";
    g.beginPath();
    g.arc(px, py, sz, 0, Math.PI * 2);
    g.fill();
    if (i % 4 === 0) {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = fade * tw * 0.5;
      g.drawImage(spr, px - sz * 4, py - sz * 4, sz * 8, sz * 8);
      g.globalCompositeOperation = "source-over";
    }
  }
  g.restore();
}

// ——— 灰：光里发亮的浮尘，一直在慢慢落 ———
const TILE = 1200;
const MOTES = (() => {
  const r = seeded(21);
  return Array.from({ length: 16 }, () => ({ x: r() * TILE, y: r() * TILE, s: 5 + r() * 9, v: 40 + r() * 60, ph: r() * 6.28 }));
})();

/** 浮尘（世界里一块块平铺；D 是这一层的远近，size 让近处的大一些） */
export function drawMotes(g: CanvasRenderingContext2D, c: Cam, t: number, D = 1, size = 1, alpha = 1) {
  alpha *= 0.25 + 0.75 * dayLeft();
  const k = c.z / D;
  // 拉得很远时浮尘小得看不见，不画（满画面几百颗也很慢）
  if (k < 0.32) return;
  const v = viewOf(c, D, 1.05);
  const spr = moteSprite();
  g.save();
  g.globalCompositeOperation = "screen";
  const tx0 = Math.floor(v.x0 / TILE);
  const tx1 = Math.floor(v.x1 / TILE);
  const ty0 = Math.floor(v.y0 / TILE);
  const ty1 = Math.floor(v.y1 / TILE);
  const n = Math.max(4, Math.round(MOTES.length * Math.min(1, k / 0.6)));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const shift = (((tx * 7 + ty * 13) % 5) + 5) % 5;
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

/** 远处往上飘的人：逆光的小剪影（层坐标，h 是身高）：张着手、腿软软地垂着 */
export function drawSilhouette(g: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, ph: number, alpha = 0.6, col = "132,98,110") {
  const s = h / 140;
  g.save();
  g.translate(x, y);
  g.rotate(0.12 * Math.sin(t * 0.8 + ph));
  g.scale(s, s);
  const c = `rgba(${col},${alpha})`;
  g.fillStyle = c;
  g.strokeStyle = c;
  g.lineCap = "round";
  g.lineJoin = "round";
  const sw = Math.sin(t * 1.2 + ph);
  g.lineWidth = 9;
  g.beginPath();
  // 腿
  g.moveTo(-6, 34);
  g.quadraticCurveTo(-10, 60, -9 + sw * 3, 86);
  g.moveTo(6, 34);
  g.quadraticCurveTo(10, 62, 12 - sw * 3, 84);
  // 手：往上张开
  g.moveTo(-12, -14);
  g.quadraticCurveTo(-30, -24, -42, -52 + sw * 4);
  g.moveTo(12, -14);
  g.quadraticCurveTo(30, -24, 42, -52 - sw * 4);
  g.stroke();
  // 身子、头
  g.beginPath();
  g.roundRect(-14, -20, 28, 58, 11);
  g.fill();
  g.beginPath();
  g.ellipse(0, -36, 13, 15, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// ——— 光 ———
/** 斜照进来的几道暖光（画面坐标，跟着镜头横向挪一点） */
export function drawSunbeams(g: CanvasRenderingContext2D, base: DOMMatrix, c: Cam, t: number, k = 1) {
  k *= dayLeft();
  if (k <= 0.005) return;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "screen";
  const shift = -((c.x * c.z) / 6) % 1400;
  const beams: [number, number, number][] = [
    [-520, 440, 0.15],
    [-80, 300, 0.1],
    [300, 260, 0.08],
    [880, 380, 0.12],
  ];
  for (const [x0, w, a] of beams) {
    const kk = k * a * (0.85 + 0.15 * Math.sin(t * 0.6 + x0));
    const x = x0 + shift;
    const p = new Path2D();
    p.moveTo(x, -100);
    p.lineTo(x + w, -100);
    p.lineTo(x + w + 1300, H);
    p.lineTo(x + 1300, H);
    p.closePath();
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `rgba(255,234,196,${kk})`);
    gr.addColorStop(0.7, `rgba(255,226,190,${kk * 0.35})`);
    gr.addColorStop(1, "rgba(255,226,190,0)");
    g.fillStyle = gr;
    g.fill(p);
  }
  g.restore();
}

/** 暖光（soft-light：只把亮处提暖，不把人染色）、纸的颗粒、很轻的暗角（vig 是暗角，warm 是暖光的强度） */
export function drawGrade(g: CanvasRenderingContext2D, base: DOMMatrix, grain: HTMLCanvasElement, warm = 1, vig = 0.16) {
  // 傍晚暖光再浓一点，夜里收掉；夜里暗角重一点
  warm *= (1 + 0.3 * sunsetK()) * (1 - 0.85 * nightK());
  vig += 0.14 * nightK();
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "soft-light";
  const sun = g.createRadialGradient(40, 220, 0, 40, 220, 1900);
  sun.addColorStop(0, `rgba(255,198,126,${0.8 * warm})`);
  sun.addColorStop(0.6, `rgba(255,190,130,${0.25 * warm})`);
  sun.addColorStop(1, "rgba(200,150,170,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.26;
  g.drawImage(grain, 0, 0, W, H);
  g.restore();
  if (vig > 0) {
    const v = g.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1280);
    v.addColorStop(0, "rgba(70,36,54,0)");
    v.addColorStop(1, `rgba(70,36,54,${vig})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }
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
