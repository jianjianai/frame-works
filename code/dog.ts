import { C, Ctx, Pt, blob, curve, hash, ik2, inkLine, lerp2, oval, paint, poly, rotPt, shaded, tubePts } from "./draw";

/** 豆豆: an old, scruffy rescued mutt — cream fur, caramel saddle and ears, a dark patch over one eye,
 *  grey muzzle, red collar with a bone tag, a little heart-shaped spot on the hip, one torn ear.
 *  Side view faces right (mirror with a negative scale); front view looks at the camera. */
export interface DogPose {
  view?: "side" | "front";
  /** side: stand / walk / sit / lie (sphinx) / flop (lying on its side) / curl (asleep, curled up)
   *  front: lie (chin on paws or head up) / sit / head */
  pose?: "stand" | "walk" | "sit" | "lie" | "flop" | "curl" | "head";
  walk?: number; // gait phase (rad)
  eyes?: "open" | "sad" | "wide" | "shut" | "happy" | "half";
  look?: Pt; // -1..1
  brows?: "flat" | "sad" | "up";
  mouth?: "closed" | "open" | "pant" | "toy" | "leash" | "lick" | "whine";
  ears?: number; // 0 = droopy … 1 = perked
  headUp?: number; // front lie: 0 = chin on paws, 1 = head raised; side: head raise
  headTurn?: number; // front: -1..1
  headTilt?: number; // rad
  tail?: number; // -1 tucked … 0 down … 1 up
  wag?: number; // wag phase (rad); amplitude from wagAmt
  wagAmt?: number;
  breathe?: number; // 0..1 breathing phase
  wet?: number;
  young?: number; // 0 = old dog, 1 = puppy
  cone?: boolean; // post-surgery e-collar
  shaved?: boolean; // shaved chest with stitches
  collar?: boolean;
  seed?: number;
}

export const DOG = {
  fur: "#f1dfba",
  furSh: "#dcc193",
  furDk: "#c4a574",
  patch: "#c98a4b",
  patchDk: "#a86c35",
  eyePatch: "#6f4424",
  muzzle: "#fbf4e6",
  grey: "#b9b2a6",
  nose: "#221e20",
  eye: "#2a1b12",
  brow: "#b8823f",
  collar: "#d8343c",
  tag: "#f2c94c",
  tongue: "#ee7b86",
  pink: "#f3a9a4",
};

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
/** fur colours darken when wet */
function pal(p: DogPose) {
  const w = p.wet ?? 0;
  return {
    fur: w ? mixHex(DOG.fur, "#a99d86", w * 0.55) : DOG.fur,
    furSh: w ? mixHex(DOG.furSh, "#8a7d66", w * 0.55) : DOG.furSh,
    patch: w ? mixHex(DOG.patch, "#7a5a3a", w * 0.5) : DOG.patch,
    muzzle: w ? mixHex(DOG.muzzle, "#c9c0b0", w * 0.5) : DOG.muzzle,
  };
}

/** Furry contour: insert little tufts along the polygon, pointing outward. */
function furry(pts: Pt[], amp: number, seed: number, every = 1, skip?: (i: number) => boolean): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  // centroid for "outward"
  const cx = pts.reduce((s, p) => s + p[0], 0) / n,
    cy = pts.reduce((s, p) => s + p[1], 0) / n;
  for (let i = 0; i < n; i++) {
    const a = pts[i],
      b = pts[(i + 1) % n];
    out.push(a);
    if (i % every || skip?.(i)) continue;
    const m = lerp2(a, b, 0.5 + (hash(seed + i) - 0.5) * 0.3);
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    let nx = -dy / l,
      ny = dx / l;
    if ((m[0] - cx) * nx + (m[1] - cy) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const k = amp * (0.6 + hash(seed + i * 3) * 0.6);
    out.push([m[0] + nx * k - (dx / l) * k * 0.5, m[1] + ny * k - (dy / l) * k * 0.5]);
  }
  return out;
}

// ---------------------------------------------------------------- shared face parts
function dogEye(ctx: Ctx, x: number, y: number, r: number, p: DogPose, seed: number, side = 1) {
  const st = p.eyes ?? "open";
  if (st === "shut") {
    inkLine(ctx, [[x - r, y], [x, y + r * 0.45], [x + r, y]], seed, Math.max(3, r * 0.32));
    return;
  }
  if (st === "happy") {
    inkLine(ctx, [[x - r, y + r * 0.3], [x, y - r * 0.5], [x + r, y + r * 0.3]], seed, Math.max(3, r * 0.32));
    return;
  }
  const look = p.look ?? [0, 0];
  const ry = st === "half" ? r * 0.55 : st === "wide" ? r * 1.15 : r;
  oval(ctx, x, y, r * 1.02, ry, seed, 0.5);
  paint(ctx, DOG.eye, C.ink, Math.max(2.5, r * 0.22));
  ctx.save();
  oval(ctx, x, y, r * 1.02, ry, seed, 0.5);
  ctx.clip();
  // warm brown iris glint
  ctx.fillStyle = "#5a3a22";
  ctx.beginPath();
  ctx.arc(x + look[0] * r * 0.3, y + r * 0.35 + look[1] * r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - r * 0.32 + look[0] * r * 0.25, y - r * 0.34 + look[1] * r * 0.2, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.36 + look[0] * r * 0.25, y + r * 0.3 + look[1] * r * 0.2, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  if (st === "sad" || st === "half") {
    // heavy, droopy lid (old dog)
    ctx.fillStyle = "rgba(160,120,80,0.95)";
    ctx.beginPath();
    ctx.moveTo(x - r * 1.4, y - r * 1.4);
    ctx.lineTo(x + r * 1.4, y - r * 1.4);
    ctx.lineTo(x + r * 1.4, y - r * (st === "half" ? 0.1 : 0.45) + side * r * 0.25);
    ctx.lineTo(x - r * 1.4, y - r * (st === "half" ? 0.1 : 0.45) - side * r * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  if (st === "sad" || st === "half") {
    inkLine(ctx, [[x - r * 1.05, y - r * (st === "half" ? 0.1 : 0.45) - side * r * 0.25], [x + r * 1.05, y - r * (st === "half" ? 0.1 : 0.45) + side * r * 0.25]], seed + 1, Math.max(2.5, r * 0.22));
  }
}

function dogBrow(ctx: Ctx, x: number, y: number, r: number, p: DogPose, seed: number, side: number) {
  const st = p.brows ?? (p.eyes === "sad" || p.eyes === "half" ? "sad" : p.eyes === "wide" ? "up" : "flat");
  const lift = st === "up" ? -r * 0.5 : 0;
  const tilt = st === "sad" ? 0.45 * side : 0;
  ctx.save();
  ctx.translate(x, y + lift);
  ctx.rotate(tilt);
  oval(ctx, 0, 0, r * 0.62, r * 0.36, seed, 0.4);
  paint(ctx, DOG.brow, null);
  ctx.restore();
}

function noseShape(ctx: Ctx, x: number, y: number, w: number, seed: number) {
  blob(ctx, [[x - w, y - w * 0.4], [x, y - w * 0.62], [x + w, y - w * 0.4], [x + w * 0.5, y + w * 0.38], [x, y + w * 0.52], [x - w * 0.5, y + w * 0.38]], seed, 0.6);
  paint(ctx, DOG.nose, C.ink, Math.max(2.5, w * 0.18));
  oval(ctx, x - w * 0.3, y - w * 0.22, w * 0.3, w * 0.16, seed + 1, 0.3);
  paint(ctx, "rgba(255,255,255,0.75)", null);
}

// ---------------------------------------------------------------- toys / props held in the mouth
export function bunnyToy(ctx: Ctx, x: number, y: number, s: number, rot: number, seed = 2100) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // a chewed-up grey bunny plush with one ear flopped
  shaded(ctx, () => blob(ctx, [[-30, -20], [0, -30], [30, -18], [36, 14], [10, 30], [-24, 26], [-38, 4]], seed, 1.4), "#c9c4c9", () => {
    oval(ctx, 8, 6, 16, 12, seed + 1, 1);
    paint(ctx, "#ebe6ea", null);
  }, C.ink, 4.5);
  blob(ctx, [[-14, -26], [-24, -76], [-8, -80], [0, -28]], seed + 2, 1);
  paint(ctx, "#c9c4c9", C.ink, 4);
  blob(ctx, [[6, -28], [30, -60], [44, -52], [16, -22]], seed + 3, 1);
  paint(ctx, "#c9c4c9", C.ink, 4);
  oval(ctx, -8, -8, 3.5, 3.5, seed + 4, 0.3);
  paint(ctx, C.ink, null);
  oval(ctx, 14, -8, 3.5, 3.5, seed + 5, 0.3);
  paint(ctx, C.ink, null);
  // stitched-up seam
  inkLine(ctx, [[-20, 12], [20, 16]], seed + 6, 2, "#7a6a7a");
  for (let i = 0; i < 5; i++) inkLine(ctx, [[-16 + i * 8, 9], [-14 + i * 8, 19]], seed + 7 + i, 1.6, "#7a6a7a");
  ctx.restore();
}

export function ballToy(ctx: Ctx, x: number, y: number, r: number, seed = 2200) {
  oval(ctx, x, y, r, r, seed, 0.8);
  paint(ctx, "#d6e04a", C.ink, Math.max(3, r * 0.14));
  curve(ctx, [[x - r * 0.9, y - r * 0.3], [x - r * 0.2, y], [x - r * 0.4, y + r * 0.85]], seed + 1, 0.6);
  paint(ctx, null, "#f6f6ea", Math.max(2, r * 0.12));
  curve(ctx, [[x + r * 0.4, y - r * 0.85], [x + r * 0.2, y], [x + r * 0.9, y + r * 0.3]], seed + 2, 0.6);
  paint(ctx, null, "#f6f6ea", Math.max(2, r * 0.12));
}

// ---------------------------------------------------------------- SIDE VIEW (facing right)
interface Leg {
  top: Pt;
  paw: Pt;
  hind: boolean;
  far: boolean;
  /** stand = normal joints; fwd = stretched forward along the ground (lying) */
  mode?: "stand" | "fwd";
}
interface SideRig {
  body: Pt[];
  neckBase: Pt;
  head: Pt;
  headRot: number;
  legs: Leg[];
  tailBase: Pt;
  tailOnGround?: boolean;
  /** folded hind thigh drawn over the body (sit / lie) */
  thigh?: { c: Pt; rx: number; ry: number; rot: number; paw: Pt };
}

const BODY_STAND: Pt[] = [
  [96, -18], [106, 22], [82, 56], [20, 56], [-40, 52], [-94, 34], [-116, -10], [-104, -48], [-50, -58],
  [10, -60], [60, -58],
];
const BODY_SIT: Pt[] = [
  [40, -78], [70, -48], [84, 6], [72, 60], [34, 100], [-4, 128], [-44, 150], [-94, 142], [-114, 98],
  [-106, 40], [-80, -8], [-30, -54],
];
const BODY_LIE: Pt[] = [
  [92, 36], [104, 88], [74, 126], [0, 132], [-60, 130], [-106, 114], [-124, 70], [-106, 30], [-50, 18],
  [10, 14], [62, 20],
];

function sideRig(p: DogPose): SideRig {
  const pose = p.pose ?? "stand";
  const ph = p.walk ?? 0;
  const up = p.headUp ?? 0.5;
  const breath = Math.sin((p.breathe ?? 0) * Math.PI * 2) * 2;
  const tilt = p.headTilt ?? 0;
  if (pose === "sit") {
    return {
      body: BODY_SIT,
      neckBase: [46, -52],
      head: [112, -156 - up * 12 + breath * 0.5],
      headRot: -0.04 + tilt,
      legs: [
        { top: [42, 30], paw: [48, 160], hind: false, far: true },
        { top: [58, 34], paw: [70, 160], hind: false, far: false },
      ],
      tailBase: [-96, 140],
      tailOnGround: true,
      thigh: { c: [-48, 102], rx: 60, ry: 50, rot: -0.25, paw: [16, 156] },
    };
  }
  if (pose === "lie") {
    const chin = 1 - up;
    return {
      body: BODY_LIE.map(([x, y]) => [x, y - (y < 60 ? breath : 0)] as Pt),
      neckBase: [80, 62],
      head: [152 + chin * 44, -6 + chin * 104],
      headRot: chin * 0.32 + tilt,
      legs: [
        { top: [56, 118], paw: [184, 152], hind: false, far: true, mode: "fwd" },
        { top: [72, 122], paw: [204, 158], hind: false, far: false, mode: "fwd" },
      ],
      tailBase: [-118, 92],
      tailOnGround: true,
      thigh: { c: [-58, 102], rx: 58, ry: 40, rot: -0.12, paw: [2, 154] },
    };
  }
  // stand / walk
  const walking = pose === "walk";
  const legAt = (base: number, off: number, hind: boolean): Pt => {
    if (!walking) return [base, 160];
    const a = ph + off;
    return [base + Math.sin(a) * 30, 160 - Math.max(0, Math.cos(a)) * (hind ? 22 : 30)];
  };
  const bob = walking ? Math.sin(ph * 2) * 3 : breath;
  return {
    body: BODY_STAND.map(([x, y]) => [x, y + bob] as Pt),
    neckBase: [76, -24 + bob],
    head: [150, -100 + bob * 0.6 - (up - 0.5) * 44],
    headRot: (0.5 - up) * 0.5 + tilt,
    legs: [
      { top: [50, 20 + bob], paw: legAt(56, Math.PI, false), hind: false, far: true },
      { top: [-88, 14 + bob], paw: legAt(-98, 0, true), hind: true, far: true },
      { top: [70, 24 + bob], paw: legAt(78, 0, false), hind: false, far: false },
      { top: [-72, 16 + bob], paw: legAt(-80, Math.PI, true), hind: true, far: false },
    ],
    tailBase: [-108, -30 + bob],
  };
}

function pawSide(ctx: Ctx, x: number, y: number, col: string, seed: number, s = 1) {
  blob(ctx, [[x - 18 * s, y - 14 * s], [x + 12 * s, y - 16 * s], [x + 26 * s, y - 6 * s], [x + 24 * s, y + 4 * s], [x - 18 * s, y + 4 * s]], seed, 0.7);
  paint(ctx, col, C.ink, 4.5);
  inkLine(ctx, [[x + 4 * s, y - 7 * s], [x + 6 * s, y + 2 * s]], seed + 1, 2);
  inkLine(ctx, [[x + 14 * s, y - 7 * s], [x + 16 * s, y + 2 * s]], seed + 2, 2);
}

function sideLeg(ctx: Ctx, l: Leg, p: DogPose, seed: number) {
  const c = pal(p);
  const fur = l.far ? c.furSh : c.fur;
  let pts: Pt[];
  let widths: number[];
  if (l.mode === "fwd") {
    pts = [l.top, lerp2(l.top, l.paw, 0.5), [l.paw[0] - 10, l.paw[1] - 8]];
    widths = [42, 32, 28];
  } else if (l.hind) {
    // thigh → stifle (forward) → hock (back) → paw
    const stifle: Pt = [l.top[0] + 20 + (l.paw[0] - l.top[0]) * 0.2, l.top[1] + 58];
    const hock: Pt = [l.paw[0] - 18, l.paw[1] - 48];
    pts = [l.top, stifle, hock, [l.paw[0] - 2, l.paw[1] - 8]];
    widths = [66, 42, 26, 24];
  } else {
    const elbow: Pt = [l.top[0] - 6 + (l.paw[0] - l.top[0]) * 0.3, l.top[1] + 62];
    const wrist: Pt = [l.paw[0] - 2, l.paw[1] - 32];
    pts = [l.top, elbow, wrist, [l.paw[0], l.paw[1] - 8]];
    widths = [44, 32, 25, 25];
  }
  blob(ctx, tubePts(pts, widths, true, false), seed + 1, 1);
  paint(ctx, fur, C.ink, 5);
  if (!l.far && !l.hind && l.mode !== "fwd") inkLine(ctx, [[pts[2][0] + 6, pts[2][1] - 4], [pts[2][0] + 12, pts[2][1] + 2]], seed + 5, 2, c.furSh);
  pawSide(ctx, l.paw[0], l.paw[1], l.far ? c.furSh : c.muzzle, seed + 2);
}

function sideTail(ctx: Ctx, base: Pt, p: DogPose, seed: number, onGround = false) {
  const c = pal(p);
  const t = p.tail ?? 0.2;
  const wag = Math.sin(p.wag ?? 0) * (p.wagAmt ?? 0);
  const pts: Pt[] = [base];
  let a = onGround ? Math.PI - 0.15 + wag * 0.3 : Math.PI + 0.35 - t * 1.15 + wag * 0.55;
  let x = base[0],
    y = base[1];
  for (let i = 1; i <= 5; i++) {
    a += onGround ? -0.12 + wag * 0.05 : (t > 0 ? 0.16 : -0.06) + wag * 0.08;
    x += Math.cos(a) * 19;
    y += Math.sin(a) * 19;
    pts.push([x, y]);
  }
  const outline = tubePts(pts, [28, 30, 28, 24, 17, 8], true, true);
  // a couple of feathery tufts near the tip
  const n = outline.length;
  const tufts: Pt[] = [];
  outline.forEach((q, i) => {
    tufts.push(q);
    if (i === Math.floor(n * 0.62) || i === Math.floor(n * 0.78)) tufts.push([q[0] + (hash(seed + i) - 0.5) * 10, q[1] + 9]);
  });
  shaded(ctx, () => blob(ctx, tufts, seed + 1, 0.9), c.fur, () => {
    oval(ctx, x, y, 28, 26, seed + 2, 1);
    paint(ctx, c.patch, null);
  }, C.ink, 5);
}

function sideHead(ctx: Ctx, p: DogPose, seed: number) {
  const c = pal(p);
  const young = p.young ?? 0;
  const ears = p.ears ?? 0.4;
  const muzzleLen = 56 - young * 16;
  // far ear peeks over the skull
  ctx.save();
  ctx.translate(-12, -50);
  ctx.rotate(-0.55 - ears * 0.4);
  blob(ctx, [[0, 0], [24, -8], [30, 30], [10, 46], [-8, 26]], seed + 1, 1);
  paint(ctx, DOG.patchDk, C.ink, 4.5);
  ctx.restore();
  // skull + scruffy cheek
  const skull: Pt[] = furry(
    [[-48, -10], [-40, -42], [-10, -58], [26, -54], [50, -34], [60, -12], [56, 20], [30, 40], [-10, 46], [-42, 30]],
    9,
    seed + 2,
    1,
    (i) => i < 1 || i > 5,
  );
  const muzzle: Pt[] = [[30, -14], [30 + muzzleLen * 0.7, -18], [30 + muzzleLen, -6], [32 + muzzleLen, 16], [30 + muzzleLen * 0.7, 30], [26, 32]];
  shaded(ctx, () => blob(ctx, skull, seed + 3, 1.1), c.fur, () => {
    oval(ctx, 30, -22, 26, 22, seed + 4, 1.2, 0.2);
    paint(ctx, DOG.eyePatch, null);
    oval(ctx, -26, 22, 30, 24, seed + 5, 1);
    paint(ctx, c.furSh, null);
  }, C.ink, 5.5);
  shaded(ctx, () => blob(ctx, muzzle, seed + 6, 1), c.muzzle, () => {
    if (young < 0.5) {
      ctx.strokeStyle = DOG.grey;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 9; i++) {
        const gx = 40 + hash(seed + i) * muzzleLen * 0.9,
          gy = -6 + hash(seed + i * 2) * 30;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 4, gy + 6);
        ctx.stroke();
      }
    }
  }, C.ink, 5);
  noseShape(ctx, 30 + muzzleLen + 2, -8, 13, seed + 7);
  const m = p.mouth ?? "closed";
  const mx = 30 + muzzleLen;
  if (m === "open" || m === "pant" || m === "whine") {
    blob(ctx, [[mx - 6, 16], [mx - 34, 20], [mx - 44, 30], [mx - 30, 42], [mx - 6, 34]], seed + 8, 0.8);
    paint(ctx, "#5e2a2c", C.ink, 4);
    if (m === "pant") {
      blob(ctx, [[mx - 30, 30], [mx - 10, 30], [mx - 6, 58], [mx - 20, 64], [mx - 30, 52]], seed + 9, 0.8);
      paint(ctx, DOG.tongue, C.ink, 3.5);
    }
  } else if (m === "lick") {
    inkLine(ctx, [[mx - 4, 20], [mx - 24, 24], [mx - 40, 20]], seed + 8, 3.5);
    blob(ctx, [[mx - 8, 20], [mx + 10, 22], [mx + 18, 36], [mx + 4, 42], [mx - 8, 32]], seed + 9, 0.8);
    paint(ctx, DOG.tongue, C.ink, 3.5);
  } else {
    inkLine(ctx, [[mx - 4, 20], [mx - 22, 25], [mx - 38, 22], [mx - 44, 16]], seed + 8, 3.5);
  }
  dogEye(ctx, 34, -22, 10 + young * 4, p, seed + 10);
  dogBrow(ctx, 28, -42, 10, p, seed + 11, -1);
  // near ear: floppy, hangs from the top of the skull
  ctx.save();
  ctx.translate(-6, -50);
  ctx.rotate(0.25 - ears * 0.9);
  const ear: Pt[] = [[-12, -2], [16, -6], [24, 30], [14, 66 - ears * 20], [-6, 70 - ears * 24], [-18, 34]];
  shaded(ctx, () => blob(ctx, ear, seed + 12, 1), c.patch, () => {
    blob(ctx, [[8, 40], [24, 30], [20, 72], [0, 80]], seed + 13, 1);
    paint(ctx, DOG.patchDk, null);
  }, C.ink, 5);
  ctx.restore();
  if (p.wet) wetDrips(ctx, [[-30, 40], [10, 46], [50, 34]], p, seed + 20);
}

/** Collar wrapped around the neck: a curved band across the neck tube, tag on the throat side. */
function collarSide(ctx: Ctx, base: Pt, top: Pt, t: number, halfW: number, seed: number) {
  const dx = top[0] - base[0],
    dy = top[1] - base[1];
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l,
    uy = dy / l; // along the neck
  const px = -uy,
    py = ux; // across (toward the throat)
  const c = lerp2(base, top, t);
  const P = (a: number, b: number): Pt => [c[0] + ux * a + px * b, c[1] + uy * a + py * b];
  const band: Pt[] = [P(-10, -halfW), P(-6, 0), P(-11, halfW), P(9, halfW), P(13, 0), P(8, -halfW)];
  blob(ctx, band, seed, 0.6);
  paint(ctx, DOG.collar, C.ink, 4);
  const ring = P(-2, halfW + 2);
  oval(ctx, ring[0], ring[1], 5, 5, seed + 1, 0.3);
  paint(ctx, null, "#8a7a3a", 2.4);
  blob(ctx, [[ring[0] - 9, ring[1] + 4], [ring[0] + 9, ring[1] + 4], [ring[0] + 10, ring[1] + 20], [ring[0] - 10, ring[1] + 20]], seed + 2, 0.6);
  paint(ctx, DOG.tag, C.ink, 3);
}

function wetDrips(ctx: Ctx, at: Pt[], p: DogPose, seed: number) {
  const w = p.wet ?? 0;
  ctx.save();
  ctx.globalAlpha *= w;
  at.forEach(([x, y], i) => {
    const k = (hash(seed + i) * 3 + (p.walk ?? 0) * 0.3 + (p.breathe ?? 0)) % 1;
    oval(ctx, x, y + k * 26, 4, 6, seed + i, 0.4);
    paint(ctx, "rgba(200,230,255,0.9)", null);
  });
  ctx.restore();
}

function drawSide(ctx: Ctx, p: DogPose, seed: number) {
  const pose = p.pose ?? "stand";
  if (pose === "flop") return drawFlop(ctx, p, seed);
  if (pose === "curl") return drawCurl(ctx, p, seed);
  const c = pal(p);
  const rig = sideRig(p);
  const young = p.young ?? 0;
  // legs first (the body overlaps their tops), far ones in shade
  rig.legs.forEach((l, i) => {
    if (l.far) sideLeg(ctx, l, p, seed + 10 + i * 7);
  });
  if (!rig.tailOnGround) sideTail(ctx, rig.tailBase, p, seed + 40);
  rig.legs.forEach((l, i) => {
    if (!l.far) sideLeg(ctx, l, p, seed + 10 + i * 7);
  });
  if (rig.tailOnGround) sideTail(ctx, rig.tailBase, p, seed + 40, true);
  // neck goes under the body so the chest swallows its base
  const neckTop: Pt = [rig.head[0] - 16, rig.head[1] + 12];
  const neckBase2: Pt = [rig.neckBase[0] - 14, rig.neckBase[1] + 26];
  const neck = furry(tubePts([neckBase2, lerp2(neckBase2, neckTop, 0.5), neckTop], [104, 82, 70], false, false), 6, seed + 62, 2);
  shaded(ctx, () => blob(ctx, neck, seed + 63, 1), c.fur, () => {
    const th = lerp2(neckBase2, neckTop, 0.45);
    oval(ctx, th[0] + 30, th[1] + 8, 18, 40, seed + 64, 1, 0.5);
    paint(ctx, "rgba(251,244,230,0.8)", null);
  }, C.ink, 5.5);
  const body = furry(rig.body.map(([x, y]) => [x * (1 - young * 0.2), y]) as Pt[], 7, seed + 50, 1);
  shaded(ctx, () => blob(ctx, body, seed + 51, 1.2), c.fur, () => {
    // caramel saddle along the back, heart spot on the hip, shaded belly
    const top = Math.min(...rig.body.map((q) => q[1]));
    blob(ctx, [[-130, top + 34], [-110, top - 10], [0, top - 14], [56, top - 6], [44, top + 30], [-30, top + 40], [-100, top + 58]], seed + 52, 1.5);
    paint(ctx, c.patch, null);
    heartSpot(ctx, -74, top + 58, 13, seed + 53);
    const bot = Math.max(...rig.body.map((q) => q[1]));
    blob(ctx, [[-120, bot - 26], [0, bot - 18], [120, bot - 26], [120, bot + 40], [-120, bot + 40]], seed + 54, 1);
    paint(ctx, c.furSh, null);
    if (p.shaved) {
      oval(ctx, 74, bot - 50, 28, 24, seed + 55, 1);
      paint(ctx, "#f2c9b4", null);
      inkLine(ctx, [[58, bot - 60], [90, bot - 42]], seed + 56, 2.4, "#7a3a3a");
      for (let i = 0; i < 4; i++) inkLine(ctx, [[62 + i * 8, bot - 64 + i * 5], [66 + i * 8, bot - 52 + i * 5]], seed + 57 + i, 2, "#7a3a3a");
    }
  }, C.ink, 5.5);
  if (rig.thigh) {
    const th = rig.thigh;
    pawSide(ctx, th.paw[0], th.paw[1], c.muzzle, seed + 58);
    shaded(ctx, () => oval(ctx, th.c[0], th.c[1], th.rx, th.ry, seed + 59, 1.3, th.rot), c.fur, () => {
      oval(ctx, th.c[0] - 10, th.c[1] - 20, th.rx * 0.8, th.ry * 0.6, seed + 60, 1, th.rot);
      paint(ctx, c.patch, null);
      heartSpot(ctx, th.c[0] - 4, th.c[1] - 16, 12, seed + 61);
    }, C.ink, 5);
  }
  // fluffy chest ruff where the neck meets the body
  blob(ctx, furry([[rig.neckBase[0] + 4, rig.neckBase[1] - 6], [rig.neckBase[0] + 34, rig.neckBase[1] + 4], [rig.neckBase[0] + 36, rig.neckBase[1] + 40], [rig.neckBase[0] + 8, rig.neckBase[1] + 50]], 6, seed + 66, 1), seed + 67, 1);
  paint(ctx, c.fur, null);
  if (p.collar !== false) collarSide(ctx, neckBase2, neckTop, 0.62, 37, seed + 65);
  ctx.save();
  ctx.translate(rig.head[0], rig.head[1]);
  ctx.rotate(rig.headRot);
  const hs = 1 + young * 0.18;
  ctx.scale(hs, hs);
  if (p.cone) coneSide(ctx, seed + 95, false);
  sideHead(ctx, p, seed + 70);
  if (p.mouth === "toy") bunnyToy(ctx, 70, 34, 0.55, 0.5, seed + 90);
  if (p.mouth === "leash") {
    curve(ctx, [[64, 26], [40, 70], [-10, 110], [-40, 170]], seed + 91, 1);
    paint(ctx, null, "#c0392b", 7);
  }
  if (p.cone) coneSide(ctx, seed + 95, true);
  ctx.restore();
}

function heartSpot(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  blob(ctx, [[x, y + r * 0.2], [x - r * 0.5, y - r * 0.4], [x - r, y - r * 0.2], [x - r * 0.9, y + r * 0.4], [x, y + r * 1.1], [x + r * 0.9, y + r * 0.4], [x + r, y - r * 0.2], [x + r * 0.5, y - r * 0.4]], seed, 0.6);
  paint(ctx, DOG.patchDk, null);
}

/** e-collar from the side: a translucent cone opening forward around the head */
function coneSide(ctx: Ctx, seed: number, front: boolean) {
  const pts: Pt[] = [[-40, -54], [-30, 50], [120, 120], [150, -140]];
  ctx.save();
  if (!front) {
    blob(ctx, pts, seed, 1.2);
    paint(ctx, "rgba(225,236,244,0.55)", null);
  } else {
    curve(ctx, [[150, -140], [174, -10], [120, 120]], seed + 1, 1);
    paint(ctx, null, "#6b7a86", 5);
    curve(ctx, [[-40, -54], [150, -140]], seed + 2, 1);
    paint(ctx, null, "#6b7a86", 4);
    curve(ctx, [[-30, 50], [120, 120]], seed + 3, 1);
    paint(ctx, null, "#6b7a86", 4);
  }
  ctx.restore();
}

/** collapsed / asleep on its side: belly toward camera, legs out */
function drawFlop(ctx: Ctx, p: DogPose, seed: number) {
  const c = pal(p);
  const breath = Math.sin((p.breathe ?? 0) * Math.PI * 2) * 3;
  // far legs
  for (const [hx, px] of [[60, 120], [-60, -10]] as [number, number][]) {
    blob(ctx, tubePts([[hx, 70], [lerp2([hx, 70], [px, 130], 0.5)[0], 104], [px + 30, 134]], [34, 28, 24]), seed + hx, 1);
    paint(ctx, c.furSh, C.ink, 4.5);
  }
  sideTail(ctx, [-110, 60], { ...p, tail: -0.2 }, seed + 40, true);
  const body = furry([[100, 20], [104, 70], [60, 104], [0, 110 + breath], [-60, 104], [-112, 80], [-122, 40], [-96, 10], [0, 4], [60, 6]], 7, seed + 50, 1);
  shaded(ctx, () => blob(ctx, body, seed + 51, 1.2), c.fur, () => {
    blob(ctx, [[-120, 30], [-90, 0], [40, -4], [70, 24], [-40, 34]], seed + 52, 1.4);
    paint(ctx, c.patch, null);
    heartSpot(ctx, -76, 44, 12, seed + 53);
    blob(ctx, [[-60, 90], [60, 92], [60, 140], [-60, 140]], seed + 54, 1);
    paint(ctx, c.furSh, null);
  }, C.ink, 5.5);
  // near legs stretched out toward the bottom
  for (const [hx, px] of [[70, 150], [-50, 30]] as [number, number][]) {
    blob(ctx, tubePts([[hx, 90], [(hx + px) / 2, 120], [px + 30, 146]], [40, 32, 26]), seed + hx + 5, 1);
    paint(ctx, c.fur, C.ink, 5);
    oval(ctx, px + 40, 148, 20, 13, seed + hx + 6, 0.8, 0.3);
    paint(ctx, c.muzzle, C.ink, 4);
  }
  // head lying on the ground
  ctx.save();
  ctx.translate(150, 60);
  ctx.rotate(0.12 + (p.headTilt ?? 0));
  if (p.cone) coneSide(ctx, seed + 95, false);
  sideHead(ctx, { ...p, ears: 0.1 }, seed + 70);
  if (p.cone) coneSide(ctx, seed + 95, true);
  ctx.restore();
  if (p.collar !== false) collarSide(ctx, [96, 50], [150, 60], 0.35, 40, seed + 64);
}

/** curled up asleep (seen from the side/above): a fluffy doughnut with the head tucked to the tail */
function drawCurl(ctx: Ctx, p: DogPose, seed: number) {
  const c = pal(p);
  const breath = Math.sin((p.breathe ?? 0) * Math.PI * 2) * 3;
  const body = furry([[-130, 40], [-120, -20], [-60, -60 - breath], [20, -66 - breath], [90, -46], [130, 0], [120, 50], [40, 64], [-60, 64]], 8, seed + 1, 1);
  shaded(ctx, () => blob(ctx, body, seed + 2, 1.3), c.fur, () => {
    blob(ctx, [[-120, 0], [-60, -64], [30, -70], [60, -40], [-20, -26], [-90, 10]], seed + 3, 1.4);
    paint(ctx, c.patch, null);
    heartSpot(ctx, -40, -40, 13, seed + 4);
    blob(ctx, [[-100, 40], [100, 40], [100, 80], [-100, 80]], seed + 5, 1);
    paint(ctx, c.furSh, null);
  }, C.ink, 5.5);
  // tail wrapped around the front
  const tail = furry(tubePts([[-110, 40], [-60, 62], [0, 66], [50, 56]], [30, 26, 20, 12], true, true), 5, seed + 6, 3);
  blob(ctx, tail, seed + 7, 1);
  paint(ctx, c.fur, C.ink, 5);
  // head resting on the tail, eyes shut
  ctx.save();
  ctx.translate(70, 10);
  ctx.rotate(0.16);
  ctx.scale(0.88, 0.88);
  sideHead(ctx, { ...p, eyes: p.eyes ?? "shut", ears: 0.05, mouth: "closed" }, seed + 70);
  ctx.restore();
}

// ---------------------------------------------------------------- FRONT VIEW
function frontEar(ctx: Ctx, side: number, p: DogPose, c: ReturnType<typeof pal>, seed: number, fx: number) {
  const young = p.young ?? 0;
  const ears = p.ears ?? 0.35;
  const torn = side === 1 && young < 0.5;
  ctx.save();
  ctx.translate(side * (74 + young * 6) + fx * 0.25, -70 - young * 4);
  // droopy ears fall along the cheeks; perked ones lift and flare out
  ctx.rotate(side * (-0.12 - ears * 0.75));
  const len = 1 - young * 0.25 - ears * 0.25;
  const ear: Pt[] = torn
    ? [[-16, -4], [18, -10], [38, 28], [40, 70 * len], [30, 96 * len], [20, 86 * len], [10, 100 * len], [-6, 92 * len], [-12, 50 * len]]
    : [[-16, -4], [18, -10], [38, 28], [40, 70 * len], [24, 100 * len], [-2, 96 * len], [-12, 50 * len]];
  const pts = ear.map(([x, y]) => [x * side, y] as Pt);
  shaded(ctx, () => blob(ctx, pts, seed, 1), c.patch, () => {
    blob(ctx, [[18 * side, 20], [44 * side, 30], [40 * side, 110], [10 * side, 110]], seed + 3, 1);
    paint(ctx, DOG.patchDk, null);
  }, C.ink, 5);
  inkLine(ctx, [[2 * side, 10], [10 * side, 50 * len], [8 * side, 80 * len]], seed + 5, 2.2, DOG.patchDk);
  ctx.restore();
}

function frontHead(ctx: Ctx, p: DogPose, seed: number) {
  const c = pal(p);
  const young = p.young ?? 0;
  const turn = p.headTurn ?? 0;
  const fx = turn * 22;
  const eyeR = 15 + young * 6;
  // skull with scruffy cheeks
  const w = 92 + young * 8,
    hgt = 84 + young * 8;
  const skull = furry(
    [[-w, -10], [-w * 0.82, -hgt * 0.7], [-w * 0.4, -hgt], [0, -hgt * 1.04], [w * 0.4, -hgt], [w * 0.82, -hgt * 0.7], [w, -10], [w * 1.04, 34], [w * 0.72, 72], [w * 0.3, 90], [-w * 0.3, 90], [-w * 0.72, 72], [-w * 1.04, 34]],
    10,
    seed + 5,
    1,
    (i) => i >= 1 && i <= 4,
  );
  shaded(ctx, () => blob(ctx, skull, seed + 6, 1.1), c.fur, () => {
    oval(ctx, -44 + fx, -14, 40, 36, seed + 7, 1.3, -0.2);
    paint(ctx, DOG.eyePatch, null);
    blob(ctx, [[-14 + fx, -96], [14 + fx, -96], [22 + fx, -20], [-22 + fx, -20]], seed + 8, 1);
    paint(ctx, c.muzzle, null);
    oval(ctx, 74, 54, 40, 34, seed + 9, 1);
    paint(ctx, c.furSh, null);
  }, C.ink, 5.5);
  // muzzle
  const mz: Pt[] = [[-44 + fx, 22], [-30 + fx, -6], [30 + fx, -6], [44 + fx, 22], [36 + fx, 62], [0 + fx, 74], [-36 + fx, 62]];
  shaded(ctx, () => blob(ctx, mz, seed + 10, 1), c.muzzle, () => {
    if (young < 0.5) {
      ctx.strokeStyle = DOG.grey;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 12; i++) {
        const gx = -36 + hash(seed + i) * 72 + fx,
          gy = 30 + hash(seed + i * 2) * 36;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (gx > fx ? 5 : -5), gy + 5);
        ctx.stroke();
      }
    }
  }, C.ink, 4.5);
  noseShape(ctx, fx * 1.1, 12, 18 - young * 3, seed + 11);
  const m = p.mouth ?? "closed";
  const mx = fx * 1.1;
  inkLine(ctx, [[mx, 24], [mx, 38]], seed + 12, 3.5);
  if (m === "open" || m === "pant" || m === "whine") {
    blob(ctx, [[mx - 24, 40], [mx, 36], [mx + 24, 40], [mx + 14, 62], [mx - 14, 62]], seed + 13, 0.8);
    paint(ctx, "#5e2a2c", C.ink, 4);
    if (m === "pant") {
      blob(ctx, [[mx - 14, 48], [mx + 14, 48], [mx + 16, 82], [mx, 92], [mx - 16, 82]], seed + 14, 0.8);
      paint(ctx, DOG.tongue, C.ink, 3.5);
      inkLine(ctx, [[mx, 54], [mx, 80]], seed + 15, 2, "#c2525e");
    }
  } else if (m === "lick") {
    inkLine(ctx, [[mx - 24, 36], [mx - 12, 44], [mx, 38], [mx + 12, 44], [mx + 24, 36]], seed + 13, 3.5);
    blob(ctx, [[mx + 2, 42], [mx + 22, 44], [mx + 26, 66], [mx + 10, 70], [mx + 2, 56]], seed + 14, 0.8);
    paint(ctx, DOG.tongue, C.ink, 3.5);
  } else {
    inkLine(ctx, [[mx - 22, 40], [mx - 10, 46], [mx, 40], [mx + 10, 46], [mx + 22, 40]], seed + 13, 3.5);
  }
  dogEye(ctx, -44 + fx, -16, eyeR, p, seed + 20, -1);
  dogEye(ctx, 44 + fx, -16, eyeR, p, seed + 21, 1);
  dogBrow(ctx, -40 + fx, -48, 12, p, seed + 22, -1);
  dogBrow(ctx, 40 + fx, -48, 12, p, seed + 23, 1);
  // floppy ears hang over the sides of the head (the dog's left ear — screen right — is torn)
  frontEar(ctx, -1, p, c, seed + 30, fx);
  frontEar(ctx, 1, p, c, seed + 40, fx);
  // the bunny dangles from the mouth by one ear
  if (p.mouth === "toy") bunnyToy(ctx, mx + 20, 98, 0.62, 0.22, seed + 90);
  if (p.wet) wetDrips(ctx, [[-60, 80], [0, 92], [60, 80]], p, seed + 50);
}

function frontCollar(ctx: Ctx, y: number, w: number, seed: number) {
  blob(ctx, [[-w, y - 8], [0, y + 4], [w, y - 8], [w, y + 10], [0, y + 22], [-w, y + 10]], seed, 0.8);
  paint(ctx, DOG.collar, C.ink, 4);
  oval(ctx, 0, y + 24, 5, 5, seed + 1, 0.3);
  paint(ctx, null, "#8a7a3a", 2.4);
  // bone-shaped tag
  blob(ctx, [[-16, y + 30], [-6, y + 34], [6, y + 34], [16, y + 30], [18, y + 44], [6, y + 41], [-6, y + 41], [-18, y + 44]], seed + 2, 0.6);
  paint(ctx, DOG.tag, C.ink, 3);
}

/** e-collar seen from the front: the head sits inside a big translucent ring */
function coneFront(ctx: Ctx, seed: number, front: boolean) {
  if (!front) {
    oval(ctx, 0, -6, 186, 168, seed, 1.4);
    paint(ctx, "rgba(226,236,244,0.55)", null);
    oval(ctx, 0, 70, 76, 46, seed + 1, 1);
    paint(ctx, "rgba(160,176,190,0.35)", null);
  } else {
    oval(ctx, 0, -6, 186, 168, seed, 1.4);
    paint(ctx, null, "#6b7a86", 6);
    oval(ctx, 0, -6, 172, 154, seed + 2, 1.4);
    paint(ctx, null, "rgba(255,255,255,0.7)", 3);
  }
}

function drawFront(ctx: Ctx, p: DogPose, seed: number) {
  const c = pal(p);
  const pose = p.pose ?? "lie";
  const young = p.young ?? 0;
  const breath = Math.sin((p.breathe ?? 0) * Math.PI * 2) * 3;
  const up = p.headUp ?? 0;
  const wag = Math.sin(p.wag ?? 0) * (p.wagAmt ?? 0);
  const headAt = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.headTilt ?? 0);
    ctx.scale(1 + young * 0.15, 1 + young * 0.15);
    if (p.cone) coneFront(ctx, seed + 95, false);
    frontHead(ctx, p, seed + 70);
    if (p.cone) coneFront(ctx, seed + 95, true);
    ctx.restore();
  };
  if (pose === "head") {
    headAt(0, 0);
    return;
  }
  if (pose === "sit") {
    // tail curled on the floor beside the body
    const tail = furry(tubePts([[60, 262], [118, 270 + wag * 6], [156, 244 - wag * 18], [166, 212 - wag * 30]], [26, 22, 16, 10], true, true), 5, seed + 1, 3);
    blob(ctx, tail, seed + 2, 1);
    paint(ctx, c.fur, C.ink, 5);
    // body + haunches behind the chest
    blob(ctx, furry([[-96, 120], [-80, 40], [80, 40], [96, 120], [110, 250], [-110, 250]], 8, seed + 3, 1), seed + 4, 1.2);
    paint(ctx, c.furSh, C.ink, 5.5);
    for (const side of [-1, 1]) {
      shaded(ctx, () => oval(ctx, side * 86, 222, 50, 52, seed + 5 + side, 1.3), c.fur, () => {
        oval(ctx, side * 96, 200, 30, 30, seed + 7 + side, 1);
        paint(ctx, c.patch, null);
      }, C.ink, 5);
      oval(ctx, side * 106, 270, 32, 16, seed + 9 + side, 0.8);
      paint(ctx, c.muzzle, C.ink, 4.5);
    }
    // front legs
    for (const side of [-1, 1]) {
      blob(ctx, tubePts([[side * 38, 130], [side * 40, 210], [side * 40, 262]], [42, 34, 32], true, false), seed + 10 + side, 1);
      paint(ctx, c.fur, C.ink, 5);
      blob(ctx, [[side * 40 - 22, 252], [side * 40 + 22, 252], [side * 40 + 26, 276], [side * 40 - 26, 276]], seed + 12 + side, 0.8);
      paint(ctx, c.muzzle, C.ink, 4.5);
      inkLine(ctx, [[side * 40 - 7, 262], [side * 40 - 7, 274]], seed + 14 + side, 2);
      inkLine(ctx, [[side * 40 + 7, 262], [side * 40 + 7, 274]], seed + 16 + side, 2);
    }
    // fluffy chest bib over the tops of the legs
    const bib = furry([[-62, 50], [62, 50], [72, 110], [44, 168], [0, 186], [-44, 168], [-72, 110]], 9, seed + 18, 1);
    shaded(ctx, () => blob(ctx, bib, seed + 19, 1.1), c.fur, () => {
      blob(ctx, [[-30, 60], [30, 60], [36, 150], [0, 176], [-36, 150]], seed + 20, 1);
      paint(ctx, c.muzzle, null);
    }, C.ink, 5);
    if (p.collar !== false) frontCollar(ctx, 62, 64, seed + 21);
    headAt(0, -26 + breath * 0.3);
    return;
  }
  // lie: chin on paws (up=0) … head raised (up=1). Body is a mound behind.
  const tail = furry(tubePts([[96, 70], [154, 60 + wag * 10], [198, 40 - wag * 26], [216, 12 - wag * 40]], [26, 22, 16, 10], true, true), 5, seed + 1, 3);
  blob(ctx, tail, seed + 2, 1);
  paint(ctx, c.fur, C.ink, 5);
  const mound = furry([[-150, 110], [-140, 30], [-90, -30 - breath], [0, -44 - breath], [90, -30 - breath], [140, 30], [150, 110]], 8, seed + 3, 1);
  shaded(ctx, () => blob(ctx, mound, seed + 4, 1.2), c.fur, () => {
    blob(ctx, [[-60, -40], [60, -44], [110, 0], [0, 10], [-110, 0]], seed + 5, 1.4);
    paint(ctx, c.patch, null);
    heartSpot(ctx, 76, 2, 14, seed + 6);
    blob(ctx, [[60, 20], [150, 20], [150, 120], [60, 120]], seed + 7, 1);
    paint(ctx, c.furSh, null);
  }, C.ink, 5.5);
  for (const side of [-1, 1]) {
    oval(ctx, side * 128, 100, 34, 18, seed + 8 + side, 0.8);
    paint(ctx, c.muzzle, C.ink, 4.5);
  }
  blob(ctx, furry([[-80, 40], [80, 40], [90, 110], [-90, 110]], 8, seed + 10, 1), seed + 11, 1);
  paint(ctx, c.fur, C.ink, 5);
  if (p.collar !== false && up > 0.3) frontCollar(ctx, 30 - up * 6, 66, seed + 20);
  headAt(0, 30 - up * 70 + breath * 0.3);
  // front paws in front of the chin
  for (const side of [-1, 1]) {
    const px = side * 50,
      py = 118;
    blob(ctx, [[px - 34, py - 22], [px + 34, py - 22], [px + 40, py + 10], [px + 30, py + 22], [px - 30, py + 22], [px - 40, py + 10]], seed + 30 + side, 0.9);
    paint(ctx, c.muzzle, C.ink, 5);
    for (const tx of [-12, 0, 12]) inkLine(ctx, [[px + tx, py + 6], [px + tx, py + 20]], seed + 33 + side + tx, 2.2);
  }
  if (p.shaved) {
    oval(ctx, -6, 80, 26, 14, seed + 40, 1);
    paint(ctx, "#f2c9b4", C.ink, 2.5);
    inkLine(ctx, [[-24, 80], [12, 80]], seed + 41, 2.4, "#7a3a3a");
    for (let i = 0; i < 4; i++) inkLine(ctx, [[-18 + i * 9, 74], [-18 + i * 9, 86]], seed + 42 + i, 1.8, "#7a3a3a");
  }
}

// ---------------------------------------------------------------- public
/** Draw 豆豆 at (x, y): side view → body centre (paws reach y + 160·s); front view → head centre. */
export function drawDog(ctx: Ctx, x: number, y: number, s: number, p: DogPose = {}) {
  const seed = p.seed ?? 1700;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if ((p.view ?? "side") === "front") drawFront(ctx, p, seed);
  else drawSide(ctx, p, seed);
  ctx.restore();
}

/** Simple fluffy "pretty" pet-shop puppies (background characters). */
export function fluffPuppy(ctx: Ctx, x: number, y: number, s: number, kind: 0 | 1 | 2, abs: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const cols = [["#fbfaf6", "#e9e4da"], ["#f2c27a", "#d9a35a"], ["#3b3540", "#2a252e"]][kind];
  const hop = Math.abs(Math.sin(abs * 5 + seed)) * 10;
  ctx.translate(0, -hop);
  const body = furry([[-70, 10], [-60, -50], [0, -64], [60, -50], [70, 10], [40, 50], [-40, 50]], 12, seed, 1);
  blob(ctx, body, seed + 1, 1.5);
  paint(ctx, cols[0], C.ink, 5);
  const head = furry([[-56, -40], [-50, -100], [0, -120], [50, -100], [56, -40], [0, -20]], 12, seed + 2, 1);
  blob(ctx, head, seed + 3, 1.5);
  paint(ctx, cols[0], C.ink, 5);
  for (const side of [-1, 1]) {
    blob(ctx, [[side * 30, -110], [side * 58, -130], [side * 56, -88]], seed + 4 + side, 1);
    paint(ctx, cols[1], C.ink, 4);
    oval(ctx, side * 20, -74, 9, 10, seed + 6 + side, 0.5);
    paint(ctx, C.ink, null);
    oval(ctx, side * 20 - 3, -78, 3.5, 3.5, seed + 8 + side, 0.3);
    paint(ctx, "#fff", null);
  }
  oval(ctx, 0, -56, 8, 6, seed + 10, 0.4);
  paint(ctx, C.ink, null);
  if (kind !== 2) {
    // a ribbon bow
    blob(ctx, [[-16, -26], [0, -20], [16, -26], [16, -12], [0, -18], [-16, -12]], seed + 11, 0.6);
    paint(ctx, "#ff7fb0", C.ink, 3);
  }
  ctx.restore();
}

/** X-ray of the chest with the heart highlighted (for the vet's light box). Draw in a w×h box. */
export function xray(ctx: Ctx, x: number, y: number, w: number, h: number, abs: number, glow = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#0e1a22";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(220,240,255,0.85)";
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  // spine
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.3);
  ctx.quadraticCurveTo(w * 0.5, h * 0.18, w * 0.92, h * 0.32);
  ctx.stroke();
  // ribs
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const rx = w * (0.3 + i * 0.06);
    ctx.beginPath();
    ctx.moveTo(rx, h * 0.24);
    ctx.quadraticCurveTo(rx - w * 0.06, h * 0.55, rx + w * 0.02, h * 0.78);
    ctx.stroke();
  }
  // heart, pulsing, with a red ring
  const beat = 1 + 0.06 * Math.max(0, Math.sin(abs * 9));
  ctx.save();
  ctx.translate(w * 0.5, h * 0.56);
  ctx.scale(beat, beat);
  ctx.fillStyle = "rgba(255,120,120,0.55)";
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.1, h * 0.14, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = glow;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.56, w * 0.17, h * 0.22, 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export { rotPt };
