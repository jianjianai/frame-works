import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, blob, camera, card, designScene, fillBg, filtered, glow, inkLine, paint, shake } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { herBlanket, herRoom } from "./lib/places";
import { lightPool } from "./lib/sets";
import { BACKSPACE_AT, chatScreen2, powerOffScreen, profileScreen } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { SH, SW } from "./lib/phone";
import { GIVE_UP, HER_NIGHT_DRAFT, HIM, HISTORY, deleted, fromHer, hisNightChat, inWin, phoneCloseup, tearDrops } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 2 (16.43 – 32.79s) · chorus 1
 *  2A her profile photo (so pretty) → the screen times out → his own face in the black glass (so ugly)
 *  2B 「对方正在输入...」 appears and disappears, twice (clue)
 *  2C he powers the phone off and pulls the duvet over his head (the music goes muffled)
 *  2D 29.82 "I should get a piercing through my heart" — her room: she is crying, deleting a whole paragraph */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const REST: FingerPos = { x: 480, y: 1180, touch: 0.2 };

/** his blue duvet, top edge at y */
function duvet(ctx: Ctx, top: number) {
  blob(ctx, [[-80, top + 30], [300, top - 20], [780, top - 10], [1160, top + 40], [1160, 2000], [-80, 2000]], 3710, 3);
  paint(ctx, "#33456e", C.ink, 7);
  inkLine(ctx, [[100, top + 120], [400, top + 80], [700, top + 140]], 3711, 4, "#26375a");
  inkLine(ctx, [[300, top + 300], [600, top + 260], [960, top + 330]], 3712, 4, "#26375a");
}

function pillow(ctx: Ctx, x: number, y: number, s: number) {
  blob(ctx, [[x - 330 * s, y - 120 * s], [x + 330 * s, y - 140 * s], [x + 360 * s, y + 130 * s], [x - 350 * s, y + 140 * s]], 3700, 2);
  paint(ctx, "#dfe4f2", C.ink, 6);
}

// ---------------------------------------------------------------- 2A
function shotPretty(ctx: Ctx, abs: number) {
  if (abs < 18.5) {
    const dim = smooth(phase(abs, 18.2, EV.timeout));
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        profileScreen(c, abs);
        if (dim > 0) {
          c.fillStyle = `rgba(0,0,0,${0.7 * dim})`;
          c.fillRect(0, 0, SW, SH);
        }
      },
      // tight on the photo so her picture fills the frame
      { who: "boy", right: REST, cx: 540, cy: 1180 - 120 * smooth(phase(abs, BAR(8), 18.5)), s: 1.5 },
    );
    return;
  }
  // his reflection in the black glass
  const clear = smooth(phase(abs, 19.4, 20.0));
  phoneCloseup(
    ctx,
    abs,
    (c) => {
      c.fillStyle = "#050507";
      c.fillRect(0, 0, SW, SH);
      filtered(c, "grayscale(0.7) brightness(0.9)", (k) => {
        drawKid(k, SW / 2, 560, 1.15, { body: "bust", eyes: "sad", mouth: "frown", look: [0, -0.2] });
      }, "refl", 0.22 + 0.25 * clear);
      // glare across the glass
      c.fillStyle = "rgba(255,255,255,0.06)";
      c.beginPath();
      c.moveTo(80, 0);
      c.lineTo(260, 0);
      c.lineTo(60, SH);
      c.lineTo(-120, SH);
      c.fill();
    },
    { who: "boy", right: REST, cy: 900, glowCol: "rgba(60,70,120,0.2)" },
  );
}

// ---------------------------------------------------------------- 2B
function shotTyping(ctx: Ctx, abs: number) {
  if (abs < 23.4) {
    const typing = inWin(abs, EV.typingA) || inWin(abs, EV.typingB);
    // push in on the title bar: 「对方正在输入...」 big
    const push = smooth(phase(abs, BAR(10), 21.1));
    const s2 = 0.72 + 0.9 * push;
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { typing })), { who: "boy", right: REST, cx: 540, cy: 900 + (640 - 260) * (s2 - 0.72) * 0.95, s: s2 });
    return;
  }
  // lying in bed, phone held above his face
  fillBg(ctx, "#0a0c1a");
  ctx.save();
  camera(ctx, 540, 820, 1.0 + 0.04 * smooth(phase(abs, 23.4, BAR(12))));
  pillow(ctx, 540, 880, 1.2);
  drawKid(ctx, 540, 820, 1.25, { body: "head", eyes: "sad", look: [0, -0.9], mouth: "flat", tilt: 0.04 });
  duvet(ctx, 975);
  glow(ctx, 540, 380, 700, "rgba(120,150,255,0.35)");
  lightPool(ctx, 540, 520, 1000, 0.55, "rgba(120,150,255,0.18)");
  ctx.restore();
  card(ctx, "00:47", 70, 330, smooth(phase(abs, 23.5, 23.8)));
}

// ---------------------------------------------------------------- 2C
function shotOff(ctx: Ctx, abs: number) {
  if (abs < EV.powerOff) {
    const slide = smooth(phase(abs, 25.1, 25.7));
    const right: FingerPos = abs < 24.95 ? REST : { x: lerp(115, 485, slide), y: 255, touch: abs < 25.8 ? 1 : 0.2 };
    const black = smooth(phase(abs, 25.7, EV.powerOff));
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        powerOffScreen(c, abs, slide, (k) => chatScreen2(k, abs, hisNightChat(abs)));
        if (black > 0) {
          c.fillStyle = `rgba(0,0,0,${black})`;
          c.fillRect(0, 0, SW, SH);
        }
      },
      { who: "boy", right, cy: 900 },
    );
    return;
  }
  if (abs < EV.muffle[0]) {
    // the duvet goes up over his head
    const cover = smooth(phase(abs, EV.blanket, 26.6));
    fillBg(ctx, "#070914");
    ctx.save();
    camera(ctx, 540, 820, 1.04);
    pillow(ctx, 540, 860, 1.2);
    drawKid(ctx, 540, 800, 1.1, { body: "head", eyes: "sad", look: [0, -0.4], mouth: "frown" });
    duvet(ctx, lerp(950, 520, cover));
    ctx.restore();
    ctx.fillStyle = "rgba(4,6,18,0.45)";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  underBlanket(ctx, abs);
}

function underBlanket(ctx: Ctx, abs: number) {
  // dark fabric dome, his wet eyes
  fillBg(ctx, "#05060f");
  ctx.save();
  camera(ctx, 540, 860, 1.06 + 0.04 * smooth(phase(abs, EV.muffle[0], EV.twist)));
  drawKid(ctx, 540, 860, 1.45, { body: "head", eyes: "teary", tears: 0.7, look: [0, 0.2], mouth: "wobble", brows: "sad" });
  ctx.restore();
  const g = ctx.createRadialGradient(540, 860, 120, 540, 860, 760);
  g.addColorStop(0, "rgba(10,14,40,0.35)");
  g.addColorStop(1, "rgba(3,4,12,0.97)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 5; i++) inkLine(ctx, [[-40, 300 + i * 360], [540, 200 + i * 360 + Math.sin(i) * 60], [1120, 320 + i * 360]], 3720 + i, 6, "#1b2340");
  ctx.restore();
}

// ---------------------------------------------------------------- 2D the twist
function herNightView(abs: number, draft: string) {
  const items = fromHer(HISTORY);
  items.push({ t: "msg", me: true, text: "嗯" });
  items.push({ t: "msg", text: GIVE_UP });
  return { title: HIM, time: "00:47", me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: true, keyboard: true };
}

function shotTwist(ctx: Ctx, abs: number) {
  if (abs < EV.twist) {
    underBlanket(ctx, abs);
    card(ctx, "00:52", 70, 330, smooth(phase(abs, 28.75, 29.05)) * (1 - phase(abs, 29.6, 29.82)));
    return;
  }
  if (abs < 30.4) {
    // her room — she is crying too
    ctx.save();
    camera(ctx, 420, 900, 1.06);
    herRoom(ctx, abs, { lights: 1 });
    const sob = Math.sin(abs * 14) * 3;
    drawKid(ctx, 320, 700 + sob, 0.62, {
      who: "girl",
      outfit: "pajamas",
      body: "full",
      legs: "sitFloor",
      eyes: "teary",
      tears: 1,
      mouth: "wobble",
      brows: "sad",
      look: [0.3, 0.9],
      arms: "custom",
      handL: [-60, 320],
      handR: [60, 330],
      shapeL: "hold",
      shapeR: "hold",
      grip: (c) => {
        c.save();
        c.translate(0, 300);
        c.fillStyle = "#1a1a1e";
        c.beginPath();
        c.roundRect(-44, -80, 88, 160, 14);
        c.fill();
        c.restore();
      },
    });
    herBlanket(ctx);
    lightPool(ctx, 320, 900, 1100, 0.45, "rgba(255,190,140,0.1)");
    ctx.restore();
    return;
  }
  if (abs < 31.84) {
    // her phone: the whole paragraph, deleted one character at a time
    const draft = abs < EV.del2[0] ? HER_NIGHT_DRAFT : deleted(HER_NIGHT_DRAFT, abs, EV.del2[0], EV.del2[1]);
    const f = ((abs - EV.del2[0]) * 11) % 1;
    const right: FingerPos = abs < EV.del2[0] ? { x: BACKSPACE_AT[0] - 20, y: BACKSPACE_AT[1] - 60, touch: 0 } : { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.5 };
    const [sx, sy] = shake(abs, 1.5, 9);
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        chatScreen2(c, abs, herNightView(abs, draft));
        tearDrops(c, abs, 30.6, 3);
      },
      { who: "girl", right, cx: 540 + sx, cy: 860 + sy, glowCol: "rgba(255,170,200,0.22)" },
    );
    return;
  }
  // her face
  fillBg(ctx, "#140f22");
  ctx.save();
  camera(ctx, 540, 860, 1.02 + 0.05 * smooth(phase(abs, 31.84, BAR(16))));
  for (let i = 0; i < 6; i++) glow(ctx, 120 + i * 170, 260 + (i % 2) * 60, 120, i % 3 === 0 ? "rgba(255,170,200,0.4)" : "rgba(255,214,140,0.4)");
  drawKid(ctx, 540, 900, 1.3, { who: "girl", outfit: "pajamas", body: "bust", eyes: "teary", tears: 1, mouth: "open", brows: "sad", look: [0, 0.8], arms: "phone" });
  lightPool(ctx, 540, 1200, 900, 0.5, "rgba(255,170,200,0.18)");
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(8), (ctx, abs) => {
    if (abs < BAR(10)) shotPretty(ctx, abs);
    else if (abs < BAR(12)) shotTyping(ctx, abs);
    else if (abs < BAR(14)) shotOff(ctx, abs);
    else shotTwist(ctx, abs);
  });
}
