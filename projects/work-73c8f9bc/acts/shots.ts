// 几幕共用的镜头工具：手机（触点、震动、贴膜裂痕）、取景（把屏幕上的某一点放到画面某一点）、
// 「停—动—停」的镜头（steps / zoomSteps：每次运镜是一下干脆的动作，落定就停）、冲击的抖动（jolt）、
// 按镜头速度加的运动模糊（moveBlur）、甩镜、时间卡。动作曲线在 ease.ts。
import { clamp } from "@frame/engine/math";
import { Ctx, H, W, card, hash, smear, zoomBlur } from "@materials/s0rrow/code/draw";
import { phone, SH, SW } from "@materials/s0rrow/code/phone";
import { crackedGlass } from "./ui";
import { emph, fade } from "./ease";
export { bump, decay, emph, enter, exit, fade, slow, snap } from "./ease";

export interface Touch {
  x: number;
  y: number;
  /** 0..1: how pressed (shows when > 0) */
  k: number;
}
export interface PhoneSpec {
  cx: number;
  cy: number;
  s: number;
  rot?: number;
}

/** A phone up close: the screen callback in 600×1280 screen units, touch dots where a finger presses (no hands),
 *  `buzz` 0..1 vibrates it, `old` puts his cracked protector on. */
export function drawPhone(c: Ctx, abs: number, p: PhoneSpec, screen: (c: Ctx) => void, o: { touches?: Touch[]; buzz?: number; old?: boolean } = {}) {
  const bz = clamp(o.buzz ?? 0);
  const f = Math.floor(abs * 40);
  const jx = bz > 0 ? (hash(f * 1.3) - 0.5) * 10 * bz : 0;
  const jr = bz > 0 ? (hash(f * 2.7) - 0.5) * 0.025 * bz : 0;
  const rot = (p.rot ?? 0) + jr;
  phone(c, p.cx + jx, p.cy, p.s, rot, (k) => {
    screen(k);
    if (o.old) crackedGlass(k);
    // glass glare
    const g = k.createLinearGradient(-100, 0, SW + 100, SH);
    g.addColorStop(0.25, "rgba(255,255,255,0)");
    g.addColorStop(0.33, "rgba(255,255,255,0.05)");
    g.addColorStop(0.41, "rgba(255,255,255,0)");
    k.fillStyle = g;
    k.fillRect(0, 0, SW, SH);
  });
  if (!o.touches?.length) return;
  c.save();
  c.translate(p.cx + jx, p.cy);
  c.rotate(rot);
  c.scale(p.s, p.s);
  c.translate(-SW / 2, -SH / 2);
  for (const t of o.touches) {
    const k = clamp(t.k);
    if (k <= 0) continue;
    c.beginPath();
    c.arc(t.x, t.y, 30 + 6 * k, 0, Math.PI * 2);
    c.fillStyle = `rgba(255,255,255,${(0.32 * k).toFixed(3)})`;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = `rgba(255,255,255,${(0.7 * k).toFixed(3)})`;
    c.stroke();
  }
  c.restore();
}

/** A tap: pressed around time t (0..1..0 over 0.22 s), easing in and out instead of popping. */
export const tap = (abs: number, t: number, x: number, y: number, len = 0.22): Touch => ({
  x,
  y,
  k: abs < t - 0.06 || abs > t + len ? 0 : abs < t ? fade((abs - (t - 0.06)) / 0.06) : 1 - fade((abs - t - len * 0.5) / (len * 0.5)),
});

/** The phone placed so that screen point (mx, my) lands on design point (qx, qy) at scale s. */
export function aim(mx: number, my: number, qx: number, qy: number, s: number): PhoneSpec {
  return { cx: qx - (mx - SW / 2) * s, cy: qy - (my - SH / 2) * s, s };
}
/** Between two placements, scale geometric (a push reads even), the aimed point gliding. */
export function aimLerp(a: PhoneSpec, b: PhoneSpec, e: number): PhoneSpec {
  const s = a.s * Math.pow(b.s / a.s, e);
  return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, s, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * e };
}
/** `p` pushed in by `k` about its screen point (mx, my) (that point stays where it is in the frame) */
export function nudge(p: PhoneSpec, mx: number, my: number, k: number): PhoneSpec {
  const qx = p.cx + (mx - SW / 2) * p.s,
    qy = p.cy + (my - SH / 2) * p.s;
  return { ...aim(mx, my, qx, qy, p.s * k), rot: p.rot };
}

/** One camera move: over [at, at + len] it goes from wherever it was to `to` with `ease` (emph unless given: snap for a
 *  punch-in), and then stays there. */
export interface Move<T> {
  at: number;
  len: number;
  to: T;
  ease?: (u: number) => number;
}
/** A camera that is either still or making one quick move — never drifting in between: it starts at `start` and
 *  makes `moves` in order (each from where the last one landed). */
export function steps(abs: number, start: PhoneSpec, moves: Move<PhoneSpec>[]): PhoneSpec {
  let cur = start;
  for (const m of moves) {
    if (abs < m.at) break;
    const u = (abs - m.at) / m.len;
    if (u < 1) return aimLerp(cur, m.to, (m.ease ?? emph)(u));
    cur = m.to;
  }
  return cur;
}
/** the same for a zoom alone (geometric, so a push reads even) */
export function zoomSteps(abs: number, start: number, moves: Move<number>[]): number {
  let cur = start;
  for (const m of moves) {
    if (abs < m.at) break;
    const u = (abs - m.at) / m.len;
    if (u < 1) return cur * Math.pow(m.to / cur, (m.ease ?? emph)(u));
    cur = m.to;
  }
  return cur;
}
/** An impact: the frame knocked about by up to `amp` px at t, dying away fast (`rate` per second), a new direction every
 *  frame — a phone landing, a punch-in hitting, a fright. */
export function jolt(abs: number, t: number, amp: number, rate = 14): [number, number] {
  if (abs < t) return [0, 0];
  const k = amp * Math.exp(-(abs - t) * rate);
  if (k < 0.3) return [0, 0];
  const f = Math.floor(abs * 30);
  return [(hash(f * 1.7 + t * 13) - 0.5) * 2 * k, (hash(f * 2.3 + t * 7 + 9) - 0.5) * 2 * k];
}

/** A camera as the map it makes from what it films to the frame: frame point = (x, y) + z · point. */
export interface Xf {
  x: number;
  y: number;
  z: number;
}
/** the map of a phone placement (screen units → design units) */
export const phoneXf = (p: PhoneSpec): Xf => ({ x: p.cx - (p.s * SW) / 2, y: p.cy - (p.s * SH) / 2, z: p.s });
/** the map of `camera(c, cx, cy, z, 0, dx, dy)` */
export const cameraXf = (cx: number, cy: number, z: number, dx = 0, dy = 0): Xf => ({ x: cx + dx - z * cx, y: cy + dy - z * cy, z });
/** Motion blur for a camera move, as a 180° shutter at 30 fps sees it: `a` is where the camera was 1/60 s ago, `b`
 *  where it is now; the frame is smeared along the move between them — a zoom blur about the point the move leaves
 *  in place, or a straight smear when it doesn't zoom. Slow moves (under 3 px at the frame's corners) stay sharp.
 *  Call it at the scene's base transform (or inside a whip's translate); `key` must be unique in the frame. */
export function moveBlur(c: Ctx, a: Xf, b: Xf, draw: (c: Ctx) => void, key: string) {
  const r = b.z / a.z;
  if (Math.abs(r - 1) < 1e-4) {
    smear(c, draw, b.x - a.x, b.y - a.y, key);
    return;
  }
  // the frame point the move leaves in place: p = b + r (p − a)
  const fx = (b.x - r * a.x) / (1 - r),
    fy = (b.y - r * a.y) / (1 - r);
  const amount = Math.min(0.35, r > 1 ? r - 1 : 1 / r - 1);
  const far = Math.max(Math.hypot(fx, fy), Math.hypot(W - fx, fy), Math.hypot(fx, H - fy), Math.hypot(W - fx, H - fy));
  if (far * amount < 3) draw(c);
  else zoomBlur(c, draw, fx, fy, amount, key);
}

/** A whip at time T: before it the picture accelerates off by `dist` (sign = direction), after it the next picture
 *  comes in from the other side and settles. Returns [offset, smear length] for the shot drawn at `abs`. */
export function whip(abs: number, T: number, dist: number, outLen = 0.15, inLen = 0.22): [number, number] {
  if (abs < T) {
    const u = clamp((abs - (T - outLen)) / outLen);
    return [dist * u * u, ((Math.abs(dist) * 2 * u) / outLen / 48) * Math.sign(dist)];
  }
  // cubic settle: it starts at about the speed the outgoing half left at (no hitch at the cut) and lands softer
  const v = clamp((abs - T) / inLen);
  return [-dist * Math.pow(1 - v, 3), ((Math.abs(dist) * 3 * (1 - v) * (1 - v)) / inLen / 48) * Math.sign(dist)];
}

/** Time card (top left), faded in and out. */
export function timeCard(c: Ctx, abs: number, s: string, a0: number, a1: number) {
  const a = fade((abs - a0) / 0.2) * fade((a1 - abs) / 0.25);
  if (a > 0) card(c, s, 60, 330, a, 42);
}
