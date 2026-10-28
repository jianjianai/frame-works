// 小石头妈妈那件橘色工装外套单独画的时候（从肩上脱下来、挂在手里、掉下来、堆在地上）：和穿在人身上那件
// （素材库「剪纸角色」cast-wear 按她的线稿画的 workcoat：短款到胯下面一点、立领、五颗深色大扣子、下摆一圈深棕的边）一样。
// 穿在小石头身上是同一件按两个人的身高比放大（大一号、到他大腿中间）。

import type { V2 } from "@materials/剪纸角色/code/rig";
import { INK } from "./world";

export const LEAD = "#8a6a5a";

/**
 * 下摆那一圈深棕的边（缝着铅；画在已经裁好的外套里）：和她身上那件（素材库 cast-wear 按线稿画的工装外套）一样，
 * 一道平平的深棕边、上沿一道线（用户 2026-10-28：「外套换成她现在这件」；原来是旧外套那种一格一格的针脚、每格鼓一块铅）。
 * (x, y) 左上角、w 宽、h 露出来的高（往下多填一截，裁掉）；step 不用了（留着参数，调用的地方不用改）；lw 描边倍数（跟着镜头调细的那个）
 */
export function leadBand(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, _step = 11, lw = 1) {
  g.fillStyle = LEAD;
  g.fillRect(x, y, w, h + 40);
  g.strokeStyle = INK;
  g.lineWidth = 1.6 * lw;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.stroke();
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
