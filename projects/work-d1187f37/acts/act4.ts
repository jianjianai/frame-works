// 第四幕（49.14 – 57.0）· 尾奏（重置版：剧情和时间点不变，画面、镜头、光影按最新标准重做）
//  A 49.14–49.91 他的脸：尾奏重拍上暖光一闪，他哭着笑开（第三幕的同一个镜头接过来）
//  B 49.91–54.76 一个不切的手机镜头："me too" → "so… library this weekend?" → 她的「正在输入」气泡（黄圈）→ "ok!!" → 爱心
//  C 54.76–57.00 早晨的那条街：两扇窗都照着太阳，两人各在窗里笑，爱心飘到街中间；镜头往后拉，淡出
import "./locale";
import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { Ctx, Pt, W, H, bloom, designScene, flash, glow, pulse } from "@materials/s0rrow/code/draw";
import { heart } from "@materials/s0rrow/code/sets";
import { ChatItem, ChatView, bubbleAt, chatScreen2, sendButtonAt, typingAt } from "./dm";
import { ASK_AGAIN, HANDLE, HER, HISTORY, REST_L, REST_R, UM_JOY, afterNight, inWin, pop, typed, typingK, typingThumbs } from "./story";
import { BAR, END, EV } from "./timeline";
import { clueGlow, drawPhone, pulseRings, vignette } from "./shots";
import { HER_WIN, HIS_WIN, herDuvet, herInBed, herPhoneBack, herRoomNight, hisBokeh, hisDuvet, hisInBed, hisPhoneBack, hisRoom, nightStreet, winC } from "./world";
import { hisFaceReading } from "./act3";

const ME_TOO = "me too";
const UM = UM_JOY;

function hisItems(abs: number): ChatItem[] {
  const items: ChatItem[] = [...HISTORY.slice(-3), ...afterNight("his")];
  items.push({ t: "time", text: "7:11 AM" });
  if (abs >= EV.send5) items.push({ t: "msg", me: true, text: ME_TOO, pop: pop(abs, EV.send5) });
  if (abs >= EV.send6) items.push({ t: "msg", me: true, text: ASK_AGAIN, pop: pop(abs, EV.send6) });
  if (abs >= EV.um3) items.push({ t: "msg", text: UM, pop: pop(abs, EV.um3) });
  if (abs >= EV.heart) items.push({ t: "sticker", kind: "heart", pop: pop(abs, EV.heart, 0.25) });
  return items;
}

// ---------------------------------------------------------------- B · his phone, one continuous shot
/** No cutaways: he sends "me too" and "so… library this weekend?" (each send a little bounce and the room warms), her
 *  typing bubble comes up under it (the camera holds its breath and leans in — this time it ends in an answer), "ok!!"
 *  lands in its place with the hook's yellow pulses (a rush onto it), then a heart. The keyboard stays up so the
 *  conversation never jumps; once her answer is in, the camera settles on the newest messages. */
function shotChat(c: Ctx, abs: number) {
  let draft = "";
  if (abs >= EV.type6[0] && abs < EV.send5) draft = typed(ME_TOO, abs, EV.type6[0], EV.type6[1]);
  else if (abs >= EV.type7[0] && abs < EV.send6) draft = typed(ASK_AGAIN, abs, EV.type7[0], EV.type7[1]);
  const typingNow = abs < EV.um3;
  const view: ChatView = {
    title: HER,
    handle: HANDLE[HER],
    time: "7:11",
    me: "boy",
    them: "girl",
    items: hisItems(abs),
    typing: typingNow ? typingK(abs, [EV.typingC]) : 0,
    typingRoom: typingNow ? smooth(phase(abs, EV.typingC[0], EV.typingC[0] + 0.15)) : 0,
    draft,
    caret: true,
    keyboard: true,
  };
  let hands = { right: REST_R, left: REST_L };
  if (inWin(abs, EV.type6)) hands = typingThumbs(abs, EV.type6[0], EV.type6[1], 61);
  else if (inWin(abs, EV.type7)) hands = typingThumbs(abs, EV.type7[0], EV.type7[1], 71);
  else
    for (const [t1, send, text] of [[EV.type6[1], EV.send5, ME_TOO], [EV.type7[1], EV.send6, ASK_AGAIN]] as const)
      if (abs >= t1 && abs < send + 0.12) {
        const sb = sendButtonAt(c, { ...view, draft: text });
        hands = { right: { x: sb[0], y: sb[1] + (abs < send - 0.06 ? 30 : 0), touch: abs > send - 0.06 ? 1 : 0 }, left: REST_L };
      }
  const bump = Math.max(...[EV.send5, EV.send6, EV.um3, EV.heart].map((t) => (abs >= t ? Math.exp(-(abs - t) * 7) : 0)));
  const lean = smooth(phase(abs, EV.typingC[0], EV.typingC[0] + 0.5)) * (1 - smooth(phase(abs, EV.um3, EV.um3 + 0.2)));
  const settle = smooth(phase(abs, EV.um3, EV.um3 + 0.6));
  const s = 1.0 * (1 + 0.05 * smooth(phase(abs, EV.reply, EV.um3)) + 0.03 * lean + 0.12 * settle + 0.035 * bump);
  const ay = 640 - 80 * settle,
    py = 960 + 40 * (s - 1) * (1 - settle) + (930 - 960) * settle;
  const cx = 540,
    cy = py - (ay - 640) * s;
  const warm = 0.5 + 0.5 * smooth(phase(abs, EV.send5, EV.heart));
  hisBokeh(c, abs, { warm, day: 0.85 });
  drawPhone(c, abs, { cx, cy, s, rot: 0 }, (q) => chatScreen2(q, abs, view), { thumbs: [hands.right, hands.left], haloRgb: "255,226,190", halo: 0.8 });
  const at = (x: number, y: number): Pt => [cx + (x - 300) * s, cy + (y - 640) * s];
  if (inWin(abs, EV.typingC)) {
    const dots = typingAt(c, view);
    const [tx, ty] = at(dots.x + dots.w / 2, dots.y + dots.h / 2);
    clueGlow(c, tx, ty, 190 * s, smooth(phase(abs, EV.typingC[0], EV.typingC[0] + 0.12)));
    pulseRings(c, abs, tx, ty, (dots.w / 2 + 26) * s, (dots.h / 2 + 16) * s, [EV.typingC[0] + 0.02]);
  }
  if (abs >= EV.um3) {
    const b = bubbleAt(c, view, view.items.findIndex((it) => it.t === "msg" && it.text === UM));
    if (b) {
      const [bx, by] = at(b.x + b.w / 2, b.y + b.h / 2);
      pulseRings(c, abs, bx, by, (b.w / 2 + 30) * s, (b.h / 2 + 18) * s, [EV.um3 + 0.02, EV.um3 + 0.22]);
      glow(c, bx, by, 220 * s, `rgba(255,209,102,${(0.25 * pulse(abs, 5)).toFixed(3)})`);
    }
  }
  vignette(c, 0.25, 540, 900, 420, 1250);
}

// ---------------------------------------------------------------- C · the street in the morning
/** her room in the morning: the lamp off, daylight from her window */
function herRoomMorning(c: Ctx, abs: number) {
  herRoomNight(c, abs, { lamp: 0, lights: 0.4 });
  herInBed(c, { eyes: "happy", mouth: "grin", blush: 1, look: [0, 0.8], tilt: -0.08, arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => herPhoneBack(q, 0, 236, 92, 176, 0) }, { lamp: 0, phone: 0.5 });
  herDuvet(c, 0);
  c.save();
  c.globalCompositeOperation = "soft-light";
  c.fillStyle = "rgba(255,230,190,0.85)";
  c.fillRect(-60, -60, W + 120, H + 120);
  c.globalCompositeOperation = "lighter";
  glow(c, 830, 470, 700, "rgba(255,214,160,0.3)");
  c.restore();
}
function hisRoomMorningGrin(c: Ctx, abs: number) {
  hisRoom(c, abs, { lamp: 0, dawn: 1 });
  hisInBed(c, { eyes: "happy", mouth: "grin", blush: 0.8, look: [0, 0.9], arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => hisPhoneBack(q, 0, 236, 92, 176, 0) }, { lamp: 0, phone: 0.4, dawn: 1 });
  hisDuvet(c, 0, 1);
}
/** the same street as the night his light went out — now both windows catch the sun; inside, each of them grinning at
 *  a phone; the camera pulls back (softly, all the way to the last frame) while hearts drift out of both windows and
 *  meet over the street */
function shotOutside(c: Ctx, abs: number) {
  const p = smooth(phase(abs, EV.outside, END));
  const Z = 1.5 - 0.4 * p;
  const cam: Pt = [471, 1060 - 40 * p];
  nightStreet(c, abs, cam, Z, { day: 1, hisLit: false, herLit: false, hisRoom: (q) => hisRoomMorningGrin(q, abs), herRoom: (q) => herRoomMorning(q, abs) });
  const toScreen = ([x, y]: Pt): Pt => [540 + (x - cam[0]) * Z, 960 + (y - cam[1]) * Z];
  const a = toScreen(winC(HIS_WIN)),
    b = toScreen(winC(HER_WIN));
  // the sun's warmth over the street
  glow(c, 540, 700, 1100, "rgba(255,220,170,0.18)");
  for (let i = 0; i < 8; i++) {
    const from = i % 2 ? b : a;
    const t = ((abs - EV.outside) * 0.55 + i * 0.13) % 1;
    const mx = (a[0] + b[0]) / 2,
      my = Math.min(a[1], b[1]) - 260 * Z * 0.5;
    const x = from[0] + (mx - from[0]) * t + Math.sin(i * 2.3 + abs * 3) * 14,
      y = from[1] + (my - from[1]) * t - Math.sin(Math.PI * t) * 80;
    c.save();
    c.globalAlpha = Math.sin(Math.PI * t) * smooth(phase(abs, EV.outside, EV.outside + 0.3));
    heart(c, x, y, (12 + (i % 3) * 5) * Math.max(1, Z * 0.6), "#ff7fa8", 4030 + i);
    c.restore();
  }
  flash(c, phase(abs, END - 0.6, END), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(24), (c, abs) => {
    if (abs < EV.reply) hisFaceReading(c, abs);
    else if (abs < EV.outside) shotChat(c, abs);
    else shotOutside(c, abs);
    bloom(c, 0.2, 24);
  });
}
