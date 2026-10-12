// 中英歌词层：画法在素材库 s0rrow/code/lyrics.ts，这里放这首歌的中文、段落样式、钩子和顶部标签。
// 歌剪过：drawLyric 按歌曲时间点亮，songTime 把作品时间换成歌曲时间。
import type { SceneOptions } from "@frame/engine/types";
import { phase } from "@frame/engine/math";
import { Ctx, F, W, backOut, easeOut, measure, rr, text } from "@materials/s0rrow/code/draw";
import { createLyricsScene, lyricLines, parts } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { END, songTime } from "./timeline";

/** 每句中文拆成和英文单词数相同的词（第 i 个中文词用第 i 个英文词的时间点亮）；词组之间加空格；"" 表示这个英文词不亮。 */
const CHORUS: string[][] = [
  ["我会", "刷遍", "你的", "主页 ", "直到", "我", "双眼", "都", "麻木"],
  ["你", "根本", "不", "知道 ", "我有", "多", "", "需要", "你的", "心"],
  ["我会", "看遍", "你", "所有的", "转发 ", "和", "你", "在", "想", "什么"],
  ["因为", "我", "追不到", "", "你 ", "你", "想要的", "是", "别人"],
];
const CN: string[][] = [
  ...CHORUS,
  ["看", "你", "笑得那么", "开心 ", "好", "开心"],
  ["吻着", "别", "人 ", "那么", "开心"],
  ["让", "我", "好", "孤单 ", "好", "孤单"],
  ["为什么", "", "", "这么", "难"],
  ["去", "看", "镜子", "里的", "自己 ", "好", "孤单"],
  ["", "你", "看", "到的 ", "全都只是", "一张", "", "倒影"],
  ["好", "开心"],
  ...CHORUS,
];

/** 主歌粉色；「a reflective picture」那句最大（反转）；最后一遍副歌是她的视角，暖黄。 */
const style = (i: number) => ({ bridge: i >= 4 && i <= 10, big: i === 9, outro: i >= 11 });

/** 开头钩子：首帧完整出现的两行大字，约 4 秒后缩成顶部的标签胶囊。 */
function hook(ctx: Ctx, t: number) {
  const shrink = easeOut(phase(t, 4.16, 4.6));
  if (shrink >= 1) return;
  const k = 1.12 - 0.12 * backOut(phase(t, 0, 0.3));
  ctx.save();
  ctx.globalAlpha = 1 - shrink;
  // a soft dark band so the words read over the phone's top bar
  const band = ctx.createLinearGradient(0, 120, 0, 480);
  band.addColorStop(0, "rgba(6,8,16,0)");
  band.addColorStop(0.3, "rgba(6,8,16,0.5)");
  band.addColorStop(0.7, "rgba(6,8,16,0.5)");
  band.addColorStop(1, "rgba(6,8,16,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 120, W, 360);
  ctx.translate(W / 2, 300);
  ctx.scale(k, k);
  parts(ctx, -58, [["凌晨三点，我手滑", 88, F.cn, "#ffffff"]], 14);
  parts(ctx, 66, [["赞了她", 88, F.cn, "#ffffff"], ["三年前", 96, F.cn, "#ffd166"], ["的照片", 88, F.cn, "#ffffff"]], 14);
  ctx.restore();
}

/** 顶部的标签胶囊（交代时间和视角，只写一眼能对上的事）。 */
const LABELS: [number, number, string][] = [
  // [from, to, label] in work time
  [4.4, 7.7, "凌晨 3:07"],
];
function pill(ctx: Ctx, t: number) {
  for (const [a, b, label] of LABELS) {
    if (t < a || t > b) continue;
    const k = Math.min(easeOut(phase(t, a, a + 0.3)), 1 - phase(t, b - 0.2, b));
    const w = measure(ctx, label, 38, F.cn) + 70;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = "rgba(12,12,18,0.62)";
    rr(ctx, W / 2 - w / 2, 214 - 36, w, 72, 36);
    ctx.fill();
    text(ctx, label, W / 2, 216, { size: 38, font: F.cn, fill: "#fff" });
    ctx.restore();
  }
}

export function createScene(options: SceneOptions) {
  return createLyricsScene(options, {
    lines: lyricLines(LYRIC_WORDS, CN),
    end: songTime(END),
    style,
    songTime,
    before: (ctx, _abs, t) => {
      hook(ctx, t);
      pill(ctx, t);
    },
  });
}
