import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blob, camera, card, curve, designScene, easeIn, easeOut, fillBg, filtered, flash, glow, inkLine, oval, paint, poly, rbox, rr, shake, text } from "@materials/s0rrow/code/draw";
import { drawHand, drawKid } from "@materials/s0rrow/code/kid";
import { bunnyToy, drawDog, xray } from "@materials/s0rrow/code/dog";
import { CAST, drawPerson } from "@materials/s0rrow/code/people";
import { busStop, clinicCounter, clinicFront, coinJar, petShopWindow, puddle, rain, rainStreet, splashes } from "@materials/s0rrow/code/places";
import { phone, SH, SW, statusBar } from "@materials/s0rrow/code/phone";
import { BAR, EV } from "./timeline";

/** ACT 2 (16.43 – 32.79s) · the rainy night
 *  2A the pet-shop window full of pretty puppies — and its own wet, scruffy reflection
 *  2B shivering under a bus-stop bench; the memory of the day he found it (sepia)
 *  2C its heart gives out; a flashlight; "豆豆——！" — he runs in wearing a yellow rider jacket
 *  2D he carries it to the pet hospital: heart X-ray, ¥8,600 surgery — he slams down the money */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** dark edges closing in (the dog losing consciousness) */
function closingVignette(ctx: Ctx, cx: number, cy: number, r: number, dark = 0.96) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
  g.addColorStop(0, "rgba(2,3,10,0)");
  g.addColorStop(1, `rgba(2,3,10,${dark})`);
  ctx.fillStyle = g;
  ctx.fillRect(-80, -80, W + 160, H + 160);
}

// ---------------------------------------------------------------- 2A the pet-shop window
function shotWindow(ctx: Ctx, abs: number) {
  if (abs < BAR(9)) {
    const push = smooth(phase(abs, BAR(8), BAR(9)));
    ctx.save();
    camera(ctx, 640, 960, 1.0 + 0.08 * push, 0, 0, -40);
    rainStreet(ctx, abs, { shop: true });
    puddle(ctx, 300, 1200, 140, 26, abs, 1701);
    puddle(ctx, 820, 1260, 180, 30, abs + 0.3, 1702);
    const u = phase(abs, BAR(8), 17.7);
    const walking = abs < 17.7;
    drawDog(ctx, lerp(-120, 380, u), 1040, 0.78, {
      pose: walking ? "walk" : "stand",
      walk: abs * 7,
      mouth: "toy",
      wet: 0.75,
      eyes: abs > 17.9 ? "open" : "sad",
      ears: abs > 17.9 ? 0.35 : 0.1,
      tail: -0.4,
      headUp: abs > 17.7 ? 0.62 : 0.3,
      breathe: abs * 0.5,
    });
    rain(ctx, abs, 1, 0.16, 3);
    splashes(ctx, abs, 1130, 1900, 1, 9);
    ctx.restore();
    if (abs < BAR(8) + 0.12) flash(ctx, 0.5 * (1 - phase(abs, BAR(8), BAR(8) + 0.12)), "#cfe0ff");
    return;
  }
  // through the glass: pretty puppies inside, its own reflection outside
  const k = smooth(phase(abs, BAR(9), 19.6));
  const ugly = smooth(phase(abs, 19.55, 20.1));
  ctx.save();
  camera(ctx, 540, 760, 1.0 + 0.04 * smooth(phase(abs, BAR(9), BAR(10))));
  fillBg(ctx, "#1b1530");
  petShopWindow(ctx, abs, 40, 260, 1000, 1000, 1, 2.1);
  // its reflection on the glass, cold and grey
  filtered(ctx, "grayscale(0.5) brightness(1.15)", (c) => {
    drawDog(c, 300, 620, 1.55, { view: "front", pose: "head", wet: 1, eyes: ugly > 0.5 ? "sad" : "half", ears: 0.08, look: [0.6, 0.3], headTilt: -0.08 });
  }, "refl", 0.16 + 0.3 * k);
  // raindrops running down the glass
  ctx.strokeStyle = "rgba(220,235,255,0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const x = 60 + ((i * 97) % 960);
    const y = 260 + ((abs * (60 + (i % 5) * 30) + i * 140) % 1000);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y + 34);
    ctx.stroke();
    oval(ctx, x + 2, y + 38, 5, 7, 1710 + i, 0.4);
    paint(ctx, "rgba(220,235,255,0.6)", null);
  }
  // window frame
  rbox(ctx, 40, 260, 1000, 1000, 8, 1720, 1.4);
  paint(ctx, null, C.ink, 12);
  ctx.restore();
}

// ---------------------------------------------------------------- 2B bus stop + the memory
function memory(c: Ctx, abs: number) {
  // rain years ago: a little boy with an umbrella finds a puppy in a box
  fillBg(c, "#7a6f66");
  poly(c, [[-60, 1150], [1140, 1140], [1140, 2000], [-60, 2000]], 1730, 1.5);
  paint(c, "#5d554f", C.ink, 6);
  const lift = smooth(phase(abs, 23.35, 23.9));
  // box (wet cardboard)
  poly(c, [[330, 1010], [660, 1004], [680, 1236], [310, 1242]], 1731, 1.4);
  paint(c, "#b88a56", C.ink, 6);
  poly(c, [[330, 1010], [240, 950], [420, 938], [490, 1006]], 1732, 1.2);
  paint(c, "#c99a62", C.ink, 5);
  inkLine(c, [[350, 1060], [640, 1056]], 1733, 3, "#8a6a3a");
  if (lift <= 0.3) drawDog(c, 480, 990, 0.46, { view: "front", pose: "head", young: 1, wet: 1, eyes: "sad", ears: 0.2, collar: false });
  // the kid (younger), kneeling beside the box under his umbrella
  const umbrella = (k: Ctx) => {
    k.save();
    k.translate(150, 130);
    inkLine(k, [[0, 0], [-40, -320]], 1740, 7, "#3a2a22");
    k.translate(-40, -320);
    blob(k, [[-260, 30], [-200, -90], [0, -150], [200, -90], [260, 30], [130, 10], [0, 30], [-130, 10]], 1741, 2);
    paint(k, "#d8343c", C.ink, 6);
    inkLine(k, [[0, -150], [0, 30]], 1742, 3, "#8a1a1a");
    k.restore();
  };
  drawKid(c, 740, 830 - lift * 30, 0.62, {
    body: "full",
    legs: "kneel",
    eyes: lift > 0.5 ? "happy" : "open",
    mouth: lift > 0.5 ? "smile" : "o",
    look: [-0.8, 0.8],
    arms: "custom",
    handL: lift > 0.3 ? [-50, 300] : [-290, 350],
    handR: [150, 130],
    shapeR: "hold",
    shapeL: lift > 0.3 ? "flat" : "open",
    grip: umbrella,
    holding: lift > 0.3 ? (k) => drawDog(k, -10, 270, 0.62, { view: "front", pose: "sit", young: 1, eyes: "happy", wet: 0.5, ears: 0.5, collar: false }) : undefined,
  });
  rain(c, abs, 0.7, 0.1, 21, "rgba(255,250,240,0.6)");
}

function shotBench(ctx: Ctx, abs: number) {
  if (abs < BAR(11)) {
    ctx.save();
    camera(ctx, 520, 1020, 1.0 + 0.08 * smooth(phase(abs, BAR(10), BAR(11))), 0, 0, -30);
    busStop(ctx, abs);
    const shiver = Math.sin(abs * 60) * 1.6;
    bunnyToy(ctx, 690, 1150, 0.55, 0.3, 1750);
    drawDog(ctx, 520 + shiver, 1040, 0.85, { pose: "lie", headUp: 0.05, wet: 1, eyes: "half", ears: 0.05, tail: -0.5, breathe: abs * 0.6 });
    // breath fog
    const f = (abs * 0.9) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - f) * 0.5;
    oval(ctx, 720 + f * 40, 1080 - f * 30, 16 + f * 20, 10 + f * 12, 1751, 1);
    paint(ctx, "#e8eef8", null);
    ctx.restore();
    rain(ctx, abs, 1, 0.12, 5);
    splashes(ctx, abs, 1180, 1900, 0.8, 11);
    ctx.restore();
    return;
  }
  // memory (sepia), framed by a soft vignette
  const inK = smooth(phase(abs, BAR(11), BAR(11) + 0.35));
  const outK = smooth(phase(abs, BAR(12) - 0.3, BAR(12)));
  filtered(ctx, "sepia(0.85) saturate(0.9) contrast(0.95)", (c) => {
    c.save();
    camera(c, 540, 900, 1.06 - 0.04 * smooth(phase(abs, BAR(11), BAR(12))));
    memory(c, abs);
    c.restore();
  }, "mem");
  const g = ctx.createRadialGradient(540, 900, 300, 540, 900, 1000);
  g.addColorStop(0, "rgba(40,25,10,0)");
  g.addColorStop(1, "rgba(40,25,10,0.75)");
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
  card(ctx, "2016年 · 他捡到我的那天", 540, 330, smooth(phase(abs, BAR(11) + 0.2, BAR(11) + 0.5)) * (1 - outK), 40, "center");
  flash(ctx, 0.7 * (1 - inK) + 0.5 * outK, "#fff6e0");
}

// ---------------------------------------------------------------- 2C collapse → flashlight → him
function shotCollapse(ctx: Ctx, abs: number) {
  if (abs < BAR(13)) {
    const fall = abs >= EV.collapse;
    const close = smooth(phase(abs, EV.collapse + 0.1, BAR(13)));
    ctx.save();
    camera(ctx, 560, 1060, 1.04 + 0.1 * smooth(phase(abs, BAR(12), BAR(13))), 0, 0, -30);
    busStop(ctx, abs);
    bunnyToy(ctx, 690, 1150, 0.55, 0.3, 1750);
    if (!fall) {
      const u = phase(abs, 24.85, 25.6);
      const wob = Math.sin(abs * 9) * 0.06;
      drawDog(ctx, lerp(520, 600, u), 1040 - smooth(phase(abs, BAR(12), 24.85)) * 50, 0.85, {
        pose: u > 0 && u < 1 ? "walk" : "stand",
        walk: abs * 5,
        wet: 1,
        eyes: "half",
        ears: 0.05,
        tail: -0.6,
        headUp: 0.2,
        headTilt: wob,
      });
    } else {
      const k = easeIn(phase(abs, EV.collapse, EV.collapse + 0.25));
      drawDog(ctx, 610, 1060 + (1 - k) * -30, 0.85, {
        pose: "flop",
        wet: 1,
        eyes: abs > 26.2 ? "shut" : "half",
        breathe: abs * 0.25,
      });
    }
    rain(ctx, abs, 1, 0.12, 5);
    splashes(ctx, abs, 1180, 1900, 0.8, 11);
    ctx.restore();
    // heartbeat pulses (slowing) darken the edges
    const beats = [24.95, 25.45, 26.05, 26.75];
    let pulse = 0;
    for (const b of beats) if (abs > b) pulse = Math.max(pulse, Math.exp(-(abs - b) * 7));
    closingVignette(ctx, 640, 1080, lerp(1500, 520, close) * (1 - 0.06 * pulse), 0.9 + 0.08 * pulse);
    if (pulse > 0) flash(ctx, pulse * 0.12, "#ff2030");
    return;
  }
  // nearly black; a flashlight finds 豆豆; "豆豆——！"; he runs in (yellow rider jacket)
  fillBg(ctx, "#03040b");
  const found = abs >= EV.flashlight + 0.4;
  const beamK = smooth(phase(abs, EV.flashlight, EV.flashlight + 0.4));
  ctx.save();
  camera(ctx, 560, 1060, 1.14, 0, 0, -30);
  busStop(ctx, abs);
  drawDog(ctx, 610, 1060, 0.85, { pose: "flop", wet: 1, eyes: "shut", breathe: abs * 0.25 });
  rain(ctx, abs, 1, 0.12, 5);
  ctx.restore();
  // darkness except the beam
  const bx = lerp(1300, 640, beamK),
    by = lerp(700, 1060, beamK);
  const g = ctx.createRadialGradient(bx, by, 60, bx, by, 520);
  g.addColorStop(0, "rgba(2,3,10,0)");
  g.addColorStop(1, "rgba(2,3,10,0.97)");
  ctx.fillStyle = g;
  ctx.fillRect(-80, -80, W + 160, H + 160);
  if (abs >= EV.flashlight) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, bx, by, 300, "rgba(255,250,220,0.35)", 1);
    ctx.restore();
  }
  // him, running in out of the dark
  if (abs > 27.85) {
    const u = phase(abs, 27.85, 28.6);
    const kneel = abs > 28.5;
    const x = lerp(820, 760, u),
      y = lerp(560, 640, u),
      s = lerp(0.36, 0.56, u);
    drawKid(ctx, x, y, s, {
      body: "full",
      outfit: "rider",
      legs: kneel ? "kneel" : "run",
      walk: abs * 14,
      wet: 1,
      eyes: "wide",
      mouth: "shout",
      brows: "worried",
      look: [-0.6, 0.7],
      arms: "custom",
      handL: [-130, 330],
      handR: [170, 250],
      shapeR: "hold",
      grip: (c) => {
        c.save();
        c.translate(176, 236);
        c.rotate(-2.4);
        rr(c, -16, -50, 32, 100, 8);
        paint(c, "#2a2a30", C.ink, 4);
        c.restore();
      },
      headY: kneel ? 0 : -Math.abs(Math.sin(abs * 14)) * 10,
    });
  }
  if (abs > EV.shout) {
    const k = backOut(phase(abs, EV.shout, EV.shout + 0.2));
    const [sx, sy] = shake(abs, 6, 4);
    ctx.save();
    ctx.translate(560 + sx, 420 + sy);
    ctx.scale(k, k);
    ctx.rotate(-0.06);
    text(ctx, "豆豆——！", 0, 0, { size: 132, font: F.cn, fill: "#fff", stroke: C.ink, lw: 18 });
    ctx.restore();
  }
  void found;
}

// ---------------------------------------------------------------- 2D the hospital: the reveal
function cradle(c: Ctx) {
  // the limp dog held across his chest (kid local units)
  c.save();
  c.translate(-60, 300);
  c.rotate(0.06);
  drawDog(c, 0, 0, 0.82, { pose: "flop", wet: 1, eyes: "shut" });
  c.restore();
}

function counterSlam(ctx: Ctx, abs: number) {
  const t = abs - EV.slamCash;
  const hit = t >= 0;
  const [sx, sy] = shake(abs, hit && t < 0.3 ? 12 : 0, 8);
  ctx.save();
  ctx.translate(sx, sy);
  fillBg(ctx, "#cfdde1");
  // counter top
  poly(ctx, [[-60, 360], [1140, 340], [1140, 2000], [-60, 2000]], 1800, 1.5);
  paint(ctx, "#f2f5f6", C.ink, 6);
  // the phone: this month's delivery income
  ctx.save();
  ctx.translate(820, 640);
  ctx.rotate(0.12);
  phone(ctx, 0, 0, 0.42, 0, (c) => {
    c.fillStyle = "#fff8e8";
    c.fillRect(0, 0, SW, SH);
    statusBar(c, { time: "02:06", airplane: false, battery: 0.12, dark: true });
    c.fillStyle = "#ffb000";
    c.fillRect(0, 90, SW, 200);
    text(c, "骑手收入", SW / 2, 190, { size: 52, font: F.ui, weight: 700, fill: "#fff" });
    text(c, "本月", SW / 2, 400, { size: 40, font: F.ui, fill: "#666" });
    text(c, "¥8,620", SW / 2, 520, { size: 120, font: F.ui, weight: 700, fill: "#ff7a00" });
    text(c, "配送 1,036 单", SW / 2, 660, { size: 44, font: F.ui, fill: "#333" });
    text(c, "夜间单 612 单", SW / 2, 740, { size: 44, font: F.ui, fill: "#333" });
  }, 1801);
  ctx.restore();
  // the jar, tipped over, coins everywhere
  ctx.save();
  ctx.translate(250, 600);
  ctx.rotate(-1.2);
  coinJar(ctx, 0, 0, 1.2, 0.35, 1802);
  ctx.restore();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + i;
    const d = (hit ? 1 - Math.exp(-t * 6) : 0) * (120 + (i % 7) * 50);
    const x = 300 + Math.cos(a) * d,
      y = 760 + Math.sin(a) * d * 0.6 - (hit ? Math.max(0, Math.sin(t * 8 + i)) * 20 * Math.exp(-t * 4) : 0);
    oval(ctx, x, y, 22, 11, 1810 + i, 0.4, a);
    paint(ctx, i % 3 ? "#e9c45a" : "#c9a23a", "#8a6a1a", 3);
  }
  // the envelope stuffed with cash
  const drop = hit ? 0 : 1 - smooth(phase(abs, EV.slamCash - 0.3, EV.slamCash));
  ctx.save();
  ctx.translate(560, 1000 - drop * 300);
  ctx.rotate(-0.08);
  ctx.scale(1 + drop * 0.25, 1 + drop * 0.25);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate(-0.3 + i * 0.14);
    rr(ctx, -40, -230, 200, 100, 6);
    paint(ctx, "#f2a7b0", C.ink, 3.5);
    text(ctx, "100", 60, -180, { size: 34, font: F.ui, weight: 700, fill: "#b8324a" });
    ctx.restore();
  }
  poly(ctx, [[-230, -150], [230, -160], [240, 150], [-220, 160]], 1830, 1.4);
  paint(ctx, "#c99a62", C.ink, 6);
  poly(ctx, [[-230, -150], [0, 20], [230, -160]], 1831, 1.2, false);
  paint(ctx, null, "#8a6a3a", 4);
  text(ctx, "豆豆的手术费", 0, 80, { size: 54, font: F.pen, fill: "#3a2a1a" });
  ctx.restore();
  // his hands slam down (yellow sleeves, band-aids)
  const hy = hit ? 0 : -80 * (1 - smooth(phase(abs, EV.slamCash - 0.25, EV.slamCash)));
  for (const side of [-1, 1]) {
    const x = 560 + side * 250,
      y = 1210 + hy;
    blob(ctx, [[x - 70 * side - 10, y + 40], [x + 40 * side, y - 10], [x + 120 * side, y + 400], [x - 150 * side, y + 420]], 1840 + side, 1.4);
    paint(ctx, "#f3b30c", C.ink, 6);
    poly(ctx, [[x - 80 * side, y + 90], [x + 70 * side, y + 50], [x + 90 * side, y + 90], [x - 76 * side, y + 130]], 1842 + side, 0.8);
    paint(ctx, "#e3e7ea", C.ink, 3);
    drawHand(ctx, x - 10 * side, y + 10, 1.5, -Math.PI / 2 - side * 0.35, "flat", side < 0, true, 1850 + side);
  }
  if (hit && t < 0.25) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r0 = 300 + t * 600,
        r1 = r0 + 70;
      ctx.beginPath();
      ctx.moveTo(560 + Math.cos(a) * r0, 1000 + Math.sin(a) * r0 * 0.6);
      ctx.lineTo(560 + Math.cos(a) * r1, 1000 + Math.sin(a) * r1 * 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function shotHospital(ctx: Ctx, abs: number) {
  if (abs < 29.82) {
    // kneeling in the rain, holding it, crying
    fillBg(ctx, "#070914");
    ctx.save();
    camera(ctx, 540, 760, 1.02 + 0.06 * smooth(phase(abs, BAR(14), 29.82)));
    glow(ctx, 540, 600, 800, "rgba(120,140,200,0.25)");
    const lift = smooth(phase(abs, 29.1, 29.7));
    drawKid(ctx, 540, 660 - lift * 40, 1.05, {
      body: "bust",
      outfit: "rider",
      wet: 1,
      eyes: "shut",
      mouth: "open",
      brows: "sad",
      tears: 0.6 + 0.4 * Math.sin(abs * 3) ** 2,
      tilt: -0.08,
      arms: "custom",
      handL: [-120, 420],
      handR: [150, 390],
      shapeL: "flat",
      shapeR: "flat",
      grip: cradle,
    });
    rain(ctx, abs, 1.2, 0.08, 7);
    ctx.restore();
    return;
  }
  if (abs < BAR(15)) {
    // running into the pet hospital
    const op = smooth(phase(abs, EV.clinicDoors, EV.clinicDoors + 0.35));
    ctx.save();
    camera(ctx, 540, 900, 1.0 + 0.12 * smooth(phase(abs, 29.82, BAR(15))));
    clinicFront(ctx, abs, op);
    const u = phase(abs, 29.82, BAR(15));
    drawKid(ctx, 540, lerp(980, 820, u), lerp(0.7, 0.55, u), {
      body: "full",
      view: "back",
      outfit: "rider",
      legs: "run",
      walk: abs * 14,
      wet: 1,
      arms: "custom",
      handL: [-90, 300],
      handR: [90, 300],
      holding: (c) => {
        // its head and tail poke out on either side of his back
        drawDog(c, -40, 250, 0.6, { pose: "flop", wet: 1, eyes: "shut" });
      },
    });
    rain(ctx, abs, 1, 0.12, 9);
    ctx.restore();
    return;
  }
  if (abs < 31.75) {
    // the X-ray: a hole in its heart
    ctx.save();
    camera(ctx, 540, 640, 1.0 + 0.05 * smooth(phase(abs, BAR(15), 31.75)));
    clinicCounter(ctx, abs);
    const on = abs >= EV.xray;
    if (on) xray(ctx, 290, 360, 500, 340, abs, smooth(phase(abs, EV.xray + 0.15, EV.xray + 0.5)));
    drawPerson(ctx, 890, 800, 0.9, { ...CAST.vet, face: "sad", arms: "point", body: "bust", turn: -0.6, mask: 0 });
    // the consent form
    const f = backOut(phase(abs, 31.05, 31.3));
    if (f > 0) {
      ctx.save();
      ctx.translate(330, 1020);
      ctx.rotate(-0.06);
      ctx.scale(f, f);
      poly(ctx, [[-200, -110], [200, -116], [206, 110], [-196, 114]], 1870, 1.2);
      paint(ctx, "#fffdf6", C.ink, 5);
      text(ctx, "心脏手术", 0, -50, { size: 58, font: F.cn, fill: "#222" });
      text(ctx, "费用 ¥8,600", 0, 36, { size: 54, font: F.cn, fill: C.red });
      ctx.restore();
    }
    ctx.restore();
    if (on && abs < EV.xray + 0.15) flash(ctx, 0.8 * (1 - phase(abs, EV.xray, EV.xray + 0.15)), "#e8fbff");
    return;
  }
  counterSlam(ctx, abs);
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(8), (ctx, abs) => {
    if (abs < BAR(10)) shotWindow(ctx, abs);
    else if (abs < BAR(12)) shotBench(ctx, abs);
    else if (abs < BAR(14)) shotCollapse(ctx, abs);
    else shotHospital(ctx, abs);
  });
}
