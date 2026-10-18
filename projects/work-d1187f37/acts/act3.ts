// 第三幕（32.79 – 49.14）· 主歌2 · 她的视角 → 第二天（重置版：剧情和时间点不变，画面、镜头、光影按最新标准重做）
//  A 32.79–37.39 回忆（老式屏幕竖线，进回忆两拍竖线转场）：23:12 收到他那一大段，她捂着脸笑 → 打了一大段 → 小美的消息
//               → 点进去「回个嗯就行」→ 返回、全删 → 只发「嗯」（黄圈、红笔「删掉了 37 个字」）
//  B 37.39–39.43 那天上课：课本一下举起来，她从书后偷看、脸红冒烟、心跳 → 放学后她偷偷拿走他留下的草莓牛奶
//  C 39.43–44.80 回到 00:52：她擦掉眼泪 → 从主页点开微信 → 改完那段话发出去 → 01:30、03:00 又发两句 → 屏幕熄灭
//  D 44.80–46.33 那条街：她的灯也灭了，夜色延时到早晨，推进他的窗
//  E 46.33–48.63 07:10 他开机：锁屏掉下三条消息 → 点开 → 荧光笔划出「其实，我喜欢你」
//  F 48.63–     他的脸：愣住（接到第四幕的笑开）
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, bloom, camera, card, designScene, fillBg, filtered, glow, inkLine, litFigure, oldFilm, oldScreenCut, paint, pulse, rimFigure, rr, text, writeOn } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { bookFingers, strawberryMilk, textbook } from "@materials/s0rrow/code/places";
import { classroom, heart } from "@materials/s0rrow/code/sets";
import { BACKSPACE_AT, ChatItem, WECHAT_AT, appWindow, bootScreen, chatScreen2, markAt, sendButtonAt } from "@materials/s0rrow/code/chat";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW, lockScreen, notification } from "@materials/s0rrow/code/phone";
import { CONFESSION_EDITS, FRIEND_ADVICE, GIVE_UP, HER, HER_CONFESSION, HER_NIGHT_DRAFT, HER_REPLY_DRAFT, HIM, HISTORY, LATE1, LATE2, MEI, MEI_FIRST, REST_L, REST_R, afterNight, deleted, editing, fromHer, herHome, inWin, pop, typed, typingThumbs } from "./story";
import { BAR, BEAT, EV } from "./timeline";
import { PhoneSpec, drawPhone, lerp, pulseRings, softStart, timeCard, vignette } from "./shots";
import { HER_SIT, HIS_WIN, SIT, Z_IN, herBokeh, herDuvet, herInBed, herPhoneBack, herRoomNight, hisBokeh, hisDuvet, hisInBed, hisPhoneBack, hisRoom, nightStreet, winC } from "./world";
import { shotHesitate } from "./act2";

const REST: FingerPos = REST_R;

/** her phone's conversation at a given moment of the replay / present */
function herItems(abs: number, upto: "replay" | "present"): ChatItem[] {
  const items = fromHer(HISTORY);
  if (upto === "replay") {
    const last = items.pop()!;
    if (abs >= EV.ding2) items.push({ ...last, pop: pop(abs, EV.ding2) } as ChatItem);
    if (abs >= EV.send2) items.push({ t: "msg", me: true, text: "嗯", pop: pop(abs, EV.send2) });
    return items;
  }
  items.push({ t: "msg", me: true, text: "嗯" });
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

/** after she sends the 「嗯」 the camera pushes in on its bubble and brings it towards the middle */
function umSpot(abs: number) {
  const zk = smooth(phase(abs, EV.send2 + 0.08, EV.send2 + 0.55));
  return { ux: 694 + (590 - 694) * zk, uy: 942 + (880 - 942) * zk, zs: 1.0 + 0.38 * zk };
}
/** types a long happy reply → 小美's message drops in → she opens it and reads 「回个嗯就行」 → back to his chat →
 *  deletes all of it → types just 「嗯」 → sends; the camera holds on that 「嗯」 (the one he got at 0:01.86) */
function shotReplay(c: Ctx, abs: number) {
  const umTyped = EV.del3[1] + 0.04;
  let draft = "";
  if (abs < EV.del3[0]) draft = typed(HER_REPLY_DRAFT, abs, EV.type3[0], EV.type3[1]);
  else if (abs < EV.del3[1]) draft = deleted(HER_REPLY_DRAFT, abs, EV.del3[0], EV.del3[1]);
  else if (abs < EV.send2) draft = abs > umTyped ? "嗯" : "";
  const view = { title: HIM, time: "23:13", me: "girl" as const, them: "boy" as const, items: herItems(abs, "replay"), dark: true, draft: abs < EV.send2 ? draft : "", caret: abs < EV.send2, keyboard: true, sendHot: abs > EV.send2 - 0.08 && abs < EV.send2 ? 1 : 0 };
  const meiK = smooth(phase(abs, EV.openNote, EV.openNote + 0.25)) * (1 - smooth(phase(abs, EV.backToHim, EV.backToHim + 0.25)));
  const meiView = {
    title: MEI,
    time: "23:13",
    me: "girl" as const,
    them: "mei" as const,
    items: [
      { t: "time", text: "23:12" },
      { t: "msg", me: true, text: MEI_FIRST },
      { t: "msg", text: FRIEND_ADVICE, mark: "回个嗯就行", markK: smooth(phase(abs, EV.openNote + 0.35, EV.openNote + 0.7)) },
    ] as ChatItem[],
    dark: true,
    scroll: -470,
  };
  const { ux, uy, zs } = umSpot(abs);
  let cx = ux - (454 - 300) * zs,
    cy = uy - (622 - 640) * zs,
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
  else if (abs >= EV.openNote - 0.14 && abs < EV.openNote + 0.06) hands = { right: tap(EV.openNote, 300, 100), left: REST_L };
  else if (abs >= EV.backToHim - 0.14 && abs < EV.backToHim + 0.06) hands = { right: tap(EV.backToHim, 42, 118), left: REST_L };
  else if (inWin(abs, EV.del3)) {
    const k = ((abs - EV.del3[0]) * 12) % 1;
    hands = { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: k < 0.5 ? 1 : 0.4 }, left: REST_L };
  } else if (abs > EV.del3[1] && abs < EV.send2 + 0.12) {
    const sb = sendButtonAt(c, { ...view, draft: "嗯" });
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
      notification(q, 24, 24, 552, { title: MEI, body: FRIEND_ADVICE, time: "现在" }, nk);
      q.restore();
    }
  }, { thumbs: [hands.right, hands.left], haloRgb: "255,180,210" });
}

// ---------------------------------------------------------------- B · class, her side
/** behind the book: it comes up fast, then the camera pushes in on her eyes peeking over it; sunlight from the
 *  window, the classroom soft behind; a pounding heart on the beat */
function shotBook(c: Ctx, abs: number) {
  const p = phase(abs, EV.hide2, EV.afterClass);
  const up = 1 - smooth(phase(abs, EV.hide2, EV.hide2 + 0.16));
  const beat = pulse(abs, 6);
  c.save();
  camera(c, 560, 700, 1.5);
  filtered(c, "blur(5px)", (b) => classroom(b, abs, false), "bookBg");
  c.restore();
  glow(c, 120, 300, 900, "rgba(255,236,190,0.3)");
  c.save();
  camera(c, 540, 820, 1.0 + 0.24 * smooth(p) + 0.03 * beat);
  glow(c, 540, 860, 800, "rgba(255,170,190,0.35)");
  rimFigure(c, (q) =>
    drawKid(q, 540, 860, 1.3, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: "wide",
      brows: "worried",
      mouth: "bite",
      blush: 1,
      look: (abs < EV.peek ? [0.3, 0.1] : [-0.45, 0.3]) as [number, number],
      arms: "custom",
      handL: [-128, 440],
      handR: [128, 440],
      shapeL: "hidden",
      shapeR: "hidden",
    }), -1, -0.5, "rgb(255,236,200)", 0.6, 7);
  const bookY = 860 + (66 + 196) * 1.3 + 4 * beat + 260 * up;
  textbook(c, 546, bookY, 1.3, -0.03);
  bookFingers(c, 546, bookY, 1.3, -0.03);
  c.restore();
  c.save();
  c.translate(840, 600);
  const k = 1 + 0.3 * beat;
  c.scale(k, k);
  heart(c, 0, 0, 46, "#ff4d6d", 3822);
  c.restore();
  text(c, "扑通 扑通", 820, 480, { size: 52, font: F.cn, fill: "#ff4d6d", stroke: C.ink, lw: 8, alpha: 0.6 + 0.4 * beat });
}
/** after class: the empty classroom in the late sun; she holds his strawberry milk to her cheek, eyes shut, smiling */
function shotMilk(c: Ctx, abs: number) {
  const p = phase(abs, EV.afterClass, EV.now);
  c.save();
  camera(c, 560, 900, 1.0 + 0.08 * smooth(p));
  filtered(c, "blur(4px)", (b) => classroom(b, abs, false), "milkBg");
  glow(c, 120, 520, 900, "rgba(255,190,120,0.42)");
  rimFigure(c, (q) => {
    drawKid(q, 500, 880, 1.35, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "smile", blush: 0.8, tilt: 0.1 + 0.05 * smooth(p), arms: "custom", handR: [122, 228], bendR: -1, handL: [-112, 430], shapeR: "hidden", shapeL: "hidden" });
  }, -1, -0.4, "rgb(255,214,160)", 0.65, 7);
  const mx = 500 + 175,
    my = 880 + 175;
  strawberryMilk(c, mx, my, 0.95, 0.16, 3395);
  c.save();
  c.translate(mx, my);
  c.rotate(0.16);
  c.scale(0.95, 0.95);
  for (const [fx, fy] of [[-72, 30], [-72, 62], [-72, 94], [52, 40], [52, 72]] as [number, number][]) {
    rr(c, fx, fy, 24, 28, 12);
    paint(c, "#f6e1c3", C.ink, 3.5);
  }
  c.restore();
  littleHearts(c, abs, EV.afterClass + 0.12, 640, 640);
  c.restore();
}

/** over her memory, outside the film: the time cards, and round the sent 「嗯」 two yellow pulses (like the hook) and
 *  a red-pen note — everything else was deleted */
function memoryNotes(c: Ctx, abs: number) {
  timeCard(c, abs, "10月6日 23:12", BAR(16) + 0.4, EV.type3[0]);
  timeCard(c, abs, "那天上课", EV.hide2 + 0.05, EV.afterClass);
  timeCard(c, abs, "放学后", EV.afterClass + 0.05, EV.now);
  if (abs <= EV.send2 || abs >= EV.umHold) return;
  const { ux, uy, zs } = umSpot(abs);
  pulseRings(c, abs, ux, uy, 64 * zs, 46 * zs, [EV.send2 + 0.12, EV.send2 + 0.48]);
  const nk = phase(abs, EV.send2 + 0.3, EV.send2 + 0.75);
  if (nk > 0) {
    c.save();
    c.translate(ux - 40, uy + 150);
    c.rotate(-0.04);
    text(c, writeOn(`删掉了 ${Array.from(HER_REPLY_DRAFT).length} 个字`, nk), 0, 0, { size: 60, font: F.pen, fill: "#ff3b3b", stroke: "#fff", lw: 10 });
    c.restore();
    c.save();
    c.globalAlpha = clamp(nk * 3);
    inkLine(c, [[ux - 20, uy + 104], [ux - 6, uy + 70], [ux + 4, uy + 56]], 3840, 6, "#ff3b3b");
    inkLine(c, [[ux - 16, uy + 66], [ux + 4, uy + 56], [ux + 10, uy + 78]], 3841, 6, "#ff3b3b");
    c.restore();
  }
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
  oldScreenCut(c, abs, p, (k) => shotHesitate(k, Math.min(abs, BAR(16) - 0.001)), (k) => memoryShot(k, abs), 0.5);
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
  timeCard(c, abs, "00:52", EV.now + 0.05, EV.phoneAgain + 2);
}
function shotSend(c: Ctx, abs: number) {
  const draft = abs < EV.send3 ? editing(abs, EV.type4[0], EV.type4[1], HER_NIGHT_DRAFT, CONFESSION_EDITS) : "";
  const items = abs < EV.send3 ? herItems(abs, "present") : [...fromHer(HISTORY), ...afterNight("hers", abs, { conf: EV.send3, late1: EV.late1, late2: EV.late2 })];
  const time = abs < EV.late1 ? "00:58" : abs < EV.late2 ? "01:30" : "03:00";
  const view = { title: HIM, time, me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: abs < EV.send3, keyboard: abs < EV.send3, sendHot: abs > EV.send3 - 0.1 && abs < EV.send3 ? 1 : 0 };
  const sleep = smooth(phase(abs, EV.late2 + 0.2, EV.nightFalls));
  const lapse = smooth(phase(abs, EV.send3 + 0.4, EV.late1));
  let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
  if (inWin(abs, EV.type4)) hands = typingThumbs(abs, EV.type4[0], EV.type4[1], 41);
  else if (abs >= EV.type4[1] && abs < EV.send3 + 0.2) {
    const sb = sendButtonAt(c, { ...view, draft: HER_CONFESSION });
    const shaky = Math.sin(abs * 23) * 6;
    hands = { right: { x: sb[0] + shaky, y: sb[1] + (abs < EV.send3 - 0.08 ? 50 : 0), touch: abs > EV.send3 - 0.08 && abs < EV.send3 + 0.12 ? 1 : 0 }, left: hands.left };
  } else if (abs < EV.openApp + 0.06) {
    const land = smooth(phase(abs, EV.phoneAgain + 0.02, EV.openApp - 0.06));
    hands = { right: { x: WECHAT_AT[0], y: WECHAT_AT[1] + 40 * (1 - land), touch: abs > EV.openApp - 0.08 ? 1 : 0 }, left: hands.left };
  }
  const tap = abs > EV.openApp - 0.08 && abs < EV.openApp + 0.06 ? 1 : 0;
  const appK = smooth(phase(abs, EV.openApp, EV.openApp + 0.3));
  // the camera: comes down with her eyes onto the phone; still while she writes; on the send, a breath back and the
  // room warms; then the night: it drifts back and the room goes cold as the hours pass
  const arrive = 1 - Math.pow(1 - smooth(phase(abs, EV.phoneAgain, EV.phoneAgain + 0.3)), 2);
  const sent = phase(abs, EV.send3, EV.send3 + 0.35);
  const p: PhoneSpec = { cx: 540, cy: 960 - 30 * lapse + (1 - arrive) * -500, s: 1.0 - 0.06 * lapse + 0.03 * (1 - softStart(sent)) * (abs > EV.send3 ? 1 : 0), rot: 0 };
  herBokeh(c, abs, { dark: 0.2 + 0.6 * lapse + 0.2 * sleep, warm: abs > EV.send3 ? 0.6 * (1 - lapse) : 0, shift: [0, (1 - arrive) * -200] });
  drawPhone(c, abs, p, (q) => {
    if (appK < 1) herHome(q, abs, "00:58", { press: tap, zoom: 1 + 0.08 * appK });
    appWindow(q, appK, WECHAT_AT, (a) => chatScreen2(a, abs, view));
    if (sleep > 0) {
      q.fillStyle = `rgba(0,0,0,${(0.9 * sleep).toFixed(3)})`;
      q.fillRect(0, 0, SW, SH);
    }
  }, { thumbs: [hands.right, hands.left], haloRgb: "255,180,210", halo: 1 - 0.8 * sleep });
  for (const [label, t0, t1] of [["01:30", EV.late1, EV.late2], ["03:00", EV.late2, EV.nightFalls]] as [string, number, number][]) timeCard(c, abs, label, t0 - 0.05, t1);
  vignette(c, 0.35 + 0.3 * lapse, 540, 900, 380, 1200);
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
  timeCard(c, abs, "07:10", EV.intoHis[0] + 0.15, EV.boot + 1);
}

// ---------------------------------------------------------------- E · the next morning, his phone
const LOVE_LINE = "其实，我喜欢你，很久很久了。";
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
  const view = { title: HER, time: "07:10", me: "boy" as const, them: "girl" as const, items, dark: false };
  const mk = markAt(c, view) ?? { x: 116, y: 580, w: 330, h: 90 };
  const ax = mk.x + mk.w / 2,
    ay = mk.y + mk.h / 2;
  const px = 540 + (ax - 300) + (540 - (540 + (ax - 300))) * read,
    py = 960 + (ay - 640) + (840 - (960 + (ay - 640))) * read;
  const cx = px - (ax - 300) * s,
    cy = py - (ay - 640) * s;
  const notes = [
    { title: HER, body: HER_CONFESSION, time: "00:58" },
    { title: HER, body: LATE1, time: "01:30" },
    { title: HER, body: LATE2, time: "03:00" },
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
      lockScreen(q, { time: "07:10", airplane: false, battery: 0.21 }, { date: "10月7日 星期二" });
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
