import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, beatAt, blob, camera, card, designScene, easeIn, easeOut, fillBg, flash, glow, paint, rr, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, banner, drawPerson, hahas } from "./lib/people";
import { SH, SW, lockScreen, phone } from "./lib/phone";
import { classroom, corridor, lightPool, schoolDesk } from "./lib/sets";
import { birthdayDesk } from "./lib/shared";
import { FingerKey, fingerAt, heldHands, onScreen, tapRipple } from "./lib/hand";

/** ACT 1 (0 – 16.96s): alone with a birthday cupcake, a silent phone, and a flashback to "fake" classmates. */
const T0 = 0;
const S2 = beatAt(8); // 4.44
const S3 = beatAt(16); // 8.61
const S4 = beatAt(24); // 12.79
const END = beatAt(32); // 16.96

function shotCandle(ctx: Ctx, abs: number) {
  const whip = easeIn(phase(abs, 3.95, S2));
  ctx.save();
  camera(ctx, 540 + whip * 300, 900 + whip * 300, 1 + 0.05 * smooth(abs / S2) + whip * 1.6);
  birthdayDesk(ctx, abs, { lit: 1 });
  ctx.restore();
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
  const wake = smooth(phase(abs, S2 + 0.35, S2 + 0.6));
  const s = 0.74 + 0.04 * smooth(t / 4.2);
  // pull-to-refresh: the lock screen follows the finger down, then springs back
  const pull = 110 * smooth(phase(abs, 6.32, 6.8)) * (1 - smooth(phase(abs, 6.85, 7.25)));
  const spinning = abs > 6.45 && abs < 7.3;
  const nudge = abs > 7.35 ? Math.sin((abs - 7.35) * 40) * 10 * Math.exp(-(abs - 7.35) * 6) : 0;
  const cx = 540 + nudge,
    cy = 800;
  phone(ctx, cx, cy, s, -0.02, (c) => {
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
  heldHands(ctx, cx, cy, s, -0.02, fingerAt(abs, LOCK_FINGER)!);
  lightPool(ctx, 540, 800, 1100, 0.5, "rgba(120,140,255,0.12)");
}

function shotCorridor(ctx: Ctx, abs: number) {
  const hide = abs > 9.55;
  const turn = smooth(phase(abs, 9.45, 9.7));
  const closeUp = abs >= 10.72;
  if (!closeUp) {
    ctx.save();
    camera(ctx, 540, 900, 1.02 + 0.04 * phase(abs, S3, 10.7));
    corridor(ctx);
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
    camera(ctx, 540, 820, 1.0 + 0.06 * phase(abs, 10.72, S4));
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
  ctx.save();
  camera(ctx, 540, 780, 1 + slam * 0.9, 0, sx, sy);
  classroom(ctx);
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
