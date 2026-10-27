// 临时：把现在的周磊按线稿坐标（460×820，身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)）画成两倍大的底图，放进 SVG 的对照层。用完删。
// 0–1 正面白底、1–2 正面黑底、2–3 3/4 白底、3–4 3/4 黑底（黑白两张算透明度）；4–5 转身一排头部（看中间的角度）
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { drawFigure, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { figureJoints } from "@materials/剪纸角色/code/figure";

export const sample: Sample = { duration: 8 };
/** 4–5：转身一排（头部放大），看中间的角度 */
const TURN = [0, -0.2, -0.4, -0.6, -0.8, -1, 0.5, 1];
const K = 0.905;
const S = 2;

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const look = lookOf(CAST.周磊);
  const w = CAST.周磊.width ?? 1;
  return {
    canvas,
    render(t) {
      if (t >= 6) {
        // 6–7 正面、7–8 3/4：不穿外衣的基础模型（量胳膊的位置），白底
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#fff";
        g.fillRect(0, 0, width, height);
        const pose = figurePose({ face: t < 7 ? 0 : -1 }, 0.3);
        const hip = figureJoints(pose).hip;
        const r = width / 1080;
        g.setTransform((r * S) / K, 0, 0, (r * S) / K, 229.5 * S * r, 463.8 * S * r);
        g.translate(-hip[0], -hip[1]);
        drawFigure(g, pose);
        return;
      }
      if (t >= 5) {
        // 5–6：关节在线稿坐标里的位置（正面、3/4），写成字
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#fff";
        g.fillRect(0, 0, width, height);
        g.fillStyle = "#000";
        g.font = `${Math.round((26 * width) / 1080)}px monospace`;
        let row = 1;
        for (const face of [0, -1]) {
          const pose = figurePose({ face }, 0.3, look);
          const j = figureJoints(pose, look);
          const h = j.hip;
          for (const key of ["shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "neck", "head"] as const) {
            const p = j[key];
            const X = 229.5 + ((p[0] - h[0]) * w) / K;
            const Y = 463.8 + (p[1] - h[1]) / K;
            g.fillText(`${face} ${key} ${X.toFixed(1)} ${Y.toFixed(1)}`, (20 * width) / 1080, (row++ * 40 * width) / 1080);
          }
        }
        return;
      }
      if (t >= 4) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "#f3e7df";
        g.fillRect(0, 0, width, height);
        const r = width / 1080;
        TURN.forEach((face, k) => {
          const pose = figurePose({ face }, 0.3, look);
          const x0 = (k % 4) * 270;
          const y0 = 300 + Math.floor(k / 4) * 420;
          g.save();
          g.setTransform(r, 0, 0, r, 0, 0);
          g.beginPath();
          g.rect(x0 + 4, y0 + 4, 262, 412);
          g.clip();
          g.setTransform(r * 1.9, 0, 0, r * 1.9, r * (x0 + 135), r * (y0 + 1160));
          drawFigure(g, pose, look);
          g.restore();
        });
        return;
      }
      const i = Math.min(3, Math.floor(t));
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = i % 2 ? "#000" : "#fff";
      g.fillRect(0, 0, width, height);
      const pose = figurePose({ face: i < 2 ? 0 : -1 }, 0.3, look);
      const hip = figureJoints(pose, look).hip;
      // 线稿像素 → 画布 ×2；角色单位 → 线稿像素 ÷0.905；胯放到 (229.5, 463.8)（体型宽时整个人以 x = 0 横着放大）
      const r = width / 1080;
      g.setTransform((r * S) / K, 0, 0, (r * S) / K, 229.5 * S * r, 463.8 * S * r);
      g.translate(-hip[0] * w, -hip[1]);
      drawFigure(g, pose, look);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
