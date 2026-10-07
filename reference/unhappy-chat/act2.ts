import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, beatAt, blob, camera, card, designScene, fillBg, filtered, glow, hash, inkLine, oval, paint, poly, rr, shake, vgrad } from "./lib/draw";
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
 *  2D one camera move: out of his room through his window — his light goes out — across the street and in through
 *     the only window still lit: hers. She is crying too; the camera keeps creeping in on her face
 *  2E her phone: the paragraph is typed out; her thumb goes to 发送 three times and pulls back — into her memory */

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
  if (abs < EV.blanket) {
    // one quick swipe across 滑动来关机 and the screen goes black
    const slide = smooth(phase(abs, 24.7, 25.0));
    const right: FingerPos = abs < 24.66 ? REST : { x: lerp(115, 485, slide), y: 255, touch: abs < 25.02 ? 1 : 0.2 };
    const black = smooth(phase(abs, 25.0, EV.powerOff + 0.1));
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
    const cover = smooth(phase(abs, EV.blanket + 0.03, EV.muffle[0] - 0.04));
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
  const [m0, m1] = EV.muffle;
  fillBg(ctx, "#05060f");
  ctx.save();
  camera(ctx, 540, 860, 1.06 + 0.05 * smooth(phase(abs, m0, m1)));
  // a tear wells up and runs down
  drawKid(ctx, 540, 860, 1.45, { body: "head", eyes: "teary", tears: 0.35 + 0.65 * smooth(phase(abs, m0, m1 - 0.1)), look: [0, 0.2], mouth: "wobble", brows: "sad" });
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

// ---------------------------------------------------------------- 2D 00:52 — out of his window, in through hers
/** The street at night in world units (= design units at zoom 1): his block on the left, hers across the street.
 *  Every window sits on its block's grid; his and hers are 72×128 (the frame's shape) so either can fill the frame. */
type Rect = { x: number; y: number; w: number; h: number };
const HIS_WIN: Rect = { x: 150, y: 870, w: 72, h: 128 };
const HER_WIN: Rect = { x: 720, y: 1100, w: 72, h: 128 };
const winC = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
/** the zoom at which a window fills the frame, its frame just out of shot */
const Z_IN = 16.2;
/** the room behind the glass grows slower than the window as the camera gets closer (it is further away),
 *  so more of the room shows the closer we get */
const DEPTH = 0.75;
/** each room's centre and scale at the moment its window fills the frame */
const HIS_F0: [number, number] = [620, 920];
const HIS_M0 = 1.08;
const HER_F0: [number, number] = [480, 900];
const HER_M0 = 1.04;
/** where her face is in her room, for the push-in */
const HER_FACE: [number, number] = [322, 770];

/** his room at 00:52: the duvet pulled right over him (a lump on the bed), the desk lamp still on */
function hisRoomNight(ctx: Ctx, abs: number, lampOn: boolean) {
  bedroom(ctx, abs, {});
  // the desk lamp on the headboard shelf (the same one as in act 1)
  inkLine(ctx, [[560, 700], [700, 698]], 3595, 8, "#3a2f4a");
  poly(ctx, [[600, 610], [670, 610], [690, 660], [580, 660]], 3596, 1);
  paint(ctx, lampOn ? "#ffe6a8" : "#8a8070", C.ink, 4);
  inkLine(ctx, [[635, 660], [635, 696]], 3597, 6, "#3a2c22");
  // a tuft of his hair on the pillow; the rest of him curled up under the duvet
  poly(ctx, [[596, 876], [606, 828], [626, 852], [644, 812], [662, 848], [684, 818], [696, 854], [712, 876]], 3733, 1);
  paint(ctx, C.hair, C.ink, 4);
  blob(ctx, [[470, 1010], [560, 900], [700, 852], [860, 800], [1000, 836], [1100, 900], [1170, 950], [1170, 1170], [440, 1180]], 3730, 2);
  paint(ctx, "#33456e", C.ink, 6);
  inkLine(ctx, [[600, 960], [760, 910], [900, 940]], 3731, 4, "#26375a");
  inkLine(ctx, [[560, 1080], [800, 1040], [1060, 1090]], 3732, 4, "#26375a");
  if (lampOn) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 635, 640, 560, "rgba(255,200,120,0.3)");
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(4,6,20,0.66)";
    ctx.fillRect(-60, -60, W + 120, H + 120);
  }
}

/** her room at 00:52: sitting up in bed, crying over her phone. `blur` (px at 1080 wide) softens the room behind her */
function herRoomTears(ctx: Ctx, abs: number, blur = 0) {
  const px = (blur * ctx.canvas.width) / W;
  if (px > 0.3) filtered(ctx, `blur(${px.toFixed(1)}px)`, (c) => herRoom(c, abs, { lights: 1 }), "herRoomBg");
  else herRoom(ctx, abs, { lights: 1 });
  const sob = (Math.sin(abs * 9) + 0.5 * Math.sin(abs * 23)) * 2.5;
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
  // the phone lights her chin and hands
  glow(ctx, 322, 860, 170, "rgba(190,215,255,0.3)");
  lightPool(ctx, 320, 900, 1100, 0.45, "rgba(255,190,140,0.1)");
}

function darkWindow(ctx: Ctx, x: number, y: number) {
  rr(ctx, x, y, 72, 128, 4);
  ctx.fillStyle = "#0f1329";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.fillStyle = "rgba(170,185,255,0.06)";
  ctx.fillRect(x + 9, y + 9, 16, 110);
}

/** a lit window with its room behind the glass, for a camera at zoom Z (see DEPTH) */
function roomWindow(ctx: Ctx, r: Rect, Z: number, m: number, focus: [number, number], room: (c: Ctx) => void, sill: string) {
  const s = (m * Math.pow(Z / Z_IN, DEPTH)) / Z; // world units per room unit
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.clip();
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.scale(s, s);
  ctx.translate(-focus[0], -focus[1]);
  room(ctx);
  ctx.restore();
  // the glass: a soft sheen that fades as we get close enough to go through
  const sheen = clamp(Math.log(Z_IN / Z) / Math.log(3));
  if (sheen > 0) {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h * 0.7);
    g.addColorStop(0, `rgba(255,255,255,${0.18 * sheen})`);
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  rr(ctx, r.x - 6, r.y + r.h, r.w + 12, 6, 2);
  ctx.fillStyle = sill;
  ctx.fill();
}

/** a string of fairy lights over her window, outside */
function fairyString(ctx: Ctx, abs: number, r: Rect) {
  const at = (u: number): [number, number] => [r.x - 8 + u * (r.w + 16), r.y - 7 + Math.sin(u * Math.PI) * 5];
  ctx.strokeStyle = "#1a1530";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const [x, y] = at(i / 12);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const [x, y] = at((i + 0.5) / 7);
    glow(ctx, x, y + 3, 10, i % 2 ? "rgba(255,150,190,0.8)" : "rgba(255,230,150,0.8)", 0.7 + 0.3 * Math.sin(abs * 2.3 + i * 1.7));
    ctx.fillStyle = i % 2 ? "#ffb3cf" : "#fff1a8";
    ctx.beginPath();
    ctx.arc(x, y + 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** the street at 00:52 through a camera centred on world point `cam` at zoom `Z` */
function nightStreet(ctx: Ctx, abs: number, cam: [number, number], Z: number) {
  const lit = abs < EV.hisLightOff;
  fillBg(ctx, "#0b1030");
  ctx.save();
  ctx.translate(540, 960);
  ctx.scale(Z, Z);
  ctx.translate(-cam[0], -cam[1]);
  // sky, moon, stars
  ctx.fillStyle = vgrad(ctx, 200, 1500, [[0, "#0b1030"], [1, "#28315f"]]);
  ctx.fillRect(-400, -300, 2000, 2700);
  glow(ctx, 360, 590, 110, "rgba(243,236,207,0.22)");
  oval(ctx, 360, 590, 30, 30, 3760, 0.5);
  paint(ctx, "#f3eccf", null);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * hash(i * 9.1)})`;
    ctx.fillRect(-220 + hash(i * 3.1) * 1500, 240 + hash(i * 5.3) * 560, 2.5, 2.5);
  }
  // far blocks between the two, every window dark
  for (let i = 0; i < 9; i++) {
    const bx = -180 + i * 170,
      top = 560 + hash(i * 2.7) * 280;
    ctx.fillStyle = "#151a37";
    ctx.fillRect(bx, top, 152, 2400 - top);
  }
  // his block (left)…
  poly(ctx, [[-280, 652], [432, 640], [438, 2400], [-280, 2400]], 3770, 0.6);
  paint(ctx, "#1c2140", C.ink, 4);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 4; c++) {
      const x = -90 + c * 120,
        y = 700 + r * 170;
      if (x !== HIS_WIN.x || y !== HIS_WIN.y) darkWindow(ctx, x, y);
    }
  // …and hers across the street
  poly(ctx, [[548, 712], [1380, 700], [1380, 2400], [542, 2400]], 3771, 0.6);
  paint(ctx, "#221f46", C.ink, 4);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 6; c++) {
      const x = 600 + c * 120,
        y = 760 + r * 170;
      if (x !== HER_WIN.x || y !== HER_WIN.y) darkWindow(ctx, x, y);
    }
  // his window: his room behind the glass, lit until the light goes out
  const [hx, hy] = winC(HIS_WIN);
  if (lit) glow(ctx, hx, hy, 140, "rgba(255,205,140,0.45)");
  roomWindow(ctx, HIS_WIN, Z, HIS_M0, HIS_F0, (c) => hisRoomNight(c, abs, lit), lit ? "#6d5b55" : "#2b3050");
  // hers: the only light still on
  const [gx, gy] = winC(HER_WIN);
  glow(ctx, gx, gy, 150, "rgba(255,190,150,0.48)");
  roomWindow(ctx, HER_WIN, Z, HER_M0, HER_F0, (c) => herRoomTears(c, abs), "#6d5560");
  fairyString(ctx, abs, HER_WIN);
  ctx.restore();
}

/** 26.45 → 28.10 "…live without me / That makes me": the camera backs out of his room through his window; his light
 *  goes out on "me"; then it swings across the street to the only window still lit — hers — and in through it */
function shotWindows(ctx: Ctx, abs: number) {
  const his = winC(HIS_WIN),
    hers = winC(HER_WIN);
  const hold: [number, number] = [his[0] + 40, his[1] + 30];
  const zHold = 2.3;
  let cam: [number, number], Z: number;
  if (abs < EV.herWindow[0]) {
    const out = smooth(phase(abs, EV.leaveRoom, EV.leaveRoom + 0.55));
    Z = Math.exp(lerp(Math.log(Z_IN), Math.log(zHold), out)) * (1 - 0.08 * phase(abs, EV.leaveRoom + 0.55, EV.herWindow[0]));
    cam = [lerp(his[0], hold[0], out), lerp(his[1], hold[1], out)];
  } else {
    // one move: a quick swing across (pulling back a little to show the street), then on in through her window —
    // still moving as it goes through the glass, so the push-in on her carries straight on
    const w = phase(abs, EV.herWindow[0], EV.herWindow[1]);
    const c = smooth(clamp(w / 0.55));
    cam = [lerp(hold[0], hers[0], c), lerp(hold[1], hers[1], c)];
    const z0 = zHold * 0.92;
    const g = -1.4 * w * w * w + 2.4 * w * w; // eases in, leaves at speed 0.6
    Z = Math.exp(Math.log(z0) + Math.log(Z_IN / z0) * g - 0.42 * Math.sin(Math.PI * clamp(w / 0.6)) ** 2);
  }
  nightStreet(ctx, abs, cam, Z);
  card(ctx, "00:52", 70, 330, smooth(phase(abs, EV.leaveRoom + 0.1, EV.leaveRoom + 0.35)) * (1 - phase(abs, EV.twist - 0.3, EV.twist - 0.1)));
}

/** 28.10 → 29.72 "unhappy": carried in through her window, the camera keeps creeping in on her face — slower and
 *  slower, tilting a little, the room going soft behind her and the edges closing in */
function shotHerTears(ctx: Ctx, abs: number) {
  const p = phase(abs, EV.twist, EV.hesitate);
  const f = 0.9 * (1 - Math.pow(1 - p, 2.7)) + 0.1 * p; // picks up the speed it came through the window with
  const S = HER_M0 * Math.pow(2.5 / HER_M0, f);
  const m = smooth(p);
  ctx.save();
  ctx.translate(540, lerp(960, 880, m));
  ctx.rotate(-0.04 * m);
  ctx.scale(S, S);
  ctx.translate(-lerp(HER_F0[0], HER_FACE[0], m), -lerp(HER_F0[1], HER_FACE[1], m));
  herRoomTears(ctx, abs, 6 * m);
  ctx.restore();
  const g = ctx.createRadialGradient(540, 820, 220, 540, 820, 1000);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(6,4,16,${0.6 * m})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- 2E the paragraph she can't send
function herNightView(abs: number, draft: string) {
  const items = fromHer(HISTORY);
  items.push({ t: "msg", me: true, text: "嗯" });
  items.push({ t: "msg", text: GIVE_UP });
  return { title: HIM, time: "00:52", me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: true, keyboard: true };
}

/** 29.72 → 32.79 "I should get a piercing through my heart": her phone, close enough to read the whole paragraph;
 *  then her thumb goes to 发送 — and pulls back — three times on the beat, a little closer each time; never pressed.
 *  Straight on into her memory. */
function shotHesitate(ctx: Ctx, abs: number) {
  const view = herNightView(abs, HER_NIGHT_DRAFT);
  const sb = sendButtonAt(ctx, view);
  let reach = 0;
  [beatAt(61), beatAt(62), beatAt(63)].forEach((t, i) => {
    reach = Math.max(reach, (0.75 + 0.125 * i) * Math.pow(Math.max(0, 1 - Math.abs(abs - t) / 0.26), 0.8));
  });
  const up = smooth(phase(abs, 30.8, 31.02)) * (1 - smooth(phase(abs, 32.42, 32.62)));
  const thumb: FingerPos = {
    x: lerp(450, sb[0] - 6, up) + Math.sin(abs * 23) * 3 * up,
    y: lerp(1040, sb[1] + 120 - 106 * reach, up),
    touch: 0.62 + up * (0.12 + 0.16 * reach),
  };
  // the camera reads down the paragraph, then edges towards 发送 and leans in a little with each try
  const k = smooth(phase(abs, 30.6, 31.4));
  const s = 1.34 + 0.08 * smooth(phase(abs, EV.hesitate, BAR(16))) + 0.02 * reach;
  const fx = lerp(284, 336, k),
    fy = lerp(606, 636, k) + 16 * smooth(phase(abs, EV.hesitate, 30.6));
  const [sx, sy] = shake(abs, 1, 9);
  phoneCloseup(
    ctx,
    abs,
    (c) => {
      chatScreen2(c, abs, view);
      if (reach > 0.02) {
        // 发送 lights up under her thumb… but never gets pressed
        c.save();
        c.globalAlpha = clamp(reach * 1.2);
        c.strokeStyle = "#ffd166";
        c.lineWidth = 5;
        rr(c, sb[0] - 54 - 6 * reach, sb[1] - 40 - 4 * reach, 108 + 12 * reach, 80 + 8 * reach, 16);
        c.stroke();
        c.restore();
      }
      tearDrops(c, abs, 31.35, 2);
    },
    { who: "girl", right: thumb, cx: 540 - (fx - 300) * s + sx, cy: 860 - (fy - 640) * s + sy, s, steady: true, glowCol: "rgba(255,170,200,0.22)" },
  );
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(8), (ctx, abs) => {
    if (abs < EV.uglyEnd) shotPretty(ctx, abs);
    else if (abs < BAR(12)) shotTyping(ctx, abs);
    else if (abs < EV.leaveRoom) shotOff(ctx, abs);
    else if (abs < EV.twist) shotWindows(ctx, abs);
    else if (abs < EV.hesitate) shotHerTears(ctx, abs);
    else shotHesitate(ctx, abs);
  });
}
