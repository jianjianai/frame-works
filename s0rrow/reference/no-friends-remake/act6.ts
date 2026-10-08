import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, W, backOut, beatAt, bloom, bokehDisc, camera, designScene, easeInOut, fillBg, filtered, flash, glow, handheld, text, writeOn } from "./lib/draw";
import { CAST, Person, drawPerson } from "./lib/people";
import { Msg, SW, chatScreen, glassGlare, phone, phoneButtons } from "./lib/phone";
import { FingerKey, fingerAt, touchDot } from "./lib/hand";
import { bokeh, buildingEntrance } from "./lib/sets";

/** EPILOGUE (song 83.74 – 90.00 = work 50.35 – 56.61; draws in song time) · 重新设计版.
 *  His phone (no hands, 用户: his taps are dots on the glass), the party still going on behind him (far out of focus,
 *  warm); the camera leans in on the input box while he types and eases back as it sends. In the same class group —
 *  no ✈ now — he types 「谢谢你们。」 with one thumb and sends it: 发送成功 ✓, in colour (the answer
 *  to the grey red "!" at 0:24). A smear of cream on the glass. Replies land on the beat. From PROMPTS the phone steps
 *  back for the like / comment prompts (lyrics.ts); the last beat goes to black. */
const T0 = beatAt(160); // 83.74
const SENT = beatAt(162); // 84.79
const REPLIES = [beatAt(163), beatAt(164), beatAt(165)]; // 85.31, 85.83, 86.35
const PROMPTS = beatAt(166); // 86.87 — the double tap (lyrics.ts draws the prompts)
const END = beatAt(172); // 90.00, the end of the bar the song fades out on

const JIE = { ...CAST.jie, x: 0, face: "laugh" as const };
const MONITOR = { ...CAST.monitor, x: 0, face: "smile" as const };
const YU = { ...CAST.yu, x: 0, face: "smile" as const };

// his right thumb: three taps on the keyboard, then 发送 (keyboard up: the send button is at 542, 799)
const THUMB: FingerKey[] = [
  [T0, 470, 1236, 0.2],
  [T0 + 0.2, 330, 918, 0],
  [T0 + 0.27, 330, 918, 1],
  [T0 + 0.36, 330, 918, 0],
  [T0 + 0.44, 450, 1010, 1],
  [T0 + 0.53, 450, 1010, 0],
  [T0 + 0.61, 380, 1102, 1],
  [T0 + 0.7, 380, 1102, 0],
  [SENT - 0.14, 542, 799, 0],
  [SENT - 0.02, 542, 799, 1],
  [SENT + 0.12, 542, 799, 1],
  [SENT + 0.34, 470, 1236, 0.2],
  [END, 470, 1236, 0.2],
];

/** the party behind him, drawn for a heavy blur: the lobby light, fairy lights, his friends jumping about */
function partyBehind(c: Ctx, abs: number) {
  buildingEntrance(c, abs);
  const crowd: [Person, number, number][] = [
    [CAST.monitor, 170, 700],
    [CAST.a, 390, 640],
    [CAST.e, 720, 660],
    [CAST.d, 940, 720],
    [CAST.jie, 860, 990],
    [CAST.yu, 220, 1010],
  ];
  crowd.forEach(([p, x, y], i) =>
    drawPerson(c, x, y + Math.abs(Math.sin(abs * 8 + i)) * -12, 0.72, { ...p, x: 0, face: "laugh", arms: i % 2 ? "up" : "laugh", body: "full", tilt: Math.sin(abs * 10 + i) * 0.06 }),
  );
}

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
  // no hands: the phone a size up; the camera leans in on the input box while he types, eases back as it sends;
  // each reply lands with a little bump
  const typing = easeInOut(phase(abs, T0, SENT - 0.15)) * (1 - easeInOut(phase(abs, SENT, SENT + 0.45)));
  const bump = REPLIES.reduce((sum, t) => sum + (abs > t ? Math.exp(-(abs - t) * 10) * Math.sin((abs - t) * 30) * 5 : 0), 0);
  const [hx, hy, hr] = handheld(abs, 4, 16);
  const s = 0.8 - 0.28 * room,
    cx = 540 + hx,
    cy = 760 + 200 * room + hy + bump,
    rot = -0.02 + hr;
  fillBg(ctx, "#141a3a");
  filtered(
    ctx,
    "blur(10px)",
    (b) => {
      b.save();
      camera(b, 540, 900, 1.15);
      partyBehind(b, abs);
      b.restore();
    },
    "bg",
  );
  // 光影 · 情绪: the party behind him stays warm — the lobby's light glowing through the blur, the string lights and
  // the faces gone to soft gold and pink discs (it was a cold blue veil)
  ctx.fillStyle = "rgba(24,14,22,0.3)";
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 540, 620, 980, "rgba(255,196,120,0.2)");
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    bokehDisc(ctx, -40 + t * 1160, 180 + 70 * Math.sin(t * Math.PI) + Math.sin(abs * 0.7 + i) * 6, 36 + 10 * Math.sin(i * 2.1), ["255,205,120", "255,150,190", "150,215,255", "255,226,160"][i % 4], 0.22 * (0.8 + 0.2 * Math.sin(abs * 2 + i)));
  }
  ctx.restore();
  bokeh(ctx, abs, 16, 601, 0.9, ["255,205,130", "255,160,190", "255,236,190"]);
  glow(ctx, cx, cy, 700, "rgba(255,220,150,0.2)");
  ctx.save();
  // (the input box, keyboard up, is at screen y 799 of the phone)
  camera(ctx, 540, cy + (799 - 640) * s, 1 + 0.12 * typing);
  phoneButtons(ctx, cx, cy, s, rot);
  phone(ctx, cx, cy, s, rot, (c) => {
    chatScreen(c, { time: "00:01", airplane: false }, "高二(3)班 (46)", msgs, sent ? "" : writeOn("谢谢你们。", typed), !sent && Math.floor(abs * 3) % 2 === 0, { keyboard: !sent });
    // a smear of cream on the glass — the cake in his face
    c.save();
    c.globalAlpha = 0.6;
    c.fillStyle = "#fff4f6";
    c.beginPath();
    c.ellipse(SW - 96, 300, 64, 24, -0.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,156,195,0.8)";
    c.beginPath();
    c.ellipse(SW - 116, 312, 22, 9, -0.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    glassGlare(c, hx);
    touchDot(c, fingerAt(abs, THUMB));
  });
  ctx.restore();
  // 发送成功 ✓ — the answer to the red "!"
  if (sent && room < 1) {
    const k = backOut(phase(abs, SENT, SENT + 0.25));
    ctx.save();
    ctx.globalAlpha = 1 - room;
    ctx.translate(840, 380);
    ctx.rotate(0.1);
    ctx.scale(k, k);
    glow(ctx, 0, 0, 160, "rgba(126,224,129,0.35)");
    text(ctx, "发送成功 ✓", 0, 0, { size: 60, font: F.cn, fill: "#7ee081", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  // in from the party's light; to black over the last beat
  flash(ctx, 0.6 * (1 - phase(abs, T0, T0 + 0.25)), "#fff1d0");
  flash(ctx, smooth(phase(abs, END - 0.6, END)), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    shotThanks(ctx, abs);
    bloom(ctx, 0.22); // 光影: the party lights and the screen glow softly
  });
}
