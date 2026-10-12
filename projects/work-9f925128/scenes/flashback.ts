// 三年前（2023-06-09，毕业那天傍晚 17:42）的教室：分镜 5 他的主观视角（座位上往前看：黑板「毕业快乐」、走廊那边的窗户进来的夕阳、
// 空课桌）和反打（他身后的黑板报、右边走廊窗户的夕阳）。走廊在教室左边（面朝黑板时），夕阳从走廊那边照进来。
// 设计坐标 1080×1920，按分镜 5 的最终构图画；镜头（拉开、推近）由调用方的 camera 决定。
import { C, Ctx, F, H, Pt, W, blob, filtered, glow, hash, inkLine, lightShaft, motes, oval, paint, poly, rbox, shaded, text, vgrad } from "@materials/s0rrow/code/draw";

const CHALK = "rgba(240,242,232,0.9)";
const WOOD = "#c99d68";
const WOOD_DK = "#9a7246";

/** a desk seen from his seat (top as a trapezoid, front panel), x centre, y of the near top edge, width, depth */
function deskAhead(ctx: Ctx, x: number, y: number, w: number, d: number, seed: number, books = 0) {
  const top: Pt[] = [[x - w * 0.42, y - d], [x + w * 0.42, y - d], [x + w / 2, y], [x - w / 2, y]];
  shaded(ctx, () => poly(ctx, top, seed, 0.8), WOOD, () => {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x - w, y - d, w * 2, d * 0.35);
  }, C.ink, 3);
  poly(ctx, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + d * 0.55], [x - w / 2, y + d * 0.55]], seed + 1, 0.8);
  paint(ctx, WOOD_DK, C.ink, 3);
  for (let i = 0; i < books; i++) {
    const bw = w * (0.32 - i * 0.03),
      by = y - d * 0.45 - i * d * 0.16;
    poly(ctx, [[x - bw / 2, by - d * 0.14], [x + bw / 2, by - d * 0.14], [x + bw / 2, by], [x - bw / 2, by]], seed + 2 + i, 0.6);
    paint(ctx, ["#e8e2d2", "#7fa6c9", "#e0a46a"][i % 3], C.ink, 2.5);
  }
}
/** the back of an empty chair pushed in at a desk */
function chairBack(ctx: Ctx, x: number, y: number, s: number, seed: number) {
  poly(ctx, [[x - 46 * s, y - 70 * s], [x + 46 * s, y - 70 * s], [x + 46 * s, y - 34 * s], [x - 46 * s, y - 34 * s]], seed, 0.6);
  paint(ctx, "#6f8fae", C.ink, 3);
  for (const sd of [-1, 1]) inkLine(ctx, [[x + sd * 40 * s, y - 34 * s], [x + sd * 42 * s, y + 10 * s]], seed + sd, 4 * s, "#5a5a62");
}

/** The classroom ahead of his seat, out of focus: the front wall and blackboard (毕业快乐 in chalk), the corridor
 *  windows on the left full of sunset, empty desks, light shafts with dust. Final framing: the room above y ≈ 450. */
export function classroomAhead(ctx: Ctx, abs: number) {
  filtered(ctx, "blur(3px)", (c) => {
    // ceiling, front wall, floor
    c.fillStyle = vgrad(c, -200, 460, [[0, "#efe6cf"], [1, "#e2d3b2"]]);
    c.fillRect(-300, -400, W + 600, 900);
    poly(c, [[160, 40], [930, 40], [1000, -400], [80, -400]], 6001, 1);
    paint(c, "#f4eedc", null);
    inkLine(c, [[300, -20], [520, -22]], 6002, 10, "#fffbe6");
    inkLine(c, [[620, -22], [840, -20]], 6003, 10, "#fffbe6");
    poly(c, [[160, 330], [930, 330], [1300, 520], [-220, 520]], 6004, 1);
    paint(c, "#cdbb98", null);
    // the blackboard
    rbox(c, 250, 80, 600, 220, 8, 6005, 1);
    paint(c, "#8a6844", C.ink, 5);
    rbox(c, 266, 94, 568, 192, 5, 6006, 1);
    paint(c, "#2f4a3c", C.ink, 3);
    text(c, "毕业快乐！", 560, 178, { size: 84, font: F.pen, fill: CHALK });
    text(c, "2023.6.9", 360, 260, { size: 34, font: F.en, fill: CHALK });
    text(c, "前程似锦", 740, 262, { size: 34, font: F.pen, fill: "rgba(255,214,160,0.9)" });
    // chalk doodles: a mortarboard, hearts, stars
    poly(c, [[720, 120], [770, 104], [820, 120], [770, 136]], 6007, 0.6);
    paint(c, null, CHALK, 3);
    inkLine(c, [[808, 124], [812, 150]], 6008, 2.5, CHALK);
    for (const [hx, hy] of [[300, 130], [810, 230], [460, 250]] as Pt[]) {
      c.save();
      c.translate(hx, hy);
      c.beginPath();
      c.moveTo(0, 8);
      c.bezierCurveTo(-14, -2, -10, -14, 0, -6);
      c.bezierCurveTo(10, -14, 14, -2, 0, 8);
      c.strokeStyle = "rgba(255,170,190,0.9)";
      c.lineWidth = 3;
      c.stroke();
      c.restore();
    }
    // the clock and the podium
    oval(c, 560, 20, 26, 26, 6009, 0.6);
    paint(c, "#fbf8ee", C.ink, 3);
    inkLine(c, [[560, 20], [560, 6]], 6010, 3);
    inkLine(c, [[560, 20], [572, 26]], 6011, 3);
    poly(c, [[470, 300], [650, 300], [660, 360], [460, 360]], 6012, 0.8);
    paint(c, "#b88a58", C.ink, 3);
    // the corridor side (left): a wall of windows full of the setting sun
    poly(c, [[-260, -400], [160, 40], [160, 330], [-260, 640]], 6013, 1);
    paint(c, "#e6d2ad", null);
    for (let i = 0; i < 2; i++) {
      const x0 = -150 + i * 150,
        x1 = x0 + 110;
      const t0 = -250 + i * 150,
        t1 = t0 + 70;
      poly(c, [[x0, t0], [x1, t1], [x1, 300 - i * 18], [x0, 380 - i * 30]], 6014 + i, 1);
      paint(c, "#ffc98a", C.ink, 4);
      c.save();
      c.globalCompositeOperation = "lighter";
      glow(c, (x0 + x1) / 2, 120, 260, "rgba(255,190,110,0.5)");
      c.restore();
    }
    // the other side: the outer wall, bluish in its own shade, a notice
    poly(c, [[930, 40], [1300, -400], [1300, 640], [930, 330]], 6016, 1);
    paint(c, "#cfc3a8", null);
    rbox(c, 980, 60, 80, 110, 4, 6017, 0.8);
    paint(c, "#f2eadb", C.ink, 3);
    // empty desks, far to near, chairs pushed in
    const rows: [number, number, number][] = [[350, 0.42, 6100], [395, 0.6, 6200], [452, 0.82, 6300]];
    rows.forEach(([y, s, seed], r) => {
      for (let k = -2; k <= 2; k++) {
        const x = 560 + k * 230 * s + (r === 2 ? 40 : 0);
        chairBack(c, x, y - 22 * s, s, seed + k * 7 + 3);
        deskAhead(c, x, y, 160 * s, 46 * s, seed + k * 7, hash(seed + k) > 0.55 ? 1 + Math.floor(hash(seed - k) * 2) : 0);
      }
    });
    // the sunset coming in from the corridor: warm shafts across the room, dust turning in them
    lightShaft(c, [[-120, -200], [120, -80], [900, 520], [560, 560]], 0, 0, 900, 560, "255,186,110", 0.32, 30, "shaftA");
    lightShaft(c, [[-160, 60], [60, 140], [760, 600], [420, 620]], 0, 100, 760, 600, "255,170,100", 0.26, 30, "shaftB");
    motes(c, abs, 360, 260, 300, 200, 26, 6400, "255,220,170", 0.7, 3);
  }, "classAhead");
}

/** his own desk, right in front of him (sharp): the top lit by the sun across its corner, the yearbook and a pen;
 *  under its edge the shadow where he holds the phone; his lap below */
export function povDesk(ctx: Ctx) {
  // under the desk: shadow, then his lap (uniform trousers)
  ctx.fillStyle = vgrad(ctx, 600, H, [[0, "#2a2230"], [1, "#1a1620"]]);
  ctx.fillRect(-300, 600, W + 600, H + 400);
  for (const sd of [-1, 1]) {
    blob(ctx, [[540 + sd * 40, 1080], [540 + sd * 330, 1060], [540 + sd * 470, 1500], [540 + sd * 520, 2300], [540 + sd * 60, 2300]], 6500 + sd, 1.4);
    paint(ctx, "#2b3550", C.ink, 5);
  }
  // the desk: top, lit corner, front panel
  shaded(ctx, () => poly(ctx, [[-80, 450], [1160, 450], [1240, 610], [-160, 610]], 6510, 1), WOOD, () => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,170,90,0.35)";
    ctx.beginPath();
    ctx.moveTo(-80, 450);
    ctx.lineTo(420, 450);
    ctx.lineTo(260, 610);
    ctx.lineTo(-160, 610);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 5; i++) inkLine(ctx, [[-60, 470 + i * 28], [1160, 466 + i * 30]], 6511 + i, 1.6, "rgba(120,80,40,0.35)");
  }, C.ink, 5);
  poly(ctx, [[-160, 610], [1240, 610], [1240, 660], [-160, 660]], 6520, 0.8);
  paint(ctx, WOOD_DK, C.ink, 5);
  // the yearbook (毕业纪念册) and a pen on the desk
  shaded(ctx, () => poly(ctx, [[640, 470], [900, 466], [930, 590], [620, 596]], 6530, 0.8), "#3f6fa8", () => {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(620, 466, 320, 30);
  }, C.ink, 4);
  text(ctx, "毕业纪念册", 776, 532, { size: 34, font: F.cn, fill: "#f6efe0" });
  inkLine(ctx, [[180, 520], [400, 560]], 6531, 9, "#e8504a");
  inkLine(ctx, [[180, 520], [210, 525]], 6532, 9, "#3a3a3a");
}

/** His hands round the phone, seen from his own eyes (分镜 5): sleeves of the tracksuit coming up from the bottom
 *  corners, simple round hands at the phone's lower corners, the red string — bright, new — on his left wrist. Phone
 *  screen units: call inside the phone's transform after drawing it (phone units: 600 × 1280). */
export function povHandsBehind(ctx: Ctx) {
  // sleeves first (behind the phone's edges)
  for (const sd of [-1, 1]) {
    const hx = sd < 0 ? -90 : 690;
    const pts: Pt[] = [[hx - 80 * sd, 1250], [hx + 60 * sd, 1180], [hx + 520 * sd, 2390], [hx + 120 * sd, 2590]];
    shaded(ctx, () => blob(ctx, pts, 6600 + sd, 2), "#2f63b0", () => {
      inkLine(ctx, [[hx + 20 * sd, 1250], [hx + 260 * sd, 2390]], 6602 + sd, 22, "#f3f4f1");
    }, C.ink, 9);
  }
}
export function povHandsFront(ctx: Ctx) {
  for (const sd of [-1, 1]) {
    const hx = sd < 0 ? -70 : 670;
    // ribbed cuff, then the hand holding the phone's side
    shaded(ctx, () => oval(ctx, hx + 26 * sd, 1262, 92, 56, 6610 + sd, 1, sd * 0.5), "#214a87", null, C.ink, 9);
    shaded(ctx, () => oval(ctx, hx, 1150, 92, 104, 6612 + sd, 1.2), C.skin, () => {
      oval(ctx, hx + 26 * sd, 1180, 70, 70, 6614 + sd, 1);
      paint(ctx, "rgba(196,150,96,0.38)", null);
    }, C.ink, 10);
  }
  // the red string round his left wrist, between cuff and hand
  ctx.save();
  ctx.translate(-78, 1232);
  ctx.rotate(0.45);
  const band: Pt[] = [[-80, -6], [-30, 10], [30, 10], [80, -6]];
  blob(ctx, band.concat([[80, 6], [30, 22], [-30, 22], [-80, 6]]), 6620, 0.8);
  paint(ctx, "#e0352f", C.ink, 6);
  oval(ctx, 44, 20, 14, 12, 6621, 0.6);
  paint(ctx, "#e0352f", C.ink, 5);
  inkLine(ctx, [[50, 30], [62, 58], [56, 80]], 6622, 9, "#e0352f", 0.6);
  inkLine(ctx, [[40, 32], [36, 60], [46, 80]], 6623, 9, "#e0352f", 0.6);
  ctx.restore();
}

/** The back of the classroom behind him (the reverse angle, 分镜 5b), out of focus: the back wall's chalk
 *  newspaper for graduation, chairs, and on the right the corridor windows burning with the sunset. */
export function classroomBehind(ctx: Ctx, abs: number) {
  filtered(ctx, "blur(5px)", (c) => {
    c.fillStyle = vgrad(c, 0, H, [[0, "#e8dcc0"], [1, "#cdbb98"]]);
    c.fillRect(-300, -300, W + 600, H + 600);
    // the back blackboard (黑板报): colourful chalk
    rbox(c, 60, 260, 760, 420, 8, 6700, 1);
    paint(c, "#8a6844", C.ink, 5);
    rbox(c, 76, 276, 728, 388, 5, 6701, 1);
    paint(c, "#2e4a40", C.ink, 3);
    text(c, "毕业快乐", 430, 380, { size: 96, font: F.cn, fill: "#ffd166" });
    text(c, "高三(2)班", 250, 520, { size: 44, font: F.cn, fill: "#9fd8ff" });
    text(c, "我们的夏天", 600, 540, { size: 40, font: F.pen, fill: "#ffb3c6" });
    oval(c, 160, 360, 46, 46, 6702, 1);
    paint(c, "rgba(255,200,90,0.9)", null);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      inkLine(c, [[160 + Math.cos(a) * 58, 360 + Math.sin(a) * 58], [160 + Math.cos(a) * 80, 360 + Math.sin(a) * 80]], 6703 + i, 5, "rgba(255,200,90,0.9)");
    }
    // the corridor wall on the right: tall windows, the sun pouring in
    poly(c, [[860, -300], [1400, -300], [1400, 2200], [860, 1500]], 6720, 1);
    paint(c, "#dccaa4", null);
    for (let i = 0; i < 2; i++) {
      const x0 = 900 + i * 170;
      poly(c, [[x0, 120 - i * 40], [x0 + 130, 80 - i * 50], [x0 + 130, 1100 + i * 60], [x0, 1060 + i * 40]], 6721 + i, 1);
      paint(c, "#ffc685", C.ink, 4);
    }
    c.save();
    c.globalCompositeOperation = "lighter";
    glow(c, 1080, 600, 700, "rgba(255,170,90,0.55)");
    c.restore();
    // chairs and desks around him, empty
    for (const [x, y, s] of [[140, 1120, 1.1], [860, 1160, 1.2], [480, 980, 0.8]] as [number, number, number][]) {
      chairBack(c, x, y, s * 2.4, 6730 + x);
    }
    lightShaft(c, [[1200, 0], [1300, 300], [-100, 1500], [-200, 1100]], 1200, 100, 0, 1400, "255,180,110", 0.28, 40, "shaftC");
    motes(c, abs, 700, 700, 380, 420, 30, 6740, "255,220,170", 0.8, 3.2);
  }, "classBehind");
}
