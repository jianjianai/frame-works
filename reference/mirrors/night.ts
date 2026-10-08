import { clamp, phase, smooth } from "../../../src/engine/math";
import { BEAT, C, Ctx, H, Pt, W, backOut, camera, devScale, easeIn, easeInOut, easeOut, figureMask, filtered, flash, glow, handheld, onFigure, oval, paint, rimLight, shaded, shake, sinceBeat } from "./lib/draw";
import { KidPose, drawKid } from "./lib/kid";
import { livingNight, livingBokeh, livingRoom } from "./lib/living";
import { ChatItem, ChatView, FingerPos, HANG_UP, SELFIE_MARK, SEND_AT, SH, SLIDER, aimPhone, beautyScreen, callScreen, chatScreen, phone, phoneBack, selfie, sendDialog, tapRing, touchDot } from "./lib/phoneui";
import { birthmark } from "./lib/story";
import { EV } from "./lib/timeline";

/** 第一幕后半（6.638 – 16.29）：夜里，他的手机。act1.ts 的镜头链在 EV.next 之后调用 nightShots。
 *  6.638  手机近景（背景是失焦的客厅：左边台灯的暖光、右边窗外的冷光）：和「白猫」的聊天——她的头像是白猫，他的是
 *         背对镜头、看不见脸的黑猫；上面的旧消息「明天要交数学作业哦」（回看彩蛋：她知道他的课表）。标题先闪
 *         「对方正在输入...」，「girls」7.15 她发来「今天也辛苦啦」，7.65 一个白猫表情。
 *  8.162  "She calls up my phone"：视频通话从下面滑上来——前置摄像头里是他自己的脸（家里唯一盖不住的镜子）。镜头
 *         推近他的脸：先愣住，再别开眼、闭眼；手机每拍震一下。9.94 镜头退开，露出按钮。
 *  10.19  四个 "ringing"（八分音符）：挂断——又打来——挂断……聊天里叠出四条「已拒绝」；11.21 「别不理我嘛」，
 *         11.72 「那发张照片嘛」。
 *  12.734 "saw"：美颜 App。胎记被黄框框住、标着「瑕疵」，祛斑一路拉到 100，胎记淡掉；13.24 "zero"：
 *         「瑕疵：1」翻成「瑕疵：0」（片名），闪光、亮晶晶。
 *  14.258 他的脸（手机从下面照着，胎记还在），看着屏幕，最后闭上眼。
 *  15.274 「发送给：白猫」，拇指按在「发送」上没松；16.04 松手——照片落进聊天里。 */

const D = EV.declines;
const pop = (abs: number, t: number, d = 0.18) => clamp((abs - t) / d);
/** when each 「已拒绝」 lands in the chat */
const declinedAt = (i: number) => D[i] + (i ? 0.13 : 0.08);

/** his chat with 白猫 as it stands at `abs` (things appear when they arrive). Act 2 carries on from here. */
export function hisChat(abs: number): ChatItem[] {
  const items: ChatItem[] = [
    { t: "time", text: "22:16" },
    { t: "msg", text: "明天要交数学作业哦" },
    { t: "msg", me: true, text: "知道啦" },
    { t: "time", text: "23:47" },
  ];
  const add = (t: number, it: ChatItem) => {
    if (abs >= t) items.push(it);
  };
  add(EV.herMsg, { t: "msg", text: "今天也辛苦啦", pop: pop(abs, EV.herMsg) });
  add(EV.sticker, { t: "sticker", pop: pop(abs, EV.sticker) });
  for (let i = 0; i < 4; i++) add(declinedAt(i), { t: "call", pop: pop(abs, declinedAt(i), 0.12) });
  add(EV.dontLeave, { t: "msg", text: "别不理我嘛", pop: pop(abs, EV.dontLeave) });
  add(EV.askPhoto, { t: "msg", text: "那发张照片嘛", pop: pop(abs, EV.askPhoto) });
  add(EV.sent, { t: "photo", me: true, pop: pop(abs, EV.sent, 0.22), draw: (c, w, h) => selfie(c, w, h, 0, 1) });
  // act 2: she doesn't say a word about the photo
  add(EV.reply, { t: "msg", text: "明天放学，天台见？", pop: pop(abs, EV.reply) });
  return items;
}
const inWin = (abs: number, w: readonly [number, number]) => abs >= w[0] && abs < w[1];
export function hisChatView(abs: number): ChatView {
  return {
    title: "白猫",
    time: abs < EV.call + 1 ? "23:47" : "23:48",
    items: hisChat(abs),
    keyboard: true,
    typing: inWin(abs, [EV.herMsg - 0.42, EV.herMsg]) || inWin(abs, [EV.dontLeave + 0.25, EV.askPhoto]) || EV.typing.some((w) => inWin(abs, w)),
  };
}

export function phoneAt(ctx: Ctx, cx: number, cy: number, s: number, rot: number, screen: (c: Ctx) => void) {
  glow(ctx, cx, cy - 60 * s, 900 * s, "rgba(120,150,255,0.22)");
  phone(ctx, cx, cy, s, rot, screen);
}

// ================================================================ 6.638 – 12.734 one phone shot: chat → the call → hang up ×4
/** how far the call screen has slid up over the chat (1 = full screen) */
function callUp(abs: number) {
  let up = easeOut(phase(abs, EV.call, EV.call + 0.16)) * (1 - easeIn(phase(abs, D[0] + 0.02, D[0] + 0.1)));
  for (let i = 1; i < 4; i++) up = Math.max(up, easeOut(phase(abs, D[i], D[i] + 0.05)) * (1 - easeIn(phase(abs, D[i] + 0.09, D[i] + 0.15))));
  return up;
}
/** his thumb on 挂断: once just before the first "ringing", then right after each new call */
function hangUpThumb(abs: number): FingerPos | null {
  const taps: [number, number][] = [[D[0] - 0.07, D[0] + 0.03], [D[1] + 0.04, D[1] + 0.1], [D[2] + 0.04, D[2] + 0.1], [D[3] + 0.04, D[3] + 0.1]];
  for (const [t0, t1] of taps) {
    if (abs < t0 || abs > t1 + 0.05) continue;
    return { x: HANG_UP[0], y: HANG_UP[1], touch: abs < t1 ? clamp((abs - t0) / 0.03) : 1 - (abs - t1) / 0.05 };
  }
  return null;
}
/** his face in the front camera: frozen, then looking away, then eyes shut and turned away */
function callFace(abs: number): KidPose {
  const t = abs - EV.call;
  const base: KidPose = { body: "bust", arms: "down", shapeL: "hidden", shapeR: "hidden", brows: "worried", mouth: "bite" };
  if (abs >= D[0] - 0.1) return { ...base, eyes: "shut", turn: -0.36, tilt: -0.09, headY: 8 };
  if (t < 0.5) return { ...base, eyes: "wide", brows: "up", mouth: "o", look: [0, -0.05], headY: -6 * smooth(clamp(t / 0.12)) };
  if (t < 1.0) return { ...base, eyes: "sad", look: [-0.75, 0.6], turn: -0.12, tilt: -0.03 };
  const k = smooth(clamp((t - 1.0) / 0.25));
  return { ...base, eyes: "shut", turn: -0.3 * k, tilt: -0.07 * k, headY: 6 * k };
}

interface Aim {
  s: number;
  /** the screen point… */
  sx: number;
  sy: number;
  /** …that sits here in the frame */
  tx: number;
  ty: number;
}
const mixAim = (a: Aim, b: Aim, k: number): Aim => ({ s: a.s + (b.s - a.s) * k, sx: a.sx + (b.sx - a.sx) * k, sy: a.sy + (b.sy - a.sy) * k, tx: a.tx + (b.tx - a.tx) * k, ty: a.ty + (b.ty - a.ty) * k });
/** the phone's top just under the title pill (its status bar clear of it), the newest bubble above the lyrics */
const CHAT: Aim = { s: 1.0, sx: 300, sy: 620, tx: 540, ty: 885 };
const CHAT_IN: Aim = { s: 1.04, sx: 300, sy: 620, tx: 540, ty: 885 };
/** close on his face in the front camera (the buttons stay above the lyrics) */
const ON_FACE: Aim = { s: 1.3, sx: 300, sy: 560, tx: 540, ty: 760 };
/** the whole phone, buttons above the lyrics */
const WHOLE: Aim = { s: 1.0, sx: 300, sy: 640, tx: 540, ty: 905 };
const LAST_MSG: Aim = { s: 1.08, sx: 300, sy: 660, tx: 540, ty: 925 };
function phoneAim(abs: number): Aim {
  if (abs < EV.call) return mixAim(CHAT, CHAT_IN, easeInOut(phase(abs, EV.next, EV.call)));
  if (abs < EV.backOff) return mixAim(CHAT_IN, ON_FACE, easeInOut(phase(abs, EV.call + 0.1, EV.backOff - 0.2)));
  if (abs < EV.askPhoto) return mixAim(ON_FACE, WHOLE, easeInOut(phase(abs, EV.backOff, D[0])));
  return mixAim(WHOLE, LAST_MSG, easeInOut(phase(abs, EV.askPhoto, EV.app)));
}

function shotPhone(ctx: Ctx, abs: number) {
  const a = phoneAim(abs);
  // a message arriving: the camera leans in a little (backOut) and eases back
  const nudge = (t: number) => backOut(phase(abs, t, t + 0.16)) * (1 - smooth(phase(abs, t + 0.2, t + 0.7)));
  const s = a.s + 0.02 * (nudge(EV.herMsg) + nudge(EV.askPhoto));
  const [cx, cy] = aimPhone(a.sx, a.sy, a.tx, a.ty, s);
  // ringing: the phone buzzes on every beat; each new call buzzes once
  let buzz = abs >= EV.call && abs < D[0] ? Math.exp(-sinceBeat(abs) * 14) : 0;
  for (let i = 1; i < 4; i++) if (abs >= D[i] && abs < D[i] + 0.12) buzz = Math.max(buzz, 1 - (abs - D[i]) / 0.12);
  const [bx, by] = shake(abs, 6 * buzz, 17);
  const [hx, hy, hr] = handheld(abs, abs < EV.call ? 2 : 3, 41);
  livingBokeh(ctx, hx * 0.4, hy * 0.4);
  const view = hisChatView(abs);
  const up = callUp(abs);
  const thumb = hangUpThumb(abs);
  const ringK = abs > EV.call ? ((abs - EV.call) / BEAT) % 1 : 0;
  // 挂断 / 接听 labels: hidden while the camera is in close on his face
  const labels = abs < EV.call + 0.3 ? 1 - phase(abs, EV.call + 0.1, EV.call + 0.3) : phase(abs, EV.backOff, EV.backOff + 0.2);
  phoneAt(ctx, cx + hx + bx, cy + hy + by, s, hr + 0.004 * bx, (c) => {
    chatScreen(c, abs, view);
    if (up > 0.001) {
      c.save();
      c.translate(0, SH * (1 - up));
      callScreen(c, callFace(abs), view.time, ringK, labels);
      c.restore();
    }
    touchDot(c, thumb);
    // a quick ring on each hang-up, gone before the call screen has slid away
    if (up > 0.2)
      for (let i = 0; i < 4; i++) {
        const t0 = i ? D[i] + 0.06 : D[0] - 0.02;
        tapRing(c, HANG_UP[0], HANG_UP[1], phase(abs, t0, t0 + 0.12));
      }
  });
}

// ================================================================ 12.734 – 14.258 the beauty app: 瑕疵：0
/** little four-point sparkles where the birthmark was (app screen units) */
function sparkles(c: Ctx, t: number) {
  const mx = SELFIE_MARK[0],
    my = SELFIE_MARK[1] + 55;
  for (let i = 0; i < 3; i++) {
    const k = clamp((t - i * 0.08) / 0.55);
    if (k <= 0 || k >= 1) continue;
    const x = mx + [-34, 36, 4][i],
      y = my + [-30, 4, 44][i];
    const r = (16 + i * 7) * Math.sin(Math.PI * k);
    c.save();
    c.translate(x, y);
    c.fillStyle = "rgba(255,255,255,0.95)";
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(0, 0, r, 0);
    c.quadraticCurveTo(0, 0, 0, r);
    c.quadraticCurveTo(0, 0, -r, 0);
    c.quadraticCurveTo(0, 0, 0, -r);
    c.fill();
    c.restore();
  }
}

function shotBeauty(ctx: Ctx, abs: number) {
  const drag = easeInOut(phase(abs, EV.app + 0.1, EV.zero - 0.03));
  const zero = phase(abs, EV.zero, EV.zero + 0.32);
  const kick = abs >= EV.zero ? 0.05 * Math.exp(-(abs - EV.zero) * 6) : 0;
  const s = 1.1 + 0.05 * easeInOut(phase(abs, EV.app, EV.face4)) + kick;
  const [cx, cy] = aimPhone(300, 560, 540, 770, s);
  const [hx, hy, hr] = handheld(abs, 2, 43);
  livingBokeh(ctx, hx * 0.4, hy * 0.4);
  const knobX = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * drag;
  const t0 = EV.app + 0.04,
    t1 = EV.zero + 0.02;
  const thumb: FingerPos | null = abs >= t0 && abs < t1 ? { x: knobX, y: SLIDER.y, touch: Math.min(clamp((abs - t0) / 0.05), clamp((t1 - abs) / 0.05)) } : null;
  phoneAt(ctx, cx + hx, cy + hy, s, hr, (c) => {
    beautyScreen(c, { slider: drag, zero });
    touchDot(c, thumb);
    if (abs >= EV.zero) sparkles(c, abs - EV.zero);
  });
  if (abs >= EV.zero) flash(ctx, 0.3 * Math.exp(-(abs - EV.zero) * 10), "#fff6fb");
}

// ================================================================ 14.258 – 15.274 his face, lit by the phone
/** close: his face big, his body running out of the bottom of the frame, the phone (back to us) low in front of him;
 *  the papered round mirror behind his head. He looks down at the "瑕疵：0" him on the screen (its light in his eyes),
 *  swallows, and shuts his eyes: he's going to send it. */
const FACE7: Pt = [540, 760];
/** a simple round hand (用户：特写里的手用简单的圆就行) */
function roundHand(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  shaded(ctx, () => oval(ctx, x, y, r, r * 0.94, seed, 0.8), C.skin, () => {
    oval(ctx, x + r * 0.45, y + r * 0.5, r * 0.8, r * 0.7, seed + 1, 0.6);
    paint(ctx, "rgba(196,150,96,0.38)", null);
  }, C.ink, 5);
}
/** the phone in his hands, back to us (head units) */
const PHONE7 = { y: 318, w: 122, h: 236 };
function shotFace(ctx: Ctx, abs: number) {
  const u = easeInOut(phase(abs, EV.face4, EV.dialog));
  const [hx, hy, hr] = handheld(abs, 2.5, 47);
  // the room behind him, out of focus: the papered round mirror right behind his head, the lamp's warmth from the left
  ctx.save();
  camera(ctx, 430, 640, 1.8 + 0.08 * u, hr * 0.5 - 0.015 * u, 330 + hx * 0.5, -300 + hy * 0.5);
  filtered(ctx, `blur(${(4.5 * devScale(ctx)).toFixed(1)}px)`, (c) => {
    livingRoom(c, abs);
    livingNight(c, abs);
  }, "livingBg");
  ctx.restore();
  // the couch under the lyrics sinks into the dark (it was too loud)
  const dk = ctx.createLinearGradient(0, 1050, 0, H);
  dk.addColorStop(0, "rgba(6,8,20,0)");
  dk.addColorStop(1, "rgba(6,8,20,0.6)");
  ctx.fillStyle = dk;
  ctx.fillRect(-60, 1050, W + 120, H - 1000);
  const s7 = 2.6 + 0.14 * u * u;
  const shut = abs >= EV.face4 + 0.66;
  // he swallows: a little dip of the head just before the eyes shut
  const gulp = Math.sin(Math.PI * phase(abs, EV.face4 + 0.42, EV.face4 + 0.6));
  const pose: KidPose = {
    body: "full",
    legs: "sit",
    eyes: shut ? "shut" : "sad",
    look: [0.08, 0.85],
    brows: shut ? "sad" : "worried",
    mouth: "bite",
    tilt: -0.04 - 0.03 * u,
    headY: 4 * u + 5 * gulp + (shut ? 4 : 0),
    arms: "phone",
    shapeL: "hidden",
    shapeR: "hidden",
    grip: (c) => {
      phoneBack(c, 0, PHONE7.y, PHONE7.w, PHONE7.h, 0.03, false);
      for (const sd of [-1, 1]) roundHand(c, sd * 60, PHONE7.y + 22, 30, 7901 + sd);
    },
  };
  ctx.save();
  camera(ctx, FACE7[0], FACE7[1], 1, hr - 0.02 * u, hx, hy);
  const drawHim = (c: Ctx) => drawKid(c, FACE7[0], FACE7[1], s7, pose);
  drawHim(ctx);
  birthmark(ctx, FACE7[0], FACE7[1], s7, pose);
  const m = figureMask(ctx, drawHim, "him7");
  // the phone itself is not lit by its own screen
  const top = FACE7[1] + (PHONE7.y - PHONE7.h / 2) * s7;
  const cutPhone = (c: Ctx) => c.fillRect(FACE7[0] - (PHONE7.w / 2 + 4) * s7, top, (PHONE7.w + 8) * s7, PHONE7.h * s7);
  // night: the hoodie and the top of his head sink into the dark…
  onFigure(ctx, m, (c) => {
    const g = c.createLinearGradient(0, FACE7[1] - 270, 0, FACE7[1] + 600);
    g.addColorStop(0, "rgba(8,10,26,0.55)");
    g.addColorStop(0.3, "rgba(8,10,26,0)");
    g.addColorStop(0.55, "rgba(8,10,26,0.1)");
    g.addColorStop(1, "rgba(8,10,26,0.5)");
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
  });
  // …and the screen lights his chin, cheeks and hands from below, cold
  onFigure(ctx, m, (c) => {
    const g = c.createRadialGradient(FACE7[0], top, 0, FACE7[0], top, 360);
    g.addColorStop(0, "rgba(160,192,255,0.5)");
    g.addColorStop(1, "rgba(160,192,255,0)");
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
  }, "screen", 1, cutPhone);
  rimLight(ctx, m, -1, -0.15, 5, "rgb(255,196,140)", 0.3, "lighter", 6.5);
  rimLight(ctx, m, 1, -0.35, 5, "rgb(180,205,255)", 0.42, "lighter", 6.5);
  // the screen in his eyes: a small bright rectangle on each iris while he looks at it
  if (!shut) {
    ctx.save();
    ctx.translate(FACE7[0], FACE7[1]);
    ctx.scale(s7, s7);
    ctx.translate(pose.headX ?? 0, pose.headY ?? 0);
    ctx.rotate(pose.tilt ?? 0);
    ctx.fillStyle = "rgba(225,238,255,0.85)";
    for (const sd of [-1, 1]) {
      const ix = sd * 50 + (pose.look?.[0] ?? 0) * 10,
        iy = 40 + (pose.look?.[1] ?? 0) * 5;
      ctx.beginPath();
      ctx.roundRect(ix + 1, iy - 6, 7, 11, 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // the glow off the screen, over the top edge of the phone
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, FACE7[0], top, 260, "rgba(150,185,255,0.18)");
  ctx.restore();
  ctx.restore();
}

// ================================================================ 15.274 – 16.29 「发送给：白猫」… sent
function shotSend(ctx: Ctx, abs: number) {
  const u = easeInOut(phase(abs, EV.dialog, EV.send));
  // after the send the camera settles back on the chat (act 2 carries on from this framing)
  const back = easeInOut(phase(abs, EV.send + 0.05, EV.actEnd));
  const s = 1.0 + 0.08 * u - 0.04 * back;
  const [cx, cy] = aimPhone(300 + 80 * u - 80 * back, 640 + 120 * u - 140 * back, 540, 905 - 20 * back, s);
  const [hx, hy, hr] = handheld(abs, 2.5, 49);
  livingBokeh(ctx, hx * 0.4, hy * 0.4);
  const view = hisChatView(abs);
  const k = 1 - easeIn(phase(abs, EV.send + 0.02, EV.send + 0.12));
  // the thumb on the right of the button, so 「发送」 stays readable under it
  const tx = SEND_AT[0] + 70,
    ty = SEND_AT[1] + 12;
  const thumb: FingerPos | null = abs < EV.send + 0.06 ? { x: tx, y: ty, touch: abs < EV.send ? 1 : 1 - (abs - EV.send) / 0.06 } : null;
  phoneAt(ctx, cx + hx, cy + hy, s, hr, (c) => {
    chatScreen(c, abs, view);
    sendDialog(c, k, abs < EV.send ? 1 : 0, (p, w, h) => selfie(p, w, h, 0, 1));
    touchDot(c, thumb);
    tapRing(c, tx, ty, phase(abs, EV.send, EV.send + 0.14));
  });
}

/** the night part of act 1, from EV.next to the end of the act */
export function nightShots(ctx: Ctx, abs: number) {
  if (abs < EV.app) shotPhone(ctx, abs);
  else if (abs < EV.face4) shotBeauty(ctx, abs);
  else if (abs < EV.dialog) shotFace(ctx, abs);
  else shotSend(ctx, abs);
}
