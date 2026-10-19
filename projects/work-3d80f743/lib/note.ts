// 字：介绍故事背景的设定字（用户 2026-10-19：「文字改成更明显的，一次全部显示，慢慢淡出」「颜色和位置也要调整，好看一点，
// 用好分辨一点的字体，注意抖音视频安全区」）。
// 思源宋体粗体（public/fonts/NotoSerifSC-Bold-subset.woff2：只截了这几句用到的字，改字要重新截，见 AGENTS.md），
// 深暖棕色的字、外面一圈柔和的米白光，关键词用暖赭红色点一下；整句第一帧就在，到点以后慢慢淡出（往上飘一点）。
// 字是不变的：每句只画一次存成图，之后每帧只贴图。
// 砖上的「活下去」还是签字笔手写体（龙藏体，HAND_FONT），那是她的手写。

import { assetUrl } from "@frame/engine/types";
import { clamp01 } from "./cam";

export const HAND_FONT = "LongCang";
const NOTE_FONT = "NoteSerif";

let loading: Promise<void> | null = null;
export function loadHandFont() {
  loading ??= (async () => {
    const faces = [
      new FontFace(HAND_FONT, `url(${assetUrl("films/work-3d80f743/fonts/LongCang-Regular.ttf")})`),
      new FontFace(NOTE_FONT, `url(${assetUrl("films/work-3d80f743/fonts/NotoSerifSC-Bold-subset.woff2")})`, { weight: "700" }),
    ];
    for (const f of await Promise.all(faces.map((f) => f.load()))) document.fonts.add(f);
  })();
  return loading;
}

export interface Note {
  text: string;
  /** 关键词（整句里的一段），用暖赭红色 */
  accent?: string;
  /** 中心（设计坐标） */
  x: number;
  y: number;
  /** 出现（整句一下子在）、开始淡出的时刻 */
  in: number;
  out: number;
  /** 淡出用多久 */
  fade?: number;
  size?: number;
}

const INK_TEXT = "#3a2629";
const ACCENT = "#b4472f";
const GLOW = "rgba(255,247,234,0.95)";
const cache = new Map<Note, { img: HTMLCanvasElement; k: number }>();

/** 整句画进一张图 */
function render(n: Note, k: number) {
  const size = n.size ?? 52;
  const font = `700 ${size}px ${NOTE_FONT}, "Noto Serif SC", "Songti SC", serif`;
  const spacing = size * 0.06;
  // 分成 前 / 关键词 / 后 三段
  const i = n.accent ? n.text.indexOf(n.accent) : -1;
  const parts: { s: string; c: string }[] =
    i < 0
      ? [{ s: n.text, c: INK_TEXT }]
      : [
          { s: n.text.slice(0, i), c: INK_TEXT },
          { s: n.accent!, c: ACCENT },
          { s: n.text.slice(i + n.accent!.length), c: INK_TEXT },
        ].filter((p) => p.s);
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const widthOf = (s: string) => probe.measureText(s).width + spacing * [...s].length;
  const widths = parts.map((p) => widthOf(p.s));
  const w = widths.reduce((a, b) => a + b, 0);
  const pad = size * 0.8;
  const img = document.createElement("canvas");
  img.width = Math.ceil((w + pad * 2) * k);
  img.height = Math.ceil((size + pad * 2) * k);
  const g = img.getContext("2d")!;
  g.scale(k, k);
  g.font = font;
  g.textBaseline = "middle";
  g.lineJoin = "round";
  // 一个字一个字排（字距一致，关键词换色）
  const each = (fn: (ch: string, x: number, color: string) => void) => {
    let x = pad;
    parts.forEach((p) => {
      for (const ch of p.s) {
        fn(ch, x, p.c);
        x += probe.measureText(ch).width + spacing;
      }
    });
  };
  const y = pad + size / 2;
  // 柔光（两层）+ 一圈细的米白边，把字从亮的天、暖色的楼、树前面托出来
  g.shadowColor = GLOW;
  g.strokeStyle = "rgba(255,250,242,0.92)";
  g.lineWidth = size * 0.13;
  for (const blur of [size * 0.55, size * 0.25]) {
    g.shadowBlur = blur;
    each((ch, x) => g.strokeText(ch, x, y));
  }
  g.shadowBlur = 0;
  each((ch, x) => g.strokeText(ch, x, y));
  each((ch, x, c) => {
    g.fillStyle = c;
    g.fillText(ch, x, y);
  });
  return img;
}

export function drawNote(g: CanvasRenderingContext2D, base: DOMMatrix, n: Note, t: number) {
  const fade = n.fade ?? 0.8;
  if (t < n.in || t > n.out + fade) return;
  const leave = clamp01((t - n.out) / fade);
  // 慢慢淡出：开头慢、中间快、最后慢
  const alpha = 1 - leave * leave * (3 - 2 * leave);
  if (alpha <= 0) return;
  const k = Math.max(1, Math.hypot(base.a, base.b));
  let c = cache.get(n);
  if (!c || c.k !== k) cache.set(n, (c = { img: render(n, k), k }));
  g.save();
  g.setTransform(base);
  g.translate(n.x, n.y - 12 * leave);
  g.scale(1 / c.k, 1 / c.k);
  g.globalAlpha = alpha;
  g.drawImage(c.img, -c.img.width / 2, -c.img.height / 2);
  g.restore();
}
