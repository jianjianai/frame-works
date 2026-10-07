import { clamp, smooth } from "../../../../src/engine/math";
import { C, Ctx, Pt, blob, glow, hash, inkLine, paint, poly, tubePts } from "./draw";
import { SH, SW } from "./phone";

/** His two hands holding the phone (POV). The right thumb taps/swipes; everything is in
 *  phone-screen coordinates (0..SW × 0..SH), so the hands move and zoom with the phone. */

/** [time, screen x, screen y, touch] — touch 0 = thumb hovering above the glass, 1 = pressing. */
export type FingerKey = [number, number, number, number];
export interface FingerPos {
  x: number;
  y: number;
  touch: number;
}
export function fingerAt(abs: number, keys: FingerKey[]): FingerPos | null {
  if (!keys.length) return null;
  if (abs <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], touch: keys[0][3] };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1],
      b = keys[i];
    if (abs <= b[0]) {
      const k = b[0] > a[0] ? smooth((abs - a[0]) / (b[0] - a[0])) : 1;
      return { x: a[1] + (b[1] - a[1]) * k, y: a[2] + (b[2] - a[2]) * k, touch: a[3] + (b[3] - a[3]) * k };
    }
  }
  const z = keys[keys.length - 1];
  return { x: z[1], y: z[2], touch: z[3] };
}

/** Map phone-screen coordinates to design coordinates for a phone drawn at (cx, cy) with scale s. */
export const onScreen = (cx: number, cy: number, s: number, sx: number, sy: number): [number, number] => [cx + (sx - 300) * s, cy + (sy - 640) * s];

/** Where the right thumb rests when it isn't doing anything. */
export const THUMB_REST: FingerPos = { x: 420, y: 1090, touch: 0.15 };
export const LEFT_REST: FingerPos = { x: 180, y: 1090, touch: 0.15 };

const SPECKS = Array.from({ length: 22 }, (_, i) => [hash(i * 4.1), hash(i * 6.7 + 2), hash(i * 3.3 + 7)]);
/** sleeve / cuff / skin colours (set per call by heldHands’ look option) */
let LOOK = { sleeve: C.hoodie, cuff: C.hoodieDark, skin: C.skin, specks: 0.5 };
export interface HandsLook {
  sleeve?: string;
  cuff?: string;
  skin?: string;
  /** white scratch texture on the sleeve, 0..1 */
  specks?: number;
}
function sleeve(ctx: Ctx, pts: Pt[], seed: number) {
  poly(ctx, pts, seed, 1.6);
  paint(ctx, LOOK.sleeve, C.ink, 7);
  ctx.save();
  poly(ctx, pts, seed, 1.6);
  ctx.clip();
  ctx.strokeStyle = "#f2efe6";
  ctx.globalAlpha = LOOK.specks;
  ctx.lineWidth = 3;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs),
    y0 = Math.min(...ys),
    w = Math.max(...xs) - x0,
    h = Math.max(...ys) - y0;
  for (const [u, v, a] of SPECKS) {
    const x = x0 + u * w,
      y = y0 + v * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a * 3) * 11, y + Math.sin(a * 3) * 11);
    ctx.stroke();
  }
  ctx.restore();
}

/** cartoon thumb length (base at the phone's edge → tip), screen units */
const THUMB_LEN = 400;

/** One (right) hand holding the phone, posed like a cartoon "typing" illustration (drawn in our ink style):
 *  the palm is behind the phone (clipped to outside it, so only the rim along the side and the part below
 *  the phone show), and one thick, almost straight thumb with a round tip lies diagonally across the glass.
 *  The base of the thumb slides along the edge so the thumb keeps its length; while typing the hand only
 *  follows half way. Palm and thumb are stroked first and filled after, so they read as one shape. */
function rightHand(ctx: Ctx, t: FingerPos, seed: number) {
  const lift = 1 - clamp(t.touch);
  const bx = SW + 34;
  const ideal = (p: FingerPos) => {
    const d = bx - p.x;
    return p.y + (d < THUMB_LEN ? Math.sqrt(THUMB_LEN * THUMB_LEN - d * d) : 0);
  };
  const k = clamp((1000 - t.y) / 300, 0.5, 1);
  const home = ideal({ x: 360, y: 1020, touch: 0 });
  const by = clamp(home + (ideal(t) - home) * k, 520, 1330);
  const B: Pt = [bx, by];
  const T: Pt = [t.x, t.y];
  // a gentle arc, convex towards the top of the phone
  const len = Math.hypot(T[0] - B[0], T[1] - B[1]) || 1;
  const nx = (T[1] - B[1]) / len,
    ny = -(T[0] - B[0]) / len;
  const bow = 0.06 * len;
  const at = (u: number): Pt => [B[0] + (T[0] - B[0]) * u + nx * bow * 4 * u * (1 - u), B[1] + (T[1] - B[1]) * u + ny * bow * 4 * u * (1 - u)];
  const w = 1 + 0.05 * lift;
  const thumb = tubePts([at(0), at(0.25), at(0.5), at(0.75), at(0.94), T], [150, 132, 120, 112, 108, 104].map((v) => v * w), false, true);
  // the hand behind the phone: its rim shows along the right side, its heel and wrist below the phone
  const palm: Pt[] = [
    [SW - 40, by - 600],
    [SW + 56, by - 570],
    [SW + 124, by - 450],
    [SW + 156, by - 250],
    [SW + 156, by - 20],
    [SW + 128, by + 200],
    [SW + 90, by + 370],
    [SW - 100, by + 370],
    [SW - 160, by + 190],
    [SW - 110, by - 20],
  ];
  const outside = (draw: () => void) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-2000, -2000, SW + 4000, SH + 4000);
    ctx.roundRect(-26, -26, SW + 52, SH + 52, 92);
    ctx.clip("evenodd");
    draw();
    ctx.restore();
  };
  glow(ctx, T[0] + 30 * lift, T[1] + 46 * lift, 70 + 46 * lift, "rgba(0,0,0,0.55)", 0.4 + 0.3 * (1 - lift));
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 11;
  outside(() => {
    blob(ctx, palm, seed + 1, 1);
    ctx.stroke();
  });
  blob(ctx, thumb, seed + 3, 0.8);
  ctx.stroke();
  ctx.fillStyle = LOOK.skin;
  outside(() => {
    blob(ctx, palm, seed + 1, 1);
    ctx.fill();
    // one shadow block on the outer side of the hand (light from the upper left)
    ctx.save();
    blob(ctx, palm, seed + 1, 1);
    ctx.clip();
    blob(ctx, [[SW + 90, by - 560], [SW + 200, by - 260], [SW + 200, by + 420], [SW + 40, by + 420], [SW + 100, by + 120], [SW + 110, by - 280]], seed + 8, 1);
    paint(ctx, "rgba(196,140,90,0.35)", null);
    ctx.restore();
    // where the fingers fold round the back of the phone
    inkLine(ctx, [[SW + 40, by - 520], [SW + 92, by - 470]], seed + 13, 3, "#a8865c");
    inkLine(ctx, [[SW + 70, by - 330], [SW + 128, by - 300]], seed + 14, 3, "#a8865c");
  });
  blob(ctx, thumb, seed + 3, 0.8);
  ctx.fill();
  // one shadow block along the underside of the thumb, a crease at the knuckle
  ctx.save();
  blob(ctx, thumb, seed + 3, 0.8);
  ctx.clip();
  const edge = (off: number, u0: number, u1: number) => [u0, (u0 + u1) / 2, u1].map((u) => {
    const p = at(u);
    return [p[0] - nx * off, p[1] - ny * off] as Pt;
  });
  blob(ctx, [...edge(30, 0, 0.92), ...edge(120, 0, 0.92).reverse()], seed + 9, 1);
  paint(ctx, "rgba(196,140,90,0.35)", null);
  ctx.restore();
  const kq = at(0.62);
  inkLine(ctx, [[kq[0] + nx * 40, kq[1] + ny * 40], [kq[0] + (T[0] - B[0]) / len * 8, kq[1] + (T[1] - B[1]) / len * 8], [kq[0] - nx * 40, kq[1] - ny * 40]], seed + 5, 3, "#a8865c");
  // nail
  const na = Math.atan2(T[1] - at(0.94)[1], T[0] - at(0.94)[0]);
  ctx.save();
  ctx.translate(T[0], T[1]);
  ctx.rotate(na);
  blob(ctx, [[-70, -28], [-16, -26], [-4, 0], [-16, 26], [-70, 24]], seed + 4, 0.7);
  paint(ctx, "#f9ead0", "#c9a77a", 3);
  ctx.restore();
  // wrist into the sleeve at the bottom corner
  const w0: Pt = [SW - 4, by + 340];
  sleeve(ctx, tubePts([w0, [SW + 130, by + 900], [SW + 330, by + 1700]], [300, 330, 360], false, false), seed);
  poly(ctx, tubePts([[w0[0] - 4, w0[1] - 20], [w0[0] + 26, w0[1] + 96]], [318, 324], false, false), seed + 10, 1.2);
  paint(ctx, LOOK.cuff, C.ink, 6);
}

/** Both hands holding the phone. `cx, cy, s, rot` must match the phone() call.
 *  `right` / `left` are the thumb tips in screen coordinates (left defaults to resting). */
export function heldHands(ctx: Ctx, cx: number, cy: number, s: number, rot: number, right: FingerPos, left: FingerPos = LEFT_REST, seed = 1300, look: HandsLook = {}) {
  LOOK = { sleeve: look.sleeve ?? C.hoodie, cuff: look.cuff ?? C.hoodieDark, skin: look.skin ?? C.skin, specks: look.specks ?? 0.5 };
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-SW / 2, -SH / 2);
  // the left hand is the right hand mirrored across the phone
  ctx.save();
  ctx.translate(SW, 0);
  ctx.scale(-1, 1);
  rightHand(ctx, { ...left, x: SW - left.x }, seed + 50);
  ctx.restore();
  rightHand(ctx, right, seed);
  ctx.restore();
}

/** Expanding ring where the thumb touched the glass. p: 0..1 (design coordinates). */
export function tapRipple(ctx: Ctx, x: number, y: number, p: number, scale = 1) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha = (1 - p) * 0.85;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.arc(x, y, (18 + 70 * p) * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = (1 - p) * 0.35;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
