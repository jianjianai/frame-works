// 她手机里的照片（重画）：相册里头像前面的三张（草莓牛奶贴脸、和朋友的自拍、天台）和朋友圈那张自拍。向日葵头像
// 还是素材库原来那张（profileScreen 自己画）。
// 按素材库咖啡馆合照（couple-photo.ts）的标准：每张都是一个真的地方（背景略虚化），光有来源（窗、吊灯、太阳），
// 人物直接用素材库角色，桌沿 / 栏杆 / 花挡住半身像的下沿，不让上身飘着。每张按 600×860（相册的照片区）设计，
// 别的地方按 cover 方式裁进去（fitPhoto）。
import { C, Ctx, F, Pt, blob, filtered, glow, inkLine, lightShaft, litFigure, oval, paint, poly, rbox, rr, text, vgrad } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { CAST, drawPerson } from "@materials/s0rrow/code/people";
import { strawberryMilk } from "@materials/s0rrow/code/places";

export const PW = 600,
  PH = 860;
const SKIN = "#f6e1c3";

/** Draw a 600×860 photo into (x, y, w, h), covering it; (fx, fy) 0..1 is the point of the photo kept in view. */
export function fitPhoto(c: Ctx, x: number, y: number, w: number, h: number, draw: (c: Ctx) => void, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / PW, h / PH);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.translate(x + (w - PW * s) * fx, y + (h - PH * s) * fy);
  c.scale(s, s);
  draw(c);
  c.restore();
}
/** where photo point (px, py) lands when the photo is fitted into (x, y, w, h) */
export function photoPoint(x: number, y: number, w: number, h: number, px: number, py: number, fx = 0.5, fy = 0.5): Pt {
  const s = Math.max(w / PW, h / PH);
  return [x + (w - PW * s) * fx + px * s, y + (h - PH * s) * fy + py * s];
}

// ---------------------------------------------------------------- small pieces
/** a hand making a V: a round fist with two fingers up (rot: the way the fingers point, 0 = up) */
function vSign(c: Ctx, x: number, y: number, s: number, rot: number, skin = SKIN) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  for (const [dx, a] of [[-9, -0.2], [9, 0.18]] as [number, number][]) {
    c.save();
    c.translate(dx, -18);
    c.rotate(a);
    rr(c, -8, -46, 16, 50, 8);
    paint(c, skin, C.ink, 4);
    c.restore();
  }
  oval(c, 0, 0, 26, 24, 4500, 0.5);
  paint(c, skin, C.ink, 4);
  inkLine(c, [[-14, 6], [12, 4]], 4501, 2.4, "rgba(150,100,60,0.45)");
  c.restore();
}
/** fingers wrapped round a carton held up (in the carton's own units; draw after the carton) */
function cartonGrip(c: Ctx, x: number, y: number, s: number, rot: number, skin = SKIN) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  oval(c, -60, 74, 16, 22, 4510, 0.4);
  paint(c, skin, C.ink, 4 / s);
  for (let j = 0; j < 4; j++) {
    rr(c, -6 + j * 3, 32 + j * 26, 72 - j * 6, 24, 12);
    paint(c, skin, C.ink, 4 / s);
  }
  c.restore();
}
function cloud(c: Ctx, x: number, y: number, s: number, a = 0.95) {
  c.fillStyle = `rgba(255,255,255,${a})`;
  for (const [dx, dy, r] of [[-60, 10, 34], [-22, -12, 44], [26, -4, 38], [62, 12, 28], [0, 18, 40]] as [number, number, number][]) {
    c.beginPath();
    c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    c.fill();
  }
}

// ---------------------------------------------------------------- 1 · strawberry milk against her cheek, by the classroom window
/** a sunny window seat at school: the window and the tree outside behind her (soft), the curtain, the sun across
 *  her; she holds his strawberry milk against her cheek, eyes shut, smiling; her desk in front with a notebook */
export function milkPhoto(c: Ctx) {
  filtered(c, "blur(2px)", (b) => {
    b.fillStyle = vgrad(b, 0, PH, [[0, "#f3ead6"], [1, "#e6d6b6"]]);
    b.fillRect(0, 0, PW, PH);
    // the window: sky, the tree, white frames
    b.save();
    b.beginPath();
    b.rect(-10, 70, 470, 560);
    b.clip();
    b.fillStyle = vgrad(b, 70, 630, [[0, "#9fd2f2"], [0.7, "#e8f5fb"], [1, "#fff4d8"]]);
    b.fillRect(-10, 70, 470, 560);
    cloud(b, 330, 170, 0.9);
    for (let k = 0; k < 9; k++) {
      oval(b, 40 + (k % 5) * 90, 330 + Math.floor(k / 5) * 110 + (k % 2) * 30, 90, 70, 4520 + k, 1.4);
      paint(b, k % 2 ? "#86bf6e" : "#a2d184", null);
    }
    b.restore();
    for (const x of [-10, 225, 460]) inkLine(b, [[x, 66], [x, 634]], 4530 + x, 14, "#f8f5ec", 0.4);
    inkLine(b, [[-10, 330], [460, 330]], 4535, 12, "#f8f5ec", 0.4);
    inkLine(b, [[-10, 636], [470, 636]], 4536, 22, "#d8ccb2", 0.4);
    // the curtain gathered on the right
    blob(b, [[460, 40], [560, 40], [540, 330], [590, 700], [470, 710], [490, 330]], 4537, 1);
    paint(b, "#cfe2c3", "rgba(60,80,60,0.5)", 3);
    for (let k = 0; k < 3; k++) inkLine(b, [[480 + k * 25, 60], [500 + k * 20, 350], [490 + k * 30, 690]], 4538 + k, 3, "rgba(80,110,80,0.25)");
  }, "photoMilkBack");
  // the sun through the window
  lightShaft(c, [[0, 80], [300, 80], [520, 860], [120, 860]], 120, 120, 330, 860, "255,236,190", 0.22, 20, "photoMilkSun");
  glow(c, 140, 260, 420, "rgba(255,240,200,0.35)");
  const gx = 270,
    gy = 420,
    gs = 1.2;
  const milk: Pt = [gx + 150 * gs, gy + 112 * gs];
  litFigure(c, (k) =>
    drawKid(k, gx, gy, gs, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: "happy",
      mouth: "smile",
      blush: 0.75,
      tilt: 0.14,
      arms: "custom",
      handR: [(milk[0] + 30 - gx) / gs, (milk[1] + 95 - gy) / gs],
      bendR: -1,
      shapeR: "hidden",
      handL: [-104, 430],
      shapeL: "hidden",
    }), {
    shade: 0.08,
    shadeCol: "rgb(90,60,40)",
    lights: [{ x: 120, y: 260, r: 520, rgb: "255,232,190", a: 0.22 }],
    rim: { ux: -1, uy: -0.4, rgb: "255,240,205", a: 0.55, width: 5 },
  });
  strawberryMilk(c, milk[0], milk[1], 0.95, 0.16, 4540);
  cartonGrip(c, milk[0], milk[1], 0.95, 0.16);
  // her desk in front: a notebook, a pencil
  poly(c, [[-20, 740], [620, 730], [640, 880], [-40, 880]], 4541, 0.8);
  paint(c, vgrad(c, 730, 880, [[0, "#ddb074"], [1, "#b98a52"]]), C.ink, 5);
  inkLine(c, [[-20, 744], [620, 734]], 4542, 4, "rgba(255,240,205,0.6)");
  poly(c, [[60, 770], [270, 760], [282, 880], [50, 880]], 4543, 0.6);
  paint(c, "#fbfaf2", C.ink, 4);
  for (let k = 0; k < 3; k++) inkLine(c, [[70, 800 + k * 26], [264, 792 + k * 26]], 4544 + k, 1.6, "rgba(90,120,170,0.35)");
  inkLine(c, [[330, 800], [470, 770]], 4548, 8, "#e8524a");
  // a soft edge to the frame
  const v = c.createRadialGradient(300, 430, 260, 300, 430, 620);
  v.addColorStop(0, "rgba(80,50,30,0)");
  v.addColorStop(1, "rgba(80,50,30,0.22)");
  c.fillStyle = v;
  c.fillRect(0, 0, PW, PH);
}

// ---------------------------------------------------------------- 2 · the selfie with her friends (posted tonight)
/** where her face is in the selfie (600×860 photo units) */
export const SELFIE_FACE: Pt = [300, 420];
/** tonight at the milk-tea shop: warm pendant lights, a pink neon sign and shelves behind (soft); 小美 holds the phone
 *  out (her arm runs out of the bottom-left corner), the three heads together, V signs; the counter in front with
 *  three cups — hers is strawberry */
export function selfiePhoto(c: Ctx) {
  filtered(c, "blur(2.2px)", (b) => {
    b.fillStyle = vgrad(b, 0, PH, [[0, "#5a3b3c"], [0.5, "#7b4f45"], [1, "#4a3236"]]);
    b.fillRect(0, 0, PW, PH);
    // shelves with cups and jars on the right, a menu board on the left
    for (const y of [210, 330]) {
      inkLine(b, [[380, y], [620, y]], 4550 + y, 10, "#3a2622", 0.3);
      for (let k = 0; k < 4; k++) {
        rbox(b, 396 + k * 52, y - 54, 36, 50, 8, 4555 + y + k, 0.3);
        paint(b, ["#f2b8c6", "#f7e1b5", "#bfe0d4", "#f2b8c6"][k], "#3a2622", 2);
      }
    }
    rbox(b, 30, 120, 210, 250, 12, 4570, 0.5);
    paint(b, "#2e2a2c", "#1e1a1c", 6);
    for (let k = 0; k < 5; k++) inkLine(b, [[56, 170 + k * 40], [150 + (k % 3) * 20, 168 + k * 40]], 4571 + k, 4, "rgba(255,240,220,0.6)");
    // the neon sign
    b.save();
    b.shadowColor = "rgba(255,110,160,0.9)";
    b.shadowBlur = 24;
    text(b, "Boba Bar", 300, 90, { size: 60, font: F.pen, fill: "#ffd0e0" });
    b.restore();
    // string lights
    for (let k = 0; k < 9; k++) {
      const x = 20 + k * 72,
        y = 34 + Math.sin(k * 0.8) * 10;
      glow(b, x, y, 40, "rgba(255,214,150,0.55)");
      oval(b, x, y, 5, 7, 4580 + k, 0.2);
      paint(b, "#ffe7bd", null);
    }
  }, "photoSelfieBack");
  glow(c, 300, 140, 520, "rgba(255,200,140,0.3)");
  glow(c, 300, 60, 260, "rgba(255,120,170,0.18)");
  // 小美 (left, holding the phone — her arm out of the bottom-left corner), 琪 (right), her in the middle
  const warm = { shade: 0.06, shadeCol: "rgb(70,40,40)", lights: [{ x: 300, y: 120, r: 560, rgb: "255,210,160", a: 0.2 }], rim: { ux: 0.2, uy: -1, rgb: "255,190,210", a: 0.45, width: 5 } };
  litFigure(c, (k) => {
    drawPerson(k, 96, 400, 0.9, { ...CAST.mei, x: 0, face: "laugh", body: "bust", arms: "down", tilt: 0.18 });
    drawPerson(k, 506, 410, 0.88, { ...CAST.qi, x: 0, face: "smile", body: "bust", arms: "down", tilt: -0.16 });
    drawKid(k, SELFIE_FACE[0], SELFIE_FACE[1], 0.98, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: "happy",
      mouth: "grin",
      blush: 0.6,
      arms: "custom",
      handL: [-150, 190],
      bendL: 1,
      shapeL: "hidden",
      handR: [100, 430],
      shapeR: "hidden",
    });
  }, warm);
  // 小美's arm holding the phone out, from the bottom-left corner
  blob(c, [[-60, 900], [40, 610], [110, 600], [60, 900]], 4590, 1);
  paint(c, CAST.mei.top ?? "#9cc7e8", C.ink, 5);
  // V signs: hers by her cheek, 琪's by her face
  vSign(c, SELFIE_FACE[0] - 150 * 0.98, SELFIE_FACE[1] + 170 * 0.98, 1.05, -0.2);
  vSign(c, 588, 500, 1.0, 0.3, CAST.qi.skin);
  // the counter in front, three cups (hers is strawberry)
  poly(c, [[-20, 730], [620, 722], [640, 880], [-40, 880]], 4591, 0.8);
  paint(c, vgrad(c, 722, 880, [[0, "#c9946a"], [1, "#8c6148"]]), C.ink, 5);
  inkLine(c, [[-20, 734], [620, 726]], 4592, 4, "rgba(255,220,180,0.55)");
  for (const [x, col] of [[150, "#e8c99a"], [300, "#f7b6c8"], [450, "#d8b48a"]] as [number, string][]) {
    rbox(c, x - 34, 650, 68, 100, 10, 4593 + x, 0.4);
    paint(c, "rgba(255,255,255,0.35)", C.ink, 4);
    rbox(c, x - 30, 676, 60, 70, 8, 4594 + x, 0.3);
    paint(c, col, null);
    inkLine(c, [[x + 8, 652], [x + 16, 600]], 4595 + x, 6, C.ink);
    inkLine(c, [[x + 8, 652], [x + 16, 600]], 4596 + x, 3, col === "#f7b6c8" ? "#ff6f8f" : "#5d8fc9");
  }
  const v = c.createRadialGradient(300, 420, 260, 300, 420, 640);
  v.addColorStop(0, "rgba(40,20,20,0)");
  v.addColorStop(1, "rgba(40,20,20,0.3)");
  c.fillStyle = v;
  c.fillRect(0, 0, PW, PH);
}

// ---------------------------------------------------------------- 3 · on the school roof, looking out
/** a blue-sky day on the school roof: big clouds, the playground and trees below far off; she leans on the railing,
 *  turned away a little, looking out over it, smiling; the sun from the upper right */
export function roofPhoto(c: Ctx) {
  filtered(c, "blur(1.6px)", (b) => {
    b.fillStyle = vgrad(b, 0, PH, [[0, "#5fb0ea"], [0.6, "#a9dcf7"], [1, "#e7f6fb"]]);
    b.fillRect(0, 0, PW, PH);
    cloud(b, 150, 170, 1.6);
    cloud(b, 470, 120, 1.1, 0.9);
    cloud(b, 520, 330, 0.8, 0.85);
    // far below: the track, trees, the other school building
    poly(b, [[-20, 560], [620, 540], [620, 880], [-20, 880]], 4600, 0.6);
    paint(b, "#8fc27a", null);
    blob(b, [[-20, 640], [260, 600], [620, 630], [620, 700], [-20, 720]], 4601, 1);
    paint(b, "#d1745a", null);
    for (let k = 0; k < 8; k++) {
      oval(b, 20 + k * 80, 560 + (k % 2) * 14, 48, 34, 4602 + k, 1.2);
      paint(b, k % 2 ? "#5f9c58" : "#73b066", null);
    }
    rbox(b, 380, 470, 230, 110, 4, 4610, 0.5);
    paint(b, "#efe7d6", "rgba(80,80,90,0.5)", 3);
    for (let k = 0; k < 6; k++) rbox(b, 394 + k * 36, 492, 24, 20, 2, 4611 + k, 0.2), paint(b, "#9cc6e6", null);
  }, "photoRoofBack");
  glow(c, 560, 60, 380, "rgba(255,250,220,0.6)");
  const gx = 300,
    gy = 420,
    gs = 1.18;
  litFigure(c, (k) =>
    drawKid(k, gx, gy, gs, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: "open",
      look: [-0.75, -0.1],
      mouth: "smile",
      blush: 0.4,
      turn: -0.45,
      tilt: 0.05,
      arms: "down",
    }), {
    shade: 0.05,
    shadeCol: "rgb(40,60,90)",
    lights: [{ x: 560, y: 60, r: 600, rgb: "255,248,225", a: 0.18 }],
    rim: { ux: 0.8, uy: -0.6, rgb: "255,250,230", a: 0.6, width: 5 },
  });
  // the roof's parapet in front of her (below the chest), a green rail along its top
  const ry = gy + 270 * gs;
  poly(c, [[-20, ry + 12], [620, ry], [620, 880], [-20, 880]], 4620, 0.6);
  paint(c, vgrad(c, ry, 880, [[0, "#e6e0d2"], [1, "#bdb5a4"]]), C.ink, 5);
  for (let k = 0; k < 4; k++) inkLine(c, [[-20, ry + 60 + k * 40], [620, ry + 50 + k * 40]], 4621 + k, 1.6, "rgba(120,110,95,0.25)");
  inkLine(c, [[-20, ry + 6], [620, ry - 6]], 4626, 20, C.ink, 0.3);
  inkLine(c, [[-20, ry + 6], [620, ry - 6]], 4627, 14, "#5aa07c", 0.3);
  inkLine(c, [[-20, ry + 2], [620, ry - 10]], 4628, 3, "rgba(255,255,255,0.55)", 0.3);
}

// ---------------------------------------------------------------- her album
/** the photos before her profile photo (the sunflower portrait stays the library's own — user: 「这个还用之前那张」);
 *  pass them to profileScreen({ photos }) */
export const HER_ALBUM = [milkPhoto, selfiePhoto, roofPhoto];
