// 《屏蔽》她那一边的场景：雪、她的房间（雪夜的窗、串灯、台灯 → 月光）、窗外的街、手机近景后面失焦的房间、
// 她的特写（被子拉到鼻子）、枕头俯拍、被窝里探头、三年前的宿舍。爸爸在 dad.ts，岗亭在 booth.ts。
import { clamp } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, bokehDisc, blob, camera, curve, fillBg, filtered, glow, hash, inkLine, litFigure, oval, paint, poly, rbox, rr, text, F, vgrad } from "@materials/s0rrow/code/draw";
import { snow } from "@materials/s0rrow/code/blocked/snow";
import { drawKid, type KidPose } from "@materials/s0rrow/code/kid";
import { drawPerson } from "@materials/s0rrow/code/people";
import { herBlanket, herRoom } from "@materials/s0rrow/code/places";
import { streetBelow } from "@materials/s0rrow/code/sets";

/** Out-of-focus room behind a phone close-up: warm fairy-light discs, the cold window glow, falling snow beyond. */
export function roomBokeh(c: Ctx, abs: number, o: { dark?: number; shift?: [number, number] } = {}) {
  const dark = o.dark ?? 0;
  const [sx, sy] = o.shift ?? [0, 0];
  fillBg(c, vgrad(c, 0, H, [[0, "#1d1834"], [1, "#0d0b18"]]));
  c.save();
  c.translate(sx, sy);
  // the window (cold) on the right
  glow(c, 900, 520, 520, "rgba(120,150,230,0.4)", 1 - dark * 0.6);
  // fairy lights across the top (warm)
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 150 + Math.sin(i * 1.7) * 20,
      y = 300 + Math.sin(i * 2.3) * 70;
    const tw = 0.8 + 0.2 * Math.sin(abs * 2.1 + i);
    bokehDisc(c, x, y, 58 + hash(i * 3.1) * 30, i % 3 ? "255,206,140" : "255,170,200", 0.4 * tw * (1 - dark * 0.8));
  }
  c.restore();
  // big soft snowflakes drifting past the lens
  filtered(c, "blur(6px)", (k) => snow(k, abs, { n: 26, seed: 31, speed: 60, size: 9, alpha: 0.35, drift: 40 }), "bokehSnow");
  if (dark > 0) {
    c.fillStyle = `rgba(4,4,12,${(0.55 * dark).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
}

// ---------------------------------------------------------------- her room
/** Her room at night: snow in the window, the fairy lights, a bedside lamp (`lamp` 0..1 on), and the room going
 *  dark (`dark` 0..1) when the lamp is off. Draw her (and herBlanket) after it, then `herRoomShade`. */
export function herRoomSnow(c: Ctx, abs: number, o: { lamp?: number } = {}) {
  herRoom(c, abs, { lights: 1 });
  // snow in the window (650, 250, 360, 450)
  c.save();
  c.beginPath();
  c.rect(650, 250, 360, 450);
  c.clip();
  snow(c, abs, { x: 640, y: 240, w: 380, h: 470, n: 60, seed: 11, speed: 70, size: 3.4, alpha: 0.9, drift: 14 });
  c.restore();
  // bedside lamp on the shelf, next to the bear (LAMP_AT)
  const lamp = o.lamp ?? 1;
  const [lx, ly] = LAMP_AT;
  inkLine(c, [[lx, ly + 10], [lx, ly + 108]], 5102, 6, "#5b4a3a");
  oval(c, lx, ly + 110, 34, 9, 5103, 0.5);
  paint(c, "#5b4a3a", C.ink, 3);
  poly(c, [[lx - 46, ly + 18], [lx + 46, ly + 18], [lx + 28, ly - 44], [lx - 28, ly - 44]], 5101, 1);
  paint(c, lamp > 0 ? "#ffe6b8" : "#8f8070", C.ink, 4);
  if (lamp > 0) {
    glow(c, lx, ly, 460, "rgba(255,196,120,0.55)", lamp);
    glow(c, lx, ly + 20, 90, "rgba(255,240,200,0.9)", lamp);
  }
}
/** the bedside lamp's bulb (design units): her hand reaches here to switch it off */
export const LAMP_AT: Pt = [830, 690];
/** The room's light after the figures: warm lamp pool or the dark with only the window. */
export function herRoomShade(c: Ctx, abs: number, o: { lamp: number; phone?: [number, number, number] }) {
  const dark = 1 - o.lamp;
  if (dark > 0) {
    c.save();
    c.fillStyle = `rgba(6,6,20,${(0.62 * dark).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
    glow(c, 830, 470, 360, "rgba(110,140,230,0.25)", dark);
  }
  if (o.phone) {
    const [x, y, a] = o.phone;
    glow(c, x, y, 420, "rgba(150,180,255,0.55)", a);
  }
  void abs;
}

/** Her sitting up in bed (pink pyjamas), as in the library's room. */
export function herInBed(c: Ctx, x: number, y: number, s: number, p: KidPose = {}) {
  drawKid(c, x, y, s, { who: "girl", outfit: "pajamas", body: "bust", arms: "phone", ...p });
}

// ---------------------------------------------------------------- the street below her window
export function windowStreet(c: Ctx, abs: number) {
  fillBg(c, "#0d1024");
  c.save();
  c.translate(0, 820);
  streetBelow(c, abs);
  c.restore();
  // night tint and snow
  c.fillStyle = "rgba(10,14,40,0.35)";
  c.fillRect(-60, -60, W + 120, H + 120);
  // a street lamp
  inkLine(c, [[860, 1900], [860, 1180], [800, 1150]], 5201, 10, "#2b2f45");
  glow(c, 790, 1160, 380, "rgba(255,190,110,0.5)", 1);
  oval(c, 790, 1160, 22, 12, 5202, 0.6);
  paint(c, "#ffe2a6", null);
  snow(c, abs, { n: 140, seed: 21, speed: 110, size: 4.5, alpha: 0.9, drift: 30 });
  filtered(c, "blur(5px)", (k) => snow(k, abs, { n: 20, seed: 23, speed: 160, size: 12, alpha: 0.5, drift: 40 }), "streetSnow");
  // the window frame we look through
  c.fillStyle = "#1a1530";
  c.fillRect(-60, -60, 110, H + 120);
  c.fillRect(W - 50, -60, 110, H + 120);
  c.fillRect(-60, -60, W + 120, 120);
}

// ---------------------------------------------------------------- the dorm three years ago
export function dorm(c: Ctx, abs: number) {
  // the wall under the strip light
  fillBg(c, vgrad(c, 0, H, [[0, "#f6e2bc"], [0.6, "#ecd0a2"], [1, "#d9b088"]]));
  poly(c, [[-60, -60], [1140, -60], [1140, 96], [-60, 104]], 5800, 1);
  paint(c, "#fbf0d8", C.ink, 5);
  rbox(c, 340, 44, 400, 26, 12, 5801, 0.8);
  paint(c, "#fffef2", C.ink, 4);
  glow(c, 540, 60, 520, "rgba(255,250,225,0.55)");
  // the window between the two loft beds: night outside, snow, the lit windows of the dorm block opposite
  const wx = 372,
    wy = 170,
    ww = 336,
    wh = 400;
  rbox(c, wx, wy, ww, wh, 6, 5802, 1);
  paint(c, vgrad(c, wy, wy + wh, [[0, "#1d2450"], [1, "#3a3a6a"]]), C.ink, 7);
  c.save();
  rbox(c, wx, wy, ww, wh, 6, 5802, 1);
  c.clip();
  poly(c, [[wx - 10, wy + 170], [wx + ww + 10, wy + 150], [wx + ww + 10, wy + wh + 10], [wx - 10, wy + wh + 10]], 5803, 1);
  paint(c, "#2a2c4e", null);
  for (let i = 0; i < 18; i++) {
    const lit = hash(i * 3.9) > 0.45;
    const x = wx + 20 + (i % 6) * 52,
      y = wy + 190 + Math.floor(i / 6) * 60;
    c.fillStyle = lit ? "rgba(255,214,140,0.9)" : "rgba(20,22,46,0.9)";
    c.fillRect(x, y, 30, 34);
  }
  snow(c, abs, { x: wx - 20, y: wy - 20, w: ww + 40, h: wh + 40, n: 50, seed: 88, speed: 60, size: 3.5, alpha: 0.9, drift: 10 });
  c.restore();
  inkLine(c, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 5804, 7, "#c7b08a");
  // curtains tied back, a towel and a hoodie drying on the rail
  for (const side of [-1, 1]) {
    const e = side < 0 ? wx : wx + ww;
    const pts: Pt[] = [[e - 56 * side * -1 - (side < 0 ? 0 : 0), wy - 32], [e + 34 * -side, wy - 32], [e + 6 * -side, wy + 210], [e + 30 * -side, wy + wh + 44], [e - 54 * -side, wy + wh + 44]];
    poly(c, pts, 5805 + side, 1.2);
    paint(c, "#9fc79a", C.ink, 5);
    for (let k = 1; k < 3; k++) inkLine(c, [[e - 54 * -side + k * 28 * -side, wy - 26], [e - 54 * -side + k * 26 * -side, wy + wh + 40]], 5806 + side * 3 + k, 3, "rgba(40,80,40,0.25)");
  }
  inkLine(c, [[wx - 40, wy - 34], [wx + ww + 40, wy - 34]], 5807, 6, "#8a7a64");
  poly(c, [[wx + 70, wy - 34], [wx + 130, wy - 34], [wx + 128, wy + 90], [wx + 72, wy + 96]], 5808, 1);
  paint(c, "#f2c6d4", C.ink, 4);
  inkLine(c, [[wx + 72, wy + 78], [wx + 128, wy + 72]], 5809, 3, "rgba(255,255,255,0.7)");
  poly(c, [[wx + 196, wy - 34], [wx + 264, wy - 34], [wx + 296, wy + 30], [wx + 270, wy + 46], [wx + 264, wy + 130], [wx + 196, wy + 130], [wx + 190, wy + 46], [wx + 164, wy + 30]], 5810, 1);
  paint(c, "#7fa8d8", C.ink, 4);
  // two loft beds (bed above, desk below), curtains half open
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -80 : 720,
      x1 = side < 0 ? 360 : 1160;
    poly(c, [[x0, 330], [x1, 330], [x1, 350], [x0, 350]], 5810 + side, 0.8);
    paint(c, "#d4dde8", C.ink, 5);
    poly(c, [[x0, 280], [x1, 280], [x1, 296], [x0, 296]], 5812 + side, 0.8);
    paint(c, "#d4dde8", C.ink, 4);
    for (let k = 0; k < 5; k++) {
      const x = x0 + 30 + k * ((x1 - x0 - 60) / 4);
      inkLine(c, [[x, 280], [x, 330]], 5814 + side * 10 + k, 4, "#aab6c6");
    }
    // the mattress and quilt peeking over the rail
    poly(c, [[x0, 252], [x1 - 20, 246], [x1, 262], [x1, 282], [x0, 282]], 5820 + side, 1.2);
    paint(c, side < 0 ? "#f7c5d5" : "#cfd8f2", C.ink, 4);
    // bed curtain hanging from the ceiling, gathered at one end
    const ca = side < 0 ? -80 : 990,
      cb = side < 0 ? 90 : 1160;
    const hem: Pt[] = [];
    for (let k = 0; k <= 6; k++) hem.push([cb + ((ca - cb) * k) / 6, 334 + (k % 2) * 10]);
    poly(c, [[ca, 96], [cb, 96], ...hem], 5822 + side, 1);
    paint(c, side < 0 ? "#f0a9bf" : "#8fa3c9", C.ink, 5);
    for (let k = 1; k < 6; k++) inkLine(c, [[ca + ((cb - ca) * k) / 6, 104], [ca + ((cb - ca) * k) / 6 + 4, 330]], 5824 + side * 7 + k, 3, "rgba(0,0,0,0.14)");
    // ladder
    const lx = side < 0 ? 330 : 750;
    inkLine(c, [[lx - 22, 340], [lx - 22, 1180]], 5828 + side, 6, "#aab6c6");
    inkLine(c, [[lx + 22, 340], [lx + 22, 1180]], 5830 + side, 6, "#aab6c6");
    for (let y = 420; y < 1180; y += 110) inkLine(c, [[lx - 22, y], [lx + 22, y]], 5832 + side + y, 5, "#aab6c6");
    // the shelf under the bed: books, a plush, a cup
    const sx0 = side < 0 ? -40 : 790,
      sx1 = side < 0 ? 300 : 1120;
    inkLine(c, [[sx0, 520], [sx1, 520]], 5840 + side, 8, "#b0865a");
    let bx = sx0 + 10;
    for (let k = 0; bx < sx1 - 60; k++) {
      const bw = 22 + hash(k * 3.1 + side) * 18,
        bh = 70 + hash(k * 5.3 + side) * 46;
      const cols = ["#d9705f", "#6f9fd8", "#f2c94c", "#8cc084", "#c58fd6", "#f29fb5"];
      rbox(c, bx, 516 - bh, bw, bh, 3, 5850 + k + side * 20, 0.6);
      paint(c, cols[(k + (side < 0 ? 0 : 3)) % cols.length], C.ink, 3);
      bx += bw + 3;
      if (k === 3) bx += 70;
    }
    if (side < 0) {
      // her desk lamp, glowing
      inkLine(c, [[230, 700], [262, 610], [212, 580]], 5860, 6, "#f2f2f2");
      poly(c, [[180, 560], [244, 556], [232, 600], [190, 604]], 5861, 1);
      paint(c, "#ffffff", C.ink, 4);
      glow(c, 212, 610, 220, "rgba(255,236,180,0.6)");
    } else {
      // a cactus and a mug on the right
      rbox(c, 1010, 470, 40, 46, 6, 5862, 0.8);
      paint(c, "#e8a07a", C.ink, 3);
      blob(c, [[1018, 474], [1022, 420], [1036, 414], [1042, 474]], 5863, 1);
      paint(c, "#7fb069", C.ink, 3);
    }
  }
  // fairy lights over the window and across the wall
  const bulbs = 13;
  c.save();
  c.strokeStyle = "#5a4630";
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const x = 120 + u * 840,
      y = 130 + Math.sin(u * Math.PI * 2) * 22 + Math.sin(u * Math.PI) * 30;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  for (let i = 0; i < bulbs; i++) {
    const u = (i + 0.5) / bulbs;
    const x = 120 + u * 840,
      y = 130 + Math.sin(u * Math.PI * 2) * 22 + Math.sin(u * Math.PI) * 30 + 14;
    const tw = 0.8 + 0.2 * Math.sin(abs * 2 + i);
    glow(c, x, y, 60, i % 3 === 0 ? "rgba(255,170,200,0.7)" : "rgba(255,226,150,0.75)", tw);
    oval(c, x, y, 8, 11, 5870 + i, 0.5);
    paint(c, i % 3 === 0 ? "#ffc0d6" : "#ffe3a0", C.ink, 2.5);
  }
  // posters, a polaroid strip and the calendar with the 9th circled
  rbox(c, 790, 600, 150, 200, 6, 5880, 1);
  paint(c, "#9fd4f5", C.ink, 4);
  oval(c, 865, 680, 40, 40, 5881, 1);
  paint(c, "#fff6c9", C.ink, 3);
  rbox(c, 960, 640, 130, 170, 6, 5882, 1);
  paint(c, "#ffd3dc", C.ink, 4);
  rbox(c, 60, 600, 150, 170, 4, 5883, 1);
  paint(c, "#fffdf6", C.ink, 4);
  text(c, "12月", 135, 628, { size: 30, fill: "#d9534f", font: F.cn });
  for (let k = 0; k < 15; k++) {
    const x = 82 + (k % 5) * 27,
      y = 668 + Math.floor(k / 5) * 30;
    c.fillStyle = "rgba(60,50,40,0.5)";
    c.fillRect(x, y, 14, 4);
    if (k === 8) {
      c.strokeStyle = "#d9534f";
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(x + 7, y + 2, 15, 12, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  // the desks along the bottom (they sit at them)
  poly(c, [[-60, 1180], [1140, 1170], [1140, 2000], [-60, 2000]], 5890, 1);
  paint(c, "#b98a5e", C.ink, 6);
  inkLine(c, [[-60, 1196], [1140, 1186]], 5891, 6, "rgba(255,230,190,0.5)");
  // on the desk: an open notebook and a pen, a cup of instant noodles, a little round mirror
  poly(c, [[70, 1540], [400, 1500], [430, 1760], [96, 1800]], 5892, 1);
  paint(c, "#fffdf4", C.ink, 5);
  inkLine(c, [[250, 1520], [262, 1780]], 5893, 4, "rgba(0,0,0,0.25)");
  for (let k = 0; k < 6; k++) {
    inkLine(c, [[110, 1590 + k * 32 - k * 3], [230, 1580 + k * 32 - k * 3]], 5894 + k, 2.5, "rgba(90,110,170,0.45)");
    inkLine(c, [[285, 1576 + k * 32 - k * 4], [400, 1564 + k * 32 - k * 4]], 5900 + k, 2.5, "rgba(90,110,170,0.45)");
  }
  inkLine(c, [[330, 1820], [480, 1700]], 5906, 10, "#5f8fd0");
  inkLine(c, [[472, 1706], [488, 1694]], 5907, 10, "#2b2b2b");
  poly(c, [[790, 1560], [950, 1560], [930, 1760], [810, 1760]], 5908, 1);
  paint(c, "#fdf6e8", C.ink, 5);
  oval(c, 870, 1560, 80, 22, 5909, 1);
  paint(c, "#f2c94c", C.ink, 4);
  inkLine(c, [[808, 1640], [932, 1640]], 5910, 14, "#d9534f");
  for (let k = 0; k < 3; k++) inkLine(c, [[840 + k * 30, 1530], [850 + k * 30, 1470], [836 + k * 30, 1420]], 5911 + k, 3, "rgba(255,255,255,0.6)");
  oval(c, 620, 1720, 70, 70, 5915, 1);
  paint(c, "#f7c5d5", C.ink, 5);
  oval(c, 620, 1720, 50, 50, 5916, 1);
  paint(c, "#dbe8f5", C.ink, 3);
}

/** her two roommates leaning in to look at her phone and laughing */
export function roommates(c: Ctx, abs: number, k: number) {
  const lean = 40 * k;
  drawPerson(c, 230 - lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "long", hairColor: "#3a2414", top: "#f2c94c", face: k > 0.5 ? "laugh" : "smile", body: "bust", tilt: 0.15 * k, arms: k > 0.5 ? "laugh" : "down", seed: 961 });
  drawPerson(c, 850 + lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", face: k > 0.5 ? "laugh" : "smile", body: "bust", tilt: -0.15 * k, seed: 962 });
  void abs;
}

// ---------------------------------------------------------------- her close-ups (refined)
/** Her pink duvet up close, top edge at `top` (design y): a thick hem, folds, little white hearts, shaded away from
 *  the phone's light; `grip` 0..1 brings her two round hands up to clutch its edge; `dark` 0..1 = the lamp is off. */
export function duvetClose(c: Ctx, abs: number, top: number, o: { grip?: number; dark?: number; cx?: number } = {}) {
  const cx = o.cx ?? 540;
  const dark = o.dark ?? 0;
  const edge: Pt[] = [[-90, top + 46], [140, top + 4], [330, top + 22], [cx, top - 4], [760, top + 18], [950, top - 2], [1170, top + 36]];
  const path = () => blob(c, [...edge, [1170, H + 90], [-90, H + 90]], 6501, 1.6);
  path();
  const g = c.createLinearGradient(0, top, 0, top + 700);
  g.addColorStop(0, "#f7b9cb");
  g.addColorStop(1, "#d98aa3");
  c.fillStyle = g;
  c.fill();
  c.save();
  path();
  c.clip();
  // folds running down from the edge, shade on the right
  for (let i = 0; i < 5; i++) {
    const fx = 120 + i * 210 + Math.sin(i * 2.3) * 30;
    inkLine(c, [[fx, top + 30], [fx + 30, top + 220], [fx + 10, top + 520]], 6502 + i, 4, "rgba(170,80,110,0.4)");
  }
  blob(c, [[760, top], [1170, top + 20], [1170, H], [820, H]], 6510, 2);
  c.fillStyle = "rgba(150,70,100,0.25)";
  c.fill();
  // little white hearts
  for (let i = 0; i < 22; i++) {
    const hx = hash(i * 3.7) * 1080,
      hy = top + 120 + hash(i * 5.1) * 700;
    c.save();
    c.translate(hx, hy);
    c.rotate((hash(i) - 0.5) * 0.6);
    c.fillStyle = "rgba(255,255,255,0.75)";
    c.beginPath();
    c.moveTo(0, 8);
    c.bezierCurveTo(-14, -2, -10, -12, -4, -12);
    c.bezierCurveTo(-1, -12, 0, -9, 0, -7);
    c.bezierCurveTo(0, -9, 1, -12, 4, -12);
    c.bezierCurveTo(10, -12, 14, -2, 0, 8);
    c.fill();
    c.restore();
  }
  // the hem along the top, lit by the phone from below-front
  curve(c, edge.map(([x, y]) => [x, y + 26]) as Pt[], 6511, 1.4);
  c.strokeStyle = "rgba(150,70,100,0.4)";
  c.lineWidth = 4;
  c.stroke();
  glow(c, cx, top + 380, 520, "rgba(190,210,255,0.35)");
  if (dark > 0) {
    c.fillStyle = `rgba(16,10,34,${(0.5 * dark).toFixed(3)})`;
    c.fillRect(-90, top - 60, 1260, H);
  }
  c.restore();
  path();
  paint(c, null, C.ink, 7);
  // her hands clutching the edge
  const grip = o.grip ?? 0;
  if (grip > 0) {
    for (const side of [-1, 1]) {
      const hx = cx + side * 132,
        hy = top + 14 + (1 - grip) * 80;
      c.save();
      c.globalAlpha *= Math.min(1, grip * 2);
      oval(c, hx, hy, 44, 40, 6520 + side, 0.8);
      paint(c, "#f6e1c3", C.ink, 5);
      for (let k = 0; k < 3; k++) inkLine(c, [[hx - 22 + k * 20, hy + 10], [hx - 20 + k * 20, hy + 30]], 6522 + k + side * 4, 2.4, "#d2a882");
      c.restore();
    }
  }
  void abs;
}

/** Her face over the duvet, up close, at night: the blurred room behind (fairy lights, the snowy window), her lit from
 *  below by the phone (cold) with a cold rim from the window; `lamp` 1 = bedside lamp on (warm, lighter). */
export function herFace(c: Ctx, abs: number, o: { pose: KidPose; lamp: number; top: number; grip?: number; x?: number; y?: number; s?: number }) {
  const x = o.x ?? 540,
    y = o.y ?? 780,
    s = o.s ?? 1.58;
  const dark = 1 - o.lamp;
  filtered(c, `blur(7px) brightness(${(0.85 - 0.4 * dark).toFixed(2)})`, (b) => {
    camera(b, 540, 620, 1.9, 0, 0, 120);
    herRoomSnow(b, abs, { lamp: o.lamp });
  }, "herFaceBg");
  if (dark > 0) {
    c.fillStyle = `rgba(6,6,22,${(0.35 * dark).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
  litFigure(c, (k) => herInBed(k, x, y, s, { ...o.pose, arms: "down" }), {
    shade: 0.18 + 0.25 * dark,
    shadeCol: "rgb(20,14,40)",
    lights: [
      { x, y: y + 470, r: 470, rgb: "175,200,255", a: 0.42 },
      ...(o.lamp > 0 ? [{ x: 980, y: 560, r: 600, rgb: "255,190,120", a: 0.3 * o.lamp }] : []),
    ],
    rim: { ux: 1, uy: -0.25, rgb: "160,185,255", a: 0.35 + 0.15 * dark },
  });
  duvetClose(c, abs, o.top, { grip: o.grip, dark: dark * 0.6, cx: x });
  // the phone (below the frame) is the key light: a soft cold glow coming up
  glow(c, x, H + 40, 900, "rgba(150,180,255,0.3)");
  const v = c.createRadialGradient(x, y, 300, x, y, 1050);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(2,3,12,${(0.45 + 0.25 * dark).toFixed(2)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}

// ---------------------------------------------------------------- her bed, from above and in the dark
/** little white hearts scattered over a rect (the duvet's print) */
function hearts(c: Ctx, x: number, y: number, w: number, h: number, n: number, seed: number, a = 0.75) {
  for (let i = 0; i < n; i++) {
    c.save();
    c.translate(x + hash(seed + i * 3.7) * w, y + hash(seed + i * 5.1) * h);
    c.rotate((hash(seed + i) - 0.5) * 0.8);
    c.fillStyle = `rgba(255,255,255,${a})`;
    c.beginPath();
    c.moveTo(0, 8);
    c.bezierCurveTo(-14, -2, -10, -12, -4, -12);
    c.bezierCurveTo(-1, -12, 0, -9, 0, -7);
    c.bezierCurveTo(0, -9, 1, -12, 4, -12);
    c.bezierCurveTo(10, -12, 14, -2, 0, 8);
    c.fill();
    c.restore();
  }
}

/** Her phone lying face down: a pink case with a sunflower sticker and the camera bump; (x, y) = centre. */
export function herPhoneBack(c: Ctx, x: number, y: number, w: number, h: number, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  rr(c, -w / 2, -h / 2, w, h, w * 0.16);
  c.fillStyle = "#f4b4c6";
  c.fill();
  c.lineWidth = Math.max(3, w * 0.025);
  c.strokeStyle = C.ink;
  c.stroke();
  rr(c, -w / 2 + w * 0.08, -h / 2 + w * 0.08, w * 0.4, w * 0.4, w * 0.1);
  c.fillStyle = "#e58fa9";
  c.fill();
  c.stroke();
  for (const [u, v] of [[0.18, 0.18], [0.18, 0.36], [0.36, 0.18]]) {
    c.fillStyle = "#1c1c22";
    c.beginPath();
    c.arc(-w / 2 + w * (0.08 + u), -h / 2 + w * (0.08 + v), w * 0.06, 0, Math.PI * 2);
    c.fill();
  }
  // the sunflower sticker
  c.translate(w * 0.12, h * 0.16);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    c.fillStyle = "#ffd23a";
    c.beginPath();
    c.ellipse(Math.cos(a) * w * 0.12, Math.sin(a) * w * 0.12, w * 0.08, w * 0.04, a, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#7a4a24";
  c.beginPath();
  c.arc(0, 0, w * 0.08, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Her bed seen from straight above in the dark: the pillow (lace hem, her sunflower clip left on it), the duvet with
 *  its hearts, a band of moonlight across both. */
export function bedFromAbove(c: Ctx, abs: number) {
  fillBg(c, "#120f20");
  // sheet
  blob(c, [[40, 380], [1040, 360], [1080, 1900], [20, 1920]], 6601, 3);
  paint(c, "#3c3350", C.ink, 6);
  // pillow: puffy, with a lace hem and a stitched seam
  const pil: Pt[] = [[150, 520], [540, 490], [950, 520], [990, 760], [960, 1290], [540, 1320], [110, 1290], [90, 760]];
  blob(c, pil, 6602, 3);
  paint(c, "#efe3ea", C.ink, 6);
  c.save();
  blob(c, pil, 6602, 3);
  c.clip();
  blob(c, [[600, 500], [990, 520], [990, 1320], [700, 1330]], 6603, 3);
  paint(c, "rgba(140,110,150,0.25)", null);
  for (let k = 0; k < 4; k++) inkLine(c, [[220 + k * 180, 560], [260 + k * 170, 900], [230 + k * 180, 1250]], 6604 + k, 3, "rgba(150,120,160,0.35)");
  c.restore();
  for (let k = 0; k < 28; k++) {
    const u = k / 28;
    oval(c, 150 + u * 800, 515 - Math.sin(u * Math.PI) * 26, 14, 9, 6610 + k, 0.4);
    paint(c, "#fff8fb", "rgba(0,0,0,0.35)", 2);
  }
  // her clip, left on the pillow
  sunflowerOn(c, 700, 690, 0.9);
  // the duvet coming up over the bottom of the frame
  const duv: Pt[] = [[-80, 1360], [300, 1300], [700, 1330], [1160, 1290], [1160, 2000], [-80, 2000]];
  blob(c, duv, 6620, 2);
  paint(c, "#d9879f", C.ink, 6);
  c.save();
  blob(c, duv, 6620, 2);
  c.clip();
  hearts(c, -40, 1340, 1160, 600, 18, 6621);
  for (let k = 0; k < 4; k++) inkLine(c, [[100 + k * 260, 1330], [140 + k * 250, 1600], [120 + k * 260, 1950]], 6630 + k, 4, "rgba(150,60,90,0.4)");
  c.restore();
  // moonlight in a soft diagonal band from the window, the rest dark
  c.save();
  c.globalCompositeOperation = "lighter";
  const g = c.createLinearGradient(800, 0, 300, 1920);
  g.addColorStop(0, "rgba(120,150,230,0)");
  g.addColorStop(0.45, "rgba(120,150,230,0.14)");
  g.addColorStop(0.6, "rgba(120,150,230,0)");
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
  c.restore();
  c.fillStyle = "rgba(8,6,22,0.78)";
  c.fillRect(-60, -60, W + 120, H + 120);
  void abs;
}

function sunflowerOn(c: Ctx, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    oval(c, Math.cos(a) * 26, Math.sin(a) * 26, 16, 9, 6640 + k, 0.4, a);
    paint(c, "#ffd23a", C.ink, 2.5);
  }
  oval(c, 0, 0, 16, 16, 6650, 0.4);
  paint(c, "#7a4a24", C.ink, 3);
  c.restore();
}

/** Her bed in the dark from the side: she's a lump under the duvet (hearts), the phone glowing on the pillow; `peek`
 *  0..1 brings her head up out of the duvet, lit by the phone. */
export function lumpInBed(c: Ctx, abs: number, peek: number, phoneLit: number) {
  herRoomSnow(c, abs, { lamp: 0 });
  c.fillStyle = "rgba(6,6,20,0.55)";
  c.fillRect(-60, -60, W + 120, H + 120);
  glow(c, 830, 470, 360, "rgba(110,140,230,0.22)");
  // pillow and her phone lying on it, screen up
  blob(c, [[40, 760], [440, 740], [470, 860], [30, 880]], 6701, 2);
  paint(c, "#cfc2d8", C.ink, 5);
  c.save();
  c.translate(452, 792);
  c.rotate(-0.12);
  rr(c, -58, -26, 116, 52, 10);
  c.fillStyle = phoneLit > 0 ? "#cfe0ff" : "#16161c";
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = C.ink;
  c.stroke();
  c.restore();
  if (phoneLit > 0) glow(c, 452, 780, 360, "rgba(170,195,255,0.75)", phoneLit);
  // her head coming up out of the duvet, lit by the phone
  litFigure(c, (k) => drawKid(k, 300, 860 - 110 * peek, 0.95, { who: "girl", outfit: "pajamas", body: "head", eyes: peek > 0.5 ? "wide" : "tired", look: [0.6, 0.5] }), {
    shade: 0.35,
    shadeCol: "rgb(20,14,40)",
    lights: [{ x: 452, y: 780, r: 420, rgb: "175,200,255", a: 0.55 * phoneLit }],
    rim: { ux: 1, uy: 0.3, rgb: "190,210,255", a: 0.5 * phoneLit },
  });
  // the duvet mound over her
  const mound: Pt[] = [[-80, 880], [80, 820], [260, 800], [430, 840], [600, 920], [660, 1100], [640, 1200], [-80, 1200]];
  blob(c, mound, 6710, 2.4);
  paint(c, "#c97d95", C.ink, 6);
  c.save();
  blob(c, mound, 6710, 2.4);
  c.clip();
  hearts(c, -60, 820, 720, 380, 12, 6711, 0.6);
  inkLine(c, [[120, 850], [200, 1000], [180, 1180]], 6712, 4, "rgba(120,50,80,0.45)");
  inkLine(c, [[380, 860], [430, 1020]], 6713, 4, "rgba(120,50,80,0.45)");
  glow(c, 470, 860, 300, "rgba(170,195,255,0.35)", phoneLit);
  c.fillStyle = "rgba(10,6,24,0.35)";
  c.fillRect(-80, 780, 760, 440);
  c.restore();
  // the floor and the bed's front
  poly(c, [[-60, 1190], [700, 1200], [700, 1300], [-60, 1290]], 6720, 1.2);
  paint(c, "#3d3048", C.ink, 6);
}

/** The pink duvet over her lap as she sits up in bed (the same print as duvetClose), wide enough to cover the whole
 *  mattress; `dark` 0..1 dims it with the room. */
export function lapDuvet(c: Ctx, dark: number) {
  const pts: Pt[] = [[-90, 958], [160, 940], [380, 962], [560, 948], [690, 972], [712, 1090], [690, 1170], [-90, 1172]];
  blob(c, pts, 6801, 2);
  paint(c, vgrad(c, 960, 1170, [[0, "#f6b3c6"], [1, "#d98aa3"]]), C.ink, 6);
  c.save();
  blob(c, pts, 6801, 2);
  c.clip();
  hearts(c, -60, 970, 760, 200, 11, 6802, 0.7);
  inkLine(c, [[60, 1010], [150, 1080], [130, 1170]], 6803, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[330, 1000], [420, 1060], [520, 1050]], 6804, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[600, 990], [640, 1090]], 6805, 4, "rgba(170,70,100,0.45)");
  // the thick hem catching light along the top
  inkLine(c, [[-90, 972], [160, 954], [380, 976], [560, 962], [690, 986]], 6806, 8, "rgba(255,225,235,0.45)");
  if (dark > 0) {
    c.fillStyle = `rgba(8,6,24,${(0.6 * dark).toFixed(3)})`;
    c.fillRect(-100, 900, 900, 300);
  }
  c.restore();
}
