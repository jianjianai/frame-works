import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blob, bloom, bokehDisc, camera, designScene, devScale, easeIn, easeInOut, easeOut, figureMask, filtered, flash, glow, handheld, hash, ik2, inkLine, motes, onFigure, oval, paint, poly, rbox, rimLight, shaded, text, tubePts, writeOn } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { SELFIE_MARK, phone, phoneBack, selfie } from "@materials/s0rrow/code/mirrors/phoneui";
import { roofLight, roofReverse, rooftop } from "@materials/s0rrow/code/mirrors/roof";
import { Disguise, MARK_AT, birthmark, disguise, mapleLeaf, penHeart, penRing, px, redArrow, redNote, tape } from "@materials/s0rrow/code/mirrors/story";
import { BOOK_W, SKETCH_W, TOP_HIDE, bookHands, holdPose, sketchCover, sketchEdges, sketchSpiral } from "@materials/s0rrow/code/mirrors/sketchbook";
import { EV } from "./timeline";

/** 第四幕（32.544 – 52.863，桥段：反转和兑现）
 *  32.544 「I have a question」她翻开速写本：一页一页都是他——3 月靠窗发呆、4 月趴桌睡觉、5 月喂一只黑猫、6 月雨里、
 *         7 月被哄笑时的干笑、8 月吃冰棍、9 月看着手机笑。铅笔画，只有他脸上那片胎记是红色的——画成一片小枫叶。
 *  36.609 最后一页：他昨晚发的那张 P 过的自拍，打印出来贴着；37.12 她用红笔把枫叶画回他脸上，37.63 写「为什么要 P 掉它？」
 *  38.641 他的脸：滑下的墨镜上面，眼睛湿了。
 *  40.672 「I know I really really matter to you」墨镜、口罩、帽子，一拍摘一样——第一次让人看他的脸。
 *  42.704 「you never ever talk to other dudes」她举起手机：锁屏是她画的他（带小枫叶），她脸红冒烟。
 *  44.736 「Oh-oh-oh」她拿红笔在自己脸上也画了一片小枫叶。
 *  46.768 他笑出声；47.07「you」笑停下来，含泪看着她，镜头开始推向他的脸颊。
 *  47.784 一个连续镜头、不写字（用户觉得「她最喜欢的地方」这行字尴尬，改用镜头语言）：切到和开头「瑕疵」一样的
 *         胎记大特写（同一位置、同样大），可这次是暖的、彩色的，画面边上是虚化的她；她的指尖伸进来，沿着当年红笔
 *         圈的位置绕胎记画一圈——留下一圈光，唱到 face（48.29）合上、碎成光点，他闭上眼；48.55「so much」她的手心
 *         托住他的脸颊、拇指轻抚胎记，他偏头靠过去；49.31 镜头长长地拉开，露出夕阳里并肩的两个人（她脸上的
 *         小枫叶），正好落在双人镜头上——
 *  50.831 「When will you be on my level?」她松开手、踮起脚把脸凑到他旁边：「这下一样了」。 */

const GIRL: KidPose = { who: "girl", outfit: "cardigan" };
const FULL: Disguise = { cap: 1, mask: 1, shades: 1 };

/** where the birthmark's centre lands for a drawKid at (x, y, s) with pose p (birthmark()'s own transform) */
function markPoint(x: number, y: number, s: number, p: KidPose, at: Pt = MARK_AT): Pt {
  const fx = (p.turn ?? 0) * 20 * 0.7;
  const t = p.tilt ?? 0;
  const mx = at[0] + fx,
    my = at[1];
  return [x + (mx * Math.cos(t) - my * Math.sin(t) + (p.headX ?? 0)) * s, y + (mx * Math.sin(t) + my * Math.cos(t) + (p.headY ?? 0)) * s];
}

/** the low sun behind her: a soft flare */
function sunFlare(ctx: Ctx, x: number, y: number, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, 340, `rgba(255,210,150,${(0.35 * a).toFixed(3)})`);
  for (const [k, r, al] of [[0.35, 42, 0.1], [0.6, 26, 0.09], [0.9, 64, 0.07]] as [number, number, number][]) {
    bokehDisc(ctx, x + (540 - x) * k * 2, y + (900 - y) * k * 2, r, "255,220,170", al * a);
  }
  ctx.restore();
}
/** backlit: shade on the near side, a gold rim */
function backlit(ctx: Ctx, draw: (c: Ctx) => void, key: string, rim = 0.7, shade = 0.2) {
  const m = figureMask(ctx, draw, key);
  onFigure(ctx, m, (c) => {
    c.fillStyle = `rgba(70,36,56,${shade})`;
    c.fillRect(-500, -500, W + 1000, H + 1000);
  });
  rimLight(ctx, m, 0.5, -1, 6, "rgb(255,216,150)", rim, "lighter", 6);
  rimLight(ctx, m, 1, -0.1, 5, "rgb(255,200,140)", rim * 0.8, "lighter", 6);
}
/** lit by the low sun from in front (him, facing her and the sun) */
function sunlit(ctx: Ctx, draw: (c: Ctx) => void, key: string, k = 1) {
  const m = figureMask(ctx, draw, key);
  onFigure(ctx, m, (c) => {
    const g = c.createLinearGradient(160, 0, 960, 0);
    g.addColorStop(0, `rgba(255,190,120,${(0.32 * k).toFixed(3)})`);
    g.addColorStop(1, `rgba(255,190,120,${(0.08 * k).toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(-500, -500, W + 1000, H + 1000);
  }, "screen");
  rimLight(ctx, m, -1, -0.3, 5, "rgb(255,222,170)", 0.45, "lighter", 6.5);
}
/** her side of the roof (the railing, the town, the sun) out of focus */
function herBackground(ctx: Ctx, abs: number, z = 1.8, key = "bgHer") {
  ctx.save();
  camera(ctx, 700, 860, z, 0, -160, 40);
  filtered(ctx, `blur(${(5 * devScale(ctx)).toFixed(1)}px)`, (c) => {
    rooftop(c, abs);
    roofLight(c);
  }, key);
  ctx.restore();
}
/** his side (the stair housing in the sun) out of focus */
function hisBackground(ctx: Ctx, key = "bgHim") {
  ctx.save();
  camera(ctx, 540, 900, 1.6, 0, 0, 0);
  filtered(ctx, `blur(${(6 * devScale(ctx)).toFixed(1)}px)`, (c) => roofReverse(c), key);
  ctx.restore();
}

// ================================================================ her sketchbook
const PW = 600,
  PH = 800;
const DATES = ["3月", "4月", "5月", "6月", "7月", "8月", "9月"];
const HID: KidPose = { body: "bust", arms: "down", shapeL: "hidden", shapeR: "hidden" };
/** him on each page (page units) */
const PAGES: { x: number; y: number; s: number; pose: KidPose }[] = [
  { x: 340, y: 360, s: 1.0, pose: { ...HID, eyes: "sleepy", look: [-0.85, 0], brows: "flat", mouth: "flat" } },
  { x: 300, y: 410, s: 1.0, pose: { ...HID, eyes: "shut", brows: "flat", mouth: "flat", tilt: 0.38 } },
  { x: 330, y: 330, s: 0.92, pose: { ...HID, eyes: "happy", mouth: "smile", look: [-0.3, 0.8], tilt: 0.1 } },
  { x: 300, y: 390, s: 0.95, pose: { ...HID, eyes: "open", look: [0, -0.5], brows: "sad", mouth: "flat" } },
  { x: 300, y: 370, s: 1.0, pose: { ...HID, eyes: "sleepy", brows: "worried", mouth: "grin" } },
  { x: 290, y: 360, s: 1.0, pose: { ...HID, eyes: "happy", mouth: "smile", tilt: -0.07 } },
  { x: 300, y: 360, s: 1.0, pose: { body: "bust", arms: "phone", shapeL: "hidden", shapeR: "hidden", eyes: "open", look: [0, 0.8], mouth: "smile", blush: 0.7, grip: (c) => phoneBack(c, 0, 320, 120, 230, 0.03, false) } },
];

function sketchCat(c: Ctx, x: number, y: number, s: number, seed: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  inkLine(c, [[30, 54], [62, 40], [70, 6]], seed, 7, "#2a2a30", 0.6);
  oval(c, 0, 46, 36, 30, seed + 1, 1);
  paint(c, "#2a2a30", C.ink, 3);
  for (const sd of [-1, 1]) {
    poly(c, [[sd * 26, -10], [sd * 24, -42], [sd * 6, -24]], seed + 2 + sd, 0.6);
    paint(c, "#2a2a30", C.ink, 3);
  }
  oval(c, 0, 0, 30, 26, seed + 4, 1);
  paint(c, "#2a2a30", C.ink, 3);
  for (const sd of [-1, 1]) {
    oval(c, sd * 11, -2, 5, 6, seed + 5 + sd, 0.3);
    paint(c, "#f4f0d0", null);
  }
  c.restore();
}

/** what's drawn on page i, in colour — it goes through a grey "pencil" filter (the leaf is added after, in red) */
function pageArt(c: Ctx, i: number) {
  const f = PAGES[i];
  if (i === 0) {
    // by the window
    for (const [a, b] of [[[40, 110], [40, 560]], [[40, 110], [190, 110]], [[190, 110], [190, 560]], [[115, 110], [115, 560]], [[40, 330], [190, 330]]] as [Pt, Pt][]) inkLine(c, [a, b], 9401 + a[0] + b[1], 3, "#555");
    for (let k = 0; k < 7; k++) inkLine(c, [[50 + k * 18, 130], [60 + k * 18, 300]], 9410 + k, 1.4, "rgba(80,80,90,0.4)");
  }
  if (i === 3) {
    for (let k = 0; k < 22; k++) {
      const x = (k * 97) % 620,
        y = 60 + ((k * 151) % 700);
      inkLine(c, [[x, y], [x - 14, y + 40]], 9430 + k, 1.6, "rgba(90,100,120,0.55)");
    }
  }
  drawKid(c, f.x, f.y, f.s, f.pose);
  if (i === 1) {
    // dozing off in class
    text(c, "Z", 462, 236, { size: 70, font: F.marker, fill: "#444" });
    text(c, "Z", 520, 168, { size: 52, font: F.marker, fill: "#444" });
    text(c, "Z", 560, 116, { size: 36, font: F.marker, fill: "#444" });
  }
  if (i === 2) sketchCat(c, 150, 600, 1.3, 9450);
  if (i === 3) {
    // under his umbrella in the rain: the canopy well above his hair, ribs, the shaft down past his face
    inkLine(c, [[300, 92], [452, 214], [452, 600]], 9461, 6, "#444", 0.6);
    shaded(c, () => blob(c, [[40, 196], [96, 104], [300, 52], [504, 104], [560, 196], [480, 176], [400, 198], [300, 174], [200, 198], [120, 176]], 9460, 2), "#7aa6c9", () => {
      for (const x of [120, 200, 300, 400, 480]) inkLine(c, [[300, 58], [x, 190]], 9462 + x, 2.4, "rgba(30,40,60,0.45)");
    }, C.ink, 4.5);
    inkLine(c, [[452, 600], [452, 628], [430, 640]], 9463, 6, "#444", 0.4);
  }
  if (i === 4) {
    blob(c, [[470, 240], [484, 266], [482, 282], [470, 290], [458, 282], [456, 266]], 9470, 0.6);
    paint(c, "#bfe6ff", C.ink, 3);
    text(c, "哈", 90, 220, { size: 44, font: F.cn, fill: "#666" });
    text(c, "哈", 520, 300, { size: 40, font: F.cn, fill: "#666" });
  }
  if (i === 5) {
    // a popsicle
    shaded(c, () => rbox(c, 404, 430, 64, 96, 28, 9480, 0.8), "#f29bb6", null, C.ink, 4);
    inkLine(c, [[436, 524], [436, 590]], 9481, 9, "#c9a274");
  }
  // loose pencil marks round the drawing
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    inkLine(c, [[f.x + Math.cos(a) * 250, f.y + Math.sin(a) * 260], [f.x + Math.cos(a + 0.12) * 262, f.y + Math.sin(a + 0.12) * 270]], 9490 + k * 3 + i, 1.4, "rgba(90,90,100,0.35)");
  }
}

function paper(c: Ctx, seed: number) {
  shaded(c, () => rbox(c, 0, 0, PW, PH, 6, seed, 0.6), "#fbf6ea", () => {
    c.fillStyle = "rgba(180,160,120,0.12)";
    for (let k = 0; k < 40; k++) c.fillRect((k * 131) % PW, (k * 197) % PH, 2, 2);
    const g = c.createLinearGradient(0, 0, 0, PH);
    g.addColorStop(0, "rgba(255,255,255,0.3)");
    g.addColorStop(1, "rgba(160,130,90,0.12)");
    c.fillStyle = g;
    c.fillRect(0, 0, PW, PH);
  }, "rgba(70,62,52,0.55)", 2.2);
}

/** page i of the sketchbook (page units, origin top-left) */
function sketchPage(c: Ctx, i: number) {
  paper(c, 9500 + i);
  filtered(c, "grayscale(1) brightness(1.42) contrast(1.15)", (k) => pageArt(k, i), "sketch", 0.95, "multiply");
  // the one thing in colour: the birthmark, drawn as a little red maple leaf
  const f = PAGES[i];
  const [lx, ly] = markPoint(f.x, f.y, f.s, f.pose);
  mapleLeaf(c, lx, ly, 34 * f.s, -0.35 + (f.pose.tilt ?? 0), 9520 + i, 1, "#e2483f", 2.5);
  text(c, DATES[i], 50, 66, { size: 54, font: F.pen, fill: "rgba(70,70,84,0.85)", align: "left" });
}

/** the last page: the photo he sent last night, printed and taped in; her red pen puts the leaf back, and asks */
function photoPage(c: Ctx, abs: number) {
  paper(c, 9530);
  // the photo on the left, a little crooked
  const PX = 52,
    PY = 96,
    pw = 268,
    ph = 384;
  c.save();
  c.translate(PX, PY);
  c.rotate(-0.04);
  c.fillStyle = "rgba(60,50,40,0.18)";
  c.fillRect(10, 12, pw + 16, ph + 16);
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, pw + 16, ph + 16);
  c.save();
  c.translate(8, 8);
  c.beginPath();
  c.rect(0, 0, pw, ph);
  c.clip();
  selfie(c, pw, ph, 0, 0.9);
  c.restore();
  c.strokeStyle = "rgba(70,62,52,0.5)";
  c.lineWidth = 2;
  c.strokeRect(0, 0, pw + 16, ph + 16);
  tape(c, 18, 8, 84, 24, -0.6, 9531);
  tape(c, pw - 2, 8, 84, 24, 0.6, 9532);
  const leaf: Pt = [8 + (SELFIE_MARK[0] * pw) / 600, 8 + (SELFIE_MARK[1] * ph) / 860];
  mapleLeaf(c, leaf[0], leaf[1], 28, -0.35, 9533, phase(abs, EV.leafOnPhoto, EV.leafOnPhoto + 0.35), "#e2483f", 2.5);
  c.restore();
  // and beside it, her question, with an arrow to the leaf
  const wp = phase(abs, EV.why, EV.why + 0.7);
  text(c, writeOn("为什么要", Math.min(1, wp * 1.75)), 462, 236, { size: 66, font: F.pen, fill: "#e2483f" });
  text(c, writeOn("P掉它？", Math.max(0, wp * 1.75 - 0.75)), 462, 316, { size: 66, font: F.pen, fill: "#e2483f" });
  const ap = phase(abs, EV.why + 0.6, EV.why + 0.85);
  if (ap > 0) {
    // a pen line from the question down and round to the leaf (along a curve, drawn on)
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = (i / 12) * ap;
      const a: Pt = [430, 352],
        m: Pt = [300, 500],
        b: Pt = [PX + leaf[0] + 22, PY + leaf[1] + 26];
      pts.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * m[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * m[1] + u * u * b[1]]);
    }
    inkLine(c, pts, 9534, 5, "#e2483f", 0.4);
  }
}

/** the back of a page (blank, a little shadowed) */
function pageBack(c: Ctx) {
  shaded(c, () => rbox(c, 0, 0, PW, PH, 6, 9540, 0.6), "#efe8d8", () => {
    c.fillStyle = "rgba(120,100,70,0.12)";
    c.fillRect(0, 0, PW, PH);
  }, "rgba(70,62,52,0.55)", 2.2);
}

const FLIPS = [...EV.pages, EV.photoPage];
const BOOK_S = 1.42;
const BOOK_C: Pt = [540, 870];
/** her behind the book, in the pose the roof shot (act3) ends on, so the book is where her hands hold it */
const HER4_S = (BOOK_S * SKETCH_W) / BOOK_W;
const HER4: Pt = [BOOK_C[0], BOOK_C[1] - (PH / 2) * BOOK_S - TOP_HIDE * HER4_S];
const HOLD4 = holdPose(1, 1);
/** draw page j (−1 = the cover, 7 = the photo page) */
function anyPage(c: Ctx, abs: number, j: number) {
  if (j < 0) sketchCover(c);
  else if (j < 7) sketchPage(c, j);
  else photoPage(c, abs);
}

function shotBook(ctx: Ctx, abs: number) {
  herBackground(ctx, abs, 1.5, "bgBook");
  // the camera: close on the book, then in on the photo
  const push = easeInOut(phase(abs, EV.photoPage + 0.1, EV.tears));
  const [hx, hy, hr] = handheld(abs, 2.5, 71);
  ctx.save();
  camera(ctx, BOOK_C[0], BOOK_C[1] - 180 * push, 1 + 0.16 * push, hr, hx, -60 * push + hy);
  // her, holding it up over her face (the pose the roof shot ends on): only her hair, arms and shoulders show
  drawKid(ctx, HER4[0], HER4[1], HER4_S, HOLD4);
  ctx.save();
  ctx.translate(BOOK_C[0] - (PW / 2) * BOOK_S, BOOK_C[1] - (PH / 2) * BOOK_S);
  ctx.scale(BOOK_S, BOOK_S);
  // the pages underneath, their edges showing
  sketchEdges(ctx);
  // which page is on top, and whether one is turning over (the cover opens on the downbeat, where the roof shot cuts
  // in on it closed; the pages turn just ahead of their beats)
  let top = -1,
    turning = -2,
    k = 0;
  FLIPS.forEach((f, j) => {
    const [a, b] = j === 0 ? [f, f + 0.16] : [f - 0.1, f + 0.06];
    if (abs >= b) top = j;
    const q = phase(abs, a, b);
    if (q > 0 && q < 1) {
      turning = j - 1;
      k = q;
    }
  });
  if (turning > -2) {
    anyPage(ctx, abs, turning + 1);
    // the shadow of the lifting page
    ctx.fillStyle = `rgba(40,30,20,${(0.25 * Math.sin(Math.PI * k)).toFixed(3)})`;
    ctx.fillRect(0, 0, PW, PH * Math.max(0, Math.cos(Math.PI * k)) + 20);
    const cy = Math.cos(Math.PI * k);
    ctx.save();
    ctx.scale(1, cy);
    if (cy > 0) anyPage(ctx, abs, turning);
    else pageBack(ctx);
    ctx.restore();
  } else anyPage(ctx, abs, top);
  sketchSpiral(ctx);
  ctx.restore();
  // her hands on its sides
  bookHands(ctx, HER4[0], HER4[1], HER4_S, TOP_HIDE);
  ctx.restore();
}

// ================================================================ 38.641 – 40.672 his eyes
function shotTears(ctx: Ctx, abs: number) {
  hisBackground(ctx, "bgHimT");
  const u = easeInOut(phase(abs, EV.tears, EV.unmask[0]));
  const [hx, hy, hr] = handheld(abs, 2.5, 73);
  const pose: KidPose = { body: "bust", eyes: "teary", brows: "sad", mouth: "flat", look: [0, 0.25], tears: 0.5 * smooth(phase(abs, EV.tears + 0.4, EV.unmask[0])), headY: 4 * u, arms: "down" };
  // close on his eyes over the slipped sunglasses (his body runs out of frame)
  const P: Pt = [540, 700],
    S = 3.1;
  const d: Disguise = { ...FULL, shadesY: 34 };
  const draw = (c: Ctx) => {
    drawKid(c, P[0], P[1], S, pose);
    disguise(c, P[0], P[1], S, pose, d);
  };
  ctx.save();
  camera(ctx, P[0], P[1] + 40, 1 + 0.1 * u, hr, hx, hy);
  draw(ctx);
  sunlit(ctx, draw, "him4a");
  ctx.restore();
}

// ================================================================ 40.672 – 42.704 off come the sunglasses, the mask, the cap
/** close on him (his body runs out of the bottom of the frame); his own hands — simple round hands in his hoodie
 *  sleeves — take each thing off on its beat: the sunglasses down and away, the mask pulled down under his chin (the
 *  birthmark), the cap lifted off (his hair springs up). The sun gets warmer on him with each; at the end, still
 *  crying, a small brave smile. */
const HIM_U: Pt = [540, 780];
const HIM_U_S = 2.55;
function shotUnmask(ctx: Ctx, abs: number) {
  hisBackground(ctx, "bgHimU");
  const [t0, t1, t2] = EV.unmask;
  const sh = easeIn(phase(abs, t0, t0 + 0.2)),
    mk = easeInOut(phase(abs, t1, t1 + 0.22)),
    cp = easeIn(phase(abs, t2, t2 + 0.24));
  const shOut = easeIn(phase(abs, t0 + 0.2, t0 + 0.36)),
    cpOut = easeIn(phase(abs, t2 + 0.24, t2 + 0.4));
  const bounce = (t: number) => backOut(phase(abs, t, t + 0.18)) * (1 - phase(abs, t + 0.18, t + 0.4));
  const brave = smooth(phase(abs, t2 + 0.45, t2 + 0.7));
  const [hx, hy, hr] = handheld(abs, 2.2, 75);
  // his hands (head units): from his side up to the grip (on the beat), then along with the thing; then back down
  const mixP = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const REST_R: Pt = [120, 432],
    REST_L: Pt = [-120, 432];
  const handFor = (rest: Pt, grip: Pt, t: number, moved: (abs: number) => Pt, hold: number, back: number): Pt | null => {
    if (abs < t - 0.16 || abs > t + hold + back) return null;
    if (abs < t) return mixP(rest, grip, easeOut(phase(abs, t - 0.16, t)));
    const m = moved(Math.min(abs, t + hold));
    const held: Pt = [grip[0] + m[0], grip[1] + m[1]];
    return mixP(held, rest, easeInOut(phase(abs, t + hold, t + hold + back)));
  };
  const shAt = (a: number) => easeIn(phase(a, t0, t0 + 0.2));
  const cpAt = (a: number) => easeIn(phase(a, t2, t2 + 0.24));
  const mkAt = (a: number) => easeInOut(phase(a, t1, t1 + 0.22));
  const handR = handFor(REST_R, [104, 74], t0, (a) => [130 * shAt(a), 230 * shAt(a)], 0.14, 0.26) ?? handFor(REST_R, [112, -62], t2, (a) => [160 * cpAt(a), -250 * cpAt(a)], 0.2, 0.3);
  const handL = handFor(REST_L, [-44, 140], t1, (a) => [0, 52 * mkAt(a)], 0.22, 0.26);
  const pose: KidPose = {
    body: "bust",
    eyes: "teary",
    brows: brave > 0.5 ? "worried" : "sad",
    mouth: abs < t1 + 0.12 ? "flat" : brave > 0.5 ? "smile" : "wobble",
    look: [0.05, 0.05],
    tears: 0.55,
    blush: 0.3 * brave,
    headY: -8 * bounce(t2) + 2.5 * Math.sin(abs * 9) * (1 - brave),
    tilt: -0.02 + 0.05 * brave,
    arms: "custom",
    handL: handL ?? REST_L,
    handR: handR ?? REST_R,
    shapeL: "hidden",
    shapeR: "hidden",
  };
  // reaching for the sunglasses the elbow stays down by his side, so the forearm shows below his cheek (with the IK it
  // would swing out of frame and leave the hand floating)
  const shadesK = abs < t0 - 0.16 || abs > t0 + 0.4 ? 0 : abs < t0 ? easeOut(phase(abs, t0 - 0.16, t0)) : 1 - easeInOut(phase(abs, t0 + 0.14, t0 + 0.4));
  if (shadesK > 0) pose.elbowR = mixP([150, 322], [212, 300], shadesK);
  const P = HIM_U,
    S = HIM_U_S;
  const d: Disguise = {
    ...FULL,
    shadesY: 34 + 230 * sh + 520 * shOut,
    shadesX: 130 * sh + 140 * shOut,
    shadesRot: 0.55 * sh,
    maskY: 52 * mk,
    maskRot: 0.05 * mk,
    capY: -250 * cp - 520 * cpOut,
    capX: 160 * cp + 160 * cpOut,
    capRot: 0.45 * cp,
  };
  const draw = (c: Ctx) => {
    drawKid(c, P[0], P[1], S, pose);
    birthmark(c, P[0], P[1], S, pose);
    disguise(c, P[0], P[1], S, pose, d);
  };
  ctx.save();
  camera(ctx, P[0], P[1] + 30 * S, 1 + 0.05 * easeInOut(phase(abs, t0, EV.lock)) + 0.015 * (bounce(t0) + bounce(t1) + bounce(t2)), hr, hx, hy);
  draw(ctx);
  sunlit(ctx, draw, "him4b", 0.7 + 0.15 * (sh + mk + cp) + 0.3 * brave);
  // his round hands, over what they hold (the arms are drawKid's, from his shoulders)
  ctx.save();
  ctx.translate(P[0], P[1]);
  ctx.scale(S, S);
  for (const [h, sd, seed] of [[handR, 1, 9601], [handL, -1, 9605]] as [Pt | null, number, number][]) {
    if (!h || h[1] > 400) continue;
    shaded(ctx, () => oval(ctx, h[0], h[1], 30, 29, seed, 0.8), C.skin, () => {
      oval(ctx, h[0] + 12 * sd, h[1] + 14, 24, 18, seed + 1, 0.6);
      paint(ctx, "rgba(196,150,96,0.35)", null);
    }, C.ink, 4.5);
    for (const dy of [-9, 5]) inkLine(ctx, [[h[0] - sd * 2, h[1] + dy], [h[0] - sd * 18, h[1] + dy + 2]], seed + 2 + dy, 2.2, "#c99f75");
  }
  ctx.translate(0, pose.headY ?? 0);
  // his hair springing up when the cap comes off
  const boing = phase(abs, t2 + 0.12, t2 + 0.42);
  if (boing > 0 && boing < 1) {
    ctx.globalAlpha *= 1 - boing;
    for (let i = 0; i < 3; i++) {
      const a = -2.3 + i * 0.6;
      const r0 = 190 + 30 * boing,
        r1 = 230 + 40 * boing;
      inkLine(ctx, [[Math.cos(a) * r0, -40 + Math.sin(a) * r0], [Math.cos(a) * r1, -40 + Math.sin(a) * r1]], 9612 + i, 6, C.ink);
    }
  }
  ctx.restore();
  ctx.restore();
}

// ================================================================ 42.704 – 44.736 her lock screen
/** her lock screen: the wallpaper is her drawing of him (smiling, the red leaf on his cheek); the clock over it */
function lockScreen(c: Ctx) {
  c.fillStyle = "#f4ecdc";
  c.fillRect(0, 0, 600, 1280);
  c.save();
  c.translate(0, 330);
  sketchPage(c, 5);
  c.restore();
  const g = c.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, "rgba(40,30,40,0.42)");
  g.addColorStop(1, "rgba(40,30,40,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 600, 420);
  // a little padlock, the clock
  c.strokeStyle = "#fff";
  c.lineWidth = 5;
  c.beginPath();
  c.arc(300, 92, 13, Math.PI, 0);
  c.stroke();
  c.fillStyle = "#fff";
  c.beginPath();
  c.roundRect(282, 92, 36, 28, 6);
  c.fill();
  text(c, "17:32", 300, 228, { size: 150, font: F.ui, weight: 700, fill: "#fff", shadow: 12 });
  // torch and camera buttons, the home bar
  for (const x of [96, 504]) {
    c.fillStyle = "rgba(40,34,44,0.42)";
    c.beginPath();
    c.arc(x, 1168, 46, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#fff";
  c.beginPath();
  c.roundRect(84, 1146, 24, 40, 6);
  c.fill();
  c.beginPath();
  c.roundRect(484, 1154, 40, 30, 6);
  c.fill();
  c.fillStyle = "rgba(40,34,44,0.5)";
  c.beginPath();
  c.arc(504, 1169, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(60,50,60,0.7)";
  c.beginPath();
  c.roundRect(210, 1244, 180, 10, 5);
  c.fill();
}

/** 42.704 – 44.736 "'cause you never ever talk to other dudes": she brings her phone up beside her cheek, screen to
 *  him, squeezing her eyes shut, red to the ears; the camera pushes in on it until the lock screen fills the frame:
 *  the wallpaper is her drawing of him. Her phone is a real phone's size; her hand holds it from below. */
const HER_L: Pt = [420, 760];
const HER_L_S = 1.9;
/** the phone beside her cheek (her head units) and its scale (600 phone-screen units → 120 head units) */
const PHONE_AT: Pt = [222, 30];
const PHONE_K = 0.2;
function shotLock(ctx: Ctx, abs: number) {
  const up = backOut(phase(abs, EV.lock, EV.lock + 0.24));
  const push = easeInOut(phase(abs, EV.lock + 0.5, EV.lock + 1.1));
  herBackground(ctx, abs, 1.8 + 0.5 * push, "bgLock");
  sunFlare(ctx, 860, 760, 0.7 * (1 - push));
  const [hx, hy, hr] = handheld(abs, 2.2, 77).map((v) => v * (1 - 0.7 * push));
  const P = HER_L,
    S = HER_L_S;
  const lift = 170 * (1 - up);
  const ph: Pt = [PHONE_AT[0], PHONE_AT[1] + lift];
  const her: KidPose = {
    ...GIRL,
    body: "full",
    legs: "stand",
    arms: "custom",
    elbowR: [176, 300 + 0.4 * lift],
    handR: [ph[0] - 4, ph[1] + 120],
    shapeR: "hidden",
    eyes: "happy",
    brows: "flat",
    mouth: "smile",
    blush: 0.95,
    look: [-0.3, 0.2],
    tilt: 0.08 + 0.02 * Math.sin(abs * 7),
    turn: -0.1,
  };
  const phoneC: Pt = [P[0] + ph[0] * S, P[1] + ph[1] * S];
  const z = 1 + (2.6 - 1) * push;
  ctx.save();
  camera(ctx, phoneC[0], phoneC[1], z, hr, hx + (540 - phoneC[0]) * push, hy + (900 - phoneC[1]) * push);
  const draw = (c: Ctx) => drawKid(c, P[0], P[1], S, her);
  draw(ctx);
  backlit(ctx, draw, "her4a", 0.7, 0.14);
  phone(ctx, phoneC[0], phoneC[1], PHONE_K * S, -0.06, (c) => lockScreen(c));
  // her hand round the bottom of the phone
  ctx.save();
  ctx.translate(P[0], P[1]);
  ctx.scale(S, S);
  shaded(ctx, () => oval(ctx, ph[0] + 8, ph[1] + 124, 30, 28, 9580, 0.8), "#f6e1c3", () => {
    oval(ctx, ph[0] + 20, ph[1] + 138, 24, 18, 9581, 0.6);
    paint(ctx, "rgba(196,150,96,0.35)", null);
  }, C.ink, 4.5);
  for (const dy of [-8, 6]) inkLine(ctx, [[ph[0] - 12, ph[1] + 124 + dy], [ph[0] + 4, ph[1] + 126 + dy]], 9582 + dy, 2.2, "#c99f75");
  ctx.restore();
  ctx.restore();
}

// ================================================================ 44.736 – 46.768 her own little leaf
/** her cheek (head units): the same place as his birthmark */
const HER_MARK: Pt = [78, 84];
function shotHerLeaf(ctx: Ctx, abs: number) {
  herBackground(ctx, abs, 2.0, "bgLeaf");
  const t0 = EV.herLeaf;
  const draw01 = phase(abs, t0 + 0.15, t0 + 0.95);
  const done = abs > t0 + 1.0;
  const [hx, hy, hr] = handheld(abs, 2, 79);
  // close on her (her body runs out of the bottom of the frame); her own arm holds the marker
  const P: Pt = [500, 760],
    S = 2.0,
    K = S / 1.55;
  const tilt = done ? -0.06 : 0.04;
  const [lx, ly] = markPoint(P[0], P[1], S, { tilt }, HER_MARK);
  const away = smooth(phase(abs, t0 + 1.0, t0 + 1.3));
  const wob = draw01 > 0 && draw01 < 1 ? Math.sin(abs * 28) * 10 : 0;
  const tip: Pt = [lx + 26 * K + wob + 180 * away, ly + 10 * K + 340 * away];
  const handC: Pt = [tip[0] + K * (120 * Math.cos(-0.75) - 4 * Math.sin(-0.75)), tip[1] + K * (120 * Math.sin(-0.75) + 4 * Math.cos(-0.75))];
  const pose: KidPose = { ...GIRL, body: "full", legs: "stand", arms: "custom", elbowR: [172, 300 - 40 * (1 - away)], handR: [(handC[0] - P[0]) / S, (handC[1] - P[1]) / S], shapeR: "hidden", eyes: done ? "happy" : "open", look: [-0.35, 0], brows: "flat", mouth: "smile", blush: 0.4, tilt };
  ctx.save();
  camera(ctx, P[0], P[1], 1 + 0.05 * smooth(phase(abs, t0, EV.laugh)), hr, hx, hy);
  const draw = (c: Ctx) => drawKid(c, P[0], P[1], S, pose);
  draw(ctx);
  backlit(ctx, draw, "her4b", 0.75, 0.12);
  mapleLeaf(ctx, lx, ly, 52 * K, -0.3 + tilt, 9590, draw01, "#e2483f", 3.5 * K);
  // the red marker in her hand, its tip on her cheek while she draws, then lowered
  ctx.save();
  ctx.translate(tip[0], tip[1]);
  ctx.rotate(-0.75);
  ctx.scale(K, K);
  shaded(ctx, () => rbox(ctx, -4, -12, 210, 26, 12, 9591, 0.6), "#e2483f", () => {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(10, -10, 190, 6);
  }, C.ink, 4);
  poly(ctx, [[-4, -9], [-22, -2], [-4, 9]], 9592, 0.3);
  paint(ctx, "#b8322c", C.ink, 3);
  shaded(ctx, () => oval(ctx, 120, 4, 38, 36, 9593, 0.8), "#f6e1c3", () => {
    oval(ctx, 134, 18, 28, 22, 9594, 0.6);
    paint(ctx, "rgba(196,150,96,0.35)", null);
  }, C.ink, 4.5);
  ctx.restore();
  ctx.restore();
  sunFlare(ctx, 880, 980, 0.8);
}

// ================================================================ 46.768 – 47.784 he laughs
/** close on him laughing (his body runs out of the bottom of the frame); on "you" (47.07) the laugh settles into a
 *  smile, wet eyes on her, and the camera starts in toward his cheek — it carries on into the next close-up */
const SETTLE = 47.07;
function shotLaugh(ctx: Ctx, abs: number) {
  hisBackground(ctx, "bgHimL");
  const t = abs - EV.laugh;
  const settle = smooth(phase(abs, SETTLE, SETTLE + 0.22));
  const calm = settle > 0.5;
  const [hx, hy, hr] = handheld(abs, 3, 81);
  const pose: KidPose = { body: "full", legs: "stand", eyes: calm ? "open" : "happy", look: [0, 0.06], brows: calm ? "flat" : "up", mouth: calm ? "smile" : "laugh", tears: 0.3, blush: 0.3 * settle, headY: Math.abs(Math.sin(t * 13)) * -8 * (1 - settle), tilt: 0.05 * Math.sin(t * 9) * (1 - settle) + 0.03 * settle, arms: "pockets" };
  const P: Pt = [540, 780],
    S = 2.15;
  const burst = backOut(phase(abs, EV.laugh, EV.laugh + 0.25));
  ctx.save();
  // warm light opening up behind him (the rays go once he calms down)
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 540, 760, 900, `rgba(255,214,150,${(0.3 * burst).toFixed(3)})`);
  ctx.globalAlpha = 0.16 * burst * (1 - 0.85 * settle);
  ctx.fillStyle = "#fff1cf";
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2 + t * 0.4;
    ctx.beginPath();
    ctx.moveTo(540, 760);
    ctx.lineTo(540 + Math.cos(a0) * 1500, 760 + Math.sin(a0) * 1500);
    ctx.lineTo(540 + Math.cos(a0 + 0.16) * 1500, 760 + Math.sin(a0 + 0.16) * 1500);
    ctx.fill();
  }
  ctx.restore();
  // the camera zooms about his birthmark, and once he has calmed down it pushes in, drifting the mark toward where the
  // next shot holds it
  const m = markPoint(P[0], P[1], S, { tilt: 0.03 });
  const push = easeIn(phase(abs, SETTLE + 0.1, EV.touch));
  ctx.save();
  camera(ctx, m[0], m[1], (1.04 + 0.06 * (1 - burst)) * (1 + 0.32 * push), hr, hx + (TOUCH_MARK[0] - m[0]) * 0.4 * push, hy + (TOUCH_MARK[1] - m[1]) * 0.4 * push);
  const draw = (c: Ctx) => {
    drawKid(c, P[0], P[1], S, pose);
    birthmark(c, P[0], P[1], S, pose);
  };
  draw(ctx);
  sunlit(ctx, draw, "him4c", 1.3);
  ctx.restore();
  flash(ctx, 0.35 * Math.exp(-t * 10), "#fff6e0");
}

// ================================================================ 47.784 – 52.863 her hand on his cheek, then on tiptoe
/** One continuous shot, no words until the end (the user found the written 「她最喜欢的地方」 awkward; the camera says it).
 *  47.784 cut on the beat to the opening's 「瑕疵」 close-up — the mark in the same place, his face as big — but warm
 *  and in colour now, her blurred face at the edge of the frame: her fingertip comes in and goes round the mark the way
 *  the red pen did, leaving a ring of light that closes on "face" (48.29) and breaks into sparks; his eyes close.
 *  48.55 ("so much") her fingertip comes to rest on the mark (the classroom poke, the opposite meaning) — it warms,
 *  a soft pulse goes out — and he leans into it. 49.31 the camera pulls back and
 *  reveals the two of them side by side on the roof in the sunset, her own red leaf on her cheek, and lands on the
 *  two-shot as "When will you be on my level?" starts (50.83): she lets go and goes up on tiptoe, cheek to cheek —
 *  「这下一样了」 (51.85). */
const HS = 1.6,
  GS = 1.45;
const HP: Pt = [350, 820],
  GP: Pt = [728, 930];
/** the opening's 「瑕疵」 close-up held the mark here, his face at scale 4 */
const TOUCH_MARK: Pt = [560, 900];
const TOUCH_Z = 4 / HS;
const TRACE_IN = EV.touch + 0.14; // her fingertip reaches the mark…
const TRACE_SHUT = beatAt(95); // …and the ring of light closes on "face"
const CUP = 48.55; // "so much": her palm on his cheek
const HER_SKIN = "#f6e1c3",
  CARDI = "#efdcb8",
  CARDI_DK = "#d2b98c";
/** her shoulder and her hand at rest (her head units) */
const HER_SH: Pt = [-92, 192],
  HER_REST: Pt = [-120, 432];
const POINT_LEN = 98;

function togetherHim(abs: number): KidPose {
  const close = smooth(phase(abs, TRACE_SHUT - 0.06, TRACE_SHUT + 0.12));
  const lean = smooth(phase(abs, CUP - 0.12, CUP + 0.3));
  return { body: "full", legs: "stand", eyes: close > 0.5 ? "happy" : "open", look: [0.55, 0.08], brows: "flat", mouth: "smile", blush: 0.3 + 0.2 * close, tears: 0.28 * (1 - smooth(phase(abs, EV.level - 0.5, EV.level))), tilt: 0.02 + 0.08 * lean, arms: "pockets" };
}
/** a point in his head's frame → design units */
function onHim(p: KidPose, q: Pt): Pt {
  const t = p.tilt ?? 0;
  return [HP[0] + HS * ((p.headX ?? 0) + q[0] * Math.cos(t) - q[1] * Math.sin(t)), HP[1] + HS * ((p.headY ?? 0) + q[0] * Math.sin(t) + q[1] * Math.cos(t))];
}
/** the ring her fingertip draws round the mark — where the red pen's ring was in the opening (his head units). It
 *  starts at the bottom right, where her hand comes in, and goes up the outside first (away from his eye). */
function ringPt(u: number): Pt {
  const a = 0.9 - u * Math.PI * 2 * 1.08;
  const x = Math.cos(a) * 62,
    y = Math.sin(a) * 47;
  const cx = MARK_AT[0] - 6,
    cy = MARK_AT[1] - 3;
  return [cx + x * Math.cos(0.3) - y * Math.sin(0.3), cy + x * Math.sin(0.3) + y * Math.cos(0.3)];
}

/** where her fingertip rests on the mark (his head units) once the ring is drawn: the middle of the stain, which sits a
 *  little up and in from MARK_AT */
const TOUCH_AT: Pt = [MARK_AT[0] - 12, MARK_AT[1] - 10];
/** her left arm and hand, in her head units: her fingertip comes in, goes round his mark, then rests on it — the
 *  same gesture as the boy poking it in the classroom, the opposite meaning — and on EV.level drops back to her side */
function herArm(abs: number, him: KidPose, gp: Pt) {
  const toHer = (w: Pt): Pt => [(w[0] - gp[0]) / GS, (w[1] - gp[1]) / GS];
  const mixP = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  // the forearm comes up from an elbow held low and forward by her side, as you reach for a face beside you (in the
  // close-up it comes in diagonally from the bottom-right corner, in line with the hand)
  const elbowFor = (w: Pt): Pt => [w[0] + 62, w[1] + 122];
  const ang = -2.25;
  const wristFor = (tipW: Pt): Pt => {
    const tip = toHer(tipW);
    return [tip[0] - Math.cos(ang) * POINT_LEN, tip[1] - Math.sin(ang) * POINT_LEN];
  };
  let wrist: Pt;
  if (abs < TRACE_IN) {
    // in from below the frame to the top of the ring
    const w0 = wristFor(onHim(him, ringPt(0)));
    wrist = mixP([w0[0] + 150, w0[1] + 260], w0, easeOut(phase(abs, EV.touch, TRACE_IN)));
  } else if (abs < TRACE_SHUT) {
    // round it
    wrist = wristFor(onHim(him, ringPt(easeInOut(phase(abs, TRACE_IN, TRACE_SHUT)))));
  } else {
    // then onto the mark itself, and it stays there (following his face as he leans into it)
    const k = easeInOut(phase(abs, TRACE_SHUT + 0.04, CUP));
    const end = ringPt(1);
    const lift = Math.sin(Math.PI * k) * 14;
    wrist = wristFor(onHim(him, [end[0] + (TOUCH_AT[0] - end[0]) * k + lift, end[1] + (TOUCH_AT[1] - end[1]) * k - lift]));
  }
  let elbow = elbowFor(wrist);
  let hand: { ang: number } | null = { ang };
  // on "When will you…" she lets go: the hand drops back to her side
  const back = smooth(phase(abs, EV.level, EV.level + 0.16));
  if (back > 0) {
    wrist = mixP(wrist, HER_REST, back);
    elbow = mixP(elbow, ik2(HER_SH, HER_REST, 134, 128, -1)[0], back);
    if (back > 0.5) hand = null;
  }
  return { wrist, elbow, hand, front: back < 0.5 };
}

/** her arm again over him (sleeve, cuff, hand), her head units */
function herArmOver(c: Ctx, elbow: Pt, wrist: Pt, hand: ReturnType<typeof herArm>["hand"], seed: number) {
  const cuffStart: Pt = [elbow[0] + (wrist[0] - elbow[0]) * 0.86, elbow[1] + (wrist[1] - elbow[1]) * 0.86];
  const m1: Pt = [(HER_SH[0] + elbow[0]) / 2, (HER_SH[1] + elbow[1]) / 2],
    m2: Pt = [(elbow[0] + cuffStart[0]) / 2, (elbow[1] + cuffStart[1]) / 2];
  shaded(c, () => blob(c, tubePts([HER_SH, m1, elbow, m2, cuffStart], [54, 50, 46, 43, 40], true, false), seed, 1), CARDI, () => {
    blob(c, tubePts([m1, elbow, m2, cuffStart].map(([x, y]) => [x + 12, y + 4] as Pt), [34, 32, 30, 28], true, false), seed + 1, 1);
    paint(c, CARDI_DK, null);
  }, C.ink, 5);
  blob(c, tubePts([cuffStart, wrist], [42, 38], false, false), seed + 2, 0.8);
  paint(c, CARDI_DK, C.ink, 4.5);
  if (!hand) return;
  // a soft fist with the index finger out
  c.save();
  c.translate(wrist[0], wrist[1]);
  c.rotate(hand.ang);
  shaded(c, () => blob(c, [[-8, -24], [26, -30], [46, -22], [54, -4], [48, 20], [26, 28], [-8, 24]], seed + 3, 0.8), HER_SKIN, () => {
    oval(c, 20, 14, 22, 12, seed + 4, 0.6);
    paint(c, "rgba(196,150,96,0.3)", null);
  }, C.ink, 4.5);
  shaded(c, () => blob(c, tubePts([[40, -12], [68, -13], [92, -11]], [21, 19, 17]), seed + 5, 0.5), HER_SKIN, null, C.ink, 4.5);
  inkLine(c, [[82, -16], [90, -15]], seed + 6, 2.2, "#e7b9a3");
  for (const y of [2, 14]) inkLine(c, [[30, y], [48, y + 2]], seed + 7 + y, 2, "#c99f75");
  c.restore();
}

/** the ring of light her fingertip leaves (his head frame): it follows the finger, closes on "face", glows, and breaks
 *  into sparks that drift up */
function lightRing(c: Ctx, abs: number, him: KidPose) {
  const u = easeInOut(phase(abs, TRACE_IN, TRACE_SHUT));
  if (u <= 0) return;
  const fade = 1 - smooth(phase(abs, TRACE_SHUT + 0.2, TRACE_SHUT + 0.85));
  const flare = abs > TRACE_SHUT ? Math.exp(-(abs - TRACE_SHUT) * 6) : 0;
  c.save();
  c.translate(HP[0], HP[1]);
  c.scale(HS, HS);
  c.translate(him.headX ?? 0, him.headY ?? 0);
  c.rotate(him.tilt ?? 0);
  c.globalCompositeOperation = "lighter";
  if (fade > 0) {
    const n = Math.max(2, Math.ceil(60 * u));
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const [w, rgb, a] of [[56, "255,190,110", 0.16], [24, "255,212,150", 0.36], [9, "255,248,226", 1]] as [number, string, number][]) {
      c.strokeStyle = `rgba(${rgb},${Math.min(1, a * fade * (1 + 1.2 * flare)).toFixed(3)})`;
      c.lineWidth = px(c, w);
      c.beginPath();
      for (let i = 0; i <= n; i++) {
        const [x, y] = ringPt((i / n) * u);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  }
  // where her fingertip comes to rest the mark warms, and one soft pulse goes out from it
  const rest = smooth(phase(abs, CUP - 0.05, CUP + 0.3)) * (1 - smooth(phase(abs, EV.level, EV.level + 0.3)));
  if (rest > 0) {
    glow(c, TOUCH_AT[0], TOUCH_AT[1], 90, `rgba(255,200,140,${(0.32 * rest).toFixed(3)})`);
    const pt = phase(abs, CUP, CUP + 0.7);
    if (pt > 0 && pt < 1) {
      c.strokeStyle = `rgba(255,230,180,${(0.7 * (1 - pt)).toFixed(3)})`;
      c.lineWidth = px(c, 10 * (1 - pt) + 2);
      c.beginPath();
      c.ellipse(TOUCH_AT[0], TOUCH_AT[1], 20 + 110 * easeOut(pt), 16 + 90 * easeOut(pt), 0.3, 0, Math.PI * 2);
      c.stroke();
    }
  }
  // the sparks
  const t = phase(abs, TRACE_SHUT, TRACE_SHUT + 1.1);
  if (t > 0 && t < 1) {
    for (let i = 0; i < 14; i++) {
      const [x, y] = ringPt(i / 14);
      const dx = x - MARK_AT[0],
        dy = y - MARK_AT[1];
      const go = easeOut(t) * (0.5 + 0.5 * hash(i * 3.1));
      const sx = x + dx * 0.6 * go,
        sy = y + dy * 0.6 * go - 70 * go;
      const a = (1 - t) * (0.6 + 0.4 * Math.sin(abs * 20 + i));
      spark(c, sx, sy, px(c, 9 + 7 * hash(i * 1.7)), a);
    }
  }
  c.restore();
}
/** a little four-pointed spark of light */
function spark(ctx: Ctx, x: number, y: number, r: number, a: number) {
  if (a <= 0.01) return;
  glow(ctx, x, y, r * 2.4, `rgba(255,226,170,${(0.5 * a).toFixed(3)})`);
  ctx.fillStyle = `rgba(255,252,236,${a.toFixed(3)})`;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.2 : r;
    ctx[i ? "lineTo" : "moveTo"](x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function shotTogether(ctx: Ctx, abs: number) {
  const t0 = EV.level;
  const tip = smooth(phase(abs, t0 + 0.15, t0 + 0.5));
  // the camera: held close on the mark (a slow push), then a long pull-back that lands on the two-shot at EV.level
  const markW = markPoint(HP[0], HP[1], HS, { tilt: 0.1 });
  const [hx, hy, hr] = handheld(abs, 2, 85);
  const zIn = TOUCH_Z * (0.93 + 0.07 * easeOut(phase(abs, EV.touch, EV.touch + 0.6))) * (1 + 0.035 * easeInOut(phase(abs, EV.touch + 0.6, EV.pull)));
  const u = easeInOut(phase(abs, EV.pull, t0));
  let z = abs < EV.pull ? zIn : Math.pow(TOUCH_Z * 1.035, 1 - u);
  z *= 1 + 0.05 * smooth(phase(abs, t0, EV.act4End));
  const at: Pt = [TOUCH_MARK[0] + (markW[0] - TOUCH_MARK[0]) * u + hx, TOUCH_MARK[1] + (markW[1] - TOUCH_MARK[1]) * u + hy];
  // the roof and the sunset behind them, out of focus, moving less than they do
  ctx.save();
  camera(ctx, markW[0], markW[1], 1 + (z - 1) * 0.35, 0, (at[0] - markW[0]) * 0.35, (at[1] - markW[1]) * 0.35);
  herBackground(ctx, abs, 1.6, "bgLevel");
  ctx.restore();
  const him = togetherHim(abs);
  const gp: Pt = [GP[0], GP[1] - 100 * tip];
  const arm = herArm(abs, him, gp);
  const her: KidPose = { ...GIRL, body: "full", legs: "stand", eyes: abs < t0 - 0.1 ? "open" : "happy", look: [-0.75, 0.06], brows: "flat", mouth: abs < t0 ? "smile" : "grin", blush: 0.6, tilt: abs < t0 ? -0.06 : -0.12 * tip, arms: "custom", handL: arm.wrist, elbowL: arm.elbow, shapeL: arm.front ? "hidden" : "relax" };
  ctx.save();
  camera(ctx, markW[0], markW[1], z, hr, at[0] - markW[0], at[1] - markW[1]);
  // her (beside him, a little behind): out of focus while the camera is in close on him
  const drawHer = (c: Ctx) => drawKid(c, gp[0], gp[1], GS, her);
  const herLayer = (c: Ctx) => {
    drawHer(c);
    const [lx, ly] = markPoint(gp[0], gp[1], GS, her, HER_MARK);
    mapleLeaf(c, lx, ly, 34 * GS, -0.3 + (her.tilt ?? 0), 9590, 1, "#e2483f", 3 * GS);
    backlit(c, drawHer, "her4c", 0.75, 0.12);
  };
  const dof = 6 * Math.min(1, Math.max(0, (z - 1.06) / (TOUCH_Z - 1.06)));
  if (dof > 0.3) filtered(ctx, `blur(${(dof * devScale(ctx)).toFixed(1)}px)`, herLayer, "herDof");
  else herLayer(ctx);
  const drawHim = (c: Ctx) => {
    drawKid(c, HP[0], HP[1], HS, him);
    birthmark(c, HP[0], HP[1], HS, him);
  };
  drawHim(ctx);
  backlit(ctx, drawHim, "him4e", 0.7, 0.1);
  // her hand on his face is in front of him
  if (arm.front) {
    ctx.save();
    ctx.translate(gp[0], gp[1]);
    ctx.scale(GS, GS);
    herArmOver(ctx, arm.elbow, arm.wrist, arm.hand, 9620);
    ctx.restore();
  }
  lightRing(ctx, abs, him);
  ctx.restore();
  // gold dust in the low sun, and the flare
  motes(ctx, abs, 600, 860, 480, 640, 26, 93, "255,228,176", 0.9 * (0.5 + 0.5 * (1 - u)), 3);
  sunFlare(ctx, 880 + 60 * (1 - u), 1000 - 180 * (1 - u), 0.9);
  redNote(ctx, "这下一样了", 250, 420, phase(abs, beatAt(102), beatAt(102) + 0.6), -0.04, 110);
  if (abs > beatAt(102) + 0.6) {
    for (let i = 0; i < 4; i++) {
      const k = ((abs - beatAt(102) - 0.6) * 0.8 + i * 0.25) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      penHeart(ctx, 300 + i * 160, 640 - k * 160, 30 + (i % 2) * 10, 1, 9610 + i);
      ctx.restore();
    }
  }
}

function vignette(ctx: Ctx, a: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a.toFixed(2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
}

export function createScene(options: SceneOptions) {
  return designScene(options, EV.twist, (ctx, abs) => {
    if (abs < EV.tears) shotBook(ctx, abs);
    else if (abs < EV.unmask[0]) shotTears(ctx, abs);
    else if (abs < EV.lock) shotUnmask(ctx, abs);
    else if (abs < EV.herLeaf) shotLock(ctx, abs);
    else if (abs < EV.laugh) shotHerLeaf(ctx, abs);
    else if (abs < EV.touch) shotLaugh(ctx, abs);
    else shotTogether(ctx, abs);
    bloom(ctx, 0.22, 26, 2.6);
    vignette(ctx, 0.3);
  });
}
