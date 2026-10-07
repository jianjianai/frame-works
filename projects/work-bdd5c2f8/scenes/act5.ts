import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blob, camera, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, handheld, inkLine, paint, poly, pulse, rbox, shaded, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, Person, banner, drawPerson } from "./lib/people";
import { Note, SH, SW, controlCenter, lockScreen, notification, notificationHeight, phone, wallpaper, statusBar } from "./lib/phone";
import { FingerKey, fingerAt, heldHands } from "./lib/hand";
import { bokeh, buildingEntrance, confetti, cupcake, lampPost, lightPool, streetBelow } from "./lib/sets";

/** ACT 5 (song 67.05 – 83.74 = work 33.66 – 50.35): THE TWIST.
 *  In the dark he grabs the phone for the flashlight → the airplane toggle is orange (he switched it on himself at
 *  12.00 and forgot). He switches it off → 99+ messages. Friends are downstairs; their X faces fall away. */
const T0 = beatAt(128); // 67.05
const TAP = beatAt(135); // 70.70 — the toggle goes off on the beat (click)
const T2 = beatAt(136); // 71.22
const T3 = beatAt(144); // 75.40
const T4 = beatAt(152); // 79.57
const END = 83.744;

// Right thumb [time, screen x, screen y, touch]: swipe down from the top-right corner, drift toward
// the flashlight… freeze (he has seen the orange airplane).
const CC_FINGER: FingerKey[] = [
  [67.05, 450, 960, 0.2],
  [67.45, 450, 960, 0.2],
  [67.58, 548, 52, 0],
  [67.64, 540, 40, 1],
  [67.98, 520, 520, 1],
  [68.06, 525, 565, 0],
  [68.4, 440, 668, 0],
  [69.35, 446, 676, 0],
  [69.6, 450, 960, 0.2],
];
// …and the left thumb is the one that switches the airplane toggle off.
const LEFT_THUMB: FingerKey[] = [
  [TAP - 0.3, 150, 960, 0.25],
  [TAP - 0.16, 150, 262, 0],
  [TAP, 128, 228, 1],
  [TAP + 0.12, 128, 228, 1],
  [TAP + 0.3, 170, 400, 0],
  [T2, 150, 960, 0.25],
];

function shotDiscover(ctx: Ctx, abs: number) {
  fillBg(ctx, "#03040b");
  // reaction close-up: his face in the phone light
  if (abs >= 69.62 && abs < 70.42) {
    const k = backOut(phase(abs, 69.62, 69.8));
    ctx.save();
    const [hx, hy, hr] = handheld(abs, 8, 11);
    camera(ctx, 540, 820, 1.08 + 0.05 * k, hr, hx, hy);
    drawKid(ctx, 540, 800, 1.2, { body: "bust", hat: true, eyes: "wide", mouth: "o", arms: "phone", look: [0, 0.6] });
    lightPool(ctx, 540, 1200, 900, 0.8, "rgba(140,170,255,0.25)");
    ctx.restore();
    ctx.save();
    ctx.translate(800, 420);
    ctx.scale(k, k);
    text(ctx, "!?", 0, 0, { size: 150, font: F.marker, fill: "#ffe45c", stroke: C.ink, lw: 14 });
    ctx.restore();
    return;
  }
  const rise = easeOut(phase(abs, T0, T0 + 0.5));
  const cc = smooth(phase(abs, 67.64, 67.98));
  const zoom = smooth(phase(abs, 68.35, 69.1));
  const highlight = phase(abs, 68.55, 69.05);
  const tapped = abs >= TAP;
  ctx.save();
  // zoom into the airplane toggle (top-left of the control centre)
  const z = 1 + zoom * 0.75 - (tapped ? 0.75 * smooth(phase(abs, TAP + 0.1, TAP + 0.5)) : 0);
  const [hx, hy, hr] = handheld(abs, 5, 12);
  camera(ctx, 406, 579, z, hr, hx, hy);
  glow(ctx, 540, 900, 900, "rgba(120,150,255,0.25)", rise);
  const py = 900 + (1 - rise) * 900;
  phone(ctx, 540, py, 0.78, 0, (c) => {
    lockScreen(c, { time: "23:59", airplane: !tapped });
    if (cc > 0) {
      c.save();
      c.translate(0, -(1 - cc) * SH);
      controlCenter(c, { time: "23:59", airplane: !tapped }, !tapped, tapped ? Math.max(0, 1 - (abs - TAP) * 6) : 0, tapped ? 0 : highlight);
      c.restore();
    }
    if (tapped && abs < TAP + 0.5) {
      const r = phase(abs, TAP, TAP + 0.5);
      c.save();
      c.globalAlpha = 1 - r;
      c.strokeStyle = "#fff";
      c.lineWidth = 6;
      c.beginPath();
      c.arc(128, 228, 60 + r * 120, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  });
  heldHands(ctx, 540, py, 0.78, 0, fingerAt(abs, CC_FINGER)!, fingerAt(abs, LEFT_THUMB)!);
  ctx.restore();
  if (highlight > 0 && !tapped) {
    ctx.save();
    ctx.globalAlpha = smooth(phase(abs, 68.9, 69.15));
    ctx.translate(600, 800);
    ctx.rotate(-0.06);
    text(ctx, "飞行模式……？", 0, 0, { size: 84, font: F.pen, fill: "#fff", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  if (tapped) flash(ctx, 0.18 * (1 - phase(abs, TAP, TAP + 0.25)));
}

const NOTES: Note[] = [
  { title: "高二(3)班", body: "阿杰：生日快乐！！！！！", count: "99+", kind: "group" },
  { title: "阿杰", body: "寿星？？？人呢？？？" },
  { title: "未接来电 (23)", body: "阿杰、班长、小雨、妈妈…", kind: "call" },
  // (the swing scene is cut, so 小雨 now explains the laughing in the flashback; it gets the yellow highlight)
  { title: "小雨", body: "上课大家是在笑阿杰差点说漏嘴…不是笑你啦" },
  { title: "班长", body: "横幅藏了一整天 差点被你看见哈哈" },
  { title: "妈妈", body: "同学们在楼下等你两个小时了" },
  { title: "阿杰", body: "快下楼！！！蛋糕要化了！！！" },
];
const NOTE_AT = (i: number) => T2 + 0.08 + i * 0.2;

function shotFlood(ctx: Ctx, abs: number) {
  const shown = NOTES.filter((_, i) => abs >= NOTE_AT(i)).length;
  const last = shown ? NOTE_AT(shown - 1) : T2;
  const buzz = shown && abs - last < 0.15 && abs < 72.7 ? 1 - (abs - last) / 0.15 : 0;
  const [sx, sy] = shake(abs, buzz * 12);
  const settle = smooth(phase(abs, 72.7, 75.4));
  fillBg(ctx, "#0b0e22");
  glow(ctx, 540, 900, 1000, "rgba(255,220,140,0.25)", Math.min(1, shown / 4));
  bokeh(ctx, abs, 14, 501, 0.4 + 0.6 * Math.min(1, shown / 4));
  ctx.save();
  const [hx, hy, hr] = handheld(abs, 4, 13);
  camera(ctx, 540, 880, 1 + 0.06 * settle, hr, sx + hx, sy + hy);
  phone(ctx, 540, 860, 0.8, 0, (c) => {
    wallpaper(c);
    statusBar(c, { time: "23:59", airplane: false, battery: 0.08 });
    text(c, "23:59", SW / 2, 170, { size: 92, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.95)" });
    // newest on top
    let yy = 250;
    for (let k = 0; k < shown; k++) {
      const i = shown - 1 - k;
      const age = abs - NOTE_AT(i);
      const drop = easeOut(Math.min(1, age / 0.18));
      const y = yy - (1 - drop) * 60;
      const nh = notificationHeight(c, SW - 44, NOTES[i]);
      yy += nh + 12;
      const hl = (i === 3 && abs > 73.4) || (i === 6 && abs > 74.4) ? 1 : 0;
      if (hl) {
        c.save();
        c.globalAlpha = 0.6 + 0.4 * Math.sin(abs * 8);
        c.fillStyle = "#ffd84a";
        c.beginPath();
        c.roundRect(16, y - 6, SW - 32, nh + 12, 36);
        c.fill();
        c.restore();
      }
      notification(c, 22, y, SW - 44, NOTES[i], drop);
    }
  });
  ctx.restore();
  // "99+" badge bounces in
  if (shown > 0) {
    const k = backOut(phase(abs, NOTE_AT(0), NOTE_AT(0) + 0.25));
    ctx.save();
    ctx.translate(840, 380);
    ctx.rotate(0.12);
    ctx.scale(k * (1 + 0.08 * pulse(abs)), k * (1 + 0.08 * pulse(abs)));
    text(ctx, "99+", 0, 0, { size: 150, font: F.marker, fill: "#ff3b3b", stroke: "#fff", lw: 16 });
    ctx.restore();
  }
  flash(ctx, 0.7 * (1 - phase(abs, T2, T2 + 0.2)));
}

const CREW: { p: Person; x: number; y: number; s: number; arms: Person["arms"]; xAt: number }[] = [
  { p: CAST.a, x: 250, y: 880, s: 0.42, arms: "up", xAt: 76.15 },
  { p: CAST.e, x: 830, y: 880, s: 0.42, arms: "up", xAt: 76.35 },
  { p: CAST.monitor, x: 380, y: 960, s: 0.5, arms: "hold", xAt: 76.55 },
  { p: CAST.jie, x: 700, y: 960, s: 0.5, arms: "hold", xAt: 76.75 },
  { p: CAST.d, x: 160, y: 1040, s: 0.5, arms: "up", xAt: 76.95 },
  { p: CAST.yu, x: 540, y: 1060, s: 0.56, arms: "waveL", xAt: 77.2 },
];
function shotWindow(ctx: Ctx, abs: number) {
  const open = easeOut(phase(abs, T3, T3 + 0.5));
  // looking down at the street from his window
  fillBg(ctx, "#0a0e2a");
  ctx.save();
  // tilt down from the night sky onto them (a crane move into the reveal), then hold — hand-held
  const [hx, hy, hr] = handheld(abs, 5, 14);
  const crane = 1 - easeOut(phase(abs, T3, T3 + 1.4));
  camera(ctx, 540, 900, 1.12 - 0.08 * easeInOut(phase(abs, T3, T4)), hr, hx, hy + 260 * crane);
  streetBelow(ctx, abs);
  lampPost(ctx, 140, 420, abs, 0);
  // banner overhead
  const bOpen = easeOut(phase(abs, T3 + 0.3, T3 + 1.0));
  for (const q of CREW) {
    const xa = 1 - smooth(phase(abs, q.xAt, q.xAt + 0.45));
    drawPerson(ctx, q.x, q.y + Math.abs(Math.sin(abs * 7 + q.x)) * -14, q.s, {
      ...q.p,
      arms: q.arms,
      wave: 1,
      walk: abs * 4,
      x: xa,
      face: "laugh",
      body: "full",
      turn: 0,
    });
    // phone flashlights in raised hands
    if (q.arms === "up") {
      glow(ctx, q.x - 150 * q.s, q.y - 110 * q.s, 90, "rgba(255,255,230,0.9)", 0.6 + 0.4 * Math.sin(abs * 5 + q.x));
      glow(ctx, q.x + 150 * q.s, q.y - 110 * q.s, 90, "rgba(255,255,230,0.9)", 0.6 + 0.4 * Math.sin(abs * 6 + q.x));
    }
  }
  banner(ctx, 540, 770, 560, bOpen, "生日快乐", 720, F.cn);
  // the cake waiting with them
  cupcake(ctx, 850, 1200, 0.42, abs, 1, 0, 3);
  ctx.restore();
  // window frame + curtains (his point of view)
  ctx.save();
  ctx.fillStyle = "#11131f";
  ctx.beginPath();
  ctx.rect(-60, -60, W + 120, H + 120);
  ctx.roundRect(110, 300, W - 220, 1040, 16);
  ctx.fill("evenodd");
  ctx.restore();
  // the glass: two faint reflection streaks
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(110, 300, W - 220, 1040, 16);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  poly(ctx, [[150, 300], [330, 300], [130, 900], [110, 900]], 738, 1);
  ctx.fillStyle = "rgba(200,220,255,0.06)";
  ctx.fill();
  poly(ctx, [[430, 300], [480, 300], [260, 1340], [210, 1340]], 739, 1);
  ctx.fillStyle = "rgba(200,220,255,0.05)";
  ctx.fill();
  ctx.restore();
  rbox(ctx, 110, 300, W - 220, 1040, 16, 730, 2);
  paint(ctx, null, "#3a3f5e", 16);
  paint(ctx, null, C.ink, 5);
  // the sill, and the curtains he has pulled open (shaded, with folds that sway a little)
  rbox(ctx, 70, 1326, W - 140, 44, 8, 737, 1);
  paint(ctx, "#4a4f72", C.ink, 5);
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 110 - open * 40 : W - 110 + open * 40;
    const pts: Pt[] = [[cx - 120 * side * -1, 260], [cx + side * 10, 260], [cx + side * 30, 800], [cx + side * 10, 1380], [cx - side * 140, 1380], [cx - side * (110 + Math.sin(abs * 2) * 10), 800]];
    shaded(ctx, () => blob(ctx, pts, 731 + side, 3), "#33508f", () => {
      for (let k = 0; k < 4; k++) {
        const fx = cx - side * (20 + k * 30);
        inkLine(ctx, [[fx, 260], [fx + side * 8 + Math.sin(abs * 2 + k) * 4, 800], [fx - side * 6, 1380]], 742 + k + side * 10, 4, "#25407a");
      }
    }, C.ink, 6);
  }
  flash(ctx, 0.5 * (1 - phase(abs, T3, T3 + 0.2)));
}

function shotParty(ctx: Ctx, abs: number) {
  const smash = easeIn(phase(abs, 79.8, 80.1));
  const caked = abs >= 80.1;
  const laughing = abs >= 80.55;
  const p = pulse(abs);
  const [sx, sy] = shake(abs, caked && abs < 80.4 ? 14 : 0);
  fillBg(ctx, "#1d2147");
  ctx.save();
  const [hx, hy, hr] = handheld(abs, 6, 15);
  camera(ctx, 540, 820, 1 + 0.03 * p + 0.1 * easeInOut(phase(abs, 82.4, END)), hr, sx + hx, sy + hy);
  // downstairs at the door of his block: the lobby light behind him, fairy lights — a touch out of focus
  filtered(ctx, "blur(2px)", (c) => buildingEntrance(c, abs), "bg");
  banner(ctx, 540, 360, 820, 1, "生日快乐", 740, F.cn);
  const ring: [Person, number, number, number][] = [
    [CAST.monitor, 290, 600, 0.6],
    [CAST.a, 800, 600, 0.6],
    [CAST.d, 120, 760, 0.72],
    [CAST.e, 970, 760, 0.72],
  ];
  ring.forEach(([q, x, y, s], i) =>
    drawPerson(ctx, x, y + Math.abs(Math.sin(abs * 9 + i)) * -12, s, { ...q, x: 0, face: "laugh", arms: i % 2 ? "laugh" : "up", tilt: Math.sin(abs * 14 + i) * 0.08, body: "full" }),
  );
  drawKid(ctx, 540, 820, 1.0, {
    body: "bust",
    hat: true,
    eyes: laughing ? "happy" : caked ? "shut" : "wide",
    mouth: laughing ? "laugh" : "o",
    cake: caked ? 1 : 0,
    blush: laughing ? 1 : 0,
    tilt: laughing ? Math.sin(abs * 14) * 0.06 : 0,
  });
  // 小雨 on his left, A-Jie on his right with the cake plate
  drawPerson(ctx, 200, 960, 0.8, { ...CAST.yu, x: 0, face: "laugh", arms: "laugh", body: "full", tilt: Math.sin(abs * 12) * 0.06 });
  drawPerson(ctx, 900, 960, 0.8, {
    ...CAST.jie,
    x: 0,
    face: "laugh",
    arms: "point",
    body: "full",
    holding: (c) => {
      // the plate goes into his face, then comes back empty
      const px = 200 - smash * 470 + (caked ? smooth(phase(abs, 80.2, 80.6)) * 420 : 0);
      c.save();
      c.translate(px, 100);
      blob(c, [[-90, -10], [90, -10], [80, 16], [-80, 16]], 741, 1);
      paint(c, "#fff", C.ink, 5);
      if (!caked) {
        blob(c, [[-70, -10], [-60, -80], [60, -80], [70, -10]], 742, 1.5);
        paint(c, "#fff3f6", C.ink, 5);
      }
      c.restore();
    },
  });
  ctx.restore();
  confetti(ctx, abs, 82.45, 110, 5);
  if (laughing) {
    const k = backOut(phase(abs, 82.45, 82.7));
    ctx.save();
    ctx.translate(540, 560);
    ctx.rotate(-0.05);
    ctx.scale(k, k);
    text(ctx, "HAPPY BIRTHDAY!", 0, 0, { size: 96, font: F.marker, fill: "#ffe45c", stroke: C.ink, lw: 14, alpha: abs > 82.45 ? 1 : 0 });
    ctx.restore();
  }
  flash(ctx, 0.9 * (1 - phase(abs, T4, T4 + 0.25)));
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < T2) shotDiscover(ctx, abs);
    else if (abs < T3) shotFlood(ctx, abs);
    else if (abs < T4) shotWindow(ctx, abs);
    else shotParty(ctx, abs);
  });
}
