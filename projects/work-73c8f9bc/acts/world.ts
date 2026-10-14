// 《屏蔽》她那一边的场景：雪、她的房间（雪夜的窗、串灯、台灯 → 月光）、窗外的街、手机近景后面失焦的房间、
// 她的特写（被子拉到鼻子）、枕头俯拍、被窝里探头、三年前的宿舍。爸爸在 dad.ts，岗亭在 booth.ts。
import { clamp } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, bokehDisc, blob, camera, castShadow, curve, fillBg, filtered, glow, hash, inkLine, litFigure, oval, paint, poly, rbox, rr, text, F, vgrad } from "@materials/s0rrow/code/draw";
import { snow } from "@materials/s0rrow/code/blocked/snow";
import { drawKid, type KidPose } from "@materials/s0rrow/code/kid";
import { drawPerson } from "@materials/s0rrow/code/people";
import { herBlanket, herRoom } from "@materials/s0rrow/code/places";
import { streetBelow } from "@materials/s0rrow/code/sets";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { dormRoom } from "@materials/s0rrow/code/dorm";
import { couplePhoto, gradPhoto, nightPhoto } from "./ui";

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
const ROOM_PHOTOS = [gradPhoto, nightPhoto, couplePhoto(false)];
/** The furnished snow-night room includes its own ambient shade and practical lights.
 *  Draw figures and bedding afterwards, lit by the same lamp/window; do not darken the whole room again. */
export function herRoomSnow(c: Ctx, abs: number, o: { lamp?: number } = {}) {
  herRoom(c, abs, { detailed: true, lamp: o.lamp ?? 1, lampAt: LAMP_AT, lights: 0.55, winter: true, photos: ROOM_PHOTOS });
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
  dormRoom(c, abs, { lamp: 1, lights: 1, winter: true, month: "12月", circledDay: 9 });
}

/** The roommates keep their original head positions and laughing gestures; their seated bodies now continue
 *  behind the foreground desk. The warm reading lamp and the cold window light them from opposite sides. */
export function roommates(c: Ctx, abs: number, k: number) {
  const lean = 40 * k;
  const left = (q: Ctx) => drawPerson(q, 230 - lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "long", hairColor: "#3a2414", top: "#f2c94c", face: k > 0.5 ? "laugh" : "smile", body: "full", legs: "sit", bottom: "#586e77", tilt: 0.15 * k, arms: k > 0.5 ? "laugh" : "down", seed: 961 });
  const right = (q: Ctx) => drawPerson(q, 850 + lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", face: k > 0.5 ? "laugh" : "smile", body: "full", legs: "sit", bottom: "#536a7c", tilt: -0.15 * k, seed: 962 });
  const wallOnly = (q: Ctx) => { q.beginPath(); q.rect(-60, 616, 1200, 700); q.clip(); };
  castShadow(c, [218, 610], 1.09, (q) => { left(q); right(q); }, "#203d43", 17, 0.20, wallOnly);
  litFigure(c, left, { shade: 0.16, shadeCol: "#263c45", lights: [{ x: 210, y: 635, r: 570, rgb: "252,221,160", a: 0.27 }, { x: 408, y: 756, r: 370, rgb: "153,197,221", a: 0.14 }], rim: { ux: 0.65, uy: -0.8, rgb: "169,206,209", a: 0.28, width: 4 } });
  litFigure(c, right, { shade: 0.24, shadeCol: "#203c4b", lights: [{ x: 713, y: 690, r: 445, rgb: "153,197,221", a: 0.23 }, { x: 623, y: 882, r: 440, rgb: "247,215,153", a: 0.12 }], rim: { ux: -0.75, uy: -0.8, rgb: "160,207,222", a: 0.38, width: 5 } });
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

/** the out-of-focus room behind herFace (draw it before the shot's camera push to keep it still while she moves in) */
export function herFaceBg(c: Ctx, abs: number, lamp: number) {
  filtered(c, `blur(7px) brightness(${(0.9 - 0.12 * (1 - lamp)).toFixed(2)})`, (b) => {
    camera(b, 540, 620, 1.9, 0, 0, 120);
    herRoomSnow(b, abs, { lamp });
  }, "herFaceBg");
}

/** Her face over the duvet, up close, at night: the blurred room behind (fairy lights, the snowy window), her lit from
 *  below by the phone (cold) with a cold rim from the window; `lamp` 1 = bedside lamp on (warm, lighter). */
export function herFace(c: Ctx, abs: number, o: { pose: KidPose; lamp: number; top: number; grip?: number; x?: number; y?: number; s?: number; bg?: boolean }) {
  const x = o.x ?? 540,
    y = o.y ?? 780,
    s = o.s ?? 1.58;
  const dark = 1 - o.lamp;
  if (o.bg !== false) herFaceBg(c, abs, o.lamp);
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

/** Her pink case uses the shared detailed camera module; the sunflower is this film's decal. */
export function herPhoneBack(c: Ctx, x: number, y: number, w: number, h: number, rot = 0) {
  phoneBack(c, x, y, w, h, rot, 0, { detailed: true, triple: true, caseColor: "#e9a5bd", cameraColor: "#cf859f" });
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.translate(w * 0.12, h * 0.16);
  const s = w * 0.12 / 26;
  sunflowerOn(c, 0, 0, s);
  c.scale(s, s);
  // Small seed marks and one worn petal make the sticker read as a physical decal.
  c.fillStyle = "rgba(242,192,91,0.52)";
  for (const [sx, sy] of [[-6, -5], [2, -7], [7, -1], [-4, 4], [4, 7]]) {
    c.beginPath(); c.ellipse(sx, sy, 1.4, 2, -0.3, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "rgba(255,241,184,0.65)"; c.lineWidth = 1.2; c.lineCap = "round";
  c.beginPath(); c.moveTo(-22, -24); c.lineTo(-28, -29); c.stroke();
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
  paint(c, vgrad(c, 960, 1170, [[0, "#dda2b8"], [1, "#ae6b8b"]]), C.ink, 6);
  c.save();
  blob(c, pts, 6801, 2);
  c.clip();
  hearts(c, -60, 970, 760, 200, 11, 6802, 0.7);
  inkLine(c, [[60, 1010], [150, 1080], [130, 1170]], 6803, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[330, 1000], [420, 1060], [520, 1050]], 6804, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[600, 990], [640, 1090]], 6805, 4, "rgba(170,70,100,0.45)");
  // Broad, soft folds give the fabric volume; fine stitching stays secondary to the hearts.
  inkLine(c, [[61, 1017], [151, 1087], [131, 1180]], 6810, 20, "rgba(57,32,70,0.1)");
  inkLine(c, [[330, 1008], [420, 1068], [520, 1058]], 6811, 16, "rgba(57,32,70,0.1)");
  inkLine(c, [[602, 998], [642, 1098]], 6812, 12, "rgba(57,32,70,0.1)");
  // the thick hem catching light along the top
  inkLine(c, [[-90, 972], [160, 954], [380, 976], [560, 962], [690, 986]], 6806, 8, "rgba(255,225,235,0.45)");
  for (let x = -60; x < 690; x += 17) inkLine(c, [[x, 1155], [x + 6, 1155]], 6820 + x, 1.5, "rgba(241,208,215,0.35)", 0.2);
  if (dark > 0) {
    c.fillStyle = `rgba(8,12,32,${(0.52 * dark).toFixed(3)})`;
    c.fillRect(-100, 900, 900, 300);
  }
  c.globalCompositeOperation = "lighter";
  glow(c, 650, 960, 260, "rgba(255,194,137,0.14)", 1 - dark);
  glow(c, 500, 920, 330, "rgba(140,169,236,0.11)", 0.3 + 0.7 * dark);
  c.restore();
}
