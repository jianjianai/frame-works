/**
 * 《i have no friends》的场景（重置版精细化，设计坐标 1080×1920 整幅）：卧室（串灯 + 拍立得、窗外月亮和云，clue 楼下的手电和横幅）、
 * 书桌、教室和走廊（窗户阳光、窗格光 paneLight、压暗 shadeAround）、回家的街（四层视差）、窗外街景、楼门口、公园黄昏和秋千；
 * 道具：小蛋糕（蜡烛和吹灭的烟）、派对喇叭、大蛋糕、课桌、路灯、彩带、爱心；光：光斑 bokeh/roomBokeh/streetBokeh、
 * 屏幕光 screenSpill、串灯光晕 fairyGlow、光圈 lightPool。生日书桌镜头在 shared.ts。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, H, Pt, W, beginFrame, blob, bokehDisc, curve, devScale, fillBg, filtered, flicker, glow, hash, inkLine, jit, lightShaft, line, loadFonts, oval, paint, poly, rbox, rr, shaded, text, vgrad } from "./draw";

/** Shade a daylight set everywhere except round its light sources: a tinted veil with soft holes at `holes` [x, y,
 *  r] (windows, the patches of sun on the floor) — so the light has somewhere to come from and the room has depth. */
export function shadeAround(ctx: Ctx, rgb: string, a: number, holes: [number, number, number][], key = "shade") {
  if (a <= 0.005) return;
  filtered(
    ctx,
    "none",
    (c) => {
      c.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
      c.fillRect(-400, -400, W + 800, H + 800);
      c.globalCompositeOperation = "destination-out";
      for (const [x, y, r] of holes) {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.5, "rgba(0,0,0,0.75)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },
    key,
  );
}
/** Window panes of sunlight (or moonlight) laid on a floor or desk: the quad q (TL, TR, BR, BL) split into 2×2 panes
 *  by the window's cross bars, soft-edged, added as light. */
export function paneLight(ctx: Ctx, q: Pt[], rgb: string, a: number, soft = 5, key = "panes") {
  if (a <= 0.005) return;
  filtered(
    ctx,
    `blur(${(soft * devScale(ctx)).toFixed(1)}px)`,
    (c) => {
      const at = (u: number, v: number): Pt => [
        (1 - v) * ((1 - u) * q[0][0] + u * q[1][0]) + v * ((1 - u) * q[3][0] + u * q[2][0]),
        (1 - v) * ((1 - u) * q[0][1] + u * q[1][1]) + v * ((1 - u) * q[3][1] + u * q[2][1]),
      ];
      c.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
      for (const [u0, u1] of [[0, 0.47], [0.53, 1]])
        for (const [v0, v1] of [[0, 0.46], [0.54, 1]]) {
          const p = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
          c.beginPath();
          p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
          c.closePath();
          c.fill();
        }
    },
    key,
    1,
    "lighter",
  );
}

/** Sets. 重置版: bedroom, desk, corridor, classroom and the night street were redrawn with more detail — props that
 *  say something (the calendar with today circled), light that has a source (moon, window shafts, lamps, the candle),
 *  texture (wood grain, floor tiles in perspective) and depth (far / mid / near layers that scroll at different
 *  speeds). Signatures are the same as before; corridor/classroom take `abs` for dust in the light. */

// ---------------------------------------------------------------- bedroom (night)
export function bedroom(ctx: Ctx, abs: number, moon = 1, clue = 0) {
  // wall: deep blue, a faint striped wallpaper
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#171c3a"], [0.6, "#121731"], [1, "#0b0e1f"]]));
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = "#9fb0ff";
  ctx.lineWidth = 3;
  for (let x = 30; x < W; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + jit(x, 2), H);
    ctx.stroke();
  }
  ctx.restore();
  // window: night sky, a moon with craters, the town's rooftops and lit windows far below
  const wx = 640,
    wy = 300,
    ww = 330,
    wh = 400;
  ctx.save();
  rbox(ctx, wx, wy, ww, wh, 10, 11, 2);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, "#1d2a63"], [0.7, "#3a3f80"], [1, "#5a4f86"]]);
  ctx.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);
  for (let i = 0; i < 14; i++) {
    const x = wx + 10 + hash(i * 3.1) * (ww - 20),
      y = wy + 10 + hash(i * 7.3) * (wh * 0.6);
    const big = i % 3 === 0 ? 2 : 0;
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(abs * 1.3 + i * 1.7));
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, 3 + big, 3 + big);
  }
  // a few faint far stars between the bright ones
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.25 + 0.3 * Math.abs(Math.sin(abs * 0.9 + i * 2.3));
    ctx.fillStyle = "#dfe6ff";
    ctx.fillRect(wx + 6 + hash(i * 4.9 + 1) * (ww - 12), wy + 6 + hash(i * 8.3 + 2) * (wh * 0.62), 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  glow(ctx, 870, 390, 190, "rgba(255,244,200,0.38)", moon);
  oval(ctx, 870, 390, 46, 46, 12, 1.2);
  paint(ctx, "#fff4c8", null);
  for (const [cx, cy, r] of [[856, 378, 9], [884, 402, 6], [872, 372, 4]] as [number, number, number][]) {
    oval(ctx, cx, cy, r, r, 18 + r, 0.4);
    paint(ctx, "rgba(220,200,140,0.55)", null);
  }
  // thin clouds drifting slowly across the moon, their undersides lit
  for (const [cx, cy, w, k] of [[760, 352, 120, 0], [915, 452, 105, 1], [700, 520, 90, 2]] as [number, number, number, number][]) {
    const ox = ((abs * 9 + k * 37) % 70) - 35;
    const pts: Pt[] = [[cx - w + ox, cy + 6], [cx - w * 0.55 + ox, cy - 16], [cx - w * 0.1 + ox, cy - 28], [cx + w * 0.4 + ox, cy - 18], [cx + w + ox, cy + 4], [cx + w * 0.3 + ox, cy + 15], [cx - w * 0.4 + ox, cy + 16]];
    blob(ctx, pts, 3140 + k, 1.4);
    paint(ctx, "rgba(52,62,120,0.62)", null);
    ctx.save();
    ctx.globalAlpha = 0.5;
    curve(ctx, [[cx - w * 0.7 + ox, cy + 14], [cx + ox, cy + 18], [cx + w * 0.7 + ox, cy + 10]], 3150 + k, 1);
    paint(ctx, null, "rgba(190,200,255,0.8)", 3);
    ctx.restore();
  }
  const roofs: Pt[] = [
    [wx - 10, wy + wh + 10], [wx - 10, wy + 300], [wx + 50, wy + 300], [wx + 50, wy + 270], [wx + 110, wy + 270], [wx + 110, wy + 318],
    [wx + 170, wy + 318], [wx + 170, wy + 250], [wx + 230, wy + 250], [wx + 230, wy + 296], [wx + 290, wy + 296], [wx + 290, wy + 276],
    [wx + ww + 10, wy + 276], [wx + ww + 10, wy + wh + 10],
  ];
  poly(ctx, roofs, 19, 1);
  paint(ctx, "#121633", null);
  for (let i = 0; i < 12; i++) {
    const x = wx + 8 + hash(i * 5.7) * (ww - 30),
      y = wy + 290 + hash(i * 2.3) * 90;
    ctx.fillStyle = hash(i * 9.1) > 0.4 ? "rgba(255,214,140,0.9)" : "rgba(255,214,140,0.35)";
    ctx.fillRect(x, y, 8, 10);
  }
  if (clue > 0) {
    // 彩蛋: far below, at the foot of the window, a few phone lights and a scrap of pink banner — they are already
    // down there waiting (the twist shows the same street at 0:42)
    ctx.save();
    ctx.globalAlpha *= clue;
    for (let i = 0; i < 6; i++) {
      const lx = wx + 118 + i * 15 + Math.sin(abs * 2 + i) * 2,
        ly = wy + wh - 13 - (i % 2) * 5;
      glow(ctx, lx, ly, 13, "rgba(255,255,230,0.9)", 0.6 + 0.4 * Math.sin(abs * 5 + i));
      ctx.fillStyle = "#fffbe6";
      ctx.fillRect(lx - 1.5, ly - 1.5, 3, 3);
    }
    ctx.fillStyle = "#ff7fb0";
    ctx.fillRect(wx + 146, wy + wh - 27, 36, 8);
    ctx.restore();
  }
  ctx.restore();
  rbox(ctx, wx, wy, ww, wh, 10, 11, 2);
  paint(ctx, null, C.ink, 7);
  inkLine(ctx, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 13, 10, "#1b1f3a");
  inkLine(ctx, [[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 14, 10, "#1b1f3a");
  rbox(ctx, wx - 26, wy + wh - 4, ww + 52, 30, 6, 20, 1.2);
  paint(ctx, "#2a2f55", C.ink, 5);
  // moonlight falling into the room
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  poly(ctx, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww - 120, H], [wx - 340, H]], 9, 1);
  ctx.fillStyle = `rgba(150,170,255,${0.05 * moon})`;
  ctx.fill();
  ctx.restore();
  // curtains gathered at both sides, with folds
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? wx - 40 : wx + ww + 40;
    const pts: Pt[] =
      side < 0
        ? [[x0 - 30, wy - 40], [x0 + 70, wy - 40], [x0 + 52, wy + 160], [x0 + 70, wy + wh + 60], [x0 - 40, wy + wh + 70]]
        : [[x0 - 70, wy - 40], [x0 + 30, wy - 40], [x0 + 40, wy + wh + 70], [x0 - 70, wy + wh + 60], [x0 - 52, wy + 160]];
    shaded(ctx, () => blob(ctx, pts, 21 + side, 2), "#34426e", () => {
      for (let k = 0; k < 3; k++) {
        const fx = x0 + (k - 1) * 22;
        inkLine(ctx, [[fx, wy - 30], [fx + side * 6, wy + 200], [fx - side * 4, wy + wh + 50]], 23 + k + side * 5, 4, "#26315a");
      }
    }, C.ink, 5);
  }
  inkLine(ctx, [[wx - 110, wy - 44], [wx + ww + 110, wy - 44]], 24, 9, "#5b5f80");
  // a shelf with books and a plant
  rbox(ctx, 60, 250, 300, 22, 4, 25, 1);
  paint(ctx, "#5a4632", C.ink, 5);
  const spines: [number, number, string][] = [[76, 88, "#c0564f"], [102, 104, "#e8b04a"], [130, 92, "#4f8fbf"], [156, 110, "#7ea86b"], [184, 84, "#d9d2c3"]];
  for (const [x, h, col] of spines) {
    rbox(ctx, x, 250 - h, 24, h, 3, 26 + x, 0.8);
    paint(ctx, col, C.ink, 4);
  }
  poly(ctx, [[262, 250], [322, 250], [314, 206], [270, 206]], 27, 0.8);
  paint(ctx, "#c97a4a", C.ink, 4);
  for (let k = 0; k < 4; k++) {
    blob(ctx, [[292, 206], [292 + (k - 1.5) * 26, 150 - (k % 2) * 20], [292 + (k - 1.5) * 34, 176]], 28 + k, 1);
    paint(ctx, "#5f9a58", C.ink, 3.5);
  }
  // 美感: a string of fairy lights across the wall behind him, three photos pegged to it (it replaced a poster of
  // a plain circle) — close on his face they become soft discs of light behind his head
  fairyString(ctx);
  // the calendar: today (the 5th) circled in red
  ctx.save();
  ctx.translate(150, 775);
  ctx.rotate(0.03);
  shaded(ctx, () => rbox(ctx, -70, -85, 140, 170, 6, 30, 1), "#efe6d2", () => {
    ctx.fillStyle = "#d9534f";
    ctx.fillRect(-80, -95, 160, 46);
  }, C.ink, 4);
  text(ctx, "10", 0, -64, { size: 30, font: F.marker, fill: "#fff" });
  ctx.fillStyle = "rgba(60,50,40,0.5)";
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) ctx.fillRect(-58 + c * 25, -28 + r * 28, 12, 10);
  oval(ctx, -58 + 25 * 4 + 6, -28 + 5, 17, 15, 31, 0.8);
  paint(ctx, null, C.red, 4);
  ctx.restore();
}

// ---------------------------------------------------------------- his wall: fairy lights and photos
const FAIRY_A: Pt = [-30, 490],
  FAIRY_B: Pt = [630, 500],
  FAIRY_SAG = 110;
const fairyAt = (t: number): Pt => [
  FAIRY_A[0] + (FAIRY_B[0] - FAIRY_A[0]) * t,
  FAIRY_A[1] + (FAIRY_B[1] - FAIRY_A[1]) * t + FAIRY_SAG * 4 * t * (1 - t),
];
/** the fairy lights' bulbs (centre of each glass bulb) */
export const FAIRY_BULBS: Pt[] = Array.from({ length: 13 }, (_, i) => {
  const [x, y] = fairyAt((i + 0.5) / 13);
  return [x, y + 15];
});
function fairyString(ctx: Ctx) {
  inkLine(ctx, Array.from({ length: 21 }, (_, i) => fairyAt(i / 20)), 3101, 3, "#23242e");
  // three photos pegged to the string (a sunny day, a sunset over a hill, a tree)
  const photos: [number, number, string][] = [[0.12, -0.09, "#8fc6e8"], [0.3, 0.06, "#f0a982"], [0.5, -0.05, "#a9d4ee"]];
  photos.forEach(([t, rot, sky], k) => {
    const [px, py] = fairyAt(t);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    shaded(ctx, () => rbox(ctx, -38, 2, 76, 92, 3, 3110 + k, 0.6), "#efe6d2", () => {
      ctx.fillStyle = "rgba(60,40,20,0.12)";
      ctx.fillRect(10, 2, 30, 92);
    }, C.ink, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-30, 10, 60, 58);
    ctx.clip();
    ctx.fillStyle = sky;
    ctx.fillRect(-30, 10, 60, 58);
    if (k === 0) {
      oval(ctx, 12, 26, 9, 9, 3120, 0.3);
      paint(ctx, "#ffd84a", null);
      ctx.fillStyle = "#6fae5c";
      ctx.fillRect(-30, 54, 60, 14);
    } else if (k === 1) {
      oval(ctx, -4, 50, 13, 13, 3121, 0.3);
      paint(ctx, "#ffe08a", null);
      oval(ctx, 0, 76, 46, 18, 3122, 0.6);
      paint(ctx, "#5b4a6e", null);
    } else {
      ctx.fillStyle = "#7a5a3a";
      ctx.fillRect(-3, 40, 6, 28);
      oval(ctx, 0, 34, 18, 16, 3123, 0.8);
      paint(ctx, "#5f9a58", null);
    }
    ctx.restore();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, 10, 60, 58);
    // the wooden peg
    rbox(ctx, -5, -8, 10, 20, 2, 3125 + k, 0.3);
    paint(ctx, "#c9a36a", C.ink, 2);
    ctx.restore();
  });
  // the bulbs on their sockets
  FAIRY_BULBS.forEach(([bx, by], i) => {
    ctx.fillStyle = "#23242e";
    ctx.fillRect(bx - 4, by - 19, 8, 9);
    oval(ctx, bx, by, 7, 10, 3130 + i, 0.3);
    paint(ctx, "#fff1cf", C.ink, 2);
  });
}
/** The fairy lights' light, for after the room has been darkened (they are lights): a glow round each bulb, gently
 *  breathing; `blur` (the depth of field, design px) turns them into soft discs of light. */
export function fairyGlow(ctx: Ctx, abs: number, blur = 0, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  FAIRY_BULBS.forEach(([bx, by], i) => {
    const tw = a * (0.82 + 0.18 * Math.sin(abs * 1.7 + i * 2.3));
    glow(ctx, bx, by, 30, "rgba(255,228,180,0.6)", tw);
    glow(ctx, bx, by, 95, "rgba(255,215,160,0.1)", tw);
    if (blur > 0.3) bokehDisc(ctx, bx, by, 9 + blur * 6, "255,228,182", 0.2 * tw);
  });
  ctx.restore();
}

export function desk(ctx: Ctx, y: number) {
  // the desk top: plank seams, grain, a warm highlight on the front edge
  shaded(ctx, () => poly(ctx, [[-40, y], [W + 40, y - 10], [W + 40, H + 40], [-40, H + 40]], 21, 2), "#4a3322", () => {
    for (let i = 0; i < 5; i++) inkLine(ctx, [[-20, y + 60 + i * 110], [W * 0.5, y + 70 + i * 110 + jit(i, 4)], [W + 20, y + 54 + i * 110]], 22 + i, 3, "#3a2618");
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 16; i++) {
      const gy = y + 30 + hash(i * 4.1) * 560,
        gx = hash(i * 6.7) * W;
      inkLine(ctx, [[gx - 120, gy], [gx, gy - 6], [gx + 140, gy + 2]], 40 + i, 2, "#5e4430");
    }
    ctx.restore();
    inkLine(ctx, [[-40, y + 8], [W + 40, y - 2]], 27, 6, "rgba(255,210,150,0.22)");
  }, C.ink, 7);
  // textbooks stacked on the left
  const books: [number, number, number, string][] = [
    [40, y + 120, 220, "#3f6fa0"],
    [52, y + 86, 196, "#c9a14a"],
    [36, y + 52, 214, "#b8534d"],
  ];
  for (const [bx, by, bw, col] of books) {
    shaded(ctx, () => rbox(ctx, bx, by - 34, bw, 34, 4, 50 + bx, 0.8), col, () => {
      ctx.fillStyle = "rgba(250,246,232,0.9)";
      ctx.fillRect(bx + bw - 22, by - 30, 18, 26);
    }, C.ink, 4);
  }
  // a pencil cup on the right
  shaded(ctx, () => poly(ctx, [[968, y + 12], [1040, y + 12], [1034, y + 104], [974, y + 104]], 60, 0.8), "#6d8fb3", () => {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(968, y + 12, 18, 92);
  }, C.ink, 4);
  for (const [px, ph, col] of [[984, 84, "#ffd84a"], [1004, 104, "#e46f78"], [1022, 76, "#7ee081"]] as [number, number, string][]) {
    rbox(ctx, px - 5, y + 14 - ph, 10, ph, 2, 61 + px, 0.4);
    paint(ctx, col, C.ink, 3);
  }
}

/** Cupcake with one candle. lit: 0 = out, 1 = burning. smoke 0..1 after blowing out. `part`: "body" = everything but
 *  the flame and its glow, "flame" = only those (so the flame can stay warm over a graded, grey scene). */
export function cupcake(ctx: Ctx, x: number, y: number, s: number, abs: number, lit: number, smoke = 0, candles = 1, part: "all" | "body" | "flame" = "all") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = part !== "flame",
    flame = part !== "body";
  if (body) {
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
  }
  for (let c = 0; c < candles; c++) {
    const cx = candles === 1 ? 0 : (c - (candles - 1) / 2) * 50;
    if (body) {
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
    }
    if (flame && lit > 0.01) {
      const fl = 1 + Math.sin(abs * 23 + c) * 0.08 + Math.sin(abs * 37) * 0.05;
      glow(ctx, cx, -290, 150, "rgba(255,190,90,0.35)", lit);
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
    if (body && smoke > 0) {
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

/** A party horn (吹龙) held in the lips at (x, y): `u` 0 = rolled up, 1 = blown all the way out; `droop` 0..1 sags it
 *  (the sad deflate). Drawn in chunks so the coil overlaps itself with its outline. */
export function partyHorn(c: Ctx, x: number, y: number, u: number, droop: number, abs: number, dir = 0.3) {
  const L = 200,
    WD = 17,
    ds = 4,
    r0 = 15;
  const out = Math.max(1, L * u);
  const pts: Pt[] = [];
  let ang = dir,
    px = x + Math.cos(dir) * 24,
    py = y + Math.sin(dir) * 24;
  for (let s = 0; s <= L; s += ds) {
    pts.push([px, py]);
    let k: number;
    if (s < out) k = droop * 0.014 * Math.pow(s / out, 0.8) + 0.002 * u * Math.sin(abs * 11 + s * 0.05);
    else k = 1 / (r0 * (1 - 0.72 * ((s - out) / Math.max(1, L - out))));
    ang += k * ds;
    px += Math.cos(ang) * ds;
    py += Math.sin(ang) * ds;
  }
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  const CH = 6;
  for (let i = 0; i < pts.length - 1; i += CH) {
    const seg = pts.slice(i, Math.min(pts.length, i + CH + 1));
    const path = () => {
      c.beginPath();
      seg.forEach(([a, b], j) => (j ? c.lineTo(a, b) : c.moveTo(a, b)));
    };
    path();
    c.strokeStyle = C.ink;
    c.lineWidth = WD + 7;
    c.stroke();
    path();
    c.strokeStyle = "#ff8fb8";
    c.lineWidth = WD;
    c.stroke();
    path();
    c.setLineDash([9, 13]);
    c.lineDashOffset = -i * ds;
    c.strokeStyle = "#ffd84a";
    c.lineWidth = WD - 2;
    c.stroke();
    c.setLineDash([]);
  }
  // the mouthpiece in his lips
  c.translate(x, y);
  c.rotate(dir);
  rbox(c, -6, -10, 32, 20, 5, 3201, 0.4);
  paint(c, "#f4f1ea", C.ink, 3.5);
  c.restore();
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
/** Sunlit dust drifting in a light shaft (x0..x1 at the top, sheared to the right as it falls). */
function dust(ctx: Ctx, abs: number, x0: number, y0: number, w: number, h: number, seed: number, n = 12) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < n; k++) {
    const u = hash(seed + k * 3.3),
      v = (hash(seed + k * 7.1) + abs * (0.03 + hash(seed + k) * 0.03)) % 1;
    const px = x0 + u * w + v * h * 0.15 + Math.sin(abs * 0.7 + k) * 6,
      py = y0 + v * h;
    ctx.globalAlpha = Math.sin(v * Math.PI) * 0.7;
    ctx.fillStyle = "#fffbe8";
    ctx.beginPath();
    ctx.arc(px, py, 2 + hash(seed + k * 5) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function corridor(ctx: Ctx, abs = 0) {
  // cream wall, ceiling strip with two lit tubes
  fillBg(ctx, vgrad(ctx, 0, 1100, [[0, "#efe4c8"], [1, "#e2d3b0"]]));
  ctx.fillStyle = "#f6efdc";
  ctx.fillRect(-60, -60, W + 120, 250);
  inkLine(ctx, [[-40, 188], [W + 40, 182]], 57, 5);
  for (const lx of [200, 760]) {
    glow(ctx, lx, 140, 260, "rgba(255,255,240,0.5)");
    rr(ctx, lx - 120, 120, 240, 26, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  // two windows onto the playground's trees, the classroom door between them
  for (const x of [40, 700]) {
    const y = 330,
      w = 300,
      h = 380;
    ctx.save();
    rbox(ctx, x, y, w, h, 6, 60 + x, 2);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, y, y + h, [[0, "#a9dcf2"], [1, "#e9f6ee"]]);
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    rbox(ctx, x + 30, y + 190, 150, 200, 4, 61 + x, 1);
    paint(ctx, "#d9cdb4", null);
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = "rgba(120,140,160,0.45)";
      ctx.fillRect(x + 48, y + 214 + r * 46, 30, 22);
      ctx.fillRect(x + 110, y + 214 + r * 46, 30, 22);
    }
    for (let k = 0; k < 3; k++) {
      oval(ctx, x + 60 + k * 90, y + h - 60 - (k % 2) * 40, 80, 70, 62 + x + k, 3);
      paint(ctx, k % 2 ? "#7fb36a" : "#6aa05a", "#4f7d45", 4);
    }
    ctx.restore();
    rbox(ctx, x, y, w, h, 6, 60 + x, 2);
    paint(ctx, null, C.ink, 7);
    inkLine(ctx, [[x + w / 2, y], [x + w / 2, y + h]], 63 + x, 6, "#8a7f6a");
    inkLine(ctx, [[x, y + h / 2], [x + w, y + h / 2]], 66 + x, 6, "#8a7f6a");
    rbox(ctx, x - 16, y + h - 4, w + 32, 24, 4, 67 + x, 1);
    paint(ctx, "#d8c9a6", C.ink, 5);
    // 光影: the morning outside is bright — the panes glow and spill onto the wall round the frame
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, x + w / 2, y + h * 0.45, 330, "rgba(255,248,225,0.2)");
    ctx.restore();
  }
  shaded(ctx, () => rbox(ctx, 400, 360, 240, 720, 6, 68, 1.5), "#b9895a", () => {
    rbox(ctx, 440, 420, 160, 180, 4, 69, 1);
    paint(ctx, "rgba(190,225,240,0.9)", C.ink, 4);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(560, 360, 80, 720);
    inkLine(ctx, [[430, 660], [610, 660]], 74, 2.4, "rgba(0,0,0,0.25)");
  }, C.ink, 6);
  oval(ctx, 610, 760, 12, 12, 70, 0.6);
  paint(ctx, "#e8d39a", C.ink, 3);
  rr(ctx, 440, 300, 160, 46, 8);
  ctx.fillStyle = "#2f5b8a";
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, "高二(3)班", 520, 324, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  // green dado
  shaded(ctx, () => poly(ctx, [[-40, 900], [W + 40, 896], [W + 40, 1120], [-40, 1124]], 71, 1.5), "#7e9f88", () => {
    inkLine(ctx, [[-40, 910], [W + 40, 906]], 72, 4, "rgba(255,255,255,0.35)");
  }, C.ink, 5);
  // polished floor: tiles in perspective, window light lying on it
  shaded(ctx, () => poly(ctx, [[-40, 1120], [W + 40, 1110], [W + 40, H + 40], [-40, H + 40]], 73, 2), "#c4a57a", () => {
    for (let i = -6; i <= 6; i++) inkLine(ctx, [[540 + i * 60, 1120], [540 + i * 330, H + 40]], 75 + i, 2.6, "#a8885e");
    for (let r = 1; r < 6; r++) {
      const yy = 1120 + Math.pow(r / 5, 1.6) * 800;
      inkLine(ctx, [[-40, yy], [W + 40, yy - 4]], 90 + r, 2.4, "#a8885e");
    }
    // the polished floor mirrors the bright windows, faintly
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const x of [40, 700]) {
      ctx.fillStyle = vgrad(ctx, 1122, 1330, [[0, "rgba(225,240,255,0.16)"], [1, "rgba(225,240,255,0)"]]);
      ctx.fillRect(x + 8, 1122, 284, 210);
    }
    ctx.restore();
  }, C.ink, 6);
  // sunlight through the windows lying on the floor in four panes (the window bars' shadows between them)
  for (const x of [40, 700]) paneLight(ctx, [[x + 70, 1134], [x + 310, 1134], [x + 450, 1440], [x + 140, 1440]], "255,232,180", 0.24, 5, "panes");
  // soft shafts of it through the air, with dust turning in them
  for (const x of [40, 700])
    lightShaft(ctx, [[x + 10, 345], [x + 290, 345], [x + 440, 1132], [x + 70, 1132]], x + 150, 345, x + 330, 1500, "255,238,200", 0.16, 22, "shaft");
  // the shadowed corner where the wall meets the floor
  ctx.fillStyle = vgrad(ctx, 1110, 1190, [[0, "rgba(60,40,20,0.18)"], [1, "rgba(60,40,20,0)"]]);
  ctx.fillRect(-60, 1110, W + 120, 80);
  // away from the windows the corridor is in shade (the light has somewhere to come from)
  shadeAround(ctx, "58,38,24", 0.24, [[190, 540, 560], [850, 540, 560], [330, 1300, 460], [990, 1300, 460]], "shade");
  dust(ctx, abs, 60, 360, 300, 740, 300);
  dust(ctx, abs, 720, 360, 300, 740, 700);
}

/** `backDesks: false` leaves out the back row of empty desks (when a shot seats people at its own desks). */
export function classroom(ctx: Ctx, abs = 0, backDesks = true) {
  fillBg(ctx, vgrad(ctx, 0, 1100, [[0, "#ece0c3"], [1, "#ddcfae"]]));
  // clock above the board
  oval(ctx, 940, 222, 50, 50, 78, 1);
  paint(ctx, "#fbf7ee", C.ink, 5);
  inkLine(ctx, [[940, 222], [940, 190]], 77, 4);
  inkLine(ctx, [[940, 222], [964, 232]], 76, 4);
  // blackboard: wooden frame, smudged board, chalk notes and a diagram, a tray with chalk and the eraser
  rbox(ctx, 74, 284, 932, 452, 10, 75, 1.5);
  paint(ctx, "#8a6a44", C.ink, 7);
  shaded(ctx, () => rbox(ctx, 90, 300, 900, 420, 8, 80, 2), "#2f4a3c", () => {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 6; i++) {
      oval(ctx, 160 + hash(i * 2.2) * 760, 340 + hash(i * 3.3) * 330, 90, 30, 100 + i, 3, hash(i) * 0.6);
      ctx.fill();
    }
  }, C.ink, 6);
  ctx.save();
  ctx.globalAlpha = 0.75;
  inkLine(ctx, [[150, 380], [420, 372]], 81, 5, "#e8efe8");
  inkLine(ctx, [[150, 450], [600, 446]], 82, 5, "#e8efe8");
  inkLine(ctx, [[150, 520], [330, 516]], 83, 5, "#e8efe8");
  poly(ctx, [[660, 650], [940, 650], [940, 480]], 86, 1);
  paint(ctx, null, "#e8efe8", 4);
  poly(ctx, [[790, 562], [836, 534], [856, 570], [810, 598]], 87, 0.8);
  paint(ctx, null, "#e8efe8", 4);
  text(ctx, "F = ma", 790, 420, { size: 46, font: F.en, fill: "#e8efe8" });
  ctx.restore();
  rbox(ctx, 120, 722, 840, 20, 4, 88, 1);
  paint(ctx, "#8a6a44", C.ink, 4);
  for (const [x, col] of [[300, "#ffffff"], [334, "#ffd84a"], [368, "#ff9cc3"]] as [number, string][]) {
    rbox(ctx, x, 710, 24, 12, 3, 89 + x, 0.4);
    paint(ctx, col, C.ink, 2);
  }
  rbox(ctx, 760, 702, 92, 24, 4, 92, 0.6);
  paint(ctx, "#4b5b7a", C.ink, 3);
  // a back row of empty desks between the standing classmates
  for (let c = 0; c < (backDesks ? 4 : 0); c++) {
    const dx = 40 + c * 270;
    shaded(ctx, () => rbox(ctx, dx, 930, 200, 34, 5, 120 + c, 1), "#d79a55", () => {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(dx, 930, 200, 8);
    }, C.ink, 4);
    inkLine(ctx, [[dx + 20, 964], [dx + 20, 1076]], 124 + c, 6, "#6b6f7a");
    inkLine(ctx, [[dx + 180, 964], [dx + 180, 1076]], 128 + c, 6, "#6b6f7a");
  }
  // floor
  shaded(ctx, () => poly(ctx, [[-40, 1080], [W + 40, 1070], [W + 40, H + 40], [-40, H + 40]], 84, 2), "#b99a6c", () => {
    for (let i = -6; i <= 6; i++) inkLine(ctx, [[540 + i * 70, 1080], [540 + i * 300, H + 40]], 93 + i, 2.4, "#a5865a");
  }, C.ink, 6);
  // 光影: morning sun from the windows on the left — a broad soft beam across the room (the back row sits in it; the
  // middle, where he sits, is just outside it), its panes on the floor, the right of the room in shade
  lightShaft(ctx, [[-80, 100], [230, 100], [480, 1090], [-80, 1090]], 60, 100, 330, 1400, "255,236,190", 0.2, 26, "shaft");
  paneLight(ctx, [[-60, 1092], [250, 1092], [470, 1520], [-60, 1520]], "255,232,180", 0.22, 6, "panes");
  shadeAround(ctx, "58,38,24", 0.22, [[40, 520, 720], [120, 1300, 560]], "shade");
  dust(ctx, abs, 0, 160, 420, 900, 400, 14);
}

export function schoolDesk(ctx: Ctx, x: number, y: number, w: number) {
  shaded(ctx, () => rbox(ctx, x - w / 2, y, w, 70, 6, 85, 1.5), "#d79a55", () => {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x - w / 2, y, w, 12);
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 5; i++) inkLine(ctx, [[x - w / 2 + 20, y + 22 + i * 9], [x, y + 20 + i * 9 + jit(i, 2)], [x + w / 2 - 20, y + 24 + i * 9]], 140 + i, 2, "#a8743c");
    ctx.restore();
  }, C.ink, 6);
  shaded(ctx, () => rbox(ctx, x - w / 2 + 20, y + 70, w - 40, 260, 4, 86, 1.5), "#9c6b3a", () => {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x - w / 2 + 20, y + 70, w - 40, 30);
  }, C.ink, 6);
  // an open textbook and a pencil on the desk
  ctx.save();
  ctx.translate(x - w * 0.22, y + 18);
  ctx.rotate(-0.04);
  for (const side of [-1, 1]) {
    poly(ctx, [[0, -14], [side * 92, -20], [side * 96, 26], [0, 30]], 145 + side, 0.6);
    paint(ctx, "#fbf7ee", C.ink, 3.5);
    for (let k = 0; k < 3; k++) inkLine(ctx, [[side * 14, -4 + k * 10], [side * 80, -8 + k * 10]], 147 + side * 3 + k, 1.6, "rgba(0,0,0,0.3)");
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x + w * 0.24, y + 34);
  ctx.rotate(0.3);
  rbox(ctx, -60, -6, 120, 12, 3, 150, 0.4);
  paint(ctx, "#ffd84a", C.ink, 3);
  ctx.restore();
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
  for (const side of [-1, 1]) {
    poly(ctx, [[side * 380 - 18, 0], [side * 380 + 18, 0], [side * 470 + 22, 900], [side * 470 - 22, 900]], 100 + side, 1.5);
    paint(ctx, frame, C.ink, 6);
  }
  rbox(ctx, -440, -30, 880, 56, 6, 103, 1.5);
  paint(ctx, frame, C.ink, 6);
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
  for (const side of [-1, 1]) {
    poly(ctx, [[side * 300, 640], [side * 560, 640], [side * 560, 670], [side * 300, 670]], 120 + side, 1.5);
    paint(ctx, frame, C.ink, 5);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- street (night)
/** The walk home. Four layers that slide at different speeds as he walks (`scroll` = distance walked):
 *  sky and moon (almost still), a far skyline (0.25), the block of flats with lit windows (0.6), the lamps,
 *  pavement and road (1.0) — plus wires between the lamp posts. */
export function street(ctx: Ctx, abs: number, scroll: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0b1030"], [0.5, "#1d2350"], [1, "#0b0d1c"]]));
  for (let i = 0; i < 26; i++) {
    const x = ((hash(i * 1.7) * 1400 - scroll * 0.05) % 1400 + 1400) % 1400 - 160,
      y = 80 + hash(i * 2.9) * 520;
    ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(abs * 1.1 + i));
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.globalAlpha = 1;
  const mx = 820 - scroll * 0.03;
  glow(ctx, mx, 300, 230, "rgba(255,244,200,0.3)");
  oval(ctx, mx, 300, 52, 52, 129, 1.2);
  paint(ctx, "#fff2c4", null);
  // far skyline
  const far = 1600;
  for (let i = -1; i < 7; i++) {
    const bx = ((i * 260 - scroll * 0.25) % far + far) % far - 260;
    const bh = 420 + hash(i * 3 + 7) * 380;
    poly(ctx, [[bx, 1150], [bx, 1150 - bh], [bx + 220, 1150 - bh], [bx + 220, 1150]], 118 + i, 1);
    paint(ctx, "#151935", null);
    for (let k = 0; k < 6; k++)
      if (hash(i * 17 + k) > 0.55) {
        ctx.fillStyle = "rgba(255,214,140,0.45)";
        ctx.fillRect(bx + 20 + (k % 3) * 64, 1150 - bh + 40 + Math.floor(k / 3) * 90, 18, 22);
      }
  }
  // the block of flats: lit windows with frames, some with people celebrating, AC units
  const span = 1400;
  for (let i = -1; i < 5; i++) {
    const bx = ((i * 380 - scroll * 0.6) % span + span) % span - 300;
    const bh = 700 + hash(i + 40) * 300;
    shaded(ctx, () => rbox(ctx, bx, 1150 - bh, 330, bh + 20, 4, 130 + i, 2), "#1a1d3b", () => {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(bx, 1150 - bh, 40, bh + 20);
    }, C.ink, 6);
    rbox(ctx, bx - 8, 1150 - bh - 14, 346, 22, 3, 135 + i, 1);
    paint(ctx, "#232748", C.ink, 4);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 3; c++) {
        const wx = bx + 30 + c * 100,
          wy = 1150 - bh + 60 + r * 130;
        const on = hash(i * 31 + r * 7 + c) > 0.45;
        if (!on) {
          rbox(ctx, wx, wy, 70, 90, 3, 140 + r * 3 + c, 1);
          paint(ctx, "#121430", C.ink, 3);
          continue;
        }
        glow(ctx, wx + 35, wy + 45, 90, "rgba(255,200,120,0.18)");
        rbox(ctx, wx, wy, 70, 90, 3, 140 + r * 3 + c, 1);
        paint(ctx, "#ffd98a", C.ink, 4);
        inkLine(ctx, [[wx + 35, wy + 4], [wx + 35, wy + 86]], 160 + r + c, 2.4, "rgba(120,80,30,0.6)");
        if (hash(i * 13 + r + c * 5) > 0.6) {
          ctx.fillStyle = "#c48a3a";
          for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.arc(wx + 22 + k * 28, wy + 52 + Math.sin(abs * 8 + k + r) * 4, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(wx + 12 + k * 28, wy + 62, 20, 30);
          }
        } else {
          // a curtain half drawn
          poly(ctx, [[wx + 4, wy + 4], [wx + 30, wy + 4], [wx + 22, wy + 86], [wx + 4, wy + 86]], 170 + r + c, 0.6);
          paint(ctx, "rgba(220,130,90,0.55)", null);
        }
        if (hash(i * 7 + r * 3 + c) > 0.82) {
          rbox(ctx, wx + 12, wy + 96, 46, 24, 3, 175 + r + c, 0.6);
          paint(ctx, "#cfd3dc", C.ink, 3);
        }
      }
  }
  // lamp posts with wires sagging between them, cones of light and pools on the pavement
  const lamps: number[] = [];
  for (let i = -1; i < 3; i++) lamps.push(((i * 620 - scroll) % 1240 + 1240) % 1240 - 100);
  lamps.sort((a, b) => a - b);
  for (let k = 0; k < lamps.length - 1; k++) {
    const a = lamps[k],
      b = lamps[k + 1];
    if (b - a > 700) continue;
    inkLine(ctx, [[a, 790], [(a + b) / 2, 860], [b, 790]], 180 + k, 2.4, "#05060f");
    inkLine(ctx, [[a, 815], [(a + b) / 2, 890], [b, 815]], 184 + k, 2, "#05060f");
  }
  for (const [i, lx] of lamps.entries()) {
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
    inkLine(ctx, [[lx, 1460], [lx, 760], [lx + 60, 740]], 150 + i, 10, "#2a2d44");
    glow(ctx, lx + 70, 760, 300, "rgba(255,210,130,0.35)");
    oval(ctx, lx + 70, 754, 30, 16, 151 + i, 1);
    paint(ctx, "#ffe6a8", C.ink, 4);
  }
  // pavement (with tile joints and kerb), road with lane dashes
  shaded(ctx, () => poly(ctx, [[-60, 1150], [W + 60, 1140], [W + 60, 1330], [-60, 1336]], 160, 2), "#2b2c44", () => {
    const off = ((-scroll % 120) + 120) % 120;
    for (let x = -120 + off; x < W + 120; x += 120) inkLine(ctx, [[x, 1150], [x - 40, 1330]], 190 + Math.round(x), 2, "rgba(0,0,0,0.35)");
    inkLine(ctx, [[-60, 1236], [W + 60, 1230]], 197, 2, "rgba(0,0,0,0.3)");
  }, C.ink, 5);
  for (const lx of lamps) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,210,130,0.14)";
    ctx.beginPath();
    ctx.ellipse(lx + 70, 1250, 210, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  poly(ctx, [[-60, 1330], [W + 60, 1326], [W + 60, 1356], [-60, 1360]], 198, 1.5);
  paint(ctx, "#4a4b66", C.ink, 5);
  poly(ctx, [[-60, 1356], [W + 60, 1352], [W + 60, H + 60], [-60, H + 60]], 199, 2);
  paint(ctx, "#1c1d30", C.ink, 6);
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
    const yy = Math.min(y, 1500 + vy * 1.2 + 900 * 1.44) + fall * (120 + hash(i) * 120);
    const yf = t < 1.2 ? y : yy;
    if (yf > H + 40) continue;
    ctx.save();
    ctx.translate(x + Math.sin(abs * 3 + i) * 30 * clamp(t - 0.8), yf);
    ctx.rotate(abs * (2 + hash(i * 9) * 4) + i);
    // 美感: each piece tumbles — thin when edge-on, its back a shade darker, a glint as it turns to the light
    const flip = Math.cos(abs * (5 + hash(i * 5.3) * 7) + i * 1.7);
    ctx.scale(1, Math.max(0.12, Math.abs(flip)));
    const col = ["#ff5a7a", "#ffd84a", "#59c3ff", "#7ee081", "#c58bff"][i % 5];
    ctx.fillStyle = col;
    ctx.fillRect(-9, -5, 18, 10);
    if (flip < 0) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(-9, -5, 18, 10);
    } else if (flip > 0.93) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(-9, -5, 18, 10);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, x + Math.sin(abs * 3 + i) * 30 * clamp(t - 0.8), yf, 26, "rgba(255,250,230,0.5)");
    }
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

// ---------------------------------------------------------------- night lights out of focus
/** Out-of-focus lights far behind a close-up (the room / the street at night behind the phone): soft discs with a
 *  slightly brighter rim, drifting a little. `colors` are "r,g,b" strings. */
export function bokeh(ctx: Ctx, abs: number, n: number, seed: number, alpha = 1, colors: string[] = ["255,200,120", "150,180,255", "255,150,170"]) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const r = 40 + hash(seed + i * 3.1) * 90;
    const x = hash(seed + i * 1.3) * (W + 200) - 100 + Math.sin(abs * 0.3 + i) * 12,
      y = hash(seed + i * 2.7) * (H + 200) - 100 + Math.cos(abs * 0.25 + i * 1.7) * 10;
    const col = colors[i % colors.length];
    const a = alpha * (0.1 + hash(seed + i * 5.9) * 0.14) * (0.85 + 0.15 * Math.sin(abs * 1.3 + i * 2.1));
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, `rgba(${col},${(a * 0.7).toFixed(3)})`);
    g.addColorStop(0.85, `rgba(${col},${a.toFixed(3)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Behind the phone in his hands at the desk: his room, far out of focus — near-black blue, the candle a big warm
 *  disc low on the left (the only warm thing in his room) with its haze, the moonlit window a cold blur high on the
 *  right, a few small lights. Draw it OUTSIDE grade() (it is already dim and nearly colourless but for the flame);
 *  `candle` 0..1, `drift` slides it a little with his hand (parallax). */
export function roomBokeh(ctx: Ctx, abs: number, candle = 1, drift = 0) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0d1026"], [0.5, "#0a0c1c"], [1, "#05060b"]]));
  const fl = flicker(abs);
  const dx = drift * 0.6;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // the window and the moon
  glow(ctx, 940 + dx, 280, 620, "rgba(90,110,200,0.16)");
  bokehDisc(ctx, 965 + dx, 250, 125, "215,225,255", 0.2);
  bokehDisc(ctx, 820 + dx, 470, 46, "170,185,255", 0.12);
  // the candle and its haze
  if (candle > 0.01) {
    glow(ctx, 110 + dx, 1520, 900, `rgba(255,140,50,${(0.2 * fl * candle).toFixed(3)})`);
    bokehDisc(ctx, 150 + dx, 1470, 215, "255,165,75", 0.36 * fl * candle);
    bokehDisc(ctx, 380 + dx, 1730, 74, "255,190,110", 0.2 * candle);
    bokehDisc(ctx, 40 + dx, 1170, 58, "255,175,95", 0.14 * candle);
  }
  // the fairy lights on his wall, a sagging arc of small soft discs
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = -40 + t * 760 + dx * 1.2,
      y = 600 + 150 * 4 * t * (1 - t) + Math.sin(abs * 0.5 + i) * 3;
    bokehDisc(ctx, x, y, 34 + 6 * hash(i * 2.2), "255,226,182", 0.16 * (0.8 + 0.2 * Math.sin(abs * 1.7 + i * 2.3)));
  }
  // small far lights (the town through the window, the phone's own glow on the wall)
  for (let i = 0; i < 7; i++) {
    const x = 560 + hash(i * 3.1) * 520 + dx + Math.sin(abs * 0.3 + i) * 8,
      y = 120 + hash(i * 7.7) * 700 + Math.cos(abs * 0.25 + i) * 6;
    bokehDisc(ctx, x, y, 22 + hash(i * 1.9) * 40, i % 3 ? "160,175,240" : "255,205,150", 0.08 + 0.06 * hash(i * 4.4));
  }
  ctx.restore();
}
/** Behind the phone on the walk home: the street far out of focus — deep blue night, the lamp he has just stopped
 *  under as a huge soft disc high on the right, the lamps further down the street smaller and dimmer, a shop window's
 *  cold light low on the right. Draw it OUTSIDE grade(): its colours are already his — a cold blue night, lamps a
 *  colourless white (grey discs inside the grade read as dust, not lights). */
export function streetBokeh(ctx: Ctx, abs: number, drift = 0) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0c1028"], [0.55, "#0d1023"], [1, "#06070e"]]));
  const dx = drift * 0.6;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 880 + dx, 150, 760, "rgba(200,210,240,0.15)");
  bokehDisc(ctx, 890 + dx, 170, 240, "236,236,232", 0.3);
  const lamps: [number, number, number, number][] = [[150, 380, 130, 0.24], [320, 560, 84, 0.2], [440, 660, 58, 0.17], [520, 720, 40, 0.14], [70, 1060, 150, 0.12]];
  for (const [x, y, r, a] of lamps) bokehDisc(ctx, x + dx + Math.sin(abs * 0.4 + x) * 6, y, r, "232,232,228", a);
  glow(ctx, 1000 + dx, 1520, 560, "rgba(140,170,255,0.13)");
  for (let i = 0; i < 6; i++) {
    const x = 720 + hash(i * 2.9) * 380 + dx,
      y = 1250 + hash(i * 6.1) * 520;
    bokehDisc(ctx, x, y, 30 + hash(i * 3.7) * 50, i % 2 ? "150,175,255" : "220,230,255", 0.07 + 0.06 * hash(i * 8.3));
  }
  ctx.restore();
}
/** The cold light a lit phone screen throws into the air around it (call before drawing the phone, same centre). */
export function screenSpill(ctx: Ctx, cx: number, cy: number, s: number, a: number) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, cy);
  ctx.scale(1, 1.5);
  glow(ctx, 0, 0, 640 * s, "rgba(150,170,240,0.14)", a);
  ctx.restore();
}

// ---------------------------------------------------------------- the street below his window (act 5)
/** Looking down from his window: the block across the road with its lit windows (neighbours watching), a shop with a
 *  striped awning, the road, and the pavement outside his door where they wait in a warm pool of light. Drawn inside
 *  the camera; it reaches far above the frame for the crane move down from the night sky. */
export function streetBelow(ctx: Ctx, abs: number) {
  ctx.fillStyle = vgrad(ctx, -520, 200, [[0, "#0a0e2a"], [1, "#1b2148"]]);
  ctx.fillRect(-120, -560, W + 240, 820);
  for (let i = 0; i < 22; i++) {
    ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(abs * 1.2 + i));
    ctx.fillStyle = "#fff";
    ctx.fillRect(hash(i * 1.9) * W, -500 + hash(i * 3.7) * 360, 3, 3);
  }
  ctx.globalAlpha = 1;
  shaded(ctx, () => poly(ctx, [[-120, -150], [W + 120, -170], [W + 120, 660], [-120, 660]], 701, 1.5), "#1d2242", () => {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(-120, -170, 160, 830);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 6; c++) {
        const wx = 10 + c * 178,
          wy = -110 + r * 160;
        const lit = hash(r * 7.3 + c * 3.1 + 2) > 0.42;
        if (lit) glow(ctx, wx + 46, wy + 56, 110, "rgba(255,200,120,0.22)");
        rbox(ctx, wx, wy, 92, 112, 3, 702 + r * 6 + c, 0.8);
        paint(ctx, lit ? "#ffd98a" : "#141833", C.ink, 3.5);
        if (!lit) continue;
        inkLine(ctx, [[wx + 46, wy + 4], [wx + 46, wy + 108]], 730 + r * 6 + c, 2.4, "rgba(120,80,30,0.55)");
        if (hash(r * 2.1 + c * 5.3) > 0.55) {
          // a neighbour at the window, watching the crowd below
          ctx.fillStyle = "rgba(90,60,30,0.8)";
          ctx.beginPath();
          ctx.arc(wx + 26, wy + 62, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(wx + 15, wy + 74, 22, 38);
        }
      }
    rbox(ctx, 120, 520, 840, 140, 4, 760, 1);
    paint(ctx, "#2a2f55", C.ink, 4);
    glow(ctx, 540, 600, 420, "rgba(255,230,180,0.25)");
    for (let k = 0; k < 8; k++) {
      poly(ctx, [[120 + k * 105, 500], [225 + k * 105, 500], [215 + k * 105, 540], [130 + k * 105, 540]], 761 + k, 0.6);
      paint(ctx, k % 2 ? "#e8ece6" : "#d9534f", C.ink, 3);
    }
  }, C.ink, 6);
  poly(ctx, [[-120, 660], [W + 120, 660], [W + 120, 720], [-120, 720]], 770, 1);
  paint(ctx, "#2b2e48", C.ink, 4);
  shaded(ctx, () => poly(ctx, [[-120, 720], [W + 120, 720], [W + 120, 990], [-120, 990]], 771, 1), "#191b2d", () => {
    for (let i = 0; i < 6; i++) {
      rbox(ctx, 30 + i * 200, 846, 120, 14, 5, 772 + i, 0.6);
      paint(ctx, "#4a4b66", null);
    }
  }, C.ink, 5);
  poly(ctx, [[-120, 990], [W + 120, 986], [W + 120, 1016], [-120, 1020]], 780, 1);
  paint(ctx, "#4a4b66", C.ink, 4);
  shaded(ctx, () => poly(ctx, [[-120, 1020], [W + 120, 1016], [W + 120, H + 400], [-120, H + 400]], 781, 1.5), "#2f3352", () => {
    for (let x = -120; x < W + 120; x += 120) inkLine(ctx, [[x, 1020], [x - 60, H + 200]], 782 + x, 2, "rgba(0,0,0,0.3)");
    for (let y = 1110; y < H + 200; y += 110) inkLine(ctx, [[-120, y], [W + 120, y - 4]], 790 + y, 2, "rgba(0,0,0,0.3)");
  }, C.ink, 5);
  glow(ctx, 540, 1200, 680, "rgba(255,214,140,0.35)");
  // a bush in a planter by the lamp
  rbox(ctx, 200, 1300, 170, 70, 8, 795, 1);
  paint(ctx, "#5a4a3a", C.ink, 4);
  for (let k = 0; k < 5; k++) {
    oval(ctx, 220 + k * 32, 1290 - (k % 2) * 14, 40, 34, 796 + k, 1.5);
    paint(ctx, "#2f5a3a", C.ink, 3.5);
  }
}

// ---------------------------------------------------------------- the door of his block (the party)
/** Downstairs at night, where the party happens: tiled facade, the warm lobby door right behind him (a rim of light),
 *  a wall lamp and doorbell panel, fairy lights sagging across the top, windows above, the pavement. Draw it through
 *  filtered(..., "blur(2px)") so the people in front stay sharp. */
export function buildingEntrance(ctx: Ctx, abs: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#171c3c"], [1, "#0d1024"]]));
  shaded(ctx, () => poly(ctx, [[-120, -200], [W + 120, -200], [W + 120, 1300], [-120, 1300]], 801, 1), "#2a2f52", () => {
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    let row = 0;
    for (let y = -180; y < 1300; y += 46, row++) {
      ctx.beginPath();
      ctx.moveTo(-120, y);
      ctx.lineTo(W + 120, y);
      ctx.stroke();
      for (let x = (row % 2) * 60 - 120; x < W + 120; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 46);
        ctx.stroke();
      }
    }
    for (const [x, y, lit] of [[60, 60, 1], [860, 40, 0], [80, -180, 0], [880, -200, 1]] as [number, number, number][]) {
      if (lit) glow(ctx, x + 70, y + 80, 160, "rgba(255,200,120,0.3)");
      rbox(ctx, x, y, 140, 170, 4, 802 + x + y, 1);
      paint(ctx, lit ? "#ffd98a" : "#151933", C.ink, 4);
      inkLine(ctx, [[x + 70, y + 4], [x + 70, y + 166]], 806 + x, 3, "rgba(80,60,40,0.5)");
    }
  }, C.ink, 6);
  glow(ctx, 540, 780, 700, "rgba(255,200,120,0.5)");
  shaded(ctx, () => rbox(ctx, 350, 430, 380, 660, 14, 810, 1.5), "#ffe2a8", () => {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(350, 430, 380, 120);
    ctx.fillStyle = "rgba(200,140,60,0.25)";
    ctx.fillRect(350, 900, 380, 200);
    inkLine(ctx, [[540, 430], [540, 1090]], 811, 5, "rgba(120,80,30,0.7)");
  }, C.ink, 8);
  rbox(ctx, 300, 380, 480, 46, 8, 812, 1);
  paint(ctx, "#3a3f62", C.ink, 5);
  glow(ctx, 830, 560, 160, "rgba(255,220,150,0.6)");
  rbox(ctx, 808, 530, 44, 60, 10, 813, 0.8);
  paint(ctx, "#ffe6a8", C.ink, 4);
  rbox(ctx, 270, 620, 50, 110, 6, 814, 0.6);
  paint(ctx, "#8a8fa8", C.ink, 3.5);
  for (let k = 0; k < 4; k++) {
    oval(ctx, 295, 645 + k * 22, 6, 6, 815 + k, 0.3);
    paint(ctx, "#d9dde8", null);
  }
  const wire: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    wire.push([-60 + u * (W + 120), 250 + Math.sin(u * Math.PI) * 90]);
  }
  curve(ctx, wire, 820, 1);
  paint(ctx, null, "#111", 2.5);
  for (let i = 1; i < 14; i++) {
    const [bx, by] = wire[i];
    const col = ["#ffd84a", "#ff7fb0", "#7ee0ff", "#b6ff8a"][i % 4];
    glow(ctx, bx, by + 12, 46, col, 0.5 + 0.5 * Math.sin(abs * 3 + i));
    oval(ctx, bx, by + 12, 9, 12, 821 + i, 0.4);
    paint(ctx, col, C.ink, 2.5);
  }
  shaded(ctx, () => poly(ctx, [[-120, 1300], [W + 120, 1290], [W + 120, H + 120], [-120, H + 120]], 840, 1.5), "#34385a", () => {
    for (let x = -120; x < W + 120; x += 130) inkLine(ctx, [[x, 1300], [x - 50, H + 100]], 841 + x, 2, "rgba(0,0,0,0.3)");
    inkLine(ctx, [[-120, 1460], [W + 120, 1452]], 850, 2, "rgba(0,0,0,0.3)");
  }, C.ink, 5);
}

// ---------------------------------------------------------------- the big cake (bakery window → the party)
/** The two-tier birthday cake in the bakery window — the one he looks at and can't buy, and the one the friends bring
 *  downstairs (with a gold "17" candle). (x, y) = the foot of the cake stand; s = 1 → about 420 wide, 480 tall. */
export function bigCake(ctx: Ctx, x: number, y: number, s: number, abs: number, opts: { candle17?: boolean; lit?: number } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // the stand
  shaded(ctx, () => blob(ctx, [[-64, 0], [64, 0], [36, -34], [18, -52], [-18, -52], [-36, -34]], 2001, 1), "#f2f2f5", () => {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(10, -60, 60, 60);
  }, C.ink, 5);
  oval(ctx, 0, -58, 250, 24, 2002, 1.4);
  paint(ctx, "#fbfbfd", C.ink, 5);
  const tier = (w: number, h: number, by: number, seed: number) => {
    shaded(ctx, () => rbox(ctx, -w / 2, by - h, w, h, 26, seed, 1.2), "#fff6f0", () => {
      ctx.fillStyle = "rgba(200,165,150,0.25)";
      ctx.fillRect(w / 2 - 64, by - h, 64, h);
      // pink drip running down from the top edge
      const pts: Pt[] = [[-w / 2 - 12, by - h - 24]];
      for (let i = 0; i <= 12; i++) pts.push([-w / 2 + (i / 12) * w, by - h + (i % 2 ? 28 + hash(seed + i) * 44 : 14)]);
      pts.push([w / 2 + 12, by - h - 24]);
      blob(ctx, pts, seed + 1, 1.2);
      paint(ctx, "#ff9cc3", null);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(-w / 2 + 18, by - h + 50, 14, h - 70);
    }, C.ink, 5);
  };
  tier(400, 200, -60, 2003);
  tier(270, 150, -260, 2005);
  // piped cream along both top edges
  for (let i = 0; i < 9; i++) {
    oval(ctx, -180 + i * 45, -262, 18, 12, 2010 + i, 0.6);
    paint(ctx, "#fffaf6", C.ink, 3);
  }
  for (let i = 0; i < 6; i++) {
    oval(ctx, -112 + i * 45, -412, 16, 11, 2020 + i, 0.6);
    paint(ctx, "#fffaf6", C.ink, 3);
  }
  text(ctx, "Happy Birthday", 0, -150, { size: 42, font: F.en, fill: "#e8508a" });
  // strawberries on top
  for (let i = 0; i < 5; i++) {
    const sx = -90 + i * 45,
      sy = -432 - (i % 2) * 10;
    blob(ctx, [[sx - 16, sy - 6], [sx + 16, sy - 6], [sx + 10, sy + 16], [sx, sy + 24], [sx - 10, sy + 16]], 2030 + i, 0.8);
    paint(ctx, "#e8343c", C.ink, 3);
    poly(ctx, [[sx - 12, sy - 8], [sx, sy - 18], [sx + 12, sy - 8], [sx, sy - 4]], 2040 + i, 0.5);
    paint(ctx, "#5aa36b", C.ink, 2);
  }
  if (opts.candle17) {
    // a gold "17" number candle in the middle, lit
    ctx.save();
    ctx.translate(0, -500);
    ctx.font = `400 120px ${F.marker}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 14;
    ctx.strokeStyle = C.ink;
    ctx.strokeText("17", 0, 0);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText("17", 0, 0);
    const lit = opts.lit ?? 1;
    if (lit > 0.01)
      for (const fx of [-26, 24]) {
        const fl = 1 + Math.sin(abs * 23 + fx) * 0.08;
        glow(ctx, fx, -96, 70, "rgba(255,190,90,0.5)", lit);
        ctx.save();
        ctx.translate(fx, -76);
        ctx.scale(lit * fl * 0.55, lit * fl * 0.55);
        blob(ctx, [[0, -78], [22, -30], [20, 0], [0, 12], [-20, 0], [-22, -30]], 2050 + fx, 1.2);
        paint(ctx, "#ffb43a", "#e0701a", 3);
        ctx.restore();
      }
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
/** Previews of whole sets: the 1080×1920 design frame. */
const FRAME = { width: 1080, height: 1920, duration: 3, prepare: loadFonts };

export const resources = defineResources({
  bedroom: resource({
    kind: "set",
    title: "卧室（夜）",
    description: "他的卧室：深蓝墙、串灯和拍立得（FAIRY_BULBS 是灯泡位置）、日历、书架、窗外月亮云和星星。moon 0..1 月光，clue 0..1 窗外楼下的手电和横幅（彩蛋）。房间压暗后用 fairyGlow 补上串灯的光。",
    tags: ["卧室", "房间", "夜晚", "窗户", "月亮", "串灯"],
    usage: "bedroom(ctx, abs, moon, clue)",
    params: z.object({
      moon: z.number().min(0).max(1).default(1).describe("月光"),
      clue: z.number().min(0).max(1).default(0).describe("窗外楼下的手电和横幅"),
    }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        bedroom(ctx, t, p.moon, p.clue);
        fairyGlow(ctx, t);
      },
    },
  }),
  desk: resource({
    kind: "set",
    title: "书桌（桌面）",
    description: "画面下半部分的木书桌桌面（木纹、前沿的暖色高光），y 是桌面上沿。和 bedroom、cupcake 一起组成生日书桌。",
    tags: ["书桌", "桌子", "桌面"],
    usage: "desk(ctx, y)",
    params: z.object({ y: z.number().min(600).max(1800).default(1200).describe("桌面上沿") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        bedroom(ctx, t);
        desk(ctx, p.y);
      },
    },
  }),
  cupcake: resource({
    kind: "prop",
    title: "小蛋糕（蜡烛）",
    description: "插着蜡烛的纸杯蛋糕：lit 0 灭 1 燃，smoke 0..1 吹灭后的烟，candles 根数。part: body 只画蛋糕、flame 只画火苗和光（火苗画在压暗/去饱和外面保持彩色）。",
    tags: ["蛋糕", "蜡烛", "生日", "火苗"],
    usage: "cupcake(ctx, x, y, s, abs, lit, smoke, candles, part)",
    params: z.object({
      lit: z.number().min(0).max(1).default(1).describe("点燃"),
      smoke: z.number().min(0).max(1).default(0).describe("吹灭后的烟"),
      candles: z.number().int().min(1).max(3).default(1).describe("蜡烛数"),
    }),
    presets: { 吹灭: { lit: 0, smoke: 0.6 } },
    preview: {
      width: 600,
      height: 700,
      duration: 3,
      background: "#141a33",
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        cupcake(ctx, 300, 560, 1.6, t, p.lit, p.smoke, p.candles);
      },
    },
  }),
  partyHorn: resource({
    kind: "prop",
    title: "派对喇叭（吹龙）",
    description: "叼在嘴上的派对吹龙，(x, y) 是嘴：u 0 卷着、1 吹到最长；droop 0..1 泄气下垂（难过的时候）。",
    tags: ["派对", "喇叭", "生日", "吹龙"],
    usage: "partyHorn(ctx, x, y, u, droop, abs, dir)",
    params: z.object({
      u: z.number().min(0).max(1).default(1).describe("吹出来多少"),
      droop: z.number().min(0).max(1).default(0).describe("泄气下垂"),
    }),
    preview: {
      width: 700,
      height: 400,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        partyHorn(ctx, 120, 200, p.u, p.droop, t);
      },
    },
  }),
  corridor: resource({
    kind: "set",
    title: "学校走廊（白天）",
    description: "奶油色的学校走廊：两根灯管、窗户的阳光和光柱、地上的窗格光、「高二(3)班」门牌（换故事要改）。",
    tags: ["学校", "走廊", "白天", "阳光"],
    usage: "corridor(ctx, abs)",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        corridor(ctx, t);
      },
    },
  }),
  classroom: resource({
    kind: "set",
    title: "教室（白天）",
    description: "教室：黑板上方的钟、窗户阳光、浮尘。backDesks: false 去掉后排的空课桌（镜头自己摆人和课桌时）。",
    tags: ["学校", "教室", "黑板", "白天"],
    usage: "classroom(ctx, abs, backDesks)",
    params: z.object({ backDesks: z.boolean().default(true).describe("后排空课桌") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        classroom(ctx, t, p.backDesks);
      },
    },
  }),
  schoolDesk: resource({
    kind: "prop",
    title: "课桌",
    description: "木课桌：(x, y) 桌面中点的上沿，w 宽度。先画坐着的人再画课桌。",
    tags: ["课桌", "学校", "桌子"],
    usage: "schoolDesk(ctx, x, y, w)",
    preview: {
      width: 700,
      height: 400,
      draw(ctx, t) {
        beginFrame(ctx, t);
        schoolDesk(ctx, 350, 120, 520);
      },
    },
  }),
  park: resource({
    kind: "set",
    title: "公园（黄昏）和秋千",
    description: "封面的公园：parkSky 天空（dusk 0 金色夕阳 → 1 夜晚）、hedge 树丛、swingSet A 字秋千架（返回挂人的位置，draw.left/right 在秋千上画人，angles 是两个秋千的摆角）。",
    tags: ["公园", "黄昏", "夕阳", "秋千", "封面"],
    usage: "parkSky(ctx, dusk); hedge(ctx, y, dusk); swingSet(ctx, x, y, s, dusk, { angles: [a, b], left: (c, sx, sy, ang) => … })",
    params: z.object({ dusk: z.number().min(0).max(1).default(0.2).describe("0 夕阳 … 1 夜晚") }),
    presets: { 夜晚: { dusk: 1 } },
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        parkSky(ctx, p.dusk);
        hedge(ctx, 1300, p.dusk);
        const swing = Math.sin(t * 2) * 0.25;
        swingSet(ctx, 540, 1250, 1, p.dusk, { angles: [swing, -swing * 0.6] });
      },
    },
  }),
  street: resource({
    kind: "set",
    title: "回家的街（夜，视差）",
    description: "走回家的街：四层按不同速度滑动（scroll = 走过的距离）：天空和月亮几乎不动、远处天际线 0.25、亮着窗的楼 0.6、路灯人行道和马路 1.0，路灯之间有电线。",
    tags: ["街道", "夜晚", "视差", "回家", "路灯"],
    usage: "street(ctx, abs, scroll)",
    params: z.object({ speed: z.number().min(0).max(800).default(300).describe("预览里每秒走多远（scroll 随时间增加）") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        street(ctx, t, t * p.speed);
      },
    },
  }),
  streetBelow: resource({
    kind: "set",
    title: "窗外街景（俯视）",
    description: "从他的窗户往下看：对面楼亮着的窗（邻居在看）、有条纹雨棚的小店、马路、门口暖光里等他的人。画在镜头里，往上延伸到画面外（从夜空摇下来的镜头）。",
    tags: ["街景", "俯视", "窗外", "夜晚"],
    usage: "streetBelow(ctx, abs)  // 在 camera 里，向上延伸到 y = -560",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        ctx.translate(0, 700);
        streetBelow(ctx, t);
      },
    },
  }),
  buildingEntrance: resource({
    kind: "set",
    title: "楼门口（夜，派对）",
    description: "晚上楼下派对的地方：瓷砖墙面、身后暖光的大堂门（轮廓光）、壁灯和门铃面板、顶上垂着的串灯、楼上的窗、人行道。用 filtered(…, \"blur(2px)\") 画，让前面的人保持清晰。",
    tags: ["楼门口", "夜晚", "派对", "大门"],
    usage: "filtered(ctx, \"blur(2px)\", (c) => buildingEntrance(c, abs), \"bg\")",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        buildingEntrance(ctx, t);
      },
    },
  }),
  bigCake: resource({
    kind: "prop",
    title: "双层生日蛋糕",
    description: "面包店橱窗里的双层蛋糕（他看着买不起的那个），也是朋友们端下楼的那个（candle17 金色「17」蜡烛，lit 点燃）。(x, y) 是蛋糕架的底，s = 1 约 420 宽 480 高。",
    tags: ["蛋糕", "生日", "蜡烛", "派对"],
    usage: "bigCake(ctx, x, y, s, abs, { candle17, lit })",
    params: z.object({ candle17: z.boolean().default(false).describe("金色「17」蜡烛"), lit: z.number().min(0).max(1).default(1).describe("蜡烛点燃") }),
    presets: { 派对: { candle17: true } },
    preview: {
      width: 700,
      height: 800,
      duration: 3,
      background: "#2a2440",
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        bigCake(ctx, 350, 700, 1.2, t, p);
      },
    },
  }),
  lampPost: resource({
    kind: "prop",
    title: "路灯（闪着亮起）",
    description: "路灯在 on 秒时闪几下亮起，带一圈暖光。",
    tags: ["路灯", "夜晚", "街道", "灯"],
    usage: "lampPost(ctx, x, y, abs, on)",
    preview: {
      width: 700,
      height: 1200,
      duration: 2,
      background: "#141a33",
      draw(ctx, t) {
        beginFrame(ctx, t);
        lampPost(ctx, 250, 200, t, 0.6);
      },
    },
  }),
  confetti: resource({
    kind: "effect",
    title: "彩带礼花",
    description: "t0 秒时从画面下方喷出的彩带（翻转闪光），之后落下。",
    tags: ["彩带", "礼花", "派对", "庆祝"],
    usage: "confetti(ctx, abs, t0, count, seed)",
    params: z.object({ count: z.number().int().min(10).max(300).default(90).describe("数量") }),
    preview: {
      ...FRAME,
      background: "#1a1d33",
      draw(ctx, t, p) {
        confetti(ctx, t, 0.2, p.count);
      },
    },
  }),
  heartsRise: resource({
    kind: "effect",
    title: "飘起的爱心",
    description: "爱心往上飘（画面外的情侣）；crack 0..1 让爱心裂开。单个爱心用 heart(ctx, x, y, r, color, seed, crack)。",
    tags: ["爱心", "恋爱", "情侣", "飘"],
    usage: "heartsRise(ctx, abs, count, seed, alpha, crack)",
    params: z.object({ crack: z.number().min(0).max(1).default(0).describe("裂开") }),
    preview: {
      ...FRAME,
      background: "#f3c6cf",
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        heartsRise(ctx, t + 4, 14, 5, 1, p.crack);
      },
    },
  }),
  bokeh: resource({
    kind: "effect",
    title: "光斑（背景虚化）",
    description: "特写后面很远的虚化光点：柔和的圆盘、边缘稍亮、慢慢漂。roomBokeh 是他书桌后的房间（蜡烛的大暖斑），streetBokeh 是回家路上的街（头顶的路灯）。画在 grade 外面、用低饱和的颜色（灰色光斑像灰尘球）。",
    tags: ["光斑", "虚化", "景深", "背景"],
    usage: "bokeh(ctx, abs, n, seed, alpha, colors) / roomBokeh(ctx, abs, candle, drift) / streetBokeh(ctx, abs, drift)",
    params: z.object({ which: z.enum(["bokeh", "room", "street"]).default("room").describe("哪一种") }),
    preview: {
      ...FRAME,
      background: "#0b0e1f",
      draw(ctx, t, p) {
        if (p.which === "room") roomBokeh(ctx, t, 1, t * 10);
        else if (p.which === "street") streetBokeh(ctx, t, t * 10);
        else bokeh(ctx, t, 24, 3);
      },
    },
  }),
  screenSpill: resource({
    kind: "effect",
    title: "屏幕光",
    description: "亮着的手机屏幕照在周围空气里的冷光；在画手机之前调用，中心和手机相同。",
    tags: ["屏幕光", "手机", "冷光", "夜晚"],
    usage: "screenSpill(ctx, cx, cy, s, a)",
    params: z.object({ a: z.number().min(0).max(1).default(1).describe("强度") }),
    preview: {
      width: 1080,
      height: 1200,
      background: "#0b0e1f",
      draw(ctx, t, p) {
        screenSpill(ctx, 540, 600, 0.8, p.a);
      },
    },
  }),
  lightPool: resource({
    kind: "effect",
    title: "光圈（四周压暗）",
    description: "四周压暗，只留一圈暖光（台灯、蜡烛、路灯下）。",
    tags: ["光圈", "压暗", "暖光", "聚光"],
    usage: "lightPool(ctx, x, y, r, dark, warm)",
    params: z.object({ dark: z.number().min(0).max(1).default(0.7).describe("四周多暗") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        corridor(ctx, t);
        lightPool(ctx, 540, 1100, 380, p.dark);
      },
    },
  }),
});
