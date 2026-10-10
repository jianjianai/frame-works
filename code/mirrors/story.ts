/**
 * 《mirrors》的道具和批注：主角的胎记 birthmark（MARK_AT；看起来的中心比 MARK_AT 偏左上约 (−12, −10)）、伪装 disguise（遮瑕、口罩、
 * 墨镜、帽子，可以单独移开）、红笔批注 penRing（一圈多一点的笔圈）/ redNote（龙藏体写字动画）/ redArrow / penHeart / mapleLeaf、
 * 糊镜子的报纸 newspaper 和胶带 tape、袖子加圆手 sleeveHand；toDesign / px 换算屏幕坐标和按设计像素的线宽。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, Pt, backOut, beginFrame, blob, curve, devScale, hash, inkLine, loadFonts, oval, paint, poly, rootScale, rrectPts, shaded, text, tubePts, writeOn } from "../draw";
import { drawKid } from "../kid";
import type { KidPose } from "../kid";

/** 《瑕疵：0》 story pieces shared by the acts: his birthmark, the pen annotations, the covered mirrors. */

// ---------------------------------------------------------------- his birthmark
/** kid.ts FACE (head units): the birthmark is clipped to it with the same seed, so it ends exactly at his jaw line. */
const FACE: Pt[] = [
  [-60, -106], [-104, -74], [-118, -20], [-116, 34], [-104, 78], [-80, 106], [-42, 124], [0, 130],
  [42, 122], [80, 104], [104, 76], [116, 32], [118, -20], [104, -74], [60, -106], [0, -114],
];
/** A port-wine stain on his left cheek (screen right when he faces us): from under the eye across the cheek to the
 *  jaw, toward the ear. Five soft lobes — she will draw it as a little red maple leaf. Head units. */
const MARK: Pt[] = [
  [34, 66], [44, 58], [56, 62], [66, 55], [78, 58], [90, 53], [102, 54], [108, 40], [117, 42], [121, 58],
  [118, 74], [123, 88], [115, 102], [107, 116], [93, 119], [84, 129], [70, 125], [60, 117], [50, 121], [43, 109],
  [37, 97], [41, 85], [31, 77],
];
/** a few small satellite spots around its edge (centre x, y, radius) */
const SPOTS: [number, number, number][] = [[27, 92, 4.5], [113, 30, 4], [99, 128, 3.5], [44, 128, 3]];
/** centre and size of the mark (head units), for rings and arrows */
export const MARK_AT: Pt = [80, 86];

/** Draw his birthmark over a drawKid made with the same (x, y, s, pose). Multiplied, so his ink lines stay black. */
export function birthmark(ctx: Ctx, x: number, y: number, s: number, p: KidPose = {}, alpha = 1) {
  if (alpha <= 0.01 || p.view === "back" || p.who === "girl") return;
  const seed = p.seed ?? 11;
  const fx = (p.turn ?? 0) * 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(p.headX ?? 0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  blob(ctx, FACE, seed + 5, 1.1);
  ctx.clip();
  ctx.translate(fx * 0.7, 0);
  const k = devScale(ctx);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha *= alpha;
  // a port-wine stain: a deep wine red with a clear (slightly soft) map-like edge, so it can't be mistaken for a blush
  ctx.filter = `blur(${Math.max(0.4, 1.5 * k).toFixed(1)}px)`;
  ctx.fillStyle = "rgba(180,60,110,0.86)";
  blob(ctx, MARK, 7100, 1.2);
  ctx.fill();
  for (const [sx, sy, r] of SPOTS) {
    oval(ctx, sx, sy, r, r * 0.9, 7105 + sx, 0.4);
    ctx.fill();
  }
  // deeper patches inside, soft
  ctx.filter = `blur(${Math.max(0.5, 4 * k).toFixed(1)}px)`;
  ctx.fillStyle = "rgba(150,40,90,0.45)";
  oval(ctx, 76, 84, 24, 17, 7110, 1.2, -0.4);
  ctx.fill();
  oval(ctx, 106, 92, 12, 18, 7111, 1, 0.3);
  ctx.fill();
  oval(ctx, 58, 106, 9, 8, 7112, 0.8);
  ctx.fill();
  ctx.filter = "none";
  ctx.restore();
}

// ---------------------------------------------------------------- his disguises (act 2 at the mirror, act 3 on the roof)
export interface Disguise {
  /** 0..1 a thick dab of concealer over the birthmark (a shade too orange; the wine red shows through) */
  concealer?: number;
  /** 0..1 a white face mask — it stops just under his eyes, so the top of the mark still shows */
  mask?: number;
  /** 0..1 big black sunglasses */
  shades?: number;
  /** the sunglasses slid down his nose (head units; ~30 = peering over them) */
  shadesY?: number;
  /** 0..1 a black baseball cap */
  cap?: number;
  /** the mask pulled down / the cap lifted off (head units) */
  maskY?: number;
  capY?: number;
  /** a hand taking them off: sideways shifts and tilts (head units, rad) */
  shadesX?: number;
  shadesRot?: number;
  maskX?: number;
  maskRot?: number;
  capX?: number;
  capRot?: number;
}
/** rotate about (0, y) in the current frame */
function turnAbout(ctx: Ctx, y: number, rot?: number) {
  if (!rot) return;
  ctx.translate(0, y);
  ctx.rotate(rot);
  ctx.translate(0, -y);
}
/** the cap seen from behind (his back to us): the crown and the strap over the back of his hair */
function capBack(ctx: Ctx, seed: number) {
  shaded(ctx, () => blob(ctx, [[-122, -40], [-116, -112], [-72, -164], [0, -180], [72, -164], [116, -112], [122, -40]], seed + 30, 1.2), "#2a2d36", () => {
    inkLine(ctx, [[0, -178], [0, -46]], seed + 31, 2.4, "rgba(255,255,255,0.14)");
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(40, -190, 100, 160);
  }, C.ink, 5);
  shaded(ctx, () => blob(ctx, [[-40, -74], [40, -74], [36, -44], [-36, -44]], seed + 35, 0.6), "#3c4050", null, C.ink, 3.5);
}
/** Draw his disguise over a drawKid + birthmark made with the same (x, y, s, pose). With mask + shades on, pass the
 *  birthmark alpha 0 (it is covered). */
export function disguise(ctx: Ctx, x: number, y: number, s: number, p: KidPose, d: Disguise, seed = 7800) {
  if (p.who === "girl") return;
  const fx = (p.turn ?? 0) * 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(p.headX ?? 0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  if (p.view === "back") {
    if (d.cap && d.cap > 0.01) {
      ctx.globalAlpha *= d.cap;
      capBack(ctx, seed);
    }
    ctx.restore();
    return;
  }
  if (d.concealer && d.concealer > 0.01) {
    ctx.save();
    blob(ctx, FACE, (p.seed ?? 11) + 5, 1.1);
    ctx.clip();
    ctx.translate(fx * 0.7, 0);
    ctx.globalAlpha *= d.concealer;
    // a flat blotch a shade too orange over the middle of it — the lobes of the mark still show all round it
    oval(ctx, 80, 88, 30, 26, seed, 1.2, -0.3);
    ctx.fillStyle = "#f4c08e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(190,120,80,0.6)";
    ctx.stroke();
    // dabbed on with a finger: lighter blotches
    for (let i = 0; i < 4; i++) {
      oval(ctx, 68 + (i % 2) * 22 + hash(seed + i) * 4, 78 + Math.floor(i / 2) * 18 + hash(seed + 9 + i) * 4, 7, 5, seed + 1 + i, 0.4);
      ctx.fillStyle = "rgba(255,226,190,0.7)";
      ctx.fill();
    }
    ctx.restore();
  }
  if (d.mask && d.mask > 0.01) {
    ctx.save();
    ctx.translate(fx * 0.8 + (d.maskX ?? 0), d.maskY ?? 0);
    turnAbout(ctx, 100, d.maskRot);
    ctx.globalAlpha *= d.mask;
    for (const sd of [-1, 1]) inkLine(ctx, [[sd * 104, 76], [sd * 120, 48], [sd * 112, 24]], seed + 10 + sd, 3.2, "#cfd5dc", 0.4);
    shaded(ctx, () => blob(ctx, [[-110, 86], [-58, 70], [0, 56], [58, 70], [110, 86], [106, 118], [62, 138], [0, 146], [-62, 138], [-106, 118]], seed + 12, 1), "#eef1f4", () => {
      for (const yy of [86, 104, 122]) inkLine(ctx, [[-96, yy], [0, yy + 6], [96, yy]], seed + yy, 2.4, "rgba(120,134,150,0.5)", 0.5);
      ctx.fillStyle = "rgba(140,156,176,0.28)";
      ctx.fillRect(20, 50, 100, 100);
    }, C.ink, 4.5);
    ctx.restore();
  }
  if (d.shades && d.shades > 0.01) {
    ctx.save();
    ctx.translate(fx + (d.shadesX ?? 0), d.shadesY ?? 0);
    turnAbout(ctx, 39, d.shadesRot);
    ctx.globalAlpha *= d.shades;
    for (const sd of [-1, 1]) inkLine(ctx, [[sd * 92, 28], [sd * 118, 22]], seed + 20 + sd, 4.5);
    inkLine(ctx, [[-10, 28], [0, 23], [10, 28]], seed + 23, 4.5);
    for (const sd of [-1, 1]) {
      blob(ctx, rrectPts(sd * 50 - 44, 10, 88, 58, 24), seed + 24 + sd, 0.8);
      paint(ctx, "#15151b", C.ink, 4.5);
      inkLine(ctx, [[sd * 50 - 28, 24], [sd * 50 - 8, 19]], seed + 27 + sd, 4.5, "rgba(255,255,255,0.45)", 0.3);
    }
    ctx.restore();
  }
  if (d.cap && d.cap > 0.01) {
    ctx.save();
    ctx.translate(d.capX ?? 0, d.capY ?? 0);
    turnAbout(ctx, -100, d.capRot);
    ctx.globalAlpha *= d.cap;
    shaded(ctx, () => blob(ctx, [[-120, -60], [-114, -118], [-72, -166], [0, -182], [72, -166], [114, -118], [120, -60]], seed + 30, 1.2), "#2a2d36", () => {
      inkLine(ctx, [[0, -180], [0, -66]], seed + 31, 2.4, "rgba(255,255,255,0.14)");
      inkLine(ctx, [[-60, -170], [-84, -66]], seed + 32, 2.4, "rgba(255,255,255,0.1)");
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(40, -190, 100, 140);
    }, C.ink, 5);
    oval(ctx, 0, -180, 10, 6, seed + 33, 0.4);
    paint(ctx, "#2a2d36", C.ink, 3);
    shaded(ctx, () => blob(ctx, [[-124, -66], [0, -80], [124, -66], [134, -46], [0, -30], [-134, -46]], seed + 34, 1), "#1f2229", null, C.ink, 5);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- her red maple leaf (how she draws his birthmark)
const LEAF: Pt[] = [
  [0, -1], [0.13, -0.62], [0.36, -0.76], [0.3, -0.42], [0.7, -0.52], [0.58, -0.27], [0.94, -0.12], [0.52, 0.06], [0.6, 0.3], [0.2, 0.22],
  [0.07, 0.46], [0.05, 0.94], [-0.05, 0.94], [-0.07, 0.46], [-0.2, 0.22], [-0.6, 0.3], [-0.52, 0.06], [-0.94, -0.12], [-0.58, -0.27],
  [-0.7, -0.52], [-0.3, -0.42], [-0.36, -0.76], [-0.13, -0.62],
];
/** A little red maple leaf, centre (x, y), `size` = its radius, drawn on over p (0..1 grows it). `lw` ink width. */
export function mapleLeaf(ctx: Ctx, x: number, y: number, size: number, rot: number, seed: number, p = 1, color = "#e2483f", lw = 3) {
  if (p <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const k = size * backOut(Math.min(1, p));
  ctx.scale(k, k);
  poly(ctx, LEAF, seed, 0.012);
  paint(ctx, color, C.ink, lw / size);
  ctx.strokeStyle = "rgba(120,20,20,0.55)";
  ctx.lineWidth = (lw * 0.6) / size;
  ctx.lineCap = "round";
  for (const [tx, ty] of [[0, -0.8], [0.74, -0.16], [-0.74, -0.16], [0.46, 0.22], [-0.46, 0.22]] as Pt[]) {
    ctx.beginPath();
    ctx.moveTo(0, 0.36);
    ctx.lineTo(tx * 0.85, ty * 0.85 + 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- pen annotations
/** Where a point (in ctx's current transform) lands on screen, in design units. */
export function toDesign(ctx: Ctx, x: number, y: number): Pt {
  const m = ctx.getTransform();
  const r = rootScale();
  return [(m.a * x + m.c * y + m.e) / r, (m.b * x + m.d * y + m.f) / r];
}
/** design px → local units at ctx's transform (line widths that stay the same size whatever the zoom) */
export const px = (ctx: Ctx, v: number) => (v * rootScale()) / devScale(ctx);

/** A pen ring drawn on over p (0..1): a little more than one loop, the way you circle something on paper.
 *  Local units; `lw` in design px. A soft dark line under it keeps it readable on any picture. */
export function penRing(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, p: number, seed: number, color: string, lw: number, rot = -0.25) {
  if (p <= 0) return;
  const n = 36;
  const turns = 1.16;
  const m = Math.max(2, Math.ceil(n * clamp(p)));
  const pts: Pt[] = [];
  for (let i = 0; i <= m; i++) {
    const u = (i / n) * turns;
    const a = -2.3 + u * Math.PI * 2;
    const grow = 1 + 0.06 * Math.sin(u * 7 + seed) + 0.5 * Math.max(0, u - 0.96);
    const x = Math.cos(a) * rx * grow,
      y = Math.sin(a) * ry * grow;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  ctx.save();
  curve(ctx, pts, seed, 0.5);
  paint(ctx, null, "rgba(16,14,22,0.45)", px(ctx, lw + 5));
  curve(ctx, pts, seed, 0.5);
  paint(ctx, null, color, px(ctx, lw));
  ctx.restore();
}

/** A little hand-drawn heart that pops in (p 0..1). (x, y) its centre, `size` in design px. */
export function penHeart(ctx: Ctx, x: number, y: number, size: number, p: number, seed: number, color = "#ff7aa2", rot = -0.2) {
  if (p <= 0) return;
  const k = px(ctx, size) * backOut(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(k, k);
  const pts: Pt[] = [[0, 0.42], [-0.34, 0.12], [-0.5, -0.12], [-0.4, -0.38], [-0.16, -0.44], [0, -0.26], [0.16, -0.44], [0.4, -0.38], [0.5, -0.12], [0.34, 0.12]];
  blob(ctx, pts, seed, 0.025);
  paint(ctx, color, C.ink, 0.11);
  blob(ctx, [[-0.3, -0.24], [-0.2, -0.32], [-0.14, -0.22]], seed + 1, 0.01);
  paint(ctx, "rgba(255,255,255,0.8)", null);
  ctx.restore();
}

/** Red-pen handwriting on top of everything (design units, like lyrics.ts's red pen): written on over p. */
export function redNote(ctx: Ctx, s: string, x: number, y: number, p: number, rot = -0.06, size = 96, color = "#ff3b3b") {
  if (p <= 0) return;
  ctx.save();
  ctx.setTransform(rootScale(), 0, 0, rootScale(), 0, 0);
  ctx.translate(x, y);
  ctx.rotate(rot);
  text(ctx, writeOn(s, p), 0, 0, { size, font: F.pen, fill: color, stroke: "#fff", lw: 14, align: "left" });
  ctx.restore();
}

/** A red pen arrow from a to b (design units), drawn on over p, with a little hooked head. */
export function redArrow(ctx: Ctx, a: Pt, b: Pt, p: number, seed: number, color = "#ff3b3b", lw = 8) {
  if (p <= 0) return;
  const q = clamp(p);
  const mid: Pt = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18];
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * q;
    pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mid[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * mid[1] + t * t * b[1]]);
  }
  ctx.save();
  ctx.setTransform(rootScale(), 0, 0, rootScale(), 0, 0);
  for (const [col, w] of [["#fff", lw + 8], [color, lw]] as [string, number][]) {
    curve(ctx, pts, seed, 1);
    paint(ctx, null, col, w);
    if (q > 0.92) {
      const e = pts[pts.length - 1],
        d = pts[pts.length - 3];
      const ang = Math.atan2(e[1] - d[1], e[0] - d[0]);
      for (const s of [-1, 1]) {
        curve(ctx, [e, [e[0] - 30 * Math.cos(ang + s * 0.5), e[1] - 30 * Math.sin(ang + s * 0.5)]], seed + 3 + s, 0.6);
        paint(ctx, null, col, w);
      }
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- props
/** A sheet of newspaper: (x, y) its top-left corner, w × h, rotated `rot` about its centre. Columns of print,
 *  headlines and a photo block (no real words), a fold crease, a little yellowing. */
export function newspaper(ctx: Ctx, x: number, y: number, w: number, h: number, rot: number, seed: number) {
  const hw = w / 2,
    hh = h / 2;
  ctx.save();
  ctx.translate(x + hw, y + hh);
  ctx.rotate(rot);
  const outline: Pt[] = [[-hw, -hh], [0, -hh - 1.5], [hw, -hh + 1], [hw + 1, 0], [hw, hh], [0, hh + 1], [-hw, hh - 1], [-hw - 1, 0]];
  shaded(ctx, () => poly(ctx, outline, seed, 0.8), "#e6dfca", () => {
    const g = ctx.createLinearGradient(-hw, -hh, hw, hh);
    g.addColorStop(0, "rgba(255,250,230,0.35)");
    g.addColorStop(1, "rgba(170,140,90,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(-hw - 4, -hh - 4, w + 8, h + 8);
    const ink = "rgba(58,54,50,0.62)";
    const cols = Math.max(2, Math.round(w / 46));
    const cw = (w - 16) / cols;
    let yy = -hh + 12;
    // headline
    if (h > 120) {
      ctx.fillStyle = "rgba(40,38,36,0.8)";
      for (let i = 0; i < 2; i++) ctx.fillRect(-hw + 10, yy + i * 15, (w - 20) * (0.92 - i * 0.3), 9);
      yy += 36;
    }
    ctx.fillStyle = ink;
    for (let c = 0; c < cols; c++) {
      const x0 = -hw + 8 + c * cw + 3;
      const photo = hash(seed + c * 3.3) > 0.62;
      for (let ly = yy; ly < hh - 8; ly += 8) {
        if (photo && ly > yy + 20 && ly < yy + 70) {
          if (ly < yy + 28) {
            ctx.fillStyle = "rgba(92,90,88,0.55)";
            ctx.fillRect(x0, ly, cw - 6, 44);
            ctx.fillStyle = ink;
          }
          continue;
        }
        const len = (cw - 6) * (0.55 + 0.45 * hash(seed + c * 17.1 + ly));
        ctx.fillRect(x0, ly, len, 2.6);
      }
    }
    // fold crease
    inkLine(ctx, [[-hw, hh * 0.08], [0, hh * 0.1], [hw, hh * 0.06]], seed + 9, 2, "rgba(120,104,80,0.45)", 0.6);
  }, "rgba(70,62,52,0.6)", 2.2);
  ctx.restore();
}

/** A strip of masking tape: centre (x, y), w × h, rotated. Translucent beige with torn ends. */
export function tape(ctx: Ctx, x: number, y: number, w: number, h: number, rot: number, seed: number, a = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= a;
  const pts: Pt[] = [];
  const n = 4;
  for (let i = 0; i <= n; i++) pts.push([-w / 2 + (i % 2 ? 2.5 : -1.5), -h / 2 + (i * h) / n]);
  for (let i = n; i >= 0; i--) pts.push([w / 2 + (i % 2 ? -2.5 : 1.5), -h / 2 + (i * h) / n]);
  poly(ctx, pts, seed, 0.5);
  paint(ctx, "rgba(232,214,160,0.86)", "rgba(150,128,80,0.55)", 1.6);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(-w / 2 + 3, -h / 2 + 2, w - 6, h * 0.25);
  ctx.restore();
}

/** A simple round hand at the end of a hoodie sleeve (用户：特写里的手用简单的圆就行). The sleeve runs from `from` to
 *  the hand centre `at`; r = the hand's radius. */
export function sleeveHand(ctx: Ctx, from: Pt, at: Pt, r: number, seed: number, sleeve = C.hoodie, cuff = C.hoodieDark, skin = C.skin) {
  const ang = Math.atan2(at[1] - from[1], at[0] - from[0]);
  const cuffAt: Pt = [at[0] - Math.cos(ang) * r * 0.9, at[1] - Math.sin(ang) * r * 0.9];
  const cuffStart: Pt = [cuffAt[0] - Math.cos(ang) * r * 0.55, cuffAt[1] - Math.sin(ang) * r * 0.55];
  shaded(ctx, () => blob(ctx, tubePts([from, cuffStart], [r * 2.3, r * 2.1], false, false), seed, 1), sleeve, () => {
    blob(ctx, tubePts([[from[0], from[1] + r * 0.5], [cuffStart[0], cuffStart[1] + r * 0.5]], [r * 1.2, r * 1.1], false, false), seed + 1, 1);
    paint(ctx, cuff, null);
  }, C.ink, 5);
  blob(ctx, tubePts([cuffStart, cuffAt], [r * 2.1, r * 2], false, false), seed + 2, 0.8);
  paint(ctx, cuff, C.ink, 4.5);
  shaded(ctx, () => oval(ctx, at[0], at[1], r, r * 0.94, seed + 3, 0.8), skin, () => {
    oval(ctx, at[0] + r * 0.45, at[1] + r * 0.5, r * 0.8, r * 0.7, seed + 4, 0.6);
    paint(ctx, "rgba(196,150,96,0.38)", null);
  }, C.ink, 5);
}

// ---------------------------------------------------------------- resources (preview and catalog)
const unit = z.number().min(0).max(1);

export const resources = defineResources({
  birthmark: resource({
    kind: "character",
    title: "胎记（主角脸上）",
    description: "他左脸颊上的葡萄酒色胎记（他面对我们时在画面右边）：从眼睛下面盖过脸颊。用和 drawKid 一样的 (x, y, s, pose) 画在它上面，正片叠底，墨线保持黑色；alpha 淡入淡出。",
    tags: ["胎记", "主角", "脸", "瑕疵"],
    usage: "drawKid(ctx, x, y, s, pose); birthmark(ctx, x, y, s, pose, alpha)",
    params: z.object({ alpha: unit.default(1).describe("不透明度") }),
    preview: {
      width: 600,
      height: 700,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const pose: KidPose = { eyes: "sad", mouth: "flat" };
        drawKid(ctx, 300, 300, 1.4, pose);
        birthmark(ctx, 300, 300, 1.4, pose, p.alpha);
      },
    },
  }),
  disguise: resource({
    kind: "prop",
    title: "伪装（遮瑕、口罩、墨镜、帽子）",
    description: "画在 drawKid + birthmark 上面的伪装（同样的 x, y, s, pose）：concealer 一大块偏橙的遮瑕（酒红色透出来）、mask 白口罩（只到眼睛下面，胎记上沿还露着）、shades 大墨镜（shadesY 滑到鼻子上）、cap 黑色棒球帽；maskY/capY 拉下或摘掉，shadesX/shadesRot 等是手摘下时的位移和角度。戴了口罩和墨镜时，胎记的 alpha 传 0。",
    tags: ["伪装", "口罩", "墨镜", "帽子", "遮瑕"],
    usage: "drawKid(ctx, x, y, s, pose); birthmark(ctx, x, y, s, pose, alpha); disguise(ctx, x, y, s, pose, { concealer, mask, shades, cap })",
    params: z.object({ concealer: unit.default(0).describe("遮瑕"), mask: unit.default(1).describe("口罩"), shades: unit.default(1).describe("墨镜"), cap: unit.default(1).describe("帽子") }),
    presets: { 遮瑕: { concealer: 1, mask: 0, shades: 0, cap: 0 }, 口罩: { mask: 1, shades: 0, cap: 0 } },
    preview: {
      width: 600,
      height: 700,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const pose: KidPose = { eyes: "open", mouth: "flat" };
        drawKid(ctx, 300, 300, 1.4, pose);
        birthmark(ctx, 300, 300, 1.4, pose, p.mask > 0.5 && p.shades > 0.5 ? 0 : 1);
        disguise(ctx, 300, 300, 1.4, pose, p);
      },
    },
  }),
  redPen: resource({
    kind: "text",
    title: "红笔批注（圈、字、箭头、心）",
    description:
      "画在最上面的红笔：penRing 一圈多一点的笔圈（像在纸上圈东西），redNote 龙藏体手写字（p 0..1 写出来），redArrow 带钩的箭头，penHeart 弹出的小心，mapleLeaf 小红枫叶。都按 p 0..1 画出来；线宽按设计像素（不随镜头缩放）。",
    tags: ["红笔", "批注", "圈", "手写", "箭头", "心"],
    usage: "penRing(ctx, cx, cy, rx, ry, p, seed, color, lw) / redNote(ctx, \"瑕疵\", x, y, p) / redArrow(ctx, a, b, p, seed) / penHeart(ctx, x, y, size, p, seed)",
    params: z.object({ text: z.string().default("瑕疵").describe("红笔写的字") }),
    preview: {
      width: 800,
      height: 600,
      duration: 1.5,
      time: 1.5,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const k = Math.min(1, t / 1.2);
        penRing(ctx, 230, 260, 150, 110, k, 7, "#ff3b3b", 8);
        redNote(ctx, p.text, 560, 220, k);
        redArrow(ctx, [520, 330], [360, 300], k, 9);
        penHeart(ctx, 600, 430, 60, k, 11);
        mapleLeaf(ctx, 160, 480, 40, -0.3, 12, k);
      },
    },
  }),
  newspaper: resource({
    kind: "prop",
    title: "报纸和胶带（糊镜子）",
    description: "一张报纸（(x, y) 左上角，w × h，绕中心转 rot；一栏栏字、标题、图片块）和一条纸胶带（tape：中心、宽高、角度，半透明米色、撕开的两头）。他用它们把家里的镜子都糊上。",
    tags: ["报纸", "胶带", "镜子", "糊"],
    usage: "newspaper(ctx, x, y, w, h, rot, seed); tape(ctx, x, y, w, h, rot, seed)",
    preview: {
      width: 700,
      height: 800,
      background: "#c9c4b8",
      draw(ctx, t) {
        beginFrame(ctx, t);
        newspaper(ctx, 120, 120, 460, 560, -0.05, 3);
        tape(ctx, 350, 130, 180, 44, 0.08, 5);
        tape(ctx, 350, 670, 180, 44, -0.06, 6);
      },
    },
  }),
  sleeveHand: resource({
    kind: "character",
    title: "袖子和圆手（特写）",
    description: "特写里帽衫袖子末端的简单圆手（用户：特写里的手用简单的圆就行）：袖子从 from 到手中心 at，r 是手的半径；袖子、袖口、肤色可换。",
    tags: ["手", "袖子", "特写"],
    usage: "sleeveHand(ctx, from, at, r, seed, sleeve, cuff, skin)",
    preview: {
      width: 600,
      height: 500,
      draw(ctx, t) {
        beginFrame(ctx, t);
        sleeveHand(ctx, [80, 460], [380, 220], 60, 3);
      },
    },
  }),
});
