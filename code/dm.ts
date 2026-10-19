/**
 * Instagram 私信风格的英文手机界面（海外版 / YouTube 版用；英语观众熟悉的样子，600×1280 屏幕坐标）。接口和 chat.ts 一样，
 * 作品把 import 从 chat 换成 dm 就行：
 * · 聊天 chatScreen2：我的消息在右边、紫到蓝的渐变气泡（渐变固定在屏幕上，上紫下蓝），对方的在左边、灰气泡，一串消息的最后
 *   一条旁边是对方的圆头像；时间分隔、语音、贴纸、荧光笔（mark / markK）；顶部头像 + 名字 + 用户名（handle）；输入框是圆角
 *   胶囊（左边蓝色相机，打字后右边是蓝色发送键）；英文按单词换行（layoutText，"\n" 是硬换行）。
 * · 「正在输入」是对方头像旁边三个点在跳的气泡（typing 0..1，typingWindows 给出几段时间里的淡入淡出）；typingRoom 让聊天
 *   先让出它的位置并保持住，对方的消息到了就落在三个点的位置，什么都不跳。typingOnly 单独画它（压暗画面后把线索提出来）。
 * · 查询（镜头、拇指、脉冲圈对准用）：bubbleAt、markAt、typingAt、avatarAt、scrollTo（让第 i 条到屏幕某个高度的 scroll）、
 *   sendButtonAt、BACKSPACE_AT、draftBox（输入框里显示的行和每行的 y）。
 * · 帖子页 postScreen（代替朋友圈：名字、整宽照片、按钮、点赞数、配文、「5 minutes ago」，mark 画红圈；POST / postAgoAt 给
 *   位置）、通知 notification（Instagram 图标、按单词换行、两行放不下加省略号）、主页 homeScreen（chat.ts 的主页，图标名
 *   英文，「微信」那格换成 Instagram 图标 igIcon，APP_AT）、App 窗口 appWindow、资料页 profileScreen 和关机 powerOffScreen
 *   （chat.ts 的，字换成英文）。开机、锁屏直接用 chat.ts / phone.ts 的（锁屏的日期自己传英文）。
 * 素材库其他地方画的中文（课本、牛奶盒、门牌……）用 english.ts 的 useEnglish() 换成英文；歌词层用 cn: false。
 * 第一次用在《unhappy》YouTube 版（frame-works/b1e36583）。
 */
import { z } from "zod";
import { clamp, smooth } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, LOCALE, Pt, beginFrame, loadFonts, rr, text } from "./draw";
import { avatar as squareAvatar, homeScreen as libHomeScreen, powerOffScreen as libPowerOffScreen, profileScreen as libProfileScreen, selfiePhoto, sticker, WECHAT_AT } from "./chat";
import type { ChatItem, Who } from "./chat";
import { SH, SW, lockScreen, statusBar } from "./phone";

export type { ChatItem, Who };
export interface ChatView {
  title: string;
  /** the small grey line under the name in the header (an @handle) */
  handle?: string;
  time: string;
  me: Who;
  them: Who;
  items: ChatItem[];
  /** their typing bubble (three dots) under the last message: on / off, or 0..1 while it comes and goes */
  typing?: boolean | number;
  /** the room the conversation makes for the typing bubble, 0..1 (default: as much as the bubble shows). Keep it at 1
   *  while they type on and off, and the message that comes lands in the same place — nothing jumps. */
  typingRoom?: number;
  /** extra px to shift the conversation down (scrolling back to older messages); negative = from the top */
  scroll?: number;
  draft?: string;
  caret?: boolean;
  keyboard?: boolean;
  dark?: boolean;
  /** the send button pressed (a thumb on it) */
  sendHot?: number;
  /** larger text for phone close-ups (default true) */
  big?: boolean;
}

/** their typing bubble during any of these windows (pass it as `typing`): 0..1, popping up quickly and dropping away
 *  quickly */
export const typingWindows = (abs: number, ws: readonly (readonly [number, number])[]) =>
  Math.max(0, ...ws.map((w) => smooth(clamp((abs - w[0]) / 0.07)) * (1 - smooth(clamp((abs - w[1]) / 0.08)))));

// ---------------------------------------------------------------- metrics and colours
let FS = 37,
  LH = 50;
function setMetrics(big: boolean) {
  FS = big ? 37 : 30;
  LH = big ? 50 : 42;
}
/** text inside a bubble: padding and the widest a line can be */
const PAD = 22;
const TEXT_W = 404;
/** their bubbles start right of their avatar; mine end near the right edge */
const THEIR_X = 84;
const MY_R = SW - 18;
const AV_X = 44,
  AV = 48;
const KB = 420;
const FIELD_X = 18;
/** where the draft starts in the input field (after the camera button) and how wide it may get (before send) */
const TEXT_X = 104;
const DRAFT_W = SW - TEXT_X - 100;
const TYPING_W = 116,
  TYPING_H = 86;
const BLUE = "#3797f0";

function palette(dark?: boolean) {
  return dark
    ? { bg: "#000000", line: "#262626", title: "#f5f5f5", sub: "#a8a8a8", theirs: "#262626", theirsText: "#f5f5f5", time: "#8e8e8e", field: "#1f1f1f", fieldText: "#f5f5f5", hint: "#8e8e8e", icon: "#f5f5f5", kbd: "#232325", key: "#3a3a3c", keyText: "#eee" }
    : { bg: "#ffffff", line: "#dbdbdb", title: "#111111", sub: "#737373", theirs: "#efefef", theirsText: "#111111", time: "#8e8e8e", field: "#efefef", fieldText: "#111111", hint: "#8e8e8e", icon: "#111111", kbd: "#d1d3d9", key: "#ffffff", keyText: "#222" };
}
/** my bubbles: Instagram's gradient, fixed to the screen — purple at the top, blue at the bottom */
function mineFill(ctx: Ctx) {
  const g = ctx.createLinearGradient(0, 160, 0, SH - 160);
  g.addColorStop(0, "#a12fe0");
  g.addColorStop(0.5, "#6a49f4");
  g.addColorStop(1, "#3a86f5");
  return g;
}

// ---------------------------------------------------------------- text
export interface TextLine {
  s: string;
  /** where the line starts in the original string */
  i: number;
}
/** measuring is the slow part: the lines of every string, and the widths, are kept */
const lineCache = new Map<string, TextLine[]>();
const widthCache = new Map<string, number>();
/** Lines of `s` no wider than `maxW`: broken at spaces (a word longer than a line is cut), and at "\n". */
export function layoutText(ctx: Ctx, s: string, maxW: number, size = FS): TextLine[] {
  const key = `${size}|${maxW}|${s}`;
  const hit = lineCache.get(key);
  if (hit) return hit;
  if (lineCache.size > 4000) lineCache.clear();
  ctx.save();
  ctx.font = `400 ${size}px ${F.ui}`;
  const wd = (t: string) => ctx.measureText(t).width;
  const out: TextLine[] = [];
  let base = 0;
  for (const para of s.split("\n")) {
    let line = "",
      start = base;
    for (const m of para.matchAll(/\S+/g)) {
      const at = base + (m.index ?? 0);
      if (!line) {
        line = m[0];
        start = at;
      } else {
        const joined = s.slice(start, at + m[0].length);
        if (wd(joined) <= maxW) line = joined;
        else {
          out.push({ s: line, i: start });
          line = m[0];
          start = at;
        }
      }
      while (line.length > 1 && wd(line) > maxW) {
        let n = line.length - 1;
        while (n > 1 && wd(line.slice(0, n)) > maxW) n--;
        out.push({ s: line.slice(0, n), i: start });
        line = line.slice(n);
        start += n;
      }
    }
    // the last line keeps its trailing spaces (the caret moves on as a space is typed)
    if (line) line = s.slice(start, base + para.length);
    out.push({ s: line, i: line ? start : base + para.length });
    base += para.length + 1;
  }
  ctx.restore();
  lineCache.set(key, out);
  return out;
}
export function wrapText(ctx: Ctx, s: string, maxW: number, size = FS): string[] {
  return layoutText(ctx, s, maxW, size).map((l) => l.s);
}
function widthOf(ctx: Ctx, s: string, size = FS, weight = 400) {
  const key = `${size}|${weight}|${s}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  if (widthCache.size > 4000) widthCache.clear();
  ctx.save();
  ctx.font = `${weight} ${size}px ${F.ui}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  widthCache.set(key, w);
  return w;
}
/** the pieces of `mark` within the laid-out `lines` of `s`: line index, x from the line's start, width */
function markSpans(ctx: Ctx, s: string, lines: TextLine[], mark: string): { j: number; x: number; w: number }[] {
  const m0 = s.indexOf(mark);
  if (m0 < 0) return [];
  const m1 = m0 + mark.length;
  const out: { j: number; x: number; w: number }[] = [];
  lines.forEach((l, j) => {
    const a = Math.max(l.i, m0),
      b = Math.min(l.i + l.s.length, m1);
    if (a < b) out.push({ j, x: widthOf(ctx, l.s.slice(0, a - l.i)), w: widthOf(ctx, l.s.slice(a - l.i, b - l.i).trimEnd()) });
  });
  return out;
}
export function draftLines(ctx: Ctx, draft: string) {
  return wrapText(ctx, draft, DRAFT_W, FS);
}

// ---------------------------------------------------------------- layout
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Slot {
  /** item index (-1: the typing bubble) */
  i: number;
  y: number;
  h: number;
  box?: Box;
  lines?: TextLine[];
  /** their avatar beside it (centre) */
  avatar?: Pt;
}
interface Layout {
  slots: Slot[];
  typing: Slot;
  typingK: number;
  inputTop: number;
  inputH: number;
  kb: number;
  draftShown: string[];
}
const theirs = (it?: ChatItem) => !!it && it.t !== "time" && !it.me;
const sameSide = (a?: ChatItem, b?: ChatItem) => !!a && !!b && a.t !== "time" && b.t !== "time" && !!a.me === !!b.me;

/** Everything's place on the screen, bottom-up from the input bar (the same layout draws and answers the queries). */
function layout(ctx: Ctx, v: ChatView): Layout {
  setMetrics(v.big !== false);
  const kb = v.keyboard ? KB : 0;
  const dLines = v.draft ? draftLines(ctx, v.draft) : [];
  const draftShown = dLines.slice(Math.max(0, dLines.length - 7));
  const dl = Math.max(1, draftShown.length);
  const inputH = 48 + dl * LH + 30;
  const inputTop = SH - kb - inputH;
  const tk = typeof v.typing === "number" ? clamp(v.typing) : v.typing ? 1 : 0;
  const room = clamp(v.typingRoom ?? tk);
  let y = inputTop - 20 + (v.scroll ?? 0);
  // their typing bubble takes the next place in the conversation (one line high, where their message will land); the
  // conversation moves up to make room for it
  const last = v.items[v.items.length - 1];
  const typing: Slot = { i: -1, y: y - TYPING_H, h: TYPING_H, box: { x: THEIR_X, y: y - TYPING_H, w: TYPING_W, h: TYPING_H }, avatar: [AV_X, y - AV / 2 - 2] };
  y -= (TYPING_H + (theirs(last) ? 8 : 26)) * room;
  const slots: Slot[] = [];
  for (let i = v.items.length - 1; i >= 0; i--) {
    const it = v.items[i],
      next = v.items[i + 1];
    if (next && it.t !== "time" && next.t !== "time") y -= sameSide(it, next) ? 8 : 26;
    let h = 64;
    let box: Box | undefined, lines: TextLine[] | undefined;
    if (it.t === "msg") {
      lines = layoutText(ctx, it.text, TEXT_W, FS);
      const w = Math.max(...lines.map((l) => widthOf(ctx, l.s.trimEnd()))) + 2 * PAD;
      h = lines.length * LH + 36;
      box = { x: it.me ? MY_R - w : THEIR_X, y: y - h, w, h };
    } else if (it.t === "voice") {
      h = 86;
      const w = 290;
      box = { x: it.me ? MY_R - w : THEIR_X, y: y - h, w, h };
    } else if (it.t === "sticker") {
      h = 190;
      box = { x: it.me ? MY_R - 200 : THEIR_X, y: y - h, w: 200, h };
    }
    y -= h;
    // their avatar beside the last of a run of their messages
    const avatar: Pt | undefined = theirs(it) && !sameSide(it, next) ? [AV_X, y + h - AV / 2 - 2] : undefined;
    slots.push({ i, y, h, box, lines, avatar });
  }
  // while they type after their own message, their picture moves down to the dots
  if (tk > 0.5 && theirs(last) && slots.length) slots[0].avatar = undefined;
  slots.reverse();
  return { slots, typing, typingK: tk, inputTop, inputH, kb, draftShown };
}

// ---------------------------------------------------------------- queries (to aim the camera, the thumbs, the pulses)
/** the screen box of message `index` (its bubble, at full size) */
export function bubbleAt(ctx: Ctx, v: ChatView, index: number): Box | null {
  const sl = layout(ctx, v).slots.find((q) => q.i === index);
  return sl?.box ?? null;
}
/** the screen box of the last marked phrase in a chat view */
export function markAt(ctx: Ctx, v: ChatView): Box | null {
  const L = layout(ctx, v);
  for (let k = L.slots.length - 1; k >= 0; k--) {
    const sl = L.slots[k],
      it = v.items[sl.i];
    if (it.t !== "msg" || !it.mark || !sl.box || !sl.lines) continue;
    const sp = markSpans(ctx, it.text, sl.lines, it.mark);
    if (!sp.length) return null;
    const x0 = Math.min(...sp.map((q) => q.x)),
      x1 = Math.max(...sp.map((q) => q.x + q.w));
    const y0 = lineY(sl.box, sp[0].j) - FS * 0.62,
      y1 = lineY(sl.box, sp[sp.length - 1].j) + FS * 0.62;
    return { x: sl.box.x + PAD + x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  return null;
}
/** where their typing bubble is (or will be, when it comes up) */
export function typingAt(ctx: Ctx, v: ChatView): Box {
  return layout(ctx, { ...v, typing: 1, typingRoom: 1 }).typing.box!;
}
/** their avatar beside message `index` (if it has one) */
export function avatarAt(ctx: Ctx, v: ChatView, index: number): Pt | null {
  return layout(ctx, v).slots.find((q) => q.i === index)?.avatar ?? null;
}
/** the `scroll` that puts the top of item `index` at screen y `top` */
export function scrollTo(ctx: Ctx, v: ChatView, index: number, top: number): number {
  const sl = layout(ctx, { ...v, scroll: 0 }).slots.find((q) => q.i === index);
  return sl ? top - sl.y : 0;
}
const sendOf = (L: Layout): Pt => [SW - 60, L.inputTop + L.inputH - 64];
function draftOf(L: Layout) {
  const n = Math.max(1, L.draftShown.length);
  const mid = L.inputTop + L.inputH / 2;
  return { lines: L.draftShown, x: TEXT_X, y: (j: number) => mid + (j - (n - 1) / 2) * LH };
}
/** screen-space centre of the send button (for thumbs) */
export function sendButtonAt(ctx: Ctx, v: ChatView): Pt {
  return sendOf(layout(ctx, v));
}
export const BACKSPACE_AT: Pt = [SW - 54, SH - KB + 242];
/** the input field's text: the lines shown (the last seven), x where they start and the screen y of line j */
export function draftBox(ctx: Ctx, v: ChatView): { lines: string[]; x: number; y: (j: number) => number } {
  return draftOf(layout(ctx, v));
}
const lineY = (b: Box, j: number) => b.y + 18 + LH / 2 + j * LH;

// ---------------------------------------------------------------- pieces
/** a round profile picture (the square portrait from the library, cut round) */
export function roundAvatar(ctx: Ctx, x: number, y: number, who: Who, size: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.clip();
  squareAvatar(ctx, x, y, who, size * 1.12);
  ctx.restore();
}
function chevron(ctx: Ctx, x: number, y: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 17);
  ctx.lineTo(x - 7, y);
  ctx.lineTo(x + 9, y + 17);
  ctx.stroke();
  ctx.restore();
}
function phoneGlyph(ctx: Ctx, x: number, y: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 16);
  ctx.lineTo(x - 6, y - 18);
  ctx.lineTo(x - 2, y - 9);
  ctx.lineTo(x - 7, y - 5);
  ctx.quadraticCurveTo(x - 2, y + 4, x + 6, y + 8);
  ctx.lineTo(x + 10, y + 3);
  ctx.lineTo(x + 18, y + 8);
  ctx.lineTo(x + 16, y + 15);
  ctx.quadraticCurveTo(x - 18, y + 14, x - 13, y - 16);
  ctx.stroke();
  ctx.restore();
}
function videoGlyph(ctx: Ctx, x: number, y: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  rr(ctx, x - 20, y - 13, 28, 26, 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 4);
  ctx.lineTo(x + 20, y - 11);
  ctx.lineTo(x + 20, y + 11);
  ctx.lineTo(x + 9, y + 4);
  ctx.stroke();
  ctx.restore();
}
function cameraGlyph(ctx: Ctx, x: number, y: number, s: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.2 * s;
  rr(ctx, x - 14 * s, y - 9 * s, 28 * s, 21 * s, 5 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + 1.5 * s, 5.5 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = col;
  rr(ctx, x - 6 * s, y - 13 * s, 12 * s, 5 * s, 2 * s);
  ctx.fill();
  ctx.restore();
}
/** Instagram's app icon (the gradient square with the white camera), centred at (cx, cy) */
export function igIcon(ctx: Ctx, cx: number, cy: number, size: number) {
  const h = size / 2;
  const g = ctx.createLinearGradient(cx - h, cy + h, cx + h, cy - h);
  g.addColorStop(0, "#fdd468");
  g.addColorStop(0.28, "#fa7e1e");
  g.addColorStop(0.55, "#d62976");
  g.addColorStop(0.8, "#962fbf");
  g.addColorStop(1, "#4f5bd5");
  ctx.save();
  rr(ctx, cx - h, cy - h, size, size, size * 0.25);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = size * 0.075;
  rr(ctx, cx - size * 0.29, cy - size * 0.29, size * 0.58, size * 0.58, size * 0.17);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.135, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx + size * 0.165, cy - size * 0.165, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
/** their three-dot "typing" bubble: the dots rise and brighten one after another */
function typingBubble(ctx: Ctx, abs: number, sl: Slot, k: number, col: string, dot: string, who: Who) {
  const b = sl.box!;
  ctx.save();
  ctx.globalAlpha *= clamp(k * 1.5);
  roundAvatar(ctx, sl.avatar![0], sl.avatar![1], who, AV);
  const s = 0.6 + 0.4 * k;
  ctx.translate(b.x, b.y + b.h);
  ctx.scale(s, s);
  ctx.translate(-b.x, -(b.y + b.h));
  ctx.fillStyle = col;
  rr(ctx, b.x, b.y, b.w, b.h, b.h / 2);
  ctx.fill();
  for (let d = 0; d < 3; d++) {
    const ph = (abs * 2.4 - d * 0.16) % 1;
    const up = Math.max(0, Math.sin(ph * Math.PI * 2));
    ctx.fillStyle = dot;
    ctx.globalAlpha = clamp(k * 1.5) * (0.45 + 0.55 * up);
    ctx.beginPath();
    ctx.arc(b.x + 34 + d * 24, b.y + b.h / 2 - 5 * up, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** just their typing bubble (and its avatar), in screen units — to lift the clue out of a darkened frame */
export function typingOnly(ctx: Ctx, abs: number, v: ChatView) {
  const L = layout(ctx, v);
  if (L.typingK > 0) typingBubble(ctx, abs, L.typing, L.typingK, palette(v.dark).theirs, v.dark ? "#d8d8d8" : "#8e8e8e", v.them);
}

// ---------------------------------------------------------------- the chat
export function chatScreen2(ctx: Ctx, abs: number, v: ChatView) {
  const L = layout(ctx, v);
  const P = palette(v.dark);
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, SW, SH);
  const mine = mineFill(ctx);
  // messages
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 160, SW, L.inputTop - 160);
  ctx.clip();
  for (const sl of L.slots) {
    if (sl.y > L.inputTop + 40 || sl.y + sl.h < 120) continue;
    const it = v.items[sl.i];
    if (it.t === "time") {
      text(ctx, it.text, SW / 2, sl.y + 34, { size: 22, font: F.ui, weight: 700, fill: P.time });
      continue;
    }
    const me = !!it.me;
    const pop = it.t === "msg" || it.t === "sticker" ? clamp(it.pop ?? 1) : 1;
    if (pop <= 0) continue;
    if (sl.avatar) {
      ctx.save();
      ctx.globalAlpha *= pop;
      roundAvatar(ctx, sl.avatar[0], sl.avatar[1], v.them, AV);
      ctx.restore();
    }
    const b = sl.box!;
    ctx.save();
    // a new message grows out of its bottom corner
    const k = 0.6 + 0.4 * pop;
    const ox = me ? b.x + b.w : b.x,
      oy = b.y + b.h;
    ctx.translate(ox, oy);
    ctx.scale(k, k);
    ctx.translate(-ox, -oy);
    ctx.globalAlpha *= pop;
    if (it.t === "msg") {
      const lines = sl.lines!;
      ctx.fillStyle = me ? mine : P.theirs;
      rr(ctx, b.x, b.y, b.w, b.h, Math.min(42, b.h / 2));
      ctx.fill();
      const fill = me ? "#ffffff" : P.theirsText;
      const sp = it.mark && (it.markK ?? 1) > 0 ? markSpans(ctx, it.text, lines, it.mark) : [];
      // a highlighter stroke under exactly those words, swept left to right across the lines
      let left = (it.markK ?? 1) * sp.reduce((n, q) => n + q.w, 0);
      const strokes: { j: number; x: number; w: number }[] = [];
      for (const q of sp) {
        const w = Math.min(q.w, left);
        left -= q.w;
        if (w <= 0) break;
        strokes.push({ j: q.j, x: q.x, w });
      }
      ctx.fillStyle = "rgba(255,214,80,0.92)";
      for (const q of strokes) {
        rr(ctx, b.x + PAD + q.x - 4, lineY(b, q.j) - FS * 0.58, q.w + 8, FS * 1.16, 6);
        ctx.fill();
      }
      lines.forEach((l, j) => text(ctx, l.s, b.x + PAD, lineY(b, j), { size: FS, font: F.ui, fill, align: "left" }));
      for (const q of strokes) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.x + PAD + q.x - 4, lineY(b, q.j) - FS * 0.58, q.w + 8, FS * 1.16);
        ctx.clip();
        text(ctx, lines[q.j].s, b.x + PAD, lineY(b, q.j), { size: FS, font: F.ui, fill: "#141414", align: "left" });
        ctx.restore();
      }
    } else if (it.t === "voice") {
      ctx.fillStyle = me ? mine : P.theirs;
      rr(ctx, b.x, b.y, b.w, b.h, b.h / 2);
      ctx.fill();
      const col = me ? "#ffffff" : P.theirsText;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(b.x + 30, b.y + b.h / 2 - 13);
      ctx.lineTo(b.x + 52, b.y + b.h / 2);
      ctx.lineTo(b.x + 30, b.y + b.h / 2 + 13);
      ctx.fill();
      for (let n = 0; n < 22; n++) {
        const hh = 8 + 26 * Math.abs(Math.sin(n * 1.7 + 0.4) * Math.cos(n * 0.6));
        rr(ctx, b.x + 72 + n * 7.6, b.y + b.h / 2 - hh / 2, 4, hh, 2);
        ctx.fill();
      }
      text(ctx, `0:${String(it.secs % 60).padStart(2, "0")}`, b.x + b.w - 26, b.y + b.h / 2, { size: 24, font: F.ui, fill: col, align: "right" });
    } else if (it.t === "sticker") {
      sticker(ctx, b.x + b.w / 2, b.y + 95, it.kind, 1, 2600 + sl.i);
    }
    ctx.restore();
  }
  if (L.typingK > 0) typingBubble(ctx, abs, L.typing, L.typingK, P.theirs, v.dark ? "#d8d8d8" : "#8e8e8e", v.them);
  ctx.restore();
  // header: back, her picture, name and handle, call buttons
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, SW, 160);
  statusBar(ctx, { time: v.time, airplane: false, battery: 0.4, dark: !v.dark });
  chevron(ctx, 30, 120, P.title);
  roundAvatar(ctx, 92, 120, v.them, 60);
  text(ctx, v.title, 136, v.handle ? 106 : 120, { size: 30, font: F.ui, weight: 700, fill: P.title, align: "left" });
  if (v.handle) text(ctx, v.handle, 136, 138, { size: 21, font: F.ui, fill: P.sub, align: "left" });
  phoneGlyph(ctx, SW - 114, 120, P.icon);
  videoGlyph(ctx, SW - 44, 120, P.icon);
  ctx.fillStyle = P.line;
  ctx.fillRect(0, 158, SW, 2);
  // input bar: a pill that grows with the draft
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, L.inputTop, SW, L.inputH + L.kb);
  const fy = L.inputTop + 22,
    fh = L.inputH - 44;
  ctx.fillStyle = P.field;
  rr(ctx, FIELD_X, fy, SW - 2 * FIELD_X, fh, Math.min(42, fh / 2));
  ctx.fill();
  const by = fy + fh - 42;
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(FIELD_X + 42, by, 30, 0, Math.PI * 2);
  ctx.fill();
  cameraGlyph(ctx, FIELD_X + 42, by, 0.95, "#fff");
  const db = draftOf(L);
  if (v.draft) {
    db.lines.forEach((l, j) => text(ctx, l, TEXT_X, db.y(j), { size: FS, font: F.ui, fill: P.fieldText, align: "left" }));
    if (v.caret && Math.floor(abs * 3) % 2 === 0) {
      const lastLine = db.lines[db.lines.length - 1] ?? "";
      ctx.fillStyle = BLUE;
      ctx.fillRect(TEXT_X + widthOf(ctx, lastLine) + 3, db.y(db.lines.length - 1) - 20, 3, 40);
    }
    const hot = clamp(v.sendHot ?? 0);
    const [sx, sy] = sendOf(L);
    ctx.fillStyle = hot > 0.5 ? "#1f66b3" : BLUE;
    ctx.beginPath();
    ctx.arc(sx, sy, 30 * (1 - 0.06 * hot), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy + 13);
    ctx.lineTo(sx, sy - 12);
    ctx.moveTo(sx - 11, sy - 2);
    ctx.lineTo(sx, sy - 13);
    ctx.lineTo(sx + 11, sy - 2);
    ctx.stroke();
  } else {
    text(ctx, "Message...", TEXT_X, db.y(0), { size: FS * 0.86, font: F.ui, fill: P.hint, align: "left" });
    if (v.caret && Math.floor(abs * 3) % 2 === 0) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(TEXT_X - 4, db.y(0) - 20, 3, 40);
    }
    // mic, photo, sticker
    ctx.save();
    ctx.strokeStyle = P.icon;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    const iy = db.y(0);
    rr(ctx, SW - 170, iy - 17, 16, 26, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(SW - 162, iy, 14, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.moveTo(SW - 162, iy + 14);
    ctx.lineTo(SW - 162, iy + 20);
    ctx.stroke();
    rr(ctx, SW - 124, iy - 16, 32, 32, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SW - 120, iy + 10);
    ctx.lineTo(SW - 110, iy - 1);
    ctx.lineTo(SW - 102, iy + 6);
    ctx.lineTo(SW - 97, iy + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(SW - 56, iy, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(SW - 56, iy + 2, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
  if (L.kb) {
    ctx.fillStyle = P.kbd;
    ctx.fillRect(0, SH - L.kb, SW, L.kb);
    ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row, r) => {
      const n = row.length,
        kw = 52,
        gap = 6;
      const x0 = (SW - (n * kw + (n - 1) * gap)) / 2;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = P.key;
        rr(ctx, x0 + i * (kw + gap), SH - L.kb + 20 + r * 92, kw, 76, 8);
        ctx.fill();
        text(ctx, row[i], x0 + i * (kw + gap) + kw / 2, SH - L.kb + 58 + r * 92, { size: 28, font: F.ui, fill: P.keyText });
      }
    });
    ctx.fillStyle = P.key;
    rr(ctx, SW - 92, SH - L.kb + 204, 76, 76, 8);
    ctx.fill();
    text(ctx, "⌫", SW - 54, SH - L.kb + 242, { size: 34, font: F.ui, fill: P.keyText });
  }
}

// ---------------------------------------------------------------- her post (instead of 朋友圈)
/** where things sit on the post page (screen units) */
export const POST = { photo: { x: 0, y: 250, w: 600, h: 600 }, captionY: 1000, agoY: 1046, x: 30 };
/** the "5 minutes ago" line's centre (where the red circle goes) */
export function postAgoAt(ctx: Ctx, ago = "5 minutes ago"): Pt {
  return [POST.x + widthOf(ctx, ago, 24) / 2, POST.agoY];
}
/** One of her posts, Instagram-style: her name, the photo (full width), the buttons, likes, the caption and how long
 *  ago she posted it — `mark` 0..1 draws the red circle round that. */
export function postScreen(
  ctx: Ctx,
  abs: number,
  o: { dark?: boolean; mark?: number; time?: string; author?: string; caption?: string; likes?: string; ago?: string; who?: Who; photo?: (ctx: Ctx, x: number, y: number, w: number, h: number) => void } = {},
) {
  const dark = o.dark !== false;
  const fg = dark ? "#f5f5f5" : "#111111",
    sub = dark ? "#a8a8a8" : "#737373";
  ctx.fillStyle = dark ? "#000" : "#fff";
  ctx.fillRect(0, 0, SW, SH);
  statusBar(ctx, { time: o.time ?? "11:20", airplane: false, battery: 0.39, dark: !dark });
  chevron(ctx, 30, 120, fg);
  text(ctx, "Posts", SW / 2, 120, { size: 31, font: F.ui, weight: 700, fill: fg });
  const author = o.author ?? "summer.lin";
  roundAvatar(ctx, 50, 205, o.who ?? "girl", 62);
  text(ctx, author, 96, 205, { size: 27, font: F.ui, weight: 700, fill: fg, align: "left" });
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(SW - 58 + d * 12, 205, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const ph = POST.photo;
  if (o.photo) o.photo(ctx, ph.x, ph.y, ph.w, ph.h);
  else {
    ctx.fillStyle = "#333";
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);
  }
  // heart, comment, share, save
  const iy = ph.y + ph.h + 46;
  ctx.save();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 3.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(40, iy + 14);
  ctx.bezierCurveTo(14, iy - 4, 22, iy - 24, 40, iy - 10);
  ctx.bezierCurveTo(58, iy - 24, 66, iy - 4, 40, iy + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(104, iy - 3, 16, 0.65 * Math.PI, 2.45 * Math.PI);
  ctx.lineTo(91, iy + 15);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(148, iy - 17);
  ctx.lineTo(182, iy - 17);
  ctx.lineTo(164, iy + 16);
  ctx.lineTo(160, iy - 3);
  ctx.closePath();
  ctx.moveTo(160, iy - 3);
  ctx.lineTo(182, iy - 17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(SW - 54, iy - 17);
  ctx.lineTo(SW - 30, iy - 17);
  ctx.lineTo(SW - 30, iy + 17);
  ctx.lineTo(SW - 42, iy + 7);
  ctx.lineTo(SW - 54, iy + 17);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  text(ctx, o.likes ?? "128 likes", POST.x, POST.captionY - 46, { size: 25, font: F.ui, weight: 700, fill: fg, align: "left" });
  const aw = widthOf(ctx, author + " ", 27, 700);
  text(ctx, author, POST.x, POST.captionY, { size: 27, font: F.ui, weight: 700, fill: fg, align: "left" });
  text(ctx, o.caption ?? "best day ever~", POST.x + aw, POST.captionY, { size: 27, font: F.ui, fill: fg, align: "left" });
  const ago = o.ago ?? "5 minutes ago";
  text(ctx, ago, POST.x, POST.agoY, { size: 24, font: F.ui, fill: sub, align: "left" });
  const mk = clamp(o.mark ?? 0);
  if (mk > 0) {
    const [mx, my] = postAgoAt(ctx, ago);
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(mx, my, widthOf(ctx, ago, 24) / 2 + 20, 28, -0.04, -Math.PI * 0.6, -Math.PI * 0.6 + Math.PI * 2.08 * mk);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- notifications
export interface Note {
  title: string;
  body: string;
  time?: string;
}
const NOTE_BODY = 27;
function noteLines(ctx: Ctx, w: number, body: string): string[] {
  const lines = wrapText(ctx, body, w - 140, NOTE_BODY);
  if (lines.length <= 2) return lines;
  // two lines at most, the second cut with an ellipsis
  let second = lines[1];
  while (second.length > 1 && widthOf(ctx, second + "…", NOTE_BODY) > w - 140) second = second.slice(0, -1);
  return [lines[0], second.trimEnd() + "…"];
}
/** a banner's height */
export function notificationHeight(ctx: Ctx, w: number, n: Note) {
  return noteLines(ctx, w, n.body).length > 1 ? 166 : 128;
}
/** An Instagram message banner (iOS): the app icon, who it's from, when, and the message in up to two lines.
 *  Returns its height. */
export function notification(ctx: Ctx, x: number, y: number, w: number, n: Note, alpha = 1) {
  const h = notificationHeight(ctx, w, n);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = "rgba(245,245,247,0.94)";
  rr(ctx, x, y, w, h, 32);
  ctx.fill();
  igIcon(ctx, x + 56, y + 64, 66);
  text(ctx, n.title, x + 110, y + 44, { size: 28, font: F.ui, weight: 700, fill: "#111", align: "left" });
  text(ctx, n.time ?? "now", x + w - 26, y + 44, { size: 22, font: F.ui, fill: "#888", align: "right" });
  noteLines(ctx, w, n.body).forEach((l, k) => text(ctx, l, x + 110, y + 88 + k * 38, { size: NOTE_BODY, font: F.ui, fill: "#333", align: "left" }));
  ctx.restore();
  return h;
}

// ---------------------------------------------------------------- chat.ts's own screens, in English
/** Draw with these words in English: `defaults` only where the work hasn't translated them already (english.ts /
 *  LOCALE), `given` always; put back afterwards, so nothing else changes. */
function withWords(defaults: Record<string, string>, given: Record<string, string | undefined>, draw: () => void) {
  const words: Record<string, string> = {};
  for (const [k, v] of Object.entries(defaults)) if (!(k in LOCALE)) words[k] = v;
  for (const [k, v] of Object.entries(given)) if (v !== undefined) words[k] = v;
  const before = Object.keys(words).map((k) => [k, LOCALE[k]] as const);
  Object.assign(LOCALE, words);
  try {
    draw();
  } finally {
    for (const [k, v] of before) {
      if (v === undefined) delete LOCALE[k];
      else LOCALE[k] = v;
    }
  }
}
const HOME_EN: Record<string, string> = { 日历: "Calendar", 照片: "Photos", 相机: "Camera", 天气: "Weather", 时钟: "Clock", 备忘录: "Notes", 音乐: "Music", 邮件: "Mail", 设置: "Settings", 微信: "Instagram", 浏览器: "Safari", 信息: "Messages", 周二: "TUE" };
/** her profile page (chat.ts's, with its swipeable album) in English: her `name`, the `bio` beside the little sun, the
 *  status bar's `time` */
export function profileScreen(ctx: Ctx, abs: number, o: { photos?: ((c: Ctx) => void)[]; at?: number; name?: string; bio?: string; time?: string } = {}) {
  withWords({ 林夏: "Summer", 夏天快乐: "happy summer", 发消息: "Message", "23:31": "11:31" }, { 林夏: o.name, 夏天快乐: o.bio, "23:31": o.time }, () => libProfileScreen(ctx, abs, { photos: o.photos, at: o.at }));
}
/** "slide to power off" over a dimmed screen (chat.ts's, in English); slide 0..1 */
export function powerOffScreen(ctx: Ctx, abs: number, slide: number, under?: (c: Ctx) => void) {
  withWords({ 滑动来关机: "slide to power off", 取消: "Cancel" }, {}, () => libPowerOffScreen(ctx, abs, slide, under));
}

// ---------------------------------------------------------------- home screen and app window
/** where the app sits on the home screen (it opens out of it and closes back into it) */
export const APP_AT: Pt = WECHAT_AT;
/** chat.ts's home screen with the app names in English and Instagram's icon where 微信 was; `press` darkens it under a
 *  thumb, `zoom` > 1 while an app closes back into it, `art` draws on the wallpaper */
export function homeScreen(ctx: Ctx, abs: number, o: { time: string; press?: number; zoom?: number; art?: (c: Ctx) => void }) {
  withWords(HOME_EN, {}, () => libHomeScreen(ctx, abs, o));
  const z = o.zoom ?? 1,
    pr = clamp(o.press ?? 0);
  ctx.save();
  ctx.translate(SW / 2, SH / 2);
  ctx.scale(z, z);
  ctx.translate(-SW / 2, -SH / 2);
  ctx.translate(APP_AT[0], APP_AT[1]);
  ctx.scale(1 - 0.06 * pr, 1 - 0.06 * pr);
  igIcon(ctx, 0, 0, 104);
  if (pr > 0) {
    rr(ctx, -52, -52, 104, 104, 26);
    ctx.fillStyle = `rgba(0,0,0,${(0.3 * pr).toFixed(3)})`;
    ctx.fill();
  }
  ctx.restore();
}
/** an app's window flying out of (k 0 → 1) or back into (1 → 0) its home-screen icon at `at` */
export function appWindow(ctx: Ctx, k: number, at: Pt, drawApp: (c: Ctx) => void) {
  if (k <= 0) return;
  if (k >= 1) {
    drawApp(ctx);
    return;
  }
  const s = 0.17 + 0.83 * k;
  ctx.save();
  ctx.globalAlpha *= clamp(k * 4);
  ctx.translate(at[0] + (SW / 2 - at[0]) * k, at[1] + (SH / 2 - at[1]) * k);
  ctx.scale(s, s * (0.47 + 0.53 * k));
  ctx.translate(-SW / 2, -SH / 2);
  rr(ctx, 0, 0, SW, SH, 60 + 160 * (1 - k));
  ctx.clip();
  drawApp(ctx);
  // it turns into the icon's colours on the way in
  const g = ctx.createLinearGradient(0, SH, SW, 0);
  const a = (0.9 * (1 - k) * (1 - k)).toFixed(3);
  g.addColorStop(0, `rgba(250,126,30,${a})`);
  g.addColorStop(0.5, `rgba(214,41,118,${a})`);
  g.addColorStop(1, `rgba(79,91,213,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
const SCREEN = { width: 600, height: 1280, duration: 2, prepare: loadFonts };
const DEMO_CHAT: ChatItem[] = [
  { t: "time", text: "Jul 12, 11:41 PM" },
  { t: "msg", text: "HAHAHAHA you're so funny omg" },
  { t: "msg", me: true, text: "for real! I almost laughed out loud and the teacher looked right at me" },
  { t: "voice", secs: 52 },
  { t: "sticker", me: true, kind: "cat" },
  { t: "time", text: "11:12 PM" },
  { t: "msg", me: true, text: "finally solved that physics problem!! want me to explain it tomorrow?", mark: "explain it tomorrow", markK: 1 },
  { t: "msg", text: "k" },
];

export const resources = defineResources({
  dmChat: resource({
    kind: "ui",
    title: "Instagram 私信（英文聊天）",
    description:
      "海外版用的英文聊天界面，Instagram 私信的样子：右边我的紫蓝渐变气泡、左边对方的灰气泡和圆头像，时间分隔、语音、贴纸、荧光笔，英文按单词换行。正在输入是对方头像旁边三个点的气泡（typing 0..1，typingWindows 算淡入淡出；typingRoom: 1 先让出位置，对方的消息落在同一个位置）。接口和 chat.ts 的 chatScreen2 一样（items、draft、keyboard、dark、sendHot、scroll），多一个 handle（名字下面的用户名）；bubbleAt / markAt / typingAt / avatarAt / scrollTo / sendButtonAt / draftBox 给镜头和拇指对准。",
    tags: ["Instagram", "私信", "聊天", "英文", "海外版", "YouTube", "正在输入", "手机"],
    usage: "phone(ctx, cx, cy, s, rot, (c) => chatScreen2(c, abs, { title: \"Summer\", handle: \"summer.lin\", time: \"11:12\", me: \"boy\", them: \"girl\", items, typing: typingWindows(abs, [[1.1, 1.35]]), typingRoom, draft, keyboard, dark }))",
    params: z.object({
      dark: z.boolean().default(true).describe("夜间"),
      typing: z.boolean().default(false).describe("对方正在输入（三个点）"),
      keyboard: z.boolean().default(false).describe("键盘"),
      draft: z.string().default("").describe("输入框里的草稿"),
    }),
    presets: { 白天: { dark: false }, 正在输入: { typing: true }, 打字: { keyboard: true, draft: "so… library this weekend?" } },
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        chatScreen2(ctx, t, { title: "Summer", handle: "summer.lin", time: "11:12", me: "boy", them: "girl", items: DEMO_CHAT, typing: p.typing, draft: p.draft, caret: p.keyboard, keyboard: p.keyboard, dark: p.dark });
      },
    },
  }),
  dmPost: resource({
    kind: "ui",
    title: "Instagram 帖子页（代替朋友圈）",
    description: "她的一条帖子：名字、整宽照片（photo 回调画进 600×600）、按钮、点赞数、配文和「5 minutes ago」；mark 0..1 给发帖时间画红圈（postAgoAt 给它的位置，POST 给照片和文字的位置，镜头对准用）。",
    tags: ["Instagram", "帖子", "朋友圈", "动态", "英文", "海外版", "手机"],
    usage: "postScreen(c, abs, { dark: true, mark, caption: \"best day ever~\", ago: \"5 minutes ago\", photo: (k, x, y, w, h) => … })",
    params: z.object({ dark: z.boolean().default(true).describe("夜间"), mark: z.number().min(0).max(1).default(1).describe("红圈") }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        postScreen(ctx, t, { dark: p.dark, mark: p.mark, photo: (k, x, y, w, h) => selfiePhoto(k, x, y, w, h, t) });
      },
    },
  }),
  dmNotification: resource({
    kind: "ui",
    title: "Instagram 消息通知（锁屏横幅）",
    description: "Instagram 图标、发消息的人、时间（now、6h ago）和最多两行的消息，按单词换行，放不下加省略号；返回横幅高度，几条往下排。",
    tags: ["通知", "锁屏", "Instagram", "英文", "海外版", "手机"],
    usage: "notification(c, 24, y, 552, { title: \"Summer\", body, time: \"6h ago\" }, alpha)",
    preview: {
      ...SCREEN,
      draw(ctx, t) {
        beginFrame(ctx, t);
        lockScreen(ctx, { time: "7:10", airplane: false, battery: 0.21 }, { date: "Tuesday, October 7" });
        let y = 360;
        for (const n of [
          { title: "Summer", body: "That's not true!! I wait for your texts every day. I always write so much, then delete it all.", time: "6h ago" },
          { title: "Summer", body: "are you asleep?", time: "5h ago" },
          { title: "Summer", body: "goodnight.", time: "4h ago" },
        ])
          y += notification(ctx, 24, y, 552, n) + 14;
      },
    },
  }),
  dmHome: resource({
    kind: "ui",
    title: "手机主页（英文，Instagram 图标）",
    description: "chat.ts 的主页，图标名换成英文，「微信」那格换成 Instagram 图标（APP_AT）；press 按下、zoom 关回图标、art 画壁纸。appWindow 让 App 窗口从图标里展开或缩回（带 Instagram 的颜色）。",
    tags: ["主页", "桌面", "Instagram", "图标", "英文", "海外版", "手机"],
    usage: "homeScreen(c, abs, { time: \"12:58\", press, zoom }); appWindow(c, k, APP_AT, (a) => chatScreen2(a, abs, view))",
    preview: {
      ...SCREEN,
      draw(ctx, t) {
        beginFrame(ctx, t);
        homeScreen(ctx, t, { time: "12:58" });
      },
    },
  }),
});
