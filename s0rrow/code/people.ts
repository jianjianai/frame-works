import { C, Ctx, Pt, blob, curve, hash, ik2, inkLine, lerp2, oval, paint, poly, shaded, tubePts } from "./draw";
import { HandShape, drawHand } from "./kid";

/** Everyone else (adults/classmates), drawn in the same refined style as the protagonist:
 *  shaded face, eyes with iris + catchlights, brows, styled hair with lock lines, jointed sleeves and real hands.
 *  `x` (0..1) overlays the cover's crossed-out "X" face (used before a twist). (x, y) = head centre. */
export interface Person {
  hair?: "short" | "long" | "bob" | "pony" | "buzz" | "cap" | "bun" | "curly";
  hairColor?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  skin?: string;
  x?: number; // 0..1, how much of the X mark is visible
  face?: "smile" | "laugh" | "neutral" | "o" | "sad";
  arms?: "down" | "laugh" | "behind" | "up" | "phone" | "handL" | "handR" | "point" | "hold" | "waveL" | "thumb";
  wave?: number; // 0..1 hand raised for "waveL"
  legs?: "stand" | "walk" | "sit";
  walk?: number;
  body?: "bust" | "full";
  turn?: number; // -1..1 head turn
  tilt?: number;
  glasses?: boolean;
  /** white lab coat over the top */
  coat?: boolean;
  /** surgical mask: 1 = on, 0 = pulled down under the chin */
  mask?: number;
  seed?: number;
  /** drawn between arms and hands */
  holding?: (ctx: Ctx) => void;
}

export const CAST: Record<string, Person> = {
  jie: { hair: "short", hairColor: "#1f1a17", top: "#ef8a3a", bottom: "#3b4a63", shoes: "#f2f2f2", seed: 301 },
  yu: { hair: "curly", hairColor: "#2a1d18", top: C.maroon, bottom: "#3a4440", shoes: "#f3c6cf", skin: "#d9a77c", seed: 302 },
  monitor: { hair: "pony", hairColor: "#3a2414", top: "#f2c94c", bottom: "#2f3b4f", glasses: true, seed: 303 },
  a: { hair: "buzz", hairColor: "#222", top: "#5aa36b", bottom: "#2d2d3a", seed: 304 },
  b: { hair: "long", hairColor: "#5a3a22", top: "#e9e4dc", bottom: "#6b7fa8", seed: 305 },
  c: { hair: "cap", hairColor: "#222", top: "#7d63b8", bottom: "#333", seed: 306 },
  d: { hair: "bun", hairColor: "#191515", top: "#e46f78", bottom: "#41506b", seed: 307 },
  e: { hair: "bob", hairColor: "#6b4a2a", top: "#4f8fbf", bottom: "#2e2e2e", seed: 308 },
  vet: { hair: "short", hairColor: "#2a2220", top: "#8fc1d0", bottom: "#4f5f6e", shoes: "#e9e9e9", glasses: true, coat: true, x: 0, seed: 309 },
};

function darker(hex: string, k = 0.75) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (sh: number) => Math.round(((n >> sh) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** The crossed-out face from the cover art. */
export function xMark(ctx: Ctx, cx: number, cy: number, r: number, seed: number, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "round";
  for (const [a, b] of [
    [[-r, -r * 0.8], [r, r * 0.85]],
    [[r * 0.95, -r * 0.85], [-r * 0.9, r * 0.8]],
  ] as [Pt, Pt][]) {
    curve(ctx, [[cx + a[0], cy + a[1]], [cx + (a[0] + b[0]) / 2, cy + (a[1] + b[1]) / 2], [cx + b[0], cy + b[1]]], seed++, 2);
    ctx.strokeStyle = C.xBlue;
    ctx.lineWidth = r * 0.42;
    ctx.stroke();
    ctx.strokeStyle = C.xWhite;
    ctx.lineWidth = r * 0.24;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- head
const FACE: Pt[] = [
  [-50, -88], [-86, -60], [-98, -14], [-96, 30], [-86, 64], [-66, 88], [-34, 102], [0, 106],
  [34, 101], [66, 86], [86, 62], [96, 28], [98, -14], [86, -60], [50, -88], [0, -96],
];

function hairBack(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  const sh = darker(hc, 0.7);
  if (p.hair === "long") {
    shaded(ctx, () => blob(ctx, [[-96, -40], [-114, 80], [-108, 220], [-64, 250], [64, 250], [108, 220], [114, 80], [96, -40], [0, -116]], seed, 1.8), hc, () => {
      for (let i = 0; i < 5; i++) inkLine(ctx, [[-80 + i * 40, 40], [-86 + i * 42, 160], [-80 + i * 40, 240]], seed + 1 + i, 2.4, sh);
    }, C.ink, 5);
  } else if (p.hair === "pony") {
    shaded(ctx, () => blob(ctx, [[60, -84], [146, -66], [170, 24], [146, 130], [118, 44], [82, -20]], seed, 1.8), hc, () => {
      inkLine(ctx, [[90, -50], [140, 20], [140, 110]], seed + 1, 2.4, sh);
    }, C.ink, 5);
    oval(ctx, 82, -70, 14, 12, seed + 2, 0.6);
    paint(ctx, "#e8505b", C.ink, 3.5);
  } else if (p.hair === "bun") {
    shaded(ctx, () => oval(ctx, 0, -112, 46, 40, seed, 1.4), hc, () => {
      inkLine(ctx, [[-30, -112], [0, -128], [28, -110]], seed + 1, 2.4, sh);
    }, C.ink, 5);
  } else if (p.hair === "curly") {
    const pts: Pt[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const r = i % 2 ? 120 : 104;
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
    }
    blob(ctx, pts, seed, 2);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "bob") {
    shaded(ctx, () => blob(ctx, [[-102, -20], [-110, 70], [-92, 112], [92, 112], [110, 70], [102, -20], [0, -114]], seed, 1.8), hc, () => {
      inkLine(ctx, [[-90, 20], [-96, 100]], seed + 1, 2.4, sh);
      inkLine(ctx, [[90, 20], [96, 100]], seed + 2, 2.4, sh);
    }, C.ink, 5);
  }
}

function hairFront(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  const sh = darker(hc, 0.65);
  const hi = "rgba(255,255,255,0.18)";
  const locks = (n: number, y0: number) => {
    for (let i = 0; i < n; i++) {
      const x = -70 + (i * 140) / Math.max(1, n - 1);
      inkLine(ctx, [[x * 0.6, y0 - 60], [x * 0.85, y0 - 30], [x, y0]], seed + 10 + i, 2.4, sh);
    }
  };
  switch (p.hair ?? "short") {
    case "short":
      shaded(ctx, () => poly(ctx, [[-96, 4], [-104, -50], [-74, -98], [-20, -116], [42, -110], [92, -80], [104, -30], [98, 6], [76, -26], [52, -12], [36, -36], [8, -14], [-14, -36], [-40, -14], [-60, -36], [-78, -8]], seed, 1.3), hc, () => {
        locks(5, -22);
        inkLine(ctx, [[-60, -86], [-20, -100], [20, -98]], seed + 30, 5, hi);
      }, C.ink, 5);
      break;
    case "buzz":
      shaded(ctx, () => blob(ctx, [[-90, -22], [-80, -82], [0, -104], [80, -82], [90, -22], [40, -54], [-40, -54]], seed, 1.1), hc, () => {
        for (let i = 0; i < 14; i++) {
          const x = -70 + hash(seed + i) * 140,
            y = -90 + hash(seed + i * 2) * 40;
          inkLine(ctx, [[x, y], [x + 3, y + 5]], seed + 40 + i, 2, sh);
        }
      }, C.ink, 4);
      break;
    case "cap":
      shaded(ctx, () => blob(ctx, [[-98, -16], [-88, -88], [0, -114], [88, -88], [98, -16]], seed, 1.1), p.top ?? "#c33", () => {
        inkLine(ctx, [[0, -112], [0, -20]], seed + 1, 2.4, "rgba(0,0,0,0.3)");
      }, C.ink, 5);
      blob(ctx, [[-110, -18], [60, -30], [156, -8], [60, 2], [-100, 2]], seed + 2, 1.1);
      paint(ctx, p.top ?? "#c33", C.ink, 5);
      break;
    case "curly": {
      const pts: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const r = i % 2 ? 118 : 98;
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
      }
      pts.push([90, -10], [50, -40], [10, -18], [-40, -44], [-90, -8]);
      shaded(ctx, () => blob(ctx, pts, seed, 1.8), hc, () => {
        for (let i = 0; i < 8; i++) {
          const a = Math.PI * (1.1 + i * 0.1);
          oval(ctx, Math.cos(a) * 80, Math.sin(a) * 76 - 10, 12, 10, seed + 50 + i, 0.6);
          paint(ctx, null, sh, 2.4);
        }
      }, C.ink, 5);
      break;
    }
    default:
      shaded(ctx, () => blob(ctx, [[-100, 10], [-100, -60], [-50, -106], [20, -112], [86, -86], [104, -20], [100, 10], [70, -40], [10, -30], [-50, -46]], seed, 1.3), hc, () => {
        locks(4, -36);
        inkLine(ctx, [[-60, -86], [-20, -100], [20, -98]], seed + 30, 5, hi);
      }, C.ink, 5);
  }
}

function personEye(ctx: Ctx, cx: number, cy: number, side: number, p: Person, seed: number) {
  const f = p.face ?? "smile";
  if (f === "laugh" || f === "smile") {
    // happy closed arcs
    inkLine(ctx, [[cx - 18, cy + 6], [cx, cy - 6], [cx + 18, cy + 6]], seed, 4.6);
    return;
  }
  const open = f === "o" ? 1 : f === "sad" ? 0.6 : 0.8;
  const up: Pt[] = [[cx - 20 * side, cy + 2], [cx - 8 * side, cy - 15 * open], [cx + 10 * side, cy - 15 * open], [cx + 20 * side, cy + 2]];
  const lo: Pt[] = [[cx + 20 * side, cy + 3], [cx + 8 * side, cy + 11], [cx - 8 * side, cy + 11], [cx - 20 * side, cy + 3]];
  ctx.save();
  blob(ctx, [...up, ...lo], seed, 0.5);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();
  ctx.clip();
  const lx = (p.turn ?? 0) * 6;
  ctx.fillStyle = "#3a2a20";
  ctx.beginPath();
  ctx.arc(cx + lx, cy + 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(cx + lx, cy + 2, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx + lx - 3.5, cy - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  curve(ctx, up, seed + 1, 0.5);
  paint(ctx, null, C.ink, 4.6);
  inkLine(ctx, [lo[0], lo[1], lo[2]], seed + 2, 2);
}

function face(ctx: Ctx, p: Person, seed: number) {
  const f = p.face ?? "smile";
  const tx = (p.turn ?? 0) * 26;
  const sad = f === "sad";
  // brows
  for (const side of [-1, 1]) {
    const cx = tx + side * 38;
    const yi = sad ? -30 : -24,
      yo = sad ? -18 : -26;
    curve(ctx, [[cx - 14 * side, yi], [cx, (yi + yo) / 2 - 3], [cx + 16 * side, yo]], seed + 20 + side, 0.6);
    ctx.lineCap = "round";
    ctx.strokeStyle = darker(p.hairColor ?? "#2a2220", 0.8);
    ctx.lineWidth = 6;
    ctx.stroke();
    personEye(ctx, cx, 4, side, p, seed + 30 + side * 3);
  }
  // nose
  inkLine(ctx, [[tx + 2, 22], [tx + 10, 36], [tx + 2, 42]], seed + 40, 3);
  // cheeks
  for (const side of [-1, 1]) {
    oval(ctx, tx + side * 54, 40, 15, 8, seed + 41 + side, 0.6);
    paint(ctx, "rgba(240,120,120,0.35)", null);
  }
  // mouth
  if (f === "laugh") {
    blob(ctx, [[tx - 26, 56], [tx + 26, 56], [tx + 16, 82], [tx - 16, 82]], seed + 50, 0.8);
    paint(ctx, "#5e2228", C.ink, 4);
    ctx.save();
    blob(ctx, [[tx - 26, 56], [tx + 26, 56], [tx + 16, 82], [tx - 16, 82]], seed + 50, 0.8);
    ctx.clip();
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(tx - 30, 52, 60, 9);
    ctx.restore();
  } else if (f === "o") {
    oval(ctx, tx, 66, 9, 12, seed + 51, 0.6);
    paint(ctx, "#5e2228", C.ink, 3.5);
  } else if (f === "smile") {
    inkLine(ctx, [[tx - 20, 58], [tx - 6, 68], [tx + 8, 68], [tx + 20, 58]], seed + 52, 4);
  } else if (sad) {
    inkLine(ctx, [[tx - 14, 68], [tx, 62], [tx + 14, 68]], seed + 53, 4);
  } else inkLine(ctx, [[tx - 12, 64], [tx + 12, 64]], seed + 54, 4);
  if (p.glasses) {
    for (const side of [-1, 1]) {
      oval(ctx, tx + side * 38, 4, 27, 23, seed + 60 + side, 0.6);
      paint(ctx, "rgba(220,240,255,0.18)", C.ink, 4);
      inkLine(ctx, [[tx + side * 38 - 12, -6], [tx + side * 38 - 4, -12]], seed + 62 + side, 2.4, "rgba(255,255,255,0.8)");
    }
    inkLine(ctx, [[tx - 11, 2], [tx + 11, 2]], seed + 64, 4);
  }
}

function surgicalMask(ctx: Ctx, p: Person, seed: number) {
  const on = p.mask ?? 0;
  const tx = (p.turn ?? 0) * 26;
  const dy = (1 - on) * 74; // pulled down under the chin
  ctx.save();
  ctx.translate(tx, dy);
  shaded(ctx, () => blob(ctx, [[-70, 24], [0, 16], [70, 24], [66, 86], [0, 104], [-66, 86]], seed, 0.8), "#bfe0ec", () => {
    for (let i = 0; i < 3; i++) inkLine(ctx, [[-60, 44 + i * 16], [60, 44 + i * 16]], seed + 1 + i, 2, "rgba(60,110,130,0.45)");
  }, C.ink, 3.5);
  ctx.restore();
  inkLine(ctx, [[-70 + tx, 30 + dy], [-92, 24]], seed + 5, 2.4, "#9cc4d2");
  inkLine(ctx, [[70 + tx, 30 + dy], [92, 24]], seed + 6, 2.4, "#9cc4d2");
}

// ---------------------------------------------------------------- body
interface ArmT {
  wrist: Pt;
  bend: number;
  shape: HandShape;
}
function armTargets(p: Person): [ArmT | null, ArmT | null] {
  const a = p.arms ?? "down";
  let L: ArmT | null = { wrist: [-112, 352], bend: -1, shape: "relax" },
    R: ArmT | null = { wrist: [112, 352], bend: 1, shape: "relax" };
  switch (a) {
    case "laugh":
      L = { wrist: [-40, 270], bend: -1, shape: "fist" };
      R = { wrist: [90, 120], bend: 1, shape: "open" };
      break;
    case "point":
      L = { wrist: [-50, 280], bend: -1, shape: "relax" };
      R = { wrist: [-230, 60], bend: 1, shape: "open" };
      break;
    case "up":
      L = { wrist: [-150, -110], bend: 1, shape: "open" };
      R = { wrist: [150, -110], bend: -1, shape: "open" };
      break;
    case "thumb":
      R = { wrist: [70, 230], bend: 1, shape: "fist" };
      break;
    case "hold":
      L = { wrist: [-140, 70], bend: -1, shape: "hold" };
      R = { wrist: [140, 70], bend: 1, shape: "hold" };
      break;
    case "phone":
      L = { wrist: [-30, 250], bend: -1, shape: "hold" };
      R = { wrist: [30, 250], bend: 1, shape: "hold" };
      break;
    case "handL":
      L = { wrist: [-180, 300], bend: -1, shape: "relax" };
      break;
    case "handR":
      R = { wrist: [180, 300], bend: 1, shape: "relax" };
      break;
    case "behind":
      L = R = null;
      break;
    case "waveL": {
      const w = p.wave ?? 1;
      L = { wrist: [-150 - 30 * w + Math.sin((p.walk ?? 0) * 3) * 18 * w, 60 - 190 * w], bend: 1, shape: "open" };
      R = { wrist: [140, 70], bend: 1, shape: "hold" };
      break;
    }
  }
  return [L, R];
}

function sleeve(ctx: Ctx, shoulder: Pt, t: ArmT, color: string, seed: number, mirror: boolean) {
  const [elbow, wrist] = ik2(shoulder, t.wrist, 128, 124, t.bend);
  const spine = [shoulder, lerp2(shoulder, elbow, 0.5), elbow, lerp2(elbow, wrist, 0.5), wrist];
  shaded(ctx, () => blob(ctx, tubePts(spine, [54, 50, 46, 42, 40], true, true), seed, 1), color, () => {
    blob(ctx, tubePts(spine.map(([x, y]) => [x + 12, y + 4]) as Pt[], [34, 30, 28, 26, 24], true, true), seed + 1, 1);
    paint(ctx, darker(color.startsWith("#") ? color : "#888888", 0.82), null);
  }, C.ink, 5);
  inkLine(ctx, [lerp2(elbow, shoulder, 0.15), elbow, lerp2(elbow, wrist, 0.15)], seed + 2, 2.2, "rgba(0,0,0,0.25)");
  return { wrist, ang: Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]), mirror };
}

/** Draw a person with head centre at (x, y). */
export function drawPerson(ctx: Ctx, x: number, y: number, s: number, p: Person) {
  const seed = p.seed ?? 500;
  const skin = p.skin ?? C.skin;
  const top = p.top ?? "#888888";
  const xa = p.x ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = p.body ?? "full";
  if (body === "full") {
    const ph = p.walk ?? 0;
    for (const side of [-1, 1]) {
      const sw = p.legs === "walk" ? Math.sin(ph) * side : 0;
      const hip: Pt = [side * 46, 350];
      const foot: Pt = p.legs === "sit" ? [side * 70, 560] : [side * 44 + sw * 30, 690 - (p.legs === "walk" ? Math.max(0, Math.cos(ph) * side) * 30 : 0)];
      const knee: Pt = p.legs === "sit" ? [side * 60, 450] : lerp2(hip, foot, 0.5);
      shaded(ctx, () => blob(ctx, tubePts([hip, knee, foot], [80, 66, 58], true, true), seed + side, 1.2), p.bottom ?? "#334455", () => {
        blob(ctx, tubePts([[hip[0] + 16, hip[1]], [knee[0] + 14, knee[1]], [foot[0] + 12, foot[1]]], [40, 34, 30], true, true), seed + 2 + side, 1);
        paint(ctx, "rgba(0,0,0,0.18)", null);
      }, C.ink, 5);
      blob(ctx, [[foot[0] - 40, foot[1] + 10], [foot[0] + 6 * side, foot[1] - 8], [foot[0] + 46, foot[1] + 12], [foot[0] + 30, foot[1] + 30], [foot[0] - 34, foot[1] + 30]], seed + 4 + side, 0.9);
      paint(ctx, p.shoes ?? "#1d1b1c", C.ink, 4.5);
    }
  }
  // neck
  blob(ctx, [[-30, 80], [30, 80], [34, 140], [-34, 140]], seed + 9, 0.8);
  paint(ctx, darker(skin.startsWith("#") ? skin : "#f3dcae", 0.92), C.ink, 4.5);
  // torso (shirt) and optional lab coat
  const torso: Pt[] = [[-60, 124], [-96, 140], [-108, 220], [-104, 350], [0, 360], [104, 350], [108, 220], [96, 140], [60, 124], [0, 134]];
  shaded(ctx, () => blob(ctx, torso, seed + 10, 1.2), top, () => {
    blob(ctx, [[50, 124], [120, 150], [120, 380], [60, 380], [74, 240]], seed + 11, 1.2);
    paint(ctx, "rgba(0,0,0,0.16)", null);
  }, C.ink, 5.5);
  if (p.coat) {
    for (const side of [-1, 1]) {
      shaded(ctx, () => poly(ctx, [[side * 20, 132], [side * 100, 142], [side * 114, 230], [side * 112, 400], [side * 40, 404], [side * 34, 250]], seed + 12 + side, 1.2), "#f6f7f8", () => {
        poly(ctx, [[side * 70, 150], [side * 120, 160], [side * 120, 420], [side * 84, 420]], seed + 14 + side, 1);
        paint(ctx, "rgba(150,170,180,0.25)", null);
      }, C.ink, 5);
      // lapel
      poly(ctx, [[side * 22, 134], [side * 58, 136], [side * 40, 200]], seed + 16 + side, 0.8);
      paint(ctx, "#e4e8ea", C.ink, 3.5);
    }
    // pocket with pens
    poly(ctx, [[-96, 250], [-50, 250], [-52, 300], [-94, 300]], seed + 18, 0.8);
    paint(ctx, null, "rgba(0,0,0,0.35)", 3);
    inkLine(ctx, [[-84, 236], [-84, 256]], seed + 19, 4, "#2f6fb0");
    inkLine(ctx, [[-70, 232], [-70, 256]], seed + 20, 4, "#c0392b");
  }
  const [L, R] = armTargets(p);
  const coatCol = p.coat ? "#f6f7f8" : top;
  const al = L ? sleeve(ctx, [-90, 156], L, coatCol, seed + 22, true) : null;
  const ar = R ? sleeve(ctx, [90, 156], R, coatCol, seed + 26, false) : null;
  p.holding?.(ctx);
  if (al && L) drawHand(ctx, al.wrist[0], al.wrist[1], 0.86, al.ang, L.shape, true, false, seed + 30);
  if (ar && R) drawHand(ctx, ar.wrist[0], ar.wrist[1], 0.86, ar.ang, R.shape, false, false, seed + 31);
  if (p.arms === "thumb" && ar) {
    // thumb up
    ctx.save();
    ctx.translate(ar.wrist[0] + 30, ar.wrist[1] - 26);
    blob(ctx, [[-8, 10], [-10, -30], [0, -40], [10, -30], [8, 10]], seed + 32, 0.6);
    paint(ctx, skin, C.ink, 4);
    ctx.restore();
  }
  // head
  ctx.save();
  ctx.rotate(p.tilt ?? 0);
  hairBack(ctx, p, seed + 40);
  for (const side of [-1, 1]) {
    oval(ctx, side * 96, 14, 14, 21, seed + 44 + side, 0.8);
    paint(ctx, skin, C.ink, 4);
  }
  shaded(ctx, () => blob(ctx, FACE, seed + 50, 1.1), skin, () => {
    blob(ctx, [[50, 106], [90, 64], [104, 10], [120, 80], [70, 130]], seed + 51, 1);
    paint(ctx, "rgba(200,150,95,0.3)", null);
  }, C.ink, 5);
  if (xa < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - xa;
    face(ctx, p, seed + 60);
    ctx.restore();
  }
  if (p.mask !== undefined) surgicalMask(ctx, p, seed + 66);
  hairFront(ctx, p, seed + 70);
  xMark(ctx, (p.turn ?? 0) * 26, 10, 60, seed + 80, xa);
  ctx.restore();
  ctx.restore();
}

/** Pink rolled/unrolled banner "生日快乐". `open` 0 = rolled, 1 = fully open. */
export function banner(ctx: Ctx, x: number, y: number, w: number, open: number, label: string, seed: number, fontFamily: string) {
  const h = 150;
  const ww = Math.max(40, w * open);
  ctx.save();
  poly(ctx, [[x - ww / 2, y - h / 2], [x + ww / 2, y - h / 2 + 6], [x + ww / 2, y + h / 2], [x - ww / 2, y + h / 2 - 6]], seed, 2);
  paint(ctx, "#ff7fb0", C.ink, 5);
  if (open > 0.6) {
    ctx.globalAlpha *= (open - 0.6) / 0.4;
    ctx.font = `400 96px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = C.ink;
    ctx.strokeText(label, x, y + 6);
    ctx.fillStyle = "#fff6c9";
    ctx.fillText(label, x, y + 6);
  }
  ctx.restore();
  for (const side of [-1, 1]) {
    oval(ctx, x + (side * ww) / 2, y, 22, h / 2 + 8, seed + side, 1);
    paint(ctx, "#ff9cc3", C.ink, 5);
  }
}

/** Little "哈哈哈" laugh scribbles around a point. */
export function hahas(ctx: Ctx, cx: number, cy: number, r: number, t: number, seed: number, fontFamily: string, count = 6) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < count; i++) {
    const a = hash(seed + i) * Math.PI * 2;
    const rr = r * (0.6 + hash(seed + i * 3) * 0.5);
    const born = hash(seed + i * 7) * 0.8;
    const k = Math.max(0, Math.min(1, (t - born) * 4));
    if (k <= 0) continue;
    const sz = 44 + hash(seed + i * 5) * 30;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    ctx.rotate((hash(seed + i * 9) - 0.5) * 0.7);
    ctx.scale(k, k);
    ctx.font = `400 ${sz}px ${fontFamily}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = C.ink;
    ctx.strokeText("哈哈哈", 0, 0);
    ctx.fillStyle = i % 2 ? "#ffe45c" : "#fff";
    ctx.fillText("哈哈哈", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
