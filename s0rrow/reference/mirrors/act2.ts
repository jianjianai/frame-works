import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blob, bloom, camera, designScene, easeIn, easeInOut, easeOut, figureMask, glow, handheld, inkLine, motes, onFigure, oval, paint, poly, rimLight, shaded, shake, text, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { coffeeTable, livingBokeh, livingLight, livingRoom } from "@materials/s0rrow/code/mirrors/living";
import { aimPhone, chatScreen, phoneBack } from "@materials/s0rrow/code/mirrors/phoneui";
import { BATH, bathDoorLight, bathLight, bathroom } from "@materials/s0rrow/code/mirrors/sets";
import { Disguise, birthmark, disguise, newspaper, sleeveHand, tape } from "@materials/s0rrow/code/mirrors/story";
import { EV } from "./timeline";
import { hisChatView, phoneAt } from "./night";

/** 第二幕（16.29 – 24.417，B 段 "Ooh I like the feeling of my doubts / … couch / oh well ×3"）
 *  16.29  手机（接着第一幕最后的构图）：照片发出去了。「对方正在输入...」亮、灭、又亮——17.56 她回
 *         「明天放学，天台见？」（一个字没提照片；她怎么知道他在哪上学？）镜头推近这句话。
 *  18.576 客厅全景（夜里，台灯，窗外月亮，沙发上方糊着报纸的圆镜子）：他坐在沙发上盯着手机，头上冒「!?」；
 *         19.34「live」一头扎进毯子里乱蹬；19.85 一夜过去：窗外由夜到清晨，闹钟的针飞转，他睁着眼没睡；
 *         20.35 闹钟响，20.61 他坐起来，一脸没睡。
 *  20.861 浴室那面镜子左边的那一条（回扣第一帧，同样的构图）：三个「oh WELL」各掀开一次报纸——遮瑕膏（盖不住）
 *         → 口罩（胎记从上面露出来）→ 帽子 + 口罩 + 墨镜（全盖住了，他点点头）。 */

// ================================================================ 16.29 – 18.576 her reply
function shotReply(ctx: Ctx, abs: number) {
  // the framing act 1 ended on; the camera leans in while she types and eases back when it stops, then in on her reply
  const lean = (w: readonly [number, number]) => smooth(phase(abs, w[0], w[0] + 0.2)) * (1 - smooth(phase(abs, w[1], w[1] + 0.25)));
  const l = lean(EV.typing[0]) + lean(EV.typing[1]);
  const push = easeInOut(phase(abs, EV.reply + 0.1, EV.couch));
  const nudge = backOut(phase(abs, EV.reply, EV.reply + 0.16)) * (1 - smooth(phase(abs, EV.reply + 0.2, EV.reply + 0.6)));
  const s = 1.04 + 0.025 * l + 0.12 * push + 0.02 * nudge;
  const [cx, cy] = aimPhone(300, 620 + 12 * push, 540, 885 + 10 * push, s);
  const [hx, hy, hr] = handheld(abs, 2.5, 49);
  livingBokeh(ctx, hx * 0.4, hy * 0.4);
  phoneAt(ctx, cx + hx, cy + hy, s, hr, (c) => chatScreen(c, abs, hisChatView(abs)));
}

// ================================================================ 18.576 – 20.861 the couch, the night
/** him on the couch (design units of the living room set) */
const SIT: Pt = [520, 852];
const SIT_S = 0.62;
/** his head on the pillow when he lies under the blanket */
const LIE: Pt = [298, 1040];

/** the phone in his hands, back to us, with simple round hands (head units, drawn in drawKid's grip) */
function phoneGrip(c: Ctx) {
  phoneBack(c, 0, 332, 122, 236, 0.03, false);
  for (const sd of [-1, 1]) {
    shaded(c, () => oval(c, sd * 60, 354, 30, 28, 8950 + sd, 0.8), C.skin, () => {
      oval(c, sd * 60 + 13, 368, 24, 20, 8952 + sd, 0.6);
      paint(c, "rgba(196,150,96,0.38)", null);
    }, C.ink, 5);
  }
}

/** the striped blanket over him on the couch: `head` true leaves his face out on the pillow; `kick` bounces his feet */
function blanket(ctx: Ctx, abs: number, kick: number, head: boolean) {
  const k = Math.abs(Math.sin(abs * 15)) * kick,
    k2 = Math.abs(Math.sin(abs * 15 + 1.7)) * kick;
  const feet: Pt[] = [[420, 1006], [490, 1018], [570, 1014], [640, 1022], [698, 1030 - 24 * k], [744, 1018 - 30 * k2], [792, 1044 - 12 * k], [816, 1114]];
  // pulled over his head (a lump on the pillow), or tucked under his chin
  const pts: Pt[] = head ? [[362, 1114], [356, 1046], [380, 998], ...feet] : [[222, 1114], [230, 1058], [258, 996], [324, 978], ...feet];
  shaded(ctx, () => blob(ctx, pts, 8901, 2), "#e9dfcc", () => {
    for (let i = 0; i < 7; i++) inkLine(ctx, [[262 + i * 86, 980], [250 + i * 86, 1120]], 8902 + i, 10, "rgba(110,140,190,0.5)");
    const g = ctx.createLinearGradient(0, 990, 0, 1118);
    g.addColorStop(0, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(60,50,40,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(200, 960, 640, 170);
  }, C.ink, 5);
}

/** the blanket round his shoulders when he sits up in the morning */
function blanketShawl(ctx: Ctx) {
  shaded(ctx, () => blob(ctx, [[392, 960], [450, 940], [520, 952], [590, 940], [648, 960], [676, 1040], [690, 1114], [350, 1114], [364, 1040]], 8920, 2), "#e9dfcc", () => {
    for (let i = 0; i < 5; i++) inkLine(ctx, [[386 + i * 70, 960], [372 + i * 74, 1116]], 8921 + i, 10, "rgba(110,140,190,0.5)");
  }, C.ink, 5);
}

function shotCouch(ctx: Ctx, abs: number) {
  const day = smooth(phase(abs, EV.night2, EV.alarm));
  const ring = abs >= EV.alarm ? 1 : 0;
  const clock = 23.85 + (30.5 - 23.85) * easeInOut(phase(abs, EV.night2, EV.alarm));
  const locked = abs >= EV.night2 && abs < EV.alarm; // a time-lapse: the camera holds still
  const z = 1.12 + 0.05 * easeInOut(phase(abs, EV.couch, EV.night2)) + (abs >= EV.alarm ? 0.06 * easeOut(phase(abs, EV.alarm, EV.mirror)) : 0);
  const [hx, hy, hr] = locked ? [0, 0, 0] : handheld(abs, 3, 53);
  const [jx, jy] = shake(abs, abs >= EV.dive && abs < EV.dive + 0.2 ? 7 * (1 - phase(abs, EV.dive, EV.dive + 0.2)) : 0, 9);
  ctx.save();
  camera(ctx, 600, 1000, z, hr, -60 + hx + jx, -20 + hy + jy);
  livingRoom(ctx, abs, { clock, day, ring });
  let figure: ((c: Ctx) => void) | null = null;
  if (abs < EV.dive) {
    // he stares at her reply
    const pose: KidPose = { body: "full", legs: "sit", arms: "phone", shapeL: "hidden", shapeR: "hidden", eyes: "wide", brows: "up", mouth: "o", look: [0, 0.75], grip: phoneGrip, headY: -6 * backOut(phase(abs, EV.couch + 0.05, EV.couch + 0.25)) };
    figure = (c) => {
      drawKid(c, SIT[0], SIT[1], SIT_S, pose);
      birthmark(c, SIT[0], SIT[1], SIT_S, pose);
    };
  } else if (abs < EV.night2) {
    figure = (c) => blanket(c, abs, smooth(phase(abs, EV.dive + 0.1, EV.dive + 0.2)), false);
  } else if (abs < EV.sitUp) {
    // the night goes by: on the pillow, eyes open; the alarm makes him jump
    const jolt = abs >= EV.alarm ? backOut(phase(abs, EV.alarm, EV.alarm + 0.12)) : 0;
    const pose: KidPose = { body: "head", eyes: jolt > 0 ? "wide" : "tired", brows: jolt > 0 ? "up" : "flat", mouth: jolt > 0 ? "o" : "flat", look: [0, 0] };
    figure = (c) => {
      c.save();
      c.translate(LIE[0], LIE[1] - 14 * jolt);
      c.rotate(-Math.PI / 2 + 0.25 * jolt);
      drawKid(c, 0, 0, SIT_S, pose);
      birthmark(c, 0, 0, SIT_S, pose);
      c.restore();
      blanket(c, abs, 0, true);
    };
  } else {
    // up, no sleep
    const pose: KidPose = { body: "full", legs: "sit", arms: "pockets", eyes: "tired", brows: "sad", mouth: "flat", look: [0.2, 0.3], tilt: 0.08, headY: 10 };
    figure = (c) => {
      drawKid(c, SIT[0], SIT[1], SIT_S, pose);
      birthmark(c, SIT[0], SIT[1], SIT_S, pose);
      blanketShawl(c);
    };
  }
  figure(ctx);
  // the lamp and the window light him too (the table in front cuts his legs out of the light)
  const m = figureMask(ctx, figure, "couchFig");
  const tableCut = (c: Ctx) => c.fillRect(150, 1160, 740, 300);
  onFigure(ctx, m, (c) => {
    c.fillStyle = `rgba(14,16,40,${(0.3 * (1 - day)).toFixed(3)})`;
    c.fillRect(-500, -500, W + 1000, H + 1000);
  });
  rimLight(ctx, m, -1, -0.3, 5, "rgb(255,198,140)", 0.35 * (1 - 0.5 * day), "lighter", 6, tableCut);
  rimLight(ctx, m, 1, -0.4, 5, day > 0.5 ? "rgb(255,220,190)" : "rgb(180,205,255)", 0.35, "lighter", 6, tableCut);
  coffeeTable(ctx);
  if (abs < EV.dive) {
    // the screen's cold light on his face
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, SIT[0], SIT[1] + 120, 170, "rgba(150,185,255,0.22)");
    ctx.restore();
  }
  livingLight(ctx, abs, day);
  motes(ctx, abs, 820, 760, 300, 360, 14, 91, day > 0.5 ? "255,226,190" : "190,210,255", 0.5 + 0.4 * day, 2.2);
  ctx.restore();
  // comic marks in screen space
  if (abs < EV.dive) {
    const k = backOut(phase(abs, EV.couch + 0.08, EV.couch + 0.26));
    if (k > 0) {
      ctx.save();
      ctx.translate(650, 560);
      ctx.rotate(0.14);
      ctx.scale(k, k);
      text(ctx, "!?", 0, 0, { size: 110, font: F.marker, fill: "#ffd166", stroke: C.ink, lw: 14 });
      ctx.restore();
    }
  } else if (abs < EV.dive + 0.25) {
    // the dive: speed lines and a puff
    const p = phase(abs, EV.dive, EV.dive + 0.25);
    ctx.save();
    ctx.globalAlpha = 1 - p;
    for (let i = 0; i < 7; i++) inkLine(ctx, [[180 + i * 40, 760 - i * 22 + p * 60], [260 + i * 46, 900 - i * 10 + p * 60]], 8930 + i, 5, "#fff");
    ctx.restore();
  }
  if (abs >= EV.alarm && abs < EV.mirror) {
    // 铃铃 around the clock (screen space: the clock is at design 968,1100 → on screen ~(970,1080))
    const p = (abs - EV.alarm) * 6;
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.translate(900 + i * 120 + Math.sin(p + i) * 6, 960 - i * 40);
      ctx.rotate((i ? 0.25 : -0.25) + Math.sin(abs * 40 + i) * 0.1);
      text(ctx, "铃", 0, 0, { size: 60, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10 });
      ctx.restore();
    }
  }
}

// ================================================================ 20.861 – 24.417 three tries at the mirror
/** the strip of glass from the first frame, and his reflection in it (mirrored: the birthmark on the left) */
const REF: Pt = [407, 770];
const REF_S = 0.5;
/** the last sheet of newspaper (left side of the mirror) and how far down it can be peeled */
const STRIP = { x0: 336, y0: 598, x1: 478, y1: 960 };
const OPEN_Y = 884;
const DISGUISES: Disguise[] = [{ concealer: 1 }, { mask: 1 }, { cap: 1, mask: 1, shades: 1 }];

/** which try is showing (−1 before the first) */
function tryIndex(abs: number) {
  let i = -1;
  EV.peeks.forEach((t, k) => {
    if (abs >= t - 0.07) i = k;
  });
  return i;
}
/** how far the sheet is peeled down (the fold line's y) */
function foldY(abs: number) {
  let y = STRIP.y0;
  EV.peeks.forEach((t, i) => {
    const open = easeOut(phase(abs, t - 0.07, t + 0.07));
    const close = i < 2 ? easeIn(phase(abs, t + 0.66, t + 0.78)) : 0;
    y = Math.max(y, STRIP.y0 + (OPEN_Y - STRIP.y0) * open * (1 - close));
  });
  return y;
}
function peekPose(abs: number, i: number): KidPose {
  const t = abs - EV.peeks[i];
  if (i === 0)
    return t < 0.32
      ? { body: "bust", eyes: "open", brows: "up", mouth: "flat", look: [0, 0.05], arms: "down" }
      : { body: "bust", eyes: "sad", brows: "sad", mouth: "wobble", look: [0.5, 0.35], tilt: -0.06, arms: "down" };
  if (i === 1) return { body: "bust", eyes: t < 0.25 ? "open" : "sad", brows: "worried", mouth: "flat", look: [0.5, 0.3], tilt: 0.04, arms: "down" };
  const nod = Math.sin(Math.PI * clamp((abs - EV.peeks[2] - 0.45) / 0.3)) * 10;
  return { body: "bust", eyes: "open", brows: "flat", mouth: "flat", headY: nod, arms: "down" };
}

function stripReflection(c: Ctx, abs: number, i: number) {
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  c.fillStyle = vgrad(c, gy0, gy1, [[0, "#566873"], [1, "#2f3b42"]]);
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
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, gx0 - 10, 800, 200, "rgba(255,160,80,0.2)");
  c.restore();
  if (i < 0) return;
  const pose = peekPose(abs, i);
  const d = DISGUISES[i];
  c.save();
  c.translate(REF[0], 0);
  c.scale(-1, 1);
  c.translate(-REF[0], 0);
  drawKid(c, REF[0], REF[1], REF_S, pose);
  birthmark(c, REF[0], REF[1], REF_S, pose, i === 2 ? 0 : 1);
  disguise(c, REF[0], REF[1], REF_S, pose, d);
  c.restore();
  if (i === 2 && abs > EV.peeks[2] + 0.5) {
    // a drop of sweat at his temple
    const k = smooth(phase(abs, EV.peeks[2] + 0.5, EV.peeks[2] + 0.65));
    c.save();
    c.translate(REF[0] - 64, REF[1] - 40 + 8 * phase(abs, EV.peeks[2] + 0.65, EV.act2End));
    c.scale(k * 0.5, k * 0.5);
    blob(c, [[0, -26], [12, -2], [10, 12], [0, 18], [-10, 12], [-12, -2]], 8960, 0.5);
    paint(c, "#bfe6ff", C.ink, 3.5);
    c.restore();
  }
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 330, 760, 170, "rgba(210,232,255,0.18)");
  c.restore();
}

function mirrorStrip(c: Ctx, abs: number) {
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  const yf = foldY(abs);
  const i = tryIndex(abs);
  const { x0, y0, x1 } = STRIP;
  // the glass the peel has opened
  if (yf > y0 + 2) {
    c.save();
    c.beginPath();
    c.rect(gx0, gy0, x1 - gx0, Math.min(yf, gy1) - gy0);
    c.clip();
    stripReflection(c, abs, i);
    const g = c.createLinearGradient(gx0, gy0, gx0 + 240, gy1);
    g.addColorStop(0.3, "rgba(255,255,255,0)");
    g.addColorStop(0.46, "rgba(255,255,255,0.14)");
    g.addColorStop(0.6, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    c.restore();
  }
  // the sheets on the right, as in the first shot
  newspaper(c, 462, 602, 284, 192, -0.012, 7300);
  newspaper(c, 458, 772, 288, 186, 0.01, 7310);
  tape(c, 478, 612, 62, 16, -0.62, 7320);
  tape(c, 736, 612, 60, 16, 0.55, 7321);
  tape(c, 600, 786, 130, 17, 0.02, 7322);
  tape(c, 738, 944, 62, 16, -0.5, 7323);
  // the last sheet: peeled down from the top, rolled up on itself; below the roll it is still flat on the glass
  const len = yf - y0;
  const rh = len > 2 ? 14 + Math.min(14, len * 0.05) : 0;
  c.save();
  c.beginPath();
  c.rect(x0 - 20, yf + rh * 0.3, x1 - x0 + 40, 600);
  c.clip();
  newspaper(c, x0, y0, x1 - x0, STRIP.y1 - y0, 0, 7330);
  c.restore();
  tape(c, x0 + 16, 946, 70, 17, 0.45, 7341);
  if (len > 2) {
    // the roll: the back of the paper, shaded like a little cylinder, its shadow on the glass
    c.fillStyle = "rgba(10,14,20,0.3)";
    c.fillRect(x0, yf + rh * 0.45, x1 - x0, 9);
    const g = c.createLinearGradient(0, yf - rh / 2, 0, yf + rh / 2);
    g.addColorStop(0, "#f4eedd");
    g.addColorStop(0.55, "#d8d0ba");
    g.addColorStop(1, "#a39a84");
    poly(c, [[x0 - 4, yf - rh / 2], [x1 + 2, yf - rh / 2], [x1 + 2, yf + rh / 2], [x0 - 4, yf + rh / 2]], 7365, 0.5);
    paint(c, g, "rgba(70,62,52,0.75)", 2.4);
    oval(c, x1 + 2, yf, rh * 0.42, rh * 0.5, 7366, 0.3);
    paint(c, "#ece5d2", "rgba(70,62,52,0.75)", 2);
    inkLine(c, [[x1 + 2, yf - rh * 0.25], [x1 + 2 + rh * 0.22, yf], [x1 + 2, yf + rh * 0.2]], 7367, 1.4, "rgba(70,62,52,0.6)", 0.2);
    // the tape that held its top edge, rolled up with it
    tape(c, x0 + 20, yf - 1, 46, 13, -0.25, 7340);
    // his hand holding the roll down
    sleeveHand(c, [x1 + 330, yf + 250], [x1 + 8, yf + 4], 26, 7350);
  }
}

function shotMirror(ctx: Ctx, abs: number) {
  const i = tryIndex(abs);
  const lean = i >= 0 ? 0.05 * backOut(phase(abs, EV.peeks[i], EV.peeks[i] + 0.2)) * (i < 2 ? 1 - smooth(phase(abs, EV.peeks[i] + 0.6, EV.peeks[i] + 0.9)) : 1) : 0;
  const z = 2.6 + 0.06 * easeInOut(phase(abs, EV.mirror, EV.act2End)) + lean;
  const [hx, hy, hr] = handheld(abs, 3, 11);
  ctx.save();
  camera(ctx, REF[0], 790, z, hr, 540 - REF[0] + hx, 880 - 790 + hy);
  bathroom(ctx, abs);
  mirrorStrip(ctx, abs);
  bathDoorLight(ctx);
  bathLight(ctx, abs);
  motes(ctx, abs, 420, 760, 160, 160, 10, 63, "220,236,255", 0.5, 1.8);
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
  return designScene(options, EV.actEnd, (ctx, abs) => {
    if (abs < EV.couch) shotReply(ctx, abs);
    else if (abs < EV.mirror) shotCouch(ctx, abs);
    else shotMirror(ctx, abs);
    // after the shot chain: the lens
    bloom(ctx, abs < EV.couch ? 0.2 : 0.22, 24, 2.6);
    vignette(ctx, abs >= EV.mirror ? 0.42 : 0.36);
  });
}
