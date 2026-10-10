// 作品的 scenes/lyrics.ts（模板）：歌词怎么画在素材库 s0rrow/code/lyrics.ts 里，这里只放这首歌的数据、段落样式和钩子。
// 逐词时间：node production/fetch-krc.mjs "s0rrow - 歌名" <音频毫秒数> > scenes/krc.ts（脚本在素材库 tools/fetch-krc.mjs），
// 核对时长；剪辑版把时间整体平移到作品时间，只保留用到的句子（或用 songTime / show）。
import type { SceneOptions } from "@frame/engine/types";
import { phase } from "@frame/engine/math";
import { C, Ctx, F, W, backOut, easeOut, measure, rr, text } from "@materials/s0rrow/code/draw";
import { caption, createLyricsScene, lyricLines, type Fix } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { EV } from "./timeline";

/** 每句中文拆成和英文单词数相同的词（第 i 个中文词用第 i 个英文词的时间点亮）；词组之间加空格；"" 表示这个英文词不亮。
 *  先写一句通顺、像中文歌词的话，再按英文词序切开，词序对不上时用倒装或让某个词不亮。 */
const CN: string[][] = [
  // ["中文词", "中文词 ", …],
];

/** 红笔改写：按句下标。 */
const FIXES: Record<number, Fix> = {
  // 16: { en: [6], cn: "要划掉的中文", note: "红笔改写", at: 69.15 },
};

/** 段落样式：bridge 桥段（粉色），big 全片最大的一句，outro 尾段（暖黄）。 */
const style = (i: number) => ({ bridge: i >= 6 && i <= 12, big: i === 11, outro: i >= 13 });

/** 开头钩子：首帧完整出现的大字，4 秒后缩成顶部的标题胶囊（文案和时间点每支要改）。 */
function hook(ctx: Ctx, abs: number) {
  const shrink = easeOut(phase(abs, 4.16, 4.6));
  if (shrink < 1) {
    const k = 1.12 - 0.12 * backOut(phase(abs, 0, 0.3));
    ctx.save();
    ctx.globalAlpha = 1 - shrink;
    ctx.translate(W / 2, 300);
    ctx.scale(k, k);
    text(ctx, "钩子第一行", 0, -50, { size: 88, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    text(ctx, "钩子第二行", 0, 74, { size: 88, font: F.cn, fill: "#ffd166", stroke: C.ink, lw: 14 });
    ctx.restore();
  }
  if (shrink > 0 && abs < EV.end) {
    const label = "标题胶囊";
    const w = measure(ctx, label, 38, F.cn) + 70;
    ctx.save();
    ctx.globalAlpha = shrink;
    ctx.fillStyle = "rgba(12,12,18,0.62)";
    rr(ctx, W / 2 - w / 2, 214 - 36, w, 72, 36);
    ctx.fill();
    text(ctx, label, W / 2, 216, { size: 38, font: F.cn, fill: "#fff" });
    ctx.restore();
  }
}

/** 反转字幕和结尾金句（两行大字幕）。 */
function captions(ctx: Ctx, abs: number) {
  caption(ctx, abs, EV.twist + 0.5, EV.twist + 2.2, [["反转字幕第一行", 92, F.cn, "#fff"]], [["第二行", 80, F.cn, "#fff"], ["关键字", 100, F.cn, "#ffd166"]]);
}

export function createScene(options: SceneOptions) {
  return createLyricsScene(options, { lines: lyricLines(LYRIC_WORDS, CN, FIXES), end: EV.end, style, before: hook, after: captions });
}
