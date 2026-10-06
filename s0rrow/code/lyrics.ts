import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, W, backOut, curve, designScene, easeOut, font, jit, measure, paint, rr, text, writeOn } from "./lib/draw";
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
const LYRICS_END = 49.1;
/** 按句下标给段落样式：bridge 桥段（粉色），big 全片最大的一句，outro 末段（暖黄）。 */
function lineStyle(li: number) {
  return { bridge: li >= 6 && li <= 12, big: li === 11, outro: li >= 13 };
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

// ---------------------------------------------------------------- hook / title pill / red pen
const HOOK_SHRINK = 4.16;
const COUNT_UP = 12.05; // 7 → 8 days
const POV_FLIP = 32.79; // 小狗视角 → 他的视角
const PEN = 35.25; // red-pen correction while he strokes its head
const PILL_END = 49.0;
const BAR16_18 = 36.875; // the red pen clears before the phone shot

function pawIcon(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.25, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [[-0.55, -0.35], [-0.2, -0.7], [0.2, -0.7], [0.55, -0.35]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * r, y + dy * r, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** text made of parts with their own size/font/colour, centred at (0, y) */
function parts(ctx: Ctx, y: number, ps: [string, number, string, string][], lw = 14) {
  const total = ps.reduce((sum, [str, sz, fam]) => sum + measure(ctx, str, sz, fam), 0);
  let x = -total / 2;
  for (const [str, sz, fam, col] of ps) {
    const w = measure(ctx, str, sz, fam);
    text(ctx, str, x + w / 2, y + (fam === F.marker ? 6 : 0), { size: sz, font: fam, fill: col, stroke: C.ink, lw });
    x += w;
  }
}

function hook(ctx: Ctx, abs: number) {
  if (abs > PILL_END + 0.4) return;
  const shrink = easeOut(phase(abs, HOOK_SHRINK, HOOK_SHRINK + 0.45));
  const days = abs >= COUNT_UP ? "8" : "7";
  if (shrink < 1) {
    // big hook, fully on screen from the first frame
    const a = 1 - shrink;
    const pop = backOut(phase(abs, 0, 0.3));
    const k = 1.12 - 0.12 * pop;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 330);
    ctx.scale(k, k);
    // label
    const lw = measure(ctx, "小狗视角", 40, F.cn) + 96;
    ctx.fillStyle = "#ffd166";
    rr(ctx, -lw / 2, -170, lw, 66, 33);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 5;
    ctx.stroke();
    pawIcon(ctx, -lw / 2 + 40, -137, 20, C.ink);
    text(ctx, "小狗视角", 22, -136, { size: 40, font: F.cn, fill: C.ink });
    const wob = Math.sin(abs * 9) * 0.05;
    parts(ctx, -40, [["他已经 ", 88, F.cn, "#fff"], [days, 136, F.cn, "#ff4d4d"], [" 天", 88, F.cn, "#fff"]]);
    void wob;
    text(ctx, "没摸过我的头了", 0, 70, { size: 88, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14 });
    ctx.restore();
  }
  if (shrink > 0) {
    const a = shrink * (1 - phase(abs, PILL_END, PILL_END + 0.4));
    const flip = phase(abs, POV_FLIP - 0.15, POV_FLIP + 0.15);
    const his = abs >= POV_FLIP;
    const bump = abs > COUNT_UP && abs < COUNT_UP + 0.35 ? Math.sin(phase(abs, COUNT_UP, COUNT_UP + 0.35) * Math.PI) * 0.22 : 0;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 214);
    ctx.scale(1 + bump, (1 + bump) * Math.abs(Math.cos(flip * Math.PI)));
    const label = his ? "他的视角" : `小狗视角 · ${days} 天没被摸头`;
    const w = measure(ctx, label, 38, F.cn) + 110;
    ctx.fillStyle = his ? "rgba(255,209,102,0.92)" : "rgba(12,12,18,0.62)";
    rr(ctx, -w / 2, -36, w, 72, 36);
    ctx.fill();
    pawIcon(ctx, -w / 2 + 40, 2, 17, his ? C.ink : "#ffd166");
    if (his) text(ctx, label, 22, 2, { size: 38, font: F.cn, fill: C.ink });
    else {
      const pre = "小狗视角 · ";
      const pw = measure(ctx, pre, 38, F.cn),
        dw = measure(ctx, days, 48, F.cn),
        sw = measure(ctx, " 天没被摸头", 38, F.cn);
      let x = 22 - (pw + dw + sw) / 2;
      text(ctx, pre, x + pw / 2, 2, { size: 38, font: F.cn, fill: "#fff" });
      x += pw;
      text(ctx, days, x + dw / 2, 2, { size: 48, font: F.cn, fill: "#ff6b6b" });
      x += dw;
      text(ctx, " 天没被摸头", x + sw / 2, 2, { size: 38, font: F.cn, fill: "#fff" });
    }
    ctx.restore();
  }
  // red pen: the claim from the hook, crossed out
  if (abs > PEN - 0.3 && abs < BAR16_18) {
    const a = smooth(phase(abs, PEN - 0.3, PEN)) * (1 - phase(abs, BAR16_18 - 0.3, BAR16_18));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 312);
    const claim = "8 天没被摸头";
    const cw = measure(ctx, claim, 54, F.cn);
    text(ctx, claim, 0, 0, { size: 54, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10 });
    const sp = phase(abs, PEN, PEN + 0.35);
    if (sp > 0) {
      curve(ctx, [[-cw / 2 - 10, 6], [0, -4], [-cw / 2 - 10 + (cw + 20) * sp, 2]], 77, 1.5);
      paint(ctx, null, "#ff3b3b", 9);
    }
    const np = phase(abs, PEN + 0.35, PEN + 1.2);
    if (np > 0) {
      ctx.save();
      ctx.translate(16, 96);
      ctx.rotate(-0.04);
      text(ctx, writeOn("每天都有，在你睡着后", np), 0, 0, { size: 66, font: F.pen, fill: "#ff3b3b", stroke: "#fff", lw: 12 });
      ctx.restore();
    }
    ctx.restore();
  }
}

/** The reveal caption that lands on "...through my heart". */
function twistCaption(ctx: Ctx, abs: number) {
  const a0 = 31.95,
    a1 = 33.65;
  if (abs < a0 || abs > a1) return;
  const k1 = backOut(phase(abs, a0, a0 + 0.25));
  const k2 = backOut(phase(abs, a0 + 0.3, a0 + 0.55));
  const out = 1 - phase(abs, a1 - 0.3, a1);
  ctx.save();
  ctx.globalAlpha = out;
  // a soft dark band behind the caption so it reads over any picture
  const band = ctx.createLinearGradient(0, 400, 0, 720);
  band.addColorStop(0, "rgba(8,8,14,0)");
  band.addColorStop(0.25, "rgba(8,8,14,0.55)");
  band.addColorStop(0.75, "rgba(8,8,14,0.55)");
  band.addColorStop(1, "rgba(8,8,14,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 400, W, 320 * smooth(phase(abs, a0, a0 + 0.2)) + 0.01);
  ctx.translate(W / 2, 560);
  ctx.save();
  ctx.scale(k1, k1);
  text(ctx, "他每天晚归", 0, -60, { size: 92, font: F.cn, fill: "#fff", stroke: C.ink, lw: 16 });
  ctx.restore();
  ctx.save();
  ctx.scale(k2, k2);
  parts(ctx, 60, [["是在", 76, F.cn, "#fff"], ["送外卖", 92, F.cn, "#ffd166"], ["攒手术费", 76, F.cn, "#fff"]], 14);
  ctx.restore();
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    hook(ctx, abs);
    for (let i = 0; i < LINES.length; i++) drawLine(ctx, i, abs);
    twistCaption(ctx, abs);
  });
}
