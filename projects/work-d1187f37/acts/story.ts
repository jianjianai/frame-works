// 《unhappy》· 同一段聊天两个视角：两部手机上的字、聊天记录、打字删字和拇指的动作（屏幕坐标 600×1280），几幕共用。
// 画面（房间、人物、手机镜头）在 world.ts / shots.ts。
import { clamp, phase, smooth } from "@frame/engine/math";
import { Ctx, Pt, hash } from "@materials/s0rrow/code/draw";
import { strawberryMilk } from "@materials/s0rrow/code/places";
import { ChatItem, ChatView, homeScreen } from "@materials/s0rrow/code/chat";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { EV } from "./timeline";

export const HIM = "周屿";
export const HER = "林夏";
export const HIS_LONG = "今天那道物理大题我想了一晚上，终于做出来了！明天讲给你听？对了，明天降温，记得多穿点，别又感冒了";
export const HIS_DRAFT = "林夏，我是不是哪里惹你不开心了？我们以前不是这样的……";
export const GIVE_UP = "以后不打扰你了";
export const HER_REPLY_DRAFT = "哇！！你也太厉害了吧！！明天一定要讲给我听！还有你也要多穿点，别光顾着说我";
export const HER_NIGHT_DRAFT = "才不是这样的！！我每天都在等你的消息，每次都写了好多好多，又怕你嫌我烦，就全删了。其实我……";
/** what she finally sends at 00:58: the night draft, edited — the hesitant ending cut, a line added, the last words
 *  typed, deleted and typed again */
export const HER_CONFESSION = "才不是这样的！！我每天都在等你的消息，每次都写了好多好多，又怕你嫌我烦，就全删了。你发的每一条我都看了好多遍。其实，我喜欢你，很久很久了。";
const CONF_BASE = "才不是这样的！！我每天都在等你的消息，每次都写了好多好多，又怕你嫌我烦，就全删了。";
/** her editing at 00:52 (times are fractions of the editing window EV.type4 = 40.45–42.35): 「其实我……」 out, a line
 *  in; then from the cut to the close-up (41.47) 「其实，我喜欢你」, 「喜欢你」 back out on the delete sound (41.74), a
 *  breath, and in again with the rest — done by 42.16, so the highlight has time before her face (42.50) */
export const CONFESSION_EDITS: { u0: number; u1: number; to: string }[] = [
  { u0: 0.0, u1: 0.1, to: CONF_BASE },
  { u0: 0.1, u1: 0.53, to: CONF_BASE + "你发的每一条我都看了好多遍。" },
  { u0: 0.54, u1: 0.675, to: CONF_BASE + "你发的每一条我都看了好多遍。其实，我喜欢你" },
  { u0: 0.68, u1: 0.75, to: CONF_BASE + "你发的每一条我都看了好多遍。其实，我" },
  { u0: 0.79, u1: 0.9, to: HER_CONFESSION },
];

/** A draft being edited: each step goes from the current text to its target by deleting back to their common
 *  prefix (twice as fast) and then typing the rest, within its [u0, u1] slice of [t0, t1]. */
export function editing(abs: number, t0: number, t1: number, start: string, steps: { u0: number; u1: number; to: string }[]): string {
  let cur = start;
  for (const st of steps) {
    const a0 = t0 + (t1 - t0) * st.u0,
      a1 = t0 + (t1 - t0) * st.u1;
    if (abs < a0) return cur;
    if (abs >= a1) {
      cur = st.to;
      continue;
    }
    const a = Array.from(cur),
      b = Array.from(st.to);
    let p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    const del = (a.length - p) * 0.5,
      add = b.length - p;
    const u = ((abs - a0) / (a1 - a0)) * (del + add || 1);
    if (u < del) return a.slice(0, a.length - Math.floor(u / 0.5)).join("");
    return b.slice(0, p + Math.floor(u - del)).join("");
  }
  return cur;
}
export const ASK_AGAIN = "那周末一起去图书馆？";
/** what she sends while she waits for an answer that never comes (his phone is off) */
export const LATE1 = "你睡了吗？";
export const LATE2 = "晚安。";

/** everything after her 「嗯」 that night, on either phone: his 「以后不打扰你了」, her paragraph at 00:58, and her two
 *  messages while she waited (01:30, 03:00). `upto` cuts it off at a moment of the night (pops as they arrive). */
export function afterNight(side: "his" | "hers", abs = 99, popAt: { conf?: number; late1?: number; late2?: number } = {}): ChatItem[] {
  const mine = side === "hers";
  const items: ChatItem[] = [];
  items.push({ t: "msg", me: mine, text: "嗯" });
  items.push({ t: "msg", me: !mine, text: GIVE_UP });
  items.push({ t: "time", text: "00:58" });
  items.push({ t: "msg", me: mine, text: HER_CONFESSION, pop: popAt.conf !== undefined ? pop(abs, popAt.conf, 0.25) : 1 });
  if (popAt.late1 === undefined || abs >= popAt.late1) {
    items.push({ t: "time", text: "01:30" });
    items.push({ t: "msg", me: mine, text: LATE1, pop: popAt.late1 !== undefined ? pop(abs, popAt.late1) : 1 });
  }
  if (popAt.late2 === undefined || abs >= popAt.late2) {
    items.push({ t: "time", text: "03:00" });
    items.push({ t: "msg", me: mine, text: LATE2, pop: popAt.late2 !== undefined ? pop(abs, popAt.late2) : 1 });
  }
  return items;
}
export const FRIEND_ADVICE = "别回太快！回个嗯就行，显得你没那么在意";
export const MEI = "小美";
/** what she had told 小美 the moment his message came in (above 小美’s advice in their chat) */
export const MEI_FIRST = "他给我发了好长一段！！";

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

/** Phone close-ups: size and centre. At 0.95 the chat text (37 screen px ≈ 35px) stays readable on a phone. */
export const PHONE_S = 1.0;
export const PHONE_CY = 910;
/** where the thumbs rest when they aren't doing anything (screen coordinates) */
export const REST_R: FingerPos = { x: 395, y: 1000, touch: 0.15 };
export const REST_L: FingerPos = { x: 205, y: 1060, touch: 0.15 };

/** Both thumbs typing during [t0, t1]: each thumb taps every 0.24 s, half a period apart (~8 taps/s), and
 *  glides lifted from one key to the next on its own half of the keyboard. Screen coordinates. */
export function typingThumbs(abs: number, t0: number, t1: number, seed = 1): { right: FingerPos; left: FingerPos } {
  if (abs < t0 || abs > t1) return { right: REST_R, left: REST_L };
  const period = 0.24;
  const keyR = (n: number): Pt => [305 + hash(seed + n * 3.1) * 185, 940 + hash(seed + n * 5.7) * 200];
  const keyL = (n: number): Pt => [110 + hash(seed + 40 + n * 2.3) * 185, 940 + hash(seed + 40 + n * 4.9) * 200];
  const thumb = (key: (n: number) => Pt, rest: FingerPos, offset: number): FingerPos => {
    const u = (abs - t0) / period - offset;
    if (u < 0) {
      // on its way from rest to the first key
      const k = smooth(clamp(1 + u / offset));
      const p = key(0);
      return { x: rest.x + (p[0] - rest.x) * k, y: rest.y + (p[1] - rest.y) * k, touch: 0.15 + 0.5 * k };
    }
    const n = Math.floor(u),
      g = u - n;
    const a = key(n);
    if (g < 0.28) return { x: a[0], y: a[1], touch: 1 };
    const b = key(n + 1);
    const m = smooth((g - 0.28) / 0.6);
    return { x: a[0] + (b[0] - a[0]) * m, y: a[1] + (b[1] - a[1]) * m, touch: 0.1 + 0.9 * clamp((g - 0.86) / 0.14) };
  };
  return { right: thumb(keyR, REST_R, 0.35), left: thumb(keyL, REST_L, 0.85) };
}

/** her home screen: the wallpaper is the strawberry milk he tried to give her (a detail for rewatchers) */
export function herHome(c: Ctx, abs: number, time: string, o: { press?: number; zoom?: number } = {}) {
  homeScreen(c, abs, { time, ...o, art: (k) => strawberryMilk(k, 300, 900, 1.25, -0.08, 3390) });
}

/** his phone at night, given the moment */
export function hisNightChat(abs: number, extra: Partial<ChatView> = {}): ChatView {
  const items: ChatItem[] = [...HISTORY];
  if (abs >= EV.um1) items.push({ t: "msg", text: "嗯", pop: pop(abs, EV.um1) });
  if (abs >= EV.send1) items.push({ t: "msg", me: true, text: GIVE_UP, pop: pop(abs, EV.send1) });
  return { title: HER, time: abs < 20 ? "23:12" : "00:47", me: "boy", them: "girl", items, dark: true, ...extra };
}
