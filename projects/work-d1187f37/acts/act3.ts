// 第三幕（32.79 – 49.14）· 主歌2 · 她的视角 → 第二天（重置版：剧情和时间点不变，画面、镜头、光影按最新标准重做）
//  A 32.79–37.39 回忆（老式屏幕竖线，进回忆两拍竖线转场）：23:12 收到他那一大段，她捂着脸笑 → 打了一大段 → 小美的消息
//               → 点进去「回个嗯就行」→ 返回、全删 → 只发「嗯」（黄圈）
//  B 37.39–39.43 重放他回忆里的同一组画面、揭开她这边：从他座位看，她转身、课本一下举起（和 9.27 一样）→ 书放低一点，
//               她从书后看着他、脸红冒烟、心跳 → 放学后：他留在她空桌上的牛奶（和 11.83 一样），她的手拿起来贴到脸上笑
//  C 39.43–44.80 回到 00:52：她擦掉眼泪 → 点开微信、镜头凑近那段话 → 输入框特写：「我喜欢你」打了、删了、又打上 →
//               一镜到底：她的脸，按下发送，屏幕的光在脸上一跳，松一口气 → 镜头从她脸上退回房间、一直往后退：01:30、03:00
//               又发两句，困得睡着
//  D 44.80–46.33 那条街：她的灯也灭了，夜色延时到早晨，推进他的窗
//  E 46.33–48.63 07:10 他开机：锁屏掉下三条消息 → 点开 → 荧光笔划出「其实，我喜欢你」
//  F 48.63–     他的脸：愣住（接到第四幕的笑开）
import "./locale";
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, bloom, camera, card, designScene, fillBg, filtered, glow, inkLine, litFigure, measure, oldFilm, oldScreenCut, oval, paint, pulse, rimFigure, rr, text } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { bookFingers, deskFront, strawberryMilk, textbook } from "@materials/s0rrow/code/places";
import { classroom, heart } from "@materials/s0rrow/code/sets";
import { bootScreen } from "@materials/s0rrow/code/chat";
import { APP_AT, BACKSPACE_AT, ChatItem, ChatView, appWindow, bubbleAt, chatScreen2, draftBox, markAt, notification, scrollTo, sendButtonAt } from "./dm";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW, lockScreen } from "@materials/s0rrow/code/phone";
import { ADVICE_MARK, CONFESSION_EDITS, FRIEND_ADVICE, GIVE_UP, HANDLE, HER, HER_CONFESSION, HER_NIGHT_DRAFT, HER_REPLY_DRAFT, HIM, HISTORY, LATE1, LATE2, LOVE, LOVE_LINE, MEI, MEI_FIRST, REST_L, REST_R, UM, afterNight, deleted, editing, fromHer, herHome, inWin, laidOut, pop, typed, typingThumbs } from "./story";
import { BAR, BEAT, EV, beatAt } from "./timeline";
import { PhoneSpec, aim, aimLerp, drawPhone, kick, lerp, pulseRings, timeCard, vignette } from "./shots";
import { HER_SIT, HIS_WIN, SIT, Z_IN, chairBack, classFromSeat, herBokeh, herDuvet, herInBed, herPhoneBack, herRoomNight, hisBokeh, hisDuvet, hisInBed, hisPhoneBack, hisRoom, nightStreet, winC } from "./world";
import { shotHesitate } from "./act2";
import { herBag, hisDesk } from "./act1";

const REST: FingerPos = REST_R;

/** her phone's conversation at a given moment of the replay / present */
function herItems(abs: number, upto: "replay" | "present"): ChatItem[] {
  const items = fromHer(HISTORY);
  if (upto === "replay") {
    const last = items.pop()!;
    if (abs >= EV.ding2) items.push({ ...last, pop: pop(abs, EV.ding2) } as ChatItem);
    if (abs >= EV.send2) items.push({ t: "msg", me: true, text: UM, pop: pop(abs, EV.send2) });
    return items;
  }
  items.push({ t: "msg", me: true, text: UM });
  items.push({ t: "msg", text: GIVE_UP });
  if (abs >= EV.send3) items.push({ t: "msg", me: true, text: HER_CONFESSION, pop: pop(abs, EV.send3, 0.25) });
  return items;
}

function littleHearts(c: Ctx, abs: number, t0: number, x: number, y: number, n = 5) {
  if (abs < t0) return;
  for (let i = 0; i < n; i++) {
    const t = ((abs - t0) * 0.9 + i * 0.21) % 1;
    c.save();
    c.globalAlpha = (1 - t) * clamp((abs - t0) * 4);
    heart(c, x + Math.sin(i * 2.3 + abs * 2) * 140, y - t * 320, 18 + (i % 3) * 8, "#ff7fa8", 3800 + i);
    c.restore();
  }
}

/** her, in her room, close: the room out of focus behind (it moves less), her lit by the lamp and the phone */
function herClose(c: Ctx, abs: number, o: { z: number; fy: number; rot?: number; lamp?: number; phone: number; pose: Parameters<typeof drawKid>[4]; sob?: number; extra?: (c: Ctx) => void }) {
  const lamp = o.lamp ?? 1;
  const hx = HER_SIT.x,
    hy = HER_SIT.y;
  const zb = 1 + (o.z - 1) * 0.45;
  fillBg(c, "#140d1c");
  filtered(c, "blur(6px)", (b) => {
    camera(b, hx, hy, zb, (o.rot ?? 0) * 0.6, 540 - hx, o.fy - hy);
    herRoomNight(b, abs, { lamp });
  }, "herCloseRoom");
  c.save();
  camera(c, hx, hy, o.z, o.rot ?? 0, 540 - hx, o.fy - hy);
  herInBed(c, { ...o.pose }, { lamp, phone: o.phone, y: hy + (o.sob ?? 0) });
  herDuvet(c, 1 - lamp);
  o.extra?.(c);
  c.restore();
  vignette(c, 0.4, 540, o.fy + 120, 360, 1250);
}

// ---------------------------------------------------------------- A · the 「嗯」, from her side (a memory)
/** 23:12: his long message lands; she squeals — hands to her cheeks, bright red, little hearts (a quick push: excited) */
function shotThrilled(c: Ctx, abs: number) {
  const happy = abs > EV.ding2 + 0.08;
  const k = backOutish(phase(abs, EV.ding2, EV.ding2 + 0.3));
  herClose(c, abs, {
    z: 1.6 * (1 + 0.06 * k),
    fy: 820,
    phone: happy ? 0.6 : 1,
    pose: happy
      ? { eyes: "happy", mouth: "grin", blush: 1, tilt: -0.08 * Math.sin((abs - EV.ding2) * 9), arms: "custom", handL: [-56, 312], handR: [56, 312], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => herPhoneBack(q, 0, 262, 92, 176, 0) }
      : { eyes: "open", mouth: "flat", blush: 0.4, look: [0, 0.6], arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => herPhoneBack(q, 0, 236, 92, 176, 0) },
    extra: (q) => {
      if (happy) littleHearts(q, abs, EV.ding2 + 0.1, HER_SIT.x, HER_SIT.y - 120);
    },
  });
  // the phone lights up in her hands first
  if (!happy) glow(c, 540, 1180, 380, `rgba(200,220,255,${(0.35 * (1 - phase(abs, EV.ding2, EV.ding2 + 0.2))).toFixed(3)})`);
}
const backOutish = (t: number) => {
  const v = clamp(t);
  return 1 + 2.9 * Math.pow(v - 1, 3) + 1.9 * Math.pow(v - 1, 2);
};

/** her phone in the replay: his long message comes in, she types (and deletes) her reply, and sends "k" */
function replayView(abs: number, umTyped = Infinity): ChatView {
  let draft = "";
  if (abs < EV.del3[0]) draft = typed(HER_REPLY_DRAFT, abs, EV.type3[0], EV.type3[1]);
  else if (abs < EV.del3[1]) draft = deleted(HER_REPLY_DRAFT, abs, EV.del3[0], EV.del3[1]);
  else if (abs < EV.send2) draft = abs > umTyped ? UM : "";
  return { title: HIM, handle: HANDLE[HIM], time: "11:13", me: "girl", them: "boy", items: herItems(abs, "replay"), dark: true, draft: abs < EV.send2 ? draft : "", caret: abs < EV.send2, keyboard: true, sendHot: abs > EV.send2 - 0.08 && abs < EV.send2 ? 1 : 0 };
}
/** her "k" once it's sent (screen units) */
function sentUm(c: Ctx): Pt {
  const v = replayView(EV.send2 + 0.3);
  const b = bubbleAt(c, v, v.items.length - 1) ?? { x: 518, y: 626, w: 64, h: 86 };
  return [b.x + b.w / 2, b.y + b.h / 2];
}
/** after she sends the "k" the camera pushes in on its bubble and brings it towards the middle (the phone sits at
 *  (540, 960), scale 1, until then) */
function umSpot(abs: number, um: Pt) {
  const zk = smooth(phase(abs, EV.send2 + 0.08, EV.send2 + 0.55));
  const x0 = 540 + (um[0] - 300),
    y0 = 960 + (um[1] - 640);
  return { ux: x0 + (590 - x0) * zk, uy: y0 + (880 - y0) * zk, zs: 1.0 + 0.38 * zk };
}
/** types a long happy reply → 小美's message drops in → she opens it and reads 「回个嗯就行」 → back to his chat →
 *  deletes all of it → types just 「嗯」 → sends; the camera holds on that 「嗯」 (the one he got at 0:01.86) */
function shotReplay(c: Ctx, abs: number) {
  const umTyped = EV.del3[1] + 0.04;
  const view = replayView(abs, umTyped);
  const meiK = smooth(phase(abs, EV.openNote, EV.openNote + 0.25)) * (1 - smooth(phase(abs, EV.backToHim, EV.backToHim + 0.25)));
  // her chat with Mia: the three lines sit at the top, under the header
  const meiBase: ChatView = {
    title: MEI,
    handle: HANDLE[MEI],
    time: "11:13",
    me: "girl",
    them: "mei",
    items: [
      { t: "time", text: "11:12 PM" },
      { t: "msg", me: true, text: MEI_FIRST },
      { t: "msg", text: FRIEND_ADVICE, mark: ADVICE_MARK, markK: smooth(phase(abs, EV.openNote + 0.35, EV.openNote + 0.7)) },
    ],
    dark: true,
  };
  const meiView = { ...meiBase, scroll: scrollTo(c, meiBase, 0, 176) };
  const um = sentUm(c);
  const { ux, uy, zs } = umSpot(abs, um);
  let cx = ux - (um[0] - 300) * zs,
    cy = uy - (um[1] - 640) * zs,
    s = zs;
  const rd = smooth(phase(abs, EV.openNote + 0.15, EV.openNote + 0.55)) * (1 - smooth(phase(abs, EV.backToHim, EV.backToHim + 0.3)));
  const mk = rd > 0 ? markAt(c, meiView) : null;
  if (mk) {
    const sR = 1.22,
      ax = mk.x + mk.w / 2,
      ay = mk.y + mk.h / 2;
    cx += (540 - (ax - 300) * sR - cx) * rd;
    cy += (880 - (ay - 640) * sR - cy) * rd;
    s += (sR - s) * rd;
  }
  let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
  const tap = (t: number, x: number, y: number): FingerPos => ({ x, y: y + 30 * (1 - smooth(phase(abs, t - 0.14, t - 0.03))), touch: abs > t - 0.04 ? 1 : 0 });
  if (inWin(abs, EV.type3)) hands = typingThumbs(abs, EV.type3[0], EV.type3[1], 31);
  else if (abs >= EV.openNote - 0.14 && abs < EV.openNote + 0.06) hands = { right: tap(EV.openNote, 300, 160), left: REST_L };
  else if (abs >= EV.backToHim - 0.14 && abs < EV.backToHim + 0.06) hands = { right: tap(EV.backToHim, 42, 118), left: REST_L };
  else if (inWin(abs, EV.del3)) {
    const k = ((abs - EV.del3[0]) * 12) % 1;
    hands = { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: k < 0.5 ? 1 : 0.4 }, left: REST_L };
  } else if (abs > EV.del3[1] && abs < EV.send2 + 0.12) {
    const sb = sendButtonAt(c, { ...view, draft: UM });
    const onKey = abs < umTyped + 0.05;
    hands = { right: { x: onKey ? 300 : sb[0], y: onKey ? 1000 : sb[1], touch: (abs > umTyped - 0.04 && abs < umTyped + 0.03) || (abs > EV.send2 - 0.06 && abs < EV.send2 + 0.08) ? 1 : 0 }, left: REST_L };
  }
  herBokeh(c, abs, { zoom: 1.1 });
  drawPhone(c, abs, { cx, cy, s, rot: 0 }, (q) => {
    q.save();
    q.translate(-0.3 * SW * meiK, 0);
    chatScreen2(q, abs, view);
    q.restore();
    if (meiK > 0) {
      q.fillStyle = `rgba(0,0,0,${(0.35 * meiK).toFixed(3)})`;
      q.fillRect(0, 0, SW, SH);
      q.save();
      q.translate(SW * (1 - meiK), 0);
      chatScreen2(q, abs, meiView);
      q.fillStyle = "rgba(0,0,0,0.35)";
      q.fillRect(-14, 0, 14, SH);
      q.restore();
    }
    const nk = smooth(phase(abs, EV.friendNote, EV.friendNote + 0.18)) * (1 - smooth(phase(abs, EV.openNote, EV.openNote + 0.15)));
    if (nk > 0) {
      q.save();
      q.translate(0, -160 * (1 - nk));
      notification(q, 24, 84, 552, { title: MEI, body: FRIEND_ADVICE, time: "now" }, nk);
      q.restore();
    }
  }, { thumbs: [hands.right, hands.left], haloRgb: "255,180,210" });
}

// ---------------------------------------------------------------- B · class, her side
/** B1 · 37.39 → 38.41 that class, from her side — the same picture as his memory (8.76–9.79: from his seat, over his
 *  desk, her chair back in front of her, the sun from the windows), so we know the moment: she has turned round and
 *  the book snaps up in front of her face, exactly as he saw it. Then what he couldn't see: the book comes down just
 *  far enough for her eyes to peek over it — at him (at us) — bright red, smoking, little hearts rising from her head.
 *  The camera: the same jolt as his on the snap, then it's drawn in towards her eyes faster and faster (pow 2.2),
 *  throbbing with her heartbeat. */
function shotBook(c: Ctx, abs: number) {
  const gx = 540,
    gy = 860,
    gs = 1.05;
  const snap = backOut(phase(abs, EV.hide2, EV.hide2 + 0.16));
  const peek = smooth(phase(abs, EV.peek, EV.peek + 0.22));
  const pull = Math.pow(phase(abs, EV.peek, EV.afterClass), 2.2);
  const beat = pulse(abs, 6);
  const z = (1.1 + 0.05 * snap) * (1 + 0.16 * pull) * (1 + 0.012 * beat * peek);
  // her eyes (where the push goes)
  const ey = gy + 36 * gs;
  filtered(c, "blur(3.2px)", (b) => {
    camera(b, 540, 900, 1.13 + 0.06 * pull, 0, 0, -30);
    classFromSeat(b, abs, { sun: 1 });
  }, "bookClass");
  c.save();
  // the push centres more and more on her eyes
  camera(c, gx, lerp(gy + 120, ey, pull), z);
  const chairY = gy + 300 * gs;
  // the book: snapped up over her face, then down just below her eyes
  const by = gy + lerp(lerp(420, 110, snap), 262, peek) * gs;
  // her arms: up at the book's sides while it covers her face, then straight down behind it (in between, bent arms
  // would stick out from behind the book like wings)
  const hy = peek < 0.4 ? 170 : 430;
  rimFigure(c, (q) =>
    drawKid(q, gx, gy, gs, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: peek > 0.3 ? "open" : "shut",
      brows: "worried",
      mouth: "bite",
      blush: 1,
      look: [0, 0.05],
      arms: "custom",
      handL: [-140, hy],
      handR: [140, hy],
      shapeL: "hidden",
      shapeR: "hidden",
    }), -1, -0.4, "rgb(255,236,200)", 0.6, 6);
  chairBack(c, gx, chairY, gs);
  const rot = -0.05 + 0.03 * Math.sin((abs - EV.hide2) * 18) * (1 - phase(abs, EV.hide2, EV.hide2 + 0.5));
  textbook(c, gx + 6, by, gs, rot);
  bookFingers(c, gx + 6, by, gs, rot);
  // little hearts rising from her head as she peeks
  littleHearts(c, abs, EV.peek + 0.1, gx + 30, gy - 140 * gs);
  c.restore();
  // little hearts rising from her head as she peeks
  // his desk in front, closer (moves more)
  c.save();
  camera(c, 540, 1500, 1.05 + 0.1 * pull);
  hisDesk(c, abs);
  c.restore();
  vignette(c, 0.25 * pull, 540, 900, 380, 1200);
}

/** B2 · 38.41 → 39.43 after class — again his picture first (11.83: the milk he left on her empty desk, her bag beside
 *  it, the late sun): her hand comes down and takes it; the camera rises with the carton, which she lifts to her cheek
 *  — and there she is, standing at her desk with his strawberry milk against her face, eyes shut, smiling, red; little
 *  hearts. (She came back for her bag and found it; that's the milk in her wallpaper and her photos.) */
function shotMilk(c: Ctx, abs: number) {
  const t0 = EV.afterClass;
  const grab = smooth(phase(abs, t0 + 0.08, t0 + 0.3));
  const lift = smooth(phase(abs, t0 + 0.3, t0 + 0.7));
  const hug = smooth(phase(abs, t0 + 0.6, t0 + 0.8));
  // the camera: his picture (the desk, the milk, her bag) → it rises a little with the carton and leans in on her
  const rise = smooth(phase(abs, t0 + 0.3, t0 + 0.85));
  const z = (1 + 0.14 * rise) * (1 + 0.03 * smooth(phase(abs, t0 + 0.85, EV.now)));
  const cy = lerp(960, 770, rise);
  // the empty classroom in the late sun, out of focus, moving less
  filtered(c, "blur(5px)", (b) => {
    camera(b, 380, lerp(900, 820, rise), 1.6 * (1 + 0.06 * rise));
    classroom(b, abs, false);
  }, "milkClass");
  glow(c, 140, 420, 1000, "rgba(255,180,110,0.4)");
  c.save();
  camera(c, 540, cy, z, 0, 0, 960 - cy);
  // her, standing behind her desk, a little to the left of the milk: she looks down at it — he left it — takes it
  // with her right hand and lifts it to her cheek
  const kx = 420,
    ky = 400,
    ks = 1.6;
  const onDesk: Pt = [500, 900];
  const atCheek: Pt = [kx + 125 * ks, ky + 115 * ks];
  const mPos: Pt = [lerp(onDesk[0], atCheek[0], lift), lerp(onDesk[1], atCheek[1], lift)];
  const ms = lerp(2.0, 1.05, lift); // further from us as it goes up to her face
  const mr = lerp(0.03, 0.16, lift);
  const hold: Pt = [mPos[0] + 30 * ms, mPos[1] + 90 * ms];
  const rest: Pt = [kx + 118 * ks, ky + 430 * ks];
  const hand: Pt = [lerp(rest[0], hold[0], grab), lerp(rest[1], hold[1], grab)];
  rimFigure(c, (q) =>
    drawKid(q, kx, ky, ks, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: hug > 0.4 ? "happy" : "open",
      mouth: hug > 0.4 ? "smile" : "o",
      blush: 0.5 + 0.45 * hug,
      look: [0.3 - 0.3 * lift, 0.9 - 0.9 * lift],
      tilt: 0.12 * hug,
      arms: "custom",
      handR: [(hand[0] - kx) / ks, (hand[1] - ky) / ks],
      bendR: -1,
      handL: [-112, 430],
      shapeR: "hidden",
      shapeL: "hidden",
    }), -1, -0.4, "rgb(255,214,160)", 0.65, 7);
  // her desk in front of her (hides her below the waist), her bag still on it
  deskFront(c, 540, 1180, 2.0, 3913);
  herBag(c, 110, 940, 1.5, -0.04);
  strawberryMilk(c, mPos[0], mPos[1], ms, mr, 3914);
  if (grab > 0.5) {
    // her hand round the carton: a thumb on the near edge, four fingers across the front
    c.save();
    c.translate(mPos[0], mPos[1]);
    c.rotate(mr);
    c.scale(ms, ms);
    oval(c, -60, 70, 16, 22, 3915, 0.4);
    paint(c, "#f6e1c3", C.ink, 4 / ms);
    for (let j = 0; j < 4; j++) {
      rr(c, -6 + j * 3, 30 + j * 26, 72 - j * 6, 24, 12);
      paint(c, "#f6e1c3", C.ink, 4 / ms);
    }
    c.restore();
  }
  littleHearts(c, abs, t0 + 0.72, kx + 330, ky - 20);
  c.restore();
}

/** over her memory, outside the film: the time cards, and round the sent 「嗯」 two yellow pulses (like the hook) and
 *  a red-pen note — everything else was deleted */
function memoryNotes(c: Ctx, abs: number) {
  timeCard(c, abs, "Oct 6, 11:12 PM", BAR(16) + 0.4, EV.type3[0]);
  timeCard(c, abs, "That day in class", EV.hide2 + 0.05, EV.afterClass);
  // (on the right: the English card is wider and would cover her sunflower hair clip)
  timeCard(c, abs, "After school", EV.afterClass + 0.05, EV.now, true);
  if (abs <= EV.send2 || abs >= EV.umHold) return;
  const { ux, uy, zs } = umSpot(abs, sentUm(c));
  pulseRings(c, abs, ux, uy, 64 * zs, 46 * zs, [EV.send2 + 0.12, EV.send2 + 0.48]);
}
function memoryShot(c: Ctx, abs: number) {
  if (abs < EV.type3[0]) shotThrilled(c, abs);
  else if (abs < EV.umHold) shotReplay(c, abs);
  else if (abs < EV.afterClass) shotBook(c, abs);
  else shotMilk(c, abs);
}
/** into the memory: the old screen breaks up over her home screen (the last frame of act 2, held) and comes out on
 *  that night, two hours earlier */
const MEM_IN = BAR(16) + BEAT;
function intoMemory(c: Ctx, abs: number) {
  const p = phase(abs, BAR(16), MEM_IN);
  // pulled into the memory: the camera speeds up into her phone (the strawberry milk on the wallpaper) as the old
  // screen breaks up
  const z = 1 + 1.6 * Math.pow(p, 1.6);
  oldScreenCut(c, abs, p, (k) => {
    k.save();
    camera(k, 540, 1060, z);
    shotHesitate(k, BAR(16) - 0.001);
    k.restore();
  }, (k) => memoryShot(k, abs), 0.5);
}

// ---------------------------------------------------------------- C · back to 00:52: she sends everything
/** she wipes her tears with the back of her hand, sets her jaw — then looks down at the phone (the camera goes with
 *  her eyes, down to the phone) */
function shotWipe(c: Ctx, abs: number) {
  const wipe = abs < EV.wiped;
  herClose(c, abs, {
    z: 1.7,
    fy: 800,
    phone: 0.8,
    pose: {
      eyes: wipe ? "shut" : "open",
      brows: wipe ? "sad" : "angry",
      mouth: wipe ? "wobble" : "bite",
      tears: wipe ? 0.6 : 0.25,
      look: [0, 0.6],
      arms: "custom",
      handR: wipe ? [70, 70] : [50, 300],
      handL: [-50, 300],
      shapeR: wipe ? "fist" : "hold",
      shapeL: "hold",
      thumbFlip: true,
      grip: (q) => herPhoneBack(q, 0, 236, 92, 176, 0),
    },
  });
  timeCard(c, abs, "12:52 AM", EV.now + 0.05, EV.phoneAgain + 2);
}
/** C after the tears: she goes back to him — a shot for each thing she does (user: the whole stretch was one phone
 *  picture), the cuts on beats; the send and the waiting are one shot (user: the cut between them was jarring). */
const C_LOVE = beatAt(81), // 41.47 the input box, close: 「其实，我喜欢你」
  C_FACE = beatAt(83); // 42.50 her face: the send — then back into her room, waiting, falling asleep (one shot)
/** her phone at 12:58 → 3:00 (the chat with the draft being edited, or after the send) */
function herNightView(abs: number): ChatView {
  const draft = abs < EV.send3 ? laidOut(editing(abs, EV.type4[0], EV.type4[1], HER_NIGHT_DRAFT, CONFESSION_EDITS)) : "";
  const items = abs < EV.send3 ? herItems(abs, "present") : [...fromHer(HISTORY), ...afterNight("hers", abs, { conf: EV.send3, late1: EV.late1, late2: EV.late2 })];
  const time = abs < EV.late1 ? "12:58" : abs < EV.late2 ? "1:30" : "3:00";
  return { title: HIM, handle: HANDLE[HIM], time, me: "girl", them: "boy", items, dark: true, draft, caret: abs < EV.send3, keyboard: abs < EV.send3, sendHot: abs > EV.send3 - 0.1 && abs < EV.send3 ? 1 : 0 };
}
/** C1 · 39.94 → 41.47 her phone: home screen → she taps 微信 and it opens on the paragraph she left; the camera comes
 *  down with her eyes onto the phone, then — once it's open — leans in on the draft as she cuts 「其实我……」 and types
 *  a new line (careful, hopeful: slow). */
function shotOpenApp(c: Ctx, abs: number) {
  const view = herNightView(abs);
  let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
  if (inWin(abs, EV.type4)) hands = typingThumbs(abs, EV.type4[0], EV.type4[1], 41);
  else if (abs < EV.openApp + 0.06) {
    const land = smooth(phase(abs, EV.phoneAgain + 0.02, EV.openApp - 0.06));
    hands = { right: { x: APP_AT[0], y: APP_AT[1] + 40 * (1 - land), touch: abs > EV.openApp - 0.08 ? 1 : 0 }, left: hands.left };
  }
  const tap = abs > EV.openApp - 0.08 && abs < EV.openApp + 0.06 ? 1 : 0;
  const appK = smooth(phase(abs, EV.openApp, EV.openApp + 0.3));
  const arrive = 1 - Math.pow(1 - smooth(phase(abs, EV.phoneAgain, EV.phoneAgain + 0.3)), 2);
  const sb = sendButtonAt(c, { ...view, draft: CONF_DRAFT_FULL });
  const lean = smooth(phase(abs, EV.openApp + 0.25, C_LOVE));
  let p: PhoneSpec = { cx: 540, cy: 960 - 500 * (1 - arrive), s: 1.0, rot: 0 };
  p = aimLerp(p, aim(300, sb[1] - 120, 540, 960, 1.3), lean);
  herBokeh(c, abs, { dark: 0.2 + 0.1 * lean, shift: [0, (1 - arrive) * -200 + (p.cy - 960) * 0.1] });
  drawPhone(c, abs, p, (q) => {
    if (appK < 1) herHome(q, abs, "12:58", { press: tap, zoom: 1 + 0.08 * appK });
    appWindow(q, appK, APP_AT, (a) => chatScreen2(a, abs, view));
  }, { thumbs: [hands.right, hands.left], haloRgb: "255,180,210" });
  vignette(c, 0.35, 540, 900, 380, 1200);
}
/** the draft with everything in it (where the input box ends up) */
const CONF_DRAFT_FULL = laidOut(HER_CONFESSION);
/** C2 · 41.47 → 42.50 the input box, close (the whole box between the label at the top and the lyrics): 「其实，我喜欢你」
 *  typed on its own line — she takes 「喜欢你」 back out (the picture jolts with each delete), a breath — types it again,
 *  and the rest 「，很久很久了。」; then a yellow highlighter sweeps over 「我喜欢你」 (what she finally dares to say) with
 *  a small push, and it holds. The camera creeps in on the line as it's written. */
function shotLoveLine(c: Ctx, abs: number) {
  const view = herNightView(abs);
  const at = (u: number) => EV.type4[0] + (EV.type4[1] - EV.type4[0]) * u;
  const del: [number, number] = [at(CONFESSION_EDITS[3].u0), at(CONFESSION_EDITS[3].u1)];
  const retyped = at(CONFESSION_EDITS[4].u0) + (at(CONFESSION_EDITS[4].u1) - at(CONFESSION_EDITS[4].u0)) * 0.3;
  const mark = smooth(phase(abs, retyped + 0.02, retyped + 0.24));
  const j = kick(abs, del[0], 0.12);
  const press = inWin(abs, del) ? (((abs - del[0]) * 10) % 1 < 0.5 ? 1 : 0) : 0;
  const creep = smooth(phase(abs, C_LOVE, C_FACE));
  const hit = kick(abs, retyped + 0.12, 0.14);
  // the box once it holds seven lines (screen units): top 454, bottom 838; her line at y 732
  let p = aimLerp(aim(284, 650, 540, 760, 2.08, 0.02), aim(290, 660, 540, 770, 2.2, 0.005), creep);
  p = { ...p, s: p.s * (1 + 0.015 * j + 0.012 * hit), cy: p.cy + 5 * press + 10 * j };
  herBokeh(c, abs, { dark: 0.35 });
  drawPhone(c, abs, p, (q) => {
    chatScreen2(q, abs, view);
    if (mark > 0) loveMark(q, view, mark);
  }, { haloRgb: "255,180,210" });
  vignette(c, 0.45, 540, 780, 360, 1150);
}
/** the yellow highlighter over "I like you" in the input box (screen units; the box's own layout, keyboard up) */
function loveMark(q: Ctx, view: ChatView, k: number) {
  const box = draftBox(q, view);
  const j = box.lines.findIndex((l) => l.startsWith(LOVE_LINE));
  if (j < 0) return;
  const FS = 37;
  const y = box.y(j);
  const x0 = box.x + measure(q, box.lines[j].slice(0, box.lines[j].indexOf(LOVE)), FS, F.ui);
  const w = measure(q, LOVE, FS, F.ui);
  q.save();
  q.beginPath();
  q.rect(x0 - 8, y - 30, (w + 16) * k, 60);
  q.clip();
  q.fillStyle = "#ffd84a";
  q.beginPath();
  q.moveTo(x0 - 8, y - 22);
  q.lineTo(x0 + w + 8, y - 25);
  q.lineTo(x0 + w + 6, y + 24);
  q.lineTo(x0 - 6, y + 26);
  q.fill();
  text(q, LOVE, x0, y, { size: FS, font: F.ui, fill: "#1a1a1a", align: "left" });
  q.restore();
}
/** C3 · 42.50 → 44.80 one shot, no cut. Her face over the phone, in her room: her thumb is over 发送 — she holds her
 *  breath, the camera creeping in (careful); on "misery" she presses it: the screen's light jumps on her face (the same
 *  flare as his at 0:00 and 15.15 — this time it's the answer), a jolt, her eyes shut; she lets the breath out and
 *  smiles a little, the room warming, and the camera breathes out with her, back off her face — and then it just keeps
 *  going back (alone): 01:30, she sends 「你睡了吗？」 (its light flicks on her face); 03:00, 「晚安。」 — her eyes are
 *  closing, her head goes down, the screen dims and goes to sleep in her hands; the room comes into focus round her and
 *  goes cold. (The next shot is her window from across the street.) */
function shotHerSend(c: Ctx, abs: number) {
  const sent = abs >= EV.send3;
  const s3 = EV.send3,
    l1 = EV.late1,
    l2 = EV.late2;
  // the camera, beat by beat (情绪运镜: the speed changes with what she feels)
  // · 鼓起勇气 / 屏息: a straight, linear creep in on her eyes, a dutch tilt creeping in, the edges closing
  const creep = phase(abs, C_FACE, s3);
  // · 按下去: a check — 2.5% in and a jolt, the screen's light jumping on her face
  const k = kick(abs, s3, 0.12);
  const flare = sent ? Math.exp(-(abs - s3) / 0.25) : 0;
  // · 发出去了 / 松一口气: it springs back (backOut, overshooting), the tilt straightens, warm light comes up
  const relief = backOut(phase(abs, s3 + 0.08, s3 + 0.36));
  // · 期待: she watches the screen for an answer — the camera leans back in, faster and faster
  const hope = Math.pow(phase(abs, s3 + 0.4, l1), 2.2);
  // · 01:30, 03:00 — nothing came: each time the clock jumps, the camera drops back a step (fast, then easing), and
  //   between the steps it keeps drifting away; the picture sinks a little and leans (失望), the warmth drains into a
  //   cold, greyer room (孤独) — it doesn't stop going back
  const step1 = smooth(clamp((abs - l1) / 0.28)),
    step2 = smooth(clamp((abs - l2) / 0.28));
  const drift1 = phase(abs, l1 + 0.28, l2),
    drift2 = phase(abs, l2 + 0.28, EV.nightFalls + 0.2);
  let z = 1.72 + 0.12 * creep;
  z *= 1 + 0.025 * k;
  z *= Math.pow(1.6 / 1.84, relief);
  z *= Math.pow(1.68 / 1.6, hope);
  z *= Math.pow(1.3 / 1.68, step1) * Math.pow(1.24 / 1.3, drift1);
  z *= Math.pow(1.06 / 1.24, step2) * Math.pow(0.96 / 1.06, drift2);
  const zClose = 1.84,
    zWide = 1.0;
  // the head (where the camera holds while close) → the room (her in bed in the middle), by how much is in view
  const w = clamp((1 / zClose - 1 / z) / (1 / zClose - 1 / zWide));
  const lonely = clamp(0.5 * step1 + 0.5 * step2 + 0.15 * drift2);
  const hx = HER_SIT.x,
    hy = HER_SIT.y;
  const ay = lerp(hy, hy + 200, w),
    sy = lerp(790, 960, w) + 50 * lonely + Math.cos(abs * 83) * 6 * k;
  const rot = 0.03 * creep * (1 - clamp(relief)) - 0.022 * lonely;
  const drowsy = smooth(phase(abs, EV.late2 + 0.05, EV.nightFalls - 0.1));
  const sleep = smooth(phase(abs, EV.late2 + 0.2, EV.nightFalls));
  const flick = Math.max(abs >= EV.late1 ? Math.exp(-(abs - EV.late1) / 0.2) : 0, abs >= EV.late2 ? Math.exp(-(abs - EV.late2) / 0.2) : 0);
  // her room: soft and moving less while we're close, sharp and locked to her once we're back
  fillBg(c, "#140d1c");
  const blur = 6 * (1 - w);
  const zb = 1 + (z - 1) * lerp(0.45, 1, w);
  const room = (b: Ctx) => {
    camera(b, hx, ay, zb, rot * 0.6, 540 - hx, sy - ay);
    herRoomNight(b, abs, { lamp: 1 });
  };
  if (blur > 0.2) filtered(c, `blur(${blur.toFixed(1)}px)`, room, "herSendRoom");
  else {
    c.save();
    room(c);
    c.restore();
  }
  c.save();
  camera(c, hx, ay, z, rot, 540 - hx, sy - ay);
  herInBed(c, {
    // holding her breath → eyes shut on the press → a little smile (relief) → eyes on the screen, hoping → the hours:
    // sad, sleepy, asleep
    eyes: !sent ? "open" : abs < s3 + 0.35 ? "shut" : abs < s3 + 0.55 ? "happy" : drowsy > 0.6 ? "shut" : drowsy > 0.2 ? "sleepy" : "open",
    brows: !sent ? "worried" : abs < l1 ? undefined : "sad",
    mouth: !sent ? "bite" : abs < s3 + 0.35 ? "flat" : abs < l1 ? "smile" : "flat",
    tears: 0.2,
    blush: abs < l1 ? 0.45 + 0.3 * clamp(relief) : 0.4,
    look: [0, 0.6 + 0.2 * drowsy],
    tilt: 0.04 + 0.16 * drowsy,
    headY: 18 * drowsy,
    arms: "custom",
    handL: [-50, 300 + 30 * drowsy],
    handR: [50, 300 + 30 * drowsy],
    shapeL: "hold",
    shapeR: "hold",
    thumbFlip: true,
    grip: (q) => herPhoneBack(q, 0, 236 + 30 * drowsy, 92, 176, 0),
  }, { lamp: 1, phone: (0.8 + 0.6 * Math.max(flare, flick)) * (1 - 0.85 * sleep) });
  herDuvet(c, 0);
  // the screen's light over the top of the phone, onto her face (and the flare as it sends)
  c.globalCompositeOperation = "screen";
  glow(c, hx, hy + (236 - 92) * HER_SIT.s, 170, `rgba(255,190,215,${((0.22 + 0.5 * Math.max(flare, 0.6 * flick)) * (1 - sleep)).toFixed(3)})`);
  c.restore();
  // the warmth after the send (the edges let go), giving way to the cold of the hours (the edges close again)
  const warm = clamp(relief) * (1 - lonely);
  if (warm > 0) glow(c, 540, 700, 1100, `rgba(255,190,150,${(0.2 * warm).toFixed(3)})`);
  if (lonely > 0) {
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(150,160,220,${(0.3 * lonely).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
    // greyer: lay a little of the picture's own grey over it
    c.globalCompositeOperation = "saturation";
    c.fillStyle = `rgba(128,128,128,${(0.4 * lonely).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
  }
  vignette(c, 0.42 + 0.12 * creep * (sent ? 0 : 1) - 0.18 * clamp(relief) * (1 - lonely) + 0.25 * lonely, 540, lerp(910, 860, w), 360, lerp(1250, 1200, w));
  for (const [label, t0, t1] of [["1:30 AM", EV.late1, EV.late2], ["3:00 AM", EV.late2, EV.nightFalls]] as [string, number, number][]) timeCard(c, abs, label, t0 + 0.02, t1);
}
function shotSend(c: Ctx, abs: number) {
  if (abs < C_LOVE) shotOpenApp(c, abs);
  else if (abs < C_FACE) shotLoveLine(c, abs);
  else shotHerSend(c, abs);
}

// ---------------------------------------------------------------- D · the night passes
/** her room late at night: the lamp off, asleep sitting up with the phone; or the morning */
function herRoomAsleep(c: Ctx, abs: number, lamp: number) {
  herRoomNight(c, abs, { lamp, lights: lamp ? 0.8 : 0.3 });
  herInBed(c, { eyes: lamp ? "sad" : "shut", tilt: lamp ? 0.05 : 0.28, look: [0, 0.8], arms: "custom", handL: [-50, 330], handR: [50, 330], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => herPhoneBack(q, 0, 270, 92, 176, 0) }, { lamp, phone: lamp ? 1 : 0 });
  herDuvet(c, 1 - lamp);
}
/** his room at dawn: asleep, or sitting up with the phone that's been off all night */
function hisRoomDawn(c: Ctx, abs: number, day: number, up: boolean) {
  hisRoom(c, abs, { lamp: 0, dawn: day });
  if (up) hisInBed(c, { eyes: "tired", mouth: "flat", look: [0, 0.9], arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (q) => hisPhoneBack(q, 0, 236, 92, 176, 0) }, { lamp: 0, phone: 0, dawn: day });
  hisDuvet(c, 1 - day, day);
}
/** the street again, both windows. Hers goes dark (she has fallen asleep); the night runs on into morning — the moon
 *  sets, the sun comes up between the blocks — and the camera goes in through his window: 07:10 */
function shotNight(c: Ctx, abs: number) {
  const day = smooth(phase(abs, EV.herLightOff + 0.05, 45.75));
  const both: Pt = [470, 1040];
  const his = winC(HIS_WIN);
  const w = phase(abs, EV.intoHis[0], EV.intoHis[1]);
  const k = smooth(clamp(w / 0.6));
  const z0 = 1.3 + 0.08 * phase(abs, EV.nightFalls, EV.intoHis[0]);
  const Z = Math.exp(Math.log(z0) + (Math.log(Z_IN) - Math.log(z0)) * Math.pow(w, 2.2));
  const cam: Pt = [both[0] + (his[0] - both[0]) * k, both[1] + (his[1] - both[1]) * k];
  nightStreet(c, abs, cam, Z, {
    day,
    hisLit: false,
    herLit: abs < EV.herLightOff,
    hisRoom: (q) => hisRoomDawn(q, abs, day, abs > 45.9),
    herRoom: (q) => herRoomAsleep(q, abs, abs < EV.herLightOff ? 1 : 0),
  });
  timeCard(c, abs, "7:10 AM", EV.intoHis[0] + 0.15, EV.boot + 1);
}

// ---------------------------------------------------------------- E · the next morning, his phone
const NOTE_Y = 360;
/** his phone: off — he holds the power key — the logo — her three messages drop onto the lock screen a sixteenth
 *  apart (a jolt each) — he taps the first — the chat opens out of the banner and the camera speeds up into the last
 *  line of her paragraph, where the highlighter goes across 「其实，我喜欢你」 and it stops */
function shotDawn(c: Ctx, abs: number) {
  const booted = abs > 46.95;
  const appK = smooth(phase(abs, EV.tapNote + 0.03, EV.tapNote + 0.3));
  const read = Math.pow(smooth(phase(abs, EV.tapNote + 0.32, EV.read - 0.25)), 1.4);
  const s = 1.0 + 0.5 * read;
  const hk = smooth(phase(abs, EV.tapNote + 0.55, EV.tapNote + 0.85));
  const items = [...HISTORY.slice(-3), ...afterNight("his")].map((it) => (it.t === "msg" && it.text === HER_CONFESSION ? ({ ...it, mark: LOVE_LINE, markK: hk } as ChatItem) : it));
  const view: ChatView = { title: HER, handle: HANDLE[HER], time: "7:10", me: "boy", them: "girl", items, dark: false };
  const mk = markAt(c, view) ?? { x: 116, y: 580, w: 330, h: 90 };
  const ax = mk.x + mk.w / 2,
    ay = mk.y + mk.h / 2;
  const px = 540 + (ax - 300) + (540 - (540 + (ax - 300))) * read,
    py = 960 + (ay - 640) + (840 - (960 + (ay - 640))) * read;
  const cx = px - (ax - 300) * s,
    cy = py - (ay - 640) * s;
  const notes = [
    { title: HER, body: HER_CONFESSION, time: "6h ago" },
    { title: HER, body: LATE1, time: "5h ago" },
    { title: HER, body: LATE2, time: "4h ago" },
  ];
  let firstH = 166;
  const thumb: FingerPos = abs > EV.tapNote - 0.2 && abs < EV.tapNote + 0.08 ? { x: 300, y: NOTE_Y + 80 + 30 * (1 - smooth(phase(abs, EV.tapNote - 0.2, EV.tapNote - 0.04))), touch: abs > EV.tapNote - 0.05 ? 1 : 0 } : { ...REST, touch: 0 };
  const lit = abs >= EV.boot - 0.03 ? 1 : 0;
  // a jolt as each message lands
  let jolt = 0;
  for (let i = 0; i < 3; i++) {
    const t = EV.um2 + (i * BEAT) / 4;
    if (abs >= t) jolt += Math.exp(-(abs - t) / 0.08) * 0.6;
  }
  hisBokeh(c, abs, { warm: 0.5, zoom: 1 + 0.2 * read, day: 0.75 });
  drawPhone(c, abs, { cx: cx + Math.sin(abs * 80) * 5 * jolt, cy, s: s * (1 + 0.02 * jolt), rot: 0 }, (q) => {
    if (abs < EV.boot - 0.03) {
      q.fillStyle = "#050507";
      q.fillRect(0, 0, SW, SH);
      return;
    }
    if (!booted) {
      bootScreen(q, smooth(phase(abs, EV.boot - 0.03, EV.boot + 0.2)));
      return;
    }
    if (appK < 1) {
      lockScreen(q, { time: "7:10", airplane: false, battery: 0.21 }, { date: "Tuesday, October 7" });
      let y = NOTE_Y;
      notes.forEach((n, i) => {
        const k = pop(abs, EV.um2 + (i * BEAT) / 4, 0.2);
        if (k <= 0) return;
        q.save();
        q.translate(0, -60 * (1 - k));
        const h = notification(q, 24, y, 552, n, k);
        q.restore();
        if (i === 0) firstH = h;
        y += h + 14;
      });
    }
    appWindow(q, appK, [300, NOTE_Y + firstH / 2], (a) => chatScreen2(a, abs, view));
  }, { thumbs: [thumb], halo: lit * 0.8, haloRgb: "255,230,200", buttons: abs > EV.boot - 0.3 && abs < EV.boot ? 1 : 0 });
  vignette(c, 0.3 + 0.2 * read, 540, 860, 380, 1200);
}

// ---------------------------------------------------------------- F · his face as it sinks in (runs on into act 4)
/** His face in the morning, close: the room behind out of focus in the sun; the camera creeping in on him, frozen,
 *  eyes wide — then on the outro downbeat (EV.joy) a burst: a warm flash, the camera jumps back and settles, the sun
 *  comes up behind him, he beams through tears, hearts. Drawn by act 3 and act 4 so the shot runs across the layers. */
export function hisFaceReading(c: Ctx, abs: number) {
  const joy = abs >= EV.joy;
  const k = phase(abs, EV.joy, EV.joy + 0.3);
  const creep = smooth(phase(abs, EV.read, EV.joy));
  const bounce = joy ? 1 - backOutish(phase(abs, EV.joy, EV.joy + 0.35)) : 0;
  const z = joy ? 1.9 * (1.08 + 0.12 * bounce + 0.04 * smooth(phase(abs, EV.joy + 0.35, EV.reply))) : 1.9 * (1.0 + 0.16 * creep);
  const jolt = Math.exp(-Math.max(0, abs - EV.read) / 0.1);
  const hx = SIT.x,
    hy = SIT.y;
  fillBg(c, "#2a2430");
  filtered(c, "blur(6px)", (b) => {
    camera(b, hx, hy, 1 + (z - 1) * 0.45, 0, 540 - hx, 800 - hy);
    hisRoom(b, abs, { lamp: 0, dawn: 1 });
  }, "readingBg");
  if (joy) glow(c, 540, 600, 900, `rgba(255,220,160,${(0.25 + 0.3 * k).toFixed(3)})`);
  c.save();
  camera(c, hx, hy, z * (1 + 0.04 * jolt), joy ? 0 : -0.03 * creep, 540 - hx + Math.sin(abs * 90) * 8 * jolt, 800 - hy);
  hisInBed(c, {
    eyes: joy ? "happy" : "wide",
    mouth: joy ? "grin" : "o",
    brows: "up",
    blush: joy ? 0.6 + 0.4 * k : 0.25 * creep,
    look: [0, 0.6],
    tears: joy ? 0.3 : 0,
    arms: "custom",
    handL: [-50, 300],
    handR: [50, 300],
    shapeL: "hold",
    shapeR: "hold",
    thumbFlip: true,
    grip: (q) => hisPhoneBack(q, 0, 236, 92, 176, 0),
  }, { lamp: 0, phone: 0.8, dawn: 1 });
  hisDuvet(c, 0, 1, true);
  c.restore();
  if (joy && abs < EV.joy + 0.22) {
    c.fillStyle = `rgba(255,246,224,${(0.7 * (1 - phase(abs, EV.joy, EV.joy + 0.22))).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
  if (joy)
    for (let i = 0; i < 8; i++) {
      const t = ((abs - EV.joy) * 0.9 + i * 0.13) % 1;
      c.save();
      c.globalAlpha = (1 - t) * clamp((abs - EV.joy) * 5);
      heart(c, 540 + Math.sin(i * 2.1) * 360, 760 - t * 380, 22 + (i % 3) * 9, "#ff7fa8", 3930 + i);
      c.restore();
    }
  vignette(c, joy ? 0.25 : 0.4 + 0.2 * creep, 540, 820, 340, 1150);
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(16), (c, abs) => {
    if (abs < MEM_IN) intoMemory(c, abs);
    else if (abs < EV.now) {
      oldFilm(c, abs, (k) => memoryShot(k, abs), "memory");
      memoryNotes(c, abs);
    } else if (abs < EV.phoneAgain) shotWipe(c, abs);
    else if (abs < EV.nightFalls) shotSend(c, abs);
    else if (abs < EV.intoHis[1]) shotNight(c, abs);
    else if (abs < EV.read) shotDawn(c, abs);
    else hisFaceReading(c, abs);
    bloom(c, 0.2, 24);
    void H;
    void card;
    void litFigure;
    void hisBokeh;
  });
}
