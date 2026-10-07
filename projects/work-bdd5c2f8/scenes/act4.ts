import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blinkEyes, blob, camera, card, designScene, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, inkLine, measure, paint, poly, rr, shaded, shake, text, tubePts, writeOn } from "./lib/draw";
import { KidPose, drawHand, drawKid } from "./lib/kid";
import { CAST } from "./lib/people";
import { Msg, SH, SW, chatScreen, phone } from "./lib/phone";
import { bigCake, bokeh, cupcake, street } from "./lib/sets";
import { birthdayDesk } from "./lib/shared";

/** ACT 4 · 第三遍副歌「他试着开口」(song 50.48 – 67.05 = work 17.08 – 33.66; this act draws in song time, its layer
 *  sits 33.39 s earlier) · 重新设计版. Still his grey world: only the candle, the match and the red "!" are in colour.
 *  17.08 inside the cake shop, looking out: the big two-tier cake sharp in front, him behind the glass in the dark;
 *        the focus racks to his face; a clerk's hand takes one plain cupcake from the tray (彩蛋: this big cake is the
 *        one the friends bring at 0:46)
 *  19.05 walking home under the street lamps, the little cake box in one hand, typing with the other
 *  21.13 the class group: 「其实…今天是我生日」 → sent 23.22 → red "!" 24.00 → push in
 *  25.31 long-press → 删除
 *  26.87 23:58, the desk (the cold open's framing): his hand brings a match to the wick (27.92), the warm light blooms,
 *        he puts on his own party hat
 *  29.48 许个愿吧 → eyes shut → 希望…有人记得我 → blows (31.86) → dark (32.21), the music muffled */
const T0 = 50.475;
const WALK = beatAt(100); // 52.44 (work 19.05)
const N2 = beatAt(104); // 54.53 (21.13) the class group
const SEND = beatAt(108); // 56.61 (23.22)
const FAIL = beatAt(109.5); // 57.40 (24.00) the red !
const N3 = beatAt(112); // 58.70 (25.31) long-press → delete
const N3b = beatAt(115); // 60.27 (26.87) the desk
const MATCH = beatAt(117); // 61.31 (27.92) the match touches the wick
const N4 = beatAt(120); // 62.87 (29.48) the wish
const BLOW = 65.25; // (31.86)
const OUT = 65.6; // (32.21)
const GREY = 0.38;
const MSG = "其实…今天是我生日";

// ---------------------------------------------------------------- 17.08 – 19.05 the cake shop window
function outsideBakery(c: Ctx, abs: number) {
  street(c, abs, 380);
  const later = abs > WALK - 0.75;
  drawKid(c, 660, 700, 0.92, {
    body: "bust",
    arms: "pockets",
    eyes: blinkEyes(abs, 3, later ? "sad" : "open"),
    look: later ? [0.4, 1] : [-0.55, 0.8],
    mouth: "flat",
  });
}

function glass(c: Ctx, abs: number) {
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(200,220,255,0.06)";
  c.beginPath();
  c.moveTo(120, -60);
  c.lineTo(300, -60);
  c.lineTo(60, 1300);
  c.lineTo(-120, 1300);
  c.fill();
  c.fillStyle = "rgba(200,220,255,0.04)";
  c.beginPath();
  c.moveTo(760, -60);
  c.lineTo(820, -60);
  c.lineTo(560, 1300);
  c.lineTo(500, 1300);
  c.fill();
  c.restore();
  // the shop's name painted on the glass, seen from inside: back to front
  c.save();
  c.translate(540, 300);
  c.scale(-1, 1);
  text(c, "BAKERY", 0, 0, { size: 120, font: F.marker, fill: "rgba(255,245,230,0.5)" });
  c.restore();
  // his breath fogging the glass in front of his mouth
  glow(c, 652, 820, 80, `rgba(230,236,255,${(0.2 + 0.08 * Math.sin(abs * 3)).toFixed(3)})`);
}

function display(c: Ctx, abs: number, pick: number) {
  // the display counter (the cake stand sits on it), a darker front edge
  shaded(c, () => poly(c, [[-80, 1400], [W + 80, 1392], [W + 80, H + 80], [-80, H + 80]], 2101, 1.5), "#d9cfc0", () => {
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fillRect(-80, 1396, W + 160, 18);
    c.fillStyle = "rgba(60,40,20,0.35)";
    c.fillRect(-80, 1470, W + 160, H);
  }, C.ink, 6);
  // the window frame edges (we are inside the shop, looking out)
  for (const x of [-40, W - 30]) {
    rr(c, x, -80, 70, 1500, 6);
    c.fillStyle = "#2a2420";
    c.fill();
  }
  bigCake(c, 360, 1430, 1.4, abs);
  // a tray of plain cupcakes; the clerk takes the middle one
  rr(c, 690, 1474, 400, 34, 10);
  c.fillStyle = "#cfc6b8";
  c.fill();
  c.strokeStyle = C.ink;
  c.lineWidth = 4;
  c.stroke();
  const lift = easeIn(clamp((pick - 0.35) / 0.65));
  for (let i = 0; i < 3; i++) cupcake(c, 770 + i * 125, 1464 - (i === 1 ? 460 * lift : 0), 0.4, abs, 0, 0, 0);
  if (pick > 0) {
    const reach = easeOut(Math.min(1, pick / 0.35));
    const wx = 930 + 70 * (1 - reach),
      wy = 1380 - 460 * lift - 220 * (1 - reach);
    blob(c, tubePts([[1220, 900], [wx + 30, wy - 60]], [78, 64]), 2110, 1);
    paint(c, "#f6f7f8", C.ink, 5);
    drawHand(c, wx, wy - 30, 1.0, 2.3, reach > 0.9 ? "hold" : "open", true, false, 2111);
  }
}

function shotBakery(ctx: Ctx, abs: number) {
  // inside the shop looking out: the cake sharp in front, him blurred behind the glass → the focus racks to him
  const rack = easeInOut(phase(abs, T0 + 0.85, T0 + 1.45));
  const drift = easeInOut(phase(abs, T0, WALK));
  const pick = phase(abs, WALK - 0.6, WALK - 0.04);
  const [hx, hy, hr] = handheld(abs, 3, 21);
  grade(ctx, GREY, (g) => {
    g.save();
    camera(g, 540, 960, 1.04 + 0.04 * drift, hr, hx - 40 * drift, hy);
    filtered(g, `blur(${(6 * (1 - rack)).toFixed(2)}px)`, (b) => outsideBakery(b, abs), "bg");
    glass(g, abs);
    filtered(g, `blur(${(5 * rack).toFixed(2)}px)`, (b) => display(b, abs, pick), "fg");
    g.restore();
  });
  card(ctx, "21:52 · 回家的路上", 70, 330, smooth(phase(abs, T0 + 0.15, T0 + 0.45)) * (1 - phase(abs, WALK - 0.4, WALK - 0.1)));
  flash(ctx, 1 - phase(abs, T0, T0 + 0.4), "#0b0d1c");
}

// ---------------------------------------------------------------- 19.05 – 21.13 walking home
function shotWalk(ctx: Ctx, abs: number) {
  const t = abs - T0;
  const [hx, hy, hr] = handheld(abs, 4, 7);
  const step = Math.sin(abs * 14) * 3;
  grade(ctx, GREY, (g) => {
    g.save();
    camera(g, 540, 900, 1.0, hr, hx, hy + step);
    street(g, abs, t * 260);
    g.restore();
    g.save();
    camera(g, 540, 900, 1.02, hr, hx, hy + step);
    drawKid(g, 470, 760, 0.62, {
      body: "full",
      legs: "walk",
      walk: abs * 7,
      eyes: blinkEyes(abs, 3, "sleepy"),
      look: [0.25, 0.9],
      headY: -Math.abs(Math.sin(abs * 7)) * 6,
      arms: "custom",
      handL: [-108, 440],
      handR: [50, 300],
      shapeL: "hold",
      shapeR: "hold",
      grip: (k) => {
        // the little cake box hanging from his left hand
        inkLine(k, [[-112, 452], [-120, 486], [-108, 510]], 2201, 3, "#d9658f");
        shaded(k, () => rr(k, -170, 506, 120, 92, 8), "#f4efe6", () => {
          k.fillStyle = "rgba(255,143,184,0.85)";
          k.fillRect(-120, 506, 18, 92);
          k.fillStyle = "rgba(0,0,0,0.08)";
          k.fillRect(-90, 506, 40, 92);
        }, C.ink, 4);
        // his phone, lit, in the right hand
        k.fillStyle = "#121214";
        k.beginPath();
        k.roundRect(18, 226, 66, 120, 12);
        k.fill();
        k.fillStyle = "#e9eef6";
        k.beginPath();
        k.roundRect(24, 233, 54, 106, 8);
        k.fill();
      },
    });
    glow(g, 470 + 0.62 * 50, 760 + 0.62 * 250, 170, "rgba(170,205,255,0.3)");
    g.restore();
    // his long shadow
    g.save();
    g.globalAlpha = 0.35;
    g.fillStyle = "#000";
    g.beginPath();
    g.ellipse(470 + hx, 1235, 160, 22, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
}

// ---------------------------------------------------------------- 21.13 – 26.87 the class group: sent, failed, deleted
/** Where chatScreen draws the red "!" of my (last, one-line) message, in phone screen units. */
function failMark(ctx: Ctx, keyboard: boolean): Pt {
  const bw = measure(ctx, MSG, 30, F.ui) + 44;
  const inputY = SH - 120 - (keyboard ? 420 : 0);
  const bh = 42 + 36;
  const y = inputY - 40 - bh;
  return [SW - 106 - bw - 34, y + bh / 2];
}

function chat(abs: number) {
  const typing = phase(abs, 54.9, 56.45);
  const sent = abs >= SEND;
  const deleting = phase(abs, 59.55, 59.95);
  const msgs: Msg[] = [
    { from: "班长", text: "明天记得交数学作业", avatar: CAST.monitor, time: "10:12" },
    { from: "大刘", text: "收到", avatar: CAST.a },
  ];
  if (sent && deleting < 1)
    msgs.push({
      me: true,
      text: MSG,
      sending: abs < FAIL ? abs - SEND : 0,
      failed: abs >= FAIL ? easeOut(phase(abs, FAIL, FAIL + 0.2)) : 0,
    });
  const input = sent ? "" : writeOn(MSG, typing);
  const caret = !sent && Math.floor(abs * 3) % 2 === 0;
  return (c: Ctx) => {
    chatScreen(c, { time: "21:53", airplane: true }, "高二(3)班 (46)", msgs, input, caret, { keyboard: abs < 59.0 });
    // long-press menu → 删除
    const menu = phase(abs, 58.95, 59.15) * (1 - phase(abs, 59.5, 59.6));
    if (menu > 0) {
      c.save();
      c.globalAlpha = menu;
      c.fillStyle = "#4c4c4c";
      rr(c, 150, 960, 400, 92, 16);
      c.fill();
      ["复制", "转发", "撤回", "删除"].forEach((label, i) => {
        const hot = label === "删除" && abs > 59.35;
        if (hot) {
          c.fillStyle = "#6a6a6a";
          rr(c, 160 + i * 96, 968, 92, 76, 10);
          c.fill();
        }
        text(c, label, 206 + i * 96, 1006, { size: 28, font: F.ui, fill: hot ? "#ff6b6b" : "#fff" });
      });
      c.restore();
    }
  };
}

/** The red "!" over the grey screen — the only colour in the shot. */
function redMark(ctx: Ctx, abs: number, x: number, y: number, s: number) {
  const k = clamp(easeOut(phase(abs, FAIL, FAIL + 0.2)));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (0.4 + 0.6 * k), s * (0.4 + 0.6 * k));
  glow(ctx, 0, 0, 70, "rgba(240,67,67,0.45)", k);
  ctx.fillStyle = "#f04343";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "!", 0, 1, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
  ctx.restore();
}

function shotChat(ctx: Ctx, abs: number) {
  const zoom = easeIn(phase(abs, FAIL, FAIL + 0.35)) * (1 - smooth(phase(abs, 58.6, 59.0)));
  const [sx, sy] = shake(abs, zoom > 0.9 && abs < FAIL + 0.6 ? 8 : 0);
  const [hx, hy, hr] = handheld(abs, 4, 8);
  const ps = 0.72;
  const [mx, my] = failMark(ctx, true);
  const fx = 540 + (mx - SW / 2) * ps,
    fy = 800 + (my - SH / 2) * ps;
  const view = (c: Ctx) => camera(c, fx, fy, 1 + 0.05 * easeInOut(phase(abs, N2, FAIL)) + zoom * 0.9, hr, sx + hx, sy + hy);
  grade(ctx, GREY, (g) => {
    fillBg(g, "#0f1124");
    glow(g, 540, 800, 900, "rgba(170,200,255,0.25)");
    bokeh(g, abs, 14, 401, 0.7);
    g.save();
    view(g);
    phone(g, 540, 800, ps, 0, chat(abs));
    g.restore();
  });
  if (abs >= FAIL) {
    ctx.save();
    view(ctx);
    redMark(ctx, abs, fx, fy, ps);
    ctx.restore();
  }
  if (abs > FAIL + 0.3 && abs < 58.65) {
    const k = backOut(phase(abs, FAIL + 0.3, FAIL + 0.55));
    ctx.save();
    ctx.translate(760, 470);
    ctx.rotate(0.1);
    ctx.scale(k, k);
    text(ctx, "发送失败", 0, 0, { size: 86, font: F.cn, fill: "#ff4d4d", stroke: "#fff", lw: 14 });
    ctx.restore();
  }
}

function shotDelete(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 8);
  const ps = 0.72;
  grade(ctx, GREY, (g) => {
    fillBg(g, "#0f1124");
    glow(g, 540, 800, 900, "rgba(170,200,255,0.25)");
    bokeh(g, abs, 14, 401, 0.7);
    phone(g, 540 + hx, 800 + hy, ps, hr, chat(abs));
  });
  if (abs < 59.55) {
    const [mx, my] = failMark(ctx, abs < 59.0);
    redMark(ctx, abs, 540 + hx + (mx - SW / 2) * ps, 800 + hy + (my - SH / 2) * ps, ps);
  }
}

// ---------------------------------------------------------------- 26.87 – 29.48 23:58, he lights the candle himself
function shotDesk(ctx: Ctx, abs: number) {
  const lit = smooth(phase(abs, MATCH + 0.15, MATCH + 0.5));
  const reach = smooth(phase(abs, MATCH - 0.5, MATCH - 0.08)) * (1 - smooth(phase(abs, MATCH + 0.4, MATCH + 0.8)));
  const [hx, hy, hr] = handheld(abs, 5, 9);
  const zoom = 1.08 - 0.08 * easeInOut(phase(abs, N3b, N4));
  // his left hand brings the match to the wick (kid units: the wick is at about -190, 145)
  const hand: Pt = [-92 + (-150 + 92) * reach, 396 + (100 - 396) * reach];
  const kid: KidPose = {
    hat: abs > 62.2,
    eyes: blinkEyes(abs, 3, "sleepy"),
    look: reach > 0.3 ? [-0.9, 0.8] : [-0.55, 0.7],
    headY: Math.sin(abs * 1.6) * 3,
    arms: "custom",
    handL: hand,
    handR: [92, 396],
    shapeL: reach > 0.4 ? "hold" : "flat",
    shapeR: "flat",
    grip: reach > 0.2 ? (k) => inkLine(k, [hand, [hand[0] - 40, hand[1] + 38]], 2301, 4, "#d8b07a") : undefined,
  };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, 540, 900, zoom, hr, hx, hy);
    birthdayDesk(c, abs, { lit, kid, phoneOn: 1 - phase(abs, N3b, N3b + 1.2), dark: 0.93, layer, clue: 1 });
    c.restore();
  };
  grade(ctx, GREY, (g) => shot(g, "scene"));
  shot(ctx, "flame");
  // the match flaring at the wick (warm, over the grey)
  if (abs > MATCH - 0.12 && abs < MATCH + 0.6) {
    const f = phase(abs, MATCH - 0.12, MATCH + 0.6);
    ctx.save();
    camera(ctx, 540, 900, zoom, hr, hx, hy);
    glow(ctx, 392, 958, 260, "rgba(255,200,120,0.9)", Math.sin(Math.PI * f));
    ctx.restore();
  }
  card(ctx, "23:58", 70, 330, smooth(phase(abs, N3b + 0.2, N3b + 0.5)));
}

// ---------------------------------------------------------------- 29.48 – 33.66 the wish, blown out
function shotWish(ctx: Ctx, abs: number) {
  const wishWrite = phase(abs, 63.9, 65.0);
  const blow = abs >= BLOW;
  const out = abs >= OUT;
  const smoke = phase(abs, OUT, 67.0);
  const [hx, hy, hr] = handheld(abs, 4, 10);
  const z = 1 + 0.16 * easeInOut(phase(abs, N4, OUT));
  const kid: KidPose = {
    hat: true,
    eyes: abs > 63.6 ? "shut" : blinkEyes(abs, 3, "sleepy"),
    mouth: blow && !out ? "blow" : "frown",
    look: [-0.5, 0.6],
  };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, 520, 860, z, hr, hx, hy);
    birthdayDesk(c, abs, { lit: out ? 0 : 1, smoke: out ? smoke : 0, kid, dark: out ? 0.96 : 0.86, layer, clue: 1 });
    c.restore();
  };
  grade(ctx, GREY, (g) => shot(g, "scene"));
  shot(ctx, "flame");
  if (!out) {
    const a = smooth(phase(abs, N4 + 0.3, N4 + 0.6));
    text(ctx, "许个愿吧", 540, 380, { size: 64, font: F.cn, fill: "#ffe7b0", alpha: a * (1 - phase(abs, 63.7, 63.9)), stroke: C.ink, lw: 10 });
    if (wishWrite > 0) {
      ctx.save();
      ctx.translate(540, 390);
      ctx.rotate(-0.03);
      text(ctx, writeOn("希望…有人记得我", wishWrite), 0, 0, { size: 84, font: F.pen, fill: "#fff3d6", stroke: C.ink, lw: 12 });
      ctx.restore();
    }
  } else {
    // in the dark, the wish lingers and fades
    text(ctx, "希望…有人记得我", 540, 390, { size: 84, font: F.pen, fill: "#fff3d6", alpha: 0.6 * (1 - phase(abs, OUT, 66.8)) });
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < WALK) shotBakery(ctx, abs);
    else if (abs < N2) shotWalk(ctx, abs);
    else if (abs < N3) shotChat(ctx, abs);
    else if (abs < N3b) shotDelete(ctx, abs);
    else if (abs < N4) shotDesk(ctx, abs);
    else shotWish(ctx, abs);
  });
}
