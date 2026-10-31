// 副歌一⑥⑦ 妈妈碰到白（画面外）以后：天上炸开彩色的光，灰像雪一样落下来（2026-10-22 用户重做：「主角和孩子拥抱，镜头不动，
// 上方发出彩色的光，小刀从天上掉下来」）。52.517（「至少我还在为你而歌唱」的「还」，拍）一圈圈像肥皂泡边一样的彩色光环从画面上方压下来，
// 白往下打几道光，整个画面一亮，照在地上仰着头的两个人脸上；镜头不动。人和小刀在 lib/mother.ts，镜头在 lib/streetcam.ts。

import { seeded } from "@frame/engine/math";
import { moteSprite } from "./world";
import { H, W } from "./cam";
import { MOM_X } from "./dawn";
import { MT } from "./mother";

type V2 = [number, number];

export const ASH_T = {
  start: 53.94,
  /** 她碰到白（拍，画面外）：天上炸开彩色的光 */
  touch: MT.touch,
  end: MT.end,
};

/** 彩色的光从哪里炸开：两个人头顶的天上（⑥不动的那个取景的上边外面一点，光环往下压进画面） */
export const burstAt = (): V2 => [MOM_X + 40, -1500];

/** 像雪一样往下落的灰：在他们头顶那一片天上，从上往下一层层显出来（灰落下来的样子），慢慢飘落；街上那一块多一些（镜头最后落在这里） */
const FLAKES = (() => {
  const r = seeded(55);
  const out: { x: number; y: number; v: number; s: number; ph: number; glow: boolean }[] = [];
  for (let i = 0; i < 240; i++) out.push({ x: -2380 + (r() - 0.5) * 2200, y: -3300 + r() * 3300, v: 70 + r() * 90, s: 5 + r() * 10, ph: r() * 6.28, glow: r() < 0.25 });
  for (let i = 0; i < 80; i++) out.push({ x: -2390 + (r() - 0.5) * 1100, y: -1500 + r() * 1500, v: 50 + r() * 60, s: 6 + r() * 9, ph: r() * 6.28, glow: r() < 0.25 });
  return out;
})();
export function drawSnow(g: CanvasRenderingContext2D, t: number, z: number) {
  const d = t - ASH_T.touch;
  if (d < 0.2) return;
  const spr = moteSprite();
  g.save();
  for (const f of FLAKES) {
    // 从上往下一层层显出来
    const delay = 0.2 + ((f.y + 3300) / 3300) * 0.75;
    const y = f.y + f.v * (d - delay);
    // 落到街面上就没了；六秒以后都落完了（间奏接回现在时已经是早上，地上不留）
    const a = Math.min(1, Math.max(0, (d - delay) / 0.5)) * Math.min(1, Math.max(0, -y / 40)) * (1 - Math.min(1, Math.max(0, (d - 4) / 2)));
    if (a <= 0) continue;
    const x = f.x + 26 * Math.sin(t * 1.3 + f.ph) + 12 * Math.sin(t * 2.9 + f.ph * 2);
    const r = Math.max(1.8 / z, f.s * 0.62);
    const tw = 0.7 + 0.3 * Math.sin(t * 4 + f.ph * 3);
    g.globalAlpha = a * tw * 0.92;
    // 灰：淡紫灰（在粉色的墙前面也看得出来），有的发着一点光
    g.fillStyle = f.glow ? "#f3e2d0" : "#b49eb2";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    if (f.glow) {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = a * tw * 0.45;
      g.drawImage(spr, x - r * 4, y - r * 4, r * 8, r * 8);
      g.globalCompositeOperation = "source-over";
    }
  }
  g.restore();
}

/**
 * 天上那一大片彩色的光：从画面上方漫下来（肥皂泡那几种淡彩，screen 叠，只提亮），炸开时最亮，慢慢淡掉（画面坐标）
 */
export function drawSkyBloom(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  const d = t - ASH_T.touch;
  if (d < 0 || d > 2.2) return;
  const k = Math.min(1, d / 0.1) * Math.exp(-Math.max(0, d - 0.15) / 0.75);
  if (k < 0.01) return;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "screen";
  const r = 900 + 900 * (1 - Math.exp(-d / 0.35));
  const gr = g.createRadialGradient(540, -160, 40, 540, -160, r);
  gr.addColorStop(0, `rgba(255,252,246,${0.85 * k})`);
  gr.addColorStop(0.25, `rgba(255,214,236,${0.5 * k})`);
  gr.addColorStop(0.45, `rgba(214,236,255,${0.38 * k})`);
  gr.addColorStop(0.62, `rgba(220,255,226,${0.26 * k})`);
  gr.addColorStop(0.8, `rgba(255,240,200,${0.14 * k})`);
  gr.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.restore();
}

/** 炸开那一下整个画面亮一下 */
export const ashFlash = (t: number) => (t < ASH_T.touch ? 0 : 0.6 * Math.exp(-(t - ASH_T.touch) / 0.2));
/** 白往下打的光：炸开以后亮起来，慢慢淡掉 */
export const ashRays = (t: number) => (t < ASH_T.touch ? 0 : Math.min(1, (t - ASH_T.touch) / 0.12) * Math.exp(-Math.max(0, t - ASH_T.touch - 0.3) / 0.9));

