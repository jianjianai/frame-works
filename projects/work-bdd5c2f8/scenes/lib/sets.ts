import { clamp } from "../../../../src/engine/math";
import { C, Ctx, H, Pt, W, blob, curve, fillBg, glow, hash, inkLine, jit, line, oval, paint, poly, rbox, vgrad } from "./draw";

// ---------------------------------------------------------------- bedroom (night)
export function bedroom(ctx: Ctx, abs: number, moon = 1) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#151a35"], [1, "#0b0e1f"]]));
  // window with moon
  ctx.save();
  rbox(ctx, 640, 300, 330, 400, 10, 11, 2);
  paint(ctx, vgrad(ctx, 300, 700, [[0, "#2c3a78"], [1, "#4b4f8e"]]), C.ink, 7);
  ctx.save();
  rbox(ctx, 640, 300, 330, 400, 10, 11, 2);
  ctx.clip();
  glow(ctx, 870, 390, 160, "rgba(255,244,200,0.35)", moon);
  oval(ctx, 870, 390, 46, 46, 12, 1.2);
  paint(ctx, "#fff4c8", null);
  for (let i = 0; i < 9; i++) {
    const x = 650 + hash(i * 3.1) * 310,
      y = 310 + hash(i * 7.3) * 380;
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(abs * 1.3 + i));
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, 4, 4);
  }
  ctx.restore();
  inkLine(ctx, [[805, 300], [805, 700]], 13, 8, "#1b1f3a");
  inkLine(ctx, [[640, 500], [970, 500]], 14, 8, "#1b1f3a");
  ctx.restore();
  // poster on the wall
  rbox(ctx, 110, 330, 230, 300, 6, 15, 2);
  paint(ctx, "#3a2f55", C.ink, 5);
  line(ctx, 140, 380, 300, 380, 16);
  paint(ctx, null, "#8d7bb8", 6);
  oval(ctx, 225, 500, 60, 60, 17, 2);
  paint(ctx, null, "#8d7bb8", 6);
}

export function desk(ctx: Ctx, y: number) {
  poly(ctx, [[-40, y], [W + 40, y - 10], [W + 40, H + 40], [-40, H + 40]], 21, 2);
  paint(ctx, "#4a3322", C.ink, 7);
  for (let i = 0; i < 5; i++) inkLine(ctx, [[-20, y + 60 + i * 110], [W * 0.5, y + 70 + i * 110 + jit(i, 4)], [W + 20, y + 54 + i * 110]], 22 + i, 3, "#3a2618");
}

/** Cupcake with one candle. lit: 0 = out, 1 = burning. smoke 0..1 after blowing out. */
export function cupcake(ctx: Ctx, x: number, y: number, s: number, abs: number, lit: number, smoke = 0, candles = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // wrapper
  poly(ctx, [[-110, -10], [110, -10], [84, 130], [-84, 130]], 31, 1.5);
  paint(ctx, "#ff8fb8", C.ink, 6);
  for (let i = -3; i <= 3; i++) inkLine(ctx, [[i * 30, -6], [i * 23, 126]], 32 + i, 3, "#d9658f");
  // frosting
  blob(ctx, [[-128, -6], [-120, -60], [-70, -100], [-20, -90], [10, -130], [60, -100], [112, -70], [130, -10], [0, 4]], 33, 2);
  paint(ctx, "#fff3f6", C.ink, 6);
  for (let i = 0; i < 8; i++) {
    oval(ctx, -80 + hash(i) * 160, -70 + hash(i * 3) * 50, 7, 4, 34 + i, 0.4, hash(i * 5) * 3);
    paint(ctx, ["#ff5a7a", "#ffd84a", "#59c3ff", "#7ee081"][i % 4], null);
  }
  for (let c = 0; c < candles; c++) {
    const cx = candles === 1 ? 0 : (c - (candles - 1) / 2) * 50;
    rbox(ctx, cx - 11, -230, 22, 130, 4, 40 + c, 1);
    paint(ctx, "#cfe8ff", C.ink, 4);
    ctx.save();
    rbox(ctx, cx - 11, -230, 22, 130, 4, 40 + c, 1);
    ctx.clip();
    for (let k = 0; k < 5; k++) {
      ctx.strokeStyle = "#5aa7ff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 20, -230 + k * 30);
      ctx.lineTo(cx + 20, -210 + k * 30);
      ctx.stroke();
    }
    ctx.restore();
    inkLine(ctx, [[cx, -232], [cx + 2, -250]], 45 + c, 3);
    if (lit > 0.01) {
      const fl = 1 + Math.sin(abs * 23 + c) * 0.08 + Math.sin(abs * 37) * 0.05;
      ctx.save();
      ctx.translate(cx, -252);
      ctx.scale(lit * fl, lit * (fl + Math.sin(abs * 17) * 0.06));
      ctx.rotate(Math.sin(abs * 5 + c) * 0.08);
      blob(ctx, [[0, -78], [22, -30], [20, 0], [0, 12], [-20, 0], [-22, -30]], 46 + c, 1.2);
      paint(ctx, "#ffb43a", "#e0701a", 3);
      blob(ctx, [[0, -46], [11, -16], [0, 2], [-11, -16]], 47 + c, 0.8);
      paint(ctx, "#fff6c2", null);
      ctx.restore();
    }
    if (smoke > 0) {
      ctx.save();
      ctx.globalAlpha = (1 - smoke) * 0.8;
      const pts: Pt[] = [];
      for (let k = 0; k < 7; k++) pts.push([cx + Math.sin(k * 1.3 + smoke * 6) * (10 + k * 6), -260 - k * 40 * (0.4 + smoke)]);
      curve(ctx, pts, 48 + c, 1.5);
      paint(ctx, null, "rgba(220,220,230,0.9)", 6);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Darkness everywhere except a pool of warm light. */
export function lightPool(ctx: Ctx, x: number, y: number, r: number, dark: number, warm = "rgba(255,170,70,0.28)") {
  const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
  g.addColorStop(0, "rgba(4,5,16,0)");
  g.addColorStop(1, `rgba(4,5,16,${dark})`);
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, r * 0.8, warm, 1);
  ctx.restore();
}

// ---------------------------------------------------------------- school
export function corridor(ctx: Ctx) {
  fillBg(ctx, "#e8dcc0");
  // windows along the wall
  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 360;
    rbox(ctx, x, 330, 280, 360, 6, 60 + i, 2);
    paint(ctx, vgrad(ctx, 330, 690, [[0, "#bfe3f2"], [1, "#e9f6ee"]]), C.ink, 6);
    inkLine(ctx, [[x + 140, 330], [x + 140, 690]], 63 + i, 5);
    inkLine(ctx, [[x, 510], [x + 280, 510]], 66 + i, 5);
  }
  // skirting + floor
  poly(ctx, [[-40, 1120], [W + 40, 1110], [W + 40, H + 40], [-40, H + 40]], 70, 2);
  paint(ctx, "#c4a57a", C.ink, 6);
  rbox(ctx, -40, 1060, W + 80, 60, 0, 71, 1.5);
  paint(ctx, "#6e8f7a", C.ink, 5);
  for (let i = 0; i < 6; i++) inkLine(ctx, [[-20 + i * 230, 1130], [-200 + i * 300, H]], 72 + i, 3, "#a8885e");
}

export function classroom(ctx: Ctx) {
  fillBg(ctx, "#e3d7bb");
  // blackboard
  rbox(ctx, 90, 300, 900, 420, 8, 80, 2);
  paint(ctx, "#2f4a3c", C.ink, 8);
  ctx.save();
  ctx.globalAlpha = 0.7;
  inkLine(ctx, [[150, 380], [420, 372]], 81, 5, "#e8efe8");
  inkLine(ctx, [[150, 450], [600, 446]], 82, 5, "#e8efe8");
  inkLine(ctx, [[150, 520], [330, 516]], 83, 5, "#e8efe8");
  ctx.restore();
  poly(ctx, [[-40, 1080], [W + 40, 1070], [W + 40, H + 40], [-40, H + 40]], 84, 2);
  paint(ctx, "#b99a6c", C.ink, 6);
}
export function schoolDesk(ctx: Ctx, x: number, y: number, w: number) {
  rbox(ctx, x - w / 2, y, w, 70, 6, 85, 1.5);
  paint(ctx, "#d79a55", C.ink, 6);
  rbox(ctx, x - w / 2 + 20, y + 70, w - 40, 260, 4, 86, 1.5);
  paint(ctx, "#9c6b3a", C.ink, 6);
}

// ---------------------------------------------------------------- park + swing set (from the cover)
export function parkSky(ctx: Ctx, dusk: number) {
  // dusk 0 = golden sunset, 1 = night
  const top = mixColor("#f6a25c", "#141a3a", dusk);
  const mid = mixColor("#f7c98a", "#2b2c5e", dusk);
  const low = mixColor("#f3d9a6", "#3c3566", dusk);
  fillBg(ctx, vgrad(ctx, 0, 1200, [[0, top], [0.6, mid], [1, low]]));
  if (dusk < 0.9) {
    glow(ctx, 760, 760, 420, "rgba(255,200,120,0.55)", 1 - dusk);
    oval(ctx, 760, 820 + dusk * 200, 90, 90, 90, 1.5);
    paint(ctx, `rgba(255,214,140,${1 - dusk})`, null);
  }
  if (dusk > 0.3) {
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = (dusk - 0.3) * (0.5 + 0.5 * Math.sin(i * 7.1));
      ctx.fillStyle = "#fff";
      ctx.fillRect(hash(i * 1.7) * W, hash(i * 2.9) * 700 + 100, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}
export function hedge(ctx: Ctx, y: number, dusk: number) {
  // trees
  for (let i = 0; i < 5; i++) {
    const x = -60 + i * 280 + hash(i) * 60;
    oval(ctx, x, y - 260 - hash(i * 3) * 120, 190, 220, 91 + i, 4);
    paint(ctx, mixColor("#5d7b3a", "#16241e", dusk), mixColor("#2d3d1c", "#0a110c", dusk), 6);
  }
  const pts: Pt[] = [[-60, H]];
  for (let i = 0; i <= 14; i++) pts.push([-60 + i * 90, y - 40 - (i % 2) * 30 - hash(i * 5) * 20]);
  pts.push([W + 60, H]);
  poly(ctx, pts, 96, 2);
  paint(ctx, mixColor("#6f8e3e", "#1c2d22", dusk), mixColor("#2d3d1c", "#0a110c", dusk), 6);
  poly(ctx, [[-60, y + 220], [W + 60, y + 200], [W + 60, H + 60], [-60, H + 60]], 97, 2);
  paint(ctx, mixColor("#7d9c45", "#1d2c22", dusk), mixColor("#2d3d1c", "#0a110c", dusk), 6);
}
export interface Swing {
  angle: number; // swing rotation around beam (rad)
}
/** A-frame swing set. Returns pivot info so callers can hang characters. */
export function swingSet(ctx: Ctx, x: number, y: number, s: number, dusk: number, draw: { left?: (ctx: Ctx, seatX: number, seatY: number, angle: number) => void; right?: (ctx: Ctx, seatX: number, seatY: number, angle: number) => void; angles: [number, number] }) {
  const frame = mixColor("#e8ece0", "#8d93a8", dusk);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // legs (back)
  for (const side of [-1, 1]) {
    poly(ctx, [[side * 380 - 18, 0], [side * 380 + 18, 0], [side * 470 + 22, 900], [side * 470 - 22, 900]], 100 + side, 1.5);
    paint(ctx, frame, C.ink, 6);
  }
  // beam
  rbox(ctx, -440, -30, 880, 56, 6, 103, 1.5);
  paint(ctx, frame, C.ink, 6);
  // trapeze bar
  inkLine(ctx, [[-30, 20], [-30, 330]], 104, 3, "#555");
  inkLine(ctx, [[60, 20], [60, 330]], 105, 3, "#555");
  rbox(ctx, -60, 320, 150, 30, 8, 106, 1.2);
  paint(ctx, "#f2c230", C.ink, 5);
  const seats: [number, number][] = [
    [-220, draw.angles[0]],
    [250, draw.angles[1]],
  ];
  seats.forEach(([sx, a], i) => {
    const L = 600;
    const seatX = sx + Math.sin(a) * L,
      seatY = Math.cos(a) * L;
    const fn = i === 0 ? draw.left : draw.right;
    // chains
    for (const off of [-84, 84]) {
      const px = sx + off,
        ex = seatX + off * Math.cos(a),
        ey = seatY - off * Math.sin(a) * 0.2;
      ctx.save();
      ctx.setLineDash([10, 6]);
      line(ctx, px, 10, ex, ey, 107 + i + off, 1);
      paint(ctx, null, "#4b4f55", 6);
      ctx.restore();
    }
    rbox(ctx, seatX - 110, seatY - 12, 220, 26, 8, 110 + i, 1);
    paint(ctx, "#2d6b56", C.ink, 5);
    fn?.(ctx, seatX, seatY, a);
  });
  // front cross bars
  for (const side of [-1, 1]) {
    poly(ctx, [[side * 300, 640], [side * 560, 640], [side * 560, 670], [side * 300, 670]], 120 + side, 1.5);
    paint(ctx, frame, C.ink, 5);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- street (night)
export function street(ctx: Ctx, abs: number, scroll: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0d1230"], [0.55, "#1e2347"], [1, "#0b0d1c"]]));
  // buildings with lit windows (some show celebrating silhouettes)
  const span = 1400;
  for (let i = -1; i < 5; i++) {
    const bx = ((i * 380 - scroll * 0.6) % span + span) % span - 300;
    const bh = 700 + hash(i + 40) * 300;
    rbox(ctx, bx, 1150 - bh, 330, bh + 20, 4, 130 + i, 2);
    paint(ctx, "#1a1d3b", C.ink, 6);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 3; c++) {
        const on = hash(i * 31 + r * 7 + c) > 0.45;
        if (!on) continue;
        const wx = bx + 30 + c * 100,
          wy = 1150 - bh + 60 + r * 130;
        rbox(ctx, wx, wy, 70, 90, 3, 140 + r * 3 + c, 1);
        paint(ctx, "#ffd98a", C.ink, 4);
        if (hash(i * 13 + r + c * 5) > 0.6) {
          // little party silhouettes
          ctx.fillStyle = "#c48a3a";
          for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.arc(wx + 22 + k * 28, wy + 52 + Math.sin(abs * 8 + k + r) * 4, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(wx + 12 + k * 28, wy + 62, 20, 30);
          }
        }
      }
  }
  // street lamps
  for (let i = -1; i < 3; i++) {
    const lx = ((i * 620 - scroll) % 1240 + 1240) % 1240 - 100;
    inkLine(ctx, [[lx, 1460], [lx, 760], [lx + 60, 740]], 150 + i, 10, "#2a2d44");
    glow(ctx, lx + 70, 760, 300, "rgba(255,210,130,0.35)");
    oval(ctx, lx + 70, 754, 30, 16, 151 + i, 1);
    paint(ctx, "#ffe6a8", C.ink, 4);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffd98a";
    ctx.beginPath();
    ctx.moveTo(lx + 50, 760);
    ctx.lineTo(lx - 120, 1460);
    ctx.lineTo(lx + 260, 1460);
    ctx.lineTo(lx + 90, 760);
    ctx.fill();
    ctx.restore();
  }
  poly(ctx, [[-60, 1150], [W + 60, 1140], [W + 60, H + 60], [-60, H + 60]], 160, 2);
  paint(ctx, "#23243a", C.ink, 6);
  for (let i = -1; i < 6; i++) {
    const dx = ((i * 260 - scroll) % 1560 + 1560) % 1560 - 260;
    rbox(ctx, dx, 1560, 140, 18, 6, 161 + i, 1);
    paint(ctx, "#4a4b66", null);
  }
}

// ---------------------------------------------------------------- confetti
export function confetti(ctx: Ctx, abs: number, t0: number, count = 90, seed = 7) {
  const t = abs - t0;
  if (t < 0) return;
  for (let i = 0; i < count; i++) {
    const sx = hash(seed + i) * W;
    const vx = (hash(seed + i * 2) - 0.5) * 500;
    const vy = -600 - hash(seed + i * 3) * 900;
    const x = W / 2 + (sx - W / 2) * 0.3 + vx * t;
    const y = 1500 + vy * t + 900 * t * t;
    const fall = Math.max(0, t - 1.2);
    const yy = Math.min(y, 1500 + vy * 1.2 + 900 * 1.44) + fall * fall * 0 + fall * (120 + hash(i) * 120);
    const yf = t < 1.2 ? y : yy;
    if (yf > H + 40) continue;
    ctx.save();
    ctx.translate(x + Math.sin(abs * 3 + i) * 30 * clamp(t - 0.8), yf);
    ctx.rotate(abs * (2 + hash(i * 9) * 4) + i);
    ctx.fillStyle = ["#ff5a7a", "#ffd84a", "#59c3ff", "#7ee081", "#c58bff"][i % 5];
    ctx.fillRect(-9, -5, 18, 10);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- colour
export function mixColor(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const k = clamp(t);
  const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
  const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
  const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
  return `rgb(${r},${g},${bl})`;
}

export function heart(ctx: Ctx, x: number, y: number, r: number, color: string, seed: number, crack = 0) {
  ctx.save();
  ctx.translate(x, y);
  blob(ctx, [[0, r * 0.35], [-r * 0.5, -r * 0.25], [-r * 0.95, -r * 0.1], [-r, r * 0.45], [0, r * 1.35], [r, r * 0.45], [r * 0.95, -r * 0.1], [r * 0.5, -r * 0.25]], seed, r * 0.04);
  paint(ctx, color, C.ink, Math.max(2, r * 0.12));
  if (crack > 0) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, crack * 2);
    inkLine(ctx, [[0, r * 0.3], [-r * 0.2, r * 0.6], [r * 0.15, r * 0.8], [-r * 0.05, r * 1.3]], seed + 1, Math.max(2, r * 0.12));
    ctx.restore();
  }
  ctx.restore();
}
/** Hearts drifting upward (couples in love, off-screen). */
export function heartsRise(ctx: Ctx, abs: number, count: number, seed: number, alpha = 1, crack = 0) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let i = 0; i < count; i++) {
    const speed = 120 + hash(seed + i) * 120;
    const y = H + 100 - ((abs * speed + hash(seed + i * 3) * 2000) % 2200);
    const x = hash(seed + i * 7) * W + Math.sin(abs * 1.5 + i) * 40;
    heart(ctx, x, y, 22 + hash(seed + i * 5) * 26, "#ff8fb8", seed + i * 11, crack);
  }
  ctx.restore();
}
/** A street lamp that flickers on at time `on`. */
export function lampPost(ctx: Ctx, x: number, y: number, abs: number, on: number) {
  inkLine(ctx, [[x, y + 900], [x, y], [x + 70, y - 20]], 170, 12, "#2a2d44");
  const flick = abs < on ? 0 : abs < on + 0.5 ? (Math.sin((abs - on) * 60) > 0 ? 1 : 0.2) : 1;
  if (flick > 0) glow(ctx, x + 80, y, 420, "rgba(255,210,130,0.45)", flick);
  oval(ctx, x + 80, y - 6, 36, 18, 171, 1);
  paint(ctx, flick > 0.5 ? "#ffe6a8" : "#6b6b7a", C.ink, 4);
}
