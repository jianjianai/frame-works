import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { BEAT, C, Ctx, F, H, Pt, W, backOut, beatAt, blinkEyes, blob, camera, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, inkLine, oldFilm, paint, poly, pulse, rbox, rr, shaded, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, Person, banner, drawPerson, hahas } from "./lib/people";
import { Note, SH, SW, airplaneIcon, controlCenter, lockScreen, notification, notificationHeight, phone, statusBar, wallpaper } from "./lib/phone";
import { FingerKey, fingerAt, heldHands } from "./lib/hand";
import { bigCake, bokeh, buildingEntrance, classroom, confetti, corridor, lampPost, lightPool, street, streetBelow } from "./lib/sets";

/** ACT 5 · 第四遍副歌「其实的今天」(song 67.05 – 83.74 = work 33.66 – 50.35; draws in song time) · 重新设计版 — THE TWIST.
 *  33.66 in the dark he grabs the phone for the flashlight → the control centre: ✈ is orange (the only colour) → 飞行模式……？
 *  36.23 his face, lit by the phone: !? → 37.31 his left thumb switches it OFF → the colour comes back in a wave from
 *        the toggle (his grey world ends here)
 *  37.83 99+: the messages pour in; three of them each open one beat of the same day, from their side (warm film,
 *        faces, in colour): 39.40 班长 → hiding the banner behind their backs as he walked past · 40.44 小雨 → A-Jie
 *        nearly blurting it out, everyone laughing at A-Jie · 41.48 未接来电 (23) → under his window, phoning him
 *  42.00 the window: a crane down from the night sky — the street, the flashlights (the lights from the cold open),
 *        the banner unrolls on the beat, the X faces fall away one per beat, the big cake from the bakery with a gold 17
 *  46.18 the door of his block bursts open → 46.70 a slice of that cake in his face → laughing, confetti, HAPPY BIRTHDAY */
const T0 = beatAt(128); // 67.05 (work 33.66)
const TAP = beatAt(135); // 70.70 (37.31) the toggle goes off on the beat
const T2 = beatAt(136); // 71.22 (37.83) 99+
const INS_A = beatAt(139); // 72.79 (39.40)
const INS_B = beatAt(141); // 73.83 (40.44)
const INS_C = beatAt(143); // 74.87 (41.48)
const T3 = beatAt(144); // 75.40 (42.00) the window
const T4 = beatAt(152); // 79.57 (46.18) the door
const SPLAT = beatAt(153); // 80.09 (46.70)
const END = 83.744;
const GREY = 0.38;

// ---------------------------------------------------------------- 33.66 – 37.83 airplane mode
// Right thumb [time, screen x, screen y, touch]: swipe down from the top-right corner, drift toward the flashlight…
// freeze (he has seen the orange airplane).
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
// …and the left thumb is the one that switches it off
const LEFT_THUMB: FingerKey[] = [
  [TAP - 0.3, 150, 960, 0.25],
  [TAP - 0.16, 150, 262, 0],
  [TAP, 128, 228, 1],
  [TAP + 0.12, 128, 228, 1],
  [TAP + 0.3, 170, 400, 0],
  [T2, 150, 960, 0.25],
];

function discoverScene(c: Ctx, abs: number, tapped: boolean) {
  const rise = easeOut(phase(abs, T0, T0 + 0.5));
  const cc = smooth(phase(abs, 67.64, 67.98));
  const highlight = phase(abs, 68.55, 69.05);
  fillBg(c, "#03040b");
  glow(c, 540, 900, 900, "rgba(120,150,255,0.25)", rise);
  const py = 900 + (1 - rise) * 900;
  phone(c, 540, py, 0.78, 0, (p) => {
    lockScreen(p, { time: "23:59", airplane: !tapped });
    if (cc > 0) {
      p.save();
      p.translate(0, -(1 - cc) * SH);
      controlCenter(p, { time: "23:59", airplane: !tapped }, !tapped, tapped ? Math.max(0, 1 - (abs - TAP) * 6) : 0, tapped ? 0 : highlight);
      p.restore();
    }
    if (tapped && abs < TAP + 0.5) {
      const r = phase(abs, TAP, TAP + 0.5);
      p.save();
      p.globalAlpha = 1 - r;
      p.strokeStyle = "#fff";
      p.lineWidth = 6;
      p.beginPath();
      p.arc(128, 228, 60 + r * 120, 0, Math.PI * 2);
      p.stroke();
      p.restore();
    }
  });
  heldHands(c, 540, py, 0.78, 0, fingerAt(abs, CC_FINGER)!, fingerAt(abs, LEFT_THUMB)!);
}

function shotDiscover(ctx: Ctx, abs: number) {
  if (abs >= 69.62 && abs < 70.42) {
    // his face in the phone's light: !?
    const k = backOut(phase(abs, 69.62, 69.8));
    const [hx, hy, hr] = handheld(abs, 8, 11);
    grade(ctx, GREY, (c) => {
      fillBg(c, "#03040b");
      c.save();
      camera(c, 540, 820, 1.08 + 0.05 * k, hr, hx, hy);
      drawKid(c, 540, 800, 1.2, { body: "bust", hat: true, eyes: "wide", mouth: "o", arms: "phone", look: [0, 0.6] });
      lightPool(c, 540, 1200, 900, 0.8, "rgba(140,170,255,0.25)");
      c.restore();
    });
    ctx.save();
    ctx.translate(800, 420);
    ctx.scale(k, k);
    text(ctx, "!?", 0, 0, { size: 150, font: F.marker, fill: "#ffe45c", stroke: C.ink, lw: 14 });
    ctx.restore();
    return;
  }
  const tapped = abs >= TAP;
  const zoom = smooth(phase(abs, 68.35, 69.1));
  const z = 1 + zoom * 0.75 - (tapped ? 0.75 * smooth(phase(abs, TAP + 0.1, TAP + 0.5)) : 0);
  const [hx, hy, hr] = handheld(abs, 5, 12);
  const scene = (c: Ctx) => {
    c.save();
    camera(c, 406, 579, z, hr, hx, hy);
    discoverScene(c, abs, tapped);
    c.restore();
  };
  if (!tapped) {
    grade(ctx, GREY, scene);
    // the orange toggle (and the red ring drawn round it) — the only colour, over the grey
    const cc = smooth(phase(abs, 67.64, 67.98));
    const rise = easeOut(phase(abs, T0, T0 + 0.5));
    const hl = phase(abs, 68.55, 69.05);
    if (cc > 0.02) {
      ctx.save();
      camera(ctx, 406, 579, z, hr, hx, hy);
      ctx.translate(540, 900 + (1 - rise) * 900);
      ctx.scale(0.78, 0.78);
      ctx.translate(-SW / 2, -SH / 2 - (1 - cc) * SH);
      ctx.translate(128, 228);
      glow(ctx, 0, 0, 130, "rgba(255,159,10,0.5)");
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.fill();
      airplaneIcon(ctx, 0, 0, 58, "#fff");
      if (hl > 0) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 116 * 0.66, 116 * 0.62, -0.1, 0, Math.PI * 2 * clamp(hl * 1.3));
        ctx.stroke();
      }
      ctx.restore();
    }
    if (hl > 0) {
      ctx.save();
      ctx.globalAlpha = smooth(phase(abs, 68.9, 69.15));
      ctx.translate(600, 800);
      ctx.rotate(-0.06);
      text(ctx, "飞行模式……？", 0, 0, { size: 84, font: F.pen, fill: "#fff", stroke: C.ink, lw: 12 });
      ctx.restore();
    }
    return;
  }
  // the colour comes back: a wave from the toggle (screen position = the camera centre)
  const w = easeIn(phase(abs, TAP + 0.02, TAP + 0.5));
  const r = 40 + 2300 * w;
  if (w < 1) grade(ctx, GREY, scene);
  ctx.save();
  ctx.beginPath();
  ctx.arc(406 + hx, 579 + hy, r, 0, Math.PI * 2);
  ctx.clip();
  scene(ctx);
  ctx.restore();
  if (w < 1) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,236,190,${(0.75 * (1 - w)).toFixed(3)})`;
    ctx.lineWidth = 36 * (1 - w) + 6;
    ctx.beginPath();
    ctx.arc(406 + hx, 579 + hy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  flash(ctx, 0.18 * (1 - phase(abs, TAP, TAP + 0.25)));
}

// ---------------------------------------------------------------- 37.83 – 42.00 99+, and the same day from their side
const NOTES: Note[] = [
  { title: "高二(3)班", body: "阿杰：生日快乐！！！！！", count: "99+", kind: "group" },
  { title: "阿杰", body: "寿星？？？人呢？？？" },
  { title: "未接来电 (23)", body: "阿杰、班长、小雨、妈妈…", kind: "call" },
  { title: "小雨", body: "上课大家是在笑阿杰差点说漏嘴…不是笑你啦" },
  { title: "班长", body: "横幅藏了一整天 差点被你看见哈哈" },
  { title: "妈妈", body: "同学们在楼下等你两个小时了" },
  { title: "阿杰", body: "快下楼！！！蛋糕要化了！！！" },
];
const NOTE_AT = (i: number) => T2 + 0.08 + i * 0.2;
/** each highlighted message opens one beat of the morning/evening, from their side */
const INSERTS: { at: number; note: number }[] = [
  { at: INS_A, note: 4 }, // 班长 → the corridor
  { at: INS_B, note: 3 }, // 小雨 → A-Jie nearly blurts it out
  { at: INS_C, note: 2 }, // 未接来电 → under his window
];

function insertCorridor(c: Ctx, abs: number) {
  filtered(c, "blur(2px)", (b) => corridor(b, abs), "bg");
  // the banner, open behind their backs: 生日快乐
  banner(c, 790, 790, 540, 1, "生日快乐", 1301, F.cn);
  const crew: [Person, number, number, Person["face"]][] = [
    [CAST.monitor, 620, -0.5, "laugh"],
    [CAST.jie, 790, 0.35, "smile"],
    [CAST.d, 960, -0.3, "laugh"],
  ];
  for (const [p, x, turn, face] of crew) drawPerson(c, x, 660, 0.7, { ...p, x: 0, face, turn, arms: "behind", body: "full", tilt: Math.sin(abs * 14 + x) * 0.05 });
  // him walking past, seen from behind
  drawKid(c, 220, 650, 0.62, { body: "full", view: "back", legs: "walk", walk: abs * 9 });
}

function insertClassroom(c: Ctx, abs: number) {
  filtered(c, "blur(2px)", (b) => classroom(b, abs), "bg");
  // him at his desk, his back to them
  drawKid(c, 860, 760, 0.6, { body: "bust", view: "back", arms: "table" });
  drawPerson(c, 140, 720, 0.8, { ...CAST.b, x: 0, face: "laugh", arms: "laugh", body: "full", turn: 0.5, tilt: Math.sin(abs * 20) * 0.06 });
  drawPerson(c, 640, 700, 0.8, { ...CAST.e, x: 0, face: "laugh", arms: "point", body: "full", turn: -0.4, tilt: Math.sin(abs * 22 + 1) * 0.06 });
  // A-Jie, a hand at his mouth: he nearly said it
  drawPerson(c, 390, 640, 0.86, { ...CAST.jie, x: 0, face: "o", arms: "laugh", body: "full", turn: 0.2 });
  hahas(c, 390, 400, 300, 1, 1302, F.cn, 5);
}

function insertCalling(c: Ctx, abs: number) {
  street(c, abs, 900);
  // his window up there, faintly lit by a candle
  glow(c, 760, 330, 130, "rgba(255,190,110,0.6)");
  rbox(c, 720, 286, 80, 92, 4, 1401, 1);
  paint(c, "#ffd18a", C.ink, 4);
  const crew: [Person, number][] = [
    [CAST.jie, 360],
    [CAST.monitor, 560],
    [CAST.yu, 760],
  ];
  for (const [p, x] of crew) {
    drawPerson(c, x, 780, 0.62, { ...p, x: 0, face: "neutral", arms: "phone", body: "full", turn: 0.35, tilt: -0.08 });
    glow(c, x, 780 + 0.62 * 250, 90, "rgba(200,225,255,0.45)");
  }
}

function insert(ctx: Ctx, abs: number, i: number) {
  const t0 = INSERTS[i].at;
  const k = easeOut(phase(abs, t0, t0 + 0.14));
  oldFilm(
    ctx,
    abs,
    (c) => {
      c.save();
      camera(c, 540, 900, 1.08 - 0.06 * k);
      if (i === 0) insertCorridor(c, abs);
      else if (i === 1) insertClassroom(c, abs);
      else insertCalling(c, abs);
      c.restore();
    },
    "film",
    0.45,
  );
  flash(ctx, 0.55 * (1 - phase(abs, t0, t0 + 0.12)));
}

function shotFlood(ctx: Ctx, abs: number) {
  for (const [i, ins] of INSERTS.entries()) if (abs >= ins.at && abs < ins.at + BEAT) return insert(ctx, abs, i);
  const shown = NOTES.filter((_, i) => abs >= NOTE_AT(i)).length;
  const last = shown ? NOTE_AT(shown - 1) : T2;
  const buzz = shown && abs - last < 0.15 && abs < 72.7 ? 1 - (abs - last) / 0.15 : 0;
  const [sx, sy] = shake(abs, buzz * 12);
  const settle = smooth(phase(abs, 72.7, 75.4));
  fillBg(ctx, "#0b0e22");
  glow(ctx, 540, 900, 1000, "rgba(255,220,140,0.25)", Math.min(1, shown / 4));
  bokeh(ctx, abs, 14, 501, 0.4 + 0.6 * Math.min(1, shown / 4));
  const [hx, hy, hr] = handheld(abs, 4, 13);
  ctx.save();
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
      const ins = INSERTS.find((s) => s.note === i);
      if (ins && abs > ins.at - 0.42) {
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
  if (shown > 0) {
    const k = backOut(phase(abs, NOTE_AT(0), NOTE_AT(0) + 0.25));
    ctx.save();
    ctx.translate(840, 380);
    ctx.rotate(0.12);
    ctx.scale(k * (1 + 0.08 * pulse(abs)), k * (1 + 0.08 * pulse(abs)));
    text(ctx, "99+", 0, 0, { size: 150, font: F.marker, fill: "#ff3b3b", stroke: "#fff", lw: 16 });
    ctx.restore();
  }
  // back from an insert: a quick flash
  const back = INSERTS.find((s) => abs >= s.at + BEAT && abs < s.at + BEAT + 0.12);
  if (back) flash(ctx, 0.4 * (1 - (abs - back.at - BEAT) / 0.12));
  flash(ctx, 0.7 * (1 - phase(abs, T2, T2 + 0.2)));
}

// ---------------------------------------------------------------- 42.00 – 46.18 the window
const CREW: { p: Person; x: number; y: number; s: number; arms: Person["arms"]; xAt: number }[] = [
  { p: CAST.a, x: 250, y: 880, s: 0.42, arms: "up", xAt: beatAt(146) },
  { p: CAST.e, x: 830, y: 880, s: 0.42, arms: "up", xAt: beatAt(147) },
  { p: CAST.monitor, x: 380, y: 960, s: 0.5, arms: "hold", xAt: beatAt(148) },
  { p: CAST.jie, x: 700, y: 960, s: 0.5, arms: "hold", xAt: beatAt(149) },
  { p: CAST.d, x: 160, y: 1040, s: 0.5, arms: "up", xAt: beatAt(150) },
  { p: CAST.yu, x: 540, y: 1060, s: 0.56, arms: "waveL", xAt: beatAt(151) },
];

function shotWindow(ctx: Ctx, abs: number) {
  const open = easeOut(phase(abs, T3, T3 + 0.5));
  fillBg(ctx, "#0a0e2a");
  ctx.save();
  // tilt down from the night sky onto them (a crane move into the reveal), then hold — hand-held
  const [hx, hy, hr] = handheld(abs, 5, 14);
  const crane = 1 - easeOut(phase(abs, T3, T3 + 1.4));
  camera(ctx, 540, 900, 1.12 - 0.08 * easeInOut(phase(abs, T3, T4)), hr, hx, hy + 260 * crane);
  streetBelow(ctx, abs);
  lampPost(ctx, 140, 420, abs, 0);
  const bOpen = easeOut(phase(abs, T3 + 0.3, T3 + 1.0));
  for (const q of CREW) {
    const xa = 1 - smooth(phase(abs, q.xAt, q.xAt + 0.28));
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
    // the X falls away: a little burst of light where it was
    const pop = phase(abs, q.xAt, q.xAt + 0.35);
    if (pop > 0 && pop < 1) glow(ctx, q.x, q.y, 140 * q.s * 2, "rgba(255,240,200,0.8)", 1 - pop);
    if (q.arms === "up") {
      glow(ctx, q.x - 150 * q.s, q.y - 110 * q.s, 90, "rgba(255,255,230,0.9)", 0.6 + 0.4 * Math.sin(abs * 5 + q.x));
      glow(ctx, q.x + 150 * q.s, q.y - 110 * q.s, 90, "rgba(255,255,230,0.9)", 0.6 + 0.4 * Math.sin(abs * 6 + q.x));
    }
  }
  banner(ctx, 540, 770, 560, bOpen, "生日快乐", 720, F.cn);
  // the big cake from the bakery window, on a folding table, a gold 17 on top (彩蛋)
  rr(ctx, 520, 1292, 190, 20, 6);
  ctx.fillStyle = "#d8d2c6";
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  inkLine(ctx, [[540, 1312], [530, 1386]], 1501, 5, "#555");
  inkLine(ctx, [[690, 1312], [700, 1386]], 1502, 5, "#555");
  bigCake(ctx, 615, 1296, 0.34, abs, { candle17: true, lit: 1 });
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
  // window frame + curtains (his point of view)
  ctx.save();
  ctx.fillStyle = "#11131f";
  ctx.beginPath();
  ctx.rect(-60, -60, W + 120, H + 120);
  ctx.roundRect(110, 300, W - 220, 1040, 16);
  ctx.fill("evenodd");
  ctx.restore();
  rbox(ctx, 110, 300, W - 220, 1040, 16, 730, 2);
  paint(ctx, null, "#3a3f5e", 16);
  paint(ctx, null, C.ink, 5);
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

// ---------------------------------------------------------------- 46.18 – 50.35 the door bursts open, cake in his face
/** a slice of the bakery cake on a paper plate (white sponge, pink drip, a strawberry) */
function cakeSlice(c: Ctx, x: number, y: number, whole: boolean) {
  c.save();
  c.translate(x, y);
  blob(c, [[-90, -10], [90, -10], [80, 16], [-80, 16]], 741, 1);
  paint(c, "#fff", C.ink, 5);
  if (whole) {
    shaded(c, () => poly(c, [[-66, -10], [-50, -96], [62, -96], [70, -10]], 742, 1), "#fff6f0", () => {
      c.fillStyle = "#ff9cc3";
      c.fillRect(-70, -100, 150, 24);
      c.fillStyle = "rgba(255,156,195,0.85)";
      for (const dx of [-40, -6, 30]) c.fillRect(dx, -78, 14, 18 + (dx % 3) * 4);
    }, C.ink, 5);
    blob(c, [[-6, -118], [18, -118], [12, -98], [6, -92], [0, -98]], 743, 0.6);
    paint(c, "#e8343c", C.ink, 3);
  }
  c.restore();
}

function shotParty(ctx: Ctx, abs: number) {
  const burst = phase(abs, T4, T4 + 0.3); // he comes out of the door
  const smash = easeIn(phase(abs, T4 + 0.24, SPLAT));
  const caked = abs >= SPLAT;
  const laughing = abs >= 80.55;
  const p = pulse(abs);
  const [sx, sy] = shake(abs, caked && abs < 80.4 ? 14 : 0);
  const [hx, hy, hr] = handheld(abs, 6, 15);
  fillBg(ctx, "#1d2147");
  const draw = (c: Ctx) => {
    c.save();
    camera(c, 540, 820, 1 + 0.03 * p + 0.1 * easeInOut(phase(abs, 82.4, END)) + 0.5 * (1 - easeOut(burst)), hr, sx + hx, sy + hy);
    // downstairs at the door of his block: the lobby light behind him, fairy lights — a touch out of focus
    filtered(c, "blur(2px)", (b) => buildingEntrance(b, abs), "bg");
    banner(c, 540, 360, 820, 1, "生日快乐", 740, F.cn);
    const ring: [Person, number, number, number][] = [
      [CAST.monitor, 290, 600, 0.6],
      [CAST.a, 800, 600, 0.6],
      [CAST.d, 120, 760, 0.72],
      [CAST.e, 970, 760, 0.72],
    ];
    ring.forEach(([q, x, y, s], i) =>
      drawPerson(c, x, y + Math.abs(Math.sin(abs * 9 + i)) * -12, s, { ...q, x: 0, face: "laugh", arms: i % 2 ? "laugh" : "up", tilt: Math.sin(abs * 14 + i) * 0.08, body: "full" }),
    );
    drawKid(c, 540, 820, 1.0, {
      body: "bust",
      hat: true,
      eyes: laughing ? "happy" : caked ? "shut" : "wide",
      mouth: laughing ? "laugh" : "o",
      cake: caked ? 1 : 0,
      blush: laughing ? 1 : 0,
      tilt: laughing ? Math.sin(abs * 14) * 0.06 : 0,
    });
    // 小雨 on his left holding the rest of the big cake (the 17 still burning); A-Jie on his right with a slice
    drawPerson(c, 200, 960, 0.8, { ...CAST.yu, x: 0, face: "laugh", arms: "hold", body: "full", tilt: Math.sin(abs * 12) * 0.06 });
    bigCake(c, 200, 1250, 0.42, abs, { candle17: true, lit: 1 });
    drawPerson(c, 900, 960, 0.8, {
      ...CAST.jie,
      x: 0,
      face: "laugh",
      arms: "point",
      body: "full",
      holding: (h) => {
        const px = 200 - smash * 470 + (caked ? smooth(phase(abs, 80.2, 80.6)) * 420 : 0);
        cakeSlice(h, px, 100, !caked);
      },
    });
    c.restore();
  };
  if (burst < 1) filtered(ctx, `blur(${(8 * (1 - burst)).toFixed(2)}px)`, draw, "burst");
  else draw(ctx);
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
  // the door bursting open: warm light floods the frame
  flash(ctx, 0.95 * (1 - easeOut(burst)), "#fff1d0");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < T2) shotDiscover(ctx, abs);
    else if (abs < T3) shotFlood(ctx, abs);
    else if (abs < T4) shotWindow(ctx, abs);
    else shotParty(ctx, abs);
  });
}
