// 现在（凌晨三点，他的房间）的共用画法：手机特写背后虚化的房间光斑和屏幕冷光，坐在床上举着手机的他（屏幕的光从下往上、
// 月光轮廓光、被子盖着膝盖）、集中线、冷汗、呼气。分镜 1–3、7–10 共用。
import { clamp } from "@frame/engine/math";
import { C, Ctx, H, Pt, blob, bokehDisc, camera, curve, easeInOut, easeOut, figureMask, fillBg, filtered, glow, hash, inkLine, onFigure, oval, paint, rimLight, shaded, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { phoneBack } from "@materials/s0rrow/code/mirrors/phoneui";

/** how much of the camera's moves the out-of-focus background takes (it is far behind): drift, jolts and pushes */
export const PARALLAX = 0.5;
export const PARALLAX_ZOOM = 0.45;

/** His room at 3 a.m., far out of focus behind the phone: the dark, moonlight from the window on the right and the
 *  warm fairy lights strung along the wall. */
export function roomBokeh(ctx: Ctx, abs: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 1040, 430, 560, "rgba(100,130,225,0.2)");
  glow(ctx, 1060, 360, 220, "rgba(165,190,255,0.16)");
  ctx.restore();
  // fairy lights sagging across the wall
  for (let i = 0; i < 11; i++) {
    const u = i / 10;
    const x = -60 + u * 1200;
    const y = 250 + 170 * Math.sin(u * Math.PI) + (i % 2) * 22;
    const r = 30 + 26 * hash(i * 3.1 + 1);
    const tw = 0.86 + 0.14 * Math.sin(abs * 1.6 + i * 1.9);
    bokehDisc(ctx, x, y, r, "255,184,110", 0.34 * tw);
  }
  // a few cold specks of the town outside, lower right; a charger's tiny green light lower left
  for (let i = 0; i < 5; i++) bokehDisc(ctx, 950 + hash(i * 5.3) * 160, 700 + hash(i * 2.9) * 300, 14 + 10 * hash(i), "150,180,255", 0.18);
  bokehDisc(ctx, 90, 1560, 16, "120,255,170", 0.22);
}

/** the phone's cold light in the air around it */
export function screenLight(ctx: Ctx, cx: number, cy: number, s: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, cy);
  ctx.scale(1, 1.45);
  glow(ctx, 0, 0, 620 * s, "rgba(150,170,240,0.13)", a);
  ctx.restore();
}

/** where he sits up in bed (design units): head centre and scale; the phone held under his chin */
export const HIM = { x: 540, y: 580, s: 1.7 };
/** his arms (head units): elbows tucked by his ribs, hands up at the phone */
export const ARMS = { elbowL: [-150, 430] as Pt, elbowR: [150, 430] as Pt, handL: [-58, 284] as Pt, handR: [58, 284] as Pt };

/** the phone in his hands, its back to us, with simple round hands (用户：手用简单的圆) and the faded red string on
 *  his left wrist (screen right) — the same string as the boy's in her photo. Head units, drawn in drawKid's grip. */
export function phoneHands(c: Ctx) {
  phoneBack(c, 0, 236, 108, 204, 0.03, false);
  for (const sd of [-1, 1]) {
    shaded(c, () => oval(c, sd * 58, 284, 30, 28, 8950 + sd, 0.8), C.skin, () => {
      oval(c, sd * 58 + 13, 298, 23, 19, 8952 + sd, 0.6);
      paint(c, "rgba(196,150,96,0.38)", null);
    }, C.ink, 5);
  }
  // the string: round his wrist just below the hand, along the cuff
  c.save();
  c.translate(66, 312);
  c.rotate(-0.55);
  curve(c, [[-30, -2], [-10, 5], [10, 5], [30, -2]], 8960, 0.5);
  paint(c, null, C.ink, 10);
  curve(c, [[-30, -2], [-10, 5], [10, 5], [30, -2]], 8960, 0.5);
  paint(c, null, "#b8605a", 6);
  oval(c, 14, 6, 5.5, 5, 8961, 0.3);
  paint(c, "#b8605a", C.ink, 2.4);
  inkLine(c, [[16, 10], [22, 20], [19, 28]], 8962, 3.2, "#b8605a", 0.4);
  c.restore();
}

/** his room behind him, out of focus: the dark wall, the moonlit window on the left with the town's lights, a string
 *  of warm fairy lights, the pale pillow behind his shoulders */
export function bedBack(ctx: Ctx, abs: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 90, 520, 520, "rgba(110,140,235,0.22)");
  glow(ctx, 60, 470, 200, "rgba(175,200,255,0.2)");
  ctx.restore();
  for (let i = 0; i < 7; i++) bokehDisc(ctx, 30 + hash(i * 4.3) * 230, 600 + hash(i * 1.7) * 300, 12 + 10 * hash(i * 2.2), "255,214,150", 0.22);
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const x = 160 + u * 960;
    const y = 300 + 110 * Math.sin(u * Math.PI * 0.9) + (i % 2) * 20;
    const tw = 0.85 + 0.15 * Math.sin(abs * 1.7 + i * 2.3);
    bokehDisc(ctx, x, y, 34 + 22 * hash(i * 5.7 + 2), "255,182,108", 0.3 * tw);
  }
  // the headboard and the pillow behind his shoulders, soft and dark
  filtered(ctx, "blur(7px)", (c) => {
    c.fillStyle = "#1a2142";
    c.fillRect(-60, 980, 1200, 1000);
    blob(c, [[90, 1010], [200, 940], [470, 930], [520, 1000], [500, 1230], [110, 1240]], 8970, 2);
    paint(c, "#2c3660", null);
    blob(c, [[580, 1000], [640, 930], [900, 936], [1010, 1000], [1000, 1240], [590, 1230]], 8971, 2);
    paint(c, "#2a3359", null);
  }, "bedBack");
}

/** the blanket over his lap, in front of everything */
/** the duvet pulled up to his waist, his knees raised under it (用户：身体下面没有腿) — two hills in front of him, the
 *  phone's light on their tops; it covers the bottom of his hoodie and his elbows resting on it */
export const KNEES: Pt[] = [[398, 1222], [690, 1222]];
export function blanket(ctx: Ctx) {
  const edge: Pt[] = [
    [-60, 1372], [80, 1352], [200, 1304], [300, 1252], [398, 1222], [478, 1260], [540, 1296], [604, 1262], [690, 1222],
    [792, 1252], [892, 1302], [1000, 1346], [1140, 1366], [1140, 2000], [-60, 2000],
  ];
  shaded(ctx, () => blob(ctx, edge, 8980, 1.6), "#2e3a66", () => {
    // the screen's light along the top of the hills, the dark down in the folds
    const g = ctx.createLinearGradient(0, 1210, 0, 1720);
    g.addColorStop(0, "rgba(160,190,255,0.34)");
    g.addColorStop(0.22, "rgba(160,190,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(-60, 1200, 1200, 800);
    for (const [kx, ky] of KNEES) glow(ctx, kx, ky + 30, 150, "rgba(170,195,255,0.22)");
    // folds falling away from each knee, and one down the valley between them
    for (const [kx, ky] of KNEES) {
      inkLine(ctx, [[kx - 10, ky + 22], [kx - 44, ky + 110], [kx - 70, ky + 200]], 8981 + kx, 3, "#222b50");
      inkLine(ctx, [[kx + 14, ky + 30], [kx + 40, ky + 120], [kx + 52, ky + 196]], 8982 + kx, 3, "#222b50");
    }
    inkLine(ctx, [[540, 1306], [546, 1380], [538, 1460]], 8983, 3, "#222b50");
  }, C.ink, 6);
}

/** speed lines rushing in toward his face (漫画的集中线), fading over k 0..1 */
export function focusLines(ctx: Ctx, cx: number, cy: number, k: number, seed = 8990) {
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + hash(seed + i) * 0.08;
    const r0 = 560 + 160 * hash(seed + i * 3.1) + 60 * k,
      r1 = 1150;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a + 0.012) * r1, cy + Math.sin(a + 0.012) * r1);
    ctx.lineTo(cx + Math.cos(a - 0.012) * r1, cy + Math.sin(a - 0.012) * r1);
    ctx.closePath();
    ctx.fillStyle = i % 3 ? "rgba(235,240,255,0.42)" : "rgba(10,12,24,0.5)";
    ctx.fill();
  }
  ctx.restore();
}

/** a bead of sweat running down from his temple (head units), k 0..1 */
export function sweat(ctx: Ctx, k: number) {
  if (k <= 0) return;
  const y = -6 + 70 * easeInOut(k);
  ctx.save();
  ctx.globalAlpha *= Math.min(1, k * 4);
  blob(ctx, [[128, y - 26], [140, y + 2], [128, y + 14], [116, y + 2]], 8995, 0.6);
  paint(ctx, "#bfe6ff", C.ink, 3.5);
  oval(ctx, 125, y + 1, 3.5, 5, 8996, 0.3);
  paint(ctx, "rgba(255,255,255,0.9)", null);
  ctx.restore();
}

/** a sigh leaving his mouth (head units): three soft strokes drifting up and right, k 0..1 */
export function breath(ctx: Ctx, k: number) {
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.sin(Math.PI * k) * 0.85;
  const d = 40 * easeOut(k);
  for (let i = 0; i < 3; i++) {
    const y = 96 + i * 16 - d * 0.5;
    const x = 40 + d + i * 6;
    inkLine(ctx, [[x, y], [x + 22, y - 8], [x + 40, y - 2], [x + 58, y - 12]], 8997 + i, 4, "rgba(225,235,255,0.9)", 0.6);
  }
  ctx.restore();
}

export interface BedShot {
  pose: KidPose;
  /** the camera on him: zoom about (cx, cy), roll, drift/shake offsets */
  zoom: number;
  rot: number;
  dx: number;
  dy: number;
  /** a whip's offset (the room takes 0.85 of it) */
  whip: number;
  cx?: number;
  cy?: number;
  focus?: number;
  sweat?: number;
  breath?: number;
}
/** Him sitting up in bed at 3 a.m. with the phone under his chin (分镜 2、3): the room behind (parallax), the screen's
 *  cold light from below on his face, the moon's rim from behind, the duvet over his knees. */
export function bedScene(c: Ctx, abs: number, o: BedShot) {
  const cx = o.cx ?? 540,
    cy = o.cy ?? 700;
  // the room behind him is far (parallax): it follows the camera about half as much as he does
  fillBg(c, vgrad(c, 0, H, [[0, "#0c1128"], [0.6, "#151c3a"], [1, "#0b0f22"]]));
  c.save();
  camera(c, cx, cy, 1 + PARALLAX_ZOOM * (o.zoom - 1), o.rot * 0.6, o.dx * PARALLAX, o.dy * PARALLAX + o.whip * 0.85);
  bedBack(c, abs);
  c.restore();
  c.save();
  camera(c, cx, cy, o.zoom, o.rot, o.dx, o.dy + o.whip);
  const pose = o.pose;
  const him = (k: Ctx) => {
    drawKid(k, HIM.x, HIM.y, HIM.s, pose);
    k.save();
    k.translate(HIM.x + (pose.headX ?? 0) * HIM.s, HIM.y + (pose.headY ?? 0) * HIM.s);
    k.scale(HIM.s, HIM.s);
    sweat(k, o.sweat ?? 0);
    k.restore();
  };
  him(c);
  const m = figureMask(c, him, "bedHim");
  // the room is dark: he sinks into it…
  onFigure(c, m, (k) => {
    const g = k.createRadialGradient(HIM.x, HIM.y + 60, 120, HIM.x, HIM.y + 60, 900);
    g.addColorStop(0, "rgba(10,14,40,0.32)");
    g.addColorStop(1, "rgba(10,14,40,0.7)");
    k.fillStyle = g;
    k.fillRect(-200, -200, 1500, 2400);
  });
  // …except where the screen lights him, cold, from under his chin (the phone's back stays dark)
  const chin = HIM.y + 140 * HIM.s;
  const phoneCut = (k: Ctx) => {
    k.beginPath();
    k.roundRect(HIM.x - 56 * HIM.s, HIM.y + 133 * HIM.s, 112 * HIM.s, 208 * HIM.s, 22 * HIM.s);
    k.fill();
  };
  onFigure(c, m, (k) => {
    const g = k.createRadialGradient(HIM.x, chin + 20, 30, HIM.x, chin - 60, 560);
    g.addColorStop(0, "rgba(225,236,255,1)");
    g.addColorStop(0.4, "rgba(170,198,255,0.62)");
    g.addColorStop(1, "rgba(150,180,255,0)");
    k.fillStyle = g;
    k.fillRect(-200, -200, 1500, 2400);
  }, "screen", 0.78, phoneCut);
  // moonlight from the window behind him on the left: a cold rim
  rimLight(c, m, -1, -0.5, 6, "rgb(160,185,255)", 0.45, "lighter", 6);
  // the screen's light leaking over the top edge of the phone
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, HIM.x, chin + 4, 190, "rgba(190,210,255,0.3)");
  c.restore();
  if (o.breath) {
    c.save();
    c.translate(HIM.x + (pose.headX ?? 0) * HIM.s, HIM.y + (pose.headY ?? 0) * HIM.s);
    c.scale(HIM.s, HIM.s);
    breath(c, o.breath);
    c.restore();
  }
  blanket(c);
  focusLines(c, HIM.x, HIM.y + 30, o.focus ?? 0);
  c.restore();
}

/** his pose in bed: the phone under his chin, arms tucked (the face is the caller's) */
export const bedPose = (face: KidPose): KidPose => ({
  body: "bust",
  arms: "custom",
  ...ARMS,
  shapeL: "hidden",
  shapeR: "hidden",
  grip: phoneHands,
  seed: 21,
  ...face,
});

