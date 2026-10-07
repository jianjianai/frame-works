import { clamp, phase, smooth } from "../../../../src/engine/math";
import { C, Ctx, Pt, camera, fillBg, glow, hash } from "./draw";
import { drawKid } from "./kid";
import { heart } from "./sets";
import { ChatItem, ChatView, chatScreen2 } from "./chat";
import { FingerPos, HandsLook, heldHands } from "./hand";
import { phone } from "./phone";
import { EV } from "./timeline";

/** 《unhappy》· 同一段聊天两个视角 — the words on both phones, and helpers shared by the acts. */

export const HIM = "周屿";
export const HER = "林夏";
export const HIS_LONG = "今天那道物理大题我想了一晚上，终于做出来了！明天讲给你听？对了，明天降温，记得多穿点，别又感冒了";
export const HIS_DRAFT = "林夏，我是不是哪里惹你不开心了？我们以前不是这样的……";
export const GIVE_UP = "以后不打扰你了";
export const HER_REPLY_DRAFT = "哇！！你也太厉害了吧！！明天一定要讲给我听！还有你也要多穿点，别光顾着说我";
export const HER_NIGHT_DRAFT = "才不是这样的！！我每天都在等你的消息，每次都写了好多好多，又怕你嫌我烦，就全删了。其实我……";
export const HER_CONFESSION = "才不是这样的。我每天都在等你的消息，每次都写了好多好多，又怕你嫌我烦，就全删了。其实，我喜欢你，很久很久了。";
export const ASK_AGAIN = "那周末一起去图书馆？";
export const FRIEND_ADVICE = "别回太快！回个嗯就行，显得你没那么在意";

/** three months of chatting: long and lively in July, short by October */
export const HISTORY: ChatItem[] = [
  { t: "time", text: "7月12日 23:41" },
  { t: "msg", text: "哈哈哈哈哈哈哈你也太好笑了吧！！" },
  { t: "msg", me: true, text: "真的！我当时差点笑出声，老师还看了我一眼" },
  { t: "msg", text: "明天我也要去！！带我一个！" },
  { t: "voice", secs: 52 },
  { t: "msg", text: "对了我最喜欢草莓牛奶了，记住！！" },
  { t: "sticker", me: true, kind: "cat" },
  { t: "time", text: "8月20日 00:13" },
  { t: "msg", text: "你睡了吗？我睡不着" },
  { t: "msg", me: true, text: "没睡，在想你说的那部电影" },
  { t: "msg", text: "那我们周末一起看吧～" },
  { t: "time", text: "9月18日 22:30" },
  { t: "msg", me: true, text: "你今天是不是不开心？" },
  { t: "msg", text: "没有啦" },
  { t: "time", text: "10月6日 23:05" },
  { t: "msg", me: true, text: "周末要不要一起去图书馆？" },
  { t: "msg", text: "嗯" },
  { t: "msg", me: true, text: "那家草莓牛奶出新口味了！" },
  { t: "msg", text: "哦" },
  { t: "time", text: "23:12" },
  { t: "msg", me: true, text: HIS_LONG },
];

/** flip `me` so the same conversation reads from her phone */
export const fromHer = (items: ChatItem[]): ChatItem[] =>
  items.map((it) => (it.t === "time" ? it : { ...it, me: !it.me }));

export const typed = (s: string, abs: number, t0: number, t1: number) => {
  const ch = Array.from(s);
  return ch.slice(0, Math.round(clamp((abs - t0) / (t1 - t0)) * ch.length)).join("");
};
export const deleted = (s: string, abs: number, t0: number, t1: number) => {
  const ch = Array.from(s);
  return ch.slice(0, Math.round((1 - clamp((abs - t0) / (t1 - t0))) * ch.length)).join("");
};
export const inWin = (abs: number, w: readonly [number, number]) => abs >= w[0] && abs < w[1];

/** pop-in progress for something that appears at t */
export const pop = (abs: number, t: number, d = 0.18) => clamp((abs - t) / d);

/** Thumbs tapping keys during [t0, t1] (alternating), resting otherwise. Screen coordinates. */
export function typingThumbs(abs: number, t0: number, t1: number, seed = 1): { right: FingerPos; left: FingerPos } {
  const restR: FingerPos = { x: 480, y: 1180, touch: 0.2 },
    restL: FingerPos = { x: 120, y: 1180, touch: 0.2 };
  if (abs < t0 || abs > t1) return { right: restR, left: restL };
  const rate = 9; // taps per second
  const k = Math.floor((abs - t0) * rate);
  const f = (abs - t0) * rate - k;
  const key = (n: number): Pt => [70 + hash(seed + n * 3.1) * 460, 900 + hash(seed + n * 5.7) * 260];
  const [kx, ky] = key(k);
  const tap: FingerPos = { x: kx, y: ky, touch: f < 0.45 ? 1 : 0.35 };
  const rightTurn = k % 2 === 0 ? kx > 260 : kx > 340;
  return rightTurn ? { right: tap, left: restL } : { right: restR, left: tap };
}

export const HER_HANDS: HandsLook = { sleeve: "#f3b6c4", cuff: "#fff4f6", skin: "#f6e1c3", specks: 0.15 };
export const HIS_HANDS: HandsLook = {};

/** A phone held up close with both thumbs, over a dim room glow. */
export function phoneCloseup(
  ctx: Ctx,
  abs: number,
  screen: (c: Ctx) => void,
  o: { who?: "boy" | "girl"; right?: FingerPos; left?: FingerPos; cx?: number; cy?: number; s?: number; rot?: number; bg?: string; glowCol?: string } = {},
) {
  const cx = o.cx ?? 540,
    cy = o.cy ?? 900,
    s = o.s ?? 0.68,
    rot = o.rot ?? -0.02;
  fillBg(ctx, o.bg ?? "#0b0d1c");
  glow(ctx, cx, cy - 60, 900, o.glowCol ?? "rgba(120,150,255,0.26)");
  phone(ctx, cx, cy, s, rot, screen);
  heldHands(ctx, cx, cy, s, rot, o.right ?? { x: 480, y: 1180, touch: 0.2 }, o.left ?? { x: 120, y: 1180, touch: 0.2 }, 1300, o.who === "girl" ? HER_HANDS : HIS_HANDS);
}

/** Rain-like drops on the phone glass (her tears) in screen coordinates. */
export function tearDrops(c: Ctx, abs: number, t0: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.45;
    if (abs < t) continue;
    const k = clamp((abs - t) / 0.2);
    const x = 140 + hash(i * 7.1) * 320,
      y = 420 + hash(i * 3.3) * 420;
    c.save();
    c.globalAlpha = 0.55;
    c.fillStyle = "rgba(200,225,255,0.5)";
    c.beginPath();
    c.ellipse(x, y, 22 * k, 18 * k, 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.8)";
    c.beginPath();
    c.ellipse(x - 6, y - 6, 5 * k, 4 * k, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

/** his phone at night, given the moment */
export function hisNightChat(abs: number, extra: Partial<ChatView> = {}): ChatView {
  const items: ChatItem[] = [...HISTORY];
  if (abs >= EV.um1) items.push({ t: "msg", text: "嗯", pop: pop(abs, EV.um1) });
  if (abs >= EV.send1) items.push({ t: "msg", me: true, text: GIVE_UP, pop: pop(abs, EV.send1) });
  return { title: HER, time: abs < 20 ? "23:12" : "00:47", me: "boy", them: "girl", items, dark: true, ...extra };
}
/** his face as her message sinks in: shock (from EV.read), then joy on the outro downbeat (EV.joy).
 *  Drawn by act 3 and act 4 so the shot runs across the layer boundary. */
export function hisFaceReading(ctx: Ctx, abs: number) {
  const k = phase(abs, EV.joy - 0.05, EV.joy + 0.3);
  fillBg(ctx, "#f1e4d2");
  ctx.save();
  camera(ctx, 540, 860, 1.0 + 0.07 * smooth(phase(abs, EV.read, EV.reply)));
  glow(ctx, 540, 1100, 800, `rgba(255,240,200,${0.45 + 0.25 * k})`);
  drawKid(ctx, 540, 880, 1.3, { body: "bust", eyes: k < 0.3 ? "wide" : "happy", mouth: k < 0.3 ? "o" : "grin", blush: k, look: [0, 0.6], arms: "phone", tears: k > 0.5 ? 0.25 : 0 });
  ctx.restore();
  if (k <= 0) return;
  for (let i = 0; i < 6; i++) {
    const t = ((abs - EV.joy) * 0.8 + i * 0.17) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - t) * clamp((abs - EV.joy) * 5);
    heart(ctx, 540 + Math.sin(i * 2.1) * 330, 700 - t * 320, 20 + (i % 3) * 8, "#ff7fa8", 3930 + i);
    ctx.restore();
  }
}
export const phase01 = phase;
export { C };
