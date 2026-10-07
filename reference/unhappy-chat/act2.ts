import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, blob, camera, card, designScene, fillBg, filtered, glow, hash, inkLine, oval, paint, poly, rr, shake, vgrad } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { bedroom, herBlanket, herRoom } from "./lib/places";
import { lightPool } from "./lib/sets";
import { BACKSPACE_AT, chatScreen2, powerOffScreen, profileScreen, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { SH, SW } from "./lib/phone";
import { GIVE_UP, HER_NIGHT_DRAFT, HIM, PHONE_CY, PHONE_S, REST_R, HISTORY, deleted, fromHer, hisNightChat, inWin, phoneCloseup, tearDrops, phoneBody } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 2 (16.43 – 32.79s) · chorus 1
 *  2A her profile photo (so pretty) → the screen times out → his own face in the black glass (so ugly)
 *  2B 「对方正在输入...」 appears and disappears, twice (clue)
 *  2C he powers the phone off and pulls the duvet over his head (the music goes muffled)
 *  2D 29.82 "I should get a piercing through my heart" — her room: she is crying, deleting a whole paragraph */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const REST: FingerPos = REST_R;

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
/** "You are very pretty / I'm so very ugly": her sunny profile photo; the screen times out and his own face
 *  surfaces in the black glass exactly where hers was (match dissolve). He looks at himself; on "ugly" the camera
 *  pushes in slowly and the edges close in; then he can't hold his own gaze — eyes and head go down. */
function shotPretty(ctx: Ctx, abs: number) {
  // her photo stays until "pretty" has been sung (ends 19.33); the screen times out round the next beat (19.50)
  const out = smooth(phase(abs, 19.33, 19.75)); // her photo fading to black glass
  const refl = abs < 19.4 ? 0 : 0.3 * smooth(phase(abs, 19.4, 19.9)) + 0.3 * smooth(phase(abs, 20.15, 20.6));
  const push = smooth(phase(abs, 19.8, EV.uglyEnd));
  // framed so the phone's sides stay in the picture — it has to read as a phone when the screen goes black
  const s = 1.22 + 0.25 * push;
  const ay = 805 + 45 * push; // where both faces sit on screen (face at screen 300, 470)
  // her profile sits low enough that her name clears the lyrics; as the screen dims the camera rises to put
  // her face where his reflection will appear
  const cyNow = abs < 19.62 ? 1161 - 149 * smooth(phase(abs, 19.32, 19.62)) : ay + 170 * s;
  const avert = smooth(phase(abs, 20.55, 20.9)); // on the word "ugly"
  phoneCloseup(
    ctx,
    abs,
    (c) => {
      if (out < 1) profileScreen(c, abs);
      if (out > 0) {
        c.fillStyle = `rgba(5,5,7,${out})`;
        c.fillRect(0, 0, SW, SH);
      }
      if (refl > 0) {
        filtered(c, "grayscale(0.75) brightness(0.85)", (k) => {
          drawKid(k, SW / 2, 470, 1.15, {
            body: "bust",
            eyes: "sad",
            brows: avert > 0.5 ? "sad" : "worried",
            mouth: avert > 0.5 ? "frown" : "flat",
            // he lowers his eyes and his head — he can't look at himself
            look: [0, -0.1 + 1.0 * avert],
            headY: 14 * avert,
          });
        }, "refl", refl);
        // a glare sliding across the glass, over his face on "ugly"
        const gx = -320 + 760 * phase(abs, 19.6, EV.uglyEnd);
        c.fillStyle = "rgba(255,255,255,0.07)";
        c.beginPath();
        c.moveTo(gx + 160, 0);
        c.lineTo(gx + 300, 0);
        c.lineTo(gx + 40, SH);
        c.lineTo(gx - 100, SH);
        c.fill();
      }
      if (out > 0) {
        // glass: a soft sheen over the top and the desk lamp mirrored in the corner
        const sheen = c.createLinearGradient(0, 0, SW * 0.7, SH * 0.45);
        sheen.addColorStop(0, `rgba(255,255,255,${0.1 * out})`);
        sheen.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = sheen;
        c.fillRect(0, 0, SW, SH);
        const lamp = c.createRadialGradient(470, 210, 10, 470, 210, 150);
        lamp.addColorStop(0, `rgba(255,226,180,${0.22 * out})`);
        lamp.addColorStop(1, "rgba(255,226,180,0)");
        c.fillStyle = lamp;
        c.fillRect(300, 40, 300, 340);
      }
    },
    // the same framing for both faces, then a slow push into his
    {
      who: "boy",
      right: REST,
      cx: 540,
      cy: cyNow,
      s,
      rot: -0.02,
      steady: true,
      bg: "#1a1424",
      glowCol: "rgba(255,200,150,0.16)",
      // his bed, out of focus: a dim plum blanket with lamp bokeh, so the black phone stands out
      backdrop: (c) => {
        for (let i = 0; i < 9; i++) {
          const bx = 80 + ((i * 263) % 960),
            by = 220 + ((i * 397) % 1500);
          c.fillStyle = i % 3 === 0 ? "rgba(255,210,150,0.10)" : "rgba(170,150,220,0.08)";
          c.beginPath();
          c.arc(bx, by, 60 + (i % 4) * 30, 0, Math.PI * 2);
          c.fill();
        }
      },
    },
  );
  phoneBody(ctx, 540, cyNow, s, -0.02);
  // the room closes in around him
  const v = smooth(phase(abs, 19.9, EV.uglyEnd));
  if (v > 0) {
    const g = ctx.createRadialGradient(540, 860, 260, 540, 860, 1000);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.65 * v})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---------------------------------------------------------------- 2B
function shotTyping(ctx: Ctx, abs: number) {
  {
    const typing = inWin(abs, EV.typingA) || inWin(abs, EV.typingB);
    // his eyes are fixed on her 「嗯」 (screen 145, 948): a spotlight on it, the camera creeping closer. The clue he
    // misses — 「对方正在输入...」 in the title bar (screen 293, 95) — gets the video's yellow "look here" pulse,
    // but the camera never goes there.
    const zs = 1 + 0.03 * smooth(phase(abs, EV.uglyEnd, BAR(12)));
    const ux = 390,
      uy = 1182;
    const zx = ux - (145 - 300) * zs,
      zy = uy - (948 - 640) * zs;
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, hisNightChat(abs, { typing })), { who: "boy", right: REST, cx: zx, cy: zy, s: zs, steady: true });
    // the darkness keeps closing in until only her 「嗯」 is left in the light
    const dk = smooth(phase(abs, EV.uglyEnd, BAR(12) - 0.1));
    const g = ctx.createRadialGradient(ux, uy, 120 - 30 * dk, ux, uy, 760 - 430 * dk);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${(0.4 + 0.55 * dk) * smooth(phase(abs, EV.uglyEnd, EV.uglyEnd + 0.3))})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const tx = zx + (293 - 300) * zs,
      ty = zy + (95 - 640) * zs;
    // a soft glow behind the indicator while it shows
    const on = Math.max(...[EV.typingA, EV.typingB].map((w) => smooth(phase(abs, w[0], w[0] + 0.12)) * (1 - smooth(phase(abs, w[1], w[1] + 0.12)))));
    if (on > 0) glow(ctx, tx, ty, 190 * zs, `rgba(255,209,102,${0.35 * on})`);
    for (const w of [EV.typingA, EV.typingB])
      for (const t0 of [w[0] + 0.02, w[0] + 0.32]) {
        const k = phase(abs, t0, t0 + 0.45);
        if (k <= 0 || k >= 1) continue;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(tx, ty, (150 + 90 * k) * zs, (40 + 34 * k) * zs, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
  }
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
      { who: "boy", right, cy: PHONE_CY },
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
  if (abs < EV.curledUp) underBlanket(ctx, abs);
  else {
    shotLitWindow(ctx, abs);
    card(ctx, "00:52", 70, 330, smooth(phase(abs, EV.curledUp + 0.05, EV.curledUp + 0.3)));
  }
}

/** 27.67 → 29.82 "That makes me unhappy": two windows on the same night. */
function shotLitWindow(ctx: Ctx, abs: number) {
  // the same night from outside: his window dark (he has switched everything off), then across the street the
  // only window still lit is hers. Camera: hold on his → pull back to both → push into hers.
  const a = smooth(phase(abs, 28.35, 28.9)),
    b = phase(abs, 28.9, EV.twist);
  const cx0 = 205 + (420 - 205) * a + (580 - 420) * smooth(b),
    cy0 = 790 + (930 - 790) * a + (1025 - 930) * smooth(b);
  const z = (1.9 + 0.1 * phase(abs, EV.curledUp, 28.35)) * (1 - a) + 1.0 * a + 1.9 * b * b;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0b1030"], [1, "#232b57"]]));
  ctx.save();
  camera(ctx, 540, 960, z);
  ctx.translate(540 - cx0, 960 - cy0); // world point (cx0, cy0) at the centre of the frame
  // moon and a few stars
  oval(ctx, 860, 300, 46, 46, 3760, 0.8);
  paint(ctx, "#f3eccf", null);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(hash(i * 3.1) * 1080, hash(i * 5.3) * 640, 3, 3);
  }
  // far blocks
  for (let i = 0; i < 8; i++) {
    const bx = -40 + i * 150,
      bh = 600 + hash(i * 2.7) * 500;
    ctx.fillStyle = "#151a35";
    ctx.fillRect(bx, H - bh, 140, bh);
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 3; c++)
        if (hash(i * 31 + r * 7 + c) > 0.86) {
          ctx.fillStyle = "rgba(255,214,150,0.25)";
          ctx.fillRect(bx + 18 + c * 40, H - bh + 30 + r * 70, 22, 30);
        }
  }
  // his block on the left: his window dark — the poster and the curtain just visible in the moonlight
  poly(ctx, [[-60, 600], [330, 590], [336, 2000], [-60, 2000]], 3770, 1.2);
  paint(ctx, "#1a1f3b", C.ink, 6);
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 2; c++) {
      if (r === 1 && c === 1) continue;
      rr(ctx, 30 + c * 150, 660 + r * 140, 90, 100, 6);
      ctx.fillStyle = "#10142a";
      ctx.fill();
    }
  rr(ctx, 160, 720, 110, 130, 6);
  ctx.fillStyle = "#151c3a";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  rr(ctx, 200, 740, 46, 58, 3);
  ctx.fillStyle = "#2c2442";
  ctx.fill();
  ctx.strokeStyle = "#5d4f86";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(223, 762, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#262a4c";
  ctx.beginPath();
  ctx.moveTo(160, 720);
  ctx.lineTo(186, 720);
  ctx.quadraticCurveTo(176, 790, 192, 850);
  ctx.lineTo(160, 850);
  ctx.fill();
  ctx.strokeStyle = "rgba(200,210,255,0.12)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(170, 840);
  ctx.lineTo(250, 730);
  ctx.stroke();
  // her block, every window dark but one
  poly(ctx, [[380, 640], [760, 630], [770, 2000], [372, 2000]], 3761, 1.2);
  paint(ctx, "#1d2342", C.ink, 6);
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 3; c++) {
      const x = 420 + c * 120,
        y = 700 + r * 140;
      if (r === 2 && c === 1) continue;
      rr(ctx, x, y, 80, 90, 6);
      ctx.fillStyle = "#11152b";
      ctx.fill();
    }
  // the lit window: warm light, a string of fairy lights, a small figure with a glowing phone
  glow(ctx, 580, 1025, 180, "rgba(255,200,140,0.45)");
  rr(ctx, 540, 980, 80, 90, 6);
  ctx.fillStyle = "#ffd59a";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? "#ff8fb1" : "#fff1a8";
    ctx.beginPath();
    ctx.arc(546 + i * 13.5, 990 + Math.sin(i * 1.3) * 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#3a2a2e";
  ctx.beginPath();
  ctx.arc(588, 1030, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(588, 1066, 22, 18, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#bfe0ff";
  ctx.fillRect(582, 1046, 9, 6);
  ctx.restore();
}

function underBlanket(ctx: Ctx, abs: number) {
  // dark fabric dome, his wet eyes
  fillBg(ctx, "#05060f");
  ctx.save();
  camera(ctx, 540, 860, 1.06 + 0.04 * smooth(phase(abs, EV.muffle[0], EV.twist)));
  // a tear wells up and runs down
  drawKid(ctx, 540, 860, 1.45, { body: "head", eyes: "teary", tears: 0.35 + 0.65 * smooth(phase(abs, EV.muffle[0], EV.curledUp)), look: [0, 0.2], mouth: "wobble", brows: "sad" });
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
    shotLitWindow(ctx, abs);
    card(ctx, "00:52", 70, 330, 1 - phase(abs, 29.6, 29.82));
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
    // her phone: the whole paragraph is typed out; her thumb goes to 发送… almost… and pulls back, twice
    const view = herNightView(abs, HER_NIGHT_DRAFT);
    const sb = sendButtonAt(ctx, view);
    const near = (t: number) => Math.max(0, 1 - Math.abs(abs - t) / 0.16);
    const press = Math.max(near(EV.del2[0] + 0.3), near(EV.del2[0] + 0.75));
    const right: FingerPos = { x: sb[0] - 10 + Math.sin(abs * 4) * 8, y: sb[1] + 70 * (1 - press), touch: 0.15 + 0.6 * press };
    const [sx, sy] = shake(abs, 1.2, 9);
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        chatScreen2(c, abs, { ...view, sendHot: press > 0.5 ? press : 0 });
        tearDrops(c, abs, 30.6, 3);
      },
      { who: "girl", right, cx: 540 + sx, cy: PHONE_CY + sy, glowCol: "rgba(255,170,200,0.22)" },
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
    if (abs < EV.uglyEnd) shotPretty(ctx, abs);
    else if (abs < BAR(12)) shotTyping(ctx, abs);
    else if (abs < BAR(14)) shotOff(ctx, abs);
    else shotTwist(ctx, abs);
  });
}
