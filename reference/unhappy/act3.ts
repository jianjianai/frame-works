import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, backOut, blob, camera, card, designScene, easeOut, fillBg, flash, glow, inkLine, oval, paint, rr, text, writeOn } from "./lib/draw";
import { drawKid, helmetProp } from "./lib/kid";
import { ballToy, bunnyToy, drawDog } from "./lib/dog";
import { CAST, drawPerson } from "./lib/people";
import { entrance, kennelBars, recoveryRoom, surgeryHall } from "./lib/places";
import { phone, SH, SW } from "./lib/phone";
import { FingerKey, fingerAt, heldHands } from "./lib/hand";
import { orderScreen, photoScreen, savingsScreen, stickyNote } from "./lib/screens";
import { lightPool, heart } from "./lib/sets";
import { BAR, EV } from "./lib/timeline";

/** ACT 3 (32.79 – 49.14s) · 他的视角
 *  3A the same night, from his side: 32 deliveries, band-aids, the vet's note "don't let it get excited";
 *     at 1:12 a.m. he sits by the sleeping dog and strokes its head
 *  3B his phone: the "pretty puppy" is 豆豆 the day he found it; the savings goal; one more order → enough
 *  3C 手术中 — the long night on the bench; the light goes out, the vet nods
 *  3D two weeks by its kennel; it wakes, licks his hand; he strokes its head — awake this time */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- 3A the same night, his side
function shotNight(ctx: Ctx, abs: number) {
  if (abs < BAR(17)) {
    const reach = smooth(phase(abs, 33.35, 33.8)) * (1 - smooth(phase(abs, 34.15, 34.45)));
    const lookNote = abs > 33.85 && abs < 34.45;
    ctx.save();
    camera(ctx, 540, 900, 1.04, 0, 0, -60);
    entrance(ctx, abs, { door: 0, jar: 0.75, bowl: true });
    // the vet's note on the wall
    stickyNote(ctx, 300, 640, 0.95, -0.05, ["医生说：", "手术前", "别让它激动"], 2401, smooth(phase(abs, 33.9, 34.3)));
    if (lookNote) glow(ctx, 300, 640, 260, "rgba(255,240,170,0.35)", smooth(phase(abs, 33.85, 34.05)));
    // 豆豆, excited to see him
    drawDog(ctx, 330, 1130, 1.0, { view: "front", pose: "lie", headUp: 1, eyes: "wide", ears: 0.95, mouth: "pant", wag: abs * 26, wagAmt: 1, look: [0.8, -0.5], breathe: abs });
    // him, exhausted, helmet + phone (32 deliveries today), band-aids
    drawKid(ctx, 760, 700, 0.92, {
      body: "bust",
      eyes: lookNote ? "sad" : "tired",
      look: lookNote ? [-1, -0.2] : [-0.8, 0.7],
      brows: lookNote ? "worried" : "flat",
      mouth: abs > 34.2 ? "bite" : "flat",
      turn: -0.35,
      bandaids: true,
      arms: "custom",
      handL: [lerp(-120, -330, reach), lerp(430, 460, reach)],
      shapeL: reach > 0.5 ? "open" : abs > 34.2 ? "fist" : "relax",
      handR: [80, 330],
      shapeR: "hold",
      grip: (c) => {
        // his phone: today's deliveries
        c.save();
        c.translate(92, 270);
        c.rotate(-0.15);
        rr(c, -50, -90, 100, 180, 16);
        paint(c, "#1a1a1e", C.ink, 5);
        rr(c, -42, -80, 84, 160, 10);
        paint(c, "#fff4d6", null);
        text(c, "今日", 0, -40, { size: 20, font: F.ui, weight: 700, fill: "#a66" });
        text(c, "32单", 0, 4, { size: 34, font: F.ui, weight: 700, fill: "#ff7a00" });
        c.restore();
      },
    });
    helmetProp(ctx, 980, 1060, 0.4, 0.3, 1611);
    lightPool(ctx, 520, 960, 1250, 0.45, "rgba(255,190,110,0.08)");
    ctx.restore();
    card(ctx, "23:47", 70, 330, smooth(phase(abs, BAR(16) + 0.1, BAR(16) + 0.4)) * (1 - phase(abs, 34.5, 34.8)));
    // rewind flicker as we switch to his point of view
    const rw = 1 - phase(abs, BAR(16), BAR(16) + 0.75);
    if (rw > 0) {
      ctx.save();
      ctx.globalAlpha = rw;
      ctx.fillStyle = "rgba(10,12,30,0.35)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const y = ((abs * 2600 + i * 331) % (H + 200)) - 100;
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.22)" : "rgba(120,200,255,0.18)";
        ctx.fillRect(0, y, W, 6 + (i % 3) * 8);
      }
      text(ctx, "◀◀", W - 150, 330, { size: 64, font: F.ui, weight: 700, fill: "#fff", stroke: C.ink, lw: 8 });
      ctx.restore();
    }
    return;
  }
  // 1:12 a.m. — he sits on the floor by the sleeping dog and strokes its head
  const stroke = Math.sin((abs - EV.strokeAt) * 4.5);
  const touching = abs > EV.strokeAt;
  ctx.save();
  camera(ctx, 520, 960, 1.08 + 0.04 * smooth(phase(abs, BAR(17), BAR(18))), 0, 0, -40);
  fillBg(ctx, "#0b0e1f");
  entrance(ctx, abs, { door: 0, jar: 0.95, bowl: true });
  ctx.fillStyle = "rgba(4,6,18,0.55)";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  oval(ctx, 380, 1210, 200, 50, 1620, 1.5);
  paint(ctx, "#3a3058", C.ink, 5);
  drawDog(ctx, 380, 1090, 1.1, { view: "front", pose: "lie", headUp: 0, eyes: "shut", ears: 0.1, breathe: abs * 0.3, headTilt: touching ? stroke * 0.03 : 0 });
  const hx = (380 - 560) / 0.7 + (touching ? stroke * 14 : 40),
    hy = (1012 - 790) / 0.7 + (touching ? 0 : -60);
  drawKid(ctx, 560, 790, 0.7, {
    body: "full",
    legs: "sitFloor",
    eyes: "tired",
    mouth: "smile",
    look: [-0.9, 0.8],
    tilt: -0.1,
    turn: -0.5,
    arms: "custom",
    handL: [hx, hy],
    shapeL: "flat",
    handR: [70, 420],
  });
  // light from the hall lamp
  lightPool(ctx, 460, 980, 900, 0.55, "rgba(255,190,110,0.16)");
  ctx.restore();
  card(ctx, "凌晨 1:12", 70, 330, smooth(phase(abs, BAR(17) + 0.1, BAR(17) + 0.4)) * (1 - phase(abs, 36.5, 36.85)));
  // his whisper
  const w = phase(abs, 35.6, 36.3);
  if (w > 0) {
    ctx.save();
    ctx.globalAlpha = 1 - phase(abs, 36.6, 36.85);
    text(ctx, writeOn("再等等，钱快够了", w), 760, 560, { size: 46, font: F.pen, fill: "#fff3d6", stroke: C.ink, lw: 8 });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 3B his phone
const PHONE_FINGER: FingerKey[] = [
  [BAR(18), 500, 1190, 0.2],
  [37.75, 470, 640, 0],
  [37.8, 470, 640, 1],
  [38.0, 130, 640, 1],
  [38.06, 130, 640, 0],
  [38.6, 500, 1190, 0.2],
  [39.6, 450, 960, 0.2],
  [39.82, 300, 1120, 0],
  [EV.accept, 300, 1120, 1],
  [39.98, 300, 1120, 1],
  [40.15, 450, 960, 0.2],
];

function shotPhone(ctx: Ctx, abs: number) {
  if (abs > 40.42) {
    // his face: tired, wet-eyed, a small smile — enough
    fillBg(ctx, "#0b0d1c");
    ctx.save();
    camera(ctx, 540, 800, 1.0 + 0.04 * smooth(phase(abs, 40.42, BAR(20))));
    glow(ctx, 540, 1100, 800, "rgba(120,160,255,0.3)");
    drawKid(ctx, 540, 760, 1.35, { body: "bust", eyes: "teary", mouth: "smile", brows: "sad", look: [0, 0.8], arms: "phone", tears: 0.3 });
    lightPool(ctx, 540, 1000, 900, 0.5, "rgba(120,160,255,0.2)");
    ctx.restore();
    return;
  }
  fillBg(ctx, "#0b0d1c");
  glow(ctx, 540, 800, 900, "rgba(120,160,255,0.28)");
  const s = 0.74;
  const slide = smooth(phase(abs, EV.swipe, EV.swipe + 0.3));
  const toOrder = abs > 39.05;
  const back = smooth(phase(abs, 40.2, 40.32));
  const amount = abs < EV.enough ? 7980 : lerp(7980, 8600, smooth(phase(abs, EV.enough, EV.enough + 0.12)));
  phone(ctx, 540, 820, s, -0.03, (c) => {
    if (!toOrder) {
      c.save();
      c.translate(-SW * slide, 0);
      photoScreen(c, abs, { caption: smooth(phase(abs, BAR(18) + 0.15, BAR(18) + 0.5)) });
      c.translate(SW, 0);
      savingsScreen(c, abs, amount);
      c.restore();
    } else if (back < 0.5) {
      orderScreen(c, abs, abs > EV.accept && abs < EV.accept + 0.12 ? 1 : 0, abs > EV.accept + 0.05 ? 1 : 0);
    } else {
      savingsScreen(c, abs, amount, 8600, abs > EV.enough + 0.1 ? 1 : 0);
    }
  });
  // left thumb rests low so the photo caption stays readable
  heldHands(ctx, 540, 820, s, -0.03, fingerAt(abs, PHONE_FINGER)!, { x: 110, y: 1190, touch: 0.2 });
}

// ---------------------------------------------------------------- 3C 手术中
function shotSurgery(ctx: Ctx, abs: number) {
  const lapse = phase(abs, BAR(21), 44.1);
  const clock = lerp(2 + 10 / 60, 5 + 40 / 60, smooth(lapse));
  const lightOn = abs < EV.lightOff ? 1 : 0;
  const open = smooth(phase(abs, EV.orDoor, EV.orDoor + 0.3));
  const up = smooth(phase(abs, 44.75, 45.0));
  ctx.save();
  camera(ctx, 540, 960, 1.0 + 0.05 * smooth(phase(abs, BAR(20), BAR(22))), 0, 0, -40);
  surgeryHall(ctx, abs, { lightOn, clock, dawn: smooth(lapse), blinds: lerp(0.35, 1, smooth(phase(abs, 41.0, 41.9))), doorOpen: open });
  // him on the bench, clutching the bunny
  const nod = abs > BAR(21) && abs < 44.2 ? Math.max(0, Math.sin(abs * 3)) * 0.12 : 0;
  drawKid(ctx, 280, lerp(900, 780, up), 0.62, {
    body: "full",
    outfit: "rider",
    wet: 0.5,
    legs: up > 0.5 ? "stand" : "sit",
    eyes: up > 0.3 ? "wide" : lapse > 0.1 && lapse < 0.95 ? "shut" : "sad",
    brows: up > 0.3 ? "up" : "sad",
    mouth: up > 0.3 ? "o" : "bite",
    look: up > 0.3 ? [1, 0] : [0, 1],
    tilt: up > 0.3 ? 0 : 0.12 + nod,
    arms: "custom",
    handL: up > 0.3 ? [-120, 432] : [-30, 330],
    handR: up > 0.3 ? [120, 432] : [40, 330],
    shapeL: "hold",
    shapeR: "hold",
    grip: up > 0.3 ? undefined : (c) => bunnyToy(c, 6, 300, 1.1, 0.1, 1910),
  });
  if (up > 0.3) bunnyToy(ctx, 330, 1096, 0.6, 0.4, 1910);
  // the vet comes out and nods
  if (open > 0.1) {
    ctx.save();
    ctx.globalAlpha = open;
    drawPerson(ctx, 760, 720, 0.82, { ...CAST.vet, coat: false, top: "#7fb7c9", face: abs > 44.75 ? "smile" : "neutral", arms: abs > 44.75 ? "thumb" : "down", body: "full", turn: -0.4, mask: 1 - smooth(phase(abs, 44.6, 44.8)) });
    ctx.restore();
  }
  ctx.restore();
  if (abs > 44.75) {
    const k = backOut(phase(abs, 44.75, 44.95));
    ctx.save();
    ctx.translate(760, 470);
    ctx.scale(k, k);
    text(ctx, "手术成功", 0, 0, { size: 70, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 3D two weeks; it wakes
function shotRecovery(ctx: Ctx, abs: number) {
  if (abs < BAR(23)) {
    // the calendar flips through 14 days; he is there every time
    const u = phase(abs, EV.calendar0, EV.calendar1);
    const day = Math.max(1, Math.min(14, 1 + Math.floor(u * 14)));
    const night = day % 2 === 0 ? 0.75 : 0;
    ctx.save();
    camera(ctx, 540, 960, 1.02, 0, 0, -40);
    recoveryRoom(ctx, abs, { day, night: 0 });
    drawDog(ctx, 430, 1000, 1.0, { view: "front", pose: "lie", headUp: 0.1, eyes: "shut", ears: 0.1, cone: true, shaved: true, breathe: abs * 0.3 });
    kennelBars(ctx, 110, 760, 760, 1180, 0.5);
    const poses = [
      { eyes: "shut" as const, tilt: 0.25, mouth: "flat" as const, outfit: "rider" as const },
      { eyes: "tired" as const, tilt: 0, mouth: "smile" as const, outfit: "hoodie" as const },
      { eyes: "shut" as const, tilt: -0.2, mouth: "flat" as const, outfit: "hoodie" as const },
    ];
    const p = poses[day % 3];
    drawKid(ctx, 860, 860, 0.7, { body: "bust", eyes: p.eyes, tilt: p.tilt, mouth: p.mouth, outfit: p.outfit, arms: "custom", handL: [-150, 330], handR: [40, 400], look: [-1, 0.6] });
    if (night) {
      ctx.fillStyle = `rgba(6,8,22,${0.5 * night})`;
      ctx.fillRect(-60, -60, W + 120, H + 120);
      // the day number stays readable at night
      text(ctx, `第${day}天`, 240, 500, { size: 78, font: F.cn, fill: "#f2eee4" });
    }
    ctx.restore();
    return;
  }
  // day 14: it opens its eyes, licks his hand; he wakes and strokes its head
  const woke = abs > EV.wake;
  const licking = abs > EV.lick && abs < EV.lick + 0.5;
  const heWakes = abs > 48.05;
  const pat = abs > EV.pat;
  const stroke = Math.sin((abs - EV.pat) * 5);
  ctx.save();
  camera(ctx, 560, 960, 1.1 + 0.05 * smooth(phase(abs, BAR(23), BAR(24))), 0, 0, -40);
  recoveryRoom(ctx, abs, { day: 14, night: 0 });
  drawDog(ctx, 420, 1010, 1.15, {
    view: "front",
    pose: "lie",
    headUp: woke ? 0.45 : 0.05,
    eyes: !woke ? "shut" : pat ? "happy" : "open",
    ears: woke ? 0.6 : 0.1,
    mouth: licking ? "lick" : pat ? "pant" : "closed",
    headTurn: licking ? 0.5 : 0,
    look: [0.8, -0.2],
    cone: true,
    shaved: true,
    wag: abs * 24,
    wagAmt: woke ? (pat ? 1 : 0.5) : 0,
    breathe: abs * 0.4,
    headTilt: pat ? stroke * 0.04 : 0,
  });
  const hx = pat ? (420 - 800) / 0.85 + stroke * 12 : (560 - 800) / 0.85,
    hy = pat ? (900 - 760) / 0.85 : (1060 - 760) / 0.85;
  drawKid(ctx, 800, 760, 0.85, {
    body: "bust",
    eyes: !heWakes ? "shut" : pat ? "teary" : "wide",
    mouth: !heWakes ? "flat" : pat ? "smile" : "o",
    brows: heWakes ? (pat ? "sad" : "up") : "flat",
    tears: pat ? 0.5 : 0,
    tilt: heWakes ? -0.05 : 0.22,
    look: [-1, 0.4],
    arms: "custom",
    handL: [hx, hy],
    shapeL: "flat",
    handR: [60, 420],
  });
  // hearts rising
  if (pat) {
    for (let i = 0; i < 6; i++) {
      const t = ((abs - EV.pat) * 0.9 + i * 0.17) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - t) * clamp((abs - EV.pat) * 3);
      heart(ctx, 420 + Math.sin(i * 2.1 + abs) * 140, 800 - t * 360, 18 + (i % 3) * 8, "#ff7fa8", 1950 + i);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(16), (ctx, abs) => {
    if (abs < BAR(18)) shotNight(ctx, abs);
    else if (abs < BAR(20)) shotPhone(ctx, abs);
    else if (abs < BAR(22)) shotSurgery(ctx, abs);
    else shotRecovery(ctx, abs);
  });
}
