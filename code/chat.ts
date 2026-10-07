import { clamp } from "../../../../src/engine/math";
import { C, Ctx, F, Pt, blob, inkLine, measure, oval, paint, poly, rr, text } from "./draw";
import { drawHand, drawKid } from "./kid";
import { CAST, drawPerson } from "./people";
import { SH, SW, statusBar } from "./phone";

/** WeChat-like chat app for 《unhappy》 (600×1280 screen units): bubbles from both sides, time separators,
 *  voice notes, stickers, the 「对方正在输入...」 title, a multi-line draft that can be typed / deleted,
 *  dark mode for night scenes. Plus 朋友圈 post, profile card, power-off slider. */

export type Who = "boy" | "girl" | "mei";
export type ChatItem =
  | { t: "time"; text: string }
  | { t: "msg"; me?: boolean; text: string; pop?: number; /** a phrase picked out with a highlighter… */ mark?: string; /** …drawn left to right, 0..1 */ markK?: number }
  | { t: "voice"; me?: boolean; secs: number }
  | { t: "sticker"; me?: boolean; kind: "heart" | "bunny" | "cat"; pop?: number };
export interface ChatView {
  title: string;
  time: string;
  me: Who;
  them: Who;
  items: ChatItem[];
  typing?: boolean;
  /** extra px to shift the conversation down (scrolling back to older messages) */
  scroll?: number;
  draft?: string;
  caret?: boolean;
  keyboard?: boolean;
  dark?: boolean;
  /** highlight the send button (thumb about to press) */
  sendHot?: number;
  /** larger text for phone close-ups (default true) */
  big?: boolean;
}

/** text metrics: normal UI size, or the larger close-up size that stays readable on a phone in frame */
let FS = 30,
  LH = 42,
  MAXW = 340,
  DRAFTW = 360;
function setMetrics(big: boolean) {
  FS = big ? 37 : 30;
  LH = big ? 50 : 42;
  MAXW = big ? 360 : 340;
  DRAFTW = big ? 370 : 360;
}

function palette(dark?: boolean) {
  return dark
    ? { bg: "#111111", bar: "#1b1b1b", title: "#e8e8e8", mine: "#3eb575", theirs: "#2c2c2c", mineText: "#0b0b0b", theirsText: "#dcdcdc", time: "#6f6f6f", input: "#1e1e1e", field: "#2c2c2c", fieldText: "#e8e8e8", key: "#3a3a3c", kbd: "#232325", keyText: "#eee" }
    : { bg: "#ededed", bar: "#ededed", title: "#111111", mine: "#95ec69", theirs: "#ffffff", mineText: "#111111", theirsText: "#111111", time: "#9a9a9a", input: "#f7f7f7", field: "#ffffff", fieldText: "#111111", key: "#ffffff", kbd: "#d1d3d9", keyText: "#222" };
}

export function wrapText(ctx: Ctx, s: string, maxW: number, size = FS): string[] {
  ctx.save();
  ctx.font = `400 ${size}px ${F.ui}`;
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let cur = "";
    for (const ch of Array.from(para)) {
      if (ctx.measureText(cur + ch).width > maxW && cur) {
        out.push(cur);
        cur = ch;
      } else cur += ch;
    }
    out.push(cur);
  }
  ctx.restore();
  return out.length ? out : [""];
}

/** tiny portrait avatar: the boy or the girl, head and shoulders in a rounded square */
export function avatar(ctx: Ctx, x: number, y: number, who: Who, size = 68) {
  ctx.save();
  rr(ctx, x - size / 2, y - size / 2, size, size, size * 0.18);
  ctx.fillStyle = who === "girl" ? "#ffd9e2" : who === "mei" ? "#ffe9b0" : "#bcd8ec";
  ctx.fill();
  ctx.clip();
  if (who === "mei") drawPerson(ctx, x, y + size * 0.14, size / 300, { ...CAST.mei, x: 0, face: "smile", body: "bust" });
  else drawKid(ctx, x, y + size * 0.12, size / 300, { who, body: "bust", eyes: who === "girl" ? "happy" : "sleepy", mouth: who === "girl" ? "smile" : "flat" });
  ctx.restore();
}

export function sticker(ctx: Ctx, x: number, y: number, kind: "heart" | "bunny" | "cat", s = 1, seed = 2600) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (kind === "heart") {
    blob(ctx, [[0, 30], [-40, -6], [-62, -2], [-62, 34], [0, 86], [62, 34], [62, -2], [40, -6]].map(([px, py]) => [px, py - 30] as Pt), seed, 1.2);
    paint(ctx, "#ff5d7e", C.ink, 6);
    oval(ctx, -30, -18, 12, 8, seed + 1, 0.5, -0.5);
    paint(ctx, "rgba(255,255,255,0.8)", null);
    for (const [sx, sy] of [[-80, -50], [76, -40], [66, 54]] as Pt[]) {
      inkLine(ctx, [[sx - 10, sy], [sx + 10, sy]], seed + sx, 4, "#ffd166");
      inkLine(ctx, [[sx, sy - 10], [sx, sy + 10]], seed + sy, 4, "#ffd166");
    }
  } else if (kind === "bunny") {
    for (const side of [-1, 1]) {
      blob(ctx, [[side * 22, -40], [side * 34, -96], [side * 14, -100], [side * 8, -44]], seed + side, 0.8);
      paint(ctx, "#fff", C.ink, 5);
    }
    oval(ctx, 0, 0, 56, 48, seed + 3, 1);
    paint(ctx, "#fff", C.ink, 5);
    for (const side of [-1, 1]) {
      inkLine(ctx, [[side * 26, -6], [side * 18, 2], [side * 10, -6]], seed + 4 + side, 4);
      oval(ctx, side * 32, 14, 9, 6, seed + 6 + side, 0.4);
      paint(ctx, "rgba(255,140,160,0.7)", null);
    }
    inkLine(ctx, [[-6, 12], [0, 18], [6, 12]], seed + 9, 3.5);
  } else {
    oval(ctx, 0, 0, 58, 50, seed + 3, 1);
    paint(ctx, "#f2c27a", C.ink, 5);
    for (const side of [-1, 1]) {
      poly(ctx, [[side * 20, -40], [side * 50, -66], [side * 52, -22]], seed + side, 0.8);
      paint(ctx, "#f2c27a", C.ink, 5);
    }
    inkLine(ctx, [[-26, 0], [-14, -8], [-2, 0]], seed + 4, 4);
    inkLine(ctx, [[2, 0], [14, -8], [26, 0]], seed + 5, 4);
  }
  ctx.restore();
}

function bubble(ctx: Ctx, x: number, y: number, w: number, h: number, me: boolean, col: string) {
  ctx.fillStyle = col;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  // little tail toward the avatar
  ctx.beginPath();
  if (me) {
    ctx.moveTo(x + w, y + 22);
    ctx.lineTo(x + w + 12, y + 30);
    ctx.lineTo(x + w, y + 38);
  } else {
    ctx.moveTo(x, y + 22);
    ctx.lineTo(x - 12, y + 30);
    ctx.lineTo(x, y + 38);
  }
  ctx.fill();
}

/** the pieces of `mark` within the wrapped `lines` of `s`: line index, x from the line's start, width (current FS) */
function markSpans(ctx: Ctx, s: string, lines: string[], mark: string): { j: number; x: number; w: number }[] {
  const at = s.replace(/\n/g, "").indexOf(mark);
  if (at < 0) return [];
  const m0 = Array.from(s.replace(/\n/g, "").slice(0, at)).length,
    m1 = m0 + Array.from(mark).length;
  ctx.save();
  ctx.font = `400 ${FS}px ${F.ui}`;
  const out: { j: number; x: number; w: number }[] = [];
  let p = 0;
  lines.forEach((line, j) => {
    const chars = Array.from(line);
    const a = Math.max(p, m0),
      b = Math.min(p + chars.length, m1);
    if (a < b) {
      const x = ctx.measureText(chars.slice(0, a - p).join("")).width;
      out.push({ j, x, w: ctx.measureText(chars.slice(a - p, b - p).join("")).width });
    }
    p += chars.length;
  });
  ctx.restore();
  return out;
}

/** the screen box (600×1280 units) of the first marked phrase in a chat view — to aim the camera at it */
export function markAt(ctx: Ctx, v: ChatView): { x: number; y: number; w: number; h: number } | null {
  setMetrics(v.big !== false);
  const kb = v.keyboard ? 420 : 0;
  const dl = v.draft ? Math.min(7, draftLines(ctx, v.draft).length) : 1;
  const inputTop = SH - kb - (48 + dl * LH + 30);
  let y = inputTop - 24 + (v.scroll ?? 0);
  for (let i = v.items.length - 1; i >= 0; i--) {
    const it = v.items[i];
    y -= itemHeight(ctx, it);
    if (it.t !== "msg" || !it.mark) continue;
    const lines = wrapText(ctx, it.text, MAXW, FS);
    ctx.save();
    ctx.font = `400 ${FS}px ${F.ui}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
    ctx.restore();
    const bx = it.me ? SW - 106 - bw : 106;
    const sp = markSpans(ctx, it.text, lines, it.mark);
    if (!sp.length) return null;
    const x0 = Math.min(...sp.map((q) => q.x)),
      x1 = Math.max(...sp.map((q) => q.x + q.w));
    const y0 = y + 38 + sp[0].j * LH - FS * 0.62,
      y1 = y + 38 + sp[sp.length - 1].j * LH + FS * 0.62;
    return { x: bx + 22 + x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  return null;
}

/** the screen box (600×1280 units) of message `index` in a chat view (its bubble, at full size) — to aim pulses or the
 *  camera at it */
export function bubbleAt(ctx: Ctx, v: ChatView, index: number): { x: number; y: number; w: number; h: number } | null {
  setMetrics(v.big !== false);
  const kb = v.keyboard ? 420 : 0;
  const dl = v.draft ? Math.min(7, draftLines(ctx, v.draft).length) : 1;
  const inputTop = SH - kb - (48 + dl * LH + 30);
  let y = inputTop - 24 + (v.scroll ?? 0);
  for (let i = v.items.length - 1; i >= 0; i--) {
    const it = v.items[i];
    y -= itemHeight(ctx, it);
    if (i !== index) continue;
    if (it.t !== "msg") return null;
    const lines = wrapText(ctx, it.text, MAXW, FS);
    ctx.save();
    ctx.font = `400 ${FS}px ${F.ui}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
    ctx.restore();
    return { x: it.me ? SW - 106 - bw : 106, y, w: bw, h: lines.length * LH + 36 };
  }
  return null;
}

/** height an item takes in the list */
function itemHeight(ctx: Ctx, it: ChatItem) {
  if (it.t === "time") return 70;
  if (it.t === "sticker") return 200;
  if (it.t === "voice") return 104;
  const lines = wrapText(ctx, it.text, MAXW, FS);
  return lines.length * LH + 36 + 34;
}

export function draftLines(ctx: Ctx, draft: string) {
  return wrapText(ctx, draft, DRAFTW, FS);
}

export function chatScreen2(ctx: Ctx, abs: number, v: ChatView) {
  setMetrics(v.big !== false);
  const P = palette(v.dark);
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, SW, SH);
  const kb = v.keyboard ? 420 : 0;
  const dl = v.draft ? Math.min(7, draftLines(ctx, v.draft).length) : 1;
  const inputH = 48 + dl * LH + 30;
  const inputTop = SH - kb - inputH;
  // messages, bottom-up
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 160, SW, inputTop - 160);
  ctx.clip();
  let y = inputTop - 24 + (v.scroll ?? 0);
  for (let i = v.items.length - 1; i >= 0; i--) {
    const it = v.items[i];
    const h = itemHeight(ctx, it);
    y -= h;
    if (y > inputTop + 40 || y + h < 120) continue;
    if (it.t === "time") {
      text(ctx, it.text, SW / 2, y + 36, { size: 22, font: F.ui, fill: P.time });
      continue;
    }
    const me = !!it.me;
    const pop = it.t === "msg" || it.t === "sticker" ? clamp(it.pop ?? 1) : 1;
    if (pop <= 0) continue;
    const ax = me ? SW - 56 : 56;
    avatar(ctx, ax, y + 34, me ? v.me : v.them);
    ctx.save();
    const k = 0.6 + 0.4 * pop;
    ctx.translate(me ? SW - 106 : 106, y);
    ctx.scale(k, k);
    ctx.translate(-(me ? SW - 106 : 106), -y);
    ctx.globalAlpha *= pop;
    if (it.t === "msg") {
      const lines = wrapText(ctx, it.text, MAXW, FS);
      ctx.font = `400 ${FS}px ${F.ui}`;
      const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
      const bh = lines.length * LH + 36;
      const bx = me ? SW - 106 - bw : 106;
      bubble(ctx, bx, y, bw, bh, me, me ? P.mine : P.theirs);
      if (it.mark && (it.markK ?? 1) > 0) {
        // a highlighter stroke under exactly those characters, swept left to right across the lines
        const sp = markSpans(ctx, it.text, lines, it.mark);
        let left = (it.markK ?? 1) * sp.reduce((n, q) => n + q.w, 0);
        ctx.fillStyle = "rgba(255,210,80,0.78)";
        for (const q of sp) {
          const w = Math.min(q.w, left);
          left -= q.w;
          if (w <= 0) break;
          rr(ctx, bx + 22 + q.x - 3, y + 38 + q.j * LH - FS * 0.55, w + 6, FS * 1.1, 6);
          ctx.fill();
        }
      }
      lines.forEach((l, j) => text(ctx, l, bx + 22, y + 38 + j * LH, { size: FS, font: F.ui, fill: me ? P.mineText : P.theirsText, align: "left" }));
      if (it.mark && (it.markK ?? 1) > 0) {
        const sp = markSpans(ctx, it.text, lines, it.mark);
        let left = (it.markK ?? 1) * sp.reduce((n, q) => n + q.w, 0);
        for (const q of sp) {
          const w = Math.min(q.w, left);
          left -= q.w;
          if (w <= 0) break;
          ctx.save();
          ctx.beginPath();
          ctx.rect(bx + 22 + q.x - 3, y + 38 + q.j * LH - FS * 0.55, w + 6, FS * 1.1);
          ctx.clip();
          text(ctx, lines[q.j], bx + 22, y + 38 + q.j * LH, { size: FS, font: F.ui, fill: "#141414", align: "left" });
          ctx.restore();
        }
      }
    } else if (it.t === "voice") {
      const bw = 120 + it.secs * 3;
      const bx = me ? SW - 106 - bw : 106;
      bubble(ctx, bx, y, bw, 70, me, me ? P.mine : P.theirs);
      const wx = me ? bx + bw - 40 : bx + 32;
      ctx.strokeStyle = me ? P.mineText : P.theirsText;
      ctx.lineWidth = 4;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(wx, y + 35, r * 8, me ? Math.PI * 0.75 : -Math.PI * 0.25, me ? Math.PI * 1.25 : Math.PI * 0.25);
        ctx.stroke();
      }
      text(ctx, `${it.secs}″`, me ? bx - 30 : bx + bw + 30, y + 36, { size: 26, font: F.ui, fill: P.time });
    } else if (it.t === "sticker") {
      sticker(ctx, me ? SW - 210 : 210, y + 96, it.kind, 1, 2600 + i);
    }
    ctx.restore();
  }
  ctx.restore();
  // title bar
  ctx.fillStyle = P.bar;
  ctx.fillRect(0, 0, SW, 160);
  statusBar(ctx, { time: v.time, airplane: false, battery: 0.4, dark: !v.dark });
  text(ctx, "‹", 40, 120, { size: 60, font: F.ui, fill: P.title });
  text(ctx, v.typing ? "对方正在输入..." : v.title, SW / 2, 120, { size: 32, font: F.ui, weight: 700, fill: P.title });
  text(ctx, "···", SW - 50, 116, { size: 40, font: F.ui, weight: 700, fill: P.title });
  ctx.fillStyle = v.dark ? "#262626" : "#d6d6d6";
  ctx.fillRect(0, 158, SW, 2);
  // input bar (grows with the draft)
  ctx.fillStyle = P.input;
  ctx.fillRect(0, inputTop, SW, inputH + kb);
  const fx = 84,
    fw = v.draft ? SW - 84 - 116 : SW - 84 - 84;
  ctx.fillStyle = P.field;
  rr(ctx, fx, inputTop + 22, fw, inputH - 44, 10);
  ctx.fill();
  if (v.draft) {
    const lines = draftLines(ctx, v.draft);
    const show = lines.slice(Math.max(0, lines.length - 7));
    show.forEach((l, j) => text(ctx, l, fx + 16, inputTop + 50 + j * LH, { size: FS, font: F.ui, fill: P.fieldText, align: "left" }));
    if (v.caret && Math.floor(abs * 3) % 2 === 0) {
      const last = show[show.length - 1] ?? "";
      const cw = measure(ctx, last, FS, F.ui);
      ctx.fillStyle = "#07c160";
      ctx.fillRect(fx + 16 + cw + 3, inputTop + 30 + (show.length - 1) * LH, 3, 40);
    }
    const hot = v.sendHot ?? 0;
    ctx.fillStyle = hot > 0.5 ? "#04803d" : "#07c160"; // pressed
    rr(ctx, SW - 104, inputTop + inputH - 88, 88, 60, 10);
    ctx.fill();
    text(ctx, "发送", SW - 60, inputTop + inputH - 57, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  } else {
    if (v.caret && Math.floor(abs * 3) % 2 === 0) {
      ctx.fillStyle = "#07c160";
      ctx.fillRect(fx + 16, inputTop + 38, 3, 40);
    }
    ctx.strokeStyle = P.title;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(SW - 46, inputTop + inputH / 2, 22, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, "+", SW - 46, inputTop + inputH / 2 - 1, { size: 36, font: F.ui, fill: P.title });
  }
  ctx.strokeStyle = P.title;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(44, inputTop + inputH - 58, 22, 0, Math.PI * 2);
  ctx.stroke();
  if (kb) {
    ctx.fillStyle = P.kbd;
    ctx.fillRect(0, SH - kb, SW, kb);
    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    rows.forEach((row, r) => {
      const n = row.length,
        kw = 52,
        gap = 6;
      const x0 = (SW - (n * kw + (n - 1) * gap)) / 2;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = P.key;
        rr(ctx, x0 + i * (kw + gap), SH - kb + 20 + r * 92, kw, 76, 8);
        ctx.fill();
        text(ctx, row[i], x0 + i * (kw + gap) + kw / 2, SH - kb + 58 + r * 92, { size: 28, font: F.ui, fill: P.keyText });
      }
    });
    // backspace key
    ctx.fillStyle = P.key;
    rr(ctx, SW - 92, SH - kb + 204, 76, 76, 8);
    ctx.fill();
    text(ctx, "⌫", SW - 54, SH - kb + 242, { size: 34, font: F.ui, fill: P.keyText });
  }
}

/** screen-space centre of the send button / backspace key (for thumbs) */
export function sendButtonAt(ctx: Ctx, v: ChatView): Pt {
  setMetrics(v.big !== false);
  const kb = v.keyboard ? 420 : 0;
  const dl = v.draft ? Math.min(7, draftLines(ctx, v.draft).length) : 1;
  const inputH = 48 + dl * LH + 30;
  const inputTop = SH - kb - inputH;
  return [SW - 60, inputTop + inputH - 58];
}
export const BACKSPACE_AT: Pt = [SW - 54, SH - 420 + 242];

// ---------------------------------------------------------------- 朋友圈 post + the selfie in it
/** The selfie her friends took: three faces, V signs. Same picture in his feed and in her flashback. */
export function selfiePhoto(ctx: Ctx, x: number, y: number, w: number, h: number, abs: number, mood: "happy" | "flustered" = "happy") {
  ctx.save();
  rr(ctx, x, y, w, h, 10);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#e8f3f8");
  g.addColorStop(1, "#cfe4ee");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // window panes behind them
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 8;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 3, y);
    ctx.lineTo(x + (w * i) / 3, y + h * 0.55);
    ctx.stroke();
  }
  const s = w / 1000;
  drawPerson(ctx, x + w * 0.2, y + h * 0.5, 1.15 * s, { ...CAST.mei, x: 0, face: "laugh", arms: "laugh", body: "bust", tilt: -0.12 });
  drawPerson(ctx, x + w * 0.8, y + h * 0.52, 1.15 * s, { ...CAST.qi, x: 0, face: "smile", arms: "down", body: "bust", tilt: 0.12 });
  drawKid(ctx, x + w * 0.5, y + h * 0.5, 1.1 * s, {
    who: "girl",
    outfit: "cardigan",
    body: "bust",
    eyes: mood === "happy" ? "happy" : "wide",
    mouth: mood === "happy" ? "grin" : "o",
    blush: mood === "happy" ? 0.6 : 1,
  });
  // V signs
  drawHand(ctx, x + w * 0.66, y + h * 0.78, 1.25 * s, -Math.PI / 2 - 0.2, "open", false, false, 2650, true);
  drawHand(ctx, x + w * 0.08, y + h * 0.8, 1.2 * s, -Math.PI / 2 + 0.3, "open", true, false, 2651);
  ctx.restore();
}

export function momentsScreen(ctx: Ctx, abs: number, o: { dark?: boolean; mark?: number } = {}) {
  const dark = !!o.dark;
  ctx.fillStyle = dark ? "#111" : "#fff";
  ctx.fillRect(0, 0, SW, SH);
  // cover strip
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, "#ffd36e");
  g.addColorStop(1, "#ffb38a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 400);
  // sunflower doodles on the cover
  for (let i = 0; i < 5; i++) {
    const cx = 60 + i * 120,
      cy = 300 + (i % 2) * 40;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      oval(ctx, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 12, 7, 2700 + i * 10 + k, 0.4, a);
      paint(ctx, "#ffe14d", null);
    }
    oval(ctx, cx, cy, 13, 13, 2760 + i, 0.4);
    paint(ctx, "#7a4a24", null);
  }
  statusBar(ctx, { time: "23:20", airplane: false, battery: 0.39 });
  text(ctx, "林夏", SW - 150, 372, { size: 34, font: F.ui, weight: 700, fill: "#fff", align: "right", shadow: 6 });
  avatar(ctx, SW - 80, 380, "girl", 110);
  // the post
  const py = 500;
  avatar(ctx, 60, py + 36, "girl");
  text(ctx, "林夏", 112, py + 16, { size: 30, font: F.ui, weight: 700, fill: "#576b95", align: "left" });
  text(ctx, "今天好开心～", 112, py + 64, { size: 30, font: F.ui, fill: dark ? "#ddd" : "#111", align: "left" });
  selfiePhoto(ctx, 112, py + 96, 400, 400, abs, "happy");
  text(ctx, "5分钟前", 112, py + 540, { size: 28, font: F.ui, fill: dark ? "#b4b4b4" : "#888", align: "left" });
  const mk = clamp(o.mark ?? 0);
  if (mk > 0) {
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(160, py + 540, 76, 32, -0.05, 0, Math.PI * 2 * mk);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = dark ? "#2a2a2a" : "#f3f3f3";
  rr(ctx, SW - 110, py + 520, 66, 40, 8);
  ctx.fill();
  text(ctx, "··", SW - 77, py + 534, { size: 30, font: F.ui, weight: 700, fill: "#576b95" });
}

/** her contact card: a sunny photo, name and signature */
/** her sunflower portrait (her profile photo) in the 600×860 photo area: her face at screen (300, 470), scale 1.15 */
function sunflowerPortrait(ctx: Ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 860);
  g.addColorStop(0, "#9fd4f5");
  g.addColorStop(0.62, "#fff1b8");
  g.addColorStop(1, "#ffd36e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 860);
  for (let i = 0; i < 9; i++) {
    const cx = (i * 83) % SW,
      cy = 700 + (i % 3) * 60;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      oval(ctx, cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 16, 9, 2800 + i * 10 + k, 0.4, a);
      paint(ctx, "#ffd23a", "rgba(0,0,0,0.25)", 2);
    }
    oval(ctx, cx, cy, 18, 18, 2890 + i, 0.4);
    paint(ctx, "#7a4a24", null);
  }
  drawKid(ctx, SW / 2, 470, 1.15, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "grin", tilt: 0.06, blush: 0.5 });
}

/** her profile page. `photos` adds a swipeable album in front of her sunflower portrait (each draws into 600×860);
 *  `at` is the (fractional) photo being shown, default the portrait */
export function profileScreen(ctx: Ctx, abs: number, o: { photos?: ((c: Ctx) => void)[]; at?: number } = {}) {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, SW, SH);
  const photos = [...(o.photos ?? []), sunflowerPortrait];
  const at = o.at ?? photos.length - 1;
  photos.forEach((draw, i) => {
    const dx = (i - at) * (SW + 16);
    if (Math.abs(dx) >= SW + 16) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, 0, SW, 860);
    ctx.clip();
    ctx.translate(dx, 0);
    draw(ctx);
    ctx.restore();
  });
  if (photos.length > 1) {
    const label = `${Math.min(photos.length, Math.round(at) + 1)}/${photos.length}`;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    rr(ctx, SW - 128, 96, 92, 48, 24);
    ctx.fill();
    text(ctx, label, SW - 82, 121, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  }
  statusBar(ctx, { time: "23:31", airplane: false, battery: 0.38 });
  text(ctx, "林夏", 50, 930, { size: 52, font: F.ui, weight: 700, fill: "#f2f2f2", align: "left" });
  // signature with a little drawn sun
  oval(ctx, 66, 1010, 16, 16, 2900, 0.5);
  paint(ctx, "#ffcc33", null);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    inkLine(ctx, [[66 + Math.cos(a) * 22, 1010 + Math.sin(a) * 22], [66 + Math.cos(a) * 30, 1010 + Math.sin(a) * 30]], 2901 + k, 3, "#ffcc33");
  }
  text(ctx, "夏天快乐", 106, 1012, { size: 32, font: F.ui, fill: "#bbb", align: "left" });
  ctx.fillStyle = "#1f1f1f";
  rr(ctx, 40, 1090, SW - 80, 100, 14);
  ctx.fill();
  text(ctx, "发消息", SW / 2, 1140, { size: 34, font: F.ui, weight: 700, fill: "#7aa8d8" });
}

/** "slide to power off" overlay over a dimmed screen; slide 0..1 */
export function powerOffScreen(ctx: Ctx, abs: number, slide: number, under?: (c: Ctx) => void) {
  if (under) under(ctx);
  ctx.fillStyle = "rgba(10,10,14,0.78)";
  ctx.fillRect(0, 0, SW, SH);
  const k = clamp(slide);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  rr(ctx, 60, 200, SW - 120, 110, 55);
  ctx.fill();
  text(ctx, "滑动来关机", SW / 2 + 30, 256, { size: 32, font: F.ui, fill: `rgba(255,255,255,${0.85 * (1 - k)})` });
  const kx = 115 + k * (SW - 230);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(kx, 255, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e8343c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(kx, 258, 18, -Math.PI * 0.35, Math.PI * 1.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(kx, 232);
  ctx.lineTo(kx, 256);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(SW / 2, SH - 220, 50, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "取消", SW / 2, SH - 220, { size: 28, font: F.ui, fill: "#fff" });
}

/** phone booting: a plain logo on black */
export function bootScreen(ctx: Ctx, k: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SW, SH);
  ctx.save();
  ctx.globalAlpha = clamp(k);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(SW / 2, SH / 2 - 40, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- home screen
/** where 微信 sits on the home screen (screen coordinates): the app opens out of it and closes back into it */
export const WECHAT_AT: Pt = [230, 560];
const ICON = 104;
type AppKind = "wechat" | "camera" | "photos" | "music" | "settings" | "calendar" | "notes" | "clock" | "weather" | "phone" | "sms" | "browser" | "mail";
const APP_BG: Record<AppKind, string> = {
  wechat: "#07c160",
  camera: "#8e8e93",
  photos: "#ffffff",
  music: "#fa2d55",
  settings: "#8e8e93",
  calendar: "#ffffff",
  notes: "#fffbe6",
  clock: "#111111",
  weather: "#3a8ee6",
  phone: "#34c759",
  sms: "#34c759",
  browser: "#ffffff",
  mail: "#2f7cf6",
};

/** an app icon centred at (0, 0) */
function appIcon(ctx: Ctx, kind: AppKind) {
  const h = ICON / 2;
  rr(ctx, -h, -h, ICON, ICON, 26);
  ctx.fillStyle = APP_BG[kind];
  ctx.fill();
  const dot = (x: number, y: number, r: number, col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.save();
  if (kind === "wechat") {
    // two speech bubbles with little eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-9, -8, 30, 25, 0, 0, Math.PI * 2);
    ctx.moveTo(-28, 8);
    ctx.lineTo(-32, 24);
    ctx.lineTo(-14, 15);
    ctx.fill();
    dot(-19, -12, 3.6, "#07c160");
    dot(1, -12, 3.6, "#07c160");
    ctx.strokeStyle = "#07c160";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(16, 13, 23, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(28, 26);
    ctx.lineTo(34, 37);
    ctx.lineTo(20, 31);
    ctx.fill();
    dot(9, 9, 3, "#07c160");
    dot(24, 9, 3, "#07c160");
  } else if (kind === "camera") {
    rr(ctx, -34, -20, 68, 46, 10);
    ctx.fillStyle = "#2b2b2e";
    ctx.fill();
    dot(0, 3, 15, "#d9d9de");
    dot(0, 3, 9, "#2b2b2e");
  } else if (kind === "photos") {
    const cols = ["#ff9f0a", "#ffd60a", "#34c759", "#32ade6", "#5e5ce6", "#ff375f"];
    cols.forEach((col, i) => {
      const a = (i / 6) * Math.PI * 2;
      ctx.globalAlpha = 0.85;
      dot(Math.cos(a) * 16, Math.sin(a) * 16, 15, col);
    });
  } else if (kind === "music" || kind === "clock" || kind === "weather") {
    if (kind === "music") text(ctx, "♪", 0, 2, { size: 60, font: F.ui, weight: 700, fill: "#fff" });
    else if (kind === "clock") {
      dot(0, 0, 38, "#fff");
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -26);
      ctx.moveTo(0, 0);
      ctx.lineTo(18, 8);
      ctx.stroke();
    } else {
      dot(-12, -10, 16, "#ffd60a");
      dot(4, 12, 16, "#fff");
      dot(20, 8, 13, "#fff");
      dot(-10, 14, 12, "#fff");
    }
  } else if (kind === "settings") {
    ctx.strokeStyle = "#e5e5ea";
    ctx.lineWidth = 9;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
      ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
      ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "calendar") {
    text(ctx, "周二", 0, -26, { size: 20, font: F.ui, weight: 700, fill: "#ff3b30" });
    text(ctx, "7", 0, 12, { size: 54, font: F.ui, fill: "#111" });
  } else if (kind === "notes") {
    ctx.fillStyle = "#ffd60a";
    ctx.fillRect(-h, -h, ICON, 26);
    ctx.strokeStyle = "#ddd2a8";
    ctx.lineWidth = 3;
    for (const y of [0, 16, 32]) {
      ctx.beginPath();
      ctx.moveTo(-34, y);
      ctx.lineTo(34, y);
      ctx.stroke();
    }
  } else if (kind === "phone") {
    text(ctx, "✆", 0, 2, { size: 58, font: F.ui, fill: "#fff" });
  } else if (kind === "sms") {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(0, -2, 32, 25, 0, 0, Math.PI * 2);
    ctx.moveTo(-20, 14);
    ctx.lineTo(-26, 30);
    ctx.lineTo(-6, 20);
    ctx.fill();
  } else if (kind === "browser") {
    dot(0, 0, 38, "#2f7cf6");
    dot(0, 0, 34, "#fff");
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(24, -24);
    ctx.lineTo(6, 6);
    ctx.fill();
    ctx.fillStyle = "#c7c7cc";
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-24, 24);
    ctx.lineTo(6, 6);
    ctx.fill();
  } else if (kind === "mail") {
    rr(ctx, -32, -22, 64, 44, 6);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#2f7cf6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, -18);
    ctx.lineTo(0, 6);
    ctx.lineTo(30, -18);
    ctx.stroke();
  }
  ctx.restore();
}

const HOME_GRID: [AppKind, string][] = [
  ["calendar", "日历"],
  ["photos", "照片"],
  ["camera", "相机"],
  ["weather", "天气"],
  ["clock", "时钟"],
  ["notes", "备忘录"],
  ["music", "音乐"],
  ["mail", "邮件"],
  ["settings", "设置"],
  ["wechat", "微信"],
  ["browser", "浏览器"],
  ["sms", "信息"],
];

/** the phone's home screen. `press` darkens 微信 under a thumb; `zoom` > 1 while an app is closing back into it;
 *  `art` draws on the wallpaper (screen coordinates), under the icons */
export function homeScreen(ctx: Ctx, abs: number, o: { time: string; press?: number; zoom?: number; art?: (c: Ctx) => void }) {
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, "#2a2350");
  g.addColorStop(0.55, "#6a4a86");
  g.addColorStop(1, "#d98fb0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.abs(Math.sin(abs * 1.3 + i))})`;
    ctx.fillRect(((i * 97) % 560) + 20, ((i * 173) % 520) + 90, 3, 3);
  }
  ctx.save();
  const z = o.zoom ?? 1;
  ctx.translate(SW / 2, SH / 2);
  ctx.scale(z, z);
  ctx.translate(-SW / 2, -SH / 2);
  o.art?.(ctx);
  HOME_GRID.forEach(([kind, label], i) => {
    const x = 90 + (i % 4) * 140,
      y = WECHAT_AT[1] - 320 + Math.floor(i / 4) * 160;
    ctx.save();
    ctx.translate(x, y);
    const pr = kind === "wechat" ? clamp(o.press ?? 0) : 0;
    ctx.scale(1 - 0.06 * pr, 1 - 0.06 * pr);
    appIcon(ctx, kind);
    if (pr > 0) {
      rr(ctx, -ICON / 2, -ICON / 2, ICON, ICON, 26);
      ctx.fillStyle = `rgba(0,0,0,${0.3 * pr})`;
      ctx.fill();
    }
    ctx.restore();
    text(ctx, label, x, y + ICON / 2 + 26, { size: 22, font: F.ui, fill: "#fff" });
  });
  // dock
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  rr(ctx, 24, SH - 176, SW - 48, 136, 44);
  ctx.fill();
  (["phone", "sms", "browser", "music"] as AppKind[]).forEach((kind, i) => {
    ctx.save();
    ctx.translate(90 + i * 140, SH - 108);
    appIcon(ctx, kind);
    ctx.restore();
  });
  ctx.restore();
  statusBar(ctx, { time: o.time, airplane: false, battery: 0.38 });
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  rr(ctx, SW / 2 - 90, SH - 22, 180, 8, 4);
  ctx.fill();
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
  ctx.scale(s, s * (0.47 + 0.53 * k)); // squarer as it shrinks towards the icon
  ctx.translate(-SW / 2, -SH / 2);
  rr(ctx, 0, 0, SW, SH, 60 + 160 * (1 - k));
  ctx.clip();
  drawApp(ctx);
  // it turns into the green icon on the way in
  ctx.fillStyle = `rgba(7,193,96,${0.9 * (1 - k) * (1 - k)})`;
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
}
