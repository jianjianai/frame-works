// 第二幕⑧「请你等等我」第二句（29.79–31.97：请 29.79 你 30.24 等 30.42 等 30.60 我 30.78–31.83；30.0–32.0 鼓停、低音悬着）的天色：
// 2026-10-20 用户改成「两人坐在另外一栋楼上，拥抱着」（人和镜头在 lib/roof.ts 的 HUG_T）。被抱住以后天回暖成夕阳最红的样子（HUG_DUSK），
// 「等等我」说完太阳落下去、变成深蓝，城里的窗一组组亮起来——两个人一直这样抱着。31.97 切进她的屋子（⑨「两块五的签字笔」）。
// （原来这里是千斤一个人攥着栏杆等、沉沉家那扇窗亮了、镜头飞进窗里：nightCam，2026-10-20 换掉。）
// 她家那扇窗里画的就是那间屋子（lib/room.ts，缩小画在玻璃里）。

import { type Cam, E, ph } from "./cam";
import { INK, TOWER_HOME, drawGlow, duskTint, rectPath, specialWindow } from "./world";
import { drawRoom } from "./room";

type V2 = [number, number];

export const NIGHT_T = {
  start: 29.79,
  /** 太阳落下去：「等、等、我」说完（30.8）起，31.75 天黑透（2026-10-25 从 30.0–31.35 往后挪：抱着飘、坐下、说「等等我」都在暖的夕阳里） */
  dusk0: 30.8,
  dusk1: 31.75,
  /** 城里的窗一组组亮起来 */
  lights0: 30.9,
  lights1: 31.7,
  /** 沉沉家的台灯亮了（她回家写砖：切进屋子之前，楼顶上看不见） */
  home: 31.9,
  /** 切进她的屋子：从这一刻起只画屋里 */
  inside: 31.97,
  end: 32.05,
};

/** [天黑了多少, 城里的窗亮了多少] */
/**
 * ⑥⑦ 已经是傍晚（2026-10-24 用户：「这里应该是快到晚上了，让天暗下来」）：切到高空（26.0）时天已经偏橙红、暗了一层（PRE0），
 * 一路慢慢再暗（到 30.0 是 PRE1），城里零星亮起几扇窗；鼓一停（30.0）起接着落到天黑透。
 */
export const DUSK_PRE = { t0: 26.0, t1: 30.0, PRE0: 0.46, PRE1: 0.6, lights: 0.18 };
/**
 * 被抱住以后天回暖（2026-10-25 用户：「为什么还是没有和草稿一样的被抱住很温暖的感觉」——草稿抱住以后整幅画面是暖的桃金色，
 * 这里是灰紫的暮色、落地就转蓝）：抱住（lib/roof.ts 的 ROOF_T.catch）起 0.9 秒退回傍晚最红的那一刻（d，夕阳最浓、几乎没有夜色），
 * 一直暖到「等等我」说完，再落到天黑
 */
export const HUG_DUSK = { t0: 27.84, t1: 28.74, d: 0.38 };
export function duskAt(t: number): [number, number] {
  const T = NIGHT_T;
  const P = DUSK_PRE;
  if (t < T.dusk0) {
    if (t < P.t0) return [0, 0];
    const v = ph(t, P.t0, P.t1);
    const pre = P.PRE0 + (P.PRE1 - P.PRE0) * v;
    return [pre + (HUG_DUSK.d - pre) * E.io(ph(t, HUG_DUSK.t0, HUG_DUSK.t1)), P.lights * v];
  }
  const u = ph(t, T.dusk0, T.dusk1);
  const lights = P.lights + (1 - P.lights) * Math.pow(ph(t, T.lights0, T.lights1), 1.3);
  return [HUG_DUSK.d + (1 - HUG_DUSK.d) * (1 - Math.pow(1 - u, 1.6)), lights];
}
/** 沉沉家的台灯：啪地亮起来，闪一下 */
export function lampAt(t: number) {
  const d = t - NIGHT_T.home;
  if (d <= 0) return 0;
  if (d < 0.03) return 0.6;
  if (d < 0.05) return 0.38;
  return Math.min(1, 0.72 + d * 5);
}

/** 她家那扇窗（世界坐标：玻璃的范围） */
export const homeWindow = () => specialWindow(TOWER_HOME)!;
/** 屋子画进窗里的变换（世界 ← 屋子）：屋子的 (540, 960) 在窗的正中，屋子的高 1920 = 窗的高 */
export function roomMatrix(): DOMMatrix {
  const w = homeWindow();
  const k = w.h / 1920;
  return new DOMMatrix().translate(w.x + w.w / 2, w.y + w.h / 2).scale(k).translate(-540, -960);
}
/** 窗铺满画面时镜头的倍数（窗比 9:16 宽：按高铺满，再多一点点） */
export const zInside = () => (1920 / homeWindow().h) * 1.012;

/**
 * 她家那扇窗（世界坐标，画在楼上面）：灯没亮时和别的窗一样是深色玻璃（黄昏、夜里一样蒙色）；亮了以后玻璃里是那间屋子，
 * 窗外漫出一团暖光（推近了就收掉，不然把屋子冲白）。防飘栏的门往左边打开着。z：镜头倍数
 */
/** 她家台灯亮不亮的覆盖（三 白天她出门了：灯灭着，窗和别的窗一样）：按场景设置一次，画完设回 null */
let LAMP: number | null = null;
export function setHomeLamp(k: number | null) {
  LAMP = k;
}
export function drawHomeWindow(g: CanvasRenderingContext2D, t: number, z: number) {
  const w = homeWindow();
  const on = LAMP ?? lampAt(t);
  const glass = rectPath(w.x, w.y, w.w, w.h);
  g.save();
  if (on <= 0) {
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
  } else {
    g.save();
    g.clip(glass);
    g.transform(...matArgs(roomMatrix()));
    drawRoom(g, t, on);
    g.restore();
  }
  openCage(g, w);
  g.restore();
  // 窗外漫出来的暖光：推近到 3 倍以后收掉
  const a = 0.9 * on * (1 - E.io(ph(z, 2, 4.5)));
  if (a > 0.01) drawGlow(g, w.x + w.w / 2, w.y + w.h / 2, 260, a);
}
const matArgs = (m: DOMMatrix): [number, number, number, number, number, number] => [m.a, m.b, m.c, m.d, m.e, m.f];

/**
 * 防飘栏那扇铁栅栏门转到哪：−0.32 往左开着（侧着看只剩窄窄一条，挂在窗的左边；第二幕起一直是这样），0 垂直着（看不见宽度），
 * 1 关上（盖住整扇窗）。主歌二④他把它拉上：按场景设置一次（和 setDusk 一样），画完设回 −0.32
 */
let CAGE = -0.32;
export function setCage(k: number) {
  CAGE = k;
}
/** 防飘栏的门：绕左边的合页转，k 见 CAGE */
function openCage(g: CanvasRenderingContext2D, w: { x: number; y: number; w: number; h: number }) {
  const u = TOWER_HOME.fh / 128;
  const hx = w.x - 8 * u;
  const y0 = w.y - 8 * u;
  const y1 = w.y + w.h + 14 * u;
  const dw = (w.w + 16 * u) * -CAGE;
  // 转过去的门：外沿离镜头近一点，上下各多出一点（关上时贴在窗上，不多出来）
  const near = Math.max(0, Math.min(1, -CAGE / 0.32));
  const gx = hx - dw;
  const p = new Path2D();
  p.moveTo(hx, y0);
  p.lineTo(gx, y0 - 5 * u * near);
  p.lineTo(gx, y1 + 5 * u * near);
  p.lineTo(hx, y1);
  p.closePath();
  g.save();
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.stroke(p);
  g.lineWidth = 1.8;
  g.beginPath();
  const n = CAGE > 0 ? 9 : 6;
  for (let k = 1; k < n; k++) {
    const x = hx - (dw * k) / n;
    const e = (5 * u * k * near) / n;
    g.moveTo(x, y0 - e);
    g.lineTo(x, y1 + e);
  }
  const my = y0 + (y1 - y0) * 0.45;
  g.moveTo(hx, my);
  g.lineTo(gx, my);
  g.stroke();
  // 合页
  g.fillStyle = INK;
  for (const y of [y0 + 10 * u, y1 - 10 * u]) g.fillRect(hx - 3, y - 4, 6, 8);
  g.restore();
}

/**
 * 切进屋子那一刻（⑨ 的起点）的镜头：还是世界里的镜头，对着窗的正中、窗正好铺满画面（屋子照旧用 roomMatrix 画）。
 * 2026-10-20 起是从楼顶上抱着的两个人硬切过来（原来是飞进窗，接着那个速度慢慢停下来）
 */
export function cameraInside(_t: number): Cam {
  const w = homeWindow();
  return { x: w.x + w.w / 2, y: w.y + w.h / 2, z: zInside(), r: 0 };
}

export type { V2 };
