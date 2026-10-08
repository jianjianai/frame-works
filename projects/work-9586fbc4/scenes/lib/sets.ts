import { C, Ctx, F, H, Pt, W, blob, devScale, filtered, glow, hash, inkLine, lightShaft, oval, paint, poly, rbox, rr, shaded, text, vgrad } from "./draw";
import { newspaper, tape } from "./story";

/** 《瑕疵：0》 sets, drawn once at their final framing in design units (1080×1920); the shots move a camera over them. */

// ================================================================ the bathroom at night (shot 1)
/** One-point perspective toward VP. The back wall holds the mirror over the sink; the side walls and floor run
 *  toward the camera. The only lights: two tall cold sconces flanking the mirror (none above it, so the top of the
 *  opening close-up stays calm under the hook text), and the warm hallway light leaking through the door left ajar
 *  (near the camera on the left). */
export const BATH = {
  vp: [540, 830] as Pt,
  back: [210, 470, 870, 1190] as [number, number, number, number],
  frame: [330, 598, 750, 962] as [number, number, number, number],
  glass: [340, 608, 740, 952] as [number, number, number, number],
  /** the two sconces' centres; `lamp` is where their light is centred */
  sconces: [[300, 780], [780, 780]] as Pt[],
  lamp: [540, 790] as Pt,
};
const VP = BATH.vp;
/** the point at depth factor t along the ray from VP through p (t = 1: on the back wall plane; larger = nearer) */
const ray = (p: Pt, t: number): Pt => [VP[0] + (p[0] - VP[0]) * t, VP[1] + (p[1] - VP[1]) * t];
const TILE = "#b7c6cd",
  TILE_SIDE = "#a6b6be",
  GROUT = "rgba(70,92,104,0.42)";

function quad(ctx: Ctx, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function sideWall(ctx: Ctx, side: -1 | 1) {
  const [bx0, by0, bx1, by1] = BATH.back;
  const ex = side < 0 ? bx0 : bx1;
  const T = 2.6;
  const top: Pt = [ex, by0],
    bot: Pt = [ex, by1];
  quad(ctx, [top, ray(top, T), ray(bot, T), bot]);
  ctx.fillStyle = TILE_SIDE;
  ctx.fill();
  ctx.save();
  quad(ctx, [top, ray(top, T), ray(bot, T), bot]);
  ctx.clip();
  // grout: rows run toward VP, columns get wider toward the camera
  ctx.strokeStyle = GROUT;
  ctx.lineWidth = 2;
  for (let y = by0 + 60; y < by1; y += 60) {
    ctx.beginPath();
    ctx.moveTo(ex, y);
    const q = ray([ex, y], T);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
  for (let j = 1; j < 14; j++) {
    const t = 1 + 0.11 * j + 0.012 * j * j;
    if (t > T) break;
    const a = ray(top, t),
      b = ray(bot, t);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  // the wall darkens toward the camera (away from the lamp)
  const g = ctx.createLinearGradient(ex, 0, ray(top, T)[0], 0);
  g.addColorStop(0, "rgba(10,16,26,0.08)");
  g.addColorStop(1, "rgba(10,16,26,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.restore();
  inkLine(ctx, [top, bot], 7000 + side, 4, "rgba(23,22,26,0.7)", 0.8);
}

/** The room without the mirror's content (the shot draws the glass), the figure, or the lighting passes. */
export function bathroom(ctx: Ctx, abs: number) {
  const [bx0, by0, bx1, by1] = BATH.back;
  // ceiling (everything behind the walls)
  ctx.fillStyle = vgrad(ctx, -300, by0, [[0, "#1d242b"], [1, "#46535c"]]);
  ctx.fillRect(-400, -400, W + 800, H + 800);
  sideWall(ctx, -1);
  sideWall(ctx, 1);
  // floor tiles
  const T2 = 4.2;
  const fl: Pt[] = [[bx0, by1], [bx1, by1], ray([bx1, by1], T2), ray([bx0, by1], T2)];
  quad(ctx, fl);
  ctx.fillStyle = "#7f8f97";
  ctx.fill();
  ctx.save();
  quad(ctx, fl);
  ctx.clip();
  ctx.strokeStyle = "rgba(50,64,72,0.45)";
  ctx.lineWidth = 2.4;
  for (let x = bx0; x <= bx1 + 1; x += 66) {
    const q = ray([x, by1], T2);
    ctx.beginPath();
    ctx.moveTo(x, by1);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
  for (let j = 1; j < 16; j++) {
    const t = 1 + 0.16 * j + 0.03 * j * j;
    if (t > T2) break;
    const a = ray([bx0, by1], t),
      b = ray([bx1, by1], t);
    ctx.beginPath();
    ctx.moveTo(a[0] - 400, a[1]);
    ctx.lineTo(b[0] + 400, b[1]);
    ctx.stroke();
  }
  ctx.restore();
  // back wall tiles
  ctx.fillStyle = TILE;
  ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  ctx.strokeStyle = GROUT;
  ctx.lineWidth = 2;
  for (let x = bx0 + 60; x < bx1; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, by0);
    ctx.lineTo(x, by1);
    ctx.stroke();
  }
  for (let y = by0 + 60; y < by1; y += 60) {
    ctx.beginPath();
    ctx.moveTo(bx0, y);
    ctx.lineTo(bx1, y);
    ctx.stroke();
  }
  inkLine(ctx, [[bx0, by0], [bx1, by0]], 7003, 4, "rgba(23,22,26,0.7)", 0.8);
  inkLine(ctx, [[bx0, by1], [bx1, by1]], 7004, 4, "rgba(23,22,26,0.7)", 0.8);
  // two tall frosted sconces either side of the mirror
  for (const [sx, sy] of BATH.sconces) {
    rbox(ctx, sx - 9, sy - 150, 18, 300, 6, 7010 + sx, 0.6);
    paint(ctx, "#9aa6ac", C.ink, 3);
    rbox(ctx, sx - 16, sy - 130, 32, 260, 14, 7011 + sx, 0.8);
    paint(ctx, "#f2faff", C.ink, 4);
  }
  // mirror frame (the glass is drawn by the shot)
  const [fx0, fy0, fx1, fy1] = BATH.frame;
  rbox(ctx, fx0, fy0, fx1 - fx0, fy1 - fy0, 10, 7012, 1);
  paint(ctx, "#eef2f3", C.ink, 5);
  // glass shelf under it: one cup, one toothbrush
  rbox(ctx, 372, 968, 336, 12, 5, 7013, 0.6);
  paint(ctx, "rgba(220,240,248,0.85)", C.ink, 3);
  rbox(ctx, 560, 916, 46, 54, 8, 7014, 0.6);
  paint(ctx, "#8fb7d6", C.ink, 3.5);
  inkLine(ctx, [[586, 920], [598, 870]], 7015, 6, "#f2f2f2");
  inkLine(ctx, [[597, 874], [603, 860]], 7016, 9, "#5fb6e8");
  rbox(ctx, 640, 946, 52, 24, 8, 7017, 0.6);
  paint(ctx, "#f5e7c8", C.ink, 3);
  vanity(ctx);
  shavingMirror(ctx);
  towelMirror(ctx);
  door(ctx, abs);
}

function vanity(ctx: Ctx) {
  // counter top seen a little from above, the basin set into it, the cabinet below
  shaded(ctx, () => poly(ctx, [[300, 996], [780, 996], [806, 1034], [274, 1034]], 7020, 0.8), "#f2efe9", () => {
    oval(ctx, 540, 1014, 128, 13, 7021, 0.8);
    paint(ctx, "#c9d3d8", C.ink, 3.5);
    oval(ctx, 540, 1017, 104, 8, 7022, 0.6);
    paint(ctx, "#a9b7be", null);
  }, C.ink, 4.5);
  // tap
  rbox(ctx, 532, 966, 16, 34, 6, 7023, 0.5);
  paint(ctx, "#d7dde0", C.ink, 3);
  inkLine(ctx, [[540, 972], [566, 970], [570, 984]], 7024, 7, "#d7dde0");
  inkLine(ctx, [[540, 972], [566, 970], [570, 984]], 7024, 2.4, C.ink);
  shaded(ctx, () => poly(ctx, [[274, 1034], [806, 1034], [806, 1060], [274, 1060]], 7025, 0.6), "#e3ddd2", null, C.ink, 4);
  shaded(ctx, () => poly(ctx, [[292, 1060], [788, 1060], [788, 1192], [292, 1192]], 7026, 0.8), "#cfc6b6", () => {
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(292, 1060, 496, 16);
  }, C.ink, 4.5);
  inkLine(ctx, [[540, 1064], [540, 1190]], 7027, 3, "rgba(23,22,26,0.6)");
  for (const hx of [512, 568]) {
    rbox(ctx, hx - 4, 1100, 8, 34, 4, 7028 + hx, 0.4);
    paint(ctx, "#9aa3a8", C.ink, 2.4);
  }
}

/** a round shaving mirror on an arm on the left wall — newspaper over it, taped in an X */
function shavingMirror(ctx: Ctx) {
  const mount: Pt = [118, 840];
  inkLine(ctx, [mount, [150, 846], [176, 842]], 7030, 10, "#c9d0d4");
  inkLine(ctx, [mount, [150, 846], [176, 842]], 7030, 3, C.ink);
  rbox(ctx, 104, 812, 22, 58, 8, 7031, 0.5);
  paint(ctx, "#c9d0d4", C.ink, 3.5);
  ctx.save();
  ctx.translate(196, 838);
  ctx.rotate(0.08);
  oval(ctx, 0, 0, 40, 60, 7032, 0.8);
  paint(ctx, "#dfe5e8", C.ink, 4.5);
  ctx.save();
  oval(ctx, 0, 0, 33, 52, 7033, 0.6);
  ctx.clip();
  newspaper(ctx, -40, -60, 80, 120, 0.05, 7034);
  ctx.restore();
  tape(ctx, 0, 0, 92, 16, 0.9, 7035);
  tape(ctx, 0, 0, 92, 16, -0.9, 7036);
  ctx.restore();
}

/** a little mirror on the right wall with a hand towel hung over it */
function towelMirror(ctx: Ctx) {
  // the mirror's frame peeks out around the towel (in perspective on the right wall)
  quad(ctx, [[920, 640], [1004, 612], [1004, 812], [920, 790]]);
  paint(ctx, "#e4eaec", C.ink, 4);
  // the towel, draped from a hook above
  oval(ctx, 960, 618, 7, 7, 7040, 0.3);
  paint(ctx, "#c9d0d4", C.ink, 3);
  shaded(ctx, () => blob(ctx, [[930, 622], [990, 612], [1012, 700], [1010, 830], [986, 852], [960, 836], [934, 846], [914, 820], [912, 700]], 7041, 1.2), "#e9a7b3", () => {
    for (let k = 0; k < 4; k++) inkLine(ctx, [[930 + k * 18, 640], [928 + k * 20, 740], [934 + k * 18, 830]], 7042 + k, 2.2, "rgba(150,70,90,0.35)");
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(912, 800, 110, 10);
  }, C.ink, 4.5);
  // towel bar below
  inkLine(ctx, [[924, 900], [1010, 878]], 7046, 8, "#c9d0d4");
  inkLine(ctx, [[924, 900], [1010, 878]], 7046, 2.4, C.ink);
}

/** the bathroom door, left ajar near the camera on the left wall: a strip of warm hallway light down its edge */
function door(ctx: Ctx, abs: number) {
  const t0 = 1.5,
    t1 = 1.86;
  const topAt = (t: number): Pt => [VP[0] - 330 * t, VP[1] - 360 * t * 0.66];
  const botAt = (t: number): Pt => [VP[0] - 330 * t, VP[1] + 360 * t];
  const fr: Pt[] = [topAt(t0), topAt(t1), botAt(t1), botAt(t0)];
  quad(ctx, fr);
  paint(ctx, "#2a2321", C.ink, 5);
  // the gap: warm light
  const a = topAt(t0),
    b = botAt(t0);
  const fl = 1 + 0.02 * Math.sin(abs * 3);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  inkLine(ctx, [[a[0] - 2, a[1] + 8], [b[0] - 4, b[1] - 6]], 7050, 12, `rgba(255,190,110,${(0.75 * fl).toFixed(3)})`, 0.6);
  glow(ctx, a[0] - 20, (a[1] + b[1]) / 2, 330, "rgba(255,160,80,0.22)");
  ctx.restore();
  // the door leaf, nearly closed
  quad(ctx, [topAt(t0 + 0.02), [topAt(t1)[0] + 6, topAt(t1)[1] + 10], [botAt(t1)[0] + 6, botAt(t1)[1] - 8], botAt(t0 + 0.02)]);
  paint(ctx, "#d9cfc0", C.ink, 4.5);
  oval(ctx, topAt(t1)[0] + 40, (topAt(t1)[1] + botAt(t1)[1]) / 2 + 30, 9, 9, 7051, 0.4);
  paint(ctx, "#b8a98f", C.ink, 3);
}

/** the warm light from the door on the floor (laid on after the room, before the figure) */
export function bathDoorLight(ctx: Ctx) {
  lightShaft(ctx, [[60, 1370], [-80, 1520], [330, 1820], [420, 1560]], 30, 1420, 360, 1700, "255,170,90", 0.32, 30, "doorLight");
}

/** the cold sconces: they light the wall and the mirror, everything else falls into a cold dark */
export function bathLight(ctx: Ctx, abs: number) {
  const [lx, ly] = BATH.lamp;
  const hum = 1 + 0.01 * Math.sin(abs * 50);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [sx, sy] of BATH.sconces) {
    glow(ctx, sx, sy, 420, `rgba(200,225,255,${(0.16 * hum).toFixed(3)})`);
    glow(ctx, sx, sy, 120, "rgba(235,248,255,0.5)");
  }
  ctx.restore();
  // the dark beyond the lights' reach
  const g = ctx.createRadialGradient(lx, ly, 200, lx, ly, 1250);
  g.addColorStop(0, "rgba(6,10,20,0)");
  g.addColorStop(0.45, "rgba(6,10,20,0.24)");
  g.addColorStop(1, "rgba(6,10,20,0.8)");
  ctx.fillStyle = g;
  ctx.fillRect(-500, -500, W + 1000, H + 1000);
  // a cold tint in the shadows
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const st = ctx.createRadialGradient(lx, ly, 220, lx, ly, 1100);
  st.addColorStop(0, "rgba(40,70,140,0)");
  st.addColorStop(1, "rgba(40,70,140,0.55)");
  ctx.fillStyle = st;
  ctx.fillRect(-500, -500, W + 1000, H + 1000);
  ctx.restore();
}

// ================================================================ the hallway at night: the tall mirror (shots 2–3)
/** Facing the end of the hallway: the tall arched floor mirror standing out from the wall (the shot draws its glass
 *  and whatever covers it), the warm wall lamp on the left, the window on the right — the moon and the town's
 *  lights, a sheer curtain breathing — and moonlight lying on the floorboards. */
export const HALL = {
  vp: [500, 900] as Pt,
  foot: 1500, // the wall meets the floor
  rail: 1150, // chair rail
  mirror: { x0: 250, x1: 650, cy: 620, foot: 1592, fw: 26 },
  lamp: [112, 640] as Pt,
  win: [756, 440, 1040, 1120] as [number, number, number, number],
};

/** an arch: straight sides from `foot` up to `cy`, a half circle over x0..x1 (adds a subpath) */
export function archPath(ctx: Ctx, x0: number, x1: number, cy: number, foot: number) {
  const r = (x1 - x0) / 2;
  ctx.moveTo(x0, foot);
  ctx.lineTo(x0, cy);
  ctx.arc(x0 + r, cy, r, Math.PI, 0);
  ctx.lineTo(x1, foot);
  ctx.closePath();
}
/** the mirror's glass as the current path (clip to it to draw the reflection) */
export function hallGlass(ctx: Ctx) {
  const { x0, x1, cy, foot, fw } = HALL.mirror;
  ctx.beginPath();
  archPath(ctx, x0 + fw, x1 - fw, cy, foot - fw - 6);
}

function nightWindow(ctx: Ctx, abs: number, [x0, y0, x1, y1]: [number, number, number, number], seed: number) {
  const f = 22;
  const gx0 = x0 + f,
    gy0 = y0 + f,
    gx1 = x1 - f,
    gy1 = y1 - f;
  ctx.save();
  ctx.beginPath();
  ctx.rect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, gy0, gy1, [[0, "#0b1834"], [0.62, "#1c3866"], [1, "#48699c"]]);
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  for (let i = 0; i < 16; i++) {
    const sx = gx0 + hash(seed + i) * (gx1 - gx0),
      sy = gy0 + hash(seed + i * 3.1) * (gy1 - gy0) * 0.5;
    const tw = 0.5 + 0.5 * Math.sin(abs * 3 + i * 1.7);
    ctx.fillStyle = `rgba(255,252,235,${(0.3 + 0.55 * tw).toFixed(2)})`;
    ctx.fillRect(sx, sy, 3.2, 3.2);
  }
  // the moon
  const mx = gx0 + (gx1 - gx0) * 0.7,
    my = gy0 + 120;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, mx, my, 210, "rgba(190,215,255,0.32)");
  glow(ctx, mx, my, 70, "rgba(255,250,230,0.5)");
  ctx.restore();
  oval(ctx, mx, my, 36, 36, seed + 40, 0.3);
  paint(ctx, "#fff5d8", null);
  oval(ctx, mx + 9, my - 6, 9, 7, seed + 41, 0.3);
  paint(ctx, "rgba(220,210,180,0.5)", null);
  // the town: rooftops with a few lit windows
  let x = gx0 - 10;
  for (let i = 0; x < gx1; i++) {
    const bw = 46 + hash(seed + 50 + i) * 58,
      bh = 70 + hash(seed + 70 + i) * 150;
    ctx.fillStyle = i % 2 ? "#101a33" : "#15203d";
    ctx.fillRect(x, gy1 - bh, bw, bh + 4);
    for (let wy = gy1 - bh + 14; wy < gy1 - 10; wy += 22)
      for (let wx = x + 9; wx < x + bw - 10; wx += 16) {
        if (hash(seed + wx * 0.37 + wy * 0.11) > 0.3) continue;
        ctx.fillStyle = hash(wx + wy) > 0.5 ? "rgba(255,206,120,0.9)" : "rgba(255,236,190,0.75)";
        ctx.fillRect(wx, wy, 7, 9);
      }
    x += bw + 4;
  }
  ctx.restore();
  // frame, mullions, sill
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.rect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.fillStyle = "#7d8496";
  ctx.fill("evenodd");
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  const mxw = (x0 + x1) / 2,
    myw = y0 + (y1 - y0) * 0.42;
  rbox(ctx, mxw - 6, gy0, 12, gy1 - gy0, 2, seed + 60, 0.3);
  paint(ctx, "#7d8496", C.ink, 3.5);
  rbox(ctx, gx0, myw - 6, gx1 - gx0, 12, 2, seed + 61, 0.3);
  paint(ctx, "#7d8496", C.ink, 3.5);
  rbox(ctx, x0 - 18, y1 - 4, x1 - x0 + 36, 22, 4, seed + 62, 0.4);
  paint(ctx, "#8d93a3", C.ink, 4);
}

/** a sheer curtain hanging from (xl..xr, top) to `bottom`, its hem breathing */
function sheerCurtain(ctx: Ctx, abs: number, xl: number, xr: number, top: number, bottom: number, seed: number) {
  const sway = (k: number) => Math.sin(abs * 1.3 + k) * 16 + Math.sin(abs * 2.9 + k * 2) * 5;
  const n = 7;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(xl, top);
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(xl + ((i - 0.5) / n) * (xr - xl), top + 12, xl + (i / n) * (xr - xl), top);
  ctx.bezierCurveTo(xr + 10, top + 300, xr + sway(1) * 0.6, bottom - 300, xr + 40 + sway(1), bottom);
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    ctx.quadraticCurveTo(xr + 40 + sway(1) + (xl - 50 - xr - 40) * (u - 0.5 / n), bottom + 16 * Math.sin(abs * 2 + i), xr + 40 + sway(1) + (xl - 50 + sway(0) - xr - 40 - sway(1)) * u, bottom);
  }
  ctx.bezierCurveTo(xl - 50 + sway(0) * 0.5, bottom - 300, xl - 8, top + 300, xl, top);
  ctx.closePath();
  ctx.fillStyle = "rgba(222,230,255,0.24)";
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6;
    const xt = xl + (xr - xl) * u,
      xb = xl - 50 + (xr - xl + 90) * u + sway(u * 2) * u;
    inkLine(ctx, [[xt, top], [(xt + xb) / 2 + 6, (top + bottom) / 2], [xb, bottom]], seed + i, 10, "rgba(255,255,255,0.16)", 0.4);
    inkLine(ctx, [[xt + 14, top], [(xt + xb) / 2 + 22, (top + bottom) / 2], [xb + 16, bottom]], seed + 10 + i, 6, "rgba(120,135,180,0.18)", 0.4);
  }
  ctx.restore();
}

/** the hallway's wall, floor, window and lamp (no mirror, no light passes) */
export function hallRoom(ctx: Ctx, abs: number) {
  const { foot, rail, vp, win } = HALL;
  ctx.fillStyle = vgrad(ctx, -400, foot, [[0, "#1d2231"], [0.6, "#2a3041"], [1, "#313647"]]);
  ctx.fillRect(-600, -600, W + 1200, foot + 600);
  // wallpaper: a faint diamond print
  ctx.fillStyle = "rgba(190,200,235,0.07)";
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 18; i++) {
      const x = -400 + i * 110 + (j % 2) * 55,
        y = -420 + j * 105;
      if (y > rail - 30) continue;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.fill();
    }
  // wainscot below the chair rail, with its panels
  ctx.fillStyle = vgrad(ctx, rail, foot, [[0, "#292e3d"], [1, "#222735"]]);
  ctx.fillRect(-600, rail, W + 1200, foot - rail);
  for (let i = -3; i < 7; i++) {
    rbox(ctx, -60 + i * 270, rail + 50, 210, foot - rail - 110, 6, 7600 + i, 0.5);
    paint(ctx, null, "rgba(8,10,18,0.5)", 3);
    inkLine(ctx, [[-56 + i * 270, foot - 64], [-56 + i * 270, rail + 54], [146 + i * 270, rail + 54]], 7590 + i, 2.5, "rgba(170,180,215,0.12)", 0.3);
  }
  rbox(ctx, -600, rail - 14, W + 1200, 26, 4, 7610, 0.4);
  paint(ctx, "#3b4154", C.ink, 4);
  ctx.fillStyle = "#343a4a";
  ctx.fillRect(-600, foot - 38, W + 1200, 38);
  inkLine(ctx, [[-600, foot - 38], [W + 600, foot - 38]], 7611, 3, "rgba(8,10,18,0.6)", 0.3);
  // floorboards toward the vanishing point
  ctx.fillStyle = vgrad(ctx, foot, 2400, [[0, "#3a2b25"], [1, "#1b1412"]]);
  ctx.fillRect(-600, foot, W + 1200, 1600);
  ctx.strokeStyle = "rgba(0,0,0,0.34)";
  ctx.lineWidth = 3;
  for (let xb = -2800; xb <= 3800; xb += 190) {
    const xt = vp[0] + (xb - vp[0]) * ((foot - vp[1]) / (2600 - vp[1]));
    ctx.beginPath();
    ctx.moveTo(xt, foot);
    ctx.lineTo(xb, 2600);
    ctx.stroke();
  }
  inkLine(ctx, [[-600, foot], [W + 600, foot]], 7612, 4.5, C.ink, 0.3);
  // the window and its curtain
  inkLine(ctx, [[win[0] - 70, win[1] - 40], [win[2] + 50, win[1] - 40]], 7615, 7, "#2a2422", 0.2);
  nightWindow(ctx, abs, win, 7620);
  sheerCurtain(ctx, abs, win[0] - 34, win[0] + 104, win[1] - 40, win[3] + 70, 7680);
  // the wall lamp: a fabric shade lit from inside
  const [lx, ly] = HALL.lamp;
  oval(ctx, lx, ly + 52, 15, 24, 7650, 0.3);
  paint(ctx, "#4a3d33", C.ink, 3.5);
  inkLine(ctx, [[lx, ly + 50], [lx + 12, ly + 20], [lx + 6, ly - 6]], 7651, 6, "#2f2723", 0.3);
  poly(ctx, [[lx - 48, ly - 92], [lx + 56, ly - 92], [lx + 72, ly - 6], [lx - 64, ly - 6]], 7652, 0.8);
  const sh = ctx.createLinearGradient(0, ly - 92, 0, ly - 6);
  sh.addColorStop(0, "#ffe6bd");
  sh.addColorStop(1, "#ffc77e");
  paint(ctx, sh, C.ink, 4);
}

/** the mirror's shadow on the wall (the lamp is on the left), soft */
export function hallMirrorShadow(ctx: Ctx) {
  const { x0, x1, cy } = HALL.mirror;
  filtered(ctx, `blur(${(26 * devScale(ctx)).toFixed(1)}px)`, (c) => {
    c.beginPath();
    archPath(c, x0 + 80, x1 + 90, cy + 30, HALL.foot);
    c.fillStyle = "rgba(4,6,14,0.5)";
    c.fill();
  }, "hallMirrorShadow");
  // and on the floor under it (wide enough to sit under the sheet's hem too)
  ctx.save();
  ctx.globalAlpha = 0.55;
  glow(ctx, (x0 + x1) / 2 + 30, HALL.mirror.foot + 6, 300, "rgba(0,0,0,0.9)");
  ctx.translate((x0 + x1) / 2 + 20, HALL.mirror.foot + 40);
  ctx.scale(1, 0.14);
  glow(ctx, 0, 0, 380, "rgba(0,0,0,0.95)");
  ctx.restore();
}

/** the mirror's wooden frame and feet (over its glass) */
export function hallMirrorFrame(ctx: Ctx) {
  const { x0, x1, cy, foot, fw } = HALL.mirror;
  for (const fx of [x0 + 18, x1 - 52]) {
    rbox(ctx, fx, foot - 6, 34, 26, 5, 7660 + fx, 0.4);
    paint(ctx, "#3e281c", C.ink, 3.5);
  }
  ctx.beginPath();
  archPath(ctx, x0, x1, cy, foot);
  archPath(ctx, x0 + fw, x1 - fw, cy, foot - fw - 6);
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "#93603c");
  g.addColorStop(0.5, "#6a4329");
  g.addColorStop(1, "#4a2e1f");
  ctx.fillStyle = g;
  ctx.fill("evenodd");
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.stroke();
  // the lamp catches the frame's left edge
  ctx.save();
  ctx.beginPath();
  ctx.arc((x0 + x1) / 2, cy, (x1 - x0) / 2 - 8, Math.PI * 1.02, Math.PI * 1.42);
  ctx.moveTo(x0 + 8, cy + 6);
  ctx.lineTo(x0 + 8, foot - 20);
  ctx.strokeStyle = "rgba(255,206,150,0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  oval(ctx, (x0 + x1) / 2, cy - (x1 - x0) / 2 - 2, 13, 11, 7665, 0.3);
  paint(ctx, "#a06a40", C.ink, 3.5);
}

/** The bedsheet as a cloth: q = [tlx, tly, trx, try, brx, bry, blx, bly, top, sq, side, hem]: its four corners; `top`
 *  how far the top edge bows up (negative = up; with sq 0 it rounds like an arch, sq 0.33 a gentle curve); `side` how
 *  far the sides bow out; `hem` how much the bottom edge flutters. */
export type Cloth = number[];
/** the sheet once it has landed over the mirror: thrown a little crooked — over the top of the arch, its right corner
 *  slipped down so the wooden frame shows there — hanging to the floor */
export const SHEET_ON_MIRROR: Cloth = [206, 600, 662, 800, 712, 1630, 170, 1630, -250, 0, 6, 10];

function bez(u: number, a: number, b: number, c: number, d: number) {
  const v = 1 - u;
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
}
function clothTop(q: Cloth, u: number): Pt {
  const [tlx, tly, trx, ty, , , , , top, sq] = q;
  const h = top / 0.75;
  return [
    bez(u, tlx, tlx + (trx - tlx) * sq, tlx + (trx - tlx) * (1 - sq), trx),
    bez(u, tly, tly + (ty - tly) * sq + h, tly + (ty - tly) * (1 - sq) + h, ty),
  ];
}
function clothPath(ctx: Ctx, q: Cloth, abs: number) {
  const [tlx, tly, trx, ty, brx, bry, blx, bly, top, sq, side, hem] = q;
  const h = top / 0.75;
  ctx.beginPath();
  ctx.moveTo(blx, bly);
  ctx.bezierCurveTo(blx - side, bly + (tly - bly) * 0.33, tlx - side, bly + (tly - bly) * 0.67, tlx, tly);
  ctx.bezierCurveTo(tlx + (trx - tlx) * sq, tly + (ty - tly) * sq + h, tlx + (trx - tlx) * (1 - sq), tly + (ty - tly) * (1 - sq) + h, trx, ty);
  ctx.bezierCurveTo(trx + side, ty + (bry - ty) * 0.33, brx + side, ty + (bry - ty) * 0.67, brx, bry);
  const n = 30;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const env = Math.sin(Math.PI * u);
    const w = (Math.sin(u * Math.PI * 5 + abs * 7) + 0.5 * Math.sin(u * Math.PI * 2.2 - abs * 3)) * hem * env;
    ctx.lineTo(brx + (blx - brx) * u, bry + (bly - bry) * u + w);
  }
  ctx.closePath();
}
/** draw the sheet: lit warm from the lamp on the left (it glows through), cold on the right; soft folds */
export function clothSheet(ctx: Ctx, q: Cloth, abs: number, seed = 7700) {
  const [tlx, tly, trx, , brx, bry, blx, bly] = q;
  const minX = Math.min(tlx, blx),
    maxX = Math.max(trx, brx);
  ctx.save();
  clothPath(ctx, q, abs);
  const g = ctx.createLinearGradient(minX, 0, maxX, 0);
  g.addColorStop(0, "#fbe3c6");
  g.addColorStop(0.45, "#e7e3ea");
  g.addColorStop(1, "#aebcd8");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // folds: soft shade bands from the top edge down to the hem, each with a light ridge beside it
  const k = devScale(ctx);
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const u = (i + 0.5) / 7 + Math.sin(i * 2.1 + seed) * 0.035;
    const a = clothTop(q, Math.min(0.97, Math.max(0.03, u)));
    const b: Pt = [brx + (blx - brx) * (1 - u), bry + (bly - bry) * (1 - u)];
    const sw = Math.sin(abs * 2.2 + i * 1.3) * 12;
    const m: Pt = [(a[0] + b[0]) / 2 + sw, (a[1] + b[1]) / 2];
    ctx.filter = `blur(${(9 * k).toFixed(1)}px)`;
    ctx.strokeStyle = "rgba(80,92,135,0.2)";
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(m[0], m[1], b[0], b[1] + 30);
    ctx.stroke();
    ctx.filter = `blur(${(3 * k).toFixed(1)}px)`;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(a[0] + 22, a[1] + 10);
    ctx.quadraticCurveTo(m[0] + 24, m[1], b[0] + 26, b[1] + 30);
    ctx.stroke();
  }
  ctx.filter = "none";
  // the lamp glows through it on the left
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, minX - 60, (tly + bly) / 2 - 120, Math.max(300, (maxX - minX) * 0.8), "rgba(255,180,110,0.22)");
  ctx.restore();
  clothPath(ctx, q, abs);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** the hallway's light: the lamp's warm pool, the moonlight through the window (a soft shaft and its patch on the
 *  floor), a cold tint in the corners */
export function hallLight(ctx: Ctx, abs: number) {
  const [lx, ly] = HALL.lamp;
  const fl = 1 + 0.012 * Math.sin(abs * 2.3);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, lx, ly - 50, 860, `rgba(255,150,70,${(0.3 * fl).toFixed(3)})`);
  glow(ctx, lx, ly - 50, 280, "rgba(255,200,130,0.42)");
  glow(ctx, lx, ly - 46, 80, "rgba(255,240,210,0.85)");
  glow(ctx, lx + 120, HALL.foot + 80, 420, "rgba(255,150,80,0.14)");
  ctx.restore();
  const [wx0, wy0, wx1] = HALL.win;
  lightShaft(ctx, [[wx0 + 22, wy0 + 22], [wx1 - 22, wy0 + 22], [wx1 - 140, 2000], [wx0 - 380, 2000]], (wx0 + wx1) / 2, wy0, 520, 1950, "165,195,255", 0.09, 40, "hallMoonVol");
  lightShaft(ctx, [[wx0 - 10, HALL.foot + 8], [wx1, HALL.foot + 8], [wx1 - 150, 1960], [wx0 - 330, 1960]], (wx0 + wx1) / 2, HALL.foot, 560, 1960, "185,210,255", 0.24, 20, "hallMoonFloor");
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const st = ctx.createRadialGradient(lx + 300, ly + 200, 300, lx + 300, ly + 200, 1500);
  st.addColorStop(0, "rgba(40,70,140,0)");
  st.addColorStop(1, "rgba(30,55,130,0.6)");
  ctx.fillStyle = st;
  ctx.fillRect(-600, -600, W + 1200, H + 1200);
  ctx.restore();
}

/** a pot plant's leaves, near the camera in the bottom-right corner (draw it out of focus, it gives the depth) */
export function hallPlant(ctx: Ctx, abs: number) {
  const leaf = (x: number, y: number, ang: number, len: number, wid: number, seed: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.sin(abs * 1.1 + seed) * 0.025);
    blob(ctx, [[0, 0], [len * 0.22, -wid * 0.5], [len * 0.6, -wid * 0.46], [len, 0], [len * 0.6, wid * 0.44], [len * 0.22, wid * 0.48]], seed, 1);
    const g = ctx.createLinearGradient(0, -wid / 2, 0, wid / 2);
    g.addColorStop(0, "#2c4532");
    g.addColorStop(1, "#13201a");
    paint(ctx, g, C.ink, 5);
    inkLine(ctx, [[30, 0], [len * 0.5, -4], [len * 0.9, 0]], seed + 1, 4, "rgba(150,190,150,0.35)", 0.5);
    ctx.restore();
  };
  leaf(1110, 2060, -2.42, 420, 190, 7690);
  leaf(1090, 2080, -2.0, 520, 210, 7692);
  leaf(1130, 2060, -1.68, 470, 190, 7694);
  leaf(1100, 2100, -2.85, 380, 170, 7696);
}

/** S3's background: the same wall after the sheet has gone over the mirror. Meant to be drawn blurred. */
export function hallwayNight(ctx: Ctx, abs: number) {
  hallRoom(ctx, abs);
  hallMirrorShadow(ctx);
  hallMirrorFrame(ctx);
  clothSheet(ctx, SHEET_ON_MIRROR, abs);
  hallLight(ctx, abs);
}

// ================================================================ the classroom by day (shot 3)
/** Seen from the front of the room toward the back, from a little above the seated heads (horizon y 520): the back
 *  wall with the class's chalk-drawn back board (黑板报), the clock and a row of cubbies at its foot; the window
 *  wall on the left with the afternoon sun in it; the floor. Students and desks are drawn by the shot: a seated
 *  person of scale s has the head centre at y = 520 + 264·s and the desk's front edge at head + 300·s. */
export const CLASS = { vp: [600, 520] as Pt, corner: 262, foot: 872 };
/** y at x on the line from the vanishing point through (x0, y0) */
const alongVp = (x0: number, y0: number, x: number) => CLASS.vp[1] + ((y0 - CLASS.vp[1]) * (x - CLASS.vp[0])) / (x0 - CLASS.vp[0]);

export function classroomBack(ctx: Ctx, abs: number) {
  const cx = CLASS.corner,
    fy = CLASS.foot,
    ceil = 104;
  // back wall
  ctx.fillStyle = vgrad(ctx, 0, fy, [[0, "#f4ebd6"], [1, "#e7dabd"]]);
  ctx.fillRect(-300, -300, W + 600, fy + 300);
  // ceiling and its tube light
  poly(ctx, [[cx, ceil], [W + 300, ceil - 6], [W + 300, -800], [-300, -800], [-300, alongVp(cx, ceil, -300)]], 7200, 1);
  paint(ctx, "#f8f4ea", C.ink, 5);
  rbox(ctx, 470, 34, 320, 20, 10, 7201, 0.6);
  paint(ctx, "#fffdf4", C.ink, 3.5);
  // the window wall, in perspective
  poly(ctx, [[cx, ceil], [cx, fy], [-300, alongVp(cx, fy, -300)], [-300, alongVp(cx, ceil, -300)]], 7202, 1);
  paint(ctx, "#e3d5b6", C.ink, 5);
  for (const [xa, xb, sd] of [[238, 150, 7203], [118, -20, 7206]] as [number, number, number][]) {
    const top = (x: number) => alongVp(cx, 182, x),
      bot = (x: number) => alongVp(cx, 700, x),
      mid = (x: number) => alongVp(cx, 420, x);
    const pane: Pt[] = [[xa, top(xa)], [xa, bot(xa)], [xb, bot(xb)], [xb, top(xb)]];
    shaded(ctx, () => poly(ctx, pane, sd, 0.8), "#dff0f6", () => {
      // the bright afternoon outside: sky, a tree's crown low in the glass
      ctx.fillStyle = vgrad(ctx, -100, 860, [[0, "#cfe8f4"], [0.6, "#f4f6e8"], [1, "#fff4d8"]]);
      ctx.fillRect(-300, -300, 700, 1300);
      for (let i = 0; i < 6; i++) {
        oval(ctx, xb + ((i * 53) % 120), bot(xa) - 70 - ((i * 37) % 90), 46, 40, sd + 10 + i, 1.5);
        paint(ctx, i % 2 ? "#b9d99b" : "#a5cd88", null);
      }
      glow(ctx, (xa + xb) / 2, (top(xa) + bot(xa)) / 2, 260, "rgba(255,252,236,0.75)");
    }, C.ink, 6);
    inkLine(ctx, [[(xa + xb) / 2, top((xa + xb) / 2)], [(xa + xb) / 2, bot((xa + xb) / 2)]], sd + 1, 5, "#cdbf9f");
    inkLine(ctx, [[xa, mid(xa)], [xb, mid(xb)]], sd + 2, 5, "#cdbf9f");
    // the sill
    poly(ctx, [[xa + 6, bot(xa)], [xb - 10, bot(xb) + 4], [xb - 10, bot(xb) + 26], [xa + 6, bot(xa) + 16]], sd + 3, 0.6);
    paint(ctx, "#f2ead8", C.ink, 4);
  }
  // the back board (黑板报): chalk title, a sun, bunting, lines of coloured chalk "writing", flowers
  rbox(ctx, 360, 282, 640, 268, 8, 7210, 1);
  paint(ctx, "#8a6844", C.ink, 5);
  rbox(ctx, 376, 298, 608, 236, 4, 7211, 0.8);
  paint(ctx, "#35574a", C.ink, 3.5);
  ctx.save();
  rbox(ctx, 376, 298, 608, 236, 4, 7211, 0.8);
  ctx.clip();
  const chalk = (pts: Pt[], seed: number, col: string, lw = 4) => inkLine(ctx, pts, seed, lw, col);
  // bunting across the top
  const flags = ["#ffb3c6", "#ffe08a", "#a8d8ff", "#c8f0b0"];
  for (let i = 0; i < 11; i++) {
    const x = 410 + i * 54,
      y = 318 + 10 * Math.sin((i / 10) * Math.PI);
    poly(ctx, [[x - 18, y], [x + 18, y + 2], [x, y + 30]], 7212 + i, 0.6);
    paint(ctx, flags[i % 4], null);
  }
  chalk([[396, 318], [700, 330], [970, 318]], 7225, "rgba(255,255,255,0.7)", 2.4);
  text(ctx, "高二(3)班", 510, 390, { size: 46, font: F.cn, fill: "#ffe9a6" });
  // chalk sun with rays
  oval(ctx, 900, 400, 30, 30, 7226, 0.8);
  paint(ctx, null, "#ffd27a", 4.5);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    chalk([[900 + Math.cos(a) * 40, 400 + Math.sin(a) * 40], [900 + Math.cos(a) * 54, 400 + Math.sin(a) * 54]], 7227 + i, "#ffd27a", 4);
  }
  // lines of "writing"
  const ink = ["rgba(255,255,255,0.82)", "#ffc2d4", "#bfe3ff", "rgba(255,255,255,0.82)"];
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 6; k++) {
      const x0 = 400 + k * 46 + (r % 2) * 10;
      chalk([[x0, 438 + r * 24], [x0 + 30 + ((k * 7 + r * 3) % 10), 438 + r * 24]], 7240 + r * 6 + k, ink[r], 3.6);
    }
  // flowers
  for (let i = 0; i < 3; i++) {
    const fx = 770 + i * 70,
      fyy = 492 - (i % 2) * 20;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      oval(ctx, fx + Math.cos(a) * 12, fyy + Math.sin(a) * 12, 9, 9, 7270 + i * 5 + p, 0.4);
      paint(ctx, null, i === 1 ? "#ffe08a" : "#ffc2d4", 3);
    }
    chalk([[fx, fyy + 14], [fx + 2, fyy + 44]], 7290 + i, "#c8f0b0", 3.6);
  }
  ctx.restore();
  // clock
  oval(ctx, 958, 196, 40, 40, 7240, 0.8);
  paint(ctx, "#fbfaf4", C.ink, 5);
  inkLine(ctx, [[958, 196], [958, 170]], 7241, 5);
  inkLine(ctx, [[958, 196], [978, 206]], 7242, 4);
  // cubbies along the foot of the wall, bags and books in them
  rbox(ctx, cx + 6, 738, W + 200 - cx, 134, 4, 7300, 0.8);
  paint(ctx, "#d8c296", C.ink, 5);
  const bags = ["#e58a7a", "#7fa7d4", "#f1cf72", "#8cc59a", "#c9a0d8", "#f0a35e", "#6f8fb8"];
  for (let i = 0; i < 12; i++) {
    const x0 = cx + 14 + i * 76;
    for (let r = 0; r < 2; r++) {
      rbox(ctx, x0, 748 + r * 62, 66, 54, 3, 7301 + i * 2 + r, 0.6);
      paint(ctx, "#9c8256", C.ink, 3);
      if ((i * 3 + r * 5) % 4 !== 0) {
        rbox(ctx, x0 + 8, 760 + r * 62, 48 - ((i + r) % 3) * 8, 42, 8, 7330 + i * 2 + r, 0.8);
        paint(ctx, bags[(i + r * 3) % bags.length], C.ink, 3);
      }
    }
  }
  // floor: pale boards running toward the back
  const floor: Pt[] = [[cx, fy], [W + 300, fy], [W + 300, H + 300], [-300, H + 300], [-300, alongVp(cx, fy, -300)]];
  poly(ctx, floor, 7250, 1);
  paint(ctx, "#d2b78c", C.ink, 5);
  ctx.save();
  poly(ctx, floor, 7250, 1);
  ctx.clip();
  ctx.strokeStyle = "rgba(120,84,44,0.2)";
  ctx.lineWidth = 2.4;
  const [vx, vy] = CLASS.vp;
  for (let i = -6; i <= 12; i++) {
    const x = cx + i * 90;
    const t = (H + 300 - vy) / (fy - vy);
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(vx + (x - vx) * t, H + 300);
    ctx.stroke();
  }
  ctx.restore();
  void abs;
}

/** the afternoon sun through the windows, laid on after the back rows: a broad shaft falls across her desk by the
 *  window (the brightest place in the room) and on along the floor; the window wall glows */
export function classroomSun(ctx: Ctx, abs: number) {
  const sway = Math.sin(abs * 0.4) * 8;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 90, 420, 420, "rgba(255,240,200,0.32)");
  ctx.restore();
  lightShaft(ctx, [[60, 120], [236, 200], [700 + sway, 1080], [300 + sway, 1180]], 150, 170, 520, 1120, "255,232,180", 0.38, 40, "sunA");
  lightShaft(ctx, [[-60, 300], [110, 330], [520 + sway, 1500], [140 + sway, 1580]], 30, 320, 330, 1540, "255,232,180", 0.22, 40, "sunB");
}

/** A school desk seen from the front of the room. (x, y) = centre of the top's front edge; s scales it. */
export function deskAt(ctx: Ctx, x: number, y: number, s: number, seed: number, items?: (c: Ctx) => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  inkLine(ctx, [[-214, 140], [-220, 330]], seed, 11, "#5a5a62");
  inkLine(ctx, [[214, 140], [220, 330]], seed + 1, 11, "#5a5a62");
  shaded(ctx, () => poly(ctx, [[-206, -64], [206, -64], [236, 0], [-236, 0]], seed + 2, 1), "#e4bd84", () => {
    inkLine(ctx, [[-180, -30], [190, -34]], seed + 3, 2.2, "rgba(120,80,40,0.3)");
  }, C.ink, 5);
  items?.(ctx);
  shaded(ctx, () => poly(ctx, [[-236, 0], [236, 0], [228, 150], [-228, 150]], seed + 4, 1), "#c99a62", () => {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(-240, 0, 480, 22);
  }, C.ink, 5);
  ctx.restore();
}
