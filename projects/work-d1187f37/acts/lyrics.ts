// 歌词层 + 开头钩子 + 视角标签 + 结尾的点赞和评论引导。YouTube 版：歌词只留英文逐词卡拉 OK（素材库歌词层的 cn: false，
// 字号 58 → 68，一句折行时两行一样宽），钩子用第三人称（第一人称会被当成作者本人），标签和引导都是英文。
import "./locale";
import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, W, backOut, easeOut, measure, rr, sinceBeat, text } from "@materials/s0rrow/code/draw";
import { heart } from "@materials/s0rrow/code/sets";
import { createLyricsScene, lyricLines } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { BEAT, END, EV } from "./timeline";
import { UM } from "./story";

/** English only: no Chinese words to light (every English word gets an empty one) */
const LINES = lyricLines(LYRIC_WORDS, LYRIC_WORDS.map((l) => l.map(() => "")));
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
    text(ctx, "He sent a whole paragraph.", 0, -50, { size: 78, font: F.en, fill: "#fff", stroke: C.ink, lw: 14 });
    const bump = abs > EV.um1 && abs < EV.um1 + 0.35 ? Math.sin(phase(abs, EV.um1, EV.um1 + 0.35) * Math.PI) * 0.18 : 0;
    ctx.save();
    ctx.translate(0, 70);
    ctx.scale(1 + bump * 0.3, 1 + bump * 0.3);
    parts(ctx, 0, [["She just replied ", 78, F.en, "#fff"], [`\u201c${UM}\u201d`, 104, F.en, "#ffd166"]]);
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
    const label = stage === 0 ? "His side" : stage === 1 ? "Her side" : "Next morning";
    const w = measure(ctx, label, 44, F.en) + 70;
    ctx.fillStyle = stage === 1 ? "rgba(255,170,200,0.94)" : "rgba(12,12,18,0.62)";
    rr(ctx, -w / 2, -36, w, 72, 36);
    ctx.fill();
    text(ctx, label, 0, 2, { size: 44, font: F.en, fill: stage === 1 ? C.ink : "#fff" });
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
 *  "Like this and your crush / will text you back instantly", tied to the story: a quick reply instead of a slow "k")
 *  and a comment prompt (the rewatch question with something to type: "Answer in the comments"). Both stay to the last
 *  frame. */
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
    text(ctx, "Like this and your crush", W / 2, 610, { size: 60, font: F.en, fill: "#fff", stroke: C.ink, lw: 12 });
    text(ctx, "will text you back instantly", W / 2, 680, { size: 60, font: F.en, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  // 2) comment: the rewatch question, and what to do with the answer
  const ck = smooth(phase(abs, t0 + 0.5, t0 + 0.8));
  if (ck > 0) {
    // (kept narrow: Shorts' buttons run down the right edge)
    const l0 = "Rewatch the first second:",
      l1 = "how many times did she start typing?",
      l2 = "Answer in the comments";
    const w = Math.max(measure(ctx, l1, 40, F.en), measure(ctx, l2, 48, F.en) + 60) + 64;
    ctx.save();
    ctx.globalAlpha *= ck;
    ctx.translate(0, 30 * (1 - ck));
    ctx.fillStyle = "rgba(12,12,18,0.72)";
    rr(ctx, W / 2 - w / 2, 1228, w, 214, 36);
    ctx.fill();
    text(ctx, l0, W / 2, 1276, { size: 40, font: F.en, fill: "#fff" });
    text(ctx, l1, W / 2, 1326, { size: 40, font: F.en, fill: "#fff" });
    const w2 = measure(ctx, l2, 48, F.en);
    text(ctx, l2, W / 2 - 22, 1392, { size: 48, font: F.en, fill: "#ffd166" });
    // a little arrow pointing down at the comments, nudging on the beat
    const ax = W / 2 - 22 + w2 / 2 + 34,
      ay = 1388 + 6 * Math.exp(-7 * sinceBeat(abs));
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
  return createLyricsScene(options, { lines: LINES, end: LYRICS_END, style: lineStyle, cn: false, enSize: 68, before: (ctx, abs) => hook(ctx, abs), after: (ctx, abs) => captions(ctx, abs) });
}
