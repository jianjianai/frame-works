/**
 * 《mirrors》他的手机（600×1280 屏幕坐标，由库里的 phone.ts / chat.ts 改来）：机身（侧键、轮廓光、反光）、深色的微信风格聊天
 * （猫头像：她是笑着的白猫，他是背对的黑猫）、通话记录和照片气泡、视频来电（前置摄像头里是他自己的脸——他盖不住的那面镜子）、
 * 美颜 App（祛斑滑条、「瑕疵：1 → 0」）、「发送给」对话框、自拍。不画手：拇指按下的地方画白色触点 touchDot / tapRing。
 */
import { z } from "zod";
import { clamp, smooth } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, Pt, backOut, beginFrame, blob, devScale, glow, inkLine, loadFonts, measure, oval, paint, poly, rr, rrectPts, text, vgrad } from "../draw";
import { KidPose, drawKid } from "../kid";
import { MARK_AT, birthmark, newspaper, tape } from "./story";

/** 《瑕疵：0》 his phone, in 600×1280 screen units (adapted from the s0rrow library's phone.ts / chat.ts):
 *  the phone itself (side keys, rim light, glare); a dark WeChat-like chat with cat avatars — hers a smiling white
 *  cat, his a black cat seen from behind (you never see its face) — with call records and photo bubbles; the
 *  incoming video call, whose front camera shows his own face (the one mirror he can't cover); the beauty app;
 *  the 「发送给」 dialog. No hands (用户): a white touch dot where the thumb presses. */

export const SW = 600;
export const SH = 1280;

export interface FingerPos {
  x: number;
  y: number;
  /** 0 hovering … 1 pressing */
  touch: number;
}

/** a screen point → design coordinates, for a phone at (cx, cy) with scale s (no rotation) */
export const onScreen = (cx: number, cy: number, s: number, sx: number, sy: number): Pt => [cx + (sx - SW / 2) * s, cy + (sy - SH / 2) * s];
/** the phone centre that puts screen point (sx, sy) at design point (tx, ty) at scale s */
export const aimPhone = (sx: number, sy: number, tx: number, ty: number, s: number): Pt => [tx - (sx - SW / 2) * s, ty - (sy - SH / 2) * s];

const mixRGB = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t))).join(",")})`;

// ================================================================ the phone
/** A phone centred at (cx, cy); `screen` draws in 0..SW × 0..SH. */
export function phone(ctx: Ctx, cx: number, cy: number, s: number, rot: number, screen: (c: Ctx) => void, seed = 900) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  // side keys (only their edges show past the frame)
  for (const [x, y, h] of [[-38, 250, 64], [-38, 350, 110], [-38, 476, 110], [SW + 24, 380, 170]] as [number, number, number][]) {
    rr(ctx, x, y, 14, h, 6);
    ctx.fillStyle = "#2c2c33";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  blob(ctx, rrectPts(-26, -26, SW + 52, SH + 52, 92), seed, 1.6);
  paint(ctx, "#121214", C.ink, 7);
  // 光影: the metal frame catches the light — warm down the left (the lamp), cold down the right (the window)
  const rim = ctx.createLinearGradient(-26, 0, SW + 26, 0);
  rim.addColorStop(0, "rgba(255,196,140,0.5)");
  rim.addColorStop(0.16, "rgba(255,196,140,0)");
  rim.addColorStop(0.84, "rgba(185,200,255,0)");
  rim.addColorStop(1, "rgba(185,200,255,0.4)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 6;
  rr(ctx, -14, -14, SW + 28, SH + 28, 84);
  ctx.stroke();
  ctx.save();
  rr(ctx, 0, 0, SW, SH, 70);
  ctx.clip();
  screen(ctx);
  // a faint diagonal glare across the glass
  const g = ctx.createLinearGradient(-200, 0, SW + 200, SH);
  g.addColorStop(0.2, "rgba(255,255,255,0)");
  g.addColorStop(0.3, "rgba(255,255,255,0.06)");
  g.addColorStop(0.4, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
  // dynamic island
  ctx.fillStyle = "#000";
  rr(ctx, SW / 2 - 90, 18, 180, 50, 25);
  ctx.fill();
  ctx.restore();
}

/** His phone seen from behind while he looks at it: dark case, the camera bump top left, the screen's cold light
 *  spilling over the top edge (`spill`: leave it off inside a figure that gets a mask — add the light afterwards).
 *  (cx, cy) its centre, w × h (any units). */
export function phoneBack(ctx: Ctx, cx: number, cy: number, w: number, h: number, rot = 0, spill = true) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  if (spill) {
    const g = ctx.createRadialGradient(0, -h / 2, 0, 0, -h / 2, w * 1.3);
    g.addColorStop(0, "rgba(180,210,255,0.35)");
    g.addColorStop(1, "rgba(180,210,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-w * 1.3, -h / 2 - w * 1.3, w * 2.6, w * 1.6);
  }
  ctx.fillStyle = "#1b1b20";
  rr(ctx, -w / 2, -h / 2, w, h, w * 0.18);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(2.5, w * 0.05);
  ctx.stroke();
  // the cold rim of the screen's light along its top edge
  ctx.strokeStyle = "rgba(190,215,255,0.55)";
  ctx.lineWidth = Math.max(1.5, w * 0.025);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + w * 0.18, -h / 2 + 1);
  ctx.lineTo(w / 2 - w * 0.18, -h / 2 + 1);
  ctx.stroke();
  const b = w * 0.42,
    bx = -w / 2 + w * 0.1,
    by = -h / 2 + w * 0.1;
  ctx.fillStyle = "#2e2e36";
  rr(ctx, bx, by, b, b, b * 0.28);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(1.5, w * 0.03);
  ctx.stroke();
  ctx.fillStyle = "#0c0c10";
  for (const [u, v] of [[0.3, 0.3], [0.3, 0.72]]) {
    ctx.beginPath();
    ctx.arc(bx + b * u, by + b * v, b * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#cfcfc6";
  ctx.beginPath();
  ctx.arc(bx + b * 0.74, by + b * 0.3, b * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** where the thumb touches the glass (like the phone's "show touches"); hovering (< 0.35) shows nothing */
export function touchDot(p: Ctx, f: FingerPos | null | undefined) {
  if (!f || f.touch < 0.35) return;
  p.save();
  p.globalAlpha *= Math.min(1, (f.touch - 0.35) / 0.5);
  // a faint dark halo so it still reads on a bright button
  p.strokeStyle = "rgba(0,0,0,0.22)";
  p.lineWidth = 8;
  p.beginPath();
  p.arc(f.x, f.y, 44, 0, Math.PI * 2);
  p.stroke();
  p.fillStyle = "rgba(255,255,255,0.45)";
  p.beginPath();
  p.arc(f.x, f.y, 40, 0, Math.PI * 2);
  p.fill();
  p.strokeStyle = "rgba(255,255,255,0.85)";
  p.lineWidth = 3;
  p.stroke();
  p.restore();
}
/** an expanding ring where the thumb just tapped (screen units), k 0..1 */
export function tapRing(p: Ctx, x: number, y: number, k: number) {
  if (k <= 0 || k >= 1) return;
  p.save();
  p.globalAlpha *= 1 - k;
  p.strokeStyle = "#fff";
  p.lineWidth = 5;
  p.beginPath();
  p.arc(x, y, 34 + 70 * k, 0, Math.PI * 2);
  p.stroke();
  p.restore();
}

// ================================================================ bits of UI
export function statusBar(ctx: Ctx, time: string, col = "#fff") {
  text(ctx, time, 96, 46, { size: 30, font: F.ui, weight: 700, fill: col });
  const rx = SW - 70;
  ctx.save();
  // battery
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 2.5;
  rr(ctx, rx - 26, 35, 44, 22, 6);
  ctx.stroke();
  rr(ctx, rx - 22, 39, 36 * 0.42, 14, 3);
  ctx.fill();
  rr(ctx, rx + 20, 42, 4, 8, 2);
  ctx.fill();
  // wi-fi
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(rx - 66, 52, i * 7, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }
  // signal
  for (let i = 0; i < 4; i++) {
    rr(ctx, rx - 128 + i * 9, 48 - i * 5, 6, 8 + i * 5, 2);
    ctx.fill();
  }
  ctx.restore();
}
function chevron(ctx: Ctx, x: number, y: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 18);
  ctx.lineTo(x - 6, y);
  ctx.lineTo(x + 10, y + 18);
  ctx.stroke();
  ctx.restore();
}
function moreDots(ctx: Ctx, x: number, y: number, col: string) {
  ctx.fillStyle = col;
  for (const d of [-15, 0, 15]) {
    ctx.beginPath();
    ctx.arc(x + d, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
/** a video-camera glyph (call records, the answer button), centre (x, y) */
function videoIcon(ctx: Ctx, x: number, y: number, s: number, col: string, fill = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 3.6;
  ctx.lineJoin = "round";
  rr(ctx, -22, -13, 30, 26, 6);
  if (fill) ctx.fill();
  else ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(22, -12);
  ctx.lineTo(22, 12);
  ctx.lineTo(10, 5);
  ctx.closePath();
  if (fill) ctx.fill();
  else ctx.stroke();
  ctx.restore();
}
/** a hung-up handset glyph, centre (x, y) */
function handsetIcon(ctx: Ctx, x: number, y: number, s: number, col: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = col;
  ctx.lineCap = "round";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-20, 6);
  ctx.quadraticCurveTo(0, -12, 20, 6);
  ctx.stroke();
  ctx.lineWidth = 15;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 21, 6);
    ctx.lineTo(sd * 20, 9);
    ctx.stroke();
  }
  ctx.restore();
}
function heartShape(ctx: Ctx, x: number, y: number, size: number, color: string, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  blob(ctx, [[0, 0.42], [-0.34, 0.12], [-0.5, -0.12], [-0.4, -0.38], [-0.16, -0.44], [0, -0.26], [0.16, -0.44], [0.4, -0.38], [0.5, -0.12], [0.34, 0.12]], seed, 0.02);
  paint(ctx, color, C.ink, 0.12);
  ctx.restore();
}

// ================================================================ the two cats
/** her white cat, smiling with its eyes shut (head centre at 0,0; about ±40 wide) */
function whiteCat(ctx: Ctx, seed: number) {
  for (const sd of [-1, 1]) {
    poly(ctx, [[sd * 30, -8], [sd * 25, -40], [sd * 6, -24]], seed + sd, 0.4);
    paint(ctx, "#fffdf8", C.ink, 2.8);
    poly(ctx, [[sd * 25, -14], [sd * 23, -32], [sd * 12, -22]], seed + 2 + sd, 0.3);
    paint(ctx, "#ffb3c6", null);
  }
  oval(ctx, 0, 4, 33, 28, seed + 4, 0.6);
  paint(ctx, "#fffdf8", C.ink, 2.8);
  inkLine(ctx, [[-17, 2], [-12, -3], [-7, 2]], seed + 5, 2.6, C.ink, 0.3);
  inkLine(ctx, [[7, 2], [12, -3], [17, 2]], seed + 6, 2.6, C.ink, 0.3);
  poly(ctx, [[-3.5, 8], [3.5, 8], [0, 12]], seed + 7, 0.2);
  paint(ctx, "#ff8fab", null);
  inkLine(ctx, [[-5, 15], [-2.5, 17.5], [0, 15], [2.5, 17.5], [5, 15]], seed + 8, 1.8, C.ink, 0.2);
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 20, 12, 5.5, 3.2, seed + 9 + sd, 0.2);
    paint(ctx, "rgba(255,130,160,0.55)", null);
    inkLine(ctx, [[sd * 24, 9], [sd * 38, 6]], seed + 11 + sd, 1.4, C.ink, 0.2);
    inkLine(ctx, [[sd * 24, 14], [sd * 38, 16]], seed + 13 + sd, 1.4, C.ink, 0.2);
  }
}
/** his black cat, from behind: back, round head, two ears, a curl of tail — no face; moonlight on its rim */
function blackCatBack(ctx: Ctx, seed: number) {
  inkLine(ctx, [[28, 62], [44, 46], [40, 28]], seed, 8, C.ink, 0.3);
  inkLine(ctx, [[28, 62], [44, 46], [40, 28]], seed, 4.5, "#141418", 0.3);
  oval(ctx, 2, 66, 40, 30, seed + 1, 0.5);
  paint(ctx, "#141418", C.ink, 2.8);
  for (const sd of [-1, 1]) {
    poly(ctx, [[sd * 26, 4], [sd * 22, -28], [sd * 6, -12]], seed + 2 + sd, 0.4);
    paint(ctx, "#141418", C.ink, 2.8);
  }
  oval(ctx, 0, 14, 29, 25, seed + 5, 0.6);
  paint(ctx, "#141418", C.ink, 2.8);
  ctx.save();
  ctx.strokeStyle = "rgba(150,172,236,0.8)";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 14, 24.5, -1.25, 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2, 66, 35.5, -1.15, -0.35);
  ctx.stroke();
  ctx.restore();
}
/** chat avatar: "white" = her (白猫), "black" = him (黑猫); (x, y) centre, size = width */
export function catAvatar(ctx: Ctx, x: number, y: number, who: "white" | "black", size = 68) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  rr(ctx, -50, -50, 100, 100, 18);
  if (who === "white") {
    ctx.fillStyle = "#ffd6e0";
    ctx.fill();
    ctx.save();
    ctx.clip();
    oval(ctx, 0, 64, 40, 26, 2701, 0.5);
    paint(ctx, "#fffdf8", C.ink, 2.8);
    ctx.translate(0, 6);
    whiteCat(ctx, 2710);
    ctx.restore();
  } else {
    const g = ctx.createLinearGradient(0, -50, 0, 50);
    g.addColorStop(0, "#2b3a6b");
    g.addColorStop(1, "#141b35");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // a crescent moon and a few stars
    ctx.fillStyle = "#fff4d0";
    ctx.beginPath();
    ctx.arc(27, -27, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, -31, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,244,208,0.8)";
    for (const [sx, sy] of [[-30, -32], [-10, -40], [6, -22]] as Pt[]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    blackCatBack(ctx, 2720);
    ctx.restore();
  }
  ctx.restore();
}
/** the white cat's face (her avatar) at (x, y), s = 1 → about 80 wide — her keychain and stickers use the same face */
export function whiteCatFace(ctx: Ctx, x: number, y: number, s: number, seed = 2710) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  whiteCat(ctx, seed);
  ctx.restore();
}
/** his black cat from behind (his avatar), at (x, y), s = 1 → about 90 wide */
export function blackCatFigure(ctx: Ctx, x: number, y: number, s: number, seed = 2720) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  blackCatBack(ctx, seed);
  ctx.restore();
}
/** her sticker: the white cat waving a paw, a heart beside it (centre x, y) */
export function whiteCatSticker(ctx: Ctx, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(2 * s, 2 * s);
  oval(ctx, 0, 40, 30, 20, 2741, 0.5);
  paint(ctx, "#fffdf8", C.ink, 2.6);
  whiteCat(ctx, 2750);
  oval(ctx, 31, 24, 8, 7, 2742, 0.4);
  paint(ctx, "#fffdf8", C.ink, 2.4);
  heartShape(ctx, 36, -32, 18, "#ff6f91", 2760);
  ctx.restore();
}

// ================================================================ the chat (dark mode, night)
export type ChatItem =
  | { t: "time"; text: string }
  | { t: "msg"; me?: boolean; text: string; pop?: number }
  | { t: "sticker"; me?: boolean; pop?: number }
  | { t: "call"; me?: boolean; pop?: number }
  | { t: "photo"; me?: boolean; pop?: number; draw: (c: Ctx, w: number, h: number) => void };
export interface ChatView {
  title: string;
  time: string;
  items: ChatItem[];
  /** title reads 「对方正在输入...」 */
  typing?: boolean;
  keyboard?: boolean;
  /** extra px to shift the conversation down */
  scroll?: number;
}
/** close-up text size (37 px on a phone at scale 1 stays readable) */
const FS = 37,
  LH = 50,
  MAXW = 360,
  KB = 420;
export const PHOTO_W = 230,
  PHOTO_H = 330;
const P = { bg: "#111111", bar: "#1b1b1b", title: "#e8e8e8", mine: "#3eb575", theirs: "#2c2c2c", mineText: "#0b0b0b", theirsText: "#dcdcdc", time: "#6f6f6f", input: "#1e1e1e", field: "#2c2c2c", key: "#3a3a3c", kbd: "#232325", keyText: "#eeeeee" };

function wrapText(ctx: Ctx, s: string, maxW: number): string[] {
  ctx.save();
  ctx.font = `400 ${FS}px ${F.ui}`;
  const out: string[] = [];
  let cur = "";
  for (const ch of Array.from(s)) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  ctx.restore();
  return out;
}
function itemHeight(ctx: Ctx, it: ChatItem) {
  if (it.t === "time") return 70;
  if (it.t === "sticker") return 200;
  if (it.t === "call") return LH + 36 + 34;
  if (it.t === "photo") return PHOTO_H + 34;
  return wrapText(ctx, it.text, MAXW).length * LH + 36 + 34;
}
function bubble(ctx: Ctx, x: number, y: number, w: number, h: number, me: boolean, col: string) {
  ctx.fillStyle = col;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
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
function keyboard(ctx: Ctx, top: number) {
  ctx.fillStyle = P.kbd;
  ctx.fillRect(0, top, SW, KB);
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row, r) => {
    const n = row.length,
      kw = 52,
      gap = 6;
    const x0 = (SW - (n * kw + (n - 1) * gap)) / 2;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = P.key;
      rr(ctx, x0 + i * (kw + gap), top + 20 + r * 92, kw, 76, 8);
      ctx.fill();
      text(ctx, row[i], x0 + i * (kw + gap) + kw / 2, top + 54 + r * 92, { size: 32, font: F.en, fill: P.keyText });
    }
  });
  ctx.fillStyle = "#2c2c2e";
  rr(ctx, 14, top + 204, 70, 76, 8);
  ctx.fill();
  rr(ctx, SW - 84, top + 204, 70, 76, 8);
  ctx.fill();
  ctx.fillStyle = P.key;
  rr(ctx, 140, top + 296, 320, 76, 8);
  ctx.fill();
  ctx.fillStyle = "#07c160";
  rr(ctx, SW - 128, top + 296, 114, 76, 8);
  ctx.fill();
  ctx.fillStyle = "#2c2c2e";
  rr(ctx, 14, top + 296, 114, 76, 8);
  ctx.fill();
}

/** WeChat-like chat, dark mode: her bubbles on the left with the white cat, his on the right with the black cat. */
export function chatScreen(ctx: Ctx, abs: number, v: ChatView) {
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, SW, SH);
  const kb = v.keyboard ? KB : 0;
  const inputH = 48 + LH + 30;
  const inputTop = SH - kb - inputH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 160, SW, inputTop - 160);
  ctx.clip();
  let y = inputTop - 24 + (v.scroll ?? 0);
  for (let i = v.items.length - 1; i >= 0; i--) {
    const it = v.items[i];
    const pop = it.t === "time" ? 1 : clamp(it.pop ?? 1);
    // a new message makes room for itself (the older ones glide up)
    const h = itemHeight(ctx, it) * smooth(clamp(pop * 1.6));
    y -= h;
    if (pop <= 0 || y > inputTop + 40 || y + h < 120) continue;
    if (it.t === "time") {
      text(ctx, it.text, SW / 2, y + 36, { size: 22, font: F.ui, fill: P.time });
      continue;
    }
    const me = !!it.me;
    catAvatar(ctx, me ? SW - 56 : 56, y + 34, me ? "black" : "white");
    ctx.save();
    const k = 0.6 + 0.4 * backOut(pop);
    const ox = me ? SW - 106 : 106;
    ctx.translate(ox, y);
    ctx.scale(k, k);
    ctx.translate(-ox, -y);
    ctx.globalAlpha *= clamp(pop * 2);
    const ink = me ? P.mineText : P.theirsText;
    if (it.t === "msg") {
      const lines = wrapText(ctx, it.text, MAXW);
      ctx.font = `400 ${FS}px ${F.ui}`;
      const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
      const bx = me ? SW - 106 - bw : 106;
      bubble(ctx, bx, y, bw, lines.length * LH + 36, me, me ? P.mine : P.theirs);
      lines.forEach((l, j) => text(ctx, l, bx + 22, y + 38 + j * LH, { size: FS, font: F.ui, fill: ink, align: "left" }));
    } else if (it.t === "call") {
      const label = "已拒绝";
      const bw = 22 + 46 + 12 + measure(ctx, label, FS, F.ui) + 22;
      const bx = me ? SW - 106 - bw : 106;
      bubble(ctx, bx, y, bw, LH + 36, me, me ? P.mine : P.theirs);
      videoIcon(ctx, bx + 45, y + 43, 0.92, ink);
      text(ctx, label, bx + 80, y + 38, { size: FS, font: F.ui, fill: ink, align: "left" });
    } else if (it.t === "sticker") {
      whiteCatSticker(ctx, me ? SW - 210 : 210, y + 100);
    } else {
      const bx = me ? SW - 106 - PHOTO_W : 106;
      ctx.save();
      rr(ctx, bx, y, PHOTO_W, PHOTO_H, 12);
      ctx.clip();
      ctx.translate(bx, y);
      it.draw(ctx, PHOTO_W, PHOTO_H);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      rr(ctx, bx, y, PHOTO_W, PHOTO_H, 12);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // title bar
  ctx.fillStyle = P.bar;
  ctx.fillRect(0, 0, SW, 160);
  statusBar(ctx, v.time);
  chevron(ctx, 38, 118, P.title);
  text(ctx, v.typing ? "对方正在输入..." : v.title, SW / 2, 118, { size: 32, font: F.ui, weight: 700, fill: P.title });
  moreDots(ctx, SW - 50, 118, P.title);
  ctx.fillStyle = "#262626";
  ctx.fillRect(0, 158, SW, 2);
  // input bar
  ctx.fillStyle = P.input;
  ctx.fillRect(0, inputTop, SW, inputH + kb);
  ctx.fillStyle = P.field;
  rr(ctx, 84, inputTop + 22, SW - 168, inputH - 44, 10);
  ctx.fill();
  const my = inputTop + inputH / 2;
  ctx.save();
  ctx.strokeStyle = P.title;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(44, my, 22, 0, Math.PI * 2);
  ctx.stroke();
  for (let r = 1; r <= 2; r++) {
    ctx.beginPath();
    ctx.arc(36, my, r * 7, -0.75, 0.75);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(SW - 46, my, 22, 0, Math.PI * 2);
  ctx.moveTo(SW - 58, my);
  ctx.lineTo(SW - 34, my);
  ctx.moveTo(SW - 46, my - 12);
  ctx.lineTo(SW - 46, my + 12);
  ctx.stroke();
  ctx.restore();
  if (kb) keyboard(ctx, SH - kb);
  void abs;
}

// ================================================================ his front camera: the one mirror he can't cover
/** What his front camera sees (screen units, `h` tall): the dark living room behind him — the warm lamp, the round
 *  mirror under newspaper — and his face, mirrored like a mirror (so the birthmark is on the left), lit cold by the
 *  screen. `bright` 0..1 = the beauty app's brightening; `mark` = how much of the birthmark is left. */
export function frontCamera(ctx: Ctx, pose: KidPose, o: { x?: number; y?: number; s?: number; bright?: number; mark?: number; h?: number } = {}) {
  const x = o.x ?? 300,
    y = o.y ?? 610,
    s = o.s ?? 1.7,
    bright = o.bright ?? 0,
    h = o.h ?? SH;
  ctx.fillStyle = vgrad(ctx, 0, h, [[0, mixRGB([44, 42, 60], [120, 112, 128], bright)], [1, mixRGB([22, 21, 32], [70, 64, 78], bright)]]);
  ctx.fillRect(0, 0, SW, h);
  // the lamp behind him, out of focus
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 590, y - 260, 380, `rgba(255,168,92,${(0.34 + 0.1 * bright).toFixed(3)})`);
  glow(ctx, 610, y - 300, 90, "rgba(255,220,170,0.4)");
  ctx.restore();
  // the round mirror over the couch, papered over (blurred: it's behind him)
  ctx.save();
  ctx.filter = `blur(${(3 * devScale(ctx)).toFixed(1)}px)`;
  ctx.beginPath();
  ctx.arc(130, y - 330, 150, 0, Math.PI * 2);
  ctx.fillStyle = "#6a5440";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(130, y - 330, 134, 0, Math.PI * 2);
  ctx.clip();
  newspaper(ctx, -20, y - 480, 300, 300, 0.06, 2771);
  tape(ctx, 130, y - 330, 300, 30, 0.7, 2772);
  tape(ctx, 130, y - 330, 300, 30, -0.7, 2773);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = `rgba(14,12,24,${(0.45 - 0.3 * bright).toFixed(3)})`;
  ctx.fillRect(0, 0, SW, h);
  ctx.restore();
  // him, mirrored
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.translate(-x, 0);
  drawKid(ctx, x, y, s, pose);
  birthmark(ctx, x, y, s, pose, o.mark ?? 1);
  ctx.restore();
  // the screen's cold light on his face; the edges fall off
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = `rgba(120,160,255,${(0.32 - 0.25 * bright).toFixed(3)})`;
  ctx.fillRect(0, 0, SW, h);
  ctx.restore();
  if (bright > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    glow(ctx, x, y + 40, 420, `rgba(255,236,226,${(0.22 * bright).toFixed(3)})`);
    ctx.restore();
  }
  const v = ctx.createRadialGradient(x, y, h * 0.25, x, y, h * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${(0.45 - 0.25 * bright).toFixed(3)})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, SW, h);
}

/** the call buttons sit a little higher than WeChat's so they stay above the lyrics in the close-up */
export const HANG_UP: Pt = [150, 860];
export const ANSWER: Pt = [450, 860];
/** WeChat's incoming video call: her name over the picture from his own front camera. `ringK` 0..1 loops the rings
 *  pulsing out of the answer button; `labels` fades 挂断 / 接听 (off while the camera is in close). */
export function callScreen(ctx: Ctx, face: KidPose, time: string, ringK: number, labels = 1) {
  frontCamera(ctx, face);
  let g = ctx.createLinearGradient(0, 0, 0, 400);
  g.addColorStop(0, "rgba(0,0,0,0.66)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 400);
  g = ctx.createLinearGradient(0, 700, 0, SH);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 700, SW, SH - 700);
  statusBar(ctx, time);
  catAvatar(ctx, 104, 250, "white", 116);
  text(ctx, "白猫", 186, 224, { size: 48, font: F.ui, weight: 700, fill: "#fff", align: "left", shadow: 8 });
  text(ctx, "邀请你视频通话", 186, 282, { size: 27, font: F.ui, fill: "rgba(255,255,255,0.9)", align: "left", shadow: 8 });
  for (let i = 0; i < 2; i++) {
    const k = (ringK + i * 0.5) % 1;
    ctx.strokeStyle = `rgba(7,193,96,${(0.65 * (1 - k)).toFixed(3)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(ANSWER[0], ANSWER[1], 60 + 50 * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const [[bx, by], col] of [[HANG_UP, "#fa5151"], [ANSWER, "#07c160"]] as [Pt, string][]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx, by, 58, 0, Math.PI * 2);
    ctx.fill();
  }
  handsetIcon(ctx, HANG_UP[0], HANG_UP[1] + 2, 1.15, "#fff");
  videoIcon(ctx, ANSWER[0] - 2, ANSWER[1], 1.25, "#fff", true);
  if (labels > 0.01) {
    text(ctx, "挂断", HANG_UP[0], HANG_UP[1] + 86, { size: 26, font: F.ui, fill: "#fff", shadow: 6, alpha: labels });
    text(ctx, "接听", ANSWER[0], ANSWER[1] + 86, { size: 26, font: F.ui, fill: "#fff", shadow: 6, alpha: labels });
  }
}

// ================================================================ the selfie and the beauty app
/** his face in the selfie: looking at the lens, trying a smile */
export const SELFIE_POSE: KidPose = { body: "bust", eyes: "open", look: [0, 0.02], brows: "flat", mouth: "smile", tilt: 0.04, arms: "down", shapeL: "hidden", shapeR: "hidden" };
const SELFIE_FACE = { x: 300, y: 450, s: 1.55 };
/** the birthmark's centre in the selfie (600×860 units; mirrored, so on the left) */
export const SELFIE_MARK: Pt = [SELFIE_FACE.x - MARK_AT[0] * SELFIE_FACE.s, SELFIE_FACE.y + MARK_AT[1] * SELFIE_FACE.s];
/** The selfie (600×860 units, drawn scaled into w × h at the origin): taken with the front camera, so mirrored.
 *  `mark` 1 = as he is, 0 = smoothed away; `bright` = the app's glow. */
export function selfie(ctx: Ctx, w: number, h: number, mark: number, bright = 0.6) {
  ctx.save();
  ctx.scale(w / 600, h / 860);
  ctx.beginPath();
  ctx.rect(0, 0, 600, 860);
  ctx.clip();
  frontCamera(ctx, SELFIE_POSE, { x: SELFIE_FACE.x, y: SELFIE_FACE.y, s: SELFIE_FACE.s, bright, mark, h: 860 });
  ctx.restore();
}

/** the counter over the photo: 瑕疵：1 → 瑕疵：0 (`zero` 0..1 rolls the digit, turns it green and pops it) */
function flawBadge(ctx: Ctx, x: number, y: number, zero: number) {
  const roll = smooth(clamp(zero * 1.6));
  const pop = 1 + 0.32 * Math.sin(Math.PI * clamp(zero * 1.25));
  const label = "瑕疵：";
  const lw = measure(ctx, label, 46, F.ui, 700);
  const dw = 34;
  const w = lw + dw + 60;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.fillStyle = mixRGB([238, 72, 72], [7, 180, 92], roll);
  rr(ctx, -w / 2, -40, w, 80, 40);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, label, -w / 2 + 30, 2, { size: 46, font: F.ui, weight: 700, fill: "#fff", align: "left" });
  const dx = -w / 2 + 30 + lw + dw / 2;
  ctx.beginPath();
  ctx.rect(dx - dw / 2 - 6, -38, dw + 12, 76);
  ctx.clip();
  text(ctx, "1", dx, 2 - 76 * roll, { size: 54, font: F.ui, weight: 700, fill: "#fff" });
  text(ctx, "0", dx, 2 + 76 * (1 - roll), { size: 54, font: F.ui, weight: 700, fill: "#fff" });
  ctx.restore();
}

export const SLIDER = { x0: 70, x1: 460, y: 950 };
/** The beauty app: his selfie, the birthmark boxed and tagged 「瑕疵」, the 祛斑 slider; `slider` 0..1 clears it,
 *  `zero` 0..1 flips the counter to 0. */
export function beautyScreen(ctx: Ctx, o: { slider: number; zero: number }) {
  const sl = clamp(o.slider);
  ctx.fillStyle = "#0e0e10";
  ctx.fillRect(0, 0, SW, SH);
  // the photo, cropped into the editing area
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SW, 820);
  ctx.clip();
  ctx.translate(0, 55);
  selfie(ctx, 600, 860, 1 - sl, 0.55 + 0.45 * sl);
  const boxA = 1 - smooth(clamp((sl - 0.55) / 0.35));
  if (boxA > 0.01) {
    const [mx, my] = SELFIE_MARK;
    ctx.save();
    ctx.globalAlpha *= boxA;
    ctx.setLineDash([16, 10]);
    ctx.strokeStyle = "#ffd84d";
    ctx.lineWidth = 5;
    rr(ctx, mx - 88, my - 72, 176, 144, 18);
    ctx.stroke();
    ctx.setLineDash([]);
    const tw = measure(ctx, "瑕疵", 30, F.ui, 700) + 30;
    ctx.fillStyle = "#ffd84d";
    rr(ctx, mx - 88, my - 72 - 50, tw, 44, 8);
    ctx.fill();
    text(ctx, "瑕疵", mx - 88 + tw / 2, my - 72 - 27, { size: 30, font: F.ui, weight: 700, fill: "#1a1a1a" });
    ctx.restore();
  }
  ctx.restore();
  // (no status bar: in this close-up the top of the phone sits under the title pill)
  const tg = ctx.createLinearGradient(0, 0, 0, 170);
  tg.addColorStop(0, "rgba(0,0,0,0.45)");
  tg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, SW, 170);
  flawBadge(ctx, 300, 236, o.zero);
  // the tool panel
  ctx.fillStyle = "#1c1c1f";
  ctx.fillRect(0, 820, SW, SH - 820);
  ["磨皮", "美白", "祛斑", "瘦脸"].forEach((t, i) => {
    const x = 90 + i * 140,
      on = i === 2;
    text(ctx, t, x, 866, { size: 30, font: F.ui, weight: on ? 700 : 400, fill: on ? "#ff6f9c" : "#8e8e96" });
    if (on) {
      ctx.fillStyle = "#ff6f9c";
      ctx.beginPath();
      ctx.arc(x, 900, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const { x0, x1, y } = SLIDER;
  ctx.fillStyle = "#3a3a40";
  rr(ctx, x0, y - 5, x1 - x0, 10, 5);
  ctx.fill();
  const kx = x0 + (x1 - x0) * sl;
  if (kx - x0 > 1) {
    ctx.fillStyle = "#ff6f9c";
    rr(ctx, x0, y - 5, kx - x0, 10, 5);
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(kx, y, 20, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, String(Math.round(sl * 100)), 525, y + 1, { size: 32, font: F.ui, weight: 700, fill: "#fff" });
  text(ctx, "取消", 90, 1196, { size: 30, font: F.ui, fill: "#8e8e96" });
  text(ctx, "完成", 510, 1196, { size: 30, font: F.ui, weight: 700, fill: "#ff6f9c" });
}

// ================================================================ 「发送给」
export const SEND_AT: Pt = [420, 866];
/** WeChat's share dialog over the chat: 发送给：白猫, the photo, 取消 / 发送. `k` 0..1 opens it, `press` darkens 发送. */
export function sendDialog(ctx: Ctx, k: number, press: number, photo: (c: Ctx, w: number, h: number) => void) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(k * 2);
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, SW, SH);
  const s = 0.86 + 0.14 * backOut(clamp(k));
  ctx.translate(SW / 2, 600);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -600);
  ctx.fillStyle = "#2c2c2e";
  rr(ctx, 60, 300, 480, 600, 18);
  ctx.fill();
  text(ctx, "发送给：", 100, 352, { size: 30, font: F.ui, weight: 700, fill: "#e8e8e8", align: "left" });
  catAvatar(ctx, 134, 428, "white", 64);
  text(ctx, "白猫", 186, 428, { size: 32, font: F.ui, fill: "#e8e8e8", align: "left" });
  ctx.fillStyle = "#3a3a3c";
  ctx.fillRect(100, 476, 400, 2);
  ctx.save();
  rr(ctx, 180, 500, 240, 310, 10);
  ctx.clip();
  ctx.translate(180, 500 - 17);
  photo(ctx, 240, 344);
  ctx.restore();
  ctx.fillStyle = "#3a3a3c";
  ctx.fillRect(60, 832, 480, 2);
  ctx.fillRect(299, 834, 2, 66);
  if (press > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(0.12 * press).toFixed(3)})`;
    ctx.fillRect(301, 834, 239, 66);
  }
  text(ctx, "取消", 180, SEND_AT[1], { size: 32, font: F.ui, fill: "#e8e8e8" });
  text(ctx, "发送", SEND_AT[0], SEND_AT[1], { size: 32, font: F.ui, weight: 700, fill: press > 0.5 ? "#05a150" : "#07c160" });
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
/** Previews of whole screens: the 600×1280 screen units. */
const SCREEN = { width: 600, height: 1280, duration: 2, prepare: loadFonts };
const FACE: KidPose = { eyes: "wide", mouth: "o", look: [0, 0.1] };
const DEMO: ChatItem[] = [
  { t: "time", text: "23:41" },
  { t: "call" },
  { t: "msg", text: "你睡了吗" },
  { t: "msg", me: true, text: "还没" },
  { t: "sticker" },
  { t: "photo", me: true, draw: (c, w, h) => selfie(c, w, h, 1, 0.8) },
];

export const resources = defineResources({
  darkPhone: resource({
    kind: "prop",
    title: "手机（深色界面）",
    description: "《mirrors》他的手机：侧键、金属边的轮廓光、玻璃反光；screen 在 600×1280 的屏幕坐标里画。aimPhone 求出让屏幕上某点落在画面某点的手机中心（镜头对准一句话）；phoneBack 是他拿着看时的背面（屏幕冷光从上沿漏出来）。",
    tags: ["手机", "深色", "夜间"],
    usage: "phone(ctx, cx, cy, s, rot, (c) => chatScreen(c, abs, view))",
    preview: {
      width: 760,
      height: 1440,
      duration: 2,
      prepare: loadFonts,
      draw(ctx, t) {
        beginFrame(ctx, t);
        phone(ctx, 380, 720, 1, 0, (c) => chatScreen(c, t, { title: "白猫", time: "23:48", items: DEMO }));
      },
    },
  }),
  darkChat: resource({
    kind: "ui",
    title: "深色聊天（猫头像）",
    description: "深色的微信风格聊天：她的气泡在左（白猫头像），他的在右（背对的黑猫）；items 有 time、msg、sticker（白猫贴纸）、call（「已拒绝」通话记录）、photo（照片气泡，draw 画内容）；typing 标题「对方正在输入...」，keyboard 键盘，scroll 往下移。",
    tags: ["聊天", "微信", "深色", "夜间", "手机", "猫"],
    usage: "chatScreen(c, abs, { title, time, items, typing, keyboard, scroll })",
    params: z.object({ typing: z.boolean().default(false).describe("对方正在输入"), keyboard: z.boolean().default(false).describe("键盘") }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        chatScreen(ctx, t, { title: "白猫", time: "23:48", items: DEMO, ...p });
      },
    },
  }),
  callScreen: resource({
    kind: "ui",
    title: "视频来电（前置摄像头）",
    description: "微信视频来电：她的名字压在他自己前置摄像头的画面上（他盖不住的那面“镜子”）；face 是他的表情（KidPose），ringK 0..1 让接听按钮的波纹循环，labels 文字的不透明度。前置画面单独用 frontCamera。",
    tags: ["视频通话", "来电", "前置摄像头", "手机"],
    usage: "callScreen(c, face, time, ringK, labels)",
    preview: {
      ...SCREEN,
      draw(ctx, t) {
        beginFrame(ctx, t);
        callScreen(ctx, FACE, "23:48", t % 1);
      },
    },
  }),
  beautyScreen: resource({
    kind: "ui",
    title: "美颜 App（祛斑）",
    description: "美颜 App：他的自拍，胎记被框出来标着「瑕疵」，祛斑滑条 slider 0..1 把它抹掉，zero 0..1 让计数翻到 0。",
    tags: ["美颜", "自拍", "祛斑", "胎记", "手机"],
    usage: "beautyScreen(c, { slider, zero })",
    params: z.object({ slider: z.number().min(0).max(1).default(0.4).describe("祛斑滑条"), zero: z.number().min(0).max(1).default(0).describe("计数翻到 0") }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        beautyScreen(ctx, p);
      },
    },
  }),
  sendDialog: resource({
    kind: "ui",
    title: "发送给…（分享对话框）",
    description: "聊天上的分享对话框：「发送给：白猫」、照片、取消 / 发送；k 0..1 弹出，press 让发送变暗（按下）；photo 画照片。",
    tags: ["发送", "分享", "对话框", "手机"],
    usage: "sendDialog(c, k, press, (p, w, h) => selfie(p, w, h, 0, 1))",
    params: z.object({ press: z.number().min(0).max(1).default(0).describe("按下发送") }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        chatScreen(ctx, t, { title: "白猫", time: "23:50", items: DEMO.slice(0, 4) });
        sendDialog(ctx, 1, p.press, (c, w, h) => selfie(c, w, h, 0, 1));
      },
    },
  }),
  selfie: resource({
    kind: "prop",
    title: "自拍（胎记）",
    description: "前置摄像头拍的自拍（600×860，缩放画进 w × h，镜像的）：mark 1 是他本来的样子，0 是美颜抹平后的；bright 亮度。",
    tags: ["自拍", "照片", "胎记", "美颜"],
    usage: "selfie(ctx, w, h, mark, bright)  // 画在原点",
    params: z.object({ mark: z.number().min(0).max(1).default(1).describe("胎记"), bright: z.number().min(0).max(1).default(0.6).describe("亮度") }),
    preview: {
      width: 600,
      height: 860,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        selfie(ctx, 600, 860, p.mark, p.bright);
      },
    },
  }),
  catAvatar: resource({
    kind: "ui",
    title: "猫头像（白猫 / 黑猫）",
    description: "聊天头像：white 她（笑着的白猫），black 他（背对的黑猫）。whiteCatFace 是白猫的脸（挂件和贴纸用同一张），whiteCatSticker 是挥爪的白猫贴纸。",
    tags: ["头像", "猫", "白猫", "黑猫", "贴纸"],
    usage: "catAvatar(ctx, x, y, who, size) / whiteCatFace(ctx, x, y, s) / whiteCatSticker(ctx, x, y, s)",
    params: z.object({ who: z.enum(["white", "black", "sticker"]).default("white").describe("哪一个") }),
    preview: {
      width: 300,
      height: 300,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        if (p.who === "sticker") whiteCatSticker(ctx, 150, 150, 2);
        else catAvatar(ctx, 150, 150, p.who, 220);
      },
    },
  }),
});
