// 几幕共用的镜头工具：手机（触点、震动、熄屏倒影、贴膜裂痕）、把屏幕上的某一点放到画面某一点的取景、
// 甩镜的位移、时间卡。
import { clamp } from "@frame/engine/math";
import { Ctx, card, hash } from "@materials/s0rrow/code/draw";
import { phone, phoneHalo, SH, SW } from "@materials/s0rrow/code/phone";
import { crackedGlass } from "./ui";

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

/** The screen's light round a phone placed at `p` in a dark room (draw it just before drawPhone). */
export const halo = (c: Ctx, p: PhoneSpec, a = 1, rgb?: string) => phoneHalo(c, p.cx, p.cy, p.s, p.rot ?? 0, a, rgb);

/** A tap: pressed around time t (0..1..0 over 0.22 s). */
export const tap = (abs: number, t: number, x: number, y: number, len = 0.22): Touch => ({ x, y, k: abs < t - 0.06 || abs > t + len ? 0 : abs < t ? (abs - (t - 0.06)) / 0.06 : 1 - clamp((abs - t - len * 0.6) / (len * 0.4)) });

/** The phone placed so that screen point (mx, my) lands on design point (qx, qy) at scale s. */
export function aim(mx: number, my: number, qx: number, qy: number, s: number): PhoneSpec {
  return { cx: qx - (mx - SW / 2) * s, cy: qy - (my - SH / 2) * s, s };
}
/** Between two placements, scale geometric (a push reads even), the aimed point gliding. */
export function aimLerp(a: PhoneSpec, b: PhoneSpec, e: number): PhoneSpec {
  const s = a.s * Math.pow(b.s / a.s, e);
  return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, s, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * e };
}

/** A whip at time T: before it the picture accelerates off by `dist` (sign = direction), after it the next picture
 *  comes in from the other side and settles. Returns [offset, smear length] for the shot drawn at `abs`. */
export function whip(abs: number, T: number, dist: number, outLen = 0.15, inLen = 0.22): [number, number] {
  if (abs < T) {
    const u = clamp((abs - (T - outLen)) / outLen);
    return [dist * u * u, ((Math.abs(dist) * 2 * u) / outLen / 48) * Math.sign(dist)];
  }
  const v = clamp((abs - T) / inLen);
  return [-dist * (1 - v) * (1 - v), ((Math.abs(dist) * 2 * (1 - v)) / inLen / 48) * Math.sign(dist)];
}

/** Time card (top left), faded in and out. */
export function timeCard(c: Ctx, abs: number, s: string, a0: number, a1: number) {
  const a = clamp((abs - a0) / 0.2) * clamp((a1 - abs) / 0.25);
  if (a > 0) card(c, s, 60, 330, a, 42);
}
