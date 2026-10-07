import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, camera, designScene, fillBg, flash, glow } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { bedBlanket, bedroom, herBlanket, herRoom } from "./lib/places";
import { heart } from "./lib/sets";
import { ChatItem, chatScreen2, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { ASK_AGAIN, GIVE_UP, HER, HER_CONFESSION, HISTORY, hisFaceReading, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { BAR, END, EV } from "./lib/timeline";

/** ACT 4 (49.14 – 57.0s) · the last loop of the outro
 *  4A his face: it sinks in — he grins (on the outro downbeat)
 *  4B he answers 「我也是」 and asks again 「那周末一起去图书馆？」 — 「对方正在输入...」 — this time: 「嗯！！」
 *  4C both of them grinning at their phones (split screen) under the last line 「这一次的「嗯」/ 后面什么都没删」 */

const ME_TOO = "我也是";
const REST_L: FingerPos = { x: 120, y: 1180, touch: 0.2 };
const REST_R: FingerPos = { x: 480, y: 1180, touch: 0.2 };

function replyItems(abs: number): ChatItem[] {
  const items: ChatItem[] = [...HISTORY.slice(-3)];
  items.push({ t: "msg", text: "嗯" });
  items.push({ t: "msg", me: true, text: GIVE_UP });
  items.push({ t: "time", text: "00:58" });
  items.push({ t: "msg", text: HER_CONFESSION });
  if (abs >= EV.send5) items.push({ t: "msg", me: true, text: ME_TOO, pop: pop(abs, EV.send5) });
  if (abs >= EV.send6) items.push({ t: "msg", me: true, text: ASK_AGAIN, pop: pop(abs, EV.send6) });
  if (abs >= EV.um3) items.push({ t: "msg", text: "嗯！！", pop: pop(abs, EV.um3) });
  if (abs >= EV.heart) items.push({ t: "sticker", kind: "heart", pop: pop(abs, EV.heart, 0.25) });
  return items;
}

// ---------------------------------------------------------------- 4B his answer, her 「嗯！！」
function shotReply(ctx: Ctx, abs: number) {
  let draft = "";
  if (abs >= EV.type6[0] && abs < EV.send5) draft = typed(ME_TOO, abs, EV.type6[0], EV.type6[1]);
  else if (abs >= EV.type7[0] && abs < EV.send6) draft = typed(ASK_AGAIN, abs, EV.type7[0], EV.type7[1]);
  const kb = abs < EV.send6 + 0.15;
  const view = { title: HER, time: "07:11", me: "boy" as const, them: "girl" as const, items: replyItems(abs), typing: inWin(abs, EV.typingC), draft, caret: kb, keyboard: kb };
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
  phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy: 880, glowCol: "rgba(255,230,190,0.3)", bg: "#2b2a3a", ...hands });
}

// ---------------------------------------------------------------- 4C both of them
function shotBoth(ctx: Ctx, abs: number) {
  fillBg(ctx, "#0b0d1c");
  const k = smooth(phase(abs, EV.split, EV.split + 0.5));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H / 2);
  ctx.clip();
  ctx.translate(0, -(1 - k) * 80);
  ctx.save();
  camera(ctx, 800, 640, 1.0);
  bedroom(ctx, abs, { dawn: 1 });
  drawKid(ctx, 840, 620, 0.78, { body: "bust", eyes: "happy", mouth: "grin", blush: 0.8, look: [0, 0.9], arms: "phone" });
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
  camera(ctx, 330, 700, 1.0);
  herRoom(ctx, abs, { lights: 0.3, dawn: 1 });
  drawKid(ctx, 320, 700, 0.64, { who: "girl", outfit: "pajamas", body: "full", legs: "sitFloor", eyes: "happy", mouth: "grin", blush: 1, look: [0, 0.9], arms: "phone" });
  herBlanket(ctx);
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, H / 2 - 4, W, 8);
  // a few hearts drifting up across the seam
  for (let i = 0; i < 5; i++) {
    const t = ((abs - EV.split) * 0.6 + i * 0.2) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - t) * k;
    heart(ctx, 200 + i * 170 + Math.sin(i * 1.7 + abs) * 30, H / 2 + 120 - t * 300, 16 + (i % 3) * 6, "#ff7fa8", 4010 + i);
    ctx.restore();
  }
  flash(ctx, phase(abs, END - 0.6, END), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(24), (ctx, abs) => {
    if (abs < EV.reply) hisFaceReading(ctx, abs);
    else if (abs < EV.split) shotReply(ctx, abs);
    else shotBoth(ctx, abs);
  });
}
