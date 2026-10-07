import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blob, camera, card, designScene, fillBg, filtered, glow, inkLine, oval, paint, poly, rr, shaded, text, tubePts } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, drawPerson } from "./lib/people";
import { bedBlanket, bedroom, classroomBoard, classroomFront, deskFront, strawberryMilk, textbook } from "./lib/places";
import { lightPool } from "./lib/sets";
import { BACKSPACE_AT, chatScreen2, momentsScreen, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { GIVE_UP, HIS_DRAFT, PHONE_CY, REST_L, REST_R, deleted, hisClassFace, hisNightChat, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 1 (0 – 16.43s) · 他的视角
 *  1A hook: he sent a long message; 「对方正在输入...」 flickers twice; she replies 「嗯」 (her 37th)
 *  1B three months of chat scroll by — long in July, 「嗯」「哦」 by October; her 朋友圈 「今天好开心～」 5 minutes later
 *  1C class, from his seat: she turns round, their eyes meet, the 物理 textbook snaps up in front of her face; he looks
 *     down at the milk he bought her. After class he holds it out — she grabs her friend and runs; the milk stays on her desk
 *  1D night: he types, deletes, sends 「以后不打扰你了」, turns off the lamp */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** the hook phone sits under the two-line hook text */
const HOOK_CY = 1100;
const REST: FingerPos = REST_R;

// ---------------------------------------------------------------- 1A
function shotHook(ctx: Ctx, abs: number) {
  if (abs < 2.95) {
    const typing = inWin(abs, EV.typing1) || inWin(abs, EV.typing2);
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { typing, keyboard: true })), { who: "boy", cy: HOOK_CY, s: 1 });
    // a soft pulse around the new 「嗯」
    const k = pop(abs, EV.um1, 0.35);
    if (k > 0 && k < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 6;
      ctx.beginPath();
      // around the 「嗯」 bubble (screen 155, 632)
      ctx.ellipse(540 + (155 - 300), HOOK_CY + (632 - 640), 80 + k * 75, 55 + k * 38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }
  // his face in the phone light
  fillBg(ctx, "#0b0d1c");
  ctx.save();
  camera(ctx, 540, 860, 1.0 + 0.04 * smooth(phase(abs, 2.95, BAR(2))));
  glow(ctx, 540, 1250, 900, "rgba(120,150,255,0.3)");
  drawKid(ctx, 540, 860, 1.32, { body: "bust", eyes: abs > 3.45 ? "sad" : "tired", look: [0, 0.9], mouth: "flat", arms: "phone", tilt: -0.06 * smooth(phase(abs, 3.4, 3.9)) });
  lightPool(ctx, 540, 1180, 900, 0.55, "rgba(120,150,255,0.22)");
  ctx.restore();
}

// ---------------------------------------------------------------- 1B
function shotHistory(ctx: Ctx, abs: number) {
  if (abs < BAR(3)) {
    const up = smooth(phase(abs, EV.scrollUp, 5.0));
    const down = smooth(phase(abs, EV.scrollDown, 6.1));
    const scroll = 2150 * (up - down);
    const swipingUp = abs > EV.scrollUp && abs < 5.0;
    const swipingDown = abs > EV.scrollDown && abs < 6.1;
    let right: FingerPos = REST;
    if (swipingUp || swipingDown) {
      const f = ((abs - (swipingUp ? EV.scrollUp : EV.scrollDown)) * 3.4) % 1;
      right = swipingUp ? { x: 420, y: 520 + f * 420, touch: f < 0.8 ? 1 : 0 } : { x: 420, y: 940 - f * 420, touch: f < 0.8 ? 1 : 0 };
    }
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { scroll })), { who: "boy", right, cy: PHONE_CY });
    return;
  }
  const mark = smooth(phase(abs, 7.15, 7.6));
  phoneCloseup(ctx, abs, (c) => momentsScreen(c, abs, { dark: true, mark }), { who: "boy", right: REST, cy: PHONE_CY });
}

// ---------------------------------------------------------------- 1C class: from his seat, then after class
/** his desk in the foreground: open notebook with a little sunflower doodle (her hair clip), the strawberry
 *  milk he bought for her, his hand holding a pen */
function hisDesk(ctx: Ctx, abs: number) {
  shaded(ctx, () => poly(ctx, [[-140, 1330], [1220, 1318], [1320, 2000], [-240, 2000]], 3700, 1.4), "#d9a96c", () => {
    inkLine(ctx, [[-120, 1420], [1200, 1410]], 3701, 3, "rgba(120,80,40,0.28)");
    inkLine(ctx, [[-160, 1640], [1260, 1628]], 3702, 3, "rgba(120,80,40,0.22)");
  }, C.ink, 6);
  poly(ctx, [[330, 1430], [800, 1420], [850, 1760], [290, 1776]], 3703, 1.2);
  paint(ctx, "#fbfaf2", C.ink, 5);
  inkLine(ctx, [[565, 1424], [570, 1768]], 3704, 3, "#c8c1ae");
  for (let i = 0; i < 6; i++) {
    inkLine(ctx, [[340 - i * 6, 1480 + i * 46], [550, 1476 + i * 46]], 3705 + i, 2, "rgba(90,120,170,0.35)");
    inkLine(ctx, [[585, 1474 + i * 46], [795 + i * 8, 1470 + i * 46]], 3712 + i, 2, "rgba(90,120,170,0.35)");
  }
  ctx.save();
  ctx.globalAlpha = 0.8;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    inkLine(ctx, [[450 + Math.cos(a) * 17, 1610 + Math.sin(a) * 13], [450 + Math.cos(a) * 33, 1610 + Math.sin(a) * 26]], 3730 + k, 3, "#d9a020");
  }
  oval(ctx, 450, 1610, 13, 10, 3740, 0.6);
  paint(ctx, "#8a5a2a", null);
  ctx.restore();
  strawberryMilk(ctx, 150, 1530, 0.78, -0.06, 3720);
  // his hand with the pen, coming in from the bottom right
  const sway = Math.sin(abs * 3) * 4;
  const wrist: Pt = [800 + sway, 1660];
  blob(ctx, tubePts([[1200, 2080], [980, 1830], wrist], [124, 112, 100], false, true), 3721, 1.2);
  paint(ctx, C.hoodie, C.ink, 6);
  inkLine(ctx, [[688 + sway, 1556], [790 + sway, 1644]], 3722, 10, C.ink);
  inkLine(ctx, [[688 + sway, 1556], [790 + sway, 1644]], 3722, 6, "#3d6fd1");
  roundHand(ctx, wrist[0] - 6, wrist[1] - 6, 46, 3723);
}

/** his hand as a simple round fist at the end of the sleeve */
function roundHand(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  oval(ctx, x, y, r, r * 0.94, seed, 1);
  paint(ctx, C.skin, C.ink, 6);
  ctx.save();
  oval(ctx, x, y, r, r * 0.94, seed, 1);
  ctx.clip();
  oval(ctx, x + r * 0.45, y + r * 0.4, r * 0.75, r * 0.7, seed + 1, 1);
  paint(ctx, "rgba(196,140,90,0.3)", null);
  ctx.restore();
}

/** her fingertips curled over both edges of the book (book-local units) */
function bookFingers(ctx: Ctx, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      rr(ctx, side < 0 ? -176 : 136, 18 + k * 31, 40, 27, 13);
      paint(ctx, "#f6e1c3", C.ink, 3.5);
    }
  ctx.restore();
}

/** 8.25 → 9.85: she sits in front of him; she turns round, their eyes meet, the textbook snaps up */
function shotSeat(ctx: Ctx, abs: number) {
  const turned = abs >= EV.turn1;
  const hidden = abs >= EV.hide1;
  const gx = 520,
    gy = 930,
    gs = 0.95;
  ctx.save();
  camera(ctx, gx, 1000, 1.0 + 0.03 * smooth(phase(abs, BAR(4), EV.turn1)) + 0.06 * smooth(phase(abs, EV.turn1, EV.turn1 + 0.3)));
  filtered(ctx, "blur(2.5px)", (c) => classroomBoard(c, abs, { sun: 1 }), "board");
  if (!turned) {
    // back to him, writing
    drawKid(ctx, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", view: "back", arms: "down", headY: 4 * Math.sin(abs * 1.6) });
  } else if (!hidden) {
    drawKid(ctx, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "wide", mouth: "o", look: [0.05, 0.05], arms: "down", tilt: -0.04 });
  } else {
    drawKid(ctx, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "shut", mouth: "bite", arms: "custom", handL: [-150, 170], handR: [150, 170], shapeL: "hidden", shapeR: "hidden" });
    // the textbook goes up in front of her face (drawn after the head)
    const up = backOut(phase(abs, EV.hide1, EV.hide1 + 0.16));
    const bx = gx + 6,
      by = gy + lerp(420, 110, up) * gs;
    const rot = -0.05 + 0.03 * Math.sin((abs - EV.hide1) * 18) * (1 - phase(abs, EV.hide1, EV.hide1 + 0.5));
    textbook(ctx, bx, by, gs, rot);
    bookFingers(ctx, bx, by, gs, rot);
  }
  ctx.restore();
  hisDesk(ctx, abs);
}

/** 11.95 → 12.34: the milk left on her empty desk */
function shotMilkLeft(ctx: Ctx, abs: number) {
  const down = smooth(phase(abs, 11.95, 12.1));
  const away = smooth(phase(abs, 12.12, 12.3));
  ctx.save();
  camera(ctx, 380, 900, 1.6);
  filtered(ctx, "blur(4px)", (c) => classroomFront(c, abs, { sun: 0.5 }), "classBack");
  ctx.restore();
  deskFront(ctx, 540, 1180, 2.0, 3913);
  strawberryMilk(ctx, 500, lerp(820, 900, down), 2.0, 0.03, 3914);
  // his hand lets go and pulls back out of frame
  const wrist: Pt = [lerp(760, 960, away), lerp(lerp(640, 720, down), 260, away)];
  blob(ctx, tubePts([[1240, -120], [1080, 260], wrist], [190, 176, 160], false, true), 3915, 1.2);
  paint(ctx, C.hoodie, C.ink, 7);
  roundHand(ctx, wrist[0] - 10, wrist[1] + 10, 92, 3916);
}

/** 10.30 → 12.34 after class: he brings the strawberry milk; she grabs her friend and runs */
function shotMilk(ctx: Ctx, abs: number) {
  if (abs >= 11.95) return shotMilkLeft(ctx, abs);
  const approach = smooth(phase(abs, BAR(5), 10.75));
  const offer = smooth(phase(abs, EV.milkOffer - 0.12, EV.milkOffer + 0.12));
  const flee = smooth(phase(abs, EV.flee, 11.62));
  ctx.save();
  camera(ctx, 560, 700, 1.3);
  filtered(ctx, "blur(2px)", (c) => classroomFront(c, abs, { sun: 0.6 }), "classBack");
  ctx.restore();
  // her friend, standing by the desk
  drawPerson(ctx, lerp(190, -400, flee), 870, 0.92, { ...CAST.mei, face: flee > 0 ? "o" : "smile", arms: "down", body: "full", legs: flee > 0 && flee < 1 ? "walk" : "stand", walk: abs * 14 });
  if (abs < EV.flee) {
    const startled = abs > 10.95;
    drawKid(ctx, 360, 1080, 1.08, { who: "girl", outfit: "cardigan", body: "bust", eyes: startled ? "wide" : "open", mouth: startled ? "o" : "flat", look: startled ? [0.9, -0.3] : [0.1, 0.9], arms: "down" });
  } else {
    // up and away, leaning into the run
    const x = lerp(360, -340, flee);
    ctx.save();
    ctx.translate(x, 840);
    ctx.rotate(-0.12);
    drawKid(ctx, 0, 0, 1.02, { who: "girl", outfit: "cardigan", body: "full", legs: "run", walk: abs * 16, eyes: "shut", mouth: "bite", look: [-1, 0], arms: "custom", handL: [-230, 240], handR: [70, 360], shapeL: "open", shapeR: "fist", headY: -Math.abs(Math.sin(abs * 16)) * 8 });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 1 - phase(abs, 11.45, 11.62);
    for (let k = 0; k < 4; k++) inkLine(ctx, [[x + 250 + k * 18, 720 + k * 130], [x + 390 + k * 30, 730 + k * 130]], 3760 + k, 5);
    ctx.restore();
  }
  deskFront(ctx, 360, 1540, 1.08, 3573);
  // him: walks up, holds out the milk, is left holding it
  const sad = abs > 11.5;
  // holding the milk out like handing someone a card: the upper arm goes down and out to the elbow,
  // the forearm comes back up to the hand at shoulder height — a "V", elbow below (bendL: 1)
  const hand: Pt = [lerp(-70, -285, offer), lerp(320, 190, offer)];
  drawKid(ctx, lerp(1260, 830, approach), 800, 1.04, {
    body: "full",
    legs: approach > 0 && approach < 0.92 ? "walk" : "stand",
    walk: abs * 10,
    eyes: sad ? "sad" : "open",
    mouth: sad ? "frown" : "smile",
    brows: sad ? "sad" : undefined,
    look: [-0.85, 0.35],
    arms: "custom",
    handL: hand,
    bendL: 1,
    handR: [130, 456],
    shapeL: "hold",
    grip: (c) => strawberryMilk(c, hand[0] - 4, hand[1] - 72, 0.72, -0.04, 3590),
  });
  // the bell
  const bell = 1 - phase(abs, 10.75, 10.95);
  if (bell > 0) text(ctx, "叮铃铃～", 230, 330, { size: 56, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10, alpha: bell });
}

function shotClass(ctx: Ctx, abs: number) {
  if (abs < 9.85) shotSeat(ctx, abs);
  else if (abs < BAR(5)) hisClassFace(ctx, abs, 9.85, "sad");
  else shotMilk(ctx, abs);
}

// ---------------------------------------------------------------- 1D
function thumbsGiveUp(abs: number, sendAt: [number, number]): { right: FingerPos; left: FingerPos } {
  if (inWin(abs, EV.type1)) return typingThumbs(abs, EV.type1[0], EV.type1[1], 11);
  if (inWin(abs, EV.type2)) return typingThumbs(abs, EV.type2[0], EV.type2[1], 13);
  if (inWin(abs, EV.del1)) {
    const f = ((abs - EV.del1[0]) * 10) % 1;
    return { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.4 }, left: REST_L };
  }
  if (abs >= EV.type2[1] && abs < EV.send1 + 0.2) {
    // hovering over 发送 … then pressing it
    const press = abs > EV.send1 - 0.08;
    const hover = smooth(phase(abs, EV.type2[1], 14.75));
    return { right: { x: lerp(REST.x, sendAt[0], hover), y: lerp(REST.y, sendAt[1], hover), touch: press ? 1 : 0.1 + Math.sin(abs * 7) * 0.05 }, left: REST_L };
  }
  return { right: REST, left: REST_L };
}

function lamp(ctx: Ctx, on: number) {
  // little desk lamp on the headboard shelf
  inkLine(ctx, [[560, 700], [700, 698]], 3595, 8, "#3a2f4a");
  poly(ctx, [[600, 610], [670, 610], [690, 660], [580, 660]], 3596, 1);
  paint(ctx, on ? "#ffe6a8" : "#8a8070", C.ink, 4);
  inkLine(ctx, [[635, 660], [635, 696]], 3597, 6, "#3a2c22");
}

function shotGiveUp(ctx: Ctx, abs: number) {
  if (abs < 15.45) {
    let draft = "";
    if (abs < EV.del1[0]) draft = typed(HIS_DRAFT, abs, EV.type1[0], EV.type1[1]);
    else if (abs < EV.type2[0]) draft = deleted(HIS_DRAFT, abs, EV.del1[0], EV.del1[1]);
    else if (abs < EV.send1) draft = typed(GIVE_UP, abs, EV.type2[0], EV.type2[1]);
    const view = hisNightChat(abs, { draft: abs < EV.send1 ? draft : "", caret: abs < EV.send1, keyboard: true, sendHot: abs > EV.send1 - 0.1 && abs < EV.send1 ? 1 : 0 });
    const sendAt = sendButtonAt(ctx, { ...view, draft: GIVE_UP }) as [number, number];
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy: PHONE_CY, ...thumbsGiveUp(abs, sendAt) });
    return;
  }
  // his room: phone face down, lamp off
  const on = abs < EV.lampOff ? 1 : 0;
  const down = smooth(phase(abs, 15.5, 15.85));
  const reach = smooth(phase(abs, 15.85, 16.12));
  ctx.save();
  camera(ctx, 700, 900, 1.06);
  bedroom(ctx, abs, {});
  lamp(ctx, on);
  drawKid(ctx, 840, 620, 0.78, {
    body: "bust",
    eyes: "sad",
    mouth: "flat",
    look: [-0.6, 0.6],
    arms: "custom",
    handL: reach > 0 ? [lerp(-60, -250, reach), lerp(330, 60, reach)] : [lerp(-58, -40, down), lerp(330, 470, down)],
    handR: [lerp(58, 40, down), lerp(330, 470, down)],
    shapeL: reach > 0.5 ? "open" : "hold",
    shapeR: "hold",
  });
  bedBlanket(ctx);
  // the phone, face down on the duvet
  ctx.save();
  ctx.translate(820, 1010);
  ctx.rotate(0.15);
  rr(ctx, -70, -34, 140, 68, 14);
  paint(ctx, "#1a1a1e", C.ink, 5);
  ctx.restore();
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 635, 640, 520, "rgba(255,200,120,0.3)");
    ctx.restore();
    lightPool(ctx, 640, 700, 1100, 0.6, "rgba(255,190,110,0.08)");
  } else {
    ctx.fillStyle = "rgba(4,6,18,0.78)";
    ctx.fillRect(-100, -100, W + 200, H + 200);
    glow(ctx, 250, 470, 360, "rgba(150,170,255,0.18)");
  }
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    if (abs < BAR(2)) shotHook(ctx, abs);
    else if (abs < BAR(4)) shotHistory(ctx, abs);
    else if (abs < BAR(6)) shotClass(ctx, abs);
    else shotGiveUp(ctx, abs);
  });
}
