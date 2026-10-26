// 终章（lib/end_t.ts）的效果：跺出来的坑和裂缝（他穿着铁靴跺的在 X_K 的两只铁靴底下；她光着脚跺的在她脚下）、落地的灰、她发梢 / 脚尖化成的光、
// 往上飘的泪、全片最强的暖光（照 lib/fin_world.ts）、往上飘的人身上那团暖光、抱住那一下炸开的光。世界坐标（街面 y = 0）。

import { seeded } from "@frame/engine/math";
import { type Cam, E, H, W, applyCam, kick, ph, toScreen } from "./cam";
import { drawGlow } from "./world";
import { ZHONG_HOUSE } from "./dawn";
import { TE, type V2 } from "./end_t";
import { CRATER_X, herStompX } from "./end_pair";

// ——————————————— 坑：他穿着铁靴跺出来的（109.02，两只铁靴底下）、她光着脚跺出来的（148.53，小一点、裂缝只在街面上） ———————————————
interface Crater {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  at: number;
  /** 震波、灰、碎块有多大 */
  big: number;
  cracks: { pts: V2[]; wall: boolean; w: number }[];
  debris: { x: number; vx: number; vy: number; s: number; spin: number; shade: string }[];
}
function makeCrater(cx: number, at: number, rx: number, ry: number, seed: number, wall: boolean, big: number): Crater {
  const r = seeded(seed);
  const cy = 14 * big;
  const cracks: Crater["cracks"] = [];
  const zig = (from: V2, dir: V2, len: number, squash: number, n: number): V2[] => {
    const pts: V2[] = [from];
    let [x, y] = from;
    for (let i = 1; i <= n; i++) {
      const step = len / n;
      const jx = (r() - 0.5) * step * 0.7;
      const jy = (r() - 0.5) * step * 0.7;
      x += dir[0] * step + jx * Math.abs(dir[1]);
      y += (dir[1] * step + jy * Math.abs(dir[0])) * squash;
      pts.push([x, y]);
    }
    return pts;
  };
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (0.05 + (0.9 * k) / 8) + (r() - 0.5) * 0.2;
    const dir: V2 = [Math.cos(a) * (k % 2 ? 1 : -1), Math.sin(a)];
    const from: V2 = [cx + rx * 0.92 * dir[0], cy + ry * 0.92 * Math.abs(dir[1])];
    cracks.push({ pts: zig(from, [dir[0], Math.abs(dir[1])], (300 + r() * 420) * big, 0.32, 7), wall: false, w: 1 - k * 0.04 });
  }
  if (wall) {
    for (let k = 0; k < 5; k++) {
      const x0 = cx + (k - 2) * 95 + (r() - 0.5) * 40;
      const main = zig([x0, -8], [(r() - 0.5) * 0.5, -1], 260 + r() * 300, 1, 6);
      cracks.push({ pts: main, wall: true, w: 0.9 });
      const mid = main[3];
      cracks.push({ pts: zig(mid, [(r() < 0.5 ? -1 : 1) * 0.8, -0.6], 90 + r() * 120, 1, 3), wall: true, w: 0.6 });
    }
  }
  const debris = Array.from({ length: Math.round(22 * big) }, () => {
    const a = Math.PI * (0.1 + 0.8 * r());
    return {
      x: cx + Math.cos(a) * rx * (0.5 + 0.4 * r()) * (r() < 0.5 ? 1 : -1),
      vx: (r() - 0.5) * 900 * big,
      vy: -(500 + r() * 900) * big,
      s: (7 + r() * 13) * Math.sqrt(big),
      spin: (r() - 0.5) * 18,
      shade: r() < 0.5 ? "#9a8676" : "#b9a594",
    };
  });
  return { cx, cy, rx, ry, at, big, cracks, debris };
}
const KID_CRATER = makeCrater(CRATER_X, TE.stomp, 230, 40, 5101, true, 1);
/** 她跺下去的地方：远处那只光脚落下的地方（第一次画的时候按她的姿势算） */
let HER_CRATER: Crater | null = null;
const herCrater = () => (HER_CRATER ??= makeCrater(herStompX(), TE.stomp2, 150, 28, 6101, false, 0.72));
const cratersAt = (t: number) => (t >= TE.stomp2 ? [KID_CRATER, herCrater()] : [KID_CRATER]);

/** 坑和裂缝（街面、墙上；人之前） */
export function drawCrater(g: CanvasRenderingContext2D, t: number, z: number) {
  for (const c of cratersAt(t)) drawCraterOf(g, t, z, c);
}
function drawCraterOf(g: CanvasRenderingContext2D, t: number, z: number, C: Crater) {
  const k = E.out(ph(t, C.at, C.at + 0.06));
  if (k <= 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const grow = E.out(ph(t, C.at, C.at + 0.32));
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const c of C.cracks) {
    // 墙上的裂缝绕开老钟家的窗洞（不画到玻璃、窗帘上）
    g.save();
    if (c.wall) {
      const W0 = ZHONG_HOUSE.win;
      const clip = new Path2D();
      clip.rect(-1e5, -1e5, 2e5, 2e5);
      clip.rect(W0.x - W0.w / 2 - 18, W0.top - 18, W0.w + 36, W0.sill - W0.top + 50);
      g.clip(clip, "evenodd");
    }
    const n = c.pts.length - 1;
    const upto = grow * n;
    const path = new Path2D();
    path.moveTo(c.pts[0][0], c.pts[0][1]);
    for (let i = 1; i <= n; i++) {
      if (i - 1 > upto) break;
      const f = Math.min(1, upto - (i - 1));
      const [ax, ay] = c.pts[i - 1];
      const [bx, by] = c.pts[i];
      path.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
    }
    g.strokeStyle = "rgba(255,240,220,0.55)";
    g.lineWidth = (c.wall ? 4 : 5) * c.w * lw;
    g.save();
    g.translate(2.5 * lw, 2.5 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#5a4640";
    g.lineWidth = (c.wall ? 3.4 : 4.4) * c.w * lw;
    g.stroke(path);
    g.restore();
  }
  const rx = C.rx * k;
  const ry = C.ry * k;
  const pit = new Path2D();
  pit.ellipse(C.cx, C.cy, rx, ry, 0, 0, Math.PI * 2);
  const gr = g.createRadialGradient(C.cx, C.cy + ry * 0.2, 0, C.cx, C.cy, rx);
  gr.addColorStop(0, "#4a3a36");
  gr.addColorStop(0.7, "#6d5a52");
  gr.addColorStop(1, "#8d7a6c");
  g.fillStyle = gr;
  g.fill(pit);
  g.strokeStyle = "#3f322f";
  g.lineWidth = 3.4 * lw;
  g.stroke(pit);
  g.restore();
}
/** 坑的前沿（铁靴、脚后画：靴底、脚陷在坑里） */
export function drawCraterFront(g: CanvasRenderingContext2D, t: number, z: number) {
  for (const C of cratersAt(t)) {
    const k = E.out(ph(t, C.at, C.at + 0.06));
    if (k <= 0) continue;
    const lw = 1 / Math.sqrt(Math.max(0.3, z));
    const rx = C.rx * k;
    const ry = C.ry * k;
    g.save();
    const lip = new Path2D();
    lip.ellipse(C.cx, C.cy, rx, ry, 0, 0.12 * Math.PI, 0.88 * Math.PI);
    lip.ellipse(C.cx, C.cy + 10, rx * 1.04, ry * 1.25, 0, 0.88 * Math.PI, 0.12 * Math.PI, true);
    lip.closePath();
    g.fillStyle = "#b8a391";
    g.fill(lip);
    g.strokeStyle = "#5a4640";
    g.lineWidth = 3 * lw;
    g.stroke(lip);
    g.restore();
  }
}
/** 碎块、灰、震波 */
export function drawStompBurst(g: CanvasRenderingContext2D, t: number, z: number) {
  for (const C of cratersAt(t)) {
    const d = t - C.at;
    if (d < 0 || d > 1.4) continue;
    const lw = 1 / Math.sqrt(Math.max(0.3, z));
    const B = C.big;
    g.save();
    if (d < 0.45) {
      const u = d / 0.45;
      g.strokeStyle = `rgba(255,246,230,${0.7 * (1 - u)})`;
      g.lineWidth = (14 - 10 * u) * lw;
      g.beginPath();
      g.ellipse(C.cx, C.cy + 6, C.rx + 900 * B * E.out(u), C.ry + 160 * B * E.out(u), 0, 0, Math.PI * 2);
      g.stroke();
    }
    const u = Math.min(1, d / 1.2);
    const a = 0.6 * (1 - u) ** 1.3;
    g.fillStyle = `rgba(236,224,210,${a})`;
    for (const [dx, sz, kk] of [
      [-1, 1, 0],
      [1, 1.1, 1],
      [-0.55, 0.8, 2],
      [0.6, 0.85, 3],
      [-1.4, 0.65, 4],
      [1.45, 0.7, 5],
    ] as const) {
      g.beginPath();
      g.ellipse(C.cx + dx * (150 + 380 * E.out(u)) * B, -30 * B - 90 * u * B - kk * 10 * B, (110 + 170 * u) * sz * B, (50 + 70 * u) * sz * B, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (const p of C.debris) {
      const x = p.x + p.vx * d;
      const y = C.cy - 6 + p.vy * d + 0.5 * 3200 * d * d;
      if (y > C.cy + 30 && d > 0.15) continue;
      g.save();
      g.translate(x, y);
      g.rotate(p.spin * d);
      g.fillStyle = p.shade;
      g.strokeStyle = "#5a4640";
      g.lineWidth = 2.4 * lw;
      g.beginPath();
      g.moveTo(-p.s * 0.6, -p.s * 0.3);
      g.lineTo(p.s * 0.4, -p.s * 0.5);
      g.lineTo(p.s * 0.6, p.s * 0.35);
      g.lineTo(-p.s * 0.3, p.s * 0.5);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
    g.restore();
  }
}
/** 跺下去那一下画面一亮、一震 */

// ——————————————— 落地：一团灰、几道细裂缝 ———————————————
const CRACK = (() => {
  const r = seeded(9101);
  return Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI * (0.08 + (0.84 * k) / 6) + (r() - 0.5) * 0.2;
    const pts: V2[] = [[0, 0]];
    let x = 0;
    let y = 0;
    const len = 80 + r() * 90;
    for (let i = 0; i < 4; i++) {
      x += Math.cos(a) * (k % 2 ? 1 : -1) * (len / 4) + (r() - 0.5) * 10;
      y += Math.sin(a) * (len / 4) * 0.3 + (r() - 0.5) * 4;
      pts.push([x, y]);
    }
    return pts;
  });
})();
/** 铁靴「咚」地踩回街面：靴底两边各两团灰往外散，几道细裂缝 */
export function drawLandBurst(g: CanvasRenderingContext2D, t: number, x: number, at: number, z: number, big = 1) {
  const d = t - at;
  if (d < 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const grow = E.out(Math.min(1, d / 0.16));
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const c of CRACK) {
    const path = new Path2D();
    path.moveTo(x + c[0][0] * big, 4 + c[0][1]);
    const n = c.length - 1;
    for (let i = 1; i <= n; i++) {
      if (i - 1 > grow * n) break;
      const f = Math.min(1, grow * n - (i - 1));
      const [ax, ay] = c[i - 1];
      const [bx, by] = c[i];
      path.lineTo(x + (ax + (bx - ax) * f) * big, 4 + ay + (by - ay) * f);
    }
    g.strokeStyle = "rgba(255,240,220,0.5)";
    g.lineWidth = 4 * lw;
    g.save();
    g.translate(2 * lw, 2 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#6a5650";
    g.lineWidth = 3.2 * lw;
    g.stroke(path);
  }
  if (d < 0.8) {
    const u = Math.min(1, d / 0.75);
    g.fillStyle = `rgba(248,238,226,${0.62 * (1 - u) ** 1.4})`;
    for (const [dx, sz, k] of [
      [-90, 1, 0],
      [90, 1.1, 1],
      [-170, 0.7, 2],
      [170, 0.75, 3],
    ] as const) {
      g.beginPath();
      g.ellipse(x + dx * (0.7 + 1.0 * u) * big, -22 - 46 * u - k * 6, (60 + 90 * u) * sz * big, (26 + 34 * u) * sz * big, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}


// ——————————————— 她的发梢化成光（白的边上） ———————————————
const MOTES = (() => {
  const r = seeded(8808);
  return Array.from({ length: 150 }, () => ({
    k: r(),
    a: (r() - 0.5) * Math.PI * 1.25,
    vx: (r() - 0.5) * 80,
    vy: -(60 + r() * 120),
    s: 3.2 + r() * 4.6,
    hue: [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20,
    ph: r() * 6,
  }));
})();
/**
 * 发梢化成的光：from 起一颗颗从发梢冒出来往上飘进白里，越往后越多；stop 以后不再冒，飘着的很快淡掉（被拉回来了）。
 * 画在白的上面（发梢就在白的边上）
 */
export function drawLightMotes(g: CanvasRenderingContext2D, t: number, tip: V2, from: number, stop: number, speed = 1, up: V2 = [0, -1]) {
  if (t < from) return;
  const k = E.io(ph(t, from, from + 0.8)) * (1 - E.io(ph(t, stop, stop + 0.4)));
  if (k <= 0.003) return;
  g.save();
  const rg = g.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 120);
  rg.addColorStop(0, `rgba(255,250,240,${0.5 * k})`);
  rg.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = rg;
  g.fillRect(tip[0] - 120, tip[1] - 120, 240, 240);
  const span = 2.2;
  for (const m of MOTES) {
    // 每颗按自己的相位循环冒出来（不是只冒一次）：t0 = from + 周期里的位置
    const period = 1.4;
    const t0 = from + m.k * span + Math.floor((t - from - m.k * span) / period) * period;
    if (t0 >= stop) continue;
    const a = (t - t0) * speed;
    if (a < 0 || a > 1.3) continue;
    // 往「上」（朝着白）飘：up 是那个方向
    const ox = 78 * Math.sin(m.a) + m.vx * a + 10 * Math.sin(a * 3 + m.ph);
    const oy = -30 * Math.cos(m.a) + 40 * (1 - Math.cos(m.a)) + m.vy * a;
    const x = tip[0] + ox * -up[1] + oy * -up[0];
    const y = tip[1] + oy * -up[1] + ox * up[0];
    const alpha = Math.min(1, a * 6) * (1 - a / 1.3) ** 1.1 * (0.7 + 0.3 * Math.sin(a * 8 + m.ph));
    g.globalAlpha = alpha * Math.min(1, (t - from) / 0.6);
    g.fillStyle = `hsl(${m.hue}, 82%, ${70 + 12 * Math.min(1, a)}%)`;
    g.beginPath();
    g.arc(x, y, m.s * (1 - 0.35 * a), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
/** 她眼角往上飘的泪珠（和开场光里的女人一样）；speed < 1 是慢放 */
export function drawFloatTears(g: CanvasRenderingContext2D, t: number, eye: V2, from: number, to: number, speed = 1) {
  if (t < from || t > to + 1) return;
  g.save();
  for (let i = 0; i < 6; i++) {
    const t0 = from + (i * 0.32) / speed;
    const a = (t - t0) * speed;
    if (a < 0 || a > 1.4 || t0 > to) continue;
    const side = i % 2 ? 1 : -1;
    const x = eye[0] + side * 22 + side * 10 * a + 4 * Math.sin(a * 5 + i);
    const y = eye[1] - 50 * a - 18 * a * a;
    g.globalAlpha = Math.min(1, a * 5) * (1 - a / 1.4);
    g.fillStyle = "rgba(226,240,255,0.95)";
    g.strokeStyle = "rgba(120,140,190,0.8)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.ellipse(x, y, 4.2, 5.6, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
  g.restore();
}

// ——————————————— 尾奏：手一沉，砖暖了——全片最强的暖光 ———————————————
/**
 * 以砖为中心，soft-light 把整个画面提暖（亮处暖、深色的衣服头发不被染色），砖跟前叠一小团、一大团暖光（画在白和颗粒上面）。
 * c：砖的中心（世界坐标），w：亮到多少（0–1）
 */
export function drawWarmGlow(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, c: V2, w: number) {
  if (w <= 0.003) return;
  const [sx, sy] = toScreen(cam, c[0], c[1]);
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "soft-light";
  const wash = g.createRadialGradient(sx, sy, 0, sx, sy, 1500);
  wash.addColorStop(0, `rgba(255,186,110,${0.62 * w})`);
  wash.addColorStop(0.35, `rgba(255,190,120,${0.34 * w})`);
  wash.addColorStop(1, `rgba(255,200,150,${0.1 * w})`);
  g.fillStyle = wash;
  g.fillRect(0, 0, W, H);
  g.restore();
  g.save();
  applyCam(g, base, cam, 1);
  drawGlow(g, c[0], c[1], 50 + 16 * w, 0.75 * w);
  drawGlow(g, c[0], c[1], 150 * w, 0.26 * w);
  drawGlow(g, c[0], c[1] - 30, 380 * w, 0.08 * w);
  const far = Math.min(1, Math.max(0, (1 - cam.z) / 0.75));
  if (far > 0) {
    drawGlow(g, c[0], c[1], 30 / cam.z, 0.5 * w * far);
    drawGlow(g, c[0], c[1], 90 / cam.z, 0.25 * w * far);
  }
  g.restore();
}

// ——————————————— 往上飘的人身上那团暖光（远看像一盏灯）；抱住的那一下炸开 ———————————————
export function drawRiseGlow(g: CanvasRenderingContext2D, t: number, at: V2, z: number) {
  let a = 0;
  let r = Math.max(110, 60 / z);
  if (t < TE.catch) a = 0.7 * Math.min(1, Math.max(0, (t - TE.lift0 - 0.3) / 0.8));
  else {
    const d = t - TE.catch;
    a = 0.95 * Math.exp(-d / 0.55);
    r *= 1 + 2.4 * E.out(Math.min(1, d / 0.7));
  }
  if (a > 0.01) drawGlow(g, at[0], at[1], r, a);
}
/** 她往下冲：身后几道风的线（越冲越长） */
export function drawDiveLines(g: CanvasRenderingContext2D, t: number, chest: V2, z: number) {
  if (t < TE.jump + 0.1 || t > TE.catch) return;
  const v = (t - TE.jump) / (TE.catch - TE.jump);
  const px = 1 / z;
  g.save();
  g.strokeStyle = "rgba(255,250,244,0.55)";
  g.lineCap = "round";
  g.lineWidth = Math.max(3, 2.4 * px);
  for (let i = 0; i < 6; i++) {
    const ox = (i - 2.5) * 34 + (i % 2 ? 8 : -8);
    const len = (160 + 420 * v) * (0.7 + 0.15 * (i % 3)) * Math.max(1, px / 3);
    const y0 = chest[1] - 380 - (i % 2) * 40;
    g.beginPath();
    g.moveTo(chest[0] + ox, y0);
    g.lineTo(chest[0] + ox, y0 - len);
    g.stroke();
  }
  g.restore();
}
/** 跺下去那一下画面一亮、一震 */
export const stompFlash = (t: number) => 0.4 * kick(t, TE.stomp, 0.1) + 0.3 * kick(t, TE.stomp2, 0.1);
export const stompShake = (t: number) => 26 * kick(t, TE.stomp, 0.12);
void H;
void W;
void applyCam;
void toScreen;

/** 后奏一：退到整幅时她那里一团很强的光，占满半个画面（screen 叠一大团暖白，中间一颗很亮的芯）；落下来时慢慢收回去 */
export function drawBigLight(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, c: V2, w: number, t: number) {
  if (w <= 0.003) return;
  const [sx, sy] = toScreen(cam, c[0], c[1]);
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "screen";
  const R = 1050 * (1 + 0.04 * Math.sin(t * 2.3));
  const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
  gr.addColorStop(0, `rgba(255,250,232,${w})`);
  gr.addColorStop(0.12, `rgba(255,244,214,${0.95 * w})`);
  gr.addColorStop(0.3, `rgba(255,226,170,${0.7 * w})`);
  gr.addColorStop(0.6, `rgba(255,204,136,${0.3 * w})`);
  gr.addColorStop(1, "rgba(255,192,120,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.restore();
}
/**
 * 全片最强的暖光（砖翻过来那一下亮起来）：整个画面 soft-light 提暖，再 screen 一层暖雾压过白的冷光，几道慢慢转的光芒从砖上散出去，
 * 砖跟前一团最亮的。c：砖的中心（世界坐标），w：亮到多少（0–1），t：时间（光芒转）
 */
export function drawBrickLight(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, c: V2, w: number, t: number) {
  if (w <= 0.003) return;
  const [sx, sy] = toScreen(cam, c[0], c[1]);
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "soft-light";
  const wash = g.createRadialGradient(sx, sy, 0, sx, sy, 1700);
  wash.addColorStop(0, `rgba(255,176,96,${0.75 * w})`);
  wash.addColorStop(0.4, `rgba(255,186,116,${0.4 * w})`);
  wash.addColorStop(1, `rgba(255,200,150,${0.14 * w})`);
  g.fillStyle = wash;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "screen";
  const haze = g.createRadialGradient(sx, sy, 0, sx, sy, 1300);
  haze.addColorStop(0, `rgba(255,214,150,${0.42 * w})`);
  haze.addColorStop(0.5, `rgba(255,196,128,${0.15 * w})`);
  haze.addColorStop(1, "rgba(255,196,128,0)");
  g.fillStyle = haze;
  g.fillRect(0, 0, W, H);
  // 光芒：几道细长的暖光，慢慢转（镜头退远时短一点、淡一点）
  g.globalCompositeOperation = "lighter";
  const near = Math.min(1, Math.max(0.25, cam.z / 1.6));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.12 + 0.3 * Math.sin(i * 1.7);
    const len = (900 + 500 * ((i * 37) % 7) / 7) * (0.6 + 0.4 * w) * (0.4 + 0.6 * near);
    const half = 0.035 + 0.015 * Math.sin(i * 2.3);
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, len);
    gr.addColorStop(0, `rgba(255,226,170,${0.15 * w * near})`);
    gr.addColorStop(1, "rgba(255,226,170,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + Math.cos(a - half) * len, sy + Math.sin(a - half) * len);
    g.lineTo(sx + Math.cos(a + half) * len, sy + Math.sin(a + half) * len);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.save();
  applyCam(g, base, cam, 1);
  drawGlow(g, c[0], c[1], 44 + 14 * w, 0.72 * w);
  drawGlow(g, c[0], c[1], 160 * w, 0.26 * w);
  drawGlow(g, c[0], c[1] - 30, 460 * w, 0.1 * w);
  const far = Math.min(1, Math.max(0, (1 - cam.z) / 0.75));
  if (far > 0) {
    drawGlow(g, c[0], c[1], 36 / cam.z, 0.6 * w * far);
    drawGlow(g, c[0], c[1], 110 / cam.z, 0.3 * w * far);
  }
  g.restore();
}
