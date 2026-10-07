import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { Ctx, designScene, flash, glow, pulse } from "./lib/draw";
import { heart } from "./lib/sets";
import { ChatItem, bubbleAt, chatScreen2, sendButtonAt } from "./lib/chat";
import { ASK_AGAIN, HER, PHONE_CY, PHONE_S, REST_L, REST_R, HISTORY, afterNight, herRoomAt, hisFaceReading, hisRoomMorning, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { HER_WIN, HIS_WIN, street, winC } from "./lib/street";
import { BAR, END, EV } from "./lib/timeline";

/** ACT 4 (49.14 – 57.0s) · the last loop of the outro
 *  4A his face: it sinks in — then on the downbeat he beams (story.hisFaceReading, from act 3)
 *  4B his phone, one shot with no cutaways: he answers 「我也是」, asks 「那周末一起去图书馆？」, 「对方正在输入...」 comes
 *     up and this time an answer lands — 「嗯！！」 (the hook's yellow pulses again) and a heart
 *  4E the street in the morning sun, to the end: the camera pulls back from the two windows, hearts drifting between
 *     them, under 「这一次的「嗯」/ 后面什么都没删」 (the split screen that used to come first was cut) */

const ME_TOO = "我也是";
const UM = "嗯！！";

function hisItems(abs: number): ChatItem[] {
  const items: ChatItem[] = [...HISTORY.slice(-3), ...afterNight("his")];
  items.push({ t: "time", text: "07:11" });
  if (abs >= EV.send5) items.push({ t: "msg", me: true, text: ME_TOO, pop: pop(abs, EV.send5) });
  if (abs >= EV.send6) items.push({ t: "msg", me: true, text: ASK_AGAIN, pop: pop(abs, EV.send6) });
  if (abs >= EV.um3) items.push({ t: "msg", text: UM, pop: pop(abs, EV.um3) });
  if (abs >= EV.heart) items.push({ t: "sticker", kind: "heart", pop: pop(abs, EV.heart, 0.25) });
  return items;
}

// ---------------------------------------------------------------- 4B his phone, one continuous shot
/** 49.91 → 54.76: no cutaways — he sends 「我也是」 and 「那周末一起去图书馆？」, 「对方正在输入...」 comes up (this time it
 *  ends in an answer), 「嗯！！」 lands with the hook's yellow pulses, then a heart. The keyboard stays up throughout so
 *  the conversation never jumps; the camera creeps in, nudges with every message, and settles on the newest ones. */
function shotChat(ctx: Ctx, abs: number) {
  let draft = "";
  if (abs >= EV.type6[0] && abs < EV.send5) draft = typed(ME_TOO, abs, EV.type6[0], EV.type6[1]);
  else if (abs >= EV.type7[0] && abs < EV.send6) draft = typed(ASK_AGAIN, abs, EV.type7[0], EV.type7[1]);
  const view = { title: HER, time: "07:11", me: "boy" as const, them: "girl" as const, items: hisItems(abs), typing: inWin(abs, EV.typingC), draft, caret: true, keyboard: true };
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
  // camera: creeps in; a nudge with every message sent or received; once her answer is in, it settles lower on the
  // newest messages (screen y ≈ 560, just above the input bar) — there are no lyrics in the outro to keep clear of
  const bump = Math.max(...[EV.send5, EV.send6, EV.um3, EV.heart].map((t) => (abs >= t ? Math.exp(-(abs - t) * 7) : 0)));
  const settle = smooth(phase(abs, EV.um3, EV.um3 + 0.6));
  const s = PHONE_S * (1 + 0.05 * smooth(phase(abs, EV.reply, EV.um3)) + 0.12 * settle + 0.035 * bump);
  const ay = 640 - 80 * settle,
    py = PHONE_CY + 40 * (s - PHONE_S) * (1 - settle) + (900 - PHONE_CY) * settle;
  const cx = 540,
    cy = py - (ay - 640) * s;
  phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cx, cy, s, steady: true, glowCol: "rgba(255,230,190,0.32)", bg: "#2b2a3a", ...hands });
  const at = (x: number, y: number): [number, number] => [cx + (x - 300) * s, cy + (y - 640) * s];
  // 「对方正在输入...」 in the title: a soft yellow glow and one ring, like the clue he missed that night
  if (inWin(abs, EV.typingC)) {
    const [tx, ty] = at(293, 95);
    const on = smooth(phase(abs, EV.typingC[0], EV.typingC[0] + 0.12));
    glow(ctx, tx, ty, 190 * s, `rgba(255,209,102,${0.3 * on})`);
    const k = phase(abs, EV.typingC[0] + 0.02, EV.typingC[0] + 0.47);
    if (k > 0 && k < 1) ring(ctx, tx, ty, (150 + 90 * k) * s, (40 + 34 * k) * s, 1 - k);
  }
  if (abs < EV.um3) return;
  // 「嗯！！」: the same yellow pulses as when he got her 37th 「嗯」 in the hook — measured, so they sit on it (and
  // follow it up when the heart arrives)
  const b = bubbleAt(ctx, view, view.items.findIndex((it) => it.t === "msg" && it.text === UM));
  if (!b) return;
  const [bx, by] = at(b.x + b.w / 2, b.y + b.h / 2);
  for (const t of [EV.um3 + 0.02, EV.um3 + 0.22]) {
    const k = phase(abs, t, t + 0.42);
    if (k > 0 && k < 1) ring(ctx, bx, by, (b.w / 2 + 30 + 70 * k) * s, (b.h / 2 + 18 + 40 * k) * s, 1 - k);
  }
  glow(ctx, bx, by, 220 * s, `rgba(255,209,102,${0.25 * pulse(abs, 5)})`);
}

/** the video's yellow "look here" ring */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- 4E the street in the morning
/** the same street as the night his light went out — now both windows catch the sun; inside, each of them grinning at
 *  a phone; the camera pulls back while hearts drift out of both windows and meet over the street */
function shotOutside(ctx: Ctx, abs: number) {
  const p = smooth(phase(abs, EV.outside, END));
  // both windows in the frame from the start (they span x 150–792), between the caption and the rewatch card
  const Z = 1.5 - 0.4 * p;
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
    else if (abs < EV.outside) shotChat(ctx, abs);
    else shotOutside(ctx, abs);
  });
}
