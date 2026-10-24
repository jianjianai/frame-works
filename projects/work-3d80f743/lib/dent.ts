// 第一幕：哑铃从半空砸在街面上——石板被砸出一个浅坑、裂缝往四周裂开，碎屑崩起来。
// 比五「引力」那一下跺地（lib/stomp.ts，全片最重）小得多：只在街面上，不裂到墙上。坐标是世界坐标（街面 y = 0）。

import { seeded } from "@frame/engine/math";
import { E, ph } from "./cam";

type V2 = [number, number];
/** 坑多大（街面是斜着看过去的，竖着压扁） */
const RX = 110;
const RY = 20;

const CRACKS = (() => {
  const r = seeded(4513);
  const out: { pts: V2[]; w: number }[] = [];
  for (let k = 0; k < 8; k++) {
    const a = Math.PI * (0.04 + (0.92 * k) / 7) + (r() - 0.5) * 0.25;
    const dir: V2 = [Math.cos(a) * (k % 2 ? 1 : -1), Math.abs(Math.sin(a))];
    let x = RX * 0.9 * dir[0];
    let y = RY * 0.6 * dir[1];
    const pts: V2[] = [[x, y]];
    const n = 5;
    const len = 150 + r() * 230;
    for (let i = 1; i <= n; i++) {
      const step = len / n;
      x += dir[0] * step + (r() - 0.5) * step * 0.6 * dir[1];
      y += (dir[1] * step + (r() - 0.5) * step * 0.6 * Math.abs(dir[0])) * 0.3;
      pts.push([x, y]);
    }
    out.push({ pts, w: 1 - k * 0.05 });
    // 中途分个叉
    const m = pts[2];
    const b: V2[] = [m];
    let [bx, by] = m;
    for (let i = 0; i < 2; i++) {
      bx += dir[0] * 35 + (r() - 0.5) * 30;
      by += (dir[1] * 35 + (r() - 0.5) * 20) * 0.3 + 4;
      b.push([bx, by]);
    }
    out.push({ pts: b, w: 0.6 });
  }
  return out;
})();
const CHIPS = (() => {
  const r = seeded(4514);
  return Array.from({ length: 16 }, () => ({
    x: (r() - 0.5) * RX * 1.4,
    vx: (r() - 0.5) * 700,
    vy: -(400 + r() * 700),
    s: 5 + r() * 9,
    spin: (r() - 0.5) * 16,
    shade: r() < 0.5 ? "#9a8676" : "#b9a594",
  }));
})();

/** 坑、裂缝（街面上，砸下去的东西之前画）和崩起来的碎屑。cx 坑中心，t0 砸下去的时刻 */
export function drawDent(g: CanvasRenderingContext2D, cx: number, t0: number, t: number, z: number) {
  const a = t - t0;
  if (a < 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const k = E.out(ph(a, 0, 0.05));
  const grow = E.out(ph(a, 0, 0.22));
  g.save();
  g.translate(cx, 6);
  // 坑：深色的底、一圈亮边
  const pit = new Path2D();
  pit.ellipse(0, 0, RX * k, RY * k, 0, 0, Math.PI * 2);
  const gr = g.createRadialGradient(0, RY * 0.2, 0, 0, 0, RX);
  gr.addColorStop(0, "#5a4842");
  gr.addColorStop(0.75, "#7a665c");
  gr.addColorStop(1, "#9a8676");
  g.fillStyle = gr;
  g.fill(pit);
  g.strokeStyle = "#4a3a36";
  g.lineWidth = 3 * lw;
  g.stroke(pit);
  // 裂缝：0.22 秒里长出来
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
    g.strokeStyle = "rgba(255,240,220,0.5)";
    g.lineWidth = 4 * c.w * lw;
    g.save();
    g.translate(2 * lw, 2 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#5a4640";
    g.lineWidth = 3.4 * c.w * lw;
    g.stroke(path);
  }
  // 碎屑：崩起来、转着落回街面
  if (a < 0.9) {
    for (const p of CHIPS) {
      const x = p.x + p.vx * a;
      const y = -10 + p.vy * a + 0.5 * 5200 * a * a;
      if (y > 4) continue;
      g.save();
      g.translate(x, y);
      g.rotate(p.spin * a);
      g.fillStyle = p.shade;
      g.strokeStyle = "#5a4640";
      g.lineWidth = 1.6 * lw;
      g.beginPath();
      g.moveTo(-p.s, -p.s * 0.4);
      g.lineTo(p.s * 0.7, -p.s * 0.6);
      g.lineTo(p.s, p.s * 0.5);
      g.lineTo(-p.s * 0.5, p.s * 0.6);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
  }
  g.restore();
}
