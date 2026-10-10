/**
 * 《unhappy》的场景（设计坐标 1080×1920 整幅）：玄关、他的卧室和被子、房门走廊、雨夜街道和宠物店橱窗、公交站、宠物医院（门口、前台、
 * 手术室走廊、住院笼）、封面的树；聊天版加了女生房间、从黑板拍的教室和课桌、从后排拍的黑板、学校走廊、清晨街道和便利店。
 * 天气：雨 rain、水花 splashes、水洼 puddle；道具：存钱罐、心脏病传单、草莓牛奶、课本、抱枕。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, H, Pt, W, beginFrame, blob, curve, fillBg, glow, hash, inkLine, loadFonts, oval, paint, poly, rbox, rr, shaded, text, tubePts, vgrad } from "./draw";
import { ballToy, drawDog, fluffPuppy } from "./dog";
import { drawKid, helmetProp } from "./kid";

/** Environments for 「unhappy」: the flat's entrance, his bedroom, the rainy street with the pet shop,
 *  the bus stop, the pet hospital (counter, surgery hallway, recovery room) and the tree from the cover.
 *  All drawn in 1080×1920 design units, hand-drawn line style. */

export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const k = clamp(t);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// ---------------------------------------------------------------- rain
/** Rain streaks over the whole frame. `k` intensity 0..1, `wind` slant. */
export function rain(ctx: Ctx, abs: number, k = 1, wind = 0.18, seed = 3, color = "rgba(200,220,255,0.55)") {
  if (k <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const n = Math.round(150 * k);
  for (let i = 0; i < n; i++) {
    const speed = 1900 + hash(seed + i) * 900;
    const len = 40 + hash(seed + i * 3) * 50;
    const x0 = hash(seed + i * 7) * (W + 400) - 200;
    const y = ((abs * speed + hash(seed + i * 11) * 2400) % 2300) - 200;
    const x = x0 + y * wind;
    ctx.lineWidth = 2 + hash(seed + i * 13) * 2;
    ctx.globalAlpha = 0.35 + hash(seed + i * 17) * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * wind, y + len);
    ctx.stroke();
  }
  ctx.restore();
}
/** Splash rings on a ground band between y0 and y1. */
export function splashes(ctx: Ctx, abs: number, y0: number, y1: number, k = 1, seed = 9) {
  if (k <= 0) return;
  ctx.save();
  ctx.strokeStyle = "rgba(210,225,255,0.6)";
  ctx.lineWidth = 2;
  const n = Math.round(26 * k);
  for (let i = 0; i < n; i++) {
    const period = 0.5 + hash(seed + i) * 0.4;
    const t = ((abs + hash(seed + i * 3) * 3) % period) / period;
    const cycle = Math.floor((abs + hash(seed + i * 3) * 3) / period);
    const x = hash(seed + i * 5 + cycle * 1.7) * W;
    const y = y0 + hash(seed + i * 7 + cycle * 2.3) * (y1 - y0);
    const sc = 0.6 + ((y - y0) / Math.max(1, y1 - y0)) * 0.8;
    ctx.globalAlpha = (1 - t) * 0.8;
    ctx.beginPath();
    ctx.ellipse(x, y, (6 + t * 26) * sc, (2 + t * 7) * sc, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- small props
export function coinJar(ctx: Ctx, x: number, y: number, s: number, fill: number, seed = 3100) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // coins inside
  ctx.save();
  rbox(ctx, -52, -96, 104, 120, 22, seed, 1.2);
  ctx.clip();
  const top = 24 - 112 * clamp(fill);
  for (let i = 0; i < 40; i++) {
    const cx = -46 + hash(seed + i) * 92,
      cy = top + hash(seed + i * 3) * (26 - top);
    if (cy < top) continue;
    oval(ctx, cx, cy, 12, 6, seed + i, 0.4, hash(i) * 0.6 - 0.3);
    paint(ctx, i % 3 ? "#e9c45a" : "#c9a23a", "#8a6a1a", 2);
  }
  ctx.fillStyle = "rgba(220,240,255,0.18)";
  ctx.fillRect(-60, -110, 120, 140);
  ctx.restore();
  rbox(ctx, -52, -96, 104, 120, 22, seed, 1.2);
  paint(ctx, null, C.ink, 4.5);
  // glare + lid + label
  inkLine(ctx, [[-36, -76], [-38, -20]], seed + 1, 5, "rgba(255,255,255,0.6)");
  rbox(ctx, -44, -118, 88, 26, 6, seed + 2, 1);
  paint(ctx, "#b8452f", C.ink, 4);
  rbox(ctx, -36, -62, 72, 44, 6, seed + 3, 1);
  paint(ctx, "#fff7e3", C.ink, 3);
  text(ctx, "豆豆", 0, -40, { size: 26, font: F.cn, fill: "#c0392b" });
  ctx.restore();
}

/** The vet's flyer about canine heart disease (clue on the hall table). */
export function vetFlyer(ctx: Ctx, x: number, y: number, s: number, rot: number, seed = 3200) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  poly(ctx, [[-70, -90], [70, -94], [74, 90], [-66, 94]], seed, 1.2);
  paint(ctx, "#f7f4ec", C.ink, 4);
  text(ctx, "宠物医院", 0, -66, { size: 20, font: F.ui, weight: 700, fill: "#2f7d5b" });
  // red heart with a crack
  blob(ctx, [[0, -10], [-18, -30], [-34, -24], [-34, -4], [0, 26], [34, -4], [34, -24], [18, -30]], seed + 1, 0.8);
  paint(ctx, "#e8505b", C.ink, 3);
  inkLine(ctx, [[0, -10], [-6, 2], [4, 8], [-2, 20]], seed + 2, 2.5, "#fff");
  text(ctx, "犬心脏病", 0, 46, { size: 22, font: F.ui, weight: 700, fill: "#222" });
  for (let i = 0; i < 3; i++) inkLine(ctx, [[-50, 64 + i * 10], [50 - i * 14, 64 + i * 10]], seed + 3 + i, 2, "#aaa");
  ctx.restore();
}

function wallCalendar(ctx: Ctx, x: number, y: number, s: number, seed: number, circle = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  poly(ctx, [[-80, -90], [80, -90], [80, 100], [-80, 100]], seed, 1);
  paint(ctx, "#f2eee4", C.ink, 4);
  poly(ctx, [[-80, -90], [80, -90], [80, -54], [-80, -54]], seed + 1, 0.8);
  paint(ctx, "#c94a3a", C.ink, 3);
  text(ctx, "10月", 0, -72, { size: 24, font: F.ui, weight: 700, fill: "#fff" });
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const cx = -60 + c * 30,
        cy = -30 + r * 32;
      const idx = r * 5 + c;
      if (idx < 13) inkLine(ctx, [[cx - 8, cy - 8], [cx + 8, cy + 8]], seed + 10 + idx, 2.4, "#555");
      else text(ctx, String(idx + 1), cx, cy, { size: 16, font: F.ui, fill: "#666" });
      if (circle && idx === 15) {
        oval(ctx, cx, cy, 15, 13, seed + 40, 1);
        paint(ctx, null, C.red, 3.5);
      }
    }
  ctx.restore();
}

/** Framed photo of the boy hugging the puppy (on the hall wall). */
function framedPhoto(ctx: Ctx, x: number, y: number, s: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.04);
  ctx.scale(s, s);
  poly(ctx, [[-70, -56], [70, -56], [70, 56], [-70, 56]], seed, 1);
  paint(ctx, "#a37a4c", C.ink, 5);
  poly(ctx, [[-56, -42], [56, -42], [56, 42], [-56, 42]], seed + 1, 0.8);
  paint(ctx, "#cfe3ee", C.ink, 3);
  // tiny doodle: kid face + puppy face
  oval(ctx, -18, 0, 18, 18, seed + 2, 0.6);
  paint(ctx, C.skin, C.ink, 2.5);
  poly(ctx, [[-38, -6], [-30, -24], [-14, -26], [0, -18], [2, -4]], seed + 3, 0.6);
  paint(ctx, C.hair, C.ink, 2.5);
  oval(ctx, 22, 8, 16, 14, seed + 4, 0.6);
  paint(ctx, "#f1dfba", C.ink, 2.5);
  oval(ctx, 17, 6, 6, 6, seed + 5, 0.4);
  paint(ctx, "#6f4424", null);
  ctx.restore();
}

// ---------------------------------------------------------------- the flat: entrance hall
export interface EntranceOpts {
  /** 0 = night (lamp), 1 = dawn (blue) */
  light?: number;
  /** front door opening 0..1 (corridor light spills in) */
  door?: number;
  helmet?: boolean;
  jacket?: boolean; // yellow rider jacket on the hook
  jar?: number; // coin jar fill
  bowl?: boolean;
  /** horizontal camera pan in px (parallax) */
  pan?: number;
}
export function entrance(ctx: Ctx, abs: number, o: EntranceOpts = {}) {
  const dawn = o.light ?? 0;
  const pan = o.pan ?? 0;
  const door = clamp(o.door ?? 0);
  // wall + floor
  fillBg(ctx, vgrad(ctx, 0, 1160, [[0, mix("#20253f", "#3f4f78", dawn)], [1, mix("#2c3152", "#5a6a92", dawn)]]));
  ctx.save();
  ctx.translate(pan * 0.6, 0);
  // wainscot line
  inkLine(ctx, [[-80, 820], [1160, 816]], 1, 4, "rgba(0,0,0,0.35)");
  // wall items: calendar (surgery date circled), framed photo, coat hook with the rider jacket
  wallCalendar(ctx, 150, 520, 1, 10);
  framedPhoto(ctx, 400, 470, 1, 20);
  inkLine(ctx, [[520, 360], [600, 360]], 30, 6, "#6a5040");
  for (const hx of [540, 580]) {
    oval(ctx, hx, 372, 7, 7, 31 + hx, 0.4);
    paint(ctx, "#b9a38a", C.ink, 2.5);
  }
  if (o.jacket) {
    // the yellow jacket hanging on the hook (clue)
    blob(ctx, [[540, 372], [600, 380], [628, 470], [610, 640], [520, 646], [500, 470]], 32, 1.4);
    paint(ctx, "#f3b30c", C.ink, 4.5);
    poly(ctx, [[506, 540], [622, 534], [620, 556], [504, 562]], 33, 0.8);
    paint(ctx, "#e3e7ea", C.ink, 2.5);
    inkLine(ctx, [[560, 386], [562, 640]], 34, 2.5, "#8a6400");
  }
  ctx.restore();
  // floor with planks converging toward the back
  poly(ctx, [[-80, 1160], [1160, 1150], [1160, 2000], [-80, 2000]], 40, 1.5);
  paint(ctx, mix("#4a3428", "#6b5444", dawn), C.ink, 6);
  for (let i = -6; i <= 12; i++) {
    const x0 = 540 + i * 120 + pan;
    inkLine(ctx, [[540 + (x0 - 540) * 0.35, 1160], [x0 + (x0 - 540) * 0.9, 1960]], 41 + i, 2.4, "rgba(0,0,0,0.28)");
  }
  for (let j = 0; j < 4; j++) {
    const y = 1220 + j * j * 70 + j * 60;
    inkLine(ctx, [[-60, y], [1140, y - 4]], 60 + j, 2, "rgba(0,0,0,0.18)");
  }
  ctx.save();
  ctx.translate(pan, 0);
  // shoe cabinet (left) with a lamp
  shaded(ctx, () => rbox(ctx, 40, 880, 300, 290, 10, 70, 1.4), "#6e4f3c", () => {
    inkLine(ctx, [[190, 890], [190, 1160]], 71, 3.5);
    oval(ctx, 170, 1030, 6, 6, 72, 0.4);
    paint(ctx, "#d9c19a", C.ink, 2);
    oval(ctx, 210, 1030, 6, 6, 73, 0.4);
    paint(ctx, "#d9c19a", C.ink, 2);
  }, C.ink, 5);
  // lamp
  poly(ctx, [[110, 760], [210, 760], [236, 840], [84, 840]], 74, 1);
  paint(ctx, "#f2d9a0", C.ink, 4);
  inkLine(ctx, [[160, 840], [160, 880]], 75, 6, "#3a2c22");
  // shoes on the floor
  for (const [sx, col] of [[90, "#f2f2f2"], [150, "#c94a3a"], [260, "#2a2a2e"]] as [number, string][]) {
    blob(ctx, [[sx - 34, 1184], [sx + 20, 1176], [sx + 40, 1194], [sx - 30, 1200]], 80 + sx, 0.8);
    paint(ctx, col, C.ink, 3.5);
  }
  // hall table near the door with the coin jar, flyer, helmet
  shaded(ctx, () => rbox(ctx, 440, 960, 210, 22, 4, 90, 1), "#7a5a44", null, C.ink, 4.5);
  inkLine(ctx, [[462, 982], [458, 1164]], 91, 7, "#5a4030");
  inkLine(ctx, [[628, 982], [632, 1164]], 92, 7, "#5a4030");
  vetFlyer(ctx, 486, 944, 0.42, -0.25, 93);
  coinJar(ctx, 560, 950, 0.55, o.jar ?? 0.7, 94);
  if (o.helmet) helmetProp(ctx, 612, 900, 0.32, 0.15, 95);
  // the front door (right)
  const dx0 = 700,
    dx1 = 1000,
    dy0 = 330,
    dy1 = 1162;
  shaded(ctx, () => poly(ctx, [[dx0 - 26, dy0 - 26], [dx1 + 26, dy0 - 26], [dx1 + 26, dy1], [dx0 - 26, dy1]], 100, 1.2), "#3b2e2a", null, C.ink, 5);
  // corridor light behind the door
  poly(ctx, [[dx0, dy0], [dx1, dy0], [dx1, dy1], [dx0, dy1]], 101, 0.8);
  paint(ctx, door > 0 ? "#ffe2a8" : "#1a1410", null);
  if (door > 0) {
    // light spilling onto the floor
    ctx.save();
    ctx.globalAlpha = 0.55 * door;
    ctx.fillStyle = "#ffd98a";
    ctx.beginPath();
    ctx.moveTo(dx0, dy1);
    ctx.lineTo(dx1, dy1);
    ctx.lineTo(dx1 + 160 * door, 1960);
    ctx.lineTo(dx0 - 420 * door, 1960);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    glow(ctx, (dx0 + dx1) / 2, 760, 520, "rgba(255,220,150,0.35)", door);
  }
  // door panel swinging inward on its right hinge
  const pw = (dx1 - dx0) * (1 - door * 0.82);
  const skew = door * 60;
  shaded(ctx, () => poly(ctx, [[dx1 - pw, dy0 - skew * 0.4], [dx1, dy0], [dx1, dy1], [dx1 - pw, dy1 + skew * 0.4]], 102, 1.2), mix("#6b4b3a", "#8a6a54", dawn), () => {
    poly(ctx, [[dx1 - pw * 0.85, dy0 + 60], [dx1 - pw * 0.15, dy0 + 60], [dx1 - pw * 0.15, dy0 + 340], [dx1 - pw * 0.85, dy0 + 340]], 103, 1);
    paint(ctx, null, "rgba(0,0,0,0.3)", 3);
    poly(ctx, [[dx1 - pw * 0.85, dy0 + 420], [dx1 - pw * 0.15, dy0 + 420], [dx1 - pw * 0.15, dy1 - 60], [dx1 - pw * 0.85, dy1 - 60]], 104, 1);
    paint(ctx, null, "rgba(0,0,0,0.3)", 3);
  }, C.ink, 5);
  oval(ctx, dx1 - pw * 0.86, 760, 12, 12, 105, 0.5);
  paint(ctx, "#d8b45a", C.ink, 3);
  // doormat
  blob(ctx, [[560, 1250], [1040, 1236], [1080, 1340], [520, 1352]], 110, 1.2);
  paint(ctx, "#7c3a3a", C.ink, 4.5);
  for (let i = 0; i < 4; i++) {
    const px = 640 + i * 100,
      py = 1296;
    oval(ctx, px, py, 12, 10, 111 + i, 0.6);
    paint(ctx, "#a25656", null);
    for (const [tx, ty] of [[-12, -14], [0, -18], [12, -14]]) {
      oval(ctx, px + tx, py + ty, 4.5, 5, 115 + i * 3 + tx, 0.4);
      paint(ctx, "#a25656", null);
    }
  }
  if (o.bowl) {
    // food bowl, untouched
    oval(ctx, 360, 1420, 80, 26, 120, 1);
    paint(ctx, "#4b6ea8", C.ink, 4.5);
    oval(ctx, 360, 1414, 64, 16, 121, 0.8);
    paint(ctx, "#8a5a32", null);
  }
  ctx.restore();
  // night lamp glow / dawn wash
  if (dawn < 1) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 160 + pan, 800, 520, "rgba(255,190,110,0.32)", 1 - dawn);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- his bedroom
/** Room + bed (mattress top ≈ y 960, front edge ≈ y 1150). Draw the sitter, then bedBlanket(). */
export function bedroom(ctx: Ctx, abs: number, o: { rain?: number; dawn?: number } = {}) {
  const dawn = o.dawn ?? 0;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, mix("#1a1f3a", "#4a5a86", dawn)], [1, mix("#10132a", "#2c3656", dawn)]]));
  // window with rain and far city lights
  const wx = 70,
    wy = 250,
    ww = 360,
    wh = 450;
  ctx.save();
  rbox(ctx, wx, wy, ww, wh, 8, 200, 1.5);
  paint(ctx, vgrad(ctx, wy, wy + wh, [[0, mix("#1d2a5a", "#8aa0c8", dawn)], [1, mix("#30366a", "#c8b8a8", dawn)]]), C.ink, 7);
  rbox(ctx, wx, wy, ww, wh, 8, 200, 1.5);
  ctx.clip();
  for (let i = 0; i < 14; i++) {
    const bx = wx + i * 30,
      bh = 80 + hash(i * 3.3) * 160;
    ctx.fillStyle = mix("#141a36", "#5a6a8a", dawn);
    ctx.fillRect(bx, wy + wh - bh, 28, bh);
    for (let k = 0; k < 4; k++)
      if (hash(i * 7 + k) > 0.5) {
        ctx.fillStyle = "rgba(255,214,140,0.8)";
        ctx.fillRect(bx + 8, wy + wh - bh + 14 + k * 30, 8, 10);
      }
  }
  if (o.rain) {
    ctx.strokeStyle = "rgba(200,220,255,0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const x = wx + hash(i * 1.7) * ww;
      const y = wy + ((abs * 140 + hash(i * 2.9) * wh) % wh);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y + 22);
      ctx.stroke();
    }
  }
  ctx.restore();
  inkLine(ctx, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 201, 7, "#141830");
  inkLine(ctx, [[wx, wy + wh * 0.45], [wx + ww, wy + wh * 0.45]], 202, 7, "#141830");
  // curtain
  blob(ctx, [[wx - 40, wy - 40], [wx + 50, wy - 40], [wx + 70, wy + 200], [wx + 30, wy + wh + 80], [wx - 50, wy + wh + 90]], 203, 2);
  paint(ctx, "#3b3f6a", C.ink, 5);
  inkLine(ctx, [[wx + 6, wy - 30], [wx + 20, wy + 220], [wx - 6, wy + wh + 70]], 204, 3, "#2a2d50");
  // poster
  rbox(ctx, 640, 250, 220, 280, 6, 205, 1.5);
  paint(ctx, "#41355e", C.ink, 5);
  oval(ctx, 750, 360, 56, 56, 206, 1.5);
  paint(ctx, null, "#8d7bb8", 6);
  text(ctx, "s0rrow", 750, 480, { size: 34, font: F.marker, fill: "#8d7bb8" });
  // headboard + pillow
  poly(ctx, [[470, 700], [1140, 690], [1140, 1000], [470, 1010]], 207, 1.5);
  paint(ctx, "#4a3d5e", C.ink, 6);
  blob(ctx, [[600, 760], [1000, 744], [1040, 860], [580, 880]], 212, 2);
  paint(ctx, "#d9d2e6", C.ink, 5);
  // mattress top + front face
  blob(ctx, [[420, 960], [1160, 940], [1160, 1150], [400, 1160]], 208, 1.6);
  paint(ctx, "#e9e4f0", C.ink, 6);
  poly(ctx, [[400, 1150], [1160, 1140], [1160, 1260], [404, 1270]], 213, 1.2);
  paint(ctx, "#bdb2cc", C.ink, 6);
  // floor
  poly(ctx, [[-60, 1250], [1140, 1240], [1140, 2000], [-60, 2000]], 211, 1.5);
  paint(ctx, "#241d30", C.ink, 6);
}
/** the duvet over his legs (draw after the person sitting in bed) */
export function bedBlanket(ctx: Ctx) {
  blob(ctx, [[560, 990], [1160, 970], [1160, 1150], [520, 1160], [500, 1080]], 209, 2);
  paint(ctx, "#5f77a8", C.ink, 6);
  inkLine(ctx, [[620, 1040], [760, 1080], [900, 1050]], 210, 3, "#4a5f8a");
  inkLine(ctx, [[960, 1020], [1060, 1060]], 214, 3, "#4a5f8a");
}

// ---------------------------------------------------------------- rainy street + pet shop
export function petShopWindow(ctx: Ctx, abs: number, x: number, y: number, w: number, h: number, glowK = 1, pup = 1) {
  ctx.save();
  // warm interior
  rbox(ctx, x, y, w, h, 8, 300, 1.4);
  paint(ctx, vgrad(ctx, y, y + h, [[0, "#ffe2a0"], [1, "#ffbf74"]]), C.ink, 7);
  rbox(ctx, x, y, w, h, 8, 300, 1.4);
  ctx.clip();
  // shelves + cushion + puppies
  inkLine(ctx, [[x, y + h * 0.3], [x + w, y + h * 0.3]], 301, 5, "#d9934a");
  for (let i = 0; i < 5; i++) {
    rbox(ctx, x + 30 + i * 70, y + h * 0.3 - 60, 50, 60, 6, 302 + i, 1);
    paint(ctx, ["#7ab8e0", "#f28aa8", "#9ad17a", "#f2c94c", "#c39ae8"][i], C.ink, 3);
  }
  blob(ctx, [[x + 40, y + h - 70], [x + w - 40, y + h - 80], [x + w - 20, y + h + 20], [x + 20, y + h + 20]], 310, 2);
  paint(ctx, "#ff9cc3", C.ink, 5);
  fluffPuppy(ctx, x + w * 0.22, y + h - 70 * pup, 0.75 * pup, 0, abs, 320);
  fluffPuppy(ctx, x + w * 0.52, y + h - 84 * pup, 0.84 * pup, 1, abs + 0.4, 330);
  fluffPuppy(ctx, x + w * 0.81, y + h - 66 * pup, 0.7 * pup, 2, abs + 0.9, 340);
  // little hearts floating
  for (let i = 0; i < 4; i++) {
    const t = (abs * 0.5 + i * 0.27) % 1;
    const hx = x + w * (0.2 + i * 0.2),
      hy = y + h - 160 - t * 160;
    ctx.globalAlpha = (1 - t) * 0.9;
    blob(ctx, [[hx, hy + 4], [hx - 10, hy - 6], [hx - 16, hy + 2], [hx, hy + 18], [hx + 16, hy + 2], [hx + 10, hy - 6]], 350 + i, 0.6);
    paint(ctx, "#ff6f9c", null);
    ctx.globalAlpha = 1;
  }
  // glass sheen
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y);
  ctx.lineTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.05, y + h);
  ctx.lineTo(x - w * 0.15, y + h);
  ctx.fill();
  ctx.restore();
  glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 0.9, "rgba(255,190,110,0.28)", glowK);
}

export function rainStreet(ctx: Ctx, abs: number, o: { shop?: boolean; pan?: number } = {}) {
  const pan = o.pan ?? 0;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0c1230"], [0.55, "#1b2348"], [1, "#0a0d1e"]]));
  ctx.save();
  ctx.translate(pan * 0.4, 0);
  // far buildings
  for (let i = -1; i < 6; i++) {
    const bx = i * 230 - 40,
      bh = 520 + hash(i + 40) * 360;
    rbox(ctx, bx, 1060 - bh, 210, bh + 20, 4, 400 + i, 2);
    paint(ctx, "#161b3a", C.ink, 5);
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 3; c++)
        if (hash(i * 31 + r * 7 + c) > 0.55) {
          rbox(ctx, bx + 24 + c * 62, 1060 - bh + 50 + r * 92, 40, 54, 3, 410 + r * 3 + c, 1);
          paint(ctx, "rgba(255,214,140,0.75)", null);
        }
  }
  ctx.restore();
  ctx.save();
  ctx.translate(pan, 0);
  // shop fronts at street level
  poly(ctx, [[-120, 640], [1200, 630], [1200, 1120], [-120, 1120]], 420, 1.5);
  paint(ctx, "#23284a", C.ink, 6);
  if (o.shop !== false) {
    // the pet shop with a neon sign
    petShopWindow(ctx, abs, 520, 720, 460, 360);
    rbox(ctx, 560, 650, 380, 60, 12, 430, 1);
    paint(ctx, "#2a1f3a", C.ink, 4);
    const flick = Math.sin(abs * 23) > -0.85 ? 1 : 0.4;
    text(ctx, "萌宠小屋", 750, 682, { size: 40, font: F.cn, fill: `rgba(255,140,190,${flick})`, shadow: 18 });
  }
  // a closed shop with shutters on the left
  poly(ctx, [[30, 720], [440, 716], [440, 1090], [30, 1094]], 440, 1.2);
  paint(ctx, "#3a3f5e", C.ink, 5);
  for (let i = 0; i < 9; i++) inkLine(ctx, [[34, 740 + i * 40], [436, 738 + i * 40]], 441 + i, 2.5, "#2a2e48");
  ctx.restore();
  // wet road with reflections
  poly(ctx, [[-60, 1120], [1140, 1110], [1140, 2000], [-60, 2000]], 460, 1.5);
  paint(ctx, "#151a33", C.ink, 6);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [x0, w0, col] of [[560, 420, "255,190,116"], [620, 300, "255,140,192"]] as [number, number, string][]) {
    const g = ctx.createLinearGradient(0, 1124, 0, 1700);
    g.addColorStop(0, `rgba(${col},0.34)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    for (let k = 0; k < 7; k++) {
      const wob = Math.sin(abs * 2.2 + k * 1.7) * 6;
      ctx.fillRect(x0 + pan + k * (w0 / 7) + wob, 1124, w0 / 7 - 14, 560 - (k % 3) * 80);
    }
  }
  ctx.restore();
  // kerb
  inkLine(ctx, [[-60, 1130], [1140, 1122]], 461, 5, "#3a4060");
}

export function puddle(ctx: Ctx, x: number, y: number, rx: number, ry: number, abs: number, seed = 470) {
  oval(ctx, x, y, rx, ry, seed, 2);
  paint(ctx, "rgba(120,140,190,0.35)", "rgba(180,200,240,0.5)", 3);
  const t = (abs * 1.3) % 1;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = "rgba(220,230,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.2, y, rx * 0.2 + t * rx * 0.5, ry * 0.2 + t * ry * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- bus stop
export function busStop(ctx: Ctx, abs: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0b1029"], [1, "#161b36"]]));
  // street lamp glow
  inkLine(ctx, [[880, 1300], [880, 360], [800, 330]], 500, 14, "#2a2d44");
  glow(ctx, 790, 350, 520, "rgba(255,210,130,0.4)");
  oval(ctx, 790, 344, 40, 18, 501, 1);
  paint(ctx, "#ffe6a8", C.ink, 4);
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffd98a";
  ctx.beginPath();
  ctx.moveTo(760, 360);
  ctx.lineTo(420, 1300);
  ctx.lineTo(1100, 1300);
  ctx.lineTo(820, 360);
  ctx.fill();
  ctx.restore();
  // shelter: roof + glass + glowing ad panel
  poly(ctx, [[60, 520], [760, 500], [770, 540], [50, 560]], 502, 1.4);
  paint(ctx, "#3a4166", C.ink, 6);
  inkLine(ctx, [[90, 556], [96, 1280]], 503, 10, "#3a4166");
  inkLine(ctx, [[730, 536], [724, 1280]], 504, 10, "#3a4166");
  rbox(ctx, 120, 600, 220, 440, 6, 505, 1.2);
  paint(ctx, "#8fd0ff", C.ink, 5);
  text(ctx, "领养代替购买", 230, 740, { size: 30, font: F.cn, fill: "#18324a" });
  oval(ctx, 230, 860, 50, 46, 506, 1);
  paint(ctx, "#fff", C.ink, 3.5);
  oval(ctx, 214, 852, 6, 7, 507, 0.4);
  paint(ctx, C.ink, null);
  oval(ctx, 246, 852, 6, 7, 508, 0.4);
  paint(ctx, C.ink, null);
  glow(ctx, 230, 820, 260, "rgba(140,210,255,0.3)");
  // bench
  rbox(ctx, 360, 1000, 340, 26, 6, 510, 1);
  paint(ctx, "#8a6a4a", C.ink, 5);
  rbox(ctx, 360, 940, 340, 22, 6, 511, 1);
  paint(ctx, "#8a6a4a", C.ink, 5);
  inkLine(ctx, [[390, 1026], [384, 1180]], 512, 8, "#2a2a30");
  inkLine(ctx, [[670, 1026], [676, 1180]], 513, 8, "#2a2a30");
  // pavement
  poly(ctx, [[-60, 1180], [1140, 1170], [1140, 2000], [-60, 2000]], 514, 1.5);
  paint(ctx, "#1c2140", C.ink, 6);
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#ffd98a";
  ctx.fillRect(500, 1200, 420, 14);
  ctx.fillRect(560, 1250, 300, 10);
  ctx.restore();
}

// ---------------------------------------------------------------- pet hospital
export function clinicFront(ctx: Ctx, abs: number, doorsOpen: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0b1029"], [1, "#141a36"]]));
  poly(ctx, [[60, 300], [1020, 290], [1030, 1200], [50, 1210]], 600, 1.5);
  paint(ctx, "#e8ecef", C.ink, 7);
  // sign with a green cross
  rbox(ctx, 160, 340, 760, 130, 14, 601, 1.2);
  paint(ctx, "#2f7d5b", C.ink, 6);
  ctx.save();
  ctx.translate(250, 405);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-14, -44, 28, 88);
  ctx.fillRect(-44, -14, 88, 28);
  ctx.restore();
  text(ctx, "宠物医院 · 24小时", 590, 408, { size: 62, font: F.cn, fill: "#fff" });
  glow(ctx, 540, 400, 500, "rgba(120,255,190,0.18)");
  // glass doors (sliding open) with bright interior
  const op = clamp(doorsOpen);
  rbox(ctx, 240, 560, 600, 640, 6, 602, 1);
  paint(ctx, "#f4fbff", C.ink, 6);
  glow(ctx, 540, 860, 600, "rgba(220,245,255,0.6)", 0.5 + op * 0.5);
  for (const side of [-1, 1]) {
    const x = side < 0 ? 240 - op * 260 : 540 + op * 260;
    rbox(ctx, x, 560, 300, 640, 6, 603 + side, 1);
    paint(ctx, "rgba(170,210,230,0.55)", C.ink, 5);
    inkLine(ctx, [[x + 40, 600], [x + 90, 760]], 605 + side, 5, "rgba(255,255,255,0.7)");
  }
  poly(ctx, [[-60, 1200], [1140, 1190], [1140, 2000], [-60, 2000]], 606, 1.5);
  paint(ctx, "#1c2140", C.ink, 6);
}

/** Interior: counter + X-ray light box. */
export function clinicCounter(ctx: Ctx, abs: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#dfe9ec"], [1, "#c6d6db"]]));
  // light box on the wall (X-ray drawn by caller)
  rbox(ctx, 260, 330, 560, 400, 10, 620, 1.2);
  paint(ctx, "#f4fbff", C.ink, 7);
  glow(ctx, 540, 530, 520, "rgba(230,250,255,0.6)");
  // posters
  rbox(ctx, 60, 360, 150, 210, 6, 621, 1);
  paint(ctx, "#fff", C.ink, 4);
  oval(ctx, 135, 440, 44, 40, 622, 1);
  paint(ctx, "#f1dfba", C.ink, 3);
  rbox(ctx, 870, 360, 150, 210, 6, 623, 1);
  paint(ctx, "#fff", C.ink, 4);
  text(ctx, "爱心", 945, 450, { size: 34, font: F.cn, fill: "#e8505b" });
  // floor + counter
  poly(ctx, [[-60, 1080], [1140, 1070], [1140, 2000], [-60, 2000]], 624, 1.5);
  paint(ctx, "#b8c8cc", C.ink, 6);
  shaded(ctx, () => poly(ctx, [[-40, 940], [1120, 930], [1120, 1240], [-40, 1250]], 625, 1.5), "#f2f5f6", () => {
    poly(ctx, [[-60, 1000], [1140, 990], [1140, 1260], [-60, 1260]], 626, 1);
    paint(ctx, "#d4e2e6", null);
  }, C.ink, 7);
  inkLine(ctx, [[-40, 990], [1120, 982]], 627, 4, "#9fb4ba");
}

/** Surgery hallway: door with the red 「手术中」 light, bench, wall clock, window with blinds. */
export function surgeryHall(ctx: Ctx, abs: number, o: { lightOn: number; clock: number; dawn?: number; blinds?: number; doorOpen?: number }) {
  const dawn = o.dawn ?? 0;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, mix("#2a3a44", "#8aa6b0", dawn * 0.6)], [1, mix("#1c262e", "#5a7480", dawn * 0.6)]]));
  // window with blinds (left)
  rbox(ctx, 60, 330, 300, 420, 6, 640, 1.2);
  paint(ctx, mix("#0d1430", "#e8b98a", dawn), C.ink, 6);
  const bl = clamp(o.blinds ?? 1);
  for (let i = 0; i < 14; i++) {
    const y = 340 + i * 29;
    if (i / 14 > bl) break;
    rbox(ctx, 66, y, 288, 22, 3, 641 + i, 0.6);
    paint(ctx, mix("#9aa8b0", "#d8d0c4", dawn), C.ink, 2);
  }
  // wall clock (between the window and the door, above his head)
  ctx.save();
  ctx.translate(230, -240);
  oval(ctx, 220, 900, 70, 70, 660, 1.2);
  paint(ctx, "#f4f4f0", C.ink, 6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    inkLine(ctx, [[220 + Math.cos(a) * 54, 900 + Math.sin(a) * 54], [220 + Math.cos(a) * 62, 900 + Math.sin(a) * 62]], 661 + i, 3);
  }
  const hrs = o.clock;
  const ha = ((hrs % 12) / 12) * Math.PI * 2 - Math.PI / 2,
    ma = ((hrs % 1) * Math.PI * 2) - Math.PI / 2;
  inkLine(ctx, [[220, 900], [220 + Math.cos(ha) * 34, 900 + Math.sin(ha) * 34]], 675, 7);
  inkLine(ctx, [[220, 900], [220 + Math.cos(ma) * 52, 900 + Math.sin(ma) * 52]], 676, 4.5);
  ctx.restore();
  // operating room door (right) with the light above
  const op = clamp(o.doorOpen ?? 0);
  rbox(ctx, 520, 470, 460, 780, 8, 680, 1.2);
  paint(ctx, "#1a2228", C.ink, 6);
  glow(ctx, 750, 860, 400, "rgba(230,250,255,0.6)", op);
  for (const side of [-1, 1]) {
    const x = side < 0 ? 520 - op * 120 : 750 + op * 120;
    rbox(ctx, x, 470, 230, 780, 6, 681 + side, 1);
    paint(ctx, "#cfdfe4", C.ink, 5);
    rbox(ctx, x + 60, 560, 110, 150, 10, 683 + side, 0.8);
    paint(ctx, "rgba(170,210,230,0.8)", C.ink, 3.5);
  }
  // 「手术中」 sign
  const on = clamp(o.lightOn);
  rbox(ctx, 620, 350, 260, 90, 12, 690, 1);
  paint(ctx, on > 0.5 ? "#b31d22" : "#3a2a2a", C.ink, 5);
  text(ctx, "手术中", 750, 396, { size: 52, font: F.cn, fill: on > 0.5 ? "#ffe0e0" : "#6a5050" });
  if (on > 0) glow(ctx, 750, 396, 340, "rgba(255,60,60,0.45)", on);
  // bench
  poly(ctx, [[80, 1170], [470, 1164], [470, 1200], [80, 1206]], 695, 1);
  paint(ctx, "#6a8a9a", C.ink, 5);
  inkLine(ctx, [[110, 1200], [106, 1320]], 696, 8, "#2a3036");
  inkLine(ctx, [[440, 1196], [446, 1320]], 697, 8, "#2a3036");
  poly(ctx, [[-60, 1300], [1140, 1290], [1140, 2000], [-60, 2000]], 698, 1.5);
  paint(ctx, mix("#33424c", "#7a929c", dawn * 0.5), C.ink, 6);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = on > 0.5 ? "#ff4040" : "#cfe";
  ctx.fillRect(520, 1300, 460, 40);
  ctx.restore();
}

/** Recovery room: a soft bed in a kennel, IV stand, wall calendar showing the day. */
export function recoveryRoom(ctx: Ctx, abs: number, o: { day: number; night?: number }) {
  const night = clamp(o.night ?? 0);
  fillBg(ctx, vgrad(ctx, 0, H, [[0, mix("#f1ead8", "#1f2846", night)], [1, mix("#dccfb4", "#141a30", night)]]));
  // window light
  rbox(ctx, 640, 300, 340, 400, 8, 700, 1.2);
  paint(ctx, mix("#cfe8f6", "#1a2350", night), C.ink, 6);
  if (night < 0.5) glow(ctx, 800, 500, 520, "rgba(255,250,220,0.6)", 1 - night * 2);
  else {
    oval(ctx, 880, 400, 30, 30, 701, 1);
    paint(ctx, "#fff4c8", null);
  }
  inkLine(ctx, [[810, 300], [810, 700]], 702, 6, C.ink);
  // big day calendar
  poly(ctx, [[110, 330], [370, 330], [370, 620], [110, 620]], 703, 1);
  paint(ctx, "#fbf8f0", C.ink, 5);
  poly(ctx, [[110, 330], [370, 330], [370, 390], [110, 390]], 704, 0.8);
  paint(ctx, "#c94a3a", C.ink, 4);
  text(ctx, "住院", 240, 360, { size: 32, font: F.cn, fill: "#fff" });
  const d = Math.max(1, Math.min(14, Math.round(o.day)));
  text(ctx, `第${d}天`, 240, 500, { size: 78, font: F.cn, fill: "#2a2a2a" });
  // floor
  poly(ctx, [[-60, 1180], [1140, 1170], [1140, 2000], [-60, 2000]], 705, 1.5);
  paint(ctx, mix("#c9b896", "#2a2a40", night), C.ink, 6);
  // IV stand
  inkLine(ctx, [[860, 1180], [860, 620]], 706, 7, "#8a96a0");
  inkLine(ctx, [[820, 620], [900, 620]], 707, 6, "#8a96a0");
  rbox(ctx, 830, 630, 60, 100, 14, 708, 1);
  paint(ctx, "rgba(220,240,255,0.8)", C.ink, 4);
  curve(ctx, [[860, 730], [840, 900], [700, 1000], [560, 1020]], 709, 1);
  paint(ctx, null, "rgba(200,220,240,0.9)", 4);
  if (night > 0) {
    ctx.fillStyle = `rgba(6,8,20,${0.45 * night})`;
    ctx.fillRect(-60, -60, W + 120, H + 120);
  }
}

/** Kennel front bars drawn over the dog (call after the dog). */
export function kennelBars(ctx: Ctx, x0: number, x1: number, y0: number, y1: number, open = 0) {
  rbox(ctx, x0, y0, x1 - x0, y1 - y0, 14, 720, 1.2);
  paint(ctx, null, "#8a96a0", 9);
  for (let x = x0 + 40; x < x1 - 20; x += 54) {
    if (open > 0 && x > x0 + (x1 - x0) * (1 - open)) continue;
    inkLine(ctx, [[x, y0 + 6], [x, y1 - 6]], 721 + x, 6, "#9aa6b0");
  }
}

// ---------------------------------------------------------------- the tree from the cover
export function coverTree(ctx: Ctx, abs: number, o: { warm?: number } = {}) {
  const warm = o.warm ?? 0;
  // house wall with siding (top) like the cover photo
  fillBg(ctx, mix("#d9d6cc", "#f0dcc0", warm));
  for (let i = 0; i < 12; i++) inkLine(ctx, [[-40, 60 + i * 44], [1120, 50 + i * 44]], 800 + i, 2.5, "rgba(120,110,100,0.35)");
  inkLine(ctx, [[300, 0], [306, 560]], 813, 8, "#b8b2a6");
  // lawn
  poly(ctx, [[-60, 520], [1140, 470], [1140, 2000], [-60, 2000]], 820, 2);
  paint(ctx, vgrad(ctx, 480, 2000, [[0, mix("#6f8f45", "#86a050", warm)], [1, mix("#4f6e34", "#5f7a3a", warm)]]), C.ink, 6);
  // grass strokes + fallen leaves
  for (let i = 0; i < 140; i++) {
    const x = hash(i * 1.3) * W,
      y = 540 + hash(i * 2.7) * 1400;
    const l = 10 + hash(i * 4.1) * 18;
    inkLine(ctx, [[x, y], [x + (hash(i) - 0.5) * 8, y - l]], 830 + i, 2.4, i % 3 ? "#3f5a2a" : "#7f9f50", 0.6);
  }
  for (let i = 0; i < 36; i++) {
    const x = hash(i * 5.3 + 1) * W,
      y = 700 + hash(i * 6.1 + 2) * 1200;
    oval(ctx, x, y, 12, 6, 980 + i, 0.6, hash(i * 7.7) * 3);
    paint(ctx, i % 2 ? "#a8582e" : "#c98a4b", "rgba(40,20,10,0.6)", 2);
  }
  // the trunk (thick, leaning a little), roots spreading over the lawn, bark texture
  const trunk: Pt[] = [
    [300, -60], [700, -60], [690, 200], [676, 520], [690, 800], [740, 960], [860, 1060], [960, 1120], [820, 1130],
    [680, 1100], [560, 1130], [430, 1110], [300, 1170], [150, 1200], [230, 1120], [330, 1010], [370, 820],
    [360, 520], [330, 220],
  ];
  shaded(ctx, () => blob(ctx, trunk, 1000, 2), "#8f877d", () => {
    // shadow side + bark lines
    blob(ctx, [[560, -60], [720, -60], [700, 520], [720, 820], [800, 1000], [960, 1130], [700, 1120], [600, 820], [580, 400]], 1001, 2);
    paint(ctx, "#6f685f", null);
    for (let i = 0; i < 22; i++) {
      const x = 330 + i * 17 + (hash(i * 3.9) - 0.5) * 10;
      const pts: Pt[] = [];
      for (let k = 0; k <= 6; k++) {
        const y = -60 + k * 190;
        const flare = y > 800 ? (x - 520) * ((y - 800) / 400) * 0.9 : 0;
        pts.push([x + Math.sin(k * 1.7 + i) * 7 + flare, y]);
      }
      inkLine(ctx, pts, 1010 + i, 2.4, i % 3 ? "rgba(50,44,40,0.5)" : "rgba(230,224,214,0.35)", 1.2);
    }
    // a knot
    oval(ctx, 470, 360, 26, 38, 1040, 1.2);
    paint(ctx, "#5f5850", C.ink, 3.5);
    oval(ctx, 470, 362, 12, 20, 1041, 0.8);
    paint(ctx, "#4a443e", null);
    // moss at the base
    blob(ctx, [[180, 1190], [320, 1100], [560, 1110], [780, 1080], [940, 1125], [600, 1150], [300, 1190]], 1042, 2);
    paint(ctx, "rgba(110,140,70,0.55)", null);
  }, C.ink, 7);
}

export { ballToy };

// ---------------------------------------------------------------- the corridor outside his room (night)
export function hallway(ctx: Ctx, abs: number, o: { shadow?: number; jacket?: boolean } = {}) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#1b1f38"], [1, "#12152a"]]));
  inkLine(ctx, [[-80, 820], [1160, 814]], 901, 4, "rgba(0,0,0,0.35)");
  // floor
  poly(ctx, [[-60, 1160], [1140, 1150], [1140, 2000], [-60, 2000]], 902, 1.5);
  paint(ctx, "#33251e", C.ink, 6);
  for (let i = -4; i <= 10; i++) {
    const x0 = 540 + i * 130;
    inkLine(ctx, [[540 + (x0 - 540) * 0.35, 1160], [x0 + (x0 - 540) * 0.9, 1960]], 903 + i, 2.4, "rgba(0,0,0,0.28)");
  }
  // his door with light leaking under it
  shaded(ctx, () => poly(ctx, [[70, 300], [440, 296], [444, 1162], [66, 1166]], 920, 1.2), "#3b2e2a", null, C.ink, 5);
  shaded(ctx, () => poly(ctx, [[96, 324], [418, 320], [420, 1150], [94, 1154]], 921, 1.2), "#5a4436", () => {
    poly(ctx, [[130, 380], [384, 378], [384, 640], [130, 642]], 922, 1);
    paint(ctx, null, "rgba(0,0,0,0.3)", 3);
    poly(ctx, [[130, 720], [384, 718], [384, 1090], [130, 1092]], 923, 1);
    paint(ctx, null, "rgba(0,0,0,0.3)", 3);
  }, C.ink, 5);
  oval(ctx, 390, 760, 11, 11, 924, 0.5);
  paint(ctx, "#d8b45a", C.ink, 3);
  // a doodle sign on his door
  poly(ctx, [[180, 450], [330, 444], [334, 540], [184, 546]], 925, 1);
  paint(ctx, "#f2eee4", C.ink, 3.5);
  text(ctx, "早点睡", 257, 496, { size: 36, font: F.pen, fill: "#333" });
  // the strip of warm light under the door, broken by his moving shadow
  const sh = o.shadow ?? 0;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, 1150, 0, 1330);
  g.addColorStop(0, "rgba(255,200,120,0.75)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(96, 1152);
  ctx.lineTo(420, 1148);
  ctx.lineTo(560, 1330);
  ctx.lineTo(10, 1340);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (sh > 0) {
    const sx = 140 + ((Math.sin(abs * 1.7) + 1) / 2) * 200;
    ctx.save();
    ctx.globalAlpha = 0.7 * sh;
    ctx.fillStyle = "#12152a";
    ctx.beginPath();
    ctx.moveTo(sx, 1152);
    ctx.lineTo(sx + 70, 1151);
    ctx.lineTo(sx + 110, 1330);
    ctx.lineTo(sx - 10, 1332);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "rgba(255,200,120,0.9)";
  ctx.fillRect(96, 1148, 324, 5);
  // coat hook with the yellow rider jacket (clue)
  inkLine(ctx, [[560, 400], [660, 398]], 930, 6, "#6a5040");
  if (o.jacket !== false) {
    blob(ctx, [[574, 410], [646, 412], [690, 470], [700, 700], [672, 760], [560, 762], [532, 700], [536, 470]], 931, 1.4);
    paint(ctx, "#d9a010", C.ink, 4.5);
    blob(ctx, [[536, 470], [500, 520], [496, 700], [530, 704], [540, 560]], 932, 1);
    paint(ctx, "#c48c08", C.ink, 4);
    blob(ctx, [[690, 470], [724, 520], [728, 700], [694, 704], [684, 560]], 933, 1);
    paint(ctx, "#c48c08", C.ink, 4);
    poly(ctx, [[538, 600], [698, 596], [698, 622], [538, 626]], 934, 0.8);
    paint(ctx, "#cfd3d6", C.ink, 2.5);
    poly(ctx, [[586, 406], [634, 406], [640, 440], [580, 440]], 935, 0.8);
    paint(ctx, "#3b3a40", C.ink, 3);
    inkLine(ctx, [[610, 440], [612, 758]], 936, 2.5, "#7a5a00");
  }
  glow(ctx, 260, 1200, 500, "rgba(255,190,110,0.18)");
}

// ================================================================ 《unhappy》second story: school + her room
/** Pink strawberry-milk carton (their running joke). Optional sticky note on its front. */
export function strawberryMilk(ctx: Ctx, x: number, y: number, s: number, rot = 0, seed = 3300, note?: string, noteK = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // carton body + gable top
  shaded(ctx, () => poly(ctx, [[-60, -60], [60, -60], [60, 120], [-60, 120]], seed, 1), "#ffd3dc", () => {
    poly(ctx, [[20, -60], [60, -60], [60, 120], [20, 120]], seed + 1, 0.8);
    paint(ctx, "#f4b6c4", null);
  }, C.ink, 5);
  poly(ctx, [[-60, -60], [-40, -110], [40, -110], [60, -60]], seed + 2, 0.8);
  paint(ctx, "#fff0f3", C.ink, 5);
  poly(ctx, [[-40, -110], [-36, -124], [36, -124], [40, -110]], seed + 3, 0.6);
  paint(ctx, "#fff0f3", C.ink, 4);
  // straw
  inkLine(ctx, [[22, -118], [40, -190], [70, -200]], seed + 4, 9, C.ink);
  inkLine(ctx, [[22, -118], [40, -190], [70, -200]], seed + 4, 5, "#ff6f8f");
  // strawberry logo
  blob(ctx, [[-22, 10], [0, 0], [22, 10], [16, 44], [0, 58], [-16, 44]], seed + 5, 0.8);
  paint(ctx, "#ff4d6a", C.ink, 3.5);
  for (const [dx, dy] of [[-8, 20], [8, 22], [0, 36], [-6, 46], [7, 44]] as Pt[]) {
    oval(ctx, dx, dy, 2, 2.6, seed + 6 + dx + dy, 0.2);
    paint(ctx, "#ffe08a", null);
  }
  poly(ctx, [[-16, 2], [0, -14], [16, 2], [0, 8]], seed + 9, 0.6);
  paint(ctx, "#5bbf5a", C.ink, 3);
  text(ctx, "草莓牛奶", 0, 92, { size: 22, font: F.cn, fill: "#d23a5a" });
  if (note && noteK > 0) {
    ctx.save();
    ctx.globalAlpha *= clamp(noteK);
    ctx.translate(-4, 40);
    ctx.rotate(-0.08);
    poly(ctx, [[-70, -50], [70, -54], [74, 50], [-66, 54]], seed + 10, 1.2);
    paint(ctx, "#ffe680", C.ink, 4);
    text(ctx, note, 2, 4, { size: 44, font: F.pen, fill: "#222" });
    ctx.restore();
  }
  ctx.restore();
}

/** Her room at night: the mirror image of his (bed on the left, window on the right), fairy lights, polaroids. */
export function herRoom(ctx: Ctx, abs: number, o: { dawn?: number; lights?: number } = {}) {
  const dawn = o.dawn ?? 0;
  const lights = o.lights ?? 1;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, mix("#2a2446", "#d9cdea", dawn)], [1, mix("#1b1730", "#b9a9d0", dawn)]]));
  // window (right) with moon / sunrise
  const wx = 650,
    wy = 250,
    ww = 360,
    wh = 450;
  ctx.save();
  rbox(ctx, wx, wy, ww, wh, 8, 3400, 1.5);
  paint(ctx, vgrad(ctx, wy, wy + wh, [[0, mix("#1b2350", "#ffb38a", dawn)], [1, mix("#38306a", "#ffe0a8", dawn)]]), C.ink, 7);
  rbox(ctx, wx, wy, ww, wh, 8, 3400, 1.5);
  ctx.clip();
  if (dawn < 0.5) {
    oval(ctx, wx + 250, wy + 110, 40, 40, 3401, 1);
    paint(ctx, "#fff4c8", null);
    oval(ctx, wx + 266, wy + 98, 34, 34, 3402, 1);
    paint(ctx, mix("#1b2350", "#ffb38a", dawn), null);
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(abs * 1.1 + i));
      ctx.fillStyle = "#fff";
      ctx.fillRect(wx + hash(i * 2.1) * ww, wy + hash(i * 4.3) * wh * 0.7, 4, 4);
    }
    ctx.globalAlpha = 1;
  } else {
    glow(ctx, wx + 180, wy + wh, 320, "rgba(255,230,160,0.9)", 1);
  }
  ctx.restore();
  inkLine(ctx, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 3403, 7, "#1d1838");
  inkLine(ctx, [[wx, wy + wh * 0.45], [wx + ww, wy + wh * 0.45]], 3404, 7, "#1d1838");
  // lace curtain (right)
  blob(ctx, [[wx + ww - 50, wy - 40], [wx + ww + 40, wy - 40], [wx + ww + 50, wy + wh + 90], [wx + ww - 30, wy + wh + 80], [wx + ww - 70, wy + 200]], 3405, 2);
  paint(ctx, mix("#e8d8f0", "#fff6fb", dawn), C.ink, 5);
  // polaroid wall above the bed
  const pols: [number, number, number, string][] = [
    [150, 360, -0.12, "#ffb38a"],
    [290, 330, 0.08, "#9fd4f5"],
    [420, 370, -0.05, "#ffd3dc"],
  ];
  pols.forEach(([px, py, r, col], i) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(r);
    poly(ctx, [[-56, -66], [56, -66], [56, 70], [-56, 70]], 3410 + i, 1);
    paint(ctx, "#fbf8f0", C.ink, 4);
    poly(ctx, [[-44, -54], [44, -54], [44, 38], [-44, 38]], 3413 + i, 0.6);
    paint(ctx, col, null);
    if (i === 2) strawberryMilk(ctx, 0, 6, 0.28, 0.1, 3416);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(-16, -76, 32, 18);
    ctx.restore();
  });
  // shelf with a plush bear (right of the bed)
  inkLine(ctx, [[640, 800], [900, 796]], 3420, 8, "#8a6a8a");
  oval(ctx, 720, 750, 40, 44, 3421, 1);
  paint(ctx, "#d9a87a", C.ink, 4);
  oval(ctx, 720, 700, 32, 30, 3422, 1);
  paint(ctx, "#d9a87a", C.ink, 4);
  for (const side of [-1, 1]) {
    oval(ctx, 720 + side * 24, 676, 11, 11, 3423 + side, 0.6);
    paint(ctx, "#d9a87a", C.ink, 3.5);
  }
  oval(ctx, 712, 700, 3, 3, 3426, 0.2);
  paint(ctx, C.ink, null);
  oval(ctx, 728, 700, 3, 3, 3427, 0.2);
  paint(ctx, C.ink, null);
  // fairy lights along the top
  const bulbs = 15;
  ctx.save();
  ctx.strokeStyle = "#1a1530";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const x = -20 + u * 1120,
      y = 170 + Math.sin(u * Math.PI * 3) * 30 + u * 20;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < bulbs; i++) {
    const u = (i + 0.5) / bulbs;
    const x = -20 + u * 1120,
      y = 170 + Math.sin(u * Math.PI * 3) * 30 + u * 20 + 16;
    const tw = 0.75 + 0.25 * Math.sin(abs * 2.3 + i * 1.7);
    const col = i % 3 === 0 ? "rgba(255,170,200,0.55)" : "rgba(255,214,140,0.6)";
    if (lights > 0) glow(ctx, x, y, 70, col, lights * tw);
    oval(ctx, x, y, 9, 12, 3430 + i, 0.5);
    paint(ctx, i % 3 === 0 ? "#ffc0d6" : "#ffe3a0", C.ink, 2.5);
  }
  // her bed (left): headboard, pillow, mattress, front
  poly(ctx, [[-60, 690], [600, 700], [600, 1010], [-60, 1000]], 3440, 1.5);
  paint(ctx, mix("#6a4a7a", "#c9a9d8", dawn), C.ink, 6);
  blob(ctx, [[40, 750], [440, 764], [460, 870], [20, 860]], 3441, 2);
  paint(ctx, "#fde9f0", C.ink, 5);
  blob(ctx, [[-80, 940], [660, 960], [680, 1160], [-80, 1150]], 3442, 1.6);
  paint(ctx, "#f7eef6", C.ink, 6);
  poly(ctx, [[-80, 1140], [676, 1150], [672, 1270], [-80, 1260]], 3443, 1.2);
  paint(ctx, "#d6bcd9", C.ink, 6);
  // floor
  poly(ctx, [[-60, 1250], [1140, 1240], [1140, 2000], [-60, 2000]], 3444, 1.5);
  paint(ctx, mix("#2e2236", "#c9b39c", dawn), C.ink, 6);
}
/** the pink duvet over her legs (draw after she is placed in bed) */
export function herBlanket(ctx: Ctx) {
  blob(ctx, [[-80, 990], [520, 976], [600, 1080], [560, 1160], [-80, 1166]], 3450, 2);
  paint(ctx, "#f2a7bd", C.ink, 6);
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 90,
      y = 1060 + (i % 2) * 40;
    blob(ctx, [[x, y + 4], [x - 9, y - 4], [x - 14, y + 2], [x, y + 16], [x + 14, y + 2], [x + 9, y - 4]], 3451 + i, 0.4);
    paint(ctx, "rgba(255,255,255,0.7)", null);
  }
  inkLine(ctx, [[60, 1030], [220, 1070], [380, 1040]], 3460, 3, "#d97f9a");
}

/** Classroom seen from the blackboard: back wall with notice board and clock, windows on the right letting
 *  in sunlight. Students and desks are drawn by the shot (back rows first). */
export function classroomFront(ctx: Ctx, abs: number, o: { sun?: number } = {}) {
  const sun = o.sun ?? 1;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#e9e4cf"], [1, "#d9d0b4"]]));
  // ceiling strip + back wall details
  poly(ctx, [[-60, -60], [1140, -60], [1140, 120], [-60, 130]], 3500, 1.5);
  paint(ctx, "#f4f0e2", C.ink, 5);
  inkLine(ctx, [[140, 60], [440, 58]], 3501, 10, "#fffbe8");
  inkLine(ctx, [[640, 58], [940, 60]], 3502, 10, "#fffbe8");
  // notice board
  rbox(ctx, 90, 250, 520, 290, 8, 3503, 1.2);
  paint(ctx, "#c98e5a", C.ink, 6);
  const notes: [number, number, string][] = [
    [160, 310, "#fff6c9"],
    [270, 330, "#cfe8ff"],
    [390, 300, "#ffd3dc"],
    [500, 340, "#d9f2c8"],
    [200, 440, "#fff6c9"],
    [440, 450, "#cfe8ff"],
  ];
  notes.forEach(([nx, ny, col], i) => {
    poly(ctx, [[nx - 44, ny - 40], [nx + 44, ny - 42], [nx + 46, ny + 40], [nx - 42, ny + 42]], 3504 + i, 1);
    paint(ctx, col, C.ink, 3);
    for (let k = 0; k < 3; k++) inkLine(ctx, [[nx - 30, ny - 16 + k * 14], [nx + 26 - k * 10, ny - 16 + k * 14]], 3510 + i * 3 + k, 2, "#999");
  });
  text(ctx, "高二(3)班", 350, 222, { size: 40, font: F.cn, fill: "#7a5a3a" });
  // clock
  oval(ctx, 760, 260, 54, 54, 3520, 1);
  paint(ctx, "#fbfaf4", C.ink, 5);
  inkLine(ctx, [[760, 260], [760, 226]], 3521, 5);
  inkLine(ctx, [[760, 260], [784, 270]], 3522, 4);
  // windows on the right wall (in perspective)
  for (let i = 0; i < 2; i++) {
    const x0 = 840 + i * 120,
      x1 = x0 + 100;
    poly(ctx, [[x0, 230 - i * 40], [x1, 200 - i * 50], [x1, 880 + i * 60], [x0, 850 + i * 40]], 3530 + i, 1.2);
    paint(ctx, "#cfeaf7", C.ink, 6);
  }
  // floor
  poly(ctx, [[-60, 990], [1140, 980], [1140, 2000], [-60, 2000]], 3540, 1.5);
  paint(ctx, "#b99a6c", C.ink, 6);
  for (let i = 0; i < 7; i++) inkLine(ctx, [[-40, 1040 + i * i * 22 + i * 40], [1120, 1030 + i * i * 22 + i * 40]], 3541 + i, 2, "rgba(0,0,0,0.12)");
  // sunbeams from the windows
  if (sun > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.16 * sun;
    ctx.fillStyle = "#fff2c4";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(1080, 200 + i * 160);
      ctx.lineTo(1080, 330 + i * 160);
      ctx.lineTo(200 - i * 80, 1500 + i * 120);
      ctx.lineTo(60 - i * 80, 1380 + i * 120);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
/** A school desk facing the camera (drawn in front of the seated student). (x, y) = centre of the desk top. */
export function deskFront(ctx: Ctx, x: number, y: number, s: number, seed = 3560, items?: (c: Ctx) => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // legs behind
  inkLine(ctx, [[-230, 30], [-236, 420]], seed, 12, "#5a5a62");
  inkLine(ctx, [[230, 30], [236, 420]], seed + 1, 12, "#5a5a62");
  // front panel + top
  shaded(ctx, () => poly(ctx, [[-250, 20], [250, 20], [244, 230], [-244, 230]], seed + 2, 1.2), "#c99a62", () => {
    poly(ctx, [[-250, 20], [250, 20], [250, 60], [-250, 60]], seed + 3, 1);
    paint(ctx, "rgba(0,0,0,0.15)", null);
  }, C.ink, 5.5);
  shaded(ctx, () => poly(ctx, [[-270, -40], [270, -40], [262, 24], [-262, 24]], seed + 4, 1.2), "#e2b679", () => {
    inkLine(ctx, [[-240, -14], [240, -18]], seed + 5, 2.4, "rgba(120,80,40,0.35)");
  }, C.ink, 5.5);
  items?.(ctx);
  ctx.restore();
}

/** a classmate seen from behind, sitting at a desk (simple shapes: the shot blurs the background) */
function classmateBack(ctx: Ctx, x: number, y: number, s: number, hair: string, shirt: string, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // the desk in front of them shows at both sides of the body
  poly(ctx, [[-250, 300], [250, 296], [262, 350], [-262, 354]], seed, 1);
  paint(ctx, "#e2b679", C.ink, 5);
  blob(ctx, [[-150, 150], [150, 150], [178, 300], [176, 420], [-176, 420], [-178, 300]], seed + 1, 1.5);
  paint(ctx, shirt, C.ink, 5);
  blob(ctx, [[-34, 80], [34, 80], [38, 160], [-38, 160]], seed + 2, 1);
  paint(ctx, "#e6c79e", C.ink, 4);
  oval(ctx, 0, 0, 116, 126, seed + 3, 2);
  paint(ctx, hair, C.ink, 5);
  ctx.restore();
}

/** Classroom seen from a back-row seat (over his shoulder): the blackboard with the physics problem he stays
 *  up for, sunlit windows on the left, a few classmates' backs in the rows ahead. Her row is drawn by the shot. */
export function classroomBoard(ctx: Ctx, abs: number, o: { sun?: number } = {}) {
  const sun = o.sun ?? 1;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#ece6d0"], [1, "#dcd0b2"]]));
  // ceiling + tube lights
  poly(ctx, [[-60, -60], [1140, -60], [1140, 170], [-60, 180]], 3600, 1.5);
  paint(ctx, "#f5f1e3", C.ink, 5);
  inkLine(ctx, [[230, 96], [480, 94]], 3601, 12, "#fffbe8");
  inkLine(ctx, [[640, 94], [880, 96]], 3602, 12, "#fffbe8");
  // windows on the left wall, in perspective
  for (let i = 0; i < 2; i++) {
    const x0 = -30 + i * 76,
      x1 = x0 + 58;
    poly(ctx, [[x0, 190 + i * 46], [x1, 226 + i * 42], [x1, 1010 - i * 40], [x0, 1060 - i * 42]], 3603 + i, 1.2);
    paint(ctx, "#d4ecf7", C.ink, 5);
  }
  // blackboard in a wooden frame
  rbox(ctx, 170, 300, 840, 480, 12, 3610, 1.2);
  paint(ctx, "#8a6844", C.ink, 6);
  rbox(ctx, 192, 322, 796, 436, 6, 3611, 1);
  paint(ctx, "#2f4a3c", C.ink, 4);
  // chalk: a block on a slope with its forces, F = ma
  const chalk = "rgba(238,242,234,0.88)";
  poly(ctx, [[260, 700], [600, 700], [260, 500]], 3612, 0.8);
  paint(ctx, null, chalk, 4);
  const ang = Math.atan2(200, 340);
  ctx.save();
  ctx.translate(430, 600);
  ctx.rotate(ang);
  poly(ctx, [[-44, -64], [44, -64], [44, 0], [-44, 0]], 3613, 0.8);
  paint(ctx, null, chalk, 3.5);
  ctx.restore();
  const bc: Pt = [430 + 32 * Math.sin(ang), 600 - 32 * Math.cos(ang)];
  const arrow = (to: Pt, seed: number) => {
    inkLine(ctx, [bc, to], seed, 3.5, chalk);
    const a = Math.atan2(to[1] - bc[1], to[0] - bc[0]);
    poly(ctx, [[to[0] - 18 * Math.cos(a - 0.45), to[1] - 18 * Math.sin(a - 0.45)], to, [to[0] - 18 * Math.cos(a + 0.45), to[1] - 18 * Math.sin(a + 0.45)]], seed + 1, 0.4, false);
    paint(ctx, null, chalk, 3.5);
  };
  arrow([bc[0], bc[1] + 120], 3614);
  arrow([bc[0] + 110 * Math.sin(ang), bc[1] - 110 * Math.cos(ang)], 3616);
  text(ctx, "mg", bc[0] + 34, bc[1] + 120, { size: 34, font: F.en, fill: chalk });
  text(ctx, "N", bc[0] + 110 * Math.sin(ang) + 26, bc[1] - 110 * Math.cos(ang) - 10, { size: 34, font: F.en, fill: chalk });
  text(ctx, "第3题", 330, 380, { size: 44, font: F.pen, fill: chalk });
  text(ctx, "F = ma", 800, 450, { size: 64, font: F.marker, fill: chalk });
  text(ctx, "a = ?", 790, 560, { size: 56, font: F.marker, fill: chalk });
  inkLine(ctx, [[690, 620], [900, 616]], 3618, 3, chalk);
  // chalk tray
  rbox(ctx, 180, 770, 820, 20, 4, 3619, 1);
  paint(ctx, "#7a5a3a", C.ink, 4);
  // floor
  poly(ctx, [[-60, 1160], [1140, 1150], [1140, 2000], [-60, 2000]], 3620, 1.5);
  paint(ctx, "#b99a6c", C.ink, 6);
  // classmates in the rows ahead
  classmateBack(ctx, 700, 900, 0.3, "#2a2220", "#eef0ea", 3630);
  classmateBack(ctx, 150, 960, 0.42, "#1f1a18", "#d9e3f0", 3640);
  classmateBack(ctx, 935, 985, 0.44, "#3a2a20", "#eef0ea", 3650);
  // sunlight from the windows
  if (sun > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.11 * sun;
    ctx.fillStyle = "#fff2c4";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 240 + i * 230);
      ctx.lineTo(0, 380 + i * 230);
      ctx.lineTo(900 + i * 60, 1500 + i * 160);
      ctx.lineTo(1040 + i * 60, 1380 + i * 160);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/** A school textbook held up with the cover facing the camera — 物理. (x, y) = centre of the cover. */
export function textbook(ctx: Ctx, x: number, y: number, s: number, rot = 0, seed = 3660) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // page block showing at the top and the right edge
  poly(ctx, [[-148, -198], [162, -202], [166, 194], [-144, 198]], seed, 0.8);
  paint(ctx, "#fbfaf2", C.ink, 4);
  inkLine(ctx, [[150, -190], [154, 188]], seed + 1, 2, "#c9c2b0");
  shaded(ctx, () => poly(ctx, [[-160, -190], [150, -194], [154, 190], [-156, 194]], seed + 2, 1), "#7fb2d9", () => {
    // spine shading + colour band
    poly(ctx, [[-160, -190], [-126, -191], [-122, 194], [-156, 194]], seed + 3, 0.6);
    paint(ctx, "#5f93bd", null);
    poly(ctx, [[-110, 30], [154, 28], [154, 84], [-110, 86]], seed + 4, 0.6);
    paint(ctx, "#f2c14e", null);
  }, C.ink, 5);
  text(ctx, "物理", 22, -80, { size: 96, font: F.cn, fill: "#fff", stroke: "#2c4f6e", lw: 9 });
  text(ctx, "高二 · 上册", 22, 57, { size: 28, font: F.cn, fill: "#2c4f6e" });
  for (let k = 0; k < 3; k++) {
    oval(ctx, 22, 140, 50, 16, seed + 5 + k, 0.5, (k * Math.PI) / 3);
    paint(ctx, null, "rgba(255,255,255,0.85)", 2.5);
  }
  oval(ctx, 22, 140, 7, 7, seed + 9, 0.3);
  paint(ctx, "#fff", null);
  ctx.restore();
}

/** fingertips curled over both edges of a held-up textbook (same x, y, s, rot as textbook()) */
export function bookFingers(ctx: Ctx, x: number, y: number, s: number, rot: number, skin = "#f6e1c3") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      rr(ctx, side < 0 ? -176 : 136, 18 + k * 31, 40, 27, 13);
      paint(ctx, skin, C.ink, 3.5);
    }
  ctx.restore();
}

/** A pillow hugged to the chest: the upper arms go down the pillow's sides, the forearms cross over its front
 *  and end in simple round hands. Kid-local units: (x, y, s) = the same as the drawKid call it belongs to;
 *  draw it after drawKid (it covers her own arms) and before any blanket. */
export function huggedPillow(ctx: Ctx, x: number, y: number, s: number, sleeve: string, cuff: string, skin: string, seed = 3800) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.save();
  ctx.rotate(-0.05);
  const pillow: Pt[] = [[-206, 196], [-70, 182], [70, 180], [206, 194], [222, 300], [204, 420], [66, 432], [-70, 434], [-212, 420], [-224, 300]];
  shaded(ctx, () => blob(ctx, pillow, seed, 1.4), "#cfe2f5", () => {
    blob(ctx, [[60, 300], [230, 250], [240, 450], [-80, 450], [20, 400]], seed + 1, 1.2);
    paint(ctx, "rgba(110,140,185,0.3)", null);
    // a few little stars printed on it
    for (const [sx, sy] of [[-150, 260], [-40, 410], [150, 400], [120, 250]] as Pt[]) {
      blob(ctx, [[sx, sy - 14], [sx + 4, sy - 4], [sx + 14, sy], [sx + 4, sy + 4], [sx, sy + 14], [sx - 4, sy + 4], [sx - 14, sy], [sx - 4, sy - 4]], seed + 20 + sx, 0.3);
      paint(ctx, "#fff7d1", null);
    }
  }, C.ink, 6);
  inkLine(ctx, [[-196, 236], [0, 226], [196, 234]], seed + 2, 2.4, "#9fbbdc");
  ctx.restore();
  const arm = (pts: Pt[], hand: Pt, sd: number) => {
    blob(ctx, tubePts(pts, [58, 54, 50, 48], true, false), sd, 1);
    paint(ctx, sleeve, C.ink, 5.5);
    const a = pts[pts.length - 2],
      b = pts[pts.length - 1];
    blob(ctx, tubePts([[a[0] + (b[0] - a[0]) * 0.82, a[1] + (b[1] - a[1]) * 0.82], b], [52, 50], false, false), sd + 1, 0.8);
    paint(ctx, cuff, C.ink, 4.5);
    oval(ctx, hand[0], hand[1], 30, 28, sd + 2, 0.8);
    paint(ctx, skin, C.ink, 5);
  };
  // her right arm (image left) underneath, left arm on top — crossed over the front of the pillow
  arm([[-90, 200], [-182, 300], [-130, 372], [10, 386]], [34, 384], seed + 3);
  arm([[90, 200], [186, 300], [126, 352], [-6, 352]], [-30, 352], seed + 7);
  ctx.restore();
}

/** Bright school corridor (windows on the left, doors on the right). */
export function schoolHall(ctx: Ctx, abs: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#eef1ea"], [1, "#dfe3d8"]]));
  for (let i = 0; i < 3; i++) {
    const y0 = 260 + i * 10,
      x0 = 40 + i * 120;
    poly(ctx, [[x0, y0], [x0 + 100, y0 + 30], [x0 + 100, 900 - i * 30], [x0, 940 - i * 20]], 3600 + i, 1.2);
    paint(ctx, "#cdebf8", C.ink, 6);
    glow(ctx, x0 + 50, 560, 260, "rgba(255,250,220,0.6)");
  }
  rbox(ctx, 700, 320, 260, 640, 6, 3610, 1.2);
  paint(ctx, "#b98a5a", C.ink, 6);
  rbox(ctx, 760, 400, 140, 160, 6, 3611, 1);
  paint(ctx, "#cdebf8", C.ink, 4);
  text(ctx, "高二(3)班", 830, 290, { size: 34, font: F.cn, fill: "#6a5a4a" });
  poly(ctx, [[-60, 1000], [1140, 990], [1140, 2000], [-60, 2000]], 3612, 1.5);
  paint(ctx, "#c9c3b0", C.ink, 6);
  for (let i = 0; i < 5; i++) inkLine(ctx, [[540, 1000], [-200 + i * 420, 2000]], 3613 + i, 2, "rgba(0,0,0,0.12)");
}

/** Early-morning street with a 24h convenience store. pan scrolls the street sideways. */
export function morningStreet(ctx: Ctx, abs: number, pan = 0) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#ffc3a0"], [0.45, "#ffe3b8"], [1, "#f6efe0"]]));
  glow(ctx, 820, 640, 520, "rgba(255,220,160,0.8)");
  ctx.save();
  ctx.translate(-pan * 0.4, 0);
  for (let i = -1; i < 7; i++) {
    const bx = i * 220,
      bh = 380 + hash(i + 70) * 300;
    rbox(ctx, bx, 900 - bh, 200, bh + 20, 4, 3700 + i, 2);
    paint(ctx, mix("#f2c9a8", "#d7b8c8", hash(i * 3)), C.ink, 5);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++)
        if (hash(i * 13 + r * 5 + c) > 0.5) {
          rbox(ctx, bx + 22 + c * 58, 900 - bh + 40 + r * 80, 36, 50, 3, 3710 + r * 3 + c, 0.8);
          paint(ctx, "#fff3d6", C.ink, 2.5);
        }
  }
  ctx.restore();
  ctx.save();
  ctx.translate(-pan, 0);
  // the convenience store
  rbox(ctx, 520, 620, 520, 420, 6, 3720, 1.5);
  paint(ctx, "#f4f6f6", C.ink, 6);
  rbox(ctx, 520, 620, 520, 80, 6, 3721, 1.2);
  paint(ctx, "#2fa36b", C.ink, 5);
  text(ctx, "24H 便利店", 780, 662, { size: 44, font: F.cn, fill: "#fff" });
  rbox(ctx, 560, 730, 440, 300, 4, 3722, 1);
  paint(ctx, "#fff9e6", C.ink, 5);
  for (let r = 0; r < 3; r++) {
    inkLine(ctx, [[580, 800 + r * 80], [980, 798 + r * 80]], 3723 + r, 4, "#c9b48a");
    for (let k = 0; k < 9; k++) {
      rbox(ctx, 590 + k * 44, 760 + r * 80, 30, 38, 3, 3730 + r * 9 + k, 0.5);
      paint(ctx, ["#ffd3dc", "#cfe8ff", "#fff0a8", "#d9f2c8"][(k + r) % 4], C.ink, 2);
    }
  }
  // a tree and a bike
  oval(ctx, 220, 700, 160, 150, 3760, 3);
  paint(ctx, "#8fbf6a", C.ink, 6);
  inkLine(ctx, [[220, 840], [224, 1040]], 3761, 16, "#7a5a3a");
  ctx.restore();
  // pavement + crossing
  poly(ctx, [[-60, 1040], [1140, 1030], [1140, 2000], [-60, 2000]], 3770, 1.5);
  paint(ctx, "#d8d2c4", C.ink, 6);
  for (let i = -2; i < 8; i++) {
    const x = ((i * 180 - pan * 1.2) % 1440 + 1440) % 1440 - 180;
    poly(ctx, [[x, 1300], [x + 110, 1300], [x + 150, 1420], [x + 40, 1420]], 3771 + i, 0.8);
    paint(ctx, "#f4f1ea", null);
  }
}

/** Inside the store: a drinks fridge (strawberry milk on the middle shelf) and the counter with a QR stand. */
export function storeInside(ctx: Ctx, abs: number) {
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#f6f8f6"], [1, "#e4ebe6"]]));
  rbox(ctx, 60, 260, 560, 900, 10, 3800, 1.2);
  paint(ctx, "#dfe9ee", C.ink, 7);
  for (let r = 0; r < 4; r++) {
    inkLine(ctx, [[80, 470 + r * 200], [600, 466 + r * 200]], 3801 + r, 6, "#b8c4ca");
    for (let k = 0; k < 4; k++) {
      if (r === 1) strawberryMilk(ctx, 140 + k * 125, 400 + r * 200, 0.62, 0, 3810 + k);
      else {
        rbox(ctx, 110 + k * 125, 330 + r * 200, 70, 120, 8, 3820 + r * 4 + k, 0.6);
        paint(ctx, ["#cfe8ff", "#fff0a8", "#d9f2c8", "#ffe0c4"][(k + r) % 4], C.ink, 3);
      }
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(140, 260);
  ctx.lineTo(260, 260);
  ctx.lineTo(120, 1160);
  ctx.lineTo(60, 1160);
  ctx.fill();
  // counter + QR stand
  poly(ctx, [[640, 900], [1140, 890], [1140, 1300], [640, 1310]], 3840, 1.2);
  paint(ctx, "#f2f2ee", C.ink, 6);
  rbox(ctx, 860, 740, 150, 170, 8, 3841, 1);
  paint(ctx, "#2fa36b", C.ink, 5);
  rbox(ctx, 880, 762, 110, 110, 4, 3842, 0.6);
  paint(ctx, "#fff", null);
  for (let i = 0; i < 25; i++)
    if (hash(i * 3.7) > 0.45) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(886 + (i % 5) * 20, 768 + Math.floor(i / 5) * 20, 16, 16);
    }
  poly(ctx, [[-60, 1300], [1140, 1290], [1140, 2000], [-60, 2000]], 3843, 1.5);
  paint(ctx, "#d9dcd6", C.ink, 6);
}

// ---------------------------------------------------------------- resources (preview and catalog)
/** Previews of whole sets: the 1080×1920 design frame. */
const FRAME = { width: 1080, height: 1920, duration: 3, prepare: loadFonts };
const unit = z.number().min(0).max(1);

export const resources = defineResources({
  entrance: resource({
    kind: "set",
    title: "玄关",
    description: "家门口的玄关：light 0 夜里开灯、1 清晨发蓝；door 0..1 门打开、走廊的光漏进来；挂钩上的头盔和黄色骑手服、存钱罐 jar、心脏病传单、日历、狗碗；pan 横向视差。",
    tags: ["玄关", "门", "家", "夜晚", "清晨"],
    usage: "entrance(ctx, abs, { light, door, helmet, jacket, jar, bowl, pan })",
    params: z.object({
      light: unit.default(0).describe("0 夜 … 1 清晨"),
      door: unit.default(0).describe("门打开"),
      helmet: z.boolean().default(false).describe("鞋柜上的头盔"),
      jacket: z.boolean().default(false).describe("挂钩上的黄色骑手服"),
      jar: unit.default(0.7).describe("存钱罐里的硬币"),
      bowl: z.boolean().default(false).describe("狗碗"),
    }),
    presets: { 家里的东西: { helmet: true, jacket: true, bowl: true }, 清晨: { light: 1, helmet: true, jacket: true, bowl: true }, 开门: { door: 1 } },
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        entrance(ctx, t, p);
      },
    },
  }),
  bedroom: resource({
    kind: "set",
    title: "他的卧室和床（《unhappy》）",
    description: "房间和床（床垫上沿约 y 960，前沿约 y 1150）：rain 窗外下雨，dawn 天亮。先画坐在床上的人，再画 bedBlanket() 盖住腿。",
    tags: ["卧室", "床", "被子", "房间", "雨"],
    usage: "bedroom(ctx, abs, { rain, dawn }); drawKid(…); bedBlanket(ctx)",
    params: z.object({ rain: unit.default(0).describe("窗外下雨"), dawn: unit.default(0).describe("天亮"), sitting: z.boolean().default(true).describe("预览里让他坐在床上") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        bedroom(ctx, t, p);
        if (p.sitting) {
          drawKid(ctx, 540, 640, 0.95, { arms: "phone", eyes: "tired" });
          bedBlanket(ctx);
        }
      },
    },
  }),
  hallway: resource({
    kind: "set",
    title: "房门外的走廊",
    description: "他房门外的走廊：门缝漏光和移动的影子 shadow，挂着的骑手服 jacket。",
    tags: ["走廊", "门", "家", "影子"],
    usage: "hallway(ctx, abs, { shadow, jacket })",
    params: z.object({ shadow: unit.default(0).describe("门缝里移动的影子"), jacket: z.boolean().default(true).describe("骑手服") }),
    presets: { 门后有人: { shadow: 0.8 } },
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        hallway(ctx, t, p);
      },
    },
  }),
  rainStreet: resource({
    kind: "set",
    title: "雨夜街道（宠物店）",
    description: "雨夜的街：shop 带宠物店橱窗（petShopWindow：暖光里的漂亮小狗，豆豆在外面看），pan 横向视差。加 rain() 和 splashes() 下雨。",
    tags: ["街道", "雨夜", "宠物店", "橱窗", "下雨"],
    usage: "rainStreet(ctx, abs, { shop, pan }); rain(ctx, abs, k); splashes(ctx, abs, y0, y1)",
    params: z.object({ shop: z.boolean().default(true).describe("宠物店"), pan: z.number().min(-300).max(300).default(0).describe("横向视差") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        rainStreet(ctx, t, p);
        rain(ctx, t, 1);
        splashes(ctx, t, 1500, 1900);
      },
    },
  }),
  busStop: resource({
    kind: "set",
    title: "公交站（雨夜）",
    description: "雨夜的公交站。",
    tags: ["公交站", "车站", "雨夜", "街道"],
    usage: "busStop(ctx, abs)",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        busStop(ctx, t);
        rain(ctx, t, 0.8);
      },
    },
  }),
  clinicFront: resource({
    kind: "set",
    title: "宠物医院门口",
    description: "夜里的宠物医院门口，doorsOpen 0..1 自动门打开。",
    tags: ["医院", "宠物医院", "门口", "夜晚"],
    usage: "clinicFront(ctx, abs, doorsOpen)",
    params: z.object({ doorsOpen: unit.default(0).describe("自动门打开") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        clinicFront(ctx, t, p.doorsOpen);
      },
    },
  }),
  clinicCounter: resource({
    kind: "set",
    title: "宠物医院前台（X 光灯箱）",
    description: "宠物医院里面：前台和看 X 光片的灯箱（xray 画在灯箱里）。",
    tags: ["医院", "前台", "X光", "兽医"],
    usage: "clinicCounter(ctx, abs)",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        clinicCounter(ctx, t);
      },
    },
  }),
  surgeryHall: resource({
    kind: "set",
    title: "手术室走廊",
    description: "手术室外的走廊：门上红色的「手术中」灯 lightOn、长椅、挂钟 clock（时针位置）、百叶窗 blinds、dawn 天亮、doorOpen 门打开。手术中的延时镜头用它。",
    tags: ["医院", "手术", "走廊", "等待", "挂钟"],
    usage: "surgeryHall(ctx, abs, { lightOn, clock, dawn, blinds, doorOpen })",
    params: z.object({
      lightOn: unit.default(1).describe("「手术中」灯"),
      clock: z.number().min(0).max(12).default(10).describe("挂钟时间（小时）"),
      dawn: unit.default(0).describe("天亮"),
      blinds: unit.default(1).describe("百叶窗放下多少"),
      doorOpen: unit.default(0).describe("门打开"),
    }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        surgeryHall(ctx, t, { ...p, clock: p.clock + t * 0.5 });
      },
    },
  }),
  recoveryRoom: resource({
    kind: "set",
    title: "住院笼（恢复室）",
    description: "恢复室：笼子里的软垫床、输液架、墙上的日历显示第 day 天，night 夜里。狗画在里面以后用 kennelBars 画笼子的栏杆。",
    tags: ["医院", "住院", "笼子", "恢复", "日历"],
    usage: "recoveryRoom(ctx, abs, { day, night }); drawDog(…); kennelBars(ctx, x0, x1, y0, y1, open)",
    params: z.object({ day: z.number().int().min(1).max(31).default(3).describe("日历上的日期"), night: unit.default(0).describe("夜里") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        recoveryRoom(ctx, t, p);
      },
    },
  }),
  coverTree: resource({
    kind: "set",
    title: "封面的树",
    description: "《unhappy》封面：房子的墙、草坪、一棵树；warm 0..1 暖色（结尾）。配落叶。",
    tags: ["封面", "树", "草坪", "结尾"],
    usage: "coverTree(ctx, abs, { warm })",
    params: z.object({ warm: unit.default(0).describe("暖色") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        coverTree(ctx, t, p);
      },
    },
  }),
  herRoom: resource({
    kind: "set",
    title: "女生房间（夜）",
    description: "她的房间：和男生房间镜像（床在左、窗在右），串灯 lights、拍立得，dawn 天亮。先画床上的她，再画 herBlanket() 粉色被子。",
    tags: ["卧室", "女生", "房间", "串灯", "夜晚"],
    usage: "herRoom(ctx, abs, { dawn, lights }); drawKid(…, { who: \"girl\" }); herBlanket(ctx)",
    params: z.object({ dawn: unit.default(0).describe("天亮"), lights: unit.default(1).describe("串灯"), sitting: z.boolean().default(true).describe("预览里让她坐在床上") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        herRoom(ctx, t, p);
        if (p.sitting) {
          drawKid(ctx, 540, 640, 0.95, { who: "girl", arms: "phone", eyes: "open", outfit: "pajamas" });
          herBlanket(ctx);
        }
      },
    },
  }),
  classroomFront: resource({
    kind: "set",
    title: "教室（从黑板往后拍）",
    description: "从黑板往后拍的教室：后墙的公告栏和钟、右侧窗户的阳光 sun。学生和课桌由镜头自己画：先画人，再画 deskFront 课桌。",
    tags: ["教室", "学校", "后墙", "阳光"],
    usage: "classroomFront(ctx, abs, { sun }); drawKid(…); deskFront(ctx, x, y, s, seed, items)",
    params: z.object({ sun: unit.default(1).describe("阳光"), student: z.boolean().default(true).describe("预览里放一个学生") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        classroomFront(ctx, t, p);
        if (p.student) {
          drawKid(ctx, 540, 1000, 0.8, { arms: "table" });
          deskFront(ctx, 540, 1330, 1);
        }
      },
    },
  }),
  classroomBoard: resource({
    kind: "set",
    title: "教室黑板（从后排往前拍）",
    description: "从后排座位往前拍：黑板上的斜面受力题和 F = ma（他熬夜做的那道物理题）、左侧阳光窗户 sun、前排同学的背影。越肩镜头用。",
    tags: ["教室", "黑板", "物理", "越肩", "学校"],
    usage: "classroomBoard(ctx, abs, { sun })",
    params: z.object({ sun: unit.default(1).describe("阳光") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        classroomBoard(ctx, t, p);
      },
    },
  }),
  schoolHall: resource({
    kind: "set",
    title: "学校走廊（明亮）",
    description: "明亮的学校走廊：左边窗户、右边教室门。",
    tags: ["学校", "走廊", "白天"],
    usage: "schoolHall(ctx, abs)",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        schoolHall(ctx, t);
      },
    },
  }),
  morningStreet: resource({
    kind: "set",
    title: "清晨街道（24 小时便利店）",
    description: "清晨的街和一家 24 小时便利店，pan 横向移动街道。",
    tags: ["街道", "清晨", "便利店", "早上"],
    usage: "morningStreet(ctx, abs, pan)",
    params: z.object({ speed: z.number().min(0).max(300).default(60).describe("预览里每秒平移多少") }),
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        morningStreet(ctx, t, t * p.speed);
      },
    },
  }),
  storeInside: resource({
    kind: "set",
    title: "便利店里面",
    description: "便利店里：饮料冰柜（中间一层有草莓牛奶）、收银台和付款码立牌。",
    tags: ["便利店", "冰柜", "收银台", "商店"],
    usage: "storeInside(ctx, abs)",
    preview: {
      ...FRAME,
      draw(ctx, t) {
        beginFrame(ctx, t);
        storeInside(ctx, t);
      },
    },
  }),
  rain: resource({
    kind: "effect",
    title: "雨和水花",
    description: "rain：整个画面的雨丝，k 强度 0..1，wind 倾斜；splashes：在 y0–y1 的地面带上溅起的水花；puddle：一个水洼（会泛涟漪）。",
    tags: ["雨", "下雨", "天气", "水花", "水洼"],
    usage: "rain(ctx, abs, k, wind); splashes(ctx, abs, y0, y1, k); puddle(ctx, x, y, rx, ry, abs)",
    params: z.object({ k: unit.default(1).describe("雨的强度"), wind: z.number().min(-0.6).max(0.6).default(0.18).describe("风（倾斜）") }),
    preview: {
      ...FRAME,
      background: "#1a2035",
      draw(ctx, t, p) {
        puddle(ctx, 540, 1650, 260, 60, t);
        rain(ctx, t, p.k, p.wind);
        splashes(ctx, t, 1500, 1900, p.k);
      },
    },
  }),
  petShopWindow: resource({
    kind: "prop",
    title: "宠物店橱窗",
    description: "暖光的宠物店橱窗，里面有漂亮的小狗（pup），glowK 光的强度。rainStreet 的 shop 自带一个。",
    tags: ["宠物店", "橱窗", "小狗"],
    usage: "petShopWindow(ctx, abs, x, y, w, h, glowK, pup)",
    params: z.object({ glowK: unit.default(1).describe("暖光"), pup: unit.default(1).describe("小狗") }),
    preview: {
      width: 800,
      height: 700,
      duration: 2,
      background: "#141a2e",
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        petShopWindow(ctx, t, 80, 80, 640, 540, p.glowK, p.pup);
      },
    },
  }),
  kennelBars: resource({
    kind: "prop",
    title: "笼子栏杆",
    description: "住院笼的栏杆，画在狗的上面（先画狗）；open 0..1 打开。",
    tags: ["笼子", "栏杆", "医院"],
    usage: "kennelBars(ctx, x0, x1, y0, y1, open)",
    params: z.object({ open: unit.default(0).describe("打开") }),
    preview: {
      width: 800,
      height: 600,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        drawDog(ctx, 400, 330, 1, { pose: "lie", cone: true });
        kennelBars(ctx, 120, 680, 80, 540, p.open);
      },
    },
  }),
  coinJar: resource({
    kind: "prop",
    title: "存钱罐",
    description: "玻璃存钱罐，fill 0..1 硬币满到多少（攒手术费）。",
    tags: ["存钱罐", "硬币", "攒钱"],
    usage: "coinJar(ctx, x, y, s, fill)",
    params: z.object({ fill: unit.default(0.5).describe("满到多少") }),
    preview: {
      width: 400,
      height: 500,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        coinJar(ctx, 200, 300, 1.6, p.fill);
      },
    },
  }),
  vetFlyer: resource({
    kind: "prop",
    title: "心脏病传单",
    description: "兽医关于狗狗心脏病的传单（门口桌上的线索）。",
    tags: ["传单", "线索", "医院", "心脏病"],
    usage: "vetFlyer(ctx, x, y, s, rot)",
    preview: {
      width: 500,
      height: 600,
      prepare: loadFonts,
      draw(ctx, t) {
        beginFrame(ctx, t);
        vetFlyer(ctx, 250, 300, 1.6, -0.06);
      },
    },
  }),
  strawberryMilk: resource({
    kind: "prop",
    title: "草莓牛奶",
    description: "粉色草莓牛奶盒（他们的梗），可以在正面贴便利贴 note（noteK 0..1 出现）。",
    tags: ["草莓牛奶", "饮料", "便利贴"],
    usage: "strawberryMilk(ctx, x, y, s, rot, seed, note, noteK)",
    params: z.object({ note: z.string().default("早安").describe("便利贴上的字（空 = 不贴）") }),
    preview: {
      width: 500,
      height: 700,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        strawberryMilk(ctx, 250, 380, 1.6, 0, 3300, p.note || undefined);
      },
    },
  }),
  textbook: resource({
    kind: "prop",
    title: "举起的课本（物理）",
    description: "举起来、封面朝镜头的课本（物理），(x, y) 是封面中心；bookFingers 画两边扣着的手指（同样的 x, y, s, rot）。",
    tags: ["课本", "书", "物理", "学校"],
    usage: "textbook(ctx, x, y, s, rot); bookFingers(ctx, x, y, s, rot, skin)",
    preview: {
      width: 600,
      height: 700,
      prepare: loadFonts,
      draw(ctx, t) {
        beginFrame(ctx, t);
        textbook(ctx, 300, 350, 1.4, -0.05);
        bookFingers(ctx, 300, 350, 1.4, -0.05);
      },
    },
  }),
  huggedPillow: resource({
    kind: "prop",
    title: "抱着的枕头",
    description: "抱在胸前的枕头：上臂沿枕头两侧下来，前臂在前面交叉，末端是简单的圆手。袖子、袖口、肤色传进来（男主帽衫 / 女主睡衣）。",
    tags: ["枕头", "抱", "开心"],
    usage: "huggedPillow(ctx, x, y, s, sleeve, cuff, skin)",
    preview: {
      width: 600,
      height: 600,
      draw(ctx, t) {
        beginFrame(ctx, t);
        huggedPillow(ctx, 300, 300, 1.2, "#f3a9c0", "#e18aa8", "#f6e1c3");
      },
    },
  }),
  deskFront: resource({
    kind: "prop",
    title: "正面课桌",
    description: "正对镜头的课桌（画在坐着的学生前面），(x, y) 是桌面中心；items 在桌上画东西。",
    tags: ["课桌", "学校", "桌子"],
    usage: "deskFront(ctx, x, y, s, seed, (c) => …)",
    preview: {
      width: 700,
      height: 500,
      draw(ctx, t) {
        beginFrame(ctx, t);
        deskFront(ctx, 350, 200, 1);
      },
    },
  }),
});
