import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { BEAT, C, Ctx, F, H, Pt, W, backOut, beatAt, blinkEyes, blob, camera, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, inkLine, lerp2, oldFilm, paint, poly, oval, pulse, rbox, rr, shaded, shake, text, vgrad } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, Person, banner, drawPerson, hahas } from "./lib/people";
import { replayCorridor, replaySlip } from "./act1";
import { Note, SH, SW, airplaneIcon, controlCenter, glassGlare, lockScreen, notification, notificationHeight, phone, phoneBack, phoneButtons, statusBar, wallpaper } from "./lib/phone";
import { FingerKey, fingerAt, touchDot } from "./lib/hand";
import { bedroom, bigCake, bokeh, buildingEntrance, classroom, confetti, corridor, cupcake, desk, lampPost, lightPool, street, streetBelow } from "./lib/sets";

/** ACT 5 · 第四遍副歌「其实的今天」(song 67.05 – 83.74 = work 33.66 – 50.35; draws in song time) · 重新设计版 — THE TWIST.
 *  33.66 in the dark he grabs the phone for the flashlight → the control centre (no hands, 用户: touches are dots):
 *  34.70 he taps the flashlight on (用户: 先打开手电筒) — its white light fills the dark around the phone →
 *  35.22 the camera snaps to the ✈ — orange, the only colour → 飞行模式……？
 *  36.23 his face, lit by the phone: !? → 37.31 his left thumb switches it OFF → the colour comes back in a wave from
 *        the toggle (his grey world ends here)
 *  37.83 99+: the messages slam in, the camera rushes into 班长's → 38.87 his corridor memory replayed from their
 *        side with that message over it; the X faces come off on 39.40 (grinning, hiding his banner) → 39.92 小雨's
 *        message over his classroom memory; the X faces come off on 40.44 (laughing at A-Jie) → 40.96 him in the dark,
 *        妈妈's message, flashlights sweeping in through his window from below; he looks up at it
 *  42.00 the window: a crane down from the night sky — the street, the flashlights (the lights from the cold open),
 *        the banner unrolls on the beat, the X faces fall away one per beat, the big cake from the bakery with a gold 17
 *  46.18 the door of his block bursts open → 46.70 a slice of that cake in his face → laughing, confetti, HAPPY BIRTHDAY */
const T0 = beatAt(128); // 67.05 (work 33.66)
const SWIPE = beatAt(129); // 67.57 (34.18) down from the corner: the control centre
const TORCH = beatAt(130); // 68.09 (34.70) the flashlight goes on
const SNAP = beatAt(131); // 68.61 (35.22) …and he sees the ✈
const TAP = beatAt(135); // 70.70 (37.31) the toggle goes off on the beat
const T2 = beatAt(136); // 71.22 (37.83) 99+
const T3 = beatAt(144); // 75.40 (42.00) the window
const T4 = beatAt(152); // 79.57 (46.18) the door
const SPLAT = beatAt(153); // 80.09 (46.70)
const END = 83.744;
const GREY = 0.38;

// ---------------------------------------------------------------- 33.66 – 37.83 airplane mode
// Right thumb [time, screen x, screen y, touch]: swipe down from the top-right corner, then tap the flashlight tile
// (440, 652) on the beat.
const CC_FINGER: FingerKey[] = [
  [67.05, 450, 960, 0.2],
  [SWIPE - 0.06, 548, 52, 0],
  [SWIPE, 540, 40, 1],
  [SWIPE + 0.26, 520, 520, 1],
  [SWIPE + 0.33, 480, 600, 0],
  [TORCH - 0.04, 440, 652, 0],
  [TORCH, 440, 652, 1],
  [TORCH + 0.14, 440, 652, 1],
  [TORCH + 0.24, 455, 700, 0],
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
  const cc = smooth(phase(abs, SWIPE, SWIPE + 0.26));
  const highlight = phase(abs, SNAP + 0.16, SNAP + 0.64);
  const torch = smooth(phase(abs, TORCH, TORCH + 0.12));
  fillBg(c, "#03040b");
  glow(c, 540, 900, 900, "rgba(120,150,255,0.25)", rise);
  // the torch on the back of the phone: cold white light on the desk beyond it — and on the cupcake he has just blown
  // out, a thread of smoke still rising from the candle
  if (torch > 0) {
    filtered(
      c,
      "blur(7px)",
      (b) => {
        desk(b, 1180);
        cupcake(b, 850, 1330, 1.1, abs, 0, 1);
      },
      "torchBg",
      torch,
    );
    glow(c, 540, 1000, 1250, "rgba(225,232,255,0.4)", torch);
  }
  const py = 900 + (1 - rise) * 900;
  phoneButtons(c, 540, py, 0.78, 0);
  phone(c, 540, py, 0.78, 0, (p) => {
    lockScreen(p, { time: "23:59", airplane: !tapped });
    if (cc > 0) {
      p.save();
      p.translate(0, -(1 - cc) * SH);
      controlCenter(p, { time: "23:59", airplane: !tapped }, !tapped, tapped ? Math.max(0, 1 - (abs - TAP) * 6) : 0, tapped ? 0 : highlight, torch);
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
    glassGlare(p, 0);
    // his thumbs on the glass: the swipe down from the corner, and the tap that switches it off
    touchDot(p, fingerAt(abs, CC_FINGER));
    touchDot(p, fingerAt(abs, LEFT_THUMB));
  });
}

/** The camera in the control centre: it goes to the flashlight tile (what he came for) as he taps it on, then snaps
 *  to the orange ✈ (he has seen it) and creeps in; after the tap it lets go. [focus x, y, zoom] — the focus stays
 *  where it is on screen, so after the snap the toggle sits at (406, 579), where the colour wave starts. */
function ccView(abs: number, tapped: boolean): [number, number, number] {
  const MID: Pt = [540, 900],
    FLASH: Pt = [649, 909],
    TOGGLE: Pt = [406, 579];
  const drift = easeInOut(phase(abs, SWIPE + 0.26, TORCH));
  const snap = easeOut(phase(abs, SNAP, SNAP + 0.16));
  const creep = easeInOut(phase(abs, SNAP + 0.16, SNAP + 0.7));
  const p = lerp2(lerp2(MID, FLASH, drift), TOGGLE, snap);
  let z = 1 + 0.15 * drift + 0.4 * snap + 0.2 * creep;
  if (tapped) z -= 0.75 * smooth(phase(abs, TAP + 0.1, TAP + 0.5));
  return [p[0], p[1], z];
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
      // the phone in his hands, its back to us — its flashlight still on, blazing straight at the camera
      drawKid(c, 540, 800, 1.2, { body: "bust", hat: true, eyes: "wide", mouth: "o", arms: "phone", look: [0, 0.6], grip: (k) => phoneBack(k, 0, 300, 130, 236, 0, 1) });
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
  const [vx, vy, z] = ccView(abs, tapped);
  // a jolt as the camera snaps to the ✈
  const jolt = Math.sin(Math.PI * phase(abs, SNAP, SNAP + 0.22)) * 10;
  const [hx0, hy0, hr] = handheld(abs, 5, 12);
  const hx = hx0 + jolt,
    hy = hy0 - jolt * 0.6;
  const scene = (c: Ctx) => {
    c.save();
    camera(c, vx, vy, z, hr, hx, hy);
    discoverScene(c, abs, tapped);
    c.restore();
  };
  if (!tapped) {
    grade(ctx, GREY, scene);
    // the orange toggle (and the red ring drawn round it) — the only colour, over the grey
    const cc = smooth(phase(abs, SWIPE, SWIPE + 0.26));
    const rise = easeOut(phase(abs, T0, T0 + 0.5));
    const hl = phase(abs, SNAP + 0.16, SNAP + 0.64);
    if (cc > 0.02) {
      ctx.save();
      camera(ctx, vx, vy, z, hr, hx, hy);
      ctx.translate(540, 900 + (1 - rise) * 900);
      ctx.scale(0.78, 0.78);
      ctx.translate(-SW / 2, -SH / 2);
      // (inside the screen only: while the control centre slides down, the toggle is still above the glass)
      rr(ctx, 0, 0, SW, SH, 70);
      ctx.clip();
      ctx.translate(128, 228 - (1 - cc) * SH);
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
      ctx.globalAlpha = smooth(phase(abs, SNAP + 0.38, SNAP + 0.62));
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
const NOTE_AT = (i: number) => T2 + 0.06 + i * 0.12; // the flood: seven in under a second (audio.ts flood matches)
// 用户: 「99+消息片段全部都很烂」 → redesigned. Two beats each, no more one-beat flash inserts:
//  71.22 (37.83) the flood — the phone fills the frame, notifications slam in and it buzzes with each; the camera
//        rushes into 班长's message, which becomes a banner over →
//  72.27 (38.87) his corridor memory again, from their side (act1's own frames, replayed slower): on the beat
//        72.79 the X faces come off — they were grinning, hiding a birthday banner for him
//  73.31 (39.92) 小雨's message over his classroom memory: on 73.83 the X faces come off — they were laughing at A-Jie
//  74.35 (40.96) him, in his dark room: 妈妈's message; flashlight beams sweep in through the window from below and
//        he looks up at it (the window shot follows at 42.00)
const R1 = beatAt(138); // 72.27 (38.87)
const R2 = beatAt(140); // 73.31 (39.92)
const REAL = beatAt(142); // 74.35 (40.96)
const NOTE_Y = 380; // the message banner over the replays: centre y on screen
const NOTE_W = 1000;

/** one message, big, as a banner across the top of the frame (sliding down as `k` goes 0 → 1) */
function bigNote(ctx: Ctx, n: Note, k: number) {
  if (k <= 0) return;
  const sc = NOTE_W / (SW - 44);
  const h = notificationHeight(ctx, SW - 44, n) * sc;
  ctx.save();
  ctx.translate((W - NOTE_W) / 2, NOTE_Y - h / 2 - (1 - k) * 120);
  ctx.scale(sc, sc);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 24;
  notification(ctx, 0, 0, SW - 44, n, k);
  ctx.restore();
}

// (the old one-beat inserts — their own corridor, classroom and "calling under his window" drawings — are gone; the
// replays use act1's own frames, and the flashlights in his window carry "they are downstairs")

function shotFlood(ctx: Ctx, abs: number) {
  if (abs >= REAL) return shotRealize(ctx, abs);
  if (abs >= R1) return shotReplay(ctx, abs);
  const shown = NOTES.filter((_, i) => abs >= NOTE_AT(i)).length;
  const last = shown ? NOTE_AT(shown - 1) : T2;
  const buzz = shown && abs - last < 0.12 ? 1 - (abs - last) / 0.12 : 0;
  const [sx, sy] = shake(abs, buzz * 12);
  // the rush into 班长's card (third from the top once all seven are in: phone y 530–658) — it ends exactly where
  // the banner over the replay sits, the same size
  const PS = 0.95,
    PY = 900;
  const cardY = PY + (594 - SH / 2) * PS;
  const dive = easeIn(phase(abs, R1 - 0.32, R1));
  const z = 1 + (NOTE_W / ((SW - 44) * PS) - 1) * dive;
  fillBg(ctx, "#0b0e22");
  glow(ctx, 540, 900, 1000, "rgba(255,220,140,0.25)", Math.min(1, shown / 4));
  bokeh(ctx, abs, 14, 501, 0.4 + 0.6 * Math.min(1, shown / 4));
  const [hx, hy, hr] = handheld(abs, 4 * (1 - dive), 13);
  ctx.save();
  camera(ctx, 540, cardY, z, hr, sx + hx, sy + hy + (NOTE_Y - cardY) * dive);
  phoneButtons(ctx, 540, PY, PS, 0);
  phone(ctx, 540, PY, PS, 0, (c) => {
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
      if (i === 4 && abs > R1 - 0.45) {
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
    glassGlare(c, hx);
  });
  ctx.restore();
  if (shown > 0 && dive < 0.5) {
    const k = backOut(phase(abs, NOTE_AT(0), NOTE_AT(0) + 0.25)) * (1 - 2 * dive);
    ctx.save();
    ctx.translate(860, 330);
    ctx.rotate(0.12);
    ctx.scale(k * (1 + 0.08 * pulse(abs)), k * (1 + 0.08 * pulse(abs)));
    text(ctx, "99+", 0, 0, { size: 150, font: F.marker, fill: "#ff3b3b", stroke: "#fff", lw: 16 });
    ctx.restore();
  }
  flash(ctx, 0.7 * (1 - phase(abs, T2, T2 + 0.2)));
}

/** his memories again, from their side: the same frames as act1 (a little slower), the message over them; on the
 *  beat the X faces come off. Their side gets the film look at half strength. */
function shotReplay(ctx: Ctx, abs: number) {
  const second = abs >= R2;
  const t0 = second ? R2 : R1,
    t1 = second ? REAL : R2;
  const unAt = second ? beatAt(141) : beatAt(139);
  const u = smooth(phase(abs, unAt, unAt + 0.28));
  const p = phase(abs, t0, t1);
  // corridor: from just before they see him to the stiff wave (the X faces come off as they stand there grinning);
  // classroom: A-Jie up → the slip → the class bursting out laughing (the X faces come off on the laugh)
  const mem = second ? 12.98 + 0.92 * p : 9.1 + 0.68 * p;
  oldFilm(ctx, abs, (c) => (second ? replaySlip(c, mem, u) : replayCorridor(c, mem, u)), "film", 0.45);
  bigNote(ctx, second ? NOTES[3] : NOTES[4], second ? easeOut(phase(abs, t0, t0 + 0.18)) : 1);
  if (second) flash(ctx, 0.45 * (1 - phase(abs, t0, t0 + 0.12)));
}

/** him in his dark room, the phone's light on his face, 妈妈's message over it: flashlight beams sweep in through the
 *  window from below — the lights from the cold open — and he looks up at the window. */
function shotRealize(ctx: Ctx, abs: number) {
  const look = smooth(phase(abs, REAL + 0.42, REAL + 0.72));
  const [hx, hy, hr] = handheld(abs, 5, 15);
  ctx.save();
  // the window (world 640–970 × 300–700) on the right below the message banner, him on the left, his phone above
  // the lyrics
  camera(ctx, 540, 860, 1.15 + 0.05 * phase(abs, REAL, T3), hr, hx, hy + 304);
  bedroom(ctx, abs, 1, 1);
  ctx.fillStyle = "rgba(4,5,14,0.5)";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  // the flashlights downstairs, swinging up through the window onto the ceiling and across the wall behind him
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const a = -2.1 + 0.35 * i + Math.sin(abs * (1.6 + i * 0.4) + i * 2) * 0.22;
    const ox = 720 + i * 80,
      oy = 700;
    const len = 1500;
    ctx.beginPath();
    ctx.moveTo(ox - 10, oy);
    ctx.lineTo(ox + Math.cos(a - 0.07) * len, oy + Math.sin(a - 0.07) * len);
    ctx.lineTo(ox + Math.cos(a + 0.07) * len, oy + Math.sin(a + 0.07) * len);
    ctx.lineTo(ox + 10, oy);
    ctx.closePath();
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, len);
    g.addColorStop(0, "rgba(255,250,225,0.32)");
    g.addColorStop(1, "rgba(255,250,225,0)");
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
  drawKid(ctx, 330, 560, 1.0, {
    body: "bust",
    hat: true,
    arms: "phone",
    eyes: look > 0.5 ? "wide" : "teary",
    brows: look > 0.5 ? "up" : "worried",
    mouth: look > 0.5 ? "o" : "wobble",
    tears: 0.35,
    look: lerp2([0, 0.75], [1, -0.1], look),
    turn: 0.4 * look,
    grip: (k) => phoneBack(k, 0, 300, 130, 236),
  });
  glow(ctx, 330, 700, 300, "rgba(200,225,255,0.3)");
  ctx.restore();
  bigNote(ctx, NOTES[5], easeOut(phase(abs, REAL, REAL + 0.18)));
  flash(ctx, 0.45 * (1 - phase(abs, REAL, REAL + 0.12)));
}

// ---------------------------------------------------------------- 42.00 – 46.18 the window · 他们一直都在
// 用户: 「太烂了」 (a small window frame with everyone crammed in behind the lyrics, the bottom third black, 4 s of the
// same picture). Now three shots, on the beats:
//  75.40 (42.00) over his shoulder at the window: the torch beams from the street climb the glass and the ceiling;
//        the camera pushes past him toward the glass
//  76.44 (43.04) his view straight down: the pavement outside his door, all of them looking up at him — banner
//        unrolling, phone torches pointed up, 小雨 in front with the big cake from the bakery (gold 17 lit);
//        the X faces come off one by one on the off-beats (Everyone is so fake → 是我把自己藏起来了); chalk on the
//        pavement below them: HAPPY 17 (彩蛋)
//  78.53 (45.13) from below, looking up at his window: torch spots on the wall, him in the window — tears, then
//        his first smile — and he's gone from the window, running for the stairs → the door bursts open
const WIN_B = beatAt(146); // 76.44 (43.04)
const WIN_C = beatAt(150); // 78.53 (45.13)

function shotToWindow(ctx: Ctx, abs: number) {
  const push = easeInOut(phase(abs, T3, WIN_B));
  const lean = smooth(phase(abs, T3 + 0.45, T3 + 0.8));
  const [hx, hy, hr] = handheld(abs, 5, 14);
  const z = 1.6 + 1.0 * push;
  ctx.save();
  // the window (world 640–970 × 300–700) centred a little high, so his head sits under it
  camera(ctx, 805, 500, z, hr, 540 - 805 + hx, 560 - 500 + hy);
  bedroom(ctx, abs, 1, 1);
  ctx.fillStyle = "rgba(4,5,14,0.35)";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  // outside the glass: torch beams rising from the street below, swinging
  const beams = (c: Ctx, ox: number, oy: number, n: number, len: number, a0: number) => {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const a = a0 + 0.3 * (i - (n - 1) / 2) + Math.sin(abs * (1.7 + i * 0.5) + i * 2.3) * 0.18;
      const x = ox + (i - (n - 1) / 2) * 60;
      c.beginPath();
      c.moveTo(x - 8, oy);
      c.lineTo(x + Math.cos(a - 0.06) * len, oy + Math.sin(a - 0.06) * len);
      c.lineTo(x + Math.cos(a + 0.06) * len, oy + Math.sin(a + 0.06) * len);
      c.lineTo(x + 8, oy);
      c.closePath();
      const g = c.createRadialGradient(x, oy, 0, x, oy, len);
      g.addColorStop(0, "rgba(255,250,225,0.4)");
      g.addColorStop(1, "rgba(255,250,225,0)");
      c.fillStyle = g;
      c.fill();
    }
    c.restore();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(640, 300, 330, 400);
  ctx.clip();
  beams(ctx, 805, 720, 4, 520, -Math.PI / 2);
  ctx.restore();
  // …and through it onto the ceiling of his room
  beams(ctx, 805, 690, 3, 900, -2.2);
  // him from behind, down to the left of the glass, so we look past his shoulder at it — the camera passes him and
  // he slides out of the frame (no hands in shot)
  drawKid(ctx, 650, 770 - 14 * lean, 0.8, { view: "back", body: "bust", hat: true, tilt: 0.06 * lean, arms: "custom", handL: [-120, 432], handR: [120, 432], shapeL: "hidden", shapeR: "hidden" });
  ctx.restore();
  flash(ctx, 0.3 * (1 - phase(abs, T3, T3 + 0.15)));
}

/** the pavement outside his door, seen straight down from his window */
function pavementBelow(c: Ctx, abs: number) {
  fillBg(c, "#1a1c30");
  // the road at the top, its centre line
  for (let k = 0; k < 6; k++) {
    rr(c, -80 + k * 250, 170, 150, 18, 6);
    c.fillStyle = "#5a5b74";
    c.fill();
  }
  poly(c, [[-120, 330], [W + 120, 326], [W + 120, 372], [-120, 376]], 1611, 1);
  paint(c, "#4a4b66", C.ink, 4);
  shaded(c, () => poly(c, [[-120, 376], [W + 120, 372], [W + 120, H + 300], [-120, H + 300]], 1612, 1.5), "#2f3352", () => {
    for (let y = 480; y < H + 300; y += 130) inkLine(c, [[-120, y], [W + 120, y - 4]], 1613 + y, 2, "rgba(0,0,0,0.28)");
    for (let x = -60; x < W + 120; x += 150) inkLine(c, [[x, 376], [x, H + 300]], 1700 + x, 2, "rgba(0,0,0,0.22)");
  }, C.ink, 5);
  // the street lamp's pool and the warm light spilling from his lobby door below the window
  glow(c, 540, 760, 700, "rgba(255,226,170,0.2)");
  glow(c, 540, H + 120, 1000, "rgba(255,205,130,0.5)");
  // 彩蛋: chalk on the pavement in front of them
  c.save();
  c.translate(500, 1700);
  c.rotate(-0.05);
  c.globalAlpha = 0.6;
  c.font = `400 150px ${F.marker}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineWidth = 5;
  c.strokeStyle = "#f4f1ea";
  c.strokeText("HAPPY 17", 0, 0);
  c.restore();
  c.save();
  c.globalAlpha = 0.55;
  c.strokeStyle = "#ff9cc3";
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(950, 1640);
  c.bezierCurveTo(910, 1590, 850, 1640, 950, 1720);
  c.bezierCurveTo(1050, 1640, 990, 1590, 950, 1640);
  c.stroke();
  c.restore();
}

type Role = "bannerL" | "bannerR" | "torch" | "wave" | "cake";
// all of them looking up at him; head centres and scales; `k` = the order the X faces come off
const BELOW: { p: Person; x: number; y: number; s: number; role: Role; k: number }[] = [
  // (feet and the cake clear of the lyrics)
  { p: CAST.a, x: 190, y: 520, s: 0.52, role: "bannerL", k: 0 },
  { p: CAST.e, x: 890, y: 520, s: 0.52, role: "bannerR", k: 1 },
  { p: CAST.d, x: 370, y: 600, s: 0.56, role: "torch", k: 2 },
  { p: CAST.c, x: 710, y: 600, s: 0.56, role: "torch", k: 3 },
  { p: CAST.monitor, x: 195, y: 700, s: 0.62, role: "wave", k: 4 },
  { p: CAST.jie, x: 885, y: 700, s: 0.62, role: "torch", k: 5 },
  { p: CAST.yu, x: 540, y: 720, s: 0.66, role: "cake", k: 6 },
];
const X_OFF = (k: number) => WIN_B + 0.26 + k * 0.26;

function lookingDown(c: Ctx, abs: number) {
  const open = easeOut(phase(abs, WIN_B + 0.05, WIN_B + 0.6));
  pavementBelow(c, abs);
  BELOW.forEach((q, i) => {
    if (i === 2) banner(c, 540, 440, 610, open, "生日快乐", 720, F.cn);
    const t = X_OFF(q.k);
    const off = smooth(phase(abs, t, t + 0.18));
    const hop = -Math.abs(Math.sin(abs * 7 + i * 1.3)) * 12 * (0.4 + 0.6 * off);
    const y = q.y + hop;
    const torchUp = q.role === "torch";
    const sway = Math.sin(abs * 3 + i) * 10;
    drawPerson(c, q.x, y, q.s, {
      ...q.p,
      body: "full",
      x: 1 - off,
      face: "laugh",
      turn: (540 - q.x) / 900,
      ...(q.role === "bannerL" || q.role === "bannerR" ? { arms: "up" as const } : {}),
      ...(q.role === "wave" ? { arms: "waveL" as const, wave: 1, walk: abs * 4 } : {}),
      ...(torchUp ? { handR: [130 + sway, -90] as Pt, shapeR: "hold" as const, handL: [-112, 352] as Pt } : {}),
      ...(q.role === "cake" ? { handL: [-92, 400] as Pt, handR: [92, 400] as Pt, shapeL: "hold" as const, shapeR: "hold" as const } : {}),
    });
    // a phone held up at him: we see its back, the torch blazing (drawn over the fist, so no thumb to get wrong)
    if (torchUp) phoneBack(c, q.x + (128 + sway) * q.s, y - 140 * q.s, 56 * q.s, 100 * q.s, 0.05, 1);
    if (q.role === "cake") bigCake(c, q.x, y + 440 * q.s, 0.4, abs, { candle17: true, lit: 1 });
    // the X comes off: a burst of light and a few sparks
    const pop = phase(abs, t, t + 0.4);
    if (pop > 0 && pop < 1) {
      glow(c, q.x, y, 320 * q.s, "rgba(255,240,200,0.9)", 1 - pop);
      c.save();
      c.globalAlpha = 1 - pop;
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2 + 0.3;
        const r0 = (90 + 120 * pop) * q.s * 1.6,
          r1 = r0 + 40 * q.s;
        inkLine(c, [[q.x + Math.cos(a) * r0, y + Math.sin(a) * r0], [q.x + Math.cos(a) * r1, y + Math.sin(a) * r1]], 1800 + s, 5, "#ffe45c");
      }
      c.restore();
    }
  });
}

function shotLookDown(ctx: Ctx, abs: number) {
  const tilt = easeOut(phase(abs, WIN_B, WIN_B + 0.6)); // tips down onto them as he leans out
  const [hx, hy, hr] = handheld(abs, 4, 16);
  ctx.save();
  camera(ctx, 540, 820, 1.04 + 0.07 * easeInOut(phase(abs, WIN_B, WIN_C)), hr, hx, hy + 260 * (1 - tilt));
  lookingDown(ctx, abs);
  ctx.restore();
  flash(ctx, 0.45 * (1 - phase(abs, WIN_B, WIN_B + 0.15)));
}

/** looking up at his window from the street: the wall leaning in toward the top, torch spots sweeping over it, him in
 *  the window — crying, then smiling — and then he's gone, running for the stairs */
function shotLookUp(ctx: Ctx, abs: number) {
  const smile = abs > WIN_C + 0.32;
  const nod = smile ? Math.sin(Math.PI * phase(abs, WIN_C + 0.32, WIN_C + 0.62)) * 14 : 0;
  const gone = easeIn(phase(abs, WIN_C + 0.68, WIN_C + 0.92));
  const [hx, hy, hr] = handheld(abs, 5, 17);
  ctx.save();
  camera(ctx, 540, 640, 1.0 + 0.08 * phase(abs, WIN_C, T4), hr, hx, hy);
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#060918"], [1, "#11152e"]]));
  shaded(ctx, () => poly(ctx, [[90, -120], [W - 90, -120], [W + 280, H + 120], [-280, H + 120]], 1901, 1.5), "#232849", () => {
    for (let y = -100, k = 0; y < H + 120; k++, y += 40 + k * 3) inkLine(ctx, [[-300, y], [W + 300, y]], 1902 + k, 2, "rgba(0,0,0,0.25)");
  }, C.ink, 6);
  // the neighbours' windows: above his, and either side of it
  for (const [x, y, w, h, lit] of [[250, -60, 200, 200, 1], [640, -60, 200, 200, 0], [-120, 360, 260, 620, 1], [940, 360, 260, 620, 0]] as [number, number, number, number, number][]) {
    if (lit) glow(ctx, x + w / 2, y + h / 2, 220, "rgba(255,200,120,0.25)");
    rbox(ctx, x, y, w, h, 6, 1910 + x, 1);
    paint(ctx, lit ? "#ffd98a" : "#151933", C.ink, 5);
    if (lit) {
      // a neighbour watching
      ctx.fillStyle = "rgba(90,60,30,0.8)";
      ctx.beginPath();
      ctx.arc(x + w * 0.55, y + h * 0.45, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + w * 0.55 - 30, y + h * 0.45 + 26, 60, 120);
    }
  }
  // his window
  const WX = 260,
    WY = 330,
    WW = 560,
    WH = 620;
  ctx.save();
  rbox(ctx, WX, WY, WW, WH, 8, 1920, 1);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, WY, WY + WH, [[0, "#1b2146"], [1, "#121633"]]);
  ctx.fillRect(WX - 10, WY - 10, WW + 20, WH + 20);
  for (const side of [-1, 1]) {
    const cx = side < 0 ? WX + 30 : WX + WW - 30;
    blob(ctx, [[cx - 60, WY - 10], [cx + 60, WY - 10], [cx + 40 + Math.sin(abs * 3) * 6 * gone, WY + WH + 10], [cx - 50, WY + WH + 10]], 1921 + side, 2);
    paint(ctx, "#33508f", C.ink, 5);
  }
  if (gone < 1)
    drawKid(ctx, 540 - 620 * gone, 700, 1.05, {
      body: "bust",
      hat: true,
      eyes: smile ? "happy" : "teary",
      brows: smile ? "up" : "worried",
      mouth: smile ? "grin" : "wobble",
      tears: 0.6,
      look: [0, 0.85],
      headY: nod,
      tilt: -0.25 * gone,
    });
  // speed lines as he goes
  if (gone > 0 && gone < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - gone;
    for (let i = 0; i < 5; i++) inkLine(ctx, [[640 + i * 30, 560 + i * 60], [800 + i * 30, 560 + i * 60]], 1930 + i, 6);
    ctx.restore();
  }
  ctx.restore();
  rbox(ctx, WX, WY, WW, WH, 8, 1920, 1);
  paint(ctx, null, "#3a3f5e", 16);
  paint(ctx, null, C.ink, 5);
  rbox(ctx, WX - 30, WY + WH - 6, WW + 60, 44, 8, 1925, 1);
  paint(ctx, "#4a4f72", C.ink, 5);
  // the torch spots, sweeping over the wall and finding him
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const sx = 540 + Math.sin(abs * (1.1 + i * 0.37) + i * 1.9) * (180 + i * 50),
      sy = 620 + Math.cos(abs * (0.9 + i * 0.29) + i) * (140 + i * 40);
    glow(ctx, sx, sy, 170, "rgba(255,252,235,0.28)");
  }
  ctx.restore();
  ctx.restore();
  // them in the foreground, from behind, out of focus: heads and raised phones, the screens toward us
  filtered(
    ctx,
    "blur(6px)",
    (b) => {
      const heads: [number, number, number][] = [[120, 1580, 230], [430, 1700, 260], [760, 1640, 240], [1010, 1560, 210]];
      heads.forEach(([x, y, r], i) => {
        const ax = x + (i % 2 ? -90 : 90),
          ay = y - 420 + Math.sin(abs * 3 + i) * 20;
        inkLine(b, [[x + (i % 2 ? -60 : 60), y + 40], [ax, ay + 60]], 1940 + i, 70, "#0c0e1c");
        b.fillStyle = "#dfe9ff";
        rr(b, ax - 34, ay - 60, 68, 120, 12);
        b.fill();
        glow(b, ax, ay, 150, "rgba(200,220,255,0.35)");
        b.fillStyle = "#0c0e1c";
        b.beginPath();
        b.ellipse(x, y, r * 0.5, r * 0.56, 0, 0, Math.PI * 2);
        b.fill();
        b.fillRect(x - r * 0.9, y + r * 0.4, r * 1.8, 600);
      });
    },
    "crowdBack",
  );
  flash(ctx, 0.3 * (1 - phase(abs, WIN_C, WIN_C + 0.12)));
}

function shotWindow(ctx: Ctx, abs: number) {
  if (abs < WIN_B) return shotToWindow(ctx, abs);
  if (abs < WIN_C) return shotLookDown(ctx, abs);
  return shotLookUp(ctx, abs);
}

const CREW: { p: Person; x: number; y: number; s: number; arms: Person["arms"]; xAt: number }[] = [
  { p: CAST.a, x: 250, y: 880, s: 0.42, arms: "up", xAt: beatAt(146) },
  { p: CAST.e, x: 830, y: 880, s: 0.42, arms: "up", xAt: beatAt(147) },
  { p: CAST.monitor, x: 380, y: 960, s: 0.5, arms: "hold", xAt: beatAt(148) },
  { p: CAST.jie, x: 700, y: 960, s: 0.5, arms: "hold", xAt: beatAt(149) },
  { p: CAST.d, x: 160, y: 1040, s: 0.5, arms: "up", xAt: beatAt(150) },
  { p: CAST.yu, x: 540, y: 1060, s: 0.56, arms: "waveL", xAt: beatAt(151) },
];

/** the old window shot (unused, kept for reference) */
export function shotWindowOld(ctx: Ctx, abs: number) {
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

// 用户: 「蛋糕糊脸片段也优化一下」 (it was one static group photo for 4 s: the hit was a tiny plate you couldn't
// see, the cake in front of 小雨's face, his fists on the lyrics, the bottom third empty). Now three shots:
//  79.57 (46.18) the lobby door flies open and he runs out at us — a slice of the big cake swings in from the right
//  80.09 (46.70) SPLAT, a close-up of his face: cream flying, the plate sliding off; a beat of stunned stillness, eyes
//        shut → they blink open → 81.13 he bursts out laughing, and 哈哈哈 all round him — warm now, the same laughter
//        that closed in on him in the classroom (laugh in my face → 还把蛋糕砸在了我脸上)
//  81.66 (48.27) wide: all of them round him laughing, the big cake on a little table in front of him with its gold
//        17 lit, singing (notes floating up) → 82.45 confetti → 83.22 he blows the 17 out — not alone this time (the
//        candle he blew out alone at 31.86) — and they cheer
const HIT_END = beatAt(156); // 81.66 (48.27)
const LAUGH_AT = beatAt(155); // 81.13 (47.75)
const BLOW2 = beatAt(159); // 83.22 (49.83)

function shotBurstOut(ctx: Ctx, abs: number) {
  const open = easeOut(phase(abs, T4, T4 + 0.14));
  const run = easeOut(phase(abs, T4 + 0.04, SPLAT));
  const swing = easeIn(phase(abs, SPLAT - 0.22, SPLAT));
  const [hx, hy, hr] = handheld(abs, 6, 15);
  ctx.save();
  camera(ctx, 540, 820, 1.05 + 0.08 * run, hr, hx, hy);
  filtered(ctx, "blur(2px)", (b) => buildingEntrance(b, abs), "bg");
  // the two door leaves flying open
  for (const side of [-1, 1]) {
    const w = 190 * (1 - 0.82 * open);
    const x0 = side < 0 ? 350 : 730 - w;
    poly(ctx, [[x0, 430], [x0 + w, 430 + side * 10 * open], [x0 + w, 1090 - side * 10 * open], [x0, 1090]], 1990 + side, 1);
    paint(ctx, "#7d5a3a", C.ink, 5);
  }
  // him, running out at us
  drawKid(ctx, 540, 640 + 140 * run, 0.7 + 0.35 * run, {
    body: "full",
    legs: "run",
    walk: abs * 16,
    hat: true,
    eyes: "wide",
    mouth: "open",
    brows: "up",
    // arms bent and pumping in front of him as he runs (open hands read as jazz hands, fists at the hips as hands
    // on hips)
    arms: "custom",
    handL: [-125, 270 + 70 * Math.sin(abs * 16)],
    handR: [125, 270 - 70 * Math.sin(abs * 16)],
    shapeL: "fist",
    shapeR: "fist",
  });
  ctx.restore();
  // them, waiting either side of the door, in the foreground and out of focus, arms up
  filtered(
    ctx,
    "blur(5px)",
    (b) => {
      drawPerson(b, 40, 900, 1.15, { ...CAST.monitor, x: 0, face: "laugh", arms: "up", body: "full" });
      drawPerson(b, 1060, 940, 1.15, { ...CAST.a, x: 0, face: "laugh", arms: "up", body: "full" });
    },
    "sides",
  );
  // the slice swinging in from the right, big and blurred with speed
  if (swing > 0) {
    filtered(
      ctx,
      `blur(${(3 + 6 * swing).toFixed(1)}px)`,
      (b) => {
        b.save();
        b.translate(1250 - 650 * swing, 1050 - 230 * swing);
        b.rotate(-0.4 + 0.3 * swing);
        b.scale(2.4, 2.4);
        cakeSlice(b, 0, 0, true);
        b.restore();
      },
      "slice",
    );
  }
  flash(ctx, 0.95 * (1 - easeOut(phase(abs, T4, T4 + 0.25))), "#fff1d0");
}

function shotSplat(ctx: Ctx, abs: number) {
  const t = abs - SPLAT;
  const plate = easeIn(phase(abs, SPLAT + 0.18, SPLAT + 0.6)); // the plate slides off and drops
  const blink = abs > SPLAT + 0.86; // his eyes come open
  const laugh = abs >= LAUGH_AT;
  const pull = easeInOut(phase(abs, LAUGH_AT, HIT_END));
  const [sx, sy] = shake(abs, 20 * Math.exp(-t * 7));
  const [hx, hy, hr] = handheld(abs, 4, 18);
  ctx.save();
  camera(ctx, 540, 760, 1 - 0.18 * pull, hr, sx + hx, sy + hy);
  filtered(
    ctx,
    "blur(7px)",
    (b) => {
      b.save();
      camera(b, 540, 760, 1.6);
      buildingEntrance(b, abs);
      b.restore();
    },
    "bg",
  );
  drawKid(ctx, 540, 820 + (laugh ? Math.abs(Math.sin(abs * 12)) * -10 : 0), 2.2, {
    body: "bust",
    hat: true,
    cake: 1,
    eyes: laugh ? "happy" : blink ? "open" : "shut",
    mouth: laugh ? "laugh" : "o",
    blush: laugh ? 1 : 0,
    tilt: laugh ? Math.sin(abs * 14) * 0.05 : -0.06 * Math.exp(-t * 5),
    arms: "pockets", // (no fists along the bottom of the close-up)
  });
  // the paper plate, stuck on his face, then sliding off and dropping out of frame
  if (plate < 1) {
    ctx.save();
    ctx.translate(560 + 140 * plate, 900 + 900 * plate);
    ctx.rotate(0.3 + 1.6 * plate);
    oval(ctx, 0, 0, 230, 70, 1995, 1.2);
    paint(ctx, "#fbfbfb", C.ink, 6);
    oval(ctx, 0, -6, 170, 44, 1996, 1);
    paint(ctx, "#ffd3e3", null);
    ctx.restore();
  }
  ctx.restore();
  // the impact: ink lines and pink cream flying out
  const hit = phase(abs, SPLAT, SPLAT + 0.45);
  if (hit < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - hit;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2;
      const r0 = 330 + 260 * hit,
        r1 = r0 + 90;
      inkLine(ctx, [[540 + Math.cos(a) * r0, 820 + Math.sin(a) * r0], [540 + Math.cos(a) * r1, 820 + Math.sin(a) * r1]], 2000 + i, 9);
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.6;
      const d = 260 + 520 * easeOut(hit);
      oval(ctx, 540 + Math.cos(a) * d, 820 + Math.sin(a) * d + 300 * hit * hit, 26 - 8 * hit, 20 - 6 * hit, 2020 + i, 1);
      paint(ctx, i % 3 ? "#fff8f0" : "#ff9cc3", C.ink, 4);
    }
    ctx.restore();
  }
  // the laughter all round him — warm this time
  if (laugh) {
    const ht = phase(abs, LAUGH_AT, LAUGH_AT + 0.6) * 1.2;
    hahas(ctx, 200, 560, 160, ht, 2041, F.cn, 4);
    hahas(ctx, 880, 600, 160, ht - 0.1, 2047, F.cn, 4);
    hahas(ctx, 540, 330, 140, ht - 0.2, 2053, F.cn, 3);
  }
  flash(ctx, 0.6 * (1 - phase(abs, SPLAT, SPLAT + 0.12)));
}

/** a music note floating up (they're singing) */
function note(c: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(-0.2);
  oval(c, 0, 0, 16, 12, seed, 0.6);
  paint(c, "#ffe45c", C.ink, 4);
  inkLine(c, [[14, -2], [14, -56], [36, -44]], seed + 1, 5);
  c.restore();
}

function shotCelebrate(ctx: Ctx, abs: number) {
  const p = pulse(abs);
  const blow = smooth(phase(abs, BLOW2 - 0.2, BLOW2));
  const out = abs >= BLOW2 + 0.08;
  const cheer = smooth(phase(abs, BLOW2 + 0.1, BLOW2 + 0.3));
  const [hx, hy, hr] = handheld(abs, 5, 19);
  ctx.save();
  camera(ctx, 540, 820, 1.02 + 0.03 * p + 0.06 * easeInOut(phase(abs, HIT_END, END)), hr, hx, hy);
  filtered(ctx, "blur(2px)", (b) => buildingEntrance(b, abs), "bg");
  banner(ctx, 540, 330, 820, 1, "生日快乐", 740, F.cn);
  const ring: [Person, number, number, number, Person["arms"]][] = [
    [CAST.monitor, 270, 560, 0.6, "laugh"],
    [CAST.a, 810, 560, 0.6, "up"],
    [CAST.d, 110, 720, 0.72, "up"],
    [CAST.e, 970, 720, 0.72, "laugh"],
    [CAST.yu, 200, 900, 0.8, "laugh"],
  ];
  ring.forEach(([q, x, y, s, arms], i) =>
    drawPerson(ctx, x, y - Math.abs(Math.sin(abs * 9 + i)) * (12 + 18 * cheer), s, {
      ...q,
      x: 0,
      face: "laugh",
      arms: cheer > 0.5 ? "up" : arms,
      tilt: Math.sin(abs * 14 + i) * 0.08,
      body: "full",
    }),
  );
  // A-Jie, very pleased with himself, the empty plate in his hand
  drawPerson(ctx, 890, 900, 0.8, {
    ...CAST.jie,
    x: 0,
    face: "laugh",
    arms: cheer > 0.5 ? "up" : "point",
    body: "full",
    tilt: Math.sin(abs * 12) * 0.06,
    holding: cheer > 0.5 ? undefined : (h) => cakeSlice(h, -200, 70, false),
  });
  // him, cream on his face, laughing — then leaning in to blow
  drawKid(ctx, 540, 740 + 40 * blow, 1.0, {
    body: "bust",
    hat: true,
    cake: 1,
    eyes: blow > 0.3 && !out ? "shut" : "happy",
    mouth: blow > 0.3 && !out ? "blow" : "laugh",
    blush: 1,
    tilt: blow > 0.3 ? 0 : Math.sin(abs * 12) * 0.05,
    arms: "pockets",
  });
  // the little table and the big cake from the bakery window, the gold 17 burning (彩蛋)
  poly(ctx, [[280, 1172], [800, 1166], [810, 1320], [270, 1326]], 2061, 1.2);
  paint(ctx, "#ff9cc3", C.ink, 5);
  for (let k = 0; k < 5; k++) inkLine(ctx, [[320 + k * 110, 1180], [316 + k * 110, 1316]], 2062 + k, 2.4, "rgba(180,60,110,0.35)");
  bigCake(ctx, 540, 1178, 0.42, abs, { candle17: true, lit: out ? 0 : 1 });
  // the flame goes out: a wisp of smoke
  if (out) {
    const sm = phase(abs, BLOW2 + 0.08, BLOW2 + 0.6);
    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - sm);
    inkLine(ctx, [[540, 950], [530 + 10 * Math.sin(abs * 8), 910 - 60 * sm], [550, 850 - 120 * sm]], 2070, 5, "#d8d8e0");
    ctx.restore();
  }
  // singing: notes floating up from them
  for (let i = 0; i < 6; i++) {
    const t0 = HIT_END + i * 0.26;
    const k = phase(abs, t0, t0 + 1.1);
    if (k <= 0 || k >= 1) continue;
    const x0 = [270, 810, 110, 970, 200, 890][i];
    note(ctx, x0 + Math.sin(k * 6 + i) * 20, 640 - 280 * k + (i > 3 ? 200 : 0), 1, Math.sin(Math.PI * k), 2080 + i * 2);
  }
  ctx.restore();
  confetti(ctx, abs, 82.45, 110, 5);
  if (out) confetti(ctx, abs, BLOW2 + 0.1, 70, 6);
  flash(ctx, 0.3 * (1 - phase(abs, HIT_END, HIT_END + 0.12)));
}

function shotParty(ctx: Ctx, abs: number) {
  if (abs < SPLAT) return shotBurstOut(ctx, abs);
  if (abs < HIT_END) return shotSplat(ctx, abs);
  return shotCelebrate(ctx, abs);
}

/** the old party shot (unused, kept for reference) */
export function shotPartyOld(ctx: Ctx, abs: number) {
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
