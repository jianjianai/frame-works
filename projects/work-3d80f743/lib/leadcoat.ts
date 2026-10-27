// 小石头妈妈那件橘色工装外套单独画的时候（从肩上脱下来、挂在手里、掉下来、堆在地上）：和穿在人身上那件
// （素材库「剪纸角色」cast-wear 的 workcoat）一样的细节——下摆缝铅的那一圈一格一格的针脚、每格鼓着一块铅，领口一圈立领。

import type { V2 } from "@materials/剪纸角色/code/rig";
import { INK } from "./world";

export const LEAD = "#8a6a5a";
const STITCH = "rgba(250,235,215,0.55)";

/**
 * 下摆缝铅的那一圈（画在已经裁好的外套里）：(x, y) 左上角、w 宽、h 露出来的高（往下多填一截，裁掉）。
 * step 一格多宽，lw 描边倍数（跟着镜头调细的那个）
 */
export function leadBand(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step = 11, lw = 1) {
  g.fillStyle = LEAD;
  g.fillRect(x, y, w, h + 40);
  g.strokeStyle = INK;
  g.lineWidth = 1.6 * lw;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.stroke();
  const lumps = new Path2D();
  const stitch = new Path2D();
  const x0 = Math.ceil(x / step) * step;
  for (let xx = x0; xx <= x + w; xx += step) {
    const c: V2 = [xx + step / 2, y + h * 0.55];
    const rx = step * 0.32;
    lumps.moveTo(c[0] + rx, c[1]);
    lumps.ellipse(c[0], c[1], rx, Math.min(h * 0.3, step * 0.4), 0, 0, Math.PI * 2);
    stitch.moveTo(xx, y + 2.5);
    stitch.lineTo(xx, y + h + 40);
  }
  stitch.moveTo(x, y + 2.6);
  stitch.lineTo(x + w, y + 2.6);
  g.fillStyle = "rgba(255,240,225,0.16)";
  g.fill(lumps);
  g.strokeStyle = STITCH;
  g.lineWidth = 1 * lw;
  g.setLineDash([1.6 * step * 0.14 + 1, 1.6 * step * 0.14 + 1]);
  g.stroke(stitch);
  g.setLineDash([]);
}

/** 立领：沿着领口那道弧（a → 控制点 c → b）往下一道窄边，颜色深一点 */
export function standCollar(g: CanvasRenderingContext2D, a: V2, c: V2, b: V2, h: number, lw = 1) {
  const p = new Path2D();
  p.moveTo(a[0], a[1]);
  p.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  p.lineTo(b[0], b[1] + h);
  p.quadraticCurveTo(c[0], c[1] + h, a[0], a[1] + h);
  p.closePath();
  g.fillStyle = "#e58a3c";
  g.fill(p);
  g.strokeStyle = INK;
  g.lineWidth = 1.6 * lw;
  g.lineJoin = "round";
  g.stroke(p);
}

/** 门襟上一排大扣子 */
export function coatButtons(g: CanvasRenderingContext2D, pts: V2[], r: number, lw = 1) {
  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = "#5a4a40";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.2 * lw;
    g.stroke();
  }
}
