/**
 * 中英卡拉 OK 歌词层（三支片子共用的一套）：英文逐词点亮（唱到的词弹一下，当前的词变成段落的强调色），中文按词对应着点亮
 * （第 i 个中文词用第 i 个英文词的时间），太宽时在最平衡的空格处换行；某一句可以被红笔改写（划掉英文词和中文、在下面手写改写）。
 * 歌词数据由作品给：lyricLines(逐词时间, 中文分词, 红笔改写)。段落样式（桥段粉色、全片最大的一句、尾段暖黄）、钩子标题、
 * 大字幕 caption 和结尾引导由作品通过 style / before / after 加进来；音乐剪过时用 songTime 把作品时间换成歌曲时间。
 */
import { z } from "zod";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, W, backOut, beginFrame, curve, designScene, easeOut, font, jit, loadFonts, measure, paint, text, writeOn } from "./draw";

const EN_SIZE = 58;
const CN_SIZE = 64;
const MAX_W = 820;
const CN_MAX_W = 900;
const ROW_H = 68;
const CN_ROW_H = 78;

/** A red-pen correction of one line. */
export interface Fix {
  /** English word indexes to strike out */
  en: number[];
  /** the Chinese substring to strike out */
  cn: string;
  /** what the red pen writes underneath */
  note: string;
  /** when the strike starts (song time, seconds) */
  at: number;
}
export interface Line {
  /** [start, duration, word] per English word (song time) */
  words: [number, number, string][];
  start: number;
  end: number;
  cn: string;
  /** per Chinese character: [start, duration, word index] (-1 for the gaps between phrases) */
  cnTimes: [number, number, number][];
  fix?: Fix;
}
/** Word timings per line, as tools/fetch-krc.mjs writes them: [start, duration, word][][]. */
export type LyricWords = [number, number, string][][];

/**
 * The lines from word timings and the Chinese split into as many words as each English line has: the i-th Chinese
 * word lights with the i-th English word; a trailing space leaves half a character between phrases (only between
 * phrases); "" means that English word has no Chinese (it never lights). Write a fluent Chinese line first, then cut it
 * in the English word order (inversion, or a word that never lights, when the orders differ).
 */
export function lyricLines(words: LyricWords, cn: string[][], fixes: Record<number, Fix> = {}): Line[] {
  return words.map((line, i) => {
    const tokens = cn[i] ?? [];
    if (tokens.length !== line.length) throw new Error(`第 ${i + 1} 句中英词数不一致（英文 ${line.length}，中文 ${tokens.length}）：${tokens.join("")}`);
    const cnTimes: [number, number, number][] = [];
    tokens.forEach((token, w) => {
      for (const ch of Array.from(token)) cnTimes.push(ch === " " ? [-1, 0, -1] : [line[w][0], line[w][1], w]);
    });
    const last = line[line.length - 1];
    return { words: line, start: line[0][0], end: last[0] + last[1], cn: tokens.join(""), cnTimes, fix: fixes[i] };
  });
}

export interface LineStyle {
  /** a section in pink (the bridge, the twist) */
  bridge?: boolean;
  /** the biggest line of the film */
  big?: boolean;
  /** the closing section in warm yellow */
  outro?: boolean;
}
export interface LyricsOptions {
  lines: Line[];
  /** the last moment a lyric may stay up (song time): where the outro text starts */
  end: number;
  /** the style of line i */
  style?: (index: number) => LineStyle;
  /** song time at work time t, when the music is cut (a skipped chorus); default the same */
  songTime?: (t: number) => number;
  /** whether line i may show at work time t (only the lines of the part of the song that plays) */
  show?: (index: number, t: number) => boolean;
  /** drawn before the lyrics (the hook title, the title pill), with song time `abs` and work time `t` */
  before?: (ctx: Ctx, abs: number, t: number) => void;
  /** drawn after the lyrics (big captions, the end prompts) */
  after?: (ctx: Ctx, abs: number, t: number) => void;
}

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
/** Word positions per line and size (lines are the caller's objects: cached by identity). */
const layoutCache = new WeakMap<Line, Map<number, { placed: Placed[]; rows: number }>>();
function layout(ctx: Ctx, line: Line, size: number) {
  let sizes = layoutCache.get(line);
  if (!sizes) layoutCache.set(line, (sizes = new Map()));
  const cached = sizes.get(size);
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
  sizes.set(size, res);
  return res;
}

function strike(ctx: Ctx, x1: number, x2: number, y: number, p: number, seed: number, lw = 7) {
  if (p <= 0) return;
  const xe = x1 + (x2 - x1) * clamp(p);
  curve(ctx, [[x1 - 6, y + 4], [(x1 + xe) / 2, y - 2], [xe + 6, y + 2]], seed, 1.5);
  paint(ctx, null, C.red, lw);
}

/** One line at song time `abs`: shown from just before its first word until the next line (or `end`). */
export function drawLyric(ctx: Ctx, o: LyricsOptions, li: number, abs: number) {
  const line = o.lines[li];
  const next = o.lines[li + 1];
  const showFrom = line.start - 0.18;
  // the last line clears before the outro text starts writing
  const hideAt = Math.min(next ? next.start - 0.06 : o.end, line.end + (line.fix ? 3 : 1.4));
  if (abs < showFrom || abs > hideAt) return;
  const aIn = easeOut(phase(abs, showFrom, showFrom + 0.22));
  const aOut = 1 - phase(abs, hideAt - 0.16, hideAt);
  const alpha = aIn * aOut;
  const { bridge, big, outro } = o.style?.(li) ?? {};
  const size = big ? 84 : EN_SIZE;
  const { placed, rows } = layout(ctx, line, size);
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


/** text made of parts with their own size/font/colour, centred at (0, y) */
export function parts(ctx: Ctx, y: number, ps: [string, number, string, string][], lw = 14) {
  const total = ps.reduce((sum, [str, sz, fam]) => sum + measure(ctx, str, sz, fam), 0);
  let x = -total / 2;
  for (const [str, sz, fam, col] of ps) {
    const w = measure(ctx, str, sz, fam);
    text(ctx, str, x + w / 2, y, { size: sz, font: fam, fill: col, stroke: C.ink, lw });
    x += w;
  }
}

/** a big two-line caption with a soft dark band behind it */
export function caption(ctx: Ctx, abs: number, a0: number, a1: number, l1: [string, number, string, string][], l2: [string, number, string, string][], y = 560) {
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


/** Every line that is up at work time t (and before / after), in design units. */
export function drawLyrics(ctx: Ctx, t: number, o: LyricsOptions) {
  const abs = o.songTime?.(t) ?? t;
  o.before?.(ctx, abs, t);
  for (let i = 0; i < o.lines.length; i++) if (!o.show || o.show(i, t)) drawLyric(ctx, o, i, abs);
  o.after?.(ctx, abs, t);
}

/** The lyrics layer of a work (a scene module for visual.json, over the acts). */
export function createLyricsScene(options: SceneOptions, o: LyricsOptions): Promise<Scene> {
  return designScene(options, 0, (ctx, t) => drawLyrics(ctx, t, o));
}

// ---------------------------------------------------------------- resources (preview and catalog)
/** Made-up sample lines (the library keeps no song lyrics). */
const SAMPLE_WORDS: LyricWords = [
  [
    [0.3, 0.35, "every"],
    [0.65, 0.3, "word"],
    [0.95, 0.4, "lights"],
    [1.35, 0.6, "up"],
  ],
  [
    [2.3, 0.3, "one"],
    [2.6, 0.3, "by"],
    [2.9, 0.7, "one"],
  ],
];
const SAMPLE_CN = [
  ["每一个 ", "字 ", "亮", "起来"],
  ["一个 ", "接着 ", "一个"],
];
const SAMPLE_FIX: Record<number, Fix> = { 1: { en: [1], cn: "接着", note: "慢慢来", at: 3.4 } };

export const resources = defineResources({
  lyrics: resource({
    kind: "text",
    title: "中英卡拉 OK 歌词",
    description:
      "画面下方的中英歌词：英文逐词点亮、唱到的词弹一下，中文按词对应点亮；style 给每句段落样式（bridge 粉色、big 最大、outro 暖黄），fix 是红笔把某句的说法划掉并手写改写。歌词时间来自酷狗 KRC（tools/fetch-krc.mjs），中文分词规则见 lyricLines。作品的 scenes/lyrics.ts 写：createLyricsScene(options, { lines: lyricLines(LYRIC_WORDS, CN, FIXES), end, style, before: hook, after: captions })，在 visual.json 里作为盖在各幕上面的 scene 图层。",
    tags: ["歌词", "卡拉OK", "字幕", "中英", "翻译", "红笔"],
    usage: "createLyricsScene(options, { lines: lyricLines(LYRIC_WORDS, CN, FIXES), end, style, songTime, show, before, after })",
    params: z.object({
      style: z.enum(["normal", "bridge", "big", "outro"]).default("normal").describe("段落样式"),
      fix: z.boolean().default(true).describe("第二句的红笔改写"),
    }),
    preview: {
      width: 1080,
      height: 700,
      duration: 5,
      time: 1.2,
      background: "#2b2f45",
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        ctx.translate(0, -1000);
        const lines = lyricLines(SAMPLE_WORDS, SAMPLE_CN, p.fix ? SAMPLE_FIX : {});
        const style = p.style === "normal" ? {} : { [p.style]: true };
        drawLyrics(ctx, t, { lines, end: 5, style: () => style });
      },
    },
  }),
  caption: resource({
    kind: "text",
    title: "大字幕（两行，暗色底条）",
    description: "两行大字幕，背后自动加暗色渐变条，第二行稍晚弹出；每行是几段 [文字, 字号, 字体, 颜色]，关键字可以变色放大。反转字幕、结尾金句都用它；回看彩蛋卡片放在 y≈1338（尾奏没有歌词时）。",
    tags: ["字幕", "金句", "反转", "大字", "文字"],
    usage: "caption(ctx, abs, a0, a1, [[\"她打了一大段\", 92, F.cn, \"#fff\"]], [[\"最后只发出一个\", 80, F.cn, \"#fff\"], [\"「嗯」\", 100, F.cn, \"#ffd166\"]], y)",
    params: z.object({ line1: z.string().default("她打了一大段").describe("第一行"), line2: z.string().default("最后只发出一个").describe("第二行"), key: z.string().default("「嗯」").describe("第二行末尾的关键字") }),
    preview: {
      width: 1080,
      height: 640,
      duration: 2,
      time: 1,
      background: "#5a6a8a",
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        caption(ctx, t, 0, 3, [[p.line1, 92, F.cn, "#fff"]], [[p.line2, 80, F.cn, "#fff"], [p.key, 100, F.cn, "#ffd166"]], 320);
      },
    },
  }),
});
