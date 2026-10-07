import { clamp } from "../../../../src/engine/math";
import { C, Ctx, F, Pt, blob, inkLine, measure, oval, paint, poly, rr, text } from "./draw";
import { drawHand, drawKid } from "./kid";
import { CAST, drawPerson } from "./people";
import { SH, SW, statusBar } from "./phone";

/** WeChat-like chat app for 《unhappy》 (600×1280 screen units): bubbles from both sides, time separators,
 *  voice notes, stickers, the 「对方正在输入...」 title, a multi-line draft that can be typed / deleted,
 *  dark mode for night scenes. Plus 朋友圈 post, profile card, power-off slider. */

export type Who = "boy" | "girl";
export type ChatItem =
  | { t: "time"; text: string }
  | { t: "msg"; me?: boolean; text: string; pop?: number }
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
  ctx.fillStyle = who === "girl" ? "#ffd9e2" : "#bcd8ec";
  ctx.fill();
  ctx.clip();
  drawKid(ctx, x, y + size * 0.12, size / 300, { who, body: "bust", eyes: who === "girl" ? "happy" : "sleepy", mouth: who === "girl" ? "smile" : "flat" });
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
      lines.forEach((l, j) => text(ctx, l, bx + 22, y + 38 + j * LH, { size: FS, font: F.ui, fill: me ? P.mineText : P.theirsText, align: "left" }));
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
    ctx.fillStyle = hot > 0.5 ? "#06a050" : "#07c160";
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
export function profileScreen(ctx: Ctx, abs: number) {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, SW, SH);
  // big portrait photo
  ctx.save();
  rr(ctx, 0, 0, SW, 860, 0);
  ctx.clip();
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
  ctx.restore();
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
