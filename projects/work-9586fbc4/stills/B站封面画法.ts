// B 站封面（4:3，1440×1080；用户 2026-11-01：「给 bilibili 做一个封面」）。两版，各一个静帧：
// - 「镜子」（stills/B站封面-镜子.ts）：左右两格。左边是首帧——他把报纸糊上浴室镜子，镜子里只剩一条露出带胎记的脸；
//   右边是天台见面——帽子、墨镜、口罩全副武装，看见她时「!!」吓一跳。每格顶上一句：「她说，想看看我的脸」/
//   「见面那天，我全副武装」。不剧透（反转在 32.5 秒以后）。
// - 「瑕疵」（stills/B站封面-瑕疵.ts）：第一幕④胎记大特写（红笔圈住「瑕疵」），字「网恋半年，她说 / 想看看 / 我的脸」（重排过，见 flawCloseup）。
// B 站 4:3 封面在电脑首页、搜索里多数居中裁成 16:9（y 135–945）：字和脸都放在这一条里；右下角盖时长、左下角盖播放数。
// 画面就是成片那一刻（去掉歌词层和颗粒层），按成片 1080×1920 的设计坐标取景。字用成片钩子的样式（站酷快乐体、墨色描边、
// 关键词暖黄），字体是只截了用到的字的子集 public/fonts/zcool-kuaile-bili.ttf（来源 public/production/zcool-kuaile-bili.css），
// 定了就不再往里加字，新的一版另截一个文件。
// 这里不导出 createScene（不是静帧本身）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { createCompositionScene, type SceneLoaders, type VisualDocument } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

/** 和 scene.ts 一样的模块（歌词、颗粒去掉了） */
const LOADERS: SceneLoaders = {
  act1: () => import("../scenes/act1"),
  act2: () => import("../scenes/act2"),
  act3: () => import("../scenes/act3"),
  act4: () => import("../scenes/act4"),
  act5: () => import("../scenes/act5"),
};

/** 成片的设计尺寸 */
const W = 1080;
const H = 1920;
/** 封面尺寸 */
const CW = 1440;
const CH = 1080;

const INK = "#17161a";
const YELLOW = "#ffd166";
// 每版的字体文件定了就不再加字：同一个文件加了字，已经出过图的那几版字的位置会差零点几个像素。新的字另截一个文件。
const FONTS = {
  first: { family: "BiliCoverKuaiLe", file: "films/work-9586fbc4/fonts/zcool-kuaile-bili.ttf" },
  hook: { family: "BiliCoverKuaiLe2", file: "films/work-9586fbc4/fonts/zcool-kuaile-bili2.ttf" },
};
type FontKey = keyof typeof FONTS;

const fontLoads = new Map<FontKey, Promise<void>>();
function loadFont(key: FontKey) {
  let load = fontLoads.get(key);
  if (!load) {
    const { family, file } = FONTS[key];
    load = fetch(assetUrl(file))
      .then((r) => r.arrayBuffer())
      .then((buf) => new FontFace(family, buf).load())
      .then((face) => void document.fonts.add(face));
    fontLoads.set(key, load);
  }
  return load;
}
/** 正在画的那一版的字体 */
let FAMILY = FONTS.first.family;

/** 成片在这几个时刻的画面（不带歌词和颗粒），按设计尺寸的 q 倍画 */
async function filmFrames(options: SceneOptions, q: number, times: number[], signal: AbortSignal) {
  const doc = timeline().visual ?? ((await import("../timelines/main/visual.json")).default as unknown as VisualDocument);
  const clips = doc.clips.filter((c) => !(c.source.kind === "scene" && (c.source.module === "lyrics" || c.source.module === "grain")));
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

type Rect = [number, number, number, number];

/** 成片的一帧放进 rect：设计坐标 (fx, fy) 落在封面的 (cx, cy)，设计的 1 像素是封面的 z 像素 */
function shot(g: CanvasRenderingContext2D, frame: HTMLCanvasElement, q: number, fx: number, fy: number, cx: number, cy: number, z: number, rect: Rect) {
  g.save();
  g.beginPath();
  g.rect(...rect);
  g.clip();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  // 封面在信息流里很小：比成片稍微浓一点、反差大一点
  g.filter = "saturate(1.12) contrast(1.06)";
  g.translate(cx, cy);
  g.scale(z / q, z / q);
  g.translate(-fx * q, -fy * q);
  g.drawImage(frame, 0, 0);
  g.restore();
}

/** 字后面一片暗带：y0 最浓、到 y1 淡完 */
function shade(g: CanvasRenderingContext2D, rect: Rect, y0: number, y1: number, a: number) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, `rgba(8,8,16,${a})`);
  gr.addColorStop(0.55, `rgba(8,8,16,${(a * 0.55).toFixed(3)})`);
  gr.addColorStop(1, "rgba(8,8,16,0)");
  g.fillStyle = gr;
  g.fillRect(...rect);
}

/** 四周压暗一点，把眼睛引到中间 */
function vignette(g: CanvasRenderingContext2D, a: number) {
  const r = g.createRadialGradient(CW / 2, CH / 2, CH * 0.45, CW / 2, CH / 2, CW * 0.72);
  r.addColorStop(0, "rgba(8,8,16,0)");
  r.addColorStop(1, `rgba(8,8,16,${a})`);
  g.fillStyle = r;
  g.fillRect(0, 0, CW, CH);
}

/** 一行字的几段：[文字, 颜色]，中心在 (x, y)，宽不超过 maxW（超了整行缩小）。成片钩子的样式：暗晕、墨色粗描边、填色 */
function headline(g: CanvasRenderingContext2D, k: number, parts: [string, string][], x: number, y: number, size: number, maxW = CW - 120) {
  g.save();
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.lineJoin = "round";
  g.font = `400 ${size}px ${FAMILY}`;
  const widths = parts.map(([s]) => g.measureText(s).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const sz = size * Math.min(1, maxW / total);
  g.font = `400 ${sz}px ${FAMILY}`;
  const ws = parts.map(([s]) => g.measureText(s).width);
  const left = x - ws.reduce((a, b) => a + b, 0) / 2;
  const each = (paint: (s: string, px: number, fill: string) => void) => {
    let px = left;
    parts.forEach(([s, fill], i) => {
      paint(s, px, fill);
      px += ws[i];
    });
  };
  // 暗晕
  g.shadowColor = "rgba(0,0,0,0.65)";
  g.shadowBlur = sz * 0.35 * k;
  g.shadowOffsetY = sz * 0.06 * k;
  g.strokeStyle = "rgba(0,0,0,0.55)";
  g.lineWidth = sz * 0.36;
  each((s, px) => g.strokeText(s, px, y));
  g.shadowColor = "transparent";
  // 墨色描边 + 填色
  g.strokeStyle = INK;
  g.lineWidth = sz * 0.2;
  each((s, px) => g.strokeText(s, px, y));
  each((s, px, fill) => {
    g.fillStyle = fill;
    g.fillText(s, px, y);
  });
  g.restore();
}

// ---------------------------------------------------------------- 「镜子」
/** 首帧：他糊报纸，镜子里露出一条带胎记的脸 */
const T_MIRROR = 0.5;
/** 天台：全副武装看见她，「!!」 */
const T_ROOF = 28.0;

function mirrorPanels(g: CanvasRenderingContext2D, k: number, [mirror, roof]: HTMLCanvasElement[], q: number) {
  const z = 0.78;
  shot(g, mirror, q, 470, 790, 360, 600, z, [0, 0, 720, CH]);
  shot(g, roof, q, 540, 860, 1080, 600, z, [720, 0, 720, CH]);
  // 两格之间一道白缝
  g.fillStyle = "rgba(250,248,240,0.96)";
  g.fillRect(716, 0, 8, CH);
  shade(g, [0, 0, CW, 400], 0, 400, 0.7);
  vignette(g, 0.3);
  headline(g, k, [["她说，想看看我的", "#fff"], ["脸", YELLOW]], 360, 215, 76, 640);
  headline(g, k, [["见面那天，我", "#fff"], ["全副武装", YELLOW]], 1080, 215, 76, 640);
}

// ---------------------------------------------------------------- 「瑕疵」
/** 第一幕④：胎记大特写，红笔圈住「瑕疵」（推近和抖动停下来以后） */
const T_FLAW = 4.9;

/** 画面里一竖条（设计 x sx 起 8 个像素宽）横着拉满 rect，纵向和 (fy → cy, z) 的取景一样：右边是虚化的走廊，拉开就接得上 */
function smear(g: CanvasRenderingContext2D, k: number, frame: HTMLCanvasElement, q: number, sx: number, fy: number, cy: number, z: number, rect: Rect) {
  g.save();
  g.beginPath();
  g.rect(...rect);
  g.clip();
  g.filter = `saturate(1.12) contrast(1.06) blur(${Math.round(8 * k)}px)`;
  g.drawImage(frame, sx * q, 0, 8 * q, frame.height, rect[0] - 40, cy - fy * z, rect[2] + 80, H * z);
  g.restore();
}

/** 重排（用户 2026-11-01：「瑕疵这个可以，但是需要重新排版」，要点击率、神秘感、小屏看得清）：特写放大 1.1 倍贴左边
 *  （设计 x 0–1180，「瑕疵」两个字的顶在封面 y 171、红圈底在 859，都在 16:9 那一条里），右边接着同一片虚化的走廊；
 *  四周压暗、只留胎记和红圈那一团亮。字在右边暗处竖着叠三行：小字「网恋半年，她说」、大字「想看看 / 我的脸」
 *  （每行三个字，字号 168，手机两列小卡片里也读得出），「脸」暖黄。 */
function flawCloseup(g: CanvasRenderingContext2D, k: number, [flaw]: HTMLCanvasElement[], q: number) {
  const fy = 805;
  const z = 1.1;
  smear(g, k, flaw, q, 1066, fy, 540, z, [1150, 0, 290, CH]);
  shot(g, flaw, q, 0, fy, 0, 540, z, [0, 0, 1180, CH]);
  // 胎记那一团亮，其余压暗；右边再压一层托住字
  spotlight(g, 600, 470, 470, 0.8);
  const gr = g.createLinearGradient(820, 0, CW, 0);
  gr.addColorStop(0, "rgba(6,6,14,0)");
  gr.addColorStop(0.4, "rgba(6,6,14,0.45)");
  gr.addColorStop(1, "rgba(6,6,14,0.6)");
  g.fillStyle = gr;
  g.fillRect(820, 0, CW - 820, CH);
  const x = 1160;
  headline(g, k, [["网恋半年，她说", "#fff"]], x, 360, 76, 520);
  headline(g, k, [["想看看", "#fff"]], x, 525, 168, 540);
  headline(g, k, [["我的", "#fff"], ["脸", YELLOW]], x, 712, 168, 540);
}

// ---------------------------------------------------------------- 第二轮：悬念（用户：「要追求最高点击率，有神秘感，
// 激发观众的探索欲望，并且小屏也能看清文字」）
// 三版都是成片一帧铺满（宽正好 1080 个设计像素），四周压暗、只留一处亮（神秘感），两行字压在下面的暗带里：前半句交代事、
// 后半句留一个缺口（大字，手机首页两列的小卡片里也读得出）。字在 16:9 那一条（y 135–945）以内。
/** 四周压暗，只留 (x, y) 附近一团亮 */
function spotlight(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const gr = g.createRadialGradient(x, y, r * 0.35, x, y, r * 1.7);
  gr.addColorStop(0, "rgba(6,6,14,0)");
  gr.addColorStop(1, `rgba(6,6,14,${a})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, CW, CH);
}

/** 下面一条暗带托住两行字：小字一句、大字一句（keys 是大字里标暖黄的那几个字） */
function hookLines(g: CanvasRenderingContext2D, k: number, small: string, big: string, key: string) {
  shade(g, [0, 560, CW, CH - 560], CH, 560, 0.86);
  headline(g, k, [[small, "#fff"]], CW / 2, 712, 86, 1100);
  const i = big.indexOf(key);
  const parts: [string, string][] = [];
  if (i > 0) parts.push([big.slice(0, i), "#fff"]);
  parts.push([key, YELLOW]);
  if (i + key.length < big.length) parts.push([big.slice(i + key.length), "#fff"]);
  headline(g, k, parts, CW / 2, 846, 138, 1280);
}

/** 0.7 秒：报纸快糊满了，镜子只剩左边一条，里面是他带胎记的脸，手正把最后一张报纸按上去 */
const T_SLIT = 0.7;
function slitMirror(g: CanvasRenderingContext2D, k: number, [slit]: HTMLCanvasElement[], q: number) {
  // 放大 1.6 倍，画面左边贴着成片的左边（设计 x 0–900）：镜子里的脸在左上，眼睛在封面 y 360
  shot(g, slit, q, 450, 1072, 720, 540, 1.6, [0, 0, CW, CH]);
  spotlight(g, 420, 380, 460, 0.85);
  // 左边镜前灯太亮，抢走眼睛：再压一层
  const left = g.createLinearGradient(0, 0, 560, 0);
  left.addColorStop(0, "rgba(6,6,14,0.6)");
  left.addColorStop(1, "rgba(6,6,14,0)");
  g.fillStyle = left;
  g.fillRect(0, 0, 560, CH);
  hookLines(g, k, "她说，想看看我的脸", "我把镜子全蒙上了", "全蒙上了");
}

/** 27.5 秒：天台，帽子墨镜口罩，墨镜里映着她的剪影 */
const T_SHADES = 27.5;
function shadesReflect(g: CanvasRenderingContext2D, k: number, [shades]: HTMLCanvasElement[], q: number) {
  shot(g, shades, q, 540, 1045, 720, 540, 4 / 3, [0, 0, CW, CH]);
  spotlight(g, 720, 400, 520, 0.7);
  hookLines(g, k, "网恋半年，第一次见面", "墨镜里的她，我认识", "我认识");
}

/** 31.7 秒：她把速写本举到鼻子，从上面偷看他，脸红 */
const T_PEEK = 31.7;
function peekBook(g: CanvasRenderingContext2D, k: number, [peek]: HTMLCanvasElement[], q: number) {
  shot(g, peek, q, 540, 850, 720, 540, 4 / 3, [0, 0, CW, CH]);
  spotlight(g, 720, 330, 520, 0.7);
  hookLines(g, k, "我从没给她看过我的脸", "她却画了我一整本", "一整本");
}

type Layout = (g: CanvasRenderingContext2D, k: number, frames: HTMLCanvasElement[], q: number) => void;
/** times：成片取哪几刻；q：成片按设计尺寸的几倍画（比封面上用到的密一点再缩小，线条更干净） */
type Design = { times: number[]; q: number; draw: Layout; font?: FontKey };

export type Version = "镜子" | "瑕疵" | "蒙镜" | "墨镜" | "一整本";
const VERSIONS: Record<Version, Design> = {
  镜子: { times: [T_MIRROR, T_ROOF], q: 1, draw: mirrorPanels },
  瑕疵: { times: [T_FLAW], q: 1.6, draw: flawCloseup, font: "hook" },
  蒙镜: { times: [T_SLIT], q: 1.6, draw: slitMirror, font: "hook" },
  墨镜: { times: [T_SHADES], q: 1.6, draw: shadesReflect, font: "hook" },
  一整本: { times: [T_PEEK], q: 1.6, draw: peekBook, font: "hook" },
};

/** 封面的静帧：options 的尺寸就是静帧的尺寸 */
export async function coverScene(options: SceneOptions, version: Version): Promise<Scene> {
  const k = options.width / CW;
  const design = VERSIONS[version];
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      const font = design.font ?? "first";
      await loadFont(font);
      const q = design.q * k;
      const frames = await filmFrames(options, q, design.times, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      // 下面按封面的像素画（1440×1080）
      g.setTransform(k, 0, 0, k, 0, 0);
      FAMILY = FONTS[font].family;
      design.draw(g, k, frames, q);
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
