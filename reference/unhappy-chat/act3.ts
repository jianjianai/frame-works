import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, blob, camera, card, designScene, fillBg, glow, inkLine, paint, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { bedBlanket, bedroom, herBlanket, herRoom } from "./lib/places";
import { heart } from "./lib/sets";
import { BACKSPACE_AT, ChatItem, bootScreen, chatScreen2, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { SH, SW, lockScreen, notification } from "./lib/phone";
import { FRIEND_ADVICE, GIVE_UP, HER, PHONE_CY, REST_L, REST_R, HER_CONFESSION, HER_REPLY_DRAFT, HIM, HISTORY, deleted, fromHer, hisClassFace, hisFaceReading, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 3 (32.79 – 49.14s) · verse 2 · 她的视角
 *  3A rewind to 23:12: his long message lands; she squeals, types a long happy reply… her friend's advice
 *     pops up — she deletes it all and sends 「嗯」 (that's why 「对方正在输入...」 flickered)
 *  3B class, her side: he smiled at her when their eyes met — she went bright red behind the book ("You never ever pay attention to me")
 *  3C back to 00:52: she wipes her tears, types everything and sends it — he never answers; she falls asleep
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
    card(ctx, "10月6日 23:12", 70, 330, smooth(phase(abs, BAR(16) + 0.15, BAR(16) + 0.4)));
    return;
  }
  if (abs < 35.95) {
    let draft = "";
    if (abs < EV.del3[0]) draft = typed(HER_REPLY_DRAFT, abs, EV.type3[0], EV.type3[1]);
    else if (abs < EV.del3[1]) draft = deleted(HER_REPLY_DRAFT, abs, EV.del3[0], EV.del3[1]);
    else if (abs < EV.send2) draft = abs > 35.8 ? "嗯" : "";
    const view = { title: HIM, time: "23:13", me: "girl" as const, them: "boy" as const, items: herItems(abs, "replay"), dark: true, draft: abs < EV.send2 ? draft : "", caret: abs < EV.send2, keyboard: true, sendHot: abs > EV.send2 - 0.08 && abs < EV.send2 ? 1 : 0 };
    let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
    if (inWin(abs, EV.type3)) hands = typingThumbs(abs, EV.type3[0], EV.type3[1], 31);
    else if (inWin(abs, EV.del3)) {
      const f = ((abs - EV.del3[0]) * 12) % 1;
      hands = { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.4 }, left: hands.left };
    } else if (abs > 35.75) {
      const sb = sendButtonAt(ctx, { ...view, draft: "嗯" });
      hands = { right: { x: abs < 35.82 ? 300 : sb[0], y: abs < 35.82 ? 1000 : sb[1], touch: abs > EV.send2 - 0.06 || (abs > 35.78 && abs < 35.81) ? 1 : 0.2 }, left: hands.left };
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
        const nk = smooth(phase(abs, EV.friendNote, EV.friendNote + 0.18)) * (1 - smooth(phase(abs, 35.5, 35.7)));
        if (nk > 0) {
          c.save();
          c.translate(0, -160 * (1 - nk));
          notification(c, 24, 24, 552, { title: "小美", body: FRIEND_ADVICE, time: "现在" }, nk);
          c.restore();
        }
      },
      { who: "girl", cy: PHONE_CY, glowCol: "rgba(255,170,200,0.22)", ...hands },
    );
    return;
  }
  // regret, face in the pillow
  ctx.save();
  camera(ctx, 420, 900, 1.12);
  herRoom(ctx, abs, { lights: 1 });
  drawKid(ctx, 340, 700, 0.66, {
    who: "girl",
    outfit: "pajamas",
    body: "full",
    legs: "sitFloor",
    eyes: "shut",
    mouth: "wobble",
    blush: 0.7,
    tilt: 0.12,
    arms: "custom",
    handL: [-90, 300],
    handR: [90, 300],
    shapeL: "flat",
    shapeR: "flat",
    grip: (c) => {
      blob(c, [[-170, 200], [170, 190], [190, 420], [-180, 430]], 3810, 2);
      paint(c, "#fde9f0", C.ink, 5);
    },
  });
  herBlanket(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------- 3B class, her side
function shotSchool(ctx: Ctx, abs: number) {
  if (abs < EV.hide2) {
    // what she saw when she turned round: him, smiling at her
    hisClassFace(ctx, abs, BAR(18), "smile");
    card(ctx, "那天上课", 70, 330, smooth(phase(abs, BAR(18) + 0.05, BAR(18) + 0.3)));
    return;
  }
  // behind the book: bright red, heart going crazy
  const beat = Math.max(0, Math.sin((abs - EV.hide2) * Math.PI * 4.2));
  fillBg(ctx, "#efe6cf");
  ctx.save();
  camera(ctx, 540, 900, 1.0 + 0.04 * beat + 0.05 * smooth(phase(abs, EV.hide2, EV.now)));
  glow(ctx, 540, 860, 800, "rgba(255,170,190,0.4)");
  drawKid(ctx, 540, 860, 1.3, {
    who: "girl",
    outfit: "cardigan",
    body: "bust",
    eyes: "wide",
    mouth: "bite",
    blush: 1,
    look: [0, 0.3],
    arms: "custom",
    handL: [-150, 200],
    handR: [150, 200],
    shapeL: "hold",
    shapeR: "hold",
    grip: (c) => {
      c.save();
      c.translate(0, 260);
      blob(c, [[-180, -90], [180, -96], [186, 110], [-174, 116]], 3820, 1.2);
      paint(c, "#7fb2d9", C.ink, 6);
      inkLine(c, [[0, -94], [2, 112]], 3821, 4, "#4a7aa0");
      c.restore();
    },
  });
  ctx.restore();
  // pounding heart doodle + 扑通
  ctx.save();
  ctx.translate(840, 640);
  const k = 1 + 0.25 * beat;
  ctx.scale(k, k);
  heart(ctx, 0, 0, 46, "#ff4d6d", 3822);
  ctx.restore();
  text(ctx, "扑通 扑通", 820, 520, { size: 52, font: F.cn, fill: "#ff4d6d", stroke: C.ink, lw: 8, alpha: 0.6 + 0.4 * beat });
}

// ---------------------------------------------------------------- 3C present: she sends everything
function shotSend(ctx: Ctx, abs: number) {
  if (abs < EV.type4[0]) {
    ctx.save();
    camera(ctx, 420, 900, 1.1);
    herRoom(ctx, abs, { lights: 1 });
    const wipe = abs < 39.95;
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
  if (abs < 43.6) {
    const draft = abs < EV.send3 ? typed(HER_CONFESSION, abs, EV.type4[0], EV.type4[1]) : "";
    const view = { title: HIM, time: "00:58", me: "girl" as const, them: "boy" as const, items: herItems(abs, "present"), dark: true, draft, caret: abs < EV.send3, keyboard: abs < EV.send3, sendHot: abs > EV.send3 - 0.1 && abs < EV.send3 ? 1 : 0 };
    let hands: { right: FingerPos; left: FingerPos } = { right: REST, left: REST_L };
    if (inWin(abs, EV.type4)) hands = typingThumbs(abs, EV.type4[0], EV.type4[1], 41);
    else if (abs >= EV.type4[1] && abs < EV.send3 + 0.2) {
      const sb = sendButtonAt(ctx, { ...view, draft: HER_CONFESSION });
      const shaky = Math.sin(abs * 23) * 6;
      hands = { right: { x: sb[0] + shaky, y: sb[1] + (abs < EV.send3 - 0.08 ? 50 : 0), touch: abs > EV.send3 - 0.08 && abs < EV.send3 + 0.12 ? 1 : 0 }, left: hands.left };
    }
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "girl", cy: PHONE_CY, glowCol: "rgba(255,170,200,0.24)", ...hands });
    return;
  }
  // waiting… no answer; she falls asleep holding the phone
  const asleep = abs > EV.asleep;
  ctx.save();
  camera(ctx, 420, 900, 1.1 + 0.04 * smooth(phase(abs, 43.6, EV.dawn)));
  herRoom(ctx, abs, { lights: 1 - 0.45 * smooth(phase(abs, EV.asleep, EV.dawn)) });
  drawKid(ctx, 320, 720, 0.64, {
    who: "girl",
    outfit: "pajamas",
    body: "full",
    legs: "sitFloor",
    eyes: asleep ? "shut" : "sad",
    mouth: "flat",
    tilt: asleep ? 0.25 : 0.05,
    look: [0, 0.8],
    arms: "phone",
  });
  herBlanket(ctx);
  ctx.restore();
  const cards: [string, number, number][] = [
    ["01:30", 43.65, 44.35],
    ["03:00", 44.4, EV.dawn],
  ];
  for (const [s, a, b] of cards) card(ctx, s, 70, 330, smooth(phase(abs, a, a + 0.12)) * (1 - phase(abs, b - 0.1, b)));
}

// ---------------------------------------------------------------- 3D the next morning, his side
function shotDawn(ctx: Ctx, abs: number) {
  if (abs < 46.3) {
    // the phone has been off all night
    ctx.save();
    camera(ctx, 700, 900, 1.06);
    bedroom(ctx, abs, { dawn: 1 });
    drawKid(ctx, 840, 620, 0.78, { body: "bust", eyes: abs < 45.55 ? "shut" : "tired", mouth: "flat", look: [0, 0.9], arms: "phone" });
    bedBlanket(ctx);
    ctx.restore();
    card(ctx, "07:10", 70, 330, smooth(phase(abs, EV.dawn + 0.05, EV.dawn + 0.3)));
    return;
  }
  if (abs < EV.read) {
    const booted = abs > 46.95;
    const n = pop(abs, EV.um2, 0.22);
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        if (abs < EV.boot - 0.03) {
          c.fillStyle = "#050507";
          c.fillRect(0, 0, SW, SH);
        } else if (!booted) bootScreen(c, smooth(phase(abs, EV.boot - 0.03, EV.boot + 0.2)));
        else {
          lockScreen(c, { time: "07:10", airplane: false, battery: 0.21 }, { date: "10月7日 星期二" });
          if (n > 0) {
            c.save();
            c.translate(0, -120 * (1 - n));
            notification(c, 24, 360, 552, { title: HER, body: HER_CONFESSION, time: "00:58" }, n);
            c.restore();
          }
        }
      },
      { who: "boy", right: REST, cy: PHONE_CY, glowCol: "rgba(255,230,190,0.28)", bg: "#2b2a3a" },
    );
    return;
  }
  hisFaceReading(ctx, abs);
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(16), (ctx, abs) => {
    if (abs < BAR(18)) shotReplay(ctx, abs);
    else if (abs < EV.now) shotSchool(ctx, abs);
    else if (abs < EV.dawn) shotSend(ctx, abs);
    else shotDawn(ctx, abs);
    // rewind flicker into her point of view
    const rw = 1 - phase(abs, BAR(16), BAR(16) + 0.7);
    if (rw > 0) {
      ctx.save();
      ctx.globalAlpha = rw;
      ctx.fillStyle = "rgba(20,10,30,0.35)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const y = ((abs * 2600 + i * 331) % (H + 200)) - 100;
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.22)" : "rgba(255,170,210,0.2)";
        ctx.fillRect(0, y, W, 6 + (i % 3) * 8);
      }
      text(ctx, "◀◀", W - 150, 330, { size: 64, font: F.ui, weight: 700, fill: "#fff", stroke: C.ink, lw: 8 });
      ctx.restore();
    }
  });
}
