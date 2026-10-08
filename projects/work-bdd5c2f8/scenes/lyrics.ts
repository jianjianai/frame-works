import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { BEAT, C, Ctx, F, W, backOut, beatAt, curve, designScene, easeOut, font, jit, measure, paint, rr, sinceBeat, text, writeOn } from "./lib/draw";
import { LINES, Line } from "./lib/lyrics-data";

/** Lyrics (English karaoke only — YouTube 版, no Chinese row), the hook title and the red-pen corrections. */

const EN_SIZE = 68;
const MAX_W = 900;
const ROW_H = 80;
/** centre of the lyric block (the faces and clues stay above y ≈ 1230) */
const BLOCK_Y = 1335;

// ---------------------------------------------------------------- 每支视频要改的
/** 最后一句歌词最晚在这里消失（尾声文字从这里开始写）。 */
const LYRICS_END = 84.3;
/** 按句下标给段落样式：outro 末段（暖黄）。 */
function lineStyle(li: number) {
  return { outro: li >= 16 };
}
// 开头钩子和常驻标题胶囊的文案、时间点在下面的 hook() 里，也要改。

interface Placed {
  word: [number, number, string];
  index: number;
  x: number;
  w: number;
  row: number;
}
const layoutCache = new Map<number, { placed: Placed[]; rows: number }>();
function layout(ctx: Ctx, li: number, line: Line, size: number) {
  const cached = layoutCache.get(li);
  if (cached) return cached;
  ctx.font = font(size, F.en);
  const space = ctx.measureText(" ").width;
  const rows: Placed[][] = [[]];
  let rowW = 0;
  line.words.forEach((word, index) => {
    const w = ctx.measureText(word[2]).width;
    if (rowW > 0 && rowW + space + w > MAX_W) {
      rows.push([]);
      rowW = 0;
    }
    const row = rows.length - 1;
    rows[row].push({ word, index, x: rowW + (rowW > 0 ? space : 0), w, row });
    rowW += (rowW > 0 ? space : 0) + w;
  });
  // balance two rows: move words down while the second row is clearly shorter (no lonely last word)
  if (rows.length === 2) {
    const width = (r: Placed[]) => r.reduce((s, p, i) => s + p.w + (i ? space : 0), 0);
    while (rows[0].length > 1 && width(rows[1]) + space + rows[0][rows[0].length - 1].w < width(rows[0]) - rows[0][rows[0].length - 1].w) {
      rows[1].unshift(rows[0].pop()!);
    }
    for (const r of rows) {
      let x = 0;
      r.forEach((p, i) => {
        p.x = x + (i ? space : 0);
        x = p.x + p.w;
      });
    }
    rows[1].forEach((p) => (p.row = 1));
  }
  const placed: Placed[] = [];
  for (const r of rows) {
    const total = r.length ? r[r.length - 1].x + r[r.length - 1].w : 0;
    for (const p of r) placed.push({ ...p, x: W / 2 - total / 2 + p.x });
  }
  const res = { placed, rows: rows.length };
  layoutCache.set(li, res);
  return res;
}

function strike(ctx: Ctx, x1: number, x2: number, y: number, p: number, seed: number, lw = 7) {
  if (p <= 0) return;
  const xe = x1 + (x2 - x1) * clamp(p);
  curve(ctx, [[x1 - 6, y + 4], [(x1 + xe) / 2, y - 2], [xe + 6, y + 2]], seed, 1.5);
  paint(ctx, null, C.red, lw);
}

function drawLine(ctx: Ctx, li: number, abs: number) {
  const line = LINES[li];
  const next = LINES[li + 1];
  const showFrom = line.start - 0.18;
  // the last line clears before the outro text starts writing
  const hideAt = Math.min(next ? next.start - 0.06 : LYRICS_END, line.end + (line.fix ? 3 : 1.4));
  if (abs < showFrom || abs > hideAt) return;
  const aIn = easeOut(phase(abs, showFrom, showFrom + 0.22));
  const aOut = 1 - phase(abs, hideAt - 0.16, hideAt);
  const alpha = aIn * aOut;
  const { outro } = lineStyle(li);
  const size = EN_SIZE;
  const { placed, rows } = layout(ctx, li, line, size);
  const blockH = (rows - 1) * ROW_H + 92 + (line.fix ? 96 : 0);
  const top = BLOCK_Y - blockH / 2 + 46 + (1 - aIn) * 24;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font(size, F.en);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const accent = outro ? "#ffd166" : "#ffe45c";
  for (const p of placed) {
    const [ws, wd, word] = p.word;
    const y = top + p.row * ROW_H;
    const sung = abs >= ws;
    const active = sung && abs < ws + Math.max(wd, 0.18);
    const pop = sung ? backOut(phase(abs, ws, ws + 0.18)) : 0;
    const sc = active ? 1 + 0.06 * (1 - phase(abs, ws, ws + 0.3)) : 1;
    ctx.save();
    ctx.translate(p.x + p.w / 2, y - (active ? 3 * (1 - phase(abs, ws, ws + 0.3)) : 0));
    ctx.scale(sc, sc);
    ctx.lineWidth = 12;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(14,12,18,0.92)";
    ctx.strokeText(word, -p.w / 2, 0);
    ctx.fillStyle = active ? accent : sung ? "#ffffff" : "rgba(255,255,255,0.42)";
    ctx.globalAlpha = alpha * (sung ? 0.75 + 0.25 * pop : 1);
    ctx.fillText(word, -p.w / 2, 0);
    ctx.restore();
  }
  // the red pen: strike the claim, write the truth under the line, a caret up to the struck words
  if (line.fix) {
    const f = line.fix;
    const struck = placed.filter((p) => f.en.includes(p.index));
    const sp = phase(abs, f.at, f.at + 0.35);
    for (const p of struck) strike(ctx, p.x, p.x + p.w, top + p.row * ROW_H + 4, sp, 40 + p.index, 8);
    const np = phase(abs, f.at + 0.4, f.at + 1.2);
    if (np > 0 && struck.length) {
      const lastRow = rows - 1;
      const noteY = top + lastRow * ROW_H + 96;
      ctx.save();
      ctx.translate(W / 2 + 10, noteY);
      ctx.rotate(-0.035 + jit(5, 0.004));
      text(ctx, writeOn(f.note, np), 0, 0, { size: 70, font: F.pen, fill: "#ff3b3b", stroke: "#fff", lw: 12 });
      ctx.restore();
      // the caret, when the struck words sit on the last row (nothing between them and the note)
      const onLast = struck.filter((p) => p.row === lastRow);
      if (onLast.length) {
        const cx = (onLast[0].x + onLast[onLast.length - 1].x + onLast[onLast.length - 1].w) / 2;
        const rowY = top + lastRow * ROW_H;
        ctx.save();
        ctx.globalAlpha *= clamp(np * 3);
        curve(ctx, [[cx - 16, rowY + 54], [cx, rowY + 40], [cx + 16, rowY + 54]], 91, 1);
        paint(ctx, null, "#ff3b3b", 6);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

function hook(ctx: Ctx, abs: number) {
  // Big hook text on the first frames, then a small persistent title pill.
  const end = 83.5;
  if (abs > end + 0.4) return;
  // shrinks into the title pill as the whip lands on his phone (2.35), so the lock screen's status bar (✈, the clue
  // the comment prompt asks about) is never under it
  const shrink = easeOut(phase(abs, 2.05, 2.45));
  const flip = phase(abs, 71.25, 71.55);
  const count = flip >= 0.5 ? "99+" : "0";
  if (shrink < 1) {
    const a = 1 - shrink;
    const pop = backOut(phase(abs, 0, 0.28));
    const k = 1.18 - 0.18 * pop;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 330);
    ctx.scale(k, k);
    // third person on purpose: on Douyin 「今天是我17岁生日」 was read as the uploader's own birthday (six in ten
    // comments were birthday wishes, not the story)
    text(ctx, "his 17th birthday.", 0, -60, { size: 86, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    // "0 new messages" with a big red zero
    const parts: [string, string, number, string][] = [
      ["0", "#ff3b3b", 116, F.marker],
      [" new messages", "#fff", 86, F.cn],
    ];
    const total = parts.reduce((s, [str, , sz, fam]) => s + measure(ctx, str, sz, fam), 0);
    let x = -total / 2;
    for (const [str, col, sz, fam] of parts) {
      const w = measure(ctx, str, sz, fam);
      const wob = str === "0" ? Math.sin(abs * 9) * 0.06 : 0;
      ctx.save();
      ctx.translate(x + w / 2, 62);
      ctx.rotate(wob);
      text(ctx, str, 0, str === "0" ? 6 : 0, { size: sz, font: fam, fill: col, stroke: C.ink, lw: 14 });
      ctx.restore();
      x += w;
    }
    ctx.restore();
  }
  if (shrink > 0) {
    const a = shrink * (1 - phase(abs, end, end + 0.4));
    const pre = "17th birthday · ",
      post = " new messages";
    ctx.save();
    ctx.globalAlpha = a;
    const pw = measure(ctx, pre, 40, F.cn);
    const cw = measure(ctx, count, 44, F.marker);
    const sw = measure(ctx, post, 40, F.cn);
    const w = pw + cw + sw + 60;
    const bump = flip > 0 && flip < 1 ? Math.sin(flip * Math.PI) * 0.25 : 0;
    ctx.translate(W / 2, 214);
    ctx.scale(1 + bump, 1 + bump);
    ctx.fillStyle = "rgba(12,12,18,0.62)";
    rr(ctx, -w / 2, -36, w, 72, 36);
    ctx.fill();
    let x = -(pw + cw + sw) / 2;
    text(ctx, pre, x + pw / 2, 2, { size: 40, font: F.cn, fill: "#fff" });
    x += pw;
    text(ctx, count, x + cw / 2, 4, { size: 44, font: F.marker, fill: count === "0" ? "#ff6b6b" : "#ffd84a" });
    x += cw;
    text(ctx, post, x + sw / 2, 2, { size: 40, font: F.cn, fill: "#fff" });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 重置版的剪法（作品时间 → 歌曲时间）
/** The music plays as recorded up to 21.10 (chorus 1, then the first line of chorus 2 — the picture has already cut to
 *  the walk home at 16.96), then jumps 16 bars to the same spot of chorus 3 (a vocal gap on both sides) and runs on in
 *  song time. The lyrics follow the audio actually playing. */
const SPLICE = 21.1;
const JUMP = 16 * 4 * BEAT; // 33.39
const songTime = (t: number) => (t < SPLICE ? t : t + JUMP);
const LINES_A = [0, 1, 2, 3, 4];
const LINES_B = [13, 14, 15, 16, 17, 18, 19];

/** The end card, over the epilogue to the last frame. Like: a double tap in the middle of the screen (two ripples,
 *  a big heart thrown up, beating with the music) and a line tied to the story; comment: a question answered with a
 *  timestamp, which also sends people back to the opening (the ✈ in the status bar from 0:02). Song time. */
const PROMPTS = beatAt(166); // song 86.87 = work 53.48
const SONG_END = beatAt(172); // song 90.00 = work 56.61
function endPrompts(ctx: Ctx, abs: number) {
  const t0 = PROMPTS,
    t1 = t0 + BEAT / 4; // the double tap: on the beat and the sixteenth after
  if (abs < t0 || abs > SONG_END) return;
  const hx = W / 2,
    hy = 430;
  ctx.save();
  ctx.globalAlpha = 1 - phase(abs, SONG_END - 0.5, SONG_END);
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
        heartShape(ctx, hx + Math.cos(ang) * (60 + 170 * burst), hy + Math.sin(ang) * (60 + 170 * burst), 16 + (i % 3) * 6, "#ff7fa8");
        ctx.restore();
      }
    heartShape(ctx, hx, hy, 74 * pop * (1 + 0.07 * Math.exp(-7 * sinceBeat(abs))), "#ff4d6d");
  }
  const lk = smooth(phase(abs, t0 + 0.3, t0 + 0.55));
  if (lk > 0) {
    ctx.save();
    ctx.globalAlpha *= lk;
    ctx.translate(0, 24 * (1 - lk));
    text(ctx, "like = 99+ texts on your birthday", W / 2, 565, { size: 62, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  const ck = smooth(phase(abs, t0 + 0.5, t0 + 0.8));
  if (ck > 0) {
    const l1 = "rewatch: when can you first tell",
      l2 = "he's on airplane mode?",
      l3 = "comment the timestamp";
    const w = Math.max(measure(ctx, l1, 46, F.cn), measure(ctx, l2, 46, F.cn), measure(ctx, l3, 50, F.cn) + 60) + 72;
    const y0 = 1356;
    ctx.save();
    ctx.globalAlpha *= ck;
    ctx.translate(0, 30 * (1 - ck));
    ctx.fillStyle = "rgba(12,12,18,0.78)";
    rr(ctx, W / 2 - w / 2, y0, w, 214, 36);
    ctx.fill();
    text(ctx, l1, W / 2, y0 + 50, { size: 46, font: F.cn, fill: "#fff" });
    text(ctx, l2, W / 2, y0 + 102, { size: 46, font: F.cn, fill: "#fff" });
    const w3 = measure(ctx, l3, 50, F.cn);
    text(ctx, l3, W / 2 - 22, y0 + 164, { size: 50, font: F.cn, fill: "#ffd166" });
    // a little arrow down to the comments, nudging on the beat (drawn: the font subsets have no arrow)
    const ax = W / 2 - 22 + w3 / 2 + 34,
      ay = y0 + 160 + 6 * Math.exp(-7 * sinceBeat(abs));
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
function heartShape(ctx: Ctx, x: number, y: number, r: number, color: string) {
  if (r <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.25, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.7, -r * 1.25, r * 1.4, -r * 0.1, 0, r * 0.9);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.08);
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, t) => {
    const abs = songTime(t);
    hook(ctx, abs);
    for (const i of t < SPLICE ? LINES_A : LINES_B) drawLine(ctx, i, abs);
    endPrompts(ctx, abs);
  });
}
