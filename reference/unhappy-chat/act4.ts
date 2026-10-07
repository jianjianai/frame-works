import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, camera, designScene, fillBg, flash, glow, pulse } from "./lib/draw";
import { bedBlanket, bedroom, herBlanket, herRoom } from "./lib/places";
import { heart } from "./lib/sets";
import { ChatItem, chatScreen2, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { ASK_AGAIN, HER, HIM, PHONE_CY, PHONE_S, REST_L, REST_R, HISTORY, afterNight, fromHer, herRoomAt, hisFaceReading, hisRoomMorning, hugJoy, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { HER_WIN, HIS_WIN, street, winC } from "./lib/street";
import { BAR, END, EV } from "./lib/timeline";

/** ACT 4 (49.14 – 57.0s) · the last loop of the outro
 *  4A his face: it sinks in — then on the downbeat he beams (story.hisFaceReading, from act 3)
 *  4B he answers 「我也是」 and asks 「那周末一起去图书馆？」, the camera nudging in with each one
 *  4C her phone: this time we see who is typing — she types 「嗯！！」 and sends it straight away, nothing deleted
 *  4D his phone: 「嗯！！」 lands (the hook's yellow pulses again) and a heart
 *  4E both of them, a pillow each, rocking with joy (split screen) under 「这一次的「嗯」/ 后面什么都没删」
 *  4F the street in the morning sun: the camera pulls back from the two windows, hearts drifting between them */

const ME_TOO = "我也是";
const UM = "嗯！！";
/** she sends 「嗯！！」 just before his phone gets it */
const HER_SEND = EV.herTypes[1] - 0.08;

function hisItems(abs: number): ChatItem[] {
  const items: ChatItem[] = [...HISTORY.slice(-3), ...afterNight("his")];
  items.push({ t: "time", text: "07:11" });
  if (abs >= EV.send5) items.push({ t: "msg", me: true, text: ME_TOO, pop: pop(abs, EV.send5) });
  if (abs >= EV.send6) items.push({ t: "msg", me: true, text: ASK_AGAIN, pop: pop(abs, EV.send6) });
  if (abs >= EV.um3) items.push({ t: "msg", text: UM, pop: pop(abs, EV.um3) });
  if (abs >= EV.heart) items.push({ t: "sticker", kind: "heart", pop: pop(abs, EV.heart, 0.25) });
  return items;
}

// ---------------------------------------------------------------- 4B his answer
function shotReply(ctx: Ctx, abs: number) {
  let draft = "";
  if (abs >= EV.type6[0] && abs < EV.send5) draft = typed(ME_TOO, abs, EV.type6[0], EV.type6[1]);
  else if (abs >= EV.type7[0] && abs < EV.send6) draft = typed(ASK_AGAIN, abs, EV.type7[0], EV.type7[1]);
  const kb = abs < EV.send6 + 0.15;
  const view = { title: HER, time: "07:11", me: "boy" as const, them: "girl" as const, items: hisItems(abs), typing: inWin(abs, EV.typingC), draft, caret: kb, keyboard: kb };
  let hands = { right: REST_R, left: REST_L };
  if (inWin(abs, EV.type6)) hands = typingThumbs(abs, EV.type6[0], EV.type6[1], 61);
  else if (inWin(abs, EV.type7)) hands = typingThumbs(abs, EV.type7[0], EV.type7[1], 71);
  else {
    // thumb on the send button for each message
    for (const [t1, send, text] of [[EV.type6[1], EV.send5, ME_TOO], [EV.type7[1], EV.send6, ASK_AGAIN]] as const)
      if (abs >= t1 && abs < send + 0.12) {
        const sb = sendButtonAt(ctx, { ...view, draft: text });
        hands = { right: { x: sb[0], y: sb[1] + (abs < send - 0.06 ? 30 : 0), touch: abs > send - 0.06 ? 1 : 0.1 }, left: REST_L };
      }
  }
  // each message he sends gives the camera a little push, and it creeps closer all the while
  const bump = Math.max(...[EV.send5, EV.send6].map((t) => (abs >= t ? Math.exp(-(abs - t) * 7) : 0)));
  const s = PHONE_S * (1 + 0.05 * smooth(phase(abs, EV.reply, EV.herTypes[0])) + 0.035 * bump);
  phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy: PHONE_CY + 40 * (s - PHONE_S), s, glowCol: "rgba(255,230,190,0.3)", bg: "#2b2a3a", ...hands });
}

// ---------------------------------------------------------------- 4C her phone
function shotHerTypes(ctx: Ctx, abs: number) {
  const [t0] = EV.herTypes;
  const items: ChatItem[] = [...fromHer(HISTORY.slice(-3)), ...afterNight("hers")];
  items.push({ t: "time", text: "07:11" });
  items.push({ t: "msg", text: ME_TOO });
  items.push({ t: "msg", text: ASK_AGAIN });
  if (abs >= HER_SEND) items.push({ t: "msg", me: true, text: UM, pop: pop(abs, HER_SEND) });
  const draft = abs < HER_SEND ? typed(UM, abs, t0 + 0.06, t0 + 0.36) : "";
  const view = { title: HIM, time: "07:11", me: "girl" as const, them: "boy" as const, items, draft, caret: abs < HER_SEND, keyboard: true, sendHot: abs > HER_SEND - 0.08 && abs < HER_SEND ? 1 : 0 };
  let hands: { right: FingerPos; left: FingerPos } = { right: REST_R, left: REST_L };
  if (abs < t0 + 0.38) hands = typingThumbs(abs, t0 + 0.06, t0 + 0.36, 81);
  else if (abs < HER_SEND + 0.1) {
    const sb = sendButtonAt(ctx, { ...view, draft: UM });
    hands = { right: { x: sb[0], y: sb[1] + (abs < HER_SEND - 0.06 ? 24 : 0), touch: abs > HER_SEND - 0.06 ? 1 : 0.2 }, left: REST_L };
  }
  phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "girl", cy: PHONE_CY, s: PHONE_S * 1.04, glowCol: "rgba(255,170,200,0.32)", bg: "#3a2a3e", ...hands });
}

// ---------------------------------------------------------------- 4D his phone: 「嗯！！」
function shotGotIt(ctx: Ctx, abs: number) {
  const view = { title: HER, time: "07:11", me: "boy" as const, them: "girl" as const, items: hisItems(abs), dark: false };
  const z = smooth(phase(abs, EV.um3, EV.split));
  const s = PHONE_S * (1.05 + 0.12 * z);
  const cy = PHONE_CY + 40 * (s - PHONE_S) - 120 * z;
  phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy, s, steady: true, glowCol: "rgba(255,230,190,0.34)", bg: "#2b2a3a" });
  // the same yellow pulses as when he got her 37th 「嗯」 in the hook, round the new one (screen ≈ 200, 1090)
  const bx = 540 + (200 - 300) * s,
    by = cy + (1090 - 640) * s;
  for (const t of [EV.um3 + 0.02, EV.um3 + 0.2]) {
    const k = phase(abs, t, t + 0.4);
    if (k <= 0 || k >= 1 || abs > EV.heart) continue;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(bx, by, (90 + 80 * k) * s, (50 + 40 * k) * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (abs > EV.um3) glow(ctx, bx, by, 220 * s, `rgba(255,209,102,${0.25 * pulse(abs, 5)})`);
}

// ---------------------------------------------------------------- 4E both of them
function shotBoth(ctx: Ctx, abs: number) {
  fillBg(ctx, "#0b0d1c");
  const k = smooth(phase(abs, EV.split, EV.split + 0.5));
  const push = smooth(phase(abs, EV.split, EV.outside));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H / 2);
  ctx.clip();
  ctx.translate(0, -(1 - k) * 80);
  ctx.save();
  camera(ctx, 820, 700, 1.0 + 0.08 * push);
  bedroom(ctx, abs, { dawn: 1 });
  hugJoy(ctx, abs, "boy", 830, 640, 0.72);
  bedBlanket(ctx);
  glow(ctx, 840, 900, 500, "rgba(255,230,190,0.3)");
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, H / 2, W, H / 2);
  ctx.clip();
  ctx.translate(0, H / 2 - 520 + (1 - k) * 80);
  ctx.save();
  camera(ctx, 330, 720, 1.0 + 0.08 * push);
  herRoom(ctx, abs, { lights: 0.3, dawn: 1 });
  hugJoy(ctx, abs, "girl", 320, 700, 0.64);
  herBlanket(ctx);
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, H / 2 - 4, W, 8);
  // hearts drifting up across the seam
  for (let i = 0; i < 6; i++) {
    const t = ((abs - EV.split) * 0.6 + i * 0.17) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - t) * k;
    heart(ctx, 160 + i * 150 + Math.sin(i * 1.7 + abs) * 30, H / 2 + 120 - t * 300, 16 + (i % 3) * 6, "#ff7fa8", 4010 + i);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 4F the street in the morning
/** the same street as the night his light went out — now both windows catch the sun; inside, each of them grinning at
 *  a phone; the camera pulls back while hearts drift out of both windows and meet over the street */
function shotOutside(ctx: Ctx, abs: number) {
  const p = smooth(phase(abs, EV.outside, END));
  // both windows in the frame from the start (they span x 150–792), between the caption and the rewatch card
  const Z = 1.45 - 0.35 * p;
  const cam: [number, number] = [471, 1060 - 40 * p];
  street(ctx, abs, cam, Z, {
    day: 1,
    hisLit: false,
    herLit: false,
    hisRoom: (k) => hisRoomMorning(k, abs, 1, "grin"),
    herRoom: (k) => herRoomAt(k, abs, 1, "grin"),
  });
  const toScreen = ([x, y]: [number, number]): [number, number] => [540 + (x - cam[0]) * Z, 960 + (y - cam[1]) * Z];
  const a = toScreen(winC(HIS_WIN)),
    b = toScreen(winC(HER_WIN));
  for (let i = 0; i < 8; i++) {
    const from = i % 2 ? b : a;
    const t = ((abs - EV.outside) * 0.55 + i * 0.13) % 1;
    const mx = (a[0] + b[0]) / 2,
      my = Math.min(a[1], b[1]) - 260 * Z * 0.5;
    const x = from[0] + (mx - from[0]) * t + Math.sin(i * 2.3 + abs * 3) * 14,
      y = from[1] + (my - from[1]) * t - Math.sin(Math.PI * t) * 80;
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * t) * smooth(phase(abs, EV.outside, EV.outside + 0.3));
    heart(ctx, x, y, (12 + (i % 3) * 5) * Math.max(1, Z * 0.6), "#ff7fa8", 4030 + i);
    ctx.restore();
  }
  flash(ctx, phase(abs, END - 0.6, END), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(24), (ctx, abs) => {
    if (abs < EV.reply) hisFaceReading(ctx, abs);
    else if (abs < EV.herTypes[0]) shotReply(ctx, abs);
    else if (abs < EV.herTypes[1]) shotHerTypes(ctx, abs);
    else if (abs < EV.split) shotGotIt(ctx, abs);
    else if (abs < EV.outside) shotBoth(ctx, abs);
    else shotOutside(ctx, abs);
  });
}
