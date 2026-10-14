// 歌词层：歌词怎么画在素材库 s0rrow/code/lyrics.ts，这里放这首歌的中文、剪辑后的时间、段落样式、开头钩子和结尾引导。
// 音乐剪过两次（见 timeline.ts）：songTime 把作品时间换回歌曲时间，show 只让正在放的那一段歌词出现。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, W, backOut, easeOut, measure, rr, text } from "@materials/s0rrow/code/draw";
import { emph, fade } from "./ease";
import { createLyricsScene, lyricLines } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { CUT1, CUT2, END, at, songTime } from "./timeline";

// 每句中文拆成和英文单词数相同的词（第 i 个中文词跟第 i 个英文词亮起）；"" 表示这个英文词不亮。
const L1 = ["我会", "翻遍", "你的", "动态 ", "直到", "我", "双眼", "", "发麻"];
const L2 = ["你", "根本", "", "不知道 ", "", "", "我", "有多", "想", "你"];
const L3 = ["我会", "看遍", "", "你的", "转发 ", "和", "", "", "你的", "心事"];
const L4 = ["因为", "我", "没法", "陪着", "你 ", "你", "想要的", "是另一个", "他"];
const CN: string[][] = [
  L1, L2, L3, L4,
  L1, L2, L3, L4,
  ["看着", "你", "那么", "开心 ", "那么", "开心"],
  ["亲吻着", "别", "人 ", "那么", "开心"],
  ["让", "我", "好", "孤单 ", "好", "孤单"],
  ["为什么", "", "", "这么", "难"],
  ["", "看", "向", "", "镜子 ", "好", "孤单"],
  ["你", "", "看到", "的 ", "只是", "一张", "反光的", "照片"],
  ["那么", "开心"],
  L1, L2, L3, L4,
  L1, L2, L3, L4,
];

/** 第一遍副歌 0–3 句，桥段 8–14 句（粉色，唱到 mirror 那句最大），最后一遍副歌 19–22 句（暖黄）。 */
const show = (i: number, t: number) => (t < CUT1 ? i <= 3 : t < CUT2 ? i >= 8 && i <= 14 : i >= 19);
const style = (i: number) => ({ bridge: i >= 8 && i <= 14, big: i === 12, outro: i >= 19 });

/** 开头钩子：首帧完整出现，表情特写（第 8 拍）开始时缩成顶部的胶囊，到第一遍副歌唱完消失。 */
function hook(c: Ctx, _song: number, t: number) {
  const k0 = at(8);
  // the hook really shrinks up into the pill (it used to just fade out while the pill faded in)
  const shrink = emph(phase(t, k0, k0 + 0.4));
  if (shrink < 1) {
    const k = (1.08 - 0.08 * backOut(phase(t, 0, 0.3))) * (1 - 0.62 * shrink);
    c.save();
    c.globalAlpha = 1 - fade((shrink - 0.35) / 0.65);
    c.translate(W / 2, 262 + (216 - 262) * shrink);
    c.scale(k, k);
    text(c, "一个没头像的陌生号", 0, -58, { size: 82, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    text(c, "盯了我三年", 0, 58, { size: 92, font: F.cn, fill: "#ffd166", stroke: C.ink, lw: 14 });
    c.restore();
  }
  const out = fade(phase(t, at(31), at(31) + 0.3));
  if (shrink > 0 && out < 1) {
    const label = "那个没头像的号";
    const w = measure(c, label, 38, F.cn) + 70;
    c.save();
    // the pill grows out of the shrinking hook, and later lifts away as it fades
    const pk = fade((shrink - 0.3) / 0.7);
    c.globalAlpha = pk * (1 - out);
    c.translate(W / 2, 214 - 14 * out);
    c.scale(0.7 + 0.3 * pk, 0.7 + 0.3 * pk);
    c.translate(-W / 2, -214);
    c.fillStyle = "rgba(12,12,18,0.62)";
    rr(c, W / 2 - w / 2, 214 - 36, w, 72, 36);
    c.fill();
    text(c, label, W / 2, 216, { size: 38, font: F.cn, fill: "#fff" });
    c.restore();
  }
}

/** a filled heart centred at (0, 0), r ≈ half its width */
function heart(c: Ctx, r: number) {
  c.beginPath();
  c.moveTo(0, r * 0.9);
  c.bezierCurveTo(-r * 1.3, 0, -r * 1.1, -r, -r * 0.5, -r);
  c.bezierCurveTo(-r * 0.15, -r, 0, -r * 0.7, 0, -r * 0.5);
  c.bezierCurveTo(0, -r * 0.7, r * 0.15, -r, r * 0.5, -r);
  c.bezierCurveTo(r * 1.1, -r, r * 1.3, 0, 0, r * 0.9);
  c.closePath();
}

/** 结尾两个引导（留到最后一帧）：点赞——画面中间模拟一次双击 + 祝福；评论——一个打数字就能回答的问题。 */
const GUIDE_AT = 45.0;
function guides(c: Ctx, _song: number, t: number) {
  if (t < GUIDE_AT) return;
  const u = t - GUIDE_AT;
  // the comment question
  const qa = easeOut(phase(u, 0, 0.3));
  c.save();
  c.globalAlpha = qa;
  const band = c.createLinearGradient(0, 300, 0, 620);
  band.addColorStop(0, "rgba(8,8,14,0)");
  band.addColorStop(0.3, "rgba(8,8,14,0.5)");
  band.addColorStop(0.7, "rgba(8,8,14,0.5)");
  band.addColorStop(1, "rgba(8,8,14,0)");
  c.fillStyle = band;
  c.fillRect(0, 300, W, 320);
  text(c, "回看：第几秒就能看出他是爸爸？", W / 2, 420, { size: 58, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
  text(c, "答案打在评论区", W / 2 - 24, 508, { size: 44, font: F.cn, fill: "#ffd166", stroke: C.ink, lw: 10 });
  // a drawn arrow pointing down
  c.strokeStyle = "#ffd166";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(W / 2 + 180, 484);
  c.lineTo(W / 2 + 180, 530);
  c.moveTo(W / 2 + 164, 514);
  c.lineTo(W / 2 + 180, 532);
  c.lineTo(W / 2 + 196, 514);
  c.stroke();
  c.restore();
  // the double tap in the middle
  const taps = [0.25, 0.42];
  for (const t0 of taps) {
    const p = phase(u, t0, t0 + 0.45);
    if (p <= 0 || p >= 1) continue;
    c.save();
    // a tap ripple: bursts out and slows, fading softly
    c.globalAlpha = 0.8 * Math.pow(1 - p, 1.5);
    c.strokeStyle = "#fff";
    c.lineWidth = 6;
    c.beginPath();
    c.arc(W / 2, 700, 40 + 120 * (1 - Math.pow(1 - p, 3)), 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  const hp = phase(u, 0.42, 0.7);
  if (hp > 0) {
    c.save();
    c.translate(W / 2, 700 - 40 * easeOut(phase(u, 0.7, 1.6)));
    const s = backOut(hp);
    c.scale(s, s);
    c.rotate(-0.12);
    heart(c, 110);
    c.fillStyle = "#fe2c55";
    c.fill();
    c.lineWidth = 10;
    c.strokeStyle = C.ink;
    c.stroke();
    c.restore();
    c.save();
    c.globalAlpha = easeOut(phase(u, 0.6, 0.9));
    text(c, "点赞的人，爸妈都健健康康", W / 2, 860, { size: 54, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
    c.restore();
  }
  void clamp;
}

export function createScene(options: SceneOptions) {
  return createLyricsScene(options, {
    lines: lyricLines(LYRIC_WORDS, CN),
    end: songTime(END) - 0.1,
    style,
    songTime,
    show,
    before: hook,
    after: guides,
  });
}
