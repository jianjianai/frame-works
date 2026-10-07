import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, blob, camera, card, designScene, fillBg, glow, inkLine, paint, text, writeOn, pulse, filtered, rr } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { bedBlanket, bedroom, bookFingers, herBlanket, herRoom, huggedPillow, textbook, classroomFront, strawberryMilk } from "./lib/places";
import { heart } from "./lib/sets";
import { BACKSPACE_AT, ChatItem, WECHAT_AT, appWindow, bootScreen, chatScreen2, markAt, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { SH, SW, lockScreen, notification } from "./lib/phone";
import { FRIEND_ADVICE, GIVE_UP, HER, PHONE_CY, PHONE_S, REST_L, REST_R, HER_CONFESSION, HER_REPLY_DRAFT, HIM, HISTORY, deleted, fromHer, hisClassFace, hisFaceReading, inWin, phoneCloseup, pop, typed, typingThumbs, editing, CONFESSION_EDITS, HER_NIGHT_DRAFT, herHome, oldFilm, afterNight, LATE1, LATE2, hisRoomMorning, herRoomAt } from "./lib/story";
import { HIS_WIN, Z_IN, street, winC } from "./lib/street";
import { BAR, EV } from "./lib/timeline";

/** ACT 3 (32.79 – 49.14s) · verse 2 · 她的视角
 *  3A her memory (on old film, like his in act 1) — 23:12: his long message lands; she squeals, types a long happy reply… her friend's advice
 *     pops up — she deletes it all and sends 「嗯」 (that's why 「对方正在输入...」 flickered)
 *  3B class, her side: he smiled at her when their eyes met — she went bright red behind the book ("You never ever pay attention to me")
 *  3C back to 00:52: she wipes her tears, opens 微信 again from her home screen, rewrites the paragraph and sends it —
 *     he never answers; she falls asleep
 *  3D 07:10 his room: the phone has been off all night; he turns it on and her message lands */

const REST: FingerPos = REST_R;

/** her phone's conversation at a given moment of the replay / present */
function herItems(abs: number, upto: "replay" | "present"): ChatItem[] {
  const items = fromHer(HISTORY);
  if (upto === "replay") {
    // the latest message from him is still arriving in the replay
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

function littleHearts(ctx: Ctx, abs: number, t0: number, x: number, y: number, n = 5) {
  for (let i = 0; i < n; i++) {
    const t = ((abs - t0) * 0.9 + i * 0.21) % 1;
    if (abs < t0) return;
    ctx.save();
    ctx.globalAlpha = (1 - t) * clamp((abs - t0) * 4);
    heart(ctx, x + Math.sin(i * 2.3 + abs * 2) * 120, y - t * 300, 16 + (i % 3) * 7, "#ff7fa8", 3800 + i);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 3A the 「嗯」, from her side
function shotReplay(ctx: Ctx, abs: number) {
  if (abs < 33.6) {
    const happy = abs > EV.ding2 + 0.08;
    ctx.save();
    camera(ctx, 420, 900, 1.08);
    herRoom(ctx, abs, { lights: 1 });
    drawKid(ctx, 330, 700, 0.66, {
      who: "girl",
      outfit: "pajamas",
      body: "full",
      legs: "sitFloor",
      eyes: happy ? "happy" : "open",
      mouth: happy ? "grin" : "flat",
      blush: happy ? 1 : 0.4,
      look: [0.2, 0.9],
      arms: happy ? "face" : "phone",
    });
    herBlanket(ctx);
    if (happy) littleHearts(ctx, abs, EV.ding2 + 0.1, 330, 520);
    ctx.restore();
    return;
  }
  if (abs < EV.umHold) {
    // types a long happy reply → her friend's advice → deletes it all → types just 「嗯」 → sends,
    // and the chat holds on that 「嗯」 so it sinks in (it's the same 「嗯」 he got at 0:01.85)
    const umTyped = EV.send2 - 0.17;
    let draft = "";
    if (abs < EV.del3[0]) draft = typed(HER_REPLY_DRAFT, abs, EV.type3[0], EV.type3[1]);
    else if (abs < EV.del3[1]) draft = deleted(HER_REPLY_DRAFT, abs, EV.del3[0], EV.del3[1]);
    else if (abs < EV.send2) draft = abs > umTyped ? "嗯" : "";
    const view = { title: HIM, time: "23:13", me: "girl" as const, them: "boy" as const, items: herItems(abs, "replay"), dark: true, draft: abs < EV.send2 ? draft : "", caret: abs < EV.send2, keyboard: true, sendHot: abs > EV.send2 - 0.08 && abs < EV.send2 ? 1 : 0 };
    const { ux, uy, zs } = umSpot(abs);
    const zx = ux - (454 - 300) * zs,
      zy = uy - (622 - 640) * zs;
    let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
    if (inWin(abs, EV.type3)) hands = typingThumbs(abs, EV.type3[0], EV.type3[1], 31);
    else if (inWin(abs, EV.del3)) {
      const f = ((abs - EV.del3[0]) * 12) % 1;
      hands = { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.4 }, left: hands.left };
    } else if (abs > EV.del3[1] && abs < EV.send2 + 0.12) {
      // one tap on 「嗯」's key, then send
      const sb = sendButtonAt(ctx, { ...view, draft: "嗯" });
      const onKey = abs < umTyped + 0.05;
      hands = { right: { x: onKey ? 300 : sb[0], y: onKey ? 1000 : sb[1], touch: (abs > umTyped - 0.04 && abs < umTyped + 0.03) || (abs > EV.send2 - 0.06 && abs < EV.send2 + 0.08) ? 1 : 0.2 }, left: hands.left };
    } else if (abs > EV.type3[1] && abs < EV.del3[0]) {
      // hovering over send… hesitating
      const sb = sendButtonAt(ctx, view);
      hands = { right: { x: sb[0], y: sb[1] + 40, touch: 0 }, left: hands.left };
    }
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        chatScreen2(c, abs, view);
        const nk = smooth(phase(abs, EV.friendNote, EV.friendNote + 0.18)) * (1 - smooth(phase(abs, EV.del3[0] + 0.1, EV.del3[0] + 0.3)));
        if (nk > 0) {
          c.save();
          c.translate(0, -160 * (1 - nk));
          notification(c, 24, 24, 552, { title: "小美", body: FRIEND_ADVICE, time: "现在" }, nk);
          c.restore();
        }
      },
      { who: "girl", cx: zx, cy: zy, s: zs, glowCol: "rgba(255,170,200,0.22)", ...hands },
    );
    return;
  }
  // regret: she hugs her pillow tight, chin on top of it
  ctx.save();
  camera(ctx, 400, 860, 1.25);
  herRoom(ctx, abs, { lights: 1 });
  const squeeze = 1 + 0.02 * Math.sin((abs - EV.umHold) * 9);
  drawKid(ctx, 340, 700, 0.66, {
    who: "girl",
    outfit: "pajamas",
    body: "full",
    legs: "sitFloor",
    eyes: "shut",
    mouth: "wobble",
    brows: "sad",
    blush: 0.7,
    tilt: 0.1,
    headY: 14,
    arms: "custom",
    handL: [-60, 300],
    handR: [60, 300],
    shapeL: "hidden",
    shapeR: "hidden",
  });
  huggedPillow(ctx, 340, 700, 0.66 * squeeze, "#f3b6c4", "#fff4f6", "#f6e1c3", 3810);
  herBlanket(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------- 3B class, her side
/** "You never ever pay attention to me", three shots on the beat (each one new): she turns round and he is smiling
 *  at her → up goes the book, she peeks over it, bright red, heart pounding → after class she slips back into the
 *  empty classroom and takes the strawberry milk he left, holding it to her cheek (why it is her wallpaper) */
function shotSchool(ctx: Ctx, abs: number) {
  if (abs < EV.hide2) {
    // what she saw when she turned round: him, smiling at her
    hisClassFace(ctx, abs, BAR(18), "smile");
    return;
  }
  if (abs < EV.afterClass) {
    // behind the book: it comes up fast, then the camera pushes in on her eyes peeking over it
    const p = phase(abs, EV.hide2, EV.afterClass);
    const up = 1 - smooth(phase(abs, EV.hide2, EV.hide2 + 0.16));
    const beat = pulse(abs, 6);
    fillBg(ctx, "#efe6cf");
    ctx.save();
    camera(ctx, 540, 820, 1.0 + 0.24 * smooth(p) + 0.03 * beat);
    glow(ctx, 540, 860, 800, "rgba(255,170,190,0.4)");
    drawKid(ctx, 540, 860, 1.3, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: "wide",
      brows: "worried",
      mouth: "bite",
      blush: 1,
      look: (abs < 37.85 ? [0.3, 0.1] : [-0.45, 0.3]) as [number, number],
      arms: "custom",
      // arms straight down behind the book (bent elbows would stick out at the sides)
      handL: [-128, 440],
      handR: [128, 440],
      shapeL: "hidden",
      shapeR: "hidden",
    });
    const bookY = 860 + (66 + 196) * 1.3 + 4 * beat + 260 * up;
    textbook(ctx, 546, bookY, 1.3, -0.03);
    bookFingers(ctx, 546, bookY, 1.3, -0.03);
    ctx.restore();
    // pounding heart doodle + 扑通, on the beat
    ctx.save();
    ctx.translate(840, 600);
    const k = 1 + 0.3 * beat;
    ctx.scale(k, k);
    heart(ctx, 0, 0, 46, "#ff4d6d", 3822);
    ctx.restore();
    text(ctx, "扑通 扑通", 820, 480, { size: 52, font: F.cn, fill: "#ff4d6d", stroke: C.ink, lw: 8, alpha: 0.6 + 0.4 * beat });
    return;
  }
  // after class: the empty classroom in the evening sun; she holds his strawberry milk to her cheek, eyes shut, smiling
  const p = phase(abs, EV.afterClass, EV.now);
  ctx.save();
  camera(ctx, 560, 900, 1.0 + 0.08 * smooth(p));
  filtered(ctx, "blur(3px)", (c) => classroomFront(c, abs, { sun: 1 }), "afterClassBg");
  glow(ctx, 900, 520, 760, "rgba(255,200,130,0.4)");
  const lean = 0.1 + 0.05 * smooth(p);
  drawKid(ctx, 500, 880, 1.35, {
    who: "girl",
    outfit: "cardigan",
    body: "bust",
    eyes: "happy",
    mouth: "smile",
    blush: 0.8,
    tilt: lean,
    arms: "custom",
    // her right hand up under the carton, the left arm hanging at her side
    handR: [122, 228],
    bendR: -1, // elbow down: a "V" arm, not an upside-down one (the right arm bends +1 by default)
    handL: [-112, 430],
    shapeR: "hidden",
    shapeL: "hidden",
  });
  // the milk against her cheek, her fingertips round it
  const mx = 500 + 175,
    my = 880 + 175;
  strawberryMilk(ctx, mx, my, 0.95, 0.16, 3395);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(0.16);
  ctx.scale(0.95, 0.95);
  for (const [fx, fy] of [[-72, 30], [-72, 62], [-72, 94], [52, 40], [52, 72]] as [number, number][]) {
    rr(ctx, fx, fy, 24, 28, 12);
    paint(ctx, "#f6e1c3", C.ink, 3.5);
  }
  ctx.restore();
  littleHearts(ctx, abs, EV.afterClass + 0.12, 640, 640);
  ctx.restore();
}

// ---------------------------------------------------------------- 3C present: she sends everything
function shotSend(ctx: Ctx, abs: number) {
  if (abs < EV.phoneAgain) {
    ctx.save();
    camera(ctx, 420, 900, 1.1);
    herRoom(ctx, abs, { lights: 1 });
    const wipe = abs < 39.72;
    drawKid(ctx, 330, 700, 0.66, {
      who: "girl",
      outfit: "pajamas",
      body: "full",
      legs: "sitFloor",
      eyes: wipe ? "shut" : "open",
      brows: wipe ? "sad" : "up",
      mouth: wipe ? "wobble" : "bite",
      tears: wipe ? 0.6 : 0.2,
      look: [0, 0.6],
      arms: "custom",
      handR: wipe ? [70, 70] : [60, 330],
      handL: [-60, 330],
      shapeR: wipe ? "fist" : "hold",
      shapeL: "hold",
    });
    herBlanket(ctx);
    ctx.restore();
    card(ctx, "00:52", 70, 330, smooth(phase(abs, EV.now + 0.05, EV.now + 0.3)));
    return;
  }
  {
    // from her home screen she opens 微信 again — the paragraph she couldn't send is still there; she rewrites it,
    // adds to it, and sends it
    const draft = abs < EV.send3 ? editing(abs, EV.type4[0], EV.type4[1], HER_NIGHT_DRAFT, CONFESSION_EDITS) : "";
    // after sending: the clock jumps (01:30, 03:00), no answer; she sends two more, then the screen goes to sleep
    const items = abs < EV.send3 ? herItems(abs, "present") : [...fromHer(HISTORY), ...afterNight("hers", abs, { conf: EV.send3, late1: EV.late1, late2: EV.late2 })];
    const time = abs < EV.late1 ? "00:58" : abs < EV.late2 ? "01:30" : "03:00";
    const view = { title: HIM, time, me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: abs < EV.send3, keyboard: abs < EV.send3, sendHot: abs > EV.send3 - 0.1 && abs < EV.send3 ? 1 : 0 };
    const sleep = smooth(phase(abs, EV.late2 + 0.2, EV.nightFalls));
    const lapse = smooth(phase(abs, EV.send3 + 0.4, EV.late1));
    let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
    if (inWin(abs, EV.type4)) hands = typingThumbs(abs, EV.type4[0], EV.type4[1], 41);
    else if (abs >= EV.type4[1] && abs < EV.send3 + 0.2) {
      const sb = sendButtonAt(ctx, { ...view, draft: HER_CONFESSION });
      const shaky = Math.sin(abs * 23) * 6;
      hands = { right: { x: sb[0] + shaky, y: sb[1] + (abs < EV.send3 - 0.08 ? 50 : 0), touch: abs > EV.send3 - 0.08 && abs < EV.send3 + 0.12 ? 1 : 0 }, left: hands.left };
    } else if (abs < EV.openApp + 0.06) {
      // one tap on 微信
      const land = smooth(phase(abs, EV.phoneAgain + 0.02, EV.openApp - 0.06));
      hands = { right: { x: WECHAT_AT[0], y: WECHAT_AT[1] + 40 * (1 - land), touch: abs > EV.openApp - 0.08 ? 1 : 0.6 + 0.25 * land }, left: hands.left };
    }
    const tap = abs > EV.openApp - 0.08 && abs < EV.openApp + 0.06 ? 1 : 0;
    const appK = smooth(phase(abs, EV.openApp, EV.openApp + 0.3)); // the app opening out of its icon
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        if (appK < 1) herHome(c, abs, "00:58", { press: tap, zoom: 1 + 0.08 * appK });
        appWindow(c, appK, WECHAT_AT, (a) => chatScreen2(a, abs, view));
        if (sleep > 0) {
          c.fillStyle = `rgba(0,0,0,${0.88 * sleep})`;
          c.fillRect(0, 0, SW, SH);
        }
      },
      { who: "girl", cy: PHONE_CY - 30 * lapse, s: PHONE_S - 0.06 * lapse, glowCol: "rgba(255,170,200,0.24)", ...hands },
    );
    for (const [label, t0, t1] of [["01:30", EV.late1, EV.late2], ["03:00", EV.late2, EV.nightFalls]] as [string, number, number][])
      card(ctx, label, 70, 330, smooth(phase(abs, t0 - 0.05, t0 + 0.1)) * (1 - phase(abs, t1 - 0.08, t1)));
  }
}

// ---------------------------------------------------------------- 3C+ the night passes
/** 44.75 → 46.30 "…for a couple of weeks": the street again, both windows. Hers goes dark (she has fallen asleep);
 *  the night runs on into morning — the moon sets, the sun comes up between the blocks — and the camera goes in
 *  through his window: 07:10, he is sitting up with the phone that has been off all night */
function shotNight(ctx: Ctx, abs: number) {
  const day = smooth(phase(abs, 45.0, 45.7));
  const both: [number, number] = [470, 1040];
  const his = winC(HIS_WIN);
  const w = phase(abs, EV.intoHis[0], EV.intoHis[1]);
  const c = smooth(clamp(w / 0.6));
  const z0 = 1.3 + 0.08 * phase(abs, EV.nightFalls, EV.intoHis[0]);
  const Z = Math.exp(Math.log(z0) + (Math.log(Z_IN) - Math.log(z0)) * smooth(w));
  const cam: [number, number] = [both[0] + (his[0] - both[0]) * c, both[1] + (his[1] - both[1]) * c];
  street(ctx, abs, cam, Z, {
    day,
    hisLit: false,
    herLit: abs < EV.herLightOff,
    hisRoom: (k) => hisRoomMorning(k, abs, day, abs < 45.9 ? "sleep" : "tired"),
    herRoom: (k) => herRoomAt(k, abs, day, abs < EV.herLightOff ? "awake" : "asleep"),
  });
  card(ctx, "07:10", 70, 330, smooth(phase(abs, EV.intoHis[0] + 0.15, EV.intoHis[0] + 0.35)));
}

// ---------------------------------------------------------------- 3D the next morning, his side
/** the end of her paragraph, picked out with a highlighter on his phone once the chat is open */
const LOVE_LINE = "其实，我喜欢你，很久很久了。";
const NOTE_Y = 360;

function shotDawn(ctx: Ctx, abs: number) {
  if (abs >= EV.read) {
    hisFaceReading(ctx, abs);
    return;
  }
  // his phone: on — her three messages drop onto the lock screen — he taps the first — the chat opens and the camera
  // goes to the last line of her paragraph
  const booted = abs > 46.95;
  const appK = smooth(phase(abs, EV.tapNote + 0.03, EV.tapNote + 0.3));
  const read = smooth(phase(abs, EV.tapNote + 0.32, EV.read - 0.2));
  const s = 1.0 + 0.5 * read;
  // the highlighter is drawn by the chat itself, under exactly those characters, and the camera aims at the same box
  const hk = smooth(phase(abs, EV.tapNote + 0.45, EV.tapNote + 0.8));
  const items = [...HISTORY.slice(-3), ...afterNight("his")].map((it) => (it.t === "msg" && it.text === HER_CONFESSION ? ({ ...it, mark: LOVE_LINE, markK: hk } as ChatItem) : it));
  const view = { title: HER, time: "07:10", me: "boy" as const, them: "girl" as const, items, dark: false };
  const mk = markAt(ctx, view) ?? { x: 116, y: 580, w: 330, h: 90 };
  const ax = mk.x + mk.w / 2,
    ay = mk.y + mk.h / 2;
  const px = 540 + (ax - 300) + (540 - (540 + (ax - 300))) * read,
    py = PHONE_CY + (ay - 640) + (820 - (PHONE_CY + (ay - 640))) * read;
  const cx = px - (ax - 300) * s,
    cy = py - (ay - 640) * s;
  const notes = [
    { title: HER, body: HER_CONFESSION, time: "00:58" },
    { title: HER, body: LATE1, time: "01:30" },
    { title: HER, body: LATE2, time: "03:00" },
  ];
  let firstH = 166;
  const right: FingerPos = abs > EV.tapNote - 0.2 && abs < EV.tapNote + 0.08 ? { x: 300, y: NOTE_Y + 80 + 30 * (1 - smooth(phase(abs, EV.tapNote - 0.2, EV.tapNote - 0.04))), touch: abs > EV.tapNote - 0.05 ? 1 : 0.75 } : REST;
  phoneCloseup(
    ctx,
    abs,
    (c) => {
      if (abs < EV.boot - 0.03) {
        c.fillStyle = "#050507";
        c.fillRect(0, 0, SW, SH);
        return;
      }
      if (!booted) {
        bootScreen(c, smooth(phase(abs, EV.boot - 0.03, EV.boot + 0.2)));
        return;
      }
      if (appK < 1) {
        lockScreen(c, { time: "07:10", airplane: false, battery: 0.21 }, { date: "10月7日 星期二" });
        let y = NOTE_Y;
        notes.forEach((n, i) => {
          const k = pop(abs, EV.um2 + i * 0.12, 0.2);
          if (k <= 0) return;
          c.save();
          c.translate(0, -60 * (1 - k));
          const h = notification(c, 24, y, 552, n, k);
          c.restore();
          if (i === 0) firstH = h;
          y += h + 14;
        });
      }
      appWindow(c, appK, [300, NOTE_Y + firstH / 2], (a) => chatScreen2(a, abs, view));
    },
    { who: "boy", right, cx, cy, s, steady: read > 0, glowCol: "rgba(255,230,190,0.28)", bg: "#2b2a3a" },
  );
}

/** after she sends the 「嗯」 the camera pushes in on its bubble (screen 454, 622 on her phone) and brings it towards the
 *  middle: where that bubble is on screen, and the phone scale */
function umSpot(abs: number) {
  const zk = smooth(phase(abs, EV.send2 + 0.08, EV.send2 + 0.55));
  return { ux: 694 + (590 - 694) * zk, uy: 892 + (860 - 892) * zk, zs: PHONE_S + 0.38 * zk };
}

/** over her memory, outside the film: the time cards, and round the sent 「嗯」 two yellow pulses (like the hook) and
 *  a red-pen note — everything else was deleted */
function memoryNotes(ctx: Ctx, abs: number) {
  card(ctx, "10月6日 23:12", 70, 330, smooth(phase(abs, BAR(16) + 0.15, BAR(16) + 0.4)) * (1 - phase(abs, 33.5, 33.6)));
  card(ctx, "那天上课", 70, 330, smooth(phase(abs, BAR(18) + 0.05, BAR(18) + 0.3)) * (1 - phase(abs, EV.hide2 - 0.1, EV.hide2)));
  card(ctx, "放学后", 70, 330, smooth(phase(abs, EV.afterClass + 0.05, EV.afterClass + 0.25)) * (1 - phase(abs, EV.now - 0.1, EV.now)));
  if (abs <= EV.send2 || abs >= EV.umHold) return;
  const { ux, uy, zs } = umSpot(abs);
  for (const t0 of [EV.send2 + 0.12, EV.send2 + 0.48]) {
    const k = phase(abs, t0, t0 + 0.4);
    if (k <= 0 || k >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(ux, uy, (64 + 70 * k) * zs, (46 + 40 * k) * zs, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const nk = phase(abs, EV.send2 + 0.3, EV.send2 + 0.75);
  if (nk > 0) {
    ctx.save();
    ctx.translate(ux - 40, uy + 150);
    ctx.rotate(-0.04);
    text(ctx, writeOn(`删掉了 ${Array.from(HER_REPLY_DRAFT).length} 个字`, nk), 0, 0, { size: 60, font: F.pen, fill: "#ff3b3b", stroke: "#fff", lw: 10 });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = clamp(nk * 3);
    inkLine(ctx, [[ux - 20, uy + 104], [ux - 6, uy + 70], [ux + 4, uy + 56]], 3840, 6, "#ff3b3b");
    inkLine(ctx, [[ux - 16, uy + 66], [ux + 4, uy + 56], [ux + 10, uy + 78]], 3841, 6, "#ff3b3b");
    ctx.restore();
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(16), (ctx, abs) => {
    if (abs < EV.now) {
      // her memory — that night and that class — on old film, the same as his memory in act 1; nothing else
      oldFilm(ctx, abs, (c) => (abs < BAR(18) ? shotReplay(c, abs) : shotSchool(c, abs)), "memory");
      memoryNotes(ctx, abs);
    } else if (abs < EV.nightFalls) shotSend(ctx, abs);
    else if (abs < EV.intoHis[1]) shotNight(ctx, abs);
    else shotDawn(ctx, abs);
  });
}
