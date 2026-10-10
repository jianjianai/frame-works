import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, backOut, beatAt, camera, card, designScene, easeIn, easeOut, fillBg, flash, glow, rr, shake, text, writeOn } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { CAST } from "@materials/s0rrow/code/people";
import { Msg, chatScreen, phone } from "@materials/s0rrow/code/phone";
import { street } from "@materials/s0rrow/code/sets";
import { birthdayDesk } from "@materials/s0rrow/code/shared";

/** ACT 4 (50.48 – 67.05s): walking home; "其实…今天是我生日" fails to send (red !);
 *  back at the desk he makes a wish and blows the candle out — the loop closes on the cold open. */
const T0 = 50.475;
const N2 = beatAt(104); // 54.53
const N3 = beatAt(112); // 58.70
const N3b = 60.35;
const N4 = beatAt(120); // 62.87
const END = beatAt(128); // 67.05

const MSG = "其实…今天是我生日";
const SEND = 56.75;
const FAIL = 57.55;

function shotWalk(ctx: Ctx, abs: number) {
  const t = abs - T0;
  street(ctx, abs, t * 260);
  ctx.save();
  camera(ctx, 540, 900, 1.02);
  drawKid(ctx, 470, 760, 0.62, {
    body: "full",
    legs: "walk",
    walk: abs * 7,
    eyes: "sleepy",
    look: [0, 0.8],
    headY: -Math.abs(Math.sin(abs * 7)) * 6,
  });
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
  ctx.save();
  // the red "!" — (rewatch: it failed because airplane mode is on)
  camera(ctx, 432, 1010, 1 + zoom * 0.9, 0, sx, sy);
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
    fillBg(ctx, "#0f1124");
    glow(ctx, 540, 800, 900, "rgba(170,200,255,0.25)");
    phone(ctx, 540, 800, 0.72, 0, chat(ctx, abs));
  } else {
    // he drops the phone on the desk and lights the candle himself
    const lit = smooth(phase(abs, 61.35, 61.7));
    const hatDrop = easeOut(phase(abs, 62.2, 62.5));
    ctx.save();
    camera(ctx, 540, 900, 1.06 - 0.06 * smooth(phase(abs, N3b, N4)));
    birthdayDesk(ctx, abs, {
      lit,
      kid: { hat: hatDrop > 0, headY: -(1 - hatDrop) * 0 + Math.sin(abs * 1.6) * 3, eyes: "sleepy" },
      phoneOn: 1 - phase(abs, N3b, N3b + 1.2),
      dark: 0.93,
    });
    ctx.restore();
    // match flare
    if (abs > 61.2 && abs < 61.75) {
      const f = phase(abs, 61.2, 61.75);
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
  ctx.save();
  camera(ctx, 520, 860, 1 + 0.12 * smooth(phase(abs, N4, 65.6)));
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
