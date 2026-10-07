import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, beatAt, blob, camera, card, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, handheld, paint, rr, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, banner, drawPerson, hahas } from "./lib/people";
import { SH, SW, controlCenter, lockScreen, phone } from "./lib/phone";
import { bokeh, classroom, corridor, lightPool, schoolDesk } from "./lib/sets";
import { birthdayDesk } from "./lib/shared";
import { FingerKey, fingerAt, heldHands, onScreen, tapRipple } from "./lib/hand";

/** ACT 1 (0 – 16.96s): alone with a birthday cupcake, a silent phone, and a flashback to "fake" classmates.
 *  重置版: on "I wanna hide away" the flashback now shows the motive — he switches airplane mode on himself. */
const T0 = 0;
const S2 = beatAt(8); // 4.44
const S3 = beatAt(16); // 8.61
const S4 = beatAt(24); // 12.79
const END = beatAt(32); // 16.96
const HIDE = beatAt(22); // 11.74 "I wanna hide…": cut to his phone, the control centre already down
const AIR_ON = beatAt(22.5); // 12.00 "…away": his left thumb switches airplane mode ON (click)

function shotCandle(ctx: Ctx, abs: number) {
  // a slow, breathing push toward him and the candle (hand-held), then the whip into the phone — motion-blurred
  const whip = easeIn(phase(abs, 3.95, S2));
  const [hx, hy, hr] = handheld(abs, 6 * (1 - whip), 1);
  const draw = (c: Ctx) => {
    c.save();
    camera(c, 540 + whip * 300, 900 + whip * 300, 1 + 0.07 * easeInOut(abs / 3.95) + whip * 1.6, hr, hx, hy);
    birthdayDesk(c, abs, { lit: 1 });
    c.restore();
  };
  const blurPx = 14 * Math.sin(Math.PI * whip);
  if (blurPx > 0.6) filtered(ctx, `blur(${blurPx.toFixed(1)}px)`, draw, "whip");
  else draw(ctx);
}

// [time, screen x, screen y, touch]
const LOCK_FINGER: FingerKey[] = [
  [S2, 450, 960, 0.2],
  [4.66, 405, 810, 0],
  [4.79, 390, 780, 1],
  [4.93, 390, 780, 1],
  [5.12, 450, 960, 0.2],
  [6.05, 450, 960, 0.2],
  [6.24, 440, 320, 0],
  [6.32, 430, 300, 1],
  [6.8, 430, 410, 1],
  [6.86, 430, 410, 1],
  [7.05, 450, 960, 0.2],
];

function shotLock(ctx: Ctx, abs: number) {
  const t = abs - S2;
  fillBg(ctx, "#2a1c14");
  glow(ctx, 120, 1100, 900, "rgba(255,160,70,0.35)");
  // his room behind the phone, out of focus: the candle and the town's lights
  bokeh(ctx, abs, 12, 101, 0.6, ["255,190,110", "255,160,90", "200,170,255"]);
  const wake = smooth(phase(abs, S2 + 0.35, S2 + 0.6));
  const s = 0.74 + 0.04 * smooth(t / 4.2);
  // pull-to-refresh: the lock screen follows the finger down, then springs back
  const pull = 110 * smooth(phase(abs, 6.32, 6.8)) * (1 - smooth(phase(abs, 6.85, 7.25)));
  const spinning = abs > 6.45 && abs < 7.3;
  const nudge = abs > 7.35 ? Math.sin((abs - 7.35) * 40) * 10 * Math.exp(-(abs - 7.35) * 6) : 0;
  const [hx, hy, hr] = handheld(abs, 4, 2);
  const cx = 540 + nudge + hx,
    cy = 800 + hy,
    rot = -0.02 + hr;
  phone(ctx, cx, cy, s, rot, (c) => {
    c.save();
    c.translate(0, pull);
    lockScreen(c, { time: "23:58", airplane: true, battery: 0.21 }, { note: "0 条新消息", noteAlpha: smooth(phase(abs, 5.2, 5.5)) });
    c.restore();
    if (spinning) {
      c.save();
      c.translate(SW / 2, 70 + pull * 0.6);
      c.rotate(abs * 10);
      c.strokeStyle = "#fff";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, 0, 18, 0, Math.PI * 1.5);
      c.stroke();
      c.restore();
    }
    c.fillStyle = `rgba(0,0,0,${0.75 * (1 - wake)})`;
    c.fillRect(0, 0, SW, SH);
  });
  // he holds the phone: right thumb taps to wake it, then pulls down to refresh
  const [rx, ry] = onScreen(cx, cy, s, 390, 780);
  tapRipple(ctx, rx, ry, phase(abs, 4.79, 5.25), 1.2);
  heldHands(ctx, cx, cy, s, rot, fingerAt(abs, LOCK_FINGER)!);
  lightPool(ctx, 540, 800, 1100, 0.5, "rgba(120,140,255,0.12)");
}

// the right thumb rests; the left thumb — the same one that switches it OFF in the twist — taps the airplane toggle
const AIR_RIGHT: FingerKey[] = [
  [HIDE, 450, 960, 0.2],
  [S4, 450, 960, 0.2],
];
const AIR_LEFT: FingerKey[] = [
  [HIDE, 150, 960, 0.25],
  [AIR_ON - 0.14, 150, 262, 0],
  [AIR_ON, 128, 228, 1],
  [AIR_ON + 0.12, 128, 228, 1],
  [AIR_ON + 0.3, 170, 400, 0],
  [S4, 150, 960, 0.25],
];

/** 11.74 → 12.79 "I wanna hide away": still the morning flashback (10:13). His phone, framed like the twist at 1:07 so
 *  the two shots rhyme: on "away" the airplane toggle goes orange; the panel slides back up — ✈ in the status bar —
 *  and he locks the screen. Short and without a caption: the motive is shown, the twist still has to be noticed. */
function shotAirplaneOn(ctx: Ctx, abs: number) {
  const on = abs >= AIR_ON;
  const press = on ? Math.max(0, 1 - (abs - AIR_ON) * 6) : 0;
  const close = smooth(phase(abs, AIR_ON + 0.28, AIR_ON + 0.5)); // the panel slides back up
  const dark = smooth(phase(abs, beatAt(23.5), S4)); // he locks the screen
  fillBg(ctx, "#241c14");
  glow(ctx, 540, 700, 900, "rgba(255,220,170,0.28)");
  // the corridor's windows behind the phone, out of focus
  bokeh(ctx, abs, 12, 102, 0.5, ["255,240,200", "200,230,255", "255,220,160"]);
  ctx.save();
  // in on the airplane toggle (screen 128, 228 on a phone at 540, 900 × 0.78), out a little as the panel closes
  const [hx, hy, hr] = handheld(abs, 4, 5);
  camera(ctx, 406, 579, 1 + 0.35 * smooth(phase(abs, HIDE, AIR_ON)) - 0.2 * close, hr, hx, hy);
  phone(ctx, 540, 900, 0.78, 0, (c) => {
    lockScreen(c, { time: "10:13", airplane: on });
    if (close < 1) {
      c.save();
      c.translate(0, -close * SH);
      controlCenter(c, { time: "10:13", airplane: on }, on, press, 0);
      c.restore();
    }
    if (on && abs < AIR_ON + 0.5) {
      const r = phase(abs, AIR_ON, AIR_ON + 0.5);
      c.save();
      c.globalAlpha = 1 - r;
      c.strokeStyle = "#fff";
      c.lineWidth = 6;
      c.beginPath();
      c.arc(128, 228, 60 + r * 120, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    if (dark > 0) {
      c.fillStyle = `rgba(0,0,0,${dark})`;
      c.fillRect(0, 0, SW, SH);
    }
  });
  heldHands(ctx, 540, 900, 0.78, 0, fingerAt(abs, AIR_RIGHT)!, fingerAt(abs, AIR_LEFT)!);
  ctx.restore();
  // the flashback tint, as in the rest of the memory
  ctx.fillStyle = "rgba(150,100,40,0.12)";
  ctx.fillRect(0, 0, W, H);
}

function shotCorridor(ctx: Ctx, abs: number) {
  if (abs >= HIDE) return shotAirplaneOn(ctx, abs);
  const hide = abs > 9.55;
  const turn = smooth(phase(abs, 9.45, 9.7));
  const closeUp = abs >= 10.72;
  if (!closeUp) {
    // tracking alongside him as he walks in (the camera drifts right with him), hand-held; the corridor sits a
    // touch out of focus behind the people
    const track = smooth(phase(abs, S3, 10.4));
    const [hx, hy, hr] = handheld(abs, 5, 3);
    ctx.save();
    camera(ctx, 540, 900, 1.04 + 0.05 * easeInOut(phase(abs, S3, 10.7)), hr, hx + 70 - 140 * track, hy);
    filtered(ctx, "blur(1.6px)", (c) => corridor(c, abs), "bg");
    // the huddle: hiding the banner and a gift the moment he walks by
    const huddle = [
      { p: CAST.monitor, x: 660, turn: -0.2 - turn * 0.6 },
      { p: CAST.jie, x: 830, turn: 0.4 - turn * 1.2 },
      { p: CAST.d, x: 990, turn: -0.5 - turn * 0.5 },
    ];
    if (hide) {
      // the rolled banner sticks out from behind A-Jie's back — a clue
      ctx.save();
      ctx.translate(890, 920);
      ctx.rotate(-0.7);
      banner(ctx, 0, 0, 160, 0, "", 510, F.cn);
      ctx.restore();
      // gift box peeking behind the monitor
      ctx.save();
      ctx.translate(735, 960);
      ctx.rotate(0.15);
      blob(ctx, [[-50, -50], [50, -50], [50, 50], [-50, 50]], 511, 1.2);
      paint(ctx, "#59c3ff", C.ink, 5);
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(-10, -50, 20, 100);
      ctx.restore();
    }
    for (const h of huddle)
      drawPerson(ctx, h.x, 660 + Math.sin(abs * 6 + h.x) * (hide ? 0 : 4), 0.7, {
        ...h.p,
        turn: h.turn,
        arms: hide ? "behind" : "hold",
        body: "full",
        holding:
          !hide && h.p === CAST.jie
            ? (c) => {
                banner(c, 0, 80, 200, 0, "", 512, F.cn);
              }
            : undefined,
      });
    const walkX = 60 + 300 * smooth(phase(abs, S3, 10.4));
    drawKid(ctx, walkX, 650, 0.62, {
      body: "full",
      legs: abs < 10.4 ? "walk" : "stand",
      walk: abs * 9,
      look: [hide ? 1 : 0.6, 0],
      eyes: "sleepy",
      headY: abs < 10.4 ? Math.abs(Math.sin(abs * 9)) * -6 : 0,
    });
    ctx.restore();
  } else {
    // close-up: he pulls his hood up and hides
    const up = abs > 11.35;
    const k = easeOut(phase(abs, 10.72, 11.0));
    ctx.save();
    const [hx, hy, hr] = handheld(abs, 5, 4);
    camera(ctx, 540, 820, 1.0 + 0.08 * easeInOut(phase(abs, 10.72, HIDE)), hr, hx, hy);
    fillBg(ctx, "#cdbd98");
    glow(ctx, 540, 600, 900, "rgba(255,240,200,0.5)");
    drawKid(ctx, 540, 790 + (1 - k) * 60, 1.25, {
      body: "bust",
      hood: up,
      arms: abs > 11.0 && abs < 11.45 ? "up" : "down",
      eyes: up ? "sad" : "sleepy",
      look: [0, 0.8],
      mouth: "frown",
    });
    if (abs > 11.3 && abs < 11.6) {
      const f = phase(abs, 11.3, 11.6);
      ctx.save();
      ctx.globalAlpha = 1 - f;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 6;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.4;
        ctx.beginPath();
        ctx.moveTo(540 + Math.cos(a) * (330 + f * 60), 600 + Math.sin(a) * (330 + f * 60));
        ctx.lineTo(540 + Math.cos(a) * (380 + f * 90), 600 + Math.sin(a) * (380 + f * 90));
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // flashback tint
  ctx.fillStyle = "rgba(150,100,40,0.12)";
  ctx.fillRect(0, 0, W, H);
  card(ctx, "今天上午 10:12", 70, 330, smooth(phase(abs, S3 + 0.1, S3 + 0.4)) * (1 - phase(abs, 10.5, 10.7)));
  flash(ctx, 0.6 * (1 - phase(abs, S3, S3 + 0.15)));
}

function plannerPhone(c: Ctx) {
  c.fillStyle = "#ededed";
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = "#e2e2e2";
  c.fillRect(0, 0, SW, 190);
  text(c, "惊喜策划群", SW / 2, 96, { size: 56, font: F.ui, weight: 700, fill: "#111" });
  text(c, "（不含寿星）", SW / 2, 156, { size: 40, font: F.ui, weight: 700, fill: C.red });
  const msgs = ["横幅藏好了吗", "他来了 快藏!!", "千万别笑场"];
  msgs.forEach((m, i) => {
    c.fillStyle = "#fff";
    rr(c, 40, 260 + i * 150, 460, 110, 16);
    c.fill();
    text(c, m, 70, 315 + i * 150, { size: 46, font: F.ui, fill: "#111", align: "left" });
  });
}

function shotLaugh(ctx: Ctx, abs: number) {
  const slam = easeIn(phase(abs, 15.65, 16.55));
  const [sx, sy] = shake(abs, slam * 14);
  const [hx, hy, hr] = handheld(abs, 7, 6);
  ctx.save();
  // a slow, uneasy push in on him while they laugh (hand-held), then the slam; the room a touch out of focus
  camera(ctx, 540, 780, 1.03 + 0.08 * easeInOut(phase(abs, S4, 15.65)) + slam * 0.9, hr * (1 - slam), sx + hx, sy + hy);
  filtered(ctx, "blur(1.4px)", (c) => classroom(c, abs), "bg");
  const laugh = (i: number) => Math.sin(abs * 22 + i * 2) * 0.08;
  const crowd = [
    { p: CAST.a, x: 300, y: 560, s: 0.62 },
    { p: CAST.b, x: 780, y: 560, s: 0.62 },
    { p: CAST.c, x: 140, y: 760, s: 0.82 },
    { p: CAST.e, x: 940, y: 760, s: 0.82 },
  ];
  crowd.forEach((q, i) =>
    drawPerson(ctx, q.x, q.y + Math.abs(Math.sin(abs * 11 + i)) * -10, q.s, { ...q.p, arms: i % 2 ? "point" : "laugh", tilt: laugh(i), body: "full", turn: q.x < 540 ? 0.6 : -0.6 }),
  );
  drawKid(ctx, 540, 800, 0.95, { body: "bust", arms: "table", eyes: abs > 15.6 ? "sad" : "sleepy", look: [Math.sin(abs * 2) * 0.6, 0.2], mouth: abs > 15.6 ? "wobble" : "frown" });
  schoolDesk(ctx, 540, 1150, 620);
  hahas(ctx, 540, 640, 380, phase(abs, 13.2, 15.0) * 1.2, 77, F.cn, 7);
  // a classmate's phone — the surprise planning group (rewatch clue)
  const show = smooth(phase(abs, S4 + 0.2, S4 + 0.6)) * (1 - smooth(phase(abs, 15.4, 15.7)));
  if (show > 0) {
    ctx.save();
    ctx.translate(-120 * (1 - show), 0);
    phone(ctx, 230, 1180, 0.36, 0.16, plannerPhone, 520);
    drawPerson(ctx, 120, 1420, 0.9, { ...CAST.jie, body: "bust", arms: "down" });
    ctx.restore();
  }
  ctx.fillStyle = "rgba(150,100,40,0.12)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (abs > 16.55) flash(ctx, 1, "#000");
  if (abs > 16.62) {
    text(ctx, "哈", 540, 820, { size: 420 + (abs - 16.62) * 600, font: F.cn, fill: "#fff", alpha: 0.9 - clamp((abs - 16.62) * 2) * 0.6 });
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < S2) shotCandle(ctx, abs);
    else if (abs < S3) shotLock(ctx, abs);
    else if (abs < S4) shotCorridor(ctx, abs);
    else if (abs < END + 0.1) shotLaugh(ctx, abs);
  });
}
