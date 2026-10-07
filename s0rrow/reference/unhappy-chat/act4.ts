import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, backOut, blob, camera, card, designScene, fillBg, flash, glow, inkLine, oval, paint, text } from "./lib/draw";
import { drawKid, sunflowerClip } from "./lib/kid";
import { bedBlanket, bedroom, classroomFront, deskFront, herBlanket, herRoom, morningStreet, storeInside, strawberryMilk } from "./lib/places";
import { heart, lightPool } from "./lib/sets";
import { ChatItem, bootScreen, chatScreen2 } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { SH, SW, lockScreen, notification } from "./lib/phone";
import { GIVE_UP, HER, HER_CONFESSION, HIM, HISTORY, fromHer, phoneCloseup, pop } from "./lib/story";
import { BAR, EV } from "./lib/timeline";

/** ACT 4 (49.14 – 65.50s) · chorus 2 — the next morning
 *  4A she wakes: no reply; at the mirror her eyes are puffy (so ugly) — she clips on the sunflower anyway
 *  4B he turns his phone on: her whole message, ending 「其实，我喜欢你，很久很久了。」
 *  4C he runs out, buys strawberry milk at the 24h store, keeps running
 *  4D classroom: he puts the milk on her desk with a note 「我也是」 — on "piercing through my heart" */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const REST: FingerPos = { x: 480, y: 1180, touch: 0.2 };

function allItems(): ChatItem[] {
  const items: ChatItem[] = [...HISTORY];
  items.push({ t: "msg", text: "嗯" });
  items.push({ t: "msg", me: true, text: GIVE_UP });
  items.push({ t: "time", text: "00:58" });
  items.push({ t: "msg", text: HER_CONFESSION });
  return items;
}

// ---------------------------------------------------------------- 4A her morning
function shotHerMorning(ctx: Ctx, abs: number) {
  if (abs < 50.2) {
    const up = smooth(phase(abs, EV.wakeHer, 49.9));
    ctx.save();
    camera(ctx, 420, 900, 1.08);
    herRoom(ctx, abs, { lights: 0.2, dawn: 1 });
    drawKid(ctx, 320, lerp(760, 700, up), 0.64, { who: "girl", outfit: "pajamas", body: "full", legs: "sitFloor", eyes: up < 0.5 ? "shut" : "tired", mouth: "flat", look: [0.2, 0.8], arms: "phone", tilt: lerp(0.25, 0, up) });
    herBlanket(ctx);
    ctx.restore();
    card(ctx, "07:02", 70, 330, smooth(phase(abs, BAR(24) + 0.1, BAR(24) + 0.35)) * (1 - phase(abs, 50.0, 50.2)));
    return;
  }
  if (abs < BAR(25)) {
    const items = fromHer(allItems());
    phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, { title: HIM, time: "07:02", me: "girl", them: "boy", items }), { who: "girl", right: REST, cy: 880, glowCol: "rgba(255,220,180,0.3)", bg: "#2a2236" });
    return;
  }
  // the mirror
  fillBg(ctx, "#e9dcea");
  ctx.save();
  camera(ctx, 540, 860, 1.0 + 0.03 * smooth(phase(abs, BAR(25), BAR(26))));
  oval(ctx, 540, 840, 400, 470, 3900, 2);
  paint(ctx, "#f3c9d6", C.ink, 10);
  oval(ctx, 540, 840, 360, 430, 3901, 1.5);
  paint(ctx, "#dfe8f0", C.ink, 6);
  ctx.save();
  oval(ctx, 540, 840, 360, 430, 3901, 1.5);
  ctx.clip();
  const pat = abs > 52.25 && abs < 52.85;
  const clipped = abs > 52.95;
  drawKid(ctx, 540, 800, 1.3, {
    who: "girl",
    outfit: "pajamas",
    body: "bust",
    eyes: abs < 52.25 ? "tired" : clipped ? "open" : "shut",
    brows: clipped ? "up" : "sad",
    mouth: clipped ? "bite" : "frown",
    clip: clipped,
    blush: pat ? 0.9 : 0.4,
    arms: pat ? "face" : clipped ? "down" : "down",
  });
  if (!clipped && abs > 52.6) {
    // the sunflower clip on its way into her hair
    const k = smooth(phase(abs, 52.6, 52.95));
    sunflowerClip(ctx, lerp(760, 540 - 98 * 1.3, k), lerp(1100, 800 - 66 * 1.3, k), 1.2, 3902);
  }
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(300, 420);
  ctx.lineTo(420, 420);
  ctx.lineTo(260, 1260);
  ctx.lineTo(180, 1200);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- 4B his phone comes back on
function shotHisPhone(ctx: Ctx, abs: number) {
  if (abs < 53.8) {
    ctx.save();
    camera(ctx, 700, 900, 1.06);
    bedroom(ctx, abs, { dawn: 1 });
    drawKid(ctx, 840, 620, 0.78, { body: "bust", eyes: "tired", mouth: "flat", look: [0, 0.9], arms: "phone" });
    bedBlanket(ctx);
    ctx.restore();
    card(ctx, "07:10", 70, 330, smooth(phase(abs, BAR(26) + 0.05, BAR(26) + 0.3)));
    return;
  }
  if (abs < 55.3) {
    const booted = abs > 54.35;
    const n = pop(abs, EV.um2, 0.22);
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        if (!booted) bootScreen(c, smooth(phase(abs, 53.85, 54.1)));
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
      { who: "boy", right: REST, cy: 880, glowCol: "rgba(255,230,190,0.28)", bg: "#2b2a3a" },
    );
    return;
  }
  if (abs < 56.6) {
    const scroll = 0;
    const mark = smooth(phase(abs, 56.05, 56.45));
    phoneCloseup(
      ctx,
      abs,
      (c) => {
        chatScreen2(c, abs, { title: HER, time: "07:11", me: "boy", them: "girl", items: allItems(), scroll });
        if (mark > 0) {
          // highlighter over the last line of her message
          c.save();
          c.globalAlpha = 0.45;
          c.fillStyle = "#ffd84a";
          c.fillRect(110, 1010, 360 * mark, 40);
          c.restore();
        }
      },
      { who: "boy", right: REST, cy: 880, glowCol: "rgba(255,230,190,0.28)", bg: "#2b2a3a" },
    );
    return;
  }
  // his face
  fillBg(ctx, "#f1e4d2");
  ctx.save();
  camera(ctx, 540, 860, 1.0 + 0.05 * smooth(phase(abs, 56.6, BAR(28))));
  glow(ctx, 540, 1100, 800, "rgba(255,240,200,0.6)");
  const k = phase(abs, 56.6, 57.2);
  drawKid(ctx, 540, 880, 1.3, { body: "bust", eyes: k < 0.4 ? "wide" : "happy", mouth: k < 0.4 ? "o" : "grin", blush: k, look: [0, 0.6], arms: "phone", tears: k > 0.5 ? 0.2 : 0 });
  ctx.restore();
}

// ---------------------------------------------------------------- 4C running out
function shotRun(ctx: Ctx, abs: number) {
  if (abs < EV.shop) {
    const u = phase(abs, BAR(28), EV.shop);
    ctx.save();
    camera(ctx, 540, 900, 1.0);
    morningStreet(ctx, abs, u * 200);
    drawKid(ctx, lerp(760, 520, u), lerp(620, 700, u), lerp(0.42, 0.7, u), { body: "full", legs: "run", walk: abs * 15, eyes: "open", mouth: "grin", brows: "up", look: [0, 0.4], arms: "custom", handL: [-150, 300], handR: [160, 260], shapeL: "fist", shapeR: "fist", headY: -Math.abs(Math.sin(abs * 15)) * 10 });
    ctx.restore();
    return;
  }
  if (abs < 60.4) {
    const paid = abs > EV.pay;
    ctx.save();
    camera(ctx, 540, 900, 1.04);
    storeInside(ctx, abs);
    drawKid(ctx, 560, 700, 0.66, {
      body: "full",
      eyes: "happy",
      mouth: "grin",
      arms: "custom",
      handR: [170, 120],
      shapeR: "hold",
      handL: [-120, 432],
      grip: (c) => strawberryMilk(c, 190, 60, 0.7, 0.15, 3910),
    });
    ctx.restore();
    if (paid) {
      const k = backOut(phase(abs, EV.pay, EV.pay + 0.2));
      ctx.save();
      ctx.translate(930, 640);
      ctx.scale(k, k);
      text(ctx, "支付成功 ✓", 0, 0, { size: 44, font: F.cn, fill: "#2fa36b", stroke: "#fff", lw: 10 });
      ctx.restore();
    }
    return;
  }
  const u = phase(abs, 60.4, BAR(30));
  ctx.save();
  camera(ctx, 540, 900, 1.0);
  morningStreet(ctx, abs, 200 + u * 300);
  drawKid(ctx, lerp(300, 620, u), lerp(700, 640, u), lerp(0.72, 0.5, u), {
    body: "full",
    view: "back",
    legs: "run",
    walk: abs * 15,
    arms: "custom",
    handL: [-150, 300],
    handR: [160, 260],
    grip: (c) => strawberryMilk(c, 180, 230, 0.6, 0.2, 3911),
    headY: -Math.abs(Math.sin(abs * 15)) * 10,
  });
  ctx.restore();
}

// ---------------------------------------------------------------- 4D 「我也是」
function shotDesk(ctx: Ctx, abs: number) {
  if (abs < 63.35) {
    const walkIn = smooth(phase(abs, EV.door, 63.1));
    ctx.save();
    camera(ctx, 540, 900, 1.02);
    classroomFront(ctx, abs, { sun: 1.2 });
    drawKid(ctx, 380, 920, 0.72, { who: "girl", outfit: "cardigan", body: "bust", eyes: abs > 62.0 ? "wide" : "sad", mouth: abs > 62.0 ? "o" : "frown", look: abs > 62.0 ? [1, -0.3] : [0, 1], arms: "table" });
    deskFront(ctx, 380, 1222, 0.72, 3573, (c) => {
      c.save();
      c.translate(-60, -60);
      c.fillStyle = "#1a1a1e";
      c.beginPath();
      c.roundRect(-40, -24, 80, 48, 8);
      c.fill();
      c.restore();
    });
    if (abs > EV.door) {
      drawKid(ctx, lerp(-120, 700, walkIn), 680, 0.66, {
        body: "full",
        legs: walkIn > 0 && walkIn < 1 ? "walk" : "stand",
        walk: abs * 11,
        eyes: "open",
        mouth: walkIn < 0.4 ? "open" : "smile",
        blush: 0.6,
        look: [-0.8, 0.6],
        arms: "custom",
        handR: [80, 300],
        shapeR: "hold",
        handL: [-120, 432],
        grip: (c) => strawberryMilk(c, 92, 250, 0.7, -0.1, 3912),
      });
    }
    ctx.restore();
    return;
  }
  if (abs < 64.4) {
    // close on the desk: the milk and the note
    const down = smooth(phase(abs, 63.35, EV.milk));
    fillBg(ctx, "#d9b07a");
    ctx.save();
    camera(ctx, 540, 900, 1.0);
    deskFront(ctx, 540, 1060, 2.0, 3913);
    strawberryMilk(ctx, 540, lerp(520, 760, down), 2.2, 0.03, 3914, "我也是", smooth(phase(abs, EV.milk, EV.milk + 0.2)));
    if (abs < EV.milk + 0.25) {
      // his hand letting go
      ctx.save();
      ctx.globalAlpha = 1 - phase(abs, EV.milk + 0.05, EV.milk + 0.25);
      oval(ctx, 760, lerp(420, 640, down), 70, 56, 3915, 1);
      paint(ctx, C.skin, C.ink, 6);
      ctx.restore();
    }
    ctx.restore();
    if (abs > EV.milk && abs < EV.milk + 0.12) flash(ctx, 0.35 * (1 - phase(abs, EV.milk, EV.milk + 0.12)), "#fff");
    return;
  }
  // eyes meet
  const meet = abs > 64.75;
  ctx.save();
  camera(ctx, 540, 860, 1.12);
  classroomFront(ctx, abs, { sun: 1.3 });
  drawKid(ctx, 760, 600, 0.72, { body: "bust", eyes: "open", mouth: "smile", blush: 0.8, look: [-0.9, 0.6], arms: "custom", handR: [60, -40], shapeR: "open" });
  drawKid(ctx, 380, 900, 0.8, { who: "girl", outfit: "cardigan", body: "bust", eyes: "wide", mouth: "o", blush: meet ? 0.9 : 0.5, look: [0.9, -0.6], arms: "table" });
  deskFront(ctx, 380, 1236, 0.8, 3573, (c) => strawberryMilk(c, 110, -110, 0.62, 0.05, 3916, "我也是"));
  ctx.restore();
  if (meet) {
    for (let i = 0; i < 4; i++) {
      const t = ((abs - 64.75) * 1.2 + i * 0.25) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      heart(ctx, 560 + Math.sin(i * 1.9) * 80, 700 - t * 220, 18 + i * 4, "#ff7fa8", 3920 + i);
      ctx.restore();
    }
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(24), (ctx, abs) => {
    if (abs < BAR(26)) shotHerMorning(ctx, abs);
    else if (abs < BAR(28)) shotHisPhone(ctx, abs);
    else if (abs < BAR(30)) shotRun(ctx, abs);
    else shotDesk(ctx, abs);
  });
}

void blob;
void inkLine;
void lightPool;
void SH;
void SW;
void clamp;
