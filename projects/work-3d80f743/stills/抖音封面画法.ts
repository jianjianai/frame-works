// 抖音封面的两种规格（用户 2026-10-30：「制作抖音的两个规格的封面」）：创作者中心发布时要的竖封面 3:4（1080×1440：个人主页、
// 双列信息流）和横封面 4:3（1440×1080：搜索、电脑网页）。四版（VERSIONS），每版竖、横各一个静帧：
// - 「标题」（stills/抖音竖封面.ts、抖音横封面.ts）：字是抖音的标题「她拽住了全城飘起来的人 / 可谁来拽住她？」。
//   竖：她光着脚飘到白的边上、张开手、发梢化成光（成片 1:51.0），两行字压在顶上的白里。横：左右两格——左边她跳起来攥住
//   阿满的脚踝（1:24.95），右边同一个她一个人飘向白（1:51.0），每格顶上一句。
// - 「首帧」（stills/抖音竖封面-首帧字.ts、抖音横封面-首帧字.ts；用户：「用首帧的文字再做两版」）：画面和「标题」一样，
//   字换成首帧的两句设定字「这里的人，一绝望就会飘起来 / 飘进天上的强光，就会化成灰」。左格阿满正飘起来、右格她化成光，
//   正好各对一句。
// - 「引力」（stills/抖音竖封面-引力.ts、抖音横封面-引力.ts；用户：「再设计一版」）：故事的一句话「人不是被地拉住的 /
//   是被人拉住的」，画面是 2:14.90 她抱住他、砖亮着、老钟在下面攥着他的脚踝——一个拉一个，整个故事在一张图里。前两版是
//   她一个人、淡的天，这版是结局的暖光，直接说破。
// - 「最沉」（stills/抖音竖封面-最沉.ts、抖音横封面-最沉.ts；用户：「来个不剧透的」）：只用前半段的东西——0:28.80 她从楼顶
//   扑出去，在半空抱住飘起来的千斤（铁靴吊在下面），四周是空的天；字是成片里的设定字「城里都说，她是 / 最沉的人」
//   （「城里都说」暗示她不只是这样，但不说是什么）。
// 后两版第一次做成海报：大大的片名「引力」（字距拉开）+ 小字的一句话，「最沉」用的是 0:06.20 她在楼前半空攥住周磊的
// 脚踝，满屏的楼面没有干净的地方，字只能挤在边上。用户先说「太小了，看不清」，放大成竖排两列以后「这排版又太丑了」。
// 现在四版都是同一种排法：两行横排的字压在干净的天上，前半句小、后半句（钩子）大，钩子里的关键词暖赭红；不放片名。
// 画面就是成片那一刻（全部图层，只去掉歌词层），按成片 1080×1920 的设计坐标取景。字用设定字那一套（思源宋体粗体、深暖棕、
// 关键词暖赭红、米白光）。字体都是只截了用到的字的子集，改字要重新截（见 AGENTS.md「设定字」）：「标题」「引力」用
// public/fonts/NotoSerifSC-Bold-cover.woff2，「首帧」就用成片设定字那个文件（NotoSerifSC-Bold-subset.woff2），
// 「最沉」用 NotoSerifSC-Bold-cover-zuichen.woff2（见 FONTS）。
// 这里不导出 createScene（不是静帧本身）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { createCompositionScene, type SceneLoaders, type VisualDocument } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

/** 和 scene.ts 一样的模块（歌词层去掉了，用不到它） */
export const LOADERS: SceneLoaders = {
  act1: () => import("../scenes/act1"),
  act2: () => import("../scenes/act2"),
  act3: () => import("../scenes/act3"),
  act4: () => import("../scenes/act4"),
  act5: () => import("../scenes/act5"),
  act6: () => import("../scenes/act6"),
  finale: () => import("../scenes/finale"),
  recall: () => import("../scenes/recall"),
};

/** 成片的设计尺寸 */
const W = 1080;
const H = 1920;
/** 她跳起来攥住阿满的脚踝（三「明天见」：铁靴离了地，两个人一起往上升） */
const T_GRAB = 84.95;
/** 她飘到白的边上，张开手，发梢化成光 */
const T_EDGE = 111.0;
/** 她翻过来抱住他，砖在两个人中间亮着，老钟在下面攥着他的脚踝 */
const T_HUG = 134.9;
/** 第二幕：她从楼顶扑出去，在半空抱住飘起来的千斤（两个人的头顶在设计 y 721、脸 495,811 / 631,833，千斤的鞋底 372,1441，
 *  她的铁靴底 800,1498；左下角是楼顶的栏杆和楼角，x < 230），四周是空的天 */
const T_CATCH = 28.8;

const INK = "#3a2629";
const ACCENT = "#b4472f";
const GLOW = "rgba(255,247,234,0.95)";

// 每版的字体文件定了就不再重截：同一个文件加了字，已经出过图的那几版字的位置会差零点几个像素（重新渲染不一样了）。
// 新的一版要新的字，另截一个文件。
export const FONTS = {
  cover: { family: "CoverTitleSerif", file: "films/work-3d80f743/fonts/NotoSerifSC-Bold-cover.woff2" },
  note: { family: "CoverNoteSerif", file: "films/work-3d80f743/fonts/NotoSerifSC-Bold-subset.woff2" },
  zuichen: { family: "CoverZuichenSerif", file: "films/work-3d80f743/fonts/NotoSerifSC-Bold-cover-zuichen.woff2" },
};
type FontKey = keyof typeof FONTS;

const fontLoads = new Map<FontKey, Promise<void>>();
export function loadFont(key: FontKey) {
  let load = fontLoads.get(key);
  if (!load) {
    const { family, file } = FONTS[key];
    load = new FontFace(family, `url(${assetUrl(file)})`, { weight: "700" }).load().then((face) => void document.fonts.add(face));
    fontLoads.set(key, load);
  }
  return load;
}

/** 成片在这几个时刻的画面（全部图层，不带歌词），按设计尺寸的 q 倍画 */
async function filmFrames(options: SceneOptions, q: number, times: number[], signal: AbortSignal) {
  const doc = timeline().visual ?? ((await import("../timelines/main/visual.json")).default as unknown as VisualDocument);
  const clips = doc.clips.filter((c) => !(c.source.kind === "scene" && c.source.module === "lyrics"));
  const film = createCompositionScene({ ...options, width: Math.round(W * q), height: Math.round(H * q) }, { ...doc, clips }, LOADERS);
  try {
    const out: HTMLCanvasElement[] = [];
    for (const t of times) {
      await film.prepareFrame!(t, { signal });
      await film.render(t);
      const c = document.createElement("canvas");
      c.width = film.canvas.width;
      c.height = film.canvas.height;
      c.getContext("2d")!.drawImage(film.canvas, 0, 0);
      out.push(c);
    }
    return out;
  } finally {
    film.dispose();
  }
}

/** 成片的一帧（按设计尺寸 q 倍画的）放进 rect：设计坐标 (fx, fy) 落在封面的 (cx, cy)，设计的 1 像素是封面的 z 像素。
 *  extra：再加的滤镜（虚化） */
export function shot(g: CanvasRenderingContext2D, frame: HTMLCanvasElement, q: number, fx: number, fy: number, cx: number, cy: number, z: number, rect: [number, number, number, number], extra = "") {
  g.save();
  g.beginPath();
  g.rect(...rect);
  g.clip();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  // 封面在信息流里很小：比成片稍微浓一点、反差大一点
  g.filter = `saturate(1.12) contrast(1.06) ${extra}`.trim();
  g.translate(cx, cy);
  g.scale(z / q, z / q);
  g.translate(-fx * q, -fy * q);
  g.drawImage(frame, 0, 0);
  g.restore();
}

/** 字后面一片柔和的暖白：从 (x0, y0) 最浓到 (x1, y1) 淡完，铺满 rect，把字从彩虹、楼面上托出来 */
export function backdrop(g: CanvasRenderingContext2D, rect: [number, number, number, number], x0: number, y0: number, x1: number, y1: number, a: number) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, `rgba(255,246,232,${a})`);
  gr.addColorStop(0.55, `rgba(255,246,232,${a * 0.6})`);
  gr.addColorStop(1, "rgba(255,246,232,0)");
  g.fillStyle = gr;
  g.fillRect(...rect);
}

/** 画面里一竖条（设计 x sx 起 8 个像素宽）横着拉满 rect，纵向和 (fy → cy, z) 的取景一样：天是上下渐变的，拉开就是
 *  一片接得上的天（稍微虚化，抹掉拉出来的横纹） */
function smear(g: CanvasRenderingContext2D, k: number, frame: HTMLCanvasElement, q: number, sx: number, fy: number, cy: number, z: number, rect: [number, number, number, number]) {
  g.save();
  g.beginPath();
  g.rect(...rect);
  g.clip();
  g.filter = `saturate(1.12) contrast(1.06) blur(${Math.round(6 * k)}px)`;
  g.drawImage(frame, sx * q, 0, 8 * q, frame.height, rect[0] - 40, cy - fy * z, rect[2] + 80, H * z);
  g.restore();
}

/** paint 画的东西左边羽化：x0 以左看不见，到 x1 完全显出来（两栏之间没有硬边） */
function featherLeft(g: CanvasRenderingContext2D, k: number, x0: number, x1: number, paint: (h: CanvasRenderingContext2D) => void) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  paint(h);
  h.globalCompositeOperation = "destination-in";
  const gr = h.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,1)");
  h.fillStyle = gr;
  h.fillRect(0, 0, off.width / k, off.height / k);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(off, 0, 0);
  g.restore();
}

/** tracking：字距（字高的几分之几，默认 0.06，和设定字一样） */
type Caption = { text: string; accent?: string[]; x: number; y: number; size: number; tracking?: number };

/** 每个字是不是关键词（accent 的几段） */
function hotOf(text: string, accent: string[]) {
  const hot = new Array<boolean>(text.length).fill(false);
  for (const a of accent) {
    const i = text.indexOf(a);
    if (i >= 0) for (let j = i; j < i + a.length; j++) hot[j] = true;
  }
  return hot;
}

/** 摆好位置的一组字，画成设定字的样子：深暖棕、米白光，关键词暖赭红。k：封面 1 像素是画布的几像素（光晕按它放大） */
function paintGlyphs(g: CanvasRenderingContext2D, k: number, size: number, glyphs: { ch: string; x: number; y: number; hot: boolean }[]) {
  // 柔光（两层）+ 一圈细的米白边
  g.shadowColor = GLOW;
  g.strokeStyle = "rgba(255,250,242,0.92)";
  g.lineWidth = size * 0.13;
  for (const blur of [size * 0.55, size * 0.25]) {
    g.shadowBlur = blur * k;
    for (const { ch, x, y } of glyphs) g.strokeText(ch, x, y);
  }
  g.shadowBlur = 0;
  for (const { ch, x, y } of glyphs) g.strokeText(ch, x, y);
  for (const { ch, x, y, hot } of glyphs) {
    g.fillStyle = hot ? ACCENT : INK;
    g.fillText(ch, x, y);
  }
}

/** 一行字，中心在 (x, y) */
export function line(g: CanvasRenderingContext2D, k: number, font: string, { text, accent = [], x, y, size, tracking = 0.06 }: Caption) {
  const hot = hotOf(text, accent);
  g.save();
  g.font = `700 ${size}px ${font}, "Noto Serif SC", serif`;
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.lineJoin = "round";
  const spacing = size * tracking;
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  const glyphs = chars.map((ch, i) => {
    const glyph = { ch, x: cx, y, hot: hot[i] };
    cx += widths[i] + spacing;
    return glyph;
  });
  paintGlyphs(g, k, size, glyphs);
  g.restore();
}

// ---------------------------------------------------------------- 「标题」「首帧」
/** 竖：她在白的边上（设计坐标的 y 220–1660 这一段：头顶的彩虹到光着的脚），两行字压在顶上的白里 */
function edgePortrait(captions: Caption[]) {
  return (g: CanvasRenderingContext2D, k: number, font: string, [edge]: HTMLCanvasElement[], q: number) => {
    shot(g, edge, q, 540, 940, 540, 720, 1, [0, 0, 1080, 1440]);
    backdrop(g, [0, 0, 1080, 330], 0, 0, 0, 330, 0.7);
    for (const caption of captions) line(g, k, font, caption);
  };
}

/** 横：左右两格，左边她攥住阿满的脚踝，右边她一个人飘向白；两格同样的比例，每格顶上一句 */
function twoPanels(captions: Caption[]) {
  return (g: CanvasRenderingContext2D, k: number, font: string, [grab, edge]: HTMLCanvasElement[], q: number) => {
    const z = 0.7;
    // 左：阿满的帽子在设计 y 260、她的铁靴到 1475，整格是设计的 y 0–1543（格子宽 1029 个设计像素，中心不能小于 515，
    // 不然露出成片左边的外面）
    shot(g, grab, q, 515, 771, 360, 540, z, [0, 0, 720, 1080]);
    // 右：彩虹在格子上沿、光着的脚在下沿
    shot(g, edge, q, 520, 931, 1080, 540, z, [720, 0, 720, 1080]);
    // 两格之间一道米白的缝
    g.fillStyle = "rgba(255,248,238,0.96)";
    g.fillRect(716, 0, 8, 1080);
    backdrop(g, [0, 0, 1440, 250], 0, 0, 0, 250, 0.78);
    for (const caption of captions) line(g, k, font, caption);
  };
}

// ---------------------------------------------------------------- 「引力」
/** 竖：设计坐标的 y 300–1740——上面是空的天，她抱着他在中间（头发顶在封面 443），老钟的脸在 1265、她的脚在 1400 */
function posterPortrait(g: CanvasRenderingContext2D, k: number, font: string, [hug]: HTMLCanvasElement[], q: number) {
  shot(g, hug, q, 540, 1020, 540, 720, 1, [0, 0, 1080, 1440]);
  backdrop(g, [0, 0, 1080, 440], 0, 0, 0, 440, 0.72);
  line(g, k, font, { text: "人不是被地拉住的", x: 540, y: 125, size: 66 });
  line(g, k, font, { text: "是被人拉住的", accent: ["被人拉住"], x: 540, y: 262, size: 120 });
}

/** 横：放大 4/3，设计坐标的 y 450–1260——上面是两个人头顶的天（头发顶在封面 391），脸在中间，砖亮在下沿 976 */
function posterLandscape(g: CanvasRenderingContext2D, k: number, font: string, [hug]: HTMLCanvasElement[], q: number) {
  shot(g, hug, q, 540, 855, 720, 540, 4 / 3, [0, 0, 1440, 1080]);
  backdrop(g, [0, 0, 1440, 400], 0, 0, 0, 400, 0.6);
  line(g, k, font, { text: "人不是被地拉住的", x: 720, y: 100, size: 60 });
  line(g, k, font, { text: "是被人拉住的", accent: ["被人拉住"], x: 720, y: 232, size: 112 });
}

// ---------------------------------------------------------------- 「最沉」（不剧透）
/** 竖：放大 1.1，设计坐标的 y 294–1603——两个人的头顶在封面 470，铁靴底 1324，左下角是楼顶的栏杆；上面空的天里两行字，
 *  「城里都说，她是」小、「最沉的人」大 */
function catchPortrait(g: CanvasRenderingContext2D, k: number, font: string, [hold]: HTMLCanvasElement[], q: number) {
  shot(g, hold, q, 540, 949, 540, 720, 1.1, [0, 0, 1080, 1440]);
  backdrop(g, [0, 0, 1080, 440], 0, 0, 0, 440, 0.6);
  line(g, k, font, { text: "城里都说，她是", x: 540, y: 130, size: 76 });
  line(g, k, font, { text: "最沉的人", accent: ["最沉"], x: 540, y: 292, size: 150 });
}

/** 横：右边是原大的画面（设计 x 230–1080、y 470–1550：头顶在封面 251，铁靴底 1028；楼顶的栏杆在 x 230 左边，不进来），
 *  左边接着同一片天（画面 x 260 那一竖条横着拉开），从封面 590 淡到 680 接上；字在左边的天上 */
function catchLandscape(g: CanvasRenderingContext2D, k: number, font: string, [hold]: HTMLCanvasElement[], q: number) {
  smear(g, k, hold, q, 260, 1010, 540, 1, [0, 0, 700, 1080]);
  featherLeft(g, k, 590, 680, (h) => shot(h, hold, q, 655, 1010, 1015, 540, 1, [590, 0, 850, 1080]));
  // 左边留 50 左右，右边离千斤的鞋（封面 x 675）还有 80
  line(g, k, font, { text: "城里都说，她是", x: 322, y: 425, size: 70 });
  line(g, k, font, { text: "最沉的人", accent: ["最沉"], x: 322, y: 578, size: 128 });
}

type Kind = "竖" | "横";
type Layout = (g: CanvasRenderingContext2D, k: number, font: string, frames: HTMLCanvasElement[], q: number) => void;
/** times：成片取哪几刻；q：成片按设计尺寸的几倍画（比封面上用到的密一点再缩小，线条更干净） */
type Design = { times: number[]; q: number; draw: Layout };

export type Version = "标题" | "首帧" | "引力" | "最沉";
const VERSIONS: Record<Version, { font: FontKey } & Record<Kind, Design>> = {
  标题: {
    font: "cover",
    竖: {
      times: [T_EDGE],
      q: 1.25,
      draw: edgePortrait([
        { text: "她拽住了全城飘起来的人", accent: ["拽住"], x: 540, y: 92, size: 62 },
        { text: "可谁来拽住她？", accent: ["拽住她"], x: 540, y: 208, size: 116 },
      ]),
    },
    横: {
      times: [T_GRAB, T_EDGE],
      q: 1,
      draw: twoPanels([
        { text: "她拽住了全城飘起来的人", accent: ["拽住"], x: 360, y: 96, size: 52 },
        { text: "可谁来拽住她？", accent: ["拽住她"], x: 1080, y: 96, size: 80 },
      ]),
    },
  },
  // 两句一样长（13 个字），一样大，和首帧一样关键词是「飘起来」「化成灰」
  首帧: {
    font: "note",
    竖: {
      times: [T_EDGE],
      q: 1.25,
      draw: edgePortrait([
        { text: "这里的人，一绝望就会飘起来", accent: ["飘起来"], x: 540, y: 104, size: 68 },
        { text: "飘进天上的强光，就会化成灰", accent: ["化成灰"], x: 540, y: 206, size: 68 },
      ]),
    },
    // 一格只有 720 宽、一句 13 个字：字距收紧一点，字能大一点
    横: {
      times: [T_GRAB, T_EDGE],
      q: 1,
      draw: twoPanels([
        { text: "这里的人，一绝望就会飘起来", accent: ["飘起来"], x: 360, y: 96, size: 50, tracking: 0.02 },
        { text: "飘进天上的强光，就会化成灰", accent: ["化成灰"], x: 1080, y: 96, size: 50, tracking: 0.02 },
      ]),
    },
  },
  引力: {
    font: "cover",
    竖: { times: [T_HUG], q: 1.25, draw: posterPortrait },
    横: { times: [T_HUG], q: 1.6, draw: posterLandscape },
  },
  最沉: {
    font: "zuichen",
    竖: { times: [T_CATCH], q: 1.4, draw: catchPortrait },
    横: { times: [T_CATCH], q: 1.25, draw: catchLandscape },
  },
};

/** 封面的静帧：options 的尺寸就是静帧的尺寸；version 是哪一版 */
export async function coverScene(options: SceneOptions, kind: Kind, version: Version = "标题"): Promise<Scene> {
  const k = options.width / (kind === "竖" ? 1080 : 1440);
  const { font } = VERSIONS[version];
  const design = VERSIONS[version][kind];
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      await loadFont(font);
      const q = design.q * k;
      const frames = await filmFrames(options, q, design.times, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      // 下面按封面的像素画（竖 1080×1440、横 1440×1080）
      g.setTransform(k, 0, 0, k, 0, 0);
      design.draw(g, k, FONTS[font].family, frames, q);
    })().catch((error) => {
      job = null;
      throw error;
    }));
  return {
    canvas,
    prepareFrame: (_time, { signal }) => draw(signal),
    render: () => draw(new AbortController().signal),
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
