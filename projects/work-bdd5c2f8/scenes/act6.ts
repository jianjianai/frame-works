import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, backOut, beatAt, camera, designScene, fillBg, flash, glow, handheld, text, writeOn } from "./lib/draw";
import { CAST } from "./lib/people";
import { Msg, chatScreen, phone } from "./lib/phone";
import { bokeh } from "./lib/sets";

/** EPILOGUE (song 83.74 – 90.00 = work 50.35 – 56.61; draws in song time). 重置版: the 15-second outro (swings with
 *  小雨, the handwritten moral, the P.S. card) became one 6-second shot — the payoff, then out:
 *  in the same class group he types 「谢谢你们。」 and this time it goes through — 发送成功 ✓, the answer to the red "!" —
 *  and the replies land on the beat. From PROMPTS the phone makes room for the like / comment prompts (lyrics.ts). */
const T0 = beatAt(160); // 83.74
const SENT = beatAt(162); // 84.79
const REPLIES = [beatAt(163), beatAt(164), beatAt(165)]; // 85.31, 85.83, 86.35
const PROMPTS = beatAt(166); // 86.87 — the double tap (lyrics.ts draws the prompts)
const END = beatAt(172); // 90.00, the end of the bar the song fades out on

const JIE = { ...CAST.jie, x: 0, face: "laugh" as const };
const MONITOR = { ...CAST.monitor, x: 0, face: "smile" as const };
const YU = { ...CAST.yu, x: 0, face: "smile" as const };

function shotThanks(ctx: Ctx, abs: number) {
  const typed = phase(abs, T0 + 0.25, SENT - 0.2);
  const sent = abs >= SENT;
  const msgs: Msg[] = [
    { from: "阿杰", text: "寿星人呢？？？", avatar: JIE },
    { from: "班长", text: "全班都在你家楼下", avatar: MONITOR },
  ];
  if (sent) msgs.push({ me: true, text: "谢谢你们。" });
  const replies: Msg[] = [
    { from: "阿杰", text: "生日快乐！！！", avatar: JIE },
    { from: "班长", text: "下次再开飞行模式试试？", avatar: MONITOR },
    { from: "小雨", text: "横幅上的字是我写的！", avatar: YU },
  ];
  REPLIES.forEach((t, i) => {
    if (abs >= t) msgs.push(replies[i]);
  });
  // the phone steps back and down for the prompts: like at the top, the comment card under it
  const room = smooth(phase(abs, PROMPTS - 0.25, PROMPTS + 0.15));
  fillBg(ctx, "#141a3a");
  glow(ctx, 540, 800, 900, "rgba(255,220,150,0.3)");
  bokeh(ctx, abs, 16, 601, 0.9);
  ctx.save();
  const [hx, hy, hr] = handheld(abs, 4, 16);
  camera(ctx, 540, 800, 1 + 0.03 * smooth(phase(abs, T0, PROMPTS)), hr, hx, hy);
  phone(ctx, 540, 760 + 200 * room, 0.66 - 0.14 * room, 0, (c) =>
    chatScreen(c, { time: "00:01", airplane: false }, "高二(3)班 (46)", msgs, sent ? "" : writeOn("谢谢你们。", typed), !sent && Math.floor(abs * 3) % 2 === 0),
  );
  ctx.restore();
  if (sent && room < 1) {
    const k = backOut(phase(abs, SENT, SENT + 0.25));
    ctx.save();
    ctx.globalAlpha = 1 - room;
    ctx.translate(840, 380);
    ctx.rotate(0.1);
    ctx.scale(k, k);
    text(ctx, "发送成功 ✓", 0, 0, { size: 60, font: F.cn, fill: "#7ee081", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  // in from the party's light; to black over the last beat
  flash(ctx, 0.5 * (1 - phase(abs, T0, T0 + 0.2)));
  flash(ctx, smooth(phase(abs, END - 0.6, END)), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => shotThanks(ctx, abs));
}
