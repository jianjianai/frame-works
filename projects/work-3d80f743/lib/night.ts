// 第二幕⑧「请你等等我」第二句（29.79–32.0：请 29.79 你 30.24 等 30.42 等 30.60 我 30.78–31.83；30.0–32.0 鼓停、低音悬着）：
// 只剩千斤一个人。镜头接着⑦往后退，退到她和最高那栋楼的楼顶同框（头顶压着白）；几秒里太阳落下去：天从杏色变成橙粉、再变成深蓝，
// 城里的窗一组组亮起来；白把她往上拽，她整个人倒过来斜着漂起来，只剩两只手攥着栏杆，像一只风筝，脸朝着那栋楼。
// 「我」30.78 最高那栋楼顶层最左那扇窗亮了——沉沉到家了，灯下坐在桌边写砖。镜头飞过去、推进那扇窗（她家的防飘栏开着），
// 31.97 窗里的屋子正好铺满画面，从这一刻起只画屋里（⑨「两块五的签字笔」接着在屋里）。
// 窗里画的就是那间屋子（lib/room.ts，缩小画在玻璃里），推进去的时候屋子越来越大，铺满画面的那一帧前后一模一样。

import { type Cam, E, aim, camLerp, ph } from "./cam";
import { INK, TOWER_HOME, drawGlow, duskTint, rectPath, specialWindow } from "./world";
import { drawRoom } from "./room";

type V2 = [number, number];

export const NIGHT_T = {
  start: 29.79,
  /** 太阳落下去：29.84 起，30.15 前后傍晚最红，30.75 天黑透 */
  dusk0: 29.84,
  dusk1: 30.75,
  /** 城里的窗一组组亮起来 */
  lights0: 30.12,
  lights1: 30.7,
  /** 「我」沉沉家的灯亮了 */
  home: 30.78,
  /** 镜头飞过去 */
  go: 30.9,
  /** 窗里的屋子铺满画面：从这一刻起只画屋里 */
  inside: 31.97,
  end: 32.05,
};

/** [天黑了多少, 城里的窗亮了多少] */
export function duskAt(t: number): [number, number] {
  const T = NIGHT_T;
  const u = ph(t, T.dusk0, T.dusk1);
  return [1 - Math.pow(1 - u, 1.6), Math.pow(ph(t, T.lights0, T.lights1), 1.3)];
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
 * ⑧ 的镜头（接着⑦往后退的那个镜头）：退到全景——左边千斤攥着栏杆，右边最高那栋楼的楼顶和她家那扇窗，头顶压着白；
 * 停在全景上看天黑下来、窗一组组亮；「我」那扇窗亮了，一拍以后飞过去推进窗里（先慢、越来越快，到窗前收一点但不停），
 * 31.97 窗铺满画面。位置按看得见的范围走（camLerp），一路朝着窗推过去。
 */
export function nightCam(t: number, base: Cam): Cam {
  const T = NIGHT_T;
  const WIDE = aim(-4085, -8330, 540, 960, 0.6);
  let c = camLerp(base, WIDE, E.io(ph(t, T.start + 0.02, T.start + 0.95)));
  // 停在全景上很慢地凑近一点（等）
  c = { ...c, z: c.z * (1 + 0.025 * E.io(ph(t, T.start + 0.6, T.go))) };
  const u = ph(t, T.go, T.inside);
  if (u > 0) {
    const w = homeWindow();
    const IN = aim(w.x + w.w / 2, w.y + w.h / 2, 540, 960, zInside());
    c = camLerp(c, IN, pushK(u));
  }
  return c;
}
/** 推进窗的进度：慢慢起步、越来越快，到窗前收一点但还在动（smoothstep 只取到 0.85，末速度约平均的七成） */
const S85 = 3 * 0.85 ** 2 - 2 * 0.85 ** 3;
function pushK(u: number) {
  const x = 0.85 * Math.min(1, u);
  return (3 * x * x - 2 * x * x * x) / S85;
}

/**
 * 进了屋以后（⑨ 接手之前）的镜头：还是世界里的镜头，对着窗的正中，接着推进窗的那个速度慢慢减下来
 * （屋子照旧用 roomMatrix 画，所以铺满画面那一帧前后一模一样）
 */
export function cameraInside(t: number): Cam {
  const T = NIGHT_T;
  const w = homeWindow();
  const zi = zInside();
  // 推进窗末尾每秒放大多少（对数）：按 pushK 的末速度算
  const zWide = 0.6 * 1.025;
  const v = (Math.log(zi / zWide) * ((0.85 * (6 * 0.85 - 6 * 0.85 ** 2)) / S85)) / (T.inside - T.go);
  const d = Math.max(0, t - T.inside);
  const tau = 0.25;
  return { x: w.x + w.w / 2, y: w.y + w.h / 2, z: zi * Math.exp(v * tau * (1 - Math.exp(-d / tau))), r: 0 };
}

export type { V2 };
