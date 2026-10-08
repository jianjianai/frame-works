import { C, Ctx, Pt, W, blob, glow, inkLine, oval, paint, poly, rbox, shaded, vgrad } from "./draw";
import { whiteCatFace } from "./phoneui";

/** 《瑕疵：0》 the school roof after class (act 3–4), golden hour. Drawn once at its wide framing in design units,
 *  looking from the stair door toward the railing: the town and a low sun beyond the fence (everyone is backlit),
 *  the stair housing near the camera on the left. */
export const ROOF = {
  vp: [540, 980] as Pt,
  fenceTop: 880,
  parapet: 1092,
  floorY: 1150,
  sun: [840, 900] as Pt,
  /** her backpack against the parapet, and the white-cat keychain hanging off its zip */
  bag: [814, 1150] as Pt,
  charm: [768, 1100] as Pt,
};

function buildings(ctx: Ctx, base: number, color: string, seed: number, hMin: number, hMax: number, lit: number) {
  let x = -420;
  let i = 0;
  while (x < W + 420) {
    const r = (k: number) => {
      const s = Math.sin((seed + i * 13.1 + k * 7.7) * 12.9898) * 43758.5453;
      return s - Math.floor(s);
    };
    const w = 50 + r(1) * 70,
      h = hMin + r(2) * (hMax - hMin);
    ctx.fillStyle = color;
    ctx.fillRect(x, base - h, w, h + 4);
    if (lit > 0) {
      ctx.fillStyle = `rgba(255,220,150,${lit.toFixed(3)})`;
      for (let wy = base - h + 12; wy < base - 8; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (r(wx * 0.37 + wy * 0.11) > 0.78) ctx.fillRect(wx, wy, 5, 7);
    }
    x += w + 4;
    i++;
  }
}

/** the backpack leaning on the parapet with her white-cat keychain (`swing` = the charm's angle) */
export function backpack(ctx: Ctx, swing: number) {
  const [bx, by] = ROOF.bag;
  shaded(ctx, () => blob(ctx, [[bx - 50, by], [bx - 56, by - 70], [bx - 40, by - 112], [bx, by - 122], [bx + 40, by - 112], [bx + 56, by - 70], [bx + 50, by]], 9101, 1.2), "#34466e", () => {
    ctx.fillStyle = "rgba(10,14,30,0.35)";
    ctx.fillRect(bx + 10, by - 130, 60, 140);
    inkLine(ctx, [[bx - 30, by - 104], [bx, by - 112], [bx + 30, by - 104]], 9102, 2.4, "rgba(255,255,255,0.25)");
  }, C.ink, 4.5);
  shaded(ctx, () => rbox(ctx, bx - 34, by - 62, 68, 50, 12, 9103, 0.8), "#2b3a5e", null, C.ink, 3.5);
  inkLine(ctx, [[bx - 30, by - 66], [bx + 30, by - 66]], 9104, 2.6, "#c9ced8");
  // the keychain: a ring on the zip pull at the bag's shoulder, a little chain, the plush white cat dangling free
  const top: Pt = [bx - 46, by - 98];
  ctx.save();
  ctx.translate(top[0], top[1]);
  ctx.rotate(swing);
  inkLine(ctx, [[0, 0], [0, 26]], 9105, 2.4, "#d6dae2", 0.2);
  oval(ctx, 0, 0, 5, 5, 9106, 0.2);
  paint(ctx, null, "#d6dae2", 2.2);
  whiteCatFace(ctx, 0, 44, 0.6, 9110);
  ctx.restore();
}

/** the roof, wide: sky, sun, town, fence, floor with the fence's long shadows, the stair housing and its door */
export function rooftop(ctx: Ctx, abs: number, o: { door?: number } = {}) {
  const [sx, sy] = ROOF.sun;
  const fy = ROOF.floorY;
  ctx.fillStyle = vgrad(ctx, -400, fy, [[0, "#7c9bd0"], [0.45, "#e5b6a8"], [0.8, "#ffcf9c"], [1, "#ffdfab"]]);
  ctx.fillRect(-400, -400, W + 800, fy + 400);
  // long thin clouds lit from below
  ctx.save();
  for (const [x, y, w, seed] of [[150, 360, 340, 9001], [640, 260, 420, 9002], [930, 600, 280, 9003], [300, 680, 240, 9004], [560, 520, 200, 9005]] as [number, number, number, number][]) {
    ctx.globalAlpha = 0.6;
    blob(ctx, [[x - w / 2, y + 12], [x - w / 3, y - 8], [x, y - 20], [x + w / 3, y - 6], [x + w / 2, y + 12]], seed, 3);
    ctx.fillStyle = "#ffe5cc";
    ctx.fill();
    ctx.globalAlpha = 0.35;
    blob(ctx, [[x - w / 2.4, y + 14], [x, y + 4], [x + w / 2.4, y + 14], [x, y + 22]], seed + 9, 2);
    ctx.fillStyle = "#f0a98c";
    ctx.fill();
  }
  ctx.restore();
  // the low sun
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, sx, sy, 760, "rgba(255,196,120,0.45)");
  glow(ctx, sx, sy, 230, "rgba(255,236,190,0.75)");
  ctx.restore();
  oval(ctx, sx, sy, 56, 56, 9006, 0.5);
  paint(ctx, "#fff4d2", null);
  // the town in the haze, two rows
  buildings(ctx, 1012, "#b9a2b6", 3, 70, 170, 0);
  buildings(ctx, 1046, "#8e7d9e", 11, 40, 120, 0.5);
  // the parapet and the fence on it (dark against the sky)
  ctx.fillStyle = "#cdbfa8";
  ctx.fillRect(-400, ROOF.parapet, W + 800, fy - ROOF.parapet);
  ctx.fillStyle = "rgba(255,226,180,0.55)";
  ctx.fillRect(-400, ROOF.parapet, W + 800, 6);
  inkLine(ctx, [[-400, ROOF.parapet], [W + 400, ROOF.parapet]], 9007, 4, C.ink, 0.6);
  inkLine(ctx, [[-400, fy], [W + 400, fy]], 9008, 4, C.ink, 0.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-400, ROOF.fenceTop, W + 800, ROOF.parapet - ROOF.fenceTop);
  ctx.clip();
  ctx.strokeStyle = "rgba(50,78,70,0.35)";
  ctx.lineWidth = 1.6;
  for (let x = -600; x < W + 600; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, ROOF.fenceTop);
    ctx.lineTo(x + 212, ROOF.parapet);
    ctx.moveTo(x, ROOF.fenceTop);
    ctx.lineTo(x - 212, ROOF.parapet);
    ctx.stroke();
  }
  ctx.restore();
  for (let x = -380; x < W + 400; x += 96) inkLine(ctx, [[x, ROOF.fenceTop - 6], [x, ROOF.parapet]], 9010 + x, 8, "#3c6457", 0.5);
  inkLine(ctx, [[-400, ROOF.fenceTop], [W + 400, ROOF.fenceTop]], 9011, 10, "#3c6457", 0.5);
  inkLine(ctx, [[-400, 990], [W + 400, 990]], 9012, 5, "#3c6457", 0.5);
  // the floor: concrete slabs running toward the vanishing point, warm in the low sun
  ctx.fillStyle = vgrad(ctx, fy, 2100, [[0, "#d8c4a6"], [1, "#b7a58e"]]);
  ctx.fillRect(-400, fy, W + 800, 1000);
  const [vx, vy] = ROOF.vp;
  ctx.strokeStyle = "rgba(90,74,60,0.3)";
  ctx.lineWidth = 2.5;
  for (let i = -10; i <= 10; i++) {
    const x = vx + i * 140;
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(vx + (x - vx) * ((2100 - vy) / (fy - vy)), 2100);
    ctx.stroke();
  }
  for (let k = 1; k < 9; k++) {
    const y = fy + 12 * k * k + 18 * k;
    ctx.beginPath();
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
    ctx.stroke();
  }
  // the fence posts' long shadows, fanning out from under the sun toward us
  ctx.strokeStyle = "rgba(96,66,52,0.16)";
  ctx.lineWidth = 12;
  for (let x = -380; x < W + 400; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x + (x - sx) * 3.1, 1920 + 400);
    ctx.stroke();
  }
  // the stair housing, nearer, on the left: its front in the shade, the sun along its top edge
  shaded(ctx, () => rbox(ctx, -140, 480, 440, 820, 6, 9020, 1), "#a9998a", () => {
    const g = ctx.createLinearGradient(-140, 0, 300, 0);
    g.addColorStop(0, "rgba(40,30,40,0.35)");
    g.addColorStop(1, "rgba(40,30,40,0.05)");
    ctx.fillStyle = g;
    ctx.fillRect(-150, 470, 460, 840);
    ctx.fillStyle = "rgba(255,214,160,0.5)";
    ctx.fillRect(-150, 480, 460, 10);
  }, C.ink, 5);
  // the door: dark doorway, the metal door swung open toward us
  shaded(ctx, () => rbox(ctx, 74, 770, 180, 520, 4, 9021, 0.8), "#2a2228", () => {
    glow(ctx, 160, 1200, 220, "rgba(255,190,120,0.16)");
  }, C.ink, 5);
  const open = o.door ?? 1;
  const leaf = 74 - 120 * open;
  shaded(ctx, () => poly(ctx, [[74, 770], [leaf, 744], [leaf, 1316], [74, 1290]], 9022, 0.8), "#4b6a60", () => {
    inkLine(ctx, [[leaf + 18, 1040], [leaf + 30, 1040]], 9023, 6, "#c9ced8");
  }, C.ink, 5);
  void abs;
}

/** golden hour on the roof: warm haze rising from the sun, the near corners dimmer */
export function roofLight(ctx: Ctx) {
  const [sx, sy] = ROOF.sun;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, sx, sy + 40, 1100, "rgba(255,170,100,0.16)");
  ctx.restore();
  const g = ctx.createRadialGradient(sx, sy, 300, sx, sy, 1700);
  g.addColorStop(0, "rgba(60,30,40,0)");
  g.addColorStop(1, "rgba(60,30,40,0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(-400, -400, W + 800, 2800);
}

/** behind him, seen from her side (the reverse angle): the stair housing's wall in the low sun, the door, a strip of
 *  blue evening sky. For close-ups, blurred. */
export function roofReverse(ctx: Ctx) {
  ctx.fillStyle = vgrad(ctx, -200, 700, [[0, "#6f8fcf"], [1, "#b8b9d8"]]);
  ctx.fillRect(-400, -400, W + 800, 1300);
  shaded(ctx, () => rbox(ctx, -300, 420, 1700, 1700, 6, 9030, 1), "#e2c7a2", () => {
    ctx.fillStyle = "rgba(255,190,120,0.25)";
    ctx.fillRect(-300, 420, 1700, 1700);
  }, C.ink, 5);
  shaded(ctx, () => rbox(ctx, 330, 760, 420, 1200, 4, 9031, 0.8), "#3d3238", null, C.ink, 6);
  rbox(ctx, 312, 740, 456, 1240, 4, 9032, 0.8);
  paint(ctx, null, "#7a6a5c", 10);
}
