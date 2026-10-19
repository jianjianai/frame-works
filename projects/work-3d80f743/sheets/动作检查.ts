// 素材库「剪纸角色」秤砣的动作检查表（不在时间轴上）：每一秒一页，每行按时间取几帧。
// 0 秒：走、跑、站、飘，1 秒：跳起来抓、跪下递砖、打招呼、摸头，2 秒：放大看跳起抓落地、跪着递砖。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { drawChengtuo, holdBrick, greet, jumpGrab, kneelGive, patHead, run, stand, walk, float, JUMP_GRAB, KNEEL_GIVE } from "@materials/剪纸角色/code/chengtuo";
import type { MoveFrame } from "@materials/剪纸角色/code/chengtuo";

export const sample: Sample = { duration: 3 };

const W = 1080;
const H = 1920;

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, size = 30) {
  g.font = `${size}px sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillStyle = "#2b2630";
  g.fillText(text, x, y);
}

/** 一行动作：按 times 取帧，gaitRow 时不跟根的 x（走、跑会一直往左走） */
function motionRow(g: CanvasRenderingContext2D, row: number, rows: number, name: string, times: number[], at: (t: number) => MoveFrame & { hasBrick?: boolean }, gaitRow = false) {
  const rh = H / rows;
  const top = row * rh;
  const cw = W / times.length;
  const gy = top + rh - 34;
  g.fillStyle = "rgba(90,70,110,0.08)";
  g.fillRect(0, gy, W, 4);
  label(g, name, 90, top + 8, 26);
  const s = Math.min(rows <= 2 ? 1 : 0.55, (rh - 70) / 860, cw / 300);
  times.forEach((tt, i) => {
    const f = at(tt);
    const cx = i * cw + cw / 2;
    g.save();
    g.translate(cx + (gaitRow ? 0 : f.x * s), gy);
    g.scale(s, s);
    drawChengtuo(g, f.pose, f.hasBrick ? { hold: { L: holdBrick } } : {});
    g.restore();
    label(g, tt.toFixed(2), cx, gy + 6, 20);
  });
}

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;

  return {
    canvas,
    render(t) {
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      g.fillStyle = "#f7ede8";
      g.fillRect(0, 0, W, H);
      const page = Math.min(2, Math.floor(t));
      if (page === 0) {
        const cyc = (n: number, len: number) => Array.from({ length: n }, (_, i) => (i * len) / n);
        motionRow(g, 0, 4, "走 walk", cyc(8, 1.0), (tt) => walk(tt), true);
        motionRow(g, 1, 4, "跑 run", cyc(8, 0.6), (tt) => run(tt), true);
        motionRow(g, 2, 4, "站 stand", [0, 1, 2, 3, 4], (tt) => stand(tt));
        motionRow(g, 3, 4, "飘 float", [0, 1.5, 3, 4.5, 6], (tt) => float(tt));
      } else if (page === 2) {
        // 放大看：跳起抓往下坠到落地，跪着递砖
        motionRow(g, 0, 2, "跳起抓 下坠→落地", [1.76, 1.8, 1.833, 1.866, 1.9], (tt) => jumpGrab(tt));
        motionRow(g, 1, 2, "跪下递砖", [KNEEL_GIVE.pull, KNEEL_GIVE.give + 0.35, KNEEL_GIVE.rise + 0.2], (tt) => kneelGive(tt));
      } else {
        const J = JUMP_GRAB;
        const K = KNEEL_GIVE;
        motionRow(g, 0, 4, "跳起抓 jumpGrab", [0, 0.25, J.crouch, J.launch, J.grab, J.apex, J.land, J.land + 0.12, 2.6], (tt) => jumpGrab(tt));
        motionRow(g, 1, 4, "跪下递砖 kneelGive", [0, K.kneel, K.reach, K.pull, K.give, K.give + 0.35, K.rise, K.stood, K.heel], (tt) => kneelGive(tt));
        motionRow(g, 2, 4, "打招呼 greet", [0, 0.35, 0.6, 0.9, 1.2, 1.6], (tt) => greet(tt));
        motionRow(g, 3, 4, "摸头 patHead", [0, 0.45, 0.7, 0.95, 1.2, 1.75], (tt) => patHead(tt));
      }
    },
    dispose() {},
  };
}
