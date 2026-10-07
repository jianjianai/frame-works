import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, beatAt, blinkEyes, camera, card, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, hash, inkLine, linesOutsideCentre, oldFilm, rr, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
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
 *  8.09  the cut into the memory, like an old screen: the picture breaks into flickering vertical lines and a jitter,
 *        jumps to this morning underneath them, and the lines thin out
 *  8.61  今天上午 10:12, the corridor: they see him (9.14) and hide everything; a gold "17" balloon floats above them
 *  10.70 the hood goes up on "hide away" (hands up, snap, a shadow over his eyes), then a slow push in. No airplane
 *        mode in the memory: if he remembered switching it on, he couldn't have forgotten it (用户). The only clue is
 *        the ✈ in his status bar.
 *  12.79 the classroom erupts (A-Jie's phone: 惊喜策划群（不含寿星）, pink frosting on its case) · 14.87 the laughter
 *        closes in → slam → 哈 */
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
/** An old screen's vertical lines: the present (his reflection) breaks up into flickering vertical scratches and a
 *  jitter, the picture jumps to this morning underneath them, and they thin out as the memory settles. */
function shotOldScreen(ctx: Ctx, abs: number) {
  const p = phase(abs, REW, MEM);
  const dens = Math.sin(Math.PI * Math.min(1, p * 1.15));
  const f = Math.floor(abs * 24);
  ctx.save();
  ctx.translate((hash(f * 1.9) - 0.5) * 7 * dens, (hash(f * 2.7) - 0.5) * 3 * dens);
  if (p < 0.5) shotChat(ctx, abs);
  else oldFilm(ctx, abs, (c) => corridorScene(c, abs));
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

const HUDDLE: { p: Person; x: number; turn0: number; turn1: number; arms0: Person["arms"] }[] = [
  { p: CAST.monitor, x: 640, turn0: 0.55, turn1: -0.1, arms0: "hold" },
  { p: CAST.jie, x: 810, turn0: -0.45, turn1: 0.15, arms0: "hold" },
  { p: CAST.d, x: 985, turn0: -0.55, turn1: -0.25, arms0: "handL" },
];

function corridorScene(c: Ctx, abs: number) {
  const noticed = abs >= NOTICE;
  const spin = smooth(phase(abs, NOTICE, NOTICE + 0.25));
  const track = easeInOut(phase(abs, MEM, 10.0));
  const [hx, hy, hr] = handheld(abs, 5, 3);
  c.save();
  camera(c, 540, 900, 1.04 + 0.05 * easeInOut(phase(abs, MEM, HOOD)), hr, hx + 30 - 60 * track, hy);
  filtered(c, "blur(1.6px)", (b) => corridor(b, abs), "bg");
  // 彩蛋: the "17" balloon — held up while they work, pulled down behind a back when he comes, floating up anyway
  balloon17(c, noticed ? 930 : 950, (noticed ? 450 : 380) + Math.sin(abs * 1.7) * 6, 0.62, abs, noticed ? [985, 905] : [965, 770]);
  if (!noticed) {
    // the banner they are working on, open between them (no text yet)
    banner(c, 728, 830, 300, 0.72, "", 512, F.cn);
  } else {
    // rolled up behind A-Jie's back, one end sticking out
    c.save();
    c.translate(868, 922);
    c.rotate(-0.7);
    banner(c, 0, 0, 160, 0, "", 510, F.cn);
    c.restore();
  }
  for (const h of HUDDLE)
    drawPerson(c, h.x, 660 + (noticed ? 0 : Math.sin(abs * 6 + h.x) * 4), 0.7, {
      ...h.p,
      turn: h.turn0 + (h.turn1 - h.turn0) * spin,
      arms: noticed ? "behind" : h.arms0,
      body: "full",
    });
  // He walks in along the corridor toward us. The kid's walk cycle is a front view, so he comes toward the camera
  // (back-left → front, growing) instead of sliding sideways with his feet marching in place. Three steps, the cycle
  // tied to the distance covered (no skating, it slows as he slows), both feet down when he stops (phase π/2 + 3π);
  // the body rises over each passing foot and the arms swing a little against the legs.
  const ph = Math.PI / 2 + 3 * Math.PI * track;
  const moving = track > 0.001 && track < 0.999;
  const sw = moving ? Math.sin(ph) : 0;
  // (from the foot of the far wall, feet at y≈1180, to the foreground in front of them, feet at y≈1330, growing)
  drawKid(c, 250 + 80 * track, 790 - 22 * track - (moving ? 7 * Math.abs(Math.cos(ph)) : 0), 0.5 + 0.22 * track, {
    body: "full",
    legs: "walk",
    walk: ph,
    arms: "custom",
    handL: [-106 + 6 * sw, 462 + 10 * sw],
    handR: [106 + 6 * sw, 462 - 10 * sw],
    shapeL: "relax",
    shapeR: "relax",
    look: [noticed ? 1 : 0.2, noticed ? 0.1 : 0.3],
    eyes: abs > 10.15 ? "sad" : blinkEyes(abs, 3, "sleepy"),
  });
  c.restore();
}

function shotCorridor(ctx: Ctx, abs: number) {
  oldFilm(ctx, abs, (c) => corridorScene(c, abs));
  card(ctx, "今天上午 10:12", 70, 330, smooth(phase(abs, MEM + 0.1, MEM + 0.4)) * (1 - phase(abs, 10.5, HOOD)));
}

// ---------------------------------------------------------------- 10.70 – 11.74 the hood
function hoodScene(c: Ctx, abs: number) {
  const k = easeOut(phase(abs, HOOD, HOOD + 0.28));
  const lift = smooth(phase(abs, 10.98, 11.3)); // hands up to the hood
  const up = abs > 11.33;
  const drop = smooth(phase(abs, 11.38, 11.7));
  const settle = up ? Math.exp(-(abs - 11.33) * 9) * Math.sin((abs - 11.33) * 30) * 10 : 0;
  const [hx, hy, hr] = handheld(abs, 5, 4);
  c.save();
  // the hood goes up on "hide away", then a slow push in as he sinks into it
  camera(c, 540, 820, 1.0 + 0.08 * easeInOut(phase(abs, HOOD, 11.6)) + 0.14 * easeInOut(phase(abs, 11.6, LAUGH)), hr, hx, hy);
  // the corridor behind him, far out of focus
  filtered(
    c,
    "blur(6px)",
    (b) => {
      b.save();
      camera(b, 700, 700, 1.7);
      corridor(b, abs);
      b.restore();
    },
    "bg",
  );
  const t = up ? 1 - drop : lift;
  const hand = (side: number): Pt => [side * (120 - 2 * t), 432 + (-40 - 432) * t];
  const grip = t > 0.5;
  drawKid(c, 540, 790 + (1 - k) * 60, 1.25, {
    body: "bust",
    hood: up,
    arms: "custom",
    handL: hand(-1),
    handR: hand(1),
    shapeL: grip ? "fist" : "relax",
    shapeR: grip ? "fist" : "relax",
    eyes: up ? "sad" : blinkEyes(abs, 3, "sleepy"),
    look: up ? [0, 0.9] : [0.6, 0.2],
    mouth: "frown",
    headY: settle + 10 * smooth(phase(abs, 12.0, 12.6)),
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

function shotHood(ctx: Ctx, abs: number) {
  oldFilm(ctx, abs, (c) => hoodScene(c, abs));
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

const CROWD: { p: Person; x: number; y: number; s: number }[] = [
  { p: CAST.a, x: 300, y: 560, s: 0.62 },
  { p: CAST.b, x: 780, y: 560, s: 0.62 },
  { p: CAST.c, x: 140, y: 760, s: 0.82 },
  { p: CAST.e, x: 940, y: 760, s: 0.82 },
];

function laughScene(c: Ctx, abs: number) {
  const close = easeIn(phase(abs, CLOSE, 16.45)); // the laughter closes in on him
  const slam = easeIn(phase(abs, 15.95, 16.55));
  const [sx, sy] = shake(abs, slam * 14 + close * 3);
  const [hx, hy, hr] = handheld(abs, 7, 6);
  c.save();
  camera(c, 540, 780, 1.03 + 0.06 * easeInOut(phase(abs, LAUGH, CLOSE)) + 0.12 * close + slam * 0.8, hr * (1 - slam), sx + hx, sy + hy);
  filtered(c, "blur(1.4px)", (b) => classroom(b, abs), "bg");
  CROWD.forEach((q, i) => {
    const x = 540 + (q.x - 540) * (1 - 0.3 * close),
      y = q.y + 60 * close,
      s = q.s * (1 + 0.35 * close);
    drawPerson(c, x, y + Math.abs(Math.sin(abs * 11 + i)) * -10, s, {
      ...q.p,
      arms: i % 2 ? "point" : "laugh",
      tilt: Math.sin(abs * 22 + i * 2) * 0.08,
      body: "full",
      turn: q.x < 540 ? 0.6 : -0.6,
    });
  });
  drawKid(c, 540, 800, 0.95, {
    body: "bust",
    arms: "table",
    eyes: abs > 15.6 ? "sad" : blinkEyes(abs, 4, "sleepy"),
    look: [Math.sin(abs * 2) * 0.6, 0.2],
    mouth: abs > 15.6 ? "wobble" : "frown",
    tears: abs > 15.9 ? 0.3 : 0,
  });
  schoolDesk(c, 540, 1150, 620);
  hahas(c, 540, 640, 380 * (1 - 0.25 * close), phase(abs, 13.0, 15.0) * 1.2 + close, 77, F.cn, 7 + Math.floor(close * 5));
  // 彩蛋: A-Jie's phone — the surprise planning group, and a smear of pink frosting on the case (he made the cake)
  const show = smooth(phase(abs, LAUGH + 0.2, LAUGH + 0.6)) * (1 - smooth(phase(abs, 15.3, 15.6)));
  if (show > 0) {
    c.save();
    c.translate(-120 * (1 - show), 0);
    phone(c, 230, 1180, 0.36, 0.16, plannerPhone, 520);
    c.fillStyle = "#ff9cc3";
    c.beginPath();
    c.ellipse(362, 990, 18, 10, 0.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.beginPath();
    c.ellipse(356, 986, 6, 3, 0.5, 0, Math.PI * 2);
    c.fill();
    drawPerson(c, 120, 1420, 0.9, { ...CAST.jie, body: "bust", arms: "down" });
    c.restore();
  }
  c.restore();
}

function shotLaugh(ctx: Ctx, abs: number) {
  if (abs < 16.55) {
    oldFilm(ctx, abs, (c) => laughScene(c, abs));
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
