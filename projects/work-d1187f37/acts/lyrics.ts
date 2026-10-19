// 中英歌词层 + 开头钩子 + 视角标签 + 结尾的点赞和评论引导。歌词用素材库的卡拉 OK 歌词层（英文逐词点亮，中文按词对应）。
import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, W, backOut, easeOut, measure, rr, sinceBeat, text } from "@materials/s0rrow/code/draw";
import { heart } from "@materials/s0rrow/code/sets";
import { createLyricsScene, lyricLines } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { BEAT, END, EV } from "./timeline";

/** 每句中文拆成和英文单词数相同的词，第 i 个中文词用第 i 个英文单词的时间点亮。 */
const CN: string[][] = [
  // Every day we talk a little less
  ["每", "天", "我们 ", "聊得", "越", "来越", "少"],
  // It looks like you are losing interest
  ["看", "起来 ", "你", "对我", "渐渐", "没了", "兴趣"],
  // These feelings I have for you
  ["这份", "心意 ", "我", "只", "给", "你"],
  // But you don't feel the same
  ["可", "你", "却", "不", "这么", "想"],
  // So I'll pack all my things
  ["所以", "我会 ", "收拾", "好", "我的", "行李"],
  // And go run far away
  ["然后", "逃", "得", "远", "远的"],
  // You are, you are very pretty
  ["你", "是 ", "你", "是", "那么", "漂亮"],
  // I'm so very ugly
  ["我", "却", "那么", "丑"],
  // Will you even love me, anymore
  ["你", "还", "会", "爱", "我", "吗"],
  // (love me)
  ["爱", "我"],
  // You can, you can live without me
  ["你", "可以 ", "你", "可以 ", "没有", "我", "也能活"],
  // That makes me unhappy
  ["这", "让", "我", "不开心"],
  // I should get a piercing through my heart
  ["我", "该", "让", "针 ", "刺", "穿", "我的", "心"],
  // What do you even want me to be
  ["你", "到底", "想", "要 ", "我", "变成", "什么", "样"],
  // You never ever pay attention to me
  ["你", "从来", "都", "不", "在意", "过", "我"],
  // So I'll close my blinds in misery
  ["所以", "我", "拉上", "了", "窗帘 ", "独自", "难过"],
  // And I'll wait for you for a couple of weeks
  ["然后", "我", "会", "等", "你 ", "等", "上", "几", "个", "星期"],
];

const LINES = lyricLines(LYRIC_WORDS, CN);
/** 最后一句歌词最晚在这里消失 */
const LYRICS_END = 49.1;
/** 段落样式：副歌粉色（bridge），全片最大的一句，主歌2 暖黄 */
const lineStyle = (li: number) => ({ bridge: li >= 6 && li <= 12, big: li === 11, outro: li >= 13 });

// ---------------------------------------------------------------- hook / title pill / captions
const HOOK_SHRINK = 4.16;
const POV_FLIP = EV.twist; // 他的视角 → 她的视角 (the twist)
const NEXT_DAY = EV.dawn;
const PILL_END = EV.outside;

/** text made of parts with their own size/font/colour, centred at (0, y) */
function parts(ctx: Ctx, y: number, ps: [string, number, string, string][], lw = 14) {
  const total = ps.reduce((sum, [str, sz, fam]) => sum + measure(ctx, str, sz, fam), 0);
  let x = -total / 2;
  for (const [str, sz, fam, col] of ps) {
    const w = measure(ctx, str, sz, fam);
    text(ctx, str, x + w / 2, y, { size: sz, font: fam, fill: col, stroke: C.ink, lw });
    x += w;
  }
}

function hook(ctx: Ctx, abs: number) {
  if (abs > PILL_END + 0.4) return;
  const shrink = easeOut(phase(abs, HOOK_SHRINK, HOOK_SHRINK + 0.45));
  if (shrink < 1) {
    // big hook, fully on screen from the first frame
    const pop = backOut(phase(abs, 0, 0.3));
    const k = 1.12 - 0.12 * pop;
    ctx.save();
    ctx.globalAlpha = 1 - shrink;
    ctx.translate(W / 2, 300);
    ctx.scale(k, k);
    text(ctx, "我发了一大段", 0, -50, { size: 88, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    const bump = abs > EV.um1 && abs < EV.um1 + 0.35 ? Math.sin(phase(abs, EV.um1, EV.um1 + 0.35) * Math.PI) * 0.18 : 0;
    ctx.save();
    ctx.translate(0, 74);
    ctx.scale(1 + bump * 0.3, 1 + bump * 0.3);
    parts(ctx, 0, [["她只回了一个", 88, F.cn, "#fff"], ["「嗯」", 112, F.cn, "#ffd166"]]);
    ctx.restore();
    ctx.restore();
  }
  if (shrink > 0) {
    const a = shrink * (1 - phase(abs, PILL_END, PILL_END + 0.4));
    const flipAt = abs < NEXT_DAY - 0.3 ? POV_FLIP : NEXT_DAY;
    const flip = phase(abs, flipAt - 0.15, flipAt + 0.15);
    const stage = abs < POV_FLIP ? 0 : abs < NEXT_DAY ? 1 : 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 214);
    ctx.scale(1, Math.abs(Math.cos(flip * Math.PI)) || 0.001);
    // plain markers of whose side we are on (the numbered labels didn’t match anything on screen)
    const label = stage === 0 ? "他的视角" : stage === 1 ? "她的视角" : "第二天";
    const w = measure(ctx, label, 38, F.cn) + 70;
    ctx.fillStyle = stage === 1 ? "rgba(255,170,200,0.94)" : "rgba(12,12,18,0.62)";
    rr(ctx, -w / 2, -36, w, 72, 36);
    ctx.fill();
    text(ctx, label, 0, 2, { size: 38, font: F.cn, fill: stage === 1 ? C.ink : "#fff" });
    ctx.restore();
  }
}

/** a big two-line caption with a soft dark band behind it */
function caption(ctx: Ctx, abs: number, a0: number, a1: number, l1: [string, number, string, string][], l2: [string, number, string, string][], y = 560) {
  if (abs < a0 || abs > a1) return;
  const k1 = backOut(phase(abs, a0, a0 + 0.25));
  const k2 = backOut(phase(abs, a0 + 0.3, a0 + 0.55));
  ctx.save();
  ctx.globalAlpha = 1 - phase(abs, a1 - 0.3, a1);
  const band = ctx.createLinearGradient(0, y - 160, 0, y + 160);
  band.addColorStop(0, "rgba(8,8,14,0)");
  band.addColorStop(0.25, "rgba(8,8,14,0.55)");
  band.addColorStop(0.75, "rgba(8,8,14,0.55)");
  band.addColorStop(1, "rgba(8,8,14,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, y - 160, W, 320 * smooth(phase(abs, a0, a0 + 0.2)) + 0.01);
  ctx.translate(W / 2, y);
  ctx.save();
  ctx.scale(k1, k1);
  parts(ctx, -60, l1, 16);
  ctx.restore();
  ctx.save();
  ctx.scale(k2, k2);
  parts(ctx, 60, l2, 16);
  ctx.restore();
  ctx.restore();
}

/** the end card, over the street: a like prompt (a double tap on the screen — two ripples and a big heart — then
 *  「点赞的人，喜欢的人都会秒回你」, tied to the story: a quick reply instead of a slow 「嗯」) and a comment prompt (the
 *  rewatch question with something to type: 「答案打在评论区」). Both stay to the last frame. */
function captions(ctx: Ctx, abs: number) {
  // the double tap lands on the two sixteenths after the downbeat (54.89, 55.02); the second one pops the heart
  const t0 = EV.outside + BEAT / 4,
    t1 = t0 + BEAT / 4;
  if (abs < t0 || abs > END) return;
  const out = 1 - phase(abs, END - 0.12, END);
  const hx = W / 2,
    hy = 430;
  ctx.save();
  ctx.globalAlpha = out;
  // 1) like: double tap — ripples, then the heart pops and throws off little ones, beating with the music
  for (const t of [t0, t1]) {
    const k = phase(abs, t, t + 0.35);
    if (k <= 0 || k >= 1) continue;
    ctx.save();
    ctx.globalAlpha *= 0.8 * (1 - k);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(hx, hy, 30 + 120 * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const pop = backOut(phase(abs, t1, t0 + 0.45));
  if (pop > 0) {
    const burst = phase(abs, t1, t0 + 0.75);
    if (burst < 1)
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI / 2 + (i - 3) * 0.42;
        ctx.save();
        ctx.globalAlpha *= 1 - burst;
        heart(ctx, hx + Math.cos(ang) * (60 + 170 * burst), hy + Math.sin(ang) * (60 + 170 * burst), 16 + (i % 3) * 6, "#ff7fa8", 5100 + i);
        ctx.restore();
      }
    const beat = Math.exp(-7 * sinceBeat(abs));
    heart(ctx, hx, hy, 74 * pop * (1 + 0.07 * beat), "#ff4d6d", 5090);
  }
  const lk = smooth(phase(abs, t0 + 0.3, t0 + 0.55));
  if (lk > 0) {
    ctx.save();
    ctx.globalAlpha *= lk;
    ctx.translate(0, 24 * (1 - lk));
    text(ctx, "点赞的人，喜欢的人都会秒回你", W / 2, 580, { size: 58, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  // 2) comment: the rewatch question, and what to do with the answer
  const ck = smooth(phase(abs, t0 + 0.5, t0 + 0.8));
  if (ck > 0) {
    const l1 = "回看第 1 秒：「对方正在输入...」闪了几次？",
      l2 = "答案打在评论区";
    const w = Math.max(measure(ctx, l1, 38, F.cn), measure(ctx, l2, 46, F.cn) + 60) + 64;
    ctx.save();
    ctx.globalAlpha *= ck;
    ctx.translate(0, 30 * (1 - ck));
    ctx.fillStyle = "rgba(12,12,18,0.72)";
    rr(ctx, W / 2 - w / 2, 1250, w, 160, 36);
    ctx.fill();
    text(ctx, l1, W / 2, 1300, { size: 38, font: F.cn, fill: "#fff" });
    const w2 = measure(ctx, l2, 46, F.cn);
    text(ctx, l2, W / 2 - 22, 1366, { size: 46, font: F.cn, fill: "#ffd166" });
    // a little arrow pointing down at the comments, nudging on the beat
    const ax = W / 2 - 22 + w2 / 2 + 34,
      ay = 1362 + 6 * Math.exp(-7 * sinceBeat(abs));
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ax, ay - 18);
    ctx.lineTo(ax, ay + 14);
    ctx.moveTo(ax - 12, ay + 2);
    ctx.lineTo(ax, ay + 16);
    ctx.lineTo(ax + 12, ay + 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return createLyricsScene(options, { lines: LINES, end: LYRICS_END, style: lineStyle, before: (ctx, abs) => hook(ctx, abs), after: (ctx, abs) => captions(ctx, abs) });
}
