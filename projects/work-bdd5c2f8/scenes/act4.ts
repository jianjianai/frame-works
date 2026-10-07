import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, backOut, beatAt, camera, card, designScene, easeIn, easeInOut, easeOut, fillBg, flash, glow, handheld, rr, shake, text, writeOn } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST } from "./lib/people";
import { Msg, chatScreen, phone } from "./lib/phone";
import { bokeh, street } from "./lib/sets";
import { birthdayDesk } from "./lib/shared";

/** ACT 4 (song 50.48 – 67.05 = work 17.08 – 33.66; this act still draws in song time, its layer sits 33.39 s earlier):
 *  walking home, reading the class group; "其实…今天是我生日" fails to send (red !); back at the desk he makes a wish and
 *  blows the candle out — the loop closes on the cold open. 重置版: send / fail / the match / the cut to the desk are on
 *  the eighth-note grid. */
const T0 = 50.475;
const N2 = beatAt(104); // 54.53
const N3 = beatAt(112); // 58.70
const N3b = beatAt(115); // 60.27 the desk
const N4 = beatAt(120); // 62.87
const END = beatAt(128); // 67.05

const MSG = "其实…今天是我生日";
const SEND = beatAt(108); // 56.61
const FAIL = beatAt(109.5); // 57.40 the red !
const MATCH = beatAt(117); // 61.31 he strikes the match

function shotWalk(ctx: Ctx, abs: number) {
  const t = abs - T0;
  // tracking with him: the street's layers slide past at their own speeds (sets.street); the camera is hand-held and
  // bobs a little with his steps
  const [hx, hy, hr] = handheld(abs, 4, 7);
  const step = Math.sin(abs * 14) * 3;
  ctx.save();
  camera(ctx, 540, 900, 1.0, hr, hx, hy + step);
  street(ctx, abs, t * 260);
  ctx.restore();
  ctx.save();
  camera(ctx, 540, 900, 1.02, hr, hx, hy + step);
  drawKid(ctx, 470, 760, 0.62, {
    body: "full",
    legs: "walk",
    walk: abs * 7,
    eyes: "sleepy",
    look: [0, 0.8],
    headY: -Math.abs(Math.sin(abs * 7)) * 6,
    // head down over his phone (the class group he is about to write in), not just walking
    arms: "phone",
    holding: (c) => {
      c.fillStyle = "#121214";
      c.beginPath();
      c.roundRect(-36, 236, 72, 128, 14);
      c.fill();
      c.fillStyle = "#cfe3ff";
      c.beginPath();
      c.roundRect(-29, 244, 58, 112, 9);
      c.fill();
    },
  });
  glow(ctx, 470, 760 + 0.62 * 210, 220, "rgba(170,205,255,0.32)");
  ctx.restore();
  // his long shadow
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(470, 1235, 160, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  card(ctx, "21:52 · 回家的路上", 70, 330, smooth(phase(abs, T0 + 0.2, T0 + 0.5)) * (1 - phase(abs, N2 - 0.4, N2 - 0.1)));
  flash(ctx, 1 - phase(abs, T0, T0 + 0.5), "#0b0d1c");
}

function chat(ctx: Ctx, abs: number) {
  const typing = phase(abs, 54.9, 56.45);
  const sent = abs >= SEND;
  const deleting = phase(abs, 59.55, 59.95);
  const msgs: Msg[] = [
    { from: "班长", text: "明天记得交数学作业", avatar: CAST.monitor },
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
    chatScreen(c, { time: "23:56", airplane: true }, "高二(3)班 (46)", msgs, input, caret, { keyboard: abs < 59.0 });
    // long-press menu → delete
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

function shotChat(ctx: Ctx, abs: number) {
  const zoom = easeIn(phase(abs, FAIL, FAIL + 0.35)) * (1 - smooth(phase(abs, 58.6, 59.0)));
  const [sx, sy] = shake(abs, zoom > 0.9 && abs < FAIL + 0.6 ? 8 : 0);
  fillBg(ctx, "#0f1124");
  glow(ctx, 540, 800, 900, "rgba(170,200,255,0.25)");
  bokeh(ctx, abs, 14, 401, 0.7);
  ctx.save();
  // the red "!" — (rewatch: it failed because airplane mode is on)
  const [hx, hy, hr] = handheld(abs, 4, 8);
  camera(ctx, 432, 1010, 1 + 0.05 * easeInOut(phase(abs, N2, FAIL)) + zoom * 0.9, hr, sx + hx, sy + hy);
  phone(ctx, 540, 800, 0.72, 0, chat(ctx, abs));
  ctx.restore();
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
  if (abs < N3b) {
    const [hx, hy, hr] = handheld(abs, 4, 8);
    fillBg(ctx, "#0f1124");
    glow(ctx, 540, 800, 900, "rgba(170,200,255,0.25)");
    bokeh(ctx, abs, 14, 401, 0.7);
    phone(ctx, 540 + hx, 800 + hy, 0.72, hr, chat(ctx, abs));
  } else {
    // he drops the phone on the desk and lights the candle himself
    const lit = smooth(phase(abs, MATCH + 0.15, MATCH + 0.5));
    const hatDrop = easeOut(phase(abs, 62.2, 62.5));
    ctx.save();
    const [hx, hy, hr] = handheld(abs, 5, 9);
    camera(ctx, 540, 900, 1.08 - 0.08 * easeInOut(phase(abs, N3b, N4)), hr, hx, hy);
    birthdayDesk(ctx, abs, {
      lit,
      kid: { hat: hatDrop > 0, headY: -(1 - hatDrop) * 0 + Math.sin(abs * 1.6) * 3, eyes: "sleepy" },
      phoneOn: 1 - phase(abs, N3b, N3b + 1.2),
      dark: 0.93,
    });
    ctx.restore();
    // match flare
    if (abs > MATCH && abs < MATCH + 0.55) {
      const f = phase(abs, MATCH, MATCH + 0.55);
      glow(ctx, 390, 920, 300, "rgba(255,200,120,0.9)", 1 - f);
    }
    card(ctx, "23:58", 70, 330, smooth(phase(abs, N3b + 0.2, N3b + 0.5)));
  }
}

function shotWish(ctx: Ctx, abs: number) {
  const wishWrite = phase(abs, 63.9, 65.0);
  const blow = abs >= 65.25;
  const out = abs >= 65.6;
  const smoke = phase(abs, 65.6, 67.0);
  const [hx, hy, hr] = handheld(abs, 4, 10);
  ctx.save();
  camera(ctx, 520, 860, 1 + 0.16 * easeInOut(phase(abs, N4, 65.6)), hr, hx, hy);
  birthdayDesk(ctx, abs, {
    lit: out ? 0 : 1,
    smoke: out ? smoke : 0,
    kid: { eyes: abs > 63.6 ? "shut" : "sleepy", mouth: blow && !out ? "blow" : "frown", look: [-0.5, 0.6] },
    dark: out ? 0.96 : 0.86,
  });
  ctx.restore();
  // the wish, handwritten
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
    // in the dark, the wish text lingers and fades
    text(ctx, "希望…有人记得我", 540, 390, { size: 84, font: F.pen, fill: "#fff3d6", alpha: 0.6 * (1 - phase(abs, 65.6, 66.8)) });
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < N2) shotWalk(ctx, abs);
    else if (abs < N3) shotChat(ctx, abs);
    else if (abs < N4) shotDelete(ctx, abs);
    else shotWish(ctx, abs);
  });
}
