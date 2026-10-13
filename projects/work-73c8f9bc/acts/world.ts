// 《屏蔽》的场景和人物（草稿）：雪、她的房间（雪夜的窗、串灯、台灯）、窗外的街、手机近景后面失焦的房间、
// 爸爸值夜班的岗亭（背面、正面、桌面俯拍、雪夜里的外景）、三年前的宿舍；爸爸（花白头发、老花镜、保安帽、深蓝制服）。
import { clamp } from "@frame/engine/math";
import { C, Ctx, H, W, bokehDisc, blob, fillBg, filtered, glow, hash, inkLine, oval, paint, poly, rbox, rr, text, F, vgrad } from "@materials/s0rrow/code/draw";
import { drawKid, type KidPose } from "@materials/s0rrow/code/kid";
import { drawPerson, type Person } from "@materials/s0rrow/code/people";
import { herBlanket, herRoom } from "@materials/s0rrow/code/places";
import { streetBelow } from "@materials/s0rrow/code/sets";

// ---------------------------------------------------------------- snow
/** Falling snow in the rect (x, y, w, h): `n` flakes drifting down, deterministic in `abs`. */
export function snow(c: Ctx, abs: number, o: { x?: number; y?: number; w?: number; h?: number; n: number; seed: number; speed?: number; size?: number; alpha?: number; drift?: number; color?: string }) {
  const x0 = o.x ?? -40,
    y0 = o.y ?? -40,
    w = o.w ?? W + 80,
    h = o.h ?? H + 80;
  const sp = o.speed ?? 90,
    sz = o.size ?? 4,
    dr = o.drift ?? 24;
  c.save();
  c.fillStyle = o.color ?? "#ffffff";
  for (let i = 0; i < o.n; i++) {
    const r1 = hash(o.seed + i * 1.37),
      r2 = hash(o.seed + i * 2.91),
      r3 = hash(o.seed + i * 4.13);
    const v = sp * (0.55 + 0.9 * r3);
    const y = y0 + ((r2 * h + abs * v) % h);
    const x = x0 + r1 * w + Math.sin(abs * (0.6 + r3) + i) * dr;
    const r = sz * (0.45 + r3);
    c.globalAlpha = (o.alpha ?? 0.85) * (0.5 + 0.5 * r1);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

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
  // bedside lamp on the shelf
  const lamp = o.lamp ?? 1;
  poly(c, [[860, 700], [940, 700], [920, 640], [880, 640]], 5101, 1);
  paint(c, "#f5d9a8", C.ink, 4);
  inkLine(c, [[900, 700], [900, 790]], 5102, 5, "#5b4a3a");
  if (lamp > 0) glow(c, 900, 690, 420, "rgba(255,196,120,0.55)", lamp);
}
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

// ---------------------------------------------------------------- dad
export const DAD: Person = { x: 0, hair: "short", hairColor: "#8e8e8e", glasses: true, top: "#2a3a58", bottom: "#1d2536", face: "neutral", body: "bust", seed: 901 };

/** Dad (head centre at (x, y)): grey hair, reading glasses, the night guard's cap, the navy uniform. `face` from
 *  drawPerson; `tears` 0..1; `young` drops the cap, glasses and grey. */
export function drawDad(c: Ctx, x: number, y: number, s: number, o: { face?: Person["face"]; tilt?: number; turn?: number; cap?: boolean; tears?: number; arms?: Person["arms"]; handL?: [number, number]; handR?: [number, number]; shapeL?: Person["shapeL"]; shapeR?: Person["shapeR"] } = {}) {
  drawPerson(c, x, y, s, { ...DAD, face: o.face ?? "neutral", tilt: o.tilt ?? 0, turn: o.turn ?? 0, arms: o.arms ?? "down", handL: o.handL, handR: o.handR, shapeL: o.shapeL, shapeR: o.shapeR });
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(o.tilt ?? 0);
  // wrinkles: crow's feet and the lines beside the mouth, some stubble
  for (const side of [-1, 1]) {
    inkLine(c, [[side * 66, 4], [side * 80, 0]], 911 + side, 2, "rgba(120,80,50,0.55)");
    inkLine(c, [[side * 66, 12], [side * 80, 14]], 913 + side, 2, "rgba(120,80,50,0.55)");
    inkLine(c, [[side * 34, 46], [side * 44, 66], [side * 40, 82]], 915 + side, 2.2, "rgba(120,80,50,0.5)");
  }
  c.fillStyle = "rgba(90,90,90,0.35)";
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.15 + 0.7 * hash(i * 3.3));
    const r = 70 + hash(i * 1.7) * 24;
    c.beginPath();
    c.arc(Math.cos(a) * r * 0.8, 20 + Math.sin(a) * r * 0.85, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  if ((o.tears ?? 0) > 0) {
    const t = clamp(o.tears ?? 0);
    for (const side of [-1, 1]) {
      inkLine(c, [[side * 40, 30], [side * 42, 30 + 70 * t]], 917 + side, 6, "rgba(160,210,255,0.9)");
    }
  }
  if (o.cap !== false) {
    // the guard's cap
    blob(c, [[-104, -40], [-100, -104], [-50, -146], [50, -146], [100, -104], [104, -40]], 920, 1.2);
    paint(c, "#1f2c48", C.ink, 5);
    poly(c, [[-106, -56], [106, -56], [104, -32], [-104, -32]], 921, 0.8);
    paint(c, "#141d33", C.ink, 4);
    blob(c, [[-100, -34], [0, -22], [100, -34], [84, -6], [0, 4], [-84, -6]], 922, 0.9);
    paint(c, "#0c1120", C.ink, 4);
    poly(c, [[-16, -112], [16, -112], [14, -84], [0, -74], [-14, -84]], 923, 0.6);
    paint(c, "#e2b64a", C.ink, 3);
  }
  c.restore();
}

/** Dad from behind, backlit: a dark silhouette with a cap (the booth, before we know who he is). */
export function dadBack(c: Ctx, x: number, y: number, s: number, rim = 0.6) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  blob(c, [[-240, 520], [-230, 330], [-170, 230], [-70, 190], [70, 190], [170, 230], [230, 330], [240, 520]], 930, 1.4);
  paint(c, "#121827", C.ink, 6);
  oval(c, 0, 60, 108, 124, 931, 1.2);
  paint(c, "#141a28", C.ink, 6);
  blob(c, [[-112, 20], [-104, -48], [-50, -92], [50, -92], [104, -48], [112, 20]], 932, 1);
  paint(c, "#1a2338", C.ink, 5);
  // rim light from the window ahead
  c.strokeStyle = `rgba(255,190,120,${(0.55 * rim).toFixed(3)})`;
  c.lineWidth = 6;
  c.beginPath();
  c.ellipse(0, 60, 100, 116, 0, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the guard booth
const LAMP_RGB = "255,170,90";
/** Outside the booth window: the factory gate in the snow under a sodium lamp (`ox` shifts it for parallax). */
export function gateNight(c: Ctx, abs: number, ox = 0) {
  fillBg(c, vgrad(c, 0, H, [[0, "#0b1022"], [0.6, "#1a1a2e"], [1, "#2a2433"]]));
  c.save();
  c.translate(ox, 0);
  // factory blocks
  c.fillStyle = "#121628";
  c.fillRect(-200, 560, 700, 700);
  c.fillRect(560, 640, 800, 640);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = hash(i * 2.2) > 0.6 ? "rgba(255,200,120,0.6)" : "rgba(60,70,100,0.6)";
    c.fillRect(-120 + i * 110, 640, 60, 40);
  }
  // the gate and the barrier arm
  c.fillStyle = "#2a2f45";
  c.fillRect(300, 980, 40, 300);
  c.save();
  c.translate(320, 1000);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = i % 2 ? "#e8343c" : "#f2f2f2";
    c.fillRect(i * 80, -14, 80, 28);
  }
  c.restore();
  // lamp post
  c.fillStyle = "#22273b";
  c.fillRect(780, 520, 18, 800);
  glow(c, 760, 540, 520, `rgba(${LAMP_RGB},0.55)`, 1);
  oval(c, 760, 540, 30, 14, 5301, 0.6);
  paint(c, "#ffd59a", null);
  // snowy ground
  c.fillStyle = "#d9dbe6";
  c.fillRect(-200, 1250, 1600, 900);
  glow(c, 760, 1300, 600, `rgba(${LAMP_RGB},0.35)`, 1);
  c.restore();
  snow(c, abs, { n: 120, seed: 41, speed: 100, size: 4, alpha: 0.85, drift: 30 });
}

/** Inside the booth, looking out of its window over his shoulder (he sits at the desk under the window). */
export function boothBack(c: Ctx, abs: number) {
  // the window (outside)
  c.save();
  c.beginPath();
  c.rect(90, 260, 900, 760);
  c.clip();
  gateNight(c, abs, 0);
  c.restore();
  // frost on the glass corners
  for (const [fx, fy] of [[100, 270], [980, 270], [100, 1010], [980, 1010]]) glow(c, fx, fy, 160, "rgba(220,235,255,0.35)", 1);
  // walls and frame
  c.fillStyle = "#24283a";
  c.fillRect(-60, -60, W + 120, 320);
  c.fillRect(-60, 1020, W + 120, 1000);
  c.fillRect(-60, -60, 150, H);
  c.fillRect(990, -60, 150, H);
  rbox(c, 90, 260, 900, 760, 6, 5401, 1.2);
  paint(c, null, C.ink, 9);
  inkLine(c, [[540, 260], [540, 1020]], 5402, 8, "#1a1d2b");
  // the desk under the window
  poly(c, [[-60, 1040], [1140, 1040], [1140, 1260], [-60, 1260]], 5403, 1);
  paint(c, "#5a4634", C.ink, 6);
  // monitor (CCTV), thermos, radio
  rbox(c, 120, 820, 250, 200, 10, 5404, 1);
  paint(c, "#1a1c24", C.ink, 6);
  c.fillStyle = "#3b5a6a";
  c.fillRect(140, 840, 210, 150);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = "rgba(200,230,255,0.25)";
    c.fillRect(140 + (i % 2) * 105, 840 + Math.floor(i / 2) * 75, 103, 73);
  }
  glow(c, 245, 915, 260, "rgba(140,190,230,0.35)", 1);
  rbox(c, 830, 880, 80, 160, 30, 5405, 1);
  paint(c, "#c0392b", C.ink, 5);
  rbox(c, 640, 950, 160, 90, 10, 5406, 1);
  paint(c, "#6b6b6b", C.ink, 5);
  // lamp light from outside on the desk
  glow(c, 540, 1060, 600, `rgba(${LAMP_RGB},0.22)`, 1);
}

/** Inside the booth facing him: the back wall (calendar, a child's crayon drawing, his coat, a little heater). */
export function boothFront(c: Ctx, abs: number, o: { blur?: number } = {}) {
  const draw = (k: Ctx) => {
    fillBg(k, vgrad(k, 0, H, [[0, "#2d3046"], [1, "#1a1b28"]]));
    // calendar
    rbox(k, 120, 360, 200, 250, 6, 5501, 1);
    paint(k, "#efe6d2", C.ink, 5);
    k.fillStyle = "#c0392b";
    k.fillRect(122, 362, 196, 50);
    text(k, "1", 220, 520, { size: 110, font: F.ui, weight: 700, fill: "#333" });
    // the crayon drawing: a big man and a little girl holding hands
    k.save();
    k.translate(760, 470);
    k.rotate(0.05);
    poly(k, [[-120, -100], [120, -100], [120, 100], [-120, 100]], 5502, 1);
    paint(k, "#fbf6ea", C.ink, 4);
    inkLine(k, [[-40, -40], [-40, 40]], 5503, 5, "#3a6ad8");
    oval(k, -40, -56, 18, 18, 5504, 0.8);
    paint(k, null, "#3a6ad8", 4);
    inkLine(k, [[40, 0], [40, 46]], 5505, 5, "#e8508a");
    oval(k, 40, -10, 13, 13, 5506, 0.8);
    paint(k, null, "#e8508a", 4);
    inkLine(k, [[-40, 10], [40, 20]], 5507, 4, "#f2a33a");
    text(k, "爸爸", -10, 80, { size: 30, font: F.pen, fill: "#e8508a" });
    k.restore();
    // coat on a hook
    blob(k, [[880, 700], [980, 690], [1020, 1100], [860, 1110]], 5508, 1.6);
    paint(k, "#1f2c48", C.ink, 5);
    // heater glow at the bottom left
    glow(k, 160, 1500, 420, "rgba(255,140,60,0.45)", 1);
  };
  const b = o.blur ?? 0;
  if (b > 0.2) filtered(c, `blur(${b.toFixed(1)}px)`, draw, "boothFront");
  else draw(c);
  void abs;
}

/** The desk from above: the logbook, a pen, the thermos cup; the phone lies at (540, 900) (drawn by the shot). */
export function deskTop(c: Ctx, abs: number) {
  fillBg(c, "#4a3a2c");
  for (let i = 0; i < 12; i++) inkLine(c, [[-40, 120 + i * 160], [W + 40, 140 + i * 160]], 5600 + i, 2, "rgba(30,20,10,0.3)");
  // logbook
  c.save();
  c.translate(170, 520);
  c.rotate(-0.2);
  poly(c, [[-170, -230], [170, -230], [170, 230], [-170, 230]], 5610, 1);
  paint(c, "#f1e9d8", C.ink, 5);
  text(c, "值班记录", 0, -170, { size: 44, font: F.ui, weight: 700, fill: "#333" });
  for (let i = 0; i < 7; i++) inkLine(c, [[-140, -100 + i * 50], [140, -100 + i * 50]], 5611 + i, 2, "rgba(60,60,90,0.45)");
  c.restore();
  // thermos cup
  oval(c, 930, 420, 110, 110, 5620, 1.2);
  paint(c, "#c0392b", C.ink, 6);
  oval(c, 930, 420, 80, 80, 5621, 1);
  paint(c, "#6b3a1c", C.ink, 4);
  // pen
  inkLine(c, [[860, 1350], [1000, 1250]], 5622, 12, "#1d3a7a");
  // the window's lamp light across the desk
  glow(c, 700, 300, 900, "rgba(255,170,90,0.2)", 1);
  void abs;
}

/** The booth from outside in the snow: a small warm window, him inside, the gate and the lamp. */
export function boothOutside(c: Ctx, abs: number) {
  gateNight(c, abs, 0);
  // the booth
  rbox(c, 380, 760, 420, 560, 10, 5701, 1.4);
  paint(c, "#cfd8e4", C.ink, 7);
  poly(c, [[360, 760], [820, 760], [790, 700], [390, 700]], 5702, 1);
  paint(c, "#2a3a58", C.ink, 6);
  text(c, "门卫", 590, 732, { size: 40, font: F.ui, weight: 700, fill: "#fff" });
  // its window, warm
  rbox(c, 430, 830, 320, 250, 6, 5703, 1);
  paint(c, "#ffcf87", C.ink, 6);
  glow(c, 590, 960, 420, "rgba(255,190,110,0.55)", 1);
  // him inside, head bowed over the phone
  c.save();
  c.beginPath();
  c.rect(430, 830, 320, 250);
  c.clip();
  drawDad(c, 590, 960, 0.5, { face: "smile", tilt: 0.12 });
  glow(c, 600, 1040, 90, "rgba(160,200,255,0.8)", 1);
  c.restore();
  // snow on the roof and around
  blob(c, [[360, 700], [600, 676], [820, 700], [800, 716], [380, 716]], 5704, 1.4);
  paint(c, "#f4f6fb", C.ink, 4);
  snow(c, abs, { n: 80, seed: 51, speed: 120, size: 6, alpha: 0.9, drift: 30 });
}

// ---------------------------------------------------------------- the dorm three years ago
export function dorm(c: Ctx, abs: number) {
  fillBg(c, vgrad(c, 0, H, [[0, "#f3d9b0"], [1, "#d9b088"]]));
  // bunk bed and desks
  poly(c, [[-60, 300], [500, 300], [500, 330], [-60, 330]], 5801, 1);
  paint(c, "#8a6a4a", C.ink, 5);
  poly(c, [[-60, 1180], [1140, 1170], [1140, 2000], [-60, 2000]], 5802, 1);
  paint(c, "#b98a5e", C.ink, 6);
  // posters and string lights
  rbox(c, 620, 380, 180, 240, 6, 5803, 1);
  paint(c, "#9fd4f5", C.ink, 4);
  rbox(c, 840, 420, 160, 200, 6, 5804, 1);
  paint(c, "#ffd3dc", C.ink, 4);
  for (let i = 0; i < 8; i++) glow(c, 80 + i * 140, 220 + Math.sin(i) * 20, 60, "rgba(255,230,160,0.6)", 0.8 + 0.2 * Math.sin(abs * 2 + i));
  // the lower bunk mattress
  poly(c, [[-60, 1000], [760, 1010], [760, 1190], [-60, 1180]], 5805, 1);
  paint(c, "#f4efe6", C.ink, 6);
}

/** her two roommates leaning in to look at her phone and laughing */
export function roommates(c: Ctx, abs: number, k: number) {
  const lean = 40 * k;
  drawPerson(c, 230 - lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "long", hairColor: "#3a2414", top: "#f2c94c", face: k > 0.5 ? "laugh" : "smile", body: "bust", tilt: 0.15 * k, arms: k > 0.5 ? "laugh" : "down", seed: 961 });
  drawPerson(c, 850 + lean * 0.3, 760 + lean * 0.2, 0.95, { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", face: k > 0.5 ? "laugh" : "smile", body: "bust", tilt: -0.15 * k, seed: 962 });
  void abs;
}
