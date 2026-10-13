// 《屏蔽》的手机界面（600×1280 屏幕坐标，和素材库 phone() 一样）：短视频 App（深色）的动态、评论通知、陌生号主页、
// 关注列表、互动消息、拉黑；微信（浅色）的资料页（朋友圈被屏蔽时只有一条横线）、朋友圈、权限开关、对话框、横幅；
// 爸爸手机的锁屏（壁纸是他扛着小时候的她）。爸爸的手机字号调到最大（big）、贴膜有裂痕（crackedGlass）。
import { clamp } from "@frame/engine/math";
import { C, Ctx, F, blob, hash, inkLine, measure, oval, paint, poly, rr, text } from "@materials/s0rrow/code/draw";
import { SH, SW, statusBar } from "@materials/s0rrow/code/phone";
import { avatar } from "@materials/s0rrow/code/chat";
import { drawKid } from "@materials/s0rrow/code/kid";
import { drawPerson } from "@materials/s0rrow/code/people";

export { SH, SW };

// ---------------------------------------------------------------- names and lines
export const HER = "小满";
export const DAD_CALLS_HER = "囡囡";
export const SHE_CALLS_DAD = "爸爸";
export const ACC_A = "用户8274615";
export const ACC_B = "用户3391027";

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

/** 「下雪了」: the snow outside her window at night (her post). */
export const snowPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#151b3a");
    g.addColorStop(1, "#3a3564");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    // the block opposite, lit windows
    c.fillStyle = "#1d2244";
    c.fillRect(x + w * 0.08, y + h * 0.38, w * 0.5, h * 0.7);
    c.fillRect(x + w * 0.62, y + h * 0.5, w * 0.34, h * 0.6);
    for (let i = 0; i < 18; i++) {
      const cx = x + w * (0.12 + (i % 5) * 0.09),
        cy = y + h * (0.43 + Math.floor(i / 5) * 0.1);
      if (hash(i * 3.3) > 0.45) {
        c.fillStyle = "rgba(255,206,130,0.85)";
        c.fillRect(cx, cy, w * 0.05, h * 0.05);
      }
    }
    // a street lamp and its cone
    const lx = x + w * 0.78,
      ly = y + h * 0.42;
    const lg = c.createRadialGradient(lx, ly, 0, lx, ly, w * 0.45);
    lg.addColorStop(0, "rgba(255,200,120,0.55)");
    lg.addColorStop(1, "rgba(255,200,120,0)");
    c.fillStyle = lg;
    c.fillRect(x, y, w, h);
    c.fillStyle = "#ffe2a6";
    c.beginPath();
    c.arc(lx, ly, 7, 0, Math.PI * 2);
    c.fill();
    // flakes (still: a photo)
    c.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 70; i++) {
      c.beginPath();
      c.arc(x + hash(i * 7.7) * w, y + hash(i * 3.1) * h, 1.5 + hash(i * 1.3) * 3.5, 0, Math.PI * 2);
      c.fill();
    }
    // the window frame in the corner
    c.fillStyle = "#e9e2d6";
    c.fillRect(x, y, w * 0.05, h);
    c.fillRect(x, y + h * 0.95, w, h * 0.05);
  });

/** Her and her boyfriend in a café: arm round her (photo 1), or kissing her cheek (photo 2). */
export function couplePhoto(kiss: boolean): Photo {
  return (c, x, y, w, h) =>
    clipRect(c, x, y, w, h, () => {
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, "#f3c98b");
      g.addColorStop(1, "#c98a5e");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
      // café lights behind
      for (let i = 0; i < 7; i++) {
        const bx = x + w * (0.1 + i * 0.14),
          by = y + h * (0.12 + (i % 2) * 0.06);
        const bg = c.createRadialGradient(bx, by, 0, bx, by, w * 0.08);
        bg.addColorStop(0, "rgba(255,245,210,0.9)");
        bg.addColorStop(1, "rgba(255,245,210,0)");
        c.fillStyle = bg;
        c.fillRect(bx - w * 0.08, by - w * 0.08, w * 0.16, w * 0.16);
      }
      const s = w / 600;
      if (!kiss) {
        drawPerson(c, x + w * 0.66, y + h * 0.42, 0.95 * s, { x: 0, hair: "short", hairColor: "#1e1a18", top: "#7fa7c9", face: "smile", body: "bust", turn: -0.2, seed: 821, arms: "down" });
        drawKid(c, x + w * 0.36, y + h * 0.47, 0.82 * s, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "grin", tilt: 0.12, blush: 0.5, seed: 822 });
        // his arm round her shoulders
        c.save();
        c.translate(x, y);
        c.scale(s, s);
        blob(c, [[420, 470], [330, 500], [190, 520], [150, 560], [200, 580], [340, 548], [430, 520]], 823, 1.2);
        paint(c, "#7fa7c9", C.ink, 5);
        oval(c, 160, 556, 30, 26, 824, 1);
        paint(c, C.skin, C.ink, 4.5);
        c.restore();
      } else {
        drawKid(c, x + w * 0.4, y + h * 0.48, 0.86 * s, { who: "girl", outfit: "cardigan", body: "bust", eyes: "shut", mouth: "grin", tilt: -0.1, blush: 0.9, seed: 832 });
        drawPerson(c, x + w * 0.68, y + h * 0.4, 0.95 * s, { x: 0, hair: "short", hairColor: "#1e1a18", top: "#7fa7c9", face: "smile", body: "bust", turn: -0.9, tilt: -0.25, seed: 831, arms: "down" });
        // a little heart
        c.save();
        c.translate(x + w * 0.56, y + h * 0.2);
        c.scale(s, s);
        blob(c, [[0, 12], [-22, -6], [-30, -2], [-30, 14], [0, 40], [30, 14], [30, -2], [22, -6]], 833, 0.8);
        paint(c, "#ff5d7e", C.ink, 4);
        c.restore();
      }
    });
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

/** The party photo she posted in her first winter away (the memory). */
export const partyPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#5a2d82");
    g.addColorStop(1, "#c2457a");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    for (let i = 0; i < 9; i++) {
      const bx = x + hash(i * 3.7) * w,
        by = y + hash(i * 1.9) * h * 0.5;
      const bg = c.createRadialGradient(bx, by, 0, bx, by, w * 0.1);
      bg.addColorStop(0, ["rgba(255,220,120,0.8)", "rgba(120,220,255,0.7)", "rgba(255,140,200,0.7)"][i % 3]);
      bg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = bg;
      c.fillRect(bx - w * 0.1, by - w * 0.1, w * 0.2, w * 0.2);
    }
    const s = w / 600;
    drawPerson(c, x + w * 0.2, y + h * 0.5, 0.75 * s, { x: 0, hair: "long", hairColor: "#3a2414", top: "#f2c94c", face: "laugh", body: "bust", seed: 861 });
    drawPerson(c, x + w * 0.8, y + h * 0.5, 0.75 * s, { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", face: "smile", body: "bust", seed: 862 });
    drawKid(c, x + w * 0.5, y + h * 0.5, 0.86 * s, { who: "girl", outfit: "uniform", body: "bust", eyes: "happy", mouth: "grin", tilt: 0.08, seed: 863 });
  });

/** His lock-screen wallpaper: young him with little her on his shoulders, a sunny day in the park. His face sits at
 *  (FACE_X, FACE_Y) of the photo (0..1), so his reflection can melt into it. */
export const WALL_FACE: [number, number] = [0.5, 0.6];
export const wallpaperPhoto: Photo = (c, x, y, w, h) =>
  clipRect(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#8fd0f5");
    g.addColorStop(0.6, "#d9f0ff");
    g.addColorStop(1, "#8ccf7e");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.fillStyle = "#7cc06a";
    c.beginPath();
    c.ellipse(x + w * 0.5, y + h * 1.02, w * 0.9, h * 0.25, 0, 0, Math.PI * 2);
    c.fill();
    const s = w / 600;
    const fx = x + w * WALL_FACE[0],
      fy = y + h * WALL_FACE[1];
    drawPerson(c, fx, fy, 1.3 * s, { x: 0, hair: "short", hairColor: "#1b1715", top: "#f4f2ea", face: "laugh", body: "bust", seed: 871, arms: "up" });
    drawKid(c, fx, fy - 250 * s, 0.7 * s, { who: "girl", outfit: "pajamas", body: "bust", eyes: "happy", mouth: "laugh", blush: 0.6, arms: "up", seed: 872 });
  });

// ---------------------------------------------------------------- the short-video app (dark)
const VBG = "#14151d";
const GREY = "#8b8c94";

/** where the first comment's text sits on a post page with the comment area (screen units, its left edge and middle) */
export const firstCommentAt = (big = false): [number, number] => [104, 620 + 180 + 46 * (big ? 1.3 : 1)];

/** Her post: author row, photo, caption and time, counts; with `showComments` (or comments given) the photo is
 *  shorter and the comment area shows under it (each comment can `pop` in; `mark` pulses the first one). `big` = his
 *  font. */
export function vidPost(c: Ctx, o: { time: string; photo: Photo; caption: string; ago: string; author?: string; big?: boolean; likes?: number; count?: number; showComments?: boolean; mark?: number; photoH?: number; comments?: { name: string; text: string; rose?: boolean; ago?: string; pop?: number; gray?: boolean }[]; photoZoom?: { k: number; fx: number; fy: number } }) {
  const big = o.big ? 1.3 : 1;
  const compact = o.showComments || !!o.comments?.length;
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.42 });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  herAvatar(c, 110, 120, 30);
  say(c, o.author ?? HER, 156, 120, 30 * big, { weight: 700 });
  // the photo (with an optional pinch zoom about a point of it); shorter when the comments show under it
  const px = 0,
    py = 170,
    pw = SW,
    ph = o.photoH ?? (compact ? 400 : 640);
  c.save();
  c.beginPath();
  c.rect(px, py, pw, ph);
  c.clip();
  if (o.photoZoom && o.photoZoom.k > 1.001) {
    const { k, fx, fy } = o.photoZoom;
    const cx = px + pw * fx,
      cy = py + ph * fy;
    c.translate(px + pw / 2, py + ph / 2);
    c.scale(k, k);
    c.translate(-cx, -cy);
  }
  o.photo(c, px, py, pw, ph);
  c.restore();
  const shown = (o.comments ?? []).filter((cm) => (cm.pop ?? 1) > 0);
  const ty = py + ph + 50;
  say(c, o.caption, 36, ty, 38 * big, { weight: 700 });
  say(c, o.ago, 36, ty + 52, 26 * big, { color: GREY });
  // like / comment counts
  heartIcon(c, SW - 230, ty + 52, 26 * big, GREY);
  say(c, String(o.likes ?? 23), SW - 208, ty + 52, 26 * big, { color: GREY });
  bubbleIcon(c, SW - 130, ty + 52, 26 * big, GREY);
  say(c, String(o.count ?? (compact ? shown.length : 6)), SW - 108, ty + 52, 26 * big, { color: GREY });
  c.fillStyle = "rgba(255,255,255,0.08)";
  c.fillRect(0, ty + 90, SW, 2);
  if (!compact) return;
  say(c, `评论 ${o.count ?? shown.length}`, 36, ty + 128, 26 * big, { color: "#c9cad1", weight: 700 });
  let cy = ty + 180;
  if (!shown.length) say(c, "还没有评论，快来抢沙发～", SW / 2, cy + 40, 26 * big, { color: GREY, align: "center" });
  (o.comments ?? []).forEach((cm, i) => {
    const k = clamp(cm.pop ?? 1);
    if (k <= 0) return;
    const e = 1 - Math.pow(1 - k, 3);
    c.save();
    c.globalAlpha *= e;
    c.translate(-36 * (1 - e), 0);
    if (i === 0 && (o.mark ?? 0) > 0) pulseBox(c, 24, cy - 26, SW - 48, 132 * big, o.mark ?? 0);
    grayAvatar(c, 58, cy + 34 * big, 30 * big);
    say(c, cm.name, 104, cy, 24 * big, { color: GREY });
    say(c, cm.text, 104, cy + 46 * big, 36 * big, { weight: 700, rose: cm.rose });
    say(c, cm.ago ?? "刚刚", 104, cy + 92 * big, 22 * big, { color: GREY });
    c.restore();
    cy += 140 * big;
  });
}

/** Posting: the compose page with her photo and caption; `press` 0..1 lights the 「发布」 button. The button sits at
 *  POST_BTN (screen units). */
export const POST_BTN: [number, number] = [SW / 2, 1120];
export function vidCompose(c: Ctx, o: { time: string; photo: Photo; caption: string; caret?: boolean; press?: number }) {
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.42 });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  say(c, "发日常", SW / 2, 120, 34, { weight: 700, align: "center" });
  // caption with a caret
  const w = say(c, o.caption, 40, 240, 44, { weight: 700 });
  if (o.caret) {
    c.fillStyle = "#fe2c55";
    c.fillRect(46 + w, 214, 4, 52);
  }
  // the photo
  c.save();
  rr(c, 40, 310, 360, 480, 18);
  c.clip();
  o.photo(c, 40, 310, 360, 480);
  c.restore();
  say(c, "# 下雪", 40, 850, 28, { color: "#8fb3ff" });
  say(c, "公开 · 所有人可见", 40, 930, 26, { color: GREY });
  // 发布
  const k = clamp(o.press ?? 0);
  c.fillStyle = k > 0 ? "#d81e44" : "#fe2c55";
  rr(c, 40, POST_BTN[1] - 48, SW - 80, 96, 48);
  c.fill();
  say(c, "发布", POST_BTN[0], POST_BTN[1], 38, { weight: 700, align: "center" });
}

/** The in-app banner that drops in at the top: "<name> 评论了你：<body>". `k` 0..1 = slid in. */
export function vidBanner(c: Ctx, k: number, o: { name: string; body: string; rose?: boolean; big?: boolean; reply?: boolean }) {
  if (k <= 0) return;
  const e = 1 - Math.pow(1 - clamp(k), 3);
  const big = o.big ? 1.25 : 1;
  const h = 172 * big;
  const y = -h + (84 + h) * e;
  c.save();
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = 24;
  c.fillStyle = "rgba(44,45,54,0.97)";
  rr(c, 18, y, SW - 36, h, 30);
  c.fill();
  c.shadowColor = "transparent";
  if (o.reply) herAvatar(c, 82, y + h / 2, 40 * big);
  else grayAvatar(c, 82, y + h / 2, 40 * big);
  say(c, `${o.name} ${o.reply ? "回复了你" : "评论了你"}`, 140, y + 50 * big, 27 * big, { color: "#c9cad1" });
  say(c, o.body, 140, y + 112 * big, 44 * big, { weight: 700, rose: o.rose });
  c.restore();
}

/** The stranger's profile page. `pulse` marks 「关注 1」. */
/** `menu` 0..1 highlights 「···」 (block from there); `blocked` shows the 「已拉黑」 state. MENU_AT = 「···」. */
export const MENU_AT: [number, number] = [SW - 64, 116];
export function vidProfile(c: Ctx, o: { name: string; pulse?: number; time: string; menu?: number; blocked?: number }) {
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  const g = c.createLinearGradient(0, 0, 0, 380);
  g.addColorStop(0, "#3a3b45");
  g.addColorStop(1, VBG);
  c.fillStyle = g;
  c.fillRect(0, 0, SW, 380);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  text(c, "···", SW - 64, 112, { size: 44, font: F.ui, weight: 700, fill: "#fff" });
  if ((o.menu ?? 0) > 0) {
    c.fillStyle = `rgba(255,255,255,${(0.18 * (o.menu ?? 0)).toFixed(3)})`;
    c.beginPath();
    c.arc(MENU_AT[0], MENU_AT[1], 40, 0, Math.PI * 2);
    c.fill();
  }
  grayAvatar(c, 120, 300, 84);
  say(c, o.name, 230, 270, 40, { weight: 700 });
  say(c, "没有简介", 230, 324, 26, { color: GREY });
  // stats
  const stats: [string, string][] = [["0", "获赞"], ["1", "关注"], ["0", "粉丝"]];
  stats.forEach(([n, l], i) => {
    const x = 70 + i * 170;
    say(c, n, x, 450, 44, { weight: 700 });
    say(c, l, x + measure(c, n, 44, F.ui, 700) + 10, 454, 28, { color: GREY });
  });
  pulseBox(c, 228, 420, 132, 64, o.pulse ?? 0);
  c.fillStyle = "rgba(255,255,255,0.1)";
  c.fillRect(0, 520, SW, 2);
  say(c, "作品 0", 60, 570, 30, { weight: 700 });
  c.fillStyle = "#fff";
  c.fillRect(60, 596, 96, 5);
  say(c, "TA 还没有发布过作品", SW / 2, 820, 30, { color: GREY, align: "center" });
  const b = clamp(o.blocked ?? 0);
  if (b > 0) {
    c.save();
    c.globalAlpha *= b;
    c.fillStyle = "#33343d";
    rr(c, 40, 640, SW - 80, 84, 14);
    c.fill();
    say(c, "已拉黑", SW / 2, 682, 32, { color: "#c9cad1", weight: 700, align: "center" });
    c.restore();
  }
}

/** Whom the stranger follows: only her. */
export function vidFollowing(c: Ctx, o: { pulse?: number; time: string }) {
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#fff" });
  say(c, "TA 的关注（1）", SW / 2, 120, 34, { weight: 700, align: "center" });
  herAvatar(c, 90, 260, 50);
  say(c, HER, 166, 240, 36, { weight: 700 });
  c.fillStyle = "#fe2c55";
  rr(c, 166 + measure(c, HER, 36, F.ui, 700) + 14, 222, 52, 36, 8);
  c.fill();
  say(c, "我", 166 + measure(c, HER, 36, F.ui, 700) + 40, 240, 24, { weight: 700, align: "center" });
  say(c, "今天也要开心呀", 166, 288, 26, { color: GREY });
  pulseBox(c, 30, 196, SW - 60, 130, o.pulse ?? 0);
}

/** Her "comments" inbox: rows of the same grey avatar, three years deep (newest first). `scroll` in px; `gone` 0..1
 *  fades the rows out. ROW_A / ROW_B are rows the camera can stop on; HISTORY_END is the scroll that shows the oldest. */
const HISTORY: [string, string][] = [
  ["这么晚还不睡？", "刚刚"],
  ["又熬夜", "2026-01-09"],
  ["和谁出去了", "2025-08-02"],
  ["瘦了", "2025-06-30"],
  ["别哭", "2025-03-11"],
  ["到家了吗", "2024-12-31"],
  ["那个男生是谁", "2024-12-25"],
  ["几点了还不睡", "2024-10-03"],
  ["裙子太短", "2024-06-17"],
  ["头发剪了", "2024-03-02"],
  ["一个人？", "2024-01-01"],
  ["换手机号了", "2023-11-20"],
  ["又熬夜", "2023-09-14"],
  ["到学校了吗", "2023-09-01"],
  ["瘦了", "2023-06-18"],
  ["又不吃早饭", "2023-06-09"],
  ["谁送你回来的", "2023-06-01"],
  ["又换头像了", "2023-05-31"],
];
export const ROW_A = 5; // 到家了吗 · 2024-12-31
export const ROW_B = 14; // 瘦了 · 2023-06-18
const ROW_H = 150;
export const HISTORY_END = (HISTORY.length - 6) * ROW_H;
export function vidComments(c: Ctx, o: { scroll: number; time: string; marks?: [number, number][]; gone?: number; press?: number }) {
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, SH);
  c.save();
  c.beginPath();
  c.rect(0, 170, SW, SH - 170);
  c.clip();
  HISTORY.forEach(([t, d], i) => {
    const y = 200 + i * ROW_H - o.scroll;
    if (y < 80 || y > SH + 40) return;
    c.save();
    c.globalAlpha *= 1 - clamp(o.gone ?? 0);
    if (o.press && i === ROW_A) {
      c.fillStyle = `rgba(255,255,255,${(0.08 * o.press).toFixed(3)})`;
      c.fillRect(0, y - 20, SW, ROW_H);
    }
    grayAvatar(c, 64, y + 46, 38);
    say(c, ACC_A, 124, y + 18, 26, { color: GREY });
    say(c, t, 124, y + 66, 38, { weight: 700, rose: true });
    say(c, `评论了你的作品 · ${d}`, 124, y + 110, 22, { color: GREY });
    // thumbnail of the post
    c.fillStyle = ["#3a3564", "#9fd0f0", "#c98a5e", "#1a1640"][i % 4];
    rr(c, SW - 110, y + 6, 78, 104, 10);
    c.fill();
    c.restore();
  });
  for (const [row, k] of o.marks ?? []) {
    const y = 200 + row * ROW_H - o.scroll;
    pulseBox(c, 20, y - 6, SW - 150, ROW_H - 24, k);
  }
  // scroll bar: a long list
  const total = HISTORY.length * ROW_H + 60;
  const view = SH - 170;
  const barH = Math.max(60, (view * view) / total);
  const barY = 170 + (o.scroll / Math.max(1, total - view)) * (view - barH);
  c.fillStyle = "rgba(255,255,255,0.35)";
  rr(c, SW - 14, barY, 6, barH, 3);
  c.fill();
  c.restore();
  c.fillStyle = VBG;
  c.fillRect(0, 0, SW, 170);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  say(c, "互动消息", SW / 2, 120, 34, { weight: 700, align: "center" });
  say(c, "评论", 60, 120, 28, { color: "#fff", weight: 700 });
}

/** Blocking: `sheet` 0..1 the bottom sheet up, `confirm` 0..1 the dialog, `done` 0..1 the toast. */
export function vidBlock(c: Ctx, o: { sheet: number; confirm: number; done: number; hot?: number }) {
  if (o.sheet > 0) {
    c.save();
    c.fillStyle = `rgba(0,0,0,${(0.5 * clamp(o.sheet)).toFixed(3)})`;
    c.fillRect(0, 0, SW, SH);
    const e = 1 - Math.pow(1 - clamp(o.sheet), 3);
    const y = SH - 470 * e;
    c.fillStyle = "#24252d";
    rr(c, 0, y, SW, 520, 36);
    c.fill();
    say(c, ACC_A, SW / 2, y + 60, 28, { color: GREY, align: "center" });
    const items: [string, string][] = [["拉黑", "#fe2c55"], ["举报", "#fff"], ["取消", "#fff"]];
    items.forEach(([t, col], i) => {
      if (i === 0 && (o.hot ?? 0) > 0) {
        c.fillStyle = `rgba(254,44,85,${(0.18 * (o.hot ?? 0)).toFixed(3)})`;
        c.fillRect(0, y + 110, SW, 110);
      }
      say(c, t, SW / 2, y + 165 + i * 110, 36, { color: col, weight: 700, align: "center" });
      c.fillStyle = "rgba(255,255,255,0.08)";
      c.fillRect(40, y + 220 + i * 110, SW - 80, 2);
    });
    c.restore();
  }
  if (o.confirm > 0 && o.done <= 0) {
    const k = clamp(o.confirm);
    c.save();
    c.globalAlpha *= k;
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect(0, 0, SW, SH);
    c.translate(SW / 2, 620);
    c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
    c.fillStyle = "#2c2d36";
    rr(c, -240, -150, 480, 300, 28);
    c.fill();
    say(c, "确定拉黑对方吗？", 0, -70, 36, { weight: 700, align: "center" });
    say(c, "拉黑后，对方将无法评论你", 0, -12, 24, { color: GREY, align: "center" });
    c.fillStyle = "rgba(255,255,255,0.1)";
    c.fillRect(-240, 50, 480, 2);
    say(c, "取消", -120, 100, 32, { color: "#ddd", align: "center" });
    say(c, "拉黑", 120, 100, 32, { color: "#fe2c55", weight: 700, align: "center" });
    c.restore();
  }
  if (o.done > 0) {
    const k = clamp(o.done);
    c.save();
    c.globalAlpha *= Math.min(1, k * 3) * (1 - clamp((k - 0.8) / 0.2));
    c.fillStyle = "rgba(60,61,70,0.95)";
    rr(c, SW / 2 - 130, 560, 260, 96, 20);
    c.fill();
    say(c, "已拉黑", SW / 2, 608, 34, { weight: 700, align: "center" });
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

// ---------------------------------------------------------------- WeChat (light)
const WBG = "#ededed";

/** A contact's page. `blocked`: her Moments show only a line (she hid them from him); `open` 0..1 photos instead. */
/** `perm` shows the 「朋友圈和状态权限」 row (at PERM_ROW), pulsing by its value. */
export const PERM_ROW: [number, number] = [300, 900];
export function wxContact(c: Ctx, o: { time: string; name: string; who: "her" | "dad"; blocked: boolean; open?: number; big?: boolean; tap?: number; perm?: number; empty?: boolean }) {
  const big = o.big ? 1.3 : 1;
  c.fillStyle = WBG;
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = "#fff";
  c.fillRect(0, 0, SW, 470);
  statusBar(c, { time: o.time, airplane: false, battery: 0.4, dark: true });
  text(c, "‹", 40, 120, { size: 60, font: F.ui, fill: "#111" });
  if (o.who === "her") herAvatar(c, 120, 300, 70);
  else dadAvatar(c, 120, 300, 140);
  say(c, o.name, 220, 270, 44 * big, { color: "#111", weight: 700 });
  say(c, "微信号：xiaoman_0618", 220, 330, 24 * big, { color: "#888" });
  c.fillStyle = "#fff";
  c.fillRect(0, 490, SW, 210);
  say(c, "朋友圈", 40, 595, 32 * big, { color: "#111" });
  const open = clamp(o.open ?? 0);
  if (o.blocked && open < 1 && !o.empty) {
    // the line (blocked)
    c.save();
    c.globalAlpha *= 1 - open;
    c.strokeStyle = "#c4c4c4";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(220, 595);
    c.lineTo(SW - 60, 595);
    c.stroke();
    c.restore();
  }
  if (!o.blocked || open > 0) {
    c.save();
    c.globalAlpha *= o.blocked ? open : 1;
    [snowPhoto, couplePhoto(false), gradPhoto].forEach((p, i) => p(c, 210 + i * 125, 540, 112, 112));
    c.restore();
  }
  if ((o.tap ?? 0) > 0) pulseBox(c, 200, 545, SW - 240, 100, o.tap ?? 0);
  c.fillStyle = "#fff";
  c.fillRect(0, 720, SW, 120);
  say(c, "发消息", SW / 2, 780, 34 * big, { color: "#576b95", weight: 700, align: "center" });
  if (o.perm !== undefined) {
    c.fillStyle = "#fff";
    c.fillRect(0, 860, SW, 84);
    say(c, "朋友圈和状态权限", 40, 902, 32 * big, { color: "#111" });
    say(c, "›", SW - 40, 900, 40, { color: "#bbb", align: "right" });
    pulseBox(c, 16, 866, SW - 32, 72, o.perm);
  }
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
/** His lock screen (old-people mode: a huge clock) over the wallpaper photo. `k` 0..1 = lit. */
export function dadLock(c: Ctx, o: { time: string; date: string }) {
  wallpaperPhoto(c, 0, 0, SW, SH);
  c.fillStyle = "rgba(0,0,0,0.12)";
  c.fillRect(0, 0, SW, SH);
  text(c, o.time, SW / 2, 250, { size: 150, font: F.ui, weight: 700, fill: "#fff", shadow: 10 });
  text(c, o.date, SW / 2, 360, { size: 40, font: F.ui, weight: 700, fill: "#fff", shadow: 8 });
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
