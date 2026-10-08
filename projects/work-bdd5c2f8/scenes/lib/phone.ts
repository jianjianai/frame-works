import { clamp } from "../../../../src/engine/math";
import { C, Ctx, F, blob, measure, paint, poly, rr, rrectPts, text } from "./draw";
import { drawPerson, Person, xMark } from "./people";

/** Phone screen design size. */
export const SW = 600;
export const SH = 1280;

/** Draw a phone centred at (cx, cy); `screen` draws in 0..SW × 0..SH screen coordinates. */
export function phone(ctx: Ctx, cx: number, cy: number, s: number, rot: number, screen: (ctx: Ctx) => void, seed = 900) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  blob(ctx, rrectPts(-26, -26, SW + 52, SH + 52, 92), seed, 1.6);
  paint(ctx, "#121214", C.ink, 7);
  // 光影: the metal frame catches the light — warm down the left side, cold down the right — so the phone reads
  // against a dark room
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
  ctx.restore();
  // dynamic island
  ctx.fillStyle = "#000";
  rr(ctx, SW / 2 - 90, 18, 180, 50, 25);
  ctx.fill();
  ctx.restore();
}

/** A phone seen from behind, in someone's hand (we see its back while they read it): dark case, the camera bump top
 *  left, the screen's light spilling out round the top edge; `torch` 0..1 lights the flashlight LED, blazing at us.
 *  (cx, cy) = its centre; draw it in the hand's `grip`/`holding` so the fingers go over it. */
export function phoneBack(ctx: Ctx, cx: number, cy: number, w: number, h: number, rot = 0, torch = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const spill = ctx.createRadialGradient(0, -h / 2, 0, 0, -h / 2, w * 1.3);
  spill.addColorStop(0, "rgba(180,210,255,0.35)");
  spill.addColorStop(1, "rgba(180,210,255,0)");
  ctx.fillStyle = spill;
  ctx.fillRect(-w * 1.3, -h / 2 - w * 1.3, w * 2.6, w * 1.6);
  ctx.fillStyle = "#1b1b20";
  rr(ctx, -w / 2, -h / 2, w, h, w * 0.18);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(2.5, w * 0.06);
  ctx.stroke();
  const b = w * 0.42,
    bx = -w / 2 + w * 0.1,
    by = -h / 2 + w * 0.1;
  ctx.fillStyle = "#2e2e36";
  rr(ctx, bx, by, b, b, b * 0.28);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, w * 0.035);
  ctx.stroke();
  ctx.fillStyle = "#0c0c10";
  for (const [u, v] of [[0.3, 0.3], [0.3, 0.72]]) {
    ctx.beginPath();
    ctx.arc(bx + b * u, by + b * v, b * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  const lx = bx + b * 0.74,
    ly = by + b * 0.3;
  ctx.fillStyle = torch > 0.5 ? "#fffdf2" : "#cfcfc6";
  ctx.beginPath();
  ctx.arc(lx, ly, b * 0.1, 0, Math.PI * 2);
  ctx.fill();
  if (torch > 0) {
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, w * 1.6);
    g.addColorStop(0, `rgba(255,255,250,${(0.95 * torch).toFixed(3)})`);
    g.addColorStop(0.15, `rgba(240,245,255,${(0.5 * torch).toFixed(3)})`);
    g.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - w * 1.6, ly - w * 1.6, w * 3.2, w * 3.2);
  }
  ctx.restore();
}

/** No hands on the phone (用户): its side buttons, drawn before phone() at the same (cx, cy, s, rot) so only their
 *  edges stick out of the frame; `press` pushes the power key in. */
export function phoneButtons(ctx: Ctx, cx: number, cy: number, s: number, rot: number, press = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  const px = SW + 22 - 9 * press;
  poly(ctx, [[px, 300], [px + 14, 306], [px + 14, 456], [px, 462]], 1501, 0.6);
  paint(ctx, "#2a2a2e", C.ink, 4);
  for (const [y0, y1] of [[250, 330], [356, 436]]) {
    poly(ctx, [[-22, y0], [-36, y0 + 6], [-36, y1 - 6], [-22, y1]], 1502 + y0, 0.6);
    paint(ctx, "#2a2a2e", C.ink, 4);
  }
  ctx.restore();
}
/** A faint diagonal glare across the glass (inside phone()'s screen callback), sliding a little with his hand. */
export function glassGlare(p: Ctx, shift: number, a = 1) {
  const g = p.createLinearGradient(-200 + shift * 6, 0, SW + 200 + shift * 6, SH);
  g.addColorStop(0.2, "rgba(255,255,255,0)");
  g.addColorStop(0.3, `rgba(255,255,255,${(0.06 * a).toFixed(3)})`);
  g.addColorStop(0.4, "rgba(255,255,255,0)");
  p.fillStyle = g;
  p.fillRect(0, 0, SW, SH);
}

export function airplaneIcon(ctx: Ctx, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.quadraticCurveTo(0.5, -0.06, 0.38, -0.06);
  ctx.lineTo(0.12, -0.06);
  ctx.lineTo(-0.12, -0.5);
  ctx.lineTo(-0.24, -0.5);
  ctx.lineTo(-0.1, -0.06);
  ctx.lineTo(-0.34, -0.06);
  ctx.lineTo(-0.44, -0.22);
  ctx.lineTo(-0.52, -0.22);
  ctx.lineTo(-0.46, 0);
  ctx.lineTo(-0.52, 0.22);
  ctx.lineTo(-0.44, 0.22);
  ctx.lineTo(-0.34, 0.06);
  ctx.lineTo(-0.1, 0.06);
  ctx.lineTo(-0.24, 0.5);
  ctx.lineTo(-0.12, 0.5);
  ctx.lineTo(0.12, 0.06);
  ctx.lineTo(0.38, 0.06);
  ctx.quadraticCurveTo(0.5, 0.06, 0.5, 0);
  ctx.fill();
  ctx.restore();
}
function signalIcon(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    rr(ctx, x + i * 9, y - 6 - i * 5, 6, 8 + i * 5, 2);
    ctx.fill();
  }
}
function wifiIcon(ctx: Ctx, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y + 6, i * 7, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }
}
function battery(ctx: Ctx, x: number, y: number, level: number, color: string) {
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.9;
  ctx.lineWidth = 2.5;
  rr(ctx, x, y - 11, 44, 22, 6);
  ctx.stroke();
  ctx.fillStyle = level < 0.2 ? C.red : color;
  rr(ctx, x + 4, y - 7, 36 * level, 14, 3);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x + 46, y - 4, 4, 8, 2);
  ctx.fill();
}

export interface Status {
  time: string;
  airplane: boolean;
  battery?: number;
  dark?: boolean; // dark content on light screen
  /** highlight the airplane icon (for the rewatch reveal) */
  ring?: number;
}
export function statusBar(ctx: Ctx, st: Status) {
  const col = st.dark ? "#111" : "#fff";
  ctx.save();
  text(ctx, st.time, 96, 46, { size: 30, font: F.ui, weight: 700, fill: col });
  const rx = SW - 70;
  battery(ctx, rx - 26, 46, st.battery ?? 0.34, col);
  ctx.restore();
  ctx.save();
  if (st.airplane) airplaneIcon(ctx, rx - 70, 46, 40, col);
  else {
    wifiIcon(ctx, rx - 66, 46, col);
    signalIcon(ctx, rx - 128, 54, col);
  }
  if (st.ring && st.ring > 0) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 6;
    ctx.globalAlpha = clamp(st.ring);
    ctx.beginPath();
    ctx.ellipse(rx - 70, 46, 44, 34, 0, 0, Math.PI * 2 * clamp(st.ring * 1.2));
    ctx.stroke();
  }
  ctx.restore();
}

/** His lock-screen wallpaper (美感): a dusk sky going from deep blue to a rose glow on the horizon, stars, a thin
 *  moon, and an empty swing on a hill in silhouette, its seat still swaying a little. */
export function wallpaper(ctx: Ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, "#121843");
  g.addColorStop(0.42, "#262a66");
  g.addColorStop(0.68, "#4d3a7a");
  g.addColorStop(0.82, "#9a5f86");
  g.addColorStop(0.9, "#c98a8e");
  g.addColorStop(1, "#c98a8e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  // stars (fixed), a few of them with a little cross of light
  let s = 77;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * SW,
      y = 60 + rnd() * 820,
      big = rnd() > 0.86;
    ctx.fillStyle = `rgba(235,238,255,${(0.35 + 0.5 * rnd()) * (1 - y / 1100)})`;
    ctx.beginPath();
    ctx.arc(x, y, big ? 3 : 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (big) {
      ctx.fillRect(x - 9, y - 0.8, 18, 1.6);
      ctx.fillRect(x - 0.8, y - 9, 1.6, 18);
    }
  }
  // a thin crescent moon with its halo
  const mg = ctx.createRadialGradient(470, 448, 0, 470, 448, 130);
  mg.addColorStop(0, "rgba(255,240,215,0.35)");
  mg.addColorStop(1, "rgba(255,240,215,0)");
  ctx.fillStyle = mg;
  ctx.fillRect(340, 318, 260, 260);
  ctx.save();
  ctx.beginPath();
  ctx.arc(470, 448, 32, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#fff1d6";
  ctx.fillRect(430, 410, 80, 80);
  ctx.fillStyle = "#2c2d6b";
  ctx.beginPath();
  ctx.arc(484, 438, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // the glow behind the hill
  const hg = ctx.createRadialGradient(300, 1080, 0, 300, 1080, 460);
  hg.addColorStop(0, "rgba(255,190,170,0.35)");
  hg.addColorStop(1, "rgba(255,190,170,0)");
  ctx.fillStyle = hg;
  ctx.fillRect(-160, 620, 920, 920);
  // the hill, its crest catching the last light
  const hill = () => {
    ctx.beginPath();
    ctx.moveTo(-10, 1110);
    ctx.bezierCurveTo(140, 1010, 420, 990, 610, 1090);
    ctx.lineTo(610, SH + 10);
    ctx.lineTo(-10, SH + 10);
    ctx.closePath();
  };
  hill();
  ctx.fillStyle = "#14143a";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, 1110);
  ctx.bezierCurveTo(140, 1010, 420, 990, 610, 1090);
  ctx.strokeStyle = "rgba(255,200,190,0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  // the swing set on top of it, in silhouette, the seat hanging a little off true (someone just left it)
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const frame = () => {
    ctx.beginPath();
    ctx.moveTo(196, 1022);
    ctx.lineTo(240, 820);
    ctx.lineTo(268, 1018);
    ctx.moveTo(392, 1020);
    ctx.lineTo(420, 820);
    ctx.lineTo(452, 1030);
    ctx.moveTo(226, 822);
    ctx.lineTo(436, 822);
  };
  frame();
  ctx.strokeStyle = "rgba(255,200,190,0.3)";
  ctx.lineWidth = 13;
  ctx.stroke();
  frame();
  ctx.strokeStyle = "#14143a";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.translate(330, 824);
  ctx.rotate(0.07);
  ctx.strokeStyle = "#14143a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-34, 140);
  ctx.moveTo(34, 0);
  ctx.lineTo(34, 140);
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-46, 142);
  ctx.lineTo(46, 142);
  ctx.stroke();
  ctx.restore();
}

export function lockScreen(ctx: Ctx, st: Status, opts: { date?: string; note?: string; noteAlpha?: number } = {}) {
  wallpaper(ctx);
  statusBar(ctx, st);
  text(ctx, opts.date ?? "10月5日 星期一", SW / 2, 170, { size: 34, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.85)" });
  text(ctx, st.time, SW / 2, 290, { size: 170, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.95)" });
  if (opts.note) {
    ctx.save();
    ctx.globalAlpha = opts.noteAlpha ?? 1;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    rr(ctx, 70, 520, SW - 140, 96, 30);
    ctx.fill();
    text(ctx, opts.note, SW / 2, 568, { size: 34, font: F.ui, weight: 700, fill: "#fff" });
    ctx.restore();
  }
  // flashlight & camera
  for (const x of [90, SW - 90]) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.arc(x, SH - 120, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  rr(ctx, SW / 2 - 90, SH - 30, 180, 8, 4);
  ctx.fill();
}

// ---------------------------------------------------------------- chat
export interface Msg {
  me?: boolean;
  from?: string;
  text: string;
  failed?: number; // 0..1 red mark appear
  sending?: number; // spinner
  avatar?: Person;
  /** a grey time label above this message, e.g. "10:12" */
  time?: string;
  /** a grey system line instead of a bubble, e.g. "阿杰 撤回了一条消息" */
  system?: boolean;
}
function avatar(ctx: Ctx, x: number, y: number, p: Person | undefined, me: boolean) {
  ctx.save();
  rr(ctx, x - 34, y - 34, 68, 68, 12);
  ctx.fillStyle = me ? "#9ec3dc" : "#d7d2c8";
  ctx.fill();
  ctx.clip();
  if (me) {
    // a tiny version of the kid's hair as avatar
    ctx.fillStyle = C.skin;
    ctx.beginPath();
    ctx.arc(x, y + 12, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      const r = i % 2 ? 36 : 26;
      ctx.lineTo(x + Math.cos(a) * r, y + 4 + Math.sin(a) * r);
    }
    ctx.fill();
  } else if (p) {
    drawPerson(ctx, x, y + 10, 0.3, { ...p, body: "bust" });
  }
  ctx.restore();
}
export function chatScreen(ctx: Ctx, st: Status, title: string, msgs: Msg[], input: string, caret: boolean, opts: { keyboard?: boolean; scroll?: number } = {}) {
  ctx.fillStyle = "#ededed";
  ctx.fillRect(0, 0, SW, SH);
  statusBar(ctx, { ...st, dark: true });
  ctx.fillStyle = "#ededed";
  ctx.fillRect(0, 80, SW, 80);
  text(ctx, "‹", 40, 120, { size: 60, font: F.ui, fill: "#111" });
  text(ctx, title, SW / 2, 120, { size: 32, font: F.ui, weight: 700, fill: "#111" });
  text(ctx, "···", SW - 50, 116, { size: 40, font: F.ui, weight: 700, fill: "#111" });
  ctx.fillStyle = "#d6d6d6";
  ctx.fillRect(0, 160, SW, 2);
  const top = 162;
  const kb = opts.keyboard ? 420 : 0;
  const inputY = SH - 120 - kb;
  // messages from the bottom up
  let y = inputY - 40 + (opts.scroll ?? 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, SW, inputY - top);
  ctx.clip();
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.system) {
      y -= 52;
      const w = measure(ctx, m.text, 24, F.ui) + 36;
      ctx.fillStyle = "#dadada";
      rr(ctx, SW / 2 - w / 2, y, w, 44, 8);
      ctx.fill();
      text(ctx, m.text, SW / 2, y + 23, { size: 24, font: F.ui, fill: "#777" });
      y -= 30;
      if (m.time) {
        text(ctx, m.time, SW / 2, y + 10, { size: 22, font: F.ui, fill: "#9a9a9a" });
        y -= 48;
      }
      continue;
    }
    ctx.font = `400 30px ${F.ui}`;
    const lines = wrap(ctx, m.text, 330);
    const bh = lines.length * 42 + 36;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
    y -= bh;
    const ax = m.me ? SW - 56 : 56;
    avatar(ctx, ax, y + 34, m.avatar, !!m.me);
    const bx = m.me ? SW - 106 - bw : 106;
    if (!m.me && m.from) {
      text(ctx, m.from, bx + 6, y - 14, { size: 22, font: F.ui, fill: "#888", align: "left" });
    }
    ctx.fillStyle = m.me ? "#95ec69" : "#fff";
    rr(ctx, bx, y, bw, bh, 12);
    ctx.fill();
    lines.forEach((l, k) => text(ctx, l, bx + 22, y + 38 + k * 42, { size: 30, font: F.ui, fill: "#111", align: "left" }));
    if (m.me && m.sending) {
      ctx.save();
      ctx.translate(bx - 34, y + bh / 2);
      ctx.rotate(m.sending * 12);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    }
    if (m.me && m.failed) {
      const k = clamp(m.failed);
      ctx.save();
      ctx.translate(bx - 34, y + bh / 2);
      ctx.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k);
      ctx.globalAlpha = k;
      ctx.fillStyle = "#f04343";
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, "!", 0, 1, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
      ctx.restore();
    }
    y -= m.from && !m.me ? 70 : 40;
    if (m.time) {
      text(ctx, m.time, SW / 2, y + 10, { size: 22, font: F.ui, fill: "#9a9a9a" });
      y -= 48;
    }
  }
  ctx.restore();
  // input bar
  ctx.fillStyle = "#f7f7f7";
  ctx.fillRect(0, inputY, SW, 120 + kb);
  ctx.fillStyle = "#fff";
  rr(ctx, 90, inputY + 22, SW - 200, 72, 10);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(90, inputY + 22, SW - 200, 72);
  ctx.clip();
  const tw = measure(ctx, input, 30, F.ui);
  const tx = Math.min(110, SW - 130 - tw);
  text(ctx, input, tx, inputY + 59, { size: 30, font: F.ui, fill: "#111", align: "left" });
  if (caret) {
    ctx.fillStyle = "#07c160";
    ctx.fillRect(tx + tw + 4, inputY + 38, 3, 42);
  }
  ctx.restore();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, inputY + 58, 22, 0, Math.PI * 2);
  ctx.stroke();
  if (input) {
    ctx.fillStyle = "#07c160";
    rr(ctx, SW - 100, inputY + 30, 84, 58, 10);
    ctx.fill();
    text(ctx, "发送", SW - 58, inputY + 59, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  } else {
    ctx.beginPath();
    ctx.arc(SW - 50, inputY + 58, 22, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, "+", SW - 50, inputY + 57, { size: 36, font: F.ui, fill: "#333" });
  }
  if (kb) {
    ctx.fillStyle = "#d1d3d9";
    ctx.fillRect(0, SH - kb, SW, kb);
    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    rows.forEach((row, r) => {
      const n = row.length;
      const kw = 52,
        gap = 6;
      const x0 = (SW - (n * kw + (n - 1) * gap)) / 2;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = "#fff";
        rr(ctx, x0 + i * (kw + gap), SH - kb + 20 + r * 92, kw, 76, 8);
        ctx.fill();
        text(ctx, row[i], x0 + i * (kw + gap) + kw / 2, SH - kb + 58 + r * 92, { size: 28, font: F.ui, fill: "#222" });
      }
    });
  }
}
export function wrap(ctx: Ctx, s: string, maxW: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of Array.from(s)) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}

// ---------------------------------------------------------------- feed
export interface Post {
  name: string;
  text: string;
  people: Person[];
  bg: string;
  likes: string;
  who?: Person;
}
export function feedScreen(ctx: Ctx, st: Status, posts: Post[], scroll: number) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SW, SH);
  ctx.save();
  ctx.translate(0, -scroll);
  let y = 120;
  posts.forEach((p, i) => {
    avatar(ctx, 60, y + 36, p.who ?? p.people[0], false);
    text(ctx, p.name, 112, y + 18, { size: 28, font: F.ui, weight: 700, fill: "#576b95", align: "left" });
    text(ctx, p.text, 112, y + 62, { size: 28, font: F.ui, fill: "#111", align: "left" });
    // photo
    const px = 112,
      py = y + 96,
      pw = 400,
      ph = 300;
    ctx.save();
    rr(ctx, px, py, pw, ph, 6);
    ctx.fillStyle = p.bg;
    ctx.fill();
    ctx.clip();
    const n = p.people.length;
    p.people.forEach((q, k) => {
      drawPerson(ctx, px + ((k + 0.5) / n) * pw, py + 140 + (k % 2) * 16, 0.62, { ...q, arms: k % 2 ? "up" : "laugh", body: "full", seed: (q.seed ?? 1) + i * 10 });
    });
    ctx.restore();
    text(ctx, "♥ " + p.likes, 112, py + ph + 34, { size: 24, font: F.ui, fill: "#576b95", align: "left" });
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, py + ph + 70, SW, 2);
    y = py + ph + 100;
  });
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fillRect(0, 0, SW, 110);
  statusBar(ctx, { ...st, dark: true });
  text(ctx, "朋友动态", SW / 2, 92, { size: 28, font: F.ui, weight: 700, fill: "#111" });
}

// ---------------------------------------------------------------- control centre
/** `torch` 0..1: the flashlight tile lights up white (the torch is on). */
export function controlCenter(ctx: Ctx, st: Status, airplaneOn: boolean, press: number, highlight: number, torch = 0) {
  ctx.fillStyle = "rgba(20,22,32,0.92)";
  ctx.fillRect(0, 0, SW, SH);
  statusBar(ctx, st);
  const x0 = 50,
    y0 = 150,
    cell = 116,
    gap = 20;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  rr(ctx, x0, y0, cell * 2 + gap * 3, cell * 2 + gap * 3, 44);
  ctx.fill();
  const toggles: [string, boolean, string][] = [
    ["air", airplaneOn, C.orange],
    ["cell", !airplaneOn, "#34c759"],
    ["wifi", false, "#0a84ff"],
    ["bt", false, "#0a84ff"],
  ];
  toggles.forEach(([id, on, color], i) => {
    const cx = x0 + gap + cell / 2 + (i % 2) * (cell + gap);
    const cy = y0 + gap + cell / 2 + Math.floor(i / 2) * (cell + gap);
    const sc = id === "air" ? 1 - 0.12 * press : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.fillStyle = on ? color : "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(0, 0, cell / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    const ic = on ? "#fff" : "#fff";
    if (id === "air") airplaneIcon(ctx, 0, 0, 58, ic);
    else if (id === "cell") {
      ctx.strokeStyle = ic;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(0, 24);
      ctx.moveTo(-14, -10);
      ctx.arc(0, -10, 14, Math.PI, 0);
      ctx.stroke();
    } else if (id === "wifi") wifiIcon(ctx, 0, 6, ic);
    else text(ctx, "ᛒ", 0, 2, { size: 50, font: F.ui, fill: ic });
    ctx.restore();
    if (id === "air" && highlight > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(highlight);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cell * 0.66, cell * 0.62, -0.1, 0, Math.PI * 2 * clamp(highlight * 1.3));
      ctx.stroke();
      ctx.restore();
    }
  });
  // music + sliders
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  rr(ctx, x0 + cell * 2 + gap * 4, y0, SW - x0 * 2 - (cell * 2 + gap * 4), cell * 2 + gap * 3, 44);
  ctx.fill();
  text(ctx, "i have no friends", x0 + cell * 2 + gap * 5, y0 + 70, { size: 24, font: F.ui, weight: 700, fill: "#fff", align: "left" });
  text(ctx, "s0rrow", x0 + cell * 2 + gap * 5, y0 + 106, { size: 22, font: F.ui, fill: "rgba(255,255,255,0.6)", align: "left" });
  text(ctx, "◀◀    ❚❚    ▶▶", x0 + cell * 2 + gap * 5 + 98, y0 + 210, { size: 26, font: F.ui, fill: "#fff" });
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    rr(ctx, x0 + i * 140, y0 + 300, 116, 260, 36);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    rr(ctx, x0 + i * 140, y0 + 300 + 260 * (i ? 0.45 : 0.7), 116, 260 * (i ? 0.55 : 0.3), 36);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  rr(ctx, x0 + 280, y0 + 300, 220, 116, 36);
  ctx.fill();
  const lit = torch > 0.5;
  ctx.fillStyle = lit ? "#f4f4f6" : "rgba(255,255,255,0.12)";
  rr(ctx, x0 + 280, y0 + 444, 220, 116, 36);
  ctx.fill();
  // flashlight
  const fx = x0 + 390,
    fy = y0 + 502;
  ctx.fillStyle = lit ? "#1c1c1e" : "#fff";
  ctx.beginPath();
  ctx.moveTo(fx - 20, fy - 30);
  ctx.lineTo(fx + 20, fy - 30);
  ctx.lineTo(fx + 12, fy - 8);
  ctx.lineTo(fx - 12, fy - 8);
  ctx.closePath();
  ctx.fill();
  rr(ctx, fx - 12, fy - 6, 24, 40, 6);
  ctx.fill();
  ctx.fillStyle = lit ? "#f4f4f6" : "rgba(20,22,32,0.9)";
  ctx.beginPath();
  ctx.arc(fx, fy + 10, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- notifications
export interface Note {
  title: string;
  body: string;
  kind?: "msg" | "call" | "group";
  time?: string;
  count?: string;
}
/** Draws a banner notification and returns its height. */
export function notificationHeight(ctx: Ctx, w: number, n: Note) {
  ctx.save();
  ctx.font = `400 27px ${F.ui}`;
  const lines = wrap(ctx, n.body, w - 140).length;
  ctx.restore();
  return lines > 1 ? 166 : 128;
}
export function notification(ctx: Ctx, x: number, y: number, w: number, n: Note, alpha = 1) {
  const h = notificationHeight(ctx, w, n);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = "rgba(245,245,247,0.94)";
  rr(ctx, x, y, w, h, 32);
  ctx.fill();
  const ic = n.kind === "call" ? "#34c759" : "#07c160";
  ctx.fillStyle = ic;
  rr(ctx, x + 22, y + 30, 68, 68, 16);
  ctx.fill();
  if (n.kind === "call") text(ctx, "✆", x + 56, y + 64, { size: 40, font: F.ui, fill: "#fff" });
  else {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x + 56, y + 62, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, n.title, x + 110, y + 44, { size: 28, font: F.ui, weight: 700, fill: "#111", align: "left" });
  text(ctx, n.time ?? "现在", x + w - 26, y + 44, { size: 22, font: F.ui, fill: "#888", align: "right" });
  ctx.save();
  ctx.font = `400 27px ${F.ui}`;
  wrap(ctx, n.body, w - 140)
    .slice(0, 2)
    .forEach((l, k) => text(ctx, l, x + 110, y + 88 + k * 38, { size: 27, font: F.ui, fill: "#333", align: "left" }));
  ctx.restore();
  if (n.count) {
    ctx.fillStyle = C.red;
    const cw = measure(ctx, n.count, 22, F.ui, 700) + 22;
    rr(ctx, x + 90 - cw / 2 + 4, y + 18, cw, 34, 17);
    ctx.fill();
    text(ctx, n.count, x + 94, y + 36, { size: 22, font: F.ui, weight: 700, fill: "#fff" });
  }
  ctx.restore();
  return h;
}

/** Red unread badge. */
export function badge(ctx: Ctx, x: number, y: number, label: string, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const w = Math.max(60, measure(ctx, label, 40, F.ui, 700) + 34);
  ctx.fillStyle = C.red;
  rr(ctx, -w / 2, -30, w, 60, 30);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, label, 0, 1, { size: 40, font: F.ui, weight: 700, fill: "#fff" });
  ctx.restore();
}

export { xMark };
