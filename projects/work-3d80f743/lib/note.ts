// 字：签字笔手写体（龙藏体），深色的字外面一圈柔和的亮边，亮的天上、暖色的楼前都看得清。
// 和她写在砖上的「活下去」是同一只手：一个字一个字写出来，淡出时往上飘一点。

import { assetUrl } from "@frame/engine/types";
import { INK } from "./world";
import { clamp01 } from "./cam";

export const HAND_FONT = "LongCang";

let loading: Promise<void> | null = null;
export function loadHandFont() {
  loading ??= (async () => {
    const face = new FontFace(HAND_FONT, `url(${assetUrl("films/work-3d80f743/fonts/LongCang-Regular.ttf")})`);
    document.fonts.add(await face.load());
  })();
  return loading;
}

export interface Note {
  text: string;
  /** 中心（设计坐标） */
  x: number;
  y: number;
  rot: number;
  /** 开始写、离开的时刻 */
  in: number;
  out: number;
  /** 写一个字多久；0 = 第一帧就写好 */
  perChar?: number;
  size?: number;
}

export function drawNote(g: CanvasRenderingContext2D, base: DOMMatrix, n: Note, t: number) {
  if (t < n.in || t > n.out + 0.5) return;
  const size = n.size ?? 74;
  g.setTransform(base);
  g.font = `${size}px ${HAND_FONT}, "PingFang SC", sans-serif`;
  const chars = [...n.text];
  const widths = chars.map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const leave = clamp01((t - n.out) / 0.5);
  const alpha = 1 - leave;
  if (alpha <= 0) return;
  g.save();
  g.translate(n.x, n.y - 24 * leave * leave);
  g.rotate(n.rot);
  g.textBaseline = "middle";
  const per = n.perChar ?? 0.065;
  let x = -total / 2;
  chars.forEach((ch, i) => {
    const k = per <= 0 ? 1 : clamp01((t - n.in - i * per) / (per * 1.6));
    if (k > 0) {
      g.save();
      g.beginPath();
      g.rect(x - 10, -size, (widths[i] + 20) * k, size * 2);
      g.clip();
      g.globalAlpha = alpha;
      // 亮边：两层柔光
      g.shadowColor = "rgba(255,250,240,0.95)";
      g.shadowBlur = size * 0.32;
      g.fillStyle = "rgba(255,250,240,0.9)";
      g.fillText(ch, x, 0);
      g.shadowBlur = size * 0.12;
      g.fillText(ch, x, 0);
      g.shadowBlur = 0;
      g.fillStyle = INK;
      g.fillText(ch, x, 0);
      g.restore();
    }
    x += widths[i];
  });
  g.restore();
}
