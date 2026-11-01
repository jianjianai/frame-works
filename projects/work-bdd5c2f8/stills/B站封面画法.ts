// B 站封面（4:3，1440×1080；用户 2026-11-01：「要追求最高点击率，有神秘感，激发观众的探索欲望，并且小屏也能看清文字」）。
// 三版悬念封面，各一个静帧（stills/B站封面-*.ts）。做法照《mirrors》的第二轮：成片一帧铺满（宽正好 1080 个设计像素，
// 放大 4/3），四周压暗、只留一处亮（神秘感），下面一条暗带托两行字：小字交代事、大字留一个缺口（手机首页两列的小卡片
// 也读得出）。字和主角都在 16:9 那一条（y 135–945）以内；右下角盖时长、左下角盖播放数，下面两个角不放要看的东西。
// 不剧透：只用反转（33.7 秒）以前的画面。
// 画面就是成片那一刻（去掉歌词层和颗粒层），按成片 1080×1920 的设计坐标取景。字用成片钩子的样式（站酷快乐体、墨色描边、
// 关键词暖黄），字体是只截了用到的字的子集 public/fonts/zcool-kuaile-bili.ttf（来源 public/production/zcool-kuaile-bili.css），
// 出过图就不再往里加字，新的字另截一个文件。
// 这里不导出 createScene（不是静帧本身）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { createCompositionScene, type SceneLoaders, type VisualDocument } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

/** 和 scene.ts 一样的模块（歌词、颗粒去掉了） */
const LOADERS: SceneLoaders = {
  act1: () => import("../scenes/act1"),
  act4: () => import("../scenes/act4"),
  act5: () => import("../scenes/act5"),
  act6: () => import("../scenes/act6"),
};

/** 成片的设计尺寸 */
const W = 1080;
const H = 1920;
/** 封面尺寸 */
const CW = 1440;
const CH = 1080;

const INK = "#17161a";
const YELLOW = "#ffd166";
const RED = "#ff4d4f";
// 每版的字体文件定了就不再加字：同一个文件加了字，已经出过图的那几版字的位置会差零点几个像素。新的字另截一个文件。
const FONTS = {
  first: { family: "BiliCoverKuaiLe", file: "films/work-bdd5c2f8/fonts/zcool-kuaile-bili.ttf" },
  quote: { family: "BiliCoverKuaiLe2", file: "films/work-bdd5c2f8/fonts/zcool-kuaile-bili2.ttf" },
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
function shot(g: CanvasRenderingContext2D, frame: HTMLCanvasElement, q: number, fx: number, fy: number, cx: number, cy: number, z: number, rect: Rect = [0, 0, CW, CH]) {
  g.save();
  g.beginPath();
  g.rect(...rect);
  g.clip();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  // 封面在信息流里很小：比成片稍微浓一点、反差大一点
  g.filter = "saturate(1.15) contrast(1.08)";
  g.translate(cx, cy);
  g.scale(z / q, z / q);
  g.translate(-fx * q, -fy * q);
  g.drawImage(frame, 0, 0);
  g.restore();
}

/** 四周压暗，只留 (x, y) 附近一团亮 */
function spotlight(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const gr = g.createRadialGradient(x, y, r * 0.35, x, y, r * 1.7);
  gr.addColorStop(0, "rgba(6,6,14,0)");
  gr.addColorStop(1, `rgba(6,6,14,${a})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, CW, CH);
}

/** 字后面一片暗带：底边最浓、往上到 top 淡完 */
function shade(g: CanvasRenderingContext2D, top: number, a: number) {
  const gr = g.createLinearGradient(0, CH, 0, top);
  gr.addColorStop(0, `rgba(8,8,16,${a})`);
  gr.addColorStop(0.55, `rgba(8,8,16,${(a * 0.55).toFixed(3)})`);
  gr.addColorStop(1, "rgba(8,8,16,0)");
  g.fillStyle = gr;
  g.fillRect(0, top, CW, CH - top);
}

/** 发送失败的红色圆形感叹号：在 headline 的 parts 里写 MARK，画成和字一样高的红圈白「!」（字体里没有 ❗） */
const MARK = "❗";

/** 一行字的几段：[文字, 颜色]，中心在 (x, y)，宽不超过 maxW（超了整行缩小）。成片钩子的样式：暗晕、墨色粗描边、填色 */
function headline(g: CanvasRenderingContext2D, k: number, parts: [string, string][], x: number, y: number, size: number, maxW = CW - 120) {
  g.save();
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.lineJoin = "round";
  const width = (s: string, sz: number) => (s === MARK ? sz * 1.08 : g.measureText(s).width);
  g.font = `400 ${size}px ${FAMILY}`;
  const total = parts.reduce((a, [s]) => a + width(s, size), 0);
  const sz = size * Math.min(1, maxW / total);
  g.font = `400 ${sz}px ${FAMILY}`;
  const ws = parts.map(([s]) => width(s, sz));
  const left = x - ws.reduce((a, b) => a + b, 0) / 2;
  const r = sz * 0.4;
  const each = (paint: (s: string, px: number, fill: string) => void, circle: (cx: number) => void) => {
    let px = left;
    parts.forEach(([s, fill], i) => {
      if (s === MARK) circle(px + ws[i] / 2 + sz * 0.04);
      else paint(s, px, fill);
      px += ws[i];
    });
  };
  const disc = (cx: number) => {
    g.beginPath();
    g.arc(cx, y, r, 0, Math.PI * 2);
  };
  // 暗晕
  g.shadowColor = "rgba(0,0,0,0.7)";
  g.shadowBlur = sz * 0.35 * k;
  g.shadowOffsetY = sz * 0.06 * k;
  g.strokeStyle = "rgba(0,0,0,0.55)";
  g.lineWidth = sz * 0.36;
  each((s, px) => g.strokeText(s, px, y), (cx) => (disc(cx), g.stroke()));
  g.shadowColor = "transparent";
  // 墨色描边 + 填色
  g.strokeStyle = INK;
  g.lineWidth = sz * 0.2;
  each((s, px) => g.strokeText(s, px, y), (cx) => (disc(cx), g.stroke()));
  each(
    (s, px, fill) => {
      g.fillStyle = fill;
      g.fillText(s, px, y);
    },
    (cx) => {
      // 红圈 + 白色感叹号（竖一笔、一个点）
      g.shadowColor = "rgba(255,77,79,0.8)";
      g.shadowBlur = sz * 0.3 * k;
      disc(cx);
      g.fillStyle = RED;
      g.fill();
      g.shadowColor = "transparent";
      g.fillStyle = "#fff";
      g.beginPath();
      g.roundRect(cx - r * 0.13, y - r * 0.6, r * 0.26, r * 0.78, r * 0.13);
      g.fill();
      g.beginPath();
      g.arc(cx, y + r * 0.44, r * 0.15, 0, Math.PI * 2);
      g.fill();
    },
  );
  g.restore();
}

/** 下面一条暗带托住两行字：小字一句、大字一句（key 是大字里标暖黄的那几个字；大字可以以 MARK 结尾） */
function hookLines(g: CanvasRenderingContext2D, k: number, small: string, big: string, key: string) {
  shade(g, 540, 0.88);
  headline(g, k, [[small, "#fff"]], CW / 2, 708, 86, 1100);
  const mark = big.endsWith(MARK);
  if (mark) big = big.slice(0, -MARK.length);
  const i = big.indexOf(key);
  const parts: [string, string][] = [];
  if (i > 0) parts.push([big.slice(0, i), "#fff"]);
  parts.push([key, YELLOW]);
  if (i + key.length < big.length) parts.push([big.slice(i + key.length), "#fff"]);
  if (mark) parts.push([MARK, RED]);
  headline(g, k, parts, CW / 2, 846, 138, 1280);
}

// ---------------------------------------------------------------- 第一轮（用户：「感觉都不太行」）

/** 9.4 秒：走廊回忆，同学们一看见他就把横幅和礼物藏到身后、头上冒「!」，脸是 X；他虚在前景 */
const T_HIDE = 9.4;
function hiding(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 720, 720, 470, 4 / 3);
  spotlight(g, 940, 330, 480, 0.75);
  hookLines(g, k, "17岁生日那天", "全班都在躲着我", "躲着我");
}

/** 3.3 秒：桌上的手机，锁屏 23:58、0 条新消息；状态栏右上角的 ✈ 就是答案（彩蛋，封面上也看得见） */
const T_PHONE = 3.3;
function phone(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 550, 720, 470, 4 / 3);
  spotlight(g, 760, 300, 520, 0.7);
  hookLines(g, k, "17岁生日，手机0条新消息", "答案就藏在这张图里", "这张图里");
}

/** 30.5 秒：23:58 他一个人对着纸杯蛋糕闭眼许愿，烛光照着脸，身后是黑的房间和窗 */
const T_WISH = 30.5;
function wish(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 970, 720, 470, 4 / 3);
  spotlight(g, 720, 400, 470, 0.7);
  hookLines(g, k, "17岁生日，我一个人许愿", "楼下突然亮起了光", "亮起了光");
}

// ---------------------------------------------------------------- 第二轮：用户选的两句文案，各配三种画面
// 「没发出去」：小字「17岁生日，这句话我没发出去」/ 大字「其实…今天是我生日❗」（红色发送失败的感叹号就是钩子）
// 「记得我」：小字「23:58，一个人吹蜡烛」/ 大字「希望…有人记得我」（片子里许愿那句原话）
const SENT = ["17岁生日，这句话我没发出去", `其实…今天是我生日${MARK}`, "生日"] as const;
const WISH = ["23:58，一个人吹蜡烛", "希望…有人记得我", "有人记得我"] as const;

/** 24.6 秒：班群里「其实…今天是我生日」那条气泡，旁边红色的 ❗ 发送失败（放大到气泡占满宽） */
const T_FAIL = 24.6;
function failBubble(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 560, 760, 720, 380, 1.9);
  spotlight(g, 720, 400, 520, 0.75);
  hookLines(g, k, ...SENT);
}

/** 20.6 秒：夜里回家的路上，路灯下他低头看着手机打字 */
const T_WALK = 20.6;
function walking(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 770, 720, 470, 4 / 3);
  spotlight(g, 720, 330, 480, 0.7);
  hookLines(g, k, ...SENT);
}

/** 28.8 秒：蜡烛刚点上，他睁着眼看着纸杯蛋糕（还没戴帽子、没许愿），右边的手机扣着、黑屏 */
const T_LIT = 28.8;
function litCandle(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 960, 720, 470, 4 / 3);
  spotlight(g, 720, 380, 470, 0.7);
  hookLines(g, k, ...SENT);
}

/** 30.5 秒：闭眼许愿的近景（同第一轮「许愿」的取景） */
function wishClose(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 970, 720, 470, 4 / 3);
  spotlight(g, 720, 400, 470, 0.7);
  hookLines(g, k, ...WISH);
}

/** 31.95 秒：他鼓着嘴吹蜡烛，火苗被吹歪 */
const T_BLOW = 31.95;
function blowing(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 970, 720, 470, 4 / 3);
  spotlight(g, 720, 400, 470, 0.7);
  hookLines(g, k, ...WISH);
}

/** 29.6 秒：往上多带一点房间：窗外的楼、墙上的彩灯和照片、圈了红圈的日历，他戴着派对帽坐在中间，烛火在字上面 */
const T_ROOM = 29.6;
function room(g: CanvasRenderingContext2D, k: number, [f]: HTMLCanvasElement[], q: number) {
  shot(g, f, q, 540, 890, 720, 470, 4 / 3);
  spotlight(g, 720, 420, 560, 0.6);
  hookLines(g, k, ...WISH);
}

type Layout = (g: CanvasRenderingContext2D, k: number, frames: HTMLCanvasElement[], q: number) => void;
/** times：成片取哪几刻；q：成片按设计尺寸的几倍画（比封面上用到的密一点再缩小，线条更干净） */
type Design = { times: number[]; q: number; draw: Layout; font?: FontKey };

export type Version = "躲着我" | "这张图里" | "许愿" | "没发出去-气泡" | "没发出去-回家" | "没发出去-蜡烛" | "记得我-许愿" | "记得我-吹蜡烛" | "记得我-房间";
const VERSIONS: Record<Version, Design> = {
  躲着我: { times: [T_HIDE], q: 1.6, draw: hiding },
  这张图里: { times: [T_PHONE], q: 1.6, draw: phone },
  许愿: { times: [T_WISH], q: 1.6, draw: wish },
  "没发出去-气泡": { times: [T_FAIL], q: 2, draw: failBubble, font: "quote" },
  "没发出去-回家": { times: [T_WALK], q: 1.6, draw: walking, font: "quote" },
  "没发出去-蜡烛": { times: [T_LIT], q: 1.6, draw: litCandle, font: "quote" },
  "记得我-许愿": { times: [T_WISH], q: 1.6, draw: wishClose, font: "quote" },
  "记得我-吹蜡烛": { times: [T_BLOW], q: 1.6, draw: blowing, font: "quote" },
  "记得我-房间": { times: [T_ROOM], q: 1.6, draw: room, font: "quote" },
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
