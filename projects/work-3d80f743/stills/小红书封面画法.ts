// 小红书封面（stills/小红书封面*.ts，3:4 1080×1440）几张共用的画法；这里不导出 createScene（不是静帧本身）。
// 成片的一帧、整张的柔光、夜里的字（暖白字 + 深色晕，成片里夜里歌词的样子）。
import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene, type VisualDocument } from "@frame/engine/compositor";
import { LOADERS } from "./抖音封面画法";

export type Doc = VisualDocument;
const withoutLyrics = (doc: Doc): Doc => ({ ...doc, clips: doc.clips.filter((c) => !(c.source.kind === "scene" && c.source.module === "lyrics")) });

/** 一条时间轴这一刻的画面（全部图层，不带歌词），画布 w×h */
export async function filmFrame(options: SceneOptions, doc: Doc, w: number, h: number, t: number, signal: AbortSignal) {
  const film = createCompositionScene({ ...options, width: Math.round(w), height: Math.round(h) }, withoutLyrics(doc), LOADERS);
  try {
    await film.prepareFrame!(t, { signal });
    await film.render(t);
    const c = document.createElement("canvas");
    c.width = film.canvas.width;
    c.height = film.canvas.height;
    c.getContext("2d")!.drawImage(film.canvas, 0, 0);
    return c;
  } finally {
    film.dispose();
  }
}

/** 柔光：把画好的整张虚化后柔光、滤色各叠一层薄的——亮处（灯、发光的砖）晕开，暗处更实 */
export function bloom(g: CanvasRenderingContext2D, k: number) {
  const snap = document.createElement("canvas");
  snap.width = g.canvas.width;
  snap.height = g.canvas.height;
  snap.getContext("2d")!.drawImage(g.canvas, 0, 0);
  for (const [op, alpha, radius] of [["soft-light", 0.4, 14], ["screen", 0.14, 26]] as const) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = op;
    g.globalAlpha = alpha;
    g.filter = `blur(${Math.round(radius * k)}px)`;
    g.drawImage(snap, 0, 0);
    g.restore();
  }
}

export const CREAM = "#fff3e2";
export const AMBER = "#f5ae45";

/** 一行夜里的字，中心在 (x, y)：暖白字、关键词琥珀色（台灯、围巾、发光的砖的颜色），外面一圈深色晕（成片里夜里歌词的样子） */
export function nightLine(g: CanvasRenderingContext2D, k: number, family: string, text: string, accent: string, x: number, y: number, size: number) {
  g.save();
  g.font = `700 ${size}px ${family}, "Noto Serif SC", serif`;
  g.textBaseline = "middle";
  g.textAlign = "left";
  const spacing = size * 0.06;
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  const hot0 = accent ? text.indexOf(accent) : -1;
  let px = x - total / 2;
  const glyphs = chars.map((ch, i) => {
    const glyph = { ch, x: px, hot: hot0 >= 0 && i >= hot0 && i < hot0 + accent.length };
    px += widths[i] + spacing;
    return glyph;
  });
  g.shadowColor = "rgba(20,10,12,0.85)";
  for (const blur of [size * 0.5, size * 0.18]) {
    g.shadowBlur = blur * k;
    for (const { ch, x: gx, hot } of glyphs) {
      g.fillStyle = hot ? AMBER : CREAM;
      g.fillText(ch, gx, y);
    }
  }
  g.restore();
}
