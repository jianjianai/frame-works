import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blinkEyes, blob, bloom, camera, card, designScene, figureMask, lightShaft, onFigure, rimLight, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, hash, inkLine, lerp2, linesOutsideCentre, oldFilm, oval, paint, poly, rr, shaded, shake, text } from "@materials/s0rrow/code/draw";
import { drawHand, drawKid } from "@materials/s0rrow/code/kid";
import { CAST, Person, banner, drawPerson, hahas } from "@materials/s0rrow/code/people";
import { Msg, Note, SH, SW, chatScreen, glassGlare, lockScreen, notification, notificationHeight, phone, phoneButtons, statusBar, wallpaper } from "@materials/s0rrow/code/phone";
import { bokeh, classroom, corridor, roomBokeh, schoolDesk, screenSpill } from "@materials/s0rrow/code/sets";
import { birthdayDesk } from "@materials/s0rrow/code/shared";
import { TILT, phoneReflectionAt, shotBirthday, shotDeskPhone } from "./opening";
import { FingerKey, FingerPos, fingerAt, onScreen, tapRipple, touchDot } from "@materials/s0rrow/code/hand";

/** ACT 1 · 第一遍副歌「他眼里的今天」(0 – 16.96) · 重新设计版.
 *  His world at night is grey (`grade`); only the candle stays warm. The morning is a memory: its own colours, seen
 *  through a film camera (`oldFilm`: grain, a slight weave, dust, random old-screen vertical lines, a mild vignette); everyone else
 *  wears the cover's X face.
 *  (用户 asked for better 2 s / 5 s retention; three opening shots in front of this one were tried — a 99+
 *   flash-forward, a midnight countdown, 「全班都在笑我」 — and then dropped: 「还是不要开头钩子了」)
 *  0 – 8.09  the three opening shots live in lib/opening.ts (用户定的结构：主角自己在家过生日 → 俯拍桌面 →
 *        手机 0 条消息 → 回忆; the class-group chat and its 「阿杰 撤回了一条消息」 were cut): his birthday alone
 *        with a party horn (0) → a whip-tilt down to the desk from above (1.83) → the screen wakes (2.61) and the
 *        camera pushes into the phone lying face up (3.40): still 0 条新消息, 23:58 → 23:59 → the side button
 *        (6.79), the black glass, his reflection
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
const REW = beatAt(15); // 8.09 the old-screen cut into the memory (two beats of vertical lines)
const MEM = beatAt(16); // 8.61
const NOTICE = beatAt(17); // 9.14
const HOOD = beatAt(20); // 10.70
const LAUGH = beatAt(24); // 12.79
const CLOSE = beatAt(28); // 14.87
const END = beatAt(32); // 16.96
/** saturation of his world before the twist */
const GREY = 0.38;

// ---------------------------------------------------------------- 8.09 – 8.61 the old-screen cut into the memory
const CUT = REW + 0.26; // 8.35 his reflection dissolves into his face this morning
// (where his reflected face sits on screen: lib/opening.ts phoneReflectionAt)

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
  if (mix < 1) shotDeskPhone(ctx, abs);
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

/** The twist replays these memories from their side (act5, 99+): the same frames, but the X faces come off and they
 *  are grinning. 0 = the X faces of his memory, 1 = their real faces. Set only by replayCorridor / replaySlip. */
let UNMASK = 0;
const unmasked = (laugh = true): Partial<Person> => (UNMASK > 0 ? { x: 1 - UNMASK, face: laugh ? "laugh" : "smile" } : {});
/** a burst of light where an X face comes off */
function unmaskBurst(c: Ctx, x: number, y: number, s: number) {
  if (UNMASK <= 0 || UNMASK >= 1) return;
  glow(c, x, y, 220 * s, "rgba(255,240,200,0.85)", Math.sin(Math.PI * UNMASK));
}
/** act5: his memories again, from their side — `memAbs` is the moment of the memory to draw (act1 time). */
export function replayCorridor(c: Ctx, memAbs: number, unmask: number) {
  UNMASK = unmask;
  corridorScene(c, memAbs);
  UNMASK = 0;
}
export function replaySlip(c: Ctx, memAbs: number, unmask: number) {
  UNMASK = unmask;
  slipScene(c, memAbs);
  UNMASK = 0;
}

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
    ...unmasked(),
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
    ...unmasked(),
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
    ...unmasked(),
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
  for (const x of [MON, JIE, DD]) unmaskBurst(c, x, HY, HS);
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
/** 光影: a figure with the morning sun from a window behind it — drawn, then a warm rim of light along the edges that
 *  face the window ((ux, uy) points toward it) */
function sunRim(c: Ctx, draw: (k: Ctx) => void, key: string, ux: number, uy: number, a = 0.5) {
  draw(c);
  if (a <= 0.01) return;
  const m = figureMask(c, draw, "rimFig"); // (one buffer for all of these: each mask is used at once)
  rimLight(c, m, ux, uy, 5, "rgb(255,238,200)", a, "lighter", 6);
}

function corridorScene(c: Ctx, abs: number) {
  // one shot: starts on exactly the face that was in the black glass, pulls back to the two planes, and at the end
  // drifts in on him for the hood
  const pull = easeInOut(phase(abs, CUT, 9.05));
  const drift = easeInOut(phase(abs, 9.9, HOOD));
  const [x0, y0, s0, r0] = phoneReflectionAt(CUT);
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
  // (the sun from the windows behind them rims their hair and shoulders)
  focus(c, 3 * (1 - onThem), par(0.4, (b) => sunRim(b, (k) => huddle(k, abs), "huddle", 0.3, -0.95, 0.45)), "huddle");
  focus(c, 4.5 * onThem, (b) => sunRim(b, (k) => kidNow(k, abs), "kid", -0.75, -0.65, 0.55), "kidFocus");
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
  // as the hood goes up the world behind him recedes a little (he is hiding from it)
  const recede = smooth(phase(abs, HOOD_ON, HOOD_ON + 0.45));
  if (recede > 0) {
    c.fillStyle = `rgba(30,20,12,${(0.16 * recede).toFixed(3)})`;
    c.fillRect(-200, -200, W + 400, H + 400);
  }
  const ky = 790 + (1 - k) * 60;
  const headY = settle + 8 * smooth(phase(abs, HOOD_ON + 0.05, HOOD_ON + 0.25)) + 6 * smooth(phase(abs, 11.5, AWAY));
  const t = up ? 1 - drop : raise;
  // pocket → out to the side → up behind his head (straight up from the pocket crossed his arms over his chest)
  const hand = (side: number): Pt =>
    t < 0.5 ? lerp2([side * 66, 372], [side * 178, 150], t * 2) : lerp2([side * 178, 150], [side * 112, -64], (t - 0.5) * 2);
  if (!up && rise > 0) hoodShell(c, 540, ky, 1.25, headY + 230 - 280 * rise, false);
  // (the window behind him rims his hair with sun — until the hood covers it)
  sunRim(
    c,
    (k) =>
      drawKid(k, 540, ky, 1.25, {
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
      }),
    "hoodKid",
    -0.6,
    -0.8,
    0.5 * (1 - 0.7 * recede),
  );
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
    // (they sit in the sun from the windows; he, in front, is just outside it)
    sunRim(
      c,
      (k) =>
        drawPerson(k, q.x, 730 + bounce(i), 0.55, {
          ...q.p,
          ...unmasked(),
          body: "full",
          legs: "sit",
          turn: laughing ? 0.6 : 0.2,
          tilt: laughing ? -0.14 + Math.sin(abs * 19 + i) * 0.06 : 0,
          arms: laughing ? "laugh" : "down",
        }),
      "seat" + i,
      -1,
      -0.35,
      0.55,
    );
    rowDesk(c, q.x, 880, 170, 970 + i * 3);
  });
  // A-Jie jumps up, his left hand up as he talks → claps it over his mouth
  const JX = 830;
  const jy = 770 - 150 * stand + bounce(5, 8);
  const handL: Pt = slap > 0 ? lerp2([-150, -120], [-46, 112], slap) : lerp2([-112, 352], [-150, -120], stand);
  const jieTilt = laughing ? 0.1 + Math.sin(abs * 17) * 0.05 : 0;
  drawPerson(c, JX, jy, 0.78, {
    ...CAST.jie,
    ...unmasked(),
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
    (b) => drawPerson(b, 50, 1110 + bounce(9, 12), 1.05, { ...CAST.c, ...unmasked(), body: "bust", turn: 0.7, tilt: laughing ? -0.12 + Math.sin(abs * 21) * 0.06 : 0, arms: laughing ? "laugh" : "down" }),
    "fg",
  );
  for (const [x, y, s] of [[110, 730, 0.55], [285, 730, 0.55], [JX, jy, 0.78]] as [number, number, number][]) unmaskBurst(c, x, y, s);
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
  // (and the frame tilts as it closes in: the floor going out from under him)
  camera(c, 540, 820, 1.0 + 0.14 * close + slam * 0.8, hr * (1 - slam) + 0.05 * close, sx + hx, sy + hy);
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
  // the room goes dark and cold around him, the sun gone out of it; a hard light from above pins him
  const v = c.createRadialGradient(540, 820, 180, 540, 820, 880);
  v.addColorStop(0, "rgba(8,10,22,0)");
  v.addColorStop(1, `rgba(8,10,22,${(0.3 + 0.55 * close).toFixed(2)})`);
  c.fillStyle = v;
  c.fillRect(-200, -200, W + 400, H + 400);
  lightShaft(c, [[450, -200], [630, -200], [800, 1300], [280, 1300]], 540, -200, 540, 1500, "205,218,255", 0.07 + 0.12 * close, 30, "shaft");
  // the closer they come the more they turn to dark shapes against the light (the X faces stay)
  const loomer = (q: (typeof LOOMERS)[number], i: number) => {
    const draw = (k: Ctx) => loomerAt(k, q, i);
    draw(c);
    const dk = 0.15 + 0.4 * close;
    const m = figureMask(c, draw, "rimFig");
    onFigure(c, m, (k) => {
      k.fillStyle = `rgba(10,12,26,${dk.toFixed(3)})`;
      k.fillRect(-400, -400, W + 800, H + 800);
    });
  };
  const loomerAt = (c: Ctx, q: (typeof LOOMERS)[number], i: number) => {
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
    if (abs < TILT) shotBirthday(ctx, abs);
    else if (abs < REW) shotDeskPhone(ctx, abs);
    else if (abs < MEM) shotOldScreen(ctx, abs);
    else if (abs < HOOD) shotCorridor(ctx, abs);
    else if (abs < LAUGH) shotHood(ctx, abs);
    else if (abs < END + 0.12) shotLaugh(ctx, abs);
    // night (光影): the flame and the lit screen bleed a soft glow into the dark
    if (abs < CUT) bloom(ctx, 0.32);
  });
}
