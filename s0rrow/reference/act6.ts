import type { SceneOptions } from "../../../src/engine/types";
import { phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, W, backOut, camera, designScene, easeOut, fillBg, flash, glow, inkLine, measure, text, writeOn } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, drawPerson } from "./lib/people";
import { Msg, airplaneIcon, chatScreen, phone } from "./lib/phone";
import { hedge, lampPost, parkSky, swingSet } from "./lib/sets";

/** OUTRO (83.74 – 99.1s): the same swing set, now sharing one earbud with 小雨.
 *  A message that finally sends, and a nudge to rewatch / comment. */
const T0 = 83.744;
const O2 = 90.2;
const O3 = 95.3;
const END = 99.1;

function shotSwings(ctx: Ctx, abs: number) {
  const t = abs - T0;
  const sway = Math.sin(t * 1.3) * 0.08;
  // positions of their heads, for the shared earbud wire
  let kidEar: [number, number] = [0, 0],
    yuEar: [number, number] = [0, 0];
  ctx.save();
  camera(ctx, 540, 800, 1.18 - 0.12 * smooth(phase(abs, T0, O2)));
  parkSky(ctx, 1);
  hedge(ctx, 1150, 1);
  lampPost(ctx, 60, 520, abs, 0);
  swingSet(ctx, 540, 430, 0.95, 0.85, {
    angles: [sway, sway],
    left: (c, sx, sy, a) => {
      c.save();
      c.translate(sx, sy);
      c.rotate(-a);
      drawKid(c, 0, -242, 0.55, { body: "full", legs: "sit", arms: "swing", hat: true, eyes: "happy", mouth: "smile", blush: 0.8, tilt: 0.12, look: [1, 0] });
      const m = c.getTransform();
      const p = new DOMPoint(0.55 * 124 * 1.14, -242 + 0.55 * 42 * 1.14).matrixTransform(m);
      kidEar = [p.x, p.y];
      c.restore();
    },
    right: (c, sx, sy, a) => {
      c.save();
      c.translate(sx, sy);
      c.rotate(-a);
      drawPerson(c, 0, -212, 0.6, { ...CAST.yu, x: 0, face: "smile", legs: "sit", arms: "hold", turn: -0.5, tilt: -0.12 });
      // one earbud in her ear
      c.fillStyle = "#fafafa";
      c.strokeStyle = C.ink;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(-0.6 * 92, -212 + 0.6 * 20, 7, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      const m = c.getTransform();
      const p = new DOMPoint(-0.6 * 92, -212 + 0.6 * 20).matrixTransform(m);
      yuEar = [p.x, p.y];
      c.restore();
    },
  });
  ctx.restore();
  // the shared earbud wire (device pixels → design units)
  const sc = ctx.getTransform().a;
  if (kidEar[0] && yuEar[0]) {
    const [ax, ay] = [kidEar[0] / sc, kidEar[1] / sc];
    const [bx, by] = [yuEar[0] / sc, yuEar[1] / sc];
    inkLine(ctx, [[ax, ay], [(ax + bx) / 2, Math.max(ay, by) + 120], [bx, by]], 860, 3, "#f2f2f2");
  }
  // a few music notes floating between them
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.35 + i * 0.25) % 1 + 1) % 1;
    ctx.save();
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    text(ctx, i % 2 ? "♪" : "♫", 470 + i * 40 + Math.sin(t * 2 + i) * 30, 560 - k * 260, { size: 60, font: F.ui, fill: "#ffe7b0", stroke: C.ink, lw: 6 });
    ctx.restore();
  }
  // the moral, handwritten
  const l1 = phase(abs, 84.4, 86.0);
  const l2 = phase(abs, 86.6, 88.6);
  const fade = 1 - phase(abs, O2 - 0.4, O2);
  ctx.save();
  ctx.globalAlpha = fade;
  text(ctx, writeOn("原来不是没有人在乎我", l1), W / 2, 1330, { size: 70, font: F.pen, fill: "#fff6dc", stroke: C.ink, lw: 12 });
  text(ctx, writeOn("只是我把自己调成了飞行模式", l2), W / 2, 1430, { size: 70, font: F.pen, fill: "#fff6dc", stroke: C.ink, lw: 12 });
  ctx.restore();
  flash(ctx, 0.8 * (1 - phase(abs, T0, T0 + 0.5)), "#fff6dc");
}

function shotThanks(ctx: Ctx, abs: number) {
  const typed = phase(abs, O2 + 0.2, O2 + 0.9);
  const sent = abs >= O2 + 1.1;
  const replies: [number, Msg][] = [
    [91.7, { from: "阿杰", text: "生日快乐！！！", avatar: { ...CAST.jie, x: 0, face: "laugh" } }],
    [92.2, { from: "班长", text: "下次再开飞行模式试试？", avatar: { ...CAST.monitor, x: 0, face: "smile" } }],
    [92.8, { from: "小雨", text: "我就坐你旁边啦 笨蛋", avatar: { ...CAST.yu, x: 0, face: "smile" } }],
  ];
  const msgs: Msg[] = [
    { from: "阿杰", text: "寿星人呢？？？", avatar: { ...CAST.jie, x: 0, face: "laugh" } },
    { from: "班长", text: "全班都在你家楼下", avatar: { ...CAST.monitor, x: 0, face: "smile" } },
  ];
  if (sent) msgs.push({ me: true, text: "谢谢你们。" });
  for (const [at, m] of replies) if (abs >= at) msgs.push(m);
  fillBg(ctx, "#141a3a");
  glow(ctx, 540, 800, 900, "rgba(255,220,150,0.3)");
  ctx.save();
  camera(ctx, 540, 800, 1 + 0.03 * smooth(phase(abs, O2, O3)));
  phone(ctx, 540, 760, 0.66, 0, (c) => chatScreen(c, { time: "00:01", airplane: false }, "高二(3)班 (46)", msgs, sent ? "" : writeOn("谢谢你们。", typed), !sent && Math.floor(abs * 3) % 2 === 0));
  ctx.restore();
  if (sent) {
    const k = backOut(phase(abs, O2 + 1.1, O2 + 1.35));
    ctx.save();
    ctx.translate(840, 380);
    ctx.rotate(0.1);
    ctx.scale(k, k);
    text(ctx, "发送成功 ✓", 0, 0, { size: 60, font: F.cn, fill: "#7ee081", stroke: C.ink, lw: 12 });
    ctx.restore();
  }
  const cta = phase(abs, 93.2, 94.6);
  text(ctx, writeOn("去给那个很久没联系的朋友", cta), W / 2, 1330, { size: 64, font: F.pen, fill: "#fff6dc", stroke: C.ink, lw: 12 });
  text(ctx, writeOn("发条消息吧", phase(abs, 94.3, 94.9)), W / 2, 1420, { size: 64, font: F.pen, fill: "#fff6dc", stroke: C.ink, lw: 12 });
  flash(ctx, 0.5 * (1 - phase(abs, O2, O2 + 0.2)));
}

function shotEnd(ctx: Ctx, abs: number) {
  fillBg(ctx, "#0b0e1f");
  const a = easeOut(phase(abs, O3, O3 + 0.5));
  ctx.save();
  ctx.globalAlpha = a;
  // tiny doodle of the swing set
  ctx.save();
  ctx.globalAlpha *= 0.5;
  swingSet(ctx, 540, 520, 0.32, 1, { angles: [Math.sin(abs * 1.3) * 0.08, Math.sin(abs * 1.3) * 0.08] });
  ctx.restore();
  text(ctx, "P.S.", W / 2, 1000, { size: 64, font: F.marker, fill: "#ffe45c" });
  text(ctx, "回到第 5 秒", W / 2, 1110, { size: 76, font: F.cn, fill: "#fff" });
  const tw = measure(ctx, "看看手机右上角", 76, F.cn);
  const iw = 90;
  text(ctx, "看看手机右上角", W / 2 - iw / 2, 1215, { size: 76, font: F.cn, fill: "#fff" });
  airplaneIcon(ctx, W / 2 - iw / 2 + tw / 2 + 60, 1212, 76, "#ff9f0a");
  const b = easeOut(phase(abs, O3 + 1.4, O3 + 2.0));
  ctx.globalAlpha = a * b;
  text(ctx, "评论区 @ 那个会在楼下等你的人", W / 2, 1380, { size: 46, font: F.cn, fill: "rgba(255,255,255,0.8)" });
  ctx.restore();
  flash(ctx, easeOut(phase(abs, 98.3, END)), "#000");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < O2) shotSwings(ctx, abs);
    else if (abs < O3) shotThanks(ctx, abs);
    else shotEnd(ctx, abs);
  });
}
