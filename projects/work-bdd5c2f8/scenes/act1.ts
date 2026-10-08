import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, beatAt, blinkEyes, blob, camera, card, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, hash, inkLine, lerp2, linesOutsideCentre, oldFilm, oval, paint, poly, rr, shaded, shake, text } from "./lib/draw";
import { drawHand, drawKid } from "./lib/kid";
import { CAST, Person, banner, drawPerson, hahas } from "./lib/people";
import { Msg, SH, SW, chatScreen, lockScreen, phone } from "./lib/phone";
import { bokeh, classroom, corridor, schoolDesk } from "./lib/sets";
import { birthdayDesk } from "./lib/shared";
import { FingerKey, FingerPos, fingerAt, heldHands, onScreen, tapRipple } from "./lib/hand";

/** ACT 1 · 第一遍副歌「他眼里的今天」(0 – 16.96) · 重新设计版.
 *  His world at night is grey (`grade`); only the candle stays warm. The morning is a memory: its own colours, seen
 *  through a film camera (`oldFilm`: grain, a slight weave, dust, random old-screen vertical lines, a mild vignette); everyone else
 *  wears the cover's X face.
 *  0     the flame alone in the dark → pull back: him in a party hat, the room. Outside the window, far below: a few
 *        phone lights and a pink banner (彩蛋 — they are already waiting) → whip into his phone
 *  2.35  his phone: wake (2.61), pull to refresh (3.14) — still 0 条新消息, ✈ top right
 *  4.44  the class group: last message 10:12; he scrolls, nothing
 *  6.79  side button: the screen goes black → push toward his reflection
 *  8.09  the cut into the memory, like an old screen: the picture breaks into flickering vertical lines and a jitter;
 *        under them (8.35) his grey reflection dissolves into the same face, same size, same place — this morning,
 *        in colour (a match cut: it is his memory) — and the lines thin out
 *  8.35  今天上午 10:12, the corridor, one shot: pull back from his face to two planes — him in the foreground on
 *        the left, the three of them in the middle distance on the right, holding up a pink banner (its back to us,
 *        the letters bleeding through) and a gift with the gold "17" balloon. Focus racks to them (8.85); A-Jie looks
 *        up (9.14) — "!" — and in half a beat the banner is rolled up and everything is behind their backs; they
 *        stand in a stiff line, the monitor waves, A-Jie sweats (Everyone is so fake), the balloon bobs back up behind
 *        them. Focus racks back to him (9.85): he drops his eyes, the camera drifts in for the hood
 *  10.70 the hood goes up on "hide away": hands up behind his head, the hood rises behind his hair and snaps over
 *        (11.33), hands back in the pocket. No airplane mode in the memory: if he remembered switching it on, he
 *        couldn't have forgotten it (用户). The only clue is the ✈ in his status bar.
 *  11.74 上课了: the bell over the door rings; the three of them file into the classroom with everything behind
 *        their backs (the "17" balloon floats in after the gift); from behind, hood up, he follows them in
 *  12.79 the classroom, the slip: A-Jie jumps up mid-sentence (his bubble is a birthday cake) and claps a hand over
 *        his own mouth (13.31) — the class laughs at A-Jie (小雨 explains it after the twist); he flinches and sinks,
 *        sure it's at him. A-Jie's phone: 惊喜策划群（不含寿星）, pink frosting on its case
 *  14.87 how it feels to him: they loom in from the edges, the room goes dark, 哈哈哈, tears → slam → 哈 */
const T0 = 0;
const LOCK = beatAt(4); // 2.35
const WAKE = beatAt(4.5); // 2.61
const PULL = beatAt(5.5); // 3.14
const NUDGE = beatAt(7); // 3.92
const CHAT = beatAt(8); // 4.44
const OFF = beatAt(12.5); // 6.79
const REW = beatAt(15); // 8.09 the old-screen cut into the memory (two beats of vertical lines)
const MEM = beatAt(16); // 8.61
const NOTICE = beatAt(17); // 9.14
const HOOD = beatAt(20); // 10.70
const LAUGH = beatAt(24); // 12.79
const CLOSE = beatAt(28); // 14.87
const END = beatAt(32); // 16.96
/** saturation of his world before the twist */
const GREY = 0.38;

// ---------------------------------------------------------------- 0 – 2.35 the candle
function shotCandle(ctx: Ctx, abs: number) {
  // the flame centred and huge → pull back (fast, then settling) to the cold-open framing; then the whip into the phone
  const k = easeOut(phase(abs, 0, 1.75));
  const whip = easeIn(phase(abs, LOCK - 0.3, LOCK));
  const zoom = 4.2 + (1.04 - 4.2) * k + whip * 1.6;
  const cx = 390 + 150 * k + whip * 300,
    cy = 935 - 35 * k + whip * 300;
  const [hx, hy, hr] = handheld(abs, 5 * k * (1 - whip), 1);
  const kid = { eyes: blinkEyes(abs, 3, "sleepy"), look: [-0.55, 0.7] as [number, number], headY: Math.sin(abs * 1.6) * 3 };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, cx, cy, zoom, hr, hx + 150 * (1 - k), hy + 25 * (1 - k));
    birthdayDesk(c, abs, { lit: 1, kid, layer, clue: 1 });
    c.restore();
  };
  const draw = (c: Ctx) => {
    grade(c, GREY, (g) => shot(g, "scene"));
    shot(c, "flame");
  };
  const blurPx = 14 * Math.sin(Math.PI * whip);
  if (blurPx > 0.6) filtered(ctx, `blur(${blurPx.toFixed(1)}px)`, draw, "whip");
  else draw(ctx);
}

// ---------------------------------------------------------------- 2.35 – 4.44 his phone
// right thumb [time, screen x, screen y, touch]: tap to wake, pull down to refresh, then swipe up into WeChat
const LOCK_FINGER: FingerKey[] = [
  [LOCK, 450, 960, 0.2],
  [WAKE - 0.16, 405, 810, 0],
  [WAKE - 0.04, 390, 780, 1],
  [WAKE + 0.1, 390, 780, 1],
  [WAKE + 0.26, 450, 960, 0.2],
  [PULL - 0.22, 440, 320, 0],
  [PULL - 0.1, 430, 300, 1],
  [PULL + 0.4, 430, 410, 1],
  [PULL + 0.46, 430, 410, 1],
  [PULL + 0.64, 450, 960, 0.2],
  [CHAT - 0.36, 450, 960, 0.2],
  [CHAT - 0.24, 300, 1190, 0],
  [CHAT - 0.16, 300, 1180, 1],
  [CHAT, 300, 700, 1],
];

function shotLock(ctx: Ctx, abs: number) {
  const wake = smooth(phase(abs, WAKE, WAKE + 0.22));
  const pull = 110 * smooth(phase(abs, PULL - 0.1, PULL + 0.38)) * (1 - smooth(phase(abs, PULL + 0.44, PULL + 0.8)));
  const spinning = abs > PULL + 0.05 && abs < PULL + 0.85;
  const nudge = abs > NUDGE ? Math.sin((abs - NUDGE) * 40) * 10 * Math.exp(-(abs - NUDGE) * 6) : 0;
  const unlock = easeIn(phase(abs, CHAT - 0.16, CHAT));
  const [hx, hy, hr] = handheld(abs, 4, 2);
  const s = 0.76 + 0.03 * easeInOut(phase(abs, LOCK, CHAT));
  const cx = 540 + nudge + hx,
    cy = 800 + hy,
    rot = -0.02 + hr;
  grade(ctx, GREY, (c) => {
    fillBg(c, "#20160f");
    glow(c, 120, 1100, 900, "rgba(255,160,70,0.3)");
    bokeh(c, abs, 12, 101, 0.55, ["255,190,110", "255,160,90", "200,170,255"]);
    phone(c, cx, cy, s, rot, (p) => {
      p.save();
      p.translate(0, pull - unlock * SH);
      lockScreen(p, { time: "23:58", airplane: true, battery: 0.21 }, { note: "0 条新消息", noteAlpha: smooth(phase(abs, WAKE + 0.3, WAKE + 0.55)) });
      p.restore();
      if (spinning) {
        p.save();
        p.translate(SW / 2, 70 + pull * 0.6);
        p.rotate(abs * 10);
        p.strokeStyle = "#fff";
        p.lineWidth = 5;
        p.beginPath();
        p.arc(0, 0, 18, 0, Math.PI * 1.5);
        p.stroke();
        p.restore();
      }
      if (unlock > 0) {
        // WeChat coming up from under the lock screen
        p.save();
        p.translate(0, SH * (1 - unlock));
        chatScreen(p, { time: "23:58", airplane: true }, "高二(3)班 (46)", CHAT_MSGS, "", false);
        p.restore();
      }
      p.fillStyle = `rgba(0,0,0,${0.82 * (1 - wake)})`;
      p.fillRect(0, 0, SW, SH);
    });
    const [rx, ry] = onScreen(cx, cy, s, 390, 780);
    tapRipple(c, rx, ry, phase(abs, WAKE, WAKE + 0.45), 1.2);
    heldHands(c, cx, cy, s, rot, fingerAt(abs, LOCK_FINGER)!);
  });
}

// ---------------------------------------------------------------- 4.44 – 8.61 the class group → screen off → the reflection
const CHAT_MSGS: Msg[] = [
  { from: "班长", text: "数学作业记得交", avatar: CAST.monitor, time: "前天 21:10" },
  { from: "小雨", text: "收到", avatar: CAST.yu },
  { from: "阿杰", text: "明天都在吗？", avatar: CAST.jie },
  { from: "大刘", text: "收到收到", avatar: CAST.a },
  { from: "阿杰", text: "明天都早点来！！", avatar: CAST.jie, time: "昨天 22:30" },
  { from: "班长", text: "收到收到", avatar: CAST.monitor },
  { from: "班长", text: "明天记得交数学作业", avatar: CAST.monitor, time: "10:12" },
  { from: "大刘", text: "收到", avatar: CAST.a },
];
// The list scrolls like a real phone: while the thumb is down the messages move exactly with it; let go while moving
// and the list keeps sliding and slows down by itself (momentum, exponential decay); flick back to the newest
// message and it overshoots past the end, stretches (rubber band) and springs back. Closed-form, so it is a pure
// function of time: drag 1 = p² (accelerating, lifted at speed), momentum s = v·τ·(1−e^(−t/τ)), overshoot = a
// critically damped spring launched with the speed it hit the end with (−v·t·e^(−kt)).
const T_DOWN = CHAT + 0.3; // 4.74 thumb down
const T_REL1 = T_DOWN + 0.42; // 5.16 lifted while still moving → the list slides on into yesterday's messages
const D1 = 180,
  TAU1 = 0.18,
  V1 = (2 * D1) / (T_REL1 - T_DOWN);
const T_FLICK = CHAT + 1.3; // 5.74 the flick back up
const FLICK_T = 0.16,
  D2 = 150,
  TAU2 = 0.22,
  SPRING = 8,
  V2 = (2 * D2) / FLICK_T;

function chatScroll(abs: number): number {
  if (abs < T_DOWN) return 0;
  if (abs < T_REL1) return D1 * ((abs - T_DOWN) / (T_REL1 - T_DOWN)) ** 2;
  const coast = (t: number) => D1 + V1 * TAU1 * (1 - Math.exp(-(t - T_REL1) / TAU1));
  if (abs < T_FLICK) return coast(abs);
  const s0 = coast(T_FLICK);
  if (abs < T_FLICK + FLICK_T) return s0 - D2 * ((abs - T_FLICK) / FLICK_T) ** 2;
  const s1 = s0 - D2,
    dt = abs - T_FLICK - FLICK_T;
  // momentum until it reaches the newest message (scroll 0)
  const hit = s1 < V2 * TAU2 ? -TAU2 * Math.log(1 - s1 / (V2 * TAU2)) : Infinity;
  if (dt < hit) return s1 - V2 * TAU2 * (1 - Math.exp(-dt / TAU2));
  // past the end: stretch and spring back
  const vHit = V2 * Math.exp(-hit / TAU2),
    t = dt - hit;
  return -vHit * t * Math.exp(-SPRING * t);
}

function chatThumb(abs: number): FingerPos {
  const s = chatScroll(abs);
  if (abs < T_DOWN)
    return fingerAt(abs, [
      [CHAT, 300, 700, 1],
      [CHAT + 0.1, 300, 670, 0.2],
      [T_DOWN - 0.06, 300, 520, 0.2],
      [T_DOWN, 300, 520, 1],
    ])!;
  if (abs < T_REL1) return { x: 300, y: 520 + s, touch: 1 };
  if (abs < T_FLICK)
    return fingerAt(abs, [
      [T_REL1, 300, 520 + D1, 1],
      [T_REL1 + 0.1, 306, 520 + D1 + 40, 0.2],
      [T_FLICK - 0.12, 300, 900, 0.2],
      [T_FLICK - 0.03, 300, 900, 1],
    ])!;
  const s0 = chatScroll(T_FLICK);
  if (abs < T_FLICK + FLICK_T) return { x: 300, y: 900 - (s0 - s), touch: 1 };
  const ry = 900 - D2;
  return fingerAt(abs, [
    [T_FLICK + FLICK_T, 300, ry, 1],
    [T_FLICK + FLICK_T + 0.1, 300, ry - 60, 0.2],
    [OFF - 0.3, 560, 430, 0.2],
    [OFF - 0.04, 604, 380, 1],
    [OFF + 0.14, 604, 380, 1],
    [OFF + 0.4, 450, 960, 0.2],
    [MEM, 450, 960, 0.2],
  ])!;
}

function shotChat(ctx: Ctx, abs: number) {
  // drag down to look at older messages (yesterday's), flick back: nothing new since 10:12
  const scroll = chatScroll(abs);
  const off = abs >= OFF;
  const dive = 0.45 * easeIn(phase(abs, OFF + 0.2, REW));
  const [hx, hy, hr] = handheld(abs, 4 * (1 - dive), 2);
  const s = 0.79,
    cx = 540 + hx,
    cy = 800 + hy,
    rot = -0.02 + hr;
  // his reflected eye in the black glass (reflection drawn at screen 300, 560 × 1.05)
  const ex = cx + (250 - SW / 2) * s,
    ey = cy + (598 - SH / 2) * s;
  grade(ctx, GREY, (c) => {
    fillBg(c, "#20160f");
    glow(c, 120, 1100, 900, "rgba(255,160,70,0.3)");
    bokeh(c, abs, 12, 101, 0.55, ["255,190,110", "255,160,90", "200,170,255"]);
    c.save();
    camera(c, ex, ey, 1 + 3.6 * dive, 0, (540 - ex) * dive, (960 - ey) * dive);
    phone(c, cx, cy, s, rot, (p) => {
      if (!off) {
        chatScreen(p, { time: "23:58", airplane: true }, "高二(3)班 (46)", CHAT_MSGS, "", false, { scroll });
        return;
      }
      p.fillStyle = "#060608";
      p.fillRect(0, 0, SW, SH);
      // his face in the black glass, mirrored: a dim reflection — drawn solid, then darkened (not see-through, which
      // read as a ghost)
      p.save();
      p.translate(SW, 0);
      p.scale(-1, 1);
      drawKid(p, SW - 300, 560, 1.05, { body: "bust", hat: true, eyes: blinkEyes(abs, 3, "sleepy"), look: [0, 0.3], arms: "phone" });
      p.restore();
      p.fillStyle = `rgba(4,4,6,${(0.97 - 0.25 * smooth(phase(abs, OFF, OFF + 0.3))).toFixed(3)})`;
      p.fillRect(0, 0, SW, SH);
      const g = p.createLinearGradient(0, 0, SW, SH);
      g.addColorStop(0.18, "rgba(255,255,255,0)");
      g.addColorStop(0.3, "rgba(255,255,255,0.07)");
      g.addColorStop(0.42, "rgba(255,255,255,0)");
      p.fillStyle = g;
      p.fillRect(0, 0, SW, SH);
    });
    heldHands(c, cx, cy, s, rot, chatThumb(abs));
    c.restore();
  });
}

// ---------------------------------------------------------------- 8.09 – 8.61 the old-screen cut into the memory
const CUT = REW + 0.26; // 8.35 his reflection dissolves into his face this morning
/** Where his reflected face sits on screen in shotChat: [x, y, scale, rotation] (same maths as shotChat's camera,
 *  phone and mirrored drawKid at screen (300, 560) × 1.05), so the memory can start on exactly the same face. */
function reflectionAt(abs: number): [number, number, number, number] {
  const dive = 0.45 * easeIn(phase(abs, OFF + 0.2, REW));
  const [hx, hy, hr] = handheld(abs, 4 * (1 - dive), 2);
  const s = 0.79,
    cx = 540 + hx,
    cy = 800 + hy,
    rot = -0.02 + hr;
  const ex = cx + (250 - SW / 2) * s,
    ey = cy + (598 - SH / 2) * s;
  const z = 1 + 3.6 * dive;
  const lx = (300 - SW / 2) * s,
    ly = (560 - SH / 2) * s;
  const px = cx + lx * Math.cos(rot) - ly * Math.sin(rot),
    py = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
  return [ex + (540 - ex) * dive + z * (px - ex), ey + (960 - ey) * dive + z * (py - ey), z * s * 1.05, rot];
}

/** An old screen's vertical lines: the present (his reflection) breaks up into flickering vertical scratches and a
 *  jitter; underneath them the grey reflection dissolves into the same face this morning, and the lines thin out
 *  as the memory settles. */
function shotOldScreen(ctx: Ctx, abs: number) {
  const p = phase(abs, REW, MEM);
  const dens = Math.sin(Math.PI * Math.min(1, p * 1.15));
  const f = Math.floor(abs * 24);
  const mix = smooth(phase(abs, CUT - 0.06, CUT + 0.08));
  ctx.save();
  ctx.translate((hash(f * 1.9) - 0.5) * 7 * dens, (hash(f * 2.7) - 0.5) * 3 * dens);
  if (mix < 1) shotChat(ctx, abs);
  if (mix > 0) filtered(ctx, "none", (c) => oldFilm(c, abs, (cc) => corridorScene(cc, abs)), "xfade", mix);
  ctx.restore();
  // the vertical lines: dark and light, mostly thin, a few thick, jumping every frame — faint inside a circle in the
  // middle of the screen, stronger the further out they run
  const n = Math.floor(8 + 40 * dens);
  linesOutsideCentre(ctx, (c) => {
    for (let k = 0; k < n; k++) {
      c.globalAlpha = (0.3 + 0.6 * hash(f * 2.3 + k)) * (0.35 + 0.65 * dens);
      c.fillStyle = hash(k * 9.1 + f) > 0.45 ? "#0c0c0c" : "#f3efe6";
      c.fillRect(hash(f * 3.1 + k * 7.3) * W, -60, 1 + hash(f + k * 1.7) * (k % 6 === 0 ? 7 : 2.5), H + 120);
    }
  });
  // and the screen flickers
  ctx.save();
  ctx.globalAlpha = 0.3 * dens * hash(f * 5.7);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.restore();
}

// ---------------------------------------------------------------- 8.61 – 10.70 the corridor (memory)
/** A gold foil "17" balloon on a string. */
function balloon17(c: Ctx, x: number, y: number, s: number, abs: number, tie: Pt) {
  inkLine(c, [[x, y + 80 * s], [(x + tie[0]) / 2 + Math.sin(abs * 2) * 10, (y + tie[1]) / 2], tie], 901, 2.2, "#8a7a5a");
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(abs * 1.6) * 0.07);
  c.scale(s, s);
  c.font = `400 180px ${F.marker}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.lineWidth = 18;
  c.strokeStyle = C.ink;
  c.strokeText("17", 0, 0);
  const g = c.createLinearGradient(-70, -90, 70, 90);
  g.addColorStop(0, "#fff3b0");
  g.addColorStop(0.45, "#f2c14e");
  g.addColorStop(1, "#b8822a");
  c.fillStyle = g;
  c.fillText("17", 0, 0);
  c.globalAlpha = 0.65;
  c.fillStyle = "#fff";
  c.beginPath();
  c.ellipse(-40, -48, 8, 20, -0.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** A small gift box (sky blue, pink ribbon and bow), top centre at (x, y). */
function giftBox(c: Ctx, x: number, y: number, w: number, h: number) {
  poly(c, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]], 941, 1.2);
  paint(c, "#7fc8e8", C.ink, 5);
  poly(c, [[x - 10, y], [x + 10, y], [x + 10, y + h], [x - 10, y + h]], 942, 0.6);
  paint(c, "#ff7fb0", C.ink, 3);
  poly(c, [[x - w / 2, y + h * 0.42], [x + w / 2, y + h * 0.42], [x + w / 2, y + h * 0.42 + 18], [x - w / 2, y + h * 0.42 + 18]], 943, 0.6);
  paint(c, "#ff7fb0", C.ink, 3);
  for (const side of [-1, 1]) {
    oval(c, x + side * 20, y - 12, 20, 12, 944 + side, 0.6);
    paint(c, "#ff9cc3", C.ink, 4);
  }
}

/** A comic "!" popping over a head. */
function bang(c: Ctx, x: number, y: number, k: number, rot: number) {
  if (k <= 0.01) return;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k);
  poly(c, [[-13, -66], [13, -66], [6, 4], [-6, 4]], 931, 1);
  paint(c, "#ffe45c", C.ink, 5);
  oval(c, 0, 26, 10, 10, 932, 0.5);
  paint(c, "#ffe45c", C.ink, 5);
  c.restore();
}

/** A sweat drop. */
function sweatDrop(c: Ctx, x: number, y: number, a: number) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.beginPath();
  c.moveTo(x, y - 26);
  c.quadraticCurveTo(x + 13, y - 4, x + 13, y + 6);
  c.arc(x, y + 6, 13, 0, Math.PI);
  c.quadraticCurveTo(x - 13, y - 4, x, y - 26);
  c.closePath();
  c.fillStyle = "#bfe6ff";
  c.fill();
  c.strokeStyle = C.ink;
  c.lineWidth = 4;
  c.stroke();
  c.restore();
}

// him in the corridor (head centre, scale): big, in the foreground on the left; his feet are below the frame
const KX = 300,
  KY = 860,
  KS = 1.45;
// the three of them in the middle distance on the right (head centres, scale): feet on the floor line (y≈1130)
const MON = 600,
  JIE = 790,
  DD = 960,
  HY = 700,
  HS = 0.6;
// after hiding everything: arms straight down, standing stiffly to attention ("nothing to see here") — hands
// behind the back read as hands on hips from the front
const BACK_L: Pt = [-112, 352],
  BACK_R: Pt = [112, 352];

function huddle(c: Ctx, abs: number) {
  const hide = easeInOut(phase(abs, NOTICE + 0.06, NOTICE + 0.32)); // everything goes behind their backs
  const snap = (t: number) => smooth(phase(abs, t, t + 0.1)); // heads snap round to him
  const hop = (t: number) => -16 * Math.sin(Math.PI * phase(abs, t, t + 0.22)); // a startled little jump
  const busy = (i: number) => (abs < NOTICE ? Math.sin(abs * 7 + i * 2) * 3 : 0);
  const at = (x: number, local: Pt): Pt => [x + local[0] * HS, HY + local[1] * HS];
  // 彩蛋: the gold "17" balloon, tied to the gift — yanked down with it, and bobbing straight back up behind them
  const yank = Math.sin(Math.PI * phase(abs, NOTICE + 0.1, NOTICE + 0.75));
  const tie = lerp2(at(DD, [0, 222]), at(DD, [150, 300]), hide);
  balloon17(c, 985 + 10 * hide, 470 + 190 * yank + Math.sin(abs * 1.7) * 6, 0.6, abs, tie);
  // the gift and the rolled-up banner, once hidden, peek out from behind their backs
  if (hide >= 0.55) {
    c.save();
    c.translate(...at(DD, [140, 250]));
    c.rotate(0.25);
    c.scale(HS, HS);
    giftBox(c, 0, 0, 140, 110);
    c.restore();
    c.save();
    c.translate(...at(JIE, [110, 120]));
    c.rotate(-0.75);
    c.scale(HS, HS);
    banner(c, 0, 0, 160, 0, "", 510, F.cn);
    c.restore();
  }
  // the monitor: holds the left end of the banner, looking down at it → hands behind her back → a stiff little wave
  const wave = smooth(phase(abs, 9.48, 9.62)) * (1 - smooth(phase(abs, 10.3, 10.5)));
  drawPerson(c, MON, HY + hop(NOTICE + 0.08) + busy(0), HS, {
    ...CAST.monitor,
    body: "full",
    turn: 0.4 + (-0.6 - 0.4) * snap(NOTICE + 0.08),
    tilt: 0.1 * (1 - hide),
    handL: wave > 0 ? lerp2([-120, 320], [-150 + Math.sin(abs * 16) * 22, -40], wave) : lerp2([-125, 290], BACK_L, hide),
    shapeL: wave > 0.3 ? "open" : hide > 0.6 ? "relax" : "hold",
    bendL: wave > 0.3 ? 1 : -1,
    handR: lerp2([60, 278], BACK_R, hide),
    shapeR: hide > 0.6 ? "relax" : "hold",
  });
  // A-Jie: the right end of the banner → the first to look up → sweating
  drawPerson(c, JIE, HY + hop(NOTICE) + busy(1), HS, {
    ...CAST.jie,
    body: "full",
    turn: -0.35 + (-0.75 + 0.35) * snap(NOTICE),
    tilt: -0.1 * (1 - hide),
    handL: lerp2([-60, 278], BACK_L, hide),
    shapeL: hide > 0.6 ? "relax" : "hold",
    handR: lerp2([125, 290], BACK_R, hide),
    shapeR: hide > 0.6 ? "relax" : "hold",
  });
  // the third: holds the gift at her chest → behind her back
  drawPerson(c, DD, HY + hop(NOTICE + 0.14) + busy(2), HS, {
    ...CAST.d,
    body: "full",
    turn: -0.3 + (-0.55 + 0.3) * snap(NOTICE + 0.14),
    handL: lerp2([-64, 252], BACK_L, hide),
    shapeL: hide > 0.6 ? "relax" : "hold",
    handR: lerp2([64, 252], BACK_R, hide),
    shapeR: hide > 0.6 ? "relax" : "hold",
    holding: hide < 0.55 ? (h) => giftBox(h, 0, 222 + 60 * hide, 140, 110) : undefined,
  });
  // the banner, held up in front of them with its back to us (the letters bleed through, mirrored) — rolled up and
  // whisked behind A-Jie when he comes
  if (hide < 0.55) {
    const open = 1 - hide / 0.55;
    const bx = 695 + (JIE + 70 - 695) * (1 - open),
      by = 905;
    c.save();
    c.translate(bx, by);
    c.scale(HS, HS);
    banner(c, 0, 0, 567 * open, 1, "", 512, F.cn);
    if (open > 0.4)
      for (let i = 0; i < 4; i++) {
        const lx = (-1.5 + i) * 120 * open;
        inkLine(c, [[lx - 34, -26], [lx + 6, -10], [lx - 20, 14], [lx + 30, 30]], 950 + i, 12, `rgba(196,64,124,${(0.4 * (open - 0.4)).toFixed(2)})`);
      }
    c.restore();
  }
  // speed lines as it goes
  const whoosh = Math.sin(Math.PI * hide);
  if (whoosh > 0.05) {
    c.save();
    c.globalAlpha = whoosh;
    for (let i = 0; i < 4; i++) {
      const y = 860 + i * 26,
        x = 600 + 200 * hide - i * 18;
      inkLine(c, [[x - 110, y], [x - 50, y + 1], [x, y]], 960 + i, 4);
    }
    c.restore();
  }
  // "!" over each head as they notice him, then A-Jie's sweat drop
  const out = 1 - smooth(phase(abs, 9.58, 9.74));
  [JIE, MON, DD].forEach((x, i) => {
    const t = NOTICE + i * 0.07;
    const k = abs < t ? 0 : easeOut(phase(abs, t, t + 0.1)) * (1 + 0.25 * Math.sin(Math.PI * phase(abs, t, t + 0.2))) * out;
    bang(c, x + 30, HY - 175, k, (i - 1) * 0.15);
  });
  const drip = phase(abs, 9.45, 10.4);
  sweatDrop(c, JIE + 78, HY - 40 + 26 * drip, smooth(phase(abs, 9.45, 9.55)) * (1 - smooth(phase(abs, 10.25, 10.45))));
}

function kidNow(c: Ctx, abs: number) {
  const seen = smooth(phase(abs, 8.72, 8.95)); // he looks over at them
  const down = smooth(phase(abs, 9.85, 10.15)); // …and drops his eyes
  const hid = abs >= NOTICE + 0.12;
  drawKid(c, KX, KY, KS, {
    body: "full",
    legs: "stand",
    arms: "pockets",
    turn: 0.35 * seen * (1 - down) + 0.08 * down,
    look: [0.85 * seen * (1 - down) + 0.15 * down, 0.3 - 0.2 * seen + 0.55 * down],
    // one blink, placed after they have hidden everything (a random one landed right as he looked over)
    eyes: down > 0.5 ? "sad" : abs > 9.44 && abs < 9.56 ? "shut" : hid ? "open" : "sleepy",
    brows: down > 0.5 ? "sad" : hid ? "worried" : undefined,
    mouth: hid ? "frown" : "flat",
    headY: Math.sin(abs * 1.7) * 3 + 10 * down,
  });
}

/** depth of field: blur a plane by `px` (skipped when sharp) */
function focus(c: Ctx, px: number, draw: (c: Ctx) => void, key: string) {
  if (px > 0.3) filtered(c, `blur(${px.toFixed(1)}px)`, draw, key);
  else draw(c);
}

function corridorScene(c: Ctx, abs: number) {
  // one shot: starts on exactly the face that was in the black glass, pulls back to the two planes, and at the end
  // drifts in on him for the hood
  const pull = easeInOut(phase(abs, CUT, 9.05));
  const drift = easeInOut(phase(abs, 9.9, HOOD));
  const [x0, y0, s0, r0] = reflectionAt(CUT);
  const z = (s0 / KS + (1 - s0 / KS) * pull) * (1 + 0.06 * drift);
  const [hx, hy, hr] = handheld(abs, 4 * pull, 3);
  // (ends with him centred and his face the size it is in the hood shot, so the cut on "hide away" is seamless)
  const pan = 240 * drift;
  const ax = x0 + (KX - x0) * pull + pan + hx,
    ay = y0 + (KY - y0) * pull - 10 * drift + hy;
  // focus: on him; racked to them as they come into view; back to him when he looks down
  const onThem = smooth(phase(abs, 8.85, 9.05)) * (1 - smooth(phase(abs, 9.85, 10.1)));
  c.save();
  c.translate(ax, ay);
  c.rotate(r0 * (1 - pull) + hr);
  c.scale(z, z);
  c.translate(-KX, -KY);
  // parallax on the final pan: the wall moves a quarter as much as he does, they a little more (and the wall's left
  // edge never comes into frame)
  const par = (k: number, draw: (b: Ctx) => void) => (b: Ctx) => {
    b.save();
    b.translate((-pan * k) / z, 0);
    draw(b);
    b.restore();
  };
  filtered(c, "blur(1.8px)", par(0.75, (b) => corridor(b, abs)), "bg");
  focus(c, 3 * (1 - onThem), par(0.4, (b) => huddle(b, abs)), "huddle");
  focus(c, 4.5 * onThem, (b) => kidNow(b, abs), "kidFocus");
  c.restore();
}

function shotCorridor(ctx: Ctx, abs: number) {
  oldFilm(ctx, abs, (c) => corridorScene(c, abs));
  card(ctx, "今天上午 10:12", 70, 330, smooth(phase(abs, MEM + 0.1, MEM + 0.4)) * (1 - phase(abs, 10.5, HOOD)));
}

// ---------------------------------------------------------------- 10.70 – 12.79 hide away: the hood, then he walks off
const AWAY = beatAt(22); // 11.74 cut to behind him: hood up, walking away to the classroom door
const HOOD_ON = 11.33;
/** The hood as a shell around his head (his head-centre units, like kid.ts' HOOD_BACK): from the front it is the
 *  dark inside rising up behind his hair as he pulls it over; from behind it covers his head (with a seam). */
const HOOD_SHELL: Pt[] = [[-184, 70], [-198, -90], [-132, -222], [0, -256], [132, -222], [198, -90], [184, 70], [160, 190], [-160, 190]];
function hoodShell(c: Ctx, x: number, y: number, s: number, dy: number, back: boolean) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (!back) {
    // rising from behind his shoulders: nothing of it shows below his neck
    c.beginPath();
    c.rect(-400, -600, 800, 630); // (cut at his hair line, where his mop hides the edge)
    c.clip();
  } else c.scale(0.88, 0.9); // from behind it sits snug on his head, narrower than his shoulders
  c.translate(0, dy);
  shaded(c, () => blob(c, HOOD_SHELL, 1311, 1.8), back ? C.hoodie : C.hoodieDark, () => {
    blob(c, [[70, -210], [198, -90], [184, 70], [160, 190], [90, 190], [120, -40]], 1312, 1.5);
    paint(c, back ? C.hoodieDark : "rgba(0,0,0,0.25)", null);
  }, C.ink, 5.5);
  if (back) {
    inkLine(c, [[0, -252], [5, -90], [0, 120]], 1313, 3, C.hoodieDark);
    inkLine(c, [[-150, 60], [-120, 150]], 1314, 2.6, C.hoodieDark);
  }
  c.restore();
}

/** Front: hands go up behind his head (elbows out), the hood comes up behind his hair and snaps over on "hide";
 *  his hands drop back into the pocket and he sinks into it. The corridor and the three of them blurred behind him. */
function hoodScene(c: Ctx, abs: number) {
  const k = easeOut(phase(abs, HOOD, HOOD + 0.28));
  const raise = smooth(phase(abs, HOOD + 0.06, 10.98)); // hands up behind his head
  const rise = easeInOut(phase(abs, 10.95, 11.27)); // the hood comes up behind his hair
  const up = abs >= HOOD_ON;
  const drop = smooth(phase(abs, HOOD_ON + 0.05, HOOD_ON + 0.3)); // hands back into the pocket
  const settle = up ? Math.exp(-(abs - HOOD_ON) * 9) * Math.sin((abs - HOOD_ON) * 30) * 10 : 0;
  const [hx, hy, hr] = handheld(abs, 5, 4);
  c.save();
  // (starts at the size the corridor shot ends on), then a slow push as he sinks into the hood
  camera(c, 540, 820, 1.2 + 0.07 * easeInOut(phase(abs, HOOD, AWAY)), hr, hx, hy);
  // the corridor behind him, far out of focus — they are still standing there
  filtered(
    c,
    "blur(6px)",
    (b) => {
      b.save();
      camera(b, 480, 760, 1.45);
      corridor(b, abs);
      huddle(b, abs);
      b.restore();
    },
    "bg",
  );
  const ky = 790 + (1 - k) * 60;
  const headY = settle + 8 * smooth(phase(abs, HOOD_ON + 0.05, HOOD_ON + 0.25)) + 6 * smooth(phase(abs, 11.5, AWAY));
  const t = up ? 1 - drop : raise;
  // pocket → out to the side → up behind his head (straight up from the pocket crossed his arms over his chest)
  const hand = (side: number): Pt =>
    t < 0.5 ? lerp2([side * 66, 372], [side * 178, 150], t * 2) : lerp2([side * 178, 150], [side * 112, -64], (t - 0.5) * 2);
  if (!up && rise > 0) hoodShell(c, 540, ky, 1.25, headY + 230 - 280 * rise, false);
  drawKid(c, 540, ky, 1.25, {
    body: "full",
    legs: "stand",
    hood: up,
    arms: "custom",
    handL: hand(-1),
    handR: hand(1),
    shapeL: t > 0.2 ? "fist" : "hidden",
    shapeR: t > 0.2 ? "fist" : "hidden",
    eyes: "sad",
    brows: "sad",
    look: up ? [0, 0.9] : [0.25, 0.55],
    mouth: "frown",
    headY,
  });
  if (up) {
    // the hood's shadow falls over his eyes
    const g = c.createLinearGradient(0, 700, 0, 900);
    g.addColorStop(0, "rgba(20,12,4,0.5)");
    g.addColorStop(1, "rgba(20,12,4,0)");
    c.save();
    c.globalAlpha = smooth(phase(abs, 11.33, 11.5));
    c.beginPath();
    c.ellipse(540, 800, 170, 130, 0, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = g;
    c.fillRect(360, 640, 360, 320);
    c.restore();
  }
  if (abs > 11.3 && abs < 11.6) {
    const f = phase(abs, 11.3, 11.6);
    c.save();
    c.globalAlpha = 1 - f;
    c.strokeStyle = C.ink;
    c.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.4;
      c.beginPath();
      c.moveTo(540 + Math.cos(a) * (330 + f * 60), 600 + Math.sin(a) * (330 + f * 60));
      c.lineTo(540 + Math.cos(a) * (380 + f * 90), 600 + Math.sin(a) * (380 + f * 90));
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}

// 上课了 (用户): the bell over the classroom door rings, the three of them file back into the classroom with
// everything still behind their backs, and he follows them in, hood up
const DOOR = { x0: 400, x1: 640, y0: 360, y1: 1080, cx: 520 };

/** A red school bell on the wall, shaking while it rings (ring 0..1). */
function schoolBell(c: Ctx, x: number, y: number, ring: number, abs: number) {
  poly(c, [[x - 30, y - 46], [x + 30, y - 46], [x + 30, y - 30], [x - 30, y - 30]], 1401, 0.6);
  paint(c, "#9a9a9a", C.ink, 3.5);
  c.save();
  c.translate(x, y - 30);
  c.rotate(Math.sin(abs * 45) * 0.16 * ring);
  oval(c, 0, 44, 10, 10, 1402, 0.5);
  paint(c, "#555", C.ink, 3);
  c.beginPath();
  c.moveTo(-40, 34);
  c.quadraticCurveTo(-40, -6, 0, -6);
  c.quadraticCurveTo(40, -6, 40, 34);
  c.closePath();
  c.fillStyle = "#e8343c";
  c.fill();
  c.strokeStyle = C.ink;
  c.lineWidth = 4.5;
  c.stroke();
  inkLine(c, [[-22, 4], [-28, 26]], 1403, 4, "rgba(255,255,255,0.55)");
  c.restore();
  if (ring > 0.02) {
    c.save();
    c.globalAlpha = ring;
    for (const side of [-1, 1])
      for (let k = 0; k < 3; k++) {
        const r = 58 + k * 18 + ((abs * 6) % 1) * 10;
        c.beginPath();
        c.arc(x, y - 4, r, side < 0 ? Math.PI * 0.82 : -Math.PI * 0.18, side < 0 ? Math.PI * 1.18 : Math.PI * 0.18);
        c.strokeStyle = C.ink;
        c.lineWidth = 4;
        c.stroke();
      }
    c.restore();
  }
}

/** The classroom door, open: a glimpse of the classroom inside (board, desks), the door leaf swung back. */
function openDoorway(c: Ctx) {
  const { x0, x1, y0, y1 } = DOOR;
  c.fillStyle = vgradC(c, y0, y1, "#6b5a44", "#3a3026");
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  poly(c, [[x0, y0 + 70], [x0 + 150, y0 + 66], [x0 + 150, y0 + 250], [x0, y0 + 254]], 1410, 1);
  paint(c, "#2f4a3c", "rgba(23,22,26,0.7)", 3);
  for (let k = 0; k < 2; k++) {
    poly(c, [[x0 + 20 + k * 120, y0 + 470], [x0 + 120 + k * 120, y0 + 466], [x0 + 124 + k * 120, y0 + 490], [x0 + 16 + k * 120, y0 + 494]], 1411 + k, 0.8);
    paint(c, "#a5743e", "rgba(23,22,26,0.7)", 3);
  }
  // the door leaf, swung back against the wall
  poly(c, [[x1, y0 + 4], [x1 + 58, y0 + 30], [x1 + 58, y1 - 20], [x1, y1]], 1414, 1);
  paint(c, "#b9895a", C.ink, 5);
  poly(c, [[x1 + 12, y0 + 70], [x1 + 46, y0 + 86], [x1 + 46, y0 + 230], [x1 + 12, y0 + 222]], 1415, 0.6);
  paint(c, "rgba(190,225,240,0.9)", C.ink, 3);
}
const vgradC = (c: Ctx, y0: number, y1: number, a: string, b: string) => {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
};

const FILE_IN: { p: Person; x0: number; t0: number }[] = [
  { p: CAST.monitor, x0: MON, t0: AWAY + 0.04 },
  { p: CAST.jie, x0: JIE, t0: AWAY + 0.1 },
  { p: CAST.d, x0: DD, t0: AWAY + 0.16 },
];
/** The three of them hurry sideways to the door (strides tied to the distance) and step in through it, fading into
 *  the dark classroom; the rolled banner behind A-Jie, the gift behind her back with the "17" balloon going in after. */
function filingIn(c: Ctx, abs: number) {
  const SPEED = 850;
  FILE_IN.forEach((f, i) => {
    const ta = f.t0 + (f.x0 - DOOR.cx) / SPEED; // reaches the doorway
    const w = Math.max(0, Math.min(1, (abs - f.t0) / (ta - f.t0)));
    const q = smooth(phase(abs, ta, ta + 0.32)); // steps in
    if (q >= 0.99) return;
    const x = f.x0 + (DOOR.cx - f.x0) * w;
    const walking = (w > 0 && w < 1) || (q > 0 && q < 1);
    const ph = Math.PI / 2 + (f.x0 - x) / 22 + q * 3;
    const y = HY - 50 * q - (walking ? 5 * Math.abs(Math.cos(ph)) : 0);
    const s = HS * (1 - 0.12 * q);
    const at = (local: Pt): Pt => [x + local[0] * s, y + local[1] * s];
    const draw = (cc: Ctx) => {
      if (i === 2) {
        balloon17(cc, x + 30, 470 - 50 * q + Math.sin(abs * 1.7) * 6, 0.6 * (1 - 0.12 * q), abs, at([150, 300]));
        cc.save();
        cc.translate(...at([140, 250]));
        cc.rotate(0.25);
        cc.scale(s, s);
        giftBox(cc, 0, 0, 140, 110);
        cc.restore();
      }
      if (i === 1) {
        cc.save();
        cc.translate(...at([110, 120]));
        cc.rotate(-0.75);
        cc.scale(s, s);
        banner(cc, 0, 0, 160, 0, "", 510, F.cn);
        cc.restore();
      }
      drawPerson(cc, x, y, s, { ...f.p, body: "full", legs: walking ? "walk" : "stand", walk: ph, turn: -0.6, handL: BACK_L, handR: BACK_R });
    };
    if (q <= 0) {
      draw(c);
      return;
    }
    c.save();
    c.beginPath();
    c.rect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0);
    c.clip();
    c.globalAlpha = 1 - q;
    draw(c);
    c.restore();
  });
  // the door frame in front of anyone stepping through it
  poly(c, [[DOOR.x0, DOOR.y0], [DOOR.x1, DOOR.y0], [DOOR.x1, DOOR.y1], [DOOR.x0, DOOR.y1]], 1416, 1.2);
  paint(c, null, C.ink, 6);
}

/** From behind: hood up, he follows them to the classroom, getting smaller (perspective: feet y = 585 + 917·s, the
 *  floor they stand on). He keeps to the left of the door so we can see them go in. */
function awayScene(c: Ctx, abs: number) {
  const d = easeOut(phase(abs, AWAY - 0.05, LAUGH + 0.2));
  const [hx, hy, hr] = handheld(abs, 4, 3);
  const ring = smooth(phase(abs, AWAY - 0.05, AWAY + 0.05)) * (1 - smooth(phase(abs, 12.3, 12.55)));
  c.save();
  camera(c, 540, 900, 1.03 + 0.03 * phase(abs, AWAY, LAUGH), hr, hx, hy);
  filtered(
    c,
    "blur(1.8px)",
    (b) => {
      corridor(b, abs);
      openDoorway(b);
    },
    "bg",
  );
  schoolBell(c, 880, 300, ring, abs); // (right of the title pill)
  filingIn(c, abs);
  const s = 1.25 - 0.25 * d;
  const ph = Math.PI / 2 + 4 * Math.PI * d; // two strides, tied to the distance
  const x = 170 + 80 * d,
    y = 585 + 137 * s - 6 * Math.abs(Math.cos(ph));
  // arms nearly straight, swinging against the legs (the "down" preset bows the elbows out, like hands on hips)
  const sw = Math.sin(ph);
  drawKid(c, x, y, s, {
    view: "back",
    body: "full",
    legs: "walk",
    walk: ph,
    arms: "custom",
    handL: [-126 + 6 * sw, 462 + 14 * sw],
    handR: [126 + 6 * sw, 462 - 14 * sw],
  });
  hoodShell(c, x, y, s, 0, true);
  c.restore();
}

function shotHood(ctx: Ctx, abs: number) {
  oldFilm(ctx, abs, (c) => (abs < AWAY ? hoodScene(c, abs) : awayScene(c, abs)));
}

// ---------------------------------------------------------------- 12.79 – 16.96 the classroom
function plannerPhone(c: Ctx) {
  c.fillStyle = "#ededed";
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = "#e2e2e2";
  c.fillRect(0, 0, SW, 190);
  text(c, "惊喜策划群", SW / 2, 96, { size: 56, font: F.ui, weight: 700, fill: "#111" });
  text(c, "（不含寿星）", SW / 2, 156, { size: 40, font: F.ui, weight: 700, fill: C.red });
  ["横幅藏好了吗", "他来了 快藏!!", "千万别笑场"].forEach((m, i) => {
    c.fillStyle = "#fff";
    rr(c, 40, 260 + i * 150, 460, 110, 16);
    c.fill();
    text(c, m, 70, 315 + i * 150, { size: 46, font: F.ui, fill: "#111", align: "left" });
  });
}

const SLAP = beatAt(25); // 13.31 A-Jie claps a hand over his own mouth
const BURST = SLAP + 0.14; // 13.45 the class bursts out laughing (at A-Jie)

/** A plain back-row desk: top at y, legs down to the floor. */
function rowDesk(c: Ctx, x: number, y: number, w: number, seed: number) {
  poly(c, [[x - w / 2, y], [x + w / 2, y - 2], [x + w / 2 + 6, y + 30], [x - w / 2 - 6, y + 32]], seed, 1);
  paint(c, "#d79a55", C.ink, 4);
  inkLine(c, [[x - w / 2 + 16, y + 32], [x - w / 2 + 16, y + 190]], seed + 1, 6, "#6b6f7a");
  inkLine(c, [[x + w / 2 - 16, y + 32], [x + w / 2 - 16, y + 190]], seed + 2, 6, "#6b6f7a");
}

/** A-Jie's speech bubble: a little birthday cake (he nearly says it) — squashed flat when he claps his mouth shut. */
function cakeBubble(c: Ctx, x: number, y: number, tx: number, ty: number, k: number, crush: number) {
  if (k <= 0.01 || crush >= 0.99) return;
  c.save();
  c.globalAlpha *= 1 - crush;
  // tail toward his mouth
  const dx = tx - x,
    dy = ty - y,
    len = Math.hypot(dx, dy),
    ux = dx / len,
    uy = dy / len;
  const tip = 0.55 + 0.45 * k;
  poly(c, [[x + ux * 60 - uy * 24, y + uy * 60 + ux * 24], [x + ux * (len - 40) * tip, y + uy * (len - 40) * tip], [x + ux * 60 + uy * 24, y + uy * 60 - ux * 24]], 995, 0.8);
  paint(c, "#fff", C.ink, 5);
  c.translate(x, y);
  c.scale(k * (1 + 0.4 * crush), k * (1 - 0.85 * crush));
  oval(c, 0, 0, 122, 94, 990, 1.2);
  paint(c, "#fff", C.ink, 5);
  // the cake: sponge, pink frosting with drips, one candle
  poly(c, [[-52, 6], [52, 6], [54, 52], [-54, 52]], 991, 0.8);
  paint(c, "#f6d2a2", C.ink, 4);
  poly(c, [[-56, -14], [56, -14], [56, 10], [34, 22], [14, 10], [-8, 24], [-30, 10], [-56, 18]], 992, 0.8);
  paint(c, "#ff9cc3", C.ink, 4);
  poly(c, [[-6, -54], [6, -54], [6, -14], [-6, -14]], 993, 0.5);
  paint(c, "#8fd3ff", C.ink, 3);
  oval(c, 0, -66, 9, 13, 994, 0.5);
  paint(c, "#ffc65a", C.ink, 3);
  c.restore();
}

const SEATED: { p: Person; x: number }[] = [
  { p: CAST.a, x: 110 },
  { p: CAST.e, x: 285 },
];

/** 12.79 – 14.87 the slip (what really happened — 小雨 explains it after the twist: 上课大家是在笑阿杰差点说漏嘴).
 *  He sits at his desk in front, hood up, head down. Behind him A-Jie jumps up mid-sentence — his bubble is a
 *  birthday cake — and claps a hand over his own mouth (13.31, "!", the bubble squashed flat); the class bursts
 *  out laughing at A-Jie. He flinches, glances back, and sinks lower: he thinks it's at him. 彩蛋: A-Jie's
 *  phone (惊喜策划群（不含寿星）, pink frosting on the case). */
function slipScene(c: Ctx, abs: number) {
  const stand = easeOut(phase(abs, LAUGH + 0.1, LAUGH + 0.3));
  const slap = smooth(phase(abs, SLAP - 0.08, SLAP));
  const laughing = abs >= BURST;
  const lk = smooth(phase(abs, BURST, BURST + 0.15));
  const bounce = (i: number, amp = 10) => (laughing ? -Math.abs(Math.sin(abs * 11 + i * 1.7)) * amp * lk : 0);
  const jolt = laughing ? 7 * Math.exp(-(abs - BURST) * 7) : 0;
  const [sx, sy] = shake(abs, jolt);
  const [hx, hy, hr] = handheld(abs, 5, 6);
  c.save();
  camera(c, 540, 860, 1.0 + 0.1 * easeInOut(phase(abs, LAUGH, CLOSE)), hr, hx + sx, hy + sy);
  filtered(c, "blur(1.4px)", (b) => classroom(b, abs, false), "bg");
  // the back row, laughing at A-Jie
  SEATED.forEach((q, i) => {
    drawPerson(c, q.x, 730 + bounce(i), 0.55, {
      ...q.p,
      body: "full",
      legs: "sit",
      turn: laughing ? 0.6 : 0.2,
      tilt: laughing ? -0.14 + Math.sin(abs * 19 + i) * 0.06 : 0,
      arms: laughing ? "laugh" : "down",
    });
    rowDesk(c, q.x, 880, 170, 970 + i * 3);
  });
  // A-Jie jumps up, his left hand up as he talks → claps it over his mouth
  const JX = 830;
  const jy = 770 - 150 * stand + bounce(5, 8);
  const handL: Pt = slap > 0 ? lerp2([-150, -120], [-46, 112], slap) : lerp2([-112, 352], [-150, -120], stand);
  const jieTilt = laughing ? 0.1 + Math.sin(abs * 17) * 0.05 : 0;
  drawPerson(c, JX, jy, 0.78, {
    ...CAST.jie,
    body: "full",
    turn: -0.3,
    tilt: jieTilt,
    handL,
    shapeL: slap > 0.5 ? "hidden" : "open",
    bendL: -1,
    handR: [150, 400],
    shapeR: "hold",
    holding: (h) => {
      phone(h, 172, 225, 0.32, 0.1, plannerPhone, 520);
      // a smear of pink frosting on the case (he made the cake)
      h.fillStyle = "#ff9cc3";
      h.beginPath();
      h.ellipse(252, 128, 16, 9, 0.5, 0, Math.PI * 2);
      h.fill();
      h.fillStyle = "rgba(255,255,255,0.7)";
      h.beginPath();
      h.ellipse(247, 124, 5, 3, 0.5, 0, Math.PI * 2);
      h.fill();
    },
  });
  // the hand over his mouth goes on top of his face (drawPerson draws hands under the head)
  if (slap > 0.5) {
    c.save();
    c.translate(JX, jy);
    c.rotate(jieTilt * 0.5);
    drawHand(c, -46 * 0.78, 100 * 0.78, 0.86 * 0.78, -1.05, "flat", true, false, 331);
    c.restore();
  }
  rowDesk(c, JX, 960, 280, 980);
  cakeBubble(c, 655, 400, JX - 20, jy + 40, easeOut(phase(abs, LAUGH + 0.25, LAUGH + 0.4)), smooth(phase(abs, SLAP, SLAP + 0.12)));
  bang(c, JX + 40, jy - 175, abs < SLAP ? 0 : easeOut(phase(abs, SLAP, SLAP + 0.1)) * (1 - smooth(phase(abs, 13.9, 14.05))), 0.12);
  sweatDrop(c, JX + 92, jy - 40 + 20 * phase(abs, SLAP, 14.3), smooth(phase(abs, SLAP + 0.05, SLAP + 0.15)) * (1 - smooth(phase(abs, 14.2, 14.4))));
  // him, in front: hood up, head down → flinches at the laughter and glances back → sinks lower
  const flinch = laughing ? Math.exp(-(abs - BURST) * 8) * Math.sin((abs - BURST) * 26) * 10 : 0;
  const glance = smooth(phase(abs, BURST + 0.1, BURST + 0.25)) * (1 - smooth(phase(abs, 14.25, 14.45)));
  const sink = smooth(phase(abs, 14.3, 14.8));
  drawKid(c, 540, 800 + 14 * sink, 0.95, {
    body: "bust",
    hood: true,
    arms: "down",
    eyes: glance > 0.5 ? "open" : sink > 0.3 ? "sad" : blinkEyes(abs, 4, "sleepy"),
    brows: glance > 0.5 ? "worried" : sink > 0.3 ? "sad" : undefined,
    look: [0.7 * glance, 0.8 - 1.0 * glance],
    turn: 0.25 * glance,
    mouth: glance > 0.5 ? "flat" : "frown",
    headY: 6 + flinch,
  });
  schoolDesk(c, 540, 1150, 620);
  // a classmate in the foreground, out of focus, cracking up too
  filtered(
    c,
    "blur(4px)",
    (b) => drawPerson(b, 50, 1110 + bounce(9, 12), 1.05, { ...CAST.c, body: "bust", turn: 0.7, tilt: laughing ? -0.12 + Math.sin(abs * 21) * 0.06 : 0, arms: laughing ? "laugh" : "down" }),
    "fg",
  );
  const ht = phase(abs, BURST, BURST + 1.0) * 1.2;
  hahas(c, 260, 600, 230, ht, 77, F.cn, 5);
  hahas(c, 880, 470, 200, ht - 0.1, 91, F.cn, 4);
  c.restore();
}

/** 14.87 – 16.55 how it feels to him: the laughter closes in. Four of them loom in from the edges pointing at him,
 *  the room goes dark around him, more and more 哈哈哈, tears → slam → 哈. */
// (pull: how far they close in toward him; point: where the pointing hand goes, head units — short of his face)
const LOOMERS: { p: Person; x0: number; x1: number; y: number; s: number; side: number; pull: number; point: Pt }[] = [
  { p: CAST.a, x0: -160, x1: 170, y: 560, s: 0.8, side: -1, pull: 0.2, point: [200, 20] },
  { p: CAST.b, x0: 1240, x1: 910, y: 560, s: 0.8, side: 1, pull: 0.2, point: [-200, 20] },
  // the two in front double up laughing instead (raised open hands beside his head read as grabbing him)
  { p: CAST.c, x0: -220, x1: 90, y: 1000, s: 1.15, side: -1, pull: 0.1, point: [0, 0] },
  { p: CAST.e, x0: 1300, x1: 990, y: 1000, s: 1.15, side: 1, pull: 0.1, point: [0, 0] },
];
function closeInScene(c: Ctx, abs: number) {
  const close = easeIn(phase(abs, CLOSE + 0.3, 16.45)); // the laughter closes in on him
  const slam = easeIn(phase(abs, 15.95, 16.55));
  const [sx, sy] = shake(abs, slam * 14 + close * 3);
  const [hx, hy, hr] = handheld(abs, 7, 7);
  c.save();
  camera(c, 540, 820, 1.0 + 0.14 * close + slam * 0.8, hr * (1 - slam), sx + hx, sy + hy);
  filtered(
    c,
    "blur(3px)",
    (b) => {
      b.save();
      camera(b, 540, 700, 1.3);
      classroom(b, abs, false);
      b.restore();
    },
    "bg",
  );
  // the room goes dark around him
  const v = c.createRadialGradient(540, 820, 200, 540, 820, 900);
  v.addColorStop(0, "rgba(10,8,6,0)");
  v.addColorStop(1, `rgba(10,8,6,${(0.25 + 0.5 * close).toFixed(2)})`);
  c.fillStyle = v;
  c.fillRect(-200, -200, W + 400, H + 400);
  const loomer = (q: (typeof LOOMERS)[number], i: number) => {
    const come = easeOut(phase(abs, CLOSE + i * 0.08, CLOSE + 0.4 + i * 0.08));
    const x = q.x0 + (q.x1 - q.x0) * come + (540 - q.x1) * q.pull * close,
      y = q.y + 50 * close * (q.y > 800 ? -1 : 1) - Math.abs(Math.sin(abs * 11 + i * 1.3)) * 12,
      s = q.s * (1 + 0.3 * close);
    if (q.point[0] === 0) {
      drawPerson(c, x, y, s, { ...q.p, body: "full", turn: -0.55 * q.side, tilt: 0.12 * q.side + Math.sin(abs * 21 + i * 2) * 0.07, arms: "laugh" });
      return;
    }
    drawPerson(c, x, y, s, {
      ...q.p,
      body: "full",
      turn: -0.55 * q.side,
      tilt: -0.1 * q.side + Math.sin(abs * 21 + i * 2) * 0.07,
      handL: q.side < 0 ? [-40, 280] : [q.point[0], q.point[1] + Math.sin(abs * 13 + i) * 12],
      shapeL: q.side < 0 ? "fist" : "open",
      handR: q.side < 0 ? [q.point[0], q.point[1] + Math.sin(abs * 13 + i) * 12] : [40, 280],
      shapeR: q.side < 0 ? "open" : "fist",
    });
  };
  loomer(LOOMERS[0], 0);
  loomer(LOOMERS[1], 1);
  drawKid(c, 540, 820 + 10 * close, 1.25, {
    body: "bust",
    hood: true,
    arms: "down",
    eyes: abs > 15.55 ? "teary" : "sad",
    brows: "sad",
    look: abs > 15.5 ? [0, 0.7] : [Math.sin(abs * 3.1) * 0.6, 0.1],
    mouth: abs > 15.55 ? "wobble" : "frown",
    tears: smooth(phase(abs, 15.6, 16.2)) * 0.6,
    headY: 8 * close,
  });
  schoolDesk(c, 540, 1240, 720);
  loomer(LOOMERS[2], 2);
  loomer(LOOMERS[3], 3);
  // 哈哈哈 from both sides, kept off his face
  const ht = 0.4 + phase(abs, CLOSE, 15.6) + close;
  hahas(c, 220 + 60 * close, 640, 170, ht, 78, F.cn, 4 + Math.floor(close * 3));
  hahas(c, 860 - 60 * close, 640, 170, ht - 0.1, 83, F.cn, 4 + Math.floor(close * 3));
  hahas(c, 540, 330, 200, ht - 0.3, 88, F.cn, 2 + Math.floor(close * 3));
  c.restore();
}

function shotLaugh(ctx: Ctx, abs: number) {
  if (abs < 16.55) {
    oldFilm(ctx, abs, (c) => (abs < CLOSE ? slipScene(c, abs) : closeInScene(c, abs)));
    return;
  }
  fillBg(ctx, "#000");
  if (abs > 16.62) text(ctx, "哈", 540, 820, { size: 420 + (abs - 16.62) * 600, font: F.cn, fill: "#fff", alpha: 0.9 - Math.min(1, (abs - 16.62) * 2) * 0.6 });
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < LOCK) shotCandle(ctx, abs);
    else if (abs < CHAT) shotLock(ctx, abs);
    else if (abs < REW) shotChat(ctx, abs);
    else if (abs < MEM) shotOldScreen(ctx, abs);
    else if (abs < HOOD) shotCorridor(ctx, abs);
    else if (abs < LAUGH) shotHood(ctx, abs);
    else if (abs < END + 0.12) shotLaugh(ctx, abs);
  });
}
