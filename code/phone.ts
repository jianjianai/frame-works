/**
 * 手机（第一支和重置版的界面）：phone(ctx, cx, cy, s, rot, screen) 画机身，screen 回调在 600×1280 的屏幕坐标里画内容。
 * 屏幕：锁屏 lockScreen（黄昏秋千壁纸 wallpaper）、聊天 chatScreen、动态 feedScreen、控制中心 controlCenter（飞行模式/手电）、
 * 横幅通知 notification、未读角标 badge、状态栏 statusBar；机身背面 phoneBack（可开手电）、侧键 phoneButtons、玻璃反光 glassGlare。
 * 微信风格的聊天（第二版）在 chat.ts，《mirrors》的深色界面在 mirrors/phoneui.ts。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, beginFrame, devScale, loadFonts, measure, paint, poly, rr, text } from "./draw";
import { CAST, drawPerson, Person, xMark } from "./people";

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
  // a clean outline concentric with the rim and the screen (a jittered outline poked little spikes out at the corners)
  void seed;
  rr(ctx, -26, -26, SW + 52, SH + 52, 96);
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

/** The screen's light round a phone in a dark room; draw it just before phone() with the same placement. A soft bloom
 *  hugs the outline (brightest at the frame, gone about 250 screen units out), a tighter one lights the edge, and a
 *  wide faint wash sits a little above the middle. Screen-blended, so it lifts the dark instead of greying it; blur
 *  sizes follow the canvas scale (devScale), so preview and export match. `rgb` is the light's colour. */
export function phoneHalo(ctx: Ctx, cx: number, cy: number, s: number, rot = 0, a = 1, rgb = "120,150,255") {
  if (a <= 0) return;
  const col = (k: number) => `rgba(${rgb},${(k * a).toFixed(3)})`;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // the wide wash
  const R = 1000,
    wy = -160;
  const w = ctx.createRadialGradient(0, wy, 0, 0, wy, R);
  w.addColorStop(0, col(0.15));
  w.addColorStop(0.28, col(0.09));
  w.addColorStop(0.55, col(0.035));
  w.addColorStop(0.8, col(0.01));
  w.addColorStop(1, col(0));
  ctx.fillStyle = w;
  ctx.fillRect(-R, wy - R, 2 * R, 2 * R);
  // the blooms: the shadow of a shape the phone body covers (inset, so a buzzing phone still hides it)
  const d = devScale(ctx);
  for (const [blur, k] of [[190, 0.62], [46, 0.4]] as const) {
    ctx.shadowColor = col(k);
    ctx.shadowBlur = blur * d;
    ctx.fillStyle = col(k);
    rr(ctx, -SW / 2 + 24, -SH / 2 + 24, SW - 48, SH - 48, 70);
    ctx.fill();
  }
  ctx.restore();
}

/** A phone seen from behind, in someone's hand (we see its back while they read it): dark case, the camera bump top
 *  left, the screen's light spilling out round the top edge; `torch` 0..1 lights the flashlight LED, blazing at us.
 *  (cx, cy) = its centre; draw it in the hand's `grip`/`holding` so the fingers go over it. */
/** Optional close-up finish; old calls keep the original dark case. */
export interface PhoneBackOptions {
  detailed?: boolean;
  caseColor?: string;
  cameraColor?: string;
  /** Three lenses on a triangular grid; the LED and sensor have their own clear space. */
  triple?: boolean;
}
function detailedPhoneBack(ctx: Ctx, cx: number, cy: number, w: number, h: number, rot: number, torch: number, o: PhoneBackOptions) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(w / 360, w / 360);
  const hh = h / w * 180;
  const caseColor = o.caseColor ?? "#262832";
  const cameraColor = o.cameraColor ?? "#363944";
  const circle = (x: number, y: number, r: number, fill: string | CanvasGradient, stroke?: string, line = 1) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
  };
  const box = (x: number, y: number, bw: number, bh: number, r: number, color: string) => {
    ctx.fillStyle = color; rr(ctx, x, y, bw, bh, r); ctx.fill();
  };
  // Keys are behind the case edge; the raised case has a shallow dark lower lip.
  for (const [x, y, bh] of [[-187, -hh + 182, 24], [-187, -hh + 230, 60], [-187, -hh + 307, 60], [179, -hh + 257, 103]]) {
    box(x, y, 9, bh, 4, "#635366");
    box(x + 1, y + 3, 5, bh - 6, 2, "#b9a3b2");
  }
  box(-180, -hh + 7, 360, 2 * hh, 55, "#5b4356");
  box(-180, -hh, 360, 2 * hh, 55, caseColor);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.save();
  rr(ctx, -177, -hh + 3, 354, 2 * hh - 6, 52); ctx.clip();
  const finish = ctx.createLinearGradient(-180, -hh, 180, hh);
  finish.addColorStop(0, "rgba(255,242,248,0.19)");
  finish.addColorStop(0.43, "rgba(255,240,248,0.03)");
  finish.addColorStop(1, "rgba(67,30,57,0.24)");
  ctx.fillStyle = finish; ctx.fillRect(-180, -hh, 360, 2 * hh);
  // Low relief rim and inner case seam, neither is an emissive light.
  rr(ctx, -172, -hh + 8, 344, 2 * hh - 16, 49);
  ctx.strokeStyle = "rgba(255,227,241,0.5)"; ctx.lineWidth = 3; ctx.stroke();
  rr(ctx, -164, -hh + 16, 328, 2 * hh - 32, 43);
  ctx.strokeStyle = "rgba(103,55,81,0.22)"; ctx.lineWidth = 1.5; ctx.stroke();
  // A few faint scuffs on the case; deterministic and small enough for the hand-drawn finish.
  ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,233,243,0.26)"; ctx.lineWidth = 1.4;
  for (const [x, y, dx, dy] of [[128, -hh + 105, -7, 20], [142, hh - 140, -8, 17], [-136, hh - 91, 8, -14], [75, hh - 55, 18, -4]]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  }
  ctx.restore();
  // All camera coordinates are relative to this bump, never to the phone width.
  const b = 156, bx = -148, by = -hh + 30;
  box(bx + 3, by + 6, b, b, 31, "rgba(41,24,37,0.35)");
  box(bx, by, b, b, 31, cameraColor);
  ctx.strokeStyle = "#6e4059"; ctx.lineWidth = 3; ctx.stroke();
  rr(ctx, bx + 4, by + 4, b - 8, b - 8, 27);
  ctx.strokeStyle = "rgba(255,222,237,0.42)"; ctx.lineWidth = 1.7; ctx.stroke();
  const lenses = o.triple ? [[0.29, 0.28], [0.29, 0.72], [0.72, 0.5]] : [[0.3, 0.29], [0.3, 0.71]];
  const r = b * 0.167;
  for (const [u, v] of lenses) {
    const x = bx + b * u, y = by + b * v;
    circle(x + 1.3, y + 2.6, r + 2, "rgba(45,23,39,0.48)");
    const metal = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    metal.addColorStop(0, "#bdafb9"); metal.addColorStop(0.35, "#716574"); metal.addColorStop(1, "#423a4d");
    circle(x, y, r, metal, "#24202d", 2);
    circle(x, y, r * 0.79, "#121420", "#c4b7c2", 0.8);
    const glass = ctx.createRadialGradient(x - r * 0.28, y - r * 0.3, 0, x, y, r * 0.67);
    glass.addColorStop(0, "#375b75"); glass.addColorStop(0.55, "#182438"); glass.addColorStop(1, "#080d19");
    circle(x, y, r * 0.63, glass);
    circle(x + r * 0.05, y + r * 0.03, r * 0.31, "#080d18", "rgba(107,132,158,0.35)", 0.7);
    ctx.strokeStyle = "rgba(159,191,214,0.65)"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(x, y, r * 0.73, -2.6, -1.2); ctx.stroke();
    circle(x - r * 0.3, y - r * 0.34, r * 0.1, "#b6d1e0");
    circle(x + r * 0.3, y + r * 0.3, r * 0.08, "rgba(106,133,176,0.65)");
  }
  const fx = bx + b * 0.72, fy = by + b * (o.triple ? 0.17 : 0.29);
  circle(fx, fy, b * 0.067, "#e8d9cc", "#926d7e", 1.4);
  circle(fx, fy, b * 0.042, "#fff0d9");
  circle(fx - 2, fy - 2, 2, "#fff8ec");
  circle(bx + b * 0.72, by + b * (o.triple ? 0.84 : 0.71), b * 0.045, "#34343e", "#ad879b", 1.3);
  circle(bx + b * 0.89, by + b * 0.23, 1.5, "#5f4358");
  // A small port and speaker holes in the lower edge, seen in the raised case lip.
  box(-15, hh - 3, 30, 3.2, 1.6, "#5f4358");
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) circle(side * (29 + i * 6), hh - 1, 1.2, "#705063");
  if (torch > 0) {
    const light = ctx.createRadialGradient(fx, fy, 0, fx, fy, 360 * 1.6);
    light.addColorStop(0, "rgba(255,255,250," + (0.95 * torch).toFixed(3) + ")");
    light.addColorStop(0.15, "rgba(240,245,255," + (0.5 * torch).toFixed(3) + ")");
    light.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = light; ctx.fillRect(fx - 576, fy - 576, 1152, 1152);
  }
  ctx.restore();
}

export function phoneBack(ctx: Ctx, cx: number, cy: number, w: number, h: number, rot = 0, torch = 0, options: PhoneBackOptions = {}) {
  if (options.detailed) { detailedPhoneBack(ctx, cx, cy, w, h, rot, torch, options); return; }
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
    // (switching airplane mode off brings Wi-Fi and Bluetooth back on too — more colour comes back with the wave)
    ["wifi", !airplaneOn, "#0a84ff"],
    ["bt", !airplaneOn, "#0a84ff"],
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

// ---------------------------------------------------------------- resources (preview and catalog)
const SAMPLE_MSGS: Msg[] = [
  { text: "生日快乐呀", from: "阿杰", avatar: CAST.jie, time: "22:10" },
  { me: true, text: "谢谢！今晚出来吗" },
  { me: true, text: "我请大家吃蛋糕", failed: 1 },
  { system: true, text: "阿杰 撤回了一条消息" },
];
const SAMPLE_POSTS: Post[] = [{ name: "阿杰", text: "生日快乐派对！", people: [CAST.jie, CAST.yu, CAST.monitor], bg: "#f6d6a8", likes: "雨、班长 等 23 人", who: CAST.jie }];
const screenOf = (kind: string, st: Status, abs: number) => (c: Ctx) => {
  if (kind === "lock") lockScreen(c, st, { note: "0 条新消息" });
  else if (kind === "chat") chatScreen(c, st, "高二(3)班", SAMPLE_MSGS, "大家都在吗", Math.floor(abs * 2) % 2 === 0, { keyboard: true });
  else if (kind === "feed") feedScreen(c, st, SAMPLE_POSTS, 0);
  else controlCenter(c, st, st.airplane, 0, 0, 0);
};

export const resources = defineResources({
  phone: resource({
    kind: "prop",
    title: "手机（锁屏 / 聊天 / 动态 / 控制中心）",
    description:
      "手机机身（金属边框有冷暖高光）和 screen 回调里的界面。screen 在 600×1280 的屏幕坐标里画：lockScreen、chatScreen（群聊、发送失败、撤回）、feedScreen（朋友动态）、controlCenter（飞行模式、手电）。不画手时用 hand.ts 的 touchDot 表示触点。",
    tags: ["手机", "锁屏", "聊天", "朋友圈", "控制中心", "飞行模式"],
    usage: "phone(ctx, cx, cy, s, rot, (c) => lockScreen(c, { time: \"23:58\", airplane: false }))",
    params: z.object({
      screen: z.enum(["lock", "chat", "feed", "control"]).default("lock").describe("示例界面"),
      time: z.string().default("23:58").describe("状态栏时间"),
      airplane: z.boolean().default(false).describe("飞行模式"),
      rot: z.number().min(-0.4).max(0.4).default(0).describe("旋转（弧度）"),
    }),
    presets: { 锁屏: { screen: "lock" }, 群聊: { screen: "chat" }, 朋友动态: { screen: "feed" }, 飞行模式: { screen: "control", airplane: true } },
    preview: {
      width: 760,
      height: 1440,
      duration: 2,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        phone(ctx, 380, 720, 1, p.rot, screenOf(p.screen, { time: p.time, airplane: p.airplane }, t));
      },
    },
  }),
  phoneBack: resource({
    kind: "prop",
    title: "手机背面（手电 / 精细机身）",
    description: "可选精细保护壳、侧键、双摄或三摄；镜头在模组内对齐，带镜圈、玻璃反光、闪光灯和传感器。默认沿用深色机身；torch 打开手电。",
    tags: ["手机", "背面", "摄像头", "手机壳", "细节", "手电"],
    usage: "phoneBack(ctx, cx, cy, w, h, rot, torch, { detailed, caseColor, cameraColor, triple })",
    params: z.object({
      torch: z.number().min(0).max(1).default(0).describe("手电亮度"),
      detailed: z.boolean().default(false).describe("精细机身"),
      caseColor: z.string().default("#262832").describe("保护壳颜色"),
      cameraColor: z.string().default("#363944").describe("摄像头底座颜色"),
      triple: z.boolean().default(false).describe("三摄模组"),
    }),
    presets: { 粉色三摄: { detailed: true, triple: true, caseColor: "#e9a5bd", cameraColor: "#cf859f" } },
    preview: {
      width: 600,
      height: 900,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        ctx.fillStyle = "#1c1f2b";
        ctx.fillRect(0, 0, 600, 900);
        phoneBack(ctx, 300, 450, 300, 600, 0.05, p.torch, p);
      },
    },
  }),
  notification: resource({
    kind: "ui",
    title: "横幅通知",
    description: "屏幕顶部的横幅通知（消息 / 来电 / 群聊），正文超过一行自动换行；notificationHeight 给出高度，用来排好几条。",
    tags: ["通知", "消息", "来电", "手机"],
    usage: "notification(ctx, x, y, w, { title, body, kind, time, count }, alpha)",
    params: z.object({
      kind: z.enum(["msg", "call", "group"]).default("msg").describe("类型"),
      title: z.string().default("阿杰").describe("标题"),
      body: z.string().default("生日快乐！今晚一起吃饭吗").describe("正文"),
    }),
    preview: {
      width: 700,
      height: 260,
      background: "#3b4a63",
      prepare: loadFonts,
      draw(ctx, t, p) {
        notification(ctx, 40, 50, 620, { title: p.title, body: p.body, kind: p.kind, time: "现在" });
      },
    },
  }),
  badge: resource({
    kind: "ui",
    title: "未读角标",
    description: "红色的未读数角标。",
    tags: ["角标", "未读", "红点"],
    usage: "badge(ctx, x, y, label, scale)",
    params: z.object({ label: z.string().default("99+").describe("数字") }),
    preview: {
      width: 240,
      height: 160,
      prepare: loadFonts,
      draw(ctx, t, p) {
        badge(ctx, 120, 80, p.label, 2);
      },
    },
  }),
  wallpaper: resource({
    kind: "ui",
    title: "锁屏壁纸（黄昏秋千）",
    description: "他的锁屏壁纸：深蓝到玫瑰色的黄昏天空、星星、细月亮、山坡上一架空秋千。画满 600×1280 的屏幕。",
    tags: ["壁纸", "锁屏", "黄昏", "秋千"],
    usage: "wallpaper(ctx)  // 在 phone() 的 screen 回调里",
    preview: {
      width: 600,
      height: 1280,
      draw(ctx, t) {
        beginFrame(ctx, t);
        wallpaper(ctx);
      },
    },
  }),
});
