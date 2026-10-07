import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { BEAT, C, Ctx, F, W, backOut, beatAt, curve, designScene, easeOut, font, jit, measure, paint, rr, sinceBeat, text, writeOn } from "./lib/draw";
import { LINES, Line } from "./lib/lyrics-data";

/** Lyrics (EN karaoke + CN translation), the hook title and the red-pen corrections. */

const EN_SIZE = 58;
const CN_SIZE = 64;
const MAX_W = 820;
const CN_MAX_W = 900;
const ROW_H = 68;
const CN_ROW_H = 78;

// ---------------------------------------------------------------- 每支视频要改的
/** 最后一句歌词最晚在这里消失（尾声文字从这里开始写）。 */
const LYRICS_END = 84.3;
/** 按句下标给段落样式：bridge 桥段（粉色），big 全片最大的一句，outro 末段（暖黄）。 */
function lineStyle(li: number) {
  return { bridge: li >= 8 && li <= 11, big: li === 11, outro: li >= 16 };
}
// 开头钩子和常驻标题胶囊的文案、时间点在下面的 hook() 里，也要改。

interface CnRow {
  text: string;
  /** index of the first character in the full line */
  start: number;
  w: number;
  /** left offset and width of every character */
  xs: number[];
  cw: number[];
}
/** Split a Chinese line at the space that balances the two halves best, if it is too wide. */
const cnCache = new Map<string, CnRow[]>();
function cnLines(ctx: Ctx, s: string, size: number): CnRow[] {
  const key = size + s;
  const hit = cnCache.get(key);
  if (hit) return hit;
  let parts: [string, number][] = [[s, 0]];
  if (measure(ctx, s, size, F.cn) > CN_MAX_W) {
    let best = Infinity;
    for (let i = 0; i < s.length; i++)
      if (s[i] === " ") {
        const a = s.slice(0, i),
          b = s.slice(i + 1);
        const d = Math.abs(measure(ctx, a, size, F.cn) - measure(ctx, b, size, F.cn));
        if (d < best) {
          best = d;
          parts = [[a, 0], [b, i + 1]];
        }
      }
  }
  const out = parts.map(([text, start]) => {
    // lay out character by character; the space between phrases is half a character wide
    const chars = Array.from(text);
    const cw = chars.map((ch) => (ch === " " ? size * 0.5 : measure(ctx, ch, size, F.cn)));
    const xs: number[] = [];
    let x = 0;
    for (const w of cw) {
      xs.push(x);
      x += w;
    }
    return { text, start, w: x, xs, cw };
  });
  cnCache.set(key, out);
  return out;
}

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
  const { bridge, big, outro } = lineStyle(li);
  const size = big ? 84 : EN_SIZE;
  const { placed, rows } = layout(ctx, li, line, size);
  const rowH = big ? 96 : ROW_H;
  const cnCount = cnLines(ctx, line.cn, big ? 76 : CN_SIZE).length;
  const blockH = (rows - 1) * rowH + (big ? 104 : 88) + (cnCount - 1) * CN_ROW_H;
  const top = (line.fix ? 1290 : 1335) - blockH / 2 + (1 - aIn) * 24;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font(size, F.en);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const accent = outro ? "#ffd166" : bridge ? "#ff9ec4" : "#ffe45c";
  for (const p of placed) {
    const [ws, wd, word] = p.word;
    const y = top + p.row * rowH;
    const sung = abs >= ws;
    const active = sung && abs < ws + Math.max(wd, 0.18);
    const pop = sung ? backOut(phase(abs, ws, ws + 0.18)) : 0;
    const sc = active ? 1 + 0.06 * (1 - phase(abs, ws, ws + 0.3)) : 1;
    ctx.save();
    ctx.translate(p.x + p.w / 2, y - (active ? 3 * (1 - phase(abs, ws, ws + 0.3)) : 0));
    ctx.scale(sc, sc);
    ctx.lineWidth = 11;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(14,12,18,0.92)";
    ctx.strokeText(word, -p.w / 2, 0);
    ctx.fillStyle = active ? accent : sung ? "#ffffff" : "rgba(255,255,255,0.42)";
    ctx.globalAlpha = alpha * (sung ? 0.75 + 0.25 * pop : 1);
    ctx.fillText(word, -p.w / 2, 0);
    ctx.restore();
  }
  // English strike-through
  if (line.fix) {
    const sp = phase(abs, line.fix.at, line.fix.at + 0.35);
    for (const p of placed)
      if (line.fix.en.includes(p.index)) strike(ctx, p.x, p.x + p.w, top + p.row * rowH + 2, sp, 40 + p.index);
  }
  // Chinese (wraps at the space nearest the middle when a line is too wide); each character
  // lights up while the English words it translates are being sung
  const cnSize = big ? 76 : CN_SIZE;
  const cnRows = cnLines(ctx, line.cn, cnSize);
  const cnY = top + (rows - 1) * rowH + (big ? 104 : 88);
  const cnA = phase(abs, line.start - 0.1, line.start + 0.35);
  const cnDone = bridge ? "#ffe0ec" : "#ffffff";
  ctx.font = font(cnSize, F.cn);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  cnRows.forEach((row, r) => {
    const y = cnY + r * CN_ROW_H;
    const x0 = W / 2 - row.w / 2;
    // horizontal extent of each word in this row, so a word pops as one piece
    const span = new Map<number, [number, number]>();
    Array.from(row.text).forEach((ch, j) => {
      const id = line.cnTimes[row.start + j]?.[2] ?? -1;
      if (ch === " " || id < 0) return;
      const sp = span.get(id);
      const a = row.xs[j],
        b = row.xs[j] + row.cw[j];
      span.set(id, sp ? [Math.min(sp[0], a), Math.max(sp[1], b)] : [a, b]);
    });
    Array.from(row.text).forEach((ch, j) => {
      if (ch === " ") return;
      const [cs, cd, id] = line.cnTimes[row.start + j] ?? [-1, 0, -1];
      const sung = cs >= 0 && abs >= cs;
      const active = sung && abs < cs + Math.max(cd, 0.18);
      const k = active ? 1 - phase(abs, cs, cs + 0.25) : 0;
      const [wa, wb] = span.get(id) ?? [row.xs[j], row.xs[j] + row.cw[j]];
      const wc = x0 + (wa + wb) / 2;
      ctx.save();
      ctx.translate(wc, y - 3 * k);
      ctx.scale(1 + 0.08 * k, 1 + 0.08 * k);
      ctx.globalAlpha = alpha * cnA;
      ctx.lineWidth = 11;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(14,12,18,0.92)";
      const lx = x0 + row.xs[j] - wc;
      ctx.strokeText(ch, lx, 0);
      ctx.fillStyle = active ? accent : sung ? cnDone : "rgba(255,255,255,0.5)";
      ctx.fillText(ch, lx, 0);
      ctx.restore();
    });
  });
  ctx.globalAlpha = alpha * cnA;
  if (line.fix) {
    const f = line.fix;
    let r = cnRows.findIndex((row) => row.text.includes(f.cn));
    if (r < 0) r = 0;
    const cr = cnRows[r];
    const i = Math.max(0, cr.text.indexOf(f.cn));
    const end = cr.text.includes(f.cn) ? i + f.cn.length : cr.text.length;
    const left = W / 2 - cr.w / 2;
    const x0 = left + cr.xs[i];
    const x1 = left + (end < cr.xs.length ? cr.xs[end] : cr.w);
    const rowY = cnY + r * CN_ROW_H;
    const sp = phase(abs, f.at + 0.12, f.at + 0.5);
    strike(ctx, x0, x1, rowY, sp, 77, 9);
    const np = phase(abs, f.at + 0.45, f.at + 1.25);
    if (np > 0) {
      const lastY = cnY + (cnRows.length - 1) * CN_ROW_H;
      const s = writeOn(f.note, np);
      ctx.save();
      ctx.translate(W / 2 + 10, lastY + 86);
      ctx.rotate(-0.035 + jit(5, 0.004));
      text(ctx, s, 0, 0, { size: 70, font: F.pen, fill: "#ff3b3b", stroke: "#fff", lw: 12 });
      ctx.restore();
      // caret pointing up to the struck words (only when nothing sits between them)
      if (r === cnRows.length - 1) {
        ctx.save();
        ctx.globalAlpha *= clamp(np * 3);
        curve(ctx, [[(x0 + x1) / 2 - 16, rowY + 50], [(x0 + x1) / 2, rowY + 36], [(x0 + x1) / 2 + 16, rowY + 50]], 91, 1);
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
  const shrink = easeOut(phase(abs, 4.15, 4.6));
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
    text(ctx, "今天是我17岁生日", 0, -56, { size: 80, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    // "手机 0 条新消息" with a red zero
    const parts: [string, string, number][] = [
      ["手机 ", "#fff", 80],
      ["0", "#ff3b3b", 112],
      [" 条新消息", "#fff", 80],
    ];
    const fam = (str: string) => (str === "0" ? F.marker : F.cn);
    const total = parts.reduce((s, [str, , sz]) => s + measure(ctx, str, sz, fam(str)), 0);
    let x = -total / 2;
    for (const [str, col, sz] of parts) {
      const w = measure(ctx, str, sz, fam(str));
      const wob = str === "0" ? Math.sin(abs * 9) * 0.06 : 0;
      ctx.save();
      ctx.translate(x + w / 2, 62);
      ctx.rotate(wob);
      text(ctx, str, 0, str === "0" ? 6 : 0, { size: sz, font: str === "0" ? F.marker : F.cn, fill: col, stroke: C.ink, lw: 14 });
      ctx.restore();
      x += w;
    }
    ctx.restore();
  }
  if (shrink > 0) {
    const a = shrink * (1 - phase(abs, end, end + 0.4));
    const label = `17岁生日 · ${count} 条新消息`;
    ctx.save();
    ctx.globalAlpha = a;
    const w = measure(ctx, label, 38, F.cn) + 56;
    const bump = flip > 0 && flip < 1 ? Math.sin(flip * Math.PI) * 0.25 : 0;
    ctx.translate(W / 2, 214);
    ctx.scale(1 + bump, 1 + bump);
    ctx.fillStyle = "rgba(12,12,18,0.62)";
    rr(ctx, -w / 2, -36, w, 72, 36);
    ctx.fill();
    const pre = "17岁生日 · ";
    const pw = measure(ctx, pre, 38, F.cn);
    const cw = measure(ctx, count, 44, F.marker);
    const sw = measure(ctx, " 条新消息", 38, F.cn);
    let x = -(pw + cw + sw) / 2;
    text(ctx, pre, x + pw / 2, 2, { size: 38, font: F.cn, fill: "#fff" });
    x += pw;
    text(ctx, count, x + cw / 2, 4, { size: 44, font: F.marker, fill: count === "0" ? "#ff6b6b" : "#ffd84a" });
    x += cw;
    text(ctx, " 条新消息", x + sw / 2, 2, { size: 38, font: F.cn, fill: "#fff" });
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
 *  a big heart thrown up, beating with the music) and a line tied to the story; comment: a question answered with one
 *  number, which also sends people back to the opening (「回看：第几秒就能看出他开着飞行模式？」— the ✈ in the
 *  status bar from 0:02). Song time. */
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
    text(ctx, "点赞的人，生日那天消息 99+", W / 2, 565, { size: 58, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  const ck = smooth(phase(abs, t0 + 0.5, t0 + 0.8));
  if (ck > 0) {
    const l1 = "回看：第几秒就能看出他开着飞行模式？",
      l2 = "答案打在评论区";
    const w = Math.max(measure(ctx, l1, 40, F.cn), measure(ctx, l2, 46, F.cn) + 60) + 64;
    ctx.save();
    ctx.globalAlpha *= ck;
    ctx.translate(0, 30 * (1 - ck));
    ctx.fillStyle = "rgba(12,12,18,0.78)";
    rr(ctx, W / 2 - w / 2, 1392, w, 160, 36);
    ctx.fill();
    text(ctx, l1, W / 2, 1442, { size: 40, font: F.cn, fill: "#fff" });
    const w2 = measure(ctx, l2, 46, F.cn);
    text(ctx, l2, W / 2 - 22, 1508, { size: 46, font: F.cn, fill: "#ffd166" });
    // a little arrow down to the comments, nudging on the beat (drawn: the font subsets have no arrow)
    const ax = W / 2 - 22 + w2 / 2 + 34,
      ay = 1504 + 6 * Math.exp(-7 * sinceBeat(abs));
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
