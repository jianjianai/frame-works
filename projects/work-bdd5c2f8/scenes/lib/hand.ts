import { clamp, smooth } from "../../../../src/engine/math";
import { C, Ctx, Pt, blob, glow, hash, inkLine, paint, poly } from "./draw";
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

/** No hands (用户: the hands looked odd): where his thumb touches the glass, a soft white dot like the phone's
 *  "show touches" — drawn inside phone()'s screen callback, in screen coordinates. Hovering (touch < 0.35) shows
 *  nothing. */
export function touchDot(p: Ctx, f: FingerPos | null) {
  if (!f || f.touch < 0.35) return;
  const a = Math.min(1, (f.touch - 0.35) / 0.5);
  p.save();
  p.globalAlpha = a;
  p.fillStyle = "rgba(255,255,255,0.4)";
  p.beginPath();
  p.arc(f.x, f.y, 40, 0, Math.PI * 2);
  p.fill();
  p.strokeStyle = "rgba(255,255,255,0.75)";
  p.lineWidth = 3;
  p.stroke();
  p.restore();
}

/** Map phone-screen coordinates to design coordinates for a phone drawn at (cx, cy) with scale s. */
export const onScreen = (cx: number, cy: number, s: number, sx: number, sy: number): [number, number] => [cx + (sx - 300) * s, cy + (sy - 640) * s];

/** Where the right thumb rests when it isn't doing anything. */
export const THUMB_REST: FingerPos = { x: 450, y: 960, touch: 0.25 };
export const LEFT_REST: FingerPos = { x: 150, y: 960, touch: 0.25 };
/** Distance from the thumb base (at the phone edge) to the thumb tip, in screen units. */
const THUMB_LEN = 330;

const SPECKS = Array.from({ length: 22 }, (_, i) => [hash(i * 4.1), hash(i * 6.7 + 2), hash(i * 3.3 + 7)]);
function sleeve(ctx: Ctx, pts: Pt[], seed: number) {
  poly(ctx, pts, seed, 1.6);
  paint(ctx, C.hoodie, C.ink, 7);
  ctx.save();
  poly(ctx, pts, seed, 1.6);
  ctx.clip();
  ctx.strokeStyle = "#f2efe6";
  ctx.globalAlpha = 0.5;
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

/** Thumb outline from base (0,0) along +x to the tip at distance L (nail side up). */
function thumbPts(L: number, w: number): Pt[] {
  return [
    [-80, -w * 0.78],
    [L * 0.45, -w * 0.52],
    [L - w * 0.5, -w * 0.48],
    [L - w * 0.14, -w * 0.34],
    [L + 2, 0],
    [L - w * 0.14, w * 0.36],
    [L - w * 0.5, w * 0.5],
    [L * 0.45, w * 0.64],
    [-80, w * 0.98],
  ];
}

/** One (right) hand gripping the right edge; its thumb tip goes to `t` (screen coordinates).
 *  Palm and thumb are one silhouette: both outlines are stroked first, then both are filled,
 *  so the inner lines disappear and the thumb grows out of the palm. */
function rightHand(ctx: Ctx, t: FingerPos, seed: number) {
  const lift = 1 - clamp(t.touch);
  // the thumb never changes length: the whole hand slides along the edge to reach
  const bx = Math.min(SW + 6, t.x + THUMB_LEN * 0.92);
  const dx = bx - t.x;
  const by = t.y + Math.sqrt(Math.max(0, THUMB_LEN * THUMB_LEN - dx * dx));
  // a lifted thumb is a little closer to the camera, so its tip appears slightly further out
  const tx = t.x,
    ty = t.y;
  const ox = bx - 10,
    oy = by;
  const L = Math.hypot(tx - ox, ty - oy);
  const a = Math.atan2(ty - oy, tx - ox);
  const w = 104 * (1 + 0.06 * lift);
  const palm: Pt[] = [[bx - 40, by - 70], [bx + 40, by - 120], [bx + 130, by - 60], [bx + 160, by + 90], [bx + 140, by + 260], [bx + 40, by + 300], [bx - 50, by + 220], [bx - 70, by + 60]];
  const inThumb = (draw: () => void) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(a);
    draw();
    ctx.restore();
  };
  // shadow of the thumb tip on the glass (offset while hovering)
  glow(ctx, t.x + 30 * lift, t.y + 46 * lift, 60 + 50 * lift, "rgba(0,0,0,0.6)", 0.45 + 0.3 * (1 - lift));
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.fillStyle = C.skin;
  ctx.lineWidth = 12;
  blob(ctx, palm, seed + 1, 1.5);
  ctx.stroke();
  inThumb(() => {
    blob(ctx, thumbPts(L, w), seed + 3, 1.4);
    ctx.stroke();
  });
  blob(ctx, palm, seed + 1, 1.5);
  ctx.fill();
  inThumb(() => {
    blob(ctx, thumbPts(L, w), seed + 3, 1.4);
    ctx.fill();
    // nail
    blob(ctx, [[L - w * 0.66, -w * 0.26], [L - w * 0.2, -w * 0.24], [L - w * 0.1, 0], [L - w * 0.2, w * 0.22], [L - w * 0.66, w * 0.2]], seed + 4, 0.8);
    paint(ctx, "#f9ead0", "#c9a77a", 3);
    // knuckle crease
    inkLine(ctx, [[L * 0.5, -w * 0.3], [L * 0.47, 0], [L * 0.5, w * 0.3]], seed + 5, 3, "#a8865c");
  });
  inkLine(ctx, [[bx + 40, by + 90], [bx + 14, by + 150], [bx + 12, by + 190]], seed + 2, 3, "#a8865c");
  // the hand comes out of the hoodie cuff
  sleeve(ctx, [[bx + 10, by + 230], [bx + 250, by + 170], [bx + 520, 1700], [bx + 40, 1700]], seed);
  poly(ctx, [[bx + 2, by + 222], [bx + 254, by + 158], [bx + 268, by + 218], [bx + 14, by + 284]], seed + 6, 1.2);
  paint(ctx, C.hoodieDark, C.ink, 6);
}

/** Both hands holding the phone. `cx, cy, s, rot` must match the phone() call.
 *  `right` / `left` are the thumb tips in screen coordinates (left defaults to resting). */
export function heldHands(ctx: Ctx, cx: number, cy: number, s: number, rot: number, right: FingerPos, left: FingerPos = LEFT_REST, seed = 1300) {
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
