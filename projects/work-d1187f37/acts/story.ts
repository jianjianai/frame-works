// 《unhappy》· 同一段聊天两个视角：两部手机上的字、聊天记录、打字删字和拇指的动作（屏幕坐标 600×1280），几幕共用。
// 画面（房间、人物、手机镜头）在 world.ts / shots.ts。
// YouTube 版：全部英文。「嗯」→ "k"（英语里最典型的冷淡回复），最后的「嗯！！」→ "ok!!"；林夏 → Summer，周屿 → Leo，
// 小美 → Mia；12 小时制、英文日期；聊天是 Instagram 私信样式（素材库 dm.ts）。
import { clamp, phase, smooth } from "@frame/engine/math";
import { Ctx, Pt, hash } from "@materials/s0rrow/code/draw";
import { strawberryMilk } from "@materials/s0rrow/code/places";
import { ChatItem, ChatView, homeScreen } from "@materials/s0rrow/code/dm";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { EV } from "./timeline";

export const HIM = "Leo";
export const HER = "Summer";
export const MEI = "Mia";
/** the grey line under the name in the chat header */
export const HANDLE: Record<string, string> = { [HIM]: "leo.zhou", [HER]: "summer.lin", [MEI]: "mia.li" };
/** the cold reply (「嗯」) — and the warm one at the end (「嗯！！」) */
export const UM = "k";
export const UM_JOY = "ok!!";
export const HIS_LONG = "I FINALLY solved that physics problem!! took me all night lol. want me to explain it tomorrow? also it's getting cold, wear a jacket. don't get sick again";
export const HIS_DRAFT = "Summer, did I do something to upset you? we never used to be like this…";
export const GIVE_UP = "I won't bother you anymore.";
export const HER_REPLY_DRAFT = "WAIT you actually solved it?? you're so smart!! yes explain it tomorrow!! and YOU wear a jacket too, stop worrying about me";
const CONF_BASE = "That's not true!! I wait for your texts every day. I always write so much, then delete it all so I don't seem annoying. ";
export const HER_NIGHT_DRAFT = CONF_BASE + "The truth is I…";
const CONF_ADD = "I've read all your texts like 100 times.";
/** what she finally sends at 12:58: the night draft, edited — the hesitant ending cut, a line added, the last words
 *  typed, deleted and typed again (she puts the last two lines on lines of their own) */
export const HER_CONFESSION = CONF_BASE + CONF_ADD + "\nThe truth is, I like you.\nFor a long, long time.";
/** the words she finally dares to say (the highlighter in her input box) and their sentence (on his phone) */
export const LOVE = "I like you";
export const LOVE_LINE = "The truth is, I like you.";
/** her editing at 12:52 (times are fractions of the editing window EV.type4 = 40.45–42.35): "The truth is I…" out, a
 *  line in, and "The truth is, "; then from the cut to the close-up (41.47) "I like you", "like you" back out on the
 *  delete sound (41.74), a breath, and in again with the rest — done by 42.16, so the highlight has time before her
 *  face (42.50) */
export const CONFESSION_EDITS: { u0: number; u1: number; to: string }[] = [
  { u0: 0.0, u1: 0.1, to: CONF_BASE },
  { u0: 0.1, u1: 0.53, to: CONF_BASE + CONF_ADD + "\nThe truth is, " },
  { u0: 0.54, u1: 0.675, to: CONF_BASE + CONF_ADD + "\nThe truth is, I like you" },
  { u0: 0.68, u1: 0.75, to: CONF_BASE + CONF_ADD + "\nThe truth is, I " },
  { u0: 0.79, u1: 0.9, to: HER_CONFESSION },
];
/** her paragraph as it sits in the input box, broken at phrases (user: 「文字重排一下」): each line fits the box without
 *  wrapping, "The truth is, I like you." on a line of its own. Joined with "\n" it is the confession with some spaces
 *  turned into line breaks. */
const CONF_LINES = ["That's not true!!", "I wait for your texts", "every day. I always", "write so much, then", "delete it all so I", "don't seem annoying.", "I've read all your texts", "like 100 times.", "The truth is, I like you.", "For a long, long time."];
const CONF_SHOWN = CONF_LINES.join("\n");
/** a draft laid out with those line breaks, as far as it agrees with the confession (the rest just wraps) */
export function laidOut(draft: string) {
  let same = 0;
  while (same < draft.length && draft[same] === HER_CONFESSION[same]) same++;
  return CONF_SHOWN.slice(0, same) + draft.slice(same);
}

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
export const ASK_AGAIN = "so… library this weekend?";
/** what she sends while she waits for an answer that never comes (his phone is off) */
export const LATE1 = "are you asleep?";
export const LATE2 = "goodnight.";

/** everything after her "k" that night, on either phone: his "I won't bother you anymore.", her paragraph at 12:58,
 *  and her two messages while she waited (1:30, 3:00). `upto` cuts it off at a moment of the night (pops as they arrive). */
export function afterNight(side: "his" | "hers", abs = 99, popAt: { conf?: number; late1?: number; late2?: number } = {}): ChatItem[] {
  const mine = side === "hers";
  const items: ChatItem[] = [];
  items.push({ t: "msg", me: mine, text: UM });
  items.push({ t: "msg", me: !mine, text: GIVE_UP });
  items.push({ t: "time", text: "12:58 AM" });
  items.push({ t: "msg", me: mine, text: HER_CONFESSION, pop: popAt.conf !== undefined ? pop(abs, popAt.conf, 0.25) : 1 });
  if (popAt.late1 === undefined || abs >= popAt.late1) {
    items.push({ t: "time", text: "1:30 AM" });
    items.push({ t: "msg", me: mine, text: LATE1, pop: popAt.late1 !== undefined ? pop(abs, popAt.late1) : 1 });
  }
  if (popAt.late2 === undefined || abs >= popAt.late2) {
    items.push({ t: "time", text: "3:00 AM" });
    items.push({ t: "msg", me: mine, text: LATE2, pop: popAt.late2 !== undefined ? pop(abs, popAt.late2) : 1 });
  }
  return items;
}
export const FRIEND_ADVICE = `don't reply so fast!! just say "${UM}". play it cool`;
/** the part of Mia's advice that gets the highlighter */
export const ADVICE_MARK = `just say "${UM}"`;
/** what she had told Mia the moment his message came in (above Mia’s advice in their chat) */
export const MEI_FIRST = "HE SENT ME A WHOLE PARAGRAPH!!";

/** three months of chatting: long and lively in July, short by October */
export const HISTORY: ChatItem[] = [
  { t: "time", text: "Jul 12, 11:41 PM" },
  { t: "msg", text: "HAHAHAHA you're so funny omg" },
  { t: "msg", me: true, text: "for real! I almost laughed out loud and the teacher looked right at me" },
  { t: "msg", text: "I wanna come tomorrow too!! take me with you!" },
  { t: "voice", secs: 52 },
  { t: "msg", text: "btw strawberry milk is my favorite. remember that!!" },
  { t: "sticker", me: true, kind: "cat" },
  { t: "time", text: "Aug 20, 12:13 AM" },
  { t: "msg", text: "are you asleep? I can't sleep" },
  { t: "msg", me: true, text: "nope, thinking about that movie you told me about" },
  { t: "msg", text: "let's watch it together this weekend~" },
  { t: "time", text: "Sep 18, 10:30 PM" },
  { t: "msg", me: true, text: "you seemed sad today. you okay?" },
  { t: "msg", text: "I'm fine" },
  { t: "time", text: "Oct 6, 11:05 PM" },
  { t: "msg", me: true, text: "wanna go to the library this weekend?" },
  { t: "msg", text: UM },
  { t: "msg", me: true, text: "that strawberry milk has a new flavor now!" },
  { t: "msg", text: "oh" },
  { t: "time", text: "11:12 PM" },
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
  if (abs >= EV.um1) items.push({ t: "msg", text: UM, pop: pop(abs, EV.um1) });
  if (abs >= EV.send1) items.push({ t: "msg", me: true, text: GIVE_UP, pop: pop(abs, EV.send1) });
  return { title: HER, handle: HANDLE[HER], time: abs < 20 ? "11:12" : "12:47", me: "boy", them: "girl", items, dark: true, ...extra };
}
