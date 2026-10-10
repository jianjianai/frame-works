import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, Pt, W, H, backOut, camera, card, designScene, easeIn, easeOut, fillBg, flash, glow, inkLine, oval, paint, shake, text } from "@materials/s0rrow/code/draw";
import { drawKid, helmetProp } from "@materials/s0rrow/code/kid";
import { ballToy, bunnyToy, drawDog } from "@materials/s0rrow/code/dog";
import { bedBlanket, bedroom, entrance, hallway } from "@materials/s0rrow/code/places";
import { SH, SW, phone } from "@materials/s0rrow/code/phone";
import { FingerKey, fingerAt, heldHands } from "@materials/s0rrow/code/hand";
import { photoScreen } from "@materials/s0rrow/code/screens";
import { lightPool } from "@materials/s0rrow/code/sets";
import { BAR, EV } from "./timeline";

/** ACT 1 (0 – 16.43s) · 小狗视角
 *  1A the hook: he comes home at 23:47 and walks straight past 豆豆 (holding a yellow helmet — rewatch clue)
 *  1B in bed he only looks at his phone: a "pretty puppy" photo (secretly 豆豆 as a puppy)
 *  1C dawn: he leaves without the walk 豆豆 hoped for; it waits by the door all day
 *  1D night: 豆豆 picks up its bunny and slips out through the door left ajar */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bez = (a: Pt, b: Pt, c: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
];

/** helmet hanging from his right hand (kid local units, arms "down") */
const helmetInHand = (c: Ctx) => {
  inkLine(c, [[122, 446], [128, 500]], 1601, 4, "#2a2a30");
  helmetProp(c, 132, 540, 0.42, 0.12, 1602);
};

// ---------------------------------------------------------------- 1A the hook
function shotHook(ctx: Ctx, abs: number) {
  const push = smooth(abs / BAR(2));
  ctx.save();
  camera(ctx, 480, 1060, 1.0 + 0.06 * push, 0, 0, -95);
  const door = smooth(phase(abs, EV.doorOpen, EV.doorOpen + 0.4)) * (1 - smooth(phase(abs, EV.doorClose, EV.doorClose + 0.35)));
  entrance(ctx, abs, { door, jar: 0.75, bowl: true });
  ballToy(ctx, 690, 1300, 32, 1610);
  // him: in the doorway, then walking past behind 豆豆 and out to the left
  if (abs > 1.6 && abs < 3.75) {
    const u = phase(abs, 1.9, 3.7);
    const [x, y] = bez([850, 742], [420, 690], [-200, 676], u);
    const s = lerp(0.5, 0.66, u);
    const walking = u > 0 && u < 1;
    ctx.save();
    if (abs < 1.95) ctx.globalAlpha = smooth(phase(abs, 1.6, 1.85));
    drawKid(ctx, x, y, s, {
      body: "full",
      legs: walking ? "walk" : "stand",
      walk: abs * 10,
      eyes: "tired",
      mouth: "flat",
      turn: -0.45,
      look: [-0.7, 0.5],
      headY: walking ? -Math.abs(Math.sin(abs * 10)) * 6 : 0,
      grip: helmetInHand,
    });
    ctx.restore();
  }
  // 豆豆 on its cushion: perks up at the keys, follows him with its eyes, droops when his door shuts
  const perk = smooth(phase(abs, EV.keys, EV.keys + 0.25));
  const droop = smooth(phase(abs, EV.roomDoor, EV.roomDoor + 0.35));
  const follow = abs < 1.9 ? 0.55 * perk : lerp(0.55, -0.85, smooth(phase(abs, 1.9, 3.55)));
  const blink = (abs > 0.55 && abs < 0.66) || (abs > 4.0 && abs < 4.08);
  oval(ctx, 440, 1300, 250, 60, 1620, 1.5);
  paint(ctx, "#5b4a7a", C.ink, 5);
  drawDog(ctx, 440, 1150, 1.45, {
    view: "front",
    pose: "lie",
    headUp: perk * (1 - 0.65 * droop),
    ears: 0.12 + 0.8 * perk - 0.78 * droop,
    eyes: blink ? "shut" : abs < EV.keys + 0.08 ? "half" : droop > 0.5 ? "sad" : "wide",
    headTurn: follow * (1 - droop * 0.6),
    look: [follow, -0.25 * perk],
    wag: abs * 24,
    wagAmt: smooth(phase(abs, EV.keys + 0.2, EV.keys + 0.5)) * (1 - smooth(phase(abs, 3.1, 3.9))),
    breathe: abs * 0.35,
  });
  lightPool(ctx, 420, 1050, 1250, 0.5, "rgba(255,190,110,0.08)");
  ctx.restore();
  card(ctx, "23:47", 790, 560, smooth(phase(abs, 0.2, 0.5)) * (1 - phase(abs, 3.9, 4.15)), 38);
}

// ---------------------------------------------------------------- 1B the phone
const PHOTO_FINGER: FingerKey[] = [
  [BAR(3), 450, 960, 0.2],
  [6.45, 360, 760, 0],
  [6.56, 350, 740, 1],
  [7.0, 250, 660, 1],
  [7.08, 250, 660, 0],
  [7.4, 450, 960, 0.2],
];

function shotBed(ctx: Ctx, abs: number) {
  if (abs < BAR(3)) {
    ctx.save();
    camera(ctx, 640, 900, 1.0 + 0.03 * smooth(phase(abs, BAR(2), BAR(3))));
    bedroom(ctx, abs, { rain: 0 });
    // the ball: nudged onto the bed, then pushed back without a look
    const out = smooth(phase(abs, EV.ballPush, EV.ballPush + 0.4));
    const back = smooth(phase(abs, EV.ballBack, EV.ballBack + 0.45));
    const bx = lerp(610, 735, out - back),
      by = lerp(1080, 958, out - back) - Math.sin(Math.PI * (out - back)) * 40;
    // his left hand leaves the phone to push it back
    const reach = smooth(phase(abs, 5.05, 5.4)) * (1 - smooth(phase(abs, 5.55, 5.9)));
    const hx = (735 - 820) / 0.8,
      hy = (950 - 600) / 0.8;
    drawKid(ctx, 820, 600, 0.8, {
      body: "bust",
      arms: "phone",
      handL: [lerp(-58, hx + 40, reach), lerp(330, hy - 20, reach)],
      shapeL: reach > 0.3 ? "flat" : "hold",
      eyes: "tired",
      mouth: "flat",
      look: [0, 1],
      tilt: 0.04,
      holding: (c) => {
        // the phone in his hands, screen toward him (we see the back + its glow)
        c.save();
        c.translate(0, 300);
        c.rotate(0.08);
        c.fillStyle = "#1a1a1e";
        c.beginPath();
        c.roundRect(-46, -84, 92, 168, 16);
        c.fill();
        c.strokeStyle = C.ink;
        c.lineWidth = 5;
        c.stroke();
        c.restore();
      },
    });
    bedBlanket(ctx);
    ballToy(ctx, bx, by, 30, 1630);
    // 豆豆 peeks over the edge of the bed
    const rise = easeOut(phase(abs, BAR(2), BAR(2) + 0.45));
    const sag = smooth(phase(abs, 5.9, 6.2));
    drawDog(ctx, 500, lerp(1240, 1050, rise) + sag * 16, 1.12, {
      view: "front",
      pose: "head",
      eyes: abs > 5.6 ? "sad" : "open",
      ears: 0.6 - 0.45 * sag,
      look: [0.8, -0.6],
      headTilt: abs > EV.ballPush - 0.1 && abs < EV.ballPush + 0.3 ? -0.12 : 0.04,
    });
    for (const side of [-1, 1]) {
      oval(ctx, 500 + side * 62, 1150 + (1 - rise) * 170, 34, 20, 1640 + side, 0.8);
      paint(ctx, "#fbf4e6", C.ink, 4.5);
    }
    // only the phone lights the room
    lightPool(ctx, 820, 840, 900, 0.62, "rgba(120,160,255,0.22)");
    ctx.restore();
    return;
  }
  if (abs < 7.4) {
    // over his shoulder: the photo he keeps staring at
    fillBg(ctx, "#0b0d1c");
    glow(ctx, 540, 800, 900, "rgba(120,160,255,0.28)");
    const zoom = smooth(phase(abs, 6.56, 7.0));
    const s = 0.74 + 0.03 * smooth(phase(abs, BAR(3), 7.4));
    phone(ctx, 540, 820, s, -0.03, (c) => photoScreen(c, abs, { caption: 0, zoom: 1 + 0.18 * zoom }));
    heldHands(ctx, 540, 820, s, -0.03, fingerAt(abs, PHOTO_FINGER)!);
    return;
  }
  // 豆豆's face in the phone light
  fillBg(ctx, "#0c0f22");
  ctx.save();
  camera(ctx, 540, 860, 1 + 0.05 * smooth(phase(abs, 7.4, BAR(4))));
  glow(ctx, 760, 520, 700, "rgba(120,160,255,0.3)");
  drawDog(ctx, 540, 1010, 2.6, { view: "front", pose: "sit", eyes: "sad", ears: 0.08, look: [0.5, -0.6], headTilt: -0.06, breathe: abs * 0.4 });
  lightPool(ctx, 600, 760, 900, 0.5, "rgba(120,160,255,0.16)");
  ctx.restore();
}

// ---------------------------------------------------------------- 1C dawn: he leaves
function shotMorning(ctx: Ctx, abs: number) {
  if (abs < BAR(5)) {
    const tookHelmet = abs > 8.75;
    const opened = smooth(phase(abs, EV.morningDoor, EV.morningDoor + 0.25)) * (1 - smooth(phase(abs, 10.0, EV.slam)));
    ctx.save();
    camera(ctx, 560, 1000, 1.02);
    entrance(ctx, abs, { light: 1, door: opened, helmet: !tookHelmet, jar: 0.82, bowl: true });
    // him at the door (from behind), a look back, then gone
    const turned = abs > 9.12 && abs < 9.5;
    const leave = smooth(phase(abs, 9.7, 10.1));
    if (leave < 1) {
      const x = lerp(780, 860, leave),
        y = lerp(706, 690, leave),
        s = lerp(0.58, 0.5, leave);
      ctx.save();
      if (leave > 0.6) ctx.globalAlpha = 1 - phase(leave, 0.6, 1);
      drawKid(ctx, x, y, s, {
        body: "full",
        view: turned ? "front" : "back",
        legs: leave > 0 && leave < 1 ? "walk" : "stand",
        walk: abs * 9,
        eyes: "sad",
        mouth: "bite",
        turn: -0.6,
        look: [-1, 0.5],
        arms: turned ? "custom" : "down",
        handR: turned ? [lerp(120, 170, smooth(phase(abs, 9.15, 9.3))), lerp(432, 330, smooth(phase(abs, 9.15, 9.3)))] : undefined,
        shapeR: turned ? "open" : "relax",
        handL: [-120, 432],
        grip: tookHelmet && !turned ? helmetInHand : undefined,
      });
      ctx.restore();
    }
    // 豆豆 sits with the leash in its mouth, hoping for a walk
    const slam = abs > EV.slam;
    drawDog(ctx, 360, 1010, 0.92, {
      pose: "sit",
      mouth: slam && abs > EV.slam + 0.15 ? "closed" : "leash",
      eyes: slam ? "sad" : "open",
      ears: slam ? 0.1 : 0.75,
      tail: slam ? -0.2 : 0.6,
      wag: abs * 20,
      wagAmt: slam ? 0 : 1,
      headUp: 0.9,
      breathe: abs * 0.4,
    });
    if (slam && abs > EV.slam + 0.15) {
      // the dropped leash
      inkLine(ctx, [[470, 1150], [520, 1176], [610, 1170], [680, 1186]], 1650, 7, "#c0392b");
    }
    ctx.restore();
    if (abs > EV.slam && abs < EV.slam + 0.12) flash(ctx, 0.25, "#000");
    card(ctx, "早上 6:30", 70, 330, smooth(phase(abs, BAR(4) + 0.1, BAR(4) + 0.4)) * (1 - phase(abs, 9.9, 10.2)));
    return;
  }
  // waiting by the door all day: light sweeps, cards flip, a cough
  const u = phase(abs, BAR(5), BAR(6));
  const night = smooth(phase(u, 0.55, 0.85));
  ctx.save();
  camera(ctx, 640, 1060, 1.06);
  entrance(ctx, abs, { light: 1 - night, door: 0, jar: 0.82, bowl: true });
  // sunlight patch sliding across the floor during the day
  const day = Math.sin(Math.PI * clamp(u / 0.7));
  if (day > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 * day;
    ctx.fillStyle = "#ffe7a8";
    const sx = lerp(-200, 700, u / 0.7);
    ctx.beginPath();
    ctx.moveTo(sx, 1180);
    ctx.lineTo(sx + 260, 1176);
    ctx.lineTo(sx + 420, 1900);
    ctx.lineTo(sx + 60, 1900);
    ctx.fill();
    ctx.restore();
  }
  inkLine(ctx, [[520, 1180], [560, 1200], [640, 1196], [700, 1214]], 1650, 7, "#c0392b");
  const cough = abs > EV.cough && abs < EV.cough + 0.35;
  const [cx, cy] = shake(abs, cough ? 5 : 0, 3);
  drawDog(ctx, 700 + cx, 1066 + cy, 0.86, {
    pose: "lie",
    headUp: cough ? 0.5 : 0.05,
    eyes: cough ? "shut" : "half",
    ears: 0.08,
    tail: -0.4,
    breathe: abs * 0.3,
  });
  if (night > 0) {
    ctx.fillStyle = `rgba(6,8,22,${0.45 * night})`;
    ctx.fillRect(-60, -60, W + 120, H + 120);
  }
  if (cough) {
    const k = phase(abs, EV.cough, EV.cough + 0.35);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    text(ctx, "咳", 900 + k * 30, 920 - k * 40, { size: 56, font: F.cn, fill: "#fff", stroke: C.ink, lw: 8 });
    for (let i = 0; i < 3; i++) {
      oval(ctx, 880 + i * 26 + k * 40, 990 - k * 20 - i * 6, 10 + k * 8, 8 + k * 6, 1660 + i, 0.6);
      paint(ctx, "rgba(240,240,250,0.8)", null);
    }
    ctx.restore();
  }
  ctx.restore();
  const cards: [string, number, number][] = [
    ["上午 9:00", BAR(5), 10.9],
    ["下午 3:00", 10.9, 11.45],
    ["晚上 11:00", 11.45, BAR(6)],
  ];
  for (const [s, a, b] of cards) card(ctx, s, 70, 330, smooth(phase(abs, a, a + 0.12)) * (1 - phase(abs, b - 0.08, b)));
}

// ---------------------------------------------------------------- 1D the escape
function shotEscape(ctx: Ctx, abs: number) {
  if (abs < 13.36) {
    // looking at his door: light under it, his shadow moving — he's still busy on the phone
    ctx.save();
    camera(ctx, 540, 1000, 1.03 + 0.03 * smooth(phase(abs, BAR(6), 13.36)));
    hallway(ctx, abs, { shadow: 1, jacket: true });
    bunnyToy(ctx, 560, 1150, 0.8, 0.2, 1670);
    ctx.save();
    ctx.translate(760, 0);
    ctx.scale(-1, 1);
    drawDog(ctx, 0, 1010, 0.95, {
      pose: "sit",
      eyes: abs > 12.9 ? "sad" : "open",
      ears: 0.15,
      headUp: abs > 12.9 ? 0.2 : 0.8,
      tail: -0.2,
      breathe: abs * 0.4,
    });
    ctx.restore();
    ctx.restore();
    return;
  }
  if (abs < BAR(7)) {
    // close-up: it picks up the bunny
    fillBg(ctx, "#121528");
    glow(ctx, 300, 1300, 800, "rgba(255,190,110,0.25)");
    const dip = abs < EV.squeak ? smooth(phase(abs, 13.36, EV.squeak)) : 1 - smooth(phase(abs, EV.squeak, EV.squeak + 0.3));
    ctx.save();
    camera(ctx, 540, 860, 1 + 0.04 * smooth(phase(abs, 13.36, BAR(7))));
    drawDog(ctx, 540, 990 + dip * 60, 2.5, {
      view: "front",
      pose: "sit",
      mouth: abs >= EV.squeak ? "toy" : "closed",
      eyes: "sad",
      ears: 0.12,
      headTilt: dip * 0.1,
      look: [0, 0.2],
    });
    if (abs < EV.squeak) bunnyToy(ctx, 620, 1180, 1.4, 0.2, 1671);
    ctx.restore();
    if (abs > EV.squeak && abs < EV.squeak + 0.4) {
      const k = backOut(phase(abs, EV.squeak, EV.squeak + 0.2));
      ctx.save();
      ctx.translate(800, 700);
      ctx.scale(k, k);
      text(ctx, "吱", 0, 0, { size: 70, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10, alpha: 1 - phase(abs, EV.squeak + 0.25, EV.squeak + 0.4) });
      ctx.restore();
    }
    return;
  }
  // through the hall, past the jar and the vet's flyer, out of the door left ajar
  const pan = -170 * smooth(phase(abs, BAR(7), 15.6));
  ctx.save();
  camera(ctx, 540, 1000, 1.02);
  entrance(ctx, abs, { door: 0.26, helmet: true, jar: 0.82, pan, bowl: true });
  const u = phase(abs, BAR(7), 15.5);
  const out = phase(abs, 15.82, 16.36);
  const x = lerp(80, 640, u) + pan + out * 210;
  // the open door panel starts at 1000 - 300*(1-0.26*0.82) ≈ 764 (+pan): the dog slips behind it
  const panelLeft = 1000 - 300 * (1 - 0.26 * 0.82) + pan;
  ctx.save();
  if (out > 0) {
    ctx.beginPath();
    ctx.rect(-100, 0, panelLeft + 100, H);
    ctx.clip();
  }
  drawDog(ctx, x, 1056 - out * 20, 0.8 * (1 - 0.15 * out), {
    pose: abs > 15.5 && abs < 15.82 ? "stand" : "walk",
    walk: abs * 7,
    mouth: "toy",
    eyes: "sad",
    ears: 0.15,
    tail: -0.3,
    headUp: abs > 15.5 && abs < 15.82 ? 0.15 : 0.35,
  });
  ctx.restore();
  ctx.restore();
  // cold air from outside
  glow(ctx, 760 + pan, 760, 600, "rgba(140,170,255,0.18)", phase(abs, 15.4, 16.3));
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    if (abs < BAR(2)) shotHook(ctx, abs);
    else if (abs < BAR(4)) shotBed(ctx, abs);
    else if (abs < BAR(6)) shotMorning(ctx, abs);
    else shotEscape(ctx, abs);
  });
}
