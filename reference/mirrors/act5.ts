import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blob, bloom, camera, designScene, easeIn, easeInOut, flash, glow, handheld, inkLine, motes, oval, paint, poly, rbox, rr, shaded, text, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { whiteCatFace } from "@materials/s0rrow/code/mirrors/phoneui";
import { BATH, bathDoorLight, bathLight, bathroom } from "@materials/s0rrow/code/mirrors/sets";
import { MARK_AT, birthmark, newspaper, penHeart, sleeveHand, tape } from "@materials/s0rrow/code/mirrors/story";
import { END, EV } from "./timeline";
import { caption } from "./lyrics";

/** 第五幕（52.863 – 57.5，A 段回来："Put up all the mirrors in my house / I love my nose, eyes and my mouth"）
 *  回到开头那面镜子（同一句歌词，意思反过来）。他的手抓住报纸——「mirrors」53.88 一把全撕下来：镜子里是他自己的脸，
 *  胎记还在，他笑了。54.39 他把她画的小画贴在镜子角上：白猫和黑猫挨在一起（黑猫第一次露出了脸）。
 *  54.90 镜头推近镜子里的脸：唱到 nose / eyes 时冒出小爱心（和第 3 秒一样），这次胎记上也有一颗。
 *  55.5 结尾引导：双击点赞的爱心 +「点赞的人，在喜欢的人眼里都是零瑕疵」；56.1「回看：她第一次出现在第几秒？」 */

const MIRROR_C: Pt = [540, 780];
/** his reflection (mirrored: the birthmark on the left) */
const REF5: Pt = [540, 800];
const REF5_S = 0.62;
const DRAW_AT: Pt = [392, 888];

/** the black cat in her drawing — facing us this time */
function blackCatFace(c: Ctx, x: number, y: number, s: number, seed: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const sd of [-1, 1]) {
    poly(c, [[sd * 30, -8], [sd * 25, -40], [sd * 6, -24]], seed + sd, 0.4);
    paint(c, "#1c1c22", C.ink, 2.8);
  }
  oval(c, 0, 4, 33, 28, seed + 3, 0.6);
  paint(c, "#1c1c22", C.ink, 2.8);
  for (const sd of [-1, 1]) {
    oval(c, sd * 12, 0, 6, 7, seed + 4 + sd, 0.3);
    paint(c, "#f5d64a", null);
    oval(c, sd * 12, 1, 2, 5, seed + 6 + sd, 0.2);
    paint(c, "#1c1c22", null);
    inkLine(c, [[sd * 22, 11], [sd * 36, 8]], seed + 8 + sd, 1.4, "#e8e8e8", 0.2);
  }
  poly(c, [[-3, 10], [3, 10], [0, 13]], seed + 10, 0.2);
  paint(c, "#ff8fab", null);
  c.restore();
}

/** her drawing: the white cat and the black cat side by side, a little heart over them (a scrap of sketch paper) */
function catsDrawing(c: Ctx, x: number, y: number, s: number, rot: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  shaded(c, () => rbox(c, -64, -50, 128, 100, 4, 9701, 0.6), "#fbf6ea", () => {
    c.fillStyle = "rgba(160,130,90,0.12)";
    c.fillRect(-64, 20, 128, 30);
  }, "rgba(70,62,52,0.6)", 2);
  whiteCatFace(c, -24, 6, 0.42, 9702);
  blackCatFace(c, 24, 8, 0.42, 9703);
  penHeart(c, 0, -30, 16, 1, 9704);
  tape(c, -44, -48, 40, 12, -0.5, 9705);
  tape(c, 44, -48, 40, 12, 0.5, 9706);
  c.restore();
}

/** the reflection: his bathroom behind him, his face — now smiling at itself */
function reflection5(c: Ctx, abs: number) {
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  c.fillStyle = vgrad(c, gy0, gy1, [[0, "#5d707b"], [1, "#344149"]]);
  c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  c.strokeStyle = "rgba(30,44,52,0.35)";
  c.lineWidth = 1.6;
  for (let y = gy0 + 30; y < gy1; y += 34) {
    c.beginPath();
    c.moveTo(gx0, y);
    c.lineTo(gx1, y);
    c.stroke();
  }
  for (let x = gx0 + 20; x < gx1; x += 34) {
    c.beginPath();
    c.moveTo(x, gy0);
    c.lineTo(x, gy1);
    c.stroke();
  }
  // the warm hallway light through the door behind him
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, gx1 - 20, 760, 220, "rgba(255,170,90,0.25)");
  c.restore();
  const t = abs - EV.rip;
  const pose: KidPose = t < 0.45
    ? { body: "bust", eyes: "open", brows: "up", mouth: "o", look: [0, 0], arms: "down", headY: -4 }
    : { body: "bust", eyes: abs > EV.hearts[0] - 0.1 && abs < EV.hearts[2] + 0.3 ? "happy" : "open", brows: "flat", mouth: "smile", look: [0, 0], blush: 0.3, arms: "down", tilt: 0.03 };
  c.save();
  c.translate(REF5[0], 0);
  c.scale(-1, 1);
  c.translate(-REF5[0], 0);
  drawKid(c, REF5[0], REF5[1], REF5_S, pose);
  birthmark(c, REF5[0], REF5[1], REF5_S, pose);
  // "I love my nose, eyes and…": the hearts from the first night — and this time one on the mark
  c.translate(REF5[0], REF5[1]);
  c.scale(REF5_S, REF5_S);
  c.rotate(pose.tilt ?? 0);
  const [hn, he, hm] = EV.hearts;
  const bob = (at: number, seed: number) => Math.sin((abs - at) * 6 + seed) * 3;
  penHeart(c, -30, 80 + bob(hn, 1), 40, phase(abs, hn, hn + 0.22), 9711);
  penHeart(c, -104, 12 + bob(he, 2), 38, phase(abs, he, he + 0.22), 9712);
  penHeart(c, 100, 4 + bob(he, 3), 38, phase(abs, he + 0.06, he + 0.28), 9713);
  penHeart(c, MARK_AT[0], MARK_AT[1] + bob(hm, 4), 58, phase(abs, hm, hm + 0.26), 9714, "#ff5d7e");
  c.restore();
  const g = c.createLinearGradient(gx0, gy0, gx0 + 300, gy1);
  g.addColorStop(0.3, "rgba(255,255,255,0)");
  g.addColorStop(0.46, "rgba(255,255,255,0.12)");
  g.addColorStop(0.6, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
}

/** the paper on the mirror: as it was left in act 2; on "mirrors" each sheet tears away and flies */
function papers(c: Ctx, abs: number) {
  const k = easeIn(phase(abs, EV.rip - 0.03, EV.rip + 0.42));
  const sheets: { x: number; y: number; w: number; h: number; rot: number; seed: number; fly: Pt; spin: number }[] = [
    { x: 336, y: 598, w: 142, h: 362, rot: 0, seed: 7330, fly: [-700, -260], spin: -1.4 },
    { x: 462, y: 602, w: 284, h: 192, rot: -0.012, seed: 7300, fly: [620, -520], spin: 1.1 },
    { x: 458, y: 772, w: 288, h: 186, rot: 0.01, seed: 7310, fly: [700, 380], spin: 0.9 },
  ];
  if (k >= 1) return;
  for (const sh of sheets) {
    const cx = sh.x + sh.w / 2,
      cy = sh.y + sh.h / 2;
    c.save();
    c.globalAlpha *= 1 - k * k;
    c.translate(cx + sh.fly[0] * k, cy + sh.fly[1] * k);
    c.rotate(sh.spin * k);
    c.scale(1 - 0.3 * k, 1 - 0.3 * k);
    newspaper(c, -sh.w / 2, -sh.h / 2, sh.w, sh.h, sh.rot, sh.seed);
    c.restore();
  }
  if (k <= 0) {
    for (const [x, y, w, h, r, sd] of [[478, 612, 62, 16, -0.62, 7320], [736, 612, 60, 16, 0.55, 7321], [600, 786, 130, 17, 0.02, 7322], [738, 944, 62, 16, -0.5, 7323], [352, 612, 70, 17, -0.5, 7340], [352, 946, 70, 17, 0.45, 7341]] as [number, number, number, number, number, number][])
      tape(c, x, y, w, h, r, sd);
  }
  // scraps of paper in the air
  if (k > 0) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 80 + 420 * k;
      c.save();
      c.globalAlpha *= 1 - k;
      c.translate(540 + Math.cos(a) * r, 780 + Math.sin(a) * r * 0.7);
      c.rotate(a * 3 + k * 6);
      c.fillStyle = "#e6dfca";
      c.fillRect(-10, -6, 20, 12);
      c.restore();
    }
  }
}

/** the double tap: two rings and a big heart in the middle of the picture */
function doubleTap(ctx: Ctx, abs: number, x: number, y: number) {
  const t = abs - EV.tap;
  if (t < 0 || t > 1.2) return;
  for (const t0 of [0, 0.14]) {
    const p = clamp((t - t0) / 0.35);
    if (p <= 0 || p >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, 40 + 120 * p, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const k = backOut(clamp((t - 0.12) / 0.25));
  ctx.save();
  ctx.globalAlpha = 1 - clamp((t - 0.8) / 0.4);
  ctx.translate(x, y - 30 * clamp((t - 0.6) / 0.6));
  ctx.rotate(-0.12);
  ctx.scale(k * 2.2, k * 2.2);
  blob(ctx, [[0, 30], [-40, -6], [-62, -2], [-62, 34], [0, 86], [62, 34], [62, -2], [40, -6]].map(([px, py]) => [px, py - 30] as Pt), 9720, 0.6);
  paint(ctx, "#ff3b5c", C.ink, 3);
  oval(ctx, -30, -18, 12, 8, 9721, 0.4, -0.5);
  paint(ctx, "rgba(255,255,255,0.8)", null);
  ctx.restore();
}

/** 回看 card under the like line */
function askCard(ctx: Ctx, abs: number, y: number) {
  const k = backOut(phase(abs, EV.ask, EV.ask + 0.3));
  if (k <= 0) return;
  const line1 = "回看：她第一次出现在第几秒？";
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.scale(k, k);
  ctx.fillStyle = "rgba(12,12,20,0.66)";
  rr(ctx, -330, -50, 660, 112, 24);
  ctx.fill();
  text(ctx, line1, 0, -14, { size: 44, font: F.cn, fill: "#fff" });
  text(ctx, "答案打在评论区", -20, 34, { size: 34, font: F.cn, fill: "#ffd166" });
  // a drawn arrow, pointing down to the comments
  inkLine(ctx, [[150, 20], [150, 50]], 9730, 5, "#ffd166", 0.3);
  inkLine(ctx, [[138, 40], [150, 54], [162, 40]], 9731, 5, "#ffd166", 0.3);
  ctx.restore();
}

function shotMirror(ctx: Ctx, abs: number) {
  const push = easeInOut(phase(abs, EV.close, EV.close + 0.7));
  const z = 1.7 + 0.08 * easeInOut(phase(abs, EV.act4End, EV.rip)) + 0.55 * push;
  const jolt = abs > EV.rip ? Math.exp(-(abs - EV.rip) * 9) : 0;
  const [hx, hy, hr] = handheld(abs, 3, 91);
  const pivot: Pt = [MIRROR_C[0], MIRROR_C[1] + (REF5[1] - MIRROR_C[1] + 20) * push];
  ctx.save();
  camera(ctx, pivot[0], pivot[1], z, hr, 540 - pivot[0] + hx + Math.sin(abs * 60) * 6 * jolt, 880 - pivot[1] + hy);
  bathroom(ctx, abs);
  // the glass: the reflection under whatever paper is still on it
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  c_clip(ctx, gx0, gy0, gx1, gy1, () => reflection5(ctx, abs));
  papers(ctx, abs);
  // her drawing, taped to the corner of the mirror
  const dk = backOut(phase(abs, EV.drawing, EV.drawing + 0.25));
  if (dk > 0) catsDrawing(ctx, DRAW_AT[0] - 60 * (1 - dk), DRAW_AT[1] + 80 * (1 - dk), 0.9, -0.06);
  // his hands: on the paper before the rip, then pressing her drawing on
  const grabK = smooth(phase(abs, EV.grab - 0.25, EV.grab));
  const away = smooth(phase(abs, EV.rip + 0.05, EV.rip + 0.3));
  if (grabK > 0 && away < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - away;
    sleeveHand(ctx, [180 - 200 * away, 1160], [352 - 200 * away, 640], 30, 9740);
    sleeveHand(ctx, [960 + 200 * away, 1160], [748 + 200 * away, 700], 30, 9741);
    ctx.restore();
  }
  const pat = phase(abs, EV.drawing - 0.1, EV.drawing + 0.5);
  if (pat > 0 && pat < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - smooth(phase(abs, EV.drawing + 0.3, EV.drawing + 0.5));
    sleeveHand(ctx, [240, 1240], [DRAW_AT[0] + 10, DRAW_AT[1] + 10 - 6 * Math.sin(Math.PI * clamp(pat * 2))], 30, 9742);
    ctx.restore();
  }
  bathDoorLight(ctx);
  bathLight(ctx, abs);
  motes(ctx, abs, 540, 780, 300, 260, 16, 93, "255,236,210", 0.6, 2.2);
  ctx.restore();
}

/** the end, over the lens effects: like, and a question to answer with one number */
function endPrompts(ctx: Ctx, abs: number) {
  doubleTap(ctx, abs, 770, 1080);
  caption(ctx, abs, EV.like, END + 1, [["点赞的人，", 60, F.cn, "#fff"]], [["在喜欢的人眼里都是", 60, F.cn, "#fff"], ["零瑕疵", 72, F.cn, "#ffd166"]], 360);
  askCard(ctx, abs, 540);
}

/** clip to the glass and draw */
function c_clip(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  draw();
  ctx.restore();
}

function vignette(ctx: Ctx, a: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a.toFixed(2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
}

export function createScene(options: SceneOptions) {
  return designScene(options, EV.act4End, (ctx, abs) => {
    shotMirror(ctx, abs);
    bloom(ctx, 0.22, 24, 2.6);
    vignette(ctx, 0.34);
    if (abs > EV.rip) flash(ctx, 0.35 * Math.exp(-(abs - EV.rip) * 9), "#fff6e6");
    endPrompts(ctx, abs);
  });
}
