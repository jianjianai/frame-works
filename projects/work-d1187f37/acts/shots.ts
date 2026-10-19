// 几幕共用的镜头工具：手机近景（光晕、机身反光、白色触点、震动、侧键）、把屏幕上的一点放到画面某处的取景、
// 甩镜的位移、黄色脉冲圈、时间卡。手机近景不画手（用户：「手太难做就不做了」）。
import { clamp } from "@frame/engine/math";
import { Ctx, H, Pt, W, card, hash } from "@materials/s0rrow/code/draw";
import { phone, phoneButtons, phoneHalo, SH, SW } from "@materials/s0rrow/code/phone";
import type { FingerPos } from "@materials/s0rrow/code/hand";

export interface PhoneSpec {
  cx: number;
  cy: number;
  s: number;
  rot?: number;
}

/** A phone up close: the screen callback in 600×1280 screen units; the thumbs show only as touch dots where they
 *  press; `buzz` 0..1 shakes it; `halo` lights the room round it (rgb, alpha); `glare` shifts the glass reflection. */
export function drawPhone(
  c: Ctx,
  abs: number,
  p: PhoneSpec,
  screen: (c: Ctx) => void,
  o: { thumbs?: (FingerPos | null | undefined)[]; buzz?: number; halo?: number; haloRgb?: string; glare?: number; buttons?: number } = {},
) {
  const bz = clamp(o.buzz ?? 0);
  const f = Math.floor(abs * 40);
  const jx = bz > 0 ? (hash(f * 1.3) - 0.5) * 12 * bz : 0;
  const jr = bz > 0 ? (hash(f * 2.7) - 0.5) * 0.03 * bz : 0;
  const rot = (p.rot ?? 0) + jr;
  const cx = p.cx + jx;
  if ((o.halo ?? 1) > 0) phoneHalo(c, cx, p.cy, p.s, rot, o.halo ?? 1, o.haloRgb);
  phoneButtons(c, cx, p.cy, p.s, rot, o.buttons ?? 0);
  phone(c, cx, p.cy, p.s, rot, (k) => {
    screen(k);
    // a soft diagonal reflection on the glass
    const sh = o.glare ?? 0;
    const g = k.createLinearGradient(-100 + sh, 0, SW + 100 + sh, SH);
    g.addColorStop(0.24, "rgba(255,255,255,0)");
    g.addColorStop(0.32, "rgba(255,255,255,0.05)");
    g.addColorStop(0.4, "rgba(255,255,255,0)");
    k.fillStyle = g;
    k.fillRect(0, 0, SW, SH);
  });
  const dots = (o.thumbs ?? []).filter(Boolean) as FingerPos[];
  if (!dots.length) return;
  c.save();
  c.translate(cx, p.cy);
  c.rotate(rot);
  c.scale(p.s, p.s);
  c.translate(-SW / 2, -SH / 2);
  for (const t of dots) touchDot(c, t);
  c.restore();
}

/** a pressing thumb, without a hand: a soft white dot (in screen units) */
export function touchDot(c: Ctx, t: FingerPos) {
  const k = clamp((t.touch - 0.6) / 0.4);
  if (k <= 0) return;
  c.beginPath();
  c.arc(t.x, t.y, 30 + 6 * k, 0, Math.PI * 2);
  c.fillStyle = `rgba(255,255,255,${(0.32 * k).toFixed(3)})`;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = `rgba(255,255,255,${(0.7 * k).toFixed(3)})`;
  c.stroke();
}

/** A tap at time t: pressed from t − 0.06, lifted over `len`. */
export function tapAt(abs: number, t: number, x: number, y: number, len = 0.22): FingerPos {
  const k = clamp(abs < t - 0.06 || abs > t + len ? 0 : abs < t ? (abs - (t - 0.06)) / 0.06 : 1 - clamp((abs - t - len * 0.6) / (len * 0.4)));
  return { x, y, touch: k > 0 ? 0.6 + 0.4 * k : 0 };
}

/** The phone placed so that screen point (mx, my) lands on design point (qx, qy) at scale s (and rotation rot). */
export function aim(mx: number, my: number, qx: number, qy: number, s: number, rot = 0): PhoneSpec {
  const dx = (mx - SW / 2) * s,
    dy = (my - SH / 2) * s;
  const cs = Math.cos(rot),
    sn = Math.sin(rot);
  return { cx: qx - (dx * cs - dy * sn), cy: qy - (dx * sn + dy * cs), s, rot };
}
/** Between two placements: scale geometric (a push reads even), position and rotation linear in `e`. */
export function aimLerp(a: PhoneSpec, b: PhoneSpec, e: number): PhoneSpec {
  const s = a.s * Math.pow(b.s / a.s, e);
  return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, s, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * e };
}
/** where screen point (mx, my) of a phone at `p` is on the frame */
export function onPhone(p: PhoneSpec, mx: number, my: number): Pt {
  const dx = (mx - SW / 2) * p.s,
    dy = (my - SH / 2) * p.s;
  const r = p.rot ?? 0;
  return [p.cx + dx * Math.cos(r) - dy * Math.sin(r), p.cy + dx * Math.sin(r) + dy * Math.cos(r)];
}

/** A whip at time T: before it the picture accelerates off by `dist` (sign = direction), after it the next picture
 *  comes in from the other side and settles. Returns [offset, smear length] for the shot drawn at `abs`. */
export function whip(abs: number, T: number, dist: number, outLen = 0.15, inLen = 0.24): [number, number] {
  if (abs < T) {
    const u = clamp((abs - (T - outLen)) / outLen);
    return [dist * u * u, ((Math.abs(dist) * 2 * u) / outLen / 48) * Math.sign(dist)];
  }
  const v = clamp((abs - T) / inLen);
  return [-dist * (1 - v) * (1 - v), ((Math.abs(dist) * 2 * (1 - v)) / inLen / 48) * Math.sign(dist)];
}

/** The film's yellow pulse (the clue the audience is meant to catch): rings that open out from (x, y) on the frame. */
export function pulseRings(c: Ctx, abs: number, x: number, y: number, rx: number, ry: number, starts: number[], rot = 0, color = "255,209,102") {
  for (const t0 of starts) {
    const k = clamp((abs - t0) / 0.45);
    if (k <= 0 || k >= 1) continue;
    c.save();
    c.globalAlpha = 1 - k;
    c.strokeStyle = `rgb(${color})`;
    c.lineWidth = 7;
    c.beginPath();
    c.ellipse(x, y, rx + k * 70, ry + k * 40, rot, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

/** A soft yellow glow on a clue (screen-blended light, so it lifts what is there). */
export function clueGlow(c: Ctx, x: number, y: number, r: number, a: number) {
  if (a <= 0) return;
  c.save();
  c.globalCompositeOperation = "screen";
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,214,110,${(0.55 * a).toFixed(3)})`);
  g.addColorStop(1, "rgba(255,214,110,0)");
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}

/** Darken everything outside a soft circle at (x, y): `a` how dark, `r` the clear radius. */
export function spotlight(c: Ctx, x: number, y: number, r: number, a: number) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, r * 0.55, x, y, r * 2.2);
  g.addColorStop(0, "rgba(2,3,10,0)");
  g.addColorStop(1, `rgba(2,3,10,${a.toFixed(3)})`);
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
}

/** A radial vignette: clear inside `r0`, `a` at `r1`. */
export function vignette(c: Ctx, a: number, x = W / 2, y = H / 2, r0 = 380, r1 = 1200) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(2,3,12,${a.toFixed(3)})`);
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
}

/** Time card (top left), faded in and out. */
export function timeCard(c: Ctx, abs: number, s: string, a0: number, a1: number) {
  const a = clamp((abs - a0) / 0.2) * clamp((a1 - abs) / 0.25);
  if (a > 0) card(c, s, 60, 330, a, 42);
}

/** A jolt: 1 at t, decaying with time constant `tau`. */
export const kick = (abs: number, t: number, tau = 0.1) => (abs < t ? 0 : Math.exp(-(abs - t) / tau));
/** soft start, always slowing (for a move that starts from rest): 1 − (1 − x)³(1 + 3x) */
export const softStart = (x: number) => {
  const v = clamp(x);
  return 1 - Math.pow(1 - v, 3) * (1 + 3 * v);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
