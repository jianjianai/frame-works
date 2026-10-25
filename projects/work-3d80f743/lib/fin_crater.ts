// 重做的「活」（114.013）：他穿着她的铁靴跺下去——全片最重的一下：街面陷下去一个坑、裂缝一路裂开、碎块崩起来、灰扬起来、一圈震波。
// 画法照 lib/stomp.ts（那里的时刻和位置是旧的四⑦那一版），这里按 lib/fin_t.ts 的时刻、他落地的地方（K_LAND）。

import { seeded } from "@frame/engine/math";
import { E, kick, ph } from "./cam";
import { T9 } from "./fin_t";
import { K_LAND } from "./fin_cast";

type V2 = [number, number];
/** 坑在哪：两只铁靴底下 */
const CX = K_LAND[0] - 14;
const RX = 230;
const RY = 40;
const CY = 14;
const open = (t: number) => E.out(ph(t, T9.stomp, T9.stomp + 0.06));

const CRACKS = (() => {
  const r = seeded(5101);
  const out: { pts: V2[]; wall: boolean; w: number }[] = [];
  const zig = (from: V2, dir: V2, len: number, squash: number, n: number): V2[] => {
    const pts: V2[] = [from];
    let [x, y] = from;
    for (let i = 1; i <= n; i++) {
      const step = len / n;
      const jx = (r() - 0.5) * step * 0.7;
      const jy = (r() - 0.5) * step * 0.7;
      x += dir[0] * step + jx * Math.abs(dir[1]);
      y += (dir[1] * step + jy * Math.abs(dir[0])) * squash;
      pts.push([x, y]);
    }
    return pts;
  };
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (0.05 + (0.9 * k) / 8) + (r() - 0.5) * 0.2;
    const dir: V2 = [Math.cos(a) * (k % 2 ? 1 : -1), Math.sin(a)];
    const from: V2 = [CX + RX * 0.92 * dir[0], CY + RY * 0.92 * Math.abs(dir[1])];
    out.push({ pts: zig(from, [dir[0], Math.abs(dir[1])], 300 + r() * 420, 0.32, 7), wall: false, w: 1 - k * 0.04 });
  }
  for (let k = 0; k < 5; k++) {
    const x0 = CX + (k - 2) * 95 + (r() - 0.5) * 40;
    const main = zig([x0, -8], [(r() - 0.5) * 0.5, -1], 260 + r() * 300, 1, 6);
    out.push({ pts: main, wall: true, w: 0.9 });
    const mid = main[3];
    out.push({ pts: zig(mid, [(r() < 0.5 ? -1 : 1) * 0.8, -0.6], 90 + r() * 120, 1, 3), wall: true, w: 0.6 });
  }
  return out;
})();
const DEBRIS = (() => {
  const r = seeded(5102);
  return Array.from({ length: 22 }, () => {
    const a = Math.PI * (0.1 + 0.8 * r());
    return {
      x: CX + Math.cos(a) * RX * (0.5 + 0.4 * r()) * (r() < 0.5 ? 1 : -1),
      vx: (r() - 0.5) * 900,
      vy: -(500 + r() * 900),
      s: 7 + r() * 13,
      spin: (r() - 0.5) * 18,
      shade: r() < 0.5 ? "#9a8676" : "#b9a594",
    };
  });
})();
/** 坑和裂缝（街面、墙上；人之前） */
export function drawCrater(g: CanvasRenderingContext2D, t: number, z: number) {
  const k = open(t);
  if (k <= 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const grow = E.out(ph(t, T9.stomp, T9.stomp + 0.32));
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const c of CRACKS) {
    const n = c.pts.length - 1;
    const upto = grow * n;
    const path = new Path2D();
    path.moveTo(c.pts[0][0], c.pts[0][1]);
    for (let i = 1; i <= n; i++) {
      if (i - 1 > upto) break;
      const f = Math.min(1, upto - (i - 1));
      const [ax, ay] = c.pts[i - 1];
      const [bx, by] = c.pts[i];
      path.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
    }
    g.strokeStyle = "rgba(255,240,220,0.55)";
    g.lineWidth = (c.wall ? 4 : 5) * c.w * lw;
    g.save();
    g.translate(2.5 * lw, 2.5 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#5a4640";
    g.lineWidth = (c.wall ? 3.4 : 4.4) * c.w * lw;
    g.stroke(path);
  }
  const rx = RX * k;
  const ry = RY * k;
  const pit = new Path2D();
  pit.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2);
  const gr = g.createRadialGradient(CX, CY + ry * 0.2, 0, CX, CY, rx);
  gr.addColorStop(0, "#4a3a36");
  gr.addColorStop(0.7, "#6d5a52");
  gr.addColorStop(1, "#8d7a6c");
  g.fillStyle = gr;
  g.fill(pit);
  g.strokeStyle = "#3f322f";
  g.lineWidth = 3.4 * lw;
  g.stroke(pit);
  g.restore();
}
/** 坑的前沿（铁靴后画：靴底陷在坑里） */
export function drawCraterFront(g: CanvasRenderingContext2D, t: number, z: number) {
  const k = open(t);
  if (k <= 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const rx = RX * k;
  const ry = RY * k;
  g.save();
  const lip = new Path2D();
  lip.ellipse(CX, CY, rx, ry, 0, 0.12 * Math.PI, 0.88 * Math.PI);
  lip.ellipse(CX, CY + 10, rx * 1.04, ry * 1.25, 0, 0.88 * Math.PI, 0.12 * Math.PI, true);
  lip.closePath();
  g.fillStyle = "#b8a391";
  g.fill(lip);
  g.strokeStyle = "#5a4640";
  g.lineWidth = 3 * lw;
  g.stroke(lip);
  g.restore();
}
/** 碎块、灰、震波 */
export function drawStompBurst(g: CanvasRenderingContext2D, t: number, z: number) {
  const d = t - T9.stomp;
  if (d < 0 || d > 1.4) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  g.save();
  if (d < 0.45) {
    const u = d / 0.45;
    g.strokeStyle = `rgba(255,246,230,${0.7 * (1 - u)})`;
    g.lineWidth = (14 - 10 * u) * lw;
    g.beginPath();
    g.ellipse(CX, CY + 6, RX + 900 * E.out(u), RY + 160 * E.out(u), 0, 0, Math.PI * 2);
    g.stroke();
  }
  const u = Math.min(1, d / 1.2);
  const a = 0.6 * (1 - u) ** 1.3;
  g.fillStyle = `rgba(236,224,210,${a})`;
  for (const [dx, sz, kk] of [
    [-1, 1, 0],
    [1, 1.1, 1],
    [-0.55, 0.8, 2],
    [0.6, 0.85, 3],
    [-1.4, 0.65, 4],
    [1.45, 0.7, 5],
  ] as const) {
    g.beginPath();
    g.ellipse(CX + dx * (150 + 380 * E.out(u)), -30 - 90 * u - kk * 10, (110 + 170 * u) * sz, (50 + 70 * u) * sz, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (const p of DEBRIS) {
    const x = p.x + p.vx * d;
    const y = CY - 6 + p.vy * d + 0.5 * 3200 * d * d;
    if (y > CY + 30 && d > 0.15) continue;
    g.save();
    g.translate(x, y);
    g.rotate(p.spin * d);
    g.fillStyle = p.shade;
    g.strokeStyle = "#5a4640";
    g.lineWidth = 2.4 * lw;
    g.beginPath();
    g.moveTo(-p.s * 0.6, -p.s * 0.3);
    g.lineTo(p.s * 0.4, -p.s * 0.5);
    g.lineTo(p.s * 0.6, p.s * 0.35);
    g.lineTo(-p.s * 0.3, p.s * 0.5);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }
  g.restore();
}
/** 跺下去那一下画面一亮、一震 */
export const stompFlash = (t: number) => 0.4 * kick(t, T9.stomp, 0.1);
export const stompShake = (t: number) => 26 * kick(t, T9.stomp, 0.12);
