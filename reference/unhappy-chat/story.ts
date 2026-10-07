import { clamp, phase, smooth } from "../../../../src/engine/math";
import { C, Ctx, H, Pt, W, backOut, camera, fillBg, filtered, glow, hash } from "./draw";
import { drawKid } from "./kid";
import { bedBlanket, bedroom, classroomFront, deskFront, herBlanket, herRoom, huggedPillow, strawberryMilk } from "./places";
import { heart } from "./sets";
import { ChatItem, ChatView, chatScreen2, homeScreen, selfiePhoto } from "./chat";
import { FingerPos, HandsLook } from "./hand";
import { SH, SW, phone } from "./phone";
import { EV } from "./timeline";

/** 《unhappy》· 同一段聊天两个视角 — the words on both phones, and helpers shared by the acts. */

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
/** her editing at 00:52 (times are fractions of the editing window) */
export const CONFESSION_EDITS: { u0: number; u1: number; to: string }[] = [
  { u0: 0.0, u1: 0.12, to: CONF_BASE },
  { u0: 0.12, u1: 0.5, to: CONF_BASE + "你发的每一条我都看了好多遍。" },
  { u0: 0.5, u1: 0.68, to: CONF_BASE + "你发的每一条我都看了好多遍。其实，我喜欢你" },
  { u0: 0.68, u1: 0.78, to: CONF_BASE + "你发的每一条我都看了好多遍。其实，我" },
  { u0: 0.8, u1: 1.0, to: HER_CONFESSION },
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

export const HER_HANDS: HandsLook = { sleeve: "#f3b6c4", cuff: "#fff4f6", skin: "#f6e1c3", specks: 0.15 };
export const HIS_HANDS: HandsLook = {};

/** A phone up close over a dim room glow; thumb presses show as touch dots (no hands are drawn). */
export function phoneCloseup(
  ctx: Ctx,
  abs: number,
  screen: (c: Ctx) => void,
  o: { who?: "boy" | "girl"; right?: FingerPos; left?: FingerPos; cx?: number; cy?: number; s?: number; rot?: number; bg?: string; glowCol?: string; steady?: boolean; backdrop?: (c: Ctx) => void } = {},
) {
  // hand-held: the phone floats a little; resting thumbs drift, pressing thumbs stay exactly on target
  const sway = o.steady ? 0 : 1;
  const cx = (o.cx ?? 540) + Math.sin(abs * 0.9) * 3 * sway,
    cy = (o.cy ?? PHONE_CY) + Math.sin(abs * 1.1 + 1) * 4 * sway,
    s = o.s ?? PHONE_S,
    rot = (o.rot ?? (o.steady ? 0 : -0.02)) + Math.sin(abs * 0.7) * 0.006 * sway;
  const drift = (p: FingerPos, ph: number): FingerPos => {
    const k = 1 - clamp(p.touch * 2);
    return { x: p.x + Math.sin(abs * 1.7 + ph) * 7 * k, y: p.y + Math.cos(abs * 1.3 + ph) * 9 * k, touch: p.touch };
  };
  fillBg(ctx, o.bg ?? "#0b0d1c");
  o.backdrop?.(ctx);
  glow(ctx, cx, cy - 60, 900, o.glowCol ?? "rgba(120,150,255,0.26)");
  phone(ctx, cx, cy, s, rot, screen);
  // no hands (the user preferred the phone alone): where a thumb presses, a soft touch dot shows instead
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  for (const p of [drift(o.right ?? REST_R, 0), drift(o.left ?? REST_L, 2)]) {
    const k = clamp((p.touch - 0.6) / 0.4);
    if (k <= 0) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30 + 6 * k, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.32 * k})`;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * k})`;
    ctx.stroke();
  }
  ctx.restore();
}

/** A memory, as old film: faded warm colour, a light flicker and gate weave (both step at the film’s own 18 fps),
 *  grain, a few dust specks, a thin scratch now and then, dark edges. Both memories (his class at 8.25, her night
 *  and her class from 32.79) go through this and nothing else. Dust and scratches are dark — white specks read as
 *  dandruff on a phone. Draw time cards and red-pen notes after it, unfiltered. */
export function oldFilm(ctx: Ctx, abs: number, draw: (c: Ctx) => void, key = "film") {
  const f = Math.floor(abs * 18);
  const r = (k: number) => hash(f * 7.13 + k * 3.7);
  const flick = 1 + (r(1) - 0.5) * 0.09;
  const wx = (r(2) - 0.5) * 3,
    wy = (r(3) - 0.5) * 4;
  filtered(
    ctx,
    `sepia(0.62) saturate(0.7) contrast(1.08) brightness(${flick.toFixed(3)})`,
    (c) => {
      // gate weave; scaled a touch so the edges never show
      c.translate(540 + wx, 960 + wy);
      c.scale(1.012, 1.012);
      c.translate(-540, -960);
      draw(c);
    },
    key,
  );
  ctx.save();
  // grain
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = i % 3 ? "rgba(40,25,10,0.18)" : "rgba(255,240,210,0.08)";
    ctx.fillRect(r(10 + i) * W, r(400 + i) * H, 2.5, 2.5);
  }
  // dust: a few dark specks, different on every film frame, and now and then a fibre
  for (let i = 0; i < 4; i++) {
    if (r(900 + i) > 0.5) continue;
    const sz = 3 + r(930 + i) * 7;
    ctx.fillStyle = "rgba(30,18,8,0.45)";
    ctx.beginPath();
    ctx.ellipse(r(910 + i) * W, r(920 + i) * H, sz, sz * (0.5 + r(940 + i) * 0.5), r(950 + i) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (r(960) < 0.25) {
    const x = r(961) * W,
      y = r(962) * H;
    ctx.strokeStyle = "rgba(30,18,8,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 30, y + 10, x + 20 + r(963) * 40, y + 50);
    ctx.stroke();
  }
  // a thin scratch running down the frame, staying a few frames
  const sf = Math.floor(abs * 3);
  for (let i = 0; i < 2; i++) {
    if (hash(sf * 5.1 + i * 11) > 0.55) continue;
    const x = hash(sf * 2.3 + i * 7) * W + Math.sin(abs * 9 + i) * 4;
    ctx.strokeStyle = "rgba(50,32,14,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 6, H);
    ctx.stroke();
  }
  // dark edges
  const g = ctx.createRadialGradient(540, 900, 430, 540, 900, 1250);
  g.addColorStop(0, "rgba(40,24,8,0)");
  g.addColorStop(1, "rgba(40,24,8,0.62)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** the photos in her profile album, before her sunflower portrait (each draws into 600×860) — he flicks through them
 *  at 16.4 ("You are, you are very pretty") and stops on the portrait */
export const HER_PHOTOS: ((c: Ctx) => void)[] = [
  // a strawberry milk against her cheek — the drink he keeps buying her
  (c) => {
    const g = c.createLinearGradient(0, 0, 0, 860);
    g.addColorStop(0, "#ffd3de");
    g.addColorStop(1, "#fff3f6");
    c.fillStyle = g;
    c.fillRect(0, 0, SW, 860);
    for (let i = 0; i < 7; i++) heart(c, 60 + ((i * 151) % 500), 120 + ((i * 263) % 640), 14 + (i % 3) * 6, "rgba(255,140,170,0.45)", 3396 + i);
    drawKid(c, 255, 480, 1.05, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "smile", blush: 0.8, tilt: -0.1 });
    strawberryMilk(c, 455, 560, 0.85, 0.18, 3395);
  },
  // with her friends (the same selfie she posted)
  (c) => selfiePhoto(c, 0, 0, SW, 860, 0),
  // by the classroom window, looking out
  (c) => {
    const g = c.createLinearGradient(0, 0, 0, 860);
    g.addColorStop(0, "#8ec9ef");
    g.addColorStop(1, "#e6f4fb");
    c.fillStyle = g;
    c.fillRect(0, 0, SW, 860);
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (const [x, y, r] of [[110, 170, 40], [160, 150, 52], [215, 175, 38], [430, 250, 34], [475, 232, 44]] as [number, number, number][]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#e9e1cf";
    c.fillRect(0, 0, 26, 860);
    c.fillRect(SW / 2 - 10, 0, 20, 470);
    c.fillRect(0, 440, SW, 22);
    drawKid(c, 330, 540, 1.0, { who: "girl", outfit: "cardigan", body: "bust", eyes: "open", look: [-0.7, -0.15], mouth: "smile", blush: 0.4, tilt: 0.08 });
  },
];

/** her home screen: the wallpaper is the strawberry milk he tried to give her (a detail for rewatchers) */
export function herHome(c: Ctx, abs: number, time: string, o: { press?: number; zoom?: number } = {}) {
  homeScreen(c, abs, { time, ...o, art: (k) => strawberryMilk(k, 300, 900, 1.25, -0.08, 3390) });
}

/** Make a phone read as a phone when its screen is dark: a rim light round the frame and the side buttons.
 *  Same cx, cy, s, rot as the phone() / phoneCloseup call (use steady: true so they match). */
export function phoneBody(ctx: Ctx, cx: number, cy: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  // side buttons
  ctx.fillStyle = "#2c2c33";
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 5;
  for (const [x, y, h] of [[-40, 250, 60], [-40, 350, 110], [-40, 480, 110], [SW + 26, 380, 170]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.roundRect(x, y, 14, h, 6);
    ctx.fill();
    ctx.stroke();
  }
  // rim light on the metal frame, brightest on the upper left
  const g = ctx.createLinearGradient(-26, -26, SW + 26, SH + 26);
  g.addColorStop(0, "rgba(235,240,255,0.75)");
  g.addColorStop(0.35, "rgba(200,210,235,0.25)");
  g.addColorStop(0.7, "rgba(200,210,235,0.08)");
  g.addColorStop(1, "rgba(255,220,180,0.35)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(-16, -16, SW + 32, SH + 32, 84);
  ctx.stroke();
  ctx.restore();
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
/** his room in the morning, through the window or full frame: asleep under the duvet, or sitting up with his
 *  phone (`mood`: "sleep" | "tired" | "grin") */
export function hisRoomMorning(ctx: Ctx, abs: number, day: number, mood: "sleep" | "tired" | "grin") {
  bedroom(ctx, abs, { dawn: day });
  if (mood === "sleep") {
    blobDuvet(ctx);
  } else {
    drawKid(ctx, 840, 620, 0.78, { body: "bust", eyes: mood === "grin" ? "happy" : "tired", mouth: mood === "grin" ? "grin" : "flat", blush: mood === "grin" ? 0.8 : 0, look: [0, 0.9], arms: "phone" });
    bedBlanket(ctx);
  }
  if (day < 1) {
    ctx.fillStyle = `rgba(4,6,20,${0.66 * (1 - day)})`;
    ctx.fillRect(-60, -60, W + 120, H + 120);
  }
}
function blobDuvet(ctx: Ctx) {
  // the duvet pulled right over him, a tuft of hair on the pillow
  ctx.beginPath();
  ctx.moveTo(470, 1010);
  ctx.bezierCurveTo(560, 860, 760, 790, 900, 800);
  ctx.bezierCurveTo(1060, 810, 1170, 900, 1170, 960);
  ctx.lineTo(1170, 1170);
  ctx.lineTo(440, 1180);
  ctx.closePath();
  ctx.fillStyle = "#5f77a8";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
}

/** her room in the night and the morning: `state` "awake" (lamp on, phone in hand), "asleep" (lamp off, asleep sitting up
 *  with the phone), "grin" (morning, beaming at her phone) */
export function herRoomAt(ctx: Ctx, abs: number, day: number, state: "awake" | "asleep" | "grin") {
  herRoom(ctx, abs, { lights: state === "awake" ? 1 : 0.3 * (1 - day), dawn: day });
  drawKid(ctx, 320, 720, 0.64, {
    who: "girl",
    outfit: "pajamas",
    body: "full",
    legs: "sitFloor",
    eyes: state === "asleep" ? "shut" : state === "grin" ? "happy" : "sad",
    mouth: state === "grin" ? "grin" : "flat",
    blush: state === "grin" ? 1 : 0,
    tilt: state === "asleep" ? 0.25 : 0.05,
    look: [0, 0.8],
    arms: "phone",
  });
  herBlanket(ctx);
  if (state === "asleep" && day < 1) {
    ctx.fillStyle = `rgba(6,4,20,${0.55 * (1 - day)})`;
    ctx.fillRect(-60, -60, W + 120, H + 120);
  }
}

/** one of them hugging a pillow, rocking with joy (from time t0) */
export function hugJoy(ctx: Ctx, abs: number, who: "boy" | "girl", x: number, y: number, s: number, t0 = 0) {
  const rock = Math.sin((abs - t0) * 7) * 0.12;
  ctx.save();
  ctx.translate(x, y + 30 * s);
  ctx.rotate(rock);
  ctx.translate(-x, -y - 30 * s);
  drawKid(ctx, x, y, s, {
    ...(who === "girl" ? { who: "girl" as const, outfit: "pajamas" as const } : {}),
    body: "full",
    legs: "sitFloor",
    eyes: "happy",
    mouth: "grin",
    blush: 1,
    tilt: 0.12 * Math.sin((abs - t0) * 7 + 0.5),
    headY: 14,
    arms: "custom",
    handL: [-60, 300],
    handR: [60, 300],
    shapeL: "hidden",
    shapeR: "hidden",
  });
  if (who === "girl") huggedPillow(ctx, x, y, s, "#f3b6c4", "#fff4f6", "#f6e1c3", 3810);
  else huggedPillow(ctx, x, y, s, "#2e6f96", "#22536f", "#f3dcae", 3812);
  ctx.restore();
}

/** his face as her message sinks in (EV.read): the camera creeping in on him, frozen, eyes wide — then on the outro
 *  downbeat (EV.joy) a burst: a warm flash, the camera jumps back and settles, he beams, hearts. Drawn by act 3 and
 *  act 4 so the shot runs across the layer boundary. */
export function hisFaceReading(ctx: Ctx, abs: number) {
  const joy = abs >= EV.joy;
  const k = phase(abs, EV.joy, EV.joy + 0.3);
  const creep = smooth(phase(abs, EV.read, EV.joy));
  const bounce = joy ? 1 - backOut(phase(abs, EV.joy, EV.joy + 0.35)) : 0;
  fillBg(ctx, joy ? "#f6e3cf" : "#e9e0d4");
  ctx.save();
  camera(ctx, 540, 860, (joy ? 1.08 + 0.12 * bounce + 0.04 * smooth(phase(abs, EV.joy + 0.35, EV.reply)) : 1.0 + 0.16 * creep), joy ? 0 : -0.03 * creep);
  glow(ctx, 540, 1000, 900, `rgba(255,226,170,${0.35 + 0.35 * k})`);
  if (joy) {
    // rays of light behind him
    ctx.save();
    ctx.globalAlpha = 0.18 * k;
    ctx.fillStyle = "#fff4cf";
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2 + (abs - EV.joy) * 0.4;
      ctx.beginPath();
      ctx.moveTo(540, 760);
      ctx.lineTo(540 + Math.cos(a0) * 1400, 760 + Math.sin(a0) * 1400);
      ctx.lineTo(540 + Math.cos(a0 + 0.18) * 1400, 760 + Math.sin(a0 + 0.18) * 1400);
      ctx.fill();
    }
    ctx.restore();
  }
  drawKid(ctx, 540, 880, 1.3, {
    body: "bust",
    eyes: joy ? "happy" : "wide",
    mouth: joy ? "grin" : "o",
    brows: joy ? "up" : "up",
    blush: joy ? 0.6 + 0.4 * k : 0.25 * creep,
    look: [0, 0.6],
    arms: "phone",
    tears: joy ? 0.25 : 0,
  });
  ctx.restore();
  if (joy && abs < EV.joy + 0.22) {
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - phase(abs, EV.joy, EV.joy + 0.22));
    ctx.fillStyle = "#fff6e0";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (!joy) return;
  for (let i = 0; i < 8; i++) {
    const t = ((abs - EV.joy) * 0.9 + i * 0.13) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - t) * clamp((abs - EV.joy) * 5);
    heart(ctx, 540 + Math.sin(i * 2.1) * 360, 760 - t * 380, 22 + (i % 3) * 9, "#ff7fa8", 3930 + i);
    ctx.restore();
  }
}
/** Him at his desk, close, from her side of the room: looking down at the strawberry milk he bought for her
 *  (act 1, after she hides) or smiling at her when their eyes meet (act 3, her memory of the same moment). */
export function hisClassFace(ctx: Ctx, abs: number, t0: number, mood: "sad" | "smile") {
  const smile = mood === "smile";
  ctx.save();
  camera(ctx, 600, 640, 1.7 + 0.05 * smooth(phase(abs, t0, t0 + 0.6)));
  filtered(ctx, "blur(3px)", (c) => classroomFront(c, abs, { sun: 0.8 }), "classBack");
  ctx.restore();
  glow(ctx, 900, 560, 700, "rgba(255,240,200,0.35)");
  drawKid(ctx, 540, 900, 1.3, {
    body: "bust",
    eyes: smile ? "happy" : "sad",
    mouth: smile ? "smile" : "flat",
    brows: smile ? undefined : "sad",
    blush: smile ? 0.45 : 0,
    look: smile ? [0, 0] : [-0.2, 0.9],
    tilt: smile ? -0.05 : 0.04,
    arms: "down",
  });
  deskFront(ctx, 540, 1340, 1.3, 3572, (c) => strawberryMilk(c, -150, -110, 0.7, -0.05, 3592));
}
export const phase01 = phase;
export { C };
