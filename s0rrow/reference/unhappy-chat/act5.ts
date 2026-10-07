import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, H, W, camera, designScene, fillBg, flash, glow } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { bedBlanket, bedroom, classroomFront, deskFront, herBlanket, herRoom, strawberryMilk } from "./lib/places";
import { heart } from "./lib/sets";
import { ChatItem, chatScreen2, sendButtonAt } from "./lib/chat";
import { FingerPos } from "./lib/hand";
import { ASK_AGAIN, GIVE_UP, HER, HER_CONFESSION, HISTORY, inWin, phoneCloseup, pop, typed, typingThumbs } from "./lib/story";
import { BAR, END, EV } from "./lib/timeline";

/** OUTRO (65.50 – 73.3s): she reads 「我也是」 and hides her face, then smiles back at him.
 *  That night he asks again — 「那周末一起去图书馆？」 — and this time her answer is 「嗯！！」. */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function nightItems(abs: number): ChatItem[] {
  const items: ChatItem[] = [...HISTORY.slice(-3)];
  items.push({ t: "msg", text: "嗯" });
  items.push({ t: "msg", me: true, text: GIVE_UP });
  items.push({ t: "msg", text: HER_CONFESSION });
  items.push({ t: "time", text: "10月7日 21:30" });
  if (abs >= EV.send4) items.push({ t: "msg", me: true, text: ASK_AGAIN, pop: pop(abs, EV.send4) });
  if (abs >= EV.um3) items.push({ t: "msg", text: "嗯！！", pop: pop(abs, EV.um3) });
  if (abs >= EV.um3 + 0.3) items.push({ t: "sticker", kind: "heart", pop: pop(abs, EV.um3 + 0.3, 0.25) });
  return items;
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(32), (ctx, abs) => {
    if (abs < 68.03) {
      // she reads the note, hides her face, then smiles at him
      const hide = abs > 66.2 && abs < 67.3;
      const smile = abs >= 67.3;
      ctx.save();
      camera(ctx, 540, 860, 1.14 - 0.06 * smooth(phase(abs, BAR(32), 68.03)));
      classroomFront(ctx, abs, { sun: 1.3 });
      drawKid(ctx, 760, 600, 0.72, { body: "bust", eyes: smile ? "happy" : "open", mouth: "smile", blush: 0.8, look: [-0.9, 0.6], arms: "custom", handR: smile ? [60, -40] : [120, 432], shapeR: "open" });
      drawKid(ctx, 380, 900, 0.8, {
        who: "girl",
        outfit: "cardigan",
        body: "bust",
        eyes: smile ? "happy" : "open",
        mouth: smile ? "grin" : "o",
        blush: 1,
        look: [0.2, 0.9],
        arms: hide ? "face" : "table",
        tilt: smile ? -0.08 : 0,
      });
      deskFront(ctx, 380, 1236, 0.8, 3573, (c) => strawberryMilk(c, 110, -110, 0.62, 0.05, 3916, "我也是"));
      ctx.restore();
      if (smile) {
        for (let i = 0; i < 5; i++) {
          const t = ((abs - 67.3) * 0.9 + i * 0.2) % 1;
          ctx.save();
          ctx.globalAlpha = 1 - t;
          heart(ctx, 560 + Math.sin(i * 1.7) * 140, 760 - t * 260, 18 + (i % 3) * 7, "#ff7fa8", 4000 + i);
          ctx.restore();
        }
      }
      return;
    }
    if (abs < EV.um3 + 0.6) {
      // that night: he asks again
      const draft = abs < EV.send4 ? typed(ASK_AGAIN, abs, EV.type5[0], EV.type5[1]) : "";
      const typing = inWin(abs, EV.typingC);
      const view = { title: HER, time: "21:30", me: "boy" as const, them: "girl" as const, items: nightItems(abs), dark: true, typing, draft, caret: abs < EV.send4, keyboard: abs < EV.send4 };
      let hands: { right: FingerPos; left: FingerPos } = { right: { x: 480, y: 1180, touch: 0.2 }, left: { x: 120, y: 1180, touch: 0.2 } };
      if (inWin(abs, EV.type5)) hands = typingThumbs(abs, EV.type5[0], EV.type5[1], 51);
      else if (abs >= EV.type5[1] && abs < EV.send4 + 0.15) {
        const sb = sendButtonAt(ctx, { ...view, draft: ASK_AGAIN });
        hands = { right: { x: sb[0], y: sb[1], touch: abs > EV.send4 - 0.06 ? 1 : 0.1 }, left: hands.left };
      }
      phoneCloseup(ctx, abs, (c) => chatScreen2(c, abs, view), { who: "boy", cy: 880, ...hands });
      return;
    }
    // both grinning at their phones — split screen
    fillBg(ctx, "#0b0d1c");
    const k = smooth(phase(abs, EV.um3 + 0.6, EV.um3 + 1.1));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H / 2);
    ctx.clip();
    ctx.translate(0, -(1 - k) * 80);
    ctx.save();
    camera(ctx, 800, 640, 1.0);
    bedroom(ctx, abs, {});
    drawKid(ctx, 840, 620, 0.78, { body: "bust", eyes: "happy", mouth: "grin", blush: 0.8, look: [0, 0.9], arms: "phone" });
    bedBlanket(ctx);
    glow(ctx, 840, 900, 500, "rgba(120,150,255,0.3)");
    ctx.restore();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H / 2, W, H / 2);
    ctx.clip();
    ctx.translate(0, H / 2 - 520 + (1 - k) * 80);
    ctx.save();
    camera(ctx, 330, 700, 1.0);
    herRoom(ctx, abs, { lights: 1 });
    drawKid(ctx, 320, 700, 0.64, { who: "girl", outfit: "pajamas", body: "full", legs: "sitFloor", eyes: "happy", mouth: "grin", blush: 1, look: [0, 0.9], arms: "phone" });
    herBlanket(ctx);
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, H / 2 - 4, W, 8);
    flash(ctx, phase(abs, END - 0.6, END), "#000");
  });
}

void lerp;
