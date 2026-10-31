// 终章（lib/end_t.ts）的地图和占位：还是第一幕那条街（最高那栋楼、旁边五层楼的铺子、老钟家），为这一段重新占位——
// 所有事情落在一条竖线上：他起飞、落地、跺出来的坑、他妈妈的外套都在老钟家一楼窗户左边那截墙前（X_K）；
// 她的窗为这一段挪到顶层最右那扇（朝着老钟家这边，openCage [0, 2]）；楼顶的栏杆补到右边的角上（她最后倒挂着攥住的地方）。
// 风这一段往左吹。世界坐标：街面 y = 0，往上为负；人和第一幕一样按 1 倍画（她 590 高）。

import { type Cam, E, H, W, applyCam, clamp01, ph, toScreen, viewOf } from "./cam";
import {
  type Block,
  INK,
  QJ_HOME,
  STREET,
  TOWER,
  Y_WHITE,
  drawBlock,
  drawBlockGlow,
  drawCity,
  drawGrade,
  drawMotes,
  drawSky,
  drawSunbeams,
  drawTinted,
  drawWhite,
  duskTint,
  rectPath,
  specialWindow,
  streetSide,
} from "./world";
import { TOWER_ROOF, drawRoof } from "./props";
import { ZHONG_HOUSE, ZHONG_NEIGHBORS } from "./dawn";
import { TE, type V2 } from "./end_t";

// ——————————————— 占位 ———————————————
/** 他站的地方：老钟家一楼窗户左边那截墙前（窗 −1710…−1380；信箱、壁灯在他头顶旁边） */
export const X_K = -1860;
/** 老钟家一楼那扇窗（中心 x、宽、窗台、窗顶） */
export const ZW = ZHONG_HOUSE.win;
/** 白的下沿 */
export { Y_WHITE };

/** 最高那栋楼（她家）：这一段她那扇窗是顶层最右那扇 */
export const TOWER_END: Block = { ...TOWER, openCage: [0, 2] };
/** 她那扇窗（玻璃的范围） */
export const herWindow = () => specialWindow(TOWER_END)!;
/** 楼顶（女儿墙顶）和栏杆顶 */
export const ROOF_Y = TOWER_ROOF;
export const RAIL_TOP = TOWER_ROOF - 96;
/** 楼顶栏杆右边的角（她倒挂着攥住的地方：栏杆顶） */
export const CORNER: V2 = [TOWER.x + TOWER.w - 12, RAIL_TOP];
/** 楼的右墙 */
export const TOWER_RIGHT = TOWER.x + TOWER.w;

// ——————————————— 她那扇窗：防飘栏的门「哐」一下被撞开 ———————————————
/**
 * 防飘栏那扇门：1 关着（盖住整扇窗）→ 撞开（0.07 秒甩到外面，撞到墙上弹回来一点）→ −0.32 往右开着（侧着看只剩窄窄一条）。
 * 门的合页在右边（她往右下扑出去）
 */
export function cageAt(t: number) {
  const d = t - TE.bang;
  if (d <= 0) return 1;
  if (d < 0.07) return 1 - 1.5 * E.out(d / 0.07);
  return -0.32 - 0.18 * Math.exp(-(d - 0.07) / 0.06) * Math.cos((d - 0.07) * 40);
}
/** 她那扇窗：天快亮，屋里灯灭着（深色玻璃、一道反光）；外面的防飘栏和门 */
export function drawHerWindow(g: CanvasRenderingContext2D, t: number) {
  const w = herWindow();
  const glass = rectPath(w.x, w.y, w.w, w.h);
  g.save();
  g.fillStyle = "#5f6a7f";
  g.fill(glass);
  g.save();
  g.clip(glass);
  g.fillStyle = "rgba(196,206,222,0.28)";
  g.beginPath();
  g.moveTo(w.x + w.w * 0.12, w.y + w.h);
  g.lineTo(w.x + w.w * 0.42, w.y);
  g.lineTo(w.x + w.w * 0.62, w.y);
  g.lineTo(w.x + w.w * 0.32, w.y + w.h);
  g.closePath();
  g.fill();
  g.restore();
  const k = duskTint();
  if (k) {
    g.fillStyle = `rgba(${k[0]},${k[1]},${k[2]},${k[3]})`;
    g.fill(glass);
  }
  cageDoor(g, w, cageAt(t));
  g.restore();
}
/** 防飘栏：凸出来的笼子（四边）和门（绕右边的合页转） */
function cageDoor(g: CanvasRenderingContext2D, w: { x: number; y: number; w: number; h: number }, k: number) {
  const u = TOWER.fh / 128;
  const x0 = w.x - 8 * u;
  const hx = w.x + w.w + 8 * u;
  const y0 = w.y - 8 * u;
  const y1 = w.y + w.h + 14 * u;
  // 笼子的框（门开了以后只剩框）
  g.save();
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.strokeRect(x0, y0, hx - x0, y1 - y0);
  // 门：k = 1 盖住整扇窗；k < 0 甩到合页外面（往右）
  const dw = (hx - x0) * k;
  const near = Math.max(0, Math.min(1, -k / 0.32));
  const gx = hx - dw;
  const p = new Path2D();
  p.moveTo(hx, y0);
  p.lineTo(gx, y0 - 5 * u * near);
  p.lineTo(gx, y1 + 5 * u * near);
  p.lineTo(hx, y1);
  p.closePath();
  g.stroke(p);
  g.lineWidth = 1.8;
  g.beginPath();
  const n = k > 0 ? 9 : 6;
  for (let i = 1; i < n; i++) {
    const x = hx - (dw * i) / n;
    const e = (5 * u * i * near) / n;
    g.moveTo(x, y0 - e);
    g.lineTo(x, y1 + e);
  }
  const my = y0 + (y1 - y0) * 0.45;
  g.moveTo(hx, my);
  g.lineTo(gx, my);
  g.stroke();
  g.fillStyle = INK;
  for (const y of [y0 + 10 * u, y1 - 10 * u]) g.fillRect(hx - 3, y - 4, 6, 8);
  g.restore();
}

// ——————————————— 楼顶的栏杆补到右边的角上 ———————————————
export function drawRailExt(g: CanvasRenderingContext2D) {
  const y = TOWER_ROOF;
  const x0 = TOWER.x + 700;
  const x1 = CORNER[0];
  g.save();
  g.lineCap = "round";
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x0, y - 96);
  g.lineTo(x1, y - 96);
  for (let x = x0 + 32; x < x1 - 10; x += 46) {
    g.moveTo(x, y);
    g.lineTo(x, y - 96);
  }
  g.stroke();
  g.strokeStyle = "#a39a96";
  g.lineWidth = 2;
  g.stroke();
  // 角上那根柱子粗一点（她攥住的地方）
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x1, y + 2);
  g.lineTo(x1, y - 100);
  g.stroke();
  g.strokeStyle = "#b3aaa5";
  g.lineWidth = 3;
  g.stroke();
  g.restore();
}

// ——————————————— 旁边窗里看着的人：关窗（绝望）→ 人链往上时一扇扇打开（回报） ———————————————
/** 一栋楼第 f 层（0 是最上面一层）第 i 扇窗的玻璃（世界坐标）：和 world.ts 的 geomOf 同一套算法 */
export function blockWindow(b: Block, f: number, i: number) {
  const u = b.fh / 128;
  const w = b.w / u;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const top = -b.floors * 128 - 60;
  const x = 20 + uw * i + uw * 0.18;
  const y = top + 70 + f * 128;
  return { x: b.x + x * u, y: y * u, w: uw * 0.64 * u, h: 74 * u, u };
}
const FIVE = ZHONG_NEIGHBORS[1];
interface Watcher {
  b: Block;
  f: number;
  i: number;
  /** 关上的时刻（没有就是一直开着的） */
  shut: number | null;
  /** 打开的时刻 */
  open: number;
  curtain: string;
  /** 人站在窗的哪边、伸哪边的手 */
  side: number;
  /** 有没有防飘栏（画回去压在上面） */
  cage: boolean;
}
/**
 * 五层楼靠老钟家那一列（他们飘起来的时候就在旁边）先关上；第四声从街上往后拉开时这几扇从下往上一扇扇打开，再往上楼上的窗一扇扇亮起来、有人探出来
 * （2026-10-27 重排：原来 121.4–124.6 开，那时镜头在第三声往下扫的路上；第三声改成他喊、她在白的边上，开窗挪到第四声拉开时，看得见）
 */
const WATCHERS: Watcher[] = [
  { b: FIVE, f: 2, i: 1, shut: TE.shut[0], open: 126.64, curtain: "#9b5a52", side: 1, cage: true },
  { b: FIVE, f: 1, i: 1, shut: TE.shut[1], open: 126.46, curtain: "#5d6d86", side: -1, cage: true },
  { b: FIVE, f: 3, i: 1, shut: TE.shut[2], open: 126.82, curtain: "#8a7a52", side: 1, cage: true },
  { b: FIVE, f: 0, i: 1, shut: TE.shut[3], open: 126.12, curtain: "#6f5a7a", side: -1, cage: true },
  { b: FIVE, f: 1, i: 0, shut: TE.shut[4], open: 126.3, curtain: "#7f6550", side: 1, cage: true },
  // 最高那栋楼右边那一列：镜头拉开、楼往上露出来时一扇扇亮起来，窗里的人走到窗前看
  ...[20, 17, 14, 11, 8, 5].map((f, k): Watcher => ({ b: TOWER, f, i: 2, shut: null, open: 127.0 + k * 0.17, curtain: ["#9b5a52", "#5d6d86", "#8a7a52", "#6f5a7a", "#7f6550", "#5f7f6a"][k], side: k % 2 ? -1 : 1, cage: true })),
];
/** 这扇窗的玻璃中心（给镜头、人链对时刻用） */
export const watcherAt = (k: number) => {
  const W = WATCHERS[k];
  const w = blockWindow(W.b, W.f, W.i);
  return [w.x + w.w / 2, w.y + w.h / 2] as V2;
};
/**
 * 那几扇窗（画在楼上面，人之前）：shut 以前窗里亮着暖灯、人影走到窗前看着他们；到点往窗边一挪伸手，窗帘「啪」地拉过来（0.1 秒），
 * 再过一下灯灭了。open：灯亮起来、窗帘拉开、人走到窗前，往人链那边伸出手。pair：他们俩（或人链）在哪，人影的头跟着转
 */
export function drawWatchers(g: CanvasRenderingContext2D, t: number, pair: V2, view: { x0: number; x1: number; y0: number; y1: number }) {
  if (t < 99.6) return;
  for (const W of WATCHERS) {
    const w = blockWindow(W.b, W.f, W.i);
    if (w.x > view.x1 || w.x + w.w < view.x0 || w.y > view.y1 || w.y + w.h < view.y0) continue;
    // 关：0 开着 → 1 窗帘拉上、灯灭
    let shut = 0;
    let lamp = 1;
    let come = 0;
    let reach = 0;
    if (W.shut !== null) {
      const d = t - W.shut;
      come = E.io(ph(t, 99.8 + (W.shut - TE.shut[0]) * 0.3, 100.4 + (W.shut - TE.shut[0]) * 0.3));
      reach = E.io(ph(d, -0.2, 0)) * (1 - E.io(ph(d, 0.1, 0.3)));
      shut = E.out(ph(d, 0, 0.1));
      lamp = 1 - E.io(ph(d, 0.14, 0.34));
    } else {
      lamp = 0;
    }
    // 开：灯亮、窗帘拉开、人走到窗前、伸出手
    const o = t - W.open;
    if (o > 0) {
      lamp = Math.max(lamp, E.out(ph(o, 0, 0.12)));
      shut = Math.min(shut, 1 - E.io(ph(o, 0.08, 0.3)));
      come = Math.max(come, E.io(ph(o, 0.15, 0.5)));
      reach = Math.max(reach, E.io(ph(o, 0.4, 0.75)));
    }
    if (lamp <= 0.01 && come <= 0.01 && shut <= 0.01) continue;
    g.save();
    const glass = new Path2D();
    glass.rect(w.x, w.y, w.w, w.h);
    g.clip(glass);
    if (lamp > 0.01) {
      const lg = g.createLinearGradient(0, w.y, 0, w.y + w.h);
      lg.addColorStop(0, `rgba(255,214,150,${lamp})`);
      lg.addColorStop(1, `rgba(242,176,112,${lamp})`);
      g.fillStyle = lg;
      g.fillRect(w.x, w.y, w.w, w.h);
    }
    if (come > 0.01) {
      // 人影：从屋里走到窗前，头跟着他们转一点
      const look = Math.max(-1, Math.min(1, (pair[0] - (w.x + w.w / 2)) / 900));
      const cx = w.x + w.w * (0.5 + 0.1 * W.side * reach) + w.w * 0.08 * look;
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
        g.lineTo(cx + W.side * w.w * (0.18 + 0.2 * reach), w.y + w.h * (0.72 - 0.4 * reach));
        g.stroke();
      }
    }
    if (shut > 0.001) {
      const cw = w.w * shut;
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
      g.fillStyle = `rgba(255,200,130,${0.32 * lamp})`;
      g.fillRect(x0, w.y, cw, w.h);
      g.fillStyle = `rgba(30,26,40,${0.5 * (1 - lamp)})`;
      g.fillRect(x0, w.y, cw, w.h);
    }
    g.restore();
    if (W.cage) {
      // 防飘栏的竖条画回去压在上面（和楼上画的同一个位置）
      const u = w.u;
      const c = { x: w.x - 8 * u, y: w.y - 8 * u, w: w.w + 16 * u, h: w.h + 22 * u };
      g.save();
      g.strokeStyle = "#3d2f33";
      g.lineWidth = 6;
      g.beginPath();
      for (let k = 1; k < 6; k++) {
        const bx = c.x + (c.w * k) / 6;
        g.moveTo(bx, c.y);
        g.lineTo(bx, c.y + c.h - 16 * u);
      }
      g.moveTo(c.x, c.y + (8 + 74 * 0.45) * u);
      g.lineTo(c.x + c.w, c.y + (8 + 74 * 0.45) * u);
      g.stroke();
      g.restore();
    }
    // 窗里的暖光漫出来一点（亮着的时候）
    if (lamp > 0.05 && W.shut === null) {
      g.save();
      g.globalAlpha = 0.35 * lamp;
      g.fillStyle = "rgba(255,210,150,0.6)";
      g.beginPath();
      g.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w * 0.9, w.h * 0.9, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
}

// ——————————————— 舞台：天、远处的城、人这一层的楼（她家那栋楼换成顶层最右那扇窗）、楼顶 ———————————————
const BLOCKS: Block[] = [...STREET, QJ_HOME, ...ZHONG_NEIGHBORS];
export function makeEndStage(base: DOMMatrix, grain: HTMLCanvasElement) {
  /** 一帧的底：天、远处的城、人这一层的楼；wide：远处那几栋高楼淡进来多少（镜头退远时） */
  const drawWorld = (g: CanvasRenderingContext2D, cam: Cam, t: number, sh: V2, walkers?: (D: number) => void, wide = 0) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    drawCity(g, base, cam, t, walkers, sh, { light: 1, haze: 0, wide });
    applyCam(g, base, cam, 1, sh);
    const view = viewOf(cam, 1);
    if (TOWER.x < view.x1 && TOWER.x + TOWER.w > view.x0) {
      drawBlock(g, TOWER_END, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, TOWER_END, cam, 1);
      if (view.y1 > TOWER_ROOF - 600 && view.y0 < TOWER_ROOF + 200)
        drawTinted(g, [TOWER.x - 120, TOWER_ROOF - 520, TOWER.x + TOWER.w + 120, TOWER_ROOF + 40], (gg) => {
          drawRoof(gg, t, false);
          drawRailExt(gg);
        });
      const hw = herWindow();
      if (view.y1 > hw.y - 200 && view.y0 < hw.y + hw.h + 200 && view.x1 > hw.x - 200 && view.x0 < hw.x + hw.w + 200) drawHerWindow(g, t);
    }
    for (const b of BLOCKS.concat(streetSide())) {
      if (b.x > view.x1 + 50 || b.x + b.w < view.x0 - 50) continue;
      drawBlock(g, b, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, b, cam, 1);
    }
  };
  /** 一帧的光：浮尘、斜照的暖光、暖光和暗角、白（flash：白一亮） */
  const drawAir = (g: CanvasRenderingContext2D, cam: Cam, t: number, sh: V2, look: { vig: number; warm: number }, flash = 0, motes = 1) => {
    drawMotes(g, cam, t, 1, 1, 0.85 * motes);
    applyCam(g, base, cam, 0.7, sh);
    drawMotes(g, cam, t + 3.1, 0.7, 1.8, 0.5 * motes);
    drawSunbeams(g, base, cam, t, clamp01(1 - (-cam.y - 3000) / 4000));
    drawGrade(g, base, grain, look.warm, look.vig);
    drawWhite(g, base, cam, t, flash);
  };
  return { drawWorld, drawAir };
}
/** 世界里一点在不在画面里（留 m 像素的边） */
export const onScreen = (cam: Cam, p: V2, m = 200) => {
  const [x, y] = toScreen(cam, p[0], p[1]);
  return x > -m && x < W + m && y > -m && y < H + m;
};
