// 《屏蔽》的手机界面（600×1280 屏幕坐标，和素材库 phone() 一样）：短视频 App（深色）的动态、评论通知、陌生号主页、
// 关注列表、互动消息、拉黑；微信（浅色）的资料页（朋友圈被屏蔽时只有一条横线）、朋友圈、权限开关、对话框、横幅；
// 爸爸手机的锁屏（壁纸是他扛着小时候的她）。爸爸的手机字号调到最大（big）、贴膜有裂痕（crackedGlass）。
import { clamp } from "@frame/engine/math";
import { C, Ctx, F, Pt, blob, hash, inkLine, lerp2, measure, oval, paint, poly, rr, shaded, text, tubePts } from "@materials/s0rrow/code/draw";
import { SH, SW, statusBar } from "@materials/s0rrow/code/phone";
import { avatar } from "@materials/s0rrow/code/chat";
import { drawKid } from "@materials/s0rrow/code/kid";
import { drawPerson } from "@materials/s0rrow/code/people";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { socialButton, socialHomeBar, socialIcon } from "@materials/s0rrow/code/social";
import { cafeCouplePhoto } from "@materials/s0rrow/code/couple-photo";

export { SH, SW };

// ---------------------------------------------------------------- names and lines
export const HER = "小满";
export const DAD_CALLS_HER = "囡囡";
export const SHE_CALLS_DAD = "爸爸";
/** the stranger's nicknames: the kind of random 「形容词的名词」 name the platform hands out (easy to remember, reads as a
 *  bot) — never changed, the way a dad leaves it. Both nouns are on his desk in the booth (the red thermos, the radio).
 *  The new account after she blocks him gets a new random name of the same kind; the grey avatar and the 🌹 say it is him. */
export const ACC_A = "沉默的保温杯";
export const ACC_B = "孤独的收音机";
/** the blocked account's 抖音号 on its profile page */
export const ACC_ID = "8274615";

// ---------------------------------------------------------------- small pieces
/** WeChat's built-in rose (中老年人的习惯): (x, y) = left middle, sized like text of `size`. */
export function rose(c: Ctx, x: number, y: number, size: number) {
  const s = size / 40;
  c.save();
  c.translate(x + 16 * s, y + 1 * s);
  c.scale(s, s);
  c.lineCap = "round";
  c.strokeStyle = "#3d8b3a";
  c.lineWidth = 3.6;
  c.beginPath();
  c.moveTo(-1, 2);
  c.quadraticCurveTo(3, 12, -4, 22);
  c.stroke();
  c.fillStyle = "#4caf50";
  c.beginPath();
  c.ellipse(5, 13, 7, 3.4, -0.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#e8394f";
  c.beginPath();
  c.ellipse(0, -6, 11.5, 10.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#a3162b";
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(0, -6, 6.2, 0.4, 5.6);
  c.stroke();
  c.beginPath();
  c.arc(0.8, -7, 2.6, 2, 7.6);
  c.stroke();
  c.restore();
}

/** Text in the UI font, optionally followed by the rose; returns its width. */
export function say(c: Ctx, s: string, x: number, y: number, size: number, o: { color?: string; weight?: number; align?: "left" | "center" | "right"; rose?: boolean; font?: string; alpha?: number } = {}) {
  const fam = o.font ?? F.ui;
  const w = measure(c, s, size, fam, o.weight ?? 400);
  const total = w + (o.rose ? size * 1.05 : 0);
  const x0 = o.align === "center" ? x - total / 2 : o.align === "right" ? x - total : x;
  c.save();
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  text(c, s, x0, y, { size, font: fam, weight: o.weight ?? 400, fill: o.color ?? "#fff", align: "left" });
  if (o.rose) rose(c, x0 + w + size * 0.05, y, size);
  c.restore();
  return total;
}

/** A small outline heart (no emoji glyphs in the fonts). (x, y) = centre. */
export function heartIcon(c: Ctx, x: number, y: number, size: number, color: string) {
  const s = size / 30;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(0, 10);
  c.bezierCurveTo(-16, 0, -14, -12, -6, -12);
  c.bezierCurveTo(-2, -12, 0, -8, 0, -6);
  c.bezierCurveTo(0, -8, 2, -12, 6, -12);
  c.bezierCurveTo(14, -12, 16, 0, 0, 10);
  c.stroke();
  c.restore();
}
/** A small speech-bubble outline. (x, y) = centre. */
export function bubbleIcon(c: Ctx, x: number, y: number, size: number, color: string) {
  const s = size / 30;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.lineWidth = 2.6;
  c.beginPath();
  c.ellipse(0, -1, 13, 10, 0, 0.35, Math.PI * 2 - 0.1);
  c.lineTo(-10, 12);
  c.closePath();
  c.stroke();
  c.restore();
}

/** The default grey avatar of an account that never set one. */
export function grayAvatar(c: Ctx, x: number, y: number, r: number) {
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = "#bfc0c6";
  c.fill();
  c.clip();
  c.fillStyle = "#eeeef1";
  c.beginPath();
  c.arc(x, y - r * 0.16, r * 0.36, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x, y + r * 0.8, r * 0.7, r * 0.52, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Her avatar in a circle. */
export function herAvatar(c: Ctx, x: number, y: number, r: number) {
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  avatar(c, x, y, "girl", r * 2.3);
  c.restore();
}

/** Dad's WeChat avatar: a landscape at sunset (中老年人的风景头像). */
export function dadAvatar(c: Ctx, x: number, y: number, size: number) {
  c.save();
  rr(c, x - size / 2, y - size / 2, size, size, size * 0.14);
  c.clip();
  const g = c.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, "#f7b267");
  g.addColorStop(0.55, "#f4845f");
  g.addColorStop(1, "#7d4f8f");
  c.fillStyle = g;
  c.fillRect(x - size / 2, y - size / 2, size, size);
  c.fillStyle = "#ffe08a";
  c.beginPath();
  c.arc(x + size * 0.12, y + size * 0.02, size * 0.16, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#3b2f5c";
  c.beginPath();
  c.moveTo(x - size / 2, y + size * 0.3);
  c.lineTo(x - size * 0.2, y);
  c.lineTo(x + size * 0.02, y + size * 0.22);
  c.lineTo(x + size * 0.28, y + size * 0.02);
  c.lineTo(x + size / 2, y + size * 0.26);
  c.lineTo(x + size / 2, y + size / 2);
  c.lineTo(x - size / 2, y + size / 2);
  c.fill();
  c.restore();
}

/** A soft yellow pulse ring round a rectangle (the clue marker used through the film). */
export function pulseBox(c: Ctx, x: number, y: number, w: number, h: number, k: number) {
  if (k <= 0 || k >= 1) return;
  c.save();
  for (let i = 0; i < 2; i++) {
    const u = clamp(k * 1.6 - i * 0.45);
    if (u <= 0 || u >= 1) continue;
    c.globalAlpha = 0.9 * (1 - u);
    c.strokeStyle = "#ffd84a";
    c.lineWidth = 6;
    const g = 10 + u * 26;
    rr(c, x - g, y - g, w + g * 2, h + g * 2, 18 + g);
    c.stroke();
  }
  c.restore();
}

/** How a guide box keeps time with the camera: `ring` 0..1 runs the ripple (pulseBox, a pop when the camera lands),
 *  `a` holds a steady outline `gap` units outside the target (shrink `gap` for a box that closes in), `thump` 0..1
 *  flares it (on a heartbeat). A plain number is just the ripple. */
export type Guide = number | { ring?: number; a?: number; gap?: number; thump?: number };
export function guideBox(c: Ctx, x: number, y: number, w: number, h: number, g: Guide) {
  if (typeof g === "number") return pulseBox(c, x, y, w, h, g);
  if (g.ring !== undefined) pulseBox(c, x, y, w, h, g.ring);
  const a = clamp(g.a ?? 0);
  if (a <= 0) return;
  const th = clamp(g.thump ?? 0);
  const gap = (g.gap ?? 10) - 4 * th;
  c.save();
  rr(c, x - gap, y - gap, w + gap * 2, h + gap * 2, 18 + gap);
  if (th > 0) {
    c.globalAlpha = a * 0.3 * th;
    c.strokeStyle = "#ffd84a";
    c.lineWidth = 20;
    c.stroke();
  }
  c.globalAlpha = a * (0.85 + 0.15 * th);
  c.strokeStyle = "#ffd84a";
  c.lineWidth = 6 + 3 * th;
  c.stroke();
  c.restore();
}

/** A fine crack across his old screen protector. */
export function crackedGlass(c: Ctx) {
  c.save();
  c.strokeStyle = "rgba(255,255,255,0.32)";
  c.lineWidth = 1.6;
  const lines: [number, number][][] = [
    [[600, 880], [520, 930], [470, 1010], [430, 1060], [380, 1180]],
    [[520, 930], [560, 1010], [600, 1040]],
    [[470, 1010], [400, 990], [330, 1010]],
    [[430, 1060], [470, 1130], [500, 1280]],
  ];
  for (const l of lines) {
    c.beginPath();
    l.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  c.restore();
}

/** Slide between two app pages: the new one comes in from the right, the old one moves 30% left and dims. */
export function slide(c: Ctx, k: number, drawOld: (c: Ctx) => void, drawNew: (c: Ctx) => void) {
  const u = clamp(k);
  const e = 1 - Math.pow(1 - u, 3);
  if (u < 1) {
    c.save();
    c.translate(-SW * 0.3 * e, 0);
    drawOld(c);
    c.fillStyle = `rgba(0,0,0,${(0.4 * e).toFixed(3)})`;
    c.fillRect(0, 0, SW, SH);
    c.restore();
  }
  if (u > 0) {
    c.save();
    c.translate(SW * (1 - e), 0);
    c.shadowColor = "rgba(0,0,0,0.4)";
    c.shadowBlur = 30;
    c.fillStyle = "#000";
    c.fillRect(0, 0, SW, SH);
    c.shadowColor = "transparent";
    drawNew(c);
    c.restore();
  }
}

/** A plain keyboard, `big` keys for his phone. */
export function keyboard(c: Ctx, y: number, dark: boolean, big = false) {
  c.fillStyle = dark ? "#1f2026" : "#d1d3d9";
  c.fillRect(0, y, SW, SH - y);
  const rows = big ? ["我你他的了", "多穿点吗么", "好吃饭睡觉"] : ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const kh = big ? 104 : 84;
  rows.forEach((row, r) => {
    const n = row.length;
    const kw = (SW - 24) / (big ? 5 : 10);
    const x0 = (SW - n * kw) / 2;
    Array.from(row).forEach((ch, i) => {
      c.fillStyle = dark ? "#3a3b42" : "#fff";
      rr(c, x0 + i * kw + 4, y + 18 + r * (kh + 10), kw - 8, kh, 10);
      c.fill();
      text(c, ch, x0 + i * kw + kw / 2, y + 18 + r * (kh + 10) + kh / 2, { size: big ? 46 : 30, font: F.ui, fill: dark ? "#eee" : "#222" });
    });
  });
}

// ---------------------------------------------------------------- photos (drawn into a rect)
type Photo = (c: Ctx, x: number, y: number, w: number, h: number) => void;

function clipRect(c: Ctx, x: number, y: number, w: number, h: number, draw: () => void) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  draw();
  c.restore();
}

/** 「下雪了」: the snow outside her window at night (her post), taken from her bed through the window — moon behind
 *  thin cloud, snowy rooftops and warm windows across the street, a street lamp with the flakes lit in its cone, and
 *  the frosted window frame, the snow on its sill and a bit of her pink curtain in the shot. Still (a photo). */
export const snowPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const s = w / 360;
    const X = (u: number) => x + u * w,
      Y = (v: number) => y + v * h;
    const glowAt = (gx: number, gy: number, r: number, col: string, a: number) => {
      const g = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g;
      c.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    };
    // sky: deep blue at the top, the city's warm violet haze at the horizon
    const sky = c.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, "#0b1030");
    sky.addColorStop(0.45, "#232a5e");
    sky.addColorStop(0.7, "#4a3f75");
    sky.addColorStop(1, "#2a2650");
    c.fillStyle = sky;
    c.fillRect(x, y, w, h);
    // the moon behind thin cloud
    glowAt(X(0.3), Y(0.13), 120 * s, "190,205,255", 0.35);
    c.fillStyle = "#f4f1df";
    c.beginPath();
    c.arc(X(0.3), Y(0.13), 17 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(60,66,120,0.55)";
    for (const [u, v, rw, rh] of [[0.22, 0.15, 0.32, 0.025], [0.5, 0.2, 0.4, 0.02], [0.75, 0.09, 0.3, 0.018]]) {
      c.beginPath();
      c.ellipse(X(u), Y(v), rw * w, rh * h, 0, 0, Math.PI * 2);
      c.fill();
    }
    // far rooftops in the haze, a thin line of snow on each
    c.fillStyle = "#34346a";
    c.beginPath();
    c.moveTo(x, y + h);
    let fx0 = x;
    for (let i = 0; fx0 < x + w; i++) {
      const bw = (34 + 30 * hash(i * 5.1)) * s,
        top = Y(0.33 + 0.08 * hash(i * 2.3));
      c.lineTo(fx0, top);
      c.lineTo(fx0 + bw, top);
      fx0 += bw;
    }
    c.lineTo(x + w, y + h);
    c.fill();
    fx0 = x;
    for (let i = 0; fx0 < x + w; i++) {
      const bw = (34 + 30 * hash(i * 5.1)) * s,
        top = Y(0.33 + 0.08 * hash(i * 2.3));
      c.fillStyle = "rgba(220,226,255,0.45)";
      c.fillRect(fx0, top - 1.5 * s, bw, 3 * s);
      for (let k = 0; k < 6; k++)
        if (hash(i * 13 + k * 2.7) > 0.72) {
          c.fillStyle = "rgba(255,210,150,0.45)";
          c.fillRect(fx0 + (5 + (k % 2) * 14) * s, top + (10 + Math.floor(k / 2) * 14) * s, 5 * s, 6 * s);
        }
      fx0 += bw;
    }
    // haze between the far and the near blocks
    const haze = c.createLinearGradient(0, Y(0.33), 0, Y(0.6));
    haze.addColorStop(0, "rgba(130,118,180,0)");
    haze.addColorStop(1, "rgba(130,118,180,0.4)");
    c.fillStyle = haze;
    c.fillRect(x, Y(0.33), w, 0.27 * h);
    // the old block across the street: a snowy pitched roof, warm windows of different rooms, snow on the ledges
    const near: [number, number, number, number][] = [[0.1, 0.5, 0.44, 4], [0.56, 0.58, 0.3, 3]];
    near.forEach(([u, v, bw, cols], b) => {
      const bx = X(u),
        by = Y(v),
        bwp = bw * w;
      c.fillStyle = b ? "#202350" : "#1b1e46";
      c.fillRect(bx, by, bwp, h);
      // roof
      c.fillStyle = "#15183a";
      c.beginPath();
      c.moveTo(bx - 6 * s, by);
      c.lineTo(bx + bwp * 0.5, by - 26 * s);
      c.lineTo(bx + bwp + 6 * s, by);
      c.fill();
      c.fillStyle = "#eef2ff";
      c.beginPath();
      c.moveTo(bx - 8 * s, by + 2 * s);
      c.lineTo(bx + bwp * 0.5, by - 30 * s);
      c.lineTo(bx + bwp + 8 * s, by + 2 * s);
      c.quadraticCurveTo(bx + bwp * 0.8, by - 4 * s, bx + bwp * 0.5, by - 18 * s);
      c.quadraticCurveTo(bx + bwp * 0.2, by - 4 * s, bx - 8 * s, by + 2 * s);
      c.fill();
      const ww = bwp / cols;
      for (let r = 0; r < 5; r++)
        for (let k = 0; k < cols; k++) {
          const lit = hash(b * 50 + r * 7 + k * 1.9);
          const wx = bx + k * ww + ww * 0.22,
            wy = by + (18 + r * 38) * s,
            wwid = ww * 0.56,
            wh = 24 * s;
          if (lit > 0.4) {
            glowAt(wx + wwid / 2, wy + wh / 2, 30 * s, "255,180,100", 0.22);
            const wg = c.createLinearGradient(0, wy, 0, wy + wh);
            wg.addColorStop(0, lit > 0.75 ? "#ffd998" : "#f6b768");
            wg.addColorStop(1, lit > 0.75 ? "#f4b467" : "#d98b4f");
            c.fillStyle = wg;
          } else c.fillStyle = "#2a2d5a";
          c.fillRect(wx, wy, wwid, wh);
          // the window's cross bars
          c.fillStyle = "rgba(20,22,50,0.7)";
          c.fillRect(wx + wwid / 2 - 1 * s, wy, 2 * s, wh);
          c.fillRect(wx, wy + wh * 0.45, wwid, 2 * s);
          if (lit > 0.62 && lit < 0.85) {
            // a curtain half drawn
            c.fillStyle = "rgba(180,95,80,0.6)";
            c.fillRect(wx, wy, wwid * 0.35, wh);
          }
          // snow on the ledge
          c.fillStyle = "rgba(238,242,255,0.9)";
          rr(c, wx - 3 * s, wy + wh, wwid + 6 * s, 3.5 * s, 1.5 * s);
          c.fill();
        }
    });
    // the street, white with snow, tyre tracks, and the lamp's pool of light
    const ground = c.createLinearGradient(0, Y(0.8), 0, y + h);
    ground.addColorStop(0, "#8e93c4");
    ground.addColorStop(1, "#5d6196");
    c.fillStyle = ground;
    c.fillRect(x, Y(0.8), w, 0.2 * h);
    c.strokeStyle = "rgba(60,62,110,0.45)";
    c.lineWidth = 3 * s;
    for (const d of [-0.06, 0.06]) {
      c.beginPath();
      c.moveTo(X(0.45 + d), Y(0.8));
      c.quadraticCurveTo(X(0.5 + d * 2), Y(0.9), X(0.42 + d * 4), y + h);
      c.stroke();
    }
    // the street lamp: a warm cone and the flakes caught in it
    const lx = X(0.8),
      ly = Y(0.5);
    c.strokeStyle = "#141633";
    c.lineWidth = 5 * s;
    c.beginPath();
    c.moveTo(lx + 14 * s, Y(0.84));
    c.lineTo(lx + 14 * s, ly + 4 * s);
    c.quadraticCurveTo(lx + 14 * s, ly - 6 * s, lx + 2 * s, ly - 4 * s);
    c.stroke();
    c.save();
    c.globalCompositeOperation = "lighter";
    const cone = c.createLinearGradient(0, ly, 0, Y(0.86));
    cone.addColorStop(0, "rgba(255,196,120,0.45)");
    cone.addColorStop(1, "rgba(255,196,120,0.04)");
    c.fillStyle = cone;
    c.beginPath();
    c.moveTo(lx - 6 * s, ly);
    c.lineTo(lx + 6 * s, ly);
    c.lineTo(lx + 70 * s, Y(0.86));
    c.lineTo(lx - 80 * s, Y(0.86));
    c.closePath();
    c.fill();
    glowAt(lx, ly, 90 * s, "255,200,130", 0.5);
    glowAt(lx - 5 * s, Y(0.85), 90 * s, "255,200,140", 0.35);
    c.restore();
    c.fillStyle = "#fff0c8";
    c.beginPath();
    c.ellipse(lx, ly, 8 * s, 4 * s, 0, 0, Math.PI * 2);
    c.fill();
    // a bare tree in the front yard, every branch carrying a line of snow
    const branch = (bx: number, by: number, ang: number, len: number, wid: number, d: number, sd: number) => {
      const ex = bx + Math.cos(ang) * len,
        ey = by + Math.sin(ang) * len;
      c.strokeStyle = "#121433";
      c.lineCap = "round";
      c.lineWidth = wid;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(ex, ey);
      c.stroke();
      c.strokeStyle = "rgba(240,244,255,0.92)";
      c.lineWidth = Math.max(1.2 * s, wid * 0.45);
      c.beginPath();
      c.moveTo(bx, by - wid * 0.45);
      c.lineTo(ex, ey - wid * 0.45);
      c.stroke();
      if (d <= 0) return;
      for (const side of [-1, 1]) branch(ex, ey, ang + side * (0.35 + 0.3 * hash(sd + side)), len * (0.62 + 0.15 * hash(sd * 2 + side)), wid * 0.62, d - 1, sd * 3 + side + 7);
    };
    branch(X(0.3), Y(0.97), -Math.PI / 2 + 0.06, 0.2 * h, 9 * s, 5, 11);
    // flakes: far small and dense, near big and soft; the ones in the lamp's light are warm
    const inCone = (fx: number, fy: number) => fy > ly && Math.abs(fx - lx) < 10 * s + ((fy - ly) / (Y(0.86) - ly)) * 75 * s;
    for (let i = 0; i < 130; i++) {
      const fx = X(hash(i * 7.7)),
        fy = Y(hash(i * 3.1));
      const r = (0.8 + hash(i * 1.3) * 2.2) * s;
      c.fillStyle = inCone(fx, fy) ? "rgba(255,236,196,0.95)" : "rgba(235,240,255,0.8)";
      c.beginPath();
      c.arc(fx, fy, r, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 14; i++) glowAt(X(hash(i * 9.3 + 2)), Y(hash(i * 4.9 + 1)), (6 + 8 * hash(i * 2.2)) * s, "240,244,255", 0.55);
    // her window: the frame, frost in the corners, the snow piled on the sill, the edge of her pink curtain
    c.fillStyle = "#e9e2d6";
    c.fillRect(x, y, w * 0.045, h);
    c.fillRect(x, Y(0.93), w, 0.07 * h);
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.fillRect(X(0.045), y, 3 * s, Y(0.93) - y);
    c.fillStyle = "#f7f9ff";
    c.beginPath();
    c.moveTo(X(0.045), Y(0.93));
    for (let i = 0; i <= 12; i++) c.lineTo(X(0.045 + (i / 12) * 0.955), Y(0.93) - (4 + 9 * Math.sin(i * 0.9) ** 2 + 6 * hash(i * 3.7)) * s);
    c.lineTo(x + w, Y(0.93));
    c.closePath();
    c.fill();
    glowAt(X(0.05), Y(0.92), 70 * s, "235,242,255", 0.5);
    glowAt(x + w, y, 80 * s, "235,242,255", 0.4);
    const cur = c.createLinearGradient(x, 0, X(0.09), 0);
    cur.addColorStop(0, "rgba(150,70,110,0.95)");
    cur.addColorStop(1, "rgba(150,70,110,0)");
    c.fillStyle = cur;
    c.fillRect(x, y, 0.09 * w, h);
    // the phone camera's look: a warm lift and a soft vignette
    const vg = c.createRadialGradient(X(0.55), Y(0.5), 0.2 * w, X(0.55), Y(0.5), 0.85 * h);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(5,6,25,0.45)");
    c.fillStyle = vg;
    c.fillRect(x, y, w, h);
  });

/** The same two detailed café photos in her post, his viewer and the room's polaroid. */
export function couplePhoto(kiss: boolean): Photo {
  return (c, x, y, w, h) => cafeCouplePhoto(c, x, y, w, h, { kiss });
}

/** Graduation, 2023: her in a mortarboard. */
export const gradPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    c.fillStyle = "#9fd0f0";
    c.fillRect(x, y, w, h);
    c.fillStyle = "#79b86a";
    c.fillRect(x, y + h * 0.7, w, h * 0.3);
    const s = w / 600;
    drawKid(c, x + w * 0.5, y + h * 0.5, 0.95 * s, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "grin", seed: 841 });
    c.save();
    c.translate(x + w * 0.5, y + h * 0.5 - 150 * s);
    c.scale(s, s);
    poly(c, [[-130, -10], [0, -60], [130, -10], [0, 40]], 842, 1);
    paint(c, "#1c1c22", C.ink, 5);
    inkLine(c, [[60, 10], [90, 40], [92, 110]], 843, 4, "#f3c03a");
    c.restore();
  });

/** New Year's Eve 2024: fireworks behind her. */
export const nightPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    c.fillStyle = "#1a1640";
    c.fillRect(x, y, w, h);
    for (let i = 0; i < 4; i++) {
      const fx = x + w * (0.2 + i * 0.22),
        fy = y + h * (0.18 + (i % 2) * 0.1);
      c.strokeStyle = ["#ffd166", "#ff7aa8", "#7ad8ff", "#c9a2ff"][i];
      c.lineWidth = 3;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        c.beginPath();
        c.moveTo(fx + Math.cos(a) * 10, fy + Math.sin(a) * 10);
        c.lineTo(fx + Math.cos(a) * 40, fy + Math.sin(a) * 40);
        c.stroke();
      }
    }
    const s = w / 600;
    drawKid(c, x + w * 0.5, y + h * 0.55, 0.95 * s, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "laugh", seed: 851 });
  });

/** The party photo she posted in her first winter away (the memory): a selfie with her two roommates out on a winter
 *  night — a street of string lights and a big glowing tree behind them, the shop lights melted into bokeh, snow
 *  falling, and the phone's flash warm on their laughing faces. */
export const partyPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const s = w / 600;
    const X = (u: number) => x + u * w,
      Y = (v: number) => y + v * h;
    const glowAt = (gx: number, gy: number, r: number, col: string, a: number) => {
      const gg = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      gg.addColorStop(0, `rgba(${col},${a})`);
      gg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gg;
      c.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    };
    // the night: deep blue at the top, the street's warm plum glow lower down
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#1a1840");
    g.addColorStop(0.55, "#4a2a62");
    g.addColorStop(1, "#7a3a5e");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    // shop windows down the street, out of focus
    for (let i = 0; i < 7; i++) {
      const bx = X(-0.05 + i * 0.17),
        by = Y(0.42 + 0.06 * hash(i * 2.2));
      c.fillStyle = `rgba(${i % 2 ? "255,190,120" : "255,150,170"},0.18)`;
      rr(c, bx, by, 70 * s, 110 * s, 10 * s);
      c.fill();
    }
    // the big tree behind her, glowing, strung with lights, a star on top
    const tx = X(0.72),
      ty = Y(0.08);
    glowAt(tx, Y(0.35), 220 * s, "255,200,120", 0.35);
    c.fillStyle = "rgba(30,80,60,0.85)";
    c.beginPath();
    c.moveTo(tx, ty + 20 * s);
    c.lineTo(tx + 150 * s, Y(0.7));
    c.lineTo(tx - 150 * s, Y(0.7));
    c.closePath();
    c.fill();
    for (let i = 0; i < 26; i++) {
      const v = hash(i * 3.9),
        hw = (20 + 130 * v) * s;
      const lx = tx + (hash(i * 6.1) * 2 - 1) * hw,
        ly = ty + 20 * s + v * (Y(0.7) - ty - 20 * s);
      glowAt(lx, ly, 14 * s, ["255,214,120", "255,140,160", "160,220,255"][i % 3], 0.9);
    }
    c.save();
    c.translate(tx, ty + 14 * s);
    c.fillStyle = "#ffe08a";
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = (k % 2 ? 8 : 20) * s,
        a = -Math.PI / 2 + (k * Math.PI) / 5;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.restore();
    glowAt(tx, ty + 14 * s, 50 * s, "255,230,150", 0.7);
    // big soft bokeh of the street lights
    for (let i = 0; i < 14; i++) {
      const bx = X(hash(i * 3.7)),
        by = Y(0.05 + 0.6 * hash(i * 1.9));
      const r = (26 + 40 * hash(i * 5.3)) * s;
      glowAt(bx, by, r, ["255,206,120", "140,200,255", "255,140,200", "255,170,110"][i % 4], 0.35);
      c.strokeStyle = "rgba(255,240,220,0.12)";
      c.lineWidth = 2 * s;
      c.beginPath();
      c.arc(bx, by, r * 0.7, 0, Math.PI * 2);
      c.stroke();
    }
    // a string of lights swinging across the top
    const bulbs: [number, number][] = [];
    c.strokeStyle = "rgba(20,16,30,0.8)";
    c.lineWidth = 2.5 * s;
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const py = Y(0.12 + 0.12 * Math.sin(Math.PI * ((u * 2) % 1)));
      if (i === 0) c.moveTo(X(u), py);
      else c.lineTo(X(u), py);
      if (i % 2) bulbs.push([X(u), py + 8 * s]);
    }
    c.stroke();
    bulbs.forEach(([bx, by], i) => {
      glowAt(bx, by, 22 * s, i % 2 ? "255,214,140" : "255,160,180", 0.75);
      c.fillStyle = i % 2 ? "#fff1c4" : "#ffd0dc";
      c.beginPath();
      c.ellipse(bx, by, 5 * s, 7 * s, 0, 0, Math.PI * 2);
      c.fill();
    });
    // the three of them, close together for the selfie
    drawPerson(c, X(0.2), Y(0.52), 0.75 * s, { x: 0, hair: "pony", hairColor: "#3a2414", top: "#f2c94c", face: "laugh", body: "bust", seed: 861 });
    drawPerson(c, X(0.8), Y(0.52), 0.75 * s, { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", face: "smile", body: "bust", seed: 862 });
    drawKid(c, X(0.5), Y(0.5), 0.86 * s, { who: "girl", outfit: "uniform", body: "bust", eyes: "happy", mouth: "grin", tilt: 0.08, seed: 863 });
    // snow falling in front of them, a few big soft flakes close to the lens
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 50; i++) {
      c.beginPath();
      c.arc(X(hash(i * 7.3)), Y(hash(i * 2.7)), (1.5 + 3 * hash(i * 1.1)) * s, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 6; i++) glowAt(X(hash(i * 9.1 + 3)), Y(hash(i * 4.4 + 2)), (10 + 10 * hash(i)) * s, "255,255,255", 0.5);
    // the phone's flash: warm on their faces, falling off to the edges
    c.save();
    c.globalCompositeOperation = "lighter";
    glowAt(X(0.5), Y(0.5), 0.5 * w, "255,210,170", 0.14);
    c.restore();
    const vg = c.createRadialGradient(X(0.5), Y(0.5), 0.3 * w, X(0.5), Y(0.5), 0.75 * w);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(20,8,30,0.4)");
    c.fillStyle = vg;
    c.fillRect(x, y, w, h);
  });

/** His lock-screen wallpaper: a sunny afternoon in the park twenty years ago — young him (black hair, white shirt,
 *  laughing) kneeling behind little her (five, the same sunflower clip), his arms round her middle and his hands clasped
 *  in front of her, her hands on his arms. His face sits at WALL_FACE (0..1 of the photo) at WALL_S, so his reflection
 *  can melt into it: high enough that her face, under his chin, stays clear of the lyrics. */
export const WALL_FACE: [number, number] = [0.5, 0.44];
export const WALL_S = 1.15;
/** the hug, in his head units (his head centre at 0,0): her size next to him and her head centre — the top of her hair
 *  just under his chin */
const HUG = { scale: 0.66, head: [10, 245] as Pt };
const YOUNG_SKIN = "#f1d2a6",
  SHIRT = "#f4f2ea";
/** his upper arm hanging from the shoulder to the elbow beside her (his head units) */
function dadUpperArm(c: Ctx, side: number) {
  // the top starts inside the shoulder so the sleeve grows out of it instead of sitting on it like a pad
  const top: Pt = [side * 146, 262],
    elbow: Pt = [side * 198, side > 0 ? 442 : 458];
  shaded(c, () => blob(c, tubePts([top, lerp2(top, elbow, 0.5), elbow], [64, 60, 56], true, true), 3740 + side, 1.1), SHIRT, () => {
    blob(c, tubePts([[top[0] + side * 20, top[1] + 10], [elbow[0] + side * 18, elbow[1]]], [30, 26], true, true), 3742 + side, 1);
    paint(c, "rgba(150,160,190,0.25)", null);
  }, C.ink, 5.5);
  // the fold where the arm hangs from the shoulder
  inkLine(c, [[side * 126, 252], [side * 150, 240], [side * 176, 248]], 3744 + side, 2.4, "rgba(120,124,140,0.55)");
}
/** his bare forearm (sleeve rolled up past the elbow) round her middle, to his hands clasped in front of her — the right
 *  hand over the left (his head units). Drawn between her body and her arms, so her arms lie over it. */
function dadForearm(c: Ctx, side: number) {
  const elbow: Pt = [side * 198, side > 0 ? 442 : 458],
    hand: Pt = side > 0 ? [12, 450] : [-14, 464];
  const wrist = lerp2(elbow, hand, 0.86);
  shaded(c, () => blob(c, tubePts([elbow, lerp2(elbow, wrist, 0.5), wrist], [54, 50, 44], true, false), 3800 + side, 1), YOUNG_SKIN, () => {
    blob(c, tubePts([[elbow[0], elbow[1] + 14], [wrist[0], wrist[1] + 12]], [20, 16], true, true), 3802 + side, 1);
    paint(c, "rgba(196,140,86,0.3)", null);
  }, C.ink, 5);
  // the rolled-up sleeve round the elbow
  const r0 = lerp2(elbow, wrist, -0.03),
    r1 = lerp2(elbow, wrist, 0.1);
  shaded(c, () => blob(c, tubePts([r0, r1], [64, 60], true, true), 3804 + side, 0.8), SHIRT, () => {
    blob(c, tubePts([[r0[0], r0[1] + 18], [r1[0], r1[1] + 18]], [32, 28], true, true), 3805 + side, 0.6);
    paint(c, "rgba(150,160,190,0.25)", null);
  }, C.ink, 4.5);
  const mid = lerp2(r0, r1, 0.5);
  inkLine(c, [[mid[0], mid[1] - 26], [mid[0] + side * 3, mid[1]], [mid[0], mid[1] + 26]], 3806 + side, 2, "rgba(120,124,140,0.6)");
  // his round hand, knuckles toward us
  oval(c, hand[0], hand[1], 31, 32, 3807 + side, 0.8);
  paint(c, YOUNG_SKIN, C.ink, 4.5);
  c.save();
  oval(c, hand[0], hand[1], 31, 32, 3807 + side, 0.8);
  c.clip();
  oval(c, hand[0] + 14, hand[1] + 16, 22, 18, 3808 + side, 0.6);
  paint(c, "rgba(180,120,70,0.3)", null);
  c.restore();
  for (let k = 0; k < 3; k++) inkLine(c, [[hand[0] - side * 4, hand[1] - 16 + k * 12], [hand[0] - side * 20, hand[1] - 13 + k * 12]], 3809 + side * 4 + k, 2.2, "#a8825a");
}
export const wallpaperPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const sw = w / 600;
    const X = (u: number) => x + u * w,
      Y = (v: number) => y + v * h;
    const glowAt = (gx: number, gy: number, r: number, col: string, a: number) => {
      const gg = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      gg.addColorStop(0, `rgba(${col},${a})`);
      gg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gg;
      c.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    };
    // a late golden afternoon: blue overhead, warm haze down at the trees
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#6fb6ea");
    g.addColorStop(0.4, "#b9def4");
    g.addColorStop(0.62, "#ffe6bd");
    g.addColorStop(1, "#f3d9a0");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    // soft clouds lit from the sun's side
    for (const [u, v, k] of [[0.18, 0.12, 1], [0.7, 0.32, 0.8], [0.12, 0.42, 0.6]]) {
      for (let j = 0; j < 4; j++) {
        oval(c, X(u) + (j - 1.5) * 46 * sw * k, Y(v) - (j % 2) * 16 * sw * k, (44 + 14 * (j % 2)) * sw * k, (26 + 8 * (j % 2)) * sw * k, 3760 + j, 1);
        paint(c, "rgba(255,255,255,0.55)", null);
      }
      oval(c, X(u) + 30 * sw * k, Y(v) + 6 * sw * k, 70 * sw * k, 12 * sw * k, 3765, 1);
      paint(c, "rgba(255,226,190,0.5)", null);
    }
    // the sun, low on the right, and its rays
    const sx = X(0.84),
      sy = Y(0.3);
    glowAt(sx, sy, w * 0.75, "255,226,160", 0.5);
    glowAt(sx, sy, w * 0.18, "255,250,225", 0.95);
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) {
      const a = 1.9 + i * 0.18 + 0.05 * hash(i * 3.3);
      c.fillStyle = `rgba(255,236,190,${(0.05 + 0.04 * hash(i * 1.7)).toFixed(3)})`;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + Math.cos(a - 0.03) * w * 1.4, sy + Math.sin(a - 0.03) * w * 1.4);
      c.lineTo(sx + Math.cos(a + 0.03) * w * 1.4, sy + Math.sin(a + 0.03) * w * 1.4);
      c.closePath();
      c.fill();
    }
    c.restore();
    // a red kite up on the left, its tail curling in the wind
    c.save();
    c.translate(X(0.16), Y(0.3));
    c.rotate(-0.25);
    poly(c, [[0, -34 * sw], [22 * sw, 0], [0, 40 * sw], [-22 * sw, 0]], 3769, 1);
    paint(c, "#e8574f", C.ink, 3 * sw);
    inkLine(c, [[0, -34 * sw], [0, 40 * sw]], 3770, 1.5 * sw, "rgba(60,20,20,0.6)");
    inkLine(c, [[0, 40 * sw], [10 * sw, 70 * sw], [-6 * sw, 100 * sw], [8 * sw, 130 * sw]], 3771, 2 * sw, C.ink);
    for (const [bx, by] of [[8, 66], [-4, 98], [6, 126]]) {
      oval(c, bx * sw, by * sw, 6 * sw, 4 * sw, 3772 + by, 1);
      paint(c, "#ffd25a", null);
    }
    c.restore();
    inkLine(c, [[X(0.16) + 8 * sw, Y(0.3) + 30 * sw], [X(0.3), Y(0.5)], [X(0.4), Y(0.62)]], 3775, 1 * sw, "rgba(80,80,90,0.35)");
    // far trees in the haze, then the near ones: lit on the sun's side, cool in the shade
    for (let i = 0; i < 9; i++) {
      const tx = X(-0.04 + i * 0.13),
        ty = Y(0.57 + 0.02 * hash(i * 2.1));
      oval(c, tx, ty, 60 * sw, 50 * sw, 3780 + i, 1.2);
      paint(c, "rgba(150,186,140,0.85)", null);
    }
    const tree = (tx: number, ty: number, r: number, i: number) => {
      c.fillStyle = "#6a4a2c";
      c.fillRect(tx - 7 * sw, ty + r * 0.6, 14 * sw, r * 1.1);
      // one bumpy round canopy (a single outline, no circles inside it)
      const crown: Pt[] = [];
      for (let j = 0; j < 22; j++) {
        const a = (j / 22) * Math.PI * 2;
        const rr2 = r * (0.92 + 0.1 * Math.abs(Math.sin(a * 3.5 + i)) + 0.04 * hash(i * 9 + j));
        crown.push([tx + Math.cos(a) * rr2, ty + Math.sin(a) * rr2 * 0.92]);
      }
      shaded(c, () => blob(c, crown, 3784 + i, 0.8),  i % 2 ? "#78b866" : "#68aa5c", () => {
        // the shade on the side away from the sun, and the warm light on the sunny side
        c.fillStyle = "rgba(40,90,70,0.35)";
        c.beginPath();
        c.arc(tx - r * 0.55, ty + r * 0.45, r * 0.85, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(255,230,140,0.4)";
        c.beginPath();
        c.arc(tx + r * 0.45, ty - r * 0.4, r * 0.55, 0, Math.PI * 2);
        c.fill();
      }, "rgba(30,60,30,0.65)", 3 * sw);
    };
    [[0.02, 0.6, 82], [0.24, 0.63, 70], [0.76, 0.62, 74], [0.98, 0.6, 86]].forEach(([u, v, r], i) => tree(X(u), Y(v), r * sw, i));
    // the grass: a rolling lawn, long warm light across it, little flowers
    const lawn = c.createLinearGradient(0, Y(0.7), 0, y + h);
    lawn.addColorStop(0, "#a8d47a");
    lawn.addColorStop(1, "#6fae58");
    c.fillStyle = lawn;
    c.beginPath();
    c.moveTo(x, Y(0.67));
    c.quadraticCurveTo(X(0.35), Y(0.63), X(0.6), Y(0.66));
    c.quadraticCurveTo(X(0.85), Y(0.68), x + w, Y(0.64));
    c.lineTo(x + w, y + h);
    c.lineTo(x, y + h);
    c.closePath();
    c.fill();
    for (let i = 0; i < 60; i++) {
      const gx = X(hash(i * 4.1)),
        gy = Y(0.69 + 0.31 * hash(i * 2.9));
      inkLine(c, [[gx, gy], [gx + 3 * sw, gy - 10 * sw]], 3790 + i, 1.4 * sw, "rgba(60,110,50,0.5)");
      if (hash(i * 7.3) > 0.6) {
        c.fillStyle = hash(i * 5.5) > 0.5 ? "#fff6e0" : "#ffd74f";
        c.beginPath();
        c.arc(gx + 6 * sw, gy - 4 * sw, 3.5 * sw, 0, Math.PI * 2);
        c.fill();
      }
    }
    const fx = x + w * WALL_FACE[0],
      fy = y + h * WALL_FACE[1];
    const s = WALL_S * sw;
    // him kneeling behind her: his trousers below the shirt (the photo crops at his waist), him, his upper arms
    c.save();
    c.translate(fx, fy);
    c.scale(s, s);
    const him = c.getTransform();
    blob(c, [[-186, 560], [186, 560], [196, 760], [-196, 760]], 3730, 1);
    paint(c, "#4c5160", C.ink, 5.5);
    c.restore();
    drawDad(c, fx, fy, s, { young: true, eyes: "happy", mouth: "laugh", seed: 871 });
    c.save();
    c.setTransform(him);
    for (const side of [-1, 1]) dadUpperArm(c, side);
    // her soft shadow on his shirt (the sun is high on the right)
    oval(c, HUG.head[0] - 14, HUG.head[1] + 12, 104, 100, 3734, 1);
    paint(c, "rgba(96,104,138,0.16)", null);
    blob(c, [[HUG.head[0] - 96, 360], [HUG.head[0] + 70, 360], [HUG.head[0] + 76, 640], [HUG.head[0] - 104, 640]], 3735, 1);
    paint(c, "rgba(96,104,138,0.16)", null);
    c.restore();
    // little her standing in front of him, the top of her head under his chin; his forearms go round her middle under
    // her arms, and her hands rest on them over his clasped hands
    drawKid(c, fx + HUG.head[0] * s, fy + HUG.head[1] * s, HUG.scale * s, {
      who: "girl", outfit: "pajamas", body: "full", eyes: "happy", mouth: "laugh", blush: 0.6, tilt: 0.05,
      arms: "custom", elbowL: [-128, 338], handL: [-64, 316], elbowR: [130, 334], handR: [70, 308], shapeL: "flat", shapeR: "flat",
      seed: 872,
      holding: (k) => {
        k.save();
        k.setTransform(him);
        dadForearm(k, -1);
        dadForearm(k, 1);
        k.restore();
      },
    });
    // the sun behind them on the right: a warm rim of light round them, a little flare and bokeh, the old photo look
    c.save();
    c.globalCompositeOperation = "lighter";
    glowAt(X(0.78), Y(0.42), w * 0.45, "255,200,120", 0.16);
    for (const [u, v, r, a] of [[0.9, 0.42, 22, 0.16], [0.12, 0.58, 30, 0.1], [0.95, 0.62, 16, 0.14]]) {
      glowAt(X(u), Y(v), r * sw, "255,230,180", a);
      c.strokeStyle = `rgba(255,236,200,${(a * 0.8).toFixed(3)})`;
      c.lineWidth = 1.2 * sw;
      c.beginPath();
      c.arc(X(u), Y(v), r * sw * 0.8, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
    c.fillStyle = "rgba(255,200,120,0.1)";
    c.fillRect(x, y, w, h);
    const vg = c.createRadialGradient(X(0.55), Y(0.45), 0.3 * w, X(0.55), Y(0.45), 0.85 * h);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(90,50,20,0.28)");
    c.fillStyle = vg;
    c.fillRect(x, y, w, h);
  });

// ---------------------------------------------------------------- the short-video app (dark)
const VBG = "#14151d";
const GREY = "#8b8c94";
const VLINE = "rgba(255,255,255,0.08)";

/** Keep the comment, list and touch anchors in the approved camera composition. */
export const firstCommentAt = (big = false): [number, number] => [104, 620 + 180 + 46 * (big ? 1.3 : 1)];
export const INBOX_AT: [number, number] = [480, 748];

/** The full first-act controls are opt-in, so later scenes keep their matching compositions. */
export function vidPost(c: Ctx, o: { time: string; photo: Photo; caption: string; ago: string; author?: string; big?: boolean; likes?: number; count?: number; showComments?: boolean; mark?: Guide; photoH?: number; details?: boolean; comments?: { name: string; text: string; rose?: boolean; ago?: string; pop?: number; gray?: boolean }[]; photoZoom?: { k: number; fx: number; fy: number } }) {
  const big = o.big ? 1.3 : 1;
  const compact = o.showComments || !!o.comments?.length;
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.42 });
  if (o.details) socialIcon(c, "back", 40, 120, 30, "#fff");
  else text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  herAvatar(c, 110, 120, 30);
  say(c, o.author ?? HER, 156, 120, 30 * big, { weight: 700 });
  if (o.details) {
    say(c, "我的日常", 408, 120, 21, { color: GREY });
    socialIcon(c, "more", 550, 120, 32, "#eeeef3");
  }
  const px = 0, py = 170, pw = SW, ph = o.photoH ?? (compact ? 400 : 640);
  c.save();
  c.beginPath(); c.rect(px, py, pw, ph); c.clip();
  if (o.photoZoom && o.photoZoom.k > 1.001) {
    const { k, fx, fy } = o.photoZoom;
    const cx = px + pw * fx, cy = py + ph * fy;
    c.translate(px + pw / 2, py + ph / 2);
    c.scale(k, k);
    c.translate(-cx, -cy);
  }
  o.photo(c, px, py, pw, ph);
  c.restore();
  if (o.details) {
    socialButton(c, 506, py + 18, 72, 38, compact ? "1 / 1" : "1 / 2", { fill: "rgba(0,0,0,0.45)", size: 19, radius: 19 });
    if (!compact) {
      for (let i = 0; i < 2; i++) {
        c.fillStyle = i ? "#737480" : "#fff";
        c.beginPath(); c.arc(290 + i * 20, py + ph + 15, 3.5, 0, Math.PI * 2); c.fill();
      }
    }
  }
  const shown = (o.comments ?? []).filter((cm) => (cm.pop ?? 1) > 0);
  const ty = py + ph + 50;
  say(c, o.caption, 36, ty, 38 * big, { weight: 700 });
  say(c, o.ago, 36, ty + 52, 26 * big, { color: GREY });
  heartIcon(c, SW - 230, ty + 52, 26 * big, GREY);
  say(c, String(o.likes ?? 23), SW - 208, ty + 52, 26 * big, { color: GREY });
  bubbleIcon(c, SW - 130, ty + 52, 26 * big, GREY);
  say(c, String(o.count ?? (compact ? shown.length : 6)), SW - 108, ty + 52, 26 * big, { color: GREY });
  if (o.details) socialIcon(c, "share", 558, ty + 52, 28, GREY);
  c.fillStyle = VLINE;
  c.fillRect(0, ty + 90, SW, 2);
  if (compact) {
    say(c, "评论 " + (o.count ?? shown.length), 36, ty + 128, 26 * big, { color: "#c9cad1", weight: 700 });
    if (o.details) {
      say(c, "互动消息", 538, ty + 128, 22, { color: "#b1b3c0", align: "right" });
      socialIcon(c, "chevron", 561, ty + 128, 20, GREY);
      if (shown.length) {
        c.fillStyle = "#fe2c55";
        c.beginPath(); c.arc(426, ty + 127, 4.5, 0, Math.PI * 2); c.fill();
      }
    }
    let cy = ty + 180;
    if (!shown.length) say(c, "还没有评论，快来抢沙发～", SW / 2, cy + 40, 26 * big, { color: GREY, align: "center" });
    (o.comments ?? []).forEach((cm, i) => {
      const k = clamp(cm.pop ?? 1);
      if (k <= 0) return;
      const e = 1 - Math.pow(1 - k, 3);
      c.save(); c.globalAlpha *= e; c.translate(-36 * (1 - e), 0);
      if (i === 0 && o.mark !== undefined) guideBox(c, 24, cy - 26, SW - 48, 132 * big, o.mark);
      grayAvatar(c, 58, cy + 34 * big, 30 * big);
      say(c, cm.name, 104, cy, 24 * big, { color: GREY });
      say(c, cm.text, 104, cy + 46 * big, 36 * big, { weight: 700, rose: cm.rose });
      say(c, cm.ago ?? "刚刚", 104, cy + 92 * big, 22 * big, { color: GREY });
      if (o.details) {
        say(c, "回复", 194, cy + 92 * big, 22, { color: "#adaeb8" });
        heartIcon(c, 551, cy + 34 * big, 23, "#72737e");
        say(c, "赞", 551, cy + 64 * big, 17, { color: "#72737e", align: "center" });
      }
      c.restore();
      cy += 140 * big;
    });
  } else if (o.details) {
    socialIcon(c, "music", 49, ty + 145, 25, GREY);
    say(c, "stalk ur socials · s0rrow", 76, ty + 145, 22, { color: "#b0b1bb" });
    say(c, "查看全部 " + (o.count ?? 6) + " 条评论", 36, ty + 217, 25, { color: "#b7b8c2" });
    socialIcon(c, "chevron", 554, ty + 217, 22, GREY);
  }
  if (o.details) {
    c.fillStyle = "#1b1c25"; c.fillRect(0, 1160, SW, 120);
    c.fillStyle = VLINE; c.fillRect(0, 1160, SW, 1);
    socialButton(c, 24, 1178, 414, 56, "留下你的评论…", { color: "#8f909c", size: 24, radius: 28, fill: "#2a2b35" });
    socialIcon(c, "smile", 405, 1206, 28, "#aaabb5");
    socialIcon(c, "bookmark", 477, 1206, 27, "#bbbcc6");
    socialIcon(c, "share", 547, 1206, 28, "#bbbcc6");
    socialHomeBar(c);
  }
}

/** Publishing stays at POST_BTN so the original press and sound remain aligned. */
export const POST_BTN: [number, number] = [SW / 2, 1120];
export function vidCompose(c: Ctx, o: { time: string; photo: Photo; caption: string; caret?: boolean; press?: number }) {
  c.fillStyle = VBG; c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.42 });
  socialIcon(c, "back", 40, 120, 30, "#fff");
  say(c, "发日常", SW / 2, 120, 34, { weight: 700, align: "center" });
  say(c, "存草稿", 560, 120, 22, { color: GREY, align: "right" });
  c.fillStyle = VLINE; c.fillRect(24, 166, SW - 48, 1);
  const w = say(c, o.caption, 40, 230, 44, { weight: 700 });
  if (o.caret) { c.fillStyle = "#fe2c55"; c.fillRect(46 + w, 204, 4, 52); }
  say(c, o.caption.length + " / 1000", 560, 272, 18, { color: "#71727e", align: "right" });
  c.save(); rr(c, 40, 310, 360, 480, 18); c.clip(); o.photo(c, 40, 310, 360, 480); c.restore();
  socialButton(c, 304, 734, 72, 36, "1 / 1", { fill: "rgba(0,0,0,0.4)", size: 20, radius: 18 });
  c.fillStyle = "rgba(0,0,0,0.4)"; c.beginPath(); c.arc(372, 338, 17, 0, Math.PI * 2); c.fill();
  socialIcon(c, "close", 372, 338, 19, "#fff");
  c.save(); c.strokeStyle = "#454651"; c.lineWidth = 1.5; c.setLineDash([6, 6]);
  rr(c, 424, 310, 136, 156, 16); c.stroke(); c.restore();
  socialIcon(c, "plus", 492, 366, 36, "#9798a4");
  say(c, "添加图片", 492, 420, 22, { color: GREY, align: "center" });
  socialButton(c, 40, 818, 144, 48, "# 下雪", { size: 25, color: "#a0bbf6", radius: 24 });
  socialButton(c, 200, 818, 144, 48, "@ 朋友", { size: 24, color: "#bbbcc7", radius: 24 });
  const rows: [number, "globe" | "pin", string, string][] = [[924, "globe", "谁可以看", "公开"], [1006, "pin", "所在位置", "不显示位置"]];
  rows.forEach(([y, icon, title, value]) => {
    socialIcon(c, icon, 54, y, 27, "#c5c6ce");
    say(c, title, 88, y, 28, { color: "#e1e2e9" });
    say(c, value, 526, y, 24, { color: GREY, align: "right" });
    socialIcon(c, "chevron", 551, y, 22, GREY);
    c.fillStyle = VLINE; c.fillRect(40, y + 38, 520, 1);
  });
  const k = clamp(o.press ?? 0);
  socialButton(c, 40, POST_BTN[1] - 48, SW - 80, 96, "发布", { fill: k > 0 ? "#d81e44" : "#fe2c55", radius: 22, size: 38 });
  say(c, "日常会展示在你的主页", SW / 2, 1200, 20, { color: "#797a86", align: "center" });
  socialHomeBar(c);
}

/** The body anchor stays at (140, y + 112) for the later match cut into her memory. */
export function vidBanner(c: Ctx, k: number, o: { name: string; body: string; rose?: boolean; big?: boolean; reply?: boolean; details?: boolean }) {
  if (k <= 0) return;
  const e = 1 - Math.pow(1 - clamp(k), 3);
  const big = o.big ? 1.25 : 1, h = 172 * big, y = -h + (84 + h) * e;
  c.save();
  c.shadowColor = "rgba(0,0,0,0.5)"; c.shadowBlur = 24; c.shadowOffsetY = o.details ? 8 : 0;
  c.fillStyle = "rgba(44,45,54,0.97)"; rr(c, 18, y, SW - 36, h, 30); c.fill();
  c.shadowColor = "transparent"; c.shadowOffsetY = 0;
  if (o.details) { c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1; c.stroke(); }
  if (o.reply) herAvatar(c, 82, y + h / 2, 40 * big);
  else grayAvatar(c, 82, y + h / 2, 40 * big);
  say(c, o.name + " " + (o.reply ? "回复了你" : "评论了你"), 140, y + 50 * big, (o.details ? 24 : 27) * big, { color: "#c9cad1" });
  if (o.details) say(c, "现在", 554, y + 25, 17, { color: "#93949f", align: "right" });
  say(c, o.body, 140, y + 112 * big, 44 * big, { weight: 700, rose: o.rose });
  c.restore();
}

/** The unknown account stays anonymous: no location, portrait or biographical clues. */
export const MENU_AT: [number, number] = [SW - 64, 116];
export function vidProfile(c: Ctx, o: { name: string; pulse?: Guide; time: string; menu?: number; blocked?: number }) {
  c.fillStyle = VBG; c.fillRect(0, 0, SW, SH);
  const g = c.createLinearGradient(0, 0, 0, 408);
  g.addColorStop(0, "#3b3c49"); g.addColorStop(1, VBG);
  c.fillStyle = g; c.fillRect(0, 0, SW, 408);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 40, 120, 30, "#fff");
  socialIcon(c, "more", MENU_AT[0], MENU_AT[1], 34, "#fff");
  if ((o.menu ?? 0) > 0) {
    c.fillStyle = "rgba(255,255,255," + (0.18 * (o.menu ?? 0)).toFixed(3) + ")";
    c.beginPath(); c.arc(MENU_AT[0], MENU_AT[1], 40, 0, Math.PI * 2); c.fill();
  }
  grayAvatar(c, 116, 283, 78);
  c.strokeStyle = "rgba(255,255,255,0.15)"; c.lineWidth = 3;
  c.beginPath(); c.arc(116, 283, 81, 0, Math.PI * 2); c.stroke();
  say(c, o.name, 220, 246, 36, { weight: 700 });
  say(c, "抖音号：" + ACC_ID, 220, 300, 22, { color: "#b0b1bd" });
  say(c, "这个人很懒，什么都没留下", 40, 390, 24, { color: GREY });
  const stats: [string, string][] = [["0", "获赞"], ["1", "关注"], ["0", "粉丝"]];
  stats.forEach(([n, l], i) => {
    const x = 70 + i * 170;
    say(c, n, x, 450, 44, { weight: 700 });
    say(c, l, x + measure(c, n, 44, F.ui, 700) + 10, 454, 28, { color: GREY });
  });
  guideBox(c, 228, 420, 132, 64, o.pulse ?? 0);
  // `blocked` 0 → 1 flips the button row over: 「关注 / 私信」 fold shut about their middle, 「已拉黑」 unfolds
  const blocked = clamp(o.blocked ?? 0);
  const fold = (k: number, draw: () => void) => {
    c.save();
    c.translate(0, 547);
    c.scale(1, Math.max(0.001, k));
    c.translate(0, -547);
    draw();
    c.restore();
  };
  if (blocked >= 0.5) {
    const k = 1 - Math.pow(1 - (blocked - 0.5) * 2, 2);
    fold(k, () => socialButton(c, 36, 512, 528, 70, "已拉黑", { icon: "shield", fill: "#292a34", color: "#b7b8c3", size: 29 }));
    c.save();
    c.globalAlpha *= k;
    say(c, "对方无法再评论你的作品", SW / 2, 616, 21, { color: GREY, align: "center" });
    c.restore();
  } else {
    fold(1 - Math.pow(blocked * 2, 2), () => {
      socialButton(c, 36, 512, 340, 70, "关注", { fill: "#fe2c55", icon: "plus", size: 29 });
      socialButton(c, 392, 512, 172, 70, "私信", { size: 27 });
    });
  }
  c.fillStyle = VLINE; c.fillRect(0, 648, SW, 1);
  say(c, "作品 0", 145, 691, 28, { weight: 700, align: "center" });
  say(c, "喜欢", 435, 691, 27, { color: "#747582", align: "center" });
  socialIcon(c, "lock", 483, 691, 19, "#747582");
  c.fillStyle = "#eeeef3"; rr(c, 111, 727, 68, 4, 2); c.fill();
  c.fillStyle = VLINE; c.fillRect(0, 746, SW, 1);
  // A complete empty state: the zero works itself is part of the clue.
  c.fillStyle = "#1c1d28"; c.beginPath(); c.arc(300, 838, 50, 0, Math.PI * 2); c.fill();
  socialIcon(c, "image", 300, 838, 56, "#5d5e6b");
  say(c, "暂无作品", SW / 2, 927, 30, { color: "#b3b4bf", weight: 700, align: "center" });
  say(c, "TA 还没有发布过作品", SW / 2, 975, 23, { color: "#6e6f7d", align: "center" });
  socialHomeBar(c);
}

/** Only one person is in the list. Search and footer explain the otherwise empty screen. */
export function vidFollowing(c: Ctx, o: { pulse?: Guide; time: string }) {
  c.fillStyle = VBG; c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 40, 120, 30, "#fff");
  say(c, "TA 的关注（1）", SW / 2, 120, 34, { weight: 700, align: "center" });
  socialIcon(c, "search", 552, 120, 28, GREY);
  c.fillStyle = VLINE; c.fillRect(0, 174, SW, 1);
  herAvatar(c, 90, 260, 50);
  say(c, HER, 166, 240, 36, { weight: 700 });
  socialButton(c, 166 + measure(c, HER, 36, F.ui, 700) + 14, 223, 50, 34, "我", { fill: "#fe2c55", size: 22, radius: 7 });
  say(c, "今天也要开心呀", 166, 288, 26, { color: GREY });
  socialIcon(c, "chevron", 550, 260, 23, "#777885");
  guideBox(c, 30, 196, SW - 60, 130, o.pulse ?? 0);
  c.fillStyle = VLINE; c.fillRect(166, 336, 398, 1);
  say(c, "已显示全部关注", SW / 2, 398, 22, { color: "#6e6f7d", align: "center" });
  socialHomeBar(c);
}

/** The history starts with the same two live comments that arrived in the opening shot.
 *  Each original post uses existing film art; the 2023 graduation is not a placeholder rectangle. */
type HistoryItem = { text: string; date: string; photo: Photo };
const HISTORY: HistoryItem[] = [
  { text: "窗户关好", date: "刚刚", photo: snowPhoto },
  { text: "这么晚还不睡？", date: "刚刚", photo: snowPhoto },
  { text: "又熬夜", date: "2026-01-09", photo: snowPhoto },
  { text: "和谁出去了", date: "2025-08-02", photo: couplePhoto(false) },
  { text: "瘦了", date: "2025-06-30", photo: gradPhoto },
  { text: "别哭", date: "2025-03-11", photo: snowPhoto },
  { text: "到家了吗", date: "2024-12-31", photo: nightPhoto },
  { text: "那个男生是谁", date: "2024-12-25", photo: couplePhoto(false) },
  { text: "几点了还不睡", date: "2024-10-03", photo: nightPhoto },
  { text: "裙子太短", date: "2024-06-17", photo: partyPhoto },
  { text: "头发剪了", date: "2024-03-02", photo: gradPhoto },
  { text: "一个人？", date: "2024-01-01", photo: nightPhoto },
  { text: "换手机号了", date: "2023-11-20", photo: partyPhoto },
  { text: "又熬夜", date: "2023-09-14", photo: snowPhoto },
  { text: "到学校了吗", date: "2023-09-01", photo: partyPhoto },
  { text: "瘦了", date: "2023-06-18", photo: gradPhoto },
  { text: "又不吃早饭", date: "2023-06-09", photo: gradPhoto },
  { text: "谁送你回来的", date: "2023-06-01", photo: partyPhoto },
  { text: "又换头像了", date: "2023-05-31", photo: gradPhoto },
];
export const ROW_A = HISTORY.findIndex(row => row.date === "2024-12-31");
export const ROW_B = HISTORY.findIndex(row => row.date === "2023-06-18");
const ROW_H = 150;
// The extra newest row moves the scroll distance equally; the landing row stays at y=500.
export const HISTORY_END = (HISTORY.length - 6) * ROW_H;
export function vidComments(c: Ctx, o: { scroll: number; time: string; marks?: [number, Guide][]; gone?: number; press?: number }) {
  c.fillStyle = VBG; c.fillRect(0, 0, SW, SH);
  c.save(); c.beginPath(); c.rect(0, 176, SW, 1050); c.clip();
  HISTORY.forEach(({ text: body, date, photo }, i) => {
    const y = 200 + i * ROW_H - o.scroll;
    if (y < 45 || y > SH + 40) return;
    c.save(); c.globalAlpha *= 1 - clamp(o.gone ?? 0);
    if (o.press && i === ROW_A) {
      c.fillStyle = "rgba(255,255,255," + (0.08 * o.press).toFixed(3) + ")";
      c.fillRect(0, y - 20, SW, ROW_H);
    }
    if (i < 2) {
      c.fillStyle = "rgba(254,44,85,0.045)"; c.fillRect(0, y - 14, SW, ROW_H);
      c.fillStyle = "#fe2c55"; c.beginPath(); c.arc(17, y + 43, 4, 0, Math.PI * 2); c.fill();
    }
    grayAvatar(c, 64, y + 46, 36);
    say(c, ACC_A, 122, y + 15, 25, { color: "#a9aab5" });
    say(c, body, 122, y + 66, 36, { weight: 700, rose: true });
    say(c, date, 122, y + 111, 23, { color: GREY });
    say(c, "回复", 454, y + 111, 21, { color: "#8b8c99", align: "right" });
    // Draw in the photos' normal design coordinates, scaling lines/flakes as well as geometry.
    c.save(); rr(c, 492, y + 7, 76, 104, 9); c.clip();
    c.translate(492, y + 7); c.scale(76 / 600, 104 / 800);
    photo(c, 0, 0, 600, 800); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1;
    rr(c, 492, y + 7, 76, 104, 9); c.stroke();
    c.fillStyle = VLINE; c.fillRect(122, y + 134, 446, 1);
    c.restore();
  });
  for (const [row, k] of o.marks ?? []) {
    const y = 200 + row * ROW_H - o.scroll;
    guideBox(c, 20, y - 6, SW - 150, ROW_H - 24, k);
  }
  const total = HISTORY.length * ROW_H + 60, view = 1050;
  const barH = Math.max(60, (view * view) / total);
  const barY = 176 + (o.scroll / Math.max(1, total - view)) * (view - barH);
  c.fillStyle = "rgba(255,255,255,0.28)"; rr(c, SW - 12, barY, 4, barH, 2); c.fill();
  const endY = 200 + HISTORY.length * ROW_H - o.scroll + 18;
  say(c, "没有更多消息了", SW / 2, endY, 21, { color: "#686a77", align: "center" });
  c.restore();
  c.fillStyle = VBG; c.fillRect(0, 0, SW, 176);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 37, 120, 28, "#eeeef3");
  say(c, "互动消息", 298, 113, 32, { weight: 700, align: "center" });
  say(c, "评论与回复", 298, 154, 18, { color: "#858794", align: "center" });
  socialIcon(c, "filter", 552, 120, 27, "#b9bac4");
  c.fillStyle = VLINE; c.fillRect(0, 175, SW, 1);
  socialHomeBar(c, { background: VBG });
}

/** The action rows clear the lyric band. The confirmation keeps its approved screen position. */
export const BLOCK_AT: [number, number] = [300, 746];
export function vidBlock(c: Ctx, o: { sheet: number; confirm: number; done: number; hot?: number }) {
  if (o.sheet > 0) {
    c.save();
    c.fillStyle = "rgba(0,0,0," + (0.5 * clamp(o.sheet)).toFixed(3) + ")"; c.fillRect(0, 0, SW, SH);
    const e = 1 - Math.pow(1 - clamp(o.sheet), 3), y = SH - 680 * e;
    c.fillStyle = "#24252d"; rr(c, 0, y, SW, 740, 32); c.fill();
    c.fillStyle = "#555660"; rr(c, 270, y + 15, 60, 5, 3); c.fill();
    say(c, ACC_A, SW / 2, y + 60, 25, { color: GREY, align: "center" });
    // Privacy actions are near the top; cancel remains in the bottom safe area.
    const actions: ["shield" | "filter", string, string, string][] = [
      ["shield", "拉黑", "不再接收对方的评论", "#fe2c55"],
      ["filter", "举报", "反馈不当内容", "#e4e4eb"],
    ];
    actions.forEach(([icon, label, hint, color], i) => {
      const rowY = y + 146 + i * 116;
      if (i === 0 && (o.hot ?? 0) > 0) {
        c.fillStyle = "rgba(254,44,85," + (0.18 * (o.hot ?? 0)).toFixed(3) + ")";
        c.fillRect(24, rowY - 40, SW - 48, 108);
      }
      socialIcon(c, icon, 67, rowY + 8, 32, color);
      say(c, label, 110, rowY, 36, { color, weight: 700 });
      say(c, hint, 110, rowY + 43, 22, { color: GREY });
      socialIcon(c, "chevron", 546, rowY + 10, 22, GREY);
      c.fillStyle = VLINE; c.fillRect(32, rowY + 73, SW - 64, 1);
    });
    c.fillStyle = "#1b1c24"; c.fillRect(0, y + 532, SW, 12);
    say(c, "取消", SW / 2, y + 585, 34, { weight: 700, align: "center" });
    socialHomeBar(c); c.restore();
  }
  if (o.confirm > 0 && o.done <= 0) {
    const k = clamp(o.confirm);
    c.save(); c.globalAlpha *= k;
    c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(0, 0, SW, SH);
    c.translate(SW / 2, 620); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
    c.fillStyle = "#2c2d36"; rr(c, -250, -156, 500, 312, 24); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.09)"; c.lineWidth = 1; c.stroke();
    say(c, "确定拉黑对方吗？", 0, -78, 35, { weight: 700, align: "center" });
    say(c, "拉黑后，对方将无法评论你", 0, -18, 25, { color: "#a6a7b2", align: "center" });
    c.fillStyle = VLINE; c.fillRect(-250, 50, 500, 1); c.fillRect(0, 50, 1, 106);
    say(c, "取消", -120, 100, 32, { color: "#ddd", align: "center" });
    say(c, "拉黑", 120, 100, 32, { color: "#fe2c55", weight: 700, align: "center" });
    c.restore();
  }
  if (o.done > 0) {
    const k = clamp(o.done);
    c.save(); c.globalAlpha *= Math.min(1, k * 3) * (1 - clamp((k - 0.8) / 0.2));
    c.fillStyle = "rgba(61,63,74,0.97)"; rr(c, SW / 2 - 130, 596, 260, 80, 18); c.fill();
    socialIcon(c, "check", 225, 636, 29, "#a2e7c1");
    say(c, "已拉黑", 326, 636, 32, { weight: 700, align: "center" });
    c.restore();
  }
}

/** The comment box at the bottom with the keyboard up (his phone: `big`). */
export function vidCommentBox(c: Ctx, draft: string, caret: boolean, big = false) {
  const y = big ? 700 : 780;
  c.fillStyle = "rgba(0,0,0,0.55)";
  c.fillRect(0, 0, SW, y);
  c.fillStyle = "#24252d";
  c.fillRect(0, y, SW, 120);
  c.fillStyle = "#33343d";
  rr(c, 24, y + 18, SW - 150, 84, 42);
  c.fill();
  const fs = big ? 48 : 34;
  const w = draft ? say(c, draft, 56, y + 60, fs, { rose: draft.endsWith("多穿点") }) : 0;
  if (!draft) say(c, "说点什么…", 56, y + 60, fs * 0.8, { color: GREY });
  if (caret) {
    c.fillStyle = "#fe2c55";
    c.fillRect(56 + w + 4, y + 60 - fs * 0.6, 4, fs * 1.2);
  }
  c.fillStyle = draft ? "#fe2c55" : "#55565f";
  rr(c, SW - 110, y + 26, 90, 68, 34);
  c.fill();
  say(c, "发送", SW - 65, y + 60, 26, { weight: 700, align: "center" });
  keyboard(c, y + 120, true, big);
}

// his handwriting input: he doesn't type, he writes each character with a finger on the pad
/** where things are on his handwriting keyboard when its input row starts at `top` (screen coordinates): the pad's
 *  character box (centre, size) and the delete key */
export function hwLayout(top = 700) {
  return { glyph: { x: 300, y: top + 346, size: 250 }, del: [527, top + 537] as Pt };
}
/** where his fingertip is while `k` (0..1) of a character is written: zig-zagging down the writing front the way
 *  strokes go, top left to bottom right */
export function hwFinger(k: number, top = 700): Pt {
  const { x, y, size } = hwLayout(top).glyph;
  const d = 2 * clamp(k);
  // a point on the front u + v = d inside the box, swinging along it like strokes
  const s = 0.5 + 0.48 * Math.sin(k * Math.PI * 9);
  const u0 = Math.max(0, d - 1),
    u1 = Math.min(1, d);
  const u = u0 + (u1 - u0) * s,
    v = d - u;
  return [x - size / 2 + u * size, y - size / 2 + v * size];
}
/** The comment box with his handwriting keyboard up: the draft in the box (his big font), the candidates for the
 *  character being written, the pad with `ink.ch` written in as far as `ink.k`, and 123 ， 空格 ⌫ under it. `inks`
 *  are several characters written over each other (连续叠写: the one before fades as the next goes on top), each with
 *  its own `alpha`. `top` is where the input row starts (his keyboard is set tall; 500 keeps the pad above the lyrics
 *  when the phone lies on the desk). */
export function vidHandwriting(c: Ctx, o: { draft: string; caret: boolean; ink?: { ch: string; k: number }; inks?: { ch: string; k: number; alpha: number }[]; cands?: string[]; top?: number }) {
  const y = o.top ?? 700;
  c.fillStyle = "#24252d";
  c.fillRect(0, y, SW, 120);
  c.fillStyle = "#33343d";
  rr(c, 24, y + 18, SW - 150, 84, 42);
  c.fill();
  const fs = 56;
  const w = o.draft ? say(c, o.draft, 56, y + 60, fs) : 0;
  if (!o.draft) say(c, "说点什么…", 56, y + 60, 40, { color: GREY });
  if (o.caret) {
    c.fillStyle = "#fe2c55";
    c.fillRect(56 + w + 4, y + 60 - fs * 0.6, 4, fs * 1.2);
  }
  c.fillStyle = o.draft ? "#fe2c55" : "#55565f";
  rr(c, SW - 110, y + 26, 90, 68, 34);
  c.fill();
  say(c, "发送", SW - 65, y + 60, 26, { weight: 700, align: "center" });
  // the keyboard: candidates, the pad, the bottom row
  const ky = y + 120;
  c.fillStyle = "#1f2026";
  c.fillRect(0, ky, SW, SH - ky);
  (o.cands ?? []).forEach((s, i) => say(c, s, 60 + i * 108, ky + 34, 38, { color: i === 0 ? "#fe2c55" : "#c9cad2", weight: i === 0 ? 700 : 400, align: "center" }));
  const { x: gx, y: gy, size } = hwLayout(y).glyph;
  c.fillStyle = "#2b2c34";
  rr(c, 16, ky + 72, SW - 32, 306, 18);
  c.fill();
  c.save();
  c.strokeStyle = "rgba(255,255,255,0.07)";
  c.lineWidth = 2;
  c.setLineDash([10, 10]);
  c.beginPath();
  c.moveTo(gx - size * 0.62, gy);
  c.lineTo(gx + size * 0.62, gy);
  c.moveTo(gx, gy - size * 0.55);
  c.lineTo(gx, gy + size * 0.55);
  c.stroke();
  c.restore();
  say(c, "手写", SW - 36, ky + 352, 24, { color: "#4a4b54", align: "right" });
  const inks = o.inks ?? (o.ink ? [{ ...o.ink, alpha: 1 }] : []);
  for (const ink of inks) {
    if (ink.k <= 0 || ink.alpha <= 0.01) continue;
    // written in from the top left to the bottom right, like a hand: clip to the front u + v < 2k
    const d = 2 * clamp(ink.k);
    const x0 = gx - size / 2 - 20,
      y0 = gy - size / 2 - 20,
      s = size + 40;
    c.save();
    c.globalAlpha *= clamp(ink.alpha);
    c.beginPath();
    if (d <= 1) {
      c.moveTo(x0, y0);
      c.lineTo(x0 + d * s, y0);
      c.lineTo(x0, y0 + d * s);
    } else {
      c.moveTo(x0, y0);
      c.lineTo(x0 + s, y0);
      c.lineTo(x0 + s, y0 + (d - 1) * s);
      c.lineTo(x0 + (d - 1) * s, y0 + s);
      c.lineTo(x0, y0 + s);
    }
    c.closePath();
    c.clip();
    text(c, ink.ch, gx, gy + 8, { size: size * 1.1, font: F.pen, fill: "#f1f1f4" });
    c.restore();
  }
  const kb = ky + 380;
  ([["123", 16, 108], ["，", 132, 108], ["空格", 248, 212], ["⌫", 468, 116]] as [string, number, number][]).forEach(([label, x, kw]) => {
    c.fillStyle = label === "⌫" ? "#55565f" : "#3a3b42";
    rr(c, x, kb, kw, 74, 12);
    c.fill();
    text(c, label, x + kw / 2, kb + 37, { size: label === "⌫" ? 40 : 30, font: F.ui, fill: "#eee" });
  });
}

// ---------------------------------------------------------------- WeChat (light)
const WBG = "#ededed";

/** A contact's page laid out like WeChat's: the header (square avatar, the remark name, 昵称, 微信号, 地区), then
 *  备注和标签 / 朋友权限, the 朋友圈 row, 更多信息, and 发消息 / 音视频通话. In the 朋友圈 row, `blocked` shows a line
 *  (she hid her Moments from him), `empty` nothing at all, otherwise thumbnails (`open` 0..1 fades them in over the
 *  line). `tap` pulses round the whole 朋友圈 row (at MOMENTS_ROW); `perm` pulses round 朋友权限 (at PERM_ROW). */
export const MOMENTS_ROW: [number, number] = [300, 733];
export const PERM_ROW: [number, number] = [300, 587];
export function wxContact(c: Ctx, o: { time: string; name: string; who: "her" | "dad"; blocked: boolean; open?: number; big?: boolean; tap?: Guide; perm?: number; empty?: boolean }) {
  const big = o.big ? 1.3 : 1;
  const her = o.who === "her";
  c.fillStyle = WBG;
  c.fillRect(0, 0, SW, SH);
  // the header
  c.fillStyle = "#fff";
  c.fillRect(0, 0, SW, 420);
  statusBar(c, { time: o.time, airplane: false, battery: 0.4, dark: true });
  socialIcon(c, "back", 44, 122, 34, "#111");
  socialIcon(c, "more", SW - 48, 122, 34, "#111");
  c.save();
  rr(c, 52, 206, 136, 136, 18);
  c.clip();
  c.fillStyle = "#e6e2da";
  c.fillRect(52, 206, 136, 136);
  if (her) avatar(c, 120, 274, "girl", 161);
  else dadAvatar(c, 120, 274, 136);
  c.restore();
  c.strokeStyle = "rgba(0,0,0,0.08)";
  c.lineWidth = 2;
  rr(c, 52, 206, 136, 136, 18);
  c.stroke();
  say(c, o.name, 220, 232, 44 * big, { color: "#111", weight: 700 });
  say(c, `昵称：${her ? "小满" : "老陈"}`, 220, 296, 22 * big, { color: "#888" });
  say(c, `微信号：${her ? "xiaoman_0618" : "chen_1971"}`, 220, 336, 22 * big, { color: "#888" });
  say(c, `地区：${her ? "上海 徐汇" : "江苏 盐城"}`, 220, 376, 22 * big, { color: "#888" });
  // a white row with its label, an arrow at the right, and a hairline under it
  const row = (y: number, h: number, label: string, line = true) => {
    c.fillStyle = "#fff";
    c.fillRect(0, y, SW, h);
    say(c, label, 40, y + h / 2, 30 * big, { color: "#111" });
    socialIcon(c, "chevron", SW - 40, y + h / 2, 30, "#b2b2b2");
    if (line) {
      c.fillStyle = "#e5e5e5";
      c.fillRect(40, y + h - 1.5, SW - 40, 1.5);
    }
  };
  row(436, 100, "备注和标签");
  row(536, 101, "朋友权限", false);
  if (o.perm !== undefined) pulseBox(c, 16, 544, SW - 32, 86, o.perm);
  // 朋友圈: the label, her latest pictures (or a line, or nothing at all), the arrow
  const my = MOMENTS_ROW[1];
  row(653, 160, "朋友圈");
  const open = clamp(o.open ?? 0);
  if (o.blocked && open < 1 && !o.empty) {
    // the line (blocked)
    c.save();
    c.globalAlpha *= 1 - open;
    c.strokeStyle = "#c4c4c4";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(220, my);
    c.lineTo(SW - 80, my);
    c.stroke();
    c.restore();
  }
  if (!o.blocked || open > 0) {
    c.save();
    c.globalAlpha *= o.blocked ? open : 1;
    [snowPhoto, couplePhoto(false), gradPhoto].forEach((p, i) => {
      c.save();
      rr(c, 200 + i * 116, my - 53, 106, 106, 6);
      c.clip();
      p(c, 200 + i * 116, my - 53, 106, 106);
      c.restore();
    });
    c.restore();
  }
  if (o.tap !== undefined) guideBox(c, 16, 663, SW - 32, 140, o.tap);
  row(814, 100, "更多信息", false);
  // 发消息 / 音视频通话
  c.fillStyle = "#fff";
  c.fillRect(0, 930, SW, 216);
  c.fillStyle = "#e5e5e5";
  c.fillRect(0, 1037, SW, 1.5);
  const w1 = say(c, "发消息", SW / 2 + 22, 984, 30 * big, { color: "#576b95", weight: 700, align: "center" });
  bubbleIcon(c, SW / 2 - w1 / 2 - 14, 984, 34, "#576b95");
  const w2 = say(c, "音视频通话", SW / 2 + 22, 1092, 30 * big, { color: "#576b95", weight: 700, align: "center" });
  // a little video camera
  const vx = SW / 2 - w2 / 2 - 34,
    vy = 1092;
  c.strokeStyle = "#576b95";
  c.lineWidth = 3.5;
  c.lineJoin = "round";
  rr(c, vx - 14, vy - 12, 28, 24, 5);
  c.stroke();
  c.beginPath();
  c.moveTo(vx + 16, vy - 4);
  c.lineTo(vx + 26, vy - 10);
  c.lineTo(vx + 26, vy + 10);
  c.lineTo(vx + 16, vy + 4);
  c.closePath();
  c.stroke();
}

/** Her Moments post three years ago: the party photo and his comment 「多穿点🌹」 (the memory). */
export const MOMENT_COMMENT_Y = 1030;
export function wxMoment(c: Ctx, o: { mark?: number } = {}) {
  c.fillStyle = "#fff";
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: "21:16", airplane: false, battery: 0.8, dark: true });
  say(c, "朋友圈", SW / 2, 120, 32, { color: "#111", weight: 700, align: "center" });
  herAvatar(c, 70, 230, 40);
  say(c, HER, 130, 206, 30, { color: "#576b95", weight: 700 });
  say(c, "第一次一个人过冬！也太好玩啦", 130, 256, 28, { color: "#111" });
  partyPhoto(c, 130, 296, 400, 400);
  say(c, "2023年12月9日 21:15", 130, 736, 24, { color: "#999" });
  c.fillStyle = "#f3f3f5";
  rr(c, 130, 780, SW - 170, 330, 10);
  c.fill();
  heartIcon(c, 160, 830, 26, "#576b95");
  say(c, "阿琪, 小雅, 班长", 184, 830, 26, { color: "#576b95" });
  c.fillStyle = "#e3e3e6";
  c.fillRect(130, 870, SW - 170, 2);
  say(c, "阿琪：好看！！", 150, 920, 28, { color: "#111" });
  say(c, "小雅：明天还去", 150, 970, 28, { color: "#111" });
  const w = say(c, `${SHE_CALLS_DAD}：`, 150, MOMENT_COMMENT_Y, 40, { color: "#576b95", weight: 700 });
  say(c, "多穿点", 150 + w, MOMENT_COMMENT_Y, 40, { color: "#111", weight: 700, rose: true });
  pulseBox(c, 140, MOMENT_COMMENT_Y - 40, 360, 80, o.mark ?? 0);
}

/** 「朋友圈和状态」 permissions for 爸爸: 「不让他（她）看」 is the switch. `on` 0..1. */
export function wxPermission(c: Ctx, on: number, o: { time: string; press?: number }) {
  c.fillStyle = WBG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.4, dark: true });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#111" });
  say(c, "朋友圈和状态", SW / 2, 120, 32, { color: "#111", weight: 700, align: "center" });
  c.fillStyle = "#fff";
  c.fillRect(0, 230, SW, 130);
  dadAvatar(c, 80, 295, 80);
  say(c, SHE_CALLS_DAD, 140, 295, 36, { color: "#111", weight: 700 });
  c.fillStyle = "#fff";
  c.fillRect(0, 400, SW, 240);
  say(c, "不让他（她）看", 40, 470, 34, { color: "#111" });
  say(c, "不看他（她）", 40, 590, 34, { color: "#111" });
  c.fillStyle = "#e6e6e6";
  c.fillRect(40, 530, SW - 40, 2);
  toggle(c, SW - 120, 470, on, o.press ?? 0);
  toggle(c, SW - 120, 590, 0, 0);
}
export const TOGGLE_AT: [number, number] = [SW - 120, 470];
function toggle(c: Ctx, x: number, y: number, on: number, press: number) {
  const k = clamp(on);
  c.save();
  const col = k > 0.5 ? "#07c160" : "#e2e2e2";
  c.fillStyle = col;
  rr(c, x - 50, y - 30, 100, 60, 30);
  c.fill();
  c.fillStyle = "#fff";
  c.shadowColor = "rgba(0,0,0,0.25)";
  c.shadowBlur = 6;
  c.beginPath();
  c.arc(x - 20 + 40 * k, y, 26 + 2 * press, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** A chat with dad (her phone) or with her (his phone, `big`). */
export function wxChat(c: Ctx, o: { time: string; title: string; mine: "her" | "dad"; items: { me?: boolean; text: string; rose?: boolean; pop?: number }[]; draft?: string; caret?: boolean; keyboard?: boolean; big?: boolean; sendHot?: number }) {
  const big = o.big ? 1.3 : 1;
  c.fillStyle = WBG;
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = "#ededed";
  c.fillRect(0, 0, SW, 170);
  statusBar(c, { time: o.time, airplane: false, battery: 0.4, dark: true });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#111" });
  say(c, o.title, SW / 2, 120, 34 * big, { color: "#111", weight: 700, align: "center" });
  c.fillStyle = "#dcdcdc";
  c.fillRect(0, 168, SW, 2);
  const kb = o.keyboard ? 470 : 0;
  let y = 250;
  for (const it of o.items) {
    const pop = clamp(it.pop ?? 1);
    if (pop <= 0) continue;
    const fs = 34 * big;
    const tw = measure(c, it.text, fs, F.ui) + (it.rose ? fs * 1.05 : 0);
    const bw = tw + 48,
      bh = fs + 44;
    c.save();
    c.globalAlpha *= pop;
    if (it.me) {
      const x = SW - 110 - bw;
      if (o.mine === "her") herAvatar(c, SW - 60, y + bh / 2, 34);
      else dadAvatar(c, SW - 60, y + bh / 2, 68);
      c.fillStyle = "#95ec69";
      rr(c, x, y, bw, bh, 12);
      c.fill();
      say(c, it.text, x + 24, y + bh / 2, fs, { color: "#111", rose: it.rose });
    } else {
      if (o.mine === "her") dadAvatar(c, 60, y + bh / 2, 68);
      else herAvatar(c, 60, y + bh / 2, 34);
      c.fillStyle = "#fff";
      rr(c, 110, y, bw, bh, 12);
      c.fill();
      say(c, it.text, 134, y + bh / 2, fs, { color: "#111", rose: it.rose });
    }
    c.restore();
    y += bh + 40;
  }
  // input bar
  const iy = SH - kb - 130;
  c.fillStyle = "#f7f7f7";
  c.fillRect(0, iy, SW, 130 + kb);
  c.fillStyle = "#fff";
  rr(c, 30, iy + 22, SW - 190, 86, 12);
  c.fill();
  const dw = o.draft ? say(c, o.draft, 50, iy + 65, 32 * big, { color: "#111" }) : 0;
  if (o.caret) {
    c.fillStyle = "#07c160";
    c.fillRect(52 + dw, iy + 45, 3, 42);
  }
  c.fillStyle = o.draft ? "#07c160" : "#d8d8d8";
  rr(c, SW - 145, iy + 30, 115, 70, 12);
  c.fill();
  if ((o.sendHot ?? 0) > 0) {
    c.fillStyle = `rgba(0,0,0,${(0.2 * (o.sendHot ?? 0)).toFixed(3)})`;
    rr(c, SW - 145, iy + 30, 115, 70, 12);
    c.fill();
  }
  say(c, "发送", SW - 87, iy + 65, 30, { color: "#fff", weight: 700, align: "center" });
  if (o.keyboard) keyboard(c, SH - kb, false);
}
export const SEND_AT: [number, number] = [SW - 87, SH - 470 - 130 + 65];

/** An iOS-style WeChat banner (on his phone: `big`). `k` 0..1 = dropped in. */
export function wxBanner(c: Ctx, k: number, title: string, body: string, big = false) {
  if (k <= 0) return;
  const e = 1 - Math.pow(1 - clamp(k), 3);
  const f = big ? 1.3 : 1;
  const h = 150 * f;
  const y = -h + (70 + h) * e;
  c.save();
  c.shadowColor = "rgba(0,0,0,0.35)";
  c.shadowBlur = 24;
  c.fillStyle = "rgba(246,246,248,0.97)";
  rr(c, 18, y, SW - 36, h, 32);
  c.fill();
  c.shadowColor = "transparent";
  c.fillStyle = "#07c160";
  rr(c, 40, y + h / 2 - 34 * f, 68 * f, 68 * f, 16);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.ellipse(40 + 34 * f, y + h / 2, 22 * f, 18 * f, 0, 0, Math.PI * 2);
  c.fill();
  say(c, title, 130 * f, y + h * 0.33, 30 * f, { color: "#111", weight: 700 });
  say(c, "现在", SW - 44, y + h * 0.33, 22 * f, { color: "#888", align: "right" });
  say(c, body, 130 * f, y + h * 0.7, 32 * f, { color: "#222" });
  c.restore();
}

// ---------------------------------------------------------------- his lock screen
/** His lock screen (old-people mode: a huge clock) over the wallpaper photo, with a small padlock over the clock and
 *  the home bar at the bottom. */
export function dadLock(c: Ctx, o: { time: string; date: string }) {
  wallpaperPhoto(c, 0, 0, SW, SH);
  c.fillStyle = "rgba(0,0,0,0.12)";
  c.fillRect(0, 0, SW, SH);
  dadLockText(c, o);
}
/** The lock screen's own layer (the wallpaper is under it): padlock, clock, date and home bar. Unlocking: `open` 0..1
 *  the padlock's shackle springs open (Face ID knows him); `lift` 0..1 the swipe — the clock and date ride up after
 *  his thumb and fade, the home bar goes with them. */
export function dadLockText(c: Ctx, o: { time: string; date: string; open?: number; lift?: number }) {
  const open = clamp(o.open ?? 0),
    lift = clamp(o.lift ?? 0);
  const a = 1 - clamp(lift / 0.75);
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  // the clock moves up a little faster than it fades, shrinking a touch, like iOS
  const dy = -260 * lift;
  c.translate(SW / 2, 250 + dy);
  c.scale(1 - 0.08 * lift, 1 - 0.08 * lift);
  c.translate(-SW / 2, -250);
  // the padlock: a little shadowed white lock; its shackle lifts and swings open
  c.save();
  c.translate(SW / 2, 140);
  c.shadowColor = "rgba(0,0,0,0.35)";
  c.shadowBlur = 8;
  c.fillStyle = "#fff";
  rr(c, -15, -4, 30, 24, 6);
  c.fill();
  c.strokeStyle = "#fff";
  c.lineWidth = 5;
  c.lineCap = "round";
  c.beginPath();
  const up = 7 * open;
  c.translate(9, 0);
  c.rotate(0.55 * open);
  c.translate(-9, 0);
  c.moveTo(-9, -4 - up);
  c.lineTo(-9, -12 - up);
  c.arc(0, -12 - up, 9, Math.PI, 0);
  c.lineTo(9, -4 - up);
  c.stroke();
  c.restore();
  text(c, o.time, SW / 2, 250, { size: 150, font: F.ui, weight: 700, fill: "#fff", shadow: 10 });
  text(c, o.date, SW / 2, 360, { size: 40, font: F.ui, weight: 700, fill: "#fff", shadow: 8 });
  c.restore();
  // the home bar stays at the bottom, fading out as the home screen comes up
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = "rgba(255,255,255,0.9)";
  rr(c, SW / 2 - 70, SH - 26 - 40 * lift, 140, 8, 4);
  c.fill();
  c.restore();
}

/** 「囡囡」's Moments page as he sees it: her cover and name, and under them only a grey line — she hid her Moments
 *  from him. `line` 0..1 draws the line in (it lands on a high note); `big` = his font. */
export function wxMomentsBlocked(c: Ctx, o: { time: string; name: string; line: number; big?: boolean }) {
  const big = o.big ? 1.3 : 1;
  c.fillStyle = "#fff";
  c.fillRect(0, 0, SW, SH);
  const g = c.createLinearGradient(0, 0, 0, 520);
  g.addColorStop(0, "#a9b6c9");
  g.addColorStop(1, "#7d8ba3");
  c.fillStyle = g;
  c.fillRect(0, 0, SW, 520);
  statusBar(c, { time: o.time, airplane: false, battery: 0.4 });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  say(c, o.name, SW - 170, 500, 36 * big, { weight: 700, align: "right", color: "#fff" });
  herAvatar(c, SW - 90, 520, 60);
  const k = clamp(o.line);
  if (k > 0) {
    const y = 760;
    c.save();
    c.strokeStyle = "#b9b9b9";
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(SW / 2 - 210 * k, y);
    c.lineTo(SW / 2 - 18, y);
    c.moveTo(SW / 2 + 18, y);
    c.lineTo(SW / 2 + 210 * k, y);
    c.stroke();
    c.fillStyle = "#b9b9b9";
    c.beginPath();
    c.arc(SW / 2, y, 10, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
