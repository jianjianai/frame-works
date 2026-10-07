import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, blob, camera, card, designScene, fillBg, glow, inkLine, oval, paint, poly, rr } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, drawPerson } from "./lib/people";
import { bedBlanket, bedroom, classroomFront, deskFront, strawberryMilk } from "./lib/places";
import { lightPool } from "./lib/sets";
import { BACKSPACE_AT, chatScreen2, momentsScreen, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { GIVE_UP, HIS_DRAFT, deleted, hisNightChat, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 1 (0 – 16.43s) · 他的视角
 *  1A hook: he sent a long message; 「对方正在输入...」 flickers twice; she replies 「嗯」 (her 37th)
 *  1B three months of chat scroll by — long in July, 「嗯」「哦」 by October; her 朋友圈 「今天好开心～」 5 minutes later
 *  1C class: she turns round, their eyes meet, she hides behind her book; after class she runs off when he brings milk
 *  1D night: he types, deletes, sends 「以后不打扰你了」, turns off the lamp */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const REST: FingerPos = { x: 480, y: 1180, touch: 0.2 };

// ---------------------------------------------------------------- 1A
function shotHook(ctx: Ctx, abs: number) {
  if (abs < 2.95) {
    const typing = inWin(abs, EV.typing1) || inWin(abs, EV.typing2);
    const right: FingerPos = { x: 470 + Math.sin(abs * 2.2) * 6, y: 1150 - Math.sin(abs * 1.3) * 8, touch: 0.2 };
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { typing, keyboard: true })), { who: "boy", right, cy: 1010, s: 0.8 });
    // a soft pulse around the new 「嗯」
    const k = pop(abs, EV.um1, 0.35);
    if (k > 0 && k < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(424, 1004, 64 + k * 60, 44 + k * 30, 0, 0, Math.PI * 2);
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
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { scroll })), { who: "boy", right, cy: 900 });
    return;
  }
  const mark = smooth(phase(abs, 7.15, 7.6));
  phoneCloseup(ctx, abs, (c) => momentsScreen(c, abs, { dark: true, mark }), { who: "boy", right: REST, cy: 900 });
}

// ---------------------------------------------------------------- 1C
function book(c: Ctx) {
  // a notebook held up in front of her face (girl local units)
  c.save();
  c.translate(0, 30);
  c.rotate(-0.04);
  blob(c, [[-170, -120], [170, -128], [176, 120], [-164, 126]], 3580, 1.2);
  paint(c, "#7fb2d9", C.ink, 6);
  inkLine(c, [[0, -126], [2, 122]], 3581, 4, "#4a7aa0");
  poly(c, [[-130, -80], [-30, -82], [-30, -40], [-130, -38]], 3582, 0.8);
  paint(c, "#fbfaf4", C.ink, 3);
  c.restore();
}
function classmates(ctx: Ctx) {
  drawPerson(ctx, 150, 560, 0.4, { ...CAST.stu1, face: "neutral", arms: "down", body: "bust" });
  deskFront(ctx, 150, 712, 0.4, 3570);
  drawPerson(ctx, 960, 590, 0.4, { ...CAST.stu4, face: "neutral", arms: "down", body: "bust" });
  deskFront(ctx, 960, 742, 0.4, 3571);
}
function shotClass(ctx: Ctx, abs: number) {
  if (abs < BAR(5)) {
    const turned = abs >= EV.turn1 && abs < EV.hide1;
    const hidden = abs >= EV.hide1;
    ctx.save();
    camera(ctx, 540, 900, 1.0 + 0.03 * smooth(phase(abs, BAR(4), BAR(5))));
    classroomFront(ctx, abs, { sun: 1 });
    classmates(ctx);
    drawKid(ctx, 700, 640, 0.5, {
      body: "bust",
      eyes: hidden && abs > 9.6 ? "sad" : turned ? "open" : "sleepy",
      look: [-0.7, 0.6],
      mouth: turned ? "smile" : "flat",
      arms: "table",
    });
    deskFront(ctx, 700, 855, 0.5, 3572);
    if (turned) drawKid(ctx, 360, 900, 0.74, { who: "girl", outfit: "cardigan", body: "bust", view: "back", arms: "table" });
    else
      drawKid(ctx, 360, 900, 0.74, {
        who: "girl",
        outfit: "cardigan",
        body: "bust",
        eyes: "open",
        look: [0, 1],
        mouth: "flat",
        arms: hidden ? "custom" : "table",
        handL: [-150, 60],
        handR: [150, 60],
        shapeL: "hold",
        shapeR: "hold",
      });
    if (hidden) {
      // the notebook goes up in front of her face (drawn after the head)
      ctx.save();
      ctx.translate(360, 900);
      ctx.scale(0.74, 0.74);
      book(ctx);
      ctx.restore();
    }
    deskFront(ctx, 360, 1210, 0.74, 3573, (c) => {
      if (!hidden) {
        poly(c, [[-120, -36], [60, -40], [70, -10], [-110, -6]], 3574, 0.8);
        paint(c, "#fbfaf4", C.ink, 3);
      }
    });
    ctx.restore();
    return;
  }
  // after class: he brings strawberry milk; she grabs her friend and runs
  const approach = smooth(phase(abs, 10.35, 10.95));
  const flee = smooth(phase(abs, EV.flee, 11.85));
  const placed = abs > 12.0;
  ctx.save();
  camera(ctx, 540, 900, 1.02);
  classroomFront(ctx, abs, { sun: 1 });
  deskFront(ctx, 960, 742, 0.4, 3571);
  // him walking up with the milk
  const hx = lerp(1010, 760, approach);
  drawKid(ctx, hx, 700, 0.64, {
    body: "full",
    legs: approach > 0 && approach < 1 ? "walk" : "stand",
    walk: abs * 9,
    eyes: flee > 0.3 ? "sad" : "open",
    mouth: flee > 0.3 ? "frown" : "smile",
    look: [-0.8, 0.5],
    arms: "custom",
    handR: placed ? [120, 432] : [60, 300],
    handL: [-120, 432],
    shapeR: placed ? "relax" : "hold",
    grip: placed ? undefined : (c) => strawberryMilk(c, 74, 250, 0.7, -0.1, 3590),
  });
  // her friend, standing by the desk
  const fx = lerp(170, -260, flee);
  drawPerson(ctx, fx, 720, 0.62, { ...CAST.mei, face: flee > 0 ? "o" : "smile", arms: "down", body: "full", legs: flee > 0 && flee < 1 ? "walk" : "stand", walk: abs * 10 });
  // her: startled, then up and away with the friend
  if (abs < EV.flee) {
    drawKid(ctx, 380, 920, 0.72, { who: "girl", outfit: "cardigan", body: "bust", eyes: abs > 10.95 ? "wide" : "open", mouth: abs > 10.95 ? "o" : "flat", look: [0.8, -0.2], arms: "table" });
  } else {
    drawKid(ctx, lerp(380, -120, flee), 760, 0.64, { who: "girl", outfit: "cardigan", body: "full", legs: "walk", walk: abs * 10, eyes: "shut", mouth: "bite", look: [-1, 0], arms: "custom", handL: [-150, 330], handR: [100, 420] });
  }
  deskFront(ctx, 380, 1222, 0.72, 3573, (c) => {
    if (placed) strawberryMilk(c, 120, -90, 0.6, 0.05, 3591);
  });
  ctx.restore();
}

// ---------------------------------------------------------------- 1D
function thumbsGiveUp(abs: number, sendAt: [number, number]): { right: FingerPos; left: FingerPos } {
  if (inWin(abs, EV.type1)) return typingThumbs(abs, EV.type1[0], EV.type1[1], 11);
  if (inWin(abs, EV.type2)) return typingThumbs(abs, EV.type2[0], EV.type2[1], 13);
  if (inWin(abs, EV.del1)) {
    const f = ((abs - EV.del1[0]) * 10) % 1;
    return { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.4 }, left: { x: 120, y: 1180, touch: 0.2 } };
  }
  if (abs >= EV.type2[1] && abs < EV.send1 + 0.2) {
    // hovering over 发送 … then pressing it
    const press = abs > EV.send1 - 0.08;
    const hover = smooth(phase(abs, EV.type2[1], 14.75));
    return { right: { x: lerp(480, sendAt[0], hover), y: lerp(1180, sendAt[1], hover), touch: press ? 1 : 0.1 + Math.sin(abs * 7) * 0.05 }, left: { x: 120, y: 1180, touch: 0.2 } };
  }
  return { right: REST, left: { x: 120, y: 1180, touch: 0.2 } };
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
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy: 860, ...thumbsGiveUp(abs, sendAt) });
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
